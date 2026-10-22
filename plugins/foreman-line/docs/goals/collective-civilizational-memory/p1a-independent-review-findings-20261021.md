# P1A independent reviews and disposition

Two freshblindOpus5.5 reviews completed after low-effortqualification. BothCHANGES_REQUIRED. Exactreports andhostreproductions retained privately; completefindings below. Prior failedreviewA127.6 is separate and remainscounted.

## Review A

```json
{
  "verdict": "CHANGES_REQUIRED",
  "findings": [
    {
      "id": "A1",
      "severity": "high",
      "path": "src/keon/cortex/ingress/models_v2.py",
      "location": "ShardV2.structure / classification / projected_authority",
      "evidence": "Trigger: a producer submits provenance_tier='verified_receipt' or 'explicit_human_directive' with any memory_kind, including a Derived kind or an Episodic kind carrying lineage_graph parents. Behavior: decode_v2 accepts the payload, and projected_authority returns 'Receipt' or 'RawEvidence', which is evidentiary. A child that has lineage_graph parents can therefore carry a RECEIPT/RAW_EVIDENCE label based only on producer input. The same applies to tier='distilled_verified' with an empty lineage_graph, which yields 'ProceduralMemory' with no parents. The test test_total_matrix asserts these projections as acceptance results. The docstring calls the label a 'requested classification', but the returned object exposes no admitted/unadmitted distinction, so any downstream consumer of projected_authority receives an evidentiary class.",
      "required_change": "The frozen contract must not let unadmitted producer input yield an evidentiary or distilled authority projection. Do one of the following: (a) project every producer DTO as non-admitted, either by naming it requested_authority with a separate admitted=False marker or by projecting SUMMARY until admission; or (b) reject direct evidentiary tiers whenever lineage_graph is nonempty, and reject distilled_verified or causal tiers whenever lineage_graph is empty. Add negative fixtures for derived-child-with-direct-tier and distilled-without-parents. This violates AC1/AC3 and the rule that derivation cannot inherit RECEIPT/RAW_EVIDENCE standing."
    },
    {
      "id": "A2",
      "severity": "high",
      "path": "src/keon/cortex/ingress/models_v2.py",
      "location": "ProvenanceV2 (inherits CandidateProvenance aliases and receipt_ref/source_kind)",
      "evidence": "Trigger: the payload provenance is {'source':'x','tenantId':'tenant-a','timestamp':'...Z','receiptRef':{'receiptId':'r','integrityHash':'h'},'sourceKind':'deterministic_code_or_event','agentId':'a'}. Behavior: populate_by_name together with the inherited aliases accepts camelCase alongside snake_case, so the 'snake_case v4 fields' rule is not frozen and dual spellings exist. Separately, Wire.clean_strings is not applied to ProvenanceV2, because ProvenanceV2 derives from CandidateProvenance rather than Wire, and strict=True is also not set there. Coercion paths therefore differ from the rest of the wire. The ProvenanceV2 timestamp is required, but checkpoint_at falls under both the base ISO validator and the utc validator; their ordering was not checked. No fixture covers alias forms, absent-versus-null for receipt_ref/source_kind, or a duplicate alias plus snake key.",
      "required_change": "State normatively, and enforce, which spelling is canonical for provenance and receipt fields: snake_case only, or the documented exact ReceiptAnchor aliases only inside receipt refs. Apply strict typing to ProvenanceV2. Add fixtures for camelCase provenance keys, mixed alias/name collisions, and null versus absent receipt_ref. Required by AC2 (exact fields/casing, aliases, absent/null semantics)."
    },
    {
      "id": "A3",
      "severity": "medium",
      "path": "tests/test_ccm_contracts_v2.py",
      "location": "test_contract_only_vectors_are_present; fixture states/visibility/parent_rejections/legacy/transitions",
      "evidence": "Trigger: fixture entries such as parent_rejections ['missing','invisible',...], visibility cases, legacy cases and the 10 caution transitions are bare labels or expected values with no input records. Behavior: the only test asserts counts and a few constants (len==3, len==10, score==0.18). A rewrite of any state row, for example all_lost archival 'superseded', or removal of the partial-loss archival combination for buffered/superseded, still passes. AC4/AC7 require equality, repeated-signal and all surviving-parent archival combination vectors, and required inputs. The legacy cases are not decoded through any legacy-admission schema. The legacy case's receipt_ref uses camelCase inside a block that has no schema.",
      "required_change": "Turn the contract vectors into structured input→expected tuples: parent sets with resolved states, signal_time versus last_revalidated_at, prior archival/validity, and the expected result. Tests must at minimum pin each vector's exact expected content against independently specified literals and assert structural completeness, covering all four surviving archival states × partial/all loss, equal/older signals, and repeated signals. Document honestly that no executor exists. Required by AC4/AC7."
    },
    {
      "id": "A4",
      "severity": "medium",
      "path": "src/keon/cortex/ingress/models_v2.py",
      "location": "ShardV2 lineage_graph/superseded_by vs scoped IDs; InheritanceV2.provenance_refs",
      "evidence": "Trigger: superseded_by is set to the shard's own would-be ID, or lineage_graph contains a 64-hex string of an arbitrary tenant's shard. Behavior: the input is accepted, with no self-reference, scope-binding or ID-kind declaration. The spec says lineage refs must be scoped IDs resolved under current scope, but there is no fixture that uses an ID generated by make_scoped_candidate_shard_id inside lineage_graph or superseded_by. InheritanceV2 accepts duplicate provenance_refs, which the doc admits, and caution_envelope duplicates for the same role/domain, which contradicts the element-wise-max merge semantics. tenant_id is producer-set in ShardV2, and the only check is consistency with provenance.",
      "required_change": "Freeze in the document and fixtures that lineage/replacement references are unresolved candidate pointers whose admission requires scoped resolution, with negatives for cross-tenant and self-replacement. Use a real scoped ID in a positive fixture. Either reject duplicate (role_id, domain_tag) caution entries or specify the merge semantics, and decide on provenance_refs distinctness. Required by AC2 and the state contract."
    },
    {
      "id": "A5",
      "severity": "medium",
      "path": "tests/fixtures/ccm/contracts-v2.json",
      "location": "civic.rejection / failure_receipt_ref; v1_replay",
      "evidence": "Trigger 1: rejection_reason_class='failed_verification' with failure_receipt_ref null. Behavior: accepted, and there is no fixture marking it non-Repulsive-admissible. failure_receipt_ref has no negative or alias fixtures. Trigger 2: old replay covers only one v1 candidate ID and one scoped ID. There is no handoff-scope ID, no shards/1.1 provenance replay, and no assertion that v1 payloads fed to decode_v2 are rejected or migrated, so AC2 'old-version replay inputs' and 'source-kind migration' are thin. There is also no UTC negative for an offset such as +01:00, '-00:00' or fractional overflow.",
      "required_change": "Add fixtures for: proof-required reasons without a receipt being labeled non-admitting; receipt anchor alias, empty and NUL negatives; a handoff scoped ID; shards/1.1 provenance replay; v1 payload rejected by decode_v2; and the UTC offset negatives listed above."
    }
  ],
  "ac_coverage": [
    {
      "id": "AC1",
      "assessment": "Partial. Enums are additive and correct. Superseded-null and derived_decay_state are rejected. However, the evidentiary projection of producer-supplied direct tiers on derived or parented records is not closed (A1)."
    },
    {
      "id": "AC2",
      "assessment": "Partial. The 63-row matrix and the error code are present. Wire casing and aliases are not exact (A2). Replay, migration and UTC negatives are thin (A5). Lineage refs are not scoped (A4)."
    },
    {
      "id": "AC3",
      "assessment": "Partial. Resolved math values are documented, but there is no executable or structured negative input for parent-resolution failures. The inline-flag cases are rejected only via extra=forbid."
    },
    {
      "id": "AC4",
      "assessment": "Contract text is adequate. Fixture vectors are labels only and tests check inventory counts (A3)."
    },
    {
      "id": "AC5",
      "assessment": "Largely present in the document: S03–S12, DDL by appendix reference plus overrides, and the dependency outline. Acceptable for a contract-only parcel."
    },
    {
      "id": "AC6",
      "assessment": "Mostly met in text: empty allowlist, open dependency recorded. Legacy fixture cases are not schema-validated."
    },
    {
      "id": "AC7",
      "assessment": "Partial. Old replay hashes use external literals, which is good. Visibility, terminal and transition invariants are not bound by tests to their named expectations (A3)."
    }
  ],
  "coverage_gaps": [
    "Existing v1 full-shard serializer/tests and full canon omitted; v1 storage dict replay is not fully verifiable.",
    "Fix (and add fixtures for) validator ordering between the base and v2 validators on ProvenanceV2.checkpoint_at.",
    "No test proves decode_v2 suppresses __cause__ for nested-model errors beyond invalid_shard cases.",
    "Edge hash recipe has no executable fixture vector."
  ]
}
```

