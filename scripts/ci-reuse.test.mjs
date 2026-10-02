// scripts/ci-reuse.test.mjs — CI-P1 AC7 fixture matrix for scripts/ci-reuse.mjs.
//
// node:test; ALL seams injected (spawn/fetch/git fakes); no network, no npm
// (A1-placement-6). Inline fixtures. Each AC7 row has at least one test; every
// fallback row additionally asserts — through the C12 wiring harness — that the
// sweep IS invoked and the process exit code equals the sweep's (AC5).

import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CLASS,
  EMPTY_CLASS_HASH,
  READER_SET,
  classifyPath,
  computeTreeClassHashes,
  decideCore,
  deltaFallbackReason,
  isPinnedReason,
  parseLsTreeZ,
  parseNameStatusZ,
  runCli,
  sanitizeUntrusted,
  verifyCore,
} from './ci-reuse.mjs'

// ─── fixture constants ───────────────────────────────────────────────────────

const HEAD = 'a'.repeat(40)
const SOURCE = 'b'.repeat(40)
const BASE_SHA = 'c'.repeat(40)
const OTHER_BASE_SHA = 'e'.repeat(40)
const FORK_POINT = 'd'.repeat(40)
const BASE_BRANCH = 'main'
const PR_NUMBER = 7
const RUN_ID = 9001
const SOURCE_RUN_ID = 9002
const WORKFLOW_ID = 4242
const REPO = 'owner/repo'
const SWEEP_EXIT = 7
const HEX64_RE = /^[0-9a-f]{64}$/

// One entry per hash class + one ordinary entry (ordinary is never hashed).
const BASE_TREE = [
  ['plugins/foreman-line/approval/src/x.ts', 'code-bytes'],
  ['plugins/foreman-line/approval/package.json', '{"name":"approval"}'],
  ['plugins/foreman-line/docs/specs/active/s.md', 'spec-bytes'],
  ['.github/workflows/foreman-line-ci.yml', 'name: foreman-line-ci'],
  ['plugins/foreman-line/docs/goals/ci-optimization/g.md', 'goal-bytes'],
]

function treeWith(replacements, removals = []) {
  return BASE_TREE
    .filter(([path]) => !removals.includes(path))
    .map(([path, bytes, mode]) => {
      const hit = replacements[path]
      return hit === undefined ? [path, bytes, mode] : [path, hit, mode]
    })
}

// ─── seam fakes ──────────────────────────────────────────────────────────────

function makeGit(world = {}) {
  const calls = []
  const blobs = new Map()
  const git = (args, opts = {}) => {
    calls.push([...args])
    const [cmd] = args
    if (cmd === 'ls-tree') {
      const entries = world.trees?.[args[3]]
      if (entries === undefined) return { status: 128, stdout: Buffer.alloc(0), stderr: Buffer.from('bad object') }
      const chunks = []
      for (const [path, bytes, mode = '100644'] of entries) {
        const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'latin1')
        const oid = createHash('sha1').update(buf).digest('hex')
        blobs.set(oid, buf)
        const type = mode === '160000' ? 'commit' : 'blob'
        chunks.push(Buffer.from(`${mode} ${type} ${oid}\t${path}\0`, 'latin1'))
      }
      return { status: 0, stdout: Buffer.concat(chunks), stderr: Buffer.alloc(0) }
    }
    if (cmd === 'cat-file' && args[1] === '--batch') {
      const oids = Buffer.isBuffer(opts.input) ? opts.input.toString('latin1').split('\n').filter(Boolean) : []
      const chunks = []
      for (const oid of oids) {
        const buf = blobs.get(oid)
        if (buf === undefined) {
          chunks.push(Buffer.from(`${oid} missing\n`, 'latin1'))
          continue
        }
        chunks.push(Buffer.from(`${oid} blob ${buf.length}\n`, 'latin1'), buf, Buffer.from('\n', 'latin1'))
      }
      return { status: 0, stdout: Buffer.concat(chunks), stderr: Buffer.alloc(0) }
    }
    if (cmd === 'diff') {
      const raw = world.diffRaw ?? Buffer.alloc(0)
      return {
        status: world.diffStatus ?? 0,
        stdout: Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'latin1'),
        stderr: Buffer.alloc(0),
      }
    }
    if (cmd === 'merge-base' && args[1] === '--is-ancestor') {
      return { status: world.isAncestor?.(args[2], args[3]) ?? 0, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) }
    }
    if (cmd === 'merge-base') {
      const sha = world.mergeBase?.(args[1], args[2]) ?? FORK_POINT
      if (sha === null) return { status: 1, stdout: Buffer.alloc(0), stderr: Buffer.from('no merge base') }
      return { status: 0, stdout: Buffer.from(`${sha}\n`, 'latin1'), stderr: Buffer.alloc(0) }
    }
    return { status: 129, stdout: Buffer.alloc(0), stderr: Buffer.from('unexpected') }
  }
  return { git, calls }
}

function makeApi(world = {}) {
  const calls = []
  const api = async (url) => {
    calls.push(url)
    if (world.throwWith !== undefined) throw world.throwWith
    if (world.status !== undefined) return { status: world.status, text: world.text ?? '{}' }
    if (url.includes('/runs?')) {
      if (world.listingText !== undefined) return { status: 200, text: world.listingText }
      return { status: 200, text: JSON.stringify({ workflow_runs: world.listing ?? [] }) }
    }
    const match = /\/actions\/runs\/(\d+)$/.exec(url)
    if (match !== null) {
      const id = Number(match[1])
      const entry = id === RUN_ID ? world.self : (world.byId ?? {})[id]
      if (entry === undefined) return { status: 404, text: '{"message":"Not Found"}' }
      return { status: 200, text: JSON.stringify(entry) }
    }
    return { status: 404, text: '{}' }
  }
  return { api, calls }
}

function runEntry(overrides = {}) {
  return {
    id: SOURCE_RUN_ID,
    head_sha: SOURCE,
    head_branch: 'feat/line',
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    workflow_id: WORKFLOW_ID,
    pull_requests: [{ number: PR_NUMBER, base: { ref: BASE_BRANCH, sha: BASE_SHA } }],
    head_repository: { full_name: REPO },
    ...overrides,
  }
}

function selfRun(overrides = {}) {
  return runEntry({
    id: RUN_ID,
    head_sha: HEAD,
    status: 'in_progress',
    conclusion: null,
    pull_requests: [{ number: PR_NUMBER, base: { ref: BASE_BRANCH, sha: BASE_SHA } }],
    ...overrides,
  })
}

function prEvent({ number = PR_NUMBER, baseRef = BASE_BRANCH, baseSha = BASE_SHA, headSha = HEAD } = {}) {
  const event = { pull_request: { number, head: { sha: headSha } } }
  if (baseRef !== null) event.pull_request.base = { ref: baseRef, sha: baseSha }
  return event
}

/**
 * The C12 wiring harness: decide -> (fallback => gated full sweep | reuse =>
 * verify with a sweep source). Mirrors .github/workflows/foreman-line-ci.yml.
 */
