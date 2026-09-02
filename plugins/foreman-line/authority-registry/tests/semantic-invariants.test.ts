import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import type {
  AuthorityEnforcementRegistry,
  AuthorityQuery,
  AuthorityRule,
  InventoryItem,
} from '../src/types.js'
import {
  AUTHORITY_EFFECTS,
  AUTHORITY_TIERS,
  ROLE_SCOPES,
  RULE_CLASSIFICATIONS,
} from '../src/types.js'
import {
  bindingDigestFor,
  canonicalJson,
  locatorDigestFor,
  normalizeRuleText,
  registryBindingManifestDigest,
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

/**
 * Append a properly chained migration record so a deliberately amended registry can be VALID.
 *
 * The binding manifest is bound to the chain head, so any change to a source, inventory item or
 * rule makes the shipped head stale - by design, since the spec requires a typed prior-to-new
 * migration record whenever an operative value or locator changes. A test that wants a valid
 * document after mutating one therefore has to do what `npm run generate` does: re-digest and
 * record the migration. This is the mechanism under test, not a way around it.
 *
 * `reconciliations` sit outside `registryBindingManifestDigest`, so appending this record does not
 * perturb the digest it declares.
 */
function rechain(document: AuthorityEnforcementRegistry): AuthorityEnforcementRegistry {
  const chainRecords = document.reconciliations.filter((record) =>
    record.reconciliationId.startsWith('registry-rework-'),
  )
  const head = chainRecords[chainRecords.length - 1]
  assert.ok(head)
  // Chain from the head's OWN predecessor and REPLACE the head, rather than appending after it.
  // Appending would demote the shipped head to a historical record, which would then require a
  // pinned digest in validate.ts's RECONCILIATION_RECORD_DIGESTS - something a test cannot add.
  // Replacing keeps every pinned record pinned and leaves exactly one head, as AC4 requires.
  const headCommands = head.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map((evidence) => JSON.parse(evidence.reference) as { commandId: string; inputDigest: string })
  const predecessorDigest = headCommands.find((command) =>
    command.commandId.startsWith('superseding-binding-manifest'),
  )?.inputDigest
  assert.ok(predecessorDigest)
  const nextDigest = registryBindingManifestDigest(document)
  const command = (commandId: string, inputDigest: string, resultDigest: string) =>
    canonicalJson({
      tool: '@foreman-line/authority-registry',
      toolVersion: '0.1.0',
      commandId,
      inputDigest,
      resultDigest,
      exitCode: 0,
      actorClass: 'coordinator',
    })
  const prior = command('registry-binding-manifest-test', sha256('rechain'), predecessorDigest)
  const superseding = command('superseding-binding-manifest-test', predecessorDigest, nextDigest)
  const basis = head.observedRefs[0]
  assert.ok(basis)
  return {
    ...document,
    reconciliations: [
      ...document.reconciliations.filter(
        (record) => record.reconciliationId !== head.reconciliationId,
      ),
      {
        reconciliationId: 'registry-rework-testchain',
        topic: 'Test-authored amendment superseding the shipped bindings.',
        observedRefs: [basis],
        observedEvidence: [
          { kind: 'git-commit', reference: 'a'.repeat(40), digest: sha256('prior') },
          {
            kind: 'git-commit',
            reference: document.sourceSnapshotCommit,
            digest: sha256('snapshot'),
          },
          { kind: 'command-result', reference: prior, digest: sha256(prior) },
          { kind: 'command-result', reference: superseding, digest: sha256(superseding) },
        ],
        authoritativeRuleIds: head.authoritativeRuleIds,
        scopedDisposition: 'Test amendment.',
        unresolvedConsequence:
          'Future binding changes require another typed prior-to-new migration record.',
        migrationStatus: 'superseded-by-amendment',
        supersedingEvidence: basis,
      },
    ],
  }
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
    'pre-action-refusal': 254,
    'post-action-detection': 8,
    'ci-static-check': 77,
    'independent-review-human-judgment': 15,
    'narrative-provenance': 100,
    unsupported: 12,
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
  // Re-digest the rival so the ONLY objection is the contradiction itself. Without this the
  // document is invalid for a stale binding digest and the test proves nothing about conflicts.
  ;(rival as { bindingDigest: string }).bindingDigest = bindingDigestFor(rival)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(rival)
  // The named invariant: an equal-tier contradiction is DETECTED, as RULE_CONFLICT.
  assert.ok(
    validateRegistry(mutated).violations.some((violation) => violation.code === 'RULE_CONFLICT'),
  )
  // Amended AC5: such a contradiction is validity-blocking, so resolution fails closed rather
  // than silently selecting a side.
  const result = resolveAuthority(mutated, d3Query)
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') assert.equal(result.reasonCode, 'REGISTRY_INVALID')
})

test('R3 resolver keeps lower-tier rules considered but non-controlling', () => {
  const mutated = structuredClone(full)
  const high = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  const low = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'standing-constraints',
  )
  assert.ok(high && low)
  ;(low as { authoritySubject: string }).authoritySubject = high.authoritySubject
  ;(low.applicability as AuthorityRule['applicability']) = structuredClone(high.applicability)
  // Re-digest so the registry stays VALID. RULE_CONFLICT needs an EQUAL active tier, and these
  // two differ, so a valid document is reachable and the named property can actually be checked.
  ;(low as { bindingDigest: string }).bindingDigest = bindingDigestFor(low)
  const amended = rechain(mutated)
  assert.deepEqual(
    validateRegistry(amended).violations.map((violation) => violation.code),
    [],
  )
  const result = resolveAuthority(amended, d3Query)
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome !== 'RESOLVED') return
  assert.ok(result.consideredRuleIds.includes(low.ruleId))
  assert.ok(!result.controllingRuleIds.includes(low.ruleId))
  assert.ok(result.controllingRuleIds.includes(high.ruleId))
})

test('R3 resolver excludes stale explanatory sources from control', () => {
  const mutated = structuredClone(full)
  const stale = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'spec-linter-readme',
  )
  const controlling = mutated.rules.find((r) => r.ruleId === 'rule.fk-charter.d3')
  assert.ok(stale && controlling)
  ;(stale as { authoritySubject: string }).authoritySubject = d3Query.authoritySubject
  ;(stale.applicability as AuthorityRule['applicability']) = structuredClone(
    controlling.applicability,
  )
  // Re-digest so the registry stays VALID. Without this the mutation trips a binding-digest
  // violation and the test passes on REGISTRY_INVALID without ever exercising the named
  // property - which is what it did before this repair.
  ;(stale as { bindingDigest: string }).bindingDigest = bindingDigestFor(stale)
  const amended = rechain(mutated)
  assert.deepEqual(
    validateRegistry(amended).violations.map((violation) => violation.code),
    [],
  )
  const result = resolveAuthority(amended, d3Query)
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome !== 'RESOLVED') return
  // The named invariant: a stale explanatory source is VISIBLE but never CONTROLS.
  assert.ok(result.consideredRuleIds.includes(stale.ruleId))
  assert.ok(!result.controllingRuleIds.includes(stale.ruleId))
  assert.ok(result.controllingRuleIds.includes('rule.fk-charter.d3'))
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

test('R4 shipped reconciliation rules retain repeated current semantic subjects', () => {
  for (const reconciliation of full.reconciliations.slice(0, 6)) {
    if (reconciliation.reconciliationId === 'missing-provenance-reference') {
      const provenance = full.rules.filter(
        (rule) => rule.authoritySubject === 'standing.provenance',
      )
      assert.equal(provenance.length, 1)
      assert.ok(
        reconciliation.observedRefs.some(
          (reference) =>
            reference.sourceId === 'standing-constraints' &&
            reference.itemId === 'item.c5880644c95c',
        ),
      )
      continue
    }
    const subjects = new Map<string, number>()
    for (const ruleId of reconciliation.authoritativeRuleIds) {
      const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
      if (rule)
        subjects.set(
          rule.authoritySubject,
          full.rules.filter((candidate) => candidate.authoritySubject === rule.authoritySubject)
            .length,
        )
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
    host: 'claude-windows-docker-loaded',
    outcome: 'RESOLVED',
    claim: 'loaded-refusal-versus-unenrollment-detection-boundary',
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
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d7')
  const corroborating = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'standing-constraints',
  )?.sourceRefs[0]
  assert.ok(rule)
  assert.ok(corroborating)
  ;(rule.sourceRefs as (typeof rule.sourceRefs)[number][]).push(corroborating)
  // Re-digest and re-chain so the document stays VALID. Otherwise the mutation simply invalidates
  // the registry and the test proves nothing about tier promotion, which is what it named.
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  const amended = rechain(mutated)
  assert.deepEqual(
    validateRegistry(amended).violations.map((violation) => violation.code),
    [],
  )
  const query = {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'claude-windows-docker-loaded',
  } as const
  const before = resolveAuthority(full, query)
  const after = resolveAuthority(amended, query)
  // The named invariant: an extra corroborating sourceRef changes nothing about control, because
  // tier comes only from `authorityBasisRef`.
  assert.equal(after.outcome, before.outcome)
  assert.deepEqual([...after.controllingRuleIds], [...before.controllingRuleIds])
})

test('R4 retired-from-agent-reading rules never control authority', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  const amended = rechain(mutated)
  // Retirement REMOVES enforcement, so a retirement that is not fully evidenced and
  // digest-verified must not take effect. It is validity-blocking, which is the named property:
  // a retired rule can never end up controlling, because the document never becomes resolvable.
  const observed = validateRegistry(amended).violations.map((violation) => violation.code)
  assert.ok(
    observed.includes('RETIREMENT_EVIDENCE_INCOMPLETE') ||
      observed.includes('RETIREMENT_EVIDENCE_UNVERIFIED'),
    `expected a retirement objection; observed ${observed.join(',')}`,
  )
  const result = resolveAuthority(amended, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') {
    assert.equal(result.reasonCode, 'REGISTRY_INVALID')
  }
  assert.deepEqual([...result.controllingRuleIds], [])
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
    positiveRole: index === 11 ? 'coordinator' : index >= 7 && index <= 10 ? 'reviewer' : 'builder',
    negativeRole: index === 11 || (index >= 7 && index <= 10) ? 'builder' : 'reviewer',
  })),
  ...(
    [
      ['builder', 'coordinator'],
      ['builder', 'operator'],
      ['builder', 'reviewer'],
      ['builder', 'coordinator'],
      ['builder', 'coordinator'],
      ['builder', 'reviewer'],
      ['builder', 'reviewer'],
      ['builder', 'reviewer'],
      ['builder', 'reviewer'],
      ['builder', null],
      ['builder', 'coordinator'],
      ['coordinator', 'builder'],
      ['coordinator', 'builder'],
      ['builder', 'operator'],
      ['builder', 'operator'],
    ] as const
  ).map(([positiveRole, negativeRole], index) => ({
    ruleId: `rule.parcel-driven-development.hard-rule-${index + 1}`,
    positiveRole,
    negativeRole,
  })),
]

