# FK-P0 Spec Amendment R16 — how the migration chain's head is bound

## Status

**COORDINATOR-RATIFIED**, 2026-09-02, per SPEC-CONVENTION §11. Committed alone, touching only the
spec and this record, before the code that depends on it.

**Source.** Builder stop-and-report during rework round 1, raised under the F10 rule: closing it
required deciding what the invariant should be, and the obvious fix collided with AC4's wording.

## The third pin

Neither the directive, the triage, nor either reviewer named it. `src/validate.ts:612` defines
`RECONCILIATION_RECORD_DIGESTS`, a hardcoded sha256 for **every** reconciliation record — including
the newest, `registry-rework-0683bc0`. Enforced at `:1845-1848`, and the first clause is decisive:

```
RECONCILIATION_RECORD_DIGESTS[record.reconciliationId] === undefined ||
sha256(canonicalJson(record)) !== RECONCILIATION_RECORD_DIGESTS[record.reconciliationId]
```

An **unknown** `reconciliationId` is itself a violation. Every record must be in the table and hash
to its constant.

**Coordinator-verified**, including a detail that shows the prior author met this wall too: line
`:1842` already carves `registry-rework-544d8a3` out of a neighbouring `frozenPreR12Record`
computation by hand.

### Why it defeats the chain

The chain design anchors at genesis and validates the head by requiring the newest record's declared
digest to equal the live recomputed manifest. But the newest record is itself byte-frozen by the
table. So:

> live manifest → must equal the head record's declared digest → head record is byte-frozen →
> **the manifest is frozen**

"Exactly one registry document can ever be valid" survives the BLOCKER 1 fix intact. Removing
`:2402` and `:2249` and installing the chain **would look like a fix, would pass review, and would
leave the defect in place.** The builder refused to ship it. In a round whose entire subject is
claims that do not match behaviour, that is the correct call.

## Ruling: bind every record, bind the head *more* tightly

The builder's recommendation is adopted, with three hardening requirements added.

**AC4's clause is not breached.** A cardinality-conditioned bypass is one that *counts* — "if there
are exactly N records, skip the check", or "allow exactly one record to be absent." This design
counts nothing. The head is identified by **chain topology** — it is the one record from which no
other record chains — and it is not exempted from binding; it is bound to the live recomputed
manifest, which is a **stronger** assertion than equality with a constant. A constant says only
"these are the bytes I remember." The live recomputation says "this record accurately describes the
document containing it."

That is the freeze-versus-chain distinction, applied one level deeper than either the coordinator or
the builder had looked: **constants pin history; live recomputation pins the present.**

### Three hardening requirements the recommendation did not enumerate

Without these, "the record nothing chains from" is not uniquely determined and the design is
attackable. All three are now spec text and must be covered by tests:

1. **Exactly one head.** Zero heads (a cycle) or more than one head (a fork — two records chaining
   from the same predecessor) is invalid.
2. **No orphans.** Every reconciliation record must lie on the single genesis-to-head path. An
   appended record that chains from nothing is invalid rather than a second head.
3. **The head must still be a well-formed `registry-rework-*` record** that chains to its
   predecessor's *pinned* digest.

With these, every record remains bound: historical ones by constant, the head by the live corpus,
and the topology by the path requirement.

## The honest cost, recorded

An attacker who can edit the file can append a well-formed head record declaring the manifest of
their tampered registry, and validation passes. This is the same limit already ruled must be
documented for the chain, but it now extends to the record table, which previously had no such gap.

**The registry is a contract, not a trust root. Real anti-tamper is Git history plus human review.**
The README must say exactly that, per AC14.

## The alternative, weighed and rejected

Keep every record pinned including the head. This preserves today's tamper posture perfectly and
needs no AC4 judgment — but it **does not fix BLOCKER 1**: the registry stays frozen to one
document, `npm run generate` still cannot produce a validatable artifact, and AC3's prohibition on
full-file hashes as a shipped validation predicate stays breached.

Rejected. Had it been chosen, BLOCKER 1 could not be closed this round and would have had to be
reported as an open blocker rather than closed — which the builder correctly offered as the honest
version of that option.

## Replacement text

**Target:** §Acceptance Criteria, item 4. Inserted after "…without a cardinality-conditioned
bypass." and before "Each subject/claim is item-curated…":

> Binding is established either by a pinned constant or by structural position in the migration
> chain: the single chain head — the one record from which no other record chains — is bound instead
> to the manifest recomputed live from the document it sits in, and every other record is bound to
> its pinned digest. This is not a cardinality-conditioned bypass: the head is identified by chain
> topology rather than by counting, and it is bound more tightly than a constant rather than
> exempted, because a constant asserts only "these are the bytes I remember" while the live
> recomputation asserts "this record accurately describes the document containing it". A document is
> invalid if it has zero chain heads, more than one chain head, or any reconciliation record that
> does not lie on the single genesis-to-head path.

## Scope limits

Adds no acceptance criterion and removes none. Changes no locked charter decision, no
external-effect boundary, no human gate, no dependency edge, no Allowed Files entry. It makes AC4
stricter by adding three invalidity conditions that did not previously exist.
