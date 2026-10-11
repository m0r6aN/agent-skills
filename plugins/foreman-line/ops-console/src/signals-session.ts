import { execFileSync } from 'node:child_process'
import type { ConsoleConfig } from './config.js'
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

export interface SessionProbe {
  readonly sessionAlive: (sessionName: string) => boolean
}

export const defaultSessionProbe: SessionProbe = {
  sessionAlive: (sessionName) => {
    try {
      execFileSync('tmux', ['has-session', '-t', sessionName], {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      return true
    } catch {
      return false
    }
  },
}

export const sessionStateProvider: SignalProvider & {
  collect(config: ConsoleConfig, now: number, probe?: SessionProbe): Signal[]
} = {
  class: 'session-state',
  collect(config: ConsoleConfig, now: number, probe: SessionProbe = defaultSessionProbe): Signal[] {
    const detectedAt = new Date(now).toISOString()
    const signals: Signal[] = []
    for (const receipt of listSpawnReceipts(config.stateDir)) {
      if (probe.sessionAlive(receipt.sessionName)) continue
      signals.push(
        makeSignal({
          class: 'session-state',
          severity: 'info',
          repo: receipt.repoRoot,
          subject: `${receipt.sessionName}-p${receipt.paneIndex}`,
          evidence: [
            receipt.worktreePath,
            `harness: ${receipt.harness} ${receipt.model}`,
            'session exited — worktree left for hygiene reaping (lumber-jack)',
          ],
          detectedAt,
          actions: ['investigate', 'explain', 'close-delete'],
        }),
      )
    }
    return signals
  },
}
