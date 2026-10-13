import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ledgerDirPath } from '../src/config.js'
import {
  deriveLedgerEntry,
  LAUNCH_GRACE_MS,
  type LedgerProbes,
  type OutputFact,
  parsePaneList,
  readPaneOutput,
  stripAnsi,
  type TmuxSessionFact,
} from '../src/ledger.js'
import { readGitOutcome } from '../src/ledger-git.js'
import { enforceRetention, ensureLedgerDir, LOG_NAME, TRUNCATED_NAME } from '../src/ledger-store.js'
import {
  piSessionDirName,
  readPiTranscript,
  type TranscriptFact,
} from '../src/ledger-transcript.js'
import type { SpawnReceipt } from '../src/spawn.js'

/**
 * FCA-P7 AC1-AC5, AC7, AC10: the ledger derives lifecycle from observed facts
 * only. Probes are injected so every state is exercised deterministically; the
 * readers (transcript, git, store) run against real temp directories and repos.
 */
const CREATED = '2026-10-13T12:00:00.000Z'
const T0 = Date.parse(CREATED)

const AUTONOMY = {
  decisions: 'partial',
  commit: false,
  push: false,
  openPr: false,
  merge: false,
} as const

function receipt(overrides: Partial<SpawnReceipt> = {}): SpawnReceipt {
  return {
    id: 'foc-test-p0',
    sessionName: 'foc-test',
    paneIndex: 0,
    harness: 'pi',
    model: 'anthropic/claude-sonnet-5-5',
    thinking: 'high',
    budget: '$1',
    autonomy: AUTONOMY,
    repoRoot: '/repos/r',
    worktreePath: '/repos/r-worktrees/wt',
    promptDigest: 'd',
    argv: ['pi'],
    createdAt: CREATED,
    baseCommit: 'abc',
    branch: 'spawn/wt',
    ledgerDir: 'sessions/foc-test-p0',
    tmuxPaneId: '%1',
    ...overrides,
  }
}

const NO_TRANSCRIPT: TranscriptFact = {
  link: 'none',
  dir: null,
  files: [],
  messages: null,
  costUsd: null,
  lastStopReason: null,
  lastErrorMessage: null,
  firstAt: null,
  lastAt: null,
}
const WITH_TRANSCRIPT: TranscriptFact = {
  ...NO_TRANSCRIPT,
  link: 'linked',
  messages: 12,
  costUsd: 0.04,
  lastStopReason: 'stop',
}
const CLEAN_GIT = {
  worktree: 'present',
  branch: 'spawn/wt',
  commitsAhead: 0,
  dirtyFiles: 0,
  pushed: false,
} as const
const NO_OUTPUT: OutputFact = {
  logPath: null,
  present: false,
  bytes: null,
  tail: [],
  providerError: null,
  truncated: false,
}

function probes(over: {
  tmux?: TmuxSessionFact
  transcript?: TranscriptFact
  git?: LedgerProbes extends { git(r: SpawnReceipt): infer G } ? G : never
  output?: OutputFact
}): LedgerProbes {
  return {
    tmux: () => over.tmux ?? { kind: 'absent' },
    transcript: () => over.transcript ?? NO_TRANSCRIPT,
    git: () => over.git ?? CLEAN_GIT,
    output: () => over.output ?? NO_OUTPUT,
  }
}

const pane = (
  over: Partial<{
    dead: boolean
    deadStatus: number | null
    deadSignal: number | null
    deadTime: number | null
  }> = {},
) =>
  ({
    kind: 'found',
    panes: [
      {
        paneId: '%1',
        paneIndex: 0,
        dead: false,
        deadStatus: null,
        deadSignal: null,
        deadTime: null,
        ...over,
      },
    ],
  }) as TmuxSessionFact

