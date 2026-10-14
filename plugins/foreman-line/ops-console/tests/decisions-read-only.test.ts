import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import type { DecisionsResponse } from '../src/decisions.js'
import { clearDecisionCaches } from '../src/decisions-remote.js'
import { createFakeBin, findRealGit, prependToPath } from './support/fake-bin.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P9 AC5/AC6 negative control. Logging wrappers for `git` and `gh` sit
 * first on PATH; `/api/decisions` runs against a real temp repo; every
 * subprocess is then checked against the read-only allowlist and the
 * repository is shown to be unchanged. `gh` is a fixture: no network.
 */
const NOW = Date.parse('2026-10-13T16:00:00.000Z')
const BILLING =
  'The job was not started because recent account payments have failed or your spending limit needs to be increased.'

const SCENARIO: Scenario = {
  name: 'decisions-ro',
  now: '2026-10-13T16:00:00.000Z',
  goal: {
    slug: 'g',
    queue: ['1. **SYN-P1** shaped; awaiting approval.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [{ name: 'SYN-P1-alpha.md', location: 'active', updated: '2026-10-01' }],
  sidecars: [{ kind: 'projected', spec: 'SYN-P1-alpha.md' }],
  chains: [],
  expected: [],
}

const PRS = JSON.stringify([
  {
    number: 218,
    title: 'feat: ledger',
    url: 'https://github.com/o/r/pull/218',
    headRefName: 'feat/x',
    headRefOid: 'a'.repeat(40),
    baseRefName: 'main',
    isDraft: false,
    mergeable: 'UNKNOWN',
    mergeStateStatus: 'UNKNOWN',
    reviewDecision: '',
    latestReviews: [],
    statusCheckRollup: [
      {
        __typename: 'CheckRun',
        name: 'gate',
        status: 'COMPLETED',
        conclusion: 'FAILURE',
        detailsUrl: 'https://github.com/o/r/actions/runs/1/job/115392291023',
      },
    ],
    createdAt: '2026-10-13T10:00:00Z',
    updatedAt: '2026-10-13T11:00:00Z',
  },
])

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

function rig(ghMode: 'ok' | 'fail') {
  clearDecisionCaches()
  const realGit = findRealGit()
  const root = mkdtempSync(join(tmpdir(), 'decisions-ro-'))
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
  const escapedAnnotationsJson = join(root, 'annotations.json').replace(/\\/g, '\\\\')

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
  process.stdout.write(fs.readFileSync('${escapedPrsJson}', 'utf8'));
  process.exit(0);
}
if (args[0] === 'api') {
  process.stdout.write(fs.readFileSync('${escapedAnnotationsJson}', 'utf8'));
  process.exit(0);
}
process.exit(2);
`,
  })

  writeFileSync(join(root, 'prs.json'), PRS)
  writeFileSync(join(root, 'annotations.json'), JSON.stringify([{ message: BILLING }]))

  const savedPath = process.env.PATH
  process.env.PATH = prependToPath(bin, savedPath)
  process.env.FAKE_GH = ghMode
  return {
    config,
    log: () =>
      readFileSync(logFile, 'utf8')
        .split('\n')
        .filter((line) => line !== ''),
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
      clearDecisionCaches()
      rmSync(root, { recursive: true, force: true })
    },
  }
}

const decisions = async (config: ReturnType<typeof rig>['config']) =>
  handleApi(
    config,
    { method: 'GET', pathname: '/api/decisions', query: new URLSearchParams(), body: {} },
    NOW,
  )

const READ_ONLY_GIT = new Set([
  'symbolic-ref',
  'rev-parse',
  'for-each-ref',
  'log',
  'status',
  'worktree',
])

test('end to end through the real runner: PR list, billing annotation, gate item; nothing is written', async () => {
  const h = rig('ok')
  try {
    const before = h.snapshot()
    const mark = h.log().length
    const result = await decisions(h.config)
    assert.equal(result.status, 200)
    const body = result.json as DecisionsResponse
    assert.equal(body.counts.merge, 1)
    assert.equal(body.counts.G1, 1)
    assert.equal(body.repos[0]?.actions.state, 'not-starting')
    assert.equal(body.repos[0]?.defaultBranch, 'main')
    const commands = h.log().slice(mark)
    assert.equal(h.snapshot(), before, 'status, refs, worktrees, HEAD and FETCH_HEAD are unchanged')

    assert.ok(commands.length >= 3, 'the endpoint did run subprocesses')
    for (const line of commands) {
      const [tool, ...args] = line.split(' ')
      if (tool === 'gh') {
        const ok =
          (args[0] === 'pr' && args[1] === 'list') ||
          (args[0] === 'api' &&
            args.length === 2 &&
            /^repos\/\{owner\}\/\{repo\}\/check-runs\/\d+\/annotations$/.test(args[1] ?? ''))
        assert.ok(ok, `gh must only list PRs or GET one annotation list: ${line}`)
        assert.ok(
          !/\b(merge|close|edit|review|comment|ready|reopen|--method|-X|--input|-f|-F)\b/.test(
            line,
          ),
          line,
        )
        continue
      }
      const rest = [...args]
      while (rest[0] === '-C' || rest[0] === '-c') rest.splice(0, 2)
      const sub = rest[0] ?? ''
      assert.ok(READ_ONLY_GIT.has(sub) || sub === '', `git ${sub} is not read-only: ${line}`)
      for (const forbidden of [
        'fetch',
        'push',
        'pull',
        'checkout',
        'commit',
        'reset',
        'merge',
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

test('gh failing degrades visibly, keeps gate items, never errors', async () => {
  const h = rig('fail')
  try {
    const result = await decisions(h.config)
    assert.equal(result.status, 200)
    const body = result.json as DecisionsResponse
    assert.equal(body.counts.merge, 0)
    assert.equal(body.counts.G1, 1)
    assert.equal(body.repos[0]?.remote.available, false)
    // FCA-P16: gh auth failure message varies between local (not logged in) and CI (GH_TOKEN)
    assert.match(body.repos[0]?.remote.reason ?? '', /not logged in|GH_TOKEN/)
    assert.equal(body.repos[0]?.actions.state, 'unknown')
    assert.equal(body.assessment.complete, false)
  } finally {
    h.cleanup()
  }
})

test('the decisions modules write no files, run no mutating verb and spawn nothing but via the guarded runner', () => {
  for (const name of ['decisions.ts', 'decisions-remote.ts']) {
    const text = readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8')
    assert.doesNotMatch(
      text,
      /writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|writeFile\(|appendFile\(/,
      `${name} must not write files`,
    )
    assert.doesNotMatch(text, /child_process/, `${name} must not spawn directly`)
  }
  const remote = readFileSync(new URL('../src/decisions-remote.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(
    remote,
    /'(merge|close|edit|create|comment|review|ready|reopen)'/,
    'no mutating gh verb appears in the adapter',
  )
  // Every runner call in the remote module goes through guardedGh.
  // FCA-P14: sync and async variants both guard their runner.
  assert.match(remote, /guardedGh\(options\.run \?\? defaultGhRunner\)/)
  assert.match(remote, /guardedGhAsync\(options\.run \?\? defaultAsyncGhRunner\)/)
  // 2 sync + 2 async = 4 guarded runner calls
  assert.equal((remote.match(/run\(repoRoot,/g) ?? []).length, 4)
})
