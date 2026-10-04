/**
 * The scaffold generator (charter §4.3, P5/P6).
 *
 * Deterministic and byte-exact (D9): the generator computes the gap set,
 * copies absent files from templates/ with enumerated substitution, splices
 * the managed block, emits docs/goals/INDEX.md and the CI workflow, writes
 * foreman/config.yaml, and reports every path as created / skipped-existing /
 * block-appended / block-replaced / block-unchanged.
 *
 * Core invariant: the generator never modifies a file it did not create,
 * with exactly one exception — the managed block region. A file that exists
 * is skipped. Always. No merging, no reconciling, no improving. Every refusal
 * path renders and validates everything BEFORE any write, so a typed error
 * means zero bytes landed.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
// Existing YAML-config contract (single ownership of foreman/config.yaml, D15).
import { parseForemanConfigYaml, validateForemanConfig } from '../../foreman-config/src/validate.js'
import type { ScaffoldArgs } from './args.js'
import { checkEquivalentLayout } from './equivalent-layout.js'
import { ScaffoldError } from './errors.js'
import { atomicWriteFile, ensureDir } from './fsx.js'
import { spliceManagedBlock } from './managed-block.js'
import {
  ARTIFACTS,
  type ArtifactEntry,
  buildTokenMap,
  DIRECTORY_TARGETS,
  MANAGED_BLOCK_INNER,
  MANAGED_TARGET,
} from './manifest.js'
import { assertNoUnreplaced, substitute, type TokenMap } from './render.js'

export type FileAction =
  | 'create'
  | 'skip-existing'
  | 'block-append'
  | 'block-replace'
  | 'block-unchanged'

export interface PlannedFile {
  readonly target: string
  readonly action: FileAction
  /** Rendered content; present only for actions that write. */
  readonly content?: string
}

export interface ScaffoldPlan {
  readonly targetRoot: string
  readonly files: readonly PlannedFile[]
  readonly dirs: readonly string[]
}

export interface PresetDocument {
  readonly identity?: {
    readonly project_key?: string
    readonly dispatch_queue?: string
  }
  readonly capabilities?: Record<string, readonly string[]>
}

/** Loads a named profile preset (Layer 3) from <templatesDir>/profiles/<name>.yaml. */
function loadPreset(templatesDir: string, presetName: string): PresetDocument {
  const presetPath = join(templatesDir, 'profiles', `${presetName}.yaml`)
  if (!existsSync(presetPath)) {
    throw new ScaffoldError(
      'USAGE',
      `profile preset '${presetName}' does not resolve under the templates directory (a preset is a named file, never inferred)`,
      [presetPath],
    )
  }
  const doc: unknown = parseYaml(readFileSync(presetPath, 'utf8'), { uniqueKeys: true })
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new ScaffoldError('USAGE', `profile preset '${presetName}' is not a preset document`, [
      presetPath,
    ])
  }
  return doc as PresetDocument
}

function readTemplate(templatesDir: string, template: string, target: string): string {
  const templatePath = join(templatesDir, template)
  try {
    return readFileSync(templatePath, 'utf8')
  } catch (err) {
    throw new ScaffoldError(
      'ENVIRONMENT',
      `cannot read template '${template}' for target '${target}': ${err instanceof Error ? err.message : String(err)}`,
      [templatePath],
    )
  }
}

/** Renders an artifact's content for a fresh create, purely in memory. */
function renderArtifact(entry: ArtifactEntry, tokens: TokenMap, templatesDir: string): string {
  if (entry.kind === 'emit') {
    const emitted = entry.render(tokens)
    assertNoUnreplaced(emitted, entry.target)
    return emitted
  }
  const templateText = readTemplate(templatesDir, entry.template, entry.target)
  let rendered = entry.substitute ? substitute(templateText, tokens) : templateText
  if (entry.target === MANAGED_TARGET) {
    rendered = spliceManagedBlock(rendered, MANAGED_BLOCK_INNER, entry.target).text
  }
  assertNoUnreplaced(rendered, entry.target)
  return rendered
}

