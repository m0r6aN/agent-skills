import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { deriveLedgerEntry, liveProbes } from '../src/ledger.js'
import { piSessionDirName } from '../src/ledger-transcript.js'
import { launchSpawnPlan, listSpawnReceipts, planSpawn, tmuxRunnerFor } from '../src/spawn.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FCA-P7 AC1/AC2 against a REAL tmux (private socket, never the operator's
 * server) and a REAL disposable git repo. A fake `pi` earlier on PATH stands in
 * for the harness so each outcome is deterministic; everything else - the
 * launcher, worktree cut, tmux hardening, capture, ledger derivation - is the
 * production path. Reproduces the 2026-10-13 failure class: a harness that dies
 * at startup with an error on its first line.
 */
const NOW = Date.parse('2026-10-13T12:00:00.000Z')
const SOCKET = `ledger-test-${process.pid}`

function tmuxPresent(): boolean {
  try {
    execFileSync('tmux', ['-V'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const SCENARIO: Scenario = {
  name: 'ledger-tmux',
  now: '2026-10-13T12:00:00.000Z',
  goal: {
    slug: 'goal-ledger',
    queue: ['1. **P1** dispatched; quiet.'],
    charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
  },
  specs: [],
  chains: [],
  worktrees: [],
  expected: [],
}

function sh(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    stdio: 'ignore',
  })
}

async function waitFor(check: () => boolean, ms = 8000): Promise<void> {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (check()) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('timed out waiting for condition')
}

interface Harness {
  root: string
  repo: string
  piSessions: string
  config: ReturnType<typeof materialize>['config']
  cleanup: () => void
}

function setup(fakePi: string): Harness {
  const root = mkdtempSync(join(tmpdir(), 'ledger-tmux-'))
  const { config } = materialize(join(root, 'console'), SCENARIO)
  const repo = join(root, 'repo')
  mkdirSync(repo)
  execFileSync('git', ['init', '-q', '-b', 'main', repo])
  writeFileSync(join(repo, 'a.txt'), '1')
  sh(repo, 'add', '.')
  sh(repo, 'commit', '-q', '-m', 'base')
  const bin = join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'pi'), `#!/bin/sh\n${fakePi}\n`)
  chmodSync(join(bin, 'pi'), 0o755)
  const piSessions = join(root, 'pi-sessions')
  mkdirSync(piSessions)
  const savedPath = process.env.PATH
  const savedSessions = process.env.FOC_PI_SESSIONS_DIR
  process.env.PATH = `${bin}:${savedPath}`
  process.env.FOC_PI_SESSIONS_DIR = piSessions
  return {
    root,
    repo,
    piSessions,
    config,
    cleanup: () => {
      try {
        execFileSync('tmux', ['-L', SOCKET, 'kill-server'], { stdio: 'ignore' })
      } catch {
        /* server already gone */
      }
      process.env.PATH = savedPath
      if (savedSessions === undefined) delete process.env.FOC_PI_SESSIONS_DIR
      else process.env.FOC_PI_SESSIONS_DIR = savedSessions
      rmSync(root, { recursive: true, force: true })
    },
  }
}

function launch(h: Harness, subjects: string[], sessionName: string) {
  const plan = planSpawn({
    controls: { harness: 'pi', model: 'test/m', thinking: 'high', budget: '$1' },
    actions: subjects.map((subject) => ({
      verb: 'explain',
      signalClass: 'parcel-state',
      subject,
      evidence: ['e'],
      repoRoot: h.repo,
    })),
    now: NOW,
    sessionName,
  })
  launchSpawnPlan(h.config, plan, NOW, { tmux: tmuxRunnerFor(h.config.repoRoot, SOCKET) })
  return listSpawnReceipts(h.config.stateDir).filter((r) => r.sessionName === sessionName)
}

