# JEV-P0 — Evidence boundary and refusal matrix

## Evidence authority classes

JEV evidence is classified before it can be consumed:

| Class | What it proves | What it cannot prove |
|---|---|---|
| `live-observation` | A later explicitly authorized bounded run observed an authenticated provider response and recorded safe metadata. | Replay authority, standard catalog eligibility, D13 eligibility, general service health, or routing approval. |
| `sanitized-replay-fixture` | A sanitized request/response pair can be validated deterministically against `jev-decisions/v1` and its recorded JCS digests. | That the provider is currently available or that the fixture came from a fresh live call unless provenance says so. |
| `refusal-record` | A bounded check refused a named condition and did not proceed. | A successful provider result, a retry authorization, or permission to weaken the refusal. |
| `hold-record` | A required fact is missing or unsafe, so the result is terminally non-consumable pending coordinator disposition. | Permission to retry, estimate, normalize, reopen, or consume the held result. |

A live observation is never replay authority. Replay requires a distinct,
sanitized, provenance-tagged fixture with paired JCS digests, immutable
manifest custody, and explicit requested/served identity binding. Evidence
status must say whether a record is an observation, replayable evidence,
refusal, or hold; these states must not be collapsed.

## Closed reason-code and status partition

The `R01`–`R25` values below are condition suffixes, not complete serialized
codes. A non-complete record must use the prefix owned by its evidence class:
`live:Rnn` for a live observation, `fixture:Rnn` for a sanitized replay
fixture, or `evidence:Rnn` for a generic refusal/hold record. An unprefixed
reason code is invalid. Each condition has exactly one status under the
following closed partition:

| Status class | Reason suffixes and rule |
|---|---|
| Refusal-only | `R01`–`R11`, `R16`–`R18`, `R20`, and `R22`–`R25`; the named invalid, conflicting, unsafe, retry, or forbidden condition is always `refused`. |
| Hold-only | `R14`, `R15`, and `R19`; the missing, stale, unverified, or coordinator-pending condition is always `hold` with `disposition: "pending-coordinator"`. |
| Explicit split | `R09`: present malformed or conflicting served-model/identity metadata is `refused`; `R12`: missing provider-declared complete metadata is `hold` only; `R13`: missing cost fields are `hold`, while a present malformed or unauthorized cost is `refused`; `R21`: the post-custody replay identity/provenance equality failure is `refused`. |

The split rows are mutually exclusive as written and take precedence over any
general fail-closed wording. For the pre-call budget/lease family, evaluate
`R16` first, then `R15`, then `R14`: a retry, concurrent invocation,
post-consume attempt, or wrong-bound/duplicate lease token is `R16` refused; a
missing/unavailable or contested lease claim is `R15` hold; and a first
successfully claimed lease with a missing, stale, or reused budget
acknowledgement is `R14` hold. Thus a reused acknowledgement on a retry is
`R16`, while a reused acknowledgement on the first claimed invocation is
`R14`; no condition may emit both statuses. No caller may choose a status. A
complete record always uses `reason_code: "none"`.

## Exact evidence-class and status field sets

Each record below is a closed JSON object. The listed required set is the
complete set: every field name not listed for that record is forbidden. A
missing listed field, an extra field, a wrong literal, or a wrong conditional
value refuses. Pre-call failures are represented only by `refusal-record` or
`hold-record`; every `live-observation` record represents an attempted call and
therefore carries the required `budget_ack`.

### `live-observation`

`live-observation` with `status: complete` has exactly this required field set:

```text
evidence_class, capability, run_id, lease_id, endpoint,
requested_identity, served_identity, schema_version, response_id,
server_timestamp_utc, client_timestamp_utc, request_digest, response_digest,
usage, cost, budget_ack, source_kind, source_ref, status, reason_code,
retention_until_utc
```

Its exact conditional values are `evidence_class: "live-observation"`,
`capability: "openrouter-alpha-decisions"`, `endpoint` equal to the immutable
capability endpoint, `schema_version: "jev-decisions/v1"`,
`source_kind: "coordinator-live" | "provider-response"`, `status: "complete"`,
and `reason_code: "none"`. `response_id` and `server_timestamp_utc` are
provider-declared, parseable, and bound to the same authenticated response;
`served_identity.model` is exactly the authenticated response `model`, and
`served_identity.response_id` is exactly that response's identifier. The
requested model is never a fallback. The `cost` field is exactly the two-field
object `{ amount: <finite non-negative JSON number <= 0.01>, currency: "USD" }`;
no cost field is omitted or added, and `currency` is exactly `USD`.

`live-observation` with `status: refused` has exactly this required field set:

```text
evidence_class, capability, run_id, lease_id, endpoint, schema_version,
client_timestamp_utc, request_digest, budget_ack, source_kind, source_ref,
status, reason_code, retention_until_utc
```

