/**
 * AC2: `deriveTouchSet` always carries resolution provenance, exercised
 * against real globs in this repo (never only against a fixture this parcel
 * also authors).
 *
 * AC5 + AC8b: Contract A / Contract B real-reader reconciliation, both
 * directions, printed as evidence (Standing Constraint #43/#49 — a count is
 * never the authority; the enumerated identity list is, reconciled against
 * disk).
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import { contractA, contractB, registry } from '../src/registry-data.js'
import { contractReaderEntrySchema } from '../src/schema.js'
import { deriveTouchSet, hasResolutionProvenance, normalizeSeparators } from '../src/touch-set.js'
import type { ContractReader } from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
// tests/ -> contract-readers/ -> foreman-line/ -> plugins/ -> repo root
const repoRoot = join(here, '..', '..', '..', '..')

function readerFiles(reader: ContractReader): readonly string[] {
  return typeof reader === 'string' ? [reader] : reader.files
}

// --- AC2: provenance is always present, and glob resolution actually expands ---

test('deriveTouchSet always carries both resolution-provenance fields', () => {
  const result = deriveTouchSet(['plugins/foreman-line/contract-readers/src/*.ts'], repoRoot)
  assert.ok(hasResolutionProvenance(result), JSON.stringify(result))
  assert.ok(Array.isArray(result.files))
})

test('mutation: stripping resolvedAtCommit fails the provenance guard', () => {
  const result = deriveTouchSet(['plugins/foreman-line/contract-readers/src/*.ts'], repoRoot)
  const stripped: Record<string, unknown> = { ...result }
  delete stripped.resolvedAtCommit
  assert.equal(hasResolutionProvenance(stripped), false)
})

test('mutation: stripping resolvedAtTimestamp fails the provenance guard', () => {
  const result = deriveTouchSet(['plugins/foreman-line/contract-readers/src/*.ts'], repoRoot)
  const stripped: Record<string, unknown> = { ...result }
  delete stripped.resolvedAtTimestamp
  assert.equal(hasResolutionProvenance(stripped), false)
})

test('glob resolution against a real directory actually expands (not a synthetic-only fixture)', () => {
  const result = deriveTouchSet(['plugins/foreman-line/contract-readers/src/*.ts'], repoRoot)
  assert.ok(
    result.files.includes('plugins/foreman-line/contract-readers/src/schema.ts'),
    JSON.stringify(result.files),
  )
  assert.ok(
    result.files.includes('plugins/foreman-line/contract-readers/src/intersect.ts'),
    JSON.stringify(result.files),
  )
})

test('a concrete (non-glob) surface resolves to exactly itself', () => {
  const result = deriveTouchSet(
    ['plugins/foreman-line/contract-readers/src/registry-data.ts'],
    repoRoot,
  )
  assert.deepEqual(result.files, ['plugins/foreman-line/contract-readers/src/registry-data.ts'])
})

test('AC2/AC8b: derivation against Contract A and Contract B real reader sets produces correct file identities with provenance', () => {
  const surfaces = [
    ...contractA.readers.flatMap(readerFiles),
    ...contractB.readers.flatMap(readerFiles),
  ]
  const result = deriveTouchSet(surfaces, repoRoot)
  assert.ok(hasResolutionProvenance(result))
  for (const surface of surfaces) {
    assert.ok(
      result.files.includes(normalizeSeparators(surface)),
      `${surface} missing from ${JSON.stringify(result.files)}`,
    )
  }
})

// --- AC5: Contract A / Contract B reconciliation, both directions ---

test('AC5 forward: every Contract A declared reader file exists on disk', () => {
  for (const reader of contractA.readers) {
    for (const file of readerFiles(reader)) {
      assert.ok(
        existsSync(join(repoRoot, file)),
        `Contract A declared reader missing on disk: ${file}`,
      )
    }
  }
})

test('AC5 forward: every Contract B declared reader file exists on disk', () => {
  for (const reader of contractB.readers) {
    for (const file of readerFiles(reader)) {
      assert.ok(
        existsSync(join(repoRoot, file)),
        `Contract B declared reader missing on disk: ${file}`,
      )
    }
  }
})

/**
 * Mechanical sweep (AC5's other direction / A2(b) — BL1, F4). A textual
 * `git grep` proxy for "files that reference the named contract," scoped by
 * the pathspec below. This is a SYNTACTIC proxy, not a semantic one (Standing
 * Constraint #19/#45/#53): it cannot tell "reads this field to validate
 * against the vocabulary" from "constructs a fixture literal using the same
 * field name" or "mentions it in a comment" — that is why every surfaced file
 * is adjudicated below rather than trusted at face value.
 *
 * **A2(b)(1) — the pathspec bug this sweep replaces, and why the positive
 * control exists.** The prior pathspec `'plugins/foreman-line/**\/src/**\/*.ts'`
 * does not match files sitting directly in `src/` in git pathspec semantics —
 * which is where nearly every reader lives — so it silently returned empty
 * while 7 files matched on disk, including a declared Contract A reader
 * (`schemas.ts`) it could never see. The corrected pathspec below
 * (`'plugins/foreman-line/*\/src/*.ts'`) is necessary but NOT sufficient on
 * its own: a pathspec can always be broken again by a future refactor. The
 * mandatory positive control below is what actually catches that class of
 * defect — it asserts the sweep finds at least one KNOWN-PRESENT,
 * ALREADY-DECLARED reader, so a zero-match run FAILS the control instead of
 * printing `found=[]` forever.
 *
 * **A3(f) — what the pathspec actually matches (correcting the prior comment
 * here, which was itself wrong).** A previous version of this comment claimed
 * the corrected pathspec matches `.ts` files "sitting DIRECTLY in a package's
 * `src/`" with "exactly one directory between `foreman-line` and `src`". Both
 * claims are FALSE: git's non-`:(glob)` `*` matches across `/`, not only
 * within one path segment, so `'plugins/foreman-line/*\/src/*.ts'` also
 * reaches `.ts` files nested arbitrarily deep under any package's `src/` —
 * e.g. `dispatch/src/approval-cli/index.ts`, `dispatch/src/routing-eval/index.ts`,
 * and `verification/src/pipeline/index.ts`, all one or more subdirectories
 * below `src/`. That broader reach is DESIRABLE (it is why declared reader
 * `dispatch/src/routing-eval/index.ts` is found at all) — the defect was only
 * ever the comment describing it too narrowly. A3(d)'s reverse control below
 * checks scope by asking git directly (`git ls-files` against this same
 * pathspec) rather than by reimplementing pathspec semantics in a second,
 * potentially-also-wrong regex.
 */
