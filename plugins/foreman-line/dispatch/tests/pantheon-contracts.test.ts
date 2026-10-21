import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  CONTRACT_VERSION,
  classifyAuthorityDelta,
  compareStep0,
  type DispatchIntent,
  LIMITS,
  OPERATIONS,
  parseDispatchIntent,
  parseEvidenceProvenance,
  parseMaterialException,
  parseMoneyEvidence,
  parseNdjsonFrame,
  parseOperation,
  parseReviewResult,
  parseStep0Restatement,
  type ReviewResult,
  type ValidationResult,
  validateIndependence,
  WIRE_VERSION,
} from '../src/pantheon-runtime/contracts/index.js'

const hash = 'a'.repeat(64)
const otherHash = 'b'.repeat(64)
const sourceHead = 'c'.repeat(40)
function valid<T>(result: ValidationResult<T>): T {
  assert.equal(result.status, 'structurally-valid', JSON.stringify(result))
  if (result.status !== 'structurally-valid') throw new Error('expected valid structure')
  assert.equal(result.trust, 'unverified')
  assert.equal('admitted' in result, false)
  assert.equal('capability' in result, false)
  return result.value
}
function refused(result: ValidationResult<unknown>, code?: string): void {
  assert.equal(result.status, 'refused', JSON.stringify(result))
  if (code && result.status === 'refused') assert.equal(result.code, code)
}
function descriptor(): DispatchIntent {
  return {
    version: CONTRACT_VERSION,
    identity: {
      sessionId: '01a15962-c00c-7341-a358-f81791084f18',
      parentSessionId: '01a15424-1fd5-77a2-a73a-d92a60a5de34',
      actorId: 'builder-1',
      hostId: 'A',
      hostIdentityHash: hash,
      goalId: 'pantheon-incarnation-v0',
      parcelId: 'P01',
      jobId: 'job-1',
      attemptId: 'attempt-1',
    },
    mandateHash: hash,
    specHash: hash,
    activePlanHash: hash,
    sourceHash: hash,
    artifactHash: hash,
    configHash: hash,
    sourceHead,
    baseHead: sourceHead,
    worktree: 'C:/work/P01',
    branch: 'codex/P01',
    allowedFiles: ['src/contracts.ts'],
    role: 'builder',
    modelProfile: 'registry/profile-v1',
    requestedTools: ['read', 'patch'],
    requestedNetwork: [],
    issuedAt: '2026-10-20T12:00:00.000Z',
    deadline: '2026-10-20T12:45:00.000Z',
    fencingEpoch: 1,
    operation: 'worker.execute',
    authority: {
      state: 'unverified',
      grantId: 'grant-1',
      grantHash: hash,
      permissionEventReceiptId: 'permission-event-1',
      bindingHash: hash,
      decisionId: 'decision-1',
      decisionHash: hash,
      permissionId: 'permission-1',
      permissionHash: `sha256:${hash}`,
      effectDescriptorHash: `sha256:${hash}`,
      delegationChainId: null,
    },
    money: {
      currency: 'USD',
      scale: 'micro',
      estimate: null,
      reservation: null,
      providerCounters: null,
      localEstimate: null,
      provisionalExposure: null,
      reconciledBill: null,
    },
  }
}
function artifact() {
  return { repository: 'foreman', path: 'evidence/result.json', sourceHead, sha256: hash }
}
function subject() {
  return {
    unit: 'B1',
    specHash: hash,
    activePlanHash: hash,
    trustedTestsHash: hash,
    artifacts: [artifact(), { ...artifact(), repository: 'runtime', sourceHead: 'd'.repeat(40) }],
  }
}
function provenance() {
  return {
    state: 'unverified' as const,
    kind: 'original-capture' as const,
    identity: descriptor().identity,
    requestHash: hash,
    subject: subject(),
    original: artifact(),
    result: artifact(),
    capture: { ...artifact(), path: 'evidence/capture.json' },
    verifierRecord: null,
    providerRequestId: null,
  }
}
function review(): ReviewResult {
  return {
    descriptor: { ...descriptor(), role: 'judge', operation: 'model.infer' },
    subject: subject(),
    reviewText: 'Inspected both complete constituents and their negative fixtures.',
    verdict: 'pass',
    findings: [],
    coverage: subject().artifacts,
    limitations: ['Structural fixture; no Runtime admission or authenticity proof.'],
    provenance: provenance(),
  }
}
function request() {
  return {
    version: WIRE_VERSION,
    kind: 'request',
    identity: descriptor().identity,
    requestId: 'request-1',
    requestHash: hash,
    fencingEpoch: 1,
    operation: 'worker.execute',
    artifact: artifact(),
    eventCursor: 0,
    descriptor: descriptor(),
  }
}
function line(v: unknown) {
  return `${JSON.stringify(v)}\n`
}
function boundary() {
  return {
    intent: 'Useful development proof',
    scope: ['development'],
    hosts: ['A', 'B'],
    accounts: ['existing'],
    recipients: ['existing'],
    access: ['existing'],
    totalCeilingMicroUsd: 75000000,
    residualRisk: 'Existing ratified development risk',
    production: 'excluded',
  }
}
function independence() {
  const seat = {
    provider: 'same-vendor',
    modelProfile: 'registry/reviewer',
    modelFamily: 'same-family',
    role: 'judge',
    mode: 'read-only',
    context: 'fresh-no-builder-or-peer-context',
  }
  return {
    mandate: 'OM-PAN-001',
    goal: 'pantheon-incarnation-v0',
    exception: 'OM-PAN-001-A9',
    surface: 'authority',
    authors: ['builder-1'],
    authorSessions: ['builder-session'],
    seats: [
      { ...seat, actorId: 'judge-1', sessionId: 'review-session-1' },
      { ...seat, actorId: 'judge-2', sessionId: 'review-session-2' },
    ],
  }
}

