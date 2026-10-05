/**
 * Path gate (FK-P9 startup step 1): `validateStoragePath` refuses every path
 * dimension with `STORAGE_PATH_REFUSED` (backup destinations: same guard,
 * `BACKUP_DESTINATION_REFUSED`) and a closed reasonCode — reason literal plus
 * path-form-only diagnostics. No host path is ever echoed.
 *
 * Accepted form: repo-root-relative or the configured absolute form (the
 * configured root itself, identity-matched — never a new absolute path).
 *
 * Documented first-failure order (the precedence-edge tests pin this order;
 * when several dimensions are violated, the first listed reason fires):
 *
 *   1. unpaired-surrogate   2. control-char        3. format-char
 *   4. absolute (device namespace, UNC, drive letter, POSIX — in that order)
 *   5. backslash            6. encoded-escape      7. ads-colon
 *   8. traversal            9. reserved-name      10. short-name
 *  11. trailing-dot-space  12. non-nfc
 *  13. filesystem phase: outside-root / link-component / link-target /
 *      not-regular (per component), then the opened-target re-verify.
 *
 * Character classes are scanned by UTF-16 code unit with explicit numeric
 * ranges (no escape-sequence regexes) — linear-time throughout (constraint #5).
 */
import { closeSync, fstatSync, lstatSync, openSync, realpathSync, type Stats } from 'node:fs'
import { join } from 'node:path'
import { type PathRefusalReason, storageError } from './errors.js'

/** Identity of a checked target, captured for the opened-target re-verify. */
export interface FileIdentity {
  dev: number
  ino: number
  size: number
  mtimeMs: number
}

/** A target that passed the full path gate. `absPath` is never echoed. */
export interface CheckedTarget {
  absPath: string
  identity: FileIdentity | null
  existed: boolean
}

const BS = String.fromCharCode(92)
const DEVICE_NAMESPACE_PREFIXES = [`${BS}${BS}?${BS}`, `${BS}${BS}.${BS}`, '//./', '//?/']
const DRIVE_ABSOLUTE_RE = /^[A-Za-z]:/
const RESERVED_NAMES_RE = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])([.]|$)/i

function hasUnpairedSurrogate(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next < 0xdc00 || next > 0xdfff) return true
      i += 1
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true
    }
  }
  return false
}

/** C0/C1 control characters (U+0000–U+001F, U+007F–U+009F). */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit <= 0x1f || (unit >= 0x7f && unit <= 0x9f)) return true
  }
  return false
}

/**
 * Unicode format characters (general category Cf, plus the zero-width and BOM
 * code points the C7 fixtures name explicitly): bidirectional controls,
 * zero-width space/joiners, byte-order mark, invisible operators, Arabic
 * number-sign/annotation controls.
 */
function hasFormatChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (
      unit === 0x00ad ||
      (unit >= 0x0600 && unit <= 0x0605) ||
      unit === 0x061c ||
      unit === 0x06dd ||
      unit === 0x070f ||
      unit === 0x08e2 ||
      unit === 0x180e ||
      (unit >= 0x200b && unit <= 0x200f) ||
      (unit >= 0x202a && unit <= 0x202e) ||
      (unit >= 0x2060 && unit <= 0x2064) ||
      (unit >= 0x2066 && unit <= 0x206f) ||
      unit === 0xfeff ||
      (unit >= 0xfff9 && unit <= 0xfffb)
    ) {
      return true
    }
  }
  return false
}

/**
 * Pure form check. Returns the first-failure reasonCode, or `null` when the
 * input is a well-formed relative path (or the configured absolute form, which
 * the caller identity-matches before calling this with its relative remainder).
 */
export function formRefusalReason(input: string): PathRefusalReason | null {
  if (input.length === 0) return 'traversal'
  if (hasUnpairedSurrogate(input)) return 'unpaired-surrogate'
  if (hasControlChar(input)) return 'control-char'
  if (hasFormatChar(input)) return 'format-char'
  for (const prefix of DEVICE_NAMESPACE_PREFIXES) {
    if (input.startsWith(prefix)) return 'absolute'
  }
  if (input.startsWith(BS + BS)) return 'absolute'
  if (DRIVE_ABSOLUTE_RE.test(input)) return 'absolute'
  if (input.startsWith('/')) return 'absolute'
  if (input.includes(BS)) return 'backslash'
  if (input.includes('%')) return 'encoded-escape'
  if (input.includes(':')) return 'ads-colon'
  for (const segment of input.split('/')) {
    if (segment.length === 0 || segment === '.' || segment === '..') return 'traversal'
    if (RESERVED_NAMES_RE.test(segment)) return 'reserved-name'
    if (segment.includes('~')) return 'short-name'
    if (segment.endsWith('.') || segment.endsWith(' ')) return 'trailing-dot-space'
    if (segment !== segment.normalize('NFC')) return 'non-nfc'
  }
  return null
}