const SWEEP_PATHSPEC = 'plugins/foreman-line/*/src/*.ts'

function gitGrepFiles(pattern: string): readonly string[] {
  try {
    // Include both tracked and untracked worktree files. The boundary-routing
    // package is intentionally assembled incrementally, so a source file that
    // is present on disk must be adjudicated before it is staged; otherwise
    // this contract sweep can report a false negative until the caller happens
    // to add the file to the index.
    const filesOut = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '--', SWEEP_PATHSPEC],
      { cwd: repoRoot, encoding: 'utf8' },
    )
    const expression = new RegExp(pattern)
    return filesOut
      .split('\n')
      .filter((line) => line.length > 0)
      .filter((line) => existsSync(join(repoRoot, line)))
      .filter((line) => expression.test(readFileSync(join(repoRoot, line), 'utf8')))
      .map(normalizeSeparators)
  } catch (error) {
    const err = error as { status?: number }
    if (err.status === 1) return []
    throw error
  }
}

function excludeOwnPackage(files: readonly string[]): readonly string[] {
  return files.filter((f) => !f.includes('/contract-readers/'))
}

/** A3(d): ground truth for "is this file within the sweep's pathspec scope,"
 * asked of git directly rather than reimplemented as a second regex (which is
 * exactly how A3(f)'s wrong comment happened the first time). */
