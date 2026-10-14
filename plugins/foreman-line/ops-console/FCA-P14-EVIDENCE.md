# FCA-P14 Event-Loop Offload — Evidence File

## Rework 2 — 2026-10-14

### AC1: Sync Call Site Inventory

**Route-reachable blocking exec sites:** ALL migrated to async.

The production routes `/api/reconcile`, `/api/spawn`, `/api/decisions`, `/api/signals`, 
`/api/goals`, `/api/spawns`, and `/api/fleet/add` now use exclusively async implementations.

**Final grep of `execFileSync(|spawnSync(` in src:**

| File:Line | Function | Route-Reachable? | Reason for Survival |
|-----------|----------|------------------|---------------------|
| invoke.ts:457 | spawnSync in execute-flow | Yes (via /api/invoke) | REQUIRED per spec — audited execute spawn; single-spawn-site test |
| fleet.ts:72 | defaultFleetProbe.git | No | Test seam for `addFleetRoot`/`describeRoot` sync variants; routes use `addFleetRootAsync`/`describeRootAsync` |
| ledger-git.ts:40 | defaultGitRunner | No | Test seam for `makeGitCache`/`readGitOutcome` sync variants; routes use async variants |
| ledger.ts:235 | tmuxProbeFor | No | Test seam for `liveProbes` sync variant; routes use `asyncLiveProbes` |
| ledger.ts:328 | captureScreen | No | Test seam for sync ledger path; routes use `captureScreenAsync` |
| reconcile-remote.ts:48 | defaultGhRunner | No | Test seam for `gatherPrFacts`/`gatherOpenPrs` sync variants; routes use async variants |
| signals-scm.ts:35 | run() helper | No | Test seam for `defaultScmClient` sync variant; routes use `collectSignalsAsync` → async providers |
| signals-session.ts:43 | defaultSessionProbe | No | Test seam for sync session probe; routes use `asyncSessionProbeFor` |
| signals-worktree.ts:40 | defaultWorktreeClient.git | No | Test seam for sync worktree probe; routes use async `worktreeHygieneProvider.collectAsync` |
| spawn.ts:300,309,328 | defaultWorktreeRunner, tmuxRunnerFor | No | Test seam for `launchSpawnPlan` sync variant; routes use `launchSpawnPlanAsync` |

### AC2: Event-loop-lag test

Test file: `tests/event-loop-lag.test.ts`
- `AC2: /api/health responds in <50ms while other routes are processing (async offload)`
- Tests verify health endpoint remains responsive during concurrent requests

### AC3: Response JSON unchanged

The async implementations preserve byte-identical JSON output. Route handlers return 
identical response shapes; only the internal execution is non-blocking.

### AC4: Single-spawn-site test

Test file: `tests/invoke.test.ts:382-385`
```
const spawns = text.match(/spawnSync\(/g) ?? []
assert.match(text, /flow\.mode === 'present'[\s\S]*?return outcome[\s\S]*?spawnSync\(/)
assert.doesNotMatch(text, /spawnSync\(\s*['"](gh|git)['"]/)
```
The test continues to pass — invoke.ts contains exactly one spawnSync.

### AC5: Test count

Before: 577 tests
After: 582 tests (+5 new FCA-P14 tests)

### AC6: Guards unchanged

Existing timeouts (GIT_TIMEOUT_MS, GH_TIMEOUT_MS), buffer caps (GIT_MAX_BUFFER, OUTPUT_CAP), 
SPAWN_ENV, and typed argv validators are preserved. New async wrappers honour them exactly.

### AC7: Audit log unchanged

The `/api/invoke` execute flows write identical audit entries. `launchSpawnPlanAsync` 
writes byte-identical audit entries as `launchSpawnPlan`.

### AC8: In-flight deduplication

Test file: `tests/event-loop-lag.test.ts`
- `AC8 negative control: disabling dedup causes separate collections` — verifies noDedup=true runs separate collections
- `AC8: concurrent signal requests share one underlying collection via dedup` — verifies concurrent requests share the same promise

Implementation: `signals.ts` — `signalsInFlight` Map with in-flight promise sharing.

### AC9: Measured before/after

Fleet: 645 goal files across `/home/cmorgan76/Repos` and `/home/cmorgan76/Repos/agent-skills-worktrees`

(Measurement to be completed on real fleet)

### New Tests Added

1. `AC8 negative control: disabling dedup causes separate collections`
2. `AC8: concurrent signal requests share one underlying collection via dedup`
3. `signal ordering is independent of provider completion order`
4. `guard negative control: assertReadOnlyGh rejects mutating verbs`
5. `guard negative control: guardedGhAsync wraps and enforces read-only`

### Sync Twin Cleanup

The following sync functions are KEPT because they serve as test seams:

- `buildDecisions` (decisions.ts) — tests call it directly with mock gh/git
- `gatherPrFacts`, `gatherOpenPrs`, `gatherAnnotation` (reconcile-remote.ts, decisions-remote.ts) — tests use sync mocks
- `launchSpawnPlan` (spawn.ts) — tests use sync mock runners
- `liveProbes`, `ledgerEntries` (ledger.ts) — tests use sync probes
- `gatherRepoFacts` (reconcile-git.ts) — tests use sync git runner
- `defaultGitRunner`, `defaultGhRunner`, `defaultWorktreeRunner`, `tmuxRunnerFor` — test injection points

### Route → Async Implementation Mapping

| Route | Async Functions Used |
|-------|---------------------|
| /api/goals | collectSignalsAsync |
| /api/signals | collectSignalsAsync |
| /api/reconcile | gatherRepoFactsAsync, gatherPrFactsAsync, ledgerEntriesAsync, asyncLiveProbes, readGitOutcomeAsync |
| /api/spawn | launchSpawnPlanAsync (→ defaultAsyncWorktreeRunner, asyncTmuxRunnerFor) |
| /api/spawns | ledgerEntriesAsync, asyncLiveProbes, asyncSessionProbeFor |
| /api/decisions | buildDecisionsAsync (→ gatherOpenPrsAsync, gatherAnnotationAsync, guardedGhAsync) |
| /api/fleet/add | addFleetRootAsync (→ async git probe) |
| /api/fleet | describeRootAsync |
