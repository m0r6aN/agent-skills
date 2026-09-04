# FK-P0 rework round 6 — implement R24 (volatile operational state)

**Role:** builder. **Parcel:** FK-P0, canon authority and enforcement registry.
**Risk class:** architecture/risk — frontier tier.

Read, in this order, before you do anything: the standing constraints by reference at
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`; the parcel spec at
`plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md`,
specifically the new section **"Volatile operational state is outside the inventory boundary
(R24)"** and **Acceptance Criteria item 3** as amended by R24; and
`plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-BLOCKER-volatile-canon-source.md`, which is
the measured evidence this round exists to close.

## Where you work

| | |
|---|---|
| **Worktree** | `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry` |
| **Branch** | `codex/fk-p0-canon-authority-enforcement-registry` |
| **Base commit** | `47a26be` — the R24 amendment, committed alone |
| **Package** | `plugins/foreman-line/authority-registry` |

Never use the ambient `D:/Repos/agent-skills` checkout. Never touch another worktree. The branch
and worktree above are named here deliberately and are not ambient — do not create your own.

## Step 0 — restate and stop. No code before I confirm.

Your first action is to restate, and then **stop and wait**:

1. the scope of this round in your own words, including what it is *not*;
2. the exact Allowed Files you may write (list them; they are unchanged from the spec and there
   are 28 — if your count differs, that is a finding, report it);
3. the branch, worktree, and base commit above;
4. the verification chain you will run and the environment it runs in;
5. every out-of-scope item you can see; and
6. **your proposed mechanism for R24** — see below. This is the substantive part of Step 0 this
   round.

**R24 deliberately does not specify a mechanism.** It fixes the invariants, the exhaustive region
list, and the anti-laundering control, and leaves the record shape, schema change, and sweep
implementation to you. This is not an oversight: R16, R19 and R22 were each designed from the
coordinator's chair and each needed correction. You have read the code; I have read the spec.

So propose it, and propose it as a design with alternatives considered — how a region is
anchored so it survives the document being restructured (heading text is not a stable anchor if
the heading itself can be edited); how the closed schema changes; how the sweep decides an item
falls inside a region; and how the validator detects overlap with a published rule's locator.
Name what you rejected and why. Then stop. I will rule on the design before you write code.

## Root cause this round addresses

Exactly one, named for the record: **the registry declares `loop-directive.md` a binding source
and pins its content by digest, while the canon requires the coordinator to rewrite that file at
every stop, ownership transfer, and parcel closure.** Per-item exclusion cannot express that,
because a newly appended block is neither published nor excluded, so it is uncovered.

This is a root cause not previously addressed on this parcel. Rounds 1–5 addressed the manifest
pin, the chain head, the head exemption, hermeticity, and the Git binder. None of them touched
the inventory boundary.

## What "done" is

The three controls in amended AC3 are the definition of done, and **all three must hold**:

- **(a) Negative control.** Mutate each declared volatile region of `loop-directive.md` both ways
  — append a new paragraph, and alter bytes in an existing one — and the sweep exits 0 with zero
  violations. The 45-violation reproduction in the blocker record is the fixture you must retire.
- **(b) Positive control.** Mutate a *governed* normative sentence in the **same** source — one of
  the ownership block's rule sentences — and the sweep still reports a violation with the specific
  expected code. Without this, (a) cannot distinguish a scoped exclusion from a disabled sweep.
- **(c) Anti-laundering control.** A volatile-region declaration overlapping a published rule's
  locator is refused by the validator, fail-closed, with a stable code.

Controls (a) and (b) must each fail for the right reason if the other is deleted. Verify that by
actually deleting one and re-running, not by reading the code. Report what you observed.

## Verification chain — run all of it, capture complete output

```
cd plugins/foreman-line/authority-registry
npx tsc --noEmit
npx biome check .
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
npm run generate     # then: git status --porcelain MUST be empty
npm test
```

Run Node and package work **sequentially**; this is Windows and concurrent installs race.

### Test-count tripwire

**Baseline at `a100a91`: 583 tests total, 580 pass, 3 fail.** The 583 total is established, and
`authority-registry/` was byte-identical between `838f438` and `a100a91`, so the total is not in
question.

Your result must satisfy **all** of:

- total tests **≥ 583 plus your new control tests** — a lower total is a removed test and is a
  stop condition, not a cleanup;
- **0 fail**; and
- the three previously-failing tests pass **for the right reason**, not because they were edited
  to expect the new behaviour without asserting it. `corpus-sweep` test 18 and
  `schema-validation` test 4 in particular: if you change either test's expectations, say exactly
  what you changed and why the changed assertion is still meaningful.

If `npm test` reports `pass 0` on `semantic-invariants.test.ts` with no per-test output, **read
the child process exit code before diagnosing.** If it is `3221226505` (`0xC0000409`, Windows
`__fastfail`) that is a known non-deterministic harness crash, not your defect — re-run it. It
passed 440/440 alone and 583/583 in a full run on 2026-09-03.

## Hard boundaries

- **You may not edit `loop-directive.md`.** It is in the spec's Forbidden list. R24 is implemented
  in the registry, generator, validator and tests — never by editing the governed document to suit
  the tool. If you believe the document must change, that is a stop-and-report.
- **You may not edit the spec, charter, plan review, convention, coordinator pattern, or standing
  constraints.** Need a change? Stop and request a coordinator-ratified amendment, and await a new
  Step 0.
- **You may not expand the source corpus, change an Allowed File, or update the source snapshot.**
- Do not touch the ambient checkout or absorb any user-owned change.
- No external effects: no push, no PR, no network mutation, no credentials.

## Stop and report if

- the design needs a product or authority decision R24 does not supply;
- a required file falls outside the 28 Allowed Files;
- the anti-laundering control cannot be made to work, in which case **say so rather than shipping
  (a) and (b) alone** — a scoped exclusion without overlap detection is a rule-retirement
  mechanism;
- controls (a) and (b) cannot both be made to fail-for-the-right-reason under deletion;
- a security boundary cannot close inside the parcel; or
- the same tripwire fires twice.

## Reporting

Your completion claim must map every assertion to evidence: commands run, exit codes, test
totals and pass/fail counts, the sweep summary counts, and the SHA you committed. A claim of the
wrong shape is treated as empty — that is a standing rule on this parcel, not a threat. If
something is unverified, mark it unverified; an honest gap costs a follow-up, a false green costs
a round.
