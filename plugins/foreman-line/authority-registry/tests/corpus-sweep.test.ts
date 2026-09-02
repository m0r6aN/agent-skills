import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
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
import { test as nodeTest } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { markdownIdentityProjectionForTesting } from '../src/generate.js'
import { R12_LEGACY_MARKDOWN_RULE_TARGETS } from '../src/registry.js'
import type { AuthorityEnforcementRegistry } from '../src/types.js'
import { canonicalJson, sha256, sweepRegistrySources } from '../src/validate.js'

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
const progressLogPath = join(tmpdir(), `fk-p0-progress-corpus-sweep.log`)
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
    for (const axis of [
      rule.applicability.roles,
      rule.applicability.stages,
      rule.applicability.operations,
      rule.applicability.hosts,
    ]) {
      assert.ok(axis.length > 0, rule.ruleId)
      if (axis.includes('any' as never)) assert.deepEqual(axis, ['any'], rule.ruleId)
    }
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

test('R6 visible prose before a same-line HTML comment is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-html-prefix-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        '## Standing authorizations and their limits',
        '## Standing authorizations and their limits\n\nOnly the coordinator may mint this new grant. <!-- R6 hidden note -->',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 visible prose after a same-line HTML comment is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-html-suffix-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        '## Standing authorizations and their limits',
        '## Standing authorizations and their limits\n\n<!-- R6 hidden note --> Only the coordinator may mint this new grant.',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 visible prose after a multiline HTML comment close is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-html-multiline-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    const content = readFileSync(path, 'utf8')
    writeFileSync(
      path,
      content.replace(
        '## Standing authorizations and their limits',
        '## Standing authorizations and their limits\n\n<!-- R6 hidden\nnote --> Only the coordinator may mint this new grant.',
      ),
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 comment-only Markdown remains non-operative', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-html-only-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n<!-- Only the coordinator may mint this hidden grant. -->\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 additive TypeScript side-effect import is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-side-effect-import-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    writeFileSync(path, `import 'node:diagnostics_channel'\n${readFileSync(path, 'utf8')}`)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 additive TypeScript value import binding is discovered', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-value-import-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    writeFileSync(
      path,
      `import { basename as r6Probe } from 'node:path'\n${readFileSync(path, 'utf8')}`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 TypeScript value import module retargeting changes operative inventory', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-value-import-retarget-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/cli.ts')
    const content = readFileSync(path, 'utf8')
    assert.ok(content.includes("from 'node:path'"))
    writeFileSync(path, content.replace("from 'node:path'", "from 'node:path/posix'"))
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' || violation.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R6 additive TypeScript type-only import remains non-operative', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-type-import-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    writeFileSync(
      path,
      `import type { Stats as R6Stats } from 'node:fs'\n${readFileSync(path, 'utf8')}`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R7 unmatched HTML comment cannot hide following binding prose', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-unmatched-comment-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n<!-- unmatched\nOnly the coordinator may mint this new grant.\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R7 four-space pseudo-fences cannot hide binding prose', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-indented-fence-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n    \`\`\`text\nOnly the coordinator may mint this new grant.\n    \`\`\`\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R8 backtick in backtick-fence info is visible and cannot hide binding prose', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-backtick-info-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n\`\`\`lang\`bad\nOnly the coordinator may mint this new grant.\n\`\`\`\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R9 raw mixed comment and backtick info cannot become a hiding fence after comment masking', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-raw-fence-comment-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n\`\`\`lang<!--\`-->\nOnly the coordinator may mint this new grant.\n\`\`\`\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R9 valid fenced standing-constraint number is ignored by the shared Markdown map', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-fenced-standing-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n\`\`\`text\n14. **MUST remain a fenced example.**\n\`\`\`\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

for (const [name, fencedBody] of [
  ['heading', '## Binding new authority'],
  ['D row', '| D21 | New binding decision | MUST bind. |'],
  ['R row', '| R14 | New binding review rule | MUST bind. |'],
  ['numbered hard rule', '16. **MUST bind this example.**'],
] as const) {
  test(`R8 valid fenced ${name} is ignored by every Markdown discovery layer`, () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-fenced-layer-'))
    try {
      copyCorpus(tempRoot)
      const sourcePath =
        name === 'numbered hard rule'
          ? 'plugins/foreman-line/skills/parcel-driven-development/SKILL.md'
          : name === 'R row'
            ? 'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md'
            : 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md'
      const path = join(tempRoot, sourcePath)
      writeFileSync(path, `${readFileSync(path, 'utf8')}\n\`\`\`text\n${fencedBody}\n\`\`\`\n`)
      const result = sweepRegistrySources(registry, tempRoot)
      assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
}

test('R7 mixed fence delimiters do not close a correctly paired fence', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-mixed-fence-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n~~~text\n\`\`\`\nOnly the coordinator may mint this fenced example.\n~~~\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R7 mixed type and value import order is semantically stable', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-mixed-import-order-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    const content = readFileSync(path, 'utf8')
    const changed = content.replace('{ Ajv, type SchemaObject }', '{ type SchemaObject, Ajv }')
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R7 ambient declarations remain non-operative', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-ambient-declare-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/spec-linter/src/validate.ts')
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\ndeclare function r7AmbientProbe(): void\ndeclare namespace R7Ambient { interface Value { ok: true } }\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

for (const [name, mutation] of [
  ['add', (text: string) => text.replace('deny:', "deny:\n        - 'Bash(r7-new-deny*)'")],
  ['delete', (text: string) => text.replace(/\n\s+- Bash\(git push\*\)/, '')],
  ['retarget', (text: string) => text.replace('Bash(git push*)', 'Bash(git push --force*)')],
  [
    'move',
    (text: string) =>
      text
        .replace("        - 'Bash(git push*)'", '')
        .replace('ask:', "ask:\n        - 'Bash(git push*)'"),
  ],
] as const) {
  test(`R7 permission-profile nested ${name} mutation is discovered`, () => {
    const tempRoot = mkdtempSync(join(tmpdir(), `fk-p0-profile-${name}-`))
    try {
      copyCorpus(tempRoot)
      const path = join(
        tempRoot,
        'plugins/foreman-line/permission-profiles/permission-profiles.yaml',
      )
      const content = readFileSync(path, 'utf8')
      const changed = mutation(content)
      assert.notEqual(changed, content)
      writeFileSync(path, changed)
      const result = sweepRegistrySources(registry, tempRoot)
      assert.ok(
        result.violations.some(
          (violation) =>
            violation.code === 'SOURCE_ITEM_UNCOVERED' ||
            violation.code === 'VALUE_DIGEST_MISMATCH' ||
            violation.code === 'LOCATOR_MISSING',
        ),
      )
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
}

test('R10 generator constructs Markdown block custody without a source-ID allowlist', () => {
  const generator = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  const blockBuilder = /function markdownBindingBlocks[\s\S]*?\n}/.exec(generator)?.[0]
  assert.ok(blockBuilder)
  assert.doesNotMatch(blockBuilder, /sourceId|fk-charter|fk-loop-directive/)
  assert.doesNotMatch(generator, /markdownBindingBlocks\(markdown,\s*definition\.sourceId\)/)
})

test('R10 validator constructs Markdown block custody without a source-ID allowlist', () => {
  const validator = readFileSync(join(packageRoot, 'src', 'validate.ts'), 'utf8')
  const blockBuilder = /function markdownDocumentMap[\s\S]*?\n}/.exec(validator)?.[0]
  assert.ok(blockBuilder)
  assert.doesNotMatch(blockBuilder, /sourceId|fk-charter|fk-loop-directive/)
  assert.doesNotMatch(validator, /markdownDocumentMap\(content,\s*source\.sourceId\)/)
})

test('R11 Markdown block anchors contain only structural heading kind and stable identity', () => {
  const markdownItems = registry.sources.flatMap((source) =>
    source.inventoryItems.filter((item) => item.locator.anchor.startsWith('md-block:')),
  )
  assert.ok(markdownItems.length > 0)
  for (const item of markdownItems) {
    if (item.locator.kind === 'table-row') {
      assert.match(item.locator.anchor, /^md-block:.*:table-row:.+$/)
    } else {
      assert.match(item.locator.anchor, /^md-block:.*:(?:paragraph|list-item):[1-9]\d*$/)
    }
    assert.doesNotMatch(item.locator.anchor, /:[0-9a-f]{12}:/)
  }
})

test('R11 a Markdown value-only edit resolves the same locator as VALUE_DIGEST_MISMATCH', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r11-value-only-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'coordinator-pattern',
    )
    const item = source?.inventoryItems.find(
      (candidate) =>
        candidate.locator.anchor.startsWith('md-block:') &&
        candidate.normalizedExcerpt.includes('One goal, one coordinator:'),
    )
    assert.ok(source)
    assert.ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      'One goal, one coordinator:',
      'One goal, exactly one coordinator:',
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
    assert.ok(
      !result.violations.some(
        (violation) =>
          violation.code === 'LOCATOR_MISSING' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R11 inserting a same-kind Markdown block is a separate location mutation', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r11-location-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'coordinator-pattern',
    )
    const item = source?.inventoryItems.find(
      (candidate) =>
        candidate.locator.anchor.startsWith('md-block:') &&
        candidate.normalizedExcerpt.includes('One goal, one coordinator:'),
    )
    assert.ok(source)
    assert.ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      item.normalizedExcerpt,
      `R11 inserted structural paragraph.\n\n${item.normalizedExcerpt}`,
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' || violation.code === 'LOCATOR_MISSING',
      ),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R11 CommonMark parenthesized ordered items produce two independent uncovered items', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r11-parenthesized-list-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'approval-readme')
    assert.ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n\n1) R11 first parenthesized binding item.\n2) R11 second parenthesized binding item.\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    const uncovered = result.violations.filter(
      (violation) =>
        violation.code === 'SOURCE_ITEM_UNCOVERED' && violation.sourcePath === source.path,
    )
    assert.equal(uncovered.length, 2, JSON.stringify(result.violations, null, 2))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

const r12LegacyRawMarkdownRuleIds = [
  'rule.spec-convention.e6f5fa8543a1',
  'rule.spec-convention.ac5ff7afd06f',
  'rule.spec-convention.5145ab15549c',
  'rule.spec-convention.fd82127bf9f9',
  'rule.spec-convention.022fc00afe7b',
  'rule.coordinator-pattern.dedbefc1b097',
  'rule.coordinator-pattern.91dd60b00fd6',
  'rule.coordinator-pattern.f7686ab58db7',
  'rule.standing-constraints.c5880644c95c',
  'rule.foreman-line-plan.two-gate-thesis',
  'rule.spec-linter-readme.9a889881a236',
  'rule.spec-linter-readme.b4f5d76d68ec',
  'rule.permission-profiles-readme.729be3615f8d',
  'rule.permission-profiles-readme.d11b9d38f924',
  'rule.permission-profiles-readme.1101805f1c9e',
  'rule.permission-profiles-readme.415efa3f5e3b',
] as const

test('R12 every published Markdown paragraph and list rule uses one structural canonical locator', () => {
  const markdownSourceIds = new Set(
    registry.sources
      .filter((source) => source.path.endsWith('.md'))
      .map((source) => source.sourceId),
  )
  const published = registry.sources.flatMap((source) =>
    markdownSourceIds.has(source.sourceId)
      ? source.inventoryItems.filter((item) => item.ruleIds.length > 0)
      : [],
  )
  assert.ok(published.length > 0)
  for (const item of published) {
    if (item.locator.kind === 'line-excerpt') {
      assert.match(item.locator.anchor, /^md-block:.*:paragraph:[1-9]\d*$/, item.itemId)
    } else if (item.locator.kind === 'numbered-item') {
      assert.match(item.locator.anchor, /^md-block:.*:list-item:[1-9]\d*$/, item.itemId)
    } else if (item.locator.kind === 'table-row') {
      assert.ok(item.locator.anchor.length > 0, item.itemId)
      assert.doesNotMatch(item.locator.anchor, /^\|.*\|$/, item.itemId)
    } else {
      assert.fail(`published Markdown item ${item.itemId} has nonstructural ${item.locator.kind}`)
    }
  }
})

test('R12 no published Markdown rule uses a raw-text line-excerpt or additional-anchor escape', () => {
  const markdownSourceIds = new Set(
    registry.sources
      .filter((source) => source.path.endsWith('.md'))
      .map((source) => source.sourceId),
  )
  for (const rule of registry.rules) {
    if (!markdownSourceIds.has(rule.authorityBasisRef.sourceId)) continue
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    assert.ok(item, rule.ruleId)
    assert.ok(
      item.locator.kind !== 'line-excerpt' || item.locator.anchor.startsWith('md-block:'),
      rule.ruleId,
    )
  }
  const generator = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  assert.doesNotMatch(generator, /additionalAnchors/)
})

test('R12 all sixteen R11 raw-text Markdown rules migrate to structural canonical items', () => {
  assert.equal(r12LegacyRawMarkdownRuleIds.length, 16)
  for (const ruleId of r12LegacyRawMarkdownRuleIds) {
    const rule = registry.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule, ruleId)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    assert.ok(item, ruleId)
    assert.ok(
      item.locator.kind === 'numbered-item' ||
        item.locator.kind === 'table-row' ||
        item.locator.anchor.startsWith('md-block:'),
      ruleId,
    )
    assert.doesNotMatch(item.locator.anchor, /^\s*(?:[-*+] |\|)/, ruleId)
  }
})

test('R12 published Markdown table rules use stable first-column keys', () => {
  const expectations = [
    ['rule.coordinator-pattern.dedbefc1b097', ':table-row:1'],
    ['rule.coordinator-pattern.91dd60b00fd6', ':table-row:2'],
    ['rule.coordinator-pattern.f7686ab58db7', ':table-row:3'],
    ['rule.spec-linter-readme.9a889881a236', ':table-row:`permission_profile:`'],
  ] as const
  for (const [ruleId, suffix] of expectations) {
    const rule = registry.rules.find((candidate) => candidate.ruleId === ruleId)
    assert.ok(rule, ruleId)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    assert.ok(item, ruleId)
    assert.equal(item.locator.kind, 'table-row', ruleId)
    assert.ok(item.locator.anchor.endsWith(suffix), `${ruleId}: ${item.locator.anchor}`)
    assert.notEqual(item.locator.anchor, item.normalizedExcerpt, ruleId)
  }
})

test('R12 active standing-rule marker renumbering is a value mismatch without locator loss', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r12-standing-marker-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === 'standing-constraints',
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === 'item.constraint-1',
    )
    assert.ok(source)
    assert.ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      '1. **Typed try-catch at every external boundary a public API exposes.**',
      '9. **Typed try-catch at every external boundary a public API exposes.**',
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
    assert.ok(
      !result.violations.some(
        (violation) =>
          violation.code === 'LOCATOR_MISSING' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R12 active ordered rules have no excluded structural duplicate substitute', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'standing-constraints')
  const matching = source?.inventoryItems.filter((candidate) =>
    candidate.normalizedExcerpt.includes(
      'Typed try-catch at every external boundary a public API exposes.',
    ),
  )
  assert.ok(matching)
  assert.equal(matching.length, 1)
  assert.equal(matching[0]?.itemId, 'item.constraint-1')
  assert.equal(matching[0]?.locator.kind, 'numbered-item')
  assert.equal(matching[0]?.exclusionDisposition, null)
  assert.deepEqual(matching[0]?.ruleIds, ['rule.standing-constraints.constraint-1'])
})

test('R12 ordered marker mutation preserves structural item rule and locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'standing-constraints')
  assert.ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const mutated = content.replace(
    '1. **Typed try-catch at every external boundary a public API exposes.**',
    '9. **Typed try-catch at every external boundary a public API exposes.**',
  )
  const anchor =
    'md-block:# Standing Constraints — included by reference in every dispatch kickstarter > ## Builder — universal:list-item:1'
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.locator.anchor === anchor,
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, mutated).find(
    (item) => item.locator.anchor === anchor,
  )
  assert.ok(before)
  assert.ok(after)
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator, after.locatorDigest],
    [before.itemId, before.ruleIds, before.locator, before.locatorDigest],
  )
  assert.notEqual(after.valueDigest, before.valueDigest)
})

test('R12 compound block value mutation preserves structural item rule and locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  assert.ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const mutated = content.replace(
    /work stops\r?\nuntil the coordinator/,
    'work halts\nuntil the coordinator',
  )
  assert.notEqual(mutated, content)
  const target = R12_LEGACY_MARKDOWN_RULE_TARGETS['rule.spec-convention.fd82127bf9f9']
  assert.ok(target)
  const anchor = target.anchor
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.locator.anchor === anchor,
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, mutated).find(
    (item) => item.locator.anchor === anchor,
  )
  assert.ok(before)
  assert.ok(after)
  assert.ok(before.ruleIds.length >= 2)
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator, after.locatorDigest],
    [before.itemId, before.ruleIds, before.locator, before.locatorDigest],
  )
  assert.notEqual(after.valueDigest, before.valueDigest)
})

test('R13 lineHint changes do not change Markdown item or locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  assert.ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, `\n${content}`).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  assert.ok(before)
  assert.ok(after)
  assert.notEqual(after.locator.lineHint, before.locator.lineHint)
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator.anchor, after.locatorDigest, after.valueDigest],
    [
      before.itemId,
      before.ruleIds,
      before.locator.anchor,
      before.locatorDigest,
      before.valueDigest,
    ],
  )
})

test('R13 leading blank lines preserve every published Markdown identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  assert.ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const project = (value: string) =>
    markdownIdentityProjectionForTesting(source.sourceId, value)
      .filter((item) => item.ruleIds.length > 0)
      .map((item) => [
        item.itemId,
        item.ruleIds,
        item.locator.anchor,
        item.locatorDigest,
        item.valueDigest,
      ])
  assert.deepEqual(project(`\n\n${content}`), project(content))
})

test('R13 actual compound coordinator value mutation preserves all six rule identities', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  assert.ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const mutated = content.replace('runs as a self-pacing loop', 'runs as one self-pacing loop')
  assert.notEqual(mutated, content)
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, mutated).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  assert.ok(before)
  assert.ok(after)
  assert.deepEqual(before.ruleIds, [
    'rule.coordinator-pattern.47b2eaa2f9ef.ownership',
    'rule.coordinator-pattern.47b2eaa2f9ef.frozen-contract',
    'rule.coordinator-pattern.47b2eaa2f9ef.tripwire',
    'rule.coordinator-pattern.47b2eaa2f9ef.security-boundary',
    'rule.coordinator-pattern.47b2eaa2f9ef.external-capability',
    'rule.coordinator-pattern.47b2eaa2f9ef.empty-queue',
  ])
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator.anchor, after.locatorDigest],
    [before.itemId, before.ruleIds, before.locator.anchor, before.locatorDigest],
  )
  assert.notEqual(after.valueDigest, before.valueDigest)
})

function duplicateCoordinatorGate2Result() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r13-duplicate-gate2-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, 'plugins/foreman-line/docs/COORDINATOR-PATTERN.md')
    const content = readFileSync(path, 'utf8')
    const row =
      "| 2    | Dispatch approval (parcel-set + kickstarter) | Yes - standing authorization scoped to the charter's named parcels, granted at ratification or later                                |"
    assert.ok(content.includes(row))
    writeFileSync(path, content.replace(row, `${row}\n${row}`))
    return sweepRegistrySources(registry, tempRoot)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

test('R13 duplicate identical Gate 2 keyed row emits LOCATOR_DUPLICATE', () => {
  const result = duplicateCoordinatorGate2Result()
  assert.ok(
    result.violations.some((violation) => violation.code === 'LOCATOR_DUPLICATE'),
    JSON.stringify(result.violations, null, 2),
  )
})

test('R13 duplicate table text cannot bypass structural coverage', () => {
  const result = duplicateCoordinatorGate2Result()
  assert.equal(result.valid, false)
  assert.ok(result.violations.some((violation) => violation.code === 'LOCATOR_DUPLICATE'))
})

for (const baseline of [
  {
    name: 'goal skill verification custody',
    sourceId: 'goal-skill',
    fragment: 'You consume verification results; you never produce them.',
  },
  {
    name: 'goal skill human-gate stop custody',
    sourceId: 'goal-skill',
    fragment: 'Human gates (ratification, one-tap approval, merges',
  },
  {
    name: 'goal skill loop-stop custody',
    sourceId: 'goal-skill',
    fragment: 'Stop the loop (ScheduleWakeup stop:true)',
  },
  {
    name: 'coordinator pattern ownership stop',
    sourceId: 'coordinator-pattern',
    fragment: 'One goal, one coordinator:',
  },
  {
    name: 'coordinator pattern universal-stop custody',
    sourceId: 'coordinator-pattern',
    fragment: 'Universal stop conditions:',
  },
  {
    name: 'coordinator pattern scoped-Gate-1 custody',
    sourceId: 'coordinator-pattern',
    fragment: 'When triage re-opens Gate 1 for specific decisions',
  },
  {
    name: 'PDD branch isolation',
    sourceId: 'parcel-driven-development',
    fragment: 'Each agent works in its own directory.',
  },
  {
    name: 'PDD serialization custody',
    sourceId: 'parcel-driven-development',
    fragment: 'Shared integration files are serialized.',
  },
  {
    name: 'SPEC-CONVENTION ordinary mutation authority',
    sourceId: 'spec-convention',
    fragment: 'If implementation requires a path not listed in `Allowed Files`, work stops',
  },
] as const) {
  test(`R10 baseline block custody: ${baseline.name}`, () => {
    const source = registry.sources.find((candidate) => candidate.sourceId === baseline.sourceId)
    assert.ok(source)
    assert.ok(
      source.inventoryItems.some(
        (item) =>
          item.locator.anchor.startsWith('md-block:') &&
          item.normalizedExcerpt.includes(baseline.fragment),
      ),
      `${baseline.sourceId}:${baseline.fragment}`,
    )
  })
}

for (const probe of [
  {
    name: 'goal skill',
    sourceId: 'goal-skill',
    prose: 'R10 ordinary prose probe requires a newly curated goal transition.',
  },
  {
    name: 'coordinator pattern',
    sourceId: 'coordinator-pattern',
    prose: 'R10 ordinary prose probe requires a newly curated coordinator transition.',
  },
  {
    name: 'PDD',
    sourceId: 'parcel-driven-development',
    prose: 'R10 ordinary prose probe requires a newly curated parcel transition.',
  },
  {
    name: 'SPEC-CONVENTION',
    sourceId: 'spec-convention',
    prose: 'R10 ordinary prose probe requires a newly curated specification transition.',
  },
] as const) {
  test(`R10 additive ordinary prose is discovered in ${probe.name}`, () => {
    const tempRoot = mkdtempSync(join(tmpdir(), `fk-p0-r10-${probe.sourceId}-`))
    try {
      copyCorpus(tempRoot)
      const source = registry.sources.find((candidate) => candidate.sourceId === probe.sourceId)
      assert.ok(source)
      const path = join(tempRoot, source.path)
      writeFileSync(path, `${readFileSync(path, 'utf8')}\n\n${probe.prose}\n`)
      const result = sweepRegistrySources(registry, tempRoot)
      assert.ok(
        result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'),
        JSON.stringify(result.violations, null, 2),
      )
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })
}

// R14 fix 17: NTFS alternate-data-stream syntax. `file.md:stream` and `file.md::$DATA` name
// alternate streams, and `::$DATA` resolves to the file's DEFAULT stream, so such a path reads real
// content under a name the registry never declared. All four shapes were already refused before
// this fix, but only incidentally - by failing to resolve - which is refusal by accident rather
// than by policy. `pathProblem` now rejects any interior colon, so each shape is refused as
// SOURCE_PATH_INVALID. Each is an independently named control per Standing Constraint #3.
for (const suffix of [':$DATA', '::$DATA', ':hidden', ':hidden:$DATA'] as const) {
  test(`R14 an NTFS alternate-data-stream source path ending ${suffix} is refused by policy`, () => {
    const mutated = structuredClone(registry)
    const source = mutated.sources[0]
    assert.ok(source)
    ;(source as { path: string }).path = `${source.path}${suffix}`
    const result = sweepRegistrySources(mutated, repoRoot)
    assert.equal(result.valid, false)
    assert.ok(
      result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'),
      `expected SOURCE_PATH_INVALID; observed ${result.violations.map((v) => v.code).join(',')}`,
    )
  })
}

test('R14 an interior colon is refused in any path segment, not only the last', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources[0]
  assert.ok(source)
  ;(source as { path: string }).path = source.path.replace(
    'plugins/foreman-line',
    'plugins:stream/foreman-line',
  )
  const result = sweepRegistrySources(mutated, repoRoot)
  assert.equal(result.valid, false)
  assert.ok(result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'))
})

// R14 fix 12 (amended AC12): the shipped inert-bytes test exercises only the four shapes that
// happen to be ignored - comments, blank lines, fenced blocks and headings - so it could not detect
// the discrepancy it was written to guard. AC12 as amended requires the suite to assert that ADDED
// NARRATIVE PROSE in a Markdown source IS detected, because new prose in a governed document
// requires disposition rather than silent acceptance. The behaviour is correct and deliberate; it
// was the criterion and the test that were wrong.
test('R14 added narrative prose in a Markdown source is detected as SOURCE_ITEM_UNCOVERED', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-added-prose-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.path.endsWith('.md'))
    assert.ok(source)
    const destination = join(tempRoot, source.path)
    const content = readFileSync(destination, 'utf8')
    writeFileSync(
      destination,
      `${content}\n\nThis added narrative paragraph states no rule, but a governed document cannot absorb new prose silently.\n`,
      'utf8',
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, false)
    assert.ok(
      result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'),
      `expected SOURCE_ITEM_UNCOVERED; observed ${result.violations.map((v) => v.code).join(',')}`,
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R14 an added heading stays inert while a paragraph beneath it does not', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-inert-vs-prose-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.path.endsWith('.md'))
    assert.ok(source)
    const destination = join(tempRoot, source.path)
    const original = readFileSync(destination, 'utf8')
    writeFileSync(destination, `${original}\n\n## An added heading\n`, 'utf8')
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, true)
    writeFileSync(
      destination,
      `${original}\n\n## An added heading\n\nAnd a paragraph beneath it.\n`,
      'utf8',
    )
    assert.equal(sweepRegistrySources(registry, tempRoot).valid, false)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
