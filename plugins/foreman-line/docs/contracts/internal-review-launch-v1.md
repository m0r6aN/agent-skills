# Internal review launch v1 — native Pi revision

**Contract ID:** `internal-review-launch/v1`
**Status:** REVISED DRAFT / SCOPED OWNER DECISIONS RATIFIED / FULL IR-A01 HEAD RATIFICATION PENDING / NOT AN EXECUTION PATH
**Owner:** Clinton Morgan; coordinator Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`
**Source baseline:** `846179a7e54ea4df49d72badd11b937f739ef0bb`
**Revision authority:** `../goals/internal-frontier-review-admission/owner-native-pi-decisions-2026-10-11.md`
**Companion amendment:** `../goals/internal-frontier-review-admission/ir-p0-contract-and-bootstrap-amendment.md`

The owner disposed the Pro/settings facts and scoped data/accounting/native-provider/reasoning choices. This exact revision implements those choices; it does not silently adopt the entire draft. IR-B01 offline scope is conditionally approved, requiring explicit whole revised-contract ratification FIRST. Publication/merge is not that ratification. MUST/MUST NOT below specify the candidate contract after adoption, not authority for code, inference, credentials, receipts or activation today. Legacy resolver/public-v1 schemas/refusals and normal CLI dispatch remain unchanged; old receipts never become companion permits.

## 1. Exact initial scope

| Field | Admitted value / bound |
|---|---|
| Workflow / purpose | `operator-developer-cortex-memory` / `initial-plan-review` |
| Lane / role family / sub-role | `L2` / `verifier` / `adversarial-reviewer` |
| Routing class / tier | `architecture/risk` / frontier |
| Data class / policy | `internal`; owner's own credential-free initial-review material; exclude customer/client/restricted/regulated data; `owner-accepted-subscription-policy`, NOT ZDR |
| Provider / primary | `anthropic` / `claude-fable-5-1` |
| Sole fallback | `anthropic` / `claude-opus-5-5` |
| Family exclusion | `openai` on both legs; exact identities, no namespace aliasing |
| Auth/provider | Installed Pi native Anthropic provider/OAuth mechanics ONLY, Pro; owner reports already authenticated, model improvement OFF and paid extra usage OFF for this work; NO separate broker |
| Reasoning | Highest VERIFIED native setting per exact model; retain `xhigh` if it is the verified highest compatible setting, otherwise record the supported setting/mapping explicitly; unknown/unsupported mapping refuses |
| Context floor | 200,000 tokens for each leg |
| Per-attempt cumulative maxima | 48,000 input; 8,000 total output/reasoning tokens across all requests/turns |
| Attempts | At most one primary and one fallback; no hidden retry or alternate route |
| Incremental money | USD 5.00 review ceiling INCLUDING both attempts/any separately admitted probes, inside actual remaining USD 25.00 P0 lifecycle allowance; exclude already-paid subscription fee; quota tracked separately |
| Paid transitions | No paid extra usage, API fallback, upgrade or automatic budget reset |
| Proposed pacing | At most eight provider requests / 30 minutes per attempt; at most 60 minutes total; expiry/cancellation does not prove quota/billing stopped |

Eight-request/30-minute pacing remains a PROPOSED restriction pending whole IR-A01 ratification. Each request/tool turn consumes the same cumulative attempt bounds. No G6, builder/coordinator, completed-P0 roster, migration review, other goal/lane/data/provider is covered. This pair is one review route, not two family-independent architecture-review seats.

## 2. Closed envelope / trusted external authority

A future closed schema MUST reject missing/null/unknown/mismatched fields, extra keys and unsupported versions. No executing schema/type module is created by this revision.

| Record group | Required contents / meaning |
|---|---|
| Identity | Version, goal/purpose/task ID, fresh instance ID, author family, role/lane/class/data/policy, exact pair/excluded families |
| Packet | Immutable source commit, manifest ID/digest, ordered evidence IDs/digests/byte lengths/token bounds, total bounds, fixed mandate/canon refs |
| Owner authority | Actual scoped decisions, whole IR-A01/dispatch authorization refs, accountable human, exact scope/revocation/expiry |
| Installation | Exact Pi native-provider/package/runtime/dependency-lock digests; review-host/admission/evidence/accounting installation identity; mapping/isolation proof; no new auth/HTTP broker |
| Account policy | Owner-attested Pro/OAuth/settings/readiness refs, applicable provider-use terms/evidence, exact accepted retention/training scope, freshness/change record; no ZDR claim |
| Capability | BOTH models' source-backed identity/family/frontier/context/tools/plain-findings/native-reasoning/quality/suitability evidence |
| Accounting | One parent P0 lifecycle identity and one review subcap; reconciled incremental balances/liabilities, permitted included-quota basis and paid-transition denial; quota/token observations separately |
| Result custody | Trusted coordinator return destination, bounded shape, observed execution/usage refs, immutable subject and starting/ending isolation state |

A decision record/digest is not an executing capability. A trusted owner-controlled authority port MUST issue a single-use permit only after the ratified bootstrap/installation and envelope checks. A host-side admission gate around the native Pi invocation MUST authenticate that issuer and atomically claim the task/instance/attempt permit. It MUST NOT replace Pi's provider/auth implementation. Arbitrary JSON/recomputed hashes are not issuer authentication. The exact issuer/custody mechanism must be pinned in the implementing scope; no new signing scheme or authenticity claim about old hash receipts is invented here.

Authority/accounting remain outside model context. Memory, files, issue text, provider/reviewer output are untrusted evidence, not permission. Revocation, changed packet/installation or expired evidence invalidates admission; consumed permits cannot replay.

## 3. Native Pi Pro/OAuth and scoped data policy

Authentication setup is NOT an outstanding owner decision: the owner reports already-authenticated Pi on Pro with model improvement/paid extra usage off. Accept those as OWNER ATTESTATIONS, not independently inspected settings. No new login/API key, credential copies/export, custom OAuth flow, runtime API-key override, account/config edits, provider emulation or silent billing substitution. Ordinary selected-auth/refresh behavior remains Pi's responsibility after a future admitted launch; this revision instantiates nothing.

The owner ratified `owner-accepted-subscription-policy` for ONLY their own internal credential-free initial OPMEM review packet. It replaces the absolute `data_collection: deny` / `zdr: true` obligation ONLY inside this companion/use-case; it neither edits those values in legacy/global/public-v1 policy nor claims them satisfied. Exclude customer/client/restricted/regulated data and keep `internal` classification. Applicable consumer retention is nonzero (published ordinary improvement-off policy describes 30 days), with disclosed safety-review/feedback exceptions. Opt-out is not unconditional no-training/ZDR. No feedback upload, unrelated history or broader dataset is authorized. Changed settings/terms or out-of-scope content invalidate eligibility.

Before any native provider invocation, the trusted review host MUST establish:

1. Applicable provider-use permission/terms for the installed Pi integration and automated review. Technical auth support is distinct from provider permission. No special agreement was supplied; local owner consent cannot override Anthropic's terms. Assess actual native-path evidence rather than declare all OAuth uses forbidden or automatically accepted.
2. The exact packet complies with the accepted scope/settings/retention conditions. Record owner facts separately from observed runtime evidence; no repeated approval of unchanged disposed choices, no fabricated measured privacy guarantee.
3. Native Pi is pinned to the exact approved model/OAuth mode, with no ambient API/cloud fallback, paid transition, upgrade or unrestricted configuration/resource discovery. Selected-auth/identity evidence must be non-secret. If native APIs cannot establish required controls without exposing tokens or replacing auth/provider mechanics, hold/report that seam, never add a broker.
4. Included-quota/incremental-charge and all token/request/time/isolation/custody controls are enforceable. Owner attestations alone do not prove runtime identity, balances or cancellation behavior.

Latest authority is `owner-native-pi-decisions-2026-10-11.md` in the task directory. Historical public evidence at `oauth-eligibility-evidence-2026-10-11.md` is preserved; unknown-plan/absolute-ZDR assumptions are superseded only above. Whole revised IR-A01 ratification, provider-use evidence and actual native-runtime/capability/isolation/accounting/custody remain operational holds. No credential files or native provider runtime are opened/instantiated in this document/offline-prototype phase.

## 4. Fresh worker / native resource isolation

A controlled Pi SDK child is proposed only under the scoped amendment, never a default/direct launch. Exact model/runtime, fresh in-memory conversation/settings, explicitly supplied resources and one tool only: `read_evidence(entryId)` over immutable approved packet entries.

- No inherited history/compaction, ancestor prompts/settings/skills/AGENTS, extensions/MCP/codemode/tool search, extra tools, automatic retries/model switching. The ONLY intentional native-auth exception is the owner's Pi-managed Anthropic Pro/OAuth path outside model-accessible context/tools; no ambient API/cloud auth fallback.
- No shell/edit/write/git/environment/arbitrary-path/network tool. The model cannot fix/commit/register/approve/merge or persist authority/results.
- Evidence accepts exact manifest IDs, never model-supplied paths/URLs; enforce byte/digest/size/token bounds and deny foreign IDs, traversal, links, changed bytes and unsupported encodings. Content remains untrusted review evidence.
- Actual filesystem/process/network isolation is enforced by the review host/native Pi integration, not a separate broker, prompt, profile, worktree or ResourceLoader alone. Platform-level confinement and proof must be specified in implementing scope; absence refuses.
- Native credentials remain outside prompts/results/logs/model resources. Leave selected-auth/refresh to Pi after admission; no assistant raw auth/settings/model-store/session reads, token copying or global mutations. Non-secret metadata only for auth/control evidence.
- Pin approved package/runtime/digests before implementing/activating; installed Pi 1.1.0 is a compatibility candidate, not admitted proof. No default resource loader or `+tool` augmentation treated as an allowlist. Normal Pi API-key examples/retries are NOT adopted.

Standing constraints remain where compatible; their general probing license does not grant this restricted reviewer shell/live-process authority. Such tests need separate verification scope.

## 5. Native invocation gate / incremental-charge accounting

The host-side gate validates identity/native reasoning/tools/packet context before invoking installed Pi Anthropic. Add admission/observation/accounting only: no new credential manager, OAuth/HTTP proxy, provider implementation or separate broker. Deny model routing/silent failover/auth fallback/extra egress. Independently observe selected/executed identity/reasoning. If native Pi lacks a required pre-send/token/usage/custody control, hold for exact implementation disposition, not simulated enforcement.

USD 5 review / USD 25 P0 caps measure attributable INCREMENTAL CHARGES; exclude already-paid subscription fees. Keep shared review/parent identities and reconcile prior liabilities; never invent zero spent balance. Quota is separate from dollars. Pi catalogue/API-price estimates are NOT subscription invoices or marginal-charge evidence. Accepted paid-extra-off attestation is a control fact, not measured billing or proof that every native third-party request is included in plan allocation.

Before EACH native request the host MUST:

1. Establish the permitted included-quota basis/no paid transition for this exact native Pi/account path using source evidence, accepted controls and non-secret runtime selection. Unbounded/unknown additional-charge exposure refuses. No positive paid-extra/API/upgrade transition is authorized even below the dollar caps.
2. Check every cumulative token/request/time ceiling including repeated prompt/tool/cache input and output/reasoning; hidden/unknown usage is not zero. Durably record quota observations and incremental exposure/allowance against BOTH parent/subcap. Reserve genuinely unresolved liability as one serialized atomic action; existing flat scopes do not automatically provide hierarchy, and child budgets never reset.
3. Atomically consume request capability before native invocation. Crash/lost acknowledgement is uncertainty, not retry permission; do not replace Pi auth to implement this control.
4. Record actual tokens/quota and incremental-charge status/basis, distinguishing observed usage, included-quota expectation, API cost estimate and confirmed charge. Missing per-request dollar invoice in a proved included-quota mode is not automatically a positive unknown charge; contradictory/unknown additional exposure IS a stop. Cancellation/timeout/connection loss/SDK completion does not prove quota/fees stopped; retain/reconcile uncertainty before continuation/fallback.

No primary retry under another ID. Fallback is fresh only if primary cannot yield usable completed review, exposure is reconciled, both legs remain eligible and shared allowance suffices. Completed primary ends this route; fallback is not a second reviewer. Fallback gets original approved subject/mandate, not primary analysis/author history; custody/accounting metadata stays outside reasoning. Both fail/unavailable => stop. New probes need separate explicit scope/allocation inside applicable caps; none is granted here.

## 6. States / no-send failure semantics

| State | Meaning |
|---|---|
| `draft` | No capability; partial scoped decisions/conditional IR-B01 are not full IR-A01 adoption. |
| `held` | Missing contract/authority/permission/native capability/install/bound facts; no credentials/network; return non-secret reason refs. |
| `admitted` | Ratified contract/external installation authority/packet/evidence and trusted one-use permit; not model-authored. |
| `reserved` | Shared incremental exposure durably accounted under both caps and quota/token/time bounds checked. |
| `sending` | Capability claimed before native send; loss/crash becomes uncertain, never automatic resend. |
| `uncertain` | Unknown usage/additional exposure/result/identity; retain liabilities, stop/reconcile. |
| `settled` | Actual usage/charge status/identity observed; continuation only within every cumulative limit. |
| `completed` | Usable bounded findings/custody/usage/ending isolation; returned to coordinator, not auto-accepted. |
| `refused` | Known invalid/expired/replayed/out-of-scope input; no capability; any prior-send liability persists. |

Candidate reasons: `AUTHORITY_UNPROVEN`, `PROVIDER_USE_PERMISSION_UNPROVEN`, `DATA_SCOPE_REFUSED`, `ACCOUNT_CONTROLS_CHANGED`, `CAPABILITY_UNPROVEN`, `INSTALLATION_UNPROVEN`, `INCREMENTAL_CHARGE_BOUND_UNPROVEN`, `QUOTA_EXHAUSTED`, `BUDGET_EXHAUSTED`, `PERMIT_REPLAY_REFUSED`, `PACKET_MISMATCH_REFUSED`, `EXECUTION_IDENTITY_UNPROVEN`, `USAGE_UNCERTAIN`. Draft vocabulary, not codes executed/emitted now. Accepted scoped policy MUST NOT be refused solely because it is not ZDR; out-of-scope data MUST NOT borrow the exception.

## 7. Result contract

Host returns immutable task/packet/attempt refs, actual selected/executed provider/model/native reasoning/runtime/instance, bounded findings with exact source/AC locators/severity/rationale/disposition suggestions, observed token/quota and incremental-charge status/basis/uncertainty, permit/accounting/custody refs, starting/ending isolation/mutation evidence. Reviewer prose cannot prove identity/charges or grant acceptance.

Plain findings need no native structured-output model capability; host result format is bounded with safe delimiters and no secret/payload dump. Missing/truncated output is incomplete, not passing; preserve partial output/uncertainty honestly. Coordinator persists/triages after custody validation; reviewer never fixes/commits.

## 8. Bootstrap / acceptance / expiry

External bootstrap text is `ir-p0-contract-and-bootstrap-amendment.md` in the task directory. Owner conditionally approved IR-B01 exact ten prototype/two evidence paths and limits; it is DORMANT until whole revised IR-A01 is explicitly ratified first, then Step 0 disposition. Do not re-request unchanged IR-B01 scope. No native provider/worker integration, live proof or operational use is covered.

Later phases require exact manifests, native runtime/platform/issuer/control seams, deterministic negative controls and required independent architecture/security reviews. PUBLIC synthetic proof, provisional review-use exception and ordinary INTERNAL use are separate bounded gates. Fixtures/human offline check are not frontier reviews; this launcher cannot authorize or accept itself. Initial successful OPMEM plan review does not certify the launcher/P0 or supply a two-seat roster.

Negative controls: both models' family/identity/native auth/data scope/reasoning/context/capability failures; forged/replayed permits; path/resource escapes/injected tool changes; all-turn cache/reasoning/parent-subcap accounting; quota/extra-use/API substitution; included-quota estimate misrepresented as invoice; accepted-policy falsely refused solely for absent ZDR; out-of-scope data falsely allowed; send/ack crashes; result forgery; unchanged old public-v1 refusals. No implemented test/verification verdict asserted.

Evidence has explicit validity/change/revocation references. Changed/expired packet/runtime/terms/settings/usage basis/authority returns to held without rewriting history. Companion rollback leaves old paths intact, revokes permits and preserves liabilities/evidence. The owner-accepted subscription exception remains purpose-bound, never a global default. No general router, lane re-pin, API migration, provider-terms waiver or future model grant follows.