async function runPipeline(world = {}, options = {}) {
  const { ctx, gitCalls, apiCalls, spawnCalls } = makeCtx(world, options)
  const decided = await decideCore(ctx)
  let stage = 'decide'
  let exitCode = decided.exitCode
  if (decided.record.decision === 'fallback') {
    ctx.spawn('node', ['scripts/foreman-line-ci.mjs', 'npm-cli.js'])
    exitCode = SWEEP_EXIT
    stage = 'sweep'
  } else {
    ctx.evidence = decided.json
    const verified = await verifyCore(ctx)
    exitCode = verified.exitCode
    stage = 'verify'
  }
  return { decided, stage, exitCode, spawnCalls, gitCalls, apiCalls, ctx }
}

function makeCtx(world = {}, options = {}) {
  const g = makeGit(world.git ?? world)
  const a = makeApi(world.api ?? world)
  const spawnCalls = []
  const ctx = {
    api: a.api,
    git: g.git,
    eventName: options.eventName ?? 'pull_request',
    event: options.event ?? prEvent(),
    runId: RUN_ID,
    repo: REPO,
    apiBase: 'https://api.example.test',
    headShaFallback: HEAD,
    evidence: options.evidence,
    sweep: options.noSweep ? null : { cmd: 'node', args: ['scripts/foreman-line-ci.mjs', 'npm-cli.js'] },
    spawn: (cmd, args) => {
      spawnCalls.push({ cmd, args })
      return { status: options.sweepExit ?? SWEEP_EXIT }
    },
  }
  return { ctx, gitCalls: g.calls, apiCalls: a.calls, spawnCalls }
}

// A fully green world: identical trees, empty delta, equal merge context.
function greenWorld(overrides = {}) {
  return {
    trees: { [HEAD]: BASE_TREE, [SOURCE]: BASE_TREE },
    diffRaw: Buffer.alloc(0),
    listing: [selfRun(), runEntry()],
    byId: { [SOURCE_RUN_ID]: runEntry() },
    self: selfRun(),
    ...overrides,
  }
}

async function positiveRecord() {
  const { decided } = await runPipeline(greenWorld())
  assert.equal(decided.record.decision, 'reuse')
  return decided
}

/** Per-row invariant (AC7): fallback => sweep invoked, exit code = sweep's. */
function assertSweepRan(row) {
  assert.equal(row.stage, 'sweep')
  assert.equal(row.spawnCalls.length, 1)
  assert.equal(row.exitCode, SWEEP_EXIT)
}

// ─── F1 per-class refusal + positive controls (SC #3) ────────────────────────

const perClassFixtures = {
  code: greenWorld({ trees: { [HEAD]: BASE_TREE, [SOURCE]: treeWith({ 'plugins/foreman-line/approval/src/x.ts': 'code-bytes-DIFFERENT' }) } }),
  specifications: greenWorld({ trees: { [HEAD]: BASE_TREE, [SOURCE]: treeWith({ 'plugins/foreman-line/docs/specs/active/s.md': 'spec-DIFFERENT' }) } }),
  workflow: greenWorld({ trees: { [HEAD]: BASE_TREE, [SOURCE]: treeWith({ '.github/workflows/foreman-line-ci.yml': 'name: changed' }) } }),
  dependency_inputs: greenWorld({ trees: { [HEAD]: BASE_TREE, [SOURCE]: treeWith({ 'plugins/foreman-line/approval/package.json': '{"name":"changed"}' }) } }),
  merge_context: greenWorld({
    listing: [selfRun(), runEntry({ pull_requests: [{ number: PR_NUMBER, base: { ref: BASE_BRANCH, sha: OTHER_BASE_SHA } }] })],
    byId: { [SOURCE_RUN_ID]: runEntry({ pull_requests: [{ number: PR_NUMBER, base: { ref: BASE_BRANCH, sha: OTHER_BASE_SHA } }] }) },
  }),
}
const perClassReasons = {
  code: 'hash-mismatch:code',
  specifications: 'hash-mismatch:specifications',
  workflow: 'hash-mismatch:workflow',
  dependency_inputs: 'hash-mismatch:dependency_inputs',
  merge_context: 'merge-context-mismatch',
}

for (const [cls, reason] of Object.entries(perClassReasons)) {
  test(`per-class refusal: ${cls} mismatch alone => fallback ${reason} + sweep`, async () => {
    const row = await runPipeline(perClassFixtures[cls])
    assert.equal(row.decided.record.decision, 'fallback')
    assert.equal(row.decided.record.fallback_reason, reason)
    assert.equal(row.decided.record.source_run, null)
    assertSweepRan(row)
  })
}

for (const cls of ['code', 'specifications', 'workflow', 'dependency_inputs', 'merge_context']) {
  test(`per-class positive control: ${cls} equal participates in reuse`, async () => {
    const decided = await positiveRecord()
    const current = decided.record.input_hashes
    const source = decided.record.source_run.input_hashes
    assert.equal(current[cls], source[cls])
    assert.ok(HEX64_RE.test(current[cls]))
    assert.equal(decided.record.fallback_reason, null)
  })
}