Its exact values include `status: "refused"`, `reason_code: "live:R01"` through
`"live:R25"`, and the same capability, endpoint, schema, source, and budget
requirements above. `requested_identity`, `served_identity`, `response_id`,
`server_timestamp_utc`, `response_digest`, `usage`, and `cost` are forbidden.

`live-observation` with `status: hold` has exactly this required field set:

```text
evidence_class, capability, run_id, lease_id, endpoint, schema_version,
client_timestamp_utc, request_digest, budget_ack, source_kind, source_ref,
status, reason_code, disposition, retention_until_utc
```

Its exact values include `status: "hold"`, `disposition: "pending-coordinator"`,
and `reason_code: "live:R01"` through `"live:R25"`. `requested_identity`,
`served_identity`, `response_id`, `server_timestamp_utc`, `response_digest`,
`usage`, and `cost` are forbidden.

### `sanitized-replay-fixture`

`sanitized-replay-fixture` with `status: complete` has exactly this required
field set:

```text
evidence_class, fixture_id, manifest_id, repository, ref, path, commit, tree,
provenance, provenance_digest, schema_version, requested_identity,
served_identity, response_id, server_timestamp_utc, request, response,
request_digest, response_digest, manifest_entry, source_kind, source_ref,
status, reason_code, retention_until_utc
```

Its exact values include `evidence_class: "sanitized-replay-fixture"`,
`schema_version: "jev-decisions/v1"`, `source_kind: "sanitized-fixture"`,
`status: "complete"`, and `reason_code: "none"`. All custody, provenance,
identity, request, response, and digest equalities below are mandatory.

`sanitized-replay-fixture` with `status: refused` has exactly this required
field set:

```text
evidence_class, fixture_id, manifest_id, repository, ref, path, commit, tree,
provenance, provenance_digest, source_kind, source_ref, status, reason_code,
retention_until_utc
```

Its exact values are `evidence_class: "sanitized-replay-fixture"`,
`source_kind: "sanitized-fixture"`, `status: "refused"`, and
`reason_code: "fixture:R01"` through `"fixture:R25"`. `requested_identity`, `served_identity`,
`response_id`, `server_timestamp_utc`,
`request`, `response`, `request_digest`, and `response_digest` are forbidden.
The required `provenance` is the exact canonical object with
`authenticated_response_id: "none"`; `provenance_digest` is its JCS digest.
This fixture-class refusal is permitted only after the coordinator receipt has
already resolved the exact custody tuple; missing, malformed, mutable, or
non-resolving custody must use the generic `refusal-record`/`hold-record`
classes below instead.

`sanitized-replay-fixture` with `status: hold` has exactly this required field
set:

```text
evidence_class, fixture_id, manifest_id, repository, ref, path, commit, tree,
provenance, provenance_digest, source_kind, source_ref, status, reason_code,
disposition, retention_until_utc
```

Its exact values are `evidence_class: "sanitized-replay-fixture"`,
`source_kind: "sanitized-fixture"`, `status: "hold"`,
`disposition: "pending-coordinator"`, and `reason_code: "fixture:R01"` through
`"fixture:R25"`. The required `provenance` is the exact canonical object with
`authenticated_response_id: "none"`; `provenance_digest` is its JCS digest.
`requested_identity`,
`served_identity`, `response_id`, `server_timestamp_utc`, `request`,
`response`, `request_digest`, and `response_digest` are forbidden.
This fixture-class hold is permitted only after the coordinator receipt has
already resolved the exact custody tuple; missing, malformed, mutable, or
non-resolving custody must use generic `evidence:R18` refusal or `evidence:R19`
hold records and may not require impossible fixture provenance.

### `refusal-record` and `hold-record`

`refusal-record` has exactly this required field set:

```text
evidence_class, status, reason_code, source_kind, source_ref,
recorded_at_utc, retention_until_utc
```

Its exact values are `evidence_class: "refusal-record"`,
`status: "refused"`, `source_kind: "coordinator-review"`, and
`reason_code: "evidence:R01"` through `"evidence:R25"`. `disposition`, request/response fields,
custody fields, identities, cost, usage, and budget fields are forbidden.

`hold-record` has exactly this required field set:

```text
evidence_class, status, reason_code, disposition, source_kind, source_ref,
recorded_at_utc, retention_until_utc
```

Its exact values are `evidence_class: "hold-record"`, `status: "hold"`,
`disposition: "pending-coordinator"`, `source_kind: "coordinator-review"`,
and `reason_code: "evidence:R01"` through `"evidence:R25"`. Request/response fields, custody
fields, identities, cost, usage, and budget fields are forbidden.

Every complete record requires the exact complete set above; every refused or
held record requires its exact refused or held set above. No record may move
between these sets, add a diagnostic field, or use a free-text reason.

## Closed evidence metadata schemas