test('Pantheon: valid structure stays detached, frozen and explicitly unverified', () => {
  const input = descriptor()
  const parsed = valid(parseDispatchIntent(input))
  assert.notEqual(parsed, input)
  assert.ok(Object.isFrozen(parsed.identity))
  assert.ok(Object.isFrozen(parsed.allowedFiles))
  assert.equal(parsed.authority.state, 'unverified')
  assert.equal(parsed.money.reconciledBill, null)
  assert.equal(valid(compareStep0(input, { descriptor: input, flags: [] })).match, 'exact-match')
  valid(parseStep0Restatement({ descriptor: input, flags: [] }))
})

for (const [name, extra] of [
  ['accepted', { accepted: true }],
  ['admitted', { admitted: true }],
  ['human approval', { humanApproval: true }],
  ['receipt', { receipt: { accepted: true } }],
] as const) {
  test(`Pantheon: forged ${name} cannot become authority`, () => {
    refused(parseDispatchIntent({ ...descriptor(), ...extra }))
    refused(
      parseDispatchIntent({ ...descriptor(), authority: { ...descriptor().authority, ...extra } }),
    )
  })
}
test('Pantheon: supplied verified state and unprefixed Runtime permission hash refuse', () => {
  refused(
    parseDispatchIntent({
      ...descriptor(),
      authority: { ...descriptor().authority, state: 'verified' },
    }),
  )
  refused(
    parseDispatchIntent({
      ...descriptor(),
      authority: { ...descriptor().authority, permissionHash: hash },
    }),
  )
  refused(parseEvidenceProvenance({ ...provenance(), state: 'verified' }))
})

for (const bad of [
  '',
  '../secret',
  'src/../secret',
  '/absolute',
  'C:/secret',
  'src\\file',
  'src/*',
  'src/**',
  'src/[a]',
  'src//x',
  './src/x',
  '.git/config',
  'src/NUL.txt',
  'src/file.',
  'src/%2e%2e/x',
]) {
  test(`Pantheon: exact relative path refuses ${JSON.stringify(bad)}`, () => {
    refused(parseDispatchIntent({ ...descriptor(), allowedFiles: [bad] }))
  })
}
test('Pantheon: missing, duplicate and case-colliding allowed files refuse', () => {
  const { allowedFiles: _, ...missing } = descriptor()
  refused(parseDispatchIntent(missing))
  refused(parseDispatchIntent({ ...descriptor(), allowedFiles: [] }))
  refused(parseDispatchIntent({ ...descriptor(), allowedFiles: ['a.ts', 'a.ts'] }))
  refused(parseDispatchIntent({ ...descriptor(), allowedFiles: ['A.ts', 'a.ts'] }))
})

