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

## C9 — CORRECTION to C5: the runtime driver is the clones, not module evaluation

C5 recorded module evaluation as the answer to the runtime question. **That attribution was wrong
and is withdrawn.** The builder measured it properly once the five completed files yielded per-test
`duration_ms` alongside file wall-clock, and withdrew its own hypothesis:

| Quantity | Measured |
|---|---|
| Wall clock, five completed files | 865 s |
| Sum of test-body durations | 826.6 s |
| **Module evaluation + inter-test overhead** | **~38 s — about 4 %** |
| `corpus-sweep` test bodies alone | 795.9 s — **96 % of all test time** |
| Individual tests over 5 s | 77 |
| Worst single test | 22.4 s |

**The driver is the 48 `git clone` calls and 50 temp-corpus copies inside test bodies**, not the
module-level `git show` subprocesses and YAML parses. Those imports are real and worth fixing as
cheap hygiene, but they are ~4 % and were never the headline.

What C5 got right and keeps: the three redundant ~2.1 MB parses, the byte-identical
`pass-minimal.yaml` double-parse, the clone-per-test pattern, and the daemon leak. What it got wrong
was the *attribution of the wall clock* to module evaluation.

**Fix 21's effort therefore goes to clone-once-and-reuse**, which addresses 96 % of the cost, with
the import-time parses as secondary hygiene. The directive's original framing (memory pressure from
`structuredClone`) and C5's revised framing (module evaluation) were **both** wrong; this is the
measured answer.

Recorded because the coordinator committed C5's hypothesis into the goal record as settled before
the measurement existed. The builder produced the measurement, contradicted itself, and reported it
— the second time in this round it has withdrawn its own claim when data disagreed. That behaviour
is worth more than the individual findings.

## C10 — baseline established, and the 504 claim was never broken

**The first complete, trustworthy run of this suite by anyone.** Machine verified quiesced, TAP
reporter, full untruncated output.

```
1..518
# tests 518   # pass 500   # fail 18   # cancelled 0   # skipped 0   # todo 0
# duration_ms 1426411.4822   (23.8 minutes)   EXIT=1   stderr 0 bytes
```

**Tripwire baseline, both halves:**

| Segment | Tests | Result |
|---|---|---|
| Five files other than `semantic-invariants` | 133 | 115 pass, 18 fail |
| `semantic-invariants.test.ts` | **385** | **385 pass, 0 fail** |
| **Total** | **518** | 500 pass, 18 fail |

After rework the five files must return to 133 passing and `semantic-invariants` must not fall
below 385. **Reducing test count to gain speed trips the tripwire**; where a performance change
costs coverage, coverage wins.

### CORRECTION: the 504 claim is satisfied, and the wrong number was the coordinator's

F9 and R15's closing note both recorded the spec's "504 tests" as an **unmet historical claim**.
That was wrong, and the error originated in the rework directive, not with the builder.

The measured suite is **518 tests**, so spec line 1085's "at least 504" **is satisfied**, and so is
line 1026's "at least 361". They are not contradictory — 361 is a floor and 504 a later, higher
floor, and both hold.

The wrong figure was the directive's **~330** estimate, which extrapolated from top-level `test(`
declarations and undercounted badly, because node counts nested subtests that a declaration count
cannot see. `semantic-invariants` alone yields 385.

**There is no broken spec claim to report.** F9's instruction to report 504 as unmet is withdrawn.

### `semantic-invariants` completed — first time observed

385 tests, all green, ~9.4 minutes, no output lost, stderr empty.

**No conclusion drawn about the historical deaths.** n=1, and Reviewer B ruled out the two
mechanisms contention would most obviously work through. The precise statement: on an idle machine
the file completes reliably and the historical `pass 0 / fail 1 / no output` signature did not
reproduce. Contention remains the leading hypothesis; it is **not established** and the question
stays open. What *is* established is why those runs were unreadable — node's per-file buffering —
and that is what fix 20 addresses.

### The 18 failures span two files, not one

17 in `corpus-sweep`, plus `CLI validate and sweep return exit 0 with machine-readable summaries` in
`schema-validation.test.ts`, which shells out to `sweep --repo-root ../../..` against the real
corpus and fails for the identical reason. One root cause, two affected files.

### Final timing attribution

| | |
|---|---|
| Total wall clock | 1428 s |
| Sum of all test bodies | 1388.1 s (**97.2 %**) |
| Module evaluation + overhead | ~40 s (**2.8 %**) |
| `corpus-sweep` | 795.9 s — 55.7 %, 107 tests |
| `semantic-invariants` | 561.6 s — 39.3 %, 385 tests (~1.46 s/test) |
| `semantic-invariants` own module eval | **~1.4 s** |

**This splits fix 21 in two, and vindicates the directive's original framing for one of them:**

- **`corpus-sweep`** — filesystem and process work in test *bodies*: 48 git clones plus 50
  temp-corpus cycles, 77 tests over 5 s, worst 22.4 s. The memory framing does not apply here at
  all. Clone-once-and-reuse plus `-c core.fsmonitor=false`. **This is where fix 21's effort goes.**
- **`semantic-invariants`** — roughly the directive's *original* `structuredClone` +
  `validateRegistry` diagnosis, at ~1.46 s/test. Fix 15's smaller fixtures should help as a side
  effect; not to be chased further.

The "three ~2.1 MB parses are a major cost" claim is **withdrawn entirely** — the `yaml` parser is
far faster than either the builder or the coordinator assumed. Worth doing as hygiene, nothing more.

## C11 — the daemon leak, cleared

With the machine verified idle: **81 git processes stopped, 891 threads and 667.5 MB reclaimed.**
Both worktrees healthy afterwards; the builder's three modified files intact and uncommitted; the
user-owned `routing-policy.yaml` change untouched.

Cleanup was deliberately sequenced *after* the builder's baseline run rather than before, so no
measurement was contaminated by it — the mistake recorded in C4, not repeated.

The leak is still fixed at source in the rework (`-c core.fsmonitor=false` plus
clone-once-and-reuse); this cleanup only clears the five-day accumulation.

## C12 — BLOCKER 2 substantially closed, and a latent generator bug nobody was looking for

