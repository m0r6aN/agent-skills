# FK-P0 amendment R21 — R19's obligation 4 was wrong; distinctness and the git-commit binding replace it

**Status:** coordinator-ratified. **Committed alone, before any dependent code**, per SPEC-CONVENTION §11.
**Target:** AC4, obligation 4 of the head-floor paragraph added by R19. Obligation 5 is new.

## Why — I wrote a hardening rule that invalidates the shipped registry. Again.

The rework-2 builder's Step 0 caught it before a line of code was written. **I verified every claim
myself** rather than accepting the report:

| claim | verified |
|---|---|
| `git-commit` entries satisfying `digest === sha256(reference)` | **0 of 25** |
| `source-ref` | 51 of 51 | 
| `command-result` | 25 of 25 |
| `missing-path` | 1 of 1 |

R19's obligation 4 said "for every observed-evidence entry **of every kind**, the recorded digest is
the SHA-256 of the recorded reference." Three kinds already comply. The fourth never has and cannot
cheaply: a `git-commit` digest is `sha256(git cat-file -p <commit>)` — the commit **object body** —
not a hash of the 40-hex string.

Taking it literally would mean changing the generator's emission, regenerating, and **rewriting 12 of
the entries in `RECONCILIATION_RECORD_DIGESTS`** — the table `generate.ts:45` says "must NOT advance:
rewriting it would rewrite history". It would rewrite the frozen history the pin table exists to
protect, in the last rework round, to satisfy a sentence I wrote. And the builder's further point is
correct and I had it backwards: literal-O4 is a **downgrade**. `sha256` of a 40-hex string proves
nothing about the commit; the current digest at least attests the object body — it merely isn't
checkable offline.

**This is the second time in this parcel I have ratified an amendment whose literal wording would
invalidate the shipped registry.** R16 did it and R17 corrected it; R19 did it and R21 corrects it.
Same error, same round, twice. In both cases the cause was identical: I wrote a rule that sounded
airtight without checking it against the artifact it governs. The rule I keep failing to apply to
myself is the one this parcel exists to enforce — an obligation nobody has evaluated against real
data is a claim, not a check.

## And "BLOCKER 1 closes `:3311`" was wrong too

I asserted in the rework-2 mandate that fixing the head floor would close the three
`R10 source-derived registry-rework loop rejects {append,remove,duplicate}` failures. **It does not.**
The builder evaluated O1–O4 as predicates against exactly those mutated heads, with a guard asserting
the evidence array actually changed:

- All three mutations touch only `git-commit` entries.
- A **duplicated** `git-commit` breaks no cardinality rule (O1 counts *chain commands*), no shape (O3
  is satisfied), no pin (O2 doesn't apply to the head).
- A **removed** one leaves another 40-hex `git-commit` behind, so O3 still passes.

O1, O2 and O3 fire on **none** of them. Two further obligations are needed, and both are **free**
against the shipped registry — I verified:

- **Distinctness (new obligation 5):** duplicate evidence entries across all reconciliations: **0**.
  Closes `append` and `duplicate`.
- **The git-commit binding (folded into obligation 4):** prior-binding-manifest commands whose
  `inputDigest` equals SHA-256 of a `git-commit` reference on the same record: **12 of 12**. Closes
  `remove`, and independently closes Reviewer A's "repoint the head's git reference to arbitrary
  40-hex" finding, because repointing breaks that binding.

Zero regeneration. No pin rewrite. No corpus-dependent constant.

## Ratified text

Obligation 4 is **replaced**, and obligation 5 is **added**:

> Fourth, **evidence references are bound by a digest computed over them, and no digest is ever
> verified by comparison with itself**: for `source-ref`, `command-result` and `missing-path` entries
> the recorded digest is the SHA-256 of the recorded reference. A `git-commit` digest attests the
> commit object body and so is not checkable from the reference alone; it is bound instead by the
> record it sits on - the prior-binding-manifest command's `inputDigest` equals the SHA-256 of a
> `git-commit` reference present on that same record, so repointing the reference breaks the binding.
> A validator never treats a digest as verified because it is well-formed hexadecimal, and where no
> binding is available for a kind the absence is stated rather than disguised as a check. Fifth,
> **evidence entries on a record are distinct** by kind, reference and digest together, so a record
> cannot carry the same attestation twice.

"four further obligations" reads "five" in both places.

## The general principle, which is the part worth keeping

The defect R19 was reaching for is real and remains closed:
`expectedDigest = /^[0-9a-f]{64}$/.test(evidence.digest) ? evidence.digest : null` compares a digest
**to itself** and calls the result verification. That must go regardless of kind. What R21 changes is
the remedy: not "hash the reference the same way everywhere", but "**every reference is bound by some
digest computed over it, and where it is not, say so.**" A validator that reports a check it did not
perform is the precise failure this parcel exists to make impossible — finding one inside the
validator itself is the most on-the-nose defect of the round.

## Adopted from the builder without change

**O2 keys on ID presence in the pin table, never on byte-match against the pin.** Byte-match would let
a tamperer mutate a pinned record *first*, breaking its match, and then delete the head to promote it
— one step past where the obvious implementation stops. That is the same depth-one reasoning error I
made in C28, caught by the builder before it was written this time.
