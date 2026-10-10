# Foreman Line Goal Index

This file is a discovery projection. Each goal's `charter.md` and `loop-directive.md`
remain authoritative for status, ownership, gates, and next action. Never infer authority
from an index row.

**Post-audit state (2026-09-26/27):** the goal tree was pruned per owner-directed criteria
(real value / duplicate / extractable features). 12 records were deleted; verdicts and the
dispatch log live in [goal-status-report-2026-09-26.md](goal-status-report-2026-09-26.md).
Deleted records are recoverable in git history.

## Trustworthy observation roadmap (owner-ratified 2026-10-10)

| Goal | State | Entry | Authority |
| --- | --- | --- | --- |
| [trustworthy-observation](trustworthy-observation/charter.md) | `plan_review_closed_to_p0_shaping` | `/goal resume trustworthy-observation` | Codex root owns this isolated goal; D1–D8 / TO-P0–P7 ratified; standing dispatch and green-chain merges delegated; preferred MiMo/Ember workers, Jev/Drex advisory screening only. [Persistent three-goal grant](ops-console-roadmap-authority.md). |

## Coordinator pickup queue

| Goal | State | Entry | Current authority |
|---|---|---|---|
| [foreman-kernel](foreman-kernel/charter.md) | `fk_p11_merged_wave3a_complete` | `/goal resume foreman-kernel` | **FK-P11 MERGED** (Gate-3 delegated RS-2.1; 206/206; **Wave-3a exit fragment (c) CLOSED**; `fk-p11-stage-f-closure-2026-09-29.md`). Session merges: FK-P0 (+R32), FK-P1, FK-P2, FK-P9 (+A1–A1e), FK-P10, FK-P11, FK-P17′ — **[INFERENCE] RESOLVED CONFIRMED**. Remaining in-scope: **FK-P18′** (U1-gated; evidence landed). FK-P3/FK-P2B window-gated (FK-P4–P8 transitively). Deferred P12–P16/P19/P21 + dropped P20 + all stranded obligations named in the exit annex |
| [ci-fail-fast](ci-fail-fast/charter.md) | `cff_gate2_granted_p0_p3_dispatched` | `/goal resume ci-fail-fast` | Charter fully ratified (Gate 1 twice; plan review closed, triage installed as D7–D11); **Gate 2 granted early and scoped** ("gate 2 early grant issued" — CFF-P0 + CFF-P3 shaping kickstarters issued, Step 0 gates pending); CFF-P1/P2/P4 hold for the full-graph Gate 2; Gate 3 human-owned |
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
| [governed-model-fleet](governed-model-fleet/charter.md) | `gmf_p2a_landed_p2b_accepted_uncommitted_p2c_held` | RESTORED 2026-09-27 by explicit owner directive ("Proceed with the completion of governed-model-fleet"); the 2026-09-26 C1 deletion is superseded for this goal only. Coordinator ownership transferred 2026-09-27 at a parcel boundary; state reconciled 2026-09-28 at the P2A-landed boundary (MRC-01-class write). GMF-P0 (PR #28) + GMF-P1 (PR #33) + **GMF-P2A (PR #203 merged `dcadad5`; precedence (a) verified byte-exact)** landed in `keon-systems`; GMF-P2B built+accepted — delivery uncommitted, landing = owner act (extend the green-contingent grant or owner-run); GMF-P2C shaped+held behind it (`gmf-p2a/p2b-closure-evidence.md` assembled). Work lands in external Keon repos (`keon-systems` first); `keon-fleet-executor`/`keon-model-gateway` remain absent pending human gate GMF-HG-R1 |
| [model-routing-chain-wrapper](model-routing-chain-wrapper/loop-directive.md) | `mrc_owner_gate_blocked` | Chain wrapper for the HRO/RCM/PMC/JEV/GMF parcel set (MRC-01…25): MRC-01…13 + GMF-P2A/P2B built to acceptance; GMF-P2A LANDED 2026-09-28 (PR #203). Every remaining item owner-gate-blocked — resume set in `dispatch-table.md` §Open stop-reports (critical path: the P2B landing grant; then G-MERGE / G-LIVE / G-JEV-EXT / G-GMF-HR1+AUTH) |

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
