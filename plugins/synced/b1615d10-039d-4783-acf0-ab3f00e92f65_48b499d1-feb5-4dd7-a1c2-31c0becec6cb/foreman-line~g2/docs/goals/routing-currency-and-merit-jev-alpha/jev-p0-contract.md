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

The logical request body is built only from the closed request schema in
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
  requested model into `served_identity`. Missing provider-declared complete
  metadata is `R12` hold; malformed or unparseable present fields are `R10`
  refusal; the requested identity is never a fallback.
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

The provider response identifier is a non-empty provider field and is never
the literal `none`. No consumer may infer a requested identity from served metadata, headers, the
URL, a configured default, or a client-generated value.

Identity adjudication is closed, ordered, and mutually exclusive after
transport and request-identity checks. `model` must match
`^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$`; `response_id` must match
`^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`; and
`server_timestamp_utc` must match
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` and be a
real UTC instant. Evaluate exactly this table:

| Evaluation order | Reason | Disjoint predicate | Outcome |
|---|---|---|---|
| 1 | R12 | One or more provider-declared complete metadata fields (`model`, `response_id`, or `server_timestamp_utc`) is missing. Missing `server_timestamp_utc` belongs here. | `hold` |
| 2 | R10 | All required metadata fields are present, but any present response field is malformed or unparseable under its exact grammar, including malformed `model`, malformed `response_id`, or unparseable `server_timestamp_utc`; missing provider metadata is explicitly excluded and belongs only to R12. This row has precedence over R09. | `refused` |
| 3 | R09 | All required metadata fields are present and individually valid under their exact field grammars, but authenticated response `model` conflicts with `served_identity.model`, or the provider response identifier conflicts with `served_identity.response_id` or `response_id`. | `refused` |

R09 owns only present, validly shaped, conflicting values; it never owns a
malformed or unparseable value. R12 owns only missing provider declarations;
a client-supplied value does not fill one. No condition belongs to two rows and
no caller selects the reason or status.

## Versioned typed envelope

The literal schema version is:

```text
jev-decisions/v1
```

The request and response are closed envelopes: fields not defined here are
extra and refuse. All required strings are non-empty UTF-8 strings; JSON
objects and arrays must not contain duplicate keys; non-finite numbers,
`null` where a value is required, and malformed JSON refuse.

### Closed support-triage request envelope and privacy boundary

The caller supplies no free-form question definition, endpoint, header, or raw
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

`values` may omit fields that are not available, but the four field names and
their enum/number rules are closed. No other state key, free text, transcript,
name, email, phone number, address, customer/ticket identifier, token,
credential, or authorization material is accepted.

The question envelope is one exact finite value. It must be the following array
of three objects in this order; unknown fields or any changed value refuse:

```text
questions: [
  {
    name: "is_urgent",
    type: "noul",
    instructions: ["support_triage_v1"],
    criteria: [
      { key: "urgent_signal", description: "customer urgency signal" }
    ]
  },
  {
    name: "department",
    type: "choice",
    instructions: ["support_triage_v1"],
    criteria: [
      { key: "department_signal", description: "support department signal" }
    ],
    choices: ["billing", "technical", "sales"]
  },
  {
    name: "frustration",
    type: "score",
    instructions: ["support_triage_v1"],
    criteria: [
      { key: "frustration_signal", description: "customer frustration signal" }
    ],
    score_label: "frustration_score"
  }
]
```

All caller-supplied request strings are therefore fixed ASCII literals from the
schema above. The only permitted string values are the literal state enums,
the three question names, the one instruction value, the six criterion
key/description literals, the three department choices, the one score label,
the fixed schema/capability/identity literals, and the exact UTC/ID/digest
fields defined by the evidence schema. Non-ASCII bytes, control characters,
NUL, CR, LF, tab, duplicate JSON keys/items, unknown fields, or any other
string value refuse before serialization. Privacy enforcement uses only these
fixed schema and refusal rules; there is no free-text field to classify. Rejected values and their
containing envelope are not logged, digested, serialized, transmitted, or
retained.

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
  state: <the closed state object above>,
  questions: <the exact three-question array above>
}
```

