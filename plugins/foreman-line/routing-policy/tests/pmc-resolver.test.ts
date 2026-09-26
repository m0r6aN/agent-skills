import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { resolvePmcRouteV1 } from '../src/index.js'

const reverseRecord = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).reverse())
const stale = (claim: Fixture) => {
  claim.evidence.expiresAtUtc = '2026-09-26T11:59:59.999Z'
}
const future = (claim: Fixture) => {
  claim.evidence.observedAtUtc = '2026-09-26T12:00:00.001Z'
}
const provenanceFreshness = (f: Fixture, kind: 'stale' | 'future') => {
  f.context.catalog.provenance.sourceTimeUtc =
    kind === 'stale' ? '2026-09-26T10:59:59.999Z' : '2026-09-26T12:00:00.001Z'
  f.context.catalog.provenance.ageMs = kind === 'stale' ? 3600001 : 0
}
for (const reversed of [false, true]) {
  for (const first of ['stale', 'future'] as const) {
    const expected = first === 'stale' ? 'FRESHNESS_STALE_REFUSED' : 'FRESHNESS_FUTURE_REFUSED'
    const earlier = first === 'stale' ? stale : future
    const later = first === 'stale' ? future : stale
    test(`catalog freshness order source before provenance ${first} ${reversed}`, () => {
      const f = fixture()
      earlier(f.context.catalog.source)
      provenanceFreshness(f, first === 'stale' ? 'future' : 'stale')
      if (reversed) {
        f.context.catalog = reverseRecord(f.context.catalog)
        f.context = reverseRecord(f.context)
      }
      refused(f, expected)
    })
    for (const field of [
      'episode',
      'freshness',
      'determination',
      'subjectInstance',
      'subjectFamily',
      'independence',
      'budget',
    ]) {
      test(`catalog freshness order provenance before ${field} ${first} ${reversed}`, () => {
        const f = fixture()
        setLane(f, 'L1')
        const s = subject(f)
        f.context.independence.value.subjects = [s]
        const claim =
          field === 'determination'
            ? f.context.independence.value.determination
            : field === 'subjectInstance'
              ? s.instanceId
              : field === 'subjectFamily'
                ? s.family
                : f.context[field]
        provenanceFreshness(f, first)
        later(claim)
        if (reversed) {
          f.context.independence.value.subjects = [reverseRecord(s)]
          f.context.independence.value = reverseRecord(f.context.independence.value)
          f.context.independence = reverseRecord(f.context.independence)
          f.context.catalog = reverseRecord(f.context.catalog)
          f.context = reverseRecord(f.context)
        }
        refused(f, expected)
      })
    }
  }
}
for (const reversed of [false, true]) {
  test(`binding family precedes instance freshness ${reversed}`, () => {
    const f = fixture(),
      b = f.context.bindings[2]
    stale(b.family)
    future(b.instanceId)
    if (reversed) f.context.bindings[2] = reverseRecord(b)
    assert.deepEqual(
      receipt(f).candidates[2]?.refusals.filter((c) => c.startsWith('FRESHNESS_')),
      ['FRESHNESS_STALE_REFUSED', 'FRESHNESS_FUTURE_REFUSED'],
    )
  })
  test(`fallback disposition precedes quality freshness ${reversed}`, () => {
    const f = fixture()
    fallback(f)
    stale(f.request.attempt.priorDisposition)
    future(f.request.attempt.primaryQuality)
    if (reversed) f.request.attempt = reverseRecord(f.request.attempt)
    assert.deepEqual(
      receipt(f).candidates[3]?.refusals.filter((c) => c.startsWith('FRESHNESS_')),
      ['FRESHNESS_STALE_REFUSED', 'FRESHNESS_FUTURE_REFUSED'],
    )
  })
  test(`declared nested subject freshness order ignores key order ${reversed}`, () => {
    const f = fixture()
    setLane(f, 'L1')
    const s = subject(f)
    stale(s.instanceId)
    future(s.family)
    f.context.independence.value.subjects = [reversed ? reverseRecord(s) : s]
    refused(f, 'FRESHNESS_STALE_REFUSED')
  })
  test(`nested claim value precedes enclosing evidence ${reversed}`, () => {
    const f = fixture()
    stale(f.context.independence.value.determination)
    future(f.context.independence)
    if (reversed) f.context.independence = reverseRecord(f.context.independence)
    refused(f, 'FRESHNESS_STALE_REFUSED')
  })
  test(`declared global freshness order ignores context key order ${reversed}`, () => {
    const f = fixture()
    stale(f.context.episode)
    future(f.context.freshness)
    if (reversed) f.context = reverseRecord(f.context)
    refused(f, 'FRESHNESS_STALE_REFUSED')
  })
  test(`review subject array index precedes later subject ${reversed}`, () => {
    const f = fixture()
    setLane(f, 'L1')
    const a = subject(f),
      b = subject(f, 'coordinator')
    stale(a.family)
    future(b.instanceId)
    f.context.independence.value.subjects = [a, b].map((s) => (reversed ? reverseRecord(s) : s))
    refused(f, 'FRESHNESS_STALE_REFUSED')
  })
}
const provenanceConflicts: [string, unknown][] = [
  ['evaluationTimeUtc', '2026-09-26T12:00:00.001Z'],
  ['digestSha256', 'c'.repeat(64)],
  ['approvedConfigRef', 'different'],
  ['ageMs', 1],
  ['maxAgeMs', 86400001],
]
for (const [field, value] of provenanceConflicts) {
  for (const unknown of ['episode', 'freshness', 'independence', 'budget', 'determination']) {
    test(`available provenance ${field} precedes unknown ${unknown}`, () => {
      const f = fixture()
      f.context.catalog.provenance[field] = value
      if (unknown === 'determination')
        f.context.independence.value.determination = { status: 'unknown' }
      else f.context[unknown] = { status: 'unknown' }
      refused(f, 'CONTEXT_BINDING_REFUSED')
    })
  }
  test(`unknown source gates only dependent provenance ${field}`, () => {
    const f = fixture()
    f.context.catalog.source = { status: 'unknown' }
    f.context.catalog.provenance[field] = value
    refused(
      f,
      ['digestSha256', 'approvedConfigRef'].includes(field)
        ? 'GLOBAL_EVIDENCE_UNPROVEN'
        : 'CONTEXT_BINDING_REFUSED',
    )
  })
}
for (const field of ['episode', 'freshness', 'independence', 'budget']) {
  test(`consistent provenance retains unknown ${field} refusal`, () => {
    const f = fixture()
    f.context[field] = { status: 'unknown' }
    refused(f, 'GLOBAL_EVIDENCE_UNPROVEN')
  })
}

const fixture = () =>
  JSON.parse(readFileSync(new URL('./fixtures/pmc-resolver-v1.json', import.meta.url), 'utf8'))
