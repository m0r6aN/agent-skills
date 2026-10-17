# Plan Review — Collective Live Cognition Integrity

## Status and provenance

- **Initial preflight recorded:** 2026-10-14T00:27:56Z. The later developer-supplied report was received on 2026-10-14; exact receipt time is not available in the record.
- **Status:** **INDEPENDENT REVIEW REPORT RECEIVED; FINDINGS F1–F16 TRIAGED. Scoped D6 amendment B is ratified; execution-route identity/usage remains unverified; Linux baseline is blocking.**
- **Coordinator:** Pi session `01a137ef-cdf7-77a3-8193-dfcd6fab7ce3` (transferred at the pre-parcel boundary on 2026-10-14).
- **Independent reviewer/session:** The developer-supplied report does not identify a reviewer session or model; identity, independence route, and usage cannot be verified from the report artifact.
- **Review verdict:** **NOT READY TO SHAPE P0 AS WRITTEN** (as reported). Findings F1–F16 are triaged below; this record does not certify reviewer execution provenance.
- **Control-plane source HEAD observed:** `543b261bba8c67265b1628fdb5834c287dac80ba`; the ratification edits are local working-tree changes, not a new accepted commit.
- **Initial ratified charter SHA-256:** `1dd3240ee4a322fd1c0afa05266261911240aff39e3148a35312340651fa9444` at `charter.md`; this is the hash bound to the initial human review approval.
- **Charter SHA-256 at ownership/authorization transfer:** `b5bf51376f9397c5bde24627cb5aad65c7c958c901b5fee2307f00e7b7db15aa`. The initial approval does not authorize sending this changed packet.

## Human authority recorded verbatim

> Ratify D1–D10; retain Gate 2 per parcel and human Gate 3

At Gate 1, D1–D10 and the full host/Gateway scope were ratified; no standing builder, merge, product-provider spend, deployment, or inherited-authority grant had yet been given. The subsequent coordinator transfer and scoped Gate 2/Gate 3 delegations are recorded below and in the charter; this paragraph preserves the original ratification-time state.

## Initial plan-review route approval — verbatim

Received 2026-10-14T00:55:03Z. Charter hash was verified unchanged before recording this approval. The seven-day approval window will be treated conservatively as expiring no later than 2026-10-21T00:00:00Z; launch must recheck freshness.

```text
Approved independent plan-review route for goal collective-live-cognition-integrity, initial plan review only:
 - Reviewer: Anthropic claude-fable-5-1. No fallback; if it's unavailable, stop and report. Reasoning: high. Fresh session that doesn't share our
   conversation and can't see other reviewers' output.
 - Budget: $5 USD hard ceiling for this review. Stop if it would be exceeded. Record actual usage.
 - Data controls:
     - Inputs are limited to the ratified charter (SHA-256 1dd3240ee4a322fd1c0afa05266261911240aff39e3148a35312340651fa9444) plus the canon files the
       charter lists.
     - No credentials, .env files, or secret values. No raw demo transcripts or provider responses from %TEMP%/keon-collective-demos.
     - Read-only: no fixes, commits, config/auth changes, network probes, or paid Collective/provider demo calls.
     - The reviewer returns a report only. You capture the transcript and usage in the goal records.
 - Freshness: this approval is valid for 7 days from today.
 - Launch: use the approved resolver/launch path. (Optional, only if you accept it: "If the resolver can't issue a receipt, I approve a one-time exception
   for this single review only. Record it as such; it grants nothing beyond this review.")

 Record this approval verbatim in plan-review-findings.md, run the review, triage the findings, then stop for Gate 1 re-approval if any locked decision
 changes, or for CLCI-P0's Gate 2.
```

This permits only the named initial review. No fallback, implementation-parcel dispatch, merge, config/auth mutation, provider demo, or production effect is authorized. The optional exception is conditional on inability to obtain a resolver receipt and does not waive the exact model, hard budget, restricted inputs, independence, or report-only boundary. Its acceptance/use has not yet been decided at this preflight stage.

## Coordinator launch preflight — historical, not a review

