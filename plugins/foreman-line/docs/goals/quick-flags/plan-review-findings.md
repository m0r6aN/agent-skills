# Plan-level adversarial review — quick-flags

**Reviewer:** fresh, read-only, zero-coordinator-context session (pi, `claude-opus-5-5`, high thinking, ephemeral). The `claude` CLI OAuth session had expired, so it was not used.
**Charter reviewed:** ratified `charter.md` at commit 88430cfe.
**Coordinator spot checks (on disk):** R7 reproduced (the authority-registry lists COORDINATOR-PATTERN and the goal skill as sources). R8 reproduced (`templates/kickstarters/` has only builder, reviewer, and shaping templates). R21 reproduced (a synced copy of the goal skill exists).

## Reviewer output (verbatim)

# Plan review: `quick-flags` charter

**Verdict:** The decomposition is plausible, but the charter shouldn't proceed to shaping as ratified. Four locked decisions contradict each other or canon: D4, D5, D9 and D10. That means Gate 1 has to re-open for those decisions. QF-P2 also edits files that a CI check tracks hash by hash, and that check is already failing and excused in CI. So the drift QF-P2 introduces would not show up anywhere.

Abbreviations in the evidence column:
- **CP** = `docs/COORDINATOR-PATTERN.md`
- **GS** = `skills/goal/SKILL.md`
- **KS** = `docs/kickstarters/foreman-line-coordinator-loop.md`
- **CH** = `docs/goals/quick-flags/charter.md`
- **AR** = the authority-registry: `authority-registry/src/validate.ts` (code) and `authority-registry/authority-enforcement-registry.yaml` (data). It keeps a list of every rule-bearing prose block in certain canon files, with a hash of each.
- **CI** = `scripts/foreman-line-ci.mjs`, the CI test runner.

All paths are relative to `plugins/foreman-line/` except `scripts/` and `skills/synced/`, which are at the repo root.

