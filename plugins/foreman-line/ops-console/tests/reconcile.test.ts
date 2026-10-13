import assert from 'node:assert/strict'
import test from 'node:test'
import type { GitFact } from '../src/ledger-git.js'
import {
  DISCREPANCY_CODES,
  expandRanges,
  isDeliveryPr,
  keyPattern,
  linkable,
  makeKeyIndex,
  type ReconcileInput,
  type Reconciliation,
  reconcileGoal,
  titleType,
} from '../src/reconcile.js'
import type { BranchFact, RepoFacts } from '../src/reconcile-git.js'
import type { PrFact, PrFacts } from '../src/reconcile-remote.js'
import type { ParcelProjection } from '../src/types.js'

/**
 * FCA-P8 AC1-AC5, AC7: every discrepancy code, the false-positive traps, the
 * remote-unavailable degradation, and non-mutation of the frozen parcel state.
 */
const NOW = Date.parse('2026-10-13T12:00:00.000Z')

function parcel(key: string, over: Partial<ParcelProjection> = {}): ParcelProjection {
  return {
    goal: 'g',
    parcel: key,
    specRef: null,
    specLocation: 'none',
    chain: null,
    chainEvidence: 'absent',
    gates: {} as ParcelProjection['gates'],
    routing: {} as ParcelProjection['routing'],
    liveness: {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no worktree basename matched the parcel key or goal slug',
    },
    heartbeat: {
      thresholdMs: 21_600_000,
      source: 'default',
      lastProgressAt: '2026-09-26T00:00:00.000Z',
    },
    failure: null,
    state: 'hung',
    rule: 'R4',
    flags: [],
    ...over,
  } as ParcelProjection
}

const REPO = '/repos/agent-skills'
function repo(over: Partial<RepoFacts> = {}): RepoFacts {
  return {
    repoRoot: REPO,
    defaultRef: 'origin/main',
    refsAsOf: '2026-10-13T11:00:00.000Z',
    currentBranch: 'main',
    branches: [],
    worktrees: [],
    defaultLog: [],
    allLog: [],
    remoteSpecFiles: [],
    defaultDivergence: { ahead: 0, behind: 0 },
    ...over,
  }
}
const branch = (name: string, over: Partial<BranchFact> = {}): BranchFact => ({
  name,
  remote: false,
  sha: 'abc12345',
  mergedIntoDefault: false,
  upstream: null,
  aheadOfUpstream: null,
  behindUpstream: null,
  upstreamGone: false,
  ...over,
})
const pr = (n: number, title: string, over: Partial<PrFact> = {}): PrFact => ({
  number: n,
  title,
  headRefName: `branch-${n}`,
  baseRefName: 'main',
  state: 'MERGED',
  createdAt: '2026-10-01T00:00:00Z',
  mergedAt: '2026-10-02T00:00:00Z',
  closedAt: '2026-10-02T00:00:00Z',
  url: `https://example.invalid/pull/${n}`,
  ...over,
})
const prs = (list: PrFact[], over: Partial<PrFacts> = {}): PrFacts => ({
  available: true,
  reason: null,
  asOf: '2026-10-13T11:59:00.000Z',
  prs: list,
  ...over,
})
const UNAVAILABLE: PrFacts = { available: false, reason: 'gh: not logged in', asOf: null, prs: [] }
const remoteSpec = (key: string, location: 'active' | 'done' = 'active') => ({
  name: `${key}-x.md`,
  location,
})
const CLEAN: GitFact = {
  worktree: 'present',
  branch: 'spawn/x',
  commitsAhead: 0,
  dirtyFiles: 0,
  pushed: false,
}

function run(
  parcels: ParcelProjection[],
  over: Partial<ReconcileInput> = {},
): Map<string, Reconciliation> {
  const out = reconcileGoal({
    parcels,
    items: parcels.map((p) => ({ key: p.parcel, text: `1. **${p.parcel}** queue text` })),
    repo: repo(),
    prs: prs([]),
    sessions: [],
    worktreeOutcome: () => CLEAN,
    now: NOW,
    ...over,
  })
  return new Map(out.map((entry) => [entry.parcel, entry]))
}
const codes = (r: Reconciliation | undefined) => (r?.discrepancies ?? []).map((d) => d.code)