function gitLsFilesInScope(): readonly string[] {
  const out = execFileSync('git', ['ls-files', '--', SWEEP_PATHSPEC], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return out
    .split('\n')
    .filter((line) => line.length > 0)
    .map(normalizeSeparators)
}

/** A2(b)(3): a contract's own home package DEFINES the vocabulary rather than reading it. */
function excludeHomePackage(
  files: readonly string[],
  homePackagePathFragment: string,
): readonly string[] {
  return files.filter((f) => !f.includes(homePackagePathFragment))
}

/**
 * I3: shared by the A4(c) reverse-control deepEqual for both contracts and
 * the mutation-proof test below — the declared, normalized, sorted subset of
 * `readers` that lies OUTSIDE `inScope`. Extracted so the three call sites
 * (Contract A's reverse control, Contract B's reverse control, and the
 * mutation proof) cannot silently diverge in how they compute this set.
 */
function outOfScopeDeclared(
  readers: readonly ContractReader[],
  inScope: ReadonlySet<string>,
): readonly string[] {
  return readers
    .flatMap(readerFiles)
    .map(normalizeSeparators)
    .filter((f) => !inScope.has(f))
    .sort()
}

// ---------------------------------------------------------------------------
// Contract A — SPEC-CONVENTION §4 spec-frontmatter schema
// ---------------------------------------------------------------------------

// A2(b)(2), field-name signal: the literal frontmatter key.
const contractAFieldSignal = excludeOwnPackage(gitGrepFiles('verification_class'))
// A2(b)(2), vocabulary-values signal: the concrete enum literals, OR the
// exported identifier that names the array of them (`VERIFICATION_CLASSES`) —
// the identifier form is what catches a barrel re-export that carries the
// vocabulary only by name, never by literal value.
const contractAValueSignal = excludeOwnPackage(
  gitGrepFiles('judgment-required|equivalence-provable|VERIFICATION_CLASSES'),
)

test('A2(b)(1) positive control — Contract A: the field-name signal must find at least one already-declared reader, or the sweep is lying', () => {
  const declaredReader = 'plugins/foreman-line/spec-linter/src/schemas.ts'
  assert.ok(
    contractAFieldSignal.includes(declaredReader),
    `positive control failed: known-declared reader '${declaredReader}' was not found by the ` +
      `sweep (found=${JSON.stringify(contractAFieldSignal)}). A zero/short result here means the ` +
      `pathspec or pattern is broken again — the sweep cannot be trusted until this passes.`,
  )
})

test('A2(b)(2)/(3)/(4) Contract A — every surfaced file is adjudicated; both signals; residual blindness stated', () => {
  const declared = new Set(
    contractA.readers.flatMap((r) => readerFiles(r).map(normalizeSeparators)),
  )
  const surfaced = new Set([...contractAFieldSignal, ...contractAValueSignal])
  const undeclared = [...surfaced].filter((f) => !declared.has(f)).sort()

  console.log(
    `Contract A sweep — field signal (verification_class): found=${JSON.stringify(contractAFieldSignal)}`,
  )
  console.log(
    `Contract A sweep — value signal (judgment-required|equivalence-provable|VERIFICATION_CLASSES): found=${JSON.stringify(contractAValueSignal)}`,
  )
  console.log(`Contract A sweep — declared readers: ${JSON.stringify([...declared].sort())}`)
  console.log(
    `Contract A sweep — surfaced-but-undeclared (adjudicated below): ${JSON.stringify(undeclared)}`,
  )

  // Residual blindness (A2(b)(2)): the field-name signal is a pure text match
  // on the string 'verification_class' and cannot distinguish a real
  // frontmatter-consuming reference from a comment or doc string that merely
  // names the field (e.g. cli.ts, verification/src/d19-audit.ts below) — its
  // blindness runs toward FALSE POSITIVES, not false negatives, which is why
  // every one of its hits still needs adjudication rather than auto-declaring.
  // The value signal is blind in the opposite direction: it misses any file
  // that consumes the field by hardcoding a literal enum value or importing
  // the SpecFrontmatter type without also referencing VERIFICATION_CLASSES or
  // one of its literal members by name — that residual gap is not claimed
  // closed by either signal; adjudication below is manual, not sweep-derived,
  // for exactly that reason.

  // Ruling table — every file EITHER signal surfaced for Contract A, adjudicated
  // against the A5(a) ADDITIVE LOCKSTEP TEST (a file is a reader iff it must
  // change when ONE MEMBER IS ADDED to the contract's set; removal/rename are
  // not the test):
  //   spec-linter/src/schemas.ts     — LOCKSTEP: hardcodes the enum in the ajv schema. ADD a class
  //                                    and this file must change.
  //   spec-linter/src/types.ts       — LOCKSTEP: restates VERIFICATION_CLASSES in full. ADD a class
  //                                    and this file must change.
  //   spec-linter/src/validate.ts    — A5(b), RE-ADJUDICATED and UNDECLARED (review E B1, the
  //                                    BLOCKER): compiles the schema IMPORTED from schemas.ts and
  //                                    holds no enum member of its own (`:22,101` import+compile;
  //                                    `:127,138` are the field *name* only, grandfather-waiver
  //                                    plumbing). ADD a class and this file is unchanged — fails the
  //                                    additive counterfactual under the same reading that ruled out
  //                                    cli.ts and index.ts. Moves from "declared" to
  //                                    "surfaced-but-undeclared".
  //   spec-linter/src/testing.ts     — A3(a), RE-ADJUDICATED and UNDECLARED (LOCKSTEP-negative):
  //                                    hardcodes 'judgment-required' as one canonical sample value.
  //                                    Under the additive criterion this is sample data, not
  //                                    readership — the identical shape that undeclared it for
  //                                    Contract B. It moves from "declared" to
  //                                    "surfaced-but-undeclared".
  //   spec-linter/src/cli.ts         — NOT declared (LOCKSTEP-negative): 'verification_class' appears
  //                                    only in a comment naming a waiver kind; no code reads or
  //                                    asserts the value; unchanged by an added class.
  //   spec-linter/src/grandfather.ts — NOT declared (LOCKSTEP-negative; A5(c) OPEN): 'verification_class'
  //                                    appears only in a doc comment describing the grandfather
  //                                    corpus; the exported WAIVABLE fields ('permission_profile' |
  //                                    'routing_class') do not include it, and no allowlist entry
  //                                    pins a verification_class value — unchanged by an added class
  //                                    under the member-level reading A5 adopted. `grandfather.ts:36`
  //                                    would be a reader by parity ONLY under the field-level reading
  //                                    A5(c) explicitly left open and did not adopt; recorded there,
  //                                    not ruled here.
  //   verification/src/d19-audit.ts  — NOT declared (LOCKSTEP-negative): 'verification_class' appears
  //                                    only inside a quoted disposition string in frozen audit
  //                                    inventory data, never read as a live field; unchanged by an
  //                                    added class.
  //
  // A3(a) also re-adjudicated files the sweep does NOT surface (outside its
  // `*/src/*.ts` pathspec, so absent from `surfaced` above and not asserted
  // against here — recorded for completeness of the re-adjudication):
  //   shaping/tests/helpers.ts, approval/tests/helpers.ts,
  //   registration/tests/helpers.ts, projection/tests/helpers.ts — NOT readers:
  //   each hardcodes the identical one-sample-value frontmatter fixture
  //   ('verification_class: judgment-required' / 'routing_class: standard-feature'),
  //   not an enumeration, a validation, or an index. Never declared; none
  //   needed adding or removing.
  const expectedUndeclared = [
    'plugins/foreman-line/spec-linter/src/cli.ts',
    'plugins/foreman-line/spec-linter/src/grandfather.ts',
    'plugins/foreman-line/spec-linter/src/testing.ts',
    'plugins/foreman-line/spec-linter/src/validate.ts',
    'plugins/foreman-line/verification/src/d19-audit.ts',
  ].sort()
  assert.deepEqual(
    undeclared,
    expectedUndeclared,
    `Contract A sweep surfaced a file with no ruling recorded above, or a previously-adjudicated ` +
      `file disappeared. Surfaced-but-undeclared: ${JSON.stringify(undeclared)}`,
  )
})

// A2(b)(4): .json restatements are in scope for adjudication even though the
// sweep's *.ts glob is structurally blind to them.
test('A2(b)(4) Contract A — the .json restatement is adjudicated (out of the *.ts glob by construction)', () => {
  assert.ok(
    contractA.readers.includes(
      'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
    ),
    'spec-frontmatter.schema.json restates the verification_class enum and must be declared',
  )
})

test('A3(a) Contract A — testing.ts is re-adjudicated and UNDECLARED (sample data, not a reader; also LOCKSTEP-negative under A4(a): it need not change when the vocabulary changes)', () => {
  const declaredFiles = contractA.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/spec-linter/src/testing.ts'),
    'testing.ts contains one sample literal, not an enumeration/validation/index, and must not be ' +
      'declared for Contract A under the A3(a)/A4(a) criteria',
  )
})

