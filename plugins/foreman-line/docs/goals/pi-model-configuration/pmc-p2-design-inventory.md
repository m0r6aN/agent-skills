# PMC-P2 accepted design inventory

Status: revised after independent design review; coordinator-accepted rulings,
2026-09-26. Docs only. Canon is [Amendment 05](gate-1-amendment-05.md), now recorded
in the PMC and RCM charters before P2A dispatch. P1 documents are unchanged.
No provider call, configuration write, implementation or activation is claimed.

## Actual predecessor seams

Paths are under plugins/foreman-line; observations used the clean HRO coordinator
checkout and installed Pi sources. Pin accepted implementation commits at dispatch.

| Seam | Observed behavior and prerequisite gap |
|---|---|
| dispatch/src/routing-eval/index.ts:129 evaluateRouting | Reads/validates v0 policy, classification intersection then first tier-ordered model. No v1 lane ranking, authentic evidence or remaining-budget ledger. |
| dispatch/src/routing-eval/index.ts:230 | Descriptive routing JSON, not authenticated launch authority. No expiry/policy-digest/one-use binding. |
| dispatch/src/approval-cli/index.ts:342,429 | prepareDispatch evaluates routing; executeDispatch creates worktree/Stage-C evidence. Neither proves a Pi inference boundary. |
| routing-policy/src/pi-openrouter.ts:45,77; templates/pi-openrouter-routing.json:5,30 | Legacy Jev enabled/allowed lane declarations persist. Shared launch gate must deny L6 and aliases regardless of preserved v0 structure. |
| role-authority/src/instances.ts:56 | Family-diversity declarations exist; legacy evaluator does not enforce actual artifact/instance independence. |
| RCM readCatalogSnapshot/projectEligibility | Reuse accepted supported public API for fresh exact-endpoint facts; not live quality/privacy authentication, ranking or budget. No deep-import workaround. |
| worker-envelopes/src/budget.ts; routing-policy/src/schemas.ts | Shapes/positive class ceilings are not spent-plus-reserved accounting. Jev-specific acknowledgement is not general PMC ledger authority. |

## Accepted review dispositions

| Finding / decision | Amended disposition and proof obligation |
|---|---|
| RCM no-sort conflicts with PMC ranking | Amendment 05 V1 recorded in both charters now. Legacy v0 order unchanged; explicit PMC v1 owns ratified ranking/L5 cost semantics. No silent migration or parallel HRO resolver. |
| Prior B/C combine too many responsibilities | Five sequential parcels: A resolver, B ledger, C controller, D one owned transport, E config/callers. Exact paths below; no monolithic launch-and-config parcel remains. |
| HMAC adds unneeded key custody for current process model | A1 explicitly amended: opaque registry-authenticated same-process one-use permits only. No serializable authority or restart replay. HMAC/IPC/key provisioning deferred until concrete IPC requirement. |
| A permit alone does not solve restart/uncertainty | Persistent reservations and consumed/uncertain liabilities survive. Restart invalidates all permits and never repeats sends. Serialized audit cannot mint. |
| Hook throw is fail-open | Pi runner catches before_provider_request errors. Freeze final post-hook payload, verify claims/digest, durable consume immediately before sole owned sender. No later mutation or hidden send. |
| Transport surface too broad/unproved | Initial OpenRouter OpenAI Chat Completions only (Pi openai-completions); controlled stream owns one exact HTTPS operation. No built-in sender delegation. Other protocols/providers refuse. |
| Hidden auxiliary inference | Disable extensions/discovery, warming, automatic compaction/retries/background network unless proven through the same gate. Each later request needs a fresh reservation/permit. |
| Budget ceiling masquerades as remaining funds | Scope-authorized limit minus settled plus all outstanding liabilities; atomic reserve/consume. Unknown costs/liabilities never released by timeout or missing response. |
| Floating point price precision | Micro-USD safe-integer ledger; authenticated bounded decimal rate lexemes, <=18 fractional digits, exact rational total then ceil once. Numeric catalog projections are not billed-price authority. |
| Pi sparse thinking-map broadening | Installed pi-ai models.js:554 accepts omitted basic levels and clamps; OpenAI chat may map absent off to none. Source maps stay facts only. Explicit null denials in generated Pi config plus exact prelaunch/final-wire guard; no automatic clamp, mandatory reasoning off refuses. P2D/E add negative tests. |
| Unresolved break-glass authority | Empty initial bypass set; every override refuses. No guessed privileged owner token. |
| Fabricated family/privacy/quality evidence | Required unknown facts refuse. Initial governed entry public-only; internal/restricted refuse regardless of policy declarations. |
| L6 legacy bypass | Every governed v0/v1 launch entry refuses L6/aliases before initialization, discovery or inference; missing legacy intent refuses. P3/P4 deferral forbidden. |
| Static tests mistaken for live completion | Public synthetic offline milestone has fake sender incapable of network, non-exported test wiring and no production bypass flag. Actual public activation needs separate authentic evidence. Full HRO live exit remains unchanged. |

## Permit and persistence boundary

The trusted P2C controller loads/authenticates policy/evidence, invokes the owner
resolver, reserves through P2B, and alone mints private-registry permit identities.
Claims bind request/task/lane/version/public classification, exact model/protocol/
endpoint, policy/config/catalog/runtime digests, evidence expiry and budget scope.
The final owned wire descriptor/digest is verified after transforms, before
consumeAndSend. A changed wire request needs fresh authorization. Durable consume
then sole private sender invocation is the irreversible local boundary. Any error
after consume is uncertain unless that sender proves no-send; caller errors,
HTTP status, missing response, timeout, abort and restart are not such proof.
No automatic fallback after uncertain transmission.

