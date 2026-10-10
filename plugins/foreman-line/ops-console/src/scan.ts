import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { type ConsoleConfig, PLUGIN_TREE_REF } from './config.js'
import { parseFrontmatter } from './frontmatter.js'
import { parseSidecarDoc, type SidecarDoc } from './guards.js'
import { readRatification } from './ratification.js'
import type { GoalRecord, Locator, QueueItem } from './types.js'

/**
 * FOC-P0 C1 discovery: specs join parcels by filename-stem prefix `<KEY>-`
 * across `docs/specs/active/` and `docs/specs/done/`; approval/rejection/
 * projected sidecars join through `subject.specSet[].ref` basenames or
 * `artifactRef`; a parcel is one `## Queue` entry of the goal's
 * `loop-directive.md` (`N. **<KEY>** …`).
 */
export interface SpecFact {
  readonly ref: string
  readonly absPath: string
  readonly location: 'active' | 'done'
  readonly stem: string
  readonly status: string | null
  readonly updated: string | null
  readonly routingClass: string | null
  readonly mtimeMs: number
}

export type SidecarKind = 'approval' | 'rejection' | 'projected' | 'other'

export interface SidecarFact {
  readonly ref: string
  readonly kind: SidecarKind
  readonly decision: string | null
  /** Spec basenames this sidecar joins through `specSet[].ref`/`parcelSpecRefs`/`artifactRef`. */
  readonly joins: readonly string[]
  readonly doc: SidecarDoc
}

const PARCEL_KEY_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
const QUEUE_ITEM_PATTERN = /^(\d+)\.\s+\*\*([A-Z0-9]+(?:-[A-Z0-9]+)*)\*\*/gm
const HUNG_THRESHOLD_PATTERN = /^hung-threshold:\s*([0-9]+(?:\.[0-9]+)?)h\s*$/m

/** OQ1 Gate 1 ruling: single default of 6h, overridable per goal. */
export const DEFAULT_HUNG_THRESHOLD_MS = 21_600_000

function specFactsFromDir(config: ConsoleConfig, location: 'active' | 'done'): SpecFact[] {
  const dir = join(config.specsDir, location)
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  const facts: SpecFact[] = []
  for (const name of entries.sort()) {
    if (!name.endsWith('.md')) continue
    const absPath = join(dir, name)
    const data = parseFrontmatter(readFileSync(absPath, 'utf8'))
    facts.push({
      ref: `${PLUGIN_TREE_REF}/docs/specs/${location}/${name}`,
      absPath,
      location,
      stem: name.slice(0, -'.md'.length),
      status: data.status ?? null,
      updated: data.updated ?? null,
      routingClass: data.routing_class ?? null,
      mtimeMs: statSync(absPath).mtimeMs,
    })
  }
  return facts
}

export function scanSpecs(config: ConsoleConfig): SpecFact[] {
  return [...specFactsFromDir(config, 'done'), ...specFactsFromDir(config, 'active')]
}

function sidecarKind(name: string): SidecarKind {
  if (name.endsWith('.approval.json')) return 'approval'
  if (name.endsWith('.rejection.json')) return 'rejection'
  if (name.endsWith('.projected.shaping-result.json')) return 'projected'
  return 'other'
}

function sidecarsFromDir(config: ConsoleConfig, location: 'active' | 'done'): SidecarFact[] {
  const dir = join(config.specsDir, location)
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  const facts: SidecarFact[] = []
  for (const name of entries.sort()) {
    if (!name.endsWith('.json')) continue
    const kind = sidecarKind(name)
    if (kind === 'other') continue
    let doc: SidecarDoc = parseSidecarDoc({})
    try {
      doc = parseSidecarDoc(JSON.parse(readFileSync(join(dir, name), 'utf8')))
    } catch {
      // Unparseable sidecar cannot join anything; keep the fact with empty joins.
    }
    const joins = new Set<string>()
    for (const ref of doc.specRefs) joins.add(basename(ref))
    if (doc.artifactRef !== null) joins.add(basename(doc.artifactRef))
    facts.push({
      ref: `${PLUGIN_TREE_REF}/docs/specs/${location}/${name}`,
      kind,
      decision: doc.decision,
      joins: [...joins],
      doc,
    })
  }
  return facts
}

