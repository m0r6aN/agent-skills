import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { AutonomyEnvelope } from './actions.js'
import { CHAIN_MEMBER_PATTERN } from './chain.js'
import {
  assertAbsoluteRoot,
  type ConsoleConfig,
  packageRoot,
  type StateFile,
  stateFilePath,
} from './config.js'
import { loadFleetState } from './fleet.js'
import { isRecord } from './guards.js'

/**
 * FOC-P0 M1 + A1 CLI-invocation safety boundary (FOC-P3 seam; the ONLY
 * exec-capable module in the package, X1).
 *
 * The console exposes exactly the frozen flow registry below. Every request —
 * executed, presented, or refused — appends one entry to the invocation audit
 * log (`state/invocation-audit.json`, format `foc-invocation-audit/v1`,
 * append-only): "records nothing itself" never means "leaves no trace" (A1).
 *
 * Arg rules (M1): argv is passed as an array (never a shell string); each
 * argument matches its flow's frozen pattern (UUID, 6-digit sequence,
 * `^[a-z0-9-]+$` slug, absolute `--repo-root` that must equal the configured
 * repo root); arguments outside a flow's frozen surface are refused before any
 * spawn; no environment passthrough; working directory is the configured repo
 * root's package context.
 *
 * Execution modes (frozen): `execute` only for non-interactive, non-minting
 * flows (`approval-show`, `receipts-validate`). Human-gate mutating flows
 * (`approval-approve`, `approval-reject`, `dispatch-execute`) are `present`
 * only — the console renders the exact copy-pasteable command for a real
 * interactive terminal and audits the presentation. The console never
 * fabricates a TTY, never pipes a typed confirmation phrase, and never
 * auto-approves. `dispatch-execute` is `present` mode in Phase 1 because no
 * invokable bin exists on disk.
 */
export type InvokeAction = 'executed' | 'presented' | 'refused' | 'spawned'

export interface FlowRequest {
  readonly flow: string
  readonly argv: readonly string[]
  /**
   * Optional requested mode. `pr-merge` is present-only (FCA-P9 A4): any value
   * other than `present` is refused and audited. Other flows ignore it.
   */
  readonly mode?: unknown
}

export interface InvokeOutcome {
  readonly id: string
  readonly flow: string
  readonly argv: readonly string[]
  readonly action: InvokeAction
  readonly mode: 'execute' | 'present' | null
  readonly command: string
  readonly reason: string | null
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
}

export interface AuditEntry {
  readonly id: string
  readonly timestamp: string
  readonly flow: string
  readonly argv: readonly string[]
  readonly action: InvokeAction
  readonly mode: 'execute' | 'present' | 'spawn' | null
  readonly command: string
  readonly reason: string | null
  readonly exitCode: number | null
  /** FCA-P4 additive: autonomy envelope for action dispatches. */
  readonly autonomy?: AutonomyEnvelope | null
  /** FCA-P4/FCA-P5 additive: spawn id for `spawned` outcomes. */
  readonly spawnId?: string | null
}

const SLUG_PATTERN = /^[a-z0-9-]+$/
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const AUDIT_NAME: StateFile = 'invocation-audit.json'
const OUTPUT_CAP = 16_384

