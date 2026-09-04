import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  appendFileSync,
  cpSync,
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
import {
  R12_LEGACY_MARKDOWN_RULE_TARGETS,
  R24_VOLATILE_BASELINE_EXCLUSIONS,
} from '../src/registry.js'
import type { AuthorityEnforcementRegistry } from '../src/types.js'
import { canonicalJson, sha256, sweepRegistrySources, validateRegistry } from '../src/validate.js'
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
 * R20 fix - per-run unique, for the reason given in `semantic-invariants.test.ts`: a fixed path
 * truncated at import lets two concurrent runs destroy each other's evidence.
 */
const progressLogPath = join(
  mkdtempSync(join(tmpdir(), 'fk-p0-progress-corpus-sweep-')),
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

const loopDirectiveRelativePath = 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md'
const currentStateHeading = '## Current state — update at every stop or parcel closure'
const ownerStateHeading = '### Owner of record and handoff state'
const ownershipRuleAnchor =
  'md-block:# Foreman Kernel — Coordinator Loop Directive > ## COORDINATOR OWNERSHIP — read before dispatching anything:paragraph:1'

function appendToHeadingBody(content: string, heading: string, paragraph: string): string {
  const headingMarker = `\n${heading}\n`
  const markerStart = content.indexOf(headingMarker)
  ok(markerStart >= 0, `heading '${heading}' must be present as a heading line`)
  const headingStart = markerStart + 1
  const bodyStart = headingStart + heading.length
  const nextHeading = /\n#{1,6}\s+/.exec(content.slice(bodyStart))
  const insertion = nextHeading === null ? content.length : bodyStart + nextHeading.index
  return `${content.slice(0, insertion)}\n\n${paragraph}\n${content.slice(insertion)}`
}

function mutateEveryVolatileRegion(content: string): string {
  let changed = content.replace(
    '**Owner of record.**',
    '**Owner of record — volatile mutation probe.**',
  )
  changed = appendToHeadingBody(
    changed,
    ownerStateHeading,
    '**R27 owner-region append probe.** This paragraph is volatile.',
  )
  changed = changed.replace('**STATE 2026-09-04 #2', '**STATE 2026-09-04 #2 MUTATED')
  changed = appendToHeadingBody(
    changed,
    currentStateHeading,
    '**R27 current-state append probe.** This paragraph is volatile.',
  )
  const lines = changed.split(/\r?\n/)
  const queueRow = lines.findIndex((line) => /^\| FK-P0 — Canon authority/.test(line))
  ok(queueRow >= 0, 'FK-P0 queue row must be present')
  const cells = (lines[queueRow] as string).split('|')
  ok(cells.length >= 5, 'FK-P0 queue row must carry the State column')
  cells[2] = ' R27 volatile state mutation with appended bytes '
  lines[queueRow] = cells.join('|')
  const result = lines.join('\n')
  assert.notEqual(result, content, 'the volatile mutation must change the source')
  return result
}

function assertGovernedOwnershipMutationDetected(document: AuthorityEnforcementRegistry): void {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-governed-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, loopDirectiveRelativePath)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      'Exactly one coordinator owns this goal.',
      'Exactly one designated coordinator owns this goal.',
    )
    assert.notEqual(changed, content, 'the governed ownership sentence must change')
    writeFileSync(path, changed)
    const result = sweepRegistrySources(document, tempRoot)
    ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' &&
          violation.message === 'operative normalized source value changed' &&
          violation.locator === ownershipRuleAnchor,
      ),
      `expected governed ownership mutation to report VALUE_DIGEST_MISMATCH at ${ownershipRuleAnchor}; observed ${JSON.stringify(result.violations, null, 2)}`,
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

function independentlyDetectedVolatileOverlaps(
  document: AuthorityEnforcementRegistry,
): { regionId: string; itemId: string }[] {
  const overlaps: { regionId: string; itemId: string }[] = []
  for (const region of document.volatileRegions) {
    const source = document.sources.find((candidate) => candidate.sourceId === region.sourceId)
    const heading = source?.inventoryItems.find(
      (candidate) => candidate.itemId === region.headingItemId,
    )
    if (source === undefined || heading === undefined || heading.locator.kind !== 'heading')
      continue
    const headingPath = heading.locator.anchor
    for (const item of source.inventoryItems) {
      if (item.ruleIds.length === 0) continue
      const inDirectHeadingBody =
        item.locator.anchor.startsWith(`md-block:${headingPath}:`) ||
        item.locator.anchor.startsWith(`md-block:${headingPath} > table-group:`)
      if (!inDirectHeadingBody) continue
      if (region.extent.kind === 'table-column' && item.locator.kind !== 'table-row') continue
      overlaps.push({ regionId: region.regionId, itemId: item.itemId })
    }
  }
  return overlaps
}

