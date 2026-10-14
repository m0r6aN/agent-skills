---
ticket: CFF-P3
title: Gate-job surface-pin precheck and read-graph drift seam
status: active
owner: clinton.morgan
created: 2026-10-08
updated: 2026-10-08
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/bypass-outage-harness/pins/surface-pins.json
  - plugins/foreman-line/bypass-outage-harness/src/surface-refs.ts
  - plugins/foreman-line/bypass-outage-harness/tests/surface-pins.test.ts
  - scripts/surface-pin-precheck.mjs
  - .github/workflows/foreman-line-ci.yml
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# CFF-P3 — Gate-job surface-pin precheck and read-graph drift seam

## Intent

Move surface-pin drift detection (the `surface-refs.ts` sha256 class) from a
shard-consumed test outcome to a **gate-job precheck** — a pure hash
comparison with no test execution — so drift is red in the first minute of CI
instead of ~30 minutes into a sweep (PR #155 cycle 1). To do that without a
second pin source, the pin table is extracted to a **single plain-data source**
consumed by both the package test and the gate script as a byte-identical pure
move. The parcel also names D10's runtime re-derive-and-compare drift check for
the D7 read-graph pin as a sequenced seam fed by CFF-P0's measured artifact.
Consumers are the `gate` job, the bypass-outage-harness suite, CFF-P0/CFF-P1
builders, and two independent adversarial reviewers; the all-artifact verdict
and the required `test` context are untouched.

## Constraints

- **D5 single source.** The pin table exists in exactly one plain-data
  artifact, consumed by BOTH the package test and the gate precheck. A
  duplicated or split table is a named stop condition (loop-stop per the
  dispatch kickstarter). The FK-P17 spec pin (`SPEC_RELATIVE_PATH` /
  `SPEC_SHA256`) lives in the same artifact — a split source is exactly the
  drift channel D5 forbids.
- **Pure move, byte-identical, mutation-proven.** Every `id`, `path`, `sha256`,
  `binds`, `knownBase.sha256`, `gapReason`, `SPEC_RELATIVE_PATH`, and
  `SPEC_SHA256` value survives extraction unchanged (coordinator Q1: "every
  sha256/gapReason unchanged"). The test re-points its import, never its
  assertions. Proof discipline is SC #11 (failing-when-broken / mutate to
  prove), not assertion count.
- **Load shape.** `surface-refs.ts` reads the JSON via `readFileSync` (it
  already reads files at runtime). No `resolveJsonModule`, no tsconfig change:
  tsconfig is deliberately absent from `surfaces:` and must not change. If any
  shape forces a tsconfig change, that file joins `surfaces:` and the change is
  named in the PR (coordinator Q1 contingency); this spec's shape does not.
- **Export surface identical.** `SURFACE_PINS`, `classifyPin`, `snapshotPins`,
  `SPEC_RELATIVE_PATH`, `SPEC_SHA256` — and the module's remaining exports —
  keep their names, types, and semantics. The header rule "pins bind committed
  bytes only" (FK-P17 amendment integrity) remains in force. A pin change is a
  spec amendment (SC #12 class); never re-anchor in-parcel (SC #13: pins bind
  identity, location, AND value).
- **Three-state discipline, not binary.** Every consumer reproduces
  match / known-base (`blocked: <gapReason>`) / drift (fail closed), mirroring
  `tests/surface-pins.test.ts` exactly. Collapsing KNOWN-GAP to a plain fail is
  a scope-regression stop condition (charter D5; coordinator Q5).
- **Gate invariants (D5/D8 spirit).** No test execution in the gate job; no new
  workflow permissions (workflow stays `contents: read, actions: read`); the
  required-check identity is unchanged (`test` context, preserved by R1 layer 2
  — charter §Stage Zero reconciliation #5: recorded, not inferred); the
  precheck never greens anything and never alters the all-artifact verdict — it
  can only surface red earlier.
- **Fail-closed path (coordinator Q4).** Precheck red → the `gate` job fails →
  R1 layer 2 (`verdict()` in `scripts/foreman-line-ci.mjs`: `gateResult !==
  'success'` → `gate-failed`) → the required `test` context is **red and
  terminal** (never pending, never green). No gating on `decide`: the precheck
  step is unconditional after `setup-node`, and no `decide`/`verify`/`resolve`
  condition is changed to reference it (and none references the precheck).
- **Sanitization (SC #4/#5).** Every field the precheck emits — `id`, `path`,
  `gapReason` — passes through `sanitizeField` imported from
  `scripts/foreman-line-ci.mjs` (consumed, never reimplemented). Raw pin data
  never enters a log line, annotation, or step summary.
- **File-graph discipline.** The D11 diff seam (`ci-reuse.mjs`,
  `GITHUB_EVENT_PATH` base selection) is CFF-P1's and untouched. `scripts/foreman-line-ci.mjs`
  is imported-from (read-only) but never edited — CFF-P1/P2 serialize on it.
- **Reviews.** Architecture/risk, risk `elevated`, merge-gate behavior:
  **two independent adversarial reviews** before any Gate 3 request (human,
  never delegated).
- **Environment.** Commands stated in the Verification Plan are portable
  (single commands, no shell-specific syntax). Build-stage deterministic
  passes run on the owner's Windows machine per the defects-lessons
  discipline (run where it runs — lessons #47/#48); no multi-command `run:`
  block without per-command exit propagation (lesson #47).

## Acceptance Criteria

- [ ] **AC1 — Single plain-data source, value-identical.** The 18 `PinEntry`
  rows and the FK-P17 spec pin live in exactly one artifact at
  `plugins/foreman-line/bypass-outage-harness/pins/surface-pins.json`, shape:
  `specPin { relativePath, sha256 }` plus `pins[]` of
  `{ id, path, sha256, binds, knownBase? { sha256, gapReason } }` (paths
  plugin-root-relative exactly as today). A deterministic value-level
  comparison of the pre-extraction constants against the parsed artifact
  records equality of every field (all 18 pins + the spec pin). No second pin
  source exists anywhere in the tree.
- [ ] **AC2 — Thin typed wrapper via readFileSync.** `surface-refs.ts` loads
  the artifact via `readFileSync` at module load and re-exports the identical
  public surface (`SURFACE_PINS`, `classifyPin`, `snapshotPins`,
  `SPEC_RELATIVE_PATH`, `SPEC_SHA256`, and today's remaining exports), same
  names, types, semantics. No tsconfig change.
- [ ] **AC3 — Test re-points; assertions unchanged; failing-when-broken.**
  `tests/surface-pins.test.ts` passes with its assertion set byte-identical
  (import re-pointing is the only permitted edit): 18-pin count, zero-drift
  live worktree, three-state classification, FK-P17 spec pin digest. Mutation
  proof: changing any pin `sha256` in the JSON turns the suite red
  (fail-closed drift); restoring it turns the suite green (SC #11).
- [ ] **AC4 — The gate precheck.** `scripts/surface-pin-precheck.mjs` exists,
  uses `node:` built-ins plus repo-local imports only (no npm dependency; the
  gate job still performs no install and no build), reads the same
  `surface-pins.json`, hashes the checked-out bytes of every pinned path, and
  covers **all 18 pins + the spec pin** — the exact set the test consumes,
  never a subset (coordinator Q9: a subset is a silent coverage hole).
- [ ] **AC5 — Three-state output; KNOWN-GAP preserved.** Match rows pass;
  each known-base row prints its `gapReason` (through `sanitizeField` per the
  SC #4/#5 constraint) and the run exits 0; any drift row makes the run exit
  non-zero (fail closed). KNOWN-GAP is never collapsed to a plain fail and
  never suppressed — the output mirrors the test's three-state discipline
  exactly (coordinator Q5).
- [ ] **AC6 — Workflow step and fail-closed path.** Exactly one new step in
  the `gate` job of `.github/workflows/foreman-line-ci.yml`, after
  `setup-node` and before `decide`, running `node scripts/surface-pin-precheck.mjs`
  (coordinator Q4), unconditional (no `if:` referencing another step), with no
  other step's condition changed, no new permissions, and no test execution in
  the gate job. Demonstrated end-to-end on a mutation: precheck red → `gate`
  job failure → R1 layer 2 `gate-failed` → the required `test` context red and
  terminal.
- [ ] **AC7 — D7 read-graph drift check named as a sequenced seam (D10).**
  This spec names the seam exactly: a runtime **re-derive-and-compare** drift
  check for the D7 read-graph pin (FK-P17 pattern), consuming **CFF-P0's
  measured read-graph artifact** as its pinned input, entering the `gate` job
  alongside the surface-pin precheck. It lands only in a change where CFF-P0's
  artifact is in-tree (coordinator Q6). There is no soft-pass and no
  absent-artifact branch — where the artifact is absent, the step does not
  exist. No substitute measurement is invented in P3 (plan-review finding 4;
  the measurement is P0's two-reviewed deliverable).
- [ ] **AC8 — The shipping change ships the precheck only.** CFF-P3's PR
  contains exactly the Unit A Allowed Files below (verified by
  `git diff --name-only` against the merge base) and excludes the read-graph
  drift step, whose paths enter `Allowed Files` only through a ratified spec
  amendment (SPEC-CONVENTION §4.8, **Amendment `CFF-P3-A1`** — named at
  promotion lint 2026-10-08) in the change named by AC7.

## Out of Scope

- **The waiver-pin staleness class — detected-not-prevented.** This parcel
  does NOT fix the waiver-pin staleness class (2 of 3 PR #155 cycles); the
  bypass-outage-harness waiver `failingSet` still encodes pin-state-dependent
  test names. Per charter exit criterion 7, bound verbatim: *"the
  **waiver-pin staleness class (2 of 3 PR #155 cycles) named as
  detected-not-prevented** (CFF-P3's precheck does not fix it)."*
- The D11 diff seam (`ci-reuse.mjs` shared diff export; `GITHUB_EVENT_PATH`
  base selection) — **CFF-P1 owns it**; P3 must not touch it.
- Edits to `scripts/foreman-line-ci.mjs` (CFF-P1/P2 serialize on it); P3's
  only relationship to it is a read-only `sanitizeField` import.
- Any second pin source; any re-anchoring/re-pinning (a pin change is a spec
  amendment — SC #12 class); any mutation of pin values during extraction
  (pure move only).
- Any test execution in the gate job; any new workflow permissions; any change
  to the required `test` check identity, job scheduling/`needs`, the
  all-artifact verdict, or any early-green path (D8's spirit).
- The D7 read-graph measurement itself — CFF-P0's two-reviewed deliverable;
  no substitute measurement inside P3.
- The read-graph drift step's implementation in P3's PR (AC8): it is named,
  sequenced, and deferred — not built.
- Shaping mechanics: no `status` flip, no `epics` filling, no Jira
  registration, no receipt emission/hashing, and no implementation code in the
  shaping session — coordinator lint is the sole promotion authority.

## Context & References

- Charter: `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` —
  **D5** (single plain-data source; three-state discipline; no test
  execution), **D10** (runtime re-derive-and-compare drift check, FK-P17
  pattern), **D11** (diff seam — P1 owns it), exit criterion 7 (verbatim
  above), §Stage Zero reconciliation #5 (required-check identity via R1 layer
  2 — recorded, not inferred).
- Triage record: `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md`
  — findings 4 (drift check + expectation bound) and 6c (P3 does not fix the
  waiver-staleness class).
- `plugins/foreman-line/bypass-outage-harness/src/surface-refs.ts` — the pin
  table being extracted; three-state semantics; "pins bind committed bytes
  only" header rule.
- `plugins/foreman-line/bypass-outage-harness/tests/surface-pins.test.ts` —
  the consumer that must keep working off the extracted source.
- `.github/workflows/foreman-line-ci.yml` — the `gate` job (checkout →
  setup-node → decide/verify/resolve), LF-preserving checkout, workflow-level
  `permissions: contents: read, actions: read`.
- `scripts/foreman-line-ci.mjs` — `sanitizeField` (:140) and R1 layer 2
  `verdict()` (`gateResult !== 'success'` → `gate-failed`).
- Canon: `plugins/foreman-line/docs/SPEC-CONVENTION.md` (§4 schema, §4.8
  Allowed Files); `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
  (#4 sanitize, lesson #31; #5 linear-time, lesson #19; #11
  failing-when-broken, lesson #32; #12 pin-change-is-amendment, lesson #34;
  #13 pin identity/location/value, lesson #36);
  `plugins/foreman-line/docs/transcripts/defects_lessons.md` (#47 pwsh exit
  propagation; #48 measure where it runs).

## Assumptions

- The gate job's `core.autocrlf false` checkout yields committed bytes, so the
  precheck hashes exactly what `digestFile` hashes today — the pin comparison
  is apples-to-apples between CI and the package suite.
- CFF-P0's measured read-graph artifact is not in-tree on this base (confirmed
  at Step 0, 2026-10-07); AC7/AC8 sequence around that fact rather than
  assuming it away.

## Open Questions

- The carrying vehicle for the read-graph drift step (AC7): **RESOLVED at
  promotion lint (2026-10-08)** — it rides as a second change under this spec
  via a named SPEC-CONVENTION §4.8 amendment, **Amendment `CFF-P3-A1`**.
  Rationale and conditions: `../goals/ci-fail-fast/cff-p3-shaping-lint-2026-10-08.md`
  (§Ruling). The amendment's content (exact Unit B `Allowed Files` paths) is
  ratified and committed alone before Unit B code, when CFF-P0's measured
  artifact is in-tree. No Unit B work dispatches before that commit.

## Allowed Files

Unit A — CFF-P3's shipping change (the precheck) may create or edit exactly:

- `plugins/foreman-line/bypass-outage-harness/pins/surface-pins.json`
  (created; the single plain-data source)
- `plugins/foreman-line/bypass-outage-harness/src/surface-refs.ts`
  (reduced to the thin typed wrapper)
- `plugins/foreman-line/bypass-outage-harness/tests/surface-pins.test.ts`
  (import re-point only; assertions unchanged)
- `scripts/surface-pin-precheck.mjs` (created)
- `.github/workflows/foreman-line-ci.yml` (one new `gate` step only)

Unit B — the read-graph drift step (AC7) has **no Allowed Files entry**. Its
exact paths enter this section only through **Amendment `CFF-P3-A1`** (the
named §4.8 amendment, ratified at promotion lint 2026-10-08), committed alone
in a change where CFF-P0's measured artifact is in-tree. The shaping artifact is not a builder mutation target. Any other path
requires coordinator-ratified amendment before work continues.

## Forbidden Files and Effects

Every path outside Allowed Files is forbidden for parcel writes — including
`scripts/foreman-line-ci.mjs`, `scripts/ci-reuse.mjs`, the harness's
`src/index.ts`/`src/canonical.ts`, the FK-P17 spec and every pinned surface
(read-only by definition), waiver pins and machinery, spec-linter, contracts,
routing policy, other goals' documents, and this spec's own frontmatter. No
pin value may change; no test assertion may change; no workflow permission,
`needs` edge, job name, or check identity may change.

## Verification Plan

All commands are portable, single commands (no shell-specific syntax); run
from the repository root unless a directory is named. Build-stage
deterministic passes run on the owner's Windows machine per the defects-
lessons discipline (lessons #47/#48) — the same `windows-latest` class the
`gate` job runs on.

1. Advisory self-check at shaping (this session): the shaping package's
   two-layer check (frozen spec-linter frontmatter + §4 body sections) over
   this exact draft — advisory only; coordinator lint is the promotion
   authority.
2. Value-identity proof (build): a deterministic pass comparing the
   pre-extraction constants (recorded before the move) against the parsed
   `surface-pins.json`, every field, all 18 pins + the spec pin — recorded in
   the PR description.
3. Package suite (build): `npm test` in
   `plugins/foreman-line/bypass-outage-harness` (its `tsx --test` script) —
   green with assertions unchanged; then the AC3 mutation (change one pin
   `sha256`, confirm red, restore, confirm green) and the AC6 end-to-end
   mutation (precheck red → `test` context red and terminal).
4. Precheck spot-run (build): `node scripts/surface-pin-precheck.mjs` — exit
   0 with zero drift and with a known-base row printing `blocked: <gapReason>`;
   non-zero on a mutated pin.
5. Workflow diff review: exactly one new unconditional `gate` step after
   `setup-node`, before `decide`; `permissions:` unchanged; no step conditions
   changed.
6. Two independent adversarial reviews before any Gate 3 request.

Mandated reviewer focus questions:

- Is the extraction genuinely a pure move — can any `sha256`, `gapReason`,
  `binds`, or path value have changed in transit? (Judge the value-identity
  proof, not green tests.)
- Does exactly one pin source exist after the change — can the JSON, the
  wrapper, the precheck, and the test disagree anywhere?
- Can a KNOWN-GAP state ever surface as a plain failure or be suppressed — in
  exit code, output, or step summary? Is `gapReason` printed through the
  single `sanitizeField`, with no re-implementation?
- Can the precheck ever green anything, alter the all-artifact verdict, or
  gate (or be gated by) `decide`?
- Does the fail-closed chain hold end-to-end and leave the required `test`
  context terminal (red), never pending-forever?
- Do the test's assertions remain byte-identical, and does a mutated pin
  actually turn the suite red (failing-when-broken)?
- Does the seam text exclude the naive reading where the drift step ships in
  P3's PR, or soft-passes when P0's artifact is absent?