for (const vector of applicabilityVectors) {
  test(`R4 source-derived applicability vector ${vector.ruleId}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === vector.ruleId)
    assert.ok(rule)
    assert.ok(
      rule.applicability.roles.includes('any') ||
        rule.applicability.roles.includes(vector.positiveRole as never),
    )
    if (vector.negativeRole === null) {
      assert.deepEqual(rule.applicability.roles, ['any'])
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
  assert.deepEqual(rule.applicability.roles, ['any'])
  assert.deepEqual(rule.applicability.stages, ['any'])
  assert.deepEqual(rule.applicability.operations, ['any'])
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
    const basis = normalizeRuleText(item.normalizedExcerpt)
    const statement = normalizeRuleText(rule.normalizedStatement)
    if (item.ruleIds.length > 1) assert.ok(basis.includes(statement), rule.ruleId)
    else assert.equal(basis, statement)
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
  'rule.standing-constraints.constraint-1': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-2': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-3': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-4': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-5': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-6': [['builder'], ['any'], ['any']],
  'rule.standing-constraints.constraint-7': [['builder'], ['any'], ['control-call']],
  'rule.standing-constraints.constraint-8': [
    ['reviewer'],
    ['adversarial-review'],
    ['repo-read', 'repo-mutation', 'control-call'],
  ],
  'rule.standing-constraints.constraint-9': [
    ['reviewer'],
    ['adversarial-review'],
    ['repo-read', 'repo-mutation', 'control-call'],
  ],
  'rule.standing-constraints.constraint-10': [
    ['reviewer'],
    ['adversarial-review'],
    ['repo-read', 'repo-mutation', 'control-call'],
  ],
  'rule.standing-constraints.constraint-11': [
    ['reviewer'],
    ['adversarial-review'],
    ['repo-read', 'repo-mutation', 'control-call'],
  ],
  'rule.standing-constraints.constraint-12': [
    ['coordinator'],
    ['deterministic-verify', 'adversarial-review'],
    ['source-inventory', 'repo-read', 'repo-mutation'],
  ],
  'rule.standing-constraints.constraint-13': [['builder'], ['any'], ['any']],
  'rule.parcel-driven-development.hard-rule-1': [
    ['shaper', 'builder'],
    ['shaping', 'step-zero', 'build'],
    ['any'],
  ],
  'rule.parcel-driven-development.hard-rule-2': [
    ['coordinator', 'shaper', 'builder', 'reviewer'],
    ['shaping', 'step-zero', 'build', 'adversarial-review'],
    ['any'],
  ],
  'rule.parcel-driven-development.hard-rule-3': [
    ['shaper', 'builder'],
    ['shaping', 'step-zero', 'build'],
    ['any'],
  ],
  'rule.parcel-driven-development.hard-rule-4': [
    ['shaper', 'builder'],
    ['shaping', 'step-zero', 'build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-5': [
    ['shaper', 'builder'],
    ['shaping', 'step-zero', 'build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-6': [
    ['coordinator', 'builder'],
    ['build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-7': [
    ['builder', 'ci'],
    ['build', 'deterministic-verify'],
    ['any'],
  ],
  'rule.parcel-driven-development.hard-rule-8': [['builder'], ['build'], ['repo-mutation']],
  'rule.parcel-driven-development.hard-rule-9': [
    ['coordinator', 'builder'],
    ['build'],
    ['repo-mutation'],
  ],
  'rule.parcel-driven-development.hard-rule-10': [['any'], ['any'], ['any']],
  'rule.parcel-driven-development.hard-rule-11': [
    ['shaper', 'builder', 'reviewer'],
    ['shaping', 'step-zero', 'build', 'adversarial-review'],
    ['any'],
  ],
  'rule.parcel-driven-development.hard-rule-12': [
    ['coordinator', 'reviewer', 'ci'],
    ['deterministic-verify', 'adversarial-review', 'merge'],
    ['state-transition'],
  ],
  'rule.parcel-driven-development.hard-rule-13': [
    ['coordinator'],
    ['build', 'merge', 'closure'],
    ['state-transition'],
  ],
  'rule.parcel-driven-development.hard-rule-14': [
    ['coordinator', 'builder', 'reviewer', 'ci'],
    ['deterministic-verify', 'adversarial-review', 'merge'],
    ['source-inventory', 'state-transition'],
  ],
  'rule.parcel-driven-development.hard-rule-15': [
    ['coordinator', 'builder', 'reviewer', 'ci'],
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
    assert.deepEqual(rule.applicability.hosts, ['any'])
    const concreteRoles = [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ] as const
    const concreteStages = [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ] as const
    const concreteOperations = [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ] as const
    const concreteHosts = [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ] as const
    const roles: readonly AuthorityQuery['role'][] = expected[0].includes('any' as never)
      ? concreteRoles
      : (expected[0] as readonly AuthorityQuery['role'][])
    const stages: readonly AuthorityQuery['stage'][] = expected[1].includes('any' as never)
      ? concreteStages
      : (expected[1] as readonly AuthorityQuery['stage'][])
    const operations: readonly AuthorityQuery['operation'][] = expected[2].includes('any' as never)
      ? concreteOperations
      : (expected[2] as readonly AuthorityQuery['operation'][])
    for (const role of roles) {
      for (const stage of stages) {
        for (const operation of operations) {
          for (const host of concreteHosts) {
            const positive = resolveAuthority(full, {
              authoritySubject: rule.authoritySubject,
              goal: 'foreman-kernel',
              role,
              stage,
              operation,
              host,
            })
            assert.equal(
              positive.outcome,
              'RESOLVED',
              `${ruleId}:${role}:${stage}:${operation}:${host}`,
            )
            if (positive.outcome === 'RESOLVED') {
              assert.deepEqual(positive.controllingRuleIds, [ruleId])
            }
          }
        }
      }
    }
  })
}

test('R6 published rules never expose hash-derived or fallback semantic identities', () => {
  for (const rule of full.rules) {
    assert.doesNotMatch(rule.authoritySubject, /(?:^|\.)[0-9a-f]{12}(?:$|\.)/)
    assert.doesNotMatch(rule.authorityClaim, /^requires-[0-9a-f]{12}$/)
    const sourceId = rule.ruleId.split('.').slice(1, -1).join('.')
    assert.notEqual(rule.authoritySubject.startsWith(`${sourceId}.`), true, rule.ruleId)
  }
})

test('R6 every inventory item is either curated into rules or explicitly excluded', () => {
  for (const source of full.sources) {
    for (const item of source.inventoryItems) {
      assert.equal(
        item.ruleIds.length === 0,
        item.exclusionDisposition !== null,
        `${source.sourceId}:${item.itemId}`,
      )
      if (item.ruleIds.length === 0) assert.ok(item.rationale.length >= 24)
    }
  }
})

test('R6 structural TypeScript coverage items are exclusions, not pseudo-authority', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'spec-linter-validator')
  assert.ok(source)
  const imports = source.inventoryItems.filter((item) =>
    item.locator.anchor.startsWith('ts-import:'),
  )
  assert.ok(imports.length > 0)
  for (const item of imports) {
    assert.deepEqual(item.ruleIds, [])
    assert.equal(item.exclusionDisposition, 'structural-ast')
  }
})

test('R6 coordinated fallback semantic replacement is rejected as uncurated', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  assert.ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'fk-charter.deadbeefcafe'
  ;(rule as { authorityClaim: string }).authorityClaim = 'requires-deadbeefcafe'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'RULE_SEMANTICS_UNCURATED')
})

for (const reconciliationId of [
  'gate-namespace-count',
  'gate3-delegation',
  'spec-linter-profile-behavior',
  'surfaces-allowed-files',
  'permission-profile-enforcement-bound',
  'missing-provenance-reference',
  'registry-rework-6eb1c25',
  'registry-rework-9285945',
  'registry-rework-6f45963',
  'registry-rework-b414d06',
  'registry-rework-00b41b7',
] as const) {
  test(`R6 reconciliation ${reconciliationId} rejects appended evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    assert.ok(record)
    ;(record.observedEvidence as { kind: string; reference: string; digest: string }[]).push({
      kind: 'source-ref',
      reference: canonicalJson(record.observedRefs[0]),
      digest: sha256(canonicalJson(record.observedRefs[0])),
    })
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })

  test(`R6 reconciliation ${reconciliationId} rejects removed evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    assert.ok(record)
    ;(record.observedEvidence as unknown[]).splice(0, 1)
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })

  test(`R6 reconciliation ${reconciliationId} rejects duplicated evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    assert.ok(record)
    const evidence = record.observedEvidence[0]
    assert.ok(evidence)
    ;(record.observedEvidence as unknown[]).splice(1, 0, structuredClone(evidence))
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })

  test(`R6 reconciliation ${reconciliationId} rejects substituted evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    assert.ok(record)
    const evidence = record.observedEvidence[0]
    assert.ok(evidence)
    const reference = `${evidence.reference}#substituted`
    ;(record.observedEvidence as { kind: string; reference: string; digest: string }[])[0] = {
      kind: evidence.kind,
      reference,
      digest: sha256(reference),
    }
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

for (const vector of [
  {
    name: 'standing rule 12 coordinator Stage E repository read',
    ruleId: 'rule.standing-constraints.constraint-12',
    role: 'coordinator',
    stage: 'adversarial-review',
    operation: 'repo-read',
  },
  {
    name: 'PDD rule 1 shaper shaping source inventory',
    ruleId: 'rule.parcel-driven-development.hard-rule-1',
    role: 'shaper',
    stage: 'shaping',
    operation: 'source-inventory',
  },
  {
    name: 'PDD rule 7 builder build verification read',
    ruleId: 'rule.parcel-driven-development.hard-rule-7',
    role: 'builder',
    stage: 'build',
    operation: 'repo-read',
  },
  {
    name: 'PDD rule 12 reviewer merge security transition',
    ruleId: 'rule.parcel-driven-development.hard-rule-12',
    role: 'reviewer',
    stage: 'merge',
    operation: 'state-transition',
  },
  {
    name: 'PDD rule 10 operator runtime external write',
    ruleId: 'rule.parcel-driven-development.hard-rule-10',
    role: 'operator',
    stage: 'runtime',
    operation: 'external-write',
  },
] as const) {
  test(`R6 natural applicability query: ${vector.name}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === vector.ruleId)
    assert.ok(rule)
    const result = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: vector.role,
      stage: vector.stage,
      operation: vector.operation,
      host: 'provider-neutral',
    })
    assert.equal(result.outcome, 'RESOLVED')
    if (result.outcome === 'RESOLVED') assert.deepEqual(result.controllingRuleIds, [vector.ruleId])
  })
}

type R13AuditRecord = {
  readonly sourceId: string
  readonly itemId: string
  readonly valueDigest: string
  readonly disposition: 'publish' | 'exclude'
  readonly ruleIds: readonly string[]
  readonly exclusionCode: InventoryItem['exclusionDisposition']
  readonly rationale: string
}

function r13Audit(document: AuthorityEnforcementRegistry = full): R13AuditRecord[] {
  return (
    (
      document as AuthorityEnforcementRegistry & {
        readonly normativeMarkdownAudit?: readonly R13AuditRecord[]
      }
    ).normativeMarkdownAudit?.slice() ?? []
  )
}

test('R13 normative Markdown audit has exactly 146 source-authored records', () => {
  assert.equal(r13Audit().length, 146)
})

test('R13 normative Markdown audit binds every candidate to its exact item and value', () => {
  for (const record of r13Audit()) {
    const source = full.sources.find((candidate) => candidate.sourceId === record.sourceId)
    const item = source?.inventoryItems.find((candidate) => candidate.itemId === record.itemId)
    assert.ok(item, `${record.sourceId}:${record.itemId}`)
    assert.equal(record.valueDigest, item.valueDigest, `${record.sourceId}:${record.itemId}`)
    assert.deepEqual(record.ruleIds, item.ruleIds, `${record.sourceId}:${record.itemId}`)
  }
})

const r13NamedPublications = [
  ['conflict stop', 'No implementation parcel may silently choose among contradictory authorities'],
  [
    'secret persistence',
    'Raw credentials, prompts, source payloads, and secrets are not persisted',
  ],
  ['unenrolled detected-only posture', 'are detected by enrollment heartbeat and CI'],
  ['generic mint prohibition', 'generic or authoritative receipt minting'],
  [
    'agent gate prohibition',
    'Gate-1 approval, Gate-2 authorization, or Gate-3 merge through an agent-callable tool',
  ],
  ['external-write prohibition', 'Git commit/push/PR/merge, Jira mutation, cloud mutation'],
  ['isolated worktrees', 'All goal work uses isolated worktrees created from a verified base'],
  [
    'serialization ownership',
    'are serialization points and are assigned to only one active parcel at a time',
  ],
  ['pinned policy', 'built from committed source and pinned policies'],
  ['host evidence', 'no native-Linux-host or Codex enforcement claim is made without'],
  ['PDD environment release boundary', 'Do not treat local success as staging success'],
  ['PDD security release boundary', 'Do not downgrade severity without documented approval'],
] as const

for (const [name, fragment] of r13NamedPublications) {
  test(`R13 audit publishes ${name}`, () => {
    const matches = full.sources.flatMap((source) =>
      source.inventoryItems
        .filter((item) => item.normalizedExcerpt.includes(fragment))
        .map((item) => ({ source, item })),
    )
    assert.equal(matches.length, 1, fragment)
    const match = matches[0]
    assert.ok(match)
    const record = r13Audit().find(
      (candidate) =>
        candidate.sourceId === match.source.sourceId && candidate.itemId === match.item.itemId,
    )
    assert.ok(record, fragment)
    assert.equal(record.disposition, 'publish', fragment)
    assert.equal(record.exclusionCode, null, fragment)
    assert.ok(record.ruleIds.length > 0, fragment)
    assert.equal(match.item.exclusionDisposition, null, fragment)
  })
}

test('R13 every excluded audit candidate has one item-specific rationale', () => {
  const excluded = r13Audit().filter((record) => record.disposition === 'exclude')
  assert.ok(excluded.length > 0)
  for (const record of excluded) {
    assert.equal(record.ruleIds.length, 0, `${record.sourceId}:${record.itemId}`)
    assert.ok(record.exclusionCode !== null, `${record.sourceId}:${record.itemId}`)
    assert.ok(record.rationale.includes(record.itemId), `${record.sourceId}:${record.itemId}`)
    assert.ok(!/metadata, explanatory context, or duplicate provenance/i.test(record.rationale))
  }
})

const r13AuditMutations = [
  [
    'append',
    (records: R13AuditRecord[]) => records.push(structuredClone(records[0] as R13AuditRecord)),
  ],
  ['remove', (records: R13AuditRecord[]) => records.pop()],
  [
    'duplicate',
    (records: R13AuditRecord[]) =>
      records.splice(1, 0, structuredClone(records[0] as R13AuditRecord)),
  ],
  [
    'disposition',
    (records: R13AuditRecord[]) => {
      const record = records.find((candidate) => candidate.disposition === 'exclude')
      assert.ok(record)
      ;(record as { disposition: 'publish' | 'exclude' }).disposition = 'publish'
    },
  ],
  [
    'rule set',
    (records: R13AuditRecord[]) => {
      const record = records.find((candidate) => candidate.disposition === 'publish')
      assert.ok(record)
      ;(record.ruleIds as string[]).push('rule.forged.audit')
    },
  ],
  [
    'value',
    (records: R13AuditRecord[]) => {
      ;(records[0] as { valueDigest: string }).valueDigest = 'f'.repeat(64)
    },
  ],
  [
    'rationale',
    (records: R13AuditRecord[]) => {
      ;(records[0] as { rationale: string }).rationale += ' substituted'
    },
  ],
] as const

for (const [name, mutate] of r13AuditMutations) {
  test(`R13 normative audit rejects ${name} mutation`, () => {
    const mutated = structuredClone(full)
    const records = r13Audit(mutated)
    ;(
      mutated as AuthorityEnforcementRegistry & { normativeMarkdownAudit: R13AuditRecord[] }
    ).normativeMarkdownAudit = records
    mutate(records)
    expectCode(mutated, 'RULE_SEMANTICS_UNCURATED')
  })
}

function expectRegistryInvalid(document: AuthorityEnforcementRegistry): void {
  const result = resolveAuthority(document, {
    authoritySubject: 'gate2.dispatch-grant',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'runtime',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.deepEqual(result, {
    outcome: 'REQUIRE_HUMAN',
    authoritySubject: 'gate2.dispatch-grant',
    reasonCode: 'REGISTRY_INVALID',
    controllingRuleIds: [],
    consideredRuleIds: [],
  })
}

// R14 BLOCKER 4: `resolveAuthority` is an exported API of a `risk: critical` package. A nullish or
// non-object query previously reached `queryIsValid` unguarded and threw `TypeError`, which a
// caller with a broad `catch` would turn a fail-closed gate into a fail-open one. Each shape is an
// independently named control per Standing Constraint #3 - checking one while assuming the rest is
// default-deny-with-exception, not default-deny.
for (const [label, malformed] of [
  ['null', null],
  ['undefined', undefined],
  ['a number', 42],
  ['a string', 'authority'],
  ['an array', []],
  ['an empty object', {}],
  ['a proto-polluted object', JSON.parse('{"__proto__":{"polluted":true}}') as unknown],
] as const) {
  test(`R14 resolveAuthority fails closed on ${label} instead of throwing`, () => {
    const result = resolveAuthority(full, malformed as unknown as AuthorityQuery)
    assert.equal(result.outcome, 'REQUIRE_HUMAN')
    if (result.outcome === 'REQUIRE_HUMAN') {
      assert.equal(result.reasonCode, 'INVALID_QUERY_SCOPE')
    }
    assert.deepEqual([...result.controllingRuleIds], [])
  })
}

// R14 fix 9: `RegExp.test` and `Array.prototype.includes` coerce, so a non-string axis could slip
// through. `authoritySubject: 1` stringified to "1", matched the subject pattern, and returned
// NO_APPLICABLE_AUTHORITY - fail-closed only by accident of cross-type comparison.
for (const axis of ['authoritySubject', 'goal', 'role', 'stage', 'operation', 'host'] as const) {
  test(`R14 resolveAuthority refuses a non-string ${axis} rather than coercing it`, () => {
    const query = {
      authoritySubject: 'gate3.merge-authority',
      goal: 'foreman-kernel',
      role: 'coordinator',
      stage: 'merge',
      operation: 'repo-mutation',
      host: 'provider-neutral',
    } as unknown as Record<string, unknown>
    query[axis] = 1
    const result = resolveAuthority(full, query as unknown as AuthorityQuery)
    assert.equal(result.outcome, 'REQUIRE_HUMAN')
    if (result.outcome === 'REQUIRE_HUMAN') {
      assert.equal(result.reasonCode, 'INVALID_QUERY_SCOPE')
    }
  })
}

test('R13 public resolver rejects a schema-invalid raw registry', () => {
  const mutated = structuredClone(full) as AuthorityEnforcementRegistry & { unexpected?: boolean }
  mutated.unexpected = true
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects widened Gate 2 applicability before resolution', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.fk-charter.15a44cf50bc6',
  )
  assert.ok(rule)
  ;(rule.applicability.roles as string[]).splice(0, rule.applicability.roles.length, 'any')
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects an unapproved ALLOW before resolution', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) =>
      candidate.classification === 'pre-action-refusal' && candidate.decision === 'REFUSE',
  )
  assert.ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  ;(rule as { refusalCode: string | null }).refusalCode = null
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects stale-source promotion before resolution', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-linter-readme')
  assert.ok(source)
  ;(source as { authorityEffect: string }).authorityEffect = 'binding'
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects recomputed-digest semantic mutation before resolution', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  assert.ok(rule)
  ;(rule as { authorityClaim: string }).authorityClaim = 'forged-recomputed-claim'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectRegistryInvalid(mutated)
})

test('R13 public resolver resolves only a completely validated registry', () => {
  assert.equal(validateRegistry(full).valid, true)
  const result = resolveAuthority(full, {
    authoritySubject: 'gate2.dispatch-grant',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'shaping',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome === 'RESOLVED') assert.equal(result.decision, 'ALLOW')
})

function permissionYamlRules() {
  return full.rules.filter(
    (rule) => rule.authorityBasisRef.sourceId === 'permission-profiles-registry',
  )
}

test('R13 permission YAML has exactly 34 path-keyed structural containers', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  const containers = source.inventoryItems.filter(
    (item) =>
      item.locator.anchor.startsWith('yaml-container:') &&
      item.exclusionDisposition === 'schema-container',
  )
  assert.equal(containers.length, 34)
})

test('R13 permission YAML excludes all six empty ask containers', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  const asks = source.inventoryItems.filter((item) => /:ask:\[\]$/.test(item.locator.anchor))
  assert.equal(asks.length, 6)
  assert.ok(
    asks.every(
      (item) => item.exclusionDisposition === 'schema-container' && item.ruleIds.length === 0,
    ),
  )
})

test('R13 permission YAML publishes exactly 54 mediated restrictions', () => {
  const restrictions = permissionYamlRules().filter(
    (rule) => rule.classification === 'pre-action-refusal',
  )
  assert.equal(restrictions.length, 54)
  assert.ok(restrictions.every((rule) => rule.enforcementOwner === 'host-adapter'))
  assert.ok(restrictions.every((rule) => rule.assurance === 'mediated'))
})

test('R13 permission YAML publishes exactly 51 narrative documentation rules', () => {
  const narrative = permissionYamlRules().filter(
    (rule) => rule.classification === 'narrative-provenance',
  )
  assert.equal(narrative.length, 51)
  assert.ok(narrative.every((rule) => rule.decision === 'ADVISORY'))
  assert.ok(narrative.every((rule) => rule.enforcementOwner === 'provenance-only'))
  assert.ok(narrative.every((rule) => rule.assurance === 'narrative'))
})

test('R13 permission YAML publishes zero CI rules', () => {
  assert.equal(
    permissionYamlRules().filter((rule) => rule.classification === 'ci-static-check').length,
    0,
  )
})

test('R13 permission YAML publishes all 49 allow leaves as nonbinding documentation', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  const allowRules = permissionYamlRules().filter((rule) =>
    source.inventoryItems
      .find((item) => item.itemId === rule.authorityBasisRef.itemId)
      ?.locator.anchor.includes(':allow:'),
  )
  assert.equal(allowRules.length, 49)
  assert.ok(allowRules.every((rule) => rule.classification === 'narrative-provenance'))
})

test('R13 builder-deps allowlist and note remain advisory documentation', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  const targets = source.inventoryItems.filter(
    (item) =>
      item.locator.anchor === 'yaml-rule:builder-deps:network/egress' ||
      item.locator.anchor === 'yaml-rule:builder-deps:network/notes',
  )
  assert.equal(targets.length, 2)
  for (const item of targets) {
    assert.equal(item.ruleIds.length, 1)
    const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
    assert.ok(rule)
    assert.equal(rule.classification, 'narrative-provenance')
    assert.equal(rule.decision, 'ADVISORY')
  }
})

test('R13 every permission rule has exact YAML basis and profile-scoped applicability', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  for (const rule of permissionYamlRules()) {
    const item: InventoryItem | undefined = source.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    assert.ok(item, rule.ruleId)
    assert.equal(rule.authorityBasisRef.locatorDigest, locatorDigestFor(item.locator), rule.ruleId)
    assert.equal(rule.authorityBasisRef.valueDigest, item.valueDigest, rule.ruleId)
    assert.ok(!rule.applicability.roles.includes('any'), rule.ruleId)
    assert.ok(!rule.applicability.roles.includes('developer'), rule.ruleId)
  }
})

test('R13 preserves every R1-R12 reconciliation record byte-semantically', () => {
  const expected: Readonly<Record<string, string>> = {
    'gate-namespace-count': '23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3',
    'gate3-delegation': '13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6',
    'spec-linter-profile-behavior':
      '48c147ae850d5779e763c187ee9381bc2b824e299764eeb15869f57dce2e553c',
    'surfaces-allowed-files': 'c7addc8070757f6da21ae15354139d2a39c6f5db2dc164d2534305e0f944d7c1',
    'permission-profile-enforcement-bound':
      '6558689b94ae965d85c60cef8cc7d9086278f38c755276b74953d2613440eda2',
    'missing-provenance-reference':
      'ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80',
    'registry-rework-6eb1c25': 'c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d',
    'registry-rework-9285945': 'fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1',
    'registry-rework-6f45963': '3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9',
    'registry-rework-b414d06': '8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f',
    'registry-rework-00b41b7': '7113ebbad6811a3dfd4f14302f736ac11074c04943686eea28a1de820c75e9c9',
    'registry-rework-37afc65': '5f3bba04f9177884da88d21a8535d3ebc04557252aa27b30cbb191824e0b0f17',
    'registry-rework-91145d7': '6b6e2dbd3b009428c647ed8947ba5d7008445dabdcccdde7d135466b9f46f3e3',
    'registry-rework-1b42f4b': '14bb9b5739d37281619e6ace7ea9e5d0f6fd0febeecf3facc892e1a606795a56',
    'registry-rework-ee29973': 'b9a3ed7f9eaa25468df8557fb812ae343910a481450411928b8abe5d4e216bb3',
    'registry-rework-544d8a3': 'd04e710f14c6f7b9978662161c1bba011a11fe862138dd73e5e477594751fd9d',
  }
  assert.deepEqual(
    Object.fromEntries(
      full.reconciliations
        .filter((record) => expected[record.reconciliationId] !== undefined)
        .map((record) => [record.reconciliationId, sha256(canonicalJson(record))]),
    ),
    expected,
  )
})

test('R13 ships an exact typed migration from the rejected R12 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-0683bc0',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['0683bc059ec54a8652624fd2b7be72fe157cac14', '51857a3a7796b393c0c0a68712f98c06e7015d79'],
  )
})

const r13EvidenceMutations = [
  ['append', (items: unknown[]) => items.push(structuredClone(items[0]))],
  ['remove', (items: unknown[]) => items.pop()],
  ['duplicate', (items: unknown[]) => items.splice(1, 0, structuredClone(items[0]))],
  [
    'substitute',
    (items: unknown[]) => {
      const evidence = items[0] as { kind: string; reference: string; digest: string }
      const reference = `${evidence.reference}#r13-substituted`
      items[0] = { kind: evidence.kind, reference, digest: sha256(reference) }
    },
  ],
] as const

