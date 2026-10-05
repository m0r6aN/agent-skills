# CI-P2 — Coordinator-Ratified Amendment A2 (2026-09-30)

**Instrument:** spec amendment (SPEC-CONVENTION §11): exact replacement text, committed alone in the CI-P2 parcel worktree **before any implementing code**, commit message e.g. `docs(specs): CI-P2 amendment A2 (coordinator-ratified) — A1 event-class propagation`.
**Authority:** cross-spec propagation of Amendment A1 (OQ1 safe ruling: reuse eligible only on `pull_request`-class runs) into the CI-P2 spec, whose AC7 wording predates the ruling.
**Target file:** `plugins/foreman-line/docs/specs/active/CI-P2-deterministic-sweep-sharding.md` (the CI-P2 builder's own Allowed File; the amendment commit touches ONLY the spec file). Placements 8 and 10 additionally anchor in the CI-P1 spec (the classification table's home) — see those placements.

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

## Step-0 rulings (2026-10-01, placements 7–8 added)

7. **`## Allowed Files` — append (SPEC-CONVENTION §4.8 amendment):**

   > **A2 placement 7 (Allowed Files widening, SPEC-CONVENTION §4.8 amendment):** `scripts/ci-reuse.mjs` and `scripts/ci-reuse.test.mjs` join this spec's Allowed Files, scoped to the classification shrink ONLY (the C9 ordinary-set re-derivation, its reader-set exclusions, and their regression fixtures — no decision-core, evidence-chain, or CLI changes). The measured re-derivation inventory (every reader path found among ALL checks of the newly-swept packages — tests AND sources, module-load reads included) lands as `READER_SET` exclusions, each pinned by a regression fixture per SC #13 (basename + location + value), grow-only. Rationale: this parcel's closure clause is false while the classifier exempts paths the expanded swept set reads; the widening is scoped and dies with this parcel.

