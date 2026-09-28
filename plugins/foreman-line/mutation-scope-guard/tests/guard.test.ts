import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { MutationScopeError } from '../src/errors.js'
import { postHocCheck, preflightCheck, type ScopeEnvelope } from '../src/guard.js'
import { matchEntry } from '../src/match.js'

const surfaces = [
  'plugins/foreman-line/mutation-scope-guard/**',
  'plugins/foreman-line/docs/specs/active/wf-p27-mutation-scope-guard.md',
  'plugins/foreman-line/verification/src/ratified-packages.ts',
]

// ── AC2: preflight dispatch-time check ──────────────────────────────────────

test('AC2: allowedFiles entry not authorized by surfaces: refuses with SCOPE_ENVELOPE_MISMATCH', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: [
      'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
      'plugins/foreman-line/role-authority/src/roles.ts', // not authorized by surfaces
    ],
    forbiddenSurfaces: [],
  }
  assert.throws(
    () => preflightCheck(envelope, surfaces),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'SCOPE_ENVELOPE_MISMATCH')
      assert.deepEqual(err.paths, ['plugins/foreman-line/role-authority/src/roles.ts'])
      return true
    },
  )
})

test('AC2: every allowedFiles entry authorized by surfaces: proceeds without throwing', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: [
      'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
      'plugins/foreman-line/verification/src/ratified-packages.ts',
    ],
    forbiddenSurfaces: [],
  }
  assert.doesNotThrow(() => preflightCheck(envelope, surfaces))
})

// ── AC2 required regression fixture: pattern-aware preflight ────────────────
//
// Exact reproduction from the amended spec, "stated as an exact reproduction
// because it shipped green once": allowedFiles: ['pkg/**'] against
// surfaces: ['pkg/*'] must be REFUSED at preflight, not accepted, because
// checking 'pkg/**' AS A PATH against 'pkg/*' reads as "one level below
// pkg" (true) while as a PATTERN it grants unlimited depth -- the escape.

test('AC2 regression: pkg/** in allowedFiles against surfaces: [pkg/*] throws SCOPE_ENVELOPE_MISMATCH', () => {
  assert.throws(
    () => preflightCheck({ allowedFiles: ['pkg/**'], forbiddenSurfaces: [] }, ['pkg/*']),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'SCOPE_ENVELOPE_MISMATCH')
      return true
    },
  )
})

test('AC2 regression: the widening this prevents -- pkg/a/b/c.ts is genuinely NOT authorized by surfaces: [pkg/*]', () => {
  // Companion assertion: had the mismatch above not been thrown, postHocCheck
  // would have accepted this path under allowedFiles: ['pkg/**'], even
  // though the surfaces grant never authorized anything beyond one level.
  assert.equal(matchEntry('pkg/a/b/c.ts', 'pkg/*'), null)
})

test('AC2 regression: sound direction -- allowedFiles: [pkg/*] IS authorized by surfaces: [pkg/**]', () => {
  assert.doesNotThrow(() =>
    preflightCheck({ allowedFiles: ['pkg/*'], forbiddenSurfaces: [] }, ['pkg/**']),
  )
})

test('AC2 regression: sound direction -- allowedFiles: [pkg/a/**] IS authorized by surfaces: [pkg/**]', () => {
  assert.doesNotThrow(() =>
    preflightCheck({ allowedFiles: ['pkg/a/**'], forbiddenSurfaces: [] }, ['pkg/**']),
  )
})

// ── AC3: only an IDENTICAL entry is a contradiction; containment is legal
// refinement (spec amendment 2026-09-02) ────────────────────────────────────

test('AC3(a): the same literal entry in both lists refuses with SCOPE_ENVELOPE_CONTRADICTION', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ['plugins/foreman-line/mutation-scope-guard/src/guard.ts'],
    forbiddenSurfaces: ['plugins/foreman-line/mutation-scope-guard/src/guard.ts'],
  }
  assert.throws(
    () => preflightCheck(envelope, surfaces),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'SCOPE_ENVELOPE_CONTRADICTION')
      assert.notEqual(err.code, 'OUT_OF_SCOPE')
      return true
    },
  )
})

test('AC3(b): containment (forbidden entry inside an allowed region) does NOT throw -- refinement, not malformation', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ['plugins/foreman-line/mutation-scope-guard/**'],
    forbiddenSurfaces: ['plugins/foreman-line/mutation-scope-guard/src/secret.ts'],
  }
  assert.doesNotThrow(() => preflightCheck(envelope, surfaces))
})

