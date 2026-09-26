---
ticket: RCM-P1B
title: Scoped public-observation canonical snapshot producer
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Produce digest-bound, explicitly scoped canonical RCM snapshots from retained
public metadata using reviewed exact extraction profiles. Every requested
identity has either complete facts or a named refusal. No partial source is
advertised as a full catalog. The retained v4 mapping and public API are ratified;
the independent contract review and scoped Gate 2 are recorded below.

## Constraints

Requires merged RCM-P1 and accepted P1A wrapper contract. No acquisition/network,
unapproved inference, credentials, raw host documents, filesystem/config writes or policy
changes inside the producer. Caller supplies bytes, evidence, requested IDs and
time. Use Node 24.19.0 and existing dependencies. Scope at most 256 requested
provider/ID pairs; no implicit model discovery or promotion. No changes to the
historical P1 spec/schema/reader/projector in this parcel.

## Contract

Frozen API shape (scoped private implementation under Gate 2 below):

```typescript
type Identity = Readonly<{ provider: string; id: string }>;
type ProducerCandidate = Readonly<{
  manifestBytes: Uint8Array;
  projectionBytes: Uint8Array;
  requestedIdentities: readonly Identity[];
  evaluationTimeUtc: string;
}>;
type ProducerTrust = Readonly<{
  profileId: 'openrouter-conservative-rcm-v1-intersection';
  profileVersion: 'v2';
  sourceEvidenceRef: string;
  expectedManifestSha256: string;
  expectedProjectionSha256: string;
}>;
type AcceptedSource = Readonly<{
  profileId: string; profileVersion: string; canonicalSha256: string;
  sourceEvidenceRef: string; sourceEvidenceSha256: string;
  requestedIdentities: readonly Identity[];
}>; // exactly the P1A closed object; no additional fields
type InventoryStatus = 'complete' | 'absent' | 'missing-required-facts'
  | 'source-invalid' | 'unsupported-profile';
type InventoryCode = 'COMPLETE' | 'IDENTITY_ABSENT'
  | 'REASONING_UNKNOWN_REFUSED' | 'REQUIRED_FACT_MISSING'
  | 'SOURCE_INVALID' | 'UNSUPPORTED_PROFILE';
type FactField = 'identity' | 'baseUrl' | 'api' | 'input' | 'reasoning'
  | 'contextWindow' | 'maxTokens' | 'cost' | 'thinkingLevelMap';
type InventoryEntry = Readonly<{
  provider: string; id: string; status: InventoryStatus;
  code: InventoryCode; fields: readonly FactField[];
}>;
type ProducerRefusalCode = 'INPUT_INVALID' | 'INPUT_LIMIT_EXCEEDED'
  | 'DIGEST_MISMATCH' | 'UNSUPPORTED_PROFILE' | 'SOURCE_INVALID'
  | 'OBSERVATION_TIME_REFUSED' | 'INCOMPLETE_SCOPE' | 'CANONICAL_READER_REFUSED';
type ProductionResult =
  | Readonly<{ ok: true; evidenceOnly: true; canonicalBytes: Uint8Array;
      digestSha256: string; acceptedSource: AcceptedSource;
      inventory: readonly InventoryEntry[]; sourceInventory: readonly InventoryEntry[] }>
  | Readonly<{ ok: false; evidenceOnly: true; code: ProducerRefusalCode;
      inventory: readonly InventoryEntry[]; sourceInventory: readonly InventoryEntry[] }>;
declare function producePublicObservationSnapshot(candidate: unknown, trusted: unknown): ProductionResult;
```

Both arguments are runtime-validated closed objects. The coordinator supplies
`trusted` separately from candidate bytes; a manifest's own digest/profile text
cannot establish its acceptance. Copy trusted pins before inspecting candidate
content. Hash each owned exact byte copy and compare with its independently
accepted expected digest before decoding it. Verify manifest.sealedProjection
sha256/byteLength also matches projection bytes. This nested link supplements,
never replaces, the independent projection pin. `sourceEvidenceRef` names the
versioned retained manifest; output snapshot.sourceRef and
acceptedSource.sourceEvidenceRef equal that exact trusted reference;
acceptedSource.sourceEvidenceSha256 equals expectedManifestSha256.
The producer proves consistency with accepted evidence, not authenticity of a
caller-provided trust object. Trust cannot be inferred from candidate input.

