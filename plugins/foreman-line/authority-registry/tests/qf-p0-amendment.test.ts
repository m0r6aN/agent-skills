import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { markdownIdentityProjectionForTesting } from '../src/generate.js'
import {
  R33_AUDIT_ROWS,
  R33_BINDING_MANIFEST,
  R33_ITEM_MIGRATIONS,
  R33_PRIOR_MANIFEST,
  R33_PRIOR_REGISTRY_COMMIT,
  R33_RECONCILIATION,
  R33_RECORD_DIGEST,
  R33_SOURCE_SNAPSHOT,
} from '../src/r33-migrations.js'
import { R34_PRIOR_REGISTRY_COMMIT } from '../src/r34-migrations.js'
import { R32_BINDING_MANIFEST, R32_RECORD_DIGEST } from '../src/registry.js'
import type { AuthorityEnforcementRegistry, AuthorityRule, InventoryItem } from '../src/types.js'
import {
  bindingDigestFor,
  canonicalJson,
  locatorDigestFor,
  normalizeRuleText,
  registryBindingManifestDigest,
  sha256,
  sweepHistoricalR33Sources as sweepRegistrySources,
  validateHistoricalR33Registry as validateRegistry,
} from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(packageRoot, '..', '..', '..')
const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: repoRoot, maxBuffer: 32 * 1024 * 1024 })
// R33 remains an exact historical subject; current R34 controls are in r34-pantheon-succession.
const fullBytes = git(
  'show',
  `${R34_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,
)
const full = parse(fullBytes.toString()) as AuthorityEnforcementRegistry
const priorBytes = git(
  'show',
  `${R33_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,
)
const prior = parse(priorBytes.toString()) as AuthorityEnforcementRegistry
type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T
const clone = () => structuredClone(full) as Mutable<AuthorityEnforcementRegistry>
const itemFor = (d: AuthorityEnforcementRegistry, sourceId: string, itemId: string) => {
  const item = d.sources
    .find((s) => s.sourceId === sourceId)
    ?.inventoryItems.find((i) => i.itemId === itemId)
  assert.ok(item)
  return item as Mutable<InventoryItem>
}
const withoutHint = (i: InventoryItem) => {
  const { lineHint: _hint, ...locator } = i.locator
  return { ...i, locator }
}
function rebind(d: Mutable<AuthorityEnforcementRegistry>): void {
  for (const rule of d.rules) {
    for (const ref of [...rule.sourceRefs, rule.authorityBasisRef]) {
      const item = itemFor(d, ref.sourceId, ref.itemId)
      ref.locatorDigest = locatorDigestFor(item.locator)
      ref.valueDigest = item.valueDigest
    }
    rule.bindingDigest = bindingDigestFor(rule)
  }
  for (const row of d.normativeMarkdownAudit) {
    row.valueDigest = itemFor(d, row.sourceId, row.itemId).valueDigest
  }
  const head = d.reconciliations.find(
    (r) => r.reconciliationId === R33_RECONCILIATION.reconciliationId,
  )
  assert.ok(head)
  for (const evidence of head.observedEvidence) {
    if (evidence.kind !== 'command-result') continue
    const command = JSON.parse(evidence.reference)
    if (command.commandId === 'superseding-binding-manifest-r33') {
      command.resultDigest = registryBindingManifestDigest(d)
      evidence.reference = canonicalJson(command)
      evidence.digest = sha256(evidence.reference)
    }
  }
}
function refusesItem(d: AuthorityEnforcementRegistry, itemId: string): void {
  const result = validateRegistry(d)
  assert.equal(result.valid, false)
  assert.ok(
    result.violations.some(
      (v) =>
        v.code === 'AUTHORITY_ESCALATION' &&
        v.ruleId === itemId &&
        v.message.startsWith('R33 reserved item'),
    ),
    JSON.stringify(result.violations),
  )
}

test('QF-P0 admits the committed R33 successor, not the R32 snapshot', () => {
  assert.equal(full.sourceSnapshotCommit, R33_SOURCE_SNAPSHOT)
  const result = validateRegistry(full, { repoRoot })
  assert.equal(result.valid, true, JSON.stringify(result.violations))
  assert.deepEqual(result.violations, [])
  const historicalRoot = mkdtempSync(join(tmpdir(), 'qf-p0-historical-'))
  try {
    execFileSync(
      'git',
      ['clone', '--quiet', '--no-checkout', '--shared', repoRoot, historicalRoot],
      { stdio: 'ignore' },
    )
    for (const source of full.sources) {
      const destination = join(historicalRoot, source.path)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, git('cat-file', 'blob', `${R33_SOURCE_SNAPSHOT}:${source.path}`))
    }
    const sweep = sweepRegistrySources(full, historicalRoot)
    assert.equal(sweep.valid, true, JSON.stringify(sweep.violations))
    assert.deepEqual(sweep.violations, [])
  } finally {
    rmSync(historicalRoot, { recursive: true, force: true })
  }
  assert.deepEqual(full.reconciliations.at(-1), R33_RECONCILIATION)
})

