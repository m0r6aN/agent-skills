/**
 * CLOSE-P1 ACs 1-2 — typed-closed effective-rules normalization.
 *
 *   AC1/E6-R1 AC4 (positive): `normalizeEffectiveRules` consumes the checked-in
 *       REAL captured branch-rules response (fixture with provenance header)
 *       and, composed with `normalizeRulesetBypass` over every REAL captured
 *       merge-gating ruleset response, yields an `EffectiveRulesResponse` accepted by
 *       `verifyBranchProtectionPosture` WITHOUT a cast.
 *   AC2 (negatives, one test per invalid shape): each throws
 *       `EffectiveRulesNormalizationError`; none returns a defaulted/partial
 *       response.
 *
 * Hermetic: the fixture is a checked-in capture; no network/gh calls here.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  composeEffectiveRules,
  EffectiveRulesNormalizationError,
  normalizeEffectiveRules,
  normalizeRulesetBypass,
  verifyBranchProtectionPosture,
} from '../src/index.js'

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures', 'effective-rules-live-capture.json')

interface LiveCaptureFixture {
  readonly provenance: {
    readonly capturedBy: string
    readonly capturedAt: string
    readonly repository: string
    readonly repoMainSha: string
    readonly repoMainShaCommand: string
    readonly recaptureVerification: { readonly structurallyEqual: boolean }
  }
  readonly branchRules: { readonly command: string; readonly capture: unknown }
  readonly rulesetBypasses: readonly {
    readonly command: string
    readonly capture: unknown
  }[]
}

const CURRENT_EFFECTIVE_RULE_TYPES = [
  'deletion',
  'non_fast_forward',
  'pull_request',
  'required_status_checks',
] as const

const MERGE_GATING_RULE_TYPES = new Set<string>(CURRENT_EFFECTIVE_RULE_TYPES)

function loadFixture(): LiveCaptureFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as LiveCaptureFixture
}

function assertAuditableRulesetCapture(capture: unknown): Record<string, unknown> {
  assert.ok(typeof capture === 'object' && capture !== null && !Array.isArray(capture))
  const record = capture as Record<string, unknown>
  assert.ok(Number.isInteger(record.id))
  assert.ok(typeof record.name === 'string' && record.name.trim().length > 0)
  assert.equal(record.target, 'branch')
  assert.equal(record.source, 'm0r6aN/agent-skills')
  assert.equal(record.enforcement, 'active')
  assert.ok(
    typeof record.conditions === 'object' &&
      record.conditions !== null &&
      !Array.isArray(record.conditions),
  )
  assert.ok(Array.isArray(record.rules))
  assert.ok(Array.isArray(record.bypass_actors))
  return record
}

function assertNormalizationThrow(fn: () => unknown): void {
  assert.throws(fn, (err: unknown) => {
    assert.ok(err instanceof EffectiveRulesNormalizationError)
    assert.equal((err as Error).name, 'EffectiveRulesNormalizationError')
    return true
  })
}

// ─── AC1: positive over the REAL capture ────────────────────────────────────

test('E6-R1 AC4: fixture carries current-repository provenance and successful immediate recapture evidence', () => {
  const fixture = loadFixture()
  assert.equal(fixture.provenance.capturedBy, 'E6-R1 isolated builder')
  assert.ok(fixture.provenance.capturedAt.startsWith('2026-09-06'))
  assert.equal(fixture.provenance.repository, 'm0r6aN/agent-skills')
  assert.match(fixture.provenance.repoMainSha, /^[0-9a-f]{40}$/)
  assert.equal(
    fixture.provenance.repoMainShaCommand,
    'gh api repos/m0r6aN/agent-skills/commits/main --jq .sha',
  )
  assert.equal(fixture.provenance.recaptureVerification.structurallyEqual, true)
  assert.equal(fixture.branchRules.command, 'gh api repos/m0r6aN/agent-skills/rules/branches/main')
  assert.ok(fixture.rulesetBypasses.length > 0)
  assert.ok(
    fixture.rulesetBypasses.every(({ command }) =>
      command.startsWith('gh api repos/m0r6aN/agent-skills/rulesets/'),
    ),
  )
})

test('E6-R1 AC4: normalizeEffectiveRules maps the current effective rule types without historical count assumptions', () => {
  const rules = normalizeEffectiveRules(loadFixture().branchRules.capture)
  const types = [...new Set(rules.map((rule) => rule.ruleType))].sort()
  assert.deepEqual(types, [...CURRENT_EFFECTIVE_RULE_TYPES].sort())
})

test('E6-R1 AC4: every merge-gating ruleset has a full captured response', () => {
  const fixture = loadFixture()
  assert.ok(Array.isArray(fixture.branchRules.capture))

  const mergeGatingRulesetIds = new Set(
    fixture.branchRules.capture.flatMap((entry: unknown) => {
      assert.ok(typeof entry === 'object' && entry !== null && !Array.isArray(entry))
      const record = entry as Record<string, unknown>
      return MERGE_GATING_RULE_TYPES.has(String(record.type)) ? [record.ruleset_id] : []
    }),
  )
  const capturedRulesetIds = new Set(
    fixture.rulesetBypasses.map(({ capture }) => {
      return assertAuditableRulesetCapture(capture).id
    }),
  )

  assert.deepEqual(
    [...capturedRulesetIds].map(String).sort(),
    [...mergeGatingRulesetIds].map(String).sort(),
  )
})

test('E6-R1 AC4: stripped ruleset capture fails the full-response structural assertion', () => {
  const capture = assertAuditableRulesetCapture(loadFixture().rulesetBypasses[0]?.capture)
  const stripped = { id: capture.id, bypass_actors: capture.bypass_actors }
  assert.throws(() => assertAuditableRulesetCapture(stripped))
})

test('E6-R1 AC4: aggregate bypass actors from every captured merge-gating ruleset', () => {
  const bypassActors = loadFixture().rulesetBypasses.flatMap(({ capture }) =>
    normalizeRulesetBypass(capture),
  )
  assert.deepEqual(bypassActors, [])
})

test('AC1: composed EffectiveRulesResponse is accepted by verifyBranchProtectionPosture without a cast', () => {
  const fixture = loadFixture()
  const response = composeEffectiveRules(
    normalizeEffectiveRules(fixture.branchRules.capture),
    fixture.rulesetBypasses.flatMap(({ capture }) => normalizeRulesetBypass(capture)),
  )
  // No cast anywhere on this path: composeEffectiveRules returns the domain
  // type and verifyBranchProtectionPosture consumes it directly.
  const verdict = verifyBranchProtectionPosture(response, 'some-identity')
  assert.equal(typeof verdict.canMerge, 'boolean')
  // The real capture carries a 'pull_request' rule, so that reason is absent.
  assert.ok(!verdict.reasons.some((reason) => reason.includes("'pull_request'")))
})

// ─── AC2: typed-closed negatives, one test per invalid shape ─────────────────

test('AC2: branch-rules — null input throws', () => {
  assertNormalizationThrow(() => normalizeEffectiveRules(null))
})

test('AC2: branch-rules — string input throws', () => {
  assertNormalizationThrow(() => normalizeEffectiveRules('[{"type":"deletion"}]'))
})

test('AC2: branch-rules — non-array object root throws', () => {
  assertNormalizationThrow(() => normalizeEffectiveRules({ rules: [] }))
})

test('AC2: branch-rules — non-object entry throws', () => {
  assertNormalizationThrow(() => normalizeEffectiveRules(['deletion']))
})

test('AC2: branch-rules — entry missing type throws (mutated real capture)', () => {
  const capture = loadFixture().branchRules.capture as Record<string, unknown>[]
  const mutated = capture.map((entry, index) => {
    if (index !== 0) return entry
    const { type: _dropped, ...rest } = entry
    return rest
  })
  assertNormalizationThrow(() => normalizeEffectiveRules(mutated))
})

test('AC2: branch-rules — entry with wrong-typed (non-string) type throws (mutated real capture)', () => {
  const capture = loadFixture().branchRules.capture as Record<string, unknown>[]
  const mutated = capture.map((entry, index) => (index === 0 ? { ...entry, type: 42 } : entry))
  assertNormalizationThrow(() => normalizeEffectiveRules(mutated))
})

test('AC2: branch-rules — entry with empty-string type throws', () => {
  assertNormalizationThrow(() => normalizeEffectiveRules([{ type: '' }]))
})

test('AC2: ruleset — array root throws', () => {
  assertNormalizationThrow(() => normalizeRulesetBypass([]))
})

test('AC2: ruleset — null input throws', () => {
  assertNormalizationThrow(() => normalizeRulesetBypass(null))
})

test('AC2: ruleset — missing bypass_actors throws (mutated real capture)', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  const { bypass_actors: _dropped, ...mutated } = capture
  assertNormalizationThrow(() => normalizeRulesetBypass(mutated))
})

test('AC2: ruleset — wrong-typed (non-array) bypass_actors throws (mutated real capture)', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() => normalizeRulesetBypass({ ...capture, bypass_actors: 'none' }))
})

test('AC2: ruleset — bypass entry that is not an object throws', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() => normalizeRulesetBypass({ ...capture, bypass_actors: [7] }))
})

test('AC2: ruleset — bypass entry with non-integer actor_id throws (fail-closed, incl. null)', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() =>
    normalizeRulesetBypass({
      ...capture,
      bypass_actors: [{ actor_id: null, actor_type: 'DeployKey', bypass_mode: 'always' }],
    }),
  )
})

test('AC2: ruleset — bypass entry with an unrecognized bypass_mode throws (never defaulted)', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() =>
    normalizeRulesetBypass({
      ...capture,
      bypass_actors: [{ actor_id: 5, actor_type: 'Team', bypass_mode: 'sometimes' }],
    }),
  )
})

test("AC2/R4: ruleset — bypass entry with actor_id 1e21 throws (would stringify as '1e+21', not decimal)", () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() =>
    normalizeRulesetBypass({
      ...capture,
      bypass_actors: [{ actor_id: 1e21, actor_type: 'Team', bypass_mode: 'always' }],
    }),
  )
})

test('AC2/R4: ruleset — bypass entry with negative actor_id throws', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() =>
    normalizeRulesetBypass({
      ...capture,
      bypass_actors: [{ actor_id: -5, actor_type: 'Team', bypass_mode: 'always' }],
    }),
  )
})

test('AC2/R4: ruleset — bypass entry with zero actor_id throws', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  assertNormalizationThrow(() =>
    normalizeRulesetBypass({
      ...capture,
      bypass_actors: [{ actor_id: 0, actor_type: 'Team', bypass_mode: 'always' }],
    }),
  )
})

test('AC2: ruleset — a valid bypass entry maps actor_id/bypass_mode to the domain shape', () => {
  const capture = loadFixture().rulesetBypasses[0]?.capture as Record<string, unknown>
  const bypassActors = normalizeRulesetBypass({
    ...capture,
    bypass_actors: [{ actor_id: 5, actor_type: 'Team', bypass_mode: 'pull_request' }],
  })
  assert.deepEqual(bypassActors, [{ actorId: '5', bypassMode: 'pull_request' }])
})
