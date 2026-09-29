/**
 * T4/T3/T2 — the one-time digest/commit-bound legacy import.
 *
 * `runImport` executes the documented import failure precedence inside ONE
 * `withTransaction` (structural → corpus-manifest consistency → limits →
 * lineage membership → digest match → approval-evidenced-ness → field-conflict
 * (DIVERGENCE_STOP) → epoch) and then writes: goals rows at `revision = 1`
 * (the CAS baseline; legacy revisions are provenance-only), one
 * `import.recorded` event per row, evidence-index `artifacts` rows, the two
 * projection cursors at 0, one `import.epoch` event + one `artifacts` epoch
 * row. A crash at any point rolls back to fully-absent (WAL); a rerun
 * completes exactly once.
 *
 * Zero `transitions`, zero `leases`, zero `idempotency_keys` rows are ever
 * written and no FK-P10 engine operation is ever called (T3 rule 5). The
 * injected `Clock` is the only time source (no ambient time).
 *
 * Field-conflict sub-order (first-failure, per goal group in document order):
 * the T5 table order — status → ratification-fact → human-gate-fact → revision
 * → lease → pending-transition → wakeup-handoff → idempotency →
 * existing-state-collision. Goals imported by a recorded epoch of the SAME
 * lineage root are exempt from vs-recorded checks (F-7): re-import of an
 * imported lineage is the epoch's refusal (`IMPORT_EPOCH_EXISTS`), and
 * `existing-state-collision` protects against ALIEN pre-existing goals only.
 */
import {
  ARTIFACT_LOCATOR_MAX_BYTES,
  type Clock,
  type EventRow,
  type GoalRow,
  type IdempotencyKeyRow,
  insertArtifact,
  insertEvent,
  insertGoal,
  getGoal,
  getIdempotencyKey,
  getTransition,
  getUnreleasedLease,
  queryEvents,
  type Storage,
  type TransitionRow,
  withTransaction,
} from '@foreman-line/kernel-state'
import { canonicalEncode, digestDocument, digestText } from './canonical.js'
import { FK_P11_PROJECTION_IDS, setProjectionCursor } from './cursors.js'
import {
  type ImportError,
  importError,
  isHarnessFailure,
  isImportError,
  isStorageClassFault,
  rethrowSubstrate,
} from './errors.js'
import {
  type ApprovalClaim,
  type ImportDocument,
  IMPORT_DIGEST_DOMAINS,
  IMPORT_MAX_ROWS,
  CORPUS_MAX_ITEMS,
  ROW_REF_ARRAY_MAX,
  SOURCE_PATH_MAX_BYTES,
  GIT_IDENTITY_MAX_BYTES,
  CORPUS_REASON_MAX_BYTES,
  type LegacyGoalRecord,
  type OperationalFacts,
  parseImportDocument,
  type RatificationRef,
  type SourceProvenance,
} from './import-document.js'
import {
  createLineageGateway,
  type LineageGateway,
  type SourceLineageReader,
} from './lineage.js'

/** FK-P11-owned event kinds (A1e-registered; T8). */
export const IMPORT_RECORDED_KIND = 'import.recorded'
export const IMPORT_EPOCH_KIND = 'import.epoch'

/** FK-P11-owned `artifacts.kind` vocabulary (*(P11/P21)* per FK-P9). */
export const ARTIFACT_KIND_EPOCH = 'import.epoch'
export const ARTIFACT_KIND_APPROVAL = 'import.approval'
export const ARTIFACT_KIND_RATIFICATION_REF = 'import.ratification-ref'

/** Substrate event payload cap (FK-P9 enforced; prechecked as a named bound). */
export const EVENT_PAYLOAD_MAX_BYTES = 65_536

/** The single recorded cutover epoch (T4/T8 `import.epoch` payload). */
export interface EpochRecord {
  epochId: string
  rootCommit: string
  tipCommit: string
  documentDigest: string
  corpusDigest: string
  corpusSourceRevision: string
  rowCount: number
  principalRef: string
  operationId: string
  toolVersion: string
  recordedAtMicros: number
}

/** The importer handle (T9). The clock is a constructor seam — never a param. */
export interface Importer {
  readonly storage: Storage
  readonly clock: Clock
  readonly toolVersion: string
  readonly gateway: LineageGateway
}

export interface ImportResult {
  epoch: EpochRecord
  importedGoalIds: string[]
  recordedEventSeqs: number[]
}

/** Claims carried by one `import.recorded` payload (projection/divergence reads). */
export interface ImportedGoalClaims {
  goalId: string
  importedStatus: string
  source: SourceProvenance
  claimedRatificationRefs: RatificationRef[]
  claimedApprovals: ApprovalClaim[]
  claimedOperationalFacts: OperationalFacts
  epochId: string
}

