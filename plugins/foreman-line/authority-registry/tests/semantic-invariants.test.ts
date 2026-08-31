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
  resolveAuthority,
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
    'pre-action-refusal': 59,
    'post-action-detection': 4,
    'ci-static-check': 40,
    'independent-review-human-judgment': 5,
    'narrative-provenance': 428,
    unsupported: 14,
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
  const original = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  assert.ok(original)
  const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
  ;(counterpart as { ruleId: string }).ruleId = 'rule.goal-scope-overlap'
  ;(counterpart as { authorityClaim: string }).authorityClaim = 'conflicting-goal-scope-claim'
  ;(counterpart.applicability.goals as string[]).splice(0, 1, 'all-foreman-goals')
  ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
  const item = mutated.sources
    .find((source) => source.sourceId === counterpart.sourceRefs[0]?.sourceId)
    ?.inventoryItems.find((candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId)
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
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['4666ea15caee8b231137f23325d14ea4526e338a', full.sourceSnapshotCommit],
  )
  const commands = record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map(
      (evidence) => JSON.parse(evidence.reference) as { commandId: string; resultDigest: string },
    )
  assert.deepEqual(
    commands.map((command) => command.commandId),
    ['registry-binding-manifest', 'superseding-binding-manifest'],
  )
  assert.equal(
    commands[1]?.resultDigest,
    '48a82df7d6da19352e4c9d2d99195835743a27f163a5d13a4f8d5b2a76a75a61',
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
  ;(gate2.allowedPrincipals as string[]).push('builder')
  ;(gate2.allowedPrincipals as string[]).reverse()
  assert.ok(codes(principals).includes('MIGRATION_EVIDENCE_INVALID'))

  const rows = structuredClone(valid)
  ;(
    rows.operationAuthority as AuthorityEnforcementRegistry['operationAuthority'][number][]
  ).reverse()
  assert.ok(codes(rows).includes('MIGRATION_EVIDENCE_INVALID'))
})

test('R3 exact source contract rejects a missing eighteenth source', () => {
  const mutated = structuredClone(full)
  ;(mutated.sources as AuthorityEnforcementRegistry['sources'][number][]).pop()
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 exact source contract rejects an unknown nineteenth source', () => {
  const mutated = structuredClone(full)
  const extra = structuredClone(mutated.sources[0])
  assert.ok(extra)
  ;(extra as { sourceId: string }).sourceId = 'unknown-nineteenth-source'
  ;(extra as { path: string }).path = 'plugins/foreman-line/docs/unknown-nineteenth.md'
  ;(mutated.sources as AuthorityEnforcementRegistry['sources'][number][]).push(extra)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 exact source contract rejects a known ID with a substituted path', () => {
  const mutated = structuredClone(full)
  ;(mutated.sources[0] as { path: string }).path = mutated.sources[1]?.path ?? 'missing'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 exact source contract rejects a substituted source ID at cardinality eighteen', () => {
  const mutated = structuredClone(full)
  ;(mutated.sources[0] as { sourceId: string }).sourceId = 'substituted-charter'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 D10 semantic downgrade requires typed prior-manifest migration', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  assert.ok(rule)
  ;(rule as { normalizedStatement: string }).normalizedStatement += ' weakened'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 D10 applicability downgrade requires typed prior-manifest migration', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  assert.ok(rule)
  ;(rule.applicability.roles as string[]).splice(0, 1)
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 D10 retirement downgrade requires typed prior-manifest migration', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'candidate-for-retirement'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 authority subject replacement is bound by the complete manifest', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules[0]
  assert.ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'forged.subject'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 authority claim replacement is bound by the complete manifest', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules[0]
  assert.ok(rule)
  ;(rule as { authorityClaim: string }).authorityClaim = 'forged-claim'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 complete binding digest includes applicability retirement and assurance', () => {
  const original = full.rules[0]
  assert.ok(original)
  for (const mutate of [
    (rule: typeof original) => (rule.applicability.hosts as string[]).splice(0, 1),
    (rule: typeof original) =>
      ((rule as { retirementState: string }).retirementState = 'required-backstop'),
    (rule: typeof original) => ((rule as { assurance: string }).assurance = 'human-ratified'),
  ]) {
    const rule = structuredClone(original)
    mutate(rule)
    assert.notEqual(bindingDigestFor(rule), original.bindingDigest)
  }
})

