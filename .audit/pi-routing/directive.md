# DIRECTIVE — Pi model routing for Foreman Line (2-seat council + orchestrator)

**Evidence:** `brief.md`, `own-verdict.txt`, `claude-out.txt`, and `claude2-out.txt` in this directory. Grok, Codex, and Gemini seats did not produce usable verdicts because of headless CLI/tool-startup failures.

## Verdict

Adopt automatic routing, but make it a two-layer system: Foreman chooses the role/risk/data/budget lane; Pi chooses an approved provider/model inside that lane. For Foreman integration, start with explicit `pi-auto-router` routes because its named targets, policy rules, shadow mode, budgets, and explain output are easier to audit. Use `pi-model-auto` as the simpler personal-session alternative, not alongside it in the first pilot.

## Convergent Findings

- The supplied file is static startup/cycling configuration, not an automatic router.
- As pasted, the URLs and escaped environment-variable names are invalid; current Pi docs place custom providers/models in `models.json`, not `settings.json`.
- The four models need explicit capability tiers and live catalog verification; do not assume the old Claude/GPT identifiers or DeepSeek Distill tool behavior.
- Automatic routing cannot infer Foreman risk, approval, reviewer independence, or mutation authority from task semantics alone.
- The packaged plugin is behind the standalone version at the root/identity boundary; routing should not be wired into the older boundary model first.

## Execution Plan

1. Fix provider/model configuration and pin reviewed package versions; acceptance: Pi loads providers and `/model` shows only approved targets.
2. Define routes: `fast` (classification/read-only), `builder` (Qwen coder or current coding equivalent), `deep-review` (different family/provider), and `frontier-manual` (coordinator/approval/security/merge). Acceptance: no route crosses its allowed tier.
3. Run `pi-auto-router` in shadow mode for at least 20 representative parcels; capture target, fallback, cost, latency, tool errors, and outcome in Foreman receipts.
4. Gate route selection on Foreman role, risk class, data classification, budget, and approval state; acceptance: a Pi route cannot elevate any of those fields.
5. Sync the packaged Foreman with the standalone explicit-root, role-authority, worker-envelope, and identity-boundary changes before enforcement.

## Rules of Engagement

Pi may optimize execution; Foreman remains the policy/control plane. Reviewers/verifiers for elevated work should use a distinct model family/provider from the builder. Fail closed on disallowed provider/data combinations, route-tier crossings, missing receipts, or budget exhaustion.