test('A5(b) LOCKSTEP re-adjudication (additive) — validate.ts is UNDECLARED for Contract A: it compiles the schema imported from schemas.ts and holds no enum member of its own, so adding a class does not change it', () => {
  const declaredFiles = contractA.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/spec-linter/src/validate.ts'),
    'validate.ts compiles the imported schema and never restates a member itself, so it fails the ' +
      'additive lockstep test and must not be declared for Contract A under A5(b) — this edits ' +
      "Constraint 6's original declared list, ratified in A5(b)",
  )
})

test('A4(a) LOCKSTEP re-adjudication — self-check.ts is UNDECLARED for Contract A: it delegates to validateSpecFrontmatter/parseFrontmatter (identical to cli.ts, never declared) and does not itself change when the contract changes', () => {
  const declaredFiles = contractA.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/shaping/src/self-check.ts'),
    'self-check.ts calls the validator; it does not embody it, so it fails the lockstep test and ' +
      'must not be declared for Contract A under A4(a)',
  )
})

test('A4(a) LOCKSTEP re-adjudication — vocabulary-membership.test.ts is UNDECLARED for Contract A: its assertions are about `involves` warnings, not about any specific enum member, so it need not change when the vocabulary changes', () => {
  assert.ok(
    !contractA.readers.includes(
      'plugins/foreman-line/foreman-config/tests/vocabulary-membership.test.ts',
    ),
    'vocabulary-membership.test.ts fails the lockstep test (A3(a)\'s "different basis" does not ' +
      'answer whether it must change when the contract changes) and must not be declared for ' +
      "Contract A under A4(a) — this edits Constraint 6's original declared list, ratified in A4(a)",
  )
})

