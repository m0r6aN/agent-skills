# FK-P0 — Coordinator Closure Check

**Owner:** Claude Code coordinator session (ownership transferred 2026-09-01).
**Subject:** `codex/fk-p0-canon-authority-enforcement-registry` @ `df8155a`.
**Rule applied:** claims are verified on disk before acceptance; wrong-shaped claims are
presumptively empty. No inherited R2–R13 review evidence exists, so nothing is credited.

## Verified on disk by the coordinator

| # | Check | Result |
|---|---|---|
| 1 | Diff scope vs merge-base `dd6bc4a` | **PASS** — 28 package files, exactly the 28 in the spec's Allowed Files. No extras. |
| 2 | Additions-only (`--diff-filter=MD` empty) | **PASS** — zero modifications or deletions of pre-existing files. |
| 3 | Coordinator-authored docs reported separately (AC1) | 4 files (charter, loop-directive, plan-review-findings, spec) — accounted for by AC1's own carve-out, not builder mutation. |
| 4 | `npx tsc --noEmit` (Node v24.7.0, PowerShell) | **PASS** — exit 0, no output. |
| 5 | `npx biome check .` | **PASS** — exit 0, 14 files, no fixes applied. |
| 6 | `npm test` | See "Deterministic pass" below. |
| 7 | Two independent fresh reviews (AC15) | Dispatched under this owner; see findings documents. |

## C1 — BLOCKER (merge sequencing, not code)

**FK-P0's branch carries a stale charter.** Both branches forked from `dd6bc4a`; `main` has no
`goals/foreman-kernel/` at all.

| File | on `fk-p0-…` | on `foreman-kernel-stage0-…` | |
|---|---|---|---|
| `charter.md` | 405 lines, `sha a69b19d69106` | 435 lines, `sha c19359374480` | **DIFFER** |
| `loop-directive.md` | `sha b7dd2ee3e6c6` | `sha f2e9c89a8df1` | **DIFFER** |
| `plan-review-findings.md` | `sha d2e5bc326845` | `sha d2e5bc326845` | same |

The FK-P0 copy predates ratified amendment **A1** (D21, the decision-path latency budget) and
the A1.8 ledger. **Merging FK-P0 to `main` first would land the stale charter as canonical and
silently revert a developer-ratified amendment that never reached `main`.** Nothing in the
verification chain would go red; this is exactly the silent-collision class.

**Required merge order:**
1. Merge the **goal branch** `codex/foreman-kernel-stage0-20260830` to `main` first (docs only:
   charter, loop-directive, ADR-001, A1/A2 records, kickstarters).
2. Sync `codex/fk-p0-canon-authority-enforcement-registry` with the new `main`, resolving
   `charter.md` and `loop-directive.md` **to `main`'s version** — FK-P0 has no authority over
   either file, and the spec's Forbidden section says so explicitly.
3. Re-run the deterministic pass on the synced branch, then merge FK-P0.

Both merges are human Gate 3 actions. This order is not optional.

## C2 — SHOULD-FIX (test-suite design)

The seven `tests/fixtures/reject-*.yaml` are each a full ~39,897-line copy of the registry,
differing from `pass-minimal.yaml` by **2–47 lines**; `pass-minimal.yaml` is itself a near-copy
of the shipped `authority-enforcement-registry.yaml` (39,897 lines), so its name is a misnomer.

| Fixture | Diff lines vs `pass-minimal` |
|---|---|
| `reject-contradictory-authority.yaml` | 47 |
| `reject-duplicate-rule.yaml` | 46 |
| `reject-stale-source.yaml` | 8 |
| `reject-identity-mutation.yaml` | 6 |
| `reject-missing-source.yaml` | 6 |
| `reject-location-mutation.yaml` | 2 |
| `reject-value-mutation.yaml` | 2 |

**~279,000 fixture lines encode ~117 lines of test intent.** Consequences the coordinator
asserts: the suite runs >25 minutes serially; every registry change must be mirrored into eight
40,000-line files or they drift silently; and no reviewer can see what a fixture tests without
diffing it. The natural shape is one base fixture plus seven small programmatic mutations.

