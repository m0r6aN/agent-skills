/**
 * Central registry of every frozen contract in this package: its stable
 * schema name and its typed JSON Schema (authored as an ajv `SchemaObject`).
 * `generate.ts` serializes these to `schemas/*.json`; the parity test proves
 * the committed files never drift from these typed sources.
 */

import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { dataClassificationEligibilitySchema } from './data-classification.js'
import {
  modelFamilyDiversityRuleSchema,
  riskClassSchema,
  roleAuthoritySchema,
  roleCategorySchema,
  roleIdentitySchema,
} from './roles.js'
import { serializationPointOwnershipSchema } from './serialization-points.js'
import { versionBumpRecordSchema } from './versioning.js'

export type { SchemaFile }

/** The eight enforceable concepts named by AC1/AC2 -- one schema file each. */
export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'role-identity', schema: roleIdentitySchema },
  { name: 'risk-class', schema: riskClassSchema },
  { name: 'role-category', schema: roleCategorySchema },
  { name: 'family-diversity', schema: modelFamilyDiversityRuleSchema },
  { name: 'authority-flag', schema: roleAuthoritySchema },
  { name: 'serialization-point-ownership', schema: serializationPointOwnershipSchema },
  { name: 'data-classification-eligibility', schema: dataClassificationEligibilitySchema },
  { name: 'version-bump-record', schema: versionBumpRecordSchema },
]
