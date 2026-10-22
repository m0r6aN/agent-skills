# P1A independent post-repair closure — October21 NY

Both independent Opus5.5 reviews returned PASS, closed all their own initial findings, and reported only low documentary nits. The coordinator/operator applied the exact nits without code, fixture or test semantics changes. No paid re-review was needed for these mechanical edits.

## Seat A

```json
{
  "verdict": "PASS",
  "closure": [
    {
      "id": "A1",
      "disposition": "closed",
      "evidence": "The legal 63-cell matrix is preserved. ShardV2 exposes only the local requested_authority property, and there is no projected_authority (test asserts not hasattr). Every Wire DTO has a read-only admitted property returning Literal[False]. Supplying admitted or requested_authority as input is an extra-field rejection, and neither is serialized. The unadmitted_requests fixtures cover parented_direct (Derived+verified_receipt+lineage), distilled_without_parents and claimed_source_receipt, each pinned to requested≠admitted. The document states that classification is a request and that the trusted admission boundary resolves parents. This satisfies option (a) of the required change without breaking the frozen mappings."
    },
    {
      "id": "A2",
      "disposition": "closed",
      "evidence": "ProvenanceV2 redeclares every field without aliases and sets strict=True and extra=forbid. populate_by_name with no aliases is inert. _prepare cleans nested strings and keys. invalid_provenance rejects every camelCase key, wrong-type scalars, non-empty extra, null timestamp and a +01:00 checkpoint. Receipt lexical rules (exactly one spelling per element, collisions, extras, empty, NUL) are tested at all four surfaces. The null-versus-absent tests show equal canonical output. Inherited ISO validation plus the V2 utc validator both apply, and bad_utc is enforced on every event surface."
    },
    {
      "id": "A3",
      "disposition": "closed (contract-only)",
      "evidence": "Parent_loss vectors are now structured input→expected tuples. They cover all four surviving archival states × partial/all loss, pinned against independently written literals in the test. Signal vectors cover purged terminal, equal and older no-ops, a repeated consumed signal id, archived revalidation staying archived, symbol→stale and failure→contested. Retention vectors include the strict 0.5/0.25 boundaries. The tests and document honestly state that no executor exists."
    },
    {
      "id": "A4",
      "disposition": "closed",
      "evidence": "A real scoped ID (independent SHA256 of the pinned canonical preimage) is used in both lineage_graph and superseded_by. reference_admission vectors cover cross-tenant, invisible, substituted (handoff) and self-reference cases. The document freezes pointers as unresolved scoped candidate pointers that require resolution. Duplicate (role_id, domain_tag) caution entries are rejected with caution_duplicate and tested. provenance_refs, parent_generation_ids and lineage_graph distinctness is enforced."
    },
    {
      "id": "A5",
      "disposition": "closed",
      "evidence": "warning_admission marks failed_verification with a null or unverified receipt as non-admitting and policy_preference as Episodic dissent. Receipt alias, empty and NUL negatives are present. A handoff scoped ID, the legacy raw preimage and shards/1.1 provenance replay through the V1 model are covered. decode_v2 rejects the V1 payload, the 1.0/1.1 literals and the camel 1.1 provenance. bad_utc includes +01:00, -00:00, 7-digit fractions, an invalid date and a trailing newline."
    }
  ],
  "findings": [
    {
      "id": "N1",
      "severity": "low",
      "path": "docs/specs/ccm-memory-graph-v2.md",
      "location": "Status section; Retained baseline paragraph",
      "concrete_trigger": "Read the document against the fixture and the host result.",
      "behavior": "The document states contract/fixture version ccm-contracts/2.0.0, but the fixture is ccm-contracts/2.0.1. It also says the repair tests 'await the host run; no new pass count is asserted', while the host reports 399 passing.",
      "violated_requirement": "AC2/AC7 exact version identity for P1C/P1B conformance; honest completion records",
      "required_change": "Align the document's version to the fixture's 2.0.1 (or the reverse). Record the host post-repair result at acceptance rather than leaving stale text."
    }
  ],
  "ac_coverage": {
    "AC1": "Met. Additive enums with ranks preserved. Closed tier/kind table, superseded-null rejection and derived_decay_state rejection. Purged and buffered-without-evidence are rejected. V1 is reported byte-identical.",
    "AC2": "Met. Total matrix, replay, real IDs, UTC, states, legacy and civic wire with exact fields/casing/null semantics. Error code pinned. Minor version mismatch (N1).",
    "AC3": "Met as contract. Decimal recomputation of resolved math. Empty/NaN and inline flags rejected. Parent-resolution negatives are pinned literals.",
    "AC4": "Met as contract vectors, pinned to independent literals. Equality no-op, archived revalidation and purged untouched are covered. No executor (permitted).",
    "AC5": "Met per main sections: DDL, routing, cursor/budget, deletion/key-custody schemas and the dependency outline. S03–S12 completeness relies partly on the omitted appendix.",
    "AC6": "Met under the amendment. legacy-admission/1.0, empty qualified_producers, unauthenticated cases stay unverified. The dependency is explicitly open.",
    "AC7": "Met. Independent literals and SHA preimages, visibility negatives against existing law, terminal cases, replay and an honest coverage section."
  },
  "coverage_gaps": [
    "The normative appendix and the full V1 serializers/tests were omitted from this packet. V1 invariance relies on host byte-identity and the 238-identity pass claims; I could not inspect them.",
    "No runtime evidence covers the resolver, state/caution workers, SQL/RLS, traversal, purge or key custody. These remain open by design.",
    "The fixture was supplied whitespace-minimized, so its SHA cannot be checked against the bytes I saw.",
    "P1C source/copy comparison and accepted commit pins are pending."
  ]
}
```

