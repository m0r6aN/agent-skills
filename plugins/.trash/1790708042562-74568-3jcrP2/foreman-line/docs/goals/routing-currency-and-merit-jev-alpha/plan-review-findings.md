# Jev Alpha Decisions — Plan Review Findings

**Review date:** 2026-09-21
**Reviewer:** fresh frontier adversarial session `Fermat`
**Disposition:** REQUEST CHANGES; affected Gate 1 decisions reopened

## Triage

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| PR-01 | Critical | J8 requires a named consumer, but P3 only promises to create one later. | Fix: propose `support-triage-advisory-v1` as the explicitly named, recommend-only workflow. |
| PR-02 | Critical | The alpha endpoint must be an explicit capability surface with an owner and a non-collision relationship to RCM D13 and boundary-routing D10. | Fix: define `openrouter-alpha-decisions` as a separate capability owner; preserve D13 and forbid shared-surface mutation. |
| PR-03 | High | Existing Jev registry/template material still presents the standard `/api/v1` configuration. | Fix: classify existing material as unchanged/legacy evidence and forbid edits from this goal unless a separately serialized integration parcel is ratified. |
| PR-04 | High | The charter pins `typesafe/jev-1.13`, while the smoke test sends `~typesafe/jev-latest`. | Fix: canonicalize the request to exact `typesafe/jev-1.13`; record served-model metadata separately; no aliasing. |
| PR-05 | High | “Credential-free adapter” conflicts with runtime use of `OPENROUTER_API_KEY`. | Fix: define secret-free receipts/evidence, process-local environment injection, no credential discovery, no key/header logging. |
| PR-06 | High | Live-call bounds lack maximum calls, retries, concurrency, timeout, payload, and aggregate spend. | Fix: propose one call, zero retries, concurrency one, 30-second timeout, 64-KiB request limit, and $0.01 USD per authorized validation run. |
| PR-07 | High | Replay lacks canonical request/response digests, fixture provenance, redaction, and binding rules. | Fix: assign canonical JSON SHA-256 digests, sanitized fixtures, provenance, and requested/served identity binding to JEV-P1. |
| PR-08 | High | P4 combines too many responsibilities and lacks environment-specific scenarios and an explicit security gate. | Fix: split security/boundary scenarios from release closure; add security review before live adapter release. |
| PR-09 | Medium | Typed answers are not explicitly advisory-only and non-authoritative. | Fix: lock the named workflow to recommendation data; application code owns all effects and authorization. |
| PR-10 | High | Parent-goal collision and shared-file serialization are not operationally resolved. | Fix: prohibit edits to parent RCM routing files/docs in this goal; require a separately ratified integration parcel for any shared surface. |

## Gate 1 impact

The reviewer required reopening J1–J3, J3–J4, J5/J9, J6/J7/J10, and J8. The
proposed replacement text is recorded in the charter. No parcel dispatch, live
call, or spend is authorized until the replacement text is ratified.

## Evidence checked

- New Jev charter and parcel queue.
- Existing RCM charter D13 and P0 triage.
- `plugins/foreman-line/tests/jev-smoke-test.mjs`, which currently sends
  `~typesafe/jev-latest`.
- Existing OpenRouter registry/template references identified by the reviewer.
