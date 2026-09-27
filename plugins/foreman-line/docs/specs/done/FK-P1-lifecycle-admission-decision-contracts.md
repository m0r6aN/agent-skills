---
ticket: FK-P1
title: Foreman Kernel - lifecycle admission and decision contracts
status: done
owner: clinton.morgan
created: 2026-09-07
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/kernel-contracts/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P1 — Lifecycle, admission, and decision contracts

## Intent

Define the versioned, provider-neutral contracts consumed by FK-P2–FK-P21: lifecycle events, authenticated admission, repository/read boundaries, authorizeAction inputs, decision envelopes, refusal semantics and golden vectors. Specify both D21 latency spans and the cold/deadline/cache rules without implementing the authorization engine, transport, storage or hooks. The result is a contract package and structural validation evidence, not runtime enforcement evidence.

## Constraints

### Dependency and dispatch boundary

**Activated 2026-09-27 (coordinator, Step-0 flag F4).** FK-P0's dependency is satisfied: the R31 registry package merged into the live tree at `a986b45` (byte-identical to accepted `1747c1d`) with the preparation packet at `609c97f` (retroactively confirmed under RS-2.1); upstream field reconciliation completed (`R31-to-P1-field-reconciliation-20260907.md`, F01–F05 accepted); the F05 exact field tables completed three independent review sessions (two rework rounds closing R1–R4 and Q1–Q3, then scoped verification — APPROVE); Step-0 restate ruled 2026-09-27 (flags F1–F4). Source base pinned at `eb258d5`. The FK-P0 corpus amendment R32 must land before this parcel's verification chain is accepted (RS-2.5 item 5). No downstream dependency edge is removed.

Isolated builder branch: `codex/fk-p1-lifecycle-admission-decision-contracts`; worktree: `D:/Repos/agent-skills-worktrees/fk-p1-lifecycle-admission-decision-contracts` — created 2026-09-27 at dispatch from base `eb258d5`, availability verified. The new package directory is approved; existing frozen `contracts/` owns pipeline A–F contracts; P1 must not edit it or invent another ShapingResult/receipt format.

The coordinator records defaults/gaps in the linked shaping-decisions file under the September7 authority; those decisions and accepted P0 compatibility are recorded (activation above). Builder Step 0 restated exact source SHA, consumers, shapes, write ceiling, assurance limits, verification commands and blockers and was coordinator-confirmed 2026-09-27. Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

### Package and version rules

Propose private ESM `@foreman-line/kernel-contracts`, version/API `0.1.0`, Node >=22, TypeScript types and closed draft-07 JSON Schemas, pure structural/semantic validators, generated schema files and immutable source-authored fixtures. Follow existing package dependency/toolchain conventions using the merged dispatch base; exact dependency versions and lockfile are chosen there, not from stale snapshot pricing/version knowledge. Only the existing schema-scaffold generation helper may be imported across package boundaries through its actual reviewed relative export. Runtime validators have no filesystem/network/time/process side effects; CLI generation is an explicit build operation only. No evaluator/policy implementation is hidden in a validator.

Version mismatch produces a typed unsupported-version protocol failure; no silent default/downgrade. Unknown fields, unknown enum values and missing required data fail structural validation. Additive optional fields require a negotiated newer version before use; current closed schemas remain closed. Renaming/removing fields, changing outcomes or widening meanings requires a new contract version and reviewed consumer migration.

### Common primitives and bounded representation

IDs are nonempty ASCII strings of at most 128 characters from letters/digits/dot/underscore/hyphen; they identify records, never authenticate callers. Digests are tagged SHA-256 values with exactly 64 lowercase hex characters. Revisions/counters are nonnegative safe integers; timings are nonnegative integer microseconds; reject NaN/infinities, negative zero, unsafe numbers and unpaired Unicode surrogates. UTF-8 wire requests/results are at most 1 MiB; depth <=16; each string <=65,536 UTF-8 bytes, each array <=256 members, violations/obligations <=64 each. Narrower field limits override general limits; reject over-limit input before expensive traversal. Overflow is a protocol error, not truncation of a refusal list.

Proposed deterministic digest domain: `{domain, apiVersion, payload}` encoded as UTF-8 canonical JSON with recursively sorted object keys (UTF-16 code-unit order), preserved array order and JSON string escaping; allowed numeric domain is the safe integers above. No Unicode normalization or path case folding occurs in hashing. Domain separation distinguishes request, effective-input, policy and scope digests. Specify exact excluded transport-only fields; raw capability credentials are excluded entirely. Fixtures bind canonical bytes and hashes. Reconcile with accepted P0 canonicalization before activation; no assertion of an existing interchangeable helper API is made.

### Lifecycle and trust split

Wire `LifecycleEvent` is a closed discriminated union: `sessionStart`, `preToolUse`, `postToolUse`, `stop`. Common fields: apiVersion, eventId, sessionRef, hostAdapterRef, claimedRepositoryRef, claimedWorktreeRef, actionRef, claimedActionClass (`read-only | governed-mutation | opaque-mutation-capable | lifecycle-only`) and bounded event-specific payload. This caller classification is untrusted context, never the effective action class. P16 supplies authenticated lifecycle provenance through the admitted host boundary; P12 derives effective classification from the admitted operation/tool identity and normalized semantics. Unknown or conflicting semantics cannot become read-only: refuse the ambiguous action or conservatively classify it as mutation-capable under the reviewed engine contract. The wire cannot select effective classification or shadow/enforcing/degraded mode. Pre-event paths are proposed targets, not evidence of a realpath; post-event supplies observed diff/effect descriptors, not permission for what occurred. Stop includes a requested completion subject, never a caller-written completed gate.

Wire clients cannot supply `admittedContext`, authenticated principal, verified evidence, authority-satisfaction booleans, trusted time, resolved repository handles or lease ownership. Separate internal `AdmittedContext` describes principalRef, principalClass, capabilityRef, admissionIssuerRef, admitted endpoint, bound repository/worktree/session, permitted operation IDs, capability generation/revocation context and authenticated provenance reference. A schema-valid serialized context is never proof of admission; P13 must construct/use it inside its protected boundary after authenticating the separate local control endpoint/capability. Read-surface discovery cannot reveal control tools. Local capability admission grants no Git/human-gate authority.

Anonymous content-only read uses a separate principal variant with no control capability or operation set. Authenticated read capabilities are endpoint/repository bound and cannot be substituted for control admission. No raw credential is included in events, digests, fixtures, evidence logs or envelopes.

### authorizeAction contract and decision envelope

P1 defines the input/output contract; **FK-P12 implements authorizeAction**. Internal input combines lifecycle event, admitted context, authenticated lifecycle provenance, trusted effective action classification, authoritative repository/worktree identity, validated policy/scope digests, goalRevision, injected lease/CAS state, canonical Git gate-evidence references, trusted mode (`shadow | enforcing | degraded-read-only`) and observed effects. Effective classification is derived by P12 as specified above, and mode comes from authenticated runtime configuration/promotion state; neither is accepted from a caller. Inputs from callers are kept distinguishable from trusted bindings. Lease/transition types are boundary descriptors pending P9/P10 implementation; no SQLite schema or lease algorithm is implemented here.

`DecisionEnvelope` requires apiVersion, toolVersion, decision (`ALLOW | REFUSE | ADVISORY | APPLIED | NOOP | CONFLICT | REQUIRE_HUMAN`), stable code, structured violations, requestDigest, inputDigest, policyDigest, principal variant, assuranceLevel and obligations; goalRevision is required for state-bound decisions. Each violation has code, invariantId and bounded safe field/path descriptor; no echoed credential/source payload. Obligations have stable IDs and typed payloads for post-diff inspection, fresh SCM evidence, stop-report emission, degraded-read logging and latency recording.

authorizeAction is observational: it may return ALLOW/REFUSE/ADVISORY/CONFLICT/REQUIRE_HUMAN, never APPLIED. APPLIED/NOOP belong to later effect/transition consumers with separate idempotency semantics, not permission requests. State transitions require principal/operation/repository/worktree/payload-digest-bound idempotency keys; same key/different binding conflicts, same completed binding returns recorded result without repeating effects. P1 specifies that interface only.

Policy refusal is a successful structured result. Malformed requests, unsupported versions and internal kernel failure are typed protocol errors to be mapped to MCP errors by P6/P13. The adapter maps an absent/failed/timed-out decision to kernel-unreachable posture; it never fabricates a successful server response or ALLOW. Gate state is derived from canonical digest-bound Git evidence, not SQLite flags. Human-only completion yields REQUIRE_HUMAN plus an agent-completable stop report/awaiting-human transition description; no endless Stop-hook retry.

Assurance is a closed union distinguishing `structural`, `mediated`, `detected-only`, `ci-enforced`, `human-judgment`, `unsupported-host`, and `degraded-read-only`. These proposed wire labels need explicit mapping to accepted P0 labels before activation; do not conflate source ratification with runtime evidence or assume identical strings. Each level has required evidence-reference fields or an explicit missing-assurance reason. Content-only validation is STRUCTURAL in user-facing semantics; it cannot claim cryptographic receipt verification or Gate3 readiness. Shadow would-refuse is advisory with `wouldDecision` metadata only for policy observations after valid admission and authorized context, never an actual hook refusal. Protocol, admission and read-confidentiality failures remain failures in shadow mode and cannot be downgraded to advisory. This metadata is required only on the shadow policy-result variant and absent elsewhere.

### Refusal and error registry

Preserve the five initial mediated groups exactly: WORKTREE_MISMATCH/BRANCH_MISMATCH; PATH_OUTSIDE_ALLOWED_FILES/FROZEN_SURFACE_MUTATION; REVIEWER_MUTATION_FORBIDDEN/REVIEW_WORKTREE_DIRTY; POLICY_SELF_MODIFICATION/MEDIATED_BYPASS_MODE_FORBIDDEN; OWNER_LEASE_MISMATCH/STATE_REVISION_STALE/GATE_NOT_SATISFIED. SESSION_ENROLLMENT_MISSING is detected-only, never a promoted hook-refusal class. No count-based redefinition or new promotion class.

