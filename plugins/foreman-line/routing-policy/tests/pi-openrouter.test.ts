import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import {
  PI_OPENROUTER_PROTOCOLS,
  PI_OPENROUTER_ROUTING,
  type PiOpenRouterProvenance,
  type PiOpenRouterRouting,
  piOpenRouterModelSchema,
  piOpenRouterRoutingSchema,
  resolvePiOpenRouterRoute,
  validatePiOpenRouterRouting,
} from '../src/pi-openrouter.js'
import {
  ADAPTER_REFUSALS,
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  type DeclaredEvidence,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
} from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const templatePath = join(here, '..', '..', 'templates', 'pi-openrouter-routing.json')

function loadTemplate(): Record<string, unknown> {
  return JSON.parse(readFileSync(templatePath, 'utf8')) as Record<string, unknown>
}

test('Pi/OpenRouter template is schema-valid and contains no credential fields', () => {
  const template = loadTemplate()
  const valid = new Ajv({ allErrors: true }).compile(piOpenRouterRoutingSchema as SchemaObject)
  assert.equal(valid(template), true, JSON.stringify(valid.errors))
  assert.equal('apiKey' in template, false)
  assert.equal('credentials' in template, false)
})

test('Pi/OpenRouter template matches the typed routing registry', () => {
  const { $schema: _schema, ...templateWithoutSchema } = loadTemplate()
  assert.deepEqual(templateWithoutSchema, PI_OPENROUTER_ROUTING)
})

test('Pi/OpenRouter template passes cross-field capability validation', () => {
  const result = validatePiOpenRouterRouting(loadTemplate())
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('Jev capability contract rejects control-plane or prose/implementation use', () => {
  // A fixed fixture keeps this boundary tested after the live model is retired.
  const invalid = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabledModels: ['typesafe/jev-1.13'],
    models: {
      'typesafe/jev-1.13': {
        capabilities: ['routing', 'classification', 'structured-decision'],
        allowedLanes: ['routing', 'classification'],
        prohibitedLanes: [
          'prose-generation',
          'implementation',
          'approval',
          'merge',
          'policy-bypass',
        ],
        authority: 'recommend-only',
      },
    },
  } as {
    models: Record<string, Record<string, unknown>>
  }
  const jev = invalid.models['typesafe/jev-1.13']
  assert.ok(jev)
  jev.authority = 'execution'
  jev.allowedLanes = ['implementation']
  jev.prohibitedLanes = ['approval']

  const result = validatePiOpenRouterRouting(invalid)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('recommend-only')))
  assert.ok(result.errors.some((error) => error.includes('routing/classification only')))
  assert.ok(result.errors.some((error) => error.includes("prohibit 'merge'")))
  assert.notDeepEqual(invalid, PI_OPENROUTER_ROUTING)
})

test('catalog registry accepts a native Zen mapping and a free model suffix', () => {
  const document = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabledModels: ['vendor/example:free'],
    models: {
      'vendor/example:free': {
        capabilities: ['implementation'],
        allowedLanes: ['builder'],
        prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
        authority: 'execution',
        opencodeId: 'example-free',
      },
    },
  }
  assert.equal(validatePiOpenRouterRouting(document).valid, true)
  document.models['vendor/example:free'].opencodeId = ''
  assert.equal(validatePiOpenRouterRouting(document).valid, false)
})

// ---------------------------------------------------------------------------
// HRO-P1 (HRO charter D2/D3): extended mapping contract — explicit
// identity/provider/protocol/harness separation and typed rejection.
// ---------------------------------------------------------------------------

const CHAT_COMPLETIONS = 'openai-chat-completions' as const

test('HRO-P1 demo (a): a supported route resolves and executes through the extended mapping', () => {
  const document = loadTemplate()
  assert.equal(validatePiOpenRouterRouting(document).valid, true)

  const resolution = resolvePiOpenRouterRoute(
    PI_OPENROUTER_ROUTING,
    'openai/gpt-5.6-luna',
    CHAT_COMPLETIONS,
  )
  assert.equal(resolution.status, 'resolved')
  assert.ok(resolution.status === 'resolved')
  const route = resolution.route

  // D2: the four values are distinct fields and never substitute for each
  // other. Execution through the mapping means the provider request carries
  // the provider-local model ID at the pinned endpoint under the declared
  // protocol, while the Pi harness session is selected by the host identifier.
  assert.equal(route.registryKey, 'openai/gpt-5.6-luna')
  assert.equal(route.providerLocalId, 'openai/gpt-5.6-luna')
  assert.equal(route.protocol, 'openai-chat-completions')
  assert.equal(route.hostModelId, 'gpt-5.6-luna')
  assert.equal(route.provider, 'openrouter')
  assert.equal(route.baseUrl, 'https://openrouter.ai/api/v1')
  assert.notEqual(route.providerLocalId, route.hostModelId)
  assert.notEqual(route.registryKey, route.hostModelId)

  // Executed identities, taken from the mapping only: the provider request
  // body's model value is the provider-local ID; the harness session model is
  // the host identifier. The registry key stays identity (envelope opacity).
  const executedProviderRequestModel = route.providerLocalId
  const executedHarnessSessionModel = route.hostModelId
  assert.equal(executedProviderRequestModel, 'openai/gpt-5.6-luna')
  assert.equal(executedHarnessSessionModel, 'gpt-5.6-luna')
  assert.deepEqual(route.capabilities, ['prose-generation', 'implementation'])
  assert.equal(route.authority, 'execution')
})

