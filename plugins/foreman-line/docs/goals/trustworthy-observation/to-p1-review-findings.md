# TO-P1 independent architecture findings and corrective rulings

Reviewed code: ac406ecc2c21bcd2d6c539b4d3ff948c3759462b. Independent deterministic201/201, type/lint/D19/read-only PASS did not constitute acceptance. Two fresh reviewers request changes. No required finding is waived.

| Finding | Disposition | Required correction |
|---|---|---|
| A1 optional-outer-pipe Markdown tables fabricate grants/conflicts | FIX | Exclude actual table header/delimiter/body blocks; escaped/code-span pipe handling; preserve non-table pipe metadata; stop multiline record joining at table boundaries. |
| A2/B1 direct conditional/revoked grants | FIX | Anchored grant-targeting delimiter/parenthetical/only-if/subject-to conditions and explicitly current Gate1 revocation, including connective but, must unknown; preserve unrelated review/Gate2/3/parcel/quoted/link controls. |
| A3 full-document actual public compatibility | FIX | Full unchanged charter+directive scanGoal coverage for current FOC/TO/CFF/W4. Noneligible benign positive corroboration confers no authority and no veto; preserve eligible negatives and current qualification/revocation conflicts. Header excerpts are not full-record proof. |
| O-A1 indented code | Documented grammar limitation | Accepted RAT explicitly mandates fences/quotes, no indented-code exclusion. Unchanged here; no silent expansion. |

## Corrective Step0 dispositions before code

Builder halted, restated only src/ratification.ts and tests/ratification.test.ts within exact nine Allowed Files. Authorized after this record commits. No helper, dependency, API/UI, audit or historical-document rewrite. Full existing tracked goal documents may be read from tests and copied into isolated IO fixtures; no original mutations.

These implement accepted RAT and actual-record AC, not new grant grammar. Unsupported current qualification/revocation/supersession is an unknown veto; benign ineligible positive corroboration/descriptive authority prose is not itself such a qualification and cannot veto a supported A grant. Without any supported grant, benign text alone still means unknown. Existing tests that mistake benign ineligible corroboration for a veto must be corrected to the contract, with paired true current-denial/qualification tests retained. No broad document-wide keyword scan. Direct grant-targeting only-if/subject-to/parenthetical or explicitly current Gate1 revoked clauses are the accepted unsupported-current-qualification rule, not authority-token additions. Actual table delimiter structure governs table exclusion; an arbitrary narrative pipe is insufficient.

Deeper synthesis execution retained because repeated preferred artifacts failed load-bearing lexer closure and fresh review found structural grammar/eligibility issues. Preferred routine work remains first choice; no frontier cheap-classifier simulation. Runtime usage of reasoning sessions unavailable. Rework requires independent full deterministic pass, both exact-head re-reviews, then full required CI. CI38076183364/38076179708 canceled on rejected head to avoid wasted compute; no protections bypass.

## Review A

Independent TO-P1 architecture/security review A

Revision reviewed: ac406ecc2c21bcd2d6c539b4d3ff948c3759462b
Worktree: /home/cmorgan76/Work/foreman-to-p1
Baseline: 709dd4fb
Decision: REJECT / REQUEST CHANGES. Three required findings below remain open.

Method and scope
Fresh repo/canon review, not implementation acceptance. Read repository/plugin AGENTS, code-review-and-quality skill, goal skill and parcel mechanics, trustworthy-observation charter, active TO-P1 spec, preactivation rulings, accepted RAT/ATT amendment, five source diffs and four allowed test paths. Reviewed independent verifier summary (201/201 tests, type/lint, unchanged D19 and read-only controls PASS); did not equate deterministic PASS with architecture acceptance or repeat the full suite. Ran bounded pure-reader probes using actual tsx runtime and read-only actual public charter/directive bytes. No tracked edits, commits, fixture mutations, approval requests, link recursion, authorization claim or simulated classifier review. HEAD and tracked-clean status confirmed after inspection.

