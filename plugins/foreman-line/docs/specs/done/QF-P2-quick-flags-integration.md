---
ticket: QF-P2
title: Quick-flags integration (goal skill, loop-directive template, synced copy, COORDINATOR-PATTERN cross-reference)
status: done
owner: clinton.morgan
created: 2026-10-14
updated: 2026-10-14
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/skills/goal/SKILL.md
  - plugins/foreman-line/templates/kickstarters/loop-directive-template.md
  - skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md
  - plugins/foreman-line/docs/COORDINATOR-PATTERN.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# QF-P2 — Quick-flags integration (goal skill, loop-directive template, synced copy, COORDINATOR-PATTERN cross-reference)

## Intent

QF-P1 wrote the quick-flag registry, `plugins/foreman-line/docs/QUICK-FLAGS.md` (`Registry version: 1`). QF-P2 makes it operative by wiring it into canon on exactly four surfaces:

1. The goal skill gets a final "Quick flags" section and two in-place line edits.
2. A new loop-directive template.
3. A refreshed synced copy of the goal skill.
4. A short cross-reference section at the end of `COORDINATOR-PATTERN.md`.

All four are prose. The registry stays the only place quick flags are defined (D1, D2″). Its §9 says the `Active restrictions` entry sits "in QF-P2's template" (`QUICK-FLAGS.md:216`). QF-P2 also closes plan-review finding R8: the goal skill models loop directives on a historical W0 kickstarter, which QF-P2 replaces with a real template and does not edit. It also carries the six inputs forwarded at QF-P1's Stage F (`loop-directive.md:70`). No text QF-P2 adds may be readable as waiving a gate (charter stop condition, `charter.md:98`).

## Constraints

- **Docs only, four files.** No code, hook, expander or test (D1, `charter.md:31`). There is no build step.
- **Authority order.** Canon (`COORDINATOR-PATTERN.md`, `skills/goal/SKILL.md`, `SPEC-CONVENTION.md`) governs. Below it come the registry, then the amended D-rows (`charter.md:31-40`), then this spec (`QUICK-FLAGS.md:17`). QF-P2 edits canon, so every edit must keep that order. No added text may say or imply that the registry overrides canon.
- **Verbatim text.** Where this spec says **verbatim**, copy the quoted text exactly, on one line, with no hard wrap, so that `grep -F` finds it:
  - **V1** (`QUICK-FLAGS.md:21`): `A quick flag adjusts how much the Coordinator asks and does inside the gates and never removes a gate.`
  - **V6** (`QUICK-FLAGS.md:31`): `QUICK-FLAGS governs quick flag tokens only. Existing prose grants are neither reinterpreted nor revoked.`
  - **V7** (`QUICK-FLAGS.md:41`, `charter.md:39`): `Nothing stored in a file can grant authority or loosen any restriction: a stored entry is honoured only to restrict.`
- **No quick-flag tokens or variants.**
  - No file QF-P2 writes contains `--` immediately followed by a letter.
  - Added and edited text contains no variant: a dash-led spelling of a canonical name (registry §5, `QUICK-FLAGS.md:58`), as defined by Verification Plan command 5. For example, a markdown bullet that starts with a quick-flag name counts.
  - The registry is referred to by section number (§3, §4, §8, §9), never by restating an entry, a line format or an example line (D2″ "documented once"; Step 0 ruling Q4).
- **Term.** In every added or edited line, each "flag"/"flags" is preceded by "quick", with one exception. The goal skill section holds one sentence saying that builder Step 0 "flags" (`skills/goal/SKILL.md:32`) are not quick flags (D9″, R20). Avoid "flagged".
- **Line stability (Step 0 ruling Q1).** Text is only appended at the end of the goal skill and of `COORDINATOR-PATTERN.md`. The only in-place edits are goal-skill lines 18 and 28. Every other existing line keeps its bytes and its line number. This keeps valid every existing `path:line` citation into these files, for example `QUICK-FLAGS.md:25,27,29,35,64,93,120,165,183`, which cite `skills/goal/SKILL.md:13,32,36,40` and `COORDINATOR-PATTERN.md:7,30,51-53,69,73`.
- **House style.**
  - The goal skill uses unwrapped paragraphs and `${CLAUDE_PLUGIN_ROOT}/…` paths (`skills/goal/SKILL.md:8,13,19,24,28`).
  - `COORDINATOR-PATTERN.md` uses `plugins/foreman-line/…` paths (`COORDINATOR-PATTERN.md:3`).
  - The template follows the three existing kickstarter templates:
    - a `# … — TEMPLATE` heading;
    - an introductory block quote;
    - `<PLACEHOLDER>` fields;
    - hard-wrapped prose;
    - no `${CLAUDE_PLUGIN_ROOT}` and no `plugins/foreman-line/` path (a grep of `templates/kickstarters/` finds neither).

    Hard wrapping must never split a path, a placeholder, a backticked span, or an anchor phrase that Verification Plan command 9 greps for.
