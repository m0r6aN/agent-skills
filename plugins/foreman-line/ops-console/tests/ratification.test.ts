import assert from 'node:assert/strict'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { readRatification } from '../src/ratification.js'
import { scanGoal } from '../src/scan.js'
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
  const filler = `${'## Section\n'.repeat(1000)}Status: RATIFIED\n${'Status: NOT RATIFIED\n'.repeat(500)}`
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
  withTempRepo(scenario('missing-charter'), ({ config }) => {
    rmSync(join(config.goalsDir, 'goal-rat', 'charter.md'))
    const goal = scanGoal(config, 'goal-rat')
    assert.equal(goal?.ratification.status, 'unknown')
    assert.ok(
      goal?.evidence?.some(
        (e) => e.kind === 'missing' && e.source === 'charter' && e.line === null,
      ),
    )
  })
})

test('scanGoal integration: actual relative locator root equals configured root', () => {
  withTempRepo(scenario('locator-root', { charterStatus: 'RATIFIED' }), ({ config }) => {
    const goal = scanGoal(config, 'goal-rat')
    assert.equal(goal?.ratification.status, 'granted')
    assert.ok(goal?.evidence?.length)
    for (const item of goal?.evidence ?? []) {
      assert.equal(item.locator.root, config.repoRoot)
      assert.equal(
        item.locator.relativePath,
        `plugins/foreman-line/docs/goals/goal-rat/${item.source === 'charter' ? 'charter' : 'loop-directive'}.md`,
      )
    }
  })
})

for (const file of ['charter.md', 'loop-directive.md']) {
  for (const failure of ['missing', 'unreadable']) {
    test(`scanGoal integration: actual ${failure} ${file} preserves required-source behavior`, () => {
      withTempRepo(scenario('actual-io', { charterStatus: 'RATIFIED' }), ({ config }) => {
        const path = join(config.goalsDir, 'goal-rat', file)
        rmSync(path)
        if (failure === 'unreadable') mkdirSync(path)
        // The other source grants, so an optional source failure must override it.
        if (file === 'charter.md')
          writeFileSync(
            join(config.goalsDir, 'goal-rat', 'loop-directive.md'),
            '## Gate 1 record\n- Gate 1: GRANTED\n',
          )
        const goal = scanGoal(config, 'goal-rat')
        if (file === 'loop-directive.md') assert.equal(goal, null)
        else {
          assert.equal(goal?.ratification.status, 'unknown')
          assert.ok(goal?.evidence?.some((e) => e.kind === failure && e.line === null))
        }
      })
    })
  }
}

function readText(text: string, directive: string | null = '## Queue\n') {
  return readRatification([
    { source: 'charter', locator: LOC, text },
    {
      source: 'loop-directive',
      locator: { ...LOC, relativePath: 'docs/goals/g/loop-directive.md' },
      text: directive,
    },
  ])
}

for (const [name, text, expected] of [
  ['Status after first H2 cannot grant', '## Queue\nStatus: RATIFIED', 'unknown'],
  [
    'first unsupported Status consumes positive position',
    'Status: unknown\nStatus: RATIFIED',
    'unknown',
  ],
  ['bare B line cannot grant', '## Gate 1 record\nGate 1: GRANTED', 'unknown'],
  [
    'B survives nested unexcluded subsection',
    '## Gate 1 record\n### Details\n- Gate 1: GRANTED',
    'granted',
  ],
  ['B ends at equal-level heading', '## Gate 1 record\n## Current\n- Gate 1: GRANTED', 'unknown'],
  [
    'excluded parent survives nested excluded child',
    '## Historical\n### Example\n### Gate 1 record\n- Gate 1: GRANTED',
    'unknown',
  ],
  [
    'excluded parent ends at equal-level heading',
    '## Historical\n### Example\n## Gate 1 record\n- Gate 1: GRANTED',
    'granted',
  ],
  [
    'unmatched emphasis cannot borrow closing delimiter across heading',
    'Status: **RATIFIED\n## Current\n**',
    'unknown',
  ],
  ['quoted denial token cannot become denial', 'Status: "NOT RATIFIED"', 'unknown'],
  ['backtick grant cannot become grant', 'Status: `RATIFIED`', 'unknown'],
  ['linked token cannot become grant', 'Status: [RATIFIED](older.md)', 'unknown'],
  [
    'standalone Status revocation conflicts after H2',
    'Status: RATIFIED\n## Current\nStatus: REVOKED',
    'unknown',
  ],
  [
    'anchored condition blocks B',
    '## Gate 1 record\n- Gate 1: GRANTED provided review passes',
    'unknown',
  ],
  [
    'quoted qualifier is not a current condition',
    'Status: RATIFIED — owner said "if needed"',
    'granted',
  ],
  [
    'review qualification does not qualify grant',
    'Status: RATIFIED — review is unresolved',
    'granted',
  ],
  [
    'arbitrary prose cannot revoke grant',
    'Status: RATIFIED\nGate 1 was revoked in an example.',
    'granted',
  ],
  ['all negative positions collected', 'Status: RATIFIED\n## Current\nGate 1: DRAFT', 'unknown'],
  [
    'historical-note literal requires delimiter',
    'Status: RATIFIED\nHistorical notebook\nStatus: NOT RATIFIED',
    'unknown',
  ],
] as const) {
  test(name, () => {
    const result = readText(text)
    assert.equal(result.ratification.status, expected)
    if (name.includes('cannot become'))
      assert.ok(result.evidence.every((e) => e.kind !== 'grant' && e.kind !== 'denial'))
  })
}

