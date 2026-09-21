# JEV-P0 — Evidence boundary and refusal matrix

## Evidence authority classes

JEV evidence is classified before it can be consumed:

| Class | What it proves | What it cannot prove |
|---|---|---|
| `live-observation` | A later explicitly authorized bounded run observed an authenticated provider response and recorded safe metadata. | Replay authority, standard catalog eligibility, D13 eligibility, general service health, or routing approval. |
| `sanitized-replay-fixture` | A sanitized request/response pair can be validated deterministically against `jev-decisions/v1` and its recorded JCS digests. | That a fresh live-call origin occurred or that the provider is currently available, unless its approved provenance explicitly establishes that origin; it also cannot prove that a live call is authorized. |
| `refusal-record` | A bounded check refused a named condition and did not proceed. | A successful provider result, a retry authorization, or permission to weaken the refusal. |
| `hold-record` | A required fact is missing or unsafe, so the result is terminally non-consumable pending coordinator disposition. | Permission to retry, estimate, normalize, reopen, or consume the held result. |

A live observation is never replay authority. Replay requires a distinct,
sanitized, provenance-tagged fixture with paired JCS digests, immutable
manifest custody, and explicit requested/served identity binding. Evidence
status must say whether a record is an observation, replayable evidence,
refusal, or hold; these states must not be collapsed.

Logs and review reports are not evidence surfaces. They must never contain
credentials, raw authorization headers, unsafe payloads, or rejected sensitive
input. They are outside `R23`'s evidence-wrapper classification and are not
serialized or retained as evidence records.

## Closed reason-code and status partition

The `R01`–`R25` values below are condition suffixes, not complete serialized
codes. Complete records use only `reason_code: "none"`. A pre-call refusal or
hold uses only the generic `refusal-record` or `hold-record` class and the
`evidence:Rnn` prefix. A class-specific live or fixture refusal/hold code is
invalid. Each condition has exactly one status under the following authoritative
closed partition:

| Status class | Reason suffixes and rule |
|---|---|
| Generic refusal-record | `evidence:R01`–`evidence:R11`, `evidence:R13`, `evidence:R16`–`evidence:R18`, `evidence:R20`, and `evidence:R21`–`evidence:R25`; the named invalid, unsafe, retry, custody, or forbidden condition is `refused`. R20 is reserved exclusively to this class. |
| Generic hold-record | `evidence:R12`–`evidence:R15` and `evidence:R19`; the missing, stale, unverified, or coordinator-pending condition is `hold` with `disposition: "pending-coordinator"`. Missing cost is `R13` hold, while present malformed or unauthorized cost is `R13` refusal. |
| Complete | `reason_code: "none"` only; complete is permitted only for `live-observation` with an authenticated provider response or `sanitized-replay-fixture` with resolved custody. |
| Explicit split | `R09`: present, validly shaped but conflicting served-model/identity metadata is `refused`; `R10`: malformed or unparseable present response fields are `refused` with precedence over R09 and never covers missing provider metadata; `R12`: missing provider-declared complete metadata is `hold` only; `R13`: missing cost fields are generic hold, while a present malformed or unauthorized cost is generic refusal; `R21`: the post-custody replay identity/provenance equality failure is generic refusal. |

The split rows are mutually exclusive as written and take precedence over any
general fail-closed wording. The detailed pre-call table below is the sole
decision rule: evaluate exactly `R16`, then `R15`, then `R14`; a CAS loss to an
existing in-flight owner is `R16`, never `R15`, and no caller may choose a
status. A complete record always uses `reason_code: "none"`.

## Exact evidence-class and status field sets

Each record below is a closed JSON object. The listed required set is the
complete set: every field name not listed for that record is forbidden. A
missing listed field, an extra field, a wrong literal, or a wrong conditional
value refuses. `live-observation` exists only as a `complete` record for an
attempted call that received an authenticated provider response. Pre-call
refusal/hold is represented only by the generic `refusal-record` or
`hold-record`; those records deliberately carry no run, lease, budget, or
operational live-call fields.

### `live-observation`

`live-observation` with `status: complete` has exactly this required field set:

```text
evidence_class, capability, run_id, lease_id, endpoint,
requested_identity, served_identity, schema_version, response_id,
server_timestamp_utc, client_timestamp_utc, run_started_at_utc,
acknowledged_at_utc, transmission_started_at_utc, socket_opened_at_utc,
request_digest, response_digest, usage, cost, budget_ack, source_kind,
source_ref, status, reason_code, retention_until_utc
```

