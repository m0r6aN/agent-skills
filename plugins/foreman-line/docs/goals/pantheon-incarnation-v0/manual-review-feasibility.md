# Manual review feasibility — installed Claude Code / Grok terminals

**Historical feasibility assessment.** Current decision: SA4-M1 approved with coordinator execution; all three account/policy observations owner-confirmed. See [review-authorization.md](review-authorization.md) and [RESUME.md](RESUME.md). The original guarantee limitations remain accurate; the approved scoped replacement is not pending. Human-start-only wording and uninspected-settings statements below describe the earlier measurement, not a new restriction or request to repeat confirmations.

Updated 2026-10-19T00:24:13Z. **Conclusion: useful documented manual CLI controls exist, but the original retained guarantees are NOT established. SA4-M1 is one proposed, unapproved amendment; no review send.**

## Authority and route

REVIEW-002 already accepts human-mediated transport instead of automatic launch/receipt verification; no new generic permission is requested. Owner subsequently reported authenticated Claude/Grok terminal sessions. Those conversations are not resumed or read. New independent review must not inherit their history. Preferred interface is a new human-started foreground Claude Code print invocation, not UI automation or a raw automatic Foreman bypass.

## Observed locally without inference

- `claude --version`: **2.1.303**; help exposes `--safe-mode`, no tools, strict MCP, no persistence, output JSON and estimated dollar cap. `--bare` would discard OAuth and is not selected.
- Safe filtered native `claude auth status --json`: **loggedIn=true, authMethod=claude.ai, apiProvider=firstParty, subscriptionType=max**. Account usage-credit/training states are **not inspected/verified**. An initial Windows command-wrapper metadata call failed; direct native binary metadata succeeded. Neither was an inference/authentication failure measurement.
- `grok --version`: **1.0.62**; help supports file/single prompt, tools and turn selection, but no displayed dollar/output-token cap. Grok authentication is owner-reported; no config/leader/session history read, provider probe or inference. Prefer the documented Claude controls; no automatic provider fallback.
- GNU `timeout` **8.32** is installed. Presence is not a successful native-Windows process-tree/remote-cancellation test.
- Fixed packet still **70,020 bytes**, original SHA-256 and all six input fingerprints unchanged. This is not a native token count. Frozen charter/amendment blobs unchanged.

## Retained guarantee versus actual interface

| Retained requirement | Finding | Disposition |
|---|---|---|
| <=20,000 ALL input tokens established before send | No supported full-request pre-send count/gate established; packet wrappers/client/server safety context unknown | Not met as a guarantee; propose fixed exact input bytes + neutral 476-byte system prompt in SA4-M1 |
| <=4,000 ALL output/reasoning tokens enforced | Supported `CLAUDE_CODE_MAX_OUTPUT_TOKENS=4000`; docs say most requests; adaptive reasoning cannot be disabled or given a fixed `MAX_THINKING_TOKENS` budget on Opus 5.5 | Useful configured request limit; cannot certify original all-output guarantee. Proposed bounded one-attempt/usage-uncertainty disposition |
| 10-minute timeout / known remote completion | Local supervisor available; server-side completion after interruption is not observable from a process kill | Proposed 600s local deadline + <=5s cleanup; remote uncertainty retained and no retry |
| $5 worst-case aggregate exposure / reservation | `--max-budget-usd` is post-response client estimate and can overshoot; Max login alone does not prove no extra billing | Retain $5 incremental cap; proposed one attempt uses only existing Max allowance with paid usage credits OFF and fast mode disabled; account state must be observed before send |
| Internal-data controls | Max is consumer auth, not commercial API/ZDR; official Code docs describe training opt-out and standard 30-day retention | Proposed packet-specific non-ZDR Max disposition with training OFF, no feedback/share; do not inherit OPMEM policy |
| No tools/history / exact different-family model | Supported safe mode, empty tools/MCP, no skills/Chrome, explicit model and no continuation; managed policy residual | Documented client controls, subject to managed-policy preflight and returned metadata. Not an OS sandbox or authentic route receipt |

**Executable under existing retained guarantees? No.** A second general approval, authenticated terminal, CLI install or prompt instruction cannot make those guarantees true. A reviewed interface that actually proves them would be needed if the owner rejects the specific amendment.

**Executable procedure after SA4-M1 approval and stated account/policy preflight?** Documented human workflow prepared; no live acceptance test claimed. Exact steps, command and control-strength matrix: `D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review/CLAUDE-CODE-MANUAL-RUNBOOK.md`. Its command is deliberately gated by human confirmation and has NOT been run. Any preflight failure stops without sending.

## One proposed decision

`amendment-02-manual-review-envelope-PROPOSED.md` / **SA4-M1**, one fresh exact-model human-started invocation, fixed original packet, configured 4k output, local deadline, included-Max-only incremental charge protection and specific consumer data handling. No retry/Grok fallback under the amendment; no global policy or launcher modification. Await owner approval of this one text; no silent adoption from this report or the prior blanket grant.

## Independently authorized work completed in this continuation

1. Recorded accepted upstream dependency DEP-FL-001 with existing accountable owner, unconfirmed implementation assignee, source scope mismatch and completion-evidence contract (`upstream-dependencies.md`). No upstream assignment/source/remote ticket mutation.
2. Checked actual installed Claude/Grok help/version and redacted Claude account-mode metadata; no terminal conversation access.
3. Researched first-party public control/privacy/budget docs; no internal packet/source transmitted in searches or page fetches.
4. Verified packet/source integrity and unchanged frozen plan blobs.
5. Prepared exact operator runbook and one amendment. Checked two Bash blocks with `bash -n` ONLY, parsed inline JSON and verified the neutral system prompt is **476 UTF-8 bytes**. No model command executed; these are syntax/integrity checks, not provider acceptance, isolation or billing proof.
6. Updated carryover/gate records. No first-parcel shaping/dispatch, implementation, provider review, new account/installation, remote publication or launcher repair undertaken. These actions do not claim PIN-P0/P0D completion.

## Public evidence consulted 2026-10-19

- https://code.claude.com/docs/en/cli-reference — safe mode (managed-policy residual), tools, strict MCP, fresh print session and estimated budget.
- https://code.claude.com/docs/en/env-vars — output limit applies to most requests; retries/nonstreaming/refusal fallback, fast mode, nonessential traffic; Opus 5.5 thinking residual.
- https://code.claude.com/docs/en/agent-sdk/agent-loop#budget-headroom — cap checked after responses, overshoot possible.
- https://code.claude.com/docs/en/costs — subscription included usage versus list-price cost estimate.
- https://code.claude.com/docs/en/data-usage — consumer Max opt-in model improvement; 30 days when off versus 5 years when on, nonessential traffic/feedback handling.
- https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans — disabling usage credits in Settings > Usage restricts to included usage.
- Web alternative researched but NOT selected: https://support.claude.com/en/articles/12260368-use-incognito-chats — no chat history/memory does not remove personal preferences; standard retention is not ZDR. https://support.claude.com/en/articles/16049681-why-claude-switched-models-in-your-conversation-with-opus-5-or-opus-5-5 — automatic switching is a separate feature, not a reason to permit unapproved fallback.

Documentation is evidence of supported controls/policies, not inspection of the owner's account settings or actual provider request. **Review attempts/reservations/reviewer spend remain 0; $5 unspent.** No loop, worker, wakeup, ownership transfer or ratification change.
