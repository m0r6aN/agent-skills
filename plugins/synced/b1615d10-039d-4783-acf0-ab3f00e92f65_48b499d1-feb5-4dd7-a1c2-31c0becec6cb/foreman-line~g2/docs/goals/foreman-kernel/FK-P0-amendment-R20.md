# FK-P0 amendment R20 — the suite must be hermetic and must be able to fail

**Status:** coordinator-ratified. **Committed alone, before any dependent code**, per SPEC-CONVENTION §11.
**Target:** AC13.

## Why

Three defects with one consequence: **this round's verification kept destroying its own evidence.**

**1. A failing assertion hangs the suite instead of failing it.** `tests/semantic-invariants.test.ts`
holds 274 `assert.ok(` calls, most with no message. When a bare one fails, node reconstructs the
expression text by re-parsing the 3,000-line file with acorn — `findColumn` → `parseCode` recursion —
and does not terminate in any useful time. Established by attaching an inspector to the live worker
and taking the stack, not by inference. Because node buffers a file's reporter output until the file
completes, **every result for the file is then lost**.

The cost was not theoretical. It consumed a 110-minute run, and it hid **nine further failures** behind
the first. Fix 20's progress log — built for exactly this crash — is the only reason the failing test
was identifiable at all.

**2. Fixed temp paths make concurrent runs corrupt each other.** `join(tmpdir(), 'fk-p0-reject-…')`
and both progress logs are fixed, non-unique paths, truncated at import and `rmSync`-ed at teardown.
Two runs race: whichever finishes first deletes the other's fixture mid-test, yielding `IO_ERROR` and
exit 2 against an `assert.equal(status, 1)`. `corpus-sweep.test.ts` already uses `mkdtempSync` for its
fixture roots; nothing else does.

**This is the mechanism behind "a concurrent run corrupted evidence", which happened twice in this
round** — recorded as C4 and C23 and charged to my process management. Part of it was not my
judgment at all. It was a defect in the package, and I attributed it entirely to myself because the
package gave me no way to see otherwise.

**3. `generate.ts` performs repository I/O at module scope.** Two `execFileSync('git', ['show', …])`
calls run as an import side effect, and `corpus-sweep.test.ts` imports that module for one pure
helper. The file therefore spawns git over multi-megabyte blobs before any test runs, and **cannot
load outside a Git worktree containing those commits.**

The consequence is structural, not stylistic: the standing instruction to reviewers is *never run
tests in the parcel worktree, copy to your own scratch*. **For this file that instruction is
unsatisfiable.** Both post-rework reviewers reported, independently, that they could not run the
suite. AC15 requires two independent fresh reviews; both were delivered with an explicit,
package-caused gap in what they were able to execute.

## Ratified text

Appended to AC13:

> The suite is hermetic and reports its own failures. Every artifact a test writes outside the
> package uses a per-run unique path, so two concurrent runs cannot delete or truncate each other's
> files; no module performs repository I/O at import time, so every test file loads outside a Git
> worktree; and a failing assertion in any test file produces a reported failure within seconds
> rather than a hang. That last is a positive obligation, demonstrated by deliberately injecting a
> failure into each test file and observing it reported - never assumed. A suite that cannot report a
> failure is not evidence, and output that is complete because nothing failed is not the same as
> output that would be complete if something did.

## Note on the demonstration requirement

The injected-failure demonstration is deliberate and it is not ceremony. Fix 20's **first**
implementation typechecked, read correctly, was coordinator-approved, and produced **zero output** —
in the one fix whose entire purpose was making failures visible. It was caught by probe, not by
reasoning, and only after four separate probes established that node intercepts `process.stderr` and
even raw `writeSync(2)`.

A remedy for invisible failure that is itself never observed failing is the same defect wearing the
fix's clothes. This round has now produced two of those.
