/**
 * T-seam — the `SourceLineageReader` read contract (the package's one external
 * read seam) and its typed gateway.
 *
 * Seam rules (T1/Constraints):
 * 1. Every reader call is wrapped in typed try-catch and rethrown as
 *    `LINEAGE_READER_FAILURE` carrying the seam's own code literal only
 *    (standing #1). HARNESS_*-branded seam errors rethrow UNWRAPPED — harness
 *    failures are never laundered into product errors (ERR-01).
 * 2. Seam returns are `unknown` until explicitly normalized (#28) — a
 *    nonconforming return refuses typed (`LINEAGE_READER_FAILURE` /
 *    `nonconforming-return`), never a confident cast.
 * 3. Digests are ALWAYS computed by FK-P11 over the returned bytes (SHA-256,
 *    `sha256:`-tagged) — the reader never supplies a digest, so a lying digest
 *    cannot pass.
 * 4. Lineage membership is computed by FK-P11 from the reader's raw boolean
 *    answers as the ancestry closure `rootCommit … tipCommit` (inclusive).
 * 5. The operator-trust assumption is recorded ONLY for injected-seam test
 *    runs — never for the shipped `GitLineageReader` (OQ-8 ruling).
 */
import { digestBytes } from './canonical.js'
import { importError, isHarnessFailure, isImportError } from './errors.js'

/** The three-method read contract (returns are `unknown`, normalized below). */
export interface SourceLineageReader {
  /** `unknown` until normalized to boolean; false = the commit is not known. */
  commitExists(commitId: string): unknown
  /** `unknown` until normalized to boolean; inclusive (a commit is its own ancestor). */
  isAncestor(ancestor: string, descendant: string): unknown
  /** `unknown` until normalized to `Uint8Array` or `BlobAbsence`; bytes only. */
  readCommittedBlob(commitId: string, sourcePath: string): unknown
}

/** The typed absence a conforming `readCommittedBlob` returns when no blob exists. */
export interface BlobAbsence {
  readonly absent: true
}

export const BLOB_ABSENT: BlobAbsence = { absent: true }

/** Normalized blob answer: committed bytes, or typed absence. */
export type BlobResult = Uint8Array | BlobAbsence

const READER_CODE_RE = /^[A-Za-z0-9_-]{1,64}$/

function readerFailure(readerCode: string): never {
  throw importError('LINEAGE_READER_FAILURE', { readerCode })
}

/** The seam's own code literal, or `reader-failure` (message text never travels). */
function seamCodeOf(value: unknown): string {
  if (
    value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    typeof (value as { code: unknown }).code === 'string'
  ) {
    const code = (value as { code: string }).code
    if (READER_CODE_RE.test(code)) return code
  }
  return 'reader-failure'
}

/** Wrapped seam call: typed boundary + HARNESS_* pass-through (rule 1). */
function callSeam<T>(fn: () => unknown, normalize: (raw: unknown) => T): T {
  let raw: unknown
  try {
    raw = fn()
  } catch (value) {
    if (isImportError(value)) throw value
    if (isHarnessFailure(value)) throw value
    readerFailure(seamCodeOf(value))
  }
  return normalize(raw)
}

function normalizeBoolean(raw: unknown): boolean {
  if (typeof raw !== 'boolean') readerFailure('nonconforming-return')
  return raw
}

function normalizeBlob(raw: unknown): BlobResult {
  if (raw instanceof Uint8Array) return raw
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'absent' in raw &&
    (raw as { absent: unknown }).absent === true
  ) {
    return BLOB_ABSENT
  }
  return readerFailure('nonconforming-return')
}

/** The typed view of a `SourceLineageReader` FK-P11 computes from (rules 2–4). */
export interface LineageGateway {
  commitExists(commitId: string): boolean
  isAncestor(ancestor: string, descendant: string): boolean
  readCommittedBlob(commitId: string, sourcePath: string): BlobResult
  /** Rule 3: digest computed by FK-P11 over returned bytes. */
  digestOf(bytes: Uint8Array): string
  /** Rule 4: inclusive ancestry closure `rootCommit … tipCommit`. */
  commitInLineage(rootCommit: string, tipCommit: string, claimed: string): boolean
}

/** Wrap a reader seam (shipped `GitLineageReader` or injected test seam). */
export function createLineageGateway(reader: SourceLineageReader): LineageGateway {
  return {
    commitExists(commitId: string): boolean {
      return callSeam(() => reader.commitExists(commitId), normalizeBoolean)
    },
    isAncestor(ancestor: string, descendant: string): boolean {
      return callSeam(() => reader.isAncestor(ancestor, descendant), normalizeBoolean)
    },
    readCommittedBlob(commitId: string, sourcePath: string): BlobResult {
      return callSeam(() => reader.readCommittedBlob(commitId, sourcePath), normalizeBlob)
    },
    digestOf(bytes: Uint8Array): string {
      return digestBytes(bytes)
    },
    commitInLineage(rootCommit: string, tipCommit: string, claimed: string): boolean {
      return (
        callSeam(() => reader.isAncestor(rootCommit, claimed), normalizeBoolean) &&
        callSeam(() => reader.isAncestor(claimed, tipCommit), normalizeBoolean)
      )
    },
  }
}