R-A1 REQUIRED: Markdown tables without outer pipes become current evidence.
Location: plugins/foreman-line/ops-console/src/ratification.ts:120 (also multiline boundary at154).
Confidence: high; reproduced.
Input charter, exact lines:
1 Current | Evidence
2 --- | ---
3 Status: RATIFIED | sample
Directive: ## Queue
Actual: granted; grant evidence charter line3. Expected: unknown, no supported current grant, because all three lines form a Markdown table and RAT explicitly excludes tables. A table header `Status: RATIFIED | Notes` with separator `--- | ---` similarly grants from line1. Conversely a real line1 Status:RATIFIED followed by the same table containing line4 `Status: NOT RATIFIED | sample` becomes unknown rather than granted.
Impact: excluded tabular examples can fabricate grants or false conflicts, bypassing the core current-record boundary. This is independent of indented-code policy.
Recommendation: recognize table blocks via delimiter-row structure, including optional outer pipes, and exclude their header/body records before consuming firstStatus or collecting evidence. Respect escapes/code spans rather than indiscriminately excluding every narrative pipe. Apply same boundary to multiline emphasis joining. Add grant and denial table tests through pure reader and scanGoal, preserving source lines for remaining evidence.

R-A2 REQUIRED: Explicit qualification of the current grant can be accepted as unconditional.
Location: plugins/foreman-line/ops-console/src/ratification.ts:37-73, especially40-44; acceptance at186-194.
Confidence: high on demonstrated behavior and direct grant scope.
Input charter line1: Status: RATIFIED (conditional on funding)
Directive: ## Queue
Actual: granted with line1 grant evidence. Expected: unknown with unsupported evidence. The parenthetical is an immediate conditional qualification of RATIFIED, not a review/parcel/Gate2/3 statement. Accepted RAT says unsupported qualification targeting that grant is unknown, and active spec requires conditional evidence about the current grant to yield unknown. Bracketing it with parentheses does not make the statement unconditional.
Additional reproduced direct scope case: `Status: RATIFIED — granted only if funding is approved` also returns granted. Control `Status: RATIFIED; Gate 1 is revoked` correctly returns unknown, whereas `Status: RATIFIED; but Gate 1 is revoked` returns granted despite explicitly targeting Gate1.
Impact: conditional or revoked current grant can be presented as granted, defeating conservative reconciliation.
Recommendation: conservatively classify direct parenthetical/current-grant qualification and explicitly targeted current Gate1 clauses as unsupported. Keep unrelated review, Gate2/3, scoped parcel, quote and link clauses excluded; do not introduce a document-wide condition-word scan. Add paired direct-grant and unrelated-review tests. If bounded accepted vocabulary must be refined, coordinator must explicitly disposition that refinement before implementation.

R-A3 REQUIRED: Header-only public compatibility tests conceal actual full-record failures.
Location: plugins/foreman-line/ops-console/src/ratification.ts:185-191 and196-197; tests/ratification.test.ts publicHeaders/scanGoal public supported loop.
Confidence: high; reproduced from actual unchanged repository documents.
Full charter plus directive bytes read with readRatification:
- trustworthy-observation returns unknown: grant charter line6; unsupported line99 `- **Gate 1:** D1–D8, TO-P0–TO-P7 graph, and exit criterion explicitly ratified` under the current standing-authorizations section. This corroborating record is converted into unsupported conflict evidence despite the supported metadata grant.
- foreman-ops-console returns unknown: grant charter line7; unsupported positive record at line106 `- Gate 1: **GRANTED 2026-09-16 (owner).** ...` under `## Ratification record`. Its heading cannot establish dialect B, but this corroboration poisons the valid dialect A grant.
- ci-fail-fast also returns unknown: grant line6, positive Gate1 corroboration marked unsupported at line150 under `## Human gates and standing authority`.
- w4-closeout full charter/directive returns granted.
Active spec AC requires actual supported public records, specifically current trustworthy-observation and foreman-ops-console, to read granted. Existing tests construct a replacement charter containing only a selected abbreviated Status header plus Objective, removing the records that produce unknown. They prove excerpt recognition, not actual-record compatibility.
Impact: live supported goals falsely report unknown, accrue ratificationUnknown attention and the new reconciliation remedy. It weakens the claimed compatibility evidence despite all201 deterministic tests passing.
Recommendation: add unchanged complete-document compatibility evidence through scanGoal for the named goals. Reconcile supported metadata grants with non-eligible positive corroboration and unsupported benign descriptive Gate1 records without permitting those records to establish a grant. Preserve actual negative/conditional/revocation conflicts. Do not rewrite public records to satisfy the lexer. If canon's unsupported-evidence interpretation conflicts with the explicit real-record AC, surface a narrow coordinator ruling rather than silently changing either requirement.

