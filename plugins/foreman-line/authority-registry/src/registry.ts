import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'

export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'authority-enforcement-registry', schema: authorityEnforcementRegistrySchema },
]
