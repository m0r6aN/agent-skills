# Routing Currency and Merit — Jev Alpha Decisions

**Status:** GATE 1 REOPENED — plan review changes pending ratification on 2026-09-21
**Prepared:** 2026-09-21
**Parent context:** `routing-currency-and-merit`
**Coordinator:** Foreman Line coordinator session

## Objective

Make `typesafe/jev-1.13` usable through OpenRouter's typed alpha Decisions
surface as a separately governed capability, without weakening the current
goal's D13 exact-identity rule or treating Jev as a standard chat/completions
catalog model.

The intended product capability is narrow: submit a state plus a declared set
of typed questions, receive a validated typed answer envelope, and consume that
envelope in an explicitly named workflow owned by application code.

## Deliberately out of scope

- Changing D13 in the existing RCM goal.
- Adding Jev to the standard chat/completions catalog or general model router.
- Treating the alpha endpoint as a replacement for the local routing catalog.
- Writing Pi settings, changing host configuration, discovering credentials, or
  forwarding the API key into evidence.
- Unbounded provider spend, background polling, autonomous workflow effects, or
  downstream Helmholtz/HAWF action.

## Proposed locked decisions

These decisions require Gate 1 ratification.

| ID | Proposed decision | Reasoning |
|---|---|---|
| J1 | This is a separate goal and eligibility surface. The existing RCM charter and D13 remain unchanged. | Prevents an alpha capability from becoming a silent routing exception. |
| J2 | The approved operation is OpenRouter `POST https://openrouter.ai/api/alpha/decisions`; it is not the `/api/v1/models` or chat/completions surface. | The supplied catalog projection cannot enumerate this endpoint family. |
| J3 | The governed identity is the exact request tuple `openrouter / typesafe/jev-1.13 / alpha-decisions`; a returned served-model identifier such as `typesafe/jev-1.13-20260917` must be recorded and validated as provider-declared response metadata, never silently substituted into D13. | Preserves identity, provenance, and refusal behavior. |
| J4 | The adapter accepts only the declared Decisions request and response schema: state plus typed `noul`, `choice`, and `score` questions, with answer-envelope validation and refusal on malformed or incomplete answers. | Keeps the capability typed and bounded. |
| J5 | Authentication uses the existing `OPENROUTER_API_KEY` at runtime only. Evidence may prove non-secret key acceptance and scope, but must never contain the key or raw authorization header. | Limits credential exposure. |
| J6 | Every live call records endpoint, requested identity, served identity, request/response schema version, stable response ID, server/client UTC timestamps, usage, and currency-qualified cost when available. Missing currency or cost is an evidence hold, not an estimate. | Makes live evidence auditable and prevents false cost claims. |
| J7 | Live alpha calls are not replay authority. The adapter must support deterministic validation of a recorded response fixture and explicitly label live observations versus replayable evidence. | Separates provider availability from reproducible behavior. |
| J8 | Jev may be consumed only by one explicitly named, typed workflow approved by this charter; no general RCM parcel, dispatcher, or price sorter may select it. | Prevents scope expansion by accidental reuse. |
| J9 | Refusal is mandatory for endpoint mismatch, identity mismatch, malformed envelope, missing required answer, auth failure, non-JSON response, unqualified cost, or provider response that cannot be bound to the request. | Fails closed at every boundary. |
| J10 | Any provider spend is bounded per explicit Gate 2 authorization; no standing spend authority is requested by this draft. | Keeps cost and external effects human-gated. |

## Evidence already available

- User-run smoke test passed all three question types.
- Observed served model: `typesafe/jev-1.13-20260917`.
- Observed usage: 427 input / 73 output tokens.
- Observed displayed cost: `$0.000017934`.
- Existing RCM evidence records one earlier HTTP 200 alpha call and retains the
  standard catalog refusal.

These observations are proposal input only; they do not ratify J1–J10 or grant
runtime authority.

## Parcel decomposition

| Parcel | Scope | Risk / routing class |
|---|---|---|
| JEV-P0 | Contract and evidence boundary: endpoint, identity, schema, auth, cost, refusal, replay, and privacy rules. | architecture/risk |
| JEV-P1 | Pure typed request/response validator and deterministic fixture replay. No network. | implementation/standard |
| JEV-P2 | Credential-free runtime adapter with bounded live-call receipt capture and redaction. | architecture/risk |
| JEV-P3 | One named consumer workflow using typed Jev answers; no general routing integration. | architecture/risk |
| JEV-P4 | Negative controls, operational documentation, cost/failure evidence, and release closure. | implementation/standard |

Dependency order: JEV-P0 → JEV-P1 → JEV-P2 → JEV-P3 → JEV-P4. Architecture/risk
parcels require two independent fresh frontier reviews.

## Exit criterion

