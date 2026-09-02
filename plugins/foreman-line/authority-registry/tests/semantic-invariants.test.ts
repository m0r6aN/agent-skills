import assert from 'node:assert/strict'
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test as nodeTest } from 'node:test'
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
  LEGACY_SOURCE_SNAPSHOT_COMMIT,
  locatorDigestFor,
  normalizeRuleText,
  registryBindingManifestDigest,
  resolveAuthority,
  sha256,
  validateRegistry,
} from '../src/validate.js'
import { ok } from './support/assert-ok.js'

/**
 * R14 fix 20 - per-test progress that survives a crash.
 *
 * node's test runner BUFFERS a file's reporter output until that file completes, so when this file
 * died the whole suite reported `pass 0 / fail 1 / 'test failed'` naming no invariant and every one
 * of its results was lost. Switching to the TAP reporter does NOT fix that - the buffering is in
 * the runner's per-file output ordering, not the reporter - and neither does writing to
 * `process.stderr` or even raw fd 2, because the runner intercepts both streams to attribute output
 * to tests. All three were measured on controlled probes before settling on this.
 *
 * Appending to a file outside the repository DOES escape, and it survives a non-graceful exit. The
 * log is written to the OS temp directory, never into the package, so no unlisted file is created.
 * If this file dies again, the last line names the last test that completed.
 */
/**
 * R20 fix - the path is PER-RUN UNIQUE. It used to be a fixed name, truncated at import, so two
 * concurrent runs deleted each other's evidence: the mechanism behind both 'a concurrent run
 * corrupted evidence' incidents in this round. `mkdtempSync` gives each run its own directory; the
 * shared prefix keeps the log findable by glob without making the path collidable.
 */
const progressLogPath = join(
  mkdtempSync(join(tmpdir(), 'fk-p0-progress-semantic-invariants-')),
  'progress.log',
)
try {
  writeFileSync(progressLogPath, '')
} catch {
  // A progress log is a diagnostic aid; never fail a test run because it could not be written.
}
let completedTests = 0
function test(name: string, fn: () => void | Promise<void>): void {
  void nodeTest(name, async () => {
    try {
      await fn()
    } finally {
      completedTests += 1
      try {
        appendFileSync(
          progressLogPath,
          `${completedTests}	${name}
`,
        )
      } catch {
        // ignore
      }
    }
  })
}

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
 * For a test whose PREMISE is "this document is valid apart from the thing under test".
 *
 * `expectCode` asserts only that the named code is present, so such a test keeps passing while the
 * document is invalid for a reason it never names - which is standing constraint #11 in its exact
 * form. Two of the four `rechain()` callers did precisely that when the head became required: they
 * still saw `RULE_ORPHANED` and `RETIREMENT_EVIDENCE_*`, so they passed, while the document was also
 * carrying an unrelated `RECONCILIATION_MISSING` their premise excluded.
 *
 * This is NOT a global replacement for `expectCode`: many mutations legitimately produce several
 * violations, and forcing exactness there would fail for correct behaviour. The distinction is the
 * premise, not the assertion style.
 */
