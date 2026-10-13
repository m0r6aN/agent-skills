import assert from 'node:assert/strict'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import type { LedgerProbes, OutputFact, TmuxSessionFact } from '../src/ledger.js'
import type { TranscriptFact } from '../src/ledger-transcript.js'
import { ATTENTION_WINDOW_MS, sessionStateProvider } from '../src/signals-session.js'
import { listSpawnReceipts, recordSpawnReceipt, type SpawnReceipt } from '../src/spawn.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P7 AC6 (additive API) and the session-state severity rules. Receipts are
 * written directly so legacy and ledger-era shapes can be compared side by side.
 */
const NOW = Date.parse('2026-10-13T12:10:00.000Z')

const SCENARIO: Scenario = {
  name: 'ledger-api',
  now: '2026-10-13T12:10:00.000Z',
  goal: {
    slug: 'goal-l',
    queue: ['1. **P1** dispatched; quiet.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [],
  chains: [],
  worktrees: [],
  expected: [],
}

const LEGACY: SpawnReceipt = {
  id: 'foc-old-p0',
  sessionName: 'foc-old',
  paneIndex: 0,
  harness: 'pi',
  model: 'm',
  thinking: 'high',
  budget: '$1',
  autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
  repoRoot: '/nonexistent/repo',
  worktreePath: '/nonexistent/repo-worktrees/old',
  promptDigest: 'd',
  argv: ['pi'],
  createdAt: '2026-10-12T22:54:24.462Z',
}
const MODERN: SpawnReceipt = {
  ...LEGACY,
  id: 'foc-new-p0',
  sessionName: 'foc-new',
  worktreePath: '/nonexistent/repo-worktrees/new',
  createdAt: '2026-10-13T12:00:00.000Z',
  baseCommit: 'abc',
  branch: 'spawn/new',
  ledgerDir: 'sessions/foc-new-p0',
  tmuxPaneId: '%1',
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
const MISSING_GIT = {
  worktree: 'missing',
  branch: null,
  commitsAhead: null,
  dirtyFiles: null,
  pushed: null,
} as const
const ERROR_LINE = 'Error: Model "m" is ambiguous across providers: a/m, b/m.'
const OUTPUT: OutputFact = {
  source: 'log',
  logPath: '/x',
  present: true,
  bytes: 9,
  tail: [ERROR_LINE],
  providerError: ERROR_LINE,
  truncated: false,
}

function probes(tmux: TmuxSessionFact, over: { transcript?: TranscriptFact } = {}): LedgerProbes {
  return {
    tmux: () => tmux,
    transcript: () => over.transcript ?? NO_TRANSCRIPT,
    git: () => MISSING_GIT,
    output: () => OUTPUT,
  }
}
const dead = (status: number): TmuxSessionFact => ({
  kind: 'found',
  panes: [
    {
      paneId: '%1',
      paneIndex: 1,
      dead: true,
      deadStatus: status,
      deadSignal: null,
      deadTime: null,
    },
  ],
})

test('AC6: GET /api/spawns adds only `ledger`; every original field is byte-identical; legacy reads unknown', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, LEGACY)
    const result = handleApi(
      config,
      { method: 'GET', pathname: '/api/spawns', query: new URLSearchParams(), body: {} },
      NOW,
    )
    assert.equal(result.status, 200)
    const [row] = (result.json as { spawns: Record<string, unknown>[] }).spawns
    assert.ok(row)
    const { ledger, liveness, ...original } = row
    assert.deepEqual(
      original,
      listSpawnReceipts(config.stateDir)[0],
      'original receipt fields untouched',
    )
    assert.ok(liveness === 'alive' || liveness === 'exited', 'liveness field preserved')
    const entry = ledger as {
      ledger: string
      state: string
      git: { commitsAhead: number | null }
      transcript: { link: string }
    }
    assert.equal(entry.ledger, 'absent')
    assert.equal(entry.state, 'unknown')
    assert.equal(entry.git.commitsAhead, null)
  })
})

test('session-state severity: failures need attention, clean/legacy stay info, live is quiet', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, MODERN)
    const collect = (tmux: TmuxSessionFact, transcript?: TranscriptFact) =>
      sessionStateProvider.collect(config, NOW, undefined, probes(tmux, { transcript }))

    const failed = collect(dead(1))
    assert.equal(failed.length, 1)
    assert.equal(failed[0]?.severity, 'attention')
    assert.ok(
      failed[0]?.evidence.includes(`output: ${ERROR_LINE}`),
      'provider error line is in the signal evidence',
    )
    assert.ok(failed[0]?.evidence.includes('ledger: exited-error'))
    assert.equal(collect({ kind: 'absent' })[0]?.severity, 'attention', 'vanished')
    assert.equal(collect(dead(0))[0]?.severity, 'attention', 'no-transcript')
    const clean = collect(dead(0), { ...NO_TRANSCRIPT, link: 'linked', messages: 4 })
    assert.equal(clean[0]?.severity, 'info', 'exited-clean')
    assert.deepEqual(
      collect(
        {
          kind: 'found',
          panes: [
            {
              paneId: '%1',
              paneIndex: 1,
              dead: false,
              deadStatus: null,
              deadSignal: null,
              deadTime: null,
            },
          ],
        },
        { ...NO_TRANSCRIPT, link: 'linked', messages: 2 },
      ),
      [],
      'running',
    )
    assert.deepEqual(
      collect({ kind: 'unavailable', reason: 'tmux is not installed' }),
      [],
      'nothing observed, nothing flagged',
    )
  })
})

test('AC5: a legacy receipt with no tmux session never raises attention', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, LEGACY)
    const signals = sessionStateProvider.collect(config, NOW, undefined, probes({ kind: 'absent' }))
    assert.equal(signals.length, 1)
    assert.equal(signals[0]?.severity, 'info')
    assert.ok(signals[0]?.evidence.some((line) => line.includes('predates the session ledger')))
  })
})

test('review #6: a legacy receipt never raises attention, even if tmux reports it dead with a failing status', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, LEGACY)
    const signals = sessionStateProvider.collect(config, NOW, undefined, probes(dead(1)))
    assert.equal(signals.length, 1)
    assert.equal(
      signals[0]?.severity,
      'info',
      'AC5: missing ledger data is not evidence of failure',
    )
  })
})

test('review #5: failures fade to info after the attention window; fresh ones demand attention', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, MODERN)
    const collectAt = (at: number) =>
      sessionStateProvider.collect(config, at, undefined, probes(dead(1)))
    const fresh = collectAt(Date.parse(MODERN.createdAt) + ATTENTION_WINDOW_MS - 1)
    assert.equal(fresh[0]?.severity, 'attention')
    const old = collectAt(Date.parse(MODERN.createdAt) + ATTENTION_WINDOW_MS + 1)
    assert.equal(old.length, 1, 'still listed for the record')
    assert.equal(old[0]?.severity, 'info')
    assert.ok(old[0]?.evidence.some((line) => line.includes('older than 72 h')))
  })
})

test('review #5: tmux unavailable (e.g. wrong socket directory, permissions) flags nothing — never every receipt as vanished', () => {
  withTempRepo(SCENARIO, ({ config }) => {
    recordSpawnReceipt(config.stateDir, MODERN)
    recordSpawnReceipt(config.stateDir, { ...MODERN, id: 'foc-new-p1', paneIndex: 1 })
    const signals = sessionStateProvider.collect(
      config,
      NOW,
      undefined,
      probes({
        kind: 'unavailable',
        reason: 'tmux failed: error connecting to /tmp/tmux-0/default (Permission denied)',
      }),
    )
    assert.deepEqual(signals, [])
  })
})
