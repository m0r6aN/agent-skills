import type { SchemaObject } from 'ajv'
import { Ajv } from 'ajv'
import { declaredEvidence } from './schemas.js'
import type { AdapterRefusalName, DeclaredEvidence } from './types.js'

/**
 * Pi's OpenRouter execution-plane model registry. This is intentionally
 * separate from the provider-neutral worker envelopes: the envelope carries
 * an opaque registry key, while this adapter describes what a host may use
 * that key for.
 *
 * HRO-P1 (HRO charter D2) extends this contract with the explicit separation
 * of model identity, provider-local model ID, API protocol, and the Pi host's
 * model identifier, plus catalog provenance/freshness (D3) and typed
 * unavailable/unsupported resolution (`resolvePiOpenRouterRoute`). The fields
 * are additive and optional, so a pre-HRO document remains valid and every
 * shipped mapping keeps its existing OpenRouter behavior (charter D2:
 * additive migration, no behavior change).
 */
export type PiOpenRouterCapability =
  | 'routing'
  | 'classification'
  | 'structured-decision'
  | 'prose-generation'
  | 'implementation'

export type PiOpenRouterLane =
  | 'routing'
  | 'classification'
  | 'builder'
  | 'prose-generation'
  | 'implementation'
  | 'approval'
  | 'merge'
  | 'policy-bypass'

export type PiOpenRouterAuthority = 'recommend-only' | 'execution'

/**
 * HRO-P1 (D2/D3): the closed API-protocol vocabulary of this adapter. The two
 * names describe protocol families actually observed in canon — the OpenRouter
 * execution plane's OpenAI-compatible chat-completions API (`baseUrl`
 * `/api/v1`), and Zen's structured-decision protocol
 * (`https://opencode.ai/zen/v1/systemone` with `state` and typed `questions`,
 * "do not parse it as a chat completion", HRO charter D3). Closed set, never
 * free text (RCM-P2/P3 vocabulary mechanism); the schema `enum` and the
 * resolver derive from this one const.
 */
export const PI_OPENROUTER_PROTOCOLS = ['openai-chat-completions', 'zen-systemone'] as const

export type PiOpenRouterProtocol = (typeof PI_OPENROUTER_PROTOCOLS)[number]

/**
 * HRO-P1 (D3): the catalog provenance payload of one mapping claim — fetch
 * time, validity (freshness bound), and content hash. The named source lives
 * on the `DeclaredEvidence` envelope (RCM-P2/P3 Evidence mechanism, reused
 * here). Absent = unknown, never assumed current (the `inputs?:` precedent in
 * `types.ts`); P1 enforces no freshness policy — see the HRO-P1 record.
 */
export interface PiOpenRouterProvenance {
  /** D3 "fetch time" — ISO 8601 acquisition timestamp. */
  readonly fetched_at: string
  /** D3 "validity" — ISO 8601 freshness bound of the catalog content. */
  readonly valid_until: string
  /** D3 "content hash" — SHA-256 hex of the catalog content this mapping derives from. */
  readonly content_hash: string
}

export interface PiOpenRouterModel {
  readonly opencodeId?: string
  readonly capabilities: readonly PiOpenRouterCapability[]
  readonly allowedLanes: readonly PiOpenRouterLane[]
  readonly prohibitedLanes: readonly PiOpenRouterLane[]
  readonly authority: PiOpenRouterAuthority
  /**
   * HRO-P1 (D2): the provider-local model ID the provider request body sends —
   * a distinct value from the registry key (identity) and `opencodeId` (the Pi
   * host's model identifier). Absent = no explicit mapping value; resolution
   * refuses instead of deriving one (no identity fallback).
   */
  readonly providerLocalId?: string
  /**
   * HRO-P1 (D2): the API protocol this mapping speaks. Absent = no explicit
   * mapping value; resolution refuses instead of assuming a protocol.
   */
  readonly protocol?: PiOpenRouterProtocol
  /** HRO-P1 (D3): declared catalog provenance; absent = unknown. */
  readonly provenance?: DeclaredEvidence<PiOpenRouterProvenance>
}