- **Builder Step 0.** Before writing anything, restate:
  - this spec and the four Allowed Files;
  - branch `qf-p2`, worktree `/home/cmorgan76/Repos/agent-skills-qf-p2`, and the build base;

  then stop for the coordinator's ruling. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). The builder and the reviewers run without route receipts, as direct invocations under loop-directive ruling 2026-10-13 (`loop-directive.md:59-60`). The builder never runs git add, commit or push. The coordinator commits, and commits the synced copy separately as a reconciliation commit (Step 0 rulings Q10, Q11).

## Acceptance Criteria

Traceability:
- Plan-review findings: **R8** → AC-6, AC-8, AC-9; **R20** → AC-7; **R21** → AC-14.
- Stage F inputs (`loop-directive.md:70`): **(1)** → AC-4, AC-12; **(2)** → AC-10; **(3)** → AC-3; **(4)** → AC-5; **(5)** → AC-14; **(6)** → AC-4.
- Exit criterion "The goal skill and the loop-directive template reference it" (`charter.md:81`) → AC-2, AC-8.

### A. Goal skill — `plugins/foreman-line/skills/goal/SKILL.md`

- [ ] **AC-1 Placement and line stability (Q1).**
  - Lines 1–40, except 18 and 28, are unchanged in bytes and position.
  - Line 41 is empty and line 42 is `## Quick flags`.
  - The file has exactly one `## Quick flags` heading, and it is the file's last `##` heading.
  - From that heading to the end of the file there are at most 14 lines (Q8).
  - The frontmatter (lines 1–4) is untouched, so the synced `manifest.json` description stays accurate.
- [ ] **AC-2 Registry pointer (D1, D2″).**
  - The section names `${CLAUDE_PLUGIN_ROOT}/docs/QUICK-FLAGS.md` as the single, versioned source of truth for quick flags, and says its `Registry version:` line carries the version.
  - It says canon governs above the registry.
  - It contains V1 verbatim.
  - It restates no entry, alias, line format, conflict-table row or example line.
- [ ] **AC-3 Provenance and typed words (D9″, J-11).** The section:
  - contains V7 verbatim, followed by a sentence saying prose standing authorizations in the loop directive are governed by canon and registry §3, not by that sentence (this mirrors `QUICK-FLAGS.md:41`; see OQ-3);
  - says a quick flag counts only in a human-typed developer turn;
  - says the body of a skill or slash command is file content and carries no quick flags, naming both this skill and an expanded `/goal` command, and says only the words the human typed count;
  - says that where the typed words cannot be told apart from the expanded body, the body is treated as pasted content (registry §4, `QUICK-FLAGS.md:45`; triage J-11, `qf-p1-v2-review-triage-round2-2026-10-13.md:23`).
- [ ] **AC-4 Locations (registry §9).** The section names every home that §9 defines, and no other:
  - the loop directive's `Active restrictions` entry and its decision log;
  - before Gate 1: an `Active restrictions` entry in the draft charter, plus a decision-log section in the same file;
  - between Gate 1 and the loop directive: `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/restrictions.md`, a goal record and not charter text, holding the entry plus a decision-log section (`QUICK-FLAGS.md:228,244`).

  It says the owner carries the lines of every earlier entry (the draft charter's and `restrictions.md`'s) into the loop directive when it writes it (builder Step 0 ruling C1). It points to registry §9 for line format, writer, reading, lifting and lifetime. It states no carry rule for decision-log entries, because the registry defines none (F-2).
- [ ] **AC-5 Stage Zero, line 18 (lessons ledger, `defects_lessons.md:231`; Q15, OQ-1 ruled at lint).** Line 18 becomes exactly the text below, on one line. The only change is that ` applies.` becomes ` applies; and whether the goal will store any state beyond its prose standing authorizations and gate record: such stored state may only restrict, never grant or widen authority.`

  ```text
  1. Interrogate the concept: what does done mean; who consumes the result; what is deliberately out of scope; which constraints are non-negotiable; what existing canon (plans, conventions, contracts, lessons files) applies; and whether the goal will store any state beyond its prose standing authorizations and gate record: such stored state may only restrict, never grant or widen authority. Ask the developer in batches of numbered questions with a recommendation attached to each — propose, let them dispose. Never silently resolve a design question.
  ```
