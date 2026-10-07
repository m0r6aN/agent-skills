/**
 * Shared test scaffolding: ephemeral target roots, typed-args builders, tree
 * snapshots for byte-level assertions, CLI spawning, and the clean-room
 * fixture spec (D11 shape: `surfaces:` plus an `## Allowed Files` section,
 * and `involves:` against an empty capability map for verification item 8's
 * linter half).
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ScaffoldArgs } from '../src/args.js'

export const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
export const TEMPLATES_DIR = join(PACKAGE_ROOT, '..', 'templates')
export const SPEC_LINTER_CLI = join(PACKAGE_ROOT, '..', 'spec-linter', 'src', 'cli.ts')
const TSX_CLI = join(PACKAGE_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')
export const SCAFFOLD_CLI = join(PACKAGE_ROOT, 'src', 'cli.ts')

export function makeTempRoot(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `${prefix}-`))
}

export function scaffoldArgs(
  overrides: Partial<ScaffoldArgs> & { targetRoot: string },
): ScaffoldArgs {
  return {
    mode: 'apply',
    projectName: 'Example Project',
    slug: 'example-project',
    baseBranch: 'main',
    branchPrefix: 'work/',
    worktreeRoot: '.worktrees',
    templatesDir: TEMPLATES_DIR,
    ...overrides,
  }
}

/** rel path -> sha256 of content; directories are not represented. */
export function treeSnapshot(root: string): Map<string, string> {
  const snapshot = new Map<string, string>()
  const stack: string[] = [root]
  while (stack.length > 0) {
    const dir = stack.pop() as string
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile()) {
        const rel = full.slice(root.length).replace(/\\/g, '/').replace(/^\//, '')
        snapshot.set(rel, createHash('sha256').update(readFileSync(full)).digest('hex'))
      }
    }
  }
  return snapshot
}

export function cloneTemplates(destination: string): string {
  const cloned = join(destination, 'templates')
  cpSync(TEMPLATES_DIR, cloned, { recursive: true })
  return cloned
}

export interface CliResult {
  readonly status: number
  readonly stdout: string
  readonly stderr: string
}

export function runScaffoldCli(argv: readonly string[], cwd?: string): CliResult {
  const result = spawnSync(process.execPath, [TSX_CLI, SCAFFOLD_CLI, ...argv], {
    cwd: cwd ?? PACKAGE_ROOT,
    encoding: 'utf8',
  })
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr }
}

export function runSpecLinter(argv: readonly string[]): CliResult {
  const result = spawnSync(process.execPath, [TSX_CLI, SPEC_LINTER_CLI, ...argv], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
  })
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr }
}

export function fileExists(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}

export function writeFixtureSpec(root: string, name = 'fixture-spec.md'): string {
  const activeDir = join(root, 'docs', 'specs', 'active')
  mkdirSync(activeDir, { recursive: true })
  const path = join(activeDir, name)
  const content = [
    '---',
    'ticket: PROJ-1',
    'title: Fixture spec — minimal, D11 shape',
    'status: active',
    'owner: project-maintainer',
    'created: 2026-09-26',
    'updated: 2026-09-26',
    'supersedes: null',
    'superseded_by: null',
    'risk: standard',
    'surfaces: [docs/specs/active/fixture-spec.md]',
    'routing_class: standard-feature',
    'verification_class: judgment-required',
    'permission_profile: builder-standard',
    'involves: [ticketing]',
    '---',
    '',
    '# Fixture spec',
    '',
    'Minimal fixture exercising the generated canon the scaffold wired up.',
    '',
    '## Allowed Files',
    '- docs/specs/active/fixture-spec.md',
    '',
  ].join('\n')
  writeFileSync(path, content, 'utf8')
  return path
}