export interface PiOpenRouterRouting {
  readonly $schema?: string
  readonly provider: 'openrouter'
  readonly baseUrl: 'https://openrouter.ai/api/v1'
  readonly enabledModels: readonly string[]
  readonly models: Readonly<Record<string, PiOpenRouterModel>>
}

export const PI_OPENROUTER_ENABLED_MODELS = [
  'anthropic/claude-fable-5',
  'anthropic/claude-fable-5.1',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-opus-4.5',
  'anthropic/claude-opus-4.6',
  'anthropic/claude-opus-4.7',
  'anthropic/claude-opus-4.8',
  'anthropic/claude-opus-5',
  'anthropic/claude-opus-5.5',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-sonnet-4.5',
  'anthropic/claude-sonnet-4.6',
  'anthropic/claude-sonnet-5',
  'deepseek/deepseek-v4-flash',
  'deepseek/deepseek-v4-flash-vision-exp',
  'deepseek/deepseek-v4-pro',
  'deepseek/deepseek-v4.1-flash',
  'google/gemini-3.5-flash',
  'google/gemini-3.5-flash-lite',
  'google/gemini-3.6-flash',
  'google/gemini-3.7-flash',
  'google/gemini-3.8-flash',
  'inclusionai/ling-3.0-flash-fin:free',
  'meta/muse-spark-1.2',
  'meta/muse-spark-1.3',
  'minimax/minimax-m2.5',
  'minimax/minimax-m2.7',
  'minimax/minimax-m3',
  'moonshotai/kimi-k2.5',
  'moonshotai/kimi-k2.6',
  'moonshotai/kimi-k2.7-code',
  'moonshotai/kimi-k3',
  'nvidia/nemotron-3.5-lightning:free',
  'openai/gpt-5',
  'openai/gpt-5-nano',
  'openai/gpt-5.1',
  'openai/gpt-5.1-codex',
  'openai/gpt-5.1-codex-max',
  'openai/gpt-5.1-codex-mini',
  'openai/gpt-5.2',
  'openai/gpt-5.2-codex',
  'openai/gpt-5.3-codex',
  'openai/gpt-5.4',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4-nano',
  'openai/gpt-5.4-pro',
  'openai/gpt-5.5',
  'openai/gpt-5.5-pro',
  'openai/gpt-5.6-luna',
  'openai/gpt-5.6-sol',
  'openai/gpt-5.6-terra',
  'openai/gpt-6-astra',
  'openai/gpt-6-luna',
  'openai/gpt-6-sol',
  'qwen/qwen3.6-plus',
  'qwen/qwen3.8-flash',
  'x-ai/grok-4.5',
  'x-ai/grok-4.6',
  'x-ai/grok-4.7',
  'x-ai/grok-build-0.1',
  'z-ai/glm-5',
  'z-ai/glm-5.1',
  'z-ai/glm-5.2',
  'z-ai/glm-5.3',
  'z-ai/glm-5.3-flash',
] as const

