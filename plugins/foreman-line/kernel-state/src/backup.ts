/**
 * Online backup/checkpoint verification and retention (FK-P9).
 *
 * Contract level only (INF-8, RS-2.2): a backup is a self-consistent copy of
 * the committed state at one committed-transaction boundary, taken under the
 * storage write lock so no write interleaves. Integrity = `quick_check` on the
 * produced file plus the backup-bytes digest and schema-version gate recorded
 * in the `BackupManifest`; `verifyBackup` repeats them independently of the
 * producing process. The protected destination lies outside the live storage
 * root and is created via temp file + atomic rename (no partial file
 * survives). Retention: a ratified descriptor supplied by operator policy —
 * no descriptor means `pruneBackups` deletes nothing (OQ-2, fail-closed).
 * No process-boundary recovery proof and no RPO/RTO objective is claimed.
 */
import {
  chmodSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { API_VERSION, digestBytes, digestDocument, STORAGE_DIGEST_DOMAINS } from './canonical.js'
import type { Clock } from './clock.js'
import { driverCodeOf, StorageError, storageError } from './errors.js'
import {
  type ConnectFn,
  type DriverConnection,
  type RetentionDescriptor,
  realConnect,
  type VerifyResult,
  verifyStorage,
} from './open.js'
import { checkTarget, formRefusalReason } from './path-guard.js'
import {
  ARTIFACT_LOCATOR_MAX_BYTES,
  isRecord,
  requireBoundedText,
  requireSafeInt,
} from './schema.js'
import { assertOpen, type Storage } from './transactions.js'

/** The produced backup plus its manifest (both written atomically). */
export interface BackupManifestProvenance {
  createdAtMicros: number
  exporterToolVersion: string
  sourceDatabaseBytesDigest: string
}

export interface BackupManifest {
  schemaVersion: number
  backupBytesDigest: string
  backupManifestDigest: string
  provenance: BackupManifestProvenance
}

/**
 * Fault-injectable copy seam (`FULL-03`): the default sink drives the driver's
 * online backup into the temp file; tests inject bounded/failing sinks.
 */
export type BackupSink = (driver: DriverConnection, tempPath: string) => Promise<void>

/** Optional test seams for `backupTo` (additive; the public contract is two args). */
export interface BackupOptions {
  sink?: BackupSink
  connect?: ConnectFn
}

const MANIFEST_SUFFIX = '.manifest.json'
const EXPORTER_TOOL_VERSION = API_VERSION

function manifestPathFor(backupPath: string): string {
  return `${backupPath}${MANIFEST_SUFFIX}`
}

function sha256FileBytes(path: string): string {
  const bytes = readFileSync(path)
  return digestBytes(new Uint8Array(bytes))
}

function withinRoot(candidate: string, root: string): boolean {
  const normalizedCandidate = candidate.split('\\').join('/').toLowerCase()
  const normalizedRoot = root.split('\\').join('/').toLowerCase()
  return (
    normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`)
  )
}

function defaultSink(driver: DriverConnection, tempPath: string): Promise<void> {
  const backupFn = (driver as { backupTo?: (path: string) => Promise<unknown> }).backupTo
  if (typeof backupFn !== 'function') {
    return Promise.reject(storageError('BACKUP_FAILED', { driverCode: 'os-error' }))
  }
  return backupFn.call(driver, tempPath).then(
    () => undefined,
    (error: unknown) => {
      if (error instanceof StorageError) throw error
      const code = driverCodeOf(error)
      if (code === 'SQLITE_FULL') {
        throw storageError('BACKUP_FAILED', { driverCode: 'SQLITE_FULL' })
      }
      throw storageError('BACKUP_FAILED', { driverCode: 'os-error' })
    },
  )
}

/**
 * Protected-destination rules: the destination is a well-formed relative
 * descriptor under the configured backup root; it must lie OUTSIDE the live
 * storage root and must not be the live database file or its WAL/SHM siblings.
 */
function checkBackupDestination(storage: Storage, destination: string): string {
  if (formRefusalReason(destination) !== null) {
    const reason = formRefusalReason(destination)
    throw storageError('BACKUP_DESTINATION_REFUSED', {
      reasonCode: reason ?? 'traversal',
    })
  }
  const rootAbs = resolve(storage.backupRoot)
  const checked = checkTarget({
    rootAbs,
    relative: destination,
    expectAbsent: true,
    code: 'BACKUP_DESTINATION_REFUSED',
  })
  const resolvedTarget = resolve(checked.absPath)
  const livePath = resolve(storage.absPath)
  const storageRootDir = resolve(livePath, '..')
  if (withinRoot(resolvedTarget, storageRootDir)) {
    throw storageError('BACKUP_DESTINATION_REFUSED', { reasonCode: 'outside-root' })
  }
  if (resolvedTarget.toLowerCase() === livePath.toLowerCase()) {
    throw storageError('BACKUP_DESTINATION_REFUSED', { reasonCode: 'outside-root' })
  }
  if (
    resolvedTarget.toLowerCase() === `${livePath.toLowerCase()}-wal` ||
    resolvedTarget.toLowerCase() === `${livePath.toLowerCase()}-shm`
  ) {
    throw storageError('BACKUP_DESTINATION_REFUSED', { reasonCode: 'outside-root' })
  }
  return resolvedTarget
}

function writeAtomically(targetPath: string, bytes: Buffer, tempSuffix: string): void {
  const tempPath = `${targetPath}${tempSuffix}`
  writeFileSync(tempPath, bytes)
  try {
    chmodSync(tempPath, 0o600)
  } catch {
    // Owner-only permissions are best-effort where the platform supports them.
  }
  renameSync(tempPath, targetPath)
}

function deleteQuietly(path: string): void {
  try {
    unlinkSync(path)
  } catch {
    // Cleanup is best-effort; no partial file is ever renamed into place.
  }
}

function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function readManifest(manifestPath: string): BackupManifest | null {
  let text: string
  try {
    text = readFileSync(manifestPath, 'utf8')
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (!isRecord(parsed) || !isRecord(parsed.provenance)) return null
  const provenance = parsed.provenance
  const manifest: BackupManifest = {
    schemaVersion: parsed.schemaVersion as number,
    backupBytesDigest: parsed.backupBytesDigest as string,
    backupManifestDigest: parsed.backupManifestDigest as string,
    provenance: {
      createdAtMicros: provenance.createdAtMicros as number,
      exporterToolVersion: provenance.exporterToolVersion as string,
      sourceDatabaseBytesDigest: provenance.sourceDatabaseBytesDigest as string,
    },
  }
  if (
    typeof manifest.schemaVersion !== 'number' ||
    typeof manifest.backupBytesDigest !== 'string' ||
    typeof manifest.backupManifestDigest !== 'string' ||
    typeof manifest.provenance.createdAtMicros !== 'number' ||
    typeof manifest.provenance.exporterToolVersion !== 'string' ||
    typeof manifest.provenance.sourceDatabaseBytesDigest !== 'string'
  ) {
    return null
  }
  return manifest
}

function manifestDigestOf(schemaVersion: number, backupBytesDigest: string): string {
  return digestDocument(STORAGE_DIGEST_DOMAINS.backupManifest, { schemaVersion, backupBytesDigest })
}

/**
 * Post-copy checks on the produced file: integrity only (`quick_check` /
 * `integrity_check`) plus the schema version it carries. The packaged-version
 * gate is `verifyBackup`'s contract ("a backup newer than the packaged maximum
 * refuses exactly like STORAGE_SCHEMA_AHEAD"), not the copy's.
 */
function inspectBackupFile(path: string): { schemaVersion: number } {
  let driver: DriverConnection
  try {
    driver = realConnect(path, { readonly: true })
  } catch {
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
  try {
    const quick = driver.pragma('quick_check')
    const integrity = driver.pragma('integrity_check')
    const verdicts = [quick, integrity]
    for (const verdict of verdicts) {
      const rows = Array.isArray(verdict) ? verdict : []
      const values = rows.flatMap((row) => Object.values(row as Record<string, unknown>))
      if (!values.includes('ok')) throw storageError('BACKUP_INTEGRITY_FAILED', {})
    }
    const row = driver.prepare('SELECT max(version) AS v FROM schema_migrations').get()
    if (row !== null && typeof row === 'object' && 'v' in row && typeof row.v === 'number') {
      return { schemaVersion: row.v }
    }
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  } finally {
    try {
      driver.close()
    } catch {
      // Best-effort close.
    }
  }
}

/**
 * Online backup under the storage write lock: a dedicated lock connection
 * holds `BEGIN IMMEDIATE` across the copy so no write can interleave — the
 * backup boundary is exactly a committed-transaction boundary. Produces the
 * backup file + `BackupManifest`; any failure leaves no partial file
 * (`BACKUP_FAILED` / `BACKUP_INTEGRITY_FAILED`).
 */
export async function backupTo(
  storage: Storage,
  destination: string,
  options: BackupOptions = {},
): Promise<BackupManifest> {
  assertOpen(storage)
  requireBoundedText(destination, 'destination', ARTIFACT_LOCATOR_MAX_BYTES)
  const targetPath = checkBackupDestination(storage, destination)
  const tempPath = `${targetPath}.tmp`
  const manifestTempSuffix = '.tmp'
  const sink = options.sink ?? defaultSink

  const lockDriver = (options.connect ?? realConnect)(storage.absPath, { readonly: false })
  try {
    lockDriver.pragma(`busy_timeout=${Math.ceil(storage.busyTimeoutMicros / 1000)}`)
  } catch {
    // Best-effort budget; the BEGIN below maps exhaustion to LOCK_TIMEOUT.
  }
  try {
    lockDriver.exec('BEGIN IMMEDIATE')
  } catch (error) {
    try {
      lockDriver.close()
    } catch {
      // Best-effort close.
    }
    const code = driverCodeOf(error)
    if (code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED') {
      throw storageError('STORAGE_LOCK_TIMEOUT', { timeoutMicros: storage.busyTimeoutMicros })
    }
    throw storageError('BACKUP_FAILED', { driverCode: 'os-error' })
  }
  try {
    await sink(storage.driver as DriverConnection, tempPath)
    lockDriver.exec('COMMIT')
  } catch (error) {
    try {
      lockDriver.exec('ROLLBACK')
    } catch {
      // Best-effort rollback of the lock transaction.
    }
    deleteQuietly(tempPath)
    if (error instanceof StorageError) throw error
    throw storageError('BACKUP_FAILED', { driverCode: 'os-error' })
  } finally {
    try {
      lockDriver.close()
    } catch {
      // Best-effort close.
    }
  }

  try {
    // Integrity gate on the produced copy (independent of the copy seam).
    const inspected = inspectBackupFile(tempPath)
    const backupBytesDigest = sha256FileBytes(tempPath)
    const manifest: BackupManifest = {
      schemaVersion: inspected.schemaVersion,
      backupBytesDigest,
      backupManifestDigest: manifestDigestOf(inspected.schemaVersion, backupBytesDigest),
      provenance: {
        createdAtMicros: storage.clock.nowMicros(),
        exporterToolVersion: EXPORTER_TOOL_VERSION,
        sourceDatabaseBytesDigest: sha256FileBytes(storage.absPath),
      },
    }
    const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    writeAtomically(targetPath, readFileSync(tempPath), manifestTempSuffix)
    deleteQuietly(tempPath)
    writeAtomically(manifestPathFor(targetPath), manifestBytes, manifestTempSuffix)
    return manifest
  } catch (error) {
    deleteQuietly(tempPath)
    deleteQuietly(targetPath)
    deleteQuietly(manifestPathFor(targetPath))
    if (error instanceof StorageError) throw error
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
}

/** Result of `verifyBackup` (typed; refusals throw). */
export interface VerifyBackupResult {
  schemaVersion: number
  backupBytesDigest: string
  backupManifestDigest: string
}

/**
 * Open a backup read-only and repeat the integrity gates independently of the
 * producing process: `quick_check`/`integrity_check`, manifest digest check
 * (recomputed and bound to the file bytes), and the schema-version gate — a
 * backup newer than the packaged maximum refuses exactly like
 * `STORAGE_SCHEMA_AHEAD`.
 */
export function verifyBackup(path: string): VerifyBackupResult {
  if (typeof path !== 'string' || path.length === 0) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'path' })
  }
  const backupPath = resolve(path)
  const manifestPath = manifestPathFor(backupPath)
  // Path gate for the backup path itself (links and non-regular targets refuse).
  checkTarget({
    rootAbs: resolve(backupPath, '..'),
    relative: backupPath.split(/[\\/]/).pop() ?? '',
    code: 'STORAGE_PATH_REFUSED',
  })
  const manifest = readManifest(manifestPath)
  if (manifest === null) throw storageError('BACKUP_INTEGRITY_FAILED', {})
  const actualBytesDigest = sha256FileBytes(backupPath)
  if (actualBytesDigest !== manifest.backupBytesDigest) {
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
  if (
    manifestDigestOf(manifest.schemaVersion, manifest.backupBytesDigest) !==
    manifest.backupManifestDigest
  ) {
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
  let verify: VerifyResult
  try {
    verify = verifyStorage(backupPath)
  } catch (error) {
    if (error instanceof StorageError && error.code === 'STORAGE_SCHEMA_AHEAD') throw error
    if (error instanceof StorageError && error.code === 'STORAGE_MIGRATION_DRIFT') throw error
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
  if (verify.schemaVersion !== manifest.schemaVersion) {
    throw storageError('BACKUP_INTEGRITY_FAILED', {})
  }
  return {
    schemaVersion: manifest.schemaVersion,
    backupBytesDigest: manifest.backupBytesDigest,
    backupManifestDigest: manifest.backupManifestDigest,
  }
}

/** Retention policy input for `pruneBackups` (OQ-2: operator-supplied). */
export interface PrunePolicy {
  backupRoot: string
  descriptor: RetentionDescriptor | null
  clock: Clock
}

/**
 * Delete only manifest-carrying backups matching a ratified retention
 * descriptor (beyond `maxCount`, oldest first, or older than `maxAgeMicros`).
 * With no descriptor this deletes nothing (fail-closed).
 */
export function pruneBackups(policy: PrunePolicy): number {
  const descriptor = policy.descriptor
  if (descriptor === null) return 0
  requireSafeInt(descriptor.maxCount, 'descriptor.maxCount')
  requireSafeInt(descriptor.maxAgeMicros, 'descriptor.maxAgeMicros')
  const rootAbs = resolve(policy.backupRoot)
  let entries: string[]
  try {
    entries = readdirSync(rootAbs)
  } catch {
    return 0
  }
  interface Candidate {
    backupPath: string
    manifestPath: string
    createdAtMicros: number
  }
  const candidates: Candidate[] = []
  for (const entry of entries) {
    if (!entry.endsWith(MANIFEST_SUFFIX)) continue
    const manifestPath = `${rootAbs}/${entry}`
    const backupPath = `${rootAbs}/${entry.slice(0, -MANIFEST_SUFFIX.length)}`
    const manifest = readManifest(manifestPath)
    if (manifest === null) continue
    if (!fileExists(backupPath)) continue
    if (sha256FileBytes(backupPath) !== manifest.backupBytesDigest) continue
    candidates.push({
      backupPath,
      manifestPath,
      createdAtMicros: manifest.provenance.createdAtMicros,
    })
  }
  candidates.sort((a, b) => b.createdAtMicros - a.createdAtMicros)
  const nowMicros = policy.clock.nowMicros()
  let deleted = 0
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i] as Candidate
    const beyondCount = i >= descriptor.maxCount
    const beyondAge = nowMicros - candidate.createdAtMicros > descriptor.maxAgeMicros
    if (beyondCount || beyondAge) {
      deleteQuietly(candidate.manifestPath)
      deleteQuietly(candidate.backupPath)
      deleted += 1
    }
  }
  return deleted
}

export type { DriverConnection }
export { manifestPathFor as backupManifestPathFor }
