# Foreman Kernel — Plan-Level Adversarial Review Findings

**Charter reviewed:** `c4bf00f6fde9058e1350898914e06f261ae38c93`
**Review date:** 2026-08-31
**Reviewer:** fresh zero-context frontier agent session `foreman_kernel_plan_review`
**Reviewer verdict:** `REQUEST CHANGES`
**Coordinator triage:** six BLOCKERs fixed in the charter amendment; seven SHOULD-FIX
findings fixed or made binding on parcel specs; three findings accepted/informational
**Gate effect:** scoped Gate 1 re-open re-cleared 2026-08-31; developer explicitly
re-ratified R1–R13 and resumed the standing Gate 2 authorization

The reviewer was dispatched after the original Gate 1 ratification with no coordinator
context beyond the committed charter and repo canon. It made no file or Git changes.

## Blocker triage

| ID | Finding | Verdict | Coordinator ruling and charter disposition | Gate effect |
|---|---|---|---|---|
| B1 | No parcel owns the `authorizeAction` policy engine required by D12. | **FIX** | Added D18 and FK-P12, a provider-neutral authorization-engine parcel combining authenticated principal, repo/worktree identity, compiled scope, role, lease/revision, gates, outage posture, and obligations. Control and hook parcels depend on it. | Re-open D3/D12/D17 and graph. |
| B2 | A separately registered control catalog has no authenticated caller or admission boundary. | **FIX** | Amended D3/D9/D15/D17; FK-P1 now owns the admission contract; FK-P13 owns a distinct host-local capability and mechanically distinct principal. Human-gate state is evidence-derived, never an ordinary transition. Anonymous verifier clients must not list or call control tools. | Re-open D3/D9/D15/D17; add D18. |
| B3 | The final stateful container has no owning parcel. | **FIX** | FK-P7/FK-P8 are explicitly stateless. Added FK-P14 for final stateful image composition/operator lifecycle and FK-P15 for process-boundary restart/admission proof. | Re-open D3/D4/D14/D15 and graph/exits. |
| B4 | `BYPASS_MODE_FORBIDDEN` overclaims refusal when bypass prevents the hook from running. | **FIX** | Amended D7/D8/D13. Enforcement claims only `MEDIATED_BYPASS_MODE_FORBIDDEN` when the adapter runs. Missing/disabled/non-loaded enrollment is detected through heartbeat and CI and classified detected-only. | Re-open D7/D8/D13 and exit criteria 5–6/8. |
| B5 | CI backstops were sequenced after enforcement promotion. | **FIX** | Split CI into FK-P18 before FK-P19 enforcement. FK-P19 cannot promote until the hook-bypass negative control fails in CI. Second-host work moved to FK-P20. | Re-open D11/D13 and graph/exits. |
| B6 | Read-only MCP path inputs lacked a confidentiality boundary. | **FIX** | Added D19. FK-P1/FK-P4 require content-only public APIs or admission-bound `repoId + relative path` within one read-only root, canonical containment, symlink/reparse refusal, regular-file checks, and byte limits. Read-only server cannot mount/read the state volume. | Re-open D3/D10/D15/D17; add D19; amend exits. |

## Should-fix triage

