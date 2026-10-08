# CFF-P1 completion record: change-proximity ordering and early-red signal (2026-10-08)

**Role:** builder (`cff_p1_builder_r1`). This record does not claim review or
merge. The two independent adversarial reviews are dispatched by the
coordinator. Gate 3 (merge) belongs to a human.
**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`,
SHA-256 `ed40b2c4d05616711f4f3e7b5c0e9dd7cf2808d81936b98c9201aa55459ebf83`.
This parcel did not edit it. The hash was re-measured at the build tip.
**Brief:** `plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-P1.md`.
**Worktree / branch:** `/home/cmorgan76/Repos/foreman-line-cff-p1`, `feat/foreman-line-CFF-P1`.
**Build host:** Linux (`7.2.5-3-omarchy`), Node `v26.8.2`. This is **not** the
pinned CI environment. See §Environment gaps.

## HEAD start / end

- **Start:** `41b927de448386f1afe6af8bb0d309e4acf437df`. The worktree was clean and
  verified by the coordinator at Step 0.
- **Build commits**, oldest first, conventional subjects, no trailers:

| Commit | AC group |
|---|---|
| `665b03bc` | AC6: `changedPathsFromEvent`, the D11 shared diff seam |
| `d24f0c9c` | AC1/AC2: proximity ordering and fail-closed pin consumption |
| `5a6b99b4` | AC5: shard early exit and sanitized `::error`/`::warning` |
| `4ed0f503` | AC3: coverage loudness field and step-summary line (**pre-re-pin state**) |
| `e952e43e` | AC3: `COST_TABLE` re-pin to 30 entries (**post-re-pin state**) |
| `2eaa1a76` | AC7: D3 conformance six-pack |
| `a0e5cccd` | AC4: Stage-F waiver disposition record |
| `e85d45bd` | AC1/AC2 fix: read the full `packages[*]` entry (§Findings F2) |
| `60568979` | AC8: each fail-closed row pinned to its named fallback reason |

- **End:** the commit that adds this record, a direct child of `60568979`. The
  coordinator verifies it with `git log -1`. The tip was advanced only by
  these commits. Nothing was rebased, reset, or amended.

## Scope: Allowed Files only

`git diff --name-only 41b927de HEAD` lists exactly the following:
`scripts/foreman-line-ci.mjs`, `scripts/foreman-line-ci.test.mjs`,
`scripts/ci-reuse.mjs`, `scripts/ci-reuse.test.mjs`,
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p1-stage-f-waiver-disposition.md`,
and this record. This record is covered by the spec's `surfaces:`
goal-directory entry.

- `git diff 41b927de HEAD -- .github/` has **0 lines**. There was no workflow edit.
- The spec is unchanged (`ed40b2c4…`).
- No `read-graph.json`, no `pins/surface-pins.json`, and no new runtime source
  file was added.
- `scripts/ci-reuse.mjs` is purely additive: `git diff 41b927de HEAD -- scripts/ci-reuse.mjs | grep -c "^-[^-]"` returns `0`.
- A byte-compare of these regions of `scripts/foreman-line-ci.mjs` against
  `41b927de` shows them **UNCHANGED**: `KERNEL_LEASE_TEST_FAILING` through
  `WAIVED_EXCLUSIONS`, `EXPECTED_SKIPS`, `evaluateWaiver`, `reconcile`,
  `verdict`, `sanitizeField`, `discoverPackages`, `assignShards`. This means
  no waiver-pin value edit, no reconcile branch, no verdict change, and no
  assignment-logic change.

## Step 0: disk facts re-cited, errata E1–E3 read

The runner scripts are byte-identical between `fcaa4b1a`, `145da132`, and the
start HEAD: `git diff --stat fcaa4b1a HEAD -- scripts/` touches only
`scripts/validate-reference-links.js`. I re-checked every spec citation I
build against by `grep -n` at the start HEAD. All are exact: `discoverPackages`
:212, `COST_TABLE` :277, `assignShards` :319, `WAIVED_EXCLUSIONS` :517,
`EXPECTED_SKIPS` :623, the `evaluateWaiver` kind-gate :701 (E2),
`evaluateWaiver` call :918, `waiver_rejected.layer` :931, `OUTCOMES_SCHEMA`
:788, `buildShardOutcomes` :816, `runShard` :837, `sameSet` :962 with calls at
:1047/:1089/:1108, `missing-checks`/`shard-fail`/`shard-error`/`unexpected-skip`
at :1069–1076, `verdict` :1150/:1151, `buildSummary` :1163, `sanitizeField`
:140. In ci-reuse: `READER_SET` :129, `classifyPath` :175, `parseNameStatusZ`
:416, rule 0 :746, the verification diff :835, `GITHUB_EVENT_PATH` :1086. E1
(hybrid-routing is live) is confirmed by the 30-name discovery below.

