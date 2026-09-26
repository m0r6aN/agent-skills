---
ticket: HRO-P4A
title: Bounded unknown-model recovery before launch custody
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Shape D8 recovery around the existing exact-mapping, RCM and PMC owners. A bounded
asynchronous broker prepares metadata before launch custody; existing PMC alone
authorizes selection and the predeclared R1-to-R2 transition. This document is a
review draft, not an implementation release or evidence of production readiness.

## Constraints

### Authority and release gates

The ratified HRO charter at `6d2d859d2f6ec65e917972fa06eca1538212b148`
retains mandatory negative caching and coalesced metadata refresh despite holding
the optional model-choice cache. HRO-P4 integration and its P3 dependency remain
prerequisites. This shaping release changes neither charter nor predecessor API.
Root ratification and two independent reviews must resolve the decisions below;
implementation additionally needs an exact source/test file amendment.

Accepted base is `727c0554f11990da778e7647e7a108f3ca6f95aa`. Source pins and
accepted design pins are recorded in the accompanying shaping notes. C is released
for its scoped build, not assumed implemented; D/E design approval is not live
activation. E's production entry deliberately returns PRODUCTION_EVIDENCE_MISSING.

### Prerequisite: authenticated catalog publication owner

The actual `producePublicObservationSnapshot` transforms supplied manifest and
projection bytes offline. Its results say `evidenceOnly: true`; its trust pins
express caller acceptance, not authentication. `evaluateCatalogEligibility`
checks supplied bindings but does not authenticate their origin either.

A separately reviewed RCM discovery/publication owner must therefore provide a
private installed port for metadata fetch, source authentication and atomic
publication. Proposed port name: `requestCatalogRefreshV1`. This is a NEW required
contract, not a claim that an exported function exists. Before implementation,
that owner's contract must fix allowed endpoint/profile, redirect refusal,
streaming byte limits, cancellation, source acceptance provenance, publication
version/CAS and authentic acquisition by C. No arbitrary caller URL, credential,
fetch function, successful JSON or digest can install this port or authorize a
snapshot. The offline producer remains its normalization dependency.

That owner must also authenticate a bounded ABSENCE outcome independently of
snapshot success: complete source coverage for the exact provider/model identity,
approved endpoint/profile and trust/account scope, publication generation,
observation time and validity interval. Completeness must exclude partial,
truncated or unfinished paginated discovery. Bind the outcome to the requested
identity set and accepted source provenance; no structural record alone is proof.
The same operation, byte, identity and deadline bounds apply. This is a required
new publisher contract, not an existing producer result or permission to expand
discovery scope. If authenticated completeness cannot be established, hold without
inserting an identity-negative entry.

Actual producer `INCOMPLETE_SCOPE` can contain absent, missing-required-facts or
unsupported-profile inventory and returns no canonical snapshot. Neither that
generic refusal nor its evidence-only inventory authenticates ABSENCE. An absent
row requires the separate publisher proof above; incomplete/unsupported/source
refusals never become absence by being cached.

Without that port, the broker returns PREREQUISITE_UNAVAILABLE without network or
launch calls. Production evidence cannot be synthesized from fixture custody.
New catalog identities never change mapping approvals, aliases, tiers, fallback
bindings, account entitlement or configuration. Configuration proposals/apply and
user diagnostics belong to P4b/P4c.

### Proposed numerical bounds (root ratification required)

