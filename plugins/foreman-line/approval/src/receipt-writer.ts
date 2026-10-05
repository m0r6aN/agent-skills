/**
 * Writes a minted `ReceiptDocument` to its W0-P4 locator
 * (`docs/receipts/<workflowId>/000000-A-shaping-result.json`), repo-root
 * relative, POSIX separators - built by the shipped `receiptPath()` and
 * mirrored exactly by `ReceiptRef.locator`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { assertContainedPath } from '../../projection/src/index.js'
import type { ReceiptDocument } from '../../receipts/src/index.js'
import { DEFAULT_REPO_ROOT } from './paths.js'

export function writeReceiptDocument(
  document: ReceiptDocument,
  locator: string,
  repoRoot: string = DEFAULT_REPO_ROOT,
): string {
  const absPath = join(repoRoot, ...locator.split('/'))
  // Path containment (D1): the locator-resolved path must stay beneath
  // repoRoot — refused before any directory creation or write.
  assertContainedPath(repoRoot, absPath, locator)
  mkdirSync(dirname(absPath), { recursive: true })
  writeFileSync(absPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
  return absPath
}
