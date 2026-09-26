---
ticket: RCM-P1B
title: Scoped public-observation canonical snapshot producer
status: draft
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
advertised as a full catalog. Draft only: actual field mappings await retained
per-model source data and independent review before implementation dispatch.

## Constraints

Requires merged RCM-P1 and accepted P1A wrapper contract. No acquisition/network,
inference, credentials, raw host documents, filesystem/config writes or policy
changes inside the producer. Caller supplies bytes, evidence, requested IDs and
time. Use Node 24.19.0 and existing dependencies. Scope at most 256 requested
provider/ID pairs; no implicit model discovery or promotion. No changes to the
historical P1 spec/schema/reader/projector in this parcel.

## Contract

Input: explicit requested provider/ID set; retained public response bytes or
an allowlisted per-model projection; corresponding accepted source observation
manifest; approved extraction-profile version; caller evaluation time. Every
source contribution binds its exact acquisition URL, response digest/length,
retained-projection digest if applicable, field locators, provider and profile.
A hash of discarded response bytes plus aggregate coverage is insufficient.
Keep execution endpoint/protocol observations distinct from approvedConfig;
source evidence cannot authorize execution configuration.

Preserve original high-precision timestamps. For rcm-public-observation/v2,
validate request-start <= complete-response-receipt <= evaluation time and
successful parse; truncate complete-receipt UTC time conservatively to exact
millisecond ISO for checkedAtUtc. The 24-hour bound measures observation age,
not provider refresh or availability. providerDeclaredTime remains separate and
unknown when absent. Never substitute HTTP Date, model created, host mtime,
export time or another source's timestamp. Multiple contributing observations
use the oldest contributing checked time for the affected provider; any unknown,
stale, mismatched or malformed required contribution refuses that production.

Each requested identity receives one ordered inventory entry: complete, absent,
missing-required-facts, source-invalid, or unsupported-profile, with bounded
codes and field names only. Do not drop missing/held identities. Output is either
{ok:true,canonicalBytes,digest,acceptedSource,inventory} when every requested
identity is complete, or {ok:false,inventory} with no canonical success artifact.
A caller can propose a new explicit smaller scope as a separate decision, never
silently reduce the requested set. Unrequested source records are excluded by
the recorded scope, not represented as absent from the upstream full catalog.

Canonical output contains exactly the requested complete identities and their
providers, preserving requested order. sourceRef binds the versioned manifest
reference; acceptedSource carries its digest, profile/version, canonical digest,
and exact requested coverage. Serialize UTF-8/no BOM, two-space JSON plus one LF,
hash exact bytes, and validate through the sole RCM-P1 reader. No snapshot casts.
Missing P1 required fields cannot become false, zero, empty lists or invented
limits. Preserve explicit null/unknown facts only where P1 already permits them.

Before parse cap each source at 8 MiB and aggregate retained bytes at 16 MiB;
cap model records at 10000, providers at 256, field strings at 4096 characters,
thinking-map entries at 64, graph depth at 16 and visited values at 262144.
Return typed refusal on excess or malformed data; never truncate or log raw data.
Closed reviewed source projections only; raw provider response profiles must
explicitly describe allowed extraction, ignored fields, numeric units and null
semantics before implementation. Never infer absent capability as unsupported
or supported without an explicit provider-defined field meaning.

## Source Mapping Gate

Current evidence only establishes that OpenCode machine lists supply IDs and
that OpenRouter lists contain richer top-level structures. No real per-model
projection or exact field-semantic mapping is approved by this draft.
The source task must supply reproducible data and a mapping table for each P1
field, including protocol, execution baseUrl, reasoning, input modalities,
contextWindow, maxTokens, prices/units and thinking levels. Documentation-based
fields need their own retained evidence/profile. ID-only OpenCode records remain
missing-required-facts until evidence exists; no cross-provider enrichment.
Coordinator records accepted profile versions before promoting this draft.

## Acceptance Criteria

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

Accepted mapping table/profile versions and retained source evidence; merged P1;
P1A compatibility; coordinator-recorded barrel serialization; all checks and
independent review. Real producer evidence must preserve incomplete identities
as refusals and name remaining endpoint/capability/privacy/availability gaps.

## Collision Risk

Public barrel serialized with PMC and P1A in either recorded order; last writer
preserves and retests prior exports. No shared reader/projector algorithm edits.

## Stop-and-Report Rule

Remain draft until actual field mappings/data are reviewed. Stop affected work
for missing mandatory facts, unsupported source semantics, a required schema
change, authority inference or a request for provider/config side effects.
