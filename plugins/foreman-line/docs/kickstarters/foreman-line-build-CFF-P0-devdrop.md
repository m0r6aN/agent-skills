# Builder dispatch — CFF-P0 continuation: dev-drop turnkey run package (AC5.3 enabler)

**Authority:** developer ratification 2026-10-08 ("continue as recommended") of
the coordinator's Q1 recommendation — a turnkey dev-Windows capture package in
`read-graph/dev-drop/`, built by the CFF-P0 builder as a small continuation.
This is CFF-P0's own pending AC5.3 work (the supplementary dev-Windows pass);
it enables the developer's human input act. It is **not** the dev-pass itself —
the human runs it.
**Role:** builder. You are not the coordinator, not a reviewer, not the owner.
**Session shape:** fresh session; this brief only.
**Model policy (2026-10-08, standing):** `anthropic/claude-opus-5-5`.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree path | `/home/cmorgan76/Repos/foreman-line-cff-p0-devdrop` — create it yourself: `cd /home/cmorgan76/Repos/agent-skills && git worktree add /home/cmorgan76/Repos/foreman-line-cff-p0-devdrop -b chore/cff-p0-dev-drop chore/ci-fail-fast-charter` |
| G2 | Branch | `chore/cff-p0-dev-drop` (you create it from the charter branch tip; never work in the main checkout, never on `feat/foreman-line-cff-p0` — that branch is under live adversarial review) |
| G3 | Reference artifacts | probe source: `git show 2d81d9264ba69df92e96fe331b227cc103eb3e8a:tools/cff-p0-read-graph-probe.mjs` — SHA-256 of the extracted bytes must be `3105d304b94a12b1282267c1b950e0027f47d0f93abcedda659fed20878d07f0` (143 lines). Methodology source: `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/measurement-log.md` (filter sections) on the charter branch, and the primary fixture `…/read-graph/fixtures/ci-pass-raw.json` (on `feat/foreman-line-cff-p0` — read-only reference via `git show feat/foreman-line-cff-p0:<path>`) |
| G4 | Worktree state | clean after creation, before you start |

If anything fails a gate: **stop and report**. Do not "fix" it. Record
`git rev-parse HEAD` at start and report it.

## Step 0 — restate and STOP

Before any write: (1) restate the exact Allowed Files (below); (2)
eleven-words-or-less on what this package produces; (3) confirm G1–G4. Then
**stop for the coordinator's ruling** (restate-and-hold is acceptable; writing
first is not).

## Allowed Files

- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/**` — and
  nothing else. No `scripts/`, no workflow files, no parcel-branch commits, no
  edits outside `dev-drop/`.

## Deliverables (all inside `dev-drop/`)

1. **`probe/cff-p0-read-graph-probe.mjs`** — byte-verbatim recovery from git
   object `2d81d926` (SHA-256 pinned in G3). Byte-identical, no header edits,
   no "improvements" — the instrument must be identical to the primary
   capture's or the two passes are not comparable (R15).
2. **`capture-dev-pass.mjs`** — a dependency-free, cross-platform Node script
   (the dev box is Windows; develop on Linux, write for both: `node:path`,
   `node:os`, forward/backslash agnostic, no shell assumptions) that:
   - records a host fingerprint (node version, platform, arch, `os.release()`)
     into the output metadata — the variance narrative needs it;
   - resolves the npm CLI seam exactly as the vehicle did
     (`<node-dir>/node_modules/npm/bin/npm-cli.js`);
   - runs the **same four shard invocations** as the pinned sweep
     (`node scripts/foreman-line-ci.mjs shard <0..3> 4 "<npmCli>"
     read-graph-shard-outcomes`) **sequentially**, with
     `NODE_OPTIONS=--require=<probe>` and `READGRAPH_CAPTURE_DIR` set for each
     child process only;
   - **never stops on a red shard** — local sweeps have pre-existing failures
     (the charter's D9 rationale counts 279); capture validity comes from file
     opens, not green results. Every shard's exit code is recorded into the
     output, observationally;
   - reduces the capture **streaming** (the vehicle's shard-0 OOM lesson:
     never build one JSON string in memory) applying the **same five filters**
     the measurement log pins (install-phase argv1 exclusion; `node_modules/`;
     the probe's own file; outside-repo paths; unattributed root-cwd
     orchestrator reads) to **distinct (package, path) pairs**;
   - writes **`dev-pass-raw.json`** into the `dev-drop/` directory, schema
     `foreman-line-ci/read-graph-raw-capture@1` — the same top-level shape as
     the primary `ci-pass-raw.json` (`environment`, `stats`,
     `filter_methodology`, `packages`) with environment values honestly
     naming the dev host (`dev-windows`, measured versions — never the pinned
     CI values).
3. **README correction + runcard** — rewrite `dev-drop/README.md`'s contract
   section: the existing README names `scripts/read-graph-probe.mjs`, a file
   that never shipped (erratum — record it as one). The runcard must make the
   human act exactly: clone/fetch this branch → `git config --global
   core.autocrlf false` **before checkout** (LF byte preservation, per the
   vehicle's own first step) → `npm ci` at repo root →
   `node plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/capture-dev-pass.mjs`
   → confirm `dev-pass-raw.json` appeared. State prerequisites loudly
   (Node ≥ 20, ~60–90 min sequential, red-is-expected note, what to do on
   failure: drop whatever was captured plus the console log, never edit the
   JSON).

## Hard stops

Any write outside `dev-drop/` · any edit to the probe bytes (verbatim or
stop-and-report) · any "improvement" to the filter methodology (identical to
the primary's, or stop) · fabricating a capture (you produce tooling, never
data) · any commit outside the scratch branch · pushing anywhere.

## Completion claim (the coordinator verifies on disk)

`git rev-parse HEAD` start/end; the probe hash proof (observed vs G3-pinned);
the script's own `--help`/dry-run output demonstrating it parses and refuses
cleanly when not in a repo root; a statement of what you could and could not
verify without a Windows host (honest gap naming, lessons #47/#48). Commit
with a conventional-commit subject and stop — merge of the scratch branch is
the coordinator's act.
