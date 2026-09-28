# Routing Currency and Merit — Jev Alpha Decisions

**Status:** RATIFIED — Gate 1 complete; JEV-P0, JEV-P1, and JEV-P2 Gate 3 accepted after merge; Gate 2 granted for JEV-P2–P5 on 2026-09-21
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

These observations are accepted as evidence input for the ratified contract; they
do not grant Gate 2, runtime authority, or permission for another live call.

## Parcel decomposition

| Parcel | Scope | Risk / routing class |
|---|---|---|
| JEV-P0 | Contract and evidence boundary: endpoint, identity, schema, auth, cost, refusal, replay, and privacy rules. | architecture/risk |
| JEV-P1 | Pure typed request/response validator and deterministic fixture replay. No network. | implementation/standard |
| JEV-P2 | Secret-safe bounded runtime adapter with live-call receipt capture and redaction; security review required before release. | architecture/risk |
| JEV-P3 | `support-triage-advisory-v1` consumer contract using typed Jev answers as recommendation data only; no general routing integration. | architecture/risk |
| JEV-P4 | Boundary and security scenarios: positive, negative, timeout, auth, privacy, cost, refusal, and provider-boundary behavior by environment. | architecture/risk |
| JEV-P5 | Release closure, operational documentation, evidence index, and proof that parent RCM and standard routing surfaces were not changed. | implementation/standard |

Dependency order: JEV-P0 → JEV-P1 → JEV-P2 → JEV-P3 → JEV-P4 → JEV-P5. Architecture/risk
parcels require two independent fresh frontier reviews.

## Exit criterion

The goal exits only when the alpha surface has a ratified contract, deterministic
fixture validation, a secret-safe bounded live adapter, explicit refusal tests,
currency-qualified usage evidence, one approved consumer workflow, environment-
specific security and boundary scenarios, two fresh reviews for risk parcels, and
a release record proving that the existing RCM D13 and standard routing surface
were not changed.

## Human gates

- **Gate 1:** granted for the original J1–J10 and the plan-review replacement
  decisions recorded below. Later parcel authority remains ungranted.
- **Gate 2:** granted for the exact JEV-P2–P5 parcel set recorded below, in
  strict dependency order; no later parcel dispatches before the predecessor
  is accepted at Gate 3.
- **Gate 3:** accepted only for the bounded JEV-P0 handoff at merged commit
  `cf6c5536c7f7e4d0b6d92dd7ea570f44d49d961e`; it does not grant JEV-P1–P5,
  live Jev execution, spend, host/Pi action, parent mutation, HAWF, Helmholtz,
  or general Gate 3.

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

**PLAN-REVIEW AMENDMENTS RATIFIED 2026-09-21 by Clinton Morgan:** “Ratify the
J1–J10 replacement decisions as recommended.” This ratifies the replacement text
in the plan-review section, including the separately owned `openrouter-alpha-decisions`
surface, exact `typesafe/jev-1.13` request identity, recommendation-only
`support-triage-advisory-v1` consumer, secret-safe runtime boundary, replay and
refusal requirements, and the one-call/$0.01 USD validation bound. It grants no
Gate 2 or Gate 3, no live call or spend, and no change to the parent RCM D13,
boundary-routing D10, Pi, host, HAWF, Helmholtz, or downstream surfaces.

The non-locked queue corrections from the plan review are accepted as coordinator
plan fixes: JEV-P2 is the secret-safe runtime adapter; JEV-P4 is the boundary and
security scenario parcel; and JEV-P5 is release closure. They do not authorize
dispatch or alter a locked decision.

## Gate 2 record

**GRANTED 2026-09-21 by Clinton Morgan:** “Grant Gate 2 for JEV-P0.” This authorizes
dispatch of exactly JEV-P0 through the full shaping, builder, deterministic-check,
dual-review, triage, and human Gate 3 process. It authorizes no other parcel, no
additional live call or spend beyond a later explicit bounded authorization, no
host/Pi or parent-goal change, and no HAWF, Helmholtz, or downstream action.

