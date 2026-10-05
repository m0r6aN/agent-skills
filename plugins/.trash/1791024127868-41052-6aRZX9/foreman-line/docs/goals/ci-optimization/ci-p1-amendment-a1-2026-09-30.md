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

6. **AC7 — replace the phrase** "no network, no npm — the contract forbids `npm ci`/`npm install` anywhere in this goal's agent work" **with:**

   > no network, no npm (A1-placement-6: no npm invocations inside the developer's main checkout `D:/Repos/agent-skills`, where `npm ci` would wipe installed state; this suite needs none regardless — it is pure node with injected seams. npm inside a disposable parcel worktree is permitted and is governed by each parcel's spec — CI-P2's measured pre-flight requires it.)

7. **AC2 classification table, row 4 — replace** "(d) repo-root `docs/**` after rule 3" **with:**

   > (d) repo-root `docs/**` after rule 3, EXCEPT any path whose first segment under `docs/` begins with `specs` (spec-corpus near-misses — e.g. `docs/specs-extra/x.md` — fall to `code`, A1-E1)

8. **AC5 — append:**

   > **Pinned `fallback_reason` vocabulary (A1-E3; every emitted reason is exactly one of):** `no-prior-run`, `prior-run-inconclusive:<conclusion>` (conclusion string or `null`), `hash-mismatch:code|specifications|workflow|dependency_inputs`, `merge-context-mismatch`, `merge-base-mismatch`, `not-ancestor`, `source-head-unreachable`, `candidate-cap-truncation`, `event-class-ineligible`, `test-relevant-change`, `unknown-path`, `unsupported-entry`, `classification-error`, `api-error`, `evidence-unverifiable`.

9. **Current Behavior Record — replace** the substring "a frozen list of **19 packages** under `plugins/foreman-line/` (approval, contract-readers, contracts, dispatch, foreman-config, integration, mutation-scope-guard, permission-profiles, projection, receipts, registration, role-authority, routing-policy, schema-scaffold, shaping, skill-injection, spec-linter, verification, worker-envelopes)" **with:**

   > a frozen list of **20 packages** under `plugins/foreman-line/` (approval, contract-readers, contracts, dispatch, foreman-config, hybrid-routing, integration, mutation-scope-guard, permission-profiles, projection, receipts, registration, role-authority, routing-policy, schema-scaffold, shaping, skill-injection, spec-linter, verification, worker-envelopes) — 20 at `origin/main` @ `e5dce4d0` (workflow step reads "Install all 20 packages"); the `origin/dev` line (PR #122) freezes 19, having deleted `hybrid-routing` (record correction A1-E5; 19/20 membership reconciliation is CI-P2's F4 subject)

   and replace "including all 19 `npm ci` installs" with "including all 20 `npm ci` installs".

10. **AC3 rule 6 — replace** "**push-class strengthening**: equal resolved `git merge-base`" **with:**

   > **merge-base strengthening (A1: applies to `pull_request`-class eligibility)**: equal resolved `git merge-base`

## Step-0 derivation rulings (recorded 2026-09-30, pinned by tests, no spec text change)

- **E2:** `code` bucket splits into `test-relevant-change` (enumerated test-relevant shapes) vs `unknown-path` (unenumerated); both class `code`, both fall back.
- **E4:** scan newest-first, lineage-filtered, 10 scanned entries; FIRST lineage-eligible candidate evaluated against rules 2–6 only; first failing rule wins; exhausted ⇒ `no-prior-run`; bound ⇒ `candidate-cap-truncation`.
- **E8:** current `head_sha` = `pull_request.head.sha` from the event payload (never `GITHUB_SHA`), and MUST equal this run's API run-record `head_sha` (disagreement ⇒ `evidence-unverifiable`); source side = API run record; push side = `after`.
- **E9:** absent base ⇒ hash bytes `null\0null`.
- **E10:** `verify` receives source-run id + expected hashes via the `evidence_record` step output (C12 sanctioned; C2 bans log scraping only) and re-validates all from primary sources.

## Coordinator note on the npm phrasing

The over-broad phrase originated as protection of the developer's main-checkout `node_modules`. Placement 6 above narrows it. CI-P2's spec carries no such blanket ban (its pre-flight and shards install by design); the event-class propagation to CI-P2's spec is `ci-p2-amendment-a2-2026-09-30.md`.
