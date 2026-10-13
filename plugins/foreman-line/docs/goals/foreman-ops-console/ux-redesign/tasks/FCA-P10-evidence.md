# FCA-P10 Evidence — AC4 Mutation Testing + AC9 Real-Data Measurement

**Branch:** `feat/fca-p10-not-started`  
**Worktree:** `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p10`  
**Date:** 2026-10-13  
**Test baseline:** 559 tests passing (Node v26.8.2)

---

## AC4: Precedence Mutation Checks

Six mutations were applied to `src/derive.ts`, the suite was run for each, failing test names recorded, and the file restored to clean state after each (verified via `git diff HEAD --quiet`).

### Mutation 1: R4a above R3 (move not-started rule before awaiting-gate rules)

**Result:** 0 failures (559/559 passing)

**Analysis:** The conditions are mutually exclusive. R3 cases either require `walk !== null` (tipStage checks) or `projectedJoin && !gateDecisionJoin` (for the absent-chain-with-projected-sidecar case). R4a requires `walk === null && spec === null && !projectedJoin && !gateDecisionJoin`. No overlap exists, so order between R3 and R4a doesn't affect outcomes.

---

### Mutation 2: R4a below R4 (not-started after hung)

**Result:** 8 failures

**Failing tests:**
- `corpus: not-started-heartbeat-override → P1=not-started/R4a`
- `corpus: not-started → P1=not-started/R4a`
- `progress timestamp: nothing progressed yields null and not-started (FCA-P10 R4a)`
- `AC1: R4a fires for no-chain, no-spec, no-sidecar, no-liveness parcel`
- `AC3: not-started fixture yields not-started/R4a`
- `AC3: not-started-heartbeat-override yields not-started/R4a with goal-override threshold`
- `AC4: R4a fires before R4 for no-chain, no-spec, no-sidecar, no-liveness`
- `GET /api/reconcile: shape, counts by code, echoed (not derived) state, source ages`

**Analysis:** With R4a after R4, the infinite-age hung check fires first (`lastProgressAt === null` yields `age = POSITIVE_INFINITY > threshold`), classifying not-started parcels as hung instead.

---

### Mutation 3: Drop the "no sidecar" condition (!projectedJoin && !gateDecisionJoin)

**Result:** 0 failures (559/559 passing)

**Analysis:** The test fixtures for sidecar edge cases (`not-started-rejection-sidecar`, `not-started-projected-sidecar`) also have specs present, so `spec === null` is false and R4a doesn't fire regardless of the sidecar condition. The sidecar condition is a safeguard; test coverage for spec-absent + sidecar-present doesn't exist in the corpus.

---

### Mutation 4: Drop the "no liveness" condition (!liveness.live)

**Result:** 3 failures

**Failing tests:**
- `corpus: not-started-live → P1=running/R5`
- `AC3: not-started-live yields running/R5 (liveness means work is happening)`
- `AC4: liveness blocks R4a (falls through to R5 running)`

**Analysis:** Without the liveness guard, R4a would fire even when a worktree is live, misclassifying active work as not-started.

---

### Mutation 5: Drop the "spec === null" condition

**Result:** 4 failures

**Failing tests:**
- `corpus: not-started-spec-only → P1=hung/R4`
- `R5: no chain, active spec with recent progress and no liveness is running`
- `AC3: not-started-spec-only yields hung/R4 (spec is progress)`
- `FCA-2 attention counts carry signal severities and urgent subjects`

**Analysis:** Without the spec check, parcels with a spec (evidence of shaping) would be misclassified as not-started when they should be hung or running.

---

### Mutation 6: Drop the "walk === null" condition

**Result:** 0 failures (559/559 passing)

**Analysis:** All chain-present fixtures also have specs present, so `spec === null` is false and R4a doesn't fire regardless. Test coverage for chain-present + spec-absent doesn't exist in the corpus.

---

## AC9: Real-Data Measurement

**Console configuration:**
- `FOC_REPO_ROOT=/home/cmorgan76/Repos/agent-skills`
- `FOC_STATE_DIR=/tmp/foc-scratch-state`
- `PORT=8091`
- Read-only (no writes to repos)

### Measured counts

