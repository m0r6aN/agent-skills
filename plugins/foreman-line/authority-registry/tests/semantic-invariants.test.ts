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
  canonicalJson,
  locatorDigestFor,
  normalizeRuleText,
  sha256,
  validateRegistry,
} from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const valid = parse(
  readFileSync(join(packageRoot, 'tests', 'fixtures', 'pass-minimal.yaml'), 'utf8'),
) as AuthorityEnforcementRegistry
const full = parse(
  readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'), 'utf8'),
) as AuthorityEnforcementRegistry

function codes(document: unknown): string[] {
  return validateRegistry(document).violations.map((violation) => violation.code)
}

function expectCode(document: unknown, code: string): void {
  const observed = codes(document)
  if (!observed.includes(code)) throw new Error(`expected ${code}; observed ${observed.join(',')}`)
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

test('pre-action refusal decision cannot be widened to ALLOW', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'pre-action-refusal')
  assert.ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects post-action-detection assurance widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'post-action-detection',
  )
  assert.ok(rule)
  ;(rule as { assurance: string }).assurance = 'narrative'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects ci-static-check owner widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'ci-static-check')
  assert.ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'coordinator'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects independent-review decision widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'independent-review-human-judgment',
  )
  assert.ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects narrative-provenance owner widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'narrative-provenance',
  )
  assert.ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'kernel-policy'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects unsupported assurance widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'unsupported')
  assert.ok(rule)
  ;(rule as { assurance: string }).assurance = 'mediated'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('loaded permission-profile refusals are owned by the host adapter at mediated assurance', () => {
  const rules = full.rules.filter(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'permission-profiles-validator',
  )
  assert.ok(rules.length > 0)
  for (const rule of rules) {
    assert.equal(rule.classification, 'pre-action-refusal')
    assert.equal(rule.decision, 'REFUSE')
    assert.equal(rule.enforcementOwner, 'host-adapter')
    assert.equal(rule.assurance, 'mediated')
  }
})

