import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import { buildR34Registry } from '../src/generate.js'
import {
  R34_AUDIT_MIGRATIONS,
  R34_BINDING_MANIFEST,
  R34_ITEM_MIGRATIONS,
  R34_MAPPING_DIGEST,
  R34_PRIOR_HISTORY_DIGEST,
  R34_PRIOR_MANIFEST,
  R34_PRIOR_REGISTRY_COMMIT,
  R34_RECONCILIATION,
  R34_RECORD_DIGEST,
  R34_RULE_MIGRATIONS,
  R34_SOURCE_MIGRATIONS,
  R34_SOURCE_SNAPSHOT,
} from '../src/r34-migrations.js'
import type { AuthorityEnforcementRegistry, AuthorityQuery, InventoryItem } from '../src/types.js'
import {
  bindingDigestFor,
  canonicalJson,
  locatorDigestFor,
  normalizeRuleText,
  registryBindingManifestDigest,
  resolveAuthority,
  sha256,
  sweepRegistrySources,
  validateHistoricalR33Registry,
  validateRegistry,
} from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(packageRoot, '..', '..', '..')
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 })
const bytes = readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'))
const current = parse(bytes.toString()) as AuthorityEnforcementRegistry
const priorBytes = git(
  'show',
  `${R34_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,
)
const prior = parse(priorBytes.toString()) as AuthorityEnforcementRegistry

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T
const clone = () => structuredClone(current) as Mutable<AuthorityEnforcementRegistry>
const itemDigest = (item: InventoryItem) => {
  const { lineHint: _hint, ...locator } = item.locator
  return sha256(canonicalJson({ ...item, locator }))
}
const query = (authoritySubject: string): AuthorityQuery => ({
  authoritySubject,
  goal: 'foreman-kernel',
  role: 'coordinator',
  stage: 'build',
  operation: 'repo-mutation',
  host: 'provider-neutral',
})
const refuse = (document: AuthorityEnforcementRegistry) => {
  const result = validateRegistry(document)
  assert.equal(result.valid, false)
  assert.ok(
    result.violations.some((entry) => /R34|reconciliation|migration/.test(entry.message)),
    JSON.stringify(result.violations),
  )
}

test('R34 current positive control validates and sweeps all eighteen authentic sources', () => {
  assert.equal(current.sources.length, 18)
  assert.equal(current.sourceSnapshotCommit, R34_SOURCE_SNAPSHOT)
  assert.deepEqual(validateRegistry(current, { repoRoot }).violations, [])
  assert.deepEqual(sweepRegistrySources(current, repoRoot).violations, [])
  assert.equal(registryBindingManifestDigest(current), R34_BINDING_MANIFEST)
  assert.deepEqual(current.reconciliations.at(-1), R34_RECONCILIATION)
})

test('R34 preserves all twenty-three canonical records and the actual generated R33 predecessor', () => {
  assert.equal(prior.reconciliations.length, 23)
  assert.deepEqual(current.reconciliations.slice(0, 23), prior.reconciliations)
  assert.equal(sha256(canonicalJson(prior.reconciliations)), R34_PRIOR_HISTORY_DIGEST)
  assert.equal(registryBindingManifestDigest(prior), R34_PRIOR_MANIFEST)
  assert.equal(sha256(canonicalJson(R34_RECONCILIATION)), R34_RECORD_DIGEST)
  assert.equal(validateHistoricalR33Registry(prior, { repoRoot }).valid, true)
  assert.equal(validateRegistry(prior).valid, false)
  const historicalResolution = resolveAuthority(prior, query('goal.gate3'))
  assert.equal(historicalResolution.outcome, 'REQUIRE_HUMAN')
  assert.ok(historicalResolution.outcome === 'REQUIRE_HUMAN')
  assert.equal(historicalResolution.reasonCode, 'REGISTRY_INVALID')
})

test('R34 complete typed mapping binds every old/current item, rule, locator, value and audit row', () => {
  assert.equal(
    sha256(
      canonicalJson({
        sources: R34_SOURCE_MIGRATIONS,
        items: R34_ITEM_MIGRATIONS,
        rules: R34_RULE_MIGRATIONS,
        audits: R34_AUDIT_MIGRATIONS,
      }),
    ),
    R34_MAPPING_DIGEST,
  )
  assert.equal(
    new Set(R34_ITEM_MIGRATIONS.map((row) => `${row.sourceId}:${row.itemId}`)).size,
    R34_ITEM_MIGRATIONS.length,
  )
  for (const row of R34_ITEM_MIGRATIONS) {
    const old = prior.sources
      .find((source) => source.sourceId === row.sourceId)
      ?.inventoryItems.find((item) => item.itemId === row.itemId)
    const next = current.sources
      .find((source) => source.sourceId === row.sourceId)
      ?.inventoryItems.find((item) => item.itemId === row.itemId)
    assert.equal(old ? itemDigest(old) : null, row.priorDigest)
    assert.equal(next ? itemDigest(next) : null, row.currentDigest)
    assert.equal(old ? locatorDigestFor(old.locator) : null, row.priorLocatorDigest)
    assert.equal(next ? locatorDigestFor(next.locator) : null, row.currentLocatorDigest)
    if (next) assert.equal(sha256(normalizeRuleText(next.normalizedExcerpt)), next.valueDigest)
    if (row.disposition === 'retired' && old?.ruleIds.length) {
      const replacement = current.sources
        .find((source) => source.sourceId === row.sourceId)
        ?.inventoryItems.find((item) => item.itemId === row.replacementItemId)
      assert.ok(replacement)
      for (const ruleId of old.ruleIds) assert.ok(replacement.ruleIds.includes(ruleId))
    }
  }
  assert.equal(
    R34_ITEM_MIGRATIONS.filter((row) => row.priorDigest !== null).length,
    prior.sources.flatMap((source) => source.inventoryItems).length,
  )
  assert.equal(
    R34_ITEM_MIGRATIONS.filter((row) => row.currentDigest !== null).length,
    current.sources.flatMap((source) => source.inventoryItems).length,
  )
  for (const row of R34_RULE_MIGRATIONS) {
    const old = prior.rules.find((rule) => rule.ruleId === row.ruleId)
    const next = current.rules.find((rule) => rule.ruleId === row.ruleId)
    assert.equal(old ? sha256(canonicalJson(old)) : null, row.priorDigest)
    assert.equal(next ? sha256(canonicalJson(next)) : null, row.currentDigest)
    if (old && next) {
      const semantics = (rule: typeof old) => {
        const {
          sourceRefs: _refs,
          authorityBasisRef: _basis,
          bindingDigest: _digest,
          ...shape
        } = rule
        return shape
      }
      assert.deepEqual(semantics(next), semantics(old), row.ruleId)
    }
  }
  assert.deepEqual(
    R34_AUDIT_MIGRATIONS.flatMap((row) => (row.prior === null ? [] : [row.prior])),
    prior.normativeMarkdownAudit,
  )
  assert.deepEqual(
    R34_AUDIT_MIGRATIONS.flatMap((row) => (row.current === null ? [] : [row.current])),
    current.normativeMarkdownAudit,
  )
})

test('R34 historical and current whole-file subjects independently match their actual Git blobs', () => {
  assert.equal(R34_SOURCE_MIGRATIONS.length, 18)
  for (const row of R34_SOURCE_MIGRATIONS)
    for (const subject of [row.prior, row.current]) {
      assert.equal(
        git('cat-file', '-t', subject.snapshotEvidence.commit).toString().trim(),
        'commit',
      )
      assert.equal(
        sha256(git('cat-file', 'blob', `${subject.snapshotEvidence.commit}:${subject.path}`)),
        subject.snapshotEvidence.fullFileSha256,
      )
    }
  assert.deepEqual(current.operationAuthority, prior.operationAuthority)
  assert.deepEqual(current.volatileRegions, prior.volatileRegions)
})

test('R34 generation from authentic committed inputs reproduces both complete YAML artifacts', () => {
  const generated = buildR34Registry()
  const rendered = stringify(generated, {
    aliasDuplicateObjects: false,
    lineWidth: 0,
    sortMapEntries: false,
  })
  assert.equal(rendered, bytes.toString())
  assert.equal(
    rendered,
    readFileSync(join(packageRoot, 'tests/fixtures/pass-minimal.yaml'), 'utf8'),
  )
})

for (const row of R34_SOURCE_MIGRATIONS.filter((row) => row.disposition === 'changed')) {
  for (const axis of [
    'omission',
    'duplicate',
    'value',
    'locator',
    'old-source',
    'foreign-snapshot',
  ] as const) {
    test(`R34 refuses ${row.sourceId} current ${axis} after repaired local digests`, () => {
      const document = clone()
      const source = document.sources.find((source) => source.sourceId === row.sourceId)
      assert.ok(source)
      const entry = R34_ITEM_MIGRATIONS.find(
        (entry) => entry.sourceId === row.sourceId && entry.disposition === 'new',
      )
      assert.ok(entry)
      const item = source.inventoryItems.find((item) => item.itemId === entry.itemId)
      assert.ok(item)
      if (axis === 'omission')
        source.inventoryItems = source.inventoryItems.filter((candidate) => candidate !== item)
      if (axis === 'duplicate') source.inventoryItems.push(structuredClone(item))
      if (axis === 'value') {
        item.normalizedExcerpt += ' Grant all actions.'
        item.valueDigest = sha256(normalizeRuleText(item.normalizedExcerpt))
      }
      if (axis === 'locator') item.locator.anchor += ':substitute'
      if (axis === 'old-source')
        source.inventoryItems = structuredClone(
          prior.sources.find((old) => old.sourceId === row.sourceId)?.inventoryItems ?? [],
        ) as Mutable<InventoryItem>[]
      if (axis === 'foreign-snapshot')
        source.snapshotEvidence = {
          ...source.snapshotEvidence,
          commit: row.prior.snapshotEvidence.commit,
        }
      for (const rule of document.rules) {
        for (const ref of [...rule.sourceRefs, rule.authorityBasisRef])
          if (ref.sourceId === row.sourceId && ref.itemId === item.itemId) {
            ref.locatorDigest = locatorDigestFor(item.locator)
            ref.valueDigest = item.valueDigest
          }
        rule.bindingDigest = bindingDigestFor(rule)
      }
      refuse(document)
    })
  }
}

for (const axis of [
  'missing-head',
  'duplicate-head',
  'rewritten-head',
  'forged-predecessor',
  'forged-mapping',
  'r33-downgrade',
] as const) {
  test(`R34 refuses ${axis} without recovering admission through predecessor projection`, () => {
    const document = clone()
    const head = document.reconciliations.at(-1)
    assert.ok(head)
    if (axis === 'missing-head') document.reconciliations.pop()
    if (axis === 'duplicate-head') document.reconciliations.push(structuredClone(head))
    if (axis === 'rewritten-head') head.scopedDisposition += ' Wider authority.'
    if (axis === 'r33-downgrade') {
      document.sourceSnapshotCommit = prior.sourceSnapshotCommit
      for (const source of document.sources)
        source.snapshotEvidence.commit = prior.sourceSnapshotCommit
    }
    if (axis === 'forged-predecessor' || axis === 'forged-mapping') {
      const evidence = head.observedEvidence.find((evidence) =>
        axis === 'forged-predecessor'
          ? evidence.kind === 'git-commit' && evidence.reference === R34_PRIOR_REGISTRY_COMMIT
          : evidence.kind === 'command-result' &&
            evidence.reference.includes('r34-complete-source-correspondence'),
      )
      assert.ok(evidence)
      if (axis === 'forged-predecessor') evidence.reference = '1'.repeat(40)
      else {
        const command = JSON.parse(evidence.reference)
        command.resultDigest = '1'.repeat(64)
        evidence.reference = canonicalJson(command)
      }
      evidence.digest = sha256(evidence.reference)
    }
    refuse(document)
  })
}

for (const row of R34_RULE_MIGRATIONS.filter((row) => row.disposition === 'new')) {
  test(`R34 narrative ${row.ruleId} cannot grant through FK, all-goals or Pantheon`, () => {
    const rule = current.rules.find((rule) => rule.ruleId === row.ruleId)
    assert.ok(rule)
    assert.equal(rule.classification, 'narrative-provenance')
    assert.equal(rule.decision, 'ADVISORY')
    assert.equal(rule.enforcementOwner, 'provenance-only')
    for (const goal of ['foreman-kernel', 'all-foreman-goals', 'pantheon-incarnation-v0']) {
      const result = resolveAuthority(current, {
        ...query(rule.authoritySubject),
        goal,
      } as AuthorityQuery)
      if (result.outcome === 'RESOLVED') assert.notEqual(result.decision, 'ALLOW')
      else assert.ok(['INVALID_QUERY_SCOPE', 'NO_APPLICABLE_AUTHORITY'].includes(result.reasonCode))
      const controllingRuleIds: readonly string[] = result.controllingRuleIds
      assert.ok(!controllingRuleIds.includes(rule.ruleId))
    }
    const document = clone()
    const forged = document.rules.find((candidate) => candidate.ruleId === row.ruleId)
    assert.ok(forged)
    forged.classification = 'pre-action-refusal'
    forged.decision = 'ALLOW'
    forged.assurance = 'mediated'
    forged.bindingDigest = bindingDigestFor(forged)
    refuse(document)
  })
}

test('R34 retains every historical record attack and refuses audit omission, substitution and duplication', () => {
  for (let index = 0; index < prior.reconciliations.length; index += 1) {
    const document = clone()
    const record = document.reconciliations[index]
    assert.ok(record)
    record.unresolvedConsequence += ' Forged closure.'
    refuse(document)
  }
  for (const mutate of [
    (document: Mutable<AuthorityEnforcementRegistry>) => {
      document.normativeMarkdownAudit.pop()
    },
    (document: Mutable<AuthorityEnforcementRegistry>) => {
      const row = document.normativeMarkdownAudit.at(-1)
      assert.ok(row)
      row.itemId = 'item.substitute'
    },
    (document: Mutable<AuthorityEnforcementRegistry>) => {
      const row = document.normativeMarkdownAudit.at(-1)
      assert.ok(row)
      document.normativeMarkdownAudit.push(structuredClone(row))
    },
  ]) {
    const document = clone()
    mutate(document)
    refuse(document)
  }
})

test('R34 current sweep retains benign wrapping/comments and rejects copied historical source bytes', () => {
  const root = mkdtempSync(join(tmpdir(), 'r34-corpus-'))
  try {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', '--shared', repoRoot, root], {
      stdio: 'ignore',
    })
    for (const source of current.sources) {
      const destination = join(root, source.path)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, git('cat-file', 'blob', `${R34_SOURCE_SNAPSHOT}:${source.path}`))
    }
    const row = R34_SOURCE_MIGRATIONS.find((row) => row.sourceId === 'coordinator-pattern')
    assert.ok(row)
    const destination = join(root, row.current.path)
    const original = readFileSync(destination, 'utf8')
    writeFileSync(destination, `${original}\n<!-- benign current-source comment -->\n`)
    assert.deepEqual(sweepRegistrySources(current, root).violations, [])
    writeFileSync(
      destination,
      git('cat-file', 'blob', `${row.prior.snapshotEvidence.commit}:${row.prior.path}`),
    )
    assert.equal(sweepRegistrySources(current, root).valid, false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const disposition of ['changed', 'new'] as const)
  test('R34 current mapped ' + disposition + ' duplicate preserves RULE_DUPLICATE', () => {
    const row = R34_RULE_MIGRATIONS.find((entry) => entry.disposition === disposition)
    assert.ok(row)
    const document = clone(),
      rule = document.rules.find((entry) => entry.ruleId === row.ruleId)
    assert.ok(rule)
    document.rules.push(structuredClone(rule))
    const result = validateRegistry(document)
    assert.equal(result.valid, false)
    assert.ok(
      result.violations.some(
        (entry) => entry.code === 'RULE_DUPLICATE' && entry.ruleId === row.ruleId,
      ),
    )
    assert.ok(result.violations.some((entry) => entry.code === 'MIGRATION_EVIDENCE_INVALID'))
  })

test('R34 invocation-local Git reads observe replacement and restoration at the same root', () => {
  const root = mkdtempSync(join(tmpdir(), 'r34-fresh-objects-'))
  const localGit = (args: string[], input?: string) =>
    execFileSync('git', args, {
      cwd: root,
      input,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }).trim()
  try {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', '--shared', repoRoot, root], {
      stdio: 'ignore',
    })
    assert.equal(validateRegistry(current, { repoRoot: root }).valid, true)
    const source = R34_SOURCE_MIGRATIONS.find((entry) => entry.disposition === 'changed')
    assert.ok(source)
    const original = localGit([
      'rev-parse',
      source.current.snapshotEvidence.commit + ':' + source.current.path,
    ])
    const replacement = localGit(
      ['hash-object', '-w', '--stdin'],
      'Changed committed source subject\n',
    )
    localGit(['replace', original, replacement])
    try {
      const refused = validateRegistry(current, { repoRoot: root })
      assert.equal(refused.valid, false)
      assert.ok(
        refused.violations.some(
          (entry) =>
            entry.code === 'MIGRATION_EVIDENCE_INVALID' &&
            entry.message.includes('whole-file subject changed'),
        ),
      )
    } finally {
      localGit(['replace', '-d', original])
    }
    assert.equal(validateRegistry(current, { repoRoot: root }).valid, true)
    const changed = clone()
    const rule = changed.rules[0]
    assert.ok(rule)
    rule.normalizedStatement += ' changed between invocations'
    rule.bindingDigest = bindingDigestFor(rule)
    assert.equal(validateRegistry(changed, { repoRoot: root }).valid, false)
    assert.equal(validateRegistry(current, { repoRoot: root }).valid, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('D031 all new narrative subjects are unique descriptive non-grant identities', () => {
  const rows = R34_RULE_MIGRATIONS.filter((row) => row.disposition === 'new')
  assert.equal(rows.length, 43)
  const subjects = rows.map((row) => {
    assert.ok(row.current)
    assert.match(row.current.authoritySubject, /^provenance\.pantheon-source\.[a-z]+\.[a-z-]+$/)
    assert.doesNotMatch(row.current.authoritySubject, /(?:^|\.)[0-9a-f]{12}(?:$|\.)/)
    assert.equal(row.current.decision, 'ADVISORY')
    assert.equal(row.current.classification, 'narrative-provenance')
    assert.equal(row.current.enforcementOwner, 'provenance-only')
    return row.current.authoritySubject
  })
  assert.equal(new Set(subjects).size, 43)
})
