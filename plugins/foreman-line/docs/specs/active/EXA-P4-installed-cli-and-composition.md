---
ticket: EXA-P4
title: Compose approved dispatch into one invokable local CLI
status: draft
owner: clinton.morgan
created: 2026-10-17
updated: 2026-10-17
risk: critical
surfaces:
  - plugins/foreman-line/execution-adapter/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

# EXA-P4 - Compose approved dispatch into one invokable local CLI

## Intent

Provide the concrete execution entry /goal and shaping sessions can invoke from this Windows/Codex environment. Connect real admission, authority/accounting, runtime and result custody, with durable status and cancellation.

## Constraints

These are proposed implementation boundaries in a Stage A draft. Human choices confirmed in this chat: local CLI first; only DocSpine/Kompress shaping and AI Council critique sessions; select concrete routes during admission from approved profiles, with no fixed roster in these specs. This draft grants no implementation, provider spend, dispatch, merge, or activation authority. Parcel identifiers are local planning keys, not claims of registered Jira issues. Risk classifications are recommendations for coordinator/human disposition.

The proposed source CLI is plugins/foreman-line/execution-adapter/src/cli.ts with exactly plan, launch, status, cancel and --help. P0 freezes the exact grammar and resolves its relationship to PMC-P2E2; do not release two competing launch surfaces or change that draft by implication. Use the package's installed, matched-lock tsx and supported Node, never npx download at launch.

Input is one bounded UTF-8 JSON document through stdin. Reuse E2's bounded-framing approach: initial proposal 2 MiB/5 seconds, maximum depth 16 and 65,536 values, duplicate/trailing-document rejection; P0 must freeze or amend these numbers. Output one bounded JSON response containing IDs, status, bounded non-secret reasons and durable artifact refs. Never echo prompts, credentials, provider bodies or exception stacks. Success=0, operational refusal/failure=1, input/usage error=2; P0 resolves exact record shape.

plan validates/proposes with zero credential/provider calls and cannot issue execution authority. launch consumes an existing authentic grant via the fixed production installation, re-admits before send, claims one attempt, invokes P3, and records P2/P3 observations plus an unchanged ResultEnvelope and versioned sidecar. status/cancel use an opaque known dispatch ID under the fixed installation store; no arbitrary root/file/module flags. Cancel is a request, not a no-charge guarantee.

Invoke legacy preparePiEntry/verifyLaunch/writePiEntryRecord and verifyExecutedIdentity only for admitted legacy-compatible decisions. New companion scope uses the separately ratified P0 contract and explicitly distinct evidence; never relabel a companion permit as an old approved receipt. Every attempt records its exact authorizing route/permit and terminal audit evidence separately.

A launch process supervises its worker through completion or truthful uncertainty. Polling status does not reattach the same Pi session or send another prompt. No launch daemon, automatic restart, model selection flag, shell string construction, generic callback loader or environment-based test factory.

## Acceptance Criteria

1. From a clean documented checkout with pinned installed dependencies, --help and plan actually execute; malformed input/help performs zero production construction or credential access.

2. launch composes real P1/P2/P3 implementations. Offline end-to-end tests use actual stores and the real network-incapable Pi assembly rather than substituting a fake controller for the whole path.

3. Before inference the actual authorization is current, issuer-authenticated, task/lane/packet/runtime bound and consumed exactly once. Legacy signature/freshness checks remain intact where applicable.

4. ResultEnvelope validates unchanged; trusted host observations establish exact executed identity and usage. Bounded findings and sidecar references cannot be replaced with model-authored completion claims.

5. Atomic output persistence refuses collision/path escape and preserves partial/uncertain results on failure. Failed stdout write never triggers another launch or destroys settlement evidence.

6. Status is restart-readable and correctly distinguishes active, waiting, completed, failed, held and uncertain observations under P0's state mapping. Cancel retains unresolved liabilities and known child lifecycle.

7. Black-box CLI tests cover concurrent duplicate requests, stale plans, revocation between plan/launch, store corruption, payload injection and lost output acknowledgement.

8. Production-ready is asserted only after EXA-P6. Missing installation evidence may truthfully refuse during construction, but that is not the initiative's live-execution exit.

## Out of Scope

MCP wrapper, UI/terminal automation, generic public factory, credentials/setup flags, automatic installation, new model/provider routes, automatic approvals, Jira/Stage A receipt minting and arbitrary subprocess tools.

## Context & References

- [EXA-P0-contract-reuse-and-bootstrap.md](EXA-P0-contract-reuse-and-bootstrap.md)
- [EXA-P1-packet-and-route-admission.md](EXA-P1-packet-and-route-admission.md)
- [EXA-P2-durable-authority-and-accounting.md](EXA-P2-durable-authority-and-accounting.md)
- [EXA-P3-pi-runtime-and-isolation.md](EXA-P3-pi-runtime-and-isolation.md)
- [PMC-P2E2-governed-user-entry.md](PMC-P2E2-governed-user-entry.md)
- [../../../worker-envelopes/src/result-envelope.ts](../../../worker-envelopes/src/result-envelope.ts)

## Dependencies

EXA-P0-P3 accepted; reconcile actual PMC-E2 ownership and source exports at Step 0. EXA-P6 controls live installation/admission.

## Allowed Files

Future proposed mutation envelope, exact repository-relative paths. These draft entries grant no current mutation authority.

- plugins/foreman-line/execution-adapter/src/cli.ts
- plugins/foreman-line/execution-adapter/src/framing.ts
- plugins/foreman-line/execution-adapter/src/installation.ts
- plugins/foreman-line/execution-adapter/src/dispatch.ts
- plugins/foreman-line/execution-adapter/src/results.ts
- plugins/foreman-line/execution-adapter/tests/cli.test.ts
- plugins/foreman-line/execution-adapter/tests/composition.test.ts
- plugins/foreman-line/execution-adapter/README.md

## Verification Plan

Black-box executable tests plus genuine predecessor composition; no provider calls in default suites. Reviewer questions: Can stdin instantiate authority? Does a plan/receipt/result JSON get mistaken for a capability? Can cleanup or output failures cause duplicate sends? Is the documented command the one actually tested?

