import { createHash } from 'node:crypto'
import type {
  AssistantMessage,
  AssistantMessageEventStream,
  getSystemMessageText,
  Model,
  Provider,
  SimpleStreamOptions,
  TranscriptContext,
} from '@earendil-works/pi-ai'
import type {
  createAgentSession,
  createExtensionRuntime,
  ModelRuntime,
  ResourceLoader,
  SessionManager,
  SettingsManager,
} from '@earendil-works/pi-coding-agent'
import type {
  PmcRouteDecisionV1,
  PmcRouteRequestV1,
} from '../../../routing-policy/src/pmc-resolver-types.js'
import type { LaunchResultV1, RevalidationV1, TerminalPortV1, WireV1 } from './controller-types.js'
import type { PmcPriceInputV1 } from './money.js'
import { computePmcCostV1 } from './money.js'
import {
  fields,
  parseJsonV1,
  refuse,
  type TransportCode,
  TransportError,
  wellFormed,
} from './openrouter-chat-stream.js'
import type { createTerminalObservationRegistryV1, SendResult } from './owned-https-sender.js'
import { createOwnedHttpsSenderV1 } from './owned-https-sender.js'

/** No source-backed billable bound / production installation exists in this
 * parcel. This entry cannot inspect an input, import Pi, reserve, or send. */
export function createProductionPmcTerminalV1(_input: unknown) {
  return Object.freeze({ ok: false as const, code: 'BOUND_REFUSED' as const })
}

export type PmcTerminalProfileV1 = Readonly<{
  requestDigest: string
  policyDigest: string
  configDigest: string
  runtimeDigest: string
  catalogDigest: string
  evidenceDigest: string
  expiresAtUtc: string
  price: PmcPriceInputV1
  endpointSlug: string
  responseModel: string
  responseProvider: string
  billableBoundKind: 'provider-billable-ceiling' | 'pinned-tokenizer'
  billableBoundSourceDigest: string
  approvedCwd: string
  mappingProfileDigest: string
}>
type Pi = Readonly<{
  ModelRuntime: typeof ModelRuntime
  createAgentSession: typeof createAgentSession
  SettingsManager: typeof SettingsManager
  SessionManager: typeof SessionManager
  createExtensionRuntime: typeof createExtensionRuntime
  AssistantMessageEventStream: typeof AssistantMessageEventStream
  getSystemMessageText: typeof getSystemMessageText
}>
type Installation = Readonly<{
  pi: Pi
  clock: () => unknown
  profileFor: (request: PmcRouteRequestV1) => unknown
  verifyBillableBound: (profile: PmcTerminalProfileV1, body: string) => unknown
  credentialSupplier: () => unknown
  register: ReturnType<typeof createTerminalObservationRegistryV1>['register']
}>
type Output = Readonly<
  { kind: 'completed'; text: string; finish: 'stop' } | { kind: 'failed'; code: TransportCode }
