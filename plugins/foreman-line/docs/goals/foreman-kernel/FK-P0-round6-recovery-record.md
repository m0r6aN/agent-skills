# FK-P0 round 6 — builder loss and recovery record

**Written by the coordinator, 2026-09-03.** The round-6 builder stopped being reachable
mid-implementation, with no completion claim. This record exists so the next reader does not have
to reconstruct what happened from a diff.

## What happened

The builder produced two strong Step 0 reports, was cleared to write code, began implementing,
and then became unreachable. It had earlier reported losing its own baseline measurement to a
context rollover; the working state went the same way.

At the moment of loss the worktree held **8 modified files, 1,396 insertions, 687 deletions**, all
uncommitted, with no completion claim of any kind.

## The ruling: unclaimed, not done

Under the standing rule — *uncommitted work without a completion claim is unclaimed* — none of it
is accepted, and none of it is treated as evidence of anything. It was nevertheless real work and
worth preserving, so:

- it is committed at **`b0518f8`** on branch `codex/fk-p0-rework6-unclaimed-20260903`, with a
  commit message stating in its subject line that it is **not** a completion claim;
- the Gate 3 merge target, `codex/fk-p0-canon-authority-enforcement-registry`, was restored to
  **`5f9cf65`** and verified clean, so non-compiling work never sat on it.

## State of the preserved work, measured by the coordinator

Not asserted by the builder — these are the coordinator's own commands:

| check | result |
|---|---|
| `tsc --noEmit` | **exit 1** — see the correction immediately below; the line numbers first recorded here were wrong |
| `biome check .` | exit 0, 5 infos |
| tests | **no test file touched — none of controls (a)–(g) exist** |
| regions | all three declared in the shipped YAML |

### Correction — the coordinator misattributed its own measurement

The first version of this record reported `Cannot find name 'blanked'` at
`src/validate.ts(3426,27)` and `(3432,23)` **in `b0518f8`**. That was wrong, and the builder
caught it. Verified against the commit itself:

```
$ git show b0518f8:…/src/validate.ts | grep -n blanked
3490:  * Volatile lines are REMOVED, not blanked. Blanking was implemented first and measured to fail
3492:  * is displaced in its container, but a blanked line still OCCUPIES a line, so appending one
4313:            ...extent.blankedLines.map((index) => sourceLines[index] ?? ''),
```

Line 3426 is `for (const index of span) claimedLines.set(index, request.regionId)`; line 3432 is
`excisedLines: span`. `excisedLines` is declared at 3329 and used at 3432, 3480 and 3531 — the
rename landed everywhere except **line 4313**, the single unresolved reference.

**What actually happened:** the coordinator ran `tsc` against the *working tree*, the builder then
applied a rename batch, and the coordinator committed `b0518f8` afterwards — then attached the
earlier error text to the later commit. The measurement was real; the object it was attributed to
was not. Recorded because this parcel exists to make canon represent reality, and a coordinator
pinning a stale measurement to the wrong SHA is the same defect class the parcel is built to catch.

**Consequence for the salvage calculus, which changes materially.** The preserved work is not
conceptually half-written. It is **one identifier on one line away from typechecking**. That is
the difference between material to be mined and work to be restored.

Still unverified at this record: that line 4313 is the *only* remaining error. Confirming it
requires the edit to be applied and `tsc` re-run.

The registry YAML and `tests/fixtures/pass-minimal.yaml` were regenerated (~610 changed lines
each) by code carrying that unresolved reference, so those emitted bytes remain untrusted until
regenerated from a compiling tree.

## One unruled design divergence, carried forward for a ruling

The prior builder anchored regions by **`headingItemId`** (e.g. `item.4b79a165c3a2`) rather than by
the derived stable heading key it had proposed and the coordinator had endorsed. This may be
better: the heading item is itself digest-pinned and sits outside every region, so anchoring to it
is more robust than re-deriving a key from heading text. But it was never ruled on, and an
unreviewed change to how a security boundary is anchored does not stand by default. The recovery
builder must state which it implements and why.

## The finding the round actually produced — control (e) caught a live laundering channel

Not in the first version of this record, and it is the round's real salvage value.

**Control (e) failed against the first masking implementation, and the failure was a genuine
security defect.** Masking by *blanking* lines — replacing content but keeping the line — left the
region's line count dependent on how volatile content happened to be paragraphed. Appending two
lines inside the owner-of-record region shifted `lineHint` for every out-of-region block after the
regions. `itemIdFor`'s md-block branch hashes `canonicalJson({sourceId, locator})`, and `locator`
**includes `lineHint`** — so three item IDs churned, and `item.8be213f2455a` →
`item.cef87defede1` **silently de-published standing authorization 8**, the ambient-checkout
prohibition published in this very round, because the curated classification map is keyed by item
ID. Measured, not theorised. Two further items churned: `657d2ba29bea` → `f9eea5516e1b` and
`ee074fc90155` → `20f4057f8663`.

That is precisely the laundering channel R24 exists to close, reached **through the identity layer
instead of through the text**. An operator editing volatile status could de-publish a governed
rule. Neither R24, R25, R26, R27 nor R28 anticipated it; control (e) found it.

**Fix, already in `b0518f8`: excision by removal, not blanking.** `maskVolatileSource` filters the
removed lines out entirely, and the `heading-subtree` extent is the whole body span including blank
separators — an earlier version filtered blanks and leaked for the same reason. The masked document
then contains only out-of-region lines, so no property of a region — content, length, or
paragraphing — can reach a governed item's identity. Closed structurally rather than by care.

