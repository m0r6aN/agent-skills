import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import type { AuthorityEnforcementRegistry } from '../src/types.js'
import { AUTHORITY_EFFECTS, AUTHORITY_TIERS, RULE_CLASSIFICATIONS } from '../src/types.js'
import {
  bindingDigestFor,
  locatorDigestFor,
  normalizeRuleText,
  validateRegistry,
} from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const valid = parse(
  readFileSync(join(packageRoot, 'tests', 'fixtures', 'pass-minimal.yaml'), 'utf8'),
) as AuthorityEnforcementRegistry

function codes(document: unknown): string[] {
  return validateRegistry(document).violations.map((violation) => violation.code)
}

test('normalization is exact and stable across Unicode/line-ending/whitespace forms', () => {
  assert.equal(normalizeRuleText('  Cafe\u0301\r\n\r\n  one\t two  '), 'Café one two')
})

test('canonical digest helpers bind identity, location, and value independently', () => {
  const item = valid.sources[0]?.inventoryItems[0]
  const rule = valid.rules[0]
  assert.ok(item)
  assert.ok(rule)
  const source = valid.sources.find(
    (candidate) => candidate.sourceId === rule.sourceRefs[0]?.sourceId,
  )
  const referencedItem = source?.inventoryItems.find(
    (candidate) => candidate.itemId === rule.sourceRefs[0]?.itemId,
  )
  assert.ok(referencedItem)
  assert.equal(locatorDigestFor(referencedItem.locator), rule.sourceRefs[0]?.locatorDigest)
  assert.equal(bindingDigestFor(rule), rule.bindingDigest)
})

test('each of the six classifications is accepted and summarized independently', () => {
  const result = validateRegistry(valid)
  assert.equal(result.valid, true)
  assert.deepEqual(result.summary?.classificationCounts, {
    'pre-action-refusal': 1,
    'post-action-detection': 1,
    'ci-static-check': 1,
    'independent-review-human-judgment': 1,
    'narrative-provenance': 1,
    unsupported: 1,
  })
})

test('pre-action refusal requires a stable refusal code', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'pre-action-refusal')
  assert.ok(rule)
  ;(rule as { refusalCode: string | null }).refusalCode = null
  assert.ok(
    codes(mutated).includes('SCHEMA_INVALID') ||
      codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'),
  )
})

test('retirement requires four correctly typed evidence references', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules[0]
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  assert.ok(codes(mutated).includes('RETIREMENT_EVIDENCE_INCOMPLETE'))
})

test('every protected operation rejects agent/control/tool authority escalation', () => {
  for (const operationId of [
    'gate1.ratify',
    'gate3.merge',
    'verification.issue',
    'closure.record',
    'receipt.mint-generic',
  ]) {
    const mutated = structuredClone(valid)
    const row = mutated.operationAuthority.find(
      (candidate) => candidate.operationId === operationId,
    )
    assert.ok(row)
    ;(row as { agentCallable: boolean }).agentCallable = true
    ;(row as { operationalStateMaySatisfy: boolean }).operationalStateMaySatisfy = true
    ;(row as { toolMayIssueAuthorityEvidence: boolean }).toolMayIssueAuthorityEvidence = true
    assert.ok(codes(mutated).includes('AUTHORITY_ESCALATION'), operationId)
  }
})

test('Gate 2 state may record consumption but cannot mint authority', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  assert.ok(row)
  ;(row as { operationalStateMaySatisfy: boolean }).operationalStateMaySatisfy = true
  assert.ok(codes(mutated).includes('AUTHORITY_ESCALATION'))
})

test('all six required reconciliation topics are mandatory', () => {
  for (let index = 0; index < valid.reconciliations.length; index += 1) {
    const mutated = structuredClone(valid)
    ;(mutated.reconciliations as AuthorityEnforcementRegistry['reconciliations'][number][]).splice(
      index,
      1,
    )
    assert.ok(codes(mutated).includes('RECONCILIATION_MISSING'))
  }
})

for (const classification of RULE_CLASSIFICATIONS) {
  test(`classification mutation control: ${classification} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    const rule = mutated.rules.find((candidate) => candidate.classification === classification)
    assert.ok(rule)
    ;(rule as { classification: string }).classification = `${classification}-widened`
    assert.ok(codes(mutated).includes('SCHEMA_INVALID'))
  })
}

for (const authorityTier of AUTHORITY_TIERS) {
  test(`authority-tier mutation control: ${authorityTier} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    ;(mutated.sources[0] as { authorityTier: string }).authorityTier = `${authorityTier}-widened`
    assert.ok(codes(mutated).includes('SCHEMA_INVALID'))
  })
}

