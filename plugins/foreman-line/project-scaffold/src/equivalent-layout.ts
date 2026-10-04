/**
 * Equivalent-layout pre-check (charter D9a, as amended for plan-review B1).
 *
 * Before gap detection, any directory evidently serving a canonical target's
 * role is a conflict: it contains spec markdown with SPEC-CONVENTION-shaped
 * frontmatter (parsed with the existing parcel parser, spec-linter's
 * `parseFrontmatter`), or it matches a known alternative layout
 * (`docs/PARCELS/`, `docs/parcels/`). On detection the generator emits a
 * typed `EQUIVALENT_LAYOUT_CONFLICT` naming both paths, writes nothing, and
 * refuses — gap detection alone would otherwise create `docs/specs/` beside
 * an existing divergent convention and manufacture the exact drift this
 * plugin exists to remove.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
// Existing parcel parser (the sanctioned relative cross-package mechanism).
import { parseFrontmatter } from '../../spec-linter/src/validate.js'
import { ScaffoldError } from './errors.js'

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules'])
const CANONICAL_SPEC_ROOTS = ['docs/specs']

/** SPEC-CONVENTION-shaped: the frontmatter carries the §4 core key set. */
function isSpecConventionShaped(doc: unknown): boolean {
  if (typeof doc !== 'object' || doc === null) return false
  const record = doc as Record<string, unknown>
  return (
    typeof record.ticket === 'string' &&
    typeof record.title === 'string' &&
    typeof record.risk === 'string' &&
    Array.isArray(record.surfaces) &&
    typeof record.routing_class === 'string'
  )
}

function hasSpecShapedMarkdown(dir: string): boolean {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const doc = parseFrontmatter(readFileSync(join(dir, entry.name), 'utf8'))
    if (isSpecConventionShaped(doc)) return true
  }
  return false
}

function isUnderCanonicalSpecRoot(relDir: string): boolean {
  return CANONICAL_SPEC_ROOTS.some(
    (root) => relDir === root || relDir.startsWith(`${root}${sep === '\\' ? '/' : sep}`),
  )
}

/** Scans `targetRoot` and refuses on the first equivalent layout found. */
export function checkEquivalentLayout(targetRoot: string): void {
  const docsDir = join(targetRoot, 'docs')
  let docsEntries: readonly string[] = []
  try {
    docsEntries = readdirSync(docsDir)
  } catch {
    docsEntries = []
  }
  for (const entry of docsEntries) {
    if (entry !== 'PARCELS' && entry !== 'parcels') continue
    // Exact dirent comparison: on a case-insensitive filesystem a naive
    // statSync probe would report the wrong spelling of the conflicting path.
    throw new ScaffoldError(
      'EQUIVALENT_LAYOUT_CONFLICT',
      `equivalent layout conflict: 'docs/${entry}' serves the role of the canonical spec location 'docs/specs'; reconcile the two conventions before scaffolding`,
      [`docs/${entry}`, 'docs/specs'],
    )
  }

  const stack: string[] = [targetRoot]
  while (stack.length > 0) {
    const dir = stack.pop() as string
    const relDir = relative(targetRoot, dir).split(sep).join('/')
    if (!isUnderCanonicalSpecRoot(relDir) && hasSpecShapedMarkdown(dir)) {
      const named = relDir === '' ? '.' : relDir
      throw new ScaffoldError(
        'EQUIVALENT_LAYOUT_CONFLICT',
        `equivalent layout conflict: '${named}' contains spec markdown with SPEC-CONVENTION-shaped frontmatter, serving the role of the canonical spec location 'docs/specs'; reconcile the two conventions before scaffolding`,
        [named, 'docs/specs'],
      )
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name)) {
        stack.push(join(dir, entry.name))
      }
    }
  }
}