| Resource | Proposed closed limit | Rationale |
|---|---|---|
| Registered recovery episodes | 128 per installed workflow, fixed before admission | Matches B1's closed maximum of 128 intents; one recovery episode per intent |
| Refresh participation | Once per episode, including joining an existing refresh | Joining, failure, timeout and refusal consume the same budget |
| Total episode deadline | 10,000 ms from first admission, monotonic | Includes queue/join, fetch, validation and publication; never extends on retry |
| Active refresh operations | 4 per installed broker | Bounds metadata concurrency; no unbounded queue |
| Waiters | 128 total, one per episode | Duplicate callers join the same episode promise, not new waiters |
| Requested identities | 256 distinct provider/id pairs per operation | Existing producer scope cap; exact normalized identity set |
| Response/input bytes | 8 MiB per body/artifact; 16 MiB manifest plus projection aggregate | No greater than producer input bounds; streaming stop before excess allocation |
| Negative entries | 256 per broker, evict oldest insertion at capacity | Bounded acceleration only; eviction never restores episode budget |
| Negative TTL | 30,000 ms, capped by evidence validity | Short miss suppression; monotonic expiry and version isolation |
| Transient provider cooldown | 5,000 ms, no automatic retry | Bounded storm suppression where no accepted breaker is installed |

All limits include their boundary; one beyond refuses. Existing stricter source,
depth, string, owner, request or protocol bounds still apply. Publication is
eligible only if complete and acknowledged before the relevant episode deadline.
Late completion may be retained by the publication owner under its own contract,
but cannot reopen or complete a timed-out episode. A full active-operation table
returns CAPACITY_UNAVAILABLE immediately; it does not create background work.

### Closed pre-C broker contract

Proposed private installation `createRecoveryBrokerV1` accepts authenticated
workflow registration and captured owner ports, never task-selected adapters.
Its fixed registration lists at most 128 entries binding intentRef, episodeId,
workflowId, parcelId, original-request digest, authority/version tuple and B1's
already-issued R1/R2 IDs. No broker-generated replacement ID or content-derived
guess is accepted. Registration must prove B1 has not begun this intent; otherwise
return CUSTODY_BLOCKED. This proof and launch handoff are responsibilities of the
same trusted workflow owner, not caller booleans.

`prepareRecoveryV1({episodeId})` is the only proposed asynchronous operation.
Unknown fields, unknown episode, changed registration or concurrent mismatched
payload refuse before refresh. It resolves a closed union:

```ts
type PreparationV1 =
  | { kind: 'ready'; episodeId: string; publicationRef: string }
  | { kind: 'hold'; episodeId: string; code: HoldCode };
type HoldCode = 'MAPPING_MISSING' | 'CATALOG_ABSENT' | 'CATALOG_STALE'
  | 'REFRESH_FAILED' | 'REFRESH_TIMEOUT' | 'CAPACITY_UNAVAILABLE'
  | 'SOURCE_REFUSED' | 'PREREQUISITE_UNAVAILABLE' | 'CUSTODY_BLOCKED'
  | 'EPISODE_REFUSED' | 'ROUTE_UNAVAILABLE';
```

These are proposed broker outcomes, not additions to a frozen receipt union.
`publicationRef` is an opaque lookup reference, not authority. Only C's installed
authentic `acquire` port may acquire and authenticate that publication again.
Ready means metadata preparation succeeded; it does not promise launch eligibility.
The workflow owner passes the original registered request to C unchanged and at
most once for R1. C reruns all current policy, identity, eligibility, tariff,
independence, expiry and budget gates. A stale publication at launch refuses;
it does not start a second broker episode.

Episode states are registered -> preparing -> ready or held, followed by a single
owner-controlled handoff for ready. Terminal results are immutable for that
episode. First admission records the absolute monotonic deadline. Before invoking
or joining any refresh, record participation as spent, including synchronous
throws. Duplicate calls return the original bounded result. Cancellation never
refunds participation; stopping one waiter must not cancel another's valid wait.
Underlying refresh obeys its own 10-second operation cap, and each waiter retains
its original earlier deadline. No unhandled adapter rejection escapes the union.

Resolve exact approved mapping or explicitly registered alias first. Syntax
checking cannot infer identity or version equivalence. Missing mapping holds;
refresh cannot create an approval. Missing/stale evidence for an already approved
identity can consume the single refresh participation, then re-evaluate the same
mapping against the acknowledged publication. Only the pure RCM evaluator and
existing PMC resolver decide eligibility; the broker never returns a model choice.