Its exact conditional values are `evidence_class: "live-observation"`,
`capability: "openrouter-alpha-decisions"`, `endpoint` equal to the immutable
capability endpoint, `schema_version: "jev-decisions/v1"`,
`source_kind: "coordinator-live" | "provider-response"`, `status: "complete"`,
and `reason_code: "none"`. `response_id` and `server_timestamp_utc` are
provider-declared, match their exact field grammars, and are bound to the same
authenticated response;
`served_identity.model` is exactly the authenticated response `model`, and
`served_identity.response_id` is exactly that response's identifier. The
requested model is never a fallback. `lease_id`, `run_id`, capability, and
`request_digest` equal the exact consumed lease record; live `schema_version`
equals both lease-record `decision_schema_version` and
`budget_ack.decision_schema_version`, all exactly `jev-decisions/v1`. The
`budget_ack` carries the same `lease_id`, `run_id`, capability, and request digest.
The internal claim and consume transitions therefore bind this wrapper by exact
`lease_id` and binding equality; they are not emitted evidence records. The
`run_started_at_utc`, `transmission_started_at_utc`, and `socket_opened_at_utc`
fields are coordinator runtime/live-record samples; only
`budget_ack.acknowledged_at_utc` is the single freshness value; the top-level
`live-observation.acknowledged_at_utc` is a required exact-equality mirror, and
divergent duplicates are invalid. All four operational fields use the one exact
UTC grammar and satisfy:

```text
run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <= socket_opened_at_utc
transmission_started_at_utc - acknowledged_at_utc <= 60 seconds
socket_opened_at_utc < acknowledged_at_utc + 60 seconds
```

The `cost` field is exactly the two-field object
`{ amount: <finite non-negative JSON number <= 0.01>, currency: "USD" }`;
no cost field is omitted or added, and `currency` is exactly `USD`. There is
no `live-observation` refused or hold variant; a failed pre-call is never
called an observation.

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

Only `sanitized-replay-fixture` with `status: complete` is permitted. Generic
`refusal-record` and `hold-record` objects carry no fixture provenance and use
only their exact generic field sets and `evidence:Rnn` codes. In particular,
`R20` is reserved exclusively to generic `evidence:R20` refusal records.

### `refusal-record` and `hold-record`

`refusal-record` has exactly this required field set:

```text
evidence_class, status, reason_code, source_kind, source_ref,
recorded_at_utc, retention_until_utc
```

Its exact values are `evidence_class: "refusal-record"`,
`status: "refused"`, `source_kind: "coordinator-review"`, and
`reason_code` is one of `evidence:R01`–`evidence:R11`, `evidence:R13`,
`evidence:R16`–`evidence:R18`, `evidence:R20`, or `evidence:R21`–
`evidence:R25`. `disposition`, request/response fields, custody fields,
identities, cost, usage, budget fields, run/lease fields, and operational live
timestamps are forbidden. `evidence:R20` is reserved exclusively to this
record.

`hold-record` has exactly this required field set:

```text
evidence_class, status, reason_code, disposition, source_kind, source_ref,
recorded_at_utc, retention_until_utc
```

Its exact values are `evidence_class: "hold-record"`, `status: "hold"`,
`disposition: "pending-coordinator"`, `source_kind: "coordinator-review"`,
and `reason_code` is one of `evidence:R12`–`evidence:R15` or `evidence:R19`.
Request/response fields, custody fields, identities, cost, usage, budget fields,
run/lease fields, and operational live timestamps are forbidden.

Every complete record requires the exact complete set above; every refused or
held pre-call record requires its exact generic set above. No record may move
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
  `recorded_at_utc`, `resolved_at_utc`, `retention_until_utc`,
  `run_started_at_utc`, `acknowledged_at_utc`, `transmission_started_at_utc`,
  and `socket_opened_at_utc` all match the one exact UTC grammar
  `^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` and must
  be real UTC instants. The retention anchor is coordinator-sampled
  from the trusted capture/recording clock: for a live observation,
  `client_timestamp_utc` is the coordinator-recorded capture timestamp, not an
  arbitrary caller wall clock; `captured_at_utc` is the anchor for replay
  fixtures; and `recorded_at_utc` is the anchor for generic refusal/hold
  records. A future anchor relative to that coordinator clock is rejected, and
  the exact invariant is
  `anchor_utc <= retention_until_utc <= anchor_utc + 90 days`.
- The operational freshness fields are coordinator/live-record fields except
  `acknowledged_at_utc`, whose single value is owned by `budget_ack` and mirrored
  exactly at the top level of a live observation. Every repeated
  operational section must state the exact order `run_started_at_utc <=
  acknowledged_at_utc <= transmission_started_at_utc <= socket_opened_at_utc`;
  the acknowledgement age remains at most 60 seconds at transmission, and the
  socket-open sample must be strictly before `acknowledged_at_utc + 60 seconds`.
- `request_digest`, `response_digest`, `provenance_digest`, and
  `acknowledgement_digest` are exactly 64 lowercase hexadecimal characters
  matching `^[0-9a-f]{64}$`; `capability`, `schema_version`, and `endpoint` are
  the exact literals defined by the contract; and `currency` is exactly `USD`
  wherever it appears.