function refusalReasonOrThrow(
  input: string,
  code: 'STORAGE_PATH_REFUSED' | 'BACKUP_DESTINATION_REFUSED',
): void {
  const reason = formRefusalReason(input)
  if (reason !== null) throw storageError(code, { reasonCode: reason })
}

function identityOf(stats: {
  dev: number
  ino: number
  size: number
  mtimeMs: number
}): FileIdentity {
  return { dev: stats.dev, ino: stats.ino, size: stats.size, mtimeMs: stats.mtimeMs }
}

function sameIdentity(a: FileIdentity, b: FileIdentity): boolean {
  return a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs
}

function withinRoot(candidate: string, root: string): boolean {
  const normalizedCandidate = candidate.split('\\').join('/').toLowerCase()
  const normalizedRoot = root.split('\\').join('/').toLowerCase()
  return (
    normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}/`)
  )
}

function linkRefusalReason(
  resolvedTarget: string,
  root: string,
  isFinal: boolean,
): PathRefusalReason {
  return withinRoot(resolvedTarget, root)
    ? isFinal
      ? 'link-target'
      : 'link-component'
    : 'outside-root'
}

/**
 * Full path gate over one target below `rootAbs`: form check, then an `lstat`
 * walk of every component. Symlinks/junctions/reparse points refuse —
 * including in-root targets (D19-consistent). Non-regular final targets refuse.
 * `expectAbsent` allows the final component to be absent (fresh-create flow).
 */
export function checkTarget(opts: {
  rootAbs: string
  relative: string
  expectAbsent?: boolean
  code?: 'STORAGE_PATH_REFUSED' | 'BACKUP_DESTINATION_REFUSED'
}): CheckedTarget {
  const code = opts.code ?? 'STORAGE_PATH_REFUSED'
  refusalReasonOrThrow(opts.relative, code)
  const absPath = join(opts.rootAbs, opts.relative)
  // Link-target containment compares REAL paths (the temp root itself may sit
  // behind a redirected mount), so the root is resolved once up front.
  let realRoot: string
  try {
    realRoot = realpathSync(opts.rootAbs)
  } catch {
    realRoot = opts.rootAbs
  }
  const segments = opts.relative.split('/')
  let walk = opts.rootAbs
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i] as string
    walk = join(walk, segment)
    const isFinal = i === segments.length - 1
    let stats: Stats
    try {
      stats = lstatSync(walk)
    } catch {
      if (isFinal && opts.expectAbsent === true) {
        return { absPath, identity: null, existed: false }
      }
      throw storageError(code, { reasonCode: 'not-regular' })
    }
    if (stats.isSymbolicLink()) {
      let resolvedTarget: string
      try {
        resolvedTarget = realpathSync(walk)
      } catch {
        resolvedTarget = `${walk} unreachable`
      }
      throw storageError(code, {
        reasonCode: linkRefusalReason(resolvedTarget, realRoot, isFinal),
      })
    }
    if (isFinal) {
      if (!stats.isFile()) throw storageError(code, { reasonCode: 'not-regular' })
      return { absPath, identity: identityOf(stats), existed: true }
    }
    if (!stats.isDirectory()) throw storageError(code, { reasonCode: 'not-regular' })
  }
  /* c8 ignore next */
  throw storageError(code, { reasonCode: 'not-regular' })
}

/**
 * Opened-target re-verify (substitution race, C7 PATH-18): the target that was
 * checked must still be the target on disk when the handle opens it. Any
 * substitution — another file, a link, a vanished target — refuses with
 * `link-target`, the only reason literal that describes a wrong target.
 */
export function verifyOpenedTarget(
  checked: CheckedTarget,
  code: 'STORAGE_PATH_REFUSED' | 'BACKUP_DESTINATION_REFUSED' = 'STORAGE_PATH_REFUSED',
): void {
  let stats: Stats
  try {
    stats = lstatSync(checked.absPath)
  } catch {
    throw storageError(code, { reasonCode: 'not-regular' })
  }
  if (stats.isSymbolicLink()) throw storageError(code, { reasonCode: 'link-target' })
  if (!stats.isFile()) throw storageError(code, { reasonCode: 'not-regular' })
  let fd: number
  try {
    fd = openSync(checked.absPath, 'r')
  } catch {
    throw storageError(code, { reasonCode: 'not-regular' })
  }
  try {
    const opened = identityOf(fstatSync(fd))
    const fresh = identityOf(stats)
    if (!sameIdentity(fresh, opened)) {
      throw storageError(code, { reasonCode: 'link-target' })
    }
    if (checked.identity !== null && !sameIdentity(checked.identity, fresh)) {
      throw storageError(code, { reasonCode: 'link-target' })
    }
  } finally {
    closeSync(fd)
  }
}
