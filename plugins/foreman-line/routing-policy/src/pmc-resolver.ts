import type { EvidenceValue, ProviderBindingPolicyV1 } from './index.js'
import type {
  BindingClaims,
  CandidateAudit,
  CandidateCode,
  Claim,
  EvidenceRef,
  IndependenceObligations,
  PmcAuditV1,
  PmcResolverContextV1,
  PmcRouteDecisionV1,
  PmcRouteRequestV1,
  Rational,
  StopCode,
} from './pmc-resolver-types.js'
import { validateProviderBindingPolicyV1 } from './provider-bindings.js'

// This private shape language validates only the injected port. P1 owns policy validation.
type Shape = {
  fields?: Record<string, Shape>
  items?: Shape
  cap?: number
  alternatives?: Shape[]
  accepts?: (v: unknown) => boolean
}
const scalar = (accepts: (v: unknown) => boolean): Shape => ({ accepts })
const object = (fields: Record<string, Shape>): Shape => ({ fields })
const list = (items: Shape, cap: number): Shape => ({ items, cap })
const union = (...alternatives: Shape[]): Shape => ({ alternatives })
const literal = (...values: unknown[]) => scalar((v) => values.includes(v))
const text = scalar((v) => typeof v === 'string' && v.length > 0 && v.length <= 2048)
const str = scalar((v) => typeof v === 'string')
const id = scalar((v) => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v))
const digest = scalar((v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v))
const uint = scalar((v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0)
const bool = literal(true, false)
const numeric = scalar((v) => typeof v === 'number' && Number.isFinite(v))
const utc = scalar(
  (v) =>
    typeof v === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(Date.parse(v)).toISOString() === v,
)
const lane = literal('L1', 'L2', 'L3', 'L4', 'L5', 'L6')
const provider = literal('opencode', 'openrouter')
const dataClass = literal('public', 'internal', 'restricted')
const state = literal('static-conformance', 'live-availability', 'model-quality')
const absent = literal(null)
const evidence = object({
  receiptId: id,
  receiptDigest: digest,
  sourceRef: text,
  sourceDigest: digest,
  policyDigest: digest,
  configDigest: digest,
  requestDigest: digest,
  lane,
  bindingId: union(text, absent),
  evidenceState: state,
  observedAtUtc: utc,
  expiresAtUtc: utc,
})
const claim = (value: Shape) =>
  union(
    object({ status: literal('unknown') }),
    object({ status: literal('supplied'), value, evidence }),
  )
const rational = object({ numerator: str, denominator: str })
const ranking = union(
  object({ kind: literal('projected'), inputTokens: uint, outputTokens: uint, usd: rational }),
  object({
    kind: literal('unit-price'),
    outputUsdPerMillion: rational,
    inputUsdPerMillion: rational,
  }),
)
const cost = object({
  currency: literal('USD'),
  maximumMicroUsd: uint,
  maximumInputTokens: uint,
  maximumOutputTokens: uint,
  sourceProfileId: text,
  sourceProfileVersion: text,
  sourceProfileDigest: digest,
  tariffDigest: digest,
  priceEvidenceDigest: digest,
  costValueDigest: digest,
  ranking,
})
const disposition = literal('terminal-no-send', 'terminal-failed-settled', 'uncertain')
const routingClass = literal(
  'architecture/risk',
  'review/security',
  'implementation/complex',
  'standard-feature',
  'implementation/standard',
  'boilerplate',
  'routing/classification',
)
const requestShape = object({
  version: text,
  workflowId: id,
  taskId: id,
  episodeId: id,
  requestId: id,
  requestDigest: digest,
  lane,
  subRole: literal(
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
  ),
  routingClass,
  dataClass,
  requirements: object({
    toolUse: bool,
    structuredOutput: bool,
    reasoning: bool,
    thinkingLevel: literal('off', 'minimal', 'low', 'medium', 'high', 'xhigh'),
    inputModalities: list(literal('text', 'image'), 2),
    requiredContextTokens: uint,
    requiredOutputTokens: uint,
    maximumInputTokens: uint,
    maximumOutputTokens: uint,
    rankingTokens: union(object({ input: uint, output: uint }), absent),
  }),
  attempt: union(
    object({ kind: literal('initial') }),
    object({
      kind: literal('fallback'),
      priorRequestId: id,
      priorDecisionDigest: digest,
      priorRequestDigest: digest,
      primaryBindingId: text,
      priorDisposition: claim(disposition),
      primaryQuality: claim(numeric),
    }),
  ),
})
const rate = object({ value: numeric, unit: literal('USD per 1M tokens') })
const facts = object({
  provider: text,
  id: text,
  baseUrl: text,
  api: text,
  reasoning: bool,
  contextWindow: uint,
  maxTokens: uint,
  inputModalities: list(literal('text', 'image'), 2),
  rates: object({ input: rate, output: rate }),
  thinkingLevels: union(
    object({ status: literal('unknown') }),
    object({
      status: literal('declared'),
      levels: list(object({ level: text, providerValue: union(text, absent) }), 256),
    }),
  ),
})
const bindingShape = object({
  bindingId: text,
  protocol: claim(text),
  catalogBaseUrl: claim(text),
  family: claim(text),
  instanceId: claim(id),
  frontier: claim(bool),
  dataClasses: claim(list(dataClass, 3)),
  transport: claim(object({ data_collection: literal('allow', 'deny'), zdr: bool })),
  toolUse: claim(bool),
  structuredOutput: claim(bool),
  enabled: claim(bool),
  available: claim(bool),
  quality: claim(numeric),
  cost: claim(cost),
})
const contextShape = object({
  projection: {},
  policyDigest: digest,
  configDigest: digest,
  evaluationTimeUtc: utc,
  evidenceMode: literal('supplied-production-claims', 'synthetic-offline'),
  catalog: object({
    source: claim(
      object({
        profileId: text,
        profileVersion: text,
        profileDigest: digest,
        snapshotDigest: digest,
        configAuthorityRef: text,
      }),
    ),
    provenance: object({
      digestSha256: digest,
      sourceRef: text,
      sourceTimeUtc: utc,
      evaluationTimeUtc: utc,
      ageMs: uint,
      maxAgeMs: uint,
      approvedConfigRef: text,
    }),
    results: list(
      union(
        object({ provider, providerModelId: text, outcome: literal('facts'), facts }),
        object({
          provider,
          providerModelId: text,
          outcome: literal('refused'),
          codes: list(
            literal(
              'AMBIGUOUS_IDENTITY_REFUSED',
              'META_ROUTER_REFUSED',
              'VARIANT_REFUSED',
              'MISSING_PROVIDER_REFUSED',
              'MISSING_MODEL_REFUSED',
              'ENDPOINT_AUTHORITY_UNKNOWN_REFUSED',
              'ENDPOINT_MISMATCH_REFUSED',
              'SENTINEL_RATE_REFUSED',
              'RATE_REFUSED',
              'MODALITY_REFUSED',
            ),
            11,
          ),
        }),
      ),
      256,
    ),
  }),
  episode: claim(
    object({
      episodeId: id,
      workflowId: id,
      taskId: id,
      lane,
      version: text,
      policyDigest: digest,
      configDigest: digest,
      attempts: list(
        object({
          requestId: id,
          requestDigest: digest,
          decisionDigest: digest,
          bindingId: text,
          provider,
          matrixRole: literal('primary', 'fallback'),
          disposition: literal(
            'terminal-no-send',
            'terminal-failed-settled',
            'succeeded',
            'uncertain',
          ),
        }),
        2,
      ),
    }),
  ),
  freshness: claim(object({ maximumAgeMs: uint })),
  independence: claim(
    object({
      policyAuthorityRef: text,
      policyAuthorityDigest: digest,
      determination: claim(
        object({
          determinationId: id,
          determinationDigest: digest,
          artifactDigest: digest,
          reviewedLane: literal('L1', 'L3', 'L4', 'L5'),
          differentFamilyRequired: bool,
        }),
      ),
      artifactDigest: digest,
      subjects: list(
        object({
          subjectId: id,
          role: literal('builder', 'coordinator'),
          artifactDigest: digest,
          instanceId: claim(id),
          family: claim(text),
        }),
        64,
      ),
    }),
  ),
  budget: claim(
    object({
      ledgerId: id,
      epoch: id,
      scopeId: id,
      workflowId: id,
      accountId: id,
      routingClass,
      currency: literal('USD'),
      authorizedLimitMicroUsd: uint,
      classCeilingMicroUsd: uint,
      settledMicroUsd: uint,
      outstandingMicroUsd: uint,
      frozen: bool,
      ceilingAuthorityRef: text,
      ceilingAuthorityDigest: digest,
      snapshotDigest: digest,
    }),
  ),
  bindings: list(bindingShape, 256),
})

const options = (shape: Shape): Shape[] => shape.alternatives?.flatMap(options) ?? [shape]
function childShape(shape: Shape, key: string): Shape {
  const choices = options(shape).flatMap((s) =>
    s.fields?.[key] ? [s.fields[key]] : s.items ? [s.items] : [],
  )
  return choices.length ? union(...choices) : {}
}

// Capture descriptors once even for aliases, and charge cached owned subtrees by
// their expanded size on each occurrence. No caller getters, iterators or errors.
function capture(input: unknown, shape: Shape): unknown {
  let values = 0
  let units = 0
  const active = new Set<object>()
  const cache = new WeakMap<
    object,
    { value: unknown; values: number; units: number; height: number }
  >()
  const charge = (v: number, s: number) => {
    values += v
    units += s
    if (values > 65536 || units > 1048576) throw null
  }
  const copy = (
    value: unknown,
    hint: Shape,
    depth: number,
    name = '',
  ): { value: unknown; height: number } => {
    if (depth > 16) throw null
    if (
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      charge(1, 0)
      return { value, height: 0 }
    }
    if (typeof value === 'string') {
      if (value.length > 2048) throw null
      charge(1, value.length)
      return { value, height: 0 }
    }
    if (typeof value !== 'object' || active.has(value)) throw null
    const cached = cache.get(value)
    if (cached) {
      if (depth + cached.height > 16) throw null
      charge(cached.values, cached.units)
      return { value: cached.value, height: cached.height }
    }
    const startV = values,
      startS = units
    charge(1, 0)
    const array = Array.isArray(value)
    const proto = Object.getPrototypeOf(value)
    if (array ? proto !== Array.prototype : proto !== Object.prototype && proto !== null) throw null
    const hints = options(hint)
    let length = 0
    if (array) {
      const d = Object.getOwnPropertyDescriptor(value, 'length')
      const caps: Record<string, number> = {
        candidates: 256,
        bindings: 256,
        lanes: 6,
        laneBindings: 1536,
        subjects: 64,
        attempts: 2,
        inputModalities: 2,
        identityRefusalCodes: 128,
        qualityByLane: 6,
      }
      const cap = Math.max(...hints.map((s) => s.cap ?? caps[name] ?? 65536))
      if (
        !d ||
        !('value' in d) ||
        !Number.isSafeInteger(d.value) ||
        d.value < 0 ||
        d.value > cap ||
        d.value * 2 > 65536 - values
      )
        throw null
      length = d.value
    }
    const keys = Reflect.ownKeys(value)
    const count = keys.length - (array ? 1 : 0)
    const fieldHints = hints.filter((s) => s.fields)
    if (
      count * 2 > 65536 - values ||
      (array && count !== length) ||
      (!array &&
        fieldHints.length === hints.length &&
        count > Math.max(...fieldHints.map((s) => Object.keys(s.fields ?? {}).length)))
    )
      throw null
    // Preflight ALL key lengths and aggregate minima before reading any values.
    let keyUnits = 0
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string' || key.length > 2048) throw null
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)) throw null
      keyUnits += key.length
    }
    if (units + keyUnits > 1048576 || (count > 0 && depth === 16)) throw null
    charge(count, keyUnits)
    const out: Record<string, unknown> | unknown[] = array ? [] : {}
    active.add(value)
    let height = 0
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string') throw null
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) throw null
      const child = copy(descriptor.value, childShape(hint, key), depth + 1, key)
      height = Math.max(height, child.height + 1)
      Object.defineProperty(out, key, {
        value: child.value,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    active.delete(value)
    cache.set(value, { value: out, values: values - startV, units: units - startS, height })
    return { value: out, height }
  }
  return copy(input, shape, 0).value
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object')
    return `{${Object.keys(value)
      .sort(codePointOrder)
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
      .join(',')}}`
  return JSON.stringify(value)
}
function shapeFailure(value: unknown, shape: Shape, path = ''): string | null {
  if (shape.alternatives)
    return shape.alternatives.some((s) => shapeFailure(value, s, path) === null) ? null : path
  if (shape.accepts) return shape.accepts(value) ? null : path
  if (shape.fields) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return path
    const record = value as Record<string, unknown>
    const names = Object.keys(shape.fields)
    if (Object.keys(record).length !== names.length || names.some((k) => !Object.hasOwn(record, k)))
      return path
    for (const name of names) {
      const failed = shapeFailure(record[name], shape.fields[name] ?? {}, `${path}/${name}`)
      if (failed !== null) return failed
    }
  }
  if (shape.items) {
    if (!Array.isArray(value) || value.length > (shape.cap ?? 65536)) return path
    const seen = new Set<string>()
    for (let i = 0; i < value.length; i++) {
      const failed = shapeFailure(value[i], shape.items, `${path}/${i}`)
      if (failed !== null) return failed
      const key = canonical(value[i])
      if (seen.has(key)) return path
      seen.add(key)
    }
  }
  return null
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
const audit = (request: PmcRouteRequestV1 | null = null): PmcAuditV1 => ({
  version: 'pmc/v1',
  evidenceState: 'static-conformance',
  authority: 'selection-only',
  evidenceMode: 'not-inspected',
  request,
  inputs: null,
  candidates: [],
  policyErrors: [],
  failurePath: '',
})
const stop = (code: StopCode, receipt = audit()): PmcRouteDecisionV1 =>
  freeze({ ok: false, code, audit: receipt })

