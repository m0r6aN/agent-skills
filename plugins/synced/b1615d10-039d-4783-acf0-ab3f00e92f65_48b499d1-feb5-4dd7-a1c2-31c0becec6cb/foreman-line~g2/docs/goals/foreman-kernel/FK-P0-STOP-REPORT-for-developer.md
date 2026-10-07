# FK-P0 — stop report for the developer

**Status: STOPPED at a ratified stop condition. Not merged. Gate 3 not presented as ready.**
Branch `codex/fk-p0-canon-authority-enforcement-registry`, head `4c53cd8`, **not pushed**.
Goal record branch `codex/foreman-kernel-stage0-20260830`.

## Why this stopped

The loop directive I ratified when I took ownership allows this owner **two rework rounds**. Both are
spent. After round 2, both independent reviewers confirmed their original blockers closed — and one
found a **new blocker-grade tamper route** that I reproduced against pristine code.

Starting a third round on my own authority is exactly what that tripwire exists to prevent, and my
last three "small and safe" judgments in this same mechanism were each wrong. So the parcel comes to
you as it stands.

---

## The one thing that blocks merge

**Head deletion-and-substitution validates green.**

The chain head is neither pinned nor listed as required, so it can be **replaced** under a fresh id
rather than promoted into. Reproduced by me against `src/` at `4c53cd8`:

```
delete registry-rework-df8155a
insert a structural copy under a fresh id (therefore absent from the pin table)
re-anchor its superseding digest to the tampered manifest

  no payload                     -> valid:true, 0 violations
  + 7 gate3.merge-authority rules retired -> valid:true, 0 violations
     resolveAuthority(gate3.merge-authority, coordinator, merge)
        -> REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY, controlling=[]
     reconciliations: 18; 'registry-rework-df8155a' present: false
```

The payload silently retires the rules asserting that **merges are human-owned and nondelegated**, and
the migration record attesting the R14 rework is simply gone. The count still reads 18.

**This is not the accepted residual.** Amendment R19, which I wrote and ratified, says in terms:
*"removing the head must invalidate the document, never promote a pinned record out of its pin."* The
implementation satisfies the second clause and not the first.

### The regression that comes with it

Round 2 also **closed the legitimate append path.** Adding a properly chained new head is refused,
because the demoted old head then needs a pin entry it does not have. Reviewer A isolated this: inject
the head's canonical digest into the pin table and append works but the pristine registry becomes
invalid; leave it out and the registry is valid but append is refused. **There is no pin-table state
where both hold.**

Three shipped claims are false as a result — the `verifyMigrationChain` docstring, `README.md:162-163`,
and the ratified residual at `README.md:190-192`, all promising that appending a properly chained record
is admitted.

The accepted residual has therefore been converted from **append-only and history-preserving** into
**history-destroying**: the cheapest file-only route that now passes is the one that erases the
attestation. That is the opposite of R19's intent and it degrades the human-review-of-git-history
backstop the residual explicitly leans on.

---

## What is genuinely fixed, verified by me rather than accepted

| construction | before | at `4c53cd8` |
|---|---|---|
| shadow `superseding-binding-manifest` unshifted onto the head | `valid:true`, 0 | refused |
| schema-satisfying stub head (1-char prose, `anonymous`, no git evidence) | `valid:true`, 0 | refused, 5 violations |
| delete head + repoint the promoted **pinned** record | `valid:true`, 0 | refused |
| byte-match evasion: mutate the pinned record first, then delete the head | (new probe) | refused |
| head evidence append / remove / duplicate — 12 × 4 matrix | 3 uncaught | **UNCAUGHT 0** |
| `validate --repo-root <bad path>`, both shapes | exit 1 | exit **2** |
| a failing assertion in `semantic-invariants.test.ts` | **hung 150 s** | reported in 1.8 s |

**Suite:** 563 tests, 563 pass, 0 fail — up from 405 tests with **10 failures** at the start of round 2,
and from a 518-test baseline with 18 failures. `tsc`, `biome`, `validate` (469 rules) and `sweep` all
clean. Reviewer B independently ran `semantic-invariants` to completion at 420/420 in its own scratch
copy, in a directory where `git rev-parse` fails, concurrently with my run — neither truncated the
other. That is R20's two failure modes reproduced as non-failures.

### The green suite does not cover any of it — and that is the finding under the finding

Reviewer A ran `semantic-invariants` to completion at **420/420** and then mapped the new AC4
chain-head block (tests 407-420) against its own findings:

| obligation | covered by |
|---|---|
| O1 exactly one chain link | 408-411 — two superseding, two prior, zero superseding, zero prior |
| **O2 pinned record never head** | **412 — the promoted-pinned-record route ONLY** |
| O3 head shape | 413-415 |
| O4 reference binding | 416-418, including the stated residual |
| O5 distinctness | 419 |
| Route A shadow link | 420 |

**Nothing covers delete-the-head-and-substitute-a-fresh-unpinned-id. Nothing covers the append path.
Nothing covers three of the four wider-residual shapes.** A `grep` for head deletion returns three
tests, all targeting promotion or the bound entry.

