# Builder dispatch — CFF-P0 (recon and baseline)

**Gate 2:** granted 2026-10-07 by Clinton Morgan — verbatim: "gate 2 early grant
issued", scoped to **CFF-P0 and CFF-P3** (recorded in
`plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md` with its
contingencies).
**Role:** builder. You are not the coordinator, not a reviewer, not the owner.
**Session shape:** fresh session; this brief plus the pinned spec only.
**Scope line:** CFF-P0 is **read-only recon** — it writes only its nine
Allowed Files. It never edits `scripts/**`, `.github/workflows/**`, or package
source; never touches waiver pins; never installs the read-graph pin into
code. A discovered need to change any of those is a stop-and-report.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree path | `/home/cmorgan76/Repos/foreman-line-cff-p0` — do **not** work in `/home/cmorgan76/Repos/agent-skills` |
| G2 | Branch | `feat/foreman-line-cff-p0` (existing; do not create, rebase, reset, or amend) |
| G3 | Spec | `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`, SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`, `status: active` |
| G4 | Worktree state | clean (`git status --short` empty) before you start |

Also confirm this brief is present at
`plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-P0.md` and
report its observed SHA-256 and byte size (do not compare it to any value
quoted inside this file; the coordinator verifies). If anything fails a gate:
**stop and report**. Do not "fix" it. Record `git rev-parse HEAD` at start.

## Step 0 — restate and STOP

Before any write: (1) restate the exact nine Allowed Files from the spec; (2)
eleven-words-or-less on what this parcel produces; (3) confirm G1–G4. Then
**stop for the coordinator's ruling** before writing.

## Build sequence (the spec's AC1–AC6 and Verification Plan are the contract)

Deliverables: `cff-p0-sweep-anatomy.md` (AC1), `cff-p0-assignment-and-waivers.md`
(AC2 §fallback + AC3 §waivers), `cff-p0-waiver-input-contract.md` (AC4),
`cff-p0-c9-reproof.md` (AC6), and the `read-graph/` artifact set (AC5). Every
pinned number is reproduced by a **committed command + committed fixture**
with environment fingerprint and source run IDs — one-off uncommitted
measurements are inadmissible (the spec says so; reviewers enforce it).

1. **AC1 sweep anatomy** from real runs (run IDs in the spec: `37661562241`,
   `37664971051`, `37666762575`, `37674775022`, `37700880571` + at least one
   green main run measured fresh at build time). gh API from this machine is
   fine for run logs; measure, don't assert — reproduce or explicitly correct
   the spec's reference points with log citations.
2. **AC2/AC3 assignment + waiver records** reproduced by committed commands
   (the 30/27 gap with the three named cost-unknown packages; the round-robin
   fallback shown, not asserted; the four dead waiver identities with
   green-run evidence).
3. **AC4 waiver input-contract map** with line citations re-read at build.
4. **AC5 the D7 read-graph measurement** — one measurement pass per
   environment, two projections from the same capture (READER_SET delta +
   affection pin), over-approximation-only schema, R15 variance edges,
   criticality grading recorded. **Environment honesty:** the pinned primary
   environment is `windows-latest` / Node `24.19.0`. If the instrumented pass
   cannot run on a true `windows-latest` host without a workflow change (this
   parcel may not make one), that is a **loop-stop for coordinator ruling** —
   never a silent host substitution, never a Linux pass labeled as the pinned
   environment. The supplementary dev-Windows pass needs the developer's
   machine — if it cannot run this session, record it as a named pending
   input, not as done.
5. **AC6 C9-class read-sweep re-proof** over `kernel-import`, `ops-console`,
   `project-scaffold` — measured, not asserted (lesson #46).
6. **Commit** the nine Allowed Files only, conventional-commit subjects, no
   trailers. **Stop after the build** — the D7 deliverable's two independent
   reviews and the architecture review are the coordinator's to dispatch;
   Gate 3 is human and never yours.

## Hard stop conditions

Any write outside the nine Allowed Files · any install of the read-graph pin
into code · waiver-pin changes · fallback loudness or cost-table re-pin work
(CFF-P1's) · a D7 measurement that cannot cover a package class (charter
stop) · incomplete relevance coverage discovered for a package class ·
silently substituting an environment for the pinned one.

## Completion claim (the coordinator verifies on disk)

Per-AC evidence mapping; every pinned number's reproduction command + fixture;
the environment fingerprint table (which numbers are pinned-env, which are
named variance edges); test/fixture inventory; named pending inputs (e.g. the
dev-machine supplementary pass). Wrong-shaped claims are presumptively empty.
