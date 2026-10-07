import type { SchemaObject } from 'ajv'
import { Ajv } from 'ajv'

/**
 * Pi's OpenRouter execution-plane model registry. This is intentionally
 * separate from the provider-neutral worker envelopes: the envelope carries
 * an opaque registry key, while this adapter describes what a host may use
 * that key for.
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

export interface PiOpenRouterModel {
  readonly capabilities: readonly PiOpenRouterCapability[]
  readonly allowedLanes: readonly PiOpenRouterLane[]
  readonly prohibitedLanes: readonly PiOpenRouterLane[]
  readonly authority: PiOpenRouterAuthority
}

export interface PiOpenRouterRouting {
  readonly $schema?: string
  readonly provider: 'openrouter'
  readonly baseUrl: 'https://openrouter.ai/api/v1'
  readonly enabledModels: readonly string[]
  readonly models: Readonly<Record<string, PiOpenRouterModel>>
}

export const PI_OPENROUTER_ENABLED_MODELS = [
  'anthropic/claude-sonnet-5',
  'google/gemini-3.8-flash',
  'openai/gpt-5.6-terra',
  'typesafe/jev-1.13',
] as const

export const PI_OPENROUTER_ROUTING: PiOpenRouterRouting = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  enabledModels: [...PI_OPENROUTER_ENABLED_MODELS],
  models: {
    'anthropic/claude-sonnet-5': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
    },
    'google/gemini-3.8-flash': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
    },
    'openai/gpt-5.6-terra': {
      capabilities: ['prose-generation', 'implementation'],
      allowedLanes: ['builder', 'prose-generation', 'implementation'],
      prohibitedLanes: ['approval', 'merge', 'policy-bypass'],
      authority: 'execution',
    },
    // Jev is a TypeSafe System One structured-decision model. It may propose
    // a routing/classification lane, but it is never a prose or implementation
    // worker and never owns a control-plane decision.
    'typesafe/jev-1.13': {
      capabilities: ['routing', 'classification', 'structured-decision'],
      allowedLanes: ['routing', 'classification'],
      prohibitedLanes: ['prose-generation', 'implementation', 'approval', 'merge', 'policy-bypass'],
      authority: 'recommend-only',
    },
  },
}

/** Hand-authored schema; committed JSON is checked against this source. */
export const piOpenRouterModelSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['capabilities', 'allowedLanes', 'prohibitedLanes', 'authority'],
  properties: {
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
      items: { type: 'string', pattern: '^[a-z0-9-]+/[a-z0-9.-]+$' },
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
