import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import { createHash } from 'node:crypto'
import dns from 'node:dns'
import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import http from 'node:http'
import http2 from 'node:http2'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve, sep } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import tls from 'node:tls'
import { fileURLToPath } from 'node:url'
import type {
  AssistantMessageEventStream,
  Model,
  Provider,
  SimpleStreamOptions,
  TranscriptContext,
} from '@earendil-works/pi-ai'
import type {
  CreateAgentSessionOptions,
  createAgentSession,
  ModelRuntime,
  ResourceLoader,
} from '@earendil-works/pi-coding-agent'
import { createPmcControllerCustodyV1 } from '../src/pmc-launch/controller.js'
import type { TerminalPortV1 } from '../src/pmc-launch/controller-types.js'
import {
  closeIntentOwnerV1,
  initializeIntentOwnerV1,
  openIntentOwnerV1,
} from '../src/pmc-launch/intent-custody.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'
import { createTerminalObservationRegistryV1 } from '../src/pmc-launch/owned-https-sender.js'
import {
  composePmcTerminalV1,
  createProductionPmcTerminalV1,
  type PmcTerminalProfileV1,
} from '../src/pmc-launch/pi-runtime-port.js'

// Normal package CI checks these actual portable nominal declarations, including
// coding-agent's nested pi-ai against the directly imported pi-ai declaration.
function nominalComposition(
  runtime: ModelRuntime,
  provider: Provider<'openai-completions'>,
  model: Model<'openai-completions'>,
  loader: ResourceLoader,
  createSession: typeof createAgentSession,
  context: TranscriptContext,
  options: SimpleStreamOptions,
): AssistantMessageEventStream {
  runtime.registerNativeProvider(provider)
  const sessionOptions: CreateAgentSessionOptions = {
    modelRuntime: runtime,
    model,
    resourceLoader: loader,
  }
  void createSession(sessionOptions)
  return runtime.streamSimple(model, context, options)
}
test('portable nominal Pi composition is checked by normal package TypeScript', () => {
  assert.equal(typeof nominalComposition, 'function')
})
test('production construction refuses hostile input without reading or allocating runtime authority', () => {
  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error('READ')
      },
      ownKeys() {
        throw new Error('KEYS')
      },
    },
  )
  assert.deepEqual(createProductionPmcTerminalV1(hostile), { ok: false, code: 'BOUND_REFUSED' })
})

