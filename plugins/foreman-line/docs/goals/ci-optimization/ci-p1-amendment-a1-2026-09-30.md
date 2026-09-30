# CI-P1 — Coordinator-Ratified Amendment A1 (2026-09-30)

**Instrument:** spec amendment (SPEC-CONVENTION §11 pattern): exact replacement text, committed alone in the parcel worktree **before any implementing code**, commit message identifying it as a coordinator-ratified amendment (e.g. `docs(specs): CI-P1 amendment A1 (coordinator-ratified) — OQ1 safe ruling`).
**Authority:** coordinator ruling at CI-P1 spec lint, on spec open question OQ1 (the only unresolved design fork in the shaped spec). Recorded here so the ruling does not evaporate in chat history.
**Target file:** `plugins/foreman-line/docs/specs/active/CI-P1-docs-only-push-reuse.md` (the spec is the builder's own Allowed File; the amendment commit touches ONLY the spec file).

## Ruling

**OQ1 — adopt the safe option:** reuse is eligible **only** for `pull_request`-class runs. `push`-class runs always take the fallback (full sweep).

Reasoning, recorded: (1) the ruleset-gated contexts live on PR heads; (2) the push-class duplicate of every PR head becomes a **live canary sweep** — one real full sweep per push still executes, catching environment drift and latent flakes that evidence-based equivalence cannot see; (3) the two named residuals (future history-sensitive checks; duplicate-context ambiguity on one head) shrink to PR-class where the gate applies; (4) cost is halved on the reuse unit (2 sweeps → 1), and the remaining duplicate-run waste is OQ3, a developer lever (dropping/filtering `on: push`) explicitly out of charter scope. Widening push-class eligibility later is a re-audit (new history-sensitive checks) plus a developer decision — never a drive-by change.

The tradeoff is stated openly: both-class reuse would take the reuse unit to 0 sweeps. The extra canary is purchased deliberately while the merge gate itself is being changed (elevated risk, Invariant 5).

## Exact replacement text (place at the named sites; nothing else changes)

1. **AC3, decision rule — insert as new rule 0 before the existing rule 1:**

   > 0. **Event class (A1)**: the run under decision is `pull_request`-class. `push`-class runs are never eligible for reuse — `decision: fallback`, `fallback_reason: event-class-ineligible`. (Coordinator-ratified OQ1 safe ruling: the push-class duplicate of a PR head remains a full-sweep canary; the duplicate-run waste it keeps is OQ3, out of charter scope.)

2. **C6 — replace the sentence** "Reuse additionally requires: same event class for source and current runs (`push`↔`push`, `pull_request`↔`pull_request`; cross-class never eligible), and — strengthening, outside the shared hash — equal resolved `git merge-base <head> origin/<base_branch>` for source and current heads (closes the history-sensitivity residual audited in OQ1)." **with:**

   > Reuse additionally requires: both source and current runs are `pull_request`-class (A1: `push`-class is never eligible; cross-class never eligible), and — strengthening, outside the shared hash — equal resolved `git merge-base <head> origin/<base_branch>` for source and current heads (closes the history-sensitivity residual audited in OQ1).

3. **AC5 — add to the enumerated fallback reasons** (where `test-relevant-change` etc. are listed): `event-class-ineligible` (A1: any `push`-class run).

4. **AC6(a) — append to the demo description:**

   > The demonstration is scoped to the head's `pull_request`-class run. The head's `push`-class duplicate runs the full sweep by A1 ruling — expected canary behavior, recorded as such in the closure evidence, not a defect.

5. **AC7 fixture matrix — add a row to "Decision/verification behavior":**

   > `push`-class decision ⇒ `decision: fallback`, `fallback_reason: event-class-ineligible`, sweep invoked (A1).

## Coordinator note on the npm phrasing (not part of A1; cross-spec lint item)

Spec AC7 currently reads "the contract forbids `npm ci`/`npm install` anywhere in this goal's agent work" — over-broad (it originated as protection of the developer's main-checkout `node_modules`, which `npm ci` would wipe). Precise scope: **no npm invocations inside the developer's main checkout `D:/Repos/agent-skills`; npm inside a disposable parcel worktree is permitted and is governed by the parcel spec (CI-P2's measured pre-flight requires it).** This wording fix rides the cross-spec lint note when CI-P2's spec lands (A2 if it needs amendment text), and the builder of each parcel applies it to its own spec file.