const TOOL_VERSION_RE = /^[\x21-\x7e]{1,128}$/
const ROW_ID_RE = /^[A-Za-z0-9._:-]{1,128}$/

/** T9 constructor. `toolVersion` is stamped into events/epoch (never a request param). */
export function createImporter(options: {
  storage: Storage
  clock: Clock
  toolVersion: string
  lineageReader: SourceLineageReader
}): Importer {
  if (typeof options.toolVersion !== 'string' || !TOOL_VERSION_RE.test(options.toolVersion)) {
    throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath: 'toolVersion' })
  }
  return {
    storage: options.storage,
    clock: options.clock,
    toolVersion: options.toolVersion,
    gateway: createLineageGateway(options.lineageReader),
  }
}

function requireRequestId(value: unknown, fieldPath: string): string {
  if (typeof value !== 'string' || !ROW_ID_RE.test(value)) {
    throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath })
  }
  return value
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length
}

/** Corpus digest (F-2): rows' SourceProvenance tuples sorted by canonical key order. */
export function corpusDigestOf(rows: readonly LegacyGoalRecord[]): string {
  const tuples = rows.map((row) => row.source)
  tuples.sort((a, b) => {
    const keyA = `${a.sourcePath}\u0000${a.sourceCommit}\u0000${a.sourceDigest}`
    const keyB = `${b.sourcePath}\u0000${b.sourceCommit}\u0000${b.sourceDigest}`
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
  })
  return digestDocument(IMPORT_DIGEST_DOMAINS.corpus, tuples)
}

/** The ImportDocument's canonical-JSON digest (domain-bound; T4). */
export function documentDigestOf(document: ImportDocument): string {
  return digestDocument(IMPORT_DIGEST_DOMAINS.importDocument, document)
}

function epochIdFor(rootCommit: string): string {
  return `imp-epoch-${rootCommit}`
}

// --- event-stream reads (FK-P9 exposes point reads + queryEvents only) -------

/** Every event in `event_seq` order, paged (the only enumerable stream). */
export function readAllEvents(storage: Storage): EventRow[] {
  const collected: EventRow[] = []
  let afterSeq = 0
  for (;;) {
    let page: EventRow[]
    try {
      page = queryEvents(storage, { afterSeq, limit: 512 })
    } catch (value) {
      rethrowSubstrate(value)
    }
    if (page.length === 0) return collected
    for (const row of page) collected.push(row)
    afterSeq = page[page.length - 1]?.eventSeq ?? afterSeq
    if (page.length < 512) return collected
  }
}

/** Canonical-strict payload decode (T6 rule 3 discipline over stored payloads). */
function decodeCanonicalPayload(payload: string, field: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
  }
  try {
    if (canonicalEncode(parsed) !== payload) {
      throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
    }
  } catch (value) {
    // Non-canonical bytes or unpaired surrogate at decode (PRJ-04/07): refuse.
    if (isImportError(value)) throw value
    throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
  }
  return parsed as Record<string, unknown>
}

function normalizeEpochPayload(payload: Record<string, unknown>): EpochRecord {
  const members = [
    'epochId',
    'rootCommit',
    'tipCommit',
    'documentDigest',
    'corpusDigest',
    'corpusSourceRevision',
    'rowCount',
    'principalRef',
    'operationId',
    'toolVersion',
    'recordedAtMicros',
  ]
  for (const member of members) {
    const value = payload[member]
    const ok =
      member === 'rowCount' || member === 'recordedAtMicros'
        ? typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
        : member === 'toolVersion'
          ? typeof value === 'string' && TOOL_VERSION_RE.test(value)
          : typeof value === 'string' && ROW_ID_RE.test(value)
    if (!ok) throw importError('PROJECTION_STATE_INVALID', {})
  }
  return {
    epochId: payload.epochId as string,
    rootCommit: payload.rootCommit as string,
    tipCommit: payload.tipCommit as string,
    documentDigest: payload.documentDigest as string,
    corpusDigest: payload.corpusDigest as string,
    corpusSourceRevision: payload.corpusSourceRevision as string,
    rowCount: payload.rowCount as number,
    principalRef: payload.principalRef as string,
    operationId: payload.operationId as string,
    toolVersion: payload.toolVersion as string,
    recordedAtMicros: payload.recordedAtMicros as number,
  }
}