test('R33 typed prior/new values and rule statements independently match committed predecessor and source blocks', () => {
  assert.equal(R33_ITEM_MIGRATIONS.length, 10)
  assert.equal(R33_ITEM_MIGRATIONS.filter((e) => e.disposition === 're-valued').length, 2)
  assert.equal(R33_AUDIT_ROWS.length, 6)
  for (const e of R33_ITEM_MIGRATIONS) {
    const old = prior.sources
      .find((s) => s.sourceId === e.sourceId)
      ?.inventoryItems.find((i) => i.itemId === e.itemId)
    assert.deepEqual(e.prior, old ?? null)
    assert.equal(e.priorLocatorDigest, old ? locatorDigestFor(old.locator) : null)
    assert.deepEqual(
      e.priorRules,
      prior.rules.filter((r) => old?.ruleIds.includes(r.ruleId)),
    )
    const live = itemFor(full, e.sourceId, e.itemId)
    assert.deepEqual(withoutHint(live), withoutHint(e.new))
    assert.equal(e.newLocatorDigest, locatorDigestFor(live.locator))
    assert.equal(live.valueDigest, sha256(normalizeRuleText(live.normalizedExcerpt)))
    const source = full.sources.find((s) => s.sourceId === e.sourceId)
    assert.ok(source)
    const text = git('cat-file', 'blob', `${R33_SOURCE_SNAPSHOT}:${source.path}`).toString()
    if (e.new.locator.kind === 'heading') {
      assert.deepEqual(live.ruleIds, [])
      assert.equal(live.exclusionDisposition, 'heading-only')
      assert.equal(live.normalizedExcerpt, '## Quick flags')
      assert.equal(e.itemId, `item.${sha256(e.new.locator.anchor).slice(0, 12)}`)
      continue
    }
    const block = markdownIdentityProjectionForTesting(e.sourceId, text).find(
      (b) => b.locator.anchor === live.locator.anchor,
    )
    assert.ok(block)
    assert.equal(block.itemId, e.itemId)
    assert.equal(block.normalizedExcerpt, live.normalizedExcerpt)
    assert.equal(e.newRules.length, 1)
    for (const rule of e.newRules) {
      assert.deepEqual(
        full.rules.find((r) => r.ruleId === rule.ruleId),
        rule,
      )
      assert.equal(rule.normalizedStatement, block.normalizedExcerpt)
      assert.equal(rule.bindingDigest, bindingDigestFor(rule))
      assert.deepEqual(rule.sourceRefs, [rule.authorityBasisRef])
      assert.equal(rule.authorityBasisRef.valueDigest, block.valueDigest)
      assert.deepEqual(rule.applicability.goals, ['all-foreman-goals'])
      assert.notEqual(rule.decision, 'ALLOW')
    }
    if (old) {
      assert.equal(e.newLocatorDigest, e.priorLocatorDigest)
      const immutable = (r: AuthorityRule) => {
        const {
          normalizedStatement: _statement,
          sourceRefs: _refs,
          authorityBasisRef: _basis,
          bindingDigest: _digest,
          ...shape
        } = r
        return shape
      }
      assert.deepEqual(e.newRules.map(immutable), e.priorRules.map(immutable))
    }
  }
  const stageZero = itemFor(full, 'goal-skill', 'item.02636597cc8d').normalizedExcerpt
  const loop = itemFor(full, 'goal-skill', 'item.95e72aecfbf6').normalizedExcerpt
  assert.equal(
    stageZero.split('such stored state may only restrict, never grant or widen authority').length,
    2,
  )
  assert.equal(
    loop.split('the `Active restrictions` entry and decision log (see Quick flags below)').length,
    2,
  )
})