test('balanced multiline emphasis keeps the originating evidence line', () => {
  const result = readText('# Charter\n\n**Status:** **\nRATIFIED\n**\n## Queue')
  assert.equal(result.ratification.status, 'granted')
  assert.equal(result.evidence[0]?.line, 3)
})

test('missing charter overrides a supported directive grant', () => {
  const result = readRatification([
    { source: 'charter', locator: LOC, text: null },
    { source: 'loop-directive', locator: LOC, text: '## Gate 1 record\n- Gate 1: GRANTED' },
  ])
  assert.equal(result.ratification.status, 'unknown')
  assert.ok(result.evidence.some((item) => item.kind === 'missing'))
  assert.ok(result.evidence.some((item) => item.kind === 'grant'))
})

const publicHeaders = [
  [
    'foreman-ops-console',
    '**Status:** RATIFIED — Gate 1 granted 2026-09-16 (owner: OQ1–OQ4 ruled per attached recommendations, charter ratified); plan-level adversarial review NOT run (mandatory next step)',
  ],
  [
    'ci-fail-fast',
    '**Status:** **RATIFIED 2026-10-07 — Gate 1 granted twice**: initial\nratification ("Gate 1 granted. Ratify all recommendations, as written") and\nscoped re-ratification after the plan-level adversarial review',
  ],
  [
    'w4-closeout',
    '**Status:** FULLY RATIFIED — Gate 1 (D1–D6) ratified 2026-07-28 11:17 EDT; plan-adversarial review complete (RATIFY-WITH-AMENDMENTS — `plan-review-findings.md`, all amendments applied); D4-R1 review **HOLD**; D4-R2B sole-owner compromise **RATIFIED 2026-09-05**.\n**Historical note — the 2026-07-28 header record:**\nStatus: NOT RATIFIED',
  ],
  [
    'trustworthy-observation',
    '**Status:** RATIFIED 2026-10-10 — D1–D8 and TO-P0–TO-P7 approved; owner amendment A1 below applies',
  ],
] as const

for (const [name, header] of publicHeaders) {
  test(`scanGoal public supported ${name} header`, () => {
    withTempRepo(scenario(`public-${name}`), ({ config }) => {
      writeFileSync(
        join(config.goalsDir, 'goal-rat', 'charter.md'),
        `# Charter\n${header}\n## Objective\n`,
      )
      const goal = scanGoal(config, 'goal-rat')
      assert.equal(goal?.ratification.status, 'granted')
      assert.ok(goal?.evidence?.some((item) => item.kind === 'grant' && item.line === 2))
    })
  })
}

for (const layout of ['docs/goals', 'docs/INITIATIVES']) {
  test(`scanGoal actual root and ${layout} evidence locators`, () => {
    withTempRepo(scenario('native-locator'), ({ config }) => {
      const goalsDir = join(config.repoRoot, layout)
      const goalDir = join(goalsDir, 'g')
      mkdirSync(goalDir, { recursive: true })
      writeFileSync(join(goalDir, 'charter.md'), 'Status: RATIFIED')
      writeFileSync(join(goalDir, 'loop-directive.md'), '## Gate 1 record\n- Gate 1: NOT RATIFIED')
      const goal = scanGoal({ ...config, goalsDir }, 'g', 'alias.2')
      assert.equal(goal?.ratification.status, 'unknown')
      assert.equal(goal?.evidence?.length, 2)
      for (const item of goal?.evidence ?? []) {
        assert.equal(item.locator.root, config.repoRoot)
        assert.equal(
          item.locator.relativePath,
          `${layout}/g/${item.source === 'charter' ? 'charter' : 'loop-directive'}.md`,
        )
      }
    })
  })
}

