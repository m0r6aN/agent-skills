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

## Fourth rework disposition

Two fresh independent reviews of `81a7954003e8a5e12a3f254a49c04aaa8faac7f2`
both returned **REQUEST CHANGES / Gate 3 not ready**. Their shared findings
are accepted as blockers:

| Finding | Evidence | Disposition |
|---|---|---|
| P1 | The execution table still contains stale “pending final resulting commit” language and calls this the second rework, despite the third-rework commit and recorded checks. | Fix in fourth rework: make the rework number, target hash, scope, whitespace, and review record internally consistent. |
| P1/P2 | Privacy controls use a non-enumerated “coordinator-approved allowlist” and vague “other PII patterns”; metadata fields such as usage, source kind/ref, fixture IDs, and wrapper metadata are not closed and bounded. | Fix in fourth rework: enumerate deterministic safe grammars/allowlists, bounds, wrapper metadata, and refusal rules for the complete envelope and evidence metadata. |

Gate 3 remains blocked. The fourth rework is authorized only on the same three
JEV-P0 documents. No live call, credential access, spend, external mutation,
downstream dispatch, or merge is authorized.

## Eighth rework disposition

Two fresh independent reviews of `14b9b947fad60ab927a49ef35c795dbe34e3f502`
returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator accepts the
document findings:

| Finding | Evidence | Disposition |
|---|---|---|
| P1 | The verification record does not contain the exact resulting SHA; it says the value is only in the handoff. | Fix in eighth rework: record the full resulting head in the immutable execution table. |
| P1 | Non-complete replay fixtures forbid `provenance` in their closed field sets while later text requires the literal JSON sentinel none. | Fix in eighth rework: make non-complete provenance conditional and consistent with each exact field set. |
| P2 | The documented `node -v` probe lacks an immediate native exit-code assertion. | Fix in eighth rework: check `$LASTEXITCODE` and fail closed. |
| Gate | The builder record intentionally reports `0/2` because independent reviews are coordinator evidence, not builder self-approval. | Record the two independent reports and triage here; do not convert builder `0/2` into a self-approval. Gate 3 remains human-owned. |

Gate 3 remains blocked. The eighth rework is authorized only on the same three
JEV-P0 documents; no live call, credential access, spend, external mutation,
downstream dispatch, or merge is authorized.

## Seventh rework disposition

Two fresh independent reviews of `2187402c218499fba8b413bec2c6824efd92ed8f`
both returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator accepts
these blockers:

| Finding | Evidence | Disposition |
|---|---|---|
| P1 | The reviewed-head proof assigns the recorded head from mutable `HEAD` and compares the value to itself; it is not pinned to the reviewed commit. | Fix in seventh rework: assert the exact expected head SHA and require every changed status to be `M`. |
| P1 | Complete replay fixtures duplicate response and custody fields without explicit equality across top-level `response_id`, embedded response ID, served identity, provenance ID, and manifest commit/tree fields. | Fix in seventh rework: add all cross-field equality and split-brain refusal rules. |
| P1 | Live cost is described as a number plus currency but lacks a closed `{amount, currency}` object schema and extra-field refusal. | Fix in seventh rework: define the exact cost object and all numeric/type bounds. |
| P2 | `recorded_at_utc` and provenance manifest commit/tree fields are not covered by the exact timestamp/40-hex grammars. | Fix in seventh rework: bind these fields directly to the exact existing grammars. |
| P1 | The builder field-by-field pass overstates closure while these findings remain. | Fix in seventh rework: keep content status blocked until controls close. |

Gate 3 remains blocked. The seventh rework is authorized only on the same three
JEV-P0 documents; no live call, credential access, spend, external mutation,
downstream dispatch, or merge is authorized.

## Sixth rework result

The sixth rework committed as `2187402c218499fba8b413bec2c6824efd92ed8f`
from base `e3273dde49deec062c2787006b7b8fd409c01e91`. Coordinator checks
confirmed exactly the three allowed documents changed, the full unfiltered path
set matched the allowlist, `git diff --check` and name-status returned success,
and Node was `v24.7.0`. The builder recorded the active-spec `ajv` limitation
and no external action. Two fresh reviews of this exact commit remain required.

## Sixth rework disposition

Two fresh independent reviews of `e3273dde49deec062c2787006b7b8fd409c01e91`
both returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator accepts
these blockers:

| Finding | Evidence | Disposition |
|---|---|---|
| P1 | Evidence classes do not each have a complete required/forbidden field matrix; replay fixtures omit explicit status/reason fields and use indirect schema language. | Fix in sixth rework: define exact live, replay, refusal, and hold wrapper schemas, including conditional required fields. |
| P1/P2 | Provider/account hard enforcement and `budget_ack` are described as alternatives, while the wrapper requires `budget_ack` for every call. | Fix in sixth rework: choose one unambiguous path; require the closed `budget_ack` for every call or define the direct enforcement record. |
| P1 | Source/ref/repository/path grammars still permit human-chosen values that can encode PII despite semantic exclusions. | Fix in sixth rework: use generated opaque identifiers or finite literal allowlists only. |
| P1 | The scope script does not check native exit codes before printing success. | Fix in sixth rework: explicitly stop on failed `git diff --check`/status commands. |
| P2 | Verification derives `HEAD` from mutable state and does not record the full resulting SHA. | Fix in sixth rework: pin and assert the exact reviewed head `e3273dde49deec062c2787006b7b8fd409c01e91`. |

Gate 3 remains blocked. The sixth rework is authorized only on the same three
JEV-P0 documents; no live call, credential access, spend, external mutation,
downstream dispatch, or merge is authorized.

## Fifth rework disposition

Two fresh independent reviews of `069b1c017d1a9b091b73d69de9e6d4c7007d39f3`
both returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator accepts
the following blockers:

| Finding | Evidence | Disposition |
|---|---|---|
| P0/P1 | Request privacy still refers to a non-enumerated “coordinator-approved allowlist,” vague identifier/PII predicates, and grammars that can accept arbitrary sensitive labels. | Fix in fifth rework: use literal finite instruction values or remove the field; make every request string and refusal rule mechanically closed. |
| P0/P1 | Evidence metadata still uses undefined semantic “PII” exclusions and indirect wrapper schemas. | Fix in fifth rework: use derived identifiers/exact enums and a complete conditional wrapper schema with no semantic escape hatch. |
| P1 | The contract allows a provider/account budget acknowledgement without a closed evidence object binding issuer, account/provider, cap, timestamp, digest, and custody. | Fix in fifth rework: define the exact acknowledgement schema and require it before transmission. |
| P2 | Non-complete provenance permits an unspecified “explicit none” sentinel; manifest commit/tree fields are not directly tied to the exact digest grammar. | Fix in fifth rework: define the literal sentinel and bind all custody fields to exact lowercase SHA-1 forms. |
| P1 | Builder verification claims the fourth-rework field-by-field review passed despite these blockers. | Fix in fifth rework: report the content review as blocked until these controls are actually closed. |

Gate 3 remains blocked. The fifth rework is authorized only on the same three
JEV-P0 documents; no live call, credential access, spend, external mutation,
downstream dispatch, or merge is authorized.

During dispatch reconciliation, the builder branch advanced within the same
three-file scope from `81a7954003e8a5e12a3f254a49c04aaa8faac7f2` to
`11bbd6c009b5cbb2638f41d152f3bc57f85bf8e8`, changing only the verification
record. The coordinator verified that path set and adopted `11bbd6c` as the
actual fourth-rework base; no other scope or authority changed.
downstream dispatch, or merge is authorized.

## Ninth review disposition

Two fresh independent reviews of `bfcebb2378304568931f1166085945b42cac1d89`
returned **REQUEST CHANGES / Gate 3 not ready**. The parcel is therefore
stopped at the human Gate 3 boundary; no further implementation is authorized
by the user's Gate 2 grant alone.

| Finding | Disposition |
|---|---|
| Coordinator receipt path and target SHA are only caller-supplied and not read/verified by the documented check; the execution record says no receipt was supplied. | Gate-blocking traceability gap; requires a coordinator-supplied receipt/target before any merge decision. |
| Complete replay fixtures do not fully bind duplicated wrapper fields to nested request/response/provenance metadata. | Gate-blocking contract gap; requires same-file rework if the parcel resumes. |
| Budget-ack freshness has no age/expiry/clock rule; retention lacks an explicit capture-time anchor. | Deterministic contract gaps; requires same-file rework if the parcel resumes. |
| Non-complete fixture custody equality and evidence-class reason-code partition are underspecified; the field-count label is stale. | Deterministic contract gaps; requires same-file rework if the parcel resumes. |

The exact three-file scope, exact `M` statuses, whitespace, native command exits,
JCS vectors, identity/schema/answer/transport/lease/cost/privacy/consumer and
parent-boundary controls passed review. No live call, credentials, spend, host/Pi
action, parent mutation, or merge occurred. Gate 3 is not granted.

## Post-merge Gate 3 disposition

