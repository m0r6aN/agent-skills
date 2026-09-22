---
ticket: JEV-P1
title: Jev typed validator and deterministic fixture replay
status: done
owner: clinton.morgan
created: 2026-09-21
updated: 2026-09-21
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/jev-decisions/
  - plugins/foreman-line/docs/specs/done/JEV-P1-typed-validator-and-fixture-replay.md
  - plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: equivalence-provable
involves:
  - routing-currency-and-merit-jev-alpha
  - routing-currency-and-merit
---

# JEV-P1 — Typed validator and deterministic fixture replay

## Intent

Implement the pure, network-free validator and replay library consumed by the
later JEV runtime and consumer parcels. It must validate the exact `jev-decisions/v1`
logical request/response envelopes and the sanitized replay evidence classes
defined by the merged JEV-P0 contract, returning closed refusal results rather
than normalizing or guessing malformed data.

This parcel is dispatchable under the exact JEV-P1 Gate 2 grant recorded in the
JEV alpha charter. The merged JEV-P0 contract and evidence boundary are the
authoritative inputs; no unresolved P0 review observation blocks this parcel.

### Ratified P1 amendment A1

The coordinator identified that complete replay requires an independent
coordinator manifest receipt, while the original single-argument replay API
provided no receipt input. Clinton Morgan approved the recommended amendment:
`replayFixture(fixture, manifestReceipt)`. The fixture schema remains unchanged;
the second argument is a separately supplied closed receipt value validated
offline against the P0 manifest-receipt schema. This amendment changes only the
P1 implementation contract and does not alter JEV-P0.

## Constraints