export const PI_OPENROUTER_ROUTING: PiOpenRouterRouting = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  enabledModels: [
    'anthropic/claude-fable-5',
    'anthropic/claude-fable-5.1',
    'anthropic/claude-haiku-4.5',
    'anthropic/claude-opus-4.5',
    'anthropic/claude-opus-4.6',
    'anthropic/claude-opus-4.7',
    'anthropic/claude-opus-4.8',
    'anthropic/claude-opus-5',
    'anthropic/claude-opus-5.5',
    'anthropic/claude-sonnet-4',
    'anthropic/claude-sonnet-4.5',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-sonnet-5',
    'deepseek/deepseek-v4-flash',
    'deepseek/deepseek-v4-flash-vision-exp',
    'deepseek/deepseek-v4-pro',
    'deepseek/deepseek-v4.1-flash',
    'google/gemini-3.5-flash',
    'google/gemini-3.5-flash-lite',
    'google/gemini-3.6-flash',
    'google/gemini-3.7-flash',
    'google/gemini-3.8-flash',
    'inclusionai/ling-3.0-flash-fin:free',
    'meta/muse-spark-1.2',
    'meta/muse-spark-1.3',
    'minimax/minimax-m2.5',
    'minimax/minimax-m2.7',
    'minimax/minimax-m3',
    'moonshotai/kimi-k2.5',
    'moonshotai/kimi-k2.6',
    'moonshotai/kimi-k2.7-code',
    'moonshotai/kimi-k3',
    'nvidia/nemotron-3.5-lightning:free',
    'openai/gpt-5',
    'openai/gpt-5-nano',
    'openai/gpt-5.1',
    'openai/gpt-5.1-codex',
    'openai/gpt-5.1-codex-max',
    'openai/gpt-5.1-codex-mini',
    'openai/gpt-5.2',
    'openai/gpt-5.2-codex',
    'openai/gpt-5.3-codex',
    'openai/gpt-5.4',
    'openai/gpt-5.4-mini',
    'openai/gpt-5.4-nano',
    'openai/gpt-5.4-pro',
    'openai/gpt-5.5',
    'openai/gpt-5.5-pro',
    'openai/gpt-5.6-luna',
    'openai/gpt-5.6-sol',
    'openai/gpt-5.6-terra',
    'openai/gpt-6-astra',
    'openai/gpt-6-luna',
    'openai/gpt-6-sol',
    'qwen/qwen3.6-plus',
    'qwen/qwen3.8-flash',
    'x-ai/grok-4.5',
    'x-ai/grok-4.6',
    'x-ai/grok-4.7',
    'x-ai/grok-build-0.1',
    'z-ai/glm-5',
    'z-ai/glm-5.1',
    'z-ai/glm-5.2',
    'z-ai/glm-5.3',
    'z-ai/glm-5.3-flash',
  ],
  models: {
    'anthropic/claude-fable-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-fable-5',
      providerLocalId: 'anthropic/claude-fable-5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-fable-5.1': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-fable-5-1',
      providerLocalId: 'anthropic/claude-fable-5.1',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-haiku-4.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-haiku-4-5',
      providerLocalId: 'anthropic/claude-haiku-4.5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-4.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-4-5',
      providerLocalId: 'anthropic/claude-opus-4.5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-4.6': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-4-6',
      providerLocalId: 'anthropic/claude-opus-4.6',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-4.7': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-4-7',
      providerLocalId: 'anthropic/claude-opus-4.7',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-4.8': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-4-8',
      providerLocalId: 'anthropic/claude-opus-4.8',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-5',
      providerLocalId: 'anthropic/claude-opus-5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-opus-5.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-opus-5-5',
      providerLocalId: 'anthropic/claude-opus-5.5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-sonnet-4': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-sonnet-4',
      providerLocalId: 'anthropic/claude-sonnet-4',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-sonnet-4.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-sonnet-4-5',
      providerLocalId: 'anthropic/claude-sonnet-4.5',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-sonnet-4.6': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-sonnet-4-6',
      providerLocalId: 'anthropic/claude-sonnet-4.6',
      protocol: 'openai-chat-completions',
    },
    'anthropic/claude-sonnet-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'claude-sonnet-5',
      providerLocalId: 'anthropic/claude-sonnet-5',
      protocol: 'openai-chat-completions',
    },
    'deepseek/deepseek-v4-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'deepseek-v4-flash',
      providerLocalId: 'deepseek/deepseek-v4-flash',
      protocol: 'openai-chat-completions',
    },
    'deepseek/deepseek-v4-flash-vision-exp': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'deepseek-v4-flash-vision-exp',
      providerLocalId: 'deepseek/deepseek-v4-flash-vision-exp',
      protocol: 'openai-chat-completions',
    },
    'deepseek/deepseek-v4-pro': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'deepseek-v4-pro',
      providerLocalId: 'deepseek/deepseek-v4-pro',
      protocol: 'openai-chat-completions',
    },
    'deepseek/deepseek-v4.1-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'deepseek-v4.1-flash',
      providerLocalId: 'deepseek/deepseek-v4.1-flash',
      protocol: 'openai-chat-completions',
    },
    'google/gemini-3.5-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gemini-3.5-flash',
      providerLocalId: 'google/gemini-3.5-flash',
      protocol: 'openai-chat-completions',
    },
    'google/gemini-3.5-flash-lite': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gemini-3.5-flash-lite',
      providerLocalId: 'google/gemini-3.5-flash-lite',
      protocol: 'openai-chat-completions',
    },
    'google/gemini-3.6-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gemini-3.6-flash',
      providerLocalId: 'google/gemini-3.6-flash',
      protocol: 'openai-chat-completions',
    },
    'google/gemini-3.7-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gemini-3.7-flash',
      providerLocalId: 'google/gemini-3.7-flash',
      protocol: 'openai-chat-completions',
    },
    'google/gemini-3.8-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gemini-3.8-flash',
      providerLocalId: 'google/gemini-3.8-flash',
      protocol: 'openai-chat-completions',
    },
    'inclusionai/ling-3.0-flash-fin:free': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'ling-3.0-flash-fin-free',
      providerLocalId: 'inclusionai/ling-3.0-flash-fin:free',
      protocol: 'openai-chat-completions',
    },
    'meta/muse-spark-1.2': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'muse-spark-1.2',
      providerLocalId: 'meta/muse-spark-1.2',
      protocol: 'openai-chat-completions',
    },
    'meta/muse-spark-1.3': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'muse-spark-1.3',
      providerLocalId: 'meta/muse-spark-1.3',
      protocol: 'openai-chat-completions',
    },
    'minimax/minimax-m2.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'minimax-m2.5',
      providerLocalId: 'minimax/minimax-m2.5',
      protocol: 'openai-chat-completions',
    },
    'minimax/minimax-m2.7': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'minimax-m2.7',
      providerLocalId: 'minimax/minimax-m2.7',
      protocol: 'openai-chat-completions',
    },
    'minimax/minimax-m3': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'minimax-m3',
      providerLocalId: 'minimax/minimax-m3',
      protocol: 'openai-chat-completions',
    },
    'moonshotai/kimi-k2.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'kimi-k2.5',
      providerLocalId: 'moonshotai/kimi-k2.5',
      protocol: 'openai-chat-completions',
    },
    'moonshotai/kimi-k2.6': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'kimi-k2.6',
      providerLocalId: 'moonshotai/kimi-k2.6',
      protocol: 'openai-chat-completions',
    },
    'moonshotai/kimi-k2.7-code': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'kimi-k2.7-code',
      providerLocalId: 'moonshotai/kimi-k2.7-code',
      protocol: 'openai-chat-completions',
    },
    'moonshotai/kimi-k3': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'kimi-k3',
      providerLocalId: 'moonshotai/kimi-k3',
      protocol: 'openai-chat-completions',
    },
    'nvidia/nemotron-3.5-lightning:free': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'nemotron-3.5-lightning-free',
      providerLocalId: 'nvidia/nemotron-3.5-lightning:free',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5',
      providerLocalId: 'openai/gpt-5',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5-nano': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5-nano',
      providerLocalId: 'openai/gpt-5-nano',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.1': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.1',
      providerLocalId: 'openai/gpt-5.1',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.1-codex': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.1-codex',
      providerLocalId: 'openai/gpt-5.1-codex',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.1-codex-max': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.1-codex-max',
      providerLocalId: 'openai/gpt-5.1-codex-max',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.1-codex-mini': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.1-codex-mini',
      providerLocalId: 'openai/gpt-5.1-codex-mini',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.2': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.2',
      providerLocalId: 'openai/gpt-5.2',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.2-codex': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.2-codex',
      providerLocalId: 'openai/gpt-5.2-codex',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.3-codex': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.3-codex',
      providerLocalId: 'openai/gpt-5.3-codex',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.4': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.4',
      providerLocalId: 'openai/gpt-5.4',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.4-mini': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.4-mini',
      providerLocalId: 'openai/gpt-5.4-mini',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.4-nano': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.4-nano',
      providerLocalId: 'openai/gpt-5.4-nano',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.4-pro': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.4-pro',
      providerLocalId: 'openai/gpt-5.4-pro',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.5',
      providerLocalId: 'openai/gpt-5.5',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.5-pro': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.5-pro',
      providerLocalId: 'openai/gpt-5.5-pro',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.6-luna': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.6-luna',
      providerLocalId: 'openai/gpt-5.6-luna',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.6-sol': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.6-sol',
      providerLocalId: 'openai/gpt-5.6-sol',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-5.6-terra': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-5.6-terra',
      providerLocalId: 'openai/gpt-5.6-terra',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-6-astra': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-6-astra',
      providerLocalId: 'openai/gpt-6-astra',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-6-luna': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-6-luna',
      providerLocalId: 'openai/gpt-6-luna',
      protocol: 'openai-chat-completions',
    },
    'openai/gpt-6-sol': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'gpt-6-sol',
      providerLocalId: 'openai/gpt-6-sol',
      protocol: 'openai-chat-completions',
    },
    'qwen/qwen3.6-plus': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'qwen3.6-plus',
      providerLocalId: 'qwen/qwen3.6-plus',
      protocol: 'openai-chat-completions',
    },
    'qwen/qwen3.8-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'qwen3.8-flash',
      providerLocalId: 'qwen/qwen3.8-flash',
      protocol: 'openai-chat-completions',
    },
    'x-ai/grok-4.5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'grok-4.5',
      providerLocalId: 'x-ai/grok-4.5',
      protocol: 'openai-chat-completions',
    },
    'x-ai/grok-4.6': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'grok-4.6',
      providerLocalId: 'x-ai/grok-4.6',
      protocol: 'openai-chat-completions',
    },
    'x-ai/grok-4.7': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'grok-4.7',
      providerLocalId: 'x-ai/grok-4.7',
      protocol: 'openai-chat-completions',
    },
    'x-ai/grok-build-0.1': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'grok-build-0.1',
      providerLocalId: 'x-ai/grok-build-0.1',
      protocol: 'openai-chat-completions',
    },
    'z-ai/glm-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'glm-5',
      providerLocalId: 'z-ai/glm-5',
      protocol: 'openai-chat-completions',
    },
    'z-ai/glm-5.1': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'glm-5.1',
      providerLocalId: 'z-ai/glm-5.1',
      protocol: 'openai-chat-completions',
    },
    'z-ai/glm-5.2': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'glm-5.2',
      providerLocalId: 'z-ai/glm-5.2',
      protocol: 'openai-chat-completions',
    },
    'z-ai/glm-5.3': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'glm-5.3',
      providerLocalId: 'z-ai/glm-5.3',
      protocol: 'openai-chat-completions',
    },
    'z-ai/glm-5.3-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
      opencodeId: 'glm-5.3-flash',
      providerLocalId: 'z-ai/glm-5.3-flash',
      protocol: 'openai-chat-completions',
    },
  },
}

