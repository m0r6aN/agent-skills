# CI-P1 — Coordinator-Ratified Amendment A3 (2026-09-30) — read-sweep re-derivation

**Instrument:** spec amendment (SPEC-CONVENTION §11): exact replacement text, committed alone in the parcel worktree BEFORE the rework code, commit message `docs(specs): CI-P1 amendment A3 (coordinator-ratified) — read-sweep re-derivation`.
**Authority:** dual-review triage (`ci-p1-review-findings-2026-09-30.md`), findings A-F1 = B-F1 = B-F2 (convergent blockers) + A-F2 = B-F3 + A-Q3/R4.
**Target file:** `plugins/foreman-line/docs/specs/active/CI-P1-docs-only-push-reuse.md` (spec only in the amendment commit).

## R1 — the classification shrink (root ruling)

**Ordinary documentation is Markdown-only and reader-free.** The dual reviews proved the "provably feeds no check" derivation false: `plugins/foreman-line/role-authority/README.md` and three `docs/goals/routing-currency-and-merit/*.json` evidence files are hard inputs of swept tests (content- and hash-pinned), yet classified ordinary — an exploitable gate bypass (reuse-green on a tree whose sweep fails). The fix is a shape-level shrink (non-Markdown is never ordinary; package/skill trees are never ordinary), plus a MANDATED measured read-sweep that flips every remaining reader path to `code`. Findings are a floor: the sweep covers ALL reads of ALL 20 swept packages' checks, not the four named paths.

## Exact replacement text

1. **AC2 classification table, row 4 — replace the ENTIRE `Rule` cell with:**

   > (a) any tracked path with basename `README.md` or `AGENTS.md` that is NOT under `plugins/foreman-line/**` and NOT under `skills/**`; (b) `plugins/foreman-line/docs/goals/**/*.md`; (c) `plugins/foreman-line/docs/transcripts/**/*.md`; (d) repo-root `docs/**/*.md` after rule 3, EXCEPT any path whose first segment under `docs/` begins with `specs` (A1-E1); and in (b)/(c)/(d) EXCEPT any path listed in the A3 measured read-sweep's reader set (such paths fall to `code`, A3-R1). Only `*.md` paths may be ordinary: every non-Markdown path falls to `code` (A3-R1)

2. **AC2 classification table, row 4 — replace the ENTIRE `Justification` cell with:**

   > verified against a MANDATED measured read-sweep of all checks of all 20 swept packages (A3): no check reads any ordinary-classified path. The four proven reader inputs — `plugins/foreman-line/role-authority/README.md` (asserted by `role-authority/tests/reconciliation.test.ts`), `plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json` and `…/openrouter-rcm-v1-conservative-projection-20260926.json` (sha256-pinned by `routing-policy/tests/public-observation-producer.test.ts` and `hybrid-routing/tests/owner-context-integration.test.ts`), `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json` (deepEqual-pinned by `routing-policy/tests/catalog-snapshot.test.ts`) — are classified `code` and pinned as regression fixtures. Any additional reader path found by the sweep is excluded and pinned likewise. Future readers shrink this set (C9); the derivation is re-run at every expansion.

3. **C9 — replace the ENTIRE constraint with:**

   > **C9 — Ordinary-documentation set is derived by measured read-sweep against the frozen-20 sweep and is shrink-only under CI-P2.** The set in AC2 is justified by a full read-sweep of what `scripts/foreman-line-ci.mjs`, `scripts/foreman-line-ci.test.mjs`, and the 20 swept packages' checks actually read (the A3 inventory: measured, not asserted). CI-P2's dynamic discovery expands the swept set (e.g. `authority-registry` tests read `plugins/foreman-line/docs/goals/**` and kickstarter content), which can only SHRINK the ordinary set — CI-P2 MUST re-derive it and prove CI-P1 reuse remains valid (charter closure clause). The rules are shape-level first (Markdown-only; never inside `plugins/foreman-line/**` or `skills/**`), then reader-excluded — so a future reader is caught by the sweep discipline, and the under-detect direction is the protected one (SC #6).

4. **AC7 — under-detect fixture list — append these rows:**

   > - `plugins/foreman-line/role-authority/README.md` ⇒ test-relevant (`code`, `test-relevant-change`) — package README is a live test input (A3 regression).
   > - `plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json`, `…/openrouter-rcm-v1-conservative-projection-20260926.json`, `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p0-catalog-snapshot.v1.json` ⇒ test-relevant (`code`, `test-relevant-change`) — non-Markdown goal files are live test inputs (A3 regression).
   > - one row per additional path in the A3 measured read-sweep inventory ⇒ test-relevant.
   > - **End-to-end exploit regression:** a delta touching only `plugins/foreman-line/role-authority/README.md` (all five class hashes equal) ⇒ `decision: fallback`, `fallback_reason: test-relevant-change`, sweep invoked — the dual-review exploit must stay dead.
   > - any `skills/**` path with basename `README.md`/`AGENTS.md` ⇒ test-relevant (A3: rule 4a no longer reaches inside skill trees).

5. **AC6(a) — append to the canary note (R4):**

   > Detection-only: one head carries two same-named check runs (push + pull_request) and GitHub's duplicate-context resolution is undefined — a reused green can mask a canary red and vice versa (A-Q3). The closure evidence records this masking possibility beside every canary claim.

## R2 — emit before sweep (A-F2 = B-F3)

Code ruling (no spec text change beyond what C12/AC0 already demand): the `verify` emission — stdout record, `GITHUB_STEP_SUMMARY`, and all `GITHUB_OUTPUT` writes — completes BEFORE the fallback-sweep spawn. A test asserts the write-order precedes the spawn. Rationale: AC0 promises the record "on every run"; a timeout-killed sweep currently loses the record entirely, and the CI-P2 seam contract requires the effective decision available before sweep work.

## R3 — fail closed on missing output channel (A-F3)

Code ruling: when `GITHUB_ACTIONS==='true'` and no output channel is available, `decide`/`verify` throw (`classification-error`) and exit non-zero — a missing channel inside Actions reds the head visibly (C7) instead of green-lighting unvalidated heads. Standalone (non-Actions) runs keep working without the channel.

## Read-sweep mandate (binding on the rework)

Inventory = every read by ANY check of ANY of the 20 swept packages (and the runner/harness) into: `plugins/foreman-line/docs/goals/**`, `plugins/foreman-line/docs/transcripts/**`, root `docs/**`, and any `README.md`/`AGENTS.md` — from tests AND sources (module-load reads count). Report the inventory table in the completion claim (path → reading test/source → assertion type). Every inventory path classifies `code` with a regression fixture. If a reader of an ordinary-classified `.md` path is found, exclude its subtree (pin basename + location + value per SC #13) and say so.