function planEntry(
  entry: ArtifactEntry,
  tokens: TokenMap,
  targetRoot: string,
  templatesDir: string,
): PlannedFile {
  const targetAbsolute = join(targetRoot, entry.target)

  if (!existsSync(targetAbsolute)) {
    return {
      target: entry.target,
      action: 'create',
      content: renderArtifact(entry, tokens, templatesDir),
    }
  }
  if (!statSync(targetAbsolute).isFile()) {
    throw new ScaffoldError(
      'PATH_TYPE_CONFLICT',
      'target path exists but is not a regular file; refusing to overwrite or merge',
      [entry.target],
    )
  }
  if (entry.target !== MANAGED_TARGET) {
    return { target: entry.target, action: 'skip-existing' }
  }
  const existing = readFileSync(targetAbsolute, 'utf8')
  const spliced = spliceManagedBlock(existing, MANAGED_BLOCK_INNER, entry.target)
  if (spliced.action === 'unchanged') {
    return { target: entry.target, action: 'block-unchanged' }
  }
  return {
    target: entry.target,
    action: spliced.action === 'appended' ? 'block-append' : 'block-replace',
    content: spliced.text,
  }
}

/**
 * Computes the full scaffold plan for `args`. Renders everything in memory,
 * validates any generated foreman/config.yaml against the existing config
 * contract, and refuses on any typed error BEFORE any byte is written.
 */
export function planScaffold(args: ScaffoldArgs): ScaffoldPlan {
  const preset = args.preset === undefined ? undefined : loadPreset(args.templatesDir, args.preset)
  const tokens = buildTokenMap({
    projectName: args.projectName,
    slug: args.slug,
    baseBranch: args.baseBranch,
    branchPrefix: args.branchPrefix,
    worktreeRoot: args.worktreeRoot,
    projectKey: args.projectKey ?? preset?.identity?.project_key,
    dispatchQueue: args.dispatchQueue ?? preset?.identity?.dispatch_queue,
  })

  checkEquivalentLayout(args.targetRoot)

  const files: PlannedFile[] = []
  for (const entry of ARTIFACTS) {
    const planned = planEntry(entry, tokens, args.targetRoot, args.templatesDir)
    if (entry.target === 'foreman/config.yaml' && planned.content !== undefined) {
      const configResult = validateForemanConfig(parseForemanConfigYaml(planned.content))
      if (!configResult.valid) {
        throw new ScaffoldError(
          'VALUE_REFUSED',
          `generated foreman/config.yaml does not satisfy the foreman-config contract: ${configResult.errors.join('; ')}`,
          ['foreman/config.yaml'],
        )
      }
    }
    files.push(planned)
  }

  const dirs = DIRECTORY_TARGETS.filter((dir) => {
    try {
      return !statSync(join(args.targetRoot, dir)).isDirectory()
    } catch {
      return true
    }
  })

  return { targetRoot: args.targetRoot, files, dirs }
}

/**
 * Applies a plan: creates directories and writes only the files the plan
 * marked for writing. A create whose target appeared between plan and apply
 * is downgraded to skip-existing (explicit collision handling — the
 * non-destruction invariant outranks the plan). Partial runs report what
 * landed rather than rolling back (§4.3).
 */
export function applyScaffold(plan: ScaffoldPlan): readonly PlannedFile[] {
  for (const dir of plan.dirs) {
    ensureDir(join(plan.targetRoot, dir))
  }
  const report: PlannedFile[] = []
  for (const file of plan.files) {
    const targetAbsolute = join(plan.targetRoot, file.target)
    if (file.action === 'create' && existsSync(targetAbsolute)) {
      report.push({ target: file.target, action: 'skip-existing' })
      continue
    }
    if (file.content === undefined) {
      report.push(file)
      continue
    }
    atomicWriteFile(targetAbsolute, file.content)
    report.push(file)
  }
  return report
}