/** Hand-authored schema; committed JSON is checked against this source. */
export const piOpenRouterModelSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['capabilities', 'allowedLanes', 'prohibitedLanes', 'authority'],
  properties: {
    opencodeId: { type: 'string', minLength: 1, pattern: '^[a-zA-Z0-9_.:+-]+$' },
    capabilities: {
      type: 'array',
      items: {
        enum: [
          'routing',
          'classification',
          'structured-decision',
          'prose-generation',
          'implementation',
        ],
      },
      minItems: 1,
      uniqueItems: true,
    },
    allowedLanes: {
      type: 'array',
      items: {
        enum: [
          'routing',
          'classification',
          'builder',
          'prose-generation',
          'implementation',
          'approval',
          'merge',
          'policy-bypass',
        ],
      },
      minItems: 1,
      uniqueItems: true,
    },
    prohibitedLanes: {
      type: 'array',
      items: {
        enum: [
          'routing',
          'classification',
          'builder',
          'prose-generation',
          'implementation',
          'approval',
          'merge',
          'policy-bypass',
        ],
      },
      minItems: 1,
      uniqueItems: true,
    },
    authority: { enum: ['recommend-only', 'execution'] },
    providerLocalId: { type: 'string', minLength: 1, pattern: '^[a-zA-Z0-9_.:/+-]+$' },
    protocol: { enum: [...PI_OPENROUTER_PROTOCOLS] },
    provenance: declaredEvidence({
      type: 'object',
      additionalProperties: false,
      required: ['fetched_at', 'valid_until', 'content_hash'],
      properties: {
        fetched_at: { type: 'string', minLength: 1 },
        valid_until: { type: 'string', minLength: 1 },
        content_hash: { type: 'string', pattern: '^[0-9a-f]{64}$' },
      },
    }),
  },
}