Exactly one initial profile is supported: the pair above maps exactly to retained
sourceProfile `openrouter-conservative-rcm-v1-intersection-v2`. Do not split,
normalize or guess profile names. IDs/references are opaque case-sensitive strings;
reject empty, whitespace-only or surrounding-whitespace strings. Requested scope
is 1..256 unique provider/ID pairs, with collision-free tuple equality and original
order. An OpenCode identity is unsupported-profile, never enriched from OpenRouter.

For every structurally valid requested scope, inventory has one entry per identity
in that exact order, including refusals. Only complete scope can return success.
Source-wide invalidity marks every requested row source-invalid (or
unsupported-profile for an unsupported accepted profile); malformed scope itself
returns INPUT_INVALID and empty inventory because no valid scope exists. No failure
variant contains canonicalBytes, digestSha256 or acceptedSource. sourceInventory
accounts for the manifest's complete sourceScope.requestedIds, in manifest order,
independently of requested subset. It is empty only when the source cannot be
validated, and never claims upstream full-catalog coverage. Per-row fields contain
only the finite FactField names, and complete rows have fields: []. No raw source
values, exception text, endpoints or source prose appear in diagnostic fields.

The seven-row OpenRouter scope therefore fails INCOMPLETE_SCOPE with six complete
entries plus Haiku missing-required-facts/REASONING_UNKNOWN_REFUSED, fields:
['reasoning']. A separately supplied six-row requested scope can succeed while its
sourceInventory still records all seven. Do not derive that smaller scope from the
six available rows. A missing requested OpenRouter identity is absent; an explicitly
retained null projection is missing-required-facts, never absent or reasoning:false.
The retained manifest's eight OpenCode binding rows remain unsupported by this
profile and are accounted for if requested; they are not part of its seven-row
sourceScope. Jev remains excluded and disabled; no optional L6 promotion occurs.

### Retained evidence and closed shapes

Initial reproducible inputs, relative to the RCM goal's source-evidence directory:

- manifest: pmc-binding-coverage-openrouter-20260926-v4.json; SHA-256
  e97f76bb303ac3b19aa8b327695beaf4e0a48c1fa78598d11c468f432f224562;
  12,850 bytes. Its preserved internal evidenceVersion is
  rcm-openrouter-pmc-binding-coverage-v3, despite the v4 filename. Do not rewrite it.
- projection: openrouter-rcm-v1-conservative-projection-20260926.json; SHA-256
  abb09a4078348433e6ebb9c84b2d7a6fe3f83ff4500977ef2de5ce913a384d96;
  13,348 bytes; formatVersion rcm-openrouter-conservative-projection/v1.

The manifest's closed root keys are evidenceVersion, status, generatedAtUtc,
supersedes, sourceScope, ratifiedBindingSource, sealedProjection, mappingProfile,
bindings, correctionMap, assessment. Projection's closed root keys are formatVersion,
sourceProfile, sourceEndpoint, sourceResponseBytesSha256, sourceResponseByteLength,
sourceResponseRun, rows, excludedRefusals, thinkingLevelSemantics. Nested closed key
sets and tagged complete/refused binding variants are exactly those in these pinned
artifacts; implementation must encode them explicitly, not accept arbitrary objects
or cast parsed JSON. Existing historical status/proposal prose stays sealed evidence;
only the separate profile decision supplies acceptance. No raw-fetch response shape
or host converter is accepted by this initial API. Future evidence must retain this
reviewed shape and use new separately accepted pins and original acquisition times.

Validate the complete manifest and projection, not only requested rows. Require
unique row/refusal identities; no overlap; all sourceScope identities accounted for
exactly once across rows/excludedRefusals; counts and coverage agree. Require selected
response run to exist uniquely, status 200, and its response digest/length to equal
projection sourceResponseBytesSha256/sourceResponseByteLength and the sealedProjection
sourceResponseSha256. Require exact acquisition endpoint
https://openrouter.ai/api/v1/models and approved profile agreement throughout.
Retained raw response digest is a custody link; discarded raw bytes cannot be
recomputed or authenticated by this producer. Do not fetch them.