for (const [name, mutate] of r13EvidenceMutations) {
  test(`R13 registry-rework-0683bc0 rejects ${name} evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === 'registry-rework-0683bc0',
    )
    assert.ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

function publishedRuleContaining(sourceId: string, fragment: string) {
  const source = full.sources.find((candidate) => candidate.sourceId === sourceId)
  assert.ok(source)
  const matches = source.inventoryItems.filter(
    (item) => item.normalizedExcerpt.includes(fragment) && item.ruleIds.length === 1,
  )
  assert.equal(matches.length, 1, `${sourceId}:${fragment}`)
  const rule = full.rules.find((candidate) => candidate.ruleId === matches[0]?.ruleIds[0])
  assert.ok(rule)
  return rule
}

function resolveNatural(
  authoritySubject: string,
  role: AuthorityQuery['role'],
  stage: AuthorityQuery['stage'],
  operation: AuthorityQuery['operation'],
  host: AuthorityQuery['host'] = 'provider-neutral',
) {
  return resolveAuthority(full, {
    authoritySubject,
    goal: 'foreman-kernel',
    role,
    stage,
    operation,
    host,
  })
}

test('R10 goal skill Gate 1 is an operative nondelegable coordinator refusal', () => {
  const rule = publishedRuleContaining('goal-skill', 'This gate is never delegable')
  assert.equal(rule.authoritySubject, 'gate1.ratification-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability, {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['stage-zero'],
    operations: ['state-transition'],
    hosts: ['any'],
  })
  const positive = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'stage-zero',
    'state-transition',
    'ci',
  )
  assert.equal(positive.outcome, 'REQUIRE_HUMAN')
  assert.ok(positive.consideredRuleIds.includes(rule.ruleId))
  assert.equal(
    resolveNatural(
      rule.authoritySubject,
      'builder',
      'runtime',
      'external-write',
      'unsupported-host',
    ).outcome,
    'REQUIRE_HUMAN',
  )
})

test('R10 goal skill verification custody is an operative coordinator refusal', () => {
  const rule = publishedRuleContaining(
    'goal-skill',
    'You consume verification results; you never produce them.',
  )
  assert.equal(rule.authoritySubject, 'verification.issue-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.equal(
    resolveNatural(
      rule.authoritySubject,
      'coordinator',
      'deterministic-verify',
      'receipt-validation',
    ).outcome,
    'RESOLVED',
  )
})

test('R10 goal skill human-gate hook condition requires an agent-completable stop report', () => {
  const rule = publishedRuleContaining(
    'goal-skill',
    'Human gates (ratification, one-tap approval, merges, GitHub ruleset promotion, OAuth consent)',
  )
  assert.equal(rule.authoritySubject, 'goal.human-gate-stop')
  assert.equal(rule.classification, 'pre-action-refusal')
  const positive = resolveNatural(rule.authoritySubject, 'coordinator', 'merge', 'state-transition')
  assert.equal(positive.outcome, 'REQUIRE_HUMAN')
  assert.ok(positive.consideredRuleIds.includes(rule.ruleId))
})

test('R10 goal skill stop rule is operative and coordinator-scoped', () => {
  const rule = publishedRuleContaining('goal-skill', 'Stop the loop (ScheduleWakeup stop:true)')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability.roles, ['coordinator'])
  const outOfScope = resolveNatural(
    rule.authoritySubject,
    'builder',
    'runtime',
    'external-write',
    'unsupported-host',
  )
  // An unasserted reasonCode leaves REQUIRE_HUMAN ambiguous between NO_APPLICABLE_AUTHORITY,
  // INVALID_QUERY_SCOPE and REGISTRY_INVALID - which is how a test keeps passing after the
  // property it names stops holding. The registry is valid here, so the reason must be scope.
  assert.equal(outOfScope.outcome, 'REQUIRE_HUMAN')
  if (outOfScope.outcome === 'REQUIRE_HUMAN') {
    assert.equal(outOfScope.reasonCode, 'NO_APPLICABLE_AUTHORITY')
  }
})

test('R10 coordinator commentary cannot mutate ratified authority', () => {
  const rule = publishedRuleContaining('coordinator-pattern', 'Commentary is not a change request')
  assert.equal(rule.authoritySubject, 'canon.commentary-mutation-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  const positive = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'stage-zero',
    'spec-mutation',
  )
  assert.equal(positive.outcome, 'REQUIRE_HUMAN')
  assert.ok(positive.consideredRuleIds.includes(rule.ruleId))
  assert.equal(
    resolveNatural(
      rule.authoritySubject,
      'builder',
      'runtime',
      'external-write',
      'unsupported-host',
    ).outcome,
    'REQUIRE_HUMAN',
  )
})

test('R10 coordinator Gate 1 rule is nondelegable and precisely scoped', () => {
  const rule = publishedRuleContaining('coordinator-pattern', 'This gate can never be delegated')
  assert.equal(rule.authoritySubject, 'gate1.ratification-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability.roles, ['coordinator'])
  assert.deepEqual(rule.applicability.stages, ['stage-zero'])
  assert.deepEqual(rule.applicability.operations, ['state-transition'])
})

test('R10 coordinator Gate 2 prose is superseded by the R12 advisory non-grant', () => {
  const rule = publishedRuleContaining(
    'coordinator-pattern',
    'standing authorization scoped to the charter',
  )
  assert.equal(rule.authoritySubject, 'gate2.dispatch-grant')
  assert.equal(rule.classification, 'narrative-provenance')
  assert.equal(rule.decision, 'ADVISORY')
  assert.ok(
    !resolveNatural(
      rule.authoritySubject,
      'coordinator',
      'shaping',
      'state-transition',
    ).consideredRuleIds.includes(rule.ruleId),
  )
})

test('R10 coordinator verification custody cannot be narrative advice', () => {
  const rule = publishedRuleContaining(
    'coordinator-pattern',
    'it never produces verification of its own work',
  )
  assert.equal(rule.authoritySubject, 'verification.issue-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.equal(
    resolveNatural(
      rule.authoritySubject,
      'coordinator',
      'deterministic-verify',
      'receipt-validation',
    ).outcome,
    'RESOLVED',
  )
})

test('R10 coordinator ownership rule is an operative state-transition refusal', () => {
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.coordinator-pattern.47b2eaa2f9ef.ownership',
  )
  assert.ok(rule)
  assert.equal(rule.authoritySubject, 'goal.coordinator-ownership')
  assert.equal(rule.classification, 'pre-action-refusal')
  const positive = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'runtime',
    'state-transition',
  )
  assert.equal(positive.outcome, 'RESOLVED')
  assert.ok(positive.consideredRuleIds.includes(rule.ruleId))
  if (positive.outcome === 'RESOLVED') assert.equal(positive.decision, 'REFUSE')
})

test('R10 scoped Gate 1 reopening is operative rather than blanket narrative advice', () => {
  const rule = publishedRuleContaining(
    'coordinator-pattern',
    'When triage re-opens Gate 1 for specific decisions, the re-open is scoped',
  )
  assert.equal(rule.authoritySubject, 'gate1.scoped-reopen')
  assert.equal(rule.classification, 'pre-action-refusal')
  const positive = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'stage-zero',
    'state-transition',
  )
  assert.equal(positive.outcome, 'REQUIRE_HUMAN')
  assert.ok(positive.consideredRuleIds.includes(rule.ruleId))
})

const r10GoalCoordinatorRules = full.rules.filter(
  (rule) =>
    (rule.authorityBasisRef.sourceId === 'goal-skill' ||
      rule.authorityBasisRef.sourceId === 'coordinator-pattern') &&
    rule.classification !== 'narrative-provenance' &&
    rule.classification !== 'unsupported',
)

function firstConcrete<T extends string>(values: readonly string[], fallback: T): T {
  return (values.includes('any') ? fallback : values[0]) as T
}

test('R10 every operative goal and coordinator rule has a source-derived positive resolver vector', () => {
  for (const rule of r10GoalCoordinatorRules) {
    const query: AuthorityQuery = {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: firstConcrete(rule.applicability.roles, 'coordinator'),
      stage: firstConcrete(rule.applicability.stages, 'runtime'),
      operation: firstConcrete(rule.applicability.operations, 'state-transition'),
      host: firstConcrete(rule.applicability.hosts, 'provider-neutral'),
    }
    const result = resolveAuthority(full, query)
    assert.notEqual(result.outcome, 'CONFLICT', rule.ruleId)
    assert.ok(result.consideredRuleIds.includes(rule.ruleId), rule.ruleId)
  }
})

test('R10 every operative goal and coordinator rule has a source-derived negative resolver vector', () => {
  const concreteRoles = ROLE_SCOPES.filter((role) => role !== 'any')
  for (const rule of r10GoalCoordinatorRules) {
    const excludedRole = concreteRoles.find((role) => !rule.applicability.roles.includes(role))
    assert.ok(excludedRole, `${rule.ruleId} must preserve a source-narrowed role boundary`)
    const result = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: excludedRole,
      stage: firstConcrete(rule.applicability.stages, 'runtime'),
      operation: firstConcrete(rule.applicability.operations, 'state-transition'),
      host: firstConcrete(rule.applicability.hosts, 'provider-neutral'),
    })
    assert.ok(!result.consideredRuleIds.includes(rule.ruleId), rule.ruleId)
  }
})

for (const vector of [
  { name: 'repo mutation', operation: 'repo-mutation' },
  { name: 'state transition', operation: 'state-transition' },
] as const) {
  test(`R10 Gate 3 resolves the coordinator merge ${vector.name} refusal`, () => {
    const result = resolveNatural('gate3.merge-authority', 'coordinator', 'merge', vector.operation)
    assert.equal(result.outcome, 'RESOLVED')
    if (result.outcome === 'RESOLVED') {
      assert.equal(result.authorityClaim, 'human-owned-nondelegated')
    }
  })
}

test('R10 Gate 3 does not resolve for builder runtime external writes', () => {
  const result = resolveNatural(
    'gate3.merge-authority',
    'builder',
    'runtime',
    'external-write',
    'unsupported-host',
  )
  // An unasserted reasonCode leaves REQUIRE_HUMAN ambiguous between NO_APPLICABLE_AUTHORITY,
  // INVALID_QUERY_SCOPE and REGISTRY_INVALID - which is how a test keeps passing after the
  // property it names stops holding. The registry is valid here, so the reason must be scope.
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') {
    assert.equal(result.reasonCode, 'NO_APPLICABLE_AUTHORITY')
  }
})

test('R10 Gate 3 does not resolve for CI deterministic read queries', () => {
  const result = resolveNatural(
    'gate3.merge-authority',
    'ci',
    'deterministic-verify',
    'repo-read',
    'ci',
  )
  // An unasserted reasonCode leaves REQUIRE_HUMAN ambiguous between NO_APPLICABLE_AUTHORITY,
  // INVALID_QUERY_SCOPE and REGISTRY_INVALID - which is how a test keeps passing after the
  // property it names stops holding. The registry is valid here, so the reason must be scope.
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') {
    assert.equal(result.reasonCode, 'NO_APPLICABLE_AUTHORITY')
  }
})

test('R10 ships an exact typed migration from the R9 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-1b42f4b',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['89d7e4853a8fb0af3db68e9262e38833062fba77', '51857a3a7796b393c0c0a68712f98c06e7015d79'],
  )
  assert.equal(record.supersedingEvidence?.sourceId, 'coordinator-pattern')
})

const reworkIds = full.reconciliations
  .map((record) => record.reconciliationId)
  .filter((reconciliationId) => reconciliationId.startsWith('registry-rework-'))
assert.ok(reworkIds.includes('registry-rework-91145d7'))

const r10EvidenceMutations = [
  ['append', (items: unknown[]) => items.push(structuredClone(items[0]))],
  ['remove', (items: unknown[]) => items.splice(0, 1)],
  ['duplicate', (items: unknown[]) => items.splice(1, 0, structuredClone(items[0]))],
  [
    'substitute',
    (items: unknown[]) => {
      const evidence = items[0] as { kind: string; reference: string; digest: string }
      const reference = `${evidence.reference}#r10-substituted`
      items[0] = { kind: evidence.kind, reference, digest: sha256(reference) }
    },
  ],
] as const