/** Every recorded epoch in event order (per-lineage; OQ-7 allows several). */
export function readEpochRecords(storage: Storage): EpochRecord[] {
  const epochs: EpochRecord[] = []
  for (const event of readAllEvents(storage)) {
    if (event.kind !== IMPORT_EPOCH_KIND) continue
    epochs.push(normalizeEpochPayload(decodeCanonicalPayload(event.payload, 'events.payload')))
  }
  return epochs
}

/** Claims of every `import.recorded` event (projection/divergence derivation). */
export function readImportedGoalClaims(storage: Storage): ImportedGoalClaims[] {
  const claims: ImportedGoalClaims[] = []
  for (const event of readAllEvents(storage)) {
    if (event.kind !== IMPORT_RECORDED_KIND) continue
    const payload = decodeCanonicalPayload(event.payload, 'events.payload')
    const source = payload.source
    const facts = payload.claimedOperationalFacts
    if (
      typeof payload.goalId !== 'string' ||
      typeof payload.importedStatus !== 'string' ||
      typeof payload.epochId !== 'string' ||
      source === null ||
      typeof source !== 'object' ||
      Array.isArray(source) ||
      facts === null ||
      typeof facts !== 'object' ||
      Array.isArray(facts) ||
      !Array.isArray(payload.claimedRatificationRefs) ||
      !Array.isArray(payload.claimedApprovals)
    ) {
      throw importError('PROJECTION_STATE_INVALID', {})
    }
    claims.push({
      goalId: payload.goalId,
      importedStatus: payload.importedStatus,
      source: source as SourceProvenance,
      claimedRatificationRefs: payload.claimedRatificationRefs as RatificationRef[],
      claimedApprovals: payload.claimedApprovals as ApprovalClaim[],
      claimedOperationalFacts: facts as OperationalFacts,
      epochId: payload.epochId,
    })
  }
  return claims
}

// --- phase 2: corpus-manifest consistency ------------------------------------

function corpusConsistencyPhase(document: ImportDocument): void {
  const seenPaths: Record<string, true> = {}
  for (const [index, item] of document.corpusManifest.items.entries()) {
    if (seenPaths[item.sourcePath] === true) {
      throw importError('IMPORT_ARGUMENT_INVALID', {
        fieldPath: `corpusManifest.items[${index}].sourcePath`,
      })
    }
    seenPaths[item.sourcePath] = true
  }
  const itemByPath = new Map<string, (typeof document.corpusManifest.items)[number]>()
  for (const item of document.corpusManifest.items) itemByPath.set(item.sourcePath, item)
  for (const [index, row] of document.rows.entries()) {
    const item = itemByPath.get(row.source.sourcePath)
    if (item === undefined || item.disposition !== 'import') {
      throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath: `rows[${index}].source.sourcePath` })
    }
  }
}

// --- phase 3: named limits ----------------------------------------------------