function guards(t: TestContext, root: string) {
  const counts = { network: 0, process: 0, hostFile: 0, credential: 0 }
  const denied = new Set<string>()
  const network = () => {
    counts.network++
    throw new Error('NETWORK_DISABLED')
  }
  t.mock.method(http, 'request', network)
  t.mock.method(http, 'get', network)
  t.mock.method(https, 'request', network)
  t.mock.method(https, 'get', network)
  t.mock.method(http2, 'connect', network)
  t.mock.method(net, 'connect', network)
  t.mock.method(net, 'createConnection', network)
  t.mock.method(tls, 'connect', network)
  t.mock.method(dns, 'lookup', network)
  t.mock.method(dns, 'resolve', network)
  t.mock.method(net.Socket.prototype, 'connect', network)
  t.mock.method(globalThis, 'fetch', network)
  for (const key of [
    'spawn',
    'spawnSync',
    'exec',
    'execSync',
    'execFile',
    'execFileSync',
    'fork',
  ] as const)
    t.mock.method(childProcess, key, () => {
      counts.process++
      throw new Error('PROCESS_DISABLED')
    })
  const allowed = resolve(fileURLToPath(new URL('../../', import.meta.url))).toLowerCase()
  const check = (path: unknown, metadata = false) => {
    const p = path instanceof URL ? fileURLToPath(path) : typeof path === 'string' ? path : null
    if (
      p === null ||
      /[/\\](auth|settings|models|models-store)\.json$|\.npmrc$|[/\\]\.env(?:$|\.)/i.test(p) ||
      !(
        resolve(p)
          .toLowerCase()
          .startsWith(allowed + sep) ||
        resolve(p)
          .toLowerCase()
          .startsWith(resolve(root).toLowerCase() + sep) ||
        resolve(p).toLowerCase() === resolve(root).toLowerCase() ||
        (metadata &&
          resolve(root)
            .toLowerCase()
            .startsWith(
              resolve(p)
                .toLowerCase()
                .replace(/[/\\]$/, '') + sep,
            ))
      )
    ) {
      counts.hostFile++
      if (denied.size < 20) denied.add(p ?? String(path))
      throw new Error('HOST_FILE_DISABLED')
    }
  }
  for (const key of [
    'readFileSync',
    'existsSync',
    'statSync',
    'lstatSync',
    'realpathSync',
    'readdirSync',
    'openSync',
  ] as const) {
    const original = fs[key]
    t.mock.method(fs, key, (...args: unknown[]) => {
      check(args[0], key !== 'readFileSync' && key !== 'openSync' && key !== 'readdirSync')
      return Reflect.apply(original, fs, args)
    })
  }
  for (const key of ['readFile', 'stat', 'lstat', 'realpath', 'readdir', 'open'] as const) {
    const original = fsp[key]
    t.mock.method(fsp, key, (...args: unknown[]) => {
      check(args[0])
      return Reflect.apply(original, fsp, args)
    })
  }
  const prior = process.env
  process.env = new Proxy(
    {
      SystemRoot: 'C:\\Windows',
      WINDIR: 'C:\\Windows',
      PATH: 'C:\\Windows\\System32',
      USERPROFILE: root,
      HOME: root,
      TEMP: root,
      TMP: root,
    },
    {
      get(target, key) {
        if (
          typeof key === 'string' &&
          /(?:API_?KEY|ACCESS_?TOKEN|SECRET|CREDENTIAL|AUTH_TOKEN)/i.test(key)
        ) {
          counts.credential++
          throw new Error('ENV_CREDENTIAL_DISABLED')
        }
        return Reflect.get(target, key)
      },
    },
  )
  syncBuiltinESMExports()
  t.after(() => {
    process.env = prior
    t.mock.restoreAll()
    syncBuiltinESMExports()
    if (denied.size) t.diagnostic(JSON.stringify([...denied]))
  })
  return counts
}

