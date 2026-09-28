/**
 * CLOSE-P2: grandfather allowlist boundary tests.
 *
 * - Membership is pinned by SET EQUALITY on basenames and by the exact
 *   per-file field/value waiver pins (invariant pins, never byte pins —
 *   STANDING-CONSTRAINTS #12): silently adding, removing, or re-scoping an
 *   entry fails this suite.
 * - Waivers apply ONLY under the `done/` parent-directory signal (rework R1a)
 *   and ONLY for the pinned historical literal values (rework R1b).
 * - Waivers are class-scoped: a grandfathered file with any NON-waived
 *   violation still fails; a non-listed file gets full validation including
 *   the PROFILE_NAMES enum.
 * - data_classification (schematized here, W4-P5 ruling): optional; non-empty,
 *   non-whitespace-only string; empty/null rejected for every spec.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  GRANDFATHER_ALLOWLIST,
  GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY,
  WAIVER_KINDS,
  waiversFor,
} from '../src/grandfather.js'
import { sampleSpecFrontmatter } from '../src/testing.js'
import { parseFrontmatter, validateSpecFrontmatter } from '../src/validate.js'

// --- allowlist membership + value-pin invariants ------------------------------

const EXPECTED_MEMBERSHIP: Readonly<
  Record<string, readonly { kind: string; field: string; allowedValues: readonly unknown[] }[]>
> = {
  'P1-permission-profile-registry-schema.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: [null] },
  ],
  'P2-dispatch-order-permission-profile-field.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: [null] },
  ],
  'P3-dispatch-time-emitter.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: [null] },
  ],
  'W0-P5-skill-injection-matrix-schema-validator.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: [null] },
  ],
  'W4-P2-docspine-ci-hook.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: ['builder'] },
  ],
  'SCAF-P4-exit-vehicle.md': [
    { kind: 'permission-profile-legacy', field: 'permission_profile', allowedValues: ['builder'] },
  ],
  'W1-P2-epic-story-projection.md': [
    { kind: 'routing-class-legacy', field: 'routing_class', allowedValues: ['standard'] },
  ],
  'W1-P3-human-approval-flow.md': [
    { kind: 'routing-class-legacy', field: 'routing_class', allowedValues: ['standard'] },
  ],
}

test('allowlist contains exactly the 8 expected basenames (set equality)', () => {
  const actual = new Set(Object.keys(GRANDFATHER_ALLOWLIST))
  const expected = new Set(Object.keys(EXPECTED_MEMBERSHIP))
  assert.deepEqual(actual, expected)
})

test('each grandfathered basename maps to exactly its inventoried, value-pinned waiver(s)', () => {
  for (const [name, expected] of Object.entries(EXPECTED_MEMBERSHIP)) {
    const actual = waiversFor(name).map((w) => ({
      kind: w.kind,
      field: w.field,
      allowedValues: [...w.allowedValues],
    }))
    assert.deepEqual(actual, expected, name)
  }
})

test('exactly three waiver kinds exist', () => {
  assert.deepEqual([...WAIVER_KINDS].sort(), [
    'permission-profile-legacy',
    'routing-class-legacy',
    'verification-class-missing',
  ])
})

test('a basename not on the allowlist has no waivers', () => {
  assert.deepEqual([...waiversFor('CLOSE-P99-not-a-real-spec.md')], [])
})

// --- helpers -------------------------------------------------------------------

function doc(overrides: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = { ...sampleSpecFrontmatter }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete base[key]
    } else {
      base[key] = value
    }
  }
  return base
}

const IN_DONE = { parentDirName: 'done' } as const
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')

function collectParseableDoneSpecs(directory: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectParseableDoneSpecs(path))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const ref = relative(repoRoot, path).split('\\').join('/')
      if (ref.startsWith('plugins/synced/')) continue
      if (ref.startsWith('plugins/cache/')) continue
      if (!ref.includes('/docs/specs/done/') && !ref.startsWith('docs/specs/done/')) continue
      const doc = parseFrontmatter(readFileSync(path, 'utf8'))
      if (doc !== null && typeof doc === 'object' && !Array.isArray(doc)) {
        if (!Object.hasOwn(doc, 'verification_class')) results.push(ref)
      }
    }
  }
  return results
}

function inventoryDoc(ref: string): Record<string, unknown> {
  const path = join(repoRoot, ...ref.split('/'))
  const doc = parseFrontmatter(readFileSync(path, 'utf8'))
  assert.notEqual(doc, null, `${ref}: no parseable frontmatter`)
  assert.equal(typeof doc, 'object', `${ref}: frontmatter must be an object`)
  assert.ok(!Array.isArray(doc), `${ref}: frontmatter must not be an array`)
  return doc as Record<string, unknown>
}

// --- non-grandfathered files: full validation ------------------------------------

test("NEW (non-allowlisted) filename with permission_profile: 'builder' is invalid", () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'CLOSE-P99-new-spec.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test('NEW (non-allowlisted) filename with permission_profile: null is invalid', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: null }), {
    basename: 'CLOSE-P99-new-spec.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test('no basename supplied -> full validation (waivers require an explicit basename)', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), IN_DONE)
  assert.equal(result.valid, false)
})

// --- R1a: done/ parent-directory scoping (reviewer probe 1) ----------------------

test('R1a regression: grandfathered basename OUTSIDE done/ (scratch dir) gets no waiver', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'P1-permission-profile-registry-schema.md',
    parentDirName: 'scratch',
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test('R1a regression: grandfathered basename in active/ gets no waiver', () => {
  const result = validateSpecFrontmatter(doc({ routing_class: 'standard' }), {
    basename: 'W1-P2-epic-story-projection.md',
    parentDirName: 'active',
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/routing_class')))
})

test('R1a: no parentDirName supplied -> no waiver (unit-level calls never waive without the signal)', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'SCAF-P4-exit-vehicle.md',
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

// --- R1b: value pinning (reviewer probe 2) ---------------------------------------

test('R1b regression: grandfathered file with a NON-historical value is invalid', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'totally-made-up-profile' }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test("R1b: null-pinned file (P1) does NOT get the 'builder' value waived", () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'P1-permission-profile-registry-schema.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test('R1b: builder-pinned file (SCAF-P4) does NOT get the null value waived', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: null }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

test("R1b: routing-class waiver covers exactly 'standard', not other invalid values", () => {
  const result = validateSpecFrontmatter(doc({ routing_class: 'totally-made-up-class' }), {
    basename: 'W1-P2-epic-story-projection.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/routing_class')))
})

// --- waiver happy paths (done/ + historical value) --------------------------------

test('grandfathered basename in done/: pinned null profile -> valid, grandfathered warning', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: null }), {
    basename: 'P1-permission-profile-registry-schema.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, true, JSON.stringify(result.errors))
  assert.ok(result.warnings.some((w) => w.startsWith('grandfathered (permission-profile-legacy):')))
})

test("grandfathered basename in done/: pinned 'builder' profile -> valid, grandfathered warning", () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, true, JSON.stringify(result.errors))
  assert.ok(result.warnings.some((w) => w.startsWith('grandfathered (permission-profile-legacy):')))
})

test("grandfathered basename in done/: pinned routing_class 'standard' -> valid, grandfathered warning", () => {
  const result = validateSpecFrontmatter(doc({ routing_class: 'standard' }), {
    basename: 'W1-P2-epic-story-projection.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, true, JSON.stringify(result.errors))
  assert.ok(result.warnings.some((w) => w.startsWith('grandfathered (routing-class-legacy):')))
})

// --- class scoping ----------------------------------------------------------------

test('grandfathered basename with a NON-waived violation (missing risk) still fails', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder', risk: undefined }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('risk')))
})

test('waiver kinds do not cross: permission-profile-legacy file gets no routing_class waiver', () => {
  const result = validateSpecFrontmatter(doc({ routing_class: 'standard' }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/routing_class')))
})

test('routing-class-legacy file gets no permission_profile waiver', () => {
  const result = validateSpecFrontmatter(doc({ permission_profile: 'builder' }), {
    basename: 'W1-P2-epic-story-projection.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/permission_profile')))
})

// --- GSO-P1 verification_class missing-field waiver --------------------------

test('GSO-P1 inventory is source-frozen at exactly 42 identities', () => {
  assert.equal(GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY.length, 42)
  assert.equal(new Set(GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY).size, 42)
})

test('GSO-P1 inventory reconciliation: every frozen identity is derived from disk', () => {
  const derived = new Set(collectParseableDoneSpecs(repoRoot))
  for (const ref of GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY) {
    assert.ok(derived.has(ref), `frozen identity is absent from the derived set: ${ref}`)
  }
})

test('GSO-P1 inventory reconciliation: every derived identity is frozen', () => {
  const frozen = new Set<string>(GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY)
  for (const ref of collectParseableDoneSpecs(repoRoot)) {
    assert.ok(frozen.has(ref), `derived identity is absent from the frozen inventory: ${ref}`)
  }
})

test('GSO-P1 every exact inventoried done document waives only its missing verification_class field', () => {
  for (const ref of GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY) {
    const document = inventoryDoc(ref)
    assert.ok(!Object.hasOwn(document, 'verification_class'), `${ref}: field must be absent`)
    const result = validateSpecFrontmatter(document, {
      documentRef: ref,
      basename: ref.slice(ref.lastIndexOf('/') + 1),
      parentDirName: 'done',
    })
    assert.deepEqual(result.errors, [], ref)
    assert.equal(
      result.warnings.filter((warning) =>
        warning.startsWith('grandfathered (verification-class-missing):'),
      ).length,
      1,
      ref,
    )
  }
})

const INVENTORIED_REF = GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY[0]

test('GSO-P1 exact canonical documentRef downgrades only the missing-field error', () => {
  const result = validateSpecFrontmatter(doc({ verification_class: undefined }), {
    documentRef: INVENTORIED_REF,
  })
  assert.equal(result.valid, true, JSON.stringify(result.errors))
  assert.ok(result.warnings.some((warning) => warning.includes('verification-class-missing')))
})

test('GSO-P1 absent, malformed, noncanonical, and out-of-root documentRef values receive no waiver', () => {
  const invalidRefs: readonly (string | undefined)[] = [
    undefined,
    INVENTORIED_REF.replaceAll('/', '\\'),
    `./${INVENTORIED_REF}`,
    INVENTORIED_REF.replace('docs/', 'docs/../docs/'),
    `C:/${INVENTORIED_REF}`,
  ]
  for (const documentRef of invalidRefs) {
    const result = validateSpecFrontmatter(doc({ verification_class: undefined }), { documentRef })
    assert.equal(result.valid, false, String(documentRef))
    assert.ok(
      result.errors.some((error) => error.includes('verification_class')),
      String(documentRef),
    )
    assert.ok(!result.warnings.some((warning) => warning.includes('verification-class-missing')))
  }
})

test('GSO-P1 runtime-null documentRef fails closed without throwing or receiving a waiver', () => {
  const result = validateSpecFrontmatter(doc({ verification_class: undefined }), {
    documentRef: null as unknown as string,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('verification_class')))
  assert.ok(!result.warnings.some((warning) => warning.includes('verification-class-missing')))
})

test('GSO-P1 runtime-number documentRef fails closed without throwing or receiving a waiver', () => {
  const result = validateSpecFrontmatter(doc({ verification_class: undefined }), {
    documentRef: 42 as unknown as string,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('verification_class')))
  assert.ok(!result.warnings.some((warning) => warning.includes('verification-class-missing')))
})

test('GSO-P1 runtime-object documentRef fails closed without throwing or receiving a waiver', () => {
  const result = validateSpecFrontmatter(doc({ verification_class: undefined }), {
    documentRef: {} as unknown as string,
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('verification_class')))
  assert.ok(!result.warnings.some((warning) => warning.includes('verification-class-missing')))
})

test('GSO-P1 copied or moved document identity, present unknown value, and unrelated errors remain blocking', () => {
  const moved = validateSpecFrontmatter(doc({ verification_class: undefined }), {
    documentRef: INVENTORIED_REF.replace('/done/', '/active/'),
  })
  assert.equal(moved.valid, false)
  assert.ok(moved.errors.some((error) => error.includes('verification_class')))

  const unknown = validateSpecFrontmatter(doc({ verification_class: 'mechanical-default' }), {
    documentRef: INVENTORIED_REF,
  })
  assert.equal(unknown.valid, false)
  assert.ok(unknown.errors.some((error) => error.includes('verification_class')))
  assert.ok(!unknown.warnings.some((warning) => warning.includes('verification-class-missing')))

  const unrelated = validateSpecFrontmatter(
    doc({ verification_class: undefined, risk: undefined }),
    { documentRef: INVENTORIED_REF },
  )
  assert.equal(unrelated.valid, false)
  assert.ok(unrelated.errors.some((error) => error.includes('risk')))
  assert.ok(unrelated.warnings.some((warning) => warning.includes('verification-class-missing')))
})

// --- data_classification (AC5) ------------------------------------------------------

test("data_classification: 'internal' is accepted", () => {
  const result = validateSpecFrontmatter(doc({ data_classification: 'internal' }))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('data_classification absent validates trivially', () => {
  const result = validateSpecFrontmatter(doc({ data_classification: undefined }))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test("data_classification: '' is rejected", () => {
  const result = validateSpecFrontmatter(doc({ data_classification: '' }))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/data_classification')))
})

test('data_classification: null is rejected', () => {
  const result = validateSpecFrontmatter(doc({ data_classification: null }))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/data_classification')))
})

test('data_classification: whitespace-only is rejected', () => {
  const result = validateSpecFrontmatter(doc({ data_classification: '   ' }))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/data_classification')))
})

test('data_classification rejection is NOT grandfatherable (no waiver kind reaches it)', () => {
  const result = validateSpecFrontmatter(doc({ data_classification: '' }), {
    basename: 'SCAF-P4-exit-vehicle.md',
    ...IN_DONE,
  })
  assert.equal(result.valid, false)
})
