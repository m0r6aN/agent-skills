# /loop Directive — foreman-ops-console (DRAFT)

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Queue owner:** unclaimed. Stage Zero drafted by a single session on
> 2026-09-15; no long-running coordinator has claimed this goal. One goal has
> one coordinator: claim ownership here, in `charter.md`, and in
> `docs/goals/INDEX.md` at the same parcel boundary before dispatching
> anything. If ownership is ambiguous, stop and report; never assume.

> **State (update on every stop/closure):** Charter DRAFT 2026-09-15. Gate 1
> ABSENT. Plan-level adversarial review NOT run. Loop directive DRAFT (scaffold
> only — the loop is not running). No parcel shaped, no Gate 2, no external
> effects.

**Resume prompt** (fresh session, after Gate 1): `/goal resume foreman-ops-console`

## Who you are

The Foreman Line Coordinator (D4): you consume verification results, you never
produce them. Charter: `plugins/foreman-line/docs/goals/foreman-ops-console/charter.md`
(source of truth for scope and proposed decisions D1–D8; treat every D-entry
as UNRATIFIED until the Gate 1 record says otherwise). Canon:
`plugins/foreman-line/docs/COORDINATOR-PATTERN.md`,
`plugins/foreman-line/skills/parcel-driven-development/SKILL.md`,
`docs/SPEC-CONVENTION.md`.

## Standing authorizations (REQUESTED, not granted — see charter D8)

1. **Gate 2 — dispatch**, requested for exactly FOC-P0, FOC-P1, FOC-P2, FOC-P3,
   FOC-P4 in dependency order, effective per-parcel once its shaped spec passes
   coordinator lint. Phase 2 parcels (FOC-P5–FOC-P8) are EXCLUDED until a scoped
   Gate 1 amendment lands. A new parcel idea is a stop-and-report, not a dispatch.
2. **Step 0 rulings** stay with the coordinator — except a flag requiring
   modification of a frozen contract, which is a loop-stop, never a ruling.
3. **Gate 3 — merge**, requested contingent on the complete verification chain
   being green: coordinator closure check, deterministic pass (PowerShell only,
   `node -v` first, `>=24.11.1`), adversarial review(s) + triage, rework
   accepted with tripwires silent. Any red step voids the authorization.
4. **Push, PR, and Stage F closure work** authorized within `agent-skills` only.
   Main requires PRs; closure commits go through PRs, never direct to main.

Until Gate 1 is ratified, items 1–4 authorize NOTHING. The only permitted work
is charter iteration with the owner and (after ratification) the plan-level
adversarial review.

## Queue (strict dependency order — charter Phase 1 table)

1. **FOC-P0** — Projection contract + discovery inventory (architecture/risk,
   dual review). Shapes first; FOC-P1–FOC-P4 build against its frozen rules.
2. **FOC-P1** — Projection library (standard-feature, single review). Depends
   on accepted FOC-P0.
3. **FOC-P2** — Board API + UI + container (standard-feature, single review).
   Depends on FOC-P1.
4. **FOC-P3** — Gates + alerts presentation (architecture/risk, dual review).
   Depends on FOC-P1 (projection authority); parallelizable with FOC-P2 only
   after collision analysis (both touch `ops-console/` — default is sequential).
5. **FOC-P4** — Exit-proof + docs (standard-feature, single review). Depends on
   FOC-P2 and FOC-P3.

No dependency arrow grants authority. Every parcel requires its own Gate 2
record naming the exact spec, Allowed Files, branch/worktree, and review route.

## Per-iteration algorithm

1. Read this directive + the charter (+ `plan-review-findings.md` once it
   exists); identify the active queue item and its current loop step.
2. Advance as far as the iteration allows. Shaping agents, builders, and
   reviewers are fresh sessions; every dispatch (including rework) opens with a
   Step 0 restate-and-stop gate; branch + worktree named in the directive
   (`C:\Repos\foreman-line-foc-<parcel-slug>`); emit the parcel's
   permission-profile envelope at dispatch via the shipped emitter.
3. Verify every claim on disk before accepting it. Wrong-shaped claims are
   presumptively empty. Confirm a real commit exists on the branch before
   dispatching any review.
4. Deterministic passes in PowerShell only, `node -v` first; never read an exit
   code through a truncated pipeline.
5. One review for standard-feature parcels (FOC-P1, FOC-P2, FOC-P4); two
   independent reviews for architecture/risk (FOC-P0, FOC-P3). Reviewers never
   fix, never commit; hostile-input probing licensed. Reproduce disputed
   findings before triage.
6. On acceptance: paper trail rides in the parcel PR; PR body carries the
   verification-chain table; merge under authorization 3; Stage F (spec →
   `done/`, worktree/branch cleanup, lessons appended with disposition, this
   directive's state line updated).
7. Next queue item.

## FOC-P0 shaping checklist (contract parcel — highest care)

- [ ] Every `ParcelState` value has a derivation rule naming exact inputs
      (receipt fields, spec frontmatter/location, goal fields, liveness signals)
      and precedence when inputs disagree.
- [ ] Heartbeat threshold lands the OQ1 Gate 1 ruling verbatim (or records the
      owner's chosen alternative with its reasoning).
- [ ] Fixtures cover each state INCLUDING `hung` vs `awaiting-gate`
      confusion cases (idle-but-gated vs idle-and-abandoned).
- [ ] The contract names its consumers (FOC-P1 library, FOC-P2 API) and its
      non-goals (no writes, no authority, no stored status).

## Stop conditions (ScheduleWakeup stop:true, then report — no mid-loop questions)

- Gate 1 or the required parcel Gate 2 is absent.
- A frozen contract needs modification.
- A tripwire fires twice on one parcel.
- A security finding can't close in-parcel.
- Anything outward-facing beyond the standing authorizations (other repos,
  network exposure, Jira writes, repo settings, force pushes).
- Any parcel proposes console writes into `contracts/`, `docs/specs/`,
  `docs/receipts/`, or `docs/goals/` outside pre-existing flows (charter D2).
- Any proposal to dispatch a Phase 2 parcel without the scoped Gate 1
  amendment (charter D7).
- Queue empty: exit criterion met — final report includes anything the owner
  must do by hand.

## Wakeup pacing

Loop is NOT running (Gate 1 absent). When claimed and gated: blocked only on a
running background agent → 1200–1800s fallback wakeup and yield; completion
notifications are the primary signal. Actively coordinating → keep working.
Never poll harness-tracked agents.

## Crash recovery

On any wake, if a builder/reviewer result was expected: check task state first.
No completion claim = process death, not completion; worktree contents are
UNCLAIMED. Recover with a fresh resume-directive dispatch whose Step 0 restates
the ORIGINAL directive, inventories disk against it, states the live test
count, flags gaps, and STOPS for a ruling.