// Matched by pane id, never by index: tmux may number panes from 1.
function paneDead(paneId: string | null | undefined): boolean {
  try {
    const out = execFileSync(
      'tmux',
      ['-L', SOCKET, 'list-panes', '-a', '-F', '#{pane_id} #{pane_dead}'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
    return out.split('\n').includes(`${paneId} 1`)
  } catch {
    return false
  }
}

const skip = tmuxPresent() ? false : 'tmux is not installed'

test('AC1/AC2: a harness that fails at startup is retained, attachable, and ledgered with its error line', {
  skip,
}, async () => {
  const errorLine =
    'Error: Model "m" is ambiguous across providers: a/m, b/m. Use --provider or provider/model.'
  const h = setup(`echo '${errorLine}'\nexit 1`)
  try {
    const [receipt] = launch(h, ['fails-fast'], 'ledger-fail')
    assert.ok(receipt)
    await waitFor(() => paneDead(receipt.tmuxPaneId))

    // The regression this parcel exists for: without remain-on-exit the dead
    // pane takes the session (and the tmux server) with it and the error is lost.
    execFileSync('tmux', ['-L', SOCKET, 'has-session', '-t', 'ledger-fail'], { stdio: 'ignore' })

    const entry = deriveLedgerEntry(receipt, liveProbes(h.config, SOCKET), NOW + 60_000)
    assert.equal(entry.state, 'exited-error')
    assert.equal(entry.exit.status, 1)
    assert.ok(entry.exit.at !== null)
    assert.equal(entry.output.providerError, errorLine, 'error captured verbatim from the pane')
    assert.ok(entry.evidence.some((line) => line.includes('never exchanged a message')))
    assert.equal(entry.transcript.link, 'none')
    assert.equal(entry.git.worktree, 'present')
    assert.equal(entry.git.commitsAhead, 0)
    assert.equal(entry.orphanClean, true)
    assert.equal(receipt.baseCommit?.length, 40)
  } finally {
    h.cleanup()
  }
})

test('two panes: per-pane status, ids, and capture attached to a later pane', {
  skip,
}, async () => {
  const h = setup(
    `case "$*" in\n  *p0*) echo pane-zero-failed; exit 3 ;;\n  *) echo hello-from-pane1; sleep 30 ;;\nesac`,
  )
  try {
    const receipts = launch(h, ['one', 'two'], 'ledger-two')
    assert.equal(receipts.length, 2)
    await waitFor(() => paneDead(receipts[0]?.tmuxPaneId))
    const probes = liveProbes(h.config, SOCKET)
    const [p0, p1] = receipts as [(typeof receipts)[number], (typeof receipts)[number]]
    assert.notEqual(p0.tmuxPaneId, p1.tmuxPaneId)
    const dead = deriveLedgerEntry(p0, probes, NOW + 60_000)
    assert.equal(dead.state, 'exited-error')
    assert.equal(dead.exit.status, 3)
    await waitFor(() =>
      deriveLedgerEntry(p1, probes, NOW + 60_000).output.tail.includes('hello-from-pane1'),
    )
    const alive = deriveLedgerEntry(p1, probes, NOW + 60_000)
    assert.equal(alive.state, 'running')
    assert.equal(alive.exit.status, null)
  } finally {
    h.cleanup()
  }
})

test('exit 0 without a transcript is no-transcript; with a linked transcript it is exited-clean', {
  skip,
}, async () => {
  // Fake pi that writes a pi-shaped transcript for its own cwd when asked to.
  const h = setup(
    `if [ -n "$FAKE_WRITE_TRANSCRIPT" ]; then\n  d="$FOC_PI_SESSIONS_DIR/--$(printf %s "$PWD" | sed 's#^/##; s#[/:]#-#g')--"\n  mkdir -p "$d"\n  printf '{"type":"session","cwd":"%s"}\\n{"type":"message","timestamp":"2026-10-13T12:00:01Z","message":{"role":"user"}}\\n{"type":"message","timestamp":"2026-10-13T12:00:02Z","message":{"role":"assistant","stopReason":"stop","usage":{"cost":{"total":0.5}}}}\\n' "$PWD" > "$d/s.jsonl"\nfi\nexit 0`,
  )
  try {
    const [bare] = launch(h, ['bare'], 'ledger-bare')
    assert.ok(bare)
    await waitFor(() => paneDead(bare.tmuxPaneId))
    assert.equal(
      deriveLedgerEntry(bare, liveProbes(h.config, SOCKET), NOW + 60_000).state,
      'no-transcript',
    )

    // A tmux server takes its environment from the client that started it, so
    // restart the private server for the second variant.
    execFileSync('tmux', ['-L', SOCKET, 'kill-server'], { stdio: 'ignore' })
    process.env.FAKE_WRITE_TRANSCRIPT = '1'
    try {
      const [written] = launch(h, ['written'], 'ledger-written')
      assert.ok(written)
      await waitFor(() => paneDead(written.tmuxPaneId))
      const entry = deriveLedgerEntry(written, liveProbes(h.config, SOCKET), NOW + 60_000)
      assert.equal(entry.state, 'exited-clean')
      assert.equal(entry.transcript.link, 'linked')
      assert.equal(entry.transcript.messages, 2)
      assert.equal(entry.transcript.costUsd, 0.5)
      assert.ok(piSessionDirName(written.worktreePath).startsWith('--'))
    } finally {
      delete process.env.FAKE_WRITE_TRANSCRIPT
    }
  } finally {
    h.cleanup()
  }
})

test('a session that no longer exists is vanished (ledger-era) - never silently clean', {
  skip,
}, async () => {
  const h = setup('sleep 30')
  try {
    const [receipt] = launch(h, ['gone'], 'ledger-gone')
    assert.ok(receipt)
    execFileSync('tmux', ['-L', SOCKET, 'kill-server'], { stdio: 'ignore' })
    const entry = deriveLedgerEntry(receipt, liveProbes(h.config, SOCKET), NOW + 60_000)
    assert.equal(entry.state, 'vanished')
    assert.ok(entry.evidence.some((line) => line.includes('gone')))
  } finally {
    h.cleanup()
  }
})
