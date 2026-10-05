import { createHash } from 'node:crypto'
import {
  type Dirent,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, sep } from 'node:path'
import { type ConsoleConfig, defaultConfig } from '../../src/config.js'
import type { FailureCode, GateStatus, ParcelStateValue } from '../../src/types.js'

/**
 * FOC-P0 C5 fixture materializer (FOC-P1): materializes one scenario manifest
 * into a temp repo mirroring the real disk-truth layout — receipt chains at
 * `docs/receipts/<workflowId>/`, goal records at
 * `plugins/foreman-line/docs/goals/<slug>/`, specs + sidecars at
 * `plugins/foreman-line/docs/specs/{active,done}/`, git worktree liveness
 * records at `.git/worktrees/<name>/{gitdir,HEAD}`.
 *
 * Fixture receipt hashes are structural stubs: the shipped validator checks
 * hash FORMAT and prevHash linkage against the prior stored hash, never
 * re-computation (canonicalization authority is out of its scope). Linkage in
 * the fixtures is real.
 */

export interface ScenarioSpec {
  readonly name: string
  readonly location: 'active' | 'done'
  readonly status?: string
  readonly updated?: string
  readonly routingClass?: string
}

export interface ScenarioSidecar {
  readonly kind: 'approval' | 'rejection' | 'projected'
  readonly spec: string
  readonly decision?: string
}

export interface ScenarioChain {
  readonly workflowId: string
  readonly parcel: string
  readonly stages: readonly string[]
  readonly timestampOffsetHours?: readonly number[]
  readonly approvedHash?: boolean
  readonly verdict?: 'pass' | 'rework'
  readonly mergeSha?: 'hex40' | 'bad'
  readonly corrupt?: number | null
  readonly breakLink?: number | null
  readonly specRefs?: readonly string[]
  readonly sidecars?: readonly string[]
  readonly routing?: {
    readonly routingClass?: string
    readonly resolvedTier?: string
    readonly resolvedModelId?: string
  }
}

export interface ScenarioWorktree {
  readonly name: string
  readonly branch?: string
  readonly fresh: boolean
}

export interface ExpectedProjection {
  readonly parcel: string
  readonly state: ParcelStateValue
  readonly rule: string
  readonly failureCode?: FailureCode
  readonly chainEvidence?: 'present' | 'absent'
  readonly thresholdMs?: number
  readonly thresholdSource?: 'goal-override' | 'default'
  readonly flags?: readonly string[]
  readonly gates?: Partial<Record<'G1' | 'G2' | 'G3', GateStatus>>
}

export interface Scenario {
  readonly name: string
  readonly description?: string
  readonly now: string
  readonly hungThresholdLine?: string | null
  readonly goal: {
    readonly slug: string
    readonly queue: readonly string[]
    readonly charterStatus?: string
    readonly stateLines?: readonly string[]
  }
  readonly specs: readonly ScenarioSpec[]
  readonly sidecars?: readonly ScenarioSidecar[]
  readonly chains?: readonly ScenarioChain[]
  readonly worktrees?: readonly ScenarioWorktree[]
  readonly expected: readonly ExpectedProjection[]
}

export interface MaterializedRepo {
  readonly config: ConsoleConfig
  readonly now: number
  readonly root: string
}

// subjectKind values mirror the shipped receipts (CamelCase); filenames use
// the `receiptPath` slugified form of the same value.
const SUBJECT_KINDS: Record<string, { kind: string; slug: string }> = {
  A: { kind: 'ShapingResult', slug: 'shaping-result' },
  B: { kind: 'RegistrationResult', slug: 'registration-result' },
  C: { kind: 'DispatchOrder', slug: 'dispatch-order' },
  D: { kind: 'VerificationVerdict', slug: 'verification-verdict' },
  E: { kind: 'IntegrationResult', slug: 'integration-result' },
  F: { kind: 'ClosureRecord', slug: 'closure-record' },
}

function stubHash(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function stubUuid(input: string): string {
  const hex = stubHash(input)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text, 'utf8')
}

function specRef(spec: ScenarioSpec): string {
  return `plugins/foreman-line/docs/specs/${spec.location}/${spec.name}`
}

