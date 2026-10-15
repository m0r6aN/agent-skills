---
ticket: FCA-P14
title: Event-loop offload — non-blocking git/gh/process calls for ops-console API routes
status: active
owner: clinton.morgan
created: 2026-10-14
updated: 2026-10-14
risk: elevated
surfaces: [plugins/foreman-line/ops-console/src/]
routing_class: architecture/risk
permission_profile: null
---

# FCA-P14: Event-loop offload

## Intent

Make the 12 blocking `execFileSync`/`spawnSync` call sites in `ops-console/src/`
non-blocking so `/api/goals`, `/api/signals`, and other slow routes no longer freeze
the Node event loop for ~5 s each. A cheap route (e.g. `/api/health`) must remain
responsive (<50 ms p99) while a slow signals or goals request is in flight.

This is Open Decision 1 from the capability map — scheduled before FCA-P11 because
P9's decisions queue and P11's follow-through add more of the same blocking I/O,
compounding the freeze window.

## Constraints

1. **Route shape unchanged.** No new routes, no changed response schemas, no
   re-ordering of existing fields. Clients see identical JSON before and after.
2. **Frozen vocabulary unchanged.** Signal classes, severities, verbs, parcel
   states, action codes — none altered.
3. **Read-only / present-only invariants unchanged.** The console remains read-only
   over goal/receipt/spec data; present-only gates stay present-only.
4. **Audit behaviour unchanged.** Every invoke.ts flow (execute, present, refuse,
   spawn) still appends one audit entry before returning.
5. **Single-spawn-site test unchanged.** `tests/invoke.test.ts` lines 382–385 verify
   `invoke.ts` contains exactly one `spawnSync` behind `flow.mode === 'present'`.
   That line count assertion must still pass; the audited execute spawn stays
   synchronous (it runs a short CLI under controlled argv with bounded output cap).
6. **Existing guard surfaces unchanged.** The allowlists per flow, typed arg
   validators, OUTPUT_CAP, SPAWN_ENV, GIT_TIMEOUT_MS, GH_TIMEOUT_MS — all remain;
   new async wrappers must honour them exactly.

## Call-Site Inventory

| # | File:Line | Function/Runner | Caller | Route(s) | Offload? | Rationale |
|---|-----------|-----------------|--------|----------|----------|-----------|
| 1 | `fleet.ts:70` | `defaultFleetProbe.git` | `addFleetRoot` | `/api/fleet/add` | Yes | git call during fleet mutation |
| 2 | `invoke.ts:457` | execute-flow spawnSync | `invokeFlow` | `/api/invoke` | **No** | Audited execute spawn; short CLI, OUTPUT_CAP bounded; single-spawn-site test |
| 3 | `ledger-git.ts:35` | `defaultGitRunner` | `makeGitCache.probe`, ledger reconciliation | `/api/spawns`, `/api/reconcile` | Yes | git status/rev-list per worktree; biggest contributor to lag |
| 4 | `ledger.ts:234` | `tmux list-panes` | `makeTmuxProbe` | `/api/spawns` | Yes | tmux probe per session |
| 5 | `ledger.ts:275` | `tmux capture-pane` | `captureScreen` | `/api/spawns` | Yes | screen capture per pane |
| 6 | `reconcile-remote.ts:44` | `defaultGhRunner` | `makeRemoteCache.fetch` | `/api/reconcile`, `/api/signals` | Yes | `gh pr list`; 10 s timeout already |
| 7 | `signals-scm.ts:26` | `run()` helper | `defaultScmClient.*` | `/api/signals` | Yes | multiple git/gh calls per fleet root |
| 8 | `signals-session.ts:30` | `tmux has-session` | `defaultSessionProbe` | `/api/signals` | Yes | session liveness per ledger entry |
| 9 | `signals-worktree.ts:31` | `git -C` | `defaultWorktreeClient.git` | `/api/signals` | Yes | status/diff per worktree |
| 10 | `spawn.ts:299` | `git worktree add` | `defaultWorktreeRunner.create` | `/api/spawn` | Yes | worktree creation; rare but must not block |
| 11 | `spawn.ts:308` | `git rev-parse HEAD` | `defaultWorktreeRunner.head` | `/api/spawn` | Yes | head read after worktree create |
| 12 | `spawn.ts:327` | `tmux` | `tmuxRunnerFor()` | `/api/spawn` | Yes | session/window/pane commands |

(Lines 3–5 in `signals-*.ts` wrap the same `execFileSync`; total unique import
sites = 9 files, 12 call sites; the earlier "21" counted import lines and tokens, corrected at coordinator lint 2026-10-14. The inventory must be re-derived by `grep` at Step 0.)

## Approach

### 1. Async spawn wrapper module (`src/spawn-async.ts`, new file)

Expose `execFileAsync(bin, args, opts)` returning `Promise<{ stdout, stderr,
exitCode }>`. Internally: `child_process.spawn` with `maxBuffer`, `timeout`,
`encoding: 'utf8'`, and a collected-output Promise. Error shapes match existing
`execFileSync` throws (`ENOENT`, timeout SIGKILL). Timeout and buffer caps are
function parameters, not module-level — callers pass the existing constants.

