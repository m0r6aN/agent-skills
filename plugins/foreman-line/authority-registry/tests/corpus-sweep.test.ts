import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
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
