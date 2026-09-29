/**
 * T1 — closed import-document and corpus-manifest shapes (default-deny per
 * member, standing #30) plus the structural validator.
 *
 * Wire shapes follow FK-P1 F05.1: unknown fields, missing required members,
 * unknown enum values, and reserved gate literals refuse — never a default,
 * never truncation. Size bounds are enforced in the limits phase (`import.ts`),
 * NOT here, so the documented import failure precedence (structural →
 * corpus-manifest consistency → limits → lineage membership → digest match →
 * approval-evidenced-ness → field-conflict → epoch) holds with one
 * precedence-edge fixture per family.
 *
 * Shape notes (derived, recorded):
 * - `ImportDocument.corpusDigest` (F-2): REQUIRED; canonical digest over the
 *   rows' `SourceProvenance` tuples sorted by canonical key order (domain
 *   `foreman-line.kernel-import.corpus`).
 * - `ApprovalClaim.provenance` is absent-tolerant on the wire (normalized to
 *   `null`): a claim with no provenance is an EVIDENCE failure
 *   (`IMPORT_APPROVAL_UNEVIDENCED` / `provenance-absent`), never a structural
 *   one — bound by fixture FAB-01 and the T10 reason literal.
 */

import {
  GOAL_STATUSES,
  isGoalStatus,
  isReservedGateLiteral,
} from '@foreman-line/kernel-lease/src/index.ts'
import { isDigest, isId, isSafeInt } from '@foreman-line/kernel-state'
import { importError } from './errors.js'

/** CommitId shapes (OQ-6): SHA-1 and SHA-256 object formats, lowercase hex. */
export const COMMIT_ID_LENGTH_SHA1 = 40
export const COMMIT_ID_LENGTH_SHA256 = 64

/** Named bounds (T1). */
export const IMPORT_MAX_ROWS = 1024
export const CORPUS_MAX_ITEMS = 4096
export const ROW_REF_ARRAY_MAX = 64
export const SOURCE_PATH_MAX_BYTES = 4096
export const GIT_IDENTITY_MAX_BYTES = 256
export const CORPUS_REASON_MAX_BYTES = 256

/** Import document wire version. */
export const IMPORT_API_VERSION = '0.1.0'

/** F05.5 digest domains owned by this package. */
export const IMPORT_DIGEST_DOMAINS = {
  importDocument: 'foreman-line.kernel-import.import-document',
  corpus: 'foreman-line.kernel-import.corpus',
} as const

/** Closed `disposition` vocabulary (INF-7: one disposition per manifest item). */
export const CORPUS_DISPOSITIONS = ['import', 'excluded'] as const
export type CorpusDisposition = (typeof CORPUS_DISPOSITIONS)[number]

/** `evidenceKind` closed union — FK-P1 F05.4 verbatim. */
export const APPROVAL_EVIDENCE_KINDS = [
  'commit-ref',
  'signature',
  'status-check',
  'merge-record',
] as const
export type ApprovalEvidenceKind = (typeof APPROVAL_EVIDENCE_KINDS)[number]

/** Repo-relative committed-blob identity: path + digest + commit (T1). */
export interface SourceProvenance {
  sourcePath: string
  sourceDigest: string
  sourceCommit: string
}

/** A claimed ratified-bytes reference (never materialized as state; T2). */
export interface RatificationRef {
  gitIdentity: string
  digest: string
  provenance: SourceProvenance
}

/** An imported approval claim: F05.4 members verbatim + provenance (T1). */
export interface ApprovalClaim {
  evidenceKind: ApprovalEvidenceKind
  gitIdentity: string
  digest: string
  /** Absent-tolerant on the wire: `null` = provenance absent (FAB-01). */
  provenance: SourceProvenance | null
}

/** A legacy binding claim (F-5): provenance-only; never reaches idempotency_keys. */
export interface ClaimedBinding {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
}

/** Legacy operational facts — PROVENANCE-ONLY (never reach state; T2). */
export interface OperationalFacts {
  claimedRevision: number | null
  claimedLeaseHolderPrincipalRef: string | null
  claimedPendingTransitionTarget: string | null
  claimedWakeupCount: number | null
  claimedHandoffCount: number | null
  /** F-5: absent-tolerant `null`; a colliding recorded binding stops (CON-08). */
  claimedBinding: ClaimedBinding | null
}

