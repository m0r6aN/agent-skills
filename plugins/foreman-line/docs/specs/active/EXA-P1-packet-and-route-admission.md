---
ticket: EXA-P1
title: Validate immutable worker packets and admit scoped route profiles
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: elevated
surfaces:
  - plugins/foreman-line/execution-adapter/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P1 - Validate immutable worker packets and admit scoped route profiles

## Intent

Implement the pure boundary and immutable evidence reader for the three admitted task types. Select a route from the approved installation profile during admission, while keeping model names out of task specs and preserving existing policy refusals.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

Consume the P0 closed contract and unchanged TaskEnvelope/ResultEnvelope/RoleId schemas. New wrapper fields belong only to foreman-execution/v1 and its sidecars; no extra fields in frozen envelopes. Use existing predicates, policy validators and identity comparisons via supported exports. Do not copy resolver ranking to bypass a stop.

The allowed taskType values are docspine-shaping, kompress-shaping and council-critique. P0 ratifies their existing role/lane mapping. Tasks supply requirements, brief/packet references, independence exclusions and an existing authority reference; never raw credentials, arbitrary endpoints or a selectable module path.

Packet entries are pinned bytes with ordered ID, source revision, size, encoding and content identity. read_evidence accepts entry IDs, never model-supplied paths/URLs. Snapshot/confinement is validated before inference and reads cannot escape through links, traversal, aliasing or changed bytes.

Admission validates authentic, current profile evidence for primary and the sole declared fallback: provider/model spellings, auth mode, native reasoning mapping, context/output/tools, privacy/data purpose, quality and available budget/quota. No fixed model roster is compiled. If legacy entry/policy refuses the request, preserve that reason; only a P0-ratified separate companion admission can admit new scope. A route recommendation/proposal carries no launch authority.

## Acceptance Criteria

1. Closed schemas reject duplicate/unknown fields, unsupported versions/task types and invalid frozen nested envelopes. Existing role/risk vocabularies are imported unchanged.

2. Two shaping packet fixtures and one Council packet fixture validate; each binds goal/task/instance, source revision, required capabilities, actual data class and evidence destinations.

3. Evidence reads by approved ID reproduce pinned bytes. Foreign IDs, path/URL input, links, changed content, malformed encoding, oversized entries and cumulative context overruns are refused.

4. Selection is deterministic for the same approved profile snapshot and requirements; exact namespace equality is used. No frontend/model flag, seats.md fallback or hidden alias chooses an alternative.

5. Both primary and fallback meet data/capability/context/thinking/independence/bound requirements; missing, expired, revoked or unauthenticated evidence yields a named held/refused result before credential/runtime access.

6. A signed/content-digest legacy receipt is not treated as authenticated issuer proof. P2 must consume an authentic origin and issue/claim any execution permit.

7. Negative controls preserve legacy/public-v1 and OPMEM-only refusals unchanged. No test converts offline fixture-compatible into admitted.

8. Runtime dependency list is explicit and minimal; reuse existing Ajv/schema-scaffold patterns and repository-relative ESM imports, with package-local lock and no global workspace change.

## Out of Scope

Authority issuance, state-store initialization, provider calls, child process creation, CLI installation, credential reads and changes to old schemas or offline prototype behavior.

## Context & References

- [EXA-P0-contract-reuse-and-bootstrap.md](EXA-P0-contract-reuse-and-bootstrap.md)
- [../../SPEC-CONVENTION.md](../../SPEC-CONVENTION.md)
- [../../../worker-envelopes/src/task-envelope.ts](../../../worker-envelopes/src/task-envelope.ts)
- [../../../routing-policy/src/pi-resolver.ts](../../../routing-policy/src/pi-resolver.ts)
- [../../../internal-review-launch/README.md](../../../internal-review-launch/README.md)

## Dependencies

EXA-P0 ratified contract, concrete authority/profile interfaces and construction release. P1 is pure and does not claim P2/P3 exist.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/execution-adapter/package.json
- plugins/foreman-line/execution-adapter/package-lock.json
- plugins/foreman-line/execution-adapter/tsconfig.json
- plugins/foreman-line/execution-adapter/biome.json
- plugins/foreman-line/execution-adapter/src/contracts.ts
- plugins/foreman-line/execution-adapter/src/schemas.ts
- plugins/foreman-line/execution-adapter/src/admission.ts
- plugins/foreman-line/execution-adapter/src/packet.ts
- plugins/foreman-line/execution-adapter/tests/admission.test.ts
- plugins/foreman-line/execution-adapter/tests/packet.test.ts

## Verification Plan

Use source-parity and negative tests for schema/role compatibility, forged profile facts and evidence escapes. Reviewer questions: Can a model turn packet content into permission? Does any legacy stop become an implicit alternative route? Are identity namespaces and both fallback/primary requirements exact?