- `evidence_class` is exactly `live-observation`,
  `sanitized-replay-fixture`, `refusal-record`, or `hold-record`; `status` is
  exactly `complete`, `refused`, or `hold`; and `reason_code` is `none` for
  complete records. Non-complete records use only the generic prefixes and
  suffixes permitted by the closed status partition: refusal-record uses
  `evidence:R01`–`evidence:R11`, `evidence:R13`, `evidence:R16`–`evidence:R18`,
  `evidence:R20`, and `evidence:R21`–`evidence:R25`; hold-record uses
  `evidence:R12`–`evidence:R15` and `evidence:R19`; no class-specific status
  code is valid.

The four class/status field sets above are the complete wrapper schema. Unknown
wrapper metadata, free-text reasons, unbounded numbers, human-chosen IDs, or
values outside the finite literal allowlists refuse and are not retained.
R23 applies only to these explicitly defined closed evidence-wrapper schemas
and the closed `live-observation`, `sanitized-replay-fixture`, `refusal-record`,
and `hold-record` retained-record schemas in this document. No unbounded log or
report object is an evidence surface or may be classified by R23.

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
  lease_id: <lease ID grammar above>,
  run_id: <run ID grammar above>,
  capability: "openrouter-alpha-decisions",
  decision_schema_version: "jev-decisions/v1",
  request_digest: <64 lowercase hex characters>
}
```

`account_ref` is generated by the exact hexadecimal grammar; it is not an
account name, email, URL, customer identifier, or free text. `cap_amount` must be the finite
JSON number `0.01`, not a string or another numeric value. The
`acknowledgement_digest` is SHA-256 over the RFC 8785/JCS UTF-8 bytes of this
object with `acknowledgement_digest` omitted, and its custody repository/ref/
path/commit/tree must be verified at the exact committed tree. The
acknowledgement is valid only when its `lease_id`, `run_id`, capability,
`decision_schema_version`, and `request_digest` exactly equal the corresponding
fields in the live durable lease record and live wrapper. A syntactically
valid arbitrary `lease_id` is insufficient. The `budget_ack` owns the single
freshness value `acknowledged_at_utc`; the top-level live-observation field is
only its exact-equality mirror. It does not own `run_started_at_utc`,
`transmission_started_at_utc`, or `socket_opened_at_utc`. Those three are
coordinator runtime/live-record samples. Freshness is checked using one trusted
coordinator UTC clock: `run_started_at_utc` is sampled at the claim event,
`transmission_started_at_utc` immediately before the socket is opened, and
`socket_opened_at_utc` at the actual socket open. All four operational fields,
including `acknowledged_at_utc`, are mandatory on a complete live observation,
use the exact UTC grammar above, and must satisfy
`run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <=
socket_opened_at_utc`.
The acknowledgement must be at most 60 seconds old at transmission and expires
at `acknowledged_at_utc + 60 seconds`; the socket must open strictly before
that expiry. A future timestamp, backward or missing trusted-clock sample,
acknowledgement before run start, or reached expiry is rejected.

Immediately before transmission, the exact durable lease record and immutable
lease binding (`lease_id`, `run_id`, capability, `decision_schema_version`, and
`request_digest`) are rechecked for exact equality against the custody-verified
acknowledgement and live record, including exact equality of every named lease
field. The top-level
`live-observation.acknowledged_at_utc` must equal
`budget_ack.acknowledged_at_utc` exactly, and that one value is used for
freshness. The lease is atomically consumed before the socket opens. The consumed lease and acknowledgement cannot
authorize another call; queueing, retry, recreation, or reuse after validation
is rejected.

The exact `budget_ack` object in this closed schema is required before every
live call. There is no direct provider-side or account-level enforcement
alternative in this contract. A client-only reservation is not enough because
it cannot prevent post-call overcharge. Missing, mismatched, stale, mutable,
unverified, future, backward-clock, expired, or reused acknowledgement is a
terminal hold before transmission. A pre-call refusal or hold record does not
carry these operational timestamps, `lease_id`, `run_id`, or `budget_ack`;
those fields are forbidden by the generic record schemas.

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
  source_kind: "sanitized-fixture",
  source_ref: <string matching ^src-[0-9a-f]{32}$>,
  captured_at_utc: <timestamp matching the exact UTC grammar above>,
  authenticated_response_id: <non-empty provider response_id matching ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$>,
  manifest_id: <string matching ^manifest-[0-9a-f]{32}$>,
  repository: "agent-skills",
  ref: "main" | "codex/jev-p0-contract" | "codex/jev-p1-typed-validator-and-fixture-replay",
  path: <one of the finite approved repository-relative custody paths>,
  manifest_commit: <verified commit SHA>,
  manifest_tree: <verified tree SHA>
}
```