function registryWithInjectedVolatileOverlap(): AuthorityEnforcementRegistry {
  const mutated = structuredClone(registry)
  const region = mutated.volatileRegions.find(
    (candidate) => candidate.regionId === 'region.fk-loop-directive.current-state',
  )
  const source = mutated.sources.find((candidate) => candidate.sourceId === region?.sourceId)
  const heading = source?.inventoryItems.find(
    (candidate) => candidate.itemId === region?.headingItemId,
  )
  const published = source?.inventoryItems.find((candidate) => candidate.ruleIds.length > 0)
  ok(region)
  ok(source)
  ok(heading)
  ok(published)
  ;(source.inventoryItems as (typeof source.inventoryItems)[number][]).push({
    ...structuredClone(published),
    itemId: 'item.r27-overlap-probe',
    locator: {
      kind: 'line-excerpt',
      anchor: `md-block:${heading.locator.anchor}:paragraph:1`,
      lineHint: 1,
    },
  })
  return mutated
}

test('R4 copied corpus without Git metadata fails closed', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-no-git-'))
  try {
    copyCorpus(tempRoot, false)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, false)
    // A root that exists but carries no Git metadata is OPERATOR MISCONFIGURATION, not a registry
    // violation. Amended AC12 reserves exit 1 for "the registry is invalid", so this is
    // REPO_ROOT_INVALID (exit 2) rather than MIGRATION_EVIDENCE_INVALID (exit 1); returning the
    // latter would be a false accusation against canon for a mistyped path.
    ok(
      result.violations.some((violation) => violation.code === 'REPO_ROOT_INVALID'),
      `expected REPO_ROOT_INVALID; observed ${result.violations.map((v) => v.code).join(',')}`,
    )
    ok(
      !result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'),
      'operator misconfiguration must not be reported as a registry violation',
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
  ok(evidence)
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
  ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
})

