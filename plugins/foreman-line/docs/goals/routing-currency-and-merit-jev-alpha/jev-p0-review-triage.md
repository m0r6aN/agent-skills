# JEV-P0 Review Triage

**Parcel:** JEV-P0
**Builder commit reviewed:** `0d52d12937ceefbcec98dbd01d467e0a40bf924f`
**Review date:** 2026-09-21
**Disposition:** changes requested; Gate 3 blocked pending rework

## Independent review record

Two fresh, independent frontier reviews inspected the exact three-file builder
commit, the active spec, and the parent RCM D13 records. Both found no scope
collision, network call, spend, credential exposure, or parent-surface mutation.
Both returned **REQUEST CHANGES / Gate 3 not ready**.

## Convergent findings — fix

| Finding | Evidence | Required closure |
|---|---|---|
| Served identity was labeled provider-declared but not mechanically bound. | `jev-p0-contract.md` identity and envelope sections; `jev-p0-evidence-boundary.md` R05. | Bind to the authenticated provider response `model` field plus `response_id`; forbid client synthesis/fallback and preserve metadata-only status. |
| Canonical digest procedure was implementation-ambiguous. | Evidence-boundary canonicalization section. | Adopt RFC 8785/JCS, define UTF-8 and SHA-256 steps, distinguish canonical logical bytes from raw wire bytes, and add vectors. |
| Stable response ID and server timestamp were optionalized. | Minimum live-observation record and R05/R16 areas. | Require both for `complete`; missing/unparseable values become terminal hold/refusal. |
| Choice-distribution tolerance was unspecified. | Contract choice distribution rule. | Fix absolute tolerance at `1e-12`; no renormalization. |
| 64-KiB measurement basis was unclear. | Contract bounds and evidence-boundary size rules. | Measure raw UTF-8 request body before transmission and raw UTF-8 response body before parse/persistence. |

## Review B findings — fix

| Finding | Required closure |
|---|---|
| Endpoint authority was declarative rather than transport-bound. | Capability-owned immutable endpoint; caller cannot supply it; redirects disabled; exact method/host/path/TLS final-origin checks; transport refusal rows. |
| One-call and cost bounds lacked enforcement semantics. | Coordinator-issued run ID, atomic single-call lease, pre-call budget reservation, concurrency one, zero retries, and terminal hold/refusal for non-USD or over-cap cost. |
| Replay provenance was mutable and self-consistency-only. | Immutable reviewable manifest/commit custody, fixture ID, paired digests, provenance digest, and trusted custody rule. |
| Hold/refusal semantics and transport rows were incomplete. | Define hold as terminal, non-consumable, non-retryable pending coordinator disposition; add TLS/certificate, redirect, non-2xx, content-type, transport, decompression, and body-truncation refusals. |
| Advisory-only consumer protection was prose-only. | Allowlisted recommendation object with no commands, capability tokens, recipients, or effect fields; independent application authorization gate and negative tests. |

## Environment-only verification gap

The builder reported Node `v24.7.0` below the shaping package's declared
`>=24.11.1` floor and missing local `ajv`; no dependency installation was
attempted. Coordinator-side targeted lint of the active frontmatter spec passed;
the shaping suite passed 44/44. The full spec-linter suite has one unrelated
pre-existing inventory failure involving an existing `.trash` document. The
contract documents themselves are not frontmatter specs, so they are not passed
to the frontmatter linter.

## Rework disposition

The builder completed a new Step 0 restatement covering all findings. The
coordinator accepted the rework on the same three allowed files. No Gate 3
request is valid until the rework commit is closed, deterministic evidence is
recorded, and the two reviews are re-run against the reworked commit.
