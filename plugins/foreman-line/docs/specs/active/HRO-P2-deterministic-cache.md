---
ticket: HRO-P2
title: Exact reusable choice hints with owner verification of the current winner
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: critical
surfaces:
  - plugins/foreman-line/hybrid-routing/
  - plugins/foreman-line/routing-policy/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Reuse an indexed exact prior choice while obtaining fresh owner validation and
ranking evidence on every invocation. A warm hint may avoid sorting only after
the PMC owner proves it is still the winner against every current survivor using
the existing comparator. Measure the complete cold/warm path; neither schema
compilation reuse nor storing an unused hint satisfies this parcel.

## Constraints

**DRAFT, nondispatchable.** This is a proposed architecture requiring independent
design review and a bounded PMC owner prerequisite before HRO implementation.
No runtime authority follows from this document. The current two-argument owner
API has no cache seam: calling it unchanged after lookup adds work. This proposal
does not claim that capability already exists or silently amend approved PMC/C.

Shaping base: `4bbf31360633b4350d7498bafc609565db67842f`. Inspected resolver blob
`809e8d08a9444c925fb8b88b423e2e4b7ff28625`; compiled-schema-reuse owner blob
`f9f22ccaeaf8d1c1db6c805269575b1c7f3cc0ad`. P2F source has independent approvals
but integration/CI acceptance must be confirmed before release. P1c repair
`a824` remains unaccepted evidence, not an available production prerequisite.
Use accepted exact predecessor pins at Gate 2, not those shorthand references.

### Proposed owner decision: verify a cached winner, retain every gate

PMC must separately approve a small internal selection seam (provisional
prerequisite name PMC-P2G). Preserve the existing public resolvePmcRouteV1 behavior
and extract its comparator without changing comparisons, stable ties or refusal
order. An opt-in supported factory may reuse that SAME internal evaluator;
there is no second copy of validation, eligibility, ranking or authority logic.

Proposed additional supported export, subject to owner API review:

```typescript
createPmcChoiceReuseResolverV1(ports: unknown):
  | {ok:true, resolve:(request:unknown, context:unknown)=>PmcRouteDecisionV1}
  | {ok:false, code:'CACHE_INSTALLATION_REFUSED'}
```

The closed installation ports are synchronous read(key:string):unknown,
write(record:unknown):unknown and diagnostic(event:unknown):unknown callbacks.
Read returns null for miss or an untrusted record; write accepts only the owned
record and returns exactly {ok:true} or {ok:false}; diagnostic returns undefined.
Capture their descriptors once; functions are
installation capabilities, never request data. No default cache, filesystem or
network import enters routing-policy. Async/thenable/throwing callbacks are cache
failures, never authority or resolver success. All cache failures degrade to the
same deterministic owner evaluator; a diagnostic failure is ignored. The existing
two-argument export has no cache ports and remains the parity baseline. Only the
installed factory's returned resolver may use the cache; P2C adoption requires a
separately reviewed installation clarification, not edits in this parcel.

Required owner phase order:

1. Capture/validate the original request, including version/L6 refusal order;
   capture the entire fresh context and policy; validate all bindings, provenance,
   global claims, freshness, budget, episode and uncertainty exactly as today.
2. Evaluate ALL lane occurrences and every candidate gate, including privacy,
   capabilities, quality, costs, availability and independence. Build the fresh
   complete ordered candidate audit as today. Do not reuse prior audit/claim data.
3. If there are no survivors, return the unchanged refusal without cache lookup.
   Otherwise derive the bounded exact key from current owned values below.
   Freeze all values exposed to ports; no callback can alter current candidates.
4. Read and bounded-capture a record. On exact key/record/TTL match, locate its
   exact occurrence and binding/provider/model in CURRENT candidates. It must be
   a survivor. Compare every other survivor using the SAME owner comparator.
   Any strictly better survivor, or equal comparator result with an earlier
   original occurrence, invalidates reuse. A proven winner skips survivor sort.
5. Miss, corruption, ineligible hint or failed dominance verification runs the
   existing filter/sort/winner algorithm. All paths build the same fresh bounded
   immutable decision/audit and independence obligations. Output remains
   selection-only. A key/cache failure cannot replace an owner refusal.
6. Only after final boundedResult succeeds may the owner write its successful
   choice record. Cache write failure does not change the decision. Hits do not
   extend TTL. No refusal, permit, execution event or settlement is cached.

