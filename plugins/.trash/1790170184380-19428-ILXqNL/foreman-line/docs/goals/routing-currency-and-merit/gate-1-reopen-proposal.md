# Gate 1 Reopen Proposal — Routing Currency and Merit

**Disposition:** RATIFIED 2026-09-20 by Clinton Morgan: “Ratify Gate 1 reopen proposal
A–K and queue amendments 1–6.” The recommendations below are now incorporated into
`charter.md`; this file remains the proposal and ratification evidence.

The mandatory plan review found changes required before any parcel is shaped. This is a
proposal, not a silent charter amendment. The developer must ratify or amend the items
below. Until then, the original ratification remains recorded, but the affected decisions
are reopened and dispatch is stopped.

## Recommended amendments

### A. Class-A withdrawal authority — D5/D6

Recommended replacement: Class A produces a machine-generated, digest-bound withdrawal
proposal and a reviewable policy diff. It does not mutate `routing-policy.yaml`, merge a
branch, write `settings.json`, or change live dispatch authority automatically. The
dispatch preflight refuses an invalid active candidate with a typed error until the
withdrawal is human-merged under Gate 3. Remove “auto-apply” from the exit criterion;
automatic promotion remains forbidden.

### B. Current-fact source — D1/D3/D10/D11

Recommended replacement: dispatch uses only a versioned, dated local catalog snapshot
whose digest and freshness are recorded in the route receipt. The preflight proves
consistency with that snapshot; it does not claim live provider availability. Missing,
stale, partial, or namespace-mismatched snapshots refuse. Live cache/network access is
proposal-time only.

### C. Proposal evidence versus GMF execution evidence — D12 and relationship text

Recommended replacement: RCM-P6 emits an RCM-owned proposal evidence manifest with source,
timestamp, input digests, policy digest, diff, and change class. It does not fabricate
GMF effect/permission/spend/terminal references. GMF manifests and receipts are consumed
only when a real execution receipt satisfies GMF’s contract.

### D. Receipt and replay ownership — exit criterion 8

Recommended replacement: add a dedicated receipt/replay parcel before RCM-P8. It owns
the effective requirements, policy digest, catalog-snapshot digest, vocabulary version,
derived context floor, predicate set, selected identity, and refusal-on-mismatch replay
contract. RCM-P10 may assemble evidence but does not define this contract.

### E. Actual dispatch integration — D7/D8 and RCM-P4/P5

Recommended replacement: add a dispatch-integration parcel after resolver/schema work.
It carries effective frontmatter requirements into the real dispatch caller, preserves
Pi’s bounded role, enforces thinking level where supported, and reconciles the executed
model identity with the selection receipt. Resolver unit tests alone do not satisfy the
exit criteria.

### F. Pi settings ownership — D1/D13 and RCM-P7

Recommended replacement: RCM-P7 generates an idempotent, reviewable projection artifact
or patch; it never writes Pi’s shared `settings.json`. A projection must preserve the
explicitly owned host state and refuse on endpoint/provider mismatch. No Foreman code
reads the file back for routing.

### G. F4 and Jev disposition — OQ7/D10

Recommended replacement: RCM-P0 owns the live reconciliation and produces a correction
proposal. If `typesafe/jev-1.13` remains absent, the lane is explicitly disabled/refused;
no substitute identity is silently installed. Any host correction requires a separately
authorized human action and evidence.

### H. Expertise and shadow semantics — OQ2/D3/D4

Recommended replacement: an expertise binding filters within the already eligible tier;
it never reorders or crosses tiers. Missing binding means no expertise narrowing; an
unsatisfiable binding refuses rather than silently falling back. “Shadow” means evidence-
only comparison and never a dispatch-default route in this goal.

### I. Price ceiling units — D2/D5

Recommended replacement: catalog price predicates, if retained, apply to explicitly
declared input/output rate units and refuse unknown prices. They are distinct from the
existing per-parcel `ceiling_usd` budget, which remains owned by the Context Ledger.

### J. Omitted requirements and derivation — D7/D8/OQ5/OQ6

Recommended replacement: new shaping emits `inputs`, `min_context`, and `thinking_level`;
legacy omission means text-only and the routing-class thinking default, but an
image-bearing surface without explicit `image` is a typed refusal. `min_context` is
derived from surfaces/spec body and may only be overridden upward. A model lacking the
requested thinking level refuses rather than silently downgrading.

### K. Merit admissibility — D12 and RCM-P8/P9

Recommended replacement: the corpus includes only independently accepted Stage-F
receipts with known model identity and settled cost; legacy unlabeled receipts,
estimated/pending costs, and non-accepted worker claims are excluded or separately
reported. Repairs are attributed to the model that executed them, and minimum-sample
and confidence rules are explicit before any shadow binding is proposed.

## Queue amendments required if the recommendations are ratified

1. Add the receipt/replay parcel before RCM-P8.
2. Add the dispatch-integration parcel before RCM-P5 closure and before the exit evidence
   pass.
3. Expand RCM-P0 to own F4/HAWF reconciliation evidence.
4. Expand RCM-P4/P5 acceptance to cover both F1 and F2 plus end-to-end execution.
5. Re-sequence RCM-P6/P7 around the projection and proposal-evidence contracts.
6. Make RCM-P10 an evidence assembly parcel only; it must consume, not invent, the
   receipt/replay and integration contracts.