## Seat B

```json
{
  "verdict": "PASS",
  "closure": [
    {
      "id": "B-01",
      "disposition": "closed",
      "evidence": "projected_authority has been removed. ShardV2 now exposes only the local requested_authority property, and every Wire carries a read-only admitted=False. Supplying either property as input is an extra-field error. test_requested_is_not_admission executes the claimed_source_receipt row (verified_receipt + source_kind deterministic + receipt_ref) and asserts admitted False. It also checks that setattr fails and that admitted/requested_authority inputs are rejected. ProvenanceV2 is now strict with extra=forbid, and its fields are redeclared without aliases. test_strict_snake_provenance rejects tenantId, receiptRef, sourceKind and the other camelCase keys. The doc states that classification is a request, never admission. The frozen 63-cell matrix is preserved and test_total_matrix executes it."
    },
    {
      "id": "B-02",
      "disposition": "closed",
      "evidence": "test_state_contract_literals pins all 8 surviving-state × {partial, all} parent-loss rows with full literal input and expected values. Pinned signal rows cover purged, equal, older and repeated (consumed id) signals, archived revalidation, symbol change and failure. Retention rows cover the strict 0.50 and 0.25 boundaries and reactivation that preserves validity. test_independent_trusted_math recomputes both resolved-math rows with Decimal against the specified formula. These are honestly labeled as contract-only vectors, which is acceptable under this parcel's scope."
    },
    {
      "id": "B-03",
      "disposition": "closed",
      "evidence": "The _receipt lexical boundary is applied at all four receipt surfaces. It requires exactly one spelling per element, and it rejects both-form duplicates (even when values agree), extra keys, null, non-string, empty and NUL values. Fixture receipts.accepted and receipts.rejected are exercised on every surface. Null versus absent for failure_receipt_ref and approval_ref is tested, along with null list elements and a null array. Canonical output uses receiptId/integrityHash and round-trips. The stale 'not supplied' claim is withdrawn in the doc."
    },
    {
      "id": "B-04",
      "disposition": "closed",
      "evidence": "The doc now provides concrete DDL. It adds graph_scope_bindings (tenant/profile/role/scope plus handoff CHECKs), graph_endpoint_registry with a receipt subtype, logical_artifact_id and interval CHECKs, and typed composite FKs. Fixed deferred-trigger rules and an RLS/visibility projection are specified. The cursor gains enumerated fields and status values. Schemas are frozen for purge-status/1 milestones and states, cleanup-job/1 (with uniqueness and idempotency), key-destroy-request/1 and key-destroy-status/1 (including the coverage enum)."
    },
    {
      "id": "B-05",
      "disposition": "closed",
      "evidence": "Replay now covers several identity recipes, each with an independent SHA256 over a frozen preimage: the v1 candidate canonical, scoped and handoff identities, and legacy make_shard_id raw concatenation. It also replays shards/1.1 provenance (sourceKind, checkpointAt, receiptRef) through v1 CandidateProvenance. decode_v2 rejects shards/1.0, shards/1.1 and v1 provenance payloads. The legacy-admission/1.0 cases map null, unknown and claimed-deterministic-with-receipt sources to unverified_candidate with admitted False, and qualified_producers is empty, consistent with amended AC6."
    }
  ],
  "findings": [
    {
      "id": "N-01",
      "severity": "low",
      "path": "docs/specs/ccm-memory-graph-v2.md",
      "location": "Status section vs fixture version",
      "concrete_trigger": "A P1C consumer pins the contract version stated in the doc.",
      "behavior": "The doc states ccm-contracts/2.0.0 while the fixture declares ccm-contracts/2.0.1. The doc also still says the host repair run is pending and asserts no pass count, which is stale now that host verification exists.",
      "violated_requirement": "AC2/AC7: exact source/version identities for downstream conformance, and honest completion reporting.",
      "required_change": "Align the doc version with the fixture (2.0.1) and replace the pending-run wording with the retained host result identity at acceptance."
    },
    {
      "id": "N-02",
      "severity": "low",
      "path": "docs/specs/ccm-memory-graph-v2.md",
      "location": "Amended table DDL ordering",
      "concrete_trigger": "Someone applies the DDL literally in the order written.",
      "behavior": "graph_edges references graph_endpoint_registry_receipts before that table is declared. The table appears only in a later note, and its FK is circular-adjacent through the registry.",
      "violated_requirement": "AC5: coherent DDL contract.",
      "required_change": "Reorder the subtype CREATE TABLE before graph_edges in the normative block."
    }
  ],
  "ac_coverage": {
    "AC1": "Additive enums are present. v2 enforces the closed tier/kind/state rules, rejects superseded with a null replacement, and rejects derived_decay_state. v1 is byte-identical per host.",
    "AC2": "The fixture enumerates the 63 cells, replay inputs, real IDs, UTC times, transitions, legacy migration and civic wire cases with the single error code. The doc/fixture version mismatch is noted as N-01.",
    "AC3": "Resolved math is independently recomputed. Parent-rejection negatives are pinned as contract literals.",
    "AC4": "All four AC4 worked cases (buffered all-loss, archived partial, purged untouched, equality no-op) and archived non-restoration are pinned, covering the full 8-row matrix.",
    "AC5": "S03–S12 tables, Plane-A DDL, deletion/key schemas and the dependency outline are present. There is a minor DDL ordering issue (N-02).",
    "AC6": "The contract is defined. No qualified producers exist, and the open dependency is explicitly recorded. Closed as contract-only.",
    "AC7": "Expectations are externally pinned and visibility negatives run against the real is_record_visible. Coverage is honestly labeled as contract-only."
  },
  "coverage_gaps": [
    "Normative appendix, full v1 serializers/tests and baseline evidence were omitted from this packet; I relied on host attestation of byte-identity and 399 passing tests.",
    "No runtime evidence for SQL constraints, triggers, RLS, traversal, cursors, purge workers, key custody or caution executor; these are contract-only by scope.",
    "Positive legacy-producer authentication and cross-language P1C conformance remain open.",
    "The fixture was supplied whitespace-minimized; SHA binding was not independently verified."
  ]
}
```