## Review B

```json
{
  "verdict": "CHANGES_REQUIRED",
  "findings": [
    {
      "id": "B-01",
      "severity": "high",
      "path": "src/keon/cortex/ingress/models_v2.py",
      "location": "ProvenanceV2 (inherits CandidateProvenance) / ShardV2.structure",
      "evidence": "Trigger: a producer submits provenance {source_kind:'deterministic_code_or_event', receipt_ref:{receiptId,integrityHash}} together with provenance_tier:'verified_receipt'. decode_v2 accepts it, and projected_authority returns 'Receipt'. Behavior: ProvenanceV2 does not set strict=True and keeps the camelCase aliases, so aliased inputs are accepted. The direct tier is a producer-selected Literal, and classification() maps it straight to the evidentiary label. Nothing on the DTO marks the projection as unadmitted. The legacy fixture asserts unverified_candidate for this pattern, but no test executes that assertion; it only appears in the inventory list.",
      "required_change": "Violates the frozen requirement that a source tier needs its own trusted admission and that a receipt pointer or source_kind proves nothing (AC1/AC6). Either rename or annotate projected_authority as requested_unadmitted on the DTO, or reject direct evidentiary tiers in producer DTOs absent an admission token. Add an executed negative test showing that a producer-supplied verified_receipt plus receipt_ref never yields admitted Receipt standing."
    },
    {
      "id": "B-02",
      "severity": "high",
      "path": "tests/test_ccm_contracts_v2.py",
      "location": "test_contract_only_vectors_are_present",
      "evidence": "Trigger: AC3, AC4 and AC7 require tests to assert externally specified results. Behavior: the state transitions, the parent-loss combinations across all surviving archival states, equality and repeated revalidation, visibility, the resolved math and the parent rejections are only checked by count or by picking a single value, e.g. len(visibility)==3, score==0.18, len(transitions)==10. 'all_lost' has no per-state rows for buffered, superseded or archived. No surviving-state × loss-type matrix with expected outputs exists. The 0.70 Procedural case is never computed or cross-checked against the specified formula.",
      "required_change": "Violates AC4/AC7 ('test equality, repeated signals and all surviving-parent archival combinations'). Freeze explicit input→expected rows for each surviving state × {partial, all-lost} plus purged, for the equality, older and repeated signal cases, and for both resolved-math rows. Tests must at least validate the structural completeness of these rows against a pure reference. Coverage must be honestly labeled per row."
    },
    {
      "id": "B-03",
      "severity": "medium",
      "path": "src/keon/cortex/ingress/models_v2.py",
      "location": "Wire.clean_strings / nested lists; CautionV2/InheritanceV2 ReceiptAnchor",
      "evidence": "Trigger: a NUL character inside lineage-free nested strings such as success_task_keys items or provenance_refs is still caught by identifier checks. However, nested ReceiptAnchor inside the strict Wire models inherits the non-strict, populate_by_name config. Both receiptId and receipt_id are accepted, and if a payload supplies both forms the outcome depends on Pydantic precedence. The doc admits that 'additional aliases' were not frozen, and the fixture never enumerates alias/snake duplicates or nested null and absence behavior for failure_receipt_ref or approval_ref.",
      "required_change": "Violates AC2's exact-civic-wire requirement (fields, casing, aliases, absent vs null). Freeze and test the accepted encodings for nested receipts: alias only, snake only, both forms, null, absent and extra keys. Correct the doc's stale 'not supplied' blocker now that the host definitions are attached."
    },
    {
      "id": "B-04",
      "severity": "medium",
      "path": "docs/specs/ccm-memory-graph-v2.md",
      "location": "Plane-A DDL and graph interfaces",
      "evidence": "Trigger: a downstream P3 builder reads the 'Required DDL/storage overrides'. Behavior: the doc does not add the tenant/profile/role/scope columns, the logical artifact identity column, the interval CHECK, or the endpoint-registry interface as DDL. It also explicitly defers 'executable constraint/authorization mechanisms' to P3. The cursor binding, the deletion milestone state enum, the job schema and the key-adapter status values are prose only, with no frozen field names or states.",
      "required_change": "Violates the work order's requirement that the contract doc owns Plane-A DDL and the cleanup/key-custody interfaces, and its rule that downstream builders consume rather than choose architecture (AC5). Provide concrete amended DDL columns and constraints, plus enumerated milestone, job and key-status schemas."
    },
    {
      "id": "B-05",
      "severity": "medium",
      "path": "tests/fixtures/ccm/contracts-v2.json",
      "location": "v1_replay / old-version replay",
      "evidence": "Trigger: AC2/AC7 require old-version replay inputs. Behavior: there is a single v1 candidate and one scoped ID, with no shards/1.1 provenance input such as sourceKind or checkpointAt. Neither a shards/1.0/1.1 payload nor the source-kind→v2 migration mapping is replayed through v2 or legacy-admission. Handoff scoped IDs and legacy make_shard_id raw-concat IDs are also absent.",
      "required_change": "Add 1.0/1.1 replay vectors, including handoff scoped and legacy raw-concat IDs, with externally specified digests. Add source-kind migration rows with expected tier outcomes."
    }
  ],
  "ac_coverage": [
    {
      "id": "AC1",
      "assessment": "Partial. The enums and the 63-cell matrix are executed. The null-replacement superseded and derived_decay_state cases are rejected. The trust projection is producer-selectable (B-01)."
    },
    {
      "id": "AC2",
      "assessment": "Partial. The matrix, the error code and the UTC cases are present. Old-version replay, migration, and nested alias/null wire coverage are thin (B-03, B-05)."
    },
    {
      "id": "AC3",
      "assessment": "Inventory only. The math and the parent negatives are listed but not asserted or computed (B-02)."
    },
    {
      "id": "AC4",
      "assessment": "Inventory only. There is no per-combination state matrix (B-02)."
    },
    {
      "id": "AC5",
      "assessment": "Partial. The S03–S12 prose, the dependency outline and the api.py owner are present. The DDL overrides and the deletion and key interfaces are not frozen (B-04)."
    },
    {
      "id": "AC6",
      "assessment": "Mostly met in the doc, with an empty allowlist. The trust-laundering path is not exercised by executed tests (B-01)."
    },
    {
      "id": "AC7",
      "assessment": "Partial. The visibility cases are listed but unasserted. Honest labeling is present. The P1B identity hashes are referenced but not individually pinned for the gravity fixtures."
    }
  ],
  "coverage_gaps": [
    "The full v1 serializer and its tests were omitted, so v1 hash invariance beyond a single vector cannot be confirmed.",
    "The supplied evidence includes no diff of taxonomy.py against its baseline hash, beyond the visible additive enums.",
    "No executed checks exist for the graph cursor, truncation or cycle contracts, or for deletion idempotency.",
    "The P1C consumer requirements text was not supplied, so S11 wire conformance could not be fully verified."
  ]
}
```

