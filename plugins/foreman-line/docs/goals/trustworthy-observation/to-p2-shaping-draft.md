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
surfaces:
  - plugins/foreman-line/ops-console/src/types.ts
  - plugins/foreman-line/ops-console/src/chain.ts
  - plugins/foreman-line/ops-console/src/scan.ts
  - plugins/foreman-line/ops-console/src/project.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/ui/app.js
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: public
---

# TO-P2 — Malformed evidence isolation

## Intent

Implement the accepted EVD "isolation and accessible diagnostics" in the ops console. Today `walkChain` (`plugins/foreman-line/ops-console/src/chain.ts`) casts untrusted `JSON.parse` output to `ReceiptDocument` (`parsed as ReceiptDocument`) and feeds it to `validateChain`/`isSealed`; unparseable members vanish from the member list; one damaged workflow can abort a whole projection. This parcel makes malformed evidence visible-but-isolated: invalid/unavailable chain members stay listed with safe placeholder fields, parsed null/array/primitive values are never cast or passed to receipt consumers, failures are contained per document/workflow/goal, and additive `evidenceDiagnostics` surface every failure on goal detail, parcels, and mapped chain responses. The goal-selection UI gains a goal evidence section that needs no parcel selection.

## Constraints

- Frozen route table (FOC-P0 X1): no new route; additive response fields only. Every existing field, route, state value, and `/api/invoke` argv behavior preserved.
- Read-only posture (charter D2) preserved; the only writable files remain `state/notifications.json` and `state/invocation-audit.json`.
- `CHAIN_MEMBER_PATTERN` unchanged; sharing it is TO-P3's scope.
- Parsed null/array/primitive is never cast/dereferenced as `ReceiptDocument` and never reaches `validateChain`/`isSealed`/gate/liveness/derive consumers; schema-invalid objects stay invalid and are isolated from downstream join/gate/liveness calls.
- Invalid genesis never fabricates a parcel; unreadable goals never fabricate workflows; no fake goal/workflow/parcel from invalid genesis.
- Discovery stays directive-dependent (`scan.ts`): a known goal entry with an unreadable directive is not discoverable; additive `/api/goals.evidenceDiagnostics` carries its goal diagnostic and `/api/goals/:slug` stays an explicit 404. A missing optional charter leaves an otherwise discoverable goal's ratification `unknown` (existing behavior).
- Malformed/escaping goal keys are rejected before any file access, with the existing error response shape; keys are never converted into paths. Qualified tree keys keep actual root/workflow/member identity.
- UI: all diagnostic messages rendered through `esc()`; no UI redesign.
- No new framework, dependency, or manifest.
- Step 0: the builder must halt if this scope or the parent shapes (TO-B0/TO-P0/TO-P1) changed since this draft. No builder activation until those parents land and the coordinator re-reconciles current files.

## Acceptance Criteria

1. `Locator`/`EvidenceDiagnostic` types match the EVD exactly. Goal detail adds `evidenceDiagnostics` and `unmappedChains: ChainSummary[]`; `/api/parcels` keeps its `unmappedChains` and adds diagnostics; a mapped parcel's chain response adds only that parcel's diagnostics.
2. Invalid/unavailable chain members matching `CHAIN_MEMBER_PATTERN` remain visible in `members` (placeholder `sequence`/`stage`/`subjectKind`/`timestamp`/`hash`, real locator) and yield workflow-kind diagnostics with the member locator; they are never cast to `ReceiptDocument` nor passed downstream.
3. A schema-invalid member object stays invalid; only schema-valid guarded documents reach join/gate/receipt consumers. An authoritative existing queue parcel can remain projected with invalid chain evidence, but invalid genesis must remain unmapped and must not fabricate a parcel or goal. Raw evidence/invalid members remain observable, not silently filtered valid.
4. One damaged member, workflow, or goal does not prevent unrelated records loading: multi-workflow and multi-root scans complete and return the healthy records.
5. Unreadable directive: goal absent from `goals`/`statuses`, present as a goal-kind diagnostic in `/api/goals.evidenceDiagnostics`, detail route 404s.
6. Malformed/escaping goal keys (e.g. `..`, slashes) rejected before file access; existing 404/error bodies unchanged.
7. UI renders a goal-level evidence section (unmapped root/workflow/member identity + missing/unreadable document evidence) with no parcel selected; hostile HTML in `code`/`message`/locators is escaped.

## Out of Scope

- Source document contents (TO-P4), command fix (TO-P5), refresh/generation (TO-P6).
- Chain-membership regex sharing (TO-P3).
- New routes, UI redesign, new dependencies/manifests.
- Generating approvals or receipts.

