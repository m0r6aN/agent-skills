---
ticket: TO-P1
title: Conservative current ratification reader
status: active
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/ops-console
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: public
---

# TO-P1 — Conservative current ratification reader

## Intent

Replace the broad text proxy in `plugins/foreman-line/ops-console/src/scan.ts` with a bounded ratification reader that implements the accepted TO-P0 RAT and ATT semantics for current evidence only.

The reader must recognize supported positive and negative current records in selected-tree `charter.md` and `loop-directive.md`, distinguish `granted`, `pending`, and `unknown` conservatively, and persist exact source/line explanations without claiming authenticated authority.

The change is additive to existing read-only projection surfaces. It must not alter writable-file authority, the handoff registry, membership behavior, designated-document behavior, refresh behavior, or the existing five parcel states/routes.

## Constraints

- TO-P0 and TO-B0 must land before builder activation and Gate-2 use.
- Exact branch/worktree are to be named by coordinator preflight; this parcel does not fabricate them.
- Use only current goal `charter.md` and `loop-directive.md`; zero link recursion.
- Do not follow referenced links, attached examples, historical notes, quoted text, fenced code, blockquotes, tables, or embedded prose as ratification evidence.
- Treat missing or unreadable sources as `unknown`.
- Match labels/headings/value tokens case-insensitively.
- Accept balanced bold delimiters, including multiline value emphasis; unmatched emphasis is unsupported.
- Dialect A positive: first eligible top-metadata `Status:` before first level-two heading with leading `RATIFIED` or `FULLY RATIFIED`.
- Dialect A negative: current anchored `Status:` with immediately following `PENDING`, `DRAFT`, `UNRATIFIED`, `NOT RATIFIED`, or `NOT GRANTED`.
- Dialect B positive: inside an exact `Gate 1 record` or `Gates and standing authorizations` section (optional dash-description), a standalone bullet/bold `Gate 1:` record with immediately following `GRANTED` or `RATIFIED`; a bare record outside that heading cannot grant.
- Current anchored standalone `Status:` or `Gate 1:` negative records participate regardless of positive metadata position/B heading, after the same exclusions; no token-only scan.
- Collect all eligible current negative records across both sources, even after a positive metadata record.
- One supported current grant plus any supported current denial yields `unknown`.
- Unsupported standalone current goal-Gate-1 revocation, conditional evidence, or unresolved/superseding text about the current grant yields `unknown`.
- Negation about plan review, Gate 2/3, scoped parcels, or historical records must not negate goal Gate 1.
- No token-only scan; preserve exact source/line explanations.
- No rewriting of records, no authenticated-authority claim, no route/state/registry changes.
- Add `attention.ratificationUnknown: 0|1`; keep `ratificationPending`; `total = hung + failed + awaitingGate + ratificationPending + ratificationUnknown`.
- `unknown` forces goal active even when queue is empty, all parcels complete, or narrative says closed.
- Exactly one goal-level unknown remedy: existing Remedy shape, `parcel:null`, `cause:'ratification-evidence'`, with branches in this order: inspect/reconcile actual sources first, ask owner if unresolved next, park last; at least two branches.
- Existing pending remedy remains unchanged.
- Implementation should keep the bounded lexer isolated, likely via a new pure `ratification.ts`, with `scan.ts` and other readers calling it.
- Five or fewer implementation files; test files additional but bounded.
- Every listed path must be exact under `plugins/foreman-line/ops-console/{src|tests}/...`.
- No package manifests, generated-data edits, or fixture mutation.

## Acceptance Criteria

