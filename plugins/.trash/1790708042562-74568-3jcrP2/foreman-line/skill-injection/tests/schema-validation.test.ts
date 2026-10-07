/**
 * AC5: the shipped `skill-injection.yaml` validates against
 * `skill-injection-matrix.schema.json` with zero errors, and retains the
 * baseline mappings plus the contracts/* adversarial reviewer skills.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { validateSkillInjectionMatrix } from '../src/validate.js'

const matrixPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'skill-injection.yaml')

test('shipped skill-injection.yaml validates with zero errors', () => {
  const doc = parse(readFileSync(matrixPath, 'utf8'))
  const result = validateSkillInjectionMatrix(doc)
  assert.deepEqual(result.errors, [])
  assert.equal(result.valid, true)
})

test('shipped skill-injection.yaml retains baseline mappings and contracts reviewer skills', () => {
  const doc = parse(readFileSync(matrixPath, 'utf8'))
  assert.deepEqual(doc, {
    builder: {
      '*': ['test-coverage'],
      'ui/*': ['kds-figma'],
    },
    verifier_harness: {
      '*': ['test-coverage.check'],
      'ui/*': ['kds-sweep'],
      'tenancy/*': ['tenant-isolation'],
    },
    adversarial_reviewer: {
      '*': ['code-review'],
      'contracts/*': ['code-review', 'ai-council'],
    },
    coordinator: {
      rework_first: ['build-fix-loop'],
    },
    integration: {
      jira: ['jira-workflow'],
    },
  })
})