test('vocabulary is the closed seven', () => {
  assert.deepEqual(
    [...DISCREPANCY_CODES],
    [
      'shipped-unrecorded',
      'recorded-unshipped',
      'unmerged-work',
      'orphan-worktree',
      'never-started',
      'local-remote-divergence',
      'stale-abandoned',
    ],
  )
})

test('AC3: 2026-10-13 replay — merged delivery PR + record not closed => shipped-unrecorded naming the PR', () => {
  const r = run([parcel('FOC-P0', { specLocation: 'active' })], {
    repo: repo({ remoteSpecFiles: [remoteSpec('FOC-P0')] }),
    prs: prs([pr(163, 'feat(foreman-line): FOC-P0 projection contract and discovery inventory')]),
  }).get('FOC-P0')
  assert.deepEqual(codes(r), ['shipped-unrecorded'])
  const d = r?.discrepancies[0]
  assert.ok(d?.evidence.some((line) => line.includes('PR #163 MERGED')))
  assert.ok(
    d?.options.at(-1)?.answer.includes('last resort'),
    'close/discard is labelled last resort and listed last',
  )
  assert.ok(
    d?.options[0]?.recommendation.includes('Complete the record instead of redoing the work'),
  )
})

test('false-positive trap: a merged DOCS/spec PR naming the key is not delivery evidence (PR #217 case)', () => {
  const r = run([parcel('FCA-P7', { specLocation: 'active' })], {
    repo: repo({ remoteSpecFiles: [remoteSpec('FCA-P7')] }),
    prs: prs([
      pr(217, 'docs(foreman-line): draft session-ledger + reconciliation specs (FCA-P7, FCA-P8)'),
    ]),
  }).get('FCA-P7')
  assert.ok(!codes(r).includes('shipped-unrecorded'))
  assert.deepEqual(codes(r), ['stale-abandoned'])
  assert.ok(
    r?.discrepancies[0]?.evidence.some((line) =>
      line.includes('not delivery evidence (title type docs)'),
    ),
  )
})

test('untyped and chore PR titles are weak too; feat/fix/perf/refactor into the default branch are strong', () => {
  assert.equal(isDeliveryPr(pr(1, 'Tmp/dev'), 'main'), false)
  assert.equal(isDeliveryPr(pr(1, 'chore: tidy'), 'main'), false)
  assert.equal(isDeliveryPr(pr(1, 'feat: x'), 'main'), true)
  assert.equal(isDeliveryPr(pr(1, 'fix(a): x'), 'main'), true)
  assert.equal(isDeliveryPr(pr(1, 'refactor!: x'), 'main'), true)
  assert.equal(
    isDeliveryPr(pr(1, 'feat: x', { baseRefName: 'release' }), 'main'),
    false,
    'merged into another branch',
  )
  assert.equal(isDeliveryPr(pr(1, 'feat: x', { state: 'OPEN' }), 'main'), false)
  assert.equal(titleType('Feat(Scope): thing'), 'feat')
  assert.equal(titleType('no type here'), null)
})

test('a closed record with a merged delivery PR has no discrepancy', () => {
  const r = run([parcel('FOC-P0', { state: 'complete', rule: 'R2', specLocation: 'done' })], {
    repo: repo({ remoteSpecFiles: [remoteSpec('FOC-P0', 'done')] }),
    prs: prs([pr(163, 'feat: FOC-P0 contract')]),
  }).get('FOC-P0')
  assert.deepEqual(codes(r), [])
})