Coalescing key is the exact workflow/authority scope, provider, approved endpoint,
profile/version, accepted publication generation, mapping/policy versions and
sorted requested-identity set. No coalescing across different trust/account
scopes. Negative keys additionally bind the exact requested identity and typed
absence reason. Only publisher-authenticated complete ABSENCE, bound as above,
is a negative identity entry; its validity caps the 30-second TTL. Missing proof,
generic INCOMPLETE_SCOPE or evidence-only inventory cannot populate the cache;
timeouts, authentication errors, endpoint errors, rate limits and outages are
distinct holds/cooldown observations, never evidence of model absence. A version
change invalidates the old negative entry but not any episode's spent bit.

### Process custody and restart

The proposed broker is single-process, private to one workflow owner. Its episode
table is not recoverable runtime authority. Consequently automatic restart or
cross-process takeover is UNSUPPORTED: durable workflow admission must mark the
installation generation admitted BEFORE exposing the broker, and deny reopening
any episode in that generation after process loss. Missing/uncertain admission
acknowledgement also holds. This prerequisite belongs to the workflow owner; an
in-memory map, UUID, marker owned only by the restarted broker, TTL or empty B1
history is insufficient. No replacement generation may silently reregister those
same intents. A separately reviewed recovery authority is required to lift these
broker admission holds. This prohibits renewed metadata preparation, not B1's
existing normal reopen of authenticated committed terminal state. Broker restart
rules neither revoke that owner contract nor furnish permission to launch R2.

If durable admission custody is unavailable, production broker installation
refuses. This draft does not add a third SQLite store or alter B1's schema. Tests
must use a real durable admission implementation once its separate contract is
accepted; mocks alone cannot establish restart safety. Negative cache and cooldown
may disappear on restart because admission still prevents episode replay.

### Launch failure and bounded fallback

C begins durable B1 custody before synchronous acquisition; therefore no refresh
is inserted into C, RCM, the resolver or the consume-to-send critical section.
An unselected closed-refused, pending, held, uncertain or succeeded B1 intent
cannot be reset by this broker. Reserved pre-consume liability has no authentic D
cancellation proof and remains outstanding; missing acknowledgement is no-send
evidence for neither budget nor owner. Lost acknowledgement quarantines the local
B1 instance, which refuses further claims. On normal reopen, an authenticated
owner terminal commit may still permit only the predeclared R2: primary
terminal-no-send or terminal-failed-settled, with unchanged identity, revision,
linkage, original quality and current expiry/budget checks. If only ledger
reconciliation committed, or owner state remains pending/held/uncertain, reopen
does not permit R2. Neither case permits replay of R1 or a third attempt. The
broker does not repair, replay or infer the missing acknowledgement; any accepted
R2 uses existing owner authority without restarting this metadata episode.

Only existing B1/P2A can admit the predeclared R2 following authenticated selected
primary terminal-no-send or terminal-failed-settled. Bind priorDisposition and
original primaryQuality to R1's digest/binding; bind current episode/budget to R2.
Recheck all current gates, expiry and remaining budget including outstanding
liability. No third attempt, replacement intent, provider/version reset, fallback
cycle, transient inference retry or arbitrary list walk. Missing mapping cannot
invent a terminal proof. Any cross-provider route must already be declared and
supported by the actual transport; D's OpenRouter-only contract does not supply a
Zen transport. Provider error classification requires validated transport-owned
evidence; HTTP status alone, including 404, proves no model identity fact.

Hold only the affected parcel and its dependents through the existing scheduler;
independent parcels may continue. No success/completion is fabricated. Existing
event ownership must bind original and actual route, episode, reason, refresh
participation/provenance and fallback disposition before a production integration
claim. This draft adds no receipt schema or telemetry writer.

## Acceptance Criteria

