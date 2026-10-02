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
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import {
  CHECKS,
  EXPECTED_SKIPS,
  ForemanCiError,
  MAX_SHARDS,
  OUTCOMES_SCHEMA,
  WAIVED_EXCLUSIONS,
  assignShards,
  discoverPackages,
  effectiveDecision,
  reconcile,
  runCli,
  runShard,
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
        return { status: 1, stdout: 'Error: STORAGE_CONSTRAINT_VIOLATION {"reasonCode":"foreign-key"}' }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [
      {
        identity: 'alpha',
        location: 'plugins/foreman-line/alpha/',
        checks: {
          test: {
            markers: ['STORAGE_CONSTRAINT_VIOLATION', 'foreign-key'],
            counts: { STORAGE_CONSTRAINT_VIOLATION: 1, 'foreign-key': 1 },
            failTotal: 0,
          },
        },
      },
    ],
  })
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'waived')
  assert.equal(alpha.waivers.length, 1)
  assert.equal(alpha.waivers[0].check, 'test')
  assert.deepEqual(alpha.waivers[0].markers_matched, ['STORAGE_CONSTRAINT_VIOLATION', 'foreign-key'])
  assert.deepEqual(alpha.waivers[0].counts_verified, { STORAGE_CONSTRAINT_VIOLATION: 1, 'foreign-key': 1 })
  assert.equal(alpha.waivers[0].fail_total, 0)
  assert.match(alpha.waivers[0].output_sha256, /^[0-9a-f]{64}$/)
  assert.equal(result.exitCode, 0, 'a fully-waived shard is green')
})

test('run-then-waive: a DIFFERENT red on a waived identity re-gates as fail (never an unconditional skip)', () => {
  const result = runShard({
    root,
    npmCli,
    spawn: (cmd, args, options) => {
      if (args.includes('test') && basename(options.cwd) === 'alpha') {
        return { status: 1, stdout: 'some entirely different failure' }
      }
      return { status: 0 }
    },
    shardIndex: 0,
    shardCount: 2,
    discover: () => [...NAMES],
    waivers: [
      {
        identity: 'alpha',
        location: 'plugins/foreman-line/alpha/',
        checks: {
          test: { markers: ['STORAGE_CONSTRAINT_VIOLATION'], counts: { STORAGE_CONSTRAINT_VIOLATION: 1 }, failTotal: 0 },
        },
      },
    ],
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
    waivers: [
      {
        identity: 'alpha',
        location: 'plugins/foreman-line/alpha/',
        checks: {
          test: { markers: ['STORAGE_CONSTRAINT_VIOLATION'], counts: { STORAGE_CONSTRAINT_VIOLATION: 1 }, failTotal: 0 },
        },
      },
    ],
  })
  const alpha = result.outcomes.find((o) => o.name === 'alpha')
  assert.equal(alpha.checks.test, 'pass')
  assert.deepEqual(alpha.waivers, [])
})

// ─── R2: value pins bind counts and failure totals (never substring-only) ───

const PINNED = {
  identity: 'alpha',
  location: 'plugins/foreman-line/alpha/',
  checks: {
    test: { markers: ['PIN-MARKER-A', 'PIN-MARKER-B'], counts: { 'PIN-MARKER-A': 2, 'PIN-MARKER-B': 1 }, failTotal: 2 },
  },
}

test('R2 count-bound waiver: exact markers + counts + failTotal waives (positive control)', () => {
  const output = 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n'
  const w = waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', output, [PINNED])
  assert.ok(w !== null)
  assert.equal(w.fail_total, 2)
})

test('R2 count-bound waiver: an occurrence-count mismatch re-gates', () => {
  // one PIN-MARKER-A instead of the pinned two
  const output = 'PIN-MARKER-A PIN-MARKER-B\n# fail 2\n'
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', output, [PINNED]), null)
  // and an extra repeat (a co-occurring same-shape failure) also re-gates
  const extra = 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n'
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', extra, [PINNED]), null)
})

