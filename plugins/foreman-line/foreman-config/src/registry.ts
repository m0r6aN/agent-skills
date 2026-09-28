/**
 * Central registry of every exported foreman-config schema. `generate.ts`
 * serializes these to `schemas/*.json`; the parity test proves the committed
 * files never drift from these typed sources.
 */
import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import {
  foremanCapabilitiesSchema,
  foremanConfigSchema,
  foremanIdentitySchema,
  foremanPolicySchema,
  foremanStackSchema,
  stackLayoutSchema,
} from './schemas.js'

export type { SchemaFile }

export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'foreman-config', schema: foremanConfigSchema },
  { name: 'foreman-identity', schema: foremanIdentitySchema },
  { name: 'foreman-stack', schema: foremanStackSchema },
  { name: 'stack-layout', schema: stackLayoutSchema },
  { name: 'foreman-capabilities', schema: foremanCapabilitiesSchema },
  { name: 'foreman-policy', schema: foremanPolicySchema },
]
