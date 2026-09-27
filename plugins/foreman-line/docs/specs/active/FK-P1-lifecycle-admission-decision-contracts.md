---
ticket: FK-P1
title: Foreman Kernel - lifecycle admission and decision contracts
status: draft
owner: clinton.morgan
created: 2026-09-07
updated: 2026-09-07
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/kernel-contracts/**]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# FK-P1 — Lifecycle, admission, and decision contracts

## Intent

Define the versioned, provider-neutral contracts consumed by FK-P2–FK-P21: lifecycle events, authenticated admission, repository/read boundaries, authorizeAction inputs, decision envelopes, refusal semantics and golden vectors. Specify both D21 latency spans and the cold/deadline/cache rules without implementing the authorization engine, transport, storage or hooks. The result is a contract package and structural validation evidence, not runtime enforcement evidence.

## Constraints

### Dependency and dispatch boundary

**Not dispatchable.** FK-P0 remains an unsatisfied dependency. Before activation, the coordinator must record FK-P0's actual human-merged main SHA, exported contract/type/schema identities and R30 adoption evidence; reconcile this draft against that accepted upstream contract; pin the resulting source base; and complete independent review and coordinator lint. No candidate P0 API or generated registry is accepted by this draft. No downstream dependency edge is removed.

Proposed isolated builder branch: `codex/fk-p1-lifecycle-admission-decision-contracts`; worktree: `D:/Repos/agent-skills-worktrees/fk-p1-lifecycle-admission-decision-contracts`. Neither is created or granted by this draft. Verify availability and exact merged base at dispatch. The new package directory is proposed, with collision checks repeated before activation. Existing frozen `contracts/` owns pipeline A–F contracts; P1 must not edit it or invent another ShapingResult/receipt format.

The coordinator records defaults/gaps in the linked shaping-decisions file under the September7 authority. This spec remains draft until those decisions and accepted P0 compatibility are recorded. Builder Step0 restates exact source SHA, consumers, shapes, write ceiling, assurance limits, verification commands and blockers before coordinator confirmation. Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

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
