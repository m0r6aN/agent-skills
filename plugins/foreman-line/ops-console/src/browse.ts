import { existsSync, lstatSync, readdirSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'

/**
 * FCA-P2 sandboxed filesystem browse: one directory level per call, absolute
 * paths only, read-only by construction (dirent names and types; file contents
 * are never read). Symlinks are never followed — symlinked entries list as
 * `other` and a symlinked browse root is refused typed (`path-symlink`), so a
 * listing can never escape the directory it names.
 */

export type BrowseEntryType = 'dir' | 'file' | 'other'

export interface BrowseEntry {
  readonly name: string
  readonly type: BrowseEntryType
  readonly gitWorkTree: boolean
}

export interface BrowseListing {
  readonly path: string
  readonly entries: readonly BrowseEntry[]
}

export type BrowseRefusalReason =
  | 'path-not-absolute'
  | 'path-absent'
  | 'not-a-directory'
  | 'path-symlink'

/** Typed refusal (mirrors the `ConsoleRootUnresolvedError` convention). */
export class BrowseRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: BrowseRefusalReason

  constructor(reason: BrowseRefusalReason, message: string) {
    super(message)
    this.name = 'BrowseRefusalError'
    this.reason = reason
  }
}

const TYPE_RANK: Record<BrowseEntryType, number> = { dir: 0, file: 1, other: 2 }

export function browseDirectory(path: string): BrowseListing {
  if (!isAbsolute(path)) {
    throw new BrowseRefusalError(
      'path-not-absolute',
      `browse refused: ${path} is not an absolute path`,
    )
  }
  let stat: ReturnType<typeof lstatSync>
  try {
    stat = lstatSync(path)
  } catch {
    throw new BrowseRefusalError('path-absent', `browse refused: ${path} does not exist`)
  }
  if (stat.isSymbolicLink()) {
    throw new BrowseRefusalError(
      'path-symlink',
      `browse refused: ${path} is a symlink and is never followed`,
    )
  }
  if (!stat.isDirectory()) {
    throw new BrowseRefusalError('not-a-directory', `browse refused: ${path} is not a directory`)
  }

  const entries: BrowseEntry[] = []
  for (const dirent of readdirSync(path, { withFileTypes: true })) {
    if (dirent.isSymbolicLink()) {
      entries.push({ name: dirent.name, type: 'other', gitWorkTree: false })
      continue
    }
    if (dirent.isDirectory()) {
      entries.push({
        name: dirent.name,
        type: 'dir',
        gitWorkTree: existsSync(join(path, dirent.name, '.git')),
      })
      continue
    }
    entries.push({ name: dirent.name, type: 'file', gitWorkTree: false })
  }
  entries.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : TYPE_RANK[a.type] - TYPE_RANK[b.type],
  )
  return { path, entries }
}
