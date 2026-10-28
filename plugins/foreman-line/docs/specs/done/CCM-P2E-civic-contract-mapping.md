---
ticket: CCM-P2E
title: Deterministic unadmitted civic v2 mapping
status: done
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_civic.py, tests/test_ccm_civic.py, docs/specs/ccm-civic-mapping-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Pure deterministic mapping of the THREE accepted P1A/P1C v2 civic contracts:
rejection, caution and inheritance. Reuse ingress.models_v2 decode_v2 and
canonical_v2 without editing them. No duplicate civic schema or trust resolver.
This is an unscoped candidate adapter for future engine composition, not shard
creation, source authentication, receipt verification or live enforcement.

## Constraints

Python3.10+, existing dependencies only. Existing Cortex sources and C# contracts
remain byte-identical. Collective accepted revision3d44cf5b and P1A fixtures are
normative for accepted fields/defaults/receipt aliases and closed values. These
v2 contracts are not the legacy PascalCase DeliberationMemoryRecord,
ProposalLineageRecord or ChallengeMemoryRecord wrappers: those require a future
explicit adapter; reject unsupported profiles rather than silently drop them.

## Acceptance Criteria

1. New direct-import API map_civic_record(payload: bytes, contract: str) ->
   CivicMapping. Only exact built-in bytes and str, contract exactly rejection,
   caution or inheritance. Reject subclasses before invoking supplied methods.
   No implicit schema detection, IO, clocks, random values, logs or model calls.
2. CivicMapping is frozen slots, repr=False, with fields contract, subject_id,
   disposition, source_sha256, canonical_sha256, canonical_payload (bytes).
   admitted is a read-only property always False; trust_tier always
   unverified_candidate. Digests fingerprint bytes, not scoped record IDs or
   authenticated provenance. No tenant/scope inference; caller must later bind
   current authorized scope before storage/admission. No trust/score input.
3. Decode exact strict UTF8 JSON object; BOM invalid_json, unpaired surrogate
   strings invalid_json, duplicate object names at ANY depth invalid_json,
   NaN/Infinity invalid_json; JSON numbers must not become nonfinite floats.
   Fail atomically, no partial result. Then use existing decode_v2(payloaddict,
   contract) and canonical_v2, not a reimplementation. Preserve accepted receipt
   alias handling/defaults/time spelling and nested caution semantics. Returned
   canonical bytes are canonical_v2(...).encode('utf-8'), bounded below.
4. Subject is proposal_id / role_id / inheritance_id respectively. Rejection
   disposition: failure_class for failed_verification, violated_invariant,
   runtime_regression or security_boundary_breach; dissent for out_of_scope,
   deferred_timing, budget_cap or policy_preference; unclassified for null/absent.
   This describes a reason ONLY; even failure_class plus receipt_ref is not a
   verified Repulsive marker. Caution disposition advisory_profile; inheritance
   disposition inheritance_reference. Never mutate caution, grant execution,
   authorize inheritance, create graph edges or treat references as resolved.
5. Narrow resource admission: input<=262144 bytes, nesting<=32 containers
   (root counts1), total JSON value nodes<=8192 (containers/scalars, NOT keys),
   each decoded key/string<=16384 UTF8 bytes, integer lexical digit count<=128
   excluding minus, canonical output<=262144 bytes. Enforce byte/depth guards
   before json.loads; quoted/escaped delimiters do not count. json integer and
   float hooks must bound conversion/reject nonfinite values. Iterative parsed
   tree validation before Pydantic; duplicate-key hook safe. At-limit allowed
   where schema allows. These are this adapter's narrower limits, not changes
   to P1A/P1C schemas. No general hostile parser sandbox/resource SLA claim.
6. CivicMappingError has closed code invalid_input, unsupported_contract,
   resource_limit, invalid_utf8, invalid_json or invalid_contract; empty args,
   sanitized str/repr, no cause/context containing data. Raise outside caught
   contexts. Precedence: exact types, supported contract, input size, depth scan,
   strict UTF8/JSON/tree admission as applicable, existing contract, output size.
   Invalid UTF8 discovered for depth scan maps invalid_utf8; malformed JSON
   nesting may be invalid_json unless depth bound crossed first. Never return
   Pydantic/raw decoder exceptions. Sensitive payload is in-memory unsanitized:
   P3 must scrub all text immediately before durable enqueue; mapper does not
   claim redaction. Public repr omits payload/subjects; error sentinels absent.
7. Tests independently cover all three real normative fixture positives and
   negatives; exact field preservation/canonical bytes and original digests,
   all eight rejection reasons/null/missing, aliases/conflicting aliases, wrong
   schema/extra trust fields/unknown values, fake receipt no promotion, invalid
   scope assumptions, nested caution and immutable outputs. Predicate-specific
   at/over-limit tests including escaped delimiters, duplicate nested keys,
   big integers/nonfinite floats, strict UTF8/BOM/surrogates, subclass canaries,
   sanitized error context/repr. Exercise each guard rather than relying on
   another earlier failure. No tests copied from private implementation helpers.
8. Existing3676PASS137skip baseline dispositions and437tracked entries retained.
   Restricted offline container checks: focused/full pytest, Black, isort,mypy;
   independent frozen mapping oracle. Two fresh blind architecture/security
   reviews, exact-head CI, then merged-main CI before acceptance. Same-family
   independence limitation disclosed. No developer credential/worker exposure.

## Out of Scope

No C# source changes, global serialization, legacy wrapper adapter, Git/AST
changes, transport, parser subprocess, package exports, schema duplication,
storage/outbox/database/HTTP, producer authentication, proof/mint/reset/approval,
scope authorization, encryption/deletion/import or extractor orchestration.

## Allowed Files

- src/keon/cortex/pipeline/ccm_civic.py (NEW)
- tests/test_ccm_civic.py (NEW)
- docs/specs/ccm-civic-mapping-v1.md (NEW)

## Context & References

Accepted ingress/models_v2.py, tests/test_ccm_contracts_v2.py and its normative
fixture; accepted ccm-memory-graph-v2.md; Collective CivicMemoryContracts.cs and
CivilizationalMemoryContracts.cs at3d44cf5b; S01-S12 unchanged. P2D-B accepted
merge0cdff676. Full goal exits unchanged; this parcel alone is not bulk readiness.

## Verification Plan

One controlled Sol/low no-tools implementation proposal, parent static inspection
and restricted deterministic verification; at most one focused repair and two
fresh closure reviews. Reviewer never fixes. Gates2/3 require persisted exact
workorder/source hashes and green evidence. All old reservations/affected routes
remain held. Fresh financial guards before each call; no retry/fallback.


## Delegated Gate2 — October24

Existing owner civic-parcel and blanket authority admits one controlled GenSpark
Sol/low no-tools implementation proposal; Step0 ready/no flags. Base0cdff676,
three new files only, frozen independent mapping oracle. Restricted verification
and two independent reviews mandatory; one focused repair maximum. All previous
reservations and affected/native/private-Pi routes remain held. No trust/storage
or legacy wrapper/engine admission and no merge until green evidence.
