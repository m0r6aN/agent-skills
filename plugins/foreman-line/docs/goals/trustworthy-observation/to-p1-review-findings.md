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

## Exact-head re-review929bb772 and residual A1 rulings

B independently accepts929bb772 after24 bounded probes; A closes A2/A3 but keeps A1 OPEN. A reports valid one-hyphen delimiter and no-pipe/missing-cell table body still fabricate grant/conflict. Coordinator separately checked official primary GFM tables Examples199/202 at https://github.github.com/gfm/#tables-extension-; accepted table exclusion already covers these forms, no token/authority expansion. No required finding waived.

Residual builder Step0 stopped before writes, exact parser/test only. Ruling: delimiter cells accept one-or-more hyphens; no-pipe body continuation remains excluded until blank or an actual bounded block-start. Implement the existing ATX/fence/blockquote starts plus unordered/ordered-list and thematic-break starts, with paired table-end genuine-record tests. Preserve header eligibility, narrative/escaped/code pipes and multiline exclusion. No indented-code, HTML-content or setext-heading parser expansion is authorized without concrete required reproduction against accepted record grammar. HTML/setext are flagged grammar boundaries beyond the existing bounded reader; do not claim a full GFM parser. The demonstrated table forms and list/thematic boundaries are concrete current-table mechanics; future unsupported block forms require an explicit evidence-backed ruling rather than invented complete-language support.

Deeper same parser execution remains justified; source/test only, no dependency or historical changes. Independent full pass and both exact-head reviews required.

### Re-review A

Independent TO-P1 architecture/security re-review A

Exact HEAD: 929bb772c44481dbf58d22b06af29f656c392b1c
Worktree: /home/cmorgan76/Work/foreman-to-p1
Decision: REJECT / REQUEST CHANGES. R-A1 remains OPEN; R-A2 and R-A3 CLOSED.

Re-read corrective ruling to-p1-review-findings.md and source/test diff from rejected ac406ecc. Confirmed only ratification.ts and ratification.test.ts console paths changed; mechanical final import order does not alter parser behavior. Consumed independent actual235/235,type/lint,D19/read-only/probe report including historical lint failure and final mechanical-only pass. No full-suite repetition. Ran11 bounded pure-reader original/paired/new probes and actual full-document scanGoal for all4 required public goals. No source/test/record edits, commits, link following, authorization claims or simulated classifier review. Exact HEAD and clean tracked status confirmed.

R-A1 OPEN — original examples fixed, standard table boundary gaps remain.
Confidence: high; reproduced on exact HEAD and checked against primary GFM documentation.
Code: plugins/foreman-line/ops-console/src/ratification.ts:96 and110.