for (const key of [
  'sessionId',
  'parentSessionId',
  'actorId',
  'hostId',
  'hostIdentityHash',
  'parcelId',
  'jobId',
  'attemptId',
] as const) {
  test(`Pantheon: Step0 identity mismatch ${key} holds with exact field`, () => {
    const changed = {
      ...descriptor(),
      identity: {
        ...descriptor().identity,
        [key]: key === 'hostIdentityHash' ? otherHash : 'different',
      },
    }
    const checked = valid(compareStep0(descriptor(), { descriptor: changed, flags: [] }))
    assert.equal(checked.match, 'hold')
    assert.ok(checked.mismatches.some((m) => m.field === `descriptor.identity.${key}`))
  })
}
test('Pantheon: other goal refuses the scoped envelope', () => {
  refused(
    parseDispatchIntent({
      ...descriptor(),
      identity: { ...descriptor().identity, goalId: 'other-goal' },
    }),
  )
})
for (const key of [
  'mandateHash',
  'specHash',
  'activePlanHash',
  'sourceHash',
  'artifactHash',
  'configHash',
  'sourceHead',
  'baseHead',
  'worktree',
  'branch',
  'role',
  'modelProfile',
  'issuedAt',
  'deadline',
  'fencingEpoch',
  'operation',
] as const) {
  test(`Pantheon: Step0 descriptor mismatch ${key} holds`, () => {
    const values = {
      ...descriptor(),
      [key]: key.endsWith('Hash')
        ? otherHash
        : key.endsWith('Head')
          ? 'd'.repeat(40)
          : key === 'role'
            ? 'operator'
            : key === 'fencingEpoch'
              ? 2
              : key === 'operation'
                ? 'worker.verify'
                : key === 'issuedAt'
                  ? '2026-10-20T12:01:00.000Z'
                  : key === 'deadline'
                    ? '2026-10-20T12:44:00.000Z'
                    : 'different',
    }
    const checked = valid(compareStep0(descriptor(), { descriptor: values, flags: [] }))
    assert.equal(checked.match, 'hold')
    assert.ok(checked.mismatches.some((m) => m.field === `descriptor.${key}`))
  })
}
for (const key of ['allowedFiles', 'requestedTools', 'requestedNetwork'] as const) {
  test(`Pantheon: Step0 additional ${key} holds`, () => {
    assert.equal(
      valid(
        compareStep0(descriptor(), {
          descriptor: { ...descriptor(), [key]: [...descriptor()[key], 'extra'] },
          flags: [],
        }),
      ).match,
      'hold',
    )
  })
}
test('Pantheon: missing tool, flags and authority or money drift hold', () => {
  const d = descriptor()
  assert.equal(
    valid(compareStep0(d, { descriptor: { ...d, requestedTools: ['read'] }, flags: [] })).match,
    'hold',
  )
  assert.equal(
    valid(compareStep0(d, { descriptor: d, flags: ['unresolved dependency'] })).match,
    'hold',
  )
  assert.equal(
    valid(
      compareStep0(d, {
        descriptor: { ...d, authority: { ...d.authority, decisionHash: otherHash } },
        flags: [],
      }),
    ).match,
    'hold',
  )
  assert.equal(
    valid(
      compareStep0(d, { descriptor: { ...d, money: { ...d.money, reservation: 1 } }, flags: [] }),
    ).match,
    'hold',
  )
})

test('Pantheon: money categories remain distinct and null is never zero', () => {
  const money = valid(
    parseMoneyEvidence({
      ...descriptor().money,
      estimate: 10,
      reservation: 20,
      providerCounters: { inputTokens: 12, combinedOutputTokens: 7 },
      localEstimate: 11,
      provisionalExposure: 13,
    }),
  )
  assert.equal(money.reconciledBill, null)
  assert.equal(money.localEstimate, 11)
  assert.deepEqual(money.providerCounters, { inputTokens: 12, combinedOutputTokens: 7 })
  refused(parseMoneyEvidence({ ...descriptor().money, providerCounters: 11 }))
  refused(
    parseMoneyEvidence({
      ...descriptor().money,
      providerCounters: { inputTokens: 12, combinedOutputTokens: 7, thinkingTokens: 3 },
    }),
  )
  refused(parseMoneyEvidence({ ...descriptor().money, currency: 'EUR' }))
  refused(parseMoneyEvidence({ ...descriptor().money, billedCost: 0 }))
  const { reconciledBill: _, ...absent } = descriptor().money
  refused(parseMoneyEvidence(absent))
})
for (const amount of [-1, -0, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '100']) {
  test(`Pantheon: malformed money ${String(amount)} refuses`, () => {
    refused(parseMoneyEvidence({ ...descriptor().money, reservation: amount }))
  })
}
test('Pantheon: safe integer boundary is represented without arithmetic or truncation', () => {
  assert.equal(
    valid(parseMoneyEvidence({ ...descriptor().money, reservation: Number.MAX_SAFE_INTEGER }))
      .reservation,
    Number.MAX_SAFE_INTEGER,
  )
})

