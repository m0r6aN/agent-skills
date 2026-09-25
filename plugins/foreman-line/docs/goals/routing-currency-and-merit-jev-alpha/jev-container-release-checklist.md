# JEV portable-container release checklist

**Parcel:** JEV-P5
**Status:** `PENDING — release candidate and evidence not yet supplied`
**Spec:** `plugins/foreman-line/docs/specs/active/JEV-P5-portable-container-release.md`
**Prepared:** 2026-09-22
**Scope:** Documentation and evidence index only. This checklist does not
authorize a build, image publication, provider call, spend, host/Pi action,
parent routing change, HAWF reconciliation, or Helmholtz handoff.

## How to use this checklist

One row is required for every check. Replace `PENDING` only with a
reproducible result backed by a sanitized artifact and digest. Do not infer
success from a source file, model page, local cache, or documentation example.
Record timestamps in UTC and use immutable identifiers wherever available.

Required row fields:

- check ID and exact procedure/command;
- source commit, image digest, and environment/runtime identity;
- UTC start/end time;
- result: `PASS`, `FAIL`, or `PENDING`;
- sanitized evidence path and SHA-256 digest;
- reviewer and notes/blocker.

## Release identity

| Field | Value | Status |
|---|---|---|
| Source repository/ref | `PENDING` | PENDING |
| Source commit | `PENDING` | PENDING |
| Container build definition digest | `PENDING` | PENDING |
| Base image name and immutable digest | `PENDING` | PENDING |
| Final image digest and architecture | `PENDING` | PENDING |
| Dependency lockfile digest | `PENDING` | PENDING |
| SBOM/provenance attestation digest | `PENDING` | PENDING |
| Vulnerability scan tool/version/result digest | `PENDING` | PENDING |
| Builder identity and clean-build receipt | `PENDING` | PENDING |
| Candidate registry/repository | `PENDING` | PENDING |
| Release owner | `PENDING` | PENDING |

## Check matrix

| ID | Exact release check | Required evidence | Result |
|---|---|---|---|
| P5-01a | Build from the recorded source commit and pinned build inputs in a clean context. Repeat independently and compare final digests. | Two build receipts, context manifest, input digests, final image digest, UTC timestamps | PENDING |
| P5-01b | Inspect image metadata and verify the base image, architecture, dependencies, SBOM, provenance, and scan are immutable/recorded. | Image inspect output, SBOM, provenance, scan receipt, SHA-256 digests | PENDING |
| P5-02a | Start with the declared non-root UID/GID and verify no privilege escalation, privileged mode, host namespace, device, or ambient capability is required. | Runtime configuration and independent process/capability inspection | PENDING |
| P5-02b | Exercise read-only root filesystem and explicit disposable writable paths under CPU, memory, process, descriptor, and wall-clock limits. | Runtime limit receipt, filesystem/process inspection, cleanup receipt | PENDING |
| P5-03a | Build and inspect layers/context/arguments for credentials or secret-shaped values; prove runtime injection is the only secret path. | Secret scan, context manifest, image-layer scan, sanitized launch receipt | PENDING |
| P5-03b | Inspect process args/environment diagnostics, logs, errors, receipts, and crash output; verify the key and raw provider bodies cannot appear. | Redacted outputs and negative scan digest | PENDING |
| P5-03c | Run missing, blank, malformed, and unusable credential cases; verify safe refusal and no provider invocation where preflight applies. | Offline refusal fixtures, harness-side invocation counter, result receipts | PENDING |
| P5-04a | Send one valid request using the documented stdin/API framing and verify the exact typed result/receipt contract. | Request fixture digest, output digest, exit/status receipt | PENDING |
| P5-04b | Send empty, malformed, oversized, duplicate, unsupported-version, trailing-data, and caller-override inputs. | Negative fixture matrix, zero-invocation counter, sanitized stderr | PENDING |
| P5-05a | Probe liveness and readiness with no provider connectivity; verify health is local-only and readiness does not disclose the credential. | Probe transcript, network denial/allowlist receipt, readiness output | PENDING |
| P5-05b | Exercise invalid configuration, absent secret channel, startup, shutdown, signal, and one-request completion paths. | Lifecycle receipts, bounded timings, temporary-file cleanup evidence | PENDING |
| P5-06a | Exercise auth/error/malformed-provider, timeout/cancellation/process-failure, redirect/TLS-authority, unexpected-host, unsupported-endpoint, and cost-cap refusals with injected fakes or deny-only fixtures. | Scenario matrix, zero/one-call counters as applicable, refusal receipts | PENDING |
| P5-06b | Verify refusals do not fabricate answers, follow redirects, retry past bounds, duplicate effects, or expose secrets/raw bodies. | Negative assertions and redacted output digests | PENDING |
| P5-07a | Assemble source, image, environment, fixtures, timestamps, procedure, result, reviewer, and digest fields for every check. | Complete evidence manifest and SHA-256 inventory | PENDING |
| P5-07b | Independently verify attestation and invocation/isolation claims; distinguish offline evidence from any separately authorized live evidence. | Independent verifier receipt and evidence classification | PENDING |
| P5-08a | Rehearse digest-pinned rollback to the prior approved path and verify bounded recovery after failed pull, health failure, startup failure, or ambiguous state. | Rollback transcript, prior image digest, recovery/verification receipt | PENDING |
| P5-08b | Quarantine a failed/revoked/unverifiable image and prove floating tags/caches cannot select it. | Quarantine record, selection-denial receipt, retained evidence digest | PENDING |
| P5-09a | Compare a clean-tree parent baseline against the candidate and verify no RCM/D10/D13 routing or eligibility surface changed. | Exact diff, baseline ref/digest, path allowlist result | PENDING |
| P5-09b | Run parent and Jev package tests; verify route decisions, fallback behavior, and refusal semantics are unchanged. | Test commands/results, fixture digests, test-log digest | PENDING |

