---
ticket: CTX-P2
title: Pinned-trust evidence verifier, key-ID binding, and explicit integrity-only mode
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - src/keon/cortex_governed/evidence_pack.py
  - src/keon/cortex_governed/evidence_pack_serialization.py
  - src/keon/cortex_governed/evidence_pack_verifier.py
  - src/keon/cortex_governed/key_registry.py
  - src/keon/cortex_governed/cli.py
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: equivalence-provable
expertise: security
thinking_level: high
---

## Intent

Make every library, independent and CLI evidence-pack verification path require a pinned key or trust bundle and fail with a distinct reason when none is supplied; rename embedded-key verification to an explicit "integrity-only" mode that never presents itself as trusted verification. Bind key IDs to purpose, carry versioned signed metadata, and turn the S1 forged-pack PoC (F1: attacker-selected trust — library verifiers returned true and `keon-governed receipt verify` exited 0 with `ok:true, offline_embedded_key`) into a regression that must fail on every covered path (library, independent, CLI). This is charter P2 / S1 G1 / S3 P2 (T2.*): pinned-key verification first (D3), before any vault or trust-bundle distribution work (P1/P7).

## Constraints

Dependencies: **no completed P1 required** (pinned-key verification is the P2 deliverable). The shared evidence wire fields must be agreed with the P1/P5 codec seam first (charter hazard 8 / CD-5): P2 does not invent a temporary envelope; canonical bytes, numeric/Unicode rules, domain separation, key encodings, key-ID derivation, algorithm allowlist, signature encoding and signed timestamp fields come from the single shared codec contract. ECDSA signatures are compared by canonical payload/digest, never by requiring byte-identical fresh signatures. Preserve the legacy `verified` field's meaning and version compatibility (hazard 5 / CD-6): integrity is not currency or truth; no silent reinterpretation. Historical verification adapters for legacy unsigned material stay explicit — legacy timestamps never retroactively become authenticated (hazard 8), and no re-sign-and-verify shortcut may be presented as historical integrity. `generated_at` and the verified decision/receipt digest belong inside the signed payload (G2(5)) to the extent the P2 wire fields cover them; full canonicalization unification is P5's codec contract consuming this seam.

Served-path boundary: the served evidence surface (`api.py` `_verify_signed_evidence`, `POST /v1/evidence/verify`) is a named follow-on delivered in the coordinator-allocated `api.py` single-writer window (§6.3); until then the served path's existing fail-closed behavior when the trust registry is unconfigured is the interim guarantee, and this parcel explicitly does not claim the served path.

Zero tolerance (charter §8.2): a forged pack verifying successfully on any path is a stop-ship defect. Tests use throwaway keys generated at test time; no key material in fixtures, docs, or logs.

## Allowed Files

- src/keon/cortex_governed/evidence_pack.py
- src/keon/cortex_governed/evidence_pack_serialization.py
- src/keon/cortex_governed/evidence_pack_verifier.py
- src/keon/cortex_governed/key_registry.py
- src/keon/cortex_governed/cli.py
- tests/governed/test_evidence_pack.py
- tests/governed/test_evidence_pack_serialization.py
- tests/governed/test_evidence_pack_verifier_v2.py
- tests/governed/test_key_registry.py
- tests/governed/test_cli.py
- tests/governed/test_verification_modes.py
- tests/governed/test_pinned_trust_regressions.py

## Migration & Compatibility

Existing packs and receipts keep their historical verification semantics under explicit legacy adapters; existing shard IDs and receipt identities are never rewritten. CLI output changes are breaking by design (integrity-only mode must not print top-level `ok: true`); document the exit-code contract in the CLI help and README-equivalent docs that live in the allowed files' scope. A schema/version field distinguishes metadata versions; unknown major versions are rejected, unknown minor fields follow the shared codec contract's rule.

## Acceptance Criteria

AC-1 (T2.1): PoC 3 as a regression — a pack signed with a fresh key labelled as the production key id is rejected on the library path, the independent path, and the CLI path.
AC-2 (T2.2): missing pin fails with distinct reason `no_trust_anchor`.
AC-3 (T2.3): key-id mismatch is rejected (binding between key id, purpose, and trust anchor enforced).
AC-4 (T2.4): revoked and retired key tests pass (revoked/retired keys rejected per registry state; wrong-purpose keys rejected).
AC-5 (T2.5): CLI output for integrity-only mode contains no top-level `"ok": true`; integrity-only results are labelled as integrity-only everywhere they surface.
AC-6 (T2.6): a pack with a changed `generated_at` fails verification.
AC-7 (G1): embedded-key mode is renamed "integrity only"; `keon-governed receipt verify` and `verify_evidence_pack*` require a pinned key or trust bundle; all CLI exit codes are distinct and documented.
AC-8: unknown-version behavior, timestamp tampering, and missing/unknown/wrong-purpose/retired/revoked keys each have an explicit test; every covered verification path (library, independent, CLI) fails closed (never warns-and-continues). The served path is out of this parcel's claim (named follow-on, see Constraints).
AC-9: the forged-pack, embedded-key, and tamper tests fail against the pre-change code (proving they are real regressions).
AC-10: scoped deterministic checks pass (package tests, typecheck, lint) with zero skipped required cases; a missing required configuration fails the job, not skips it.

## Out of Scope

Vault/managed-identity signing, rotation and production key custody (P1); offline-root trust bundles, ceremonies and rollback protection (P7); chain/epoch/CoD codecs and schemas (P5/P11); public standalone verifier, second language implementation and publication (P8); API response redesign beyond the coordinator-allocated served adapter seam; any change to frozen gravity mathematics; any `status` flip or promotion.

## Reviewer Questions

1. Can any path still treat a pack-embedded key as trust and report success?
2. Does any output (CLI, library, served adapter) present integrity-only results as verified trust?
3. Are key-id derivations and purposes domain-separated so a shard-evidence key can never validate checkpoint or CoD material?
4. Does anything in this change reinterpret legacy `verified` as factual truth?

## Context & References

- Charter §5 P2 row, §4 hazards 5/8, §2.2 finding F1; S1 G1, G2(5); S3 P2 acceptance T2.1–T2.6
- S1 PoC scripts under `projects/keon/poc/cortex-evidence-integrity/` at `bb5bcdf76752373cf4fe669107f36a0a4c581f36`
- keon-cortex src/keon/cortex_governed/ (current verifier behavior), tests/governed/
- P0 contract-decision register (CD-5 codec bootstrap, CD-6 legacy `verified`) — must be settled before dispatch

## Verification Plan

Run the governed package tests plus targeted new regression tests against pre-change code first (they must fail), then on the candidate head (they must pass). Typecheck and lint clean. Review focus: is there any residual path where attacker-selected trust yields success? Does integrity-only ever leak into a trusted-looking verdict? Are wire fields exactly the agreed codec seam (no parallel envelope)? Record exact commands and outcomes per charter §8.3.
