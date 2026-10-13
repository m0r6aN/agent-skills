import { execFileSync } from 'node:child_process'
import { isRecord } from './guards.js'

/**
 * FCA-P8 remote fact gatherer: ONE read-only `gh pr list` per repo per cache
 * window (never per parcel, never per render). Failure of any kind -
 * unauthenticated, offline, gh missing, malformed output - yields
 * `available: false` with the reason; remote state is NEVER inferred from
 * local data. Every result carries `asOf`.
 */

export interface PrFact {
  readonly number: number
  readonly title: string
  readonly headRefName: string
  readonly baseRefName: string
  readonly state: 'OPEN' | 'MERGED' | 'CLOSED'
  readonly createdAt: string
  readonly mergedAt: string | null
  readonly closedAt: string | null
  readonly url: string
}

export interface PrFacts {
  readonly available: boolean
  readonly reason: string | null
  readonly asOf: string | null
  readonly prs: readonly PrFact[]
  /** The PR limit was reached: older PRs are NOT in `prs`, so absence cannot be claimed. */
  readonly truncated: boolean
}

export type GhRunner = (cwd: string, args: readonly string[]) => string

export const PR_LIMIT = 1000
export const DEFAULT_TTL_MS = 60_000
/** A failing gh (offline, logged out) is retried less often: each attempt can block for the timeout. */
export const FAILURE_TTL_MS = 5 * 60_000
export const GH_TIMEOUT_MS = 10_000

export const defaultGhRunner: GhRunner = (cwd, args) =>
  execFileSync('gh', [...args], {
    cwd,
    encoding: 'utf8',
    timeout: GH_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

const FIELDS = 'number,title,headRefName,baseRefName,state,createdAt,mergedAt,closedAt,url'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function parsePrs(raw: string): PrFact[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null
  const prs: PrFact[] = []
  for (const entry of parsed) {
    if (!isRecord(entry) || typeof entry.number !== 'number') return null
    const state = entry.state
    if (state !== 'OPEN' && state !== 'MERGED' && state !== 'CLOSED') return null
    prs.push({
      number: entry.number,
      title: asString(entry.title),
      headRefName: asString(entry.headRefName),
      baseRefName: asString(entry.baseRefName),
      state,
      createdAt: asString(entry.createdAt),
      mergedAt: typeof entry.mergedAt === 'string' ? entry.mergedAt : null,
      closedAt: typeof entry.closedAt === 'string' ? entry.closedAt : null,
      url: asString(entry.url),
    })
  }
  return prs
}

const cache = new Map<string, { at: number; facts: PrFacts }>()

export function clearPrCache(): void {
  cache.clear()
}

export interface PrOptions {
  readonly run?: GhRunner
  /** Cache window; 0 disables caching (tests). */
  readonly ttlMs?: number
}

function reasonOf(error: unknown): string {
  const e = error as { code?: string; stderr?: Buffer | string; message?: string }
  if (e.code === 'ENOENT') return 'gh is not installed'
  const stderr = e.stderr === undefined ? '' : (String(e.stderr).trim().split('\n')[0] ?? '')
  return stderr !== '' ? stderr : ((e.message ?? 'gh failed').split('\n')[0] ?? 'gh failed')
}

export function gatherPrFacts(repoRoot: string, now: number, options: PrOptions = {}): PrFacts {
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS
  const hit = cache.get(repoRoot)
  if (
    hit !== undefined &&
    ttl > 0 &&
    now - hit.at < (hit.facts.available ? ttl : Math.max(ttl, FAILURE_TTL_MS))
  ) {
    return hit.facts
  }
  const run = options.run ?? defaultGhRunner
  let facts: PrFacts
  try {
    const prs = parsePrs(
      run(repoRoot, [
        'pr',
        'list',
        '--state',
        'all',
        '--limit',
        String(PR_LIMIT),
        '--json',
        FIELDS,
      ]),
    )
    facts =
      prs === null
        ? {
            available: false,
            reason: 'gh returned unparseable output',
            asOf: null,
            prs: [],
            truncated: false,
          }
        : {
            available: true,
            reason: null,
            asOf: new Date(now).toISOString(),
            prs,
            truncated: prs.length >= PR_LIMIT,
          }
  } catch (error) {
    facts = { available: false, reason: reasonOf(error), asOf: null, prs: [], truncated: false }
  }
  // Failures are cached too (briefly) so a dead network is not re-probed per request.
  if (ttl > 0) cache.set(repoRoot, { at: now, facts })
  return facts
}
