import { createHash } from 'node:crypto'
import {
  type BindingClaims,
  type CatalogClaim,
  type EvidenceRef,
  evaluateCatalogEligibility,
  type PmcResolverContextV1,
  type PmcRouteDecisionV1,
  resolvePmcRouteV1,
} from '../../../routing-policy/src/index.js'
import type {
  ControllerBootstrapV1,
  ControllerCode,
  ControllerObservationPortsV1,
  InstallationPortsV1,
  LaunchInputV1,
  LaunchReceiptV1,
  Observation,
  RevalidationV1,
  WireV1,
} from './controller-types.js'
import type { IntentAuthority, Selection } from './intent-custody-types.js'
import type { AttemptV1, BudgetScopeV1 } from './ledger.js'
import { computePmcCostV1, type PmcMoneyResultV1 } from './money.js'

type Data = Record<string, unknown>
type PrivateAudit = Readonly<{ stage: string; code: string }>
const refusals = new WeakMap<
  object,
  Readonly<{ code: ControllerCode; audit: PrivateAudit | null }>
>()
const failureAudits = new WeakMap<object, PrivateAudit>()
function fail(code: ControllerCode, audit: PrivateAudit | null = null): never {
  const identity = Object.freeze({})
  refusals.set(identity, Object.freeze({ code, audit }))
  throw identity
}
function refusalCode(value: unknown): ControllerCode | undefined {
  return value !== null && typeof value === 'object' ? refusals.get(value)?.code : undefined
}
function record(value: unknown): Data {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INPUT_REFUSED')
  return value as Data
}
function closed(value: unknown, names: readonly string[]): Data {
  const r = record(value)
  if (Object.keys(r).length !== names.length || names.some((k) => !Object.hasOwn(r, k)))
    fail('INPUT_REFUSED')
  return r
}
function text(v: unknown, kind: 'id' | 'digest' | 'text' = 'text'): asserts v is string {
  if (
    typeof v !== 'string' ||
    !v.length ||
    v.length > 2048 ||
    (kind === 'id' && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) ||
    (kind === 'digest' && !/^[a-f0-9]{64}$/.test(v))
  )
    fail('INPUT_REFUSED')
}
function uint(v: unknown): asserts v is number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) fail('INPUT_REFUSED')
}
function one<T extends string>(v: unknown, values: readonly T[]): T {
  if (typeof v !== 'string' || !values.includes(v as T)) fail('INPUT_REFUSED')
  return v as T
}
function bool(v: unknown): asserts v is boolean {
  if (typeof v !== 'boolean') fail('INPUT_REFUSED')
}
function utc(v: unknown): asserts v is string {
  text(v)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString() !== v
  )
    fail('INPUT_REFUSED')
}
const bytePrototype = Object.getPrototypeOf(Uint8Array.prototype)
const byteTag = Object.getOwnPropertyDescriptor(bytePrototype, Symbol.toStringTag)?.get
const byteLength = Object.getOwnPropertyDescriptor(bytePrototype, 'byteLength')?.get
const byteBuffer = Object.getOwnPropertyDescriptor(bytePrototype, 'buffer')?.get
const bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get
const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get
// Each alias is traversed once per occurrence. No caller iterator or bulk descriptors.
function capture(
  input: unknown,
  bytePath = '',
  largePath: 'payloadJson' | 'body' | '' = 'payloadJson',
): unknown {
  let remaining = 65536,
    units = 0
  const active = new Set<object>()
  const reserve = (n: number) => {
    if (n > remaining) fail('BOUNDS_REFUSED')
    remaining -= n
  }
  const charge = (s: string, large = false) => {
    units += s.length
    if (s.length > (large ? 262144 : 2048) || units > 1048576) fail('BOUNDS_REFUSED')
  }
  function copy(v: unknown, depth: number, path: string, paid = false): unknown {
    if (depth > 16) fail('BOUNDS_REFUSED')
    if (!paid) reserve(1)
    if (typeof v === 'string') {
      // Only the final wire body value has an independent UTF-8 budget.
      // Its key and value node were already charged normally.
      if (!(largePath === 'body' && path === 'body')) charge(v, path === largePath)
      if (path === largePath && Buffer.byteLength(v, 'utf8') > 1048576) fail('BOUNDS_REFUSED')
      return v
    }
    if (v === null || typeof v === 'boolean') return v
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) fail('INPUT_REFUSED')
      return v
    }
    if (typeof v !== 'object' || active.has(v)) fail('INPUT_REFUSED')
    if (ArrayBuffer.isView(v)) {
      if (path !== bytePath || !bytePath || byteTag?.call(v) !== 'Uint8Array') fail('INPUT_REFUSED')
      const length = byteLength?.call(v)
      if (typeof length !== 'number' || length > 8388608) fail('BOUNDS_REFUSED')
      const buffer = byteBuffer?.call(v)
      bufferLength?.call(buffer)
      if (resizable?.call(buffer)) fail('INPUT_REFUSED')
      return new Uint8Array(v as Uint8Array)
    }
    active.add(v)
    try {
      const array = Array.isArray(v),
        proto = Object.getPrototypeOf(v)
      if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null)
        fail('INPUT_REFUSED')
      let length = 0
      if (array) {
        const d = Object.getOwnPropertyDescriptor(v, 'length')
        if (!d || !('value' in d)) fail('INPUT_REFUSED')
        uint(d.value)
        length = d.value
        reserve(length * 2 + 1)
      }
      const keys = Reflect.ownKeys(v)
      if (array && keys.length !== length + 1) fail('INPUT_REFUSED')
      if (!array) reserve(keys.length * 2)
      for (const key of keys) {
        if (typeof key !== 'string' || key === 'then') fail('INPUT_REFUSED')
        charge(key)
      }
      const out: Data | unknown[] = array ? [] : {}
      for (const key of keys) {
        if (typeof key !== 'string') fail('INPUT_REFUSED')
        if (array && key === 'length') continue
        if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length))
          fail('INPUT_REFUSED')
        const d = Object.getOwnPropertyDescriptor(v, key)
        if (!d || !('value' in d) || !d.enumerable) fail('INPUT_REFUSED')
        Object.defineProperty(out, key, {
          value: copy(d.value, depth + 1, path ? `${path}.${key}` : key, true),
          enumerable: true,
        })
      }
      return Object.freeze(out)
    } finally {
      active.delete(v)
    }
  }
  return copy(input, 0, '')
}
function functions(value: unknown, names: readonly string[]): Data {
  const r = record(value),
    p = Object.getPrototypeOf(r)
  if (p !== Object.prototype && p !== null) fail('INSTALLATION_REFUSED')
  const keys = Reflect.ownKeys(r)
  if (keys.length !== names.length || keys.some((k) => typeof k !== 'string' || !names.includes(k)))
    fail('INSTALLATION_REFUSED')
  const out: Data = {}
  for (const name of names) {
    const d = Object.getOwnPropertyDescriptor(r, name)
    if (!d?.enumerable || !('value' in d)) fail('INSTALLATION_REFUSED')
    out[name] = d.value
  }
  return out
}
function methodRecord<T>(value: unknown, names: readonly string[]): T {
  const r = functions(value, names)
  if (Object.values(r).some((v) => typeof v !== 'function')) fail('INSTALLATION_REFUSED')
  return Object.freeze(r) as T
}
function installation(raw: unknown): InstallationPortsV1 {
  const p = functions(raw, [
    'clock',
    'owner',
    'originCapability',
    'acquire',
    'revalidate',
    'ledger',
    'transport',
  ])
  for (const key of ['clock', 'acquire', 'revalidate'])
    if (typeof p[key] !== 'function') fail('INSTALLATION_REFUSED')
  if (!p.originCapability || typeof p.originCapability !== 'object') fail('INSTALLATION_REFUSED')
  return Object.freeze({
    ...p,
    owner: methodRecord(p.owner, ['begin', 'recordDecision', 'finish']),
    ledger: methodRecord(p.ledger, [
      'snapshot',
      'reserve',
      'consume',
      'settle',
      'cancelWithNoSendProof',
    ]),
    transport: methodRecord(p.transport, ['prepare', 'verify', 'send']),
  }) as InstallationPortsV1
}
const routeKeys = [
  'version',
  'workflowId',
  'taskId',
  'episodeId',
  'requestId',
  'requestDigest',
  'lane',
  'subRole',
  'routingClass',
  'dataClass',
  'requirements',
  'attempt',
] as const
const requirementKeys = [
  'toolUse',
  'structuredOutput',
  'reasoning',
  'thinkingLevel',
  'inputModalities',
  'requiredContextTokens',
  'requiredOutputTokens',
  'maximumInputTokens',
  'maximumOutputTokens',
  'rankingTokens',
] as const
const evidenceKeys = [
  'receiptId',
  'receiptDigest',
  'sourceRef',
  'sourceDigest',
  'policyDigest',
  'configDigest',
  'requestDigest',
  'lane',
  'bindingId',
  'evidenceState',
  'observedAtUtc',
  'expiresAtUtc',
] as const
function evidence(v: unknown): void {
  const e = closed(v, evidenceKeys)
  for (const k of ['receiptId']) text(e[k], 'id')
  for (const k of [
    'receiptDigest',
    'sourceDigest',
    'policyDigest',
    'configDigest',
    'requestDigest',
  ])
    text(e[k], 'digest')
  text(e.sourceRef)
  if (e.bindingId !== null) text(e.bindingId)
  one(e.evidenceState, ['static-conformance', 'live-availability', 'model-quality'])
  one(e.lane, ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
  utc(e.observedAtUtc)
  utc(e.expiresAtUtc)
}
function claim(v: unknown, check: (v: unknown) => void): void {
  const r = record(v)
  if (r.status === 'unknown') {
    closed(r, ['status'])
    return
  }
  closed(r, ['status', 'value', 'evidence'])
  if (r.status !== 'supplied') fail('INPUT_REFUSED')
  check(r.value)
  evidence(r.evidence)
}
function preflight(input: unknown): LaunchInputV1 {
  const r = record(capture(input))
  if (Object.hasOwn(r, 'override') && r.override !== null) fail('BREAK_GLASS_REFUSED')
  const route =
    r.route && typeof r.route === 'object' && !Array.isArray(r.route) ? (r.route as Data) : {}
  if (
    [
      'L6',
      'routing',
      'classification',
      'structured-decision',
      'jev',
      'Jev',
      'typesafe/jev-1.13',
    ].includes(route.lane as string)
  )
    fail('LANE_DISABLED_REFUSED')
  if (
    !Object.hasOwn(r, 'intentRef') ||
    !Object.hasOwn(r, 'route') ||
    !['L1', 'L2', 'L3', 'L4', 'L5'].includes(route.lane as string)
  )
    fail('INTENT_REFUSED')
  if (route.dataClass !== 'public') fail('NONPUBLIC_REFUSED')
  if (r.version !== 'pmc-launch/v1' || route.version !== 'pmc/v1') fail('VERSION_REFUSED')
  closed(r, ['version', 'intentRef', 'route', 'payloadJson', 'override'])
  text(r.intentRef, 'id')
  if (typeof r.payloadJson !== 'string') fail('INPUT_REFUSED')
  closed(route, routeKeys)
  for (const k of ['workflowId', 'taskId', 'episodeId', 'requestId']) text(route[k], 'id')
  text(route.requestDigest, 'digest')
  one(route.subRole, [
    'coordinator',
    'shaper',
    'architect',
    'adversarial-reviewer',
    'verifier',
    'security-auditor',
    'builder-complex',
    'builder-standard',
    'builder-economy',
    'routing-classifier',
  ])
  one(route.routingClass, [
    'architecture/risk',
    'review/security',
    'implementation/complex',
    'standard-feature',
    'implementation/standard',
    'boilerplate',
    'routing/classification',
  ])
  const q = closed(route.requirements, requirementKeys)
  for (const k of ['toolUse', 'structuredOutput', 'reasoning']) bool(q[k])
  one(q.thinkingLevel, ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'])
  if (
    !Array.isArray(q.inputModalities) ||
    q.inputModalities.length > 2 ||
    q.inputModalities.length === 0 ||
    new Set(q.inputModalities).size !== q.inputModalities.length
  )
    fail('INPUT_REFUSED')
  for (const v of q.inputModalities) one(v, ['text', 'image'])
  for (const k of [
    'requiredContextTokens',
    'requiredOutputTokens',
    'maximumInputTokens',
    'maximumOutputTokens',
  ])
    uint(q[k])
  if (q.rankingTokens !== null) {
    const tokens = closed(q.rankingTokens, ['input', 'output'])
    uint(tokens.input)
    uint(tokens.output)
  }
  const a = record(route.attempt)
  if (a.kind === 'initial') closed(a, ['kind'])
  else {
    closed(a, [
      'kind',
      'priorRequestId',
      'priorDecisionDigest',
      'priorRequestDigest',
      'primaryBindingId',
      'priorDisposition',
      'primaryQuality',
    ])
    if (a.kind !== 'fallback') fail('INPUT_REFUSED')
    text(a.priorRequestId, 'id')
    text(a.priorDecisionDigest, 'digest')
    text(a.priorRequestDigest, 'digest')
    text(a.primaryBindingId)
    claim(a.priorDisposition, (v) => {
      one(v, ['terminal-no-send', 'terminal-failed-settled', 'uncertain'])
    })
    claim(a.primaryQuality, (v) => {
      if (typeof v !== 'number' || !Number.isFinite(v)) fail('INPUT_REFUSED')
    })
  }
  if (route.lane === 'L1' || route.lane === 'L2') fail('PINNED_TRANSPORT_REFUSED')
  return r as LaunchInputV1
}
function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex')
}
function ordered(r: Data, keys: readonly string[]): Data {
  return Object.fromEntries(keys.map((k) => [k, r[k]]))
}
function requestDigest(r: LaunchInputV1): string {
  const route = ordered(
    r.route as unknown as Data,
    routeKeys.filter((k) => k !== 'requestDigest'),
  )
  const q = ordered(r.route.requirements as unknown as Data, requirementKeys)
  if (q.rankingTokens !== null)
    q.rankingTokens = ordered(q.rankingTokens as Data, ['input', 'output'])
  route.requirements = q
  const a = r.route.attempt
  if (a.kind === 'initial') route.attempt = { kind: 'initial' }
  else {
    const material = ordered(a as unknown as Data, [
      'kind',
      'priorRequestId',
      'priorDecisionDigest',
      'priorRequestDigest',
      'primaryBindingId',
      'priorDisposition',
      'primaryQuality',
    ])
    for (const key of ['priorDisposition', 'primaryQuality']) {
      const c = material[key] as Data
      material[key] =
        c.status === 'unknown'
          ? { status: 'unknown' }
          : {
              status: c.status,
              value: c.value,
              evidence: ordered(c.evidence as Data, evidenceKeys),
            }
    }
    route.attempt = material
  }
  return hash(['pmc-request/v1', r.intentRef, route, r.payloadJson])
}
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.keys(v)
        .sort((a, b) => {
          const x = Array.from(a),
            y = Array.from(b)
          for (let i = 0; i < Math.min(x.length, y.length); i++) {
            const d = (x[i]?.codePointAt(0) ?? 0) - (y[i]?.codePointAt(0) ?? 0)
            if (d) return d
          }
          return x.length - y.length
        })
        .map((k) => [k, canonical((v as Data)[k])]),
    )
  return v
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
function boundary<T>(code: ControllerCode, fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    const retained = error !== null && typeof error === 'object' ? refusals.get(error) : undefined
    fail(code, retained?.audit ?? null)
  }
}
function resultValue(raw: unknown, code: ControllerCode): unknown {
  const r = record(capture(raw))
  if (r.ok !== true)
    fail(
      code,
      typeof r.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(r.code)
        ? Object.freeze({ stage: code, code: r.code })
        : null,
    )
  closed(r, ['ok', 'value'])
  return r.value
}
function acknowledged(raw: unknown, code: ControllerCode): void {
  if (resultValue(raw, code) !== null) fail(code)
}
function clock(p: InstallationPortsV1): string {
  return boundary('CLOCK_REFUSED', () => {
    const now = p.clock()
    utc(now)
    return now
  })
}
type Begun = {
  claim: object
  request: LaunchInputV1['route']
  episode: PmcResolverContextV1['episode']
  budgetEvidence: EvidenceRef
  scope: BudgetScopeV1
}
function begin(p: InstallationPortsV1, q: LaunchInputV1): Begun {
  return boundary('EPISODE_REFUSED', () => {
    const returned = p.owner.begin(
      { intentRef: q.intentRef, request: q.route, computedRequestDigest: q.route.requestDigest },
      p.originCapability,
    )
    const flag = Object.getOwnPropertyDescriptor(record(returned), 'ok')
    if (!flag || !('value' in flag) || !flag.enumerable) fail('EPISODE_REFUSED')
    if (flag.value === false) resultValue(returned, 'EPISODE_REFUSED')
    const raw = functions(returned, ['ok', 'value'])
    if (raw.ok !== true) fail('EPISODE_REFUSED')
    const value = functions(raw.value, ['claim', 'request', 'episode', 'budgetEvidence', 'scope'])
    const capability = value.claim
    if (!capability || typeof capability !== 'object') fail('EPISODE_REFUSED')
    const owned = record(
      capture({
        request: value.request,
        episode: value.episode,
        budgetEvidence: value.budgetEvidence,
        scope: value.scope,
      }),
    )
    if (!same(owned.request, q.route)) fail('EPISODE_REFUSED')
    evidence(owned.budgetEvidence)
    return { ...owned, claim: capability } as Begun
  })
}
type Money = Extract<PmcMoneyResultV1, { ok: true }>
type Prepared = { context: unknown; costs: Map<string, Money>; acquired: Data; now: string }
function prepareContext(
  p: InstallationPortsV1,
  q: LaunchInputV1,
  b: Begun,
  mode: 'synthetic-offline' | 'supplied-production-claims',
): Prepared {
  const acquired = boundary('EVIDENCE_REFUSED', () =>
    closed(capture(p.acquire(q.route), 'catalogInput.canonicalBytes', ''), [
      'context',
      'catalogInput',
      'catalogSource',
      'prices',
      'runtimeDigest',
      'evidenceDigest',
      'expiresAtUtc',
      'scopeId',
      'classCeilingMicroUsd',
      'ceilingAuthorityRef',
      'ceilingAuthorityDigest',
    ]),
  )
  const now = clock(p)
  boundary('EVIDENCE_REFUSED', () => {
    for (const k of ['runtimeDigest', 'evidenceDigest', 'ceilingAuthorityDigest'])
      text(acquired[k], 'digest')
    text(acquired.scopeId, 'id')
    text(acquired.ceilingAuthorityRef)
    uint(acquired.classCeilingMicroUsd)
    utc(acquired.expiresAtUtc)
    if (acquired.expiresAtUtc < now || acquired.scopeId !== b.scope.scopeId)
      fail('EVIDENCE_REFUSED')
  })
  const base = boundary('EVIDENCE_REFUSED', () =>
    closed(acquired.context, [
      'projection',
      'policyDigest',
      'configDigest',
      'freshness',
      'independence',
      'bindings',
    ]),
  )
  const source = boundary('EVIDENCE_REFUSED', () => {
    claim(acquired.catalogSource, (v) => {
      const s = closed(v, [
        'profileId',
        'profileVersion',
        'profileDigest',
        'snapshotDigest',
        'configAuthorityRef',
      ])
      text(s.profileId)
      text(s.profileVersion)
      text(s.profileDigest, 'digest')
      text(s.snapshotDigest, 'digest')
      text(s.configAuthorityRef)
    })
    const s = acquired.catalogSource as CatalogClaim['source']
    if (s.status !== 'supplied') fail('EVIDENCE_REFUSED')
    return s
  })
  const catInput = boundary('CATALOG_REFUSED', () =>
    closed(acquired.catalogInput, [
      'canonicalBytes',
      'expectedSha256',
      'approvedConfig',
      'identities',
      'acceptedSource',
    ]),
  )
  const catalog = boundary('CATALOG_REFUSED', () =>
    evaluateCatalogEligibility({ ...catInput, evaluationTimeUtc: now }),
  )
  if (catalog.stage === 'adapter')
    fail('CATALOG_REFUSED', Object.freeze({ stage: catalog.stage, code: catalog.code }))
  if (catalog.stage === 'reader')
    fail('CATALOG_REFUSED', Object.freeze({ stage: catalog.stage, code: catalog.result.code }))
  if (!catalog.result.ok)
    fail('CATALOG_REFUSED', Object.freeze({ stage: catalog.stage, code: catalog.result.code }))
  const accepted = record(catInput.acceptedSource)
  if (
    source.value.snapshotDigest !== catalog.result.provenance.digestSha256 ||
    source.value.configAuthorityRef !== catalog.result.provenance.approvedConfigRef ||
    source.value.profileId !== accepted.profileId ||
    source.value.profileVersion !== accepted.profileVersion ||
    source.evidence.sourceRef !== accepted.sourceEvidenceRef ||
    source.evidence.sourceDigest !== accepted.sourceEvidenceSha256
  )
    fail('EVIDENCE_REFUSED')
  if (
    !Array.isArray(base.bindings) ||
    base.bindings.length > 256 ||
    !Array.isArray(acquired.prices) ||
    acquired.prices.length !== base.bindings.length
  )
    fail('MONEY_REFUSED')
  const costs = new Map<string, Money>()
  for (const price of acquired.prices) {
    const money = boundary('MONEY_REFUSED', () => computePmcCostV1(price))
    if (!money.ok) fail('MONEY_REFUSED', Object.freeze({ stage: 'money', code: money.code }))
    const e = money.priceEvidence,
      v = money.value
    if (
      costs.has(e.identity.bindingId) ||
      e.requestDigest !== q.route.requestDigest ||
      e.maximumInputTokens !== q.route.requirements.maximumInputTokens ||
      e.maximumOutputTokens !== q.route.requirements.maximumOutputTokens ||
      !same(e.rankingTokens, q.route.requirements.rankingTokens) ||
      v.sourceProfileId !== source.value.profileId ||
      v.sourceProfileVersion !== source.value.profileVersion ||
      v.sourceProfileDigest !== source.value.profileDigest
    )
      fail('MONEY_REFUSED')
    costs.set(e.identity.bindingId, money)
  }
  const projection = record(base.projection),
    policy = record(projection.policy)
  if (!Array.isArray(policy.bindings)) fail('EVIDENCE_REFUSED')
  const bindingKeys = [
    'bindingId',
    'protocol',
    'catalogBaseUrl',
    'family',
    'instanceId',
    'frontier',
    'dataClasses',
    'transport',
    'toolUse',
    'structuredOutput',
    'enabled',
    'available',
    'quality',
    'costEvidence',
  ]
  const bindings: BindingClaims[] = base.bindings.map((raw) => {
    const r = boundary('EVIDENCE_REFUSED', () => closed(raw, bindingKeys))
    text(r.bindingId)
    const cost = costs.get(r.bindingId)
    if (!cost) fail('MONEY_REFUSED')
    const identities = (policy.bindings as unknown[]).filter(
      (v) => record(v).bindingId === r.bindingId,
    )
    if (identities.length !== 1) fail('MONEY_REFUSED')
    const identity = record(identities[0])
    if (
      cost.priceEvidence.identity.provider !== identity.provider ||
      cost.priceEvidence.identity.providerModelId !== identity.providerModelId
    )
      fail('MONEY_REFUSED')
    evidence(r.costEvidence)
    const { costEvidence, ...rest } = r
    return {
      ...rest,
      cost: { status: 'supplied', value: cost.value, evidence: costEvidence },
    } as BindingClaims
  })
  if (new Set(bindings.map((v) => v.bindingId)).size !== costs.size) fail('MONEY_REFUSED')
  const snapshot = boundary('LEDGER_REFUSED', () =>
    closed(resultValue(p.ledger.snapshot({ scopeId: acquired.scopeId }), 'LEDGER_REFUSED'), [
      'ledgerId',
      'epoch',
      'scope',
      'settledMicroUsd',
      'outstandingMicroUsd',
      'remainingMicroUsd',
      'frozen',
      'freezeReason',
      'observedAtUtc',
      'snapshotDigest',
    ]),
  )
  if (
    !same(snapshot.scope, b.scope) ||
    b.scope.workflowId !== q.route.workflowId ||
    b.scope.routingClass !== q.route.routingClass
  )
    fail('EVIDENCE_REFUSED')
  const budget = {
    status: 'supplied' as const,
    value: {
      ledgerId: snapshot.ledgerId,
      epoch: snapshot.epoch,
      scopeId: b.scope.scopeId,
      workflowId: b.scope.workflowId,
      accountId: b.scope.accountId,
      routingClass: b.scope.routingClass,
      currency: b.scope.currency,
      authorizedLimitMicroUsd: b.scope.authorizedLimitMicroUsd,
      classCeilingMicroUsd: acquired.classCeilingMicroUsd,
      settledMicroUsd: snapshot.settledMicroUsd,
      outstandingMicroUsd: snapshot.outstandingMicroUsd,
      frozen: snapshot.frozen,
      ceilingAuthorityRef: acquired.ceilingAuthorityRef,
      ceilingAuthorityDigest: acquired.ceilingAuthorityDigest,
      snapshotDigest: snapshot.snapshotDigest,
    },
    evidence: b.budgetEvidence,
  }
  const results = catalog.result.results.map((row) =>
    row.outcome === 'facts'
      ? {
          provider: row.requested.provider,
          providerModelId: row.requested.id,
          outcome: 'facts',
          facts: row.facts,
        }
      : {
          provider: row.requested.provider,
          providerModelId: row.requested.id,
          outcome: 'refused',
          codes: row.codes,
        },
  )
  // The sole resolver validates the complete joined unknown context below.
  const context = {
    ...base,
    evaluationTimeUtc: now,
    evidenceMode: mode,
    catalog: { source, provenance: catalog.result.provenance, results },
    episode: b.episode,
    budget,
    bindings,
  }
  return { context, costs, acquired, now }
}
const wireKeys = [
  'version',
  'requestDigest',
  'decisionDigest',
  'method',
  'operationUrl',
  'protocol',
  'provider',
  'bindingId',
  'providerModelId',
  'piHostModelId',
  'dataClass',
  'thinkingLevel',
  'wireEffort',
  'data_collection',
  'zdr',
  'toolUse',
  'structuredOutput',
  'maximumInputTokens',
  'maximumOutputTokens',
  'body',
  'bodyDigest',
  'headers',
  'boundProof',
] as const
function ownWire(
  raw: unknown,
  q: LaunchInputV1,
  d: Extract<PmcRouteDecisionV1, { ok: true }>,
  decisionDigest: string,
  context: PmcResolverContextV1,
): WireV1 {
  const fields = functions(raw, wireKeys),
    proof = fields.boundProof
  if (!proof || typeof proof !== 'object') fail('WIRE_REFUSED')
  const { boundProof: _proof, ...values } = fields
  const w = record(capture(values, '', 'body'))
  const decision = d.decision
  if (
    w.version !== 'pmc-wire/v1' ||
    w.method !== 'POST' ||
    w.operationUrl !== 'https://openrouter.ai/api/v1/chat/completions' ||
    w.protocol !== 'openai-completions' ||
    w.provider !== 'openrouter' ||
    decision.provider !== 'openrouter' ||
    decision.baseUrl !== 'https://openrouter.ai/api/v1' ||
    decision.protocol !== 'openai-completions' ||
    w.requestDigest !== q.route.requestDigest ||
    w.decisionDigest !== decisionDigest ||
    w.bindingId !== decision.bindingId ||
    w.providerModelId !== decision.providerModelId ||
    w.piHostModelId !== decision.piHostModelId ||
    w.dataClass !== 'public'
  )
    fail('WIRE_REFUSED')
  if (
    w.thinkingLevel !== q.route.requirements.thinkingLevel ||
    w.toolUse !== q.route.requirements.toolUse ||
    w.structuredOutput !== q.route.requirements.structuredOutput ||
    w.maximumInputTokens !== q.route.requirements.maximumInputTokens ||
    w.maximumOutputTokens !== q.route.requirements.maximumOutputTokens
  )
    fail('WIRE_REFUSED')
  const binding = context.bindings.find((b) => b.bindingId === decision.bindingId)
  if (
    binding?.transport.status !== 'supplied' ||
    w.data_collection !== binding.transport.value.data_collection ||
    w.zdr !== binding.transport.value.zdr
  )
    fail('WIRE_REFUSED')
  const row = context.catalog.results.find(
    (r) => r.provider === decision.provider && r.providerModelId === decision.providerModelId,
  )
  if (row?.outcome !== 'facts' || row.facts.thinkingLevels.status !== 'declared')
    fail('WIRE_REFUSED')
  const effort = row.facts.thinkingLevels.levels.filter((x) => x.level === w.thinkingLevel)
  if (
    effort.length !== 1 ||
    effort[0]?.providerValue === null ||
    w.wireEffort !== effort[0]?.providerValue
  )
    fail('WIRE_REFUSED')
  const headers = closed(w.headers, ['content-type', 'accept'])
  if (
    headers['content-type'] !== 'application/json' ||
    headers.accept !== 'text/event-stream' ||
    typeof w.body !== 'string' ||
    typeof w.bodyDigest !== 'string' ||
    createHash('sha256').update(w.body, 'utf8').digest('hex') !== w.bodyDigest
  )
    fail('WIRE_REFUSED')
  return Object.freeze({
    ...w,
    headers: Object.freeze({ 'content-type': 'application/json', accept: 'text/event-stream' }),
    boundProof: proof,
  }) as WireV1
}
function acceptedOnly(raw: unknown, code: ControllerCode): void {
  const r = closed(capture(raw), ['accepted'])
  if (r.accepted !== true) fail(code)
}
function attempt(
  raw: unknown,
  code: ControllerCode,
  q: LaunchInputV1,
  cost: Money,
  scope: string,
  previous?: AttemptV1,
): AttemptV1 {
  const a = record(resultValue(raw, code))
  closed(a, [
    'ledgerId',
    'epoch',
    'requestId',
    'scopeId',
    'requestDigest',
    'costValueDigest',
    'maximumMicroUsd',
    'state',
    'actualMicroUsd',
    'proofRef',
    'proofDigest',
    'createdAtUtc',
    'updatedAtUtc',
  ])
  for (const k of ['ledgerId', 'epoch', 'requestId', 'scopeId']) text(a[k], 'id')
  for (const k of ['requestDigest', 'costValueDigest']) text(a[k], 'digest')
  uint(a.maximumMicroUsd)
  utc(a.createdAtUtc)
  utc(a.updatedAtUtc)
  if (
    a.requestId !== q.route.requestId ||
    a.requestDigest !== q.route.requestDigest ||
    a.scopeId !== scope ||
    a.costValueDigest !== cost.value.costValueDigest ||
    a.maximumMicroUsd !== cost.value.maximumMicroUsd
  )
    fail(code)
  if (
    previous &&
    (a.ledgerId !== previous.ledgerId ||
      a.epoch !== previous.epoch ||
      a.createdAtUtc !== previous.createdAtUtc ||
      String(a.updatedAtUtc) < previous.updatedAtUtc)
  )
    fail(code)
  return a as AttemptV1
}
const transportCodes = [
  'PAYLOAD_REFUSED',
  'PROFILE_REFUSED',
  'PI_REFUSED',
  'HEADERS_REFUSED',
  'BOUND_REFUSED',
  'HOOK_REFUSED',
  'ABORTED',
  'CREDENTIAL_REFUSED',
  'HTTP_UNCERTAIN',
  'STREAM_UNCERTAIN',
  'USAGE_UNKNOWN',
  'COST_PRECISION_UNKNOWN',
  'PROOF_REFUSED',
] as const
function observation(raw: unknown): { proofId: string; observation: Observation } {
  const r = closed(capture(raw), ['accepted', 'proofId', 'observation'])
  if (r.accepted !== true) fail('SEND_UNCERTAIN')
  text(r.proofId, 'id')
  const o = record(r.observation)
  if (o.kind === 'response') {
    closed(o, ['kind', 'semantic', 'charge'])
    one(o.semantic, ['stop', 'length', 'failed'])
    const charge = record(o.charge)
    if (charge.kind === 'known') {
      closed(charge, ['kind', 'actualMicroUsd'])
      uint(charge.actualMicroUsd)
    } else {
      closed(charge, ['kind', 'reason'])
      if (charge.kind !== 'unknown') fail('SEND_UNCERTAIN')
      one(charge.reason, ['missing', 'malformed', 'precision', 'incomplete'])
    }
  } else {
    closed(o, ['kind', 'code'])
    one(o.kind, ['no-send', 'uncertain'])
    one(o.code, transportCodes)
  }
  return { proofId: r.proofId, observation: o as Observation }
}

