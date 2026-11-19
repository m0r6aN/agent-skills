---
ticket: CTX-P0
title: Cortex evidence-integrity P0 — baseline, live-role report, claim wording, seam and contract register
status: draft
owner: clinton.morgan
created: 2026-10-30
updated: 2026-10-30
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - docs/reports/2026-10-30-cortex-p0-baseline-and-live-role-report.md
  - docs/specs/cortex-evidence-integrity/P0-contract-decision-register.md
  - docs/specs/cortex-evidence-integrity/P0-seam-ownership-and-conflict-matrix.md
  - docs/specs/cortex-evidence-integrity/P0-requirement-matrix-and-dag.md
  - docs/specs/cortex-evidence-integrity/P0-buyer-claims-evidence-map.md
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
expertise: architecture
thinking_level: high
---

## Intent

Produce the Cortex evidence-integrity program's P0 planning artifacts in `keon-cortex` (the primary implementation repository), per charter §5 P0, S3 phase 0 (acceptance A1–A3) and S1 G0: (a) a reconciled baseline of actual repository bases and concurrent ownership; (b) a read-only live-role/configuration report describing the **application principal** (not an observer role): effective privileges, DDL/schema-create/role-switch paths, key-configuration presence and identifiers (never secret values), `CORTEX_STORE_MODE`, gateway `IngressSpine:Mode`, Chronicle flag; (c) interim public wording for buyer claims C1–C7 that claims only what is enforced today, with a claim-to-evidence map; (d) seam ownership and the exact file-ownership/conflict matrix (charter §6.3); (e) a contract-decision register recording hazard dispositions 1–15 and codec/signing bootstrap decisions; (f) a requirement matrix mapping S1 G0–G12, S3 P0–P15/T1.1–T15.4, findings F1–F7 and M1–M7 to draft parcels and tests, plus the dependency DAG (charter §6.2 waves). This is a documentation/registry parcel; it changes no code.

## Constraints

