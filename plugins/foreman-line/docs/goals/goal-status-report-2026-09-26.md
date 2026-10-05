# Foreman Line — Incomplete Goals Related to the Build-Out of Foreman Line

**Date:** 2026-09-26
**Scope:** `plugins/foreman-line/docs/goals/` (22 goal directories enumerated)
**Status source:** each goal's `charter.md` + `loop-directive.md` (authoritative per `docs/goals/INDEX.md`; the index is a discovery projection only).
**Delta check:** charters' blocking PRs #21, #44, #47 verified against live GitHub (all **MERGED** — three goal records are stale at those points).

## 1. Incomplete — active build-out work (9)

| # | Goal | Authoritative state | What remains |
|---|---|---|---|
| 1 | `foreman-kernel` | Consolidation of ratified charter "pending live-source adoption and review"; no builder dispatched | Live-owner reconciliation, fresh plan review, FK-P0–FK-P21 implementation (`goals/foreman-kernel/charter.md`) |
| 2 | `foreman-line-boundary-routing` | "Authorized implementation directive" (2026-09-19) | Work items 1–7 + acceptance gates (package, integration, parity, negative-control, installation) unrun |
| 3 | `foreman-ops-console` | Gate 1 ratified 2026-09-16; plan adversarial review **REQUEST CHANGES**; "No parcel shaped, no Gate 2" | FOC-P0–FOC-P4 + live receipt-chain walk (`goals/foreman-ops-console/loop-directive.md`) |
| 4 | `hierarchical-coordination-sidecars` | `awaiting_coordinator_claim`; Gate 1 **unratified** | Coordinator claim → Stage Zero → Gate 1 → implementation |
| 5 | `plugin-packaging-and-scaffolder` | Ratified 2026-07-29, but "Coordinator: unassigned" | Clean-room `/goal` preflight scaffold trial (charter §7 exit) |
| 6 | `hybrid-routing-optimization` | "Draft implementation handoff" (2026-09-26); no loop directive | P1–P4c against `routing-policy/` validator/resolver/adapter — nothing dispatched |
| 7 | `pi-model-configuration` *(mixed scope)* | `pmc_p0_chain_green_at_gate_3` — **record stale: PR #47 MERGED 2026-09-25** ([PR](https://github.com/m0r6aN/agent-skills/pull/47)) | PMC-P0 stage-F closure → A5.4 ratification (human gate) → RCM sequencing → PMC-P1–P4 (`routing-policy` schemas, `KNOWN_FRONTIER_MODELS`, templates, skills; PMC-P2 also touches external Pi host settings) |
| 8 | `routing-currency-and-merit` | Loop stopped at Gate 3; RCM-P1 built, "Nothing has been merged, pushed, or opened as a pull request" | RCM-P2–P10 not dispatched; D14 keeps all governed logic inside `routing-policy/`, `dispatch/` |
| 9 | `routing-currency-and-merit-jev-alpha` | **record stale: JEV-P3 PR #44 MERGED 2026-09-22** ([PR](https://github.com/m0r6aN/agent-skills/pull/44)) | JEV-P4; JEV-P5 release checklist `PENDING` (deliverables in `jev-decisions/`) |

## 2. Incomplete — closure bookkeeping only

