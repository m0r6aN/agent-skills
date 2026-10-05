/**
 * Channel fixtures: throwaway temp workspaces, link-tree materialization, and
 * shared actor helpers. Every case runs its named dimension only, in a
 * throwaway workspace (never inside the repo tree) — the shipped surfaces are
 * invoked read-only and their digests are asserted unchanged (AC8).
 */

import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256Hex } from '../canonical.js'
import { HarnessError, wrapExternal } from '../errors.js'
import { pluginRoot } from '../surface-refs.js'

export interface ScopeEnvelope {
  readonly allowedFiles: readonly string[]
  readonly forbiddenSurfaces: readonly string[]
}

export interface TempWorkspace {
  readonly root: string
  readonly scopeDir: string
  readonly outsideDir: string
  dispose(): void
}

/** Create a throwaway workspace with in-scope and out-of-scope regions. */
export function createWorkspace(): TempWorkspace {
  const root = mkdtempSync(join(tmpdir(), 'fk-p17-ws-'))
  const scopeDir = join(root, 'scope')
  const outsideDir = join(root, 'outside')
  mkdirSync(join(scopeDir, 'forbidden'), { recursive: true })
  mkdirSync(outsideDir, { recursive: true })
  return {
    root,
    scopeDir,
    outsideDir,
    dispose() {
      rmSync(root, { recursive: true, force: true })
    },
  }
}

/** Repo-relative POSIX spelling of a path inside the workspace. */
export function relativePosix(root: string, absolutePath: string): string {
  return resolve(absolutePath)
    .slice(resolve(root).length + 1)
    .replaceAll('\\', '/')
}

/** Absolute path of the shipped hook (read-only input). */
export function hookScriptPath(): string {
  return join(pluginRoot(), 'hooks', 'model-gate.mjs')
}

/** The hook's real state directory (%TEMP%/foreman-line-model-gate). */
export function hookStateDir(): string {
  return join(tmpdir(), 'foreman-line-model-gate')
}