This is the only valid stored fixture provenance object. The other
`source_kind` literals allowed by live or generic evidence records are not
values of this object; any internal or operational shape using them is not a
fixture provenance object and cannot be stored as one.
`authenticated_response_id` is never `none` and is never client-synthesized.

`provenance_digest` is SHA-256 over the RFC 8785/JCS UTF-8 bytes of exactly
this canonical provenance object. The digest procedure is the same strict
parse/JCS/UTF-8/hash procedure above, and the provenance object is hashed
without adding transport headers, credentials, fields outside the closed
schema, or mutable timestamps.

Generic refusal/hold records have no fixture provenance fields. In a complete
`sanitized-replay-fixture`, `provenance.authenticated_response_id` is required
to be a non-empty provider response ID, never `none`, and the complete-fixture
equality is exact:

```text
fixture.response_id
  == fixture.response.response_id
  == fixture.served_identity.response_id
  == fixture.provenance.authenticated_response_id
```

All four values are provider-declared. After custody is resolved, missing,
one-sided, empty, sentinel, or client-synthesized values are structural or
recognized-value failures (`evidence:R23` or `evidence:R22`), never `R21`; a
present, validly shaped but unequal value is an explicit generic
`refusal-record` with `evidence:R21`. Unresolved custody follows the generic
`evidence:R19` hold path. The provenance value may not be synthesized from a
requested identity, fixture filename, manifest entry, or client-generated
identifier.

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
retention_until_utc: <timestamp matching the exact UTC grammar above and the bounded retention invariant>
```

`manifest_entry` is exactly the object shown above, recursively: its complete
field set is `schema_version`, `manifest_id`, `fixture_id`, `repository`,
`ref`, `path`, `commit`, `tree`, `request_digest`, `response_digest`, and
`provenance_digest`, with no extra fields and no extra nested objects, arrays,
or fields. Unknown nested fields are `R23`. Its `repository`, `ref`, `path`,
`commit`, and `tree` fields are custody-tuple fields owned only by `R20`; the
other listed fields are non-custody semantic fields.

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
above is required and exact. Any split-brain mismatch refuses custody. Before
the immutable custody tuple resolves, missing, unverified, or non-resolving
coordinator custody after structural and recognized-value validation plus
repository/ref/path allowlist success is `R19` only. Invalid ref/path values
are `R22`. After it resolves, any mismatch between
committed fixture bytes/tree and the resolved custody tuple or manifest-entry
custody, including a mismatch among the wrapper/provenance/manifest-entry/
receipt custody fields, is exclusively `R20`.
Mutable working-tree files, uncommitted fixtures, detached copies, missing
manifest entries, self-recomputed manifest entries, or changed digest pairs
are not trusted custody and refuse replay.

Complete replay equality is field-for-field and is not satisfied by a matching
top-level digest alone. After `R17` and `R20` pass, evaluate `R21` for a
present, validly shaped, non-empty, non-sentinel value that is unequal in the
finite path set below. The set is exactly these paths:
`fixture.evidence_class`, `fixture.fixture_id`, `fixture.manifest_id`,
`fixture.schema_version`, `fixture.requested_identity`,
`fixture.served_identity`, `fixture.served_identity.response_id`,
`fixture.response_id`, `fixture.server_timestamp_utc`, `fixture.request`,
`fixture.request.schema_version`, `fixture.request.requested_identity`,
`fixture.request_digest`, `fixture.response`,
`fixture.response.schema_version`, `fixture.response.requested_identity`,
`fixture.response.served_identity`,
`fixture.response.served_identity.response_id`,
`fixture.response.response_id`, `fixture.response.server_timestamp_utc`,
`fixture.response_digest`, `fixture.provenance.fixture_id`,
`fixture.provenance.manifest_id`, `fixture.provenance.source_kind`,
`fixture.provenance.source_ref`, `fixture.provenance.captured_at_utc`,
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
`fixture.manifest_id == fixture.provenance.manifest_id ==
fixture.manifest_entry.manifest_id`;
`fixture.fixture_id == fixture.provenance.fixture_id ==
fixture.manifest_entry.fixture_id`;
`fixture.requested_identity == fixture.request.requested_identity ==
fixture.response.requested_identity`;
`fixture.served_identity == fixture.response.served_identity`;
`fixture.served_identity.response_id ==
fixture.response.served_identity.response_id`;
`fixture.response_id == fixture.response.response_id ==
fixture.served_identity.response_id ==
fixture.response.served_identity.response_id ==
fixture.provenance.authenticated_response_id`;
`fixture.server_timestamp_utc == fixture.response.server_timestamp_utc`;
`fixture.source_kind == fixture.provenance.source_kind`;
`fixture.source_ref == fixture.provenance.source_ref`;
`fixture.request_digest == SHA256(JCS-UTF8(fixture.request)) ==
fixture.manifest_entry.request_digest`;
`fixture.response_digest == SHA256(JCS-UTF8(fixture.response)) ==
fixture.manifest_entry.response_digest`; and
`fixture.provenance_digest == SHA256(JCS-UTF8(fixture.provenance)) ==
fixture.manifest_entry.provenance_digest`.

`fixture.request` and `fixture.response` are compared as the exact closed
request and response envelope objects defined by this contract, with the
nested paths listed above compared at their exact values. The singleton paths
`fixture.evidence_class`, `fixture.status`, and `fixture.reason_code` are
compared to their exact closed-schema literals. The path
`fixture.provenance.captured_at_utc` is compared byte-for-byte with the
coordinator-approved canonical provenance capture timestamp for this fixture
and is the retention anchor:
`fixture.provenance.captured_at_utc <= fixture.retention_until_utc <=
fixture.provenance.captured_at_utc + 90 days`. The path
`fixture.retention_until_utc` is compared using that exact invariant. All
listed identity, timestamp, digest, ID, source, object, string, number, and
array comparisons are exact and case-sensitive. Repository/ref/path/commit/
tree and `fixture.manifest_entry.repository/ref/path/commit/tree` are
custody-tuple paths owned only by `R20`; request/response digest computation
failures belong only to `R17`; provenance digest procedure failures belong
only to `R18`. A missing, one-sided, empty, sentinel, or invalid listed value
is `R23` or `R22`, never `R21`.

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
  resolved_at_utc: <timestamp matching the exact UTC grammar above>
}
```