| Check | Observation | Disposition |
|---|---|---|
| Independent agent dispatch capability | Tool discovery did not expose an independent agent-dispatch tool; MCP search returned no matching dispatch tool. | Do not substitute a context rollover or the coordinator's own analysis for a fresh independent reviewer. |
| Approval-boundary route | No review-specific approved route receipt was supplied or located in this goal's records. | Hold inference; this does not assert that no eligible route exists elsewhere. |
| Foreman launch canon | `../pi-model-configuration/charter.md`, Amendment 01 A1–A4, requires an approved resolver-emitted route, fails closed on missing/stale/mismatched receipts, and prohibits direct/default Pi invocation as a Foreman execution path. Independence must survive fallback. | Do not launch `pi -p` directly, fabricate route evidence, or self-issue a break-glass exception. |
| Available entry seams | `../../../routing-policy/src/pi-resolver.ts` exposes a pure evidence-dependent resolver; `../../../routing-policy/src/launch-boundary.ts` verifies approved receipts; `../../../dispatch/src/pi-entry/index.ts` documents the launcher obligation. | Their presence is not an approved review receipt, verified launch, host eligibility, or provider-use permission. No resolver invocation or failed/approved machine receipt was emitted here. |
| Narrow native-review prototype | `../../../internal-review-launch/README.md` explicitly describes an unaccepted offline prototype, `mayInvokeProvider: false`, and a narrow initial OPMEM review scope. | It is not a production review launcher and grants no authority for this goal. |
| Native CLI discovery | `pi --help` confirms a local headless CLI exists. Startup reported the configured local Docker MCP endpoint unavailable. No reviewer inference was invoked. | CLI existence does not waive receipt, data, budget, frontier, or independence checks; do not repair host configuration under this goal. |

At this historical checkpoint the coordinator had not established that the resolver was broken, and no exception was inferred from charter ratification. The later owner route approval above and current preflight below supersede this checkpoint.

## Historical required next action — approval now supplied

The owner has supplied the review approval recorded above. Do not ask again for that same approval. The original launch requirements were:

1. A frontier adversarial-review lane, an independent session, and family independence from the OpenAI-authored charter; no shared coordinator conversation or another reviewer output.
2. Exact provider/model and permitted fallback, reasoning level, required capabilities/context, data classification and transport controls, resource/spend limits, and owner-accepted freshness evidence.
3. A bounded read-only task envelope: ratified charter plus applicable repo canon only; no implementation, fixes, commits, auth/config changes, production probes, or paid Collective demo calls.
4. Approval-boundary verification before inference, actual execution identity/usage evidence, and a durable reviewer transcript captured by the coordinator without granting the reviewer repository mutation authority.

No secret values or credentials should be supplied in chat, the packet, or Git. A reference to an approved local mechanism is sufficient. Any additional exception or provider-use authority needs its own explicit disposition; do not manufacture it from the Gate 1 statement.

### Review mandate once launch is authorized

Assess decomposition coherence, real parcel boundaries, missing parcels, unexamined load-bearing decisions, silent file/surface collisions, and evidence feasibility against the ratified charter and canon. Cite exact sections/files. Separate demonstrated contradictions from unresolved questions and recommendations. Rank blockers and explain the minimal amendment, affected decisions/parcels, and closure evidence.

The coordinator consumes this independent report and records triage below. If a disposition changes D1–D10, reopen Gate 1 only for the affected decisions before dependent work. Once review/triage is complete, establish the loop directive and initiative state, then shape/lint P0 and request its human Gate 2 approval.

## Independent findings and triage

### Report provenance and limitations

The developer supplied an independent plan-review report after the historical preflight/stop records above. The report states it reviewed charter SHA-256 `b5bf51376f9397c5bde24627cb5aad65c7c958c901b5fee2307f00e7b7db15aa` and cites these source revisions: agent-skills `543b261`, Collective `461e2767a046418b098766090723e0cc34d9edc7`, and Gateway `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`. It identifies findings F1–F16 and recommends not shaping P0 as written. The supplied report did not include reviewer session/model/usage evidence and says its own route/independence could not be self-certified. Therefore, this record does not assert verified reviewer identity, execution route, or usage. The findings are retained as reviewer-reported and locally corroborated where noted below; no unsupported route claim is used as acceptance evidence. The charter now has SHA-256 `6203c205987ce181ec7dbb9750968f9a6727ac9826c8cc528dc2b64a882014f8`; the supplied report does not review or approve this post-triage revision.