function materializeChain(
  root: string,
  chain: ScenarioChain,
  scenario: Scenario,
  now: number,
): void {
  const dir = join(root, 'docs', 'receipts', chain.workflowId)
  const refs =
    chain.specRefs ??
    scenario.specs
      .filter((spec) => spec.name.startsWith(`${chain.parcel}-`))
      .map((spec) => specRef(spec))
  let prevHash: string | null = null
  chain.stages.forEach((stage, sequence) => {
    const names = SUBJECT_KINDS[stage] ?? { kind: 'Unknown', slug: 'unknown' }
    const offsetHours = chain.timestampOffsetHours?.[sequence] ?? -1
    const timestamp = new Date(now + offsetHours * 3_600_000).toISOString()
    let subject: unknown = {}
    if (stage === 'A') {
      subject = {
        specSet: refs.map((ref) => ({ ref, contentHash: stubHash(ref) })),
        projectedResult: { parcelSpecRefs: refs, epics: [] },
        approvedHash:
          chain.approvedHash === false ? null : stubHash(`${chain.workflowId}-approved`),
      }
    } else if (stage === 'D') {
      subject = { verdict: chain.verdict ?? 'pass', harnessClaims: [], adversarialFindings: [] }
    } else if (stage === 'F') {
      subject = {
        mergeSha:
          chain.mergeSha === 'bad' ? 'nothex' : stubHash(`${chain.workflowId}-merge`).slice(0, 40),
        specLifecycleMove:
          refs[0] === undefined
            ? null
            : { from: refs[0], to: refs[0].replace('/active/', '/done/') },
      }
    } else if (stage === 'C') {
      subject = {
        kompressArtifactId: stubHash(`${chain.workflowId}-kompress`).slice(0, 24),
        injectedSkills: [],
      }
    }
    // `breakLink: n` corrupts THIS member's prevHash pointer.
    const memberPrevHash = chain.breakLink === sequence ? stubHash('broken-link') : prevHash
    const doc = {
      schemaVersion: '1',
      kind: 'stage',
      stage,
      claimRef: null,
      correlation: {
        correlationId: stubUuid(`${chain.workflowId}-correlation`),
        sessionId: stubUuid(`${chain.workflowId}-session-${sequence}`),
        workflowId: chain.workflowId,
        runId: stubUuid(`${chain.workflowId}-run-${sequence}`),
      },
      sequence,
      prevHash: memberPrevHash,
      timestamp,
      subjectKind: names.kind,
      subject,
      signature: null,
      hash: stubHash(`${chain.workflowId}-${sequence}`),
    }
    const file = `${String(sequence).padStart(6, '0')}-${stage}-${names.slug}.json`
    if (chain.corrupt === sequence) {
      writeText(join(dir, file), '{ this is not json')
    } else {
      writeJson(join(dir, file), doc)
    }
    prevHash = doc.hash
  })
  for (const sidecar of chain.sidecars ?? []) {
    if (sidecar === 'routing-decision.json') {
      writeJson(join(dir, sidecar), {
        workflowId: chain.workflowId,
        routing_class: chain.routing?.routingClass ?? 'standard-feature',
        resolvedTier: chain.routing?.resolvedTier ?? 'standard',
        resolvedModelId: chain.routing?.resolvedModelId ?? 'vendor/model-x',
        policyRef: 'plugins/foreman-line/routing-policy/routing-policy.yaml',
      })
    } else {
      writeJson(join(dir, sidecar), { workflowId: chain.workflowId, note: sidecar })
    }
  }
}

function materializeWorktree(root: string, worktree: ScenarioWorktree, now: number): void {
  const recordDir = join(root, '.git', 'worktrees', worktree.name)
  const worktreeDir = join(root, '.worktrees', worktree.name)
  mkdirSync(recordDir, { recursive: true })
  mkdirSync(worktreeDir, { recursive: true })
  writeText(join(recordDir, 'gitdir'), `${worktreeDir}${sep}.git\n`)
  writeText(
    join(recordDir, 'HEAD'),
    `ref: refs/heads/${worktree.branch ?? `feat/${worktree.name}`}\n`,
  )
  const content = join(worktreeDir, 'content.txt')
  writeText(content, `worktree content for ${worktree.name}\n`)
  const mtime = worktree.fresh ? now / 1000 : (now - 30 * 24 * 3_600_000) / 1000
  utimesSync(content, mtime, mtime)
}