const d3Query = {
  authoritySubject: 'kernel.surface-admission-separation',
  goal: 'foreman-kernel',
  role: 'builder',
  stage: 'build',
  operation: 'state-transition',
  host: 'provider-neutral',
} as const

test('R3 resolver returns exact controlling claim and sorted IDs', () => {
  const result = resolveAuthority(full, d3Query)
  assert.equal(result.outcome, 'RESOLVED')
  assert.deepEqual(result.controllingRuleIds, [...result.controllingRuleIds].sort())
  if (result.outcome === 'RESOLVED')
    assert.equal(result.authorityClaim, 'read-control-admission-separated')
})

test('R3 resolver rejects any-valued query scope', () => {
  const result = resolveAuthority(full, { ...d3Query, role: 'any' } as never)
  assert.deepEqual(result, {
    outcome: 'REQUIRE_HUMAN',
    authoritySubject: 'kernel.surface-admission-separation',
    reasonCode: 'INVALID_QUERY_SCOPE',
    controllingRuleIds: [],
    consideredRuleIds: [],
  })
})

test('R3 resolver rejects all-foreman-goals query scope', () => {
  const result = resolveAuthority(full, { ...d3Query, goal: 'all-foreman-goals' } as never)
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') assert.equal(result.reasonCode, 'INVALID_QUERY_SCOPE')
})

test('R3 resolver returns no-applicable-authority instead of silently allowing', () => {
  const result = resolveAuthority(full, { ...d3Query, authoritySubject: 'missing.subject' })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') assert.equal(result.reasonCode, 'NO_APPLICABLE_AUTHORITY')
})

test('R3 resolver detects naturally worded equal-tier conflicting claims', () => {
  const mutated = structuredClone(full)
  const original = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  assert.ok(original)
  const rival = structuredClone(original)
  ;(rival as { ruleId: string }).ruleId = 'rule.fk-charter.d3-rival'
  ;(rival as { authorityClaim: string }).authorityClaim = 'state-changes-follow-a-different-rule'
  ;(rival as { normalizedStatement: string }).normalizedStatement = 'Naturally different prose.'
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(rival)
  const result = resolveAuthority(mutated, d3Query)
  assert.equal(result.outcome, 'CONFLICT')
  if (result.outcome === 'CONFLICT') {
    assert.deepEqual(result.conflictingClaims, [...result.conflictingClaims].sort())
  }
})

test('R3 resolver keeps lower-tier rules considered but non-controlling', () => {
  const mutated = structuredClone(full)
  const high = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  const low = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'standing-constraints',
  )
  assert.ok(high && low)
  ;(low as { authoritySubject: string }).authoritySubject = high.authoritySubject
  ;(low.applicability as {
    goals: string[]
    roles: string[]
    stages: string[]
    operations: string[]
    hosts: string[]
  }) = structuredClone(high.applicability) as never
  const result = resolveAuthority(mutated, d3Query)
  assert.equal(result.outcome, 'RESOLVED')
  assert.ok(result.consideredRuleIds.includes(low.ruleId))
  assert.ok(!result.controllingRuleIds.includes(low.ruleId))
})

test('R3 resolver excludes stale explanatory sources from control', () => {
  const mutated = structuredClone(full)
  const stale = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'spec-linter-readme',
  )
  assert.ok(stale)
  ;(stale as { authoritySubject: string }).authoritySubject = d3Query.authoritySubject
  ;(stale.applicability as {
    goals: string[]
    roles: string[]
    stages: string[]
    operations: string[]
    hosts: string[]
  }) = structuredClone(
    mutated.rules.find((r) => r.ruleId === 'rule.fk-charter.d3')?.applicability,
  ) as never
  const result = resolveAuthority(mutated, d3Query)
  assert.equal(result.outcome, 'RESOLVED')
  assert.ok(!result.controllingRuleIds.includes(stale.ruleId))
})