test('R2 count-bound waiver: a co-occurring NEW failure re-gates (failure total)', () => {
  // markers + counts exact, but the suite total is the reviewers' probe shape:
  // a new failure bumped the failure count past the pinned total
  const output = 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 300\n'
  assert.equal(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', output, [PINNED]), null)
  // multiple summary streams must SUM to the pinned total
  const split = 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 1\n# fail 1\n'
  assert.ok(waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', split, [PINNED]) !== null)
})

for (const [label, failure] of [
  ['throw', () => { throw new Error('untrusted') }],
  ['spawn error', () => ({ status: 0, error: new Error('ENOENT'), stdout: 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n' })],
  ['signal', () => ({ status: 0, signal: 'SIGTERM', stdout: 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n' })],
  ['null status', () => ({ status: null, stdout: 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n' })],
  ['missing result', () => undefined],
]) {
  test(`R2 waiver refusal: a ${label} failure NEVER waives even when the output carries the pinned value`, () => {
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
    { markers: ['PIN-A'], counts: null, failTotal: 0 },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 } },
    { markers: 'PIN-A', counts: { 'PIN-A': 1 }, failTotal: 0 },
    { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: '0' },
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
        return { status: 1, stdout: 'PIN-MARKER-A PIN-MARKER-A PIN-MARKER-B\n# fail 2\n::error::spoofed annotation\n' }
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
  const w = waiverFor('alpha', 'plugins/foreman-line/elsewhere/', 'test', 'PIN-A', [
    { identity: 'alpha', location: 'plugins/foreman-line/alpha/', checks: { test: { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: 0 } } },
  ])
  assert.equal(w, null)
})

test('waiver axis refusal: different identity + same location is NOT excluded', () => {
  const w = waiverFor('impostor', 'plugins/foreman-line/alpha/', 'test', 'PIN-A', [
    { identity: 'alpha', location: 'plugins/foreman-line/alpha/', checks: { test: { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: 0 } } },
  ])
  assert.equal(w, null)
})

test('waiver axis refusal: same identity + same location + non-matching value is NOT excluded', () => {
  const w = waiverFor('alpha', 'plugins/foreman-line/alpha/', 'test', 'completely unrelated output', [
    { identity: 'alpha', location: 'plugins/foreman-line/alpha/', checks: { test: { markers: ['PIN-A'], counts: { 'PIN-A': 1 }, failTotal: 0 } } },
  ])
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

const waiverFixtures = [
  {
    identity: 'alpha',
    location: 'plugins/foreman-line/alpha/',
    checks: {
      test: { markers: ['PIN-MARKER-A', 'PIN-MARKER-B'], counts: { 'PIN-MARKER-A': 1, 'PIN-MARKER-B': 1 }, failTotal: 1 },
    },
  },
]

function waivedPackage(name, location, markers) {
  const record = pkg(name, { ...passChecks(), test: 'waived' }, [
    {
      check: 'test',
      markers_matched: markers,
      counts_verified: { 'PIN-MARKER-A': 1, 'PIN-MARKER-B': 1 },
      fail_total: 1,
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

test('the shipped WAIVED_EXCLUSIONS bind identity + location + value for every ratified entry', () => {
  assert.equal(WAIVED_EXCLUSIONS.length, 4)
  for (const entry of WAIVED_EXCLUSIONS) {
    assert.equal(typeof entry.identity, 'string')
    assert.equal(entry.location, `plugins/foreman-line/${entry.identity}/`)
    assert.ok(Object.keys(entry.checks).length >= 1)
    for (const [check, pin] of Object.entries(entry.checks)) {
      assert.ok(pin.markers.length >= 1)
      assert.equal(typeof pin.failTotal, 'number')
      // positive control: a captured output carrying exactly the pinned value
      // (markers at their pinned counts + presence-only markers + the pinned
      // failure total) waives...
      const counted = Object.entries(pin.counts).flatMap(([needle, n]) => Array(n).fill(needle)).join(' ')
      const presenceOnly = pin.markers.filter((m) => !(m in pin.counts))
      const exact = `${[...counted.split(' ').filter(Boolean), ...presenceOnly].join(' ')}\n# fail ${pin.failTotal}\n`
      const w = waiverFor(entry.identity, entry.location, check, exact, WAIVED_EXCLUSIONS)
      assert.ok(w !== null, `${entry.identity}/${check}`)
      assert.deepEqual(w.markers_matched, pin.markers)
      assert.deepEqual(w.counts_verified, { ...pin.counts })
      assert.equal(w.fail_total, pin.failTotal)
      // the presence layer is load-bearing on its own: a missing presence-only
      // marker re-gates even with counts and total exact
      for (const m of presenceOnly) {
        assert.equal(
          waiverFor(entry.identity, entry.location, check, `${counted}\n# fail ${pin.failTotal}\n`, WAIVED_EXCLUSIONS),
          null,
          `${entry.identity}/${check} must re-gate without the presence marker ${m}`,
        )
      }
      // ...and a count drift on any pinned literal never waives (R2)
      for (const needle of Object.keys(pin.counts)) {
        assert.equal(
          waiverFor(entry.identity, entry.location, check, `${exact} ${needle}`, WAIVED_EXCLUSIONS),
          null,
          `${entry.identity}/${check} must re-gate on an extra ${needle}`,
        )
      }
      // ...and a bumped failure total never waives (R2)
      assert.equal(
        waiverFor(entry.identity, entry.location, check, `${exact}\n# fail 999\n`, WAIVED_EXCLUSIONS),
        null,
        `${entry.identity}/${check} must re-gate on a bumped failure total`,
      )
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