Base: keon-cortex observed at `461c89db08d89b09ca41ecc3f76c145583fcb008` during planning; the builder must reconcile the actual `origin/main` base and concurrent ownership first and record the delta. Dependencies: none for the local-baseline half; the live-observation half requires **authorized read-only access** and may ship separately — an unknown live value holds live claims with a concrete reason and recovery owner, never a fabricated answer (hazard 1: a read-only observer's `current_user` does not establish app-role safety; inspect the named application principal).

Locked decisions D1–D6 and all inherited S3 phases/acceptance criteria are inputs, not redesign targets. Proposed dispositions recorded here (CD-1 hazard-2 migration privilege split: owner-run idempotent migrations, app startup validates schema/version and privileges without production DDL; CD-2 hazard-6 replay-on-current-path returns a typed conflict; CD-3 hazard-3 DN6 purge function ships only as an always-refusing stub until P11/P13; CD-4 shard-identity contract, including the non-v1 extractor-version support policy (Q2, M2); CD-5 hazard-8 one shared evidence codec authored in P5, no interim per-parcel envelopes; CD-6 hazard-5 legacy `verified` meaning preserved; CD-7 M5 threshold governance: thresholds proposed from the measured baseline, owner-approved, movable only by recorded amendment (Q4, M5); CD-8 review-frequency reconciliation) are **proposed defaults pending developer/coordinator disposition** — record approval where a disposition changes the accepted S3 contract before any dependent draft becomes dispatchable. Never silently weaken acceptance; a scoped amendment is recorded before changing accepted scope.

Resolve the canonical agent-instruction location (AGENTS.md currently references a Windows path that is unavailable locally) as a P0 open item with owner and release gate; do not silently treat the available `biostack-wt/keon-systems-web` copy as permanently authoritative. No secrets in any output; record configuration presence and key identifiers only. Per charter §8.3 the parcel receipt must map every acceptance ID to its evidence.

## Allowed Files

- docs/reports/2026-10-30-cortex-p0-baseline-and-live-role-report.md
- docs/specs/cortex-evidence-integrity/P0-contract-decision-register.md
- docs/specs/cortex-evidence-integrity/P0-seam-ownership-and-conflict-matrix.md
- docs/specs/cortex-evidence-integrity/P0-requirement-matrix-and-dag.md
- docs/specs/cortex-evidence-integrity/P0-buyer-claims-evidence-map.md

## Acceptance Criteria

AC-1 (S3 A1): a written record exists answering every live probe (app role, `rolsuper`, inherited membership, ownership, DDL/schema-create/role-switch paths, `CORTEX_STORE_MODE`, signing/trusted-key configuration presence, gateway `IngressSpine:Mode`, Chronicle flag, Runtime spine store and anchor service status) with each value labelled known/unknown and any exception stated.
AC-2 (S3 A2): each of C1–C7 has approved interim wording claiming only what is enforced today, linked to concrete evidence in the claims map (pattern retained from S3: C2 "decision records are signed; independent verification with pinned keys is available from P2 and offline-root trust from P8"; C5 "tamper evidence at single-record level today; chained, anchored review packets by P10"; C6 "portable bundles by P13"). The S3 wording is retained verbatim; the proposed C6 amendment "portable bundles by P14" (reason: S3's own P14 is the review-packet/portable-bundle producer while P13 covers decision receipts) is recorded in the register as a scoped-amendment proposal pending owner disposition (Q7) and does not supersede the accepted wording until then.
AC-3 (S3 A3): the public sentence about verifier details is replaced per D4 (verifier and format spec published; Cortex repo/internals private).
AC-4 (G0): the live-state record covers every G0 field with explicit known/unknown values.
AC-5: the requirement matrix maps every ID in G0–G12, P0–P15, T1.1–T15.4, F1–F7, M1–M7 to at least one draft parcel and test/verification command, or to a named external owner plus evidence requirement and release gate; no orphan IDs and no fabricated mappings.
AC-6: the dependency DAG is acyclic and reproduces charter §6.2 waves (including the recorded cycle-breaks: P5 staging, P8 extending for P11, P13 preceding activated P11 deletion, P14 requiring real P9/P10 receipts).
AC-7: the conflict matrix covers every charter §6.3 collision surface with a named single-writer rule and integration owner.
AC-8: the contract-decision register records hazards 1–15 each with disposition, source (charter default or new proposal), approval state, and the parcel that must resolve it before dependents dispatch.
AC-9: no code, schema, CI, or dependency files are changed by this parcel.

## Out of Scope

Code or schema changes of any kind; live mutation probes (raw SQL tamper/purge PoCs are never run against live or demo infrastructure); key ceremonies or vault provisioning; status flips, promotion, Jira registration, receipt minting; worker dispatch or model spend; rewording that weakens inherited acceptance; Runtime/Gateway/infra implementation; secret values of any kind.

## Reviewer Questions

1. Does every interim claim sentence stay within what is enforced today, with no implied independent verification or deletion guarantee?
2. Is any hazard disposition silently weakening S3 acceptance instead of recording a scoped amendment?
3. Does the requirement matrix hide any G*/T*/F*/M* ID behind a vague mapping?

## Context & References

- ~/Repos/keon-cortex charter.md (the Cortex charter; §4 hazards, §5 packages, §6 waves, §8 evidence gates) — authorized planning input
- S1 `bb5bcdf76752373cf4fe669107f36a0a4c581f36` — gap analysis and handoff (G0–G12, PoCs)
- S2 `8bf9a984bd0850830467627bf0e237b4fedfb9d2` — accepted owner ruling (controls over S3)
- S3 (same commit) — `projects/keon/cortex-evidence-integrity-charter.md` (P0–P15, T*, DN1–DN9)
- keon-cortex docs/CORTEX_INVARIANTS.md; docs/plans/2026-10-28-earn-the-claims.md
- OM-PAN-001 standing mandate (session authority discipline); SPEC-CONVENTION §4

## Verification Plan

Advisory self-check (frontmatter + §4 sections) before handoff; coordinator lint remains the promotion authority. Claim wording receives an independent read (fresh reviewer, read-only). The requirement matrix is checked by script or hand audit against the G*/T*/F*/M* ID sets (AC-5). Live-observation evidence is read-only and records no secrets. No repository test suite is affected (documentation-only parcel); the receipt lists exact file paths and the disposition state of CD-1..CD-8.