for (const [name, mutate] of r10EvidenceMutations) {
  test(`R10 registry-rework-91145d7 rejects ${name} evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === 'registry-rework-91145d7',
    )
    assert.ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

test('R11 preserves every R1-R10 reconciliation record exactly', () => {
  const priorRecordDigests: Readonly<Record<string, string>> = {
    'gate-namespace-count': '23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3',
    'gate3-delegation': '13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6',
    'spec-linter-profile-behavior':
      '48c147ae850d5779e763c187ee9381bc2b824e299764eeb15869f57dce2e553c',
    'surfaces-allowed-files': 'c7addc8070757f6da21ae15354139d2a39c6f5db2dc164d2534305e0f944d7c1',
    'permission-profile-enforcement-bound':
      '6558689b94ae965d85c60cef8cc7d9086278f38c755276b74953d2613440eda2',
    'missing-provenance-reference':
      'ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80',
    'registry-rework-6eb1c25': 'c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d',
    'registry-rework-9285945': 'fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1',
    'registry-rework-6f45963': '3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9',
    'registry-rework-b414d06': '8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f',
    'registry-rework-00b41b7': '7113ebbad6811a3dfd4f14302f736ac11074c04943686eea28a1de820c75e9c9',
    'registry-rework-37afc65': '5f3bba04f9177884da88d21a8535d3ebc04557252aa27b30cbb191824e0b0f17',
    'registry-rework-91145d7': '6b6e2dbd3b009428c647ed8947ba5d7008445dabdcccdde7d135466b9f46f3e3',
    'registry-rework-1b42f4b': '14bb9b5739d37281619e6ace7ea9e5d0f6fd0febeecf3facc892e1a606795a56',
  }

  assert.deepEqual(
    Object.fromEntries(
      full.reconciliations
        .filter((record) => priorRecordDigests[record.reconciliationId] !== undefined)
        .map((record) => [record.reconciliationId, sha256(canonicalJson(record))]),
    ),
    priorRecordDigests,
  )
})

const r11CompoundClauses = [
  {
    suffix: 'ownership',
    subject: 'goal.coordinator-ownership',
    positive: {
      role: 'coordinator',
      stage: 'runtime',
      operation: 'state-transition',
    },
  },
  {
    suffix: 'frozen-contract',
    subject: 'goal.stop.ratified-boundary',
    positive: { role: 'coordinator', stage: 'runtime', operation: 'spec-mutation' },
  },
  {
    suffix: 'tripwire',
    subject: 'goal.stop.tripwire',
    positive: {
      role: 'coordinator',
      stage: 'runtime',
      operation: 'state-transition',
    },
  },
  {
    suffix: 'security-boundary',
    subject: 'goal.stop.security-boundary',
    positive: {
      role: 'coordinator',
      stage: 'runtime',
      operation: 'state-transition',
    },
  },
  {
    suffix: 'external-capability',
    subject: 'goal-stop.external-capability',
    positive: { role: 'coordinator', stage: 'runtime', operation: 'external-write' },
  },
  {
    suffix: 'empty-queue',
    subject: 'goal.stop.incomplete-empty-queue',
    positive: {
      role: 'coordinator',
      stage: 'runtime',
      operation: 'state-transition',
    },
  },
] as const satisfies readonly {
  suffix: string
  subject: string
  positive: {
    role: AuthorityQuery['role']
    stage: AuthorityQuery['stage']
    operation: AuthorityQuery['operation']
  }
}[]

function r11CompoundItem() {
  const source = full.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.47b2eaa2f9ef')
  assert.ok(item)
  return item
}

for (const clause of r11CompoundClauses) {
  test(`R11 compound coordinator paragraph publishes ${clause.suffix} independently`, () => {
    const item = r11CompoundItem()
    const ruleId = `rule.coordinator-pattern.47b2eaa2f9ef.${clause.suffix}`
    assert.ok(item.ruleIds.includes(ruleId))
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule)
    assert.equal(rule.authoritySubject, clause.subject)
    assert.equal(rule.classification, 'pre-action-refusal')
    assert.equal(rule.decision, 'REFUSE')
  })

  test(`R11 compound coordinator ${clause.suffix} has an explicit source-authored positive query`, () => {
    const ruleId = `rule.coordinator-pattern.47b2eaa2f9ef.${clause.suffix}`
    const result = resolveAuthority(full, {
      authoritySubject: clause.subject,
      goal: 'foreman-kernel',
      ...clause.positive,
      host: 'provider-neutral',
    })
    assert.equal(result.outcome, 'RESOLVED')
    assert.ok(result.consideredRuleIds.includes(ruleId))
  })

  test(`R11 compound coordinator ${clause.suffix} has an explicit source-authored negative query`, () => {
    const ruleId = `rule.coordinator-pattern.47b2eaa2f9ef.${clause.suffix}`
    const result = resolveAuthority(full, {
      authoritySubject: clause.subject,
      goal: 'foreman-kernel',
      role: 'builder',
      stage: 'runtime',
      operation: clause.positive.operation,
      host: 'provider-neutral',
    })
    assert.ok(!result.consideredRuleIds.includes(ruleId))
  })
}

const r11ProtectedBlocks = [
  {
    name: 'SPEC-CONVENTION exact Allowed Files block',
    sourceId: 'spec-convention',
    itemId: 'item.276e79bdc002',
    complete:
      'Entries are exact repo-relative paths; globs and directory-wide shorthand are prohibited.',
  },
  {
    name: 'SPEC-CONVENTION stop and no-self-expansion block',
    sourceId: 'spec-convention',
    itemId: 'item.c4828bcd6dfa',
    complete: 'An agent must not expand its own authority because a related edit appears useful.',
  },
  {
    name: 'PDD approved-contract mutation block',
    sourceId: 'parcel-driven-development',
    itemId: 'item.78ff0093607e',
    complete: 'Agents do not edit approved contracts directly from parcel branches.',
  },
  {
    name: 'PDD mandatory session-handoff block',
    sourceId: 'parcel-driven-development',
    itemId: 'item.cef628a1fce0',
    complete:
      'Every agent session that changes code, docs, config, contracts, or evidence must produce a session handoff.',
  },
] as const

for (const block of r11ProtectedBlocks) {
  test(`R11 publishes the complete protected block: ${block.name}`, () => {
    const source = full.sources.find((candidate) => candidate.sourceId === block.sourceId)
    const item = source?.inventoryItems.find((candidate) => candidate.itemId === block.itemId)
    assert.ok(item)
    assert.equal(item.exclusionDisposition, null)
    assert.ok(item.ruleIds.length > 0)
    assert.ok(item.normalizedExcerpt.includes(block.complete))
    const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
    assert.ok(rule)
    assert.equal(rule.authorityBasisRef.itemId, block.itemId)
    assert.equal(rule.normalizedStatement, item.normalizedExcerpt)
  })
}

test('R11 protected normative blocks reject exclusion', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.276e79bdc002')
  assert.ok(item)
  ;(item.ruleIds as string[]).splice(0)
  ;(item as { exclusionDisposition: string | null }).exclusionDisposition =
    'non-normative-explanation'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R11 protected normative blocks reject first-line truncation', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.c4828bcd6dfa')
  assert.ok(item)
  ;(item as { normalizedExcerpt: string }).normalizedExcerpt =
    'If implementation requires a path not listed in `Allowed Files`, work stops'
  ;(item as { valueDigest: string }).valueDigest = sha256(item.normalizedExcerpt)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R11 protected normative blocks reject a nearby-item authority-basis substitution', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find(
    (candidate) => candidate.sourceId === 'parcel-driven-development',
  )
  const protectedItem = source?.inventoryItems.find(
    (candidate) => candidate.itemId === 'item.cef628a1fce0',
  )
  const nearby = source?.inventoryItems.find(
    (candidate) => candidate.itemId !== protectedItem?.itemId && candidate.ruleIds.length > 0,
  )
  const rule = mutated.rules.find((candidate) => candidate.ruleId === protectedItem?.ruleIds[0])
  assert.ok(source)
  assert.ok(protectedItem)
  assert.ok(nearby)
  assert.ok(rule)
  const substitute = {
    sourceId: source.sourceId,
    itemId: nearby.itemId,
    locatorDigest: locatorDigestFor(nearby.locator),
    valueDigest: nearby.valueDigest,
  }
  ;(rule as { authorityBasisRef: typeof substitute }).authorityBasisRef = substitute
  ;(rule.sourceRefs as (typeof substitute)[]).splice(0, 1, substitute)
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

function r11ProfileRestrictions() {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  return full.rules.filter((rule) => {
    if (rule.authorityBasisRef.sourceId !== source.sourceId) return false
    const item = source.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    return (
      item?.locator.anchor.includes(':deny:') === true ||
      (item?.locator.anchor.endsWith(':network/egress') === true &&
        item.normalizedExcerpt === '"denied"')
    )
  })
}

test('R11 all 54 permission-profile restrictions have precise mediated loaded-host scope', () => {
  const restrictions = r11ProfileRestrictions()
  assert.equal(restrictions.length, 54)
  for (const rule of restrictions) {
    assert.equal(rule.classification, 'pre-action-refusal', rule.ruleId)
    assert.equal(rule.decision, 'REFUSE', rule.ruleId)
    assert.equal(rule.enforcementOwner, 'host-adapter', rule.ruleId)
    assert.equal(rule.assurance, 'mediated', rule.ruleId)
    assert.deepEqual(rule.applicability.hosts, ['claude-windows-docker-loaded'], rule.ruleId)
    assert.equal(rule.applicability.roles.length, 1, rule.ruleId)
    assert.ok(!rule.applicability.stages.includes('any'), rule.ruleId)
    assert.equal(rule.applicability.operations.length, 1, rule.ruleId)
  }
})

const r11ProfileRuleId = 'rule.permission-profiles-registry.7faf78a6f54a'

test('R11 loaded builder profile denial resolves only through mediated host authority', () => {
  const rule = full.rules.find((candidate) => candidate.ruleId === r11ProfileRuleId)
  assert.ok(rule)
  const result = resolveAuthority(full, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'external-write',
    host: 'claude-windows-docker-loaded',
  })
  assert.equal(result.outcome, 'RESOLVED')
  assert.ok(result.controllingRuleIds.includes(rule.ruleId))
})

for (const vector of [
  { name: 'unenrolled host', role: 'builder', host: 'claude-windows-docker-unenrolled' },
  { name: 'unsupported host', role: 'builder', host: 'unsupported-host' },
  { name: 'CI host', role: 'builder', host: 'ci' },
  { name: 'wrong role', role: 'developer', host: 'claude-windows-docker-loaded' },
] as const) {
  test(`R11 permission-profile authority excludes ${vector.name}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === r11ProfileRuleId)
    assert.ok(rule)
    const result = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: vector.role,
      stage: 'build',
      operation: 'external-write',
      host: vector.host,
    })
    assert.equal(result.outcome, 'REQUIRE_HUMAN')
    assert.ok(!result.consideredRuleIds.includes(rule.ruleId))
  })
}

