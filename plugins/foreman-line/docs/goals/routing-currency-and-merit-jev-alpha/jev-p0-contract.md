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

## Capability-owned transport

The sole owned capability key is exactly:

```text
openrouter-alpha-decisions
```

The capability owns these immutable transport constants and policies:

```text
CAPABILITY_ENDPOINT = "https://openrouter.ai/api/alpha/decisions"
CAPABILITY_METHOD = "POST"
CAPABILITY_HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json"
}
REDIRECT_POLICY = "disabled"
```

The logical request body is built only from the allowlisted request schema in
this document. The adapter owns its serialization and transmits exactly the
measured UTF-8 body bytes; the caller cannot supply or replace a raw body.
Runtime-only authorization injection, when later authorized, is owned by the
adapter and is never caller-controlled or represented in evidence.

The caller must not control or provide `Host`, `:authority`, `Authorization`,
content headers, transfer headers, endpoint, method, body, proxy destination,
or redirect behavior. `Content-Length` or equivalent framing is transport-
derived from the exact body bytes, never caller-supplied. Any attempt to
provide or override these fields refuses.

The only approved operation is `POST` to the immutable endpoint. The transport
must require the final TLS origin to remain exactly `https://openrouter.ai`,
with valid certificate, hostname, and chain verification. It must reject
redirects, non-2xx status, missing or non-`application/json` content type,
transport failure, decompression failure, body truncation, and origin drift.

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

The request identity is not a display label:

- `typesafe/jev-1.13` must not be aliased, normalized, suffix-stripped, or
  replaced with `typesafe/jev-latest`.
- The endpoint and capability key must match their exact capability-owned
  literals; the caller has no endpoint field.
- A response must repeat the requested identity exactly. Missing, conflicting,
  case-changed, aliased, normalized, or substituted values refuse.
- The authenticated provider response must supply a `model` field and a
  provider response identifier represented as `response_id`. The normalized
  `served_identity.model` must equal that response `model` exactly, and the
  observation's `response_id` must equal that provider response identifier.
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

### Allowlisted request envelope and privacy boundary

The caller supplies typed logical fields, not an endpoint, headers, or raw
body. The only permitted `state` shape is:

```text
state:
  schema_version: "support-triage-input/v1"
  values:
    case_type: "billing" | "technical" | "sales" | "other"
    urgency_signal: <finite number from 0 through 1>
    frustration_signal: <finite non-negative JSON number>
    contact_channel: "email" | "chat" | "phone"
```

`values` may omit fields that are not available, but unknown keys, free text,
raw transcripts, names, email addresses, phone numbers, addresses, customer or
ticket identifiers, tokens, credentials, authorization material, and other
PII are forbidden. The caller must minimize to this allowlist, redact unsafe
input before serialization, and refuse rather than guess when minimization or
redaction is uncertain. The request body is closed and no extra state fields
are accepted.

The entire question envelope is also allowlisted and bounded. All caller-
supplied strings in the request are ASCII-only printable characters U+0020
through U+007E; any non-ASCII byte, control character, NUL, CR, LF, tab, or
other Unicode character refuses. Question names, instruction tokens, criterion
keys, choice labels, and score labels must match the exact token grammar
`^[a-z][a-z0-9._-]{0,63}$`; each array is duplicate-free, with at most 8
instructions, 16 criteria, and 32 choices. Criterion descriptions, when
present, must be 1–160 characters matching the exact grammar
`^[A-Za-z0-9][A-Za-z0-9 .,;:/()_-]{0,159}$`; they are bounded labels, not
prompts or free-form provider instructions. The question list has at most 16
entries. `instructions` is an optional array of literal safe tokens, never
arbitrary prose. `score_label` is a token required only for `score`; it is
forbidden for `noul` and `choice`.

Before serialization, refuse a complete request if any caller string matches
one of these exact refusal patterns (the patterns marked `/i` are
case-insensitive):

```text
email: (?:^|[^A-Za-z0-9])[A-Za-z0-9.!#$%&'*+/=?^_{}|~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:$|[^A-Za-z0-9])
URL: /(?:https?|ftp):\/\/[^\s]+/i or /(?:^|\s)www\.[^\s]+/i
phone: (?:^|[^0-9])\+?[1-9][0-9]{6,14}(?:$|[^0-9])
       or (?:^|[^0-9])(?:\+?1[ .-]?)?\(?[2-9][0-9]{2}\)?[ .-][0-9]{3}[ .-][0-9]{4}(?:$|[^0-9])
credential: /\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}\b/i
            or /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|authorization)\s*[:=]\s*[^\s]+/i
            or /\b(?:sk|pk)_[A-Za-z0-9_-]{16,}\b/
```