/** One legacy goal record (T1). */
export interface LegacyGoalRecord {
  goalId: string
  claimedStatus: string
  source: SourceProvenance
  claimedRatificationRefs: RatificationRef[]
  claimedApprovals: ApprovalClaim[]
  claimedOperationalFacts: OperationalFacts
}

/** One manifest item: exact path + digest + one disposition + reason (INF-7). */
export interface CorpusItem {
  sourcePath: string
  sourceDigest: string
  disposition: CorpusDisposition
  reason: string
}

/** The corpus manifest — the ONLY extraction surface (never globs; OQ-1). */
export interface CorpusManifest {
  manifestKind: 'legacy-corpus-manifest'
  sourceRevision: string
  items: CorpusItem[]
}

/** The import document (T1, incl. the F-2 corpusDigest member). */
export interface ImportDocument {
  apiVersion: '0.1.0'
  documentKind: 'legacy-import'
  corpusDigest: string
  sourceLineage: {
    rootCommit: string
    tipCommit: string
  }
  corpusManifest: CorpusManifest
  rows: LegacyGoalRecord[]
}

const COMMIT_ID_RE = /^[0-9a-f]*$/
const SAFE_SEGMENT_RE = /^[^\\/]*$/

/** True for a lowercase-hex commit id of the SHA-1 or SHA-256 length (OQ-6). */
export function isCommitId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value.length === COMMIT_ID_LENGTH_SHA1 || value.length === COMMIT_ID_LENGTH_SHA256) &&
    COMMIT_ID_RE.test(value)
  )
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next < 0xdc00 || next > 0xdfff) return true
      i += 1
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true
    }
  }
  return false
}

/** Control (U+0000–U+001F, U+007F) or format/bidi characters (linear scan, #19). */
function hasControlOrFormatChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit <= 0x1f || unit === 0x7f) return true
    if (
      unit === 0x200b ||
      unit === 0x200e ||
      unit === 0x200f ||
      (unit >= 0x202a && unit <= 0x202e) ||
      unit === 0xfeff
    ) {
      return true
    }
  }
  return false
}

const RESERVED_WINDOWS_NAMES: Record<string, true> = {
  con: true,
  prn: true,
  aux: true,
  nul: true,
  com1: true,
  com2: true,
  com3: true,
  com4: true,
  com5: true,
  com6: true,
  com7: true,
  com8: true,
  com9: true,
  lpt1: true,
  lpt2: true,
  lpt3: true,
  lpt4: true,
  lpt5: true,
  lpt6: true,
  lpt7: true,
  lpt8: true,
  lpt9: true,
}

/**
 * True for a repo-relative committed path form (CMT-05): no traversal, no
 * absolute/rooted form, no backslash, no ADS colon, no reserved device name,
 * no trailing dot/space segment, no control or format characters, no unpaired
 * surrogate. Length bounds are the limits phase's job.
 */
export function isRepoRelativePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  if (hasUnpairedSurrogate(value)) return false
  if (hasControlOrFormatChar(value)) return false
  if (value.includes('\\') || value.includes(':')) return false
  if (value.startsWith('/')) return false
  const segments = value.split('/')
  for (const segment of segments) {
    if (segment.length === 0) return false
    if (segment === '.' || segment === '..') return false
    if (segment.endsWith('.') || segment.endsWith(' ')) return false
    if (!SAFE_SEGMENT_RE.test(segment)) return false
    const stem = segment.split('.')[0] ?? ''
    if (RESERVED_WINDOWS_NAMES[stem.toLowerCase()] === true) return false
  }
  return true
}

function structurallyInvalid(fieldPath: string): never {
  throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath })
}

function requireRecord(value: unknown, fieldPath: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    structurallyInvalid(fieldPath)
  }
  return value as Record<string, unknown>
}

function requireExactKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  fieldPath: string,
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) structurallyInvalid(`${fieldPath}.${key}`)
  }
}

function requireLiteral<L extends string>(value: unknown, literal: L, fieldPath: string): L {
  if (value !== literal) structurallyInvalid(fieldPath)
  return literal
}