const r12Gate2RuleIds = [
  'rule.fk-charter.15a44cf50bc6',
  'rule.fk-loop-directive.47a75730afd6',
  'rule.fk-loop-directive.bfffee6d7c1f',
] as const

test('R12 exact three binding Gate 2 rules use ALLOW with no refusal code', () => {
  for (const ruleId of r12Gate2RuleIds) {
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule, ruleId)
    assert.equal(rule.decision, 'ALLOW', ruleId)
    assert.equal(rule.refusalCode, null, ruleId)
  }
})

test('R11 resolver propagates the controlling Gate 2 ALLOW decision', () => {
  const result = resolveNatural(
    'gate2.dispatch-grant',
    'coordinator',
    'shaping',
    'state-transition',
  )
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome === 'RESOLVED') assert.equal(result.decision, 'ALLOW')
})

test('R11 resolver returns conflict for same highest-tier claim with different decisions', () => {
  const mutated = structuredClone(full)
  const original = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.fk-charter.15a44cf50bc6',
  )
  assert.ok(original)
  const conflicting = structuredClone(original)
  ;(conflicting as { ruleId: string }).ruleId = `${original.ruleId}.decision-conflict`
  ;(conflicting as { decision: string }).decision = 'REFUSE'
  ;(conflicting as { refusalCode: string | null }).refusalCode = 'FK_GATE2_CONFLICT_REFUSED'
  ;(conflicting as { bindingDigest: string }).bindingDigest = bindingDigestFor(conflicting)
  ;(mutated.rules as AuthorityRule[]).push(conflicting)
  const source = mutated.sources.find(
    (candidate) => candidate.sourceId === original.authorityBasisRef.sourceId,
  )
  const item = source?.inventoryItems.find(
    (candidate) => candidate.itemId === original.authorityBasisRef.itemId,
  )
  assert.ok(item)
  ;(item.ruleIds as string[]).push(conflicting.ruleId)
  const result = resolveAuthority(mutated, {
    authoritySubject: original.authoritySubject,
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'shaping',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  if (result.outcome === 'REQUIRE_HUMAN') assert.equal(result.reasonCode, 'REGISTRY_INVALID')
})

test('R11 validator rejects any unapproved ALLOW rule', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) =>
      candidate.classification === 'pre-action-refusal' &&
      !r12Gate2RuleIds.includes(candidate.ruleId as (typeof r12Gate2RuleIds)[number]),
  )
  assert.ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  ;(rule as { refusalCode: string | null }).refusalCode = null
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R12 the complete ALLOW set contains exactly the three binding Gate 2 grants', () => {
  assert.deepEqual(
    full.rules.filter((rule) => rule.decision === 'ALLOW').map((rule) => rule.ruleId),
    [...r12Gate2RuleIds],
  )
})