type Fixture = ReturnType<typeof fixture>
const decision = (f: Fixture) => resolvePmcRouteV1(f.request, f.context)
const receipt = (f: Fixture) => {
  const r = decision(f)
  return r.ok ? r.decision.audit : r.audit
}
const refused = (f: Fixture, code: string) => {
  const r = decision(f)
  assert.ok(!r.ok)
  assert.equal(r.code, code)
  return r.audit
}
const candidateRefuses = (f: Fixture, code: string, index = 2) => {
  const a = receipt(f)
  assert.equal(a.candidates.length, 4)
  assert.ok(
    a.candidates[index]?.refusals.includes(code as never),
    JSON.stringify(a.candidates[index]),
  )
  return a
}
const recorded = (value: unknown) => ({
  status: 'recorded',
  value,
  evidenceRef: 'synthetic-refreshed',
})
function setLane(f: Fixture, lane: string) {
  const declaration = f.context.projection.policy.lanes.find(
    (l: { lane: string }) => l.lane === lane,
  )
  f.request.lane = lane
  f.request.subRole = declaration.subRoles[0]
  f.request.routingClass = declaration.routingClasses[0]
  f.context.episode.value.lane = lane
  f.context.budget.value.routingClass = f.request.routingClass
  f.context.independence.value.determination.value.reviewedLane = lane === 'L2' ? 'L4' : lane
  f.context.independence.value.determination.value.differentFamilyRequired = lane === 'L3'
  const walk = (v: unknown) => {
    if (v && typeof v === 'object') {
      const r = v as Record<string, unknown>
      if (Object.hasOwn(r, 'receiptId')) r.lane = lane
      Object.values(r).forEach(walk)
    }
  }
  walk(f.context)
}
function subject(f: Fixture, role = 'builder') {
  const instance = structuredClone(f.context.bindings[0].instanceId),
    family = structuredClone(f.context.bindings[0].family)
  instance.evidence.bindingId = null
  family.evidence.bindingId = null
  instance.value = 'other-instance'
  family.value = 'other-family'
  return {
    subjectId: `subject-${role}`,
    role,
    artifactDigest: 'a'.repeat(64),
    instanceId: instance,
    family,
  }
}
function fallback(f: Fixture) {
  const priorDigest = 'b'.repeat(64),
    decisionDigest = 'c'.repeat(64)
  const quality = structuredClone(f.context.bindings[2].quality),
    outcome = structuredClone(f.context.bindings[2].enabled)
  for (const c of [quality, outcome]) c.evidence.requestDigest = priorDigest
  outcome.value = 'terminal-failed-settled'
  f.request.attempt = {
    kind: 'fallback',
    priorRequestId: 'prior',
    priorDecisionDigest: decisionDigest,
    priorRequestDigest: priorDigest,
    primaryBindingId: 'binding-2',
    priorDisposition: outcome,
    primaryQuality: quality,
  }
  f.context.episode.value.attempts = [
    {
      requestId: 'prior',
      requestDigest: priorDigest,
      decisionDigest,
      bindingId: 'binding-2',
      provider: 'openrouter',
      matrixRole: 'primary',
      disposition: 'terminal-failed-settled',
    },
  ]
}