test("A3(d)/A4(a) reverse control — Contract A: every declared reader within the sweep's scope appears in a signal, or carries a recorded sweep-blind ruling (allowlist is now EMPTY — A4(a) undeclared the only entry, self-check.ts, that needed it)", () => {
  const inScope = new Set(excludeOwnPackage(gitLsFilesInScope()))
  const allSignals = new Set([...contractAFieldSignal, ...contractAValueSignal])
  const sweepBlind = new Set<string>([
    // A4(a): self-check.ts (the previous, sole entry here) is UNDECLARED —
    // its "transitive consumption" basis does not survive the lockstep test.
    // Kept as an explicit (empty) allowlist, mirroring Contract B's, so a
    // future sweep-invisible declared reader must be added here deliberately
    // rather than silently failing this control.
  ])
  const declaredFiles = contractA.readers.flatMap(readerFiles).map(normalizeSeparators)
  for (const file of declaredFiles) {
    if (!inScope.has(file)) continue // outside the sweep's pathspec scope; nothing for it to see
    if (sweepBlind.has(file)) continue // explicit recorded ruling
    assert.ok(
      allSignals.has(file),
      `${file} is declared for Contract A, lies within the sweep's scope (${JSON.stringify(
        [...inScope].sort(),
      )}), and was found by neither signal, with no sweep-blind ruling recorded — A3(d)`,
    )
  }
})

/**
 * A4(c) — the reverse control's MISSING direction. The A3(d) control above
 * only checks declared readers that lie WITHIN the sweep's scope; a `if
 * (!inScope.has(file)) continue` silently exempts any OUT-OF-SCOPE
 * declaration from every check the sweep runs, so a spurious declaration
 * (proven by mutation below: appending `plugins/foreman-line/README.md` to
 * `contractA.readers`) passes this file's forward existsSync check, the
 * A2(d) schema loop, and both adjudication deepEquals above (which compare
 * *surfaced-minus-declared*, never *declared-minus-surfaced*) with nothing
 * noticing. `outOfScopeRuled` mirrors `sweepBlind` in the other direction:
 * every out-of-scope declaration must have an explicit ruling recorded here,
 * asserted by `deepEqual` (sorted both sides) against the actual
 * declared-but-out-of-scope set, so a new one fails until it is added
 * deliberately.
 */
test("A4(c) reverse control, missing direction — Contract A: every declared reader OUTSIDE the sweep's scope has an explicit outOfScopeRuled entry (after A4(a)/A5(b), only the .json restatement)", () => {
  const inScope = new Set(excludeOwnPackage(gitLsFilesInScope()))
  const outOfScopeRuled = [
    // A4(a)/A5(b): after undeclaring self-check.ts, vocabulary-membership.test.ts,
    // and validate.ts, the only Contract A reader outside the *.ts sweep
    // pathspec is the .json restatement, adjudicated in scope per A2(b)(4).
    'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
  ].sort()
  const actualOutOfScope = outOfScopeDeclared(contractA.readers, inScope)
  assert.deepEqual(
    actualOutOfScope,
    outOfScopeRuled,
    `Contract A has a declared reader outside the sweep's scope with no ruling recorded in ` +
      `outOfScopeRuled, or a previously-ruled entry disappeared. Actual: ` +
      `${JSON.stringify(actualOutOfScope)}`,
  )
})

// ---------------------------------------------------------------------------
// Contract B — routing-policy.yaml `classes` map keys (routing-class vocabulary)
// ---------------------------------------------------------------------------

const ROUTING_POLICY_HOME = '/routing-policy/'

// A2(b)(2), field-name signal.
const contractBFieldSignal = excludeOwnPackage(gitGrepFiles('routing_class'))
// A2(b)(2), vocabulary-values signal: the concrete enum literals, OR the
// exported identifier `ROUTING_CLASSES` — this is what surfaces
// spec-linter/src/index.ts, a barrel re-export that carries the vocabulary
// only by identifier and is invisible to the field-name signal above.
const contractBValueSignalRaw = excludeOwnPackage(
  gitGrepFiles(
    'boilerplate|standard-feature|architecture/risk|implementation/standard|ROUTING_CLASSES',
  ),
)
// A2(b)(3): routing-policy/src/* DEFINES this vocabulary; it is excluded from
// the surfaced-for-adjudication set below with that ruling stated explicitly,
// not silently dropped.
const contractBValueSignal = excludeHomePackage(contractBValueSignalRaw, ROUTING_POLICY_HOME)
const contractBHomePackageHits = contractBValueSignalRaw.filter((f) =>
  f.includes(ROUTING_POLICY_HOME),
)

test('A2(b)(1) positive control — Contract B: the field-name signal must find at least one already-declared reader, or the sweep is lying', () => {
  const declaredReader = 'plugins/foreman-line/spec-linter/src/schemas.ts'
  assert.ok(
    contractBFieldSignal.includes(declaredReader),
    `positive control failed: known-declared reader '${declaredReader}' was not found by the ` +
      `sweep (found=${JSON.stringify(contractBFieldSignal)}).`,
  )
})