Additional boundary codes are proposed protocol/contract outcomes, not promotion classes: INVALID_REQUEST, UNSUPPORTED_VERSION, PAYLOAD_LIMIT_EXCEEDED, ADMISSION_REQUIRED, CAPABILITY_SCOPE_MISMATCH, READ_BOUNDARY_VIOLATION, IDEMPOTENCY_CONFLICT and KERNEL_UNREACHABLE. A closed registry records producer, valid decision/result-kind, assurance and safe diagnostic shape per code. STATE_REVISION_STALE maps to CONFLICT for stale state/cache bindings; missing human gate maps to REQUIRE_HUMAN with GATE_NOT_SATISFIED. Kernel unreachable is adapter-observed failure with fail-closed mutation disposition, not a new server authorization grant.

Evaluation is trust-staged, not evaluate-everything-then-sort. Protocol failure stops before admission-dependent or repository/state/gate evaluation. Admission failure stops before context-dependent evaluation and returns only a safe admission diagnostic: no gate status, owner/lease identity, goalRevision, repository existence, scope contents or state-derived digests are disclosed. After valid admission, establish authorized context and read confidentiality before consulting or returning protected data. Only within that authorized context may gate/state/scope failures be aggregated, bounded and sorted by code/field. Within that stage the outcome order is human-required gate, state conflict, other refusal, advisory, allow. Anonymous content-only requests use their dedicated authorized content boundary and never trigger goal-state lookup. No ALLOW may coexist with an unsatisfied refusal/obligation prerequisite; shadow mode changes none of these trust-stage boundaries.

### D19 repository/read capability and D20 path split

`ReadRequest` is either content-only (bounded UTF-8 submitted content, no host path) or repository-read (admission-bound repoId, exact relative path, maximum requested bytes <=1 MiB). Trusted repository registration supplies one mounted read-only root, stable repository/worktree identity and access scope; the wire request never selects a root. No state volume, second repository, arbitrary absolute/drive/UNC path or non-regular file is readable. Refuse traversal, ambiguous normalization, **all symlink/reparse traversal including links whose targets remain inside the root**, and over-limit content; enforce byte limit while reading, not after unbounded allocation. Every traversed component and final target must satisfy this no-link boundary. The read contract also requires containment and file-type checks against the opened target to address resolution/use races; checking links does not replace opened-target checks. Implementation belongs to P4 and deployment isolation to P7/P14.

Host adapters report raw host paths plus declared platform/probe identity; P1 defines their normalization evidence, not a host parser. P2 owns exact Allowed Files compilation and canonical path rules; `surfaces` is never mutation scope. Host-specific normalization resolves drive/UNC/case/separator/reserved-name/reparse issues before a kernel comparison over canonical repo-relative identity; never lowercase all POSIX paths or accept string-prefix containment. P16 must prove real Windows mediation. P20 separately probes other hosts; Linux container execution and two harness shapes do not prove native Linux/Codex host parity. Unsupported host/events have explicit gaps and cannot be promoted by schema validity.

### D21 latency and cache contract

Specify `kernelDecisionLatency`: decision-surface request received to response written, measured within kernel monotonic clock. `mediatedActionLatency`: host lifecycle entry to hook exit, measured within adapter monotonic clock; no cross-process wall-clock subtraction. Warm kernel budgets are p50 <=5 ms/p95 <=20 ms/p99 <=50 ms; mediated p99 <=150 ms. Warm sample selection is explicit: completed governed-mutation decision attempts after readiness and initial invocation; report failed/deadline attempts and exclusions separately so success-only selection cannot hide failure rate. Synthetic P1 fixtures establish accounting, not measured performance. P17 chooses and records representative workload/sample count/concurrency and nearest-rank percentile calculation; no P18 result substitutes for D20 evidence.

First-call observation begins at initial lifecycle invocation (including startup/readiness work) and ends at hook exit, reported separately against <=2000 ms, never in warm percentiles. The per-decision timer begins when the adapter submits a decision request, includes transport and processing, and has a 1000 ms hard deadline. At the boundary, a fully observed response with elapsed <=1000 ms may be evaluated; if no response has completed when the deadline is processed, the decision is unreachable. Later responses cannot overwrite that terminal outcome. Startup outside request submission remains part of the cold observation and does not extend the decision timer. Budget misses record obligations; deadline loss blocks governed mutation and permits only explicitly logged degraded read-only behavior under D8.

**Recommended default: authorization-result caching disabled.** Define future cache descriptors, not a cache implementation. Every eligible entry must bind goalRevision, policyDigest and compiled-scope digest; mismatch yields STATE_REVISION_STALE, never stale ALLOW. Matching those three is necessary, not sufficient: full effective action/request, admitted principal/capability generation, repository/worktree and relevant lease/gate freshness must also match/revalidate. No TTL or matching digest substitutes for live expiry/revocation checks. P1 grants no additional cache eligibility to satisfy latency.

### Golden vectors

One fixture inventory explicitly maps each case to charter clause, producer/consumer, input trust origin, expected response kind/code/decision, assurance and obligations. Minimum independent cases cover: each of eleven named mediated codes; enrollment missing detected-only; anonymous content success/control denial; caller-forged admission; wrong/expired/revoked capability; wrong repo/worktree; each D19 path/file/size escape; host case/drive/UNC/Unicode/reparse distinctions; unsupported host/event; malformed/version/unknown/overflow errors; structural receipt honesty; shadow versus enforced result; human gate Stop completion; same-key replay/conflict; cold/warm separation; each warm percentile threshold; response exactly at/after deadline; late response after timeout; each of three cache-binding mismatches; matching triple with different principal/action/expired lease; outage mutation/degraded-read split. Separate isolated vectors cover each dimension, not a single invalid fixture containing every defect.

Additional required isolated vectors cover mutation disguised by `claimedActionClass: read-only`, unknown/conflicting tool semantics, attempted effective-class/mode weakening, forged lifecycle provenance, and a mutation attempting the degraded-read-only path. For each invalid-admission case combine independently varied gate, lease, repository and revision states: the safe admission result must remain identical in protected content and no context-dependent evaluation may occur. Also exercise those boundary failures in shadow mode. D19 includes separate in-root symlink/reparse and escaping symlink/reparse cases, both refused, plus opened-target substitution/race descriptors. Later P4/P12/P16 own process-boundary execution of these fixtures.

P1 validates fixture/schema/cross-field consistency and deterministic canonical bytes; it does not execute hypothetical engine/adapter behavior and call it runtime proof. Fixtures carry `verificationStage: contract-only` plus later owning parcel. Positive vectors are required for legitimate anonymous content, admitted contract shape, declared degraded read, and boundary timing. No golden expected ALLOW asserts live permission.

## Contract field tables (F05 — exact schemas)

These tables discharge the F05 Step0 field-table obligation recorded in `../../goals/foreman-kernel/R31-to-P1-field-reconciliation-20260907.md` ("Coordinator disposition — September 7"). They elaborate the settled behavior above (P1-R01–R03, P1-S01–S18, F01–F04) into exact schemas and change no chosen behavior. Provenance column: `F0x`, `P1-Sxx`, `P1-Rxx` cite recorded decisions; `derived (anchor)` marks schema elaboration anchored to a named constraint in this spec. **Placement:** these tables live in this spec, not a separate goals record — SPEC-CONVENTION §4 carries additional body sections, charter §15.3 requires contract inputs/outputs in the spec before a builder starts, and §4.8 `Allowed Files` is the builder's implementation mutation authority that does not govern spec content; a separate file would create a second artifact that must drift-check against the reviewed draft. All shapes below fit the fixed 25-file ceiling as `$defs` inside the listed schema files.

### F05.1 Notation, bounds, and $def placement

| Notation | Meaning | Provenance |
|---|---|---|
| `Id` | nonempty ASCII, at most 128 chars, from letters/digits/dot/underscore/hyphen; identifies records, never authenticates callers | P1-S07 |
| `Digest` | `sha256:` plus exactly 64 lowercase hex chars | F01 |
| `SafeInt` | nonnegative safe integer; NaN, infinities, negative zero and unsafe numbers rejected | P1-S07 |
| `Micros` | nonnegative integer microseconds | P1-S07 |
| `Bytes<N>` | UTF-8 string at most N bytes; default at most 65,536 | P1-S07 |
| `Array<T,N>` | array of T, at most N members; general cap 256; rule-id, violation and obligation lists cap 64 | P1-S07 |

General wire bounds for every document below: UTF-8 request/result at most 1 MiB, object depth at most 16, unknown fields/unknown enum values/missing required data fail structural validation, over-limit input rejected before expensive traversal, overflow is a protocol error and never truncation of a refusal list, unpaired Unicode surrogates rejected. Narrower field limits override general limits. (P1-S06, P1-S07)

`$def` placement inside the fixed ceiling (each schema file is closed draft-07 and carries `$defs` for the shapes named here; each shape has exactly one home): `lifecycle-event.schema.json` holds `LifecycleEvent`, `ProposedPath`, and the remaining event payload shapes (the `postToolUse` payload references `ObservedEffect` cross-file, never redefines it); `admitted-context.schema.json` holds `AdmittedContext` and the two principal variants; `authorize-action-input.schema.json` holds `AuthorizeActionInput`, `EffectiveActionClass`, `PolicyIdentity`, `LeaseCasDescriptor`, `GitGateEvidenceRef`, `ObservedEffect` (the unique home of `ObservedEffect`); `decision-envelope.schema.json` holds `WireCode` (referenced from `DecisionEnvelope.code`, `Violation.code` and `GoldenVectorCase.expectedCode`), `DecisionEnvelope` (policy-result and shadow-policy-result variants), `PrincipalProjection`, `ProtocolError`, `UpstreamPolicyEvidence`, `AssuranceClaim`, `AssuranceEvidenceRef`, `EffectResult`, `IdempotencyBinding`, `Violation`, `Obligation` (the five per-kind obligation payload shapes are inlined under `Obligation` here); `repository-read-request.schema.json` holds `ReadRequest`; `host-capability.schema.json` holds `HostCapability`; `latency-contract.schema.json` holds `LatencyContract` and `CacheDescriptor`; `golden-vector.schema.json` holds `GoldenVectorFixture` and `GoldenVectorCase`. Every `$ref` used by these files resolves to a named `$defs` entry in exactly one of them; no shape referenced from a schema file is left types.ts-only. (derived (F05); 25-file ceiling, P1-S01; rework R2, Q2, Q3)

### F05.2 LifecycleEvent wire shapes