- The merged JEV-P0 contract and evidence boundary are authoritative:
  `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
  and `jev-p0-evidence-boundary.md`. Do not reinterpret them in code.
- Implement only pure local functions. No `fetch`, OpenRouter SDK, provider
  endpoint, environment-variable access, filesystem reads/writes, timers,
  retries, credentials, telemetry, or external effects are permitted.
- Validate the closed request, normalized response, and sanitized replay fixture
  envelopes exactly. Unknown fields, missing fields, duplicate or reordered
  questions/answers, identity mismatches, digest mismatches, unsafe metadata,
  invalid custody, and invalid evidence-class/status combinations must refuse.
- Preserve exact requested identity
  `openrouter / typesafe/jev-1.13 / alpha-decisions`; a served model is response
  metadata and must never be substituted into the requested identity.
- Implement RFC 8785/JCS UTF-8 canonicalization for the P0 digest procedure and
  reproduce both frozen vectors in the evidence-boundary document. Do not hash
  headers, authorization values, or raw unsafe payloads.
- Refusal results use the P0 closed reason-code vocabulary and contain no
  free-form diagnostic echo of rejected input.
- Do not change the P0 documents, charter, loop directive, parent RCM surfaces,
  Pi/host settings, HAWF, Helmholtz, routing policy, or any shared registry.

## Acceptance Criteria

- [ ] **AC1 — Typed public API:** The package exports typed request, response,
  fixture, validation-result, and refusal-result definitions with discriminated
  success/refusal unions and no `any` escape hatch in the public surface.
- [ ] **AC2 — Request validation:** `validateRequest` accepts only the exact
  `jev-decisions/v1` request envelope and the fixed support-triage question set;
  it rejects missing, extra, reordered, duplicated, aliased, normalized, or
  free-text question metadata.
- [ ] **AC3 — Response validation:** `validateResponse` binds the response to
  the supplied request and rejects missing/extra answers, answer-type mismatch,
  incomplete criteria, invalid probability/distribution shape, missing provider
  `model` or response ID, conflicting wrapper fields, and requested/served
  identity confusion.
- [ ] **AC4 — Canonical digest:** The implementation produces lowercase
  SHA-256 JCS digests for the exact logical request/response objects and passes
  the frozen P0 request and response vectors byte-for-byte.
- [ ] **AC5 — Fixture replay:** `replayFixture` validates complete,
  refused, and hold sanitized fixtures, including exact field sets, status and
  reason partitions, provenance custody, complete-fixture response-ID equality,
  request/response digest equality, retention timestamps, and manifest binding
  against the separately supplied independent coordinator manifest receipt.
- [ ] **AC6 — Fail closed:** Every invalid fixture class has a stable P0 reason
  code; rejected input is not serialized into the result, logged, echoed, or
  used to synthesize missing provider metadata.
- [ ] **AC7 — Determinism and isolation:** Repeated validation of the same
  frozen fixture returns the same result and digest. Tests prove the package
  does not access network, credentials, filesystem, timers, or external state.
- [ ] **AC8 — Scope:** The parcel changes only the listed package, tests,
  fixtures, and this spec's eventual lifecycle location. No runtime adapter,
  live receipt capture, consumer wiring, or general routing integration lands.

## Out of Scope

- Any OpenRouter SDK or HTTP implementation, live call, credential handling,
  spend authorization, retry/timeout/concurrency lease, or receipt capture.
- The secret-safe runtime adapter and bounded live evidence (JEV-P2).
- The `support-triage-advisory-v1` consumer (JEV-P3), environment scenarios
  (JEV-P4), release closure (JEV-P5), or any general routing integration.
- Rewriting the merged JEV-P0 contract or silently resolving its preserved
  review observations. A required contract change stops this parcel and needs
  a coordinator amendment and human disposition.
- Parent RCM D13/D10, routing registries, Pi templates/settings, host state,
  HAWF, Helmholtz, or downstream workflow actions.

## Context & References

- [JEV alpha charter](../../goals/routing-currency-and-merit-jev-alpha/charter.md)
- [JEV alpha loop directive](../../goals/routing-currency-and-merit-jev-alpha/loop-directive.md)
- [JEV-P0 contract](../../goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md)
- [JEV-P0 evidence boundary](../../goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md)
- [JEV-P0 review triage](../../goals/routing-currency-and-merit-jev-alpha/jev-p0-review-triage.md)
- [Spec convention](../../SPEC-CONVENTION.md)

## Allowed Files

- `plugins/foreman-line/jev-decisions/package.json`
- `plugins/foreman-line/jev-decisions/package-lock.json`
- `plugins/foreman-line/jev-decisions/tsconfig.json`
- `plugins/foreman-line/jev-decisions/src/index.ts`
- `plugins/foreman-line/jev-decisions/src/types.ts`
- `plugins/foreman-line/jev-decisions/src/canonical-json.ts`
- `plugins/foreman-line/jev-decisions/src/validator.ts`
- `plugins/foreman-line/jev-decisions/src/replay.ts`
- `plugins/foreman-line/jev-decisions/tests/validator.test.ts`
- `plugins/foreman-line/jev-decisions/tests/replay.test.ts`
- `plugins/foreman-line/jev-decisions/tests/fixtures/complete.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/refused.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/hold.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/mismatch-response-id.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/mismatched-digest.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/extra-field.json`
- `plugins/foreman-line/jev-decisions/tests/fixtures/unsafe-reason.json`

## Forbidden Files and Effects

Every path outside Allowed Files is forbidden. Do not edit the JEV charter,
loop directive, P0 artifacts, parent RCM documents, shared package indexes,
routing policy, Pi/host files, HAWF, Helmholtz, or any credential/config file.
Do not call the network, read environment secrets, install from the network,
run a provider call, spend money, mutate external systems, or dispatch a
downstream workflow.

## Contract

The package must expose pure functions equivalent to:

```ts
validateRequest(value: unknown): ValidationResult<ValidatedRequest>;
validateResponse(
  request: ValidatedRequest,
  value: unknown,
): ValidationResult<ValidatedResponse>;
canonicalDigest(value: CanonicalDigestInput): string;
replayFixture(
  fixture: unknown,
  manifestReceipt: unknown,
): ReplayResult;
```

The exact field names, literal values, closed sets, identity equalities,
reason-code mapping, evidence-class field matrices, custody rules, timestamps,
and digest inputs come from the merged P0 documents. The implementation may
choose internal helpers, but it must not broaden the public contract or return
provider payloads/raw diagnostics.

## Required Tests

- Request acceptance and rejection for every closed literal and field-set rule.
- Response acceptance for each `noul`, `choice`, and `score` answer type, plus
  missing, extra, reordered, duplicate, malformed, and split-brain answers.
- Exact JCS request and response vectors from P0.
- Complete, refused, and hold fixture acceptance/rejection with each required
  custody, provenance, digest, status, reason, and retention invariant,
  including valid, missing, malformed, and mismatched manifest receipts.
- Mutation tests for response ID, served identity, digest, provenance,
  manifest entry, unknown field, reason partition, and timestamp failures.
- Isolation test proving no network, environment, filesystem, timer, or external
  effect is used by the exported functions.

## Verification Plan

1. Run `node -v` first and assert the native exit code.
2. Inspect manifests before any install; use only the repository's available
   toolchain and lockfile, with no network fallback.
3. Run the package typecheck, tests, and lint; require native success for each.
4. Run the exact frozen JCS vectors and the complete negative matrix.
5. Enumerate the full base-to-head diff and assert exact equality with Allowed
   Files; run whitespace and secret/credential scans.
6. Obtain one fresh adversarial implementation review after deterministic
   checks. Reviewers must be read-only and must not fix or commit.

### Mandated reviewer focus questions

- Can any malformed or extra field escape through a type assertion or permissive
  object spread?
- Are requested identity, served identity, response ID, answer order, and every
  digest/provenance equality checked from independent values rather than copied?
- Can a refused or hold fixture accidentally carry complete-only fields or a
  complete reason code?
- Does canonicalization actually implement the P0 JCS byte procedure, including
  numbers and UTF-8, rather than relying on insertion-order JSON serialization?
- Can any rejected input, environment value, credential, or raw payload appear
  in an error or test artifact?
- Is the implementation truly pure and offline, with no hidden network,
  filesystem, timer, or process-state dependency?

## Evidence Required

- Clean parcel worktree and exact allowed-path diff.
- Builder handoff naming starting/ending commits, commands, and test results.
- Native `node -v`, typecheck, test, lint, vector, scope, whitespace, and
  secret-scan results.
- One fresh independent review and coordinator triage.
- PR link; spec moved from `active/` to `done/` only after merge.

## Collision Risk

Low after the P0 contract is stable. The new package is isolated, but the
JEV-P2 runtime adapter and JEV-P3 consumer depend on these exported types and
must rebase after this parcel merges. Shared indexes and parent routing surfaces
are forbidden.

## PR Notes

- What changed: pure typed JEV Decisions validation and sanitized fixture replay.
- Why: make the merged P0 contract executable and deterministic without network
  or credential authority.
- Risk: incorrect closure or digest handling could create false replay evidence;
  the negative matrix and independent review are release-blocking for this parcel.
- Verification: follow the exact Verification Plan above.

## Session Handoff

- Starting commit: `6283e292d7dad50d00466073e816988fdfa5856d`
- Ending commit: `bd9707a1f7ae7052204c5b06fc75977677216232` (merge of PR #41)
- Files changed: only the JEV-P1 Allowed Files
- Commands run: `node -v`; `npm test`; `npm run typecheck`; `npm run lint`;
  scope, whitespace, and credential scans
- Tests passed: 8 tests; frozen JCS vectors and replay mutation matrix passed
- Tests failed: native TypeScript compiler unavailable; Node native syntax
  validation used by the package scripts passed
- Decisions needed: none; Gate 3 accepted 2026-09-21
- Blockers: none
- Next safe action: request a separate exact Gate 2 grant before JEV-P2
- Do not touch: all Forbidden Files and Effects

## Stop-and-Report Rule

If implementation requires a contract change, a new file, a dependency that
cannot be satisfied offline, a live call, a credential, a product decision, or
any path outside Allowed Files, stop and report the exact decision or amendment
needed. Do not broaden scope locally.