test('recorded-unshipped only when the remote is fully assessable and shows NO trace', () => {
  const closed = parcel('FK-P11', { state: 'complete', rule: 'R2', specLocation: 'done' })
  const has = (over: Partial<ReconcileInput>) =>
    codes(run([closed], over).get('FK-P11')).includes('recorded-unshipped')
  assert.equal(has({}), true)
  assert.equal(has({ prs: UNAVAILABLE }), false, 'withheld without remote PR data')
  assert.equal(has({ repo: repo({ defaultRef: null }) }), false, 'withheld without a default ref')
  assert.equal(
    has({ repo: repo({ remoteSpecFiles: [remoteSpec('FK-P11', 'done')] }) }),
    false,
    'a remote spec is a trace',
  )
  assert.equal(has({ prs: prs([pr(5, 'docs: FK-P11 notes')]) }), false, 'any linked PR is a trace')
  assert.equal(
    has({
      repo: repo({
        defaultLog: [{ sha: 's', at: '2026-10-01T00:00:00Z', subject: 'FK-P11 engine' }],
      }),
    }),
    false,
    'a commit naming the key is a trace',
  )
})

test('unmerged-work: open PR; unmerged branch; worktree with commits or changes', () => {
  assert.deepEqual(
    codes(
      run([parcel('RCM-P1')], {
        prs: prs([pr(9, 'feat: RCM-P1 wip', { state: 'OPEN', mergedAt: null })]),
      }).get('RCM-P1'),
    ),
    ['unmerged-work'],
  )
  assert.deepEqual(
    codes(
      run([parcel('RCM-P1')], { repo: repo({ branches: [branch('feat/rcm-p1-wip')] }) }).get(
        'RCM-P1',
      ),
    ),
    ['unmerged-work'],
  )
  const wt = { path: '/wt/rcm-p1-2026', branch: 'spawn/rcm-p1-2026', head: 'h' }
  const dirty = run([parcel('RCM-P1')], {
    repo: repo({ worktrees: [wt] }),
    worktreeOutcome: () => ({ ...CLEAN, dirtyFiles: 3, commitsAhead: 2 }),
  }).get('RCM-P1')
  assert.deepEqual(codes(dirty), ['unmerged-work'])
  assert.ok(
    dirty?.discrepancies[0]?.evidence.some((line) =>
      line.includes('2 commits ahead, 3 changed files'),
    ),
  )
})

test('false-positive trap: a branch fully contained in the default branch is NOT unmerged work', () => {
  const r = run([parcel('FOC-P1')], {
    repo: repo({
      branches: [branch('spawn/foreman-ops-console-foc-p1-2026', { mergedIntoDefault: true })],
    }),
  }).get('FOC-P1')
  assert.ok(!codes(r).includes('unmerged-work'))
  assert.equal(r?.local.branches.length, 1, 'still shown as linked evidence')
})

test('orphan-worktree: clean + no commits + no live pane; a live session suppresses; unknown outcome is not asserted', () => {
  const wt = { path: '/wt/foc-p2-2026', branch: 'spawn/foc-p2-2026', head: 'h' }
  const base = { repo: repo({ worktrees: [wt] }) }
  assert.ok(codes(run([parcel('FOC-P2')], base).get('FOC-P2')).includes('orphan-worktree'))
  const live = {
    receiptId: 'r',
    worktreePath: wt.path,
    createdAt: '2026-10-13T11:59:00Z',
    state: 'running' as const,
    exitAt: null,
    orphanClean: false,
  }
  assert.ok(
    !codes(run([parcel('FOC-P2')], { ...base, sessions: [live] }).get('FOC-P2')).includes(
      'orphan-worktree',
    ),
  )
  const missing: GitFact = {
    worktree: 'missing',
    branch: null,
    commitsAhead: null,
    dirtyFiles: null,
    pushed: null,
  }
  assert.ok(
    !codes(
      run([parcel('FOC-P2')], { ...base, worktreeOutcome: () => missing }).get('FOC-P2'),
    ).includes('orphan-worktree'),
  )
  const unknown: GitFact = { ...CLEAN, commitsAhead: null }
  assert.ok(
    !codes(
      run([parcel('FOC-P2')], { ...base, worktreeOutcome: () => unknown }).get('FOC-P2'),
    ).includes('orphan-worktree'),
    'ahead count unknown is not zero',
  )
})

