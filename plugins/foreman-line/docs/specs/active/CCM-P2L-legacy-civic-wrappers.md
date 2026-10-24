---
ticket: CCM-P2L
title: Bounded legacy civic wrapper mapping
status: active
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_civic_legacy.py, tests/test_ccm_civic_legacy.py, tests/fixtures/ccm/legacy-civic-v1.json, docs/specs/ccm-legacy-civic-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Cover the three existing Collective legacy civic wrappers before extractor
orchestration. No competing C# schema or v2-contract modification. Structural
validation maps complete records to unscoped, unadmitted immutable candidates.

## Constraints

Python3.10+, existing dependencies only. Base7badb965 P2E,440tracked entries and
3721PASS137skip baseline. Four NEW allowed files; parent supplies frozen fixture
verbatim before source, builder returns the other three files only. Accepted
CivicMemoryContracts.cs at3d44cf5b/eaadc386... and inspected current retained P1C
binary define fields/semantics. Binary observation is not reproducible build
provenance.13synthetic actual C# Validate+default-serializer fixtures cover all
six session states, three mutation kinds, open challenge and three resolutions.

## Acceptance Criteria

1. API map_legacy_civic_record(payload:bytes, contract:str)->CivicMapping, reusing
   accepted frozen CivicMapping and CivicMappingError from ccm_civic. Exact
   built-in bytes/str checks, contracts exactly legacy_deliberation,
   legacy_proposal, legacy_challenge. Subject_id=MemoryRecordId; dispositions
   deliberation_snapshot, proposal_lineage, challenge_history respectively.
   All admitted=False/trust_tier=unverified_candidate. No source trust, scoped
   identity, receipt verification, warning promotion, authorized inheritance or
   execution inference. Even AuthorityTier=1/anchor flags true are descriptive.
2. Explicit profile collective-default-json/legacy-civic/1: PascalCase fields,
   typed IDs exactly {"Value":nonblank clean string}, numeric closed enum values,
   no string enum/camelCase/snake_case coercion. Only rejection_reason_class is
   lower_snake_case, nullable/absent with eight closed accepted v2 reason tokens.
   Caller chooses profile/contract; never auto-detect. Root/common/nested objects
   have exact field sets from supplied C# serialization, allowing missing optional
   nullable constructor fields as null for validation only. Preserve submitted
   absent-vs-null in canonical bytes; do not inject fields. Required computed
   AuthorityTier exact int1, CanonicalAnchors.HasCanonicalEvidence and
   HasCanonicalArtifactReference exact bool true; check against underlying refs.
   Unknown/extra trust/verified/tenant fields fail closed. No global serializer.
3. Validate every C# wrapper invariant and nested transition/disposition Validate
   rule from supplied accepted source, including query/anchor coverage, terminal
   proposal identity/root/state/mutation/target equality, challenge terminal
   status/resolution, required closure timestamps and nullable resolution metadata.
   Query ParticipantIds/EntityIds/LineageRefs nonempty; proposal/challenge arrays
   may empty. Anchors need receipt OR causal ref AND one civic artifact ref;
   transition/disposition AnchorReceiptRefs nonempty. Do not invent history
   chronology, ancestry continuity, signature validity or authenticated scope.
   C# IDs/text require nonblank; narrower adapter also disallows C0/C1 controls,
   surrogates and surrounding whitespace. Numeric enums are exact ints (no bool/
   floats): SessionState0..5, ProposalState0..2, MutationKind0..2,
   ChallengeStatus0..1, ResolutionKind0..2. No unknown enum fallthrough.
4. UTC timestamp profile accepts valid Gregorian calendar YYYY-MM-DDTHH:MM:SS
   with optional1..7fractiondigits and Z or +00:00, no nonzero offset. Preserve
   spelling. Comparison must retain seventh fractional digit, not truncate to
   Python microseconds. ClosedUtc/CompletedUtc cannot precede source timestamp.
   All history timestamps validate but no undocumented ordering rule is invented.
