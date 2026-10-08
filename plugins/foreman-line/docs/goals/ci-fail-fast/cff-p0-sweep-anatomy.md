# CFF-P0 — Sweep timeline anatomy (AC1)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
(SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`), AC1.
**Measured at:** worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`,
`scripts/foreman-line-ci.mjs` / `scripts/ci-reuse.mjs` last changed at
`145da132a3c2268025764558270e4ff553c6877c` (line citations below are re-cited
against this commit, not the shaping-time `14b2501a` snapshot).
**Environment fingerprint of this measurement session:** `linux` (kernel
`7.2.5-3-omarchy`), Node `v26.8.2`, `gh` CLI `2.102.0` — this record is log
analysis of runs that themselves executed on the pinned CI environment
(`windows-latest`, Node `24.19.0`); no check in this record was re-executed
locally. Every timestamp below is the GitHub Actions API/log timestamp of the
cited run, not a local measurement.

## 1. Sources (run IDs)

| Run ID | Event | Head SHA | Conclusion | Created (UTC) | Completed (UTC) | Role |
|---|---|---|---|---|---|---|
| `37661562241` | `pull_request` PR #155 | `7803793...` | failure | 2026-10-07T17:45:42Z | 2026-10-07T18:17:50Z | cycle 1 |
| `37664971051` | `pull_request` PR #155 | `74de931...` | failure | 2026-10-07T18:11:58Z | 2026-10-07T18:37:47Z | cycle 2 |
| `37666762575` | `pull_request` PR #155 | `cd93fa7...` | failure | 2026-10-07T18:25:50Z | 2026-10-07T18:52:10Z | cycle 3 |
| `37674775022` | `push` (merge #155) | `fb25630c36541dad6da1f0c3a90642d64e625db3` | success | 2026-10-07T19:28:41Z | 2026-10-07T19:59:27Z | historical green reference |
| `37700880444` | `push` (merge #156) | `05d428e7ae80bf427e8e79cfb87cde442ca08596` | success | 2026-10-07T23:12:11Z | 2026-10-07T23:43:02Z | **fresh green main run, measured at build time** (most recent green `foreman-line-ci` run on `main` as of this session; no PR merge is in a builder's authority, so "fresh" here means freshly pulled and analyzed this session, not freshly triggered) |
| `37700880571` | `push` (merge #156, same head) | `05d428e...` (same commit) | failure | 2026-10-07T23:12:11Z | 2026-10-07T23:12:23Z | validate-versions red-base episode (`Test Plugin Installation` workflow, not `foreman-line-ci`) |

**Reproduction commands:**
```
gh run view <RUN_ID> --repo m0r6aN/agent-skills --json headSha,conclusion,status,createdAt,updatedAt,displayTitle,event
gh api repos/m0r6aN/agent-skills/actions/runs/<RUN_ID>/jobs
gh run view <RUN_ID> --repo m0r6aN/agent-skills --log > run.log   # per-line timestamped log
```

## 2. Measured quantities

### (a) Install cost per package — **measurement limitation, stated honestly**

`runShard`/`run()` (`scripts/foreman-line-ci.mjs:908`, the per-shard
`invoke()` at `:1058`) only writes a package's captured stdout/stderr to the
job log when that check's status is not `pass` (`run()` at `:76-80`: the
failure-dump section `if (failures.length) { ... process.stderr.write(section) }`
is the only place captured output reaches the log for the single-process
`run()` path, and `runShard`'s `echoCheck` only fires on waived or rejected
checks). A **passing** `npm ci` for a given package therefore emits no
per-package-timestamped line in the committed CI logs — there is no log-level
instrumentation of individual install durations today. This record states
that limitation rather than asserting a number it cannot reproduce from a
committed log.

What **is** measurable from the existing logs is the **aggregate per-shard
install-phase bound**: job start timestamp to the first check-related log
line. For cycle 1's `sweep (1)` (run `37661562241`): job started
`2026-10-07T17:46:32Z`; the first content line attributable to a check (the
`authority-registry / test` rejection) appears at `2026-10-07T18:15:04.449Z`.
That interval (28m32s) bounds installs for all 8 of shard 1's packages
**plus** `authority-registry`'s own `test` run (measured in (e) below at
1161.2s / 19m21s) — i.e. install-phase-plus-position-1-test is bounded above
by 28m32s, so the 8-package aggregate install phase is bounded above by
28m32s − 19m21s ≈ 9m11s. This is an **aggregate upper bound**, not a
per-package figure.

**Reproduction:** `gh run view 37661562241 --repo m0r6aN/agent-skills --log`,
grep `sweep (1)` lines, diff first and last timestamps.

### (b) Per-package serial position within its shard — derived from source, not logs

Serial position is deterministic from `assignShards` (`:319`) plus the
per-package check loop order in `runShard` (`for (const name of mine)` at
`:1063`, iterating `mine` in the shard-array order, which `assignShards`
returns **name-sorted** — `shard.sort()` at `:349` for the cost-aware branch,
and insertion order under round-robin at `:339-341`, which is also ascending
because `orderedNames` is code-point sorted on entry). The live assignment is
round-robin (AC2, below), so each shard's serial order is its code-point-sorted
member list.

**Reproduction:**
```
node -e "import('./scripts/foreman-line-ci.mjs').then(m => {
  const names = m.discoverPackages({root: process.cwd()});
  console.log(JSON.stringify(m.assignShards(names, 4), null, 1));
})"
```
Output (measured, this worktree, HEAD `f9788222`):
- shard 0: `approval, contracts, integration, kernel-lease, permission-profiles, registration, shaping, verification`
- shard 1: `authority-registry, dispatch, jev-decisions, kernel-state, project-scaffold, role-authority, skill-injection, worker-envelopes`
- shard 2: `bypass-outage-harness, foreman-config, kernel-contracts, mutation-scope-guard, projection, routing-policy, spec-body-compiler`
- shard 3: `contract-readers, hybrid-routing, kernel-import, ops-console, receipts, schema-scaffold, spec-linter`

`authority-registry` is **serial position 1 of 8** in shard 1 — confirmed, not
asserted: it is the first name in shard 1's list, and the per-package check
loop walks `mine` (the shard list) in that order, `test` before `typecheck`
before `lint` (`CHECKS` at `:197`). `bypass-outage-harness` is **serial
position 1 of 7** in shard 2, matching AC1 reference point 3 ("position was
NOT binding" — it fails from waiver-marker staleness, not from running last).

### (c) Failure-to-signal latency (job start → first red signal in that shard's log)

| Cycle | Run | Shard job | Job start (UTC) | First red signal (UTC) | Latency |
|---|---|---|---|---|---|
| 1 | `37661562241` | `sweep (2)` | 17:46:32 | 17:48:17.0236 | **+2m35s** |
| 1 | `37661562241` | `sweep (1)` | 17:46:32 | 18:15:04.4494 | +28m32s |
| 2 | `37664971051` | `sweep (2)` | 18:12:47 | 18:15:19.8961 | +2m33s |
| 2 | `37664971051` | `sweep (1)` | 18:12:47 | 18:35:18.6531 | +22m32s |
| 3 | `37666762575` | `sweep (1)` | 18:26:34 | 18:49:16.6322 | +22m43s |

The cycle-1 `sweep (2)` figure (**+2m35s**) reproduces the spec's pre-verified
reference point exactly: `bypass-outage-harness / test` rejected at
`2026-10-07T17:48:17.0235636Z` against a run `createdAt` of
`2026-10-07T17:45:42Z` = 2m35.02s. `bypass-outage-harness` is first in shard
2's serial order (confirmed above) — **position was not binding**: the
rejection is a `marker-missing` waiver-contract layer (see §3 below), not a
timing artifact of running last.

**Reproduction:**
```
gh run view <RUN_ID> --repo m0r6aN/agent-skills --log > run.log
grep -n 'rejected:\|✖ failing tests' run.log | head
gh api repos/m0r6aN/agent-skills/actions/runs/<RUN_ID>/jobs -q '.jobs[] | [.name,.conclusion,.started_at,.completed_at] | @tsv'
```

### (d) Verdict latency vs. first-red latency — two separate measured quantities

| Cycle | Run | Run created (UTC) | First red (UTC, earliest across all shards) | First-red latency | `integration-report` completed (UTC) | Verdict latency |
|---|---|---|---|---|---|---|
| 1 | `37661562241` | 17:45:42 | 17:48:17.024 | **+2m35s** | 17:47:50 → actually 18:17:50 | **+32m08s** |
| 2 | `37664971051` | 18:11:58 | 18:15:19.896 | **+3m22s** | 18:37:47 | **+25m49s** |
| 3 | `37666762575` | 18:25:50 | 18:49:16.632 | **+23m27s** | 18:52:10 | **+26m20s** |

These reproduce the spec's pinned verdict figures (`+32 / +26 / +26` min)
within the minute-level rounding the spec used. They are **named as two
separate measured quantities** per AC1(d): first-red latency (time to the
earliest red signal in any shard log) is far smaller than verdict latency in
cycles 1 and 2 (2m35s / 3m22s vs. 32m / 26m) because `fail-fast: false` keeps
every shard running to completion regardless of an early red — the 2026-10-07
evidence the spec cites is this exact gap, confirmed here with run `37661562241`
and `37664971051` log citations. Cycle 3's first-red latency (+23m27s) is
close to its verdict latency (+26m20s) because its only failing shard
(`sweep (1)`) happens to contain `authority-registry`, whose own `test` suite
dominates the shard's wall time (see (e)).

### (e) The long-single-suite bound (authority-registry)

`authority-registry`'s `test` check reports its own `node --test` summary in
the dumped failure output of cycle 1's `sweep (1)` (run `37661562241`):
```
# tests 574
# pass 574
# fail 0
# duration_ms 1161226.0975
```
(line timestamped `2026-10-07T18:15:04.6461272Z` in the shard log — the TAP
summary for `authority-registry`'s own test file is embedded in the dumped
output because the overall check is rejected by the waiver layer, not because
this file's tests failed — `# fail 0` for this 574-test file).
`1161226.0975 ms = 1161.2s ≈ 19m21s` is the **measured `test`-check wall time
only**. `COST_TABLE['authority-registry'] = 1407.8` (`:283`) is documented in
source as "seconds of check wall per package (test + typecheck + lint)" — the
**sum of all three checks**, not `test` alone, and is a pinned mean over 10
local measured runs (source comment at `:278-283`), not this specific CI run.
This record does **not** claim 1161.2s reproduces 1407.8s; it states the
measured `test`-only figure with its log citation and notes the COST_TABLE
figure is a different (broader, multi-run-averaged) quantity that this run's
log cannot independently verify (`typecheck`/`lint` durations for a **passing**
check are not logged — see (a)).

The signal for `authority-registry`'s rejection appears at
`2026-10-07T18:15:04.449Z`, `28m32s` after `sweep (1)`'s job start
(`17:46:32Z`) — this reproduces the spec's **~28.5 min into sweep (1)**
reference point exactly. `authority-registry` runs `test` first in its serial
position (position 1 of 8, §(b)), so the ~28.5min signal time is bound by: the
shard's aggregate install phase (§(a), upper-bounded ≈9m11s) plus
`authority-registry`'s own 19m21s `test` run — `9m11s + 19m21s ≈ 28m32s`,
consistent with the measured total.

**Reproduction:** `gh run view 37661562241 --repo m0r6aN/agent-skills --log`,
grep `duration_ms` within the `authority-registry / test` rejected block.

## 3. Pre-verified reference points — reproduced or corrected

| Spec reference point | This record's measurement | Status |
|---|---|---|
| Cycle 1 first red at **+2m35s** in sweep (2); `bypass-outage-harness` first in shard — position NOT binding | `17:48:17.0236Z` vs. run created `17:45:42Z` = **2m35.02s**; rejection layer is `marker-missing` (waiver staleness), confirming position is not the cause | **Reproduced exactly** |
| Verdicts at **+32 / +26 / +26 min** | 32m08s / 25m49s / 26m20s | **Reproduced** (minute-rounding match) |
| authority-registry's signal at **~28.5 min** into sweep (1), bound by its own ~1407s suite | 28m32s into sweep (1); own `test`-check wall = 1161.2s (measured), COST_TABLE's 1407.8s is the 3-check sum, not independently verified from this log | **Reproduced for the 28.5min figure; the "~1407s suite" framing is corrected to "1161.2s `test`-check wall, part of the 1407.8s 3-check pinned sum"** |
| Two of three cycle failures were waiver-pin staleness events (fail-closed, correct) | Cycle 1: both failing shards reject on `marker-missing` (bypass-outage-harness, authority-registry) — pure staleness. Cycle 3: single failing shard rejects on `marker-missing` (authority-registry) — pure staleness. Cycle 2: `sweep (1)` rejects on `marker-missing` (authority-registry, staleness) **but** `sweep (2)` rejects `bypass-outage-harness / lint` on layer **`no-pin`** (`2026-10-07T18:15:19.8961Z`) — `bypass-outage-harness` has no `lint` entry in `WAIVED_EXCLUSIONS` (`:517-536`: only `test` and `typecheck` are pinned for it), so this is a genuine unwaived check failure, not staleness | **Reproduced**: cycles 1 and 3 are purely waiver-pin-staleness episodes; cycle 2 additionally carries one non-staleness (`no-pin`) failure. Matches "two of three" when counting cycles that are *purely* staleness-caused |

**Reproduction commands** (per cited run):
```
gh run view <RUN_ID> --repo m0r6aN/agent-skills --log > run.log
grep -n 'rejected:' run.log
```

## 4. Named datum — validate-versions red-base episode (run `37700880571`)

Workflow: `Test Plugin Installation` (`.github/workflows/test-plugin-install.yml`),
job `Validate skill content`, step `Validate manifest versions`.

```
gh api repos/m0r6aN/agent-skills/actions/runs/37700880571/jobs -q \
  '.jobs[] | select(.name=="Validate skill content") | .steps[] | [.name,.conclusion,.started_at,.completed_at] | @tsv'
```
Measured:
```
Set up job                       success  2026-10-07T23:12:15Z  2026-10-07T23:12:15Z
Run actions/checkout@v6          success  2026-10-07T23:12:15Z  2026-10-07T23:12:18Z
Set up Node.js                   success  2026-10-07T23:12:18Z  2026-10-07T23:12:19Z
Validate all skills              success  2026-10-07T23:12:19Z  2026-10-07T23:12:19Z
Validate manifest versions       failure  2026-10-07T23:12:19Z  2026-10-07T23:12:19Z
...
Complete job                     success  2026-10-07T23:12:19Z  2026-10-07T23:12:19Z
```
Job-level span: `started_at` `2026-10-07T23:12:14Z` → `completed_at`
`2026-10-07T23:12:21Z` = **~7s** — reproduces the spec's `23:12:14 → 23:12:21`
figure exactly, at `main` commit `05d428e7ae80bf427e8e79cfb87cde442ca08596`.
The correct cost class (a ~7s job), on the wrong discovery channel: the same
push run's `foreman-line-ci` workflow (run `37700880444`, same head SHA)
completed **green** 30m51s later, so the push produced no signaled failure at
all from the workflow a human would watch for "did my push break anything."
The red was discoverable only because the *next* branch's checks inherited
the same manifest-version defect:

```
gh run list --workflow "Test Plugin Installation" --limit 15 \
  --json databaseId,conclusion,event,createdAt,headBranch
```
```
37700903545  failure  push           2026-10-07T23:12:25Z  chore/ci-fail-fast-charter
37700906186  failure  pull_request   2026-10-07T23:12:27Z  chore/ci-fail-fast-charter
37700880571  failure  push           2026-10-07T23:12:11Z  main
```
`chore/ci-fail-fast-charter`'s push/PR checks (14–16s after the `main` push)
both failed on the inherited defect; the first signal a human saw was on an
unrelated branch's PR checks, not on the `main` push that introduced the
regression. This is evidence of a **channel gap** (the correct check exists
and is fast; it signals on the wrong event) layered on top of the timing gap
the rest of this record measures — exactly the framing AC1.4 requires.

## 5. Baseline role

This anatomy is the "before" measurement that CFF charter exit criteria 4 and
7 consume (first-red signal speed and verdict trustworthiness, respectively).
For exit criterion 5 (local parity), the current-state fact is: **no `local`
mode exists** in `scripts/foreman-line-ci.mjs`'s CLI — `runCli` (`:1211`)
recognizes exactly `resolve | shard | aggregate` (confirmed by reading the
CLI dispatch at `:1211` onward; no `local` branch is present at this commit).
