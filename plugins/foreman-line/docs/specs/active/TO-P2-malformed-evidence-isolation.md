---
ticket: TO-P2
title: Malformed evidence isolation
status: draft
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: critical
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: public
surfaces:
  - plugins/foreman-line/ops-console/src/types.ts
  - plugins/foreman-line/ops-console/src/chain.ts
  - plugins/foreman-line/ops-console/src/scan.ts
  - plugins/foreman-line/ops-console/src/project.ts
  - plugins/foreman-line/ops-console/src/gates.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/ui/app.js
---

# TO-P2 — Malformed evidence isolation

Shaping draft at actual parent main b90ad841; no build receipt, tests run, approval or implementation acceptance. Coordinator lint and exact source/owner reconciliation precede activation. `routing_class` is the ratified charter class (architecture/risk); no cheap classifier was run.

## Intent

Implement the accepted EVD "isolation and accessible diagnostics" in the ops console. Today `walkChain` (`ops-console/src/chain.ts`) casts untrusted `JSON.parse` output to `ReceiptDocument` (`parsed as ReceiptDocument`) and feeds it to `validateChain`/`isSealed`/gate/derive consumers; unparseable members vanish from the member list; one damaged record can abort a projection. This parcel makes malformed evidence visible-but-isolated: every chain member matching `CHAIN_MEMBER_PATTERN` stays listed (placeholder fields, real locator), parsed null/array/primitive and schema-invalid values never reach any `ReceiptDocument` consumer, failures are contained per document/workflow/goal, and additive `evidenceDiagnostics` surface every failure on goal detail, parcels, and mapped chain responses. The goal UI gains a goal evidence section and list-level diagnostics that need no parcel selection and no selectable goal.

## Constraints

- Frozen route table (FOC-P0 X1): no new route; additive response fields only. Every existing route, field, state value, and `/api/invoke` argv behavior preserved.
- Read-only posture (charter D2): the only writable files remain `state/notifications.json` and `state/invocation-audit.json`.
- `CHAIN_MEMBER_PATTERN` unchanged; sharing it is TO-P3's scope. Matching sidecars stay members; nonmatches (`notes.json`, `000001-Z-foo.json`) stay excluded.
- EVD types are exact: rooted `Locator = {root, relativePath}` reusing the P1 locator identity qualifications (actual configured root, contained repo-relative path, never an alias or another root); `EvidenceDiagnostic` keeps the EVD `workflow`/`goal` kinds with `memberLocator`/`documentLocator`, `code`, `message`.
- Parsed null/array/primitive is never cast or dereferenced as `ReceiptDocument`; schema-invalid objects remain invalid-visible. Neither reaches join, gate, liveness, derive, `validateChain`, or `isSealed`.
- Invalid genesis never fabricates a parcel, workflow, or goal — even if a later valid Stage-A receipt parses. An authoritative queued parcel stays projected independently: an unidentified invalid-genesis workflow remains unmapped and is never attached to it. A chain with a structurally valid actual genesis and later invalid evidence may still map as an invalid chain.
- Invalid matching filenames are always invalid-visible: no skipped gaps, no bridging across an excluded member, no silent filtering of "valid docs only".
- Per document/workflow/goal isolation; unrelated records always survive. A known goal entry with an unreadable directive is not discoverable: absent from `goals`/`statuses`, present as a goal-kind diagnostic in the list, `/api/goals/:slug` stays an explicit 404 (no fabricated goal). A missing optional charter leaves ratification `unknown` (P1 behavior unchanged).
- Malformed/escaping goal keys (e.g. `..`, slashes) are rejected before any file access, with the existing error response shape; keys are never converted into paths.
- UI: all diagnostic text rendered through `esc()`; no UI redesign, no new dependency, framework, or manifest.
- No unrelated normative change; no cryptographic or authority-authentication claim.

## Evidence-handling design: validated doc/locator pairing