#### LifecycleEvent (all four variants)

Discriminant field `event` (closed): `sessionStart`, `preToolUse`, `postToolUse`, `stop`; unknown value fails structural validation. (P1-S05)

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| event | enum(sessionStart, preToolUse, postToolUse, stop) | required | discriminant | P1-S05 |
| apiVersion | literal string `0.1.0` | required | mismatch yields UNSUPPORTED_VERSION; no silent default or downgrade | P1-S06 |
| eventId | Id | required | unique per event | derived (common-fields prose) |
| sessionRef | Id | required | caller-claimed session identity, untrusted | derived (common-fields prose) |
| hostAdapterRef | Id | required | untrusted declared adapter identity | derived (common-fields prose) |
| claimedRepositoryRef | Id or null | required key, nullable | untrusted claim; null when no repository is claimed | derived (common-fields prose) |
| claimedWorktreeRef | Id or null | required key, nullable | untrusted claim | derived (common-fields prose) |
| actionRef | Id | required | untrusted action identity | derived (common-fields prose) |
| claimedActionClass | enum(read-only, governed-mutation, opaque-mutation-capable, lifecycle-only) | required | untrusted caller classification; never the effective action class; never selects mode | P1-R01 |
| payload | per-variant object below | required | bounded event-specific payload | P1-S05 |

No field on this shape can carry `admittedContext`, authenticated principal, verified evidence, authority-satisfaction booleans, trusted time, resolved repository handles, lease ownership, effective classification or mode; such members fail structural validation as unknown fields. (P1-S04, P1-R01)

#### sessionStart payload

Empty closed object, no fields. (derived (P1-S05 neutral variant; no sessionStart-specific data is contract-relevant)).

#### preToolUse payload

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| toolRef | Id | required | untrusted tool identity as invoked | derived (pre-event prose) |
| proposedPaths | Array<ProposedPath, 64> | required, may be empty | proposed targets only, never realpath evidence | derived (pre-event prose) |

`ProposedPath`: `rawPath` (Bytes<4096>, raw host path as reported), `pathForm` (enum(windows-drive, windows-unc, posix-absolute, other)), both required. (derived (D20 raw-path reporting)).

#### postToolUse payload

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| toolRef | Id | required | untrusted tool identity as invoked | derived (post-event prose) |
| observedEffects | Array<ObservedEffect, 64> | required, may be empty | observed diff/effect descriptors; never permission for what occurred | P1-S05 |

`ObservedEffect`: `effectKind` (enum(diff, file-write, file-delete, process-exit, unknown)), `descriptor` (Bytes<4096>), `digest` (Digest or null); all keys required. (derived (post-event prose)).

#### stop payload

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| requestedCompletionSubject | Id | required | untrusted requested completion subject; never a caller-written completed gate | derived (stop prose) |

### F05.3 AdmittedContext internal shapes

A schema-valid serialized `AdmittedContext` is never proof of admission; P13 constructs and consumes it inside its protected boundary after authenticating the separate local control endpoint/capability. (P1-S04)

#### AdmittedContext — principalKind `authenticated`

Discriminant field `principalKind` (closed): `authenticated`, `anonymous-content`. (derived (F05); principal-variant prose).

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| principalKind | literal `authenticated` | required | discriminant | derived (F05) |
| principalRef | Id | required | identifies, never authenticates | P1-S04 |
| principalClass | P0 PrincipalClass minus anonymous-read | required | verbatim P0 vocabulary: coordinator, shaper, builder, human-developer, independent-reviewer, ci-service, host-adapter, kernel-operator | P1-S04, F04 |
| capabilityRef | Id | required | local control or read capability identity | P1-S04 |
| capabilityGeneration | SafeInt | required | generation/revocation counter; freshness must be live-checked | P1-S04, P1-S16 |
| capabilityValidUntilMicros | Micros or null | required key, nullable | expiry bound; no TTL substitutes for live revocation checks | P1-S16 |
| capabilityRevocationRef | Id or null | required key, nullable | revocation context reference | derived (generation/revocation prose) |
| admissionIssuerRef | Id | required | admitting control-plane issuer (P13) | P1-S04 |
| admittedEndpoint | enum(control, read) | required | read capability can never substitute for control admission | P1-S04 |
| boundRepositoryRef | Id or null | required key, nullable | repository binding | P1-S04 |
| boundWorktreeRef | Id or null | required key, nullable | worktree binding | P1-S04 |
| boundSessionRef | Id | required | session binding | P1-S04 |
| permittedOperationIds | Array<Id, 64> | required, may be empty | admitted operation IDs; distinct namespace from the seven governance OperationIds | F04 |
| roleSelection | P0 RoleScope minus any | required | explicit context-specific role; kernel-operator selects exactly kernel or operator, never both, never widened | F04 |
| stageSelection | P0 StageScope minus any | required | explicit stage context for query projection; `any` never projected | derived (F04 pattern) |
| provenanceRef | object: provenanceId (Id), hostAdapterRef (Id), provenanceDigest (Digest) | required | authenticated lifecycle provenance supplied by P16 | P1-R01 |

#### AdmittedContext — principalKind `anonymous-content`

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| principalKind | literal `anonymous-content` | required | discriminant | derived (F05) |
| principalClass | literal `anonymous-read` | required | verbatim P0 vocabulary | F04 |
| admittedEndpoint | literal `read` | required | content-only boundary | F04 |
| boundSessionRef | Id or null | required key, nullable | session binding | derived (F05) |

Explicitly absent (unknown fields, structural failure): `capabilityRef`, `permittedOperationIds`, `roleSelection`, `stageSelection`, `boundRepositoryRef`, `boundWorktreeRef`, `provenanceRef`. Anonymous content has no control capability, no operation set and no control query; it never triggers goal-state lookup. For anonymous content-only requests the binding-scope rule (F05.4) additionally mandates `trustedBindings.idempotencyKey` be null — content-only reads have no defined binding semantics. (F04, P1-S04; coordinator ruling 2026-09-27 on re-review Q1)

### F05.4 AuthorizeActionInput

`FK-P12 implements authorizeAction`; P1 fixes this input contract only. Caller-supplied and trusted inputs live in separate named blocks so they stay distinguishable. (P1-S09, input prose).

#### AuthorizeActionInput

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| callerInputs.lifecycleEvent | LifecycleEvent | required | untrusted-origin block; the only caller-authored member | P1-R02 (inputs distinguishable) |
| trustedBindings.admittedContext | AdmittedContext | required | P13-constructed; serialized form never authenticates | P1-S04 |
| trustedBindings.lifecycleProvenance | object: provenanceId (Id), hostAdapterRef (Id), provenanceDigest (Digest) | required | authenticated provenance, never caller-written | P1-R01 |
| trustedBindings.effectiveActionClass | EffectiveActionClass | required | derived by P12 from admitted operation/tool identity and normalized semantics; never from claimedActionClass | P1-R01 |
| trustedBindings.repositoryIdentity | object: repositoryRef (Id), worktreeRef (Id) | required key, nullable for content-only | authoritative repository/worktree identity | input prose |
| trustedBindings.policyDigest | Digest | required | preimage F05.6 | F01, F05 |
| trustedBindings.scopeDigest | Digest or null | required key, nullable for content-only | compiled-scope digest; preimage owned by FK-P2, P1 binds the value only | F05 (scope FK-P2-owned) |
| trustedBindings.goalRevision | SafeInt or null | required key, nullable for content-only | state revision; owned by state parcels, not P1 | F05 (goalRevision state-owned) |
| trustedBindings.leaseState | LeaseCasDescriptor | required | injected boundary descriptor; no SQLite schema or lease algorithm here | P1-S09 |
| trustedBindings.gateEvidenceRefs | Array<GitGateEvidenceRef, 64> | required, may be empty | canonical digest-bound Git gate evidence; never SQLite flags | gate prose |
| trustedBindings.mode | enum(shadow, enforcing, degraded-read-only) | required | from authenticated runtime configuration/promotion state; never caller-selected | P1-R01 |
| trustedBindings.observedEffects | Array<ObservedEffect, 64> | required, may be empty | post-tool observations; never permission | P1-S05 |
| trustedBindings.idempotencyKey | IdempotencyBinding or null | required key, nullable | TRANSITION-ONLY: MUST be null unless the request is state-bound (transition/effect evaluation with anchored authenticated principal, repository and worktree identity); anonymous content-only MUST carry null; non-null binding unanchorable to the admitted context and repository identity is a structural failure before any evaluation | P1-S09, coordinator ruling 2026-09-27 (re-review Q1) |

`EffectiveActionClass` (closed enum): `read-only`, `governed-mutation`, `mutation-capable`, `lifecycle-only`. Derivation: P12 classifies from admitted operation/tool identity and normalized semantics; unknown or conflicting semantics classify conservatively as `mutation-capable`, never `read-only`; the claim never determines the effective class; attempted effective-class or mode weakening is refused as INVALID_REQUEST at the wire boundary. (P1-R01).

`LeaseCasDescriptor` (boundary descriptor pending P9/P10): `leaseId` (Id or null), `leaseOwnerPrincipalRef` (Id or null), `casRevision` (SafeInt), `leaseExpiresAtMicros` (Micros or null); all keys required. (derived (lease/CAS injection prose, P1-S09)).

`GitGateEvidenceRef`: `evidenceKind` (enum(commit-ref, signature, status-check, merge-record)), `gitIdentity` (Bytes<256>), `digest` (Digest); all keys required. (derived (canonical Git gate-evidence prose)).

`IdempotencyBinding`: `principalRef` (Id), `operationId` (Id), `repositoryRef` (Id), `worktreeRef` (Id), `payloadDigest` (Digest); all keys required. Same key with different binding yields IDEMPOTENCY_CONFLICT; same completed binding returns the recorded result without repeating effects. (P1-S09).

**Binding scope (transition-only).** Idempotency bindings are TRANSITION-ONLY: `trustedBindings.idempotencyKey` MUST be null unless the request is state-bound (transition/effect evaluation with an anchored authenticated principal, repository identity and worktree identity); anonymous content-only requests MUST carry null; a non-null binding whose `principalRef`, `repositoryRef` or `worktreeRef` cannot be anchored to the request's admitted context and repository identity is a structural failure rejected before any evaluation, surfaced as `INVALID_REQUEST` (protocol-error result kind; safe diagnostic `field path only`) per F05.12. Content-only reads have no defined binding semantics. (coordinator ruling 2026-09-27 on re-review Q1; code mapping per coordinator ruling 2026-09-27 Step-0 F3; P1-S09).

