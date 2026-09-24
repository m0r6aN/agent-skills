# Foreman Line Goal Index

This file is a discovery projection. Each goal's `charter.md` and `loop-directive.md`
remain authoritative for status, ownership, gates, and next action. Never infer authority
from an index row.

## Coordinator pickup queue

| Goal | State | Entry | Current authority |
|---|---|---|---|
| [hierarchical-coordination-sidecars](hierarchical-coordination-sidecars/charter.md) | `awaiting_coordinator_claim` | `/goal resume hierarchical-coordination-sidecars` | Goal intake requested; Gate 1/2 absent; Gate 3 human |
| [heterogeneous-agent-worker-fabric](heterogeneous-agent-worker-fabric/charter.md) | `awaiting_coordinator_claim` | `/goal resume heterogeneous-agent-worker-fabric` | Completion requested; Gate 1/2 absent; default-route Gate 3 human |

## Active goals awaiting a human gate

| Goal | Owner | State | Current authority |
|---|---|---|---|
| [governed-model-fleet](governed-model-fleet/charter.md) | /root | gmf_p1_landed_p2a_awaiting_shape | D1-D24 plus A1/P0-P9 ratified; P0 + P1 evidence landed (PRs #28, #33); P1 closure READY; P2A shaping next, no Gate 2 yet |
| [pi-model-configuration](pi-model-configuration/charter.md) | Pi coordinator session (claimed 2026-09-23) | `pmc_p0_shaped_awaiting_gate_2` | D1-D8 plus Amendments 01 (A1-A8) and 02 (M1-M4) ratified; PMC-P0 draft spec shaped and self-checked; Gate 2 not granted; Wave 1 needs RCM sequencing; no provider spend, no host change |
| [pi-routing-adapter-compat](pi-routing-adapter-compat/charter.md) | this `/goal` Pi session (separate queue, 2026-09-24) | `gate_1_ratified_entering_prac_p0` | D1-D11 ratified (incl. plan-review amendments + 0.87.1 pin + PMC scope-guard); Gate 2 granted for PRAC-P0 only; contingent Gate 3 (repo-local, green-chain); memo strictly extension/hook-SDK surface, consumed by PMC-P2/P3 by pointer; zero routing authority, zero host write |
| [foreman-ops-console](foreman-ops-console/charter.md) | current session | `gate_1_ratified_plan_review_pending` | Charter ratified 2026-09-16 (OQ1–OQ5 decided); D8 standing Gate 2 (FOC-P0–P4) + contingent Gate 3 granted; plan-level adversarial review is the mandatory next step |

## Frozen or stopped goals

| Goal | State | Current authority |
|---|---|---|
| [model-fleet-v1](model-fleet-v1/charter.md) | `stopped_at_mf_p0_no_go` | Frozen predecessor evidence; MF-P1–MF-P4 not dispatched; no active implementation authority |

These are separate goals and require separate owning coordinators. A coordinator may own
only one of these queues at a time unless a future ratified hierarchy explicitly permits a
subordinate arrangement. Shared serialization points are sequenced, never co-owned.

## Existing goal directories

The following goal records predate this index. Read their charter and loop directive, when
present, rather than projecting status from their directory name:

- `foreman-kernel` (present in a separate active goal worktree at intake time, not on this
  branch's base);
- [keon-full-platform-gtm-readiness](keon-full-platform-gtm-readiness/charter.md);
- [keon-proof-led-portfolio-priority](keon-proof-led-portfolio-priority/charter.md);
- [permission-profile-registry](permission-profile-registry/charter.md);
- [plugin-packaging-and-scaffolder](plugin-packaging-and-scaffolder/charter.md);
- [w1-intake-registration](w1-intake-registration/charter.md);
- [w2-dispatch](w2-dispatch/charter.md);
- [w3-verification](w3-verification/charter.md);
- [w4-ci-integration](w4-ci-integration/charter.md); and
- [w4-closeout](w4-closeout/charter.md).

## Update rule

The owning coordinator updates its row whenever it claims, stops, transfers, or completes
the goal. The goal-local ownership block is still the source of truth; conflicting index
state is a stop-and-reconcile condition.