8. **AC2 row 4 sub-rule (d) of the CI-P1 spec (the classification table's home): replace "begins with `specs`" with "begins with `specs` (case-insensitively)"** and append to the row's justification:

   > D-Q2 closed (A2 placement 8): spec-corpus near-miss segments are matched case-insensitively — `docs/Specs*`/`docs/SPECS*` fall to `code` (measured: zero readers at this head, but the case-variant naming trap is refused by shape). Implemented with a regression fixture.

**Placement-5 site ruling:** end of AC1 as a bold-lead paragraph (builder preference adopted).

## Placement 9 — waived-exclusion set (ratified 2026-10-01, developer decision "B — recommended")

9. **AC1 area (eligibility contract) — append as a bold-lead paragraph after the expected-skip semantics:**

   > **A2 placement 9 (waived-exclusion set — ratified 2026-10-01, SC #13 three-axis pinned):** the expected-skip set is amended from EMPTY to exactly the four entries below — the packages measured baseline-red at pre-flight (`190dfbe`, node 24.7.0 AND 24.19.0, each reproduced twice with identical signatures). Each entry pins identity + location + value:
   >
   > | identity | location | value (deterministic signature markers, measured 2026-10-01) |
   > | --- | --- | --- |
   > | `authority-registry` | `plugins/foreman-line/authority-registry/` | `R31 reviewed source mapping drift: M02-note` + 29 semantic failures (check: test) |
   > | `bypass-outage-harness` | `plugins/foreman-line/bypass-outage-harness/` | `FK-P17-bypass-outage-matrix.md` ENOENT + `mutationScope` TS2353 + `CTL-01/02 CHANNEL_EXEC_FAILED` (checks: test, typecheck) |
   > | `jev-decisions` | `plugins/foreman-line/jev-decisions/` | 6× `LEGACY_EXECUTION_RETIRED` (check: test) |
   > | `kernel-lease` | `plugins/foreman-line/kernel-lease/` | `STORAGE_CONSTRAINT_VIOLATION foreign-key 'goals'` at `kernel-state` insertGoal + 32 biome errors (checks: test, lint) |
   >
   > **Semantics (load-bearing):** an entry waives EXACTLY its pinned value, verified at check time — the package's checks still RUN and the waiver applies only when the failing output contains the pinned markers (run-then-waive; never an unconditional skip). A package wearing the same name at the same location whose output does NOT contain the pinned markers (including a green pass, and including a DIFFERENT red) re-gates immediately and normally — a changed red surfaces to its owning line instead of hiding behind the waiver. **Three refusal tests bind the axes independently:** same identity + different location ⇒ not excluded; different identity + same location ⇒ not excluded; same identity + same location + non-matching value ⇒ not excluded. **Expiry:** a dead entry (markers no longer matching) is removed by the next runner-touching parcel's Stage-F bookkeeping. The aggregation's expected-skip check binds exactly this set — any waived or skipped package outside it fails the gate (AC5 "unexpected skips"). **Follow-ups (owning lines):** `authority-registry` (R31 mapping drift + 29 semantic failures), `bypass-outage-harness` (missing FK-P17 spec + mutationScope typing + CTL gates), `kernel-lease` (FK constraint + biome) → foreman-kernel line; `jev-decisions` (6× legacy-execution-retired) → JEV line.

## Placement 10 — value-axis alignment (2026-10-01; record-alignment commit)

Placement 9's value column carries drafting-time approximations. Three review rounds later, the value axis is bound to the **deterministic failure identity** (round-2/round-3 findings: substring markers hid co-occurring failures; exact totals over-fit racy output; a name-collision slack let new failures waive). The authoritative value data is the shipped `WAIVED_EXCLUSIONS` structure in `scripts/foreman-line-ci.mjs`, pinned INDEPENDENTLY by golden fixtures of verbatim measured output (`scripts/foreman-line-ci.test.mjs`) — the spec records the semantics and the corrected headline values.

10. **After placement 9's semantics paragraph — append:**

   > **A2 placement 10 (value-axis alignment — the authoritative value semantics):** the "pinned value" of each waived-exclusion entry is the DETERMINISTIC FAILURE IDENTITY: per waived check = stable markers (presence literals, each proven constant across ≥10 measured runs) + counts (exact occurrence counts only where the count discriminates) + `failTotal [min,max]` of MEASURED values only + `failingSet` (deterministic failing-test names, mandatory presence) + `flaky` (named present-or-absent members), PLUS the measured equality `failTotal === |distinct failing names|` whenever names parse (a new failing test can never waive; measured variance can never spuriously re-gate), run-then-waive on clean numeric non-zero exits only (signalled/errored processes never waive). Where failing names do not parse (tsc/biome outputs), the total range is the SOLE guard and is stated as such. Corrections to placement 9's table's value column: `authority-registry/test` = **30** failures (30-name `failingSet`, `failTotal [30,30]`; not 29); `jev-decisions/test` = 6 named failures (`failTotal [6,6]`); `kernel-lease/test` = `failTotal [75,76]` — 74–75 deterministic members + the single named flake `CN-02 claim/release race` (CN-06 reclassified deterministic-present on 16/16 evidence); `kernel-lease/lint` = `biome` + `Found 32 errors` markers only (truncation-affected filename markers measured varying and DROPPED); `bypass-outage-harness/test` = 3 named failures (`failTotal [3,3]`), `/typecheck` = `error TS` ×2 with names-unparsed guard (`failTotal [0,0]`). The full pin data (every marker, count, range, failingSet, flake) is the shipped `WAIVED_EXCLUSIONS` structure, golden-pinned to verbatim captures — that structure is the value authority this table summarizes.

**Record note (provenance):** this file was accidentally truncated by a coordinator tool error on 2026-10-01 and rebuilt the same day from the parcel worktree's committed copy (placements 1–6) plus the coordinator's ruled texts (7–9, verbatim from the dispatch record) — no text was lost or altered in the rebuild.

## Placement 12 — variance closure 2 (2026-10-02; R18's data channel)

11. **After placement 11 — append:**

   > **A2 placement 12 (variance closure 2 — CI-environment members, 2026-10-02):** R18's rejection records (run `37011944112`, shard-outcomes artifacts) delivered the exact CI shapes the local variance base lacked. `authority-registry/test`: CI declares 32 failures vs local 30 — the two CI-environment members are `R31 actual decision blob correspondence detects Git replacement despite an unchanged diagnostic` and `R31 historical positive uses the pinned R30 implementation and its exact source subject` (git-environment-sensitive corpus tests); the universe becomes the 30 deterministic members + these 2 named present-or-absent members, `failTotal [30,32]`. `kernel-lease/test`: the concurrency race family is now fully enumerated — `CN-01 two-process claim race…`, `CN-02 claim/release race…`, `CN-03 expired-takeover race…`, `CN-04 same-binding apply race…`, `CN-05 same-key different-binding apply race…` have EACH been observed flaky (evidence: CN-01 diagnostic run; CN-02 across 16+ runs; CN-03/CN-04 in run `37011944112`; CN-05 in run `37007827805`) and join `flaky`; `CN-06`/`CN-07` remain deterministic; `failTotal [75,80]`. **Named residual (both):** an identity outside the enumerated universes re-gates until ratified — the designed surface-and-ratify loop (R18 records the observed layer + names each time), with expiry bookkeeping removing dead members.
