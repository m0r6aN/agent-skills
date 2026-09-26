---
ticket: RCM-HRO
title: Private authenticated public catalog publication
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Shape the genuine catalog fetch, materialization, publication and acquisition
owner required by HRO-P4A. Preserve the existing retained-observation producer
and pure RCM evaluator while adding separately versioned raw-response semantics.
This is a docs-only draft: no runtime, provider call or production activation is
authorized by this release.

## Constraints

### Decisions and authority

Root accepted the Step 0 decisions: additive raw-response materialization in the
existing RCM owner; a later genuinely installed publisher may attempt fixed
credential-free metadata GET; immutable bounded single-process generations with
atomic pointer CAS and private issuer custody. Historical unauthenticated success
is not a promise of future availability. Missing documentation of unauthenticated
access alone does not permanently prohibit an attempt. Actual failure refuses;
there is no credential fallback. Root ratification of this draft, two independent
reviews and separately scoped implementation release remain required.

This owner authenticates local acquisition provenance and custody, not provider
truth, model quality, account entitlement, tariff completeness or execution
approval. TLS and complete parsing cannot establish those separate facts. Catalog
output remains evidence; no registry, alias, tier, configuration or model approval
is promoted. HRO-P4A owns episode refresh participation/coalescing/negative cache;
durable workflow admission is a separate prerequisite and is not implemented here.

### Fixed acquisition domain

Proposed profile `openrouter-public-text-materialization/v1` uses exactly
`GET https://openrouter.ai/api/v1/models`, no query, body, cookies or authorization.
Install this exact endpoint and reviewed extraction profile in trusted composition;
no task URL, task-selected fetch, environment-selected adapter or alternate host.
Send only fixed Accept: application/json and Accept-Encoding: identity headers.
Do not read credentials, Pi settings, account endpoints or inference endpoints.
Redirects refuse without following; TLS validation is mandatory. Refuse non-200,
401/403, non-JSON, unsupported content encoding, premature termination, malformed
UTF-8/JSON, duplicate keys, excess bounds or cancellation. No retry within one
refresh operation and no credential fallback. Installed transport must expose
actual bounded bytes/termination/status metadata to the owner; mocked returns
remain unknown until validated.

The reviewed official models reference states that omitting offset and limit
returns the full list and output_modalities defaults to text. Thus this profile's
domain is the default public TEXT-output catalog, not every OpenRouter model,
account availability or regional/provider-specific offerings. Do not add search,
pagination, category, region or capability filters. Any server continuation or
pagination indicator, incompatible schema/domain change, truncated body or
unestablished completeness returns COMPLETENESS_UNPROVEN. Do not concatenate pages
from different generations or infer completeness from Content-Length alone.
Revalidate this pinned documentation/profile contract before future activation.

Public metadata is hostile input. Discard unneeded descriptions/links and never
follow them. Provider HTTP errors remain transport/refusal evidence, never ABSENCE.
Transport capture records local request-start and complete-response receipt time;
provider dates, model-created fields, ETag, mtime and publication time cannot reset
freshness. HTTP metadata is bounded and informational, not generation authority.

### Closed bounds

| Resource | Limit |
|---|---|
| Complete operation | 10,000 ms, including body read, parsing, materialization and publication |
| Concurrent operations | 4; excess refuses immediately, no hidden queue |
| Body | 8 MiB wire and decoded bytes; identity encoding only |
| Requested scope | 1–256 distinct exact openrouter/model-id pairs |
| Response rows | 10,000, unique exact IDs |
| Structured capture | depth 16, 262,144 expanded values, 4,096 UTF-8 bytes per string, 1 MiB aggregate retained strings |
| Artifacts | each at most 8 MiB, combined response-derived artifacts at most 16 MiB |
| Active publication scopes | 128; no implicit eviction of active scope |
| Retained generations | one current generation per scope; four bounded in-flight candidates |
| Catalog validity | at most 24 hours from complete-response receipt; earlier policy expiry wins |
| ABSENCE validity | at most 30 seconds from complete-response receipt; earlier policy expiry wins |

Existing stricter reader/adapter/input limits continue to apply. Parse before
retaining excess data; preflight size/cardinality before child descriptor descent.
Exact-limit and one-over tests are mandatory. Deadline uses a captured monotonic
clock; UTC timestamps are separately checked for ordering and future values.
Cancellation spends P4A participation; it cannot publish a late candidate, restore
an old generation or extend a deadline. Unknown/throwing clocks refuse.

### Additive raw-response materialization

Proposed `materializePublicModelResponseV1` is a pure function owned alongside
`producePublicObservationSnapshot` in routing-policy. It accepts owned raw response
bytes, closed observed transport metadata, exact requested identities and a
separately accepted extraction-profile declaration. It performs no I/O, clock,
network, authority issuance or publication. Its results always carry evidenceOnly.
The new input/result schema is separately versioned; it must not manufacture the
old manifest's historical filenames, baseline counts, refusal binding 7,
ratification labels or source-run history. The accepted retained-artifact API and
its tests remain unchanged.