test('loaded permission-profile refusal cannot be mislabeled as structural kernel enforcement', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'permission-profiles-validator',
  )
  assert.ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'kernel-policy'
  ;(rule as { assurance: string }).assurance = 'structural'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
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
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('Gate 2 rejects anonymous admission even with Git-shaped evidence', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  assert.ok(row)
  ;(row.allowedPrincipals as string[]).splice(0, row.allowedPrincipals.length, 'anonymous-read')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('protected operation evidence resolves locator and value digests, not only item identity', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  assert.ok(row?.requiredGitEvidence[0])
  ;(row.requiredGitEvidence[0] as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
  ;(row.requiredGitEvidence[0] as { valueDigest: string }).valueDigest = '1'.repeat(64)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('protected operation evidence cannot be replaced by a different fully resolved canon ref', () => {
  const mutated = structuredClone(full)
  const gate2 = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  const substitute = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
    ?.sourceRefs[0]
  assert.ok(gate2)
  assert.ok(substitute)
  ;(gate2.requiredGitEvidence as (typeof substitute)[]).splice(0, 1, structuredClone(substitute))
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('builder cannot issue closure authority', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'closure.record',
  )
  assert.ok(row)
  ;(row.allowedPrincipals as string[]).splice(0, row.allowedPrincipals.length, 'builder')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('generic receipt minting has no admitted principal', () => {
  const row = valid.operationAuthority.find(
    (candidate) => candidate.operationId === 'receipt.mint-generic',
  )
  assert.ok(row)
  assert.deepEqual(row.allowedPrincipals, [])
})

test('external writes have no admitted principal', () => {
  const row = valid.operationAuthority.find(
    (candidate) => candidate.operationId === 'external.write',
  )
  assert.ok(row)
  assert.deepEqual(row.allowedPrincipals, [])
})

test('builder cannot be inserted as generic receipt mint principal', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'receipt.mint-generic',
  )
  assert.ok(row)
  ;(row.allowedPrincipals as string[]).push('builder')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
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

test('reconciliation IDs are unique', () => {
  const mutated = structuredClone(valid)
  const duplicate = structuredClone(mutated.reconciliations[0])
  assert.ok(duplicate)
  ;(mutated.reconciliations as AuthorityEnforcementRegistry['reconciliations'][number][]).push(
    duplicate,
  )
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('reconciliation observed refs bind full identity location and value', () => {
  const mutated = structuredClone(valid)
  const ref = mutated.reconciliations[0]?.observedRefs[0]
  assert.ok(ref)
  ;(ref as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
  ;(ref as { valueDigest: string }).valueDigest = '1'.repeat(64)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('required reconciliation topics and statuses are immutable', () => {
  const mutated = structuredClone(valid)
  const record = mutated.reconciliations[0]
  assert.ok(record)
  ;(record as { topic: string }).topic = 'Plausible but forged topic'
  ;(record as { migrationStatus: string }).migrationStatus = 'open'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('reconciliation evidence digests cannot be self-asserted placeholders', () => {
  const mutated = structuredClone(valid)
  const evidence = mutated.reconciliations[0]?.observedEvidence[0]
  assert.ok(evidence)
  ;(evidence as { digest: string }).digest = 'f'.repeat(64)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('charter source cannot be downgraded below goal-charter authority', () => {
  const mutated = structuredClone(valid)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  assert.ok(source)
  ;(source as { authorityTier: string }).authorityTier = 'generated-advisory'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('stale explanatory source cannot be promoted to binding authority', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find(
    (candidate) => candidate.authorityEffect === 'stale-explanation',
  )
  assert.ok(source)
  ;(source as { authorityEffect: string }).authorityEffect = 'binding'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('operation-disjoint rules do not conflict', () => {
  const mutated = structuredClone(valid)
  const original = mutated.rules[0]
  assert.ok(original)
  const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
  ;(counterpart as { ruleId: string }).ruleId = 'rule.operation-disjoint'
  ;(counterpart as { decision: string }).decision =
    original.decision === 'REFUSE' ? 'ALLOW' : 'REFUSE'
  ;(original.applicability.operations as string[]).splice(
    0,
    original.applicability.operations.length,
    'repo-read',
  )
  ;(counterpart.applicability.operations as string[]).splice(
    0,
    counterpart.applicability.operations.length,
    'repo-mutation',
  )
  ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
  const item = mutated.sources
    .find((source) => source.sourceId === counterpart.sourceRefs[0]?.sourceId)
    ?.inventoryItems.find((candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId)
  assert.ok(item)
  ;(item.ruleIds as string[]).push(counterpart.ruleId)
  assert.equal(codes(mutated).includes('RULE_CONFLICT'), false)
})

test('role stage operation and host axes can make active rules scope-disjoint', () => {
  const dimensions = ['roles', 'stages', 'operations', 'hosts'] as const
  for (const dimension of dimensions) {
    const mutated = structuredClone(valid)
    const original = mutated.rules[0]
    assert.ok(original)
    const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
    ;(counterpart as { ruleId: string }).ruleId = `rule.axis-disjoint-${dimension}`
    ;(counterpart as { classification: string }).classification = 'narrative-provenance'
    ;(counterpart as { decision: string }).decision = 'ADVISORY'
    ;(counterpart as { refusalCode: string | null }).refusalCode = null
    ;(counterpart as { enforcementOwner: string }).enforcementOwner = 'provenance-only'
    ;(counterpart as { assurance: string }).assurance = 'narrative'
    const disjoint = {
      roles: ['developer'],
      stages: ['stage-zero'],
      operations: ['source-inventory'],
      hosts: ['unsupported-host'],
    } as const
    ;(counterpart.applicability[dimension] as string[]).splice(
      0,
      counterpart.applicability[dimension].length,
      ...disjoint[dimension],
    )
    ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
    ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
    const item = mutated.sources
      .find((source) => source.sourceId === counterpart.sourceRefs[0]?.sourceId)
      ?.inventoryItems.find((candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId)
    assert.ok(item)
    ;(item.ruleIds as string[]).push(counterpart.ruleId)
    assert.equal(codes(mutated).includes('RULE_CONFLICT'), false, dimension)
  }
})

test('all-foreman-goals applicability overlaps foreman-kernel applicability', () => {
  const mutated = structuredClone(valid)
  const original = mutated.rules[0]
  assert.ok(original)
  const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
  ;(counterpart as { ruleId: string }).ruleId = 'rule.goal-scope-overlap'
  ;(counterpart as { classification: string }).classification = 'narrative-provenance'
  ;(counterpart as { decision: string }).decision = 'ADVISORY'
  ;(counterpart as { refusalCode: string | null }).refusalCode = null
  ;(counterpart as { enforcementOwner: string }).enforcementOwner = 'provenance-only'
  ;(counterpart as { assurance: string }).assurance = 'narrative'
  ;(counterpart.applicability.goals as string[]).splice(0, 1, 'all-foreman-goals')
  ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
  const item = mutated.sources[0]?.inventoryItems.find(
    (candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId,
  )
  assert.ok(item)
  ;(item.ruleIds as string[]).push(counterpart.ruleId)
  expectCode(mutated, 'RULE_CONFLICT')
})

test('higher-tier active authority controls a lower-tier in-scope contradiction', () => {
  const mutated = structuredClone(full)
  const controlling = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  const lower = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'coordinator-pattern',
  )
  assert.ok(controlling)
  assert.ok(lower)
  const lowerSource = mutated.sources.find(
    (candidate) => candidate.sourceId === lower.sourceRefs[0]?.sourceId,
  )
  const lowerItem = lowerSource?.inventoryItems.find(
    (candidate) => candidate.itemId === lower.sourceRefs[0]?.itemId,
  )
  assert.ok(lowerItem)
  ;(lowerItem as { normalizedExcerpt: string }).normalizedExcerpt = controlling.normalizedStatement
  ;(lowerItem as { valueDigest: string }).valueDigest = sha256(lowerItem.normalizedExcerpt)
  ;(lower as { normalizedStatement: string }).normalizedStatement = controlling.normalizedStatement
  ;(lower as { classification: string }).classification = 'narrative-provenance'
  ;(lower as { decision: string }).decision = 'ADVISORY'
  ;(lower as { refusalCode: string | null }).refusalCode = null
  ;(lower as { enforcementOwner: string }).enforcementOwner = 'provenance-only'
  ;(lower as { assurance: string }).assurance = 'narrative'
  ;(lower as { applicability: typeof controlling.applicability }).applicability = structuredClone(
    controlling.applicability,
  )
  const lowerRef = lower.sourceRefs[0]
  assert.ok(lowerRef)
  ;(lowerRef as { valueDigest: string }).valueDigest = lowerItem.valueDigest
  ;(lower as { bindingDigest: string }).bindingDigest = bindingDigestFor(lower)
  assert.equal(codes(mutated).includes('RULE_CONFLICT'), false)
})

test('historical-only and stale-effect rules cannot create active authority conflicts', () => {
  for (const mode of ['historical-only', 'stale-explanation'] as const) {
    const mutated = structuredClone(valid)
    const original = mutated.rules[0]
    const source = mutated.sources[0]
    assert.ok(original)
    assert.ok(source)
    const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
    ;(counterpart as { ruleId: string }).ruleId = `rule.inactive-${mode}`
    ;(counterpart as { classification: string }).classification = 'narrative-provenance'
    ;(counterpart as { decision: string }).decision = 'ADVISORY'
    ;(counterpart as { refusalCode: string | null }).refusalCode = null
    ;(counterpart as { enforcementOwner: string }).enforcementOwner = 'provenance-only'
    ;(counterpart as { assurance: string }).assurance = 'narrative'
    if (mode === 'historical-only') {
      ;(counterpart as { retirementState: string }).retirementState = mode
    } else {
      ;(source as { authorityEffect: string }).authorityEffect = mode
    }
    ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
    ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
    const item = source.inventoryItems.find(
      (candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId,
    )
    assert.ok(item)
    ;(item.ruleIds as string[]).push(counterpart.ruleId)
    assert.equal(codes(mutated).includes('RULE_CONFLICT'), false, mode)
  }
})

test('rule normalized statement must equal its referenced normalized excerpt', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules[0]
  assert.ok(rule)
  ;(rule as { normalizedStatement: string }).normalizedStatement =
    'Different but internally rehashed statement'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('coordinated identity location and value replacement requires typed migration evidence', () => {
  const mutated = structuredClone(valid)
  const source = mutated.sources[0]
  const item = source?.inventoryItems[0]
  const rule = mutated.rules.find((candidate) => candidate.ruleId === item?.ruleIds[0])
  assert.ok(source)
  assert.ok(item)
  assert.ok(rule)
  const priorItemId = item.itemId
  ;(item as { itemId: string }).itemId = 'item.coordinated-replacement'
  ;(item.locator as { anchor: string }).anchor = `${item.locator.anchor} replacement`
  ;(item as { normalizedExcerpt: string }).normalizedExcerpt = 'Coordinated replacement value'
  ;(item as { valueDigest: string }).valueDigest = sha256(item.normalizedExcerpt)
  const ref = rule.sourceRefs[0]
  assert.ok(ref)
  ;(ref as { itemId: string }).itemId = item.itemId
  ;(ref as { locatorDigest: string }).locatorDigest = locatorDigestFor(item.locator)
  ;(ref as { valueDigest: string }).valueDigest = item.valueDigest
  ;(rule as { normalizedStatement: string }).normalizedStatement = item.normalizedExcerpt
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  const updateReference = (
    reference: AuthorityEnforcementRegistry['rules'][number]['sourceRefs'][number],
  ): void => {
    if (reference.sourceId !== source.sourceId || reference.itemId !== priorItemId) return
    ;(reference as { itemId: string }).itemId = item.itemId
    ;(reference as { locatorDigest: string }).locatorDigest = locatorDigestFor(item.locator)
    ;(reference as { valueDigest: string }).valueDigest = item.valueDigest
  }
  for (const operation of mutated.operationAuthority) {
    for (const reference of operation.requiredGitEvidence) updateReference(reference)
  }
  for (const reconciliation of mutated.reconciliations) {
    for (const reference of reconciliation.observedRefs) updateReference(reference)
    if (reconciliation.supersedingEvidence !== null)
      updateReference(reconciliation.supersedingEvidence)
  }
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('full-registry coordinated rule ID and binding replacement cannot rewrite the baseline', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.d1')
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d1')
  assert.ok(source)
  assert.ok(item)
  assert.ok(rule)
  const priorRuleId = rule.ruleId
  ;(item as { itemId: string }).itemId = 'item.d1-replacement'
  ;(item.locator as { anchor: string }).anchor = 'D1-replacement'
  ;(item as { normalizedExcerpt: string }).normalizedExcerpt =
    '| D1-replacement | Coordinated replacement | Rewritten |'
  ;(item as { valueDigest: string }).valueDigest = sha256(item.normalizedExcerpt)
  ;(item.ruleIds as string[]).splice(0, item.ruleIds.length, 'rule.fk-charter.d1-replacement')
  ;(rule as { ruleId: string }).ruleId = 'rule.fk-charter.d1-replacement'
  ;(rule as { normalizedStatement: string }).normalizedStatement = item.normalizedExcerpt
  const reference = rule.sourceRefs[0]
  assert.ok(reference)
  ;(reference as { itemId: string }).itemId = item.itemId
  ;(reference as { locatorDigest: string }).locatorDigest = locatorDigestFor(item.locator)
  ;(reference as { valueDigest: string }).valueDigest = item.valueDigest
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  const updateReference = (candidate: typeof reference): void => {
    if (candidate.sourceId !== source.sourceId || candidate.itemId !== 'item.d1') return
    ;(candidate as { itemId: string }).itemId = item.itemId
    ;(candidate as { locatorDigest: string }).locatorDigest = reference.locatorDigest
    ;(candidate as { valueDigest: string }).valueDigest = reference.valueDigest
  }
  for (const operation of mutated.operationAuthority) {
    for (const candidate of operation.requiredGitEvidence) updateReference(candidate)
  }
  for (const reconciliation of mutated.reconciliations) {
    for (const candidate of reconciliation.observedRefs) updateReference(candidate)
    if (reconciliation.supersedingEvidence !== null)
      updateReference(reconciliation.supersedingEvidence)
    for (const evidence of reconciliation.observedEvidence) {
      if (evidence.kind === 'source-ref' && evidence.reference === 'fk-charter:item.d1') {
        ;(evidence as { reference: string }).reference = `fk-charter:${item.itemId}`
        ;(evidence as { digest: string }).digest = sha256(canonicalJson(reference))
      }
    }
    for (const [index, candidate] of reconciliation.authoritativeRuleIds.entries()) {
      if (candidate === priorRuleId) {
        ;(reconciliation.authoritativeRuleIds as string[])[index] = rule.ruleId
      }
    }
  }
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('rework migration binds the prior registry commit source snapshot and superseding manifest', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-6eb1c25',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.ok(record.supersedingEvidence)
  assert.deepEqual(
    record.observedEvidence.map((evidence) => `${evidence.kind}:${evidence.reference}`),
    [
      'git-commit:4666ea15caee8b231137f23325d14ea4526e338a',
      `git-commit:${full.sourceSnapshotCommit}`,
      'command-result:registry-binding-manifest:1fe3a7c66241904445021c97db68065961a3bf5beceb654faff4b552b4de79b2',
      'command-result:superseding-binding-manifest:75bdf0dd34ea853ff5861a9500c56e967d18082f15f2ba2591899e3e98b62ddf',
    ],
  )
})

test('removing the coordinator-ratified rework migration fails closed', () => {
  const mutated = structuredClone(full)
  const index = mutated.reconciliations.findIndex(
    (candidate) => candidate.reconciliationId === 'registry-rework-6eb1c25',
  )
  assert.notEqual(index, -1)
  ;(mutated.reconciliations as AuthorityEnforcementRegistry['reconciliations'][number][]).splice(
    index,
    1,
  )
  expectCode(mutated, 'RECONCILIATION_MISSING')
})

test('forged prior-commit migration evidence fails even when internally rehashed', () => {
  const mutated = structuredClone(full)
  const record = mutated.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-6eb1c25',
  )
  const evidence = record?.observedEvidence[0]
  assert.ok(evidence)
  ;(evidence as { reference: string }).reference = '0'.repeat(40)
  ;(evidence as { digest: string }).digest = sha256(evidence.reference)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
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
