import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type TestContext, test } from 'node:test'
import { IntegrationError } from '../src/errors.js'
import { evaluateChangeSet, loadActiveSpecsLive } from '../src/governing-spec.js'
import { runReport } from '../src/report.js'

const ACTIVE_DIR = 'plugins/foreman-line/docs/specs/active'

function diskSpecs(t: TestContext, files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'fl-r2-specs-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, ACTIVE_DIR), { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(root, ACTIVE_DIR, name), content)
  }
  return root
}

function frontmatter(body: string): string {
  return `---\n${body}\n---\n# Body\nrisk: low\n`
}

for (const [format, surfaces] of Object.entries({
  inline: `surfaces: ['docs/a,b.md', "docs/hash#tag.md", 'docs/it''s.md'] # comment`,
  block: `surfaces: # comment\n  - 'docs/a,b.md'\n  - "docs/hash#tag.md" # comment\n  - 'docs/it''s.md'`,
})) {
  for (const [ending, newline] of Object.entries({ LF: '\n', CRLF: '\r\n' })) {
    test(`AC-1: real ${format} YAML surfaces, quotes/comments and ${ending}`, (t) => {
      const content = frontmatter(
        `status: "active" # comment\nrisk: 'critical' # comment\n${surfaces}`,
      )
      const root = diskSpecs(t, { 'SPEC.md': content.replaceAll('\n', newline) })
      const loaded = loadActiveSpecsLive(root)
      assert.deepEqual(loaded, [
        {
          path: `${ACTIVE_DIR}/SPEC.md`,
          status: 'active',
          risk: 'critical',
          surfaces: ['docs/a,b.md', 'docs/hash#tag.md', "docs/it's.md"],
        },
      ])
      assert.equal(evaluateChangeSet(['docs/a,b.md'], loaded).declaredRisk, 'critical')
    })
  }
}

test('AC-2: real disk filtering, deterministic order and highest declared risk', (t) => {
  const root = diskSpecs(t, {
    'Z-critical.md': frontmatter('status: active\nrisk: critical\nsurfaces:\n  - docs/'),
    'A-standard.md': frontmatter('status: active\nrisk: standard\nsurfaces: [docs/]'),
    'DRAFT.md': frontmatter('status: draft\nrisk: critical\nsurfaces: [other/]'),
    'DONE.md': frontmatter('status: done\nrisk: critical\nsurfaces: [other/]'),
    'SUPERSEDED.md': frontmatter('status: superseded\nrisk: critical\nsurfaces: [other/]'),
    'README.md': '# Plain Markdown\nstatus: active\nrisk: critical\nsurfaces: [other/]',
    'ignored.json': '{invalid json is not a spec}',
  })
  const loaded = loadActiveSpecsLive(root)
  assert.deepEqual(
    loaded.map((spec) => spec.path),
    [`${ACTIVE_DIR}/A-standard.md`, `${ACTIVE_DIR}/Z-critical.md`],
  )
  const decision = evaluateChangeSet(['docs/note.md'], loaded)
  assert.equal(decision.declaredRisk, 'critical')
  assert.equal(decision.governingSpec, `${ACTIVE_DIR}/Z-critical.md`)
  assert.equal(decision.triggered, true)
  assert.equal(decision.drift, false)
  assert.ok(decision.reasons.some((reason) => reason.startsWith('multi-spec:')))
  assert.equal(evaluateChangeSet(['other/note.md'], loaded).governingSpec, null)
})

for (const risk of ['low', 'standard', 'elevated', 'critical']) {
  test(`AC-1: supported active risk ${risk} with simple inline surfaces and EOF fence`, (t) => {
    const root = diskSpecs(t, {
      'SPEC.md': `---\nstatus: active\nrisk: ${risk}\nsurfaces: [docs/]\n---`,
    })
    assert.equal(loadActiveSpecsLive(root)[0]?.risk, risk)
  })
}