function expectOnlyCodes(document: unknown, ...expected: readonly string[]): void {
  const observed = codes(document)
  const unexpected = observed.filter((code) => !expected.includes(code))
  if (unexpected.length > 0) {
    throw new Error(
      `premise violated: document is invalid for reasons this test does not name: ${[
        ...new Set(unexpected),
      ].join(',')}; observed ${observed.join(',')}`,
    )
  }
  for (const code of expected) {
    if (!observed.includes(code)) {
      throw new Error(`expected ${code}; observed ${observed.join(',')}`)
    }
  }
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
function rechain(
  document: AuthorityEnforcementRegistry,
  reconciliationId = 'registry-rework-testchain',
): AuthorityEnforcementRegistry {
  const chainRecords = document.reconciliations.filter((record) =>
    record.reconciliationId.startsWith('registry-rework-'),
  )
  const head = chainRecords[chainRecords.length - 1]
  ok(head)
  // R22 obligation 7: APPEND after the shipped head rather than replacing it. Replacement was
  // forced only because a demoted head then needed a pin entry it did not have - and that inverted
  // the accepted residual, because the cheapest file-only route that passed became the one that
  // ERASED the R14 attestation. The shipped head now carries its own record-digest binding, so the
  // legitimate append path is the one under test here, which is what these callers meant all along.
  const headCommands = head.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map(
      (evidence) =>
        JSON.parse(evidence.reference) as {
          commandId: string
          inputDigest: string
          resultDigest: string
        },
    )
  // Chain from the head's OWN successor digest: the appended record supersedes the shipped head,
  // so its predecessor is what the head declared, not what the head chained FROM.
  const predecessorDigest = headCommands.find((command) =>
    command.commandId.startsWith('superseding-binding-manifest'),
  )?.resultDigest
  ok(predecessorDigest)
  const nextDigest = registryBindingManifestDigest(document)
  // NO-OP APPEND guard. If the caller has not actually amended a bound value the manifest has not
  // moved, so this record would declare `prev === next` - a self-loop the chain walk correctly reads
  // as a cycle. Refuse to build it rather than let a caller assert against a document that is
  // invalid for the TEST's reason instead of the code's.
  assert.notEqual(
    nextDigest,
    predecessorDigest,
    'rechain(): the manifest has not moved, so this append would be a self-loop - amend a bound value first',
  )
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
  // AC4 obligation 4 as amended by R21: the prior command's `inputDigest` must be the SHA-256 of a
  // `git-commit` reference carried on the SAME record, so that repointing or deleting that evidence
  // breaks the binding. The old placeholder `sha256('rechain')` bound nothing, which is exactly the
  // shape of the defect the obligation exists to refuse - a replacement head has to satisfy the
  // floor a real head satisfies, or these tests would be exercising a head that could not ship.
  const priorCommitReference = 'a'.repeat(40)
  const prior = command(
    'registry-binding-manifest-test',
    sha256(priorCommitReference),
    predecessorDigest,
  )
  const superseding = command('superseding-binding-manifest-test', predecessorDigest, nextDigest)
  const basis = head.observedRefs[0]
  ok(basis)
  return {
    ...document,
    reconciliations: [
      ...document.reconciliations,
      {
        reconciliationId,
        topic: 'Test-authored amendment superseding the shipped bindings.',
        observedRefs: [basis],
        observedEvidence: [
          { kind: 'git-commit', reference: priorCommitReference, digest: sha256('prior') },
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
  ok(item)
  ok(rule)
  const source = valid.sources.find(
    (candidate) => candidate.sourceId === rule.sourceRefs[0]?.sourceId,
  )
  const referencedItem = source?.inventoryItems.find(
    (candidate) => candidate.itemId === rule.sourceRefs[0]?.itemId,
  )
  ok(referencedItem)
  assert.equal(locatorDigestFor(referencedItem.locator), rule.sourceRefs[0]?.locatorDigest)
  assert.equal(bindingDigestFor(rule), rule.bindingDigest)
})

test('each of the six classifications is accepted and summarized independently', () => {
  const result = validateRegistry(valid)
  assert.equal(result.valid, true)
  assert.deepEqual(result.summary?.classificationCounts, {
    'pre-action-refusal': 254,
    'post-action-detection': 9,
    'ci-static-check': 78,
    'independent-review-human-judgment': 15,
    'narrative-provenance': 100,
    unsupported: 13,
  })
})

test('pre-action refusal requires a stable refusal code', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'pre-action-refusal')
  ok(rule)
  ;(rule as { refusalCode: string | null }).refusalCode = null
  ok(
    codes(mutated).includes('SCHEMA_INVALID') ||
      codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'),
  )
})

test('pre-action refusal decision cannot be widened to ALLOW', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'pre-action-refusal')
  ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects post-action-detection assurance widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'post-action-detection',
  )
  ok(rule)
  ;(rule as { assurance: string }).assurance = 'narrative'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects ci-static-check owner widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'ci-static-check')
  ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'coordinator'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects independent-review decision widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'independent-review-human-judgment',
  )
  ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects narrative-provenance owner widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find(
    (candidate) => candidate.classification === 'narrative-provenance',
  )
  ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'kernel-policy'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('classification matrix rejects unsupported assurance widening', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules.find((candidate) => candidate.classification === 'unsupported')
  ok(rule)
  ;(rule as { assurance: string }).assurance = 'mediated'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('loaded permission-profile refusals are owned by the host adapter at mediated assurance', () => {
  const rules = full.rules.filter(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'permission-profiles-validator',
  )
  ok(rules.length > 0)
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
  ok(rule)
  ;(rule as { enforcementOwner: string }).enforcementOwner = 'kernel-policy'
  ;(rule as { assurance: string }).assurance = 'structural'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('retirement requires four correctly typed evidence references', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules[0]
  ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  ok(codes(mutated).includes('RETIREMENT_EVIDENCE_INCOMPLETE'))
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
    ok(row)
    ;(row as { agentCallable: boolean }).agentCallable = true
    ;(row as { operationalStateMaySatisfy: boolean }).operationalStateMaySatisfy = true
    ;(row as { toolMayIssueAuthorityEvidence: boolean }).toolMayIssueAuthorityEvidence = true
    ok(codes(mutated).includes('AUTHORITY_ESCALATION'), operationId)
  }
})

test('Gate 2 state may record consumption but cannot mint authority', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  ok(row)
  ;(row as { operationalStateMaySatisfy: boolean }).operationalStateMaySatisfy = true
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('Gate 2 rejects anonymous admission even with Git-shaped evidence', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  ok(row)
  ;(row.allowedPrincipals as string[]).splice(0, row.allowedPrincipals.length, 'anonymous-read')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('protected operation evidence resolves locator and value digests, not only item identity', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'gate2.dispatch',
  )
  ok(row?.requiredGitEvidence[0])
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
  ok(gate2)
  ok(substitute)
  ;(gate2.requiredGitEvidence as (typeof substitute)[]).splice(0, 1, structuredClone(substitute))
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('builder cannot issue closure authority', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'closure.record',
  )
  ok(row)
  ;(row.allowedPrincipals as string[]).splice(0, row.allowedPrincipals.length, 'builder')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('generic receipt minting has no admitted principal', () => {
  const row = valid.operationAuthority.find(
    (candidate) => candidate.operationId === 'receipt.mint-generic',
  )
  ok(row)
  assert.deepEqual(row.allowedPrincipals, [])
})

test('external writes have no admitted principal', () => {
  const row = valid.operationAuthority.find(
    (candidate) => candidate.operationId === 'external.write',
  )
  ok(row)
  assert.deepEqual(row.allowedPrincipals, [])
})

test('builder cannot be inserted as generic receipt mint principal', () => {
  const mutated = structuredClone(valid)
  const row = mutated.operationAuthority.find(
    (candidate) => candidate.operationId === 'receipt.mint-generic',
  )
  ok(row)
  ;(row.allowedPrincipals as string[]).push('builder')
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('every required reconciliation is mandatory', () => {
  // R22 obligation 6: the chain head IS now in the required set, so EVERY reconciliation - the head
  // included - must report RECONCILIATION_MISSING when deleted. Before R22 this loop skipped the
  // head, because `rechain()` legitimately replaced it; that skip is exactly the hole the
  // delete-and-substitute attack walked through, so the loop must no longer have an exemption.
  let checked = 0
  for (let index = 0; index < valid.reconciliations.length; index += 1) {
    const removed = valid.reconciliations[index]
    ok(removed)
    const mutated = structuredClone(valid)
    ;(mutated.reconciliations as AuthorityEnforcementRegistry['reconciliations'][number][]).splice(
      index,
      1,
    )
    const observed = codes(mutated)
    ok(
      observed.includes('RECONCILIATION_MISSING'),
      `deleting '${removed.reconciliationId}' must report RECONCILIATION_MISSING; observed ${observed.join(',')}`,
    )
    checked += 1
  }
  assert.equal(
    checked,
    valid.reconciliations.length,
    'every reconciliation, including the chain head, must be required',
  )
})

test('deleting the chain head invalidates rather than promoting a pinned record', () => {
  // AC4 obligation 2 as amended by R19. Head position must not be selectable by deletion: before
  // R19, removing the head promoted the previously-pinned record into the head exemption and out of
  // its byte pin, and repointing that promoted record at the live manifest validated clean.
  const chainHeadId = 'registry-rework-df8155a'
  const kept = structuredClone(valid).reconciliations.filter(
    (record) => record.reconciliationId !== chainHeadId,
  )
  assert.equal(kept.length, valid.reconciliations.length - 1, 'the head must actually be removed')
  const mutated = { ...structuredClone(valid), reconciliations: kept }
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('reconciliation IDs are unique', () => {
  const mutated = structuredClone(valid)
  const duplicate = structuredClone(mutated.reconciliations[0])
  ok(duplicate)
  ;(mutated.reconciliations as AuthorityEnforcementRegistry['reconciliations'][number][]).push(
    duplicate,
  )
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('reconciliation observed refs bind full identity location and value', () => {
  const mutated = structuredClone(valid)
  const ref = mutated.reconciliations[0]?.observedRefs[0]
  ok(ref)
  ;(ref as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
  ;(ref as { valueDigest: string }).valueDigest = '1'.repeat(64)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('required reconciliation topics and statuses are immutable', () => {
  const mutated = structuredClone(valid)
  const record = mutated.reconciliations[0]
  ok(record)
  ;(record as { topic: string }).topic = 'Plausible but forged topic'
  ;(record as { migrationStatus: string }).migrationStatus = 'open'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('reconciliation evidence digests cannot be self-asserted placeholders', () => {
  const mutated = structuredClone(valid)
  const evidence = mutated.reconciliations[0]?.observedEvidence[0]
  ok(evidence)
  ;(evidence as { digest: string }).digest = 'f'.repeat(64)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('charter source cannot be downgraded below goal-charter authority', () => {
  const mutated = structuredClone(valid)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  ok(source)
  ;(source as { authorityTier: string }).authorityTier = 'generated-advisory'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('stale explanatory source cannot be promoted to binding authority', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find(
    (candidate) => candidate.authorityEffect === 'stale-explanation',
  )
  ok(source)
  ;(source as { authorityEffect: string }).authorityEffect = 'binding'
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('operation-disjoint rules do not conflict', () => {
  const mutated = structuredClone(valid)
  const original = mutated.rules[0]
  ok(original)
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
  ok(item)
  ;(item.ruleIds as string[]).push(counterpart.ruleId)
  assert.equal(codes(mutated).includes('RULE_CONFLICT'), false)
})

test('role stage operation and host axes can make active rules scope-disjoint', () => {
  const dimensions = ['roles', 'stages', 'operations', 'hosts'] as const
  for (const dimension of dimensions) {
    const mutated = structuredClone(valid)
    const original = mutated.rules[0]
    ok(original)
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
    ok(item)
    ;(item.ruleIds as string[]).push(counterpart.ruleId)
    assert.equal(codes(mutated).includes('RULE_CONFLICT'), false, dimension)
  }
})

test('all-foreman-goals applicability overlaps foreman-kernel applicability', () => {
  const mutated = structuredClone(valid)
  const original = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  ok(original)
  const counterpart = structuredClone(original) as AuthorityEnforcementRegistry['rules'][number]
  ;(counterpart as { ruleId: string }).ruleId = 'rule.goal-scope-overlap'
  ;(counterpart as { authorityClaim: string }).authorityClaim = 'conflicting-goal-scope-claim'
  ;(counterpart.applicability.goals as string[]).splice(0, 1, 'all-foreman-goals')
  ;(counterpart as { bindingDigest: string }).bindingDigest = bindingDigestFor(counterpart)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(counterpart)
  const item = mutated.sources
    .find((source) => source.sourceId === counterpart.sourceRefs[0]?.sourceId)
    ?.inventoryItems.find((candidate) => candidate.itemId === counterpart.sourceRefs[0]?.itemId)
  ok(item)
  ;(item.ruleIds as string[]).push(counterpart.ruleId)
  expectCode(mutated, 'RULE_CONFLICT')
})

test('higher-tier active authority controls a lower-tier in-scope contradiction', () => {
  const mutated = structuredClone(full)
  const controlling = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  const lower = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'coordinator-pattern',
  )
  ok(controlling)
  ok(lower)
  const lowerSource = mutated.sources.find(
    (candidate) => candidate.sourceId === lower.sourceRefs[0]?.sourceId,
  )
  const lowerItem = lowerSource?.inventoryItems.find(
    (candidate) => candidate.itemId === lower.sourceRefs[0]?.itemId,
  )
  ok(lowerItem)
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
  ok(lowerRef)
  ;(lowerRef as { valueDigest: string }).valueDigest = lowerItem.valueDigest
  ;(lower as { bindingDigest: string }).bindingDigest = bindingDigestFor(lower)
  assert.equal(codes(mutated).includes('RULE_CONFLICT'), false)
})

test('historical-only and stale-effect rules cannot create active authority conflicts', () => {
  for (const mode of ['historical-only', 'stale-explanation'] as const) {
    const mutated = structuredClone(valid)
    const original = mutated.rules[0]
    const source = mutated.sources[0]
    ok(original)
    ok(source)
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
    ok(item)
    ;(item.ruleIds as string[]).push(counterpart.ruleId)
    assert.equal(codes(mutated).includes('RULE_CONFLICT'), false, mode)
  }
})

test('rule normalized statement must equal its referenced normalized excerpt', () => {
  const mutated = structuredClone(valid)
  const rule = mutated.rules[0]
  ok(rule)
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
  ok(source)
  ok(item)
  ok(rule)
  const priorItemId = item.itemId
  ;(item as { itemId: string }).itemId = 'item.coordinated-replacement'
  ;(item.locator as { anchor: string }).anchor = `${item.locator.anchor} replacement`
  ;(item as { normalizedExcerpt: string }).normalizedExcerpt = 'Coordinated replacement value'
  ;(item as { valueDigest: string }).valueDigest = sha256(item.normalizedExcerpt)
  const ref = rule.sourceRefs[0]
  ok(ref)
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
  ok(source)
  ok(item)
  ok(rule)
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
  ok(reference)
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
  ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  ok(record.supersedingEvidence)
  assert.deepEqual(
    record.observedEvidence
      .filter((evidence) => evidence.kind === 'git-commit')
      .map((evidence) => evidence.reference),
    // Not `full.sourceSnapshotCommit`: this record is byte-frozen by RECONCILIATION_RECORD_DIGESTS
    // and carries the snapshot current WHEN IT WAS WRITTEN (R16/R17).
    ['4666ea15caee8b231137f23325d14ea4526e338a', LEGACY_SOURCE_SNAPSHOT_COMMIT],
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
  ok(evidence)
  ;(evidence as { reference: string }).reference = '0'.repeat(40)
  ;(evidence as { digest: string }).digest = sha256(evidence.reference)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

for (const classification of RULE_CLASSIFICATIONS) {
  test(`classification mutation control: ${classification} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    const rule = mutated.rules.find((candidate) => candidate.classification === classification)
    ok(rule)
    ;(rule as { classification: string }).classification = `${classification}-widened`
    ok(codes(mutated).includes('SCHEMA_INVALID'))
  })
}

for (const authorityTier of AUTHORITY_TIERS) {
  test(`authority-tier mutation control: ${authorityTier} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    ;(mutated.sources[0] as { authorityTier: string }).authorityTier = `${authorityTier}-widened`
    ok(codes(mutated).includes('SCHEMA_INVALID'))
  })
}

for (const authorityEffect of AUTHORITY_EFFECTS) {
  test(`authority-effect mutation control: ${authorityEffect} cannot be widened`, () => {
    const mutated = structuredClone(valid)
    ;(mutated.sources[0] as { authorityEffect: string }).authorityEffect =
      `${authorityEffect}-widened`
    ok(codes(mutated).includes('SCHEMA_INVALID'))
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
    ok(rule)
    ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
    ;(rule as { retirementEvidence: typeof evidence }).retirementEvidence =
      structuredClone(evidence)
    ;(rule.retirementEvidence as unknown as Record<string, unknown>)[field] = null
    ok(codes(mutated).includes('RETIREMENT_EVIDENCE_INCOMPLETE'))
  })
}

for (const migrationStatus of ['open', 'resolved-for-fk', 'blocked'] as const) {
  test(`migration mutation control: ${migrationStatus} cannot carry superseding evidence`, () => {
    const mutated = structuredClone(valid)
    const record = mutated.reconciliations[0]
    const sourceRef = mutated.rules[0]?.sourceRefs[0]
    ok(record)
    ok(sourceRef)
    ;(record as { migrationStatus: string }).migrationStatus = migrationStatus
    ;(record as { supersedingEvidence: typeof sourceRef | null }).supersedingEvidence = sourceRef
    ok(codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'))
  })
}

test('migration mutation control: superseded-by-amendment requires superseding evidence', () => {
  const mutated = structuredClone(valid)
  const record = mutated.reconciliations[0]
  ok(record)
  ;(record as { migrationStatus: string }).migrationStatus = 'superseded-by-amendment'
  ;(record as { supersedingEvidence: null }).supersedingEvidence = null
  ok(codes(mutated).includes('MIGRATION_EVIDENCE_INVALID'))
})

test('uncovered inventory items and orphaned rule mappings fail closed independently', () => {
  const uncovered = structuredClone(valid)
  const uncoveredItem = uncovered.sources[0]?.inventoryItems[0]
  ok(uncoveredItem)
  ;(uncoveredItem.ruleIds as string[]).splice(0)
  ok(codes(uncovered).includes('SOURCE_ITEM_UNCOVERED'))

  const orphan = structuredClone(valid)
  const orphanItem = orphan.sources[0]?.inventoryItems[0]
  ok(orphanItem)
  ;(orphanItem.ruleIds as string[])[0] = 'rule.does-not-exist'
  ok(codes(orphan).includes('RULE_ORPHANED'))
})

test('source snapshot and caller-asserted authority mutations fail closed', () => {
  const staleSnapshot = structuredClone(valid)
  ;(staleSnapshot.sources[0]?.snapshotEvidence as { commit: string }).commit = '0'.repeat(40)
  ok(codes(staleSnapshot).includes('MIGRATION_EVIDENCE_INVALID'))

  const selfAsserted = structuredClone(valid) as AuthorityEnforcementRegistry & {
    callerPrincipal?: string
  }
  selfAsserted.callerPrincipal = 'human-developer'
  ok(codes(selfAsserted).includes('SCHEMA_INVALID'))
})

test('set-valued arrays and protected operation rows require schema-enum order', () => {
  const principals = structuredClone(valid)
  const gate2 = principals.operationAuthority.find(
    (operation) => operation.operationId === 'gate2.dispatch',
  )
  ok(gate2)
  ;(gate2.allowedPrincipals as string[]).push('builder')
  ;(gate2.allowedPrincipals as string[]).reverse()
  ok(codes(principals).includes('MIGRATION_EVIDENCE_INVALID'))

  const rows = structuredClone(valid)
  ;(
    rows.operationAuthority as AuthorityEnforcementRegistry['operationAuthority'][number][]
  ).reverse()
  ok(codes(rows).includes('MIGRATION_EVIDENCE_INVALID'))
})

test('R3 exact source contract rejects a missing eighteenth source', () => {
  const mutated = structuredClone(full)
  ;(mutated.sources as AuthorityEnforcementRegistry['sources'][number][]).pop()
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 exact source contract rejects an unknown nineteenth source', () => {
  const mutated = structuredClone(full)
  const extra = structuredClone(mutated.sources[0])
  ok(extra)
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
  ok(rule)
  ;(rule as { normalizedStatement: string }).normalizedStatement += ' weakened'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 D10 applicability downgrade requires typed prior-manifest migration', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  ok(rule)
  ;(rule.applicability.roles as string[]).splice(0, 1)
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 D10 retirement downgrade requires typed prior-manifest migration', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'candidate-for-retirement'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 authority subject replacement is bound by the complete manifest', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules[0]
  ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'forged.subject'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 authority claim replacement is bound by the complete manifest', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules[0]
  ok(rule)
  ;(rule as { authorityClaim: string }).authorityClaim = 'forged-claim'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 complete binding digest includes applicability retirement and assurance', () => {
  const original = full.rules[0]
  ok(original)
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
  ok(original)
  const rival = structuredClone(original)
  ;(rival as { ruleId: string }).ruleId = 'rule.fk-charter.d3-rival'
  ;(rival as { authorityClaim: string }).authorityClaim = 'state-changes-follow-a-different-rule'
  ;(rival as { normalizedStatement: string }).normalizedStatement = 'Naturally different prose.'
  // Re-digest the rival so the ONLY objection is the contradiction itself. Without this the
  // document is invalid for a stale binding digest and the test proves nothing about conflicts.
  ;(rival as { bindingDigest: string }).bindingDigest = bindingDigestFor(rival)
  ;(mutated.rules as AuthorityEnforcementRegistry['rules'][number][]).push(rival)
  // The named invariant: an equal-tier contradiction is DETECTED, as RULE_CONFLICT.
  ok(validateRegistry(mutated).violations.some((violation) => violation.code === 'RULE_CONFLICT'))
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
  ok(high && low)
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
  ok(result.consideredRuleIds.includes(low.ruleId))
  ok(!result.controllingRuleIds.includes(low.ruleId))
  ok(result.controllingRuleIds.includes(high.ruleId))
})

test('R3 resolver excludes stale explanatory sources from control', () => {
  const mutated = structuredClone(full)
  const stale = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'spec-linter-readme',
  )
  const controlling = mutated.rules.find((r) => r.ruleId === 'rule.fk-charter.d3')
  ok(stale && controlling)
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
  ok(result.consideredRuleIds.includes(stale.ruleId))
  ok(!result.controllingRuleIds.includes(stale.ruleId))
  ok(result.controllingRuleIds.includes('rule.fk-charter.d3'))
})

test('R3 Gate 2 refuses a revoked standing-grant evidence set', () => {
  const mutated = structuredClone(full)
  const gate2 = mutated.operationAuthority.find(
    (operation) => operation.operationId === 'gate2.dispatch',
  )
  ok(gate2)
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
  ok(gate2 && irrelevant)
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
  ok(migration)
  ;(migration as { scopedDisposition: string }).scopedDisposition = 'Trust this migration.'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R3 public rule uses assurance and rejects parallel assuranceLevel', () => {
  const mutated = structuredClone(full) as AuthorityEnforcementRegistry & {
    rules: Array<Record<string, unknown>>
  }
  const rule = mutated.rules[0]
  ok(rule)
  rule.assuranceLevel = rule.assurance
  expectCode(mutated, 'SCHEMA_INVALID')
})

test('R3 manifest detects a fully rehashed coordinated semantic replacement', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d1')
  ok(rule)
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
  ok(rule)
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
    ok(rule)
    assert.deepEqual([rule.authoritySubject, rule.authorityClaim], identity)
  }
})

test('R4 every rule has one basis ref contained in its source refs', () => {
  for (const rule of full.rules) {
    const basis = (rule as typeof rule & { authorityBasisRef?: unknown }).authorityBasisRef
    ok(basis)
    ok(rule.sourceRefs.some((reference) => canonicalJson(reference) === canonicalJson(basis)))
  }
})

test('R4 shipped reconciliation rules retain repeated current semantic subjects', () => {
  for (const reconciliation of full.reconciliations.slice(0, 6)) {
    if (reconciliation.reconciliationId === 'missing-provenance-reference') {
      const provenance = full.rules.filter(
        (rule) => rule.authoritySubject === 'standing.provenance',
      )
      assert.equal(provenance.length, 1)
      ok(
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
    ok(
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
  // The promotion is not merely ineffective - it is UNCONSTRUCTIBLE, which is a stronger guarantee
  // and the honest one. Two shipped invariants make it so: a rule's `normalizedStatement` must bind
  // the normalized excerpt of every item it references, and every referenced item must map the rule
  // back reciprocally. A sourceRef borrowed from another source satisfies neither, so no valid
  // document carrying one exists. The previous version of this test asserted the amended registry
  // was VALID and then compared resolutions; that premise was false, and it was reported as one of
  // this round's ten failures.
  //
  // Checked rather than asserted: zero shipped rules carry more than one sourceRef.
  assert.equal(full.rules.filter((candidate) => candidate.sourceRefs.length > 1).length, 0)

  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d7')
  const corroborating = mutated.rules.find(
    (candidate) => candidate.sourceRefs[0]?.sourceId === 'standing-constraints',
  )?.sourceRefs[0]
  ok(rule)
  ok(corroborating)
  const referenceCount = rule.sourceRefs.length
  ;(rule.sourceRefs as (typeof rule.sourceRefs)[number][]).push(corroborating)
  assert.equal(rule.sourceRefs.length, referenceCount + 1, 'the corroborating ref must be added')
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  // Re-chained, so the refusal below is about the corroboration itself and not about a stale
  // binding manifest the mutation would otherwise have left behind.
  const amended = rechain(mutated)
  // PREMISE GUARD (R22). This test's premise is "the appended chain is well-formed, so every code
  // below is caused by the borrowed corroboration". Asserting only `includes` let it keep passing
  // when the document was ALSO invalid for an unrelated reason - it saw RULE_ORPHANED and stopped
  // looking. Naming the complete expected set is what makes the premise load-bearing.
  expectOnlyCodes(amended, 'RULE_ORPHANED', 'MIGRATION_EVIDENCE_INVALID')
  const observed = validateRegistry(amended).violations.map((violation) => violation.code)
  ok(
    observed.includes('RULE_ORPHANED'),
    `the borrowed inventory item does not map the rule back; observed ${observed.join(',')}`,
  )
  ok(
    observed.includes('MIGRATION_EVIDENCE_INVALID'),
    `the rule statement does not bind the borrowed excerpt; observed ${observed.join(',')}`,
  )
  // Fail-closed: the resolver refuses an invalid document outright, so a promotion smuggled in this
  // way can never reach a decision.
  const result = resolveAuthority(amended, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'repo-mutation',
    host: 'claude-windows-docker-loaded',
  })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  assert.equal(result.reasonCode, 'REGISTRY_INVALID')
})

test('R4 retired-from-agent-reading rules never control authority', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  const amended = rechain(mutated)
  // Retirement REMOVES enforcement, so a retirement that is not fully evidenced and
  // digest-verified must not take effect. It is validity-blocking, which is the named property:
  // a retired rule can never end up controlling, because the document never becomes resolvable.
  // PREMISE GUARD (R22): the appended chain is well-formed, so the only violations may be the
  // retirement objections this test names. Without this the test passes on a document that is
  // invalid for a reason it never checked.
  expectOnlyCodes(amended, 'RETIREMENT_EVIDENCE_INCOMPLETE', 'RETIREMENT_EVIDENCE_UNVERIFIED')
  const observed = validateRegistry(amended).violations.map((violation) => violation.code)
  ok(
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
    ok(record)
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
  ok(evidence)
  const reference = JSON.parse(evidence.reference) as { commit: string; path: string }
  assert.deepEqual(reference, {
    // `missing-provenance-reference` is byte-frozen and binds the initial dispatch commit, so it
    // states the snapshot it was authored against, not the live one (R16/R17).
    commit: LEGACY_SOURCE_SNAPSHOT_COMMIT,
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
    ok(rule)
    ok(
      rule.applicability.roles.includes('any') ||
        rule.applicability.roles.includes(vector.positiveRole as never),
    )
    if (vector.negativeRole === null) {
      assert.deepEqual(rule.applicability.roles, ['any'])
    } else {
      ok(!rule.applicability.roles.includes(vector.negativeRole as never))
    }
  })
}

test('R4 PDD hard rule 10 applies to ordinary builder build repo mutation', () => {
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.parcel-driven-development.hard-rule-10',
  )
  ok(rule)
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
    ok(item, rule.ruleId)
    assert.notEqual(item.locator.kind, 'heading', rule.ruleId)
    const basis = normalizeRuleText(item.normalizedExcerpt)
    const statement = normalizeRuleText(rule.normalizedStatement)
    if (item.ruleIds.length > 1) ok(basis.includes(statement), rule.ruleId)
    else assert.equal(basis, statement)
  }
})

test('R5 permission-profile reconciliation is grounded in charter D7 not D9', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'permission-profile-enforcement-bound',
  )
  ok(record)
  const refs = record.observedRefs.map((reference) => `${reference.sourceId}:${reference.itemId}`)
  ok(refs.includes('fk-charter:item.d7'))
  assert.equal(refs.includes('fk-charter:item.d9'), false)
  ok(record.authoritativeRuleIds.includes('rule.fk-charter.d7'))
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
    ok(record)
    ;(record.observedEvidence as unknown[]).splice(0, 1)
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

test('R5 missing provenance evidence uses the exact repository-relative absent path', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'missing-provenance-reference',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'missing-path')
  ok(evidence)
  assert.deepEqual(JSON.parse(evidence.reference), {
    // Byte-frozen record: the snapshot it was authored against, not the live one (R16/R17).
    commit: LEGACY_SOURCE_SNAPSHOT_COMMIT,
    path: 'plugins/foreman-line/docs/transcripts/defects_lessons.md',
  })
})

test('R5 source baseline manifest rejects a recomputed snapshot hash mutation', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources[0]
  ok(source)
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
    ok(rule)
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
      if (item.ruleIds.length === 0) ok(item.rationale.length >= 24)
    }
  }
})

test('R6 structural TypeScript coverage items are exclusions, not pseudo-authority', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'spec-linter-validator')
  ok(source)
  const imports = source.inventoryItems.filter((item) =>
    item.locator.anchor.startsWith('ts-import:'),
  )
  ok(imports.length > 0)
  for (const item of imports) {
    assert.deepEqual(item.ruleIds, [])
    assert.equal(item.exclusionDisposition, 'structural-ast')
  }
})

test('R6 coordinated fallback semantic replacement is rejected as uncurated', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d10')
  ok(rule)
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
    ok(record)
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
    ok(record)
    ;(record.observedEvidence as unknown[]).splice(0, 1)
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })

  test(`R6 reconciliation ${reconciliationId} rejects duplicated evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    ok(record)
    const evidence = record.observedEvidence[0]
    ok(evidence)
    ;(record.observedEvidence as unknown[]).splice(1, 0, structuredClone(evidence))
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })

  test(`R6 reconciliation ${reconciliationId} rejects substituted evidence`, () => {
    const mutated = structuredClone(full)
    const record = mutated.reconciliations.find(
      (candidate) => candidate.reconciliationId === reconciliationId,
    )
    ok(record)
    const evidence = record.observedEvidence[0]
    ok(evidence)
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
    ok(rule)
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
    ok(item, `${record.sourceId}:${record.itemId}`)
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
    ok(match)
    const record = r13Audit().find(
      (candidate) =>
        candidate.sourceId === match.source.sourceId && candidate.itemId === match.item.itemId,
    )
    ok(record, fragment)
    assert.equal(record.disposition, 'publish', fragment)
    assert.equal(record.exclusionCode, null, fragment)
    ok(record.ruleIds.length > 0, fragment)
    assert.equal(match.item.exclusionDisposition, null, fragment)
  })
}

test('R13 every excluded audit candidate has one item-specific rationale', () => {
  const excluded = r13Audit().filter((record) => record.disposition === 'exclude')
  ok(excluded.length > 0)
  for (const record of excluded) {
    assert.equal(record.ruleIds.length, 0, `${record.sourceId}:${record.itemId}`)
    ok(record.exclusionCode !== null, `${record.sourceId}:${record.itemId}`)
    ok(record.rationale.includes(record.itemId), `${record.sourceId}:${record.itemId}`)
    ok(!/metadata, explanatory context, or duplicate provenance/i.test(record.rationale))
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
      ok(record)
      ;(record as { disposition: 'publish' | 'exclude' }).disposition = 'publish'
    },
  ],
  [
    'rule set',
    (records: R13AuditRecord[]) => {
      const record = records.find((candidate) => candidate.disposition === 'publish')
      ok(record)
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
  ok(rule)
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
  ok(rule)
  ;(rule as { decision: string }).decision = 'ALLOW'
  ;(rule as { refusalCode: string | null }).refusalCode = null
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects stale-source promotion before resolution', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-linter-readme')
  ok(source)
  ;(source as { authorityEffect: string }).authorityEffect = 'binding'
  expectRegistryInvalid(mutated)
})

test('R13 public resolver rejects recomputed-digest semantic mutation before resolution', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d3')
  ok(rule)
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
  ok(source)
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
  ok(source)
  const asks = source.inventoryItems.filter((item) => /:ask:\[\]$/.test(item.locator.anchor))
  assert.equal(asks.length, 6)
  ok(
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
  ok(restrictions.every((rule) => rule.enforcementOwner === 'host-adapter'))
  ok(restrictions.every((rule) => rule.assurance === 'mediated'))
})

test('R13 permission YAML publishes exactly 51 narrative documentation rules', () => {
  const narrative = permissionYamlRules().filter(
    (rule) => rule.classification === 'narrative-provenance',
  )
  assert.equal(narrative.length, 51)
  ok(narrative.every((rule) => rule.decision === 'ADVISORY'))
  ok(narrative.every((rule) => rule.enforcementOwner === 'provenance-only'))
  ok(narrative.every((rule) => rule.assurance === 'narrative'))
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
  ok(source)
  const allowRules = permissionYamlRules().filter((rule) =>
    source.inventoryItems
      .find((item) => item.itemId === rule.authorityBasisRef.itemId)
      ?.locator.anchor.includes(':allow:'),
  )
  assert.equal(allowRules.length, 49)
  ok(allowRules.every((rule) => rule.classification === 'narrative-provenance'))
})

test('R13 builder-deps allowlist and note remain advisory documentation', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  ok(source)
  const targets = source.inventoryItems.filter(
    (item) =>
      item.locator.anchor === 'yaml-rule:builder-deps:network/egress' ||
      item.locator.anchor === 'yaml-rule:builder-deps:network/notes',
  )
  assert.equal(targets.length, 2)
  for (const item of targets) {
    assert.equal(item.ruleIds.length, 1)
    const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
    ok(rule)
    assert.equal(rule.classification, 'narrative-provenance')
    assert.equal(rule.decision, 'ADVISORY')
  }
})

test('R13 every permission rule has exact YAML basis and profile-scoped applicability', () => {
  const source = full.sources.find(
    (candidate) => candidate.sourceId === 'permission-profiles-registry',
  )
  ok(source)
  for (const rule of permissionYamlRules()) {
    const item: InventoryItem | undefined = source.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    ok(item, rule.ruleId)
    assert.equal(rule.authorityBasisRef.locatorDigest, locatorDigestFor(item.locator), rule.ruleId)
    assert.equal(rule.authorityBasisRef.valueDigest, item.valueDigest, rule.ruleId)
    ok(!rule.applicability.roles.includes('any'), rule.ruleId)
    ok(!rule.applicability.roles.includes('developer'), rule.ruleId)
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
  ok(record)
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
    ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

function publishedRuleContaining(sourceId: string, fragment: string) {
  const source = full.sources.find((candidate) => candidate.sourceId === sourceId)
  ok(source)
  const matches = source.inventoryItems.filter(
    (item) => item.normalizedExcerpt.includes(fragment) && item.ruleIds.length === 1,
  )
  assert.equal(matches.length, 1, `${sourceId}:${fragment}`)
  const rule = full.rules.find((candidate) => candidate.ruleId === matches[0]?.ruleIds[0])
  ok(rule)
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
  ok(positive.consideredRuleIds.includes(rule.ruleId))
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
  ok(positive.consideredRuleIds.includes(rule.ruleId))
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
  ok(positive.consideredRuleIds.includes(rule.ruleId))
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
  // R14 AC5: an applicable ADVISORY rule appears in `consideredRuleIds` "without exception or
  // hand-placed exclusion". The named invariant is that it is SEEN and yet does not CONTROL - the
  // former assertion, that it was absent from the considered set, is what R14 superseded, and it
  // also contradicted the sibling test asserting every operative rule is considered.
  const resolution = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'shaping',
    'state-transition',
  )
  ok(
    resolution.consideredRuleIds.includes(rule.ruleId),
    `${rule.ruleId} must be considered; considered ${resolution.consideredRuleIds.join(',')}`,
  )
  // Widened deliberately: `controllingRuleIds` is `readonly []` on the REQUIRE_HUMAN arm of the
  // union, which collapses the `includes` parameter to `never`.
  const controlling: readonly string[] = resolution.controllingRuleIds
  ok(!controlling.includes(rule.ruleId), `${rule.ruleId} is ADVISORY and must not control`)
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
  ok(rule)
  assert.equal(rule.authoritySubject, 'goal.coordinator-ownership')
  assert.equal(rule.classification, 'pre-action-refusal')
  const positive = resolveNatural(
    rule.authoritySubject,
    'coordinator',
    'runtime',
    'state-transition',
  )
  assert.equal(positive.outcome, 'RESOLVED')
  ok(positive.consideredRuleIds.includes(rule.ruleId))
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
  ok(positive.consideredRuleIds.includes(rule.ruleId))
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
    // `assert.notEqual(result.outcome, 'CONFLICT')` stood here and was a tautology: R14 removed the
    // CONFLICT outcome entirely, so `AuthorityResolution['outcome']` is 'RESOLVED' | 'REQUIRE_HUMAN'
    // and no input could ever have failed it. The invariant it was gesturing at is that a decision
    // split is a VALIDITY failure rather than a resolution outcome, so it is asserted where it
    // actually lives - on the document.
    ok(
      !codes(full).includes('RULE_CONFLICT'),
      'a decision split is validity-blocking, not a resolution outcome',
    )
    ok(result.consideredRuleIds.includes(rule.ruleId), rule.ruleId)
  }
})

test('R10 every operative goal and coordinator rule has a source-derived negative resolver vector', () => {
  const concreteRoles = ROLE_SCOPES.filter((role) => role !== 'any')
  for (const rule of r10GoalCoordinatorRules) {
    const excludedRole = concreteRoles.find((role) => !rule.applicability.roles.includes(role))
    ok(excludedRole, `${rule.ruleId} must preserve a source-narrowed role boundary`)
    const result = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: excludedRole,
      stage: firstConcrete(rule.applicability.stages, 'runtime'),
      operation: firstConcrete(rule.applicability.operations, 'state-transition'),
      host: firstConcrete(rule.applicability.hosts, 'provider-neutral'),
    })
    ok(!result.consideredRuleIds.includes(rule.ruleId), rule.ruleId)
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
  ok(record)
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
ok(reworkIds.includes('registry-rework-91145d7'))

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
    ok(record)
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
  ok(item)
  return item
}

for (const clause of r11CompoundClauses) {
  test(`R11 compound coordinator paragraph publishes ${clause.suffix} independently`, () => {
    const item = r11CompoundItem()
    const ruleId = `rule.coordinator-pattern.47b2eaa2f9ef.${clause.suffix}`
    ok(item.ruleIds.includes(ruleId))
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    ok(rule)
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
    ok(result.consideredRuleIds.includes(ruleId))
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
    ok(!result.consideredRuleIds.includes(ruleId))
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
    ok(item)
    assert.equal(item.exclusionDisposition, null)
    ok(item.ruleIds.length > 0)
    ok(item.normalizedExcerpt.includes(block.complete))
    const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
    ok(rule)
    assert.equal(rule.authorityBasisRef.itemId, block.itemId)
    assert.equal(rule.normalizedStatement, item.normalizedExcerpt)
  })
}

test('R11 protected normative blocks reject exclusion', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.276e79bdc002')
  ok(item)
  ;(item.ruleIds as string[]).splice(0)
  ;(item as { exclusionDisposition: string | null }).exclusionDisposition =
    'non-normative-explanation'
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('R11 protected normative blocks reject first-line truncation', () => {
  const mutated = structuredClone(full)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === 'item.c4828bcd6dfa')
  ok(item)
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
  ok(source)
  ok(protectedItem)
  ok(nearby)
  ok(rule)
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
  ok(source)
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
    ok(!rule.applicability.stages.includes('any'), rule.ruleId)
    assert.equal(rule.applicability.operations.length, 1, rule.ruleId)
  }
})

const r11ProfileRuleId = 'rule.permission-profiles-registry.7faf78a6f54a'

test('R11 loaded builder profile denial resolves only through mediated host authority', () => {
  const rule = full.rules.find((candidate) => candidate.ruleId === r11ProfileRuleId)
  ok(rule)
  const result = resolveAuthority(full, {
    authoritySubject: rule.authoritySubject,
    goal: 'foreman-kernel',
    role: 'builder',
    stage: 'build',
    operation: 'external-write',
    host: 'claude-windows-docker-loaded',
  })
  assert.equal(result.outcome, 'RESOLVED')
  ok(result.controllingRuleIds.includes(rule.ruleId))
})

for (const vector of [
  { name: 'unenrolled host', role: 'builder', host: 'claude-windows-docker-unenrolled' },
  { name: 'unsupported host', role: 'builder', host: 'unsupported-host' },
  { name: 'CI host', role: 'builder', host: 'ci' },
  { name: 'wrong role', role: 'developer', host: 'claude-windows-docker-loaded' },
] as const) {
  test(`R11 permission-profile authority excludes ${vector.name}`, () => {
    const rule = full.rules.find((candidate) => candidate.ruleId === r11ProfileRuleId)
    ok(rule)
    const result = resolveAuthority(full, {
      authoritySubject: rule.authoritySubject,
      goal: 'foreman-kernel',
      role: vector.role,
      stage: 'build',
      operation: 'external-write',
      host: vector.host,
    })
    assert.equal(result.outcome, 'REQUIRE_HUMAN')
    ok(!result.consideredRuleIds.includes(rule.ruleId))
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
    ok(rule, ruleId)
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
  ok(original)
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
  ok(item)
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
  ok(rule)
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
  ok(rule)
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
  ok(resolution.consideredRuleIds.includes(rule.ruleId))
  if (resolution.outcome === 'RESOLVED') {
    ok(!resolution.controllingRuleIds.includes(rule.ruleId))
  }
})

test('R12 a fourth corroborating or unratified ALLOW is rejected', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.coordinator-pattern.91dd60b00fd6',
  )
  ok(rule)
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
  ok(source)
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
  ok(header)
  assert.deepEqual(header.ruleIds, [])
  assert.equal(header.normalizedExcerpt, 'builder-architecture:')
  ok(!full.rules.some((rule) => rule.ruleId === 'rule.permission-profiles-registry.ffd2209ab94a'))
})

test('R12 reviewer git-commit denial binds only its canonical YAML rule item', () => {
  const source = r12ProfileSource()
  const item = source.inventoryItems.find((candidate) => candidate.itemId === 'item.35cf0f58fc34')
  const rule = full.rules.find(
    (candidate) => candidate.ruleId === 'rule.permission-profiles-registry.35cf0f58fc34',
  )
  ok(item)
  ok(rule)
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
  ok(source)
  ok(header)
  ok(rule)
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
  ok(item)
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
  ok(record)
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
    ok(record)
    mutate(record.observedEvidence as unknown[])
    expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
  })
}

test('R11 ships an exact typed migration from the R10 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-ee29973',
  )
  ok(record)
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
    ok(record)
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
      ok(record)
      mutate(record.observedEvidence as unknown[])
      expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
    }
  })
}

function publishedRuleFor(sourceId: string, itemId: string) {
  const source = full.sources.find((candidate) => candidate.sourceId === sourceId)
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === itemId)
  ok(item, `${sourceId}:${itemId}`)
  assert.equal(item.ruleIds.length, 1, `${sourceId}:${itemId}`)
  assert.equal(item.exclusionDisposition, null, `${sourceId}:${itemId}`)
  const rule = full.rules.find((candidate) => candidate.ruleId === item.ruleIds[0])
  ok(rule, `${sourceId}:${itemId}`)
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
  ok(curationStart >= 0 && curationEnd > curationStart)
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
  ok(curation)
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
      ok(rule.applicability.stages.includes('runtime'), itemId)
    } else {
      ok(!rule.applicability.stages.includes('runtime'), itemId)
    }
    ok(!rule.applicability.operations.includes('external-write'), itemId)
  }
})

test('R7 Gate 1 binds original ratification scoped re-ratification and nondelegability', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'gate1.ratify')
  ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  ok(statements.some((text) => text?.includes('Ratify Gate 1 and authorize Gate 2')))
  ok(statements.some((text) => text?.includes('Re-ratify Gate 1 amendments R1–R13')))
  ok(statements.some((text) => text?.includes('Gate 1 is nondelegable')))
})

test('R7 Gate 2 binds the standing charter grant and operative loop authorization', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'gate2.dispatch')
  ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  ok(statements.some((text) => text?.includes('AUTHORIZED AND RESUMED 2026-08-31')))
  ok(statements.some((text) => text?.includes('Gate 2 dispatch') && text.includes('FK-P0–FK-P21')))
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
      ok(allowed.has(item.exclusionDisposition ?? ''), `${source.sourceId}:${item.itemId}`)
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
    ok(rule, `D${index}`)
    assert.equal(rule.retirementState, 'active-reading', `D${index}`)
    assert.notEqual(rule.classification, 'narrative-provenance', `D${index}`)
    assert.notEqual(rule.classification, 'unsupported', `D${index}`)
  }
})

test('R8 publishes all nine charter goal-exit requirements individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  ok(source)
  const items = source.inventoryItems.filter(
    (item) =>
      item.locator.kind === 'numbered-item' &&
      item.locator.anchor.includes('## 9. Goal exit criterion') &&
      /^\d+\./.test(item.normalizedExcerpt),
  )
  assert.equal(items.length, 9)
  ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
})

test('R8 publishes all seventeen charter stop-condition bullets individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  ok(source)
  const items = source.inventoryItems.filter(
    (item) =>
      item.locator.kind === 'numbered-item' &&
      item.locator.anchor.includes('## 11. Stop conditions') &&
      item.normalizedExcerpt.startsWith('- '),
  )
  assert.equal(items.length, 17)
  ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
})

test('R8 publishes all five literal charter wave-exit contracts individually', () => {
  const source = full.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  ok(source)
  const items = source.inventoryItems.filter((item) =>
    /^\*\*Wave [0-4] exit:\*\*/.test(item.normalizedExcerpt),
  )
  assert.equal(items.length, 5)
  ok(items.every((item) => item.ruleIds.length === 1 && item.exclusionDisposition === null))
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
  ok(source)
  for (const itemId of required) {
    const inventoryItem: InventoryItem | undefined = source.inventoryItems.find(
      (candidate) => candidate.itemId === itemId,
    )
    ok(inventoryItem, itemId)
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
  ok(item)
  assert.deepEqual(item.ruleIds, [])
  assert.equal(item.exclusionDisposition, 'structural-ast')
})

test('R8 Allowed Files absence is carried only by exact reconciliation evidence', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'surfaces-allowed-files',
  )
  ok(record)
  assert.doesNotMatch(canonicalJson(record.observedRefs), /item\.80563af1788e/)
  ok(record.observedEvidence.some((evidence) => evidence.kind === 'command-result'))
  assert.match(record.unresolvedConsequence, /FK-P2 gap/)
})

test('R8 verification operation binds exact anti-self-production canon', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'verification.issue')
  ok(operation)
  assert.deepEqual(
    operation.requiredGitEvidence.map((reference) => `${reference.sourceId}:${reference.itemId}`),
    ['spec-convention:item.03f0830cd693', 'fk-loop-directive:item.dd8203551518'],
  )
})

test('R8 verification evidence resolves the exact independent-review meaning', () => {
  const operation = full.operationAuthority.find((row) => row.operationId === 'verification.issue')
  ok(operation)
  const statements = operation.requiredGitEvidence.map((reference) => {
    const source = full.sources.find((candidate) => candidate.sourceId === reference.sourceId)
    return source?.inventoryItems.find((item) => item.itemId === reference.itemId)
      ?.normalizedExcerpt
  })
  ok(statements.some((text) => text?.includes('No agent verifies its own claim')))
  ok(
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
  ok(operation)
  const substitute = mutated.rules
    .find((rule) => rule.ruleId === 'rule.fk-charter.d11')
    ?.sourceRefs.at(0)
  ok(substitute)
  ;(operation.requiredGitEvidence as (typeof substitute)[])[0] = substitute
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

test('R8 RULE_SEMANTICS_UNCURATED is a closed ratified result code', () => {
  const mutated = structuredClone(full)
  const rule = mutated.rules.find((candidate) => candidate.ruleId === 'rule.fk-charter.d2')
  ok(rule)
  ;(rule as { authoritySubject: string }).authoritySubject = 'fk-charter.d2'
  ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
  expectCode(mutated, 'RULE_SEMANTICS_UNCURATED')
})

test('R8 ships a typed migration from the R7 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-37afc65',
  )
  ok(record)
  assert.equal(record.migrationStatus, 'superseded-by-amendment')
  ok(
    record.observedEvidence.some(
      (evidence) =>
        evidence.kind === 'git-commit' &&
        evidence.reference === '5d7ca990574eb8416a1fc5ac40b90d9aec975b2b',
    ),
  )
  ok(record.supersedingEvidence)
})

test('R9 ships an exact typed migration from the R8 registry snapshot', () => {
  const record = full.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-91145d7',
  )
  ok(record)
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
    ok(record)
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

// R14 fix 13 (amended AC5): a resolved result must expose the classification, assurance and
// enforcement owner behind its decision, so a structural refusal from a kernel that does not exist
// cannot be read as a mediated one. 254 of the shipped rules are pre-action-refusal attributed to
// kernel-policy/structural while no kernel exists.
test('R14 a resolved result exposes classification, assurance, enforcement owner and severity', () => {
  const result = resolveAuthority(full, {
    authoritySubject: 'gate3.merge-authority',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'merge',
    operation: 'repo-mutation',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome !== 'RESOLVED') return
  assert.equal(result.decision, 'REFUSE')
  ok(RULE_CLASSIFICATIONS.includes(result.classification))
  // The honesty signal: this REFUSE is structural, owned by a kernel that does not exist yet.
  assert.equal(result.assurance, 'structural')
  assert.equal(result.enforcementOwner, 'kernel-policy')
  assert.equal(result.severity, 'critical')
})

test('R14 a resolved result reports the assurance of its controlling rules, not a default', () => {
  const result = resolveAuthority(full, {
    authoritySubject: 'gate2.dispatch-grant',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'shaping',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'RESOLVED')
  if (result.outcome !== 'RESOLVED') return
  assert.equal(result.decision, 'ALLOW')
  const controlling = result.controllingRuleIds.map((ruleId) => {
    const rule = full.rules.find((candidate) => candidate.ruleId === ruleId)
    ok(rule)
    return rule
  })
  ok(controlling.every((rule) => rule.assurance === result.assurance))
  ok(controlling.every((rule) => rule.enforcementOwner === result.enforcementOwner))
})

// R14 fix 14: Standing Constraint #13 requires an allowlist to pin identity, LOCATION and VALUE.
// The Gate 2 ALLOW waiver was keyed on the rule ID alone, so any future artifact wearing one of
// those names would have inherited the only ALLOW in the registry. Each axis is tested for refusal
// independently, because checking one while assuming the rest is default-deny-with-exception.
for (const [axis, mutate] of [
  [
    'source',
    (rule: AuthorityRule) => {
      ;(rule.authorityBasisRef as { sourceId: string }).sourceId = 'spec-convention'
    },
  ],
  [
    'item',
    (rule: AuthorityRule) => {
      ;(rule.authorityBasisRef as { itemId: string }).itemId = 'item.000000000000'
    },
  ],
  [
    'value digest',
    (rule: AuthorityRule) => {
      ;(rule.authorityBasisRef as { valueDigest: string }).valueDigest = '0'.repeat(64)
    },
  ],
  [
    'authority claim',
    (rule: AuthorityRule) => {
      ;(rule as { authorityClaim: string }).authorityClaim = 'coordinator-may-dispatch-anything'
    },
  ],
] as const) {
  test(`R14 a Gate 2 ALLOW whose ${axis} no longer matches the ratified grant is refused`, () => {
    const mutated = structuredClone(full)
    const rule = mutated.rules.find(
      (candidate) => candidate.ruleId === 'rule.fk-charter.15a44cf50bc6',
    )
    ok(rule)
    assert.equal(rule.decision, 'ALLOW')
    mutate(rule)
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    expectCode(mutated, 'AUTHORITY_ESCALATION')
  })
}

test('R14 a new rule wearing an approved Gate 2 rule name cannot inherit its ALLOW', () => {
  const mutated = structuredClone(full)
  const squatter = mutated.rules.find(
    (candidate) => candidate.ruleId === 'rule.fk-charter.15a44cf50bc6',
  )
  ok(squatter)
  // Same name, different binding: a squatted waiver is exactly what Standing Constraint #13's
  // location and value axes exist to refuse.
  ;(squatter.authorityBasisRef as { sourceId: string }).sourceId = 'standing-constraints'
  ;(squatter.authorityBasisRef as { itemId: string }).itemId = 'item.deadbeef0000'
  ;(squatter.authorityBasisRef as { valueDigest: string }).valueDigest = 'f'.repeat(64)
  ;(squatter as { bindingDigest: string }).bindingDigest = bindingDigestFor(squatter)
  expectCode(mutated, 'AUTHORITY_ESCALATION')
})

// ===========================================================================================
// AC4's head floor - obligations 1-3 (R19) and 4-5 (R21).
//
// The head is the ONE reconciliation exempt from `RECONCILIATION_RECORD_DIGESTS`, bound instead to
// the manifest recomputed live from the document it sits in. Before R19 nothing constrained its
// CONTENT, and two independent reviewers each drove a tampered registry through it and validated
// green. Every obligation below is exercised on its own axis, and each mutation asserts that it
// actually changed the record - a probe that writes a field's shipped value back mutates nothing
// and reads as "allowed", which is the trap that caught every party to this parcel at least once.
// ===========================================================================================

const CHAIN_HEAD_ID = 'registry-rework-df8155a'

type Reconciliation = AuthorityEnforcementRegistry['reconciliations'][number]
type Evidence = Reconciliation['observedEvidence'][number]

function headOf(document: AuthorityEnforcementRegistry): Reconciliation {
  const head = document.reconciliations.find((record) => record.reconciliationId === CHAIN_HEAD_ID)
  ok(head, `${CHAIN_HEAD_ID} must be present`)
  return head
}

/** Clone the shipped registry, mutate its chain head, and PROVE the mutation changed something. */
function withMutatedHead(mutate: (record: Reconciliation) => void): AuthorityEnforcementRegistry {
  const mutated = structuredClone(full)
  const head = headOf(mutated)
  const before = canonicalJson(head)
  mutate(head)
  assert.notEqual(canonicalJson(head), before, 'the mutation must actually change the head record')
  return mutated
}

function commandEvidenceReference(
  commandId: string,
  inputDigest: string,
  resultDigest: string,
): string {
  return canonicalJson({
    tool: '@foreman-line/authority-registry',
    toolVersion: '0.1.0',
    commandId,
    inputDigest,
    resultDigest,
    exitCode: 0,
    actorClass: 'coordinator',
  })
}

function parsedHeadCommand(record: Reconciliation, prefix: string) {
  const parsed = record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map(
      (evidence) =>
        JSON.parse(evidence.reference) as {
          commandId: string
          inputDigest: string
          resultDigest: string
        },
    )
    .find((command) => command.commandId.startsWith(prefix))
  ok(parsed, `head must carry a '${prefix}' command`)
  return parsed
}

function messagesFor(document: unknown): string[] {
  return validateRegistry(document).violations.map((violation) => violation.message)
}

/** The shipped registry is the positive control for every refusal below. */
test('AC4 head floor: the shipped registry is valid, so each refusal below is caused by its mutation', () => {
  assert.deepEqual(
    validateRegistry(full).violations.map((violation) => violation.code),
    [],
  )
})

// ------------------------------------------------------------------ obligation 1: exactly one link
test('AC4 O1 rejects a head declaring two superseding binding-manifest commands', () => {
  // R19 route A, the reproduced exploit: `chainLinkFor` selected chain commands with
  // `Array.prototype.find`, so unshifting a second superseding command bound the chain to whatever
  // manifest it declared while the honest command sat untouched below it. A fork INSIDE one record
  // is invisible to across-record fork detection, which keys on `prevDigest` BETWEEN records.
  const mutated = withMutatedHead((record) => {
    const honest = parsedHeadCommand(record, 'superseding-binding-manifest')
    const shadow = commandEvidenceReference(
      'superseding-binding-manifest-r14',
      honest.inputDigest,
      'f'.repeat(64),
    )
    ;(record.observedEvidence as Evidence[]).unshift({
      kind: 'command-result',
      reference: shadow,
      digest: sha256(shadow),
    })
  })
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('AC4 O1 rejects a head declaring two prior binding-manifest commands', () => {
  const mutated = withMutatedHead((record) => {
    const honest = parsedHeadCommand(record, 'registry-binding-manifest')
    const second = commandEvidenceReference(
      'registry-binding-manifest-r13',
      honest.inputDigest,
      'e'.repeat(64),
    )
    ;(record.observedEvidence as Evidence[]).unshift({
      kind: 'command-result',
      reference: second,
      digest: sha256(second),
    })
  })
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('AC4 O1 rejects a head declaring no superseding binding-manifest command', () => {
  const mutated = withMutatedHead((record) => {
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.filter(
        (evidence) =>
          evidence.kind !== 'command-result' ||
          !(JSON.parse(evidence.reference) as { commandId: string }).commandId.startsWith(
            'superseding-binding-manifest',
          ),
      )
  })
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

test('AC4 O1 rejects a head declaring no prior binding-manifest command', () => {
  const mutated = withMutatedHead((record) => {
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.filter(
        (evidence) =>
          evidence.kind !== 'command-result' ||
          !(JSON.parse(evidence.reference) as { commandId: string }).commandId.startsWith(
            'registry-binding-manifest',
          ),
      )
  })
  expectCode(mutated, 'MIGRATION_EVIDENCE_INVALID')
})

// ------------------------------------------------------------------ obligation 2: pins are not heads
test('AC4 O2 refuses a pinned record promoted into the head exemption by deletion', () => {
  // R19 route B, the reproduced exploit: head identity was positional and position depended on what
  // existed, so deleting the head promoted the previously pinned record OUT of its byte pin.
  // Repointing that promoted record at the live manifest then validated clean.
  const kept = structuredClone(full).reconciliations.filter(
    (record) => record.reconciliationId !== CHAIN_HEAD_ID,
  )
  assert.equal(kept.length, full.reconciliations.length - 1, 'the head must actually be removed')
  const promoted = kept[kept.length - 1]
  ok(promoted)
  const document = { ...structuredClone(full), reconciliations: kept }
  const liveManifest = registryBindingManifestDigest(document)
  let repointed = false
  for (const evidence of promoted.observedEvidence) {
    if (evidence.kind !== 'command-result') continue
    const parsed = JSON.parse(evidence.reference) as {
      commandId: string
      inputDigest: string
      resultDigest: string
    }
    if (!parsed.commandId.startsWith('superseding-binding-manifest')) continue
    assert.notEqual(parsed.resultDigest, liveManifest, 'repointing must not be a no-op')
    const reference = commandEvidenceReference(parsed.commandId, parsed.inputDigest, liveManifest)
    ;(evidence as { reference: string }).reference = reference
    ;(evidence as { digest: string }).digest = sha256(reference)
    repointed = true
  }
  ok(repointed, 'the promoted record must actually be repointed at the live manifest')
  ok(
    messagesFor(document).some((message) => message.includes('cannot be the migration chain head')),
    `expected the pinned-record-as-head refusal; observed ${messagesFor(document).join(' | ')}`,
  )
})

// ------------------------------------------------------------------ obligation 3: the head's shape
test('AC4 O3 rejects a head that does not declare superseded-by-amendment with superseding evidence', () => {
  // These two cannot be varied independently: a separate shipped invariant already requires
  // `migrationStatus === 'superseded-by-amendment'` and a non-null `supersedingEvidence` to agree
  // with each other, so breaking one alone trips that instead. Both head-floor messages are
  // asserted by name so each clause is shown to have fired.
  const mutated = withMutatedHead((record) => {
    ;(record as { migrationStatus: string }).migrationStatus = 'open'
    ;(record as { supersedingEvidence: unknown }).supersedingEvidence = null
  })
  const observed = messagesFor(mutated)
  ok(
    observed.some((message) => message.includes('does not declare migrationStatus')),
    `expected the migrationStatus refusal; observed ${observed.join(' | ')}`,
  )
  ok(
    observed.some((message) => message.includes('declares no superseding evidence')),
    `expected the superseding-evidence refusal; observed ${observed.join(' | ')}`,
  )
})

test('AC4 O3 rejects a head carrying no forty-hex lowercase git-commit evidence', () => {
  const mutated = withMutatedHead((record) => {
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.filter((evidence) => evidence.kind !== 'git-commit')
  })
  ok(
    messagesFor(mutated).some((message) =>
      message.includes('carries no git-commit evidence naming'),
    ),
    `expected the git-commit shape refusal; observed ${messagesFor(mutated).join(' | ')}`,
  )
})

test('AC4 O3 rejects a head whose command evidence is not coordinator-issued with exit code 0', () => {
  const mutated = withMutatedHead((record) => {
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) => {
        if (evidence.kind !== 'command-result') return evidence
        const parsed = JSON.parse(evidence.reference) as Record<string, unknown>
        assert.notEqual(parsed.actorClass, 'anonymous', 'degrading the actor must not be a no-op')
        const reference = canonicalJson({ ...parsed, actorClass: 'anonymous', exitCode: 137 })
        return { kind: evidence.kind, reference, digest: sha256(reference) }
      })
  })
  // R22 narrowed obligation 3 from "some command-result on the record" to "BOTH chain commands", so
  // the refusal message changed with it. The assertion stays pinned to message text rather than
  // loosening to "some violation fired": a test that stops naming which property failed is worth
  // less than one that has to be updated when the property changes.
  ok(
    messagesFor(mutated).some((message) =>
      message.includes('does not declare both binding-manifest chain commands as issued by'),
    ),
    `expected the command-shape refusal; observed ${messagesFor(mutated).join(' | ')}`,
  )
})

// ------------------------------------------------------------------ obligation 4: references bind
test('AC4 O4 rejects a head whose git-commit reference is repointed at another commit', () => {
  // Reviewer A's finding. The line this closes read
  // `expectedDigest = /^[0-9a-f]{64}$/.test(evidence.digest) ? evidence.digest : null` - a digest
  // compared TO ITSELF and reported as a binding check, so an arbitrary forty-hex value passed.
  const mutated = withMutatedHead((record) => {
    const prior = parsedHeadCommand(record, 'registry-binding-manifest')
    const bound = record.observedEvidence.find(
      (evidence) =>
        evidence.kind === 'git-commit' && sha256(evidence.reference) === prior.inputDigest,
    )
    ok(bound, 'the head must carry the git-commit its prior command binds')
    assert.notEqual(bound.reference, 'b'.repeat(40), 'repointing must not be a no-op')
    ;(bound as { reference: string }).reference = 'b'.repeat(40)
  })
  ok(
    messagesFor(mutated).some((message) =>
      message.includes('does not bind any git-commit evidence reference'),
    ),
    `expected the git-commit binding refusal; observed ${messagesFor(mutated).join(' | ')}`,
  )
})

test('AC4 O4 rejects a head whose bound git-commit evidence is deleted', () => {
  const mutated = withMutatedHead((record) => {
    const prior = parsedHeadCommand(record, 'registry-binding-manifest')
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.filter(
        (evidence) =>
          !(evidence.kind === 'git-commit' && sha256(evidence.reference) === prior.inputDigest),
      )
  })
  ok(
    messagesFor(mutated).some((message) =>
      message.includes('does not bind any git-commit evidence reference'),
    ),
    `expected the git-commit binding refusal; observed ${messagesFor(mutated).join(' | ')}`,
  )
})

test('AC4 O4 residual, stated and not disguised: a head git-commit digest is not independently checkable', () => {
  // R21's obligation is that where no binding is available for a kind, the ABSENCE IS STATED rather
  // than disguised as a check. This test states it, and pins its exact width.
  //
  // A `git-commit` digest attests the commit OBJECT BODY - `sha256(git cat-file -p <commit>)` - and
  // no hermetic validator can recompute that. What IS bound is the REFERENCE, via the prior
  // command's `inputDigest` (asserted two tests above). So rewriting the DIGEST alone, on the one
  // record exempt from the byte pin, is not independently detectable. That is a real residual and
  // this parcel exists to report residuals honestly rather than to imply coverage it lacks.
  //
  // It is narrow, and the control below is what makes "narrow" checkable: on any PINNED record the
  // very same edit is refused, because it breaks the record's canonical manifest.
  const headMutated = withMutatedHead((record) => {
    const target = record.observedEvidence.find((evidence) => evidence.kind === 'git-commit')
    ok(target, 'the head must carry git-commit evidence')
    assert.notEqual(target.digest, 'a'.repeat(64), 'the digest rewrite must not be a no-op')
    ;(target as { digest: string }).digest = 'a'.repeat(64)
  })
  assert.deepEqual(
    validateRegistry(headMutated).violations.map((violation) => violation.code),
    [],
    'stated residual: a head git-commit digest carries no independent binding',
  )

  // Control - the same edit on a pinned record IS refused, so the residual covers the head alone.
  const pinnedMutated = structuredClone(full)
  const pinned = pinnedMutated.reconciliations.find(
    (record) => record.reconciliationId === 'registry-rework-0683bc0',
  )
  ok(pinned)
  const pinnedTarget = pinned.observedEvidence.find((evidence) => evidence.kind === 'git-commit')
  ok(pinnedTarget)
  assert.notEqual(pinnedTarget.digest, 'a'.repeat(64), 'the digest rewrite must not be a no-op')
  ;(pinnedTarget as { digest: string }).digest = 'a'.repeat(64)
  expectCode(pinnedMutated, 'MIGRATION_EVIDENCE_INVALID')
})

// ------------------------------------------------------------------ obligation 5: distinctness
test('AC4 O5 rejects a record carrying the same attestation twice', () => {
  const mutated = withMutatedHead((record) => {
    const first = record.observedEvidence[0]
    ok(first)
    ;(record.observedEvidence as Evidence[]).push(structuredClone(first))
  })
  ok(
    messagesFor(mutated).some((message) => message.includes('carries the same')),
    `expected the distinctness refusal; observed ${messagesFor(mutated).join(' | ')}`,
  )
})

// ------------------------------------------------------------------ the exploit, end to end
test('AC4 R19 route A: a shadow link declaring the manifest of a tampered registry is refused', () => {
  // The payload is the on-the-nose one: silently retire every rule asserting that Gate 3 merges are
  // human-owned, in a parcel whose purpose is to represent honestly where enforcement is real.
  // Before R19 this validated with `valid: true` and zero violations, and `resolveAuthority` for
  // `gate3.merge-authority` fell from RESOLVED/REFUSE to REQUIRE_HUMAN with no controlling rules.
  const tampered = structuredClone(full)
  let flipped = 0
  for (const rule of tampered.rules) {
    if (
      rule.authoritySubject !== 'gate3.merge-authority' ||
      rule.retirementState !== 'active-reading'
    ) {
      continue
    }
    ;(rule as { retirementState: string }).retirementState = 'historical-only'
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    flipped += 1
  }
  assert.equal(flipped, 7, 'the payload must retire all seven active gate3.merge-authority rules')
  assert.notEqual(
    registryBindingManifestDigest(tampered),
    registryBindingManifestDigest(full),
    'the payload must actually change the binding manifest',
  )
  const head = headOf(tampered)
  const honest = parsedHeadCommand(head, 'superseding-binding-manifest')
  const shadow = commandEvidenceReference(
    'superseding-binding-manifest-r14',
    honest.inputDigest,
    registryBindingManifestDigest(tampered),
  )
  ;(head.observedEvidence as Evidence[]).unshift({
    kind: 'command-result',
    reference: shadow,
    digest: sha256(shadow),
  })
  expectCode(tampered, 'MIGRATION_EVIDENCE_INVALID')
  const result = resolveAuthority(tampered, {
    authoritySubject: 'gate3.merge-authority',
    goal: 'foreman-kernel',
    role: 'coordinator',
    stage: 'merge',
    operation: 'state-transition',
    host: 'provider-neutral',
  })
  assert.equal(result.outcome, 'REQUIRE_HUMAN')
  assert.equal(result.reasonCode, 'REGISTRY_INVALID')
})

// ===========================================================================================
// R22 obligations 6 and 7 - written FROM THE ATTACKS, not from the remedy.
//
// Reviewer A's sharpest finding in round 2 was that all four outstanding defects reproduced against
// a 563/563 green suite, because the AC4 block was built to the shape of the fix. Every test below
// is a mutation that validated GREEN before R22, run as a refusal - and the states R22 requires to
// be ADMITTED are asserted too, because an obligation that only ever refuses is half-measured.
//
// The payload is the on-the-nose one throughout: retiring every rule asserting that Gate 3 merges
// are human-owned and nondelegated, in a parcel whose purpose is representing honestly where
// enforcement is real.
// ===========================================================================================

/** Retire every `gate3.merge-authority` rule and re-digest it. Returns the count actually flipped. */
function retireMergeAuthority(document: AuthorityEnforcementRegistry): number {
  let flipped = 0
  for (const rule of document.rules) {
    if (rule.authoritySubject !== 'gate3.merge-authority') continue
    if (rule.retirementState !== 'active-reading') continue
    ;(rule as { retirementState: string }).retirementState = 'historical-only'
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    flipped += 1
  }
  // The no-op trap. This exact probe reported a clean bypass for three separate parties in this
  // parcel while flipping ZERO rules, because it keyed on `ruleId` instead of `authoritySubject`.
  assert.notEqual(flipped, 0, 'the payload must actually retire rules')
  return flipped
}

/** Re-anchor a record's superseding chain command at the document's live binding manifest. */
function reanchorTo(record: Reconciliation, document: AuthorityEnforcementRegistry): void {
  const live = registryBindingManifestDigest(document)
  let changed = false
  ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
    record.observedEvidence.map((evidence) => {
      if (evidence.kind !== 'command-result') return evidence
      const parsed = JSON.parse(evidence.reference) as Record<string, unknown>
      if (
        typeof parsed.commandId !== 'string' ||
        !parsed.commandId.startsWith('superseding-binding-manifest')
      ) {
        return evidence
      }
      const reference = canonicalJson({ ...parsed, resultDigest: live })
      if (reference !== evidence.reference) changed = true
      return { kind: evidence.kind, reference, digest: sha256(reference) }
    })
  assert.equal(changed, true, 're-anchoring must actually change the superseding command')
}

test('R22 control: the shipped registry is valid, so every refusal below is caused by its mutation', () => {
  assert.deepEqual(codes(full), [])
})

test('R22 O6 refuses deleting the head and substituting a copy under a fresh unpinned id', () => {
  // THE BLOCKER. Before R22 this validated `valid: true` with ZERO violations while retiring every
  // rule asserting merges are human-owned, and `resolveAuthority` collapsed from RESOLVED with four
  // controlling rules to REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY. The count still read 18.
  const mutated = structuredClone(full)
  retireMergeAuthority(mutated)
  const head = headOf(mutated)
  const substitute = structuredClone(head)
  ;(substitute as { reconciliationId: string }).reconciliationId = 'registry-rework-ff00001'
  ;(mutated as { reconciliations: readonly Reconciliation[] }).reconciliations = [
    ...mutated.reconciliations.filter((record) => record.reconciliationId !== CHAIN_HEAD_ID),
    substitute,
  ]
  assert.equal(
    mutated.reconciliations.some((record) => record.reconciliationId === CHAIN_HEAD_ID),
    false,
    'the head must actually be gone',
  )
  assert.equal(
    mutated.reconciliations.length,
    full.reconciliations.length,
    'the substitution keeps the count unchanged, which is what made it invisible',
  )
  // Re-anchor the SUBSTITUTE, not `headOf(mutated)`: that helper resolves by CHAIN_HEAD_ID and
  // carries its own `ok(head, ...)`, so calling it after deleting that id throws before the
  // assertion is reached. The helper's guard is what made this fail loudly instead of quietly.
  reanchorTo(substitute, mutated)
  expectOnlyCodes(mutated, 'RECONCILIATION_MISSING')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(mutated, "required rework migration 'registry-rework-df8155a' is missing")
})

test('R22 O6 refuses rewriting the head IN PLACE under the same id', () => {
  // The route that defeats a presence-only obligation: the head never departs. Before R22 this
  // erased the R14 attestation and validated green with zero violations.
  const mutated = structuredClone(full)
  retireMergeAuthority(mutated)
  const head = headOf(mutated)
  const beforeTopic = head.topic
  ;(head as { topic: string }).topic = 'Routine maintenance.'
  ;(head as { scopedDisposition: string }).scopedDisposition = 'Routine maintenance.'
  assert.notEqual(head.topic, beforeTopic, 'the attestation must actually be rewritten')
  reanchorTo(head, mutated)
  assert.equal(
    JSON.stringify(mutated).includes('R14 genesis-anchored migration chain'),
    false,
    'the attestation prose must actually be gone from the document',
  )
  expectOnlyCodes(mutated, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(mutated, 'topic/status contract changed')
})

test('R22 O6 refuses rewriting the head attestation even with no payload at all', () => {
  // Isolates the attestation binding from the payload: hollowing the record is refused on its own.
  const mutated = withMutatedHead((record) => {
    ;(record as { scopedDisposition: string }).scopedDisposition = 'Routine maintenance.'
  })
  expectOnlyCodes(mutated, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(mutated, 'topic/status contract changed')
})

test('R22 O7 ADMITS a properly chained appended head and preserves the demoted head', () => {
  // The state that MUST be admitted. Round 2 closed this path, which inverted the accepted residual
  // from append-only into history-destroying: the cheapest passing route became the one that erased
  // the attestation.
  const mutated = structuredClone(full)
  retireMergeAuthority(mutated)
  const amended = rechain(mutated)
  assert.equal(
    amended.reconciliations.some((record) => record.reconciliationId === CHAIN_HEAD_ID),
    true,
    'the shipped head must be PRESERVED, not replaced - that is the point of the obligation',
  )
  assert.equal(
    amended.reconciliations.length,
    full.reconciliations.length + 1,
    'the append must actually add a record',
  )
  assert.deepEqual(codes(amended), [])
})

test('R22 O7 refuses an append that also rewrites the demoted former head', () => {
  // Extending the chain does not license rewriting what came before it.
  const mutated = structuredClone(full)
  retireMergeAuthority(mutated)
  const amended = rechain(mutated)
  const demoted = amended.reconciliations.find(
    (record) => record.reconciliationId === CHAIN_HEAD_ID,
  )
  ok(demoted)
  const before = canonicalJson(demoted)
  ;(demoted as { scopedDisposition: string }).scopedDisposition = 'Routine maintenance.'
  assert.notEqual(canonicalJson(demoted), before, 'the demoted head must actually be rewritten')
  expectOnlyCodes(amended, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(amended, 'differs from its complete canonical record manifest')
})

test('R22 O3 refuses gutted chain commands that a coordinator decoy would have excused', () => {
  // Reviewer B's finding. Obligation 3 was `.some()` over EVERY command-result, so one decoy entry
  // satisfied it while both real chain commands carried tool 'attacker', anonymous, exit 137.
  const mutated = withMutatedHead((record) => {
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) => {
        if (evidence.kind !== 'command-result') return evidence
        const parsed = JSON.parse(evidence.reference) as Record<string, unknown>
        const reference = canonicalJson({
          ...parsed,
          tool: 'attacker',
          actorClass: 'anonymous',
          exitCode: 137,
        })
        return { kind: evidence.kind, reference, digest: sha256(reference) }
      })
    const decoy = canonicalJson({
      tool: '@foreman-line/authority-registry',
      toolVersion: '0.1.0',
      commandId: 'decoy-command',
      inputDigest: sha256('decoy-input'),
      resultDigest: sha256('decoy-result'),
      exitCode: 0,
      actorClass: 'coordinator',
    })
    ;(record.observedEvidence as Evidence[]).push({
      kind: 'command-result',
      reference: decoy,
      digest: sha256(decoy),
    })
  })
  ok(
    messagesFor(mutated).some((message) =>
      message.includes('does not declare both binding-manifest chain commands as issued by'),
    ),
    'expected the chain-command refusal; observed ' + messagesFor(mutated).join(' | '),
  )
})

// ------------------------------------------------- R22 obligation 5: the git-commit evidence shape
//
// Six head-only git-commit edits were admitted before R22 while the README described ONE. Four close
// under obligation 5 and are asserted as refusals below; TWO genuinely remain and are asserted as
// admitted, each with a control proving the same edit is refused on a pinned record. A stated limit
// narrower than the true one is a defect in this deliverable, so both halves are pinned by test.

/** The head's `git-commit` reference that the prior chain command's `inputDigest` binds. */
function boundGitReferenceOf(record: Reconciliation): string {
  const prior = record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map((evidence) => JSON.parse(evidence.reference) as { commandId: string; inputDigest: string })
    .find((command) => command.commandId.startsWith('registry-binding-manifest'))
  ok(prior, 'the head must declare a prior binding-manifest command')
  const bound = record.observedEvidence.find(
    (evidence) =>
      evidence.kind === 'git-commit' && sha256(evidence.reference) === prior.inputDigest,
  )
  ok(bound, 'the prior command must bind a git-commit reference on the same record')
  return bound.reference
}

test('R22 O5 refuses deleting the unbound second git-commit entry from the head', () => {
  const mutated = withMutatedHead((record) => {
    const bound = boundGitReferenceOf(record)
    const before = record.observedEvidence.length
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.filter(
        (evidence) => !(evidence.kind === 'git-commit' && evidence.reference !== bound),
      )
    assert.notEqual(record.observedEvidence.length, before, 'an entry must actually be removed')
  })
  expectOnlyCodes(mutated, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(mutated, 'git-commit evidence entries; exactly two are required')
})

test('R22 O5 refuses a fabricated extra git-commit entry on the head', () => {
  const mutated = withMutatedHead((record) => {
    ;(record.observedEvidence as Evidence[]).push({
      kind: 'git-commit',
      reference: 'c'.repeat(40),
      digest: sha256('fabricated-object-body'),
    })
  })
  expectOnlyCodes(mutated, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(mutated, 'git-commit evidence entries; exactly two are required')
})

test('R22 O5 refuses the bound git-commit reference repeated under a differing digest', () => {
  // Distinctness by the full (kind, reference, digest) triple was defeated by VARYING the digest.
  // The unbound entry is REPLACED rather than appended, so the record still carries exactly two
  // git-commit entries - which isolates the distinctness rule from the cardinality rule instead of
  // letting one test pass on the other's refusal.
  const mutated = withMutatedHead((record) => {
    const bound = boundGitReferenceOf(record)
    let replaced = false
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) => {
        if (evidence.kind !== 'git-commit' || evidence.reference === bound) return evidence
        replaced = true
        return { kind: 'git-commit', reference: bound, digest: sha256('varied-digest') }
      })
    assert.equal(replaced, true, 'the duplicate must actually be introduced')
  })
  const gitCount = headOf(mutated).observedEvidence.filter(
    (evidence) => evidence.kind === 'git-commit',
  ).length
  assert.equal(gitCount, 2, 'cardinality must still hold, so only distinctness can be refusing')
  ok(
    messagesFor(mutated).some((message) => message.includes('repeats a git-commit reference')),
    'expected the distinctness refusal; observed ' + messagesFor(mutated).join(' | '),
  )
})

test('R23 O5 refuses a head whose entire Git provenance is fabricated (G6)', () => {
  // Reviewer A's G6, and a correction to the round-3 test that carried this name.
  //
  // That test mapped BOTH git-commit entries to the SAME fabricated value, so it was refused by an
  // evidence-shape rule - it never exercised fabrication at all, and the shape it actually tested
  // was already covered by a sibling. Meanwhile the real attack - TWO DISTINCT forty-hex
  // fabrications, with the prior command's `inputDigest` recomputed to match one of them - was
  // ADMITTED at cc57658: `valid: true`, zero violations, with or without a payload retiring every
  // rule asserting that Gate 3 merges are human-owned.
  //
  // Two distinct values satisfy cardinality and reference-distinctness trivially, and the attacker
  // controls both sides of obligation 4, so only R23's head-scoped binder refuses this.
  const mutated = withMutatedHead((record) => {
    const fabricated = 'feedface'.repeat(5)
    const secondFabricated = '0'.repeat(39) + '1'
    assert.notEqual(fabricated, secondFabricated, 'the two fabrications must be DISTINCT')
    let index = 0
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) =>
        evidence.kind === 'git-commit'
          ? {
              kind: 'git-commit',
              reference: index++ === 0 ? fabricated : secondFabricated,
              digest: sha256('fabricated-object-body'),
            }
          : evidence,
      )
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) => {
        if (evidence.kind !== 'command-result') return evidence
        const parsed = JSON.parse(evidence.reference) as Record<string, unknown>
        if (
          typeof parsed.commandId !== 'string' ||
          !parsed.commandId.startsWith('registry-binding-manifest')
        ) {
          return evidence
        }
        const reference = canonicalJson({ ...parsed, inputDigest: sha256(fabricated) })
        return { kind: evidence.kind, reference, digest: sha256(reference) }
      })
  })
  // AC13 as amended by R23: assert the MESSAGE. Every chain obligation emits
  // MIGRATION_EVIDENCE_INVALID, so asserting the code - even exactly - cannot distinguish which
  // obligation refused, which is exactly how this test's predecessor passed for the wrong reason.
  const fabricatedGitCount = headOf(mutated).observedEvidence.filter(
    (evidence) => evidence.kind === 'git-commit',
  ).length
  assert.equal(fabricatedGitCount, 2, 'cardinality must still hold, so only the binder can refuse')
  expectMessage(
    mutated,
    "carries a git-commit reference that is neither bound by its prior binding-manifest command nor equal to the document's own sourceSnapshotCommit",
  )
})

test('R23 O5 refuses repointing the head UNBOUND git-commit reference (was a stated residual)', () => {
  // This was documented as the SECOND of two surviving residuals, on the ground that binding the
  // unbound reference to the snapshot commit was "not free". That number - 13 of 24 - was measured
  // at ALL-RECORDS scope while the defect is head-only. At HEAD scope the binder is free, because
  // the head's unbound reference IS `document.sourceSnapshotCommit`; the other eleven records carry
  // a HISTORICAL snapshot, which is why the wide version failed and the narrow one does not.
  //
  // Neither measurement was wrong. The scope was. So this residual is now closed rather than
  // reported, and what stands in its place is the assertion below.
  const mutated = withMutatedHead((record) => {
    const bound = boundGitReferenceOf(record)
    let repointed = false
    ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
      record.observedEvidence.map((evidence) => {
        if (evidence.kind !== 'git-commit' || evidence.reference === bound) return evidence
        assert.notEqual(evidence.reference, 'b'.repeat(40), 'the repoint must not be a no-op')
        repointed = true
        return { kind: 'git-commit', reference: 'b'.repeat(40), digest: evidence.digest }
      })
    assert.equal(repointed, true, 'the unbound reference must actually be repointed')
  })
  expectMessage(
    mutated,
    "carries a git-commit reference that is neither bound by its prior binding-manifest command nor equal to the document's own sourceSnapshotCommit",
  )

  // Control - the same edit on a PINNED record is refused too, by that record's own byte pin.
  const pinnedMutated = structuredClone(full)
  const pinned = pinnedMutated.reconciliations.find(
    (record) => record.reconciliationId === 'registry-rework-0683bc0',
  )
  ok(pinned)
  const target = pinned.observedEvidence.find(
    (evidence) =>
      evidence.kind === 'git-commit' && evidence.reference !== boundGitReferenceOf(pinned),
  )
  ok(target)
  ;(target as { reference: string }).reference = 'b'.repeat(40)
  expectOnlyCodes(pinnedMutated, 'MIGRATION_EVIDENCE_INVALID')
  // AC13 as amended by R23: the code alone cannot say WHICH obligation refused,
  // because every chain obligation emits it. Bind to the message.
  expectMessage(pinnedMutated, 'differs from its complete canonical record manifest')
})

test('R22 O7 limit, stated exactly: the append path is one deep, and the second is refused', () => {
  // The residual claims "append-only and history-preserving". This pins how FAR that goes, because a
  // stated limit WIDER than the true one is the same defect as one that is narrower - it just fails
  // in the flattering direction. Appending one properly chained head is admitted; a SECOND append
  // demotes the first appended record, which has no record-digest binding of its own, so it is
  // refused until someone pins it in `src/validate.ts`. That is the discipline every past rework
  // round followed, and it is why the eleven historical records carry pins at all.
  const amendedOnce = structuredClone(full)
  let firstFlipped = 0
  for (const rule of amendedOnce.rules) {
    if (rule.authoritySubject !== 'gate3.merge-authority') continue
    if (rule.retirementState !== 'active-reading') continue
    ;(rule as { retirementState: string }).retirementState = 'historical-only'
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    firstFlipped += 1
  }
  assert.notEqual(firstFlipped, 0, 'the first amendment must actually change a bound value')
  const first = rechain(amendedOnce)
  assert.deepEqual(codes(first), [], 'the FIRST append must be admitted')

  // A real second amendment, so the second appended record is not a self-loop on an unchanged
  // manifest - the manifest has to actually move or the chain walk sees a cycle rather than a link.
  const second = structuredClone(first)
  let flipped = 0
  for (const rule of second.rules) {
    if (rule.authoritySubject !== 'goal.exit-merge') continue
    if (rule.retirementState !== 'active-reading') continue
    ;(rule as { retirementState: string }).retirementState = 'historical-only'
    ;(rule as { bindingDigest: string }).bindingDigest = bindingDigestFor(rule)
    flipped += 1
  }
  assert.notEqual(flipped, 0, 'the second amendment must actually change a bound value')
  const amendedAgain = rechain(second, 'registry-rework-testchain2')
  assert.equal(
    amendedAgain.reconciliations.length,
    full.reconciliations.length + 2,
    'both appended records must be present',
  )
  ok(
    messagesFor(amendedAgain).some(
      (message) =>
        message.includes('registry-rework-testchain') &&
        message.includes('differs from its complete canonical record manifest'),
    ),
    'expected the demoted first appended record to be unbound; observed ' +
      messagesFor(amendedAgain).join(' | '),
  )
})

// ===========================================================================================
// The chain TOPOLOGY guards - orphan, cycle, fork, genesis anchor, truncation,
// wrong-predecessor and prefix-dodge.
//
// `verifyMigrationChain` has implemented every one of these since R16, and both round-2 reviewers
// probed them by hand and reported them firing. But a reviewer probe evaporates when the reviewer
// finishes: until now NONE of them was pinned by a test in any of the six files, so the core of the
// chain was held up by nothing that runs. That is the same defect class as everything else in this
// round - a guard nobody exercises is a guard nobody knows still works.
//
// Each construction below was MEASURED against this implementation before being written as a test,
// and each asserts the specific message its guard emits rather than "some violation fired", so it
// binds to the invariant it names. These deliberately do NOT use `expectOnlyCodes`: breaking the
// topology legitimately cascades into several violations, so the premise "valid apart from the
// thing under test" does not hold and an exact-set assertion would be brittle for correct reasons.
// ===========================================================================================

function chainRecordsOf(document: AuthorityEnforcementRegistry): Reconciliation[] {
  return document.reconciliations.filter((record) =>
    record.reconciliationId.startsWith('registry-rework-'),
  )
}

/** Rewrite one chain command on a record, returning whether anything actually changed. */
function patchChainCommand(
  record: Reconciliation,
  prefix: string,
  mutate: (command: Record<string, unknown>) => Record<string, unknown>,
): boolean {
  let changed = false
  ;(record as { observedEvidence: readonly Evidence[] }).observedEvidence =
    record.observedEvidence.map((evidence) => {
      if (evidence.kind !== 'command-result') return evidence
      const parsed = JSON.parse(evidence.reference) as Record<string, unknown>
      if (typeof parsed.commandId !== 'string' || !parsed.commandId.startsWith(prefix)) {
        return evidence
      }
      const reference = canonicalJson(mutate(parsed))
      if (reference !== evidence.reference) changed = true
      return { kind: evidence.kind, reference, digest: sha256(reference) }
    })
  return changed
}

function chainCommandOf(record: Reconciliation, prefix: string): Record<string, unknown> {
  const parsed = record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .map((evidence) => JSON.parse(evidence.reference) as Record<string, unknown>)
    .find(
      (command) => typeof command.commandId === 'string' && command.commandId.startsWith(prefix),
    )
  ok(parsed, 'the record must declare a ' + prefix + ' command')
  return parsed
}

function expectMessage(document: unknown, fragment: string): void {
  ok(
    messagesFor(document).some((message) => message.includes(fragment)),
    'expected a violation containing "' +
      fragment +
      '"; observed ' +
      messagesFor(document).join(' | '),
  )
}

test('chain topology: an off-path migration record is refused as an orphan', () => {
  const mutated = structuredClone(full)
  const template = chainRecordsOf(mutated)[0]
  ok(template)
  const commit = '1'.repeat(40)
  const prev = sha256('nowhere')
  const next = sha256('elsewhere')
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
  const prior = command('registry-binding-manifest-orphan', sha256(commit), prev)
  const superseding = command('superseding-binding-manifest-orphan', prev, next)
  const basis = template.observedRefs[0]
  ok(basis)
  const before = mutated.reconciliations.length
  ;(mutated.reconciliations as Reconciliation[]).push({
    reconciliationId: 'registry-rework-orphan1',
    topic: 'Off-path probe record.',
    observedRefs: [basis],
    observedEvidence: [
      { kind: 'git-commit', reference: commit, digest: sha256('orphan-prior-body') },
      { kind: 'git-commit', reference: 'f'.repeat(40), digest: sha256('orphan-snapshot-body') },
      { kind: 'command-result', reference: prior, digest: sha256(prior) },
      { kind: 'command-result', reference: superseding, digest: sha256(superseding) },
    ],
    authoritativeRuleIds: template.authoritativeRuleIds,
    scopedDisposition: 'Off-path probe.',
    unresolvedConsequence: 'Off-path probe.',
    migrationStatus: 'superseded-by-amendment',
    supersedingEvidence: basis,
  } as Reconciliation)
  assert.notEqual(mutated.reconciliations.length, before, 'the orphan must actually be added')
  expectMessage(mutated, 'do not lie on the single genesis-to-head chain')
})

test('chain topology: a self-looping head is refused as a cycle', () => {
  // The head declares prev === next, so the walk arrives at a digest that maps back to the record
  // it just consumed. This is the exact shape a no-op append produces, which is why `rechain()`
  // refuses to build one.
  const mutated = structuredClone(full)
  const records = chainRecordsOf(mutated)
  const head = records[records.length - 1]
  ok(head)
  const superseding = chainCommandOf(head, 'superseding-binding-manifest')
  const changed = patchChainCommand(head, 'superseding-binding-manifest', (command) => ({
    ...command,
    resultDigest: superseding.inputDigest,
  }))
  assert.equal(changed, true, 'the self-loop must actually be introduced')
  expectMessage(mutated, 'binding manifest chain contains a cycle')
})

test('chain topology: two records chaining from one predecessor are refused as a fork', () => {
  // Across-record fork detection, as distinct from R19 obligation 1 which refuses a fork INSIDE a
  // single record. Both exist because neither can see the other's case.
  const mutated = structuredClone(full)
  const records = chainRecordsOf(mutated)
  const twin = structuredClone(records[5])
  ok(twin)
  ;(twin as { reconciliationId: string }).reconciliationId = 'registry-rework-fork1'
  const changed = patchChainCommand(twin, 'superseding-binding-manifest', (command) => ({
    ...command,
    resultDigest: sha256('divergent-successor'),
  }))
  assert.equal(changed, true, 'the twin must actually diverge')
  ;(mutated.reconciliations as Reconciliation[]).push(twin)
  expectMessage(mutated, 'binding manifest chain forks at')
})

test('chain topology: a chain that does not start at the genesis anchor is refused', () => {
  // The genesis digest is the one pinned constant the walk starts from. Repointing the first
  // record away from it must not silently produce a shorter but self-consistent chain.
  const mutated = structuredClone(full)
  const first = chainRecordsOf(mutated)[0]
  ok(first)
  const bogus = sha256('not-the-genesis-anchor')
  // Both sides move together: the restatement axis is checked first and would otherwise mask this.
  const a = patchChainCommand(first, 'superseding-binding-manifest', (command) => ({
    ...command,
    inputDigest: bogus,
  }))
  const b = patchChainCommand(first, 'registry-binding-manifest', (command) => ({
    ...command,
    resultDigest: bogus,
  }))
  assert.equal(a && b, true, 'both chain-link sides must actually move')
  expectMessage(mutated, 'no record chaining from the genesis anchor')
})

test('chain topology: removing a middle record truncates the chain and orphans its successors', () => {
  const mutated = structuredClone(full)
  const victim = chainRecordsOf(mutated)[5]
  ok(victim)
  const victimId = victim.reconciliationId
  const before = mutated.reconciliations.length
  ;(mutated as { reconciliations: readonly Reconciliation[] }).reconciliations =
    mutated.reconciliations.filter((record) => record.reconciliationId !== victimId)
  assert.notEqual(mutated.reconciliations.length, before, 'the record must actually be removed')
  expectMessage(mutated, 'do not lie on the single genesis-to-head chain')
  expectMessage(mutated, "required rework migration '" + victimId + "' is missing")
})

test('chain topology: a record chaining from the wrong predecessor is refused', () => {
  // Distinct attack from truncation - nothing is deleted, one record simply claims a predecessor
  // that no record produces. It converges on the same guard, which is worth knowing rather than
  // assuming.
  const mutated = structuredClone(full)
  const middle = chainRecordsOf(mutated)[6]
  ok(middle)
  const bogus = sha256('wrong-predecessor')
  const a = patchChainCommand(middle, 'superseding-binding-manifest', (command) => ({
    ...command,
    inputDigest: bogus,
  }))
  const b = patchChainCommand(middle, 'registry-binding-manifest', (command) => ({
    ...command,
    resultDigest: bogus,
  }))
  assert.equal(a && b, true, 'the predecessor claim must actually change')
  expectMessage(mutated, 'do not lie on the single genesis-to-head chain')
})

test('chain topology: renaming a record out of the chain prefix does not let it escape', () => {
  // The chain is selected by id prefix, so a near-miss id is the obvious dodge: rename the head and
  // it stops being a chain record at all. R22 obligation 6 catches it by REQUIRED PRESENCE, and
  // obligation 2 catches the pinned record the rename would promote - two independent axes.
  const mutated = structuredClone(full)
  const target = mutated.reconciliations.find((record) => record.reconciliationId === CHAIN_HEAD_ID)
  ok(target)
  ;(target as { reconciliationId: string }).reconciliationId = 'registry-rewurk-df8155a'
  assert.equal(
    mutated.reconciliations.some((record) => record.reconciliationId === CHAIN_HEAD_ID),
    false,
    'the head id must actually be gone',
  )
  expectMessage(mutated, "required rework migration 'registry-rework-df8155a' is missing")
  expectMessage(mutated, 'cannot be the migration chain head')
})
