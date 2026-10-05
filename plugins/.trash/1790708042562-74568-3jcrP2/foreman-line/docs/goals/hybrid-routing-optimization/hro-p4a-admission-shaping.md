# HRO P4A1 durable recovery admission shaping

Draft contract only; no runtime or production activation.

## Source and decisions

Clean shaping base: 3c6ca35666611a7da65336395f7e1cfbc5206c84 on
codex/hro-p4a-admission-shaping-20260926. Ratified P4A source is
45b50e66be7d3a4a29519063aeae87c1270ce8b8.

Actual source blobs under plugins/foreman-line:

| Owner | Git blob |
|---|---|
| dispatch/src/pmc-launch/intent-custody.ts | c2d967de9dc6b0f1fe17f4aafe528a8678194432 |
| dispatch/src/pmc-launch/ledger.ts | 552e0b1163178ace90bbc4369edaf30e346d1eb6 |

B1 initializeIntentOwnerV1 exclusively creates pmc-intent-v1.sqlite, persists a
closed maximum of 128 intents and returns genuinely preissued episode/R1/R2 IDs.
openIntentOwnerV1 is distinct and cannot prove fresh initialization. B1's private
path/transaction helpers are not reusable exports. Its begin changes launch state;
P2B reserve creates liability. Neither operation is a metadata-admission marker.

Root adopted the Step0 recommendations under delegated prerequisite authority:
separate narrowly owned SQLite store; fresh-bootstrap-only admission; no reopening
or automatic repair; conservative bounds. This explicitly extends the prerequisite
scope while leaving P4A's original two-document parcel and B1 schema untouched.
The 1-second SQLite contention bound is not an end-to-end I/O guarantee.

The [spec](../../specs/active/HRO-P4A1-durable-recovery-admission.md) freezes a
private installed factory that calls and retains the actual B1 initialization
acknowledgement itself. Caller-supplied init results cannot authenticate freshness.
The fixed admission file shares the actual B1 root, removing alternate-journal
selection as a reset. Registration includes B1 identity and its actual issued IDs;
changing business/generation/workflow labels does not allow reopening an existing
B1 store. Genuine uniqueness across replacement stores/roots is still a production
setup/storage-custody prerequisite, not authority conferred by UUIDs or digests.

## Atomicity and authority limits

There is no cross-database transaction. B1 success and later admission failure
conservatively hold metadata preparation without exposing C/origin/broker custody.
A partial B1 initialization or uncertain acknowledgement also holds. Even absence
of an admission file cannot turn an existing B1 store into fresh initialization.
An untouched failed setup performed no metadata action; production uniqueness must
still authorize any subsequent fresh setup. No cleanup/retry path erases artifacts.

The offline constructor uses a fixed, captured synthetic setup authenticator and
real B1/SQLite writes. It creates no real workflow approval, C/origin capability,
network service or production broker. Production construction always refuses.
The future genuine installation and P4A consumer must capture their owner directly;
JSON records, private-module imports and successful hashes are not authentication.
No new human-only approval requirement is introduced.

One acknowledged batch exposes one private broker claim. No restart can reconstruct
it, and all registered episodes remain held after process loss, including unused
ones. P4A retains its finer in-process one-refresh/deadline rules. B1's legitimate
terminal-state R2 reopen remains intact and never restarts metadata preparation.

## Scope and verification

Exactly two new documents are authorized: this note and the linked spec. This
explicit envelope overrides generic shaping ShapingResult emission. The future
five new files are enumerated in the spec; no existing owner, schema, dependency,
barrel, charter or configuration changes are authorized. The additional 32 retained
local-installation cap bounds private registries and is a proposal for design review.

Future acceptance requires genuine temporary stores/process tests, partial-bootstrap
and lost-ack controls, complete input/path/bounds negatives, and preserved actual
B1 R2 behavior. No runtime tests are claimed by this documentation-only release.
Two independent design reviews, root disposition and separate implementation
Step0/release remain necessary. Production bootstrap, P4A composition, publication,
C/D/E/P3 and full HRO live evidence remain separate gates.

Documentation checks: frozen linter, required body sections, local links and exact
two-file whitespace/diff checks; final handoff reports actual results and clean hash.

## Delegated design ratification — 2026-09-26

Coordinator and independent reviewer A APPROVE16ebc41a3890bd71a6d7cdc6c686bee71265788f.
Both inspected actual B1 initialization/persistence contracts and the complete
bounded design. Root adopts the distinct immutable SQLite admission owner, fresh
bootstrap-only rule, permanent conservative restart holds and proposed numerical
bounds under the user's explicit prerequisite delegation. The added32 retained
local-installation cap is accepted as a bound, not a measured capacity result.

This ratifies the contract and exact five-file future envelope only. A genuine
builder Step0 and explicit runtime release remain necessary. Production constructor
refuses; no actual business-intent uniqueness, installed production authority,
provider evidence, live result or goal completion is claimed. B1's existing R2
reopening remains unchanged. Frozen lint/link/diff checks passed; no runtime tests
were run or inferred by design review.