test('Pantheon: complete whole-unit review is structural data only', () => {
  const parsed = valid(parseReviewResult(review(), subject()))
  assert.equal(parsed.provenance.state, 'unverified')
  assert.equal(parsed.subject.artifacts.length, 2)
  refused(parseReviewResult({ ...review(), descriptor: descriptor() }, subject()), 'INDEPENDENCE')
})
for (const changed of [
  { reviewText: '' },
  { coverage: [] },
  { coverage: [artifact()] },
  { verdict: 'changes_required', findings: [] },
  {
    verdict: 'pass',
    findings: [
      { id: 'F1', severity: 'high', text: 'Unresolved boundary defect.', artifact: artifact() },
    ],
  },
  { findings: [{ id: 'F1', severity: 'high', text: '', artifact: artifact() }] },
  { accepted: true },
]) {
  test(`Pantheon: incomplete or contradictory review ${JSON.stringify(changed)} refuses`, () => {
    refused(parseReviewResult({ ...review(), ...changed }, subject()))
  })
}
test('Pantheon: wrong artifact/head, subject and provenance identity refuse', () => {
  refused(parseReviewResult(review(), { ...subject(), trustedTestsHash: otherHash }))
  refused(
    parseReviewResult(
      { ...review(), coverage: [{ ...artifact(), sourceHead: 'd'.repeat(40) }] },
      subject(),
    ),
  )
  refused(
    parseReviewResult(
      {
        ...review(),
        provenance: {
          ...provenance(),
          identity: { ...descriptor().identity, sessionId: 'attacker' },
        },
      },
      subject(),
    ),
  )
  refused(
    parseReviewResult(
      {
        ...review(),
        provenance: {
          ...provenance(),
          original: { ...artifact(), sha256: otherHash },
          result: { ...artifact(), sha256: otherHash },
        },
      },
      subject(),
    ),
  )
  refused(
    parseReviewResult(
      {
        ...review(),
        provenance: {
          ...provenance(),
          original: { ...artifact(), sourceHead: 'd'.repeat(40) },
          result: { ...artifact(), sourceHead: 'd'.repeat(40) },
        },
      },
      subject(),
    ),
  )
})
test('Pantheon: provider ID and fabricated verifier record never authenticate evidence', () => {
  assert.equal(
    valid(parseEvidenceProvenance({ ...provenance(), providerRequestId: 'model-invented-id' }))
      .state,
    'unverified',
  )
  refused(parseEvidenceProvenance({ ...provenance(), accepted: true }))
  refused(parseEvidenceProvenance({ ...provenance(), kind: 'formatting-projection' }))
  const projected = {
    ...provenance(),
    kind: 'formatting-projection',
    result: { ...artifact(), sha256: otherHash },
    verifierRecord: { ...artifact(), path: 'evidence/verification.json' },
  }
  assert.equal(valid(parseEvidenceProvenance(projected)).state, 'unverified')
  refused(
    parseEvidenceProvenance({
      ...projected,
      original: { ...artifact(), sourceHead: 'd'.repeat(40) },
    }),
    'MISMATCH',
  )
})

test('Pantheon: named same-vendor exception retains two distinct read-only seats', () => {
  assert.equal(valid(validateIndependence(independence())).length, 2)
  refused(validateIndependence({ ...independence(), mandate: 'other' }))
  refused(validateIndependence({ ...independence(), goal: 'other-goal' }))
  refused(validateIndependence({ ...independence(), exception: '' }))
  refused(validateIndependence({ ...independence(), seats: independence().seats.slice(0, 1) }))
})
for (const changed of [
  { actorId: 'builder-1' },
  { sessionId: 'builder-session' },
  { actorId: 'judge-2' },
  { sessionId: 'review-session-2' },
  { role: 'builder' },
  { mode: 'write' },
  { context: 'builder-conversation' },
  { provider: '' },
  { modelProfile: '' },
]) {
  test(`Pantheon: independence violation ${JSON.stringify(changed)} refuses`, () => {
    const seats = independence().seats
    refused(
      validateIndependence({ ...independence(), seats: [{ ...seats[0], ...changed }, seats[1]] }),
    )
  })
}

