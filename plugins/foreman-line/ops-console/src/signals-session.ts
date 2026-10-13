import { execFileSync } from 'node:child_process'
import type { ConsoleConfig } from './config.js'
import { type LedgerProbes, ledgerEntries, liveProbes } from './ledger.js'
import { makeSignal, type Signal, type SignalProvider } from './signals.js'
import { listSpawnReceipts } from './spawn.js'

/**
 * FCA-P3 `session-state` provider (class decided 2026-10-11: its own closed
 * class, not folded into `goal-hygiene` — spawn lifecycle is independently
 * filterable). Pane liveness is derived per scan from tmux (D2/D3: nothing
 * stored beyond the receipt's own facts); dead/exited panes surface as
 * `info` signals naming the session pane and its worktree (which hygiene
 * flows reap — lumber-jack).
 */

/** Failures older than this stay listed but stop demanding attention (no signal lives forever). */
export const ATTENTION_WINDOW_MS = 72 * 3_600_000

export interface SessionProbe {
  readonly sessionAlive: (sessionName: string) => boolean
}

export function sessionProbeFor(repoRoot: string): SessionProbe {
  return {
    // A2.9: explicit root anchor — the tmux client never inherits the
    // console process's cwd (D19 class-4 non-instance).
    sessionAlive: (sessionName) => {
      try {
        // `=name` is an exact match; a bare name prefix-matches other sessions.
        execFileSync('tmux', ['has-session', '-t', `=${sessionName}`], {
          cwd: repoRoot,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
        return true
      } catch {
        return false
      }
    },
  }
}

/** A ledger probe set whose tmux fact comes from an injected liveness check. */
function probesFromLiveness(base: LedgerProbes, probe: SessionProbe): LedgerProbes {
  return {
    ...base,
    tmux: (sessionName) =>
      probe.sessionAlive(sessionName) ? { kind: 'found', panes: [] } : { kind: 'absent' },
  }
}

export const sessionStateProvider: SignalProvider & {
  collect(
    config: ConsoleConfig,
    now: number,
    probe?: SessionProbe,
    ledgerProbes?: LedgerProbes,
  ): Signal[]
} = {
  class: 'session-state',
  collect(
    config: ConsoleConfig,
    now: number,
    probe?: SessionProbe,
    ledgerProbes?: LedgerProbes,
  ): Signal[] {
    const detectedAt = new Date(now).toISOString()
    const receipts = listSpawnReceipts(config.stateDir)
    const base = ledgerProbes ?? liveProbes(config)
    const entries = ledgerEntries(
      receipts,
      probe === undefined ? base : probesFromLiveness(base, probe),
      now,
    )
    const signals: Signal[] = []
    for (const receipt of receipts) {
      if (probe?.sessionAlive(receipt.sessionName) === true) continue
      const entry = entries.get(receipt.id)
      if (entry === undefined) continue
      // Live panes (and the launch grace window) need no attention.
      if (entry.state === 'running' || entry.state === 'launching') continue
      // A pane that ended without a clean, evidenced run is a failure to look
      // at; a clean exit and a legacy/unknown record stay informational.
      const failedState =
        entry.state === 'exited-error' ||
        entry.state === 'no-transcript' ||
        entry.state === 'vanished'
      // Legacy receipts (no ledger fields) can never raise attention: missing
      // ledger data is not evidence of failure (AC5). Old failures fade to info.
      const age = now - (Date.parse(receipt.createdAt) || now)
      const stale = age > ATTENTION_WINDOW_MS
      const failed = failedState && entry.ledger === 'present' && !stale
      // tmux itself unavailable: nothing was observed, so nothing is flagged.
      if (entry.tmux === 'unavailable') continue
      signals.push(
        makeSignal({
          class: 'session-state',
          severity: failed ? 'attention' : 'info',
          repo: receipt.repoRoot,
          subject: `${receipt.sessionName}-p${receipt.paneIndex}`,
          evidence: [
            receipt.worktreePath,
            `harness: ${receipt.harness} ${receipt.model}`,
            `ledger: ${entry.state}`,
            ...entry.evidence,
            ...(failedState && entry.ledger === 'present' && stale
              ? ['older than 72 h: listed for the record, no longer demanding attention']
              : []),
            'worktree left for hygiene reaping (lumber-jack)',
          ],
          detectedAt,
          actions: ['investigate', 'explain', 'close-delete'],
        }),
      )
    }
    return signals
  },
}