export function materialize(root: string, scenario: Scenario): MaterializedRepo {
  const now = Date.parse(scenario.now)
  const goalDir = join(root, 'plugins', 'foreman-line', 'docs', 'goals', scenario.goal.slug)
  writeText(
    join(goalDir, 'charter.md'),
    `# Goal Charter — ${scenario.goal.slug}\n\n**Status:** ${scenario.goal.charterStatus ?? 'DRAFT'}\n`,
  )
  const thresholdLine = scenario.hungThresholdLine == null ? '' : `${scenario.hungThresholdLine}\n`
  writeText(
    join(goalDir, 'loop-directive.md'),
    [
      `# ${scenario.goal.slug} — Coordinator Loop Directive`,
      '',
      '## COORDINATOR OWNERSHIP',
      // Queue strings carry their own `N. **KEY**` lead and state lines their
      // own `> **…**` markup — written verbatim (they are the parse targets).
      ...(scenario.goal.stateLines ?? [
        '> **State (update on every stop/closure):** materialized scenario.',
      ]),
      '',
      thresholdLine.trimEnd(),
      '## Queue (strict order)',
      '',
      ...scenario.goal.queue,
      '',
      '## Per-iteration algorithm',
      '',
      'Materialized fixture goal; no real loop runs here.',
      '',
    ].join('\n'),
  )
  for (const spec of scenario.specs) {
    writeText(
      join(root, 'plugins', 'foreman-line', 'docs', 'specs', spec.location, spec.name),
      [
        '---',
        `ticket: ${spec.name.split('-')[0] ?? 'X'}`,
        `title: ${spec.name}`,
        `status: ${spec.status ?? (spec.location === 'done' ? 'done' : 'active')}`,
        'owner: fixture',
        'created: 2026-01-01',
        `updated: ${spec.updated ?? '2026-01-02'}`,
        'supersedes: null',
        'superseded_by: null',
        'risk: standard',
        `routing_class: ${spec.routingClass ?? 'standard-feature'}`,
        '---',
        '',
        `# ${spec.name}`,
        '',
        'Materialized fixture spec.',
        '',
      ].join('\n'),
    )
  }
  for (const sidecar of scenario.sidecars ?? []) {
    const spec = scenario.specs.find((entry) => entry.name === sidecar.spec)
    const stem = sidecar.spec.replace(/\.md$/, '').toLowerCase()
    const location = spec?.location ?? 'active'
    const ref = `plugins/foreman-line/docs/specs/${location}/${sidecar.spec}`
    const suffix =
      sidecar.kind === 'approval'
        ? 'approval.json'
        : sidecar.kind === 'rejection'
          ? 'rejection.json'
          : 'projected.shaping-result.json'
    writeJson(
      join(root, 'plugins', 'foreman-line', 'docs', 'specs', location, `${stem}.${suffix}`),
      {
        decision: sidecar.decision ?? (sidecar.kind === 'rejection' ? 'rejected' : 'approved'),
        subject: {
          specSet: [{ ref, contentHash: stubHash(sidecar.spec) }],
          projectedResult: { parcelSpecRefs: [ref], epics: [] },
        },
      },
    )
  }
  for (const chain of scenario.chains ?? []) materializeChain(root, chain, scenario, now)
  for (const worktree of scenario.worktrees ?? []) materializeWorktree(root, worktree, now)
  return { config: defaultConfig(root, join(root, 'state')), now, root }
}

/** Content snapshot (path -> sha256) over the truth-source trees a scenario touched. */
export function treeSnapshot(root: string, dirs: readonly string[]): Map<string, string> {
  const snapshot = new Map<string, string>()
  const stack = [...dirs.map((dir) => join(root, ...dir.split('/')))]
  while (stack.length > 0) {
    const dir = stack.pop() ?? ''
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(path)
        continue
      }
      if (!entry.isFile()) continue
      snapshot.set(
        path.split(sep).join('/'),
        createHash('sha256').update(readFileSync(path)).digest('hex'),
      )
    }
  }
  return snapshot
}

export function fileMtimes(root: string, dirs: readonly string[]): Map<string, number> {
  const times = new Map<string, number>()
  const stack = [...dirs.map((dir) => join(root, ...dir.split('/')))]
  while (stack.length > 0) {
    const dir = stack.pop() ?? ''
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(path)
        continue
      }
      if (!entry.isFile()) continue
      times.set(path.split(sep).join('/'), statSync(path).mtimeMs)
    }
  }
  return times
}

/** Materialize a scenario in a fresh temp repo, run, then remove the repo. */
export function withTempRepo<T>(scenario: Scenario, run: (ctx: MaterializedRepo) => T): T {
  const root = mkdtempSync(join(tmpdir(), 'foc-scenario-'))
  try {
    return run(materialize(root, scenario))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