function limitsPhase(document: ImportDocument, plan: ImportPlan): void {
  const payloadBytes = (payload: string, field: string): void => {
    if (utf8Length(payload) > EVENT_PAYLOAD_MAX_BYTES) {
      throw importError('IMPORT_LIMIT_EXCEEDED', { field, bound: EVENT_PAYLOAD_MAX_BYTES })
    }
  }
  const locatorBytes = (locator: string): void => {
    if (utf8Length(locator) > ARTIFACT_LOCATOR_MAX_BYTES) {
      throw importError('IMPORT_LIMIT_EXCEEDED', {
        field: 'locator',
        bound: ARTIFACT_LOCATOR_MAX_BYTES,
      })
    }
  }
  if (document.rows.length > IMPORT_MAX_ROWS) {
    throw importError('IMPORT_LIMIT_EXCEEDED', { field: 'rows', bound: IMPORT_MAX_ROWS })
  }
  if (document.corpusManifest.items.length > CORPUS_MAX_ITEMS) {
    throw importError('IMPORT_LIMIT_EXCEEDED', {
      field: 'corpusManifest.items',
      bound: CORPUS_MAX_ITEMS,
    })
  }
  const pathBytes = (path: string, field: string): void => {
    if (utf8Length(path) > SOURCE_PATH_MAX_BYTES) {
      throw importError('IMPORT_LIMIT_EXCEEDED', { field, bound: SOURCE_PATH_MAX_BYTES })
    }
  }
  const identityBytes = (identity: string, field: string): void => {
    if (utf8Length(identity) > GIT_IDENTITY_MAX_BYTES) {
      throw importError('IMPORT_LIMIT_EXCEEDED', { field, bound: GIT_IDENTITY_MAX_BYTES })
    }
  }
  for (const item of document.corpusManifest.items) {
    pathBytes(item.sourcePath, 'corpusManifest.items.sourcePath')
    if (utf8Length(item.reason) > CORPUS_REASON_MAX_BYTES) {
      throw importError('IMPORT_LIMIT_EXCEEDED', {
        field: 'corpusManifest.items.reason',
        bound: CORPUS_REASON_MAX_BYTES,
      })
    }
  }
  for (const [index, row] of document.rows.entries()) {
    if (row.claimedRatificationRefs.length > ROW_REF_ARRAY_MAX) {
      throw importError('IMPORT_LIMIT_EXCEEDED', {
        field: `rows[${index}].claimedRatificationRefs`,
        bound: ROW_REF_ARRAY_MAX,
      })
    }
    if (row.claimedApprovals.length > ROW_REF_ARRAY_MAX) {
      throw importError('IMPORT_LIMIT_EXCEEDED', {
        field: `rows[${index}].claimedApprovals`,
        bound: ROW_REF_ARRAY_MAX,
      })
    }
    pathBytes(row.source.sourcePath, `rows[${index}].source.sourcePath`)
    for (const ref of row.claimedRatificationRefs) {
      pathBytes(ref.provenance.sourcePath, `rows[${index}].claimedRatificationRefs.provenance.sourcePath`)
      identityBytes(ref.gitIdentity, `rows[${index}].claimedRatificationRefs.gitIdentity`)
    }
    for (const claim of row.claimedApprovals) {
      identityBytes(claim.gitIdentity, `rows[${index}].claimedApprovals.gitIdentity`)
      if (claim.provenance !== null) {
        pathBytes(
          claim.provenance.sourcePath,
          `rows[${index}].claimedApprovals.provenance.sourcePath`,
        )
      }
    }
    const payload = plan.rowPayloads[index]
    if (payload !== undefined) payloadBytes(payload, 'eventPayload')
    for (const locator of plan.refLocators[index] ?? []) locatorBytes(locator)
    for (const locator of plan.approvalLocators[index] ?? []) locatorBytes(locator)
  }
  payloadBytes(plan.epochPayload, 'eventPayload')
  locatorBytes(plan.epochLocator)
}

// --- phase 4: lineage membership ---------------------------------------------

function lineagePhase(document: ImportDocument, gateway: LineageGateway): void {
  const { rootCommit, tipCommit } = document.sourceLineage
  if (!gateway.commitExists(rootCommit)) {
    throw importError('IMPORT_COMMIT_OUT_OF_LINEAGE', { commitId: rootCommit })
  }
  if (!gateway.commitExists(tipCommit)) {
    throw importError('IMPORT_COMMIT_OUT_OF_LINEAGE', { commitId: tipCommit })
  }
  if (!gateway.isAncestor(rootCommit, tipCommit)) {
    throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath: 'sourceLineage' })
  }
  const claimCommit = (commitId: string): void => {
    if (
      !gateway.commitExists(commitId) ||
      !gateway.commitInLineage(rootCommit, tipCommit, commitId)
    ) {
      throw importError('IMPORT_COMMIT_OUT_OF_LINEAGE', { commitId })
    }
  }
  claimCommit(document.corpusManifest.sourceRevision)
  for (const row of document.rows) {
    claimCommit(row.source.sourceCommit)
    for (const ref of row.claimedRatificationRefs) claimCommit(ref.provenance.sourceCommit)
    for (const claim of row.claimedApprovals) {
      if (claim.provenance !== null) claimCommit(claim.provenance.sourceCommit)
    }
  }
}

// --- phase 5: digest match ----------------------------------------------------

function bytesDigestOrAbsent(
  gateway: LineageGateway,
  provenance: SourceProvenance,
): { absent: true } | { absent: false; digest: string } {
  const blob = gateway.readCommittedBlob(provenance.sourceCommit, provenance.sourcePath)
  if ('absent' in blob) return { absent: true }
  return { absent: false, digest: gateway.digestOf(blob) }
}

