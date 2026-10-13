import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ledgerDirPath } from '../src/config.js'
import {
  capLine,
  classifyTmuxFailure,
  deriveLedgerEntry,
  LAUNCH_GRACE_MS,
  type LedgerProbes,
  ledgerEntries,
  MAX_LINE_CHARS,
  type OutputFact,
  parsePaneList,
  readPaneOutput,
  stripAnsi,
  type TmuxSessionFact,
} from '../src/ledger.js'
import {
  defaultGitRunner,
  GIT_TIMEOUT_MS,
  type GitRunner,
  makeGitCache,
  readGitOutcome,
  safeRev,
} from '../src/ledger-git.js'
import {
  discardEmptyLedgerDir,
  enforceRetention,
  ensureLedgerDir,
  LOG_NAME,
  TRUNCATED_NAME,
} from '../src/ledger-store.js'
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
  rejected: 0,
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
  source: 'none',
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
    const a = ensureLedgerDir(state, 'foc-20260101t000000z-p0')
    writeFileSync(a.logPath, `${'x'.repeat(100)}NEWEST`)
    const report = enforceRetention(state, { maxBytesPerPane: 20, maxPanes: 50, quietMs: 0 }, T0)
    assert.deepEqual(report.truncated, ['foc-20260101t000000z-p0'])
    const kept = readFileSync(a.logPath, 'utf8')
    assert.equal(kept.length, 20)
    assert.ok(kept.endsWith('NEWEST'), 'newest content survives')
    const marker = JSON.parse(readFileSync(join(a.dir, TRUNCATED_NAME), 'utf8'))
    assert.equal(marker.reason, 'byte-cap')
    assert.equal(marker.droppedBytes, 86)
    const out = readPaneOutput(state, receipt({ id: 'foc-20260101t000000z-p0' }))
    assert.equal(out.truncated, true)

    // Count cap: with maxPanes 1, the older pane loses its log but keeps a marker.
    const b = ensureLedgerDir(state, 'foc-20261001t000000z-p0')
    writeFileSync(b.logPath, 'fresh')
    const now = Date.now() / 1000
    execFileSync('touch', ['-d', `@${now - 1000}`, a.dir])
    const second = enforceRetention(state, { maxBytesPerPane: 1000, maxPanes: 1, quietMs: 0 }, T0)
    assert.deepEqual(second.dropped, ['foc-20260101t000000z-p0'])
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

// ---- reviewer rework (independent review of FCA-P7, 2026-10-13) ----------------------------

const LINKED_ERR: TranscriptFact = {
  ...NO_TRANSCRIPT,
  link: 'linked',
  messages: 6,
  costUsd: 0.1,
  lastStopReason: 'error',
  lastErrorMessage: '429 rate_limit_error: You have exceeded your rate limit',
}

test('review #1: exit 0 with a failed last assistant message is exited-error, never exited-clean', () => {
  const dead0 = pane({ dead: true, deadStatus: 0 })
  const failed = deriveLedgerEntry(
    receipt(),
    probes({ tmux: dead0, transcript: LINKED_ERR }),
    T0 + 60_000,
  )
  assert.equal(failed.state, 'exited-error')
  assert.ok(
    failed.evidence.some((line) =>
      line.includes('last assistant message ended with an error: 429 rate_limit_error'),
    ),
  )
  const stopped = deriveLedgerEntry(
    receipt(),
    probes({
      tmux: dead0,
      transcript: { ...LINKED_ERR, lastStopReason: 'stop', lastErrorMessage: null },
    }),
    T0 + 60_000,
  )
  assert.equal(stopped.state, 'exited-clean')
  assert.ok(!stopped.evidence.some((line) => line.includes('ended with an error')))
  const aborted = deriveLedgerEntry(
    receipt(),
    probes({
      tmux: dead0,
      transcript: { ...LINKED_ERR, lastStopReason: 'aborted', lastErrorMessage: null },
    }),
    T0 + 60_000,
  )
  assert.equal(aborted.state, 'exited-clean')
  assert.ok(aborted.evidence.some((line) => line.includes('was aborted')))
  const live = deriveLedgerEntry(
    receipt(),
    probes({ tmux: pane(), transcript: LINKED_ERR }),
    T0 + 60_000,
  )
  assert.equal(live.state, 'running', 'a live pane stays running; the error is evidence')
  assert.ok(live.evidence.some((line) => line.includes('ended with an error')))
})