The coordinator receipt/resolver is the independent trust anchor: it resolves
the exact `manifest_id`, `fixture_id`, repository, ref, path, commit, tree,
request digest, response digest, and provenance digest from its controlled
record, then returns the closed receipt above. Missing receipt, missing
resolution, unknown fields, duplicate fields, wrong authority/version, or a
source that is unverified or non-resolving is assigned by the ordered custody
stages above: structural violations are `evidence:R23`, invalid ref/path and
other recognized value violations are `evidence:R22`, and only when both pass
does missing, unverified, or non-resolving coordinator custody after
repository/ref/path allowlist success and before a resolved immutable tuple
become `evidence:R19` hold. After resolution, a
custody mismatch is `evidence:R20`; only post-custody canonical provenance
JCS/digest/procedure failure is `evidence:R18` refusal.
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

Each live run requires a coordinator-issued `run_id`, a coordinator-generated
`lease_id`, an atomic durable single-call lease, and a pre-call reservation for
the full `$0.01 USD` cap. The canonical lease state machine is:

```text
available       = no durable lease record exists
claimed event   = successful CAS/create-if-absent creates state in-flight
in-flight       -- atomic consume-before-socket --> consumed
consumed        -- completion or terminal refusal/hold --> terminal
```

`available` is absence, not a stored state. `claimed` is only the event that
creates `in-flight`, never a state. The closed internal durable lease record is:

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

No other internal record field is permitted. The generated `run_id` and
`lease_id` grammars, 64-lowercase-hexadecimal `request_digest`, exact
`capability: "openrouter-alpha-decisions"` and
`decision_schema_version: "jev-decisions/v1"` literals, exact state set, and
`transition_actor: "coordinator"` are mandatory. Each present transition
timestamp is written once by the coordinator and cannot be rewritten. For a
complete `live-observation`, the immutable transition-time bindings are:

```text
lease_record.claimed_at_utc == live_observation.run_started_at_utc
lease_record.consumed_at_utc == live_observation.transmission_started_at_utc
```

`terminal_at_utc` may remain internal-only and is not represented in live
evidence; generic refusal/hold records carry no lease transition fields. Claim
and consume artifacts are internal transitions of this same durable record,
not a new external evidence class; they are never emitted as JEV evidence
records. No transition reopens, overwrites, or recreates a run. A syntactically
valid token without its exact record is not a fresh lease. The live wrapper and `budget_ack`
must equal the record's exact `lease_id`, `run_id`, capability,
`decision_schema_version`, and `request_digest`. A losing concurrent invocation
does not mutate the owner record. Concurrency is one, retries are zero, and
timeout is 30 seconds.

Before every live transmission, the exact `budget_ack` object above must be
present, custody-verified, fresh, and bound by exact equality to the exact
durable record's `lease_id`, `run_id`, capability, decision schema version, and
request digest; the live wrapper carries those same equal fields. One trusted coordinator UTC clock samples `run_started_at_utc` at the
claim event, `transmission_started_at_utc` immediately before socket open, and
`socket_opened_at_utc` at the actual socket open. `budget_ack` owns the single
freshness value `acknowledged_at_utc`; the live wrapper's same-named field must
equal it exactly, and the other three are runtime/live-record samples. Each
operational timestamp must match the exact UTC grammar above, be a real UTC
instant, and obey
`run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <=
socket_opened_at_utc`. The acknowledgement must be no more than 60 seconds
old, and the socket must open strictly before `acknowledged_at_utc + 60
seconds`. Future, backward, or missing clock values are rejected. The
immutable lease-record binding is rechecked immediately before transmission,
the lease is consumed before the socket opens, and neither lease nor
acknowledgement can be reused. Completion or terminal refusal/hold then records
`consumed -> terminal`. This contract has no provider-side or account-level
enforcement alternative. A client-side reservation alone cannot prevent
post-call overcharge and is not sufficient authorization.

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

