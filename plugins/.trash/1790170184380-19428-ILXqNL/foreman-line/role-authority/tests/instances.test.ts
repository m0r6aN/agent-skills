/**
 * AC1b (coordinator amendment, adversarial review B finding F3): D20/D21/D33
 * ship real instance records, not just empty shapes. This test:
 *  - proves the committed `instances/*.json` never drift from `src/instances.ts`
 *    (same discipline as the schema no-drift tests, applied to instance data);
 *  - proves each instance validates against its own declared schema;
 *  - mechanically pins the D20 values so a future edit that quietly grants
 *    self-promote/self-approve to any role, or close-critical to a role other
 *    than the Judge, goes red instead of drifting silently.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import { serialize } from '../src/generate-instances.js'
import {
  familyDiversityRules,
  roleAuthorityByRole,
  selfSerializationPointOwnership,
} from '../src/instances.js'
import { modelFamilyDiversityRuleSchema, ROLE_IDS, roleAuthoritySchema } from '../src/roles.js'
import { serializationPointOwnershipSchema } from '../src/serialization-points.js'

const instancesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'instances')
const ajv = new Ajv({ allErrors: true })

function readCommitted(name: string): string {
  return readFileSync(join(instancesDir, `${name}.json`), 'utf8')
}

test('no drift: role-authority-by-role.json matches src/instances.ts', () => {
  assert.equal(readCommitted('role-authority-by-role'), serialize(roleAuthorityByRole))
})

test('no drift: family-diversity-rules.json matches src/instances.ts', () => {
  assert.equal(readCommitted('family-diversity-rules'), serialize(familyDiversityRules))
})

test('no drift: serialization-point-ownership.json matches src/instances.ts', () => {
  assert.equal(
    readCommitted('serialization-point-ownership'),
    serialize(selfSerializationPointOwnership),
  )
})

test('D20: every role authority instance validates against roleAuthoritySchema', () => {
  const validate = ajv.compile(roleAuthoritySchema as SchemaObject)
  for (const role of ROLE_IDS) {
    const instance = roleAuthorityByRole[role]
    assert.ok(validate(instance), JSON.stringify(validate.errors))
  }
})

test('D20: only the Judge may close critical work; no role may self-promote or self-approve', () => {
  for (const role of ROLE_IDS) {
    const instance = roleAuthorityByRole[role]
    assert.equal(instance.canSelfPromote, false, `${role} must not be able to self-promote`)
    assert.equal(instance.canSelfApprove, false, `${role} must not be able to self-approve`)
    assert.equal(
      instance.canCloseCriticalWork,
      role === 'judge',
      `${role}.canCloseCriticalWork must be true only for 'judge'`,
    )
  }
})

test('D21: elevated (R2) and critical (R3) both require >= 2 distinct model families', () => {
  const validate = ajv.compile(modelFamilyDiversityRuleSchema as SchemaObject)
  assert.equal(familyDiversityRules.length, 2)
  for (const rule of familyDiversityRules) {
    assert.ok(validate(rule), JSON.stringify(validate.errors))
    assert.ok(['R2', 'R3'].includes(rule.riskClass))
    assert.ok(rule.minDistinctModelFamilies >= 2)
  }
})

test('D33: self-declaration instance validates and names this package as sole owner', () => {
  const validate = ajv.compile(serializationPointOwnershipSchema as SchemaObject)
  assert.ok(validate(selfSerializationPointOwnership), JSON.stringify(validate.errors))
  assert.equal(selfSerializationPointOwnership.owner, 'WF-P1')
  assert.equal(selfSerializationPointOwnership.extensionPolicy, 'sole')
  assert.equal(selfSerializationPointOwnership.path, 'plugins/foreman-line/role-authority/**')
})
