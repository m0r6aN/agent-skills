/**
 * D20 host facts capture. Every evidence record binds a `hostFactsDigest` so a
 * measurement is never read without its host context. Capture failure is the
 * typed `HOST_FACTS_UNAVAILABLE` — never fabricated facts (D13).
 */

import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { arch, cpus, hostname, platform, release, tmpdir, totalmem } from 'node:os'
import { join } from 'node:path'
import { canonicalJson, sha256Hex } from './canonical.js'
import { wrapExternal } from './errors.js'

export interface HostFacts {
  readonly platform: string
  readonly release: string
  readonly arch: string
  readonly nodeVersion: string
  readonly cpuCount: number
  readonly totalMemBytes: number
  readonly hostnameDigest: string
  readonly tempRoot: string
  readonly caseInsensitiveFs: boolean
}

/**
 * Probe whether the temp filesystem is case-insensitive, by writing one file
 * under a throwaway directory and reading it back through a case variant.
 * (V4 BYP-LK-03 semantics depend on this fact.)
 */
function probeCaseInsensitiveFs(): boolean {
  const dir = mkdtempSync(join(tmpdir(), 'fk-p17-hostfacts-'))
  try {
    writeFileSync(join(dir, 'probe.txt'), 'x', 'utf8')
    return existsSync(join(dir, 'PROBE.TXT'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function captureHostFacts(): HostFacts {
  return wrapExternal('HOST_FACTS_UNAVAILABLE', 'host fact capture', () => ({
    platform: platform(),
    release: release(),
    arch: arch(),
    nodeVersion: process.version,
    cpuCount: cpus().length,
    totalMemBytes: totalmem(),
    hostnameDigest: sha256Hex(hostname()),
    tempRoot: tmpdir(),
    caseInsensitiveFs: probeCaseInsensitiveFs(),
  }))
}

/** Digest binding facts into records. */
export function hostFactsDigest(facts: HostFacts): string {
  return `sha256:${sha256Hex(canonicalJson(facts))}`
}