function requireString(value: unknown, fieldPath: string): string {
  if (typeof value !== 'string' || hasUnpairedSurrogate(value)) structurallyInvalid(fieldPath)
  return value
}

function requireGitIdentity(value: unknown, fieldPath: string): string {
  const text = requireString(value, fieldPath)
  if (text.length === 0 || hasControlOrFormatChar(text)) structurallyInvalid(fieldPath)
  return text
}

function requireCommitId(value: unknown, fieldPath: string): string {
  if (!isCommitId(value)) structurallyInvalid(fieldPath)
  return value
}

function requireDigestValue(value: unknown, fieldPath: string): string {
  if (!isDigest(value)) structurallyInvalid(fieldPath)
  return value
}

function requireIdValue(value: unknown, fieldPath: string): string {
  if (!isId(value)) structurallyInvalid(fieldPath)
  return value
}

function requireSafeIntValue(value: unknown, fieldPath: string): number {
  if (!isSafeInt(value)) structurallyInvalid(fieldPath)
  return value
}

function requireSafeIntOrNull(value: unknown, fieldPath: string): number | null {
  return value === null ? null : requireSafeIntValue(value, fieldPath)
}

function requireIdOrNull(value: unknown, fieldPath: string): string | null {
  return value === null ? null : requireIdValue(value, fieldPath)
}

function requireArray(value: unknown, fieldPath: string): unknown[] {
  if (!Array.isArray(value)) structurallyInvalid(fieldPath)
  return value
}

function requireStatus(value: unknown, fieldPath: string): string {
  if (typeof value !== 'string') structurallyInvalid(fieldPath)
  if (isReservedGateLiteral(value)) {
    throw importError('IMPORT_STATUS_UNKNOWN', {})
  }
  if (!isGoalStatus(value)) {
    throw importError('IMPORT_STATUS_UNKNOWN', {})
  }
  return value
}

function requireOptionalTargetStatus(value: unknown, fieldPath: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || isReservedGateLiteral(value) || !isGoalStatus(value)) {
    structurallyInvalid(fieldPath)
  }
  return value
}

function parseSourceProvenance(value: unknown, fieldPath: string): SourceProvenance {
  const record = requireRecord(value, fieldPath)
  requireExactKeys(record, ['sourcePath', 'sourceDigest', 'sourceCommit'], fieldPath)
  if (!('sourcePath' in record) || !('sourceDigest' in record) || !('sourceCommit' in record)) {
    structurallyInvalid(fieldPath)
  }
  const sourcePath = requireString(record.sourcePath, `${fieldPath}.sourcePath`)
  if (!isRepoRelativePath(sourcePath)) structurallyInvalid(`${fieldPath}.sourcePath`)
  return {
    sourcePath,
    sourceDigest: requireDigestValue(record.sourceDigest, `${fieldPath}.sourceDigest`),
    sourceCommit: requireCommitId(record.sourceCommit, `${fieldPath}.sourceCommit`),
  }
}

function parseRatificationRef(value: unknown, fieldPath: string): RatificationRef {
  const record = requireRecord(value, fieldPath)
  requireExactKeys(record, ['gitIdentity', 'digest', 'provenance'], fieldPath)
  if (!('gitIdentity' in record) || !('digest' in record) || !('provenance' in record)) {
    structurallyInvalid(fieldPath)
  }
  return {
    gitIdentity: requireGitIdentity(record.gitIdentity, `${fieldPath}.gitIdentity`),
    digest: requireDigestValue(record.digest, `${fieldPath}.digest`),
    provenance: parseSourceProvenance(record.provenance, `${fieldPath}.provenance`),
  }
}