test('AC3(c): a wholly disjoint envelope does not throw SCOPE_ENVELOPE_CONTRADICTION', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ['plugins/foreman-line/mutation-scope-guard/src/guard.ts'],
    forbiddenSurfaces: ['plugins/foreman-line/role-authority/src/roles.ts'],
  }
  assert.doesNotThrow(() => preflightCheck(envelope, surfaces))
})

// ── AC4(a): forbidden-wins must be provably load-bearing ────────────────────
//
// The fixture below is the SAME allowedFiles/path pair in both tests -- only
// forbiddenSurfaces differs. It survives preflight (per AC3(b): containment
// is legal) and allowedFiles DOES authorize the path, so removing the
// forbidden-wins branch in postHocCheck would flip REJECT to ACCEPT. The pair
// is the proof: asserting only "this throws OUT_OF_SCOPE" would prove
// nothing, since a path failing the allowedFiles check anyway looks
// identical from the outside.

const ac4aAllowedFiles = ['plugins/foreman-line/mutation-scope-guard/**']
const ac4aPath = 'plugins/foreman-line/mutation-scope-guard/src/secret.ts'

test('AC4(a): forbidden wins even though allowedFiles authorizes the path (negative half of the pair)', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ac4aAllowedFiles,
    forbiddenSurfaces: [ac4aPath],
  }
  // Must survive preflight -- this is exactly AC3(b)'s containment fixture.
  assert.doesNotThrow(() => preflightCheck(envelope, surfaces))
  assert.throws(
    () => postHocCheck(envelope, [ac4aPath]),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'OUT_OF_SCOPE')
      return true
    },
  )
})

test('AC4(a): positive control -- same path, same allowedFiles, forbiddenSurfaces: [] is accepted', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ac4aAllowedFiles,
    forbiddenSurfaces: [],
  }
  assert.doesNotThrow(() => preflightCheck(envelope, surfaces))
  const result = postHocCheck(envelope, [ac4aPath])
  assert.deepEqual(result.changedPaths, [ac4aPath])
})

// ── AC2b: malformed paths and entries fail closed ───────────────────────────
//
// Both reviewers showed the forbidden-wins carve-out is evaded by
// denormalized spellings against forbiddenSurfaces: ['pkg/secret.ts'] under
// allowedFiles: ['pkg/**']. Each reproduction below is an exact reviewer
// bypass and must throw MALFORMED_PATH, checked before any matching.

const ac2bAllowedFiles = ['pkg/**']
const ac2bForbiddenSurfaces = ['pkg/secret.ts']

function assertMalformed(changedPath: string): void {
  assert.throws(
    () =>
      postHocCheck({ allowedFiles: ac2bAllowedFiles, forbiddenSurfaces: ac2bForbiddenSurfaces }, [
        changedPath,
      ]),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'MALFORMED_PATH')
      return true
    },
  )
}

test("AC2b: 'pkg/./secret.ts' (dot segment) throws MALFORMED_PATH rather than being accepted", () => {
  assertMalformed('pkg/./secret.ts')
})

test("AC2b: 'pkg//secret.ts' (empty segment) throws MALFORMED_PATH rather than being accepted", () => {
  assertMalformed('pkg//secret.ts')
})

test("AC2b: 'pkg/../pkg/secret.ts' (dot-dot segment) throws MALFORMED_PATH rather than being accepted", () => {
  assertMalformed('pkg/../pkg/secret.ts')
})

test("AC2b: 'pkg/../../../etc/passwd' (dot-dot escape) throws MALFORMED_PATH rather than being accepted", () => {
  assertMalformed('pkg/../../../etc/passwd')
})

test("AC2b: 'pkg\\\\secret.ts' (backslash) throws MALFORMED_PATH rather than being accepted", () => {
  assertMalformed('pkg\\secret.ts')
})

test('AC2b: a well-formed control (pkg/ordinary.ts) is unaffected and still accepted', () => {
  const result = postHocCheck(
    { allowedFiles: ac2bAllowedFiles, forbiddenSurfaces: ac2bForbiddenSurfaces },
    ['pkg/ordinary.ts'],
  )
  assert.deepEqual(result.changedPaths, ['pkg/ordinary.ts'])
})

test('AC2b: preflightCheck also rejects a malformed allowedFiles entry before any matching', () => {
  assert.throws(
    () => preflightCheck({ allowedFiles: ['pkg/../x'], forbiddenSurfaces: [] }, ['pkg/**']),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'MALFORMED_PATH')
      return true
    },
  )
})

// ── AC2c: off-vocabulary globs are malformed, and the two untested
// authorization branches are pinned ─────────────────────────────────────────

