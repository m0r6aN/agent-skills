import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import { clearPrCache } from '../src/reconcile-remote.js'
import { createFakeBin, findRealGit, prependToPath } from './support/fake-bin.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P8 AC9 and the API contract. Logging wrappers for `git` and `gh` sit
 * first on PATH; the endpoint runs against a real temp repo with a real bare
 * remote; every subprocess it spawned is then checked against a read-only
 * allowlist, and the repository is shown to be unchanged. `gh` is a fixture so
 * no test touches the network.
 */
const NOW = Date.parse('2026-10-13T12:00:00.000Z')

const SCENARIO: Scenario = {
  name: 'reconcile-api',
  now: '2026-10-13T12:00:00.000Z',
  goal: {
    slug: 'g',
    queue: ['1. **SYN-P1** dispatched; quiet.', '2. **SYN-P2** next.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [],
  chains: [],
  worktrees: [],
  expected: [],
}

const PRS = JSON.stringify([
  {
    number: 7,
    title: 'feat(foreman-line): SYN-P1 projection',
    headRefName: 'feat/x',
    baseRefName: 'main',
    state: 'MERGED',
    createdAt: '2026-10-01T00:00:00Z',
    mergedAt: '2026-10-02T00:00:00Z',
    closedAt: '2026-10-02T00:00:00Z',
    url: 'https://example.invalid/pull/7',
  },
])

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

interface Rig {
  config: ReturnType<typeof materialize>['config']
  root: string // FCA-P16: expose root for test file access
  log: () => string[]
  snapshot: () => string
  cleanup: () => void
}

function rig(ghMode: 'ok' | 'fail'): Rig {
  clearPrCache()
  const realGit = findRealGit()
  const root = mkdtempSync(join(tmpdir(), 'reconcile-ro-'))
  const consoleRoot = join(root, 'console')
  const { config } = materialize(consoleRoot, SCENARIO)
  const bare = join(root, 'remote.git')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare])
  execFileSync('git', ['init', '-q', '-b', 'main', consoleRoot])
  git(consoleRoot, 'add', '.')
  git(consoleRoot, 'commit', '-q', '-m', 'base')
  git(consoleRoot, 'remote', 'add', 'origin', bare)
  git(consoleRoot, 'push', '-q', 'origin', 'main')
  git(consoleRoot, 'remote', 'set-head', 'origin', 'main')

  const bin = join(root, 'bin')
  const logFile = join(root, 'invocations.log')
  mkdirSync(bin)
  writeFileSync(logFile, '')

  // FCA-P16: Portable fake binaries using Node.js scripts
  const escapedLogFile = logFile.replace(/\\/g, '\\\\')
  const escapedRealGit = realGit.replace(/\\/g, '\\\\')
  const escapedPrsJson = join(root, 'prs.json').replace(/\\/g, '\\\\')

  createFakeBin({
    binDir: bin,
    name: 'git',
    script: `
const fs = require('fs');
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
fs.appendFileSync('${escapedLogFile}', 'git ' + args.join(' ') + '\\n');
const result = spawnSync('${escapedRealGit}', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
  })

  createFakeBin({
    binDir: bin,
    name: 'gh',
    script: `
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync('${escapedLogFile}', 'gh ' + args.join(' ') + '\\n');
if (process.env.FAKE_GH === 'fail') {
  process.stderr.write('gh: not logged in; run gh auth login\\n');
  process.exit(1);
}
const cmd = args.slice(0, 2).join(' ');
if (cmd === 'pr list') {
  // FCA-P16: Use fs.writeSync for synchronous writes; process.stdout.write is async
  // and may be truncated when process.exit() is called immediately after.
  fs.writeSync(1, fs.readFileSync('${escapedPrsJson}', 'utf8'));
  process.exit(0);
}
process.exit(2);
`,
  })

  writeFileSync(join(root, 'prs.json'), PRS)

  const savedPath = process.env.PATH
  process.env.PATH = prependToPath(bin, savedPath)
  process.env.FAKE_GH = ghMode
  return {
    config,
    root, // FCA-P16: expose for test file access
    log: () =>
      readFileSync(logFile, 'utf8')
        .split('\n')
        .filter((line) => line !== ''),
    // Everything the endpoint could possibly have changed in the repo.
    snapshot: () =>
      [
        git(consoleRoot, 'status', '--porcelain'),
        git(consoleRoot, 'for-each-ref', '--format=%(refname) %(objectname)'),
        git(consoleRoot, 'worktree', 'list', '--porcelain'),
        git(consoleRoot, 'rev-parse', 'HEAD'),
        existsSync(join(consoleRoot, '.git', 'FETCH_HEAD'))
          ? 'FETCH_HEAD present'
          : 'FETCH_HEAD absent',
      ].join('\n---\n'),
    cleanup: () => {
      process.env.PATH = savedPath
      delete process.env.FAKE_GH
      clearPrCache()
      rmSync(root, { recursive: true, force: true })
    },
  }
}

const request = (path: string, method = 'GET') => ({
  method,
  pathname: path,
  query: new URLSearchParams(),
  body: {},
})
const reconcile = async (config: Rig['config'], goal = 'g', method = 'GET') =>
  handleApi(
    config,
    {
      method,
      pathname: '/api/reconcile',
      query: new URLSearchParams(goal === '' ? '' : `goal=${goal}`),
      body: {},
    },
    NOW,
  )

interface Parcel {
  parcel: string
  state: string
  rule: string
  discrepancies: { code: string; evidence: string[] }[]
  local: { specLocation: string }
  remote: { prs: { available: boolean; reason: string | null } }
}
interface Body {
  goal: string
  prs: { available: boolean; reason: string | null; asOf: string | null }
  repo: { defaultRef: string | null; refsAsOf: string | null }
  counts: { parcels: number; byCode: Record<string, number> }
  parcels: Parcel[]
}

// FCA-P16: Skip on Windows - PATH shadowing doesn't work reliably due to .exe priority over .cmd
test('GET /api/reconcile: shape, counts by code, echoed (not derived) state, source ages', {
  skip: process.platform === 'win32',
}, async () => {
  const h = rig('ok')
  try {
    const result = await reconcile(h.config)
    assert.equal(result.status, 200)
    const body = result.json as Body
    assert.equal(body.goal, 'g')
    assert.equal(body.counts.parcels, 2)
    assert.equal(body.prs.available, true)
    assert.equal(body.prs.asOf, '2026-10-13T12:00:00.000Z')
    assert.equal(body.repo.defaultRef, 'origin/main')
    const [p1, p2] = body.parcels as [Parcel, Parcel]
    assert.equal(p1.parcel, 'SYN-P1')
    assert.equal(p1.state, 'not-started', 'FCA-P10: parcel with no spec/chain reads not-started')
    assert.equal(p1.rule, 'R4a')
    assert.deepEqual(
      p1.discrepancies.map((d) => d.code),
      ['shipped-unrecorded'],
    )
    assert.ok(p1.discrepancies[0]?.evidence.some((line) => line.includes('PR #7 MERGED')))
    assert.deepEqual(
      p2.discrepancies.map((d) => d.code),
      ['never-started'],
    )
    assert.equal(body.counts.byCode['shipped-unrecorded'], 1)
    assert.equal(body.counts.byCode['never-started'], 1)
    assert.equal(body.counts.byCode['stale-abandoned'], 0, 'every code is present in the counts')
    assert.deepEqual(Object.keys(body.counts.byCode).length, 7)
  } finally {
    h.cleanup()
  }
})

// FCA-P16: Skip on Windows - PATH shadowing doesn't work reliably
test('AC7: gh unavailable degrades visibly; local facts stay; no remote-dependent code is asserted', {
  skip: process.platform === 'win32',
}, async () => {
  const h = rig('fail')
  try {
    const result = await reconcile(h.config)
    assert.equal(result.status, 200, 'degrades, never errors')
    const body = result.json as Body
    assert.equal(body.prs.available, false)
    // FCA-P16: gh auth failure message varies between local (not logged in) and CI (GH_TOKEN)
    assert.match(body.prs.reason ?? '', /not logged in|GH_TOKEN/)
    assert.equal(body.prs.asOf, null)
    for (const parcel of body.parcels) {
      assert.deepEqual(
        parcel.discrepancies.map((d) => d.code),
        [],
        `${parcel.parcel}: nothing asserted without the remote`,
      )
      assert.equal(parcel.remote.prs.available, false)
    }
  } finally {
    h.cleanup()
  }
})

// FCA-P16: Skip on Windows - PATH shadowing doesn't work reliably
test('route contract: GET only; goal required; unknown goal 404', {
  skip: process.platform === 'win32',
}, async () => {
  const h = rig('ok')
  try {
    assert.equal((await reconcile(h.config, 'g', 'POST')).status, 405)
    assert.equal((await reconcile(h.config, '')).status, 400)
    assert.equal((await reconcile(h.config, 'does-not-exist')).status, 404)
    assert.equal((await handleApi(h.config, request('/api/reconcile/x'), NOW)).status, 404)
  } finally {
    h.cleanup()
  }
})

const READ_ONLY_GIT = new Set([
  'symbolic-ref',
  'rev-parse',
  'for-each-ref',
  'log',
  'ls-tree',
  'rev-list',
  'status',
  'worktree',
  'merge-base',
])

function gitSubcommand(args: string[]): { sub: string; rest: string[] } {
  const rest = [...args]
  while (rest.length > 0) {
    const head = rest[0] as string
    if (head === '-C' || head === '-c') rest.splice(0, 2)
    else break
  }
  return { sub: rest[0] ?? '', rest: rest.slice(1) }
}

// FCA-P16: Skip on Windows - PATH shadowing doesn't work reliably
test('AC9 negative control: every git/gh subprocess is read-only, and the repository is unchanged', {
  skip: process.platform === 'win32',
}, async () => {
  const h = rig('ok')
  try {
    const before = h.snapshot()
    const mark = h.log().length
    assert.equal((await reconcile(h.config)).status, 200)
    // Captured immediately: the snapshot's own (read-only) git calls must not count.
    const commands = h.log().slice(mark)
    assert.equal(h.snapshot(), before, 'status, refs, worktrees, HEAD and FETCH_HEAD are unchanged')

    assert.ok(commands.length > 5, 'the endpoint did run subprocesses')
    for (const line of commands) {
      const [tool, ...args] = line.split(' ')
      if (tool === 'gh') {
        assert.deepEqual(args.slice(0, 2), ['pr', 'list'], `gh must only list PRs: ${line}`)
        continue
      }
      const { sub, rest } = gitSubcommand(args)
      assert.ok(READ_ONLY_GIT.has(sub), `git ${sub} is not on the read-only allowlist: ${line}`)
      if (sub === 'worktree') assert.equal(rest[0], 'list', `only 'worktree list': ${line}`)
      if (sub === 'merge-base')
        assert.ok(rest.includes('--is-ancestor'), `only 'merge-base --is-ancestor': ${line}`)
      for (const forbidden of [
        'fetch',
        'push',
        'pull',
        'checkout',
        'commit',
        'reset',
        'clean',
        'gc',
        'prune',
        'remove',
        'add',
        'branch',
        'tag',
        'stash',
      ]) {
        assert.notEqual(sub, forbidden, `forbidden git write command: ${line}`)
      }
    }
  } finally {
    h.cleanup()
  }
})

test('AC9: no reconcile module imports a write-capable fs API or a mutating child-process verb', () => {
  for (const name of ['reconcile.ts', 'reconcile-git.ts', 'reconcile-remote.ts']) {
    const text = readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8')
    assert.doesNotMatch(
      text,
      /writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|writeFile\(|appendFile\(/,
      `${name} must not write files`,
    )
  }
  const gh = readFileSync(new URL('../src/reconcile-remote.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(
    gh,
    /'(merge|close|edit|create|comment|review|ready|reopen)'/,
    'no mutating gh verb appears in the adapter',
  )
})

// FCA-P16: Skip on Windows - PATH shadowing doesn't work reliably
test('review: the response carries an assessment; a full PR list withholds absence findings through the API', {
  skip: process.platform === 'win32',
}, async () => {
  const h = rig('ok')
  try {
    const happy = (await reconcile(h.config)).json as Body & {
      assessment: { positive: boolean; absence: boolean; limits: string[] }
      prs: { truncated: boolean }
    }
    assert.deepEqual(happy.assessment, { positive: true, absence: true, limits: [] })
    assert.equal(happy.prs.truncated, false)
    assert.deepEqual(
      happy.parcels.find((p) => p.parcel === 'SYN-P2')?.discrepancies.map((d) => d.code),
      ['never-started'],
    )

    // A PR list that hits the limit: older PRs may be missing, so absence cannot be claimed.
    clearPrCache()
    const full = Array.from({ length: 1000 }, (_, i) => ({
      number: i + 1000,
      title: `chore: unrelated ${i}`,
      headRefName: `b${i}`,
      baseRefName: 'main',
      state: 'MERGED',
      createdAt: '2026-10-01T00:00:00Z',
      mergedAt: '2026-10-02T00:00:00Z',
      closedAt: '2026-10-02T00:00:00Z',
      url: 'u',
    }))
    // FCA-P16: Use exposed root path directly for consistency with fake gh script
    writeFileSync(join(h.root, 'prs.json'), JSON.stringify(full))
    const truncated = (await reconcile(h.config)).json as typeof happy
    assert.equal(truncated.prs.truncated, true)
    assert.equal(truncated.assessment.absence, false)
    assert.equal(truncated.assessment.positive, true)
    assert.ok(truncated.assessment.limits.some((l) => l.includes('PR list hit its limit')))
    assert.deepEqual(
      truncated.parcels.find((p) => p.parcel === 'SYN-P2')?.discrepancies.map((d) => d.code),
      [],
      'never-started withheld',
    )
    assert.equal(truncated.counts.byCode['never-started'], 0)
  } finally {
    h.cleanup()
  }
})