Evidence wrappers are closed objects: no field outside the schemas below is
accepted, and every string is ASCII-only printable U+0020–U+007E with no
control character. These exact bounds make metadata validation deterministic:

- `usage` is exactly `{ input_tokens, output_tokens, total_tokens }`. Each is
  an integer from 0 through 65,536 except `total_tokens`, which is from 0
  through 131,072; `total_tokens` must equal the other two fields' sum.
- `source_kind` is exactly one of `coordinator-live`, `provider-response`,
  `sanitized-fixture`, or `coordinator-review`; `source_ref` is generated and
  matches exactly `^src-[0-9a-f]{32}$`.
- `run_id` matches exactly `^run-[0-9a-f]{32}$`; `lease_id` matches exactly
  `^lease-[0-9a-f]{32}$`; `fixture_id` matches exactly
  `^fx-[0-9a-f]{32}$`; `manifest_id` matches exactly
  `^manifest-[0-9a-f]{32}$`; and `account_ref` matches exactly
  `^acct-[0-9a-f]{32}$`. These IDs are generated opaque values, never names,
  labels, ticket IDs, or caller text.
- `response_id` matches `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`, is non-empty,
  and is never the literal `none`; served model identifiers match
  `^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$`.
- `repository` is exactly the literal `agent-skills`; `ref` is exactly one of
  the literals `main`, `codex/jev-p0-contract`, or the planned JEV-P1 literal
  `codex/jev-p1-typed-validator-and-fixture-replay`; and `path` is exactly one
  of these finite repository-relative literals:
  `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-contract.md`,
  `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-evidence-boundary.md`,
  `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-p0-verification.md`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/complete.json`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/refused.json`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/hold.json`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/mismatch-response-id.json`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/mismatched-digest.json`,
  `plugins/foreman-line/jev-decisions/tests/fixtures/extra-field.json`, or
  `plugins/foreman-line/jev-decisions/tests/fixtures/unsafe-reason.json`.
  No other repository, ref, directory, or path is valid. `commit` and `tree`
  are exactly 40 lowercase hexadecimal characters.
- `server_timestamp_utc`, `client_timestamp_utc`, `captured_at_utc`,
  `recorded_at_utc`, and `retention_until_utc` match the exact UTC form
  `^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` and must
  parse as real UTC timestamps. The retention anchor is coordinator-sampled
  from the trusted capture/recording clock: for a live observation,
  `client_timestamp_utc` is the coordinator-recorded capture timestamp, not an
  arbitrary caller wall clock; `captured_at_utc` is the anchor for replay
  fixtures; and `recorded_at_utc` is the anchor for generic refusal/hold
  records. A future anchor relative to that coordinator clock is rejected, and
  the exact invariant is
  `anchor_utc <= retention_until_utc <= anchor_utc + 90 days`.
- The operational freshness fields `run_started_at_utc`,
  `acknowledged_at_utc`, `transmission_started_at_utc`, and
  `socket_opened_at_utc` use that same exact UTC form and must parse as real
  UTC instants. They must satisfy
  `run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc
  <= socket_opened_at_utc`; the acknowledgement age remains at most 60
  seconds at transmission, and the socket-open sample must be strictly before
  `acknowledged_at_utc + 60 seconds`.
- `request_digest`, `response_digest`, `provenance_digest`, and
  `acknowledgement_digest` are exactly 64 lowercase hexadecimal characters
  matching `^[0-9a-f]{64}$`; `capability`, `schema_version`, and `endpoint` are
  the exact literals defined by the contract; and `currency` is exactly `USD`
  wherever it appears.
- `evidence_class` is exactly `live-observation`,
  `sanitized-replay-fixture`, `refusal-record`, or `hold-record`; `status` is
  exactly `complete`, `refused`, or `hold`; and `reason_code` is `none` for
  complete records or the class-prefixed `live:R01` through `live:R25`,
  `fixture:R01` through `fixture:R25`, or `evidence:R01` through `evidence:R25`
  for non-complete records, subject to the closed status partition above.

The six class/status field sets above are the complete wrapper schema. Unknown
wrapper metadata, free-text reasons, unbounded numbers, human-chosen IDs, or
values outside the finite literal allowlists refuse and are not retained.

## Closed pre-call budget acknowledgement

`budget_ack` is exactly this object, with no extra or omitted field:

```text
{
  schema_version: "jev-budget/v1",
  mode: "provider-hard-budget" | "account-hard-budget",
  provider: "openrouter",
  account_ref: <string matching ^acct-[0-9a-f]{32}$>,
  cap_amount: 0.01,
  currency: "USD",
  acknowledged_at_utc: <exact UTC timestamp grammar above>,
  acknowledgement_digest: <64 lowercase hex characters>,
  repository: <repository grammar above>,
  ref: <ref grammar above>,
  path: <path grammar above>,
  commit: <40 lowercase hex characters>,
  tree: <40 lowercase hex characters>,
  run_id: <run ID grammar above>,
  capability: "openrouter-alpha-decisions",
  request_digest: <64 lowercase hex characters>
}
```

`account_ref` is generated by the exact hexadecimal grammar; it is not an
account name, email, URL, customer identifier, or free text. `cap_amount` must be the finite
JSON number `0.01`, not a string or another numeric value. The
`acknowledgement_digest` is SHA-256 over the RFC 8785/JCS UTF-8 bytes of this
object with `acknowledgement_digest` omitted, and its custody repository/ref/
path/commit/tree must be verified at the exact committed tree. The acknowledgement
is valid only when its `run_id`, capability, and `request_digest` exactly match
the live wrapper. Freshness is checked using one trusted coordinator UTC clock:
`run_started_at_utc` is sampled when the durable lease is claimed and
`transmission_started_at_utc` immediately before the socket is opened. Both
clock samples and `acknowledged_at_utc` are mandatory and must satisfy
`run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc`.
The acknowledgement must be at most 60 seconds old at transmission and expires
at `acknowledged_at_utc + 60 seconds`; the socket must open strictly before
that expiry. A future timestamp, backward or missing trusted-clock sample,
acknowledgement before run start, or reached expiry is rejected.

Immediately before transmission, the immutable lease binding
(`run_id`, capability, schema version, and request digest) is rechecked against
the custody-verified acknowledgement and durable lease. The lease is atomically
consumed before the socket opens. The consumed lease and acknowledgement cannot
authorize another call; queueing, retry, recreation, or reuse after validation
is rejected.

The exact `budget_ack` object in this closed schema is required before every
live call. There is no direct provider-side or account-level enforcement
alternative in this contract. A client-only reservation is not enough because
it cannot prevent post-call overcharge. Missing, mismatched, stale, mutable,
unverified, future, backward-clock, expired, or reused acknowledgement is a
terminal hold before transmission.

## Immutable transport authority and raw body sizes

The capability owns the endpoint, method, headers, and body policy. A caller
cannot control `Host`, `:authority`, `Authorization`, content headers,
transfer headers, endpoint, method, body, proxy destination, or redirects.
Authorization may be injected only by a later authorized process-local runtime
adapter and is not evidence. The only permitted capability headers are the
immutable JSON negotiation headers in the contract; framing headers are
transport-derived.

The request size is the byte length of the exact UTF-8 serialized body bytes
immediately before transmission, before TLS framing. The measured bytes must
be exactly the bytes transmitted; no caller or transport rewrite, compression,
chunk substitution, or body substitution is permitted. The request must be
`<= 65,536` bytes.

The response size is the byte length of the raw UTF-8 application body after
any permitted transport decompression and before JSON parsing or persistence.
It must be `<= 65,536` bytes. Unsupported encoding, decompression failure,
body truncation, invalid UTF-8, or over-limit size is a refusal before parse or
persistence.

Transport must use exactly `POST` to `https://openrouter.ai/api/alpha/decisions`
with final TLS origin `https://openrouter.ai`. Redirects are disabled; any
redirect response or attempted redirect is a refusal. Missing or non-
`application/json` content type, non-2xx status, TLS/certificate/hostname/chain
failure, DNS/connectivity/transport failure, decompression failure, and
truncation are refusal conditions. No caller URL, alternate host, proxy target,
or final-origin substitution is accepted.

