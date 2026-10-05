# Loop Directive — Pi Routing Adapter Compatibility (PRAC)

**Goal slug:** `pi-routing-adapter-compat`
**State:** `gate_1_ratified_entering_prac_p0` — Stage Zero closed; PRAC-P0 shaping next
**Charter:** `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/charter.md`
**Next human gate:** none between now and merge — Gate 2 (PRAC-P0) and contingent Gate 3 are granted (green-chain-contingent). The loop stops only on a stop condition or the exit criterion.

## Ownership block

| Field | Value |
|---|---|
| Coordinator | this `/goal` Pi session `01a0d04c-7adf-72cd-9026-b512803187c3`, starting 2026-09-23 |
| Claim | claimed 2026-09-24, on the owner's explicit ruling: **pi-routing-adapter-compat is a separate queue I own** (distinct from PMC and RCM) |
| Claim rule | one goal, one coordinator; transfer only at a parcel boundary via this block |
| Owner | Clinton Morgan |
| Last state change | 2026-09-24 — Stage Zero closed (Gate 1 + plan review + D11 + 0.87.1 pin); entering the PRAC-P0 loop |

**Cross-goal notes.** `pi-model-configuration` (PMC) is a separate queue under a Pi
coordinator (state `pmc_p0_shaped_awaiting_gate_2`). This goal does **not** touch PMC
surfaces and is registered **by pointer** as an evidence input to PMC-P2/P3 — zero
authority. `routing-currency-and-merit` (RCM, session `e45b4d47…`) owns `routing-policy/`
and the `host-owner-export/` evidence; this goal touches neither. No file collision with
either queue. The one shared file is `INDEX.md` (each coordinator adds its own row once).

## Standing authorizations (verbatim, with contingencies)

1. **Gate 1** — ratified: D1–D11, OQ1–OQ3, plan-review amendments (D4/D5/D6/D7 + D9/D10 +
   exit-criterion refinements), the 0.87.1 pin, and the PMC scope-guard (D11).
2. **Gate 2** — granted for the single named parcel **PRAC-P0** only, and no other. Any
   other parcel, amendment to a frozen contract, or scope widening is a stop-and-report.
3. **Gate 3** — contingent "merge it", **this repo only**, green-chain-contingent:
   coordinator closure check against disk, deterministic pass (PowerShell, `node -v`
   first), adversarial review + triage, rework (if any) accepted with tripwires silent.
   Any red step voids it. Does **not** extend to `~/.pi/agent/extensions/`, any Pi
   settings/host file, another repo, or any Pi-session install.

## Queue (strict order)

1. **PRAC-P0** — extension/hook-SDK compatibility memo + evidence. Produce
   `docs/goals/pi-routing-adapter-compat/compat-memo.md`, the `evidence/pi-0.87.1/`
   snapshot (D9), and the hashed directive excerpt (D10), with the deterministic read-only
   probe (D7/OQ1). Routing class `implementation/standard`, single adversarial review.
   Spec: `docs/specs/active/PRAC-P0-pi-extension-hook-surface-compat.md`.

## Per-iteration algorithm

1. Shape PRAC-P0 (coordinator-run, per RCM-P0 precedent: no separate shaping agent; the
   coordinator drafts the spec, runs coordinator lint, and promotes `draft → active` at
   dispatch). Coordinator lint verifies every factual claim on disk first.
2. Dispatch a fresh builder (own worktree + branch named in the kickstarter) with a **Step 0
   restate-and-stop gate** and the standing constraints; envelope `builder-standard`.
3. Rule on flags. A real spec gap becomes a ratified amendment committed alone before code.
4. Map the completion claim to disk evidence and the probe's recorded output. Wrong-shaped
   or uncited claims are presumptively empty — verify on disk BEFORE re-running anything.
5. Deterministic pass in PowerShell (`node -v` first) over the probe; never read an exit
   code through a truncated pipeline.
6. Adversarial review — one fresh frontier session, zero builder context, read-only.
   Reviewers never fix, never commit; hostile-input probing licensed at the live probe
   boundary.
7. Triage; reproduce disputed findings before ruling. Rework has its own Step 0 gate and a
   test-count tripwire.
8. Merge behind a green chain (authorization 3); paper trail rides in the PR; then Stage F
   (spec → `docs/specs/done/`, worktree/branch cleanup, lessons appended, charter + this
   directive state updated).

## Stop conditions

Stop and report when: anything would amend `foreman-line-boundary-routing` D1–D10,
`routing-currency-and-merit` D1–D14, `pi-model-configuration` D1–D8 + Amendments,
`routing-policy/`, or another frozen contract; the parcel would need to propose
routing-design content (non-duplication boundary); a required API-surface fact cannot be
verified and assertion is the only path; a write would fall outside D6's enumerated paths;
any Pi host file or `pi-jev-budget-guard` would be modified; a tripwire fires twice; or a
human gate not granted becomes necessary.

## Wakeup pacing

Work while there is work. While the builder or reviewer runs, completion is the primary
wake signal; a long fallback is the only insurance — never poll rapidly. On any wake after
a possible host restart, treat surviving worktree files with no completion claim as
UNCLAIMED and dispatch a fresh resume with the original Step-0 directive before accepting
anything.

## Current iteration

**2026-09-24 — shaping PRAC-P0.** The charter, plan review, and loop directive are on disk.
Next: write the PRAC-P0 spec (draft), run coordinator lint against disk, promote to active,
then dispatch the builder under Gate 2.
