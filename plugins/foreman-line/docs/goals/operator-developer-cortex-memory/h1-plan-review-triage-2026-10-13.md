# OPMEM-H1 plan review and factual-lint disposition

Coordinator: `01a1358d-711a-7345-8874-901c5e2b50e3`. Owner approved narrow remediation; no locked OPMEM architecture decision changes.

Fresh reviewer `OPMEM-H1-plan-A-01a1358d`, requested/observed `anthropic/claude-fable-5`, high thinking, read-only native Pi CLI, seven tool calls, clean Gateway worktree at base `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`, exit0 / stopReason stop. Verdict **APPROVE-WITH-FIXES**; no re-shaping blockers. Raw transcript and exact extracted verdict: `D:/Repos/opmem-dispatch-01a1358d/h1-plan-review.{jsonl,txt}`. Usage-reported cost USD0.6656; not a reconciled invoice.

| Finding | Disposition | Applied before builder GO |
|---|---|---|
| F1 required: third project omitted from audit/graph scope | fix | AC2 solution-level audit; AC3 all three project graphs; IntegrationTests manifest byte-identical |
| F2 required: project versus whole-repository baseline ambiguity | fix | 421/422 explicitly Tests project only, Windows mock IntegrationTests outcomes separately recorded, Linux integration excluded/not evidence |
| F3 optional: mutation venue | fix | AC5 owned disposable copy outside parcel, never mutate parcel source |
| F4 optional: new-file versus modification accounting | fix | AC1 precisely two modified plus one added, no extra tracked paths |

## Additional integration baseline (not a green compatibility claim)

Fixture and factory inspected before execution. Child environment unset ANTHROPIC_API_KEY, OPENAI_API_KEY, KEON_IT_CORTEX_URL, KEON_IT_COLLECTIVE_PROJECT; no credential values inspected, no live Collective launched, local owned mocks only. Existing suite at unchanged base: **3 passed / 5 failed / 2 skipped**, total10. Evidence `D:/Repos/opmem-dispatch-01a1358d/h1-integration-baseline.log` and `h1-integration-baseline-results/h1-integration-baseline.trx`.

Five failures are existing Cortex authorization-expectation tests: `Cortex_memory_write_without_content_is_rejected`, `Cortex_memory_search_returns_results_without_runtime_decide`, `Cortex_memory_write_returns_shard_id_with_full_receipt_chain`, `Cortex_write_via_mcp_protocol_surface_returns_structured_content`, `Runtime_tier_token_cannot_invoke_cortex_write`. Failures include Forbidden/MCP_SCOPE_DENIED instead of previous expected success/DENIED_ENTITLEMENT. Two real-provider tests skipped. No inference from this record about deployed services or full OPMEM readiness. H1 must preserve these exact identities/outcomes; remediation of those fixtures/authorization behavior is outside H1. A changed integration outcome stops for review.

All421 Tests project baseline tests passed separately. Added verification does not expand Allowed Files or owner-authorized dependency scope. Active spec is promoted only after this plan disposition, owner authorization, actual self-check and factual lint. Re-run `h1-shaping-check.mjs` passed (zero errors; src/tests vocabulary warnings remain advisory). No fabricated Jira or registration receipt. H1 implementation and fresh dual code reviews remain pending.