**One citation mismatch, which is not drift.** The spec cites
`sanitizeOutput :175`. The function is at **:166**, at `145da132` and at the
start HEAD alike. The code did not move, so this is a drafting mis-citation
that the lint did not catch. Its described behavior is accurate (keeps
newlines and tabs, neutralizes `::`, 200k cap). This parcel neither builds on
nor touches `sanitizeOutput`; AC5 uses `sanitizeField` :140. I judged it
reportable but not a stop. It is recorded here for the coordinator's ruling.

## Test counts and tripwire accounting

| Suite | Before (`41b927de`) | After (build tip) | New tests | Existing tests touched |
|---|---|---|---|---|
| `scripts/foreman-line-ci.test.mjs` | 151 | 195 | **44** | 4 definitions (10 instances) |
| `scripts/ci-reuse.test.mjs` | 145 | 172 | **27** | 0 |
| **Total** | **296** | **367** | **71** | |

The deterministic pass at the build tip, run as `node --test scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs`,
reports `tests 367, pass 367, fail 0, cancelled 0, skipped 0, todo 0`, exit 0.

The test-name set diff against `41b927de` was produced by running both
suites' TAP names at both commits. foreman-line-ci has 45 added names and 1
removed name (the rename below), so 44 tests are new. ci-reuse has 27 added
names and 0 removed. All growth comes from the CFF-P1 AC tests named under
"New tests" below.

### Existing tests touched (named, justified events)

1. **`${check} failure is recorded against its own check name and stays nonzero`**
   (1 definition, 3 instances). It asserted 10 calls, with `delta` running
   all-pass after `alpha` failed. AC5(a) mandates the early exit, so it now
   asserts `4 + index + 1` calls and that every later pair is `skipped`. The
   fixture is unchanged.
2. **`${label} during ${phase} fails closed and retains outcomes`** (1
   definition; only the 5 `check`-phase instances changed behavior). The
   check-phase call count goes from 10 to 5. `delta.lint` goes from `pass` to
   `skipped`, with `delta.ci === 'pass'` still retained. The install-phase
   instances are unchanged.
3. **`multiple failures are all retained rather than overwritten by later success`**
   is **renamed** to `the first failure is retained, never overwritten: the
   early exit leaves every later pair skipped (CFF-P1 AC5)`. Its premise
   (several failures in one shard run) cannot exist under AC5(a). The fixture
   still scripts failures at calls 5/8/10. The test now asserts the shard
   stops at call 5, `earlyExit` is `alpha/test`, and the scripted later
   outcomes never overwrite anything (they stay `skipped`).
4. **`R17: the pinned cost table is measured data (golden)`.** Three entries
   were added to the golden literal, as AC3 mandates. The 27 prior values are
   byte-unchanged.

Untouched but noted: `R17: the real table balances the 27-package sweep`
iterates `Object.keys(COST_TABLE)`, so it now runs over 30 names. It still
passes. Its title says "27", which is stale. I left it alone because it is
outside the necessary changes.

### New tests (71), grouped

**ci-reuse (27, AC6):**
- `pull_request resolves the PR base SHA…`
- `push resolves event.before…`
- `a resolved base with an empty diff is an empty set…`
- 22 fail-closed rows (§AC6 matrix)
- `classification is the existing classifyPath/READER_SET…`
- `the export body reuses parseNameStatusZ/classifyPath/gitBytes and owns the only new diff (grep-provable)`

**foreman-line-ci (44):**
- AC1/AC2:
  - `proximate packages run before non-proximate…`
  - `for EVERY proximate subset… (partition)` (all 16 subsets)
  - `the tie-break is ascending code-point order…`
  - 16 fail-closed rows (§AC2 matrix)
  - `the read-graph entry is the package's full measured read set…`
  - `R15: a variance-marked edge always ADDS…`
  - `proximity is binary path containment…`
  - `the pin is read read-only, if and only if present…`
  - `CLI wiring…`
  - `AC1 grep: the D7 pin is consumed in exactly one validator and never filters mine`
- AC5:
  - `stops at the first non-waived failure…` (every one of the 12 failure positions)
  - `the early exit follows the proximity order`
  - `a WAIVED failure never stops the loop`
  - `reconcile fails the partial artifact via its EXISTING codes…`
  - `one ::error per fail, one ::warning per waived, none on pass`
  - `hostile package/check/layer text cannot forge…`
  - `CLI: the partial artifact is written BEFORE the non-zero return…`
  - `prohibitions: the workflow keeps no cancellation…`