### F05.5 Digest rules (F01)

P1 digest literal: `sha256:` plus exactly 64 lowercase hex characters. Encode/decode is explicit at the package boundary; embedded upstream values are never retagged or recomputed. (F01, coordinator disposition).

Canonical encoder (the only hashing path for new P1 digests). The encoder is byte-total: every value has exactly one valid byte encoding, produced by this complete rule set applied to the validated document (absent optional members are omitted before encoding; required nullable members are serialized as `null`).

1. Structural framing (compact form): no insignificant whitespace anywhere; object and array separators are exactly `,` and `:` with no surrounding spaces; objects are written `{`…`}` and arrays `[`…`]` with no interior padding.
2. Member order: object keys sorted recursively by UTF-16 code-unit order at every depth; array order preserved exactly as validated.
3. Strings: exactly the JSON.stringify escape set of the validated document — quotation mark, reverse solidus and control characters U+0000–U+001F escaped (the controls as `\u00XX` lowercase hex); every other code unit emitted literally as UTF-8; no other escapes (no escaped solidus, no `\u` escapes for non-ASCII).
4. Numbers: bound to the `SafeInt` domain (nonnegative safe integers) restated here: every encoded number is an integer in the closed range 0 to 2^53−1; NaN, ±Infinity, negative zero, fractions, exponents and unsafe integers are rejected before hashing. Integer lexeme: digits only, no sign, no leading zeros except the value `0` itself.
5. Atoms: `true`, `false` and `null` as bare lexemes.
6. Wrapper and hash: the encoded document is `{domain, apiVersion, payload}` written under rules 1–5, encoded as UTF-8 without BOM, hashed with SHA-256, emitted as 64 lowercase hex characters and tagged `sha256:`.

No Unicode normalization of keys or values and no path case folding occurs anywhere in hashing. `apiVersion` in every preimage is the literal `0.1.0`. (F01, P1-S08, derived (byte-level pin of the stated "JSON string escaping" rule); rework R1/R4).

| Digest | domain literal | payload | Owner | Provenance |
|---|---|---|---|---|
| requestDigest | `foreman-line.kernel-contracts.request` | the validated wire request document (LifecycleEvent or ReadRequest) | P1 | F01, P1-S08 |
| inputDigest | `foreman-line.kernel-contracts.effective-input` | the validated AuthorizeActionInput document | P1 | F01, P1-S08 |
| policyDigest | `foreman-line.kernel-contracts.policy` | PolicyIdentity per F05.6 | P1 | F05 (preimage obligation) |
| registryContentDigest | `foreman-line.kernel-contracts.registry-content` | the accepted registry document as pinned at activation | P1 encoding; value recorded at activation | F05 |
| effectivePolicyDigest | `foreman-line.kernel-contracts.effective-policy` | the effective authorization-policy document consumed by the decision | policy-producing parcel supplies content; P1 defines encoding | F05 |
| effectiveConfigurationDigest | `foreman-line.kernel-contracts.effective-configuration` | the effective runtime-configuration document (mode/promotion, cache posture, host bindings) | runtime configuration owner | F05 |
| compiledScopeDigest | domain owned by FK-P2 | FK-P2-defined | FK-P2 | F05 (scope FK-P2-owned) |

Excluded transport-only fields, enumerated exactly: JSON-RPC/MCP envelope members (`jsonrpc`, `id`, `method`), transport headers and connection/channel identifiers, adapter process identifiers, and kernel receipt timestamps (`receivedAtMicros` and equivalents). Raw capability credentials are excluded entirely and never appear in any event, digest, fixture, evidence log or envelope. None of these fields is ever part of the validated request document, so none enters `requestDigest`. (digest prose, P1-S08).

Embedded P0 reference shapes — three distinct shapes, preserved verbatim, never conflated (F01):

| Shape | Fields (verbatim P0) | Digest semantics (unchanged from upstream) | Meaning | Provenance |
|---|---|---|---|---|
| SourceRef | sourceId (string), itemId (string), locatorDigest (string), valueDigest (string) | P0 `sha256` output: untagged 64 lowercase hex, computed with P0 `canonicalJson` which NFC-normalizes string values and does not normalize keys | source authority basis | F01 |
| SnapshotEvidence | commit (string), fullFileSha256 (string) | untagged file SHA-256 of the source file at the commit | file snapshot at commit | F01 |
| EvidenceRef | kind (P0 EvidenceKind: predicate-contract, negative-test, corpus-sweep, independent-bypass), path (string), digest (string) | untagged artifact digest | retirement/process evidence artifact | F01 |

These values are embedded in the pinned registry document inside PolicyIdentity and in golden-vector evidence references; they are never retagged to `sha256:`, never recomputed with the P1 encoder, and never converted among the three shapes. A source authority basis is not a runtime verification receipt or a retirement artifact. (F01).

### F05.6 policyDigest preimage (byte level)

`policyDigest` is a separately versioned P1 policy identity; `sourceSnapshotCommit` alone is explicitly insufficient. `PolicyIdentity` is a named `$defs` entry of `authorize-action-input.schema.json` (the file that owns the policyDigest preimage shape), addressed as `$ref: authorize-action-input.schema.json#/$defs/PolicyIdentity`. The preimage bytes are exactly the UTF-8 encoding of the canonical JSON (F05.5) of `{domain: "foreman-line.kernel-contracts.policy", apiVersion: "0.1.0", payload: PolicyIdentity}`; nothing else is hashed. (F05, F01; rework R2).

#### PolicyIdentity

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| policyIdentityVersion | literal `0.1.0` | required | separately versioned P1 policy identity | F05 |
| registry.registryId | literal `foreman-kernel-authority-enforcement` | required | verbatim P0 registry identity | F05 |
| registry.schemaVersion | literal `0.1.0` | required | verbatim P0 registry schema version | F05 |
| registry.sourceSnapshotCommit | string | required | verbatim P0 field; never alone sufficient | F05 |
| registry.registryContentDigest | Digest | required | content pin over the accepted registry document (domain `foreman-line.kernel-contracts.registry-content`) | F05 |
| effectivePolicyDigest | Digest | required | domain `foreman-line.kernel-contracts.effective-policy` | F05 |
| effectiveConfigurationDigest | Digest | required | domain `foreman-line.kernel-contracts.effective-configuration` | F05 |

Invariants: `policyDigest` MUST change whenever the registry content pin or either effective identity changes; `goalRevision` is excluded (state-owned, bound separately); `compiledScopeDigest` is excluded (FK-P2-owned, bound separately in the cache triple). The exact digest values for the three identity members are activation/runtime-owned and recorded with the accepted P0 merge; their preimages are fixed here. (F05).

### F05.7 UpstreamPolicyEvidence (P0 resolution preserved)

Typed component carried on admitted decision results; every value below is the verbatim P0 resolution field. `subject` carries P0 `authoritySubject` and `claim` carries P0 `authorityClaim` byte-for-byte. This component is forbidden on protocol errors. (F02, F03).

#### UpstreamPolicyEvidence — outcome `RESOLVED`

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| outcome | literal `RESOLVED` | required | discriminant | F03 |
| subject | string | required | verbatim P0 authoritySubject | F03 |
| claim | string | required | verbatim P0 authorityClaim | F03 |
| decision | enum(ALLOW, REFUSE, ADVISORY, REQUIRE_HUMAN) | required | P0 resolved-decision subset; P0 resolution has no CONFLICT outcome | F03 |
| classification | P0 RuleClassification (verbatim) | required | pre-action-refusal, post-action-detection, ci-static-check and the remaining P0 values verbatim | F03 |
| assurance | P0 AssuranceLevel (verbatim) | required | narrative, structural, detected, mediated, independently-verified, human-ratified; source labels only | F02 |
| enforcementOwner | P0 EnforcementOwner (verbatim) | required | the nine P0 values verbatim | F03 |
| severity | P0 Severity (verbatim) | required | info, low, medium, high, critical | F03 |
| controllingRuleIds | Array<Id, 64> | required, may be empty | more than 64 entries is a PAYLOAD_LIMIT_EXCEEDED protocol error; never truncated | F05 (64-entry rule) |
| consideredRuleIds | Array<Id, 64> | required, may be empty | same overflow rule | F05 (64-entry rule) |

#### UpstreamPolicyEvidence — outcome `REQUIRE_HUMAN` (unresolved)

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| outcome | literal `REQUIRE_HUMAN` | required | unresolved variant, distinct from RESOLVED with decision REQUIRE_HUMAN | F03 |
| subject | string | required | verbatim P0 authoritySubject | F03 |
| reasonCode | enum(REGISTRY_INVALID, INVALID_QUERY_SCOPE, NO_APPLICABLE_AUTHORITY) | required | typed retained P0 reason | F03 |
| controllingRuleIds | literal empty array | required | P0 fixes this empty | F03 |
| consideredRuleIds | Array<Id, 64> | required, may be empty | 64-entry overflow rule applies | F05 |

This component lacks decision-making power: a P0 ALLOW is never sufficient evidence that P12 may allow a mediated action, and registry contradictions never become stale-state CONFLICT. The unresolved outcome is never labeled GATE_NOT_SATISFIED. (F03, resolution notes).

### F05.8 DecisionEnvelope (authorized decision stage only)

Defined only for results produced after valid admission and established authorized context; nothing here is produced for protocol or admission failures (F03). Discriminant `resultKind` (closed): `policy-result`, `protocol-error`, `effect-result`.