## Disposition and limits

{
  "atUtc": "2026-10-22T01:55:27.893450+00:00",
  "status": "Two independent Opus closures PASS; all original findings closed; low documentary nits corrected mechanically",
  "reviews": [
    "p1a-independent-closure-A-20261021.json",
    "p1a-independent-closure-B-20261021.json"
  ],
  "hostDisposition": [
    {
      "ids": [
        "A.N1",
        "B.N-01"
      ],
      "action": "Align document fixture version to 2.0.1 and record actual 399-test host evidence"
    },
    {
      "ids": [
        "B.N-02"
      ],
      "action": "Move existing unchanged receipt subtype CREATE before graph_edges within normative SQL block"
    },
    {
      "action": "Restore existing taxonomy CRLF convention; byte-format-only, no AST change"
    }
  ],
  "normativeAppendixUnchanged": true,
  "codeTestsFixtureUnchangedSince399Pass": true,
  "candidatePinsAfter": {
    "src/keon/cortex/envelope/taxonomy.py": "08abe50559cb3a01a634fb319982a8304ee424dfef29d0660bc969ef06af38be",
    "src/keon/cortex/ingress/models_v2.py": "ecf7ea3a50f08435f1f07204f3e2828cf146200515f87707063cfc2756032dcf",
    "tests/fixtures/ccm/contracts-v2.json": "c419250a4a9e232aca9a168ffeb7bb20b3acaf9746e6b7bc06babad8c1de9e90",
    "tests/test_ccm_contracts_v2.py": "b6714d9f28556e9f238eda38ca0f50a5a520c71b0910fb2cbbb877ecfb1c38a2",
    "docs/specs/ccm-memory-graph-v2.md": "0fb819cf5f96cf05fe1e6ec6bec3b831fb379173bf9e089acffe0458eb6059a2"
  },
  "testResult": "p1a-focused-repair-validation-20261021.json",
  "runtimeSqlApplied": false,
  "sourceAccepted": false,
  "merged": false
}

Closure packets include complete repaired code/tests and every fixture key/value (fixture whitespace minimized), exact work order and document main sections, each seat’s own original findings, and imported v1 type excerpts. The unchanged normative/historical appendix and full v1 serializers/tests are omitted; both earlier complete initial reviews remain part of the evidence chain. Host hash comparison proves appendix, old source and test retention; the 399-test result covers DTO/contracts only. No resolver, SQL/RLS, traversal, cleanup, key erasure, civic executor or cross-language conformance is qualified here. Zero positive trusted migration producers.
