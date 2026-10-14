import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { saveFleetState } from '../src/fleet.js'
import { FLOW_REGISTRY, invokeFlow, listAuditEntries, presentCommand } from '../src/invoke.js'
import { fileMtimes, type Scenario, treeSnapshot, withTempRepo } from './support/materialize.js'

/**
 * FOC-P0 M1 + A1 invocation boundary: closed flow registry, frozen argv
 * patterns (UUID, 6-digit sequence, slug, absolute --repo-root equal to the
 * configured repo root), refusals before any spawn, `execute` limited to the
 * non-interactive non-minting flows, human-gate flows `present`-only, and the
 * append-only invocation audit log recording executions, presentations, AND
 * refusals.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const WORKFLOW = '00000000-0000-4000-8000-000000000050'
const NOW_MS = Date.parse(NOW)

function scenario(chains: Scenario['chains']): Scenario {
  return {
    name: 'invoke-base',
    now: NOW,
    goal: { slug: 'goal-invoke', queue: ['1. **P1** invocation probe.'] },
    specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-26T11:00:00.000Z' }],
    chains,
    expected: [],
  }
}

const TRUTH_DIRS = [
  'docs/receipts',
  'plugins/foreman-line/docs/goals',
  'plugins/foreman-line/docs/specs',
]

test('M1: unknown flows are refused and audited — the registry is a closed set', () => {
  withTempRepo(scenario([]), ({ config }) => {
    const outcome = invokeFlow(
      config,
      { flow: 'approval-mint-receipt', argv: ['show', 'x', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    assert.equal(outcome.action, 'refused')
    assert.match(outcome.reason ?? '', /closed set/)
    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit.length, 1)
    assert.equal(audit[0]?.action, 'refused')
    assert.equal(audit[0]?.flow, 'approval-mint-receipt')
  })
})

test('M1: shell metacharacters and out-of-surface arguments are refused before any spawn', () => {
  withTempRepo(scenario([]), ({ config }) => {
    const injected = invokeFlow(
      config,
      { flow: 'approval-show', argv: ['show', 'slug; rm -rf /', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    assert.equal(injected.action, 'refused')
    assert.match(injected.reason ?? '', /refused before any spawn/)

    const extraArg = invokeFlow(
      config,
      {
        flow: 'approval-show',
        argv: ['show', 'ok-slug', '--repo-root', config.repoRoot, '--force'],
      },
      NOW_MS,
    )
    assert.equal(extraArg.action, 'refused', 'arguments outside the frozen surface are refused')

    const wrongRoot = invokeFlow(
      config,
      {
        flow: 'approval-show',
        argv: ['show', 'ok-slug', '--repo-root', join(config.repoRoot, 'other')],
      },
      NOW_MS,
    )
    assert.equal(wrongRoot.action, 'refused')
    assert.match(wrongRoot.reason ?? '', /must equal the configured repo root/)

    const relativeRoot = invokeFlow(
      config,
      { flow: 'approval-show', argv: ['show', 'ok-slug', '--repo-root', 'relative/root'] },
      NOW_MS,
    )
    assert.equal(relativeRoot.action, 'refused')

    assert.equal(
      listAuditEntries(config.stateDir).length,
      4,
      'every refusal appends one audit entry',
    )
  })
})

test('M1: human-gate mutating flows are present-only — rendered, audited, never spawned', () => {
  withTempRepo(scenario([]), ({ config, root }) => {
    const before = treeSnapshot(root, TRUTH_DIRS)
    const beforeTimes = fileMtimes(root, TRUTH_DIRS)
    const outcome = invokeFlow(
      config,
      { flow: 'approval-approve', argv: ['approve', 'p1-alpha', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    assert.equal(outcome.action, 'presented')
    assert.equal(outcome.command, `approval approve p1-alpha --repo-root ${config.repoRoot}`)
    assert.equal(outcome.exitCode, null, 'nothing was executed')
    assert.match(outcome.reason ?? '', /never spawned/)

    const dispatch = invokeFlow(
      config,
      {
        flow: 'dispatch-execute',
        argv: ['executeDispatch', 'p1-alpha', '--repo-root', config.repoRoot],
      },
      NOW_MS,
    )
    assert.equal(dispatch.action, 'presented')
    assert.equal(
      dispatch.command,
      `dispatch approval-cli executeDispatch p1-alpha --repo-root ${config.repoRoot}`,
    )

    const reject = invokeFlow(
      config,
      { flow: 'approval-reject', argv: ['reject', 'p1-alpha', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    assert.equal(reject.action, 'presented')

    assert.deepEqual(
      treeSnapshot(root, TRUTH_DIRS),
      before,
      'presentation wrote nothing to truth sources',
    )
    assert.deepEqual(fileMtimes(root, TRUTH_DIRS), beforeTimes, 'no truth-source file was touched')
  })
})

test('M1: receipts-validate executes (non-interactive, non-minting) and reports the real exit code', () => {
  withTempRepo(
    scenario([
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A', 'B'],
        timestampOffsetHours: [-1, -0.5],
      },
    ]),
    ({ config, root }) => {
      const chainDir = join(root, 'docs', 'receipts', WORKFLOW)
      const ok = invokeFlow(
        config,
        { flow: 'receipts-validate', argv: ['validate', chainDir] },
        NOW_MS,
      )
      assert.equal(ok.action, 'executed')
      assert.equal(ok.exitCode, 0, `stderr: ${ok.stderr}`)
      assert.equal(ok.command, `receipts validate ${chainDir}`)
    },
  )

  withTempRepo(
    scenario([
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A', 'B'],
        timestampOffsetHours: [-1, -0.5],
        breakLink: 1,
      },
    ]),
    ({ config, root }) => {
      const chainDir = join(root, 'docs', 'receipts', WORKFLOW)
      const bad = invokeFlow(
        config,
        { flow: 'receipts-validate', argv: ['validate', chainDir] },
        NOW_MS,
      )
      assert.equal(bad.action, 'executed')
      assert.equal(bad.exitCode, 1, 'the shipped CLI reports the broken chain')
    },
  )
})

test('M1: receipts-validate paths are confined to docs/receipts/<workflowId>[/<member>]', () => {
  withTempRepo(
    scenario([
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A'],
        timestampOffsetHours: [-1],
      },
    ]),
    ({ config, root }) => {
      const outside = invokeFlow(
        config,
        {
          flow: 'receipts-validate',
          argv: ['validate', join(root, 'plugins', 'foreman-line', 'docs', 'specs')],
        },
        NOW_MS,
      )
      assert.equal(outside.action, 'refused')
      assert.match(outside.reason ?? '', /inside the receipts directory/)

      const traversal = invokeFlow(
        config,
        {
          flow: 'receipts-validate',
          argv: [
            'validate',
            join(
              root,
              'docs',
              'receipts',
              WORKFLOW,
              '..',
              WORKFLOW,
              '000000-A-shaping-result.json',
            ),
          ],
        },
        NOW_MS,
      )
      assert.equal(traversal.action, 'executed', 'normalized in-tree member paths remain valid')

      const badFile = invokeFlow(
        config,
        {
          flow: 'receipts-validate',
          argv: [
            'validate',
            join(root, 'docs', 'receipts', WORKFLOW, '000000-A-shaping-result.json.bak'),
          ],
        },
        NOW_MS,
      )
      assert.equal(badFile.action, 'refused', 'off-convention file segments are refused')
    },
  )
})

test('A1: the audit log is append-only, sequential, and records executed + presented + refused', () => {
  withTempRepo(
    scenario([
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A'],
        timestampOffsetHours: [-1],
      },
    ]),
    ({ config, root }) => {
      const presented = invokeFlow(
        config,
        { flow: 'approval-approve', argv: ['approve', 'p1-alpha', '--repo-root', config.repoRoot] },
        NOW_MS,
      )
      const refused = invokeFlow(config, { flow: 'nope', argv: [] }, NOW_MS)
      const chainDir = join(root, 'docs', 'receipts', WORKFLOW)
      const executed = invokeFlow(
        config,
        { flow: 'receipts-validate', argv: ['validate', chainDir] },
        NOW_MS,
      )
      const audit = listAuditEntries(config.stateDir)
      assert.deepEqual(
        audit.map((entry) => entry.action),
        ['presented', 'refused', 'executed'],
      )
      assert.deepEqual(
        audit.map((entry) => entry.id),
        ['inv-000001', 'inv-000002', 'inv-000003'],
      )
      assert.deepEqual(
        audit.map((entry) => entry.exitCode),
        [null, null, executed.exitCode],
      )
      assert.equal(audit[0]?.id, presented.id)
      assert.equal(audit[1]?.id, refused.id)
      const raw = readFileSync(join(config.stateDir, 'invocation-audit.json'), 'utf8')
      const store = JSON.parse(raw) as { schema: string; entries: unknown[] }
      assert.equal(store.schema, 'foc-invocation-audit/v1')
      assert.equal(store.entries.length, 3)
    },
  )
})

// ------------------------------------------------------------------ FCA-P9 pr-merge

const mergeArgv = (root: string, n = '218') => ['merge', n, '--repo-root', root]

test('FCA-P9: pr-merge is present-only: renders the exact command, audits one `presented`, spawns nothing', () => {
  withTempRepo(scenario([]), ({ config }) => {
    assert.equal(FLOW_REGISTRY['pr-merge']?.mode, 'present')
    assert.equal(FLOW_REGISTRY['pr-merge']?.spawnCli, null)
    const outcome = invokeFlow(
      config,
      { flow: 'pr-merge', argv: mergeArgv(config.repoRoot), mode: 'present' },
      NOW_MS,
    )
    assert.equal(outcome.action, 'presented')
    assert.equal(outcome.command, `cd "${config.repoRoot}" && gh pr merge 218`)
    assert.equal(outcome.exitCode, null)
    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit.length, 1)
    assert.equal(audit[0]?.action, 'presented')
    assert.equal(audit[0]?.mode, 'present')
  })
})

test('FCA-P9: pr-merge refuses (audited `refused`) bad numbers, relative/undeclared/unsafe roots, extra argv and any non-present mode', () => {
  withTempRepo(scenario([]), ({ config }) => {
    const root = config.repoRoot
    const cases: [string, { argv: readonly string[]; mode?: unknown }][] = [
      ['zero', { argv: mergeArgv(root, '0') }],
      ['leading zero', { argv: mergeArgv(root, '07') }],
      ['non-numeric', { argv: mergeArgv(root, 'abc') }],
      ['shell text', { argv: mergeArgv(root, '1; rm -rf /') }],
      ['oversize', { argv: mergeArgv(root, '12345678') }],
      ['relative root', { argv: mergeArgv('relative/root') }],
      ['undeclared root', { argv: mergeArgv(join(root, 'other')) }],
      ['root with unsafe chars', { argv: mergeArgv('/tmp/a"b') }],
      ['extra argv', { argv: [...mergeArgv(root), '--squash'] }],
      ['mode execute', { argv: mergeArgv(root), mode: 'execute' }],
      ['mode spawn', { argv: mergeArgv(root), mode: 'spawn' }],
      ['mode non-string', { argv: mergeArgv(root), mode: true }],
    ]
    for (const [label, c] of cases) {
      const before = listAuditEntries(config.stateDir).length
      const outcome = invokeFlow(config, { flow: 'pr-merge', ...c }, NOW_MS)
      assert.equal(outcome.action, 'refused', label)
      assert.equal(outcome.command, '', `${label}: a refusal carries no copyable command`)
      const audit = listAuditEntries(config.stateDir)
      assert.equal(audit.length, before + 1, label)
      assert.equal(audit.at(-1)?.action, 'refused', label)
    }
  })
})

test('FCA-P9: pr-merge accepts a root declared in fleet state and only those', () => {
  withTempRepo(scenario([]), ({ config }) => {
    const other = '/tmp/fleet-other-root'
    saveFleetState(config.stateDir, {
      schema: 'foc-fleet/v1',
      roots: [config.repoRoot, other],
    })
    const ok = invokeFlow(config, { flow: 'pr-merge', argv: mergeArgv(other) }, NOW_MS)
    assert.equal(ok.action, 'presented')
    assert.equal(ok.command, `cd "${other}" && gh pr merge 218`)
    const no = invokeFlow(
      config,
      { flow: 'pr-merge', argv: mergeArgv('/tmp/not-declared') },
      NOW_MS,
    )
    assert.equal(no.action, 'refused')
  })
})

test('FCA-P9: presentCommand validates with the same guards and audits nothing', () => {
  withTempRepo(scenario([]), ({ config }) => {
    const ok = presentCommand(config, 'pr-merge', mergeArgv(config.repoRoot))
    assert.ok('text' in ok)
    assert.ok('refused' in presentCommand(config, 'pr-merge', mergeArgv('/tmp/x"y')))
    assert.ok(
      'refused' in
        presentCommand(config, 'approval-show', ['show', 'a', '--repo-root', config.repoRoot]),
    )
    assert.equal(listAuditEntries(config.stateDir).length, 0)
  })
})

test('FCA-P9: the pr-merge path spawns nothing (negative control: invoke source has no gh/git-merge spawn)', async () => {
  const { readFileSync } = await import('node:fs')
  const text = readFileSync(new URL('../src/invoke.ts', import.meta.url), 'utf8')
  const spawns = text.match(/spawnSync\(/g) ?? []
  assert.equal(spawns.length, 1, 'exactly one spawn site, behind spawnCli')
  assert.match(text, /flow\.mode === 'present'[\s\S]*?return outcome[\s\S]*?spawnSync\(/)
  assert.doesNotMatch(text, /spawnSync\(\s*['"](gh|git)['"]/)
})

test('FCA-P9: a DECLARED fleet root containing a quote, $, backtick, backslash or control char is refused, never escaped', () => {
  withTempRepo(scenario([]), ({ config }) => {
    for (const bad of ['/tmp/a"b', '/tmp/a$b', '/tmp/a`b', '/tmp/a\\b', '/tmp/a\nb']) {
      saveFleetState(config.stateDir, { schema: 'foc-fleet/v1', roots: [config.repoRoot, bad] })
      const outcome = invokeFlow(config, { flow: 'pr-merge', argv: mergeArgv(bad) }, NOW_MS)
      assert.equal(outcome.action, 'refused', JSON.stringify(bad))
      assert.match(outcome.reason ?? '', /never escaped/, JSON.stringify(bad))
      assert.equal(outcome.command, '')
    }
  })
})
