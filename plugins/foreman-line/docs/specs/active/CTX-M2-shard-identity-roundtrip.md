---
ticket: CTX-M2
title: Shard identity round-trip, backward-compatible serializer, and replay verifier
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - src/keon/cortex/ingress/models.py
  - src/keon/cortex/ingress/models_v2.py
  - src/keon/cortex/core/models.py
  - src/keon/cortex/spine/shard_plane.py
  - src/keon/cortex/spine/serializer.py
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: equivalence-provable
expertise: engineering
thinking_level: high
---

## Intent

Make every shard-identity input round-trip exactly — especially `extractorVersion` — through serialization, restart and replay: a write accepted under an advertised version must always replay and recall under that same version. F3 regression (today: ingest `extractorVersion:v2` returns 200, matching recall excludes it, replay reports `match:false`) becomes a durable test. Deliver a backward-compatible serializer and a replay verifier with source-by-source compatibility fixtures, rejecting identity tampering (source, scope, version). This is charter M2; it closes the "accepted writes that cannot replay under their advertised version" zero-tolerance item (charter §8.2) at the identity layer.

## Constraints

Dependencies: P0 identity-contract disposition (CD-4 — the shard-identity contract register entry, including the Q2 support policy below) settled before dispatch. M2's migration lands before dependent provider work (charter §6.3 Stream B). Locked invariants (charter §3): immutable historical IDs and pinned scoring versions are preserved; **legacy v1 defaults must produce byte-unchanged IDs**; existing shard IDs are never rewritten to achieve evidence-format consistency (hazard 8).

**Open contract question Q2 (pending disposition, proposed default recorded):** support policy for non-v1 extractor versions. Proposed default: **accept and guarantee round-trip** — non-v1 versions are either rejected cleanly before reservation or accepted and recall/replay succeeds after restart, and the shipped policy is *accept + round-trip* with a documented version-support matrix. The alternative (reject non-v1 before reservation) is narrower and also acceptable if dispositioned; whichever is chosen is documented and tested both ways for the rejection path. No hybrid ambiguity may remain: an accepted write can never become unretrievable.

No change to frozen gravity mathematics; the index remains derivative of identity-stable content. Provider serializers must agree byte-for-byte with the canonical serializer on fixtures.

## Allowed Files

- src/keon/cortex/ingress/models.py
- src/keon/cortex/ingress/models_v2.py
- src/keon/cortex/core/models.py
- src/keon/cortex/spine/shard_plane.py
- src/keon/cortex/spine/serializer.py
- src/keon/cortex/api.py
- tests/test_ingress_models.py
- tests/test_shard_identity_proof.py
- tests/test_shards_v1_1.py
- tests/spine/test_shard_identity_roundtrip.py

Manifest amendment (2026-10-30, recorded): `src/keon/cortex/api.py` added — the charter M2 row
includes the ingest adapter, and the record construction site (`_build_record`) plus the `/v1/replay`
docstring live there. The api.py touch is bounded to extractor-version plumbing (seam rule: M1's
coordinator-allocated window owns semantic changes).

## Migration & Compatibility

Legacy v1 records produce unchanged IDs before and after this change (fixture-pinned). The serializer is backward compatible: old bytes deserialize to the same identity; new versions serialize deterministically. Any schema change is additive and version-tagged; upgrade and restart tests prove previously accepted writes still recall and replay. Where existing data contains accepted-but-unretrievable non-v1 records (the F3 population), the reconciliation approach (re-index vs explicit limitation record) is proposed in the P0 register and dispositioned before implementation — no silent data rewrite.

## Acceptance Criteria

AC-1 (F3 regression): under the dispositioned policy, an `extractorVersion:v2` write is either rejected before reservation or accepted and then recallable and replayable with `match:true` after restart — the shipped policy's path is tested end-to-end in memory and live-PG modes.
AC-2 (M2): every shard-identity input (including extractor version, source, scope) round-trips through the serializer exactly; a dedicated identity-invariant test covers each field.
AC-3 (M2): legacy v1 defaults produce byte-identical IDs to the current implementation (fixture-pinned before/after comparison).
AC-4 (M2): tampering source, scope or version post-acceptance is rejected by the replay verifier; idempotent re-ingest of the identical record still succeeds.
AC-5 (M2): source-by-source compatibility fixtures pass for each served provider serializer against the canonical serializer.
AC-6: the documented version-support matrix matches the implemented policy exactly (no undocumented acceptance or rejection).
AC-7: existing ingest, shard and identity suites pass unchanged; zero skipped required cases.

## Out of Scope

Lifecycle/recall semantics (M1); read-time corruption handling (P3b); chain/codec envelopes (P5 — M2 touches identity, not evidence envelopes); batching (M3); any re-indexing of historical data without an approved reconciliation plan; any ID rewrite; benchmark work (M5).

## Reviewer Questions

1. Can an accepted write with any supported or advertised version become unretrievable or replay-mismatched?
2. Do legacy v1 IDs remain byte-identical across the change?
3. Is the rejection path (pre-reservation) clean — no partial state, no reserved-but-dead shard?
4. Does the replay verifier catch single-field identity tampering on source, scope and version?

## Context & References

- Charter §5 M2 row, §2.2 finding F3, §3 identity invariants, §8.2 zero tolerance; S1 G2(4) (canonicalization consistency, adjacent)
- keon-cortex src/keon/cortex/ingress/models.py, models_v2.py; core/models.py; spine/shard_plane.py, serializer.py
- P0 contract-decision register (identity contract + Q2 disposition) — required before dispatch

## Verification Plan

Dedicated `tests/spine/test_shard_identity_roundtrip.py` (F3 regression with restart, per-field round-trip, tamper rejection, v1 ID stability fixtures) plus existing ingest/shard suites; run in memory and live-PG modes (`KEON_TEST_DATABASE_URL`), zero-skip. Review focus: any identity input that does not round-trip? Any path where acceptance precedes retrievability? Receipt per charter §8.3 maps ACs to commands and records the Q2 policy actually implemented.
