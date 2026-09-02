# FK-P0 — Coordinator Closure Check

**Owner:** Claude Code coordinator session (ownership transferred 2026-09-01).
**Subject:** `codex/fk-p0-canon-authority-enforcement-registry` @ `df8155a`.
**Rule applied:** claims are verified on disk before acceptance; wrong-shaped claims are
presumptively empty. No inherited R2–R13 review evidence exists, so nothing is credited.

## Verified on disk by the coordinator

| # | Check | Result |
|---|---|---|
| 1 | Diff scope vs merge-base `dd6bc4a` | **PASS** — 28 package files, exactly the 28 in the spec's Allowed Files. No extras. |
| 2 | Additions-only (`--diff-filter=MD` empty) | **PASS** — zero modifications or deletions of pre-existing files. |
| 3 | Coordinator-authored docs reported separately (AC1) | 4 files (charter, loop-directive, plan-review-findings, spec) — accounted for by AC1's own carve-out, not builder mutation. |
| 4 | `npx tsc --noEmit` (Node v24.7.0, PowerShell) | **PASS** — exit 0, no output. |
| 5 | `npx biome check .` | **PASS** — exit 0, 14 files, no fixes applied. |
| 6 | `npm test` | See "Deterministic pass" below. |
| 7 | Two independent fresh reviews (AC15) | Dispatched under this owner; see findings documents. |

## C1 — BLOCKER (merge sequencing, not code)

**FK-P0's branch carries a stale charter.** Both branches forked from `dd6bc4a`; `main` has no
`goals/foreman-kernel/` at all.

| File | on `fk-p0-…` | on `foreman-kernel-stage0-…` | |
|---|---|---|---|
| `charter.md` | 405 lines, `sha a69b19d69106` | 435 lines, `sha c19359374480` | **DIFFER** |
| `loop-directive.md` | `sha b7dd2ee3e6c6` | `sha f2e9c89a8df1` | **DIFFER** |
| `plan-review-findings.md` | `sha d2e5bc326845` | `sha d2e5bc326845` | same |

The FK-P0 copy predates ratified amendment **A1** (D21, the decision-path latency budget) and
the A1.8 ledger. **Merging FK-P0 to `main` first would land the stale charter as canonical and
silently revert a developer-ratified amendment that never reached `main`.** Nothing in the
verification chain would go red; this is exactly the silent-collision class.

**Required merge order:**
1. Merge the **goal branch** `codex/foreman-kernel-stage0-20260830` to `main` first (docs only:
   charter, loop-directive, ADR-001, A1/A2 records, kickstarters).
2. Sync `codex/fk-p0-canon-authority-enforcement-registry` with the new `main`, resolving
   `charter.md` and `loop-directive.md` **to `main`'s version** — FK-P0 has no authority over
   either file, and the spec's Forbidden section says so explicitly.
3. Re-run the deterministic pass on the synced branch, then merge FK-P0.

Both merges are human Gate 3 actions. This order is not optional.

## C2 — SHOULD-FIX (test-suite design)

The seven `tests/fixtures/reject-*.yaml` are each a full ~39,897-line copy of the registry,
differing from `pass-minimal.yaml` by **2–47 lines**; `pass-minimal.yaml` is itself a near-copy
of the shipped `authority-enforcement-registry.yaml` (39,897 lines), so its name is a misnomer.

| Fixture | Diff lines vs `pass-minimal` |
|---|---|
| `reject-contradictory-authority.yaml` | 47 |
| `reject-duplicate-rule.yaml` | 46 |
| `reject-stale-source.yaml` | 8 |
| `reject-identity-mutation.yaml` | 6 |
| `reject-missing-source.yaml` | 6 |
| `reject-location-mutation.yaml` | 2 |
| `reject-value-mutation.yaml` | 2 |

**~279,000 fixture lines encode ~117 lines of test intent.** Consequences the coordinator
asserts: the suite runs >25 minutes serially; every registry change must be mirrored into eight
40,000-line files or they drift silently; and no reviewer can see what a fixture tests without
diffing it. The natural shape is one base fixture plus seven small programmatic mutations.

This is plausibly a partial cause of the twelve-round rework spiral: each round's registry edit
had to be replayed across eight near-identical 40,000-line files.

**Correctness consequences are delegated to Reviewer B**, whose highest-weighted task is
empirically mutating each named axis to prove the negative fixtures still have teeth (AC11).
Maintainability alone is recorded here and does not block.