#### DecisionEnvelope — policy-result variant

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| resultKind | literal `policy-result` | required | discriminant | F03 |
| apiVersion | literal `0.1.0` | required | contract version owned by kernel-contracts | P1-S06 |
| toolVersion | Bytes<128> ASCII | required | owned by the emitting tool implementation (P6/P13/P16), never used for contract negotiation | derived (envelope prose) |
| decision | enum(ALLOW, REFUSE, ADVISORY, CONFLICT, REQUIRE_HUMAN) | required | APPLIED/NOOP forbidden here | P1-S09 |
| code | WireCode (F05.12) | required | registry constrains valid decision/mode per code | refusal-registry prose |
| violations | Array<Violation, 64> | required, may be empty | overflow is a protocol error, never truncation | P1-S07 |
| requestDigest | Digest | required | F05.5 | F01 |
| inputDigest | Digest | required | F05.5 | F01 |
| policyDigest | Digest | required | F05.6 | F05 |
| principal | PrincipalProjection (discriminated union below) | required | safe projection only; no credential or authority booleans; charter §5 authenticated-principalRef-or-anonymous-classification rule | envelope prose, P1-S04, charter §5 |
| assurance | AssuranceClaim (F05.9) | required | derived independently from request evidence | F02 |
| obligations | Array<Obligation, 64> | required, may be empty | overflow is a protocol error | P1-S07 |
| goalRevision | SafeInt | conditional | required exactly for state-bound decisions (state/lease/gate/effect evaluation); absent otherwise, e.g. anonymous content-only. "State-bound" means results whose code is in the state/lease/gate/effect family (STATE_REVISION_STALE, lease conflicts, GATE_NOT_SATISFIED, EFFECT_APPLIED/EFFECT_NOOP); policy-decision results (POLICY_ALLOW, mediated refusals) never require goalRevision — coordinator ruling 2026-09-27 (dual-review L2-2) | envelope prose |
| policyEvidence | UpstreamPolicyEvidence or null | required key, nullable | nullable only for anonymous content-only results; forbidden on protocol errors | F02, F03 |
| mode | enum(shadow, enforcing, degraded-read-only) | required | trusted echo of runtime configuration/promotion state | P1-R01 |
| wouldDecision | enum(ALLOW, REFUSE, ADVISORY, CONFLICT, REQUIRE_HUMAN) | required if and only if mode is shadow; absent otherwise | the only shadow-specific metadata field; never an actual hook refusal; shadow never downgrades protocol, admission or read-confidentiality failures | P1-S17, P1-R02 |

Shadow policy-result semantics: `decision` is ADVISORY; `code` carries the evaluated policy code exactly as enforcing mode would emit so shadow/enforced pairs compare directly; `wouldDecision` is the only shadow metadata (no wouldViolations, wouldObligations or would-envelope). Metadata required only on this variant and absent elsewhere. (derived (shadow prose reading); P1-S17).

#### PrincipalProjection (discriminated union; $def of decision-envelope.schema.json)

Discriminant `principalClass` (closed): `anonymous-read` selects the anonymous variant; every other P0 `PrincipalClass` value selects the authenticated variant. Charter §5 mandates authenticated `principalRef` OR anonymous-read classification — never both, never neither. (F05 rework R3; charter §5).

Authenticated variant (`principalClass` = coordinator, shaper, builder, human-developer, independent-reviewer, ci-service, host-adapter, kernel-operator):

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| principalClass | P0 PrincipalClass minus anonymous-read | required | discriminant | F05.8, F04 |
| principalRef | Id | required | authenticated principal identity; identifies, never authenticates; no credential or authority booleans | envelope prose, P1-S04 |

Anonymous variant (`principalClass` = anonymous-read):

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| principalClass | literal `anonymous-read` | required | discriminant | charter §5 |

The anonymous variant carries NO `principalRef` member (unknown field, structural failure). The mandated "legitimate anonymous content" positive vector constructs exactly this union member; F04's "anonymous has no control query" is unchanged. (F05 rework R3).

#### Violation

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| code | WireCode (F05.12) | required | per-code result-kind validity applies | envelope prose |
| invariantId | Id | required | names the violated contract invariant | envelope prose |
| path | Bytes<256>, charset letters/digits/dot/underscore/hyphen/slash/brackets | required | bounded safe field/path descriptor; never an absolute or host path; no echoed credential or source payload | envelope prose |

#### Obligation

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| obligationId | Id | required | stable obligation identity | envelope prose |
| kind | enum(post-diff-inspection, fresh-scm-evidence, stop-report-emission, degraded-read-logging, latency-recording) | required | discriminant | envelope prose |
| payload | per-kind object below | required | typed payload | envelope prose |

Typed obligation payloads (each closed; all keys required):

| kind | payload fields | Provenance |
|---|---|---|
| post-diff-inspection | scopeDigest (Digest) — the FK-P2 compiled-scope digest to inspect against | derived (post-diff inspection prose) |
| fresh-scm-evidence | evidenceKind (enum(commit-ref, signature, status-check)), maxEvidenceAgeMicros (Micros or null) | derived (fresh SCM evidence prose) |
| stop-report-emission | transitionDescription (Bytes<4096>), awaitingHuman (literal true) | derived (stop report/awaiting-human prose) |
| degraded-read-logging | degradedReason (enum(kernel-unreachable, decision-deadline-exceeded, outage-mode)) | derived (degraded-read logging prose, D8 deadline rule) |
| latency-recording | span (enum(kernelDecisionLatency, mediatedActionLatency, firstCallObservation)), elapsedMicros (Micros), budgetMicros (Micros) | derived (latency recording prose, D21) |

### F05.9 AssuranceClaim (F02)

P1 `assuranceLevel` union (closed): `structural`, `mediated`, `detected-only`, `ci-enforced`, `human-judgment`, `unsupported-host`, `degraded-read-only`. Derived independently from request evidence; P0 source labels appear only inside UpstreamPolicyEvidence and are never mapped into this union. Each level requires its evidence references or an explicit missing-assurance reason. P1 contract fixtures claim `structural` only. `AssuranceClaim` and `AssuranceEvidenceRef` are named `$defs` entries of `decision-envelope.schema.json` (they hang off `DecisionEnvelope.assurance`), addressed as `$ref: decision-envelope.schema.json#/$defs/AssuranceClaim` and `$ref: decision-envelope.schema.json#/$defs/AssuranceEvidenceRef`. (F02, P1-S11; rework R2).

#### AssuranceClaim

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| assuranceLevel | enum(structural, mediated, detected-only, ci-enforced, human-judgment, unsupported-host, degraded-read-only) | required | closed P1 runtime union | F02 |
| evidence | Array<AssuranceEvidenceRef, 8> | required, may be empty | nonempty exactly when missingAssuranceReason is null | derived (evidence-or-reason prose) |
| missingAssuranceReason | enum(evidence-not-yet-produced, producer-out-of-scope, evidence-unavailable, degraded-posture) or null | required key, nullable | explicit missing-assurance reason when evidence is absent | derived (evidence-or-reason prose) |

Required evidence kind per level (exactly one of the required evidence present, or the missing reason):

| assuranceLevel | required evidence kind | AssuranceEvidenceRef fields | Provenance |
|---|---|---|---|
| structural | contract-fixture | checkId (Id), fixtureDigest (Digest) | F02 (fixtures structural only) |
| mediated | process-run | runId (Id), hostAdapterRef (Id), runDigest (Digest) | F02 (actual host/process evidence required) |
| detected-only | detection | detectorId (Id), detectionDigest (Digest) | F02 (current subject/run/producer evidence) |
| ci-enforced | ci-run | workflowRef (Id), runDigest (Digest) | F02 (no P0 equivalent) |
| human-judgment | git-gate-artifact | gateArtifactRef (Id), gitEvidenceDigest (Digest) | F02 (source human-ratified is not this) |
| unsupported-host | host-probe | probeId (Id), probeDigest (Digest) | F02 (runtime posture outcome) |
| degraded-read-only | posture-record | postureEventId (Id), postureDigest (Digest) | F02 (runtime posture outcome) |

P0-to-P1 assurance relationship (normative; no total renaming function exists):

| P0 label | Permitted relationship to P1 | Provenance |
|---|---|---|
| narrative | source provenance only; no runtime assurance conversion | F02 |
| human-ratified | ratified source intent only; establishes no human-judgment outcome, gate completion or runtime satisfaction | F02 |
| structural | consistent with structural-only checks when the P1 check itself establishes them; does not authenticate admission | F02 |
| detected | candidate detected-only evidence only when current subject/run/producer evidence is validated | F02 |
| mediated | candidate mediated category only with actual applicable host/process evidence; the label alone is insufficient | F02 |
| independently-verified | requires inspection of producer, subject, mechanism and evidence; never blindly maps to human-judgment or ci-enforced | F02 |
| (no P0 equivalent) | unsupported-host and degraded-read-only are P1 runtime posture outcomes, never promotions from source metadata | F02 |

### F05.10 ProtocolError (closed, separate from DecisionEnvelope)

Result of malformed/version/admission/internal failures at the trust-staged boundary; mapped to MCP errors by P6/P13. Transport-safe correlation fields only. (F03).

#### ProtocolError

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| resultKind | literal `protocol-error` | required | discriminant | F03 |
| protocolCode | enum(INVALID_REQUEST, UNSUPPORTED_VERSION, PAYLOAD_LIMIT_EXCEEDED, ADMISSION_REQUIRED, CAPABILITY_SCOPE_MISMATCH, READ_BOUNDARY_VIOLATION, KERNEL_INTERNAL_FAILURE) | required | KERNEL_UNREACHABLE is adapter-observed and excluded here | F03, boundary-code prose |
| safeDiagnostic | Bytes<256> ASCII | required | bounded safe diagnostic only: no gate status, owner/lease identity, goalRevision, repository existence, scope contents or state-derived digests | P1-R02 |
| correlationRef | Id or null | required key, nullable | transport-safe correlation id of the failing request when parseable | F03 |
| apiVersion | Bytes<32> or null | required key, nullable | received version value when parseable | derived (F03 transport-safe correlation) |
| toolVersion | Bytes<128> ASCII | required | emitting tool version | derived (F03) |

Explicitly forbidden on this variant: synthetic trusted principal, `principal`, `goalRevision`, `requestDigest`, `inputDigest`, `policyDigest`, gate metadata, `policyEvidence`, `violations`, `obligations`, `wouldDecision`. Protocol failure stops before admission-dependent and repository/state/gate evaluation; admission failure stops before context-dependent evaluation; both remain failures in shadow mode. (F03, P1-R02).

### F05.11 EffectResult (APPLIED/NOOP — declared, observational-only in P1)

Belongs to later effect/transition consumers with separate idempotency semantics; never a permission request and never returned by authorizeAction. P1 declares the shape only. (P1-S09, F03).