Builder regenerated against the advanced snapshot: `validate` exits 0 — valid, 0 violations, 18
sources, 1523 items (was 1510), 466 rules. `sweep` fell from 26 violations to 2, both of which
required coordinator rulings (below).

### The latent R11 identity bug — the round's most valuable incidental find

16 of the 25 violations came from **four item IDs each issued twice** (4 `LOCATOR_DUPLICATE` + 4
`RULE_DUPLICATE` + 4 `RULE_SEMANTICS_UNCURATED` + 4 digest mismatches).

**Cause:** the R11 legacy-ID reconstruction matched prior inventory items to current Markdown blocks
**by `lineHint`**. Amendment A1 inserted D21, the §4.1 ledger and scenario 14 into the charter and
rewrote the loop directive's ownership and state blocks — so line numbers moved, and the matcher
handed a prior item's identity to an unrelated **new** block. Concretely, `item.4910b2a0a7a3` was
claimed by both the new `integration scenarios:list-item:14` and the existing
`goal exit criterion:list-item:7`.

**Latent since R11.** It could only surface when a bound source's line numbering changed, and A1 was
the first change that moved line numbers. It sat in code both adversarial reviewers read.

**Fix:** the R13 map is anchor-keyed and position-independent, so it becomes authoritative and is
built first; every identity it issues is reserved; the `lineHint` matcher then fills only anchors
R13 does not cover, and only with identities not already reserved. Position-independent identity is
the entire point of anchoring — the bug was that a position-dependent fallback could override it.

### Two further generator fixes

- **The snapshot could not simply advance.** The constant is embedded in the R1–R13 migration
  records as their own Git evidence, and those records are byte-frozen. Advancing it globally would
  have rewritten eleven historical records and broken the exact R1–R12 preservation the Required
  Tests mandate. Split into `SNAPSHOT` (frozen, `51857a3`, historical records only) and
  `CURRENT_SNAPSHOT` (live). Twelve assertions that compared historical records against the *live*
  `sourceSnapshotCommit` now compare against a legacy constant — **otherwise every historical record
  fails the moment the baseline legitimately advances, which is the very advance the chain exists to
  record.** A design that breaks on its own intended use is a defect whether or not anyone has hit it.
- The frozen `missing-provenance-reference` record: same class, same fix.

## C13 — Ruling 1: D21 becomes two rules

| Element | Ruling |
|---|---|
| Classification (budget) | `post-action-detection` — D21 says "Exceeding a budget is a recorded obligation, not a refusal." A refusal class would claim enforcement that does not exist. |
| Identity | subject `kernel.decision-latency-budget`, claim `decision-path-latency-is-budgeted-and-measured` |
| Applicability host | **`any`** — D21 binds "the kernel's decision path" generally; only its *measurement* is D20-scoped. Narrowing to `claude-windows-docker-loaded` would make a provider-neutral query return no applicable authority, misrepresenting the obligation. Here narrowing would be the distortion, not the discipline. |
| One rule or two | **Two** |

**Rule 2** covers the caching clause (a stale-bound cache entry produces `STATE_REVISION_STALE`
rather than a stale ALLOW). That is genuinely a refusal, and publishing it under a detection
classification would *under*-describe it — in this parcel the same sin as overclaiming.

**But rule 2 must not be classified as a current refusal.** AC8 is direct precedent, not analogy:
"current lack of an Allowed Files body compiler is recorded as a gap owned by FK-P2, not
misclassified as a current refusal." No kernel exists, so the same treatment applies — an obligation
owned by FK-P1/FK-P12, using whatever mechanism the registry already uses for the FK-P2 gap.

The hard-deadline clause stays with rule 1 as decision semantics unless it needs distinct semantics.

## C14 — Ruling 2: the ledger fixed at source, by the coordinator

The last violation was `LOCATOR_DUPLICATE` on §4.1. Markdown table rows anchor on their **first
cell**; the ledger's first column was Date; two rows share `2026-08-31`. Two blocks claimed one
anchor and the registry could not represent both.

The builder enumerated four options and **each of the three available to it broke something
ratified**:

| Option | Cost |
|---|---|
| (A) occurrence ordinal | Makes two identical rows distinguishable — disables R13's required duplicate-row control and the no-text-only-bypass control. Trades a real anti-bypass invariant for a cosmetic fix. |
| (B) key on first two cells | Re-anchors every table row in the corpus; invalidates frozen identities wholesale. |
| (C) rows as provenance | Does not clear the violation — the collision happens at *discovery*, regardless of disposition. |
| **(D) fix the charter** | Fixes the cause. **Forbidden to the builder; the coordinator's file.** |

**Taken: (D) + (C).** Charter amendment **A1.9** (`7e7dc7d`), committed alone before the
regeneration depending on it: §4.1 gains a leading `Entry` column with stable ids L1–L3 and one
sentence fixing their semantics. Every existing cell preserved verbatim; no row added, removed,
reordered or reworded; the binding set untouched. New charter sha
`151a5a7cb5f6e92d7780f3ef27af5599e7ba7e7f4a9ef3e91acf8d27dd753f65`.

(C) adopted alongside: the ledger's **rows are provenance** records of ratification events; §4.1's
**prose carries the operative rules**.

Note for the developer: §4.1 was installed by A1.8, whose text has never been developer-reviewed and
which carries its own known self-reference defect. A1.9 improves a draft that is **not yet in
force**; it does not ratify A1.8.

### The finding worth more than the fix

**A governed document whose table cannot be uniquely keyed cannot be bound row-by-row by any
registry.** That is a constraint on how canon documents must be written if they are to be
digest-bound, and it holds independently of FK-P0. Carried to the lessons ledger at Stage F.

### Standing commitment extended

The coordinator already undertook not to touch `loop-directive.md` between regeneration and merge.
That now extends to `charter.md` and **every one of the eighteen bound sources**: no further edits
until the regenerated registry is committed, and if something forces one, the builder is told before
rather than after.

## C15 — CORRECTION to C9/C10: fix 21's root cause is git subprocess spawn, not clones

Third correction to this one question, and the third time the coordinator wrote a hypothesis into
the goal record before a measurement existed. Settled by CPU profile.

| Measurement | Value |
|---|---|
| `validateRegistry` | 82–129 ms — matches both reviewers |
| `git clone` | ~340 ms → 48 clones ≈ **16 s**, not 795 s |
| **`sweepRegistrySources`** | **~10,500 ms per call → 62 calls ≈ 651–930 s** |