export function scanSidecars(config: ConsoleConfig): SidecarFact[] {
  return [...sidecarsFromDir(config, 'active'), ...sidecarsFromDir(config, 'done')]
}

function parseQueueItems(loopDirective: string): QueueItem[] {
  const heading = /^##\s+Queue\b.*$/m.exec(loopDirective)
  if (heading === null) return []
  const start = heading.index + heading[0].length
  const rest = loopDirective.slice(start)
  const nextHeading = /\n##\s/.exec(rest)
  const section = nextHeading === null ? rest : rest.slice(0, nextHeading.index)
  const starts: { index: number; key: string }[] = []
  for (const match of section.matchAll(QUEUE_ITEM_PATTERN)) {
    const key = match[2] ?? ''
    if (!PARCEL_KEY_PATTERN.test(key)) continue
    starts.push({ index: match.index, key })
  }
  const items: QueueItem[] = []
  for (let i = 0; i < starts.length; i++) {
    const current = starts[i]
    if (current === undefined) continue
    const end = starts[i + 1]?.index ?? section.length
    items.push({ key: current.key, text: section.slice(current.index, end) })
  }
  return items
}

function hungThreshold(loopDirective: string): GoalRecord['hungThreshold'] {
  const match = HUNG_THRESHOLD_PATTERN.exec(loopDirective)
  const hours = match === null ? Number.NaN : Number(match[1] ?? '')
  if (!Number.isFinite(hours) || hours <= 0) {
    return { thresholdMs: DEFAULT_HUNG_THRESHOLD_MS, source: 'default', hours: null }
  }
  return { thresholdMs: Math.round(hours * 3_600_000), source: 'goal-override', hours }
}

function stateLines(loopDirective: string): string[] {
  return loopDirective
    .split(/\r?\n/)
    .filter((line) => line.includes('**') && /\bstate\b/i.test(line))
    .map((line) => line.trim())
}

function locator(root: string, absPath: string): Locator {
  const rel = relative(root, absPath).split(sep).join('/')
  return { root, relativePath: rel }
}

export function listGoalSlugs(config: ConsoleConfig): string[] {
  let entries: string[]
  try {
    entries = readdirSync(config.goalsDir)
  } catch {
    return []
  }
  return entries
    .filter((name) => {
      try {
        return (
          statSync(join(config.goalsDir, name)).isDirectory() &&
          statSync(join(config.goalsDir, name, 'loop-directive.md')).isFile()
        )
      } catch {
        return false
      }
    })
    .sort()
}

export function scanGoal(
  config: ConsoleConfig,
  slug: string,
  treeRef = PLUGIN_TREE_REF,
): GoalRecord | null {
  const goalDir = join(config.goalsDir, slug)
  let loopDirective: string
  try {
    loopDirective = readFileSync(join(goalDir, 'loop-directive.md'), 'utf8')
  } catch {
    return null
  }
  const charterPath = join(goalDir, 'charter.md')
  const directivePath = join(goalDir, 'loop-directive.md')
  let charterText: string | null = null
  try {
    charterText = readFileSync(charterPath, 'utf8')
  } catch {
    // Charter optional for projection; ratification renders as unknown.
  }
  const result = readRatification([
    { source: 'charter', locator: locator(config.repoRoot, charterPath), text: charterText },
    {
      source: 'loop-directive',
      locator: locator(config.repoRoot, directivePath),
      text: loopDirective,
    },
  ])
  return {
    slug,
    charterRef: `${treeRef}/docs/goals/${slug}/charter.md`,
    loopDirectiveRef: `${treeRef}/docs/goals/${slug}/loop-directive.md`,
    items: parseQueueItems(loopDirective),
    hungThreshold: hungThreshold(loopDirective),
    stateLines: stateLines(loopDirective),
    ratification: result.ratification,
    evidence: result.evidence,
  }
}