export function resolvePmcRouteV1(request: unknown, context: unknown): PmcRouteDecisionV1 {
  let raw: unknown
  try {
    raw = capture(request, requestShape)
  } catch {
    return stop('INPUT_REFUSED')
  }
  const failure = shapeFailure(raw, requestShape)
  if (failure !== null) return stop('INPUT_REFUSED', { ...audit(), failurePath: failure })
  const q = raw as PmcRouteRequestV1
  if (q.version !== 'pmc/v1') return stop('VERSION_REFUSED')
  const needs = q.requirements
  if (
    needs.requiredContextTokens === 0 ||
    needs.requiredOutputTokens === 0 ||
    needs.maximumInputTokens < needs.requiredContextTokens ||
    needs.maximumOutputTokens < needs.requiredOutputTokens ||
    (needs.rankingTokens &&
      (needs.rankingTokens.input > needs.maximumInputTokens ||
        needs.rankingTokens.output > needs.maximumOutputTokens))
  )
    return stop('INPUT_REFUSED')
  if (q.lane === 'L6') return stop('LANE_DISABLED_REFUSED', audit(q))
  let supplied: unknown
  try {
    supplied = capture(context, contextShape)
  } catch {
    return stop('CONTEXT_REFUSED', audit(q))
  }
  const bad = shapeFailure(supplied, contextShape)
  if (bad !== null) return stop('CONTEXT_REFUSED', { ...audit(q), failurePath: bad })
  const c = supplied as PmcResolverContextV1
  const envelope = shapeFailure(
    c.projection,
    object({
      schemaVersion: literal('pmc-provider-binding-projection/v1'),
      evidenceOnly: literal(true),
      policy: {},
    }),
  )
  if (envelope !== null) return stop('POLICY_REFUSED', audit(q))
  const validated = validateProviderBindingPolicyV1(c.projection.policy)
  if (!validated.valid)
    return stop('POLICY_REFUSED', { ...audit(q), policyErrors: validated.errors })
  return evaluate(q, c, validated.value)
}

