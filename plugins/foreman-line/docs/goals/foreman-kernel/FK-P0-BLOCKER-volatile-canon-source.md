# FK-P0 blocker — the registry digest-pins a file the canon requires it to mutate

**Found:** 2026-09-03, by the coordinator session that took ownership that day (second
2026-09-03 owner), while executing Option B of `FK-P0-MERGE-READY-material.md` under the
developer's explicit choice.

**Severity: BLOCKER.** It voids the "green chain" on which the Gate 3 presentation rests.
Not because the chain was mismeasured — every figure in `FK-P0-MERGE-READY-material.md`
reproduces — but because the chain is **conditional on a file staying frozen that the canon
orders the coordinator to rewrite.**

**This was not caused by Option B.** Option B only exposed it. See "Option A does not avoid
this" below: under Option A the defect lands on `main` latent and detonates on the first
Stage F closure.

## What happened

Option B's intermediate merge (goal branch → parcel branch, head `838f438` → `a100a91`)
carried the newer `loop-directive.md` onto the parcel branch. All six preservation checks
passed: documentation only, `authority-registry/` byte-identical, charter kept A1.9's `Entry`
column, the R23 spec intact at 111,541 bytes, `FK-P0-GATE-3-package.md` present, ADR-001's
ratification carried forward.

Then the green chain was re-run on the merge target:

| gate | at `838f438` | at `a100a91` |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | exit 0 |
| `npx biome check .` | exit 0, 5 infos | exit 0, 5 infos |
| `validate` (hermetic) | valid, 0 violations | **valid, 0 violations** |
| `sweep --repo-root` | valid, 0 violations | **`valid: false`, 45 violations, exit 1** |
| merge into `main` | conflict-free, additions-only | conflict-free, 62 files, 118,459 insertions, **0 deletions** |

## Causation, proven by experiment rather than inferred

On the merged head, `loop-directive.md` alone was reverted to its `838f438` content — nothing
else touched — and the sweep re-run:

```
git checkout 838f438 -- plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
→ {"valid":true,"violations":[],...}   exit 0
```

The file was then restored to `HEAD` and the worktree confirmed clean. `loop-directive.md`
is the sole cause of all 45 violations.

## The defect

The registry inventories the loop directive as a **binding, digest-pinned** source
(`authority-enforcement-registry.yaml:2546`):

```yaml
  - sourceId: fk-loop-directive
    path: plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md
    sourceKind: goal-charter
    authorityTier: goal-charter
    authorityEffect: binding
    snapshotEvidence:
      commit: 7e7dc7db...
      fullFileSha256: f2e9c89a8df1392e780f2a4eee17861d5c0011e485a5e9573ac20b9849a6568b
```

Every one of the 45 violations lands in one of exactly three sections — and all three are
sections whose **stated function is to be rewritten**:

| section | violations | what the canon says about mutating it |
|---|---|---|
| `## Current state — update at every stop or parcel closure` | **37** | the heading is the instruction |
| `## COORDINATOR OWNERSHIP` | **7** | "Ownership transfers only at a parcel boundary **by editing this block**" |
| `## Queue and dependency order` | **1** | the parcel `State` column changes at every closure |

Split by code: 10 `VALUE_DIGEST_MISMATCH` (inventoried blocks whose text changed) and 35
`SOURCE_ITEM_UNCOVERED` ("binding prose block is not inventoried" — blocks that did not exist
when the registry was generated).

So the contradiction is exact:

> **FK-P0 pins by content digest a document that the coordinator pattern, the `/goal` skill,
> and this very directive all require the coordinator to rewrite at every stop, every
> ownership transfer, and every parcel closure.**

Digest-pinning and mandated mutation are incompatible for this source. `sweep` green is
reachable only while the coordinator is not doing its job.

The bite is immediate and self-referential: **step 11 of this directive's own per-parcel
algorithm ends with "and this state block update."** Performing Stage F on FK-P0 turns
FK-P0's own sweep red. The parcel cannot be closed out without violating itself.

## Option A does not avoid this

Merging the parcel branch alone lands `main` with the `loop-directive.md` frozen at
2026-09-02 — the exact bytes the registry was generated against — so the sweep is green at
merge time. Then the first mandated state update (Stage F closure, the next ownership
transfer, or the next stop) turns `main` red. Option A buys a green merge and ships the
defect latent, which is strictly worse than finding it now.

## What this is not

- **Not a mismeasurement.** Every figure in the Gate 3 package and the merge-ready material
  reproduces exactly, including `npm test` 583/583 and the byte-identical generator run.
- **Not the re-anchor residual.** That residual is about a regeneration laundering a tampered
  source. This is about a source that is *supposed* to change.
- **Not `validate`'s problem.** Hermetic `validate` stays green at 0 violations because it
  compares the registry to itself and never reads the repository. Only `sweep` sees it. That
  asymmetry is itself worth noting: the hermetic gate cannot detect this class at all.

## Why two independent frontier reviews missed it

Both reviewed at a head where the loop directive had not moved since generation. The defect
is invisible unless a governed source is mutated between generation and sweep — which is
what Option B did, and what Stage F would have done a few minutes after a Gate 3 merge.
Recorded as a review-mandate gap: **an adversarial review of a canon-registry parcel must
mutate a governed source and re-sweep**, not only sweep the as-built tree.

## Candidate fix, for the developer's ruling — not applied

The registry already carries the vocabulary needed:
`exclusionDisposition: non-normative-explanation`, used elsewhere for explanatory blocks.

The shape of the fix is to distinguish, within a binding source, **normative rules** from
**volatile operational state**:

- The ownership block's *rules* ("one goal, one coordinator"; "transfers only at parcel
  boundaries") are genuinely normative and belong inventoried. Its *current occupant* is
  state and does not.
- `## Current state` and the queue's `State` column are operational state end to end and
  should be excluded, or the directive should be split so state lives in a file that is not
  a binding source.

Note that `sweep` flags per-block `valueDigest` and coverage; it did not emit a whole-file
digest violation, so excluding the volatile blocks appears sufficient without abandoning
`snapshotEvidence`. **That is a hypothesis, not a verified claim** — it needs a builder to
establish it, and the charter's FK-P0 mandate ("inventory every standing coordinator, gate,
stop, and authority rule") constrains how much may be excluded.

This changes what the registry governs, so it is a spec amendment before code, and it is the
developer's call whether FK-P0 takes another rework round or lands under Option A with this
recorded as an accepted, documented residual.

## State as of this record

- Parcel branch `codex/fk-p0-canon-authority-enforcement-registry` at **`a100a91`** — the
  Option B intermediate merge, committed, local only, **not pushed, not merged**.
- Reverting is one command (`git reset --hard 838f438`) if the developer prefers Option A.
- Goal branch `codex/foreman-kernel-stage0-20260830` carries ADR-001's ratification (`2f9d3f7`).
- **No merge to `main` has been performed. Gate 3 remains not delegated.**
- FK-P0 is **not merge-ready as presented**.