test('HRO-P1 demo (b): an unknown model ID is rejected typed unavailable, never a guessed identity', () => {
  // Near misses that must never acquire a mapping by inference (D2/D8 step 1):
  // prefix of a known key, suffix variant, version substitution, family
  // fallback, and prototype-chain keys that a naive lookup would "resolve".
  const unknownIds = [
    'anthropic/claude', // prefix of known keys — no prefix stripping
    'openai/gpt-6-astra-preview', // suffix variant — no variant inference
    'openai/gpt-6.5-astra', // version substitution — no regex rewriting
    'anthropic/claude-fable-5.2', // family fallback — no family stepping
    'toString',
    'constructor',
    '__proto__', // prototype keys are unknown ids, not mappings
  ]
  for (const unknownId of unknownIds) {
    const resolution = resolvePiOpenRouterRoute(PI_OPENROUTER_ROUTING, unknownId, CHAT_COMPLETIONS)
    assert.equal(resolution.status, 'unavailable', `expected typed unavailable for '${unknownId}'`)
    assert.equal(resolution.refusal.name, 'MAPPING_MISSING_REFUSED')
    assert.ok(resolution.refusal.detail.includes(unknownId))
    assert.equal('route' in resolution, false, `no route may appear for '${unknownId}'`)
  }
})

test('HRO-P1 demo (c): a known model with an incompatible protocol mapping is rejected typed unsupported', () => {
  // Known shipped model, declared chat-completions, requested as Zen systemone.
  const asZen = resolvePiOpenRouterRoute(
    PI_OPENROUTER_ROUTING,
    'openai/gpt-5.6-luna',
    'zen-systemone',
  )
  assert.equal(asZen.status, 'unsupported')
  assert.ok(asZen.status === 'unsupported')
  assert.equal(asZen.refusal.name, 'PROTOCOL_INCOMPATIBLE_REFUSED')
  assert.ok(asZen.refusal.detail.includes('openai-chat-completions'))
  assert.ok(asZen.refusal.detail.includes('zen-systemone'))
  assert.equal('route' in asZen, false)

  // And the reverse direction: a Zen-declared mapping cannot serve
  // chat-completions execution — the mismatch is the mapping's, not the id's.
  const zenMapping: PiOpenRouterRouting = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabledModels: ['vendor/zen-example'],
    models: {
      'vendor/zen-example': {
        capabilities: ['structured-decision'],
        allowedLanes: ['routing', 'classification'],
        prohibitedLanes: [
          'prose-generation',
          'implementation',
          'approval',
          'merge',
          'policy-bypass',
        ],
        authority: 'recommend-only',
        opencodeId: 'zen-example',
        providerLocalId: 'zen-example-body-id',
        protocol: 'zen-systemone',
      },
    },
  }
  assert.equal(validatePiOpenRouterRouting(zenMapping).valid, true)
  const asChat = resolvePiOpenRouterRoute(zenMapping, 'vendor/zen-example', CHAT_COMPLETIONS)
  assert.equal(asChat.status, 'unsupported')
  assert.ok(asChat.status === 'unsupported')
  assert.equal(asChat.refusal.name, 'PROTOCOL_INCOMPATIBLE_REFUSED')

  const asZenOk = resolvePiOpenRouterRoute(zenMapping, 'vendor/zen-example', 'zen-systemone')
  assert.equal(asZenOk.status, 'resolved')
  assert.ok(asZenOk.status === 'resolved')
  assert.equal(asZenOk.route.protocol, 'zen-systemone')
  assert.equal(asZenOk.route.providerLocalId, 'zen-example-body-id')
  assert.equal(asZenOk.route.hostModelId, 'zen-example')
})

