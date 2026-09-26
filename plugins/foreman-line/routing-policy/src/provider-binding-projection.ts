import type { SchemaObject } from 'ajv'
import { providerBindingPolicyV1Schema } from './provider-binding-schemas.js'
import {
  type ProviderBindingPolicyV1,
  type ProviderBindingValidationErrorV1,
  validateProviderBindingPolicyV1,
} from './provider-bindings.js'

export type ProviderBindingProjectionV1 = Readonly<{
  schemaVersion: 'pmc-provider-binding-projection/v1'
  evidenceOnly: true
  policy: ProviderBindingPolicyV1
}>
export type ProviderBindingProjectionResult =
  | Readonly<{ ok: true; projection: ProviderBindingProjectionV1 }>
  | Readonly<{ ok: false; errors: readonly ProviderBindingValidationErrorV1[] }>

export const providerBindingProjectionV1Schema: SchemaObject = Object.freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://foreman-line.local/schemas/provider-binding-projection-v1.schema.json',
  type: 'object',
  additionalProperties: false,
  required: Object.freeze(['schemaVersion', 'evidenceOnly', 'policy']),
  properties: Object.freeze({
    schemaVersion: Object.freeze({ const: 'pmc-provider-binding-projection/v1' }),
    evidenceOnly: Object.freeze({ const: true }),
    // The embedded schema retains its own $id and local definition references.
    policy: providerBindingPolicyV1Schema,
  }),
})

/** Lossless structural evidence only; no live eligibility or execution authority. */
export function projectProviderBindingsV1(input: unknown): ProviderBindingProjectionResult {
  const result = validateProviderBindingPolicyV1(input)
  if (!result.valid) {
    // P1a owns these typed errors; freeze without translating or replacing them.
    for (const error of result.errors) Object.freeze(error)
    return Object.freeze({ ok: false, errors: Object.freeze(result.errors) })
  }
  return Object.freeze({
    ok: true,
    projection: Object.freeze({
      schemaVersion: 'pmc-provider-binding-projection/v1',
      evidenceOnly: true,
      policy: result.value,
    }),
  })
}