test('R12 coordinator-pattern delegation guidance remains an advisory non-grant', () => {
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.coordinator-pattern.91dd60b00fd6',
  )
  assert.ok(rule)
  assert.equal(rule.classification, 'narrative-provenance')
  assert.equal(rule.decision, 'ADVISORY')
  assert.equal(rule.enforcementOwner, 'provenance-only')
  assert.equal(rule.assurance, 'narrative')
  const resolution = resolveNatural(
    'gate2.dispatch-grant',
    'coordinator',
    'shaping',
    'state-transition',
  )
  // Amended AC5: historical/generic rules "remain visible and appear in `consideredRuleIds`
  // without exception or hand-placed exclusion". Visibility is the property; non-grant is proved
  // by the four assertions above plus its absence from `controllingRuleIds`.
  assert.equal(resolution.outcome, 'RESOLVED')
  assert.ok(resolution.consideredRuleIds.includes(rule.ruleId))
  if (resolution.outcome === 'RESOLVED') {
    assert.ok(!resolution.controllingRuleIds.includes(rule.ruleId))
  }
})

test('R12 a fourth corroborating or unratified ALLOW is rejected', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.coordinator-pattern.91dd60b00fd6',
  )
  assert.ok(rule)
  ;(rule as { classification: string }).classification = 'pre-action-refusal'
  ;(rule as { decision: string }).decision = 'ALLOW'
  ;(rule as { refusalCode: string | null }).refusalCode = null
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'kernel-policy'
  ;(rule as { assurance: string }).assurance = 'structural'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

function r12ProfileSource() {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  assert.ok(source)
  return source
}

test('R12 every permission-profile header and container is structural excluded inventory', () => {
  const source = r12ProfileSource()
  const headers = source.inventoryItems.filter((item) =>
    /^\s{2}[a-z][a-z-]+:$/.test(item.locator.anchor),
  )
  assert.equal(headers.length, 6)
  for (const item of headers) {
    assert.deepEqual(item.ruleIds, [], item.itemId)
    assert.equal(item.exclusionDisposition, 'non-normative-explanation', item.itemId)
  }
})

test('R12 obsolete builder-architecture profile-header rule is absent', () => {
  const source = r12ProfileSource()
  const header = source.inventoryItems.find((item) => item.itemId === 'item.ffd2209ab94a')
  assert.ok(header)
  assert.deepEqual(header.ruleIds, [])
  assert.equal(header.normalizedExcerpt, 'builder-architecture:')
  assert.ok(
    !full.rules.some((rule) => rule.ruleId === 'rule.permission-profiles-registry.ffd2209ab94a'),
  )
})

test('R12 reviewer git-commit denial binds only its canonical YAML rule item', () => {
  const source = r12ProfileSource()
  const item = source.inventoryItems.find((candidate) => candidate.itemId === 'item.35cf0f58fc34')
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.permission-profiles-registry.35cf0f58fc34',
  )
  assert.ok(item)
  assert.ok(rule)
  assert.equal(item.locator.kind, 'symbol')
  assert.equal(item.locator.anchor, 'yaml-rule:reviewer-readonly:deny:"Bash(git commit*)"')
  assert.equal(item.normalizedExcerpt, '"Bash(git commit*)"')
  assert.equal(rule.authorityBasisRef.itemId, item.itemId)
  assert.equal(rule.authorityBasisRef.locatorDigest, locatorDigestFor(item.locator))
  assert.deepEqual(item.ruleIds, [rule.ruleId])
})