test('review #7: an unreadable/oversized or rejected transcript says so instead of failing silently', () => {
  const unknown = deriveLedgerEntry(
    receipt(),
    probes({
      tmux: pane({ dead: true, deadStatus: 0 }),
      transcript: { ...NO_TRANSCRIPT, link: 'unknown' },
    }),
    T0 + 60_000,
  )
  assert.ok(
    unknown.evidence.some((line) => line.includes('too large to summarize: the join is unknown')),
  )
  const rejected = deriveLedgerEntry(
    receipt(),
    probes({
      tmux: pane({ dead: true, deadStatus: 1 }),
      transcript: { ...NO_TRANSCRIPT, rejected: 2 },
    }),
    T0 + 60_000,
  )
  assert.ok(
    rejected.evidence.some((line) =>
      line.includes(
        '2 transcript file(s) in the session directory name a different working directory',
      ),
    ),
  )
})

test('review #5: only "no such session / no server" is absent; any other tmux failure is unavailable', () => {
  assert.deepEqual(classifyTmuxFailure("can't find session: foc-x", undefined), { kind: 'absent' })
  assert.deepEqual(classifyTmuxFailure('no server running on /tmp/tmux-1000/default', undefined), {
    kind: 'absent',
  })
  assert.deepEqual(
    classifyTmuxFailure(
      'error connecting to /tmp/tmux-1000/default (No such file or directory)',
      undefined,
    ),
    { kind: 'absent' },
  )
  assert.deepEqual(classifyTmuxFailure('', 'ENOENT'), {
    kind: 'unavailable',
    reason: 'tmux is not installed',
  })
  const denied = classifyTmuxFailure(
    'error connecting to /tmp/tmux-0/default (Permission denied)',
    undefined,
  )
  assert.equal(denied.kind, 'unavailable')
  assert.match((denied as { reason: string }).reason, /Permission denied/)
  assert.equal(
    classifyTmuxFailure('', undefined).kind,
    'unavailable',
    'an unexplained failure is not evidence the session is gone',
  )
})