`corpus-sweep`'s entire 795 s is `sweepRegistrySources`. A CPU profile attributes **98.6 % of one
sweep to idle time blocked on `spawn`**. The sweep shells out to git roughly **87 times per call** —
two per source snapshot commit (18 sources), two per reconciliation git-commit evidence ref (25
refs), plus the worktree probe and the missing-path check. On Windows each spawn costs on the order
of 100 ms; 87 × ~120 ms ≈ 10.4 s, matching the measured 10.5 s almost exactly.

### The scoreboard on this one question

| Hypothesis | Source | Verdict |
|---|---|---|
| `structuredClone` memory pressure | Rework directive (coordinator) | Wrong for `corpus-sweep` |
| Module evaluation | Builder | Wrong — 2.8 % |
| **Git clone cost** | **Builder, adopted by the coordinator into C9/C10 as settled** | **Wrong — ~16 s of 795 s** |
| Git subprocess spawn inside `sweepRegistrySources` | Builder, CPU profile | **Right — essentially all of it** |

Three plausible hypotheses, three wrong, and only the profile settled it. Each correction came from
a measurement rather than a better guess. The standing lesson is the coordinator's own: **passing is
not evidence, and neither is a mechanism that sounds right.**

C9's instruction to spend fix 21's effort on clone-once-and-reuse is **withdrawn**.

### The fix, and its honest limit

Git invocations memoised by repository root plus exact argument vector. Sound because the answers
are immutable within a process — a Git object's type and content are fixed by its sha, and a
directory's worktree root does not change. Failures are cached too. Keying on the root means the
copied-corpus and missing-git-metadata tests, which sweep different roots, are unaffected.

**Measured: repeat sweeps 10.5 s → ~4–5 s.**

**Stated limit:** most `corpus-sweep` tests clone a *fresh* temp root, and a fresh root is a fresh
cache key, so those still pay full spawn cost. Making the cache fully effective would require the
temp-root tests to share one clone — a real refactor with residue risk for the tests that rename and
symlink inside their root. **Not done.** Fix 21 will be reported partially closed with the achieved
runtime, not claimed closed.

**A soundness trap the builder declined:** keying the cache on the git ref alone would have made
every test fast and would have let one repository's answer satisfy a query about a different
repository. **No current test would have caught it** — which is precisely why it was refused.

## C16 — fix 20 shipped inert, and the builder caught it before claiming it

The first implementation used a top-level `afterEach` writing to `process.stderr`. It typechecked,
it read correctly, and it produced **zero output**. Four controlled probes, in order:

1. top-level `afterEach` — does not fire for top-level tests at all. Zero markers.
2. marker in a `finally` wrapper — fires, but still zero output: node's runner intercepts
   `process.stderr` to attribute output to tests.
3. raw `writeSync(2, …)` bypassing the stream object — also intercepted. Zero output.
4. `appendFileSync` to a file in the OS temp directory — **works**, and captured the failing test as
   well as the passing one.

Shipped implementation appends to `os.tmpdir()/fk-p0-progress-<file>.log`. **Coordinator-verified**
it writes to `tmpdir()` and never into the package, so no unlisted file is created and Allowed Files
is not widened.

**This is the round's failure mode in miniature, and it very nearly landed.** A plausible mechanism,
coordinator-approved, would have been reported "fix 20 closed", and would have delivered nothing —
in a fix whose entire purpose is making failures visible. Only the probe caught it.

Note the compounding: the coordinator's *original* fix-20 remedy (switch to TAP) was already proven
non-working; this was the *second* remedy for the same fix to fail on contact with reality. Both
were caught by probe rather than by reasoning.

## C17 — further items closed, with two more staleness instances materialised in code

- **D21 curated as two rules** per C13. `latency-budget` post-action-detection; `cache-revision-binding`
  `unsupported`. The compound-rule path hardcoded `pre-action-refusal` for *every* compound rule, so
  the classification was parameterised rather than hand-carving an exception — the right call, since
  a hand-carved exception is defect class #7. Both normalized statements are exact contiguous
  substrings of the D21 row, sliced programmatically from the generated excerpt so they cannot drift.
- **The D-row enumeration was hardcoded `D1..D20`** — the F6 staleness, materialised in code rather
  than merely in prose. D21 was discovered by the sweep and then *silently not inventoried*. Raised
  to 21, with a comment that it must be raised when a new decision is ratified and that the sweep
  fails until it is.
- **Integration scenario 14 existed as an inventory item but was excluded** (`ruleIds: []`), so
  R15's "all fourteen published" was **not** satisfied by regeneration alone. Curated to match
  scenario 13's shape. R15 would otherwise have been nominally applied and substantively unmet.
- **Fix 17 (NTFS alternate data streams):** all four shapes were already refused, but only
  *incidentally*, by failing to resolve — and `charter.md::$DATA` resolved far enough to reach
  locator checks, meaning stream syntax was admitted by the path model. `pathProblem` now rejects any
  interior colon, so they are refused **by policy**. Six independently named controls.

### Builder-reported mistake, recorded

While repairing a botched edit the builder ran `git checkout --` on both test files, reverting them
to the last commit and silently discarding the fix 12/13/14/17 tests appended since. Noticed within
a minute; all restored from working notes; typecheck and lint re-verified. Nothing lost.

This is the lesson-#17 class — a destructive step riding alongside ordinary work — and it is
recorded because the builder self-reported it unprompted rather than letting a gap be found later.

## C18 — AC1 verified commit by commit; AC6 re-verified; R18 settles the fixture deletion

### AC1 — coordinator-verified, matches the builder's report exactly

| Commit | Files | Outside `authority-registry/` |
|---|---|---|
| `496af2d` | 5 | **0** |
| `ef29335` | 13 | **0** |
| `40394be` | 17 | **0** |
| `77d3609` | 1 | **0** |
| `0ad7ee3` | 1 | **0** |

The only two files outside the package in a naive `34f576e..HEAD` diff are `7e7dc7d` (A1.9) and
`3a74f4e` (R17) — **both coordinator-authored**, which is exactly the case AC1's carve-out
anticipates. Coordinator cumulative figure 21 files / +2,882 / −280,325 against the builder's 19 /
+2,866 / −280,318; the difference is precisely those two files.