const suppliedValue = <T>(claim: Claim<T>): T | undefined =>
  claim.status === 'supplied' ? claim.value : undefined
const sameSet = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((v) => b.includes(v))
const unique = (values: readonly unknown[]) => new Set(values).size === values.length
const recordedConflict = <T>(
  declaration: EvidenceValue<T>,
  value: T | undefined,
  equal: (a: T, b: T) => boolean = (a, b) => a === b,
) => declaration.status === 'recorded' && value !== undefined && !equal(declaration.value, value)
// Only validated claims enter here. Nested Claim.value fields precede evidence
// in the frozen declaration; caller property order never controls precedence.
const refs = (claim: Claim<unknown>): EvidenceRef[] =>
  claim.status === 'supplied' ? [claim.evidence] : []
function bindingRefs(b: BindingClaims): EvidenceRef[] {
  return [
    b.protocol,
    b.catalogBaseUrl,
    b.family,
    b.instanceId,
    b.frontier,
    b.dataClasses,
    b.transport,
    b.toolUse,
    b.structuredOutput,
    b.enabled,
    b.available,
    b.quality,
    b.cost,
  ].flatMap(refs)
}
function independenceRefs(claim: PmcResolverContextV1['independence']): EvidenceRef[] {
  if (claim.status === 'unknown') return []
  return [
    ...refs(claim.value.determination),
    ...claim.value.subjects.flatMap((s) => [...refs(s.instanceId), ...refs(s.family)]),
    claim.evidence,
  ]
}
function freshness(ref: EvidenceRef, now: number, maxAge: number): CandidateCode | null {
  const observed = Date.parse(ref.observedAtUtc),
    expires = Date.parse(ref.expiresAtUtc)
  if (observed > now) return 'FRESHNESS_FUTURE_REFUSED'
  if (expires < now || now - observed > maxAge) return 'FRESHNESS_STALE_REFUSED'
  return null
}
function boundedResult(result: PmcRouteDecisionV1): PmcRouteDecisionV1 {
  let values = 0,
    units = 0
  const visit = (v: unknown): boolean => {
    if (++values > 131072) return false
    if (typeof v === 'string') units += v.length
    if (units > 2097152) return false
    if (v !== null && typeof v === 'object')
      for (const [key, child] of Object.entries(v)) {
        units += key.length
        if (++values > 131072 || units > 2097152 || !visit(child)) return false
      }
    return true
  }
  if (!visit(result)) return stop('AUDIT_BOUND_REFUSED')
  return freeze(result)
}
function rationalValue(r: Rational): [bigint, bigint] | null {
  if (!/^(0|[1-9][0-9]{0,63})$/.test(r.numerator) || !/^[1-9][0-9]{0,63}$/.test(r.denominator))
    return null
  const n = BigInt(r.numerator),
    d = BigInt(r.denominator)
  let a = n,
    b = d
  while (b !== 0n) {
    const next = a % b
    a = b
    b = next
  }
  if (a !== 1n || n * 1000000n > BigInt(Number.MAX_SAFE_INTEGER) * d) return null
  return [n, d]
}
function compareRational(a: Rational, b: Rational): number {
  const left = BigInt(a.numerator) * BigInt(b.denominator),
    right = BigInt(b.numerator) * BigInt(a.denominator)
  return left < right ? -1 : left > right ? 1 : 0
}
function codePointOrder(a: string, b: string): number {
  const left = Array.from(a),
    right = Array.from(b)
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const x = left[i]?.codePointAt(0) ?? 0,
      y = right[i]?.codePointAt(0) ?? 0
    if (x !== y) return x < y ? -1 : 1
  }
  return left.length - right.length
}