| AC | Required evidence before implementation acceptance |
|---|---|
| 1 | Exact mapping/registered-alias positives; unknown preview slug, similar name, cross-provider guess and unapproved newly discovered identity all hold without inference. |
| 2 | Real producer/reader/adapter replay under authentic test installation; malformed, stale, mismatched digest/profile/scope and evidenceOnly-as-authority negatives. Missing production publisher refuses with zero network/C calls. |
| 3 | Same-key concurrent misses share one operation; different trust/version/scope keys do not. Duplicate episode callers spend once. 4-operation/128-episode/256-identity and byte boundaries plus one-over cases; total deadline includes waiting/validation/publication. |
| 4 | Paired authenticated complete ABSENCE inserts a version-scoped negative versus generic INCOMPLETE_SCOPE, absent evidence-only inventory, incomplete/unsupported rows or missing completeness proof inserting none. Independently vary exact identity, scope, generation and validity; mismatches refuse insertion. Valid negatives expire at the earlier of 30 seconds or proof validity; expiry, eviction, version change and 5-second cooldown never reset participation. Auth/endpoint/rate/outage/404 distinctions stay typed. No unbounded queue or late-result resurrection. |
| 5 | Real durable admission process-loss tests: before/after admission acknowledgement, before/after refresh invocation, ready-before-handoff and handoff-before-C-ack all refuse metadata-episode replay on broker reopen; cross-process duplicate broker owner is denied. This does not override the distinct accepted B1 terminal-state reopen in AC7. No fake admission authority. |
| 6 | Actual C/B1/P2A/P2B composition proves refresh precedes begin; acquire stays synchronous; original request unchanged; ready confers no authority; stale-at-launch refuses. Independent parcel progresses while affected/dependent parcel holds. |
| 7 | Actual R1-to-R2 successful fixture and wrong-domain evidence negatives. Paired faults for both primary terminal-no-send and terminal-failed-settled: owner COMMIT before lost acknowledgement permits only predeclared R2 on normal authenticated B1 reopen; ledger reconciliation before owner COMMIT remains blocked on reopen. The quarantined instance refuses in both cases. Preserve identity/revision/linkage/expiry/original-quality checks; deny R1 replay and third attempt. Missing mapping/no-selection, reserved, pending, held, uncertain, success and exhausted R2 deny redispatch. Budget includes outstanding liability; no case restarts the broker episode. |
| 8 | Hostile input and throwing/malformed/cancelled ports return typed bounded holds; synthetic fixtures cannot select production mode. No provider/config/receipt writes in offline suite. |

## Out of Scope

Runtime implementation in this release; provider/network calls; credentials;
configuration changes; provider discovery approval; global model-choice cache;
new fallback policy; retry/reconciliation authority; new receipt schema; fabricated
production adapters; universal crash recovery or activation of E's refusing entry.

## Context & References

- [Shaping notes and immutable pins](../../goals/hybrid-routing-optimization/hro-p4a-recovery-shaping.md)
- [HRO charter](../../goals/hybrid-routing-optimization/charter.md)
- [PMC C design](PMC-P2C-same-process-launch-controller.md)
- [PMC D design](PMC-P2D-openrouter-terminal-transport.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

This release permits exactly these two documents, not future runtime surfaces:

- `plugins/foreman-line/docs/specs/active/HRO-P4A-bounded-model-recovery.md`
- `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p4a-recovery-shaping.md`

## Verification Plan

Run the frozen spec-linter, check required body sections, resolve local links and
run `git diff --check`; verify the exact two-file envelope. No provider calls.
Reviewers must ask: can restart, eviction, late completion or new IDs reset refresh
or B1 budget? Does evidence-only discovery become authority anywhere? Can missing
mapping create a fallback proof? Is the durable admission prerequisite concrete
enough to refuse production until owned? Are proposed limits compatible with the
actual producer and B1? Does any prose imply C/D/E are already production-ready?
Does generic producer refusal accidentally become authenticated absence? Does
broker restart refusal accidentally erase B1's accepted terminal-commit reopen?