These are the complete refusal patterns; no undefined general PII detector is
claimed. Strings that do not match the closed field grammar, exceed its length
or count bound, contain duplicate keys/items, or use unknown fields refuse.
Rejected strings and their containing envelope are not logged, digested,
serialized, transmitted, or retained.

The logical request envelope is:

```text
{
  schema_version: "jev-decisions/v1",
  capability: "openrouter-alpha-decisions",
  requested_identity: {
    provider: "openrouter",
    model: "typesafe/jev-1.13",
    surface: "alpha-decisions"
  },
  state: <the allowlisted state object above>,
  questions: [
    {
      name: <unique safe token>,
      type: "noul" | "choice" | "score",
      instructions: [<optional allowlisted safe tokens>],
      criteria: [
        { key: <unique safe token>, description: <optional bounded safe text> }
      ],
      choices: [<required only for type "choice", safe tokens>],
      score_label: <required only for type "score", safe token>
    }
  ]
}
```

Request rules:

- `questions` is non-empty and no larger than 16 entries. Question names are
  unique by exact, case-sensitive comparison and obey the safe token grammar.
  Criterion keys are unique within a question and define the complete coverage
  set for that question; descriptions obey the bounded safe-text rule.
- `instructions`, when present, contains only safe tokens from a coordinator-
  approved allowlist. Arbitrary prose, prompts, commands, URLs, identifiers,
  and PII in instructions refuse.
- `choices` is required, non-empty, unique, and exact when `type` is `choice`;
  every label obeys the safe token grammar, and it is forbidden for `noul` and
  `score`. `score_label` is required for `score`, obeys the safe token grammar,
  and is forbidden for `noul` and `choice`.
- The request must be validated, minimized/redacted, serialized as UTF-8, and
  measured as the exact body bytes immediately before transmission. It must be
  no larger than 65,536 bytes. The transmitted body bytes must equal the
  measured bytes exactly.

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

## Cost, run, lease, and terminal authority

Each later live run requires a coordinator-issued `run_id`, an atomic durable
single-call lease, and a pre-call reservation for the full `$0.01 USD` cap.
Atomic claim semantics are CAS/create-if-absent on a durable record: exactly one
caller can create or transition the lease from `available` to `claimed`; every
other claimant refuses. The immutable lease binds all of:

```text
run_id + capability + schema_version + request_digest
```

The lease is consumed by at most one call and cannot be recreated by retry,
timeout recovery, process failure, or a second worker. Concurrency is one,
retries are zero, and the timeout is 30 seconds.

Before transmission, the coordinator must have either provider-side or
account-level hard budget enforcement for the `$0.01 USD` cap, or a recorded
provider/account acknowledgement that the cap is enforced for this run. A
client-side reservation alone cannot prevent post-call overcharge and is not
sufficient authorization.

Any reported cost must be a JSON number that is finite and non-negative, never
a string, NaN, Infinity, or negative value, and must carry the exact literal
currency `USD`. The amount must be `<= 0.01`. Missing, non-USD, malformed, or
over-cap cost is a terminal hold/refusal; it is never estimated, converted, or
silently accepted.

Run and evidence state transitions are append-only. Once `complete`, `refused`,
or `hold` is recorded, that terminal state cannot be retried, reopened,
overwritten, or converted by a later worker. A hold is terminal,
non-consumable, and non-retryable pending coordinator disposition. JEV-P0
itself has no run ID, lease, provider call, or spend.

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

## Privacy, retention, and evidence boundary

Only the allowlisted state schema may be sent. Pre-send minimization and
redaction are mandatory; uncertain or unsafe input refuses. This applies to
the complete transmitted envelope: state, question names, instruction tokens,
criteria keys/descriptions, choices, score labels, and all wrapper metadata.
Rejected unsafe/free-text/PII input is not logged, digested, persisted, or
included in a refusal record. No PII may occur in request/response digests, run
metadata, manifest paths, provenance objects, source references, logs, review
reports, or fixture identifiers. Source references are opaque reviewable
references, not names, emails, ticket IDs, or customer data.

Raw request bodies, raw response bodies, headers, authorization values,
compressed streams, and unredacted payloads have zero retention. Sanitized
fixtures and safe live metadata require a `retention_until_utc` and may be
retained no longer than 90 days after capture, or earlier coordinator
disposition; after that point they must be deleted or rendered inaccessible
without changing the immutable custody record. Retention never authorizes
retaining raw payloads or PII.

## Fail-closed rule

Any endpoint, header, body, transport, origin, identity, schema, envelope,
answer, size, authentication, privacy, lease, budget, cost, digest,
provenance, custody, retry, concurrency, timeout, or consumer-boundary failure
is a refusal or terminal hold. Refusal is explicit and side-effect free: it
does not alias, normalize, retry, downgrade, substitute, route, persist unsafe
material, spend, or mutate state.

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