for (const field of [
  'intent',
  'scope',
  'hosts',
  'accounts',
  'recipients',
  'access',
  'totalCeilingMicroUsd',
  'residualRisk',
  'production',
] as const) {
  test(`Pantheon: material authority delta explains ${field}`, () => {
    const b = boundary()
    const value = Array.isArray(b[field])
      ? ['new']
      : field === 'totalCeilingMicroUsd'
        ? 75000001
        : field === 'production'
          ? 'requested'
          : 'changed'
    const delta = valid(classifyAuthorityDelta(b, { ...b, [field]: value }, 'ready'))
    assert.equal(delta.disposition, 'material-exception')
    assert.deepEqual(delta.affectedFields, [field])
  })
}
for (const cause of ['evidence-failure', 'dependency-unavailable', 'routine-rework']) {
  test(`Pantheon: ${cause} is an automatic hold without human exception`, () => {
    assert.equal(
      valid(classifyAuthorityDelta(boundary(), boundary(), cause)).disposition,
      'automatic-hold',
    )
  })
}
test('Pantheon: narrowing and unchanged authority are ordinary refinements', () => {
  assert.equal(
    valid(
      classifyAuthorityDelta(
        boundary(),
        { ...boundary(), hosts: ['A'], totalCeilingMicroUsd: 74000000 },
        'ready',
      ),
    ).disposition,
    'ordinary-refinement',
  )
  refused(classifyAuthorityDelta(null, boundary(), 'ready'))
  refused(classifyAuthorityDelta(boundary(), boundary(), 'assume-approval'))
})
test('Pantheon: material exception carries exact descriptor and evidence without granting expansion', () => {
  const value = {
    descriptor: descriptor(),
    deduplicationKey: hash,
    before: boundary(),
    after: { ...boundary(), hosts: ['A', 'B', 'C'] },
    evidence: [artifact()],
    explanation: 'A new host would expand ratified authority.',
  }
  valid(parseMaterialException(value))
  refused(parseMaterialException({ ...value, after: boundary() }))
  refused(parseMaterialException({ ...value, evidence: [] }))
})