for (const text of [
  'Status: "**RATIFIED**"',
  "Status: '**RATIFIED**'",
  'Status: `**RATIFIED**`',
  '## Gate 1 record\n- Gate 1: "**GRANTED**"',
  '## **Gate 1 record\n- Gate 1: GRANTED',
]) {
  test(`quoted or unmatched-heading emphasis never establishes grant: ${text}`, () => {
    const result = readText(text)
    assert.equal(result.ratification.status, 'unknown')
    assert.ok(result.evidence.every((item) => item.kind !== 'grant'))
  })
}

test('current supported denial alone outside B heading remains pending', () => {
  const result = readText('## Queue\nGate 1: NOT GRANTED')
  assert.equal(result.ratification.status, 'pending')
  assert.equal(result.evidence[0]?.line, 2)
})

test('scanGoal exclusion fixture preserves a grant without reading example denials', () => {
  withTempRepo(scenario('exclusions'), ({ config }) => {
    writeFileSync(
      join(config.goalsDir, 'goal-rat', 'charter.md'),
      'Status: RATIFIED\n## Historical\n### Example\n### Current\nStatus: NOT RATIFIED\n## Objective\n> Gate 1: NOT GRANTED\n',
    )
    const goal = scanGoal(config, 'goal-rat')
    assert.equal(goal?.ratification.status, 'granted')
    assert.deepEqual(
      goal?.evidence?.map((item) => [item.kind, item.line]),
      [['grant', 1]],
    )
  })
})

for (const text of [
  'Status: NOT RATIFIED provided another review fails',
  'Status: RATIFIED — Gate 1 is NOT GRANTED',
  'Status: RATIFIED; Gate 1 grant is revoked',
]) {
  test(`anchored conditional or contradictory grant remains unknown: ${text}`, () => {
    const result = readText(text)
    assert.equal(result.ratification.status, 'unknown')
    assert.ok(result.evidence.some((item) => item.kind === 'unsupported'))
  })
}

for (const heading of ['archived', 'examples', 'instructions']) {
  test(`unlisted ${heading} heading retains its actual current denial`, () => {
    const result = readText(`Status: RATIFIED\n## ${heading}\nStatus: NOT RATIFIED\n`)
    assert.equal(result.ratification.status, 'unknown')
    assert.deepEqual(
      result.evidence.map((item) => [item.kind, item.line]),
      [
        ['grant', 1],
        ['denial', 3],
      ],
    )
  })
}

for (const heading of ['historical', 'archive', 'example', 'instruction', 'superseded']) {
  test(`canonical ${heading} heading excludes its denial`, () => {
    const result = readText(`Status: RATIFIED\n## ${heading}\nStatus: NOT RATIFIED\n`)
    assert.equal(result.ratification.status, 'granted')
    assert.deepEqual(
      result.evidence.map((item) => [item.kind, item.line]),
      [['grant', 1]],
    )
  })
}

for (const text of [
  'Status: RATIFIED — owner: Clinton; provided funding is approved',
  'Status: RATIFIED — owner/date, if funding is approved',
  'Status: RATIFIED — owner: Clinton, if funding is approved',
  'Status: RATIFIED 2026-10-10, provided funding is approved',
  '## Gate 1 record\n- Gate 1: GRANTED — owner: Clinton; provided funding is approved',
]) {
  test(`current grant qualification after explicit provenance is unknown: ${text}`, () => {
    const result = readText(text)
    assert.equal(result.ratification.status, 'unknown')
    assert.ok(result.evidence.some((item) => item.kind === 'unsupported'))
    assert.ok(result.evidence.every((item) => item.kind !== 'grant'))
  })
}

for (const text of [
  'Status: RATIFIED — owner: Clinton; review is conditional',
  'Status: RATIFIED — owner/date, review if funding is approved',
  'Status: RATIFIED — owner: Clinton; Gate 2: NOT GRANTED',
  'Status: RATIFIED — owner/date, Gate 3: NOT GRANTED',
  'Status: RATIFIED — owner: Clinton; TO-P1 Status: HOLD',
  'Status: RATIFIED — owner: Clinton; "provided funding is approved"',
  'Status: RATIFIED — owner/date, `if funding is approved`',
  'Status: RATIFIED — owner: Clinton; review is conditional; if funding is approved',
]) {
  test(`unrelated or quoted clauses after provenance do not condition Gate 1: ${text}`, () => {
    const result = readText(text)
    assert.equal(result.ratification.status, 'granted')
    assert.ok(result.evidence.every((item) => item.kind === 'grant'))
  })
}
