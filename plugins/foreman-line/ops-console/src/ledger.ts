import { execFileSync } from 'node:child_process'
import { closeSync, openSync, readSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { type ConsoleConfig, ledgerDirPath } from './config.js'
import { type GitFact, makeGitCache } from './ledger-git.js'
import { LOG_NAME, TRUNCATED_NAME } from './ledger-store.js'
import {
  defaultPiSessionsDir,
  readPiTranscript,
  type TranscriptFact,
  UNKNOWN_TRANSCRIPT,
} from './ledger-transcript.js'
import type { SpawnReceipt } from './spawn.js'

/**
 * FCA-P7 session ledger: a per-pane outcome record DERIVED on every read from
 * observed facts - tmux pane status, the captured pane log, pi's own
 * transcript, and git. Nothing here is stored as status, and nothing infers
 * success from liveness: `exited-clean` means exit status 0, never "work
 * complete". Unknown stays unknown (charter D2/D4; FOC-P0 "derived from disk").
 *
 * Lifecycle vocabulary (closed):
 *   launching     pane alive, no transcript yet, younger than LAUNCH_GRACE_MS
 *   running       pane alive
 *   exited-clean  pane exited with status 0 and a transcript exists
 *   exited-error  pane exited non-zero or by signal
 *   no-transcript pane exited 0 but pi never exchanged a message
 *   vanished      ledger-era receipt whose tmux pane/session is gone and left
 *                 no retained exit status
 *   unknown       tmux unavailable, or a receipt that predates the ledger
 */

export type LifecycleState =
  | 'launching'
  | 'running'
  | 'exited-clean'
  | 'exited-error'
  | 'no-transcript'
  | 'vanished'
  | 'unknown'

export const LAUNCH_GRACE_MS = 30_000
export const TAIL_LINES = 20

export interface TmuxPaneFact {
  readonly paneId: string
  readonly paneIndex: number
  readonly dead: boolean
  readonly deadStatus: number | null
  readonly deadSignal: number | null
  /** Epoch seconds, as tmux reports `pane_dead_time`. */
  readonly deadTime: number | null
}

export type TmuxSessionFact =
  | { readonly kind: 'found'; readonly panes: readonly TmuxPaneFact[] }
  | { readonly kind: 'absent' }
  | { readonly kind: 'unavailable'; readonly reason: string }

export interface OutputFact {
  readonly logPath: string | null
  readonly present: boolean
  readonly bytes: number | null
  readonly tail: readonly string[]
  /** `screen`: the pane as rendered right now (tmux capture-pane); `log`: the captured stream, tail only. */
  readonly source: 'screen' | 'log' | 'none'
  /** First error-looking line, verbatim (ANSI stripped); evidence, never reclassified. */
  readonly providerError: string | null
  /** Retention removed older content (byte or pane-count cap). */
  readonly truncated: boolean
}

export interface LedgerEntry {
  readonly receiptId: string
  readonly state: LifecycleState
  /** What tmux said about this receipt's session: found, absent, or unavailable. */
  readonly tmux: TmuxSessionFact['kind']
  /** Receipt carries ledger fields; false = legacy receipt (all new facts unknown). */
  readonly ledger: 'present' | 'absent'
  readonly evidence: readonly string[]
  readonly exit: {
    readonly status: number | null
    readonly signal: number | null
    readonly at: string | null
  }
  readonly transcript: TranscriptFact
  readonly git: GitFact
  readonly output: OutputFact
  /** Worktree exists, no live pane, no commits, no dirty files (evidence only). */
  readonly orphanClean: boolean
}

export interface LedgerProbes {
  tmux(sessionName: string): TmuxSessionFact
  output(receipt: SpawnReceipt): OutputFact
  transcript(receipt: SpawnReceipt): TranscriptFact
  git(receipt: SpawnReceipt): GitFact
  /** The pane as rendered right now (what attaching would show); null if unavailable. */
  screen?(receipt: SpawnReceipt, paneId: string): string[] | null
}

// ------------------------------------------------------------------ output

// biome-ignore lint/suspicious/noControlCharactersInRegex: terminal escape stripping
const ANSI =
  /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b[@-Z\\-_]|\r/g
const ERROR_LINE =
  /^\s*(?:error|fatal)\b.*|upstream request failed.*|policy budget exceeded.*|\b(?:4\d\d|5\d\d)\b.*(?:error|failed|exceeded)/i
const MAX_TAIL_BYTES = 64 * 1024

export const MAX_LINE_CHARS = 400
/** Bound every displayed line: a TUI redraw can produce one enormous 'line'. */
export function capLine(line: string): string {
  return line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}…` : line
}

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '')
}

function readTailBytes(path: string, size: number): string {
  const length = Math.min(MAX_TAIL_BYTES, size)
  const buffer = Buffer.alloc(length)
  const fd = openSync(path, 'r')
  try {
    readSync(fd, buffer, 0, length, size - length)
  } finally {
    closeSync(fd)
  }
  return buffer.toString('utf8')
}

const NO_OUTPUT: OutputFact = {
  logPath: null,
  present: false,
  bytes: null,
  tail: [],
  source: 'none',
  providerError: null,
  truncated: false,
}

export function readPaneOutput(stateDir: string, receipt: SpawnReceipt): OutputFact {
  if (typeof receipt.ledgerDir !== 'string') return NO_OUTPUT
  let dir: string
  try {
    dir = ledgerDirPath(stateDir, receipt.id)
  } catch {
    return NO_OUTPUT
  }
  const logPath = join(dir, LOG_NAME)
  let truncated = false
  try {
    statSync(join(dir, TRUNCATED_NAME))
    truncated = true
  } catch {
    // no marker: nothing was removed
  }
  try {
    const size = statSync(logPath).size
    const lines = stripAnsi(readTailBytes(logPath, size))
      .split('\n')
      .map((line) => line.replace(/\s+$/, ''))
      .filter((line) => line !== '')
    return {
      logPath,
      present: true,
      bytes: size,
      tail: lines.slice(-TAIL_LINES).map(capLine),
      source: 'log',
      // The LATEST error-looking line is the one that explains how the pane ended.
      providerError: [...lines].reverse().find((line) => ERROR_LINE.test(line)) ?? null,
      truncated,
    }
  } catch {
    return { ...NO_OUTPUT, logPath, truncated }
  }
}

// -------------------------------------------------------------------- tmux

const PANE_FORMAT =
  '#{pane_id}\t#{pane_index}\t#{pane_dead}\t#{pane_dead_status}\t#{pane_dead_signal}\t#{pane_dead_time}'

function intOrNull(raw: string | undefined): number | null {
  return raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null
}

export function parsePaneList(output: string): TmuxPaneFact[] {
  return output
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [paneId, index, dead, status, signal, time] = line.split('\t')
      return {
        paneId: paneId ?? '',
        paneIndex: intOrNull(index) ?? -1,
        dead: dead === '1',
        deadStatus: intOrNull(status),
        deadSignal: intOrNull(signal),
        deadTime: intOrNull(time),
      }
    })
}

/**
 * A tmux failure is "absent" only when tmux says there is no such session or no
 * server. Anything else (permissions, a wrong socket directory, a broken
 * install) is NOT evidence that the session is gone - it is unavailable, so a
 * console started with a different environment cannot mark every receipt
 * `vanished`.
 */
export function classifyTmuxFailure(stderr: string, code: string | undefined): TmuxSessionFact {
  if (code === 'ENOENT') return { kind: 'unavailable', reason: 'tmux is not installed' }
  if (
    /can't find (?:session|window|pane)|no server running|server exited unexpectedly|lost server|no current target|no sessions|error connecting to .*(No such file or directory|Connection refused)/i.test(
      stderr,
    )
  ) {
    return { kind: 'absent' }
  }
  const first = stderr
    .split('\n')
    .find((line) => line.trim() !== '')
    ?.trim()
  return { kind: 'unavailable', reason: `tmux failed: ${first ?? 'unknown error'}` }
}

/** tmux probe anchored to an explicit root; `socket` selects a private server (tests). */
export function tmuxProbeFor(repoRoot: string, socket?: string): LedgerProbes['tmux'] {
  const prefix = socket === undefined ? [] : ['-L', socket]
  return (sessionName) => {
    try {
      const out = execFileSync(
        'tmux',
        [...prefix, 'list-panes', '-s', '-t', `=${sessionName}`, '-F', PANE_FORMAT],
        { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      )
      return { kind: 'found', panes: parsePaneList(out) }
    } catch (error) {
      const e = error as NodeJS.ErrnoException & { stderr?: Buffer | string }
      return classifyTmuxFailure(e.stderr === undefined ? '' : String(e.stderr), e.code)
    }
  }
}

/** Git outcomes are memoised briefly so a refresh does not re-spawn git per receipt. */
export const GIT_CACHE_TTL_MS = 15_000
const sharedGitCache = makeGitCache(GIT_CACHE_TTL_MS)

export function liveProbes(
  config: ConsoleConfig,
  socket?: string,
  gitTtlMs?: number,
): LedgerProbes {
  const sessionsRoot = defaultPiSessionsDir()
  const gitCache = gitTtlMs === undefined ? sharedGitCache : makeGitCache(gitTtlMs)
  return {
    tmux: tmuxProbeFor(config.repoRoot, socket),
    output: (receipt) => readPaneOutput(config.stateDir, receipt),
    transcript: (receipt) => readPiTranscript(sessionsRoot, receipt.worktreePath),
    git: (receipt) => gitCache.outcome(receipt.worktreePath, receipt.baseCommit ?? null),
    screen: (_receipt, paneId) => captureScreen(config.repoRoot, paneId, socket),
  }
}

/**
 * The rendered pane (`tmux capture-pane -p -J`): readable even for full-screen TUIs, whose raw
 * stream is cursor-escape noise. `-J` joins lines the terminal width wrapped, so an error
 * message stays one verbatim line. Works while the pane (alive or retained-dead) exists.
 */
export function captureScreen(repoRoot: string, paneId: string, socket?: string): string[] | null {
  if (!/^%\d+$/.test(paneId)) return null
  try {
    const out = execFileSync(
      'tmux',
      [
        ...(socket === undefined ? [] : ['-L', socket]),
        'capture-pane',
        '-p',
        '-J',
        '-t',
        paneId,
        '-S',
        '-200',
      ],
      { cwd: repoRoot, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] },
    )
    return out
      .split('\n')
      .map((line) => line.replace(/\s+$/, ''))
      .filter((line) => line !== '')
      .slice(-TAIL_LINES)
      .map(capLine)
  } catch {
    return null
  }
}

// -------------------------------------------------------------- derivation

interface PaneMatch {
  readonly pane: TmuxPaneFact | null
  /** No pane id was recorded and the pane count does not match the receipts: attribution is a guess. */
  readonly ambiguous: boolean
}

function paneFor(
  receipt: SpawnReceipt,
  panes: readonly TmuxPaneFact[],
  siblings: number | undefined,
): PaneMatch {
  if (typeof receipt.tmuxPaneId === 'string') {
    return {
      pane: panes.find((pane) => pane.paneId === receipt.tmuxPaneId) ?? null,
      ambiguous: false,
    }
  }
  // No pane id (legacy, or the launcher could not capture it). tmux numbers panes from
  // `pane-base-index` (1 on some machines), so a 0-based paneIndex is matched by creation
  // ORDER - but only when tmux still holds exactly as many panes as there are receipts for
  // this session. Otherwise a pane has been lost and order no longer identifies anyone.
  if (siblings !== undefined && panes.length !== siblings) return { pane: null, ambiguous: true }
  const ordered = [...panes].sort((a, b) => a.paneIndex - b.paneIndex)
  return { pane: ordered[receipt.paneIndex] ?? null, ambiguous: false }
}

function isoFromEpochSeconds(seconds: number | null): string | null {
  return seconds === null ? null : new Date(seconds * 1000).toISOString()
}

/** Prefer the rendered screen for the tail (readable); keep the log's error line if the screen has none. */
function withScreen(output: OutputFact, screen: string[] | null): OutputFact {
  if (screen === null || screen.length === 0) return output
  const error = [...screen].reverse().find((line) => ERROR_LINE.test(line)) ?? null
  return { ...output, tail: screen, source: 'screen', providerError: error ?? output.providerError }
}

export function deriveLedgerEntry(
  receipt: SpawnReceipt,
  probes: LedgerProbes,
  now: number,
  /** Receipts recorded for this tmux session (for pane attribution without a pane id). */
  siblings?: number,
): LedgerEntry {
  const ledger: LedgerEntry['ledger'] = typeof receipt.ledgerDir === 'string' ? 'present' : 'absent'
  const tmux = probes.tmux(receipt.sessionName)
  const transcript = probes.transcript(receipt)
  const git = probes.git(receipt)
  let output = probes.output(receipt)
  const evidence: string[] = []
  let exit: LedgerEntry['exit'] = { status: null, signal: null, at: null }
  let state: LifecycleState = 'unknown'
  let paneAlive = false

  const noMessages = transcript.link === 'none' || transcript.messages === 0
  const transcriptFailed = transcript.link === 'linked' && transcript.lastStopReason === 'error'
  const age = now - (Date.parse(receipt.createdAt) || now)

  if (tmux.kind === 'unavailable') {
    evidence.push(`tmux unavailable: ${tmux.reason}`)
  } else {
    const match =
      tmux.kind === 'found'
        ? paneFor(receipt, tmux.panes, siblings)
        : { pane: null, ambiguous: false }
    const pane = match.pane
    if (match.ambiguous) {
      state = 'unknown'
      evidence.push(
        'cannot attribute panes: no pane id was recorded and tmux no longer holds one pane per receipt of this session',
      )
    } else if (pane !== null && !pane.dead) {
      paneAlive = true
      output = withScreen(output, probes.screen?.(receipt, pane.paneId) ?? null)
      if (noMessages && age < LAUNCH_GRACE_MS) {
        state = 'launching'
        evidence.push('pane alive; no transcript yet (within launch grace)')
      } else {
        state = 'running'
        if (noMessages) evidence.push('pane alive but pi has written no transcript')
      }
    } else if (pane !== null) {
      output = withScreen(output, probes.screen?.(receipt, pane.paneId) ?? null)
      exit = {
        status: pane.deadStatus,
        signal: pane.deadSignal,
        at: isoFromEpochSeconds(pane.deadTime),
      }
      if (pane.deadSignal !== null) {
        state = 'exited-error'
        evidence.push(`pane killed by signal ${pane.deadSignal}`)
      } else if (pane.deadStatus === 0) {
        // Exit 0 is not success: pi records a provider failure (e.g. a 429) as
        // an assistant message with stopReason "error" and still exits cleanly.
        // If the transcript cannot be read or joined, the ending cannot be checked: unknown, not clean.
        const endingCheckable = noMessages || transcript.link === 'linked'
        state = noMessages
          ? 'no-transcript'
          : transcriptFailed
            ? 'exited-error'
            : endingCheckable
              ? 'exited-clean'
              : 'unknown'
        evidence.push(
          'pane exited with status 0 (process ended; this is not proof the work is complete)',
        )
        if (!endingCheckable) {
          evidence.push(
            'exit status 0, but the transcript could not be joined, so whether it ended in an error is unknown',
          )
        }
      } else if (pane.deadStatus !== null) {
        state = 'exited-error'
        evidence.push(`pane exited with status ${pane.deadStatus}`)
      } else {
        state = 'unknown'
        evidence.push('pane is dead but tmux reported no exit status')
      }
    } else if (ledger === 'present') {
      state = 'vanished'
      evidence.push('tmux session/pane is gone and no exit status was retained')
    } else {
      evidence.push('receipt predates the session ledger; no pane record was retained')
    }
  }

  if (state === 'exited-error' || state === 'no-transcript' || state === 'vanished') {
    if (noMessages)
      evidence.push(
        'no transcript: pi never exchanged a message (prompt not delivered or session failed at startup)',
      )
  }
  if (transcriptFailed) {
    evidence.push(
      `transcript: the last assistant message ended with an error${transcript.lastErrorMessage === null ? '' : `: ${transcript.lastErrorMessage}`}`,
    )
  } else if (transcript.link === 'linked' && transcript.lastStopReason === 'aborted') {
    evidence.push('transcript: the last assistant message was aborted')
  }
  if (transcript.link === 'unknown') {
    evidence.push('transcript could not be read or is too large to summarize: the join is unknown')
  } else if (transcript.link === 'none' && transcript.rejected > 0) {
    evidence.push(
      `${transcript.rejected} transcript file(s) in the session directory name a different working directory and were not used`,
    )
  }
  if (transcript.link === 'ambiguous') {
    evidence.push(`transcript join ambiguous: ${transcript.files.length} candidate files`)
  }
  if (output.providerError !== null) evidence.push(`output: ${output.providerError}`)
  if (output.truncated) evidence.push('pane log truncated by retention')
  if (ledger === 'absent' && output.present === false)
    evidence.push('no captured output (legacy receipt)')

  // "No live pane" is only a fact when tmux actually answered.
  const orphanClean =
    tmux.kind !== 'unavailable' &&
    !paneAlive &&
    git.worktree === 'present' &&
    git.commitsAhead === 0 &&
    git.dirtyFiles === 0
  if (orphanClean)
    evidence.push('orphan-clean: worktree has no commits and no changes and no live pane')

  return {
    receiptId: receipt.id,
    state,
    tmux: tmux.kind,
    ledger,
    evidence,
    exit,
    transcript,
    git,
    output,
    orphanClean,
  }
}

/** Upper bound on how long one ledger pass may spend probing (the server is single-threaded). */
export const LEDGER_BUDGET_MS = 8000

const UNKNOWN_GIT: GitFact = {
  worktree: 'unknown',
  branch: null,
  commitsAhead: null,
  dirtyFiles: null,
  pushed: null,
}

/**
 * Derive ledger entries for many receipts in one pass. tmux is probed once per
 * session (a session holds many panes), so a refresh costs one `list-panes` per
 * session, not one per receipt. Probing is time-boxed: once the budget is spent the
 * remaining receipts keep their tmux-derived state but report git/transcript/screen as
 * unknown with an explicit evidence line, so a slow disk cannot stall the console.
 */
export function ledgerEntries(
  receipts: readonly SpawnReceipt[],
  probes: LedgerProbes,
  now: number,
  budgetMs: number = LEDGER_BUDGET_MS,
  clock: () => number = Date.now,
): Map<string, LedgerEntry> {
  const started = clock()
  const tmuxMemo = new Map<string, TmuxSessionFact>()
  const siblingCount = new Map<string, number>()
  for (const receipt of receipts) {
    siblingCount.set(receipt.sessionName, (siblingCount.get(receipt.sessionName) ?? 0) + 1)
  }
  const skipped = new Set<string>()
  const overBudget = (receipt: SpawnReceipt): boolean => {
    if (clock() - started <= budgetMs) return false
    skipped.add(receipt.id)
    return true
  }
  const bounded: LedgerProbes = {
    ...probes,
    tmux: (sessionName) => {
      const hit = tmuxMemo.get(sessionName)
      if (hit !== undefined) return hit
      const fact = probes.tmux(sessionName)
      tmuxMemo.set(sessionName, fact)
      return fact
    },
    transcript: (receipt) =>
      overBudget(receipt) ? UNKNOWN_TRANSCRIPT : probes.transcript(receipt),
    git: (receipt) => (overBudget(receipt) ? UNKNOWN_GIT : probes.git(receipt)),
    ...(probes.screen === undefined
      ? {}
      : {
          screen: (receipt: SpawnReceipt, paneId: string) =>
            overBudget(receipt) ? null : (probes.screen?.(receipt, paneId) ?? null),
        }),
  }
  const entries = new Map<string, LedgerEntry>()
  for (const receipt of receipts) {
    const entry = deriveLedgerEntry(receipt, bounded, now, siblingCount.get(receipt.sessionName))
    entries.set(
      receipt.id,
      skipped.has(receipt.id)
        ? {
            ...entry,
            evidence: [
              ...entry.evidence,
              'not fully probed: the ledger time budget was exhausted; refresh to retry',
            ],
          }
        : entry,
    )
  }
  return entries
}