>
const pair = Object.freeze({
  'content-type': 'application/json' as const,
  accept: 'text/event-stream' as const,
})
const claimKeys = [
  'requestDigest',
  'decisionDigest',
  'wireDigest',
  'policyDigest',
  'configDigest',
  'runtimeDigest',
  'catalogDigest',
  'evidenceDigest',
  'expiresAtUtc',
] as const
const profileKeys = [
  'requestDigest',
  'policyDigest',
  'configDigest',
  'runtimeDigest',
  'catalogDigest',
  'evidenceDigest',
  'expiresAtUtc',
  'price',
  'endpointSlug',
  'responseModel',
  'responseProvider',
  'billableBoundKind',
  'billableBoundSourceDigest',
  'approvedCwd',
  'mappingProfileDigest',
] as const
const optionKeys = new Set([
  'model',
  'reasoning',
  'sessionId',
  'onPayload',
  'onResponse',
  'transport',
  'thinkingBudgets',
  'maxRetryDelayMs',
  'toolExecution',
  'beforeToolCall',
  'afterToolCall',
  'finishTurn',
  'prepareRequest',
  'prepareNextTurn',
  'convertToLlm',
  'transformContext',
  'getApiKey',
  'getSteeringMessages',
  'getFollowUpMessages',
  'apiKey',
  'signal',
  'timeoutMs',
  'websocketConnectTimeoutMs',
  'maxRetries',
  'headers',
  'env',
])
function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    )
  return value
}
function own(value: unknown): unknown {
  let nodes = 0,
    bytes = 0
  const active = new Set<object>()
  const copy = (v: unknown, depth: number): unknown => {
    if (++nodes > 65536 || depth > 16) refuse('PROFILE_REFUSED')
    if (typeof v === 'string') {
      bytes += Buffer.byteLength(v)
      if (!wellFormed(v) || v.length > 262144 || bytes > 1048576) refuse('PROFILE_REFUSED')
      return v
    }
    if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))
      return v
    if (!v || typeof v !== 'object' || active.has(v)) refuse('PROFILE_REFUSED')
    const array = Array.isArray(v),
      proto = Object.getPrototypeOf(v)
    if (proto !== (array ? Array.prototype : Object.prototype) && proto !== null)
      refuse('PROFILE_REFUSED')
    const length = array ? Object.getOwnPropertyDescriptor(v, 'length')?.value : 0
    if (array && (!Number.isSafeInteger(length) || length < 0 || nodes + length > 65536))
      refuse('PROFILE_REFUSED')
    const keys = Reflect.ownKeys(v)
    if (keys.length > 65536 - nodes) refuse('PROFILE_REFUSED')
    if (array && keys.length !== length + 1) refuse('PROFILE_REFUSED')
    active.add(v)
    const out: Record<string, unknown> = {}
    let i = 0
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string' || key === 'then' || (array && key !== String(i++)))
        refuse('PROFILE_REFUSED')
      bytes += Buffer.byteLength(key)
      if (bytes > 1048576) refuse('PROFILE_REFUSED')
      const d = Object.getOwnPropertyDescriptor(v, key)
      if (!d || !('value' in d) || !d.enumerable) refuse('PROFILE_REFUSED')
      Object.defineProperty(out, key, { value: copy(d.value, depth + 1), enumerable: true })
    }
    active.delete(v)
    return Object.freeze(array ? Object.values(out) : out)
  }
  return copy(value, 0)
}
function utc(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    refuse('PROFILE_REFUSED')
  return value
}
function rateNumber(value: string, million: boolean): number {
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(value) || value.length > 128) refuse('BOUND_REFUSED')
  const [whole, fraction = ''] = value.split('.')
  const numerator = BigInt(`${whole}${fraction}`) * (million ? 1000000n : 1n),
    denominator = 10n ** BigInt(fraction.length)
  const n = Number(numerator) / Number(denominator)
  if (!Number.isFinite(n) || n < 0) refuse('BOUND_REFUSED')
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(n))
  if (!match) refuse('BOUND_REFUSED')
  const f = match[2] ?? '',
    exponent = Number(match[3] ?? 0) - f.length,
    coefficient = BigInt(`${match[1]}${f}`)
  if (
    exponent >= 0
      ? coefficient * 10n ** BigInt(exponent) * denominator !== numerator
      : coefficient * denominator !== numerator * 10n ** BigInt(-exponent)
  )
    refuse('BOUND_REFUSED')
  return n
}
function requested(payload: string): readonly [string, string] {
  const q = fields(parseJsonV1(payload, 'payload').value, ['messages'])
  if (!Array.isArray(q.messages) || q.messages.length !== 2) refuse('PAYLOAD_REFUSED')
  return q.messages.map((m, i) => {
    const r = fields(m, ['role', 'content'])
    if (
      r.role !== (i ? 'user' : 'system') ||
      typeof r.content !== 'string' ||
      !r.content.length ||
      r.content.length > 65536
    )
      refuse('PAYLOAD_REFUSED')
    return r.content
  }) as [string, string]
}

/** Installation-private actual composition. No requester or fake-runtime mode.
 * Tests replace the native request boundary before import, never this API. */