test('never-started: every source empty and remote assessable; any source, or an unavailable remote, withholds it', () => {
  const p = parcel('JEV-P3')
  assert.deepEqual(codes(run([p]).get('JEV-P3')), ['never-started'])
  assert.deepEqual(
    codes(run([p], { prs: UNAVAILABLE }).get('JEV-P3')),
    [],
    'depends on remote data: not asserted',
  )
  assert.ok(
    !codes(
      run([p], {
        repo: repo({ allLog: [{ sha: 's', at: '2026-10-01T00:00:00Z', subject: 'wip JEV-P3' }] }),
      }).get('JEV-P3'),
    ).includes('never-started'),
  )
  assert.ok(
    !codes(run([p], { prs: prs([pr(2, 'docs: JEV-P3 idea')]) }).get('JEV-P3')).includes(
      'never-started',
    ),
  )
  assert.ok(
    !codes(run([parcel('JEV-P3', { specLocation: 'active' })]).get('JEV-P3')).includes(
      'never-started',
    ),
  )
  const evidence = run([p]).get('JEV-P3')?.discrepancies[0]?.evidence.join(' ') ?? ''
  assert.match(evidence, /checked: spec \(none\), receipt chain \(absent\)/)
})

test('AC2 ambiguity: a candidate matching two keys is listed as ambiguous and never asserts', () => {
  const both = pr(7, 'feat: FOC-P1 and FOC-P2 together', { state: 'OPEN', mergedAt: null })
  const map = run([parcel('FOC-P1'), parcel('FOC-P2')], { prs: prs([both]) })
  for (const key of ['FOC-P1', 'FOC-P2']) {
    assert.deepEqual(
      map.get(key)?.ambiguous.map((ref) => ref.ref),
      ['#7'],
    )
    assert.ok(
      !codes(map.get(key)).includes('unmerged-work'),
      'ambiguous open PR does not assert unmerged-work',
    )
    assert.equal(map.get(key)?.remote.otherPrs.length, 0)
  }
})

test('token boundaries: FOC-P1 never links foc-p10; short generic keys are not linkable', () => {
  assert.equal(keyPattern('FOC-P1').test('feat/foc-p10-wip'), false)
  assert.equal(keyPattern('FOC-P1').test('feat/foc-p1-wip'), true)
  assert.equal(keyPattern('FOC-P1').test('FOC-P1: title'), true)
  assert.equal(keyPattern('FOC-P1').test('xfoc-p1'), false)
  assert.equal(keyPattern('E6-R1').test('w4 E6-R1 chain'), true)
  assert.equal(linkable('P1'), false)
  assert.equal(linkable('FOC-P1'), true)
  const map = run([parcel('P1')], {
    prs: prs([pr(1, 'feat: P1 thing', { state: 'OPEN', mergedAt: null })]),
  })
  assert.equal(map.get('P1')?.remote.otherPrs.length, 0, 'generic key links nothing')
})