Comparing only the previous winner's eligibility is explicitly insufficient:
a competitor may become cheaper, better, available or independent. Checking all
current candidates both retains those gates and makes a corrupt but well-formed
hint unable to select an inferior route. No proof from persisted data is trusted.

### Canonical exact key and bounded record

The owner alone constructs a versioned JSON tuple, encoded as UTF-8. Use the
entire bounded canonical string as the SQLite primary key and read(key:string)
argument; no hash, caller-provided digest or new owner crypto dependency. Tuple
fields follow the list below; recursively encode object keys in Unicode code-point
order and arrays in original order, with ordinary JSON scalar escaping. Validate
well-formed strings and preserve number/boolean/null distinctions. A canonical key
is selection metadata, never evidence of authority.
Freeze the concrete key projection in the owner prerequisite and literal tests:

- Domain `pmc-choice-reuse/v1`, resolver/comparator revision `pmc/v1-choice-order/1`.
- Request version, workflowId, taskId, lane, subRole, routingClass, dataClass;
  complete requirements in P2A declaration order. Initial attempt encodes only
  its kind; fallback includes all its current fields and prior claims. No payload
  contents, credentials, current requestId/requestDigest or evaluation timestamp.
- Actual complete owned policy, policyDigest and configDigest, not digest strings
  alone; actual catalog source value (including profile/version/digest), ordered
  catalog facts/refusal rows and approvedConfigRef/digestSha256/sourceTimeUtc/
  maxAgeMs provenance. EvaluationTimeUtc and derived ageMs are freshly checked,
  not key inputs. All object fields use the canonical ordering above;
  arrays retain original order and distinctions.
- Each current candidate in occurrence order: occurrenceIndex, bindingId,
  provider/providerModelId from the policy, refusal codes, and either rank:null
  or providerGroup, matrixRole, quality, provider/providerModelId and the full
  supplied cost VALUE. Do not serialize cost EvidenceRef as cached authority.

This is an explicit proposal to key *effective owner selection inputs* after
fresh validation, not cache raw authority inputs. Dynamic budget/availability/
independence/history/freshness are always revalidated; a changed effective
eligibility/rank yields a different candidate projection or an earlier refusal.
Equal effective results may reuse a hint while fresh evidence/audit remains
different. Changes irrelevant to selection may safely retain the same key.
This interpretation of charter D4 requires coordinator/owner ratification.

Key UTF-8 length <=131072; overbound keys bypass storage and run normal selection.
Each record is exactly `{version:'pmc-choice-record/v1',key,createdAtUtc,
expiresAtUtc,occurrenceIndex,bindingId,provider,providerModelId}`. Text identity
fields use existing owner refinements; occurrenceIndex is a safe integer 0..255.
No rank, claim, selected decision, prior permit or arbitrary data in the record.
createdAtUtc is this invocation's already validated evaluationTimeUtc; expiresAtUtc
is exactly createdAtUtc plus 60 seconds. Accept only created <= current evaluation
time < expires, and exact 60-second interval. Time rollback produces a miss, never
an extended TTL. Invalid time arithmetic bypasses cache. Capture rejects hidden
keys/accessors/symbols/proxies that throw/thenables/cycles/exotic values, with
record-specific limits before descent; reserve budgets before materialization.
The record key is the sole long-string exception to ordinary owner Text limits:
it is capped by its UTF-8 byte bound and 131072 UTF-16 units, with no nested data.
Record traversal is capped at 64 keys/values and depth 2. No existing request or
context capture limit is changed to accommodate cache records.

### Indexed storage, ownership and concurrency

HRO owns a separate Node 24.19.0 node:sqlite file, never ledger/B1 tables. Proposed
bounded private lifecycle open/close is installation-only; request input cannot
choose a path, root, cache instance or reset. Use a fixed installation root,
exclusive fresh creation, no symlinks/junctions/sidecar substitution, strict schema
identity/version checks and bound parameters. Opening an unavailable, incompatible
or corrupt cache disables it for this instance with a sanitized diagnostic;
do not repair, delete or overwrite that file automatically.

Proposed schema: one STRICT entries table, key TEXT PRIMARY KEY, canonical record
TEXT NOT NULL. At most 64 rows; key <=131072 UTF-8 bytes, record <=135168 bytes;
SQLite page ceiling 32 MiB. Select only exact key, one row with SQL byte-length
guards before returning text. Validate row key equals embedded key and canonical
serialization, closed shape, TTL and identities on every read. Corrupt records
are misses, not eviction-triggered authority. Normal live writes use one bounded
BEGIN IMMEDIATE transaction, atomic insert/update and deterministic oldest
createdAtUtc then key eviction when inserting at capacity. Busy timeout 100 ms;
no same-call retry. Rollback/close in finally; no callback under transaction.
Identical concurrent writes converge to one key; unknown write acknowledgement
is diagnostic-only because cache contents carry no authority. Storage failure
always returns to the same fresh owner selection; it never changes liability.

