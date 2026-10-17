---
ticket: HKR-P5
title: Independent synthetic reference review and honest metrics
status: draft
owner: pilot-owner
created: 2026-10-15
updated: 2026-10-15
risk: standard
surfaces: [docs/]
routing_class: implementation/standard
verification_class: judgment-required
expertise: data
inputs: [text]
data_classification: internal
---

# HKR-P5 — Reference, Review and Metrics

## Intent

Evaluate synthetic candidate usefulness against an independent reference set and preserve supported/rejected/held interpretations without confusing review with publication. Produce an honest measurement template for a later four-conversation decision, not results about histories never processed.

## Constraints

- Accepted P0–P4 contracts define source identity, scope, candidate admission and budget accounting. Reference annotator/reviewer must be distinct from the candidate-generating model and hold explicit scoped review authority.
- Synthetic references include useful items, no-candidate spans, uncertain/co-referent accounts and supported alternatives/reversals. Hold out one invented conversation per domain from tuning; do not send its reference answers or peer candidates to the extractor.
- Report source/evidence/candidate denominators, supported/unsupported/held records, missed references, source-resolution failures, as-of behavior and actual cost/time/counter limits. Unknown/incomplete is not zero or a success.
- An accepted supported interpretation is not current truth, a publication approval, a recalled Cortex memory or permission to execute historical instructions. Synthetic measures do not establish population-level precision/recall.

## Acceptance Criteria

1. Independent synthetic references and held-out questions are versioned separately from extractor prompts. Review records resolve permitted source spans and distinguish supported, unsupported, held and conflicting interpretations with minimal actor attribution and current review grants.
2. Deterministic scoring/report checks expose intentional misses, unsupported additions, duplicate origins, incomplete ranges and temporal leakage. No-candidate spans remain in the denominator; capped/excluded items and unavailable evidence cannot disappear from the report. No passing numerical quality threshold is invented without owner approval.
3. Reports exercise NP-12's reference/evaluation structure but explicitly leave its four-real-conversation requirement unsatisfied, alongside G1/S1 eligibility. Retained candidates remain private. Usage/limits reconcile to P4 rather than hidden model-review calls; no model reviewer is added without amendment.

## Out of Scope

- Preparing real-history reference labels or verifying the four nominated real sources.
- Model-as-judge replacing independent reference preparation, broad benchmarks or statistical population claims.
- Approving shared publication, modifying Cortex gravity or capturing personal preferences/dream offerings.

## Context & References

- [Shaping evaluation boundary and baseline](../../shaping/keon-agenttask-synthetic-readiness-2026-10-15.md)
- [P0 metric/review contract](HKR-P0-authority-and-contract-baseline.md)
- [P1 source/origin/time](HKR-P1-synthetic-reconstruction-and-evidence.md)
- [P3 candidate states](HKR-P3-candidate-ledger-and-race-safety.md)
- [P4 bounded extraction](HKR-P4-bounded-local-extraction-route.md)

## Dependencies And Promotion Blockers

P0–P4 must be accepted; independent reviewer/grants, reference handling, exact data/report paths, approved metric semantics and review-time allocation remain UNBOUND. Do not inherit another goal's reviewer or budget. Shaping-only surfaces and exact file authority require amendment before promotion.

## Allowed Files

No reference corpus, annotation, review-state, scoring or report-output path is authorized by this draft. P0 must propose exact files and read/write separations, ratified before activation. Reference answers may not be placed in extractor-readable locations simply for convenient testing.

## Verification Plan

An independent verifier uses planted misses, zero-candidate spans, duplicates and reversals to check denominator/counter correctness and held-out separation. Human quality judgments are recorded as judgments with evidence, not disguised as deterministic certainty.

Mandated reviewer questions: Did references leak into tuning/context? Are cap-hit and no-candidate spans counted honestly? Can replay inflate support? Does review accidentally grant publication? Does the report explicitly distinguish synthetic NP-12 structure from the unmet real-source case?
