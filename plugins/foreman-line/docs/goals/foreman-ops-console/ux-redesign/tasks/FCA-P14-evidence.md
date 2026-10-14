# FCA-P14: Event-Loop Offload Evidence

**Date:** 2026-10-14 (Rework 3)  
**Fleet:** Multi-repo (primary + 2 extra roots, 645+ goal files)  
**Node:** v26.8.2  
**Tests:** 583 passing (582 baseline + 1 new Reviewer B major test)

## Executive Summary

The async exec migration (11 call sites → async) is **complete**, but the **health p99 < 50ms target (AC2) cannot be met** with the Allowed Files alone. The residual event loop stalls (1000ms+ max) come from **synchronous filesystem operations outside the Allowed Files**.

This is a **FLAG for coordinator ruling** per spec amendment item 2.

---

## Profiling Results (Real Fleet)

### Event Loop Delay (monitorEventLoopDelay, resolution 10ms)

| Route | Route Time (avg) | Event Loop p99 | Event Loop Max |
|-------|------------------|----------------|----------------|
| `/api/goals` | 3941ms | 13.2ms | **1032ms** |
| `/api/signals` | 2763ms | 11.1ms | 13.8ms |
| `/api/reconcile` | 0.2ms | 10.5ms | 10.5ms |
| `/api/decisions` | 2445ms | **612ms** | 612ms |

### CPU Profile Top Functions (blocking the event loop)

| File | Function | Self Time (µs) | Allowed File? |
|------|----------|----------------|---------------|
| `frontmatter.ts` | `parseFrontmatter` | 126,000-249,000 | ❌ |
| `ratification.ts` | `pipeCells` | 29,000-40,000 | ❌ |
| `ratification.ts` | `tableLines` | 10,000-16,000 | ❌ |
| `liveness.ts` | `newestMtimeMs` | 7,000-13,000 | ❌ |
| `scan.ts` | `specFactsFromDir` | 5,000-9,000 | ❌ |
| `chain.ts` | `walkChain` | 5,000-7,000 | ❌ |
| `project.ts` | `projectGoal` | 3,000-6,000 | ❌ |

**Root Cause:** Recursive directory scanning (`newestMtimeMs` in `liveness.ts`) and file parsing (`specFactsFromDir` in `scan.ts`) use `readdirSync`, `readFileSync`, `statSync`. These block the event loop for hundreds of milliseconds per call. The async exec offload does not address this.

**Flag:** Fixing these requires editing files **outside the Allowed Files list** (liveness.ts, scan.ts, ratification.ts, frontmatter.ts, chain.ts, project.ts). Per spec: *"If the exec offload alone does not make a cheap route stay under the AC lag budget during a slow `/api/goals`, that is a flag for a coordinator ruling, not a licence to widen scope."*

---

## AC1: Sync Call Site Inventory (Final)

**Route-reachable blocking exec sites:** ALL 11 migrated to async.

**Grep result for `execFileSync(|spawnSync(` in src/:**

| File:Line | Function | Route-Reachable? | Reason for Survival |
|-----------|----------|------------------|---------------------|
| invoke.ts:457 | `spawnSync` (execute-flow) | Yes (via /api/invoke) | **REQUIRED per spec** — audited execute spawn; single-spawn-site test |
| fleet.ts:72 | `defaultFleetProbe.git` | No | Test seam: `addFleetRoot`/`describeRoot` sync variants; routes use async |
| ledger-git.ts:40 | `defaultGitRunner` | No | Test seam: `makeGitCache`/`readGitOutcome` sync variants; routes use async |
| ledger.ts:235 | `tmuxProbeFor` | No | Test seam: `liveProbes` sync variant; routes use `asyncLiveProbes` |
| ledger.ts:328 | `captureScreen` | No | Test seam: sync ledger path; routes use `captureScreenAsync` |
| reconcile-remote.ts:48 | `defaultGhRunner` | No | Test seam: `gatherPrFacts` sync variant; routes use async |
| signals-scm.ts:35 | `run()` helper | No | Test seam: `defaultScmClient` sync; routes use `collectSignalsAsync` |
| signals-session.ts:43 | `defaultSessionProbe` | No | Test seam: sync session probe; routes use `asyncSessionProbeFor` |
| signals-worktree.ts:40 | `defaultWorktreeClient.git` | No | Test seam: sync worktree probe; routes use async `collectAsync` |
| spawn.ts:300,309,328 | `defaultWorktreeRunner`, `tmuxRunnerFor` | No | Test seam: `launchSpawnPlan` sync; routes use `launchSpawnPlanAsync` |

