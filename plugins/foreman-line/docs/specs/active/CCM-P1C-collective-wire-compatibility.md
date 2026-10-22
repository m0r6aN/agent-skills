---
ticket: CCM-P1C
title: Collective civic memory v2 wire compatibility
status: active
owner: clinton.morgan
created: '2026-10-19'
updated: '2026-10-19'
risk: elevated
surfaces: [src/Keon.Collective.Abstractions/Society/AgentIdentityContracts.cs, src/Keon.Collective.Abstractions/Society/CivicMemoryContracts.cs, src/Keon.Collective.Abstractions/Society/CivilizationalMemoryContracts.cs, tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs, tests/Keon.Collective.Abstractions.Tests/Society/ccm-contracts-v2.json]
routing_class: implementation/standard
verification_class: judgment-required
expertise: engineering
inputs: [text]
permission_profile: builder-standard
data_classification: internal
thinking_level: low
---

# CCM-P1C — Collective contract adapter, not enforcement

## Intent

Extend Collective's existing civic/role contract surface to represent rejection reasons, versioned domain caution and multi-parent knowledge references. Prove interoperability against P1A's accepted Python wire fixtures without adding an alternate memory authority or implying live Gateway enforcement. One builder owns this C#-only change.

## Constraints

- Sole implementation repository: `D:/Repos/keon-omega/keon.collective`; observed HEAD `461e2767a046418b098766090723e0cc34d9edc7`. Dispatch must pin a clean accepted base and P1A fixture/contract commit, not assume this observation is the launch base. P1B is not a dependency; no edits in Cortex or Gateway.
- Extend existing `ProposalLineageTransition` and `AgentIdentity` compatibility surfaces using optional trailing fields/defaults where safe; preserve all existing constructors, serialized fields, enum values and validation behavior for legacy inputs. Inspect existing identity record before changing it. New supporting records live in the Society namespace; no parallel identity/receipt/oversight enums.
- Canonical oversight remains `AgentOversightLevel` Routine=0, Elevated=1, Critical=2 and existing `AgentOversightProfile` baseline. `AgentConstraintProfile` stays constitutional restrictions. An advisory profile may tighten but never supply execution permission, credentials, recognized birth or approval.
- Existing typed IDs and validators remain canonical. Serialization uses explicit System.Text.Json mapping for P1A's versioned snake_case fields/closed tokens where C# names differ; do not switch global serializer behavior. Match UTC timestamps and receipt aliases deliberately. JSON number comparisons are semantic; do not claim cross-language byte/hash equality unless the same canonicalization is actually used.
- P1A owns the normative fixture. Copy it verbatim into the allowed test fixture path for offline C# testing and record upstream commit/version; no independently authored competing fixture or cross-repo write. Tests can read the copy directly from an explicit source-relative location, without editing the test project file. If project packaging requires another mutation, stop for amendment.

### Required wire behavior

Define closed rejection tokens: failed_verification, violated_invariant, runtime_regression, security_boundary_breach, out_of_scope, deferred_timing, budget_cap, policy_preference. A nullable new reason preserves legacy transitions; absent or nonfailure reasons never imply a Repulsive marker. A failure reason without an independently verified failure/test receipt does not qualify either. The contract can represent receipt references; it cannot authenticate them or mint markers.

Represent a role/domain caution profile with explicit version, domain_tag, repulsive_boost/causal_boost in [1,2], recommended_oversight_floor using the canonical enum, authoritative sequence/version, last failure event time and distinct-task success-streak evidence. Require finite boosts, explicit UTC times, valid IDs and unambiguous missing/default semantics; unknown v2 closed values fail validation. Legacy absence is absence, not an injected Routine override.

Document/test accepted S11 transition examples as contract fixtures: a new domain failure tightens one floor level and +0.10 boosts capped at Critical/2; ten distinct-task verified successes recover one level and -0.10 boosts toward baseline/1; operator reset needs separately verified bound decision evidence. The effective floor is the maximum of baseline/policy/caution/action floors. Wire records do not implement the state worker or enforcement.

Represent versioned multi-parent knowledge references with a nonempty distinct parent_generation_ids list, target EntityId/generation, provenance/approval references and caution envelope. Preserve source lineage and distinguish cognitive inherit_ IDs from execution rcpt_ IDs. Empty/duplicate/self-parent inheritance is rejected; v1 single-parent references remain readable and are not rehashed. New active/primary inheritance needs approval and governed incarnation; this contract does not implement pack selection, R1–R12 runtime validation or entity creation.

## Acceptance Criteria

