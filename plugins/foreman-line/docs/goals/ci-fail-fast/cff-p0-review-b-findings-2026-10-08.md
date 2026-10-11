# CFF-P0 — Adversarial Review B (contract soundness + scope purity) — 2026-10-08

**Reviewer:** `cff_p0_review_b` (Reviewer B; independent, did not read Review A).
**Model:** `anthropic/claude-opus-5-5` (`PI_PROVIDER=anthropic`, `PI_MODEL=claude-opus-5-5`, matching the reviewer model policy).
**Directive:** `plugins/foreman-line/docs/kickstarters/foreman-line-review-CFF-P0-B.md`.
**Review worktree:** `/home/cmorgan76/Repos/foreman-line-cff-p0-review-b` (detached).
**Reviewed HEAD:** `git rev-parse HEAD` → `91480ae72f9c8cf8f9cb5ad2a6b259beffdb44a3`.
**Docs-only-on-top check:** `git log --oneline 500b8f54..HEAD` → one commit, `91480ae7` (review kickstarters A+B). `git diff-tree --name-only -r 91480ae7` → only `docs/kickstarters/foreman-line-review-CFF-P0-{A,B}.md`. **No non-docs commit sits on top. No stop.**
**Probe host:** linux, Node `v26.8.2` (pure source evaluation and JSON re-derivation only; no claim here is presented as a pinned-environment measurement).

## Verdict summary

| # | Severity | Finding | Verdict |
|---|---|---|---|
| B-1 | **BLOCKER** | Over-approximation-only is **asserted in prose, not structural**. There is no committed schema, and the artifact's own CFF-P2 consumption sentence can only be implemented as exclusion-by-absence. Concrete under-report counterexample: `approval` ← `receipts/**` through a `git diff` subprocess | FQ1 claim **REFUTED** |
| B-2 | **BLOCKER (stop condition fired, not reported as a stop)** | `reader_set_delta` is a **live merge-gate coverage hole**: CI-P1 reuse skips the sweep for those five paths today. The routing "per D10 → Stage-F" is not in D10, and nothing owns it: CFF-P1's spec has no READER_SET AC | Delta **CONFIRMED**; routing **REFUTED** |
| B-3 | MAJOR | CFF-P1 AC2 (literal reading) classifies the real P0 artifact as **malformed**, because per-package entries are arrays, not objects. AC2 also has no variance-edge element shape and no package-completeness check | **CONFIRMED** |
| B-4 | MAJOR | The dev-Windows environment is unmeasured, and the artifact says so only in a prose `status` string. `named_variance_edges: []` reads the same as "measured, none". AC5.3/`dev-pass-raw.json` is not delivered, so I dispute the AC5 completion claim | **CONFIRMED** |
| B-5 | MAJOR | FQ2: static claims in `cff-p0-c9-reproof.md` that the measured capture contradicts were not given the addendum treatment (kernel-import imports/reads; ops-console Markdown reads) | **CONFIRMED** |
| B-6 | MAJOR | FQ2: sweep anatomy §2(c) labels a run-created-based number as job-start latency (cycle 1, sweep (2): it is 1m45s from job start, not 2m35s). §2(e) is circular. AC1.2(a) per-package install cost is not measured | **CONFIRMED** |
| B-7 | MAJOR (overlaps A) | The probe's capture surface has unstated blind spots: `readdir*`, `cp*`/`copyFile*`, `access*`, `realpath*`, and non-Node subprocesses such as `git`. "What any check opens" overclaims | **CONFIRMED** from source of vehicle commit |
| B-8 | MINOR→MAJOR | Waiver §3.5 "reordering changes nothing a pin depends on" overreaches. The evaluator is order-independent, but the *inputs* to it can depend on execution order through shared state | **PLAUSIBLE** |
| B-9 | MINOR | Citation drift, internal contradictions, wrong AC cross-reference (itemized below) | **CONFIRMED** |
| — | — | FQ3 single capture → both projections; 30/27 gap; round-robin; four dead-waiver identities + three-axis pins; green-run evidence; AC5.6 classification; Allowed-Files purity | **CONFIRMED** |

