# Rework dispatch — CFF-P1 r2 (review findings, Amendment A2 implementation)

**Authority:** CFF-P1 review triage 2026-10-08
(`cff-p1-review-a-findings-2026-10-08.md`,
`cff-p1-review-b-findings-2026-10-08.md` — read both in the main checkout).
Two reviews, no verdict-integrity blockers, five rework items. Amendment
**CFF-P1-A2** (`ca934c48`, committed alone on the parcel branch) is the
ratified spec delta this rework implements — read the amended spec first.
**Role:** builder (rework). Same rules as the build: you are not the
coordinator, not a reviewer. **Model policy:** `anthropic/claude-opus-5-5`.
**Tripwire:** test count baseline is **367** at `f953ecd3`/`ca934c48`; growth
only from new tests named in your completion record.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree | `/home/cmorgan76/Repos/foreman-line-cff-p1` |
| G2 | Branch | `feat/foreman-line-CFF-P1` (existing; do not create/rebase/reset/amend) |
| G3 | Spec | `plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`, SHA-256 `157335954cfcd957445939dca8089b4397b0e66e4cf502e8539186208f801a2d` (A2-amended), `status: active` |
| G4 | Worktree state | clean before you start |

Record `git rev-parse HEAD` at start. Expect `ca934c48` plus only docs-only
paper-trail commits on top (verify with `git log --oneline ca934c48..HEAD` —
any code commit there is a stop-and-report).

## Step 0 — restate and STOP

Restate the rework items (below), the Allowed Files (unchanged from the build:
the four `scripts/` files + the completion record under the goal dir), and
G1–G4. Then stop for the coordinator's ruling.

## Rework items (the floor, not the ceiling — sweep for every instance of each class)

1. **A2.1 — uncovered-package whole-run fallback.** Any package in the
   shard's execution set without a `packages[name]` entry (or with a
   non-array entry) disables proximity computation for the whole run —
   ascending-name order, named fallback reason distinct from `pin-missing`
   (e.g. `pin-uncovered-package:<name>`). Tests: covered-pin unchanged;
   uncovered package → byte-identical to today's order; mutate-the-fixture
   proof the test binds.
2. **A2.2 — concrete exclusion scan.** Recursive over the whole parsed pin;
   exact-key, case-insensitive match on {`excludes`, `excluded`,
   `not-affected`, `not_affected`, `notAffected`, `exempt`, `ignore`}; a hit
   anywhere → malformed-pin fallback. Shape-strict variance entries (exactly
   `package` + `path`, both strings — `affects:false` or any extra key is
   malformed). Tests include Reviewer B's accepted-today cases (nested
   exclusion key; `exempt`; variance edge with extra keys) now failing
   closed, AND a false-positive guard (`platform_skips` and similar
   legitimate keys do NOT trip the scan).
3. **A2.3 — best-effort annotation emission.** A throwing emit is caught,
   recorded, and the phase-2 loop continues; the partial artifact is never
   lost to an annotation failure. Test: a stubbed throwing `echo`/emit path
   still produces the artifact and the non-zero exit.
4. **B-5 — pin the annotation escaping.** Hostile inputs with ODD colon runs
   (`:::`, `:::::`) and the property-escaping removed mutation: prove the
   escaping test fails when the property-escaping line is mutated out, and
   that odd-run inputs never forge a second `::` delimiter pair. Correct the
   completion record's "exactly two `::` delimiters" claim to the true
   mechanism (property escaping), not the literal count.
5. **A-cost-comment — COST_TABLE provenance.** One comment line at the three
   new entries: single instrumented measurement, capture-of-record run
   `37768165017`, unscaled. (Reviewer's point: the completion record says
   it; the code should too.)

Also correct in the completion record (docs, same parcel authority): the
"bias is in the conservative direction" claim (cost entries affect balance,
neither direction is safer — Reviewer A) and the unscoped "D3 preserved by
construction" (holds inside the runner; cross-package fs writes are a named
residual risk).

**Named live-check, not yours:** B-6 (legacy `##[...]` runner-command syntax
neutralization) is a CI-observation item for the parcel's PR run — the
coordinator carries it into the Gate 3 evidence pack. Do not build for it.

## Hard stops

All build-time hard stops remain in force. Additionally: no fallback that
touches shard membership; no new exported surface beyond what A2.1–A2.3 need;
no behavior change to `reconcile`/`verdict`/`assignShards`/`evaluateWaiver`.

## Completion claim

Append to `cff-p1-completion-record-2026-10-08.md` (a clearly-marked r2
section): HEAD start/end; test counts 367 → new with each addition named;
each rework item's expected-vs-observed; the mutation probes' results. Then
commit (conventional subjects) and STOP — a follow-up review pass on the
delta is the coordinator's to dispatch.
