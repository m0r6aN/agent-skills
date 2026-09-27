/**
 * Golden vectors: fixture inventory validity, the explicit mutator registry,
 * safe-admission result identity, shadow non-downgrade, and the
 * fixture-to-clause map.
 *
 * Interpretation (coordinator-ruled 2026-09-27): GoldenVectorCase.request is
 * the CLOSED three-shape union, so shape-invalid documents are not literal
 * fixture members. Each such negative case stores its schema-valid base request
 * plus expectations; the single named mutator below produces the defective
 * document, and the test asserts (1) the base validates clean and (2) the
 * mutated document fails validation with exactly the case's expected code —
 * a no-op mutator therefore fails loudly.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { WIRE_CODE_RULES, WIRE_CODES, type WireCode } from '../src/types.js'
import {
  type ValidationCode,
  type ValidationIssue,
  validateAuthorizeActionInput,
  validateGoldenVectorCase,
  validateGoldenVectorFixture,
  validateLifecycleEvent,
  validateReadRequest,
} from '../src/validate.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(here, 'fixtures', 'golden-vectors.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  apiVersion: string
  cases: GoldenCase[]
}

interface GoldenCase {
  caseId: string
  charterClause: string
  inputTrustOrigin: string
  request: Record<string, unknown>
  expectedResponseKind: string
  expectedCode: WireCode
  expectedDecision: string | null
  expectedWouldDecision: string | null
  expectedAssuranceLevel: string
  expectedObligations: string[]
  trustStageExpectation: string
  expectedRequestDigest: string | null
  expectedInputDigest: string | null
  verificationStage: string
  laterOwner: string
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function caseById(id: string): GoldenCase {
  const found = fixture.cases.find((entry) => entry.caseId === id)
  assert.ok(found !== undefined, `fixture must contain ${id}`)
  return found
}

function validateRequest(request: Record<string, unknown>): ValidationIssue[] {
  if ('event' in request) return validateLifecycleEvent(request)
  if ('readKind' in request) return validateReadRequest(request)
  return validateAuthorizeActionInput(request)
}

// ---------------------------------------------------------------------------
// The mutator registry: exactly one named mutator per negative caseId, here
// and nowhere else. Each entry names the single dimension it breaks.
// ---------------------------------------------------------------------------

interface Mutator {
  readonly dimension: string
  readonly expectedCode: ValidationCode
  readonly apply: (request: Record<string, unknown>) => void
}

const at = (root: Record<string, unknown>, path: readonly string[]): Record<string, unknown> => {
  let cursor = root
  for (const key of path.slice(0, -1)) cursor = cursor[key] as Record<string, unknown>
  return cursor
}

const MUTATORS: Readonly<Record<string, Mutator>> = {
  'vec-unknown-field-1': {
    dimension: 'unknown top-level member on a wire event',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.unexpectedMember = 1
    },
  },
  'vec-unknown-enum-1': {
    dimension: 'claimedActionClass enum value',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.claimedActionClass = 'bogus-class'
    },
  },
  'vec-unknown-enum-2': {
    dimension: 'observedEffect effectKind enum value',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      ;((r.payload as Record<string, unknown>).observedEffects as Record<string, unknown>[])[0] = {
        ...((
          (r.payload as Record<string, unknown>).observedEffects as Record<string, unknown>[]
        )[0] as Record<string, unknown>),
        effectKind: 'teleport',
      }
    },
  },
  'vec-unknown-event-1': {
    dimension: 'lifecycle event discriminant',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.event = 'preFlush'
    },
  },
  'vec-missing-required-1': {
    dimension: 'required wire member (actionRef)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      delete r.actionRef
    },
  },
  'vec-missing-required-2': {
    dimension: 'required trusted binding (mode)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      delete at(r, ['trustedBindings', 'mode']).mode
    },
  },
  'vec-wrong-version-1': {
    dimension: 'wire apiVersion',
    expectedCode: 'UNSUPPORTED_VERSION',
    apply: (r) => {
      r.apiVersion = '0.2.0'
    },
  },
  'vec-wrong-version-2': {
    dimension: 'caller lifecycle event apiVersion',
    expectedCode: 'UNSUPPORTED_VERSION',
    apply: (r) => {
      ;(
        (r.callerInputs as Record<string, unknown>).lifecycleEvent as Record<string, unknown>
      ).apiVersion = '9.9.9'
    },
  },
  'vec-overflow-array-1': {
    dimension: 'proposedPaths 64-member cap',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      const payload = r.payload as Record<string, unknown>
      const sample = (payload.proposedPaths as Record<string, unknown>[])[0] as Record<
        string,
        unknown
      >
      payload.proposedPaths = Array.from({ length: 65 }, () => clone(sample))
    },
  },
  'vec-overflow-array-2': {
    dimension: 'gateEvidenceRefs 64-member cap',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      const bindings = r.trustedBindings as Record<string, unknown>
      const sample = (bindings.gateEvidenceRefs as Record<string, unknown>[])[0] as Record<
        string,
        unknown
      >
      bindings.gateEvidenceRefs = Array.from({ length: 65 }, () => clone(sample))
    },
  },
  'vec-overflow-array-3': {
    dimension: 'permittedOperationIds 64-member cap',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      const context = (r.trustedBindings as Record<string, unknown>).admittedContext as Record<
        string,
        unknown
      >
      context.permittedOperationIds = Array.from({ length: 65 }, (_unused, i) => `op-${i}`)
    },
  },
  'vec-content-over-limit-1': {
    dimension: 'content 65,536-byte bound',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      r.content = 'a'.repeat(65537)
    },
  },
  'vec-request-bytes-over-1mib-1': {
    dimension: '1 MiB document bound',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      r.content = 'a'.repeat(1_050_000)
    },
  },
  'vec-id-over-limit-1': {
    dimension: 'Id 128-character bound',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      r.hostAdapterRef = 'a'.repeat(129)
    },
  },
  'vec-unsafe-number-1': {
    dimension: 'SafeInt upper bound (2^53)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      ;(r.trustedBindings as Record<string, unknown>).goalRevision = 2 ** 53
    },
  },
  'vec-negative-zero-1': {
    dimension: 'SafeInt negative zero',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const lease = (r.trustedBindings as Record<string, unknown>).leaseState as Record<
        string,
        unknown
      >
      lease.casRevision = -0
    },
  },
  'vec-fraction-number-1': {
    dimension: 'SafeInt fraction',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const lease = (r.trustedBindings as Record<string, unknown>).leaseState as Record<
        string,
        unknown
      >
      lease.casRevision = 1.5
    },
  },
  'vec-id-pattern-1': {
    dimension: 'Id charset',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.eventId = 'bad id!'
    },
  },
  'vec-id-empty-1': {
    dimension: 'Id nonempty rule',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.eventId = ''
    },
  },
  'vec-digest-uppercase-1': {
    dimension: 'Digest lowercase-hex rule',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      ;(r.trustedBindings as Record<string, unknown>).policyDigest = `sha256:${'A'.repeat(64)}`
    },
  },
  'vec-digest-untagged-1': {
    dimension: 'Digest sha256: tag',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      ;(r.trustedBindings as Record<string, unknown>).policyDigest = 'a'.repeat(64)
    },
  },
  'vec-unpaired-surrogate-1': {
    dimension: 'unpaired Unicode surrogate in a string',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.content = 'a\ud800b'
    },
  },
  'vec-depth-over-limit-1': {
    dimension: 'document depth 16 bound',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      let cursor = r
      for (let i = 0; i < 20; i += 1) {
        const next: Record<string, unknown> = {}
        cursor.padding = next
        cursor = next
      }
    },
  },
  'vec-idempotency-unanchorable-1': {
    dimension: 'idempotency repositoryRef anchoring (F05.4 / F3)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const key = (r.trustedBindings as Record<string, unknown>).idempotencyKey as Record<
        string,
        unknown
      >
      key.repositoryRef = 'repo-other'
    },
  },
  'vec-idempotency-unanchorable-2': {
    dimension: 'idempotency worktreeRef anchoring (F05.4 / F3)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const key = (r.trustedBindings as Record<string, unknown>).idempotencyKey as Record<
        string,
        unknown
      >
      key.worktreeRef = 'wt-other'
    },
  },
  'vec-idempotency-anonymous-nonnull-1': {
    dimension: 'anonymous content-only must carry a null binding (F05.4 / F3)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      ;(r.trustedBindings as Record<string, unknown>).idempotencyKey = {
        principalRef: 'principal-builder-1',
        operationId: 'op-transition-1',
        repositoryRef: 'repo-main',
        worktreeRef: 'wt-0001',
        payloadDigest: `sha256:${'d'.repeat(64)}`,
      }
    },
  },
  'vec-idempotency-missing-key-1': {
    dimension: 'IdempotencyBinding structural completeness (F3)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const key = (r.trustedBindings as Record<string, unknown>).idempotencyKey as Record<
        string,
        unknown
      >
      delete key.payloadDigest
    },
  },
  'vec-anonymous-control-attempt-1': {
    dimension: 'anonymous context control-scope injection',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const context = (r.trustedBindings as Record<string, unknown>).admittedContext as Record<
        string,
        unknown
      >
      context.permittedOperationIds = ['op-transition-1']
    },
  },
  'vec-inject-admitted-context-1': {
    dimension: 'caller-forged admittedContext member on a wire event',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.admittedContext = { principalKind: 'authenticated' }
    },
  },
  'vec-inject-mode-1': {
    dimension: 'caller mode-weakening member on a wire event',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.mode = 'shadow'
    },
  },
  'vec-inject-effective-class-1': {
    dimension: 'caller effective-class weakening member on a wire event',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.effectiveActionClass = 'read-only'
    },
  },
  'vec-forged-provenance-1': {
    dimension: 'caller-forged lifecycle provenance member on a wire event',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.lifecycleProvenance = {
        provenanceId: 'forged',
        hostAdapterRef: 'forged',
        digest: `sha256:${'e'.repeat(64)}`,
      }
    },
  },
  'vec-shadow-unknown-field-1': {
    dimension: 'unknown member under shadow mode (non-downgrade)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      r.unexpectedMember = 1
    },
  },
  'vec-shadow-unanchorable-1': {
    dimension: 'unanchorable binding under shadow mode (non-downgrade)',
    expectedCode: 'INVALID_REQUEST',
    apply: (r) => {
      const key = (r.trustedBindings as Record<string, unknown>).idempotencyKey as Record<
        string,
        unknown
      >
      key.repositoryRef = 'repo-other'
    },
  },
  'vec-maxbytes-over-limit-1': {
    dimension: 'repository-read maxBytes 1,048,576 bound',
    expectedCode: 'PAYLOAD_LIMIT_EXCEEDED',
    apply: (r) => {
      r.maxBytes = 1_048_577
    },
  },
}

const VALIDATOR_FAILURE_CODES: readonly string[] = [
  'INVALID_REQUEST',
  'UNSUPPORTED_VERSION',
  'PAYLOAD_LIMIT_EXCEEDED',
]

// ---------------------------------------------------------------------------

test('fixture inventory is structurally and cross-field consistent', () => {
  assert.deepEqual(validateGoldenVectorFixture(fixture), [])
})

test('mutator registry is complete in both directions over validator-failure cases', () => {
  const registryKeys = Object.keys(MUTATORS).sort()
  const validatorFailureIds = fixture.cases
    .filter((entry) => (VALIDATOR_FAILURE_CODES as readonly string[]).includes(entry.expectedCode))
    .map((entry) => entry.caseId)
    .sort()
  assert.deepEqual(registryKeys, validatorFailureIds)
})

for (const [caseId, mutator] of Object.entries(MUTATORS)) {
  test(`mutator ${caseId}: ${mutator.dimension} breaks exactly that dimension`, () => {
    const entry = caseById(caseId)
    assert.equal(entry.expectedCode, mutator.expectedCode, 'mutator and case expectation agree')
    const base = clone(entry.request)
    assert.deepEqual(validateRequest(base), [], 'stored base request must validate clean')
    const mutated = clone(entry.request)
    mutator.apply(mutated)
    const issues = validateRequest(mutated)
    assert.ok(issues.length > 0, 'mutated document must fail validation')
    assert.ok(
      issues.some((issue) => issue.code === mutator.expectedCode),
      `mutated document must fail with ${mutator.expectedCode}, got ${JSON.stringify(issues)}`,
    )
  })
}

test('safe admission result is identical across independently varied gate/lease/repository/revision states', () => {
  const leakRows = [
    caseById('vec-admission-leak-gate-1'),
    caseById('vec-admission-leak-lease-1'),
    caseById('vec-admission-leak-repository-1'),
    caseById('vec-admission-leak-revision-1'),
  ]
  for (const row of leakRows) {
    assert.equal(row.expectedResponseKind, 'protocol-error')
    assert.equal(row.expectedCode, 'ADMISSION_REQUIRED')
    assert.equal(row.expectedDecision, null)
    assert.equal(row.expectedAssuranceLevel, 'structural')
    assert.equal(row.trustStageExpectation, 'admission-stop')
  }
})

test('shadow mode downgrades no protocol or admission failure', () => {
  const pairs: readonly (readonly [string, string])[] = [
    ['vec-shadow-unknown-field-1', 'vec-unknown-field-1'],
    ['vec-shadow-unanchorable-1', 'vec-idempotency-unanchorable-1'],
    ['vec-admission-shadow-1', 'vec-forged-admission-1'],
  ]
  for (const [shadowId, enforcedId] of pairs) {
    const shadow = caseById(shadowId)
    const enforced = caseById(enforcedId)
    assert.equal(shadow.expectedCode, enforced.expectedCode, shadowId)
    assert.equal(shadow.expectedResponseKind, enforced.expectedResponseKind, shadowId)
    assert.equal(shadow.expectedDecision, enforced.expectedDecision, shadowId)
    assert.equal(shadow.expectedWouldDecision, null, shadowId)
  }
})

test('shadow/enforced policy pair compares directly (same code, shadow would-refuse)', () => {
  const enforced = caseById('vec-enforced-path-outside-1')
  const shadow = caseById('vec-shadow-path-outside-1')
  assert.equal(enforced.expectedCode, shadow.expectedCode)
  assert.equal(enforced.expectedDecision, 'REFUSE')
  assert.equal(shadow.expectedDecision, 'ADVISORY')
  assert.equal(shadow.expectedWouldDecision, 'REFUSE')
})

test('coverage: the eleven mediated codes and all eight boundary codes have vectors', () => {
  const covered = new Set(fixture.cases.map((entry) => entry.expectedCode))
  const mediated: readonly WireCode[] = [
    'WORKTREE_MISMATCH',
    'BRANCH_MISMATCH',
    'PATH_OUTSIDE_ALLOWED_FILES',
    'FROZEN_SURFACE_MUTATION',
    'REVIEWER_MUTATION_FORBIDDEN',
    'REVIEW_WORKTREE_DIRTY',
    'POLICY_SELF_MODIFICATION',
    'MEDIATED_BYPASS_MODE_FORBIDDEN',
    'OWNER_LEASE_MISMATCH',
    'STATE_REVISION_STALE',
    'GATE_NOT_SATISFIED',
  ]
  for (const code of mediated) assert.ok(covered.has(code), `missing vector for ${code}`)
  for (const code of WIRE_CODES) assert.ok(covered.has(code), `missing vector for ${code}`)
})

test('coverage: named minimum families are present', () => {
  const ids = new Set(fixture.cases.map((entry) => entry.caseId))
  for (const id of [
    'vec-enrollment-missing-1',
    'vec-valid-anon-content-1',
    'vec-anonymous-control-attempt-1',
    'vec-forged-admission-1',
    'vec-capability-wrong-1',
    'vec-capability-expired-1',
    'vec-capability-revoked-1',
    'vec-wrong-repo-1',
    'vec-wrong-worktree-1',
    'vec-structural-receipt-honesty-1',
    'vec-gate-not-satisfied-1',
    'vec-transition-replay-1',
    'vec-idempotency-conflict-1',
    'vec-latency-first-call-1',
    'vec-latency-warm-1',
    'vec-latency-p50-1',
    'vec-latency-p95-1',
    'vec-latency-p99-1',
    'vec-latency-mediated-p99-1',
    'vec-deadline-at-1',
    'vec-deadline-after-1',
    'vec-deadline-late-response-1',
    'vec-cache-goal-revision-mismatch-1',
    'vec-cache-policy-digest-mismatch-1',
    'vec-cache-scope-digest-mismatch-1',
    'vec-cache-different-principal-1',
    'vec-cache-different-action-1',
    'vec-cache-expired-lease-1',
    'vec-outage-mutation-1',
    'vec-outage-degraded-read-1',
    'vec-disguised-readonly-1',
    'vec-unknown-tool-semantics-1',
    'vec-conflicting-tool-semantics-1',
    'vec-idempotency-unanchorable-1',
    'vec-d19-inroot-symlink-1',
    'vec-d19-escaping-symlink-1',
    'vec-d19-opened-target-substitution-1',
    'vec-d19-opened-target-race-1',
    'vec-outage-degraded-read-1',
  ]) {
    assert.ok(ids.has(id), `missing required vector ${id}`)
  }
})

test('fixture-to-clause map: every case carries a clause, producer/consumer and a later owner', () => {
  const clauseCounts: Record<string, number> = {}
  for (const entry of fixture.cases) {
    assert.ok(entry.charterClause.length > 0, entry.caseId)
    assert.ok(entry.laterOwner.length > 0, entry.caseId)
    assert.equal(entry.verificationStage, 'contract-only', entry.caseId)
    clauseCounts[entry.charterClause] = (clauseCounts[entry.charterClause] ?? 0) + 1
  }
  const summary = Object.entries(clauseCounts)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([clause, count]) => `${clause}=${count}`)
    .join(' ')
  console.log(`fixture-to-clause map (${fixturePath}): ${fixture.cases.length} cases; ${summary}`)
})

test('registry rows agree with every case expectation', () => {
  for (const entry of fixture.cases) {
    const rule = WIRE_CODE_RULES.find((candidate) => candidate.code === entry.expectedCode)
    assert.ok(rule !== undefined, entry.caseId)
    assert.equal(entry.expectedResponseKind, rule.resultKind, entry.caseId)
  }
})

// ---------------------------------------------------------------------------
// Case-level registry-binding negatives (rework R2, coordinator-ruled vehicle):
// each named entry mutates exactly one expectation dimension of a valid case
// and the test asserts validateGoldenVectorCase rejects it — same discipline as
// the mutator registry (a no-op mutation fails loudly).
// ---------------------------------------------------------------------------

interface CaseMutator {
  readonly dimension: string
  readonly apply: (entry: GoldenCase) => void
}

const CASE_MUTATORS: Readonly<Record<string, CaseMutator>> = {
  'case-probe-decision-code-confusion': {
    dimension: 'expectedDecision disagrees with the registry row allowed decision',
    apply: (entry) => {
      entry.expectedDecision = 'ALLOW'
    },
  },
  'case-probe-effect-code-on-policy-result': {
    dimension: 'expectedResponseKind disagrees with the registry row result kind',
    apply: (entry) => {
      entry.expectedResponseKind = 'protocol-error'
    },
  },
  'case-probe-shadow-would-confusion': {
    dimension: 'expectedWouldDecision disagrees with the registry row enforcing disposition',
    apply: (entry) => {
      entry.expectedWouldDecision = 'ALLOW'
    },
  },
}

for (const [name, mutator] of Object.entries(CASE_MUTATORS)) {
  test(`${name}: ${mutator.dimension} is rejected`, () => {
    const base =
      mutator.dimension.includes('would') || mutator.dimension.includes('shadow')
        ? caseById('vec-shadow-path-outside-1')
        : caseById('vec-enforced-path-outside-1')
    assert.deepEqual(validateGoldenVectorCase(base), [], 'base case validates clean')
    const mutated = clone(base)
    mutator.apply(mutated)
    const issues = validateGoldenVectorCase(mutated)
    assert.ok(issues.length > 0, 'mutated case must fail cross-field validation')
    assert.ok(
      issues.some((issue) => issue.path.startsWith('$.expected')),
      `mutation must break its named expectation dimension, got ${JSON.stringify(issues)}`,
    )
  })
}