Other reviewed behavior
- Lexer stays isolated and pure, consumes only supplied two-source records, performs no timestamp winner/reference recursion, preserves original one-based evidence lines and null failure lines, and does not authenticate authority.
- Original bullet/bold eligibility is checked before normalization; first eligible Status and firstH2 tracking, anchored negatives at any eligible position, equal/higher-heading lifetime and parent exclusion lifetime are implemented and covered meaningfully.
- Fences, leading-pipe tables, blockquotes, quoted/link tokens and standalone bounded historical-note markers have meaningful probes/tests. The table caveat is R-A1.
- Multiline emphasis consumes each continuation once; unmatched/boundary behavior is conservative for tested forms. No measured hostile-input hang or obvious exponential regex path found in bounded inspection. Input reads remain synchronous/unbounded as existing scan behavior; designated-document size bounds belong to later work.
- Missing optional charter is unknown; required unreadable/missing directive preserves scanGoal null. Actual locators are configured-root-relative, additive evidence shape retained. Symlink/realpath designated-document policy is outside P1.
- ATT counter/activity arithmetic is correct, including empty/all-complete/closed narratives, and remedy is exactly one goal-level unknown remedy in inspect/reconcile, owner, park order. Pending remedy function unchanged; commands withheld for unknown.
- Exactly five implementation and four test paths differ under ops-console against named baseline. No API/UI/routes/helpers/audit/deps edits. Coordinator documentation changes are distinct from implementation scope.

Optional O-A1: Indented code remains a known grammar limitation. A four-space-indented Status can normalize into a record, but accepted canon did not mandate an indented-code exclusion and the task explicitly preserves that behavior. No required finding or invented contract change; consider a future separately governed grammar amendment if needed.

Required-finding ledger: R-A1 OPEN; R-A2 OPEN; R-A3 OPEN. No required finding accepted-as-documented or closed in this review. Re-review exact corrected head required before acceptance.

## Review B

Independent TO-P1 architecture/risk review B
Revision: ac406ecc2c21bcd2d6c539b4d3ff948c3759462b
Worktree: /home/cmorgan76/Work/foreman-to-p1
Decision: REJECT pending required correction below.

Review basis: repository/plugin AGENTS, goal and parcel-driven-development canon, code-review-and-quality workflow, Coordinator pattern, standing constraints, active TO-P1 spec including committed preactivation/Step0 dispositions, accepted observation-contract-amendment RAT/ATT, nine allowed source/test files and their surrounding integration callers. Independent verifier summary consumed: actual 201/201, typecheck/lint and unchanged D19/read-only controls PASS. I did not rerun its full suite. Scope diff under ops-console is exactly five source and four test files; coordinator directive/log records outside console are separately visible. No reviewer source edits or commits.

Required finding B1 (high): direct conditional grants are incorrectly accepted when a semicolon or a short qualifier prefix separates the condition from RATIFIED.
Location: plugins/foreman-line/ops-console/src/ratification.ts:37-73, specifically punctuation normalization at 40-44 and provenance-only qualification carry at 48-54.
Exact inputs, each placed alone at charter.md line 1:
  Status: RATIFIED; if funding is approved
  Status: RATIFIED — only if funding is approved
Directive:
  ## Queue

  **Goal complete — queue empty**