### R18 — the deleted fixtures are not a scope violation

Fix 15 deleted the seven reject fixtures and now generates them at test time into `tmpdir()`, per
the coordinator's F8(c-2) direction: ~280,000 lines removed, the drift channel closed outright, and
named-code assertions now running at **both** the direct and CLI layers. **Coordinator-verified** —
`pass-minimal.yaml` remains ~2.1 MB exactly as predicted (corpus-exact predicates make a genuinely
minimal positive fixture unreachable), the rejects are built by `rejectDocument(mutate)` and cleaned
up, and both layers assert the specific code.

That leaves 7 of the 28 Allowed Files nonexistent, which a reviewer would reasonably flag.
**Amendment R18** (`63fe955`) settles it: the Allowed Files list is a **permission ceiling** bounding
which paths may be created, edited, moved or deleted — **not a manifest** obliging any listed path to
exist. AC11 is satisfied by behaviour, not by a file's presence on disk.

The builder stated this plainly and asked for it on the record rather than letting it be discovered.

### AC6 — re-verified against the regenerated registry, 7/7 refused

Classification counts, **counted independently by the coordinator**:

| Classification | Count |
|---|---|
| `pre-action-refusal` | 254 |
| `narrative-provenance` | 100 |
| `ci-static-check` | 78 |
| `independent-review-human-judgment` | 15 |
| `unsupported` | 13 |
| `post-action-detection` | 9 |
| **Total** | **469** |

Sums exactly, and the deltas reconcile to the curation — D21's two rules (`post-action-detection`
8→9, `unsupported` 12→13) and integration scenario 14 (`ci-static-check` 77→78), total 466→469.

**The near-miss is the instructive half.** The missing-evidence probe initially read as ALLOWED. The
builder chased it rather than filing it, and found the probe had set `gate1` to its **shipped**
value — a no-op that reads as "allowed" to anyone not looking closely. A false positive against the
operation matrix would have been expensive: it is the strongest part of this package and both
reviewers vouched for it independently.

## C19 — the builder introduced, and caught, an instance of the defect it had just fixed

`verifyMigrationChain` was being called **twice** per `validateRegistry` — once to identify the chain
head, again to collect its violations — each recomputing the manifest over 18 sources, 1,525 items
and 469 rules, on the path `resolveAuthority` invokes per query. **Precisely fix 16's defect class,
introduced while closing BLOCKER 1.** Fixed in `0ad7ee3`; behaviour unchanged, since the second call
returned violations the first had already computed.

**How it was found is the point:** not by re-reading the code, but by chasing a number that looked
wrong — five-axis applicability tests at ~66 s against a ~25 s baseline. That is the strongest
argument this round has produced for keeping per-test timing visible, and it retroactively justifies
what fix 20 cost.

## C20 — the performance claim withheld, correctly

The builder declined to report a speedup because its own measurements were untrustworthy: two runs
of one micro-benchmark on an idle machine gave `validateRegistry` 73 ms / `resolveAuthority` 69.6 ms,
then 252 ms / 256.9 ms — a **3.5× spread**, and in the first run `resolveAuthority` measured *faster
than the `validateRegistry` it internally calls*, which is impossible and indicates the harness was
measuring GC and JIT state.

**Ratified.** Suite wall clock against the 23.8-minute baseline is the only figure reported.
Reviewer A's 133 ms stands as the recorded per-query number; whether this parcel moved it is
**unestablished**; D21's budget remains FK-P1's forward risk either way.

This is the third time the builder has withheld or withdrawn a claim its own data would not support
— after the module-evaluation and git-clone attributions. Handing the coordinator no number is worth
more than a number neither party can defend.

## C21 — an apparent per-query regression, a reverted cache, and one probe outstanding

### What the builder measured

`resolveAuthority` under sustained **distinct**-query load: ~250–282 ms/call, against a baseline
implying ~62–79 ms. Roughly 4×. The five-axis applicability tests take ~100 s each against ~25 s.

Three independent routes to the number: cross-product arithmetic (~360–400 queries per test,
100 s / 400 ≈ 250 ms); a standalone 168-query probe measuring 282 ms/call; and the same test taking
102 s on a **contended** machine and 102 s on a **quiet** one — which disproves contention cleanly.
The builder checked contention specifically because its own probes had polluted an earlier run, and
withdrew its own prior "looks environmental" framing on that evidence.

