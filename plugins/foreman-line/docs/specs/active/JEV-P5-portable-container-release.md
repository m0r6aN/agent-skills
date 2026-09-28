---
ticket: JEV-P5
title: Jev portable-container release closure
status: active
owner: clinton.morgan
created: 2026-09-22
updated: 2026-09-22
supersedes: null
superseded_by: null
risk: implementation/standard
surfaces:
  - plugins/foreman-line/jev-decisions/container/
  - plugins/foreman-line/docs/specs/active/JEV-P5-portable-container-release.md
  - plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-container-release-checklist.md
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: judgment-required
involves:
  - routing-currency-and-merit-jev-alpha
  - routing-currency-and-merit
---

# JEV-P5 — portable-container release closure

## Intent

Define the release gate for a usable and portable Jev container. This parcel
closes release evidence and operational documentation only; it does not add a
runtime, change the Jev package API, change provider routing, or authorize a
live call. The container remains unreleased until every required check has a
reproducible result and the human Gate 3 decision is recorded after merge and
local refresh.

The release candidate must wrap the already-approved Jev decision path without
changing its refusal semantics, bounded spend behavior, secret boundary, or
recommendation-only parent contract. A container image, launcher, health
surface, or registry publication is not assumed to exist until its evidence is
attached to the checklist.

## Release boundary

In scope:

- a pinned, reproducible image build and its source/evidence attestation;
- non-root execution and filesystem/network/process restrictions;
- credential injection without image, argument, stdin, stdout, stderr, or
  receipt disclosure;
- the bounded stdin/API request contract and deterministic malformed-input
  behavior;
- readiness and health behavior that does not perform a provider call;
- fail-closed refusal behavior for missing credentials, invalid requests,
  unsupported transport/provider responses, timeout, redirect/TLS authority
  mismatch, and cost-cap denial;
- rollback, quarantine, and evidence retention for a rejected or withdrawn
  image;
- proof that parent RCM and standard routing surfaces remain unchanged.

Out of scope:

- adding or changing Jev source, package manifests, lockfiles, tests, CI, or
  Docker files in this documentation parcel;
- changing `routing-currency-and-merit`, D10/D13, Pi/host state, HAWF,
  Helmholtz, or downstream workflows;
- enabling general routing, autonomous escalation, authorization, state
  mutation, or provider-side workflow effects;
- publishing an image, configuring a registry, or making a live provider call;
- treating a model page, catalog entry, or documentation example as runtime
  evidence.

## Frozen contract to preserve

The release candidate must preserve these already-ratified boundaries:

1. The provider request is the bounded alpha Decisions request, with the
   existing typed Jev request and response validation rules.
2. `OPENROUTER_API_KEY` is supplied at runtime through an approved secret
   channel only. It is never a build argument, image layer, command-line
   argument, request payload field, or logged value.
3. The runtime owns refusal and cost-cap decisions. A container wrapper may
   translate transport or process boundaries, but may not convert a refusal
   into a success, retry past the bound, or select a different model/provider.
4. The P3 `support-triage-advisory-v1` output remains recommendation-only. No
   container endpoint may add a route, recipient, command, capability token,
   authorization decision, or effect callback.
5. Parent RCM/D10/D13 routing behavior and files are read-only inputs to this
   release closure. No parent route may begin selecting Jev merely because the
   container is runnable.

## Required release checks

Every check below needs a command or reproducible procedure, environment
identity, UTC timestamp, result, and evidence digest in the release checklist.
`PENDING` means no release claim may be made.

### P5-01 — reproducible and pinned image

- [ ] Base image is pinned by immutable digest, not a floating tag alone.
- [ ] All build inputs are declared and the build context contains no
  credentials, host exports, unrelated repository state, or generated secrets.
- [ ] The image digest is reproducible from the recorded source commit,
  Dockerfile/build definition digest, dependency lockfile digest, and builder
  identity.
- [ ] The final image digest, architecture, SBOM/provenance attestation, and
  vulnerability-scan result are recorded.
- [ ] A second clean build or independently verified digest comparison is
  recorded; a merely successful local build is insufficient.

