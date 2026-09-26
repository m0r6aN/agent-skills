---
ticket: PMC-P2B
title: Durable micro-USD budget ledger and attempt state
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Implement exact conservative cost arithmetic and persistent atomic reservations
for the initial local PMC launcher. Keep unknown liabilities charged across
failures/restarts and expose the only durable consume transition used immediately
before a send. This parcel cannot launch, mint permits or choose a model.

## Constraints

- Amendment 05 V4 is governing canon. Node 24.19.0 filesystem/crypto only, existing
  TypeScript/node:test tooling, no new dependency or production network.
- Follow P2A interface freeze without importing its future controller. P2C composes
  P2A's exact cost-value port with this canonical helper; no duplicate arithmetic.
- Runtime caller supplies trusted budget scope/limit/source and authenticated rate
  lexemes/settlements. Tests use isolated temporary storage and synthetic data.
  Never read host settings, credentials or a class ceiling as remaining balance.

### Frozen money and state contract

Expose a bounded money helper and createLocalPmcLedger over an explicit absolute
store root, initialized epoch and injected clock. Public operations are snapshot,
reserve, consume, settle and cancelWithNoSendProof; mutation ports stay private
to trusted controller/sender wiring, not task input. Request IDs are opaque safe
identifiers, not path fragments. Interfaces are concrete closed types.

Ledger USD fields are integer micro-USD, from zero through Number.MAX_SAFE_INTEGER.
Decimal rate INPUTS are strings matching a nonnegative finite base-10 grammar,
no exponent or sign, at most 18 fractional digits and bounded total magnitude.
Each price evidence record binds original decimal lexemes (or exact rational
numerator/denominator), units, authenticated source/profile digest, tariff and
per-send bounds. PMC/RCM numeric projections cannot become exact billed-price
authority by Number.toString(). Mismatch or inability to bound pricing refuses.
Parse to BigInt numerator/denominator. Compute all bounded token/fee components
exactly, sum, then ceil TOTAL to micro-USD; never round unit rates down. Reject
unknown rate units/fees/token maxima, overprecision, overflow or any intermediate
whose declared bound cannot be checked. Preserve exact rational projected cost
for P2A ranking independently of rounded reserve. No presumed cache discount.

Budget scope names authority/digest, limit, workflow/account/class allocation and
currency; remaining subtracts settled spending plus EVERY reserved, consumed or
uncertain maximum liability. Reserve performs that check atomically, including
other processes. Missing new-class authority refuses; no copied class budget.

States: reserved -> consumed -> settled or uncertain; reserved -> cancelled
requires trusted no-send proof; consumed/uncertain may reconcile to no-send only
from the sole owned sender's authenticated proof, never a caller assertion.
Persist consume before send; duplicate consume refuses. A crash after consume
is uncertain even if actual transmission never started. Restart retains all
liabilities and never retries. Timeout/abort/missing response is not no-send proof.
Provider-reported actual charge is a separate authenticated observation, never
equated to rounded conservative liability or a local estimate. Actual settlement
is authenticated by the trusted adapter; unknown amount retains
full bound; charge over the bound freezes new reservations pending reconciliation.

Use single-writer atomic transactions with explicit lock, durable flush and
atomic replacement/journal semantics. Initialization requires explicit authority;
missing previously initialized epoch/storage never silently starts at zero.
Reject path traversal, symlink/reparse escape, stale lock, torn/unverifiable state
and uncertain recovery. Do not auto-delete a stale lock to resume spending.
Trusted local OS/storage ownership is the declared threat model; hostile OS
writers are not solved by a JSON digest. No exactly-once external billing claim.

## Acceptance Criteria

1. Exact rate and cost vectors prove 18-digit precision, boundary rounding of
   total, zero cost, multi-component sum, overprecision/unsafe magnitude refusal,
   and no downward reservation from floating point or per-rate rounding.
2. Parallel process reserves cannot oversubscribe; duplicate consume cannot pass.
   Crash injection around every durable transition, torn state, stale locks,
   deleted initialized storage and restart preserve unknown liabilities/refuse.
3. Settlements and no-send proof require trusted authority; timeout/caller claims
   never refund; over-bound settlement freezes; prior uncertainty blocks automatic
   repeat/fallback spend. All operations are bounded and paths cannot escape root.
4. Two independent reviews accept concrete storage/money contract. Handoff states
   exact failure codes and that no permit or transport exists in this parcel.

## Out of Scope

Resolver/ranking, same-process permit/controller, HMAC/keys, Pi/HTTP, actual spend,
new budget amounts, host configuration, caller migration and activation.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)
- [P2A](PMC-P2A-owner-resolver.md)

## Allowed Files

- plugins/foreman-line/dispatch/src/pmc-launch/money.ts
- plugins/foreman-line/dispatch/src/pmc-launch/ledger.ts
- plugins/foreman-line/dispatch/tests/pmc-money.test.ts
- plugins/foreman-line/dispatch/tests/pmc-ledger.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2b-verification.md

## Verification Plan

Node 24.19.0, offline existing tools: dispatch `npm.cmd test`, `npm.cmd run
typecheck`, `npm.cmd run lint`, each native exit checked. Tests use real temp-file
transactions and process concurrency, never production ledger roots. Run unchanged
routing-policy regressions. Verify exact diff authority and no network imports.

## Readiness

Draft. Freeze durable-storage OS guarantees and bounded contract before dispatch;
if implementation requires a new storage dependency, split an adapter explicitly.
Do not substitute an in-memory ledger to get tests green.