/** Mirror of the hook's statePath session-id sanitization (linear, no regex). */
export function hookStateFile(sessionId: string): string {
  let safe = ''
  for (const ch of sessionId) {
    const isWord = (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')
    safe += isWord || ch === '_' || ch === '-' ? ch : '_'
  }
  return join(hookStateDir(), `${safe}.json`)
}

/** Record a file's realpath + content hash before/after an effect (realpath diff). */
export interface FileProbe {
  readonly exists: boolean
  readonly realpath: string | null
  readonly contentHash: string | null
}

export function probeFile(path: string): FileProbe {
  if (!existsSync(path)) return { exists: false, realpath: null, contentHash: null }
  let isRegular = false
  try {
    isRegular = statSync(path).isFile()
  } catch {
    isRegular = false
  }
  return {
    exists: true,
    realpath: wrapExternal('CHANNEL_EXEC_FAILED', `realpath ${path}`, () => realpathSync(path)),
    contentHash: isRegular ? sha256Hex(readFileSync(path)) : null,
  }
}

export interface LinkTreeDescriptor {
  readonly id: string
  readonly kind:
    | 'file-symlink'
    | 'junction'
    | 'in-scope-symlink'
    | 'case-variant'
    | 'trailing-dot-alias'
    | 'regular-file'
  readonly link: string
  readonly target: string
  readonly writesThrough: boolean
  readonly notes: string
}

export interface LinkTreeResult {
  readonly descriptor: LinkTreeDescriptor
  readonly materialized: boolean
  readonly gapReason: string | null
  readonly linkPath: string
  readonly targetPath: string
}

/**
 * Materialize one link-tree descriptor inside a workspace. Directory
 * junctions MUST execute (chain hard-fails if the platform cannot); file
 * symlinks may fall back to a `blocked: <privilege reason>` gap record (AC9).
 */
export function materializeLinkTree(ws: TempWorkspace, d: LinkTreeDescriptor): LinkTreeResult {
  const linkPath = join(ws.root, ...d.link.split('/'))
  const targetPath = join(ws.root, ...d.target.split('/'))
  mkdirSync(dirname(linkPath), { recursive: true })
  mkdirSync(dirname(targetPath), { recursive: true })

  if (d.kind === 'regular-file' || d.kind === 'case-variant' || d.kind === 'trailing-dot-alias') {
    if (!existsSync(targetPath)) writeFileSync(targetPath, 'original', 'utf8')
    return { descriptor: d, materialized: true, gapReason: null, linkPath, targetPath }
  }

  try {
    if (d.kind === 'junction') {
      // Junctions must execute: failure here is a hard chain failure (AC9).
      // The target is a DIRECTORY (the write lands inside it).
      mkdirSync(targetPath, { recursive: true })
      execFileSync('cmd', ['/c', 'mklink', '/J', linkPath, targetPath], { stdio: 'pipe' })
    } else {
      // file-symlink / in-scope-symlink: may require privileges on Windows.
      if (!existsSync(targetPath)) writeFileSync(targetPath, 'original', 'utf8')
      execFileSync('cmd', ['/c', 'mklink', linkPath, targetPath], { stdio: 'pipe' })
    }
    return { descriptor: d, materialized: true, gapReason: null, linkPath, targetPath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (d.kind === 'junction') {
      throw new HarnessError(
        'CHANNEL_SETUP_FAILED',
        `junction cases MUST execute; mklink /J failed: ${message}`,
      )
    }
    return {
      descriptor: d,
      materialized: false,
      gapReason: `blocked: file-symlink creation unavailable (privilege: ${message})`,
      linkPath,
      targetPath,
    }
  }
}

const NODE_WRITE_SCRIPT =
  "require('node:fs').writeFileSync(process.argv[1], process.argv[2] ?? 'x', 'utf8')"

/** Direct `node -e` fs write (the V1/V2/V6–V8 mutation actor). */
export function shellWrite(target: string, content: string): void {
  const result = spawnSync(process.execPath, ['-e', NODE_WRITE_SCRIPT, target, content], {
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (result.status !== 0) {
    throw new HarnessError(
      'CHANNEL_EXEC_FAILED',
      `node -e write exited ${String(result.status)}: ${(result.stderr ?? '').slice(0, 300)}`,
    )
  }
}

/** Direct `node -e` fs delete. */
export function shellDelete(target: string): void {
  const result = spawnSync(
    process.execPath,
    ['-e', "require('node:fs').rmSync(process.argv[1], {force: true})", target],
    { encoding: 'utf8', timeout: 30_000 },
  )
  if (result.status !== 0) {
    throw new HarnessError('CHANNEL_EXEC_FAILED', `node -e delete exited ${String(result.status)}`)
  }
}

/** Direct `node -e` fs rename. */
export function shellRename(from: string, to: string): void {
  const result = spawnSync(
    process.execPath,
    ['-e', "require('node:fs').renameSync(process.argv[1], process.argv[2])", from, to],
    { encoding: 'utf8', timeout: 30_000 },
  )
  if (result.status !== 0) {
    throw new HarnessError('CHANNEL_EXEC_FAILED', `node -e rename exited ${String(result.status)}`)
  }
}

/** PowerShell-indirected write (BYP-SH-03). */
export function powershellWrite(target: string, content: string): void {
  const command = `Set-Content -LiteralPath '${target.replaceAll("'", "''")}' -Value '${content.replaceAll("'", "''")}'`
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    {
      encoding: 'utf8',
      timeout: 60_000,
    },
  )
  if (result.status !== 0) {
    throw new HarnessError(
      'CHANNEL_EXEC_FAILED',
      `powershell write exited ${String(result.status)}: ${(result.stderr ?? '').slice(0, 300)}`,
    )
  }
}

/** Load the 6 link-tree descriptors from tests/fixtures/link-trees.json. */
export function loadLinkTreeDescriptors(): Record<string, LinkTreeDescriptor> {
  const path = join(
    dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
    'tests',
    'fixtures',
    'link-trees.json',
  )
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as { trees: LinkTreeDescriptor[] }
  const byId: Record<string, LinkTreeDescriptor> = {}
  for (const tree of parsed.trees) byId[tree.id] = tree
  return byId
}

/** Shared millisecond delay. */
export function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/** Write a throwaway actor script into the workspace (never in the repo tree). */
export function writeActorScript(ws: TempWorkspace, name: string, source: string): string {
  const path = join(ws.root, name)
  writeFileSync(path, source, 'utf8')
  return path
}

/** Run a throwaway actor script with node; typed failure on non-zero exit. */
export function runActorScript(scriptPath: string, args: readonly string[] = []): void {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    timeout: 30_000,
  })
  if (result.error) {
    throw new HarnessError('CHANNEL_EXEC_FAILED', `actor failed to spawn: ${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new HarnessError(
      'CHANNEL_EXEC_FAILED',
      `actor exited ${String(result.status)}: ${(result.stderr ?? '').slice(0, 400)}`,
    )
  }
}