function digestPhase(document: ImportDocument, gateway: LineageGateway): void {
  if (document.corpusDigest !== corpusDigestOf(document.rows)) {
    throw importError('IMPORT_SOURCE_DIGEST_MISMATCH', { rowId: 'document', fieldId: 'corpusDigest' })
  }
  const itemByPath = new Map<string, (typeof document.corpusManifest.items)[number]>()
  for (const item of document.corpusManifest.items) itemByPath.set(item.sourcePath, item)
  for (const row of document.rows) {
    const rowId = row.goalId
    const item = itemByPath.get(row.source.sourcePath)
    if (item !== undefined && item.sourceDigest !== row.source.sourceDigest) {
      throw importError('IMPORT_SOURCE_DIGEST_MISMATCH', { rowId, fieldId: 'source.sourceDigest' })
    }
    const sourceBytes = bytesDigestOrAbsent(gateway, row.source)
    if (sourceBytes.absent) {
      throw importError('IMPORT_SOURCE_BLOB_ABSENT', { rowId, fieldId: 'source.sourceDigest' })
    }
    if (sourceBytes.digest !== row.source.sourceDigest) {
      throw importError('IMPORT_SOURCE_DIGEST_MISMATCH', { rowId, fieldId: 'source.sourceDigest' })
    }
    for (const ref of row.claimedRatificationRefs) {
      const refBytes = bytesDigestOrAbsent(gateway, ref.provenance)
      if (refBytes.absent) {
        throw importError('IMPORT_SOURCE_BLOB_ABSENT', {
          rowId,
          fieldId: 'claimedRatificationRefs.digest',
        })
      }
      if (refBytes.digest !== ref.digest) {
        throw importError('IMPORT_SOURCE_DIGEST_MISMATCH', {
          rowId,
          fieldId: 'claimedRatificationRefs.digest',
        })
      }
    }
    for (const claim of row.claimedApprovals) {
      if (claim.provenance === null) continue
      const claimBytes = bytesDigestOrAbsent(gateway, claim.provenance)
      if (claimBytes.absent) continue
      if (claimBytes.digest !== claim.digest) {
        throw importError('IMPORT_SOURCE_DIGEST_MISMATCH', {
          rowId,
          fieldId: 'claimedApprovals.digest',
        })
      }
    }
  }
}

// --- phase 6: approval-evidenced-ness ----------------------------------------

function approvalPhase(document: ImportDocument, gateway: LineageGateway): void {
  for (const row of document.rows) {
    for (const claim of row.claimedApprovals) {
      if (claim.provenance === null) {
        throw importError('IMPORT_APPROVAL_UNEVIDENCED', {
          rowId: row.goalId,
          reason: 'provenance-absent',
        })
      }
      const claimBytes = bytesDigestOrAbsent(gateway, claim.provenance)
      if (claimBytes.absent) {
        throw importError('IMPORT_APPROVAL_UNEVIDENCED', { rowId: row.goalId, reason: 'blob-absent' })
      }
    }
    if (row.claimedStatus === 'completed' && row.claimedApprovals.length === 0) {
      throw importError('IMPORT_APPROVAL_UNEVIDENCED', {
        rowId: row.goalId,
        reason: 'claim-required-missing',
      })
    }
  }
}

// --- phase 7: field-conflict (DIVERGENCE_STOP) --------------------------------

function divergence(
  reasonCode:
    | 'status'
    | 'ratification-fact'
    | 'human-gate-fact'
    | 'revision'
    | 'lease'
    | 'pending-transition'
    | 'wakeup-handoff'
    | 'idempotency'
    | 'existing-state-collision',
  goalId: string,
  fieldId: string,
): never {
  throw importError('DIVERGENCE_STOP', { reasonCode, goalId, fieldId })
}