**The obvious alternative was probed and rejected on measurement.** Making `itemIdFor` hash
`{sourceId, kind, anchor}` — which spec line 613 requires and the implementation violates — dropped
rules 469 → 467 and de-published published `fk-charter:item.ff0f88a958e0`, plus charter
ratification-ledger items and three `permission-profiles-readme` table rows. Reverted. It is a
corpus-wide identity-layer change and R28 authorises no new identity work on this parcel.
**Recorded as a known spec-versus-implementation divergence for a later parcel**, not fixed here.

## Why this is not round 7

The round-6 tripwire is not charged. A round is a *design-and-build attempt*; this attempt was
interrupted by context exhaustion, not concluded by a defect, and no reviewer returned findings.
Charging a tripwire for an infrastructure failure would penalise the wrong thing and would push a
future coordinator toward hiding losses rather than recording them. Recovery continues round 6.

## The process fix, earned here

The recovery dispatch carries a rule the original did not: **commit incrementally to the parcel
branch, prefixed `wip(fk-p0):`, after each coherent step**, rather than holding a large
uncommitted diff. Under context pressure, commit and report instead of pressing on.

This is the second time this round that work existed only in a session's head — the first was the
2026-09-01 owner's R2–R13 review findings, unrecoverable for the same reason and recorded in the
ownership block's inherited-state caveat. The lesson is the same one twice: **state that lives
only in a session's context is state that has already been lost.** Stage-F lessons candidate.

## The restore, and the blocker it exposed

Performed by the coordinator at `3ee5192` after the builder went idle a fifth time without
delivering. Scope was deliberately narrow and non-authorial: check out `b0518f8`, change one
identifier, run the generator. The masking primitive, schema, extent union and guards remain the
builder's work, and **the coordinator authored no design and will author none of the controls** —
the controls *are* the verification, and D4 forbids a coordinator producing verification of its
own parcel. Restoring preserved code and running a deterministic generator is diagnosis; writing
the tests that prove the parcel correct is not.

The one fix was `validate.ts:4313`, `extent.blankedLines` → `extent.excisedLines`. The field is
declared `excisedLines` at 3329 and the code's own comment says "the bytes being excised", so the
rename is mechanical. `tsc --noEmit` then exited 0, confirming the builder's claim exactly.

### BLOCKER — the restored YAML silently de-published a ratified charter rule

Measured against `b49fef6`, the restored rule set was **467**, with **two** removals rather than
one:

| rule | authorized |
|---|---|
| `rule.fk-loop-directive.ae7854c7dad1` | yes — obligation 1 |
| **`rule.fk-charter.ff0f88a958e0`** | **no** |

`item.ff0f88a958e0` had been renamed to `item.49359f6269b5`. Because the curated classification
map is keyed by **item ID**, the renamed item missed it, could not publish, and landed as:

```yaml
ruleIds: []
exclusionDisposition: non-normative-explanation
rationale: "…is explanatory context and does not state an independent normative authority rule."
```

That item is **charter integration scenario 14 — the decision-path latency scenario**, added by
A1.5 and bound to **D21**. A ratified charter rule tied to a locked decision was declassified to
"explanatory context" by generated boilerplate, **and `sweep` reported zero violations**, because
an item declassified plus a rule not emitted is self-consistent and leaves no trace. Controls (a)
through (f) cannot see it.

**This is the under-curation gap, no longer hypothetical.** It is the strongest possible argument
for control (g), and it arrived by accident in the working tree rather than by adversarial probing.

**Cause:** the builder's reverted `itemIdFor` experiment. It reverted the *code* and not the
*generated YAML*, so `b0518f8` shipped a stale artifact of an abandoned change. Regenerating from
the reverted code restores the charter rule. Lesson candidate: **a revert that does not regenerate
its artifacts is not a revert** — and the artifact was clean, validating, and wrong.

### State at `3ee5192`, coordinator-measured

| check | result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `biome check .` | exit 0, 5 infos |
| `npm run generate` | exit 0, `{"items":1525,"rules":468,"sources":18}` |
| `validate` | exit 0, valid, 0 violations, 468 rules / 1525 items |
| `sweep --repo-root` | **exit 0, valid, 0 violations — down from 54** |
| rule set | 469 → 468, exactly one removal, zero additions |

**The defect this round exists to fix is closed:** editing the volatile regions no longer produces
sweep violations.

## Open at this record

Landed at `3ee5192`: the masking primitive, the two-kind extent union, obligation 1, the two new
result codes, the schema change, and a green `sweep`.

**Still open, and the reason `3ee5192` is a `wip` checkpoint rather than a claim:**

- **Standing authorization 8 is not published.** The count is 468; R28 requires 469 by adding it
  with curated classification (`pre-action-refusal`) and applicability.
- **None of controls (a) through (g) exist.** No test file has been touched this round. These are
  builder work and will not be written by the coordinator.
- **The migration record and new chain head are not written.**
- **`npm run generate` is not idempotent yet** — it rewrites the YAML and `pass-minimal.yaml`, so
  the clean-`git status` gate is unproven.
- **`npm test` was unmeasured at the checkpoint** and is being measured now. The
  583 / 580 pass / 3 fail figures predate four governed-source commits and must not be quoted.
- The `{sourceId, kind, anchor}` divergence from spec line 613 stands as a recorded finding for a
  later parcel, deliberately unfixed here.
- Not pushed, not merged, Stage F not run, **Gate 3 not delegated.**
