import assert from 'node:assert/strict'
import test from 'node:test'
import { projectGoal } from '../src/project.js'
import { type RatificationSource, readRatification } from '../src/ratification.js'
import type { Locator } from '../src/types.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * TO-P1: Conservative current ratification reader contract tests.
 * Asserts the accepted RAT/ATT semantics for current evidence only.
 * These tests define the contract; implementation must satisfy them.
 */

const NOW = '2026-09-26T12:00:00.000Z'
const LOC: Locator = { root: '/repo', relativePath: 'plugins/foreman-line/docs/goals/g/charter.md' }

function scenario(
  name: string,
  overrides: {
    charterStatus?: string
    directiveText?: string
    stateLines?: readonly string[]
    queue?: readonly string[]
  } = {},
): Scenario {
  return {
    name,
    now: NOW,
    goal: {
      slug: 'goal-rat',
      queue: overrides.queue ?? ['1. **P1** probe.'],
      charterStatus: overrides.charterStatus,
      stateLines: overrides.stateLines,
    },
    specs: [],
    expected: [],
  }
}

function withGoal(
  scenarioDef: Scenario,
  run: (projection: import('../src/types.js').GoalProjection) => void,
): void {
  withTempRepo(scenarioDef, ({ config, now }) => {
    const projection = projectGoal(config, scenarioDef.goal.slug, now)
    assert.ok(projection !== null, 'projection exists')
    run(projection)
  })
}

test('dialect A: current top metadata RATIFIED grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '**Status:** RATIFIED — owner/date\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n1. **P1** x.\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
  assert.ok(
    result.evidence.some((e) => e.kind === 'grant' && e.source === 'charter' && e.line === 1),
  )
})

test('dialect A: case-insensitive fully ratified grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'status: fully ratified\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('dialect A: balanced multiline bold emphasis grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '**Status:** **\nRATIFIED\n**\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('dialect A: DRAFT alone yields pending', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: DRAFT\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'pending')
  assert.ok(result.evidence.some((e) => e.kind === 'denial' && /DRAFT/i.test(e.detail)))
})

test('later current denial produces unknown', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\nStatus: NOT RATIFIED\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'grant'))
  assert.ok(result.evidence.some((e) => e.kind === 'denial'))
})

test('cross-source denial produces unknown', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n## Queue\n1. **P1** x.\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Current\n- Gate 1: NOT GRANTED\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'grant' && e.source === 'charter'))
  assert.ok(result.evidence.some((e) => e.kind === 'denial' && e.source === 'loop-directive'))
})

test('denial after later heading is still collected', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n## Queue\n**Status:** NOT RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
})

test('dialect B: exact Gate 1 record grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
  assert.ok(result.evidence.some((e) => e.kind === 'grant' && /Gate 1/i.test(e.detail)))
})

test('dialect B: Gates and standing authorizations with suffix grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Gates and standing authorizations — owner amendment\n+ Gate 1: RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('dialect B: bold label grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Gate 1 record\n**Gate 1:** GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('bare Gate 1 grant outside heading is unsupported', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported'))
})

test('Gate 1 grant in wrong heading is unsupported', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Old gate notes\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported'))
})

test('quoted value is unsupported', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: "RATIFIED"\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported'))
})

test('blockquote grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '> Status: RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('fenced code grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '```md\nStatus: RATIFIED\n```\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('tilde fence grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '~~~md\nStatus: RATIFIED\n~~~\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('table grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '| Status: RATIFIED |\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('historical section grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Historical record\n### Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('example section grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Example\n### Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('instruction section grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Instruction\n### Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('superseded section grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Superseded\n### Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('historical note suppresses later denial', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n**Historical note:** prior record\nStatus: NOT RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('historical grant followed by current B grants', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '## Historical\n- Gate 1: NOT GRANTED\n## Gate 1 record\n- Gate 1: GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('review negation is irrelevant to Gate 1', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED — plan-level review NOT run\n## Queue\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('scoped parcel hold is irrelevant to Gate 1', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n## Queue\nTO-P1 Status: HOLD\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('conditional grant is unknown', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED if checks pass\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported'))
})

test('revoked current grant is unknown', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n## Gate 1 record\n- Gate 1: REVOKED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported' && /revoked/i.test(e.detail)))
})

test('unmatched emphasis is unsupported', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '**Status: RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported' && /emphasis/i.test(e.detail)))
})

