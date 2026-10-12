---
ticket: TO-P4
title: Rooted designated source documents
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
  - plugins/foreman-line/ops-console/src/sources.ts
  - plugins/foreman-line/ops-console/src/project.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/ui/app.js
---

## Intent

Goal detail and parcel log views must surface actual source document content, not just string refs. This ticket extends the existing FOC/FCA projection with a `SourceDocument` shape carrying real content for designated files only: the goal's charter and loop-directive on goal detail, and the parcel's selected spec on parcel logs. All existing response fields, routes, legacy string refs, and derivation semantics remain unchanged. The extension is purely additive: new fields appear alongside existing ones; no consumer of the current contract breaks.

## Constraints

C1. The `SourceDocument` type is exactly: `{ kind: 'charter'|'directive'|'spec', locator: { root: string, relativePath: string }, status: 'ok'|'missing'|'error'|'withheld', content: string|null, diagnostic: {code:string,message:string}|null }`. `ok` means UTF-8 content with null diagnostic; every other status means null content with non-null diagnostic.

C2. Locators resolve against the actual configured selected tree root (plugin/native/initiative layout), never against a tree alias or a legacy ref string. The alias selects the tree; the locator carries the real POSIX root-relative path. `SpecFact.absPath` is the authoritative absolute path for specs; it is never reconstructed from a ref string.

C3. Lexical containment (the resolved path is the configured root or lies beneath it at a path-component boundary; a sibling prefix such as root-other must fail) and realpath containment (resolving symlinks) must both pass before any read. Escapes, unconfigured roots, and undesignated paths are withheld with a reason. No client-supplied path is ever accepted; no directory-listing endpoint is added.

C4. Reads are bounded to 1 MiB. Content exceeding the limit is withheld; the file is never read unbounded before checking size.

C5. Designated sources only: goal detail adds `documents` for charter and directive only; parcel logs adds `documents` for the existing join's selected spec only. No other files are read or exposed. When no selected spec exists, `documents` is empty and an explicit unavailable-evidence diagnostic is present; no locator is invented.

C6. All existing response fields and routes are preserved. Legacy string refs (`charterRef`, `loopDirectiveRef`, `specRef`) remain. The FOC-P0 route table (X1) is not amended; the TO-P2 diagnostics, unmapped chains, and read isolation are preserved; TO-P1 unknown ratification behavior is unchanged. Directive discovery and detail 404 remain EVD.

C7. No config or scan changes are required if existing selected-root dirs and `SpecFact.absPath` are reused. If an additional file is truly required, it must be flagged before dispatch; no hacks or drops.

C8. Optional new public metadata must not make `derive.ts` a required-property break. Prefer a clear shared join lookup using the actual selection, not guessing or matching unrelated specs.

C9. UI must escape all content and diagnostics. No UI redesign; no `file://` strings are treated as navigation proof. Actual real-browser and API proof is required later by the verifier.

## Acceptance Criteria

AC1. `GET /api/goals/<slug>` returns the existing `GoalRecord` fields plus `documents: SourceDocument[]` containing exactly charter and directive entries for the selected tree's actual layout. Content is present when readable; status/diagnostic reflect missing, error, or withheld states.

AC2. `GET /api/parcels/<key>/logs?goal=<slug>` returns existing `goal`, `parcel`, `chainDocuments`, `invocationAudit`, `stateLines` plus `documents: SourceDocument[]` containing exactly the selected spec from the existing join (done-vs-active duplicate precedence unchanged). No selected spec yields empty `documents` plus explicit unavailable diagnostic.

AC3. Lexical and realpath containment tests pass for plugin, native, and initiative layouts; symlink escapes and unconfigured roots are withheld.

AC4. Bounded-read tests pass: content ≤1 MiB is returned; >1 MiB is withheld with reason; no unbounded read occurs.

AC5. Existing console behavior assertions remain intact and pass; tests are extended additively. New tests cover: independent fixtures per layout, lexical/symlink escape, missing/error, >1 MiB, no selected spec, duplicate preference, and multi-root/read-only behavior.

