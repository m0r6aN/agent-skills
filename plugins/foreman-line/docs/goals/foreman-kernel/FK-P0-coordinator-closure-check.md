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

## C5 — where the 23–38 minutes actually goes, and a five-day resource leak

Found by the builder during its baseline task, verified on disk by the coordinator. This answers
the C4 open question and reframes the directive's fix 21.

### The runtime is module evaluation, subprocesses, and redundant parsing — not memory

| Cost | Location | Verified |
|---|---|---|
| Importing one pure helper executes the **entire generator's top level** | `tests/corpus-sweep.test.ts:17` imports `markdownIdentityProjectionForTesting` from `../src/generate.js` | **TRUE** |
| That top level runs **two `git show` subprocesses** and parses two ~2.1 MB / ~40,000-line YAML documents out of history | `src/generate.ts` — module-level `const priorR11Registry = parse(execFileSync('git', ['show', …]))`, same for `priorR13Registry` | **TRUE** |
| `corpus-sweep` parses the current registry **again** at module level | `tests/corpus-sweep.test.ts:24` | **TRUE** |
| `semantic-invariants` parses **4.2 MB at module load** — and because `pass-minimal.yaml` is byte-identical to the registry, it parses the same 40,000-line document **twice** | `tests/semantic-invariants.test.ts:30-35` | **TRUE** |
| **48 `git clone` calls per run**, each paired with `mkdtempSync` + recursive `rmSync` | `tests/corpus-sweep.test.ts:28-32`, `copyCorpus()` | **TRUE** |

Five ~2.1 MB YAML parses per run, three of them avoidable. This is consistent with every prior
observation: it explains why Reviewer B measured a stable 90–140 MB heap and a healthy 0.16 s
`validateRegistry` and still could not locate 23 minutes — the cost is process spawning, filesystem
churn, and parsing, none of which appear in heap or in `validateRegistry` timing.

**The directive's framing of fix 21 as a memory problem (~118 `structuredClone` calls) is probably
wrong.** `structuredClone` is real but it is not the headline. Fix 15 also turns out to have an
uncosted payoff: shrinking the positive fixture removes one full 2.1 MB parse outright.

### The leak — 81 orphaned daemons over five days

Each `git clone` starts an `fsmonitor--daemon` for the new temp repo; `rmSync` deletes the
directory but the daemon survives and detaches. Coordinator census:

**81 live `git` processes, 891 threads, 603.7 MB**, by start date:

| Aug 28 | Aug 29 | Aug 30 | Aug 31 | Sep 1 | Sep 2 |
|---|---|---|---|---|---|
| 12 | 8 | 10 | **24** | **23** | 4 |

The Aug 31 and Sep 1 spikes correspond to the prior owner's R2–R9 and R10–R13 rework rounds. This
is a five-day accumulation on the developer's machine caused by this test suite, at roughly 48 per
full run.

**Cleanup deliberately deferred** until the builder's control run completes — killing 81 processes
mid-run is precisely how the coordinator contaminated the first control (C4), and it is not being
repeated. Fixed at source by `-c core.fsmonitor=false` plus clone-once-and-reuse.

### Fix 20's stated remedy does not work — third coordinator error this round

The directive said to "switch to a streaming reporter (TAP) or otherwise guarantee per-test output
survives a crash." The builder proved by controlled probe that node streams at **file** granularity
but **buffers within a file**: two deliberate 3-second tests in one file both appeared at the same
instant only after the file completed. TAP was already in use.

So a dying `semantic-invariants.test.ts` still loses all ~197 results and still surfaces as one
failed file with no per-test output. **The remedy as written would have been implemented, looked
correct, and left the gate exactly as blind.** The builder stopped rather than close it green.

This also explains the historical failure signature better than contention does: "single failing
test, `pass 0`, no per-test output" is simply what node emits whenever a file does not finish, for
any reason. Whatever killed those runs, *this* is why nobody could see what failed.

**Ruled:** implement both per-file isolation (`package.json`) and intra-file `process.stderr.write`
progress markers, which are outside the buffered stdout path and survive a non-graceful exit.
Splitting the 197-test file is declined for this round — Allowed Files fixes the suite at six test
files and widening it mid-round is how scope creep starts. Recorded as a candidate for the successor.

## C6 — the green/red split explained, and proven by commit timestamp

The contradictory run evidence is resolved, and not by contention.

| Event | Time |
|---|---|
| Coordinator's **green** full run (`npm test` exit 0) | 06:43:27 → ~07:38 |
| Reviewer/coordinator runs that died in `semantic-invariants` | 07:02, 07:12, 07:19 |
| **Merge `a703941`** — current charter + loop-directive onto the parcel branch | **07:43:05** |
| Builder's control run — first run *after* the merge | 07:53:40 |