The goal exits only when the alpha surface has a ratified contract, deterministic
fixture validation, a secret-free bounded live adapter, explicit refusal tests,
currency-qualified usage evidence, one approved consumer workflow, two fresh
reviews for risk parcels, and a release record proving that the existing RCM D13
and standard routing surface were not changed.

## Human gates

- **Gate 1:** originally granted by the ratification below; currently reopened for
  the replacement proposals in the plan-review section. No dispatch authority is
  active until the reopened decisions are ratified.
- **Gate 2:** not requested by this draft. A later grant must name exact parcel IDs
  and any bounded live-call spend.
- **Gate 3:** not requested by this draft. Merge remains human-owned.

## Stop conditions

Stop on any need to change existing D13, any request to add Jev to general model
routing, missing identity binding, missing cost currency, secret leakage, an
unbounded live call, a consumer workflow outside J8, host/Pi mutation, HAWF or
Helmholtz action, or any human gate not explicitly granted.

## Gate 1 record

**RATIFIED 2026-09-21 by Clinton Morgan:** “Ratify J1–J10 as recommended.” This
ratifies the ten proposed locked decisions exactly as written. It does not grant
Gate 2 or Gate 3, authorize any parcel dispatch, authorize a live provider call or
spend, change the existing RCM D13 decision, add Jev to general routing, or authorize
host/Pi, HAWF, Helmholtz, or downstream action.

## Plan-review Gate 1 reopening

The mandatory fresh plan-level review on 2026-09-21 returned **REQUEST CHANGES**.
The original J1–J10 ratification remains recorded, but the affected decisions are
reopened because the review found identity, authority, consumer, security, replay,
spend-bound, and parent-goal collision gaps. The unratified replacement proposals
below are the only proposed changes; no parcel or live call is authorized while they
are pending.

### Proposed replacement decisions

| ID | Proposed replacement after review |
|---|---|
| J1 | Keep this as a separate goal, but name its owned capability surface `openrouter-alpha-decisions`. The existing RCM D13 and boundary-routing D10 remain unchanged. No shared routing file or parent-goal document may be edited without a separately ratified integration parcel and explicit serialization owner. |
| J2 | Approve only `POST https://openrouter.ai/api/alpha/decisions` under the capability key `openrouter-alpha-decisions`; standard `/api/v1/models`, chat/completions, and the existing OpenRouter registry/template remain separate and are not silently repointed. |
| J3 | Canonical request identity is exactly `openrouter / typesafe/jev-1.13 / alpha-decisions`. `~typesafe/jev-latest` is not accepted. A served identifier such as `typesafe/jev-1.13-20260917` is response metadata that must be explicitly bound and recorded; it is never a D13 alias. |
| J4 | Version the Decisions request/response schema and validate the complete envelope, including answer types, criteria coverage, confidence/distribution shape, requested identity, served identity, response ID, and schema version. |
| J5 | Runtime credential ownership is process-local `OPENROUTER_API_KEY` injection only; “credential-free” means receipts, fixtures, logs, and evidence contain neither the key nor the authorization header. No credential discovery, persistence, or retry outside the declared bound is allowed. |
| J6 | Every live call records endpoint, canonical request digest, requested/served identities, schema version, response ID, server/client UTC timestamps, usage, and currency-qualified cost. Missing currency or cost is a hold. |
| J7 | Replay uses sanitized, provenance-tagged fixtures with canonical JSON SHA-256 request/response digests and explicit requested/served identity binding. Live observations are never replay authority. |
| J8 | The named consumer is proposed as `support-triage-advisory-v1`, consuming `is_urgent`, `department`, and `frustration` as recommendation data only. Application code owns authorization and all effects; Jev cannot escalate, route, spend, or mutate state. This name remains pending Gate 1 confirmation. |
| J9 | Refuse on endpoint, identity, schema, auth, timeout, size, non-JSON, missing answer, malformed distribution, cost-currency, digest, or binding failure; retries are zero unless a later amendment explicitly changes this. |
| J10 | Until a later Gate 2 grant, the validation bound is one live call per authorized run, zero retries, concurrency one, 30-second timeout, 64-KiB request limit, and aggregate cap $0.01 USD per run. No standing spend authority is created. |

### Queue amendments proposed after review

- Rename JEV-P2 to “secret-safe bounded runtime adapter” and attach the security
  review requirement before release.
- Split the former JEV-P4 into JEV-P4 boundary/security scenarios and JEV-P5
  release closure; include positive, negative, timeout, auth, privacy, cost, and
  provider-boundary scenarios by environment.
- Add an explicit JEV-P3 consumer contract for `support-triage-advisory-v1`.
- Add a shared-surface serialization note: this goal must not edit the existing RCM
  routing registry, Pi template, parent charter, or loop directive.