| Finding | Reported issue / local corroboration | Coordinator disposition | Impact / closure |
|---|---|---|---|
| **F1 — Critical** | Gateway protected-main workflow matches P7 paths, uses the `production` environment, authenticates to Azure, pushes an image, and updates the Container App. | **Fix / boundary.** Preserve P7 PR/build/test authority but exclude merge-to-main while this deploy path remains effective. | Charter Gate 3 carveout; requires explicit deployment disposition or independently verified non-deploying workflow/environment before any merge. |
| **F2 — High** | Routed adapter catches cognition exceptions and tries `_registry.FallbackChain`; shipped config contains `openai`, `ollama`. | **Fix.** Live fallback chain empty; failure/refusal/invalid/timeout/cancel must not trigger another provider invocation. | P0/P2/P3; E2 asserts exactly one invocation and no fallback. |
| **F3 — High** | Intent DTO omits outcome kind, escalation and completion/diagnostic metadata; Gateway parser defaults absent values to empty/zero; MCP result schema lacks these fields. | **Fix.** Freeze an explicit versioned/additive projection; no silent contract mutation. | P0 decides; P6 host projection, P7 Gateway/schema and contract tests. |
| **F4 — High** | Gateway timeout defaults to 30 seconds and maps task cancellation to 503, conflating caller cancellation with deadline. | **Fix.** Define compatible per-call/per-deliberation budgets and distinguish cancellation from timeout. | P0 matrix; P7 transport/status tests; E6. |
| **F5 — Medium** | Real-Collective test lane uses `dotnet run --no-build`, Development environment, and ambient Anthropic/OpenAI keys; live inference can be accidental. | **Fix.** Offline by default; live requires explicit opt-in. Pin exact build/worktree and strip provider keys from offline lane. | P0/P7/P8 and E3/E8; stop if offline run observes a provider call. |
| **F6 — Medium** | E7's 25%-attendance expected values are fractional, while baseline attendance and rounding behavior were implicit. | **Fix.** Make all-or-nothing/no-overlap/zero-baseline/continuous attendance/no-rounding assumptions explicit. | Charter E7 updated; oracle retains the stated expected values. |
| **F7 — Medium** | Gateway local `main` is divergent (`ahead 2, behind 18`) and contains unrelated dirty monetizable-GA docs and `.serena/project.yml`; `origin/main` is `0e0878a5…`. | **Fix / preserve.** Never reset or overwrite local dirty work. Pin P7 to clean `origin/main` `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`. | Charter sequencing updated; verify exact worktree/commit before P7. |
| **F8 — High / Gate 1 (resolved by ratification)** | Governed participation requires canonical receipt refs; host fails closed without anchors. `/v1/intents` carries goal/context and trusted headers, and no production call into `IGovernedAgentParticipationHost` was found. | **Ratified option B.** The developer chose caller-supplied references to existing canonical receipts in a versioned request contract. Server resolves and validates them against trusted identity/tenant/correlation/request/agent/replay context. The host does not mint ingress receipts; model content cannot create or alter provenance. | D6 amendment ratified on 2026-10-14; P0 must specify Gateway input versioning, receipt resolution, and fail-closed tests. Linux baseline remains the dispatch blocker. |
| **F9 — High** | OR-P02 is stopped after its third failure, has no fourth attempt authorization, and its patch must be retained; no OR worktree is present in this Collective checkout. | **Accept boundary / fix precondition.** Do not recover/reuse/modify OR work. Use isolated CLCI worktrees and first record independent Windows/Linux full-solution baseline. Stop if OR resumes or a collision appears. | Charter non-interference and baseline precondition updated; Windows passed, but Linux remains non-green/incomplete in `baseline-2026-10-14.md`. |
| **F10 — Medium** | Original P5 overlaps P6 on `CollectiveHost.cs`, Core DI, and `TemporalEchoPlanner.cs`, and is oversized. | **Fix.** Serialize the same P5 objective as P5A identity/participation, P5B alternatives/critique, P5C synthesis/branch integration; P6 owns host assembly. | Charter decomposition/ownership updated; exact specs and Allowed Files required at shaping. |
| **F11 — Medium** | Registry eagerly constructs configured adapters; OpenAI-compatible adapter resolves its key during construction, potentially requiring unrelated provider keys. | **Fix.** Resolve only selected provider/key; offline mode keyless. Treat P3 as elevated and P3/P4/P7/P8 as security-sensitive for review planning. | Charter P3/evidence controls updated; exact lazy/selected-provider behavior tested. |
| **F12 — Medium** | Five Gateway tools each start a fresh deliberation; up to three model calls each, creating per-tool multiplication. | **Fix.** Count per tool/run, enforce an approved hard ceiling and window, and stop on overrun. | Charter E8 updated to include fresh per-tool deliberations in call count; P0/P7 test accounting. |
| **F13 — Low/Medium** | `CognitionResult` lacks typed outcome kind; summary/output is required and errors are generically wrapped. | **Fix.** Make P0 a standalone Phase-1 typed-contract PR in Abstractions with fixtures/tests, committed before dependent implementation. | P0 deliverable and sequence updated; preserve compatibility/versioning decision. |
| **F14 — Low** | Original failed-run evidence is in `%TEMP%`, making it fragile as a closure reference. | **Fix.** Preserve original; record its hash and a sanitized goal-local copy/reference, never raw demo transcript. | P8/E9; evidence copy/hash remains to be produced during authorized evidence work. |
| **F15 — Low** | Reviewer questions whether broad authorization explicitly names merges. | **Accept-as-documented, with boundary.** User authorized decisions and any non-destructive actions for this goal; charter records scoped green-chain Gate 3 delegation. Production/deployment is not covered; P7 main merge stays carved out. | Charter Gate 3 and production boundary updated. |
| **F16 — Informational** | Gateway `docs/collective-api-integration.md` describes the excluded Control `/api/collective` surface. | **Informational / accept boundary.** Use only as relevant auth/fail-closed reference; do not expand this goal to Control API. | Existing scope/non-goals unchanged. |