test('R33 restricted delta preserves sixteen-source projection, unrelated rules, operation authority, volatile regions and all R32 history', () => {
  assert.equal(full.sources.length, 18)
  assert.equal(full.sources.flatMap((s) => s.inventoryItems).length, 1774)
  assert.equal(full.rules.length - prior.rules.length, 6)
  assert.equal(full.normativeMarkdownAudit.length - prior.normativeMarkdownAudit.length, 6)
  assert.equal(full.reconciliations.length - prior.reconciliations.length, 1)
  assert.deepEqual(full.reconciliations.slice(0, -1), prior.reconciliations)
  assert.equal(sha256(canonicalJson(prior.reconciliations.at(-1))), R32_RECORD_DIGEST)
  assert.equal(registryBindingManifestDigest(prior), R32_BINDING_MANIFEST)
  assert.equal(registryBindingManifestDigest(prior), R33_PRIOR_MANIFEST)
  assert.equal(registryBindingManifestDigest(full), R33_BINDING_MANIFEST)
  assert.equal(sha256(canonicalJson(R33_RECONCILIATION)), R33_RECORD_DIGEST)
  assert.deepEqual(full.operationAuthority, prior.operationAuthority)
  assert.deepEqual(full.volatileRegions, prior.volatileRegions)
  const affectedRules = new Set(R33_ITEM_MIGRATIONS.flatMap((e) => e.new.ruleIds))
  assert.deepEqual(
    full.rules.filter((r) => !affectedRules.has(r.ruleId)),
    prior.rules.filter((r) => !affectedRules.has(r.ruleId)),
  )
  for (const old of prior.sources) {
    const current = full.sources.find((s) => s.sourceId === old.sourceId)
    assert.ok(current)
    const affected = new Set(
      R33_ITEM_MIGRATIONS.filter((e) => e.sourceId === old.sourceId).map((e) => e.itemId),
    )
    const projection = (s: typeof old) => ({
      ...s,
      snapshotEvidence: null,
      inventoryItems: s.inventoryItems.filter((i) => !affected.has(i.itemId)).map(withoutHint),
    })
    assert.deepEqual(projection(current), projection(old), old.sourceId)
    assert.equal(current.snapshotEvidence.commit, R33_SOURCE_SNAPSHOT)
    assert.equal(
      current.snapshotEvidence.fullFileSha256,
      sha256(git('cat-file', 'blob', `${R33_SOURCE_SNAPSHOT}:${current.path}`)),
    )
  }
  assert.deepEqual(full.normativeMarkdownAudit.slice(-6), R33_AUDIT_ROWS)
  assert.deepEqual(
    full.normativeMarkdownAudit.slice(0, -6),
    prior.normativeMarkdownAudit.map((a) => {
      const e = R33_ITEM_MIGRATIONS.find((e) => e.sourceId === a.sourceId && e.itemId === a.itemId)
      return e ? { ...a, valueDigest: e.new.valueDigest } : a
    }),
  )
})