## Gate 3 record

**ACCEPTED 2026-09-21 after merge and local refresh:** The reviewed JEV-P0
head `981bb6d05d89926a2ce558ae8a66a7ddc73235c0` merged as
`cf6c5536c7f7e4d0b6d92dd7ea570f44d49d961e`; the local coordinator branch was
then refreshed to `1d4a857e7aa128fd6557dc160e9b9f4da3295843`. This accepts the
bounded JEV-P0 handoff only. The independent-review observations remain
recorded in the P0 triage; they are not reclassified as resolved by this
acceptance.

## JEV-P1 Gate 2 record

**GRANTED 2026-09-21 by Clinton Morgan:** “Gate 2 grant for JEV-P1 confirmed.
Proceed with blanket authority to execute any non-destructive actions.” This
authorizes exactly JEV-P1: the pure, offline typed validator, canonical JCS
digest implementation, deterministic sanitized-fixture replay, fixtures, and
tests named by the JEV-P1 spec. It authorizes no network, credentials, live
provider call, spend, runtime adapter, consumer wiring, general routing,
parent-surface mutation, host/Pi action, HAWF, Helmholtz, or downstream action.
Non-destructive authority does not expand the JEV-P1 allowed-file list or
replace a later exact Gate 3 grant.

**P1 amendment A1 approved 2026-09-21 by Clinton Morgan:** The P1 replay API
is `replayFixture(fixture, manifestReceipt)`. The receipt is supplied as a
separate closed value and validated offline; the sanitized fixture schema and
all JEV-P0 artifacts remain unchanged.

## JEV-P1 Gate 3 record

**ACCEPTED 2026-09-21 by Clinton Morgan:** “Explicit approval is granted for
all remaining steps.” Following merge of PR #41 and local coordinator refresh,
the bounded JEV-P1 handoff is accepted at merge commit
`bd9707a1f7ae7052204c5b06fc75977677216232`. This closes JEV-P1 only: the pure
offline validator, canonical digest implementation, deterministic fixture
replay, independent manifest-receipt binding, fixtures, and tests. It does not
grant JEV-P2–P5, live provider execution, spend, credentials, host/Pi action,
parent-surface mutation, HAWF, Helmholtz, downstream action, or general
routing.

Closure evidence: PR #41 merged from `codex/jev-p1-validator`; the refreshed
coordinator branch is `codex/refresh-actions-and-packages` at the same merge
commit; `npm test` passed with 8 tests; no unrelated dirty workspace files
were changed.

## JEV-P2–P5 Gate 2 record

**GRANTED 2026-09-21 by Clinton Morgan:** “JEV-P2–P5 gate granted.” This
authorizes the exact remaining parcel set in strict dependency order: JEV-P2
secret-safe bounded runtime adapter and redacted receipt capture; JEV-P3 named
recommendation-only consumer contract; JEV-P4 environment and provider-boundary
scenarios; and JEV-P5 release closure and non-change proof. Each parcel still
requires its own spec, deterministic verification, required review, and human
Gate 3 closure before the next parcel is dispatched.

This grant does not authorize general routing, parent RCM/D13 or D10 mutation,
Pi/host changes, HAWF, Helmholtz, downstream effects, standing credentials, or
unbounded spend. Any P2 live call remains limited to the ratified J10 bound:
one call per authorized run, zero retries, concurrency one, 30-second timeout,
64-KiB request limit, and aggregate cap $0.01 USD per run.

**P2 amendment A1 recorded 2026-09-21 by the coordinator:** The P2 public
runtime API must be exported from the existing JEV package entrypoint. The P2
allowed-file set therefore includes an export-only change to
`plugins/foreman-line/jev-decisions/src/index.ts`; no P1 behavior or export is
changed.

## JEV-P2 merge record

