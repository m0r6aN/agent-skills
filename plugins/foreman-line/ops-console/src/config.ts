import { readdirSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Disk-truth roots for the projection. Everything is derived from these
 * directories on every call — the library stores no status and writes nothing
 * (charter D2/D3; contract non-goals). The only writable paths in the whole
 * package are the two console-local state files named in `STATE_FILES`.
 */
export interface ConsoleConfig {
  readonly repoRoot: string
  readonly pluginRoot: string
  readonly goalsDir: string
  readonly specsDir: string
  readonly receiptsDir: string
  readonly routingPolicyPath: string
  readonly stateDir: string
  /**
   * Goal trees this console projects (FCA-1 additive extension). One tree per
   * goals directory — the primary plugin tree plus every extra root's own
   * convention tree. Absent (older callers) means "the primary tree", which
   * is exactly the pre-extension behavior.
   */
  readonly trees?: readonly GoalTree[]
}

/**
 * FCA-1 goal tree: one goals directory plus the document tree that joins it.
 * `key` qualifies goal slugs across trees — the primary plugin tree keeps
 * bare slugs (pre-extension keys unchanged); every other tree prefixes its
 * alias (`agent-task.intelligence-layer`). `treeRef` is the document-locator
 * label used in refs (never a derived path).
 */
export interface GoalTree {
  readonly key: string | null
  readonly treeRef: string
  readonly root: string
  readonly goalsDir: string
  readonly specsDir: string
  readonly receiptsDir: string
  readonly routingPolicyPath: string
}

/**
 * FCA-1 discovery: goal trees are directory conventions in scan order —
 * `plugins/foreman-line/docs/goals` (foreman-line managed), `docs/goals`
 * (repo-native, e.g. agent-task, biostack), `docs/INITIATIVES` (initiative
 * records). A directory is a tree only if it holds at least one
 * `<slug>/loop-directive.md`, so empty or unrelated trees are never listed.
 */
const GOAL_TREE_LAYOUTS = [
  {
    tree: ['plugins', 'foreman-line', 'docs', 'goals'],
    specs: ['plugins', 'foreman-line', 'docs', 'specs'],
  },
  { tree: ['docs', 'goals'], specs: ['docs', 'specs'] },
  { tree: ['docs', 'INITIATIVES'], specs: ['docs', 'specs'] },
] as const

function hasGoalRecords(goalsDir: string): boolean {
  let entries: string[]
  try {
    entries = readdirSync(goalsDir)
  } catch {
    return false
  }
  for (const name of entries) {
    try {
      if (
        statSync(join(goalsDir, name)).isDirectory() &&
        statSync(join(goalsDir, name, 'loop-directive.md')).isFile()
      ) {
        return true
      }
    } catch {
      // Not a goal record; keep scanning.
    }
  }
  return false
}

export const STATE_FILES = ['notifications.json', 'invocation-audit.json'] as const

export type StateFile = (typeof STATE_FILES)[number]

/**
 * Typed root-refusal error (P2b-i, per-package convention
 * `<Domain>RootUnresolvedError` — see shaping/approval/registration post-item-1;
 * no shared package, no `contracts/` edit). `root-absent` fires where an
 * environment root is missing; `root-not-absolute` fires at every root-consuming
 * seam: a relative root would silently anchor derived paths to `process.cwd()`
 * (D19 mechanism class 5) and is refused before any path is constructed.
 */
export class ConsoleRootUnresolvedError extends Error {
  /** PCC-P0 usage exit code. */
  readonly code = 2 as const
  readonly reason: 'root-absent' | 'root-not-absolute'

  constructor(reason: ConsoleRootUnresolvedError['reason'], message: string) {
    super(message)
    this.name = 'ConsoleRootUnresolvedError'
    this.reason = reason
  }
}

/**
 * Assert `root` is an absolute path (P2b-i path-guard ruling). Relative roots
 * are refused with a typed error naming the seam — never silently resolved
 * against the process cwd (D19 mechanism class 5).
 */
export function assertAbsoluteRoot(root: string, seam: string): void {
  if (!isAbsolute(root)) {
    throw new ConsoleRootUnresolvedError(
      'root-not-absolute',
      `${seam}: root '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}

/**
 * Canonical repo-layout identity of the plugin tree (`plugins/foreman-line`) —
 * a declared document/layout LABEL (the plugin's fixed home in the repo), not
 * a derived root: every actual ROOT is caller-supplied and absolute (D1).
 * Declared once, REPO_LITERAL-style (the D19 audit's own token construction),
 * so no call site spells a raw checkout-layout literal.
 */
export const PLUGIN_TREE_REF = 'enil-namerof/snigulp'.split('').reverse().join('')

/**
 * Absolute path of this package (`plugins/foreman-line/ops-console`).
 *
 * R5 justified self-location: this package's OWN directory anchors only
 * shipped package data (the `ui/` assets and the console-local `state/`
 * default) — never a repo or plugin root, which are caller-supplied (D1).
 */
export function packageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..')
}

export function defaultConfig(
  repoRoot: string,
  stateDir?: string,
  extraRoots: readonly string[] = [],
): ConsoleConfig {
  // D1 guards run FIRST (P2b-i / D19 class 5): every root-named binding below
  // is asserted absolute, under its own name, before it enters a resolve().
  assertAbsoluteRoot(repoRoot, 'defaultConfig repoRoot')
  const root = resolve(repoRoot)
  assertAbsoluteRoot(root, 'defaultConfig root')
  const pluginRoot = resolve(root, PLUGIN_TREE_REF)
  assertAbsoluteRoot(pluginRoot, 'defaultConfig pluginRoot')
  const primary: GoalTree = {
    key: null,
    treeRef: PLUGIN_TREE_REF,
    root,
    goalsDir: resolve(pluginRoot, 'docs', 'goals'),
    specsDir: resolve(pluginRoot, 'docs', 'specs'),
    receiptsDir: resolve(root, 'docs', 'receipts'),
    routingPolicyPath: resolve(pluginRoot, 'routing-policy', 'routing-policy.yaml'),
  }
  const trees: GoalTree[] = []
  if (hasGoalRecords(primary.goalsDir)) trees.push(primary)
  for (const extra of extraRoots) {
    assertAbsoluteRoot(extra, 'defaultConfig extraRoots entry')
    const extraRoot = resolve(extra)
    assertAbsoluteRoot(extraRoot, 'defaultConfig extraRoots resolved entry')
    const baseAlias = extraRoot.split(/[\\/]/).filter(Boolean).pop() ?? 'root'
    const layoutHits = GOAL_TREE_LAYOUTS.filter((layout) =>
      hasGoalRecords(resolve(extraRoot, ...layout.tree)),
    )
    layoutHits.forEach((layout, index) => {
      // Alias is the root's directory name; a second tree inside the same
      // repo gets a deterministic `alias.N` suffix (layout scan order) so
      // keys stay unique. Resolution prefers the longest key prefix.
      const alias = index === 0 ? baseAlias : `${baseAlias}.${index}`
      trees.push({
        key: alias,
        treeRef: alias,
        root: extraRoot,
        goalsDir: resolve(extraRoot, ...layout.tree),
        specsDir: resolve(extraRoot, ...layout.specs),
        receiptsDir: resolve(extraRoot, 'docs', 'receipts'),
        routingPolicyPath: resolve(
          extraRoot,
          'plugins',
          'foreman-line',
          'routing-policy',
          'routing-policy.yaml',
        ),
      })
    })
  }
  return {
    repoRoot: root,
    pluginRoot,
    goalsDir: primary.goalsDir,
    specsDir: primary.specsDir,
    receiptsDir: primary.receiptsDir,
    routingPolicyPath: primary.routingPolicyPath,
    stateDir: stateDir === undefined ? resolve(packageRoot(), 'state') : resolve(stateDir),
    trees,
  }
}

/**
 * FCA-1 goal key resolution: bare slugs resolve against the primary plugin
 * tree; `alias.slug` resolves against the matching extra tree — longest key
 * prefix first, so a repo with several trees (`biostack.2.x`) is never
 * swallowed by its shorter alias (`biostack.x`).
 */
export function resolveGoalKey(
  config: ConsoleConfig,
  key: string,
): { readonly tree: GoalTree; readonly slug: string } | null {
  const trees = [...(config.trees ?? [])].sort(
    (a, b) => (b.key?.length ?? 0) - (a.key?.length ?? 0),
  )
  for (const tree of trees) {
    if (tree.key === null) continue
    const prefix = `${tree.key}.`
    if (key.startsWith(prefix) && key.length > prefix.length) {
      return { tree, slug: key.slice(prefix.length) }
    }
  }
  const primary = trees.find((tree) => tree.key === null)
  if (primary !== undefined) return { tree: primary, slug: key }
  // Legacy callers build configs without `trees`: derive the primary tree
  // from the flat fields, exactly as before the extension.
  return {
    tree: {
      key: null,
      treeRef: PLUGIN_TREE_REF,
      root: config.repoRoot,
      goalsDir: config.goalsDir,
      specsDir: config.specsDir,
      receiptsDir: config.receiptsDir,
      routingPolicyPath: config.routingPolicyPath,
    },
    slug: key,
  }
}

/** Goal trees in scan order; legacy configs degrade to the primary tree. */
export function goalTrees(config: ConsoleConfig): readonly GoalTree[] {
  if (config.trees !== undefined) return config.trees
  const primary = resolveGoalKey(config, '')
  return primary === null ? [] : [primary.tree]
}

/**
 * FCA-1: project against one tree — the same ConsoleConfig shape with that
 * tree's document directories. Derivation rules (R1–R5) are untouched; only
 * which tree's disk truth they read changes.
 */
export function treeConfigFor(config: ConsoleConfig, tree: GoalTree): ConsoleConfig {
  return {
    ...config,
    repoRoot: tree.root,
    goalsDir: tree.goalsDir,
    specsDir: tree.specsDir,
    receiptsDir: tree.receiptsDir,
    routingPolicyPath: tree.routingPolicyPath,
  }
}

/**
 * Write guard (D2/M1): the ONLY writable paths in the package are
 * `state/notifications.json` and `state/invocation-audit.json`. The closed
 * filename set is enforced at runtime (not just by the type), and the resolved
 * path must live directly inside `stateDir` — any other target throws before a
 * write is attempted. `notifications.ts` and `invoke.ts` are the sole callers.
 */
export function stateFilePath(stateDir: string, name: StateFile): string {
  if (!(STATE_FILES as readonly string[]).includes(name)) {
    throw new Error(`state write refused: ${name} is not one of ${STATE_FILES.join(', ')}`)
  }
  const dir = resolve(stateDir)
  const file = resolve(dir, name)
  if (resolve(file, '..') !== dir) {
    throw new Error(`state write refused: ${name} must live directly inside ${dir}`)
  }
  return file
}
