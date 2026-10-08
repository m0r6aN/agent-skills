# Shaping Session Kickstarter — CFF-P3 (gate-job surface-pin precheck + read-graph drift check)

> **DISPATCH-AUTHORIZED (2026-10-07).** Gate 2 early grant, verbatim: "gate 2
> early grant issued" — scoped to **CFF-P0 and CFF-P3** (recorded in
> `plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md` with its
> contingencies). The charter is fully ratified (Gate 1 twice; the plan-level
> adversarial review is closed with triage installed as D7–D11). CFF-P3 is
> parallel with CFF-P0 (no dependency). **Merge-gate surface: Gate 3 is human
> — every merge from this line is a human act.** Shaping is docs-only and
> stops at Step 0 for a coordinator ruling before any draft.

You are the Shaping Agent for `CFF-P3`. Run the `/foreman-shaping` skill
(`plugins/foreman-line/skills/foreman-shaping/SKILL.md`) and follow it exactly.

## Inputs

- **Idea:** Move surface-pin drift detection (the surface-refs sha256 class)
  from a shard-consumed test outcome to a **gate-job precheck** — a pure hash
  comparison, no test execution — and add the D10 runtime re-derive-and-compare
  drift check for the D7 read-graph pin (fed by CFF-P0's measured artifact).
  Half of PR #155 cycle 1's waiver trip was surface-pin drift discovered
  30 minutes into a sweep; this makes it visible before any shard runs.
- **Context references:**
  - Charter: `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` —
    **D5** (single plain-data source; three-state discipline preserved; no
    test execution), **D10** (drift check = re-derive-and-compare, FK-P17
    pattern), **D11** (the diff seam — P3 must NOT touch it; P1 owns it),
    exit criterion 7 (the waiver-staleness class is detected-not-prevented;
    say so in the spec), §Stage Zero reconciliation #5 (required-check
    identity preserved via R1 layer 2 — recorded, not inferred).
  - Triage record: `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md`
    — findings 4/6 (drift check + expectation bound).
  - **Coordinator-verified disk facts (confirm each before drafting ACs):**
    - `plugins/foreman-line/bypass-outage-harness/src/surface-refs.ts` —
      `SURFACE_PINS` (id/path/sha256/binds + optional `knownBase`), the
      three-state semantics (match / known-base → `blocked: <gapReason>` /
      drift → fail closed), and the header rule "pins bind committed bytes
      only" (FK-P17 amendment integrity). The pin table is TypeScript today;
      the gate job runs `node scripts/*.mjs` with **no install and no build**.
    - `plugins/foreman-line/bypass-outage-harness/tests/surface-pins.test.ts`
      — the consumer that must keep working off the extracted source.
    - `.github/workflows/foreman-line-ci.yml` — the `gate` job (steps:
      decide/verify/resolve; `permissions: contents: read, actions: read` —
      the precheck must add **no new permissions**); R1 layer 2 already makes
      a gate failure a red verdict with the `test` context reaching a
      terminal state.
  - Canon: `plugins/foreman-line/docs/SPEC-CONVENTION.md`,
    `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (#33 pin
    identity/location/value; #12 failing-when-broken),
    `docs/transcripts/defects_lessons.md`.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Where you work

- Worktree: `C:\Repos\foreman-line-cff-p3` on branch `feat/foreman-line-cff-p3`.
  Do ALL work there; never touch the main working tree, never check out
  another branch, never push.
- Environment: Windows. Node toolchain commands run in **PowerShell only**;
  run `node -v` first (must satisfy `>=24.11.1`).

## Step 0 — restate and STOP (mandatory gate)

Before writing any draft: restate the idea in your own words; state the single
parcel you propose (risk **elevated**, routing **architecture/risk**, **two
independent adversarial reviews** — it touches merge-gate behavior); enumerate
the draft files you will create; confirm what is out of scope; list clarifying
questions in small numbered batches, each with a recommended default. Then
STOP and wait for the coordinator's answers.

## Parcel-specific guidance

- **Extraction shape (D5's load-bearing constraint):** the pin table becomes a
  **single plain-data source** (shape is yours to propose — a JSON artifact +
  thin typed wrapper in `surface-refs.ts` is the leading candidate) consumed
  by BOTH the package test and the gate precheck. A duplicated table is a
  named stop condition. The extraction must be a **pure move** — byte-identical
  data, mutation-proven (every sha256/gapReason unchanged); tests re-point,
  never rewrite.
- **Three-state discipline, not binary:** the precheck reproduces match /
  known-base (`blocked: <gapReason>`) / drift (fail closed). A "drift" that
  collapses KNOWN-GAP to a plain fail is a scope regression — stop and report
  it instead.
- **Drift-check step (D10):** re-derive-and-compare for the D7 read-graph pin,
  same FK-P17 pattern. CFF-P0's measured artifact is its input; if that
  artifact has not merged when P3 builds, land the precheck first and gate the
  drift-check step's data on P0's landing (name the seam in the spec — do not
  invent substitute measurement inside P3: the measurement is P0's
  two-reviewed deliverable).
- **Invariants the spec must bind:** no test execution in the gate job; no new
  workflow permissions; required-check identity unchanged (`test` context,
  R1 layer 2); the precheck never greens anything — it can only surface red
  earlier (D8's spirit; the verdict stays all-artifact).
- **Expectation bound (must appear in the spec's out-of-scope):** this parcel
  does NOT fix the waiver-pin staleness class (2 of 3 PR #155 cycles) — the
  bypass-outage-harness waiver failingSet still encodes pin-state-dependent
  test names. Exit criterion 7 names that detected-not-prevented.

## Outputs (after answers)

- One parcel spec draft under `plugins/foreman-line/docs/specs/active/` at
  `status: draft`, passing the advisory self-check
  (`plugins/foreman-line/shaping/`).
- One `plugins/foreman-line/docs/specs/active/<SESSION-SLUG>.shaping-result.json`
  with `parcelSpecRefs` (POSIX, `>= 1`) and `epics: []`. Derive the slug via
  `deriveSessionSlug` before calling emit.

## STOP boundary

No `status` flip (draft → active), no `epics` filling, no Jira registration,
no receipt emission/hashing, and **no implementation code** — shaping produces
the spec only. Coordinator lint is the sole promotion authority. A need to
change any frozen contract — including any change to the waiver's input
contract (D3) or a second pin source — is a loop-stop.

## Completion

End by reporting the draft path, the `ShapingResult` path, and any open
questions still awaiting a human/coordinator decision.
