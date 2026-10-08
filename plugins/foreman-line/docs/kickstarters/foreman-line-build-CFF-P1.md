# Builder dispatch — CFF-P1 (change-proximity ordering and early-red signal)

**Gate 2:** granted 2026-10-08 by Clinton Morgan — verbatim: "full-graph Gate 2
granted" (recorded in
`plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md` with its
contingencies), covering CFF-P1/P2/P4 within the ratified sequencing. This
brief covers **CFF-P1's full spec** (AC1–AC8).
**Role:** builder. You are not the coordinator, not a reviewer, not the owner.
**Session shape:** fresh session; this brief plus the pinned spec only.
**Model policy (2026-10-08, standing):** new dispatches run
`anthropic/claude-opus-5-5` unless the developer directs otherwise.
**Reviews are not yours:** two independent adversarial reviews are
coordinator-dispatched at your completion claim (charter: critical /
architecture-risk routing). **Gate 3 (merge) is human** — never yours, and
PRs batch: the coordinator holds merge-ready chains until a second chain is
ready, per the developer's 2026-10-08 cadence ruling.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree path | `/home/cmorgan76/Repos/foreman-line-cff-p1` — do **not** work in `/home/cmorgan76/Repos/agent-skills` |
| G2 | Branch | `feat/foreman-line-CFF-P1` (existing; do not create, rebase, reset, or amend) |
| G3 | Spec | `plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`, SHA-256 `ed40b2c4d05616711f4f3e7b5c0e9dd7cf2808d81936b98c9201aa55459ebf83`, `status: active` |
| G4 | Worktree state | clean (`git status --short` empty) before you start |

Also confirm this brief is present at
`plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-P1.md` and
report its observed SHA-256 and byte size (do not compare it to any value
quoted inside this file — a document cannot carry its own hash; the
coordinator verifies). If anything fails a gate: **stop and report**. Do not
"fix" it.

Record `git rev-parse HEAD` at start and report it. Never advance the tip
except by your own commits.

## Step 0 — restate and STOP