test('lifecycle: every closed state is reachable and evidence-backed', () => {
  const fresh = T0 + 5_000
  const later = T0 + LAUNCH_GRACE_MS + 1
  assert.equal(deriveLedgerEntry(receipt(), probes({ tmux: pane() }), fresh).state, 'launching')
  assert.equal(deriveLedgerEntry(receipt(), probes({ tmux: pane() }), later).state, 'running')
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: pane(), transcript: WITH_TRANSCRIPT }), fresh)
      .state,
    'running',
  )
  const clean = deriveLedgerEntry(
    receipt(),
    probes({ tmux: pane({ dead: true, deadStatus: 0 }), transcript: WITH_TRANSCRIPT }),
    later,
  )
  assert.equal(clean.state, 'exited-clean')
  assert.ok(
    clean.evidence.some((line) => line.includes('not proof the work is complete')),
    'exit 0 is never claimed as completion',
  )
  const failed = deriveLedgerEntry(
    receipt(),
    probes({ tmux: pane({ dead: true, deadStatus: 1, deadTime: T0 / 1000 + 1 }) }),
    later,
  )
  assert.equal(failed.state, 'exited-error')
  assert.equal(failed.exit.status, 1)
  assert.equal(failed.exit.at, '2026-10-13T12:00:01.000Z')
  assert.ok(
    failed.evidence.some((line) =>
      line.includes('prompt not delivered or session failed at startup'),
    ),
  )
  const signalled = deriveLedgerEntry(
    receipt(),
    probes({ tmux: pane({ dead: true, deadSignal: 9 }) }),
    later,
  )
  assert.equal(signalled.state, 'exited-error')
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: pane({ dead: true, deadStatus: 0 }) }), later)
      .state,
    'no-transcript',
  )
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: { kind: 'absent' } }), later).state,
    'vanished',
  )
  assert.equal(
    deriveLedgerEntry(
      receipt(),
      probes({ tmux: { kind: 'unavailable', reason: 'tmux is not installed' } }),
      later,
    ).state,
    'unknown',
  )
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: pane({ dead: true }) }), later).state,
    'unknown',
    'dead with no status is unknown, never error or clean',
  )
})

test('AC5: legacy receipts (no ledger fields) never claim vanished/error and say so', () => {
  const legacy = receipt({
    ledgerDir: undefined,
    baseCommit: undefined,
    branch: undefined,
    tmuxPaneId: undefined,
  })
  const entry = deriveLedgerEntry(
    legacy,
    probes({
      tmux: { kind: 'absent' },
      git: {
        worktree: 'unknown',
        branch: null,
        commitsAhead: null,
        dirtyFiles: null,
        pushed: null,
      },
    }),
    T0 + 10 * LAUNCH_GRACE_MS,
  )
  assert.equal(entry.ledger, 'absent')
  assert.equal(entry.state, 'unknown')
  assert.ok(entry.evidence.some((line) => line.includes('predates the session ledger')))
  assert.equal(entry.git.commitsAhead, null)
  assert.equal(entry.orphanClean, false)
})

test('pane is matched by id when recorded, else by index', () => {
  const two: TmuxSessionFact = {
    kind: 'found',
    panes: [
      { paneId: '%1', paneIndex: 0, dead: true, deadStatus: 3, deadSignal: null, deadTime: null },
      {
        paneId: '%2',
        paneIndex: 1,
        dead: false,
        deadStatus: null,
        deadSignal: null,
        deadTime: null,
      },
    ],
  }
  assert.equal(
    deriveLedgerEntry(
      receipt({ tmuxPaneId: '%2', paneIndex: 1 }),
      probes({ tmux: two, transcript: WITH_TRANSCRIPT }),
      T0 + 60_000,
    ).state,
    'running',
  )
  assert.equal(
    deriveLedgerEntry(
      receipt({ tmuxPaneId: undefined, paneIndex: 0 }),
      probes({ tmux: two }),
      T0 + 60_000,
    ).state,
    'exited-error',
  )
})

