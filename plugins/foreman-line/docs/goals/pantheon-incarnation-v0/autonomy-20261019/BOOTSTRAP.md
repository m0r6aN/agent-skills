# Finite bootstrap and useful review contract

## Why there is a bootstrap exception

The production Foreman terminal returns `BOUND_REFUSED`; recovery admission returns `PREREQUISITE_UNAVAILABLE`; the existing Runtime API has explicit launch blockers. The adapter cannot be its own approval path. OM-PAN-001 therefore proposes a **finite, visibly separate bootstrap grant**, not an implied general bypass.

After ratification, at most eight fresh native builder sessions may prepare P01–P05 in isolated named local worktrees under the current supported Codex host. They receive exact allowed files, no production/provider credentials and no account/remote effects. Existing native session access is used without new API accounts or upgrades. Rework consumes an unused session within the eight-session total or continues the same scoped builder; exhaustion raises one exception. This native preparation is not counted as Runtime-governed proof. Deterministic local compilation/testing is permitted. Bootstrap repository writes/commits and ordinary reviewed merges are explicitly scoped to these prerequisites.

Independent bootstrap reviews use the **official Anthropic Messages API through an existing supported native HTTPS client (`curl.exe`)**, not the new Foreman terminal under review. The owner ratifies this distinct route, selected account, internal data envelope, <=16 requests / <=USD 25 aggregate (inside USD 75), combined token limits and uncertainty rules. First use is a small synthetic direct-sender qualification; later calls provide substantive plan and bootstrap implementation reviews. Architecture changes need two independent reviews. The nominal queue uses one qualification, one plan review and two reviews for each of P01–P05: twelve requests, leaving four within the bootstrap call cap for bounded recovery. The monetary cap remains independently binding. Do not silently expand bootstrap if either cap is exhausted.

The native transport must have explicit `--disable` config loading, `--retry 0`, no `--location`, `--max-redirs 0`, `--proto =https`, exact hostname/path, 30s connect/600s total timeout, no verbose/trace output, fixed request file and raw output file. Supply the API key through stdin configuration from the named local binding; never on command line, in saved config, environment dumps or logs. Use OS TLS validation. No proxy/account substitution or auth refresh. Command construction is a deterministic reviewed helper with fake-local transport tests before use, not a pasted command containing a key. HTTP errors/drop/truncation all consume/hold the local claim; no hidden SDK exists to continue the model.

The prepared prototype currently has **no live endpoint factory**. Its test runner is deliberately restricted to loopback and a fixed fake credential. P00 must adapt/qualify the supported native transport under the new grant, retaining its one-send semantics and raw evidence; P04/P05 supply the Runtime integration. Do not pass arbitrary JSON as a trusted Runtime permit to make a prototype “live.”

Bootstrap authority ends as soon as P05 readiness passes, on 16 calls/8 sessions/USD 25/14 days, or on revocation. Any unused bootstrap allowance remains in the overall pool but cannot reopen the old route. All subsequent builder/provider/merge effects require Runtime. One failed bootstrap attempt with unknown delivery holds its full reservation; safe independent work may proceed but the same request is never duplicated.

## Account qualification state and remaining actions

Read-only Console access was authorized and completed in this planning session. Morgan Findings LLC is visibly signed in. Billing shows purchased credits $49.92 and promotional credits $100 applicable to API/Agent SDK/Batch/Playground/Managed Agents, expiring 2026-11-16; dashboard aggregate was $149.94 (different display snapshots, not an accounting reconciliation). Organization default retention is ON/30 days; Development Partner Program offers Join, feedback switch is off, Code metrics is on. Default workspace exists with six key records; values were neither displayed nor acquired. Opus 5.5 and Sonnet 5.5 quota rows are visible; this is account UI evidence, not successful inference or a credential entitlement test. Auto-reload is ON and must be dispositioned as in MANDATE.md.

Remaining non-inference steps under mandate: owner supplies an existing Default-workspace secret through a named local secure binding (recommended process binding `ANTHROPIC_API_KEY` for the trusted broker only); establish its nonsecret key/workspace reference and read-only supported metadata result; verify account policy/credit freshness, auto-reload OFF, and exact model availability. No broad secret search, Max-token extraction, key creation, new service account or privilege grant is authorized. If a new credential is actually necessary, batch that genuine access exception once. Console cookies are never used as an undocumented API transport.

Only after ratification and qualification: one bounded synthetic inference validates actual endpoint/model/usage/stop behavior; then one new independent plan review reads the revised package plus preserved decisions in a newly frozen packet. The old 70,020-byte packet/request stays historical; neither REVIEW-004 nor SA4-R1 R2 is replayed. The new purpose and changed packet require the new OM-PAN-001 grant. A mock transport pass, quota table or PONG does not close the plan-review gate.

## Review result contract (application-level)

```json
{
  "schema": "pantheon.review-result.v1",
  "reviewId": "unique durable id",
  "artifact": {"manifestSha256": "...", "sourceHead": "..."},
  "provenance": {
    "reviewerSessionId": "full id", "authorSessionIds": ["full id"],
    "provider": "anthropic", "model": "claude-opus-5-5",
    "accountBindingRef": "nonsecret reference", "providerRequestId": "...",
    "runtimeDecisionRef": "... or explicit bootstrap grant ref",
    "attemptId": "...", "rawResponseSha256": "...",
    "independencePolicy": "OM-PAN-001", "sameVendorAsBuilder": true
  },
  "reviewText": "Substantive assessment with evidence, coverage and limitations.",
  "verdict": "pass | changes_required | blocked",
  "findings": [
    {"id": "R1", "severity": "critical | high | medium | low | info",
     "claim": "...", "evidence": ["file:line or artifact locator"],
     "requiredChange": "...", "acceptanceCheck": "..."}
  ],
  "coverage": ["required review focus"],
  "limitations": ["..."]
}
```

Transport/provider IDs are injected by the trusted capture layer from actual records, never trusted solely because the model repeated them. Model output supplies review text/verdict/findings; capture binds it to input/source/raw result. JSON parsing alone is insufficient: verify nonempty substantive explanation, every required focus addressed, evidence locators resolve to the pinned head, findings have actionable closure checks, no author/reviewer identity overlap, and no high/critical unresolved finding behind a `pass`. Zero findings is valid only with a substantive coverage explanation. Thinking-only content is never repurposed as review text. Empty/truncated/timeout/refusal output is a failed attempt even when token usage is nonzero.

A complete response with `changes_required` is a useful completed review, not a failed transport. Request builder rework, independently rerun relevant tests, and request fresh review of the new head. A complete but malformed review may be deterministically extracted only if the full substantive text and exact verdict/findings are unambiguous and preserved; never invent missing fields/findings. Otherwise consume a bounded new review attempt, not parser relaxation to green.

Provider usage retains request and cumulative event scopes. Do not sum repeated streaming totals. Record visible answer length separately from billed reasoning/output. Unknown final usage remains held; a local timer or HTTP close cannot certify remote cancellation. Delivery unknown means no automatic retry or cross-provider fallback. Positive no-send evidence may release a reservation; complete usage permits provisional pricing with declared uncertainty, not an invented invoice.

## Exit from bootstrap

Need: substantive independent amended-plan review and triage; offline direct-sender tests; authenticated live qualification; two independent reviews of the security-sensitive Runtime/admission/terminal composition; startup refusal/negative tests; and a real Runtime-admitted synthetic harmless effect with durable provenance. Only then activate normal queue dispatch. This is a finite sequence with explicit owners and caps, not an approval loop or acceptance by self-authored receipts.