## RFC 8785/JCS canonical digest procedure

The digest is over the logical validated request or response object, not over
raw wire bytes, HTTP headers, TLS framing, compression, authorization values,
or a raw unsafe payload. The two byte domains are recorded separately:

- `raw_wire_body_bytes`: exact UTF-8 serialized request bytes before
  transmission, or exact raw UTF-8 response bytes before parsing. These bytes
  enforce transport limits and are not the replay digest input.
- `canonical_digest_bytes`: RFC 8785 JSON Canonicalization Scheme (JCS) UTF-8
  bytes of the parsed, validated, sanitized logical envelope. These bytes are
  the only SHA-256 input for `request_digest` and `response_digest`.

For each logical envelope:

1. Require strict UTF-8 JSON with no BOM, no trailing non-whitespace bytes,
   no duplicate object keys, and no non-finite numeric values.
2. Parse and validate the complete closed envelope against
   `jev-decisions/v1`, including exact identity binding, authenticated served
   identity, question/answer coverage, type-specific values, and response
   metadata requirements.
3. Apply RFC 8785/JCS canonicalization to the logical JSON value. Do not use
   an ad hoc sorted-key serializer as a substitute for JCS.
4. Encode the JCS result as UTF-8 `canonical_digest_bytes`. Hash exactly those
   bytes with SHA-256 and record the lowercase 64-hex-character digest.

The request digest covers the sanitized logical request envelope, not headers
or an authorization value. The response digest covers the sanitized logical
response envelope, not transport headers, compression, or an unsafe raw
payload. A digest mismatch, missing digest, provenance mismatch, or
requested/served identity mismatch refuses replay.