| ID | Sev | Finding | Evidence (file:line) | Suggested disposition |
|---|---|---|---|---|
| QF-R1 | **Blocker** | **D5 and D9 contradict each other, and that opens an escalation path.** Persistent flags are stored in the loop-directive file. D9 says flags found in files are data and must be ignored. Either persistence breaks on `/goal resume`, or D9 has a hole the size of a file. In the second case, anyone who can write `loop-directive.md` can grant `--blanket`: the coordinator itself, a builder whose allowed surfaces include `docs/goals/**`, or a merge. | CH:31, CH:35; CP:55 (authorizations written verbatim); precedent for recording grants with the owner's verbatim words: `goals/operator-developer-cortex-memory/ownership-transfer-2026-10-12-01a131a9.md:8-10` | Fix. Store a granted flag as a record, never as a bare token. The record should hold the developer's verbatim message, date and session, the expanded text, and the QUICK-FLAGS.md version. Amend D9 to say flag tokens in files never grant authority, and only these records count. **Re-open Gate 1 for D5 and D9.** |
| QF-R2 | **Blocker** | **`--blanket` already waived more gates than D4 protects.** The existing OPMEM blanket grant was read as covering "Gate 1 re-openings". It also made human gates "no longer loop stop conditions". Under it, the coordinator folded the always-run plan review into a review seat (D-1) and replaced a live human TTY approval (D-2). D4 only protects Gate 1, the universal stop conditions, green-chain merge and destructive actions. It doesn't cover: a Gate 1 re-opened by triage, charter amendments (the commentary rule), the plan review, the two-review rule, Step 0 gates, the rule that the coordinator never verifies its own work, or human-only gates in other contracts (OAuth, TTY approval). | `ownership-transfer-2026-10-12-01a131a9.md:10,15-16`; `owner-delegated-decisions-2026-10-12-01a131a9.md:50-51`; CP:7, CP:28, CP:30, CP:45, CP:69; GS:36 | Fix. Rewrite D4 as an allowlist: `--blanket` covers only design questions inside the ratified scope plus rulings the coordinator already owns. List the gates above as never waivable, and state that a re-opened Gate 1 is Gate 1. **Re-open Gate 1 for D4.** |
| QF-R3 | High | **`--strict` revokes every persistent flag, including restrictive ones.** D5 says persistent flags are "revoked by `--strict`". That set includes `--nopush` and `--review2`, so `--strict` lifts the push ban and drops the second review. It also revokes itself. This contradicts D6 ("the more restrictive flag wins"). | CH:31, CH:33, CH:56 | Fix. `--strict` revokes only the flags that delegate decisions (`--blanket`). **Re-open Gate 1 for D5.** |
| QF-R4 | High | **D10 makes push allowed by default.** D10 counts "anything touching shared remote state" as destructive, then says push is "covered by Gate 3 and `--nopush`". That reads as: push is fine unless `--nopush` is set. Canon is the opposite: anything outward-facing beyond the standing authorizations is a universal stop. This charter grants no push or PR at all. | CH:36, CH:62, CH:94; CP:73; KS:23 (push granted explicitly when it is allowed), KS:52 | Fix. Outward-facing actions are denied unless a standing authorization grants them. `--nopush` only narrows a push grant that already exists. **Re-open Gate 1 for D10.** |
| QF-R5 | High | **`--dispatch-ok` and `--merge-ok` aren't scoped the way canon requires.** "The named parcels" are named in the flag, not limited to the parcels the charter names. Canon scopes Gate 2 to the charter's parcels, and a new parcel idea is stop-and-report. The merge target is unspecified, so the flag could be read as covering main. The flag text drops "any red step voids it", which also leaves open whether the grant survives a red result on the next chain. | CH:47-48; CP:52-53, CP:55; KS:20; `authority-enforcement-registry.yaml:2129` (integration branch only; main/PR merges stay human; red voids) | Fix in QUICK-FLAGS.md (QF-P1): limit to parcels in the charter; name the merge target (integration branch only); carry "red voids it for that chain" verbatim. |
| QF-R6 | High | **Combining `--asrec` with `--ratify` turns Gate 1 into a rubber stamp.** At Stage Zero the open questions *are* the charter's decisions. `--asrec --ratify` in one message ratifies choices the developer never saw. This charter was itself drafted that way. `--ratify` also applies to the charter "as currently drafted", which may have changed since it was last shown. | CH:5-7, CH:43-46; CP:30 ("one party absent is neither mutual nor a decision") | Fix. Tie `--ratify` to a charter revision (commit or hash) shown in the previous coordinator turn. Refuse it in the same message as `--asrec` or `--blanket`, or if the draft has changed since it was shown. Define whether `--asrec` answering a Gate 2 or Gate 3 prompt counts as granting that gate. |
| QF-R7 | High | **QF-P2 edits files that a CI check tracks hash by hash, and that check's failures are already excused.** AR lists both `COORDINATOR-PATTERN.md` and `goal/SKILL.md` as canon sources, with a hash for every rule-bearing block. A new section produces `SOURCE_ITEM_UNCOVERED`; edited text produces `VALUE_DIGEST_MISMATCH`. The AR test is already failing in CI and is excused by a fixed list of 30–32 test names, including the full-corpus sweep test. So QF-P2's drift would land inside an already-excused failure and CI would stay green. Updating AR properly takes a separately reviewed corpus amendment plus a typed migration (R32 precedent), and AR is outside this charter's surfaces. | validate.ts:206-217, :4761-4766, :4775-4787; registry.yaml:6831-6840, :7314-7323; CI:494-525, :612-626 | Fix. Add AR to the surfaces as a sequenced step, or decide to stop if AR is treated as frozen-class. Require a before/after AR sweep diff as evidence for QF-P2. |
| QF-R8 | High | **QF-P2 targets a "loop-directive template" that doesn't exist.** `templates/kickstarters/` holds only the builder, reviewer and shaping templates. The goal skill models loop directives on `foreman-line-coordinator-loop.md`, which is a historical W0 directive (SEC-1 marked DONE, grants dated 2026-07-15). Adding a block to it rewrites a historical record. | `templates/kickstarters/` listing; GS:28; KS:18-23, KS:35-38 | **Missing parcel:** create a real loop-directive template and point GS:28 at it; leave KS alone. Or add this to QF-P2's scope and raise its risk class. |
| QF-R9 | Medium | **QF-P2 is classed lower-risk than QF-P1, though it does the more dangerous edit.** QF-P1 writes the flag semantics and is Risk (frontier builder, two reviews). QF-P2 is what makes them operative inside the canon (CP, GS, directives), yet it is Standard (mid-tier builder, one review). Wording errors that matter will land in QF-P2. | CH:68-69; CP:69 (two reviews for architecture/risk) | Fix. Reclassify QF-P2 as Risk with two reviews. |
| QF-R10 | Medium | **QF-P3's check has no home that avoids another goal's surfaces.** CI only discovers direct-child packages with a `package.json`. A new package has no entry in the pinned cost table, which switches the whole sweep back to round-robin sharding and endangers the "two heaviest suites are separated" test. The cost table belongs to the live `ci-fail-fast` goal (Gate 2 granted, Gate 3 human). Putting the check inside an existing package (e.g. spec-linter) crosses that package's goal's surfaces instead. | CI:207-215, CI:272-289 (comment "With all 30 discovered names priced…"); `scripts/foreman-line-ci.test.mjs:1851-1854`; `goals/INDEX.md:21` | Fix. Name QF-P3's home and allowed files now. If it's a new package, sequence a cost-table re-pin with the `ci-fail-fast` owner. |
| QF-R11 | Medium | **"No flag text claims to waive Gate 1" can't be checked mechanically.** That's a judgment about meaning, so this charter's own stop condition (a check that can't be made mechanical) will predictably fire. A banned-phrase grep also matches D4's own wording ("No flag can waive Gate 1"). | CH:70, CH:93 | Fix. Make the check structural: every entry has the required fields, and a gate-interplay field drawn from a closed list. Leave judgments about meaning to reviewers. |
| QF-R12 | Medium | **Single-source-of-truth (D2) conflicts with "verbatim" (CP) and with versioning.** CP requires standing authorizations in the loop directive verbatim. D2 forbids restating flag text. A stored `--merge-ok` token would therefore mean whatever QUICK-FLAGS.md says when it is read, so a later edit silently changes authority already granted. The Objective promises a "versioned" vocabulary, but no parcel defines versioning. The charter itself restates the flag text (CH:38-62), so "documented once" will trip on it. | CH:17, CH:28, CH:38-62; CP:55 | Fix. Give QUICK-FLAGS.md a version. A stored grant keeps the expanded text and that version. The "documented once" scope excludes goal records. **Re-open Gate 1 for D2.** |
| QF-R13 | Medium | **Existing grants written in prose aren't reconciled.** `ops-console-roadmap-authority.md` holds a blanket grant that spans three goals and includes merges and pushes. OPMEM has its own blanket grant. QUICK-FLAGS will define `--blanket` more narrowly using the same words. Nothing says whether those prior grants are now read through the new definition, or whether D9 retroactively invalidates them. | `goals/ops-console-roadmap-authority.md:10-21`; `goals/INDEX.md:15`; CH:33-35 | Fix. Add a statement to QF-P1: QUICK-FLAGS governs flag tokens only, and prose grants are neither reinterpreted nor revoked by it. |
| QF-R14 | Medium | **The flag provenance rule (D9) can't be enforced in this harness.** ScheduleWakeup and `/loop` resume prompts are written by the coordinator, and stop-hook feedback also arrives as a user turn. So the coordinator can effectively issue flags to itself. | CH:35; GS:32, GS:36; KS:10-14 | Fix. Define "developer message" as a turn typed by a human. Resume and wakeup prompts must never carry flags. **Re-open Gate 1 for D9** (together with QF-R1). |
| QF-R15 | Medium | **D5 doesn't classify 2 of the 14 flags, and `--review2` contradicts its own class.** `--halt` and `--resume` aren't classified (D8 lists 14 flags; D5 classifies 12). `--review2` is persistent, but its meaning is "the current parcel". | CH:31, CH:34, CH:57-58 | Fix. Mark both `--halt` and `--resume` as one-shot. Decide whether `--review2` lasts per parcel or per goal. |
| QF-R16 | Medium | **`--resume` doesn't match how the goal skill parses resume.** `/goal resume` requires an explicit slug. `<current-slug>` is undefined in a fresh session, which is the only time resume is needed. The flag rules live inside GS (D1), which isn't loaded without `/goal`, so a bare `--resume` has no parser. Guessing the slug from INDEX, which lists many concurrently owned goals, risks claiming the wrong queue. | GS:13; CH:28, CH:55; `goals/INDEX.md:15-24` | Fix. `--resume <slug>` with the slug required, or valid only inside a session that already owns the goal. Always run the ownership-block check. |
| QF-R17 | Medium | **No parcel owns the exit criterion's dry-read walkthrough.** The coordinator can't verify its own work. "Merged" is reachable only on the integration branch, and the "green in the repo's test chain" criterion means GitHub CI, which only runs on a PR or a push to main. Both are outward-facing, which this charter makes a stop condition. | CH:74-78, CH:84-86, CH:94; CP:7; GS:36; `.github/workflows/foreman-line-ci.yml:5-8` | Fix. Assign the walkthrough to a fresh adversarial reviewer as a named step. Restate the exit as: local deterministic pass, plus a stop report awaiting the PR and the merge to main. |
| QF-R18 | Low | **The conflict rule (D6) is not a total order.** Some pairs aren't comparable (`--review2` with `--blanket`, `--dispatch-ok` with `--dry`). Once `--strict` is persistent, a later `--blanket` always loses, and the "revoke" path isn't documented. | CH:32-33, CH:56 | Fix in QF-P1. Add a pairwise resolution table and the order in which flags apply over time. |
| QF-R19 | Low | **`--nopush` is ambiguous about local merges.** It lists "merge", but the Gate 3 grant is a local merge to the integration branch. It's unclear whether `--nopush` blocks that. | CH:62, CH:84-86 | Fix. Say explicitly that `--nopush` does not block local merges to the integration branch. |
| QF-R20 | Low | **"Flag" already means something in canon.** It's the term for an issue a builder raises at Step 0 ("rule on flags"). D9's "flags found in subagent reports… are ignored" could be misread as "ignore builder flags". | CP:7; KS:21; GS:32; CH:35 | Fix. Use "quick flag" consistently throughout. |
| QF-R21 | Low | **The synced copy of the goal skill isn't in QF-P2's surfaces.** `skills/synced/…/goal/SKILL.md` will drift. | `skills/synced/b1615d10-…/goal/SKILL.md:1-14` | Add the copy to QF-P2's surfaces, or record the drift as accepted. |
| QF-R22 | Low | **The branch is cut "off local main".** The parcel-driven-development skill requires bringing local main up to date with origin (`git pull --ff-only`) first. Also, INDEX has no `quick-flags` row, though its update rule calls for one. | CH:9; PDD skill "Branch and Worktree Hygiene"; `goals/INDEX.md:62-65` | Informational. Fix both at loop start. |
| QF-R23 | Info | **Every locked decision is effectively unexamined.** D1–D10 were drafted by taking the recommendation on each question and then ratified "as written". This review is the first time anyone has examined them one by one. | CH:5-7 | Accept as documented. Weight this triage accordingly. |

