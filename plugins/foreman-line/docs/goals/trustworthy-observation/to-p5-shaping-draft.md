---
ticket: TO-P5
title: Grounded existing command handoffs
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
  - plugins/foreman-line/ops-console/src/handoff.ts
  - plugins/foreman-line/ops-console/src/invoke.ts
  - plugins/foreman-line/ops-console/src/remedy.ts
  - plugins/foreman-line/ops-console/ui/app.js
  - plugins/foreman-line/ops-console/src/api.ts

---

# TO-P5 — Grounded existing command handoffs

## Intent

Replace every invented or implied command the console presents with a grounded handoff derived only from the five existing flows/modes in `FLOW_REGISTRY` and the frozen request argv. Every presented command must be executable exactly as shown, or withheld with a truthful reason. Approval slug matching, approval CLI flag behavior, dispatch binary absence, validation path mapping, and multi-root execution eligibility are all bound to actual shipped reader/schema behavior — never projected, never approximated.

## Constraints

- **Frozen registry**: exactly five flows — `approval-show`, `approval-approve`, `approval-reject`, `dispatch-execute`, `receipts-validate`. No new flows, no new registry actions, no new editor rights.
- **Frozen argv**: approval verbs `[verb, slug, '--repo-root', root]`; dispatch `executeDispatch` same slots; validation `['validate', path]`. Request argv unchanged by any handoff logic.
- **Approval slug**: unique match to actual projected artifact filename `<slug>.projected.shaping-result.json` basename with frozen lowercase pattern `^[a-z0-9-]+$`; never parcel case conversion. Missing, unreadable, malformed, duplicate, or unsupported artifact → withhold with reason.
- **No projection**: validate existing projected data using the actual shipped reader/schema (`readShapingResult`, `resolveArtifact`); never project to fill a gap. Approval CLI defaults `docs/specs/active`; `--repo-root` does NOT select plugin `specsDir`; CLI does NOT pass flag `specsDir`. No invented flag, no new approval CLI implementation. Home plugin artifact default mismatch → WITHHOLD under accepted INV; no adapter amendment implicitly adopted. Any future adapter amendment requires separate review before scope/code.
- **Owner inputs never forged**: approve/reject remain present-only; Approval requires owner `--approver`, TTY and typed confirmation. Rejection permits an omitted reason; any supplied reason is an owner input. Frozen console args cannot capture these: explain requirements, never forge inputs, never claim an incomplete command is runnable.
- **Dispatch**: no bin exists → withhold runnable handoff; structured frozen argv presentation with reason permitted.
- **Root eligibility**: only primary root may execute non-minting flows; extra-root handoffs are presentation only. Advisor and invoke share same eligibility; advisor never calls invoke/exec.
- **Validation targets**: exact uniquely mapped workflow directory; duplicate chains withhold (lexicographic display winner/flag unchanged); unmapped has no invented target.
- **Command construction**: canonical absolute Node/tsx/shipped CLI code bindings from `invoke.ts`, selected root as cwd, structured subprocess argv, no shell spawn. Copy strings quote EVERY argument: bash/zsh/fish single-quote with apostrophe close-double-quoted-quote-reopen; PowerShell single-quote doubled embedded; cmd.exe copy withheld, structured argv retained. Supported-shell copies additive; default command string may be bash; helper metadata may provide others.
- **Editor references**: existing remediation editor references must not convert aliases into paths; unsupported binding → withhold with reason or use actual designated source path; no new editor flow. Preserve-first remedy ordering unchanged.
- **State/audit**: all five states and R1–R5 preserved; read-only except two existing state files; audit appends all requests; no CLI/gate capture, no projection, no approval writes; no docs/refresh redesign.

## Acceptance Criteria

1. Every handoff command is grounded in an existing `FLOW_REGISTRY` entry and frozen argv; no invented flags or flows.
2. Approval slug resolves to a unique, readable, schema-valid `<slug>.projected.shaping-result.json` via the shipped reader and frozen resolver behavior; all failure modes withhold with truthful reason.
3. Home plugin default specsDir mismatch withholds; no adapter amendment adopted.
4. Approve/reject presented with owner-requirement explanation; no forged approval `--approver`, TTY, confirmation, or optional rejection reason.
5. Dispatch-execute withheld with no-bin reason; structured argv shown.
6. Advisor extra-root handoffs remain presentation only; invoke preserves primary-root guards and refuses unsupported extra-root execution. No execution outside primary root.
7. Validation path uniquely mapped or withheld; duplicates/unmapped truthful.
8. Copy strings quote every argument correctly per shell; cmd.exe withheld.
9. Editor commands use designated source paths or withhold; no alias-to-path conversion.
10. All tests pass: new `handoff.test.ts` plus existing invoke/remedy/multi-root/read-only; `npm test`, typecheck, lint unchanged; D19 and read-only regressions green.