## Closed response-metadata status partition

After transport and request-identity checks, evaluate provider-declared
complete metadata in this order. `model` must match
`^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$`; `response_id` must match
`^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`; and `server_timestamp_utc` must match
`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$` and be a
real UTC instant. The rows are closed and exclusive:

| Evaluation order | Reason | Disjoint predicate | Outcome |
|---|---|---|---|
| 1 | R12 | One or more provider-declared complete metadata fields (`model`, `response_id`, or `server_timestamp_utc`) is missing. Missing `server_timestamp_utc` belongs here. | `hold` |
| 2 | R10 | All required metadata fields are present, but any present response field is malformed or unparseable under its exact grammar, including malformed `model`, malformed `response_id`, or unparseable `server_timestamp_utc`. This row has precedence over R09. | `refused` |
| 3 | R09 | All required metadata fields are present and individually valid under their exact field grammars, but authenticated response `model` conflicts with `served_identity.model`, or the provider response identifier conflicts with `served_identity.response_id` or `response_id`. | `refused` |

R12 owns only missing provider declarations. R10 owns malformed or unparseable
present response fields. R09 owns only present, validly shaped, conflicting
served-model or identity values; malformed values never enter R09. No condition
belongs to two rows.

## Closed pre-call lease-state decision table

Observe the invocation signal, exact same-run lease record, CAS/create-if-absent
result, and budget acknowledgement. Evaluate exactly R16, then R15, then R14;
the caller cannot select a row:

| Evaluation order | Reason | Disjoint observable predicate | Outcome |
|---|---|---|---|
| 1 | R16 | An explicit retry, second, or concurrent invocation is observed; an existing same-run durable lease record is in `in-flight`, `consumed`, or `terminal`; a supplied token is duplicated, unrecognized, or bound to the wrong run, capability, schema version, request digest, or lease record; or CAS/create-if-absent loses to an existing `in-flight` owner. Every R16 state or token is excluded from R15. | `refused` |
| 2 | R15 | This is a first invocation with no R16 predicate, no existing same-run `in-flight`, `consumed`, or `terminal` record, and no successful fresh record, because `run_id` is missing or the lease service is unavailable or unobservable. | `hold` |
| 3 | R14 | After a fresh `in-flight` record is successfully created and its `lease_id`, run, capability, decision schema version, request digest, and binding are exact, `budget_ack` is missing, malformed, stale, reused, mutable, custody-unverified, future, backward-clock, expired, over-cap, non-USD, or otherwise invalid. | `hold` |

Each condition belongs to one row. For R14, the invalid acknowledgement causes
the fresh record to finalize through `in-flight -> consumed -> terminal`
without opening a socket. A first invocation with no observed
`in-flight`, `consumed`, or `terminal` record is R15 only when the row's
missing/unavailable predicates hold; a CAS loss to an existing `in-flight`
owner is R16. R14, R15, and R16 are mutually exclusive, all R16 states and
tokens are excluded from R15, and their statuses are fixed by the table.

## Ordered custody reason-code precedence

Custody reasons are assigned by first failing validation stage, in this exact
order; validation stops at that stage, and a combined violation is owned by
the first failing stage rather than being ambiguous:

1. First structurally scan the recognized closed evidence-wrapper and
   retained-record schemas defined in this document. An unknown/extra field,
   raw authorization header, unsafe payload, or structural retention/schema
    violation is generic `evidence:R23` and stops validation. R23 applies only
    to those explicitly defined closed schemas; no unbounded log or report
    object is an evidence surface or may be classified by R23. Logs and review
    reports are outside R23's evidence-wrapper classification and must never
    contain credentials, raw authorization headers, unsafe payloads, or
    rejected sensitive input.
2. Only when the structural scan passes, validate recognized field values. A
   finite vocabulary, repository/ref/path allowlist, generated-ID grammar,
   numeric bound, or minimization/redaction uncertainty is generic
   `evidence:R22` and stops validation. Therefore a combined structural and
   value violation is `R23`, never `R22`; neither pre-custody reason is `R19`
   or `R18`.
3. Only after both pre-custody stages pass, resolve immutable custody.
   Missing, unverified, or non-resolving coordinator custody after structural
   and recognized-value validation plus repository/ref/path allowlist success,
   but before a resolved immutable custody tuple exists, is generic
   `evidence:R19` hold. Invalid ref/path values are `R22`; once the immutable
   custody tuple resolves, no custody mismatch is `R19`.