- AC3:
  - `loudness: the artifact names every discovered package absent…`
  - `loudness: the step summary carries the coverage line in both states`
  - `costKnown is all-or-nothing…`
  - `re-pin: the table prices the three post-CI-P2 packages…`
- AC7: `fixture sanity` and `D3.1`–`D3.6`.

## AC6: D11 shared diff seam

**Export name (Open Question 1):** `changedPathsFromEvent({ env, readFile, git })` in
`scripts/ci-reuse.mjs`. It is the only new export in that file.

- It is built only from the existing `gitBytes` seam, `parseNameStatusZ`, and
  `classifyPath` (default `READER_SET`). Paths classified
  `ordinary_documentation` are dropped. Both sides of a rename or copy count.
- Base selection: `pull_request` uses `pull_request.base.sha`, `push` uses
  `event.before`, and the head is `GITHUB_SHA`. One call:
  `git diff --name-status -z <base> <head>`.
- It never throws. Every fail-closed condition returns `{ paths: null, reason }`.
  A resolved base with an empty diff returns `[]`, which is distinct from the
  fail-closed result and tested.
- **Fail-closed matrix (VP Q5). All 22 rows are tested and green.** The rows
  were: absent `GITHUB_EVENT_PATH`; empty `GITHUB_EVENT_PATH`; unreadable
  file; unparseable JSON; JSON `null`; JSON array; unsupported event class;
  absent event name; PR with no `pull_request`; null `base`; present-but-null
  `base.sha`; non-hex40; uppercase hex; all-zeros PR base; push with
  all-zeros `before`; missing `before`; non-hex40 `before`; missing
  `GITHUB_SHA`; all-zeros `GITHUB_SHA`; `git diff` non-zero; git seam throws;
  malformed diff output. Each row returns `paths: null` with its named reason.
  For every pre-git row, no git call is made.
- **Only diff source:** `grep -n "'diff'" scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs` gives
  `ci-reuse.mjs:505` (the new seam) and `ci-reuse.mjs:916`. The second is the
  pre-existing verification diff, which was cited as `:835` and moved down by
  the 81 added lines above it. Its bytes are unchanged. The runner contains no
  `'diff'`, `'git'`, or `"git"`; a shipped grep test asserts this.
- **Real-repository smoke test** (Linux, real git): with a push event file
  whose `before` is `HEAD~3` of `41b927de`, the seam returned the 10
  non-ordinary paths of that range and dropped the 6 ci-fail-fast `.md`
  records, which classify as ordinary.

## AC1/AC2: ordering and the D7 pin contract

- Phase 2 iterates `computeShardOrder(...).order`. Proximate packages come
  first, then non-proximate, each group as a stable split of `mine` (which is
  already ascending). Phase 1 is untouched. The artifact still lists every
  assigned package in discovery order. A partition re-assertion
  (`sameSet(order, mine)`) falls back if it is ever violated. Probe M8b shows
  the guard alone catches an excluding mutation.
- The pin is read read-only by `loadReadGraph`. The path is
  `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json`.
  Missing, unreadable, or unparseable files give a null document with a named
  reason.
- **Contract accepted** (`validateReadGraph`):
  - `schema === 'foreman-line-ci/read-graph@1'` exactly.
  - `packages` must be a plain object mapping name to `string[]`. This is each
    package's full measured read set, own directory included.
  - `projections.affection_pin` is optional and must have the same
    positive-only shape. It is unioned in.
  - `named_variance_edges` is optional and must be an array of
    `{ package: string, path: string }`. Entries are unioned in (R15: they only
    add).
  - Any key whose letters contain `exclu`, `notaffect`, `unaffect`, `skip`,
    `omit`, or `negative`, at the top level, in `projections`, or in an edge,
    makes the pin malformed.