**Ruled out:** `validateRegistry` (81.3 ms vs Reviewer A's 79 ms warm — unchanged);
`registryBindingManifestDigest` (11.6 ms, and called exactly **once** per validation now, call sites
verified); the duplicate chain walk (fixed in `0ad7ee3`); module evaluation; clones; memory.

Signature is allocation pressure on the distinct-query path — repeated same-query calls optimise to
~69 ms, distinct queries do not. Root cause **not** established, and the builder declined to guess a
fourth time.

### The reverted cache — ratified, and the reasoning adopted as a standing rule

The builder memoised the chain walk's JSON parsing of command-result evidence, keyed by reference
text. It worked: 282 ms → 251 ms, an 11 % gain, no staleness risk. It then recognised it had added a
cache **on exactly the per-query path the directive fenced off**, without ratification, and reverted
it.

Its stated reasoning is adopted as a standing rule for this goal: *"it was only 11 % and it was safe"
is precisely the reasoning that erodes a scope boundary.* Reporting a reverted change the coordinator
would never otherwise have seen is worth more than quietly keeping a helpful one.

### The confound the coordinator will not record around — one probe outstanding

The comparison is baseline ~62–79 ms/query against current ~250–282 ms/query. Two things could make
that wrong:

1. **JIT/measurement conditions.** Repeated same-query calls optimise to ~69 ms while distinct
   queries do not, and `validateRegistry`'s 81.3 ms is almost certainly a repeated-call figure —
   `resolveAuthority` calls it internally and cannot be cheaper than it. Yet the baseline arithmetic
   yields ~62 ms, *less* than `validateRegistry`'s own cost. **That is the same impossibility the
   builder correctly used one message earlier to condemn its own micro-benchmark — and it sits inside
   the baseline half of this comparison.**
2. **Changed query counts.** The applicability tests are not byte-identical to baseline; fix 8 added
   `reasonCode` assertions in that neighbourhood.

So the live possibilities are (i) a genuine ~4× regression, (ii) a measurement-condition artifact,
(iii) a changed query count.

**Probe ordered:** run the identical 168-query distinct cross-product harness, unchanged, against the
**pre-rework** tree in a scratch clone, same machine, quiet, back to back with the current tree.
Identical harness and query set, only the code differing. That separates (i) from (ii) outright, and
counting queries in both settles (iii). To run **after** the authoritative `semantic-invariants` run,
never contending with it.

### Disposition — the same either way, but the wording is not

**Not fixed in FK-P0.** The directive's fence stands, and the builder's instinct is right that root
cause must precede another cache.

**Not a Gate 3 blocker on correctness grounds.** Nothing fails, nothing is misasserted, the
applicability tests still assert exactly what they assert. It is a suite-runtime and forward-risk item.

But what gets handed to FK-P1 differs materially:

- **If genuine:** a regression *this parcel introduced*, recorded as such and **not laundered into
  Reviewer A's pre-existing S6 forward risk**. It compounds D21 exposure — further from p95 ≤ 20 ms,
  not closer — and FK-P1 inherits a known *regression*, not merely a known cost.
- **If an artifact:** the honest record is that per-query cost is **unestablished**, and that both the
  133 ms and the 250–282 ms figures were taken under conditions that do not support the comparison.

## C22 — five of six files complete and green

| | Baseline | Post-rework |
|---|---|---|
| bare-specifier, corpus-sweep, dependency-allowlist, parity, schema-validation | 133 tests, **18 failures** | **141 tests, 0 failures** |

Every one of the 18 failures closed, and the count rose by 8. That half of the tripwire is satisfied
with room. `semantic-invariants` still running on a quiet machine; the builder declines to report a
count it has not seen.

## C23 — CORRECTION: the coordinator killed the builder's run, and mischaracterised it

**The record said `semantic-invariants` "stalled in `hard-rule-10`". It did not. The coordinator
terminated it.**

Established by the builder from its own side: the run died at **10:30:27 with `EXIT=127`** after 23
minutes, having emitted only the TAP header. **Thirteen seconds later, at 10:30:40**, the coordinator
started `npm test` in the same worktree. The broad node kill followed by a fresh run explains both
the exit code and the vanished progress log.

### What the coordinator actually knew, and where it went wrong

Observed: the process at 24:52 elapsed; the fix-20 progress log last written at 10:23, seven minutes
earlier, at 169 tests. Inferred: it was stalled.

**"Stalled" was the builder's word from an earlier report, repeated by the coordinator as though
verified. It was not verified.** Seven minutes of silence in a file whose slowest test had a 218 s
baseline — and a measured ~4× per-query cost — is entirely consistent with *working*. The coordinator
had the arithmetic to know that and did not do it.

**What was correct:** the run's stdout genuinely was unrecoverable. Its agent had exited, and the
per-file runner uses `stdio: 'inherit'` to a parent that no longer existed, so it could never have
produced the pass/fail count AC13 needs. A captured re-run was necessary.

**What was wrong:** killing it without telling the builder first. After C4 — where killing processes
to "clear the machine" woke both reviewers and corrupted the builder's control run — the coordinator
had a standing practice of coordinating process management, and broke it. The builder had to
reconstruct from an exit code what it should have been told.

**Cost:** 23 minutes of compute and one avoidable correction. No evidence lost that was not already
lost, and no finding changes.

### The builder's judgment on being killed

It declined to start a competing run, on the grounds that doing so would recreate exactly the
contention it flagged at Step 0 and spent the session controlling for. That is the right call and it
is the same discipline it applied when it reverted the fenced cache.

### Net position, unchanged

- Committed `0ad7ee3`; tree clean; all five builder commits confined to the package.
- **141/141 green** across five of six files (baseline 133 with 18 failures — all closed, count up 8),
  plus `tsc` 0, `biome` 0, `validate` exit 0, `sweep` exit 0 at 18 sources / 1525 items / 469 rules.
- `semantic-invariants`: **169 passed, 0 failures, terminated before completion.**
- The full-suite count remains the single unestablished item. The coordinator's captured run is in
  flight and its result — not the builder's — closes AC13.

## C24 — a post-rework adversarial review is required before Gate 3

Both prior reviewers examined `df8155a`. **Everything they found has since been reworked, and the
central mechanism they reviewed — the whole-corpus manifest pin — has been replaced** by a
genesis-anchored migration chain that is now the package's entire anti-tamper surface.

That chain was **designed by the builder, hardened by the coordinator, and then ratified by that same
coordinator** as R16/R17. No independent party has ever examined it.

**A `risk: critical` parcel must not merge with its core security mechanism reviewed only by the two
people who built it.** AC15 requires two independent fresh reviews returning no unresolved blocker;
those reviews were of code that no longer exists in its reviewed form.

Mandate committed at `plugins/foreman-line/docs/kickstarters/foreman-kernel-review-FK-P0-postrework.md`.
Priority 1 is the chain — forging a head with less than a well-formed chained record, breaking each
of the four topology guards independently, attacking the head/historical boundary in both
directions, probing R17's `registry-rework-` scoping, checking whether decoupling twelve historical
assertions weakened any, and neutering `verifyMigrationChain` to establish whether it is load-bearing
at all. Priority 2 re-probes everything both prior reviewers vouched for, since the rework could have
broken it.

Explicitly excluded as findings so the round is spent on what is unexamined: the accepted
append-a-head limit, the deleted fixtures, `pass-minimal`'s size, per-query performance, and the
cleared daemons.

**Dispatch is held until the authoritative suite run completes** — reviewer scratch-copy probes spawn
node processes, and this round has already lost evidence to contention twice.

## C25 — the suite does not hang because it is slow; it hangs because a test FAILS

The authoritative run reached **289 of ~405** tests in `semantic-invariants.test.ts` by 11:04 and then
sat at **96 % CPU for 87 minutes** without advancing a single test. The coordinator did not guess this
time. It attached node's inspector to the live worker (`process._debugProcess`, then CDP
`Debugger.pause`) and took the stack:

```
at nextLineBreak / getLineInfo / pp$4.raise / pp$9.unexpected / parseExprAtomDefault …
at parseExpressionAt → parseCode → findColumn → findColumn → findColumn  (×10+)
```

That is `node:internal/assert/utils`. **A bare `assert.ok(expr)` had failed**, and node was
reconstructing the expression text by re-parsing the source with acorn — `findColumn` recursing and
re-parsing at each level. In a 3,000-line test file this does not terminate in any useful time.

**Two distinct defects, and they compound:**

**(a) A real test failure.** Test 290 —
`R10 coordinator Gate 2 prose is superseded by the R12 advisory non-grant`
(`tests/semantic-invariants.test.ts:2487`) — asserts the ADVISORY `narrative-provenance` rule
`rule.coordinator-pattern.91dd60b00fd6` is **absent** from `consideredRuleIds`. Reproduced standalone
against a pristine registry in under a second: the resolver returns `RESOLVED`, `considered = 4`, and
**the rule is present**.

**The spec settles which side is wrong, and it is the test.** AC5 as amended by **R14 — my own
amendment** — now reads: *"historical/generic rules remain visible and appear in `consideredRuleIds`
**without exception or hand-placed exclusion**"*. The test encodes the pre-R14 semantics it was
written under. The code is right.

This is the amendment-versus-test collision class I should have swept for when R14 landed. R14
changed an observable of the resolver, and I did not ask which existing assertions depended on the
old observable. The builder did not either. It landed in a file that cannot report its own failures.

**(b) The suite cannot report a failure in this file at all.** 274 `assert.ok(` calls in
`semantic-invariants.test.ts`, most without a message string. **Any** bare one that fails hangs the
runner instead of failing it — and because node buffers a file's reporter output until the file
completes, *all* results for the file are then lost. That is Lesson #32's shape inverted: not a test
that passes for the wrong reason, but a suite that cannot tell you it failed.

It also retroactively explains the observability hole that consumed most of this round. Fix 20 was
built to survive exactly this crash and it worked — the progress log is the only reason test 290 was
identifiable at all. Fix 20 has now paid for itself twice.

**Correction to C23, in my favour and I will state it anyway:** the builder's earlier run at test 169
was *not* this hang. 169/170 is inside the five-axis applicability block, and my run passed straight
through it to 289. That run was slow, exactly as C23 concluded. C23 stands unchanged.

**Disposition: REWORK ROUND 2.** Both defects are small, sharply bounded and test-only. The ratified
tripwire allows this owner two rework rounds; this is the second and last.

**Not merged, not green, and I will not represent it as either.** The five completed files stand at
141/141 (`1 + 113 + 1 + 5 + 21`, timings recovered from the captured TAP). `semantic-invariants` is
**unknown** — 289 started, at least one failed, ~115 never ran.

I killed the hung run at 12:35. It could not terminate; waiting longer was not a strategy. This was
my own run, no other party's work was in flight, and I am recording the kill rather than leaving it
to be inferred — which is the practice C23 says I broke.

## C26 — a census, so rework round 2 gets the whole list at once

Discovering these one at a time costs ~90 minutes per failure. Instead: a **throwaway** copy of the
package (`scratchpad/census/`, never committed, `node_modules` junctioned read-only) with
`assert.ok` shimmed to throw a plain `Error` — which bypasses node's message generator entirely and
converts every hang into a reported failure. Running the file end to end there yields the complete
failure list in one pass.

This is diagnosis, not a fix: it lands nowhere, and the builder owns the actual remedy. The
distinction matters — invariant D4 says the coordinator consumes verification rather than producing
it, and a scratch harness that never touches the parcel is instrumentation, not work product.

## C27 — the post-rework adversarial review is dispatched, two independent reviewers

Held since C24 to avoid contention; released now that the killed run has freed the machine. Both
carry the committed mandate verbatim, pinned to code commit `0ad7ee3` / branch HEAD `63fe955`, each
confined to its own scratch copy, both barred from running the full suite.

Both are told about (a) and (b) above and instructed **not** to report them — a review round is worth
spending on what nobody has examined, and the chain is that. They are pointed at the live question
those defects raise instead: **did R14's considered-rules change break anything in `src/`, rather
than only in tests?**

## C28 — the census: 405 tests, 395 pass, **10 fail**. And a claim I accepted that could never have been true.

The shimmed census copy ran the file end to end in 9 minutes and returned the whole list at once.

### The correction I owe first

C23 recorded `semantic-invariants`: **"169 passed, 0 failures, terminated before completion."** That
was the builder's figure and **I accepted it. It could not have been true, and I had the code in
front of me.** The fix-20 wrapper logs in a `finally`:

```ts
try { await fn() } finally { completedTests += 1; appendFileSync(progressLogPath, …) }
```

A **failing** test appends exactly like a passing one. The progress log counts *completions*; it
carries no pass/fail signal whatsoever. "169 passed, 0 failures" was a count of lines in a file that
does not record the thing being claimed — the precise wrong-shaped claim invariant D4 tells me to
treat as presumptively empty, and I let it through because it was the number I wanted.

The census settles it: **six of the ten failures occur before test 169.** That run was not 169-green.
It was 169-completed with six already failed. C23's other conclusions stand; this figure does not,
and every downstream statement of mine that leaned on it is withdrawn.

### The ten, triaged

**Class A — the ratified amendments moved, the tests did not. Code right, test stale. I rule these.**

| # | Line | What it asserts | Superseded by |
|---|---|---|---|
| 3 | `:186` | classification counts totalling **466** | D21 curation + integration scenario 14 (C17, R15). I counted **469** independently in C18 |
| 290 | `:2495` | an ADVISORY rule is **absent** from `consideredRuleIds` | **R14**'s AC5: such rules appear there "without exception or hand-placed exclusion" |
| 38 | `:709` | source-snapshot commit `7e7dc7d…` | **R16/R17** legacy decoupling; registry carries `51857a3a…` = `LEGACY_SOURCE_SNAPSHOT_COMMIT` |
| 107 | `:1397` | same | same |
| 146 | `:1526` | same | same |

Three of these five point at **my own amendments**. R14 changed an observable of the resolver and
R16/R17 changed which commit historical assertions bind to; in neither case did I ask which existing
assertions depended on the old answer. That question is now a standing obligation on every future
amendment in this goal.