for (const e of R33_ITEM_MIGRATIONS) {
  for (const axis of [
    'identity',
    'location',
    'value',
    'disposition',
    'deletion',
    'substitution',
  ] as const) {
    test(`R33 refuses ${e.sourceId}:${e.itemId} ${axis} after incidental re-digestion`, () => {
      const d = clone()
      const item = itemFor(d, e.sourceId, e.itemId)
      if (axis === 'identity' || axis === 'substitution') {
        item.itemId = 'item.hostile-substitute'
        for (const r of d.rules)
          for (const ref of [...r.sourceRefs, r.authorityBasisRef]) {
            if (ref.sourceId === e.sourceId && ref.itemId === e.itemId) ref.itemId = item.itemId
          }
        for (const a of d.normativeMarkdownAudit)
          if (a.sourceId === e.sourceId && a.itemId === e.itemId) a.itemId = item.itemId
      } else if (axis === 'location') {
        item.locator.anchor += ':moved'
      } else if (axis === 'value') {
        item.normalizedExcerpt += ' Hostile extra authority.'
        item.valueDigest = sha256(normalizeRuleText(item.normalizedExcerpt))
        for (const r of d.rules.filter((r) => e.new.ruleIds.includes(r.ruleId)))
          r.normalizedStatement = item.normalizedExcerpt
      } else if (axis === 'disposition') {
        item.exclusionDisposition = 'non-normative-explanation'
      } else {
        const source = d.sources.find((s) => s.sourceId === e.sourceId)
        assert.ok(source)
        source.inventoryItems = source.inventoryItems.filter((i) => i.itemId !== e.itemId)
        d.rules = d.rules.filter((r) => !e.new.ruleIds.includes(r.ruleId))
        d.normativeMarkdownAudit = d.normativeMarkdownAudit.filter(
          (a) => a.sourceId !== e.sourceId || a.itemId !== e.itemId,
        )
      }
      rebind(d)
      refusesItem(d, e.itemId)
    })
  }
  for (const rule of e.newRules) {
    for (const axis of [
      'claim',
      'applicability',
      'classification',
      'assurance',
      'basis',
      'deletion',
    ] as const) {
      test(`R33 refuses reserved rule ${rule.ruleId} ${axis} with fresh binding digest`, () => {
        const d = clone()
        const r = d.rules.find((r) => r.ruleId === rule.ruleId)
        assert.ok(r)
        if (axis === 'claim') r.authorityClaim = 'hostile-grant'
        if (axis === 'applicability') r.applicability.roles = ['any']
        if (axis === 'classification')
          r.classification =
            r.classification === 'narrative-provenance'
              ? 'pre-action-refusal'
              : 'narrative-provenance'
        if (axis === 'assurance') r.assurance = 'mediated'
        if (axis === 'basis')
          r.authorityBasisRef = { ...r.authorityBasisRef, itemId: 'item.10d3c8d5b721' }
        if (axis === 'deletion') d.rules = d.rules.filter((r) => r.ruleId !== rule.ruleId)
        r.bindingDigest = bindingDigestFor(r)
        // Do not rebind a deliberately broken basis back to its honest value.
        const result = validateRegistry(d)
        assert.ok(
          result.violations.some(
            (v) =>
              v.code === 'AUTHORITY_ESCALATION' &&
              v.ruleId === rule.ruleId &&
              v.message.startsWith('R33 reserved rule'),
          ),
          JSON.stringify(result.violations),
        )
      })
    }
  }
}

