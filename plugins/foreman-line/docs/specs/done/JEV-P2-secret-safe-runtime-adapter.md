---
ticket: JEV-P2
title: Jev secret-safe bounded runtime adapter and redacted receipt capture
status: done
owner: clinton.morgan
created: 2026-09-21
updated: 2026-09-22
supersedes: null
superseded_by: null
risk: architecture/risk
surfaces:
  - plugins/foreman-line/jev-decisions/src/runtime.ts
  - plugins/foreman-line/jev-decisions/src/index.ts
  - plugins/foreman-line/jev-decisions/tests/runtime.test.ts
  - plugins/foreman-line/docs/specs/active/JEV-P2-secret-safe-runtime-adapter.md
  - plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: security-sensitive
involves:
  - routing-currency-and-merit-jev-alpha
  - routing-currency-and-merit
---

# JEV-P2 — Secret-safe bounded runtime adapter and redacted receipt capture

## Intent

Implement the bounded runtime adapter that turns a closed support-triage state
into the exact JEV-P0 Decisions request, performs at most one authorized
OpenRouter alpha Decisions call, validates the normalized provider response via
the merged JEV-P1 package, and emits only a closed redacted live-observation,
refusal-record, or hold-record. The adapter owns no workflow effects and never
returns or persists a raw provider body, authorization header, credential, or
free-text diagnostic.

This parcel was dispatchable under the exact JEV-P2–P5 Gate 2 grant recorded in
the charter. JEV-P3, P4, and P5 were sequentially blocked until this parcel
passed its two fresh reviews, security review, merge, and human Gate 3 closure.

### P2 amendment A1

The coordinator identified that the public API contract requires the runtime
surface to be exported from the existing package entrypoint. The allowed-file
set therefore includes `src/index.ts` for an export-only change; no existing
P1 behavior or export is changed.

## Constraints

- Use only the merged P0 contract/evidence boundary and completed P1 package.
- The immutable endpoint is exactly
  `https://openrouter.ai/api/alpha/decisions`; method is `POST`; redirects are
  disabled; content negotiation is JSON; the adapter owns endpoint, body,
  authorization, and framing headers.
- Read `OPENROUTER_API_KEY` only at the moment of the authorized transmission.
  Never accept a caller-supplied key, print it, return it, hash it, persist it,
  or include it in an error, receipt, fixture, or test artifact.
- The requested identity is exactly
  `openrouter / typesafe/jev-1.13 / alpha-decisions`; a provider-served model
  is response metadata and is never substituted into the request identity.
- Require a coordinator-issued durable single-use lease, a custody-verified
  budget acknowledgement, one trusted coordinator clock, and an injected
  transport/lease seam for deterministic tests. The adapter must consume the
  lease before opening the socket and must not create, retry, reopen, or reuse
  a lease.
- Enforce the ratified bound: one call per authorized run, zero retries,
  concurrency one, 30-second timeout, 64-KiB request and response body limits,
  and aggregate cost cap $0.01 USD. Missing cost is a hold; malformed,
  non-USD, negative, non-finite, or over-cap cost is a refusal.
- Persist/return only the exact closed live-observation or generic refusal/hold
  field sets from P0. A failed pre-call is never represented as a
  `live-observation`.
- No changes to P0/P1 documents, parent RCM surfaces, routing registries,
  Pi/host state, HAWF, Helmholtz, or downstream workflows.

## Public API

The package adds a typed runtime surface without changing the P1 validator API:

```ts
executeDecision(input: RuntimeInput): Promise<RuntimeResult>;
```

`RuntimeInput` contains only the closed support-triage state, coordinator-issued
run/lease context, custody-verified budget acknowledgement, immutable custody
metadata for the receipt, one trusted clock, and test-only transport/lease
ports. It contains no API-key field, endpoint field, arbitrary headers, raw
body, retry option, or caller-selected question set.

`RuntimeResult` is a discriminated union. Success returns one complete closed
`live-observation`; pre-call failure returns only the exact generic
`refusal-record` or `hold-record` with a P0 reason code and retention fields.
Neither branch includes raw provider data or free-form diagnostics.

## Acceptance Criteria