test('R3 Gate 2 refuses a revoked standing-grant evidence set', () => {
  const mutated = structuredClone(full)
  const gate2 = mutated.operationAuthority.find(
    (operation) => operation.operationId === 'gate2.dispatch',
  )
  assert.ok(gate2)
  ;(gate2.requiredGitEvidence as unknown[]).splice(0)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R3 protected evidence rejects a fully resolved but irrelevant canon reference', () => {
  const mutated = structuredClone(full)
  const gate2 = mutated.operationAuthority.find(
    (operation) => operation.operationId === 'gate2.dispatch',
  )
  const irrelevant = mutated.rules.find((rule) => rule.ruleId === 'rule.fk-charter.d1')
    ?.sourceRefs[0]
  assert.ok(gate2 && irrelevant)
  ;(
    gate2.requiredGitEvidence as AuthorityEnforcementRegistry['rules'][number]['sourceRefs'][number][]
  ).splice(0, 1, irrelevant)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R3 fake migration cannot authorize an exact-source-set substitution', () => {
  const mutated = structuredClone(full)
  ;(mutated.sources[0] as { sourceId: string }).sourceId = 'fake-migrated-charter'
  const migration = mutated.reconciliations.find(
    (record) => record.migrationStatus === 'superseded-by-amendment',
  )
  assert.ok(migration)
  ;(migration as { scopedDisposition: string }).scopedDisposition = 'Trust this migration.'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 public rule uses assurance and rejects parallel assuranceLevel', () => {
  const mutated = structuredClone(full) as AuthorityEnforcementRegistry & {
    rules: Array<Record<string, unknown>>
  }
  const rule = mutated.rules[0]
  assert.ok(rule)
  rule.assuranceLevel = rule.assurance
  expectCode(mutated, 'SCHEMA_INVALID')
})

test('R3 manifest detects a fully rehashed coordinated semantic replacement', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d1')
  assert.ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'coordinated.replacement'
  ;(rule as { authorityClaim: string }).authorityClaim = 'coordinated-replacement-claim'
  ;(rule as { normalizedStatement: string }).normalizedStatement = 'Coordinated replacement.'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 one README cannot satisfy all four retirement evidence kinds', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) =>
      !candidate.sourceRefs.some((reference) => reference.sourceId === 'standing-constraints'),
  )
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  const path = 'plugins/foreman-line/authority-registry/README.md'
  ;(rule as { retirementEvidence: unknown }).retirementEvidence = {
    predicate: { kind: 'predicate-contract', path, digest: '0'.repeat(64) },
    negativeRefusalTest: { kind: 'negative-test', path, digest: '0'.repeat(64) },
    corpusSweep: { kind: 'corpus-sweep', path, digest: '0'.repeat(64) },
    independentBypassAttempt: { kind: 'independent-bypass', path, digest: '0'.repeat(64) },
  }
  expectCode(mutated, 'RETIREMENT_EVIDENCE_INCOMPLETE')
})

test('R4 exact D2 D3 D18 and D19 semantic identities are shipped', () => {
  const expected = {
    'rule.fk-charter.d2': [
      'canon.operational-authority-boundary',
      'git-canon-sqlite-operational-split',
    ],
    'rule.fk-charter.d3': [
      'kernel.surface-admission-separation',
      'read-control-admission-separated',
    ],
    'rule.fk-charter.d18': ['kernel.authorize-action-owner', 'provider-neutral-policy-engine'],
    'rule.fk-charter.d19': ['repository.read-confidentiality', 'admission-bound-contained-read'],
  } as const
  for (const [ruleId, identity] of Object.entries(expected)) {
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule)
    assert.deepEqual([rule.authoritySubject, rule.authorityClaim], identity)
  }
})

test('R4 every rule has one basis ref contained in its source refs', () => {
  for (const rule of full.rules) {
    const basis = (rule as typeof rule & { authorityBasisRef?: unknown }).authorityBasisRef
    assert.ok(basis)
    assert.ok(
      rule.sourceRefs.some((reference) => canonicalJson(reference) === canonicalJson(basis)),
    )
  }
})

test('R4 shipped reconciliation rules share semantic subjects', () => {
  for (const reconciliation of full.reconciliations.slice(0, 6)) {
    if (reconciliation.reconciliationId === 'missing-provenance-reference') {
      const provenance = full.rules.filter(
        (rule) => rule.authoritySubject === 'standing.provenance',
      )
      assert.equal(provenance.length, 1)
      assert.ok(
        reconciliation.observedRefs.some(
          (reference) =>
            reference.sourceId === provenance[0]?.sourceRefs[0]?.sourceId &&
            reference.itemId === provenance[0]?.sourceRefs[0]?.itemId,
        ),
      )
      continue
    }
    const subjects = new Map<string, number>()
    for (const reference of reconciliation.observedRefs) {
      const item = full.sources
        .find((source) => source.sourceId === reference.sourceId)
        ?.inventoryItems.find((candidate) => candidate.itemId === reference.itemId)
      for (const ruleId of item?.ruleIds ?? []) {
        const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
        if (rule)
          subjects.set(rule.authoritySubject, (subjects.get(rule.authoritySubject) ?? 0) + 1)
      }
    }
    assert.ok(
      [...subjects.values()].some((count) => count > 1),
      reconciliation.reconciliationId,
    )
  }
})