function parseApprovalClaim(value: unknown, fieldPath: string): ApprovalClaim {
  const record = requireRecord(value, fieldPath)
  requireExactKeys(record, ['evidenceKind', 'gitIdentity', 'digest', 'provenance'], fieldPath)
  if (!('evidenceKind' in record) || !('gitIdentity' in record) || !('digest' in record)) {
    structurallyInvalid(fieldPath)
  }
  const evidenceKind = record.evidenceKind
  if (
    typeof evidenceKind !== 'string' ||
    !(APPROVAL_EVIDENCE_KINDS as readonly string[]).includes(evidenceKind)
  ) {
    structurallyInvalid(`${fieldPath}.evidenceKind`)
  }
  return {
    evidenceKind: evidenceKind as ApprovalEvidenceKind,
    gitIdentity: requireGitIdentity(record.gitIdentity, `${fieldPath}.gitIdentity`),
    digest: requireDigestValue(record.digest, `${fieldPath}.digest`),
    // Absent-tolerant (FAB-01 / T10 `provenance-absent`): absent or null stays null.
    provenance:
      record.provenance === undefined || record.provenance === null
        ? null
        : parseSourceProvenance(record.provenance, `${fieldPath}.provenance`),
  }
}

function parseClaimedBinding(value: unknown, fieldPath: string): ClaimedBinding {
  const record = requireRecord(value, fieldPath)
  const members = ['principalRef', 'operationId', 'repositoryRef', 'worktreeRef']
  requireExactKeys(record, members, fieldPath)
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`${fieldPath}.${member}`)
  }
  return {
    principalRef: requireIdValue(record.principalRef, `${fieldPath}.principalRef`),
    operationId: requireIdValue(record.operationId, `${fieldPath}.operationId`),
    repositoryRef: requireIdValue(record.repositoryRef, `${fieldPath}.repositoryRef`),
    worktreeRef: requireIdValue(record.worktreeRef, `${fieldPath}.worktreeRef`),
  }
}

function parseOperationalFacts(value: unknown, fieldPath: string): OperationalFacts {
  const record = requireRecord(value, fieldPath)
  const members = [
    'claimedRevision',
    'claimedLeaseHolderPrincipalRef',
    'claimedPendingTransitionTarget',
    'claimedWakeupCount',
    'claimedHandoffCount',
    'claimedBinding',
  ]
  requireExactKeys(record, members, fieldPath)
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`${fieldPath}.${member}`)
  }
  return {
    claimedRevision: requireSafeIntOrNull(record.claimedRevision, `${fieldPath}.claimedRevision`),
    claimedLeaseHolderPrincipalRef: requireIdOrNull(
      record.claimedLeaseHolderPrincipalRef,
      `${fieldPath}.claimedLeaseHolderPrincipalRef`,
    ),
    claimedPendingTransitionTarget: requireOptionalTargetStatus(
      record.claimedPendingTransitionTarget,
      `${fieldPath}.claimedPendingTransitionTarget`,
    ),
    claimedWakeupCount: requireSafeIntOrNull(
      record.claimedWakeupCount,
      `${fieldPath}.claimedWakeupCount`,
    ),
    claimedHandoffCount: requireSafeIntOrNull(
      record.claimedHandoffCount,
      `${fieldPath}.claimedHandoffCount`,
    ),
    claimedBinding:
      record.claimedBinding === null
        ? null
        : parseClaimedBinding(record.claimedBinding, `${fieldPath}.claimedBinding`),
  }
}

function parseLegacyGoalRecord(value: unknown, fieldPath: string): LegacyGoalRecord {
  const record = requireRecord(value, fieldPath)
  const members = [
    'goalId',
    'claimedStatus',
    'source',
    'claimedRatificationRefs',
    'claimedApprovals',
    'claimedOperationalFacts',
  ]
  requireExactKeys(record, members, fieldPath)
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`${fieldPath}.${member}`)
  }
  return {
    goalId: requireIdValue(record.goalId, `${fieldPath}.goalId`),
    claimedStatus: requireStatus(record.claimedStatus, `${fieldPath}.claimedStatus`),
    source: parseSourceProvenance(record.source, `${fieldPath}.source`),
    claimedRatificationRefs: requireArray(
      record.claimedRatificationRefs,
      `${fieldPath}.claimedRatificationRefs`,
    ).map((member, index) =>
      parseRatificationRef(member, `${fieldPath}.claimedRatificationRefs[${index}]`),
    ),
    claimedApprovals: requireArray(record.claimedApprovals, `${fieldPath}.claimedApprovals`).map(
      (member, index) => parseApprovalClaim(member, `${fieldPath}.claimedApprovals[${index}]`),
    ),
    claimedOperationalFacts: parseOperationalFacts(
      record.claimedOperationalFacts,
      `${fieldPath}.claimedOperationalFacts`,
    ),
  }
}