test('empty class hashes the empty serialization (pinned constant, AC2 equivalence table)', () => {
  const g = makeGit({ trees: { [HEAD]: [['plugins/foreman-line/docs/goals/g.md', 'ordinary-only']] } })
  const hashes = computeTreeClassHashes(g.git, HEAD)
  assert.equal(hashes.code, EMPTY_CLASS_HASH)
  assert.equal(hashes.specifications, EMPTY_CLASS_HASH)
  assert.equal(hashes.workflow, EMPTY_CLASS_HASH)
  assert.equal(hashes.dependency_inputs, EMPTY_CLASS_HASH)
  assert.equal(EMPTY_CLASS_HASH, createHash('sha256').update(Buffer.alloc(0)).digest('hex'))
  assert.equal(EMPTY_CLASS_HASH, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
})

// ─── F2 default-deny and boundaries ─────────────────────────────────────────

test('default-deny: unknown path in delta => fallback unknown-path + sweep', async () => {
  const row = await runPipeline(greenWorld({ diffRaw: Buffer.from('A\0zz/mystery.bin\0', 'latin1') }))
  assert.equal(row.decided.record.decision, 'fallback')
  assert.equal(row.decided.record.fallback_reason, 'unknown-path')
  assertSweepRan(row)
})

test('unsupported-entry: gitlink (160000) in head tree => fallback unsupported-entry + sweep', async () => {
  const world = greenWorld()
  world.trees[HEAD] = [...BASE_TREE, ['plugins/foreman-line/docs/goals/sub', 'gitlink', '160000']]
  const row = await runPipeline(world)
  assert.equal(row.decided.record.fallback_reason, 'unsupported-entry')
  assertSweepRan(row)
})

test('unsupported-entry: non-regular mode (040000) in source tree => fallback unsupported-entry + sweep', async () => {
  const world = greenWorld()
  world.trees[SOURCE] = [...BASE_TREE, ['plugins/foreman-line/approval/src/dir', 'x', '040000']]
  const row = await runPipeline(world)
  assert.equal(row.decided.record.fallback_reason, 'unsupported-entry')
  assertSweepRan(row)
})

test('rename ordinary->code => fallback (new side classified) + sweep', async () => {
  const row = await runPipeline(greenWorld({
    diffRaw: Buffer.from('R100\0plugins/foreman-line/docs/goals/g.md\0plugins/foreman-line/approval/src/evil.ts\0', 'latin1'),
  }))
  assert.equal(row.decided.record.fallback_reason, 'test-relevant-change')
  assertSweepRan(row)
})

test('rename code->ordinary => fallback (old side classified) + sweep', async () => {
  const row = await runPipeline(greenWorld({
    diffRaw: Buffer.from('R100\0plugins/foreman-line/approval/src/evil.ts\0plugins/foreman-line/docs/goals/g.md\0', 'latin1'),
  }))
  assert.equal(row.decided.record.fallback_reason, 'test-relevant-change')
  assertSweepRan(row)
})

test('deletion of a code path => fallback + sweep', async () => {
  const row = await runPipeline(greenWorld({
    diffRaw: Buffer.from('D\0plugins/foreman-line/approval/src/x.ts\0', 'latin1'),
  }))
  assert.equal(row.decided.record.fallback_reason, 'test-relevant-change')
  assertSweepRan(row)
})

test('mode-only change on a code path => fallback + sweep', async () => {
  const row = await runPipeline(greenWorld({
    diffRaw: Buffer.from('M\0plugins/foreman-line/approval/src/x.ts\0', 'latin1'),
  }))
  assert.equal(row.decided.record.fallback_reason, 'test-relevant-change')
  assertSweepRan(row)
})

test('empty delta with equal hashes => allowed (reuse)', async () => {
  const row = await runPipeline(greenWorld())
  assert.equal(row.decided.record.decision, 'reuse')
  assert.equal(row.stage, 'verify')
})

test('boundary: docs/specs/x.md => specifications', () => {
  assert.equal(classifyPath('docs/specs/x.md'), CLASS.SPECIFICATIONS)
})
test('boundary: docs/specs-extra/x.md => code (A1-E1)', () => {
  assert.equal(classifyPath('docs/specs-extra/x.md'), CLASS.CODE)
})
test('boundary: xdocs/specs/x.md => code', () => {
  assert.equal(classifyPath('xdocs/specs/x.md'), CLASS.CODE)
})
test('boundary: skills/parcel-compiler/docs/specs/done/x.md => specifications', () => {
  assert.equal(classifyPath('skills/parcel-compiler/docs/specs/done/x.md'), CLASS.SPECIFICATIONS)
})
test('boundary: plugins/foreman-line/docs/goals/ci-optimization/x.md => ordinary', () => {
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/ci-optimization/x.md'), CLASS.ORDINARY)
})

// ─── A3 positive controls: the shrink keeps its ordinary core ordinary ─────

test('C9: transcripts ordinary core survives the shrink; defects_lessons.md is a measured reader (A2 p5/p7)', () => {
  // non-reader transcripts .md stays ordinary (rule 4c core)
  assert.equal(classifyPath('plugins/foreman-line/docs/transcripts/other-lessons.md'), CLASS.ORDINARY)
  assert.equal(deltaFallbackReason('plugins/foreman-line/docs/transcripts/other-lessons.md'), null)
  // the measured reader flipped ordinary -> code (C9 shrink; A3 row 4: "Any
  // additional reader path found by the sweep is excluded and pinned likewise")
  assert.equal(classifyPath('plugins/foreman-line/docs/transcripts/defects_lessons.md'), CLASS.CODE)
  assert.equal(deltaFallbackReason('plugins/foreman-line/docs/transcripts/defects_lessons.md'), 'test-relevant-change')
})
test('A3: repo-root docs/**/*.md (non-specs first segment) stays ordinary', () => {
  assert.equal(classifyPath('docs/getting-started.md'), CLASS.ORDINARY)
  assert.equal(deltaFallbackReason('docs/getting-started.md'), null)
})
test('A3: repo-root README.md / AGENTS.md stay ordinary (rule 4a core)', () => {
  assert.equal(classifyPath('README.md'), CLASS.ORDINARY)
  assert.equal(classifyPath('AGENTS.md'), CLASS.ORDINARY)
})
test('A3: reader-set exclusion is per-path — sibling goal .md files stay ordinary', () => {
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md'), CLASS.ORDINARY)
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/rcm-host-cache-source-contract-v4-proposal.md'), CLASS.ORDINARY)
})

// ─── A3 reader-set mechanics (SC #11/#13: every axis refusable) ────────────

test('A3 reader-set mechanics: excluded paths fall to code; each SC #13 axis refuses independently', () => {
  const synthetic = ['docs/getting-started.md']
  assert.equal(classifyPath('docs/getting-started.md'), CLASS.ORDINARY)
  assert.equal(classifyPath('docs/getting-started.md', synthetic), CLASS.CODE)
  assert.equal(deltaFallbackReason('docs/getting-started.md', synthetic), 'test-relevant-change')
  // basename axis: same location family, different basename
  assert.equal(classifyPath('docs/getting-started2.md', synthetic), CLASS.ORDINARY)
  // location axis: same basename, different parent directory
  assert.equal(classifyPath('docs/sub/getting-started.md', synthetic), CLASS.ORDINARY)
  // value axis: same basename+location family, different pinned literal
  assert.equal(classifyPath('docs/getting-started.md', ['docs/getting-started2.md']), CLASS.ORDINARY)
  // subtree entries exclude their whole subtree (mandate: exclude its subtree)
  const subtree = ['plugins/foreman-line/docs/goals/foreman-kernel/']
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/foreman-kernel/charter.md', subtree), CLASS.CODE)
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/ci-optimization/charter.md', subtree), CLASS.ORDINARY)
})
test('A3 reader set pins exactly the measured read-sweep inventory (identity + location + value)', () => {
  assert.deepEqual(READER_SET, [
    'plugins/foreman-line/approval/README.md',
    'plugins/foreman-line/contract-readers/README.md',
    'plugins/foreman-line/contracts/README.md',
    'plugins/foreman-line/dispatch/README.md',
    'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
    'plugins/foreman-line/docs/goals/foreman-kernel/',
    'plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json',
    'plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/openrouter-rcm-v1-conservative-projection-20260926.json',
    'plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json',
    'plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md',
    'plugins/foreman-line/docs/transcripts/defects_lessons.md',
    'plugins/foreman-line/foreman-config/README.md',
    'plugins/foreman-line/hybrid-routing/README.md',
    'plugins/foreman-line/permission-profiles/README.md',
    'plugins/foreman-line/projection/README.md',
    'plugins/foreman-line/receipts/README.md',
    'plugins/foreman-line/registration/README.md',
    'plugins/foreman-line/role-authority/README.md',
    'plugins/foreman-line/routing-policy/README.md',
    'plugins/foreman-line/schema-scaffold/README.md',
    'plugins/foreman-line/shaping/README.md',
    'plugins/foreman-line/skill-injection/README.md',
    'plugins/foreman-line/skills/foreman-shaping/SKILL.md',
    'plugins/foreman-line/spec-linter/README.md',
    'plugins/foreman-line/worker-envelopes/README.md',
  ])
})

// ─── E2 reason split (A1-E2 as sharpened by A3-R1) ─────────────────────────

test('E2 split: named-shape code => test-relevant-change; unenumerated code => unknown-path', () => {
  assert.equal(deltaFallbackReason('skills/parcel-compiler/README.md'), 'test-relevant-change')
  assert.equal(deltaFallbackReason('docs/specs-extra/x.md'), 'test-relevant-change')
  assert.equal(deltaFallbackReason('skills/foo/SKILL.md'), 'unknown-path')
  assert.equal(deltaFallbackReason('zz/mystery.bin'), 'unknown-path')
})

// ─── A3 end-to-end exploit regression (the dual-review exploit stays dead) ──

test('A3 exploit regression: README-only delta with all five class hashes equal => fallback test-relevant-change + sweep', async () => {
  const readmeEntry = ['plugins/foreman-line/role-authority/README.md', '| D1 | x |']
  const world = greenWorld({
    trees: {
      [HEAD]: [...BASE_TREE, readmeEntry],
      [SOURCE]: [...BASE_TREE, readmeEntry],
    },
    diffRaw: Buffer.from('M\0plugins/foreman-line/role-authority/README.md\0', 'latin1'),
  })
  const row = await runPipeline(world)
  assert.equal(row.decided.record.decision, 'fallback')
  assert.equal(row.decided.record.fallback_reason, 'test-relevant-change')
  assertSweepRan(row)
  // the fixture condition is real: all five class hashes are equal — the
  // README-only delta alone is what forces the fallback
  const g = makeGit(world)
  assert.deepEqual(computeTreeClassHashes(g.git, HEAD), computeTreeClassHashes(g.git, SOURCE))
})

// ─── F3 under-detect fixtures (SC #6) — never ordinary_documentation ────────

const underDetect = [
  ['plugins/foreman-line/docs/specs/active/x.md', CLASS.SPECIFICATIONS, 'test-relevant-change'],
  ['skills/foo/SKILL.md', CLASS.CODE, 'unknown-path'],
  ['plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/SPEC-CONVENTION.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/package.json', CLASS.DEPENDENCY_INPUTS, 'test-relevant-change'],
  ['package-lock.json', CLASS.DEPENDENCY_INPUTS, 'test-relevant-change'],
  ['plugins/foreman-line/receipts/npm-shrinkwrap.json', CLASS.DEPENDENCY_INPUTS, 'test-relevant-change'],
  ['.npmrc', CLASS.DEPENDENCY_INPUTS, 'test-relevant-change'],
  ['.github/workflows/foreman-line-ci.yml', CLASS.WORKFLOW, 'test-relevant-change'],
  ['scripts/ci-reuse.mjs', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/src/a.ts', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/tests/a.test.ts', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/tests/fixtures/f.json', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/contracts/src/schema.ts', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/tsconfig.json', CLASS.CODE, 'test-relevant-change'],
  ['biome.json', CLASS.CODE, 'test-relevant-change'],
  // ── A3 measured read-sweep regression fixtures (one row per reader path;
  //    A3 rows 1-3: every measured reader is code + test-relevant-change) ──
  ['plugins/foreman-line/role-authority/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/receipts/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/spec-linter/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/approval/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/contract-readers/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/contracts/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/dispatch/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/foreman-config/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/hybrid-routing/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/permission-profiles/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/projection/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/registration/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/routing-policy/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/schema-scaffold/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/shaping/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/skill-injection/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/worker-envelopes/README.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/openrouter-rcm-v1-conservative-projection-20260926.json', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/skills/foreman-shaping/SKILL.md', CLASS.CODE, 'test-relevant-change'],
  // ── A3 row 5: skill trees' README/AGENTS (rule 4a no longer reaches in) ──
  ['skills/parcel-compiler/README.md', CLASS.CODE, 'test-relevant-change'],
  ['skills/parcel-compiler/AGENTS.md', CLASS.CODE, 'test-relevant-change'],
  // ── A3-R1 named shape fall-throughs ──
  ['plugins/foreman-line/AGENTS.md', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/goals/ci-optimization/notes.txt', CLASS.CODE, 'test-relevant-change'],
  ['plugins/foreman-line/docs/transcripts/archive.json', CLASS.CODE, 'test-relevant-change'],
  ['docs/receipts/x/000000-A.json', CLASS.CODE, 'test-relevant-change'],
  ['docs/specs-extra/x.md', CLASS.CODE, 'test-relevant-change'],
]

for (const [path, expectedClass, expectedReason] of underDetect) {
  test(`under-detect: ${path} is test-relevant (${expectedClass})`, () => {
    const cls = classifyPath(path)
    assert.equal(cls, expectedClass)
    assert.notEqual(cls, CLASS.ORDINARY)
    assert.equal(deltaFallbackReason(path), expectedReason)
  })
}

// ─── F4 hostile inputs (SC #4/#5) ────────────────────────────────────────────

test('hostile: newline in untrusted text is neutralized', () => {
  assert.equal(/[\r\n]/.test(sanitizeUntrusted('br\nanch')), false)
})
test('hostile: CRLF in untrusted text is neutralized', () => {
  assert.equal(/[\r\n]/.test(sanitizeUntrusted('br\r\nanch')), false)
})
test('hostile: ::error:: sequence cannot survive sanitization', () => {
  assert.equal(sanitizeUntrusted('::error::').includes('::'), false)
})
test('hostile: ::set-output sequence cannot survive sanitization', () => {
  assert.equal(sanitizeUntrusted('::set-output name=x').includes('::'), false)
})
test('hostile: ESC-sequence introducer cannot survive sanitization', () => {
  const out = sanitizeUntrusted('\x1b[31mred')
  assert.equal(/[\x00-\x1f\x7f]/.test(out), false)
})
test('hostile: bidi override characters are removed', () => {
  const out = sanitizeUntrusted('a‮b⁦c')
  assert.equal(/[‪-‮⁦-⁩]/.test(out), false)
})
test('hostile: NUL-adjacent bytes are neutralized', () => {
  assert.equal(/[\x00-\x1f\x7f]/.test(sanitizeUntrusted('a\u0000b\u0001c')), false)
})
test('hostile: 10 KB name is length-capped', () => {
  const out = sanitizeUntrusted('x'.repeat(10 * 1024))
  assert.ok(out.length <= 200)
})

test('hostile: git -z newline-bearing path is never split', async () => {
  const raw = Buffer.from('M\0plugins/foreman-line/docs/goals/a\nb.md\0', 'latin1')
  const records = parseNameStatusZ(raw)
  assert.equal(records.length, 1)
  assert.equal(records[0].paths.length, 1)
  assert.equal(records[0].paths[0].toString('latin1'), 'plugins/foreman-line/docs/goals/a\nb.md')
  const treeRaw = Buffer.from(`100644 blob ${'a'.repeat(40)}\tplugins/foreman-line/docs/goals/a\nb.md\0`, 'latin1')
  const treeEntries = parseLsTreeZ(treeRaw)
  assert.equal(treeEntries.length, 1)
  assert.equal(treeEntries[0].path.toString('latin1'), 'plugins/foreman-line/docs/goals/a\nb.md')
  const row = await runPipeline(greenWorld({ diffRaw: raw }))
  assert.equal(row.decided.record.decision, 'reuse')
})

test('hostile: git -z NUL-adjacent path bytes parse exactly', () => {
  const raw = Buffer.from('A\0zz/\u0001\u0002x.bin\0', 'latin1')
  const records = parseNameStatusZ(raw)
  assert.equal(records.length, 1)
  assert.equal(records[0].paths[0].toString('latin1'), 'zz/\u0001\u0002x.bin')
  assert.equal(deltaFallbackReason('zz/\u0001\u0002x.bin'), 'unknown-path')
})

test('hostile: API run with wrong-typed id => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ self: selfRun({ id: 'not-an-int' }) }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: API run missing fields => fallback api-error + sweep', async () => {
  const broken = selfRun()
  delete broken.head_sha
  const row = await runPipeline(greenWorld({ self: broken }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: pending prior run (conclusion null) => prior-run-inconclusive:null + sweep', async () => {
  const row = await runPipeline(greenWorld({
    listing: [selfRun(), runEntry({ status: 'in_progress', conclusion: null })],
  }))
  assert.equal(row.decided.record.fallback_reason, 'prior-run-inconclusive:null')
  assertSweepRan(row)
})
test('hostile: non-hex SHA in API body => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ self: selfRun({ head_sha: 'zz'.repeat(20) }) }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: wrong-length SHA in API body => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ self: selfRun({ head_sha: 'a'.repeat(39) }) }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: run_id as string => fallback api-error + sweep', async () => {
  const world = greenWorld()
  world.byId = { [SOURCE_RUN_ID]: runEntry({ id: '9002' }) }
  world.listing = [selfRun(), runEntry({ id: '9002' })]
  const row = await runPipeline(world)
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: run_id as array => fallback api-error + sweep', async () => {
  const world = greenWorld()
  world.byId = { [SOURCE_RUN_ID]: runEntry({ id: [9002] }) }
  world.listing = [selfRun(), runEntry({ id: [9002] })]
  const row = await runPipeline(world)
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: huge workflow_runs array is scanned boundedly => candidate-cap-truncation', async () => {
  const huge = [selfRun(), ...Array.from({ length: 5000 }, (_, i) => runEntry({
    id: 10000 + i,
    head_branch: 'other/branch',
  }))]
  // entries at/after the scan bound are malformed: scanning them would raise api-error
  for (let i = 10; i < huge.length; i += 1) huge[i] = { id: 'poison' }
  const row = await runPipeline(greenWorld({ listing: huge }))
  assert.equal(row.decided.record.fallback_reason, 'candidate-cap-truncation')
  assertSweepRan(row)
})
test('hostile: runs of other workflows are non-lineage => no-prior-run + sweep', async () => {
  const row = await runPipeline(greenWorld({ listing: [selfRun(), runEntry({ workflow_id: WORKFLOW_ID + 1 })] }))
  assert.equal(row.decided.record.fallback_reason, 'no-prior-run')
  assertSweepRan(row)
})
test('hostile: runs of other branches are non-lineage => no-prior-run + sweep', async () => {
  const row = await runPipeline(greenWorld({ listing: [selfRun(), runEntry({ head_branch: 'other/branch' })] }))
  assert.equal(row.decided.record.fallback_reason, 'no-prior-run')
  assertSweepRan(row)
})
test('hostile: runs of other PR numbers are non-lineage => no-prior-run + sweep', async () => {
  const row = await runPipeline(greenWorld({
    listing: [selfRun(), runEntry({ pull_requests: [{ number: PR_NUMBER + 1, base: { ref: BASE_BRANCH, sha: BASE_SHA } }] })],
  }))
  assert.equal(row.decided.record.fallback_reason, 'no-prior-run')
  assertSweepRan(row)
})
test('hostile: runs of other repositories are non-lineage => no-prior-run + sweep', async () => {
  const row = await runPipeline(greenWorld({
    listing: [selfRun(), runEntry({ head_repository: { full_name: 'evil/other' } })],
  }))
  assert.equal(row.decided.record.fallback_reason, 'no-prior-run')
  assertSweepRan(row)
})
test('hostile: truncated API JSON => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ listingText: '{"workflow_runs":[' }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: garbage API JSON => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ listingText: 'not json at all' }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: fetch throwing => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ throwWith: new Error('ECONNRESET') }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
for (const status of [403, 405, 429, 500]) {
  test(`hostile: HTTP ${status} => fallback api-error + sweep`, async () => {
    const row = await runPipeline(greenWorld({ status }))
    assert.equal(row.decided.record.fallback_reason, 'api-error')
    assertSweepRan(row)
  })
}
test('hostile: fetch timeout => fallback api-error + sweep', async () => {
  const row = await runPipeline(greenWorld({ throwWith: Object.assign(new Error('aborted'), { name: 'AbortError' }) }))
  assert.equal(row.decided.record.fallback_reason, 'api-error')
  assertSweepRan(row)
})
test('hostile: push-class with a garbage event payload still refuses event-class-ineligible (rule 0 first)', async () => {
  const { ctx } = makeCtx(greenWorld(), { eventName: 'push', event: 'not-an-object' })
  const decided = await decideCore(ctx)
  assert.equal(decided.record.decision, 'fallback')
  assert.equal(decided.record.fallback_reason, 'event-class-ineligible')
})
test('hostile: untrusted strings never emit raw control chars or ::-sequences', async () => {
  const hostileBranch = 'br\nanch::error::\x1b[200Eb\u202Ez'
  const world = greenWorld({
    listing: [selfRun({ head_branch: hostileBranch }), runEntry({ head_branch: hostileBranch })],
    self: selfRun({ head_branch: hostileBranch }),
    byId: { [SOURCE_RUN_ID]: runEntry({ head_branch: hostileBranch }) },
  })
  const { ctx, spawnCalls } = makeCtx(world, {})
  const decided = await decideCore(ctx)
  for (const text of [decided.logText, decided.summaryText]) {
    assert.equal(/[\x00-\x1f\x7f]/.test(text.replace(/\n/g, '')), false, 'no raw control characters')
    assert.equal(text.includes('::'), false, 'no ::-sequences from untrusted data')
    assert.equal(text.includes('\u202e') || text.includes('\u202E'), false, 'no bidi overrides')
  }
  assert.equal(spawnCalls.length, 0)
})

// ─── F5 evidence-record schema (AC0 byte-consistent field names) ─────────────

const TOP_LEVEL_FIELDS = ['decision', 'base_sha', 'head_sha', 'input_hashes', 'source_run', 'fallback_reason']
const INPUT_HASH_FIELDS = ['code', 'specifications', 'workflow', 'dependency_inputs', 'merge_context']

test('schema: top-level field names are exactly the pinned AC0 strings, in order', async () => {
  const decided = await positiveRecord()
  assert.deepEqual(Object.keys(decided.record), TOP_LEVEL_FIELDS)
  assert.deepEqual(TOP_LEVEL_FIELDS, ['decision', 'base_sha', 'head_sha', 'input_hashes', 'source_run', 'fallback_reason'])
})
test('schema: input_hashes field names are exactly the pinned strings (both sides)', async () => {
  const decided = await positiveRecord()
  assert.deepEqual(Object.keys(decided.record.input_hashes), INPUT_HASH_FIELDS)
  assert.deepEqual(Object.keys(decided.record.source_run.input_hashes), INPUT_HASH_FIELDS)
})
test('schema: source_run is null on every fallback record', async () => {
  const row = await runPipeline(greenWorld({ diffRaw: Buffer.from('A\0zz/mystery.bin\0', 'latin1') }))
  assert.equal(row.decided.record.decision, 'fallback')
  assert.equal(row.decided.record.source_run, null)
})
test('schema: fallback_reason is null on reuse', async () => {
  const decided = await positiveRecord()
  assert.equal(decided.record.fallback_reason, null)
})
test('schema: source_run value shapes on reuse (run_id number, conclusion success, five hex64)', async () => {
  const decided = await positiveRecord()
  const source = decided.record.source_run
  assert.equal(typeof source.run_id, 'number')
  assert.equal(source.conclusion, 'success')
  assert.deepEqual(Object.keys(source), ['run_id', 'conclusion', 'input_hashes'])
  for (const key of INPUT_HASH_FIELDS) {
    assert.ok(HEX64_RE.test(source.input_hashes[key]), `source ${key} is hex64`)
    assert.ok(HEX64_RE.test(decided.record.input_hashes[key]), `current ${key} is hex64`)
  }
})
test('schema: record is emitted to log AND GITHUB_STEP_SUMMARY text on reuse', async () => {
  const decided = await positiveRecord()
  assert.ok(decided.logText.includes(`CI_REUSE_EVIDENCE ${decided.json}`))
  assert.ok(decided.summaryText.includes('## CI Reuse Decision'))
  assert.ok(decided.summaryText.includes(decided.json))
})
test('schema: record is emitted to log AND GITHUB_STEP_SUMMARY text on fallback', async () => {
  const row = await runPipeline(greenWorld({ diffRaw: Buffer.from('A\0zz/mystery.bin\0', 'latin1') }))
  assert.ok(row.decided.logText.includes(`CI_REUSE_EVIDENCE ${row.decided.json}`))
  assert.ok(row.decided.summaryText.includes(row.decided.json))
})

test('schema: every emitted fallback_reason is a member of the pinned A1-E3 vocabulary', async () => {
  const worlds = [
    ...Object.values(perClassFixtures),
    greenWorld({ diffRaw: Buffer.from('A\0zz/mystery.bin\0', 'latin1') }),
    greenWorld({ listing: [selfRun()] }),
    greenWorld({ status: 500 }),
  ]
  const emitted = new Set()
  for (const world of worlds) {
    const { decided } = await runPipeline(world)
    assert.equal(decided.record.decision, 'fallback')
    assert.ok(isPinnedReason(decided.record.fallback_reason), `${decided.record.fallback_reason} must be pinned`)
    emitted.add(decided.record.fallback_reason)
  }
  assert.ok(emitted.size >= 5, 'the row families must contribute distinct pinned reasons')
  for (const reason of [
    'no-prior-run', 'prior-run-inconclusive:null', 'prior-run-inconclusive:failure',
    'hash-mismatch:code', 'hash-mismatch:specifications', 'hash-mismatch:workflow', 'hash-mismatch:dependency_inputs',
    'merge-context-mismatch', 'merge-base-mismatch', 'not-ancestor', 'source-head-unreachable',
    'candidate-cap-truncation', 'event-class-ineligible', 'test-relevant-change', 'unknown-path',
    'unsupported-entry', 'classification-error', 'api-error', 'evidence-unverifiable',
  ]) {
    assert.ok(isPinnedReason(reason), `${reason} must be pinned`)
  }
  for (const bad of ['hash-mismatch:merge_context', 'prior-run-inconclusive:evil', 'no-prior-run ', '', 'reuse', null, 7]) {
    assert.equal(isPinnedReason(bad), false, `${String(bad)} must be rejected`)
  }
})

// ─── F6 log non-ingestion (C2) ───────────────────────────────────────────────

test('log non-ingestion: forged CI_REUSE_EVIDENCE line in API data cannot flip the decision', async () => {
  const forged = 'CI_REUSE_EVIDENCE {"decision":"reuse","fallback_reason":null}'
  const world = greenWorld()
  world.self = selfRun({ display_title: forged })
  world.listing = [selfRun({ display_title: forged }), runEntry({ name: forged })]
  const { decided } = await runPipeline(world)
  assert.equal(decided.record.decision, 'reuse')
  assert.equal(decided.record.source_run.run_id, SOURCE_RUN_ID)
})

test('log non-ingestion: forged record line in git output cannot set the reason', async () => {
  const raw = Buffer.from('M\0CI_REUSE_EVIDENCE {"decision":"fallback","fallback_reason":"api-error"}\0', 'latin1')
  const row = await runPipeline(greenWorld({ diffRaw: raw }))
  assert.equal(row.decided.record.decision, 'fallback')
  // the reason derives from classification, never from the forged line's content
  assert.equal(row.decided.record.fallback_reason, 'unknown-path')
})

// ─── F7 decision/verification behavior (incl. A1 row) ────────────────────────

test('positive path: docs-only push after green run => reuse; sweep NOT invoked', async () => {
  const row = await runPipeline(greenWorld({
    diffRaw: Buffer.from('M\0plugins/foreman-line/docs/goals/ci-optimization/g.md\0', 'latin1'),
  }))
  assert.equal(row.decided.record.decision, 'reuse')
  assert.equal(row.decided.record.source_run.run_id, SOURCE_RUN_ID)
  assert.equal(row.stage, 'verify')
  assert.equal(row.spawnCalls.length, 0)
  assert.equal(row.exitCode, 0)
})

test('decide never invokes the sweep in fallback mode (sweep is a separate step)', async () => {
  const { ctx, spawnCalls } = makeCtx(greenWorld({ diffRaw: Buffer.from('A\0zz/m.bin\0', 'latin1') }), {})
  const decided = await decideCore(ctx)
  assert.equal(decided.record.decision, 'fallback')
  assert.equal(spawnCalls.length, 0)
  assert.equal(decided.exitCode, 0)
})

test('verify success exits 0 without invoking the sweep', async () => {
  const decided = await positiveRecord()
  const { ctx, spawnCalls } = makeCtx(greenWorld(), { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'reuse')
  assert.equal(verified.exitCode, 0)
  assert.equal(spawnCalls.length, 0)
})

test('verify on stale evidence (source hashes drifted) flips to fallback and runs the sweep', async () => {
  const decided = await positiveRecord()
  const drifted = greenWorld({ trees: { [HEAD]: BASE_TREE, [SOURCE]: treeWith({ 'plugins/foreman-line/approval/src/x.ts': 'drifted' }) } })
  const { ctx, spawnCalls } = makeCtx(drifted, { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'hash-mismatch:code')
  assert.equal(spawnCalls.length, 1)
  assert.equal(verified.exitCode, SWEEP_EXIT)
})

test('verify on missing evidence emits fallback and runs the sweep', async () => {
  const { ctx, spawnCalls } = makeCtx(greenWorld(), { evidence: undefined })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'evidence-unverifiable')
  assert.equal(spawnCalls.length, 1)
  assert.equal(verified.exitCode, SWEEP_EXIT)
})

test('verify on tampered evidence (source conclusion changed) flips and runs the sweep', async () => {
  const decided = await positiveRecord()
  const world = greenWorld()
  world.byId = { [SOURCE_RUN_ID]: runEntry({ status: 'completed', conclusion: 'failure' }) }
  const { ctx, spawnCalls } = makeCtx(world, { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'prior-run-inconclusive:failure')
  assert.equal(spawnCalls.length, 1)
  assert.equal(verified.exitCode, SWEEP_EXIT)
})

test('verify flip without a sweep source emits fallback and exits 0 (C12 consumer mode)', async () => {
  const { ctx, spawnCalls } = makeCtx(greenWorld(), { evidence: undefined, noSweep: true })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.exitCode, 0)
  assert.equal(spawnCalls.length, 0)
})

test('A1: push-class decision => fallback event-class-ineligible, sweep invoked', async () => {
  const { ctx } = makeCtx(greenWorld(), { eventName: 'push', event: { after: HEAD } })
  const decided = await decideCore(ctx)
  assert.equal(decided.record.decision, 'fallback')
  assert.equal(decided.record.fallback_reason, 'event-class-ineligible')
  const row = await runPipeline(greenWorld(), { eventName: 'push', event: { after: HEAD } })
  assert.equal(row.decided.record.fallback_reason, 'event-class-ineligible')
  assertSweepRan(row)
})

// ─── R2 emission ordering + R3 fail-closed output channel (A-F2/A-F3) ───────

function cliEnv(overrides = {}) {
  return {
    GITHUB_REPOSITORY: REPO,
    GITHUB_RUN_ID: String(RUN_ID),
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_PATH: 'event.json',
    GITHUB_SHA: HEAD,
    ...overrides,
  }
}

test('R2: verifyCore emits before spawning the fallback sweep (injected seam observes order)', async () => {
  const { ctx, spawnCalls } = makeCtx(greenWorld(), { evidence: undefined })
  const events = []
  ctx.emit = () => events.push('emit')
  const inner = ctx.spawn
  ctx.spawn = (...args) => {
    events.push('spawn')
    return inner(...args)
  }
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.deepEqual(events, ['emit', 'spawn'])
  assert.equal(spawnCalls.length, 1)
  assert.equal(verified.exitCode, SWEEP_EXIT)
})

test('R2: runCli writes stdout + step summary + GITHUB_OUTPUT before the sweep spawn runs', async () => {
  const events = []
  const written = { stdout: '', summary: '', output: '' }
  const g = makeGit(greenWorld())
  const deps = {
    git: g.git,
    api: async () => { throw new Error('api must not be reached') },
    readFile: () => JSON.stringify(prEvent()),
    stdoutWrite: (text) => {
      events.push('stdout')
      written.stdout += text
    },
    appendFile: (path, text) => {
      if (path === '/sum') {
        events.push('summary')
        written.summary += text
      } else {
        events.push('output')
        written.output += text
      }
    },
    spawn: () => {
      events.push('spawn')
      // R2: the full record is already written everywhere when the sweep starts
      assert.ok(written.stdout.includes('CI_REUSE_EVIDENCE'))
      assert.ok(written.summary.includes('## CI Reuse Decision'))
      assert.ok(written.output.includes('decision=fallback'))
      assert.ok(written.output.includes('evidence_record='))
      return { status: SWEEP_EXIT }
    },
  }
  const result = await runCli(
    ['verify', '--sweep', 'node', 'sweep.js'],
    cliEnv({ GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: '/sum', GITHUB_OUTPUT: '/out' }),
    deps,
  )
  assert.equal(result.exitCode, SWEEP_EXIT)
  assert.deepEqual(events, ['stdout', 'summary', 'output', 'spawn'])
})

test('R3: decide throws classification-error in Actions without GITHUB_OUTPUT', async () => {
  await assert.rejects(
    runCli(['decide'], cliEnv({ GITHUB_ACTIONS: 'true', GITHUB_OUTPUT: '' }), {}),
    (error) => error.reason === 'classification-error' && error.message.includes('GITHUB_OUTPUT'),
  )
})

test('R3: verify throws classification-error in Actions without GITHUB_OUTPUT', async () => {
  await assert.rejects(
    runCli(['verify'], cliEnv({ GITHUB_ACTIONS: 'true' }), {}),
    (error) => error.reason === 'classification-error' && error.message.includes('GITHUB_OUTPUT'),
  )
})

test('R3: standalone run without any output channel keeps working', async () => {
  const events = []
  const g = makeGit(greenWorld())
  const deps = {
    git: g.git,
    api: async () => { throw new Error('api must not be reached') },
    readFile: () => JSON.stringify({ after: HEAD }),
    stdoutWrite: (text) => events.push(['stdout', text]),
    appendFile: (path) => events.push(['append', path]),
  }
  const result = await runCli(
    ['decide'],
    cliEnv({ GITHUB_ACTIONS: '', GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: '', GITHUB_EVENT_NAME: 'push' }),
    deps,
  )
  assert.equal(result.record.decision, 'fallback')
  assert.equal(result.record.fallback_reason, 'event-class-ineligible')
  assert.equal(result.exitCode, 0)
  // the record still reaches stdout; no channel writes are attempted
  assert.equal(events.filter(([kind]) => kind === 'stdout').length, 1)
  assert.equal(events.filter(([kind]) => kind === 'append').length, 0)
})

// ─── R5 harness-step wiring pin (C-F1) ─────────────────────────────────────
// The invariant lives in the workflow's pwsh block (step exit = last command's
// without propagation); no local runtime test can reach the step, so the pin
// binds the wiring shape of the file that actually ships (SC #12: shape, never
// bytes). This suite's one intentional read of a real repo file.

test('R5: harness step propagates each test command exit code (either suite failing reds the step)', () => {
  const workflowPath = fileURLToPath(new URL('../.github/workflows/foreman-line-ci.yml', import.meta.url))
  const text = readFileSync(workflowPath, 'utf8')
  const marker = '- name: Test the package runner and reuse core without subprocess effects'
  const start = text.indexOf(marker)
  assert.ok(start >= 0, 'the harness step must exist')
  const rest = text.slice(start + marker.length)
  const end = rest.indexOf('\n      - ')
  const block = end < 0 ? rest : rest.slice(0, end)
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
  const first = lines.indexOf('node --test scripts/foreman-line-ci.test.mjs')
  const second = lines.indexOf('node --test scripts/ci-reuse.test.mjs')
  assert.ok(first >= 0 && second > first, 'both test commands must run, runner harness first')
  const between = lines.slice(first + 1, second).join(' ')
  assert.ok(
    /\bif\s*\(\s*\$LASTEXITCODE\b[^]*\bexit\s+\$LASTEXITCODE\b/.test(between),
    'the first suite failing must exit the step before the second suite runs',
  )
  const after = lines.slice(second + 1).join(' ')
  assert.ok(
    /\bexit\s+\$LASTEXITCODE\b/.test(after),
    'the second suite failing must exit the step',
  )
})

// ─── R6 scan-derived selection (D-P3) ──────────────────────────────────────

test('R6: verify re-derives newest-first — a forged pin on an older green run cannot outrank a newer failed lineage run', async () => {
  const decided = await positiveRecord() // truthful hashes, pin targets run 9002
  const world = greenWorld({
    listing: [selfRun(), runEntry({ id: 9003, conclusion: 'failure' }), runEntry()],
    byId: { [SOURCE_RUN_ID]: runEntry() }, // the forged pin would still validate
  })
  const { ctx, spawnCalls } = makeCtx(world, { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'prior-run-inconclusive:failure')
  assert.equal(spawnCalls.length, 1)
  assert.equal(verified.exitCode, SWEEP_EXIT)
})

test('R6: pins agree => reuse, and the candidate was scan-derived (listing consulted)', async () => {
  const decided = await positiveRecord()
  const { ctx, apiCalls, spawnCalls } = makeCtx(greenWorld(), { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'reuse')
  assert.equal(verified.exitCode, 0)
  assert.equal(spawnCalls.length, 0)
  assert.ok(
    apiCalls.some((url) => url.includes('/runs?')),
    'verify must consult the lineage listing, not trust the pin',
  )
})

test('R6: scan-derived fallback reason surfaces even when the pin would pass', async () => {
  const decided = await positiveRecord() // pin targets run 9002, served green byId
  const world = greenWorld({ listing: [selfRun()] }) // but 9002 is not in the lineage listing
  const { ctx, spawnCalls } = makeCtx(world, { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'no-prior-run')
  assert.equal(spawnCalls.length, 1)
})

test('R6: derived reuse from a newer source than the pin => evidence-unverifiable + sweep', async () => {
  const decided = await positiveRecord() // pin targets run 9002
  const world = greenWorld({
    listing: [selfRun(), runEntry({ id: 9003 })], // newest lineage run 9003, green, same head
    byId: { [SOURCE_RUN_ID]: runEntry() },
  })
  const { ctx, spawnCalls } = makeCtx(world, { evidence: decided.json })
  const verified = await verifyCore(ctx)
  assert.equal(verified.record.decision, 'fallback')
  assert.equal(verified.record.fallback_reason, 'evidence-unverifiable')
  assert.equal(spawnCalls.length, 1)
})

// ─── CI-P2 C9 shrink (A2 placements 5/7): measured readers of the newly-swept
// packages flip ordinary -> code; each pinned basename + location + value (SC #13)

const authorityRegistryReaders = [
  'plugins/foreman-line/docs/goals/foreman-kernel/charter.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/R31-coordinator-decision-20260907.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/R30-step0-mapping-20260907.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/R31-step0-mapping-20260907.md',
  'plugins/foreman-line/docs/transcripts/defects_lessons.md',
]
test('C9 readers (authority-registry corpus/generate/validate): every measured path is code + test-relevant-change', () => {
  for (const path of authorityRegistryReaders) {
    assert.equal(classifyPath(path), CLASS.CODE, path)
    assert.equal(deltaFallbackReason(path), 'test-relevant-change', path)
  }
})

const bypassOutageReaders = [
  'plugins/foreman-line/docs/goals/foreman-kernel/fk-p1-p21-dispatch-plan.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/fk-rescope-RS1-2026-09-27.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md',
  'plugins/foreman-line/docs/goals/foreman-kernel/fk-wave3-4-marginal-value-2026-09-27.md',
]
test('C9 readers (bypass-outage-harness surface pins): every measured path is code + test-relevant-change', () => {
  for (const path of bypassOutageReaders) {
    assert.equal(classifyPath(path), CLASS.CODE, path)
    assert.equal(deltaFallbackReason(path), 'test-relevant-change', path)
  }
})

const jevAlphaReaders = [
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md',
  'plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md',
]
test('R5 re-verification: jev-p0 goal docs have no check readers and stay ordinary (PATHS is an in-memory allowlist)', () => {
  // measured, not asserted: jev-decisions/src/replay.ts keeps these paths in an
  // in-memory allowlist (PATHS.includes) and no check reads them from disk —
  // the three over-exclusions are dropped (contract-change delta, R5).
  for (const path of jevAlphaReaders) {
    assert.equal(classifyPath(path), CLASS.ORDINARY, path)
    assert.equal(deltaFallbackReason(path), null, path)
  }
})

test('C9 subtree entry: the whole foreman-kernel corpus is excluded, sibling goal trees are not', () => {
  // a foreman-kernel file outside the enumerated inventory is still excluded
  // (the corpus sweep copies/mutates the whole subtree — measured, not asserted)
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/foreman-kernel/brand-new-doc.md'), CLASS.CODE)
  assert.equal(deltaFallbackReason('plugins/foreman-line/docs/goals/foreman-kernel/brand-new-doc.md'), 'test-relevant-change')
  // siblings stay ordinary — the shrink is exactly as wide as the measurement
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md'), CLASS.ORDINARY)
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/ci-optimization/charter.md'), CLASS.ORDINARY)
})

test('C9 SC #13 axes bind independently against the real entries (basename / location / value)', () => {
  // basename axis: same location family, different basename
  assert.equal(classifyPath('plugins/foreman-line/docs/transcripts/other.md'), CLASS.ORDINARY)
  // location axis: same basename, different parent directory
  assert.equal(classifyPath('plugins/foreman-line/docs/goals/ci-optimization/defects_lessons.md'), CLASS.ORDINARY)
  // value axis: a near-miss literal never matches the pinned one
  assert.equal(classifyPath('plugins/foreman-line/docs/transcripts/defects_lessons-2.md'), CLASS.ORDINARY)
  // the pinned literal itself is excluded
  assert.equal(classifyPath('plugins/foreman-line/docs/transcripts/defects_lessons.md'), CLASS.CODE)
})

// ─── D-Q2 (A2 placement 8): spec-corpus near-miss segments matched case-insensitively

test('D-Q2: docs/Specs* and docs/SPECS* case variants fall to code (never ordinary)', () => {
  for (const path of ['docs/Specs/x.md', 'docs/SPECS/x.md', 'docs/sPeCs/x.md', 'docs/Specs/deep/y.md']) {
    assert.equal(classifyPath(path), CLASS.CODE, path)
    assert.equal(deltaFallbackReason(path), 'test-relevant-change', path)
  }
})
test('D-Q2: the exact-lowercase spec segment keeps its classes (rule 3 + near-miss unchanged)', () => {
  assert.equal(classifyPath('docs/specs/x.md'), CLASS.SPECIFICATIONS)
  assert.equal(deltaFallbackReason('docs/specs/x.md'), 'test-relevant-change')
  assert.equal(classifyPath('docs/specs-extra/x.md'), CLASS.CODE)
  assert.equal(deltaFallbackReason('docs/specs-extra/x.md'), 'test-relevant-change')
})