const invalidBodies: Record<string, string> = {
  'malformed YAML': 'status: active\nrisk: critical\nsurfaces: [docs/',
  'duplicate risk': 'status: active\nrisk: critical\nrisk: low\nsurfaces: [docs/]',
  'duplicate status': 'status: active\nstatus: draft\nrisk: critical\nsurfaces: [docs/]',
  'duplicate surfaces': 'status: active\nrisk: critical\nsurfaces: [docs/]\nsurfaces: [other/]',
  'malformed nonactive YAML': 'status: draft\nrisk: critical\nsurfaces: [docs/',
  'empty frontmatter': '',
  'scalar root': 'hello',
  'array root': '- status: active',
  'null root': 'null',
  'missing status': 'risk: critical\nsurfaces: [docs/]',
  'non-string status': 'status: [active]\nrisk: critical\nsurfaces: [docs/]',
  'empty status': 'status: ""\nrisk: critical\nsurfaces: [docs/]',
  'missing risk': 'status: active\nsurfaces: [docs/]',
  'unsupported risk': 'status: active\nrisk: severe\nsurfaces: [docs/]',
  'non-string risk': 'status: active\nrisk: 42\nsurfaces: [docs/]',
  'null risk': 'status: active\nrisk: null\nsurfaces: [docs/]',
  'empty risk': 'status: active\nrisk: ""\nsurfaces: [docs/]',
  'missing surfaces': 'status: active\nrisk: critical',
  'empty surfaces': 'status: active\nrisk: critical\nsurfaces: []',
  'scalar surfaces': 'status: active\nrisk: critical\nsurfaces: docs/',
  'object surfaces': 'status: active\nrisk: critical\nsurfaces: {path: docs/}',
  'null surfaces': 'status: active\nrisk: critical\nsurfaces: null',
  'non-string surface': 'status: active\nrisk: critical\nsurfaces: [42]',
  'mixed surfaces': 'status: active\nrisk: critical\nsurfaces: [docs/, false]',
  'empty surface': 'status: active\nrisk: critical\nsurfaces: [""]',
  'whitespace surface': 'status: active\nrisk: critical\nsurfaces: ["   "]',
  'unknown alias': 'status: active\nrisk: critical\nsurfaces: *missing',
  'unsupported YAML tag': 'status: active\nrisk: !unsupported critical\nsurfaces: [docs/]',
  'multiple YAML documents':
    'status: active\nrisk: critical\nsurfaces: [docs/]\n...\nstatus: draft',
}

for (const [shape, body] of Object.entries(invalidBodies)) {
  test(`AC-3: ${shape} throws POSTURE_INVALID from the real reader`, (t) => {
    const root = diskSpecs(t, { 'INVALID.md': frontmatter(body) })
    assert.throws(
      () => loadActiveSpecsLive(root),
      (err: unknown) => {
        assert.ok(err instanceof IntegrationError)
        assert.equal(err.code, 'POSTURE_INVALID')
        assert.ok(err.message.includes('INVALID.md'))
        return true
      },
    )
  })
}

test('AC-3: unterminated frontmatter is not silently treated as plain Markdown', (t) => {
  const root = diskSpecs(t, {
    'INVALID.md': '---\nstatus: active\nrisk: critical\nsurfaces: [docs/]\n',
  })
  assert.throws(() => loadActiveSpecsLive(root), {
    name: 'IntegrationError',
    code: 'POSTURE_INVALID',
  })
})

test('AC-3: real directory-list and file-read failures are typed', (t) => {
  const root = diskSpecs(t, {})
  assert.throws(() => loadActiveSpecsLive(join(root, 'missing')), {
    name: 'IntegrationError',
    code: 'POSTURE_INVALID',
  })
  mkdirSync(join(root, ACTIVE_DIR, 'directory.md'))
  assert.throws(() => loadActiveSpecsLive(root), {
    name: 'IntegrationError',
    code: 'POSTURE_INVALID',
  })
})

test('AC-3: malformed disk input remains report-only and cannot inject annotation lines', (t) => {
  const root = diskSpecs(t, {
    'INVALID.md': frontmatter(
      'status: active\nrisk: critical\nsurfaces: [docs/\n::warning::forged',
    ),
  })
  const result = runReport({
    getChangedPaths: () => ['docs/note.md'],
    loadActiveSpecs: () => loadActiveSpecsLive(root),
  })
  assert.equal(result.exitCode, 0)
  assert.equal(result.decision, null)
  assert.equal(result.annotations.length, 1)
  assert.ok(result.annotations[0]?.startsWith('::warning::'))
  assert.ok(result.annotations[0]?.includes('INVALID.md'))
  for (const control of ['\r', '\n', '\x1b']) {
    assert.equal(result.annotations[0]?.includes(control), false)
  }
})