| ID | Finding | Verdict | Coordinator ruling and binding disposition |
|---|---|---|---|
| S1 | FK-P9/P10/P11 overlapped projections and FK-P9 was oversized. | **FIX** | Wave 3 is redrawn: FK-P9 storage/migration ABI; FK-P10 lease/transition engine; FK-P11 legacy import/projection; FK-P12 authorization engine; FK-P13 control registration. Migration and barrel ownership is serialized. |
| S2 | “Git evidence wins reconciliation” conflicts with D2 and lacks field-level semantics. | **FIX** | D14 now defines field authority. Git wins ratification/human-gate facts; SQLite wins leases/revisions/idempotency/wakeups/cursor after one-time digest-bound cutover. Divergence stops. FK-P11 owns the cutover. |
| S3 | Lease/crash/migration/recovery evidence was not falsifiable enough. | **FIX** | D14 and FK-P9/P10/P15 now require trusted lease time, same-key/different-payload conflict, transactional updates, crash injection, interrupted/newer-schema migration behavior, backup/checkpoint recovery, corruption refusal, and real process-boundary concurrency. |
| S4 | “Portable” was tested across harness shapes, not host/filesystem semantics. | **FIX** | Added D20. First-release enforcement claim is Windows 11 + Docker Desktop + Claude Code. Cross-platform path vectors remain contract fixtures. Codex/native-Linux enforcement requires separate real evidence. |
| S5 | Exit evidence lacked pinned identities and mutation controls. | **FIX** | Added FK-P21 and exit criterion 8. Evidence manifest binds source/image/tool/schema/policy digests, host/harness versions, corpus inventory/count, reviewer-session distinction, commands/results, and named mutation controls. |
| S6 | FK-P3 did not enumerate all mixed evaluators it must split. | **FIX IN PARCEL CONTRACT** | FK-P3 shaping must enumerate routing, skill resolution, shadow routing, and every other read-surface-reachable mixed entry point. It requires write-sentinel and deterministic-clock tests; no `docs/receipts/**` writer may be reachable from the read facade. No locked decision changed beyond D16 clarification already present. |
| S7 | Shared manifest ownership was acknowledged but unassigned. | **FIX** | Repo constraints now assign server manifest to FK-P6, stateless Docker to FK-P7, state ABI to FK-P9, stateful Docker to FK-P14, Claude registration to FK-P16, CI to FK-P18, and Codex manifest to FK-P20. |

## Accepted and informational findings

| ID | Finding | Ruling |
|---|---|---|
| A1 | Structural receipt validation is honestly bounded. | **ACCEPT AS DOCUMENTED.** D5/D6 and the structural-honesty scenario remain unchanged. |
| A2 | Human Gate 3 is preserved. | **ACCEPT AS DOCUMENTED.** Gate 3 remains nondelegated; control admission cannot create merge authority. |
| A3 | Shell containment is candidly layered. | **INFORMATIONAL.** D13 remains, with B4’s narrower mediated-bypass and enrollment-detection classification. |

## Amendment register

| Amendment | Source | Charter change |
|---|---|---|
| R1 | B1 | Added D18 and FK-P12 authorization engine. |
| R2 | B2 | Added authenticated local control admission and evidence-derived human-gate state. |
| R3 | B3 | Split stateless image proof from final stateful image composition/proof. |
| R4 | B4 | Split mediated bypass refusal from enrollment/absence detection. |
| R5 | B5 | Moved CI backstops before enforcement promotion. |
| R6 | B6 | Added D19 read-confidentiality boundary and state-volume isolation. |
| R7 | S1 | Redrew Wave 3 parcel boundaries and serialization ownership. |
| R8 | S2 | Added field-level Git/SQLite authority and cutover semantics. |
| R9 | S3 | Added falsifiable lease/idempotency/crash/migration/backup tests. |
| R10 | S4 | Added D20 first-release host/filesystem claim matrix. |
| R11 | S5 | Added FK-P21 evidence manifest and exact proof identities. |
| R12 | S6 | Made mixed-entry-point enumeration/write sentinels binding on FK-P3 shaping. |
| R13 | S7 | Assigned every shared manifest/launcher/CI serialization point. |

## Scoped Gate 1 re-open

The developer is asked to re-ratify only:

1. amended D3, D7–D9, D13–D17;
2. new D18–D20;
3. the FK-P0–FK-P21 graph, including stateless/stateful image separation,
   authorization engine, CI-before-enforcement, and exit-evidence parcel;
4. the amended Wave 2–4 exits;
5. the thirteen integration scenarios; and
6. the amended goal exit criteria.

D1, D2, D4–D6, D10–D12, the explicit no-generic-mint boundary, human-owned Gate 3,
and the goal’s external-effect exclusions remain ratified except where the amendments
clarify their implementation boundary.

**Re-ratification record:** Clinton Morgan explicitly instructed: “Re-ratify Gate 1
amendments R1–R13 and resume Gate 2” on 2026-08-31. The scoped re-open is closed and the
existing standing Gate 2 authorization is active for FK-P0–FK-P21 under its original
contingencies.