Reuse existing RCM canonical model validation, decimal-price conversion and sole
readCatalogSnapshot validation. Share private pure helpers only under the explicit
RCM amendment; do not implement a competing catalog reader or copied price math.
Preserve observed text/image intersection and residual modalities. The reviewed
reasoning inference requires nonempty observed supported_efforts; absent/empty
remains unknown and cannot become false. Exact effort mappings preserve the
accepted conservative semantics; missing levels and mandatory-reasoning off
refuse. No Pi defaults or clamping supply metadata. New shape/profile changes
require review, not runtime widening.

Retain exact captured response bytes or a bounded lossless allowlisted field
projection with exact raw-byte digest, field locators, original observation time
and profile version. Derive new artifact digests from those bytes; separately
installed profile authority accepts the transformation, not a task-provided hash.
Public response pricing remains observed fields only: it does not certify all
billable components, account price or a cost ceiling. Unknown required facts
produce explicit incomplete rows; no zero/false/default placeholders.

Results account for every requested identity as facts, incomplete, unsupported
or absent-in-domain. Absence and incompleteness are distinct. Canonical success
requires complete facts for the exact declared canonical scope. A mixed request
must not silently shrink the scope to obtain success. The pure materializer can
report scoped absence evidence, but only the private publisher may authenticate
its acquisition and issue an ABSENCE capability.

### Private publication and acquisition

Proposed private `createCatalogPublicationOwnerV1` captures trusted installation
identity, authority scope, reviewed profile, fixed terminal metadata transport and
clocks once. Installation is unavailable to task payloads and is not exported by
the dispatch barrel. Test installation has a distinct private provenance domain;
it cannot issue production capabilities. Production composition must use the real
reviewed fixed transport and accepted profile, not a success-shaped JSON adapter.

Proposed private ports are asynchronous `requestCatalogRefreshV1` and synchronous
`acquirePublishedCatalogV1`. A request supplies only a previously registered scope
handle, expected generation and remaining episode deadline. Registration freezes
workflow/trust scope, endpoint/profile/domain and sorted exact identities; it
cannot expand mappings or endpoint authority. Unknown/copied/serialized handles,
new identities, changed installation or scope refuse before transport.

Refresh returns a closed result tagged published, absent or refused. Published
contains a private publication handle and monotonic local generation. Absent
contains a private ABSENCE handle. Refused contains only a bounded typed code:
INPUT_REFUSED, CAPACITY_REFUSED, TRANSPORT_REFUSED, DEADLINE_EXCEEDED,
COMPLETENESS_UNPROVEN, MATERIALIZATION_REFUSED, PUBLICATION_CONFLICT or
INSTALLATION_REFUSED. Error strings/body content never become authority or logs.

Build each candidate privately. After successful capture/materialization and
fresh checks, compare the current scope generation with the request's expected
generation, then replace one immutable in-memory record synchronously with no
await or external callback between comparison and replacement. Generation starts
at zero and increments once per acknowledged publication; reject overflow at
Number.MAX_SAFE_INTEGER. Concurrent candidates for the same expected generation
have one winner; losers return PUBLICATION_CONFLICT and cannot retry themselves.
Handles are frozen empty objects authenticated through private identity maps;
JSON, hashes and structurally matching objects confer no custody. Replace/delete
old handle entries on publication so stale versions cannot be acquired.

Synchronous acquisition checks exact owner/handle/scope/generation, current
authority/profile, time/expiry and original source provenance; returns detached
bounded bytes and accepted catalog declarations from privately retained records.
It performs no fetch, await, refresh or caller callback. Re-run the real canonical
reader and adapter boundary when composing C's input; a previous publication is
not cached eligibility. Copies of returned data are evidence only and mutation
cannot change retained bytes or a later acquisition.

The issuer authenticates ABSENCE only when an acknowledged, complete validated
response covers the exact requested identity within this TEXT domain. Bind
identity, requested scope, trust scope, endpoint/profile/domain, generation,
raw evidence digest, complete receipt time and validity. A model outside the
domain is not globally absent. Producer INCOMPLETE_SCOPE, missing required facts,
unsupported profiles, successful JSON alone, 404 and failed/partial responses
never issue an absence handle. P4A may negative-cache only through the installed
issuer's private verification port, with its original 30-second/256-entry limits.

Publication is memory-atomic, not durable. Restart destroys all issuer identity,
handles and generations; old data cannot reinstall authority. No JSON disk cache,
generation reset or recreated owner may reset the workflow admission/refresh
budget. A new process can publish only under separately valid workflow admission;
otherwise it refuses. This parcel cannot grant such admission.

### C composition and activation boundary