- Current supported positive records in actual real public records are read as `granted`, including w4 first `Status` metadata and the current trustworthy-observation / foreman-ops-console forms.
- Current supported negative records are collected from both sources and from all eligible positions outside exclusions.
- Split positive/negative evidence across charter and directive produces `unknown`.
- Hostile charter with `Status: RATIFIED` followed by `Status: NOT RATIFIED` before `## Queue` produces `unknown`.
- Quoted, fenced, blockquoted, table, historical, archive, example, instruction, superseded, and linked-only evidence confers nothing.
- Missing charter, missing directive, or unreadable source yields `unknown` with diagnostics.
- Goal detail retains existing read-only ratification detail or adds an additive evidence field only if necessary.
- `/api/goals` status adds `attention.ratificationUnknown` and includes it in `total`.
- Unknown goals remain active and emit exactly one `ratification-evidence` remedy.
- Pending goals continue to use the existing pending remedy path unchanged.
- Unsupported or legacy phrasing is not rewritten to fit the parser.
- No changes to membership rules, root-doc projection/refresh rules, writable-file authority, or handoff registry.
- Ops-console package verification includes `npm test`, typecheck, lint, meaningful scoped corpus tests, and dual independent critical review.
- Real supported-positive records and exclusion fixtures are exercised through scanGoal without changing existing API routes.

## Out of Scope

- Landing TO-P0 or TO-B0.
- Dispatch execution, approval minting, receipts minting, merge authority, or new permissions.
- Any authenticated authority or cryptographic trust claim.
- Historical-record rewriting.
- TO-P5 remediation of the actual slug/command defect.
- Membership/rootdoc projection or refresh changes.
- New routes or changes to the five parcel states/routes.

## Context & References

TO-B0 merged96ffadc5; TO-P0 PR167 merged78c8b41feb07e4b274d402b54376ebf5b934ce4b at2026-10-10T17:56:37Z after both exactheadf4a46e21 full CI chains passed. Accepted RAT/ATT companion is on main. Source bytes unchanged by the documentation merge; current exact original/CFF ownership preflight is recorded below.

The current implementation in `plugins/foreman-line/ops-console/src/scan.ts` uses a broad line scan for `Gate 1` plus `ratified|granted`; that is intentionally being replaced by the conservative reader described in the accepted companion grammar and scenarios.

References:

- `plugins/foreman-line/docs/goals/trustworthy-observation/to-p1-ratification-corpus-draft.json` — 34 unexecuted contract-derived candidate fixtures; reconcile against RAT before using as assertions. This is a read-only shaping input, not an additional builder Allowed File.

- `plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md`
- `plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md`
- `plugins/foreman-line/ops-console/src/scan.ts`
- `plugins/foreman-line/ops-console/src/status.ts`
- `plugins/foreman-line/ops-console/src/remedy.ts`
- `plugins/foreman-line/ops-console/src/types.ts`

## Allowed Files

- `plugins/foreman-line/ops-console/src/scan.ts`
- `plugins/foreman-line/ops-console/src/ratification.ts`
- `plugins/foreman-line/ops-console/src/status.ts`
- `plugins/foreman-line/ops-console/src/remedy.ts`
- `plugins/foreman-line/ops-console/src/types.ts`
- `plugins/foreman-line/ops-console/tests/ratification.test.ts`
- `plugins/foreman-line/ops-console/tests/gates.test.ts`
- `plugins/foreman-line/ops-console/tests/multi-root.test.ts`
- `plugins/foreman-line/ops-console/tests/remedy.test.ts`

## Verification Plan

- Run package `npm test`, typecheck, and lint.
- Add hostile grammar and integration corpus tests using real public record excerpts.
- Verify supported positive, supported negative, excluded, missing/unreadable, and cross-source conflict cases.
- Verify `ratificationUnknown` counting, active behavior, and the single unknown remedy.
- Verify compatibility expectations for unsupported grammar in `gates.test.ts`.
- Verify multi-root/status unknown cases and remedy assertions.
- Require dual independent critical reviews after independent implementation verification and before acceptance/merge.

Mandated reviewer focus questions:

- Is the reader sufficiently conservative about current vs excluded evidence without token-only scanning?
- Are all negative records collected across both sources and all eligible positions?
- Does `unknown` remain active in every empty/complete/closed narrative case?
- Is exactly one unknown remedy emitted with preserve-first ordering?
- Are diagnostics additive and source/line precise without implying authenticated authority?
- Do the tests prove compatibility with actual public records and hostile fixtures?

