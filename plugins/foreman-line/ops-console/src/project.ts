import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { type ChainWalk, listWorkflowIds, walkChain } from './chain.js'
import type { ConsoleConfig } from './config.js'
import { deriveParcel } from './derive.js'
import { gateProxies } from './gates.js'
import { isRecord } from './guards.js'
import { worktreeLiveness } from './liveness.js'
import { type SidecarFact, type SpecFact, scanGoal, scanSidecars, scanSpecs } from './scan.js'
import type {
  ChainSummary,
  GoalProjection,
  ParcelProjection,
  QueueItem,
  RoutingView,
} from './types.js'

/**
 * FOC-P1 projection library entry: the single projection authority (charter
 * D4). Everything is re-derived from disk on every call — no stored status, no
 * writes, no authority (it never decides or records a gate).
 */
function joinsKey(basenames: readonly string[], key: string): boolean {
  return basenames.some((name) => name.startsWith(`${key}-`))
}

function pickSpec(matches: SpecFact[]): { spec: SpecFact | null; flags: string[] } {
  if (matches.length === 0) return { spec: null, flags: [] }
  const done = matches.filter((candidate) => candidate.location === 'done')
  const flags = done.length > 0 && done.length < matches.length ? ['duplicate-spec'] : []
  return { spec: done[0] ?? matches[0] ?? null, flags }
}

function chainRouting(
  config: ConsoleConfig,
  walk: ChainWalk | null,
  spec: SpecFact | null,
): RoutingView {
  const specClass = spec?.routingClass ?? null
  if (
    walk === null ||
    !walk.sidecars.some((locator) => locator.endsWith('/routing-decision.json'))
  ) {
    return { routingClass: specClass, resolvedModelId: null, resolvedTier: null }
  }
  try {
    const raw: unknown = JSON.parse(
      readFileSync(join(config.receiptsDir, walk.workflowId, 'routing-decision.json'), 'utf8'),
    )
    if (!isRecord(raw))
      return { routingClass: specClass, resolvedModelId: null, resolvedTier: null }
    return {
      routingClass: typeof raw.routing_class === 'string' ? raw.routing_class : specClass,
      resolvedModelId: typeof raw.resolvedModelId === 'string' ? raw.resolvedModelId : null,
      resolvedTier: typeof raw.resolvedTier === 'string' ? raw.resolvedTier : null,
    }
  } catch {
    return { routingClass: specClass, resolvedModelId: null, resolvedTier: null }
  }
}

function aReceiptBasenames(walk: ChainWalk): string[] {
  const aReceipt = walk.docs.find((doc) => doc.stage === 'A')
  if (aReceipt === undefined) return []
  const subject = aReceipt.subject
  if (!isRecord(subject)) return []
  const basenames: string[] = []
  const specSet = subject.specSet
  if (Array.isArray(specSet)) {
    for (const entry of specSet) {
      if (isRecord(entry) && typeof entry.ref === 'string') basenames.push(basename(entry.ref))
    }
  }
  const projected = subject.projectedResult
  if (isRecord(projected) && Array.isArray(projected.parcelSpecRefs)) {
    for (const ref of projected.parcelSpecRefs) {
      if (typeof ref === 'string') basenames.push(basename(ref))
    }
  }
  return basenames
}

function toSummary(walk: ChainWalk): ChainSummary {
  const { docs: _docs, ...summary } = walk
  return summary
}

export function projectGoal(
  config: ConsoleConfig,
  goalSlug: string,
  now: number,
  goalKey: string = goalSlug,
  treeRef?: string,
): GoalProjection | null {
  const goal =
    treeRef === undefined ? scanGoal(config, goalSlug) : scanGoal(config, goalSlug, treeRef)
  if (goal === null) return null

  const specs = scanSpecs(config)
  const sidecars = scanSidecars(config)
  const walks = listWorkflowIds(config.receiptsDir).map((workflowId) =>
    walkChain(config.receiptsDir, workflowId),
  )

  const parcels: ParcelProjection[] = []
  const mappedWorkflows = new Set<string>()
  for (const item of goal.items as readonly QueueItem[]) {
    const matches = specs.filter((spec) => spec.stem.startsWith(`${item.key}-`))
    const { spec, flags } = pickSpec(matches)
    const specBasenames = matches.map((entry) => basename(entry.ref))
    const joining = walks.filter((candidate) => {
      const basenames = aReceiptBasenames(candidate)
      return joinsKey(basenames, item.key) || basenames.some((name) => specBasenames.includes(name))
    })
    const winner = [...joining].sort((a, b) => (a.workflowId < b.workflowId ? -1 : 1))[0] ?? null
    if (winner !== null) mappedWorkflows.add(winner.workflowId)
    const parcelFlags = joining.length > 1 ? [...flags, 'duplicate-chain'] : flags
    const parcelSidecars: SidecarFact[] = sidecars.filter(
      (sidecar) =>
        joinsKey(sidecar.joins, item.key) ||
        sidecar.joins.some((name) => specBasenames.includes(name)),
    )
    parcels.push(
      deriveParcel({
        goal: goalKey,
        parcel: item.key,
        itemText: item.text,
        spec,
        walk: winner,
        sidecars: parcelSidecars,
        gates: gateProxies({ walk: winner, sidecars: parcelSidecars }),
        routing: chainRouting(config, winner, spec),
        liveness: worktreeLiveness(
          config.repoRoot,
          { parcelKey: item.key, goalSlug },
          goal.hungThreshold.thresholdMs,
          now,
        ),
        threshold: {
          thresholdMs: goal.hungThreshold.thresholdMs,
          source: goal.hungThreshold.source,
        },
        now,
        flags: parcelFlags,
      }),
    )
  }

  const unmappedChains = walks
    .filter((candidate) => !mappedWorkflows.has(candidate.workflowId))
    .map(toSummary)
  return { goal, parcels, unmappedChains }
}
