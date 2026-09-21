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

## Capability and immutable transport binding

The sole owned capability key is exactly:

```text
openrouter-alpha-decisions
```

The capability owns this immutable endpoint constant; callers do not supply or
override an endpoint:

```text
CAPABILITY_ENDPOINT = "https://openrouter.ai/api/alpha/decisions"
```

The only approved operation is `POST` to that constant. A caller-provided URL,
host, scheme, port, path, method, proxy destination, or redirect target is
never authoritative and must refuse. The transport must:

- send exactly `POST` to host `openrouter.ai`, path `/api/alpha/decisions`,
  over HTTPS/TLS on the expected final origin;
- disable redirects rather than following them;
- require the final TLS origin to remain exactly `https://openrouter.ai` and
  reject certificate/hostname/chain validation failure; and
- reject a non-2xx status, missing or non-JSON content type, transport failure,
  decompression failure, or body truncation.

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
- The capability-owned endpoint and capability key must match their exact
  literals; the request envelope has no caller-controlled `endpoint` field.
- A response must repeat the requested identity exactly. Missing, conflicting,
  case-changed, aliased, normalized, or substituted values refuse.
- The authenticated provider response must supply a `model` field and a
  provider response identifier represented as `response_id`. The normalized
  `served_identity.model` must equal that response `model` byte-for-byte, and
  the observation's `response_id` must equal that provider response identifier.
- The client must not synthesize, infer, fallback, suffix-strip, or copy the
  requested model into `served_identity`. Missing or unparseable provider
  fields refuse; the requested identity is never a fallback.
- `served_identity` and `response_id` are provider-response metadata only. A
  served identifier such as `typesafe/jev-1.13-20260917` cannot establish
  standard catalog eligibility, general routing authority, or parent RCM D13
  eligibility.

The minimum identity shapes are:

```text
requested_identity:
  provider: "openrouter"
  model: "typesafe/jev-1.13"
  surface: "alpha-decisions"

served_identity:
  model: <exact authenticated provider response field `model`>
  response_id: <exact authenticated provider response identifier>
  source: "provider-declared"
```

No consumer may infer a requested identity from served metadata, headers, the
URL, a configured default, or a client-generated value.

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

The caller supplies no endpoint. The later adapter serializes this logical
request and transmits it only to `CAPABILITY_ENDPOINT`.

```text
{
  schema_version: "jev-decisions/v1",
  capability: "openrouter-alpha-decisions",
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
- The logical request must be validated, serialized as UTF-8, and measured as
  a raw body before transmission. It must be no larger than 65,536 bytes.

### Response envelope

The response fields below are normalized only from the authenticated provider
response. The adapter must not manufacture missing provider metadata.

```text
{
  schema_version: "jev-decisions/v1",
  capability: "openrouter-alpha-decisions",
  requested_identity: <exact request requested_identity>,
  served_identity: {
    model: <exact authenticated provider response field `model`>,
    response_id: <exact authenticated provider response identifier>,
    source: "provider-declared"
  },
  response_id: <same provider response identifier>,
  server_timestamp_utc: <provider-declared parseable UTC timestamp>,
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
  values are non-negative and no greater than 1, and whose total must be within
  absolute tolerance `1e-12` of 1. No renormalization, clamping, repair, or
  silent key insertion is permitted; outside-tolerance distributions refuse.
- For `score`, `value` is a finite JSON number. No undocumented score range may
  be inferred; a later consumer contract may define domain interpretation.
- Every answer has `confidence` in the inclusive range 0–1. Extra answer
  fields, malformed distributions, non-finite values, or type mismatches
  refuse.
- `response_id` and `server_timestamp_utc` are mandatory for a complete
  response. `response_id` must be the provider response identifier used in
  `served_identity`; `server_timestamp_utc` must be provider-declared and
  parseable as UTC. Missing, conflicting, or unparseable values produce a
  terminal hold/refusal rather than a complete result.

The response raw UTF-8 body is measured before JSON parsing or persistence and
must be no larger than 65,536 bytes. A body that is truncated, decompression-
failed, not valid UTF-8, or over the limit refuses before parse or persistence.

## Bounded run authority

Each later live run requires a coordinator-issued `run_id` and an atomic
single-call lease bound to that run. Before transmission, the lease must be
acquired and the full `$0.01 USD` maximum budget reserved. A lease is consumed
by at most one call and cannot be recreated by retry, timeout recovery, or a
second worker. Concurrency is one, retries are zero, and the timeout is 30
seconds.

The run is terminally held/refused when the provider reports a non-USD cost,
missing cost, unqualified currency, or a cost above the reserved cap. A hold
is non-consumable and non-retryable pending coordinator disposition; it is not
partial success and never silently estimates or converts cost. JEV-P0 itself
has no run ID, lease, provider call, or spend.

## Credential and consumer boundary

Only a later explicitly authorized runtime parcel may receive
`OPENROUTER_API_KEY` through process-local injection. JEV-P0 and its documents
must not discover, read, persist, print, hash, transmit, or test credentials.
Receipts, fixtures, logs, review reports, and evidence contain neither the key
nor a raw authorization header. A later auth observation may be boolean/status-
only.

The only named consumer is `support-triage-advisory-v1`. Its exact allowlisted
recommendation object is:

```text
{
  schema_version: "support-triage-advisory/v1",
  source: "jev",
  response_id: <validated provider response_id>,
  is_urgent: <validated noul value>,
  department: <validated choice value>,
  frustration: <validated score value>
}
```

No other keys are allowed. In particular, the recommendation object must not
contain commands, capability tokens, recipients, effect descriptions, route
selectors, escalation instructions, authorization decisions, or mutation
fields. The application must independently authorize any action using its own
policy and authorization gate after validating this advisory object. Jev
answers cannot itself route, escalate, spend, mutate state, select a general
model, or invoke a host/Pi, HAWF, Helmholtz, or GMF effect.

No other consumer is implied by this contract. Adding one requires a separately
ratified contract amendment or parcel.

## Fail-closed rule

Any endpoint, transport, identity, schema, envelope, answer, size,
authentication, provider-binding, lease, budget, cost, digest, provenance,
retry, concurrency, timeout, or consumer-boundary failure is a refusal or
terminal hold. Refusal is explicit and side-effect free: it does not alias,
normalize, retry, downgrade, substitute, route, persist unsafe material,
spend, or mutate state.

The detailed refusal matrix, evidence classes, replay authority, canonical
digest procedure, custody rule, and bounded-run rules are defined in
`jev-p0-evidence-boundary.md`. The verification and parent-surface negative
proof plan are defined in `jev-p0-verification.md`.

## Parent-surface non-collision

This parcel owns no file on the parent RCM charter, D13 record, loop directive,
boundary-routing D10, routing registry or policy, Pi template/settings, HAWF,
Helmholtz, GMF receipt/envelope contracts, host configuration, credentials,
standard routing, goal index, or downstream JEV parcels. The contract is
descriptive only; any future integration requires an explicitly serialized,
ratified parcel.
