import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { type StateFile, stateFilePath } from './config.js'
import { isRecord } from './guards.js'

/**
 * FCA-P2 fleet registry: declared, ordered, deduplicated absolute repo roots
 * with a frozen primary (the process root). Membership is explicit — the
 * console never crawls the filesystem for repos (owner: browse + select).
 * Identity and liveness are derived from disk on every call through the probe
 * seam (D2/D3: no stored status beyond the root list itself). Refusals are
 * typed (D1-style) and leave the registry unchanged.
 *
 * Persistence: `state/fleet.json`, schema `foc-fleet/v1`, through the closed
 * `STATE_FILES` write guard — one of the console-local state files.
 */

export type FleetLiveness = 'ready' | 'absent' | 'invalid'

export interface FleetIdentity {
  readonly remote: string | null
  readonly defaultBranch: string | null
  readonly head: string | null
}

export interface FleetRootDescription {
  readonly root: string
  readonly liveness: FleetLiveness
  readonly identity: FleetIdentity | null
}

export interface FleetState {
  readonly schema: 'foc-fleet/v1'
  /** First entry is the primary root. Absolute, unique, in add order. */
  readonly roots: readonly string[]
}

export interface FleetProbe {
  readonly exists: (root: string) => boolean
  readonly isGitWorkTree: (root: string) => boolean
  readonly git: (root: string, args: readonly string[]) => string
}

export type FleetRefusalReason =
  | 'root-not-absolute'
  | 'root-absent'
  | 'not-a-git-work-tree'
  | 'duplicate-root'
  | 'root-primary-immutable'
  | 'root-unknown'
  | 'fleet-state-corrupt'

/** Typed refusal (mirrors the `ConsoleRootUnresolvedError` convention). */
export class FleetRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: FleetRefusalReason

  constructor(reason: FleetRefusalReason, message: string) {
    super(message)
    this.name = 'FleetRefusalError'
    this.reason = reason
  }
}

export const defaultFleetProbe: FleetProbe = {
  exists: (root) => existsSync(root),
  isGitWorkTree: (root) => existsSync(join(root, '.git')),
  git: (root, args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim(),
}

const STORE_NAME: StateFile = 'fleet.json'

function assertAbsolute(root: string, reason: FleetRefusalReason = 'root-not-absolute'): void {
  if (!isAbsolute(root)) {
    throw new FleetRefusalError(reason, `fleet root refused: ${root} is not an absolute path`)
  }
}

function validateCandidate(root: string, probe: FleetProbe): void {
  assertAbsolute(root)
  if (!probe.exists(root)) {
    throw new FleetRefusalError('root-absent', `fleet root refused: ${root} does not exist`)
  }
  if (!probe.isGitWorkTree(root)) {
    throw new FleetRefusalError(
      'not-a-git-work-tree',
      `fleet root refused: ${root} is not a git work tree`,
    )
  }
}

export function createFleetState(primaryRoot: string, probe: FleetProbe): FleetState {
  assertAbsolute(primaryRoot)
  if (!probe.exists(primaryRoot)) {
    throw new FleetRefusalError('root-absent', `fleet root refused: ${primaryRoot} does not exist`)
  }
  return { schema: 'foc-fleet/v1', roots: [primaryRoot] }
}

export function addFleetRoot(state: FleetState, root: string, probe: FleetProbe): FleetState {
  validateCandidate(root, probe)
  if (state.roots.includes(root)) {
    throw new FleetRefusalError(
      'duplicate-root',
      `fleet root refused: ${root} is already registered`,
    )
  }
  return { schema: 'foc-fleet/v1', roots: [...state.roots, root] }
}

export function removeFleetRoot(state: FleetState, root: string): FleetState {
  if (state.roots[0] === root) {
    throw new FleetRefusalError(
      'root-primary-immutable',
      `fleet root refused: ${root} is the primary root and cannot be removed`,
    )
  }
  if (!state.roots.includes(root)) {
    throw new FleetRefusalError('root-unknown', `fleet root refused: ${root} is not registered`)
  }
  return { schema: 'foc-fleet/v1', roots: state.roots.filter((entry) => entry !== root) }
}

function gitSafe(probe: FleetProbe, root: string, args: readonly string[]): string | null {
  try {
    const out = probe.git(root, args)
    return out === '' ? null : out
  } catch {
    return null
  }
}

/** Derived on every call — never persisted (D2/D3). */
export function describeRoot(root: string, probe: FleetProbe): FleetRootDescription {
  if (!probe.exists(root)) return { root, liveness: 'absent', identity: null }
  if (!probe.isGitWorkTree(root)) return { root, liveness: 'invalid', identity: null }
  const remote = gitSafe(probe, root, ['remote', 'get-url', 'origin'])
  const head = gitSafe(probe, root, ['rev-parse', '--short', 'HEAD'])
  const upstream = gitSafe(probe, root, ['rev-parse', '--abbrev-ref', 'origin/HEAD'])
  const current = gitSafe(probe, root, ['symbolic-ref', '--short', 'HEAD'])
  const defaultBranch = upstream?.replace(/^origin\//, '') ?? current
  return {
    root,
    liveness: 'ready',
    identity: { remote, defaultBranch, head },
  }
}

function parseState(raw: string, primaryRoot: string): FleetState {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new FleetRefusalError('fleet-state-corrupt', 'fleet state refused: not valid JSON')
  }
  if (!isRecord(parsed) || parsed.schema !== 'foc-fleet/v1' || !Array.isArray(parsed.roots)) {
    throw new FleetRefusalError('fleet-state-corrupt', 'fleet state refused: schema/shape mismatch')
  }
  const roots: string[] = []
  for (const entry of parsed.roots) {
    if (typeof entry !== 'string' || !isAbsolute(entry) || roots.includes(entry)) {
      throw new FleetRefusalError('fleet-state-corrupt', 'fleet state refused: invalid root entry')
    }
    roots.push(entry)
  }
  if (roots[0] !== primaryRoot) {
    throw new FleetRefusalError(
      'fleet-state-corrupt',
      `fleet state refused: primary ${String(roots[0])} disagrees with process root ${primaryRoot}`,
    )
  }
  return { schema: 'foc-fleet/v1', roots }
}

export function loadFleetState(stateDir: string, primaryRoot: string): FleetState {
  assertAbsolute(primaryRoot)
  const path = stateFilePath(stateDir, STORE_NAME)
  if (!existsSync(path)) return { schema: 'foc-fleet/v1', roots: [primaryRoot] }
  return parseState(readFileSync(path, 'utf8'), primaryRoot)
}

export function saveFleetState(stateDir: string, state: FleetState): void {
  // Defensive re-validation: only well-formed state is ever persisted.
  parseState(JSON.stringify(state), state.roots[0] ?? '')
  mkdirSync(stateDir, { recursive: true })
  writeFileSync(stateFilePath(stateDir, STORE_NAME), `${JSON.stringify(state, null, 2)}\n`)
}