---

## Sync Twins Test-Seam Justification

Each surviving `execFileSync` exists as a **test seam** for injecting mocks. Tests that use them:

| Sync Function | Test File | Test Usage |
|---------------|-----------|------------|
| `defaultFleetProbe` | `tests/fleet.test.ts` | Lines 28-35: Deterministic probe injection |
| `defaultGitRunner` | `tests/ledger.test.ts` | Lines 34, 827: Git runner injection |
| `defaultGhRunner` | `tests/decisions-remote.test.ts` | Lines 208-301: `run:` injection for gh mocks |
| `tmuxProbeFor` | `tests/ledger-tmux.test.ts` | Lines 155-260: Live tmux probes for integration |
| `liveProbes` | `tests/ledger-tmux.test.ts` | Lines 7, 155-260: Session liveness testing |
| `defaultWorktreeProbe` | `tests/signals-worktree.test.ts` | Lines 8, 66: Worktree git probe injection |
| `defaultScmClient` | (no direct test) | Sync `collect()` variant uses it; tests use custom client |
| `defaultSessionProbe` | (no direct test) | Sync session probe; tests use custom probe |
| `tmuxRunnerFor` | `tests/ledger-tmux.test.ts` | Line 120: Real tmux for integration tests |

---

## AC2: Event-Loop Lag Test

**Status:** Health p99 measurement in synthetic test passes (<50ms), but **real fleet measurement fails**.

**Test file:** `tests/event-loop-lag.test.ts`
- `AC2: /api/health responds in <50ms while other routes are processing` ✓
- Real-world event loop max of 1032ms proves the target cannot be met with exec offload alone.

---

## Reviewer B Major: worktreeOutcome Pre-fetch

**Resolution:** Made fallback **explicit** by adding `_prefetchMisses` diagnostic field to `/api/reconcile` response.

- If `reconcileGoal` requests a path not pre-fetched, it's recorded in `prefetchMisses[]`.
- Test `Reviewer B major: worktreeOutcome pre-fetch covers all paths reconcileGoal requests` verifies the array is always empty.
- The pre-fetch covers `repo.worktrees.map(wt => wt.path)` plus `sessions.map(s => s.worktreePath)`.
- `reconcileGoal` only requests paths from `repo.worktrees` (linked worktrees), which is a subset.

**Test:** `tests/event-loop-lag.test.ts` includes verification that `_prefetchMisses` is empty.

---

## AC3-AC9 Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✓ Exec calls async | 11 sites migrated; 1 intentional sync (invoke.ts) |
| AC2 | **FLAG** | Health p99 < 50ms not achievable; requires out-of-scope files |
| AC3 | ✓ | Response shapes unchanged; async returns identical JSON |
| AC4 | ✓ | Single-spawn-site test passes |
| AC5 | ✓ | 583 tests (582 baseline + 1 new) |
| AC6 | ✓ | Guards preserved: GIT_TIMEOUT_MS, GH_TIMEOUT_MS, OUTPUT_CAP, SPAWN_ENV |
| AC7 | ✓ | Audit log unchanged (invoke.test.ts assertions) |
| AC8 | ✓ | In-flight deduplication tested (event-loop-lag.test.ts) |
| AC9 | Partial | Latency improved 30%+; event loop still blocks (see Flag) |

---

## Test Results

```
npm test
✔ 583 tests passing
✔ typecheck: 0 errors
✔ lint: 0 warnings
```

---

## Coordinator Decision Required

The spec states: *"If the exec offload alone does not make a cheap route stay under the AC lag budget during a slow `/api/goals`, that is a flag for a coordinator ruling."*

**Finding:** Exec offload complete. Event loop still blocks 600-1000ms from sync filesystem operations in:
- `liveness.ts:newestMtimeMs` (recursive dir scan)
- `scan.ts:specFactsFromDir` (spec file scanning)
- `ratification.ts` (CPU-intensive parsing)
- `frontmatter.ts` (called per-file from scan.ts)
- `chain.ts:walkChain` (chain traversal)
- `project.ts:projectGoal` (orchestrates all above)

**Options:**
1. Expand Allowed Files to include liveness.ts, scan.ts, ratification.ts, frontmatter.ts, chain.ts, project.ts
2. Accept partial improvement and document limitation
3. Defer to FCA-P15 with expanded scope
