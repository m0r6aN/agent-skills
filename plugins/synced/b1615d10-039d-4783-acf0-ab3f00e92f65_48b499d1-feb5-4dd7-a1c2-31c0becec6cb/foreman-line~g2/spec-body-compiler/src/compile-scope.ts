/**
 * Compiled-scope assembly and the package's named I/O seam (FK-P2).
 *
 * `compileScope` is pure: it assembles the closed artifact document, sorts
 * every list by UTF-16 code-unit order of the canonical spelling (source order
 * can never move the artifact bytes), and binds `compiledScopeDigest` per
 * F05.5. D10: `surfaces:` is never read here — mutation authority comes
 * exclusively from `## Allowed Files`.
 *
 * `verifyCompiledPaths` is the single explicit filesystem seam: it walks every
 * path component and the final target with `lstat`, refusing any symlink,
 * junction, or other reparse point — including links whose targets remain
 * inside the root (D19) — and refuses non-regular targets (reported as
 * `LINK_TARGET_RACE`, a target-integrity refusal). The opened-target race is a
 * named descriptor: consumers re-verify after open via `reverifyOpenedTarget`,
 * which compares the opened handle's identity against the identity captured at
 * check time and therefore detects substitution (including the double-swap
 * that would fool a path re-check).
 */
import { fstatSync, lstatSync, readlinkSync, type Stats } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { compiledScopeDigestFor } from './canonical-output.js'
import { ScopeCompileError, ScopeIoError } from './errors.js'
import { GRAMMAR_PIN, type ParseStats, parseSpec } from './parse-spec.js'

export interface CompiledScopeArtifact {
  artifactVersion: '0.1.0'
  grammar: {
    convention: 'SPEC-CONVENTION'
    schemaRevision: 'v0.4'
    revisionDate: '2026-09-27'
    sectionDigest: string
    fileDigest: string
  }
  spec: {
    ticket: string
    specPath: string
  }
  allowedFiles: string[]
  frozenSurfaces: string[]
  forbiddenSurfaces: string[]
  authorityState: 'granted' | 'empty'
  compiledScopeDigest: string
}

export interface CompileResult {
  artifact: CompiledScopeArtifact
  compiledScopeDigest: string
  stats: ParseStats
}

export interface VerifiedTarget {
  path: string
  dev: number
  ino: number
}

/** Compiles a spec body to `{ artifact, compiledScopeDigest }` (pure). */
export function compileScope(
  input: string | Uint8Array,
  opts: { specPath: string },
): CompileResult {
  const stats: ParseStats = { bytesExamined: 0, entriesExamined: 0 }
  const parsed = parseSpec(input, stats)
  const allowedFiles = [...parsed.allowedFiles].sort()
  const frozenSurfaces = [...parsed.frozenSurfaces].sort()
  const forbiddenSurfaces = [...parsed.forbiddenSurfaces].sort()
  const body = {
    artifactVersion: '0.1.0' as const,
    grammar: {
      convention: GRAMMAR_PIN.convention,
      schemaRevision: GRAMMAR_PIN.schemaRevision,
      revisionDate: GRAMMAR_PIN.revisionDate,
      sectionDigest: GRAMMAR_PIN.sectionDigest,
      fileDigest: GRAMMAR_PIN.fileDigest,
    },
    spec: { ticket: parsed.ticket, specPath: opts.specPath },
    allowedFiles,
    frozenSurfaces,
    forbiddenSurfaces,
    authorityState: (allowedFiles.length > 0 ? 'granted' : 'empty') as 'granted' | 'empty',
  }
  const compiledScopeDigest = compiledScopeDigestFor(body)
  return {
    artifact: { ...body, compiledScopeDigest },
    compiledScopeDigest,
    stats,
  }
}

/**
 * Every consumption boundary MUST refuse `authorityState: 'empty'`: the empty
 * mutation set is never widened (OQ-1).
 */