test('local-remote-divergence: branch vs upstream; spec location mismatch; withheld when remote unknown', () => {
  const ahead = branch('feat/foc-p3-x', {
    mergedIntoDefault: true,
    upstream: 'origin/feat/foc-p3-x',
    aheadOfUpstream: 2,
    behindUpstream: 0,
  })
  const r = run([parcel('FOC-P3')], { repo: repo({ branches: [ahead] }) }).get('FOC-P3')
  assert.ok(codes(r).includes('local-remote-divergence'))
  assert.ok(
    r?.discrepancies
      .find((d) => d.code === 'local-remote-divergence')
      ?.evidence.some((line) => line.includes('2 ahead, 0 behind')),
  )
  const gone = run([parcel('FOC-P3')], {
    repo: repo({
      branches: [
        branch('feat/foc-p3-y', {
          mergedIntoDefault: true,
          upstream: 'origin/feat/foc-p3-y',
          upstreamGone: true,
        }),
      ],
    }),
  }).get('FOC-P3')
  assert.ok(gone?.discrepancies.some((d) => d.evidence.some((line) => line.includes('is gone'))))
  const spec = run([parcel('FOC-P3', { specLocation: 'active' })], {
    repo: repo({ remoteSpecFiles: [{ name: 'FOC-P3-x.md', location: 'done' }] }),
  }).get('FOC-P3')
  assert.ok(
    spec?.discrepancies
      .find((d) => d.code === 'local-remote-divergence')
      ?.evidence.some((line) =>
        line.includes('spec: local (main) has it in active/, origin/main has it in done/'),
      ),
  )
  const unknown = run([parcel('FOC-P3', { specLocation: 'active' })], {
    repo: repo({ defaultRef: null }),
  }).get('FOC-P3')
  assert.ok(!codes(unknown).includes('local-remote-divergence'), 'remote unknown: not asserted')
  assert.equal(unknown?.remote.specLocation, 'unknown')
})

test('AC7: remote unavailable keeps every local fact, asserts nothing remote-dependent, and says so', () => {
  const wt = { path: '/wt/foc-p4-2026', branch: 'spawn/foc-p4-2026', head: 'h' }
  const r = run([parcel('FOC-P4', { specLocation: 'active' })], {
    prs: UNAVAILABLE,
    repo: repo({
      worktrees: [wt],
      branches: [branch('spawn/foc-p4-2026', { mergedIntoDefault: true })],
    }),
  }).get('FOC-P4')
  assert.equal(r?.local.worktrees.length, 1)
  assert.equal(r?.local.branches.length, 1)
  assert.equal(r?.remote.prs.available, false)
  assert.equal(r?.remote.prs.reason, 'gh: not logged in')
  assert.ok(
    !codes(r).some((c) =>
      ['shipped-unrecorded', 'recorded-unshipped', 'never-started', 'stale-abandoned'].includes(c),
    ),
  )
  assert.match(r?.hung?.note ?? '', /cannot rule out that the work shipped/)
  assert.ok(r?.absentSources.some((s) => s.startsWith('PRs (unavailable: gh: not logged in')))
})

test('AC4: every hung parcel explains itself with the exact derivation inputs; non-hung has none', () => {
  const r = run([parcel('RCM-P2')]).get('RCM-P2')
  const text = r?.hung?.lines.join('\n') ?? ''
  assert.match(text, /Last recorded progress: 2026-09-26T00:00:00.000Z \(\d+(\.\d+)? h ago\)/)
  assert.match(text, /Heartbeat threshold: 6 h \(default\)/)
  assert.match(
    text,
    /Liveness: not live — no worktree basename matched the parcel key or goal slug/,
  )
  assert.match(text, /Rule R4 \(hung\): no earlier rule matched/)
  assert.equal(r?.hung?.note, null)
  const noProgress = run([
    parcel('RCM-P2', {
      heartbeat: {
        thresholdMs: 3_600_000,
        source: 'goal-override',
        lastProgressAt: null,
      } as ParcelProjection['heartbeat'],
    }),
  ]).get('RCM-P2')
  assert.match(
    noProgress?.hung?.lines.join('\n') ?? '',
    /No receipt or spec activity timestamp exists/,
  )
  assert.match(
    noProgress?.hung?.lines.join('\n') ?? '',
    /Heartbeat threshold: 1 h \(goal override\)/,
  )
  assert.equal(run([parcel('RCM-P2', { state: 'running', rule: 'R5' })]).get('RCM-P2')?.hung, null)
})

