/**
 * AC8: the frontmatter self-check REUSES the imported parseFrontmatter +
 * validateSpecFrontmatter from frozen spec-linter (relative ESM specifier, no
 * modification). A valid v0.2 draft passes; a draft missing a required field
 * (`risk`) is rejected with the linter's own violation surfaced.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkFrontmatter } from '../src/index.js'
import { CONFORMANT_DRAFT, DRAFT_MISSING_RISK } from './helpers.js'

test('AC8: a valid v0.2 draft passes the frontmatter self-check', () => {
  const result = checkFrontmatter(CONFORMANT_DRAFT)
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC8: a draft missing the required `risk` field is rejected with the linter violation', () => {
  const result = checkFrontmatter(DRAFT_MISSING_RISK)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((e) => e.includes('risk')),
    `expected a violation mentioning 'risk', got ${JSON.stringify(result.errors)}`,
  )
})

// RETIRED (same class and ruling as the frozen-surface freeze retired in
// projection/tests/frozen-surface.test.ts - CLOSE-P2 coordinator amendment
// A6; STANDING-CONSTRAINTS Builder #12): the "AC8: no file under spec-linter/
// is modified by this parcel" git-diff freeze that lived here was a
// parcel-time drift control shipped as a permanent suite member - and worse,
// `git diff HEAD` pins global worktree CLEANLINESS, reddening on any
// uncommitted spec-linter edit by any contributor (it fired on the chartered
// spec-linter changes in this very campaign) while passing vacuously on CI's
// committed tree. Parcel-time freezes belong in the coordinator's Stage-D/E
// git-diff checks, not the shipped suite. The shipped half of AC8 - the two
// behavior tests above (the self-check delegates to the linter's own
// accept/reject verdicts, never re-implementing them) - stays.
