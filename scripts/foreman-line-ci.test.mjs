// scripts/foreman-line-ci.test.mjs — CI-P2 contract tests (AC8 rewrite).
//
// Dispositions (spec AC8 table): the frozen-20 ordering pin is rewritten into
// the per-shard barrier + no-shell spawn assertion; the offline/failed-install
// pair is retargeted to the per-shard entry point; the per-check failure loop,
// the failure-detail table, and the multiple-failures test keep their contracts
// and are retargeted; the hybrid-routing propagation test is retargeted to a
// discovery fixture set (its frozen-membership name and call counts were
// incidental — SC #12). New contract tests pin discoverPackages, assignShards,
// reconcile, and runShard — one failing-when-broken test per structural
// invariant (SC #3/#11), against synthetic fixture trees and injected seams.
//
// Process boundary: every spawn is injected; importing this suite never
// launches npm.

import assert from 'node:assert/strict'
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import {
  CHECKS,
  COST_TABLE,
  EXPECTED_SKIPS,
  ForemanCiError,
  MAX_SHARDS,
  OUTCOMES_SCHEMA,
  WAIVED_EXCLUSIONS,
  assignShards,
  discoverPackages,
  effectiveDecision,
  failingTestNames,
  reconcile,
  runCli,
  runShard,
  sumFailTotals,
  verdict,
  waiverFor,
} from './foreman-line-ci.mjs'

const root = process.cwd()
const npmCli = join(root, 'fake npm', 'npm-cli.js')

function fixtureTree(manifests) {
  const dir = mkdtempSync(join(tmpdir(), 'fl-ci-fixture-'))
  const base = join(dir, 'plugins', 'foreman-line')
  mkdirSync(base, { recursive: true })
  for (const [name, manifest] of Object.entries(manifests)) {
    mkdirSync(join(base, name), { recursive: true })
    if (manifest !== null) writeFileSync(join(base, name, 'package.json'), manifest)
  }
  return dir
}

function passChecks() {
  return { ci: 'pass', test: 'pass', typecheck: 'pass', lint: 'pass' }
}

function pkg(name, checks = passChecks(), waivers = []) {
  return {
    name,
    location: `plugins/foreman-line/${name}/`,
    checks: { ci: checks.ci, test: checks.test, typecheck: checks.typecheck, lint: checks.lint },
    waivers,
  }
}

function artifact(shardIndex, shardCount, packages) {
  return { schema: OUTCOMES_SCHEMA, shard_index: shardIndex, shard_count: shardCount, head_sha: 'a'.repeat(40), packages }
}

// ─── AC8 disposition: per-shard barrier + explicit Node/npm without a shell ─

const NAMES = ['alpha', 'beta', 'delta', 'gamma'] // code-point sorted

test('per-shard barrier: every discovered install completes before any check in the shard', () => {
  const calls = []
  const result = runShard({
    root,
    npmCli,
    spawn: (...args) => {
      calls.push(args)
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  // all 4 installs first (every discovered package), then only shard 0's
  // assigned checks (alpha + delta): 4 installs + 6 checks
  assert.equal(calls.length, 10)
  const installCalls = calls.slice(0, 4)
  const checkCalls = calls.slice(4)
  assert.deepEqual(
    installCalls.map(([, [, ...args]]) => args[0]),
    ['ci', 'ci', 'ci', 'ci'],
    'phase 1 is installs only',
  )
  assert.deepEqual(
    installCalls.map(([, , options]) => basename(options.cwd)),
    NAMES,
    'every discovered package is installed before any check',
  )
  for (const [, , options] of checkCalls) {
    assert.ok(['alpha', 'delta'].includes(basename(options.cwd)), 'checks only run for shard-assigned packages')
  }
  assert.deepEqual(
    installCalls.map(([, args]) => args.slice(1)),
    NAMES.map(() => ['ci', '--ignore-scripts', '--no-audit', '--no-fund']),
    'R3 exact argv: installs are ci --ignore-scripts --no-audit --no-fund (kept verbatim, AC8)',
  )
  assert.deepEqual(
    checkCalls.map(([, args]) => args.slice(1)),
    [
      ['run', 'test', '--ignore-scripts'], ['run', 'typecheck', '--ignore-scripts'], ['run', 'lint', '--ignore-scripts'],
      ['run', 'test', '--ignore-scripts'], ['run', 'typecheck', '--ignore-scripts'], ['run', 'lint', '--ignore-scripts'],
    ],
    'R3 exact argv: checks are run <check> --ignore-scripts (kept verbatim, AC8)',
  )
  assert.deepEqual(result.outcomes.map((o) => o.name), NAMES)
  assert.equal(result.exitCode, 0)
  assert.deepEqual(result.artifact.packages.map((p) => p.name), ['alpha', 'delta'])
})

test('explicit Node/npm without a shell: every spawn is process.execPath + npm-cli.js, shell false', () => {
  const calls = []
  runShard({
    root,
    npmCli,
    spawn: (...args) => {
      calls.push(args)
      return { status: 0 }
    },
    shardIndex: 1,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  for (const [cmd, args, options] of calls) {
    assert.equal(cmd, process.execPath)
    assert.equal(args[0], npmCli)
    assert.equal(options.shell, false)
    assert.equal(options.cwd.startsWith(join(root, 'plugins', 'foreman-line')), true)
  }
})

// ─── AC8 disposition: offline + failed install (retargeted per-shard) ──────

test('offline installs never retry online: --offline rides the install args only', () => {
  const calls = []
  runShard({
    root,
    npmCli,
    offline: true,
    spawn: (...args) => {
      calls.push(args)
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  for (const [, args] of calls.slice(0, 4)) {
    assert.deepEqual(
      args.slice(1),
      ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--offline'],
      'R3 exact argv: the offline install variant, verbatim',
    )
  }
  for (const [, args] of calls.slice(4)) {
    assert.ok(!args.includes('--offline'), 'check args never carry --offline')
    assert.deepEqual(args.slice(1).slice(0, 2), ['run', args[2]], 'checks stay run <check> --ignore-scripts')
    assert.equal(args[3], '--ignore-scripts')
  }
})

test('failed install stops that shard checks: ci records fail, every check records skipped', () => {
  let calls = 0
  const result = runShard({
    root,
    npmCli,
    spawn: () => {
      calls += 1
      return { status: calls === 1 ? 1 : 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  assert.equal(calls, 4, 'the barrier stops the shard before any check')
  assert.equal(result.exitCode, 1)
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.ci, 'fail')
  for (const check of CHECKS) assert.equal(alpha.checks[check], 'skipped')
  const gamma = result.outcomes.find((o) => o.name === 'gamma')
  assert.equal(gamma.checks.ci, 'pass')
  for (const check of CHECKS) assert.equal(gamma.checks[check], 'skipped')
})

// ─── AC8 disposition: per-check failure loop (kept, retargeted) ────────────

for (const check of CHECKS) {
  test(`${check} failure is recorded against its own check name and stays nonzero`, () => {
    let calls = 0
    const result = runShard({
      root,
      npmCli,
      spawn: () => {
        calls += 1
        return { status: calls === 5 + CHECKS.indexOf(check) ? 2 : 0 }
      },
      shardIndex: 0,
      shardCount: 2,
      discover: () => [...NAMES],
    })
    assert.equal(calls, 10)
    assert.equal(result.exitCode, 1)
    const alpha = result.outcomes.find((o) => o.name === 'alpha')
    assert.equal(alpha.checks[check], 'fail')
    const delta = result.outcomes.find((o) => o.name === 'delta')
    assert.deepEqual(delta.checks, passChecks())
  })
}

// ─── AC8 disposition: failure-detail table (kept, retargeted) ──────────────

for (const [label, failure] of [
  ['throw', () => { throw new Error('untrusted\n::error::text') }],
  ['spawn error', () => ({ status: 0, error: new Error('ENOENT') })],
  ['signal', () => ({ status: 0, signal: 'SIGTERM' })],
  ['null status', () => ({ status: null })],
  ['missing result', () => undefined],
]) {
  for (const phase of ['install', 'check']) {
    test(`${label} during ${phase} fails closed and retains outcomes`, () => {
      let calls = 0
      const result = runShard({
        root,
        npmCli,
        spawn: () => {
          calls += 1
          return calls === (phase === 'install' ? 1 : 5) ? failure() : { status: 0 }
        },
        shardIndex: 0,
        shardCount: 2,
        discover: () => [...NAMES],
      })
      assert.equal(result.exitCode, 1)
      assert.equal(calls, phase === 'install' ? 4 : 10)
      const alpha = result.outcomes.find((o) => o.name === 'alpha')
      assert.equal(alpha.checks[phase === 'install' ? 'ci' : 'test'], 'fail')
      const retained = result.outcomes.find((o) => o.name === 'delta')
      assert.equal(retained.checks.lint, phase === 'install' ? 'skipped' : 'pass')
      assert.equal(JSON.stringify(result).includes('::error::'), false, 'untrusted text never reaches the outcomes')
    })
  }
}

test('multiple failures are all retained rather than overwritten by later success', () => {
  let calls = 0
  const result = runShard({
    root,
    npmCli,
    spawn: () => {
      calls += 1
      return { status: [5, 8, 10].includes(calls) ? 1 : 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  assert.equal(result.exitCode, 1)
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'fail')
  const delta = result.outcomes.find((o) => o.name === 'delta')
  assert.equal(delta.checks.test, 'fail')
  assert.equal(delta.checks.lint, 'fail')
  assert.equal(delta.checks.typecheck, 'pass')
})

test('a shard check failure propagates to the aggregate verdict', () => {
  let calls = 0
  const result = runShard({
    root,
    npmCli,
    spawn: () => {
      calls += 1
      return { status: calls === 5 ? 1 : 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
  })
  assert.equal(result.exitCode, 1)
  const verdict = reconcile({
    root,
    shardCount: 2,
    artifacts: [result.artifact, artifact(1, 2, [pkg('beta'), pkg('gamma')])],
    discover: () => [...NAMES],
  })
  assert.equal(verdict.ok, false)
  assert.ok(verdict.failures.some((f) => f.code === 'shard-fail'))
})

test('shard-outcomes artifact carries the pinned schema shape', () => {
  const result = runShard({
    root,
    npmCli,
    spawn: () => ({ status: 0 }),
    shardIndex: 1,
    shardCount: 2,
    headSha: 'b'.repeat(40),
    discover: () => [...NAMES],
  })
  const a = result.artifact
  assert.equal(a.schema, 'foreman-line-ci/shard-outcomes@1')
  assert.equal(a.shard_index, 1)
  assert.equal(a.shard_count, 2)
  assert.equal(a.head_sha, 'b'.repeat(40))
  assert.deepEqual(a.packages.map((p) => p.name), ['beta', 'gamma'])
  for (const p of a.packages) {
    assert.deepEqual(Object.keys(p.checks), ['ci', 'test', 'typecheck', 'lint'])
    assert.deepEqual(p.waivers, [])
    assert.equal(p.location, `plugins/foreman-line/${p.name}/`)
  }
})

// ─── A2 placement 9: run-then-waive (waived-exclusion set) ─────────────────

test('run-then-waive: a pinned failing check is recorded waived with matched markers, counts and output hash', () => {
  const result = runShard({
    root,
    npmCli,
    spawn: (cmd, args, options) => {
      if (args.includes('test') && basename(options.cwd) === 'alpha') {
        return { status: 1, stdout: pinnedOutput(PINNED.checks.test) }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [PINNED],
  })
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'waived')
  assert.equal(alpha.waivers.length, 1)
  assert.equal(alpha.waivers[0].check, 'test')
  assert.deepEqual(alpha.waivers[0].markers_matched, ['PIN-MARKER-A', 'PIN-MARKER-B'])
  assert.deepEqual(alpha.waivers[0].counts_verified, { 'PIN-MARKER-A': 2, 'PIN-MARKER-B': 1 })
  assert.equal(alpha.waivers[0].fail_total, 3)
  assert.deepEqual(alpha.waivers[0].failing_set, ['failing one', 'failing two', 'flaky member'])
  assert.match(alpha.waivers[0].output_sha256, /^[0-9a-f]{64}$/)
  assert.equal(result.exitCode, 0, 'a fully-waived shard is green')
})

test('run-then-waive: a DIFFERENT red on a waived identity re-gates as fail (never an unconditional skip)', () => {
  const result = runShard({
    root,
    npmCli,
    spawn: (cmd, args, options) => {
      if (args.includes('test') && basename(options.cwd) === 'alpha') {
        return { status: 1, stdout: '\u2716 some entirely different failure (1.0ms)\n\u2139 fail 1' }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [PINNED],
  })
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'fail')
  assert.equal(result.exitCode, 1)
})

test('run-then-waive: a green pass on a waived identity is recorded pass (the waiver never skips)', () => {
  const result = runShard({
    root,
    npmCli,
    spawn: () => ({ status: 0 }),
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [PINNED],
  })
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'pass')
  assert.deepEqual(alpha.waivers, [])
})

// ─── R7: the value axis binds DETERMINISTIC FAILURE IDENTITY ───────────────
// (pin shape v3: stable markers + deterministic counts + measured-variance
// total range + the failing-test SET with named flaky members)

const PINNED = {
  identity: 'alpha',
  location: 'plugins/foreman-line/alpha/',
  checks: {
    test: {
      markers: ['PIN-MARKER-A', 'PIN-MARKER-B'],
      counts: { 'PIN-MARKER-A': 2, 'PIN-MARKER-B': 1 },
      failTotal: [2, 3],
      failingSet: ['failing one', 'failing two'],
      flaky: ['flaky member'],
    },
  },
}

function pinnedOutput(pin, { omitNames = [], extraNames = [], extraLines = [], total = null, dupName = null } = {}) {
  const counted = Object.entries(pin.counts).flatMap(([needle, n]) => Array(n).fill(needle))
  const presenceOnly = pin.markers.filter((m) => !(m in pin.counts))
  const names = [...pin.failingSet, ...pin.flaky].filter((n) => !omitNames.includes(n))
  const sum = total ?? pin.failTotal[1]
  return [
    ...counted.filter((needle) => presenceOnly.length === 0 || true),
    ...presenceOnly,
    ...names.map((n) => `\u2716 ${n} (1.0ms)`),
    ...(dupName === null ? [] : [`\u2716 ${dupName} (1.0ms)`]),
    ...extraNames.map((n) => `\u2716 ${n} (1.0ms)`),
    ...extraLines,
    `\u2139 fail ${sum}`,
  ].join('\n')
}

test('R7: the exact pinned value waives (markers + counts + total + failing-set)', () => {
  const w = waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test), [PINNED])
  assert.ok(w !== null)
  assert.deepEqual(w.markers_matched, ['PIN-MARKER-A', 'PIN-MARKER-B'])
  assert.equal(w.fail_total, 3)
  assert.deepEqual(w.failing_set, ['failing one', 'failing two', 'flaky member'])
})

test('R7: a NEW failing test outside the set NEVER waives (set subsumes counts)', () => {
  // the intruder takes the flaky member's slot: distinct 3, total 3 (inside the
  // range), equality holds, the deterministic members are present — only the
  // universe (set-membership) check rejects
  const out = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], extraNames: ['an entirely new failure'], total: 3 })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
})

test('R7: the named flaky member is tolerated present-or-absent', () => {
  const absent = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 2 })
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', absent, [PINNED]) !== null, 'flaky absent still waives')
  const present = pinnedOutput(PINNED.checks.test)
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', present, [PINNED]) !== null, 'flaky present still waives')
})

test('R7: a DETERMINISTIC member missing re-gates (marker-variation class)', () => {
  const out = pinnedOutput(PINNED.checks.test, { omitNames: ['failing two'], total: 2 })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
})

test('R7: the failure total accepts exactly the measured variance and nothing more', () => {
  // [2,3]: 2 (flaky out), 3 (flaky in) — both ends waive
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 2 }), [PINNED]) !== null)
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test, { total: 3 }), [PINNED]) !== null)
  // outside the variance: never
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test, { total: 4 }), [PINNED]), null)
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test, { total: 1 }), [PINNED]), null)
})

