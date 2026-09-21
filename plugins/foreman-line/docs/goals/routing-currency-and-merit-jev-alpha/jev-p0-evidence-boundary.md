# JEV-P0 — Evidence boundary and refusal matrix

## Evidence authority classes

JEV evidence is classified before it can be consumed:

| Class | What it proves | What it cannot prove |
|---|---|---|
| `live-observation` | A later explicitly authorized bounded run observed a provider response and recorded safe metadata. | Replay authority, standard catalog eligibility, D13 eligibility, general service health, or routing approval. |
| `sanitized-replay-fixture` | A sanitized request/response pair can be validated deterministically against `jev-decisions/v1` and its recorded digests. | That the provider is currently available or that the fixture came from a fresh live call unless provenance says so. |
| `refusal-record` | A bounded check refused a named condition and did not proceed. | A successful provider result, a retry authorization, or permission to weaken the refusal. |

A live observation is never replay authority. Replay requires a distinct,
sanitized, provenance-tagged fixture with both canonical digests and explicit
requested/served identity binding. Evidence status must say whether a record is
an observation, replayable evidence, or a refusal; these states must not be
collapsed.

## Minimum live-observation record

A complete live observation records only safe metadata and the result status.
It contains at least:

| Field | Requirement |
|---|---|
| `evidence_class` | Literal `live-observation`. |
| `capability` | Literal `openrouter-alpha-decisions`. |
| `endpoint` | Exact approved endpoint, with no alternate path. |
| `request_digest` | Lowercase SHA-256 of the canonical request bytes. |
| `response_digest` | Lowercase SHA-256 of the canonical sanitized response bytes when a response exists. |
| `requested_identity` | Exact `openrouter / typesafe/jev-1.13 / alpha-decisions` tuple. |
| `served_identity` | Provider-declared served identifier, stored separately. |
| `schema_version` | Literal `jev-decisions/v1`. |
| `response_id` | Stable provider response identifier, when supplied; missing required identity metadata is a hold/refusal. |
| `server_timestamp_utc` | Provider/server UTC timestamp, when supplied and parseable. |
| `client_timestamp_utc` | Client observation UTC timestamp. |
| `usage` | Provider-reported usage fields, without secret-bearing payloads. |
| `cost` | Amount plus explicit currency, such as a currency-qualified USD amount. |
| `status` | `complete`, `refused`, or `hold`, with a reason. |

Cost is complete only when both amount and currency are present and
currency-qualified. Missing cost or currency is an evidence hold; it is never
estimated, converted, inferred from a price table, or silently accepted.

The record must not contain an API key, authorization header, secret, raw
credential-bearing request or response, unredacted provider payload, or
unbounded log excerpt. A boolean or status-only authentication observation is
the maximum permitted credential-related evidence.

## Sanitized replay-fixture record

A replay fixture is a new evidence object, not a relabeled live observation. It
must contain:

```text
evidence_class: "sanitized-replay-fixture"
provenance:
  source_kind: <explicit source class>
  source_reference: <non-secret reviewable reference>
  captured_at_utc: <UTC timestamp when known>
schema_version: "jev-decisions/v1"
requested_identity: <exact request tuple>
served_identity: <separate provider-declared served identity>
request: <sanitized validated request envelope>
response: <sanitized validated response envelope>
request_digest: <canonical JSON SHA-256>
response_digest: <canonical JSON SHA-256>
```

Sanitization removes credentials, authorization headers, secret-bearing state,
PII, unsafe payloads, and unrelated provider data before the fixture is
retained. Sanitization must not alter the fields covered by the contract,
identities, question criteria, answer values, or digest inputs; if it would,
the fixture is refused rather than presented as an exact replay.

## Canonical bytes and digest procedure

For both request and response, the digest input is determined as follows:

1. Require strict UTF-8 JSON with no BOM, no trailing non-whitespace bytes,
   no duplicate object keys, and no non-finite numeric values.
2. Parse and validate the complete closed envelope against
   `jev-decisions/v1`, including exact identity binding, question/answer
   coverage, and type-specific value rules.
3. Serialize the validated JSON as deterministic canonical JSON: object keys
   sorted lexicographically by Unicode code point, arrays preserved in order,
   insignificant whitespace removed, strings escaped by the JSON canonical
   procedure, and numbers emitted in one deterministic finite representation.
4. Encode that canonical JSON as UTF-8 bytes. Hash exactly those bytes with
   SHA-256 and record the lowercase 64-hex-character digest.