## Host disposition

```json
{
  "status": "One focused architecture repair approved by delegated authority",
  "reproductions": {
    "producerLabel": {
      "projected": "Receipt",
      "explicitAdmittedMarker": false
    },
    "camelProvenanceAccepted": true,
    "receiptCollisionAccepted": "receipt-a",
    "duplicateCautionAccepted": 2,
    "wrongFixtureStateAndScoreStillPassInventoryTest": true
  },
  "decisions": [
    {
      "ids": [
        "A1",
        "B-01"
      ],
      "disposition": "FIX explicit requested_authority and read-only admitted=False; preserve all63frozen classification mappings, do not reject legaltier/kindrows just because reviewer suggestedit; no positive produceradmission"
    },
    {
      "ids": [
        "A2",
        "B-03"
      ],
      "disposition": "FIX strictsnakecase provenance, normative nestedreceipt alias/name/null/extra rules and collisionreject in v2boundary; preserve v1ReceiptAnchor/CandidateProvenancebehavior"
    },
    {
      "ids": [
        "A3",
        "B-02"
      ],
      "disposition": "FIX structured externallyspecified input/result vectors and bindingtests for all archival/loss/time cases, math,visibility,legacy,caution; no futureworker implementation"
    },
    {
      "ids": [
        "A4"
      ],
      "disposition": "FIX freezeunresolvedscopedreference admission/selfreplacement/crossscope vectors; reject duplicatecautionrole/domain; canonicalscopedpositiveIDs"
    },
    {
      "ids": [
        "A5",
        "B-05"
      ],
      "disposition": "FIX 1.0/1.1/handoff/rawconcat replay, UTC/receipt negatives and failure-reasonnonadmission cases"
    },
    {
      "ids": [
        "B-04"
      ],
      "disposition": "FIX concrete amended scopedPlaneADDL and registry/milestone/job/key/cursorinterfaces in DOCUMENT ONLY, preserving currentidentity/visibilitylaw; do not applyDBDDL or inventqualifiedkeyprovider"
    }
  ],
  "scope": "Same5allowedpaths; preserve oldv1and238test identities; one repair Step0 thenone sourceproposal. ModelSolmedium, maxinput60000 each/maxoutput1536then16384, singleHTTPrequesteach, no retries, <=$0.50 modeledcombined,600seccombined local observation. Sourceeffects hostonly. Required2reviewclosureafterrepair; no selfacceptance."
}
```