### Field mapping, time and numeric semantics

Closed complete rows contain provider, id, sourceRecordLocator, baseUrl, api,
inputModalities, reasoning, contextWindow, maxTokens, cost, thinkingLevelMap,
sourceProjectionCheckedAtUtc. Refusal rows contain provider, id, sourceRecordLocator,
projectedRcmV1:null, refusalCode, reason; currently the only supported refusal is
REASONING_UNKNOWN_REFUSED. Require exact retained locators as data; never execute
locator text. Map complete rows to RCM facts as follows:

| RCM field | Retained source and validation |
| --- | --- |
| provider, id | Exact row identity; no aliases or namespace replacement |
| baseUrl, api | baseUrl.value and api.value, approved profile constants https://openrouter.ai/api/v1 and openai-completions; execution authority remains separate |
| input | inputModalities.projected, exactly the ordered sourceValue intersection with text/image; residualSourceModalities preserves the complementary ordered source list |
| reasoning | true only with nonempty reasoning.supportedEfforts and the explicit reviewed_profile_inference_from_nonempty_live_supported_efforts status; documentedPerModelSchema remains false |
| contextWindow, maxTokens | Corresponding positive safe-integer value and exact context_length/top_provider.max_completion_tokens locators |
| cost | input/output unit USD per 1M tokens and validated numeric value; retain sourceValuePerToken as evidence |
| thinkingLevelMap | Exact observed max/xhigh/high/medium/low identity mapping, none -> off; omitted levels stay omitted, no minimal/default/clamping |

Reasoning inference is expressly ratified profile behavior; it is neither a
provider-documented catalog-field guarantee nor an unknown value. Empty/absent
efforts are unknown/refusal. A fact map is not Pi config: omitted levels refuse
and mandatory reasoning cannot become off. Provider capabilities beyond text/image
remain residual evidence; intersection does not claim those capabilities absent.

Validate sourceValuePerToken as a nonnegative plain decimal string (no exponent,
sign or whitespace), with at most 64 digits total and 32 fractional digits. Parse
its coefficient/scale exactly, multiply rationally by 1,000,000, and compare against
the exact decimal rational of the retained JSON cost.value token before Number
conversion. Never use binary floating-point multiplication as evidence equality.
RCM v1 accepts finite numbers, not rationals: convert once with documented nearest
IEEE-754 representation; reject overflow, nonzero underflow, and values whose
serialized Number decimal does not preserve the validated decimal amount. Preserve
the original string and exact evidence bytes; do not add rational fields to RCM v1.
The current six rows satisfy this rule, including 0.75 and 3.75.

Preserve original observedRequestStartedAtUtc/observedResponseReceivedAtUtc strings.
Validate real UTC calendars with 1..9 fractional digits, compare without discarding
submillisecond precision, and require start <= complete receipt <= evaluation time.
Evaluation time is exact millisecond UTC ISO. Truncate selected complete receipt
conservatively to milliseconds; verify the manifest canonical timestamps and each
sourceProjectionCheckedAtUtc equal the corresponding truncations. Projection binds
run 2, so checkedAtUtc is 2026-09-26T14:08:44.529Z for these artifacts, not the
manifest generatedAtUtc. If multiple runs contribute, use their oldest receipt for
the affected provider. Refuse future, unknown or age > 86,400,000 ms; equality passes.
Age is observation age, never provider refresh or live availability. Preserve null
providerDeclaredTime. HTTP Date, model creation, mtime, generation and another
source's observation cannot replace receipt time. Successful retained projection
parse and the accepted run declaration establish the retained-observation chain;
no claim is made to reparse discarded raw response bytes.

### Bounds, serialization and ownership