test('stale-abandoned lists weak traces so the operator can verify before closing', () => {
  const r = run([parcel('GMF-P0', { specLocation: 'active' })], {
    repo: repo({
      defaultLog: [
        { sha: 'deadbeef00', at: '2026-10-01T00:00:00Z', subject: 'record GMF-P0 shaping' },
      ],
      remoteSpecFiles: [{ name: 'GMF-P0-x.md', location: 'active' }],
    }),
  }).get('GMF-P0')
  assert.deepEqual(codes(r), ['stale-abandoned'])
  const evidence = r?.discrepancies[0]?.evidence.join('\n') ?? ''
  assert.match(evidence, /1 commit on origin\/main name the key \(weak trace\)/)
  assert.match(evidence, /spec is on origin\/main in active\/ \(weak trace\)/)
})

test('AC5: history merges receipts, commits, PR events and sessions chronologically; absent sources are listed', () => {
  const chain = {
    workflowId: 'w',
    locator: 'l',
    members: [
      {
        sequence: 1,
        stage: 'A',
        subjectKind: 'k',
        timestamp: '2026-09-26T01:00:00Z',
        hash: 'h',
        locator: 'docs/receipts/w/001.json',
      },
    ],
    sidecars: [],
    valid: true,
    errors: [],
    sealed: false,
    tipStage: 'A',
  }
  const session = {
    receiptId: 'foc-x-p0',
    worktreePath: '/wt/foc-p5-2026',
    createdAt: '2026-10-12T10:00:00Z',
    state: 'exited-error' as const,
    exitAt: '2026-10-12T10:00:02Z',
    orphanClean: true,
  }
  const r = run(
    [parcel('FOC-P5', { chain: chain as ParcelProjection['chain'], chainEvidence: 'present' })],
    {
      prs: prs([pr(50, 'feat: FOC-P5 thing')]),
      repo: repo({
        allLog: [
          { sha: 'abcdef1234', at: '2026-10-05T00:00:00Z', subject: 'feat: FOC-P5 first cut' },
        ],
      }),
      sessions: [session],
    },
  ).get('FOC-P5')
  const sources = r?.history.map((event) => event.source) ?? []
  assert.deepEqual([...new Set(sources)].sort(), ['commit', 'pr', 'receipt', 'session'])
  const times = (r?.history ?? []).map((event) => Date.parse(event.at ?? ''))
  assert.deepEqual(
    times,
    [...times].sort((a, b) => b - a),
    'newest first',
  )
  assert.deepEqual(r?.absentSources, [])
  const bare = run([parcel('FOC-P6')]).get('FOC-P6')
  assert.deepEqual(bare?.absentSources, ['receipts', 'commits', 'PRs', 'sessions'])
})

test('AC1: reconciliation never reads back, alters, or depends on derived state/rule', () => {
  const input = [parcel('FOC-P1'), parcel('FOC-P2', { state: 'complete', rule: 'R2' })]
  const snapshot = JSON.stringify(input)
  run(input, { prs: prs([pr(1, 'feat: FOC-P1 x')]) })
  assert.equal(JSON.stringify(input), snapshot, 'inputs untouched')
  const hungOnly = run([parcel('FOC-P1', { state: 'hung' })], {
    prs: prs([pr(1, 'feat: FOC-P1 x')]),
  }).get('FOC-P1')
  const runningOnly = run([parcel('FOC-P1', { state: 'running', rule: 'R5' })], {
    prs: prs([pr(1, 'feat: FOC-P1 x')]),
  }).get('FOC-P1')
  assert.deepEqual(
    codes(hungOnly),
    codes(runningOnly),
    'shipped-unrecorded does not depend on hung vs running',
  )
})