test('A2(b)(3) Contract B — the home package is excluded from adjudication with the ruling stated, not silently dropped', () => {
  console.log(
    `Contract B sweep — value signal home-package hits (definer, not reader): ${JSON.stringify(contractBHomePackageHits)}`,
  )
  assert.ok(
    contractBHomePackageHits.length > 0,
    'expected the value signal to surface routing-policy/src/* as the vocabulary-defining home package',
  )
  for (const hit of contractBHomePackageHits) {
    assert.ok(hit.includes(ROUTING_POLICY_HOME))
  }
})

test('A2(b)(2)/(4) Contract B — every surfaced file is adjudicated; both signals; residual blindness stated', () => {
  const declared = new Set(
    contractB.readers.flatMap((r) => readerFiles(r).map(normalizeSeparators)),
  )
  const surfaced = new Set([...contractBFieldSignal, ...contractBValueSignal])
  const undeclared = [...surfaced].filter((f) => !declared.has(f)).sort()

  console.log(
    `Contract B sweep — field signal (routing_class): found=${JSON.stringify(contractBFieldSignal)}`,
  )
  console.log(
    `Contract B sweep — value signal (literal classes | ROUTING_CLASSES, home package excluded): found=${JSON.stringify(contractBValueSignal)}`,
  )
  console.log(`Contract B sweep — declared readers: ${JSON.stringify([...declared].sort())}`)
  console.log(
    `Contract B sweep — surfaced-but-undeclared (adjudicated below): ${JSON.stringify(undeclared)}`,
  )

  // Residual blindness: the field-name signal ('routing_class') is invisible
  // to spec-linter/src/index.ts, which carries the vocabulary only as the
  // ROUTING_CLASSES identifier — that file is caught only by the value
  // signal, which is why both signals are mandatory rather than either alone.
  // The value signal, symmetrically, is blind to any file that threads
  // routing_class as an opaque non-empty string without ever naming a
  // concrete class value or the ROUTING_CLASSES identifier (approval-cli
  // below is exactly that case, and was independently confirmed by dual
  // review to never branch on the vocabulary).

  // Ruling table — every file EITHER signal surfaced for Contract B, adjudicated
  // against the A5(a) ADDITIVE LOCKSTEP TEST (a file is a reader iff it must
  // change when ONE MEMBER IS ADDED to the contract's set; removal/rename are
  // not the test):
  //   spec-linter/src/schemas.ts       — LOCKSTEP: hardcodes the enum in the ajv schema. ADD a
  //                                      class and this file must change.
  //   spec-linter/src/types.ts         — LOCKSTEP: restates ROUTING_CLASSES in full, and is also
  //                                      a Contract A reader (VERIFICATION_CLASSES). ADD a class
  //                                      and this file must change.
  //   hybrid-routing/src/consumer-compatibility.ts — LOCKSTEP: validates routing_class against a
  //                                      local membership set. ADD a class and this file must change.
  //   dispatch/src/routing-eval/index.ts — A5(b), RE-ADJUDICATED and UNDECLARED (review E B1, the
  //                                      BLOCKER): imports `CLASS_NAMES` from the home package
  //                                      (`:30`) and builds a Set from it (`:552,556`) but holds no
  //                                      class literal of its own. ADD a class and this file is
  //                                      unchanged — fails the additive counterfactual under the
  //                                      same reading that ruled out cli.ts and index.ts. Moves
  //                                      from "declared" to "surfaced-but-undeclared".
  //   spec-linter/src/index.ts         — A4(a), RE-ADJUDICATED and UNDECLARED: a barrel re-export
  //                                      FORWARDS the ROUTING_CLASSES identifier; it does not itself
  //                                      change when the vocabulary's members change (only the
  //                                      identifier it re-exports would, unaffected by member
  //                                      additions). Fails the lockstep test. Moves from "declared"
  //                                      to "surfaced-but-undeclared" (caught only by the value
  //                                      signal — identifier-blindness, A2(b)(2)).
  //   spec-linter/src/testing.ts       — A3(a)/A4(a), RE-ADJUDICATED and UNDECLARED: hardcodes
  //                                      'standard-feature' as one canonical sample value — need
  //                                      not change when the vocabulary changes. Sample data, not
  //                                      readership. Moves from "declared" to
  //                                      "surfaced-but-undeclared".
  //   dispatch/src/approval-cli/index.ts — NOT declared (LOCKSTEP-negative): validates routing_class
  //                                      as a non-empty string and threads it through opaquely; zero
  //                                      references to any class name or ROUTING_CLASSES — need not
  //                                      change when a class is added (coordinator's approval-cli
  //                                      ruling, upheld by both reviewers in both directions).
  //   skill-injection/src/cli.ts       — NOT declared (LOCKSTEP-negative): 'routing_class:' appears
  //                                      only in a comment describing what a spec would inject at
  //                                      dispatch time; the comment does not need to change per class.
  //   spec-linter/src/grandfather.ts   — NOT declared (LOCKSTEP-negative): 'routing_class' names a
  //                                      WAIVABLE FIELD and 'standard-feature' appears only in a
  //                                      comment glossing the legacy value; the pinned legacy waiver
  //                                      value ('standard') pre-dates and is disjoint from the
  //                                      current four-value enum, so this file is decoupled from the
  //                                      current vocabulary and need not change with it.
  //   verification/src/pipeline/index.ts — NOT declared (LOCKSTEP-negative): 'boilerplate' appears
  //                                      only inside a prose status-line string ("the routing
  //                                      policy's boilerplate class"); nothing reads or branches on
  //                                      the value, so it need not change if a class is added/removed.
  //
  // A3(a)/A4(a) also re-adjudicated (outside the sweep's pathspec, absent from
  // `surfaced`, not asserted against here): shaping/tests/helpers.ts,
  // approval/tests/helpers.ts, registration/tests/helpers.ts,
  // projection/tests/helpers.ts — NOT readers under lockstep either (see the
  // Contract A ruling table above for the identical reasoning; the same four
  // files were reconsidered for both contracts).
  const expectedUndeclared = [
    'plugins/foreman-line/dispatch/src/approval-cli/index.ts',
    'plugins/foreman-line/dispatch/src/routing-eval/index.ts',
    'plugins/foreman-line/skill-injection/src/cli.ts',
    'plugins/foreman-line/spec-linter/src/grandfather.ts',
    'plugins/foreman-line/spec-linter/src/index.ts',
    'plugins/foreman-line/spec-linter/src/testing.ts',
    'plugins/foreman-line/verification/src/pipeline/index.ts',
  ].sort()
  assert.deepEqual(
    undeclared,
    expectedUndeclared,
    `Contract B sweep surfaced a file with no ruling recorded above, or a previously-adjudicated ` +
      `file disappeared. Surfaced-but-undeclared: ${JSON.stringify(undeclared)}`,
  )
})