- **Proximity:** binary, per package. A package is proximate when any read
  path equals a changed path or is a directory prefix of one. Matching is
  case-insensitive and treats `\`/`/` alike; both only add matches.

**AC2 fail-closed matrix.** Every row's full spawn sequence (installs and
checks) is byte-identical to today's order. Every row asserts its named
reason. Every row is paired with a repaired control that does reorder.

| Row | Named fallback reason | Result |
|---|---|---|
| missing pin file (`readGraph` null) | `pin-unavailable` | byte-identical ✔ |
| D11 seam returned `paths: null` | `changed-paths-unavailable` | ✔ |
| schema `…@2` | `pin-schema-mismatch` | ✔ |
| `schema` absent (`$schema` only) | `pin-schema-mismatch` | ✔ |
| non-object pin (array) | `pin-malformed` | ✔ |
| no `packages` field | `pin-malformed` | ✔ |
| non-object `projections` | `pin-malformed` | ✔ |
| top-level `excludes` | `pin-exclusion-shaped` | ✔ |
| `projections.not_affected` | `pin-exclusion-shaped` | ✔ |
| per-package entry is an object with `excludes` | `pin-entry-not-positive` | ✔ |
| non-string path in an entry | `pin-entry-not-positive` | ✔ |
| exclusion-shaped `affection_pin` entry | `pin-entry-not-positive` | ✔ |
| variance edge with a `skip` flag | `pin-exclusion-shaped` | ✔ |
| variance edge without `path` | `pin-variance-edge-shape` | ✔ |
| thrown error (throwing `packages` accessor) | `proximity-error` | ✔ |
| thrown error (non-string changed path) | `proximity-error` | ✔ |

On the CLI: `runCli shard` calls the D11 seam and the loader, each inside
try/catch, so neither can throw out of the CLI. It logs one line:
`shard ordering: proximity (N proximate first: …)` or
`shard ordering: ascending-name fallback (<reason>; diff: <reason>; pin: <reason>)`.
All fields pass through `sanitizeField`.

**Ordering never excludes (VP Q2).**
- The pin document's fields are read only inside `validateReadGraph`. A
  shipped grep test checks that no `doc.`/`readGraph.`/`readGraph[` access
  appears elsewhere.
- No code splices or reassigns `mine`.
- The artifact filter is still `mine.includes(p.name)`.
- Across all 16 proximate subsets, every assigned package runs every check
  exactly once.

## AC5: D8 early-red

- **(a)** The phase-2 loop is labeled `phase2:` and runs `break phase2` only in
  the non-waived (`evaluation.record === null`) branch. A waived failure
  continues, which is tested. Unreached pairs keep their pre-populated
  `skipped`. Exit code derivation is unchanged: it is computed from recorded
  `fail`/`error` only, so an early exit can never yield 0. `runCli`'s `shard`
  branch writes `shard-outcomes.json` before `return result.exitCode`. I
  verified this in source and with a CLI test that records the write event
  before the return of 1.
- **Reconcile on the partial artifact, existing codes only (VP Q3).** With a
  red at `beta/typecheck`, the codes are exactly `{shard-fail,
  unexpected-skip}` with 7 named skips, and `verdict` is `aggregate-failed`.
  Two fixture mutations confirm this is not lenient. Forging the tail to
  `pass` and removing the red reconciles green, so the skips and the fail are
  what fail it. Forging only the tail leaves just `shard-fail`. Probe M27 (a
  lenient skip branch) is caught.
- **(b) Annotations.** `buildAnnotation(level, name, check, layer)` emits
  `::error file=<pkg>,title=<check>::foreman-line <pkg>/<check> failed (waiver
  layer: <layer>); shard early exit…` at the fail point. For waived checks it
  emits `::warning…waived…`. Nothing is emitted on `pass`.
  - Inputs are the package name, check name, and `evaluation.layer` only.
    Each goes through `sanitizeField`, then GitHub property escaping
    (`%`→`%25`, `,`→`%2C`, `:`→`%3A`). The message is escaped with `%`→`%25`.
  - Hostile inputs were tested in every field: `::`, CR/LF, `,title=`
    property smuggling, pre-encoded `%0A`, bidi overrides, C0/ESC. In every
    case the result is one line, has exactly the two literal `::` delimiters,
    has exactly `file=` and `title=`, and carries no bidi or control
    characters.
  - Raw captured output never enters an annotation. The test injects
    `RAW-OUTPUT-SENTINEL ::error::forged` into check output and asserts it is
    absent from every annotation. Probe M16, which routes `result.output` into
    the annotation, is caught.
  - **Reading I chose:** annotations fire for phase-2 checks
    (`test`/`typecheck`/`lint`) only. A phase-1 install failure emits none,
    because the brief binds "Phase 1 (install barrier) is untouched". The
    install red still reaches the verdict exactly as today.
- **Prohibitions:** no workflow diff (0 lines); no `cancel-in-progress`,
  `checks: write`, or `statuses: write`; no Checks API URL in the runner; no
  `needs` change. The shipped structural test is not a byte pin. The
  diff-against-base check is the 0-line `.github/` diff above.

## AC3: cost-table re-pin and coverage loudness

**Measurement source (Open Question 2).** Pinned-environment evidence only:
the CFF-P0 capture-of-record run **`37768165017`**, head `2d81d926`. All 4
shards ran on windows-latest. The artifact `read-graph-fingerprint.json`
reports `"node": "v24.19.0"`, `"platform": "win32"`, `"arch": "x64"`. All 30
packages passed every check, and every shard reported `SWEEP_EXIT_CODE=0`. No
Linux-local measurement was used.

**Methodology.** A2 placement 11b defines per-package wall as
`test + typecheck + lint`. The run publishes no per-package timer, so I
derived it from the raw capture artifacts (`read-graph-raw-capture-shard-{0..3}`,
downloaded with `gh run download 37768165017`). Every instrumented process
record carries `pid`, `cwd`, `argv1`, and `ts` in epoch ms.
- Phase-2 start of package *P*: the first `npm-cli.js` record with `cwd`
  under *P*, after phase 1 ends. Phase 1 ends after the last discovered
  package's (`worker-envelopes`) install begins.
- Wall(*P*): the start of the next assigned package minus the start of *P*.
  For the last package in a shard, it is the shard's last record minus the
  start of *P*.
- The window is the check processes' sequential span, including their
  startup.
- Cross-check for `project-scaffold`: test 11:38:07.906, typecheck
  11:38:27.373, lint 11:38:27.935, next package (`role-authority`)
  11:38:28.412, giving **20.5 s**.

Reproduction script (run in a directory holding `s<k>/` extracted artifacts):

```js
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const shard = process.argv[2]
const dir = `s${shard}/read-graph-capture`
const mine = JSON.parse(readFileSync(`s${shard}/read-graph-shard-outcomes/shard-outcomes.json`, 'utf8')).packages.map(p => p.name)
const npm = []
let maxTs = -Infinity
for (const f of readdirSync(dir)) {
  if (!f.startsWith('capture-')) continue
  for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) {
    if (!line) continue
    let r; try { r = JSON.parse(line) } catch { continue }
    if (r.ts > maxTs) maxTs = r.ts
    if (typeof r.argv1 === 'string' && r.argv1.endsWith('npm-cli.js')) {
      const segs = r.cwd.split('\\'); const i = segs.indexOf('foreman-line')
      npm.push({ ts: r.ts, pkg: i >= 0 ? segs[i + 1] : null })
    }
  }
}
npm.sort((a, b) => a.ts - b.ts)
const weStart = npm.find(r => r.pkg === 'worker-envelopes').ts
let prev = weStart
const starts = []
for (const p of mine) {
  const s = npm.find(r => r.pkg === p && r.ts > prev && (starts.length > 0 || r.ts > weStart + 1500)).ts
  starts.push(s); prev = s
}
const out = {}
mine.forEach((p, i) => { out[p] = +(((i + 1 < mine.length ? starts[i + 1] : maxTs) - starts[i]) / 1000).toFixed(1) })
console.log(JSON.stringify({ shard, phase2Start: new Date(starts[0]).toISOString(), end: new Date(maxTs).toISOString(), wall: out }))
```

**Pinned values:** `kernel-import` **18.0**, `ops-console` **6.5**,
`project-scaffold` **20.5** seconds. These are single-run measurements from
the one capture of record.

**Calibration against the 27 existing entries, same run, same method.** The
median ratio of measured to pinned is **1.13** (min 0.36, max 3.19, n = 27).
The capture ran with `NODE_OPTIONS=--require=<probe>` fs/module
instrumentation. That inflates I/O-heavy suites: `verification` measured
2.35×, `spec-linter` 3.19×. For the three new packages I recorded the
measured values unscaled, because scaling would be a guess. The bias is in
the conservative direction (overweighting light packages). Outliers below
1.0 (`kernel-lease` 0.36, `mutation-scope-guard` 0.46) are packages whose
prior entries were measured in a failing or cap-killed era. They are flagged
for the next D10 cost re-measurement and were not touched (AC3: the 27 stay
untouched).

| Shard | Package | Measured (s) | `COST_TABLE` | Ratio |
|---|---|---|---|---|
| 0 | `approval` | 17.1 | 14.3 | 1.20 |
| 0 | `contracts` | 3.2 | 3.2 | 1.00 |
| 0 | `integration` | 17.1 | 7.8 | 2.19 |
| 0 | `kernel-lease` | 24.1 | 67.0 | 0.36 |
| 0 | `permission-profiles` | 15.5 | 13.7 | 1.13 |
| 0 | `registration` | 36.3 | 18.0 | 2.02 |
| 0 | `shaping` | 7.5 | 4.2 | 1.79 |
| 0 | `verification` | 882.6 | 375.2 | 2.35 |
| 1 | `authority-registry` | 1524.3 | 1407.8 | 1.08 |
| 1 | `dispatch` | 70.3 | 33.6 | 2.09 |
| 1 | `jev-decisions` | 2.0 | 1.6 | 1.25 |
| 1 | `kernel-state` | 17.5 | 8.1 | 2.16 |
| 1 | `project-scaffold` | 20.5 | **20.5 (new)** | — |
| 1 | `role-authority` | 2.7 | 3.6 | 0.75 |
| 1 | `skill-injection` | 13.3 | 13.9 | 0.96 |
| 1 | `worker-envelopes` | 3.8 | 3.2 | 1.19 |
| 2 | `bypass-outage-harness` | 37.4 | 36.9 | 1.01 |
| 2 | `foreman-config` | 8.9 | 9.5 | 0.94 |
| 2 | `kernel-contracts` | 3.2 | 3.8 | 0.84 |
| 2 | `mutation-scope-guard` | 15.6 | 33.9 | 0.46 |
| 2 | `projection` | 9.2 | 4.8 | 1.92 |
| 2 | `routing-policy` | 43.6 | 17.2 | 2.53 |
| 2 | `spec-body-compiler` | 3.7 | 3.4 | 1.09 |
| 3 | `contract-readers` | 4.4 | 7.7 | 0.57 |
| 3 | `hybrid-routing` | 32.4 | 17.2 | 1.88 |
| 3 | `kernel-import` | 18.0 | **18.0 (new)** | — |
| 3 | `ops-console` | 6.5 | **6.5 (new)** | — |
| 3 | `receipts` | 12.9 | 12.4 | 1.04 |
| 3 | `schema-scaffold` | 2.4 | 2.8 | 0.86 |
| 3 | `spec-linter` | 63.2 | 19.8 | 3.19 |

**Loudness field.** `buildShardOutcomes` gained an additive
`cost_table_missing: string[]`. It holds the discovered names absent from
`COST_TABLE` for that run. `buildSummary` gained a coverage line, and
artifacts without the field say "not reported". Both states below are real
command output. The script calls the real `runCli(['shard','0','4',…])` with
real discovery and the real `COST_TABLE`; only npm spawns are stubbed to pass.
It reads back the written artifact and the `GITHUB_STEP_SUMMARY` file.

Pre-re-pin, at `4ed0f503`:
```
discovered=30 COST_TABLE entries=27
assignShards(discovered, 4) sizes=8/8/7/7
exit=0
artifact.cost_table_missing=["kernel-import","ops-console","project-scaffold"]
step-summary line: Cost-table coverage: 3 discovered package(s) missing from COST_TABLE (cost_table_missing: ["kernel-import","ops-console","project-scaffold"]) - round-robin shard assignment fallback in effect.
```

Post-re-pin, at `e952e43e` (re-run identically at the build tip `60568979`):
```
discovered=30 COST_TABLE entries=30
assignShards(discovered, 4) sizes=1/1/13/15
exit=0
artifact.cost_table_missing=[]
step-summary line: Cost-table coverage: every discovered package is priced (cost_table_missing: []) - cost-aware shard assignment in effect.
```

**Deliberate mechanism flip (D10(a)), stated plainly.** The re-pin satisfies
`costKnown`'s all-or-nothing gate for all 30 discovered names. Live
assignment moves from the round-robin fallback (8/8/7/7, matching CFF-P0's
measurement) to the ratified cost-aware LPT assignment. At shardCount 4 the
loads are:

| Shard | Load (s) | Packages |
|---|---|---|
| 0 | 1407.8 | `authority-registry` |
| 1 | 375.2 | `verification` |
| 2 | 202.6 | 13 packages |
| 3 | 204.0 | 15 packages |

`reconcile` re-derives assignment from the same table, so artifacts and
re-derivation agree. This is intentional, not incidental. Reviewer note: with
13–15 packages per light shard, the AC1 ordering and AC5 early exit matter
most in shards 2 and 3.

## AC4: dead-waiver disposition (record only)

Written to `cff-p1-stage-f-waiver-disposition.md`. It re-verifies run
`37674775022` @ `fb25630` (all four identities pass every check, `waivers=0`)
and corroborates with `37768165017`. It also measures that the pins cannot
absorb a lone flake: kernel-lease gives `range` and authority-registry gives
`marker-missing`, while a full pinned regression gives `WAIVED`. Dispositions:

| Identity | Disposition |
|---|---|
| `bypass-outage-harness` | propose removal in a future ratified amendment |
| `jev-decisions` | propose removal in a future ratified amendment |
| `kernel-lease` | propose removal, after a ≥10-run CN flake-rate re-measurement |
| `authority-registry` | propose removal, after a ≥10-run R31 git-sensitivity re-measurement |

**No `WAIVED_EXCLUSIONS` edit:** the byte-compare above shows that region
UNCHANGED.

## AC7: D3 conformance (VP Q1, Q7)

One test per point of `cff-p0-waiver-input-contract.md` §3. All of them run
under **three proximity-induced orders**:

| Order | Proximate set |
|---|---|
| `gamma, alpha, beta, delta` | {gamma} |
| `beta, gamma, alpha, delta` | {beta, gamma} |
| `alpha, gamma, beta, delta` | {alpha, gamma} |

The fixture is built so any leak is visible. Every passing pair's output
carries its own `<pkg/check>` identity and a would-be intruder `✖ leaked
from …` failure line. A cross-pair leak into the waived pair (`alpha/test`)
or the rejected pair (`delta/lint`, layer `set-subset`) therefore changes the
waiver verdict and the hash. Each point is bound by a code mutation; the full
list is under AC8.

| Point | Bound by |
|---|---|
| D3.1 per-package capture | M22 (cross-pair leak) |
| D3.2 concatenation | M23 (stderr/stdout swapped) |
| D3.3 granularity | M24 (double invoke) |
| D3.4 parsing (equals the unmodified `evaluateWaiver`) | M22 |
| D3.5 `output_sha256` per-run and unread by ordering | M25 (ordering reads `output_sha256`) |
| D3.6 no interleaving | M26 (async spawn accepted) |

For D3.6, `maxInFlight === 1`. A spawn that returns a Promise is never
awaited: the pair is `fail` at the `kind-gate` and the late output never
reaches any record.

## AC8: mutation probes (SC #11), expected vs. observed

**Method.** Each mutation was applied in place to `scripts/ci-reuse.mjs` or
`scripts/foreman-line-ci.mjs`. The owning suite was run, then the file was
restored with `git checkout`. The tree was confirmed clean after the matrix.
The harness was run at `60568979`. "Observed" lists the named expected tests
found among the failures; the total number of failing tests is in brackets.
**30 of 30 probes were caught.**

| # | Mutation | Expected failing test(s) | Observed |
|---|---|---|---|
| M1 | all-zeros base accepted | `…all-zeros base sha`, `…all-zeros before` | both [2] ✔ |
| M2 | push uses the PR base | `push resolves event.before` | ✔ [1] |
| M3 | ordinary paths not dropped | `classification is the existing classifyPath…` | ✔ [2] |
| M4 | failed `git diff` read as "no changes" | `git diff exits non-zero` | ✔ [1] |
| M5 | second differ export added | `owns the only new diff` | ✔ [1] |
| M6 | non-proximate first | `proximate packages run before`, `EVERY proximate subset` | ✔ [30] |
| M7 | tie-break descending | `tie-break is ascending` | ✔ [5] |
| M8 | drop non-proximate and remove the partition guard | `EVERY proximate subset` | ✔ [27] |
| M8b | drop non-proximate, guard intact | `EVERY proximate subset` (the guard falls back) | ✔ [25] |
| M9 | schema gate removed | `@2`, `schema field absent` | ✔ [2] |
| M10 | top-level exclusion-key check removed | `exclusion-shaped top-level field` | ✔ [1] |
| M11 | non-positive entry skipped instead of refused | per-package entry, non-string path, affection_pin entry | ✔ [3] |
| M12 | proximity error not caught | `throwing accessor`, `non-string changed path` | ✔ [2] |
| M13 | variance edges ignored | `variance-marked edge always ADDS` | ✔ [1] |
| M14 | no early exit | `stops at the first non-waived failure`, `first failure is retained` | ✔ [14] |
| M15 | waived also early-exits | `WAIVED failure never stops` | ✔ [8] |
| M16 | raw output routed into the annotation | `one ::error per fail…` | ✔ [1] |
| M17 | package name not sanitized | `hostile package/check/layer…` | ✔ [1] |
| M18 | property escaping removed | `hostile package/check/layer…` | ✔ [1] |
| M19 | annotation on pass | `one ::error per fail… none on pass` | ✔ [1] |
| M20 | loudness field silenced | `AC3 loudness: the artifact names…` | ✔ [1] |
| M21 | a re-pinned entry dropped | golden, `AC3 re-pin` | ✔ [2] |
| M22 | cross-pair output leak | `D3.1`, `D3.4` | ✔ [7] |
| M23 | stream order swapped | `D3.2` | ✔ [2] |
| M24 | check invoked twice | `D3.3` | ✔ [19] |
| M25 | ordering code reads `output_sha256` | `D3.5` | ✔ [1] |
| M26 | async spawn result accepted as pass | `D3.6` | ✔ [1] |
| M27 | reconcile lenient on a skipped tail | `reconcile fails the partial artifact…` | ✔ [2] |
| M28 | own read-graph entry ignored (affection_pin only) | `…OWN-source change makes it proximate` | ✔ [25] |

The first run of this matrix found **M12 MISSED**. My F2 fix (below) made the
validator refuse a missing `packages` field before it reached the old
throwing `projections` getter, so that row fell back for a different reason.
Commit `60568979` moved the getter onto `packages` and pinned every
fail-closed row to its exact named reason. M12 is now caught. I am recording
this openly because it is exactly the failure mode SC #11 exists to catch.

Fixture-level mutation is also built into the shipped tests:
- Every AC2 fail-closed row carries a repaired control that must reorder.
- AC5's reconcile test forges the artifact both ways.
- AC7's fixture carries intruder lines that make any leak change a verdict.

## Findings for coordinator and reviewers

- **F1: `sanitizeOutput` mis-citation** (:175 vs :166). See §Step 0. It is
  not drift and the function is untouched.
- **F2: semantics of the CFF-P0 read graph.** This was caught during the
  build and fixed in `e85d45bd`. I read CFF-P0's in-review artifact read-only
  with `git show feat/foreman-line-cff-p0:…/read-graph.json` at `91480ae7`.
  Nothing was copied or committed.
  - `projections.affection_pin` is **external-only**: paths outside each
    package's own directory, per its `measurement-log.md` §Projection 2. The
    full per-package read set, own directory included, is `packages[*]`.
    `affection_pin` is a strict subset of it (verified).
  - My first consumer read only `affection_pin`. Under it, a change to
    `receipts/src/index.ts` did **not** make `receipts` proximate. That is
    latency-only (fail-safe), but it defeats exit criterion 4's main case.
  - AC1's text ("its read-graph entry … intersects") names the per-package
    entry, so the consumer now requires `packages` and unions `affection_pin`
    and variance edges. Against the real artifact:
    `validate: true null packages: 30`. A `receipts/src/index.ts` change now
    puts `receipts` in the proximate group, alongside its measured
    consumers: `bypass-outage-harness`, `contract-readers`, `registration`,
    `routing-policy`, `spec-linter`. A `scripts/foreman-line-ci.mjs` change
    makes nothing proximate, which is today's order.
- **F3: cross-parcel contract assumption.** The variance-edge element shape
  `{ package, path }` is this parcel's assumption. CFF-P0's artifact names no
  edges yet (`named_variance_edges: []`). If CFF-P0 settles on a different
  shape, every pin carrying edges becomes malformed and ordering falls back to
  today's order. That is fail-safe, but proximity would be silently lost. I
  recommend pinning the edge shape in CFF-P0's review, or in a follow-up.
- **F4: uncovered changed paths.** A non-ordinary changed path that no
  package reads (for example `scripts/foreman-line-ci.mjs`) makes nothing
  proximate. The spec's enumerated fallback triggers do not include this, so
  it is not a fallback trigger. With an empty proximate set the order equals
  today's anyway; a mixed set orders the covered packages first. Coverage is
  unaffected: every package still runs.
- **F5: `read-graph.json` is absent in this worktree.** Until CFF-P0 merges,
  every CI run on this branch logs
  `shard ordering: ascending-name fallback (pin-unavailable; …; pin: pin-missing)`.
  That is the designed AC2 path.

## Environment gaps (lessons #47/#48), named, never silently skipped

- **Deterministic pass host.** Run on Linux with Node v26.8.2, not
  windows-latest with Node 24.19.0. The workflow's `test` job runs both suites
  on windows-latest/24.19.0 for the PR. That run is the pinned-environment
  confirmation and is not done here.
- **Live D11 behavior** (real `GITHUB_EVENT_PATH` payloads, the
  `pull_request` merge-commit `GITHUB_SHA`, the `fetch-depth: 0` availability
  of base SHAs) is exercised here only with injected seams plus one local
  real-git smoke test. It needs the CI/Windows class.
- **Live D8 behavior** needs the CI class: annotation rendering in the Actions
  UI, partial-artifact upload under `if: ${{ !cancelled() }}` after a non-zero
  shard exit, and the `test` context still reaching a terminal state. Exit
  criterion 4's live demonstration belongs to CFF-P4.
- **AC3 figures** are a single pinned-environment run under instrumentation
  (calibration above). A multi-run, uninstrumented re-measurement is named as
  future D10 work.

## What this parcel did not do

- No review, merge, PR, push, or Gate 3 action.
- No workflow, spec, pin-table, or `read-graph.json` write.
- No `WAIVED_EXCLUSIONS` value edit.
- No change to `reconcile`, `verdict`, `assignShards`, or `discoverPackages`.
- No sibling cancellation, no Checks API use, and no early-green path.
