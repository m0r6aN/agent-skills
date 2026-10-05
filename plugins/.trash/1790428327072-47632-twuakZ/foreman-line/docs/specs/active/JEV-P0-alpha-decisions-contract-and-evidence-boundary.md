---
ticket: JEV-P0
title: Jev alpha Decisions contract and evidence boundary
status: active
owner: clinton.morgan
created: 2026-09-21
updated: 2026-09-21
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/
  - plugins/foreman-line/docs/specs/active/JEV-P0-alpha-decisions-contract-and-evidence-boundary.md
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
involves:
  - routing-currency-and-merit-jev-alpha
  - routing-currency-and-merit
---

# JEV-P0 — Jev alpha Decisions contract and evidence boundary

## Intent

Freeze the architecture and evidence boundary for the separately governed
`openrouter-alpha-decisions` capability before any implementation parcel is
dispatched. The contract must make the approved alpha endpoint, exact requested
and served identities, typed Decisions envelope, credential-safe evidence,
bounded cost/time/size, deterministic replay, and fail-closed refusal behavior
unambiguous. Its consumers are the JEV coordinator, the later JEV-P1/P2/P3/P4/P5
parcels, and two independent fresh frontier reviewers; it does not grant a live
call, spend, parent-goal change, or general routing authority.

## Constraints

- The ratified JEV alpha charter and loop directive are authoritative. The
  parent RCM charter, D13 record, loop directive, and accepted RCM-P0 evidence
  remain read-only context. No text in this parcel may amend, reinterpret, or
  supersede the parent RCM D13 decision.
- The owned capability key is exactly `openrouter-alpha-decisions`. The only
  approved operation is `POST https://openrouter.ai/api/alpha/decisions`.
  `/api/v1/models`, chat/completions, the standard OpenRouter catalog, the
  existing RCM routing policy, and Pi's settings are separate surfaces and are
  not silently repointed.
- The canonical requested identity is the exact tuple
  `openrouter / typesafe/jev-1.13 / alpha-decisions`. The model identifier is
  case-sensitive and must not be aliased, normalized, suffix-stripped, or
  replaced with `typesafe/jev-latest`. A provider-declared served identifier,
  such as `typesafe/jev-1.13-20260917`, is response metadata and never a D13
  alias or general routing identity.
- Authentication is process-local `OPENROUTER_API_KEY` injection only in a
  later explicitly authorized runtime parcel. This parcel must not discover,
  read, persist, print, hash, or transmit credentials. Receipts, fixtures,
  logs, review reports, and evidence must contain neither the key nor a raw
  authorization header; a later auth observation may be boolean/status-only.
- JEV-P0 is contract/documentation work only. It must not make a provider call,
  invoke an MCP workload, install dependencies, spend money, create a service,
  or exercise a runtime effect. Gate 2 for JEV-P0 authorizes the later parcel
  loop, not an additional live call or standing spend authority.
- Any later live validation is bounded by the ratified J10 limits: one live
  call per explicitly authorized run, zero retries, concurrency one, 30-second
  timeout, 64-KiB request limit, and aggregate cap of $0.01 USD per run.
  Missing cost or currency is an evidence hold; it must never be estimated,
  converted, or silently accepted.
- Live observations are not replay authority. Replay requires a sanitized,
  provenance-tagged fixture with canonical JSON SHA-256 request and response
  digests and explicit requested/served identity binding. The contract must
  state the canonical byte procedure and distinguish live observation from
  replayable evidence without retaining unsafe payloads.
- The named consumer is `support-triage-advisory-v1` only. It may consume
  `is_urgent`, `department`, and `frustration` as recommendation data;
  application code owns authorization and all effects. Jev cannot route,
  escalate, spend, mutate state, or become a general RCM selector.
- Architecture/risk status requires two independent fresh frontier reviews.
  Reviewers are read-only, independent of the author and each other, and must
  review the contract and evidence boundary before any Gate 3 merge decision.

## Acceptance Criteria

