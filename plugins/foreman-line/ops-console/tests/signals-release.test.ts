import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { releaseHygieneProvider } from '../src/signals-release.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P3 release-hygiene provider (Task 5): version drift across a plugin's
 * manifests, marketplace entries, and README version references — plus
 * unclaimed CHANGELOG backlog vs the released version. The drift fixture
 * encodes the 2026-10-11 session incidents (README stale at 0.1.0 while the
 * manifest read 0.2.0/0.2.1; content landing under a stale version string;
 * an `Unreleased` backlog nobody had cut) as the reference cases.
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function releaseScenario(): Scenario {
  return {
    name: 'release-hygiene',
    now: NOW,
    goal: {
      slug: 'goal-rel',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

function writePlugin(
  root: string,
  name: string,
  spec: {
    claudeVersion: string
    codexVersion: string
    readmeVersion: string | null
    changelog: string
  },
): void {
  const dir = join(root, 'plugins', name)
  mkdirSync(join(dir, '.claude-plugin'), { recursive: true })
  mkdirSync(join(dir, '.codex-plugin'), { recursive: true })
  writeFileSync(
    join(dir, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name, version: spec.claudeVersion }),
  )
  writeFileSync(
    join(dir, '.codex-plugin', 'plugin.json'),
    JSON.stringify({ name, version: spec.codexVersion }),
  )
  if (spec.readmeVersion !== null) {
    writeFileSync(
      join(dir, 'README.md'),
      `# ${name}\n\nThis \`${spec.readmeVersion}\` release is an alpha.\n`,
    )
  }
  writeFileSync(join(dir, 'CHANGELOG.md'), `# Changelog\n\n${spec.changelog}`)
}

function writeMarketplace(
  root: string,
  entries: { name: string; source: string; version: string }[],
): void {
  const dir = join(root, '.claude-plugin')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'marketplace.json'),
    JSON.stringify({ name: 'fixture', plugins: entries }, null, 2),
  )
}

test('clean fixture yields zero signals', () => {
  withTempRepo(releaseScenario(), ({ config }) => {
    writePlugin(config.repoRoot, 'alpha', {
      claudeVersion: '1.0.0',
      codexVersion: '1.0.0',
      readmeVersion: '1.0.0',
      changelog: '## 1.0.0 \u2014 2026-01-01\n\n- first release\n',
    })
    writeMarketplace(config.repoRoot, [
      { name: 'alpha', source: './plugins/alpha', version: '1.0.0' },
    ])
    assert.deepEqual(releaseHygieneProvider.collect(config, NOW_MS), [])
  })
})

test('version-drift fixture yields one signal per stale location (manifest, marketplace, README)', () => {
  withTempRepo(releaseScenario(), ({ config }) => {
    const root = config.repoRoot
    // beta mirrors the session incidents: codex manifest off by a patch, the
    // marketplace entry stale at the pre-bump version, README stuck at the
    // original alpha version.
    writePlugin(root, 'beta', {
      claudeVersion: '2.0.0',
      codexVersion: '2.0.1',
      readmeVersion: '0.9.9',
      changelog:
        '## Unreleased\n\n- landed work awaiting a release cut\n\n## 2.0.0 \u2014 2026-10-01\n\n- prior\n',
    })
    writeMarketplace(root, [
      { name: 'alpha', source: './plugins/alpha', version: '1.0.0' },
      { name: 'beta', source: './plugins/beta', version: '1.9.0' },
    ])
    writePlugin(root, 'alpha', {
      claudeVersion: '1.0.0',
      codexVersion: '1.0.0',
      readmeVersion: '1.0.0',
      changelog: '## 1.0.0 \u2014 2026-01-01\n\n- first release\n',
    })

    const signals = releaseHygieneProvider.collect(config, NOW_MS)
    const drift = signals.filter((signal) => signal.subject !== 'plugins/beta/CHANGELOG.md')
    assert.deepEqual(
      drift.map((signal) => signal.subject).sort(),
      [
        '.claude-plugin/marketplace.json#beta',
        'plugins/beta/.codex-plugin/plugin.json',
        'plugins/beta/README.md',
      ],
      'one drift signal per stale location',
    )
    for (const signal of drift) {
      assert.equal(signal.class, 'release-hygiene')
      assert.equal(signal.severity, 'attention')
      assert.ok(signal.evidence.length > 0)
      assert.ok(
        signal.evidence.some((item) => item.includes('2.0.0')),
        'evidence cites the canonical version being drifted from',
      )
    }
  })
})

test('unclaimed-backlog signal cites the Unreleased section and the released version', () => {
  withTempRepo(releaseScenario(), ({ config }) => {
    writePlugin(config.repoRoot, 'beta', {
      claudeVersion: '2.0.0',
      codexVersion: '2.0.0',
      readmeVersion: '2.0.0',
      changelog:
        '## Unreleased\n\n- landed work awaiting a release cut\n\n## 2.0.0 \u2014 2026-10-01\n\n- prior\n',
    })
    const signals = releaseHygieneProvider.collect(config, NOW_MS)
    const backlog = signals.find((signal) => signal.subject === 'plugins/beta/CHANGELOG.md')
    assert.ok(backlog, 'backlog signal exists')
    assert.equal(backlog.severity, 'info')
    assert.ok(backlog.evidence.includes('## Unreleased'), 'cites the Unreleased section')
    assert.ok(
      backlog.evidence.some((item) => item.includes('2.0.0')),
      'cites the released version the backlog sits under',
    )
  })
})