The builder must still confirm, per assertion, that each of 38/107/146 is genuinely legacy-decoupled
rather than one that should still track live HEAD. It must not assume my ruling generalises.

**Class B — genuinely open. The builder determines which side is wrong; it does not assume the test is.**

- **#23 (`:400`)** — removing a reconciliation no longer yields `RECONCILIATION_MISSING`.
- **#104 (`:1328`)** — a test that deliberately calls `rechain()` to stay VALID gets
  `MIGRATION_EVIDENCE_INVALID` + `RULE_ORPHANED`. **`rechain()` is not broadly broken** — I checked,
  because if it were, every test using it would be inert in the Lesson-32 sense: 4 call sites, 3
  pass. This failure is specific to pushing a corroborating `sourceRef`, and the code may well be
  right to refuse it.
- **#360/361/362 (`:3311`)** — see below.

### #360–362: reproduced by me, against pristine code, and bounded

The test loops every `registry-rework-` record × {append, remove, duplicate, substitute} on
`observedEvidence` and requires `MIGRATION_EVIDENCE_INVALID`. I re-ran that matrix directly against
the worktree's `src/` and shipped registry — not against my census copy:

| Records | append | remove | duplicate | substitute |
|---|---|---|---|---|
| 11 historical (pinned) | OK | OK | OK | OK |
| **`registry-rework-df8155a` — the chain HEAD** | **none** | **none** | **none** | OK |

Zero violations of any kind. Exactly the record that R16 exempted from `RECONCILIATION_RECORD_DIGESTS`
and bound instead to the live manifest: its evidence *multiset* is unconstrained.

**Is it a bypass? No — I tested that rather than asserting it.** Escalating a rule `REFUSE → ALLOW`
and then attacking the head:

```
tamper only                 -> AUTHORITY_ESCALATION, MIGRATION_EVIDENCE_INVALID
tamper + head append        -> AUTHORITY_ESCALATION, MIGRATION_EVIDENCE_INVALID
tamper + head remove[0]     -> AUTHORITY_ESCALATION, MIGRATION_EVIDENCE_INVALID
tamper + head remove ALL    -> SCHEMA_INVALID
tamper + DELETE head record -> AUTHORITY_ESCALATION, MIGRATION_EVIDENCE_INVALID
```

No route laundered a tampered registry. So this is a **missing guard, not a hole** — the head accepts
noise in its evidence list that every historical record refuses. It is a SHOULD-FIX in `src/`, and
it is the first defect in this parcel that is in the code rather than the tests.

It also sits precisely where both post-rework reviewers are working (mandate Priority 1, items 1–3).
I am sending it to them as evidence, not as a verdict — it sharpens their question rather than
answering it.

### Why the builder is NOT dispatched yet

The tripwire allows this owner **two** rework rounds and this is the second. It has to carry the
complete list, so it waits for the reviewers rather than starting on a list I already know is
partial. The reviewers are inside the exact mechanism that produced #360–362; dispatching now would
also put a builder's commits under two reviewers pinned to `0ad7ee3`, which is the contention
mistake this round has already made twice.

## C29 — both reviewers returned REWORK REQUIRED, and both proved me wrong

Dispatched independently, same mandate, no contact. **Both verdicts: REWORK REQUIRED.** Both found
the R16 head exemption exploitable. **Neither found the route I had tested.**

| | route | reproduced by me |
|---|---|---|
| **Reviewer A** | `unshift` one shadow `superseding-binding-manifest-r14` onto the head's evidence; `chainLinkFor` uses `.find` and takes it | yes |
| **Reviewer B** | delete the head record; the previously pinned record is promoted into the exemption and out of its byte pin; repoint it at the live manifest | yes |

Reviewer A's payload is the one that matters: flip all seven `gate3.merge-authority` rules to
`historical-only` — **the rules asserting that merges are human-owned and nondelegated** — and
`resolveAuthority` goes from `RESOLVED / REFUSE / critical` to `REQUIRE_HUMAN` with no controlling
rules. `valid: true`, 0 violations, CLI exit 0. In a parcel whose entire purpose is representing
honestly where enforcement is real.

### My error, plainly

I wrote **"a missing guard, not a hole"** into C28 after running five attack variants and seeing all
five refused. **Both live routes are one step past where I stopped.** I had even run "tamper + delete
head record", seen it caught, and moved on — without taking the next step of repairing the promoted
head, which *is* the attack. A negative result at depth one is not a negative result, and I have spent
this round correcting other people for exactly that shape of reasoning.

The one thing I did right: I sent both reviewers the raw observation and **withheld my conclusion**,
specifically so it could not anchor them. That single decision is why this was caught. Had I sent
"I found no bypass" along with the matrix, I would have handed two reviewers a false floor.

**R16 is mine.** I designed that hardening and ratified it. The reason the hole was found at all is
that I dispatched a review of my own work instead of shipping it — which is the only part of this
worth generalising.

### Where the reviewers agreed, which is most of the signal

- **Chain topology is sound.** Between them: fork, cycle, orphan, zero-genesis-successor, malformed
  link, wrong-predecessor, duplicate head id, prefix-dodge rename, truncation, shadow record under a
  non-chain id — every construction refused, each with its own message. **The gap was never the
  topology. The head had no floor on its *content*.**
- **The chain is load-bearing but thin.** B's 17-mutation differential against a neutered build found
  exactly one axis where the chain is the sole detector: `snapshotEvidence.fullFileSha256`. A's found
  the silent-retirement case. Everything else has an independent detector. Thinness *raises* the cost
  of the blockers rather than lowering it.
- **AC6 holds completely.** A: all seven shapes. B: all eleven, plus a sweep of all 251 `REFUSE` rules
  individually with zero silent acceptances. **Both hit the no-op trap and both caught themselves** —
  A found three of its probes were setting shipped values. So did I, later, on my own exploit probe:
  my first run flipped **zero** rules and reported a clean bypass. I re-ran it after checking the
  field name actually existed. That trap has now caught the builder, both reviewers and me.
- **R14 did not leak into `src/`.** This was my question to them. Both: no hand-placed exclusion
  remains, `considered` is built from applicability alone, and **no other assertion in the package
  encodes pre-R14 semantics** — A checked all seventeen `consideredRuleIds` assertions individually.
  The one stale test is the owned one.