## Answers to the mandate questions

1. **Is the decomposition coherent?** Mostly. It's linear (QF-P1 → QF-P2 → QF-P3), but QF-P2 has the wrong risk class (QF-R9) and one of its targets doesn't exist (QF-R8).
2. **Are the parcel boundaries real?** QF-P1's is. QF-P2 and QF-P3 both reach into surfaces the charter doesn't name: the authority-registry (QF-R7) and the CI runner (QF-R10).
3. **Which parcel is missing?** Three are missing: a real loop-directive template (QF-R8), an adversarial walkthrough step (QF-R17), and the authority-registry corpus amendment (QF-R7).
4. **Which locked decision is load-bearing but unexamined?** D4. It was drafted as a list of what can't be waived, and shipped `--blanket` practice has already waived things outside that list (QF-R2).
5. **Where will parcels collide silently?** QF-P2's edits to the canon files sit inside the authority-registry failure that CI already excuses (QF-R7). QF-P3 runs into the `ci-fail-fast` goal's cost table (QF-R10).
6. **Can a flag waive Gate 1, stop conditions or destructive-action limits?** Yes, by four routes:
   - a flag token written into the loop directive (QF-R1);
   - the coordinator issuing flags in its own wakeup prompts (QF-R14);
   - `--asrec` combined with `--ratify` (QF-R6);
   - `--blanket` covering a Gate 1 re-opened by triage (QF-R2).