### P5-02 — non-root and bounded execution

- [ ] The image has a fixed non-root UID/GID and does not require a writable
  root filesystem.
- [ ] The process starts without privileged mode, host networking, host PID,
  host filesystem mounts, device access, or an ambient capability set.
- [ ] Writable paths are explicit, minimal, and disposable; no credential or
  receipt is written outside an approved ephemeral path.
- [ ] CPU, memory, process-count, file-descriptor, and wall-clock limits are
  documented and exercised.
- [ ] The test proves the process cannot become root or escape the declared
  boundary under the supported runtime.

### P5-03 — secret handling

- [ ] The key is injected only at runtime through the approved secret channel;
  the build and image inspection show no secret material or secret-shaped
  value.
- [ ] Process inspection, `/proc`/equivalent inspection, command-line capture,
  environment diagnostics, crash output, and logs do not disclose the key.
- [ ] Request, response, receipt, error, and evidence serializers redact
  authorization headers and provider bodies according to the P2 contract.
- [ ] Missing, blank, malformed, and revoked/unusable credentials refuse
  before provider invocation where the runtime contract permits.
- [ ] The evidence bundle contains only sanitized metadata and digests, never
  the key or a recoverable token.

### P5-04 — stdin/API contract

- [ ] The accepted request schema, protocol framing, content type, maximum
  size, one-request/one-result lifecycle, and exit/status mapping are frozen
  in the operator documentation.
- [ ] Valid input produces only the documented typed result/receipt shape;
  answer ordering and unknown fields follow the P1 validator rules.
- [ ] Empty input, malformed JSON, oversized input, duplicate framing,
  unsupported version, and trailing data fail closed without a provider call.
- [ ] stdout is machine-readable and stable; diagnostics go to stderr and
  contain no secret or raw provider payload.
- [ ] The container does not accept caller-supplied endpoint, model identity,
  cost cap, route, effect, or credential override through the request body.

### P5-05 — health and readiness

- [ ] Health reports only process/container liveness and does not call
  OpenRouter or any other provider.
- [ ] Readiness verifies local configuration, validator/runtime availability,
  and required non-secret dependencies without exposing the credential.
- [ ] Readiness is false or unavailable when the image/configuration is
  invalid, the runtime contract is incompatible, or the required secret
  channel is absent; this state is observable without a live call.
- [ ] Health/readiness ports or commands are bound to the declared interface
  and cannot be used as an alternate decision or provider invocation path.
- [ ] Startup, shutdown, signal handling, and one-request completion have
  bounded behavior and leave no secret-bearing temporary files.

### P5-06 — refusal behavior

- [ ] Missing or invalid request: deterministic validation refusal, zero
  provider invocations.
- [ ] Missing/invalid credential: secret-safe refusal, zero provider
  invocations where preflight applies.
- [ ] Provider auth/error/malformed envelope: typed refusal, no fabricated
  answers, and no success status.
- [ ] Timeout, cancellation, process failure, or ambiguous transport outcome:
  bounded refusal with no unsafe retry or duplicate effect.
- [ ] Redirect, TLS certificate/authority mismatch, unexpected host, or
  unsupported endpoint family: refusal; redirects are not followed.
- [ ] Cost estimate or observed spend over the frozen cap: refusal, with no
  cap override from the caller and no excess call.
- [ ] Every refusal receipt omits credentials, raw provider bodies, and
  unnecessary user state while retaining the reason class and timestamp.

### P5-07 — evidence and attestation

- [ ] Evidence identifies the source commit, image digest, build inputs,
  runtime version, host/container runtime identity, test fixture set, and UTC
  execution time.
- [ ] Each check has a stable evidence ID, command/procedure, sanitized output
  digest, reviewer, and disposition (`PASS`, `FAIL`, or `PENDING`).
- [ ] Live provider evidence, if later authorized, is separately identified
  from deterministic offline evidence and includes provider URL, model
  identity, request class, usage/cost, and UTC timestamp without secrets or
  raw sensitive content.
- [ ] Attestation is independently verifiable from the recorded digests and
  does not rely on container self-report alone for isolation or invocation
  claims.
