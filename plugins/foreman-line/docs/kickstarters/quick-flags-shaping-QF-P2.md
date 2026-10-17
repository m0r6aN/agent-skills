# Shaping Session Kickstarter — quick-flags QF-P2

You are the Shaping Agent for parcel QF-P2 of the quick-flags goal. Follow `plugins/foreman-line/skills/foreman-shaping/SKILL.md` exactly.

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Name your model in Step 0. Docs-only writes.
Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Why
QF-P1 shipped `plugins/foreman-line/docs/QUICK-FLAGS.md` (Registry version 1): the versioned registry of the 14 quick flags, the `Active restrictions` entry format, the decision-log entry, the conflict table, provenance and inert-message rules. QF-P1 only wrote the registry; **QF-P2 makes it operative** by wiring it into canon: the goal skill, a real loop-directive template, and the coordinator pattern. The registry's own out-of-scope list (`docs/specs/done/QF-P1-quick-flags-registry.md`, "Out of scope") names exactly QF-P2's surfaces.

## Required reading
- `plugins/foreman-line/docs/goals/quick-flags/charter.md` (QF-P2 parcel row; D-rows, esp. D1, D2″, D5″, D9″)
- `plugins/foreman-line/docs/goals/quick-flags/loop-directive.md` (Stage F record 2026-10-14 — six inputs forwarded from QF-P1 to QF-P2; standing authorizations)
- `plugins/foreman-line/docs/goals/quick-flags/plan-review-findings.md` (QF-R8 / R8: the loop-directive template does not exist; the goal skill's reference to the historical `foreman-line-coordinator-loop.md` is the defect QF-P2 fixes)
- `plugins/foreman-line/docs/specs/done/QF-P1-quick-flags-registry.md` (esp. AC-16 `--resume`, AC-19 the `Active restrictions` entry, the Out-of-scope list, and the Step 0 rulings naming `restrictions.md` and the pre-loop-directive decision-log home)
- `plugins/foreman-line/docs/QUICK-FLAGS.md` (the registry itself; the `restrictions.md` passage)
- `plugins/foreman-line/skills/goal/SKILL.md` (the edit target) and its synced copy `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/templates/kickstarters/{shaping,builder,reviewer}-template.md` (house style for the new template)
- `plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-loop.md` (the historical W0 directive the goal skill currently models loop directives on — **read-only; leave it untouched**)

## Inputs
- **Idea:** shape ONE parcel spec, QF-P2 (`docs/specs/active/QF-P2-quick-flags-integration.md`, `status: draft`), covering exactly these surfaces:
  1. **Goal skill "Quick flags" section** in `plugins/foreman-line/skills/goal/SKILL.md`: points to `docs/QUICK-FLAGS.md` as the single versioned source of truth (D1, D2″); states the provenance/typed-words boundary — a skill or slash-command body is file content and carries no quick flags; only what the human typed counts (J-11, D9″); names `restrictions.md` and every `Active restrictions` entry / decision-log location, including the pre-loop-directive homes (draft charter before Gate 1; `restrictions.md` in the goal's directory between Gate 1 and the loop directive; the decision log in a decision-log section of the file holding the restriction lines before the loop directive exists); adds "stored state may only restrict" to the Stage Zero interrogation.
  2. **New `plugins/foreman-line/templates/kickstarters/loop-directive-template.md`**: the template the goal skill points at, holding the ownership block (which must name the owner's **working copy**, not only the session ID — M-1/N-1), the `Active restrictions` entry (line format per the registry, AC-19), and the decision log. Replaces the goal skill's modeling reference to `foreman-line-coordinator-loop.md`; that historical kickstarter is not edited.
  3. **Synced copy refresh**: `skills/synced/b1615d10-039d-4783-acf0-ab3f00e92f65_48b499d1-feb5-4dd7-a1c2-31c0becec6cb/goal/SKILL.md` carries the same "Quick flags" section (check how the sync works before prescribing the mechanism).
  4. **Cross-reference in `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`** to the registry.
- Explicitly out of scope (spec must say so): QF-P0 (the authority-registry corpus amendment for these canon edits — sequenced after QF-P2), QF-P3 (conformance check), any edit to `QUICK-FLAGS.md`, `charter.md`, or `loop-directive.md` beyond the template/skill/canon surfaces above, and any actual `Active restrictions` line, decision-log entry, or gate-record entry. No flag text may be readable as waiving a gate (charter stop condition).

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p2`, branch `qf-p2`. Never touch the main working tree, check out another branch, or push; do not run git add/commit. Write only the spec (status `draft`), its shaping-result json, and its `docs/specs/INDEX.md` row if one needs changing.
Environment: Linux, bash, git repo; pi CLI is the dispatch harness. No build step; this is a docs-only parcel.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. Restate the parcel; list the ACs you propose (grouped by the four surfaces), what each surface's edit must and must not say, and how you will keep every edit verifiable on disk.
3. List clarifying questions in numbered batches, each with a recommended default.
4. STOP. Do not author the spec on your own resolution of an open question.

## Outputs (after answers)
The spec at `status: draft`, passing the shaping self-check, plus the shaping-result artifact. Every factual claim must be checkable on disk. Coordinator lint is the sole promotion authority.
