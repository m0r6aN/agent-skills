# Execution blocker diagnosis — measured CLI, resolver and launch boundary

**Historical diagnostic record. Current continuation:** [RESUME.md](RESUME.md), [review-authorization.md](review-authorization.md), and gate entries REVIEW-004 / PREFLIGHT-001. SA4-M1 is approved with coordinator execution and the three account/policy observations are confirmed. Pending/human-only language below describes the earlier assessment. Production refusals remain unchanged; [the known-good comparison](D:/Repos/Pantheon/.audit/foreman-review-recovery-2026-10-18/REPORT.md) distinguishes earlier direct-Pi exceptions from the held production path. Its human-only interpretation is likewise superseded for this review by the recovered directive.

Recorded: 2026-10-19T00:01:25.994Z. Same coordinator session `01a14fa6-c85a-7075-b3aa-27046da8c191`. Scope: diagnose available supported paths; preserve existing gates/caps. No provider inference or independent review performed.

## Subsequent manual-interface assessment — 2026-10-19T00:24:13Z

This measured automatic-path diagnosis and its raw refusals remain unchanged. Missing capability is now tracked as **DEP-FL-001** with upstream owner/completion evidence in `upstream-dependencies.md`. Subsequent Claude Code/Grok CLI checks establish an available manual interface, **not compliance with all retained numerical/privacy guarantees**. `manual-review-feasibility.md` and conditional `CLAUDE-CODE-MANUAL-RUNBOOK.md` supersede the generic human-relay suggestion below as current operator guidance. **SA4-M1 is proposed, NOT approved; no send.** No further generic permission, launcher bypass or MCP restart is requested.

## Correction to earlier shorthand

A missing dedicated model/subagent tool did NOT establish that this session could not start a model through an installed CLI. Bash can access Pi, and its native model/credential metadata is available. Earlier replies conflated tool discovery with executable-path availability. The actual stop is below: **the accessible resolver emits a stop receipt, the launch boundary rejects it, and the production terminal refuses construction.**

## Measured layers

| Layer | Check | Result / meaning |
|---|---|---|
| Shell / CLI | `command -v pi`, `pi --version` | `/d/nodejs_symlinks/pi`, Pi **1.3.0**, Node **v24.7.0**. Actual CLI entry `D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js`. CLI is NOT absent. |
| Native model metadata | Offline, extensions/MCP/context disabled `--list-models` | Exact `anthropic/claude-opus-5-5` and `xai/grok-4.7` are catalogued. Catalog presence is not current live inference, admission or frontier-quality evidence. |
| Credentials | `pi auth check --provider <anthropic|xai> --json --no-refresh`, extensions/MCP disabled and offline | Anthropic: `ready`, **OAuth**. xAI: `ready`, **API key**. No credential values printed/read into the assistant; no refresh requested. Readiness is not provider-accepted availability, privacy qualification, subscription spend entitlement or a remaining-balance measurement. |
| Foreman installation metadata | `pi list --no-approve` with `PI_OFFLINE=1` | User package declaration names `D:/Repos/agent-skills/plugins/foreman-line`. Package declaration/slash-skill loading is not an execution composition. The documented `pi-package` exposes skills/probe, not an automatic resolver-and-launch CLI. |
| Policy validation | Actual `validatePolicy` on unchanged `routing-policy.yaml` | **valid**, errors `[]`. This is valid policy with explicitly held lanes, not an invalid configuration/schema error. |
| Resolver execution | Actual `resolveRoute`: L2, architecture/risk, internal, no tools/structured output, excluded OpenAI family, text/high, 20k input/4k output requirements/projections, $5 remaining | **status `stop`**, sole top-level stop **`L2_PINNED_PROVIDER_UNSET`**, `route: null`. Token numbers are requested ceilings, not a measured packet count. No record authorizes inference. |
| Launch boundary | Actual `verifyLaunch` against that real stop receipt, matching L2, same diagnostic clock | **`ok: false`, `RECEIPT_STATUS_REFUSED`**, no bypassed checks. A validly produced stop receipt is still not an approved receipt. Diagnostic freshness context is not a new standing launch authorization. |
| Production terminal | Actual `createProductionPmcTerminalV1(undefined)` | **`{ok:false, code:'BOUND_REFUSED'}`**. The factory returns this unconditionally; no source-backed production billable bound/installation exists in this seam. No provider was contacted. |
| Same-process controller | Source inspection, NOT a fabricated live controller installation | `controller.ts:307` refuses nonpublic with `NONPUBLIC_REFUSED`; `:383` refuses L1/L2 with `PINNED_TRANSPORT_REFUSED`. These remain additional architectural holds, not the measured legacy resolver's first failure. |
| Alternate internal-review package | Source README | Offline OPMEM-only prototype: `mayInvokeProvider:false`, `runtimeStatus:held`. Not Pantheon launch authority or a native worker runtime. |
| Proposed installed execution adapter | Filesystem + `docs/specs/active/EXA-P4-installed-cli-and-composition.md` | `execution-adapter/` directory absent; EXA-P4 is a draft, not an installed executable. |

The initial ordinary `pi --help` loaded global extensions and reported an unreachable loopback MCP gateway at `http://127.0.0.1:8811/mcp`. Subsequent Pi diagnostics explicitly disabled extensions/MCP, used offline mode and succeeded. **Restoring that MCP server is not required for native Pi CLI access and would not fix policy/terminal refusals.** No credential-printing commands, login, secret-file inspection or model inference were used. Some rejected diagnostic CLI options/missing local dependencies were corrected without installation; they are not the ultimate blocker.