**Disputed builder completion claims (explicit):**
- AC5 is not complete: AC5.3 (supplementary pass) and AC5.5 (`fixtures/dev-pass-raw.json`) are absent.
- AC5.4 is not met as stated ("the artifact's schema can express only positive coverage"): see B-1.
- AC1.2(a) is not met: per-package install cost was replaced by an aggregate bound.
- AC6.1/AC6.3 are only partially met: a static Linux sweep is labelled "measured", and contradicted claims were not corrected.
- AC5.8 should have fired (B-2).

---

## Step 0 — restatement (done before forming opinions)

Five mandated focus questions, in my words:
1. Can any AC (or the artifact) be read so that the *absence* of an edge excludes a package? Is "over-approximation-only" enforced by the artifact's shape, or only claimed in prose?
2. Does any coverage or timing claim rest on reading source or grepping instead of measuring? Is the Stage Zero grep anywhere used as evidence?
3. Could the two projections have come from two sweeps? Are both provably derived from one per-environment capture?
4. Is there any path, in prose or in bytes, by which P0 installs the pin, or invites a reader to treat P0 records as installed behavior?
5. Is every pinned number and artifact reproducible from committed commands plus committed fixtures?

**What exclusion-by-absence would look like if it existed.**
- A field that says "P is NOT affected by X" (an `excludes`/skip/negative-edge shape).
- Or, more insidiously, a positive-only edge list whose consumer computes `affected = {P : edges(P) ∩ changed ≠ ∅}` and skips the rest. Every package outside that set is then excluded by the *absence* of an edge. That second form needs no forbidden field at all.
- It would also look like an unmeasured environment or read class being indistinguishable from "measured, no edges".

---

## B-1 — FQ1: exclusion-by-absence (BLOCKER)

### 1a. No schema exists; "STRUCTURAL" is a string in the data
```
$ git grep -l "read-graph@1" HEAD
HEAD:plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json
HEAD:plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md
$ git grep -l "read-graph@1" feat/foreman-line-CFF-P1
  (kickstarters + CFF-P1 spec only)
```
- No JSON Schema or validator for `foreman-line-ci/read-graph@1` exists anywhere.
- The over-approximation claim lives in a top-level prose field: `"over_approximation_only": "STRUCTURAL: this schema can express ONLY positive coverage..."`.
- `packages[*]` and `projections.affection_pin[*]` are plain `string[]`.
- `named_variance_edges` is `[]`, with **no element shape defined** anywhere.

### 1b. Mutation probes
Probe: `/tmp/cffb-probe/probe.mjs` against a copy of `read-graph.json`, run with `node probe.mjs` → exit 0. I used three consumer readings:
- **R1:** CFF-P1 AC2, literal.
- **R2:** permissive deep key-scan for `/exclu|not.?affect/i`.
- **R3:** R2 plus a top-level key allowlist derived from the instance, since no schema exists to derive it from.

```
M0 original                                   | R1: MALFORMED(packages.approval is array, not object) | R2: ACCEPT | R3: ACCEPT
M1 inject top-level excludes                  | R1: MALFORMED(...array...)  | R2: MALFORMED(key excludes) | R3: MALFORMED(key excludes)
M2 inject renamed exclusion skip_when_untouched| R1: MALFORMED(...array...) | R2: ACCEPT | R3: MALFORMED(unknown top-level)
M3 nested projections.safe_to_skip            | R1: MALFORMED(...array...)  | R2: ACCEPT | R3: ACCEPT
M4 remove proven edge kernel-import<-kernel-state/migrations/0001 | R1: MALFORMED(...) | R2: ACCEPT | R3: ACCEPT
M5 variance edge {effect:'never-affects-on-linux'} | R1: MALFORMED(...) | R2: ACCEPT | R3: ACCEPT
M6 delete whole package entry (verification)  | R1: MALFORMED(...)  | R2: ACCEPT | R3: ACCEPT
M7 dev env status flipped to CAPTURED, no fixture | R1: MALFORMED(...) | R2: ACCEPT | R3: ACCEPT
```