- [ ] **AC1 — Capability ownership and endpoint:** The contract artifact names
  `openrouter-alpha-decisions` as the sole owned capability surface and binds it
  to exactly `POST https://openrouter.ai/api/alpha/decisions`; it explicitly
  refuses catalog, chat/completions, standard RCM, and Pi-routing substitution.
- [ ] **AC2 — Exact identity binding:** The request and response contract carries
  the exact requested provider/model/surface tuple, a separately recorded
  provider-declared served identity, and a binding rule that rejects missing,
  conflicting, aliased, normalized, or substituted identities. Served identity
  is never written into or used to satisfy parent RCM D13.
- [ ] **AC3 — Versioned typed schema:** The contract specifies the literal
  schema version `jev-decisions/v1` and a complete, versioned request/response
  envelope for state plus declared typed questions,
  allowing only `noul`, `choice`, and `score` question types. It requires unique
  question names, complete criteria coverage, matching answer types, valid
  confidence/distribution shape, requested and served identities, response ID,
  and schema version; malformed, incomplete, duplicate, or extra answers
  refuse. Responses larger than 64 KiB refuse before persistence or
  consumption.
- [ ] **AC4 — Credential-safe evidence:** The evidence boundary lists the
  minimum live-call fields: endpoint, canonical request digest, requested and
  served identities, schema version, stable response ID, server/client UTC
  timestamps, usage, and currency-qualified cost when available. It prohibits
  keys, authorization headers, raw secret-bearing payloads, and unsafe fixture
  retention, and records missing currency/cost as a hold.
- [ ] **AC5 — Concrete bounds:** The contract records one call, zero retries,
  concurrency one, 30-second timeout, 64-KiB request and response limits, and $0.01 USD
  aggregate cap per explicitly authorized run. It defines refusal for timeout,
  size overrun, retry attempt, concurrency violation, unknown cost/currency,
  or any attempt outside the bound. JEV-P0 itself performs zero calls and
  incurs zero spend.
- [ ] **AC6 — Replay and digests:** The contract requires sanitized,
  provenance-tagged fixtures and canonical JSON SHA-256 digests for request and
  response, with explicit byte/canonicalization rules and identity binding.
  Replay must validate deterministically from the fixture; a live observation
  cannot be treated as replay authority, and any digest/provenance/binding
  mismatch refuses.
- [ ] **AC7 — Refusal matrix:** A checkable refusal table covers endpoint,
  requested identity, served identity, schema version, malformed or incomplete
  envelope, missing answer, malformed distribution, authentication failure,
  timeout, size, non-JSON response, unqualified cost, digest, provenance,
  binding, retry, and unauthorized-consumer failures. No refusal path silently
  aliases, retries, downgrades, substitutes, routes, or mutates state.
- [ ] **AC8 — Consumer boundary:** The contract limits consumption to
  `support-triage-advisory-v1` and states that Jev answers are recommendation
  data only. Application code retains authorization and effects; no Jev answer
  can select a general model, authorize escalation, spend, routing, or state
  mutation.
- [ ] **AC9 — Parent-surface non-collision:** The contract records a negative
  proof plan covering unchanged parent RCM D13, boundary-routing D10, parent
  charter and loop directive, RCM routing registry/policy, Pi template and
  host settings, HAWF/Helmholtz surfaces, GMF receipt/envelope contracts, and
  standard routing. The parcel owns no file on those surfaces.
- [ ] **AC10 — Dual review gate:** Two independent fresh frontier review records
  are required before Gate 3, with explicit focus on identity confusion,
  credential leakage, cost/currency evidence, replay digest authority,
  refusal completeness, consumer effect escalation, and parent-surface
  collision. Review findings are read-only inputs to coordinator triage.
- [ ] **AC11 — No implementation or authority expansion:** JEV-P0 produces only
  its ratified contract/evidence-boundary documents and verification record. It
  creates no code, machine schema, test suite, runtime adapter, fixture replay
  implementation, network call, spend, host/Pi mutation, parent-goal edit,
  receipt, promotion, dispatch, or merge.

## Out of Scope

- Implementing the typed validator or deterministic fixture replay (JEV-P1).
- Implementing the secret-safe runtime adapter, live receipt capture, redaction,
  or any provider call (JEV-P2).