export const piOpenRouterRoutingSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['provider', 'baseUrl', 'enabledModels', 'models'],
  properties: {
    $schema: { type: 'string', minLength: 1 },
    provider: { const: 'openrouter' },
    baseUrl: { const: 'https://openrouter.ai/api/v1' },
    enabledModels: {
      type: 'array',
      items: { type: 'string', pattern: '^~?[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.:+-]+$' },
      minItems: 1,
      uniqueItems: true,
    },
    models: {
      type: 'object',
      minProperties: 1,
      additionalProperties: piOpenRouterModelSchema,
    },
  },
}

export interface PiOpenRouterValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

const validateStructure = new Ajv({ allErrors: true }).compile(piOpenRouterRoutingSchema)

/**
 * Validates the cross-field capability boundary that JSON Schema cannot
 * express: every enabled model has a capability entry, and structured-
 * decision models remain recommendation-only and lane-bounded.
 */
export function validatePiOpenRouterRouting(input: unknown): PiOpenRouterValidationResult {
  const errors: string[] = []
  if (!validateStructure(input)) {
    for (const error of validateStructure.errors ?? []) {
      errors.push(`${error.instancePath || '/'} ${error.message ?? 'is invalid'}`)
    }
    return { valid: false, errors }
  }

  const document = input as {
    enabledModels: string[]
    models: Record<
      string,
      {
        capabilities: string[]
        allowedLanes: string[]
        prohibitedLanes: string[]
        authority: string
      }
    >
  }
  const enabled = new Set(document.enabledModels)
  const configured = new Set(Object.keys(document.models))
  for (const model of enabled) {
    if (!configured.has(model))
      errors.push(`enabledModels includes '${model}' without a capability entry`)
  }
  for (const model of configured) {
    if (!enabled.has(model)) errors.push(`models includes '${model}' but it is not enabled`)
  }

  const structuredDecisionLanes = new Set(['routing', 'classification'])
  const forbiddenStructuredLanes = [
    'prose-generation',
    'implementation',
    'approval',
    'merge',
    'policy-bypass',
  ]
  for (const [modelId, entry] of Object.entries(document.models)) {
    if (!entry.capabilities.includes('structured-decision')) continue
    if (entry.authority !== 'recommend-only') {
      errors.push(`models['${modelId}'] structured-decision authority must be 'recommend-only'`)
    }
    if (entry.allowedLanes.some((lane) => !structuredDecisionLanes.has(lane))) {
      errors.push(
        `models['${modelId}'] structured-decision allowedLanes must be routing/classification only`,
      )
    }
    for (const lane of forbiddenStructuredLanes) {
      if (!entry.prohibitedLanes.includes(lane)) {
        errors.push(`models['${modelId}'] structured-decision must prohibit '${lane}'`)
      }
    }
    if (
      entry.capabilities.includes('prose-generation') ||
      entry.capabilities.includes('implementation')
    ) {
      errors.push(
        `models['${modelId}'] structured-decision cannot advertise prose-generation or implementation`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// HRO-P1 (HRO charter D2): explicit identity / provider / protocol / harness
// mapping resolution with typed unavailable/unsupported rejection.
// ---------------------------------------------------------------------------

/**
 * One resolved execution mapping. The four values D2 names are distinct
 * fields and never substitute for each other:
 * `registryKey` (model identity), `providerLocalId` (provider-local model ID),
 * `protocol` (API protocol), and `hostModelId` (the Pi host's model
 * identifier). `provider`/`baseUrl` carry the execution plane.
 */
export interface PiOpenRouterResolvedRoute {
  /** D2 "model identity": the canonical registry key, carried unchanged. */
  readonly registryKey: string
  readonly provider: 'openrouter'
  readonly baseUrl: 'https://openrouter.ai/api/v1'
  /** D2 "API protocol": the protocol this mapping speaks. */
  readonly protocol: PiOpenRouterProtocol
  /** D2 "provider-local model ID": the value the provider request body sends. */
  readonly providerLocalId: string
  /** D2 "the Pi host's model identifier": harness/session model id; `null` when the mapping declares none. */
  readonly hostModelId: string | null
  readonly capabilities: readonly PiOpenRouterCapability[]
  readonly allowedLanes: readonly PiOpenRouterLane[]
  readonly prohibitedLanes: readonly PiOpenRouterLane[]
  readonly authority: PiOpenRouterAuthority
  /** D3 catalog provenance; absent = unknown. */
  readonly provenance?: DeclaredEvidence<PiOpenRouterProvenance>
}

/** A typed rejection: one closed-vocabulary name (`ADAPTER_REFUSALS`) plus detail. */
export interface PiOpenRouterRefusal {
  readonly name: AdapterRefusalName
  readonly detail: string
}

/**
 * The typed unavailable/unsupported result of D2: a missing or incomplete
 * mapping is `unavailable`, an incompatible protocol mapping is `unsupported`,
 * and there is no third outcome — no guessed identity ever appears.
 */
export type PiOpenRouterRouteResolution =
  | { readonly status: 'resolved'; readonly route: PiOpenRouterResolvedRoute }
  | { readonly status: 'unavailable'; readonly refusal: PiOpenRouterRefusal }
  | { readonly status: 'unsupported'; readonly refusal: PiOpenRouterRefusal }

/**
 * Resolves `requestedModelId` through the extended mapping contract, or
 * refuses with a typed unavailable/unsupported result (HRO charter D2, D8
 * step 1).
 *
 * Identity discipline: the requested id is looked up exactly. This function
 * never strips a prefix, never substitutes a version, never falls back to a
 * model family, and never derives one identity value from another — an
 * unknown id or an incomplete mapping is a typed `unavailable` refusal, and a
 * mapping whose declared `protocol` cannot serve `requestedProtocol` is a
 * typed `unsupported` refusal. Expected outcomes, not exceptions.
 */
export function resolvePiOpenRouterRoute(
  routing: PiOpenRouterRouting,
  requestedModelId: string,
  requestedProtocol: PiOpenRouterProtocol,
): PiOpenRouterRouteResolution {
  const entry: PiOpenRouterModel | undefined = Object.hasOwn(routing.models, requestedModelId)
    ? routing.models[requestedModelId]
    : undefined
  if (entry === undefined) {
    return {
      status: 'unavailable',
      refusal: {
        name: 'MAPPING_MISSING_REFUSED',
        detail: `no declared mapping for '${requestedModelId}'; identity is never inferred (no prefix stripping, version substitution, or family fallback)`,
      },
    }
  }

  const providerLocalId = entry.providerLocalId
  const protocol = entry.protocol
  if (providerLocalId === undefined || protocol === undefined) {
    const missing = [
      providerLocalId === undefined ? 'providerLocalId' : null,
      protocol === undefined ? 'protocol' : null,
    ].filter((field): field is string => field !== null)
    return {
      status: 'unavailable',
      refusal: {
        name: 'MAPPING_INCOMPLETE_REFUSED',
        detail: `mapping for '${requestedModelId}' lacks explicit ${missing.join(' and ')}; a value is never derived from the registry key or the host id`,
      },
    }
  }

  if (protocol !== requestedProtocol) {
    return {
      status: 'unsupported',
      refusal: {
        name: 'PROTOCOL_INCOMPATIBLE_REFUSED',
        detail: `mapping for '${requestedModelId}' declares protocol '${protocol}', which cannot serve requested execution protocol '${requestedProtocol}'`,
      },
    }
  }

  return {
    status: 'resolved',
    route: {
      registryKey: requestedModelId,
      provider: routing.provider,
      baseUrl: routing.baseUrl,
      protocol,
      providerLocalId,
      hostModelId: entry.opencodeId ?? null,
      capabilities: entry.capabilities,
      allowedLanes: entry.allowedLanes,
      prohibitedLanes: entry.prohibitedLanes,
      authority: entry.authority,
      provenance: entry.provenance,
    },
  }
}
