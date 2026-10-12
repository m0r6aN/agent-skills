# OPMEM-P0 — Pilot and validation contract (AC8)

**Parcel:** OPMEM-P0 · **Evidence base:** `source-baseline.md`, `memory-boundary-contract.md`, `event-and-fixture-contract.md`
**Rule:** controlled scenarios are **all applicable scenarios mandatory, no skips** (D18). A skipped scenario is a failed gate. Practical pilot evidence supplements deterministic tests; it never replaces them.

## 1. Controlled scenario gates (execution: P9 against the real deployment)

Each gate names: scenario, evidence required, and the fixture/contract source. "Applicable" is determined by shipped scope at P9; anything in scope that is skipped fails the gate. All write-path gates run against a **real Runtime** (OD-21): a stub or test double at S-gates/P9/P10 is a **failed gate** (the deterministic Runtime test double is P5a unit-test evidence only, never deployment evidence).

| Gate | Scenario (from plan §8, renumbered) | Evidence required | Source |
|---|---|---|---|
| S-1 | Same tenant + stable repository identity across all three machines and supported path/worktree/WSL forms | Cross-machine capture+recall transcript with identical `tenant_id`/repository identity; path-variant table | boundary §4.2, N-3 |
| S-2 | Trusted role enforcement before query/ranking and for exact-ID, lineage, shared artifacts, feedback, curation; forged/missing roles and foreign tenant/profile requests fail closed | N-1…N-8, N-10, N-14…N-16, N-19…N-22 executed (full identity/scope inventory); server-side enforcement order proof (scope applied before candidate generation) | boundary §4.1/§4.3 |
| S-3 | Operator-wide authorized relevance vs isolated live application and explicit family sharing; no automatic operator→live import | N-5 + profile matrix (operator / live app / family) with default-deny evidence | boundary §5 |
| S-4 | Temporary agent replacement keeps selective role continuity without loading all ancestry; curated knowledge preserves evidence, generation identity, approval requirements | restart fixture: same role, new generation ⇒ curated briefing only; F-12 executed | event §5, boundary §4.3 |
| S-5 | Original content verification, scope echo, durable recall-event behavior, evidence signing-key verification (T-3), deterministic historical replay against the real exposed contract | content-hash fail-closed proof (INV-1/2), recall event per delivery identity (event §3), G-8/G-9 replay, N-11, N-13 (signing-key) | event §3/§7 |
| S-6 | Feedback matrix: access-without-use, considered-irrelevant, applied-without-outcome, supported utility, incorrect/superseded, governance/branch cases | F-1…F-14 executed | event §5 |
| S-7 | Explicit time + pinned scoring; decay and association fixtures; feedback ≠ occurrence; duplicates/self-feedback cannot dominate | G-1…G-14, F-8…F-10, N-12 | event §7/§2 |
| S-8 | Outage/lost-ack/crash matrix: Azure/Cortex/Neon outage, credential expiry/revocation, reconnect, crash at each outbox boundary, retry concurrency, role/profile switch with pending work, capacity/backpressure, indeterminate writes/recalls | O-1…O-9 executed + induced outage run | event §8, boundary §6 |
| S-9 | Pi lifecycle: startup/task transition/compaction/resume/fork/reload/shutdown/cancellation; interactive + supported headless; no repeated capture of abandoned branches; recalled instructions cannot widen tool authority | harness event log vs delivery-identity rules; N-9 | event §3/§9 |
| S-10 | Container/runtime: non-root read-only, loopback publication, persisted outbox volume, pinned images, SBOM/scan, secret exclusion, signed-key persistence, protocol/schema handshake + rollback | image digest pin, SBOM artifact, scan report, downgrade-refusal test — executed against the P2-owned `/health` `schema_version` signal (boundary §2.3 Readiness/Version, OD-17) | boundary §6 |

## 2. Fourteen-day real-work pilot (P10)

