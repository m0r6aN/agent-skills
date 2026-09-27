# Foreman Line Goal Index

This file is a discovery projection. Each goal's `charter.md` and `loop-directive.md`
remain authoritative for status, ownership, gates, and next action. Never infer authority
from an index row.

**Post-audit state (2026-09-26/27):** the goal tree was pruned per owner-directed criteria
(real value / duplicate / extractable features). 12 records were deleted; verdicts and the
dispatch log live in [goal-status-report-2026-09-26.md](goal-status-report-2026-09-26.md).
Deleted records are recoverable in git history.

## Coordinator pickup queue

| Goal | State | Entry | Current authority |
|---|---|---|---|
| [foreman-kernel](foreman-kernel/charter.md) | `fk_p1_merged_r32_w2b_in_flight` | `/goal resume foreman-kernel` | **FK-P1 MERGED** (`fed2298`, Gate-3 delegated RS-2.1 — chain green, dual reviews closed, Stage F done: `fk-p1-stage-f-closure-2026-09-27.md`). Next FK-P2 (spec shaped `f50ecba0` with coordinator rulings; dispatch when R32 lands). Corpus amendment R32 in rework W2b (W2-1/W2-2/W2-3 corrections → 750/750 target) then independent review. RS-1/RS-2 scope unchanged: FK-P2–P11 + FK-P17′/P18′ in scope, FK-P12–P16/P19/P21 deferred, FK-P20 dropped; FK-P2B/FK-P3 windows pending (`fk-p2b-p3-window-request-2026-09-27.md`); exit annex draft tracks remainders |
| [hierarchical-coordination-sidecars](hierarchical-coordination-sidecars/charter.md) | `hcs_p0_accepted` | `/goal resume hierarchical-coordination-sidecars` | Claimed 2026-09-26; Stage Zero + Gate 1 + P0 records dual-approved (`hcs-p0-acceptance-2026-09-26.md`); next HCS-P1 (RB-01 pin carried) — HCS-P7 stays gated on the FK merge |

## Active goals

| Goal | State | Current authority |
|---|---|---|
| [foreman-line-boundary-routing](foreman-line-boundary-routing/charter.md) | `items_1_7_complete` | **DONE 2026-09-27** — items 1–7 delivered; all nine acceptance bullets PASS (`items-*-status-*` + `items-7-gates-2026-09-27.md`); full sweep 22 pkgs 1997/1997, D19 PASS; goal-level remainders (live Jev smoke, version-agreement test) recorded in the gates record |
| [foreman-ops-console](foreman-ops-console/charter.md) | `foc_p1_p4_implemented` | FOC-P0 shaped (spec-linter clean) + FOC-P1–P4 library delivered (`ops-console/`, 78/78 green, localhost 8081 smoke); Phase 2 (FOC-P5–P8) needs a scoped Gate 1 amendment; D19 audit green after coordinator enrollments |
| [hybrid-routing-optimization](hybrid-routing-optimization/charter.md) | `hro_p0_p1_done` | HRO-P0 contract + HRO-P1 mapping/typed-refusal demos delivered (routing-policy 206/0; `hro-p1-mapping-contract-2026-09-27.md`); HRO-P2–P4c (cache, telemetry, recovery, config proposals) remain |
| [pi-model-configuration](pi-model-configuration/charter.md) | `wave_1_released_p3_p4_next` | PMC-P0–P2 complete + dual-approved (`pmc-wave1-release-2026-09-27.md`); Window P released; Gate-3 merge decision approved (git step = owner's); P3 (human-facing canon) + P4 (legacy removal) remain; L1–L4/DELTA_L fail-closed pending owner-authorized evidence |
| [plugin-packaging-and-scaffolder](plugin-packaging-and-scaffolder/charter.md) | `p5_p6_done_p7_trial_recorded` | P1–P7 reconciled (`p1-p7-reconciliation-2026-09-26.md`); `project-scaffold/` generator 41/41; P7 clean-room trial recorded (`p7-clean-room-trial-2026-09-26.md`); P3/P4 residual deferred under Window-P template rules |
| [routing-currency-and-merit](routing-currency-and-merit/loop-directive.md) | `rcm_p2_p3_built` | RCM-P1 built (399/399) + Gate 3 merge approved (owner does the git step); Window R exercised: RCM-P2/P3 built 2026-09-27 (routing-policy 198→206 after HRO, spec-linter 137, foreman-config 62; `rcm-p2-scope-reconciliation-2026-09-27.md`); RCM-P4A–P10 remain |
| [routing-currency-and-merit-jev-alpha](routing-currency-and-merit-jev-alpha/loop-directive.md) | `p5_offline_boundary_reached` | JEV-P4 suite green (44/44 incl. env-scenario block); JEV-P5 checklist fully dispositioned — Docker rows CHECKED with real build/scan evidence (`jev-p5-docker-evidence-2026-09-26.md`), remainder BLOCKED on registry push/attestations/CVE tooling + human Gate 3 |
| [w4-closeout](w4-closeout/loop-directive.md) | `w4_closeout_complete` | GOAL COMPLETE 2026-09-26 — closure record filed, PR #21 merged state reconciled, predecessor items dispositioned |
| [governed-model-fleet](governed-model-fleet/charter.md) | `gmf_p1_landed_p2a_awaiting_shape` | RESTORED 2026-09-27 by explicit owner directive ("Proceed with the completion of governed-model-fleet"); the 2026-09-26 C1 deletion is superseded for this goal only. Coordinator ownership transferred 2026-09-27 at a parcel boundary. GMF-P0 (PR #28) + GMF-P1 (PR #33) landed; GMF-P2A shaping in progress → exact Gate 2 request. Work lands in external Keon repos (`keon-systems` first); `keon-fleet-executor`/`keon-model-gateway` remain absent pending human gate GMF-HG-R1 |

These are separate goals and require separate owning coordinators. A coordinator may own
only one of these queues at a time unless a future ratified hierarchy explicitly permits a
subordinate arrangement. Shared serialization points are sequenced, never co-owned — see
[`pi-model-configuration/rcm-sequencing-decision-2026-09-26.md`](pi-model-configuration/rcm-sequencing-decision-2026-09-26.md)
(Window P = PMC-P1/P2 on `routing-policy/**` + `templates/**`; Window R = RCM-P2+ on
`routing-policy/**` + `dispatch/**`; six scaffolder-owned template files excepted).

## Deleted records (2026-09-26)

`heterogeneous-agent-worker-fabric`, `w1-intake-registration`, `w2-dispatch`,
`w3-verification`, `w4-ci-integration`, `permission-profile-registry`,
`pi-routing-adapter-compat`, `governed-model-fleet`, `model-fleet-v1`,
`keon-full-platform-gtm-readiness`, `keon-proof-led-portfolio-priority`, `ledgerline-v1`.
Verdicts and extraction targets: [goal-status-report-2026-09-26.md](goal-status-report-2026-09-26.md) §6.

**2026-09-27 update:** `governed-model-fleet` was restored by explicit owner directive
("Proceed with the completion of governed-model-fleet") and is active again — see its row
under Active goals. The other 11 deletions stand.

## Update rule

The owning coordinator updates its row whenever it claims, stops, transfers, or completes
the goal. The goal-local ownership block is still the source of truth; conflicting index
state is a stop-and-reconcile condition.