Same-process trusted ports are the trusted computing base. A task or extension
cannot obtain keyless mint authority merely by reproducing an object shape.
No untrusted callback executes between final verification/consume and sender.
Audit serialization has no permit authority. HMAC would require key custody,
rotation and durable anti-replay anyway; it is explicitly deferred, not an
unimplemented initial requirement.

## Exact money versus provider charges

Ledger request pricing evidence contains original bounded decimal strings (or
validated exact numerator/denominator), units, authenticated source/profile digest,
applicable tariff and per-send conservative input/output/fee bounds. Numeric
PMC/RCM facts may support ratified ranking but never become billed-price authority
through Number.toString(). Mismatched facts/evidence, overprecision, unknown fee,
unsafe magnitude or an unprovable bound refuses. Exact rational charge components
are summed before ceiling to micro-USD. Provider-reported actual charge remains a
separate authenticated settlement observation; conservative rounded liability is
not represented as observed billing. Unknown settlement retains the bound.

## Installed Pi 0.87.1 facts, local inspection only

Package root: D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent.
package.json reports 0.87.1; no module was executed for inventory.

- dist/core/sdk.d.ts:11-55,107: createAgentSession accepts explicit model,
  modelRuntime, thinkingLevel, tools, resourceLoader, settings/session managers.
  Defaults may read settings/choose first model/discover resources; disable them.
- dist/core/model-runtime.d.ts:63-74: exact getModel(providerId,modelId),
  getRegisteredProviderConfig and snapshots exist, not PMC quality/privacy proof.
- dist/core/extensions/types.d.ts:1081,1088,1141: setModel, setThinkingLevel,
  registerProvider exist; assumed beforeLLMTurn/updateModel APIs do not match.
- dist/core/extensions/types.d.ts:1178: ProviderConfig.streamSimple returns
  AssistantMessageEventStream and honors onPayload/onResponse. Its presence alone
  proves neither safely delegated transport nor terminal coverage.
- dist/core/extensions/runner.js:961-988 catches hook exceptions and returns payload.
  Later handlers may replace it. A hook veto is not the authorization gate.
- node_modules/@earendil-works/pi-ai/dist/models.js:554-580 declares omitted
  off/minimal/low/medium/high supported and exposes clampThinkingLevel. P2D/E must
  prevent that behavior from broadening sparse observed catalog profiles.

P2D must freeze exact installed chat-stream types/source mapping before dispatch,
construct the controlled stream, and own the final node:https operation itself.
No hidden built-in provider call is delegated. Version drift refuses.

## Parcel map / bounded file authority

| Parcel | Owns | Exact implementation scope count | Dependencies |
|---|---|---|---|
| [P2A](../../specs/active/PMC-P2A-owner-resolver.md) | Pure versioned owner decision | 6 allowed files | Accepted P1b/RCM public API freeze; version canon already recorded |
| [P2B](../../specs/active/PMC-P2B-durable-budget-ledger.md) | Exact money/durable reservations | 5 allowed files | A contract freeze; no runtime dependency on future controller |
| [P2C](../../specs/active/PMC-P2C-same-process-launch-controller.md) | Private permit and consume/send core | 5 allowed files | Accepted A/B; same-process trusted ports |
| [P2D](../../specs/active/PMC-P2D-openrouter-terminal-transport.md) | One owned chat protocol/HTTPS operation | 6 allowed files | Accepted C, pinned Pi surface |
| [P2E](../../specs/active/PMC-P2E-config-caller-migration.md) | Derived config and governed caller entry | 7 allowed files | Accepted D plus exact caller inventory |

Each requires two independent implementation reviews. All specs remain draft;
P2A becomes candidate-ready after P1 acceptance and API freeze. P2E must name all
caller paths before dispatch and split extra adapters if outside its exact scope.
An unused new entry never proves migration. No files are widened by inference.

## Milestones and residual full-goal work

1. Public synthetic offline conformance: fake sender cannot reach real network;
   fabricated test evidence never authorizes production. No provider spend.
2. Actual public activation: authentic availability, lane quality, capability,
   privacy, endpoints, freshness, budget and installation custody proven under
   applicable existing authorization; reviewed concrete host apply if necessary.

Initial transport cannot execute opencode-pinned L1/L2 or any nonpublic request.
These refusals are intentional limits, NOT completion of the full HRO live exit.
Additional provider/protocol/nonpublic work remains separately bounded and the
full goal remains open. Do not weaken quality/family/privacy or route around a pin
to manufacture a successful demo. No ceremonial user authority re-ask is added.

## Shaping verification

Supersedes the earlier three-spec inventory and HMAC proposal. All five revised
specs passed the existing spec-linter (exit 0 each) on Node 24.19.0 using the
already-installed clean detached checkout linter, explicit target paths and
TSX_DISABLE_CACHE=1. All seven new documents passed whitespace/local-link checks;
tracked charter diff passed git diff --check. Superseded P2B/P2C draft filenames
have no references in the revised specs. Documentation only; no implementation
tests, live evidence, config mutations or commits are claimed. P1 docs unchanged.
