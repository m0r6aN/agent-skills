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

## Second review round — residual findings and rework

The rework commit `8be1cca7681e08ca4a9f585e1927140ea9e2abc5` was reviewed by
two fresh, independent frontier sessions. Both kept JEV-P0 **Gate 3 blocked**.
The coordinator accepted a second same-file rework; no live call, credential
access, spend, host/Pi action, parent-surface mutation, or merge is authorized.

| Review | Finding | Disposition |
|---|---|---|
| A | Cost amount needed an explicit finite, non-negative JSON-number rule with exact `USD` typing. | Fix in second rework. |
| A | Provenance digest canonicalization needed an explicit RFC 8785/JCS UTF-8 rule and exact fixture custody binding. | Fix in second rework. |
| A | Verification scope proof used a clean-worktree command rather than an explicit base-to-head comparison. | Fix in second rework. |
| B | Transport authority needed explicit caller-header/body/endpoint restrictions and exact transmitted-byte measurement. | Fix in second rework. |
| B | Replay custody needed repository/ref/path/commit/tree manifest verification and rejection of mutable self-recomputed fixtures. | Fix in second rework. |
| B | Run, budget, and terminal guarantees needed atomic claim semantics, immutable binding, provider-side spend protection/acknowledgement, and append-only state transitions. | Fix in second rework. |
| B | Privacy boundary needed an allowlisted input schema, minimization/redaction/refusal, PII exclusions, retention limits, and no raw-payload retention. | Fix in second rework. |

The second rework was accepted at Step 0 on the same three allowed documents.
Builder commit `22944d9900ca52a0c44d401b0cd2aa876fed460d` changed exactly those
three files from the recorded base `8be1cca`; coordinator scope and whitespace
checks passed, with Node `v24.7.0` and the previously recorded missing-`ajv`
environment limitation. Two fresh independent reviews of `22944d9` remain
required before any Gate 3 ruling.

## Third rework disposition

Two fresh independent reviews of `22944d9900ca52a0c44d401b0cd2aa876fed460d`
both returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator
reproduced the scope finding: the actual diff is clean, but the parcel's
documented script filters to allowed paths before testing for forbidden paths,
so the proof procedure itself is unsound.

| Finding | Evidence | Disposition |
|---|---|---|
| P1 | Privacy rules clearly constrain `state.values`, but question names, criteria, and choices remain arbitrary caller-supplied strings that could carry PII/free text. | Fix in third rework: allowlist the complete envelope or explicitly reject unsafe question metadata. |
| P1/P2 | The prescribed scope proof filters the diff before checking for forbidden paths. | Fix in third rework: enumerate the full base-to-head diff first, then assert exact equality with the three allowed paths. |
| P2 | The verification execution table still says final checks are “To be recorded.” | Fix in third rework: record the observed Node, scope, whitespace, field-by-field, and review results. |
| P2 | Provenance permits `authenticated_response_id` and fixture `served_identity.response_id` as separate fields without an explicit equality invariant for complete fixtures. | Fix in third rework: require equality and reject mismatch. |

Gate 3 remains blocked. The third rework is authorized only on the same three
JEV-P0 documents, with no live call, credential access, spend, external
mutation, or merge.