test('AC8: the token index is semantically identical to the per-key pattern, across tricky texts', () => {
  const keys = ['FOC-P1', 'FOC-P10', 'E6-R1', 'MRC-01', 'TO-P1', 'RCM-P1', 'FCA-P0', 'AB-CD-EF']
  const index = makeKeyIndex(keys)
  const texts = [
    'feat/foc-p1-wip',
    'foc-p10',
    'xfoc-p1',
    'foc_p1',
    'foc p1',
    'FOC-P1: title',
    'feat: FOC-P1 and FOC-P10',
    'w4 E6-R1 chain',
    'mrc-01-20261012t225715z',
    'foreman-to-p1-ratification',
    'to-p1',
    'Merge pull request #170 from m0r6aN/rcm-p1-x',
    'fca-p0/fca-p1',
    'ab-cd-ef-gh',
    'prefix-ab-cd-ef',
    'ab-cd',
    'a-foc-p1-b',
    '--foc-p1--',
    'FOC--P1',
    'foc-p1foc-p1',
    '',
    'spawn/foreman-ops-console-foc-p1-20261012t225424z',
  ]
  for (const text of texts) {
    const viaPattern = keys.filter((key) => linkable(key) && keyPattern(key).test(text)).sort()
    assert.deepEqual(index(text).sort(), viaPattern, JSON.stringify(text))
  }
})

test('AC8: 500 parcels against thousands of candidates reconcile quickly with flat per-parcel cost', () => {
  const keys = Array.from({ length: 500 }, (_, i) => `SYN-P${i}`)
  const parcels = keys.map((key, i) =>
    parcel(key, i % 3 === 0 ? { state: 'complete', rule: 'R2', specLocation: 'done' } : {}),
  )
  const defaultLog = Array.from({ length: 5000 }, (_, i) => ({
    sha: `sha${i}`.padEnd(40, '0'),
    at: '2026-10-01T00:00:00Z',
    subject: `feat: change ${i} for SYN-P${i % 500}`,
  }))
  const prList = Array.from({ length: 800 }, (_, i) =>
    pr(i + 1, `feat: SYN-P${i % 500} piece ${i}`),
  )
  const t0 = Date.now()
  const out = reconcileGoal({
    parcels,
    items: keys.map((key) => ({ key, text: `1. **${key}** text` })),
    repo: repo({
      defaultLog,
      allLog: defaultLog,
      branches: Array.from({ length: 400 }, (_, i) => branch(`feat/syn-p${i}-x`)),
    }),
    prs: prs(prList),
    sessions: [],
    worktreeOutcome: () => CLEAN,
    now: NOW,
  })
  const elapsed = Date.now() - t0
  assert.equal(out.length, 500)
  assert.ok(elapsed < 2000, `500 parcels took ${elapsed} ms (budget 2000)`)
  assert.ok(out.every((entry) => Array.isArray(entry.discrepancies)))
})

test('goal state lines are local record evidence: ranges expand, a mention suppresses never-started and shows as a trace', () => {
  const expanded = expandRanges('FOC-P1–FOC-P4 IMPLEMENTED')
  assert.deepEqual(
    expanded.split(' ').filter((token) => /^FOC-P\d$/.test(token)),
    ['FOC-P1', 'FOC-P2', 'FOC-P3', 'FOC-P4'],
    'the run is expanded; the original text is kept',
  )
  assert.ok(expanded.startsWith('FOC-P1–FOC-P4 IMPLEMENTED'))
  assert.equal(expandRanges('TO-P0-TO-P2'), 'TO-P0-TO-P2 TO-P0 TO-P1 TO-P2')
  assert.equal(expandRanges('FOC-P4–TO-P7'), 'FOC-P4–TO-P7', 'mismatched prefixes stay literal')
  assert.equal(expandRanges('FOC-P9–FOC-P2'), 'FOC-P9–FOC-P2', 'descending ranges stay literal')
  assert.equal(expandRanges('FOC-P1–FOC-P999'), 'FOC-P1–FOC-P999', 'huge ranges stay literal')
  const line = '**State: FOC-P0 SHAPED and FOC-P1–FOC-P4 IMPLEMENTED in ops-console/.**'
  const map = run(
    [parcel('FOC-P1'), parcel('FOC-P2'), parcel('FOC-P3'), parcel('FOC-P4'), parcel('FOC-P5')],
    { stateLines: [line] },
  )
  for (const key of ['FOC-P1', 'FOC-P2', 'FOC-P3', 'FOC-P4']) {
    assert.ok(
      !codes(map.get(key)).includes('never-started'),
      `${key} is mentioned by the goal record`,
    )
    assert.equal(map.get(key)?.local.stateMentions.length, 1)
    assert.ok(
      map
        .get(key)
        ?.discrepancies.some((d) =>
          d.evidence.some((e) => e.startsWith('goal state line mentions it')),
        ),
      key,
    )
  }
  assert.deepEqual(
    codes(map.get('FOC-P5')),
    ['never-started'],
    'unmentioned parcel is still never-started',
  )
  const options = map.get('FOC-P5')?.discrepancies[0]?.options.map((o) => o.answer) ?? []
  assert.ok(options.some((a) => a.startsWith('It shipped under another identity')))
  assert.ok(options.at(-1)?.includes('last resort'))
})

