# JEV-P0 — Evidence boundary and refusal matrix

## Evidence authority classes

JEV evidence is classified before it can be consumed:

| Class | What it proves | What it cannot prove |
|---|---|---|
| `live-observation` | A later explicitly authorized bounded run observed an authenticated provider response and recorded safe metadata. | Replay authority, standard catalog eligibility, D13 eligibility, general service health, or routing approval. |
| `sanitized-replay-fixture` | A sanitized request/response pair can be validated deterministically against `jev-decisions/v1` and its recorded JCS digests. | That the provider is currently available or that the fixture came from a fresh live call unless provenance says so. |
| `refusal-record` | A bounded check refused a named condition and did not proceed. | A successful provider result, a retry authorization, or permission to weaken the refusal. |
| `hold-record` | A required fact is missing or unsafe, so the result is terminally non-consumable pending coordinator disposition. | Permission to retry, estimate, normalize, or consume the held result. |

A live observation is never replay authority. Replay requires a distinct,
sanitized, provenance-tagged fixture with both JCS digests and explicit
requested/served identity binding. Evidence status must say whether a record is
an observation, replayable evidence, refusal, or hold; these states must not be
collapsed.

## Minimum live-observation record

A complete live observation records only safe metadata and the result status.
It contains at least:

| Field | Requirement |
|---|---|
| `evidence_class` | Literal `live-observation`. |
| `capability` | Literal `openrouter-alpha-decisions`. |
| `run_id` | Coordinator-issued immutable run identifier. |
| `lease_id` | Atomic single-call lease bound to `run_id`; one lease permits one call only. |
| `endpoint` | Capability-owned immutable endpoint constant, never a caller-provided value. |
| `request_digest` | Lowercase SHA-256 of the RFC 8785/JCS canonical logical request bytes. |
| `response_digest` | Lowercase SHA-256 of the RFC 8785/JCS canonical logical response bytes when a response exists. |
| `requested_identity` | Exact `openrouter / typesafe/jev-1.13 / alpha-decisions` tuple. |
| `served_identity.model` | Exact authenticated provider response field `model`; never client-synthesized. |
| `served_identity.response_id` | Exact authenticated provider response identifier. |
| `schema_version` | Literal `jev-decisions/v1`. |
| `response_id` | Mandatory provider response identifier for `status: complete`. |
| `server_timestamp_utc` | Mandatory parseable provider/server UTC timestamp for `status: complete`. |
| `client_timestamp_utc` | Client observation UTC timestamp. |
| `usage` | Provider-reported usage fields, without secret-bearing payloads. |
| `cost` | Amount plus explicit currency; complete consumption requires USD. |
| `status` | `complete`, `refused`, or terminal `hold`, with a reason. |

For `status: complete`, `response_id` and `server_timestamp_utc` are mandatory,
provider-declared, parseable, and bound to the same authenticated response.
Missing, unparseable, conflicting, or client-invented values produce a
terminal hold/refusal. A complete record also requires an authenticated
provider response whose `model` field equals `served_identity.model`; the
requested model is never a fallback.

Cost is complete only when both amount and currency are present, explicitly
`USD`, and no greater than the coordinator-reserved `$0.01 USD` cap. Missing,
non-USD, unqualified, or over-cap cost is a terminal hold/refusal; it is never
estimated, converted, inferred from a price table, or silently accepted.

The record must not contain an API key, authorization header, secret, raw
credential-bearing request or response, unredacted provider payload, or
unbounded log excerpt. A boolean or status-only authentication observation is
the maximum permitted credential-related evidence.

## Raw body sizes and transport boundary

The request size is the byte length of the exact UTF-8 serialized logical
request body immediately before transmission and before TLS framing. It must be
`<= 65,536` bytes. A caller cannot replace the capability-owned endpoint or
body after this check.

The response size is the byte length of the raw UTF-8 application body after
any permitted transport decompression and before JSON parsing or persistence.
It must be `<= 65,536` bytes. Unsupported encoding, decompression failure,
body truncation, invalid UTF-8, or over-limit size is a refusal before parse or
persistence. These raw body bytes are not the same thing as canonical digest
bytes.

Transport must use the immutable capability endpoint with exactly `POST`, host
`openrouter.ai`, path `/api/alpha/decisions`, HTTPS/TLS, and the exact final
origin. Redirects are disabled; any redirect response or attempted redirect is
a refusal. Missing or non-`application/json` content type, non-2xx status,
TLS/certificate/hostname/chain failure, DNS/connectivity/transport failure,
decompression failure, and truncation are refusal conditions. No caller URL,
proxy target, alternate host, or final-origin substitution is accepted.

## RFC 8785/JCS canonical digest procedure

The digest is over the logical validated request or response object, not over
raw wire bytes, HTTP headers, TLS framing, compression, authorization values,
or a raw unsafe payload. The two byte domains are recorded separately:

- `raw_wire_body_bytes`: the exact UTF-8 serialized request body before
  transmission, or the exact raw UTF-8 response body before parsing. These
  bytes enforce the 65,536-byte transport limits and are not the replay digest
  input.