test('Pantheon: closed operation map preserves extension and isolated staging boundaries', () => {
  for (const operation of Object.keys(OPERATIONS)) valid(parseOperation(operation))
  for (const operation of [
    'shell',
    'coordinator.start',
    'fleet.worker.execute',
    'repository.forcePush',
    '__proto__',
    null,
  ])
    refused(parseOperation(operation), 'UNKNOWN_OPERATION')
  assert.equal(OPERATIONS['model.infer'].effect, 'pantheon.v1.model.infer')
  assert.equal(OPERATIONS['model.infer'].requiredTerminal, 'ModelResult')
  assert.equal(OPERATIONS['patch.stage'].effect, 'pantheon.v1.patch.stage')
  assert.equal(OPERATIONS['patch.stage'].requiredTerminal, 'PatchStaged')
  assert.notEqual(OPERATIONS['model.infer'].effect, 'fleet.model.infer')
  assert.notEqual(OPERATIONS['patch.stage'].effect, 'fleet.patch.promote')
  assert.notEqual(OPERATIONS['repository.merge'].effect, 'fleet.patch.promote')
  assert.notEqual(OPERATIONS['worker.execute'].effect, 'fleet.worker.execute')
  assert.equal(OPERATIONS['worker.remote'].consumer, 'P08')
  assert.equal(OPERATIONS['status.read'].effect, null)
})
test('Pantheon: request, denied response and completion frames remain unverified', () => {
  valid(parseNdjsonFrame(line(request())))
  const { descriptor: _, ...common } = request()
  valid(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'response',
        disposition: 'denied',
        denial: 'UNVERIFIED',
        recoveryOwner: 'P02',
      }),
    ),
  )
  valid(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'completion',
        eventId: 'event-1',
        outcome: 'succeeded',
        provenance: provenance(),
      }),
    ),
  )
  refused(
    parseNdjsonFrame(line({ ...common, kind: 'response', disposition: 'admitted', denial: null })),
  )
  for (const denial of [
    'ADMISSION_UNAVAILABLE',
    'REVOKED',
    'EXPIRED',
    'STALE_EPOCH',
    'BUDGET_EXCEEDED',
    'RUNTIME_UNAVAILABLE',
    'IDENTITY_UNAUTHENTICATED',
    'SCOPE_DENIED',
    'EVIDENCE_UNVERIFIED',
    'UNKNOWN_DELIVERY_HELD',
  ]) {
    valid(
      parseNdjsonFrame(
        line({ ...common, kind: 'response', disposition: 'denied', denial, recoveryOwner: 'P03' }),
      ),
    )
  }
  valid(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'response',
        disposition: 'pending',
        denial: null,
        recoveryOwner: null,
      }),
    ),
  )
  refused(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'response',
        disposition: 'pending',
        denial: 'REVOKED',
        recoveryOwner: 'P03',
      }),
    ),
  )
  refused(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'response',
        disposition: 'denied',
        denial: 'REVOKED',
        recoveryOwner: 'invented',
      }),
    ),
  )
  refused(
    parseNdjsonFrame(line({ ...common, kind: 'response', disposition: 'denied', denial: null })),
  )
  refused(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'completion',
        eventId: 'event-1',
        outcome: 'staged-to-isolated-ref',
        provenance: provenance(),
      }),
    ),
  )
})
test('Pantheon: wire identity, operation, head, epoch and evidence mismatches refuse', () => {
  for (const changed of [
    { fencingEpoch: 2 },
    { operation: 'repository.merge' },
    { identity: { ...descriptor().identity, hostId: 'B' } },
    { artifact: { ...artifact(), sourceHead: 'd'.repeat(40) } },
  ])
    refused(parseNdjsonFrame(line({ ...request(), ...changed })), 'MISMATCH')
  const { descriptor: _, ...common } = request()
  refused(
    parseNdjsonFrame(
      line({
        ...common,
        kind: 'completion',
        eventId: 'e1',
        outcome: 'succeeded',
        provenance: { ...provenance(), requestHash: otherHash },
      }),
    ),
    'MISMATCH',
  )
  refused(
    parseNdjsonFrame(line({ ...request(), operation: 'unbounded.shell' })),
    'UNKNOWN_OPERATION',
  )
})
for (const bad of [
  null,
  '',
  '{}',
  '{}\n{}\n',
  '{\n}\n',
  '{bad}\n',
  '{"x":1,"x":2}\n',
  '{"x":{"a":1,"\\u0061":2}}\n',
  '{"a":[{"x":1,"x":2}]}\n',
  '{"a":1,}\n',
  '[]\n',
]) {
  test(`Pantheon: malformed or duplicate-key wire ${JSON.stringify(bad)} refuses`, () =>
    refused(parseNdjsonFrame(bad)))
}
test('Pantheon: wire byte, depth and collection bounds bite', () => {
  refused(parseNdjsonFrame(`${' '.repeat(LIMITS.frameBytes)}\n`), 'LIMIT_EXCEEDED')
  refused(parseNdjsonFrame(`${'['.repeat(18)}0${']'.repeat(18)}\n`), 'LIMIT_EXCEEDED')
  refused(parseNdjsonFrame(`${JSON.stringify('é'.repeat(40000))}\n`), 'LIMIT_EXCEEDED')
  refused(
    parseDispatchIntent({
      ...descriptor(),
      allowedFiles: Array.from({ length: 257 }, (_, i) => `file-${i}`),
    }),
    'LIMIT_EXCEEDED',
  )
})
test('Pantheon: invalid string escapes in values and keys are malformed JSON', () => {
  for (const token of ['"\\q"', '"\\uZZZZ"', '"\\u12"', '"\t"']) {
    refused(parseNdjsonFrame(`{"x":${token}}\n`), 'MALFORMED_JSON')
    refused(parseNdjsonFrame(`{${token}:1}\n`), 'MALFORMED_JSON')
  }
  refused(parseNdjsonFrame(`${'['.repeat(17)}"\\q"${']'.repeat(17)}\n`), 'LIMIT_EXCEEDED')
  refused(parseNdjsonFrame(`${' '.repeat(LIMITS.frameBytes)}"\\q"\n`), 'LIMIT_EXCEEDED')
})

