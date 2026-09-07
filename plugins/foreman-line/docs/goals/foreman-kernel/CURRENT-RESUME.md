# Foreman Kernel current continuation

Coordinator: Codex thread `01a07c0b-90eb-7bf0-88f4-0ca912ef87fb` under `authorization-20260907-unattended.md`.

- Live coordinator branch: `codex/foreman-kernel-unattended-20260907`.
- Immutable initial publication: `handoff/foreman-kernel-live-20260907` at `fe31042bbe4370cb81b38632720849983c7be04c`.
- Unchanged baseline: `codex/fk-p0-recovery-20260907` at `0ee165720f8d1e3a91eb283cb770400b23f61bf5`.
- R30 integration: `codex/fk-p0-r30-adoption-20260907`, docs-only integration `65c4714`; no package changes yet.

Read live charter/loop, authorization, adoption review, R30 amendment, source expectations and R30-plan-and-source-review-20260907.md. A1.8/A1.9 ledger and INF1-8 adoption are recorded; charter adoption, R30 plan and source expectations passed their independent document reviews. Runtime verification remains distinct.

Baseline execution runs in its separate worktree with full streams/metadata/direct-exit markers under `evidence/20260907/round6/` on this coordinator tree. Installation and typecheck passed; full npm test is active at this update. Progress logs are attempted-completion observations, not passing-test evidence. Do not start overlapping heavy Node work or infer an exit from a partial TAP summary. The recovery agent owns this evidence directory until its final handoff.

A fresh R30 builder is at read-only Step0: concrete source-to-rule mapping, independent counts and preservation strategy precede code. Full baseline outcome and coordinator ruling gate R30 implementation. No source snapshot may move silently. No merge or StageF has occurred. The next durable update will record direct baseline results and the R30 Step0 ruling.