test('R7: an occurrence-count mismatch re-gates (stable markers stay bound)', () => {
  const out = `${pinnedOutput(PINNED.checks.test)} PIN-MARKER-A`
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
  const missing = pinnedOutput(PINNED.checks.test).split('PIN-MARKER-B').join('')
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', missing, [PINNED]), null)
})

test('R7: duplicate name lines are set-deduplicated (the spec reporter prints twice) but a total bump still re-gates', () => {
  // a duplicated failure line (the reporter's in-run + summary double print)
  // is the same failure identity — the set dedupes and the waiver stands...
  const dupInVariance = pinnedOutput(PINNED.checks.test, { dupName: 'failing one' })
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', dupInVariance, [PINNED]) !== null, 'double-printed failure dedupes')
  // ...but a summary total outside the measured variance never waives
  const dup = pinnedOutput(PINNED.checks.test, { dupName: 'failing one', total: 4 })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', dup, [PINNED]), null)
})

for (const [label, failure] of [
  ['throw', () => { throw new Error('untrusted') }],
  ['spawn error', () => ({ status: 0, error: new Error('ENOENT'), stdout: pinnedOutput(PINNED.checks.test) })],
  ['signal', () => ({ status: 0, signal: 'SIGTERM', stdout: pinnedOutput(PINNED.checks.test) })],
  ['null status', () => ({ status: null, stdout: pinnedOutput(PINNED.checks.test) })],
  ['missing result', () => undefined],
]) {
  test(`R2/R7 waiver refusal: a ${label} failure NEVER waives even when the output carries the pinned value`, () => {
    const result = runShard({
      root,
      npmCli,
      spawn: (cmd, args, options) => {
        if (args.includes('test') && basename(options.cwd) === 'alpha') return failure()
        return { status: 0 }
      },
      shardIndex: 0,
      shardCount: 2,
      discover: () => [...NAMES],
      waivers: [PINNED],
    })
    const alpha = result.outcomes.find((o) => o.name === 'alpha')
    assert.equal(alpha.checks.test, 'fail', `${label} must re-gate`)
    assert.deepEqual(alpha.waivers, [])
    assert.equal(result.exitCode, 1)
  })
}

test('R2 count-bound waiver: a malformed pin never waives (fail closed)', () => {
  for (const malformed of [
    { markers: ['PIN-A'], counts: null, failTotal: [0, 0], failingSet: [], flaky: [] },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failingSet: [], flaky: [] },
    { markers: 'PIN-A', counts: { 'PIN-A': 1 }, failTotal: [0, 0], failingSet: [], flaky: [] },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: [1], failingSet: [], flaky: [] },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: [0, 0], failingSet: 'x', flaky: [] },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: [0, 0], failingSet: [], flaky: null },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: ['a', 'b'], failingSet: [], flaky: [] },
  ]) {
    const w = waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', 'PIN-A', [
      { identity: 'alpha', location: 'plugins/foreman-line/alpha/', checks: { test: malformed } },
    ])
    assert.equal(w, null, JSON.stringify(malformed))
  }
})

