# Starting-point evidence and blockers

Inspection date: 2026-10-19. Planning session `01a15424-1fd5-77a2-a73a-d92a60a5de34`. All observations below are scoped; no provider API/CLI inference or paid review was launched. Native planning assistants performed bounded source inventory and offline prototype preparation. Prototype tests and the container probe are local deterministic evidence only.

## Canonical locations

| Surface | Located artifact / observed state |
|---|---|
| Canonical Pantheon goal | `D:/Repos/agent-skills/plugins/foreman-line/docs/goals/pantheon-incarnation-v0/`; start file `resume-20261019-01a15394.md` exists here, not in Pantheon cwd |
| Foreman source | `D:/Repos/agent-skills/plugins/foreman-line`; repository HEAD `64fb8949bf5134f96fda02df0d4f52ac291a6138`, origin `https://github.com/m0r6aN/agent-skills.git`. The goal directory is currently untracked; existing goal records and inspected source are pinned by byte hashes. Working-source observations are not a clean-release attestation. |
| Other Foreman copy | `D:/Repos/foreman-line` is not a Git root and lacks newer packages. Installed plugin cache is distribution, not canonical editable source. |
| Pantheon workspace | `D:/Repos/Pantheon` contains docs/audit/handoff, no Git root; existing remote in records is `https://github.com/m0r6aN/pantheon26.git`. No initialization/clone/publication performed. |
| Review evidence | `D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review/authorized-attempt-1/`; packet, request, replacement preparation and disposition are in its parent. |
| Runtime source | `D:/Repos/keon-omega/keon-systems`, HEAD `2b6c75536f50f125155ee697446cec89f70f2fec` |
| Gateway source | `D:/Repos/keon-omega/keon-mcp-gateway`, HEAD `d6376fd024d43be7ff458af675c646ae93c52492` |
| Cortex source | `D:/Repos/keon-omega/keon-cortex`, HEAD `684785f220c066e8686e160eec2611c727582a00` |
| Noncanonical reference copies | `D:/Repos/Keon.Sdks`, `D:/Repos/keon-cortex-mcp-bridge` are not Git roots at those paths; inspect provenance before editing as source of record. |

Read-only GitHub qualification: authenticated `gh` actor `m0r6aN` has ADMIN visibility to the named private Pantheon, Foreman, Runtime, Gateway and Cortex repositories. Pantheon has no heads/default branch and its ruleset list returned empty; the other repositories report `main`. No repository was cloned or changed. This is not permission to bypass any effective merge rule; recheck current rules and head at merge.

## Claim reconciliation

| Latest reported claim | Verification and disposition |
|---|---|
| Authorized review consumed | Confirmed by REVIEW-004/005, immutable attempt claim, invocation/result and ATTEMPT-1-DISPOSITION. One operator invocation ran 2026-10-19T01:20:13.566Z–01:23:10.983Z. No new allowance inferred. |
| Four internal requests, three continuations, no text/verdict | Parsed raw `response.jsonl` metadata again: four distinct assistant message IDs; three `isSynthetic` user continuation events; zero assistant text blocks; final `error_max_budget_usd`, `is_error=true`, `num_turns=4`, `stop_reason=max_tokens`, `terminal_reason=budget_exhausted`. This is an operational failure with no design verdict. |
| Integrity passed | All seven manifest files matched byte counts/SHA-256 again. Raw response is 98,339 bytes, SHA-256 `0dc1c71a9b91f8d90b42bb4ef9cd6d8b2c2bd3e2021094fca983e44e8bd22808`. Existing validator passed exact 70,020-byte packet, six source fingerprints/embeddings, two frozen Git blob identities, request hash, Bash syntax and inline JSON. |
| Nine synthetic tests passed | Re-ran `node --test .../pi-package/review-tools/review.test.mjs`: 9 pass, 0 fail. These supervise synthetic subprocesses and validate local capture; they do not qualify provider behavior. |
| Shaping held; R2 unapproved | Confirmed current RESUME/gate-record and `amendment-03-direct-api-review-PROPOSED.md`. New user directive authorizes this reconciliation/package preparation, not replay or paid validation. Actual parcel promotion/dispatch remains held pending the consolidated mandate and required evidence. |
| Replacement body prepared | Reverified 71,395 bytes, SHA-256 `9cfdfacd1da9395bc4b911df6eb217706931b994a1984d70cb38ce60d3edcbbc`; exact `claude-opus-5-5`, 32,768 max tokens, empty tools, one content equal to old packet. Integrity is not send authority. |
| Account qualification incomplete | Process name-only check still found no `ANTHROPIC_API_KEY`. Read-only Console evidence now improves account qualification (below); no credential binding or live API test exists. |
| Direct-sender tests incomplete | Historical R2 prerequisite was incomplete. This package now adds a new offline-only prototype with 44 passing deterministic tests; it has no live entry point. Native HTTPS/account/live qualification and admitted integration still remain. Do not mark old R2 approved or live-ready from these tests. |
| `01a15394…` pending succession | Confirmed full IDs in RESUME-003 and resume file. Retained owner is `01a151ad-3cea-70cf-9dfc-233a9da3dd00`; details in OWNERSHIP.md. No transfer performed during planning. |
| Older Pi exited / monitor paused | Exact session `01a14d11-b88a-70f8-8971-76c25d51c2e2` and monitor state/automation confirm exit and PAUSED. It is unrelated to current Pantheon custody. Newer Pantheon watcher remains ACTIVE against retained owner. |

