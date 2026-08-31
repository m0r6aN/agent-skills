import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import type { AuthorityEnforcementRegistry } from '../src/types.js'
import { canonicalJson, sha256, sweepRegistrySources } from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(packageRoot, '..', '..', '..')
const registry = parse(
  readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'), 'utf8'),
) as AuthorityEnforcementRegistry

function copyCorpus(tempRoot: string, withGit = true): void {
  if (withGit) {
    execFileSync('git', ['clone', '--quiet', '--no-checkout', '--shared', repoRoot, tempRoot], {
      stdio: 'ignore',
    })
  }
  for (const source of registry.sources) {
    const destination = join(tempRoot, source.path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, readFileSync(join(repoRoot, source.path)))
  }
}

test('R4 copied corpus without Git metadata fails closed', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-no-git-'))
  try {
    copyCorpus(tempRoot, false)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R4 blob object cannot impersonate commit migration evidence', () => {
  const mutated = structuredClone(registry)
  const record = mutated.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'registry-rework-6eb1c25',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'git-commit')
  assert.ok(evidence)
  const blob = execFileSync(
    'git',
    [
      'rev-parse',
      `${registry.sourceSnapshotCommit}:plugins/foreman-line/docs/goals/foreman-kernel/charter.md`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim()
  ;(evidence as { reference: string }).reference = blob
  ;(evidence as { digest: string }).digest = sha256(
    execFileSync('git', ['cat-file', '-p', blob], { cwd: repoRoot }),
  )
  const result = sweepRegistrySources(mutated, repoRoot)
  assert.ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
})

test('R4 missing-path evidence rejects a non-snapshot commit even when that commit is real', () => {
  const mutated = structuredClone(registry)
  const record = mutated.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'missing-provenance-reference',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'missing-path')
  assert.ok(record)
  assert.ok(evidence)
  const wrongCommit = '4666ea15caee8b231137f23325d14ea4526e338a'
  const reference = canonicalJson({
    commit: wrongCommit,
    path: 'docs/transcripts/defects_lessons.md',
  })
  ;(evidence as { reference: string }).reference = reference
  ;(evidence as { digest: string }).digest = sha256(reference)
  ;(record.observedEvidence as { kind: string; reference: string; digest: string }[]).push({
    kind: 'git-commit',
    reference: wrongCommit,
    digest: sha256(execFileSync('git', ['cat-file', '-p', wrongCommit], { cwd: repoRoot })),
  })
  const result = sweepRegistrySources(mutated, repoRoot)
  assert.ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
})

test('R4 natural binding prose added under a curated authority section is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-binding-prose-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        '## Standing authorizations and their limits',
        '## Standing authorizations and their limits\n\nOnly the coordinator may begin a parcel after the recorded record exists.',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R4 inserted top-level executable function is discovered without keyword matching', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-ts-construct-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\nfunction bypassEverything() { return true }\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R4 early return inside an inventoried function changes its complete construct digest', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-ts-return-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {',
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {\n  return { valid: true, errors: [], warnings: [] }',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' || violation.code === 'LOCATOR_MISSING',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R4 additive JSON schema constraint is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-json-constraint-'))
  try {
    copyCorpus(tempRoot)
    const path = join(
      tempRoot,
      'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
    )
    const schema = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    schema['x-r4-probe'] = true
    writeFileSync(path, JSON.stringify(schema, null, 2))
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R4 additive permission profile is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-profile-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/permission-profiles/permission-profiles.yaml')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n  r4-unknown-profile:\n    description: probe\n    envelope:\n      deny: []\n      ask: []\n      allow: []\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('shipped registry sweeps the complete pinned corpus with no gaps or conflicts', () => {
  const result = sweepRegistrySources(registry, repoRoot)
  assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  assert.equal(result.summary?.sourceCount, 18)
  assert.equal(result.summary?.unresolvedActiveConflicts, 0)
})

test('charter inventory contains one atomic record for each D1 through D20 decision', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
  assert.ok(source)
  const ids = source.inventoryItems.map((item) => item.itemId)
  for (let number = 1; number <= 20; number += 1) assert.ok(ids.includes(`item.d${number}`))
})

test('collapsing one charter decision row into another cannot preserve D-row coverage', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-d-row-collapse-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
    assert.ok(source)
    const path = join(tempRoot, source.path)
    const lines = readFileSync(path, 'utf8').replace(/\r\n?/g, '\n').split('\n')
    const d1 = lines.findIndex((line) => line.trim().startsWith('| D1 |'))
    const d2 = lines.findIndex((line) => line.trim().startsWith('| D2 |'))
    assert.notEqual(d1, -1)
    assert.notEqual(d2, -1)
    lines[d1] = `${lines[d1]} ${lines[d2]}`
    lines.splice(d2, 1)
    writeFileSync(path, lines.join('\n'))
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'LOCATOR_MISSING'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('plan review inventory contains one atomic record for each R1 through R13 correction', () => {
  const source = registry.sources.find(
    (candidate) => candidate.sourceId === 'fk-plan-review-findings',
  )
  assert.ok(source)
  const ids = source.inventoryItems.map((item) => item.itemId)
  for (let number = 1; number <= 13; number += 1) assert.ok(ids.includes(`item.r${number}`))
})

test('historical plan inventories the pre-heading two-gate thesis independently', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'foreman-line-plan')
  assert.ok(source?.inventoryItems.some((item) => item.itemId === 'item.two-gate-thesis'))
})