Before byte copy/hash/decode, cap each genuine Uint8Array at 8 MiB and total at
16 MiB, using internal byte lengths rather than caller properties or iteration;
reject proxies, detached/shared or unsupported byte storage. Copy once. Before
materializing unbounded JSON, enforce depth 16, 262,144 visited values including
primitives, 4,096 UTF-16 units per string/key and 1,048,576 aggregate string/key
units with a bounded token pass. Reject duplicate JSON keys, nonfinite numbers,
extra keys, invalid encoding/BOM and trailing non-whitespace. Bounds precede each
allocation/traversal; no truncation. Cap every array at 10,000 entries, source/model
records at 10,000, requested identities/providers at 256, efforts/modalities/thinking
map entries at 64; check each collection count before copying/walking its elements.
Trusted/candidate plain object envelopes reject cycles, accessors, sparse arrays,
extra index-like properties and throwing proxies. Read descriptors into owned
snapshots once, index arrays explicitly, never caller iterators/methods/toJSON.
Catch all hostile boundary failures as typed refusals without reading thrown values.

Construct exactly {formatVersion:'rcm-catalog-snapshot/v1',sourceRef,providers,models}
in that property order; providers follow first requested occurrence, models preserve
requested order. Model keys follow the table, and thinking keys use the fixed order
max,xhigh,high,medium,low,off restricted to observed keys. Cost side keys are unit,value.
Serialize UTF-8/no BOM, two-space JSON and one LF, then hash exact canonical bytes.
Pass bytes and digest through the sole readCatalogSnapshot; reader refusal becomes
CANONICAL_READER_REFUSED, without forging a branded snapshot. acceptedSource contains
only the P1A fields above; canonicalSha256 equals digestSha256 and requestedIdentities
is an owned exact scope copy. P1A separately checks sourceRef/digest/scope and requires
independent approvedConfig. This producer never invokes eligibility or supplies
approvedConfig. Freeze owned plain results deeply; canonicalBytes is a fresh owned
Uint8Array (typed-array elements cannot be frozen), with no retained mutable alias.
Output-byte mutation cannot alter inputs, other calls or its already computed digest.

## Source Mapping Gate

The profile decision openrouter-source-profile-20260926.md ratifies the conservative
v4 mapping, including reasoning inference and six-row scoped production. Independent
review already converted all six rows through the actual RCM reader/projector with
explicitly synthetic endpoint authority. This proves schema compatibility only; it
is not live availability, source freshness at future evaluation time or execution
permission. Dated evidence must naturally become stale; never reset its timestamps.

The accepted P1A API and independent producer-contract review satisfy the shape
prerequisites; Gate 2 below freezes the type names and serialized integration order.
No raw provider parser, acquisition step,
legacy export converter, OpenCode enrichment or schema change is authorized.
## Acceptance Criteria

- Seven-row scope refuses with Haiku null/unknown; separately declared six-row
  scope succeeds and retains the seven-row source inventory. Fifteen-row requests
  additionally account for all eight unsupported OpenCode identities.
- Independent pins reject self-pinning, swapped manifest/projection, changed source
  digests/locators/counts and stale original observations; exact sourceRef and closed
  acceptedSource fields interoperate with P1A without adding authority.
- Test exact and one-over limits for bytes/counts/values/strings/depth, hostile
  proxies/iterators/accessors, duplicate keys/tuples, deterministic ordering,
  ownership, rational price mismatch and no false reasoning default.

- Every requested identity appears exactly once in result inventory. Missing or
  incomplete records cause no canonical success artifact; scoped success never
  claims upstream full-catalog coverage.
- Source/profile/digest/field locators bind reproducible facts; tests reject
  changed bytes, endpoint/profile mismatch, stale/future/unknown required times,
  fabricated capabilities, invalid units and oversized/hostile data.
- Millisecond truncation preserves conservative age; original timestamps remain
  in evidence. Complete real metadata can reproduce exact canonical bytes and
  pass P1 reader/wrapper without asserting execution or live availability.
- Existing P1 schema/refusals/policy remain unchanged. Runtime code has no network,
  filesystem, provider, credential or config side effects.

## Allowed Files

- plugins/foreman-line/routing-policy/src/public-observation-producer.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/public-observation-producer.test.ts
- plugins/foreman-line/routing-policy/tests/fixtures/public-observation-profiles.json
- plugins/foreman-line/routing-policy/README.md

## Out of Scope