### Required JCS vectors

The deterministic validator/replay implementation must reproduce these vectors
exactly. The displayed bytes are UTF-8 canonical logical bytes, not raw wire
captures:

| Vector | Canonical UTF-8 bytes | SHA-256 |
|---|---|---|
| `jev-jcs-request-001` | `{"a":1,"b":[true,"x"]}` | `63e8063d9dc6f0fd5a24b4706818a165fd57c3531b74466cf5dea62bff09b0b6` |
| `jev-jcs-response-001` | `{"model":"typesafe/jev-1.13","response_id":"r-001","schema_version":"jev-decisions/v1"}` | `dab820809e40697f1bdcc99736067d9d282090766ae72d0e65137daf3cf6bca2` |

The first vector proves compact deterministic logical bytes. The second proves
that JCS key ordering changes digest input while preserving logical fields. A
fixture storing only a raw wire hash, or whose paired JCS digest cannot be
reproduced from its sanitized logical envelope, refuses.

## Canonical provenance and trusted fixture custody

The canonical provenance object is closed and contains only the generated IDs
and finite literals defined by this document:

```text
{
  fixture_id: <string matching ^fx-[0-9a-f]{32}$>,
  source_kind: "coordinator-live" | "provider-response" | "sanitized-fixture" | "coordinator-review",
  source_ref: <string matching ^src-[0-9a-f]{32}$>,
  captured_at_utc: <parseable UTC timestamp>,
  authenticated_response_id: "none" | <provider response_id>,
  manifest_id: <string matching ^manifest-[0-9a-f]{32}$>,
  repository: "agent-skills",
  ref: "main" | "codex/jev-p0-contract" | "codex/jev-p1-typed-validator-and-fixture-replay",
  path: <one of the finite approved repository-relative custody paths>,
  manifest_commit: <verified commit SHA>,
  manifest_tree: <verified tree SHA>
}
```

`provenance_digest` is SHA-256 over the RFC 8785/JCS UTF-8 bytes of exactly
this canonical provenance object. The digest procedure is the same strict
parse/JCS/UTF-8/hash procedure above, and the provenance object is hashed
without adding transport headers, credentials, fields outside the closed
schema, or mutable timestamps.

`provenance.authenticated_response_id` is always present. For a non-complete
`refused` or `hold` fixture, its only permitted value is the exact JSON string
`"none"`; omitted, `null`, empty, or any other sentinel refuses. For a
`complete` fixture, it must be a non-empty provider response ID, never `none`,
and the complete-fixture equality is exact:

```text
fixture.response_id
  == fixture.response.response_id
  == fixture.served_identity.response_id
  == fixture.provenance.authenticated_response_id
```

All four values are provider-declared. After custody is resolved, a missing,
one-sided, empty, sentinel, client-synthesized, or mismatched value is an
explicit `fixture:R21` refusal; unresolved custody follows `evidence:R19` hold
or `evidence:R18` refusal as specified by the matrix. The provenance value may
not be synthesized from a requested identity, fixture filename, manifest
entry, or client-generated identifier.

A replay fixture must be present in an immutable, reviewable manifest/commit
custody chain and contain:

```text
evidence_class: "sanitized-replay-fixture"
repository: <exact repository identifier>
ref: <exact reviewed ref>
path: <exact repository-relative manifest path>
commit: <verified commit SHA>
tree: <verified tree SHA for the manifest path>
manifest_id: <manifest identifier>
fixture_id: <fixture identifier>
provenance: <canonical provenance object above>
provenance_digest: <JCS SHA-256 of provenance>
schema_version: "jev-decisions/v1"
requested_identity: <exact request tuple>
served_identity: <model and response_id from authenticated provider response>
request: <sanitized validated request envelope>
response: <sanitized validated response envelope>
request_digest: <JCS SHA-256>
response_digest: <JCS SHA-256>
manifest_entry: {
  schema_version: <same schema_version as wrapper, request, and response>,
  manifest_id: <same manifest_id>,
  fixture_id: <same fixture_id>,
  repository: <same repository>,
  ref: <same ref>,
  path: <same path>,
  commit: <same commit>,
  tree: <same tree>,
  request_digest: <same request_digest>,
  response_digest: <same response_digest>,
  provenance_digest: <same provenance_digest>
}
retention_until_utc: <bounded retention deadline>
```

Trusted custody means the exact repository, ref, path, manifest commit, and
manifest tree are verified; `fixture_id` resolves to the exact manifest entry
at that committed tree; the entry contains the exact paired request/response
digests and provenance digest; the complete fixture satisfies the four-way
response-ID equality above; and current bytes match the committed bytes. The
wrapper custody tuple and provenance custody tuple must be identical:

```text
(repository, ref, path, commit, tree)
  == (provenance.repository, provenance.ref, provenance.path,
      provenance.manifest_commit, provenance.manifest_tree)
  == (manifest_entry.repository, manifest_entry.ref, manifest_entry.path,
      manifest_entry.commit, manifest_entry.tree)
```

`manifest_commit` and `manifest_tree` are exactly 40 lowercase hexadecimal
characters and equal wrapper `commit` and `tree`; every manifest-entry field
above is required and exact. Any split-brain mismatch refuses custody.
Mutable working-tree files, uncommitted fixtures, detached copies, missing
manifest entries, self-recomputed manifest entries, or changed digest pairs
are not trusted custody and refuse replay.

Complete replay equality is field-for-field and is not satisfied by a matching
top-level digest alone:

```text
fixture.schema_version
  == fixture.request.schema_version
  == fixture.response.schema_version
  == fixture.manifest_entry.schema_version
  == "jev-decisions/v1"

fixture.requested_identity
  == fixture.request.requested_identity
  == fixture.response.requested_identity

fixture.source_kind
  == fixture.provenance.source_kind

fixture.source_ref
  == fixture.provenance.source_ref

fixture.served_identity
  == fixture.response.served_identity

fixture.response_id
  == fixture.response.response_id
  == fixture.served_identity.response_id
  == fixture.response.served_identity.response_id
  == fixture.provenance.authenticated_response_id

fixture.server_timestamp_utc
  == fixture.response.server_timestamp_utc

fixture.fixture_id
  == fixture.provenance.fixture_id
  == fixture.manifest_entry.fixture_id

fixture.manifest_id
  == fixture.provenance.manifest_id
  == fixture.manifest_entry.manifest_id

fixture.request_digest
  == SHA256(JCS-UTF8(fixture.request))
  == fixture.manifest_entry.request_digest

fixture.response_digest
  == SHA256(JCS-UTF8(fixture.response))
  == fixture.manifest_entry.response_digest

fixture.provenance_digest
  == SHA256(JCS-UTF8(fixture.provenance))
  == fixture.manifest_entry.provenance_digest
```

No duplicated identity, response, timestamp, digest, ID, source, or custody
value may be repaired, inferred, normalized, or accepted one-sidedly. Any
missing or unequal nested value refuses complete replay. In particular, any
mismatch in `fixture.requested_identity == fixture.request.requested_identity
== fixture.response.requested_identity` or in
`fixture.source_kind/source_ref == fixture.provenance.source_kind/source_ref`
is an explicit refusal with reason `fixture:R21` after custody is resolved;
custody that cannot be resolved follows the explicit `evidence:R19` hold or
`evidence:R18` refusal path and never becomes a complete fixture.

### Independent coordinator manifest receipt/resolution

Wrapper/provenance/manifest-entry self-equality is necessary but is not trusted
custody. Complete replay requires an independent, coordinator-controlled
manifest receipt/resolution object at the coordinator's approved receipt
location. The receipt is a closed object with exactly these fields and values:

```text
{
  receipt_schema_version: "jev-manifest-receipt/v1",
  authority: "coordinator-manifest-resolver-v1",
  receipt_id: <string matching ^mreceipt-[0-9a-f]{32}$>,
  resolution: "resolved",
  manifest_id: <same exact manifest_id>,
  fixture_id: <same exact fixture_id>,
  repository: "agent-skills",
  ref: <one finite approved ref literal above>,
  path: <one finite approved fixture/manifest path above>,
  commit: <same exact wrapper commit>,
  tree: <same exact wrapper tree>,
  request_digest: <same exact wrapper request_digest>,
  response_digest: <same exact wrapper response_digest>,
  provenance_digest: <same exact wrapper provenance_digest>,
  resolved_at_utc: <trusted coordinator recording timestamp>
}
```

The coordinator receipt/resolver is the independent trust anchor: it resolves
the exact `manifest_id`, `fixture_id`, repository, ref, path, commit, tree,
request digest, response digest, and provenance digest from its controlled
record, then returns the closed receipt above. Missing receipt, missing
resolution, unknown fields, duplicate fields, wrong authority/version, any
mismatch, mutable/non-resolving source, or an unapproved ref/path is a
fail-closed `evidence:R19` hold or `evidence:R18` refusal as applicable.
Replay accepts custody only after that external authority resolves the exact
tuple and all three digests; it never treats wrapper self-equality,
self-recomputed IDs, or format-only IDs as proof of trust. Receipt IDs and
manifest IDs are correlators, not cryptographic or independent trust proofs.

The fixture must include a negative identity-binding companion vector: changing
or deleting the provider response `model`, changing `response_id`, or
replacing served identity with a client fallback must make replay refuse.

Sanitization retains only the closed request/response fields, generated IDs, and
finite literals defined here. Credentials, authorization headers, secret-bearing
state, unsafe payloads, unrelated provider data, and any free-text field are
refused before retention. It must not alter contract fields, identities,
question criteria, answer values, or digest inputs; if it would, the fixture is
refused rather than presented as exact replay. Raw request/response bodies,
headers, authorization values, compressed streams, and unredacted payloads
have zero retention.