for (const row of R33_AUDIT_ROWS)
  for (const axis of [
    'identity',
    'value',
    'disposition',
    'rules',
    'rationale',
    'deletion',
  ] as const) {
    test(`R33 refuses audit ${row.itemId} ${axis} by its named candidacy`, () => {
      const d = clone()
      const a = d.normativeMarkdownAudit.find(
        (a) => a.sourceId === row.sourceId && a.itemId === row.itemId,
      )
      assert.ok(a)
      if (axis === 'identity') a.itemId = 'item.audit-substitute'
      if (axis === 'value') a.valueDigest = sha256('hostile value')
      if (axis === 'disposition') {
        a.disposition = 'exclude'
        a.exclusionCode = 'non-normative-explanation'
        a.ruleIds = []
      }
      if (axis === 'rules') a.ruleIds = []
      if (axis === 'rationale') a.rationale += ' Hostile waiver.'
      if (axis === 'deletion')
        d.normativeMarkdownAudit = d.normativeMarkdownAudit.filter(
          (a) =>
            a !==
            d.normativeMarkdownAudit.find(
              (a) => a.sourceId === row.sourceId && a.itemId === row.itemId,
            ),
        )
      const result = validateRegistry(d)
      assert.ok(
        result.violations.some(
          (v) =>
            v.code === 'RULE_SEMANTICS_UNCURATED' &&
            v.ruleId === row.itemId &&
            v.message.startsWith('R33 audit candidacy'),
        ),
        JSON.stringify(result.violations),
      )
    })
  }

for (const axis of [
  'deletion',
  'substitution',
  'topic',
  'prior-input',
  'prior-result',
  'new-input',
  'new-result',
  'observed-ref',
  'superseding-ref',
] as const) {
  test(`R33 head ${axis} refuses independently`, () => {
    const d = clone()
    const head = d.reconciliations.at(-1)
    assert.ok(head)
    if (axis === 'deletion') d.reconciliations.pop()
    else if (axis === 'substitution') head.reconciliationId = 'registry-rework-hostile'
    else if (axis === 'topic') head.topic += ' Hostile rewrite.'
    else if (axis === 'observed-ref') {
      assert.ok(head.observedRefs[0])
      head.observedRefs[0].valueDigest = sha256('hostile')
    } else if (axis === 'superseding-ref') {
      assert.ok(head.supersedingEvidence)
      head.supersedingEvidence.valueDigest = sha256('hostile')
    } else {
      const evidence = head.observedEvidence.find(
        (e) =>
          e.kind === 'command-result' &&
          JSON.parse(e.reference).commandId ===
            (axis.startsWith('prior')
              ? 'registry-binding-manifest-r32'
              : 'superseding-binding-manifest-r33'),
      )
      assert.ok(evidence)
      const command = JSON.parse(evidence.reference)
      command[axis.endsWith('input') ? 'inputDigest' : 'resultDigest'] = sha256('hostile')
      evidence.reference = canonicalJson(command)
      evidence.digest = sha256(evidence.reference)
    }
    const result = validateRegistry(d)
    assert.ok(
      result.violations.some((v) =>
        axis === 'deletion' || axis === 'substitution'
          ? v.code === 'RECONCILIATION_MISSING' &&
            v.message.includes(R33_RECONCILIATION.reconciliationId)
          : v.code === 'MIGRATION_EVIDENCE_INVALID' && v.message.startsWith('R33 migration'),
      ),
      JSON.stringify(result.violations),
    )
  })
}

for (const old of prior.reconciliations) {
  test(`R33 preserves canonical historical record ${old.reconciliationId}`, () => {
    const d = clone()
    const record = d.reconciliations.find((r) => r.reconciliationId === old.reconciliationId)
    assert.ok(record)
    record.scopedDisposition += ' Hostile history rewrite.'
    const result = validateRegistry(d)
    assert.ok(
      result.violations.some(
        (v) =>
          v.code === 'MIGRATION_EVIDENCE_INVALID' &&
          v.message ===
            `reconciliation '${old.reconciliationId}' differs from its complete canonical record manifest`,
      ),
      JSON.stringify(result.violations),
    )
  })
}