for (const authorityEffect of AUTHORITY_EFFECTS) {
  test(`authority-effect mutation control: ${authorityEffect} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    ;(mutated.sources[0] as { authorityEffect: string }).authorityEffect =
      `${authorityEffect}-widened`
    assert.ok(codes(mutated).includes('SCHEMA_INVALID'))
  })
}

const evidence = {
  predicate: {
    kind: 'predicate-contract' as const,
    path: 'plugins/foreman-line/authority-registry/README.md',
    digest: '0'.repeat(64),
  },
  negativeRefusalTest: {
    kind: 'negative-test' as const,
    path: 'plugins/foreman-line/authority-registry/tests/semantic-invariants.test.ts',
    digest: '1'.repeat(64),
  },
  corpusSweep: {
    kind: 'corpus-sweep' as const,
    path: 'plugins/foreman-line/authority-registry/tests/corpus-sweep.test.ts',
    digest: '2'.repeat(64),
  },
  independentBypassAttempt: {
    kind: 'independent-bypass' as const,
    path: 'plugins/foreman-line/authority-registry/tests/semantic-invariants.test.ts',
    digest: '3'.repeat(64),
  },
}

for (const field of [
  'predicate',
  'negativeRefusalTest',
  'corpusSweep',
  'independentBypassAttempt',
] as const) {
  test(`retirement mutation control: missing ${field} evidence refuses retirement`, () => {
    const mutated = structuredClone(valid)
    const rule = mutated.rules[0]
    assert.ok(rule)
    ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
    ;(rule as { retirementEvidence: typeof evidence }).retirementEvidence =
      structuredClone(evidence)
    ;(rule.retirementEvidence as unknown as Record<string, unknown>)[field] = null
    assert.ok(codes(mutated).includes('RETIREMENT_EVIDENCE_INCOMPLETE'))
  })
}

for (const migrationStatus of ['open', 'resolved-for-fk', 'blocked'] as const) {
  test(`migration mutation control: ${migrationStatus} cannot carry superseding evidence`, () => {
    const mutated = structuredClone(valid)
    const record = mutated.reconciliations[0]
    const sourceRef = mutated.rules[0]?.sourceRefs[0]
    assert.ok(record)
    assert.ok(sourceRef)
    ;(record as { migrationStatus: string }).migrationStatus = migrationStatus
    ;(record as { supersedingEvidence: typeof sourceRef | null }).supersedingEvidence = sourceRef
    assert.ok(codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'))
  })
}

test('migration mutation control: superseded-by-amendment requires superseding evidence', () => {
  const mutated = structuredClone(valid)
  const record = mutated.reconciliations[0]
  assert.ok(record)
  ;(record as { migrationStatus: string }).migrationStatus = 'superseded-by-amendment'
  ;(record as { supersedingEvidence: null }).supersedingEvidence = null
  assert.ok(codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'))
})

test('uncovered inventory items and orphaned rule mappings fail closed independently', () => {
  const uncovered = structuredClone(valid)
  const uncoveredItem = uncovered.sources[0]?.inventoryItems[0]
  assert.ok(uncoveredItem)
  ;(uncoveredItem.ruleIds as string[]).splice(0)
  assert.ok(codes(uncovered).includes('SOURCE_ITEM_UNCOVERED'))

  const orphan = structuredClone(valid)
  const orphanItem = orphan.sources[0]?.inventoryItems[0]
  assert.ok(orphanItem)
  ;(orphanItem.ruleIds as string[])[0] = 'rule.does-not-exist'
  assert.ok(codes(orphan).includes('RULE_ORPHANED'))
})

test('source snapshot and caller-asserted authority mutations fail closed', () => {
  const staleSnapshot = structuredClone(valid)
  ;(staleSnapshot.sources[0]?.snapshotEvidence as { commit: string }).commit = '0'.repeat(40)
  assert.ok(codes(staleSnapshot).includes('MIGRATION_EVIDENCE_INVALID'))

  const selfAsserted = structuredClone(valid) as AuthorityEnforcementRegistry & {
    callerPrincipal?: string
  }
  selfAsserted.callerPrincipal = 'human-developer'
  assert.ok(codes(selfAsserted).includes('SCHEMA_INVALID'))
})

test('set-valued arrays and protected operation rows require schema-enum order', () => {
  const principals = structuredClone(valid)
  const gate2 = principals.operationAuthority.find(
    (operation) => operation.operationId === 'gate2.dispatch',
  )
  assert.ok(gate2)
  ;(gate2.allowedPrincipals as string[]).reverse()
  assert.ok(codes(principals).includes('MIGRATION_EVIDENCE_INVALID'))

  const rows = structuredClone(valid)
  ;(
    rows.operationAuthority as AuthorityEnforcementRegistry['operationAuthority'][number][]
  ).reverse()
  assert.ok(codes(rows).includes('MIGRATION_EVIDENCE_INVALID'))
})