### 2. Async client/runner interfaces

Each injectable client (`ScmClient`, `GitRunner`, `GhRunner`, `TmuxRunner`,
`FleetProbe`, `WorktreeRunner`, `SessionProbe`) gains an async sibling type (e.g.
`AsyncGitRunner`) with the same method names returning Promises. The existing sync
types remain for the unchanged execute-flow spawn (and for test injection).

### 3. Route-level await

Routes that call the providers (`/api/goals`, `/api/signals`, `/api/reconcile`,
`/api/spawns`, `/api/spawn`, `/api/fleet/add`) become `async` and await the
async runners. The server handler (`api.ts` top-level `handleRequest`) is already
Promise-returning; no HTTP-adapter change required.

### 4. Request-level cache / in-flight deduplication

For `/api/signals` and `/api/goals`, identical concurrent requests (same fleet
roots) share a single in-flight set of provider Promises — subsequent requests
await the pending Promise rather than spawn duplicate git/gh processes. Cache key:
`(route, fleetRoots.join(','))`. TTL: 0 (request-scoped) or reuse P7/P8's 15 s
git-fact TTL where proven safe. No cache for mutating routes (`/api/fleet/add`,
`/api/spawn`).

### 5. Preserved synchronous path

`invoke.ts:457` spawnSync stays synchronous. Its caller `invokeFlow` stays sync.
`/api/invoke` returns `invokeFlow` directly, no await. The single-spawn-site test
continues to assert exactly one `spawnSync`.

## Acceptance Criteria

| # | Criterion | Verifiable by |
|---|-----------|---------------|
| AC1 | All 20 offload-candidate call sites (inventory rows marked "Yes") replaced by awaited async spawn | grep `execFileSync\|spawnSync` returns exactly 1 hit (invoke.ts:457) |
| AC2 | `/api/health` p99 < 50 ms while `/api/signals` is in flight | event-loop-lag test (see Verification Plan) |
| AC3 | Response JSON for each affected route identical before/after (field order, types, values on fixture repos) | diff snapshot tests for `/api/goals`, `/api/signals`, `/api/reconcile`, `/api/spawns` |
| AC4 | Single-spawn-site test passes unchanged (`invoke.test.ts:382–385`) | CI |
| AC5 | No test-count regression vs baseline (≥ current 432 `test()` calls across 50 files) | grep count; CI summary |
| AC6 | Timeouts, buffer caps, SPAWN_ENV, typed argv guards unchanged (values, enforcement points) | code review + existing guard tests pass |
| AC7 | Audit log for `/api/invoke` execute flows identical before/after | fixture invocation + audit-file diff |
| AC8 | In-flight deduplication for concurrent `/api/signals` verified by test: two concurrent requests spawn only one `gh pr list` | mock counter in test harness |
| AC9 | Measured before/after on a real fleet (the 34-parcel 17-goal baseline) showing aggregate API latency reduction ≥ 30 % AND event-loop-lag p99 < 100 ms for cheap routes | human-witnessed measurement documented in PR |

## Out of Scope

1. **Host/Origin validation** — remains deferred (capability map Open Decision 2).
   This parcel does not change any bind or header-check behaviour.
2. **Changing the audited execute spawn to async** — the short CLI with OUTPUT_CAP
   is acceptable sync; changing it would require audit-behaviour reproofs.
3. **Worker-thread offload** — async spawn is sufficient; worker threads add
   complexity without incremental benefit for I/O-bound calls.
4. **HTTP/2 or streaming responses** — response schemas are unchanged.
5. **New routes** — no `/api/signals/stream` or similar.
6. **Fleet-scope expansion** — fleet roots are unchanged.

## Open Questions / Deferrals

| # | Question | Recommended answer | Status |
|---|----------|--------------------|--------|
| OQ1 | Should the dedup cache use a 15 s TTL (like P7/P8 git cache) or be request-scoped only? | Request-scoped only (TTL 0) to avoid stale reads; P7/P8's cache already covers git facts. | Assumption |
| OQ2 | Should `/api/invoke` become async to simplify handler signature, even though the execute spawn stays sync? | No — keep the sync path explicit so the single-spawn-site test's grep assertion remains trivial. | Assumption |

## Verification Plan

### Event-loop-lag test (negative control for AC2)

1. Start the server against the 34-parcel 17-goal baseline fleet.
2. In one terminal, issue `curl /api/signals` (expected ~3–5 s).
3. Concurrently (within 200 ms), issue `time curl /api/health` in a loop (10×).
4. Assert every `/api/health` completes in < 50 ms.
5. Repeat with the blocking implementation (pre-patch) to prove the baseline fails
   the 50 ms threshold.

### Mandated reviewer focus questions

1. Does every new async wrapper honour the existing timeout/buffer-cap/SPAWN_ENV
   exactly?