- [ ] **AC-6 Template pointer, line 28 (R8).** Line 28 becomes exactly the text below, on one line. The string `foreman-line-coordinator-loop.md` no longer appears in the skill.

  ```text
  Write `${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/loop-directive.md` modeled on `${CLAUDE_PLUGIN_ROOT}/templates/kickstarters/loop-directive-template.md`: ownership block (you are the owner, named by session ID and working copy; one goal, one coordinator; transfers only at parcel boundaries), resume command and integration branch, gate record, standing authorizations verbatim with contingencies, the queue in strict order, per-iteration algorithm, the `Active restrictions` entry and decision log (see Quick flags below), stop conditions, wakeup pacing, crash recovery.
  ```
- [ ] **AC-7 Term (D9″, R20).** The section holds exactly one sentence saying that builder Step 0 "flags", the issues the per-parcel cycle tells you to rule on, are not quick flags. No other added or edited line uses "flag"/"flags" without "quick" in front.

### B. Template — `plugins/foreman-line/templates/kickstarters/loop-directive-template.md` (new)

- [ ] **AC-8 Identity and house style.**
  - Line 1 is `# Loop Directive — TEMPLATE`.
  - An introductory block quote follows. It says to copy the file to `docs/goals/<GOAL-SLUG>/loop-directive.md` and fill every `<PLACEHOLDER>`. It names the `/goal` skill, `docs/COORDINATOR-PATTERN.md` and the registry `docs/QUICK-FLAGS.md`.
  - Every `<…>` field is an upper-case placeholder (Verification Plan command 9).
  - The file contains none of the project-scaffold clean-room patterns (`project-scaffold/tests/cleanroom.test.ts:26-35`) and no `CLAUDE_PLUGIN_ROOT`.
  - It is at most 110 lines (Q8).
- [ ] **AC-9 Sections (Q6).** The `##` headings are exactly these, in this order:

   ```text
   ## COORDINATOR OWNERSHIP — read before dispatching anything
   ## Resume and integration branch
   ## Who you are
   ## Gate record
   ## Standing authorizations
   ## Queue (strict order)
   ## Per-iteration algorithm
   ## Active restrictions and decision log
   ## Stop conditions
   ## Wakeup pacing
   ## Crash recovery
   ```

  - "Resume and integration branch" holds `/goal resume <GOAL-SLUG>` and `<INTEGRATION-BRANCH>`.
  - "Who you are" says the Coordinator consumes verification and never produces it, and names `charter.md`, `plan-review-findings.md`, `docs/COORDINATOR-PATTERN.md`, the `/goal` skill and `docs/QUICK-FLAGS.md`.
  - "Queue (strict order)" holds parcel placeholders in the charter's dependency order, and says a new parcel idea is stop-and-report.
  - "Per-iteration algorithm" says to read the ownership block, gate record, `Active restrictions` entry and `charter.md`, then run the `/goal` skill's per-parcel cycle. It has a placeholder for goal-specific additions, and says to update the state line at every parcel boundary.
- [ ] **AC-10 Ownership block (M-1/N-1, Q5).** The section is a block quote holding:
  - `<OWNER-SESSION-ID>`;
  - the owner's working copy as an absolute path, `<OWNER-WORKING-COPY>`;
  - the owner's integration-branch checkout, `<INTEGRATION-BRANCH-CHECKOUT>` (an absolute path, or the same as the working copy). These are the two copies the §9 Writer rule names (`QUICK-FLAGS.md:225`).
  - `<CLAIM-DATE>` and `<CLAIM-PROVENANCE>`;
  - the state line `<STATE>`, updated on every stop (`skills/goal/SKILL.md:40`);
  - the rules:
    - one goal, one coordinator;
    - ownership transfers only at parcel boundaries, by editing this block, and a transfer updates the session ID and both paths together;
    - if this block names another live coordinator, STOP and report, and never assume (`skills/goal/SKILL.md:13`, `COORDINATOR-PATTERN.md:73`).
- [ ] **AC-11 Gate record and standing authorizations (Q7).**
  - "Gate record" holds one sentence pointing to registry §3 and §8 for what an entry names, then `*(none yet)*`. It defines no entry format and contains no entry.
  - "Standing authorizations" says each authorization is the grant's verbatim prose with its scope and contingencies (`COORDINATOR-PATTERN.md:55`), granted by `<GRANTOR>` on `<GRANT-DATE>` and scoped to this goal only.
  - It says Gate 1 is never delegable and never appears there (`COORDINATOR-PATTERN.md:30,51`).
  - It says quick flags are not standing authorizations: none is written there, and none widens, reinterprets or revokes one (registry §3).
  - It has numbered placeholders for the Gate 2 grant, the Gate 3 grant and what is not granted.
- [ ] **AC-12 Active restrictions and decision log (Q4; input 1).** The section holds, in this order:
  1. Prose with no line starting with `- `. It says that the entry's line format, writer, reading, lifting and lifetime, and the decision-log entry format, are defined only in registry §9. It also says nothing in the entry can grant authority or loosen a restriction (registry §4).
  2. A sentence telling the owner, when this file is first written, to carry into the entry below the lines of every earlier entry: the draft charter's (written before Gate 1) and `docs/goals/<GOAL-SLUG>/restrictions.md`'s (written after it) (registry §9; builder Step 0 ruling C1 — "or" read literally could silently drop a restriction, and §9 reads each earlier entry as a copy until carried).
  3. The line `Active restrictions:` alone. The line after it is empty, so the entry holds no line (§9 boundary, `QUICK-FLAGS.md:216`; see OQ-2).
  4. The line `Decision log:` alone, followed by nothing but an empty line before the next heading.

  The template contains no restriction line, no example line, and no decision-log field line.
- [ ] **AC-13 Stop conditions, pacing, recovery.**
  - "Stop conditions" lists:
    - the universal set (`COORDINATOR-PATTERN.md:73`): a frozen contract needs modification; a tripwire fires twice on one parcel; a security finding cannot close in-parcel; anything outward-facing beyond the standing authorizations; queue empty or exit criterion met, where the final report names the human steps;
    - human gates are loop stop conditions, and the stop report names exactly what the human must do (`skills/goal/SKILL.md:36`);
    - a hook or goal condition phrased as a human action;
    - a placeholder for the charter's goal-specific stop conditions.
  - "Wakeup pacing":
    - says to use a long fallback while blocked on a running session, that completion is the primary wake signal, and never to poll;
    - says wakeup and resume prompts never carry quick flags (registry §4; see OQ-4).
  - "Crash recovery" carries the historical rule in harness-neutral words (`docs/kickstarters/foreman-line-coordinator-loop.md`, section "Crash recovery"):
    - on a wake while expecting a result, first check whether that session is still running;
    - no completion claim means process death, and unclaimed disk state is never accepted as done;
    - recover with a fresh session whose Step 0 restates the original directive, inventories disk, and stops for a ruling.

### C. Synced copy

- [ ] **AC-14 Mirror (R21, Q10).** `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md` equals the source after one substitution: every `${CLAUDE_PLUGIN_ROOT}` becomes `plugins/foreman-line`.
  - At the base, that substitution already maps the source to the mirror exactly (lines 8, 13, 19, 24, 28 differ only by it).
  - `manifest.json`, `.last-complete-round` and the bucket marker `skills/synced/.bucket-b1615d10-…` are unchanged.

### D. COORDINATOR-PATTERN.md

- [ ] **AC-15 Cross-reference (Q2).**
  - Lines 1–89 are unchanged. At most 5 lines are appended: an empty line, `## Quick flags`, an empty line, and one paragraph.
  - The paragraph:
    - names `plugins/foreman-line/docs/QUICK-FLAGS.md` as the versioned registry where developer quick flags are defined once, and says the `/goal` skill's Quick flags section points to it;
    - contains V1 and V6 verbatim;
    - says quick flags are not standing authorizations, which stay in the loop directive as verbatim prose with their scope and contingencies (`COORDINATOR-PATTERN.md:55`);
    - says that where the registry and this charter differ, this charter governs.

### E. Cross-cutting

- [ ] **AC-16 No waiver text (charter stop condition).** Across the four files, Verification Plan commands 5 and 6 pass. No added or edited sentence can be read as:
  - waiving, delegating or pre-authorizing any gate;
  - storing a grant;
  - widening, reinterpreting or revoking a prose grant;
  - letting a non-owner write goal records.

  Reviewers test this (Verification Plan, reviewer focus).
- [ ] **AC-17 Scope and hygiene.**
  - Against the build base, the changed or untracked paths outside the coordinator-owned paths are exactly the four Allowed Files. The coordinator-owned paths, all under `plugins/foreman-line/`, are `docs/goals/quick-flags/**`, `docs/goals/INDEX.md`, `docs/kickstarters/**` and `docs/specs/**`.
  - `docs/kickstarters/foreman-line-coordinator-loop.md` is unchanged.
  - Added lines carry no trailing whitespace, and every file ends with a newline.

## Out of Scope

- QF-P0: the authority-registry corpus amendment for these canon edits, and the before/after sweep diff. It is sequenced after QF-P2. QF-P2 neither runs nor touches `authority-registry/**` (Q12).
- QF-P3 (the structural conformance check) and the exit-step dry-read walkthrough.
- Any edit to `QUICK-FLAGS.md`, `charter.md`, `loop-directive.md`, `plan-review-findings.md`, the triage files, `SPEC-CONVENTION.md`, `STANDING-CONSTRAINTS.md`, the parcel-driven-development skill, or the historical `docs/kickstarters/foreman-line-coordinator-loop.md`.
- Adding the new template to `project-scaffold/src/manifest.ts`, or any other `project-scaffold/**` change (Q9). The manifest is curated code (`manifest.ts:1-5`), and it ships only the three existing kickstarter templates (`manifest.ts:161-174`).
- Any change to the synced snapshot other than the mirrored `goal/SKILL.md`. This covers `manifest.json`, `.last-complete-round`, the bucket marker, and every other mirrored skill.
- Writing any actual `Active restrictions` line, decision-log entry or gate-record entry, here or in any goal record.
- Defining a gate-record format, a home for the gate record before the loop directive exists (F-1), or a carry rule for decision-log entries (F-2).
- Push, PR, remote operations, status flips, registration and receipts.

## Context & References

- `plugins/foreman-line/docs/goals/quick-flags/`:
  - `charter.md`: Branch 13; D1 31; D2″ 32; D5″ 35; D9″ 39; D10′ 40; QF-P2 row 73; exit criterion 78-84 (the template-reference item is 81); stop conditions 94-100 ("readable as waiving a gate" is 98).
  - `loop-directive.md`: integration branch 8; `Active restrictions and decision log` 34-37 (the live entry uses `Active restrictions: *(none)*`); route-receipt ruling 59-60; Stage F record 66-72, with the QF-P2 inputs at 70.
  - `plan-review-findings.md`: R7 31; R8 32; R20 44; R21 45; waiver routes 56-60; triage of R8 at 81 and R21 at 90.
  - Triage: `qf-p1-v2-review-triage-round2-2026-10-13.md:23` (J-11); `qf-p1-v2-review-triage-round4-2026-10-14.md:8` (M-1, N-1).
- `plugins/foreman-line/docs/QUICK-FLAGS.md`: version 3; §2 authority 17; V1 21; V6 31; builder Step 0 disambiguation 35; V7 and the standing-authorization scoping 41; skill expansion 45; variants 58; §9 216-244 (entry boundary 216, Writer 225, Reading 226, before the loop directive 228, decision log 231-244).
- `plugins/foreman-line/docs/specs/done/QF-P1-quick-flags-registry.md`: Out of Scope (QF-P2's surfaces); AC-16 (`--resume`); AC-19 (the entry); the round-3 builder Step 0 rulings C4–C6 and the forwarding of `restrictions.md`.
- `plugins/foreman-line/skills/goal/SKILL.md`: 40 lines; resume 13; Stage Zero 16-20; loop directive 26-30; cycle 32; human gates 36; stop 40. `${CLAUDE_PLUGIN_ROOT}` appears at lines 8, 13, 19, 24 and 28.
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`: 89 lines; role 7; Gate 1 30; gate table 49-53; verbatim authorizations 55; two-review rule 69; universal stops and ownership 73; last section 87-89.
- `plugins/foreman-line/templates/kickstarters/{shaping,builder,reviewer}-template.md`: house style (lines 1-6 of each).
- `plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-loop.md`: the historical W0 directive (sections Ownership, Standing authorizations, Per-iteration algorithm, Queue, Loop-stop conditions, Wakeup pacing, Crash recovery). Read-only.
- `skills/synced/SKILL.md`: the snapshot is generated state; hand edits are a red flag; snapshot changes go in their own commit. `skills/synced/b1615d10-…/.last-complete-round` names `sdk-cli,claude-vscode`, so the sync tooling is outside this repo. `manifest.json:2` holds `lastUpdated`, and the `goal` entry's `name` is at line 6.
- `plugins/foreman-line/docs/transcripts/defects_lessons.md:231`: the lesson "stored state may only restrict", with its OPEN disposition naming QF-P2.
- `plugins/foreman-line/authority-registry/src/validate.ts:206-217`: the `coordinator-pattern` and `goal-skill` canon sources. `plugins/foreman-line/verification/src/d19-audit.ts:701-702`: path labels only.
- `plugins/foreman-line/shaping/src/emit.ts:43` (`deriveSessionSlug`); `plugins/foreman-line/shaping/src/self-check.ts:184` (`selfCheckDraft`).
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`: §4.7 surfaces 113-125; §4.8 Allowed Files 127-140.
- Builder Step 0 rulings (2026-10-14, coordinator session `01a139ff-f7bc-725c-808d-120548a55ef1`): C1 accepted (AC-4 and AC-12 item 2 carry the "every earlier entry" wording; the literal "or" could drop a restriction, against §9's each-entry-is-a-copy rule); A confirmed (`$B=41f80463`; the one commit above it adds only this goal's coordinator-owned build kickstarter, excluded by Verification Plan command 11); B confirmed ("version 3" in Context & References is a line citation, not a version number; no added text states a version number); D confirmed (the §9 Writer's second copy is a copy, not a home; AC-10 names both copies); E confirmed (AC-15 "this charter governs" used as written); F confirmed (the wakeup/resume quick-flag rule lives only in the template, per OQ-4); G accepted within AC-11's intent (the Gate record sentence reads "For what an entry must name to tie a charter revision to a ratification, see registry §3 and §8." then `*(none yet)*`; no format defined); H noted for reviewers only, no text change (reviewer focus (b) already covers the OQ-1/OQ-3 readings); L confirmed (the template names "the /goal skill" and uses no skill paths, keeping the clean-room grep at 0).

## Assumptions

- At the build base:
  - the goal skill has 40 lines and `COORDINATOR-PATTERN.md` has 89;
  - neither contains `--` followed by a letter;
  - `templates/kickstarters/` holds only the three templates;
  - the mirror equals the substituted source.

  Verification Plan commands 1, 7 and 8 re-check these.
- **Expected authority-registry drift, owned by QF-P0 (Q12).**
  - `goal-skill`: the excerpts of lines 18 and 28 sit at `authority-enforcement-registry.yaml:7443,7487,34815,34974`, and the fixture `authority-registry/tests/fixtures/pass-minimal.yaml` holds them at the same lines. They will mismatch, and the new section will be uncovered.
  - `coordinator-pattern`: the new section will be uncovered.
  - `d19-audit.ts:701-702` carries paths only and is unaffected.
- **Synced copy residual risk (Q10).** A later sync run from an older installed plugin could revert the mirror. The sync tooling is outside this repo, so QF-P2 cannot prevent that. The frontmatter is unchanged, so `manifest.json` stays accurate.
- The goal's integration branch is `feat/foreman-line-quick-flags` (`loop-directive.md:8`; `charter.md:13`).
- QF-P2 contributes only "The goal skill and the loop-directive template reference it" to the exit criterion (`charter.md:81`). Merging to the integration branch is Gate 3.

## Open Questions

These were found while authoring, after the Step 0 rulings. OQ-1 is raised; the ACs state the ruled text until lint decides. OQ-2 to OQ-4 are defaults already applied in the ACs, and each can be reversed at lint. F-1 and F-2 are gaps forwarded to the goal's exit report, not to QF-P2.

- **OQ-1 (RULED at coordinator lint 2026-10-14: fix accepted; AC-5 and Verification Plan command 3 carry the fixed wording).**
  - **The problem.** Read naively, "stored state may only restrict, never grant or widen authority" forbids the loop directive's prose standing authorizations, and arguably the gate record. Both are stored, and line 28 tells the Coordinator to write the authorizations (`COORDINATOR-PATTERN.md:55`).
  - **Ruling.** Use "…applies; and whether the goal will store any state beyond its prose standing authorizations and gate record: such stored state may only restrict, never grant or widen authority." The standing authorizations and gate record are canon-mandated prose (`COORDINATOR-PATTERN.md:55`), not quick-flag state; the lesson (D5″/D9″) targets quick-flag persistence.
- **OQ-2 (applied in AC-12; CONFIRMED at coordinator lint 2026-10-14).**
  - The template uses a bare `Active restrictions:` line, not the live directive's `Active restrictions: *(none)*`.
  - Reason: §9 grows the entry by appending `- ` lines after the label (`QUICK-FLAGS.md:216`). A `*(none)*` marker left beside written lines would misstate the entry to a naive reader.
- **OQ-3 (applied in AC-3; CONFIRMED at coordinator lint 2026-10-14).** The skill section scopes V7 with the sentence that prose standing authorizations are governed by canon and registry §3. Without it, V7 next to line 28 reads as voiding the standing authorizations line 28 asks for. The registry pairs the same two sentences (`QUICK-FLAGS.md:41`).
- **OQ-4 (applied in AC-13; CONFIRMED at coordinator lint 2026-10-14).** The template's "Wakeup pacing" section says wakeup and resume prompts never carry quick flags. The loop directive is the file the Coordinator reads when it writes those prompts (registry §4, `QUICK-FLAGS.md:44`).
- **F-1 (forwarded to the goal's exit report; Q7).** The registry gives no home for the gate record before the loop directive exists, yet Gate 1 always comes first. The template keeps an empty Gate record section.
- **F-2 (forwarded to the goal's exit report).** The registry tells the owner to carry restriction lines into the loop directive. It defines no carry rule for decision-log entries written before the loop directive exists (`QUICK-FLAGS.md:225,244`). AC-4 and AC-12 therefore state none.

## Verification Plan

Run from the worktree root. All commands use bash, GNU coreutils, PCRE grep and a UTF-8 locale. Set:

```sh
S=plugins/foreman-line/skills/goal/SKILL.md
M=skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md
T=plugins/foreman-line/templates/kickstarters/loop-directive-template.md
C=plugins/foreman-line/docs/COORDINATOR-PATTERN.md
B=<qf-p2 build base from the build dispatch>
SUB='s#\${CLAUDE_PLUGIN_ROOT}#plugins/foreman-line#g'
sec() { awk '/^## Quick flags$/{f=1} f' "$1"; }
NEW() { sed -n '18p;28p' "$S"; awk 'NR>40' "$S"; awk 'NR>89' "$C"; cat "$T"; }
```

Every command must give the stated result.

1. **Base shape.**
   - `git show "$B:$S" | awk 'END{print NR}'` → `40`.
   - `git show "$B:$C" | awk 'END{print NR}'` → `89`.
   - `git cat-file -e "$B:$T"` fails, because the template does not exist at the base.
2. **Goal skill line stability (AC-1).**
   - `diff <(git show "$B:$S" | awk 'NR<=40 && NR!=18 && NR!=28') <(awk 'NR<=40 && NR!=18 && NR!=28' "$S")` prints nothing.
   - `awk 'NR==41{print "["$0"]"} NR==42' "$S"` prints `[]` then `## Quick flags`.
   - `grep -c '^## Quick flags$' "$S"` → `1`, and `grep '^## ' "$S" | tail -n1` → `## Quick flags`.
   - `sec "$S" | wc -l` → at most `14`.
3. **Lines 18 and 28 (AC-5, AC-6).**
   - `diff <(git show "$B:$S" | sed -n 18p | sed 's/ applies\. Ask the developer/ applies; and whether the goal will store any state beyond its prose standing authorizations and gate record: such stored state may only restrict, never grant or widen authority. Ask the developer/') <(sed -n 18p "$S")` prints nothing.
   - `[ "$(sed -n 28p "$S")" = '<the AC-6 line, exactly>' ] && echo ok` → `ok`.
   - `grep -c foreman-line-coordinator-loop "$S" "$M"` → `0` for each.
4. **Section content (AC-2, AC-3, AC-4).** Here `<V1>` and `<V7>` stand for the verbatim texts in Constraints. Each of these gives at least `1`:
   - `sec "$S" | grep -cF '<V1>'` and `sec "$S" | grep -cF '<V7>'`;
   - `sec "$S" | grep -cF '${CLAUDE_PLUGIN_ROOT}/docs/QUICK-FLAGS.md'`;
   - `sec "$S" | grep -cF '${CLAUDE_PLUGIN_ROOT}/docs/goals/<goal-slug>/restrictions.md'`;
   - `sec "$S" | grep -cF 'Active restrictions'`, `sec "$S" | grep -ci 'decision log'`, `sec "$S" | grep -ci 'draft charter'`;
   - `sec "$S" | grep -cF 'not by that sentence'`, `sec "$S" | grep -ci 'pasted content'`, `sec "$S" | grep -cF '§9'`.
5. **No tokens or variants (constraint, AC-16).**
   - `grep -c -- '--[A-Za-z]' "$S" "$M" "$C" "$T"` → `0` for each.
   - This prints nothing:

     ```sh
     NEW | grep -inP '(^|[\s(*_`>])[-\x{2010}-\x{2015}\x{2212}]+\s*[*_`]*(blanket|blanke|asrec|ratify|merge-ok|dispatch-ok|dry|status|halt|resume|strict|review2|explain|brief|nopush)(?![A-Za-z0-9])'
     ```
6. **Term (AC-7).** `NEW | grep -niP '(?<!quick )(?<!quick-)\bflags?\b'` prints exactly one line, and that line contains `Step 0`.
7. **Mirror (AC-14).**
   - `diff <(git show "$B:$S" | sed "$SUB") <(git show "$B:$M")` prints nothing (the precondition).
   - `diff <(sed "$SUB" "$S") "$M"` prints nothing.
8. **COORDINATOR-PATTERN (AC-15).**
   - `diff <(git show "$B:$C" | awk 'NR<=89') <(awk 'NR<=89' "$C")` prints nothing.
   - `awk 'NR>89' "$C" | wc -l` → at most `5`.
   - `awk 'NR>89' "$C" | grep -c '^## Quick flags$'` → `1`.
   - `awk 'NR>89' "$C" | grep -cF` → at least `1`, for each of: V1, V6, `plugins/foreman-line/docs/QUICK-FLAGS.md`.
9. **Template (AC-8 to AC-13).**
   - `wc -l < "$T"` → at most `110`, and `head -n1 "$T"` → `# Loop Directive — TEMPLATE`.
   - `grep '^## ' "$T"` prints exactly the AC-9 list.
   - `grep -c 'QUICK-FLAGS.md' "$T"` → at least `1`, and `grep -c 'restrictions.md' "$T"` → at least `1`.
   - `grep -cx 'Active restrictions:' "$T"` → `1`, and `grep -cx 'Decision log:' "$T"` → `1`.
   - `awk 'p{print "["$0"]"; exit} /^Active restrictions:$/{p=1}' "$T"` → `[]`.
   - `grep -cE '\| *(scope|since|session|message):|^(date|quick flag|question|decision|recommended option|reversibility):' "$T"` → `0`.
   - `grep -oP '<[^>]*>' "$T" | grep -vP '^<[A-Z0-9][A-Z0-9 _/,.:;()-]*>$'` prints nothing.
   - `grep -cE 'KONE|kaseya|clinton\.morgan|atlassian\.net|plugins/foreman-line/|skills/goal/|skills/foreman-shaping/|docs/foreman-line/|CLAUDE_PLUGIN_ROOT' "$T"` → `0`.
   - Within the ownership section, `awk '/^## COORDINATOR OWNERSHIP/{f=1;next} /^## /{f=0} f' "$T"` contains each of `<OWNER-SESSION-ID>`, `<OWNER-WORKING-COPY>`, `<INTEGRATION-BRANCH-CHECKOUT>`, `<CLAIM-DATE>`, `<STATE>`, `STOP and report` and `parcel boundaries`.
10. **Hygiene (AC-17).**
    - `git diff --check "$B" -- "$S" "$M" "$C"` prints nothing.
    - `grep -c '[[:space:]]$' "$T"` → `0`.
    - `for f in "$S" "$M" "$C" "$T"; do tail -c1 "$f" | od -An -c; done` prints `\n` four times.
11. **Scope (AC-17).**
    - This prints exactly the four Allowed Files:

      ```sh
      X=(':(exclude)plugins/foreman-line/docs/goals/quick-flags' ':(exclude)plugins/foreman-line/docs/goals/INDEX.md' ':(exclude)plugins/foreman-line/docs/kickstarters' ':(exclude)plugins/foreman-line/docs/specs')
      { git diff --name-only "$B" -- . "${X[@]}"; git ls-files --others --exclude-standard -- . "${X[@]}"; } | LC_ALL=C sort -u
      ```
    - `git diff --name-only "$B" -- plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-loop.md` prints nothing.

After that come two independent frontier adversarial reviews, read-only (architecture/risk, `COORDINATOR-PATTERN.md:69`). Mandatory reviewer focus:

- **Naive reading (STANDING-CONSTRAINTS #9).** For each item below, write the wrong-but-literal reading and show that the text excludes it, or report it:
  - (a) Each of the four waiver routes (`plan-review-findings.md:56-60`), checked against the new text: a token or line in the loop directive grants authority; the Coordinator issues a quick flag in its own wakeup or resume prompt; a delegating quick flag combined with ratification passes Gate 1; a delegating quick flag covers a Gate 1 re-opened by triage.
  - (b) Line 18 or V7 read as voiding prose standing authorizations or the gate record (OQ-1, OQ-3).
  - (c) "Only what the human typed counts" read as letting pasted or expanded text carry a quick flag.
  - (d) The ownership block read as letting a session claim ownership by editing it in the middle of a parcel, or as naming only a session ID.
  - (e) The template's Standing authorizations, Gate record or `Active restrictions:` line read as a place to store a grant, or as pre-authorizing Gate 1.
  - (f) The COORDINATOR-PATTERN section read as placing the registry above canon, or as adding or removing a gate.
- Does any added text restate a registry definition (D2″) instead of pointing to it? Does any location the skill names differ from §9?
- Does the mirror differ from the source by anything other than the substitution?
- Can any existing `path:line` citation into the goal skill or COORDINATOR-PATTERN now point at different text?

## Allowed Files

The builder may modify exactly these paths. It writes only these, and never runs git add, commit or push:

- `plugins/foreman-line/skills/goal/SKILL.md`
- `plugins/foreman-line/templates/kickstarters/loop-directive-template.md` (new)
- `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`

This spec, its shaping-result artifact and its `docs/specs/INDEX.md` row are owned by shaping and are read-only to the builder. No glob, directory, related file or temporary artifact gives mutation authority.

## Shaping Provenance

- **Session.** Shaped on 2026-10-14 in worktree `agent-skills-qf-p2`, branch `qf-p2`.
  - No route receipt: this was a direct invocation under loop-directive ruling 2026-10-13.
  - Kickstarter: `docs/kickstarters/quick-flags-shaping-QF-P2.md`.
  - Model: Claude (Anthropic). The session cannot see its exact model ID or session ID, so the coordinator should confirm `claude-opus-5-5` from `PI_MODEL`, as Step 0 disclosed.
- **Step 0 rulings.** Q1–Q16 were answered by coordinator session `01a139ff-f7bc-725c-808d-120548a55ef1` on 2026-10-14, all accepted as recommended. Coordinator lint verified the Step 0 claims on disk and corrected two paths, which this spec cites: `verification/src/d19-audit.ts:701-702`, and `shaping/src/{emit.ts:43,self-check.ts:184}`.
- **Self-check, by hand.** The session had no shell. It checked the draft by hand against `self-check.ts`:
  - the five required sections are present and in order;
  - Out of Scope is non-empty;
  - no column-0 `##` line sits inside a fenced block.

  It also checked against `spec-linter/src/schemas.ts`: the required fields, the enum values, and `permission_profile` ∈ `PROFILE_NAMES` (`permission-profiles/src/types.ts:86`); `additionalProperties: false` is respected. The slug `qf-p2-quick-flags-integration` follows `deriveSessionSlug`.
- **Coordinator lint 2026-10-14 (session `01a139ff-f7bc-725c-808d-120548a55ef1`).** `selfCheckDraft` run on the coordinator machine: valid, no errors or warnings. Every factual claim in Step 0 and in this spec's Context & References was spot-verified on disk (registry citations and §9 line map, V1/V6/V7 text, charter/loop-directive/plan-review/triage lines, goal-skill and COORDINATOR-PATTERN line counts and citation lines, clean-room patterns, scaffold manifest, synced snapshot files, authority-registry excerpt lines, `deriveSessionSlug`/`selfCheckDraft` locations, lessons-ledger disposition). OQ-1 ruled (fix accepted); OQ-2/OQ-3/OQ-4 confirmed; F-1/F-2 forwarded to the exit report. Spec promoted `draft` → `active`; Gate 2 dispatch of QF-P2 is covered by the standing authorization (`loop-directive.md`, "Standing authorizations", item 1) contingent on this lint, which passed.