#### EffectResult

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| resultKind | literal `effect-result` | required | discriminant | F03 |
| apiVersion | literal `0.1.0` | required | | P1-S06 |
| toolVersion | Bytes<128> ASCII | required | | derived (F05.8 parity) |
| decision | enum(APPLIED, NOOP) | required | observational-only in P1 | F03 |
| code | enum(EFFECT_APPLIED, EFFECT_NOOP) | required | closed codes declared with the variants | derived (F05) |
| idempotencyKey | IdempotencyBinding | required | principal/operation/repository/worktree/payload-digest bound | P1-S09 |
| effectDigest | Digest or null | required key, nullable | digest of the recorded effect result | derived (F05) |
| goalRevision | SafeInt | required | state-bound by definition | envelope prose |

### F05.12 Wire code registry and P1/P0 mapping

Closed `WireCode` union (28 values): the eleven mediated codes, SESSION_ENROLLMENT_MISSING, the eight named boundary codes, KERNEL_INTERNAL_FAILURE, POLICY_ALLOW, POLICY_ADVISORY, POLICY_RESOLUTION_UNRESOLVED, POLICY_PROJECTION_UNMAPPED, HUMAN_JUDGMENT_REQUIRED, EFFECT_APPLIED, EFFECT_NOOP. `KERNEL_INTERNAL_FAILURE` and the POLICY_*/HUMAN_JUDGMENT_REQUIRED family are explicit non-gate internal policy-resolution/contract codes sanctioned by the F05 disposition; none is a promotion class. (refusal-registry prose, F03, F04, F05).

| Code | Producer | Result kind | Allowed decision | P0 correspondence | Safe diagnostic shape | Provenance |
|---|---|---|---|---|---|---|
| WORKTREE_MISMATCH | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 1 | repo-relative worktree descriptor only | refusal-registry prose |
| BRANCH_MISMATCH | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 1 | branch name only | refusal-registry prose |
| PATH_OUTSIDE_ALLOWED_FILES | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 2 | repo-relative path descriptor only | refusal-registry prose |
| FROZEN_SURFACE_MUTATION | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 2 | repo-relative path descriptor only | refusal-registry prose |
| REVIEWER_MUTATION_FORBIDDEN | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 3 | operation class only | refusal-registry prose |
| REVIEW_WORKTREE_DIRTY | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 3 | worktree descriptor only | refusal-registry prose |
| POLICY_SELF_MODIFICATION | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 4 | policy target id only | refusal-registry prose |
| MEDIATED_BYPASS_MODE_FORBIDDEN | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 4 | mode name only | refusal-registry prose |
| OWNER_LEASE_MISMATCH | P12 | policy-result | REFUSE (shadow: ADVISORY with wouldDecision REFUSE) | mediated group 5 | lease id only | derived (group-5 refusal default) |
| STATE_REVISION_STALE | P12 | policy-result | CONFLICT | mediated group 5; stale state/cache bindings | revision numbers only | refusal-registry prose |
| GATE_NOT_SATISFIED | P12 | policy-result | REQUIRE_HUMAN | mediated group 5; missing human gate only, inside authorized context | gate id only | refusal-registry prose |
| SESSION_ENROLLMENT_MISSING | P16/P17 detector | policy-result | ADVISORY | none; detected-only, never a promoted hook-refusal class | enrollment id only | derived (detected-only prose) |
| INVALID_REQUEST | P6/P13 boundary (incl. structurally invalid or context-unanchorable idempotency bindings per F05.4) | protocol-error | none | contract outcome | field path only | boundary-code prose; coordinator ruling 2026-09-27 (Step-0 F3) |
| UNSUPPORTED_VERSION | P6/P13 boundary | protocol-error | none | contract outcome | version literal only | boundary-code prose |
| PAYLOAD_LIMIT_EXCEEDED | validators | protocol-error | none | contract outcome; also the 64-entry rule-id/violation/obligation overflow vehicle | field name only | P1-S07, F05 |
| ADMISSION_REQUIRED | P13 | protocol-error | none | contract outcome | none beyond the fixed safe diagnostic | boundary-code prose |
| CAPABILITY_SCOPE_MISMATCH | P13 | protocol-error | none | contract outcome | capability id only | boundary-code prose |
| READ_BOUNDARY_VIOLATION | P4 reader boundary | protocol-error | none | contract outcome; failure in all modes including shadow | path-form only | boundary-code prose, P1-R02 |
| KERNEL_INTERNAL_FAILURE | kernel | protocol-error | none | typed internal kernel failure (named here; non-gate) | none | derived (internal-failure prose) |
| KERNEL_UNREACHABLE | host adapter (observed) | adapter-failure descriptor, never a server result | none; fail-closed mutation disposition | contract outcome | none | boundary-code prose |
| IDEMPOTENCY_CONFLICT | P10 transition consumer | policy-result | CONFLICT | contract outcome | binding ids only | boundary-code prose |
| POLICY_ALLOW | P12 | policy-result | ALLOW | RESOLVED decision ALLOW; never sufficient alone for a mediated action | none | derived (stable code requirement) |
| POLICY_ADVISORY | P12 | policy-result | ADVISORY | RESOLVED decision ADVISORY | bounded condition id | derived (stable code requirement) |
| POLICY_RESOLUTION_UNRESOLVED | P12 resolution step | policy-result | REQUIRE_HUMAN | typed retained P0 reasonCode REGISTRY_INVALID/INVALID_QUERY_SCOPE/NO_APPLICABLE_AUTHORITY; never GATE_NOT_SATISFIED | reason literal only | F03, F05 |
| POLICY_PROJECTION_UNMAPPED | P12 projection step | policy-result | REFUSE (fail closed) | unknown principal/role/stage/operation projection | projection member name only | F04 |
| HUMAN_JUDGMENT_REQUIRED | P12 | policy-result | REQUIRE_HUMAN | RESOLVED decision REQUIRE_HUMAN whose cause is not a missing human gate; GATE_NOT_SATISFIED remains gate-cause-only | subject id only | derived (F03 distinction) |
| EFFECT_APPLIED | P10 consumer | effect-result | APPLIED | absent from P0 Decision | none | F03 |
| EFFECT_NOOP | P10 consumer | effect-result | NOOP | absent from P0 Decision | none | F03 |

P0 resolution mapping (REQUIRE_HUMAN outcome versus RESOLVED-with-decision-REQUIRE_HUMAN distinguished):

| P0 resolution | P1 decision | P1 code | Rule | Provenance |
|---|---|---|---|---|
| unresolved outcome REQUIRE_HUMAN with reasonCode REGISTRY_INVALID | REQUIRE_HUMAN | POLICY_RESOLUTION_UNRESOLVED | reason retained verbatim in policyEvidence; never GATE_NOT_SATISFIED | F03 |
| unresolved outcome REQUIRE_HUMAN with reasonCode INVALID_QUERY_SCOPE | REQUIRE_HUMAN | POLICY_RESOLUTION_UNRESOLVED | same | F03 |
| unresolved outcome REQUIRE_HUMAN with reasonCode NO_APPLICABLE_AUTHORITY | REQUIRE_HUMAN | POLICY_RESOLUTION_UNRESOLVED | same | F03 |
| RESOLVED with decision REQUIRE_HUMAN for a missing human gate | REQUIRE_HUMAN | GATE_NOT_SATISFIED | only inside authorized context | refusal-registry prose |
| RESOLVED with decision REQUIRE_HUMAN otherwise | REQUIRE_HUMAN | HUMAN_JUDGMENT_REQUIRED | non-gate human judgment | derived (F03 distinction) |
| RESOLVED with decision ALLOW/REFUSE/ADVISORY | same decision | POLICY_ALLOW, or the specific mediated/boundary code, or POLICY_ADVISORY | P0 evidence preserved; P0 decision never replaces P1 code selection | F02, F03 |
| any registry contradiction | never CONFLICT | POLICY_RESOLUTION_UNRESOLVED | invalid-registry contradictions are not stale-state conflicts | F03 |

### F05.13 Trusted projection tables (F04)

Projection from admitted context to `AuthorityQuery` (P0 shape: authoritySubject, goal fixed `foreman-kernel`, role, stage, operation, host; role/stage/operation/host exclude `any`). Projection is finite and trusted; unknown projection fails closed with POLICY_PROJECTION_UNMAPPED. The query is a policy query, never a capability or admission record. (F04).

| principalClass (P0 verbatim) | projected role (P0 RoleScope verbatim) | Rule | Provenance |
|---|---|---|---|
| anonymous-read | none | no control query at all; dedicated authorized content boundary only | F04 |
| human-developer | developer | identity projection | F04 |
| coordinator | coordinator | identity projection | derived (F04 pattern) |
| shaper | shaper | identity projection | derived (F04 pattern) |
| builder | builder | identity projection | derived (F04 pattern) |
| independent-reviewer | reviewer | identity projection | F04 |
| ci-service | ci | identity projection | F04 |
| host-adapter | host-adapter | identity projection | derived (F04 pattern) |
| kernel-operator | kernel or operator | explicit context-specific `roleSelection` recorded on AdmittedContext; never automatic widening to both | F04 |
| any other value | none | FAIL CLOSED (POLICY_PROJECTION_UNMAPPED) | F04 |

`stageSelection` and `hostPostureClaim` project verbatim into the query stage/host with `any` never projected. `authoritySubject` construction is FK-P12 policy logic outside this schema package. (derived (F04 pattern)).

| admitted operation scope (P0 OPERATION_SCOPES minus any) | query operation | governance OperationId | Rule | Provenance |
|---|---|---|---|---|
| source-inventory | source-inventory | none | scope category | derived (F04) |
| spec-mutation | spec-mutation | none | scope category | derived (F04) |
| repo-read | repo-read | none | scope category | derived (F04) |
| repo-mutation | repo-mutation | none | scope category, explicitly not `gate3.merge` | F04 |
| state-transition | state-transition | none | scope category | derived (F04) |
| control-call | control-call | none by itself | named governance rows queried separately via P0 OperationAuthority | F04 |
| receipt-validation | receipt-validation | none | scope category | derived (F04) |
| external-write | external-write | none | scope category; the governance id `external.write` is a separate namespace row | F04 |
| unknown | none | none | FAIL CLOSED (POLICY_PROJECTION_UNMAPPED) | F04 |

