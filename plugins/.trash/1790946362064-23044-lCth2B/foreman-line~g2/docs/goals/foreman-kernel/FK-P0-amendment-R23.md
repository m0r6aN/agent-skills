# FK-P0 amendment R23 — a head-scoped Git binder, obligation 7 stated truly, and refusal tests that bind

**Status:** coordinator-ratified. **Committed alone, before any dependent code**, per SPEC-CONVENTION §11.
**Target:** AC4 obligations 5 and 7; AC13.

## Why — two reviewer findings, both reproduced by me

**G6 (Reviewer A).** The head's entire Git provenance is fabricable. Two **distinct** 40-hex fakes
satisfy count and distinctness trivially, and setting the prior command's `inputDigest =
sha256(fabricated)` makes obligation 4 self-consistent:

```
G6 fabricate BOTH refs, no payload             -> valid:true, 0 violations
G6 fabricate BOTH refs + 7 gate3 rules retired -> valid:true, 0 violations
   head provenance: feedface…, 0000…0001
   resolveAuthority(gate3) -> REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY
```

The README listed this among the **refused** shapes. It is admitted. Third README overclaim in this
parcel, and — as with the other two — it flatters us.

**And the test named for it passes for the wrong reason.** `tests/semantic-invariants.test.ts:4741`,
*"R22 O5 refuses a head whose entire Git provenance is fabricated"*, maps **both** entries to the same
`'d'.repeat(40)`, so the fabrication it is named for is never exercised. Lesson 32, in a test written
in the round where we swept for that class.

*A measured discrepancy, recorded rather than resolved:* the builder reports that test firing
**cardinality** (`declares 1 git-commit evidence entries`); replicating its body literally I get
**distinctness** (`carries the same git-commit attestation twice`). Both agree it never exercises
fabrication; treat the specific detector as unverified detail.

**S3 (Reviewer B).** From the legitimately appended state, deleting the successor re-promotes the
shipped head; re-anchor it and the document is valid with the successor's attestation gone:

```
d1  amend + properly chained append       -> valid:true, 0 violations, 19 recons
S3a delete successor, NO re-anchor        -> MIGRATION_EVIDENCE_INVALID   (control)
S3  delete successor + re-anchor df8155a  -> valid:true, 0 violations, 18 recons
    attestation registry-rework-aaaaaaa present: false
```

**This falsifies obligation 7 as ratified.** It says erasing must never be cheaper than extending;
measured, erasing is file-only and extending requires a `validate.ts` edit.

## The scope error R22 made, and its correction

R22 rejected a snapshot-equality binder as **not free**, on an all-records measurement — the builder's
13/24 against my 15/24. **Both numbers were taken at the wrong scope.** The defect is head-only:

```
document.sourceSnapshotCommit = 7e7dc7dbb90317a5a2cd69c21a8b86c4a3a4e1e2
  HEAD ref df8155a019…  bound=true  snapshot=false
  HEAD ref 7e7dc7dbb9…  bound=false snapshot=true
HEAD-SCOPED : 2 of 2   -> FREE
OTHER 11    : 11 of 22 -> NOT free   (this is why the all-records version failed)
```

Neither measurement was wrong; the scope was. The other eleven records' unbound reference is a
*historical* snapshot or the shared `51857a3a`, which is exactly why the wide version failed and the
narrow one does not.

## Ratified text

**Obligation 5** gains: on the chain head, every `git-commit` reference is either bound by the prior
chain command's `inputDigest` or is exactly `document.sourceSnapshotCommit`. Builder-measured under
the candidate: shipped registry valid with no regeneration and no pin rewrite; **G6 refused in both
arms**; the legitimate append path and simulated regeneration both still admitted; and it closes one
of the two documented residuals as a side effect.

**This binder is structural rather than id-keyed, so unlike every other head obligation it applies to
whatever record is the head** — the first one that generalises.

**Obligation 7** is restated to its true scope: append-only and history-preserving **for the shipped
head**, with the successor window named, and generalising presence to successors made an FK-P1
obligation and a stop condition on it.

**AC13** gains: a refusal test binds to the obligation it names. Where obligations share one violation
code — every chain obligation shares `MIGRATION_EVIDENCE_INVALID` — asserting the code, even exactly,
cannot distinguish which fired, so such a test asserts the **message**.

## A correction to my own round-3 remedy

I mandated `expectOnlyCodes` to stop tests passing for the wrong reason. **It cannot catch this class.**
Every chain obligation emits the same code, so an exact-set code assertion still cannot tell which
obligation refused. The topology tests were immune only because the builder chose message assertions
for an unrelated reason — that breaking topology legitimately cascades. My remedy was necessary and
insufficient, and AC13 now says the sufficient thing.

## Why the successor problem is NOT fixed here

Not deferred for scheduling. **A stateless validator comparing a document to itself cannot detect a
deletion at all.** Presence is assertable only against something outside the document — a constant,
Git history, or a signed manifest. So a per-head constant is not a shortcut somebody took; it is the
only in-band option, and obligation 6 cannot be made to travel without an out-of-band anchor.

The obvious in-band attempt — keying obligation 2 on `recordDigestPinFor` rather than the raw table —
would declare the shipped head ineligible and **invalidate the shipped registry**. That is the
R19-obligation-4 mistake a third time, and both the reviewer who found the defect and the builder
declined to prescribe it. So does this amendment.

This is the architectural finding of the goal and it belongs to the developer, not to a cleanup round.
