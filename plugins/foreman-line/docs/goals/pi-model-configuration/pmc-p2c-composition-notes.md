# P2C composition worklist

Coordinator shaping notes, 2026-09-26. This is not a build release. P2A and P2B
are being implemented in isolated worktrees; their final accepted exports and
failure semantics must be pinned before P2C is dispatchable.

## Existing entry points

The recorded caller inventory found no tracked Pi inference launch in
prepareDispatch or executeDispatch. The former prepares legacy routing and
dispatch artifacts; the latter creates a worktree and Stage-C receipt. The
generic Pi container is outside the governed boundary. P2E therefore needs an
explicit opt-in governed handoff and actual exercised caller, not an unused
controller export labeled as caller migration. Existing v0 selection remains
unchanged. P2C's current v0 adapter requirement is still canon until an explicit
reviewed amendment decides its initial execution scope.

## Decisions already fixed

- Initial transport is public OpenRouter chat only. L1/L2 provider pins, L6
  disablement, nonpublic refusal and empty break-glass set remain intact.
- The controller invokes the accepted resolver and sole exact-money helper.
  Request JSON cannot supply a winner, independent verification authority,
  tariffs, budget scopes, evidence authenticity or a sender capability.
- Production trusted installation ports are part of the trusted computing base.
  Ordinary task/extension input cannot construct or obtain those ports. This is
  not a sandbox against arbitrary privileged JavaScript in the host process.
- P2B's callback layout is coordinator-approved: initializer receives the owned
  initialization request; settlement/no-send receive owned AttemptV1 plus the
  captured observation/proof, outside transactions with current-row revalidation.
- P2B costValueDigest includes requestDigest and exact accepted price lexemes.
  P2C forwards the computed value unchanged, with authenticated source evidence;
  it must not reinterpret a numeric catalog price as original tariff evidence.

## Required composition proofs before build release

1. Enumerate exact closed request, controller, installation and sender ports from
   accepted predecessor types. Keep production construction private to the
   governed installation path. Record how source/profile/policy/config/runtime
   digests are computed and authenticated; equal caller-supplied strings are
   insufficient. Freeze refusal precedence and owned-data bounds.
2. Specify durable, complete episode custody, including concurrent requests,
   changed request IDs and restart. P2A only checks a supplied history; P2B
   retains per-request liabilities, not the entire resolver decision history.
   The owner adapter must prove completeness or refuse. An in-memory map or
   descriptive receipt alone cannot close this requirement. Do not smuggle an
   unreviewed fourth table into P2B or claim a two-store operation is atomic.
3. Bind a final immutable wire string to the exact request and decision, endpoint,
   protocol, identity, thinking/privacy/tool semantics and conservative counts.
   Define how P2D proves the conservative input-token bound without guessing a
   tokenizer. All transformations finish before authorization; no post-consume
   callback can change bytes or widen authority.
4. Define the reservation-to-permit failure path. Lost acknowledgement cannot
   grant a permit, refund or replay. Rechecking current policy/evidence may refuse
   an existing permit; liabilities remain until authenticated reconciliation.
   Holding a reservation does not permit restarting under a fresh request ID.
5. Pin the sole sender's proof custody and one-use semantics. Distinguish exact
   authenticated no-send, possible-send uncertainty, usage estimates, and actual
   reported charge. HTTP errors, timeouts and process crashes are not no-send.
6. Demonstrate synthetic testing cannot select production credentials or HTTPS.
   Test fixtures can construct trusted fake ports in their own private harness,
   but no request flag or exported test-mint grants production authority.

P2C's review must resolve these against actual code, followed by P2D terminal
coverage and P2E caller/config evidence. Offline predecessor checks do not satisfy
the HRO cache, recovery, receipts, configuration, operator or live measurement
exit criteria. No provider call or host configuration change has occurred here.