const PR_NUMBER_PATTERN = /^[1-9][0-9]{0,6}$/
/** A root is never escaped into `cd "<root>"`: these characters are refused (FCA-P9). */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are the point
const UNSAFE_ROOT_PATTERN = /["$`\\\u0000-\u001f\u007f]/

type ArgKind =
  | 'verb'
  | 'slug'
  | 'repo-root-flag'
  | 'repo-root'
  | 'repo-root-fleet'
  | 'pr-number'
  | 'receipts-path'

interface FlowSpec {
  readonly mode: 'execute' | 'present'
  readonly argv: readonly ArgKind[]
  /** Frozen verb literal expected at the `verb` position. */
  readonly verb: string
  readonly commandPrefix: string
  readonly spawnCli: 'approval' | 'receipts' | null
  /** Custom command renderer; absent = `<prefix> <args after verb>`. */
  readonly renderer?: 'pr-merge'
}

export const FLOW_REGISTRY: Record<string, FlowSpec> = {
  'approval-show': {
    mode: 'execute',
    argv: ['verb', 'slug', 'repo-root-flag', 'repo-root'],
    verb: 'show',
    commandPrefix: 'approval show',
    spawnCli: 'approval',
  },
  'approval-approve': {
    mode: 'present',
    argv: ['verb', 'slug', 'repo-root-flag', 'repo-root'],
    verb: 'approve',
    commandPrefix: 'approval approve',
    spawnCli: null,
  },
  'approval-reject': {
    mode: 'present',
    argv: ['verb', 'slug', 'repo-root-flag', 'repo-root'],
    verb: 'reject',
    commandPrefix: 'approval reject',
    spawnCli: null,
  },
  'dispatch-execute': {
    mode: 'present',
    argv: ['verb', 'slug', 'repo-root-flag', 'repo-root'],
    verb: 'executeDispatch',
    commandPrefix: 'dispatch approval-cli executeDispatch',
    spawnCli: null,
  },
  // FCA-P9 A4: present-only, never spawned, never `execute`.
  'pr-merge': {
    mode: 'present',
    argv: ['verb', 'pr-number', 'repo-root-flag', 'repo-root-fleet'],
    verb: 'merge',
    commandPrefix: 'gh pr merge',
    spawnCli: null,
    renderer: 'pr-merge',
  },
  'receipts-validate': {
    mode: 'execute',
    argv: ['verb', 'receipts-path'],
    verb: 'validate',
    commandPrefix: 'receipts validate',
    spawnCli: 'receipts',
  },
}

function validateArg(
  kind: ArgKind,
  value: string,
  spec: FlowSpec,
  config: ConsoleConfig,
): string | null {
  switch (kind) {
    case 'verb':
      return value === spec.verb
        ? null
        : `verb must be '${spec.verb}', got ${JSON.stringify(value)}`
    case 'slug':
      return SLUG_PATTERN.test(value)
        ? null
        : `slug must match ^[a-z0-9-]+$, got ${JSON.stringify(value)}`
    case 'repo-root-flag':
      return value === '--repo-root'
        ? null
        : `expected literal --repo-root, got ${JSON.stringify(value)}`
    case 'repo-root': {
      if (!isAbsolute(value)) return `--repo-root must be absolute, got ${JSON.stringify(value)}`
      return resolve(value) === config.repoRoot
        ? null
        : `--repo-root must equal the configured repo root ${config.repoRoot}`
    }
    case 'pr-number':
      return PR_NUMBER_PATTERN.test(value)
        ? null
        : `PR number must match ^[1-9][0-9]{0,6}$, got ${JSON.stringify(value)}`
    case 'repo-root-fleet': {
      if (!isAbsolute(value)) return `--repo-root must be absolute, got ${JSON.stringify(value)}`
      if (UNSAFE_ROOT_PATTERN.test(value)) {
        return 'root contains a quote, $, backtick, backslash or control character and is never escaped'
      }
      let roots: readonly string[]
      try {
        roots = loadFleetState(config.stateDir, config.repoRoot).roots
      } catch {
        return 'fleet state unreadable: no declared fleet root can be confirmed'
      }
      return resolve(value) === value && roots.includes(value)
        ? null
        : 'root is not a declared fleet root'
    }
    case 'receipts-path': {
      // D1 guard first (P2b-i / D19 class 5): relative receipt paths resolve
      // against the configured repo root — never the process cwd — and the
      // root itself must be absolute before anything resolves against it.
      assertAbsoluteRoot(config.repoRoot, 'validateArg receipts-path repoRoot')
      const resolved = isAbsolute(value) ? resolve(value) : resolve(config.repoRoot, value)
      const rel = relative(config.receiptsDir, resolved)
      if (rel.startsWith('..') || isAbsolute(rel) || rel.length === 0) {
        return `path must live inside the receipts directory (${config.receiptsDir})`
      }
      const segments = rel.split(sep)
      const [workflowId, member, ...rest] = segments
      if (workflowId === undefined || !UUID_PATTERN.test(workflowId) || rest.length > 0) {
        return 'path must be docs/receipts/<workflowId>[/<sequence>-<stage>-<slug>.json]'
      }
      if (member !== undefined && !CHAIN_MEMBER_PATTERN.test(member)) {
        return `file segment must match the receiptPath convention, got ${JSON.stringify(member)}`
      }
      return null
    }
  }
}

function renderCommand(spec: FlowSpec, argv: readonly string[]): string {
  if (spec.renderer === 'pr-merge') {
    // Only a fully validated argv is ever rendered; refusals carry no command text.
    return argv.length === 4 && argv[1] !== undefined && argv[3] !== undefined
      ? `cd "${argv[3]}" && gh pr merge ${argv[1]}`
      : ''
  }
  // argv[0] is the frozen verb, already named in the command prefix.
  return `${spec.commandPrefix} ${argv.slice(1).join(' ')}`.trim()
}

function loadAudit(stateDir: string): AuditEntry[] {
  try {
    const raw: unknown = JSON.parse(readFileSync(stateFilePath(stateDir, AUDIT_NAME), 'utf8'))
    if (
      typeof raw !== 'object' ||
      raw === null ||
      !('entries' in raw) ||
      !Array.isArray(raw.entries)
    ) {
      return []
    }
    const entries: AuditEntry[] = []
    for (const entry of raw.entries) {
      if (!isRecord(entry)) continue
      const argv = Array.isArray(entry.argv)
        ? entry.argv.filter((a): a is string => typeof a === 'string')
        : []
      if (
        typeof entry.id === 'string' &&
        typeof entry.timestamp === 'string' &&
        typeof entry.flow === 'string' &&
        (entry.action === 'executed' ||
          entry.action === 'presented' ||
          entry.action === 'refused' ||
          entry.action === 'spawned') &&
        typeof entry.command === 'string'
      ) {
        entries.push({
          id: entry.id,
          timestamp: entry.timestamp,
          flow: entry.flow,
          argv,
          action: entry.action,
          mode:
            entry.mode === 'execute' || entry.mode === 'present' || entry.mode === 'spawn'
              ? entry.mode
              : null,
          command: entry.command,
          reason: typeof entry.reason === 'string' ? entry.reason : null,
          exitCode: typeof entry.exitCode === 'number' ? entry.exitCode : null,
          autonomy: isRecord(entry.autonomy)
            ? (entry.autonomy as unknown as AutonomyEnvelope)
            : null,
          spawnId: typeof entry.spawnId === 'string' ? entry.spawnId : null,
        })
      }
    }
    return entries
  } catch {
    return []
  }
}

/**
 * Sole writer of `state/invocation-audit.json` (X1). Append-only at the record
 * level: prior entries are carried through untouched.
 */
function appendAudit(stateDir: string, entry: AuditEntry): void {
  const entries = loadAudit(stateDir)
  const path = stateFilePath(stateDir, AUDIT_NAME)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    `${JSON.stringify({ schema: 'foc-invocation-audit/v1', entries: [...entries, entry] }, null, 2)}\n`,
    'utf8',
  )
}