7. **Do the flags conflict with canon?**
   - `--merge-ok` drops "red voids it" and has no merge target (QF-R5).
   - `--resume` doesn't match the goal skill's parsing (QF-R16).
   - The one-shot/persistent split is unsound: two flags are unclassified, `--strict` loosens restrictions, and D2 conflicts with "verbatim" (QF-R3, QF-R12, QF-R15).

**Gate 1 re-opens needed for:** D2, D4, D5, D9, D10.

---

## Coordinator triage

| ID | Disposition | Action |
|---|---|---|
| R1, R14 | **Fix — re-opens D5, D9** | A granted persistent flag is stored as a record: verbatim developer message, date, session, expanded text, registry version. Flag tokens in files never grant authority. "Developer message" means a human-typed turn. Wakeup, resume, and hook-feedback prompts never carry flags. |
| R2 | **Fix — re-opens D4** | D4 becomes an allowlist. `--blanket` covers only design questions inside the ratified scope and rulings the coordinator already owns. It never covers: a Gate 1 re-opened by triage, charter amendments, the plan review, the two-review rule, Step 0 gates, self-verification, or human-only gates (OAuth, TTY approval). |
| R3, R15 | **Fix — re-opens D5** | `--strict` revokes only `--blanket`. Classify `--halt` and `--resume` as one-shot. `--review2` lasts for the current parcel. |
| R4, R19 | **Fix — re-opens D10** | Outward-facing actions are denied unless a standing authorization grants them. `--nopush` only narrows an existing grant. `--nopush` does not block local merges to the integration branch. |
| R5 | Fix in QF-P1 | Limit to the charter's parcels. Merge target is the integration branch only. "Red voids it" is carried verbatim. |
| R6 | Fix in QF-P1 | `--ratify` binds to a charter commit shown in the previous turn. It is refused in the same message as `--asrec` or `--blanket`, and refused if the draft changed. `--asrec` never grants a gate by answering a gate prompt. |
| R7 | **Fix — new parcel QF-P0** | Sequence an authority-registry corpus amendment (the R30 precedent) after QF-P2, plus a before/after sweep diff as evidence. Add the registry to the goal's surfaces. This is a risk parcel. |
| R8 | **Fix — scope** | QF-P2 creates a real `templates/kickstarters/loop-directive-template.md` and points the goal skill at it. The historical kickstarter is left untouched. |
| R9 | Fix | Reclassify QF-P2 as risk: frontier builder, two reviews. |
| R10, R11 | Fix | QF-P3's check is structural only (required fields, closed gate-interplay list, goal-skill references the registry). It lives inside an existing package, to be named at shaping and with no new package. Judgments about meaning go to reviewers. |
| R12 | **Fix — re-opens D2** | QUICK-FLAGS.md is versioned. A stored grant keeps the expanded text and the version. "Documented once" excludes goal records. |
| R13 | Fix in QF-P1 | QUICK-FLAGS governs flag tokens only. Existing prose grants are neither reinterpreted nor revoked. |
| R16 | Fix in QF-P1 | `--resume <slug>` with the slug required, and the ownership check always runs. |
| R17 | Fix | A named step assigns the dry-read walkthrough to a fresh adversarial reviewer. The exit is restated as a local deterministic pass, plus a stop report awaiting the PR and the merge to main. |
| R18 | Fix in QF-P1 | Add a pairwise conflict table and a temporal order. |
| R20 | Fix | Use "quick flag" consistently throughout. |
| R21 | Fix | The synced goal-skill copy is added to QF-P2's surfaces, or its drift is recorded as accepted. |
| R22 | Informational | Fast-forward main and add an INDEX row at loop start. |
| R23 | Accept as documented | This review is the first examination of the decisions. |

