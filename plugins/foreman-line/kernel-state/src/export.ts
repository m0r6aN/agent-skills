/**
 * Deterministic storage export (FK-P9). `exportStorage` returns
 * `{ exportDocument, storageExportDigest, provenance }`.
 *
 * `storageExportDigest` preimage: UTF-8 bytes of canonical JSON
 * `{domain: "foreman-line.kernel-state.storage-export", apiVersion: "0.1.0",
 * payload: <export payload>}` under the F05.5 byte rules, emitted `sha256:` +
 * 64 lowercase hex. Provenance is excluded from the preimage (FK-P1
 * excluded-transport-fields pattern) and returned separately.
 *
 * Determinism invariant: two exports of the same logical database state are
 * byte-identical regardless of row insertion order, page layout,
 * checkpoint/VACUUM history, live clock reads, or in-memory member order.
 * The export is write-only-side (import and projection are FK-P11).
 */
import { readFileSync } from 'node:fs'
import {
  API_VERSION,
  canonicalBytes,
  canonicalEncode,
  digestBytes,
  digestDocument,
  STORAGE_DIGEST_DOMAINS,
} from './canonical.js'
import { StorageError, storageError } from './errors.js'
import { SUBSTRATE_TABLES, type SubstrateTable, TABLE_KEY_TUPLES } from './schema.js'
import { assertOpen, type Storage } from './transactions.js'

/** One export row: column name to JSON-safe column value. */
export interface ExportRow {
  [column: string]: string | number | null
}

/** The hashed export payload. */
export interface ExportPayload {
  schemaVersion: number
  migrationHistoryDigest: string
  tables: Record<SubstrateTable, ExportRow[]>
}

/** The export document (its canonical bytes are the digest preimage). */
export interface ExportDocument {
  domain: typeof STORAGE_DIGEST_DOMAINS.storageExport
  apiVersion: string
  payload: ExportPayload
}

/** Excluded-transport provenance (never enters the digest preimage). */
export interface ExportProvenance {
  exportedAtMicros: number
  exporterToolVersion: string
  sourceDatabaseBytesDigest: string
}

export interface StorageExport {
  exportDocument: ExportDocument
  storageExportDigest: string
  provenance: ExportProvenance
}

/**
 * Fault-injectable output seam (`FULL-04`): receives the serialized export
 * document; a bounded/capped sink faults with `EXPORT_FAILED`.
 */
export type ExportSink = (documentJson: string) => void

export interface ExportOptions {
  sink?: ExportSink
}

function toExportRow(row: unknown): ExportRow {
  if (row === null || typeof row !== 'object' || Array.isArray(row)) {
    throw storageError('EXPORT_FAILED', {})
  }
  const out: ExportRow = {}
  for (const [column, value] of Object.entries(row)) {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
      out[column] = value
    } else if (value instanceof Uint8Array) {
      // BLOB columns (A1d `recorded_result`) serialize as base64 strings —
      // deterministic and schema-compatible (ColumnRow: string).
      out[column] = Buffer.from(value).toString('base64')
    } else {
      throw storageError('EXPORT_FAILED', {})
    }
  }
  return out
}

/**
 * Rows in ascending order of the canonical JSON encoding of the row's key
 * tuple (UTF-16 code-unit order), per the export contract.
 */
function sortRowsByKeyTuple(rows: ExportRow[], keyTuple: readonly string[]): ExportRow[] {
  return rows.slice().sort((a, b) => {
    const keyA = canonicalEncode(keyTuple.map((column) => a[column] ?? null))
    const keyB = canonicalEncode(keyTuple.map((column) => b[column] ?? null))
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
  })
}

/**
 * Deterministic export of the whole substrate. Everything except the
 * `STORAGE_CLOSED`/`STORAGE_ARGUMENT_INVALID` boundary codes is typed as
 * `EXPORT_FAILED` (bounded reads and sink faults).
 */
export function exportStorage(storage: Storage, options: ExportOptions = {}): StorageExport {
  assertOpen(storage)
  try {
    const rawTables = storage.driver
      .prepare('SELECT version, name, digest FROM schema_migrations ORDER BY version ASC')
      .all()
    const historyTriples = rawTables.map((row) => {
      const record = toExportRow(row)
      return [record.version ?? null, record.name ?? null, record.digest ?? null]
    })
    const migrationHistoryDigest = digestBytes(canonicalBytes(historyTriples))
    const schemaVersion = historyTriples.reduce((max, triple) => {
      const version = triple[0]
      return typeof version === 'number' && version > max ? version : max
    }, 0)

    const tables = {} as Record<SubstrateTable, ExportRow[]>
    for (const table of SUBSTRATE_TABLES) {
      const rows = storage.driver.prepare(`SELECT * FROM ${table}`).all().map(toExportRow)
      tables[table] = sortRowsByKeyTuple(rows, TABLE_KEY_TUPLES[table])
    }

    const payload: ExportPayload = { schemaVersion, migrationHistoryDigest, tables }
    const exportDocument: ExportDocument = {
      domain: STORAGE_DIGEST_DOMAINS.storageExport,
      apiVersion: API_VERSION,
      payload,
    }
    const storageExportDigest = digestBytes(canonicalBytes(exportDocument))

    const provenance: ExportProvenance = {
      exportedAtMicros: storage.clock.nowMicros(),
      exporterToolVersion: API_VERSION,
      sourceDatabaseBytesDigest: digestBytes(new Uint8Array(readFileSync(storage.absPath))),
    }

    if (options.sink !== undefined) {
      options.sink(canonicalEncode(exportDocument))
    }
    return { exportDocument, storageExportDigest, provenance }
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw storageError('EXPORT_FAILED', {})
  }
}

/** `storageExportDigest` for a given export payload document (consumer/test helper). */
export function storageExportDigestOf(payload: unknown): string {
  return digestDocument(STORAGE_DIGEST_DOMAINS.storageExport, payload)
}