test('hung explanation names what holds a done-spec parcel back (rule R2 needs a closed marker when there is no chain)', () => {
  const held = run([parcel('RCM-P0', { specLocation: 'done' })]).get('RCM-P0')
  assert.match(
    held?.hung?.lines.join('\n') ?? '',
    /spec is in done\/ but the queue item carries no closed marker/,
  )
  assert.match(held?.hung?.lines.join('\n') ?? '', /rule R2 \(complete\) cannot match/)
  const marked = run([parcel('RCM-P0', { specLocation: 'done' })], {
    items: [{ key: 'RCM-P0', text: '1. **RCM-P0** ☑ SHIPPED + CLOSED' }],
  }).get('RCM-P0')
  assert.doesNotMatch(
    marked?.hung?.lines.join('\n') ?? '',
    /holding it back/,
    'marker present: nothing to say',
  )
  const activeSpec = run([parcel('RCM-P0', { specLocation: 'active' })]).get('RCM-P0')
  assert.doesNotMatch(
    activeSpec?.hung?.lines.join('\n') ?? '',
    /holding it back/,
    'only for a done spec',
  )
})

test('stale-abandoned is "asserted" only with no traces at all; any weak trace makes it a prompt to verify', () => {
  const none = run([parcel('GMF-P1')]).get('GMF-P1')
  assert.equal(
    none?.discrepancies.find((d) => d.code === 'stale-abandoned'),
    undefined,
    'a parcel with no traces is never-started, not stale',
  )
  const bareStale = run([parcel('GMF-P1', { specLocation: 'active' })], {
    repo: repo({ remoteSpecFiles: [remoteSpec('GMF-P1')] }),
  }).get('GMF-P1')
  assert.equal(
    bareStale?.discrepancies[0]?.confidence,
    'weak-traces',
    'a remote spec is a weak trace',
  )
  assert.match(bareStale?.discrepancies[0]?.summary ?? '', /Verify before closing/)
  const merged = run([parcel('RCM-P1', { specLocation: 'done' })], {
    repo: repo({ remoteSpecFiles: [remoteSpec('RCM-P1', 'done')] }),
    prs: prs([pr(51, 'Integrate reviewed RCM catalog and eligibility prerequisite (RCM-P1)')]),
  }).get('RCM-P1')
  assert.equal(
    merged?.discrepancies.find((d) => d.code === 'stale-abandoned')?.confidence,
    'weak-traces',
    'untyped merged PR is a weak trace, not a verdict',
  )
  const mentioned = run([parcel('RCM-P2')], {
    stateLines: ['> **State:** `RCM-P2-built-awaiting-gate-3` — RCM-P2 is built'],
  }).get('RCM-P2')
  assert.equal(mentioned?.discrepancies[0]?.confidence, 'weak-traces')
  assert.equal(
    mentioned?.local.stateMentions[0],
    'State: RCM-P2-built-awaiting-gate-3 — RCM-P2 is built',
    'markdown noise stripped',
  )
  for (const code of ['shipped-unrecorded', 'unmerged-work', 'orphan-worktree', 'never-started']) {
    const r = run([parcel('X-P1')], { prs: prs([]) }).get('X-P1')
    for (const d of r?.discrepancies ?? [])
      if (d.code === code) assert.equal(d.confidence, 'asserted', code)
  }
})