Pull request [#38](https://github.com/m0r6aN/agent-skills/pull/38) merged on
2026-09-21 at commit `ef921b65ee59c1c6aaef230383c51450dfc4de42`. The local
coordinator branch `codex/refresh-actions-and-packages` was fast-forwarded to
that same commit and matches `origin/codex/refresh-actions-and-packages`.
The merged change contains exactly the three bounded JEV-P0 artifacts:
`jev-p0-contract.md`, `jev-p0-evidence-boundary.md`, and
`jev-p0-verification.md`.

The user's conditional human grant is now satisfied: Gate 3 is granted for
the bounded JEV-P0 handoff at the merged commit. This does not extend to
JEV-P1, general Gate 3, live Jev execution, credential or spend activity,
host/Pi correction, parent mutation, HAWF reconciliation, or Helmholtz
dispatch. The earlier independent-review findings remain preserved above as
known review observations; they are not silently reclassified as resolved.

## Follow-up disposition before JEV-P1

CoordinatorTargetSha: 2fe8b456b397e2f8f0731f51788a0c5b7b795b4a

The coordinator retains the nine-review observations as an explicit P0 risk
register. They must be closed by a bounded same-file P0 rework or accepted by
an explicit human disposition before JEV-P1 implementation is dispatched; the
P0 Gate 3 acceptance does not itself authorize that rework or authorize JEV-P1.
The shaped JEV-P1 spec is therefore `status: draft` and is not dispatchable.
The next human decision is an exact Gate 2 grant for JEV-P1 after the P0
observation disposition is recorded.

## Tenth review disposition

Two fresh independent reviews of `e907663be491c4d5765b5b8279116a2633c81b4b`
returned **REQUEST CHANGES / Gate 3 not ready**. The bounded Gate 2 rework
continues on the same three JEV-P0 artifacts; no merge or Gate 3 acceptance is
authorized for this rework yet.

| Finding | Disposition |
|---|---|
| Complete-fixture equality does not bind a manifest-entry schema version. | Fix in next same-file rework; add the exact manifest-entry schema-version field and equality. |
| Manifest custody remains wrapper/provenance self-consistency without an independent coordinator trust anchor. | Fix in next same-file rework; define the external coordinator-controlled manifest receipt/resolution contract and fail closed when it is absent or mismatched. |
| Receipt parsing accepts the first matching line and permits ambiguous newline/duplicate declarations. | Fix in next same-file rework; require one unambiguous closed receipt declaration and reject duplicates or malformed line structure. |
| The verification table records receipt/target evidence as absent even though the coordinator can supply it. | Fix in next same-file rework; record the exact supplied receipt path, target SHA, and successful execution result without deriving the target from `HEAD`. |
| Custody path/ref literals do not cover the planned JEV-P1 fixture paths. | Fix in next same-file rework; add the finite approved JEV-P1 fixture paths/ref to the contract without opening arbitrary paths. |
| Missing live cost/currency can map to either hold or refusal. | Fix in next same-file rework; preserve deterministic `hold` for missing cost/currency and reserve refusal for malformed/unauthorized conditions. |
| Invalid replay custody cannot be represented by the fixture class/status matrix. | Fix in next same-file rework; route untrusted/malformed custody to generic `evidence:R18/R19` refusal/hold records and reserve `fixture:*` for validated custody. |
| Retention anchors can be future-dated. | Fix in next same-file rework; bind anchors to the trusted capture/recording clock and reject future anchors. |

The exact three-file scope, clean worktree, `M` statuses, whitespace checks, and
boundary compliance passed. The review findings are reproduced and accepted as
rework items; Gate 3 remains closed until a fresh commit receives two passing
independent reviews.

## Coordinator proof for fresh rework

The coordinator supplied receipt
`D:\Repos\jev-p0-triage-receipt-round3.txt` with
`target_sha=9380955cc6b16c4a4a9533113e02eb16429d4989`. Against base
`369207585812dcdfcd237d5241b83c61accbad5b`, the proof opened the strict UTF-8
receipt, matched the target, asserted `HEAD`, enumerated the unfiltered diff,
confirmed exactly the three allowed paths with `M` statuses, and passed
whitespace/native exit checks. No independent review or Gate 3 approval is
implied by this coordinator proof.

## Eleventh review disposition

Two fresh independent reviews of `9380955cc6b16c4a4a9533113e02eb16429d4989`
returned **REQUEST CHANGES / Gate 3 not ready**. The findings are reproduced
and accepted for another same-three-file rework; the bounded Gate 2 grant does
not authorize merge or Gate 3 acceptance while they remain open.

| Finding | Disposition |
|---|---|
| Budget acknowledgement freshness was lost when the next rework branched from the coordinator branch rather than the prior rework commit. | Restore deterministic run-start, acknowledgement-age/expiry, trusted-clock, lease, and transmission-order rules on top of the full prior rework chain. |
| R12 and R15 can still be emitted as either hold or refusal. | Define a closed reason-code/status partition with deterministic mappings and update the field matrices/refusal table consistently. |
| The coordinator proof passes externally but the execution table still records receipt, target, head, scope, whitespace, and status as pending. | Record the supplied proof result and exact reviewed SHA in the three-file verification record without self-approval. |
| Complete replay equality omits wrapper requested identity versus response requested identity and top-level source metadata versus provenance. | Add the missing equalities and fail-closed mismatch rule. |
| The documented verification working directory is stale and not reproducible for the current candidate. | Parameterize or correct the repository-root instruction in the same verification artifact. |

Scope and external-boundary compliance passed for `9380955`; no network,
credential, spend, host/Pi, parent, HAWF, Helmholtz, or downstream action
occurred.

## Coordinator proof for round-3 rework

The coordinator supplied receipt
`D:\Repos\jev-p0-triage-receipt-round4.txt` with
`target_sha=2fe8b456b397e2f8f0731f51788a0c5b7b795b4a`. Using repository root
`C:\Repos\foreman-line-jev-p0-rework4` and base
`9380955cc6b16c4a4a9533113e02eb16429d4989`, the proof opened the strict UTF-8
receipt, matched the target, asserted `HEAD`, enumerated exactly the three
allowed paths, confirmed `M` statuses, and passed whitespace/native checks.
No independent review or Gate 3 approval is implied by this coordinator proof.

## Twelfth review disposition

Two fresh independent reviews of `2fe8b456b397e2f8f0731f51788a0c5b7b795b4a`
returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator proof passed,
but the following deterministic contract and record gaps require another
same-three-file rework under the existing bounded Gate 2 grant:

| Finding | Disposition |
|---|---|
| R09 and R12 both cover a present response-ID conflict. | Make the conditions mutually exclusive: R09 owns served-model/identity conflict; R12 owns missing provider-complete metadata only. |
| R14/R15/R16 overlap on budget acknowledgement reuse, lease contention, and retry/concurrency. | Define one explicit precedence and mutually exclusive condition/status mapping for each code. |
| Freshness clock samples lack complete grammar and monotonic ordering. | Add exact timestamp grammar and require `run_started_at_utc <= acknowledged_at_utc <= transmission_started_at_utc <= socket_opened_at_utc`. |
| R20 matrix emits `evidence:R18`. | Align the matrix and partition rule so the emitted reason code is deterministic and consistent. |
| The current verification table still records the latest proof as pending. | Record the exact coordinator receipt, target, head, scope, whitespace, and status results for the reviewed implementation head; keep builder review counts at `0/2`. |

Scope and external-boundary compliance passed for `2fe8b456`; no network,
credential, spend, host/Pi, parent, HAWF, Helmholtz, or downstream action
occurred.

## Thirteenth review disposition

Two fresh independent reviews of `c71bdbfa0f9597eb44d0c3a01aa853f1f33989a8`
returned **REQUEST CHANGES / Gate 3 not ready**. The coordinator proof passed,
but the following findings require another same-three-file rework under the
existing bounded Gate 2 grant:

| Finding | Disposition |
|---|---|
| The documented scope proof still hardcodes the prior base `9380955...` instead of the actual rework base `2fe8b456...`. | Parameterize and record the current round base as `c71bdbf`'s parent `2fe8b456...`; do not scope proof from an older base. |
| R14/R15/R16 still overlap because losing claimants, contested claims, concurrent calls, and retry states are described by inconsistent predicates. | Define disjoint observable lease states and one total precedence; remove circular “not an R16” guards and contradictory generic claimant language. |
| Timestamp rules are repeated inconsistently: three-way vs four-way ordering and parseable-vs-exact grammar. | Declare one exact millisecond-`Z` grammar and repeat the same four-field ordering and freshness rule everywhere. |
| R09 appears in both refusal-only and explicit-split partitions; R09/R10 malformed-identity ownership lacks precedence. | Make the partition closed and exclusive; assign malformed shape/schema to one code and present valid-but-conflicting identity to the other, consistently. |
| Verification retains stale round labels. | Correct the round references while preserving the prior-candidate proof scope and `0/2` review count. |

Scope and external-boundary compliance passed for `c71bdbfa`; no network,
credential, spend, host/Pi, parent, HAWF, Helmholtz, or downstream action
occurred.
