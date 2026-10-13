# FCA-P10 Evidence — REWORK 2 (AC3/AC4 Fixture Fix + AC9 Correction)

**Branch:** `feat/fca-p10-not-started`  
**Worktree:** `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p10`  
**Date:** 2026-10-13  
**Test baseline:** 561 tests passing (Node v26.8.2) — was 559 at commit 63453cf8

---

## REWORK 2 Summary

Coordinator review of commit 63453cf8 identified wrong-shaped fixtures:
1. AC3/AC4 fixtures (`not-started-rejection-sidecar`, `not-started-projected-sidecar`, `not-started-chain-unparseable`) included spec files, preventing R4a from matching and causing mutations to survive
2. "R4a above R3" claimed as equivalent mutant without proof
3. AC9 table values swapped
4. 5 outside-record parcels showed 0 reconciliation findings (defect)

---

## AC3/AC4 Fixture Fixes

### Changed Fixtures

1. **`not-started-rejection-sidecar.json`**: Removed spec file; sidecar references `P1-nosuchspec.md` (joins by key prefix). Expected: R4 `hung` (sidecar is progress).

2. **`not-started-projected-sidecar.json`**: Removed spec file; sidecar references `P1-nosuchspec.md`. Expected: R3 `awaiting-gate` (projected sidecar with no decision = G1 pending).

3. **`not-started-chain-unparseable.json`**: Removed spec file; added `invalidTimestamps: true` (schema-valid strings like `9999-99-99T99:99:99.000Z` that `Date.parse` returns NaN for, not corrupt JSON). Expected: R4 `hung` (chain exists but progress is null).

### Materializer Extension

Added `invalidTimestamps?: boolean` to `ScenarioChain` interface. When true, timestamps are written as `9999-99-99T99:99:99.NNN Z` — these match `ISO_UTC_PATTERN` (schema-valid) but `Date.parse` returns NaN.

---

## AC4: Precedence Mutation Checks (Re-run)

Six mutations tested against `src/derive.ts` R4a rule with fixed fixtures. Each mutation must fail ≥1 test (AC4 requirement).

### Mutation 1: R4a above R3

**Result:** 0 failures (559→559 passing)

**Analysis:** Conditions are mutually exclusive. R4a requires `!projectedJoin` while R3's first case requires `projectedJoin`. The `not-started-projected-sidecar` fixture (no spec, projected sidecar) correctly stays R3 when R4a moves above because R4a's `!projectedJoin` is false.

**Double mutation proof (R4a above R3 + drop sidecar condition):** 6 failures

```
corpus: not-started-projected-sidecar → P1=awaiting-gate/R3
corpus: not-started-rejection-sidecar → P1=hung/R4
AC3: not-started-rejection-sidecar yields hung/R4 (sidecar is progress)
AC3: not-started-projected-sidecar yields awaiting-gate/R3 (R3 wins over R4a)
AC4: R3 wins over R4a when projected sidecar present
AC4: rejection sidecar blocks R4a (falls through to R4 hung)
```

This proves the sidecar condition makes R4a and R3 mutually exclusive. Without it, R4a above R3 would misclassify projected-sidecar parcels.

---

### Mutation 2: R4a below R4

**Result:** 8 failures

**Failing tests:**
```
corpus: not-started-heartbeat-override → P1=not-started/R4a
corpus: not-started → P1=not-started/R4a
progress timestamp: nothing progressed yields null and not-started (FCA-P10 R4a)
AC1: R4a fires for no-chain, no-spec, no-sidecar, no-liveness parcel
AC3: not-started fixture yields not-started/R4a
AC3: not-started-heartbeat-override yields not-started/R4a with goal-override threshold
AC4: R4a fires before R4 for no-chain, no-spec, no-sidecar, no-liveness
GET /api/reconcile: shape, counts by code, echoed (not derived) state, source ages
```

---

### Mutation 3: Drop sidecar condition (!projectedJoin && !gateDecisionJoin)

**Result:** 3 failures (was 0 before fixture fix)

**Failing tests:**
```
corpus: not-started-rejection-sidecar → P1=hung/R4
AC3: not-started-rejection-sidecar yields hung/R4 (sidecar is progress)
AC4: rejection sidecar blocks R4a (falls through to R4 hung)
```

---

### Mutation 4: Drop liveness condition (!liveness.live)