test('R4 shipped Gate 3 competitors resolve without test-time subject rewriting', () => {
  const result = resolveAuthority(full, {
    authoritySubject: 'gate3.merge-authority',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'merge',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome === 'RESOLVED') assert.equal(result.authorityClaim, 'human-owned-nondelegated')
})

const shippedResolverVectors = [
  {
    subject: 'gate.namespace',
    role: 'developer',
    stage: 'stage-zero',
    operation: 'state-transition',
    host: 'provider-neutral',
    outcome: 'RESOLVED',
    claim: 'fk-three-gate-ownership',
  },
  {
    subject: 'gate3.merge-authority',
    role: 'coordinator',
    stage: 'merge',
    operation: 'state-transition',
    host: 'provider-neutral',
    outcome: 'RESOLVED',
    claim: 'human-owned-nondelegated',
  },
  {
    subject: 'permission-profile.registry-state',
    role: 'ci',
    stage: 'deterministic-verify',
    operation: 'source-inventory',
    host: 'ci',
    outcome: 'RESOLVED',
    claim: 'six-profile-live-enum',
  },
  {
    subject: 'spec.mutation-authority',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'provider-neutral',
    outcome: 'RESOLVED',
    claim: 'exact-allowed-files-required',
  },
  {
    subject: 'permission-profile.enforcement-bound',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'provider-neutral',
    outcome: 'RESOLVED',
    claim: 'loaded-session-mediated-denial',
  },
  {
    subject: 'standing.provenance',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'provider-neutral',
    outcome: 'REQUIRE_HUMAN',
    claim: 'inline-rules-required-until-provenance-restored',
  },
] as const

for (const vector of shippedResolverVectors) {
  test(`R4 shipped-data resolver vector ${vector.subject}`, () => {
    const result = resolveAuthority(full, {
      authoritySubject: vector.subject,
      goal: 'foreman-kernel',
      role: vector.role,
      stage: vector.stage,
      operation: vector.operation,
      host: vector.host,
    })
    assert.equal(result.outcome, vector.outcome)
    if (result.outcome === 'RESOLVED') assert.equal(result.authorityClaim, vector.claim)
  })
}

test('R4 corroborating source ref cannot promote a rule above its authority basis', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) =>
      candidate.authoritySubject === 'permission-profile.enforcement-bound' &&
      candidate.classification === 'pre-action-refusal',
  )
  const corroborating = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'standing-constraints',
  )?.sourceRefs[0]
  assert.ok(rule)
  assert.ok(corroborating)
  ;(rule.sourceRefs as (typeof rule.sourceRefs)[number][]).push(corroborating)
  const result = resolveAuthority(mutated, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome === 'RESOLVED') assert.equal(result.authorityClaim, rule.authorityClaim)
})

test('R4 retired-from-agent-reading rules never control authority', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  const result = resolveAuthority(mutated, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
})

test('R4 reconciliation disposition and consequence are immutable', () => {
  for (const field of ['scopedDisposition', 'unresolvedConsequence'] as const) {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations[0]
    assert.ok(record)
    ;(record as unknown as Record<string, string>)[field] =
      'Delegated merge without human evidence.'
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  }
})

test('R4 missing-path evidence uses commit-bound canonical JSON', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'missing-provenance-reference',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'missing-path')
  assert.ok(evidence)
  const reference = JSON.parse(evidence.reference) as { commit: string; path: string }
  assert.deepEqual(reference, {
    commit: full.sourceSnapshotCommit,
    path: 'plugins/foreman-line/docs/transcripts/defects_lessons.md',
  })
})

