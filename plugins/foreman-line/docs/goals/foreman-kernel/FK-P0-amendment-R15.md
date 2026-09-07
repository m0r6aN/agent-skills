# FK-P0 Spec Amendment R15 — fourteen integration scenarios, not thirteen

## Status

**COORDINATOR-RATIFIED**, 2026-09-02, per SPEC-CONVENTION §11: exact replacement text below,
committed alone touching only the spec and this record, before the code that depends on it.

**Authority basis.** Changes no locked charter decision, no external-effect boundary, no human
gate, no dependency edge, no Allowed Files entry. It corrects three spec sentences to match a
charter the developer already ratified. Inside standing coordinator authority, as R14 was.

**Source.** Builder flag during FK-P0 rework round 1, raised under the F6 spec-staleness class the
coordinator asked to have surfaced rather than fixed silently.

## The conflict

Ratified amendment **A1** added **integration scenario 14** (decision-path latency) to charter §8,
alongside D21, §4.1, the changed Wave 0 exit, and the changed FK-P1/FK-P17 rows. The charter now
carries fourteen scenarios — verified on this branch at `charter.md:299`,
`14. **Decision-path latency:** on the D20 platform, a warm kernel serves a…`.

The spec still said thirteen in three places, and `tests/semantic-invariants.test.ts:3091` is named
`R9 publishes all thirteen charter integration scenarios individually` with thirteen hardcoded item
IDs.

Left unamended, the builder would face a spec requiring it to test thirteen scenarios against a
charter containing fourteen — and the scenario A1 added, the one carrying the D21 latency contract,
would be the one silently unpublished. A registry whose job is to inventory canon would omit the
newest piece of canon.

## R15.1 — protected normative items

**Target:** §Constraints, the protected-normative-items paragraph. **Current:**

> The charter's thirteen integration scenarios, five initial refusal-class rows, and all twenty-two

**Replacement:**

> The charter's fourteen integration scenarios, five initial refusal-class rows, and all twenty-two

## R15.2 — R9 control coverage

**Target:** §Required Tests. **Current:**

> tests. The R9 controls separately cover: thirteen scenario publications; five refusal-row

**Replacement:**

> tests. The R9 controls separately cover: fourteen scenario publications; five refusal-row

## R15.3 — individual publication requirement

**Target:** §Required Tests, the R9 requirement paragraph. **Current:**

>   They also require all thirteen integration scenarios, all five initial refusal-class rows, and

**Replacement:**

>   They also require all fourteen integration scenarios, all five initial refusal-class rows, and

## Deliberately NOT changed

Five other occurrences of "thirteen" refer to **STANDING-CONSTRAINTS.md's thirteen numbered rules**
— a different set that has not changed — at spec lines 121, 448, 746, 1135, and 1279. All five are
left exactly as written. Verified after amendment: the only remaining "thirteen" occurrences are
those five.

## Consequential obligation on the builder

`tests/semantic-invariants.test.ts:3091` must publish fourteen scenarios, and its name must stop
saying thirteen. The builder confirmed that test is **not** inert — `publishedRuleFor()` at `:3080`
performs four real assertions per item, and the trailing `itemIds.map(...).length === 13` is merely
a redundant tautology rather than the test's substance. It is a redundant clause to correct, not a
fifth dead test, and the builder was right not to claim it as one.

## A second staleness instance found while amending, NOT fixed here

The spec states two different suite-size targets: **"at least 361 tests"** at line 1026 and
**"504 tests"** at line 1085. Both cannot be the requirement. This is the same claim-versus-reality
class as the 504-versus-measured gap already logged under F9, and it is **left unamended
deliberately** — the honest number is whatever the builder measures, and inventing a third figure
before that measurement exists would repeat the error. Recorded for the round's completion claim.
