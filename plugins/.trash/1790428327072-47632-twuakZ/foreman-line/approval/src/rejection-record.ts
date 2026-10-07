/**
 * Rejection record (coordinator ruling Q6): `reject <slug|path> [--reason
 * <text>]` records a rejection (`decision: "rejected"`, reason, ISO-UTC
 * timestamp, and the subject hash for reference only) but mints NO receipt
 * and produces NO `approvedHash` as an approval binding - the receipt chain
 * begins only at approval. Written to a distinct sidecar
 * (`<slug>.rejection.json`, same non-`.md` spec-linter-exempt rationale as
 * the approval sidecar) so `reject` never writes, and can never collide
 * with, `<slug>.approval.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertAbsoluteRoot } from './errors.js'
import { assertSafeSlug } from './slug-guard.js'

/** Foreign-repo default specs dir, relative to `repoRoot` (P2b-i R2/A1.3 — not a root fallback). */
const DEFAULT_SPECS_DIR = 'docs/specs/active'

export const REJECTION_RECORD_SUFFIX = '.rejection.json'

export interface RejectionRecord {
  readonly decision: 'rejected'
  readonly reason: string | null
  readonly timestamp: string
  /** Reference only - never an approval binding. */
  readonly referenceHash: string
}

/**
 * Builds the rejection-record path for `slug`. `slug` is validated (rework
 * item 1) BEFORE any path is constructed from it - a slug containing `../`,
 * `/`, `\`, or uppercase is refused, naming the offending slug.
 */
export function rejectionRecordPath(
  slug: string,
  repoRoot: string,
  specsDir: string = DEFAULT_SPECS_DIR,
): string {
  assertSafeSlug(slug)
  assertAbsoluteRoot(repoRoot, 'rejectionRecordPath')
  const activeDir = join(repoRoot, ...specsDir.split('/'))
  return join(activeDir, `${slug}${REJECTION_RECORD_SUFFIX}`)
}

export function writeRejectionRecord(
  slug: string,
  record: RejectionRecord,
  repoRoot: string,
  specsDir: string = DEFAULT_SPECS_DIR,
): string {
  const filePath = rejectionRecordPath(slug, repoRoot, specsDir)
  mkdirSync(join(repoRoot, ...specsDir.split('/')), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  return filePath
}
