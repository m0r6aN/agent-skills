# Plan-Level Adversarial Review — Pi Model Configuration

**Review type:** fresh, adversarial, charter + minimal routing-policy canon only  
**Date:** 2026-09-23  
**Outcome:** REQUEST CHANGES — scoped Gate 1 re-open required

## Triage

| ID | Finding | Disposition | Charter impact |
|---|---|---|---|
| F1 | The matrix supplies valid OpenCode and OpenRouter pairs per lane but has no deterministic rule for selecting a provider-local pair. | Fix | Amend D1/D4: a resolver ranking must consider data eligibility, required capability, independence, available context, remaining budget, verified availability, and a recorded quality score; ties must resolve by a documented stable order. The route receipt records every input and the chosen binding. |
| F2 | Provider-neutral task/result envelopes and provider-prefixed Pi model IDs lack a canonical logical-candidate/binding representation and migration rule. | Fix | Amend D7: define a provider-neutral logical lane/candidate, provider-specific bindings, explicit fallback references, eligibility at the binding level, versioned consumer migration, and referential-integrity tests. |
| F3 | A reviewer fallback may violate independent-family requirements without an explicit denial rule. | Fix | Amend D3/D5: independence applies to primary and fallback. If no independent eligible fallback remains, emit a failed/stop receipt; never downgrade the review. |
| F4 | P2 emits a route but does not own a verified Pi launch boundary or deny unapproved direct/default invocation. | Fix | Amend D1 and PMC-P2: P2 owns a launch boundary that verifies an approved route receipt before inference and fails closed when it is missing, stale, or mismatched. Interactive Pi defaults stay outside the Foreman execution boundary. |
| F5 | Roles/lanes in the matrix exceed the routing policy's current role vocabulary. | Fix | Amend D7 and PMC-P1: freeze a canonical role/lane/routing-class/authority-cap mapping before P2 starts. |
| F6 | Static conformance, live availability, and model-quality evidence are not distinguished, despite provider calls being unapproved. | Fix | Amend D8 and exit criteria: static conformance is required for code completion; owner-authorized public live validation is separately required for activation and any "current-best" claim. Receipts must identify which state they attest. |
| F7 | Consumer inventory, compatibility boundary, and cutover/removal condition are not owned. | Fix | Amend D7/PMC-P1: inventory all policy/evaluator/template/session consumers, define compatibility versioning and cutover, and serialize removal of the legacy OpenRouter-slug-only representation. |
| F8 | PMC-P1–P3 overlap on templates/routing artifacts. | Fix | Amend parcel ownership: PMC-P1 owns schemas, policy contract, migration inventory, and fixtures; PMC-P2 owns resolver, Pi configuration, launcher, and generated route artifacts; PMC-P3 owns canon and human-facing templates only and consumes the P2 interface without changing it. |
| F9 | "Comparable or higher suitability" is undefined. | Fix | Fold into F1/F6: P0 produces a reviewed rubric and P1 encodes its required eligibility/ranking fields and evidence threshold. |
| F10 | The overall sequence P0 → P1 → P2 → P3 → P4 is coherent. | Informational | Preserve it; P2 remains blocked on the ratified P1 contract and migration rules. |

## Required scoped Gate 1 amendment

The owner must ratify the amendments described by F1–F9, affecting D1, D3–D5,
D7, D8, the implementation-parcel ownership table, and the exit criterion.
The initial Claude Opus 5.5 selection remains ratified and is not re-opened.

No implementation, provider call, credential inspection, or Gate 2 dispatch is
authorized while this scoped Gate 1 re-open remains open.