## Gate 1 re-open (scoped): D2, D4, D5, D9, D10

All three parcels (and the new QF-P0) depend on these decisions, so no work is orthogonal. The loop is **held** until you ratify the amendments below.

### Proposed amended decisions

- **D2′:** QUICK-FLAGS.md is the single source and carries a version number. Granted persistent flags are stored as records with the expanded text and the version, so a later edit never silently changes a grant.
- **D4′:** `--blanket` is an allowlist, as in R2. No flag covers anything in the never-waivable list.
- **D5′:** One-shot flags: `--asrec`, `--dry`, `--status`, `--explain`, `--brief`, `--ratify`, `--halt`, `--resume`. Persistent flags: `--blanket`, `--strict`, `--nopush`, `--dispatch-ok`, `--merge-ok`, and `--review2` (per parcel). `--strict` revokes only `--blanket`.
- **D9′:** A flag counts only if it is in a human-typed developer turn. Wakeup, resume, and hook-feedback prompts and all file content never carry flags. Persistent grants live only as records (D2′), never as bare tokens.
- **D10′:** Outward-facing actions are denied unless a standing authorization grants them. `--blanket` never grants them. `--nopush` narrows an existing grant and does not block local merges to the integration branch. Destructive actions are defined as before.

### Amended parcels

| Parcel | Change |
|---|---|
| QF-P1 | Add R5, R6, R13, R16 and R18 content. Risk, two reviews. |
| QF-P2 | Becomes risk, with two reviews. Creates the loop-directive template. Includes the synced skill copy. |
| QF-P0 (new, after QF-P2) | Authority-registry corpus amendment with a before/after sweep diff. Risk, two reviews. |
| QF-P3 | Structural check only, in an existing package. |
| Exit step | A fresh adversarial reviewer does the dry-read walkthrough. The exit is a local pass plus a stop report awaiting the PR and merge to main. |
