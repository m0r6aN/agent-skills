# FK Wave 3–4 marginal-value quantification — 2026-09-27

**Goal:** `foreman-kernel`
**Purpose:** evidence basis for the RS-1 re-scope amendment (`fk-rescope-RS1-2026-09-27.md`). Quantifies what FK-P9–FK-P21 would add against enforcement machinery already delivered or planned by sibling goals, per the owner-directed question (2026-09-27).
**Method:** three read-only enforcement inventories compiled 2026-09-27 from goal records and on-disk code: (1) `foreman-line-boundary-routing` work items 1–7 (`items-1-2-status-2026-09-26.md`, `items-3-4-status-2026-09-26.md`, `items-5-6-status-2026-09-27.md`, `items-7-gates-2026-09-27.md`); (2) `routing-currency-and-merit` P0–P10 (`charter.md`, `loop-directive.md`, `exit-audit.md`, `rcm-p2-scope-reconciliation-2026-09-27.md`, `rcm-p1-review-triage.md`, `rcm-p0-verification.md`); (3) the live-tree baseline (`plugins/foreman-line/` packages + `.github/workflows/`).
**Basis:** record-cited counts, not re-run (consistent with `goal-status-report-2026-09-27.md`'s basis note). One inference is flagged where used.

## 1. Parcel-level marginal value (FK-P9–FK-P21, 13 parcels)

| FK parcel | Existing coverage | Marginal value |
|---|---|---|
| P9 storage/migrations/backup | Nothing. RCM-P1 `readCatalogSnapshot` digest/format refusal (spec AC1–AC3) is a parse-time analog only | **High** — no storage concept exists anywhere |
| P10 lease/transition/CAS | Docs-prose only (RCM Window-R single-writer write-set; `loop-directive.md` A19); no lease/revision concept in code | **High** |
| P11 import/cutover/divergence-stop | `projection/` projects spec artifacts; receipts chain walk; no import path, no divergence-stop | **High** (substrate partial) |
| P12 `authorizeAction` engine | Fragments only: identity injection, root guards, `mutation-scope-guard`, shadow admission seam; no composing engine | **High** — and see §3 |
| P13 control catalog | `registration` `GatedTransport` default-deny is an admission precedent, not an authenticated capability surface | **High** |
| P14/P15 stateful image + crash proofs | `ops-console/Dockerfile`, `jev-decisions/container/`; no state volume, restart, split-brain, stale-CAS proofs | **High** |
| P16 hook adapter (4 events, shadow, heartbeat) | `hooks/model-gate.mjs` — 2/4 events, live-blocking, different policy (model membership), fails open on non-enrollment | **Medium** — registration pattern reused; delta is PostToolUse/Stop + heartbeat |
| P17 bypass/outage harness | Per-mechanism negative controls only; no shell/subprocess/symlink/subagent matrix | **Medium** (evidence-producing; feeds promotion decisions) |
| P18 CI backstops | `foreman-line-ci.yml` (19 pkgs) + `test-plugin-install.yml` exist; plugins `test` job recorded failing every run | **Medium** — cheap deltas; broken-CI fix is an unowned prerequisite |
| P19 five-class promotion | See §2 | **Split** — 1 class enforced (wrong authority), 2 partial, 2 absent |
| P20 Codex second host | `.codex-plugin/plugin.json` manifest only | **Low** — D20 already caps the claim; honest outcome may be "recorded gap" |
| P21 exit evidence manifest | `approvedHash` (approval), receipt prevHash chain, RCM-P0 per-source SHA-256 pins — digest precedents, no assembly | **Medium** |

Tally: **0 parcels fully covered today; 5 partial (P12, P16, P18, P19, P21); 8 zero-coverage (P9, P10, P11, P13, P14, P15, P17, P20).**

## 2. FK-P19's five refusal classes vs. today's enforcers

| Class | Status today | Existing enforcer |
|---|---|---|
| `WORKTREE_MISMATCH`/`BRANCH_MISMATCH` | **Absent** — neither enforced nor detected | convention prose only |
| `PATH_OUTSIDE_ALLOWED_FILES`/`FROZEN_SURFACE_MUTATION` | **Enforced** (strongest) | `mutation-scope-guard` preflight+post-hoc wired into `dispatch/src/approval-cli` (refuses before worktree creation and before Stage-C receipt) + frozen-surface diff tests |
| `REVIEWER_MUTATION_FORBIDDEN`/`REVIEW_WORKTREE_DIRTY` | **Absent** mechanically | Standing Constraint R10 + reviewer template (prose); `INVALID_REVIEW_BINDING` adjacent only |
| `POLICY_SELF_MODIFICATION`/`MEDIATED_BYPASS` | **Narrow precedents** | `KNOWN_FRONTIER_MODELS` hardcoded anchor, `LANE_DISABLED_REFUSED`, policy-digest cache keys — not the named classes |
| `OWNER_LEASE_MISMATCH`/`STATE_REVISION_STALE`/`GATE_NOT_SATISFIED` | **Partial**: gate analogs enforced; lease/CAS nothing | approval CLI human-gate integrity (non-TTY refusal, record-before-receipt, rollback), registration F7 hash-refusal, verification one-tap gate |

Score: **1/5 enforced, 2/5 partial, 2/5 absent.** The enforced class lives at the dispatch/process layer, not the mediated-lifecycle layer; the genuine marginal for Wave 4 is catching mutations made outside the dispatch/approval CLIs (shell, direct file writes, subagents) — the channels D13 admits cannot be fully contained. Residual marginal: classes 1 & 3, cheaply closable as CI/diff invariants (post-action realpath-aware diff; dirty-reviewer check).

## 3. The D10 defect (sharpest finding)

Today's strongest scope enforcer (`mutation-scope-guard`) authorizes mutations from frontmatter `surfaces:` — which locked decision D10 declares "never substitutes for mutation authority." FK-P2's spec-body compiler does not merely duplicate that guard; it **fixes the wrong-authority input** of the one existing class-2 enforcer. Highest marginal value per parcel in the program → FK-P2 pulled forward (RS-1).

## 4. Cost side

- Wave 3–4 = 13 parcels, **all `architecture/risk` → 26 independent reviews**, plus clean-room proofs (P15), a bypass matrix (P17), and promotion gates (P19).
- Demonstrated throughput: ~1 parcel/week (FK-P0 consumed four weeks and required R30/R31 rounds).
- Counterfactual: RCM delivered capability/refusal-correct routing enforcement as pure functions + typed refusals + tests — no state, no hooks, no containers — and moved 399/399 → 206-test suites inside one Window.

## 5. Conclusions (consumed by RS-1)

1. Wave 3 is nearly pure marginal value (zero duplication); its problem (record drift) is demonstrated in `goal-status-report-2026-09-27.md` §5. Split: P9–P11 core (in scope); P12–P15 deferred to a Wave-3a value check (assurance-heavy tail; P12's primary consumer P16 is deferred).
2. Wave 4 is ~half duplicate-at-a-different-layer. Cut to P17+P18 (evidence/detection layer); defer P16/P19/P21 to a value check after P17/P18; drop P20 unless a cheap Codex probe is later justified.
3. FK-P2 pulled forward to the head of the Wave-0 queue (after FK-P1's contract shapes land).

**[INFERENCE]** "Mutations outside the dispatch CLI bypass all scope checks" is inferred from mechanism wiring (`mutation-scope-guard` fires only via `dispatch/src/approval-cli`), not proven by a live bypass test. FK-P17' is the instrument that would prove it; its matrix must include this vector.