const globals: [string, (f: Fixture) => void, string][] = [
  [
    'unknown version',
    (f) => {
      f.request.version = 'pmc/v9'
    },
    'VERSION_REFUSED',
  ],
  [
    'missing field',
    (f) => {
      delete f.request.taskId
    },
    'INPUT_REFUSED',
  ],
  [
    'request extra',
    (f) => {
      f.request.winner = 'binding-0'
    },
    'INPUT_REFUSED',
  ],
  [
    'zero maxima',
    (f) => {
      f.request.requirements.maximumInputTokens = 0
    },
    'INPUT_REFUSED',
  ],
  [
    'ranking exceeds maxima',
    (f) => {
      f.request.requirements.rankingTokens.input = 1001
    },
    'INPUT_REFUSED',
  ],
  [
    'lane mismatch',
    (f) => {
      f.request.subRole = 'verifier'
    },
    'LANE_REQUEST_REFUSED',
  ],
  [
    'context extra',
    (f) => {
      f.context.rawReceipt = 'secret'
    },
    'CONTEXT_REFUSED',
  ],
  [
    'projection permit flag',
    (f) => {
      f.context.projection.evidenceOnly = false
    },
    'POLICY_REFUSED',
  ],
  [
    'P1 policy invalid',
    (f) => {
      f.context.projection.policy.compatibility = 'replacement'
    },
    'POLICY_REFUSED',
  ],
  [
    'unknown freshness',
    (f) => {
      f.context.freshness = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'unknown budget',
    (f) => {
      f.context.budget = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'unknown episode',
    (f) => {
      f.context.episode = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'unknown independence',
    (f) => {
      f.context.independence = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'unknown determination',
    (f) => {
      f.context.independence.value.determination = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'unknown catalog source',
    (f) => {
      f.context.catalog.source = { status: 'unknown' }
    },
    'GLOBAL_EVIDENCE_UNPROVEN',
  ],
  [
    'binding missing',
    (f) => {
      f.context.bindings.pop()
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'binding duplicate identifier',
    (f) => {
      f.context.bindings[3].bindingId = 'binding-2'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'catalog wrong scope',
    (f) => {
      f.context.catalog.results[3].providerModelId = 'unlisted'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'catalog duplicate tuple',
    (f) => {
      f.context.catalog.results[3].providerModelId = 'model-2'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'binding receipt scope',
    (f) => {
      f.context.bindings[2].cost.evidence.requestDigest = 'd'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'global receipt scope',
    (f) => {
      f.context.budget.evidence.bindingId = 'binding-2'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'episode task scope',
    (f) => {
      f.context.episode.value.taskId = 'other'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'provenance age',
    (f) => {
      f.context.catalog.provenance.ageMs = 1
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'provenance snapshot digest',
    (f) => {
      f.context.catalog.provenance.digestSha256 = 'b'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'provenance evaluation',
    (f) => {
      f.context.catalog.provenance.evaluationTimeUtc = '2026-09-26T12:01:00.000Z'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'provenance config',
    (f) => {
      f.context.catalog.provenance.approvedConfigRef = 'other'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'catalog maximum widened',
    (f) => {
      f.context.catalog.provenance.maxAgeMs = 86400001
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'global future',
    (f) => {
      f.context.budget.evidence.observedAtUtc = '2026-09-26T12:00:00.001Z'
    },
    'FRESHNESS_FUTURE_REFUSED',
  ],
  [
    'global stale',
    (f) => {
      f.context.budget.evidence.expiresAtUtc = '2026-09-26T11:59:59.999Z'
    },
    'FRESHNESS_STALE_REFUSED',
  ],
  [
    'budget frozen',
    (f) => {
      f.context.budget.value.frozen = true
    },
    'BUDGET_FROZEN',
  ],
  [
    'budget workflow',
    (f) => {
      f.context.budget.value.workflowId = 'other'
    },
    'BUDGET_UNPROVEN',
  ],
  [
    'budget class',
    (f) => {
      f.context.budget.value.routingClass = 'boilerplate'
    },
    'BUDGET_UNPROVEN',
  ],
  [
    'budget unsafe aggregate',
    (f) => {
      f.context.budget.value.settledMicroUsd = Number.MAX_SAFE_INTEGER
      f.context.budget.value.outstandingMicroUsd = 1
    },
    'BUDGET_UNPROVEN',
  ],
  [
    'budget negative remaining',
    (f) => {
      f.context.budget.value.outstandingMicroUsd = 10000001
    },
    'BUDGET_EXCEEDED',
  ],
  [
    'artifact mismatch',
    (f) => {
      f.context.independence.value.determination.value.artifactDigest = 'b'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
]
for (const [name, mutate, code] of globals)
  test(`global precedence: ${name}`, () => {
    const f = fixture()
    mutate(f)
    const a = refused(f, code)
    assert.equal(a.inputs, null)
    assert.deepEqual(a.candidates, [])
    assert.equal(a.evidenceMode, 'not-inspected')
  })

const filters: [string, (f: Fixture) => void, string][] = [
  [
    'identity held',
    (f) => {
      const b = f.context.projection.policy.bindings[2]
      b.identityState = 'held'
      b.identityRefusalCodes = ['AC2A_ZERO_MATCH']
    },
    'IDENTITY_UNPROVEN',
  ],
  [
    'RCM refusal',
    (f) => {
      const r = f.context.catalog.results[2]
      delete r.facts
      r.outcome = 'refused'
      r.codes = ['MISSING_MODEL_REFUSED']
    },
    'IDENTITY_UNPROVEN',
  ],
  [
    'fact identity mismatch',
    (f) => {
      f.context.catalog.results[2].facts.id = 'other'
    },
    'IDENTITY_UNPROVEN',
  ],
  [
    'endpoint mismatch',
    (f) => {
      f.context.bindings[2].catalogBaseUrl.value += '/'
    },
    'ENDPOINT_MISMATCH',
  ],
  [
    'protocol unknown',
    (f) => {
      f.context.bindings[2].protocol = { status: 'unknown' }
    },
    'IDENTITY_UNPROVEN',
  ],
  [
    'classes unknown',
    (f) => {
      f.context.bindings[2].dataClasses = { status: 'unknown' }
    },
    'DATA_CLASS_UNKNOWN',
  ],
  [
    'classes ineligible',
    (f) => {
      f.context.bindings[2].dataClasses.value = ['internal']
    },
    'DATA_CLASS_INELIGIBLE',
  ],
  [
    'privacy unknown',
    (f) => {
      f.request.dataClass = 'internal'
      f.context.bindings[2].transport = { status: 'unknown' }
    },
    'PRIVACY_UNPROVEN',
  ],
  [
    'privacy false',
    (f) => {
      f.request.dataClass = 'restricted'
      f.context.bindings[2].transport.value.zdr = false
    },
    'PRIVACY_UNPROVEN',
  ],
  [
    'tool unknown',
    (f) => {
      f.context.bindings[2].toolUse = { status: 'unknown' }
    },
    'CAPABILITY_UNVERIFIED',
  ],
  [
    'structured missing',
    (f) => {
      f.context.bindings[2].structuredOutput.value = false
    },
    'CAPABILITY_MISSING',
  ],
  [
    'reasoning missing',
    (f) => {
      f.context.catalog.results[2].facts.reasoning = false
    },
    'CAPABILITY_MISSING',
  ],
  [
    'reasoning with off',
    (f) => {
      f.request.requirements.thinkingLevel = 'off'
    },
    'CAPABILITY_MISSING',
  ],
  [
    'thinking unknown',
    (f) => {
      f.context.catalog.results[2].facts.thinkingLevels = { status: 'unknown' }
    },
    'CAPABILITY_UNVERIFIED',
  ],
  [
    'thinking null',
    (f) => {
      f.context.catalog.results[2].facts.thinkingLevels.levels[1].providerValue = null
    },
    'CAPABILITY_MISSING',
  ],
  [
    'thinking absent',
    (f) => {
      f.request.requirements.thinkingLevel = 'xhigh'
    },
    'CAPABILITY_MISSING',
  ],
  [
    'modality missing',
    (f) => {
      f.request.requirements.inputModalities = ['image']
      f.context.catalog.results[2].facts.inputModalities = ['text']
    },
    'CAPABILITY_MISSING',
  ],
  [
    'instance unknown',
    (f) => {
      f.context.bindings[2].instanceId = { status: 'unknown' }
    },
    'INDEPENDENCE_UNPROVEN',
  ],
  [
    'context too small',
    (f) => {
      f.context.catalog.results[2].facts.contextWindow = 1199
    },
    'CONTEXT_INSUFFICIENT',
  ],
  [
    'output too small',
    (f) => {
      f.context.catalog.results[2].facts.maxTokens = 199
    },
    'CONTEXT_INSUFFICIENT',
  ],
  [
    'cost unknown',
    (f) => {
      f.context.bindings[2].cost = { status: 'unknown' }
    },
    'COST_UNKNOWN',
  ],
  [
    'remaining liabilities',
    (f) => {
      f.context.budget.value.outstandingMicroUsd = 9999001
    },
    'BUDGET_EXCEEDED',
  ],
  [
    'class ceiling',
    (f) => {
      f.context.budget.value.classCeilingMicroUsd = 999
    },
    'BUDGET_EXCEEDED',
  ],
  [
    'enabled unknown',
    (f) => {
      f.context.bindings[2].enabled = { status: 'unknown' }
    },
    'AVAILABILITY_UNVERIFIED',
  ],
  [
    'availability false',
    (f) => {
      f.context.bindings[2].available.value = false
    },
    'AVAILABILITY_UNVERIFIED',
  ],
  [
    'availability static',
    (f) => {
      f.context.bindings[2].available.evidence.evidenceState = 'static-conformance'
    },
    'AVAILABILITY_UNVERIFIED',
  ],
  [
    'availability stale',
    (f) => {
      f.context.bindings[2].available.evidence.expiresAtUtc = '2026-09-26T11:59:59.999Z'
    },
    'FRESHNESS_STALE_REFUSED',
  ],
  [
    'binding future',
    (f) => {
      f.context.bindings[2].quality.evidence.observedAtUtc = '2026-09-26T12:00:00.001Z'
    },
    'FRESHNESS_FUTURE_REFUSED',
  ],
  [
    'quality unknown',
    (f) => {
      f.context.bindings[2].quality = { status: 'unknown' }
    },
    'QUALITY_UNRECORDED',
  ],
  [
    'quality out of range',
    (f) => {
      f.context.bindings[2].quality.value = 1.001
    },
    'QUALITY_UNRECORDED',
  ],
  [
    'quality wrong state',
    (f) => {
      f.context.bindings[2].quality.evidence.evidenceState = 'live-availability'
    },
    'QUALITY_UNRECORDED',
  ],
]
for (const [name, mutate, code] of filters)
  test(`candidate filter: ${name}`, () => {
    const f = fixture()
    mutate(f)
    candidateRefuses(f, code)
  })

const conflicts: [string, unknown, string][] = [
  ['dataClasses', ['public'], 'DATA_CLASS_INELIGIBLE'],
  ['transportRequirements', { data_collection: 'allow', zdr: false }, 'PRIVACY_UNPROVEN'],
  ['toolUse', false, 'CAPABILITY_MISSING'],
  ['structuredOutput', false, 'CAPABILITY_MISSING'],
  ['reasoning', false, 'CAPABILITY_MISSING'],
  ['inputModalities', ['text'], 'CAPABILITY_MISSING'],
  ['thinkingLevels', ['high'], 'CAPABILITY_MISSING'],
  ['contextWindow', 9999, 'CONTEXT_INSUFFICIENT'],
  ['maxTokens', 1999, 'CONTEXT_INSUFFICIENT'],
  ['enabled', false, 'AVAILABILITY_UNVERIFIED'],
  [
    'availability',
    {
      available: false,
      checkedAtUtc: 'old',
      attestationRef: 'old',
      evidenceState: 'live-availability',
    },
    'AVAILABILITY_UNVERIFIED',
  ],
  [
    'qualityByLane',
    [{ lane: 'L4', score: 0.7, evidenceRef: 'old', evidenceState: 'model-quality' }],
    'QUALITY_UNRECORDED',
  ],
  ['rates', { input: 2, output: 2, unit: 'USD per 1M tokens' }, 'COST_INVALID'],
]
for (const [field, value, code] of conflicts)
  test(`known semantic conflict: ${field}`, () => {
    const f = fixture()
    f.context.projection.policy.bindings[2].eligibility[field] = recorded(value)
    candidateRefuses(f, code)
  })
for (const field of ['protocol', 'catalogBaseUrl'])
  test(`known identity conflict: ${field}`, () => {
    const f = fixture()
    f.context.projection.policy.bindings[2][field] = recorded('different')
    candidateRefuses(f, 'ENDPOINT_MISMATCH')
  })
test('known family conflicts even without a family duty', () => {
  const f = fixture()
  f.context.projection.policy.candidates[2].family = recorded('different')
  candidateRefuses(f, 'INDEPENDENCE_VIOLATION')
})
test('fresh metadata may change while semantic booleans, scores and sets agree', () => {
  const f = fixture(),
    e = f.context.projection.policy.bindings[2].eligibility
  e.availability = recorded({
    available: true,
    checkedAtUtc: 'historical',
    attestationRef: 'historical',
    evidenceState: 'live-availability',
  })
  e.qualityByLane = recorded([
    { lane: 'L4', score: 0.8, evidenceRef: 'historical', evidenceState: 'model-quality' },
  ])
  e.inputModalities = recorded(['image', 'text'])
  e.thinkingLevels = recorded(['high', 'off'])
  assert.ok(decision(f).ok)
})

for (const lane of ['L1', 'L2', 'L3', 'L4', 'L5'])
  test(`lane ${lane} provider and independence contract`, () => {
    const f = fixture()
    setLane(f, lane)
    if (lane === 'L2') f.context.independence.value.subjects = [subject(f)]
    const r = decision(f)
    assert.ok(r.ok)
    assert.equal(
      r.decision.bindingId,
      ['L1', 'L2', 'L5'].includes(lane) ? 'binding-0' : 'binding-2',
    )
    const obligations = r.decision.independenceObligations
    if (lane === 'L2') {
      assert.equal(obligations.futureReview, null)
      assert.deepEqual(obligations.currentSelection.excludedInstanceIds, ['other-instance'])
    } else {
      assert.equal(obligations.futureReview?.distinctInstance, true)
      assert.equal(obligations.futureReview?.differentFamily, lane === 'L3')
      assert.equal(
        obligations.futureReview?.duty,
        ['L1', 'L3'].includes(lane) ? 'separate-l2-review' : 'parcel-review',
      )
      assert.deepEqual(obligations.currentSelection.subjectIds, [])
    }
    if (lane === 'L1' || lane === 'L2')
      assert.ok(r.decision.audit.candidates[2]?.refusals.includes('OFF_PIN'))
  })
test('L2 empty subjects cannot waive the current independent review', () => {
  const f = fixture()
  setLane(f, 'L2')
  candidateRefuses(f, 'INDEPENDENCE_UNPROVEN', 0)
  refused(f, 'PINNED_PROVIDER_NO_ELIGIBLE')
})
for (const role of ['builder', 'coordinator'])
  for (const mode of ['instance', 'family', 'unknown-instance', 'unknown-family'])
    test(`L2 ${role} ${mode} exclusion`, () => {
      const f = fixture()
      setLane(f, 'L2')
      f.context.independence.value.determination.value.differentFamilyRequired = true
      const s = subject(f, role)
      f.context.independence.value.subjects = [s]
      if (mode === 'instance') s.instanceId.value = 'instance-0'
      if (mode === 'family') s.family.value = 'family-0'
      if (mode === 'unknown-instance') s.instanceId = { status: 'unknown' }
      if (mode === 'unknown-family') s.family = { status: 'unknown' }
      candidateRefuses(
        f,
        mode.startsWith('unknown') ? 'INDEPENDENCE_UNPROVEN' : 'INDEPENDENCE_VIOLATION',
        0,
      )
    })
test('L1 counterpart cannot verify itself', () => {
  const f = fixture()
  setLane(f, 'L1')
  const s = subject(f, 'coordinator')
  s.instanceId.value = 'instance-0'
  f.context.independence.value.subjects = [s]
  candidateRefuses(f, 'INDEPENDENCE_VIOLATION', 0)
})
test('L3 cannot waive different-family duty', () => {
  const f = fixture()
  setLane(f, 'L3')
  f.context.independence.value.determination.value.differentFamilyRequired = false
  refused(f, 'CONTEXT_BINDING_REFUSED')
})
for (const lane of ['L1', 'L3', 'L4', 'L5'])
  test(`${lane} family is required exactly when the determination requires it`, () => {
    const f = fixture()
    setLane(f, lane)
    for (const b of f.context.bindings) b.family = { status: 'unknown' }
    if (lane === 'L3') refused(f, 'NO_ELIGIBLE_BINDING')
    else {
      const r = decision(f)
      assert.ok(r.ok)
      assert.equal(r.decision.independenceObligations.futureReview?.subjectFamily, null)
      f.context.independence.value.determination.value.differentFamilyRequired = true
      candidateRefuses(f, 'INDEPENDENCE_UNPROVEN')
    }
  })
for (const lane of ['L1', 'L2'])
  for (const frontier of [null, false])
    test(`${lane} frontier ${frontier}`, () => {
      const f = fixture()
      setLane(f, lane)
      if (lane === 'L2') f.context.independence.value.subjects = [subject(f)]
      f.context.bindings[0].frontier =
        frontier === null
          ? { status: 'unknown' }
          : { ...f.context.bindings[0].frontier, value: false }
      candidateRefuses(f, frontier === null ? 'FRONTIER_UNPROVEN' : 'FRONTIER_REQUIRED', 0)
    })

test('initial higher-quality matrix fallback wins and is terminal', () => {
  const f = fixture()
  f.context.bindings[3].quality.value = 0.9
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-3')
  assert.equal(r.decision.terminal, true)
})
test('explicit same-provider fallback rechecks all filters at zero tolerance', () => {
  const f = fixture()
  fallback(f)
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-3')
  assert.equal(r.decision.terminal, true)
  assert.ok(r.decision.audit.candidates[0]?.refusals.includes('NOT_DECLARED_FALLBACK'))
  f.context.bindings[3].quality.value = 0.7999999999999999
  candidateRefuses(f, 'FALLBACK_SUITABILITY_UNPROVEN', 3)
  refused(f, 'NO_ELIGIBLE_BINDING')
})
const episodes: [string, (f: Fixture) => void, string][] = [
  [
    'relabel initial',
    (f) => {
      f.request.attempt = { kind: 'initial' }
    },
    'FALLBACK_REFUSED',
  ],
  [
    'prior success',
    (f) => {
      f.context.episode.value.attempts[0].disposition = 'succeeded'
    },
    'FALLBACK_REFUSED',
  ],
  [
    'uncertain history',
    (f) => {
      f.context.episode.value.attempts[0].disposition = 'uncertain'
    },
    'PRIOR_ATTEMPT_UNCERTAIN',
  ],
  [
    'unknown prior',
    (f) => {
      f.request.attempt.priorDisposition = { status: 'unknown' }
    },
    'PRIOR_ATTEMPT_UNCERTAIN',
  ],
  [
    'uncertain prior',
    (f) => {
      f.request.attempt.priorDisposition.value = 'uncertain'
    },
    'PRIOR_ATTEMPT_UNCERTAIN',
  ],
  [
    'omitted history',
    (f) => {
      f.context.episode.value.attempts = []
    },
    'FALLBACK_REFUSED',
  ],
  [
    'wrong prior request',
    (f) => {
      f.request.attempt.priorRequestId = 'different'
    },
    'FALLBACK_REFUSED',
  ],
  [
    'wrong decision',
    (f) => {
      f.request.attempt.priorDecisionDigest = 'd'.repeat(64)
    },
    'FALLBACK_REFUSED',
  ],
  [
    'wrong primary',
    (f) => {
      f.request.attempt.primaryBindingId = 'binding-0'
      f.request.attempt.primaryQuality.evidence.bindingId = 'binding-0'
      f.request.attempt.priorDisposition.evidence.bindingId = 'binding-0'
    },
    'FALLBACK_REFUSED',
  ],
  [
    'provider hop',
    (f) => {
      f.context.episode.value.attempts[0].provider = 'opencode'
    },
    'FALLBACK_REFUSED',
  ],
  [
    'version change',
    (f) => {
      f.context.episode.value.version = 'pmc/v0'
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'policy change',
    (f) => {
      f.context.episode.value.policyDigest = 'd'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'config change',
    (f) => {
      f.context.episode.value.configDigest = 'd'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
  [
    'fallback replay',
    (f) => {
      f.context.episode.value.attempts[0].matrixRole = 'fallback'
    },
    'FALLBACK_REFUSED',
  ],
  [
    'third attempt',
    (f) => {
      f.context.episode.value.attempts.push({
        ...f.context.episode.value.attempts[0],
        requestId: 'second',
      })
    },
    'FALLBACK_REFUSED',
  ],
  [
    'prior scope receipt',
    (f) => {
      f.request.attempt.primaryQuality.evidence.requestDigest = 'd'.repeat(64)
    },
    'CONTEXT_BINDING_REFUSED',
  ],
]
for (const [name, mutate, code] of episodes)
  test(`episode: ${name}`, () => {
    const f = fixture()
    fallback(f)
    mutate(f)
    refused(f, code)
  })
test('L4 prefers openrouter and preserves selection-only ownership and future duty', () => {
  const { request, context } = fixture()
  const result = resolvePmcRouteV1(request, context)
  assert.ok(result.ok)
  assert.equal(result.decision.bindingId, 'binding-2')
  assert.equal(result.decision.authority, 'selection-only')
  assert.equal(result.decision.terminal, false)
  assert.equal(result.decision.independenceObligations.futureReview?.duty, 'parcel-review')
  assert.equal(result.decision.audit.candidates.length, 4)
  assert.notEqual(result.decision.audit.inputs, context)
  assert.ok(Object.isFrozen(result.decision.audit.inputs?.bindings))
})
test('L6 refuses before any context proxy operation', () => {
  const { request } = fixture()
  request.lane = 'L6'
  request.subRole = 'routing-classifier'
  request.routingClass = 'routing/classification'
  let calls = 0
  const context = new Proxy(
    {},
    {
      getPrototypeOf() {
        calls++
        throw null
      },
      ownKeys() {
        calls++
        throw null
      },
    },
  )
  const result = resolvePmcRouteV1(request, context)
  assert.ok(!result.ok)
  assert.equal(result.code, 'LANE_DISABLED_REFUSED')
  assert.equal(calls, 0)
})

test('unknown input refuses without invoking caller code or inspecting thrown objects', () => {
  let calls = 0
  const value = Object.defineProperty({}, 'version', {
    enumerable: true,
    get() {
      calls++
      throw null
    },
  })
  assert.equal(resolvePmcRouteV1(value, null).ok, false)
  assert.equal(calls, 0)
  const thrown = new Proxy(
    {},
    {
      get() {
        calls++
        throw null
      },
    },
  )
  const proxy = new Proxy(
    {},
    {
      ownKeys() {
        throw thrown
      },
    },
  )
  assert.deepEqual(resolvePmcRouteV1(proxy, null), resolvePmcRouteV1(null, null))
  assert.equal(calls, 0)
})

test('request numeric relationships refuse before context access', () => {
  const f = fixture()
  f.request.requirements.maximumInputTokens = 0
  let calls = 0
  f.context = new Proxy(
    {},
    {
      getPrototypeOf() {
        calls++
        throw null
      },
    },
  )
  refused(f, 'INPUT_REFUSED')
  assert.equal(calls, 0)
})
test('future catalog time refuses as future instead of manufacturing an unsigned negative age', () => {
  const f = fixture()
  f.context.catalog.provenance.sourceTimeUtc = '2026-09-26T12:00:00.001Z'
  refused(f, 'FRESHNESS_FUTURE_REFUSED')
})
test('ordinary null policy envelope is a bounded policy refusal', () => {
  const f = fixture()
  f.context.projection = null
  refused(f, 'POLICY_REFUSED')
})
test('duplicate semantic array entries cannot evade by property reordering', () => {
  const f = fixture()
  const value = f.context.catalog.results[2].facts.thinkingLevels.levels[0]
  f.context.catalog.results[2].facts.thinkingLevels.levels.push({
    providerValue: value.providerValue,
    level: value.level,
  })
  refused(f, 'CONTEXT_REFUSED')
})
const malformedCost: [string, (f: Fixture) => void][] = [
  [
    'nonstring',
    (f) => {
      f.context.bindings[2].cost.value.ranking.usd.numerator = 1
    },
  ],
  [
    'missing field',
    (f) => {
      delete f.context.bindings[2].cost.value.ranking.usd.denominator
    },
  ],
  [
    'extra field',
    (f) => {
      f.context.bindings[2].cost.value.ranking.usd.raw = '1'
    },
  ],
  [
    'wrong container',
    (f) => {
      f.context.bindings[2].cost.value.ranking.usd = []
    },
  ],
  [
    'oversized string',
    (f) => {
      f.context.bindings[2].cost.value.ranking.usd.numerator = '1'.repeat(2049)
    },
  ],
  [
    'accessor',
    (f) => {
      Object.defineProperty(f.context.bindings[2].cost.value.ranking.usd, 'numerator', {
        enumerable: true,
        get() {
          throw new Error('must not call')
        },
      })
    },
  ],
  [
    'currency',
    (f) => {
      f.context.bindings[2].cost.value.currency = 'EUR'
    },
  ],
  [
    'invalid digest',
    (f) => {
      f.context.bindings[2].cost.value.costValueDigest = 'bad'
    },
  ],
  [
    'unsafe integer',
    (f) => {
      f.context.bindings[2].cost.value.maximumMicroUsd = Number.MAX_SAFE_INTEGER + 1
    },
  ],
]
for (const [name, mutate] of malformedCost)
  test(`cost structural: ${name}`, () => {
    const f = fixture()
    mutate(f)
    const a = refused(f, 'CONTEXT_REFUSED')
    assert.equal(a.inputs, null)
    assert.deepEqual(a.candidates, [])
  })
const badRationals = [
  ['', '1'],
  ['-1', '1'],
  ['+1', '1'],
  ['1e2', '1'],
  ['0.1', '1'],
  [' 1', '1'],
  ['01', '1'],
  ['1', '01'],
  ['1', '0'],
  ['2', '4'],
  ['0', '2'],
  ['9'.repeat(65), '1'],
  ['1'.repeat(2048), '1'],
  ['9007199254740992', '1000000'],
  ['1', '1'.repeat(65)],
]
for (const [numerator, denominator] of badRationals)
  test(`cost local rational: ${numerator?.slice(0, 12)}/${denominator?.slice(0, 12)} (${numerator?.length})`, () => {
    const f = fixture()
    f.context.bindings[2].cost.value.ranking.usd = { numerator, denominator }
    const a = candidateRefuses(f, 'COST_INVALID')
    assert.equal(a.inputs?.bindings[2]?.cost.status, 'supplied')
    assert.ok(decision(f).ok)
  })
for (const field of [
  'sourceProfileId',
  'sourceProfileVersion',
  'sourceProfileDigest',
  'maximumInputTokens',
  'maximumOutputTokens',
])
  test(`cost semantic association: ${field}`, () => {
    const f = fixture()
    const c = f.context.bindings[2].cost.value
    c[field] =
      typeof c[field] === 'number'
        ? c[field] + 1
        : field.endsWith('Digest')
          ? 'd'.repeat(64)
          : 'different'
    candidateRefuses(f, 'COST_INVALID')
  })
for (const field of ['inputTokens', 'outputTokens'])
  test(`cost ranking association: ${field}`, () => {
    const f = fixture()
    f.context.bindings[2].cost.value.ranking[field]++
    candidateRefuses(f, 'COST_INVALID')
  })
test('projected value greater than reservation maximum is invalid', () => {
  const f = fixture()
  f.context.bindings[2].cost.value.ranking.usd = { numerator: '1', denominator: '1' }
  candidateRefuses(f, 'COST_INVALID')
})
test('canonical 64-digit rational remains exact without helper rounding', () => {
  const f = fixture()
  f.context.bindings[2].cost.value.ranking.usd = { numerator: '1', denominator: '9'.repeat(64) }
  assert.ok(decision(f).ok)
})
test('zero has exactly the canonical 0/1 representation', () => {
  const f = fixture()
  f.context.bindings[2].cost.value.ranking.usd = { numerator: '0', denominator: '1' }
  assert.ok(decision(f).ok)
})
test('exact maximum magnitude and adjacent over-limit unit price are distinguished', () => {
  const f = fixture()
  setLane(f, 'L5')
  f.request.requirements.rankingTokens = null
  for (const b of f.context.bindings)
    b.cost.value.ranking = {
      kind: 'unit-price',
      outputUsdPerMillion: { numerator: '9007199254740991', denominator: '1000000' },
      inputUsdPerMillion: { numerator: '0', denominator: '1' },
    }
  assert.ok(decision(f).ok)
  f.context.bindings[2].cost.value.ranking.outputUsdPerMillion = {
    numerator: '9007199254740992',
    denominator: '1000000',
  }
  candidateRefuses(f, 'COST_INVALID')
})
test('L5 projected exact costs dominate quality, role and provider', () => {
  const f = fixture()
  setLane(f, 'L5')
  f.context.bindings[3].cost.value.ranking.usd = { numerator: '1', denominator: '10001' }
  f.context.bindings[3].quality.value = 0.1
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-3')
  assert.equal(r.decision.terminal, true)
})
test('L5 unit costs compare output then input then quality', () => {
  const f = fixture()
  setLane(f, 'L5')
  f.request.requirements.rankingTokens = null
  for (const b of f.context.bindings)
    b.cost.value.ranking = {
      kind: 'unit-price',
      outputUsdPerMillion: { numerator: '2', denominator: '1' },
      inputUsdPerMillion: { numerator: '1', denominator: '1' },
    }
  f.context.bindings[3].cost.value.ranking.inputUsdPerMillion = { numerator: '0', denominator: '1' }
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-3')
  f.context.bindings[0].cost.value.ranking.outputUsdPerMillion = {
    numerator: '1',
    denominator: '1',
  }
  const next = decision(f)
  assert.ok(next.ok)
  assert.equal(next.decision.bindingId, 'binding-0')
  f.context.bindings[2].cost.value.ranking = {
    kind: 'projected',
    inputTokens: 100,
    outputTokens: 20,
    usd: { numerator: '0', denominator: '1' },
  }
  candidateRefuses(f, 'COST_INVALID')
})
test('Unicode scalar ordering differs from UTF16 ordering and retains primary tie break', () => {
  const f = fixture()
  f.context.projection.policy.bindings[0].provider = 'openrouter'
  f.context.catalog.results[0].provider = 'openrouter'
  f.context.catalog.results[0].facts.provider = 'openrouter'
  f.context.projection.policy.bindings[1].provider = 'openrouter'
  f.context.catalog.results[1].provider = 'openrouter'
  f.context.catalog.results[1].facts.provider = 'openrouter'
  for (const [i, name] of [
    [0, '\u{10000}'],
    [1, 'z'],
    [2, '\ue000'],
  ] as const) {
    const b = f.context.projection.policy.bindings[i]
    b.providerModelId = name
    b.piHostModelId = `openrouter/${name}`
    f.context.catalog.results[i].providerModelId = name
    f.context.catalog.results[i].facts.id = name
  }
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-2')
})
test('digest substitutions are preserved claims, never claimed authentic by a pure resolver', () => {
  const f = fixture()
  for (const field of ['tariffDigest', 'priceEvidenceDigest', 'costValueDigest'])
    f.context.bindings[2].cost.value[field] = 'd'.repeat(64)
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.audit.evidenceState, 'static-conformance')
  assert.equal(r.decision.authority, 'selection-only')
  assert.deepEqual(r.decision.audit.inputs?.bindings[2]?.cost, f.context.bindings[2].cost)
  // There is no independent authenticated content authority in this value port.
  f.context.bindings[2].cost.value.ranking.usd = { numerator: '1', denominator: '20000' }
  assert.ok(decision(f).ok)
})
test('no estimate substitutes for a mandatory maximum bound', () => {
  const f = fixture()
  delete f.context.bindings[2].cost.value.maximumMicroUsd
  refused(f, 'CONTEXT_REFUSED')
})
test('safe total context addition does not lose a token near MAX_SAFE_INTEGER', () => {
  const f = fixture()
  f.request.requirements.maximumInputTokens = Number.MAX_SAFE_INTEGER
  for (const b of f.context.bindings) b.cost.value.maximumInputTokens = Number.MAX_SAFE_INTEGER
  f.context.catalog.results[2].facts.contextWindow = Number.MAX_SAFE_INTEGER
  candidateRefuses(f, 'CONTEXT_INSUFFICIENT')
})

const hostile: [string, (f: Fixture) => void][] = [
  [
    'cycle',
    (f) => {
      f.context.bindings[2].cost.value.ranking.usd.numerator = f.context
    },
  ],
  [
    'nonplain prototype',
    (f) => {
      Object.setPrototypeOf(f.context.bindings[2], { inherited: true })
    },
  ],
  [
    'hidden property',
    (f) => {
      Object.defineProperty(f.context.bindings[2], 'hidden', { value: 1 })
    },
  ],
  [
    'symbol key',
    (f) => {
      f.context.bindings[2][Symbol('secret')] = true
    },
  ],
  [
    'function',
    (f) => {
      f.context.bindings[2].quality.value = () => 0.8
    },
  ],
  [
    'nonfinite',
    (f) => {
      f.context.bindings[2].quality.value = Infinity
    },
  ],
  [
    'sparse array',
    (f) => {
      delete f.context.bindings[1]
    },
  ],
  [
    'extended array',
    (f) => {
      f.context.bindings.extra = true
    },
  ],
  [
    'toJSON hook',
    (f) => {
      f.context.bindings[2].toJSON = () => {
        throw null
      }
    },
  ],
  [
    'depth overflow',
    (f) => {
      let v: unknown = null
      for (let i = 0; i < 17; i++) v = { child: v }
      f.context.projection = v
    },
  ],
]
for (const [name, mutate] of hostile)
  test(`hostile context: ${name}`, () => {
    const f = fixture()
    mutate(f)
    refused(f, 'CONTEXT_REFUSED')
  })
test('known array ceiling is enforced before ownKeys or element descriptors', () => {
  const f = fixture()
  let keys = 0,
    descriptors = 0
  const a = new Array(257)
  f.context.bindings = new Proxy(a, {
    ownKeys(t) {
      keys++
      return Reflect.ownKeys(t)
    },
    getOwnPropertyDescriptor(t, k) {
      if (k !== 'length') descriptors++
      return Reflect.getOwnPropertyDescriptor(t, k)
    },
  })
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(keys, 0)
  assert.equal(descriptors, 0)
})
test('known object key ceiling is enforced before property descriptors', () => {
  const f = fixture()
  let descriptors = 0
  const r = { numerator: '1', denominator: '1', extra: 'x' }
  f.context.bindings[2].cost.value.ranking.usd = new Proxy(r, {
    getOwnPropertyDescriptor(t, k) {
      descriptors++
      return Reflect.getOwnPropertyDescriptor(t, k)
    },
  })
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(descriptors, 0)
})
test('key-unit ceiling is enforced before child descriptor inspection', () => {
  const f = fixture()
  let descriptors = 0
  f.context.projection = new Proxy(
    { ['x'.repeat(2049)]: 0 },
    {
      getOwnPropertyDescriptor(t, k) {
        descriptors++
        return Reflect.getOwnPropertyDescriptor(t, k)
      },
    },
  )
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(descriptors, 0)
})
test('each aliased caller descriptor is captured once', () => {
  const f = fixture()
  const counts = new Map<PropertyKey, number>()
  const source = f.context.bindings[2].cost.value.ranking.usd
  const alias = new Proxy(source, {
    getOwnPropertyDescriptor(t, k) {
      counts.set(k, (counts.get(k) ?? 0) + 1)
      return Reflect.getOwnPropertyDescriptor(t, k)
    },
  })
  for (const b of f.context.bindings) b.cost.value.ranking.usd = alias
  assert.ok(decision(f).ok)
  assert.deepEqual([...counts.values()], [1, 1])
})
test('expanded aliases charge aggregate string bounds rather than only unique objects', () => {
  const f = fixture()
  const leaf = { value: 'x'.repeat(2048) }
  f.context.projection = Array.from({ length: 513 }, () => leaf)
  refused(f, 'CONTEXT_REFUSED')
})
test('expanded aliases charge value bounds before repeated source descriptor reads', () => {
  const f = fixture()
  let reads = 0
  const leaf = new Proxy(
    { a: null, b: null, c: null },
    {
      getOwnPropertyDescriptor(t, k) {
        reads++
        return Reflect.getOwnPropertyDescriptor(t, k)
      },
    },
  )
  f.context.projection = Array.from({ length: 10000 }, () => leaf)
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(reads, 3)
})
test('minimum container value ceiling refuses before property descriptor allocation', () => {
  const f = fixture()
  let reads = 0
  const object = Object.fromEntries(Array.from({ length: 32768 }, (_, i) => [`k${i}`, null]))
  f.context.projection = new Proxy(object, {
    getOwnPropertyDescriptor(t, k) {
      reads++
      return Reflect.getOwnPropertyDescriptor(t, k)
    },
  })
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(reads, 0)
})
test('mutation after capture and input key ordering cannot change the result or original order', () => {
  const f = fixture(),
    before = structuredClone(f),
    first = decision(f)
  assert.deepEqual(f, before)
  assert.deepEqual(first, decision(f))
  const reverse = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(reverse)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v)
              .reverse()
              .map(([k, c]) => [k, reverse(c)]),
          )
        : v
  assert.deepEqual(first, decision(reverse(f)))
  f.context.bindings[2].quality.value = 0
  assert.deepEqual(first, decision(before))
})
test('freshness inclusive observation, expiration and age boundaries remain eligible', () => {
  const f = fixture()
  f.context.bindings[2].available.evidence.observedAtUtc = '2026-09-26T11:00:00.000Z'
  f.context.bindings[2].available.evidence.expiresAtUtc = f.context.evaluationTimeUtc
  assert.ok(decision(f).ok)
  f.context.bindings[2].available.evidence.observedAtUtc = '2026-09-26T10:59:59.999Z'
  candidateRefuses(f, 'FRESHNESS_STALE_REFUSED')
})
test('catalog freshness cannot borrow a longer global receipt authorization', () => {
  const f = fixture()
  f.context.freshness.value.maximumAgeMs = 100000000
  f.context.catalog.provenance.sourceTimeUtc = '2026-09-25T11:59:59.999Z'
  f.context.catalog.provenance.ageMs = 86400001
  refused(f, 'FRESHNESS_STALE_REFUSED')
})
test('prior quality remains a live comparison requirement at fallback evaluation', () => {
  const f = fixture()
  fallback(f)
  f.request.attempt.primaryQuality.evidence.expiresAtUtc = '2026-09-26T11:59:59.999Z'
  candidateRefuses(f, 'FALLBACK_SUITABILITY_UNPROVEN', 3)
})
test('multiple candidate failures stay ordered and are not short-circuited', () => {
  const f = fixture()
  const b = f.context.bindings[2]
  b.protocol = { status: 'unknown' }
  b.dataClasses = { status: 'unknown' }
  b.toolUse = { status: 'unknown' }
  b.instanceId = { status: 'unknown' }
  b.cost = { status: 'unknown' }
  b.available = { status: 'unknown' }
  b.quality = { status: 'unknown' }
  assert.deepEqual(receipt(f).candidates[2]?.refusals, [
    'IDENTITY_UNPROVEN',
    'DATA_CLASS_UNKNOWN',
    'CAPABILITY_UNVERIFIED',
    'INDEPENDENCE_UNPROVEN',
    'COST_UNKNOWN',
    'AVAILABILITY_UNVERIFIED',
    'QUALITY_UNRECORDED',
  ])
})

test('unknown optional capability and family do not invent an extra filter', () => {
  const f = fixture()
  f.request.requirements.toolUse = false
  f.request.requirements.structuredOutput = false
  f.context.bindings[2].toolUse = { status: 'unknown' }
  f.context.bindings[2].structuredOutput = { status: 'unknown' }
  f.context.bindings[2].family = { status: 'unknown' }
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.bindingId, 'binding-2')
})
test('quality from another lane cannot supply a missing requested-lane claim', () => {
  const f = fixture()
  f.context.projection.policy.bindings[2].eligibility.qualityByLane = recorded([
    { lane: 'L3', score: 1, evidenceRef: 'old', evidenceState: 'model-quality' },
  ])
  f.context.bindings[2].quality = { status: 'unknown' }
  candidateRefuses(f, 'QUALITY_UNRECORDED')
})
test('L2 exclusion sets deduplicate values while preserving first subject order', () => {
  const f = fixture()
  setLane(f, 'L2')
  f.context.independence.value.determination.value.differentFamilyRequired = true
  f.context.independence.value.subjects = [subject(f, 'builder'), subject(f, 'coordinator')]
  const r = decision(f)
  assert.ok(r.ok)
  assert.deepEqual(r.decision.independenceObligations.currentSelection, {
    excludedInstanceIds: ['other-instance'],
    excludedFamilies: ['other-family'],
    subjectIds: ['subject-builder', 'subject-coordinator'],
  })
})
test('L3/L4/L5 reject counterfeit present reviewers rather than excluding their own builders', () => {
  for (const lane of ['L3', 'L4', 'L5']) {
    const f = fixture()
    setLane(f, lane)
    f.context.independence.value.subjects = [subject(f)]
    refused(f, 'CONTEXT_BINDING_REFUSED')
  }
})
test('L3/L4 provider preference dominates quality but unavailable preferred bindings do not block fallback provider', () => {
  for (const lane of ['L3', 'L4']) {
    const f = fixture()
    setLane(f, lane)
    f.context.bindings[0].quality.value = 1
    f.context.bindings[2].quality.value = 0.1
    f.context.bindings[3].quality.value = 0
    let r = decision(f)
    assert.ok(r.ok)
    assert.equal(r.decision.bindingId, 'binding-2')
    f.context.bindings[2].available.value = false
    f.context.bindings[3].available.value = false
    r = decision(f)
    assert.ok(r.ok)
    assert.equal(r.decision.bindingId, 'binding-0')
  }
})
test('a pin cannot hop to another eligible provider', () => {
  const f = fixture()
  setLane(f, 'L1')
  f.context.bindings[0].available.value = false
  f.context.bindings[1].available.value = false
  const a = refused(f, 'PINNED_PROVIDER_NO_ELIGIBLE')
  assert.equal(a.candidates.length, 4)
  assert.ok(a.candidates[2]?.refusals.includes('OFF_PIN'))
})
test('fallback rejects missing prior reference and unknown historical quality without fabricating either', () => {
  const f = fixture()
  fallback(f)
  delete f.request.attempt.priorDecisionDigest
  refused(f, 'INPUT_REFUSED')
  const g = fixture()
  fallback(g)
  g.request.attempt.primaryQuality = { status: 'unknown' }
  candidateRefuses(g, 'FALLBACK_SUITABILITY_UNPROVEN', 3)
})
test('closed fields prevent embedded raw receipts and prompt material from entering audits', () => {
  for (const target of ['binding', 'evidence', 'cost']) {
    const f = fixture()
    const b = f.context.bindings[2]
    const value = target === 'binding' ? b : target === 'evidence' ? b.cost.evidence : b.cost.value
    value.rawEvidenceBody = 'sensitive body must not be copied into a refusal'
    const a = refused(f, 'CONTEXT_REFUSED')
    assert.equal(JSON.stringify(a).includes('sensitive body'), false)
  }
})
test('all output is frozen, bounded, non-executable and independent of caller references', () => {
  const f = fixture(),
    r = decision(f)
  assert.ok(r.ok)
  let values = 0,
    units = 0
  const walk = (v: unknown) => {
    values++
    assert.notEqual(typeof v, 'function')
    if (typeof v === 'string') units += v.length
    if (v && typeof v === 'object') {
      assert.ok(Object.isFrozen(v))
      for (const [k, child] of Object.entries(v)) {
        values++
        units += k.length
        walk(child)
      }
    }
  }
  walk(r)
  assert.ok(values <= 131072)
  assert.ok(units <= 2097152)
  assert.deepEqual(
    Object.keys(r.decision).sort(),
    [
      'version',
      'authority',
      'bindingId',
      'provider',
      'providerModelId',
      'piHostModelId',
      'protocol',
      'baseUrl',
      'maximumMicroUsd',
      'terminal',
      'independenceObligations',
      'audit',
    ].sort(),
  )
  f.context.catalog.source.value.profileDigest = 'b'.repeat(64)
  assert.equal(r.decision.audit.inputs?.catalog.source.status, 'supplied')
  assert.equal(JSON.stringify(r).includes('b'.repeat(64)), false)
})
test('near-bound catalogue preserves every occurrence and every independent evidence reference', () => {
  const f = fixture()
  const policy = f.context.projection.policy
  policy.laneBindings = policy.laneBindings.filter((o: { lane: string }) => o.lane === 'L4')
  for (let i = 4; i < 64; i++) {
    const b = structuredClone(policy.bindings[i % 4])
    b.bindingId = `binding-${i}`
    b.logicalCandidateId = `candidate-${i}`
    b.providerModelId = `model-${i}`
    b.piHostModelId = `${b.provider}/${b.providerModelId}`
    policy.bindings.push(b)
    policy.candidates.push({
      logicalCandidateId: b.logicalCandidateId,
      family: { status: 'unknown', reason: 'synthetic' },
    })
    policy.laneBindings.push({
      lane: 'L4',
      bindingId: b.bindingId,
      matrixRole: i % 2 ? 'fallback' : 'primary',
      fallbackBindingId: i % 2 ? null : `binding-${i + 1}`,
    })
    const claims = structuredClone(f.context.bindings[i % 4])
    claims.bindingId = b.bindingId
    for (const v of Object.values(claims))
      if (v && typeof v === 'object' && 'evidence' in v)
        (v.evidence as Record<string, unknown>).bindingId = b.bindingId
    f.context.bindings.push(claims)
    const result = structuredClone(f.context.catalog.results[i % 4])
    result.providerModelId = b.providerModelId
    result.facts.id = b.providerModelId
    f.context.catalog.results.push(result)
  }
  const r = decision(f)
  assert.ok(r.ok)
  assert.equal(r.decision.audit.candidates.length, 64)
  assert.equal(r.decision.audit.inputs?.bindings.length, 64)
  assert.deepEqual(
    r.decision.audit.candidates.map((a) => a.occurrenceIndex),
    Array.from({ length: 64 }, (_, i) => i),
  )
})
test('forged thrown Symbol.hasInstance and message getters are never read', () => {
  const f = fixture()
  let calls = 0
  const thrown = Object.defineProperties(
    {},
    {
      message: {
        get() {
          calls++
          throw null
        },
      },
      name: {
        get() {
          calls++
          throw null
        },
      },
      [Symbol.hasInstance]: {
        get() {
          calls++
          throw null
        },
      },
    },
  )
  f.context = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw thrown
      },
    },
  )
  refused(f, 'CONTEXT_REFUSED')
  assert.equal(calls, 0)
})
test('resolver source has no IO, ambient clock, randomness or money charge calculation port', () => {
  const source = readFileSync(new URL('../src/pmc-resolver.ts', import.meta.url), 'utf8')
  assert.equal(
    /node:|Date\.now|new Date\(\)|Math\.random|process\.|console\.|fetch\(|setTimeout\(|setInterval\(/.test(
      source,
    ),
    false,
  )
  assert.equal(/from ['"].*(?:catalog-snapshot|eligibility|ledger|transport)/.test(source), false)
})