test('standing constraints inventory contains all thirteen atomic numbered rules', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'standing-constraints')
  assert.ok(source)
  for (let number = 1; number <= 13; number += 1) {
    assert.ok(source.inventoryItems.some((item) => item.itemId === `item.constraint-${number}`))
  }
})

test('PDD inventory contains all fifteen atomic hard rules', () => {
  const source = registry.sources.find(
    (candidate) => candidate.sourceId === 'parcel-driven-development',
  )
  assert.ok(source)
  for (let number = 1; number <= 15; number += 1) {
    assert.ok(source.inventoryItems.some((item) => item.itemId === `item.hard-rule-${number}`))
  }
})

test('operative rules do not use blanket any applicability shortcuts', () => {
  for (const rule of registry.rules.filter(
    (candidate) => candidate.retirementState !== 'historical-only',
  )) {
    assert.equal(rule.applicability.roles.includes('any'), false, rule.ruleId)
    assert.equal(rule.applicability.stages.includes('any'), false, rule.ruleId)
    assert.equal(rule.applicability.operations.includes('any'), false, rule.ruleId)
    assert.equal(rule.applicability.hosts.includes('any'), false, rule.ruleId)
  }
})

test('repeated source sweeps are byte-identical and read-only', () => {
  const before = readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'))
  const first = JSON.stringify(sweepRegistrySources(registry, repoRoot))
  const second = JSON.stringify(sweepRegistrySources(registry, repoRoot))
  const after = readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'))
  assert.equal(first, second)
  assert.deepEqual(after, before)
})

