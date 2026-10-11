import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import type { ConsoleConfig } from './config.js'
import { isRecord } from './guards.js'
import { makeSignal, type Signal, type SignalProvider } from './signals.js'

/**
 * FCA-P3 release-hygiene provider: version drift across a plugin's manifests,
 * its marketplace entries, and README version references — plus unclaimed
 * CHANGELOG backlog sitting under the released version. Canonical version is
 * the first manifest found in `plugin.json` > `.claude-plugin/plugin.json` >
 * `.codex-plugin/plugin.json` order; every other location that disagrees is a
 * stale location and yields one `attention` signal naming itself.
 *
 * "Content landed under a stale version string" is tracked from the source
 * control side (merged PRs missing a release event) by the `scm-ci` provider
 * (Task 7) — disk truth alone cannot see merges.
 */

const MARKETPLACES = [
  '.claude-plugin/marketplace.json',
  '.agents/plugins/marketplace.json',
] as const
const MANIFEST_CANDIDATES = [
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
] as const
const README_PATTERN = /`(\d+\.\d+\.\d+)` release/

interface ManifestRef {
  readonly relPath: string
  readonly version: string
}

interface MarketplaceEntry {
  readonly relPath: string
  readonly name: string
  readonly version: string | null
  readonly dir: string
}

function toRel(root: string, path: string): string {
  return relative(root, path).split(sep).join('/')
}

function readJson(path: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function manifestRefs(root: string, dir: string): ManifestRef[] {
  const refs: ManifestRef[] = []
  for (const rel of MANIFEST_CANDIDATES) {
    const abs = join(dir, rel)
    if (!existsSync(abs)) continue
    const json = readJson(abs)
    if (!isRecord(json) || typeof json.version !== 'string') continue
    refs.push({ relPath: toRel(root, abs), version: json.version })
  }
  return refs
}

function sourcePathOf(entry: Record<string, unknown>): string | null {
  const source = entry.source
  if (typeof source === 'string') return source
  if (isRecord(source) && source.source === 'local' && typeof source.path === 'string') {
    return source.path
  }
  return null
}

function hasUnreleasedBullets(content: string): boolean {
  let inSection = false
  for (const line of content.split('\n')) {
    if (/^##\s+Unreleased\b/.test(line)) {
      inSection = true
      continue
    }
    if (/^##\s/.test(line)) {
      inSection = false
      continue
    }
    if (inSection && /^\s*[-*]\s/.test(line)) return true
  }
  return false
}

function driftSignal(
  root: string,
  subject: string,
  seen: string,
  canonical: ManifestRef,
  detectedAt: string,
): Signal {
  return makeSignal({
    class: 'release-hygiene',
    severity: 'attention',
    repo: root,
    subject,
    evidence: [`${subject}: ${seen}`, `canonical: ${canonical.relPath} = ${canonical.version}`],
    detectedAt,
    actions: ['remediate', 'investigate', 'explain'],
  })
}

export const releaseHygieneProvider: SignalProvider = {
  class: 'release-hygiene',
  collect(config: ConsoleConfig, now: number): Signal[] {
    const root: string = config.repoRoot
    const signals: Signal[] = []
    const detectedAt = new Date(now).toISOString()

    // Marketplace entries first: they bind names + declared versions to dirs.
    const entries: MarketplaceEntry[] = []
    for (const rel of MARKETPLACES) {
      const abs = join(root, rel)
      const json = readJson(abs)
      if (!isRecord(json) || !Array.isArray(json.plugins)) continue
      for (const raw of json.plugins) {
        if (!isRecord(raw)) continue
        const source = sourcePathOf(raw)
        if (source === null) continue
        entries.push({
          relPath: toRel(root, abs),
          name: typeof raw.name === 'string' ? raw.name : '(unnamed)',
          version: typeof raw.version === 'string' ? raw.version : null,
          dir: resolve(root, source),
        })
      }
    }

    // Plugin dirs: marketplace entries union `plugins/*` with a manifest.
    const dirs = new Set<string>(entries.map((entry) => entry.dir))
    const pluginsDir = join(root, 'plugins')
    if (existsSync(pluginsDir)) {
      for (const name of readdirSync(pluginsDir)) {
        const dir = join(pluginsDir, name)
        if (existsSync(join(dir, '.claude-plugin', 'plugin.json'))) dirs.add(dir)
      }
    }

    for (const dir of dirs) {
      const refs = manifestRefs(root, dir)
      if (refs.length === 0) continue
      const canonical = refs[0]
      if (canonical === undefined) continue

      for (const ref of refs.slice(1)) {
        if (ref.version !== canonical.version) {
          signals.push(driftSignal(root, ref.relPath, ref.version, canonical, detectedAt))
        }
      }
      for (const entry of entries) {
        if (entry.dir !== dir || entry.version === null || entry.version === canonical.version)
          continue
        signals.push(
          driftSignal(root, `${entry.relPath}#${entry.name}`, entry.version, canonical, detectedAt),
        )
      }

      const readmeAbs = join(dir, 'README.md')
      if (existsSync(readmeAbs)) {
        const match = README_PATTERN.exec(readFileSync(readmeAbs, 'utf8'))
        if (match !== null && match[1] !== undefined && match[1] !== canonical.version) {
          signals.push(driftSignal(root, toRel(root, readmeAbs), match[1], canonical, detectedAt))
        }
      }

      const changelogAbs = join(dir, 'CHANGELOG.md')
      if (existsSync(changelogAbs) && hasUnreleasedBullets(readFileSync(changelogAbs, 'utf8'))) {
        signals.push(
          makeSignal({
            class: 'release-hygiene',
            severity: 'info',
            repo: root,
            subject: toRel(root, changelogAbs),
            evidence: [
              toRel(root, changelogAbs),
              '## Unreleased',
              `released: ${canonical.version}`,
            ],
            detectedAt,
            actions: ['explain', 'remediate'],
          }),
        )
      }
    }
    return signals
  },
}
