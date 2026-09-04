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
| `tsc --noEmit` | **exit 1** — `src/validate.ts(3426,27)` and `(3432,23)`: `Cannot find name 'blanked'` |
| `biome check .` | exit 0, 5 infos |
| tests | **no test file touched — none of controls (a)–(g) exist** |
| regions | all three declared in the shipped YAML |

`Cannot find name 'blanked'` is a half-written masking function: the failure is mid-edit, not a
design defect. The registry YAML and `tests/fixtures/pass-minimal.yaml` were regenerated
(~610 changed lines each) **by code that does not compile**, so those emitted bytes are untrusted
and no claim is made about them.

## One unruled design divergence, carried forward for a ruling

The prior builder anchored regions by **`headingItemId`** (e.g. `item.4b79a165c3a2`) rather than by
the derived stable heading key it had proposed and the coordinator had endorsed. This may be
better: the heading item is itself digest-pinned and sits outside every region, so anchoring to it
is more robust than re-deriving a key from heading text. But it was never ruled on, and an
unreviewed change to how a security boundary is anchored does not stand by default. The recovery
builder must state which it implements and why.

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

## Open at this record

- Round 6's real deliverables are all still open: the masking primitive, obligation 1, standing
  authorization 8's curation, the two-kind extent union, the two new result codes, all seven
  controls, and the migration record with its new chain head.
- `npm test` remains **genuinely unmeasured** for this round. The 583 / 580 pass / 3 fail figures
  predate three governed-source commits and must not be quoted as current.
- Coordinator-measured sweep baseline: **54 violations at `9a273a0`** — 2 `LOCATOR_MISSING`,
  45 `SOURCE_ITEM_UNCOVERED`, 7 `VALUE_DIGEST_MISMATCH`.
- Not pushed, not merged, Stage F not run, **Gate 3 not delegated.**