test('unrelated bytes outside every registered locator stay green', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-unrelated-'))
  try {
    copyCorpus(tempRoot)
    for (const source of registry.sources) {
      const destination = join(tempRoot, source.path)
      const content = readFileSync(destination, 'utf8')
      const prefix = source.path.endsWith('.json')
        ? '\n'
        : source.path.endsWith('.ts')
          ? '// UNRELATED_BYTES_OUTSIDE_REGISTERED_LOCATORS\n'
          : source.path.endsWith('.yaml')
            ? '# UNRELATED_BYTES_OUTSIDE_REGISTERED_LOCATORS\n'
            : '<!-- UNRELATED_BYTES_OUTSIDE_REGISTERED_LOCATORS -->\n'
      writeFileSync(destination, `${prefix}${content}`, 'utf8')
    }
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('absolute, traversal, and duplicate normalized source paths are refused', () => {
  for (const path of ['C:/escape.md', '../escape.md']) {
    const mutated = structuredClone(registry)
    ;(mutated.sources[0] as { path: string }).path = path
    const result = sweepRegistrySources(mutated, repoRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'))
  }
  const duplicate = structuredClone(registry)
  ;(duplicate.sources as AuthorityEnforcementRegistry['sources'][number][]).push(
    structuredClone(duplicate.sources[0] as NonNullable<(typeof duplicate.sources)[0]>),
  )
  const result = sweepRegistrySources(duplicate, repoRoot)
  assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_DUPLICATE_PATH'))
})

test('dot path segments are refused before resolution', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources[0]
  assert.ok(source)
  ;(source as { path: string }).path = source.path.replace('plugins/', 'plugins/./')
  assert.ok(
    sweepRegistrySources(mutated, repoRoot).violations.some(
      (violation) => violation.code === 'SOURCE_PATH_INVALID',
    ),
  )
})

test('missing and non-regular corpus sources are refused with stable codes', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-source-kind-'))
  try {
    copyCorpus(tempRoot)
    const sourcePath = join(tempRoot, registry.sources[0]?.path ?? '')
    rmSync(sourcePath)
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'RULE_SOURCE_MISSING',
      ),
    )
    mkdirSync(sourcePath)
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'SOURCE_NOT_REGULAR',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('symlink and reparse-point corpus sources are refused before following targets', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-source-link-'))
  try {
    copyCorpus(tempRoot)
    const sourcePath = join(tempRoot, registry.sources[0]?.path ?? '')
    const targetPath = join(tempRoot, 'junction-target')
    rmSync(sourcePath)
    mkdirSync(targetPath)
    symlinkSync(targetPath, sourcePath, 'junction')
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'SOURCE_SYMLINK_FORBIDDEN',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('a junction in a parent path component is refused before reading a source', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-parent-link-'))
  try {
    copyCorpus(tempRoot)
    const pluginsPath = join(tempRoot, 'plugins')
    const targetPath = join(tempRoot, 'plugins-target')
    renameSync(pluginsPath, targetPath)
    symlinkSync(targetPath, pluginsPath, 'junction')
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'SOURCE_SYMLINK_FORBIDDEN',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('comment text cannot impersonate an operative linter symbol anchor', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-comment-anchor-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'spec-linter-validator',
    )
    const item = source?.inventoryItems.find((candidate) =>
      candidate.locator.anchor.includes('new Ajv'),
    )
    assert.ok(source)
    assert.ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8').replace(
      item.locator.anchor,
      'const ajv = new Ajv({ allErrors: false })',
    )
    writeFileSync(path, `${content}\n// ${item.locator.anchor}\n`)
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('a new binding heading is reported as an uncovered inventory item', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-new-heading-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
    assert.ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n## Binding emergency authority\nBuilders must never self-ratify.\n`,
    )
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R3 additive D21 decision row is discovered independently of the curated inventory', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-d21-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
    assert.ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n| D21 | New authority | Must bind. |\n`)
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (v) => v.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R3 additive PDD hard rule sixteen is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-pdd16-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'parcel-driven-development',
    )
    assert.ok(source)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8').replace(
      '## Time, Calendars, and the Two Clocks',
      '16. **New binding rule.** Stop.\n\n## Time, Calendars, and the Two Clocks',
    )
    writeFileSync(path, content)
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (v) => v.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R3 new binding authority bullet is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-binding-bullet-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-loop-directive')
    assert.ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n- MUST refuse builder self-ratification.\n`)
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (v) => v.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R3 weakening a loop stop body fails even when the heading remains', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-loop-stop-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-loop-directive')
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === 'item.7eb6018d9e57',
    )
    assert.ok(source && item)
    const path = join(tempRoot, source.path)
    writeFileSync(
      path,
      readFileSync(path, 'utf8').replace(
        /6\. \*\*Gate 3 is not delegated\.\*\* Never merge\. Present the complete green chain and exact\r?\n\s+merge target to the human\./,
        '6. **Gate 3 is delegated.** Merge freely.',
      ),
    )
    assert.ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (v) => v.code === 'VALUE_DIGEST_MISMATCH' || v.code === 'LOCATOR_MISSING',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('real spec-linter return behavior mutation is detected outside comments', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-linter-behavior-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'spec-linter-validator',
    )
    assert.ok(source)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8').replace(
      'return { valid: errors.length === 0, errors, warnings }',
      'return { valid: true, errors, warnings }',
    )
    writeFileSync(path, content)
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('real permission-profile deny behavior mutation is detected', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-profile-behavior-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'permission-profiles-registry',
    )
    assert.ok(source)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8').replace(
      '        - Bash(git commit*)',
      '        - Bash(git status*)',
    )
    writeFileSync(path, content)
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('retirement evidence paths and byte digests are resolved beneath the admitted root', () => {
  const mutated = structuredClone(registry)
  const rule = mutated.rules.find(
    (candidate) =>
      !candidate.sourceRefs.some((reference) => reference.sourceId === 'standing-constraints'),
  )
  assert.ok(rule)
  ;(rule as { retirementState: string }).retirementState = 'retired-from-agent-reading'
  ;(rule as { retirementEvidence: unknown }).retirementEvidence = {
    predicate: { kind: 'predicate-contract', path: 'fake/predicate.txt', digest: '0'.repeat(64) },
    negativeRefusalTest: {
      kind: 'negative-test',
      path: 'fake/negative.txt',
      digest: '1'.repeat(64),
    },
    corpusSweep: { kind: 'corpus-sweep', path: 'fake/sweep.txt', digest: '2'.repeat(64) },
    independentBypassAttempt: {
      kind: 'independent-bypass',
      path: 'fake/bypass.txt',
      digest: '3'.repeat(64),
    },
  }
  assert.ok(
    sweepRegistrySources(mutated, repoRoot).violations.some(
      (violation) => violation.code === 'RETIREMENT_EVIDENCE_INCOMPLETE',
    ),
  )
})