test('AC2c(a): off-vocabulary star/brace entries in forbiddenSurfaces throw MALFORMED_PATH, forbidding nothing silently no longer happens', () => {
  const offVocabularyEntries = ['pkg/*.ts', 'pkg/**/*.ts', '*.ts', 'pkg/sec*', 'pkg/{a,b}.ts']
  for (const entry of offVocabularyEntries) {
    assert.throws(
      () => postHocCheck({ allowedFiles: ['pkg/**'], forbiddenSurfaces: [entry] }, ['pkg/a.ts']),
      (err: unknown) => {
        assert.ok(err instanceof MutationScopeError)
        assert.equal(err.code, 'MALFORMED_PATH')
        return true
      },
      `expected '${entry}' in forbiddenSurfaces to throw MALFORMED_PATH`,
    )
  }
})

test('AC2c(a): the same off-vocabulary entries throw MALFORMED_PATH in allowedFiles and in surfaces: too', () => {
  const offVocabularyEntries = ['pkg/*.ts', 'pkg/**/*.ts', '*.ts', 'pkg/sec*', 'pkg/{a,b}.ts']
  for (const entry of offVocabularyEntries) {
    assert.throws(
      () => preflightCheck({ allowedFiles: [entry], forbiddenSurfaces: [] }, ['pkg/**']),
      (err: unknown) => {
        assert.ok(err instanceof MutationScopeError)
        assert.equal(err.code, 'MALFORMED_PATH')
        return true
      },
      `expected '${entry}' in allowedFiles to throw MALFORMED_PATH`,
    )
    assert.throws(
      () => preflightCheck({ allowedFiles: ['pkg/x.ts'], forbiddenSurfaces: [] }, [entry]),
      (err: unknown) => {
        assert.ok(err instanceof MutationScopeError)
        assert.equal(err.code, 'MALFORMED_PATH')
        return true
      },
      `expected '${entry}' in surfaces: to throw MALFORMED_PATH`,
    )
  }
})

test('AC2c(b): a trailing-slash entry (plugins/foreman-line/dispatch/) throws MALFORMED_PATH', () => {
  assert.throws(
    () =>
      preflightCheck({ allowedFiles: ['plugins/foreman-line/dispatch/'], forbiddenSurfaces: [] }, [
        'plugins/foreman-line/dispatch/**',
      ]),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'MALFORMED_PATH')
      return true
    },
  )
})

test('AC2c(c): sibling-prefix negative -- pkgextra/** must NOT be authorized by surfaces: [pkg/**] (fail-open mutant)', () => {
  assert.throws(
    () => preflightCheck({ allowedFiles: ['pkgextra/**'], forbiddenSurfaces: [] }, ['pkg/**']),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'SCOPE_ENVELOPE_MISMATCH')
      return true
    },
  )
})

test('AC2c(d): the X/*-under-literal-X/* disjunct -- allowedFiles: [pkg/*] IS authorized by surfaces: [pkg/*] (fail-closed mutant)', () => {
  assert.doesNotThrow(() =>
    preflightCheck({ allowedFiles: ['pkg/*'], forbiddenSurfaces: [] }, ['pkg/*']),
  )
})

// ── AC4(b)-(d): post-hoc fail-closed empty array ─────────────────────────────

test('AC4(b): a path matching no allowedFiles entry throws OUT_OF_SCOPE', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ['plugins/foreman-line/mutation-scope-guard/src/guard.ts'],
    forbiddenSurfaces: [],
  }
  assert.throws(
    () => postHocCheck(envelope, ['plugins/foreman-line/role-authority/src/roles.ts']),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'OUT_OF_SCOPE')
      return true
    },
  )
})

test('AC4(c): allowedFiles: [] rejects every changed path -- "may change nothing", not unconstrained', () => {
  const envelope: ScopeEnvelope = { allowedFiles: [], forbiddenSurfaces: [] }
  const changed = [
    'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
  ]
  assert.throws(
    () => postHocCheck(envelope, changed),
    (err: unknown) => {
      assert.ok(err instanceof MutationScopeError)
      assert.equal(err.code, 'OUT_OF_SCOPE')
      // every one of the changed paths, not merely the first
      assert.deepEqual([...err.paths].sort(), [...changed].sort())
      return true
    },
  )
})

test('AC4(d): allowedFiles: [] with zero actually-changed paths does not throw', () => {
  const envelope: ScopeEnvelope = { allowedFiles: [], forbiddenSurfaces: [] }
  assert.doesNotThrow(() => postHocCheck(envelope, []))
})

// ── AC5: accept path returns a populated result object ──────────────────────

