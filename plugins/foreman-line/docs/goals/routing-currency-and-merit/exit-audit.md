# Routing Currency and Merit — exit audit

**Audit date:** 2026-09-20  
**Coordinator task:** `01a0bf3f-559b-7291-a20e-8d8a4bbb16b3`  
**Operational charter:** repo-local ratified copy at `charter.md`  
**State:** not complete; RCM-P0 bounded handoff merged, with host-owner sanitized
export selected as the next evidence path; downstream live-evidence boundary and
RCM-P1 re-gate remain open

This is a requirement audit against the current repo-local ratified charter and
loop directive. It is not a substitute for parcel verification or human gates.

## Goal exit criteria

| # | Requirement | Current evidence | Status |
|---:|---|---|---|
| 1 | RCM-P0 drift report landed; F4/Jev disposition recorded; HAWF/INDEX ownership reconciled or escalated | RCM-P0 evidence and spec are merged; F4/Jev disposition and `escalated-unresolved` HAWF hold are recorded. No INDEX write or ownership reconciliation occurred. | **Partial / held** |
| 2 | Policy schema v0.4 validates and capability claims are machine-checked against the live cache | No RCM-P3 parcel dispatched; no v0.4 schema or live-cache validation evidence exists. | **Missing** |
| 3 | F1/F2 closed through actual dispatch integration negative controls | No RCM-P4/P4A parcel dispatched; P0 explicitly leaves live execution blocked. | **Missing** |
| 4 | Image-bearing boilerplate resolves to a vision-capable eligible model or refuses with a typed unsatisfiable-predicate error | No resolver or dispatch implementation exists; P0 records only static repository evidence and refusal boundaries. | **Missing** |
| 5 | Classification gating precedes capability/tier selection with a negative control | No resolver/integration parcel or negative-control evidence exists. | **Missing** |
| 6 | Scheduled proposer emits digest-bound proposal/evidence and cannot auto-promote or write host settings | No RCM-P6 parcel dispatched. | **Missing** |
| 7 | Settings projection artifact is idempotent and never writes/read-backs the shared host file | No RCM-P7 parcel dispatched. | **Missing** |
| 8 | Receipt/replay binds requirements, policy, snapshot, vocabulary, predicates, identity, and mismatch refusal | No RCM-P8A parcel dispatched. | **Missing** |
| 9 | Dispatch performs no network/MCP call or price sort | No new RCM dispatch integration exists to verify this goal's added behavior. | **Missing** |
| 10 | Gate 3/default-route promotion remains human-owned and separate | Bounded RCM-P0 Gate 3 merge was explicitly granted; general Gate 3 authority and default-route promotion remain human-owned. | **Constraint preserved; goal not complete** |

## Parcel state

| Parcel | State | Evidence |
|---|---|---|
| RCM-P0 | Reviewed as incomplete evidence handoff; bounded merge complete | `rcm-p0-review-triage.md`; merge `794514a`; spec in `docs/specs/done/` |
| RCM-P1 | Not dispatched | P0 evidence/dependency hold in `loop-directive.md` |
| RCM-P2–P10 | Not dispatched | Strict queue and new Gate 2 requirement |

## Active blockers

1. The host-owner sanitized-export route is selected, but no export or exact source
   binding has yet been supplied. Therefore F1–F6 live evidence,
   identity/endpoint joins, installed parity, accepted freshness, and source times
   remain unavailable.
2. HAWF remains `escalated-unresolved` with downstream hold; Jev remains an
   evidence-only refused/disabled lane.

The current directive therefore correctly forbids P1 dispatch, host
correction, live policy mutation, Pi writes, credential discovery, network calls,
provider spend, and downstream consumption. The goal remains active and is not
eligible for `complete` status.

## Source note

`C:\Users\clint\Downloads\charter.md` is still present, but its hash differs from
the repo-local ratified charter and it does not contain the recorded Gate 1/Gate 2
ratifications. The repo-local charter and loop directive are the current operational
control records for this resumed goal; the source file remains the original intake
artifact.