Live acquisition, host export conversion, new partial-fact schema, model mapping
inference, approved execution endpoints, policy changes, dispatch, ranking,
fallback, receipts, cache, merge/release, and full HRO completion.

## Context & References

- plugins/foreman-line/docs/goals/routing-currency-and-merit/openrouter-source-profile-20260926.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json
- plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/openrouter-rcm-v1-conservative-projection-20260926.json

- plugins/foreman-line/docs/goals/routing-currency-and-merit/source-observation-amendment-20260926.md
- plugins/foreman-line/docs/specs/active/RCM-P1A-sanitized-snapshot-adapter.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/public-metadata-observation-20260926.json

## Verification Plan

Node 24.19.0; from routing-policy run node --import tsx --test
tests/public-observation-producer.test.ts, npm test, npm run typecheck and
npm run lint. Run git diff --check, exact scope audit and spec lint.
Independent architecture/source review must reproduce retained real metadata
transformation and distinguish synthetic test success from production evidence.

## Evidence Required

Independent contract review approved this draft on 2026-09-26 after reproducing
the retained byte lengths/digests, six complete records plus Haiku's explicit
refusal, rational price conversion, six acceptedSource fields, and the actual
reader/projector's exact 24-hour boundary using synthetic endpoint authority.
This is contract/evidence verification, not implementation or live approval.
Before release, freeze accepted P1A and producer public types and record their
barrel integration order. Implementation must reject unknown nested fields and
unsupported profile/version literals. Negative source fixtures must be repinned
independently where needed so they exercise semantic validation beyond the
digest gate. Pretraversal, hostile-input, timestamp, rational-price and complete
requested-inventory tests remain mandatory.

Accepted mapping table/profile versions and retained source evidence; merged P1;
P1A compatibility; coordinator-recorded barrel serialization; all checks and
independent review. Real producer evidence must preserve incomplete identities
as refusals and name remaining endpoint/capability/privacy/availability gaps.

## Collision Risk

Public barrel serialized with PMC and P1A in either recorded order; last writer
preserves and retests prior exports. No shared reader/projector algorithm edits.

## Stop-and-Report Rule

Respect the scoped Gate 2 and predecessor integration gate below. Stop affected work
for missing mandatory facts, unsupported source semantics, a required schema
change, authority inference or a request for provider/config side effects.

## Gate 2 and public-type freeze — 2026-09-26

The coordinator grants private implementation under the user's explicit scoped
prerequisite authority. P1A's final implementation 4201ac4 has two independent
approvals (27 focused/426 full tests). Its merge onto accepted PMC main 6ff38a3
is at de39306; integration verification and its own remote merge gate remain
pending. Producer integration must follow that successful wrapper merge.
No dependency gate is waived by permitting independent private implementation.

Supported P1A exports are evaluateCatalogEligibility, CatalogIdentity,
AcceptedCatalogSource, CatalogEligibilityInput, CatalogAdapterRefusalCode and
CatalogEligibilityResult. In the API block above, Identity and AcceptedSource
are aliases of those accepted CatalogIdentity and AcceptedCatalogSource types,
not new structures to evolve independently. Export the producer function and
ProducerCandidate, ProducerTrust, InventoryStatus, InventoryCode, FactField,
InventoryEntry, ProducerRefusalCode and ProductionResult as shown; preserve every
existing barrel export. No name collision exists on this pinned base.

Builder workspace D:/Repos/agent-skills-worktrees/hro-rcm-producer-20260926;
branch codex/hro-rcm-producer-20260926; base before this spec amendment e23a925.
Only the five Allowed Files may change. A fresh builder verifies the exact spec
blob and clean head, reads standing constraints, restates scope and stops for
coordinator Step-0 release. Return local commit, tests and exact source/profile
reproduction; no push, acquisition, provider calls or configuration effects.

Private branches may proceed independently. Shared integration order is merged
PMC-P1a, accepted RCM-P1A wrapper, PMC-P1b projection, then this producer; rebase
on the accepted predecessor and preserve its public exports, reader algorithms
and schemas. The coordinator may reverse the two independent final additive
parcels only through an explicit recorded handoff before shared-file edits.
The retained dated observations are testable evidence, not evergreen live facts.
