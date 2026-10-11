import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  defaultWorktreeProbe,
  statusPaths,
  type WorktreeProbe,
  worktreeHygieneProvider,
} from '../src/signals-worktree.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P3 worktree-hygiene provider (Task 6): uncommitted/untracked churn,
 * long-lived dirty state files, unpushed commits, and stale local branches.
 * Fixtures encode the 2026-10-11 session incidents (the churning
 * `notifications.json` state file, the unpushed "saving" commits, the
 * `ci/gate-validation` gone-upstream branch). Lumber-jack-derived checks
 * (unpushed work, branch staleness) follow the lumber-jack skill's own rules
 * and label their evidence `lumber-jack: `.
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function worktreeScenario(): Scenario {
  return {
    name: 'worktree-hygiene',
    now: NOW,
    goal: {
      slug: 'goal-wt',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

function probe(overrides: Partial<WorktreeProbe> = {}): WorktreeProbe {
  return {
    statusPorcelain: () => '',
    headUnpushed: () => '',
    branchTracks: () => '',
    mergedBranches: () => '',
    ...overrides,
  }
}

test('default probe parses real porcelain without mangling the first line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wt-real-'))
  const run = (...args: string[]) =>
    execFileSync('git', ['-C', dir, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
  run('init', '-q')
  run('config', 'user.email', 'fixture@example.invalid')
  run('config', 'user.name', 'Fixture')
  writeFileSync(join(dir, 'tracked.md'), 'one\n')
  run('add', 'tracked.md')
  run('commit', '-qm', 'initial')
  writeFileSync(join(dir, 'tracked.md'), 'two\n')
  writeFileSync(join(dir, 'scratch.md'), 'new\n')

  const parsed = statusPaths(defaultWorktreeProbe.statusPorcelain(dir))
  assert.deepEqual(parsed.dirty, ['tracked.md'], 'leading space of the first line survives')
  assert.deepEqual(parsed.untracked, ['scratch.md'])
})

test('clean repo yields zero signals', () => {
  withTempRepo(worktreeScenario(), ({ config }) => {
    assert.deepEqual(worktreeHygieneProvider.collect(config, NOW_MS, probe()), [])
  })
})

test('dirty and untracked fixtures each yield the churn signal with paths as evidence', () => {
  withTempRepo(worktreeScenario(), ({ config }) => {
    const dirty = worktreeHygieneProvider.collect(
      config,
      NOW_MS,
      probe({ statusPorcelain: () => ' M docs/goals/x/charter.md\n' }),
    )
    assert.equal(dirty.length, 1)
    assert.equal(dirty[0]?.subject, 'git-status')
    assert.equal(dirty[0]?.severity, 'attention')
    assert.deepEqual(dirty[0]?.evidence, ['dirty: docs/goals/x/charter.md'])

    const untracked = worktreeHygieneProvider.collect(
      config,
      NOW_MS,
      probe({ statusPorcelain: () => '?? scratch/new.md\n' }),
    )
    assert.equal(untracked.length, 1)
    assert.deepEqual(untracked[0]?.evidence, ['untracked: scratch/new.md'])
  })
})

test('a long-lived dirty state file yields the dirty-state signal (notifications.json class)', () => {
  withTempRepo(worktreeScenario(), ({ config }) => {
    const signals = worktreeHygieneProvider.collect(
      config,
      NOW_MS,
      probe({
        statusPorcelain: () => ' M plugins/foreman-line/ops-console/state/notifications.json\n',
      }),
    )
    const stateSignal = signals.find((signal) => signal.subject === 'state-files')
    assert.ok(stateSignal, 'dirty-state signal exists alongside the churn signal')
    assert.equal(stateSignal.severity, 'attention')
    assert.deepEqual(stateSignal.evidence, [
      'dirty state file: plugins/foreman-line/ops-console/state/notifications.json',
    ])
    assert.ok(signals.some((signal) => signal.subject === 'git-status'))
  })
})

test('unpushed commits yield a lumber-jack-labeled signal with refs as evidence', () => {
  withTempRepo(worktreeScenario(), ({ config }) => {
    const signals = worktreeHygieneProvider.collect(
      config,
      NOW_MS,
      probe({ headUnpushed: () => '75489126 saving\n70cb8e50 saving\n' }),
    )
    const unpushed = signals.find((signal) => signal.subject === 'HEAD')
    assert.ok(unpushed, 'unpushed signal exists')
    assert.equal(unpushed.severity, 'attention')
    assert.deepEqual(unpushed.evidence, [
      'lumber-jack: unpushed 75489126 saving',
      'lumber-jack: unpushed 70cb8e50 saving',
    ])
    assert.ok(
      unpushed.evidence.every((item) => item.startsWith('lumber-jack: ')),
      'lumber-jack-derived evidence is labeled as such',
    )
  })
})

test('stale branches yield the cleanup signal: gone upstream and merged-no-upstream', () => {
  withTempRepo(worktreeScenario(), ({ config }) => {
    const signals = worktreeHygieneProvider.collect(
      config,
      NOW_MS,
      probe({
        branchTracks: () =>
          'ci/gate-validation\torigin/ci/gate-validation\t[gone]\nmain\torigin/main\t\ntmp/dev\t\t\n',
        mergedBranches: () => 'tmp/dev\t\nmain\t*\nci/gate-validation\t\n',
      }),
    )
    const stale = signals.find((signal) => signal.subject === 'branches')
    assert.ok(stale, 'stale-branch signal exists')
    assert.equal(stale.severity, 'info')
    assert.deepEqual(stale.evidence, [
      'lumber-jack: branch ci/gate-validation (upstream gone)',
      'lumber-jack: branch tmp/dev (merged into HEAD, no upstream)',
    ])
    assert.ok(
      !stale.evidence.some((item) => item.includes('branch main ')),
      'a branch with an in-sync upstream is preserved (lumber-jack rule)',
    )
    assert.ok(stale.actions.includes('close-delete'), 'cleanup verbs include close-delete')
  })
})
