# w4-closeout — Coordinator Loop Directive

## COORDINATOR OWNERSHIP — read before dispatching anything
> **Queue owner: canonical task `/root`, transferred by Clint Morgan on 2026-09-05 at a parcel boundary; takeover anchored to worktree `D:/Repos/agent-skills-worktrees/w4-closeout-d4-r1-20260905`, branch `docs/foreman-w4-closeout-d4-r1`, and base `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`.** Exactly one coordinator owns this goal at a time. If you are not the owner, do not dispatch; if ownership is ambiguous, report to Clint and wait. Ownership transfers only at parcel boundaries via this block. On every loop stop, update the state line below.
>
> **Historical state at the 2026-07-29 stop:** ALL THREE PARCELS SHIPPED + CLOSED. CLOSE-P3 #101/#102 (AC5 proven live, lesson #34). CLOSE-P1 #104 human-merged/#105 (chain `44b6d20b…` sealed, EXIT PASS: PASS, W4 exit item 6 CLOSED, lesson #35). CLOSE-P2 #106 + its closure PR (corpus exit 0 in CI, lessons #36, A5/A6 freeze retirements). The July stop awaited D4 on historical ruleset `19402394`.
>
> **Current state (2026-09-05): D4-R2B SOLE-OWNER COMPROMISE RATIFIED; FOLLOW-UP REVIEW PASS; GOVERNANCE PUBLICATION AUTHORIZED.** PR #16 merged as `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`. D4-R1 remains on HOLD. [`d4-r2b-sole-owner-compromise-amendment.md`](./d4-r2b-sole-owner-compromise-amendment.md) preserves ruleset `17746056` unchanged and defines a separate default-branch-only `main-pr-gate` with zero approvals and strict trusted checks. The corrected governance record may proceed through commit/push/PR; its merge is human-owned. No ruleset mutation occurs before that record is human-merged. Deferred debts remain deferred.

## Standing authorizations (verbatim from charter, with contingencies)

1. **Gate 2 (dispatch):** shaping + builder + reviewer dispatch for CLOSE-P3 → CLOSE-P1 → CLOSE-P2, in that order (D5), one parcel at a time.
2. **Gate 3 (merge):** PR-only merge behind a fully green chain (deterministic pass + adversarial review(s) + required CI checks on the final SHA); any red step voids the authorization for that PR. **EXCEPTIONS (D6 / D4-R2B): CLOSE-P1's minted-chain vehicle PR and D4-R2B's governance-record and goal-complete PRs are HUMAN-merged by Clint.** All other ordinary parcel merges retain their prior green-chain-contingent authority.
3. Push, PR, and Stage-F closure work within this repo only; closure commits go through PRs, never direct to main.
4. No Jira writes this goal (S2a Jira leg deferred as a named debt).
5. **Narrow gating-workflow authorization (B3):** additive edits to `plugins.yml` and `foreman-line-ci.yml` for exactly the chartered diffs (CLOSE-P3 biome loop + always-report jobs; CLOSE-P2 exclusion removal). Anything beyond those named diffs: human-apply-only.

## Queue (strict order, D5)