4. Only after custody and the defined outer schemas pass, a canonical
   provenance JCS, digest, or procedure failure is generic `evidence:R18`
   refusal. `R18` does not own generic out-of-schema fields; `R23` owns those.
5. Only after `R18` passes, evaluate `R17` solely for present, validly shaped
   request/response JCS canonical-byte or paired digest inputs whose
   canonicalization, computation, or reproducibility fails. `R17` does not own
   identity equality or custody-byte/tree/manifest-entry mismatches. The
   structural stage owns absent fields as `R23`; the recognized-value stage
   owns out-of-grammar values as `R22`.
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
    `fixture.served_identity`, `fixture.served_identity.response_id`,
    `fixture.response_id`, `fixture.server_timestamp_utc`, `fixture.request`,
    `fixture.request.schema_version`, `fixture.request.requested_identity`,
    `fixture.request_digest`, `fixture.response`,
    `fixture.response.schema_version`, `fixture.response.requested_identity`,
    `fixture.response.served_identity`,
    `fixture.response.served_identity.response_id`,
    `fixture.response.response_id`, `fixture.response.server_timestamp_utc`,
    `fixture.response_digest`, `fixture.provenance.fixture_id`,
    `fixture.provenance.manifest_id`, `fixture.provenance.source_kind`,
    `fixture.provenance.source_ref`, `fixture.provenance.captured_at_utc`,
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
    `fixture.manifest_id == fixture.provenance.manifest_id ==
    fixture.manifest_entry.manifest_id`;
    `fixture.fixture_id == fixture.provenance.fixture_id ==
    fixture.manifest_entry.fixture_id`;
    `fixture.requested_identity == fixture.request.requested_identity ==
    fixture.response.requested_identity`;
    `fixture.served_identity == fixture.response.served_identity`;
    `fixture.served_identity.response_id ==
    fixture.response.served_identity.response_id`;
    `fixture.response_id == fixture.response.response_id ==
    fixture.served_identity.response_id ==
    fixture.response.served_identity.response_id ==
    fixture.provenance.authenticated_response_id`;
    `fixture.server_timestamp_utc == fixture.response.server_timestamp_utc`;
    `fixture.source_kind == fixture.provenance.source_kind`;
    `fixture.source_ref == fixture.provenance.source_ref`;
    `fixture.request_digest == SHA256(JCS-UTF8(fixture.request)) ==
    fixture.manifest_entry.request_digest`;
    `fixture.response_digest == SHA256(JCS-UTF8(fixture.response)) ==
    fixture.manifest_entry.response_digest`; and
    `fixture.provenance_digest == SHA256(JCS-UTF8(fixture.provenance)) ==
    fixture.manifest_entry.provenance_digest`.

    `fixture.request` and `fixture.response` are compared as the exact closed
    request and response envelope objects defined by this contract, with the
    nested paths listed above compared at their exact values. The singleton
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
    commit/tree and `fixture.manifest_entry.repository/ref/path/commit/tree`
    are custody-tuple paths owned only by `R20`; request/response digest
    computation failures belong only to `R17`; provenance digest procedure
    failures belong only to `R18`. A missing, one-sided, empty, sentinel, or
    invalid listed value is `R23` or `R22`, never `R21`.