### Triage result

F1–F7 and F9–F16 are dispositioned in the charter and/or evidence plan; they do not change the ratified objective. F8 identified the only locked-decision question: the developer subsequently ratified option B for D6. No other Gate 1 question is pending. P0 remains blocked until the non-green/incomplete Linux baseline is resolved and the cross-platform baseline is complete.

## Historical stop/handoff record — initial ratification step

- Ratification recorded in `charter.md`; D1–D10 text was not substantively amended.
- Goal execution is stopped awaiting the approved independent review route.
- No parcel specs, builder worktrees, loop directive, review verdict, paid product inference, commits, pushes, or merges were created in this step.
- Next implementation parcel remains CLCI-P0, after mandatory review/triage and its separate human Gate 2 approval.
- Other goal records and exploratory implementation worktrees remain untouched.

## Current launch attempt — 2026-10-14

### Inputs and authority preservation

- Recorded the owner's entire approval verbatim above, including the conditional one-time exception language.
- Reverified the authorized charter SHA-256: `1dd3240ee4a322fd1c0afa05266261911240aff39e3148a35312340651fa9444`.
- Left `charter.md` byte-unchanged in this step so its approved hash stays valid. Its earlier operational status is superseded by this current record; D1–D10 remain locked without amendment.
- No raw demo transcripts, temporary provider responses, `.env` files, credentials, secret values, or prior reviewer outputs were read or sent. No review packet was sent and no independent reviewer session began.

### Offline resolver and launch result

Ran the existing `resolveRoute` and `verifyLaunch` implementations locally with a read-only L2 request, OpenAI-family exclusion, `high` reasoning, an internal data classification, and remaining budget USD 5. Token figures in the request are conservative planning allowances, **not actual usage or a completed packet estimate**. No network/probe was involved.

Used already-installed `tsx`/YAML dependencies and Node 24.19.0 through process-local module resolution; no installation, source fix, global/project config change, or auth change was performed. The initial module-load command failed on an absolute package-subpath import; resolving the same existing package through its exports succeeded. This was offline tool plumbing, not another model attempt.

Durable machine evidence: `review-route-preflight-2026-10-14.json`.