## Out of Scope

- New approval CLI implementation or flags.
- Adapter amendment for plugin specsDir (requires separate review).
- New registry actions, editor rights, or flows.
- Synthetic approval receipts.
- Docs/refresh redesign.
- External or private workflow/artifact inputs.

## Context & References

- [Accepted INV — truthful grounded handoffs](observation-contract-amendment.md#inv--truthful-grounded-handoffs).
- [FOC-P0 M1/A2](../../specs/active/FOC-P0-projection-contract-and-discovery-inventory.md#constraints)
- [FCA-P1 §3](../../specs/active/FCA-P1-remediation-advisor.md#3-additive-surface-the-only-changes)
- [INV-P](observation-scenarios.md#inv-p), [INV-N](observation-scenarios.md#inv-n)
- Shipped code: `plugins/foreman-line/ops-console/src/invoke.ts`, `plugins/foreman-line/ops-console/src/remedy.ts`, `plugins/foreman-line/ops-console/src/config.ts`, `plugins/foreman-line/approval/src/cli.ts`, `plugins/foreman-line/approval/src/resolve-input.ts` (approval/config are read-only references, not Allowed Files).

## Allowed Files

- `plugins/foreman-line/ops-console/src/handoff.ts` (NEW — shared read-only grounding and pure quote helper; no `child_process` import or writes)
- `plugins/foreman-line/ops-console/src/invoke.ts` (sole exec module; integrate handoff grounding)
- `plugins/foreman-line/ops-console/src/remedy.ts` (existing shape; grounded commands only)
- `plugins/foreman-line/ops-console/ui/app.js` (optional; supported-shell copies additive)
- `plugins/foreman-line/ops-console/src/api.ts` (optional; additive metadata only if needed)
- `plugins/foreman-line/ops-console/tests/handoff.test.ts` (NEW)

Existing tests allowed for additive grounded-behavior assertions:

- `plugins/foreman-line/ops-console/tests/invoke.test.ts`
- `plugins/foreman-line/ops-console/tests/remedy.test.ts`
- `plugins/foreman-line/ops-console/tests/multi-root.test.ts`
- `plugins/foreman-line/ops-console/tests/read-only.test.ts`

Flag any additional files before activation; no silent scope widening.

## Verification Plan

- **Unit**: `handoff.test.ts` covers slug/case matching, default-native vs plugin mismatch, valid vs malformed/duplicate/absent artifact, workflow duplicates/unmapped, quoted argv with spaces/apostrophes/newlines/injection, extra-root no-exec, owner input not forged, no projection/non-console write.
- **Existing**: invoke, remedy, multi-root, read-only suites unchanged and green.
- **Ops console**: `npm test`, `npm run typecheck`, `npm run lint` unchanged; D19 + read-only regressions green.
- **CLI parser/binding proof**: independent verification using only non-minting existing `show` and `validate`; no mutator/dispatch.
- **Shell matrix**: actual runtimes available; record supported/copy-only/unavailable honestly; cmd strings unsupported.
- **Review**: dual independent critical review focused on eligibility parity, root binding, argv + quote correctness, no-writing posture.
- **Sources**: public only; real private workflow/artifact inputs verified locally, not external.

Coordinator draft corrections: actual UI/test paths and implementation surfaces, explicit existing test Allowed Files, optional rejection reason and approve-only TTY/approver requirements, primary-root invoke refusal vs extra-root advisor presentation, and read-only grounding vs pure quoting corrected from shipped source. Resolver calls must never receive epicTitle or any projection option. Grounded registry handoffs are the five-flow surface; ancillary editor/gh templates without a verifiable target are withheld with reason, not promoted into new executable flows. PowerShell copies require the call operator for a quoted executable, with every argv element individually quoted. Draft only outside active/ specs; no shaping-result emission, builder activation, receipt, implementation acceptance, or implicit adapter amendment. Before activation, reconcile parent sources, exact target lookups, optional API/UI necessity and <=5-file closure. Reviewers answer separately actual-target/default-path truth, eligibility parity/extra-root refusal, shell argv preservation, and no projection/mutator/non-console write.