test('multiple corpus violations are deterministically ordered by path, locator, rule, then code', () => {
  const mutated = structuredClone(registry)
  ;(mutated.sources[0] as { path: string }).path = '../z-escape.md'
  ;(mutated.sources[1] as { path: string }).path = 'C:/a-escape.md'
  const first = sweepRegistrySources(mutated, repoRoot)
  const second = sweepRegistrySources(mutated, repoRoot)
  assert.deepEqual(first, second)
  assert.deepEqual(
    first.violations.map((item) => item.sourcePath),
    [...first.violations.map((item) => item.sourcePath)].sort(),
  )
})

test('R5 Markdown numbered-item locators survive physical line wrapping', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-wrap-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        'Every external call (third-party library, Node.js I/O, network)',
        'Every external call\n   (third-party library, Node.js I/O, network)',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R5 unnumbered charter prose outside keyword-selected sections is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-complete-charter-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md')
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      '## 2. Problem statement',
      '## 2. Problem statement\n\nThe coordinator alone may activate an unregistered authority path.',
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R5 fenced Markdown prose cannot impersonate a live authority binding', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-markdown-fence-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      `~~~text\nThe coordinator may bypass every protected operation.\n~~~\n${content}`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

const r5TypeScriptAdditions = {
  function: 'function r5FunctionProbe() { return true }',
  const: 'const r5ConstProbe = 1',
  let: 'let r5LetProbe = 1',
  var: 'var r5VarProbe = 1',
  class: 'class R5ClassProbe { method() { return true } }',
  'default-export': 'export default function r5DefaultProbe() { return true }',
  method: 'class R5MethodProbe { r5Method() { return true } }',
  arrow: 'const r5ArrowProbe = () => true',
  'top-level-call': 'r5UnregisteredCall()',
} as const

for (const [form, addition] of Object.entries(r5TypeScriptAdditions)) {
  test(`R5 TypeScript compiler AST discovers additive ${form} form`, () => {
    const tempRoot = mkdtempSync(join(tmpdir(), `fk-p0-ts-${form}-`))
    try {
      copyCorpus(tempRoot)
      const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
      writeFileSync(path, `${readFileSync(path, 'utf8')}\n${addition}\n`)
      const result = sweepRegistrySources(registry, tempRoot)
      assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
}

test('R5 TypeScript compiler AST detects a nested branch mutation', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-ts-nested-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {',
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {\n  if (Date.now() > 0) { return { valid: true, errors: [], warnings: [] } }',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'VALUE_DIGEST_MISMATCH'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

for (const [form, mutate] of [
  [
    'comment',
    (content: string) =>
      content.replace(
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {',
        'export function validateSpecFrontmatter(doc: unknown, options?: ValidateOptions): ValidationResult {\n  // R5 benign comment',
      ),
  ],
  [
    'whitespace',
    (content: string) =>
      content.replace('  const errors: string[] = []', '    const errors: string[] = []'),
  ],
  [
    'import-order',
    (content: string) =>
      content.replace(
        "import { Ajv, type SchemaObject } from 'ajv'\nimport { parse } from 'yaml'",
        "import { parse } from 'yaml'\nimport { Ajv, type SchemaObject } from 'ajv'",
      ),
  ],
] as const) {
  test(`R5 TypeScript semantic inventory ignores benign ${form} changes`, () => {
    const tempRoot = mkdtempSync(join(tmpdir(), `fk-p0-ts-benign-${form}-`))
    try {
      copyCorpus(tempRoot)
      const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
      const original = readFileSync(path, 'utf8')
      const changed = mutate(original)
      assert.notEqual(changed, original, `${form} control must alter source bytes`)
      writeFileSync(path, changed)
      const result = sweepRegistrySources(registry, tempRoot)
      assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
}

test('R5 sweep verifies declared snapshot bytes at the bound Git commit', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources[0]
  assert.ok(source)
  ;(source.snapshotEvidence as { fullFileSha256: string }).fullFileSha256 = '0'.repeat(64)
  const result = sweepRegistrySources(mutated, repoRoot)
  assert.ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
})
