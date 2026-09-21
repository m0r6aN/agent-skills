# JEV-P0 — Alpha Decisions contract

## Purpose and authority

This document freezes the contract for the separately governed
`openrouter-alpha-decisions` capability. It instantiates the ratified JEV
alpha charter and its J1–J10 replacement decisions; it does not amend parent
RCM D13, boundary-routing D10, the parent charter or loop directive, or any
shared routing authority.

This is a documentation contract for later parcels. It grants no provider
call, credential access, spend, runtime effect, consumer authorization, or
Gate 3 approval. JEV-P0 itself performs zero calls and incurs zero spend.

## Capability and endpoint

The sole owned capability key is exactly:

```text
openrouter-alpha-decisions
```

The only approved operation is:

```text
POST https://openrouter.ai/api/alpha/decisions
```

The following are separate surfaces and must refuse substitution or silent
repointing:

- OpenRouter `/api/v1/models` and the standard OpenRouter catalog.
- OpenRouter chat/completions or any other non-alpha operation.
- The existing RCM routing policy, registry, eligibility surface, or D13
  identity rule.
- Pi templates/settings, host configuration, HAWF, Helmholtz, and GMF
  receipt/envelope surfaces.

## Exact identity binding

Every request carries this exact, case-sensitive requested identity tuple:

```text
provider = openrouter
model    = typesafe/jev-1.13
surface  = alpha-decisions
```

The request identity is not a display label. It is a literal contract value:

- `typesafe/jev-1.13` must not be aliased, normalized, suffix-stripped, or
  replaced with `typesafe/jev-latest`.
- The endpoint and capability key must match the exact literals above.
- A response must repeat the requested identity exactly. Missing, conflicting,
  case-changed, aliased, normalized, or substituted values refuse.
- The response must also carry a separate provider-declared `served_identity`.
  It records what the provider says it served; it never replaces the requested
  identity and is never a D13 alias.
- A served identifier such as `typesafe/jev-1.13-20260917` is response
  metadata only. It cannot establish standard catalog eligibility, general
  routing authority, or parent RCM D13 eligibility.

The minimum identity shapes are:

```text
requested_identity:
  provider: "openrouter"
  model: "typesafe/jev-1.13"
  surface: "alpha-decisions"

served_identity:
  model: <non-empty provider-declared served identifier>
  source: "provider-declared"
```

The served model string is retained separately and compared exactly as
provider-declared. No consumer may infer a requested identity from it.

## Versioned typed envelope

The literal schema version is:

```text
jev-decisions/v1
```

The request and response are closed envelopes: fields not defined here are
extra and refuse. All required strings are non-empty UTF-8 strings; JSON
objects and arrays must not contain duplicate keys; non-finite numbers,
`null` where a value is required, and malformed JSON refuse.

### Request envelope

```text
{
  schema_version: "jev-decisions/v1",
  capability: "openrouter-alpha-decisions",
  endpoint: "https://openrouter.ai/api/alpha/decisions",
  requested_identity: {
    provider: "openrouter",
    model: "typesafe/jev-1.13",
    surface: "alpha-decisions"
  },
  state: <JSON object>,
  questions: [
    {
      name: <unique non-empty question name>,
      type: "noul" | "choice" | "score",
      criteria: [<one or more unique non-empty criterion names>],
      choices: [<required only for type "choice">]
    }
  ]
}
```

Request rules:

- `questions` is non-empty. Question names are unique by exact, case-sensitive
  comparison. Criterion names are unique within a question and define the
  complete coverage set for that question.
- `choices` is required, non-empty, unique, and exact when `type` is `choice`;
  it is forbidden for `noul` and `score`.
- `state` is an application-owned JSON object. It is not a credential store;
  credentials, authorization headers, or raw secret-bearing material are
  forbidden in state and in every evidence representation.
- The request must be validated and size-checked before persistence,
  transmission, or consumption.

### Response envelope

```text
{
  schema_version: "jev-decisions/v1",
  capability: "openrouter-alpha-decisions",
  endpoint: "https://openrouter.ai/api/alpha/decisions",
  requested_identity: <exact request requested_identity>,
  served_identity: {
    model: <provider-declared served identifier>,
    source: "provider-declared"
  },
  response_id: <stable non-empty provider response identifier>,
  answers: [
    {
      name: <exact request question name>,
      type: <exact request question type>,
      criteria: [<exact request criteria list, complete and duplicate-free>],
      value: <type-matching value>,
      confidence: <finite number from 0 through 1>,
      distribution: <required only for "choice">
    }
  ]
}
```

Answer rules:

- There is exactly one answer for every requested question, with no missing,
  duplicate, renamed, or extra answer. Answer order follows request order for
  deterministic replay.
- `name` and `type` must match the corresponding question exactly. An answer's
  `criteria` list must equal that question's complete criteria list exactly;
  missing or extra criteria refuse.
- For `noul`, `value` is a finite number in the inclusive range 0–1 and
  `distribution` is forbidden.
- For `choice`, `value` is one of the declared choices. `distribution` is a
  finite numeric object whose keys are exactly the declared choices, whose
  values are non-negative and no greater than 1, and whose total is 1 under a
  deterministic fixed validation tolerance. `distribution` is forbidden for
  other types.
- For `score`, `value` is a finite JSON number. No undocumented score range may
  be inferred; a later consumer contract may define domain interpretation.
- Every answer has `confidence` in the inclusive range 0–1. Extra answer
  fields, malformed distributions, non-finite values, or type mismatches
  refuse.
- `response_id` is required for a provider response and is evidence metadata;
  it is not an identity alias.

The response is rejected before persistence or consumption when it is larger
than 64 KiB (65,536 bytes), even if its parsed structure otherwise validates.
The request has the same maximum byte size.

## Credential and authority boundary

Only a later explicitly authorized runtime parcel may receive
`OPENROUTER_API_KEY` through process-local injection. JEV-P0 and its documents
must not discover, read, persist, print, hash, transmit, or test credentials.
Receipts, fixtures, logs, review reports, and evidence contain neither the key
nor a raw authorization header. A later auth observation may be boolean/status-
only.

The only named consumer is `support-triage-advisory-v1`. It may consume the
recommendation data `is_urgent`, `department`, and `frustration` when a later
consumer parcel authorizes that use. Jev answers remain advisory data:

- Application code owns authorization, escalation, routing, spending, and all
  effects.
- No Jev answer selects a general model, changes RCM routing, authorizes an
  escalation, spends money, mutates state, or invokes a host/Pi, HAWF,
  Helmholtz, or GMF effect.
- No other consumer is implied by this contract. Adding one requires a
  separately ratified contract amendment or parcel.

## Fail-closed rule

Any endpoint, identity, schema, envelope, answer, size, authentication,
provider-binding, cost, digest, provenance, retry, concurrency, timeout, or
consumer-boundary failure is a refusal. Refusal is explicit and side-effect
free: it does not alias, normalize, retry, downgrade, substitute, route,
persist unsafe material, spend, or mutate state.

The detailed refusal matrix, evidence classes, replay authority, canonical
digest procedure, and bounded-run rules are defined in
`jev-p0-evidence-boundary.md`. The verification and parent-surface negative
proof plan are defined in `jev-p0-verification.md`.

## Parent-surface non-collision

This parcel owns no file on the parent RCM charter, D13 record, loop directive,
boundary-routing D10, routing registry or policy, Pi template/settings, HAWF,
Helmholtz, GMF receipt/envelope contracts, host configuration, credentials,
standard routing, goal index, or downstream JEV parcels. The contract is
descriptive only; any future integration requires an explicitly serialized,
ratified parcel.