export function composePmcTerminalV1(installation: Installation): Readonly<{
  terminal: TerminalPortV1
  finishInvocation: (result: LaunchResultV1 | null) => Promise<Output>
}> {
  // Capture private installation capabilities once; task data cannot select them.
  fields(installation, [
    'pi',
    'clock',
    'profileFor',
    'verifyBillableBound',
    'credentialSupplier',
    'register',
  ])
  const { clock, profileFor, verifyBillableBound, credentialSupplier, register } = installation
  for (const capability of [clock, profileFor, verifyBillableBound, credentialSupplier, register])
    if (typeof capability !== 'function') refuse('PROFILE_REFUSED')
  fields(installation.pi, [
    'ModelRuntime',
    'createAgentSession',
    'SettingsManager',
    'SessionManager',
    'createExtensionRuntime',
    'AssistantMessageEventStream',
    'getSystemMessageText',
  ])
  const pi = Object.freeze({ ...installation.pi })
  let started = false,
    invalid = false,
    sent = false,
    streamEnded = false
  let stream: AssistantMessageEventStream | undefined,
    session: Awaited<ReturnType<typeof createAgentSession>>['session'] | undefined
  let prompt: Promise<void> | undefined,
    setup: Promise<void> | undefined,
    preparedWire: WireV1 | undefined,
    adopted: WireV1 | undefined
  let request: PmcRouteRequestV1 | undefined,
    decision: PmcRouteDecisionV1 | undefined,
    profile: PmcTerminalProfileV1 | undefined,
    model: Model<'openai-completions'> | undefined
  let failure: TransportCode | undefined,
    sendResult: SendResult | undefined,
    finalization: Promise<Output> | undefined
  let resolvePrepare: (wire: WireV1) => void = () => {},
    rejectPrepare: (error: unknown) => void = () => {}
  let onResponse: SimpleStreamOptions['onResponse'], signal: AbortSignal | undefined
  const aborter = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const errorCode = (e: unknown): TransportCode =>
    e instanceof TransportError ? e.code : 'PI_REFUSED'
  const message = (success: boolean): AssistantMessage => {
    const u = sendResult?.stream?.usage
    const inputEstimate = ((u?.input ?? 0) * (model?.cost.input ?? 0)) / 1000000
    const outputEstimate = ((u?.output ?? 0) * (model?.cost.output ?? 0)) / 1000000
    return {
      role: 'assistant',
      api: 'openai-completions',
      provider: 'openrouter',
      model: model?.id ?? 'unavailable',
      ...(sendResult?.stream ? { responseId: sendResult.stream.responseId } : {}),
      content: success ? [{ type: 'text', text: sendResult?.stream?.text ?? '' }] : [],
      usage: {
        input: u?.input ?? 0,
        output: u?.output ?? 0,
        cacheRead: u?.cached ?? 0,
        cacheWrite: u?.cacheWrite ?? 0,
        totalTokens: u?.total ?? 0,
        cost: {
          input: inputEstimate,
          output: outputEstimate,
          cacheRead: 0,
          cacheWrite: 0,
          total: inputEstimate + outputEstimate,
        },
      },
      diagnostics: [
        {
          type: 'pmc-nonaccounting-usage',
          timestamp: Date.now(),
          details: {
            costBasis: 'tariff-estimate',
            accountingAuthority: 'pmc-ledger',
            usageObserved: u !== undefined,
            cachedTokens: u?.cached ?? null,
            cacheWriteTokens: u?.cacheWrite ?? null,
            audioTokens: u?.audio ?? null,
            reasoningTokens: u?.reasoning ?? null,
            rawAccountCost: sendResult?.stream?.costLexeme ?? null,
          },
        },
      ],
      stopReason: success ? 'stop' : 'error',
      timestamp: Date.now(),
      ...(success ? {} : { errorMessage: failure ?? 'PI_REFUSED' }),
    }
  }
  const end = (success: boolean) => {
    if (!stream || streamEnded) return
    streamEnded = true
    const m = message(success)
    if (success) {
      stream.push({ type: 'start', partial: m })
      stream.push({ type: 'text_start', contentIndex: 0, partial: m })
      stream.push({
        type: 'text_delta',
        contentIndex: 0,
        delta: sendResult?.stream?.text ?? '',
        partial: m,
      })
      stream.push({
        type: 'text_end',
        contentIndex: 0,
        content: sendResult?.stream?.text ?? '',
        partial: m,
      })
      stream.push({ type: 'done', reason: 'stop', message: m })
    } else stream.push({ type: 'error', reason: 'error', error: m })
    stream.end(m)
  }
  const terminalize = (code: TransportCode) => {
    failure ??= code
    invalid = true
    clearTimeout(timer)
    rejectPrepare(new TransportError(failure))
    end(false)
    try {
      aborter.abort()
    } catch {}
  }
  const prepare: TerminalPortV1['prepare'] = async (q, d, payload) => {
    if (started) refuse('PI_REFUSED')
    started = true
    request = q
    decision = d
    const pending = new Promise<WireV1>((resolve, reject) => {
      resolvePrepare = resolve
      rejectPrepare = reject
    })
    void pending.catch(() => {})
    timer = setTimeout(() => terminalize('PI_REFUSED'), 30000)
    setup = (async () => {
      const texts = requested(payload),
        p = fields(own(profileFor(q)), profileKeys)
      for (const key of [
        'requestDigest',
        'policyDigest',
        'configDigest',
        'runtimeDigest',
        'catalogDigest',
        'evidenceDigest',
        'billableBoundSourceDigest',
        'mappingProfileDigest',
      ])
        if (
          typeof p[key] !== 'string' ||
          !/^\w{64}$/.test(p[key] as string) ||
          !/^[a-f0-9]+$/.test(p[key] as string)
        )
          refuse('PROFILE_REFUSED')
      for (const key of ['endpointSlug', 'responseModel', 'responseProvider', 'approvedCwd'])
        if (
          typeof p[key] !== 'string' ||
          !(p[key] as string).length ||
          (p[key] as string).length > 2048
        )
          refuse('PROFILE_REFUSED')
      if (
        !['provider-billable-ceiling', 'pinned-tokenizer'].includes(String(p.billableBoundKind)) ||
        p.requestDigest !== q.requestDigest ||
        utc(p.expiresAtUtc) < utc(clock())
      )
        refuse('PROFILE_REFUSED')
      profile = p as PmcTerminalProfileV1
      if (
        !d.ok ||
        d.decision.provider !== 'openrouter' ||
        d.decision.protocol !== 'openai-completions' ||
        d.decision.baseUrl !== 'https://openrouter.ai/api/v1' ||
        q.dataClass !== 'public' ||
        q.requirements.toolUse ||
        q.requirements.structuredOutput ||
        !q.requirements.reasoning ||
        q.requirements.inputModalities.length !== 1 ||
        q.requirements.inputModalities[0] !== 'text' ||
        !['low', 'medium', 'high'].includes(q.requirements.thinkingLevel)
      )
        refuse('PROFILE_REFUSED')
      const selected = d.decision,
        context = selected.audit.inputs,
        price = computePmcCostV1(profile.price)
      if (
        !price.ok ||
        price.value.maximumMicroUsd !== selected.maximumMicroUsd ||
        profile.price.requestDigest !== q.requestDigest ||
        profile.price.identity.bindingId !== selected.bindingId ||
        profile.price.identity.providerModelId !== selected.providerModelId ||
        profile.price.identity.provider !== 'openrouter' ||
        profile.price.maximumInputTokens !== q.requirements.maximumInputTokens ||
        profile.price.maximumOutputTokens !== q.requirements.maximumOutputTokens ||
        profile.responseModel !== selected.providerModelId ||
        !context
      )
        refuse('BOUND_REFUSED')
      const binding = context.bindings.find((b) => b.bindingId === selected.bindingId),
        catalog = context.catalog.results.find(
          (r) => r.provider === 'openrouter' && r.providerModelId === selected.providerModelId,
        )
      if (
        binding?.transport.status !== 'supplied' ||
        catalog?.outcome !== 'facts' ||
        catalog.facts.thinkingLevels.status !== 'declared'
      )
        refuse('PROFILE_REFUSED')
      const privacy = binding.transport.value
      const levels = catalog.facts.thinkingLevels.levels.filter(
        (l) => l.level === q.requirements.thinkingLevel,
      )
      if (levels.length !== 1 || levels[0]?.providerValue !== q.requirements.thinkingLevel)
        refuse('PROFILE_REFUSED')
      const caps = {
        prompt: rateNumber(
          profile.price.inputRate.value,
          profile.price.inputRate.unit === 'USD per token',
        ),
        completion: rateNumber(
          profile.price.outputRate.value,
          profile.price.outputRate.unit === 'USD per token',
        ),
        request: rateNumber(profile.price.perRequestFeeUsd, false),
      }
      model = {
        id: selected.providerModelId,
        name: selected.providerModelId,
        api: 'openai-completions',
        provider: 'openrouter',
        baseUrl: selected.baseUrl,
        reasoning: true,
        input: ['text'],
        cost: { input: caps.prompt, output: caps.completion, cacheRead: 0, cacheWrite: 0 },
        contextWindow: catalog.facts.contextWindow ?? q.requirements.maximumInputTokens,
        maxTokens: q.requirements.maximumOutputTokens,
        thinkingLevelMap: { [q.requirements.thinkingLevel]: q.requirements.thinkingLevel },
        headers: pair,
      }
      const currentModel = model
      let registered = false,
        streams = 0
      const runtime = await pi.ModelRuntime.create({
        modelsPath: null,
        refreshOnCreate: false,
        allowModelNetwork: false,
        credentials: {
          read: async (provider) => {
            if (registered && provider === 'openrouter') return undefined
            throw new Error('DISABLED_PROVIDER')
          },
          list: async () => [],
          modify: async () => {
            throw new Error('DISABLED')
          },
          delete: async () => {
            throw new Error('DISABLED')
          },
        },
        modelsStore: {
          read: async () => undefined,
          write: async () => {
            throw new Error('DISABLED')
          },
          delete: async () => {
            throw new Error('DISABLED')
          },
        },
      })
      if (invalid) return
      const native: Provider<'openai-completions'> = {
        id: 'openrouter',
        name: 'Governed text',
        getModels: () => [currentModel],
        auth: {
          apiKey: {
            name: 'Governed',
            check: async () => ({ type: 'api_key', source: 'offline' }),
            resolve: async () => ({ auth: {} }),
          },
        },
        stream: () => {
          terminalize('PI_REFUSED')
          refuse('PI_REFUSED')
        },
        streamSimple: (m, ctx, options) => {
          const next = new pi.AssistantMessageEventStream()
          if (++streams !== 1 || invalid) {
            const prior = stream
            const priorEnded = streamEnded
            stream = next
            streamEnded = false
            end(false)
            stream = prior
            streamEnded = priorEnded
            terminalize('PI_REFUSED')
            return next
          }
          stream = next
          void (async () => {
            if (JSON.stringify(canonical(own(m))) !== JSON.stringify(canonical(currentModel)))
              refuse('PI_REFUSED')
            const descriptors = Object.getOwnPropertyDescriptors(options ?? {}),
              opts: Record<string, unknown> = {}
            for (const key of Reflect.ownKeys(descriptors)) {
              if (typeof key !== 'string' || !optionKeys.has(key)) refuse('PI_REFUSED')
              const item = descriptors[key]
              if (!item || !('value' in item) || !item.enumerable) refuse('PI_REFUSED')
              opts[key] = item.value
            }
            if (
              opts.reasoning !== q.requirements.thinkingLevel ||
              opts.transport !== 'sse' ||
              opts.maxRetries !== 0 ||
              ['apiKey', 'env', 'getApiKey', 'thinkingBudgets'].some(
                (k) => opts[k] !== undefined,
              ) ||
              !(opts.signal instanceof AbortSignal) ||
              opts.sessionId !== session?.sessionId ||
              JSON.stringify(canonical(own(opts.model))) !== JSON.stringify(canonical(currentModel))
            )
              refuse('PI_REFUSED')
            for (const key of ['timeoutMs', 'websocketConnectTimeoutMs'])
              if (
                opts[key] !== undefined &&
                (typeof opts[key] !== 'number' ||
                  !Number.isFinite(opts[key]) ||
                  Number(opts[key]) <= 0 ||
                  Number(opts[key]) > 300000)
              )
                refuse('PI_REFUSED')
            const h = fields(own(opts.headers), ['content-type', 'accept'])
            if (h['content-type'] !== pair['content-type'] || h.accept !== pair.accept)
              refuse('HEADERS_REFUSED')
            const transcript = fields(own(ctx), ['messages'])
            if (!Array.isArray(transcript.messages) || transcript.messages.length !== 2)
              refuse('PAYLOAD_REFUSED')
            const system = fields(
                transcript.messages[0],
                ['role', 'content', 'sections', 'timestamp'],
                ['toolsAdded', 'toolsRemoved'],
              ),
              user = fields(transcript.messages[1], ['role', 'content', 'timestamp'])
            const sections = fields(system.sections, ['preamble', 'cwd'])
            if (
              system.role !== 'system' ||
              system.content !== '' ||
              sections.preamble !== texts[0] ||
              sections.cwd !== `<cwd>\n${profile?.approvedCwd.replaceAll('\\', '/')}\n</cwd>` ||
              user.role !== 'user' ||
              typeof system.timestamp !== 'number' ||
              typeof user.timestamp !== 'number' ||
              !Number.isFinite(system.timestamp) ||
              !Number.isFinite(user.timestamp)
            )
              refuse('PAYLOAD_REFUSED')
            for (const key of ['toolsAdded', 'toolsRemoved'])
              if (
                system[key] !== undefined &&
                (!Array.isArray(system[key]) || (system[key] as unknown[]).length)
              )
                refuse('PAYLOAD_REFUSED')
            const userText =
              typeof user.content === 'string'
                ? user.content
                : Array.isArray(user.content)
                  ? user.content
                      .map((v) => {
                        const text = fields(v, ['type', 'text'])
                        if (text.type !== 'text' || typeof text.text !== 'string')
                          refuse('PAYLOAD_REFUSED')
                        return text.text
                      })
                      .join('')
                  : null
            if (userText !== texts[1]) refuse('PAYLOAD_REFUSED')
            const rendered = pi.getSystemMessageText(
              ctx.messages[0] as Extract<TranscriptContext['messages'][number], { role: 'system' }>,
            )
            const body = {
              model: currentModel.id,
              messages: [
                { role: 'system', content: rendered },
                { role: 'user', content: userText },
              ],
              stream: true,
              max_tokens: q.requirements.maximumOutputTokens,
              reasoning: { effort: q.requirements.thinkingLevel, exclude: true },
              provider: {
                order: [profile?.endpointSlug],
                only: [profile?.endpointSlug],
                allow_fallbacks: false,
                require_parameters: true,
                data_collection: privacy.data_collection,
                zdr: privacy.zdr,
                max_price: caps,
              },
            }
            let final: unknown = body
            if (opts.onPayload !== undefined) {
              if (typeof opts.onPayload !== 'function') refuse('HOOK_REFUSED')
              let replacement: unknown
              try {
                replacement = await options?.onPayload?.(own(body), currentModel)
              } catch {
                refuse('HOOK_REFUSED')
              }
              if (replacement !== undefined) final = own(replacement)
            }
            if (invalid) return
            if (JSON.stringify(canonical(final)) !== JSON.stringify(canonical(body)))
              refuse('PAYLOAD_REFUSED')
            const bodyString = JSON.stringify(body)
            if (Buffer.byteLength(bodyString) > 1048576) refuse('PAYLOAD_REFUSED')
            if (!profile || verifyBillableBound(profile, bodyString) !== true)
              refuse('BOUND_REFUSED')
            if (opts.onResponse !== undefined && typeof opts.onResponse !== 'function')
              refuse('HOOK_REFUSED')
            onResponse = options?.onResponse
            signal = opts.signal as AbortSignal
            if (signal.aborted) refuse('ABORTED')
            const wire: WireV1 = Object.freeze({
              version: 'pmc-wire/v1',
              requestDigest: q.requestDigest,
              decisionDigest: sha(
                JSON.stringify(['pmc-decision/v1', q.requestDigest, canonical(d)]),
              ),
              method: 'POST',
              operationUrl: 'https://openrouter.ai/api/v1/chat/completions',
              protocol: 'openai-completions',
              provider: 'openrouter',
              bindingId: selected.bindingId,
              providerModelId: selected.providerModelId,
              piHostModelId: selected.piHostModelId,
              dataClass: 'public',
              thinkingLevel: q.requirements.thinkingLevel,
              wireEffort: q.requirements.thinkingLevel,
              data_collection: privacy.data_collection,
              zdr: privacy.zdr,
              toolUse: false,
              structuredOutput: false,
              maximumInputTokens: q.requirements.maximumInputTokens,
              maximumOutputTokens: q.requirements.maximumOutputTokens,
              body: bodyString,
              bodyDigest: sha(bodyString),
              headers: pair,
              boundProof: Object.freeze({}),
            })
            preparedWire = wire
            clearTimeout(timer)
            resolvePrepare(wire)
          })().catch((e) => terminalize(errorCode(e)))
          return next
        },
      }
      registered = true
      runtime.registerNativeProvider(native)
      const settings = pi.SettingsManager.inMemory({
        compaction: { enabled: false },
        retry: { enabled: false, maxRetries: 0, provider: { maxRetries: 0 } },
        cacheWarming: 'off',
        enableAnalytics: false,
        enableInstallTelemetry: false,
        packages: [],
        extensions: [],
        skills: [],
        prompts: [],
        themes: [],
        enableSkillCommands: false,
        defaultTools: [],
        defaultProjectTrust: 'never',
        transport: 'sse',
      })
      const loader: ResourceLoader = {
        getExtensions: () => ({ extensions: [], errors: [], runtime: pi.createExtensionRuntime() }),
        getSkills: () => ({ skills: [], diagnostics: [] }),
        getPrompts: () => ({ prompts: [], diagnostics: [] }),
        getThemes: () => ({ themes: [], diagnostics: [] }),
        getAgentsFiles: () => ({ agentsFiles: [] }),
        getSystemPrompt: () => texts[0],
        getSystemPromptSource: () => undefined,
        getAppendSystemPrompt: () => [],
        getAppendSystemPromptSources: () => [],
        reload: async () => {},
        extendResources: () => {
          throw new Error('DISABLED')
        },
      }
      const created = await pi.createAgentSession({
        cwd: profile.approvedCwd,
        agentDir: profile.approvedCwd,
        modelRuntime: runtime,
        model: currentModel,
        thinkingLevel: q.requirements.thinkingLevel,
        scopedModels: [],
        noTools: 'all',
        tools: [],
        customTools: [],
        resourceLoader: loader,
        settingsManager: settings,
        sessionManager: pi.SessionManager.inMemory(profile.approvedCwd),
      })
      session = created.session
      if (invalid) {
        session.dispose()
        return
      }
      if (session.thinkingLevel !== q.requirements.thinkingLevel) refuse('PI_REFUSED')
      prompt = session.prompt(texts[1], { expandPromptTemplates: false })
      void prompt.catch(() => terminalize('PI_REFUSED'))
    })().catch((e) => terminalize(errorCode(e)))
    return pending
  }
  const verify: TerminalPortV1['verify'] = (wire, claims) => {
    try {
      if (
        invalid ||
        sent ||
        !profile ||
        !preparedWire ||
        wire === preparedWire ||
        wire.boundProof !== preparedWire.boundProof ||
        (adopted && wire !== adopted)
      )
        refuse('PROOF_REFUSED')
      const copied = Object.fromEntries(
        Object.keys(preparedWire)
          .filter((k) => k !== 'boundProof')
          .map((k) => [k, (wire as unknown as Record<string, unknown>)[k]]),
      )
      if (
        Reflect.ownKeys(wire).length !== Object.keys(preparedWire).length ||
        JSON.stringify(copied) !==
          JSON.stringify(
            Object.fromEntries(Object.entries(preparedWire).filter(([k]) => k !== 'boundProof')),
          )
      )
        refuse('PROOF_REFUSED')
      const expected: RevalidationV1 = {
        requestDigest: preparedWire.requestDigest,
        decisionDigest: preparedWire.decisionDigest,
        wireDigest: sha(JSON.stringify(copied)),
        policyDigest: profile.policyDigest,
        configDigest: profile.configDigest,
        runtimeDigest: profile.runtimeDigest,
        catalogDigest: profile.catalogDigest,
        evidenceDigest: profile.evidenceDigest,
        expiresAtUtc: profile.expiresAtUtc,
      }
      const c = fields(own(claims), claimKeys)
      if (claimKeys.some((k) => c[k] !== expected[k]) || utc(clock()) > profile.expiresAtUtc)
        refuse('PROOF_REFUSED')
      adopted = wire
      return { accepted: true }
    } catch {
      terminalize('PROOF_REFUSED')
      return { accepted: false }
    }
  }
  const send: TerminalPortV1['send'] = async (wire, consumed) => {
    if (
      invalid ||
      sent ||
      wire !== adopted ||
      !request ||
      !decision ||
      !profile ||
      !model ||
      !signal ||
      consumed.state !== 'consumed' ||
      consumed.requestDigest !== request.requestDigest ||
      consumed.requestId !== request.requestId
    )
      refuse('PROOF_REFUSED')
    sent = true
    const sendOnce = createOwnedHttpsSenderV1(
      wire.body,
      {
        responseModel: profile.responseModel,
        responseProvider: profile.responseProvider,
        maximumInputTokens: wire.maximumInputTokens,
        maximumOutputTokens: wire.maximumOutputTokens,
        cacheAllowed: false,
      },
      credentialSupplier,
      AbortSignal.any([signal, aborter.signal]),
      (metadata) =>
        onResponse?.(
          { status: metadata.status, headers: metadata.headers },
          model as Model<'openai-completions'>,
        ),
    )
    sendResult = await sendOnce()
    const proof = Object.freeze({})
    const registered = register(proof, request, decision, wire, consumed, sendResult.observation)
    if (!registered.accepted) refuse('PROOF_REFUSED')
    return Object.freeze({
      kind: sendResult.observation.kind === 'uncertain' ? 'uncertain' : 'terminal',
      proof,
    })
  }
  const finishInvocation = (result: LaunchResultV1 | null): Promise<Output> => {
    if (finalization) return finalization
    finalization = (async () => {
      let success =
        !!result?.ok &&
        result.receipt.requestDigest === request?.requestDigest &&
        result.receipt.disposition === 'succeeded' &&
        sendResult?.observation.kind === 'response' &&
        sendResult.observation.semantic === 'stop' &&
        sendResult.observation.charge.kind === 'known' &&
        !failure
      if (!success) {
        const code =
          sendResult?.observation.kind === 'response' &&
          sendResult.observation.semantic === 'length'
            ? 'OUTPUT_TRUNCATED'
            : (failure ?? 'PI_REFUSED')
        terminalize(code)
      } else {
        invalid = true
        end(true)
      }
      let drained = false
      const cleanup = Promise.resolve().then(async () => {
        await setup
        await prompt
        if (!success) await session?.abort()
        drained = true
      })
      void cleanup.catch(() => {})
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          cleanup,
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new TransportError('PI_REFUSED')), 5000)
          }),
        ])
      } catch {
        success = false
        failure = 'PI_REFUSED'
      } finally {
        clearTimeout(timeout)
        try {
          session?.dispose()
        } catch {
          success = false
          failure = 'PI_REFUSED'
        }
      }
      if (!drained) success = false
      return success
        ? Object.freeze({ kind: 'completed', text: sendResult?.stream?.text ?? '', finish: 'stop' })
        : Object.freeze({ kind: 'failed', code: failure ?? 'PI_REFUSED' })
    })()
    return finalization
  }
  return Object.freeze({ terminal: Object.freeze({ prepare, verify, send }), finishInvocation })
}