**MERGED 2026-09-22 UTC:** PR #42 (`JEV-P2: add bounded secret-safe Jev
runtime adapter`) merged into `codex/refresh-actions-and-packages` at commit
`34fc2f54cb39b22faed576fc3460cba1d3631745`. The local integration branch was
refreshed to that commit. Post-merge verification passed with 19 tests and the
configured syntax checks. Two independent architecture reviews and the
independent security review all returned PASS before merge.

**ACCEPTED 2026-09-22 by Clinton Morgan:** “explicit JEV-P2 Gate 3 acceptance
granter”. This accepts the bounded JEV-P2 handoff at the merged commit above;
it does not expand authority to JEV-P4/P5, parent or shared routing surfaces,
host/Pi, HAWF, Helmholtz, or general routing.

JEV-P3 is now the next dispatchable parcel under the already-granted strict-
sequence Gate 2 authorization. JEV-P4 and JEV-P5 remain blocked until their
predecessors receive their own Gate 3 acceptance.

## JEV-P3 dispatch record

**DISPATCHED 2026-09-22:** The bounded P3 builder completed Step 0 in dedicated
worktree `C:\Repos\foreman-line-jev-p3` on branch `codex/jev-p3-consumer`.
PR #44 is open against `codex/refresh-actions-and-packages` at branch HEAD
`6313489`. The implementation emits the exact six-key
`support-triage-advisory/v1` object from a canonical validated P1 response;
27 package tests pass, the configured checks pass, and both independent
architecture/risk reviews returned PASS.

P3 remains pending merge, local refresh, and human Gate 3 acceptance. No P4/P5
dispatch, live call, spend, routing, host/Pi, parent, HAWF, Helmholtz, or
downstream action is authorized by this record.

## Plan-review Gate 1 reopening

The mandatory fresh plan-level review on 2026-09-21 returned **REQUEST CHANGES**.
The original J1–J10 ratification remains recorded, but the affected decisions are
reopened because the review found identity, authority, consumer, security, replay,
spend-bound, and parent-goal collision gaps. The unratified replacement proposals
below are the only proposed changes; no parcel or live call is authorized while they
are pending.

### Ratified replacement decisions

| ID | Proposed replacement after review |
|---|---|
| J1 | Keep this as a separate goal, but name its owned capability surface `openrouter-alpha-decisions`. The existing RCM D13 and boundary-routing D10 remain unchanged. No shared routing file or parent-goal document may be edited without a separately ratified integration parcel and explicit serialization owner. |
| J2 | Approve only `POST https://openrouter.ai/api/alpha/decisions` under the capability key `openrouter-alpha-decisions`; standard `/api/v1/models`, chat/completions, and the existing OpenRouter registry/template remain separate and are not silently repointed. |
| J3 | Canonical request identity is exactly `openrouter / typesafe/jev-1.13 / alpha-decisions`. `~typesafe/jev-latest` is not accepted. A served identifier such as `typesafe/jev-1.13-20260917` is response metadata that must be explicitly bound and recorded; it is never a D13 alias. |
| J4 | Version the Decisions request/response schema and validate the complete envelope, including answer types, criteria coverage, confidence/distribution shape, requested identity, served identity, response ID, and schema version. |
| J5 | Runtime credential ownership is process-local `OPENROUTER_API_KEY` injection only; “credential-free” means receipts, fixtures, logs, and evidence contain neither the key nor the authorization header. No credential discovery, persistence, or retry outside the declared bound is allowed. |
| J6 | Every live call records endpoint, canonical request digest, requested/served identities, schema version, response ID, server/client UTC timestamps, usage, and currency-qualified cost. Missing currency or cost is a hold. |
| J7 | Replay uses sanitized, provenance-tagged fixtures with canonical JSON SHA-256 request/response digests and explicit requested/served identity binding. Live observations are never replay authority. |
| J8 | The named consumer is `support-triage-advisory-v1`, consuming `is_urgent`, `department`, and `frustration` as recommendation data only. Application code owns authorization and all effects; Jev cannot escalate, route, spend, or mutate state. |
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