- [ ] Any failed, missing, stale, or contradictory evidence blocks release;
  unresolved HAWF or downstream holds are not silently reconciled here.

### P5-08 — rollback and quarantine

- [ ] The prior approved package path remains available and selectable without
  the candidate image.
- [ ] Rollback is a documented digest-pinned operation, tested in a disposable
  environment, and has a bounded completion/verification procedure.
- [ ] A failed, revoked, unverifiable, or suspect image is quarantined by
  digest and cannot be selected by a floating tag or cached local alias.
- [ ] Rollback does not delete evidence, rewrite receipts, mutate parent
  routing policy, or spend against the provider.
- [ ] Recovery from partial startup, failed pull, failed health check, and
  ambiguous deployment state is documented with a human owner and stop point.

### P5-09 — parent routing preservation

- [ ] A clean-tree diff from the approved parent baseline proves no change to
  RCM/D10/D13 routing registries, eligibility surfaces, route selection, or
  standard fallback behavior.
- [ ] Existing parent tests and Jev package tests pass against the candidate
  without changing fixtures, expected route decisions, or refusal semantics.
- [ ] No container metadata is treated as routing eligibility, authorization,
  or spend approval.
- [ ] The evidence index names the exact parent baseline and test results;
  “no observed change” without a diff/test artifact is not sufficient.

## Acceptance criteria

- [ ] AC1 — Every P5-01 through P5-09 check has a recorded disposition; no
  required item remains `PENDING` at release.
- [ ] AC2 — The final image and all mutable inputs are identified by immutable
  digests, with reproducible build and independent attestation evidence.
- [ ] AC3 — Non-root, least-privilege, secret-safe execution is proven by
  external or independently reproducible checks, not image self-report only.
- [ ] AC4 — The stdin/API, health/readiness, and refusal contracts are
  documented and exercised offline before any optional live-call evidence.
- [ ] AC5 — Rollback and quarantine are tested, bounded, digest-pinned, and
  retain evidence.
- [ ] AC6 — Parent RCM routing and standard behavior are proven unchanged by
  exact diff and test evidence.
- [ ] AC7 — Two fresh release/security reviews find no unresolved Critical or
  High issue, and every review finding has a recorded disposition.
- [ ] AC8 — Human Gate 3 acceptance is recorded only after merge, fresh local
  main refresh, and checklist/evidence-index review.

## Required evidence record

The companion checklist is the canonical working index for this parcel. At a
minimum it must contain:

- candidate source commit and final image digest;
- build definition, dependency, SBOM, provenance, and scan digests;
- environment/runtime identity and UTC timestamps;
- one row for each P5-01 through P5-09 check;
- sanitized command/procedure output digests and reviewer dispositions;
- rollback/quarantine rehearsal evidence;
- parent-routing diff and test evidence;
- review verdicts and the post-merge local-refresh receipt;
- unresolved blockers, if any, with owner and stop condition.

Do not replace a missing artifact with prose, a screenshot without a digest,
or a provider model-page URL. Keep missing evidence explicitly `PENDING`.

## Allowed files

- `plugins/foreman-line/docs/specs/active/JEV-P5-portable-container-release.md`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/jev-container-release-checklist.md`

## Forbidden files and effects

Every other path is forbidden for this parcel. In particular, do not modify
Jev source, tests, manifests, lockfiles, Docker files, CI, parent RCM/D10/D13
artifacts, charter, Pi/host state, HAWF, Helmholtz, routing registries, or
downstream workflows. Do not publish an image, invoke a provider, access a
credential, spend, or perform a deployment.

## Verification plan

1. Confirm only the two allowed files are added and all existing user changes
   remain untouched.
2. Run the repository's narrow markdown whitespace/encoding checks and inspect
   the rendered diff for accidental claims or scope expansion.
3. Hand the checklist to the P5 reviewers with all unobserved fields marked
   `PENDING`.
4. After implementation evidence exists, rerun every P5 check from a clean
   checkout, obtain the required reviews, merge, refresh local main, and seek
   human Gate 3.