- Implementing or authorizing `support-triage-advisory-v1` (JEV-P3), boundary
  and security scenarios (JEV-P4), release closure (JEV-P5), general routing,
  standard catalog integration, or parent RCM integration.
- Editing the parent RCM charter, D13 records, loop directive, routing policy,
  Pi template/settings, goal index, HAWF, boundary-routing, GMF, host, or
  credential surfaces.
- Promoting `status: draft`, dispatching a builder, registering Jira, minting a
  receipt, hashing a Stage-A artifact, merging, or granting Gate 3.

## Context & References

- [Ratified JEV alpha charter](../../goals/routing-currency-and-merit-jev-alpha/charter.md)
- [JEV alpha loop directive](../../goals/routing-currency-and-merit-jev-alpha/loop-directive.md)
- [Parent RCM charter and D13](../../goals/routing-currency-and-merit/charter.md)
- [Parent RCM loop directive](../../goals/routing-currency-and-merit/loop-directive.md)
- [RCM-P0 review triage](../../goals/routing-currency-and-merit/rcm-p0-review-triage.md)
- [RCM-P0 verification and Jev evidence](../../goals/routing-currency-and-merit/rcm-p0-verification.md)
- [RCM exit audit](../../goals/routing-currency-and-merit/exit-audit.md)
- [Completed RCM-P0 spec](../done/RCM-P0-current-instance-recon.md)
- [Repository SPEC-CONVENTION](../../SPEC-CONVENTION.md)
- [Frozen ShapingResult schema](../../contracts/schemas/shaping-result.schema.json)

## Allowed Files

The later JEV-P0 builder may create or edit only these exact contract/evidence
documents:

- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`

The shaping artifact itself is not a builder mutation target. Existing files may
not be overwritten without a coordinator-approved exact-path disposition.

## Forbidden Files and Effects

Every path outside Allowed Files is forbidden for parcel execution writes. This
includes the JEV charter and loop directive; the parent RCM charter, D13 and
loop records, RCM routing policy, Pi template/settings, goal index, HAWF,
boundary-routing, GMF, host, credential stores, source packages, schemas,
tests, fixtures, receipts, Jira, worktrees, branches, and installed-plugin
files. The parcel must not call the network, provider, MCP workload, or spend;
must not read credentials; and must not dispatch, promote, register, merge, or
perform downstream workflow effects.

## Verification Plan

Use only local, read-only checks after the contract documents are authored:

1. Run the repository's frozen frontmatter linter and the shaping package's
   two-layer advisory self-check against this exact active spec; require
   required body sections in order and non-empty Out of Scope.
2. Check that every Allowed Files entry is exact and that no forbidden surface
   appears in the changed-file set. Confirm parent RCM and JEV authority files
   are unchanged by a path-scoped diff.
3. Review the contract field-by-field against J1–J10 and the ratified
   replacement decisions, including schema `jev-decisions/v1` and the 64-KiB
   request/response limits.
4. Obtain two independent fresh frontier reviews before any Gate 3 request.

Mandated reviewer focus questions:

- Can a served model identifier, alias, or endpoint mismatch be mistaken for
  the requested identity or for parent RCM D13 eligibility?
- Can any evidence, fixture, digest input, log, or review report contain a
  credential, raw authorization header, or unsafe payload?
- Are the one-call, zero-retry, timeout, request-size, concurrency, and
  currency-qualified-cost bounds concrete and fail closed?
- Does replay prove the exact canonical request/response bytes and both
  identities, while keeping live observations non-authoritative?
- Can malformed, incomplete, non-JSON, or provider-unbound answers escape the
  refusal matrix?
- Can `support-triage-advisory-v1` or any parent/shared surface acquire routing,
  escalation, spend, mutation, or host/Pi authority by implication?

## Coordinator disposition

The coordinator records the shaper's proposed literals as the JEV-P0 contract:
schema version `jev-decisions/v1` and a maximum 64-KiB response size. These values
instantiate ratified J4/J10, do not change the locked decisions, and require
refusal before persistence or consumption when exceeded.