export function createPmcControllerCustodyV1(
  mode: unknown,
):
  | Readonly<{ ok: true; custody: ControllerBootstrapV1 }>
  | Readonly<{ ok: false; code: 'INSTALLATION_REFUSED' }> {
  if (mode !== 'synthetic-offline' && mode !== 'supplied-production-claims')
    return Object.freeze({ ok: false, code: 'INSTALLATION_REFUSED' })
  let attempted = false,
    bound = false
  type SelectionAuthority = { request: LaunchInputV1; scope: BudgetScopeV1; selection: Selection }
  type CompletionAuthority = {
    request: LaunchInputV1
    scope: BudgetScopeV1
    selected: Selection | null
    answer: unknown
  }
  const selections = new WeakMap<object, SelectionAuthority>(),
    completions = new WeakMap<object, CompletionAuthority>()
  const authorityMatches = (
    a: IntentAuthority,
    c: { request: LaunchInputV1; scope: BudgetScopeV1 },
  ) =>
    a.intentRef === c.request.intentRef &&
    same(a.scope, c.scope) &&
    a.routeTemplate.workflowId === c.request.route.workflowId &&
    a.routeTemplate.taskId === c.request.route.taskId &&
    a.routeTemplate.lane === c.request.route.lane
  const custody: ControllerBootstrapV1 = Object.freeze({
    authenticateSelection: (a, d, cap) => {
      try {
        const c = bound ? selections.get(cap) : undefined
        return c && d === c.request.route.requestDigest && authorityMatches(a, c)
          ? Object.freeze({ accepted: true, selection: c.selection })
          : Object.freeze({ accepted: false })
      } catch {
        return Object.freeze({ accepted: false })
      }
    },
    authenticateCompletion: (a, s, cap) => {
      try {
        const c = bound ? completions.get(cap) : undefined
        return c &&
          s.state === 'pending' &&
          s.requestDigest === c.request.route.requestDigest &&
          same(s.selected, c.selected) &&
          authorityMatches(a, c)
          ? c.answer
          : Object.freeze({ accepted: false })
      } catch {
        return Object.freeze({ accepted: false })
      }
    },
    bind: (raw, observations) => {
      if (attempted) return Object.freeze({ ok: false, code: 'INSTALLATION_REFUSED' })
      attempted = true
      try {
        const p = installation(raw)
        const observer = methodRecord<ControllerObservationPortsV1>(observations, ['observe'])
        bound = true
        return Object.freeze({
          ok: true,
          controller: Object.freeze({
            launch: async (input: unknown) => {
              let q: LaunchInputV1,
                b: Begun | undefined,
                selected: Selection | null = null,
                selectionInvoked = false,
                reserveInvoked = false
              let receipt: LaunchReceiptV1 | null = null
              const finish = (answer: unknown) => {
                if (!b) fail('RECONCILIATION_REQUIRED')
                const capability = Object.freeze({})
                completions.set(capability, { request: q, scope: b.scope, selected, answer })
                const claim = b.claim
                try {
                  boundary('RECONCILIATION_REQUIRED', () =>
                    acknowledged(p.owner.finish(claim, capability), 'RECONCILIATION_REQUIRED'),
                  )
                } finally {
                  completions.delete(capability)
                }
              }
              try {
                try {
                  q = preflight(input)
                } catch (error) {
                  fail(refusalCode(error) ?? 'INPUT_REFUSED')
                }
                if (requestDigest(q) !== q.route.requestDigest) fail('INPUT_REFUSED')
                const begun = begin(p, q)
                b = begun
                const prepared = prepareContext(p, q, begun, mode)
                const decision = boundary('RESOLVER_REFUSED', () =>
                  resolvePmcRouteV1(q.route, prepared.context),
                )
                if (!decision.ok)
                  fail(
                    'RESOLVER_REFUSED',
                    Object.freeze({ stage: 'resolver', code: decision.code }),
                  )
                const context = decision.decision.audit.inputs
                if (!context) fail('RESOLVER_REFUSED')
                const d = decision.decision,
                  decisionDigest = hash([
                    'pmc-decision/v1',
                    q.route.requestDigest,
                    canonical(decision),
                  ])
                const cost = prepared.costs.get(d.bindingId)
                if (!cost || cost.value.maximumMicroUsd !== d.maximumMicroUsd) fail('MONEY_REFUSED')
                let preparedWire: unknown
                try {
                  preparedWire = await p.transport.prepare(q.route, decision, q.payloadJson)
                } catch {
                  fail('WIRE_REFUSED')
                }
                const wire = boundary('WIRE_REFUSED', () =>
                  ownWire(preparedWire, q, decision, decisionDigest, context),
                )
                const wireDigest = hash(
                  ordered(
                    wire as unknown as Data,
                    wireKeys.filter((k) => k !== 'boundProof'),
                  ),
                )
                const acquired = prepared.acquired
                const claims: RevalidationV1 = Object.freeze({
                  requestDigest: q.route.requestDigest,
                  decisionDigest,
                  wireDigest,
                  policyDigest: context.policyDigest,
                  configDigest: context.configDigest,
                  runtimeDigest: acquired.runtimeDigest as string,
                  catalogDigest: context.catalog.provenance.digestSha256,
                  evidenceDigest: acquired.evidenceDigest as string,
                  expiresAtUtc: acquired.expiresAtUtc as string,
                })
                boundary('WIRE_REFUSED', () =>
                  acceptedOnly(p.transport.verify(wire, claims), 'WIRE_REFUSED'),
                )
                const binding = context.bindings.find((x) => x.bindingId === d.bindingId)
                const matrixRole = d.terminal ? 'fallback' : 'primary'
                const occurrence = context.projection.policy.laneBindings.find(
                  (x) =>
                    x.lane === q.route.lane &&
                    x.bindingId === d.bindingId &&
                    x.matrixRole === matrixRole,
                )
                if (!binding || !occurrence || binding.quality.status !== 'supplied')
                  fail('EVIDENCE_REFUSED')
                selected = Object.freeze({
                  decisionDigest,
                  wireDigest,
                  bindingId: d.bindingId,
                  provider: d.provider,
                  matrixRole: occurrence.matrixRole,
                  primaryQuality: binding.quality,
                  scopeId: b.scope.scopeId,
                  costValueDigest: cost.value.costValueDigest,
                  maximumMicroUsd: cost.value.maximumMicroUsd,
                })
                const capability = Object.freeze({})
                selections.set(capability, { request: q, scope: b.scope, selection: selected })
                selectionInvoked = true
                try {
                  boundary('EPISODE_REFUSED', () =>
                    acknowledged(
                      p.owner.recordDecision(begun.claim, capability),
                      'EPISODE_REFUSED',
                    ),
                  )
                } finally {
                  selections.delete(capability)
                }
                reserveInvoked = true
                const reserved = boundary('LEDGER_REFUSED', () =>
                  attempt(
                    p.ledger.reserve({
                      requestId: q.route.requestId,
                      scopeId: begun.scope.scopeId,
                      requestDigest: q.route.requestDigest,
                      costValue: cost.value,
                      priceEvidence: cost.priceEvidence,
                    }),
                    'LEDGER_REFUSED',
                    q,
                    cost,
                    begun.scope.scopeId,
                  ),
                )
                if (
                  reserved.state !== 'reserved' ||
                  reserved.actualMicroUsd !== null ||
                  reserved.proofRef !== null ||
                  reserved.proofDigest !== null ||
                  context.budget.status !== 'supplied' ||
                  reserved.ledgerId !== context.budget.value.ledgerId ||
                  reserved.epoch !== context.budget.value.epoch
                )
                  fail('LEDGER_REFUSED')
                const makeReceipt = (disposition: LaunchReceiptV1['disposition']) =>
                  Object.freeze({
                    version: 'pmc-launch-receipt/v1' as const,
                    authority: 'audit-only' as const,
                    requestId: q.route.requestId,
                    requestDigest: q.route.requestDigest,
                    decisionDigest,
                    wireDigest,
                    ledgerId: reserved.ledgerId,
                    epoch: reserved.epoch,
                    scopeId: reserved.scopeId,
                    maximumMicroUsd: reserved.maximumMicroUsd,
                    disposition,
                  })
                receipt = makeReceipt('uncertain')
                // Identity is private and never leaves this invocation. Mark busy before TCB callbacks.
                const permit = Object.freeze({}),
                  permits = new WeakMap<
                    object,
                    {
                      busy: boolean
                      request: LaunchInputV1
                      decision: typeof decision
                      wire: WireV1
                      claims: RevalidationV1
                      cost: Money
                      reserved: AttemptV1
                    }
                  >()
                permits.set(permit, {
                  busy: false,
                  request: q,
                  decision,
                  wire,
                  claims,
                  cost,
                  reserved,
                })
                const permitState = permits.get(permit)
                if (!permitState || permitState.busy) fail('PERMIT_REFUSED')
                permitState.busy = true
                const invocation = Object.freeze({})
                boundary('REVALIDATION_REFUSED', () => {
                  const current = closed(capture(p.revalidate(claims)), [
                    'accepted',
                    'current',
                    'evaluatedAtUtc',
                  ])
                  utc(current.evaluatedAtUtc)
                  if (
                    current.accepted !== true ||
                    !same(current.current, claims) ||
                    current.evaluatedAtUtc < prepared.now ||
                    current.evaluatedAtUtc > claims.expiresAtUtc
                  )
                    fail('REVALIDATION_REFUSED')
                  const latest = clock(p)
                  if (latest < current.evaluatedAtUtc || latest > claims.expiresAtUtc)
                    fail('REVALIDATION_REFUSED')
                  acceptedOnly(p.transport.verify(wire, claims), 'REVALIDATION_REFUSED')
                })
                permits.delete(permit)
                const consumed = boundary('LEDGER_REFUSED', () =>
                  attempt(
                    p.ledger.consume({
                      requestId: q.route.requestId,
                      requestDigest: q.route.requestDigest,
                    }),
                    'LEDGER_REFUSED',
                    q,
                    cost,
                    begun.scope.scopeId,
                    reserved,
                  ),
                )
                if (
                  consumed.state !== 'consumed' ||
                  consumed.actualMicroUsd !== null ||
                  consumed.proofRef !== null ||
                  consumed.proofDigest !== null
                )
                  fail('LEDGER_REFUSED')
                // No externally supplied callback or observer between acknowledged consume and send.
                let sent: unknown
                try {
                  sent = await p.transport.send(wire, consumed)
                } catch {
                  fail('SEND_UNCERTAIN')
                }
                const envelope = boundary('SEND_UNCERTAIN', () =>
                  functions(sent, ['kind', 'proof']),
                )
                if (
                  (envelope.kind !== 'terminal' && envelope.kind !== 'uncertain') ||
                  !envelope.proof ||
                  typeof envelope.proof !== 'object'
                )
                  fail('SEND_UNCERTAIN')
                const observed = boundary('SEND_UNCERTAIN', () =>
                  observation(
                    observer.observe(
                      envelope.proof as object,
                      invocation,
                      Object.freeze({ request: q, decision, wire, consumed }),
                    ),
                  ),
                )
                const o = observed.observation
                if (envelope.kind === 'uncertain' && o.kind !== 'uncertain') fail('SEND_UNCERTAIN')
                const proof = { proofId: observed.proofId }
                const terminal = boundary('RECONCILIATION_REQUIRED', () =>
                  attempt(
                    o.kind === 'no-send'
                      ? p.ledger.cancelWithNoSendProof({
                          requestId: q.route.requestId,
                          requestDigest: q.route.requestDigest,
                          proof,
                        })
                      : p.ledger.settle({
                          requestId: q.route.requestId,
                          requestDigest: q.route.requestDigest,
                          observation: proof,
                        }),
                    'RECONCILIATION_REQUIRED',
                    q,
                    cost,
                    begun.scope.scopeId,
                    consumed,
                  ),
                )
                const known = o.kind === 'response' && o.charge.kind === 'known'
                const expectedState =
                  o.kind === 'no-send' ? 'cancelled' : known ? 'settled' : 'uncertain'
                const actual =
                  known && o.kind === 'response' && o.charge.kind === 'known'
                    ? o.charge.actualMicroUsd
                    : null
                if (
                  terminal.state !== expectedState ||
                  terminal.actualMicroUsd !== actual ||
                  terminal.proofRef === null ||
                  terminal.proofDigest === null
                )
                  fail('RECONCILIATION_REQUIRED')
                text(terminal.proofRef, 'id')
                text(terminal.proofDigest, 'digest')
                const disposition: LaunchReceiptV1['disposition'] =
                  o.kind === 'no-send'
                    ? 'terminal-no-send'
                    : !known
                      ? 'uncertain'
                      : o.kind === 'response' && o.semantic === 'stop'
                        ? 'succeeded'
                        : 'terminal-failed-settled'
                finish(
                  Object.freeze({
                    accepted: true,
                    kind: disposition,
                    proof: Object.freeze({
                      proofRef: terminal.proofRef,
                      proofDigest: terminal.proofDigest,
                      ledger: terminal,
                    }),
                    reason: null,
                  }),
                )
                receipt = makeReceipt(disposition)
                return disposition === 'uncertain'
                  ? Object.freeze({ ok: false, code: 'SEND_UNCERTAIN', receipt })
                  : Object.freeze({ ok: true, receipt })
              } catch (e) {
                const code = refusalCode(e) ?? 'EVIDENCE_REFUSED'
                if (b && !reserveInvoked && !selectionInvoked) {
                  try {
                    const proofDigest = hash([
                      'pmc-never-reserved/v1',
                      b.request.requestDigest,
                      code,
                    ])
                    finish({
                      accepted: true,
                      kind: 'closed-refused',
                      proof: {
                        proofRef: `never-reserved-${proofDigest.slice(0, 40)}`,
                        proofDigest,
                        ledger: null,
                      },
                      reason: null,
                    })
                  } catch {
                    return Object.freeze({ ok: false, code: 'RECONCILIATION_REQUIRED', receipt })
                  }
                }
                const result = Object.freeze({ ok: false as const, code, receipt })
                const detail = e !== null && typeof e === 'object' ? refusals.get(e)?.audit : null
                if (detail) failureAudits.set(result, detail)
                return result
              }
            },
          }),
        })
      } catch {
        return Object.freeze({ ok: false, code: 'INSTALLATION_REFUSED' })
      }
    },
  })
  return Object.freeze({ ok: true, custody })
}