test('AC10: orphan-clean is evidence only, requires no live pane + no commits + no dirt', () => {
  const dead = pane({ dead: true, deadStatus: 1 })
  const base = deriveLedgerEntry(receipt(), probes({ tmux: dead }), T0 + 60_000)
  assert.equal(base.orphanClean, true)
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: pane() }), T0 + 60_000).orphanClean,
    false,
    'live pane',
  )
  assert.equal(
    deriveLedgerEntry(
      receipt(),
      probes({ tmux: dead, git: { ...CLEAN_GIT, commitsAhead: 1 } }),
      T0 + 60_000,
    ).orphanClean,
    false,
    'has commits',
  )
  assert.equal(
    deriveLedgerEntry(
      receipt(),
      probes({ tmux: dead, git: { ...CLEAN_GIT, dirtyFiles: 2 } }),
      T0 + 60_000,
    ).orphanClean,
    false,
    'dirty',
  )
  assert.equal(
    deriveLedgerEntry(
      receipt(),
      probes({
        tmux: dead,
        git: {
          worktree: 'missing',
          branch: null,
          commitsAhead: null,
          dirtyFiles: null,
          pushed: null,
        },
      }),
      T0 + 60_000,
    ).orphanClean,
    false,
    'missing worktree is unknown, not orphan',
  )
})

test('provider error line is surfaced verbatim as evidence, not reclassified', () => {
  const line =
    'Error: Model "claude-sonnet-5-5" is ambiguous across providers: anthropic/claude-sonnet-5-5. Use --provider or provider/model.'
  const entry = deriveLedgerEntry(
    receipt(),
    probes({
      tmux: pane({ dead: true, deadStatus: 1 }),
      output: { ...NO_OUTPUT, present: true, tail: [line], providerError: line },
    }),
    T0 + 60_000,
  )
  assert.ok(entry.evidence.includes(`output: ${line}`))
})

test('tmux list-panes output parses dead status, signal, time; ignores blanks', () => {
  const panes = parsePaneList('%1\t0\t1\t3\t\t1791899254\n\n%2\t1\t0\t\t\t\n')
  assert.deepEqual(panes[0], {
    paneId: '%1',
    paneIndex: 0,
    dead: true,
    deadStatus: 3,
    deadSignal: null,
    deadTime: 1791899254,
  })
  assert.deepEqual(panes[1], {
    paneId: '%2',
    paneIndex: 1,
    dead: false,
    deadStatus: null,
    deadSignal: null,
    deadTime: null,
  })
})

test('stripAnsi removes colour, cursor, and carriage-return noise', () => {
  assert.equal(stripAnsi('\u001b[0m\u001b[31mError: boom\u001b[39m\r'), 'Error: boom')
})

function scratch(): string {
  return mkdtempSync(join(tmpdir(), 'ledger-'))
}