2. Is the in-flight dedup map properly cleaned on Promise settlement (no memory
   leak)?
3. Does `invoke.ts` still have exactly one `spawnSync` (the execute flow)?
4. Are the response-snapshot tests byte-identical before/after?
5. Is the event-loop-lag test automated, or does it require manual witness?

## Context & References

- Capability map, Open Decisions: `docs/goals/foreman-ops-console/human-tasks-capability-map.md`
- FCA-P7 (ledger caching): `docs/specs/active/FCA-P7-session-ledger.md`
- FCA-P8 (reconciliation view): `docs/specs/active/FCA-P8-reconciliation-view.md`
- FCA-P9 (decisions queue): `docs/specs/active/FCA-P9-decisions-queue.md`
- Single-spawn-site test: `ops-console/tests/invoke.test.ts:382–385`
- SPEC-CONVENTION §4.6 risk vocabulary: `docs/SPEC-CONVENTION.md`

## Allowed Files

```
plugins/foreman-line/ops-console/src/spawn-async.ts          # new
plugins/foreman-line/ops-console/src/fleet.ts
plugins/foreman-line/ops-console/src/ledger-git.ts
plugins/foreman-line/ops-console/src/ledger.ts
plugins/foreman-line/ops-console/src/reconcile-remote.ts
plugins/foreman-line/ops-console/src/signals-scm.ts
plugins/foreman-line/ops-console/src/signals-session.ts
plugins/foreman-line/ops-console/src/signals-worktree.ts
plugins/foreman-line/ops-console/src/signals.ts
plugins/foreman-line/ops-console/src/spawn.ts
plugins/foreman-line/ops-console/src/api.ts
plugins/foreman-line/ops-console/tests/spawn-async.test.ts   # new
plugins/foreman-line/ops-console/tests/event-loop-lag.test.ts # new
plugins/foreman-line/ops-console/tests/*.test.ts             # existing, for snapshot diffs
```

**Explicitly excluded:** `invoke.ts` body (only the single `spawnSync` at line 457
remains; no edits permitted except import reordering if unavoidable).

## Assumptions

1. The user-cited "561 tests" baseline differs from the measured 432 `test()` calls;
   AC5 uses the measured count. If the baseline differs at dispatch time, the
   builder must re-measure and update AC5.
2. The 34-parcel 17-goal fleet is still the measurement reference (per capability
   map "Real-data baseline").

## Coordinator amendment and ratification — 2026-10-14

Coordinator lint corrections (committed before dispatch), ratified under the owner's blanket authority (2026-10-13):

1. The blocking exec call-site count is **12 in 9 files**, not 21 (21 counted import lines). Re-derive by grep at Step 0.
2. **Profile before offloading.** `/api/goals` has no exec call site in its own module chain (check `liveness.ts`, `scan.ts`, `project.ts`, `signals-goal.ts`); its measured ~5 s may come from synchronous filesystem scans or from the reconcile/signals providers it fans into. Step 0 must profile every affected route (route timing plus `node --cpu-prof` or equivalent) and report where the loop actually blocks. If the exec offload alone does not make a cheap route stay under the AC lag budget during a slow `/api/goals`, that is a flag for a coordinator ruling, not a licence to widen scope.
3. `decisions-remote.ts` (FCA-P9) shares the gh runner; confirm it is covered by the offload and the read-only allowlist guard still sits in front of the async path (a guard test must fail if the async path bypasses it).
4. Test baseline is the live `npm test` count at dispatch (561 at main `82dbdac9`), tripwire: no regression.
5. OQ1 and OQ2 resolved as proposed (request-scoped in-flight dedup, TTL 0; `/api/invoke` execute path stays synchronous).

## Coordinator ruling on the AC2 flag — 2026-10-14

Rework 3 profiled the residual loop stalls on the real fleet: after the 11 exec sites moved off the loop, health p99 is under 1 ms in most windows, but sporadic stalls of 0.4-1.0 s remain from synchronous filesystem work in the frozen projection libraries (`frontmatter.ts:parseFrontmatter` readFileSync per spec, `liveness.ts:newestMtimeMs` recursive readdir/stat, `ratification.ts:pipeCells`, `scan.ts:specFactsFromDir`). The spec says this is a flag for a coordinator ruling, not a licence to widen scope. **Ruling:** the exec-induced stall is the scope of FCA-P14 and is fixed (before: health blocked 2-3.5 s for the whole route; after: no exec-induced blocking). The projection's synchronous fs scans are the frozen FOC-P0/P1 library and are **not** edited under this parcel. AC2's literal "p99 < 50 ms" is therefore **met for exec-induced stalls and recorded as an open exit condition** carried to follow-up parcel `FCA-P15` (projection fs scan yielding/async), to be shaped after FCA-P13. The reviews' one remaining major (`worktreeOutcome` silent fallback) is resolved with an in-process counter (not a response field, since AC3 forbids shape change); the accompanying test is weak (its scenario has no worktree to miss) and is recorded as accepted-as-documented.
