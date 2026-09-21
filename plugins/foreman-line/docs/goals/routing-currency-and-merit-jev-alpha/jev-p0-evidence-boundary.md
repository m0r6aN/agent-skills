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

## Minimum live-observation record

A complete live observation records only safe metadata and the result status:

| Field | Requirement |
|---|---|
| `evidence_class` | Literal `live-observation`. |
| `capability` | Literal `openrouter-alpha-decisions`. |
| `run_id` | Coordinator-issued immutable run identifier. |
| `lease_id` | Atomic single-call lease bound to `run_id`, capability, schema version, and request digest. |
| `endpoint` | Capability-owned immutable endpoint constant, never a caller-provided value. |
| `requested_identity` | Exact `openrouter / typesafe/jev-1.13 / alpha-decisions` tuple. |
| `served_identity.model` | Exact authenticated provider response field `model`; never client-synthesized. |
| `served_identity.response_id` | Exact authenticated provider response identifier. |
| `schema_version` | Literal `jev-decisions/v1`. |
| `response_id` | Mandatory provider response identifier for `status: complete`. |
| `server_timestamp_utc` | Mandatory parseable provider/server UTC timestamp for `status: complete`. |
| `client_timestamp_utc` | Client observation UTC timestamp. |
| `request_digest` | SHA-256 of RFC 8785/JCS UTF-8 canonical logical request bytes. |
| `response_digest` | SHA-256 of RFC 8785/JCS UTF-8 canonical logical response bytes when a response exists. |
| `usage` | Provider-reported usage fields, without secret-bearing payloads. |
| `cost` | `{ amount: <finite non-negative JSON number>, currency: "USD" }`, with `amount <= 0.01`. |
| `status` | `complete`, `refused`, or terminal `hold`, with a reason. |
| `retention_until_utc` | Required for retained safe metadata; no later than 90 days after capture. |

For `status: complete`, `response_id` and `server_timestamp_utc` are mandatory,
provider-declared, parseable, and bound to the same authenticated response.
Missing, unparseable, conflicting, or client-invented values produce a
terminal hold/refusal. A complete record also requires an authenticated
provider response whose `model` field equals `served_identity.model`; the
requested model is never a fallback.

Cost is valid only when its JSON representation is a number accepted as finite
and non-negative, its currency is exactly the literal `USD`, and its amount is
no greater than `0.01`. Strings, `NaN`, `Infinity`, negative numbers, missing
currency, non-USD currency, and over-cap amounts are terminal holds/refusals.

The record must not contain an API key, authorization header, secret, raw
credential-bearing request or response, unredacted provider payload, PII,
free-text input, or unbounded log excerpt. A boolean or status-only
authentication observation is the maximum permitted credential-related
evidence.

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

The canonical provenance object is closed and contains no PII:

```text
{
  fixture_id: <unique fixture identifier>,
  source_kind: <allowlisted non-secret source class>,
  source_ref: <opaque reviewable non-PII reference>,
  captured_at_utc: <parseable UTC timestamp>,
  authenticated_response_id: <provider response_id or explicit none>,
  manifest_id: <immutable manifest identifier>,
  manifest_commit: <verified commit SHA>,
  manifest_tree: <verified tree SHA>
}
```

`provenance_digest` is SHA-256 over the RFC 8785/JCS UTF-8 bytes of exactly
this canonical provenance object. The digest procedure is the same strict
parse/JCS/UTF-8/hash procedure above, and the provenance object is hashed
without adding transport headers, credentials, PII, or mutable timestamps.

