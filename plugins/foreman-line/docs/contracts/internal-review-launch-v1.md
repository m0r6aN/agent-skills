# Internal review launch v1 — proposed contract

**Contract ID:** `internal-review-launch/v1`
**Status:** DRAFT / NOT RATIFIED / NOT AN EXECUTION PATH
**Owner:** Clinton Morgan; drafting coordinator Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`
**Source baseline:** `77318a0921b68f6199d9b4db7277c0a53976e2c7`
**Draft authority:** `../goals/internal-frontier-review-admission/owner-ir-p0-drafting-2026-10-11.md`
**Companion amendment:** `../goals/internal-frontier-review-admission/ir-p0-contract-and-bootstrap-amendment.md`

This document specifies a proposed, additive authority/runtime boundary. MUST/MUST NOT describe the candidate contract if ratified; they do not authorize code, inference, credentials, receipt issuance or activation today. Draft publication/merge alone does not ratify this contract. The old resolver, public v1 controller, lane/provider schemas and normal CLI dispatch remain unchanged. No existing receipt is converted or treated as a companion permit.

## 1. Exact initial scope

| Field | Only admitted value / bound proposed for v1 |
|---|---|
| Workflow goal / purpose | `operator-developer-cortex-memory` / `initial-plan-review` |
| Lane / role family / sub-role | `L2` / `verifier` / `adversarial-reviewer` |
| Routing class / capability tier | `architecture/risk` / frontier |
| Data class | `internal`, credential-free, no customer/restricted payload |
| Provider / primary | `anthropic` / `claude-fable-5-1` |
| Sole fallback | `anthropic` / `claude-opus-5-5` |
| Model-family exclusion | `openai` on both legs; verified exact identities, no provider aliasing |
| Selected auth mode | `subscription-oauth`, owner choice; exact plan/terms/permission evidence still required |
| Thinking requirement | `xhigh`; supported requirement -> permit -> selected runtime -> executed request mapping, no downgrade |
| Context capability floor | 200,000 tokens for each leg |
| Per-attempt cumulative maxima | 48,000 input tokens; 8,000 total output/reasoning tokens across all requests/turns |
| Attempts / fallback | At most one primary and one fallback attempt; no hidden retries or alternate route |
| Aggregate money | USD 5.00 review ceiling INCLUDING both attempts/any separately admitted probes, inside actual remaining USD 25.00 P0 lifecycle allowance |
| Draft additional pacing limits | At most eight provider requests and 30 minutes per attempt; at most 60 minutes across the review; expiry/end does not prove billing ceased |

The pacing limits are new PROPOSED restrictions, not previously granted values. Every provider request belongs to one declared attempt and consumes its cumulative limits; a tool turn is not a fresh budget. No G6 owner seat, builder, coordinator, completed-P0 review roster, migration review or other goal/lane/data/provider is covered. This pair is one review route, not two family-independent architecture-review seats.

## 2. Required envelope and trusted authority

The future closed schema MUST reject absent/null/unknown/mismatched fields, undeclared keys and unsupported versions. The normative record groups below require exact values, not permissive defaulting. No executing schema/type module is introduced by this draft.

| Record group | Mandatory contents / meaning |
|---|---|
| Identity | contract version, workflow goal/purpose, task ID, fresh reviewer instance ID, author family, role/lane/class/data, exact pair and excluded families |
| Packet | immutable source commit, packet manifest ID/digest, ordered evidence entry IDs/digests/byte lengths/token bounds, total bounds, fixed review mandate and canon refs |
| Owner authority | accountable human, actual ratification/dispatch authorization refs, exact scope and revocation/expiry record; no inference from prose confidence |
| Installation | exact Pi package version/source digest, Node/runtime/dependency-lock digests, owned worker/broker/evidence-reader/ledger installation identity, mapping/isolation proof refs |
| Account policy | exact auth mode, plan/organization and applicable terms version, permission for this application/automation/credential-handling arrangement, evidence for required data controls, freshness/expiry |
| Capability | fresh source-backed model identity/family/frontier/context/tool/plain-findings/thinking/quality/suitability evidence for BOTH legs |
| Accounting | one parent P0 lifecycle ledger identity, one review subcap identity, actual reconciled balances/liabilities, bound/tariff/fees or verified subscription marginal-charge arrangement, attempt ceilings |
| Result custody | trusted coordinator return destination, bounded artifact shape, observed execution identity/usage refs, immutable review subject and starting/ending isolation state |

An owner record or content digest is not itself an executable capability. A trusted owner-controlled authority port MUST issue a single-use permit after checking those groups and the ratified bootstrap/installation state. The owned broker MUST authenticate that issuer and atomically claim the permit for its specific task/instance/attempt; a caller-recomputed hash or arbitrary JSON receipt MUST NOT pass as issuer authentication. Implementation must explicitly pin the issuer/custody mechanism before construction; this draft does not invent a new signing scheme or assert existing hash receipts provide it.

Trusted ledger/authority decisions remain outside model-controlled context. Recalled memory, source files, issue text, provider responses and reviewer output are untrusted evidence, never instructions to widen permissions. Revocation or changed packet/installation invalidates admission; completed/expired permits cannot be replayed.

## 3. Subscription/OAuth eligibility gate — presently held

The owner selected subscription/OAuth. This contract MUST NOT silently switch to API-key billing, extract/reuse a native application's tokens, impersonate Claude Code, spoof client identity/headers or bypass provider limits. Neither a working OAuth token nor a catalogue entry proves permitted application use.

Before credentials or network, the trusted installation MUST establish:

1. The actual subscription plan/organization/terms and applicable explicit permission for the proposed Pi application, automated review and credential-handling arrangement. Native Claude Code/official application permission is not Pi SDK permission.
2. Required `data_collection: deny` / `zdr: true` controls apply to the exact account/route/packet, under accepted current evidence. Consumer training opt-out, commercial branding and encryption do not establish ZDR or unconditional no-training. Any proposed change to these obligations requires a separate explicit amendment; no waiver is included here.
3. A genuine enforceable bound for all marginal charges/fees/additional usage and relevant subscription allocation. API list prices do not price OAuth usage. A prepaid subscription is not proof of zero marginal charge or a reservation mechanism. Quota exhaustion cannot trigger paid extra usage, API fallback, plan upgrade or a reset budget automatically.

Public-source/current-owner evidence is in `../goals/internal-frontier-review-admission/oauth-eligibility-evidence-2026-10-11.md`. Exact plan/account controls and permission are not proved. The current disposition is HOLD before any credential resolution or provider request. Human bootstrap approval cannot waive Anthropic's terms, supply nonexistent ZDR or infer subscription billing. Auth/transport changes need separate owner approval and fresh account/eligibility evidence, not an in-place v1 mode substitution.

## 4. Fresh worker / evidence isolation

A controlled Pi SDK child is proposed only under the scoped amendment, never a default CLI/SDK bypass. It MUST use an exact admitted model/runtime with fresh in-memory session/settings, explicitly supplied resources and an exact one-tool allowlist: `read_evidence(entryId)` over immutable preapproved packet entries.

- No inherited history/compaction, ancestor settings/prompts/skills/AGENTS discovery, extensions, MCP, codemode, tool search, extra tools, ambient credentials, automatic retries or model switching.
- No shell, edit/write, arbitrary path read, git, environment or model-accessible network tools. The child cannot fix/commit/register/approve/merge or persist its own authority/result.
- The evidence tool accepts only exact manifest IDs, not paths/URLs supplied by the model; it verifies byte/digest/size/token bounds and denies foreign IDs, traversal, links, changed bytes and unsupported encodings. Tool-result content remains untrusted review evidence.
- Child filesystem/process/network isolation is enforced by the owned host/broker installation, not just the prompt or `.claude` profile. Actual platform-level confinement and proof must be specified in the implementing parcel; absence is `INSTALLATION_UNPROVEN`. A fresh worktree or ResourceLoader alone is insufficient.
- Credentials remain outside prompts/results/logs and outside child resource discovery. Only the owner-approved provider boundary may access them after admission; this does not permit handling subscription tokens where provider terms disallow it.
- The exact package/runtime must be approved and digest-pinned before implementation/activation; installed Pi 1.1.0 is a compatibility candidate, not an admitted build. No default resource loader or broad `+tool` augmentation.

The standard standing constraints still apply where compatible; they do not grant this restricted reviewer live hostile-process probing or shell authority. Such tests belong to a separately scoped authorized verification phase.

## 5. Owned request boundary and durable money limits

The worker proposes requests; the trusted broker verifies exact identity/thinking/tools/packet-derived context and permits only the approved first-party endpoint/account arrangement. Model-selected provider routing, silent failover, auth fallback and extra egress are denied. Actual selected and executed identities must be observable independently of model self-report. Unknown execution identity or capability compatibility refuses before send, not a post-hoc disclaimer.

Before EACH request, the owned broker MUST:

1. Determine worst-case source-backed billable usage for that request, including repeated prompt/tool context, input/cache write/cache read/output/reasoning and fees where billed; missing billable ceilings or tariff precision refuse. Hidden provider usage is not estimated as zero.
2. Check remaining attempt token/request/time ceilings AND durably reserve the worst-case monetary liability against both the USD 5 review subcap and the actual parent P0 remainder as one serialized atomic accounting action. No independently reset/double-spend child budget. Existing scopes/money primitives are usable only where ownership/atomicity actually fits; no claim that flat scopes supply hierarchy.
3. Atomically consume the single-use request capability before send. A crash between reservation and send records uncertainty; a transport retry is not allowed just because a local acknowledgement is missing.
4. Settle verified actual usage/fees, retaining uncertain reservations. Cancellation, timeout, connection loss or SDK completion does not prove provider billing stopped. Unknown liability stops further requests/fallback until reconciled.

A primary is never retried under another ID. A fallback is a fresh bounded attempt only when the primary cannot provide a usable completed review, its liability is reconciled, both legs' eligibility remains current and sufficient shared allowance remains. A completed primary review ends this route; no extra fallback used as a second reviewer. A fallback receives the original approved subject/mandate, not the primary's analysis or the author's conversational history. Its separate accounting/custody metadata remains outside review reasoning. When both attempts are unavailable/fail, stop. New probes consume an explicit separately granted allocation inside applicable aggregate caps; this contract grants none.

## 6. Proposed states / no-send failure semantics

| State | Meaning / allowed next transition |
|---|---|
| `draft` | Document only; no capability. Ratification alone may permit later offline construction, not sends. |
| `held` | Missing authority/account/data/capability/install/bound facts; no credentials/network. Return non-secret reason refs. |
| `admitted` | Ratified contract, externally authorized exact installation/packet, verified evidence, trusted one-use permit; not model-authored. |
| `reserved` | Both caps durably reserve request liability and token/time limits verified. |
| `sending` | Single-use request claimed before send; loss/crash becomes `uncertain`, never automatic resend. |
| `uncertain` | Unknown billable usage/result/identity; retain liabilities, stop and reconcile with trusted evidence. |
| `settled` | Actual usage bound/fees/identity observed; request complete, same attempt may continue only within every aggregate bound. |
| `completed` | Bounded usable findings plus valid custody/usage and ending isolation state; coordinator receives, not auto-accepts. |
| `refused` | Known invalid/expired/replayed/forbidden input; no capability. If any prior send occurred, its liability remains independently tracked. |

Refusal reasons are separately attributable: `AUTHORITY_UNPROVEN`, `OAUTH_APPLICATION_PERMISSION_UNPROVEN`, `DATA_CONTROLS_UNPROVEN`, `CAPABILITY_UNPROVEN`, `INSTALLATION_UNPROVEN`, `BILLABLE_BOUND_UNPROVEN`, `BUDGET_EXHAUSTED`, `PERMIT_REPLAY_REFUSED`, `PACKET_MISMATCH_REFUSED`, `EXECUTION_IDENTITY_UNPROVEN`, `USAGE_UNCERTAIN`. These are proposed v1 vocabulary, not codes executed/emitted by this draft. Unknown and denied facts remain distinct; no fabricated success/receipt.

## 7. Result contract

The trusted host returns: packet/task/attempt refs; actually selected and executed provider/model/thinking/runtime/instance; bounded findings keyed to exact source/AC locators, severity/rationale and disposition suggestions; actual usage/fees or explicit uncertainty; permit/ledger/custody references; starting/ending isolation and mutation evidence. Reviewer prose does not supply execution identity, monetary proof or acceptance authority.

Plain findings require no native structured-output model capability. The host's result validation does require a bounded declared artifact format, safe delimiters and no credential/payload dumps. Missing/truncated result is incomplete, not a passing review; partial results may be preserved with that label and unresolved liability. Coordinator persists/triages only after custody validation. The reviewer never fixes or commits.

## 8. Bootstrap / acceptance / expiry

The bootstrap proposal is external to this launcher and owner-ratified only at an exact immutable head: `../goals/internal-frontier-review-admission/ir-p0-contract-and-bootstrap-amendment.md`. The current drafting grant approves NO construction exception. The proposed first exception covers IR-P1 offline admission fixtures only, not provider/worker installation, live proof or operation.

Each later code phase requires an exact manifest, authority, runtime/platform trust boundary, deterministic negative controls and required independent security/architecture review. Synthetic public live proof, any provisional review-use exception and ordinary internal operational use are distinct, separately bounded gates. Neither fixture records nor a human offline check are frontier reviews. This new launcher cannot issue its own bootstrap approval or rate its implementation accepted. One successful plan review does not certify the launcher or P0.

Required negative controls include both legs' family/model/auth/data/thinking/context/capability failures; forged/replayed capabilities; path/link/resource escapes; prompt-injected tool/model changes; all-turn cache/reasoning billing; exhausted subcap/parent cap; quota/extra-usage substitution; reservation/send/ack crashes; result/identity forgery; and unchanged public-v1 refusals. No implementation/test result is asserted here.

For eventual admission, every evidence item has an explicit validity interval and trusted revocation reference. Expired/changed terms, packet, installation, account controls, tariff/bound or authorization returns to `held`; it does not rewrite old evidence. Removal/rollback of the companion leaves legacy/public-v1 behavior intact. Ratification applies only to the exact reviewed version; no general router, lane re-pin, API migration or future model grant follows.