function conflictPhase(storage: Storage, document: ImportDocument, rootCommit: string): void {
  const sameLineageEpochIds: Record<string, true> = {}
  for (const epoch of readEpochRecords(storage)) {
    if (epoch.rootCommit === rootCommit) sameLineageEpochIds[epoch.epochId] = true
  }
  const exemptGoals: Record<string, true> = {}
  if (Object.keys(sameLineageEpochIds).length > 0) {
    for (const claims of readImportedGoalClaims(storage)) {
      if (sameLineageEpochIds[claims.epochId] === true) exemptGoals[claims.goalId] = true
    }
  }

  const groups = new Map<string, LegacyGoalRecord[]>()
  for (const row of document.rows) {
    const existing = groups.get(row.goalId)
    if (existing === undefined) groups.set(row.goalId, [row])
    else existing.push(row)
  }

  for (const [goalId, rows] of groups) {
    const exempt = exemptGoals[goalId] === true
    let recorded: GoalRow | null = null
    if (!exempt) {
      try {
        recorded = getGoal(storage, goalId)
      } catch (value) {
        rethrowSubstrate(value)
      }
    }

    // 1. status (two sources disagree)
    for (const row of rows) {
      if (row.claimedStatus !== rows[0]?.claimedStatus) {
        divergence('status', goalId, 'claimedStatus')
      }
    }
    if (recorded !== null && rows[0] !== undefined && rows[0].claimedStatus !== recorded.status) {
      divergence('status', goalId, 'claimedStatus')
    }

    // 2. ratification-fact (competing ratified bytes for one artifact)
    const ratificationDigests = new Map<string, string>()
    for (const row of rows) {
      for (const ref of row.claimedRatificationRefs) {
        const known = ratificationDigests.get(ref.gitIdentity)
        if (known !== undefined && known !== ref.digest) {
          divergence('ratification-fact', goalId, 'claimedRatificationRefs')
        }
        ratificationDigests.set(ref.gitIdentity, ref.digest)
      }
    }

    // 3. human-gate-fact (competing approval digests for one gate fact)
    const approvalDigests = new Map<string, string>()
    for (const row of rows) {
      for (const claim of row.claimedApprovals) {
        const identity = `${claim.evidenceKind}\u0000${claim.gitIdentity}`
        const known = approvalDigests.get(identity)
        if (known !== undefined && known !== claim.digest) {
          divergence('human-gate-fact', goalId, 'claimedApprovals')
        }
        approvalDigests.set(identity, claim.digest)
      }
    }

    // 4. revision (legacy assertion colliding with recorded state)
    if (recorded !== null) {
      for (const row of rows) {
        const claimed = row.claimedOperationalFacts.claimedRevision
        if (claimed !== null && claimed !== recorded.revision) {
          divergence('revision', goalId, 'claimedOperationalFacts.claimedRevision')
        }
      }
    }

    // 5. lease (competing legacy claims; or a legacy claim vs a live lease)
    const holders = new Set<string>()
    for (const row of rows) {
      const holder = row.claimedOperationalFacts.claimedLeaseHolderPrincipalRef
      if (holder === null) continue
      if (holders.size > 0 && !holders.has(holder)) {
        divergence('lease', goalId, 'claimedOperationalFacts.claimedLeaseHolderPrincipalRef')
      }
      holders.add(holder)
    }
    if (holders.size > 0 && goalHasLiveLease(storage, goalId)) {
      divergence('lease', goalId, 'claimedOperationalFacts.claimedLeaseHolderPrincipalRef')
    }

    // 6. pending-transition (competing claims; or a claim vs a recorded pending)
    const targets = new Set<string>()
    for (const row of rows) {
      const target = row.claimedOperationalFacts.claimedPendingTransitionTarget
      if (target === null) continue
      if (targets.size > 0 && !targets.has(target)) {
        divergence('pending-transition', goalId, 'claimedOperationalFacts.claimedPendingTransitionTarget')
      }
      targets.add(target)
    }
    if (recorded !== null && recorded.pendingTransitionId !== null && targets.size > 0) {
      let pending: TransitionRow | null = null
      try {
        pending = getTransition(storage, recorded.pendingTransitionId)
      } catch (value) {
        rethrowSubstrate(value)
      }
      if (pending !== null && !targets.has(pending.status)) {
        divergence('pending-transition', goalId, 'claimedOperationalFacts.claimedPendingTransitionTarget')
      }
    }

    // 7. wakeup-handoff (competing wakeup/handoff claims)
    const wakeupCounts = new Set<number>()
    const handoffCounts = new Set<number>()
    for (const row of rows) {
      const facts = row.claimedOperationalFacts
      if (facts.claimedWakeupCount !== null) {
        if (wakeupCounts.size > 0 && !wakeupCounts.has(facts.claimedWakeupCount)) {
          divergence('wakeup-handoff', goalId, 'claimedOperationalFacts.claimedWakeupCount')
        }
        wakeupCounts.add(facts.claimedWakeupCount)
      }
      if (facts.claimedHandoffCount !== null) {
        if (handoffCounts.size > 0 && !handoffCounts.has(facts.claimedHandoffCount)) {
          divergence('wakeup-handoff', goalId, 'claimedOperationalFacts.claimedHandoffCount')
        }
        handoffCounts.add(facts.claimedHandoffCount)
      }
    }

    // 8. idempotency (a legacy binding claim colliding with a recorded binding)
    for (const row of rows) {
      const binding = row.claimedOperationalFacts.claimedBinding
      if (binding === null) continue
      let recordedBinding: IdempotencyKeyRow | null = null
      try {
        recordedBinding = getIdempotencyKey(storage, binding)
      } catch (value) {
        rethrowSubstrate(value)
      }
      if (recordedBinding !== null) {
        divergence('idempotency', goalId, 'claimedOperationalFacts.claimedBinding')
      }
    }

    // 9. existing-state-collision (a row targets a goal already in the ledger)
    if (recorded !== null) {
      divergence('existing-state-collision', goalId, 'goalId')
    }
  }
}

function goalHasLiveLease(storage: Storage, goalId: string): boolean {
  try {
    return getUnreleasedLease(storage, goalId) !== null
  } catch (value) {
    rethrowSubstrate(value)
  }
}

// --- plan, writes, and the public pipeline -----------------------------------