**No run before 07:43:05 could show the corpus-sweep failures; every run after must.** The builder
predicted this from the test counts before the timestamps were checked, and the commit log confirms
it exactly.

### What the failures are

18 failing tests in `corpus-sweep`, 115 passing, from **26 violations** — 13 `VALUE_DIGEST_MISMATCH`
and 13 `SOURCE_ITEM_UNCOVERED`; **15 from `charter.md`, 11 from `loop-directive.md`**. Every one is
amendment-A1 content: `D21`, the new section 4.1 ledger paragraphs, the changed Gate 1 prose, and
section 13 items 7 and 9.

**The validator is doing its job. The data is stale.** This is BLOCKER 2 executing rather than
merely hashing.

### The part that reflects on the coordinator

The registry was **always** stale relative to the current charter. The branch also carried the stale
charter, so the two matched and nothing noticed. The coordinator's merge brought the current charter
onto the branch and the sweep went red within one run — the defect was latent and the merge exposed
it. That is a better outcome than a green suite over a stale artifact.

**F2 is now proven by execution, not just by hash.** `loop-directive.md` contributes 11 of the 26
violations, so had BLOCKER 2 been worked as the directive originally wrote it — charter only — 11
violations would have survived the rework and the sweep would still be red. The under-scoping was
load-bearing, not cosmetic.

### What this does NOT explain — kept deliberately separate

`semantic-invariants` file-level deaths (`pass 0`, no per-test output) were observed at 07:02,
07:12 and 07:19, **all of which predate the merge**. The merge cannot explain them and they remain
**OPEN**. The two phenomena must not be conflated: corpus-sweep's 18 failures are closed by
regeneration; the semantic-invariants death is not.

## C7 — BLOCKER 1's chain verified end to end, and the pin is redundant

The builder extracted the full chain from shipped data before writing code. Twelve unbroken links,
from the genesis `registry-binding-manifest` out-digest `1fe3a7c6`, through
`superseding-binding-manifest` r4 to r13, ending at `f753296b`.

**Coordinator-verified:** the head `f753296b78bcf4d8de9e603e8e347286519a26694c2241ae4a00a05676388e2f`
is byte-identical to `SHIPPED_BINDING_MANIFEST_DIGEST` at `validate.ts:445`.

So the hardcoded pin is **redundant with a chain head already present in the document**. Both
designs accept exactly the same artifact today; they diverge only for a legitimately amended
registry, which the chain admits and the pin rejects. **The fix is subtractive.**

Field choices confirmed — including the trap avoided: `registry-binding-manifest` `inputDigest` is
`41ba3a51` across r3 to r10, then `554c2297` at r11 and `bb8f0011` at r12. It is commit-derived, not
chain state, and treating it as the link would have produced a **false pass across eight
consecutive records**. The builder identified and excluded it before writing code.

### Fix 18 is smaller than the triage feared

Reviewer A's five pin-only tests (`:808`, `:817`, `:826`, `:835`, `:1366`) each mutate a rule and
then **recompute `bindingDigest`**, so only a whole-corpus manifest check catches them. The chain
keeps a whole-corpus check and merely anchors the expected value in the chain instead of a constant
— so all five stay caught. **A naive delete-the-pin fix would have silently unmasked all five.**
Their names ("requires typed prior-manifest migration") indicate the tests were written for the
chain design and the implementation hardcoded it.

## C8 — the fix-8 inert-test class has at least nine members

| Test | Found by |
|---|---|
| `:899`, `:913`, `:933` | Reviewer A |
| `:1197` | Builder (coordinator-confirmed) |
| `:1176` — tier promotion never tested | Builder |
| `:2222`, `:2400`, `:2413`, `:3182` — `reasonCode` unasserted, so `REQUIRE_HUMAN` is ambiguous between `NO_APPLICABLE_AUTHORITY`, `INVALID_QUERY_SCOPE` and `REGISTRY_INVALID` | Builder |

Three found by adversarial review; **six found by the builder's sweep.** The ambiguous-`reasonCode`
sub-class is the mechanism by which a test keeps passing after the property it names stops holding;
the ruling is to assert `reasonCode` everywhere, not only in those four.

**Two clean scans recorded as negative findings:** the inert-CLI class is confined to
`schema-validation.test.ts:82-97`, and the four assert-free tests delegate to throwing helpers.
Neither is a defect. Reporting negatives that could have been quietly omitted is what makes the
positives credible.