Both are unequivocally anchored current goal ratification records whose grants depend on funding. RAT amendment line 18 requires a leading positive qualified by if/unsupported qualification targeting that grant to produce unknown. No historical, quoted, review, Gate 2/3 or parcel context exists. This is not a proposal to scan arbitrary prose for condition words.

Actual reproduction: imported shipped scanGoal, goalStatus and remediesFor through node --import tsx, created real temporary docs/goals/conditional/{charter,loop-directive}.md, supplied an actual configured temp root and alias.2 tree label. For both inputs scanGoal returns granted with evidence kind grant, line 1, configured root and docs/goals/conditional/charter.md. goalStatus returns active:false, ratificationUnknown:0, total:0; remediesFor returns []. Required outcome is unknown, active:true, unknown count/total 1, exactly one goal-level ratification-evidence remedy. Temporary directories were removed. Separate direct readRatification calls confirmed identical results.

Cause: a semicolon is not removed by initial punctuation normalization. The later loop only checks a clause for a qualification when its immediately preceding clause was explicit owner/date provenance. A first clause containing only punctuation sets no provenance, so a direct '; if' escapes. 'only if' likewise fails the start-anchored qualification vocabulary. The current tests exercise immediate if/provided and owner/date continuation but omit these direct conditional forms. Fix within allowed reader/tests; retain review/Gate2/Gate3/parcel/quoted conditions as irrelevant. Add meaningful end-to-end regression assertions on ratification plus attention/activity/remedy, not only token helper behavior. 'Status: RATIFIED — subject to owner confirmation' also directly reproduces granted; the same unsupported-current-qualification requirement applies, but the first two cases alone establish the blocker without expanding the canonical token vocabulary.

Other reviewed boundaries:
- readRatification is isolated and pure; scanGoal reads only current selected-tree charter/directive and follows no reference links. Evidence uses actual config.repoRoot and path.relative component containment; treeConfigFor correctly switches repoRoot to tree.root before API projection. Alias labels remain legacy refs rather than filesystem paths. Native and initiative locator tests intentionally pass alias.2 and assert actual paths. This parcel does not implement DOC's later realpath/document-reader surface; I do not demand that separate scope here.
- Required directive read failures still return null before constructing GoalRecord, consistent with activation ruling and TO-P2 ownership. Optional charter ENOENT is missing; other IO errors unreadable; both retain discoverable unknown goal with null evidence line. Tests use actual deletion and directory replacement, not injected happy-path IO.
- All supported anchored negative positions are collected across both sources; positive eligibility does not suppress later denials. Conflict, unsupported, missing and unreadable evidence prevent granted/pending. Source lines are one-based and preserve multiline originating lines. Parent excluded-heading lifetime and heading reset are explicitly exercised.
- goalStatus correctly derives 0/1 unknown, adds it to total, and forces active independently of narrative/empty/complete queue. Existing pending computation and pending remedy remain unchanged. Unknown remedy uses existing shape, parcel:null, cause ratification-evidence, ordered reconcile/owner/park branches, actual source locators, and empty commands on every branch.
- Source/API changes are additive. No route/state/schema/registry/permission/write authority or invocation/audit mutation was introduced. Text explanations make no authenticated authority claim.
- Tests meaningfully cover real supported public header excerpts through scanGoal (foreman-ops-console, ci-fail-fast, w4-closeout, trustworthy-observation), exclusions, failure IO, cross-source conflict, source/line identity, attention and remedy. Green suite does not cover B1. The w4 historical-note test adds a hostile denial after the real marker rather than rewriting the public record.

Optional findings: none independently established that warrant scope expansion. The explicit indented-code ruling is preserved; no extra exclusion is demanded. I do not treat the 34 shaping corpus candidates as verified facts or require a new parser grammar beyond RAT.

Review exit control: HEAD remains ac406ecc2c21bcd2d6c539b4d3ff948c3759462b; git status --short empty. No tracked changes, commits, record rewriting, or fixture mutation by reviewer. Saved only this /tmp report.