test('Pantheon: shared 71-case wire contract', () => {
  const fixturePath = process.env.PANTHEON_WIRE_FIXTURES
  assert.ok(fixturePath, 'PANTHEON_WIRE_FIXTURES must name the shared read-only bundle')
  const bundle = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    schema: string
    examples: {
      id: string
      inputUtf8: string
      byteLength: number
      expected: { status: string; trust?: string; code?: string; field?: string }
    }[]
  }
  assert.equal(bundle.schema, 'pantheon.p01-wire-fixture-bundle.v1')
  assert.equal(bundle.examples.length, 71)
  assert.equal(new Set(bundle.examples.map((example) => example.id)).size, 71)
  for (const example of bundle.examples) {
    assert.equal(Buffer.byteLength(example.inputUtf8, 'utf8'), example.byteLength, example.id)
    const actual = parseNdjsonFrame(example.inputUtf8)
    assert.equal(actual.status, example.expected.status, example.id)
    if (actual.status === 'structurally-valid') {
      assert.equal(actual.trust, example.expected.trust, example.id)
      assert.equal('admitted' in actual, false, example.id)
    } else {
      assert.equal(actual.code, example.expected.code, example.id)
      if (example.expected.field !== undefined)
        assert.equal(actual.field, example.expected.field, example.id)
    }
  }
})
test('Pantheon: hostile objects, getters, cycles, prototypes and sparse arrays refuse', () => {
  let getterCalls = 0
  const withGetter = {
    ...descriptor(),
    get accepted() {
      getterCalls++
      return true
    },
  }
  refused(parseDispatchIntent(withGetter))
  assert.equal(getterCalls, 0)
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  for (const input of [
    null,
    undefined,
    false,
    [],
    new Date(),
    cycle,
    Object.create(descriptor()),
    { ...descriptor(), allowedFiles: Array(1) },
  ])
    refused(parseDispatchIntent(input))
  const parsed = valid(parseDispatchIntent(descriptor()))
  assert.throws(() => {
    ;(parsed.allowedFiles as string[]).push('escape')
  })
})
for (const codePoint of [
  0x0009,
  0x000a,
  0x000b,
  0x000c,
  0x000d,
  0x0020,
  0x00a0,
  0x1680,
  ...Array.from({ length: 11 }, (_, i) => 0x2000 + i),
  0x2028,
  0x2029,
  0x202f,
  0x205f,
  0x3000,
  0xfeff,
]) {
  test(`Pantheon: shared edge whitespace U+${codePoint.toString(16)} refuses`, () => {
    const character = String.fromCodePoint(codePoint)
    for (const field of ['worktree', 'branch']) {
      for (const value of [character, `${character}value`, `value${character}`]) {
        refused(parseDispatchIntent({ ...descriptor(), [field]: value }), 'INVALID_SHAPE')
      }
    }
  })
}
test('Pantheon: non-edge Unicode text retains separate identifier constraints', () => {
  for (const character of ['\u0085', '\u200b']) {
    for (const field of ['worktree', 'branch']) {
      for (const value of [character, `${character}value`, `value${character}`]) {
        valid(parseDispatchIntent({ ...descriptor(), [field]: value }))
      }
    }
    refused(parseDispatchIntent({ ...descriptor(), modelProfile: character }), 'INVALID_SHAPE')
    refused(parseDispatchIntent({ ...descriptor(), allowedFiles: [character] }), 'INVALID_PATH')
  }
})
test('Pantheon: interior whitespace preserves the separate control-character rule', () => {
  for (const character of ['\t', '\n', '\r', '\u00a0', '\ufeff']) {
    valid(parseDispatchIntent({ ...descriptor(), worktree: `a${character}b` }))
  }
  for (const character of ['\u0000', '\u000b', '\u000c', '\u001f']) {
    refused(parseDispatchIntent({ ...descriptor(), worktree: `a${character}b` }), 'INVALID_SHAPE')
  }
})
for (const date of ['0001-01-01', '0099-12-31', '2000-02-29', '9999-12-31']) {
  test(`Pantheon: exact UTC calendar supports ${date} without year remapping`, () => {
    const issuedAt = `${date}T00:00:00.000Z`
    const deadline = `${date}T23:59:59.999Z`
    const parsed = valid(parseDispatchIntent({ ...descriptor(), issuedAt, deadline }))
    assert.equal(parsed.issuedAt, issuedAt)
    assert.equal(parsed.deadline, deadline)
  })
}
test('Pantheon: four-digit year zero refuses in both UTC fields', () => {
  for (const field of ['issuedAt', 'deadline']) {
    refused(
      parseDispatchIntent({ ...descriptor(), [field]: '0000-01-01T00:00:00.000Z' }),
      'INVALID_SHAPE',
    )
  }
})
for (const year of ['10000', '+010000', '-000001']) {
  test(`Pantheon: extended UTC year ${year} retains length-limit precedence`, () => {
    for (const field of ['issuedAt', 'deadline']) {
      refused(
        parseDispatchIntent({ ...descriptor(), [field]: `${year}-01-01T00:00:00.000Z` }),
        'LIMIT_EXCEEDED',
      )
    }
  })
}
test('Pantheon: invalid calendar days and non-increasing deadlines still refuse', () => {
  for (const issuedAt of ['1900-02-29T00:00:00.000Z', '2026-02-30T00:00:00.000Z']) {
    refused(parseDispatchIntent({ ...descriptor(), issuedAt }), 'INVALID_SHAPE')
  }
  refused(
    parseDispatchIntent({ ...descriptor(), deadline: descriptor().issuedAt }),
    'INVALID_SHAPE',
  )
})
test('Pantheon: malformed Unicode cannot alias canonical evidence text', () => {
  refused(parseReviewResult({ ...review(), reviewText: '\ud800' }, subject()))
  refused(parseReviewResult({ ...review(), reviewText: '\udc00' }, subject()))
  valid(
    parseReviewResult(
      { ...review(), reviewText: 'Complete review includes Unicode 🧪.' },
      subject(),
    ),
  )
})