test('review #10: the LATEST error-looking line wins, and OSC escape payloads are stripped', () => {
  const state = scratch()
  try {
    const { logPath } = ensureLedgerDir(state, 'foc-test-p0')
    writeFileSync(
      logPath,
      [
        'Error: first problem',
        'recovered, working',
        '\u001b]0;window title\u0007Error: the real ending\r',
        'trailing line',
      ].join('\n'),
    )
    const out = readPaneOutput(state, receipt())
    assert.equal(out.providerError, 'Error: the real ending')
    assert.ok(!out.tail.join('\n').includes('window title'), 'OSC payload removed')
    assert.equal(stripAnsi('a\u001b]8;;http://x\u001b\\link\u001b]8;;\u001b\\b'), 'alinkb')
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})

test('review #7: join survives a symlinked worktree path (pi records the real cwd) and a large header', () => {
  const root = scratch()
  try {
    const real = join(root, 'real-wt')
    const link = join(root, 'link-wt')
    mkdirSync(real)
    symlinkSync(real, link)
    const dir = join(root, 'sessions', piSessionDirName(real))
    mkdirSync(dir, { recursive: true })
    const header = JSON.stringify({ type: 'session', cwd: real, padding: 'x'.repeat(9000) })
    writeFileSync(
      join(dir, 's.jsonl'),
      `${header}\n${JSON.stringify({ type: 'message', message: { role: 'user' } })}\n`,
    )
    const viaLink = readPiTranscript(join(root, 'sessions'), link)
    assert.equal(viaLink.link, 'linked', 'receipt holds the symlink, pi stamped the real path')
    assert.equal(viaLink.messages, 1)
    assert.equal(readPiTranscript(join(root, 'sessions'), real).link, 'linked')
    // A file naming a different directory is counted, not silently dropped.
    writeFileSync(
      join(dir, 'other.jsonl'),
      `${JSON.stringify({ type: 'session', cwd: '/elsewhere' })}\n`,
    )
    assert.equal(readPiTranscript(join(root, 'sessions'), real).rejected, 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review #4: an unchanged transcript is not re-parsed (keyed by path, size, mtime)', () => {
  const root = scratch()
  try {
    const wt = '/work/trees/cache-1'
    const dir = join(root, piSessionDirName(wt))
    mkdirSync(dir)
    const file = join(dir, 's.jsonl')
    const line = (n: number) =>
      `${JSON.stringify({ type: 'session', cwd: wt })}\n${Array.from({ length: n }, () => JSON.stringify({ type: 'message', message: { role: 'user' } })).join('\n')}\n`
    writeFileSync(file, line(2))
    const t = new Date('2026-10-13T12:00:00Z')
    utimesSync(file, t, t)
    assert.equal(readPiTranscript(root, wt).messages, 2)
    // Same size and mtime, different content: the cache (correctly) answers from memory.
    writeFileSync(file, line(2).replace('"user"', '"usex"'))
    utimesSync(file, t, t)
    assert.equal(readPiTranscript(root, wt).messages, 2, 'served from cache')
    // A real change (new mtime) is re-read.
    writeFileSync(file, line(3))
    assert.equal(readPiTranscript(root, wt).messages, 3, 'size/mtime changed: re-read')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review #11: baseCommit values that could be read as options are rejected, not passed to git', () => {
  for (const bad of [
    '-x',
    '--output=/tmp/pwn',
    'a..b',
    '',
    ' abc',
    'abc def',
    '--end-of-options',
  ]) {
    assert.equal(safeRev(bad), null, JSON.stringify(bad))
  }
  for (const good of [
    '0123456789abcdef0123456789abcdef01234567',
    'origin/main',
    'refs/remotes/origin/feat-x',
    'v1.2',
  ]) {
    assert.equal(safeRev(good), good)
  }
  assert.equal(safeRev(null), null)
  const calls: string[][] = []
  const run: GitRunner = (_cwd, args) => {
    calls.push([...args])
    return args[0] === 'status' ? '' : args[0] === 'rev-parse' ? 'abc' : null
  }
  const root = scratch()
  try {
    const fact = readGitOutcome(root, '--output=/tmp/pwn', run)
    assert.equal(fact.commitsAhead, null)
    assert.ok(!calls.some((args) => args.includes('--output=/tmp/pwn')), 'never reached git')
    assert.ok(!calls.some((args) => args[0] === 'rev-list'), 'no rev-list without a safe base')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review #3: git probes never take index locks or run repo-local fsmonitor hooks, and cannot hang', () => {
  const root = scratch()
  try {
    const realGit = execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim()
    const bin = join(root, 'bin')
    const log = join(root, 'log')
    mkdirSync(bin)
    writeFileSync(log, '')
    writeFileSync(
      join(bin, 'git'),
      `#!/bin/sh\necho "OPTIONAL_LOCKS=$GIT_OPTIONAL_LOCKS $*" >> '${log}'\nexec '${realGit}' "$@"\n`,
    )
    chmodSync(join(bin, 'git'), 0o755)
    const repo = join(root, 'repo')
    execFileSync('git', ['init', '-q', '-b', 'main', repo])
    const saved = process.env.PATH
    process.env.PATH = `${bin}:${saved}`
    try {
      defaultGitRunner(repo, ['status', '--porcelain'])
    } finally {
      process.env.PATH = saved
    }
    const line = readFileSync(log, 'utf8').trim().split('\n')[0] ?? ''
    assert.match(line, /^OPTIONAL_LOCKS=0 /, 'GIT_OPTIONAL_LOCKS=0 is set')
    assert.match(line, /-c core\.fsmonitor=false/, 'fsmonitor is disabled')
    assert.ok(GIT_TIMEOUT_MS > 0 && GIT_TIMEOUT_MS <= 60_000, 'a timeout bounds a hung git')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review #4: git outcomes are memoised for the TTL and re-read after it', () => {
  let calls = 0
  let clock = 1_000
  const run: GitRunner = (_cwd, args) => {
    calls++
    return args[0] === 'rev-parse' ? 'abc' : args[0] === 'status' ? '' : null
  }
  const root = scratch()
  try {
    const cache = makeGitCache(15_000, () => clock, run)
    cache.outcome(root, null)
    const first = calls
    cache.outcome(root, null)
    assert.equal(calls, first, 'second call inside the TTL spawns nothing')
    cache.outcome(root, 'abc1234')
    assert.ok(calls > first, 'a different base is a different key')
    const before = calls
    clock += 15_001
    cache.outcome(root, null)
    assert.ok(calls > before, 're-read after the TTL')
    const none = makeGitCache(0, () => clock, run)
    const c0 = calls
    none.outcome(root, null)
    none.outcome(root, null)
    assert.ok(calls - c0 >= 2 * first, 'ttl 0 disables caching')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('review #8/#9: retention ignores symlinks and malformed names, ranks by id, spares recently-written logs; files are owner-only', () => {
  const state = scratch()
  const outside = scratch()
  try {
    const sessions = join(state, 'sessions')
    mkdirSync(sessions)
    // A symlinked entry pointing outside the tree must never be touched.
    writeFileSync(join(outside, 'pane.log'), 'x'.repeat(500))
    symlinkSync(outside, join(sessions, 'foc-evil-p0'))
    // A malformed name is ignored.
    mkdirSync(join(sessions, 'Not_A_Receipt'))
    writeFileSync(join(sessions, 'Not_A_Receipt', 'pane.log'), 'y'.repeat(500))
    // Ranking by id: newest ids survive the count cap, oldest is dropped.
    const old = ensureLedgerDir(state, 'foc-20260101t000000z-p0')
    const mid = ensureLedgerDir(state, 'foc-20260601t000000z-p0')
    const recent = ensureLedgerDir(state, 'foc-20261001t000000z-p0')
    for (const p of [old, mid, recent]) writeFileSync(p.logPath, 'z'.repeat(50))
    const report = enforceRetention(state, { maxBytesPerPane: 1000, maxPanes: 2, quietMs: 0 }, T0)
    assert.deepEqual(report.dropped, ['foc-20260101t000000z-p0'])
    assert.equal(existsSync(old.logPath), false)
    assert.equal(existsSync(mid.logPath), true)
    assert.equal(
      readFileSync(join(outside, 'pane.log'), 'utf8').length,
      500,
      'symlink target untouched',
    )
    assert.equal(
      readFileSync(join(sessions, 'Not_A_Receipt', 'pane.log'), 'utf8').length,
      500,
      'malformed name untouched',
    )
    // Recently-written logs (possibly a live pane) are spared even over the cap.
    writeFileSync(recent.logPath, 'w'.repeat(5000))
    const spared = enforceRetention(
      state,
      { maxBytesPerPane: 100, maxPanes: 10, quietMs: 600_000 },
      Date.now(),
    )
    assert.deepEqual(
      spared.truncated,
      [],
      'a log written moments ago is not truncated under a live writer',
    )
    assert.equal(readFileSync(recent.logPath, 'utf8').length, 5000)
    const enforced = enforceRetention(
      state,
      { maxBytesPerPane: 100, maxPanes: 10, quietMs: 600_000 },
      Date.now() + 601_000,
    )
    assert.deepEqual(enforced.truncated, ['foc-20261001t000000z-p0'], 'enforced once quiet')
    // Owner-only permissions.
    assert.equal(statSync(recent.dir).mode & 0o777, 0o700)
    assert.equal(statSync(recent.logPath).mode & 0o777, 0o600)
    const marker = join(recent.dir, TRUNCATED_NAME)
    assert.equal(statSync(marker).mode & 0o777, 0o600)
  } finally {
    rmSync(state, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

// ---- reviewer re-review rework (second independent pass on FCA-P7, 2026-10-13) --------------

test('re-review: without a pane id, attribution by order needs one tmux pane per receipt; otherwise unknown', () => {
  const twoPanes: TmuxSessionFact = {
    kind: 'found',
    panes: [
      { paneId: '%1', paneIndex: 1, dead: true, deadStatus: 3, deadSignal: null, deadTime: null },
      {
        paneId: '%2',
        paneIndex: 2,
        dead: false,
        deadStatus: null,
        deadSignal: null,
        deadTime: null,
      },
    ],
  }
  const noId = (paneIndex: number) => receipt({ tmuxPaneId: undefined, paneIndex })
  // Two receipts, two panes: order identifies each.
  assert.equal(
    deriveLedgerEntry(noId(0), probes({ tmux: twoPanes }), T0 + 60_000, 2).state,
    'exited-error',
  )
  // Three receipts but tmux lost a pane (no remain-on-exit): order no longer identifies anyone.
  const lost = deriveLedgerEntry(
    noId(1),
    probes({ tmux: twoPanes, transcript: WITH_TRANSCRIPT }),
    T0 + 60_000,
    3,
  )
  assert.equal(
    lost.state,
    'unknown',
    'receipt 1 must not be reported as whichever pane now sits at that position',
  )
  assert.ok(lost.evidence.some((line) => line.includes('cannot attribute panes')))
  // A recorded pane id is always authoritative, whatever the counts.
  assert.equal(
    deriveLedgerEntry(
      receipt({ tmuxPaneId: '%2' }),
      probes({ tmux: twoPanes, transcript: WITH_TRANSCRIPT }),
      T0 + 60_000,
      9,
    ).state,
    'running',
  )
  // ledgerEntries supplies the sibling counts itself.
  const receipts = [
    receipt({ id: 'a', tmuxPaneId: undefined, paneIndex: 0 }),
    receipt({ id: 'b', tmuxPaneId: undefined, paneIndex: 1 }),
    receipt({ id: 'c', tmuxPaneId: undefined, paneIndex: 2 }),
  ]
  const map = ledgerEntries(receipts, probes({ tmux: twoPanes }), T0 + 60_000)
  assert.deepEqual(
    [...map.values()].map((e) => e.state),
    ['unknown', 'unknown', 'unknown'],
  )
})

test('re-review: exit 0 whose transcript cannot be joined is unknown, never exited-clean', () => {
  const dead0 = pane({ dead: true, deadStatus: 0 })
  for (const link of ['unknown', 'ambiguous'] as const) {
    const entry = deriveLedgerEntry(
      receipt(),
      probes({ tmux: dead0, transcript: { ...NO_TRANSCRIPT, link, messages: null } }),
      T0 + 60_000,
    )
    // `none` is no-transcript; unknown/ambiguous cannot say whether the ending was an error.
    assert.equal(entry.state, 'unknown', link)
  }
  const unknown = deriveLedgerEntry(
    receipt(),
    probes({ tmux: dead0, transcript: { ...NO_TRANSCRIPT, link: 'unknown' } }),
    T0 + 60_000,
  )
  assert.ok(
    unknown.evidence.some((line) => line.includes('whether it ended in an error is unknown')),
  )
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: dead0, transcript: WITH_TRANSCRIPT }), T0 + 60_000)
      .state,
    'exited-clean',
    'a joined, clean transcript is still clean',
  )
})

test('re-review: the entry records what tmux said, and "no live pane" is never asserted when tmux was unavailable', () => {
  const unavailable = deriveLedgerEntry(
    receipt(),
    probes({ tmux: { kind: 'unavailable', reason: 'tmux failed: x' } }),
    T0 + 60_000,
  )
  assert.equal(unavailable.tmux, 'unavailable')
  assert.equal(unavailable.orphanClean, false, 'clean worktree + unknown liveness is not an orphan')
  assert.ok(!unavailable.evidence.some((line) => line.includes('orphan-clean')))
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: { kind: 'absent' } }), T0 + 60_000).tmux,
    'absent',
  )
  assert.equal(deriveLedgerEntry(receipt(), probes({ tmux: pane() }), T0 + 60_000).tmux, 'found')
  assert.equal(
    deriveLedgerEntry(receipt(), probes({ tmux: { kind: 'absent' } }), T0 + 60_000).orphanClean,
    true,
    'absent session + clean worktree is an orphan',
  )
})

test('re-review: the ledger time budget bounds probing and says so', () => {
  let probed = 0
  const counting: LedgerProbes = {
    tmux: () => ({ kind: 'absent' }),
    output: () => NO_OUTPUT,
    transcript: () => {
      probed++
      return WITH_TRANSCRIPT
    },
    git: () => {
      probed++
      return CLEAN_GIT
    },
  }
  const receipts = ['a', 'b', 'c', 'd'].map((id, paneIndex) =>
    receipt({ id, paneIndex, tmuxPaneId: `%${paneIndex}` }),
  )
  let clock = 0
  const tick = () => (clock += 1500)
  const map = ledgerEntries(receipts, counting, T0 + 60_000, 5000, tick)
  const entries = [...map.values()]
  assert.ok(
    probed < receipts.length * 2,
    `probing stopped at the budget (${probed} of ${receipts.length * 2} probes ran)`,
  )
  const limited = entries.filter((e) =>
    e.evidence.some((line) => line.includes('time budget was exhausted')),
  )
  assert.ok(
    limited.length > 0 && limited.length < receipts.length,
    'only the receipts after the budget are marked',
  )
  for (const entry of limited) {
    // Probing stops mid-receipt at the budget: whatever was not probed is UNKNOWN, never clean.
    assert.ok(
      entry.git.worktree === 'unknown' || entry.transcript.link === 'unknown',
      'at least one fact was skipped',
    )
    if (entry.git.worktree === 'unknown')
      assert.equal(entry.orphanClean, false, 'unprobed git cannot make an orphan')
  }
  // Within budget, nothing is marked.
  const fast = ledgerEntries(receipts, counting, T0 + 60_000, 8000, () => 0)
  assert.ok(
    ![...fast.values()].some((e) => e.evidence.some((line) => line.includes('time budget'))),
  )
})

test('re-review: the rendered screen wins for the tail; lines are capped; an error on screen is the provider error', () => {
  assert.equal(capLine('x'.repeat(MAX_LINE_CHARS + 50)).length, MAX_LINE_CHARS + 1)
  assert.equal(capLine('short'), 'short')
  const screenProbes: LedgerProbes = {
    ...probes({ tmux: pane({ dead: true, deadStatus: 1 }) }),
    screen: () => ['welcome', 'Error: provider said no', '$'],
  }
  const withScreen = deriveLedgerEntry(receipt(), screenProbes, T0 + 60_000)
  assert.equal(withScreen.output.source, 'screen')
  assert.deepEqual(withScreen.output.tail, ['welcome', 'Error: provider said no', '$'])
  assert.equal(withScreen.output.providerError, 'Error: provider said no')
  const none: LedgerProbes = { ...screenProbes, screen: () => null }
  assert.equal(
    deriveLedgerEntry(receipt(), none, T0 + 60_000).output.source,
    'none',
    'no screen: falls back to the log',
  )
  const empty: LedgerProbes = { ...screenProbes, screen: () => [] }
  assert.equal(deriveLedgerEntry(receipt(), empty, T0 + 60_000).output.source, 'none')
  const state = scratch()
  try {
    const { logPath } = ensureLedgerDir(state, 'foc-test-p0')
    writeFileSync(logPath, `${'y'.repeat(5000)}\n`)
    const out = readPaneOutput(state, receipt())
    assert.equal(out.source, 'log')
    assert.ok(
      (out.tail[0] ?? '').length <= MAX_LINE_CHARS + 1,
      'a TUI-redraw "line" cannot become a multi-kilobyte blob',
    )
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})

test('re-review: retention is decided by LIVENESS and launch order, not by mtime or id spelling', () => {
  const state = scratch()
  try {
    const mk = (id: string, bytes: number) => {
      const p = ensureLedgerDir(state, id)
      writeFileSync(p.logPath, 'z'.repeat(bytes))
      const old = new Date('2026-01-01T00:00:00Z')
      utimesSync(p.logPath, old, old)
      return p
    }
    const live = mk('foc-a-p0', 5000)
    const idle = mk('foc-b-p0', 5000)
    // protect set: a live pane's old, over-cap log is untouched; the dead one is truncated.
    const r1 = enforceRetention(
      state,
      { maxBytesPerPane: 100, maxPanes: 50, quietMs: 0, protect: new Set(['foc-a-p0']) },
      T0,
    )
    assert.deepEqual(r1.truncated, ['foc-b-p0'])
    assert.equal(readFileSync(live.logPath, 'utf8').length, 5000, 'live pane untouched however old')
    assert.equal(readFileSync(idle.logPath, 'utf8').length, 100)
    // 'all': liveness unknown, nothing is touched.
    writeFileSync(idle.logPath, 'q'.repeat(5000))
    utimesSync(idle.logPath, new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'))
    assert.deepEqual(
      enforceRetention(
        state,
        { maxBytesPerPane: 100, maxPanes: 50, quietMs: 0, protect: 'all' },
        T0,
      ),
      { truncated: [], dropped: [] },
    )
    // Count cap by launch order: p10 launched after p2 although it sorts before it; custom names too.
    const p2 = mk('foc-s-p2', 10)
    const p10 = mk('foc-s-p10', 10)
    const custom = mk('zzz-oldest-p0', 10)
    const dropped = enforceRetention(
      state,
      {
        maxBytesPerPane: 1000,
        maxPanes: 2,
        quietMs: 0,
        order: ['foc-s-p10', 'foc-s-p2', 'zzz-oldest-p0', 'foc-b-p0', 'foc-a-p0'],
      },
      T0,
    ).dropped
    assert.deepEqual(
      [...dropped].sort(),
      ['foc-a-p0', 'foc-b-p0', 'zzz-oldest-p0'],
      'the two newest by launch order (p10, p2) survive',
    )
    assert.equal(existsSync(p10.logPath), true)
    assert.equal(existsSync(p2.logPath), true)
    assert.equal(existsSync(custom.logPath), false)
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})

test('re-review: an empty ledger dir from a failed launch is removed; captured output is never deleted', () => {
  const state = scratch()
  try {
    const empty = ensureLedgerDir(state, 'foc-fail-p0')
    assert.equal(discardEmptyLedgerDir(state, 'foc-fail-p0'), true)
    assert.equal(existsSync(empty.dir), false)
    const used = ensureLedgerDir(state, 'foc-used-p0')
    writeFileSync(used.logPath, 'real output')
    assert.equal(discardEmptyLedgerDir(state, 'foc-used-p0'), false, 'output is never discarded')
    assert.equal(readFileSync(used.logPath, 'utf8'), 'real output')
    writeFileSync(join(used.dir, 'pane.log.truncated'), '{}')
    const marked = ensureLedgerDir(state, 'foc-marked-p0')
    writeFileSync(join(marked.dir, 'pane.log.truncated'), '{}')
    assert.equal(
      discardEmptyLedgerDir(state, 'foc-marked-p0'),
      false,
      'a dir with other content is left alone',
    )
    assert.equal(discardEmptyLedgerDir(state, '../escape'), false, 'invalid ids refuse')
    assert.equal(discardEmptyLedgerDir(state, 'foc-never-existed-p0'), false)
  } finally {
    rmSync(state, { recursive: true, force: true })
  }
})