test('A2(b)(4) Contract B — the .json restatement is adjudicated (out of the *.ts glob by construction)', () => {
  assert.ok(
    contractB.readers.includes(
      'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
    ),
    'spec-frontmatter.schema.json restates the routing_class enum and must be declared',
  )
})

test('A3(a) Contract B — testing.ts is re-adjudicated and UNDECLARED (sample data, not a reader; also LOCKSTEP-negative under A4(a))', () => {
  const declaredFiles = contractB.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/spec-linter/src/testing.ts'),
    'testing.ts contains one sample literal, not an enumeration/validation/index, and must not be ' +
      'declared for Contract B under the A3(a)/A4(a) criteria',
  )
})

test("A4(a) LOCKSTEP re-adjudication — index.ts is UNDECLARED for Contract B: a barrel re-export forwards the ROUTING_CLASSES identifier; it does not itself change when the vocabulary's members change", () => {
  const declaredFiles = contractB.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/spec-linter/src/index.ts'),
    'index.ts merely re-exports the ROUTING_CLASSES identifier; adding/removing a class does not ' +
      'require this file to change, so it fails the lockstep test and must not be declared for ' +
      'Contract B under A4(a)',
  )
})

test('A5(b) LOCKSTEP re-adjudication (additive) — routing-eval/index.ts is UNDECLARED for Contract B: it imports CLASS_NAMES from the home package and holds no class literal of its own, so adding a class does not change it', () => {
  const declaredFiles = contractB.readers.flatMap(readerFiles)
  assert.ok(
    !declaredFiles.includes('plugins/foreman-line/dispatch/src/routing-eval/index.ts'),
    'routing-eval/index.ts imports CLASS_NAMES and builds a Set from it but never restates a member ' +
      'itself, so it fails the additive lockstep test and must not be declared for Contract B under ' +
      "A5(b) — this edits Constraint 6's original declared list, ratified in A5(b)",
  )
})