For a complete fixture, `provenance.authenticated_response_id` is mandatory
and must equal `fixture.served_identity.response_id` exactly. Both values must
be present together; a missing, one-sided, or mismatched value is a terminal
hold/refusal. The provenance value may not be synthesized from a requested
identity, fixture filename, manifest entry, or client-generated identifier.

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
retention_until_utc: <bounded retention deadline>
```

Trusted custody means the exact repository, ref, path, manifest commit, and
manifest tree are verified; `fixture_id` resolves to the exact manifest entry
at that committed tree; the entry contains the exact paired request/response
digests and provenance digest; `provenance.authenticated_response_id` equals
`served_identity.response_id`; and current bytes match the committed bytes.
Mutable working-tree files, uncommitted fixtures, detached copies, missing
manifest entries, self-recomputed manifest entries, or changed digest pairs
are not trusted custody and refuse replay.

The fixture must include a negative identity-binding companion vector: changing
or deleting the provider response `model`, changing `response_id`, or
replacing served identity with a client fallback must make replay refuse.

Sanitization removes credentials, authorization headers, secret-bearing state,
PII, unsafe payloads, and unrelated provider data before retention. It must not
alter contract fields, identities, question criteria, answer values, or digest
inputs; if it would, the fixture is refused rather than presented as exact
replay. Raw request/response bodies, headers, authorization values, compressed
streams, and unredacted payloads have zero retention.

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

Before transmission, there must be provider-side or account-level hard budget
enforcement for `$0.01 USD`, or a recorded provider/account acknowledgement
that the cap is enforced for this run. A client-side reservation alone cannot
prevent post-call overcharge and is not sufficient authorization.

Any cost must be a finite non-negative JSON number, exact literal currency
`USD`, and amount `<= 0.01`. Missing, string, NaN, Infinity, negative,
non-USD, malformed, or over-cap cost is a terminal hold/refusal.

Run and evidence transitions are append-only. Once `complete`, `refused`, or
`hold` is recorded, it cannot be retried, reopened, overwritten, or converted
by a later worker. A hold is terminal, non-consumable, and non-retryable
pending coordinator disposition; it cannot be passed to a consumer or used as
replay authority.

## Allowlisted recommendation and independent authorization

The only consumer is `support-triage-advisory-v1`. Its allowlisted object is
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

| Refusal ID | Condition | Required disposition |
|---|---|---|
| R01 | Caller supplies or overrides endpoint, method, body, `Host`, `:authority`, `Authorization`, content headers, transfer headers, proxy target, or redirect policy. | Refuse before transmission; caller transport fields have no authority. |
| R02 | Method, final TLS origin, host, path, certificate, hostname, or chain differs from the immutable capability transport. | Refuse; no origin substitution or weakened validation. |
| R03 | Redirect is returned or attempted. | Refuse; redirects are disabled and never followed. |
| R04 | Non-2xx status, missing/non-JSON content type, DNS/connectivity/transport failure, TLS failure, decompression failure, truncation, invalid UTF-8, or response body over 65,536 bytes. | Refuse before parse or persistence. |
| R05 | Exact transmitted request body differs from the measured UTF-8 body, or request body exceeds 65,536 bytes. | Refuse before or during transmission; no body rewrite. |
| R06 | Capability key is absent, changed, or belongs to another surface. | Refuse; do not infer ownership. |
| R07 | Requested identity is missing, changed, aliased, normalized, or substituted. | Refuse; never use `typesafe/jev-latest` or a served suffix as replacement. |
| R08 | Response requested identity does not exactly equal request identity. | Refuse before consumption or replay. |
| R09 | Authenticated response `model` is missing/unparseable/conflicting or differs from `served_identity.model`; response ID is missing/conflicting/client-synthesized. | Refuse; served identity never becomes a D13 alias. |
| R10 | Schema, envelope, JSON, duplicate-key, extra-field, question, criteria, answer, confidence, or type validation fails. | Refuse; no coercion, repair, or partial answer set. |
| R11 | Choice distribution differs from total 1 by more than absolute `1e-12`, or has invalid keys/probabilities. | Refuse; no repair, clamping, or renormalization. |
| R12 | Complete status lacks provider-declared parseable `response_id` or `server_timestamp_utc`. | Terminal hold/refusal; never mark complete. |
| R13 | Cost is missing, a string, NaN, Infinity, negative, non-USD, malformed, or greater than `0.01`. | Terminal hold/refusal; never estimate or convert. |
| R14 | Pre-call provider/account hard-budget enforcement or acknowledgement is absent. | Terminal hold before transmission; client reservation alone is insufficient. |
| R15 | `run_id` or CAS/create-if-absent lease is missing, duplicated, already consumed, or not bound to capability/version/request digest. | Terminal hold/refusal; no call. |
| R16 | Second, concurrent, or retry call is attempted, or timeout expires. | Terminal refusal; append-only lease cannot be recreated or reopened. |
| R17 | JCS canonical bytes or paired request/response digest is missing, malformed, recomputed differently, or identity-unbound. | Refuse replay or evidence acceptance. |
| R18 | Provenance object is non-canonical, contains PII, has missing/wrong provenance digest, or uses a non-JCS hash procedure. | Refuse replay and evidence acceptance. |
| R19 | Fixture repository/ref/path/commit/tree is missing, unverified, mutable, or fixture ID does not resolve to the exact committed manifest entry. | Refuse replay custody; terminal hold pending coordinator disposition. |
| R20 | Fixture is self-recomputed outside the committed manifest, detached from its paired digests, or current bytes differ from custody. | Refuse replay; no self-recomputed acceptance. |
| R21 | `provenance.authenticated_response_id` is missing, one-sided, client-synthesized, or not exactly equal to `served_identity.response_id`. | Terminal hold/refusal; complete fixture status is forbidden. |
| R22 | Input contains unknown/free-text/PII/credential-bearing state, question names, instructions, criteria, descriptions, choices, score labels, or wrapper metadata, or minimization/redaction is uncertain. | Refuse before serialization/transmission; retain no rejected input or metadata. |
| R23 | Fixture, metadata, source reference, log, or report contains PII, key, raw authorization header, unsafe payload, or exceeds retention limit. | Refuse retention and consumption; do not echo material. |
| R24 | Consumer is not `support-triage-advisory-v1`, recommendation has unknown/effect fields, or independent application authorization is absent. | Refuse; application retains all authority and effects. |
| R25 | Any parent RCM, boundary-routing, standard routing, Pi, HAWF, Helmholtz, GMF, or other forbidden surface is requested. | Refuse and stop for coordinator review; no shared-surface mutation. |

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