Seven governance OperationIds preserved verbatim (P0 `OperationId`): `gate1.ratify`, `gate2.dispatch`, `gate3.merge`, `verification.issue`, `closure.record`, `receipt.mint-generic`, `external.write`. They are not the complete future control-operation namespace and grant no admission by themselves; the admitted operation set stays a distinct namespace. (F04).

### F05.14 ReadRequest (D19)

Discriminant `readKind` (closed): `content-only`, `repository-read`. The wire request never selects a root; implementation belongs to P4 and deployment isolation to P7/P14. (D19, P1-S12).

#### ReadRequest — `content-only`

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| readKind | literal `content-only` | required | discriminant | D19 |
| content | Bytes<65536> UTF-8 | required | bounded submitted content; no host path member exists | D19 |
| contentEncoding | literal `utf-8` | required | | derived (F05) |

#### ReadRequest — `repository-read`

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| readKind | literal `repository-read` | required | discriminant | D19 |
| repoId | Id | required | admission-bound repository identity; never a root selection | D19 |
| relativePath | Bytes<4096> | required | exact relative path; refused if traversal, ambiguous normalization, absolute/drive/UNC form, or any symlink/reparse component including in-root targets | D19, P1-R03 |
| maxBytes | SafeInt | required | at most 1,048,576; enforced while reading, never after unbounded allocation | D19, P1-S12 |

Boundary invariants: one mounted read-only root from trusted registration; no state volume, second repository, arbitrary absolute/drive/UNC path or non-regular file is readable; every traversed component and the final target satisfy the no-link boundary; containment and file-type checks run against the opened target (resolution/use races); P2 owns exact Allowed Files compilation and canonical path rules; `surfaces` is never mutation scope. Byte-serving read results are P4 runtime behavior, not part of this contract package. (D19, P1-S12, P1-R03).

### F05.15 HostCapability (D20)

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| hostAdapterRef | Id | required | adapter identity | derived (host prose) |
| hostPostureClaim | P0 HostPosture minus any | required | declared, untrusted: provider-neutral, claude-windows-docker-loaded, claude-windows-docker-unenrolled, unsupported-host, ci | derived (D20, P0 vocabulary) |
| platformProbe | object: probeName (Bytes<128>), probeVersion (Bytes<128>) | required | declared platform/probe identity, untrusted | D20 |
| rawHostPaths | Array<object: rawPath (Bytes<4096>), pathForm (enum(windows-drive, windows-unc, posix-absolute, other)), 64> | required, may be empty | raw host paths as reported; P1 defines no host parser | D20 |
| normalizationEvidence | object: normalizationRef (Id), normalizerParcel (enum(FK-P16, FK-P20)), digest (Digest) or null | required key, nullable | normalization evidence shape only | D20 |

Ownership split (normative): P1 owns these shapes and evidence descriptors; P2 owns Allowed Files compilation and canonical path rules; P4 owns opened-target containment/type/size enforcement; P16 owns proven Windows/UNC/reparse normalization and real Windows mediation; P20 owns other-host probes. Host-specific normalization resolves drive/UNC/case/separator/reserved-name/reparse issues before any kernel comparison over canonical repo-relative identity; never lowercase all POSIX paths and never accept string-prefix containment. Unsupported host/events carry explicit gaps and cannot be promoted by schema validity. (D20, P1-S13).

### F05.16 Latency and cache contract (D21)

#### LatencyContract

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| spans.kernelDecisionLatency | object: start (literal `decision-surface-request-received`), end (literal `response-written`), clock (literal `kernel-monotonic`) | required | kernel-owned span | D21, P1-S14 |
| spans.mediatedActionLatency | object: start (literal `host-lifecycle-entry`), end (literal `hook-exit`), clock (literal `adapter-monotonic`) | required | adapter span; no cross-process wall-clock subtraction | D21, P1-S14 |
| spans.firstCallObservation | object: start (literal `initial-lifecycle-invocation`), end (literal `hook-exit`), clock (literal `adapter-monotonic`), includesStartup (literal true) | required | cold observation including startup/readiness; never in warm percentiles | D21, P1-S14 |
| budgetsMicros | object: kernelWarmP50 (literal 5000), kernelWarmP95 (literal 20000), kernelWarmP99 (literal 50000), mediatedP99 (literal 150000), firstCallMax (literal 2000000) | required | exact D21 budgets; P1 claims no measured performance | D21 |
| decisionDeadlineMicros | literal 1000000 | required | hard per-decision deadline starting at adapter request submission, including transport and processing | D21, P1-S14 |
| deadlineDisposition | enum(evaluate-completed-response-at-or-under-deadline, terminal-unreachable-when-none-completed) | required | at the boundary a fully observed response with elapsed at most 1,000,000 µs may be evaluated; none completed when the deadline is processed means unreachable | P1-S14 |
| lateResponsePolicy | literal `ignore-terminal-outcome` | required | later responses never overwrite the terminal outcome | P1-S14 |
| warmPopulation | literal `completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation` | required | explicit warm sample selection | P1-S15 |
| exclusionReporting | literal `failed-deadline-and-excluded-attempts-reported-separately` | required | success-only selection cannot hide failure rate | P1-S15 |
| percentileMethod | literal `nearest-rank` | required | workload, sample count and concurrency recorded at P17, not P1 | P1-S15 |
| cache | CacheDescriptor | required | see below | P1-S16 |

Cold/warm accounting separation: the first-call observation is reported separately against 2,000,000 µs and never enters warm percentiles; startup outside request submission stays in the cold observation and does not extend the decision timer; budget misses record obligations; deadline loss blocks governed mutation and permits only explicitly logged degraded read-only behavior. (D21, P1-S14).

#### CacheDescriptor

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| authorizationCache | literal `disabled` | required | default and only P1 posture; descriptors only, no cache implementation | P1-S16 |
| bindings | literal array [goalRevision, policyDigest, compiledScopeDigest] | required | three mandatory bindings; a mismatch yields STATE_REVISION_STALE, never stale ALLOW | P1-S16 |
| matchSufficiency | literal `necessary-not-sufficient` | required | full effective action/request, admitted principal and capabilityGeneration, repository/worktree and lease/gate freshness must also match or revalidate | P1-S16 |
| freshnessRevalidation | literal array [effective-action-request, principal-capability-generation, repository-worktree, lease-gate-freshness] | required | live expiry/revocation checks; no TTL or matching digest substitutes | P1-S16 |
| ttlAuthority | literal `none` | required | no TTL-based authority | P1-S16 |
| latencyEligibility | literal `none-granted` | required | P1 grants no additional cache eligibility to satisfy latency | P1-S16 |

### F05.17 GoldenVectorFixture and GoldenVectorCase

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| apiVersion | literal `0.1.0` | required | | P1-S06 |
| cases | Array<GoldenVectorCase, 256> | required, nonempty | one inventory mapping every case to its clause | P1-S17 |

#### GoldenVectorCase

| Field | Type | Required | Constraints | Provenance |
|---|---|---|---|---|
| caseId | Id | required | stable vector identity | P1-S17 |
| charterClause | Bytes<128> | required | charter clause reference, e.g. `D19` | P1-S17 |
| producerParcel | Bytes<32> | required | parcel that produces the input at runtime | P1-S17 |
| consumerParcel | Bytes<32> | required | parcel that consumes the response | P1-S17 |
| inputTrustOrigin | enum(wire-untrusted, admitted-internal, trusted-runtime) | required | trust origin of the input | P1-S17 |
| request | union(LifecycleEvent, ReadRequest, AuthorizeActionInput) | required | closed3-way request union | derived (F05) |
| expectedResponseKind | enum(policy-result, protocol-error, effect-result, adapter-failure) | required | | derived (F05 result kinds) |
| expectedCode | WireCode | required | per-code registry validity | P1-S17 |
| expectedDecision | decision enum or null | required key, nullable | null for protocol-error and adapter-failure | derived (F05) |
| expectedWouldDecision | decision enum or null | required key, nullable | shadow cases only | P1-S17 |
| expectedAssuranceLevel | P1 AssuranceLevel | required | runtime-expected level; the fixture's own claim is structural | F02, P1-S17 |
| expectedObligations | Array<enum(post-diff-inspection, fresh-scm-evidence, stop-report-emission, degraded-read-logging, latency-recording), 8> | required, may be empty | | P1-S17 |
| trustStageExpectation | enum(protocol-stop, admission-stop, authorized-context) | required | P1-R02 staging assertion | P1-R02 |
| expectedRequestDigest | Digest or null | required key, nullable | canonical bytes binding re-derived by canonical.test | P1-S08 |
| expectedInputDigest | Digest or null | required key, nullable | same | P1-S08 |
| verificationStage | literal `contract-only` | required | no runtime-proof labels | P1-S17 |
| laterOwner | Bytes<32> | required | later process-boundary executor (P4, P12, P16) | P1-S17 |

No golden expected ALLOW asserts live permission; P1 validates fixture/schema/cross-field consistency and deterministic canonical bytes only. (P1-S17).

### F05.18 Schema IDs, version ownership, dependency pins

| Item | Exact value or rule | Provenance |
|---|---|---|
| `$schema` | `http://json-schema.org/draft-07/schema#` on all eight schema files | P1-S02 (matches accepted authority-registry convention) |
| `$id` | `https://foreman-line.local/schemas/kernel-contracts/<file>.schema.json` for each of the eight schema files | derived (authority-registry `$id` convention, namespaced for the new package) |
| cross-file refs | `"$ref": "<file>.schema.json#/$defs/<Name>"`, relative to `$id` | derived (F05) |
| apiVersion | literal `0.1.0` on every wire document; owned by `@foreman-line/kernel-contracts`; mismatch yields UNSUPPORTED_VERSION; additive optional fields require a negotiated newer version; current closed schemas stay closed | P1-S06 |
| toolVersion | Bytes<128> ASCII emitted by the concrete tool/server implementation (P6/P13/P16 owners); shape fixed here, value never used for contract negotiation | derived (envelope prose) |
| package identity | private ESM `@foreman-line/kernel-contracts`, package/API 0.1.0, Node >=22, TypeScript types plus closed draft-07 schemas, pure validators, explicit generator | P1-S01, P1-S02 |
| dependency pins | exact dependency versions and lockfile chosen from the merged dispatch base at implementation time; own `package-lock.json`; no root/workspace manifest registration; no shared lockfile alteration | P1-S02, F05 |
| cross-package imports | only the existing schema-scaffold generation helper, through its actual reviewed relative export, inspected before import | package prose |
| generation | `npm run generate` writes only the listed schema/fixture destinations; repeated generation byte-identical | Acceptance criterion 2 |