- `canonical_digest_bytes`: the RFC 8785 JSON Canonicalization Scheme (JCS)
  UTF-8 bytes of the parsed, validated, sanitized logical envelope. These bytes
  are the only SHA-256 input for `request_digest` and `response_digest`.

For each logical envelope:

1. Require strict UTF-8 JSON with no BOM, no trailing non-whitespace bytes,
   no duplicate object keys, and no non-finite numeric values.
2. Parse and validate the complete closed envelope against
   `jev-decisions/v1`, including exact identity binding, authenticated served
   identity, question/answer coverage, type-specific values, and response
   metadata requirements.
3. Apply RFC 8785/JCS canonicalization to the logical JSON value: JCS defines
   object-key ordering, string escaping, array preservation, and deterministic
   finite-number serialization. Do not use an ad hoc sorted-key serializer as
   a substitute for JCS.
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

| Vector | Logical object | JCS UTF-8 bytes | SHA-256 |
|---|---|---|---|
| `jev-jcs-request-001` | `{"a":1,"b":[true,"x"]}` | `{"a":1,"b":[true,"x"]}` | `63e8063d9dc6f0fd5a24b4706818a165fd57c3531b74466cf5dea62bff09b0b6` |
| `jev-jcs-response-001` | `{"schema_version":"jev-decisions/v1","response_id":"r-001","model":"typesafe/jev-1.13"}` | `{"model":"typesafe/jev-1.13","response_id":"r-001","schema_version":"jev-decisions/v1"}` | `dab820809e40697f1bdcc99736067d9d282090766ae72d0e65137daf3cf6bca2` |

The first vector proves that logical bytes are compact and deterministic. The
second proves that JCS key ordering changes the digest input while preserving
the logical fields. A fixture that stores only a raw wire hash, or whose paired
JCS digest cannot be reproduced from the sanitized logical envelope, refuses.

## Sanitized replay fixtures and trusted custody

A replay fixture is a new evidence object, not a relabeled live observation.
It must be present in an immutable, reviewable manifest/commit custody chain
and contain:

```text
evidence_class: "sanitized-replay-fixture"
manifest_id: <immutable reviewable manifest identifier>
manifest_commit: <immutable reviewable commit SHA>
fixture_id: <unique immutable fixture identifier>
provenance:
  source_kind: <explicit source class>
  source_reference: <non-secret reviewable reference>
  captured_at_utc: <UTC timestamp when known>
provenance_digest: <lowercase SHA-256 of canonical provenance object>
schema_version: "jev-decisions/v1"
requested_identity: <exact request tuple>
served_identity: <model and response_id from authenticated provider response>
request: <sanitized validated request envelope>
response: <sanitized validated response envelope>
request_digest: <JCS SHA-256>
response_digest: <JCS SHA-256>
```

Trusted custody means the coordinator has recorded the exact manifest path,
manifest commit, fixture ID, paired digests, and provenance digest; the
manifest and fixture are reviewable at that immutable commit; and the current
bytes match the committed bytes. Mutable working-tree files, uncommitted
fixtures, detached copies, missing manifest entries, or changed digest pairs
are not trusted custody and refuse replay.

Sanitization removes credentials, authorization headers, secret-bearing state,
PII, unsafe payloads, and unrelated provider data before the fixture is
retained. Sanitization must not alter the fields covered by the contract,
identities, question criteria, answer values, or digest inputs; if it would,
the fixture is refused rather than presented as an exact replay.

The fixture must include a negative identity-binding companion vector: changing
the provider response `model`, deleting it, changing `response_id`, or replacing
the served identity with a client fallback must make replay refuse. A positive
fixture alone is insufficient evidence of the binding.

## Run lease, budget, and terminal holds

Each explicitly authorized live run requires a coordinator-issued `run_id`, an
atomic single-call `lease_id`, and a pre-call reservation for the full `$0.01
USD` cap. The lease is consumed exactly once and is not recreated after
timeout, refusal, process failure, or response ambiguity. Concurrency is one,
retries are zero, and the timeout is 30 seconds.

`hold` is a terminal state: it is non-consumable, non-retryable, and pending
coordinator disposition. A hold cannot be passed to the consumer, used as
replay authority, or converted into a second call. Holds cover missing or
unparseable complete metadata, missing/unqualified/non-USD/over-cap cost,
ambiguous lease state, custody gaps, and any evidence-integrity gap.

## Allowlisted recommendation and independent authorization

The only consumer is `support-triage-advisory-v1`. Its allowlisted object is
exactly the following fields and no others:

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

The application must validate the object, then pass it through an independent
application-owned authorization gate before any effect. The gate must not use a
Jev answer as authorization. Unknown fields or injected `command`,
`capability_token`, `recipients`, `effect`, `route`, `escalate`, `spend`, or
`mutation` fields refuse. Negative tests must prove that the object cannot
directly authorize a command, route, escalation, spend, recipient, or state
mutation.