for (const source of full.sources) {
  test(`R33 sweep binds committed snapshot hash for ${source.sourceId}`, () => {
    const d = clone()
    const s = d.sources.find((s) => s.sourceId === source.sourceId)
    assert.ok(s)
    s.snapshotEvidence.fullFileSha256 = sha256('hostile snapshot')
    const result = sweepRegistrySources(d, repoRoot)
    assert.ok(
      result.violations.some(
        (v) =>
          v.code === 'MIGRATION_EVIDENCE_INVALID' &&
          v.sourcePath === source.path &&
          v.message === 'declared source snapshot hash does not match committed source bytes',
      ),
      JSON.stringify(result.violations),
    )
  })
}
for (const commit of [R33_PRIOR_REGISTRY_COMMIT, R33_SOURCE_SNAPSHOT]) {
  test(`R33 repository-aware sweep independently checks Git object digest ${commit}`, () => {
    const d = clone()
    const evidence = d.reconciliations
      .at(-1)
      ?.observedEvidence.find((e) => e.kind === 'git-commit' && e.reference === commit)
    assert.ok(evidence)
    evidence.digest = sha256('hostile object body')
    const result = sweepRegistrySources(d, repoRoot)
    assert.ok(
      result.violations.some(
        (v) =>
          v.code === 'MIGRATION_EVIDENCE_INVALID' &&
          v.message.includes('Git object evidence digest changed') &&
          v.locator === commit,
      ),
      JSON.stringify(result.violations),
    )
  })
}
test('R33 rejects a coherent arbitrary snapshot rewrite, not merely desynchronized metadata', () => {
  const d = clone()
  d.sourceSnapshotCommit = '0000000000000000000000000000000000000001'
  for (const s of d.sources) s.snapshotEvidence.commit = d.sourceSnapshotCommit
  const head = d.reconciliations.at(-1)
  assert.ok(head)
  const e = head.observedEvidence.find((e) => e.reference === R33_SOURCE_SNAPSHOT)
  assert.ok(e)
  e.reference = d.sourceSnapshotCommit
  rebind(d)
  assert.ok(
    validateRegistry(d).violations.some(
      (v) => v.message === 'R33 adopted committed source snapshot changed',
    ),
  )
})

