# CFF-P0 — Reviewer A findings (measurement integrity & provenance) — 2026-10-08

**Reviewer:** `cff_p0_review_a` (angle A: measurement integrity and provenance).
Directive: `plugins/foreman-line/docs/kickstarters/foreman-line-review-CFF-P0-A.md`.
**Reviewed tip:** `git rev-parse HEAD` in `/home/cmorgan76/Repos/foreman-line-cff-p0-review-a`
(detached from `feat/foreman-line-cff-p0`) = `91480ae72f9c8cf8f9cb5ad2a6b259beffdb44a3`.
**Reviewer host:** linux, Node `v26.8.2`. I used it only for pure-function re-runs
(`classifyPath`) and offline re-derivation over the downloaded Windows capture. No
number below is claimed as a Windows measurement unless it comes from run
`37768165017`'s own artifacts.
**Independence:** I did not read Reviewer B's findings. One `grep` over the goal
directory incidentally printed a single line from
`cff-p0-review-b-findings-2026-10-08.md` (a `git show … | grep -n wrap(` command
string). I read nothing else from that file, and none of what follows depends on it.

**Artifact digests under review (sha256):** full values in §Appendix.

---

## Verdict summary

| # | Probe / focus question | Verdict |
|---|---|---|
| P0 | Tip claim: only docs-only commits sit on `500b8f54` | **CONFIRMED** |
| P1 | Vehicle compliance (two files, additive-only, pinned workflow untouched, branch deleted, `8b49202a` docs-only) | **CONFIRMED** (with provenance defects F3, F7) |
| P2 | Filter arithmetic (stats block sums; 3,044 distinct pairs) | **CONFIRMED at sum / pair-set level; REFUTED as reproducible at line-bucket level** (F2) |
| P3 | Host honesty (v24.19.0 / win32 / x64 / Krypton, ×4 jobs, job IDs, durations) | **CONFIRMED** |
| FQ3 | Both projections derive from the single capture | **CONFIRMED** (wording defect F5) |
| FQ5 | Every pinned number/artifact reproducible from committed commands + fixtures | **REFUTED** (F2) |
| AC5.6 | Classification safety commands reproduce `code`/`code`/`ordinary_documentation`/`ordinary_documentation` | **CONFIRMED** |
| Coverage | Fixture reflects what *every check* opens (AC5.1) | **REFUTED** (F1, measured under-report in the CFF-P2 fail-open direction); F4 PLAUSIBLE |
| Mutation | Schema/validation refuses edge removal or exclusion semantics | **REFUTED**: nothing committed refuses either mutation (F6) |
| Freeze | Parcel diff touches no `scripts/**`, `.github/**`, or package source | **CONFIRMED** |

