# /loop Directive — quick-flags goal

## COORDINATOR OWNERSHIP — read before dispatching anything
> **Queue owner: the pi coordinator session `01a136d7-28c5-73e4-85c6-6f53aefdf98b`** (claimed 2026-10-13). One goal, one coordinator. Ownership transfers only at parcel boundaries, by editing this block. If this block names another live coordinator, STOP and report.
> **State:** `qf_p1_shaping_pending`

**Resume:** `/goal resume quick-flags`
**Integration branch:** `feat/foreman-line-quick-flags` (local; cut from local `main`). Parcel branches/worktrees: `qf-p1`, `qf-p2`, `qf-p0`, `qf-p3`, each in its own worktree, named in its kickstarter.

## Who you are

The Coordinator (D4): you consume verification, you never produce it. Charter: `charter.md`. Plan review: `plan-review-findings.md`. Canon: `docs/COORDINATOR-PATTERN.md`, `skills/parcel-driven-development/SKILL.md`.

## Gate record

- **Gate 1:** granted 2026-10-13 ("ratify as written"), re-ratified after plan review ("ratify the amendments as written"): D1–D10 as amended (D2′, D4′, D5′, D9′, D10′). Re-opening any decision re-opens Gate 1 for that decision only.

## Standing authorizations (granted by Clint 2026-10-13; scoped to this goal only)

1. **Gate 2 (dispatch):** exactly QF-P1, QF-P2, QF-P0, QF-P3, in that dependency order (QF-P0 after QF-P2, QF-P3 after QF-P2). A new parcel idea is stop-and-report. Contingency: shaping must pass coordinator lint (every factual claim verified on disk) first.
2. **Gate 3 (merge):** local merge of a parcel branch into `feat/foreman-line-quick-flags`, contingent on the full chain being green: closure check on the claim, deterministic pass, adversarial review(s) triaged, any red step voids it for that chain. Merge of the integration branch to `main` stays human.
3. **Not granted:** push, PR, remote operations, force-push, history rewrite, repo-settings changes. All local work only.
4. **Blanket/asrec:** none standing. Quick flags apply only per D9′ and are recorded below.

## Per-iteration algorithm

1. Read this block and `charter.md`; locate the active parcel and its step.
2. Per parcel: shaping session (frontier, docs-only) → coordinator lint → Gate 2 → builder in own worktree, Step 0 restate-and-stop → rule on flags → claim mapped to evidence with test count → closure check on disk BEFORE re-running → deterministic pass → adversarial review (two for Risk parcels, frontier, fresh, read-only) → triage, reproduce disputed findings → rework with Step 0 and test-count tripwire → Gate 3 → Stage F (spec to done/, cleanup, lessons with disposition lines, state updated).
3. Reviewers: pi `--provider anthropic --model claude-opus-5-5 --no-session --tools read,grep,find,ls` (the `claude` CLI auth expired 2026-10-13). Builders per the routing table.
4. Update the state line above and the INDEX row at every parcel boundary.
5. At the exit: dispatch the dry-read walkthrough reviewer, then write the stop report.

## Quick-flag records and decision log

*(none yet)*

## Stop conditions (stop the loop, write a report naming what the human must do)

- A frozen contract needs modification.
- A tripwire fires twice on one parcel.
- A security-relevant finding cannot close in-parcel.
- Anything outward-facing beyond the authorizations above (push, PR, remote).
- Draft flag text readable as waiving a gate, or a conformance check that cannot be made mechanical.
- Queue empty / exit criterion met: the final report names the human steps (PR, merge to `main`).
- Any hook or goal condition phrased as a human action: say so and ask the developer to re-issue it as agent-completable.

## Wakeup pacing

Blocked only on a running background session: a long fallback (1200–1800s). Completion is the primary signal. Never poll. If no wakeup facility exists in this harness, say so and yield.