test('R12 a permission-profile claim based on a structural header is rejected', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  const header = source?.inventoryItems.find(
    (candidate) => candidate.itemId === 'item.ffd2209ab94a',
  )
  const rule = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.permission-profiles-registry.35cf0f58fc34',
  )
  assert.ok(source)
  assert.ok(header)
  assert.ok(rule)
  const headerRef = {
    sourceId: source.sourceId,
    itemId: header.itemId,
    locatorDigest: locatorDigestFor(header.locator),
    valueDigest: header.valueDigest,
  }
  ;(rule as { authorityBasisRef: typeof headerRef }).authorityBasisRef = headerRef
  ;(rule.sourceRefs as (typeof headerRef)[]).splice(0, 1, headerRef)
  ;(rule as { normalizedStatement: string }).normalizedStatement = header.normalizedExcerpt
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R12 rejects a content-derived legacy item ID on a published Markdown rule', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  const item = source?.inventoryItems.find((candidate) =>
    candidate.normalizedExcerpt.includes('One goal, one coordinator:'),
  )
  assert.ok(item)
  const legacyItemId = `item.${sha256(item.normalizedExcerpt).slice(0, 12)}`
  const originalItemId = item.itemId
  ;(item as { itemId: string }).itemId = legacyItemId
  for (const rule of mutated.rules.filter(
    (candidate) => candidate.authorityBasisRef.itemId === originalItemId,
  )) {
    const replacement = {
      ...rule.authorityBasisRef,
      itemId: legacyItemId,
    }
    ;(rule as { authorityBasisRef: typeof replacement }).authorityBasisRef = replacement
    ;(rule.sourceRefs as (typeof replacement)[]).splice(0, 1, replacement)
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  }
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R12 preserves every R1-R11 reconciliation record byte-semantically', () => {
  const expected: Readonly<Record<string, string>> = {
    'gate-namespace-count': '23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3',
    'gate3-delegation': '13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6',
    'spec-linter-profile-behavior':
      '48c147ae850d5779e763c187ee9381bc2b824e299764eeb15869f57dce2e553c',
    'surfaces-allowed-files': 'c7addc8070757f6da21ae15354139d2a39c6f5db2dc164d2534305e0f944d7c1',
    'permission-profile-enforcement-bound':
      '6558689b94ae965d85c60cef8cc7d9086278f38c755276b74953d2613440eda2',
    'missing-provenance-reference':
      'ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80',
    'registry-rework-6eb1c25': 'c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d',
    'registry-rework-9285945': 'fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1',
    'registry-rework-6f45963': '3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9',
    'registry-rework-b414d06': '8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f',
    'registry-rework-00b41b7': '7113ebbad6811a3dfd4f14302f736ac11074c04943686eea28a1de820c75e9c9',
    'registry-rework-37afc65': '5f3bba04f9177884da88d21a8535d3ebc04557252aa27b30cbb191824e0b0f17',
    'registry-rework-91145d7': '6b6e2dbd3b009428c647ed8947ba5d7008445dabdcccdde7d135466b9f46f3e3',
    'registry-rework-1b42f4b': '14bb9b5739d37281619e6ace7ea9e5d0f6fd0febeecf3facc892e1a606795a56',
    'registry-rework-ee29973': 'b9a3ed7f9eaa25468df8557fb812ae343910a481450411928b8abe5d4e216bb3',
  }
  assert.deepEqual(
    Object.fromEntries(
      full.reconciliations
        .filter((record) => expected[record.reconciliationId] !== undefined)
        .map((record) => [record.reconciliationId, sha256(canonicalJson(record))]),
    ),
    expected,
  )
})

test('R12 ships an exact typed migration from the R11 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-544d8a3',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['9059bb249f75805b34a68397d53dfa5608fd6ad4', '51857a3a7796b393c0c0a68712f98c06e7015d79'],
  )
  const commands = record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map((evidence) => JSON.parse(evidence.reference) as { commandId: string })
  assert.deepEqual(
    commands.map((command) => command.commandId),
    ['registry-binding-manifest-r11', 'superseding-binding-manifest-r12'],
  )
})

for (const [name, mutate] of r10EvidenceMutations) {
  test(`R12 registry-rework-544d8a3 rejects ${name} evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === 'registry-rework-544d8a3',
    )
    assert.ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

test('R11 ships an exact typed migration from the R10 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-ee29973',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['f3366be12175acb4fd4aeb32c301c845b906a5da', '51857a3a7796b393c0c0a68712f98c06e7015d79'],
  )
})

for (const [name, mutate] of r10EvidenceMutations) {
  test(`R11 registry-rework-ee29973 rejects ${name} evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === 'registry-rework-ee29973',
    )
    assert.ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

for (const [name, mutate] of r10EvidenceMutations) {
  test(`R10 source-derived registry-rework loop rejects ${name} evidence`, () => {
    for (const reconciliationId of reworkIds) {
      const mutated = structuredClone(full)
      const record = mutated.reconciliations.find(
        (candidate) => candidate.reconciliationId === reconciliationId,
      )
      assert.ok(record)
      mutate(record.observedEvidence as unknown[])
      expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
    }
  })
}

function publishedRuleFor(sourceId: string, itemId: string) {
  const source = full.sources.find((candidate) => candidate.sourceId === sourceId)
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === itemId)
  assert.ok(item, `${sourceId}:${itemId}`)
  assert.equal(item.ruleIds.length, 1, `${sourceId}:${itemId}`)
  assert.equal(item.exclusionDisposition, null, `${sourceId}:${itemId}`)
  const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
  assert.ok(rule, `${sourceId}:${itemId}`)
  return rule
}

test('R9 publishes all thirteen charter integration scenarios individually', () => {
  const itemIds = [
    'item.ec0f6225e0a6',
    'item.0689031c79ed',
    'item.349023b0246d',
    'item.9308bed876c7',
    'item.612528548655',
    'item.102464b0e25b',
    'item.e1b224d7294b',
    'item.501441d1853e',
    'item.fc74f0320a1c',
    'item.7eba1cb561c5',
    'item.eb56a1ab24d9',
    'item.8843a7774432',
    'item.10f729956b77',
  ]
  assert.equal(itemIds.map((itemId) => publishedRuleFor('fk-charter', itemId)).length, 13)
})

test('R9 publishes all five charter refusal-class rows individually', () => {
  const itemIds = [
    'item.863fbb9202f0',
    'item.420807aa841c',
    'item.0b65a783a0be',
    'item.8d204432b7c7',
    'item.e7be31fb263e',
  ]
  assert.equal(itemIds.map((itemId) => publishedRuleFor('fk-charter', itemId)).length, 5)
})

test('R9 publishes all twenty-two charter parcel contracts individually', () => {
  const itemIds = [
    'item.7983e741c7aa',
    'item.ba4689f0d16e',
    'item.144bb836f528',
    'item.e64616afcaf9',
    'item.01fc2f9fcdd0',
    'item.9aee50455247',
    'item.6427173452f4',
    'item.d6c307d21998',
    'item.9e512e70b8f5',
    'item.d4059b59ac59',
    'item.f4e2ba3acfd6',
    'item.d92a7c500de4',
    'item.dc8cc83e01e7',
    'item.387fb9c622d2',
    'item.9efe42c4e01c',
    'item.dde24d4c9b7c',
    'item.ce7c8467ddb3',
    'item.8e9428543291',
    'item.a087b0ab4c3b',
    'item.c9611681dcca',
    'item.1cf05e6b7716',
    'item.5c24c3ef6591',
  ]
  assert.equal(itemIds.map((itemId) => publishedRuleFor('fk-charter', itemId)).length, 22)
})

test('R9 gives every published item one literal curated classification entry', () => {
  const generator = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  assert.match(generator, /const CURATED_ITEM_CLASSIFICATIONS/)
  const curationStart = generator.indexOf('const CURATED_ITEM_CLASSIFICATIONS')
  const curationEnd = generator.indexOf('const CURATED_ITEM_IDENTITIES', curationStart)
  assert.ok(curationStart >= 0 && curationEnd > curationStart)
  const curation = generator.slice(curationStart, curationEnd)
  const r13PublishedRuleIds = new Set(full.normativeMarkdownAudit.flatMap((entry) => entry.ruleIds))
  for (const rule of full.rules) {
    if (r13PublishedRuleIds.has(rule.ruleId)) continue
    const basis = rule.authorityBasisRef
    const itemBoundRuleId = `rule.${basis.sourceId}.${basis.itemId.replace(/^item\./, '')}`
    if (rule.ruleId !== itemBoundRuleId && !rule.ruleId.startsWith(`${itemBoundRuleId}.`)) continue
    const key = `${basis.sourceId}:${basis.itemId}`
    if (!curation.includes(`'${key}'`)) continue
    const scalar = new RegExp(`'${key.replaceAll('.', '\\.')}'\\s*:\\s*'${rule.classification}'`)
    if (!scalar.test(generator)) continue
    assert.match(generator, scalar, key)
  }
})

test('R9 classification curation has no source-wide keyword or terminal fallback', () => {
  const generator = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  assert.doesNotMatch(generator, /function classificationFor\s*\(/)
  const curation = /function curatedClassificationFor[\s\S]*?\n}/.exec(generator)?.[0]
  assert.ok(curation)
  assert.match(curation, /lacks literal curated classification/)
  assert.doesNotMatch(
    curation,
    /sourceId\s*===|switch\s*\(|default\s*:|return 'narrative-provenance'/,
  )
})

test('R9 loop Gate 2 shares the charter subject with precise dispatch applicability', () => {
  const rule = publishedRuleFor('fk-loop-directive', 'item.bfffee6d7c1f')
  assert.equal(rule.authoritySubject, 'gate2.dispatch-grant')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability, {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  })
  const outOfScope = resolveAuthority(full, {
    authoritySubject: 'gate2.dispatch-grant',
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'runtime',
    operation: 'external-write',
    host: 'unsupported-host',
  })
  // An unasserted reasonCode leaves REQUIRE_HUMAN ambiguous between NO_APPLICABLE_AUTHORITY,
  // INVALID_QUERY_SCOPE and REGISTRY_INVALID - which is how a test keeps passing after the
  // property it names stops holding. The registry is valid here, so the reason must be scope.
  assert.equal(outOfScope.outcome, 'REQUIRE_HUMAN')
  if (outOfScope.outcome === 'REQUIRE_HUMAN') {
    assert.equal(outOfScope.reasonCode, 'NO_APPLICABLE_AUTHORITY')
  }
})

test('R9 loop Gate 3 shares the charter subject with coordinator merge refusal scope', () => {
  const rule = publishedRuleFor('fk-loop-directive', 'item.7eb6018d9e57')
  assert.equal(rule.authoritySubject, 'gate3.merge-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability, {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  })
})

test('R9 exact coordinator verification custody is an operative refusal on the shared subject', () => {
  const rule = publishedRuleFor('fk-loop-directive', 'item.dd8203551518')
  assert.equal(rule.authoritySubject, 'verification.issue-authority')
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.deepEqual(rule.applicability, {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge', 'closure'],
    operations: ['state-transition', 'receipt-validation'],
    hosts: ['any'],
  })
  assert.match(rule.normalizedStatement, /never produces independent verification/)
})

test('R9 loop stop and completion rules retain operative classifications and narrow scope', () => {
  for (const itemId of [
    'item.7f72e946ccbe',
    'item.6151d43333aa',
    'item.adee76eb5f43',
    'item.237865e0993f',
    'item.e3065db62b43',
  ]) {
    const rule = publishedRuleFor('fk-loop-directive', itemId)
    assert.notEqual(rule.classification, 'narrative-provenance', itemId)
    assert.deepEqual(rule.applicability.roles, ['coordinator'], itemId)
    if (itemId === 'item.237865e0993f') {
      assert.ok(rule.applicability.stages.includes('runtime'), itemId)
    } else {
      assert.ok(!rule.applicability.stages.includes('runtime'), itemId)
    }
    assert.ok(!rule.applicability.operations.includes('external-write'), itemId)
  }
})

test('R7 Gate 1 binds original ratification scoped re-ratification and nondelegability', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'gate1.ratify')
  assert.ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  assert.ok(statements.some((text) => text?.includes('Ratify Gate 1 and authorize Gate 2')))
  assert.ok(statements.some((text) => text?.includes('Re-ratify Gate 1 amendments R1–R13')))
  assert.ok(statements.some((text) => text?.includes('Gate 1 is nondelegable')))
})

test('R7 Gate 2 binds the standing charter grant and operative loop authorization', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'gate2.dispatch')
  assert.ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  assert.ok(statements.some((text) => text?.includes('AUTHORIZED AND RESUMED 2026-08-31')))
  assert.ok(
    statements.some((text) => text?.includes('Gate 2 dispatch') && text.includes('FK-P0–FK-P21')),
  )
})