## Context & References

- Accepted EVD "isolation and accessible diagnostics" (`plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md`, this parcel's controlling contract); amends FOC-P0 C1/C2 (`plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md`).
- Scenarios EVD-P / EVD-N (`plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md`).
- Observation contract amendment: `plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md`.
- Unsafe cast: `plugins/foreman-line/ops-console/src/chain.ts` (`parsed as ReceiptDocument`, `docs.push(doc)`, `validateChain(docs)`, `isSealed(docs)`).
- Directive-dependent discovery: `plugins/foreman-line/ops-console/src/scan.ts` (`listGoalSlugs`, `scanGoal`).
- Projection authority (charter D4): `plugins/foreman-line/ops-console/src/project.ts`.
- Parents: TO-B0 merged96ffadc5; TO-P0 landing pending, TO-P1 draft.

## Allowed Files

Implementation (6 files — exceeds the ≤5 target; **COORDINATOR SCOPE RULING REQUIRED BEFORE DISPATCH**; each is inseparable, none can be dropped without silently losing a required boundary):

1. `plugins/foreman-line/ops-console/src/types.ts` — EVD `Locator`/`EvidenceDiagnostic` types; additive projection/response fields. Single type authority; cannot live elsewhere.
2. `plugins/foreman-line/ops-console/src/chain.ts` — remove unsafe cast, keep invalid members visible, emit workflow diagnostics. The defect lives here.
3. `plugins/foreman-line/ops-console/src/scan.ts` — distinguish unreadable-directive goal entries for the additive goal diagnostic. Discovery lives here; moving it into `api.ts` would duplicate `readdir` logic.
4. `plugins/foreman-line/ops-console/src/project.ts` — per-document/workflow/goal isolation, diagnostics collection, detail `unmappedChains`. Projection authority (D4).
5. `plugins/foreman-line/ops-console/src/api.ts` — additive `evidenceDiagnostics` on goals/detail/parcels/chain responses; pre-file-access key rejection. Route table lives here; no new route permitted.
6. `plugins/foreman-line/ops-console/ui/app.js` — goal evidence section. EVD mandates UI exposure independent of parcel selection; dropping it silently loses the required UI boundary. No helper is invented to hide the count.

Tests/fixtures (bounded; counted separately):

- `plugins/foreman-line/ops-console/tests/chain-walk.test.ts` — extend: visible invalid members, no cast, isolation.
- `plugins/foreman-line/ops-console/tests/api.test.ts` — extend: additive fields, diagnostics, key rejection, 404s.
- `plugins/foreman-line/ops-console/tests/support/materialize.ts` — bounded fixture additions only if needed.
- `plugins/foreman-line/ops-console/tests/ui-evidence.test.ts` — new bounded UI test, only if appropriate (hostile-HTML escape render check).

Existing chain-walk/api/read-only/multi-root suites must keep passing.

## Verification Plan

- Deterministic unit/API tests (`node:test`) covering AC1–AC7; run the full ops-console suite plus `npm test`, `npm run typecheck`, and `npm run lint` (this package has no build script).
- Independent verifier: real browser render of the goal evidence section against a repo containing malformed/unreadable evidence and a hostile-HTML diagnostic payload; confirm escaping and that no parcel selection is required. Real API/browser proof is future verification evidence, not claimed at shaping time.
- Dual independent critical review, mandated questions:
  1. Can any parsed non-object (null/array/primitive) or schema-invalid object reach a `ReceiptDocument` consumer (`validateChain`, `isSealed`, gates, liveness, derive)?
  2. Can one damaged member/workflow/goal abort or omit unrelated records from any response?
  3. Are all diagnostics escaped in the UI and are all malformed/escaping goal keys rejected before file access with unchanged error bodies?
  4. Are all existing fields/routes/states/argv and the two-writable-file boundary preserved, with no new route?
- No approvals or receipts are generated by this parcel.

Coordinator draft preflight: frontmatter surfaces and full source references corrected. Six-file exception remains unruled until parent reconciliation; no active spec, shaping-result emission, Gate-2 activation, or builder dispatch. Preserve source-to-member locator alignment when isolating raw/invalid documents: gates.ts currently uses walk.members[i] for walk.docs[i], so filtering docs alone must not misattribute valid evidence. If this cannot be preserved inside the listed scope, halt for a scope amendment before code, rather than modifying gates.ts silently. List-level unavailable-goal diagnostics must be visible even with no active/selectable goal; this does not fabricate a discoverable goal or workflow. These are existing EVD identity/access requirements, not new routes or stored state.