## Activation details

Worktree /home/cmorgan76/Work/foreman-to-p1, branch feat/foreman-to-p1-ratification, rebased onto actual main78c8b41f before activation. Exact scope is committed before code. Baseline independent92tests/typecheck/lint pass at96ffadc5, unchanged source at78c8b41f; count92 is rework tripwire. Fresh byte comparison confirms all original overlaps still match landed source/FCA; inspected CFF worktrees have clean exact console paths. Preserve those worktrees, queues, and any concurrent new changes.

Preserve scanGoal null on unreadable/missing required directive; pure reader reports unknown but creates no GoalRecord. TO-P2 owns undiscoverable list diagnostics. Optional missing charter remains unknown in discoverable goals.

Preserve status/detail; add optional evidence?:readonly RatificationEvidence[]. Exact item fields: source:'charter'|'loop-directive'; locator:Locator; line:number|null; kind:'grant'|'denial'|'unsupported'|'missing'|'unreadable'; detail:string. Locator:{root:string,relativePath:string} uses actual selected configured root and contained relative goalDir/file, never alias paths. Lines one-based; read failures null. Reuse Locator downstream; excluded prose does not become current evidence. Read-only proxy, not authorization.

Unknown count/activity and existing explanatory remedy panel are P1; unknown-only board-banner explanation remains explicitly TO-P6 with meaningful test. No UI scope expansion. Unknown remedy explains actual source identities and withholds unsafe/unavailable editor strings instead of alias-as-path editorCmd; existing pending remedy unchanged.

Allowed gate tests meaningfully change supported Status:DRAFT to pending, unsupported review-scheduled wording to unknown. Exact attention assertions add ratificationUnknown:0 and unknown/conflict/closed/empty cases assert1, total/activity and exactly one goal remedy. Inline public excerpts allowed; candidate corpus34 reconciled with RAT before assertions, never treated as already tested. No record/fixture rewriting.

Original overlaps match already landed source and remain preserved; any new live ownership/diff holds dispatch. Parent main at activation is78c8b41f, exact branch/worktree stated above. Standing constraints plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md. Tool-free preferred Pi worker, public attachments only, exact-path materialization, no loaded Claude envelope claim. Separate Step0 restate/stop precedes code continuation. Independent verifier plus two architecture reviewers, exact-head green CI and normal delegated merge required.

Run the unchanged D19 audit/read-only negative controls after source changes; do not edit audit definitions, manifests, or other goals. Any path beyond the nine Allowed Files requires a separately committed exact spec amendment before code.

## Step0 flag dispositions — committed before code

1. Existing tests/support/materialize.ts line248 already emits charterStatus as top-metadata **Status:**; no support-file edit or scope expansion. Update only the allowed tests as specified.
2. Unknown remedy uses evidence locators to explain actual source identities in recommendation text. Its commands arrays are empty: withhold runnable editor strings with an explanation rather than constructing an unverified command. No Remedy shape/signature change, no alias-path reuse, and pending remedy unchanged.
3. Standalone historical-note markers: after normal Markdown exclusions and balanced-bold normalization, a line begins with case-insensitive literal Historical note or Historical-note, followed by end-of-line or an optional-whitespace colon/hyphen/en-dash/em-dash delimiter and explanation. Both the corpus Historical note: form and real w4 Historical note — ...: form are supported; suppression continues until the next heading. Do not broaden this to arbitrary standalone historical/archive words or incidental prose; such a superset could suppress a current denial. Heading-scoped exclusion markers remain the accepted whole-word set unchanged.

These clarify the existing accepted standalone historical-note rule and implementation mechanics; they do not change RAT/ATT outcomes, grant grammar, route/state/permission boundaries, or Allowed Files. Meaningful tests include actual W4-style marker, colon form, heading reset, and an incidental historical word that must not discard a current denial.
