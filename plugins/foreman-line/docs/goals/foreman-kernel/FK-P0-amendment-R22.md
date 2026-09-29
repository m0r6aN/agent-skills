# FK-P0 amendment R22 — bind the head through channels that do not depend on it being the head

**Status:** coordinator-ratified. **Committed alone, before any dependent code**, per SPEC-CONVENTION §11.
**Target:** AC4 — obligations 3 and 5 amended, obligations 6 and 7 added.

## The structural root, verified

`RECONCILIATION_RECORD_DIGESTS`, `RECONCILIATION_CONTRACT`, `RECONCILIATION_PROSE` and
`REQUIRED_REWORK_MIGRATIONS` hold **the same set**, and **the shipped head is in none of them** — I
counted each table directly rather than taking the report:

```
RECONCILIATION_RECORD_DIGESTS: 11 chain ids, head df8155a present: False
RECONCILIATION_CONTRACT:       11 chain ids, head df8155a present: False
RECONCILIATION_PROSE:          11 chain ids, head df8155a present: False
REQUIRED_REWORK_MIGRATIONS:    11 chain ids, head df8155a present: False
```

R19's obligation 2 says *pinned ⇒ not head*, and `validate.ts:2354` says *not head ⇒ pinned*. Together
they make **`head ⟺ unpinned`**. The unpinned slot is a free slot for whoever claims it. Reviewer A's
"there is no pin-table state where both hold" is exact, and the reason is that **the pin table is the
wrong lever**: every binding it offers depends on head position, and the attacker chooses head
position.

## The route that defeats my own stated remedy

My stop report told the developer the fix was to "require that the departing head's absence
invalidate." **The head does not have to depart.** The builder found a third route at Step 0 and I
reproduced it against pristine `4c53cd8`:

```
P1-d  head hollowed IN PLACE (same id) + 7 gate3 rules retired
      -> valid:true, 0 violations
      resolveAuthority -> REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY  controlling=[]
      head record still present: true
      R14 attestation topic erased: "R13 registry bindings superseded by the coordinator-ratified…" -> "x"
      reconciliations: 18
```

Record present, id unchanged, count unchanged, attestation gone, payload delivered. **A presence-only
obligation misses it entirely** — which is what I would have ratified if the builder had implemented
what I wrote instead of measuring first.

That is the third time this goal that the person writing the chain rules got them wrong, and the
second time the Step 0 gate caught it before it became code. **This amendment is therefore stated as
attacks that must be refused and states that must be admitted, not as a mechanism** — a mechanism I
specify is a mechanism nobody has measured, and that is exactly how R16, R19 and my stop-report remedy
each failed.

## Ratified text

**Obligation 3** now binds *the two chain commands*, not any command on the record. Measured:

```
CONTROL  two chain commands gutted (tool 'attacker', anonymous, exit 137)  -> MIGRATION_EVIDENCE_INVALID
ATTACK   same + ONE coordinator decoy command-result appended              -> valid:true, 0 violations
FREE?    chain commands already tool+coordinator+exitCode0: 24 of 24
```

**Obligation 5** gains: exactly two `git-commit` entries per chain record, references distinct **by
reference alone**. Both verified free by me — 12 of 12 and 12 of 12. Distinctness by the full triple
was defeated by varying the digest.

**Obligation 6 — the shipped chain head is bound through channels that do not depend on its being the
head.** Presence required; topic/status/reference/rule-id contract and prose attested; digest-bound
once it is no longer the head. **Three attacks refused independently:** deletion; deletion with
substitution under any other id; and **in-place rewrite under the same id**.

**Obligation 7 — a properly chained new head is ADMITTED**, and the demoted former head remains bound
as a historical record. The residual returns to **append-only and history-preserving**: it must never
be cheaper to erase an attestation than to extend the chain, because the Git-history review the
residual leans on is defeated by erasure and not by extension.

## What this amendment deliberately does NOT say

It does not name the constant, table or predicate that implements obligation 6. The builder's measured
Candidate 1 — presence entry, a *separate* head-record digest consulted only when the record is not
the head, and contract/prose entries consulted always — satisfies all of it at **+54/−5 lines in
`validate.ts` with `RECONCILIATION_RECORD_DIGESTS` byte-unchanged and no regeneration**, and its
measured Candidate 2 leaves P1-d open. That is evidence for the implementation, not the obligation.

**One narrowing is explicitly NOT adopted: binding a `git-commit` reference to the snapshot commit.**
It is not free. The builder measured 13 of 24 qualifying; **I measured 15 of 24** with a slightly
different predicate. The numbers disagree and the conclusion does not — either way it would invalidate
the shipped registry, which is precisely the R19-obligation-4 mistake. I am recording the discrepancy
rather than picking the tidier number; whoever implements this should treat both as unverified detail
and only the *not free* conclusion as established.

## The residual statement must become exact

Six head-edit shapes are admitted today; the README describes **one**. Under obligation 5's narrowing,
four of the six close (delete-unbound, fabricate-extra, duplicate-with-varied-digest, fabricate-all).
**Two remain** — rewriting a bound `git-commit` digest with the reference intact, and repointing the
unbound second reference. Narrow the code where free, then state the remainder exactly. In a parcel
whose purpose is representing honestly where enforcement is real, a stated limit narrower than the
true one is a defect in the deliverable, not a documentation nicety.

## Carried forward, unrelated to the chain

The builder established a datum that retires an open question: **`resolveAuthority` runs
`validateRegistry` on every query at ~75 ms**, so one five-axis applicability test costs 3,240
validations ≈ 3m25s. Per-query cost is no longer "unestablished" — it has a measured floor and a named
cause. That belongs in the FK-P1 handover, not here.
