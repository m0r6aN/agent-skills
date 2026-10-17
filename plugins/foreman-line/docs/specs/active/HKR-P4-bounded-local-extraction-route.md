---
ticket: HKR-P4
title: Bounded local synthetic extraction route
status: draft
owner: pilot-owner
created: 2026-10-15
updated: 2026-10-15
risk: elevated
surfaces: [docs/]
routing_class: architecture/risk
verification_class: judgment-required
expertise: security
inputs: [text]
data_classification: internal
---

# HKR-P4 — Bounded Local Extraction Route

## Intent

Connect the accepted synthetic evidence/custody/control path to one separately approved bounded local extractor and validate its output as untrusted candidates. Demonstrate enforceable accounting and stop behavior without granting tools, archive browsing, shared memory access or provider fallback.

## Constraints

- No model is selected by this spec. P0 must bind an existing eligible local adapter/model/version/tokenizer and destination under a separately approved S0 envelope. Missing or unavailable capability causes hold; no service starts, pulls, downloads, cloud/proxy/scanner fallback or credential reuse is presumed.
- Each request gets one fresh assignment/domain context and approved exact evidence spans only. Source instructions remain data; no tools, direct filesystem/archive browsing, Cortex writes or ambient cross-project context.
- Apply selected per-request/run-wide input/output/retry/time/concurrency ceilings with durable worst-case reservation before dispatch. Include all prompts, cached input, overlap, retries and reported reasoning usage; incomplete/unknown usage retains reservation. Resume never resets cumulative counters.
- The real-source manifest's proposed USD 0 external spend and numeric ceilings are not a new S0 authorization. P0 must propose an exact synthetic envelope for approval; it cannot silently multiply S1 allocations. Exhausted or unmeasurable hard limits stop dependent work.

## Acceptance Criteria

1. Only the exact approved local destination/context can receive fake fixture spans; tools, filesystem browsing and remote fallback remain unavailable under tested controls. Positive actual-local-route evidence is separate from deterministic adapter stand-in tests. No eligible route means blocked, not route substitution.
2. Tests exercise malformed/unsupported output, unresolvable spans, imported instructions, duplicate/retry results and held classification/dependency states. Schema/semantic validation cannot turn model confidence or reported historical completion into authoritative truth. Admitted proposals remain private candidates under P3's current-generation protocol.
3. Boundary tests hit each approved S0 token/output/request/retry/time/concurrency/candidate ceiling and unknown/cancel/lost-ack/restart state. No dispatch occurs without sufficient reservation; caps report incomplete ranges rather than truncating/claiming coverage. Usage accounting and data-flow evidence support the claimed bound without leaking fixture payloads into unapproved logs.

## Out of Scope

- Real conversations, paid/cloud inference, model training, model acquisition or harness migration.
- Autonomous reviewer/approver, external safety scanner, publication or real Cortex/Runtime/Gateway service calls.
- Provider-cost estimates presented as hard monetary enforcement, prompt-only isolation or completing agent-model-router as a prerequisite.

## Context & References

- [Shaping route/budget baseline and pending S0 envelope](../../shaping/keon-agenttask-synthetic-readiness-2026-10-15.md)
- [P0 binding prerequisite](HKR-P0-authority-and-contract-baseline.md)
- [P1 spans](HKR-P1-synthetic-reconstruction-and-evidence.md)
- [P2 safe context](HKR-P2-custody-classification-and-isolation.md)
- [P3 admission/accounting controls](HKR-P3-candidate-ledger-and-race-safety.md)

## Dependencies And Promotion Blockers

P0–P3 must be accepted. Actual route/version/tool isolation, S0 numeric limits, measurable usage/cancellation contracts, exact mutations and evidence paths remain UNBOUND. Future execution additionally needs specific approval. Shaping-only surfaces must be amended; an authenticated CLI or earlier council call grants nothing here.

## Allowed Files

No adapter, model configuration, prompt, fixture or usage/evidence-output file is authorized by this draft. P0 must propose and the owner/coordinator ratify exact mutation and verification paths before activation. Provider credentials, global harness configuration and unrelated routing-policy files are not implicitly included.

## Verification Plan

Independent verification checks actual selected local-route isolation and accounting in addition to deterministic failure fixtures. Security/model-route review is required under future approved Foreman policy; no reviewer is dispatched by this draft.

Mandated reviewer questions: Can local inference forward to a remote provider? Are output/reasoning tokens and retries fully reserved? Can a hung request continue while a replacement consumes the same budget? Can a candidate bypass current-generation admission? Is stand-in success falsely described as actual inference readiness?
