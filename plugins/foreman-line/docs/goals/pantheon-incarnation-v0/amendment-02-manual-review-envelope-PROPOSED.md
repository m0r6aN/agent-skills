# Proposed Amendment 02 — SA4-M1, one human-started Claude Code review

**PROPOSED — NOT APPROVED; DO NOT SEND UNDER THIS AMENDMENT YET.**
Prepared: 2026-10-19T00:18:57Z. Changes only this plan review's operational SA4/REVIEW-002 envelope. Does not edit the frozen charter or Amendment 01, D1–D17, implementation scope, exit criteria, future routing policy or human ratification/dispatch/merge gates.

## Why the existing manual approval is not executable as fully specified

The already accepted human-mediated exception replaces automated launch/receipt checks, but retains provable <=20,000 model-visible input tokens, <=4,000 all-output tokens, 10-minute timeout and $5 worst-case monetary reservation. The available Claude Code 2.1.303 supports useful controls but does not provide a documented pre-send count/cap for the entire request including service wrappers; output setting applies to “most requests”; local cancellation cannot attest remote termination; `--max-budget-usd` is a client-side estimate checked after responses and may overshoot. An open authenticated terminal does not resolve these facts. The web UI has even fewer precise controls and is not selected for this proposal.

## Exact proposed replacement — one decision

> **SA4-M1.** For this goal's initial plan review only, authorize Clinton to start **one fresh foreground human-mediated Claude Code 2.1.303 invocation**, using the existing first-party **Claude Max** login and exact model **`claude-opus-5-5`**, with the fixed no-tools runbook. Do not resume either open conversation. No Grok fallback, regeneration, additional prompt, retry or second review attempt under this exception.
>
> Replace the unprovable 20,000-total-input-token preflight guarantee with an exact local input bound: only the unchanged **70,020-byte** `REVIEW-PACKET.md` (SHA-256 `0e509c4839c88f771b66dccb168c4618eb3ce19461eb614ba0a18a35d8900b67`) plus the runbook's neutral system prompt of at most **1,000 UTF-8 bytes**. Provider/client protocol and safety wrappers are not countable in advance and are explicitly accepted as unmeasured; no coordinator history, prior reviews, skills, repository context or other evidence may be added. Do not truncate or summarize the ratified plan to fit.
>
> Set the supported output request limit **`CLAUDE_CODE_MAX_OUTPUT_TOKENS=4000`**, request one concise response, disable application retries/nonstreaming and refusal fallbacks, and cap tool turns at one while exposing no tools. Accept this as a configured request bound/target, **not an authenticated guarantee that every hidden/recovery/reasoning token stays below 4,000**. Preserve actual returned usage or mark it unknown; any excess, additional request, model switch or other deviation must be retained and adjudicated, never called compliant by assertion. No prompt/output may authorize tools or implementation.
>
> Replace provider-side 10-minute termination proof with a **600-second local foreground deadline**: terminate the owned invocation at that deadline, allow up to **5 seconds local cleanup**, retain partial output and mark remote completion/usage uncertain if unconfirmed. Do not retry or declare a timeout successful. The timer does not prove when remote computation stops.
>
> Keep the **USD 5 aggregate incremental-charge ceiling**, but for this one attempt require **zero new paid usage**: existing Max included allowance only; owner verifies **usage credits/extra usage OFF** before launch, no top-up/auto-reload/API-key/cloud/gateway/account switch or plan upgrade, fast mode disabled. The already-paid Max subscription fee is explicitly outside this incremental cap. `--max-budget-usd 1.00` is a secondary estimated-spend guard with headroom, not the monetary guarantee; the guarantee relied on is provider-side denial of paid extra usage. If that account condition cannot be established, do not send. Shared subscription quota may be consumed; quota is not dollars.
>
> Authorize only the fixed internal credential-free architecture/plan packet to that first-party Max consumer account with **model-improvement training OFF**, accepting the documented **standard 30-day Claude Code retention** and applicable safety/legal exceptions, **not ZDR**. No feedback/share/debug transcript uploads, public links, private source, credential files or unrelated history. Do not inherit any other goal's privacy exception.
>
> Human checks of account/privacy settings, displayed identity, lack of ambient context, start/stop times and copied output are **human-reported observations**. CLI flags are client controls; provider terms/settings are provider commitments, not machine-issued Foreman attestations. Retain raw response/usage/init/error records privately, capture exact identity and deviations, and require factual checking plus explicit findings triage before review closure. An incomplete or disputed result remains held. No fabricated Foreman route/launch receipt or independent acceptance of the launcher.

## Preserved boundaries

- No launcher refusal or shared routing/validator change; DEP-FL-001 remains open.
- No coordinator-automated provider send or takeover of the already-open sessions. Exact manual command is in the adjacent Pantheon runbook, contingent on this approval.
- No broader model/data/provider/spending/installation/publication permission. Grok remains an earlier approved candidate but is not part of this single-attempt amendment.
- No delegation of human-only ratification, no automatic acceptance of findings, no parcel shaping/dispatch/merge/commissioning before applicable gates.
- Additional requests, unknown charges, missing required controls, unexpected managed hooks/context/tools/model/provider or network recipient cause a stop/report, not improvisation.

## Owner decision requested

**Approve SA4-M1 as written**, or reject it and retain the current manual numeric guarantees (then use a separately qualified interface that actually meets them or await upstream automation). This is one specific amendment decision, not a renewed charter, SA4 budget or blanket-permission request.

## Evidence

- Local CLI `claude --version` / `--help`: Claude Code 2.1.303, safe mode, no tools, strict MCP, no persistence, output JSON, estimated dollar cap. Safe filtered `claude auth status --json`: loggedIn true, authMethod claude.ai, apiProvider firstParty, subscriptionType max; account usage-credit/training settings still uninspected.
- Official CLI reference: https://code.claude.com/docs/en/cli-reference — cap is estimated, can overshoot; safe mode retains managed policy.
- Environment variables: https://code.claude.com/docs/en/env-vars — output request setting, retries, disabling refusal/nonstreaming fallback, fast mode and nonessential traffic.
- Budget headroom: https://code.claude.com/docs/en/agent-sdk/agent-loop#budget-headroom — checks occur after a model response; no hard billing guarantee.
- Data usage: https://code.claude.com/docs/en/data-usage — Max consumer training choice and 30-day retention when model improvement is off.
- Usage credits: https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans — Settings > Usage disables paid usage credits; then included allowance only.

Sources consulted 2026-10-19; documentation is not proof of this account's actual settings or exact wire behavior. No review submission, provider inference, reservation or reviewer spend occurred in preparing this proposal.