This is plausibly a partial cause of the twelve-round rework spiral: each round's registry edit
had to be replayed across eight near-identical 40,000-line files.

**Correctness consequences are delegated to Reviewer B**, whose highest-weighted task is
empirically mutating each named axis to prove the negative fixtures still have teeth (AC11).
Maintainability alone is recorded here and does not block.

## C3 — abandoned stash on the FK-P0 worktree (disposition)

Reviewer A flagged (I6), coordinator confirmed:

```
stash@{0}: On codex/fk-p0-canon-authority-enforcement-registry:
           fk-p0-r11-partial-before-profile-count-amendment
```

**Provenance:** the dead Codex session, at R11, immediately before the profile-count
correction that later landed as `3efd617` / `ae6dac0`.

**Coordinator check:** `git stash show -p stash@{0} | git apply --check --reverse` **fails** on
all 14 files — the stash does not reverse-apply, because HEAD has advanced through R12 and R13
past the base the stash was taken from. It is superseded partial state, not lost work: the
corrections it predates exist as committed history.

**Disposition: LEAVE IN PLACE, do not drop.** Dropping is destructive, recovers nothing, and
the entry is harmless — a stash is not part of any branch and cannot reach `main`. It is
recorded here so a future reader does not mistake it for live work. If the worktree is removed
at Stage-F cleanup, confirm this disposition still reads correctly before removal, since
worktree removal discards the stash with it.

## Deterministic pass — partial observation

At the time of writing, `npm test` (Node v24.7.0, PowerShell, `--test-concurrency=1`) had
recorded **133 passed, 0 failed** before stalling inside `tests/semantic-invariants.test.ts`.
Reviewer A independently observed that single file running **>70 minutes** without producing
output, with the process alive rather than hung. The two observations agree.

**A green deterministic pass on this parcel does not mean what it appears to mean.** Reviewer A
established that at least seven `schema-validation.test.ts` assertions and five of a 25-test
`semantic-invariants` subset pass *solely because of the B1 manifest pin*, not because the
invariant they name holds. The suite going green is therefore not evidence of correctness for
those items. This is recorded so the eventual green chain is not read as a refutation of B1.

## C4 — the suite's runtime is unexplained, and the coordinator caused a false alarm

**Coordinator error, recorded because it corrupted evidence.** To clear the machine for the
builder's control run, this coordinator killed orphaned node processes. Both reviewers had
completed their turns but remained resumable; the kills woke them, they observed their runs die,
and they relaunched — two of them **inside the builder's parcel worktree**. The builder's census
caught this within two minutes of starting its control run, before writing a single byte, and
stopped rather than proceeding on a contaminated baseline.

Both reviewers are now hard-stopped via `TaskStop`. Their orphan trees were killed by exact PID
with the builder's tree verified alive afterwards. Standing practice for the remainder of this
goal: **reviewers run the suite only in their own copies, never in a parcel worktree.**

### The open question this exposed

Reviewer B's final measurement before it was stopped:

> heap is stable (~90–140 MB, GC reclaiming) and `validateRegistry` averages **0.16 s** — 92 calls
> is ~15 seconds, not 16 minutes. **OOM and slow validation are both ruled out.**

That 0.16 s corroborates Reviewer A's independent 133 ms figure, so the per-call cost is solid. But
it means **contention and memory pressure do not explain either the ~23–38 minute runtime or the
opaque `pass 0 / fail 1 / 'test failed'` deaths.** The obvious hypothesis — that the deaths were a
contention artifact and the suite is honestly green — is *not* established, and the coordinator has
directed the builder not to conclude it from a quiesced run passing.

**Where the time actually goes is now an open question**, not a curiosity. Reviewer B's next
planned probe — isolating module evaluation from test bodies — is the right one and was not
completed. Carried as an open item into the builder's baseline task.

**Evidence status for AC13:** one full `npm test` returned exit 0 under partial contention. Five
other full runs died at the file level. No trustworthy test count exists yet. The builder's clean
control, on a machine verified quiesced PID-by-PID, is the evidence of record and has not yet run.