test("A3(d) reverse control — Contract B: every declared reader within the sweep's scope appears in a signal, or carries a recorded sweep-blind ruling", () => {
  const inScope = new Set(excludeOwnPackage(gitLsFilesInScope()))
  const allSignals = new Set([...contractBFieldSignal, ...contractBValueSignal])
  const sweepBlind = new Set<string>([
    // No Contract B readers currently need this ruling; kept as an explicit
    // (empty) allowlist so a future sweep-invisible reader must be added here
    // deliberately rather than silently failing the control.
  ])
  const declaredFiles = contractB.readers.flatMap(readerFiles).map(normalizeSeparators)
  for (const file of declaredFiles) {
    if (!inScope.has(file)) continue // outside the sweep's pathspec scope; nothing for it to see
    if (sweepBlind.has(file)) continue // explicit recorded ruling
    assert.ok(
      allSignals.has(file),
      `${file} is declared for Contract B, lies within the sweep's scope (${JSON.stringify(
        [...inScope].sort(),
      )}), and was found by neither signal, with no sweep-blind ruling recorded — A3(d)`,
    )
  }
})

test("A4(c) reverse control, missing direction — Contract B: every declared reader OUTSIDE the sweep's scope has an explicit outOfScopeRuled entry (after A4(a)/A5(b), only the .json restatement)", () => {
  const inScope = new Set(excludeOwnPackage(gitLsFilesInScope()))
  const outOfScopeRuled = [
    // A4(a)/A5(b): after undeclaring index.ts and routing-eval/index.ts, the
    // only Contract B reader outside the *.ts sweep pathspec is the .json
    // restatement, adjudicated in scope per A2(b)(4).
    'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
  ].sort()
  const actualOutOfScope = outOfScopeDeclared(contractB.readers, inScope)
  assert.deepEqual(
    actualOutOfScope,
    outOfScopeRuled,
    `Contract B has a declared reader outside the sweep's scope with no ruling recorded in ` +
      `outOfScopeRuled, or a previously-ruled entry disappeared. Actual: ` +
      `${JSON.stringify(actualOutOfScope)}`,
  )
})

/**
 * A4(c) — MUTATION PROOF. The reverse control's missing direction, proven by
 * the exact mutation the amendment specifies: appending
 * `plugins/foreman-line/README.md` (a real file, not a reader, outside
 * `*\/src/*.ts`) to `contractB.readers`. The `outOfScopeRuled` deepEqual test
 * above must fail against this mutated entry — proving it actually catches
 * a spurious out-of-scope declaration. `mutatedReaders` is a local array
 * copy: `contractB.readers` (the real, frozen registry array) is never
 * touched, so there is nothing to revert here — I3 drops the `finally` block
 * that used to assert that fact, because asserting "the real registry is
 * unchanged" is a fact about the real registry, not a revert of anything
 * this test did.
 */
test('A4(c) MUTATION: appending a spurious out-of-scope reader to contractB.readers fails the outOfScopeRuled deepEqual test exactly', () => {
  const spurious = 'plugins/foreman-line/README.md'
  const mutatedReaders = [...contractB.readers, spurious]
  const inScope = new Set(excludeOwnPackage(gitLsFilesInScope()))
  const outOfScopeRuled = [
    'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
  ].sort()
  const actualOutOfScope = outOfScopeDeclared(mutatedReaders, inScope)
  assert.notDeepEqual(
    actualOutOfScope,
    outOfScopeRuled,
    'mutation was supposed to add an unruled out-of-scope declaration and make this comparison ' +
      'fail, but it still matched — the reverse control cannot see a spurious declaration',
  )
  assert.ok(
    actualOutOfScope.includes(normalizeSeparators(spurious)),
    'the spurious README.md entry must appear in the mutated out-of-scope set',
  )
})

test('Contract B MUTATION: deleting the genuine consumer reader is detected by the sweep', () => {
  const genuine = 'plugins/foreman-line/hybrid-routing/src/consumer-compatibility.ts'
  assert.ok(
    contractB.readers.includes(genuine),
    'the additive lockstep consumer must remain declared in the real Contract B registry',
  )
  const mutatedReaders = contractB.readers.filter((reader) => reader !== genuine)
  const declared = new Set(mutatedReaders.flatMap((reader) => readerFiles(reader)))
  const surfaced = new Set([...contractBFieldSignal, ...contractBValueSignal])
  const surfacedButUndeclared = [...surfaced].filter((file) => !declared.has(file))
  assert.ok(
    surfacedButUndeclared.includes(genuine),
    'deleting the real consumer reader must leave its on-disk lockstep surface surfaced but undeclared',
  )
})

// ---------------------------------------------------------------------------
// F1 (A2(d)): every REAL registry entry, not only fixtures, is schema-valid.
// ---------------------------------------------------------------------------

test('A2(d)/F1: every entry in the real registry validates against contractReaderEntrySchema', () => {
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(contractReaderEntrySchema as SchemaObject)
  for (const entry of registry) {
    const ok = validate(entry)
    assert.ok(
      ok,
      `registry entry '${entry.contract}' failed schema validation: ${JSON.stringify(validate.errors)}`,
    )
  }
})
