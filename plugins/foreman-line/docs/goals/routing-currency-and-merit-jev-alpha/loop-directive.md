# Jev Alpha Decisions — Coordinator Loop Directive

## COORDINATOR OWNERSHIP

The current dedicated Foreman Line coordinator session owns this queue from
2026-09-21. One goal, one coordinator. Ownership transfers only at a parcel
boundary by updating this block. If ownership is ambiguous, stop and report.

## Current state

Gate 1 is ratified for the original J1–J10 and the plan-review replacement
decisions. The mandatory plan review returned REQUEST CHANGES and was triaged;
the replacement decisions and non-locked queue corrections are now ratified or
accepted as recorded in the charter. JEV-P0 and JEV-P1 are accepted through
Gate 3 at their recorded merged commits. JEV-P2 is accepted at Gate 3 at
merged commit `34fc2f5` after post-merge verification. Gate 2 is granted for
JEV-P2–P5 in strict sequence. JEV-P3 PR #44 is **MERGED 2026-09-22**
(recorded in `docs/goals/goal-status-report-2026-09-26.md`); its predecessor
gate disposition is recorded in the charter as a coordinator decision
2026-09-26 under owner blanket authority, and JEV-P4/JEV-P5 are dispatched
under that disposition and the existing Gate 2 strict-sequence grant.
JEV-P4 scenario suite is green on disk (observed 2026-09-26):
`jev-decisions/tests/p4-boundary-scenarios.test.ts` 17/17 pass (6 core,
7 `[env:runtime-adapter]`, 4 `[env:container-launcher]`), full
`jev-decisions` `npm test` 44/44 pass; spec-linter exit 0 on the JEV-P4 spec
(one advisory only). JEV-P5 is dispositioned in
`jev-container-release-checklist.md` (coordinator decision 2026-09-26 under
owner blanket authority): offline checks CHECKED with citations (credential
preflight R06, launcher stdin-framing contract, injected-fake refusal matrix,
parent-surface non-change proof across JEV commits `cf6c553`, `bd9707a`,
`34fc2f5`, `2440aba`, `a2c2971`). Docker-reachable rows CHECKED with real
local Docker evidence 2026-09-26 (JevP5Docker builder session): **P5-01a,
P5-01b, P5-02a, P5-02b, P5-03a, P5-03b, P5-05a, P5-05b** — evidence
`jev-p5-docker-evidence-2026-09-26.md` (image `jev-decisions-container:
prototype` = `sha256:a480f6cbdae7…`, local cache only; base
`node:22.14.0-bookworm-slim@sha256:1c18d9ab3af4…`). Remaining BLOCKED:
P5-07a, P5-07b, P5-08a, P5-08b, P5-09b (parent half), plus the
SBOM/provenance-attestation, CVE-scan, registry, and source-candidate
release-identity rows and the human-gate rows (reviews A/B, merge, local
refresh, Gate 3). Carried findings: empty-string API key refuses
pre-transport (`evidence:R06`); whitespace/malformed keys pass the presence
guard and provider-side usability is offline-unverifiable; F1 image digests
are not byte-reproducible across clean builds (only the `/app` dir-entry
mtime varies — re-pin at candidate cut); F2 the container has no graceful
SIGTERM shutdown (SIGKILL required).
**GOAL state: JEV-P5 remains OPEN** — no item is PENDING; the exact remaining
set is the BLOCKED items (attestation and CVE-scan receipts, registry rows,
evidence manifest P5-07a/07b, rollback/quarantine P5-08a/08b, parent-suite
half P5-09b, reviews A and B, human merge, local refresh, human Gate 3).
No live provider call, spend, host/Pi mutation, or parent-goal surface change
is authorized outside the current parcel scope.

## Standing authorizations and limits

1. **Gate 1** is ratified for the exact J1–J10 replacement text in the charter.
   Any future locked-decision change reopens Gate 1 for that decision only.
2. **Gate 2** is granted for JEV-P2–P5 as an exact strict-sequence parcel set.
   JEV-P2 is accepted at Gate 3; JEV-P3 is now dispatchable. Stop before JEV-P4
   and every later parcel until its predecessor is accepted at Gate 3.
3. **Gate 3** is accepted for the bounded JEV-P0 handoff at merged commit
   `cf6c5536c7f7e4d0b6d92dd7ea570f44d49d961e`, the bounded JEV-P1 handoff at
   merged commit `bd9707a1f7ae7052204c5b06fc75977677216232`, and the bounded
   JEV-P2 handoff at merged commit `34fc2f54cb39b22faed576fc3460cba1d3631745`.
   It does not authorize JEV-P3–P5 or any live call, spend, host/Pi, parent, HAWF,
   Helmholtz, or general-routing action. Merges remain human-owned for JEV-P2–P5.
