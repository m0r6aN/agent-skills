---
ticket: TO-P3
title: Shared receipt membership and CLI parity
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
  - plugins/foreman-line/receipts/src/membership.ts
  - plugins/foreman-line/receipts/src/index.ts
  - plugins/foreman-line/receipts/src/cli.ts
  - plugins/foreman-line/ops-console/src/chain.ts
  - plugins/foreman-line/receipts/tests/membership.test.ts
  - plugins/foreman-line/receipts/tests/cli.test.ts
  - plugins/foreman-line/ops-console/tests/chain-walk.test.ts
---

# TO-P3 — Shared receipt membership and CLI parity

## Intent

Extract one receipts-owned pure filename-membership helper so the ops-console chain walk and the receipts directory CLI classify chain members identically. Today `plugins/foreman-line/ops-console/src/chain.ts` owns the frozen pattern `^[0-9]{6}-([A-F])-[a-z0-9-]+\.json$` while `plugins/foreman-line/receipts/src/cli.ts` selects every `*.json` entry — divergent membership definitions for the same receiptPath convention. Implement the accepted MEM exactly: one new helper, exported via index, consumed by console and CLI; existing schema, sequence/gap, hash-linkage, correlation, and structural-seal invariants in `plugins/foreman-line/receipts/src/validator.ts` remain untouched; no cryptographic or authentication claim.

## Constraints

- Parents TO-B0, TO-P0, TO-P1, TO-P2 must land; actual sources and owner windows reconcile before activation. Step 0 halts on scope gaps.
- The helper is pure: no filesystem reads, no path mutation, no normalization, no dropping of matching-but-invalid members.
- Exactly the regex `^[0-9]{6}-([A-F])-[a-z0-9-]+\.json$` and lexical filename order. ALL nonmatches excluded, including `notes.json`, `000001-Z-foo.json`, and kompress/routing/skill sidecars.
- `plugins/foreman-line/ops-console/src/chain.ts` may re-export the receipts-owned pattern as `CHAIN_MEMBER_PATTERN` for compatibility; no duplicate literal definition.
- TO-P2 invalid-member visibility, diagnostics, and isolation must be preserved: matching malformed/unreadable/nonobject evidence stays invalid or unavailable, never skipped.
- No roots, docs, handoffs, refresh, routes, or state changes. No manifest, dependency, or generated-fixture changes. No build command unless a manifest defines one.
- `plugins/foreman-line/receipts/src/validator.ts` is OUT of scope.
- Directory CLI exit codes: empty matching set →2; matching unreadable/unparseable →2; parsed null/primitive/array/schema/link/gap/correlation failure →1; valid members plus arbitrary nonmatching sidecars →0. Per-file CLI behavior unchanged.
- Four implementation files, not widened: the helper, index, CLI, console chain, plus bounded tests (new `membership.test.ts`, existing `cli.test.ts`, `chain-walk.test.ts`).
- Existing CLI tests may need filename-fixture retargeting if a sidecar was pretending to be a member; preserve actual negative semantics — never delete a test or an invalid member to force green.
- Mandated dual critical review with boundary questions; code-owner window shared-receipts preflight before dispatch (not assumed transferred from another goal).
- Public sources only for the shaper; the actual real-workflow path is privately inspected by the verifier, never sent externally.

## Acceptance Criteria

1. New `plugins/foreman-line/receipts/src/membership.ts` exports the membership pattern and pure `selectReceiptMemberFiles(entries: readonly string[]): string[]`, returning a new matching filename list in lexical order without mutating input; re-exported from `plugins/foreman-line/receipts/src/index.ts`.
2. `plugins/foreman-line/receipts/src/cli.ts` directory path consumes the helper; nonmatching files are excluded from the member set.
3. `plugins/foreman-line/ops-console/src/chain.ts` consumes the helper; `CHAIN_MEMBER_PATTERN` aliases the receipts-owned pattern with no duplicate literal.
4. Exit codes match the MEM matrix (empty→2, unreadable/unparseable member→2, parsed-invalid→1, valid+sidecars→0); per-file path unchanged.
5. All existing validator invariants (schema, sequence/gap, prevHash linkage, shared correlation, structural seal) behave identically; `validator.ts` unmodified.
6. Tests: new `plugins/foreman-line/receipts/tests/membership.test.ts`; updated `plugins/foreman-line/receipts/tests/cli.test.ts` and `plugins/foreman-line/ops-console/tests/chain-walk.test.ts` pass; `npm test`, typecheck, and lint pass in each affected package.
7. TO-P2 typed diagnostics/isolation for invalid members preserved in the console walk; CLI preserves its stderr/exit contract, with no new JSON response or argv surface.

## Out of Scope

- Validator logic, schema changes, or new invariant classes.
- Cryptographic sealing, authentication, or trust claims.
- Routes, refresh, state, roots, docs, or handoff changes.
- Manifest/dependency/fixture-generation changes.

## Context & References

- Accepted MEM (`plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md`) reaffirming FOC-P0 C2.2–4: `plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md` (C2 receipt-chain walk semantics); MEM-P/MEM-N in `plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md`.
- Current divergent implementations: `plugins/foreman-line/receipts/src/cli.ts` (all-JSON selection), `plugins/foreman-line/ops-console/src/chain.ts` (`CHAIN_MEMBER_PATTERN`).
- Delegated validator: `plugins/foreman-line/receipts/src/validator.ts` (`validateChain`, `isSealed` — read-only).

## Allowed Files

- `plugins/foreman-line/receipts/src/membership.ts` (new)
- `plugins/foreman-line/receipts/src/index.ts`
- `plugins/foreman-line/receipts/src/cli.ts`
- `plugins/foreman-line/ops-console/src/chain.ts`
- `plugins/foreman-line/receipts/tests/membership.test.ts` (new)
- `plugins/foreman-line/receipts/tests/cli.test.ts`
- `plugins/foreman-line/ops-console/tests/chain-walk.test.ts`

## Verification Plan

1. Run `npm test`, typecheck, and lint in `plugins/foreman-line/receipts` and `plugins/foreman-line/ops-console`; run focused membership and CLI tests.
2. Independently verify against the actual real workflow with genuine kompress/routing/skill sidecars: console walk and actual CLI agree on membership, ordering, and exit codes (privately inspected; never sent externally).
3. Synthetic negative proof with matching-but-bad members: schema-invalid, sequence-gap, prevHash-link, and correlation-mismatch members are surfaced as distinct invalid conditions (exit 1 / invalid walk), never skipped or reclassified; nonmatching sidecars (incl. `000001-Z-foo.json`, `notes.json`) excluded; empty matching set → exit 2.
4. Confirm `CHAIN_MEMBER_PATTERN` is a single-sourced alias and `validator.ts` is unmodified.
5. Dual critical review with boundary questions; code-owner shared-receipts preflight recorded before dispatch.

Coordinator draft preflight: count, source path, exact pure selection helper, and CLI/console diagnostic distinction corrected. This draft stays outside active/ specs, no shaping-result emission, Gate-2 activation, builder dispatch, or acceptance. Parent source and receipt-owner collision reconciliation remain mandatory before dispatch. Reviewers must answer: Is selection single-sourced with exact filename regex and lexical order? Are all matching unreadable/unparseable/nonobject/schema-invalid members refused with the MEM exit distinction rather than skipped? Are existing sequence/link/correlation/seal invariants and per-file behavior preserved? Are all TO-P2 console diagnostics/locator identities retained while nonmatching sidecars stay excluded?