test('AC5: an accept fixture returns changed paths, authorizing entry, and matcher arm per path', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: [
      'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
      'plugins/foreman-line/mutation-scope-guard/src/match.ts',
    ],
    forbiddenSurfaces: [],
  }
  const changed = [
    'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
  ]
  const result = postHocCheck(envelope, changed)
  assert.equal(result.authorizations.length, 2)
  for (const a of result.authorizations) {
    assert.ok(envelope.allowedFiles.includes(a.entry))
    assert.equal(a.arm, 'exact')
  }
})

test('AC5: returned changed-path list set-equals the input under a swap mutation (lesson #73)', () => {
  const envelope: ScopeEnvelope = {
    allowedFiles: ['plugins/foreman-line/mutation-scope-guard/**'],
    forbiddenSurfaces: [],
  }
  // Same COUNT, different MEMBERSHIP than a naive "first N" implementation
  // might assume -- a length check alone cannot distinguish a swapped set.
  const changed = [
    'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
    'plugins/foreman-line/mutation-scope-guard/tests/match.test.ts',
  ]
  const result = postHocCheck(envelope, changed)
  assert.deepEqual(new Set(result.changedPaths), new Set(changed))
  assert.equal(result.changedPaths.length, changed.length)
})

// ── AC6: typed, coded refusal shape ──────────────────────────────────────────

test('AC6: MutationScopeError carries a code field restricted to the four values, plus violating paths', () => {
  const outOfScope = new MutationScopeError('OUT_OF_SCOPE', ['a/b.ts'], 'x')
  const mismatch = new MutationScopeError('SCOPE_ENVELOPE_MISMATCH', ['c/d.ts'], 'y')
  const contradiction = new MutationScopeError('SCOPE_ENVELOPE_CONTRADICTION', ['e/f.ts'], 'z')
  const malformed = new MutationScopeError('MALFORMED_PATH', ['g/../h.ts'], 'w')

  for (const err of [outOfScope, mismatch, contradiction, malformed]) {
    assert.ok(err instanceof Error)
    assert.ok(err instanceof MutationScopeError)
    assert.ok(Array.isArray(err.paths))
    assert.ok(err.paths.length > 0)
  }
  assert.equal(outOfScope.code, 'OUT_OF_SCOPE')
  assert.equal(mismatch.code, 'SCOPE_ENVELOPE_MISMATCH')
  assert.equal(contradiction.code, 'SCOPE_ENVELOPE_CONTRADICTION')
  assert.equal(malformed.code, 'MALFORMED_PATH')
})

// ── AC7: D19 allowlist membership, re-verified via the audit's OWN rule ─────
//
// Per coordinator ruling: the audit's own package-discovery criterion
// (verification/src/d19-audit.ts's `discoverPackages`, a directory containing
// src/) is not exported, so this test reuses the rule by invoking the D19
// audit itself as a subprocess and asserting it passes (exit 0) with this
// package present -- rather than re-implementing a second, driftable
// derivation of the same set (the one-concept-two-homes shape this parcel
// exists to prevent).
const testFileDir = dirname(fileURLToPath(import.meta.url))
// tests/ -> mutation-scope-guard/ -> plugins/foreman-line/ : two hops, well
// under the D19 audit's own >=3-segment "walk" threshold, and this file
// lives under tests/, which that audit excludes from its own sweep anyway.
const pluginRoot = resolve(testFileDir, '..', '..')
const d19AuditEntry = join(pluginRoot, 'verification', 'src', 'd19-audit.ts')

test('AC7: mutation-scope-guard is present on disk with a src/ directory', () => {
  // Re-derived mechanically, not copied: this package's own src/ directory
  // must exist for the D19 audit's disk-driven discovery to see it at all.
  assert.ok(statSync(join(pluginRoot, 'mutation-scope-guard', 'src')).isDirectory())
})

test('AC7: RATIFIED_PACKAGES contains mutation-scope-guard', async () => {
  const { RATIFIED_PACKAGES } = await import('../../verification/src/ratified-packages.js')
  assert.ok((RATIFIED_PACKAGES as readonly string[]).includes('mutation-scope-guard'))
})

test('AC7: the D19 audit itself passes (exit 0) with mutation-scope-guard on disk and ratified', () => {
  // Explicit cwd argument (lesson #72): never rely on an inherited working
  // directory for a sweep whose result the test asserts on.
  let stdout = ''
  let failed = false
  try {
    stdout = execFileSync('npx', ['tsx', d19AuditEntry, '--plugin-root', pluginRoot], {
      cwd: pluginRoot,
      encoding: 'utf-8',
      shell: true,
      windowsHide: true,
    })
  } catch (err) {
    failed = true
    stdout = String((err as { stdout?: unknown }).stdout ?? err)
  }
  assert.equal(
    failed,
    false,
    `D19 audit did not pass with mutation-scope-guard ratified:\n${stdout}`,
  )
})
