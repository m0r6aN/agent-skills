---
ticket: PAN-P01
title: Pantheon delegated workflow and boundary contracts
status: draft
owner: clinton.morgan
created: 2026-10-19
updated: 2026-10-19
risk: critical
routing_class: architecture/risk
surfaces: [plugins/foreman-line/docs/, plugins/foreman-line/dispatch/src/pantheon-contracts/]
permission_profile: om-pan-001-native-bootstrap
data_classification: internal
---

# Parcel: PAN-P01

This is preparation only. P00's live qualification and substantive amended-plan review must close before activation. Resolve the actual worktree, remote base, spec hash and exact allowed-file manifest before dispatch; placeholders are not admission. No Jira/Linear record is implied by the goal-local parcel ID.

## Goal

Make the ratified Pantheon workflow explicit in active instructions and provide narrow typed envelopes/validators for the existing Runtime authority and Foreman dispatch boundaries, without enabling a production terminal or issuing authority.

## Initiative / track / wave

pantheon-incarnation-v0 / Foreman / Bootstrap. Depends on P00. Architecture and authority boundary: two fresh independent frontier reviews under OM-PAN-001. Their packets must not include each other's findings or builder conversation.

## Scope and known preparation

The coordinator prepared 14 documentation changes in the P00 worktree. `workflow-amendment-preparation.json` pins each before/after value. Transfer these exact changes into P01's own worktree after checking the real base. They are unaccepted until this parcel's evidence and reviews close. Preserve unrelated goals' gates and frozen historical records.

## Allowed Files

- plugins/foreman-line/AGENTS.md
- plugins/foreman-line/README.md
- plugins/foreman-line/docs/COORDINATOR-PATTERN.md
- plugins/foreman-line/docs/SPEC-CONVENTION.md
- plugins/foreman-line/docs/standing-mandates/OM-PAN-001.md
- plugins/foreman-line/skills/goal/SKILL.md
- plugins/foreman-line/skills/foreman-shaping/SKILL.md
- plugins/foreman-line/skills/parcel-driven-development/SKILL.md
- plugins/foreman-line/templates/kickstarters/loop-directive-template.md
- plugins/foreman-line/templates/kickstarters/builder-template.md
- plugins/foreman-line/templates/kickstarters/reviewer-template.md
- plugins/foreman-line/templates/kickstarters/shaping-template.md
- plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md
- plugins/foreman-line/templates/AGENTS.md
- plugins/foreman-line/dispatch/src/pantheon-contracts/index.ts
- plugins/foreman-line/dispatch/src/pantheon-contracts/README.md
- plugins/foreman-line/dispatch/tests/pantheon-contracts.test.ts
- plugins/foreman-line/docs/specs/active/PAN-P01-delegated-contracts.md
- plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md

## Forbidden

No changes to the human approval CLI, existing frozen contracts/schema registries, model-family rules for other goals, production Pi/refusal paths, general Runtime launch readiness, credentials, billing, provider calls, package caches, dependency manifests or lockfiles. No role self-approval, grant minting, merge capability or effects in this contract module. No commit/push/merge by the builder. Report necessary file additions to the coordinator for a bounded amendment.

## Bounded source context

Read the active OM-PAN-001 activation/ratification references, sealed MANDATE/WORKFLOW-AMENDMENTS/RUNTIME-PATH/QUEUE, completed P00 review and triage, this spec and standing constraints. Reuse Foreman `role-authority/src/roles.ts` role vocabulary, `contracts/src/correlation.ts`, and canonical/hash utilities only where their contracts fit. Read `dispatch/src/pmc-launch/{controller-types,intent-custody-types,ledger}.ts` and `kernel-lease/src/index.ts` to avoid duplicating responsibilities. Runtime references are `Keon.Contracts/Authority.cs`, `Authority/AuthorityBinding.cs`, `Decision/Decision.cs` and `Authority/IPermissionSpendGate.cs`. Read access grants no mutation rights.

## Contract

Keep one goal-scoped module. Public parsing returns a discriminated validation result with typed refusal codes; inputs at untrusted or untested external seams remain unknown. It must be safe to import without I/O or effects.

1. Define application envelopes for DispatchIntent, Step0Restatement, ReviewResult, EvidenceProvenance and MaterialException. Carry full session/host/goal/parcel/job/attempt identity, mandate/spec/source/artifact/config hashes, exact relative allowed files, role and model-profile reference, requested tools/network, deadlines and fencing epoch. Money is integer micro-USD; estimates, reservations, provider counters, local estimates and reconciled bills remain separate nullable categories. Absence is never zero.
2. Reference the existing Runtime authority grant/binding and decision IDs/hashes. A JSON-shaped reference is untrusted. Structural validation must never return an admission, human approval or execution capability. Record which concrete P02/P03 consumer must verify identity, signature, expiry, scope, revocation, reservation and current epoch. Do not invent a second authority engine.
3. Step 0 compares the complete bounded restatement against the coordinator's expected descriptor and returns exact-match or a precise mismatch list. Exact match permits the coordinator to advance its handshake under the standing mandate, but does not authorize an effect. Missing/empty paths, extra tools, other host/role/model/source/head/spec or flags hold that worker. No human prompt is generated for an ordinary mismatch.
4. Validate substantive result structure: review text, verdict, findings, coverage, limitations and trusted-capture provenance are separate. Reject empty/incomplete/wrong-artifact/wrong-head results. A model-supplied provider ID or accepted=true cannot authenticate provenance. Use explicit unverified/verified states and require trusted verification at the consumer; do not fake it with a boolean option.
5. Represent OM-PAN-001's named same-vendor independence exception without changing universal family exclusions. Preserve distinct authorship/session, read-only review and two-review floor for authority/security surfaces. Role identifiers remain existing Foreman vocabulary; registry/profile keys remain strings rather than a second global model registry.
6. Define a pure authority-delta classifier for material scope/host/account/access/total-ceiling/residual-risk/production changes versus ordinary refinement. It explains the affected field. Evidence failures, unavailable dependencies and routine rework remain automatic holds; they are not automatically human authority exceptions.

No happy-path contract test may be presented as a real Runtime admission. P02–P05 supply effectful consumers and authentic verification.

## Required verification

Run affected dispatch typecheck, tests and lint using the pinned supported Node toolchain in Docker (host Node24.7 is unsupported). Preserve existing tests/refusal assertions. Add negative tests per independently checked invariant: fake receipt/ref/accepted flag cannot yield admission; missing/extra/traversing/glob paths; every Step0 identity/hash/tool/host mismatch; empty or contradictory review; provider-vs-local usage ambiguity; wrong-head provenance; author-as-reviewer; material authority expansion. Exercise typed boundaries with malformed/null/oversized input. Tests should verify contract behavior rather than exact source bytes.

Coordinator closure separately verifies the exact diff and prepared documentation hashes, searches affected active instructions for contradictory Pantheon human gates, and checks effective repository rules at the actual merge head. Do not write permanent tests that pin a moving branch or formatting.

## Acceptance and handoff

Report base/head/worktree/branch/spec digest, touched files, exact commands/environment/counts/exits, source hashes, remaining limitations and any flags. Contract/parser tests plus two substantive reviews must close before P01 is accepted. Loaded instruction digests must match the accepted revision through supported package loading; never manually patch the Codex plugin cache. Runtime and production provider effects remain denied until their later parcels pass.

Rollback disables the Pantheon profile and reverts only the reviewed parcel commit. It never erases consumed attempts, authority evidence, historical review records or unrelated working files.
