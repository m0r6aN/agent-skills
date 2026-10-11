# CFF-P0 adversarial review triage — 2026-10-08 (coordinator)

**Reviews:** A (`cff_p0_review_a`, opus-5-5, measurement-integrity angle —
`cff-p0-review-a-findings-2026-10-08.md`) and B (`cff_p0_review_b`, opus-5-5,
contract/scope angle — `cff-p0-review-b-findings-2026-10-08.md`), both against
`feat/foreman-line-cff-p0` @ `91480ae7` (deliverables through `500b8f54` +
docs-only kickstarter commit). Independence note recorded: A's grep surfaced
one line of B's file; no content read. Both reviewers verified the
`500b8f54..HEAD` docs-only claim themselves.
**Triage rule applied:** disputed findings reproduced by the coordinator
before ruling. Reproductions below are my own runs.

## Coordinator reproductions (the load-bearing disputes)

| Finding | Reproduction | Result |
|---|---|---|
| A-F1 (install-phase filter drops the scored `ci` check's cross-package reads) | Raw capture retained at `/tmp/cffrev-a/run2` (run `37768165017`): `capture-9544-main.jsonl` — pid 9544, `argv1` = `npm-cli.js`, `cwd` = `plugins/foreman-line/kernel-import` — reads `kernel-lease\package.json` via `fs.promises.readFile` (2 records). The committed fixture's `kernel-import` entry (71 paths) contains **no** `kernel-lease/package.json` and **no** `kernel-state/package.json`; `kernel-lease`'s entry lacks `kernel-state/package.json` | **CONFIRMED** — real measured coupling excluded by the argv1 filter; absent from the pin |
| B-Blocker-1 mechanism (probe-invisible subprocess coupling) | `plugins/foreman-line/approval/tests/helpers.ts:24-43`: `execFileSync('git', ['merge-base'…])` and `execFileSync('git', ['diff', mergeBase, '--stat', '--', pathSpec])` — approval's tests read arbitrary repo paths via a `git` subprocess the NODE_OPTIONS probe cannot observe | **CONFIRMED** — mechanism real; the pin cannot express approval's diff-driven coupling |
| B-Blocker-2 (READER_SET live hole) | All five `reader_set_delta` paths: `READER_SET.includes()` → NOT-IN ×5; `classifyPath()` → `ordinary_documentation` ×5 (coordinator runs at AC5 closure, re-run at triage). Charter stop-condition text confirmed at charter.md:172-173 ("the relevance engine's coverage is found incomplete for a package class") | **CONFIRMED** — live on `main` today; stop condition fired (see escalation) |
| A-F3 (wrong SHA) | `git cat-file -t 6388486a60d1b25e…` → does not exist; `6388486a6615d2fe…` → commit | **CONFIRMED** — same 8-char prefix, different hash; docs erratum |
| B-major (AC2 vs real artifact shape) | `read-graph.json` `packages` values are JSON **arrays of path strings** (e.g. `approval`: 77 entries) — the pre-amendment AC2 text ("an object structurally capable…") did not pin this; variance-edge shape was unpinned | **RESOLVED** — Amendment `CFF-P1-A1` (coordinator-ruled, committed alone, `73f9f624`): AC2 pinned to the measured shape (`packages[name]` array ∪ `affection_pin[name]`), variance edges pinned `{package, path}` |

## Triage table

| # | Finding (source) | Disposition |
|---|---|---|
| 1 | Install-phase filter drops the scored `ci` check's repo-tracked manifest reads (A-F1) | **FIX (rework R1):** re-derive the fixture with the filter amended — ci-phase (argv1 = npm-cli.js) reads of *repo-tracked* `package.json` paths are INCLUDED as edges (over-approximation-consistent; npm's workspace walk makes manifest couplings near-universal, which is the safe direction for CFF-P2 and merely degenerate-safe for CFF-P1 ordering). New pair count recorded and re-verified; measurement-log filter section amended to match the committed reducer exactly. |
| 2 | Reduction script never committed; per-bucket counts don't reproduce (A-F2; A rebuilt with 3 undocumented steps, got 101,550 vs 104,020) | **FIX (rework R1):** the canonical reducer ships as `read-graph/dev-drop/capture-dev-pass.mjs` (dev-drop package, `chore/cff-p0-dev-drop`, in build at triage time); P0 rework names its path + SHA-256 in the measurement log and reconciles every bucket count against it. One reducer serves both passes (no second implementation). |
| 3 | Wrong vehicle-commit SHA in measurement-log (A-F3) | **FIX (rework):** docs erratum `6388486a60…` → `6388486a6615d2fe…` (full hash re-recorded from git). |
| 4 | Probe blind classes undisclosed (A-F4; B major): directory listings, `cpSync`/`copyFileSync`, `access`/`realpath`, Node-internal package.json reads, non-Node subprocesses (git) | **FIX (rework):** named blind-class disclosure added to measurement-log + a `known_blind_classes` caveat in `read-graph.json` (staleness-honesty class); each blind class carries a measured instance (approval's git helpers; verification/schema-scaffold temp materialization). Feeds escalation E2. |
| 5 | "shards 1–3 included below" prose error (A-F5) | **FIX (rework):** erratum — capture of record is run 2 only. |
| 6 | No committed validator for `read-graph@1` (A-F6) | **ACCEPT-AS-DOCUMENTED:** CFF-P1's AC2 gate (as amended by A1) is the enforcement point — a mutant with an exclusion-shaped field or non-array entry flips to the malformed-pin fallback. P0's rework adds a one-line note naming that consumer as the validator. |
| 7 | Ruling conditions cited by number, not committed (A-F7) | **FIX (rework):** erratum citing the ruling's committed location (`loop-directive.md` State, 2026-10-08 third-iteration entry). |
| 8 | Exclusion-by-absence is prose-only; CFF-P2's monotone rule is structurally exclusion-by-absence; subprocess counterexample (B-Blocker-1) | **ESCALATE (E2, developer question Q2):** charter-level D7/CFF-P2 consumption clause — scoped Gate-1 re-open recommended. Parcel-level part (disclosure + correcting the artifact's prose-only "STRUCTURAL" claim field) is rework item 4. |
| 9 | READER_SET five-path hole live in the merge gate; stop condition fired; no owning parcel (B-Blocker-2) | **ESCALATE (E1, developer question Q1):** hotfix micro-parcel recommended. The builder's record-and-route is ruled a reasonable reading of D10's text (D10 routes the *D7 pin's* maintenance; READER_SET is the *reuse gate's* registry — the gap is real), and simultaneously the stop condition binds: CFF-P2 shaping (already gated on P1's merge) now ALSO holds on E1/E2 disposition. |
| 10 | CFF-P1 AC2 literal mismatch with the real artifact (B major) | **RESOLVED** — Amendment `CFF-P1-A1` (`73f9f624`); see reproductions table. |
| 11 | AC5 incomplete without the dev-Windows pass; empty variance list reads like "measured, none" (B major) | **ACCEPT-AS-DOCUMENTED + tracked:** AC5.3 remains a named pending input; the dev-drop turnkey package is in build at triage time; rework adds an explicit `dev_pass_status: "pending"` marker field so absence can never be misread as measured-empty. CFF-P0 is **not** Stage-F complete until the drop lands or the developer formally retires AC5.3. |
| 12 | Uncorrected static claims in `cff-p0-c9-reproof.md` (B major: kernel-import DOES import `@foreman-line/kernel-state`; ops-console reads real Markdown beyond the one addendum) | **FIX (rework):** second addendum correcting both, with the measured evidence cited (the pattern the first addendum set). |
| 13 | AC1 timing claims (B major): "+2m35s" measured from run creation vs 1m45s from job start; 9m11s install bound circular; AC1.2(a) per-package install cost never measured | **FIX (rework):** correct the latency figure with both bases named; de-circularize or re-derive the install bound from the captured run; AC1.2(a) either measured from run `37768165017`'s timings or explicitly marked unmeasured-with-reason (never silently absent). |
| 14 | B confirmed: both projections reproduce from the single capture; 30/27 gap; 8/8/7/7; four dead waivers vs run `37674775022`; waiver evaluator order-independent (with a noted shared-state overreach in the record's prose); parcel freeze clean | **INFORMATIONAL** — recorded as the reviews' positive verification. |
| 15 | Local `main` ref stale (B note — manifest diff noise) | **FIXED at triage:** coordinator fast-forwarded local `main` (`git fetch origin main:main`). |

## Escalations (developer questions, asked at report)

- **E1 / Q1:** READER_SET hole — hotfix micro-parcel recommendation (5 paths +
  regression test, single review, unbatched human Gate 3: gate-integrity
  argues against waiting for a second chain).
- **E2 / Q2:** D7's CFF-P2-consumption clause — scoped Gate-1 re-open with a
  proposed amendment (positive-coverage-only exclusion + named always-run
  manifest for blind-class packages; probe child_process coverage named as a
  follow-up, not scope growth).

## Consequences in force

- **CFF-P0: NOT Gate-3-ready.** Rework R1 dispatched after the dev-drop
  reducer lands (same branch, one rework round, Step 0 gate, every-finding
  sweep — the table above is a floor, not a ceiling); rework delta gets its
  own adversarial review pass before any Gate 3 request.
- **CFF-P2 shaping:** holds on E1/E2 disposition in addition to the ratified
  P1-merge gate.
- **CFF-P1:** unaffected except item 10's resolution (A1); its reviews proceed.
- **CFF-P3:** unaffected; its review pair remains in flight.