test('R4 missing-path evidence rejects a non-snapshot commit even when that commit is real', () => {
  const mutated = structuredClone(registry)
  const record = mutated.reconciliations.find(
    (candidate) => candidate.reconciliationId === 'missing-provenance-reference',
  )
  const evidence = record?.observedEvidence.find((candidate) => candidate.kind === 'missing-path')
  ok(record)
  ok(evidence)
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
  ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
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
    ok(
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
    ok(
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
    ok(
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
  ok(source)
  const ids = source.inventoryItems.map((item) => item.itemId)
  for (let number = 1; number <= 20; number += 1) ok(ids.includes(`item.d${number}`))
})

test('collapsing one charter decision row into another cannot preserve D-row coverage', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-d-row-collapse-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
    ok(source)
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
    ok(result.violations.some((violation) => violation.code === 'LOCATOR_MISSING'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('plan review inventory contains one atomic record for each R1 through R13 correction', () => {
  const source = registry.sources.find(
    (candidate) => candidate.sourceId === 'fk-plan-review-findings',
  )
  ok(source)
  const ids = source.inventoryItems.map((item) => item.itemId)
  for (let number = 1; number <= 13; number += 1) ok(ids.includes(`item.r${number}`))
})

test('historical plan inventories the pre-heading two-gate thesis independently', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'foreman-line-plan')
  ok(source?.inventoryItems.some((item) => item.itemId === 'item.two-gate-thesis'))
})

test('standing constraints inventory contains all thirteen atomic numbered rules', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'standing-constraints')
  ok(source)
  for (let number = 1; number <= 13; number += 1) {
    ok(source.inventoryItems.some((item) => item.itemId === `item.constraint-${number}`))
  }
})

test('PDD inventory contains all fifteen atomic hard rules', () => {
  const source = registry.sources.find(
    (candidate) => candidate.sourceId === 'parcel-driven-development',
  )
  ok(source)
  for (let number = 1; number <= 15; number += 1) {
    ok(source.inventoryItems.some((item) => item.itemId === `item.hard-rule-${number}`))
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
      ok(axis.length > 0, rule.ruleId)
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'))
  }
  const duplicate = structuredClone(registry)
  ;(duplicate.sources as AuthorityEnforcementRegistry['sources'][number][]).push(
    structuredClone(duplicate.sources[0] as NonNullable<(typeof duplicate.sources)[0]>),
  )
  const result = sweepRegistrySources(duplicate, repoRoot)
  ok(result.violations.some((violation) => violation.code === 'SOURCE_DUPLICATE_PATH'))
})

test('dot path segments are refused before resolution', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources[0]
  ok(source)
  ;(source as { path: string }).path = source.path.replace('plugins/', 'plugins/./')
  ok(
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
    ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'RULE_SOURCE_MISSING',
      ),
    )
    mkdirSync(sourcePath)
    ok(
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
    ok(
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
    ok(
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
    ok(source)
    ok(item)
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
    ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n## Binding emergency authority\nBuilders must never self-ratify.\n`,
    )
    ok(
      sweepRegistrySources(registry, tempRoot).violations.some(
        (violation) => violation.code === 'SOURCE_ITEM_UNCOVERED',
      ),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

// D21 is now a RATIFIED decision (amendment A1) and is curated in the shipped inventory, so it is
// no longer an "additive" row. The invariant this test names - that a decision row added to the
// charter is discovered independently of the curated inventory - is preserved by moving to the
// next unclaimed decision number.
test('R3 additive D22 decision row is discovered independently of the curated inventory', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-d22-'))
  try {
    copyCorpus(tempRoot)
    const source = registry.sources.find((candidate) => candidate.sourceId === 'fk-charter')
    ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n| D22 | New authority | Must bind. |\n`)
    ok(
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
    ok(source)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8').replace(
      '## Time, Calendars, and the Two Clocks',
      '16. **New binding rule.** Stop.\n\n## Time, Calendars, and the Two Clocks',
    )
    writeFileSync(path, content)
    ok(
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
    ok(source)
    const path = join(tempRoot, source.path)
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n- MUST refuse builder self-ratification.\n`)
    ok(
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
    ok(source && item)
    const path = join(tempRoot, source.path)
    writeFileSync(
      path,
      readFileSync(path, 'utf8').replace(
        /6\. \*\*Gate 3 is not delegated\.\*\* Never merge\. Present the complete green chain and exact\r?\n\s+merge target to the human\./,
        '6. **Gate 3 is delegated.** Merge freely.',
      ),
    )
    ok(
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
    ok(source)
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
    ok(source)
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
  ok(rule)
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
  ok(
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
    ok(
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
      ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'VALUE_DIGEST_MISMATCH'))
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
  ok(source)
  ;(source.snapshotEvidence as { fullFileSha256: string }).fullFileSha256 = '0'.repeat(64)
  const result = sweepRegistrySources(mutated, repoRoot)
  ok(result.violations.some((violation) => violation.code === 'MIGRATION_EVIDENCE_INVALID'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(content.includes("from 'node:path'"))
    writeFileSync(path, content.replace("from 'node:path'", "from 'node:path/posix'"))
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
    ok(result.violations.some((violation) => violation.code === 'SOURCE_ITEM_UNCOVERED'))
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
      ok(
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
  ok(blockBuilder)
  assert.doesNotMatch(blockBuilder, /sourceId|fk-charter|fk-loop-directive/)
  assert.doesNotMatch(generator, /markdownBindingBlocks\(markdown,\s*definition\.sourceId\)/)
})

test('R10 validator constructs Markdown block custody without a source-ID allowlist', () => {
  const validator = readFileSync(join(packageRoot, 'src', 'validate.ts'), 'utf8')
  const blockBuilder = /function markdownDocumentMap[\s\S]*?\n}/.exec(validator)?.[0]
  ok(blockBuilder)
  assert.doesNotMatch(blockBuilder, /sourceId|fk-charter|fk-loop-directive/)
  assert.doesNotMatch(validator, /markdownDocumentMap\(content,\s*source\.sourceId\)/)
})

test('R11 Markdown block anchors contain only structural heading kind and stable identity', () => {
  const markdownItems = registry.sources.flatMap((source) =>
    source.inventoryItems.filter((item) => item.locator.anchor.startsWith('md-block:')),
  )
  ok(markdownItems.length > 0)
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
    ok(source)
    ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      'One goal, one coordinator:',
      'One goal, exactly one coordinator:',
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
    ok(
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
    ok(source)
    ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      item.normalizedExcerpt,
      `R11 inserted structural paragraph.\n\n${item.normalizedExcerpt}`,
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
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
    ok(source)
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
  ok(published.length > 0)
  for (const item of published) {
    if (item.locator.kind === 'line-excerpt') {
      assert.match(item.locator.anchor, /^md-block:.*:paragraph:[1-9]\d*$/, item.itemId)
    } else if (item.locator.kind === 'numbered-item') {
      assert.match(item.locator.anchor, /^md-block:.*:list-item:[1-9]\d*$/, item.itemId)
    } else if (item.locator.kind === 'table-row') {
      ok(item.locator.anchor.length > 0, item.itemId)
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
    ok(item, rule.ruleId)
    ok(
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
    ok(rule, ruleId)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    ok(item, ruleId)
    ok(
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
    ok(rule, ruleId)
    const source = registry.sources.find(
      (candidate) => candidate.sourceId === rule.authorityBasisRef.sourceId,
    )
    const item = source?.inventoryItems.find(
      (candidate) => candidate.itemId === rule.authorityBasisRef.itemId,
    )
    ok(item, ruleId)
    assert.equal(item.locator.kind, 'table-row', ruleId)
    ok(item.locator.anchor.endsWith(suffix), `${ruleId}: ${item.locator.anchor}`)
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
    ok(source)
    ok(item)
    const path = join(tempRoot, source.path)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(
      '1. **Typed try-catch at every external boundary a public API exposes.**',
      '9. **Typed try-catch at every external boundary a public API exposes.**',
    )
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VALUE_DIGEST_MISMATCH' && violation.locator === item.locator.anchor,
      ),
      JSON.stringify(result.violations, null, 2),
    )
    ok(
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
  ok(matching)
  assert.equal(matching.length, 1)
  assert.equal(matching[0]?.itemId, 'item.constraint-1')
  assert.equal(matching[0]?.locator.kind, 'numbered-item')
  assert.equal(matching[0]?.exclusionDisposition, null)
  assert.deepEqual(matching[0]?.ruleIds, ['rule.standing-constraints.constraint-1'])
})

test('R12 ordered marker mutation preserves structural item rule and locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'standing-constraints')
  ok(source)
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
  ok(before)
  ok(after)
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator, after.locatorDigest],
    [before.itemId, before.ruleIds, before.locator, before.locatorDigest],
  )
  assert.notEqual(after.valueDigest, before.valueDigest)
})

test('R12 compound block value mutation preserves structural item rule and locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'spec-convention')
  ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const mutated = content.replace(
    /work stops\r?\nuntil the coordinator/,
    'work halts\nuntil the coordinator',
  )
  assert.notEqual(mutated, content)
  const target = R12_LEGACY_MARKDOWN_RULE_TARGETS['rule.spec-convention.fd82127bf9f9']
  ok(target)
  const anchor = target.anchor
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.locator.anchor === anchor,
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, mutated).find(
    (item) => item.locator.anchor === anchor,
  )
  ok(before)
  ok(after)
  ok(before.ruleIds.length >= 2)
  assert.deepEqual(
    [after.itemId, after.ruleIds, after.locator, after.locatorDigest],
    [before.itemId, before.ruleIds, before.locator, before.locatorDigest],
  )
  assert.notEqual(after.valueDigest, before.valueDigest)
})

test('R13 lineHint changes do not change Markdown item or locator identity', () => {
  const source = registry.sources.find((candidate) => candidate.sourceId === 'coordinator-pattern')
  ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, `\n${content}`).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  ok(before)
  ok(after)
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
  ok(source)
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
  ok(source)
  const content = readFileSync(join(repoRoot, source.path), 'utf8')
  const mutated = content.replace('runs as a self-pacing loop', 'runs as one self-pacing loop')
  assert.notEqual(mutated, content)
  const before = markdownIdentityProjectionForTesting(source.sourceId, content).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  const after = markdownIdentityProjectionForTesting(source.sourceId, mutated).find(
    (item) => item.itemId === 'item.47b2eaa2f9ef',
  )
  ok(before)
  ok(after)
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
    ok(content.includes(row))
    writeFileSync(path, content.replace(row, `${row}\n${row}`))
    return sweepRegistrySources(registry, tempRoot)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

test('R13 duplicate identical Gate 2 keyed row emits LOCATOR_DUPLICATE', () => {
  const result = duplicateCoordinatorGate2Result()
  ok(
    result.violations.some((violation) => violation.code === 'LOCATOR_DUPLICATE'),
    JSON.stringify(result.violations, null, 2),
  )
})

test('R13 duplicate table text cannot bypass structural coverage', () => {
  const result = duplicateCoordinatorGate2Result()
  assert.equal(result.valid, false)
  ok(result.violations.some((violation) => violation.code === 'LOCATOR_DUPLICATE'))
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
    ok(source)
    ok(
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
      ok(source)
      const path = join(tempRoot, source.path)
      writeFileSync(path, `${readFileSync(path, 'utf8')}\n\n${probe.prose}\n`)
      const result = sweepRegistrySources(registry, tempRoot)
      ok(
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
    ok(source)
    ;(source as { path: string }).path = `${source.path}${suffix}`
    const result = sweepRegistrySources(mutated, repoRoot)
    assert.equal(result.valid, false)
    ok(
      result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'),
      `expected SOURCE_PATH_INVALID; observed ${result.violations.map((v) => v.code).join(',')}`,
    )
  })
}

test('R14 an interior colon is refused in any path segment, not only the last', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources[0]
  ok(source)
  ;(source as { path: string }).path = source.path.replace(
    'plugins/foreman-line',
    'plugins:stream/foreman-line',
  )
  const result = sweepRegistrySources(mutated, repoRoot)
  assert.equal(result.valid, false)
  ok(result.violations.some((violation) => violation.code === 'SOURCE_PATH_INVALID'))
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
    ok(source)
    const destination = join(tempRoot, source.path)
    const content = readFileSync(destination, 'utf8')
    writeFileSync(
      destination,
      `${content}\n\nThis added narrative paragraph states no rule, but a governed document cannot absorb new prose silently.\n`,
      'utf8',
    )
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, false)
    ok(
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
    ok(source)
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

test('R29.3 every curation surface is anchor-keyed with no itemId lookup fallback', () => {
  const generator = readFileSync(join(packageRoot, 'src', 'generate.ts'), 'utf8')
  const registrySource = readFileSync(join(packageRoot, 'src', 'registry.ts'), 'utf8')
  assert.doesNotMatch(generator, /^\s*'[^']+:item\.[^']+'\s*:/m)
  assert.doesNotMatch(registrySource, /'[^']+:item\.[^']+'/)
  assert.doesNotMatch(generator, /function curatedClassificationFor\([^)]*itemId/)
  assert.doesNotMatch(generator, /function curatedApplicabilityFor\([^)]*itemId/)
  assert.doesNotMatch(generator, /function authorityIdentityFor\([\s\S]{0,100}itemId/)
  assert.doesNotMatch(generator, /sourceItemKey/)
})

test('R29.4 standing authorization 8 publishes the exact pre-action refusal contract', () => {
  const rule = registry.rules.find(
    (candidate) => candidate.ruleId === 'rule.fk-loop-directive.3fe253f7c599',
  )
  ok(rule)
  assert.equal(rule.classification, 'pre-action-refusal')
  assert.equal(rule.decision, 'REFUSE')
  assert.equal(rule.enforcementOwner, 'kernel-policy')
  assert.deepEqual(rule.applicability, {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
    stages: ['any'],
    operations: ['repo-read', 'repo-mutation'],
    hosts: ['any'],
  })
  assert.equal(registry.rules.length, 469)
  assert.equal(
    registry.rules.filter((candidate) => candidate.classification === 'pre-action-refusal').length,
    255,
  )
})

test('R29.3 anchor migration preserves every surviving published identity and locator digest', () => {
  const priorPath = 'plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml'
  const prior = parse(
    execFileSync('git', ['show', `5f9cf65eec98f5496202639007205da81ef1c34d:${priorPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    }),
  ) as AuthorityEnforcementRegistry
  const removedRuleId = 'rule.fk-loop-directive.ae7854c7dad1'
  const addedRuleId = 'rule.fk-loop-directive.3fe253f7c599'
  const expectedRuleIds = new Set(
    prior.rules
      .map((rule) => rule.ruleId)
      .filter((ruleId) => ruleId !== removedRuleId)
      .concat(addedRuleId),
  )
  assert.deepEqual(new Set(registry.rules.map((rule) => rule.ruleId)), expectedRuleIds)
  const changedValueRuleIds: string[] = []
  for (const priorRule of prior.rules) {
    if (priorRule.ruleId === removedRuleId) continue
    const currentRule = registry.rules.find((candidate) => candidate.ruleId === priorRule.ruleId)
    ok(currentRule, priorRule.ruleId)
    assert.equal(currentRule.authorityBasisRef.itemId, priorRule.authorityBasisRef.itemId)
    assert.equal(
      currentRule.authorityBasisRef.locatorDigest,
      priorRule.authorityBasisRef.locatorDigest,
    )
    if (currentRule.authorityBasisRef.valueDigest !== priorRule.authorityBasisRef.valueDigest) {
      changedValueRuleIds.push(currentRule.ruleId)
    }
  }
  assert.deepEqual(changedValueRuleIds, ['rule.fk-loop-directive.7a05d374a3b1'])
})

test('R27 control (a) volatile appends and byte changes preserve the sweep and governed siblings', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-volatile-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, loopDirectiveRelativePath)
    const original = readFileSync(path, 'utf8')
    const changed = mutateEveryVolatileRegion(original)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    assert.equal(result.valid, true, JSON.stringify(result.violations, null, 2))
    assert.deepEqual(
      markdownIdentityProjectionForTesting('fk-loop-directive', changed),
      markdownIdentityProjectionForTesting('fk-loop-directive', original),
      'volatile changes must not alter any governed item identity, locator, value, or rule binding',
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R27 control (a) deletion probe fails for each removed volatile-region declaration', () => {
  for (const region of registry.volatileRegions) {
    const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-region-delete-'))
    try {
      copyCorpus(tempRoot)
      const path = join(tempRoot, loopDirectiveRelativePath)
      writeFileSync(path, mutateEveryVolatileRegion(readFileSync(path, 'utf8')))
      const mutated = structuredClone(registry)
      ;(mutated as { volatileRegions: typeof mutated.volatileRegions }).volatileRegions =
        mutated.volatileRegions.filter((candidate) => candidate.regionId !== region.regionId)
      const result = sweepRegistrySources(mutated, tempRoot)
      if (region.extent.kind === 'table-column') {
        ok(
          result.violations.some(
            (violation) =>
              violation.code === 'VALUE_DIGEST_MISMATCH' &&
              violation.message === 'operative normalized source value changed' &&
              violation.locator?.includes(
                'table-row:FK-P0 — Canon authority and enforcement registry',
              ),
          ),
          `removing ${region.regionId} did not expose its queue-state value mismatch: ${JSON.stringify(result.violations, null, 2)}`,
        )
      } else {
        const headingFragment =
          region.regionId === 'region.fk-loop-directive.current-state'
            ? currentStateHeading
            : ownerStateHeading
        ok(
          result.violations.some(
            (violation) =>
              violation.code === 'SOURCE_ITEM_UNCOVERED' &&
              violation.message === 'binding prose block is not inventoried' &&
              violation.locator?.includes(headingFragment),
          ),
          `removing ${region.regionId} did not expose its uninventoried prose: ${JSON.stringify(result.violations, null, 2)}`,
        )
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }
})

test('R27 control (b) governed ownership prose still fails closed with VALUE_DIGEST_MISMATCH', () => {
  assertGovernedOwnershipMutationDetected(registry)
})

test('R27 control (b) binding-deletion probe defeats the exact governed-mutation expectation', () => {
  const mutated = structuredClone(registry)
  const source = mutated.sources.find((candidate) => candidate.sourceId === 'fk-loop-directive')
  ok(source)
  const before = source.inventoryItems.length
  ;(source as { inventoryItems: typeof source.inventoryItems }).inventoryItems =
    source.inventoryItems.filter((item) => item.locator.anchor !== ownershipRuleAnchor)
  assert.equal(source.inventoryItems.length, before - 1, 'the governed binding must be deleted')
  assert.throws(
    () => assertGovernedOwnershipMutationDetected(mutated),
    /expected governed ownership mutation to report VALUE_DIGEST_MISMATCH/,
  )
})

test('R27 control (c) anti-laundering refuses a region overlapping a published locator', () => {
  const mutated = structuredClone(registry)
  const region = mutated.volatileRegions.find(
    (candidate) => candidate.regionId === 'region.fk-loop-directive.current-state',
  )
  const source = mutated.sources.find((candidate) => candidate.sourceId === region?.sourceId)
  const ownershipHeading = source?.inventoryItems.find(
    (candidate) =>
      candidate.locator.kind === 'heading' &&
      candidate.locator.anchor ===
        '# Foreman Kernel — Coordinator Loop Directive > ## COORDINATOR OWNERSHIP — read before dispatching anything',
  )
  ok(region)
  ok(ownershipHeading)
  ;(region as { headingItemId: string }).headingItemId = ownershipHeading.itemId
  const result = validateRegistry(mutated)
  ok(
    result.violations.some(
      (violation) =>
        violation.code === 'VOLATILE_REGION_OVERLAP' &&
        violation.message.startsWith(
          `volatile region '${region.regionId}' covers inventory item 'item.7a05d374a3b1'`,
        ),
    ),
    JSON.stringify(result.violations, null, 2),
  )
})

test('R27 control (d) independently finds no published item inside any shipped volatile extent', () => {
  assert.deepEqual(independentlyDetectedVolatileOverlaps(registry), [])
})

test('R27 control (d) predicate-mutation probe survives a production overlap predicate forced false', () => {
  const mutatedRegistry = registryWithInjectedVolatileOverlap()
  assert.deepEqual(independentlyDetectedVolatileOverlaps(mutatedRegistry), [
    {
      regionId: 'region.fk-loop-directive.current-state',
      itemId: 'item.r27-overlap-probe',
    },
  ])
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-independent-'))
  try {
    cpSync(join(packageRoot, 'src'), join(tempRoot, 'src'), { recursive: true })
    writeFileSync(join(tempRoot, 'package.json'), readFileSync(join(packageRoot, 'package.json')))
    symlinkSync(join(packageRoot, 'node_modules'), join(tempRoot, 'node_modules'), 'junction')
    const validatorPath = join(tempRoot, 'src', 'validate.ts')
    const validator = readFileSync(validatorPath, 'utf8')
    const predicate = `function anchorInHeadingBody(anchor: string, headingPath: string): boolean {
  return (
    anchor.startsWith(\`md-block:\${headingPath}:\`) ||
    anchor.startsWith(\`md-block:\${headingPath} > table-group:\`)
  )
}`
    const disabledPredicate = `function anchorInHeadingBody(_anchor: string, _headingPath: string): boolean {
  return false
}`
    const changedValidator = validator.replace(predicate, disabledPredicate)
    assert.notEqual(changedValidator, validator, 'the production overlap predicate must be mutated')
    writeFileSync(validatorPath, changedValidator)
    writeFileSync(join(tempRoot, 'registry.json'), JSON.stringify(mutatedRegistry))
    writeFileSync(
      join(tempRoot, 'probe.ts'),
      "import { readFileSync } from 'node:fs'\nimport { validateRegistry } from './src/validate.ts'\nconst document = JSON.parse(readFileSync('./registry.json', 'utf8'))\nprocess.stdout.write(JSON.stringify(validateRegistry(document).violations.filter((violation) => violation.code === 'VOLATILE_REGION_OVERLAP')))\n",
    )
    const output = execFileSync(
      process.execPath,
      [join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'probe.ts'],
      { cwd: tempRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    )
    assert.deepEqual(
      JSON.parse(output),
      [],
      'the forced-false production predicate must miss overlap',
    )
    assert.equal(
      independentlyDetectedVolatileOverlaps(mutatedRegistry).length,
      1,
      'the independent shipped-data predicate must still catch the overlap',
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R27 control (e) generator output is byte-identical under mutation of every volatile region', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-generator-'))
  try {
    copyCorpus(tempRoot)
    const loopPath = join(tempRoot, loopDirectiveRelativePath)
    writeFileSync(loopPath, mutateEveryVolatileRegion(readFileSync(loopPath, 'utf8')))
    const tempPackage = join(tempRoot, 'plugins', 'foreman-line', 'authority-registry')
    mkdirSync(tempPackage, { recursive: true })
    cpSync(join(packageRoot, 'src'), join(tempPackage, 'src'), { recursive: true })
    writeFileSync(
      join(tempPackage, 'package.json'),
      readFileSync(join(packageRoot, 'package.json')),
    )
    mkdirSync(join(tempPackage, 'tests', 'fixtures'), { recursive: true })
    cpSync(
      join(repoRoot, 'plugins', 'foreman-line', 'schema-scaffold', 'src'),
      join(tempRoot, 'plugins', 'foreman-line', 'schema-scaffold', 'src'),
      { recursive: true },
    )
    symlinkSync(join(packageRoot, 'node_modules'), join(tempPackage, 'node_modules'), 'junction')
    execFileSync(
      process.execPath,
      [join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'src/generate.ts'],
      { cwd: tempPackage, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 },
    )
    for (const relativePath of [
      'authority-enforcement-registry.yaml',
      'schemas/authority-enforcement-registry.schema.json',
      'tests/fixtures/pass-minimal.yaml',
    ]) {
      assert.deepEqual(
        readFileSync(join(tempPackage, relativePath)),
        readFileSync(join(packageRoot, relativePath)),
        `${relativePath} changed under volatile-only mutation`,
      )
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R27 control (f) zero heading matches fails closed with the exact VOLATILE_REGION_INVALID message', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-zero-heading-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, loopDirectiveRelativePath)
    const content = readFileSync(path, 'utf8')
    const changed = content.replace(currentStateHeading, `${currentStateHeading} renamed`)
    assert.notEqual(changed, content)
    writeFileSync(path, changed)
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VOLATILE_REGION_INVALID' &&
          violation.message ===
            "volatile region 'region.fk-loop-directive.current-state' names a heading that is absent from the source",
      ),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R27 control (f) multiple heading matches fails closed with the exact VOLATILE_REGION_INVALID message', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'fk-p0-r27-multiple-heading-'))
  try {
    copyCorpus(tempRoot)
    const path = join(tempRoot, loopDirectiveRelativePath)
    writeFileSync(
      path,
      `${readFileSync(path, 'utf8')}\n\n${currentStateHeading}\n\nDuplicate volatile heading probe.\n`,
    )
    const result = sweepRegistrySources(registry, tempRoot)
    ok(
      result.violations.some(
        (violation) =>
          violation.code === 'VOLATILE_REGION_INVALID' &&
          violation.message ===
            "volatile region 'region.fk-loop-directive.current-state' names a heading that occurs 2 times in the source",
      ),
      JSON.stringify(result.violations, null, 2),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('R27 control (g) pins eight curated pre-excision prose rationales without gating future additions', () => {
  assert.equal(Object.keys(R24_VOLATILE_BASELINE_EXCLUSIONS).length, 8)
  const baselineByAnchor = new Map<
    string,
    ReturnType<typeof markdownIdentityProjectionForTesting>[number]
  >()
  for (const commit of [
    '40394be5fb7a5376579025513236019ad48dd86c',
    '5f9cf65eec98f5496202639007205da81ef1c34d',
  ]) {
    const baseline = execFileSync('git', ['show', `${commit}:${loopDirectiveRelativePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    for (const item of markdownIdentityProjectionForTesting('fk-loop-directive', baseline, {
      maskVolatile: false,
    })) {
      baselineByAnchor.set(item.locator.anchor, item)
    }
  }
  for (const [key, rationale] of Object.entries(R24_VOLATILE_BASELINE_EXCLUSIONS)) {
    const separator = key.indexOf(':')
    assert.equal(key.slice(0, separator), 'fk-loop-directive')
    const anchor = key.slice(separator + 1)
    const item = baselineByAnchor.get(anchor)
    ok(item, `pre-excision baseline item '${anchor}' must resolve`)
    ok(
      item.locator.kind === 'line-excerpt' || item.locator.kind === 'numbered-item',
      `${anchor} must be paragraph or list-item prose`,
    )
    assert.doesNotMatch(
      rationale,
      /is explanatory context and does not state an independent normative authority rule/,
    )
    ok(rationale.length >= 80, `${anchor} must carry an item-specific review rationale`)
  }
})