AC6. UI displays goal documents on goal detail (without parcel) and selected spec content in parcel logs/details, with all content and diagnostics escaped.

AC7. `npm test`, `npm run typecheck`, and `npm run lint` pass in ops-console. Module audits and root assertion rules remain unchanged.

AC8. Real browser navigation against actual configured extra roots and selected spec via existing routes is demonstrated; no operator service replacement or private inputs are sent externally.

## Out of Scope

- Adding routes or changing the frozen FOC-P0 route table (X1).
- Changing derivation rules, state logic, or `derive.ts` required properties.
- Client-supplied path endpoints or directory listing.
- UI redesign or new navigation paradigms.
- Config/scan changes beyond reusing existing selected root dirs and `SpecFact.absPath`.
- Approval, dispatch, handoff, refresh, or global doc indexing (TO-P5/P6 later).
- Operator service replacement or external transmission of private inputs.

## Context & References

- [FCA-P0 §2 refs](../../specs/active/FCA-P0-ops-console-multi-root-and-status-index.md#2-additive-surface-the-only-changes)
- [FOC-P0 Constraints C1/X1](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#constraints)
- [config.ts](../../../ops-console/src/config.ts) — goal tree layouts and root assertions
- [DOC-P](observation-scenarios.md#doc-p), [DOC-N](observation-scenarios.md#doc-n)
- [Accepted DOC: designated documents and locators](observation-contract-amendment.md#doc--designated-documents-and-locators) (this ticket's controlling amendment)

## Allowed Files

- `plugins/foreman-line/ops-console/src/types.ts` — add `SourceDocument`, reusing the existing TO-P2 `Locator` type
- `plugins/foreman-line/ops-console/src/sources.ts` — NEW: bounded designated reader with containment checks
- `plugins/foreman-line/ops-console/src/project.ts` — expose/reuse single actual `selectedSpec` join seam without changing derive states
- `plugins/foreman-line/ops-console/src/api.ts` — extend existing goal/detail/logs routes with `documents`
- `plugins/foreman-line/ops-console/ui/app.js` — extend existing UI to render documents, escape all content/diagnostics

Tests (separate from five implementation files):

- `plugins/foreman-line/ops-console/tests/sources.test.ts` — new bounded reader cases
- `plugins/foreman-line/ops-console/tests/api.test.ts` — additive route cases
- `plugins/foreman-line/ops-console/tests/multi-root.test.ts` — actual selected-root layout cases
- `plugins/foreman-line/ops-console/tests/read-only.test.ts` — preserved mutation boundary

## Verification Plan

V1. Unit tests: NEW `sources.test.ts` covers containment (lexical + realpath), symlink escape, missing/error, >1 MiB, no selected spec, duplicate preference, and layout-specific paths for plugin/native/initiative.

V2. Integration tests: existing `api.test.ts` extended to assert `documents` shape, status/diagnostic correctness, and preservation of all existing fields/routes.

V3. Multi-root/read-only tests: existing suites pass; new assertions cover extra-root goal detail and parcel logs.

V4. Static checks: `npm run typecheck` and `npm run lint` pass; module audits and root assertion rules unchanged.

V5. Browser proof: real browser navigation against actual configured extra roots and selected spec via existing routes; no `file://` strings used as proof.

V6. Dual independent critical review: focus on root binding, designation, containment, bounds, legacy compatibility, and consumer UI proof.

Coordinator draft corrections: schema dates, full test Allowed Files, actual TO-P2 diagnostics/Locator reuse, source-contract link, path-component containment (prefix-only tests are unsafe), and additive test wording reconciled. Draft only outside active/ specs; no shaping-result emission, Gate-2 activation, builder dispatch or acceptance. All parent-source interfaces, shared join seam, owner windows, and five-file closure must be rereconciled before activation; gaps halt for amendment before code. Reviewers must answer separately whether actual selected root/layout and designated file bind; lexical and physical escapes including sibling-prefix paths fail; bounded reads never exceed limit; legacy fields/joins/read-only behavior survive; and real API/browser consumers show the actual documents.