## Refusal matrix

| Refusal ID | Condition | Required disposition |
|---|---|---|
| R01 | Caller supplies an endpoint, method, host, scheme, port, path, proxy target, or redirect target that differs from the immutable capability constant. | Refuse before transmission; caller transport fields have no authority. |
| R02 | Method is not POST, final origin is not exact HTTPS `openrouter.ai`, or path is not `/api/alpha/decisions`. | Refuse; do not repoint to catalog or chat/completions. |
| R03 | Redirect is returned or attempted. | Refuse; redirects are disabled and never followed. |
| R04 | TLS, certificate, hostname, chain, DNS, connection, or other transport validation fails. | Refuse; do not weaken validation or retry. |
| R05 | Non-2xx status, missing/non-JSON content type, decompression failure, truncated body, invalid UTF-8, or body-size violation. | Refuse before parse or persistence. |
| R06 | Capability key is absent, changed, or belongs to another surface. | Refuse; do not infer ownership. |
| R07 | Requested provider/model/surface tuple is missing, changed, aliased, normalized, or substituted. | Refuse; never use `typesafe/jev-latest` or a served suffix as a replacement. |
| R08 | Response requested identity does not exactly equal the request identity. | Refuse before consumption or replay acceptance. |
| R09 | Authenticated response `model` is missing, unparseable, conflicting, or does not equal `served_identity.model`; response ID is missing, conflicting, or client-synthesized. | Refuse; served identity never becomes a D13 alias. |
| R10 | Schema version is absent or is not literal `jev-decisions/v1`. | Refuse; no downgrade or guessed version. |
| R11 | Request or response is malformed, has duplicate keys, extra fields, invalid JSON values, or fails closed-envelope validation. | Refuse before persistence or consumption. |
| R12 | Question names or criteria are duplicate, empty, unsupported, or not fully covered by answers. | Refuse; no partial answer set. |
| R13 | Question type is not exactly `noul`, `choice`, or `score`; answer type does not match; or an extra/missing answer exists. | Refuse; no type coercion. |
| R14 | Choice value/distribution is missing, has extra or missing keys, invalid probabilities, or differs from total 1 by more than absolute `1e-12`. | Refuse; no repair, clamping, or renormalization. |
| R15 | Confidence is missing, non-finite, or outside 0–1; noul/score value is invalid. | Refuse; no clamping. |
| R16 | `status: complete` lacks provider-declared parseable `response_id` or `server_timestamp_utc`, or either is inconsistent with the authenticated response. | Terminal hold/refusal; never mark complete. |
| R17 | Request raw UTF-8 body exceeds 65,536 bytes before transmission. | Refuse before transmission. |
| R18 | Response raw UTF-8 body exceeds 65,536 bytes before parse/persistence. | Refuse before parse or persistence. |
| R19 | Authentication fails or auth status is not safely observable. | Refuse; record only boolean/status-only evidence and never the credential/header. |
| R20 | Coordinator `run_id` or atomic single-call lease is missing, duplicated, already consumed, or not bound to the run. | Terminal hold/refusal; no call. |
| R21 | A second, concurrent, or retry call is attempted, or the 30-second timeout expires. | Terminal refusal; lease is not recreated and no retry occurs. |
| R22 | Pre-call budget reservation is absent, cost is missing/unqualified/non-USD, or cost exceeds `$0.01 USD`. | Terminal hold/refusal; never estimate, convert, or consume. |
| R23 | JCS canonical bytes or paired request/response digest is missing, malformed, recomputed differently, or bound to another identity. | Refuse replay or evidence acceptance. |
| R24 | Fixture ID, manifest/commit custody, provenance digest, or trusted reviewable custody is absent or changed. | Refuse replay authority; hold pending coordinator disposition. |
| R25 | Fixture contains a key, raw authorization header, unsafe payload, or a client-synthesized served identity. | Refuse retention and consumption; do not echo the material. |
| R26 | Consumer is not `support-triage-advisory-v1`, recommendation has unknown/effect fields, or independent application authorization is absent. | Refuse; application code retains all authority and effects. |
| R27 | Any parent RCM, boundary-routing, standard routing, Pi, HAWF, Helmholtz, GMF, or other forbidden surface is requested. | Refuse and stop for coordinator review; no shared-surface mutation. |

Every refusal and hold is fail-closed. No path may silently alias, retry,
downgrade, substitute, route, escalate, spend, persist unsafe material, or
mutate state.

## Review gate

Before any Gate 3 request, two independent fresh frontier reviewers must review
this boundary and the companion contract. Reviewers are read-only and
independent of the author and each other. Their reports must separately address
authenticated served-identity binding and negative fixtures, JCS vectors and
raw-wire separation, complete metadata holds, distribution tolerance,
transport/lease/budget refusal, manifest custody, terminal holds, recommendation
allowlisting and independent authorization, credential safety, and
parent-surface collision. Findings are inputs to coordinator triage, not builder
approval.
