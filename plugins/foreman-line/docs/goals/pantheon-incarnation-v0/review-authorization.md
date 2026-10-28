# Current one-off review authorization — SA4-M1 with coordinator execution

Recorded 2026-10-19T01:09:08Z. Applies only to the initial independent plan review for `pantheon-incarnation-v0`. Decision references: REVIEW-001/002/003/004 and PREFLIGHT-001 in [gate-record.md](gate-record.md).

**Disposition: SA4-M1 approved with an explicit coordinator-execution override; three required account/policy observations confirmed.** This is not approval of the original proposal as written. Preserve [Amendment 02's original proposal](amendment-02-manual-review-envelope-PROPOSED.md); its human-start-only clause, coordinator-send prohibition, and pending-approval labels are historical and superseded for this one attempt by the owner directive below.

## Evidence and its limits

Preparation chat `01a14ead-21c6-7af2-974d-64e3ff1c2180`, assistant message `msg_03588180c83f756a016ad56688e0a88190bca4e34ed4408f7f` in turn `01a15197-5fbc-78b3-a949-c1a7a6595c92`, offered this exact directive:

> I approve SA4-M1 with one explicit change: the coordinator may launch and supervise the single fresh Claude Code review invocation, using my existing first-party Max authentication, once I confirm the required account settings.
>
> This supersedes the human-start-only restriction and prohibition on coordinator execution for this one attempt. Record it as a separately authorized, one-off CLI review procedure—not an admitted production Foreman launch.
>
> Retain the fixed packet, exact model, disabled tools, configured output limit, local deadline, included-usage-only condition, privacy terms, raw evidence capture, and prohibition on retries or fallback. Preserve all existing conversations and production launcher safeguards.
>
> Complete the remaining local preparation autonomously. If my account-setting confirmation is still missing, ask only for those observations. After confirmation, execute the one attempt and return the review with findings triage.

The owner's next message began **"I sent that, thanks."** User message `01a1519a-7e9d-73a1-bb94-79fe6a925f94`, turn `01a1519a-7dee-70e2-a6f8-0be92a7c254c`, started `2026-10-19T00:40:41Z`. This records the owner's report of sending the immediately preceding directive. It is not a new instruction supplied by an attachment or an approval invented from an assistant suggestion alone. The saved Pi transcript ends its substantive exchange before that report and does not contain the later approval; do not claim the directive was recovered verbatim as a user message in that transcript. Minimal source evidence: [review-approval-evidence.json](review-approval-evidence.json).

In this preparation chat the owner then answered **"All three confirmed"** to the question naming Max paid extra usage/credits OFF, model improvement OFF, and absence of managed policy adding tools/hooks/context/another provider. He repeated that confirmation and reported USD 100 API credits. Record these as human-observed facts, not Foreman attestations. The unspecified API-credit balance neither changes the included-Max route nor expands this review's budget or fallback authority.

## Exact retained envelope

| Control | Authorized requirement |
|---|---|
| Executor | Resumed coordinator may start and supervise one fresh invocation. Human operation remains optional. Do not take over either existing Claude/Grok conversation. |
| Reviewer | Native Claude Code **2.1.303**, existing first-party **Max** authentication, exact **`claude-opus-5-5`**. Preserve different-family independence from the coordinator/plan author; do not switch to an Anthropic coordinator and claim an Anthropic review is cross-family. |
| Input | Only the unchanged **70,020-byte** `REVIEW-PACKET.md`, SHA-256 **`0e509c4839c88f771b66dccb168c4618eb3ce19461eb614ba0a18a35d8900b67`**, plus the runbook's neutral system prompt, at most **1,000 UTF-8 bytes** (prepared text: 476). No repair narrative, prior reviews, coordinator history, repository files or credentials. Unmeasured client/provider wrappers are accepted as specified in M1. |
| Context/tools | Fresh empty working directory, safe mode, disabled tools, strict empty MCP, disabled slash commands/Chrome/hooks, no continuation/resume/session persistence; retain the exact controls from the runbook. Check effective managed policy without bypassing it. |
| Requests/output | One invocation only. Configure `CLAUDE_CODE_MAX_OUTPUT_TOKENS=4000`, no application retries, nonstreaming/refusal fallbacks disabled, one turn with no tools. No regeneration, additional prompt, Grok fallback or replacement attempt. Record hidden/request behavior and actual usage as observed or unknown. Configured limits do not establish an all-token guarantee. |
| Deadline | Supervise the owned process with a **600-second** local deadline and up to **5 seconds** cleanup. Preserve partial output; an interruption/unknown remote completion is not success or retry authority. Never terminate unrelated open sessions. |
| Billing | **Included Max usage only; zero new paid usage for this attempt.** Paid extra usage/credits OFF confirmed by owner. Keep original USD 5 aggregate incremental-charge ceiling. No API-key/cloud/gateway/provider/account switch, top-up, fast mode or plan upgrade. `--max-budget-usd 1.00` is only an additional estimate guard. No claim it independently enforces a hard billing ceiling. |
| Data handling | Model improvement OFF confirmed; accepted standard 30-day retention with applicable exceptions as recorded in M1, not ZDR. Only the fixed internal architecture packet. No public sharing, feedback/debug uploads or unrelated files. |
| Evidence | Durable attempt record before sending; exact packet/command/runtime identities; raw response/init/usage/errors; start/end/exit/deadline observations; deviations and unresolved remote usage retained. Model identity is provider/CLI-reported, not independent issuer attestation. |
| Acceptance | Real independent response, factual checks and explicit findings triage. Advisory review cannot ratify its own changes or the launcher. Existing human ratification and subsequent parcel/merge gates remain. |

## Coordinator continuation

1. Reconcile attempts before dispatch as described in [RESUME.md](RESUME.md). Preparation records currently show no review; this is not permission to replay any subsequently discovered uncertain request.
2. Check the packet, native version/executable, supported options and filtered first-party Max authentication metadata. Do not read/export credentials or print billing/account identifiers. Retain the owner's three confirmations; request an updated observation only if there is a concrete contradiction or material change.
3. Prepare the one-off coordinator command using the [existing runbook](D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review/CLAUDE-CODE-MANUAL-RUNBOOK.md) and the controls above. The runbook's human `read ... SEND-ONCE` step applies to its optional human-operated command, not the authorized coordinator variant. A coordinator variant must perform the same preflight, durable one-attempt claim, owned-process supervision and raw-result capture; it may call the native executable directly without an interactive confirmation. Local preparation is already authorized. Do not remove a shared tool's TTY guard to repurpose it globally.
4. Once those local checks pass, execute one attempt and triage the actual result. No new generic permission, new SA4 budget approval, production route receipt or account-setting question is required for this separate one-off procedure. Do not forge an admission receipt. If a local check fails, report that concrete failure and complete independent preparation; do not label the existing owner approval missing.

The existing [review-tools core](D:/Repos/agent-skills/plugins/foreman-line/pi-package/review-tools/review-core.mjs) supplies tested local supervision primitives. Its tests establish local behavior only; the `manual-claude.mjs` command remains human-operated. Neither artifact is an admitted Foreman production launcher. DEP-FL-001 stays OPEN until its separate completion requirements are actually met.