export function assertDispatchable(artifact: { authorityState: 'granted' | 'empty' }): void {
  if (artifact.authorityState !== 'granted') {
    throw new ScopeCompileError(
      'MISSING_AUTHORITY',
      'empty mutation authority never authorizes a mutation',
    )
  }
}

function insideRoot(resolvedRoot: string, candidate: string): boolean {
  const normalize = (value: string) => {
    let out = value
    if (out.startsWith('\\\\?\\')) out = out.slice(4)
    return out.toLowerCase()
  }
  const root = normalize(resolvedRoot)
  const target = normalize(candidate)
  return target === root || target.startsWith(`${root}${sep}`) || target.startsWith(`${root}/`)
}

function scopeBasePath(ref: string): string {
  return ref.endsWith('/**') ? ref.slice(0, -3) : ref
}

/**
 * Tree check seam: walks every path component and the final target of every
 * compiled path (grants and negative-scope base paths) under `root`. Missing
 * components are permitted (targets not yet materialized); every existing
 * component must be a real directory or regular file — reparse points are
 * refused wherever they appear and wherever they point.
 */
export function verifyCompiledPaths(
  root: string,
  artifact: CompiledScopeArtifact,
): VerifiedTarget[] {
  const resolvedRoot = resolve(root)
  try {
    const rootStat = lstatSync(resolvedRoot)
    if (rootStat.isSymbolicLink()) {
      throw new ScopeCompileError('LINK_IN_ROOT', 'root itself is a reparse point')
    }
  } catch (error) {
    if (error instanceof ScopeCompileError) throw error
    throw new ScopeIoError(`cannot stat verification root ${resolvedRoot}`, error)
  }
  const refs = [
    ...artifact.allowedFiles,
    ...artifact.frozenSurfaces.map(scopeBasePath),
    ...artifact.forbiddenSurfaces.map(scopeBasePath),
  ]
  const verified: VerifiedTarget[] = []
  for (const ref of refs) {
    const segments = ref.split('/')
    for (let i = 0; i < segments.length; i += 1) {
      const partial = join(resolvedRoot, ...segments.slice(0, i + 1))
      let stat: Stats
      try {
        stat = lstatSync(partial)
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (code === 'ENOENT' || code === 'ENOTDIR') break
        throw new ScopeIoError(`cannot lstat ${partial}`, error)
      }
      if (stat.isSymbolicLink()) {
        let target = ''
        try {
          target = readlinkSync(partial)
        } catch (error) {
          throw new ScopeIoError(`cannot readlink ${partial}`, error)
        }
        const resolvedTarget = resolve(dirname(partial), target)
        const code = insideRoot(resolvedRoot, resolvedTarget) ? 'LINK_IN_ROOT' : 'LINK_ESCAPE'
        throw new ScopeCompileError(code, `reparse point refused at ${ref}`, { entryList: null })
      }
      const isFinal = i === segments.length - 1
      if (!isFinal) {
        if (!stat.isDirectory()) break
        continue
      }
      if (!stat.isFile()) {
        throw new ScopeCompileError('LINK_TARGET_RACE', `non-regular target refused at ${ref}`)
      }
      verified.push({ path: ref, dev: stat.dev, ino: stat.ino })
    }
  }
  return verified
}

/**
 * Opened-target re-verify (the LINK-08 contract): compare the OPENED handle's
 * identity against the identity captured by {@link verifyCompiledPaths}. A
 * substitution between check and use — even one swapped back off the path —
 * changes the handle identity and fails here; this never re-checks the
 * original path.
 */
export function reverifyOpenedTarget(fd: number, expected: VerifiedTarget): void {
  let stat: Stats
  try {
    stat = fstatSync(fd)
  } catch (error) {
    throw new ScopeIoError('cannot fstat opened target', error)
  }
  if (!stat.isFile() || stat.dev !== expected.dev || stat.ino !== expected.ino) {
    throw new ScopeCompileError(
      'LINK_TARGET_RACE',
      `opened target identity mismatch for ${expected.path}`,
    )
  }
}
