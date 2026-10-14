# /loop Directive — quick-flags goal

## COORDINATOR OWNERSHIP — read before dispatching anything
> **Queue owner: the pi coordinator session `01a139ff-f7bc-725c-808d-120548a55ef1`** (claimed 2026-10-14, at the QF-P1/QF-P2 parcel boundary; transferred from `01a136d7-28c5-73e4-85c6-6f53aefdf98b` on the developer's instruction, option 1 of the stop report). One goal, one coordinator. Ownership transfers only at parcel boundaries, by editing this block. If this block names another live coordinator, STOP and report.
> **State:** `qf_p2_rework1_green_round2_review_blocked_on_anthropic_usage` (2026-10-14; QF-P2 shaped, built, round-1 reviewed and triaged, rework 1 applied, deterministic pass green; round-2 reviews undeliverable — anthropic third-party usage exhausted)

**Resume:** `/goal resume quick-flags`
**Integration branch:** `feat/foreman-line-quick-flags` (local; cut from local `main`). Parcel branches/worktrees: `qf-p1`, `qf-p2`, `qf-p0`, `qf-p3`, each in its own worktree, named in its kickstarter.

## Who you are

The Coordinator (D4): you consume verification, you never produce it. Charter: `charter.md`. Plan review: `plan-review-findings.md`. Canon: `docs/COORDINATOR-PATTERN.md`, `skills/parcel-driven-development/SKILL.md`.

## Gate record

- **Gate 1:** granted 2026-10-13 ("ratify as written"), re-ratified after plan review ("ratify the amendments as written"): D1–D10 as amended (D2′, D4′, D10′), then D2″, D5″, D9″ after the second scoped re-open on 2026-10-13 ("Ratify your recommendations"; see `gate1-reopen-d5-d9-2026-10-13.md`). Re-opening any decision re-opens Gate 1 for that decision only.
  Ratified revisions: `charter.md` as ratified at `90f72d50` (Gate 1 re-ratification, 2026-10-13); amendment text in `plan-review-findings.md` at `97b94e60`. Disclosure for the developer's confirmation: commit `2837d974` later edited the charter's Gate 2 request to add QF-P0, conforming it to the already-ratified Parcels table; no ratification entry cites that edit.

## Standing authorizations (granted by Clint 2026-10-13; scoped to this goal only)

1. **Gate 2 (dispatch):** exactly QF-P1, QF-P2, QF-P0, QF-P3, in that dependency order (QF-P0 after QF-P2, QF-P3 after QF-P2). A new parcel idea is stop-and-report. Contingency: shaping must pass coordinator lint (every factual claim verified on disk) first.
2. **Gate 3 (merge):** local merge of a parcel branch into `feat/foreman-line-quick-flags`, contingent on the full chain being green: closure check on the claim, deterministic pass, adversarial review(s) triaged, any red step voids it for that chain. Merge of the integration branch to `main` stays human.
3. **Not granted:** push, PR, remote operations, force-push, history rewrite, repo-settings changes. All local work only.
4. **Blanket/asrec:** none standing. Delegating and gate quick flags are one-shot (D5″) and have no stored form. The only stored quick-flag state is the `Active restrictions` entry below.

## Per-iteration algorithm

1. Read this block and `charter.md`; locate the active parcel and its step.
2. Per parcel: shaping session (frontier, docs-only) → coordinator lint → Gate 2 → builder in own worktree, Step 0 restate-and-stop → rule on flags → claim mapped to evidence with test count → closure check on disk BEFORE re-running → deterministic pass → adversarial review (two for Risk parcels, frontier, fresh, read-only) → triage, reproduce disputed findings → rework with Step 0 and test-count tripwire → Gate 3 → Stage F (spec to done/, cleanup, lessons with disposition lines, state updated).
3. Reviewers: pi `--provider anthropic --model claude-opus-5-5 --no-session --tools read,grep,find,ls` (the `claude` CLI auth expired 2026-10-13). Builders per the routing table.
4. Update the state line above and the INDEX row at every parcel boundary.
5. At the exit: dispatch the dry-read walkthrough reviewer, then write the stop report.

## Active restrictions and decision log

Active restrictions: *(none)*
Decision log: *(none yet)*

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

## Stop report 2026-10-13 — route-receipt ruling needed

Plan-level review is done and Gate 1 was re-ratified. The loop stopped before dispatching QF-P1 shaping. The shaping template (`templates/kickstarters/shaping-template.md`) requires an approved route receipt minted by the resolver for every dispatched session, and says a bare `pi` call "is not a Foreman execution path." No usable minting CLI was found for this session (`routing-policy/scripts-mint-proposal.ts` and the `dispatch` package were inspected only). The plan-review session itself ran as an ephemeral direct `pi` invocation, because the `claude` CLI OAuth session had expired.

**Human decision needed:** (a) mint route receipts for the shaping/build/review lanes yourself, or point me at the resolver command; (b) rule that this docs-only goal may run its sessions as direct `pi` sessions with no receipt, recorded as an explicit deviation; or (c) re-authenticate the `claude` CLI (`claude /login`) and say whether that path is acceptable. Until then no dispatch occurs.

## Ruling 2026-10-13 — route-receipt deviation (Clint, option b)
This docs-only goal's sessions (shaping, build, review) run as **direct `pi` sessions without minted route receipts**. This is a recorded, explicit deviation from `templates/kickstarters/shaping-template.md`, scoped to this goal only and not precedent. Sessions use `pi -p --provider anthropic --no-session`; reviewers are read-only (`--tools read,grep,find,ls`) on `claude-opus-5-5`; shaping and Risk builders use `claude-opus-5-5`; the standard builder uses `claude-sonnet-5-5`. Kickstarters must say "no route receipt; direct invocation per loop-directive ruling 2026-10-13." This does not widen any gate.

## Stop report 2026-10-13 (round 3) — second tripwire on QF-P1
QF-P1 built, reworked twice, and reviewed in three rounds (six frontier reviews). Each round: REQUEST CHANGES, no BLOCKER, no waiver path for any §3 item. Tripwire (false closure) fired twice on QF-P1, which is a universal stop condition. **Nothing is merged; Gate 3 was never reached.** State: parcel branch `qf-p1` in worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, HEAD `09c5031a`+, builder output in `plugins/foreman-line/docs/QUICK-FLAGS.md`. Local only; nothing pushed.
**Human decision needed:** choose option 1, 2 or 3 in `qf-p1-review-triage-round3-2026-10-13.md`; plus rule on K2's scope (E-6/F-5). Option 2 re-opens Gate 1 for D5′ and D9′. Also confirm the disclosed `2837d974` charter edit in the Gate record.

## Stop report 2026-10-14 — QF-P2 round-2 review blocked (anthropic usage exhausted)
QF-P2 progress this session (coordinator `01a139ff-f7bc-725c-808d-120548a55ef1`, ownership transferred at the parcel boundary on the developer's instruction): shaping dispatched and linted (selfCheckDraft green; every Step 0 claim verified on disk; OQ-1 ruled, OQ-2/3/4 confirmed, F-1/F-2 forwarded to the exit report); spec promoted to `active` (commit `41f80463`); build dispatched; build Step 0 rulings C1 + A/B/D/E/F/G/H/L (commit `e4e97f1b`); build completed with all 11 Verification Plan commands green on the coordinator machine; round-1 reviews O and P both REQUEST CHANGES on one shared MEDIUM (O-1/P-1, the skill:46 "in the loop directive" qualifier, reproduced on disk before ruling); triage `qf-p2-review-triage-2026-10-14.md` (1 MEDIUM fix, 8 LOW fixes, 2 accepted as documented, 2 forwarded); rework 1 applied and the full deterministic pass re-run green. **Nothing of the build is committed; the four surfaces sit uncommitted in worktree `/home/cmorgan76/Repos/agent-skills-qf-p2` (HEAD `e15a449e`).** Gate 3 not reached. Tripwires: 0 of 2.
**Blocker:** both round-2 reviewer dispatches failed with anthropic `400`: "Third-party apps now draw from your extra usage, not your plan limits." The 2026-10-13 ruling fixes reviewers on `claude-opus-5-5` via `--provider anthropic`; an OpenRouter spelling is a different route under canon (Amendment 06 N1/N3) and is not mine to substitute.
**Human decision needed:** (a) add extra usage at claude.ai/settings/usage, then `/goal resume quick-flags`; (b) rule on an alternate reviewer route/provider explicitly (recorded as a deviation like the 2026-10-13 ruling); or (c) re-authenticate the `claude` CLI and rule that path acceptable.

## Ruling 2026-10-14 — reviewer route deviation (Clint)
"Retry claude first. If that fails then we switch to openai/gpt-6.1-sol." The anthropic retry failed again (same 400). Round-2 (and, if needed, later) QF-P2 review sessions run as direct invocations on `openai/gpt-6.1-sol`, read-only (`--tools read,grep,find,ls,bash`), no route receipt. This is a recorded, explicit deviation from the 2026-10-13 ruling's `claude-opus-5-5` reviewer lane, scoped to this goal's remaining review work and not precedent. It does not widen any gate: reviewers stay fresh, independent, read-only and adversarial; triage and reproduction duties are unchanged. Builder lanes are unaffected.

## Stage F record 2026-10-14 — QF-P1 closed
QF-P1 (reshaped under Gate 1 re-open D2″/D5″/D9″) built, reworked three times on the reshaped spec, and reviewed in four rounds of two independent frontier reviews each; round 4 returned **ACCEPT (M and N)** with only LOW findings. Deterministic pass on the coordinator machine: spec Verification Plan green (VP block 3 byte-identical to the spec's expected output). Spec moved to `docs/specs/done/`. Gate 3 local merge into `feat/foreman-line-quick-flags` only; nothing pushed.
**Tripwire accounting:** reshaped parcel ended at 1 of 2 (the G-6 ratify-scope change not swept into the GATES row check).
**Open LOW findings, accepted as documented (round 4):** M-1/N-1 (a successor session may not locate the prior owner's working copy), M-2/N-2 (a `--review2` lift naming a parcel can remove a line for a different parcel), M-3 (NFKC and fullwidth/Cyrillic homoglyph variants), M-4/N-4 (`Active restrictions` entry boundary vs `--ratify` condition (b)), N-3 (some malformed lines cannot be lifted; fail closed), N-5 (GATES rule-ID wording weaker than the entries).
**Inputs forwarded to QF-P2:** (1) the goal skill and loop-directive template must name `restrictions.md` and the `Active restrictions` entry/decision-log locations; (2) the ownership block should name the owner's working copy (M-1/N-1); (3) skill/slash-command expansion of a human's typed command and the typed-words boundary (J-11); (4) add "stored state may only restrict" to the Stage Zero interrogation (lesson, 2026-10-13); (5) refresh the synced `goal` skill copy; (6) the decision log before the loop directive exists.
**Inputs forwarded to QF-P3:** checker gaps G-11/H-9 (extra label line after the 7th; first rule ID of the 17 pinned independent rows; `|` in cells; closed-row count; AC-2 "only" vs interplay text in two Conflicts lines).
**Developer must know:** this goal's own gate record does not yet satisfy the registry's ratified-row evidence (a prose re-ratification names no revision), so once QF-P1 is in use `--dispatch-ok`/`--merge-ok` would be refused for QF-P1/QF-P2 rows until a ratification that names a revision is recorded; the standing prose Gate 2/3 authorizations in this directive are unaffected. Commit `2837d974` (QF-P0 added to the Gate 2 request) was confirmed by the developer on 2026-10-13.