No cache diagnostics enter the frozen PmcRouteDecisionV1 audit shape. Private
bounded events identify hit/miss/expired/corrupt/unavailable/write-failed and the
request correlation supplied by the owner, without key/policy/payload contents.
Integration with the governed receipt system belongs to its later owner parcel.

## Acceptance Criteria

1. Owner prerequisite independently proves exact cold/warm decision AND full
   fresh audit parity for actual resolver fixtures across all supported lanes,
   comparator branches/ties, fallback, no-survivor and global refusals. Hit tests
   prove prior stored choice is actually used and sort skipped after full current
   candidate evaluation. A lookup followed by unconditional sorting is not reuse.
2. Mutate budget, frozen/liability state, availability, independence, instance/
   family, quality, cost, source/config, policy/mapping, request requirements,
   clock/staleness/future evidence and prior uncertainty independently. Compare
   baseline versus cache-enabled owner at the intended gate. Test a still-eligible
   cached winner displaced by a newly superior competitor; it must never win.
3. Literal key fixtures preserve field/array order and separate every effective
   input above. Different request IDs/fresh evidence references may reuse only
   after full current validation. Wrong key, wrong occurrence, expired/future row,
   forged inferior/duplicate hint, oversized/malformed records and callback faults
   become misses. No key work/cache callback precedes owner early refusals.
4. Use real temporary SQLite for exact reads, bounded capacity/eviction, atomic
   upserts, independent-process contention, corrupt schema/rows, missing/unusable
   storage and lost write acknowledgement. Assert no ledger/B1 files change.
5. Reuse actual accepted P1c assembly and real P2A resolver in offline composition,
   with producer-retained catalog evidence and labeled synthetic dynamic claims.
   No production provider call, current-claim authentication or permit is claimed.
6. Compare no-cache, cold miss and warm hit after JIT warm-up, include capture,
   key serialization, SQLite read/parse, dominance verification and writes; report
   small/large bounded lanes, sample counts and median/tail latency. Pin exact
   source/runtime/fixtures and disclose concurrent host load. Mechanism counts
   alone are not speedup evidence. Equal/slower results must be reported; a
   negative result requires coordinator decision before production adoption.
7. Package tests/typechecks/lints and applicable reader/mutation checks pass;
   independent owner and HRO reviews approve their exact scopes. No weakened
   gate, new authority, hidden retry, public storage mutation or dependency install.

## Out of Scope

Compiled schema work already in P2F; validated-policy/static eligibility caches;
persisted candidate order; Jev/similarity; catalog refresh; dynamic claim issuance;
controller/transport/custody changes; launch authorization; permits; provider calls;
prices/budget provisioning; production activation and full HRO completion.

## Context & References

- [HRO charter](../../goals/hybrid-routing-optimization/charter.md)
- [Shaping rationale](../../goals/hybrid-routing-optimization/hro-p2-cache-shaping.md)
- [Actual owner resolver](../../../routing-policy/src/pmc-resolver.ts)
- [Actual owner types](../../../routing-policy/src/pmc-resolver-types.ts)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Current shaping authority ONLY:

- `plugins/foreman-line/docs/specs/active/HRO-P2-deterministic-cache.md`
- `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p2-cache-shaping.md`

No runtime dispatch. Proposed PMC-P2G ownership is limited to resolver source,
its types/barrel only if the supported factory needs them, and owner tests.
Proposed HRO storage module/tests and verification notes need exact named-file
contracts after owner approval. Neither directory-level proposal grants mutation.

## Verification Plan

Shaping uses existing spec-linter `validate <spec-path>`, required body sections,
local-link review and `git diff --check`. Future owner and hybrid packages use
`npm test`, `npm run typecheck`, `npm run lint` with existing matched dependencies.
Freeze the prerequisite and storage contracts before listing additional commands.

Reviewer focus: Can an inferior but valid cached hint win? Does comparator equality
retain earlier occurrence order? Are all candidates and current claims still
evaluated before lookup? Can malformed cache data alter owner refusal precedence?
Does the effective-input key justify every omitted raw authority field? Can cache
failure preserve exactly the ordinary owner result? Is whole-path warm measurement
better than simply retaining the current sort for these bounded lane sizes?
