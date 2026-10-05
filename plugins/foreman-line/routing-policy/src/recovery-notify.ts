/**
 * MRC-12 (HRO-P4c) — the effectful notification actuator (C7) and nothing
 * else: a pure platform command planner plus one guarded sink executor. No
 * background service of any kind (D10, `charter.md:109`) — no timers,
 * daemons, watchers, sockets, or long-lived handles anywhere in this module;
 * the CLI process runs to completion. Notifications are off by default and
 * fire at most once per distinct rendered warning/error, only behind
 * `--notify`. A failing notification changes nothing else: the machine report
 * stays byte-identical, the exit code is unchanged, and no routing outcome is
 * touched (C7.4).
 */
import {
  boundIdentifierText,
  type NotificationRequest,
  type NotificationSink,
  sanitizeForTerminal,
} from './recovery-diagnostics.js'

/** The platform argv to execute, or the no-spawn terminal-bell fallback. */
export type NotificationCommand =
  | { readonly kind: 'spawn'; readonly command: string; readonly args: readonly string[] }
  | { readonly kind: 'bell' }

/** Minimal structural seam over `child_process.spawnSync` (injected). */
export type SpawnSyncLike = (
  command: string,
  args: readonly string[],
) => { readonly error?: Error | null; readonly status?: number | null }

/** Renderer presentation constants for the audible tone, like the ANSI colors. */
const WARNING_BEEP = '[console]::beep(880,120)'
const ERROR_BEEP = '[console]::beep(520,240)'

/**
 * Pure platform planner (C7.3). `win32` gets a PowerShell audible invocation
 * (never a POSIX tool), `darwin` gets `osascript -e 'beep 1'`, and every other
 * platform — including unsupported ones — gets the terminal-bell fallback
 * (`\x07` to stderr, no spawn). Never throws.
 */
export function notificationCommand(
  platform: string,
  request: NotificationRequest,
): NotificationCommand {
  if (platform === 'win32') {
    return {
      kind: 'spawn',
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        request.severity === 'error' ? ERROR_BEEP : WARNING_BEEP,
      ],
    }
  }
  if (platform === 'darwin') {
    return { kind: 'spawn', command: 'osascript', args: ['-e', 'beep 1'] }
  }
  return { kind: 'bell' }
}

/**
 * Guarded executor: each request is planned and run inside try/catch plus
 * spawn-error handling. The first failure emits at most one stderr line
 * `warning: notification suppressed (<sanitized reason>)` and the sink retires
 * (every later request is a no-op) — failure isolation is byte-equality of
 * the machine report and an unchanged exit code, nothing else.
 */
export function createPlatformNotificationSink(init: {
  readonly platform: string
  readonly spawnSync: SpawnSyncLike
}): NotificationSink {
  let failed = false
  return (request: NotificationRequest): void => {
    if (failed) return
    const suppress = (rawReason: string): void => {
      failed = true
      const reason = boundIdentifierText(sanitizeForTerminal(rawReason))
      process.stderr.write(`warning: notification suppressed (${reason})\n`)
    }
    try {
      const command = notificationCommand(init.platform, request)
      if (command.kind === 'bell') {
        process.stderr.write('\x07')
        return
      }
      const result = init.spawnSync(command.command, command.args)
      if (result.error) {
        suppress(result.error.message)
      }
    } catch (err) {
      suppress(err instanceof Error ? err.message : String(err))
    }
  }
}