Before any write: (1) restate the exact Allowed Files from the spec (six
paths — the four `scripts/` files, the Stage-F waiver-disposition record, the
spec itself — nothing else; the completion record named below rides under the
spec's `surfaces:` goal-directory entry); (2) eleven-words-or-less on what
this parcel produces; (3) confirm G1–G4. Then **stop for the coordinator's
ruling** before writing code (the coordinator may answer asynchronously —
restate-and-hold is acceptable; writing first is not).

## Build sequence (the spec's Acceptance Criteria and Verification Plan are the contract)

0. **Re-cite the disk facts.** The spec's "Disk facts confirmed" block was
   measured at `fcaa4b1a` (scripts last changed `145da132`) and carries three
   coordinator-ruled errata (E1–E3, `cff-p1-shaping-lint-2026-10-08.md` —
   read it first). Re-verify every line citation you build against; the spec
   mandates re-citation at build. Drift beyond the errata is a
   stop-and-report, not a judgment call.
1. **AC6 first — the D11 diff seam.** Exactly one new export in
   `scripts/ci-reuse.mjs` built only from `parseNameStatusZ` /
   `classifyPath` / `READER_SET`; base selection from `GITHUB_EVENT_PATH`
   (PR base on `pull_request`, `event.before` on `push`); absent /
   unparseable / all-zeros / non-hex40 → the fail-closed signal, never a
   throw, never "no changes." No second differ anywhere; the pre-existing
   `:835` verification diff is not yours to touch.
2. **AC1/AC2 — ordering.** Consume `read-graph.json` read-only **if and only
   if** present and schema-exact (`foreman-line-ci/read-graph@1`); missing,
   malformed, exclusion-shaped, or any computation error → every package
   falls to the non-proximate group in ascending-name order (today's order,
   byte-identical). Variance-marked edges only ever add proximity. **Ordering
   never excludes** — no code path may remove a name from `mine`. Phase 1
   (install barrier) is untouched; only phase 2's iteration order and
   completion change.
3. **AC5 — early-red.** Phase-2 loop stops at the first non-waived failure;
   unreached pairs keep `skipped`; the artifact still writes before the
   non-zero return (existing `runCli` order — verify, don't assume);
   `reconcile`/`verdict()` logic unmodified. One sanitized `::error` per
   fail/error recording, one `::warning` per `waived`, fields fixed-shape
   (package, check, layer) through `sanitizeField`; **raw captured output
   never enters an annotation field.** No scheduling/`needs`/permissions
   change; no early-green path; no sibling-shard cancellation; no Checks
   API.
4. **AC3 — cost-table re-pin + loudness.** Add exactly three measured
   entries (`kernel-import`, `ops-console`, `project-scaffold`) with
   wall-seconds sourced from **pinned-environment evidence** (the AC5
   capture-of-record run `37768165017` per-package timings on
   windows-latest/Node 24.19.0 are the preferred honest source; a fresh
   pinned-environment observation is acceptable). If no pinned-environment
   source is reachable: **stop and report — never substitute a Linux-local
   measurement silently, never guess.** Record source and methodology in the
   completion report. Add the additive coverage-loudness field to
   `buildShardOutcomes` + the step-summary line, and **demonstrate both
   states** (pre-re-pin naming the three missing packages; post-re-pin `[]`)
   with real command output.
5. **AC4 — waiver disposition record.** Write
   `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p1-stage-f-waiver-disposition.md`
   — one disposition per dead waiver (four identities, citing run
   `37674775022` @ `fb25630` and the CFF-P0 records), with reasoning.
   **No `WAIVED_EXCLUSIONS` edit** — the record is the deliverable.
6. **AC7/AC8 — tests.** One test per structural invariant, each proven to
   fail under its named fixture mutation (standing constraint #11). The AC7
   D3-conformance six-pack runs under at least two proximity-induced orders.
7. **Deterministic pass:** `node --test scripts/foreman-line-ci.test.mjs
   scripts/ci-reuse.test.mjs`. **Test-count tripwire:** record counts before
   your first edit and after; growth only from your new AC7/AC8 tests, each
   named; any existing test touched is a named, justified event in the
   completion report. Environment honesty (lessons #47/#48): name what
   requires the Windows/CI class and leave it a recorded gap, never a
   silent skip.
8. **Commit** conventional-commit subjects, no trailers; one logical commit
   per AC group where practical. **Stop after the build** — reviews are the
   coordinator's to dispatch.

## Hard stop conditions (charter §Stop conditions + spec Constraints, binding)

A second differ or second change-detection implementation · a second
classification engine · waiver input-contract shape change (D3) · any
`WAIVED_EXCLUSIONS` value edit · interleaved per-package output · any
early-green path or verdict change (D8 invariant) · sibling-shard
cancellation, `needs`/scheduling change, check-run/status emitter · the D7
pin consumed to exclude a package, under any reading · any workflow-file
edit (none is needed or permitted) · a local waiver grant · any
merge-gate/branch-protection question needing inference · any write outside
Allowed Files. Standing constraints by reference:
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (#3, #4/SC31,
#11, #13, #34 named in the spec).

## Completion claim (the coordinator verifies on disk)

Report as `cff-p1-completion-record-<date>.md` under
`plugins/foreman-line/docs/goals/ci-fail-fast/` (the spec's `surfaces:`
goal-directory entry covers this one file): `git rev-parse HEAD` start/end;
test counts before/after with the tripwire accounting; the AC3 measurement
source and both loudness demonstrations (real output); the AC4 dispositions;
each AC8 mutation probe's expected-vs-observed; the AC2 fail-closed matrix
results; the named environment gaps. Wrong-shaped claims are presumptively
empty (lesson discipline): every claim carries evidence.
