# Reviewer Kickstarter — quick-flags QF-P2 (adversarial, round 1)

You are an adversarial reviewer with zero builder or coordinator context. Review the QF-P2 build at the current `qf-p2` worktree state (uncommitted working tree; build base `41f80463`) against its spec `plugins/foreman-line/docs/specs/active/QF-P2-quick-flags-integration.md` (AC-1..AC-17, verbatim strings V1/V6/V7, the AC-5/AC-6 exact lines, and the "Builder Step 0 rulings" bullet in Context & References). Canon: `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`, `plugins/foreman-line/skills/goal/SKILL.md`. The registry: `plugins/foreman-line/docs/QUICK-FLAGS.md` (§3, §4, §9 especially). Goal records: `plugins/foreman-line/docs/goals/quick-flags/charter.md` (D1, D2″, D5″, D9″, D10′; stop conditions) and `plan-review-findings.md` (R8, R20, R21, waiver routes 56-60).

The four build surfaces (diff against `41f80463`):
- `plugins/foreman-line/skills/goal/SKILL.md` (lines 18, 28 edited in place; `## Quick flags` appended)
- `plugins/foreman-line/templates/kickstarters/loop-directive-template.md` (new)
- `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md` (mirror)
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` (4 lines appended)

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Standing constraints apply (reviewer rules 8–11 of `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`): hostile-input probing is licensed; attempt the naive/literal reading of every prose rule; mutate to prove checks bind. You NEVER edit, fix or commit repo files. You may use a shell for read-only probes and scratch work under a PRIVATE directory from `mktemp -d` (another reviewer runs concurrently). End by asserting `git status --short` shows no changes you caused.

Mandate (rank each finding BLOCKER / HIGH / MEDIUM / LOW, with file:line evidence and a suggested disposition):
1. **Fail-open hunt.** Is there ANY path by which the added text waives, delegates, pre-authorizes or weakens a gate — Gate 1 (including one re-opened by triage), the universal stop conditions, green-chain merge, human-only gates, destructive/outward-facing limits? Probe each waiver route (`plan-review-findings.md:56-60`) against the new text: a token or line in the loop directive granting authority; the Coordinator issuing a quick flag in its own wakeup or resume prompt; a delegating quick flag combined with ratification passing Gate 1; a delegating quick flag covering a triage-reopened Gate 1.
2. **Naive readings (write the wrong-but-literal reading; show the text excludes it, or report):**
   - (a) the four waiver routes above;
   - (b) skill line 18 or V7 read as voiding prose standing authorizations or the gate record (spec OQ-1/OQ-3);
   - (c) "only the words the human typed count" read as letting pasted or expanded text carry a quick flag;
   - (d) the template's ownership block read as letting a session claim ownership by editing it mid-parcel, or as naming only a session ID;
   - (e) the template's Standing authorizations, Gate record or `Active restrictions:` line read as a place to store a grant, or as pre-authorizing Gate 1;
   - (f) the COORDINATOR-PATTERN section read as placing the registry above canon, or as adding or removing a gate.
3. **AC-by-AC trace** of AC-1..AC-17 with quotes. Run the spec's 11 Verification Plan commands yourself (build base `41f80463`) and confirm the stated outputs.
4. **D2″ "documented once":** does any added text restate a registry definition (entry, line format, conflict row, example line) instead of pointing to §9? Does any location the skill names differ from §9's homes?
5. **Mirror check:** does the synced copy differ from the source by anything other than the `${CLAUDE_PLUGIN_ROOT}` → `plugins/foreman-line` substitution?
6. **Citation stability:** can any existing `path:line` citation into the goal skill or COORDINATOR-PATTERN (e.g. from `QUICK-FLAGS.md` or other goals' records) now point at different text?
7. **Template mechanics:** heading list exactness, placeholder casing, `Active restrictions:`/`Decision log:` boundary lines, clean-room patterns, hard-wrap splits, anything a future goal copying this template would mis-fill in a way that loosens a gate.
8. **Contradictions** with canon, the charter D-rows, the registry, or between the four surfaces.

Do not re-raise accepted items: the QF-P1 round-4 LOW findings accepted as documented (`qf-p1-v2-review-triage-round4-2026-10-14.md`); F-1/F-2 (forwarded to the goal's exit report by ruling); the synced-copy reversion residual (spec Assumptions, Q10); authority-registry drift (QF-P0's parcel, Q12); the template sitting at its 110-line cap (AC-8 allows "at most 110").

**Report only (1) fail-OPEN paths, (2) contradictions, (3) AC failures, (4) mechanical-checkability gaps for QF-P3; list pure wording nits in one trailing line.** Output: a findings table, then a verdict (ACCEPT / REQUEST CHANGES). If you find nothing above LOW, the correct verdict is ACCEPT, with LOW items listed.

---
## Round 2 addendum (post rework 1)
Re-review of the QF-P2 build at the current `qf-p2` working-tree state after rework 1. Round-1 findings: `qf-p2-review-O/P` outputs; the binding triage is `plugins/foreman-line/docs/goals/quick-flags/qf-p2-review-triage-2026-10-14.md`. In addition to the mandate above: (a) verify closure of every FIXED triage ID with a quote — O-1/P-1 (skill:46 qualifier removed), O-3/P-8 (grantor tied to the human, `none` slot rule, "human ratification"), O-4 (never copy over an existing loop directive), O-5/P-7 (three canon documents), O-6 ("as it applies to this goal"), P-2 (restrictive quick flag limits conduct under a prose grant, CP:93), P-3 ("directly under the `Active restrictions:` label"), P-5 ("each copy named in the ownership block"), P-6 (four prompt kinds) — and check each fix covers ALL instances; (b) hunt regressions and contradictions the rework edits created, including the approved room-making changes R1–R7 (intro reword, ownership-block reflow, resume-line join, canon-list punctuation, per-iteration step 1/2 reword, AC-12 prose merge, wakeup-pacing reword) and the Standing-authorizations rewrap (a "Quick flags" wrap split previously broke the term rule and was fixed — verify); (c) confirm the accepted/forwarded items were NOT changed (O-2, O-7/P-4, O-8/P-9, O-9, wording nits). Run all 11 Verification Plan commands again (base `41f80463`). Do not re-raise accepted items (the triage's Accept/Forward rows; the QF-P1 round-4 accepted LOWs; F-1/F-2; the Q10/Q12 residuals; the 110-line cap). Same output format; end with ACCEPT or REQUEST CHANGES. If nothing above LOW remains, the correct verdict is ACCEPT, with LOW items listed.