test('actual pinned Pi in-memory native provider captures a one-shot request with no ambient effects', {
  timeout: 130000,
}, async (t) => {
  const root = fs.mkdtempSync(join(tmpdir(), 'pmc-d-pi-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  if (process.env.PMC_D_GUARDED_CHILD !== '1') {
    const child = childProcess.spawnSync(
      process.execPath,
      ['--import', 'tsx', '--test', fileURLToPath(import.meta.url)],
      {
        cwd: resolve(fileURLToPath(new URL('../', import.meta.url))),
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 524288,
        env: {
          PMC_D_GUARDED_CHILD: '1',
          TSX_DISABLE_CACHE: '1',
          SystemRoot: 'C:\\Windows',
          WINDIR: 'C:\\Windows',
          PATH: `${dirname(process.execPath)}${delimiter}C:\\Windows\\System32`,
          HOME: root,
          USERPROFILE: root,
          TEMP: root,
          TMP: root,
        },
      },
    )
    assert.equal(child.error, undefined)
    assert.equal(child.status, 0, child.stdout + child.stderr)
    return
  }
  const counts = guards(t, root)
  const coding = await import('@earendil-works/pi-coding-agent')
  const ai = await import('@earendil-works/pi-ai/utils/event-stream')
  let registered = false,
    streams = 0
  const runtime = await coding.ModelRuntime.create({
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
  const model: Model<'openai-completions'> = {
    id: 'fixture/model',
    name: 'Offline fixture',
    api: 'openai-completions',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    reasoning: true,
    input: ['text'],
    cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 10000,
    maxTokens: 200,
    thinkingLevelMap: { low: 'low' },
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
  }
  let captured: TranscriptContext | undefined, options: SimpleStreamOptions | undefined
  const provider: Provider<'openai-completions'> = {
    id: 'openrouter',
    name: 'Offline fixture',
    getModels: () => [model],
    auth: {
      apiKey: {
        name: 'Offline fixture',
        check: async () => ({ type: 'api_key', source: 'offline' }),
        resolve: async () => ({ auth: {} }),
      },
    },
    stream: () => {
      throw new Error('UNOWNED_STREAM')
    },
    streamSimple: (_model, context, opts) => {
      streams++
      captured = context
      options = opts
      const stream = new ai.AssistantMessageEventStream()
      stream.push({
        type: 'error',
        reason: 'error',
        error: {
          role: 'assistant',
          api: 'openai-completions',
          provider: 'openrouter',
          model: model.id,
          content: [],
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
          },
          stopReason: 'error',
          timestamp: Date.now(),
          errorMessage: 'OFFLINE_PROBE',
        },
      })
      stream.end()
      return stream
    },
  }
  registered = true
  runtime.registerNativeProvider(provider)
  const settings = coding.SettingsManager.inMemory({
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
    getExtensions: () => ({ extensions: [], errors: [], runtime: coding.createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }),
    getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }),
    getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => 'Public system',
    getSystemPromptSource: () => undefined,
    getAppendSystemPrompt: () => [],
    getAppendSystemPromptSources: () => [],
    reload: async () => {},
    extendResources: () => {
      throw new Error('DISABLED')
    },
  }
  const { session } = await coding.createAgentSession({
    cwd: root,
    agentDir: root,
    modelRuntime: runtime,
    model,
    thinkingLevel: 'low',
    scopedModels: [],
    noTools: 'all',
    tools: [],
    customTools: [],
    resourceLoader: loader,
    settingsManager: settings,
    sessionManager: coding.SessionManager.inMemory(root),
  })
  try {
    await session.prompt('Public user', { expandPromptTemplates: false })
    assert.equal(session.thinkingLevel, 'low')
    assert.equal(streams, 1)
    assert(captured)
    assert.equal(options?.reasoning, 'low')
    assert.equal(options?.maxRetries, 0)
    assert.equal(captured.messages.length, 2)
    assert.deepEqual(counts, { network: 0, process: 0, hostFile: 0, credential: 0 })
  } finally {
    session.dispose()
  }
  await actualComposition(t, root, coding, ai, 'stop')
  await actualComposition(t, root, coding, ai, 'length')
  await actualComposition(t, root, coding, ai, 'unknown')
  await actualComposition(t, root, coding, ai, 'no-send')
  await actualComposition(t, root, coding, ai, 'bound-refused')
  for (const mode of [
    'payload-change',
    'payload-throw',
    'response-throw',
    'c-reject',
    'clamp',
    'profile-missing',
    'hook-hang',
    'cleanup-hang',
    'second-stream',
    'unknown-option',
    'wire-copy',
    'claims-change',
  ] as const)
    await actualComposition(t, root, coding, ai, mode)
  assert.deepEqual(counts, { network: 0, process: 0, hostFile: 0, credential: 0 })
})

type Fixture = ReturnType<typeof JSON.parse>
const digest = 'a'.repeat(64),
  now = '2026-09-26T12:00:00.000Z',
  expires = '2026-09-26T13:00:00.000Z'
const sha = (v: string) => createHash('sha256').update(v).digest('hex')
async function actualComposition(
  t: TestContext,
  root: string,
  coding: typeof import('@earendil-works/pi-coding-agent'),
  ai: typeof import('@earendil-works/pi-ai/utils/event-stream'),
  reason:
    | 'stop'
    | 'length'
    | 'unknown'
    | 'no-send'
    | 'bound-refused'
    | 'payload-change'
    | 'payload-throw'
    | 'response-throw'
    | 'c-reject'
    | 'clamp'
    | 'profile-missing'
    | 'hook-hang'
    | 'cleanup-hang'
    | 'second-stream'
    | 'unknown-option'
    | 'wire-copy'
    | 'claims-change',
) {
  const f: Fixture = JSON.parse(
    fs.readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  f.request.requirements.toolUse = false
  f.request.requirements.structuredOutput = false
  const ownerRoot = join(root, `owner-${reason}`),
    ledgerRoot = join(root, `ledger-${reason}`)
  fs.mkdirSync(ownerRoot)
  fs.mkdirSync(ledgerRoot)
  const scope = {
    scopeId: 'scope',
    authorityDigest: digest,
    currency: 'USD',
    authorizedLimitMicroUsd: 10000000,
    workflowId: 'workflow',
    accountId: 'account',
    routingClass: 'implementation/standard',
  }
  const identity = {
    storeId: 'owner',
    ledgerId: 'ledger',
    epoch: 'epoch',
    initializationAuthorityDigest: digest,
    schemaVersion: 1,
  }
  const {
    episodeId: _e,
    requestId: _i,
    requestDigest: _d,
    attempt: _a,
    ...routeTemplate
  } = f.request
  const initialized = initializeIntentOwnerV1(
    {
      root: ownerRoot,
      identity,
      intents: [
        {
          intentRef: 'intent',
          businessAuthorityRef: 'business',
          businessAuthorityDigest: digest,
          originId: 'origin',
          routeTemplate,
          policyDigest: digest,
          configDigest: digest,
          scope,
          authorityObservedAtUtc: now,
          authorityExpiresAtUtc: expires,
          fallbackAllowed: true,
        },
      ],
    },
    { authenticateSetup: () => ({ accepted: true }) },
  )
  assert(initialized.ok)
  const ids = initialized.value[0]
  assert(ids)
  const route = { ...f.request, episodeId: ids.episodeId, requestId: ids.requestIds[0] }
  const payloadJson = JSON.stringify({
    messages: [
      { role: 'system', content: 'Public system' },
      { role: 'user', content: 'Public user' },
    ],
  })
  const { requestDigest: _rd, ...material } = route
  route.requestDigest = sha(JSON.stringify(['pmc-request/v1', 'intent', material, payloadJson]))
  const refresh = (v: Fixture) => {
    if (v && typeof v === 'object') {
      if ('requestDigest' in v) v.requestDigest = route.requestDigest
      if ('observedAtUtc' in v) v.observedAtUtc = now
      if ('expiresAtUtc' in v) v.expiresAtUtc = expires
      for (const x of Object.values(v)) refresh(x)
    }
  }
  refresh(f.context)
  const source = f.context.catalog.source,
    evidence = () => ({ ...source.evidence, bindingId: null }),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const origin = {}
  const owner = openIntentOwnerV1(
    { root: ownerRoot, expectedIdentity: identity },
    {
      clock: () => now,
      authenticateOrigin: (_a: unknown, _s: unknown, _p: unknown, cap: object) =>
        cap === origin
          ? {
              accepted: true,
              episodeEvidence: evidence(),
              budgetEvidence: evidence(),
              priorDisposition: null,
              primaryQuality: null,
            }
          : { accepted: false },
      authenticateSelection: boot.custody.authenticateSelection,
      authenticateCompletion: boot.custody.authenticateCompletion,
    },
  )
  assert(owner.ok)
  t.after(() => closeIntentOwnerV1(owner.value.owner))
  assert(
    initializeLocalPmcLedger(
      {
        root: ledgerRoot,
        ledgerId: 'ledger',
        epoch: 'epoch',
        initializationAuthorityDigest: digest,
        scopes: [scope],
      },
      {
        clock: () => now,
        authenticateInitialization: (r) => ({
          accepted: true,
          ledgerId: r.ledgerId,
          epoch: r.epoch,
          initializationAuthorityDigest: r.initializationAuthorityDigest,
          scopesDigest: sha(JSON.stringify(r.scopes)),
        }),
      },
    ).ok,
  )
  const registry = createTerminalObservationRegistryV1(() => now)
  const ledger = createLocalPmcLedger(
    {
      root: ledgerRoot,
      expectedLedgerId: 'ledger',
      expectedEpoch: 'epoch',
      expectedInitializationAuthorityDigest: digest,
    },
    {
      clock: () => now,
      authenticateNoSendProof: registry.authenticateNoSendProof,
      authenticateSettlement: registry.authenticateSettlement,
    },
  )
  assert(ledger.ok)
  const models = f.context.catalog.results.map((r: Fixture) => ({
    provider: r.provider,
    id: r.providerModelId,
    baseUrl: r.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : r.facts.baseUrl,
    api: r.facts.api,
    input: r.facts.inputModalities,
    reasoning: true,
    contextWindow: 10000,
    maxTokens: 2000,
    cost: { input: r.facts.rates.input, output: r.facts.rates.output },
    thinkingLevelMap: { off: 'none', high: 'high' },
  }))
  const bytes = Buffer.from(
      JSON.stringify(
        {
          formatVersion: 'rcm-catalog-snapshot/v1',
          sourceRef: 'synthetic-offline-only',
          providers: [
            { providerKey: 'opencode', checkedAtUtc: now },
            { providerKey: 'openrouter', checkedAtUtc: now },
          ],
          models,
        },
        null,
        2,
      ) + '\n',
    ),
    snapshot = sha(bytes.toString())
  source.value.snapshotDigest = snapshot
  const identities = models.map((m: Fixture) => ({ provider: m.provider, id: m.id }))
  const catalogInput = {
    canonicalBytes: bytes,
    expectedSha256: snapshot,
    approvedConfig: {
      authorityRef: 'synthetic-config',
      endpoints: [
        { provider: 'opencode', baseUrl: 'https://synthetic.invalid/v1' },
        { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
      ],
    },
    identities,
    acceptedSource: {
      profileId: 'synthetic-profile',
      profileVersion: 'v1',
      canonicalSha256: snapshot,
      sourceEvidenceRef: 'synthetic-offline-only',
      sourceEvidenceSha256: digest,
      requestedIdentities: identities,
    },
  }
  const {
    catalog: _c,
    episode: _ep,
    budget: _b,
    evaluationTimeUtc: _time,
    evidenceMode: _mode,
    ...context
  } = f.context
  const prices = context.bindings.map((b: Fixture) => {
    const binding = context.projection.policy.bindings.find(
      (p: Fixture) => p.bindingId === b.bindingId,
    )
    return {
      version: 'pmc-price/v1',
      currency: 'USD',
      requestDigest: route.requestDigest,
      identity: {
        bindingId: b.bindingId,
        provider: binding.provider,
        providerModelId: binding.providerModelId,
      },
      sourceProfileId: 'synthetic-profile',
      sourceProfileVersion: 'v1',
      sourceProfileDigest: digest,
      tariffDigest: digest,
      priceEvidenceDigest: digest,
      inputRate: { value: '1', unit: 'USD per 1M tokens' },
      outputRate: { value: '2', unit: 'USD per 1M tokens' },
      perRequestFeeUsd: '0',
      otherFees: 'none-attested',
      maximumInputTokens: 1000,
      maximumOutputTokens: 200,
      rankingTokens: { input: 100, output: 20 },
    }
  })
  context.bindings = context.bindings.map((b: Fixture) => {
    const { cost, ...rest } = b
    if (b.bindingId === 'binding-2' || b.bindingId === 'binding-3')
      rest.catalogBaseUrl.value = 'https://openrouter.ai/api/v1'
    return { ...rest, costEvidence: cost.evidence }
  })
  const profiles = new WeakMap<object, PmcTerminalProfileV1>()
  let sends = 0
  let retained: Awaited<ReturnType<typeof coding.createAgentSession>>['session'] | undefined
  let hooks = 0
  const originalRegister = coding.ModelRuntime.prototype.registerNativeProvider
  const registerMock =
    reason === 'second-stream' || reason === 'unknown-option'
      ? t.mock.method(
          coding.ModelRuntime.prototype,
          'registerNativeProvider',
          function (this: ModelRuntime, provider: Provider<'openai-completions'>) {
            const originalStream = provider.streamSimple
            const wrapped: Provider<'openai-completions'> = {
              ...provider,
              streamSimple: (model, context, options) => {
                const first = originalStream(
                  model,
                  context,
                  reason === 'unknown-option'
                    ? Object.assign({}, options, { unexpected: true })
                    : options,
                )
                if (reason === 'second-stream') originalStream(model, context, options)
                return first
              },
            }
            return originalRegister.call(this, wrapped)
          },
        )
      : undefined
  const originalTimeout = globalThis.setTimeout
  const timeoutMock =
    reason === 'hook-hang' || reason === 'cleanup-hang'
      ? t.mock.method(
          globalThis,
          'setTimeout',
          (handler: (...args: unknown[]) => void, delay: number | undefined, ...args: unknown[]) =>
            originalTimeout(handler, delay === 30000 ? 500 : delay === 5000 ? 20 : delay, ...args),
        )
      : undefined
  const createSession: typeof coding.createAgentSession = async (options) => {
    const created = await coding.createAgentSession(options)
    retained = created.session
    if (reason === 'cleanup-hang') {
      const original = created.session.prompt.bind(created.session)
      t.mock.method(created.session, 'prompt', async (...args: Parameters<typeof original>) => {
        await original(...args)
        await new Promise<void>(() => {})
      })
    }
    if (reason === 'payload-change')
      created.session.agent.onPayload = () => {
        hooks++
        return { model: 'changed' }
      }
    if (reason === 'payload-throw')
      created.session.agent.onPayload = () => {
        hooks++
        throw new Error('PRIVATE_HOOK_ERROR')
      }
    if (reason === 'hook-hang')
      created.session.agent.onPayload = () => {
        hooks++
        return new Promise(() => {})
      }
    if (reason === 'response-throw')
      created.session.agent.onResponse = () => {
        hooks++
        throw new Error('PRIVATE_RESPONSE_ERROR')
      }
    if (reason === 'clamp') created.session.setThinkingLevel('off')
    return created
  }
  const helpers = await import('@earendil-works/pi-ai')
  // This test-local factory is deliberately non-exported and network-incapable.
  t.mock.method(https, 'request', (_options: unknown, callback: (response: unknown) => void) => {
    sends++
    let body = ''
    const req = new EventEmitter()
    Object.assign(req, {
      destroy: () => {},
      write: (chunk: Uint8Array) => {
        body = Buffer.from(chunk).toString()
      },
      end: () => {
        queueMicrotask(() => {
          const m = JSON.parse(body).model
          const text = `data: ${JSON.stringify({ id: 'response', object: 'chat.completion.chunk', model: m, choices: [{ index: 0, delta: { content: 'done' }, finish_reason: reason === 'length' ? 'length' : 'stop' }] })}\n\ndata: ${JSON.stringify({ id: 'response', object: 'chat.completion.chunk', model: m, choices: [], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2, cost: reason === 'unknown' ? 0.0000001 : 0.000002 } })}\n\ndata: [DONE]\n\n`
          const response = new EventEmitter()
          Object.assign(response, {
            statusCode: 200,
            headers: { 'content-type': 'text/event-stream' },
            complete: true,
            destroy: () => {},
            resume: () =>
              queueMicrotask(() => {
                response.emit('data', Buffer.from(text))
                response.emit('end')
                response.emit('close')
              }),
          })
          callback(response)
        })
      },
    })
    return req
  })
  syncBuiltinESMExports()
  const terminal = composePmcTerminalV1({
    pi: {
      ModelRuntime: coding.ModelRuntime,
      createAgentSession: createSession,
      SettingsManager: coding.SettingsManager,
      SessionManager: coding.SessionManager,
      createExtensionRuntime: coding.createExtensionRuntime,
      AssistantMessageEventStream: ai.AssistantMessageEventStream,
      getSystemMessageText: helpers.getSystemMessageText,
    },
    clock: () => now,
    profileFor: (q) => (reason === 'profile-missing' ? undefined : profiles.get(q)),
    verifyBillableBound: () => reason !== 'bound-refused',
    register: registry.register,
    credentialSupplier: () => {
      assert.equal(
        consumed,
        true,
        'credential lookup follows actual durable consume acknowledgement',
      )
      return reason === 'no-send' ? undefined : 'fixture-only-token'
    },
  })
  let consumed = false
  let verifications = 0
  const transport: TerminalPortV1 = {
    ...terminal.terminal,
    verify: (wire, claims) => {
      verifications++
      const keys = [
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
      ] as const
      const literal = Object.fromEntries(
        keys.map((k) => [
          k,
          k === 'headers'
            ? { 'content-type': 'application/json', accept: 'text/event-stream' }
            : wire[k],
        ]),
      )
      assert.equal(claims.wireDigest, sha(JSON.stringify(literal)))
      assert.equal(wire.bodyDigest, sha(wire.body))
      assert.equal(claims.policyDigest, digest)
      assert.equal(claims.configDigest, digest)
      assert.equal(claims.runtimeDigest, digest)
      assert.equal(claims.catalogDigest, snapshot)
      assert.equal(claims.evidenceDigest, digest)
      assert.equal(claims.expiresAtUtc, expires)
      return terminal.terminal.verify(
        reason === 'wire-copy' && verifications > 1 ? { ...wire } : wire,
        reason === 'claims-change' ? { ...claims, runtimeDigest: 'f'.repeat(64) } : claims,
      )
    },
  }
  const binding = boot.custody.bind(
    {
      clock: () => now,
      owner: owner.value.owner,
      originCapability: origin,
      acquire: (q: object) => {
        const price = prices.find((p: Fixture) => p.identity.bindingId === 'binding-2')
        profiles.set(q, {
          requestDigest: route.requestDigest,
          policyDigest: digest,
          configDigest: digest,
          runtimeDigest: digest,
          catalogDigest: snapshot,
          evidenceDigest: digest,
          expiresAtUtc: expires,
          price,
          endpointSlug: 'fixture/endpoint',
          responseModel: price.identity.providerModelId,
          responseProvider: 'Fixture',
          billableBoundKind: 'provider-billable-ceiling',
          billableBoundSourceDigest: digest,
          approvedCwd: root,
          mappingProfileDigest: digest,
        })
        return {
          context,
          catalogInput,
          catalogSource: source,
          prices,
          runtimeDigest: digest,
          evidenceDigest: digest,
          expiresAtUtc: expires,
          scopeId: 'scope',
          classCeilingMicroUsd: 10000000,
          ceilingAuthorityRef: 'ceiling',
          ceilingAuthorityDigest: digest,
        }
      },
      revalidate: (current: unknown) =>
        reason === 'c-reject'
          ? { accepted: false }
          : { accepted: true, current, evaluatedAtUtc: now },
      ledger: {
        ...ledger.value,
        consume: (input: unknown) => {
          const result = ledger.value.consume(input)
          if (result.ok) consumed = true
          return result
        },
      },
      transport,
    },
    { observe: registry.observe },
  )
  assert(binding.ok)
  const result = await binding.controller.launch({
    version: 'pmc-launch/v1',
    intentRef: 'intent',
    route,
    payloadJson,
    override: null,
  })
  const beforeSend = [
    'bound-refused',
    'payload-change',
    'payload-throw',
    'c-reject',
    'clamp',
    'profile-missing',
    'hook-hang',
    'second-stream',
    'unknown-option',
    'wire-copy',
    'claims-change',
  ].includes(reason)
  if (beforeSend) assert.equal(result.ok, false)
  else if (reason === 'unknown') {
    assert(!result.ok)
    assert.equal(result.code, 'SEND_UNCERTAIN')
    assert.equal(result.receipt?.disposition, 'uncertain')
  } else {
    assert(result.ok, JSON.stringify(result))
    assert.equal(
      result.receipt.disposition,
      reason === 'stop' || reason === 'cleanup-hang'
        ? 'succeeded'
        : reason === 'length' || reason === 'response-throw'
          ? 'terminal-failed-settled'
          : 'terminal-no-send',
    )
  }
  const output = await terminal.finishInvocation(result)
  assert.deepEqual(
    output,
    reason === 'stop'
      ? { kind: 'completed', text: 'done', finish: 'stop' }
      : {
          kind: 'failed',
          code:
            reason === 'length'
              ? 'OUTPUT_TRUNCATED'
              : reason === 'bound-refused'
                ? 'BOUND_REFUSED'
                : reason === 'payload-change'
                  ? 'PAYLOAD_REFUSED'
                  : reason === 'payload-throw'
                    ? 'HOOK_REFUSED'
                    : reason === 'wire-copy' || reason === 'claims-change'
                      ? 'PROOF_REFUSED'
                      : reason === 'profile-missing'
                        ? 'PROFILE_REFUSED'
                        : 'PI_REFUSED',
        },
  )
  assert.deepEqual(await terminal.finishInvocation(result), output)
  assert.equal(sends, reason === 'no-send' || beforeSend ? 0 : 1)
  if (reason.startsWith('payload-') || reason === 'response-throw') assert.equal(hooks, 1)
  if (reason === 'stop' || reason === 'unknown') {
    const last = retained?.state.messages.at(-1)
    assert(last?.role === 'assistant')
    assert.equal(last.usage.cost.total, 0.000003)
    assert(
      last.diagnostics?.some(
        (d) =>
          d.type === 'pmc-nonaccounting-usage' &&
          d.details?.accountingAuthority === 'pmc-ledger' &&
          d.details?.usageObserved === true,
      ),
    )
    assert.equal(last.responseId, 'response')
  }
  if (reason === 'profile-missing') assert.equal(retained, undefined)
  if (reason === 'hook-hang') assert.equal(hooks, 1)
  timeoutMock?.mock.restore()
  registerMock?.mock.restore()
}