- **Both were blocked from running the suite**, independently, by defects in the package. See C30.

### Disposition

Amendments **R19** (chain head floor, four obligations on AC4) and **R20** (hermetic suite that can
report its own failures, AC13) ratified and committed alone, `957e901` and `8c23c29`, before any
dependent code, per SPEC-CONVENTION §11.

**Rework round 2 dispatched — the last this owner's tripwire allows.** If it does not land clean I
stop and hand the parcel to the developer as it stands. The mandate says so in those words, and tells
the builder to say at Step 0 if the list cannot be landed properly in one round so I can cut it
rather than let it rush. R16 was rushed hardening; that is not a lesson I need twice.

## C30 — two of this round's evidence corruptions were the package's fault, not mine

I recorded C4 and C23 as my process-management failures and charged them to myself. Reviewer B found
the mechanism, and part of it was never my judgment at all:

`tests/schema-validation.test.ts:211`, `tests/semantic-invariants.test.ts:45`,
`tests/corpus-sweep.test.ts:37` and both progress logs use **fixed, non-unique** paths in the OS temp
directory, truncated at import and `rmSync`-ed at teardown. Two concurrent runs race; whichever
finishes first deletes the other's fixture mid-test, producing `IO_ERROR` and exit 2 against an
`assert.equal(status, 1)`. `corpus-sweep` already uses `mkdtempSync` for its fixture roots. Nothing
else does.

And `src/generate.ts:458-479` runs two `execFileSync('git', …)` calls at **module scope**, which
`tests/corpus-sweep.test.ts:18` imports for one pure helper — so that file **cannot load outside a Git
worktree**. The standing instruction to reviewers is *never run tests in the parcel worktree, copy to
your own scratch*. For that file the instruction is **unsatisfiable**. Both reviewers reported,
independently, that they could not run the suite; every test-level claim in both reviews is source
reading rather than execution. AC15 asks for two independent fresh reviews and got two delivered with
an explicit, package-caused gap.

I do not get to hand C4 and C23 back — the kills were mine and C23's mischaracterisation was mine. But
"a concurrent run corrupts evidence" was a defect in the package the whole time, and I attributed it
entirely to my own judgment because the package gave me no way to see otherwise. Both are now R20
obligations rather than folklore about being careful.

## C31 — the Step 0 gate caught two coordinator errors before a line of code was written

The rework-2 builder stopped at Step 0 as instructed and pushed back on two of my rulings. **Both
pushbacks were right.** I verified every claim myself rather than accepting the report:

| claim | verified |
|---|---|
| `git-commit` entries satisfying `digest === sha256(reference)` | **0 of 25** |
| `source-ref` / `command-result` / `missing-path` | 51/51, 25/25, 1/1 |
| O6 (prior command `inputDigest` = sha256 of a same-record git ref) already holding | **12 of 12** |
| duplicate evidence entries across all reconciliations | **0** |
| head in `REQUIRED_REWORK_MIGRATIONS` | **no** |

**Error 1 — R19's obligation 4 invalidates the shipped registry.** "For every observed-evidence entry
of every kind, the recorded digest is the SHA-256 of the recorded reference." Three kinds already
comply; `git-commit` never has, because its digest attests the commit *object body*. Literal
compliance means regenerating and rewriting twelve entries of the pin table `generate.ts:45` says
"must NOT advance: rewriting it would rewrite history" — to satisfy a sentence I wrote. And the
builder's second point is one I had exactly backwards: literal-O4 is a **downgrade**. `sha256` of a
40-hex string proves nothing about a commit; the current digest at least attests the object body.

**This is the second time in this parcel I have ratified an amendment whose literal wording would
invalidate the shipped registry.** R16 did it and R17 corrected it. R19 did it and R21 corrects it.
Same round, same cause both times: a rule that sounded airtight, never evaluated against the artifact
it governs. That is precisely the failure this parcel exists to catch, committed by the person
writing the parcel's rules, twice.

**Error 2 — "BLOCKER 1 closes `:3311` ×3" was false.** The builder evaluated O1–O4 as predicates
against those exact mutated heads, with a guard asserting the evidence array actually changed. All
three mutations touch only `git-commit` entries: a duplicated one breaks no cardinality rule (O1
counts *chain commands*), a removed one leaves another 40-hex behind so the shape still passes, and
the pin rule does not apply to the head. **O1, O2 and O3 fire on none of them.** Two further
obligations were needed and both are free against the shipped artifact.

### The one that matters most

The builder will key "a pinned record is never the head" on **ID presence in the pin table, never on
byte-match**, because byte-match would let a tamperer mutate a pinned record *first* — breaking its
match — and then delete the head to promote it.

**That is the identical depth-one reasoning error I made in C28**, where I ran five attack variants,
saw them refused, and stopped one step short of both live routes. The difference is that this time it
was caught *before* the code existed rather than by two adversarial reviewers afterwards. That is what
the Step 0 restate-and-stop gate is for, and it has now paid for itself in a single use.

### Rulings issued

**R21 ratified and committed alone** (`ebc1dc5`), before any dependent code: obligation 4 replaced with
the principle rather than the mechanism — *every reference is bound by some digest computed over it,
and where it is not, that is stated rather than disguised as a check* — and obligation 5 added
(distinctness by kind + reference + digest). The self-comparison at `src/validate.ts:2688-2690` still
goes, regardless of kind; that is what R19 was actually reaching for.

`:400` split approved (required IDs → `RECONCILIATION_MISSING`, head → `MIGRATION_EVIDENCE_INVALID`);
adding the head to `REQUIRED_REWORK_MIGRATIONS` rejected, since breaking four `rechain()` tests to
satisfy one assertion is the wrong trade. `stale-source` fixture cut as the builder scoped it, keeping
the `identity-mutation` repair and the `CONFLICT` tautology replacement.

On the two `markdownIdentityProjectionForTesting` tests: **satisfy R20's letter and stop.** R20's
obligation is no repository I/O at *import* time, which is what actually blocked both reviewers — they
could not load the file at all. Injecting an empty frozen map would change what those tests assert,
and a weaker test bought with a spec technicality is not a fix. Document the residual by name so a
reviewer skips two named tests instead of a whole file. The builder flagged this rather than deciding
it, which is the correct instinct.