test('AC-1: YAML aliases and indented block-scalar fences do not truncate frontmatter', (t) => {
  const root = diskSpecs(t, {
    'SPEC.md': frontmatter(
      'notes: |\n  ---\n  Not the closing fence\npaths: &paths [docs/]\nstatus: active\nrisk: critical\nsurfaces: *paths',
    ),
  })
  assert.deepEqual(loadActiveSpecsLive(root)[0]?.surfaces, ['docs/'])
})

test('AC-3: hostile near-fence input is rejected without unbounded whitespace backtracking', (t) => {
  const root = diskSpecs(t, {
    'INVALID.md': `---\n${`---${' '.repeat(64_000)}x\n`.repeat(16)}`,
  })
  const start = performance.now()
  assert.throws(() => loadActiveSpecsLive(root), {
    name: 'IntegrationError',
    code: 'POSTURE_INVALID',
  })
  assert.ok(performance.now() - start < 5_000, 'roughly 1 MB of near-fences must finish promptly')
})

test('AC-2: real loaded critical risk is reported with exit zero, not promoted to enforcement', (t) => {
  const root = diskSpecs(t, {
    'SPEC.md': frontmatter('status: active\nrisk: critical\nsurfaces:\n  - docs/'),
  })
  const result = runReport({
    getChangedPaths: () => ['docs/note.md'],
    loadActiveSpecs: () => loadActiveSpecsLive(root),
  })
  assert.equal(result.exitCode, 0)
  assert.equal(result.decision?.declaredRisk, 'critical')
  assert.equal(result.decision?.triggered, true)
  assert.equal(result.decision?.drift, false)
})

for (const [field, body] of Object.entries({
  risk: 'r: &r risk\nstatus: active\nrisk: critical\n? *r\n: low\nsurfaces: [docs/]',
  status: 'r: &r status\nstatus: active\n? *r\n: draft\nrisk: critical\nsurfaces: [docs/]',
  surfaces: 'r: &r surfaces\nstatus: active\nrisk: critical\nsurfaces: [docs/]\n? *r\n: [other/]',
})) {
  test(`AC-3 B-01: alias key cannot overwrite ${field} in the real reader`, (t) => {
    const root = diskSpecs(t, { 'ALIAS.md': frontmatter(body) })
    assert.throws(
      () => loadActiveSpecsLive(root),
      (err: unknown) => {
        assert.ok(err instanceof IntegrationError)
        assert.equal(err.code, 'POSTURE_INVALID')
        assert.ok(err.message.includes('ALIAS.md'))
        return true
      },
    )
  })

  test(`AC-3 B-01: alias ${field} overwrite yields a report-only warning, not a decision`, (t) => {
    const root = diskSpecs(t, { 'ALIAS.md': frontmatter(body) })
    const result = runReport({
      getChangedPaths: () => ['docs/note.md'],
      loadActiveSpecs: () => loadActiveSpecsLive(root),
    })
    assert.equal(result.exitCode, 0)
    assert.equal(result.decision, null)
    assert.equal(result.annotations.length, 1)
    assert.ok(result.annotations[0]?.startsWith('::warning::'))
    assert.ok(result.annotations[0]?.includes('ALIAS.md'))
  })
}

test('AC-3 B-01: benign status, risk and surfaces aliases as values still load', (t) => {
  const root = diskSpecs(t, {
    'ALIAS.md': frontmatter(
      's: &s active\nr: &r critical\np: &p [docs/]\nstatus: *s\nrisk: *r\nsurfaces: *p',
    ),
  })
  assert.deepEqual(loadActiveSpecsLive(root), [
    { path: `${ACTIVE_DIR}/ALIAS.md`, status: 'active', risk: 'critical', surfaces: ['docs/'] },
  ])
})
