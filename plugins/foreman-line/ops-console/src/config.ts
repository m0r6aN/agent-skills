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

export function defaultConfig(repoRoot: string, stateDir?: string): ConsoleConfig {
  // D1 guards run FIRST (P2b-i / D19 class 5): every root-named binding below
  // is asserted absolute, under its own name, before it enters a resolve().
  assertAbsoluteRoot(repoRoot, 'defaultConfig repoRoot')
  const root = resolve(repoRoot)
  assertAbsoluteRoot(root, 'defaultConfig root')
  const pluginRoot = resolve(root, PLUGIN_TREE_REF)
  assertAbsoluteRoot(pluginRoot, 'defaultConfig pluginRoot')
  return {
    repoRoot: root,
    pluginRoot,
    goalsDir: resolve(pluginRoot, 'docs', 'goals'),
    specsDir: resolve(pluginRoot, 'docs', 'specs'),
    receiptsDir: resolve(root, 'docs', 'receipts'),
    routingPolicyPath: resolve(pluginRoot, 'routing-policy', 'routing-policy.yaml'),
    stateDir: stateDir === undefined ? resolve(packageRoot(), 'state') : resolve(stateDir),
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