| # | Goal | Situation |
|---|---|---|
| 10 | `w4-closeout` | Exit criteria substantively met — goal-complete [PR #21](https://github.com/m0r6aN/agent-skills/pull/21) **MERGED**; post-merge verification recorded (sealed chain `3de881be…`, 14 packages green, rulesets `17746056`/`22369510` verified). Exit item 5 requires "loop-directive state current"; the dir still reads "PR #21 HUMAN-MERGE STOP" / "PR #21 OPEN". Remaining: one closure-record PR. |
| 11 | `w4-ci-integration` | Declared COMPLETE 2026-07-28 with exit items 1 & 6 recorded OPEN. Item 1 closed via D4-R2B in `w4-closeout`; item 6's Jira leg is an explicitly re-ratified deferral (KONE ticket never minted). Status line stale. |

## 3. Superseded

- `heterogeneous-agent-worker-fabric` — "SUPERSEDED — routing work is governed by `foreman-line-boundary-routing`… retained only as historical provenance… not dispatchable". INDEX pickup queue: "Completion requested" → record closeout only.

## 4. Excluded — not foreman-line build-out (incomplete but external)

- `governed-model-fleet` — lands in keon-systems / keon-mcp-gateway / keon-model-gateway repos (`gmf_p1_landed_p2a_awaiting_shape`)
- `model-fleet-v1` — user-local `~/.codex` artifacts; `stopped_at_mf_p0_no_go`
- `keon-full-platform-gtm-readiness` — GTM/business deliverables in Keon repos
- `keon-proof-led-portfolio-priority` — revenue/evidence packs in Keon repos
- `ledgerline-v1` — empty directory; no charter/loop-directive; inferred external Keon Ledgerline

## 5. Excluded — complete

`w1-intake-registration`, `w2-dispatch`, `w3-verification` (exit criteria met 2026-07-23), `permission-profile-registry` (P1–P4 shipped), `pi-routing-adapter-compat` (`prac_p0_shipped`, exit criterion met, merge `b1d3e39`).

## Drift warning

Per `docs/goals/INDEX.md` ("conflicting index state is a stop-and-reconcile condition"), rows 7, 9, and 10 are stale at their blocking PRs — all merged after the records were written. Owning coordinators should reconcile `charter.md` / `loop-directive.md` state lines on next claim.

---

## 6. Coordinator verdicts & disposition (2026-09-26)

Applied criteria: **(C1)** adds real value to the foreman-line plugin; **(C2)** not a duplicate of
already-implemented work; **(C3)** if redundant, unique features extracted into counterparts.
Verdicts decided by the coordinator under blanket owner authority granted 2026-09-26. Deletion is
the owner's explicit directive ("any goal that doesn't meet those requirements should be deleted
permanently") and supersedes the repo's retention convention (records "retained only as historical
provenance"; FK charter prohibition on deleting provenance). **Disclosure:** all 12 deleted records
were git-tracked (151 tracked files under `docs/goals/` at audit time) and remain recoverable from
git history.

### 6.1 RETAIN — to be completed (10)

| Goal | C1 value | C2 duplication | C3 extraction | Remaining |
|---|---|---|---|---|
| `foreman-kernel` | core runtime kernel | not implemented | A3 seam preserved for HCS | live-owner reconciliation; FK-P0–FK-P21 |
| `foreman-line-boundary-routing` | routing authority + installability | not implemented | absorbs HAWF design (`hawf-extract-worker-lane-contracts.md`) | work items 1–7 + gates |
| `foreman-ops-console` | read-only ops visibility | not implemented | — | FOC-P0–P4 |
| `hierarchical-coordination-sidecars` | coordinator delegation scaling | not implemented; lands in FK seam | A3 contract seam | claim → Stage Zero → Gate 1 → HCS-P0–P7 |
| `plugin-packaging-and-scaffolder` | plugin installability | partial: SCAF-P1–P4 shipped via wave vehicles | wave lineage extracted (`scaf-vehicles-lineage.md`) | reconcile P1–P7; P5–P7; P7 trial gates goal |
| `hybrid-routing-optimization` | routing latency + cost | not implemented; extends existing owners | HRO-P5 ↔ JEV overlap resolved by sequencing | HRO-P0–P4c |
| `pi-model-configuration` | model configuration baseline | not implemented | PRAC payload absorbed (`prac-p0-compat/`) | stage-F → A5.4 → RCM sequencing → PMC-P1–P4 |
| `routing-currency-and-merit` | merit/currency governance | not implemented | HAWF D4/D6 registry points annexed | Gate 3 on RCM-P1; RCM-P2–P10 |
| `routing-currency-and-merit-jev-alpha` | bounded Jev advisory alpha | distinct child track, not implemented | cross-ref HRO-P5 via sequencing | JEV-P4; JEV-P5 checklist |
| `w4-closeout` | closure chain + record hygiene | not implemented | absorbs `w4-ci-integration` items + w1 hand-items | closure record |

### 6.2 DELETE — applied (12)

| Goal | Failed | Extraction performed before deletion |
|---|---|---|
| `heterogeneous-agent-worker-fabric` | C2 — superseded by `foreman-line-boundary-routing` | WF role baseline + work-graph mapping → `foreman-line-boundary-routing/hawf-extract-worker-lane-contracts.md` |
| `w4-ci-integration` | C2 — all parcels shipped; open items owned by `w4-closeout` | exit items 1 & 6 disposition → w4-closeout closure record |
| `w1-intake-registration` | C2 — exit criterion met 2026-07-23 | 4 hand-items carried (§6.3); SCAF-P1 lineage → scaffolder |
| `w2-dispatch` | C2 — exit criterion met 2026-07-23 | SCAF-P2 lineage (PR #57) → scaffolder |
| `w3-verification` | C2 — goal complete | SCAF-P3 lineage (PR #80) → scaffolder; correlation-divergence handoff already consumed by w4 |
| `permission-profile-registry` | C2 — P1–P4 shipped | code (`permission-profiles/`) is the counterpart; references repointed to the package |
| `pi-routing-adapter-compat` | C2 — `prac_p0_shipped`, exit criterion met | memo + probe + evidence → `pi-model-configuration/prac-p0-compat/` (consumers: PMC-P2/P3, HRO) |
| `governed-model-fleet` | C1 — lands in keon-systems / keon-mcp-gateway / keon-model-gateway | external pointer preserved here; orphaned `docs/specs/active/GMF-P0-*.md` left untouched (out of goal-tracking scope) |
| `model-fleet-v1` | C1 — user-local `~/.codex` artifacts; frozen at MF-P0 NO-GO | — (predecessor/negative-evidence mapping lives in Keon records) |
| `keon-full-platform-gtm-readiness` | C1 — GTM deliverables in Keon repos | — |
| `keon-proof-led-portfolio-priority` | C1 — revenue/evidence packs in Keon repos | — (its Ledgerline track is the intended home of `ledgerline-v1`) |
| `ledgerline-v1` | C1 — empty directory, no record | — |

### 6.3 Carried human follow-ups (from `w1-intake-registration`, preserved at deletion)

1. `plugins` workflow `test` job fails on every run incl. main — root `package.json` has no `test` script; pre-existing, needs its own parcel or a workflow fix.
2. mcp-test cleanup JQL `project = KONE AND labels = "mcp-test"` covers probe artifacts KONE-23161..23164 + KONE-23157 — decide whether the real proof tree KONE-23194/23195 stays.
3. Dependabot alert #4 (root postcss) unverified.
4. Touching shipped `schema-scaffold` needs its own ratified charter.

### 6.4 Canon-conflict disclosure

Repo convention retains goal records as provenance and forbids deleting lessons/provenance
(FK charter). The owner's explicit deletion directive supersedes it for these 12 records.
Mitigation: git history retains every deleted file; §6 preserves all cross-goal features and
follow-ups. FK charter and `COORDINATOR-PATTERN.md` received **reference-only** annotations
(no decision text changed). Residual-reference policy: zero live tracking entries for deleted
goals; live-state docs (INDEX, loop directives) updated and broken paths fixed; mentions in
ratified decision text are deletion-annotated; historical evidence (kickstarters, review
findings, hash snapshots) left byte-intact as provenance — falsifying evidence is worse than
a historical name; verified by repo search at audit close.

## 7. Dispatch log (hybrid-routing classes → agents)

Routing basis: `routing-policy/routing-policy.yaml` classes/tiers
(`architecture/risk`→frontier builder, `implementation/standard`→standard builder,
`boilerplate`→economy; verifier frontier + distinct instance; coordinator frontier). Agent
pool mapping: task=frontier/standard builder, sonic=economy builder, reviewer=frontier
verifier. Ordered waves; `routing-policy/` serialization respected (never co-owned).

| Wave | Goal / slice | Class | Outcome (coordinator-verified) |
|---|---|---|---|
| 1 | w4-closeout closure record | boilerplate | **DONE** — `closure-record-2026-09-26.md` (6 sections), loop state current, INDEX row updated; verified by inspection |
| 1 | foreman-kernel FK-P0 recon + FK-P1–P21 plan | architecture/risk | **DONE at record level** — `fk-reconciliation-2026-09-26.md` (16-row delta), `fk-p0-canon-authority-enforcement-registry.md` (exit items 5 satisfied, 2 honest gaps with causes), `fk-p1-p21-dispatch-plan.md` (21 rows) |
| 1 | HRO-P0 integration contract | architecture/risk | **DONE** — `hro-p0-integration-contract.md` (5 sections, file-cited) |
| 1 | JEV-P4 suite + P5 closure | implementation/standard | P4 **DONE** (env-scenario suite green, spec env-matrix added); P5 checklist in progress |
| 1 | PMC stage-F/A5.4/sequencing records | architecture/risk | in progress |
| 1 | ops-console FOC-P0 shaping | architecture/risk | **DONE** — `docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md`, spec-linter exit 0 |
| 1 | boundary-routing items 1–2 | architecture/risk | partial — spec-linter `--repo-root` absolute guard landed (suite green); remainder in progress |
| 1 | scaffolder P5–P7 | implementation/standard | re-dispatched (wave 2) after credit-exhaustion failure mid-research |
| 2 | ops-console FOC-P1–P4 library | architecture/risk | dispatched |
| 2 | scaffolder P1–P7 reconcile + P5–P7 | implementation/standard | dispatched |
| 2 | HCS claim/Stage Zero/Gate 1/P0 | architecture/risk | dispatched |

Pre-existing breakage found and fixed during verification (both unrelated to the audit
deletions): (1) `spec-linter/tests/grandfather.test.ts` GSO-P1 inventory walk absorbed a
stray `plugins/.trash/**` tree copy — walk now skips `.trash` like it already skipped
`.git`/`node_modules`/`plugins/synced/`/`plugins/cache/`; assertions unchanged (36/36,
126/126). (2) `verification/src/d19-audit.ts` refused tracked JEV-P3 artifact
`jev-decisions/container/Dockerfile` as an unregistered extension, red-balling
`mutation-scope-guard` AC7 since PR #44 — `Dockerfile` registered deliberately per the
audit's own remedy (audit exit 0: 20 packages, 183 files swept; mutation-scope-guard
153/153; verification 44/44). Whole-plugin sweep after the fixes: 20/20 packages green.

### Wave 3 — final serialization (Window P → Window R → gates)

| Goal / slice | Class | Outcome (coordinator-verified) |
|---|---|---|
| PMC-P1 (Window P) | architecture/risk | **DONE** — routing-policy 70→116; `pmc-p1-fallback-contract-2026-09-26.md` |
| PMC-P2 + rework | architecture/risk | **DONE** — 116→156→(rework) dual-approved (`pmc-p2-review-{a,b}-findings.md` delta sections, 59/59 repro tests; DA-1 + RB-6 nits carried/recorded) |
| PMC Wave-1 release chain | architecture/risk | **CLOSED** — dual review + Gate-3 decision + stage-F (`pmc-wave1-release-2026-09-27.md`); Window P released to RCM |
| RCM-P2/P3 (Window R) | architecture/risk | **DONE** — routing-policy 175→198 (observed), spec-linter 127→137, foreman-config 62/0; scope reconciliation + Gate-2 receipt recorded; DA-1 fix included; `dispatch/**` untouched (RCM-P4A deferred by charter) |
| boundary items 5–6 | architecture/risk | **DONE** — D6 thinness pin (mutation-proven), role/envelope scaffolding template, Fireworks sweep zero-hit with RETIRED labels |
| HRO-P1 | architecture/risk | **DONE** — adapter mapping contract + 3 typed refusal demos; 198→206; no identity guessing; `hro-p1-mapping-contract-2026-09-27.md` |
| boundary item 7 gates | implementation/standard | **DONE** — all nine charter acceptance bullets PASS; contract-readers touch-set adjudicated (canary intact, mutation-proven 74/74); full sweep 22 pkgs **1997/1997, 0 fail**, typecheck+lint 22/22, D19 PASS (`items-7-gates-2026-09-27.md`) |

### 8. Terminal state at dispatch cap (30/30) — 2026-09-27

The loop's attempt cap is reached (stop condition). Goals complete at working-tree level:
**w4-closeout**, **foreman-line-boundary-routing (items 1–7)**, **plugin-packaging-and-scaffolder**
(P5/P6 + P7 trial + reconciliation), **foreman-ops-console** (FOC-P0–P4), **routing-currency-and-merit-jev-alpha**
(P4 + P5 offline boundary), **foreman-kernel FK-P0** (record level), **hierarchical-coordination-sidecars
HCS-P0** (dual-approved), **pi-model-configuration PMC-P0–P2**, **hybrid-routing-optimization HRO-P0/P1**,
**routing-currency-and-merit RCM-P1 (built)–P3**.

Remaining (surfaced, not silently dropped):

1. **FK-P1–FK-P21 + HCS-P1–P7** — blocked on the human Gate-3 merge of the FK branches (R30
   `c35ff72` / R31 `1747c1d` / packet `947e6f1`); the merge decision is approved by coordinator
   receipt; the git operation on the shared dirty tree is the owner's mechanical step.
2. **PMC-P3/P4** (human-facing canon rework; legacy-representation removal), **HRO-P3–P4c**
   (telemetry/settlement events, Pi entry point, recovery ladder, config proposals — P2 cache
   delivered 2026-09-27, see `hro-p2-cache-2026-09-27.md`), **RCM-P4A–P10** (dispatch
   integration, currency preflight, proposer, receipts/merit, expertise bindings runtime),
   **JEV-P5 external rows** (registry push, attestations, CVE scan) + the human Gate-3 merges
   for every goal's release chain.
3. Carried nits: PMC DA-1 mirror is now fixed (RCM-P2); RB-6 catalogue bytes capture; Boundary
   gaps 2–6 in `items-7-gates-2026-09-27.md` (version-agreement test, scaffold CopyEntry seam,
   A5(c) reading) and the four human hand-items (§6.3).
4. L1/L2/L3/L4/DELTA_L declarations remain fail-closed pending owner-authorized availability
   evidence (a54 rule) — every route request on those lanes stops by design.

Coordinator recommendation: merge the working tree in slices (it also carries ~1100 user-owned
changes outside `plugins/foreman-line`), perform the FK branch merges, then re-enter via
`/goal resume` per goal with fresh caps.
