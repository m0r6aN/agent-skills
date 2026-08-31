import assert from 'node:assert/strict'
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
import { sweepRegistrySources } from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(packageRoot, '..', '..', '..')
const registry = parse(
  readFileSync(join(packageRoot, 'authority-enforcement-registry.yaml'), 'utf8'),
) as AuthorityEnforcementRegistry

function copyCorpus(tempRoot: string): void {
  for (const source of registry.sources) {
    const destination = join(tempRoot, source.path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, readFileSync(join(repoRoot, source.path)))
  }
}

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
      writeFileSync(destination, `UNRELATED_BYTES_OUTSIDE_REGISTERED_LOCATORS\n${content}`, 'utf8')
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
