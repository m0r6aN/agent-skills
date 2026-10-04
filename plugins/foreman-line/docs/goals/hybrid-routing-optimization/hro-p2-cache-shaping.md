# HRO-P2 choice reuse — decision draft

2026-09-26. Documentation-only shaping at base
`4bbf31360633b4350d7498bafc609565db67842f`. The
[draft spec](../../specs/active/HRO-P2-deterministic-cache.md) is nondispatchable.
No ShapingResult, runtime source, provider call or benchmark was produced.

## Source-backed reason for an owner prerequisite

Resolver blob `809e8d08a9444c925fb8b88b423e2e4b7ff28625` captures/validates each
request and full context at lines 498–542. It evaluates current global state at
646–835 and every candidate at 837–1061, then filters/sorts survivors at 1065–1091.
The comparator uses provider group, L5 exact rational cost, quality, matrix role
and provider/model code-point ordering. Stable equal ranks preserve occurrence
order. A previous winner can remain eligible while a competitor improves.

P2F blob `f9f22ccaeaf8d1c1db6c805269575b1c7f3cc0ad` retains compiled schema code
only. That removes repeated compile work but does not consume a choice hint,
skip ranking or meet HRO-P2 reuse acceptance. Its review/CI closure must remain
separate. P1c repair is likewise not assumed accepted or production-wired.

An external winner cache followed by the unchanged resolver adds lookup overhead.
A cached static ordering would require more records, invalidation and owner
validation while quality and cost are themselves supplied current claims. The
smaller proposal caches only the prior winning occurrence and asks the existing
owner to compare it against ALL current survivors after all original gates.
Successful dominance verification is linear; the old cold sort remains the exact
miss path. A fabricated inferior hint fails that comparison. Equal comparator
results require original occurrence tie order, not the cached candidate's position.

## Proposed decisions requiring independent disposition

1. PMC owns a supported opt-in resolver factory using the SAME evaluator and
   comparator; its ordinary export is unchanged. Review a bounded PMC-P2G
   prerequisite with exact allowed files before dispatch. HRO never imports a
   private comparator or duplicates it. The factory ports are installation-only,
   synchronous and fail-to-miss; C adoption requires a later reviewed clarification.
2. Ratify the effective-selection-input key: actual policy/catalog and request
   requirements plus current candidate refusal/rank projection, after complete
   fresh authority checks. Exclude current request identity/evidence timestamps
   only because they are revalidated on every call and cannot authorize a hit.
   Budget/availability/independence changes either refuse earlier or change
   effective candidates; same effective candidates still require fresh audits.
3. Prefer the bounded full canonical key as SQLite primary key, eliminating an
   owner crypto dependency. Freeze the final read(key) signature and literal
   encoding in the prerequisite. Do not leave digest-versus-string ambiguous at
   release. Store only a bounded choice identity and fixed 60-second TTL.
4. Review one separate 64-entry SQLite cache with exclusive lifecycle, exact
   indexing, bounded row reads, transactional upsert/eviction and fail-to-miss
   diagnostics. No ledger tables, reset authority or database repair. Persistence
   carries no proof; every reopened record is revalidated and dominated by current
   owner comparisons. Agree exact future files only after owner seam acceptance.
5. Accept measurement as a real go/no-go gate for production adoption. O(n)
   comparisons instead of O(n log n) sort may be outweighed by key/storage costs
   for tiny lanes. Report that result rather than widening the cache to policy
   validation or claiming compile-reuse savings as choice-cache savings.

## Remaining gates

This is a concrete proposal, not a builder release or self-approved owner amendment.
Independent design review must decide the factory, effective key and persistence
tradeoff. Then separately scope/accept PMC-P2G, confirm P1c/P2F predecessor closure,
and ratify exact HRO storage files. Cold/warm differential tests must use real
owner validation and candidate comparisons, with separately labeled synthetic
claims and actual temporary SQLite. Callback/storage faults never weaken routing.
Runtime C/B1/D/E integration, live execution, truthful correlated receipts and the
full HRO charter exit remain open. No performance result is available yet.

Advisory shaping checks passed with the existing read-only spec-linter donor
and Node 24.19.0: frontmatter/schema validation, required body sections and local
relative Markdown links. Only the two authorized documents are committed.
Independent design approval and runtime file authorization remain outstanding.

## Independent review correction

Review of 3a17553285d8dd76c26d595bf16aca6b2fa76a53 requested two precise changes.
The actual money helper includes requestDigest in costValueDigest; caching the
complete cost value would defeat reuse across otherwise equivalent fresh requests.
The revised key explicitly retains economic/ranking/profile/tariff fields and
excludes costValueDigest, priceEvidenceDigest and cost EvidenceRef. Those omitted
fields remain intact in current authenticated acquisition, validation and audit;
the projection never grants authority. Required integration tests call the real
computePmcCostV1 for two different request digests and prove distinct money digests
but equal selection keys and real reuse. No hand-written equal digest fixture
can satisfy that case.

The resolver's occurrenceIndex is a global policy.laneBindings offset; the policy
allows 1536 entries while one evaluated lane has at most 256 occurrences. The
record therefore accepts 0..1535 with exact current tuple matching, not 0..255
or a silently renumbered lane-local offset. A valid winner above 255 must pass
cold/warm parity and reuse tests; out-of-range/mismatched tuples become misses.
These corrections do not approve the owner factory, effective-key interpretation,
SQLite/TTL/measurement decisions or deferred C adoption. All remain review gates.