- [x] **AC1 — Exact request:** The adapter constructs the P0 closed request
  with the exact identity, typed state, three questions, canonical request
  digest, and no caller-controlled endpoint/body/header field.
- [x] **AC2 — Secret boundary:** Missing credentials, transport errors, and
  provider responses never echo the key, authorization header, raw body, or
  unsafe payload. Static and runtime tests prove this.
- [x] **AC3 — Lease/budget authority:** The adapter validates exact lease and
  budget bindings, freshness, timestamps, custody metadata, single-use state,
  and consumes before socket open; retry/concurrency/reuse paths refuse or hold
  with the correct generic code.
- [x] **AC4 — Transport bound:** Only the immutable HTTPS endpoint and POST
  JSON request are used; redirects, non-2xx, non-JSON, invalid UTF-8, truncation,
  body over-limit, timeout, and transport failure produce generic refusal.
- [x] **AC5 — Response/cost validation:** Provider metadata is never invented;
  normalized response validation delegates to P1; missing metadata is R12 hold,
  malformed metadata/answers is refusal, and cost/usage is closed and bounded.
- [x] **AC6 — Redacted observation:** A success emits exactly the P0
  live-observation field set, with request/response JCS digests, bound
  requested/served identities, response ID, timestamps, usage, USD cost, and
  no raw or secret-bearing fields.
- [x] **AC7 — Isolation:** Tests use injected fake transport, lease, clock, and
  provider payloads; no test makes a live call or requires a credential. The
  production path has no filesystem, child process, telemetry, retry, or
  workflow-effect dependency.
- [x] **AC8 — Scope:** Only `runtime.ts`, the package entrypoint export, and
  `runtime.test.ts` are changed in the package; no P1 behavior, P0 document,
  registry, host, or parent surface is changed.

## Required tests and reviews

- Exact request/body and digest assertions, including caller-header/endpoint
  injection refusal.
- Missing, malformed, reused, stale, future, over-cap, and custody-mismatched
  budget/lease cases with the P0 reason/status partition.
- One-shot consume-before-socket ordering, timeout, redirect, non-JSON,
  non-2xx, over-size, malformed JSON, missing provider metadata, response-ID
  mismatch, malformed answer, usage, and cost matrices.
- Secret scans and assertions that rejected results contain none of the key,
  authorization header, raw provider body, or input diagnostic.
- One fresh security review plus two independent fresh architecture/risk
  reviews. Reviewers are read-only and do not fix or commit.

## Verification plan

1. Run `node -v` first and inspect the package manifest without installation.
2. Run package typecheck, tests, lint, frozen P1 vectors, and the complete
   negative matrix using injected offline seams.
3. Run scope, whitespace, secret, and dependency scans; assert only the two
   allowed implementation/test files changed.
4. Review the final diff for transport authority, credential non-retention,
   lease sequencing, cost bounds, and closed evidence fields.
5. Obtain two fresh architecture/risk reviews and one security review, triage
   every finding, and stop for human Gate 3 after merge.

## Allowed files

- `plugins/foreman-line/jev-decisions/src/runtime.ts`
- `plugins/foreman-line/jev-decisions/src/index.ts` (export-only)
- `plugins/foreman-line/jev-decisions/tests/runtime.test.ts`
- this spec until it moves to `docs/specs/done/` after Gate 3

## Forbidden files and effects

Every other path is forbidden, including P0/P1 artifacts, package manifests,
shared indexes, parent RCM/D13/D10 documents, routing registries, Pi/host files,
HAWF, Helmholtz, and downstream workflow surfaces. No live call is made during
tests; a separately recorded authorized smoke call is not part of the committed
test suite. No spend beyond the exact one-call/$0.01 bound is authorized.

## Session handoff

- Starting commit: `db8853b` after P2–P5 Gate 2 record and P2 export-scope amendment
- Ending commit: `34fc2f54cb39b22faed576fc3460cba1d3631745` (PR #42 merge)
- Post-merge verification: 19 tests passed; configured syntax checks passed;
  two architecture reviews and one security review returned PASS.
- Gate 3: accepted 2026-09-22 by Clinton Morgan; the exact P2 parcel is closed.
- Next action: shape and dispatch JEV-P3 under the already-granted strict-sequence
  Gate 2 authorization.