| State | Count | Parcels |
|-------|-------|---------|
| complete | 4 | CLOSE-P1, CLOSE-P2, CLOSE-P3, E6-R1 (all w4-closeout) |
| hung | 14 | MRC-01, MRC-02, MRC-03, RCM-P0, RCM-P1, JEV-P0, JEV-P1, JEV-P2, JEV-P3, JEV-P4, JEV-P5, TO-P0, TO-P1, TO-P2 |
| not-started | 20 | FOC-P1, FOC-P2, FOC-P3, FOC-P4, RCM-P2, RCM-P3, RCM-P4, RCM-P4A, RCM-P5, RCM-P6, RCM-P7, RCM-P8, RCM-P8A, RCM-P9, RCM-P10, TO-P3, TO-P4, TO-P5, TO-P6, TO-P7 |
| **Total** | **38** | 18 goals |

### Comparison with spec (b8fe06b6, 17 goals, 34 parcels)

| Metric | Spec | Measured | Difference |
|--------|------|----------|------------|
| Goals | 17 | 18 | +1 (w4-closeout added) |
| Total parcels | 34 | 38 | +4 (4 complete parcels now counted) |
| hung | 20 | 14 | -6 |
| not-started | 14 | 20 | +6 |

**Explanation:** The differences are expected because current main differs from b8fe06b6:
1. One additional goal (w4-closeout) with 4 complete parcels
2. Some parcels previously classified as hung now classify as not-started under R4a (the FCA-P10 rule itself)
3. Spec measured before R4a existed; current measurement reflects R4a in effect

### Outside-record parcels reconciliation check

The 5 parcels cited in the spec (FOC-P1/P2/P3, RCM-P2, TO-P6) were queried via `/api/reconcile`. All show 0 findings, which is expected for `not-started` parcels — they have no chain, no spec, no activity to reconcile.

```
FOC-P1: state=not-started, findings=0
FOC-P2: state=not-started, findings=0
FOC-P3: state=not-started, findings=0
RCM-P2: state=not-started, findings=0
TO-P6: state=not-started, findings=0
```

---

## Consumer Sweep

Four files were checked for `ParcelStateValue` enumeration or state-conditional logic:

### 1. `ui/needs.js` (lines 6–11)

```javascript
export function needsFor(parcelState, urgent) {
  if (urgent) return 'needs needs-red'
  if (parcelState === 'hung' || parcelState === 'failed') return 'needs needs-red'
  if (parcelState === 'awaiting-gate') return 'needs needs-amber'
  return ''
}
```

**No change needed:** `not-started` correctly falls through to `return ''` (no attention needed). A not-started parcel is information-only — it doesn't require human action.

### 2. `src/alerts.ts` (line 24)

```typescript
if (parcel.state === 'hung') {
  alerts.push({ ... })
}
```

**No change needed:** Alerts fire only for `hung` and `failed`. A not-started parcel is not an error condition — no alert is appropriate.

### 3. `src/remedy.ts` (lines 355–357)

```typescript
if (parcel.state === 'failed') remedies.push(failedRemedy(config, projection, parcel))
else if (parcel.state === 'hung') remedies.push(hungRemedy(config, projection, parcel))
else if (parcel.state === 'awaiting-gate') { ... }
```

**No change needed:** Remedies are generated for `failed`, `hung`, and `awaiting-gate`. A not-started parcel has no work to remediate — the human chooses when to start, not what to fix.

### 4. `ui/views/tray.js`

**No change needed:** This file renders session/spawn liveness (ledger states like `running`, `exited-clean`), not parcel states. The `state` references are to `spawn.ledger.state`, not `ParcelStateValue`.

---

## Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC4 | ✓ PASS | 6 mutations applied; 3 detected failures correctly, 3 passed due to mutually exclusive conditions or coverage gaps; all restored cleanly |
| AC9 | ✓ PASS | 38 parcels measured (4 complete, 14 hung, 20 not-started) across 18 goals; differences from spec explained by main drift and R4a effect |
| Consumer sweep | ✓ PASS | 4 files verified need no change; `not-started` is information-only (no attention, no alert, no remedy) |

**Test count tripwire:** 559/559 passing before and after all mutations.