test('AC3: transcript joins by worktree path; none / one / many; header cwd must agree', () => {
  const root = scratch()
  try {
    const wt = '/work/trees/alpha-1'
    const dir = join(root, piSessionDirName(wt))
    assert.equal(piSessionDirName(wt), '--work-trees-alpha-1--')
    assert.equal(readPiTranscript(root, wt).link, 'none', 'no directory: pi never started')
    mkdirSync(dir)
    assert.equal(readPiTranscript(root, wt).link, 'none', 'empty directory: prompt never exchanged')
    const header = (cwd: string) =>
      `${JSON.stringify({ type: 'session', cwd, timestamp: '2026-10-13T12:00:00Z' })}\n`
    const msg = (role: string, extra: object = {}) =>
      `${JSON.stringify({ type: 'message', timestamp: '2026-10-13T12:00:05Z', message: { role, ...extra } })}\n`
    writeFileSync(
      join(dir, 'a.jsonl'),
      header(wt) +
        msg('user') +
        msg('assistant', { usage: { cost: { total: 0.25 } }, stopReason: 'stop' }) +
        msg('assistant', {
          usage: { cost: { total: 0.5 } },
          stopReason: 'error',
          errorMessage: '429 Policy budget exceeded',
        }),
    )
    const one = readPiTranscript(root, wt)
    assert.equal(one.link, 'linked')
    assert.equal(one.messages, 3)
    assert.equal(one.costUsd, 0.75)
    assert.equal(one.lastStopReason, 'error')
    assert.equal(one.lastErrorMessage, '429 Policy budget exceeded')
    writeFileSync(join(dir, 'b.jsonl'), header(wt) + msg('user'))
    const many = readPiTranscript(root, wt)
    assert.equal(many.link, 'ambiguous')
    assert.equal(many.files.length, 2, 'candidates are listed, never guessed between')
    assert.equal(many.messages, null)
    rmSync(join(dir, 'a.jsonl'))
    rmSync(join(dir, 'b.jsonl'))
    writeFileSync(join(dir, 'c.jsonl'), header('/somewhere/else') + msg('user'))
    assert.equal(
      readPiTranscript(root, wt).link,
      'none',
      'file whose header cwd disagrees is not ours',
    )
    assert.equal(readPiTranscript(join(root, 'nope', 'deeper'), wt).link, 'none')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('transcript reader never returns message bodies', () => {
  const root = scratch()
  try {
    const wt = '/work/trees/secret'
    const dir = join(root, piSessionDirName(wt))
    mkdirSync(dir)
    writeFileSync(
      join(dir, 'a.jsonl'),
      `${JSON.stringify({ type: 'session', cwd: wt })}\n${JSON.stringify({ type: 'message', message: { role: 'user', content: 'TOP-SECRET-PROMPT' } })}\n`,
    )
    assert.ok(!JSON.stringify(readPiTranscript(root, wt)).includes('TOP-SECRET-PROMPT'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

test('AC4: git outcome across none / dirty / local commits / pushed / branch gone / worktree removed', () => {
  const root = scratch()
  try {
    const bare = join(root, 'remote.git')
    const repo = join(root, 'repo')
    execFileSync('git', ['init', '-q', '--bare', bare])
    execFileSync('git', ['init', '-q', '-b', 'main', repo])
    writeFileSync(join(repo, 'a.txt'), '1')
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'base')
    git(repo, 'remote', 'add', 'origin', bare)
    git(repo, 'push', '-q', 'origin', 'main')
    const base = git(repo, 'rev-parse', 'HEAD')
    const wt = join(root, 'wt')
    git(repo, 'worktree', 'add', '-q', '-b', 'spawn/wt', wt)

    assert.deepEqual(readGitOutcome(wt, base), {
      worktree: 'present',
      branch: 'spawn/wt',
      commitsAhead: 0,
      dirtyFiles: 0,
      pushed: false,
    })

    writeFileSync(join(wt, 'dirty.txt'), 'x')
    writeFileSync(join(wt, 'dirty2.txt'), 'y')
    assert.equal(readGitOutcome(wt, base).dirtyFiles, 2)
    assert.equal(readGitOutcome(wt, base).commitsAhead, 0)

    git(wt, 'add', '.')
    git(wt, 'commit', '-q', '-m', 'work')
    const local = readGitOutcome(wt, base)
    assert.equal(local.commitsAhead, 1)
    assert.equal(local.dirtyFiles, 0)
    assert.equal(local.pushed, false, 'no remote branch: not pushed')

    git(wt, 'push', '-q', 'origin', 'spawn/wt')
    assert.equal(readGitOutcome(wt, base).pushed, true)

    writeFileSync(join(wt, 'more.txt'), 'z')
    git(wt, 'add', '.')
    git(wt, 'commit', '-q', '-m', 'more')
    assert.equal(readGitOutcome(wt, base).pushed, false, 'HEAD ahead of last-fetched remote ref')

    assert.equal(
      readGitOutcome(wt, null).commitsAhead,
      null,
      'no baseCommit: ahead count is unknown, not zero',
    )

    git(wt, 'checkout', '-q', '--detach')
    assert.equal(readGitOutcome(wt, base).branch, null)
    git(repo, 'worktree', 'remove', '--force', wt)
    assert.deepEqual(readGitOutcome(wt, base), {
      worktree: 'missing',
      branch: null,
      commitsAhead: null,
      dirtyFiles: null,
      pushed: null,
    })
    assert.equal(readGitOutcome(join(root, 'plain-dir-not-git'), base).worktree, 'missing')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('store: ledger dir is keyed by a validated receipt id and refuses escapes', () => {
  const state = scratch()
  try {
    const { dir, logPath } = ensureLedgerDir(state, 'foc-20261013t100000z-p0')
    assert.equal(dir, join(state, 'sessions', 'foc-20261013t100000z-p0'))
    assert.ok(existsSync(logPath), 'log is created up front so capture has a target')
    for (const bad of ['../x', 'a/b', '', '/abs', 'UPPER', '.hidden', 'a b']) {
      assert.throws(() => ledgerDirPath(state, bad), /ledger write refused/, bad)
    }
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})

test('AC7: retention truncates oversized logs to the newest bytes and records it; caps pane count', () => {
  const state = scratch()
  try {
    const a = ensureLedgerDir(state, 'old-p0')
    writeFileSync(a.logPath, `${'x'.repeat(100)}NEWEST`)
    const report = enforceRetention(state, { maxBytesPerPane: 20, maxPanes: 50 }, T0)
    assert.deepEqual(report.truncated, ['old-p0'])
    const kept = readFileSync(a.logPath, 'utf8')
    assert.equal(kept.length, 20)
    assert.ok(kept.endsWith('NEWEST'), 'newest content survives')
    const marker = JSON.parse(readFileSync(join(a.dir, TRUNCATED_NAME), 'utf8'))
    assert.equal(marker.reason, 'byte-cap')
    assert.equal(marker.droppedBytes, 86)
    const out = readPaneOutput(state, receipt({ id: 'old-p0' }))
    assert.equal(out.truncated, true)

    // Count cap: with maxPanes 1, the older pane loses its log but keeps a marker.
    const b = ensureLedgerDir(state, 'new-p0')
    writeFileSync(b.logPath, 'fresh')
    const now = Date.now() / 1000
    execFileSync('touch', ['-d', `@${now - 1000}`, a.dir])
    const second = enforceRetention(state, { maxBytesPerPane: 1000, maxPanes: 1 }, T0)
    assert.deepEqual(second.dropped, ['old-p0'])
    assert.equal(existsSync(join(a.dir, LOG_NAME)), false)
    assert.equal(existsSync(join(b.dir, LOG_NAME)), true)
    assert.equal(
      JSON.parse(readFileSync(join(a.dir, TRUNCATED_NAME), 'utf8')).reason,
      'pane-count-cap',
    )
    assert.equal(statSync(a.dir).isDirectory(), true, 'directory (and marker) remain')
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})

test('output reader: bounded tail, ANSI stripped, first error line verbatim, legacy receipt has none', () => {
  const state = scratch()
  try {
    const { logPath } = ensureLedgerDir(state, 'foc-test-p0')
    const lines = Array.from({ length: 40 }, (_, i) => `line ${i}`)
    lines.splice(10, 0, '\u001b[31mError: boom\u001b[39m\r')
    writeFileSync(logPath, `${lines.join('\n')}\n`)
    const out = readPaneOutput(state, receipt())
    assert.equal(out.present, true)
    assert.equal(out.tail.length, 20)
    assert.equal(out.tail.at(-1), 'line 39')
    assert.equal(out.providerError, 'Error: boom')
    assert.equal(readPaneOutput(state, receipt({ ledgerDir: undefined })).present, false)
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})
