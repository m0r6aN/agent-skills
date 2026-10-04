# Loop Directive — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**State:** `PMC-P0 GATE 2 GRANTED — PROMOTED, WORKTREE PREPARED, AWAITING BUILDER EXECUTION`
**Gate 2:** granted by Clinton Morgan 2026-09-24 for PMC-P0 only, with the condition that the builder use a fresh clean worktree on a new unique branch
**Dispatch pin:** worktree `D:/Repos/wt-pmc-p0`, branch `codex/pmc-p0-evidence`, HEAD `96a24bf7ab3669b79ff7d0b004466846051c6d71`, spec SHA-256 `82d7819c63e59626ff57495ca84c0d386e091f5f9e4c6076c476a253f30b5b71`
**Builder brief:** `docs/kickstarters/foreman-line-build-PMC-P0.md`
**Cleared:** Amendment 01 (A1–A8), Amendment 02 (M1–M4), and Amendment 03 Opus correction ratified 2026-09-24
**Draft spec:** `docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md` at `status: draft`
**Next human gate:** Gate 2 dispatch approval for PMC-P0

## Ownership block

| Field | Value |
|---|---|
| Coordinator | **claimed** by this Pi session on 2026-09-23 at the PMC-P0 boundary, on the owner's explicit direction ("Yes claim the coordinator role and open the PMC-P0 shaping session now") |
| Claim rule | one goal, one coordinator; transfers only at a parcel boundary |
| Owner | Clinton Morgan |
| Last state change | 2026-09-23 — Amendment 02 ratified; PMC-P0 shaped to `draft`; loop stopped at Gate 2 |

The PMC-P0 shaping session ran coordinator lint first. Its Opus absence finding
is now historical: Amendment 03 corrects it to the confirmed OpenCode and
OpenRouter Opus 5.5 identities. The draft passed both advisory self-check layers — spec-linter
frontmatter and §4 body sections — which is **advisory only**; coordinator lint
remains the sole promotion authority. No `ShapingResult` was emitted, per the
RCM-P0 precedent for coordinator-run goal parcels. Ownership is recorded so a
later `/goal resume` does not re-claim blindly; transfer only at a parcel
boundary.

**Cross-goal sequencing note.** Routing Currency and Merit is live under Claude
Code coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356` (state
`RCM-P0-closed-incomplete`, RCM-P1 held) and owns both the `routing-policy/`
surfaces PMC-P1/P2 must change and the `host-owner-export/` evidence this lint
consumed. PMC-P0 does not collide on files; **PMC-P1 and PMC-P2 do** and must be
sequenced with that coordinator before Gate 2 — never co-owned.

## Standing authorizations (verbatim, with contingencies)

| Gate / action | State |
|---|---|
| Gate 1 — original D1–D8, matrix, parcels, exit criterion | Ratified 2026-09-23 |
| Scoped Gate 1 re-open — A1–A8 | **Ratified in full 2026-09-23 — closed** |
| Plan-level adversarial review | Complete; `REQUEST CHANGES` recorded |
| Gate 2 — dispatch PMC-P0–PMC-P4 | Not granted |
| Pi config / Foreman source / templates / tests | Not granted until per-parcel Gate 2 |
| Credential inspection, provider call, spend | Not granted; separate per-test authority |
| Gate 3 — merge, release, install, default-route activation | Not granted |

## Queue (strict order, all blocked)

1. **[DONE]** Owner ratifies A1–A8 → scoped Gate 1 re-open closed.
2. **[DONE]** Ratified A1–A8 folded into `charter.md` § *Amendment 01* as a
   single amendment commit, committed alone, before any code.
3. **[DONE]** Coordinator lint falsified model identity (L1–L4); owner ratified
   M1–M4 as Amendment 02; PMC-P0 shaped to `draft` against the corrected matrix.
4. **[DONE]** **Gate 2 granted** 2026-09-24. Coordinator promoted the spec
   `draft → active` on `codex/pmc-p0-evidence` at `96a24bf` (status-only change;
   body byte-identical to the packet draft `eca4c33`). Clean worktree prepared
   at `D:/Repos/wt-pmc-p0` from `2f6c7944`. Builder brief written.
4a. **[NEXT]** Builder executes PMC-P0 in that worktree, beginning with the
   Step 0 restate-and-stop gate. Coordinator rules on Step 0 flags before any
   evidence collection begins.
5. **[BLOCKED on 4a]** PMC-P0 coordinator closure check against disk →
   deterministic pass → **two** independent adversarial reviews (elevated /
   architecture-risk) → triage, reproducing disputed findings before ruling.
6. **[BLOCKED on 5]** Owner ratifies the frozen role/authority map (A5.4) —
   a human gate, required before PMC-P2 starts.
7. **[BLOCKED on 6]** Sequence Wave 1 with the RCM coordinator before any PMC-P1
   Gate 2 — `routing-policy/` surfaces are contested, never co-owned.
8. **[BLOCKED on 7]** PMC-P1 … PMC-P4 per the A7 ownership split as narrowed by
   Amendment 02 (P1 makes no frontier-registry change; P2 also owns model
   enablement per M4; legacy-representation removal serialized into P4).

## Per-iteration algorithm

Shaping → coordinator lint (verify on disk) → Gate 2 → dispatch builder
(own worktree, Step 0 gate) → rule on flags (a real spec gap becomes a ratified
amendment committed alone before code) → completion claim mapped to evidence
with test count; wrong-shaped claims are presumptively empty → coordinator
closure check against disk **before** re-running anything → deterministic pass
→ adversarial review (fresh frontier session; two independent for
architecture/risk; reviewers never fix, never commit) → triage, reproducing
disputed findings before ruling → rework with its own Step 0 gate and
test-count tripwire → Gate 3 merge behind a green chain → stage-F closure.

## Stop conditions

All charter stop conditions remain in force. Additionally, stop and report if:

- a primary/fallback pair cannot be proved eligible for its data, tool,
  context, cost, or independence constraints;
- Pi cannot produce a durable route/handoff receipt or apply required
  provider-routing controls;
- another live coordinator claims overlapping source/configuration files;
- an action would need provider spend, credential inspection, non-public
  disclosure, installation, merge, or release without explicit authority;
- a change would weaken a frontier, security, human-gate, data-class, or
  evidence invariant;
- both members of a declared fallback pair fail, or an unlisted third fallback
  would be required.

## Hook-condition note

Three human gates remain agent-uncompletable: **Gate 2** dispatch approval, the
**role/authority map ratification** (A5.4), and **Gate 3** merge/activation. If
this goal is run under a stop-hook whose condition is phrased as any of those,
or as "charter implemented", the session will trap in a stop → feedback → stop
cycle. Agent-verifiable end states are of the form **"stop-report written and
loop stopped awaiting <named gate>"**.