export function listAuditEntries(stateDir: string): AuditEntry[] {
  return loadAudit(stateDir)
}

/** Public append seam for FCA-P4 action dispatches (same append-only store). */
export function recordAuditEntry(stateDir: string, entry: AuditEntry): void {
  appendAudit(stateDir, entry)
}

/** Frozen minimal environment for spawned CLIs — no caller environment passthrough (M1). */
const SPAWN_ENV: Record<string, string> =
  process.platform === 'win32' ? { SystemRoot: 'C:\\Windows' } : {}

/**
 * Pure presentation of a present-mode flow: validates the argv with the SAME
 * guards as `invokeFlow` and renders the command, but audits nothing and spawns
 * nothing. Returns null (with the refusal reason) when the argv would be refused.
 * The decisions queue uses this so it can never present a command the flow would
 * refuse.
 */
export function presentCommand(
  config: ConsoleConfig,
  flow: string,
  argv: readonly string[],
): { readonly text: string } | { readonly refused: string } {
  const spec = FLOW_REGISTRY[flow]
  if (spec === undefined || spec.mode !== 'present') {
    return { refused: `${JSON.stringify(flow)} is not a present-mode flow` }
  }
  if (argv.length !== spec.argv.length) return { refused: 'argv surface mismatch' }
  for (let i = 0; i < spec.argv.length; i++) {
    const kind = spec.argv[i]
    const value = argv[i]
    if (kind === undefined || value === undefined) return { refused: 'argument missing' }
    const error = validateArg(kind, value, spec, config)
    if (error !== null) return { refused: error }
  }
  return { text: renderCommand(spec, argv) }
}