function importRecordedPayload(
  row: LegacyGoalRecord,
  context: {
    epochId: string
    documentDigest: string
    principalRef: string
    operationId: string
    toolVersion: string
  },
): Record<string, unknown> {
  return {
    goalId: row.goalId,
    importedStatus: row.claimedStatus,
    source: row.source,
    claimedRatificationRefs: row.claimedRatificationRefs,
    claimedApprovals: row.claimedApprovals,
    claimedOperationalFacts: row.claimedOperationalFacts,
    epochId: context.epochId,
    documentDigest: context.documentDigest,
    principalRef: context.principalRef,
    operationId: context.operationId,
    toolVersion: context.toolVersion,
  }
}

interface ImportPlan {
  rowPayloads: string[]
  refLocators: string[][]
  approvalLocators: string[][]
  epochPayload: string
  epochLocator: string
}

function buildPlan(
  document: ImportDocument,
  context: {
    epochId: string
    documentDigest: string
    principalRef: string
    operationId: string
    toolVersion: string
    epochRecord: EpochRecord
  },
): ImportPlan {
  return {
    rowPayloads: document.rows.map((row) => canonicalEncode(importRecordedPayload(row, context))),
    refLocators: document.rows.map((row) =>
      row.claimedRatificationRefs.map((ref) =>
        canonicalEncode({ sourceCommit: ref.provenance.sourceCommit, sourcePath: ref.provenance.sourcePath }),
      ),
    ),
    approvalLocators: document.rows.map((row) =>
      row.claimedApprovals.map((claim) =>
        claim.provenance === null
          ? ''
          : canonicalEncode({
              sourceCommit: claim.provenance.sourceCommit,
              sourcePath: claim.provenance.sourcePath,
            }),
      ),
    ),
    epochPayload: canonicalEncode(context.epochRecord),
    epochLocator: canonicalEncode({
      rootCommit: document.sourceLineage.rootCommit,
      tipCommit: document.sourceLineage.tipCommit,
      rowCount: document.rows.length,
    }),
  }
}

function writePhase(
  storage: Storage,
  plan: ImportPlan,
  document: ImportDocument,
  epochRecord: EpochRecord,
  identities: { principalRef: string; operationId: string },
  recordedAtMicros: number,
): void {
  const root12 = document.sourceLineage.rootCommit.slice(0, 12)
  for (const [index, row] of document.rows.entries()) {
    insertGoal(storage, {
      goalId: row.goalId,
      revision: 1,
      status: row.claimedStatus,
      pendingTransitionId: null,
      updatedAtMicros: recordedAtMicros,
    })
    insertEvent(storage, {
      eventId: `impevt-${root12}-${index}`,
      goalId: row.goalId,
      kind: IMPORT_RECORDED_KIND,
      payload: plan.rowPayloads[index] ?? '',
      payloadDigest: digestText(plan.rowPayloads[index] ?? ''),
      principalRef: identities.principalRef,
      operationId: identities.operationId,
      recordedAtMicros,
    })
    const refLocators = plan.refLocators[index] ?? []
    for (const [refIndex, ref] of row.claimedRatificationRefs.entries()) {
      insertArtifact(storage, {
        artifactId: `impart-${root12}-r${index}-${refIndex}`,
        goalId: row.goalId,
        kind: ARTIFACT_KIND_RATIFICATION_REF,
        digest: ref.digest,
        locator: refLocators[refIndex] ?? '',
        recordedBy: identities.principalRef,
        recordedAtMicros,
      })
    }
    const approvalLocators = plan.approvalLocators[index] ?? []
    for (const [claimIndex, claim] of row.claimedApprovals.entries()) {
      insertArtifact(storage, {
        artifactId: `impart-${root12}-a${index}-${claimIndex}`,
        goalId: row.goalId,
        kind: ARTIFACT_KIND_APPROVAL,
        digest: claim.digest,
        locator: approvalLocators[claimIndex] ?? '',
        recordedBy: identities.principalRef,
        recordedAtMicros,
      })
    }
  }
  for (const projectionId of FK_P11_PROJECTION_IDS) {
    setProjectionCursor(storage, { projectionId, lastAppliedEventSeq: 0 })
  }
  insertEvent(storage, {
    eventId: `impepoch-${root12}`,
    goalId: document.rows[0]?.goalId ?? 'imp-epoch',
    kind: IMPORT_EPOCH_KIND,
    payload: plan.epochPayload,
    payloadDigest: digestText(plan.epochPayload),
    principalRef: identities.principalRef,
    operationId: identities.operationId,
    recordedAtMicros,
  })
  insertArtifact(storage, {
    artifactId: `impart-${root12}-epoch`,
    goalId: null,
    kind: ARTIFACT_KIND_EPOCH,
    digest: epochRecord.documentDigest,
    locator: plan.epochLocator,
    recordedBy: identities.principalRef,
    recordedAtMicros,
  })
}

