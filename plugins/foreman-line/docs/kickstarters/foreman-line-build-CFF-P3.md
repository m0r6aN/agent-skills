# Builder dispatch — CFF-P3 Unit A (gate-job surface-pin precheck)

**Gate 2:** granted 2026-10-07 by Clinton Morgan — verbatim: "gate 2 early grant
issued", scoped to **CFF-P0 and CFF-P3** (recorded in
`plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md` with its
contingencies). This brief covers **Unit A only** (the surface-pin precheck).
**Role:** builder. You are not the coordinator, not a reviewer, not the owner.
**Session shape:** fresh session; this brief plus the pinned spec only.
**Scope line:** Unit B (the read-graph drift step) is **not yours** — it has no
mutation authority until Amendment `CFF-P3-A1` is committed (named at
promotion lint; see the spec's Open Questions). A Unit B-shaped edit is a
stop-and-report, not a judgment call.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree path | `/home/cmorgan76/Repos/foreman-line-cff-p3` — do **not** work in `/home/cmorgan76/Repos/agent-skills` |
| G2 | Branch | `feat/foreman-line-cff-p3` (existing; do not create, rebase, reset, or amend) |
| G3 | Spec | `plugins/foreman-line/docs/specs/active/CFF-P3-gate-surface-pin-precheck.md`, SHA-256 `8b2e00ecb874c47e67608737003be20d886f1b767740c0a831fc41374e00348a`, `status: active` |
| G4 | Worktree state | clean (`git status --short` empty) before you start |

Also confirm this brief is present at
`plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-P3.md` and
report its observed SHA-256 and byte size (do not compare it to any value
quoted inside this file — a document cannot carry its own hash; the
coordinator verifies). If anything fails a gate: **stop and report**. Do not
"fix" it.

Record `git rev-parse HEAD` at start and report it. Never advance the tip
except by your own commits.

## Step 0 — restate and STOP

Before any write: (1) restate the exact Allowed Files from the spec (Unit A:
the JSON artifact, the wrapper, the test, `scripts/surface-pin-precheck.mjs`,
one workflow step — five paths, nothing else); (2) eleven-words-or-less on
what Unit A produces; (3) confirm G1–G4. Then **stop for the coordinator's
ruling** before writing code (the coordinator may answer asynchronously —
restate-and-hold is acceptable; writing first is not).

## Build sequence (the spec's Acceptance Criteria and Verification Plan are the contract)

1. **Record the pre-extraction constants** — all 18 `PinEntry` rows + the
   FK-P17 spec pin, every field (`id`, `path`, `sha256`, `binds`,
   `knownBase.sha256`, `gapReason`, `SPEC_RELATIVE_PATH`, `SPEC_SHA256`) —
   the value-identity proof's baseline. Record in the PR description.
2. **Pure move** → `plugins/foreman-line/bypass-outage-harness/pins/surface-pins.json`
   (shape per AC1: `specPin { relativePath, sha256 }` + `pins[]`);
   `surface-refs.ts` becomes the thin `readFileSync` wrapper re-exporting the
   identical public surface (all of today's exports, names/types/semantics
   unchanged; no tsconfig change); the test re-points its **import only** —
   assertion bytes never change.
3. **`scripts/surface-pin-precheck.mjs`** — `node:` built-ins + repo-local
   imports only (no npm dependency; the gate job performs no install/build);
   hashes checked-out bytes of every pinned path; covers **all 18 pins + the
   spec pin**, never a subset; three-state (match pass / known-base prints
   `gapReason` through `sanitizeField` imported from
   `scripts/foreman-line-ci.mjs`, exit 0 / drift exit non-zero); KNOWN-GAP
   never collapsed, never suppressed.
4. **One unconditional workflow step** in the `gate` job of
   `.github/workflows/foreman-line-ci.yml`: after `setup-node`, before
   `decide`; `node scripts/surface-pin-precheck.mjs`; no `if:`; no other
   step's condition changed; `permissions:` unchanged; no test execution in
   the gate job; the precheck never greens anything and never touches the
   all-artifact verdict.
5. **Deterministic passes** (run where you can run them; name honestly what
   requires the Windows/CI class and leave it as a recorded gap, never a
   silent skip — lessons #47/#48): value-identity comparison pre/post
   extraction; `npm test` in `plugins/foreman-line/bypass-outage-harness`
   (install deps first — the worktree is fresh); AC3 mutation proof (change
   one pin `sha256` → red; restore → green); AC6 end-to-end fail-closed
   mutation (precheck red → `gate` fails → `verdict()` `gate-failed` →
   required `test` context red and terminal); precheck spot-runs (exit 0 with
   zero drift AND with a known-base row printing `blocked: <gapReason>`);
   workflow diff review (exactly one new step, nothing else moved).
6. **Commit** conventional-commit subjects, no trailers; one logical commit
   per step where practical (the pre-extraction record may ride the move
   commit's message). **Stop after the build** — reviews are the
   coordinator's to dispatch; Gate 3 (merge) is human and never yours.

## Hard stop conditions (charter §Stop conditions, binding)

A second pin source · any pin value change in transit (pure move only) ·
tsconfig change without the named contingency · KNOWN-GAP collapsed or
suppressed · anything that greens, alters the verdict, or gates on `decide` ·
any write outside Allowed Files (including `scripts/foreman-line-ci.mjs` —
import read-only only) · any Unit B path · assertion changes in the test.

## Completion claim (the coordinator verifies on disk)

Test count before/after (expected: assertion set unchanged — count may grow
only if you add NEW tests for the precheck, in `scripts/`' own test surface if
the spec's Allowed Files permits; the harness test's assertions are frozen);
the value-identity proof table; each mutation probe's expected-vs-observed;
the workflow diff; the named environment gaps. Wrong-shaped claims are
presumptively empty (lesson discipline): every claim carries evidence.