export function invokeFlow(
  config: ConsoleConfig,
  request: FlowRequest,
  now: number,
): InvokeOutcome {
  const argv = [...request.argv]
  const spec = FLOW_REGISTRY[request.flow]
  const mode = spec?.mode ?? null
  const base = {
    flow: request.flow,
    argv,
    mode,
    stdout: '',
    stderr: '',
  }
  let refusal: { reason: string; command: string } | null = null
  if (request.flow === 'pr-merge' && request.mode !== undefined && request.mode !== 'present') {
    refusal = {
      reason: `pr-merge is present-only; mode ${JSON.stringify(request.mode)} refused before any spawn`,
      command: '',
    }
  } else if (spec === undefined) {
    refusal = {
      reason: `unknown flow ${JSON.stringify(request.flow)} (registry is a closed set)`,
      command: '',
    }
  } else if (argv.length !== spec.argv.length) {
    refusal = {
      reason: `frozen argv surface for ${request.flow} is exactly ${spec.argv.length} argument(s), got ${argv.length}`,
      command: spec.renderer === undefined ? renderCommand(spec, argv) : '',
    }
  } else {
    for (let i = 0; i < spec.argv.length; i++) {
      const kind = spec.argv[i]
      const value = argv[i]
      if (kind === undefined || value === undefined) {
        refusal = { reason: 'argument missing', command: renderCommand(spec, argv) }
        break
      }
      const error = validateArg(kind, value, spec, config)
      if (error !== null) {
        refusal = {
          reason: `refused before any spawn: ${error}`,
          command: spec.renderer === undefined ? renderCommand(spec, argv) : '',
        }
        break
      }
    }
  }

  const id = `inv-${String(loadAudit(config.stateDir).length + 1).padStart(6, '0')}`
  const timestamp = new Date(now).toISOString()

  if (spec === undefined || refusal !== null) {
    const outcome: InvokeOutcome = {
      ...base,
      id,
      action: 'refused',
      command: refusal?.command ?? '',
      reason:
        refusal?.reason ??
        `unknown flow ${JSON.stringify(request.flow)} (registry is a closed set)`,
      exitCode: null,
    }
    appendAudit(config.stateDir, {
      id,
      timestamp,
      flow: outcome.flow,
      argv,
      action: 'refused',
      mode,
      command: outcome.command,
      reason: outcome.reason,
      exitCode: null,
    })
    return outcome
  }

  // spec is defined here: every refusal path above returned.
  const flow = spec
  const command = renderCommand(flow, argv)

  if (flow.mode === 'present') {
    const outcome: InvokeOutcome = {
      ...base,
      id,
      action: 'presented',
      command,
      reason: 'human-gate flow: presented copy-pasteable command only; never spawned (M1/W1-P3)',
      exitCode: null,
    }
    appendAudit(config.stateDir, {
      id,
      timestamp,
      flow: outcome.flow,
      argv,
      action: 'presented',
      mode: 'present',
      command,
      reason: outcome.reason,
      exitCode: null,
    })
    return outcome
  }

  // Shipped CLI code lives beside this package in the foreman-line tree — it
  // is code, not configured data; `config.pluginRoot` only locates disk truth.
  const cliPath =
    flow.spawnCli === 'approval'
      ? resolve(packageRoot(), '..', 'approval', 'src', 'cli.ts')
      : resolve(packageRoot(), '..', 'receipts', 'src', 'cli.ts')
  const tsxCli = join(packageRoot(), 'node_modules', 'tsx', 'dist', 'cli.mjs')
  const result = spawnSync(process.execPath, [tsxCli, cliPath, ...argv], {
    cwd: config.repoRoot,
    env: SPAWN_ENV,
    encoding: 'utf8',
  })
  const outcome: InvokeOutcome = {
    ...base,
    id,
    action: 'executed',
    command,
    reason: result.error === undefined ? null : result.error.message,
    exitCode: result.status,
    stdout: (result.stdout ?? '').slice(0, OUTPUT_CAP),
    stderr: (result.stderr ?? '').slice(0, OUTPUT_CAP),
  }
  appendAudit(config.stateDir, {
    id,
    timestamp,
    flow: outcome.flow,
    argv,
    action: 'executed',
    mode: 'execute',
    command,
    reason: outcome.reason,
    exitCode: outcome.exitCode,
  })
  return outcome
}