4. A future Gate 2 grant may authorize only the exact live-call bound recorded in
   J10: one call per authorized run, zero retries, concurrency one, 30-second
   timeout, 64-KiB request limit, and aggregate cap $0.01 USD per run.
5. The runtime may use `OPENROUTER_API_KEY` only when a later parcel and Gate 2
   authorize it. Credentials must never enter fixtures, receipts, logs, or evidence.
6. No edits may be made to the parent RCM routing registry, Pi template, parent
   charter, or parent loop directive without a separately ratified integration
   parcel and explicit serialization owner.

## Queue in strict order

1. **JEV-P0** — alpha surface contract and evidence boundary; architecture/risk,
   dual fresh adversarial review.
2. **JEV-P1** — pure typed request/response validator, exact identity binding,
   canonical JSON digests, and deterministic sanitized fixture replay; completed
   and accepted at Gate 3.
3. **JEV-P2** — secret-safe bounded runtime adapter and redacted receipt capture;
   architecture/risk, security review required before release, dual review;
   accepted at Gate 3 at merged commit `34fc2f5`; P2 is closed.
4. **JEV-P3** — `support-triage-advisory-v1` consumer contract; recommendation-only
   data, application-owned effects, no general routing integration; architecture/
   risk, dual review; PR #44 **MERGED 2026-09-22** (recorded in
   `docs/goals/goal-status-report-2026-09-26.md`); predecessor gate disposition
   recorded 2026-09-26 in the charter under owner blanket authority.
5. **JEV-P4** — environment-specific positive, negative, timeout, auth, privacy,
   cost, refusal, and provider-boundary scenarios; architecture/risk, dual review.
6. **JEV-P5** — release closure, operational documentation, evidence index, and
   parent-surface non-change proof; standard implementation risk.

## Per-parcel algorithm

For each parcel, do not skip steps:

1. Shape the parcel from the charter and write a precise spec with allowed files,
   forbidden surfaces, required evidence, security gate, and exact verification.
2. Coordinator-lint every factual claim against disk, then stop for the exact
   Gate 2 grant naming the parcel set.
3. Dispatch a fresh builder in a named worktree and branch with a Step 0
   restate-and-stop gate. A contract gap becomes a ratified amendment before code.
4. Closure-check the builder claim against disk before rerunning anything; wrong-
   shaped claims are empty and test-count tripwires apply to rework.
5. Run deterministic checks in PowerShell with `node -v` first, in the mandated
   environment.
6. Run one fresh adversarial review for standard-risk parcels and two independent
   frontier reviews for architecture/risk parcels. Reviewers are read-only and
   never fix or commit.
7. Triage findings and reproduce disputed findings before ruling. Rework gets a
   new Step 0 gate and verification tripwire.
8. Stop for human Gate 3 merge authorization. No merge is implied by this loop.
9. At Stage F, move the accepted spec to `docs/specs/done/`, clean only authorized
   worktrees/branches, append lessons with dispositions, and update this directive.

## Closure lessons and dispositions

- The original one-argument replay API exposed a real contract gap because
  complete replay requires a separate coordinator manifest receipt. Disposition:
  amendment A1 was ratified before implementation; the two-argument API is now
  recorded in the completed spec and charter.
- A read-only review alleged digest binding was shape-only. Reproduction showed
  JCS/SHA-256 recomputation was already present; disposition: retained the
  implementation and added a regression test forging matching fixture,
  manifest, and receipt digests, which fails with `R17`.
- The native TypeScript compiler was unavailable in the environment. Disposition:
  Node v24 native syntax validation, runtime tests, and the offline scans passed;
  no network dependency was introduced.

## Required evidence

- Exact requested and served identities, endpoint, schema version, response ID,
  UTC timestamps, usage, currency-qualified cost, and canonical request/response
  digests.
- Sanitized fixtures with provenance and no key, authorization header, or unsafe
  payload retention.
- Positive, negative, timeout, auth, privacy, cost, refusal, replay, and provider-
  boundary scenarios.
- Proof that Jev answers remain advisory data and cannot directly authorize effects.
- Proof that parent RCM D13, boundary-routing D10, registry/template, Pi, host,
  HAWF, Helmholtz, and standard routing surfaces were not changed.

## Stop conditions

Stop on a need to change D13 or boundary-routing D10; a missing identity or cost
currency; unbounded spend; secret leakage; aliasing; any parent-surface collision;
any security finding not closable in-parcel; a repeated test-count tripwire; any
host/Pi/HAWF/Helmholtz action; any general routing use; or any human gate not
explicitly granted.

## Wakeup pacing

While a builder or reviewer runs, completion notifications are primary. Use a long
fallback only as insurance; never poll rapidly. On restart, treat unclaimed
worktree state as untrusted and dispatch a fresh resume session with the original
Step 0 directive.