// --- phase 8: epoch (the one-shot guard; last in the documented order) -------

function epochExistencePhase(storage: Storage, document: ImportDocument): void {
  const rootCommit = document.sourceLineage.rootCommit
  for (const epoch of readEpochRecords(storage)) {
    if (epoch.rootCommit === rootCommit) {
      throw importError('IMPORT_EPOCH_EXISTS', { rootCommit: epoch.rootCommit, epochId: epoch.epochId })
    }
  }
}

/**
 * T9: the one-time import. Exactly one `withTransaction`; all-or-nothing; a
 * rerun after any crash completes exactly once, and a rerun of an imported
 * lineage refuses `IMPORT_EPOCH_EXISTS` (the epoch is history).
 */
export function runImport(
  importer: Importer,
  request: { importDocument: unknown; principalRef: unknown; operationId: unknown },
): ImportResult {
  const principalRef = requireRequestId(request.principalRef, 'principalRef')
  const operationId = requireRequestId(request.operationId, 'operationId')
  let namedRefusal: unknown = null
  try {
    return withTransaction(importer.storage, (storage) => {
      try {
        const document = parseImportDocument(request.importDocument)
        const epochId = epochIdFor(document.sourceLineage.rootCommit)
        const documentDigest = documentDigestOf(document)
        const recordedAtMicros = importer.clock.nowMicros()
        const epochRecord: EpochRecord = {
          epochId,
          rootCommit: document.sourceLineage.rootCommit,
          tipCommit: document.sourceLineage.tipCommit,
          documentDigest,
          corpusDigest: document.corpusDigest,
          corpusSourceRevision: document.corpusManifest.sourceRevision,
          rowCount: document.rows.length,
          principalRef,
          operationId,
          toolVersion: importer.toolVersion,
          recordedAtMicros,
        }
        const plan = buildPlan(document, {
          epochId,
          documentDigest,
          principalRef,
          operationId,
          toolVersion: importer.toolVersion,
          epochRecord,
        })
        corpusConsistencyPhase(document)
        limitsPhase(document, plan)
        lineagePhase(document, importer.gateway)
        digestPhase(document, importer.gateway)
        approvalPhase(document, importer.gateway)
        conflictPhase(storage, document, document.sourceLineage.rootCommit)
        epochExistencePhase(storage, document)

        const eventsBefore = readAllEvents(storage)
        const maxSeqBefore = eventsBefore[eventsBefore.length - 1]?.eventSeq ?? 0
        writePhase(storage, plan, document, epochRecord, { principalRef, operationId }, recordedAtMicros)
        const recordedEventSeqs = readAllEvents(storage)
          .filter((event) => event.eventSeq > maxSeqBefore)
          .map((event) => event.eventSeq)
        return {
          epoch: epochRecord,
          importedGoalIds: document.rows.map((row) => row.goalId),
          recordedEventSeqs,
        }
      } catch (value) {
        // ERR-01..03: FK-P9's transaction wrapper maps non-StorageError faults
        // to StorageError — preserve the true cause (named refusal, HARNESS_*
        // fault, or programming fault) so nothing is ever laundered.
        if (!isStorageClassFault(value)) namedRefusal = value
        throw value
      }
    })
  } catch (value) {
    // ERR-03: a named refusal is never erased by a boundary fallback.
    if (isImportError(value)) throw value
    if (isHarnessFailure(value)) throw value
    if (namedRefusal !== null) throw namedRefusal
    rethrowSubstrate(value)
  }
}

/**
 * T9 read (keyed form, coordinator ruling 2026-09-29): the epoch recorded for
 * ONE source lineage, or `null` when that lineage never imported. A missing
 * query (`rootCommit` absent/malformed) or an ambiguous ledger (more than one
 * epoch for the root — impossible by construction) refuses.
 */
export function getEpoch(importer: Importer, query: { rootCommit: unknown }): EpochRecord | null {
  const rootCommit = requireRequestId(query.rootCommit, 'rootCommit')
  const matches = readEpochRecords(importer.storage).filter((epoch) => epoch.rootCommit === rootCommit)
  if (matches.length > 1) throw importError('PROJECTION_STATE_INVALID', {})
  return matches[0] ?? null
}

/** The full recorded epoch set (the equivalently-allowed keyed selection). */
export function getAllEpochs(importer: Importer): EpochRecord[] {
  return readEpochRecords(importer.storage)
}