- **Duration/coverage:** 14 consecutive days using all three machines (Windows workstation + two Omarchy machines, including WSL/container sessions) on real primary projects (AgentTask and other live work). No artificial mistake regeneration; no synthetic workload may be counted as pilot evidence.
- **What is recorded (per delivery/capture/recall):** delivery + recall IDs, scoped task/session/role attribution, surfaced proposals and owner approvals/rejections, concrete memory-application examples with attribution class, non-applicability examples, unresolved conflicts surfaced, outages/recoveries, duplicate or mis-scoped records observed and their disposition.
- **Required demonstrations (at least one each):** cross-machine handoff where investigation or a lesson was reused; one evidence-backed lesson applied; one developer decision reused with provenance; one memory correctly refused/surfaced as conflicting with current instructions (D8).
- **Honesty rules:** an unobserved prevented mistake is never claimed; causal cost-saving claims are forbidden without a controlled comparison; workload differences must be labeled.

## 3. Measurement rubric (frozen here; numeric thresholds approved at P0 gate, OD-11)

Measured and reported for the pilot, per machine and aggregate:

| Metric | Definition | Threshold status |
|---|---|---|
| Briefing tokens | added context tokens per delivery (tokenizer per event §6) | target ≈1,000; ≥95% within budget (proposed) → OD-8/OD-11 |
| Total added inference | all OPMEM-induced tokens/latency on the primary work path | report-only in pilot; budget ceiling → OD-11 |
| Context-cache disruption | cache invalidations attributable to memory injection per session | report-only first 7 days; ceiling → OD-11 |
| Retrieval rate | deliveries containing ≥1 recalled record | report |
| Application rate | `application` events / `access` events (**delivered subset** — T-33; trimmed records are `access_omitted`, never counted) (attribution-split) | report |
| Non-applicability rate | `consideration` events / `access` events (**delivered subset** — T-33) | report |
| Unsupported useful-memory claims | self-reported usefulness without evidence_ref surfaced to owner | must be 0 accepted claims; report count |
| Recall latency | p50/p95 recall round-trip (adapter→Gateway→Cortex) | ceilings → OD-11 |
| Outbox health | pending depth, quarantine count, indeterminate resolutions, max age | ceilings → OD-11 |
| Operational interruptions | memory-caused interruptions of primary work | must be 0 unbounded; report |

- **Baseline comparison:** any no-memory or controlled-retrieval baseline must be labeled honestly; the pilot is not a randomized experiment, so comparative numbers are descriptive only.
- **Primary-work protection (G12):** OPMEM work must not expand into open-ended Cortex/routing research or delay primary delivery; if it does, stop condition fires (charter §stop).

## 4. Deterministic verification (supplements pilot; P2/P3/P5/P6/P7 evidence)

- Fixture suites G-1…G-14, F-1…F-14, O-1…O-9, N-1…N-22 green with zero skips (full inventory). O-9's future cache layer may run against a deterministic test double; no fixture may disappear through an undocumented applicability exemption.
- Proof invariants I1–I7 regenerated at the pinned revisions (`cortex proof` family) — required because P0 found them unverified at pin (canon-authority-map §4.3).
- Bridge shell gates (`docs/ADVERSARIAL_GATE.md` P0 bridge-shell set) re-run against the real backend; the Cortex integration gates (deterministic shard identity, outbox crash recovery, index-derivative behaviour, replay with pinned parameters, contradiction preservation, epoch proofs — **deferred, OD-19: out of the initial release, not silently waived** — governed signing, byte-identical proof artifacts) run with the real Cortex repository/API.
- Container gates from S-10.

## 5. Owner acceptance conditions (exit path)

1. All applicable controlled gates green with **no skips** and no unresolved critical correctness/security failure.
2. 14 days of attributable practical evidence per §2 on all three machines, with the required demonstrations.
3. Measurement report per §3 delivered, with honest limitations and no causal overclaims.
4. Explicit limitations list (what was not tested/certified), including: the pilot does not certify Cortex capabilities beyond those independently tested.
5. Documented installation + tenant/profile operations runbook (P8 deliverable) validated by the operator.
6. Owner acceptance recorded explicitly in this goal's records.

## 6. Boundaries

- Cloud/deployment facts (Azure/Neon) belong to P8 and require their own operational authority; nothing here authorizes them.
- Numeric thresholds marked → OD-11 are approval items before P3/P10 promotion; this contract freezes the **rubric**, not the numbers.
- This document is not itself a validation result.