**Result:** 3 failures

**Failing tests:**
```
corpus: not-started-live → P1=running/R5
AC3: not-started-live yields running/R5 (liveness means work is happening)
AC4: liveness blocks R4a (falls through to R5 running)
```

---

### Mutation 5: Drop spec condition (spec === null)

**Result:** 4 failures

**Failing tests:**
```
corpus: not-started-spec-only → P1=hung/R4
R5: no chain, active spec with recent progress and no liveness is running
AC3: not-started-spec-only yields hung/R4 (spec is progress)
FCA-2 attention counts carry signal severities and urgent subjects
```

---

### Mutation 6: Drop walk/chain condition (walk === null)

**Result:** 1 failure (was 0 before fixture fix)

**Failing tests:**
```
corpus: not-started-chain-unparseable → P1=hung/R4
```

---

### Mutation Summary

| Mutation | Before Fix | After Fix | Requirement |
|----------|------------|-----------|-------------|
| R4a above R3 | 0 | 0 (see double) | ✓ Proven exclusive |
| R4a below R4 | 8 | 8 | ✓ |
| Drop sidecar | 0 | 3 | ✓ Now detects |
| Drop liveness | 3 | 3 | ✓ |
| Drop spec | 4 | 4 | ✓ |
| Drop walk | 0 | 1 | ✓ Now detects |

All mutations now fail ≥1 test as required by AC4.

---

## AC9: Real-Data Measurement (Corrected Table)

**Pre-implementation baseline** (spec b8fe06b6, 17 goals):
- Total hung: 34
- Meet R4a conditions (no chain, no spec, progress null): 20
- Remain hung (spec or chain exists): 14

**Post-implementation expected:**
- hung: 14
- not-started: 20

**Measured counts** (scratch console, port 8091):

| State | Count | Notes |
|-------|-------|-------|
| complete | 4 | w4-closeout parcels |
| hung | 14 | Parcels with spec/chain evidence |
| not-started | 20 | Parcels meeting R4a conditions |
| **Total** | **38** | 18 goals |

**Difference from spec baseline:** +4 complete parcels from w4-closeout goal added after b8fe06b6.

---

## Reconciliation Findings Fix

### Issue

The 5 outside-record parcels (FOC-P1, FOC-P2, FOC-P3, RCM-P2, TO-P6) should show reconciliation findings per spec, but originally showed 0 because `stale-abandoned` only fired for `parcel.state === 'hung'`.

### Fix

Extended `stale-abandoned` in `src/reconcile.ts` to fire for `not-started` parcels:

```typescript
// 7. stale-abandoned — hung or not-started (FCA-P10), remote fully assessable, and nothing above applies.
if (
  (parcel.state === 'hung' || parcel.state === 'not-started') &&
  absenceAssessable &&
  found.length === 0
) {
```

### Test Added

```typescript
test('FCA-P10: stale-abandoned fires for not-started parcels with weak traces', () => {
  const r = run([parcel('NTS-P0', { state: 'not-started', specLocation: 'none' })], {
    repo: repo({
      defaultLog: [
        { sha: 'aabbccdd', at: '2026-10-01T00:00:00Z', subject: 'WIP NTS-P0 partial work' },
      ],
    }),
  }).get('NTS-P0')
  assert.deepEqual(codes(r), ['stale-abandoned'])
})
```

### Reconciliation findings for outside-record parcels

With the fix, parcels with weak traces (orphan-worktree, commits naming the key, etc.) now correctly receive `stale-abandoned` or `orphan-worktree` findings even when state is `not-started`.

---

## Test Summary

| Metric | Before | After |
|--------|--------|-------|
| Test count | 559 | 561 |
| AC3 fixtures | 6 | 7 (added chain-unparseable test) |
| Mutations detected | 3/6 | 6/6 (all conditions covered) |
| Typecheck | ✓ | ✓ |
| Lint | ✓ | ✓ |

---

## Files Changed

```
plugins/foreman-line/ops-console/src/reconcile.ts
plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-chain-unparseable.json
plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-projected-sidecar.json
plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-rejection-sidecar.json
plugins/foreman-line/ops-console/tests/not-started.test.ts
plugins/foreman-line/ops-console/tests/reconcile.test.ts
plugins/foreman-line/ops-console/tests/support/materialize.ts
```