- Policy SHA-256: `868fead84eec550bffec3248d3f31f289213f656e213d0a6967cdebc5c395700`.
- Resolver receipt ID: `87cf2dbcbdd68d85ee5344d9631ce589ff75ff13e5607609fed4b35221d7a01c`.
- Receipt status: **`stop`**, top-level reason **`L2_PINNED_PROVIDER_UNSET`**.
- `verifyLaunch`: **`ok: false`**, **`RECEIPT_STATUS_REFUSED`**; no checks bypassed.
- The generic resolver enumerated its policy candidates, but **none was invoked**. Its enumerations and fallback declarations are not permission to use a different model or fallback. This owner approval permits only `anthropic/claude-fable-5-1` and no fallback.

### Remaining hard constraints — coordinator preflight, not plan findings

| Boundary | Evidence | Disposition |
|---|---|---|
| Reasoning identity | The Fable binding in `../../../routing-policy/routing-policy.yaml` declares `[off, xhigh, max]`, not `high`. Its resolver evaluation returns `THINKING_LEVEL_UNSUPPORTED` and `QUALITY_UNRECORDED`. Installed Pi CLI docs say `--thinking` may be clamped to model capabilities. | Do not silently substitute `xhigh`, assert native `high` support, or treat a stale policy declaration as proof of the model's actual limitations. Exact approved native reasoning mapping remains unverified. |
| Hard USD 5 enforcement | Resolver projection for the planning allowance is USD 2.409600, but it is static selection evidence, not a runtime reservation or spend guard. The ordinary CLI surface inspected exposes no per-review hard dollar cap or output-token ceiling. Policy declares Fable's output maximum 128,000 tokens at USD 50/million: output alone could be USD 6.40 at that declared rate. | An estimate below USD 5 is insufficient. Do not launch without a supported pre-send reservation/total-token/request bound and actual usage reconciliation that keeps this review within USD 5. No billing/account amount was inspected or assumed. |
| Existing budget middleware | `C:/Users/clint/.pi/agent/extensions/pi-jev-budget-guard/README.md` says shadow-first routing, advisory decisions, and fallback to the current model; its daily estimated limit concerns Jev input. | Not a hard spend gate for this Fable reviewer. Do not enable it, spend on a classifier, or permit automatic model switching. |
| Local configuration health | Offline model listing shows the requested Anthropic identifier, but reports an invalid `providers.anthropic.baseUrl` schema value in local `models.json`. The file contents were not inspected. | Catalogue presence is not verified availability or correct active routing. No config/auth repair is authorized; do not silently ignore or work around the warning. |

The normal resolver cannot produce an approved receipt under the observed policy. **The conditional one-time exception was not accepted, issued, or consumed:** it could address receipt issuance only, not establish exact `high` reasoning or enforce the hard budget. No new launcher, permission bypass, API adapter, or native SDK session was built to evade those limits.

### Actual review usage

See `review-usage-2026-10-14.json`:

- Provider requests / reviewer sessions: **0 / 0**.
- Reviewer input / output / reasoning / cached tokens: **0 / 0 / 0 / 0** (no inference sent).
- Attributable reviewer inference charge: **USD 0**, on a no-request basis, not a provider invoice or an assertion about subscription/account/coordinator costs.
- Reviewer transcript/report: **not produced**. The offline resolver artifact is not an independent review transcript.

### Historical stop after the initial route attempt

**STOPPED — REVIEW APPROVED BUT NOT SAFELY LAUNCHABLE UNDER THE EXACT CONSTRAINTS.**

No independent findings exist to triage. No locked decision changed, and P0 is not Gate 2-ready because mandatory review/triage is still incomplete. Human Gate 2 per parcel and human Gate 3 remain unchanged.

To resume, supply a supported approved launch mechanism/reference that establishes the exact Fable `high` mapping and enforces the USD 5 total bound, no-fallback rule, input confinement, and usage capture. Resolve the local config warning through its authorized owner if it affects that path; this goal has not authorized config/auth repair. The existing owner approval need not be repeated. Any change to its model/reasoning/budget constraints needs explicit owner disposition rather than silent substitution.

Keep execution stopped. No shaping, builder dispatch, product inference, commits, pushes, merges, or unrelated worktree changes occurred. The initial review approval is bound to its original input hash; any later charter amendment must receive a newly approved packet hash before reviewer inference.

## Current takeover and stop — 2026-10-14