function parseCorpusItem(value: unknown, fieldPath: string): CorpusItem {
  const record = requireRecord(value, fieldPath)
  const members = ['sourcePath', 'sourceDigest', 'disposition', 'reason']
  requireExactKeys(record, members, fieldPath)
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`${fieldPath}.${member}`)
  }
  const disposition = record.disposition
  if (
    typeof disposition !== 'string' ||
    !(CORPUS_DISPOSITIONS as readonly string[]).includes(disposition)
  ) {
    structurallyInvalid(`${fieldPath}.disposition`)
  }
  const sourcePath = requireString(record.sourcePath, `${fieldPath}.sourcePath`)
  if (!isRepoRelativePath(sourcePath)) structurallyInvalid(`${fieldPath}.sourcePath`)
  const reason = requireString(record.reason, `${fieldPath}.reason`)
  if (reason.length === 0) structurallyInvalid(`${fieldPath}.reason`)
  return {
    sourcePath,
    sourceDigest: requireDigestValue(record.sourceDigest, `${fieldPath}.sourceDigest`),
    disposition: disposition as CorpusDisposition,
    reason,
  }
}

function parseCorpusManifest(value: unknown, fieldPath: string): CorpusManifest {
  const record = requireRecord(value, fieldPath)
  const members = ['manifestKind', 'sourceRevision', 'items']
  requireExactKeys(record, members, fieldPath)
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`${fieldPath}.${member}`)
  }
  return {
    manifestKind: requireLiteral(
      record.manifestKind,
      'legacy-corpus-manifest',
      `${fieldPath}.manifestKind`,
    ),
    sourceRevision: requireCommitId(record.sourceRevision, `${fieldPath}.sourceRevision`),
    items: requireArray(record.items, `${fieldPath}.items`).map((member, index) =>
      parseCorpusItem(member, `${fieldPath}.items[${index}]`),
    ),
  }
}

/**
 * Structural parse of an untrusted import document (default-deny per member).
 * Throws `ImportError` on any structural refusal; size limits and cross-row
 * consistency are later phases of `runImport`.
 */
export function parseImportDocument(value: unknown): ImportDocument {
  const record = requireRecord(value, '$')
  const members = [
    'apiVersion',
    'documentKind',
    'corpusDigest',
    'sourceLineage',
    'corpusManifest',
    'rows',
  ]
  requireExactKeys(record, members, '$')
  for (const member of members) {
    if (!(member in record)) structurallyInvalid(`$.${member}`)
  }
  const lineage = requireRecord(record.sourceLineage, '$.sourceLineage')
  requireExactKeys(lineage, ['rootCommit', 'tipCommit'], '$.sourceLineage')
  if (!('rootCommit' in lineage) || !('tipCommit' in lineage))
    structurallyInvalid('$.sourceLineage')
  return {
    apiVersion: requireLiteral(record.apiVersion, IMPORT_API_VERSION, '$.apiVersion'),
    documentKind: requireLiteral(record.documentKind, 'legacy-import', '$.documentKind'),
    corpusDigest: requireDigestValue(record.corpusDigest, '$.corpusDigest'),
    sourceLineage: {
      rootCommit: requireCommitId(lineage.rootCommit, '$.sourceLineage.rootCommit'),
      tipCommit: requireCommitId(lineage.tipCommit, '$.sourceLineage.tipCommit'),
    },
    corpusManifest: parseCorpusManifest(record.corpusManifest, '$.corpusManifest'),
    // A cutover import carries at least one legacy record: the epoch event must
    // bind a real goal (substrate events.goal_id FK) — an empty corpus refuses
    // typed rather than surfacing later as an untyped substrate fault (#1).
    rows: (() => {
      const rows = requireArray(record.rows, '$.rows').map((member, index) =>
        parseLegacyGoalRecord(member, `$.rows[${index}]`),
      )
      if (rows.length === 0) structurallyInvalid('$.rows')
      return rows
    })(),
  }
}

/** Status vocabulary re-export (FK-P10 T1 data — the single source). */
export { GOAL_STATUSES }
