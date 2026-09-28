---
ticket: JEV-P4
title: Jev portable-container boundary and security scenarios
status: active
owner: clinton.morgan
created: 2026-09-22
updated: 2026-09-22
risk: elevated
surfaces:
  - plugins/foreman-line/jev-decisions/tests/p4-boundary-scenarios.test.ts
  - plugins/foreman-line/jev-decisions/tests/fixtures/p4/
  - plugins/foreman-line/docs/specs/active/JEV-P4-container-boundary-security.md
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: judgment-required
involves:
  - routing-currency-and-merit-jev-alpha
---

# JEV-P4 — Portable-container boundary and security scenarios

## Intent

Define the security and boundary evidence required before the Jev decision
adapter is placed in a portable container. The scenarios exercise the already
merged runtime through its injected lease, transport, clock, and custody ports.
They are hermetic: they use synthetic provider responses and never open a live
OpenRouter connection or spend provider budget.

P4 is a boundary parcel after JEV-P0 through JEV-P3. It does not change the
decision schema, runtime interfaces, provider identity, endpoint, or parent
routing behavior. The container launcher and image packaging are separate
implementation work and must satisfy these scenarios before release closure.

## Constraints

- Only synthetic adapters and deterministic fixtures may be used; no live calls,
  credentials, or spend are permitted in this scenario suite.
- The runtime must remain the owner of refusal, hold, lease, budget, authority,
  and redaction behavior. Tests must not reproduce those rules in a second
  implementation.
- A missing credential must refuse before transport; a transport timeout or
  malformed provider/transport result must produce a bounded closed record.
- Provider cost above the hard USD 0.01 cap must not become a successful
  observation.
- Redirects and unverified TLS authorities must be rejected even when the
  response body is otherwise valid.
- A successful synthetic adapter must prove injected seams, exact endpoint and
  request controls, terminal lease closure, and non-disclosure of the API key.
- No test may assert or print a raw provider body, authorization header, secret,
  or untrusted exception detail in a returned record.

## Allowed Files

- `plugins/foreman-line/jev-decisions/tests/p4-boundary-scenarios.test.ts`
- `plugins/foreman-line/jev-decisions/tests/fixtures/p4/**`
- `plugins/foreman-line/docs/specs/active/JEV-P4-container-boundary-security.md`

## Acceptance Criteria

AC-1: Missing `OPENROUTER_API_KEY` refuses before the transport seam is called.

AC-2: Malformed provider and malformed transport results fail closed with
bounded reason codes and terminalized leases.

AC-3: A synthetic timeout/refusal path cannot produce a live observation or
open a second attempt; an occupied lease refuses before transport.

AC-4: Provider cost above USD 0.01 is rejected, and the bounded record does not
contain provider payload or credential material.

AC-5: Redirect-following and unverified-TLS authority metadata are rejected
even with a valid synthetic provider body.

AC-6: The successful synthetic adapter uses injected fakes, verifies the exact
OpenRouter alpha Decisions endpoint and request controls, closes the lease, and
returns only the redacted live-observation shape.

AC-7: The focused suite is deterministic, has no live network or spend, and
passes type/syntax checks. Reverting the relevant runtime boundary behavior
causes at least one scenario to fail.

## Out of Scope

Container image construction, base-image selection, Docker daemon operation,
health endpoints, dependency publication, CI changes, host configuration,
provider credential provisioning, API/schema amendments, replay digest policy,
and Gate 3/release acceptance.

## Verification Plan

Run the focused P4 test file with the package's existing Node test command
surface and run `node --check` on the new test. Run the spec linter against this
active spec. Verify that no request leaves the process, no API key is printed or
returned, and no changes occur outside the Allowed Files. Record any full-suite
baseline failures separately from the P4 result.

## Evidence Map

| Boundary | Scenario | Expected result |
| --- | --- | --- |
| Credential | missing key | `evidence:R06` refusal before transport |
| Provider/transport | malformed body or authority | `evidence:R10` or `evidence:R04` refusal |
| Timeout/lease | synthetic rejection or occupied lease | `evidence:R04` / `evidence:R16` refusal |
| Budget | provider cost above cap | `evidence:R13` closed record |
| Authority | redirect or unverified TLS | `evidence:R04` refusal |
| Secret handling | success with injected key | live observation excludes key |
| Success | synthetic injected adapter | valid bounded observation and terminal lease |