Request rules:

- `questions` must equal the exact three objects above, including order, literal
  names, types, instructions, criteria keys/descriptions, choices, and score
  label. Any unknown question, criterion, instruction, choice, or label value
  refuses.
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
  server_timestamp_utc: <provider-declared timestamp matching the exact UTC grammar above>,
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
  match the exact UTC grammar above. Missing provider metadata is
  deterministically `hold` with reason `R12`; a present malformed or
  unparseable response field is deterministically `refused` with reason `R10`;
  a present, validly shaped but conflicting identity value is deterministically
  `refused` with reason `R09`. Client-supplied metadata never fills a missing
  provider declaration. None of these conditions can produce a complete result.

The response raw UTF-8 body is measured before JSON parsing or persistence and
must be no larger than 65,536 bytes. A body that is truncated, decompression-
failed, not valid UTF-8, or over the limit refuses before parse or persistence.

## Cost, run, lease, and terminal authority

Each later live run requires a coordinator-issued `run_id`, a coordinator-
generated `lease_id`, an atomic durable single-call lease, and a pre-call
reservation for the full `$0.01 USD` cap. The canonical lease vocabulary is
closed:

- `available` means that no durable lease record exists; it is not a stored
  state and has no token.
- A successful CAS/create-if-absent is the `claimed` event. It creates exactly
  one durable record in state `in-flight`; `claimed` is never a lease state.
- Atomic consume-before-socket changes that exact record from `in-flight` to
  `consumed`.
- Completion or a terminal refusal/hold changes that exact record from
  `consumed` to `terminal`. A losing concurrent invocation does not mutate the
  owning record; its own generic refusal record is terminal.
- No transition reopens, overwrites, or recreates a run. A valid-looking token
  without its exact durable record is not a fresh lease.

The closed internal durable lease record is not a JEV evidence record and is:

```text
lease_record: {
  lease_id: <generated string matching ^lease-[0-9a-f]{32}$>,
  run_id: <generated string matching ^run-[0-9a-f]{32}$>,
  capability: "openrouter-alpha-decisions",
  decision_schema_version: "jev-decisions/v1",
  request_digest: <64 lowercase hexadecimal characters matching ^[0-9a-f]{64}$>,
  state: "in-flight" | "consumed" | "terminal",
  claimed_at_utc: <timestamp matching ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$>,
  consumed_at_utc: <timestamp matching ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$> | absent until consumed,
  terminal_at_utc: <timestamp matching ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$> | absent until terminal,
  transition_actor: "coordinator"
}
```

The record field list is closed: no other field is permitted. The generated
`run_id` and `lease_id` grammars, the 64-lowercase-hexadecimal
`request_digest`, the exact capability and `decision_schema_version` literals,
the three exact states, and `transition_actor: "coordinator"` are mandatory.
Each present transition timestamp uses the exact UTC grammar above, is written
once by the coordinator, and is never rewritten; the absent timestamp
conditions above are part of the state invariant. For a complete
`live-observation`, the immutable transition-time bindings are

```text
lease_record.claimed_at_utc == live_observation.run_started_at_utc
lease_record.consumed_at_utc == live_observation.transmission_started_at_utc
```

`terminal_at_utc` is internal-only and is not represented in live evidence;
generic refusal/hold records likewise carry no lease transition fields. The
`lease_id`, `run_id`, `capability`, and
`request_digest` in a custody-verified `budget_ack` must equal the corresponding
fields in this exact durable record and in the live evidence record. The live
record's `schema_version` must equal both the durable record's
`decision_schema_version` and `budget_ack.decision_schema_version`, all exactly
`jev-decisions/v1`. The `budget_ack` binding is not satisfied by a
syntactically valid arbitrary `lease_id`; the exact record, coordinator owner,
and request digest must resolve.

The claim (`available -> in-flight`) and consume (`in-flight -> consumed`)
artifacts are internal transitions of this durable lease record, not a new
external evidence class. They are never emitted as JEV evidence records. The
same exact record fields and transition timestamps bind the live and budget
fields by equality. Concurrency is one, retries are zero, and timeout is 30
seconds.