- Developer transferred goal ownership to Pi session `01a137ef-cdf7-77a3-8193-dfcd6fab7ce3` at the pre-parcel boundary and issued: “Ownership of this goal is officially transfered to you. Proceed with blanket authority to make decisions on my behalf and execute any non-destructive actions needed to complete this goal.”
- Updated the charter's ownership and standing-authority records. The later delegation is scoped to CLCI-P0 through CLCI-P8 and records Gate 2 dispatch plus Gate 3 merge authority contingent on the full green chain, required reviews, and effective branch permissions. It does not change D1–D10. No parcel has started.
- Current charter SHA-256: `b5bf51376f9397c5bde24627cb5aad65c7c958c901b5fee2307f00e7b7db15aa`. The previously approved review packet was pinned to `1dd3240ee4a322fd1c0afa05266261911240aff39e3148a35312340651fa9444`; it is therefore not authorization to send the current charter. No independent reviewer session was started and no plan review occurred.
- The current Pi session is `openai/gpt-6-luna`, not the specifically approved `anthropic/claude-fable-5-1`. `jev_find_tools` exposed no eligible independent agent/reviewer dispatch tool in this session. The prior offline resolver receipt remains `stop` (`L2_PINNED_PROVIDER_UNSET`); the unaccepted optional exception cannot cure the unproven native `high` reasoning mapping or enforce the USD 5 hard ceiling.
- No inference request was sent in the takeover. Prior usage remains 0 requests / 0 reviewer sessions / USD 0 for the historical attempt. No resolver exception was consumed, no config/auth change was made, and the current default model was not substituted.

**Historical stop, superseded by report receipt:** at that checkpoint, no report existed and no independent inference had been launched through the recorded resolver attempt. The developer later supplied a report; the coordinator has recorded its stated source/hash and triaged F1–F16 above without claiming reviewer route or usage verification. The goal is now stopped specifically for scoped D6 Gate 1 ratification and completion/disposition of the Linux baseline. Do not repeat the expired/hash-stale launch request as the current blocker. After those prerequisites, establish Initiative Coordination persistence and the loop directive before shaping P0.

## Current disposition — report triaged

- The charter was updated from the report and the scoped D6 ratification. Current SHA-256 is `6203c205987ce181ec7dbb9750968f9a6727ac9826c8cc528dc2b64a882014f8`; the supplied report reviewed `b5bf51376f9397c5bde24627cb5aad65c7c958c901b5fee2307f00e7b7db15aa`, not this post-triage revision.
- The developer responded **“B”** to the scoped D6 question. This ratifies caller-supplied references to existing canonical receipts through a versioned request contract; the host must not mint ingress receipts. The full bounded amendment is recorded below and in the charter.
- Baseline evidence is in `baseline-2026-10-14.md`. Collective `main` was clean and aligned with `origin/main` at `461e2767a046418b098766090723e0cc34d9edc7`. Windows full solution: **2,445 passed, 0 failed, 1 skipped**. Linux: 783 passed / 1 skipped outside Core, but Core showed three fixture/proof-chain failures and the run timed out without a final summary. Linux is **not green or complete**; do not waive this.
- The user's “refreshed local main” is confirmed for Collective. Gateway local `main` is still `d6376fd…`, ahead 2/behind 18 of `origin/main` `0e0878a…`, with unrelated dirty monetizable-GA files and `.serena/project.yml`; we left it untouched. P7 remains pinned to clean `origin/main` and must not merge while the production deploy trigger is active.
- D6 amendment B is ratified; no locked decision remains open for Gate 1. The non-green/incomplete Linux baseline is the current technical blocker; its failures are not waived and do not expand the goal's scope.
- No parcel, builder, implementation, paid inference, commit, push, or merge occurred in this update.

## Scoped Gate 1 amendment — D6 (2026-10-14)

Developer response, verbatim:

> B

**Ratified choice:** The caller supplies references to existing canonical receipts in the versioned request contract. Treat supplied references as untrusted until the server resolves them in the approved proof substrate and validates integrity and alignment with trusted tenant, actor, correlation, request, agent, and replay context. The host does not mint ingress receipts. No copied, fabricated, demo, or model-authored receipt is admissible. Gateway input contract changes must be explicitly versioned and tested. This scoped amendment changes D6 only; all other locked decisions and standing authorization boundaries remain unchanged. It does not waive the Linux baseline blocker.