C acquire remains synchronous and runs after B1 begin. Refresh/publication must
finish before C entry under HRO-P4A. This owner provides catalog bytes, provenance
and source-custody verification to C's trusted installation composer, not its
complete acquire result. C's existing request/decision EvidenceRef binding must be
performed by that composer using genuine source custody; copying a public digest
into an EvidenceRef does not authenticate it. Quality, independence, approved
endpoint configuration, runtime, tariffs/all-components certificates, account,
budget and B1 authority remain their existing owners' responsibilities. Missing
claims still refuse. Do not add network to C, RCM or consume-to-send.

Offline tests can prove normalization and private custody behavior using a
network-incapable installed transport. Production enabling additionally requires
the reviewed real terminal metadata transport, genuine profile/installation
authority and authorized bounded acquisition evidence. No inference or account
call is necessary or authorized here. E production refusal and full HRO live exit
remain unchanged; catalog publication alone closes neither.

## Acceptance Criteria

| AC | Required proof in separately released implementation |
|---|---|
| 1 | Retained producer API and actual retained fixtures unchanged; new raw-response version uses real canonical reader/adapter, exact identities/locators/decimal prices, explicit unknowns and no invented historical artifacts. |
| 2 | Fixed GET capture: task URL/header/adapter substitution, redirects, 401/403/non-200, encoding, malformed/duplicate JSON, truncated stream, deadline and cancellation all refuse with zero credential/inference/config access. Exact bounds and one-over negatives. |
| 3 | Regenerated artifacts reproduce from retained fresh bytes and installed profile; changed bytes/profile/time/identity fail independently. Hash-only and success-JSON inputs cannot authenticate source. |
| 4 | Complete scoped absence issues a privately verifiable handle; generic INCOMPLETE_SCOPE, incomplete/unsupported facts, filtered/partial/paginated responses, 404 and out-of-domain claims do not. Independently mutate scope, identity, generation, domain and validity. |
| 5 | Concurrent same-generation candidates have exactly one acknowledged publication; losing CAS, timeout/cancel, malformed candidate and stale handle never replace or acquire. Other scopes remain isolated; capacity is bounded. |
| 6 | Direct/serialized/copied/cross-instance/cross-mode handles refuse; mutation of acquired bytes does not alter retained state. Restart destroys authority and cannot reopen P4A participation or workflow admission. |
| 7 | Actual offline RCM-to-C composition preserves synchronous acquire and request-bound source evidence. Missing quality/billing/account/budget claims refuse; catalog success never creates permit, approval or refresh after B1 begin. |
| 8 | Separate production contract review validates installed fixed fetch/profile/custody before any enabling claim; fixtures cannot establish production authenticity. Real failures remain typed with no fallback credentials or model substitution. |

## Out of Scope

Runtime edits or endpoint calls in this shaping release; durable workflow
admission; inference/account/Pi/configuration access; mapping promotion; general
catalog crawling or pagination; account availability; quality ranking; tariff
completeness; modifying B1, C, D or E contracts; new receipts or production launch.

## Context & References

- [Shaping notes and source pins](../../goals/hybrid-routing-optimization/hro-rcm-publication-shaping.md)
- [P4A recovery contract](HRO-P4A-bounded-model-recovery.md)
- [Retained producer](../../../routing-policy/src/public-observation-producer.ts)
- [Catalog adapter](../../../routing-policy/src/catalog-eligibility-adapter.ts)
- [Accepted source semantics](../../goals/routing-currency-and-merit/source-observation-amendment-20260926.md)
- [Accepted extraction profile](../../goals/routing-currency-and-merit/openrouter-source-profile-20260926.md)
- [C design](PMC-P2C-same-process-launch-controller.md)
- [Official models reference](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Current release permits exactly these documents:

- `plugins/foreman-line/docs/specs/active/RCM-HRO-authenticated-catalog-publication.md`
- `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-rcm-publication-shaping.md`

Future source proposals, NOT current authorization: checkpoint N would amend
`plugins/foreman-line/routing-policy/src/public-observation-producer.ts` and
`plugins/foreman-line/routing-policy/tests/public-observation-producer.test.ts`,
adding `plugins/foreman-line/routing-policy/tests/fixtures/public-model-response-v1.json`.
Checkpoint P would add `plugins/foreman-line/dispatch/src/pmc-launch/catalog-publication.ts`,
`plugins/foreman-line/dispatch/src/pmc-launch/catalog-publication-types.ts` and
`plugins/foreman-line/dispatch/tests/pmc-catalog-publication.test.ts`.
No barrel change or generic injected production fetch is proposed. Exact terminal
transport/profile source ownership and any additional fixture/test file require
an independently reviewed implementation amendment before either checkpoint.

## Verification Plan

For this release run frozen spec-linter, required-body/local-link checks and
git diff --check; confirm exactly two changed files. Future implementation runs
each affected package's existing test/typecheck/lint and actual audit checks,
with isolated network-incapable tests and independent source review.
Reviewers must ask: can a task choose acquisition authority? Can old artifact
labels or a digest fabricate freshness/custody? Is complete absence confined to
the exact text-response domain? Can CAS/cancellation/restart resurrect authority?
Does synchronous C acquisition gain unrelated claims or hidden network work?