## Evidence ledger

| Evidence ID | Supports | Artifact/path | SHA-256 | UTC timestamp | Reviewer | Disposition |
|---|---|---|---|---|---|---|
| EV-JEV-P5-001 | P5-01 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-002 | P5-02 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-003 | P5-03 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-004 | P5-04 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-005 | P5-05 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-006 | P5-06 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-007 | P5-07 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-008 | P5-08 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |
| EV-JEV-P5-009 | P5-09 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | PENDING |

## Reviews and human gate

| Item | Required condition | Status |
|---|---|---|
| P4 predecessor | JEV-P4 Gate 3 acceptance recorded before P5 closure | PENDING |
| Architecture/release review A | Fresh independent review; no unresolved Critical/High finding | PENDING |
| Architecture/release review B | Fresh independent review; no unresolved Critical/High finding | PENDING |
| Evidence reconciliation | Every failed, missing, stale, or contradictory item has an owner and stop condition | PENDING |
| Merge | P5 artifacts merged to the approved branch | PENDING |
| Local refresh | Local main refreshed after merge; checklist and evidence index re-read | PENDING |
| Human Gate 3 | Explicit acceptance recorded for bounded JEV-P5 only | PENDING |

## Blockers and carried holds

- `PENDING`: release candidate implementation and image identity are not
  supplied by this documentation parcel.
- `PENDING`: P4 boundary/security scenario results and Gate 3 record.
- `PENDING`: review verdicts, merge commit, and post-merge local refresh.
- HAWF remains `escalated-unresolved / downstream hold` if that status is
  still active when evidence is assembled; this checklist does not act on,
  reconcile, or pass that hold to Helmholtz.
- No host-owner, Pi, OpenRouter, or live provider evidence is accepted here
  without its exact source, UTC timestamp, sanitization boundary, and digest.

## Closure rule

This checklist is not a release approval. JEV-P5 remains open while any check,
evidence row, review, merge, refresh, or Gate 3 item is `PENDING` or `FAIL`.
Closure requires all required checks to be `PASS`, the evidence manifest to be
independently verifiable, parent routing preservation to be proven, and the
human Gate 3 decision to name the bounded P5 artifact set.