test('R2: waived output is echoed to the log (sanitized audit trail, never silent)', () => {
  const echoed = []
  const result = runShard({
    root,
    npmCli,
    spawn: (cmd, args, options) => {
      if (args.includes('test') && basename(options.cwd) === 'alpha') {
        return { status: 1, stdout: `${pinnedOutput(PINNED.checks.test)}\n::error::spoofed annotation\n` }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [PINNED],
    echo: (name, check, text) => echoed.push([name, check, text]),
  })
  assert.equal(result.outcomes.find((o) => o.name === 'alpha').checks.test, 'waived')
  const waivedEcho = echoed.find(([, check]) => check === 'test [waived]')
  assert.ok(waivedEcho, 'the waived output must be echoed')
  assert.ok(waivedEcho[2].includes('PIN-MARKER-A'), 'echo carries the output')
  assert.equal(waivedEcho[2].includes('::error::'), false, 'echo is sanitized (SC #4)')
})

// ─── SC #13: three refusal tests bind the waiver axes independently ────────

test('waiver axis refusal: same identity + different location is NOT excluded', () => {
  const w = waiverFor('alpha', 'plugins/foreman-line/elsewhere/', 'test', pinnedOutput(PINNED.checks.test), [PINNED])
  assert.equal(w, null)
})

test('waiver axis refusal: different identity + same location is NOT excluded', () => {
  const w = waiverFor('impostor', 'plugins/foreman-line/alpha/', 'test', pinnedOutput(PINNED.checks.test), [PINNED])
  assert.equal(w, null)
})

test('waiver axis refusal: same identity + same location + non-matching value is NOT excluded', () => {
  const w = waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', 'completely unrelated output', [PINNED])
  assert.equal(w, null)
})

// ─── AC8: discoverPackages contract tests (synthetic fixture trees) ────────

test('discoverPackages: finds every fixture manifest and returns code-point sorted names', () => {
  const dir = fixtureTree({ zeta: '{}', alpha: '{}', Beta: '{}', gamma: '{}' })
  try {
    assert.deepEqual(discoverPackages({ root: dir }), ['Beta', 'alpha', 'gamma', 'zeta'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: node_modules is excluded at any depth (closed-world)', () => {
  const dir = fixtureTree({ alpha: '{}', node_modules: '{"name":"evil"}' })
  mkdirSync(join(dir, 'plugins', 'foreman-line', 'alpha', 'node_modules', 'dep'), { recursive: true })
  writeFileSync(join(dir, 'plugins', 'foreman-line', 'alpha', 'node_modules', 'dep', 'package.json'), '{"name":"dep"}')
  try {
    assert.deepEqual(discoverPackages({ root: dir }), ['alpha'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: vendored/dependency trees are excluded (closed-world)', () => {
  const dir = fixtureTree({ alpha: '{}', vendor: '{"name":"v"}', third_party: '{"name":"t"}', 'third-party': '{"name":"t2"}' })
  try {
    assert.deepEqual(discoverPackages({ root: dir }), ['alpha'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: a directory without a manifest is not a package (excluded, not an error)', () => {
  const dir = fixtureTree({ alpha: '{}', docs: null, empty: null })
  try {
    assert.deepEqual(discoverPackages({ root: dir }), ['alpha'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: an unparseable manifest is a typed discovery error, never a silent skip', () => {
  const dir = fixtureTree({ alpha: '{}', broken: '{not json' })
  try {
    assert.throws(
      () => discoverPackages({ root: dir }),
      (error) => error instanceof ForemanCiError && /unparseable manifest/.test(error.message),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: result is independent of filesystem enumeration order', () => {
  const dir = fixtureTree({ alpha: '{}', beta: '{}', delta: '{}', gamma: '{}' })
  try {
    const permuted = ['gamma', 'alpha', 'delta', 'beta']
    const names = discoverPackages({
      root: dir,
      readdir: () => [...permuted],
    })
    assert.deepEqual(names, ['alpha', 'beta', 'delta', 'gamma'])
    assert.deepEqual(discoverPackages({ root: dir, readdir: () => [...permuted].reverse() }), names)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('discoverPackages: an unreadable tree is a typed discovery error', () => {
  assert.throws(
    () => discoverPackages({ root: join(tmpdir(), 'does-not-exist-fl-ci') }),
    (error) => error instanceof ForemanCiError,
  )
})

// ─── AC2: assignShards contract tests (pure) ───────────────────────────────

test('assignShards: the shard lists partition the input (disjoint; union = input; exactly one shard each)', () => {
  const names = ['alpha', 'beta', 'delta', 'gamma', 'omega']
  const shards = assignShards(names, 3)
  const flat = shards.flat()
  assert.equal(flat.length, names.length)
  assert.deepEqual([...flat].sort(), [...names].sort())
  assert.equal(new Set(flat).size, names.length, 'every package appears exactly once')
})

test('assignShards: per-shard sizes differ by at most 1', () => {
  for (const count of [1, 2, 3, 4]) {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const shards = assignShards(names, count)
    const sizes = shards.map((s) => s.length)
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `sizes ${sizes} for k=${count}`)
  }
})

test('assignShards: round-robin index math is exactly i mod shardCount', () => {
  const names = ['a', 'b', 'c', 'd', 'e']
  const shards = assignShards(names, 2)
  assert.deepEqual(shards, [['a', 'c', 'e'], ['b', 'd']])
})

test('assignShards: repeated calls yield identical layouts (determinism)', () => {
  const names = ['a', 'b', 'c', 'd', 'e', 'f']
  assert.deepEqual(assignShards(names, 4), assignShards(names, 4))
})

test('assignShards: the input is never mutated (permuted pre-state stays permuted)', () => {
  const names = ['a', 'b', 'c']
  const snapshot = [...names]
  assignShards(names, 2)
  assert.deepEqual(names, snapshot)
})

test('assignShards: bounds accept the edges 1 and 4', () => {
  assert.equal(assignShards(['a'], 1).length, 1)
  assert.equal(assignShards(['a', 'b', 'c', 'd'], 4).length, 4)
})

test('assignShards refusal: shardCount 0 and negatives are refused (typed)', () => {
  for (const bad of [0, -1, -4]) {
    assert.throws(() => assignShards(['a'], bad), (e) => e instanceof ForemanCiError)
  }
})

test('assignShards refusal: shardCount above the bound is refused (typed)', () => {
  for (const bad of [5, 100]) {
    assert.throws(() => assignShards(['a'], bad), (e) => e instanceof ForemanCiError)
  }
})

test('assignShards refusal: non-integer counts are refused (typed)', () => {
  for (const bad of [1.5, 2.0001, NaN]) {
    assert.throws(() => assignShards(['a'], bad), (e) => e instanceof ForemanCiError)
  }
})

test('assignShards refusal: non-number counts are refused (typed)', () => {
  for (const bad of ['2', null, undefined, true]) {
    assert.throws(() => assignShards(['a'], bad), (e) => e instanceof ForemanCiError)
  }
})

test('assignShards refusal: duplicate names are refused (typed)', () => {
  assert.throws(
    () => assignShards(['a', 'a'], 2),
    (e) => e instanceof ForemanCiError && /duplicate/.test(e.message),
  )
})

test('assignShards refusal: unsorted input is refused (typed)', () => {
  assert.throws(
    () => assignShards(['b', 'a'], 2),
    (e) => e instanceof ForemanCiError && /sorted/.test(e.message),
  )
})

// ─── AC3: reconcile contract tests (one failing-when-broken per mode) ──────

const DISCOVERED = ['alpha', 'beta', 'delta', 'gamma']
const fixedDiscover = () => [...DISCOVERED]

function happyArtifacts() {
  return [
    artifact(0, 2, [pkg('alpha'), pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
}

function codes(verdict) {
  return verdict.failures.map((f) => f.code)
}

test('reconcile happy path: complete artifacts over the re-derived assignment pass', () => {
  const verdict = reconcile({ root, shardCount: 2, artifacts: happyArtifacts(), discover: fixedDiscover })
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures))
  assert.deepEqual(verdict.discovered, DISCOVERED)
})

test('reconcile failure: omission — a discovered package missing from every artifact fails', () => {
  const artifacts = happyArtifacts()
  artifacts[1].packages = [pkg('beta')]
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('omission'))
})

test('reconcile failure: duplicate across shards fails', () => {
  const artifacts = happyArtifacts()
  artifacts[1].packages = [pkg('beta'), pkg('gamma'), pkg('alpha')]
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('duplicate'))
})

test('reconcile failure: duplicate within one shard fails', () => {
  const artifacts = happyArtifacts()
  artifacts[0].packages = [pkg('alpha'), pkg('alpha'), pkg('delta')]
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('duplicate'))
})

test('reconcile failure: a foreign identity fails', () => {
  const artifacts = happyArtifacts()
  artifacts[0].packages.push(pkg('evil'))
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('foreign-identity'))
})

test('reconcile failure: an unexpected skip fails (EXPECTED_SKIPS is empty)', () => {
  assert.deepEqual(EXPECTED_SKIPS, [])
  const artifacts = happyArtifacts()
  artifacts[1].packages[0].checks.test = 'skipped'
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('unexpected-skip'))
})

test('reconcile failure: a missing artifact (cancellation) fails', () => {
  const verdict = reconcile({ root, shardCount: 2, artifacts: [happyArtifacts()[0]], discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('missing-artifact'))
  assert.ok(codes(verdict).includes('artifact-count-mismatch'))
})

test('reconcile failure: an artifact-count mismatch fails', () => {
  const artifacts = [...happyArtifacts(), artifact(0, 2, [pkg('alpha'), pkg('delta')])]
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('artifact-count-mismatch'))
})

test('reconcile failure: assignment drift fails', () => {
  const artifacts = [
    artifact(0, 2, [pkg('alpha')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma'), pkg('delta')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.deepEqual([...new Set(codes(verdict))], ['assignment-drift'])
})

test('reconcile failure: any fail check fails the verdict', () => {
  const artifacts = happyArtifacts()
  artifacts[0].packages[0].checks.test = 'fail'
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('shard-fail'))
})

test('reconcile failure: any error check fails the verdict', () => {
  const artifacts = happyArtifacts()
  artifacts[0].packages[0].checks.test = 'error'
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('shard-error'))
})

test('reconcile failure: missing check entries fail', () => {
  const artifacts = happyArtifacts()
  delete artifacts[0].packages[0].checks.typecheck
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('missing-checks'))
})

test('reconcile failure: a discovery error fails the verdict', () => {
  const verdict = reconcile({
    root,
    shardCount: 2,
    artifacts: happyArtifacts(),
    discover: () => {
      throw new ForemanCiError('Discovery error: unparseable manifest in broken')
    },
  })
  assert.equal(verdict.ok, false)
  assert.deepEqual(codes(verdict), ['discovery-error'])
})

test('reconcile failure: a schema-invalid artifact fails', () => {
  const artifacts = happyArtifacts()
  artifacts[0].schema = 'foreman-line-ci/shard-outcomes@0'
  const verdict = reconcile({ root, shardCount: 2, artifacts, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('schema-invalid'))
})

// ─── A2 placement 9: reconcile verifies run-then-waive ─────────────────────

const waiverFixtures = [PINNED]

function waivedPackage(name, location, markers) {
  const pin = PINNED.checks.test
  const record = pkg(name, { ...passChecks(), test: 'waived' }, [
    {
      check: 'test',
      markers_matched: markers,
      counts_verified: { 'PIN-MARKER-A': 2, 'PIN-MARKER-B': 1 },
      fail_total: 3,
      failing_set: ['failing one', 'failing two', 'flaky member'],
      output_sha256: 'c'.repeat(64),
    },
  ])
  record.location = location
  return record
}

test('reconcile waiver: an exact three-axis waived entry with exact pinned markers passes', () => {
  const artifacts = [
    artifact(0, 2, [waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B']), pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, true, JSON.stringify(verdict.failures))
})

test('reconcile waiver: a non-matching value is NOT waived (waiver-mismatch)', () => {
  const artifacts = [
    artifact(0, 2, [waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['SOMETHING-ELSE']), pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('reconcile waiver: a wrong location is NOT waived (waiver-mismatch)', () => {
  const artifacts = [
    artifact(0, 2, [waivedPackage('alpha', 'plugins/foreman-line/elsewhere/', ['PIN-MARKER-A', 'PIN-MARKER-B']), pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('reconcile waiver: a waived package outside the set fails the gate', () => {
  const artifacts = [
    artifact(0, 2, [pkg('alpha'), pkg('delta')]),
    artifact(1, 2, [waivedPackage('beta', 'plugins/foreman-line/beta/', ['PIN-MARKER-A', 'PIN-MARKER-B']), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('reconcile waiver: a wrong fail_total in the record fails (R9)', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].fail_total = 999
  const artifacts = [
    artifact(0, 2, [pkgRecord, pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('reconcile waiver: wrong counts_verified in the record fails (R9)', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].counts_verified = { 'PIN-MARKER-A': 7 }
  const artifacts = [
    artifact(0, 2, [pkgRecord, pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('reconcile waiver: a wrong failing_set in the record fails (R7 record check)', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].failing_set = ['failing one', 'an intruder']
  const artifacts = [
    artifact(0, 2, [pkgRecord, pkg('delta')]),
    artifact(1, 2, [pkg('beta'), pkg('gamma')]),
  ]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('the shipped WAIVED_EXCLUSIONS bind identity + location + value for every ratified entry', () => {
  assert.equal(WAIVED_EXCLUSIONS.length, 4)
  for (const entry of WAIVED_EXCLUSIONS) {
    assert.equal(typeof entry.identity, 'string')
    assert.equal(entry.location, `plugins/foreman-line/${entry.identity}/`)
    assert.ok(Object.keys(entry.checks).length >= 1)
    for (const [check, pin] of Object.entries(entry.checks)) {
      // shape v3 well-formedness (the R7 value layers); markers may be empty
      // only when the failing-set identity carries the value axis (R15)
      assert.ok(pin.markers.length >= 1 || pin.failingSet.length + pin.flaky.length > 0)
      assert.equal(typeof pin.counts, 'object')
      assert.ok(Array.isArray(pin.failTotal) && pin.failTotal.length === 2)
      assert.ok(Array.isArray(pin.failingSet))
      assert.ok(Array.isArray(pin.flaky))
      if (check === 'test') {
        assert.ok(pin.failingSet.length + pin.flaky.length > 0, `${entry.identity}/test needs a pinned failing universe`)
      }
      // positive control: an output carrying exactly the pinned value waives —
      // the measured variance closure: flaky present AND flaky absent
      const build = (names, total, extraLines = []) => [
        ...Object.entries(pin.counts).flatMap(([needle, n]) => Array(n).fill(needle)),
        ...pin.markers.filter((m) => !(m in pin.counts)),
        ...names.map((n) => `\u2716 ${n} (1.0ms)`),
        ...extraLines,
        `\u2139 fail ${total}`,
      ].join('\n')
      for (const withFlaky of [true, false]) {
        const names = withFlaky ? [...pin.failingSet, ...pin.flaky] : [...pin.failingSet]
        const total = pin.failTotal[withFlaky ? 1 : 0]
        const w = waiverFor(entry.identity, entry.location, check, build(names, total), WAIVED_EXCLUSIONS)
        assert.ok(w !== null, `${entry.identity}/${check} flaky=${withFlaky}`)
        assert.deepEqual(w.markers_matched, pin.markers)
        assert.equal(w.fail_total, total)
      }
      // every layer binds on its own:
      // 1. a NEW failing name never waives
      const withNew = build([...pin.failingSet, ...pin.flaky], pin.failTotal[1], ['\u2716 intruder failure (1.0ms)'])
      assert.equal(waiverFor(entry.identity, entry.location, check, withNew, WAIVED_EXCLUSIONS), null, `${entry.identity}/${check} new-name`)
      // 2. a missing deterministic member re-gates (total kept in variance so
      //    the SET check is what rejects)
      if (pin.failingSet.length > 0) {
        const missingOne = build(pin.failingSet.slice(1), Math.min(pin.failTotal[1], pin.failingSet.length - 1 + pin.flaky.length))
        assert.equal(waiverFor(entry.identity, entry.location, check, missingOne, WAIVED_EXCLUSIONS), null, `${entry.identity}/${check} missing-deterministic`)
      }
      // 3. count drift on any counted literal re-gates
      for (const needle of Object.keys(pin.counts)) {
        const base = build([...pin.failingSet, ...pin.flaky], pin.failTotal[1])
        assert.equal(waiverFor(entry.identity, entry.location, check, `${base}\n${needle}`, WAIVED_EXCLUSIONS), null, `${entry.identity}/${check} count-drift ${needle}`)
      }
      // 4. a presence marker missing re-gates
      for (const m of pin.markers.filter((m) => !(m in pin.counts))) {
        const without = build([...pin.failingSet, ...pin.flaky], pin.failTotal[1]).split(m).join('')
        assert.equal(waiverFor(entry.identity, entry.location, check, without, WAIVED_EXCLUSIONS), null, `${entry.identity}/${check} missing-marker ${m}`)
      }
    }
  }
})

// ─── R1: effective decision resolution — NO fallthrough, fail closed ───────

test('R1: decide reuse + verify success/reuse resolves reuse (the only green reuse path)', () => {
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'success', verifyOutput: 'reuse' }), 'reuse')
})

test('R1: a verify flip resolves fallback (verify owns the reuse branch)', () => {
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'success', verifyOutput: 'fallback' }), 'fallback')
})

test('R1: a CRASHED verify resolves fallback — never decide reuse (reviewers probe)', () => {
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'failure', verifyOutput: undefined }), 'fallback')
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'cancelled', verifyOutput: '' }), 'fallback')
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'timed_out', verifyOutput: '' }), 'fallback')
})

test('R1: an EMPTY verify output resolves fallback even when the step exits success (no fallthrough)', () => {
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'success', verifyOutput: '' }), 'fallback')
  assert.equal(effectiveDecision({ decide: 'reuse', verifyConclusion: 'success', verifyOutput: undefined }), 'fallback')
})

test('R1: decide fallback passes through; absent/garbage decide resolves empty (fail closed downstream)', () => {
  assert.equal(effectiveDecision({ decide: 'fallback', verifyConclusion: 'skipped', verifyOutput: undefined }), 'fallback')
  assert.equal(effectiveDecision({ decide: '', verifyConclusion: 'skipped', verifyOutput: undefined }), '')
  assert.equal(effectiveDecision({ decide: 'garbage', verifyConclusion: 'success', verifyOutput: 'reuse' }), '')
})

// ─── R1 layer 2: the aggregation fails closed unless the gate succeeded ────

test('R1: a gate FAILURE is a red verdict even with decision reuse and a clean reconcile (a failed verify can never green)', () => {
  for (const gateResult of ['failure', 'cancelled', 'skipped', '']) {
    const v = verdict({ gateResult, decision: 'reuse', reconcileResult: { ok: true } })
    assert.equal(v.ok, false, `gateResult=${gateResult}`)
    assert.equal(v.code, 'gate-failed')
    const v2 = verdict({ gateResult, decision: 'fallback', reconcileResult: { ok: true } })
    assert.equal(v2.ok, false, `gateResult=${gateResult} fallback`)
  }
})

test('R1: gate success + reuse is green from the evidence verdict', () => {
  const v = verdict({ gateResult: 'success', decision: 'reuse', reconcileResult: { ok: true } })
  assert.equal(v.ok, true)
  assert.equal(v.code, 'reuse-verdict')
})

test('R1: gate success + fallback binds the reconciliation result', () => {
  assert.equal(verdict({ gateResult: 'success', decision: 'fallback', reconcileResult: { ok: true } }).ok, true)
  const bad = verdict({ gateResult: 'success', decision: 'fallback', reconcileResult: { ok: false, failures: [] } })
  assert.equal(bad.ok, false)
  assert.equal(bad.code, 'aggregate-failed')
})

test('R1: an unknown/absent effective decision is never green', () => {
  assert.equal(verdict({ gateResult: 'success', decision: '', reconcileResult: { ok: true } }).ok, false)
  assert.equal(verdict({ gateResult: 'success', decision: 'reuse?', reconcileResult: { ok: true } }).ok, false)
})

test('R1 CLI: aggregate is the single verdict authority (reuse/fallback/unknown all resolve there)', async () => {
  const out = []
  const emptyDir = mkdtempSync(join(tmpdir(), 'fl-agg-empty-'))
  try {
    const env = { GATE_RESULT: 'success', DECISION: 'reuse' }
    assert.equal(await runCli(['aggregate', '4', emptyDir], env, { stdout: (t) => out.push(t) }), 0)
    assert.equal(await runCli(['aggregate', '4', emptyDir], { ...env, DECISION: 'fallback' }, { stdout: (t) => out.push(t) }), 1)
    assert.equal(await runCli(['aggregate', '4', emptyDir], { ...env, DECISION: '' }, { stdout: (t) => out.push(t) }), 1)
    assert.equal(
      await runCli(['aggregate', '4', emptyDir], { GATE_RESULT: 'failure', DECISION: 'reuse' }, { stdout: (t) => out.push(t) }),
      1,
      'gate failure reds even the reuse branch',
    )
  } finally {
    rmSync(emptyDir, { recursive: true, force: true })
  }
})

// ─── R1 + R6: the resolve step output (no fallthrough; one shard source) ───

test('R1/R6 CLI: resolve writes the effective decision (no fallthrough) and derives the shard layout from MAX_SHARDS', async () => {
  const target = join(tmpdir(), `fl-resolve-${process.pid}.out`)
  writeFileSync(target, '')
  try {
    const code = await runCli(['resolve'], {
      GITHUB_OUTPUT: target,
      DECIDE_DECISION: 'reuse',
      VERIFY_CONCLUSION: 'failure',
      VERIFY_DECISION: '',
    }, { stdout: () => {} })
    assert.equal(code, 0)
    const written = readFileSync(target, 'utf8')
    assert.ok(written.includes('decision=fallback'), 'crashed verify resolves fallback, never decide reuse')
    assert.ok(written.includes(`shard_count=${MAX_SHARDS}`))
    assert.ok(written.includes(`shards=${JSON.stringify(Array.from({ length: MAX_SHARDS }, (_, i) => i))}`))
  } finally {
    rmSync(target, { force: true })
  }
})

// ─── R4: discovery fail-closed (never vacuous green) ───────────────────────

test('R4: a non-ENOENT stat failure is a typed discovery error (EACCES is NOT a non-package)', () => {
  const dir = fixtureTree({ alpha: '{}' })
  try {
    assert.throws(
      () => discoverPackages({
        root: dir,
        stat: () => {
          const err = new Error('permission denied')
          err.code = 'EACCES'
          throw err
        },
      }),
      (e) => e instanceof ForemanCiError && /unstatable entry/.test(e.message),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('R4: zero discovered packages is a discovery error, never a green vacuous pass', () => {
  const dir = fixtureTree({ docs: null, empty: null })
  try {
    assert.throws(
      () => discoverPackages({ root: dir }),
      (e) => e instanceof ForemanCiError && /no packages found/.test(e.message),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('R4: reconcile refuses an empty discovered set (empty-artifacts path included)', () => {
  const verdictEmpty = reconcile({ root, shardCount: 2, artifacts: [], discover: () => [] })
  assert.equal(verdictEmpty.ok, false)
  assert.deepEqual(codes(verdictEmpty), ['discovery-error'])
})

// ─── R6: one shard-count source, wired through the workflow ────────────────

test('R6 wiring: the workflow derives the matrix and both arguments from the single gate source (no second constant)', () => {
  const workflowPath = fileURLToPath(new URL('../.github/workflows/foreman-line-ci.yml', import.meta.url))
  const text = readFileSync(workflowPath, 'utf8')
  assert.ok(!text.includes('SHARD_COUNT'), 'the dead SHARD_COUNT env is gone')
  assert.ok(!/matrix:\s*\n\s*shard: \[/.test(text), 'no literal shard matrix')
  assert.ok(text.includes('shard: ${{ fromJSON(needs.gate.outputs.shards) }}'), 'matrix derives from the gate source')
  assert.equal(text.split('${{ needs.gate.outputs.shard_count }}').length - 1, 2, 'both arguments derive from the gate source')
})

// ─── sweep: a legitimately empty shard is not a failure ────────────────────

test('sweep edge: when discovered < shardCount, empty shards pass reconciliation', () => {
  const artifacts = [artifact(0, 4, [pkg('alpha')]), artifact(1, 4, [pkg('beta')]), artifact(2, 4, []), artifact(3, 4, [])]
  const v = reconcile({ root, shardCount: 4, artifacts, discover: () => ['alpha', 'beta'] })
  assert.equal(v.ok, true, JSON.stringify(v.failures))
})

// ─── R8: the R1 workflow wiring pinned as TEXT (the round-1 blocker surface) ─

test('R8 wiring: gate outputs read steps.effective.outputs with NO || fallthrough', () => {
  const workflowPath = fileURLToPath(new URL('../.github/workflows/foreman-line-ci.yml', import.meta.url))
  const text = readFileSync(workflowPath, 'utf8')
  const gateOutputsBlock = text.slice(text.indexOf('    outputs:'), text.indexOf('    steps:'))
  assert.ok(gateOutputsBlock.includes('decision: ${{ steps.effective.outputs.decision }}'))
  assert.ok(!gateOutputsBlock.includes('||'), 'no || fallthrough may remain in the gate outputs')
  assert.ok(!/verify\.outputs\.decision\s*\|\|/.test(text))
})

test('R8 wiring: GATE_RESULT and VERIFY_CONCLUSION come from the contexts, never literals', () => {
  const workflowPath = fileURLToPath(new URL('../.github/workflows/foreman-line-ci.yml', import.meta.url))
  const text = readFileSync(workflowPath, 'utf8')
  assert.ok(text.includes('GATE_RESULT: ${{ needs.gate.result }}'), 'aggregate binds needs.gate.result')
  assert.ok(text.includes('VERIFY_CONCLUSION: ${{ steps.verify.conclusion }}'), 'resolve binds the verify conclusion')
  assert.ok(!text.includes("VERIFY_CONCLUSION: 'success'"), 'no hard-coded conclusion')
  assert.ok(!text.includes("GATE_RESULT: 'success'"), 'no hard-coded gate result')
})

test('R8 wiring: resolve runs unless cancelled and the aggregate step runs unless cancelled', () => {
  const workflowPath = fileURLToPath(new URL('../.github/workflows/foreman-line-ci.yml', import.meta.url))
  const text = readFileSync(workflowPath, 'utf8')
  const resolveAt = text.indexOf('id: effective')
  assert.ok(resolveAt > 0)
  const resolveIf = text.slice(resolveAt, resolveAt + 400)
  assert.ok(resolveIf.includes("if: ${{ !cancelled() }}"), 'resolve step runs unless cancelled')
  const aggregateAt = text.indexOf('node scripts/foreman-line-ci.mjs aggregate')
  const aggregateStepStart = text.lastIndexOf('      - name:', aggregateAt)
  const aggregateStep = text.slice(aggregateStepStart, aggregateAt)
  assert.ok(aggregateStep.includes("if: ${{ !cancelled() }}"), 'the verdict step runs unless cancelled')
})

// ─── R7: failing-name parser (TAP + spec; names untrusted) ─────────────────

test('R7 parser: TAP `not ok … - name` and spec `✖ name` lines yield the failing set', () => {
  const tap = [
    'TAP version 13',
    'not ok 1 - alpha breaks here',
    'not ok 2 - beta breaks here',
    '# fail 2',
  ].join('\n')
  assert.deepEqual(failingTestNames(tap), ['alpha breaks here', 'beta breaks here'])
  const spec = [
    '\u2716 alpha breaks here (12.5ms)',
    '\u2716 beta breaks here (1.20s)',
    '\u2139 fail 2',
  ].join('\n')
  assert.deepEqual(failingTestNames(spec), ['alpha breaks here', 'beta breaks here'])
  // the spec reporter section marker is not a name; names are de-duplicated
  const dupe = '\u2716 failing tests:\n\u2716 alpha breaks here (1ms)\n\u2716 alpha breaks here (1ms)\n'
  assert.deepEqual(failingTestNames(dupe), ['alpha breaks here'])
  // hostile names are sanitized (SC #4/#5) and never carry protocol delimiters
  const hostile = 'not ok 1 - evil\n::error::injected name\nnot ok 2 - plain name'
  for (const name of failingTestNames(hostile)) {
    assert.equal(name.includes('::'), false)
    assert.equal(/[\u0000-\u001F]/.test(name), false)
  }
})

// ─── R10: lstat-first discovery (dangling junction is a discovery error) ──

test('R10: an entry that lstats but fails stat (dangling junction) is a typed discovery error', () => {
  const dir = fixtureTree({ alpha: '{}' })
  try {
    assert.throws(
      () => discoverPackages({
        root: dir,
        lstat: () => ({ isDirectory: () => true }),
        stat: () => {
          const err = new Error('ENOENT on the junction target')
          err.code = 'ENOENT'
          throw err
        },
      }),
      (e) => e instanceof ForemanCiError && /unstatable entry/.test(e.message),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('R10: an entry that fails lstat with ENOENT is a vanished non-package (skipped, not an error)', () => {
  const dir = fixtureTree({ alpha: '{}', beta: '{}' })
  try {
    const names = discoverPackages({
      root: dir,
      lstat: (p) => {
        if (p.endsWith('alpha')) {
          const err = new Error('vanished')
          err.code = 'ENOENT'
          throw err
        }
        return lstatSync(p)
      },
    })
    assert.deepEqual(names, ['beta'], 'the vanished entry is skipped silently; discovery is not an error')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── R9: golden fixtures of REAL captured outputs (measured values pinned
// literally — the value axis is independently bound, ready for the
// placement-10 alignment edit) ─────────────────────────────────────────────

// Golden SPEC-reporter excerpt — verbatim lines from the measured
// jev-decisions/test capture (node 24.19.0, 2026-10-01).
const GOLDEN_SPEC = [
  '✖ missing credential refuses before the synthetic transport opens (2.2331ms)',
  '✖ malformed provider and transport results fail closed (0.6959ms)',
  '✖ timeout and lease refusal never permit a live call (0.5281ms)',
  '✖ provider cost above the hard cap becomes a bounded hold (0.5805ms)',
  '✖ redirect and unverified TLS authorities are rejected (0.5406ms)',
  '✖ synthetic success returns a redacted observation and never discloses the credential (0.5426ms)',
  'ℹ tests 47',
  'ℹ pass 41',
  'ℹ fail 6',
  '✖ failing tests:',
  '✖ missing credential refuses before the synthetic transport opens (2.2331ms)',
  '✖ malformed provider and transport results fail closed (0.6959ms)',
  '✖ timeout and lease refusal never permit a live call (0.5281ms)',
  '✖ provider cost above the hard cap becomes a bounded hold (0.5805ms)',
  '✖ redirect and unverified TLS authorities are rejected (0.5406ms)',
  '✖ synthetic success returns a redacted observation and never discloses the credential (0.5426ms)',
].join('\n')

test('R9 golden: the spec-reporter fixture parses to the measured failing set and the ℹ-fail total literally', () => {
  assert.deepEqual(failingTestNames(GOLDEN_SPEC), [
    'malformed provider and transport results fail closed',
    'missing credential refuses before the synthetic transport opens',
    'provider cost above the hard cap becomes a bounded hold',
    'redirect and unverified TLS authorities are rejected',
    'synthetic success returns a redacted observation and never discloses the credential',
    'timeout and lease refusal never permit a live call',
  ])
  assert.equal(sumFailTotals(GOLDEN_SPEC), 6, 'the ℹ fail N branch (the real node-24 format) is covered')
})

// Golden TAP fixture — the VERBATIM captured output lines of a real
// authority-registry/test run at node 24.19.0 (2026-10-01; re-captured for
// this fixture). These are literal capture bytes: the real `not ok … - name`
// lines (30), the real multi-stream `# tests/# pass/# fail` summary lines, and
// the real marker lines (the R31 drift error and the MIGRATION code subtest).
// Nothing here is invented. It must feed the shipped authority-registry pin
// (below) and every perturbation of it must fail.
const GOLDEN_TAP = [
  'not ok 9 - shipped registry sweeps the complete pinned corpus with no gaps or conflicts',
  'not ok 18 - unrelated bytes outside every registered locator stay green',
  'not ok 33 - multiple corpus violations are deterministically ordered by path, locator, rule, then code',
  'not ok 34 - R5 Markdown numbered-item locators survive physical line wrapping',
  'not ok 36 - R5 fenced Markdown prose cannot impersonate a live authority binding',
  'not ok 47 - R5 TypeScript semantic inventory ignores benign comment changes',
  'not ok 48 - R5 TypeScript semantic inventory ignores benign whitespace changes',
  'not ok 49 - R5 TypeScript semantic inventory ignores benign import-order changes',
  'not ok 54 - R6 comment-only Markdown remains non-operative',
  'not ok 58 - R6 additive TypeScript type-only import remains non-operative',
  'not ok 63 - R9 valid fenced standing-constraint number is ignored by the shared Markdown map',
  'not ok 64 - R8 valid fenced heading is ignored by every Markdown discovery layer',
  'not ok 65 - R8 valid fenced D row is ignored by every Markdown discovery layer',
  'not ok 66 - R8 valid fenced R row is ignored by every Markdown discovery layer',
  'not ok 67 - R8 valid fenced numbered hard rule is ignored by every Markdown discovery layer',
  'not ok 68 - R7 mixed fence delimiters do not close a correctly paired fence',
  'not ok 69 - R7 mixed type and value import order is semantically stable',
  'not ok 70 - R7 ambient declarations remain non-operative',
  'not ok 113 - R14 an added heading stays inert while a paragraph beneath it does not',
  'not ok 117 - R27 control (a) volatile appends and byte changes preserve the sweep and governed siblings',
  'not ok 124 - R27 control (e) generator output is byte-identical under mutation of every volatile region',
  'not ok 138 - R31 approved annotation and thesis have distinct source-bound identities',
  'not ok 139 - R31 actual M01 source rejects parcel condition mutation',
  'not ok 140 - R31 actual M01 source rejects living identifier mutation',
  'not ok 141 - R31 actual M01 source rejects marketplace entry mutation',
  'not ok 142 - R31 actual M01 source rejects source existence mutation',
  'not ok 143 - R31 actual M01 source rejects nested manifest equality mutation',
  'not ok 144 - R31 actual M01 source rejects URL insufficiency mutation',
  'not ok 146 - R31 source-bound aliases reject displaced or substituted historical note and thesis',
  'not ok 4 - CLI validate and sweep return exit 0 with machine-readable summaries',
  '# tests 1',
  '# pass 1',
  '# fail 0',
  '# tests 148',
  '# pass 119',
  '# fail 29',
  '# tests 1',
  '# pass 1',
  '# fail 0',
  '# tests 5',
  '# pass 5',
  '# fail 0',
  '# tests 23',
  '# pass 22',
  '# fail 1',
  '# tests 574',
  '# pass 574',
  '# fail 0',
  '# Error: R31 reviewed source mapping drift: M02-note',
  '# Subtest: reject-stale-binding-digest rejects with MIGRATION_EVIDENCE_INVALID',
].join('\n')

test('R12 golden: the TAP fixture is the verbatim capture — 30 real names and the real multi-stream sum', () => {
  assert.deepEqual(failingTestNames(GOLDEN_TAP), [
    'CLI validate and sweep return exit 0 with machine-readable summaries',
    'R14 an added heading stays inert while a paragraph beneath it does not',
    'R27 control (a) volatile appends and byte changes preserve the sweep and governed siblings',
    'R27 control (e) generator output is byte-identical under mutation of every volatile region',
    'R31 actual M01 source rejects URL insufficiency mutation',
    'R31 actual M01 source rejects living identifier mutation',
    'R31 actual M01 source rejects marketplace entry mutation',
    'R31 actual M01 source rejects nested manifest equality mutation',
    'R31 actual M01 source rejects parcel condition mutation',
    'R31 actual M01 source rejects source existence mutation',
    'R31 approved annotation and thesis have distinct source-bound identities',
    'R31 source-bound aliases reject displaced or substituted historical note and thesis',
    'R5 Markdown numbered-item locators survive physical line wrapping',
    'R5 TypeScript semantic inventory ignores benign comment changes',
    'R5 TypeScript semantic inventory ignores benign import-order changes',
    'R5 TypeScript semantic inventory ignores benign whitespace changes',
    'R5 fenced Markdown prose cannot impersonate a live authority binding',
    'R6 additive TypeScript type-only import remains non-operative',
    'R6 comment-only Markdown remains non-operative',
    'R7 ambient declarations remain non-operative',
    'R7 mixed fence delimiters do not close a correctly paired fence',
    'R7 mixed type and value import order is semantically stable',
    'R8 valid fenced D row is ignored by every Markdown discovery layer',
    'R8 valid fenced R row is ignored by every Markdown discovery layer',
    'R8 valid fenced heading is ignored by every Markdown discovery layer',
    'R8 valid fenced numbered hard rule is ignored by every Markdown discovery layer',
    'R9 valid fenced standing-constraint number is ignored by the shared Markdown map',
    'multiple corpus violations are deterministically ordered by path, locator, rule, then code',
    'shipped registry sweeps the complete pinned corpus with no gaps or conflicts',
    'unrelated bytes outside every registered locator stay green',
  ])
  assert.equal(sumFailTotals(GOLDEN_TAP), 30, 'the real multi-stream sums (0 + 29 + 0 + 0 + 1 + 0)')
})

test('R12 golden: the verbatim capture FEEDS the shipped authority-registry pin (and perturbations fail)', () => {
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'authority-registry')
  const w = waiverFor('authority-registry', 'plugins/foreman-line/authority-registry/', 'test', GOLDEN_TAP, [entry])
  assert.ok(w !== null, 'the real capture waives under the shipped pin')
  assert.equal(w.fail_total, 30)
  assert.equal(w.failing_set.length, 30)
  // perturbation 1: drop one name line (missing deterministic member)
  const dropped = GOLDEN_TAP.split('\n').filter((l) => !l.startsWith('not ok 9 - ')).join('\n')
  assert.equal(waiverFor('authority-registry', 'plugins/foreman-line/authority-registry/', 'test', dropped, [entry]), null)
  // perturbation 2: add an intruder failure name
  const intruder = `${GOLDEN_TAP}\nnot ok 999 - an intruder failure appears`
  assert.equal(waiverFor('authority-registry', 'plugins/foreman-line/authority-registry/', 'test', intruder, [entry]), null)
  // perturbation 3: bump a declared summary (equality + range both reject)
  const bumped = `${GOLDEN_TAP}\n# fail 1`
  assert.equal(waiverFor('authority-registry', 'plugins/foreman-line/authority-registry/', 'test', bumped, [entry]), null)
})

test('R9: the value axis is independently pinned — golden values do not derive from WAIVED_EXCLUSIONS', () => {
  // the golden's measured values are asserted literally above; the failure
  // detail lines below are the real `code:` lines carrying the pinned marker
  // (6 occurrences, one per failure block, as measured). The shipped pin must
  // accept the measured golden output itself — the golden stands alone if the
  // pin is later edited by the placement-10 alignment.
  const measured = [
    ...Array(6).fill("    code: 'LEGACY_EXECUTION_RETIRED'"),
    GOLDEN_SPEC,
  ].join('\n')
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'jev-decisions')
  const w = waiverFor('jev-decisions', 'plugins/foreman-line/jev-decisions/', 'test', measured, [entry])
  assert.ok(w !== null, 'the measured golden output waives under the shipped pin')
  assert.equal(w.fail_total, 6)
})

// ─── R11: the measured equality closes the slack exploit ──────────────────
// Invariant (measured, >=10 runs per check): whenever failing names parse,
// the declared failure total === the number of DISTINCT failing names.

test('R11: a duplicate of a pinned title never waives (the equality, inside the range slack)', () => {
  // flaky out (distinct 2) + a NEW failure titled exactly like a pinned one:
  // the name set dedups unchanged, the declared total becomes 3 — INSIDE the
  // pinned [2,3] slack — only the equality re-gates
  const out = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 3, dupName: 'failing one' })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
})

test('R11: a test named like the reporter marker never waives (the equality)', () => {
  // '✖ failing tests: (1.0ms)' is not a name (the section marker is filtered)
  // but its failure counts in the total -> sum 3 vs distinct 2 -> re-gate
  const out = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 3, extraLines: ['\u2716 failing tests: (1.0ms)'] })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
})

test('R11: a control-char variant of a pinned name never waives (sanitize-collide or set-reject)', () => {
  // the variant sanitizes onto the pinned name -> dedup -> sum 3 vs distinct 2
  const out = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 3, extraLines: ['\u2716 failing\u0000one (1.0ms)'] })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out, [PINNED]), null)
  // a variant that sanitizes OUTSIDE the set is rejected by the set rules
  const out2 = pinnedOutput(PINNED.checks.test, { extraNames: ['failing\u0000three'], total: 4 })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', out2, [PINNED]), null)
})

test('R11: the equality holds at both measured ends (flaky out and in)', () => {
  const flakyOut = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 2 })
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', flakyOut, [PINNED]) !== null, 'sum 2 === |distinct 2|')
  const flakyIn = pinnedOutput(PINNED.checks.test, { total: 3 })
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', flakyIn, [PINNED]) !== null, 'sum 3 === |distinct 3|')
  // a nameless bump inside the range slack violates the equality
  const bump = pinnedOutput(PINNED.checks.test, { omitNames: ['flaky member'], total: 3, extraLines: ['some nameless noise line'] })
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', bump, [PINNED]), null)
})

test('R11: where NO failing names parse, the total range is the sole guard (named path)', () => {
  // the tsc/biome shape: markers + totals only, no name lines at all
  const pin = {
    markers: ['TS2353'],
    counts: { 'error TS': 2 },
    failTotal: [0, 0],
    failingSet: [],
    flaky: [],
  }
  const entry = { identity: 'alpha', location: 'plugins/foreman-line/alpha/', checks: { typecheck: pin } }
  const out = 'TS2353 TS2353\nerror TS\nerror TS\n'
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'typecheck', out, [entry]) !== null, 'the range-only path waives within measurement')
  // a declared total outside the tight range re-gates on the range alone
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'typecheck', `${out}\n\u2139 fail 1\n`, [entry]), null)
  // a single unparseable name line engages the equality (0 names vs 1 total)
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'typecheck', `${out}\n\u2716 some failure (1ms)\n`, [entry]), null)
})

// ─── R13: restored test sides (the round-3 survivors all bind) ─────────────

test('R13: fewer-than-pinned occurrences re-gate (both directions bound)', () => {
  // one PIN-MARKER-A instead of the pinned two, marker still present
  const fewer = [
    'PIN-MARKER-A',
    'PIN-MARKER-B',
    ...[...PINNED.checks.test.failingSet, ...PINNED.checks.test.flaky].map((n) => `\u2716 ${n} (1.0ms)`),
    '\u2139 fail 3',
  ].join('\n')
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', fewer, [PINNED]), null)
  // and the extra direction stays bound
  const more = `${pinnedOutput(PINNED.checks.test, { total: 3 })}\nPIN-MARKER-A`
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', more, [PINNED]), null)
})

test('R13 reconcile: counts_verified with right KEYS but wrong VALUES fails', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].counts_verified = { 'PIN-MARKER-A': 2, 'PIN-MARKER-B': 7 }
  const artifacts = [artifact(0, 2, [pkgRecord, pkg('delta')]), artifact(1, 2, [pkg('beta'), pkg('gamma')])]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('R13 reconcile: fail_total BELOW the lower bound fails (both bounds bound)', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].fail_total = 1
  const artifacts = [artifact(0, 2, [pkgRecord, pkg('delta')]), artifact(1, 2, [pkg('beta'), pkg('gamma')])]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('R13 reconcile: a failing_set MISSING a deterministic member fails (both set halves bound)', () => {
  const pkgRecord = waivedPackage('alpha', 'plugins/foreman-line/alpha/', ['PIN-MARKER-A', 'PIN-MARKER-B'])
  pkgRecord.waivers[0].failing_set = ['failing one']
  const artifacts = [artifact(0, 2, [pkgRecord, pkg('delta')]), artifact(1, 2, [pkg('beta'), pkg('gamma')])]
  const verdict = reconcile({ root, shardCount: 2, artifacts, waivers: waiverFixtures, discover: fixedDiscover })
  assert.equal(verdict.ok, false)
  assert.ok(codes(verdict).includes('waiver-mismatch'))
})

test('R13: the hostile-name fixture is a real failing-NAME line and sanitizeField is exercised', () => {
  // the name line itself carries the hostility (control chars, ::, bidi)
  const hostile = 'not ok 1 - evil\u0000name with ::error:: and \u202Eoverride'
  const parsed = failingTestNames(hostile)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].includes('::'), false, 'the protocol delimiter is neutralized')
  assert.equal(/[\u0000-\u001F\u007F]/.test(parsed[0]), false, 'control chars are stripped')
  assert.equal(/[\u202A-\u202E\u2066-\u2069]/.test(parsed[0]), false, 'bidi overrides are neutralized')
  assert.ok(parsed[0].startsWith('evil name with : :error'), 'the sanitized shape is deterministic')
})

// ─── R14: the CI-era flake universes (variance-base correction) ────────────

test('R14: kernel-lease flake combinations all waive (75..80 = the named-flake closure)', () => {
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'kernel-lease')
  const pin = entry.checks.test
  assert.equal(pin.failingSet.length, 75)
  assert.deepEqual(pin.flaky.map((n) => n.slice(0, 5)).sort(), ['CN-01', 'CN-02', 'CN-03', 'CN-04', 'CN-05'])
  assert.deepEqual(pin.failTotal, [75, 80])
  // every combination of the three originally-measured flakes stays waivable
  for (let mask = 0; mask < 8; mask += 1) {
    const present = [pin.flaky[0], pin.flaky[1], pin.flaky[4]].filter((_, i) => (mask >> i) % 2 === 1)
    const names = [...pin.failingSet, ...present]
    const out = `${names.map((n) => `\u2716 ${n} (1.0ms)`).join('\n')}\n\u2139 fail ${names.length}\n`
    const w = waiverFor(entry.identity, entry.location, 'test', out, [entry])
    assert.ok(w !== null, `mask ${mask} (${present.length} flakes in) must waive`)
    assert.equal(w.fail_total, names.length)
  }
})

test('R14: an unmeasured failure identity in the kernel era still refuses (intruder)', () => {
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'kernel-lease')
  const pin = entry.checks.test
  const names = [...pin.failingSet, ...pin.flaky, 'CN-99 an unmeasured race appears']
  const out = `${names.map((n) => `\u2716 ${n} (1.0ms)`).join('\n')}\n\u2139 fail ${names.length}\n`
  assert.equal(waiverFor(entry.identity, entry.location, 'test', out, [entry]), null)
})

test('R15: cross-environment-unstable markers are dropped; names carry the axis', () => {
  const kernel = WAIVED_EXCLUSIONS.find((e) => e.identity === 'kernel-lease').checks.test
  assert.deepEqual(kernel.markers, [], 'the local-only error-text markers are gone (CI fails with a different class)')
  assert.ok(kernel.failingSet.length > 0, 'the failing-set identity carries the value axis')
  const authority = WAIVED_EXCLUSIONS.find((e) => e.identity === 'authority-registry').checks.test
  assert.deepEqual(authority.markers, ['R31 reviewed source mapping drift: M02-note'], 'R31 is present in both environments — kept')
})

// ─── R16: every refusal records its exact layer (never silent) ─────────────

for (const [label, mutate, expectedLayer, assertPayload] of [
  ['kind-gate', (o) => o, 'kind-gate', (e) => {
    assert.equal(e.observed.kind, 'signal')
    assert.deepEqual(e.expected, { kind: 'exit' })
  }],
  ['marker-missing', (o) => o.split('PIN-MARKER-B').join('PIN-MARKER-C'), 'marker-missing', (e) => {
    assert.equal(e.observed.missing, 'PIN-MARKER-B')
    assert.deepEqual(e.expected.markers, ['PIN-MARKER-A', 'PIN-MARKER-B'])
  }],
  ['count-mismatch', (o) => `${o} PIN-MARKER-A`, 'count-mismatch', (e) => {
    assert.deepEqual(e.observed, { literal: 'PIN-MARKER-A', found: 3 })
    assert.deepEqual(e.expected, { literal: 'PIN-MARKER-A', count: 2 })
  }],
  ['range', (o) => `${o}\n\u2139 fail 1`, 'range', (e) => {
    assert.equal(e.observed.sum, 4)
    assert.deepEqual(e.expected, { failTotal: [2, 3] })
  }],
  ['set-subset', (o) => `${o.split('\n').filter((l) => !l.includes('flaky member')).join('\n')}\n\u2716 an intruder (1.0ms)`, 'set-subset', (e) => {
    assert.deepEqual(e.observed.intruders, ['an intruder'])
  }],
  ['set-supersede', (o) => o.split('\n').filter((l) => !l.includes('failing two')).join('\n').split('fail 3').join('fail 2'), 'set-supersede', (e) => {
    assert.deepEqual(e.observed.missing, ['failing two'])
  }],
  ['equality', (o) => o.split('\n').filter((l) => !l.includes('flaky member')).join('\n'), 'equality', (e) => {
    assert.deepEqual(e.observed, { sum: 3, distinct: 2 })
  }],
]) {
  test(`R16/R18: a ${label} refusal is recorded with its layer, evidence and echoed`, () => {
    const echoed = []
    const kind = label === 'kind-gate' ? 'signal' : 'exit'
    const result = runShard({
      root,
      npmCli,
      spawn: (cmd, args, options) => {
        if (args.includes('test') && basename(options.cwd) === 'alpha') {
          return kind === 'signal'
            ? { status: 0, signal: 'SIGTERM', stdout: mutate(pinnedOutput(PINNED.checks.test, { total: 3 })) }
            : { status: 1, stdout: mutate(pinnedOutput(PINNED.checks.test, { total: 3 })) }
        }
        return { status: 0 }
      },
      shardIndex: 0,
      shardCount: 2,
      discover: () => [...NAMES],
      waivers: [PINNED],
      echo: (name, check, text) => echoed.push([name, check, text]),
    })
    const alpha = result.outcomes.find((o) => o.name === 'alpha')
    assert.equal(alpha.checks.test, 'fail')
    const rejection = alpha.waiver_rejected.test
    assert.equal(rejection.layer, expectedLayer, `the ${label} layer must be recorded`)
    // R18: the observed/expected payload and the failing names ride the record
    assertPayload(rejection)
    assert.ok(Array.isArray(rejection.names) && rejection.names.length > 0, 'the observed failing names are recorded')
    assert.ok(echoed.some(([, check, text]) => check.includes('[rejected:') && text !== undefined), 'the payload is echoed')
    const echoLine = echoed.find(([, check]) => check.includes('[rejected:'))
    assert.ok(echoLine[1].includes(expectedLayer), 'the echoed payload names the layer')
  })
}

// ─── R17: cost-aware assignment (A2 placement 11b) ─────────────────────────

test('R17: cost-aware LPT assigns by measured cost desc to the least-loaded shard', () => {
  const costs = { a: 10, b: 8, c: 6, d: 4 }
  // a->s0(10); b->s1(8); c->s1(14); d->s0(14)
  assert.deepEqual(assignShards(['a', 'b', 'c', 'd'], 2, costs), [['a', 'd'], ['b', 'c']])
  // tie-breaks: equal costs order by name; equal loads take the lowest index
  assert.deepEqual(assignShards(['a', 'b', 'c', 'd'], 2, { a: 5, b: 5, c: 5, d: 5 }), [['a', 'c'], ['b', 'd']])
})

test('R17: cost-unknown inputs fall back to round-robin (documented fallback, total)', () => {
  // 'e' is absent from the table -> the whole input set is cost-unknown
  assert.deepEqual(assignShards(['a', 'b', 'c', 'd', 'e'], 2, { a: 9, b: 1, c: 1, d: 1 }), [['a', 'c', 'e'], ['b', 'd']])
  // no table at all -> round-robin
  assert.deepEqual(assignShards(['a', 'b', 'c'], 2, null), [['a', 'c'], ['b']])
  // empty table -> round-robin
  assert.deepEqual(assignShards(['a', 'b', 'c'], 2, {}), [['a', 'c'], ['b']])
})

test('R17: the pinned cost table is measured data (golden)', () => {
  assert.deepEqual({ ...COST_TABLE }, {
    'approval': 14.3,
    'authority-registry': 1407.8,
    'bypass-outage-harness': 36.9,
    'contract-readers': 7.7,
    'contracts': 3.2,
    'dispatch': 33.6,
    'foreman-config': 9.5,
    'hybrid-routing': 17.2,
    'integration': 7.8,
    'jev-decisions': 1.6,
    'kernel-contracts': 3.8,
    'kernel-lease': 67.0,
    'kernel-state': 8.1,
    'mutation-scope-guard': 33.9,
    'permission-profiles': 13.7,
    'projection': 4.8,
    'receipts': 12.4,
    'registration': 18.0,
    'role-authority': 3.6,
    'routing-policy': 17.2,
    'schema-scaffold': 2.8,
    'shaping': 4.2,
    'skill-injection': 13.9,
    'spec-body-compiler': 3.4,
    'spec-linter': 19.8,
    'verification': 375.2,
    'worker-envelopes': 3.2,
  })
})

test('R17: the real table balances the 27-package sweep (partition + determinism + balance)', () => {
  const names = Object.keys(COST_TABLE).sort()
  const shards = assignShards(names, 4)
  // partition
  assert.deepEqual(shards.flat().slice().sort(), names)
  assert.equal(new Set(shards.flat()).size, names.length)
  // determinism
  assert.deepEqual(assignShards(names, 4), shards)
  // cost balance: the LPT bound — no shard exceeds the mean + the largest cost
  const loads = shards.map((s) => s.reduce((a, n) => a + COST_TABLE[n], 0))
  const total = loads.reduce((a, b) => a + b, 0)
  const maxCost = Math.max(...Object.values(COST_TABLE))
  for (const load of loads) assert.ok(load <= total / 4 + maxCost, `load ${load} exceeds the LPT bound`)
  // and the round-robin imbalance this replaces is gone: authority-registry and
  // verification must NOT share a shard
  for (const s of shards) {
    assert.ok(!(s.includes('authority-registry') && s.includes('verification')), 'the two heaviest suites are separated')
  }
})

// ─── R19: variance closure 2 (placement 12) — the CI-environment members ───

test('R19: authority 2-member era waives at 32/31/30 (equality at each end)', () => {
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'authority-registry')
  const pin = entry.checks.test
  assert.equal(pin.failingSet.length, 30)
  assert.deepEqual(pin.flaky, [
    'R31 actual decision blob correspondence detects Git replacement despite an unchanged diagnostic',
    'R31 historical positive uses the pinned R30 implementation and its exact source subject',
  ])
  assert.deepEqual(pin.failTotal, [30, 32])
  const both = [...pin.failingSet, ...pin.flaky]
  for (const [names, total] of [[both, 32], [[...pin.failingSet, pin.flaky[0]], 31], [[...pin.failingSet, pin.flaky[1]], 31], [[...pin.failingSet], 30]]) {
    const out = [
      ...names.map((n) => `\u2716 ${n} (1.0ms)`),
      'R31 reviewed source mapping drift: M02-note',
      `\u2139 fail ${total}`,
    ].join('\n')
    const w = waiverFor(entry.identity, entry.location, 'test', out, [entry])
    assert.ok(w !== null, `total ${total} must waive`)
    assert.equal(w.fail_total, total)
    assert.deepEqual(w.failing_set, [...names].sort())
  }
})

test('R19: the 5-flake kernel closure waives at 75..80 (equality at each) and refuses intruders/missing members', () => {
  const entry = WAIVED_EXCLUSIONS.find((e) => e.identity === 'kernel-lease')
  const pin = entry.checks.test
  assert.equal(pin.failingSet.length, 75)
  assert.deepEqual(pin.flaky.map((n) => n.slice(0, 5)).sort(), ['CN-01', 'CN-02', 'CN-03', 'CN-04', 'CN-05'])
  assert.deepEqual(pin.failTotal, [75, 80])
  // all 32 flake combinations waive (75..80 with the equality holding at each)
  for (let mask = 0; mask < 32; mask += 1) {
    const present = pin.flaky.filter((_, i) => (mask >> i) % 2 === 1)
    const names = [...pin.failingSet, ...present]
    const out = `${names.map((n) => `\u2716 ${n} (1.0ms)`).join('\n')}\n\u2139 fail ${names.length}\n`
    const w = waiverFor(entry.identity, entry.location, 'test', out, [entry])
    assert.ok(w !== null, `mask ${mask} (${present.length} flakes) must waive`)
    assert.equal(w.fail_total, names.length)
  }
  // a non-CN intruder still refuses
  const intruder = `${[...pin.failingSet, ...pin.flaky].map((n) => `\u2716 ${n} (1.0ms)`).join('\n')}\n\u2716 CR-99 an unmeasured failure (1.0ms)\n\u2139 fail 81\n`
  assert.equal(waiverFor(entry.identity, entry.location, 'test', intruder, [entry]), null)
  // a missing deterministic member still refuses
  const missing = `${pin.failingSet.slice(1).map((n) => `\u2716 ${n} (1.0ms)`).join('\n')}\n\u2139 fail 74\n`
  assert.equal(waiverFor(entry.identity, entry.location, 'test', missing, [entry]), null)
})

// ─── ruling: the rejection label carries its payload (artifact parity) ─────

test('the [rejected] log label carries the payload (artifact parity), truncating at 4k with an ellipsis', () => {
  const echoed = []
  const longName = 'x'.repeat(100) // under the parser's 200-char untrusted-name cap
  const bigPin = {
    identity: 'alpha',
    location: 'plugins/foreman-line/alpha/',
    checks: { test: { markers: ['PIN-MARKER-A'], counts: {}, failTotal: [0, 0], failingSet: [], flaky: [] } },
  }
  const result = runShard({
    root,
    npmCli,
    spawn: (cmd, args, options) => {
      if (args.includes('test') && basename(options.cwd) === 'alpha') {
        // a rejection whose names channel is huge -> the JSON exceeds 4k
        return { status: 1, stdout: Array.from({ length: 40 }, (_, i) => `\u2716 ${longName}${i} (1.0ms)`).join('\n') }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [bigPin],
    echo: (name, check, text) => echoed.push([name, check, text]),
  })
  assert.equal(result.outcomes.find((o) => o.name === 'alpha').checks.test, 'fail')
  const label = echoed.find(([, check]) => check.includes('[rejected:'))[1]
  // the artifact record carries the FULL payload...
  const record = result.outcomes.find((o) => o.name === 'alpha').waiver_rejected.test
  assert.equal(record.names.length, 40)
  // ...and the log label carries the same payload, truncated at 4k with the
  // ellipsis marker when longer
  const payload = label.slice(label.indexOf('[rejected: ') + '[rejected: '.length, label.lastIndexOf(']'))
  assert.ok(payload.length <= 4000, 'the payload is capped at 4k')
  assert.ok(payload.endsWith('…'), 'an overlong payload carries the ellipsis marker')
  assert.ok(payload.includes('"layer":"marker-missing"'), 'the label carries the layer')
})