So all four findings reproduce **against a suite that is entirely green**, and no test would notice
any of them. That is standing constraint #8 in its literal form: the green ACs verify the fixture
space, not the input space. It is also the strongest argument in this report against treating
563/563 as the answer to "is this ready" — and the reason the tests written alongside a fix are the
weakest evidence that the fix is complete, since they are written by the party who decided what the
fix was.

Test 407 is worth naming as the counter-example: an explicit "the shipped registry is valid, so each
refusal below is caused by its mutation" guard, with a no-op assertion on every mutation test. The
block is well built. It is simply built to the shape of the fix.

### One correction to Reviewer A, in the builder's favour

A noted that a fully green run **cannot** confirm the `assert.ok` hang is fixed, because the defect
only manifests on a *failing* bare assertion — and concluded "R20 claims it; I did not verify it."
That is right about the green run and it is not the whole evidence. The builder ran the A/B directly:
the real `:2495` assertion in the pre-rework file **hung 150 s** and reported in **1.8 s** through the
helper, one variable between arms, which I reproduced independently. It also injected a deliberate
failure into **each of the six test files** and observed each reported in 0.6-3.0 s. R20's
demonstration requirement exists precisely because a green suite is silent here.

---

## Decisions that are yours

1. **The blocker above.** My recommendation: **one more narrow rework round, by a new owner or by me
   with your explicit say-so.** The fix is bounded — require that the departing head's absence
   invalidate, rather than keying only on the promoted record's pin membership — and it must restore
   the append path at the same time, because those two are the same defect seen from opposite ends.
2. **Reviewer B's decoy finding.** Obligation 3's coordinator/tool/exit-0 check is `.some()` over every
   `command-result` rather than over the two chain commands, so a decoy entry satisfies it while the real
   chain commands carry `actorClass: 'anonymous'`. Verified free to tighten: **24 of 24** chain commands
   already satisfy the stricter predicate. B rates it SHOULD-FIX and does not think it warrants a round
   on its own; it is faithful to R19's wording, so fixing it needs an amendment. **I recommend taking it
   in the same round as the blocker.**
3. **The README residual is narrower than reality.** Reviewer A found four further head-only edits that
   are accepted but documented as refused. In a parcel whose purpose is representing honestly where
   enforcement is real, a stated limit narrower than the true one is a defect in the deliverable.
4. **Amendment A1.8** has never been reviewed and carries a known self-reference defect.
5. **W1–W4 provenance records** cite PRs #35–#106; the repo has had **13 PRs ever** and none resolve.
   Five squash SHAs are unknown and `foreman-line-ci.yml` never existed. All ten claimed packages do
   exist, so the code is real and the evidence trail is broken. Decide whether to re-anchor or annotate.
6. **No CI covers any `plugins/foreman-line/` package.**
7. **Risk U1** — FK-P18 backstop independence — remains an unowned risk and a stop condition on FK-P18.
8. **Deferred to FK-P1 with named stop conditions:** retirement and `resolveAuthority` are mutually
   exclusive (latent, fail-closed, 0 rules retired today — both reviewers found it); `historical-only`
   requires no evidence while `retired-from-agent-reading` requires four; honesty-field `weakestBy`
   inconsistency; `rationale`/`lineHint` outside every digest; residual path aliases; per-query
   performance, which remains **unestablished** rather than regressed.

---

## What I got wrong, in one place

- **"A missing guard, not a hole."** I ran five attack variants against the head, saw all five refused,
  and wrote that into the record. Both live routes were **one step past where I stopped** — I had even
  run tamper-plus-delete-head and not taken the next step. Caught only because I withheld that
  conclusion when sending the reviewers the raw observation.
- **R16 was mine**, and it admitted a tampered registry. **R19 was mine**, and it has now needed
  narrowing twice — R21 for obligation 4, which would have invalidated the shipped registry, and
  obligation 2 is what this stop report is about. Both were written fast, under pressure, immediately
  after being proven wrong about the same mechanism.
- **I accepted "169 passed, 0 failures"** derived from a progress log that appends in a `finally` and
  carries no pass/fail signal. Six failures were already behind it.
- **I killed the builder's run and called it stalled** without verifying, breaking my own practice.
- **I over-specified the hang's mechanism** — I had an inspector stack and one instance, and stated a
  general rule I had not measured. The builder's two negatives refuted it.
- **My first exploit probe flipped zero rules** because I guessed a field name, and reported a clean
  bypass. The same no-op trap caught the builder and both reviewers.

The recurring shape: **a plausible mechanism written into the record before it was measured.** Four
times by me this round, three by the builder. Every one was caught by a probe, none by reasoning.

---

## State on disk

- Parcel branch `4c53cd8`, worktree clean, **not pushed**. 8 files, +1481/−618, nothing outside
  `plugins/foreman-line/authority-registry/`. The registry YAML is **byte-unchanged** — no regeneration,
  no pin-table rewrite.
- Amendments R14–R21 each committed alone before dependent code, per SPEC-CONVENTION §11.
- Goal record on `codex/foreman-kernel-stage0-20260830` at `9520b00`, closure check C1–C35.
- The spec remains in `docs/specs/active/`. **Stage F closure has not run** — that would assert a
  completion that has not happened.
- Your uncommitted change to `plugins/foreman-line/routing-policy/routing-policy.yaml` in the ambient
  checkout is untouched, as instructed.