### F05.19 Ceiling and mechanical completeness confirmation

| Item | Status | Provenance |
|---|---|---|
| Allowed Files | exactly 25 non-glob exact paths listed below; no globs, no directory shorthand; package generation touches only listed schema/fixture destinations | §4.8, Acceptance criterion 2 |
| Tests | five named test files plus `tests/fixtures/golden-vectors.json` cover schema validation, semantic boundaries, canonical bytes, golden vectors and P0 parity | Allowed Files, Verification Plan |
| Verification commands | `node -v`, `npm ci`, `npm run typecheck`, `npm run generate` plus exact generation diff/readback, `npm test`, `npm run lint`, cwd the isolated kernel-contracts package, full output and direct exit codes retained | Verification Plan |
| Rollback | recorded below; contract-only surface with no state migration or cutover | derived (§15.3 completeness) |
| Forbidden surfaces | enumerated below | §15.3 scope row |

## Allowed Files

Proposed builder ceiling, inactive until dispatch:

- `plugins/foreman-line/kernel-contracts/package.json`
- `plugins/foreman-line/kernel-contracts/package-lock.json`
- `plugins/foreman-line/kernel-contracts/tsconfig.json`
- `plugins/foreman-line/kernel-contracts/biome.json`
- `plugins/foreman-line/kernel-contracts/README.md`
- `plugins/foreman-line/kernel-contracts/src/types.ts`
- `plugins/foreman-line/kernel-contracts/src/schemas.ts`
- `plugins/foreman-line/kernel-contracts/src/canonical.ts`
- `plugins/foreman-line/kernel-contracts/src/validate.ts`
- `plugins/foreman-line/kernel-contracts/src/generate.ts`
- `plugins/foreman-line/kernel-contracts/src/index.ts`
- `plugins/foreman-line/kernel-contracts/schemas/lifecycle-event.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/admitted-context.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/authorize-action-input.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/decision-envelope.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/repository-read-request.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/host-capability.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/latency-contract.schema.json`
- `plugins/foreman-line/kernel-contracts/schemas/golden-vector.schema.json`
- `plugins/foreman-line/kernel-contracts/tests/schema-validation.test.ts`
- `plugins/foreman-line/kernel-contracts/tests/semantic-boundaries.test.ts`
- `plugins/foreman-line/kernel-contracts/tests/canonical.test.ts`
- `plugins/foreman-line/kernel-contracts/tests/golden-vectors.test.ts`
- `plugins/foreman-line/kernel-contracts/tests/parity.test.ts`
- `plugins/foreman-line/kernel-contracts/tests/fixtures/golden-vectors.json`

No shared manifest/export/schema/workflow/lockfile is writable. P1 owns only its new package manifest and exports. P6/P9/P14/P16/P18/P20 serialization ownership remains unchanged. If an integration needs another file, the coordinator records an amendment before code; no implied neighboring-path permission.

**Forbidden surfaces (exact):** `plugins/foreman-line/contracts/**` (frozen pipeline A–F contracts, including any ShapingResult/receipt format); `plugins/foreman-line/authority-registry/**` (FK-P0 source and generated registry); `plugins/foreman-line/docs/SPEC-CONVENTION.md`; shared manifests, root workflow files, plugin/marketplace metadata, shared lockfiles and package exports outside this package; `plugins/foreman-line/routing-policy/**` and `plugins/foreman-line/dispatch/**` (contested, sibling-goal owned); `plugins/foreman-line/schema-scaffold/**` (import-only through its reviewed relative export); every other goal's records; any path outside the 25 listed entries. Charter §15.3 scope row satisfied: the enumeration here is Forbidden, the Out of Scope section below is unchanged, and `Allowed Files` remains the complete mutation authority.

## Acceptance Criteria

1. Accepted merged P0 source/API/schema identities and compatibility mapping are recorded before activation; no dependency is asserted satisfied from candidate tests or draft docs.
2. Exact 25-file ceiling holds; package generation touches only listed generated schemas/fixture destinations; repeated generation is byte-identical. Types/schemas/fixtures agree and reject unknown/missing/invalid/over-limit input.
3. Public wire types cannot inject trusted admission/authority/effective classification/mode; internal shapes explicitly remain structural descriptions requiring protected construction. Anonymous/read/control variants and operation/result-kind constraints reject confusion. Protocol/admission failures stop protected-context evaluation; nonleak vectors and shadow non-downgrade semantics are specified.
4. D19 rejects all symlink/reparse traversal, including in-root targets, while retaining opened-target containment/type/size obligations. P2/P16 path ownership and D20 unsupported-host claims are explicit with positive and isolated hostile vectors; no root/path/capability substitution is represented as valid access.
5. Every initial code and additional boundary code has an unambiguous producer/result/decision/assurance definition. All human gate, shadow, outage, idempotency and structural-honesty vectors meet that definition without creating an evaluator implementation.
6. D21 both spans, warm/cold populations, clock boundaries, deadline tie/late behavior and disabled-cache default are specified and vector-tested. No actual latency target is claimed met in P1.
7. Fixture coverage inventory has no unassigned clause/case and no runtime-proof labels. Contract validators and canonicalization run without ambient repository/time/network effects; generator effects are isolated and named.
8. Complete direct-exit verification logs, fixture-to-clause map and two fresh independent architecture/risk reviews support a per-criterion claim. Human Gate3 and Wave0 exit remain separate; P1 alone cannot close Wave0 or promote enforcement.

## Out of Scope

- Authorization decisions/policy evaluation (P12), scope compilation (P2), filesystem reading (P4), admission/authentication implementation or MCP catalogs (P6/P13), lease/state/migration code (P9/P10), hooks/probes (P16/P20), enforcement (P19), CI wiring and U1 (P18/P19/P21).
- Issuing capabilities, generic receipts, human approval, independent verdicts, Git mutations or external-system credentials through runtime tools.
- Editing P0, frozen pipeline contracts, charter/loop, shared manifests, package exports outside this package, workflows, plugin metadata, other goals or ambient dirty work.
- Implementing caching, selecting cloud hosting, changing antivirus settings, benchmarking actual runtime latency or claiming new host support.

## Context & References

- [Live charter](../../goals/foreman-kernel/charter.md)
- [Loop directive](../../goals/foreman-kernel/loop-directive.md)
- [Shaping decisions](../../goals/foreman-kernel/FK-P1-shaping-decisions-20260907.md)
- [R31 → P1 field reconciliation (F01–F05)](../../goals/foreman-kernel/R31-to-P1-field-reconciliation-20260907.md)
- [FK-P0 active contract](FK-P0-canon-authority-enforcement-registry.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [Coordinator canon](../../COORDINATOR-PATTERN.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)
- [Frozen pipeline package](../../../contracts/package.json)
- [Schema scaffold](../../../schema-scaffold/package.json)

## Verification Plan

**Pending, not run.** After coordinator scheduling releases the sequential host chain: `node -v`, `npm ci`, `npm run typecheck`, `npm run generate`, exact generation diff/readback, `npm test`, `npm run lint`, with cwd the isolated kernel-contracts package and full output/direct exit codes retained. Script names above are required package interfaces, not claims existing commands already run. Meaningful negative vectors mutate one trust/shape dimension and assert its specific code; no test asserts implementation parity with unimplemented downstream engines.

Two independent reviewers must ask: Can deserialized context become authority? Can admission/shape validity be mistaken for a grant or cryptographic proof? Is every refusal/result kind consistent across shadow/enforcement/degraded modes? Can Windows normalization leak into portable policy or D19 containment become a string check? Can cold allowance, percentile filtering, timeout race or matching cache triple permit a late/stale ALLOW? Does the proposed package introduce a collision or duplicate accepted P0 semantics? Which claimed evidence belongs to later parcels?

Shaping advisory self-check and ShapingResult emission are pending parent coordination, explicitly deferred while R30 owns the sequential Node/test lane. No emitter output, epic tree, receipt or promotion is claimed.

## Rollback

P1 is a contract-only additive surface: it creates one new private package and mutates no existing code, state store, data format or shared surface. Rollback is therefore bounded: revert this spec and delete `plugins/foreman-line/kernel-contracts/` entirely; no state migration, cutover epoch, data retention or restore sequence exists in this parcel, and no consumer requires a compatibility window because nothing downstream has shipped against these schemas while the spec is draft. Generated schemas and fixtures are source-authored or deterministically generated and carry no runtime data. If the package has already merged and a later parcel depends on it, that parcel's review removes its own imports in its own change; P1 itself migrates nothing. Golden vectors are immutable evidence and are retained (not rewritten) if the worktree is abandoned.

## Coordinator decisions required

No open items. Corrected claim (independent re-review falsified the earlier "None" assertion): one genuine undecided gap existed — the anonymous-content × IdempotencyBinding interaction — and it is now decided by the cited coordinator ruling (2026-09-27, re-review Q1) recorded in the F05.4 binding-scope rule: transition-only bindings, null for anonymous content-only requests, and unanchorable non-null bindings rejected as structural failures before any evaluation. Every field, type, constraint and mapping in the F05 tables above is traceable to a cited decision (F01–F05, P1-S01–S18, P1-R01–R03, or the 2026-09-27 re-review coordinator rulings) or explicitly labeled `derived` with its anchoring constraint; nothing is left undecided or stubbed. The values that are not decidable at contract-authoring time are ownership boundaries already recorded, not open decisions: `registryContentDigest`, `effectivePolicyDigest` and `effectiveConfigurationDigest` values are pinned with the accepted P0 merge at activation; `goalRevision` is state-owned (P9/P10); `compiledScopeDigest` is FK-P2-owned; `toolVersion` values belong to the emitting tool implementations; `roleSelection`/`stageSelection` values are set by P13 at admission; exact dependency pins come from the merged dispatch base. All derived naming (wire code spellings, `EffectiveActionClass` vocabulary, obligation payload fields) is deliberately presented as exact schema text so the independent field review can amend it in review rather than defer it.