test('R7 every exclusion uses the closed item-specific code vocabulary', () => {
  const allowed = new Set([
    'heading-only',
    'table-header',
    'structural-ast',
    'schema-container',
    'duplicate-exact-statement',
    'non-normative-explanation',
    'example-only',
    'fenced-code',
    'type-only',
  ])
  for (const source of full.sources) {
    for (const item of source.inventoryItems.filter(
      (candidate) => candidate.ruleIds.length === 0,
    )) {
      assert.ok(allowed.has(item.exclusionDisposition ?? ''), `${source.sourceId}:${item.itemId}`)
      assert.doesNotMatch(item.rationale, /metadata, explanatory context, or duplicate provenance/i)
    }
  }
})

test('R9 shared semantic identities are limited to the exact curated equivalent claims', () => {
  const groups = new Map<string, string[]>()
  for (const rule of full.rules) {
    const key = `${rule.authoritySubject}|${rule.authorityClaim}`
    const ruleIds = groups.get(key) ?? []
    ruleIds.push(rule.ruleId)
    groups.set(key, ruleIds)
  }
  assert.deepEqual(
    [...groups.entries()]
      .filter(([, ruleIds]) => ruleIds.length > 1)
      .map(([key, ruleIds]) => [key, ruleIds.sort()] as const)
      .sort(([left], [right]) => left.localeCompare(right)),
    [
      [
        'gate1.ratification-authority|explicit-developer-ratification-required',
        ['rule.coordinator-pattern.a3d15fe678e1', 'rule.goal-skill.8fda5f4d9776'],
      ],
      [
        'gate2.dispatch-grant|coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
        [
          'rule.fk-charter.15a44cf50bc6',
          'rule.fk-loop-directive.47a75730afd6',
          'rule.fk-loop-directive.bfffee6d7c1f',
        ],
      ],
      [
        'gate3.merge-authority|human-owned-nondelegated',
        [
          'rule.fk-charter.b1ac4aa9eddf',
          'rule.fk-charter.c74628d41600',
          'rule.fk-loop-directive.08b3cbb91027',
          'rule.fk-loop-directive.2743c2f8c558',
          'rule.fk-loop-directive.7eb6018d9e57',
          'rule.foreman-line-plan.c92333c21e64',
        ],
      ],
      [
        'goal.stop.serialization-ownership|stop-when-owned-serialization-point-has-no-ratified-sequence',
        ['rule.fk-charter.0afd841f51f8', 'rule.fk-loop-directive.c708d8f95113'],
      ],
      [
        'goal.stop.user-change-collision|stop-on-user-owned-required-file-collision',
        ['rule.fk-charter.2cbbc7ae0192', 'rule.fk-loop-directive.c55a33cc847f'],
      ],
      [
        'spec.mutation-authority|exact-allowed-files-required',
        [
          'rule.fk-charter.d10',
          'rule.spec-convention.5145ab15549c',
          'rule.spec-convention.fd82127bf9f9',
        ],
      ],
      [
        'verification.issue-authority|architecture-risk-two-fresh-independent-reviews-required',
        ['rule.fk-charter.5c1f19dd9911', 'rule.fk-loop-directive.ce9042d917b2'],
      ],
      [
        'verification.issue-authority|coordinator-consumes-but-does-not-produce',
        ['rule.coordinator-pattern.a18d27d46b1e', 'rule.goal-skill.100b2d3e99ce'],
      ],
    ],
  )
})

test('R7 all charter decisions D1 through D20 publish active non-narrative authority', () => {
  for (let index = 1; index <= 20; index += 1) {
    const rule = full.rules.find((candidate) => candidate.ruleId === `rule.fk-charter.d${index}`)
    assert.ok(rule, `D${index}`)
    assert.equal(rule.retirementState, 'active-reading', `D${index}`)
    assert.notEqual(rule.classification, 'narrative-provenance', `D${index}`)
    assert.notEqual(rule.classification, 'unsupported', `D${index}`)
  }
})

test('R8 publishes all nine charter goal-exit requirements individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  assert.ok(source)
  const items = source.inventoryItems.filter(
    (item) =>
      item.locator.kind === 'numbered-item' &&
      item.locator.anchor.includes('## 9. Goal exit criterion') &&
      /^\d+\./.test(item.normalizedExcerpt),
  )
  assert.equal(items.length, 9)
  assert.ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
})

test('R8 publishes all seventeen charter stop-condition bullets individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  assert.ok(source)
  const items = source.inventoryItems.filter(
    (item) =>
      item.locator.kind === 'numbered-item' &&
      item.locator.anchor.includes('## 11. Stop conditions') &&
      item.normalizedExcerpt.startsWith('- '),
  )
  assert.equal(items.length, 17)
  assert.ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
})

test('R8 publishes all five literal charter wave-exit contracts individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  assert.ok(source)
  const items = source.inventoryItems.filter((item) =>
    /^\*\*Wave [0-4] exit:\*\*/.test(item.normalizedExcerpt),
  )
  assert.equal(items.length, 5)
  assert.ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
})

test('R8 loop completion and gate requirement bodies remain independently published', () => {
  const required = [
    'item.bfffee6d7c1f',
    'item.7eb6018d9e57',
    'item.6ea9ce2b9573',
    'item.2743c2f8c558',
    'item.e3065db62b43',
    'item.237865e0993f',
  ]
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-loop-directive')
  assert.ok(source)
  for (const itemId of required) {
    const inventoryItem: InventoryItem | undefined = source.inventoryItems.find(
      (candidate) => candidate.itemId === itemId,
    )
    assert.ok(inventoryItem, itemId)
    assert.equal(inventoryItem.ruleIds.length, 1, itemId)
    assert.equal(inventoryItem.exclusionDisposition, null, itemId)
  }
})

test('R8 generation has no classification or default applicability fallback', () => {
  const source = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  assert.doesNotMatch(source, /function applicabilityFor\s*\(/)
  assert.match(source, /CURATED_ITEM_APPLICABILITY/)
})

test('R8 Gate 2 grant is out of scope for builder runtime external write on unsupported host', () => {
  const result = resolveAuthority(full, {
    authoritySubject: 'gate2.dispatch-grant',
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'runtime',
    operation: 'external-write',
    host: 'unsupported-host',
  })
  assert.deepEqual(result, {
    outcome: 'REQUIRE_HUMAN',
    authoritySubject: 'gate2.dispatch-grant',
    reasonCode: 'NO_APPLICABLE_AUTHORITY',
    controllingRuleIds: [],
    consideredRuleIds: [],
  })
})

test('R8 unrelated linter return remains structural and cannot publish absence authority', () => {
  assert.equal(
    full.rules.some((rule) => rule.authorityClaim === 'frontmatter-only-no-body-compiler'),
    false,
  )
  const source = full.sources.find((candidate) => candidate.sourceId === 'spec-linter-validator')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.80563af1788e')
  assert.ok(item)
  assert.deepEqual(item.ruleIds, [])
  assert.equal(item.exclusionDisposition, 'structural-ast')
})

test('R8 Allowed Files absence is carried only by exact reconciliation evidence', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'surfaces-allowed-files',
  )
  assert.ok(record)
  assert.doesNotMatch(canonicalJson(record.observedRefs), /item\.80563af1788e/)
  assert.ok(record.observedEvidence.some((evidence) => evidence.kind === 'command-result'))
  assert.match(record.unresolvedConsequence, /FK-P2 gap/)
})

test('R8 verification operation binds exact anti-self-production canon', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'verification.issue')
  assert.ok(operation)
  assert.deepEqual(
    operation.requiredGitEvidence.map((reference) => `${reference.sourceId}:${reference.itemId}`),
    ['spec-convention:item.03f0830cd693', 'fk-loop-directive:item.dd8203551518'],
  )
})

test('R8 verification evidence resolves the exact independent-review meaning', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'verification.issue')
  assert.ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  assert.ok(statements.some((text) => text?.includes('No agent verifies its own claim')))
  assert.ok(
    statements.some((text) =>
      text?.includes(
        'coordinator consumes verification; it never produces independent verification',
      ),
    ),
  )
})

test('R8 verification evidence rejects a corroborative two-review substitution', () => {
  const mutated = structuredClone(full)
  const operation = mutated.operationAuthority.find(
    (row) => row.operationId === 'verification.issue',
  )
  assert.ok(operation)
  const substitute = mutated.rules
    .find((rule) => rule.ruleId === 'rule.fk-charter.d11')
    ?.sourceRefs.at(0)
  assert.ok(substitute)
  ;(operation.requiredGitEvidence as (typeof substitute)[])[0] = substitute
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R8 RULE_SEMANTICS_UNCURATED is a closed ratified result code', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d2')
  assert.ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'fk-charter.d2'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'RULE_SEMANTICS_UNCURATED')
})

test('R8 ships a typed migration from the R7 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-37afc65',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.ok(
    record.observedEvidence.some(
      (evidence) =>
        evidence.kind === 'git-commit' &&
        evidence.reference === '5d7ca990574eb8416a1fc5ac40b90d9aec975b2b',
    ),
  )
  assert.ok(record.supersedingEvidence)
})

test('R9 ships an exact typed migration from the R8 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-91145d7',
  )
  assert.ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    ['84d5c7c0fd2ef074dab06770f14e87012619a213', '51857a3a7796b393c0c0a68712f98c06e7015d79'],
  )
  assert.equal(record.supersedingEvidence?.sourceId, 'fk-charter')
  assert.equal(record.supersedingEvidence?.itemId, 'item.5c1f19dd9911')
})

for (const [name, mutate] of [
  ['append', (items: unknown[]) => items.push(structuredClone(items[0]))],
  ['remove', (items: unknown[]) => items.splice(0, 1)],
  ['duplicate', (items: unknown[]) => items.splice(1, 0, structuredClone(items[0]))],
  [
    'substitute',
    (items: unknown[]) => {
      const evidence = items[0] as { kind: string; reference: string; digest: string }
      const reference = `${evidence.reference}#substituted`
      items[0] = { kind: evidence.kind, reference, digest: sha256(reference) }
    },
  ],
] as const) {
  test(`R8 migration rejects ${name} evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === 'registry-rework-37afc65',
    )
    assert.ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

for (const vector of [
  {
    name: 'D2 canon and operational authority split',
    subject: 'canon.operational-authority-boundary',
    claim: 'git-canon-sqlite-operational-split',
    ruleId: 'rule.fk-charter.d2',
    role: 'builder',
  },
  {
    name: 'D18 provider-neutral authorizeAction owner',
    subject: 'kernel.authorize-action-owner',
    claim: 'provider-neutral-policy-engine',
    ruleId: 'rule.fk-charter.d18',
    role: 'builder',
  },
  {
    name: 'PDD6 builder pre-PR rebase',
    subject: 'parcel.pre-pr-base',
    claim: 'rebase-before-pr',
    ruleId: 'rule.parcel-driven-development.hard-rule-6',
    role: 'builder',
  },
] as const) {
  test(`R7 natural resolution: ${vector.name}`, () => {
    const result = resolveAuthority(full, {
      authoritySubject: vector.subject,
      goal: 'foreman-kernel',
      role: vector.role,
      stage: 'build',
      operation: 'repo-mutation',
      host: 'provider-neutral',
    })
    assert.equal(result.outcome, 'RESOLVED')
    if (result.outcome === 'RESOLVED') {
      assert.equal(result.authorityClaim, vector.claim)
      assert.deepEqual(result.controllingRuleIds, [vector.ruleId])
    }
  })
}