5. Reuse immutable accepted ccm_civic JSON admission helpers (_scan,_integer,
   _float,_constant,_pairs,_tree,_Reject) by explicit pinned private imports,
   with a documented composition dependency; no copied parser/schema v2. Input
   <=262144bytes, depth<=32, nodes<=8192, decoded string/key<=16384UTF8bytes,
   integerdigits<=128, canonicaloutput<=262144bytes as P2E. Additional profile
   arrays<=256items checked iteratively before schema, nonempty histories<=256.
   Canonical payload is json.dumps(parsed, ensure_ascii=True,sort_keys=True,
   separators=(',',':'),allow_nan=False).encode('utf-8'), not .NET byte equality.
   SHA256 all original bytes and canonical bytes; no content mutation/scrubbing.
6. Same six closed error codes as P2E; exact types/support/size precede parse,
   use invalid_contract for legacy field/invariant violations, resource_limit
   for bounds. No payload in args/str/repr/cause/context, sanitized public errors
   raised after leaving caught contexts. No IO/clock/random/logging/model calls,
   no source execution/import from user content. Payload is UNSCRUBBED; P3 must
   scrub at the actual durable boundary. Do not edit existing accepted modules.
7. Tests consume exact parent fixture; all13actualC# positives preserve every
   field/list order and canonical fingerprint, remaining unadmitted. Negative
   patches must be otherwise valid and target each nested and wrapper invariant,
   enum exact types, field sets/aliases, whitespace/control text, absent optional
   vs null, fractional7digit chronological edge, reason semantics/unknown values,
   fake proof flags, typed ID shape and query/anchor coverage. Test both argument
   subclass predicates separately, no short-circuit coverage. Include at/over
   histories/arrays256, supported input/output bounds, malformed/duplicate JSON,
   UTF8/BOM/surrogates and sanitized contexts. Reuse unchanged accepted low-level
   guard tests by dependency evidence; new composition tests prove guards run.
8. Parent independent frozen serialization/hash oracle, restricted no-network
   container pytest focused/full +Black/isort/mypy; all3721PASS137skip dispositions
   and440oldtracked entries retained. Two fresh blind architecture/security
   reviews, exact-head/mainCI before acceptance. Reviewers never fix. One source
   proposal, at most one bounded focused repair; no retry/fallback. Report
   authorship, usage/unknowns and same-family review limitation accurately.

## Out of Scope

No Collective changes, C# serializer modification, new authority/receipt/ID
registry, scope resolver, producer authentication, semantic/model extraction,
storage/outbox/queue, engine orchestration, P3 ingestion or real corpus import.

## Allowed Files

- src/keon/cortex/pipeline/ccm_civic_legacy.py (NEW)
- tests/test_ccm_civic_legacy.py (NEW)
- tests/fixtures/ccm/legacy-civic-v1.json (NEW parent-frozen, byte-identical)
- docs/specs/ccm-legacy-civic-v1.md (NEW)

## Context & References

Accepted P2E ccm_civic.py; Collective CivicMemoryContracts.cs at3d44cf5b,
CanonicalIds, observed-profile.json and actual13case C# fixture. S01-S12 and full
goal exits unchanged; budget/routing admission separate and all reservations held.

## Verification Plan

Fresh Step0 restatement then exact hash Gate2 before no-tools Sol source. Parent
static inspection applies only three proposed files plus immutable fixture.
Existing restrictive test-host image reused with actual baseline correspondence.
Boundary/invariant mutation controls where material, then independent reviews,
green exact-head merge, green merged-main CI and status-only StageF archive.


## Delegated Gate2 — October24

Direct owner legacy-then-engine authority admits one controlled Sol/low no-tools
three-file source proposal, immutable fourth fixture parent-supplied. Step0ready
no flags, base7badb965,440pins/3721PASS137skip;13actualC#fixture oracle frozen.
One focused repair maximum, two independent reviews mandatory. All existing
reservations and affected/native/privatePi routesHELD; no merge beforegreenCI.