The request digest covers the sanitized request envelope, not headers or an
authorization value. The response digest covers the sanitized response
envelope, not transport headers or an unsafe raw payload. A digest mismatch,
missing digest, provenance mismatch, or requested/served identity mismatch
refuses replay. The fixture's stored digest must be recomputed from its stored
sanitized bytes; a digest copied from a live record is not authority.

## Bounded execution and evidence rules

These limits apply to each explicitly authorized later live run:

- One provider call total.
- Zero retries; any retry attempt is a refusal.
- Concurrency exactly one; overlapping or parallel calls refuse.
- Thirty-second timeout; timeout refuses and cannot be retried by implication.
- Request maximum 65,536 bytes (64 KiB), checked before transmission.
- Response maximum 65,536 bytes (64 KiB), checked before persistence or
  consumption.
- Aggregate cost cap of `$0.01 USD` per authorized run.
- Missing or unqualified cost/currency is a hold/refusal, not an estimate.
- JEV-P0 itself makes zero calls and incurs zero spend.

An attempt outside these bounds is not converted into partial success. The
record must preserve the refusal or hold reason without retaining unsafe input.

## Refusal matrix

| Refusal ID | Condition | Required disposition |
|---|---|---|
| R01 | Endpoint is not the exact approved POST operation. | Refuse before transmission; never repoint to catalog or chat/completions. |
| R02 | Capability key is absent, changed, or belongs to another surface. | Refuse; do not infer ownership. |
| R03 | Requested provider/model/surface tuple is missing, changed, aliased, normalized, or substituted. | Refuse; never use `typesafe/jev-latest` or a served suffix as a replacement. |
| R04 | Response requested identity does not exactly equal the request identity. | Refuse before consumption or replay acceptance. |
| R05 | Served identity is missing, conflicting, not provider-declared, or merged into requested identity. | Refuse; served identity never becomes a D13 alias. |
| R06 | Schema version is absent or is not literal `jev-decisions/v1`. | Refuse; no downgrade or guessed version. |
| R07 | Request or response is malformed, non-JSON, has duplicate keys, extra fields, invalid JSON values, or fails closed-envelope validation. | Refuse before persistence or consumption. |
| R08 | Question names or criteria are duplicate, empty, unsupported, or not fully covered by answers. | Refuse; no partial answer set. |
| R09 | Question type is not exactly `noul`, `choice`, or `score`; answer type does not match; or an extra/missing answer exists. | Refuse; no type coercion. |
| R10 | Choice value/distribution is missing, has extra or missing keys, invalid probabilities, or an invalid total. | Refuse; no repair or renormalization. |
| R11 | Confidence is missing, non-finite, or outside 0–1; noul/score value is invalid. | Refuse; no clamping. |
| R12 | Response or request exceeds 65,536 bytes. | Refuse before transmission, persistence, or consumption. |
| R13 | Authentication fails or auth status is not safely observable. | Refuse; record only boolean/status-only evidence and never the credential/header. |
| R14 | Timeout exceeds 30 seconds. | Refuse; zero retries. |
| R15 | A second, concurrent, or retry call is attempted. | Refuse and preserve the one-call bound. |
| R16 | Cost is missing, currency is missing, currency is unqualified, or the run would exceed `$0.01 USD`. | Hold/refuse; never estimate or convert. |
| R17 | Request/response digest is missing, malformed, recomputed differently, or bound to another identity. | Refuse replay or evidence acceptance. |
| R18 | Fixture provenance is absent, mutable, unsafe, or does not distinguish live observation from replay. | Refuse replay authority. |
| R19 | Fixture, receipt, log, review report, or evidence contains a key, raw authorization header, or unsafe payload. | Refuse retention and consumption; do not echo the material. |
| R20 | Consumer is not `support-triage-advisory-v1`, or asks Jev to authorize routing, escalation, spend, mutation, or a host/Pi effect. | Refuse; application code retains all authority and effects. |
| R21 | Any parent RCM, boundary-routing, standard routing, Pi, HAWF, Helmholtz, GMF, or other forbidden surface is requested. | Refuse and stop for coordinator review; no shared-surface mutation. |

Every refusal is fail-closed and side-effect free. No refusal may silently
alias, retry, downgrade, substitute, route, escalate, spend, persist unsafe
material, or mutate state.

## Review gate

Before any Gate 3 request, two independent fresh frontier reviewers must review
this boundary and the companion contract. Reviewers are read-only and
independent of the author and each other. Their reports must separately address
identity confusion, credential leakage, cost/currency evidence, replay digest
authority, refusal completeness, consumer effect escalation, and parent-surface
collision. Findings are inputs to coordinator triage, not builder approval.