Before every live transmission, the coordinator must provide the exact closed
`budget_ack` object defined in `jev-p0-evidence-boundary.md`. It is mandatory
for every live call; this contract has no direct provider-side or account-level
enforcement alternative. The acknowledgement must be custody-verified, fresh,
and bound to the exact current lease record, run, capability, decision schema,
and request digest. The one UTC timestamp grammar used by every provider,
budget, runtime, evidence, retention, and verification timestamp is
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$`; every value
must parse as a real UTC instant. `run_started_at_utc` is a runtime/live-record
coordinator sample at the claim event; `budget_ack.acknowledged_at_utc` is the
single freshness value and the top-level live-observation
`acknowledged_at_utc` is its required exact-equality mirror; no divergent
duplicate is permitted; `transmission_started_at_utc` is a runtime/live-record sample
immediately before the socket opens; and `socket_opened_at_utc` is a
runtime/live-record sample at the actual socket open. All four are required on
a complete live observation. Offsets, leap-second spellings, missing
milliseconds, and non-UTC suffixes are invalid. They must satisfy:

```text
run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <= socket_opened_at_utc
transmission_started_at_utc - acknowledged_at_utc <= 60 seconds
socket_opened_at_utc < acknowledged_at_utc + 60 seconds
```

The coordinator rejects a future timestamp, a missing sample, any backward
trusted-clock observation, an acknowledgement before run start, or an expiry
that has been reached. Immediately before transmission it rechecks the exact
durable lease record and exact equality of `lease_id`, `run_id`, capability, and
`request_digest` across `budget_ack`, the live record, and that record, plus
`live-record.schema_version == budget_ack.decision_schema_version ==
lease_record.decision_schema_version == "jev-decisions/v1"`; it also rechecks
`live-observation.acknowledged_at_utc == budget_ack.acknowledged_at_utc` and
uses that one equal value for freshness. It atomically consumes the record from
`in-flight` to `consumed`, and only then opens the socket. On completion or terminal refusal/hold it
records the append-only `consumed -> terminal` transition. The consumed lease
and acknowledgement cannot authorize another call; queueing, retry,
recreation, or reuse is refused. A client-side reservation alone cannot
prevent post-call overcharge and is not sufficient authorization.

`budget_ack` is always a closed `jev-budget/v1` object with exactly these
fields and values: `mode` is `provider-hard-budget` or
`account-hard-budget`; `provider` is literal `openrouter`; `account_ref`
matches `^acct-[0-9a-f]{32}$`; `cap_amount` is the finite JSON number `0.01`;
`currency` is literal `USD`; `acknowledged_at_utc` is the exact UTC timestamp
form; `acknowledgement_digest` is 64 lowercase hex; `repository`, `ref`,
`path`, `commit`, and `tree` use the immutable custody grammars; and `run_id`,
`lease_id`, `capability`, `decision_schema_version`, and `request_digest` bind it
exactly to the current lease record. `schema_version` remains the literal
`jev-budget/v1` for the acknowledgement object itself;
`decision_schema_version` is the exact `jev-decisions/v1` value compared with
the lease record and live record. No extra field is accepted. For a complete
live observation, the top-level `acknowledged_at_utc` must equal the nested
`budget_ack.acknowledged_at_utc` byte-for-byte; they represent one timestamp,
and freshness is computed from that one value. A divergent duplicate is
invalid. The acknowledgement digest is the SHA-256 of the JCS UTF-8 bytes of the object with
that digest field omitted. Missing, stale, mismatched, mutable, unverified,
future, backward-clock, or reused acknowledgement is a terminal hold before
transmission.

Every `live-observation` complete wrapper must contain this exact closed cost
object, with no omitted or extra field:

```text
cost: {
  amount: <finite non-negative JSON number <= 0.01>,
  currency: "USD"
}
```

`amount` is a JSON number, never a string, `NaN`, `Infinity`, negative value,
or other non-finite value. Missing fields, extra fields, non-USD currency, or
over-cap amount is never estimated, converted, or silently accepted. A missing
`cost` object, `amount`, or `currency` is deterministically a terminal
`hold`/evidence hold with reason `R13`; a present but malformed, non-USD,
negative, non-finite, over-cap, extra-field, or otherwise unauthorized cost is
deterministically a `refused`/evidence refusal with reason `R13`. The
evidence-boundary `live-observation` complete field set uses this object
verbatim, while every refused and held evidence field set forbids `cost`.

Run and evidence state transitions are append-only. Once `complete`, `refused`,
or `hold` is recorded, that terminal state cannot be retried, reopened,
overwritten, or converted by a later worker. A hold is terminal,
non-consumable, and non-retryable pending coordinator disposition. JEV-P0
itself has no run ID, lease, provider call, or spend.

The pre-call decision is a closed, observable, disjoint table. Observe the
invocation signal, exact same-run lease record, CAS/create-if-absent result, and
budget acknowledgement; the caller cannot choose a row:

| Evaluation order | Reason | Disjoint observable predicate | Outcome |
|---|---|---|---|
| 1 | R16 | An explicit retry, second, or concurrent invocation is observed; an existing same-run durable lease record is in `in-flight`, `consumed`, or `terminal`; a supplied token is duplicated, unrecognized, or bound to the wrong run, capability, schema version, request digest, or lease record; or CAS/create-if-absent loses to an existing `in-flight` owner. Every R16 state or token is excluded from R15. | `refused` |
| 2 | R15 | This is a first invocation with no R16 predicate, no existing same-run `in-flight`, `consumed`, or `terminal` record, and no successful fresh record, because `run_id` is missing or the lease service is unavailable or unobservable. | `hold` |
| 3 | R14 | After a fresh `in-flight` record is successfully created and its `lease_id`, run, capability, decision schema version, request digest, and binding are exact, `budget_ack` is missing, malformed, stale, reused, mutable, custody-unverified, future, backward-clock, expired, over-cap, non-USD, or otherwise invalid. | `hold` |

Evaluate exactly R16, then R15, then R14. R14, R15, and R16 are mutually
exclusive; all R16 states and tokens are excluded from R15, each condition
belongs to one row, and no caller-selected status is accepted.
For R14, the invalid acknowledgement prevents socket open; the coordinator
finalizes the fresh single-use record through `in-flight -> consumed ->
terminal` and emits only the generic hold record.

## Ordered custody reason-code precedence

Custody reasons are assigned by first failing validation stage, in this exact
order; validation stops at that stage, and a combined violation is owned by
the first failing stage rather than being ambiguous:

1. First structurally scan the recognized closed evidence-wrapper and
   retained-record schemas defined in this parcel. An unknown/extra field, raw
   authorization header, unsafe payload, or structural retention/schema
   violation is generic `evidence:R23` and stops validation. R23 applies only
   to those explicitly defined closed schemas; no unbounded log or report
   object is an evidence surface or may be classified by R23.
2. Only when the structural scan passes, validate recognized field values. A
   finite vocabulary, repository/ref/path allowlist, generated-ID grammar,
   numeric bound, or minimization/redaction uncertainty is generic
   `evidence:R22` and stops validation. Therefore a combined structural and
   value violation is `R23`, never `R22`; neither pre-custody reason is `R19`
   or `R18`.
3. Only after both pre-custody stages pass, resolve immutable custody.
   Missing, unverified, or non-resolving coordinator custody after structural
   validation, recognized-value validation, and repository/ref/path allowlist
   success, but before a resolved immutable custody tuple exists, is generic
   `evidence:R19` hold. Invalid ref/path values are `R22`; once the immutable
   custody tuple resolves, no custody mismatch is `R19`.
4. Only after custody and the defined outer schemas pass, a canonical
   provenance JCS, digest, or procedure failure is generic `evidence:R18`
   refusal. `R18` does not own generic out-of-schema fields; `R23` owns those.
5. Only after `R18` passes, evaluate `R17` solely for a request/response JCS
   canonical-byte failure or a paired request/response digest
   computation/procedure failure for present, validly shaped request/response
   JCS canonical-byte or paired digest inputs whose canonicalization,
   computation, or reproducibility fails. `R17` does not own identity equality
   or custody-byte/tree/manifest-entry mismatches. The structural stage owns
   absent fields as `R23`; the recognized-value stage owns out-of-grammar
   values as `R22`.
6. Only after `R17` passes and custody is resolved, evaluate `R20` for any
   mismatch between committed fixture bytes or the committed tree and the
   resolved immutable custody tuple or manifest-entry custody, including a
   mismatch among the resolved wrapper/provenance/manifest-entry/receipt
   custody fields. These custody mismatches are exclusively `R20`, which
   explicitly excludes every `R17` canonical-byte or digest-computation/
   procedure failure.
7. Only after `R20` passes, evaluate `R21` for a present, validly shaped,
   non-empty, non-sentinel value that is unequal in the finite path set below.
   The set is exactly these paths:
   `fixture.evidence_class`, `fixture.fixture_id`, `fixture.manifest_id`,
   `fixture.schema_version`, `fixture.requested_identity`,
   `fixture.requested_identity.provider`, `fixture.requested_identity.model`,
   `fixture.requested_identity.surface`, `fixture.served_identity`,
   `fixture.served_identity.model`, `fixture.served_identity.response_id`,
   `fixture.served_identity.source`, `fixture.response_id`,
   `fixture.server_timestamp_utc`, `fixture.request`,
   `fixture.request.schema_version`, `fixture.request.capability`,
   `fixture.request.requested_identity`,
   `fixture.request.requested_identity.provider`,
   `fixture.request.requested_identity.model`,
   `fixture.request.requested_identity.surface`, `fixture.request.state`,
   `fixture.request.state.schema_version`, `fixture.request.state.values`,
   `fixture.request.state.values.case_type`,
   `fixture.request.state.values.urgency_signal`,
   `fixture.request.state.values.frustration_signal`,
   `fixture.request.state.values.contact_channel`,
   `fixture.request.questions`, `fixture.request.questions[0]`,
   `fixture.request.questions[0].name`,
   `fixture.request.questions[0].type`,
   `fixture.request.questions[0].instructions`,
   `fixture.request.questions[0].instructions[0]`,
   `fixture.request.questions[0].criteria`,
   `fixture.request.questions[0].criteria[0]`,
   `fixture.request.questions[0].criteria[0].key`,
   `fixture.request.questions[0].criteria[0].description`,
   `fixture.request.questions[1]`, `fixture.request.questions[1].name`,
   `fixture.request.questions[1].type`,
   `fixture.request.questions[1].instructions`,
   `fixture.request.questions[1].instructions[0]`,
   `fixture.request.questions[1].criteria`,
   `fixture.request.questions[1].criteria[0]`,
   `fixture.request.questions[1].criteria[0].key`,
   `fixture.request.questions[1].criteria[0].description`,
   `fixture.request.questions[1].choices`,
   `fixture.request.questions[1].choices[0]`,
   `fixture.request.questions[1].choices[1]`,
   `fixture.request.questions[1].choices[2]`,
   `fixture.request.questions[2]`, `fixture.request.questions[2].name`,
   `fixture.request.questions[2].type`,
   `fixture.request.questions[2].instructions`,
   `fixture.request.questions[2].instructions[0]`,
   `fixture.request.questions[2].criteria`,
   `fixture.request.questions[2].criteria[0]`,
   `fixture.request.questions[2].criteria[0].key`,
   `fixture.request.questions[2].criteria[0].description`,
   `fixture.request.questions[2].score_label`, `fixture.request_digest`,
   `fixture.response`, `fixture.response.schema_version`,
   `fixture.response.capability`, `fixture.response.requested_identity`,
   `fixture.response.requested_identity.provider`,
   `fixture.response.requested_identity.model`,
   `fixture.response.requested_identity.surface`,
   `fixture.response.served_identity`,
   `fixture.response.served_identity.model`,
   `fixture.response.served_identity.response_id`,
   `fixture.response.served_identity.source`, `fixture.response.response_id`,
   `fixture.response.server_timestamp_utc`, `fixture.response.answers`,
   `fixture.response.answers[0]`, `fixture.response.answers[0].name`,
   `fixture.response.answers[0].type`,
   `fixture.response.answers[0].criteria`,
   `fixture.response.answers[0].criteria[0]`,
   `fixture.response.answers[0].criteria[0].key`,
   `fixture.response.answers[0].criteria[0].description`,
   `fixture.response.answers[0].value`,
   `fixture.response.answers[0].confidence`,
   `fixture.response.answers[1]`, `fixture.response.answers[1].name`,
   `fixture.response.answers[1].type`,
   `fixture.response.answers[1].criteria`,
   `fixture.response.answers[1].criteria[0]`,
   `fixture.response.answers[1].criteria[0].key`,
   `fixture.response.answers[1].criteria[0].description`,
   `fixture.response.answers[1].value`,
   `fixture.response.answers[1].confidence`,
   `fixture.response.answers[1].distribution`,
   `fixture.response.answers[1].distribution.billing`,
   `fixture.response.answers[1].distribution.technical`,
   `fixture.response.answers[1].distribution.sales`,
   `fixture.response.answers[2]`, `fixture.response.answers[2].name`,
   `fixture.response.answers[2].type`,
   `fixture.response.answers[2].criteria`,
   `fixture.response.answers[2].criteria[0]`,
   `fixture.response.answers[2].criteria[0].key`,
   `fixture.response.answers[2].criteria[0].description`,
   `fixture.response.answers[2].value`,
   `fixture.response.answers[2].confidence`, `fixture.response_digest`,
   `fixture.provenance.fixture_id`, `fixture.provenance.manifest_id`,
   `fixture.provenance.source_kind`, `fixture.provenance.source_ref`,
   `fixture.provenance.captured_at_utc`,
   `fixture.provenance.authenticated_response_id`,
   `fixture.provenance_digest`, `fixture.source_kind`, `fixture.source_ref`,
   `fixture.status`, `fixture.reason_code`, `fixture.retention_until_utc`,
   `fixture.manifest_entry.schema_version`,
   `fixture.manifest_entry.manifest_id`,
   `fixture.manifest_entry.fixture_id`,
   `fixture.manifest_entry.request_digest`,
   `fixture.manifest_entry.response_digest`, and
   `fixture.manifest_entry.provenance_digest`.

   The exact equality paths are:
   `fixture.schema_version == fixture.request.schema_version ==
   fixture.response.schema_version == fixture.manifest_entry.schema_version`;
   `fixture.request.capability == fixture.response.capability ==
   "openrouter-alpha-decisions"`;
   `fixture.manifest_id == fixture.provenance.manifest_id ==
   fixture.manifest_entry.manifest_id`;
   `fixture.fixture_id == fixture.provenance.fixture_id ==
   fixture.manifest_entry.fixture_id`;
   `fixture.requested_identity == fixture.request.requested_identity ==
   fixture.response.requested_identity`;
   `fixture.served_identity == fixture.response.served_identity`;
   `fixture.served_identity.model == fixture.response.served_identity.model`;
   `fixture.served_identity.response_id ==
   fixture.response.served_identity.response_id`;
   `fixture.served_identity.source == fixture.response.served_identity.source`;
   `fixture.response_id == fixture.response.response_id ==
   fixture.served_identity.response_id ==
   fixture.response.served_identity.response_id ==
   fixture.provenance.authenticated_response_id`;
   `fixture.server_timestamp_utc == fixture.response.server_timestamp_utc`;
   `fixture.source_kind == fixture.provenance.source_kind`;
   `fixture.source_ref == fixture.provenance.source_ref`;
   `fixture.response.answers[0].name == fixture.request.questions[0].name`;
   `fixture.response.answers[0].type == fixture.request.questions[0].type`;
   `fixture.response.answers[0].criteria ==
   fixture.request.questions[0].criteria`;
   `fixture.response.answers[1].name == fixture.request.questions[1].name`;
   `fixture.response.answers[1].type == fixture.request.questions[1].type`;
   `fixture.response.answers[1].criteria ==
   fixture.request.questions[1].criteria`;
   `fixture.response.answers[2].name == fixture.request.questions[2].name`;
   `fixture.response.answers[2].type == fixture.request.questions[2].type`;
   `fixture.response.answers[2].criteria ==
   fixture.request.questions[2].criteria`;
   `fixture.request_digest == SHA256(JCS-UTF8(fixture.request)) ==
   fixture.manifest_entry.request_digest`;
   `fixture.response_digest == SHA256(JCS-UTF8(fixture.response)) ==
   fixture.manifest_entry.response_digest`; and
   `fixture.provenance_digest == SHA256(JCS-UTF8(fixture.provenance)) ==
   fixture.manifest_entry.provenance_digest`.

   `fixture.request` and `fixture.response` are compared as the exact closed
   request and response envelope objects defined by this contract, with every
   finite nested path listed above compared at its exact value. The singleton
   paths `fixture.evidence_class`, `fixture.status`, and `fixture.reason_code`
   are compared to their exact closed-schema literals. The path
   `fixture.provenance.captured_at_utc` is compared byte-for-byte with the
   coordinator-approved canonical provenance capture timestamp for this
   fixture and is the retention anchor:
   `fixture.provenance.captured_at_utc <= fixture.retention_until_utc <=
   fixture.provenance.captured_at_utc + 90 days`. The path
   `fixture.retention_until_utc` is compared using that exact invariant.
   All listed identity, timestamp, digest, ID, source, object, string, number,
   and array comparisons are exact and case-sensitive. Repository/ref/path/
   commit/tree, the corresponding provenance custody fields, and
   `fixture.manifest_entry.repository/ref/path/commit/tree` are custody-tuple
   paths owned only by `R20`; request/response digest computation failures
   belong only to `R17`; provenance digest procedure failures belong only to
   `R18`. A missing, one-sided, empty, sentinel, or invalid listed value is
   `R23` or `R22`, never `R21`.

The predicates are ordered and mutually exclusive:
`R23 -> R22 -> R19 -> R18 -> R17 -> R20 -> R21`. No digest-procedure failure
may be reclassified as `R20`, no resolved custody mismatch may be reclassified
as `R19`, and no `R21` semantic equality failure may absorb an `R17` or `R20`
failure.

## Credential and consumer boundary

Only a later explicitly authorized runtime parcel may receive
`OPENROUTER_API_KEY` through process-local injection. JEV-P0 and its documents
must not discover, read, persist, print, hash, transmit, or test credentials.
Receipts, fixtures, retained records, and evidence contain neither the key
nor a raw authorization header. A later auth observation may be boolean/status-
only.

The only named consumer is `support-triage-advisory-v1`. Its exact closed
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

Only the closed state schema may be sent. Pre-send minimization and
redaction are mandatory; uncertain or unsafe input refuses. This applies to
the complete transmitted envelope: state, question names, instruction tokens,
criteria keys/descriptions, choices, score labels, and all wrapper metadata.
Rejected unsafe/free-text input is not logged, digested, persisted, or included
in a refusal record. The fixed literals and generated hexadecimal IDs admit no
caller names, emails, phone numbers, URLs, ticket identifiers, credentials, or
other free-text PII; no generic semantic detector is part of acceptance.
Source references and fixture identifiers are generated opaque values only.

Raw request bodies, raw response bodies, headers, authorization values,
compressed streams, and unredacted payloads have zero retention. Sanitized
fixtures and safe live metadata require a coordinator-sampled retention anchor
from the trusted capture/recording clock and a `retention_until_utc`; both
retention timestamps use the exact UTC grammar above, future anchors are
rejected, and the exact bound is
`anchor_utc <= retention_until_utc <= anchor_utc + 90 days`. At or before the
bound, or on earlier coordinator disposition, the material must be deleted or
rendered inaccessible without changing the immutable custody record. Retention
never authorizes retaining raw payloads or rejected input.

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