1. **CLOSE-P3** ☑ **SHIPPED + CLOSED** — PR #101 squash `f7ebb21` (12/12 checks; lint loop verified executing over 17 packages in the PR's own CI log — AC3/AC6). Amendment A1 (`672b3b3`, alone-first): retired AC14 byte-pin + SCAF-P4 AC8 append-only conformance tests, export-set guard added (reviewer mutation-verified). Review SHIP, 0 blockers, 3 INFO accepted. Lesson #34 appended with disposition (STANDING-CONSTRAINTS Builder #12). Stage-F closure PR is the live AC5 docs-only demo — verify `test` + `integration-report` conclude SUCCESS on it before treating AC5 as proven for D4.
2. **CLOSE-P1** ☑ **SHIPPED + EXIT ITEM 6 CLOSED** — PR #104 **human-merged by Clint** (D6; merge `afba5b40…`, 2026-07-28 15:28 EDT). Stage F emitted via real `emitClosureReceipt` with the merge SHA; six-receipt chain `44b6d20b…` sealed. **DETERMINISTIC EXIT PASS: PASS** — `validateChain` ✓, `isSealed` ✓, stages exactly `['A'..'F']` ✓, all three bind-proof mutations correctly red. `gh` cross-checks: E head SHA `f8448a02…` in PR commit list ✓, merge SHA matches ✓. W4 exit item 6 satisfied as originally written (real chain, human merge, zero fixtures). Lesson #35 (A2 enterprise-bypass) appended with disposition. Prior state detail in git history. Full chain: spec `138451f` + amendments A1 `fd8459b` / A2 `0608d65` (A2 = live-probe discovery: enterprise ruleset omits bypass_actors; exclusion rule ratified) → build `8ecefa5` → dual review SHIP-WITH-FOLLOWUPS ×2, 0 blockers → rework R1–R5 `59b1837` (189/189, tripwire +10) → **live AC11 traversal succeeded** (8 rules typed-closed; bypass union `[]`; posture honestly reports canMerge:true/no-required-checks — the pre-D4 state) → A–D receipts minted on real events (`docs/receipts/44b6d20b-4cb6-445d-bc01-d83ec95a845e/`, chain valid) → **Stage E emitted live** (`000004-E`, seq 4, `pr-104@f8448a02…`, uncommitted in worktree pending persistence PR). ON MERGE: runStageF with merge SHA → E+F persistence PR (docs-only, doubles as another AC5 demo) → three-assertion exit pass + bind-proof mutations → Stage F closure + candidate lessons with dispositions (A2 enterprise-bypass discovery; live-seam-first-traversal procedure).
3. **CLOSE-P2** ☑ **SHIPPED + CLOSED** — PR #106 squash `834ae95` (6/6 checks; AC4 proven in the PR's own CI log). Chain: spec + rulings F1–F3/A1–A4 → build (grandfather allowlist, data_classification, CI re-enable; SPEC-CONVENTION §4.6 amendment alone-first) → review SHIP-WITH-FOLLOWUPS → rework R1/R2 (done/-scoped, value-pinned waivers — reviewer's squatting probes as regressions; 80/80) → red-CI rulings **A5/A6**: three MORE lesson-#34-class fork-point freezes retired (approval AC13, projection AC13, registration AC15 — occurrences 3–5 of the class). Corpus `done/` + `active/` exit 0 in CI. Lesson #36 (waivers pin identity+location+value; dispositions require corpus sweeps) with Builder #13 + Stage-F sweep clause installed. **FREEZE-SWEEP deferred debt:** remaining class members enumerated in the A5 sweep (projection input-consumption AC3, 3× bare-specifier root-package pins, approval canonical-parity AC2, 2× verification byte-pins, integration AC19/AC7).

Then: fresh D4-R2B follow-up review PASS → publish the corrected governance record for human merge → pre-write drift check → Clint creates `main-pr-gate` exactly as ratified → coordinator verifies both rulesets and effective `main` rules → open a current final-SHA goal-complete PR proving both required checks → Clint human-merges → coordinator verifies durable closure on `main`.

## Per-iteration algorithm

The proven 11-step loop per COORDINATOR-PATTERN §Verification spine and the coordinator carryover: shape (fresh session) → coordinator lint, every factual claim verified on disk → Gate 2 dispatch via the permission-profiles emitter (never pre-create worktrees) → Step 0 restate-and-stop → build → per-item closure check against disk before re-running anything → deterministic pass (PowerShell, `node -v` first, full-output-before-`$LASTEXITCODE`) → adversarial review (dual for CLOSE-P1; reviewers never fix/commit; STANDING-CONSTRAINTS.md included by reference in every kickstarter) → triage, reproduce disputed findings → rework with own Step 0 + test-count tripwire → merge per authorization 2 → Stage F (spec → done/ + coordinator-lint it (S4), lessons appended WITH dispositions installed, worktree/branch cleanup, state line updated, pre-PR `git diff --stat origin/main` additions-only).

## Stop conditions

Universal: frozen contract modification needed; tripwire fires twice on one parcel; security finding can't close in-parcel; anything outward-facing beyond the authorizations; queue empty.
Goal-specific:
- **Historical D4 interlock:** satisfied because CLOSE-P2 closed before any required-review or required-status rule appeared.
- **Completed review gate:** D4-R2B follow-up review returned PASS. Governance-record commit/push/PR is authorized; its merge remains human-owned.
- **Human ruleset gate after governance merge:** no agent may create, edit, disable, or delete `main-pr-gate` or ruleset `17746056`; stop awaiting Clint's exact UI action, then resume read-only verification.

## Crash recovery

On any wake: check whether the expected agent is still running and whether a completion claim landed; if neither, assume death and dispatch a resume-with-inventory directive (never a bare "continue"). Wrong-shaped claims are presumptively empty.

## Wakeup pacing

Long fallback (1200s+) while builders/reviewers run — completion notifications are the primary wake signal; never poll.