What the probes show:
- **CFF-P1 AC2's "no excludes/not-affected field of any name or shape" cannot be implemented as written.** Name-scanning misses M2/M3. An allowlist catches only top-level M2. Without a committed schema there is nothing authoritative to allowlist against.
- M4 (edge removal) is undetectable by any structural check. Only re-deriving from the fixture catches it, and no committed re-derivation command exists (that is CFF-P3's future drift check).
- M5 is accepted, because variance edges have no defined shape.
- M6 is accepted, and CFF-P1 AC2 does not require comparing `packages` keys with `discoverPackages()`, so D7's "any uncovered package fails closed" has no contract hook.

### 1c. The artifact's own CFF-P2 sentence is exclusion-by-absence
Quoted: `criticality_grading.cff_p2`: *"a package runs unless this pin positively covers an edge proving it can be excluded."*
- An edge in this artifact proves a read, i.e. **affection**. No edge can "prove a package can be excluded".
- The only implementable reading of "pin positively covers package P" is "P's read set is measured complete, so P is skipped when the changed paths miss it". That is exclusion by absence of an edge.
- The artifact records no coverage domain: no per-path or per-package completeness claim, and no list of unobserved read classes. A consumer therefore cannot tell "complete" from "unobserved".
- (The tension originates in charter D7, which states both "absence never excludes" and "runs unless the pin positively covers it". P0 restated it without making it implementable.)

### 1d. Concrete under-report: the absence reading would let a real failure through
Source:
- `plugins/foreman-line/approval/tests/canonical-parity.test.ts:81` → `changedPathsSinceMergeBase(repoRoot, 'plugins/foreman-line/receipts')`.
- That helper is at `approval/tests/helpers.ts:42-54`: `execFileSync('git', ['diff', mergeBase, '--name-only', '--', pathSpec])`.
- The test fails on any changed `receipts/` path outside its allowlist.

The probe cannot see `git` (not a Node process). `affection_pin.approval` lists only `receipts/src/{index,paths,schemas,types,validator}.ts` plus one fixture. Demo (`/tmp/cffb-probe/p2demo.mjs`):
```
changed: [ 'plugins/foreman-line/receipts/tests/new-invariant.test.ts' ]
pin-affected: [ 'receipts' ]
approval included? false
```
A CFF-P2 consumer that excludes on this pin would skip `approval`, and CI would fail it.

**Required for disposition (coordinator):** either
- (a) commit a real schema plus a coverage-domain/unobserved-read-classes field, and rewrite the CFF-P2 sentence so exclusion requires a positive completeness claim; or
- (b) record that this pin is never sufficient to exclude in CFF-P2 without further measurement.

Either way, the "STRUCTURAL" wording must go.

## B-2 — `reader_set_delta`: correct data, wrong disposition (BLOCKER: stop condition)

### Reproduction
```
$ node -e "import('./scripts/ci-reuse.mjs').then(m=>{for(const p of [five paths + read-graph.json]) console.log(p,m.classifyPath(p),m.deltaFallbackReason(p))})"
.../w4-closeout/charter.md ordinary_documentation null
.../w4-closeout/loop-directive.md ordinary_documentation null
.../pi-model-configuration/charter.md ordinary_documentation null
.../pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md ordinary_documentation null
.../pi-model-configuration/a54-ratification-2026-09-26.md ordinary_documentation null
.../read-graph/read-graph.json code test-relevant-change
READER_SET 25            (exit 0)
```

Independent re-derivation: `classifyPath` over every path in `fixtures/ci-pass-raw.json` (`/tmp/cffb-delta.mjs`, exit 0) gives exactly those five ORDINARY reads, with the same readers. No case-shifted Windows path hides an additional one. **Projection 1 CONFIRMED.**

### Source check of each read
| Package | Test file (line) | What it reads | Effect of a docs edit |
|---|---|---|---|
| `ops-console` | `tests/live-goal.test.ts:35` `scanGoal(config,'w4-closeout')` → `src/scan.ts:195,201` | `readFileSync` of `loop-directive.md` and `charter.md` | Content edits can break the test |
| `routing-policy` | `tests/legacy-cutover.test.ts:526-534` | `readFileSync` of `pmc-p1-fallback-contract-2026-09-26.md`, parsing §5 | Content edits can break the test |
| `routing-policy` | `tests/host-settings-proposal.test.ts:261` | `existsSync(join(foremanRoot, ref.source))`, with sources from `src/host-settings-proposal.ts:106-107` (`charter`, `a54`) | Only deletion or rename breaks the test |

**All three CONFIRMED.**

### Why "safe direction" is the wrong label
- `computeTreeClassHashes` (`ci-reuse.mjs:382`) skips ORDINARY paths when hashing, and `deltaFallbackReason` returns `null` for them.
- So a PR whose delta is only these files is eligible for CI-P1 reuse **today**. It can merge on reused evidence without running the `ops-console`/`routing-policy` checks that read them.
- *Shrinking* READER_SET is the safe direction. The *current state* is a coverage hole in the merge gate.

This is the charter stop condition verbatim ("the relevance engine's coverage is found incomplete for a package class") and AC5.8 ("work stops and reports"). The records route it as bookkeeping instead of raising a stop.

### Routing claim
The records say: "the runner-touching parcel's Stage-F bookkeeping per D10, same routing as fallback loudness and pin staleness."
- D10 names waiver expiry, the cost-table re-pin, D7 pin maintenance (b) and cost-table loudness (c). **It does not mention READER_SET.**
- Fallback loudness is a CFF-P1 *AC surface* (D10(c)), not Stage-F bookkeeping.
- `git show feat/foreman-line-CFF-P1:.../CFF-P1-...md | grep -i reader_set` finds only "imported, never reimplemented" citations. **No AC installs the delta**, even though `scripts/ci-reuse.mjs` is in CFF-P1's Allowed Files.
- CFF-P1 AC6 additionally drops ORDINARY paths from proximity, so the hole carries into P1.

**Verdict:**
- P0 installing nothing is **compliant** (the Out of Scope list forbids `scripts/**` edits).
- Not raising a stop and citing D10 for an owner it does not name is **not compliant**. The finding is currently orphaned.

**Disposition needed:** a coordinator ruling that assigns the READER_SET shrink to a named parcel AC, or a fast-follow hotfix parcel, plus a decision on interim exposure.

## B-3 — P0 artifact vs. CFF-P1 AC2 contract (MAJOR)
- **Malformed by literal reading.** CFF-P1 AC2 says a pin is malformed if "per-package entries are not an object structurally capable of expressing only positive coverage". P0's entries are arrays (M0 under R1 above). P1 would permanently fail closed to today's order. That is safe for P1, but it is a silent no-op that defeats CFF-P1's purpose and would pass review unnoticed.
- **Which projection?** AC2 never says whether P1 consumes `packages[*]` or `projections.affection_pin[*]`.
- **Variance edges.** "Variance-marked edge" has no marking in the P0 schema.
- **Wrong cross-reference.** P1 cites "CFF-P0's own AC5.6 property" for positive-only coverage; that property is AC5.4 (AC5.6 is the classification safety property).
- **No package-completeness check** (see M6).

Reconcile the two contracts before P1 builds against either one.

## B-4 — Unmeasured environment indistinguishable from "no variance" (MAJOR)
- `environments[1].status` = `"NAMED PENDING INPUT — ..."`, which is free prose, not an enum.
- `named_variance_edges: []` reads the same as "measured, no local-only edges".
- AC5.4 requires that an uncovered environment fail closed. Nothing machine-readable lets a consumer detect that the dev environment, where CFF-P2 actually runs, is uncovered.
- M7 shows the status can be flipped to `CAPTURED` with no fixture and no structural check notices.
- The loop directive (charter branch) records the developer's statement that "my windows pc is reachable" and a designated `read-graph/dev-drop/`. The input is obtainable; it simply has not been consumed.
- **AC5.3 and AC5.5 (`dev-pass-raw.json`) are not delivered. I dispute the AC5 completion claim.**

## B-5 — FQ2: static claims contradicted by measurement, uncorrected (MAJOR)
The `cff-p0-c9-reproof.md` ops-console addendum is the honest pattern. It was not applied everywhere it is needed.

**kernel-import.** The record says "**no** test file imports anything outside `plugins/foreman-line/kernel-import/`".
- This is false. `kernel-import/tests/approvals.test.ts:48` and `src/{cursors,divergence,import-document,import,projection}.ts` import `@foreman-line/kernel-state`.
- The grep `grep -n "^import " ...` only sees the first line of multi-line imports, so it missed the `from` lines.
- The measured capture shows 26 external edges for kernel-import:
  - `kernel-state/src/*`
  - `kernel-state/migrations/000{1..5}-*.sql`
  - `kernel-lease/src/*`
  - `kernel-contracts/tests/fixtures/golden-vectors.json`
- The record has no addendum. (The Markdown-reader conclusion still holds: there are no `.md` reads in kernel-import's capture.)

**ops-console.** The record says "No check in `ops-console` reads real repository Markdown/README content".
- The measured capture shows ~40+ `plugins/foreman-line/docs/specs/active/*.md` reads plus root `docs/receipts/**`.
- The addendum corrects only w4-closeout. The specs reads are classification-neutral (`specifications`), but the sentence as written is false.

**Environment.** AC6.3 requires measurement "where the checks run". The record is a Linux static sweep that calls itself "measured". The cohort conclusions should cite the AC5 capture for all three packages, not just ops-console.

## B-6 — FQ2: sweep anatomy timing (MAJOR)
Reproduction:
```
$ gh api repos/m0r6aN/agent-skills/actions/runs/37661562241/jobs -q '.jobs[]|[.name,.conclusion,.started_at,.completed_at]|@tsv'
sweep (1) failure 2026-10-07T17:46:32Z 2026-10-07T18:17:02Z
sweep (2) failure 2026-10-07T17:46:32Z 2026-10-07T17:49:12Z
integration-report failure 2026-10-07T18:17:47Z 2026-10-07T18:17:50Z   (exit 0)
```

- **§2(c) mislabels a latency base.** The table is headed "job start → first red". For cycle 1, sweep (2): 17:46:32 → 17:48:17.02 is **1m45s**, not the tabled "+2m35s". The 2m35s is measured from run `createdAt` (17:45:42), which is §2(d)'s base. "Reproduces exactly" is achieved by mixing the two bases AC1.2(c)/(d) require to be kept separate. The other §2(c) rows do use job start correctly.
- **§2(e) is circular.** The 9m11s install bound was derived as 28m32s − 19m21s, and then "9m11s + 19m21s ≈ 28m32s, consistent with the measured total" is offered as corroboration.
- **§2(d) has an editing artifact:** "17:47:50 → actually 18:17:50".
- **AC1.2(a)** (install cost per package) is not measured. An aggregate upper bound is substituted, honestly labelled. That is an unmet AC, which needed a spec amendment or ruling rather than a silent substitution.

Verdict figures 32m08s / 25m49s / 26m20s: arithmetic re-checked for cycle 1 (18:17:50 − 17:45:42 = 32m08s). **CONFIRMED.**

## B-7 — Probe capture surface (MAJOR, overlaps Reviewer A)
Source check: `git show 2d81d926:tools/cff-p0-read-graph-probe.mjs | grep -n wrap(`.
- **Wrapped:** `readFileSync`, `readFile`, `openSync`, `open`, `existsSync`, `statSync`, `lstatSync`, `createReadStream`, `promises.{readFile,open,stat}`, plus CJS/ESM resolution.
- **Not wrapped:** `readdir*`, `cp*`/`copyFile*`, `access*`, `realpath*`, `opendir`, `watch`.
- **Invisible:** any non-Node child process (`git`, as in B-1d).

Users found by `grep -rnE "cpSync|copyFileSync"` include:
- `authority-registry/tests/corpus-sweep.test.ts:2178,2228,2234`
- `registration/tests/relocation.test.ts:31-32`
- `spec-linter/tests/cli.test.ts:487-499`
- `project-scaffold/tests/helpers.ts:71`

Also: attribution is by `cwd`, and 1,704 "unattributed" lines were dropped.

Neither `read-graph.json` nor `measurement-log.md` lists these unobserved read classes. That is exactly the coverage-domain information B-1 needs, and "what any check opens" overclaims.

## B-8 — Waiver contract D3 anchor (§3 order-independence) — CONFIRMED with an overreach (PLAUSIBLE)
Re-derived at `145da132` (`git log -1 --format=%H -- scripts/foreman-line-ci.mjs`). The script is byte-identical at HEAD (`git diff --quiet f9788222 HEAD -- scripts .github` → unchanged) and at `fb25630` (empty `git diff --stat fb25630 145da132 -- scripts/foreman-line-ci.mjs`).
- `sameSet` at :962; call sites :1047/:1089/:1108. **CONFIRMED.**
- The nine rejection layers sit at :701/:706/:720/:722/:726/:730/:736/:738/:744, with fallthrough `no-pin` at :758. **CONFIRMED.**
- Kind gate at :701. `failingTestNames` returns sorted at :664. Invoke concatenation at :882. `output_sha256` at :921 / :808 / :1107 (presence-only). **CONFIRMED.**
- Literal AC4.2 claim "all set comparisons go through `sameSet`": **not literally true**. `reconcile`'s `setMatch` (~:1093-1097) uses `every`/`includes`/`Set.has`. It is still order-insensitive, so the conclusion holds.
- **Overreach (PLAUSIBLE):** §3.5 says "reordering checks changes nothing a pin depends on". The *evaluator* is a pure function of one output string, but the *output* can depend on execution order through shared mutable state (working tree, git state, temp, ports). The source names one case: the `authority-registry` flaky members are "git-sensitive corpus tests" (`scripts/foreman-line-ci.mjs` comment in the `authority-registry` pin). CFF-P1 AC7's conformance test, built on this anchor, will not catch cross-package side-effect ordering. The anchor should say this.

## Dead-waiver identities (AC3) — CONFIRMED
```
$ node -e "import('./scripts/foreman-line-ci.mjs').then(m=>{for(const e of m.WAIVED_EXCLUSIONS)...})"   (exit 0)
bypass-outage-harness .../bypass-outage-harness/ test:m[FK-P17-bypass-outage-matrix.md,CHANNEL_EXEC_FAILED] t[3,3] fs3 | typecheck:m[mutationScope,TS2353] c{"error TS":2} t[0,0]
jev-decisions .../jev-decisions/ test:m[LEGACY_EXECUTION_RETIRED] t[6,6] fs6
kernel-lease .../kernel-lease/ test:m[] t[75,80] fs75 fl5 | lint:m[biome,Found 32 errors] c{"Found 32 errors":1} t[0,0]
authority-registry .../authority-registry/ test:m[R31 reviewed source mapping drift: M02-note] t[30,32] fs30 fl2
$ gh run download 37674775022 -R m0r6aN/agent-skills -p "shard-outcomes-*"   (exit 0)
shard-outcomes-0 head fb25630c… kernel-lease          all pass, waivers [], waiver_rejected {}
shard-outcomes-1 head fb25630c… authority-registry    all pass, waivers [], waiver_rejected {}
shard-outcomes-1 head fb25630c… jev-decisions         all pass, waivers [], waiver_rejected {}
shard-outcomes-2 head fb25630c… bypass-outage-harness all pass, waivers [], waiver_rejected {}
```
- The table matches source on all three axes (identity, location, value class).
- "No `lint` entry for bypass-outage-harness" is correct.
- Run-then-waive short-circuit is at :910 (`result.status === 'pass'`), not the cited :933-936.

## Other CONFIRMED items
- **AC2:** `discoverPackages` → 30; `COST_TABLE` → 27; unknown names are exactly `kernel-import`, `ops-console`, `project-scaffold`. The `costKnown` `.every` gate at :339-343 falls back to round-robin at :345-347, giving 8/8/7/7. This matches the vehicle run's own shard membership table.
- **FQ3:** `packages[*]` equals `fixtures/ci-pass-raw.json.packages` exactly. `affection_pin` re-derived by the stated own/external rule shows **0 mismatches** across 30 packages. The READER_SET delta re-derives from the same fixture. Both projections come from one fixture with `workflow_run_id 37768165017`. **CONFIRMED**, with the B-9 contradiction noted.
- **AC5.6:** `read-graph.json` → `code`, `test-relevant-change`. **CONFIRMED.**
- **AC2.3 / AC3.3 / AC5.7 routing sentences** for loudness, re-pin, expiry and pin maintenance match D10 text. **CONFIRMED.** (Only the READER_SET routing is wrong: B-2.)
- **The vehicle was ratified** ("ratify as ruled", loop directive on `chore/ci-fail-fast-charter` :149-151). It is therefore not an Allowed-Files violation.

## FQ4 — install purity
```
$ git diff main...HEAD --stat     → 26 files, including .claude-plugin/marketplace.json, plugins/foreman-line/{.claude-plugin,.codex-plugin}/plugin.json, CHANGELOG.md
$ git rev-parse main origin/main  → fb25630c… / 34bda521…  (local main is stale)
$ git log --oneline main..05d428e7 → 05d428e7 Merge PR #156, a00c706d release 0.2.0
$ git diff origin/main...HEAD --name-only | grep -E "^(scripts/|\.github/|\.claude-plugin|plugins/foreman-line/\.)"   → exit 1 (none)
$ git diff main...HEAD --name-only | grep -E "^(scripts/|\.github/)"   → exit 1 (none)
$ git diff --stat f9788222..HEAD  → only the 4 cff-p0-*.md records (Allowed Files), read-graph/{read-graph.json,measurement-log.md,fixtures/ci-pass-raw.json} (Allowed Files) + the 2 review kickstarters (paper trail)
```
- The manifest and CHANGELOG bytes come from PR #156 (already on `origin/main`), seen only because the local `main` ref is stale. **They are not parcel bytes.**
- No `scripts/**`, `.github/**`, or package-source byte is present. **CONFIRMED clean.**
- `docs/specs/INDEX.md` and `loop-directive.md` changes in the range come from coordinator promotion commits (`822aff84`, `f9788222`), not the builder.

**Prose invitation probe:** every record says "records only / installs nothing". **CONFIRMED.**

One PLAUSIBLE risk: `reader_set_delta.shrink_required: true`, combined with "owns the actual `READER_SET` edit", reads like a ready-to-apply, complete list. Given B-7's blind spots, a later parcel could apply these five paths as if ratified and complete, and skip its own measurement. The record should say the delta is a lower bound under the stated capture surface.

## FQ5 — reproducibility (brief; Reviewer A leads)
- **Fixture → projections:** reproducible by the prose rule (done above), but the derivation script is **not committed**.
- **Raw → fixture:** not reproducible from committed commands. The probe and workflow existed only on the deleted scratch branch. Commit `2d81d926` (`measured_at_commit`) survives only as an unreferenced object locally (`git cat-file -t 2d81d926` → `commit`) and by SHA on GitHub. The raw `.jsonl` is subject to 90-day artifact retention.
- Probe source should be preserved under an Allowed path, or by a ruling.

## B-9 — Minor itemization
- `read-graph.json` `environments[0].workflow_runs[0].outcome` says run `37764594545` "shards 1-3 captured cleanly **and are included below**". This contradicts `measurement-log.md` and the fixture header, which name run `37768165017` alone as the capture of record. Fix the wording, or disclose a cross-run merge, which would be a second pass over one environment (FQ3).
- Citation drift in records that claim "re-cited against this commit":
  - `assignment-and-waivers`: `costKnown` :335-340 (actual :339-343); round-robin :342-343 (:345-347); `outcomeRecord` :778-800 (:792); `buildShardOutcomes` :803-810 (:816); pass short-circuit :933-936 (:910).
  - `sweep-anatomy`: `for (const name of mine)` :1063 (:907); `invoke` :1058 (:882); round-robin :339-341 (:345-347).
- The `node_modules` filter claim conflicts with the retained entry `plugins/foreman-line/foreman-config/node_modules` (spec-linter).
- CFF-P1 AC2 → "AC5.6" should be "AC5.4" (reported here as cross-parcel; not a P0 defect).

## Throwaway artifacts (not committed)
`/tmp/cffb-probe/{probe.mjs,p2demo.mjs,orig.json}`, `/tmp/cffb-delta.mjs`, `/tmp/cffb-green/`, `/tmp/cffb-tree.txt`, `/tmp/cffb-dirs.txt`. Review worktree left detached at `91480ae7`, no commits.
