---
ticket: RCM-P1A
title: Supported bounded catalog eligibility wrapper
status: done
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

Expose a bounded supported wrapper around the sole RCM-P1 snapshot reader and
eligibility projector. HRO/PMC consume public APIs, never internal deep imports.
Do not implement conversion of the old, timestamp-incomplete host export.

## Constraints

RCM-P1 must merge first. Coordinator records exact RCM/PMC barrel edit order and
base; either may land first, and the second preserves/rechecks all exports.
Pure caller-supplied data only: no filesystem, ambient clock, network, provider
calls, credentials, host configuration, policy mutation or dependencies.
Node 24.19.0. Existing P1 algorithms, schema and refusal semantics unchanged.
A public source's observation-age interpretation is permitted only under the
accepted source-observation amendment; legacy unknown times remain unknown.

## Contract

Export evaluateCatalogEligibility(input: unknown) and supporting result/input
types. Input names canonicalBytes, expectedSha256, approvedConfig,
evaluationTimeUtc, identities and acceptedSource. acceptedSource carries an
accepted profile/version reference, canonical digest, source-evidence reference
and digest, and exact requested provider/ID coverage. These are caller-supplied
accepted evidence declarations, not authentication performed by the wrapper.
The closed acceptedSource object is exactly {profileId:string,
profileVersion:string, canonicalSha256:string, sourceEvidenceRef:string,
sourceEvidenceSha256:string, requestedIdentities:readonly {provider:string,
id:string}[]}. Strings are nonempty and bounded; digests are lowercase 64-digit
hex. After the sole reader succeeds, require snapshot.sourceRef ===
acceptedSource.sourceEvidenceRef before projecting facts. The profile/version
and evidence digest are caller-approved provenance declarations; the wrapper
has no external evidence bytes and must not claim to authenticate those fields.
canonicalBytes is specifically a Uint8Array handled by a bounded defensive byte
copy, not the generic plain-object walker. Reject detached, shared or otherwise
unsupported byte storage under the existing reader's threat model; never invoke
caller-overridden iteration. Remaining nested input is closed plain data.
Explicitly document that a fabricated reference cannot prove authority.

Before parsing, bound canonicalBytes at 8 MiB; strings at 4096 characters;
identities/endpoints at 256; graph depth at 16 and visited values at 65536.
Reject cycles, accessors, throwing proxies and sparse arrays; avoid caller-owned
iterators/toJSON. Copy plain data once and return owned immutable results.
Refuse malformed/oversized input rather than truncate, without logging raw input.

Call readCatalogSnapshot with exact bytes/digest, then projectEligibility with
its actual reader-issued object, unchanged approvedConfig and explicit time.
Never forge a branded snapshot. Output discriminates adapter, reader and
projector stages; preserve P1 refusal code/level and ProjectionResult verbatim
inside the corresponding envelope. Unknown/stale time and missing authority
remain refusal. Unknown capability placeholders remain rejected by P1.

Require acceptedSource's canonical digest to match exact bytes and its requested
coverage to match the requested identity set with no duplicate entries. Snapshot
records must exactly cover that declared scope; provider records must exactly
cover those records. Reject excluded, additional or missing identities. A
scope-limited artifact cannot be claimed as a full catalog. The producer must
supply refusal inventory separately if it cannot create a complete artifact;
this wrapper does not accept a partial artifact as success. Legacy all-provider
snapshots can be used only with an honest full-scope declaration within bounds.

approvedConfig remains {authorityRef,endpoints:[{provider,baseUrl}]} and derives
from separately accepted repository authority, never the source catalog or Pi
settings. Source acquisition URLs are not execution base URLs. Successful facts
prove only snapshot consistency, not live availability or execution permission.

## Acceptance Criteria

- Public imports expose wrapper, reader/projector and needed result types while
  preserving existing exports and hiding internal brand helpers.
- Focused tests prove bounded hostile-input refusal, exact source digest/scope
  binding (including a mismatched snapshot sourceRef rejection), no dropped requested identity, unchanged reader/projector refusals,
  immutable outputs, current unknown-time refusal and synthetic fresh success.
- Existing package checks remain green. Legacy host metadata is a negative test
  input only; no production freshness claim is made from fixtures.

## Allowed Files

- plugins/foreman-line/routing-policy/src/catalog-eligibility-adapter.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/catalog-eligibility-adapter.test.ts
- plugins/foreman-line/routing-policy/README.md

## Out of Scope

Legacy host-export converter; producer/source acquisition; profile field mapping;
partial-fact schema; dispatch/policy/ranking/fallback; live availability; global
config; credentials; inference; merge or release authorization.

## Context & References

- plugins/foreman-line/docs/goals/routing-currency-and-merit/hro-adapter-design.md
- plugins/foreman-line/docs/goals/routing-currency-and-merit/source-observation-amendment-20260926.md
- plugins/foreman-line/docs/specs/done/RCM-P1-models-store-eligibility-projector.md

## Verification Plan

Pin Node 24.19.0; from routing-policy run node --import tsx --test
tests/catalog-eligibility-adapter.test.ts, npm test, npm run typecheck and
npm run lint. Run git diff --check, scope audit and spec-linter validation.
Independently review source-coverage checks, bounds, no duplicate eligibility
logic, timestamp semantics, and the limits of caller-declared evidence custody.

## Evidence Required

Merged P1 base; serialized barrel handoff; focused/full test results; scope proof;
independent architecture review. Synthetic success never counts as live evidence.

## Collision Risk

Shared index.ts serializes with PMC. No P1 reader/projector implementation edits.

## Stop-and-Report Rule

Stop affected work for missing merged P1, unresolved barrel ordering, required
P1 algorithm/schema changes, unsupported evidence profile or inferred authority.
Typed stale/unknown refusal is expected behavior, not grounds for substitution.

## Independent shape review disposition

The fresh review identified missing sourceRef binding. The exact closed acceptedSource fields and equality check above close that gap; negative coverage is mandatory. Source declarations remain trusted caller input, never authenticated by self-description. Coordinator accepts this correction; implementation release remains sequenced after PMC-P1a shared-barrel acceptance.

## Coordinator Gate 2 and integration order

Granted 2026-09-26 after independent contract review and sourceRef-binding correction. This wrapper depends only on merged RCM-P1 APIs, not new PMC APIs. Private isolated implementation may proceed alongside PMC-P1a; public-barrel integration remains serialized: accept/merge PMC-P1a first, then update this branch to that exact base, preserve all PMC exports and rerun checks/review the combined barrel before merge. No simultaneous edits occur in the same worktree. Builder workspace is D:/Repos/agent-skills-worktrees/hro-rcm-p1-integration-20260926, reused after its clean merged integration parcel, branch codex/hro-rcm-p1a-wrapper-20260926. Prior reviewed commits and original RCM builder worktree remain preserved. Step0 must confirm exact base/spec and four implementation paths before release. No provider/configuration/dispatch effect is authorized.