test('token boundary: RATIFIEDness is not a grant', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIEDness\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('linked-only grant confers nothing', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: '[Gate 1 RATIFIED](charter-archive.md)\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.every((e) => e.kind !== 'grant'))
})

test('missing charter produces unknown with missing evidence', () => {
  const result = readRatification([
    { source: 'charter', locator: LOC, text: null },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(
    result.evidence.some((e) => e.kind === 'missing' && e.source === 'charter' && e.line === null),
  )
})

test('missing directive produces unknown with unreadable evidence', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: null,
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(
    result.evidence.some(
      (e) => e.kind === 'unreadable' && e.source === 'loop-directive' && e.line === null,
    ),
  )
})

test('later positive cannot replace first metadata', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: unsupported\nStatus: RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((e) => e.kind === 'unsupported'))
})

test('excluded current-looking denial in Example section does not deny', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n## Example\nStatus: NOT RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('W4-style historical note with em-dash suppresses following records', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\n**Historical note — the 2026-07-28 header record:**\nStatus: NOT RATIFIED\n## Objective\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('historical note with colon suppresses following records', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\nHistorical note: prior\nStatus: NOT RATIFIED\n## Objective\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('historical note suppression resets at next heading', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\nHistorical note: prior\nStatus: NOT RATIFIED\n## Objective\nStatus: NOT RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
})

test('incidental historical word does not suppress current denial', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\nThe historical context is complex.\nStatus: NOT RATIFIED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
})

test('Gate 2/3 negation is irrelevant to Gate 1', () => {
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: 'Status: RATIFIED\nGate 2: NOT GRANTED\nGate 3: NOT GRANTED\n',
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'granted')
})

test('long hostile input does not hang', () => {
  const filler =
    '## Section\n'.repeat(1000) + 'Status: RATIFIED\n' + 'Status: NOT RATIFIED\n'.repeat(500)
  const result = readRatification([
    {
      source: 'charter',
      locator: LOC,
      text: filler,
    },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'plugins/foreman-line/docs/goals/g/loop-directive.md' },
      text: '## Queue\n',
    },
  ])
  assert.equal(result.ratification.status, 'unknown')
})

test('scanGoal integration: missing charter yields unknown with missing evidence', () => {
  withGoal(scenario('missing-charter'), (projection) => {
    assert.equal(projection.goal.ratification.status, 'unknown')
    assert.ok(
      projection.goal.evidence?.some(
        (e) => e.kind === 'missing' && e.source === 'charter' && e.line === null,
      ),
    )
  })
})

test('scanGoal integration: actual relative locator root, not alias', () => {
  withGoal(scenario('locator-root'), (projection) => {
    assert.ok(projection.goal.evidence !== undefined)
    for (const item of projection.goal.evidence ?? []) {
      assert.ok(item.locator.root.length > 0, 'root is actual configured root')
      assert.ok(!item.locator.root.includes('agent-task'), 'root is not an alias')
      assert.ok(
        item.locator.relativePath.startsWith('plugins/foreman-line/docs/goals/'),
        'relativePath is repo-relative',
      )
    }
  })
})

test('scanGoal integration: missing directive yields unknown with unreadable evidence', () => {
  withGoal(scenario('missing-directive', { charterStatus: 'RATIFIED' }), (projection) => {
    assert.equal(projection.goal.ratification.status, 'unknown')
    assert.ok(
      projection.goal.evidence?.some(
        (e) => e.kind === 'unreadable' && e.source === 'loop-directive' && e.line === null,
      ),
    )
  })
})