**I dispute the builder's AC5 completion claim.** F1 is a measured under-report that
the capture proved and the filter then discarded. F2 means the raw→fixture step,
which produced every pinned edge, cannot be reproduced from committed commands.
Either one alone fails AC5 (AC5.1 coverage and the spec's reproducibility constraint).

---

## P0 — Tip and freeze audit

```
$ git worktree add /home/cmorgan76/Repos/foreman-line-cff-p0-review-a feat/foreman-line-cff-p0 --detach
HEAD is now at 91480ae7 …
$ git rev-parse HEAD
91480ae72f9c8cf8f9cb5ad2a6b259beffdb44a3
$ git log --oneline 500b8f54..HEAD
91480ae7 docs(cff-p0): adversarial review kickstarters A (measurement integrity) + B (contract/scope) — two-review mandate
$ git diff --stat 500b8f54..HEAD
 .../kickstarters/foreman-line-review-CFF-P0-A.md | 87 +++
 .../kickstarters/foreman-line-review-CFF-P0-B.md | 92 +++
```
Only docs-only commits sit on top of the deliverable. **CONFIRMED.**

Freeze audit over the whole diff (`merge-base HEAD origin/main` = `14b2501a`):
`git diff --name-status 14b2501a HEAD` lists only `plugins/foreman-line/docs/**`
files. `git diff --stat 14b2501a HEAD -- scripts .github` prints nothing.
`git diff origin/main HEAD -- .github/workflows/foreman-line-ci.yml | wc -c` → `0`.
`git diff main HEAD -- .github/workflows/foreman-line-ci.yml | wc -c` → `0`.
**CONFIRMED.** Some changed files fall outside Allowed Files (kickstarters,
lint records, `loop-directive.md`, `specs/INDEX.md`, the shaping-result JSON). They
are coordinator paper trail, and Reviewer B's scope.

The measured code is the code under review. `git diff --stat 5af7f335 500b8f54 -- . ':!plugins/foreman-line/docs'`
is empty. `git diff --stat 5af7f335 origin/main -- plugins/foreman-line scripts ':!plugins/foreman-line/docs'`
touches only `scripts/validate-versions*.js`, which is outside the swept set. The pin
is therefore not stale against current `main`.

## P1 — Vehicle compliance

```
$ gh run view 37768165017 -R m0r6aN/agent-skills --json databaseId,headSha,headBranch,conclusion,event,workflowName,workflowDatabaseId,createdAt,jobs
  headSha 2d81d9264ba69df92e96fe331b227cc103eb3e8a · headBranch measure/cff-p0-read-graph · event push
  conclusion success · workflowName cff-p0-readgraph-measure (id 378344122)
  jobs: shard 2 113280807799 11:09:07→11:13:27 · shard 0 113280808126 11:09:09→11:28:38
        shard 3 113280808133 11:09:07→11:13:59 · shard 1 113280808138 11:09:08→11:39:00   (exit 0)
$ gh run view 37764594545 … 
  headSha 6388486a6615d2fe79a1ab8bc8aa39e987475ebc · conclusion failure · shard 0 job 113269011167 failure, shards 1–3 success (exit 0)
$ gh run view 37764594545 -R m0r6aN/agent-skills --log-failed | grep -n "RangeError\|##\[error\]"
  44: … Consolidate this shard's raw capture … RangeError: Invalid string length
```
The OOM narrative is **CONFIRMED** from the log.

The scratch branch's file set, computed from the commits (the objects are still local):
```
$ git diff --name-status 5af7f335…  6388486a6615…     → A .github/workflows/cff-p0-readgraph-measure.yml
                                                      A tools/cff-p0-read-graph-probe.mjs
$ git diff --name-status 6388486a6615… 2d81d926…       → M .github/workflows/cff-p0-readgraph-measure.yml
$ git diff --stat 5af7f335 2d81d926 -- .github/workflows/foreman-line-ci.yml scripts/   → (empty, exit 0)
$ git diff 6388486a… 2d81d926… | grep -E "NODE_OPTIONS|foreman-line-ci.mjs shard|probe|node-version|runs-on"  → (no hits; only the consolidate step changed)
```
Exactly two files, both additive. The pinned workflow and `scripts/**` are
byte-identical to base. The measured sweep step is the same in both runs.
`5af7f335` is an ancestor of the parcel tip (`git merge-base --is-ancestor` → 0).
**CONFIRMED.**

Deletion:
```
$ git ls-remote origin measure/cff-p0-read-graph      → (empty, exit 0)
$ git ls-remote --heads origin 'measure/*'            → (empty, exit 0)
$ git branch -a --list '*measure*'                    → (empty)
```
**CONFIRMED.**

Hygiene commit `8b49202a`:
```
$ git log -1 --format='%H %P %an %ad %s' 8b49202a
8b49202a0f3c9c04a2f1e77e59bc1a1b601b57f4 2d81d9264ba6… Clinton Morgan Thu Oct 8 07:10:00 2026 -0400 docs(specs): hygiene sync — …
$ git diff --name-status 2d81d926 8b49202a
M plugins/foreman-line/docs/specs/INDEX.md   + 5× D plugins/foreman-line/docs/specs/active/*.md
```
The SHA exists, its parent is `2d81d926`, and it touches only `docs/specs/**`.
**CONFIRMED.** One observation: it landed 59 s after `2d81d926` under the same
author identity. I cannot verify the log's "different, concurrent process" claim
from git metadata. It does not affect the capture, because run `37768165017`'s
`headSha` is `2d81d926`, not `8b49202a`.

The vehicle workflow shape matches the pinned `sweep` job: `windows-latest`,
`setup-node 24.19.0`, `core.autocrlf false`, and the same
`node scripts/foreman-line-ci.mjs shard <i> <n> "$npmCli" <outDir>` invocation. The
only added observation seam is `NODE_OPTIONS=--require=<probe>`, scoped to that one
step (`git show 2d81d926:.github/workflows/cff-p0-readgraph-measure.yml`).
**CONFIRMED.**

## P2 — Filter arithmetic

From the fixture's `stats` block:
```
install 569,622 + node_modules 595,783 + external 992,153 + unattributed 1,704 + probe_self 314 = 2,159,576 excluded
2,159,576 + kept 104,020 = 2,263,596 = total_lines   (diff 0)
```
I recounted the pairs from `fixtures/ci-pass-raw.json`: 3,044 pairs, 3,044 unique,
0 duplicates within a package, 1,543 distinct paths, 30 packages. **CONFIRMED.**
`read-graph.json.packages` is byte-for-byte equal to the fixture's `packages` for
all 30 keys.

Raw capture re-download and recount: `gh run download 37768165017 -R m0r6aN/agent-skills -D /tmp/cffrev-a/run2`
returned 8 artifacts, 809 MB, exit 0.
```
shard 0: files=1271 lines=1391115   shard 1: files=587 lines=361845
shard 2: files=444  lines=243204    shard 3: files=504 lines=267432
total capture-*.jsonl lines = 2,263,596   (exactly total_lines)
```
The job log of shard 0 independently prints `shard 0: total records 1391115 … from 1271 per-pid files`.
The fixture's unlabeled `shard_file_counts` (1271/587/444/504, sum 2,806) are these
per-pid file counts. They are not edge counts and are consistent with the capture.

Independent re-derivation (my reducer is quoted in §Appendix). Pair-set result: with
the filters the log *states*, plus three normalizations it does *not* state, the
re-derived (package, path) set equals the fixture exactly: `onlyMine 0, onlyFix 0`,
3,044 pairs. The three unstated normalizations are: decoding `file:///` URLs to
paths, matching `node_modules` only with a trailing separator, and treating
non-absolute paths (builtins such as `fs`/`path` from `Module._resolveFilename`) as
non-repo. **CONFIRMED at pair-set level.**

Line-bucket result: no filter ordering or variant I tried reproduces the stats block.

| bucket | fixture | best reconstruction |
|---|---:|---:|
| install | 569,622 | 569,622 ✓ |
| probe_self | 314 | 314 ✓ |
| node_modules | 595,783 | 598,263 |
| external | 992,153 | 992,151 |
| unattributed | 1,704 | 1,696 |
| kept | 104,020 | 101,550 |

Feeding this into F2.

## P3 — Host honesty

Per-shard `read-graph-fingerprint.json` from the run-2 artifacts:
```
shard 0..3 each: node v24.19.0 · platform win32 · arch x64 · release.lts Krypton · RUNNER_OS Windows · RUNNER_ARCH X64
                 run_id 37768165017 · attempt 1 · sha 2d81d9264ba69df92e96fe331b227cc103eb3e8a · shard <i>
read-graph-sweep-exit.txt: SWEEP_EXIT_CODE=0 (all four)
shard-outcomes: 30 packages, every ci/test/typecheck/lint = pass, waivers [] and waiver_rejected {} for all 30
package→shard assignment: identical to the log's table
```
Job IDs and durations match the log table to the second (19m29s / 29m52s / 4m20s / 4m52s).
The shard-0 job log prints `"node": "v24.19.0"`, `"platform": "win32"`. **CONFIRMED.**
Caveat: the committed fixture and pin carry only an aggregated fingerprint. The
per-job fingerprints exist only in the run artifacts, which expire 2027-01-06 (see F2).

## FQ3 — Both projections from one capture (lead)

**`affection_pin`.** I re-derived it from the fixture using a case-insensitive
own-directory split, where "own" means the path equals `plugins/foreman-line/<pkg>`
or starts with `plugins/foreman-line/<pkg>/`. Result: 28 packages and 1,946 edges,
the same as the pin. `onlyMine 0`, `onlyPin 0`, no package differs even in order.
Pin edges not traceable to the fixture: `0`. The package root itself must count as
own. With the narrower "under `plugins/foreman-line/<package>/`" reading in the log,
58 extra edges appear: the bare package-root entries and their upper-case
duplicates, e.g. `PLUGINS/FOREMAN-LINE/APPROVAL`. The log's wording
under-specifies the rule; the artifact is consistent.
`jev-decisions` and `schema-scaffold` have no external edges, confirmed from their
fixture lists. **CONFIRMED.**

**`reader_set_delta`.** I ran `classifyPath` over every fixture path:
`{code 2725, dependency_inputs 104, specifications 209, workflow 1, ordinary_documentation 5}`.
The five `ordinary_documentation` paths and their readers equal
`projections.reader_set_delta.newly_discovered_ordinary_reads` exactly
(`delta identical: true`). `READER_SET` size is 25, as the log states. **CONFIRMED.**

**Single capture.** Three facts prove it. The raw line total equals run 2 alone.
The fixture pair set reproduces from run 2 alone. Both projections reproduce from
the fixture. No run-1 data and no second sweep entered either projection.
**CONFIRMED.** Wording defect: see F5.

## FQ5 — Reproducibility (co-lead)

**AC5.6 block.** I re-ran it verbatim in the review worktree at `91480ae7`:
```
code
code
ordinary_documentation
ordinary_documentation
exit=0
```
The result reproduces. `classifyPath` is a pure path function, so the host is
irrelevant. The not-yet-existing `fixtures/dev-pass-raw.json` also classifies
`code`. **CONFIRMED.**

**Raw→fixture reduction: REFUTED.** See F2.

---

## Findings

### F1 — HIGH — The install-phase filter discards measured cross-package reads by the `ci` check (an under-report in CFF-P2's fail-open direction)

`ci` is one of the four scored checks; every package's shard outcome carries
`checks.ci`. The log justifies dropping `npm-cli.js` records on the grounds that
npm's walk happens "identically for every package". The capture refutes that.
Command, over the run-2 raw capture: select records whose `argv1` ends in
`npm-cli.js`, normalize the path, keep repo paths outside the reader's own package
directory, and drop `node_modules` and the root/`plugins`/`plugins/foreman-line`
`package.json` lookups (those files do not exist; `git ls-tree HEAD` returns nothing
for them). Output, the same in every shard (2 hits each):
```
kernel-import <- plugins\foreman-line\kernel-lease\package.json  [fs.promises.readFile]
kernel-import <- plugins\foreman-line\kernel-state\package.json  [fs.promises.readFile]
kernel-lease  <- plugins\foreman-line\kernel-state\package.json  [fs.promises.readFile]
```
These are real content reads. They come from the `file:../kernel-lease` and
`file:../kernel-state` dependencies (`kernel-import/package.json`,
`kernel-lease/package.json`). `kernel-lease/package-lock.json:23` records a
`"../kernel-state"` entry that `npm ci` reconciles against that package.json.

Neither edge appears in the pin. `affection_pin["kernel-import"]` contains neither
`kernel-lease/package.json` nor `kernel-state/package.json`, and
`affection_pin["kernel-lease"]` lacks `kernel-state/package.json`. The fixture's only
holders of `plugins/foreman-line/kernel-state/package.json` are `spec-linter` and
`verification`. So that path *is* a covered path, and the pin would route an edit
to it to `{spec-linter, verification}`, omitting `kernel-lease` and `kernel-import`
even though their `ci` checks read it. This is exactly the under-report that
D7/AC5.4 grade as fail-open for CFF-P2. Monotone exclusion does not save it, because
the path is positively covered for other packages. Required: either keep the `ci`
check's package-specific reads, or name the install phase as an uncovered class
that fails closed. The prose cannot assert it away.

### F2 — HIGH — The raw→fixture reduction has no committed command; FQ5 fails

The fixture is the artifact both projections derive from. It was produced by a
reducer that is not committed anywhere, and the measurement-log describes it only in
prose. The prose is insufficient to reproduce it:
- **Unstated normalizations.** The pair set reproduces only after adding three
  normalizations the log never states: `file:///` URL decoding, the trailing-separator
  `node_modules` rule, and the own-root equality rule.
- **Line-bucket stats do not reproduce.** No ordering reproduces `node_modules`,
  `external`, `unattributed` or `kept` (table in P2; e.g. kept 101,550 vs 104,020,
  node_modules 598,263 vs 595,783).

The spec forbids exactly this: "No one-off, uncommitted measurements are admissible
as evidence."

A further aggravation is retention. The raw inputs exist only as run artifacts that
expire **2027-01-06T11:09:04Z** (`gh api …/runs/37768165017/artifacts` → `expires_at`).
After that date, the fixture and stats block cannot be checked against anything.

Note: the reducer is not one of the Allowed Files. Fixing this therefore needs a
coordinator ruling: either commit the reducer, e.g. as a fenced block in
`measurement-log.md` with its digest, or amend the spec.

### F3 — MEDIUM — The run-1 vehicle commit's full SHA is wrong in the record

`measurement-log.md:303` records the first vehicle commit as
`6388486a60d1b25e2e11cba65c1f58bf7fb81cd5`. That object does not exist:
`git cat-file -t` reports `fatal: … could not get object info`. Run `37764594545`'s
actual `headSha` is **`6388486a6615d2fe79a1ab8bc8aa39e987475ebc`**: same 8-character
prefix, different hash. The full SHA was fabricated or mis-transcribed, not copied
from the run record. It is a provenance defect in the record of a superseded run,
not in the capture of record, but it is a pinned identifier that fails verification.

### F4 — MEDIUM / PLAUSIBLE — The probe's observation surface is narrower than the log's claim

The probe wraps `readFileSync`, `readFile`, `openSync`, `open`, `existsSync`,
`statSync`, `lstatSync`, `createReadStream`, and `fs.promises.{readFile,open,stat}`,
plus `Module._load` and ESM `resolve`/`load`
(`git show 2d81d926:tools/cff-p0-read-graph-probe.mjs`).

It does **not** observe:
- `readdirSync`/`readdir`/`opendir`, i.e. directory enumeration (78 package files use `readdirSync`);
- `cpSync`/`copyFileSync`/`cp`: materialization copies (11 + 2 files), e.g.
  `verification/tests/pmc-intent-custody-audit.test.ts:18` copies every ratified
  package into `%TEMP%`;
- `accessSync`, `realpathSync`, `fs.promises.{lstat,readdir,access,cp}`;
- Node's internal `package.json` reads during module resolution;
- reads by non-Node children such as `git` (73 files use the `*Sync` spawn APIs).

The log nonetheless says the capture records "what any check opens". As a check, I
mapped every non-`node_modules` `%TEMP%` read back to a same-suffix repo file and
tested it against the reading package's fixture list. That produced 15 heuristic
candidates. I spot-checked four (`d19-audit` temp trees, `w4p4-closure-test`), and
all were false positives: the files a test reads from its copies also appear at file
level from direct reads, e.g. all 58 sibling files `spec-linter` reads from its
`spec-linter-broken-*` copies are in its pin. So I have **no** proven missed
file-level edge from this class.

Two consequences remain:
1. The limitation is undisclosed. The log should name the unobserved APIs as a
   coverage boundary.
2. Directory-level entries (e.g. `plugins/foreman-line/approval/src` in
   `spec-linter`'s pin, created by `existsSync` on a `cpSync` source) sit beside file
   entries, and no artifact states whether consumers match them exactly or by prefix.

### F5 — LOW — `read-graph.json` says run-1 shards are "included below"

`environments[0].workflow_runs[0].outcome` says "shards 1-3 captured cleanly and are
included below". They are not included. The raw total equals run 2 exactly, and the
pair set reproduces from run 2 alone (P2/FQ3). The log ("shard 0's edges from this
run are not part of the capture of record") is closer, but it also implies run-1
shards 1–3 *are*. The artifact should say plainly that the capture of record is run
`37768165017` only.

### F6 — Mutation probes: nothing refuses either mutation

No validator, JSON Schema, or test consumes `foreman-line-ci/read-graph@1`.
`git grep -l "read-graph@1"` finds only the artifact, the fixture, and the spec.
Mutant (in `/tmp`): I removed the `kernel-import` edge
`plugins/foreman-line/kernel-contracts/tests/fixtures/golden-vectors.json`, emptied
`jev-decisions`, and added `projections.excludes`. The mutant parses and keeps
`schema: foreman-line-ci/read-graph@1`. Only an uncommitted re-derivation, such as
mine, detects the removal, and nothing at all refuses the `excludes` field.
"Over-approximation-only" is structural only in the sense that no field was written,
not enforced. I record this for completeness; the enforcement owner per D10 is
CFF-P3's drift check, and FQ1 is Reviewer B's lead.

### F7 — LOW — The ruling conditions are cited by number but not committed

The log and pin cite "ruling condition 3/4/5/6". No committed file carries the
numbered ruling. `loop-directive.md` refers to a "dispatch record" that I could not
find. Its summary says the scratch branch carries "ONE separate measurement workflow
file … observing file opens via a loader seam", while the kickstarter says "exactly
two files". The actual two files are consistent with "a workflow + a loader seam",
so I found no compliance breach. But the authority each record cites cannot be read.

### Note — `argv1` is null on hooks-thread records

Hooks-thread records always carry `argv1: null`, so the install filter cannot
classify ESM-hook records emitted inside npm processes. Joining them by pid is
unsound on Windows because pids are reused (I tried it and got spurious drops). The
effect is a possible small over-report, the safe direction. No action is required
beyond naming it.

---

## Appendix — commands and reducer

Full digests: `read-graph.json` `2c70a3d4fafd26a07b9fe566bd2de6de12b2376297e70e3018f7e6e7997f2efc` ·
`fixtures/ci-pass-raw.json` `0b8dccf8923d2b8c6a3e5fa8631c765487827879346944f0e851ff205cc7d1b8` ·
`measurement-log.md` `b07ee3915b411c7565e34c0c47f32d845187e6b72b3839086cff5e287f6ee8cf`.

The reviewer's reducer (`/tmp/cffrev-a/reduce.mjs`, sha256 `60b3ca01…bda84`) applies
these per-record classification rules, first match wins, in the order
install → node_modules → probe → external → unattributed:
```
normalize : if path starts "file:///" → decodeURIComponent(path.slice(8)), "/"→"\\"
install   : typeof argv1 === 'string' && /npm-cli\.js$/i.test(argv1)          (no pid join)
nm        : /[\\/]node_modules[\\/]/i.test(path)
probe     : /cff-p0-read-graph-probe\.mjs$/i.test(path)
external  : !path.toLowerCase().startsWith('d:\\a\\agent-skills\\agent-skills\\')
unattrib. : cwd not matching ^<root>plugins\\foreman-line\\<pkg>(\\|$)
kept      : pair (lowercase pkg from cwd, path relative to root with "\\"→"/")
→ pairs 3044, set-equal to fixtures/ci-pass-raw.json (onlyMine 0, onlyFix 0)
```
Invocation: `NOJOIN=1 FILEURL=1 NMSEP=1 node /tmp/cffrev-a/reduce.mjs /tmp/cffrev-a/run2 install,nm,probe,external,unattributed out.json`.
Scratch lives under `/tmp/cffrev-a`. The review worktree
`/home/cmorgan76/Repos/foreman-line-cff-p0-review-a` was left in place with no
commits and no changes.
