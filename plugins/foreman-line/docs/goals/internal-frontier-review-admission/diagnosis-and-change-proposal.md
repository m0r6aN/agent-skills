# Internal frontier review admission — bounded diagnosis and exact change proposal

**Date:** 2026-10-11  
**Owner/coordinator:** Clinton Morgan / Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`  
**Status:** initial diagnostic deliverable produced; implementation and launch NOT authorized by this report  
**Source baseline:** `97effb4eb4719b18a6ba78ad9962c78929d46f97`, inspected through coordinator branch intake `255eb8c68644e76305932e7df39967c4c2a91a24` (runtime source unchanged)  
**Mode:** local passive source/installed-document review; no resolver/controller execution, worker, credential inspection, provider request or additional delegate/probe spend

## Bottom line

No inspected existing production path admits the required internal L2 review. The blockers are intentional contract/scope limits plus missing production evidence, not a broken service that can be restarted. Removing `NONPUBLIC_REFUSED` alone would leave provider/lane/schema/tool/thinking/billable-bound and trust-custody gates unsatisfied. A private repository is not proof of provider eligibility.

Recommend one additive, versioned **internal-review-only** companion path for the conditionally approved first-party pair, preserving legacy and public v1 behavior. Do not reopen HRO, implement a general model router, migrate every lane, or slip the separate GitHub work into OPMEM-P0. This initial task ends at the proposal below.

## Source trace / admission blockers

Locators are at the pinned source revision; these are static conclusions, not fresh live-probe findings or independent verification.

| ID | Seam / locator | Evidence and implication |
|---|---|---|
| IR-01 | `dispatch/src/pi-entry/index.ts:preparePiEntry`; `routing-policy/src/pi-resolver.ts:1000-1070` | Legacy entry consumes the legacy resolver and verifies its receipt, but `providerRuleGate` deliberately requires typed-unavailable pin/tolerance slots. Missing L2 pin stops; simply filling the slot is treated as fabricated residual. No YAML-only fix or implicit cutover. |
| IR-02 | `routing-policy/src/provider-binding-schemas.ts:46-60,230-252` | v1 L2 is pinned to `opencode`, and binding schema permits only `opencode`/`openrouter`. The approved `anthropic` pair cannot be inserted into that schema without an explicit version/amendment. Provider declarations in legacy YAML are not v1 admission. |
| IR-03 | `dispatch/src/pmc-launch/controller.ts:285-384`; `controller-types.ts:64-87` | Controller refuses non-public data and L1/L2. WireV1 fixes provider `openrouter`, protocol `openai-completions`, data `public`. These are separate scope barriers; no relabeling as L3/public or namespace substitution. |
| IR-04 | `dispatch/src/pmc-launch/pi-runtime-port.ts:37-41,243-260,413-429` | `createProductionPmcTerminalV1` returns `BOUND_REFUSED`; a composable injected terminal exists, not a proved production installation. The composed profile also requires OpenRouter/public, `toolUse=false`, reasoning text and low/medium/high. It cannot serve first-party internal xhigh/tool-enabled inspection merely because it creates Pi sessions. |
| IR-05 | `docs/goals/pi-model-configuration/gate-1-amendment-06.md:N6`; `routing-policy/routing-policy.yaml:365-384,801-822` | First-party internal/restricted declarations are explicitly PREMISE-FALSIFIED: API terms were assumed but the historical host probe measured OAuth. Current auth mode, retention/training/ZDR applicability, pricing mode and account terms were not inspected here. API-key possession alone would not establish those guarantees. |
| IR-06 | `routing-policy/routing-policy.yaml:capabilities/quality for both approved bindings`; `pi-resolver.ts:786-958,1404-1424`; `dispatch/src/pi-entry/index.ts:resolveThinkingLevel` | Required tool capability and quality are unverified; old live pings are not reviewer proficiency. Request, receipt and executed thinking must agree; the legacy lane-level record and decision-resolved requirement are separate seams. No silent xhigh downgrade or claim that a catalogue map proves provider/runtime behavior. |
| IR-07 | `permission-profiles/README.md:Session-start-load bound`; installed SDK `docs/sdk.md:Configuring a session`, `dist/core/sdk.d.ts:29-55` | Existing `.claude/settings.local.json` profiles are not proof of Pi enforcement. SDK defaults discover resources/settings/credentials/tools; `+name` entries augment rather than allowlist. A named read-only profile or worktree alone does not isolate a reviewer. |
| IR-08 | `dispatch/src/pmc-launch/ledger.ts:budget_scopes/attempts,snapshot,reserve,consume,settle`; `money.ts:computePmcCostV1`; `pi-runtime-port.ts:37-41` | Durable reservations/uncertain-charge handling and exact arithmetic are existing reusable primitives. They do not establish a source-backed first-party billable input/output/cache/reasoning/fee bound or automatically implement both the review subcap and P0 lifecycle aggregate. A token estimate or zero fabricated cache rates is insufficient. |
| IR-09 | `routing-policy/src/launch-boundary.ts:verifyLaunch,breakGlassVerdict`; `route-receipt.ts:documentDigest`; `pmc-launch/intent-custody-types.ts` | Legacy digest signatures are tamper-evident documents, not proof of issuer authenticity or single-use custody. The new path must receive trusted resolver/owner capabilities, not accept an arbitrary recomputed JSON receipt as permission. Existing break-glass is owner-per-use for a broken resolver, not a mechanism to waive these intentional unsupported-scope gates. |
| IR-10 | `templates/pi-routing-directive.md`; `docs/goals/pi-model-configuration/gate-1-amendment-06.md:N2` | Current canon names CLI dispatch. A controlled SDK subprocess, though consistent with the existing composed runtime's approach, needs an explicit review-only amendment. SDK examples are API evidence, not a dispatch grant. The first path also needs an explicit bootstrap review/construction disposition instead of requiring it to authorize/review itself. |

## Installed Pi evidence — inspected without opening user data

Installed `@earendil-works/pi-coding-agent` package metadata declares version **1.1.0**. Read the complete installed `docs/sdk.md`, `docs/cli-integration.md`, `docs/providers.md`, SDK full-control/tool-selection examples, and relevant exported declarations. They support explicit in-memory settings/session managers and a custom resource loader, but make no Foreman authority or monetary-bound claim.

This is not host account discovery, API eligibility or proof that a historical 0.87.1 compatibility capture transfers to 1.1.0. Before implementation, pin the actual package/runtime/source digest and validate exact declarations/examples on the approved build. Never copy example retries, credential storage paths, default resources or broad shell tools into the reviewed worker envelope.

## Proposed narrow contract — exact semantic scope, NOT yet ratified

Introduce `internal-review-launch/v1` separately from `pmc-launch/v1`:

1. **Only one initial use-case:** L2 / adversarial-reviewer / architecture/risk, internal credential-free plan packet, exact `anthropic/claude-fable-5-1` -> `anthropic/claude-opus-5-5` pair, OpenAI family excluded on both attempts. No L1/builders/G6, restricted/customer data, alternate provider or wider model catalogue. The companion resolver is an explicitly reviewed authority, not a direct-launch bypass.
2. **Evidence-first admission:** authentic owner/policy/issuer provenance, actual auth-mode/account-data-policy evidence, fresh provider/model/capability/quality/context/thinking facts, task/workflow/role identity, explicit packet/version and one declared fallback. Missing or contradictory facts refuse before credential resolution or network. Preserve old evidence honestly; do not convert source wording into a measured fact.
3. **Explicit runtime amendment:** permit a controlled SDK child only for this version/use-case, with exact model and xhigh mapping bound to the admitted route. Pin Pi 1.1.0 only after declaration/compatibility verification, not because it is installed. Legacy CLI rules and all existing public-v1 guards remain unchanged.
4. **Fresh least-context worker:** in-memory fresh conversation, no inherited session/compaction history, no ancestor resource/config discovery, no automatic extensions/MCP/codemode/tool-search/skills, no model switching/automatic retry. Only a typed `read_evidence` tool returns immutable preapproved packet entries; no shell/edit/write/git/network/environment tool. Coordinator owns persistence. This does not alter the existing shell-capable permission registry or claim its `.claude` projection is Pi enforcement.
5. **Owned provider boundary:** actual request bytes/identity are checked before any send through a trusted first-party broker. Secrets remain in approved credential resolution, never task context/result/logs; no global auth/settings mutation or ambient subscription fallback. Untrusted recalled/file text cannot change tools/provider/auth/model/capabilities. Receipt digest verification never substitutes for trusted issuer custody.
6. **Real aggregate bound:** every token-bearing provider call in one attempt, including tool-result turns/retries/cache/reasoning/fees where billed, counts toward 48k input and 8k total output/reasoning. At most one primary and one declared fallback attempt; fresh fallback from a durable handoff, never same-turn continuation. Source-backed billable bounds and verified tariff precision must precede reservation/send. SDK cancellation is not proof that provider billing stopped.
7. **Budget/accounting:** enforce USD 5 review aggregate and actual reconciled remaining allowance within USD 25 P0 lifecycle cap, with no independent reset scope. Reuse ledger/money primitives where their documented ownership contract fits; add reviewed durable subcap/aggregate coordination where absent. Unknown/lost-ack charge retains reservation and prevents the fallback until reconciled. No guessed remaining balance, subscription pricing, or invoice equivalence.
8. **Result/role custody:** trusted installation observes actual selected/executed provider/model/thinking/instance identity, completed findings and usage; it returns bounded artifacts to the coordinator with immutable packet/route/attempt references. Reviewer cannot fix/commit, approve itself or grant downstream authority. Missing result/usage/identity is incomplete, not success.
9. **Production activation:** no source-bound installation => no send. Static fixture receipts remain labeled fixture-only. A separately authorized synthetic live probe establishes actual traffic/identity/tool isolation/bounded recovery; subsequent independent architecture review evaluates the implementation, not just the expected fixture.

## Exact candidate file sets / proposed dependency order

These are a change proposal, **not Allowed Files or dispatch approval**. No file below was modified/created by this diagnosis. Split further if the code parcel exceeds independently reviewable scope; no globs or hidden shared-source expansion.

### IR-P0 — contract and bootstrap disposition (documents before implementing code)

- NEW `plugins/foreman-line/docs/contracts/internal-review-launch-v1.md`
- EDIT `plugins/foreman-line/templates/pi-routing-directive.md` (review-only companion/version/SDK amendment; preserve legacy rules)

Freeze the nine clauses above, exact role/data/provider restriction, package/runtime pin, root/issuer/packet trust, failure semantics and bootstrap verification method. Require an explicit owner amendment, not merely the already-approved review budget.

### IR-P1 — isolated admission/policy fixtures (no provider calls)

- NEW `plugins/foreman-line/internal-review-launch/package.json`
- NEW `plugins/foreman-line/internal-review-launch/tsconfig.json`
- NEW `plugins/foreman-line/internal-review-launch/README.md`
- NEW `plugins/foreman-line/internal-review-launch/src/types.ts`
- NEW `plugins/foreman-line/internal-review-launch/src/schemas.ts`
- NEW `plugins/foreman-line/internal-review-launch/schemas/internal-review-launch-v1.schema.json`
- NEW `plugins/foreman-line/internal-review-launch/src/admission.ts`
- NEW `plugins/foreman-line/internal-review-launch/src/index.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/admission.test.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/schema-parity.test.ts`

Consume existing shared schema/hash primitives; do not copy a new signing/hash scheme or mutate the v1 provider schema/constants to smuggle in Anthropic. Enforce declared facts/families/attempts before ranking. Admission output is versioned and can authorize only the owned companion installation after verified bootstrap; arbitrary caller-authored JSON is never an authority port.

### IR-P2a — actual first-party provider/budget boundary

- NEW `plugins/foreman-line/internal-review-launch/src/provider-port.ts`
- NEW `plugins/foreman-line/internal-review-launch/src/budget.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/provider-port.test.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/budget.test.ts`

Reuse existing ledger/money APIs read-only where valid. Prove source-backed total billable bounds, aggregate/subcap atomicity, no ambient auth or fallback, typed rejection before send, and unknown-charge retention. No source-backed bound => fail closed, not a working-looking production factory.

### IR-P2b — isolated Pi worker and evidence/result custody

- NEW `plugins/foreman-line/internal-review-launch/src/worker.ts`
- NEW `plugins/foreman-line/internal-review-launch/src/evidence-reader.ts`
- NEW `plugins/foreman-line/internal-review-launch/src/custody.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/worker.test.ts`
- NEW `plugins/foreman-line/internal-review-launch/tests/custody.test.ts`

Depends on IR-P1/P2a. Pin request -> admitted route -> SDK selection -> actual provider wire -> finalized result, including exact thinking. Explicit ResourceLoader/tool definitions; no default discovery or `+tool` augmentation mistaken for an allowlist. Evidence reader handles missing/foreign IDs, path traversal, symlinks, changed digests and oversized text without opening host paths from model arguments.

### IR-P3 — integrated verification / separately approved live activation

- NEW `plugins/foreman-line/internal-review-launch/tests/conformance.test.ts`
- NEW `plugins/foreman-line/internal-review-launch/scripts/live-review-proof.mjs`
- EDIT `plugins/foreman-line/internal-review-launch/README.md`

Default deterministic suites never call providers. Live script requires the separately approved synthetic envelope and owned production installation, reports real bounded identity/traffic/isolation/cancellation/unknown-charge evidence, and never claims fixtures as actual dispatch. Record exact proof destinations in that shaped spec. Preserve rejection of public-v1 internal/L2 requests in existing suites.

All parcels are proposed elevated / architecture/risk; none has a builder/reviewer/spend allocation. Do not rewrite unchanged `routing-policy`, `pmc-launch`, permissions, old PMC/HRO goal records, global Pi files or Stage A artifacts. If consuming a primitive requires source change, stop and refine the exact proposal rather than claim it was implicitly granted here.

## Required negative controls / independent reviewer focus

- Internal packet routed to public-only provider, wrong family/namespace/model, missing/mismatched auth-mode eligibility, expired quality/catalogue/account evidence or downgraded thinking: zero credential resolution/provider calls.
- L1/L3/G6, restricted/customer payload, undeclared fallback, second primary attempt, hidden retry, provider-owned silent failover or model switch: refused before send; no widened generic lane map.
- Fake recomputed receipt, foreign workflow/role/session, replayed consumed permit, modified packet, provider/result identity mismatch or forged usage proof: no accepted authority/result.
- Resource auto-discovery, injected extension/tool, arbitrary filesystem/environment request, path/symlink traversal, shell/git/write attempt: denied; verify selected tool set and ending review-workspace state.
- Cache/tool-turn/reasoning/input expansion, fractional fee/tariff uncertainty, exhausted subcap/parentcap, cancellation or lost acknowledgement: reserve worst-case, retain unknown liability, never reset budget to use fallback.
- Does an API-key/default account assertion pretend to prove ZDR or no-training? Does a successful old ping get promoted to reviewer quality or current auth? Are all absent facts explicit stops?
- Does the bootstrap path rely on this unreviewed launcher to review/authorize itself? Does the change silently relax public v1 or replace a genuine paid proof with a canned fixture?

## Bootstrap and owner-only next facts

There is a real bootstrap dependency: independent reviews/builders need admission, while new admission code itself requires verified construction/review. Do not disguise this as a routine resolver repair or claim a digest is an authenticated exception.

Recommended next step is **IR-P0 only**: owner-reviewed exact companion/SDK/bootstrap contract and offline fixtures, before any implementing or paid phase. If no existing independently admitted reviewer can assess the new path, propose a specifically named human bootstrap review/construction exception at an immutable head, followed by the required fresh frontier reviews before operational acceptance. That would be a new explicit process amendment; this report does not grant it or label a human check a frontier review. Otherwise obtain a separate already-admitted independent path. Do not restart the archived HRO loop.

Needed provider facts are non-secret: intended actual auth mode/account terms for both first-party models, applicability of required no-training/retention/ZDR controls, and a source-backed billable-bound/tariff arrangement. Prefer commercial first-party API mode only if those required controls are actually established; configuring a key does not establish them. Credentials, if later needed, are installed through owner-approved secret management, never pasted here. Existing OAuth evidence remains historical; no auth change or new probe is made by this diagnosis.

The earlier three tracking defaults are already ratified and are not reopened. The conditional USD 5 review envelope remains unchanged and unactivated. New paid implementation/proof work must have its own explicit bounded envelope; no new spend is inferred from the diagnostic assignment.

## Coverage and completion

Reviewed the named source seams, canonical N2/N6 evidence and installed Pi 1.1.0 docs/examples/declarations. Did not inspect credentials/settings/model-store/session histories, check present account terms, run provider probes, invoke resolver/controller/ledger functions, execute package suites, implement the companion, certify routes, or perform an independent audit. Severity is not inflated: the observed refusals are intentional safety/scope boundaries; absent capability is not an exploited vulnerability.

Initial diagnostic deliverable is complete at this author-only planning boundary. Concrete implementation, bootstrap disposition, account evidence and live proof remain open. Next action is the IR-P0/auth-policy decision above; no further old-goal exploration or background loop is needed.
