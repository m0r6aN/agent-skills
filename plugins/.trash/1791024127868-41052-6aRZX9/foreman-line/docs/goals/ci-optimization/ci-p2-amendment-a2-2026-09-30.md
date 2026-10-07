# CI-P2 — Coordinator-Ratified Amendment A2 (2026-09-30)

**Instrument:** spec amendment (SPEC-CONVENTION §11): exact replacement text, committed alone in the CI-P2 parcel worktree **before any implementing code**, commit message e.g. `docs(specs): CI-P2 amendment A2 (coordinator-ratified) — A1 event-class propagation`.
**Authority:** cross-spec propagation of Amendment A1 (OQ1 safe ruling: reuse eligible only on `pull_request`-class runs) into the CI-P2 spec, whose AC7 wording predates the ruling.
**Target file:** `plugins/foreman-line/docs/specs/active/CI-P2-deterministic-sweep-sharding.md` (the CI-P2 builder's own Allowed File; the amendment commit touches ONLY the spec file).

## Ruling being propagated

Under A1, `push`-class runs are never eligible for reuse (`decision: fallback`, `fallback_reason: event-class-ineligible`) and always run the full sharded sweep. The push-class duplicate of every PR head is therefore a **sharded canary**. CI-P2's seam and gate logic are unaffected (they consume the effective decision from `ci-reuse.mjs decide`); only the AC7 demo wording and the fallback-reason enumeration need the class scoping.

## Exact replacement text (place at the named sites; nothing else changes)

1. **AC7(1) — replace** "A reused push runs **zero shard jobs**" **with:**

   > A reused `pull_request`-class run runs **zero shard jobs** (A1: `push`-class runs are never eligible and always run the full sharded sweep — the push-class duplicate of every PR head is a sharded canary).

2. **AC7(3) — in the fallback enumeration** "relevant change, failed/pending/unusable source run, evidence uncertainty, or a `verify` re-verification flip" **insert** `event-class-ineligible (A1: any push-class run)` **after** "evidence uncertainty".

3. **AC7(4)(a) — replace** "eligible docs-only reuse push atop a verified-green head" **with:**

   > eligible docs-only reuse on a `pull_request`-class run atop a verified-green lineage (A1)

4. **AC7(4) — append to the three-case list:**

   > (d) canary case (A1): the head's `push`-class duplicate runs the full sharded sweep with `fallback_reason: event-class-ineligible`, recorded in the closure evidence as expected canary behavior.

## A3 propagation (added 2026-09-30, after the CI-P1 dual reviews)

CI-P1's amendment **A3** (`ci-p1-amendment-a3-2026-09-30.md`) re-derived the classification on measured evidence after dual reviews found the ordinary set covering live test inputs (blocker). Two consequences ride into the CI-P2 spec via this same A2 amendment commit:

5. **Constraints/AC1 area — append:**

   > **A3 baseline (A2 placement 5):** CI-P2's shrink-only re-derivation of the ordinary-documentation set starts from A3's shape-level rules (Markdown-only; never inside `plugins/foreman-line/**` or `skills/**`; reader-set exclusions per measured read-sweep), not from CI-P1's pre-A3 table. The pre-flight's expanded swept set (e.g. `authority-registry` reads goal docs and kickstarter content) shrinks the set further; every newly-found reader path becomes a regression fixture in CI-P1's classifier tests (shrink-only, C9).

6. **AC7 — append to case (d):**

   > Detection-only: GitHub's duplicate-context resolution for the two same-named runs on one head is undefined — a reused green can mask a canary red and vice versa (A-Q3); recorded beside every canary claim.