function evaluate(
  q: PmcRouteRequestV1,
  c: PmcResolverContextV1,
  policy: ProviderBindingPolicyV1,
): PmcRouteDecisionV1 {
  const baseAudit = audit(q)
  const halt = (code: StopCode) => stop(code, baseAudit)
  const lanePolicy = policy.lanes.find((l) => l.lane === q.lane)
  if (
    !lanePolicy ||
    !(lanePolicy.subRoles as readonly string[]).includes(q.subRole) ||
    !(lanePolicy.routingClasses as readonly string[]).includes(q.routingClass)
  )
    return halt('LANE_REQUEST_REFUSED')
  const needs = q.requirements
  const occurrences = policy.laneBindings
    .map((entry, index) => ({ entry, index }))
    .filter((o) => o.entry.lane === q.lane)
  const needed = new Set(occurrences.map((o) => o.entry.bindingId))
  const bindings = policy.bindings.filter((b) => needed.has(b.bindingId))
  if (
    c.bindings.length !== needed.size ||
    !unique(c.bindings.map((b) => b.bindingId)) ||
    c.bindings.some((b) => !needed.has(b.bindingId)) ||
    c.catalog.results.length !== needed.size
  )
    return halt('CONTEXT_BINDING_REFUSED')
  for (const b of bindings)
    if (
      c.catalog.results.filter(
        (r) => r.provider === b.provider && r.providerModelId === b.providerModelId,
      ).length !== 1
    )
      return halt('CONTEXT_BINDING_REFUSED')
  const matches = (r: EvidenceRef, bindingId: string | null, requestDigest = q.requestDigest) =>
    r.policyDigest === c.policyDigest &&
    r.configDigest === c.configDigest &&
    r.requestDigest === requestDigest &&
    r.lane === q.lane &&
    r.bindingId === bindingId
  const laterGlobalRefs = [
    ...refs(c.episode),
    ...refs(c.freshness),
    ...independenceRefs(c.independence),
    ...refs(c.budget),
  ]
  if (
    [...refs(c.catalog.source), ...laterGlobalRefs].some((r) => !matches(r, null)) ||
    c.bindings.some((b) => bindingRefs(b).some((r) => !matches(r, b.bindingId)))
  )
    return halt('CONTEXT_BINDING_REFUSED')
  if (
    q.attempt.kind === 'fallback' &&
    [q.attempt.priorDisposition, q.attempt.primaryQuality]
      .flatMap(refs)
      .some(
        (r) =>
          !matches(
            r,
            q.attempt.kind === 'fallback' ? q.attempt.primaryBindingId : null,
            q.attempt.kind === 'fallback' ? q.attempt.priorRequestDigest : '',
          ),
      )
  )
    return halt('CONTEXT_BINDING_REFUSED')
  if (c.episode.status === 'supplied') {
    const episode = c.episode.value
    if (
      episode.episodeId !== q.episodeId ||
      episode.workflowId !== q.workflowId ||
      episode.taskId !== q.taskId ||
      episode.lane !== q.lane ||
      episode.version !== q.version ||
      episode.policyDigest !== c.policyDigest ||
      episode.configDigest !== c.configDigest ||
      !unique(episode.attempts.map((a) => a.requestId))
    )
      return halt('CONTEXT_BINDING_REFUSED')
  }
  if (c.independence.status === 'supplied') {
    const independence = c.independence.value
    const determination = suppliedValue(independence.determination)
    if (
      !unique(independence.subjects.map((s) => s.subjectId)) ||
      independence.subjects.some((s) => s.artifactDigest !== independence.artifactDigest) ||
      (determination &&
        (determination.artifactDigest !== independence.artifactDigest ||
          (q.lane !== 'L2' && determination.reviewedLane !== q.lane) ||
          (determination.reviewedLane === 'L3' && !determination.differentFamilyRequired))) ||
      (['L3', 'L4', 'L5'].includes(q.lane) && independence.subjects.length > 0)
    )
      return halt('CONTEXT_BINDING_REFUSED')
  }
  const provenance = c.catalog.provenance
  const now = Date.parse(c.evaluationTimeUtc),
    sourceTime = Date.parse(provenance.sourceTimeUtc)
  const availableSource = suppliedValue(c.catalog.source)
  if (
    provenance.evaluationTimeUtc !== c.evaluationTimeUtc ||
    (availableSource !== undefined &&
      (provenance.digestSha256 !== availableSource.snapshotDigest ||
        provenance.approvedConfigRef !== availableSource.configAuthorityRef)) ||
    (sourceTime <= now && provenance.ageMs !== now - sourceTime) ||
    provenance.maxAgeMs > 86400000
  )
    return halt('CONTEXT_BINDING_REFUSED')
  if (
    c.catalog.source.status === 'unknown' ||
    c.episode.status === 'unknown' ||
    c.freshness.status === 'unknown' ||
    c.independence.status === 'unknown' ||
    c.budget.status === 'unknown' ||
    c.independence.value.determination.status === 'unknown'
  )
    return halt('GLOBAL_EVIDENCE_UNPROVEN')
  const source = c.catalog.source.value,
    maxAge = c.freshness.value.maximumAgeMs
  const sourceFailure = freshness(c.catalog.source.evidence, now, maxAge)
  if (sourceFailure) return halt(sourceFailure as StopCode)
  if (sourceTime > now) return halt('FRESHNESS_FUTURE_REFUSED')
  if (now - sourceTime > Math.min(maxAge, provenance.maxAgeMs, 86400000))
    return halt('FRESHNESS_STALE_REFUSED')
  for (const r of laterGlobalRefs) {
    const failure = freshness(r, now, maxAge)
    if (failure) return halt(failure as StopCode)
  }
  const budget = c.budget.value
  if (budget.frozen) return halt('BUDGET_FROZEN')
  const liabilities = BigInt(budget.settledMicroUsd) + BigInt(budget.outstandingMicroUsd)
  if (
    budget.workflowId !== q.workflowId ||
    budget.routingClass !== q.routingClass ||
    liabilities > BigInt(Number.MAX_SAFE_INTEGER)
  )
    return halt('BUDGET_UNPROVEN')
  const remaining = BigInt(budget.authorizedLimitMicroUsd) - liabilities
  if (remaining < 0n) return halt('BUDGET_EXCEEDED')
  const history = c.episode.value.attempts
  if (
    history.some((a) => a.disposition === 'uncertain') ||
    (q.attempt.kind === 'fallback' &&
      (q.attempt.priorDisposition.status === 'unknown' ||
        q.attempt.priorDisposition.value === 'uncertain'))
  )
    return halt('PRIOR_ATTEMPT_UNCERTAIN')
  let fallbackId: string | null = null
  if (q.attempt.kind === 'initial') {
    if (history.length !== 0) return halt('FALLBACK_REFUSED')
  } else {
    const prior = history[0],
      attempt = q.attempt
    const primary = occurrences.find((o) => o.entry.bindingId === attempt.primaryBindingId)?.entry
    const binding = bindings.find((b) => b.bindingId === attempt.primaryBindingId)
    if (
      history.length !== 1 ||
      !prior ||
      !primary ||
      !binding ||
      primary.matrixRole !== 'primary' ||
      prior.matrixRole !== 'primary' ||
      prior.disposition === 'succeeded' ||
      prior.requestId === q.requestId ||
      prior.requestId !== attempt.priorRequestId ||
      prior.requestDigest !== attempt.priorRequestDigest ||
      prior.decisionDigest !== attempt.priorDecisionDigest ||
      prior.bindingId !== attempt.primaryBindingId ||
      prior.provider !== binding.provider ||
      attempt.priorDisposition.status !== 'supplied' ||
      attempt.priorDisposition.value !== prior.disposition
    )
      return halt('FALLBACK_REFUSED')
    fallbackId = primary.fallbackBindingId
  }
  const independence = c.independence.value
  if (independence.determination.status !== 'supplied') return halt('GLOBAL_EVIDENCE_UNPROVEN')
  const determination = independence.determination.value
  const excludedInstanceIds: string[] = [],
    excludedFamilies: string[] = [],
    subjectIds: string[] = []
  let counterpartUnknown = q.lane === 'L2' && independence.subjects.length === 0
  for (const subject of independence.subjects) {
    subjectIds.push(subject.subjectId)
    const instance = suppliedValue(subject.instanceId),
      family = suppliedValue(subject.family)
    if (instance === undefined) counterpartUnknown = true
    else if (!excludedInstanceIds.includes(instance)) excludedInstanceIds.push(instance)
    const familyRequired =
      determination.differentFamilyRequired ||
      (q.lane === 'L2' && subject.role === 'builder' && determination.reviewedLane === 'L3')
    if (familyRequired) {
      if (family === undefined) counterpartUnknown = true
      else if (!excludedFamilies.includes(family)) excludedFamilies.push(family)
    }
  }
  const familyRequired = determination.differentFamilyRequired || excludedFamilies.length > 0
  const candidates: CandidateAudit[] = []
  if (occurrences.length > 256) return stop('AUDIT_BOUND_REFUSED')
  for (const { entry, index } of occurrences) {
    const policyBindingIndex = policy.bindings.findIndex((b) => b.bindingId === entry.bindingId)
    const b = policy.bindings[policyBindingIndex]
    const claimsIndex = c.bindings.findIndex((b) => b.bindingId === entry.bindingId)
    const claims = c.bindings[claimsIndex]
    if (!b || !claims) return halt('CONTEXT_BINDING_REFUSED')
    const logicalCandidateIndex = policy.candidates.findIndex(
      (candidate) => candidate.logicalCandidateId === b.logicalCandidateId,
    )
    const logical = policy.candidates[logicalCandidateIndex]
    const catalogResultIndex = c.catalog.results.findIndex(
      (r) => r.provider === b.provider && r.providerModelId === b.providerModelId,
    )
    const catalog = c.catalog.results[catalogResultIndex]
    if (!logical || !catalog) return halt('CONTEXT_BINDING_REFUSED')
    const f = catalog.outcome === 'facts' ? catalog.facts : undefined
    const codes: CandidateCode[] = []
    const add = (code: CandidateCode) => {
      if (!codes.includes(code)) codes.push(code)
    }
    const checkFresh = (...values: Claim<unknown>[]) => {
      for (const ref of values.flatMap(refs)) {
        const failure = freshness(ref, now, maxAge)
        if (failure) add(failure)
      }
    }
    const get = suppliedValue
    const e = b.eligibility
    if (
      b.identityState === 'held' ||
      b.identityRefusalCodes.length ||
      !f ||
      f.provider !== b.provider ||
      f.id !== b.providerModelId ||
      get(claims.protocol) === undefined ||
      get(claims.catalogBaseUrl) === undefined
    )
      add('IDENTITY_UNPROVEN')
    if (
      recordedConflict(b.protocol, get(claims.protocol)) ||
      recordedConflict(b.catalogBaseUrl, get(claims.catalogBaseUrl)) ||
      (f &&
        ((get(claims.protocol) !== undefined && get(claims.protocol) !== f.api) ||
          (get(claims.catalogBaseUrl) !== undefined && get(claims.catalogBaseUrl) !== f.baseUrl)))
    )
      add('ENDPOINT_MISMATCH')
    checkFresh(claims.protocol, claims.catalogBaseUrl)
    if ((q.lane === 'L1' || q.lane === 'L2') && b.provider !== 'opencode') add('OFF_PIN')
    const classes = get(claims.dataClasses),
      transport = get(claims.transport)
    if (classes === undefined) add('DATA_CLASS_UNKNOWN')
    else if (!classes.includes(q.dataClass) || recordedConflict(e.dataClasses, classes, sameSet))
      add('DATA_CLASS_INELIGIBLE')
    if (
      recordedConflict(
        e.transportRequirements,
        transport,
        (a, b) => a.data_collection === b.data_collection && a.zdr === b.zdr,
      ) ||
      (q.dataClass !== 'public' && (transport?.data_collection !== 'deny' || !transport.zdr))
    )
      add('PRIVACY_UNPROVEN')
    checkFresh(claims.dataClasses, claims.transport)
    for (const [required, actual, declared] of [
      [needs.toolUse, claims.toolUse, e.toolUse],
      [needs.structuredOutput, claims.structuredOutput, e.structuredOutput],
    ] as const) {
      if (required && actual.status === 'unknown') add('CAPABILITY_UNVERIFIED')
      if ((required && get(actual) === false) || recordedConflict(declared, get(actual)))
        add('CAPABILITY_MISSING')
    }
    if (!f) add('CAPABILITY_UNVERIFIED')
    else {
      if (
        (needs.reasoning && (!f.reasoning || needs.thinkingLevel === 'off')) ||
        needs.inputModalities.some((m) => !f.inputModalities.includes(m)) ||
        recordedConflict(e.reasoning, f.reasoning) ||
        recordedConflict(e.inputModalities, f.inputModalities, sameSet)
      )
        add('CAPABILITY_MISSING')
      if (f.thinkingLevels.status === 'unknown') add('CAPABILITY_UNVERIFIED')
      else {
        const levels = f.thinkingLevels.levels
        if (
          !unique(levels.map((l) => l.level)) ||
          !levels.some((l) => l.level === needs.thinkingLevel && l.providerValue !== null) ||
          recordedConflict(
            e.thinkingLevels,
            levels.filter((l) => l.providerValue !== null).map((l) => l.level),
            sameSet,
          )
        )
          add('CAPABILITY_MISSING')
      }
    }
    checkFresh(claims.toolUse, claims.structuredOutput)
    const instance = get(claims.instanceId),
      family = get(claims.family)
    if (counterpartUnknown || instance === undefined || (familyRequired && family === undefined))
      add('INDEPENDENCE_UNPROVEN')
    if (
      (instance !== undefined && excludedInstanceIds.includes(instance)) ||
      (family !== undefined && excludedFamilies.includes(family)) ||
      recordedConflict(logical.family, family)
    )
      add('INDEPENDENCE_VIOLATION')
    checkFresh(claims.family, claims.instanceId)
    if (q.lane === 'L1' || q.lane === 'L2') {
      if (claims.frontier.status === 'unknown') add('FRONTIER_UNPROVEN')
      else if (!claims.frontier.value) add('FRONTIER_REQUIRED')
    }
    checkFresh(claims.frontier)
    if (!f) add('CONTEXT_UNKNOWN')
    else if (
      f.contextWindow < needs.requiredContextTokens ||
      f.maxTokens < needs.maximumOutputTokens ||
      BigInt(needs.maximumInputTokens) + BigInt(needs.maximumOutputTokens) >
        BigInt(f.contextWindow) ||
      recordedConflict(e.contextWindow, f.contextWindow) ||
      recordedConflict(e.maxTokens, f.maxTokens)
    )
      add('CONTEXT_INSUFFICIENT')
    const costValue = get(claims.cost)
    if (!costValue) add('COST_UNKNOWN')
    else {
      let invalid =
        costValue.sourceProfileId !== source.profileId ||
        costValue.sourceProfileVersion !== source.profileVersion ||
        costValue.sourceProfileDigest !== source.profileDigest ||
        costValue.maximumInputTokens !== needs.maximumInputTokens ||
        costValue.maximumOutputTokens !== needs.maximumOutputTokens
      const rank = costValue.ranking
      if (rank.kind === 'projected') {
        const value = rationalValue(rank.usd)
        invalid ||=
          !needs.rankingTokens ||
          rank.inputTokens !== needs.rankingTokens.input ||
          rank.outputTokens !== needs.rankingTokens.output ||
          value === null ||
          (value !== null && value[0] * 1000000n > BigInt(costValue.maximumMicroUsd) * value[1])
      } else
        invalid ||=
          needs.rankingTokens !== null ||
          rationalValue(rank.outputUsdPerMillion) === null ||
          rationalValue(rank.inputUsdPerMillion) === null
      if (invalid) add('COST_INVALID')
      if (
        BigInt(costValue.maximumMicroUsd) > remaining ||
        costValue.maximumMicroUsd > budget.classCeilingMicroUsd
      )
        add('BUDGET_EXCEEDED')
    }
    if (
      f &&
      (f.rates.input.value < 0 ||
        f.rates.output.value < 0 ||
        recordedConflict(
          e.rates,
          { input: f.rates.input.value, output: f.rates.output.value, unit: f.rates.input.unit },
          (a, b) => a.input === b.input && a.output === b.output && a.unit === b.unit,
        ))
    )
      add('COST_INVALID')
    checkFresh(claims.cost)
    if (
      get(claims.enabled) !== true ||
      get(claims.available) !== true ||
      (claims.available.status === 'supplied' &&
        claims.available.evidence.evidenceState !== 'live-availability') ||
      recordedConflict(e.enabled, get(claims.enabled)) ||
      (e.availability.status === 'recorded' &&
        get(claims.available) !== undefined &&
        e.availability.value.available !== get(claims.available))
    )
      add('AVAILABILITY_UNVERIFIED')
    checkFresh(claims.enabled, claims.available)
    const quality = get(claims.quality)
    if (
      quality === undefined ||
      quality < 0 ||
      quality > 1 ||
      (claims.quality.status === 'supplied' &&
        claims.quality.evidence.evidenceState !== 'model-quality') ||
      (e.qualityByLane.status === 'recorded' &&
        e.qualityByLane.value.some((v) => v.lane === q.lane && v.score !== quality))
    )
      add('QUALITY_UNRECORDED')
    checkFresh(claims.quality)
    if (q.attempt.kind === 'fallback') {
      if (entry.bindingId !== fallbackId) add('NOT_DECLARED_FALLBACK')
      const priorQuality = get(q.attempt.primaryQuality)
      if (
        priorQuality === undefined ||
        priorQuality < 0 ||
        priorQuality > 1 ||
        quality === undefined ||
        quality < priorQuality ||
        (q.attempt.primaryQuality.status === 'supplied' &&
          (q.attempt.primaryQuality.evidence.evidenceState !== 'model-quality' ||
            freshness(q.attempt.primaryQuality.evidence, now, maxAge) !== null)) ||
        (q.attempt.priorDisposition.status === 'supplied' &&
          freshness(q.attempt.priorDisposition.evidence, now, maxAge) !== null)
      )
        add('FALLBACK_SUITABILITY_UNPROVEN')
      checkFresh(q.attempt.priorDisposition, q.attempt.primaryQuality)
    }
    candidates.push({
      occurrenceIndex: index,
      bindingId: b.bindingId,
      policyBindingIndex,
      logicalCandidateIndex,
      claimsIndex,
      catalogResultIndex,
      refusals: codes,
      rank:
        codes.length === 0 && quality !== undefined
          ? {
              providerGroup:
                (q.lane === 'L3' || q.lane === 'L4') && b.provider === 'opencode' ? 1 : 0,
              matrixRole: entry.matrixRole,
              quality,
              cost: claims.cost,
              provider: b.provider,
              providerModelId: b.providerModelId,
            }
          : null,
    })
  }
  const receipt: PmcAuditV1 = { ...baseAudit, evidenceMode: c.evidenceMode, inputs: c, candidates }
  const survivors = candidates
    .filter((a) => a.rank !== null)
    .sort((a, b) => {
      const x = a.rank,
        y = b.rank
      if (!x || !y) return 0
      if (x.providerGroup !== y.providerGroup) return x.providerGroup - y.providerGroup
      if (q.lane === 'L5' && x.cost.status === 'supplied' && y.cost.status === 'supplied') {
        const xc = x.cost.value.ranking,
          yc = y.cost.value.ranking
        let diff = 0
        if (xc.kind === 'projected' && yc.kind === 'projected')
          diff = compareRational(xc.usd, yc.usd)
        if (xc.kind === 'unit-price' && yc.kind === 'unit-price')
          diff =
            compareRational(xc.outputUsdPerMillion, yc.outputUsdPerMillion) ||
            compareRational(xc.inputUsdPerMillion, yc.inputUsdPerMillion)
        if (diff) return diff
      }
      return (
        y.quality - x.quality ||
        (x.matrixRole === y.matrixRole ? 0 : x.matrixRole === 'primary' ? -1 : 1) ||
        codePointOrder(x.provider, y.provider) ||
        codePointOrder(x.providerModelId, y.providerModelId)
      )
    })
  const winner = survivors[0]
  if (!winner)
    return boundedResult({
      ok: false,
      code:
        q.lane === 'L1' || q.lane === 'L2' ? 'PINNED_PROVIDER_NO_ELIGIBLE' : 'NO_ELIGIBLE_BINDING',
      audit: receipt,
    })
  const b = policy.bindings[winner.policyBindingIndex],
    claims = c.bindings[winner.claimsIndex]
  if (
    !b ||
    !claims ||
    claims.instanceId.status !== 'supplied' ||
    claims.protocol.status !== 'supplied' ||
    claims.catalogBaseUrl.status !== 'supplied' ||
    claims.cost.status !== 'supplied'
  )
    return halt('CONTEXT_BINDING_REFUSED')
  const obligations: IndependenceObligations = {
    policyAuthorityRef: independence.policyAuthorityRef,
    policyAuthorityDigest: independence.policyAuthorityDigest,
    determinationId: determination.determinationId,
    determinationDigest: determination.determinationDigest,
    artifactDigest: independence.artifactDigest,
    currentSelection: { excludedInstanceIds, excludedFamilies, subjectIds },
    futureReview:
      q.lane === 'L2'
        ? null
        : {
            duty: q.lane === 'L1' || q.lane === 'L3' ? 'separate-l2-review' : 'parcel-review',
            subjectBindingId: b.bindingId,
            subjectInstanceId: claims.instanceId.value,
            subjectFamily: suppliedValue(claims.family) ?? null,
            distinctInstance: true,
            differentFamily: determination.differentFamilyRequired,
          },
  }
  return boundedResult({
    ok: true,
    decision: {
      version: 'pmc/v1',
      authority: 'selection-only',
      bindingId: b.bindingId,
      provider: b.provider,
      providerModelId: b.providerModelId,
      piHostModelId: b.piHostModelId,
      protocol: claims.protocol.value,
      baseUrl: claims.catalogBaseUrl.value,
      maximumMicroUsd: claims.cost.value.maximumMicroUsd,
      terminal: winner.rank?.matrixRole === 'fallback',
      independenceObligations: obligations,
      audit: receipt,
    },
  })
}