test('HRO-P1 typed rejections carry distinct reasons and no incomplete mapping resolves', () => {
  assert.equal(new Set(ADAPTER_REFUSALS).size, ADAPTER_REFUSALS.length)
  const incomplete: PiOpenRouterRouting = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabledModels: ['vendor/legacy-entry'],
    models: {
      // A pre-HRO entry shape: schema-valid, but without explicit mapping
      // values. D2 forbids deriving them — typed unavailable, not a default.
      'vendor/legacy-entry': {
        capabilities: ['implementation'],
        allowedLanes: ['builder'],
        prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
        authority: 'execution',
        opencodeId: 'legacy-entry',
      },
    },
  }
  const resolution = resolvePiOpenRouterRoute(incomplete, 'vendor/legacy-entry', CHAT_COMPLETIONS)
  assert.equal(resolution.status, 'unavailable')
  assert.equal(resolution.refusal.name, 'MAPPING_INCOMPLETE_REFUSED')
  assert.ok(resolution.refusal.detail.includes('providerLocalId'))
  assert.ok(resolution.refusal.detail.includes('protocol'))
  assert.equal('route' in resolution, false)

  // The three rejection reasons are distinct names (acceptance: distinct
  // reasons), each emitted by its own failure and none folded into another.
  const missing = resolvePiOpenRouterRoute(PI_OPENROUTER_ROUTING, 'no/such-model', CHAT_COMPLETIONS)
  assert.ok(missing.status !== 'resolved')
  const protocolMismatch = resolvePiOpenRouterRoute(
    PI_OPENROUTER_ROUTING,
    'openai/gpt-5.6-luna',
    'zen-systemone',
  )
  assert.ok(protocolMismatch.status !== 'resolved')
  const reasons = [missing.refusal.name, resolution.refusal.name, protocolMismatch.refusal.name]
  assert.deepEqual(reasons, [
    'MAPPING_MISSING_REFUSED',
    'MAPPING_INCOMPLETE_REFUSED',
    'PROTOCOL_INCOMPATIBLE_REFUSED',
  ])
  assert.equal(new Set(reasons).size, 3)
})

test('HRO-P1 adapter refusal vocabulary stays distinct from the other vocabularies', () => {
  assert.deepEqual([...ADAPTER_REFUSALS].sort(), [
    'MAPPING_INCOMPLETE_REFUSED',
    'MAPPING_MISSING_REFUSED',
    'PROTOCOL_INCOMPATIBLE_REFUSED',
  ])
  const others = [
    ...RESOLVER_REFUSALS,
    ...RESOLVER_HOLDS,
    ...CONTRACT_REFUSALS,
    ...CONTRACT_RESIDUALS,
  ]
  for (const name of ADAPTER_REFUSALS) {
    assert.ok(!others.includes(name), `'${name}' must not fold into another vocabulary`)
  }
})

test('HRO-P1 protocol vocabulary and schema enum agree (one vocabulary mechanism)', () => {
  assert.deepEqual([...PI_OPENROUTER_PROTOCOLS], ['openai-chat-completions', 'zen-systemone'])
  const modelSchema = piOpenRouterModelSchema as {
    properties: { protocol?: { enum?: unknown[] } }
  }
  assert.deepEqual(modelSchema.properties.protocol?.enum, [...PI_OPENROUTER_PROTOCOLS])
})

test('HRO-P1 every shipped mapping is explicit and resolves under its declared protocol', () => {
  const routing = PI_OPENROUTER_ROUTING
  for (const id of routing.enabledModels) {
    const entry = routing.models[id]
    assert.ok(entry, `enabled model '${id}' has no mapping entry`)
    assert.equal(typeof entry.providerLocalId, 'string')
    assert.ok(entry.providerLocalId && entry.providerLocalId.length > 0)
    assert.equal(entry.protocol, CHAT_COMPLETIONS)
    const resolution = resolvePiOpenRouterRoute(routing, id, CHAT_COMPLETIONS)
    assert.equal(resolution.status, 'resolved', `'${id}' must resolve as a supported route`)
    assert.ok(resolution.status === 'resolved')
    assert.equal(resolution.route.registryKey, id)
  }
})

test('HRO-P1 declared catalog provenance flows through; absent provenance stays unknown', () => {
  const provenance: DeclaredEvidence<PiOpenRouterProvenance> = {
    state: 'declared',
    source: 'docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json',
    value: {
      fetched_at: '2026-09-20T17:22:45Z',
      valid_until: '2026-10-20T17:22:45Z',
      content_hash: 'a'.repeat(64),
    },
  }
  const document: PiOpenRouterRouting = {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabledModels: ['vendor/provenanced'],
    models: {
      'vendor/provenanced': {
        capabilities: ['implementation'],
        allowedLanes: ['builder'],
        prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
        authority: 'execution',
        opencodeId: 'provenanced',
        providerLocalId: 'vendor/provenanced',
        protocol: 'openai-chat-completions',
        provenance,
      },
    },
  }
  assert.equal(validatePiOpenRouterRouting(document).valid, true)
  const resolution = resolvePiOpenRouterRoute(document, 'vendor/provenanced', CHAT_COMPLETIONS)
  assert.equal(resolution.status, 'resolved')
  assert.ok(resolution.status === 'resolved')
  assert.deepEqual(resolution.route.provenance, provenance)

  // The shipped registry declares no catalog provenance for its hand-authored
  // mappings: absent stays absent (unknown), never invented (D3/A6 honesty).
  const shipped = resolvePiOpenRouterRoute(
    PI_OPENROUTER_ROUTING,
    'openai/gpt-5.6-luna',
    CHAT_COMPLETIONS,
  )
  assert.ok(shipped.status === 'resolved')
  assert.equal(shipped.route.provenance, undefined)
})