Remaining repro1 (charter exact lines; directive is ## Queue):
1 Current | Evidence
2 --- | ---
3 Status: RATIFIED
Actual: granted, evidence grant line3. Expected: unknown, no grant: line3 remains a table body row with the missing second cell padded empty, not a new standalone Status record. Current tableLines stops merely because that body row lacks a pipe (line110).

Remaining repro2:
1 Current | Evidence
2 :-: | -:
3 Status: RATIFIED | sample
Actual: granted, evidence grant line3. Expected: unknown, no grant. Valid table delimiters may have one hyphen; current line96 requires three.

Remaining repro3 demonstrates false conflict as well:
1 Status: RATIFIED
2 Current | Evidence
3 --- | ---
4 Status: NOT RATIFIED
Actual: unknown, grant line1 plus denial line4. Expected: granted, only true current grant line1; line4 is a missing-cell table row.

Primary verification: https://github.github.com/gfm/#tables-extension-
Example199 shows the valid one-hyphen :-: alignment delimiter. Example202 explicitly renders an unpiped `bar` continuation line as a table row with empty second cell. The documented table break is an empty line or another block-level structure, not lack of a pipe. This source was consulted only to verify concrete Markdown table semantics; accepted RAT already mandates exclusion of tables. No request to add full GFM parsing or broaden indented-code policy.

Impact: table contents can still fabricate a current grant or negative conflict, despite new structural exclusion coverage. Therefore A1 is partially corrected, not closed;235 deterministic passes do not cover these forms.
Recommendation: permit supported delimiter cells containing one-or-more hyphens, and preserve body scope across missing-cell/no-pipe continuation rows until an actual table-ending boundary. Add both false-grant and genuine-grant/table-denial controls through pure reader and scanGoal. Preserve genuine Status after a blank line/heading, narrative pipes, escaped/code-span pipes, and multiline-emphasis table boundary behavior. No extra implementation file/dependency or historical rewrite is required.

A1 correction evidence already successful: original `Current | Evidence\n--- | ---\nStatus: RATIFIED | sample` now unknown with no evidence. Original real Status followed by a table denial with a pipe now granted, only line1 grant. Original optional-outer-pipe header grant is covered by meaningful new tests. These successes do not resolve remaining forms above.

R-A2 CLOSED on exact head.
Direct original repro `Status: RATIFIED (conditional on funding)` now unknown with unsupported line1. `Status: RATIFIED — granted only if funding is approved` and `Status: RATIFIED; but Gate 1 is revoked` likewise unknown. Paired `Status: RATIFIED; review is conditional; if funding is approved` remains granted. Genuine anchored denial still conflicts; bare in-section Gate1 positive still cannot grant alone. New end-to-end tests assert the corrected direct conditional inputs force active,unknown1,total1 and one null-parcel ratification-evidence remedy in reconcile/owner/park order. Review/Gate2/3/parcel/quoted clauses remain meaningful paired controls. This follows pre-code ruling and accepted direct-current-qualification scope.

R-A3 CLOSED on exact head.
Direct read-only scanGoal of complete unchanged charter+directive for foreman-ops-console, trustworthy-observation, ci-fail-fast and w4-closeout all returns granted. New tracked full-source tests read original documents (not truncated replacements), compare full pure-reader result to scanGoal evidence, and establish genuine required compatibility. Benign ineligible positive/descriptive corroboration confers no grant alone and no unsupported veto, as explicitly dispositioned before code. Paired tests preserve true denial, revoked and direct conditional conflicts. No actual public record rewritten. The prior long hostile case correctly becomes pending because no positive is eligible after firstH2; new500-denial case begins with genuine eligible metadata and still produces unknown with1grant and500denials. Equal-level B-end unknown test still proves lack of grant, not a fabricated conflict.

Architecture/security/performance assessment of correction
The lexer remains pure and isolated. Table helper precomputes exclusions and uses escaped-character/code-run accounting without dependencies or filesystem effects; qualifier helper tracks direct/provenance scope without document-wide condition scans. No obvious new exponential path found in bounded source inspection. All other original source boundaries, attention/activity arithmetic, pending remedy, source failures/locators and authority/read-only limitations are unchanged. Indented-code handling remains optional documented limitation O-A1, not a mandatory exclusion. No optional finding promoted into contract scope.

Required ledger: R-A1 OPEN (two residual standard table forms; three exact repros); R-A2 CLOSED; R-A3 CLOSED. No waived blocker. Overall exact-head architecture acceptance withheld pending narrow A1 correction and independent verification/re-review.

### Re-review B

Independent TO-P1 exact-head architecture/risk re-review B
HEAD: 929bb772c44481dbf58d22b06af29f656c392b1c
Worktree: /home/cmorgan76/Work/foreman-to-p1
Decision: ACCEPT this parcel's reviewed implementation at this exact head.

Required findings: B1 CLOSED; independently checked A1/A2/A3 corrections CLOSED. No new required or optional finding established by this bounded re-review. This is architecture acceptance, not authorization to merge or a goal-completion claim.

Basis: original fresh independent review/canon retained; reread committed corrective rulings in to-p1-review-findings.md, complete corrected reader, corrective test additions and scope diff. Rulings commit3f6 predates implementation4b55. Head929 only mechanically organizes imports/consolidates type imports in ratification.test.ts; no assertions, parser, fixture, or other source changes from independently verified4b55. Independent verifier's actual235/235/typecheck/unchangedD19/read-only controls and exact-head lint PASS consumed with its explicit import-only carry-forward limitation. No redundant full suite run.

B1 and A2 closure:
Executed actual scanGoal + goalStatus + remediesFor through shipped node/tsx imports with real temporary configured docs/INITIATIVES/g files and alias.2 tree label. Nine direct conditional/revocation statements each return unknown, unsupported evidence line1 with actual temp root and contained docs/INITIATIVES/g/charter.md, active:true, ratificationUnknown1, total1, exactly one parcel:null ratification-evidence remedy in inspect/reconcile -> owner -> park order; every option commands empty.
Exact probe inputs:
- Status: RATIFIED; if funding is approved
- Status: RATIFIED — only if funding is approved
- Status: RATIFIED — subject to owner confirmation
- Status: RATIFIED (conditional on funding)
- Status: RATIFIED — granted only if funding is approved
- Status: RATIFIED; but Gate 1 is revoked
- Status: RATIFIED; provided funding is approved
- Status: RATIFIED (only if funded)
- Status: RATIFIED; Gate 1: REVOKED
Directive for all: ## Queue, blank line, **Goal complete — queue empty**.
This reproduces the original false-inactive/no-remedy integrations and establishes their correction, rather than simulating a classifier or inspecting only helpers.

Mechanism now retains grant scope across empty delimiter clauses, normalizes direct opening parenthesis/only-if/granted-only-if/subject-to forms, preserves explicit owner/date continuation, and recognizes explicitly targeted Gate1 revoked clauses with connective but. Review/Gate2/Gate3/parcel clauses end general grant scope; the targeted Gate1 check remains separately anchored. Independent actual scanGoal controls keep granted for review-is-conditional followed by if, Gate2 conditional, Gate3 subject-to, scoped TO-P1 conditional, and quoted only-if. No arbitrary document-wide keyword veto was added.

A1 closure:
Independently ran actual scanGoal optional-outer-pipe table header grant and body grant examples: unknown, no fabricated supported grant. A genuine Status:RATIFIED plus table body Status:NOT RATIFIED remains granted. Reviewed pipeCells/tableLines: actual header+delimiter structure governs exclusion; escapes and matched code spans prevent incidental pipes becoming separators; header/body line indices are skipped before firstStatus/evidence consumption and multiline joining stops at excluded table boundary. Tests cover mixed outer pipes, escaped/code-span pipes, incidental non-table pipe metadata, unmatched backticks and original metadata line preservation. No blanket pipe exclusion or indented-code scope expansion.

A3 closure:
Read complete actual unchanged tracked charter/directive bytes through actual scanGoal using defaultConfig for this exact worktree, no excerpt substitution or historical rewriting. All four results granted with one grant:
- foreman-ops-console: charter line7
- trustworthy-observation: charter line6
- ci-fail-fast: charter line6
- w4-closeout: charter line3
Locators retain actual configured worktree root and plugin-relative charter paths. Corrective shipped tests independently read entire tracked files, assert granted both via reader and scanGoal and compare evidence, replacing header-only compatibility as the load-bearing proof. Ineligible benign positive corroboration is ignored for establishing approval and for vetoing eligible metadata, consistent with the pre-code ruling. Paired actual probe confirms such a record alone remains unknown; real current NOT GRANTED still conflicts. Corrective tests additionally retain REVOKED and GRANTED-only-if veto controls. Descriptive arbitrary Gate1 text now does not fabricate either a supported grant or a conflict.

Independent bounded execution total:24 probes passed (nine full unknown/status/remedy integrations, eleven table/no-veto/negative/unrelated controls, four actual full public goal scans). Temporary files removed. No full suite rerun or original document mutation.

Unchanged architecture controls retain original review conclusions: pure isolated reader; only selected charter/directive; zero reference recursion; additive evidence and attention; configured-root component containment and actual source identity; required directive null versus optional charter missing/unreadable unknown; no authenticated authority claim; exact one unknown remedy, unchanged pending remedy; no API route/state/registry/schema/permission/audit or write authority changes. Exactly nine allowed console source/test paths differ from709dd4fb. Corrective source/test change confined to parser and its tests; coordinator records distinct. Designated-document realpath/size policies and unknown-only board banner remain later-parcel scope, not silently claimed complete here.

Final reviewer control: HEAD929bb772c44481dbf58d22b06af29f656c392b1c unchanged, git status --short empty, git diff --check passes. No reviewer fixes, commits, fixture mutation or scope expansion. Only this report saved under /tmp. Exact-head CI and authorized merge remain separate coordinator gates.

## Final exact-head closure a840914f

Both independent reviewers ACCEPT. A1/A2/A3/B1 CLOSED, required findings open0. Final exact-head reports follow; their acceptance does not bypass CI or authorize an early goal-completion claim.

### Final A

Independent TO-P1 final architecture/security review A

Exact head: a840914f8fd0b4838f0682288c4c0c40995eeaa6
Worktree: /home/cmorgan76/Work/foreman-to-p1
Decision: ACCEPT for this bounded TO-P1 architecture review. All required findings CLOSED. Effective exact-head CI, authorized merge and lifecycle evidence remain coordinator requirements; this is not overall goal completion or authenticated authority.

Evidence and method
Reinspected incremental parser/test diff from929bb772, pre-code residual ruling and independent residual-table verifier summary. Actual independent251/251,typecheck/lint,unchangedD19 and four read-only controls PASS. Only two console paths changed in this correction; no API/UI/helper/audit/dependency/authority expansion. Ran20 additional direct bounded pure-reader cases plus4 real full-document scanGoal reads on exact head; all asserted outcomes passed. Confirmed tracked clean. No repository edits, commits, fixture changes, public-record rewrites or link recursion.

R-A1 CLOSED.
All three remaining exact repros now match accepted outcomes:
1 `Current | Evidence\n--- | ---\nStatus: RATIFIED` -> unknown, evidence empty.
2 `Current | Evidence\n:-: | -:\nStatus: RATIFIED | sample` -> unknown, evidence empty.
3 `Status: RATIFIED\nCurrent | Evidence\n--- | ---\nStatus: NOT RATIFIED` -> granted, only grant line1.
The table delimiter now accepts one-or-more hyphens and table body includes unpiped missing-cell rows. endsTable uses bounded blank/ATX/fence/blockquote/list/thematic starts rather than absence of a pipe. This implements the original table exclusion: GFM Example199 and202 factual basis at https://github.github.com/gfm/#tables-extension- established in preceding review; no additional grammar requirement introduced.
Verified table lifetime controls independently: after an unpiped body, blank permits genuine metadata grant line5; ATX permits standalone denial line5; bullet permits genuine metadata grant line4; ordered list and thematic boundary permit genuine metadata grant line5. Quote and fence contents still yield no grant. Narrative pipe, escaped pipe and matched-code pipe metadata each remain granted line1. New tests exercise all three remaining examples through both readRatification and scanGoal, exact evidence identities,10 block-ending controls, blank reset and unpiped escaped/code content. These tests preserve true outside-table current-denial detection instead of merely asserting absence of evidence everywhere.

R-A2 CLOSED; closure carried forward and directly reconfirmed.
Parenthetical conditional, granted-only-if and explicit `but Gate 1 is revoked` still unknown, unsupported line1. Unrelated review conditional followed by if still granted. True current denial still produces grant+denial unknown. Qualifier logic unchanged by residual table patch; existing end-to-end unknown activity/count/exact-one-remedy assertions remain meaningful and independent251-suite PASS.

R-A3 CLOSED; closure carried forward and directly reconfirmed.
All four complete original selected-tree charter+directive pairs read through actual scanGoal: foreman-ops-console, trustworthy-observation, ci-fail-fast and w4-closeout return granted. Ineligible positive corroboration alone remains unknown with no grant; genuine metadata plus same corroboration remains granted only line1. Full-document tests read unchanged actual tracked files, compare scanGoal evidence with pure-reader full sources; genuine current denial/revocation/conditional controls preserved. No abbreviated-header-only compatibility claim or historical rewrite.

Architecture/security/performance
The incremental helper remains local to the pure reader and adds no persistence, recursion, timestamp arbitration or authentication. Table block lifetime consumes each body once, with existing cell/backtick scanning retained; no new obviously pathological nested or exponential search found in bounded inspection. Source failure behavior, actual-root locators, original line diagnostics, ATT arithmetic/activity and ordered withheld-command unknown remedy remain unchanged. Exact original nine-path implementation scope remains intact.

Bounded limitations: HTML/setext and indented-code grammar are explicitly outside this correction; no full GFM conformance/absence-of-parser-bugs claim. Original optional indented-code observation remains documented, not a new mandatory exclusion. No additional concrete required AC failure reproduced in this final bounded review and no speculative scope expansion requested.

Final required ledger: R-A1 CLOSED; R-A2 CLOSED; R-A3 CLOSED. Required findings open:0. Optional O-A1 documented unchanged. Independent architecture ACCEPT at exact a840914f; subject to remaining coordinator gates above.

### Final B

Independent final incremental TO-P1 architecture/risk review B
Exact HEAD: a840914f8fd0b4838f0682288c4c0c40995eeaa6
Worktree: /home/cmorgan76/Work/foreman-to-p1
Decision: ACCEPT reviewed parcel implementation at this exact head.
Required ledger: B1 CLOSED; A2/A3 remain CLOSED; residual A1 corrections independently verified CLOSED. No new required or optional finding established in this bounded review. My preceding929 acceptance covered the initial A1 examples but missed A's standard short-delimiter/unpiped-row gaps; this report explicitly verifies those residual cases rather than carrying forward that incomplete table conclusion.

Read committed residual ruling in to-p1-review-findings.md (pre-code d3d441), complete incremental source/test diff and independent residual-table verifier report. Correction confines console modifications to src/ratification.ts and tests/ratification.test.ts (114 additions/10 deletions); coordinator findings record is distinct. No other source/API/UI/manifest/audit path changed incrementally. Verifier reports actual251/251, typecheck/lint/unchangedD19/read-only PASS at exacta840. Consumed those observations without redundant full-suite execution.

Residual A1:
Delimiter cells now accept one-or-more hyphens with optional alignment colons. Real header+delimiter identity remains necessary; incidental narrative, escaped and code-span pipes are not blanket exclusions. Table body continues through missing-cell/unpiped rows instead of ending merely on lack of pipe. New endsTable recognizes bounded blank, ATX, fence, blockquote, unordered/ordered-list and thematic-break boundaries before following genuine records. Multiline emphasis remains stopped by precomputed table exclusions. Source changes do not alter grant grammar, evidence identity or qualifier scope.

Independent actual scanGoal probes using real temporary docs/goals/g files proved:
1 A | B / - | - / Status: RATIFIED => unknown, no evidence.
2 A | B / :-: | -: / Status: RATIFIED | x => unknown, no evidence.
3 Genuine Status:RATIFIED line1 plus table with unpiped Status:NOT RATIFIED => granted, only grant line1.
4 Table with short delimiters and unpiped denial, then blank and first genuine Status:RATIFIED => granted, grant line5.
For each of twelve boundaries (blank, ## Current, blockquote, fenced block, dash/plus/star lists, ordered-dot/ordered-parenthesis lists, ***, ---, ___), a genuine Status:NOT GRANTED after the boundary conflicts with the preceding genuine grant, yielding unknown; the earlier unpiped table denial stays excluded and following denial retains its exact original line. These probes cover real scanner IO, not merely a copied classifier.

B1/A2 unaffected:
Repeated actual scanGoal -> goalStatus -> remediesFor integrations for Status:RATIFIED with direct semicolon-if, only-if, subject-to, parenthetical conditional, and 'but Gate 1 is revoked'. Every case returns unknown, active:true, ratificationUnknown1,total1 and exactly one parcel:null ratification-evidence remedy with reconcile/owner/park ordering and all commands empty, despite complete/empty narrative. These helper sources are unchanged by residual table correction; existing paired unrelated/quoted controls remain in the full verified suite.

A3 and identity:
Repeated read-only actual full unchanged tracked charter+directive scans for foreman-ops-console, trustworthy-observation, ci-fail-fast and w4-closeout. All granted and all evidence roots equal actual configured worktree root. No excerpt replacement, actual-record editing, alias filesystem identity, reference recursion or authenticated-authority assertion. Benign ineligible corroboration/no-grant-alone correction remains unchanged.

Actual independent bounded execution:25 passed (five unknown attention/remedy integrations, four residual table integrations, twelve boundary integrations, four actual full public scans). Temporary probe files removed. No tracked fixtures or original records modified.

Architecture conclusions retained: pure isolated current two-source reader; additive GoalRecord evidence/status attention; actual configured-root component containment; required directive null and optional charter missing/unreadable unknown preserved; exactly one ordered unknown remedy and existing pending remedy unchanged; five parcel states, route/registry/schema/permissions/write authority/audit behavior unchanged. Read-only controls independently verified as stated above. No scope expansion or new dependency.

Explicit limitations: HTML/setext/indented-code grammar remains outside this bounded reader per committed ruling. This acceptance makes no full GFM parser or unrestricted absence-of-bugs claim and does not demand unsupported language expansion. Designated-document policy and UI banner work remain later parcels.

Reviewer exit control: git status --short empty, git diff --check PASS, exact HEAD unchanged a840914f8fd0b4838f0682288c4c0c40995eeaa6. No reviewer edit/commit; only this /tmp report saved. Effective exact-head CI, authorized merge and lifecycle/goal completion remain separate coordinator gates.