const applicabilityVectors = [
  ...Array.from({ length: 13 }, (_, index) => ({
    ruleId: `rule.standing-constraints.constraint-${index + 1}`,
    positiveRole: index >= 7 && index <= 10 ? 'reviewer' : 'builder',
    negativeRole: index >= 7 && index <= 10 ? 'builder' : 'reviewer',
  })),
  ...Array.from({ length: 15 }, (_, index) => ({
    ruleId: `rule.parcel-driven-development.hard-rule-${index + 1}`,
    positiveRole: index === 5 || index === 11 || index === 12 ? 'coordinator' : 'builder',
    negativeRole:
      index === 9 ? null : index === 5 || index === 11 || index === 12 ? 'reviewer' : 'operator',
  })),
]

for (const vector of applicabilityVectors) {
  test(`R4 source-derived applicability vector ${vector.ruleId}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === vector.ruleId)
    assert.ok(rule)
    assert.ok(rule.applicability.roles.includes(vector.positiveRole as never))
    if (vector.negativeRole === null) {
      assert.deepEqual(rule.applicability.roles, [
        'developer',
        'coordinator',
        'shaper',
        'builder',
        'reviewer',
        'ci',
        'host-adapter',
        'kernel',
        'operator',
      ])
    } else {
      assert.ok(!rule.applicability.roles.includes(vector.negativeRole as never))
    }
  })
}

test('R4 PDD hard rule 10 applies to ordinary builder build repo mutation', () => {
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.parcel-driven-development.hard-rule-10',
  )
  assert.ok(rule)
  assert.ok(rule.applicability.roles.includes('builder'))
  assert.ok(rule.applicability.stages.includes('build'))
  assert.ok(rule.applicability.operations.includes('repo-mutation'))
})

test('R5 standing rules have thirteen distinct operative semantic subjects', () => {
  const rules = full.rules.filter((rule) =>
    /^rule\.standing-constraints\.constraint-(?:[1-9]|1[0-3])$/.test(rule.ruleId),
  )
  assert.equal(rules.length, 13)
  assert.equal(new Set(rules.map((rule) => rule.authoritySubject)).size, 13)
  assert.equal(
    rules.some((rule) => rule.authoritySubject === 'standing.provenance'),
    false,
  )
})

test('R5 every authority basis is substantive source text rather than a heading', () => {
  for (const rule of full.rules) {
    const source = full.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    assert.ok(item, rule.ruleId)
    assert.notEqual(item.locator.kind, 'heading', rule.ruleId)
    assert.equal(
      normalizeRuleText(item.normalizedExcerpt),
      normalizeRuleText(rule.normalizedStatement),
    )
  }
})

test('R5 permission-profile reconciliation is grounded in charter D7 not D9', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'permission-profile-enforcement-bound',
  )
  assert.ok(record)
  const refs = record.observedRefs.map((reference) => `${reference.sourceId}:${reference.itemId}`)
  assert.ok(refs.includes('fk-charter:item.d7'))
  assert.equal(refs.includes('fk-charter:item.d9'), false)
  assert.ok(record.authoritativeRuleIds.includes('rule.fk-charter.d7'))
  assert.equal(record.authoritativeRuleIds.includes('rule.fk-charter.d9'), false)
})

for (const reconciliationId of [
  'gate-namespace-count',
  'gate3-delegation',
  'spec-linter-profile-behavior',
  'surfaces-allowed-files',
  'permission-profile-enforcement-bound',
  'missing-provenance-reference',
] as const) {
  test(`R5 reconciliation ${reconciliationId} binds its exact observedEvidence set`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    assert.ok(record)
    ;(record.observedEvidence as unknown[]).splice(0, 1)
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

test('R5 missing provenance evidence uses the exact repository-relative absent path', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'missing-provenance-reference',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'missing-path')
  assert.ok(evidence)
  assert.deepEqual(JSON.parse(evidence.reference), {
    commit: full.sourceSnapshotCommit,
    path: 'plugins/foreman-line/docs/transcripts/defects_lessons.md',
  })
})

test('R5 source baseline manifest rejects a recomputed snapshot hash mutation', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources[0]
  assert.ok(source)
  ;(source.snapshotEvidence as { fullFileSha256: string }).fullFileSha256 = '0'.repeat(64)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

const r5ApplicabilityManifest = {
  'rule.standing-constraints.constraint-1': [['builder'], ['build'], ['repo-mutation']],
  'rule.standing-constraints.constraint-2': [['builder'], ['build'], ['repo-mutation']],
  'rule.standing-constraints.constraint-3': [
    ['builder'],
    ['deterministic-verify'],
    ['control-call'],
  ],
  'rule.standing-constraints.constraint-4': [['builder'], ['build'], ['control-call']],
  'rule.standing-constraints.constraint-5': [
    ['builder'],
    ['build', 'deterministic-verify'],
    ['repo-mutation'],
  ],
  'rule.standing-constraints.constraint-6': [['builder'], ['build'], ['source-inventory']],
  'rule.standing-constraints.constraint-7': [['builder'], ['build'], ['control-call']],
  'rule.standing-constraints.constraint-8': [
    ['reviewer'],
    ['adversarial-review'],
    ['repo-mutation'],
  ],
  'rule.standing-constraints.constraint-9': [['reviewer'], ['adversarial-review'], ['repo-read']],
  'rule.standing-constraints.constraint-10': [['reviewer'], ['adversarial-review'], ['repo-read']],
  'rule.standing-constraints.constraint-11': [['reviewer'], ['adversarial-review'], ['repo-read']],
  'rule.standing-constraints.constraint-12': [
    ['builder'],
    ['deterministic-verify'],
    ['repo-mutation'],
  ],
  'rule.standing-constraints.constraint-13': [['builder'], ['build'], ['repo-mutation']],
  'rule.parcel-driven-development.hard-rule-1': [
    ['coordinator', 'shaper', 'builder'],
    ['step-zero', 'build'],
    ['spec-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-2': [
    ['shaper', 'builder', 'reviewer'],
    ['shaping', 'build', 'adversarial-review'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-3': [
    ['builder', 'reviewer'],
    ['build', 'adversarial-review'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-4': [
    ['coordinator', 'builder'],
    ['step-zero', 'build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-5': [
    ['coordinator', 'builder'],
    ['build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-6': [['coordinator'], ['build'], ['repo-mutation']],
  'rule.parcel-driven-development.hard-rule-7': [
    ['builder', 'ci'],
    ['deterministic-verify'],
    ['repo-read'],
  ],
  'rule.parcel-driven-development.hard-rule-8': [['builder'], ['build'], ['repo-mutation']],
  'rule.parcel-driven-development.hard-rule-9': [
    ['coordinator', 'builder'],
    ['build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-10': [
    [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
  ],
  'rule.parcel-driven-development.hard-rule-11': [
    ['builder', 'reviewer'],
    ['build', 'adversarial-review'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-12': [['coordinator'], ['merge'], ['state-transition']],
  'rule.parcel-driven-development.hard-rule-13': [
    ['coordinator'],
    ['build', 'closure'],
    ['state-transition'],
  ],
  'rule.parcel-driven-development.hard-rule-14': [
    ['coordinator', 'builder', 'reviewer'],
    ['deterministic-verify', 'adversarial-review'],
    ['source-inventory'],
  ],
  'rule.parcel-driven-development.hard-rule-15': [
    ['coordinator', 'builder', 'reviewer'],
    ['deterministic-verify', 'adversarial-review', 'merge'],
    ['source-inventory', 'state-transition'],
  ],
} as const

for (const [ruleId, expected] of Object.entries(r5ApplicabilityManifest)) {
  test(`R5 complete five-axis resolver applicability ${ruleId}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule)
    assert.deepEqual(rule.applicability.goals, ['all-foreman-goals'])
    assert.deepEqual(rule.applicability.roles, expected[0])
    assert.deepEqual(rule.applicability.stages, expected[1])
    assert.deepEqual(rule.applicability.operations, expected[2])
    assert.deepEqual(rule.applicability.hosts, [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ])
    const positive = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: expected[0][0],
      stage: expected[1][0],
      operation: expected[2][0],
      host: 'provider-neutral',
    })
    assert.equal(positive.outcome, 'RESOLVED')
    if (positive.outcome === 'RESOLVED') assert.deepEqual(positive.controllingRuleIds, [ruleId])
    const universalRoleSet = expected[0].includes('operator' as never)
    const negativeRole = universalRoleSet ? expected[0][0] : 'operator'
    const negative = resolveAuthority(full, {
      authoritySubject: universalRoleSet
        ? `${rule.authoritySubject}.absent`
        : rule.authoritySubject,
      goal: 'foreman-kernel',
      role: negativeRole,
      stage: expected[1][0],
      operation: expected[2][0],
      host: 'provider-neutral',
    })
    assert.equal(negative.outcome, 'REQUIRE_HUMAN')
  })
}
