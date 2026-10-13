import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { gatherRepoFacts, parseWorktrees } from '../src/reconcile-git.js'
import { clearPrCache, gatherPrFacts, parsePrs } from '../src/reconcile-remote.js'

/**
 * FCA-P8 fact gatherers: local git facts against REAL repositories (bare
 * remote, worktrees, upstream tracking) and the `gh` adapter against an
 * injected runner. Every failure mode degrades to unavailable, never a guess.
 */
function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

function commitFile(repo: string, rel: string, body: string, message: string): void {
  const path = join(repo, rel)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, body)
  git(repo, 'add', '.')
  git(repo, 'commit', '-q', '-m', message)
}

test('gatherRepoFacts reads default ref, branches, merge state, upstream tracking, specs, worktrees, logs', () => {
  const root = mkdtempSync(join(tmpdir(), 'reconcile-git-'))
  try {
    const bare = join(root, 'remote.git')
    const repo = join(root, 'repo')
    execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare])
    execFileSync('git', ['init', '-q', '-b', 'main', repo])
    git(repo, 'remote', 'add', 'origin', bare)
    const specs = 'plugins/foreman-line/docs/specs'
    commitFile(repo, `${specs}/active/FOC-P0-contract.md`, 'a', 'feat: FOC-P0 contract')
    commitFile(repo, `${specs}/done/FOC-P9-old.md`, 'b', 'docs: FOC-P9 done')
    git(repo, 'push', '-q', 'origin', 'main')
    git(repo, 'remote', 'set-head', 'origin', 'main')

    // merged branch (fresh at main tip), unmerged branch with upstream, local-ahead branch.
    git(repo, 'branch', 'spawn/foc-p1-2026')
    git(repo, 'checkout', '-q', '-b', 'feat/foc-p2-work')
    commitFile(repo, 'p2.txt', '1', 'wip FOC-P2')
    git(repo, 'push', '-q', '-u', 'origin', 'feat/foc-p2-work')
    commitFile(repo, 'p2b.txt', '2', 'more FOC-P2')
    git(repo, 'checkout', '-q', 'main')
    const wt = join(root, 'wt-foc-p3')
    git(repo, 'worktree', 'add', '-q', '-b', 'spawn/foc-p3', wt)

    const facts = gatherRepoFacts(repo)
    assert.equal(facts.defaultRef, 'origin/main')
    assert.equal(facts.currentBranch, 'main')
    assert.deepEqual(facts.defaultDivergence, { ahead: 0, behind: 0 })
    assert.deepEqual(facts.remoteSpecFiles.map((f) => `${f.location}:${f.name}`).sort(), [
      'active:FOC-P0-contract.md',
      'done:FOC-P9-old.md',
    ])

    const byName = new Map(facts.branches.map((b) => [`${b.remote ? 'r:' : 'l:'}${b.name}`, b]))
    assert.equal(
      byName.get('l:spawn/foc-p1-2026')?.mergedIntoDefault,
      true,
      'fresh branch at main tip is contained',
    )
    assert.equal(byName.get('l:feat/foc-p2-work')?.mergedIntoDefault, false)
    assert.equal(byName.get('l:feat/foc-p2-work')?.upstream, 'origin/feat/foc-p2-work')
    assert.equal(byName.get('l:feat/foc-p2-work')?.aheadOfUpstream, 1)
    assert.equal(byName.get('l:feat/foc-p2-work')?.behindUpstream, 0)
    assert.ok(byName.has('r:origin/feat/foc-p2-work'))
    assert.ok(
      !byName.has('r:origin/HEAD') && !byName.has('r:origin'),
      'symbolic origin/HEAD is not a branch',
    )

    assert.ok(facts.worktrees.some((w) => w.path === wt && w.branch === 'spawn/foc-p3'))
    assert.ok(
      facts.defaultLog.some((c) => c.subject === 'feat: FOC-P0 contract' && c.sha.length === 40),
    )
    assert.ok(
      facts.allLog.some((c) => c.subject === 'more FOC-P2'),
      '--all sees unmerged branch commits',
    )
    assert.ok(!facts.defaultLog.some((c) => c.subject === 'more FOC-P2'))
    assert.equal(
      facts.refsAsOf,
      null,
      'pushed but never fetched: no FETCH_HEAD, so no remote-ref age is claimed',
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('refsAsOf is null until a fetch happens, then the FETCH_HEAD age; divergence is counted', () => {
  const root = mkdtempSync(join(tmpdir(), 'reconcile-fetch-'))
  try {
    const bare = join(root, 'remote.git')
    const repo = join(root, 'repo')
    const other = join(root, 'other')
    execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare])
    execFileSync('git', ['init', '-q', '-b', 'main', repo])
    git(repo, 'remote', 'add', 'origin', bare)
    commitFile(repo, 'a.txt', '1', 'base')
    git(repo, 'push', '-q', 'origin', 'main')
    git(repo, 'remote', 'set-head', 'origin', 'main')
    assert.equal(gatherRepoFacts(repo).refsAsOf, null, 'never fetched')
    git(repo, 'fetch', '-q', 'origin')
    const fetched = gatherRepoFacts(repo).refsAsOf
    assert.ok(fetched !== null && Math.abs(Date.now() - Date.parse(fetched)) < 60_000)

    execFileSync('git', ['clone', '-q', bare, other])
    commitFile(other, 'b.txt', '2', 'remote-only commit')
    git(other, 'push', '-q', 'origin', 'main')
    commitFile(repo, 'c.txt', '3', 'local-only commit')
    git(repo, 'fetch', '-q', 'origin')
    assert.deepEqual(gatherRepoFacts(repo).defaultDivergence, { ahead: 1, behind: 1 })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('no origin / non-git directory: facts degrade to null/empty, never throw', () => {
  const root = mkdtempSync(join(tmpdir(), 'reconcile-none-'))
  try {
    const repo = join(root, 'repo')
    execFileSync('git', ['init', '-q', '-b', 'main', repo])
    commitFile(repo, 'a.txt', '1', 'base')
    const facts = gatherRepoFacts(repo)
    assert.equal(facts.defaultRef, null)
    assert.deepEqual(facts.defaultLog, [])
    assert.deepEqual(facts.remoteSpecFiles, [])
    assert.equal(facts.defaultDivergence, null)
    assert.equal(facts.refsAsOf, null)
    assert.ok(facts.allLog.length === 1, 'local history is still read')
    const bare = gatherRepoFacts(join(root, 'not-a-repo'))
    assert.equal(bare.defaultRef, null)
    assert.deepEqual(bare.branches, [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('parseWorktrees handles porcelain blocks, detached HEAD, and blanks', () => {
  const raw = [
    'worktree /a',
    'HEAD 111',
    'branch refs/heads/main',
    '',
    'worktree /b',
    'HEAD 222',
    'detached',
    '',
  ].join('\n')
  assert.deepEqual(parseWorktrees(raw), [
    { path: '/a', head: '111', branch: 'main' },
    { path: '/b', head: '222', branch: null },
  ])
  assert.deepEqual(parseWorktrees(null), [])
})

const PR_JSON = JSON.stringify([
  {
    number: 1,
    title: 'feat: a',
    headRefName: 'h',
    baseRefName: 'main',
    state: 'MERGED',
    createdAt: '2026-10-01T00:00:00Z',
    mergedAt: '2026-10-02T00:00:00Z',
    closedAt: '2026-10-02T00:00:00Z',
    url: 'u',
  },
  {
    number: 2,
    title: 'wip',
    headRefName: 'h2',
    baseRefName: 'main',
    state: 'OPEN',
    createdAt: '2026-10-03T00:00:00Z',
    mergedAt: null,
    closedAt: null,
    url: 'u2',
  },
])
const NOW = Date.parse('2026-10-13T12:00:00.000Z')

test('gh adapter: parses PRs, stamps asOf, queries once with a bounded limit', () => {
  clearPrCache()
  const calls: string[][] = []
  const facts = gatherPrFacts('/repo-a', NOW, {
    ttlMs: 0,
    run: (_cwd, args) => {
      calls.push([...args])
      return PR_JSON
    },
  })
  assert.equal(facts.available, true)
  assert.equal(facts.asOf, '2026-10-13T12:00:00.000Z')
  assert.deepEqual(
    facts.prs.map((p) => [p.number, p.state]),
    [
      [1, 'MERGED'],
      [2, 'OPEN'],
    ],
  )
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0]?.slice(0, 4), ['pr', 'list', '--state', 'all'])
  assert.ok(calls[0]?.includes('1000'))
  assert.ok(
    !calls[0]?.some((a) => ['merge', 'close', 'edit', 'create', 'comment'].includes(a)),
    'read-only verbs only',
  )
})

test('gh adapter: every failure is unavailable with a reason, never inferred', () => {
  clearPrCache()
  const enoent = gatherPrFacts('/r1', NOW, {
    ttlMs: 0,
    run: () => {
      throw Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })
    },
  })
  assert.deepEqual(
    [enoent.available, enoent.reason, enoent.asOf, enoent.prs],
    [false, 'gh is not installed', null, []],
  )
  const auth = gatherPrFacts('/r2', NOW, {
    ttlMs: 0,
    run: () => {
      throw Object.assign(new Error('Command failed'), {
        stderr: Buffer.from('gh: To get started with GitHub CLI, please run: gh auth login\nmore'),
      })
    },
  })
  assert.equal(auth.available, false)
  assert.match(auth.reason ?? '', /gh auth login/)
  const bad = gatherPrFacts('/r3', NOW, { ttlMs: 0, run: () => 'not json' })
  assert.equal(bad.available, false)
  assert.equal(bad.reason, 'gh returned unparseable output')
  assert.equal(
    parsePrs('[{"number":1,"state":"WEIRD"}]'),
    null,
    'unknown PR state is rejected, not coerced',
  )
  assert.equal(parsePrs('{"a":1}'), null)
})

test('gh adapter: cache window avoids re-querying; failures are cached briefly; expiry re-queries', () => {
  clearPrCache()
  let calls = 0
  const run = () => {
    calls++
    return PR_JSON
  }
  gatherPrFacts('/cache', NOW, { run })
  gatherPrFacts('/cache', NOW + 30_000, { run })
  assert.equal(calls, 1, 'second call inside the window is served from cache')
  gatherPrFacts('/cache', NOW + 61_000, { run })
  assert.equal(calls, 2, 'expired window re-queries')
  clearPrCache()
  let failures = 0
  const failing = () => {
    failures++
    throw new Error('offline')
  }
  gatherPrFacts('/dead', NOW, { run: failing })
  gatherPrFacts('/dead', NOW + 1_000, { run: failing })
  assert.equal(failures, 1, 'a dead network is not re-probed on every request')
})