function completion() {
  const { descriptor: _, ...common } = request()
  return {
    ...common,
    kind: 'completion',
    eventId: 'event-1',
    outcome: 'succeeded',
    provenance: provenance(),
  }
}
function ordered(value: unknown, order: number): unknown {
  if (Array.isArray(value)) return value.map((item) => ordered(item, order))
  if (value === null || typeof value !== 'object') return value
  const entries = Object.entries(value)
  if (order === 1) entries.reverse()
  if (order === 2) {
    const first = entries.shift()
    if (first) entries.push(first)
  }
  return Object.fromEntries(entries.map(([key, item]) => [key, ordered(item, order)]))
}
const compoundCases = [
  {
    name: 'descriptor path before invalid version',
    input: {
      ...request(),
      descriptor: { ...descriptor(), version: 'wrong', allowedFiles: ['../escape'] },
    },
    code: 'INVALID_PATH',
    field: '$.descriptor.allowedFiles[0]',
  },
  {
    name: 'complete artifact list before duplicate detection',
    input: {
      ...completion(),
      provenance: {
        ...provenance(),
        subject: {
          ...subject(),
          artifacts: [artifact(), artifact(), { ...artifact(), path: '../escape' }],
        },
      },
    },
    code: 'INVALID_PATH',
    field: '$.provenance.subject.artifacts[2].path',
  },
  {
    name: 'subject artifact path before invalid unit',
    input: {
      ...completion(),
      provenance: {
        ...provenance(),
        subject: { ...subject(), unit: '', artifacts: [{ ...artifact(), path: '../escape' }] },
      },
    },
    code: 'INVALID_PATH',
    field: '$.provenance.subject.artifacts[0].path',
  },
  {
    name: 'provenance head mismatch before invalid state',
    input: {
      ...completion(),
      provenance: {
        ...provenance(),
        state: 'verified',
        result: { ...artifact(), sourceHead: 'd'.repeat(40) },
      },
    },
    code: 'MISMATCH',
    field: '$.provenance.original',
  },
  {
    name: 'descriptor calendar before invalid path',
    input: {
      ...request(),
      descriptor: {
        ...descriptor(),
        issuedAt: '0000-01-01T00:00:00.000Z',
        allowedFiles: ['../escape'],
      },
    },
    code: 'INVALID_SHAPE',
    field: '$.descriptor.issuedAt',
  },
  {
    name: 'provenance result path before invalid state',
    input: {
      ...completion(),
      provenance: {
        ...provenance(),
        state: 'verified',
        result: { ...artifact(), path: '../escape' },
      },
    },
    code: 'INVALID_PATH',
    field: '$.provenance.result.path',
  },
]
for (const example of compoundCases) {
  for (const order of [0, 1, 2]) {
    test(`Pantheon: compound ${example.name}, property order ${order}`, () => {
      const actual = parseNdjsonFrame(line(ordered(example.input, order)))
      refused(actual, example.code)
      if (actual.status === 'refused') assert.equal(actual.field, example.field)
    })
  }
}
for (const count of [4095, 4096, 4099, 4100, 4101]) {
  test(`Pantheon: flat object ${count} keys reaches shape validation`, () => {
    const input = Object.fromEntries(Array.from({ length: count }, (_, i) => [`k${i}`, 0]))
    refused(parseNdjsonFrame(line(input)), 'INVALID_SHAPE')
  })
}
for (const count of [8190, 8191, 8192]) {
  test(`Pantheon: flat array ${count} includes length in capture precheck`, () => {
    refused(
      parseNdjsonFrame(line(Array(count).fill(0))),
      count === 8190 ? 'INVALID_SHAPE' : 'LIMIT_EXCEEDED',
    )
  })
}
for (const order of [0, 1, 2]) {
  test(`Pantheon: adjacent valid boundaries survive property order ${order}`, () => {
    const input = {
      ...request(),
      descriptor: {
        ...descriptor(),
        allowedFiles: Array.from({ length: LIMITS.list }, (_, i) => `src/file-${i}.ts`),
        worktree: 'w'.repeat(512),
        branch: 'b'.repeat(256),
      },
    }
    valid(parseNdjsonFrame(line(ordered(input, order))))
    valid(parseNdjsonFrame(line(ordered(completion(), order))))
    refused(
      parseNdjsonFrame(
        line({ ...input, descriptor: { ...input.descriptor, worktree: 'w'.repeat(513) } }),
      ),
      'LIMIT_EXCEEDED',
    )
  })
}
