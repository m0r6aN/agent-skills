/**
 * Filesystem writes for the scaffolder: atomic file creation and explicit
 * collision handling. A write lands via a same-directory temp file plus
 * rename, so a crash never leaves a half-written target; an unexpected
 * collision (a target that exists where a create was planned, or a path whose
 * type contradicts the plan) is reported, never overwritten.
 */
import { existsSync, mkdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { ScaffoldError } from './errors.js'

let tempCounter = 0

/** Creates `dir` recursively; refuses when a path segment exists as a file. */
export function ensureDir(dir: string): void {
  if (existsSync(dir)) {
    if (!statSync(dir).isDirectory()) {
      throw new ScaffoldError(
        'PATH_TYPE_CONFLICT',
        'a directory is required at this path but a non-directory already exists there',
        [dir],
      )
    }
    return
  }
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    throw new ScaffoldError(
      'ENVIRONMENT',
      `cannot create directory: ${err instanceof Error ? err.message : String(err)}`,
      [dir],
    )
  }
}

/** Atomically writes `content` to `file` (temp file + rename). Replaces an
 * existing file only when the caller has already decided the write is the
 * managed-block exception. */
export function atomicWriteFile(file: string, content: string): void {
  const dir = dirname(file)
  ensureDir(dir)
  const temp = join(dir, `.${basename(file)}.tmp-${process.pid}-${tempCounter++}`)
  try {
    writeFileSync(temp, content, { encoding: 'utf8', flag: 'wx' })
    renameSync(temp, file)
  } catch (err) {
    try {
      if (existsSync(temp)) unlinkSync(temp)
    } catch {
      // best-effort temp cleanup; the typed error below is what the caller sees
    }
    throw new ScaffoldError(
      'ENVIRONMENT',
      `cannot write file: ${err instanceof Error ? err.message : String(err)}`,
      [file],
    )
  }
}