test('R33 hostile filesystem value and location probes use an isolated temporary corpus', () => {
  const root = mkdtempSync(join(tmpdir(), 'qf-p0-hostile-'))
  try {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', '--shared', repoRoot, root], {
      stdio: 'ignore',
    })
    for (const s of full.sources) {
      const destination = join(root, s.path)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, git('cat-file', 'blob', `${R33_SOURCE_SNAPSHOT}:${s.path}`))
    }
    for (const e of R33_ITEM_MIGRATIONS.filter((e) => e.newRules.length)) {
      const source = full.sources.find((s) => s.sourceId === e.sourceId)
      assert.ok(source)
      const path = join(root, source.path)
      const original = readFileSync(path, 'utf8')
      assert.ok(original.includes(e.new.normalizedExcerpt))
      writeFileSync(
        path,
        original.replace(e.new.normalizedExcerpt, `${e.new.normalizedExcerpt} Hostile authority.`),
      )
      const result = sweepRegistrySources(full, root)
      assert.ok(
        result.violations.some(
          (v) =>
            v.code === 'VALUE_DIGEST_MISMATCH' &&
            v.sourcePath === source.path &&
            v.locator === e.new.locator.anchor &&
            v.message === 'operative normalized source value changed',
        ),
        JSON.stringify(result.violations),
      )
      writeFileSync(path, original)
    }
    const source = full.sources.find((s) => s.sourceId === 'goal-skill')
    assert.ok(source)
    const path = join(root, source.path)
    const original = readFileSync(path, 'utf8')
    writeFileSync(path, original.replace('## Quick flags', '## Hostile moved flags'))
    const result = sweepRegistrySources(full, root)
    assert.ok(
      result.violations.some(
        (v) =>
          v.code === 'LOCATOR_MISSING' &&
          v.sourcePath === source.path &&
          v.locator === '# /goal — the Coordinator entry point > ## Quick flags',
      ),
      JSON.stringify(result.violations),
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('R33 evidence independently derives immutable before, committed provenance, zero after and complete deterministic diff', () => {
  const load = (name: string) =>
    JSON.parse(readFileSync(join(packageRoot, 'evidence/qf-p0', name), 'utf8'))
  const p = load('provenance.json'),
    b = load('before-sweep.json'),
    a = load('after-sweep.json'),
    diff = load('sweep-diff.json')
  assert.equal(p.priorRegistryCommit, R33_PRIOR_REGISTRY_COMMIT)
  assert.equal(p.sourceSnapshotCommit, R33_SOURCE_SNAPSHOT)
  assert.equal(p.buildBase, R33_SOURCE_SNAPSHOT)
  assert.equal(p.executionStartHead, '0c090b7c422e0a214430df28747a3f47ab6f1944')
  assert.equal(p.before.registrySha256, sha256(priorBytes))
  assert.equal(p.before.manifest, registryBindingManifestDigest(prior))
  assert.equal(p.before.exitCode, 1)
  assert.equal(b.valid, false)
  assert.equal(b.violations.length, 8)
  assert.equal(
    b.violations.filter((v: { code: string }) => v.code === 'VALUE_DIGEST_MISMATCH').length,
    2,
  )
  for (const v of b.violations) {
    assert.ok(['SOURCE_ITEM_UNCOVERED', 'VALUE_DIGEST_MISMATCH'].includes(v.code))
    assert.ok(
      [
        'plugins/foreman-line/skills/goal/SKILL.md',
        'plugins/foreman-line/docs/COORDINATOR-PATTERN.md',
      ].includes(v.sourcePath),
    )
  }
  assert.equal(a.valid, true)
  assert.deepEqual(a.violations, [])
  assert.equal(p.after.exitCode, 0)
  assert.deepEqual(p.after.command, p.before.command)
  assert.equal(p.after.registrySha256, sha256(fullBytes))
  assert.equal(p.after.manifest, registryBindingManifestDigest(full))
  assert.equal(p.before.headRecordDigest, sha256(canonicalJson(prior.reconciliations.at(-1))))
  assert.equal(p.after.headRecordDigest, sha256(canonicalJson(full.reconciliations.at(-1))))
  assert.equal(
    p.migrationModuleSha256,
    sha256(readFileSync(join(packageRoot, 'src/r33-migrations.ts'))),
  )
  for (const [key, file] of [
    ['before', 'before-sweep.json'],
    ['after', 'after-sweep.json'],
  ] as const) {
    assert.equal(
      p[key].sweepSha256,
      sha256(readFileSync(join(packageRoot, 'evidence/qf-p0', file))),
    )
  }
  assert.equal(
    p.sweepDiffSha256,
    sha256(readFileSync(join(packageRoot, 'evidence/qf-p0/sweep-diff.json'))),
  )
  const stable = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(stable)
      : x && typeof x === 'object'
        ? Object.fromEntries(
            Object.entries(x)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => [k, stable(v)]),
          )
        : x
  const rows = b.violations
    .map((v: unknown) => JSON.stringify(stable(v)))
    .sort()
    .map((v: string) => JSON.parse(v))
  assert.deepEqual(diff, {
    beforeValid: false,
    afterValid: true,
    beforeCount: 8,
    afterCount: 0,
    removed: rows,
    added: [],
  })
  assert.equal(p.sources.length, 18)
  for (const s of p.sources) {
    assert.equal(
      s.adoptedBlobSha256,
      sha256(git('cat-file', 'blob', `${p.sourceSnapshotCommit}:${s.path}`)),
    )
    assert.equal(s.beforeWorktreeSha256, s.adoptedBlobSha256)
  }
  for (const e of p.gitEvidence) {
    assert.equal(git('cat-file', '-t', e.commit).toString().trim(), 'commit')
    assert.equal(e.objectBodySha256, sha256(git('cat-file', '-p', e.commit)))
  }
})