## Failure diagnosis — supported conclusion and limits

Authorization was sufficient for the one consumed native invocation; lack of a repeated human approval did not cause its failure. Native CLI 2.1.303 launched, returned exact model, tools/MCP empty, no spawned subagent, and nonzero result in 177.417 seconds. Stderr was empty; the local 600-second timeout did not fire. This is not evidence of an initial transport/authentication refusal.

The observed failure path is output-budget exhaustion with client-generated continuations: configured 4,000 tokens/one-turn/zero retry controls did not prevent four reported requests and 16K aggregate thinking output without a visible answer. Result scope reports 12K output, model aggregate 16K; preserve both. Final list-price estimate is $1.095328 with `costBasis=list`, not invoiced usage. No overage was reported. The original $5 remains unavailable uncertainty, not a provider reservation or confirmed charge.

Parser quarantine of extra telemetry is separate from the absence of text. Relaxing it cannot recover a verdict. No evidence establishes a provider bug, malicious policy injection, exhausted prepaid Anthropic API funds or missing Max authentication as the cause. Native internal retries/continuation behavior and provider-internal computation are visible only to the extent reported. Do not turn reasoning into a review or call the architecture rejected.

EX-01–EX-03 remain adapter/result failures; EX-04 retains billing uncertainty; EX-05's telemetry-only acceptance remains limited. DEP-FL-001 stays open until an accepted installed composition performs a useful admitted review with authentic custody. Some older `upstream-dependencies.md`/proposal paragraphs still say zero attempts/unspent; these are stale historical preparation language. Current REVIEW-005/RESUME-003 controls. The activation amendment must correct current summaries while preserving historical records.

## New read-only account evidence

After the user authorized an existing Console session and signed in, UI observations showed:

- Selected organization **Morgan Findings LLC**; existing **Default** workspace (six key records) and separate Claude Code workspace. No key page/value or credential file was read.
- Billing: purchased $49.92, promotional $100; promotional row applies to API, Agent SDK, Batch API, Playground and Managed Agents, expiry 2026-11-16. Dashboard aggregate $149.94 differs slightly from component sum; do not reconcile that difference by invention.
- Dashboard: monthly usage $0.08 of $75 limit, reset Nov 1. This is account UI data, not a Pantheon-specific invoice or a new allowance.
- Auto-reload **ON**, contradicting old R2's no-auto-reload condition. No settings were changed. New mandate proposes OFF before paid calls; this affects other API use and is a real owner choice.
- Data retention organization default **ON, 30 days**; Development Partner Program offered **Join**; user feedback switch off; Code metrics logging on. These do not prove every contractual exception or per-key policy. Preserve standard API policy caveats.
- Rate-limit UI lists Opus 5.5 and Sonnet 5.5 quotas. This supports account catalog visibility, not API credential entitlement or a successful generation.

Supported UI sources: [billing](https://platform.claude.com/settings/billing), [data retention](https://platform.claude.com/settings/privacy), [workspaces](https://platform.claude.com/settings/workspaces), [rate limits](https://platform.claude.com/usage/limits). Account data was read locally, not uploaded to an external reviewer. Still missing: exact local credential/workspace binding, approved billing disposition, and paid live validation after ratification.

## Isolation evidence

`docker info` reported Docker Desktop server 29.8.2, Linux kernel `6.6.87.2-microsoft-standard-WSL2`; WSL list showed Docker Desktop running in WSL2. The no-pull local test used image `sha256:a797d6440ed0b09e51fb884f30e47ec14cbf58482c5e19db681a0cb8df45b089`, one uniquely named ephemeral container, no mounts or network. Eleven checks passed: nonroot UID, zero effective capabilities, no-new-privileges, seccomp, no Docker socket, no host workspace, loopback-only network, PID/memory ceilings, read-only root and writable tmpfs. Container exited and `--rm` cleaned it up.

This test proves the selected controls in that test configuration. It does not test kernel escape, malicious host admin, real workspace mount safety, broker egress, Runtime enforcement, revocation or the earlier dedicated-VM PN-0 boundary. Those are either explicit first-proof acceptance work or deferred commissioning obligations.

## Current blocking implementation facts

1. Foreman production Pi terminal always refuses (`dispatch/src/pmc-launch/pi-runtime-port.ts:37–41`); production recovery constructor also refuses (`recovery-admission.ts:736–741`). Existing EXA and OPMEM prototypes are not Pantheon admission.
2. Runtime API launch readiness is blocked; soft budget evaluation cannot enforce dollars. Need the scoped host, real hard admission facts, handler and durable identity/receipt wiring described in RUNTIME-PATH.md.
3. Existing lease/kernel references validate shape, not authentic issuance or effect fencing. Need the service and receiving-broker checks, not a better Markdown owner line alone.
4. Cortex is a real service now, but the separate bridge and current Gateway carriage do not automatically match its API/scope contracts. Need conformance wiring, not a replacement memory store.
5. Current goal retains obsolete human gates and offline-only scope. A material amendment and delegated consumer implementation are required; no practice/documentation mismatch is accepted.
6. Account credential, real direct sender and repository-rule/actor qualification remain execution prerequisites. No live paid validation was attempted.

This package prepares the path; it does not claim to have solved these implementation gaps, completed a review, accepted risk, commissioned a node or merged a development cycle.