The defect is a source-identity defect, not only a cast defect. `gates.ts` `approvalReceipt` pairs `walk.docs[i]` with `walk.members[i]`; `project.ts` `aReceiptBasenames` reads `walk.docs`; G2/G3 take raw `walk.members` as gate evidence. Filtering invalid documents out of `docs` alone would shift indices and attribute valid evidence to the wrong file.

Concrete proposal: `walkChain` keeps `members` (every matching file, always visible; invalid/unavailable entries carry placeholder `sequence`/`stage`/`subjectKind`/`timestamp`/`hash` plus the real locator and a workflow-kind diagnostic) and adds one chain-internal validated pairing — `validated: readonly {locator: string; doc: ReceiptDocument}[]` — appended only when `JSON.parse` yields a JSON object that passes `validateReceiptDocument` and its sequence/stage match the filename and correlation.workflowId matches the actual UUID directory. `ChainWalk.docs` is retained as a readonly array of guarded ReceiptDocument values, in the same order as validated pairs, to preserve existing derive.ts and exported ChainWalk consumers; `gates.ts` and `project.ts` consume the pairs (A-receipt locator and approval marker from the pair's own locator; G2 Stage-C and G3 Stage-F evidence only from validated pairs, so an invalid C/F member stays visible but never evidences a gate). The new pairing is internal and stripped from every API response, including nested parcel.chain, by project normalization after unchanged derive. Existing mapped parcel.chain.docs serialization is retained with guarded valid documents only; existing unmapped summaries still omit docs. Logs retain their existing raw document/error payload. No new raw-document surface or route is added.

Chain-level checks and isSealed run only when every matching member has been read and validated: in that case the guarded docs array preserves the complete original member order. If any matching member is invalid/unavailable, the chain remains invalid with its member diagnostics and these chain-level ReceiptDocument calls are withheld; never collapse the member list and validate adjacency across an excluded member. The receipts validator is unchanged. Guarded docs/pairs remain available for safe per-document observation, preserving real locators.

Join semantics: actual genesis is the first matching filename in lexical order. Mapping requires its validated sequence-0 Stage-A document, filename sequence 000000/stage A, and correlation.workflowId matching the actual directory. Only that genesis supplies subject refs. A later valid A never substitutes for invalid actual genesis. Such workflows remain observable and unmapped; queue parcels project independently. A validated genesis with later invalid evidence may map an invalid chain; duplicate-chain policy remains unchanged. This is structural attribution, not authentication.

## Acceptance Criteria

1. `Locator`/`EvidenceDiagnostic` match the EVD exactly (rooted, P1 identity qualifications). Goal detail adds `evidenceDiagnostics` and `unmappedChains: ChainSummary[]`; `/api/goals` and `/api/parcels` add `evidenceDiagnostics` (goal-kind list diagnostics, including unavailable-goal entries); a mapped parcel's chain response adds only that parcel's diagnostics. New validated pairs are absent at every nesting level; existing guarded mapped docs and logs remain.
2. Every invalid/unavailable chain member matching `CHAIN_MEMBER_PATTERN` stays visible in `members` with placeholder summary fields and its real locator, yielding a workflow-kind diagnostic; invalid values never become ReceiptDocument or reach downstream consumers. Valid matching members retain their existing summary fields.
3. Join/gates use validated own-locator pairs; unchanged derive consumes guarded docs and inert invalid member summaries. Chain-level validation/sealing sees only a complete valid member set. Invalid placeholders use sequence -1, stage/subjectKind ?, empty timestamp/hash; an invalid final member gives null tipStage. Internal pairs never appear in any API response; legacy mapped docs remain guarded.
4. Invalid genesis never fabricates a parcel/workflow/goal even when a later valid A exists; the authoritative queue parcel projects independently and the unidentified actual workflow stays unmapped. A valid actual genesis with later invalid evidence can map an invalid chain.
5. Invalid members never silently vanish, bridge gaps, or misattribute source: gate and join evidence always names the file it was parsed from.
6. One damaged member, workflow, or goal never prevents unrelated records loading; multi-workflow and multi-root scans return the healthy records.
7. Unreadable-directive goal: absent from `goals`/`statuses`, goal-kind diagnostic in the list, detail route 404; missing charter stays ratification `unknown`.
8. Malformed/escaping goal keys rejected before file access; existing 404/error bodies unchanged.
9. UI goal evidence section (unmapped root/workflow/member identity, missing/unreadable document evidence) renders with no parcel selected; list diagnostics render with no selectable goal; hostile HTML in `code`/`message`/locators is escaped; no redesign.
10. All existing fields, routes, states, argv behavior, and the two-writable-file boundary preserved; no new route.

## Allowed Files

Implementation — 7 candidate files. Coordinator disposition R1 approves the bounded ≤5-file exception, contingent on actual parent merge and source/owner reconciliation before activation. The count is stated here; no helper or indirection hides it. Each file is inseparable from a required boundary:

1. `plugins/foreman-line/ops-console/src/types.ts` — EVD `Locator`/`EvidenceDiagnostic`; additive projection/response fields. Single type authority.
2. `plugins/foreman-line/ops-console/src/chain.ts` — remove the unsafe cast; validated doc/locator pairing; visible invalid members; workflow diagnostics. The defect lives here.
3. `plugins/foreman-line/ops-console/src/scan.ts` — distinguish unreadable-directive goal entries for the additive list diagnostic; discovery lives here.
4. `plugins/foreman-line/ops-console/src/project.ts` — per-document/workflow/goal isolation, diagnostics collection, `unmappedChains`, actual-genesis validated-pair join eligibility, post-derive normalization preserving legacy guarded docs (D4 projection authority).
5. `plugins/foreman-line/ops-console/src/gates.ts` — seventh file: gate evidence must consume validated doc/locator pairs (`approvalReceipt` index alignment; G2/G3 raw-member evidence). Dropping it misattributes gate evidence to the wrong member.
6. `plugins/foreman-line/ops-console/src/api.ts` — additive `evidenceDiagnostics` fields; pre-file-access key rejection. Frozen route table lives here.
7. `plugins/foreman-line/ops-console/ui/app.js` — goal evidence section and list diagnostics. EVD mandates UI exposure without parcel selection.

Tests (bounded, counted separately):

- `plugins/foreman-line/ops-console/tests/chain-walk.test.ts` — extend.
- `plugins/foreman-line/ops-console/tests/api.test.ts` — extend.
- `plugins/foreman-line/ops-console/tests/gates.test.ts` — extend.
- `plugins/foreman-line/ops-console/tests/ui-evidence.test.ts` — new, bounded actual shipped UI harness.
- `plugins/foreman-line/ops-console/tests/support/materialize.ts` — fixture additions only if needed.

No other files are added or expanded.

## Step 0 / Coordinator rulings required before activation

Prepared dispositions R1–R7 are in [TO-P2 dispositions](../../goals/trustworthy-observation/to-p2-preactivation-rulings.md), independently source-reviewed; they must be copied into the goal packet and committed with the reconciled active spec after actual parent merge. Preparation is not activation.

- R1: seven-file exception justified by gates source-index and raw-member authority boundary; five test paths maximum, no hidden derive/index/validator edits.
- R2: first matching filename is actual genesis; validated sequence/stage/workflow identity as above. Independent queue/unmapped separation, no later A substitution.
- R3: additive list carrier; strip only new pairs everywhere, retain existing guarded mapped docs and raw logs fields.
- R4: inert placeholders and null invalid tip; complete-set chain checks only.
- R5: pre-read closed ASCII alphanumeric/dot/underscore/hyphen slug, except . and .., across scanGoal and every API goal route including aliases; preserve per-route errors. Lexical scope, no symlink guarantee claim.
- R6: known goal entry is an actual directory with charter.md or loop-directive.md marker, including unreadable markers. Enumerate known entries separately from directive-dependent public listGoalSlugs; unrelated unmarked directories are excluded. Missing required directive yields diagnostic, no goal/status; translate missing/unreadable optional charter P1 evidence without changing ratification shape.
- R7: per-document/spec/workflow/goal isolation and escaped list diagnostics even without selectable goal, retaining healthy neighboring records; no blanket empty-success fallback.

Step 0: the builder halts if this scope or the parent shapes (TO-B0/TO-P0/TO-P1) changed since this draft. Parents are actually merged. Bare ShapingResult emitted with epics[] after shipped advisory self-check; no receipt or active promotion follows from that check. Builder activation requires coordinator lint, current source/owner reconciliation, committed/public active scope and separate Step-0 stop/dispositions.

## Verification Plan

- Deterministic `node:test` coverage of AC1–10; full ops-console suite plus `npm test`, `npm run typecheck`, `npm run lint` (no build script in this package). Existing chain-walk/api/gates/read-only/multi-root suites must keep passing; D19 fixtures unchanged; the two-writable-file boundary re-verified.
- Independent verifier: real browser + real API proof against a repo containing malformed/unreadable evidence and a hostile-HTML diagnostic payload — goal evidence and list diagnostics visible with no parcel selected and no selectable goal, escaping confirmed. This is future verification evidence, not claimed at shaping time.
- Dual independent critical review, mandated questions: (1) can any parsed non-object or schema-invalid value reach a `ReceiptDocument` consumer (`validateChain`, `isSealed`, gates, liveness, derive)? (2) can the doc/locator pairing ever misattribute evidence to a different file (`approvalReceipt`, G2/G3)? (3) can invalid genesis or a later valid A fabricate a parcel, workflow, or goal, or overwrite the authoritative queued parcel? (4) can one damaged member/workflow/goal abort or omit unrelated records? (5) are all diagnostics escaped and all malformed/escaping goal keys rejected before file access with unchanged bodies? (6) are all existing fields/routes/states/argv and the two writable files preserved, with no new route?
- No approvals or receipts are generated by this parcel.

## Out of Scope

- TO-P3 shared membership helper (regex unchanged), TO-P4 source document contents, TO-P5 command fix, TO-P6 refresh/generation.
- New routes, UI redesign, new dependencies/manifests.
- Generating approvals or receipts; cryptographic verification or authority-authentication claims.

## Context & References

- Accepted EVD "isolation and accessible diagnostics" (`plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md`) — controlling contract; amends FOC-P0 C1/C2 (`plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md`).
- Scenarios EVD-P/EVD-N (`plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md`).
- Defect sites: `ops-console/src/chain.ts` (`parsed as ReceiptDocument`, `docs.push(doc)`, `validateChain(docs)`, `isSealed(docs)`); `ops-console/src/gates.ts` (`approvalReceipt` `walk.members[i]` for `walk.docs[i]`, G2/G3 raw-member evidence); `ops-console/src/project.ts` (`aReceiptBasenames`); `ops-console/src/scan.ts` (`listGoalSlugs`, `scanGoal`).
- Parents: TO-B0 merged 96ffadc5; TO-P0 merged 78c; TO-P1 merged PR169 at b90ad841, exact head a4d (251 tests, dual accepted, complete required CI green).

Coordinator preparation corrections (not activation): retain guarded docs for unchanged derive.ts and exported consumers; never validate a filtered array across invalid member gaps; run chain-level checks/seal only with the complete valid member set. Actual UUID workflow directories remain observable as unmapped invalid chain summaries; invalid genesis cannot invent a mapped parcel/goal or replace authoritative queue data. Exact test paths and source refs are reconciled before activation. P1 actual merge is recorded; current live-owner/source preflight remains required before activation; no active scope, build, receipt or acceptance.