## Exact route-specific gaps

1. `routing-policy.yaml:245–257` explicitly leaves L2's pinned provider unavailable. `pi-resolver.ts` `providerRuleGate` preserves that hold; replacing it with a guessed value would not be an authorized fix (the validator also freezes this representation).
2. Native Opus exists in policy but is **L2 fallback** to native Fable (`routing-policy.yaml` L2 Anthropic route near line 1229). Owner's Opus candidate approval does not rewrite this route or permit silent Fable-primary substitution. Actual Opus evaluation has **`QUALITY_UNRECORDED`** and `rankable:false`. The native pair's fallback comparability/tolerance remain unproved. Missing tool-use tests are NOT the immediate capability issue for this no-tools request.
3. Native xAI is outside this installed legacy resolver's `ProviderName` vocabulary (`types.ts:236`), and there is no `xai/grok-4.7` binding/route in this policy. Pi's xAI catalog/key do not extend Foreman admission. No change was made to the frontier registry or route policy.
4. Anthropic's declared internal-data eligibility points to a **PREMISE-FALSIFIED** commercial-API attestation: this host uses OAuth. The 2026-10-07 probe's section 4 explicitly holds retention/training/ZDR; today's OAuth readiness does not resolve it. The typed declaration may pass R1 but is not fresh privacy proof. Another goal's native subscription exception is not inherited by Pantheon.
5. Even an approved selection document alone would not supply the production terminal's billable bound, actual provider identity/custody, no-tools isolation, per-attempt max output/reasoning/input counts, 10-minute cancellation/uncertainty handling or shared $5 reservation enforcement. The ordinary CLI exposes `--no-tools` and resource/context disabling but no documented direct max-output-token or aggregate dollar-cap flag. Prompt requests and catalog price estimates are not these controls. Installed Jev budget middleware describes itself as a cost router, not an authorization control; shadow/default behavior and its Jev-only estimated ceiling do not enforce SA4 on the reviewer.

## Existing exception: what it does and does not do

REVIEW-002 accepts a **human-mediated** review in place of automated launch/receipt checks. It did not change the global resolver, declare this native CLI invocation admitted, waive data/budget/token/time limits or grant break-glass authority to the coordinator. OPS-001's broad non-destructive authority does not turn a stop receipt into an approval. No break-glass receipt was requested/issued and no unadmitted raw Pi provider request was made.

## Smallest concrete resolution

**For this review, without building infrastructure:** use the already accepted human relay: open a fresh private Anthropic Opus 5.5 (or xAI Grok 4.7) session, disable tools/ambient project history, submit only `D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review/REVIEW-PACKET.md`, and return the raw response plus the operator metadata. Account-specific handling and known cost/input/output/time bounds must be checked before sending as disclosed in `OPERATOR-INSTRUCTIONS.md`. No renewed charter/SA4/general non-destructive approval, Pi installation, extra budget or MCP restart is needed. This remains explicitly manual evidence, not an admitted automated launch.

**For automatic execution while preserving safeguards:** the missing capability is an accepted internal-data **L2 native-Pi launch composition** that resolves an approved named primary/fallback (or explicitly single-attempt contract), verifies actual account/data handling and independent identity, bounds input/all output/time/charges under $5, and retains attempt/result custody. The existing upstream internal-review/execution-adapter work is the relevant implementation boundary. Its maintainer must provide an accepted runnable installation or implement/qualify it with the necessary scoped policy/contract amendments; this is not fixed by one YAML edit, installing a dedicated model tool, installing dependencies alone, issuing a generic spend approval or switching the terminal's refusal off. No new launcher implementation was undertaken under this diagnosis request.

## Retained reproducible evidence

Directory: `D:/Repos/Pantheon/docs/reviews/pantheon-incarnation-v0-plan-review/execution-diagnosis/`:

- `diagnose.cjs` — offline diagnostic only, no provider execution. Writes new evidence with exclusive-create; will not overwrite existing receipts.
- `diagnostic-summary.json` — actual CLI/model/auth metadata, exact unchanged policy/source hashes, dependency versions and evaluated route candidates.
- `resolver-stop-receipt.json` — actual resolver-generated static-conformance STOP receipt, never an execution grant.
- `launch-verdict.json` — actual refusal of that receipt.
- `production-terminal-verdict.json` — actual `BOUND_REFUSED` factory result.

The workspace lacks its own routing-policy node_modules. Diagnosis reused already-installed **Jiti 2.7.0 / Ajv 8.20.0 / YAML 2.9.0** via process-local module aliases, with filesystem cache disabled. No package install, lock/config/source edits or production dependency-provenance claim. This proves the pure code can execute for diagnosis; it is not a newly admitted production runtime.

Base agent-skills HEAD `64fb8949bf5134f96fda02df0d4f52ac291a6138`. Review packet SHA-256 unchanged: `0e509c4839c88f771b66dccb168c4618eb3ce19461eb614ba0a18a35d8900b67`. Ratified charter/amendment remain unchanged. **No inference attempt, review, reservation or external review charge: $0 used, $5 unspent.** No ownership transfer, build, worker, loop, wakeup, remote Git/Linear mutation or ratification change.