The predicates are ordered and mutually exclusive:
`R23 -> R22 -> R19 -> R18 -> R17 -> R20 -> R21`. No digest-procedure failure
may be reclassified as `R20`, no resolved custody mismatch may be reclassified
as `R19`, and no `R21` semantic equality failure may absorb an `R17` or `R20`
failure.

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
| R09 | After transport and request-identity checks, all required provider-declared metadata is present and individually valid under their exact field grammars, but `model` conflicts with `served_identity.model`, or a provider response ID conflicts with `served_identity.response_id` or `response_id`. | `refused` | Refuse; served identity never becomes a D13 alias. Missing metadata is `R12`; malformed or unparseable present fields are `R10`. |
| R10 | Schema, envelope, JSON, duplicate-key, extra-field, question, criteria, answer, confidence, type, or any present response metadata field is malformed or unparseable, including malformed `model`, malformed `response_id`, or unparseable `server_timestamp_utc`. Missing provider metadata is explicitly excluded and belongs only to R12. This row has precedence over R09. | `refused` | Refuse; no coercion, repair, conflict reclassification, or partial answer set. |
| R11 | Choice distribution differs from total 1 by more than absolute `1e-12`, or has invalid keys/probabilities. | `refused` | Refuse; no repair, clamping, or renormalization. |
| R12 | After transport and request-identity checks, the provider did not declare one or more required complete metadata fields: `model`, `response_id`, or `server_timestamp_utc`. Missing `server_timestamp_utc` belongs only here. | `hold` | Terminal hold with generic `evidence:R12`; client-supplied values cannot fill a missing provider declaration. |
| R13 | A live result is missing the `cost` object, `amount`, or `currency`. | `hold` | Deterministic generic `evidence:R13` terminal hold; never mark complete, estimate, or convert. |
| R13 | A present cost object is malformed, has an extra field, uses a string/NaN/Infinity/negative/over-cap `amount`, uses non-USD `currency`, or is otherwise unauthorized. | `refused` | Deterministic generic `evidence:R13` refusal; never repair, estimate, or convert. |
| R14 | After a fresh `in-flight` record is successfully created and correctly bound, the mandatory `budget_ack` is missing, malformed, stale, reused, mutable, custody-unverified, non-USD, over-cap, future, backward-clock, expired, or otherwise invalid. | `hold` | Generic `evidence:R14` terminal hold before transmission; the single-use record is finalized without a socket. Any R16 state or token takes precedence. |
| R15 | This is a first invocation with no R16 predicate, no existing same-run `in-flight`, `consumed`, or `terminal` record, and no successful fresh record because `run_id` or the durable lease service is missing, unavailable, or unobservable. | `hold` | Generic `evidence:R15` terminal hold with no lease/run/budget fields; a CAS loss to an existing `in-flight` owner is R16, not R15. |
| R16 | An explicit retry, second, or concurrent invocation is observed; an existing same-run durable lease record is `in-flight`, `consumed`, or `terminal`; a supplied token is duplicated, unrecognized, or wrongly bound; or CAS/create-if-absent loses to an existing `in-flight` owner. | `refused` | Generic `evidence:R16` terminal refusal; this row is evaluated before `R15` and `R14`, and no lease can be recreated or reopened. |
| R17 | After `R23` then `R22`, `R19`, and `R18` pass, present, validly shaped request/response JCS canonical-byte or paired digest inputs fail canonicalization, computation, or reproducibility. This row does not classify identity equality or custody mismatch. | `refused` | Emit generic `evidence:R17` `refusal-record`; refuse replay or evidence acceptance. |
| R18 | After pre-custody validation, outer closed schemas, and immutable custody resolution pass, the canonical provenance object fails its canonical JCS, provenance-digest, or digest-procedure check. Generic out-of-schema fields are not R18. | `refused` | Emit only generic `evidence:R18` `refusal-record`; do not emit a `sanitized-replay-fixture` record. |
| R19 | After structural and recognized-value validation plus repository/ref/path allowlist success, coordinator custody is missing, unverified, or non-resolving before a resolved immutable custody tuple exists. Invalid ref/path values are `R22`; once custody resolves, no custody mismatch is R19. | `hold` | Emit only generic `evidence:R19` `hold-record` with `disposition: "pending-coordinator"`; do not emit a `sanitized-replay-fixture` record. |
| R20 | After `R17` passes and custody is resolved, any committed fixture bytes/tree mismatch with the resolved custody tuple or manifest-entry custody, including a mismatch among wrapper/provenance/manifest-entry/receipt custody fields. This row explicitly excludes every `R17` canonical-byte or digest-computation/procedure failure. | `refused` | Emit only generic `evidence:R20` `refusal-record`; no self-recomputed, mutable, or custody-mismatched fixture acceptance. |
| R21 | After `R17` and `R20` pass and custody is resolved, a present, validly shaped, non-empty, non-sentinel value is unequal at one of the exact finite paths and exact equality chains in the preceding R21 block. `fixture.provenance.captured_at_utc` uses the stated byte-for-byte coordinator-approved timestamp comparison and retention-anchor invariant. Repository/ref/path/commit/tree and `fixture.manifest_entry.repository/ref/path/commit/tree` belong only to `R20`; request/response digest computation failures belong only to `R17`; provenance digest procedure failures belong only to `R18`. A missing, one-sided, empty, sentinel, or invalid listed value is `R23` or `R22`, never `R21`. | `refused` | Emit only the generic `refusal-record` field set with `evidence:R21`; do not emit a `sanitized-replay-fixture` record. Unresolved custody follows `R19` as stated above. |
| R23 | Before custody resolution, first structurally scan the recognized closed evidence-wrapper or retained-record schemas defined in this parcel. An unknown/extra field, raw authorization header, unsafe payload, or structural retention/schema violation is R23 and stops validation. No unbounded log or report object is classified; logs and review reports are outside R23's evidence-wrapper classification and must never contain credentials, raw authorization headers, unsafe payloads, or rejected sensitive input. | `refused` | Emit only generic `evidence:R23` `refusal-record`; refuse retention and consumption and do not echo material. |
| R22 | Only when the R23 structural scan passes and before custody resolution, a recognized field value violates a finite vocabulary, repository/ref/path allowlist, generated-ID grammar, or numeric bound, or minimization/redaction is uncertain. A combined structural-and-value violation remains R23 because the first failing stage owns the result. | `refused` | Emit only generic `evidence:R22` `refusal-record`; refuse before serialization/transmission and retain no rejected input or metadata. |
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
