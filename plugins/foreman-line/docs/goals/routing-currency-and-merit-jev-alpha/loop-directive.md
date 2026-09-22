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
Gate 3 at their recorded merged commits. JEV-P2–P5 remain ungranted. No live
provider call, spend, host/Pi mutation, or parent-goal surface change is
authorized.

## Standing authorizations and limits

1. **Gate 1** is ratified for the exact J1–J10 replacement text in the charter.
   Any future locked-decision change reopens Gate 1 for that decision only.
2. **Gate 2** was granted for the exact JEV-P1 parcel recorded in the charter;
   that parcel is now closed. Stop and request a new exact parcel-set grant
   before dispatching JEV-P2 or any later parcel.
3. **Gate 3** is accepted for the bounded JEV-P0 handoff at merged commit
   `cf6c5536c7f7e4d0b6d92dd7ea570f44d49d961e` and the bounded JEV-P1 handoff at
   merged commit `bd9707a1f7ae7052204c5b06fc75977677216232`. It does not
   authorize JEV-P2–P5 or any live call, spend, host/Pi, parent, HAWF,
   Helmholtz, or general-routing action. Merges remain human-owned for later
   parcels.
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
   architecture/risk, security review required before release, dual review.
4. **JEV-P3** — `support-triage-advisory-v1` consumer contract; recommendation-only
   data, application-owned effects, no general routing integration; architecture/
   risk, dual review.
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