1. Add `RejectionReasonClass` and optional reason to existing proposal lineage transitions without invalidating old constructor/serialization tests. Unknown reason fails closed. deferred_timing and budget_cap remain dissent; failed_verification merely creates a failure-class candidate requiring proof, not an automatic verified warning.
2. Add versioned domain profile and multi-parent reference supporting records and an optional role-identity profile reference without copying memory payloads into Collective storage. Preserve existing role validation and canonical oversight/identity types. Validation rejects NaN, boost 2.01, undefined oversight enum values, empty domain/version, invalid IDs and duplicate/empty parent lists.
3. P1A's fixture JSON is copied byte-for-byte with origin commit/version recorded in the new test file. C# tests deserialize/validate and round-trip accepted cases, reject specified negative cases and compare field values with the Python fixture. Run P1A's Python fixture tests read-only against its accepted source; record both commands/revisions. C# success alone is not cross-language evidence.

   P1A's accepted civic schema section and fixture commit/version are normative for exact fields/casing, canonical enum encoding, absent-versus-null/default semantics, existing ID/receipt aliases and S11 transition/negative cases. Record source/copy comparison at acceptance. Any divergence stops for a scoped P1A contract amendment; P1C may not author a competing schema or switch global serialization behavior.
4. Worked case: Routine baseline + Elevated domain caution + Routine action/policy yields Elevated and cannot authorize an effect. Counterexample: repeated successes on one task do not satisfy ten distinct tasks; an operator receipt pointer without verification is not reset authorization. A higher policy Critical floor remains Critical after a reset. Fixture assertions reflect separate policy authority, not a self-approved boolean.
5. Old constructor/wire tests pass unchanged; inheritance/source receipt references do not become execution receipts, active entities or a live second incarnation. Unknown/missing legacy fields never invent successful proof. Any binary/reflection/record-deconstruction compatibility issue not covered by optional trailing fields is reported, not silently accepted.
6. Retain explicit implementation limitations: contracts only, no Gateway/Collective effect enforcement, no profile persistence/worker, no live Runtime/receipt integration or deployed interoperability claim.

## Out of Scope

No new memory database, Gateway handler/client/Program changes, Cortex InheritanceEvent migration, enforcement workers, boost scoring, incarnation issuance, cloning, approval receipt generation, key management, package dependencies or global serializer configuration. Do not assume ownership of OPMEM P5a. No cloud or actual import.

## Context & References

- [P1A accepted fixture owner](CCM-P1A-memory-graph-contracts.md)
- [Decisions S09–S12](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md)
- [Identity contracts](D:/Repos/keon-omega/keon.collective/src/Keon.Collective.Abstractions/Society/AgentIdentityContracts.cs)
- [Civic contracts](D:/Repos/keon-omega/keon.collective/src/Keon.Collective.Abstractions/Society/CivicMemoryContracts.cs)
- [Incarnation law](D:/Repos/Pantheon/docs/COLLECTIVE-INCARNATION.md)
- [OPMEM P5a hold](../../goals/operator-developer-cortex-memory/p5a-shaping-proposal-and-hold-2026-10-14.md)

## Allowed Files

Exact paths relative to the sole Collective repository:

- `src/Keon.Collective.Abstractions/Society/AgentIdentityContracts.cs`
- `src/Keon.Collective.Abstractions/Society/CivicMemoryContracts.cs`
- `src/Keon.Collective.Abstractions/Society/CivilizationalMemoryContracts.cs` (new supporting records)
- `tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs` (new)
- `tests/Keon.Collective.Abstractions.Tests/Society/ccm-contracts-v2.json` (new verbatim fixture copy)

No test project/config edits; amendment required if genuinely necessary.

## Verification Plan

From the admitted Collective worktree using existing SDK/dependencies:

```text
dotnet test tests/Keon.Collective.Abstractions.Tests/Keon.Collective.Abstractions.Tests.csproj --filter FullyQualifiedName~CivilizationalMemoryContractTests
dotnet test tests/Keon.Collective.Abstractions.Tests/Keon.Collective.Abstractions.Tests.csproj
```

From the pinned accepted Cortex checkout (read-only):

```text
python -m pytest -q tests/test_ccm_contracts_v2.py
```

Retain fixture origin/copy comparison, exact test identities/results and before/after legacy baseline. Mandatory reviewer questions: Can a new optional field break old positional records/wire consumers? Does deserialization accept unknown enums or fabricate a baseline? Is the fixture genuinely shared, not two agreeing implementations? Can an advisory profile/approval pointer mint authority or bypass incarnation/receipt verification? Review risk remains elevated even though implementation follows fixed contracts.

## Dispatch Envelope and Completion

Supply <=~16k tokens initially: this packet, exact accepted P1A fixture, narrow C# record/serializer interfaces, relevant invariants and commands; history by reference. Measure capacity rather than setting blanket 200k. Pin exact base/dependency version, baseline and cheapest qualified exact route/fallback with tool/data admission; do not change an existing session model.

One implementation plus one focused repair, then a reproducible blocker. No numerical paid budget/time/token/tool/review allowance exists here: authorize and record enforceable bounds/limitations before paid dispatch. Reuse unchanged review evidence under applicable gates; do not skip mandatory independent reviews or treat a cheap route as risk reduction. Completion includes changed files, fixture provenance, commands/results/evidence, versions, known limitations, actual usage and estimated/unknown costs. No builder self-approval, promotion or merge.
