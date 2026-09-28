# HRO owner seam for P1c and P2

Coordinator preparation, 2026-09-26. Not a build release; the actual resolver
implementation 0db995bd74309afb57733fbf14193202591d73d9 is under independent
review. P1b source 5ea6c7a is in final review and draft PR #59. Owner merges and
their final public types must be pinned before downstream dispatch.

The concrete PMC decision is explicitly `authority:'selection-only'`; its audit
is `evidenceState:'static-conformance'`. HRO mapping proposals and the lossless
PMC projection are evidence only. No wrapper may convert any of these plain
objects into execution authorization. The P2C private controller remains the
issuer, invokes the owner resolver itself, and reserves through the durable
ledger before a one-use permit exists.

P1c should minimize translation: reuse projectProviderBindingsV1,
evaluateCatalogEligibility and resolvePmcRouteV1 through supported public exports.
Any HRO-local proposal translation must retain exact identity/protocol/host ID,
lane, declared fallback and provenance. Test it against real owner output and
explicit refusals, including malicious proposal objects presented as permits.
Do not reproduce the owner's validator, candidate comparator, RCM reader brand,
or authentication rules inside HRO.

P2's cache stores a reusable choice, never authorization. Revalidation needs the
current owner inputs, including remaining liabilities, episode state, source
freshness, availability and verification independence. A cache hit cannot skip
that work just because policy/config hashes match. The current resolver still
validates its complete supplied context; do not invent a fast-path capability
or claim a performance benefit that its API does not provide. Any optimization
of owner validation needs its own scoped owner contract and review.

Freeze the exact key dimensions, record validation, TTL, capacity, concurrency
and invalidation semantics against the accepted owner API. Corrupt/failed cache
must become a deterministic owner-evaluation miss. Tests compare cold and warm
outcomes while changing each dynamic authority input independently. Measure
routing overhead separately from provider latency and billed cost; equal or
slower results must be reported honestly. Optional Jev remains disabled.

The launch composition's complete episode-custody problem is tracked in
../pi-model-configuration/pmc-p2c-composition-notes.md. Neither a new request ID,
new cache key nor a recovered cache record may reset an uncertain prior attempt.