## Atomic run, budget, and terminal state

Each live run requires a coordinator-issued `run_id`, an atomic durable
single-call `lease_id`, and a pre-call reservation for the full `$0.01 USD`
cap. Atomic claim semantics are CAS/create-if-absent on a durable append-only
record: exactly one caller can create or transition the lease from `available`
to `claimed`; all other claimants refuse. The immutable lease binds:

```text
run_id + capability + schema_version + request_digest
```

The lease is consumed exactly once and cannot be recreated after timeout,
refusal, process failure, response ambiguity, or a second worker. Concurrency
is one, retries are zero, and timeout is 30 seconds.

Before every live transmission, the exact `budget_ack` object above must be
present, custody-verified, fresh, and bound to the run, capability, and request
digest. One trusted coordinator UTC clock samples
`run_started_at_utc` at lease claim, `transmission_started_at_utc`
immediately before socket open, and `socket_opened_at_utc` at the actual socket
open. Each operational timestamp, including `acknowledged_at_utc`, must match
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$`, parse as a
real UTC instant, and obey
`run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <=
socket_opened_at_utc`. The acknowledgement must be no more than 60 seconds
old, and the socket must open strictly before `acknowledged_at_utc + 60
seconds`. Future, backward, or missing clock values are rejected. The
immutable lease binding is rechecked immediately before transmission, the
lease is consumed before the socket opens, and neither lease nor
acknowledgement can be reused. This contract has no provider-side or
account-level enforcement alternative. A client-side reservation alone cannot
prevent post-call overcharge and is not sufficient authorization.

Any cost must be a finite non-negative JSON number, exact literal currency
`USD`, and amount `<= 0.01`. Missing `cost`, `amount`, or `currency` is a
terminal hold/evidence hold with reason `R13`; a present string, NaN, Infinity,
negative, non-USD, malformed, extra-field, unauthorized, or over-cap cost is
a refusal/evidence refusal with reason `R13`.

Run and evidence transitions are append-only. Once `complete`, `refused`, or
`hold` is recorded, it cannot be retried, reopened, overwritten, or converted
by a later worker. A hold is terminal, non-consumable, and non-retryable
pending coordinator disposition; it cannot be passed to a consumer or used as
replay authority.

## Closed recommendation and independent authorization

The only consumer is `support-triage-advisory-v1`. Its closed object is
exactly:

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

The application must validate this object, then pass it through an independent
application-owned authorization gate before any effect. Unknown fields or
injected `command`, `capability_token`, `recipients`, `effect`, `route`,
`escalate`, `spend`, or `mutation` fields refuse. Negative tests must prove
that the object cannot directly authorize a command, route, escalation, spend,
recipient, or state mutation.

## Refusal matrix

| Refusal ID | Condition | Status | Required disposition |
|---|---|---|---|
| R01 | Caller supplies or overrides endpoint, method, body, `Host`, `:authority`, `Authorization`, content headers, transfer headers, proxy target, or redirect policy. | `refused` | Refuse before transmission; caller transport fields have no authority. |
| R02 | Method, final TLS origin, host, path, certificate, hostname, or chain differs from the immutable capability transport. | `refused` | Refuse; no origin substitution or weakened validation. |
| R03 | Redirect is returned or attempted. | `refused` | Refuse; redirects are disabled and never followed. |
| R04 | Non-2xx status, missing/non-JSON content type, DNS/connectivity/transport failure, TLS failure, decompression failure, truncation, invalid UTF-8, or response body over 65,536 bytes. | `refused` | Refuse before parse or persistence. |
| R05 | Exact transmitted request body differs from the measured UTF-8 body, or request body exceeds 65,536 bytes. | `refused` | Refuse before or during transmission; no body rewrite. |
| R06 | Capability key is absent, changed, or belongs to another surface. | `refused` | Refuse; do not infer ownership. |
| R07 | Requested identity is missing, changed, aliased, normalized, or substituted. | `refused` | Refuse; never use `typesafe/jev-latest` or a served suffix as replacement. |
| R08 | Response requested identity does not exactly equal request identity. | `refused` | Refuse before consumption or replay. |
| R09 | After transport and request-identity checks, a provider-declared identity value is present but malformed or conflicting: `model` differs from `served_identity.model`, or a present provider response ID differs from `served_identity.response_id` or `response_id`. | `refused` | Refuse; served identity never becomes a D13 alias. Missing provider-declared identity metadata is `R12`. |
| R10 | Schema, envelope, JSON, duplicate-key, extra-field, question, criteria, answer, confidence, type, or present `server_timestamp_utc` parsing validation fails. | `refused` | Refuse; no coercion, repair, or partial answer set. |
| R11 | Choice distribution differs from total 1 by more than absolute `1e-12`, or has invalid keys/probabilities. | `refused` | Refuse; no repair, clamping, or renormalization. |
| R12 | After transport and request-identity checks, the provider did not declare one or more required complete metadata fields: `model`, `response_id`, or `server_timestamp_utc`. | `hold` | Terminal hold with the class-prefixed `R12` code; client-supplied values cannot fill a missing provider declaration. |
| R13 | A live result is missing the `cost` object, `amount`, or `currency`. | `hold` | Deterministic terminal hold with the class-prefixed `R13` code; never mark complete, estimate, or convert. |
| R13 | A present cost object is malformed, has an extra field, uses a string/NaN/Infinity/negative/over-cap `amount`, uses non-USD `currency`, or is otherwise unauthorized. | `refused` | Deterministic refusal with the class-prefixed `R13` code; never repair, estimate, or convert. |
| R14 | After a first invocation successfully claims the correctly bound lease, the mandatory `budget_ack` is missing, malformed, stale, mutable, custody-unverified, non-USD, over-cap, future, backward-clock, expired, or already consumed/reused. | `hold` | Terminal hold before transmission; client reservation alone is insufficient. A reused acknowledgement on a retry is `R16` by precedence. |
| R15 | The invocation is not an `R16` retry/concurrency attempt and `run_id` or the CAS/create-if-absent lease is missing, unavailable, or contested by another claimant. | `hold` | Terminal hold with the class-prefixed `R15` code; no call. |
| R16 | A second, concurrent, or retry invocation is attempted for a run whose lease is already in flight, consumed, or terminal, including timeout recovery after consume-before-socket; or a supplied lease token is duplicated or bound to the wrong run, capability, schema version, or request digest. | `refused` | Terminal refusal; this row is evaluated before `R15` and `R14`, and an append-only lease cannot be recreated or reopened. |
| R17 | JCS canonical bytes or paired request/response digest is missing, malformed, recomputed differently, or identity-unbound. | `refused` | Refuse replay or evidence acceptance. |
| R18 | Provenance object is non-canonical, contains a field outside its closed schema, has missing/wrong provenance digest, or uses a non-JCS hash procedure. | `refused` | Refuse replay and evidence acceptance. |
| R19 | Fixture repository/ref/path/commit/tree or the independent coordinator manifest receipt/resolution is missing, unverified, mutable, non-resolving, unapproved, or differs across the wrapper/provenance/manifest-entry/receipt custody tuples. | `hold` | Emit only generic `evidence:R19` `hold-record` with `disposition: "pending-coordinator"`; do not emit a `sanitized-replay-fixture` record. |
| R20 | Fixture is self-recomputed outside the committed manifest, detached from its paired digests, or current bytes differ from custody after receipt resolution. | `refused` | Emit generic `evidence:R20` `refusal-record`; no self-recomputed or mutable fixture acceptance. |
| R21 | After custody is resolved, non-complete provenance lacks the exact JSON string `"none"`, or complete response IDs are missing, one-sided, sentinel-valued, client-synthesized, or unequal; any requested-identity or source-kind/source-ref replay equality below is also unequal. | `refused` | Refuse the validated fixture with the class-prefixed `R21` code; complete fixture status is forbidden. Unresolved custody follows `R19` or `R18` as stated above. |
| R22 | Input contains any unknown field, free-text value, credential-bearing value, or value outside the fixed vocabulary, generated-ID grammar, finite custody allowlist, or numeric bounds, or minimization/redaction is uncertain. | `refused` | Refuse before serialization/transmission; retain no rejected input or metadata. |
| R23 | Fixture, metadata, source reference, log, or report contains a field outside its closed schema, a key, raw authorization header, unsafe payload, or exceeds retention limit. | `refused` | Refuse retention and consumption; do not echo material. |
| R24 | Consumer is not `support-triage-advisory-v1`, recommendation has unknown/effect fields, or independent application authorization is absent. | `refused` | Refuse; application retains all authority and effects. |
| R25 | Any parent RCM, boundary-routing, standard routing, Pi, HAWF, Helmholtz, GMF, or other forbidden surface is requested. | `refused` | Refuse and stop for coordinator review; no shared-surface mutation. |

Every refusal and hold is fail-closed. No path may silently alias, retry,
downgrade, substitute, route, escalate, spend, persist unsafe material,
reopen a terminal record, or mutate state.

## Review gate

Before any Gate 3 request, two independent fresh frontier reviewers must review
this boundary and the companion contract. Their reports must separately address
cost typing/currency, JCS provenance and custody, exact transport authority and
transmitted bytes, atomic lease/budget/terminal state, privacy minimization and
retention, authenticated served-identity binding, refusal completeness,
recommendation allowlisting and independent authorization, and parent-surface
collision. Findings are coordinator-triaged; the builder does not self-approve.
