---
ticket: HKR-P1
title: Synthetic OMP reconstruction and exact evidence
status: draft
owner: pilot-owner
created: 2026-10-15
updated: 2026-10-15
risk: elevated
surfaces: [docs/]
routing_class: architecture/risk
verification_class: judgment-required
expertise: data
inputs: [text]
data_classification: internal
---

# HKR-P1 — Synthetic Reconstruction and Evidence

## Intent

Demonstrate one synthetic OMP-v3-shaped conversation can be reconstructed into attributable, exact evidence without flattening branches or fabricating time/origins. Build a small entirely invented two-domain fixture corpus that exercises both successful reconstruction and explicit holds. This is future implementation work only after the draft's blockers are resolved.

## Constraints

- Use accepted P0 contracts and exact file authority. No real session file, metadata ID, title, copied snippet, attachment or customer/personal record may seed fixtures.
- A title prelude/session-header version does not prove message compatibility or complete conversation boundaries. Unsupported framing, missing ranges, changing versions and unknown required fields hold; no concatenate-and-pretend-complete fallback.
- Preserve native fixture conversation/branch/message/span identity and exact permitted bytes, source version and lineage. Artifact digest integrity is not semantic event identity; distinct accounts are not automatically merged.
- Keep original occurrence, effective validity, evidence-available and processing/recording times separate, including unknowns. Replays/overlap/paraphrases never manufacture independent corroboration or past recalls.

## Acceptance Criteria

1. Accepted invented fixtures reconstruct each permitted branch and exact span with source-version references; deterministic round trips resolve byte-identical evidence. Truncation, missing artifacts, unsupported frame types, source changes and worker-report-as-root cases produce explicit scoped holds with uncovered ranges.
2. Native copy/branch lineage and chunk overlap/retries have conservative origin grouping. New interpretations retain original evidence identity; ambiguous same-event similarity remains a proposed relation. Separate fake events with identical text do not collapse merely by wording.
3. Tests and versioned fixture expectations cover NP-01, NP-10 and NP-11, including out-of-order imports, unknown clocks and later reversals that cannot leak into earlier as-of answers. Results make no real OMP compatibility or account-wide coverage claim beyond the exact framing actually verified.

## Out of Scope

- Reading or acquiring the four nominated real histories, recursive session discovery, hidden/encrypted reasoning or credential access.
- Classification authorization, production source grants, actual profile enrollment or canonical memory writes.
- New semantic retrieval/scoring, automatic real-world event merging, lossless-archive claims for excluded fields.

## Context & References

- [Shaping constraints and source baseline](../../shaping/keon-agenttask-synthetic-readiness-2026-10-15.md)
- [P0 contract prerequisite](HKR-P0-authority-and-contract-baseline.md)
- [P2 disclosure consumer](HKR-P2-custody-classification-and-isolation.md)
- [P5 reference consumer](HKR-P5-reference-review-and-metrics.md)

## Dependencies And Promotion Blockers

P0 must be independently accepted and its source/evidence schema and case expectations ratified. Implementation home, actual parser/caller interfaces, toolchain, exact mutations and output/evidence paths remain UNBOUND. `surfaces: [docs/]` describes this shaping-stage artifact only; it does not authorize a later implementation tree. Amend routing surfaces and exact file authority before promotion.

## Allowed Files

No implementation or test/evidence-output path is authorized in this draft. P0 must propose exact repo-relative files, ownership and required fixture/test outputs; the owner/coordinator must ratify and apply that amendment before this spec can become active. No globs, placeholder roots or inferred adjacent files grant mutation authority.

## Verification Plan

Independent deterministic verification resolves fixture spans and checks expected branches, origins and temporal answers, including all negative cases. The author does not independently accept its own implementation.

Mandated reviewer questions: Can branch loss be mistaken for a complete conversation? Do byte offsets survive encoding/newlines? Can a retry or paraphrase create another witness? Does a later correction contaminate an earlier answer? Are unsupported frames held instead of silently dropped?
