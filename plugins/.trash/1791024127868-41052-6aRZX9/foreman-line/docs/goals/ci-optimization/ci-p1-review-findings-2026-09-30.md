# CI-P1 — Dual Adversarial Review Findings and Triage (2026-09-30)

**Parcel:** CI-P1 — Safe Documentation-Only Push Reuse (`feat/foreman-line-CI-P1` @ `a45a906`, 5 commits on `bc609ec`/`e5dce4d`).
**Reviews:** two independent fresh sessions per charter Invariant 5 (elevated risk). `ReviewCIP1A` — gate integrity (43m02s, verdict **incorrect**). `ReviewCIP1B` — evidence validity (45m25s, verdict **incorrect**). Both: findings are a floor; hostile-input probing licensed and used; both ended with clean-tree assertions (SC #10: no commits, no dirty files — A additionally ran all probes stdout-only with `GITHUB_EVENT_PATH` on the NUL device).
**Coordinator triage:** each blocker re-derived before ruling (paths re-read at the cited lines; the four reader paths independently confirmed as swept-test inputs by both reviewers' file-level citations).

## Triage table

| ID | Finding | Severity | Disposition | Ruling |
| --- | --- | --- | --- | --- |
| A-F1 = B-F1 = B-F2 (one root cause: ordinary-set under-detect) | `ordinary_documentation` exemption covers files swept tests demonstrably read: `plugins/foreman-line/role-authority/README.md` (read + `| Dn |`-table asserted by `role-authority/tests/reconciliation.test.ts:15-47`), `plugins/foreman-line/docs/goals/routing-currency-and-merit/source-evidence/pmc-binding-coverage-openrouter-20260926-v4.json`, `…/openrouter-rcm-v1-conservative-projection-20260926.json` (read + sha256/byte-length pinned by `routing-policy/tests/public-observation-producer.test.ts` and `hybrid-routing/tests/owner-context-integration.test.ts`), `…/rcm-p0-catalog-snapshot.v1.json` (read + deepEqual-pinned by `routing-policy/tests/catalog-snapshot.test.ts`). Exploit-probed end-to-end by BOTH reviewers: a delta touching only `role-authority/README.md` with equal five-class hashes ⇒ `decision: reuse`, sweep skipped, `test` green on a tree whose full sweep fails. | **blocker** (×2, convergent) | **fix** | Re-derivation ruling **R1** (below): shrink rules 4a/4b/4c with a MANDATED measured read-sweep of all 20 swept packages (findings are a floor — every reader path found flips to `code`); the four proven paths become permanent regression fixtures; the README-only exploit becomes a permanent end-to-end refusal test. Spec text amended (amendment A3, exact text). |
| A-F2 = B-F3 | `verify` emits its evidence record AFTER the in-step fallback sweep (writes happen in `main()` post-`verifyCore`) — comment claims before. A timeout-killed sweep ⇒ NO record anywhere, violating AC0 "on every run" and C12's ordering (CI-P2 seam). Gate outcome unaffected (timeout reds head). | major | **fix** | **R2:** emission (stdout + `GITHUB_STEP_SUMMARY` + `GITHUB_OUTPUT`) completes BEFORE the sweep spawn; test asserts write-order precedes spawn. |
| A-F3 | Missing `GITHUB_OUTPUT` ⇒ outputs silently skipped ⇒ both gated steps skip ⇒ `test` green with ZERO validation (only wiring path to green-without-validation). Unreachable on pinned hosted `windows-latest` (variable always set) but violates C7 "never a silent green". | minor | **fix** | **R3:** when `GITHUB_ACTIONS==='true'` and no output channel ⇒ throw (`classification-error`); standalone runs unaffected. |
| A-Q3 (canary semantics) | One head carries two same-named check runs (push + pull_request); GitHub's duplicate-context resolution is undefined — a reused green CAN mask a canary red (and vice versa). Pre-existing (OQ1/A5), Invariant 2 holds (the promise is verified-evidence-over-equivalent-inputs, which holds). | n/a (verdict, not defect) | **accept-as-documented** | **R4:** A1's canary claim is **detection-only**; the closure evidence records the masking possibility beside every canary claim. One clause added to the spec (amendment A3). |
| D3 (builder flag) | Stale "19" in AC2 justification rows 2/4 and C9 ("frozen-19"). | minor | **fix** (folded into R1) | The A3 justification/C9 rewrites remove the stale counts (A confirmed the remnants). |
| D4 (builder flag) | Degenerate `head_sha` may be null in fallback records vs AC0's `<hex40>`. | minor | **accept-as-documented** | Fallback records are never parsed back (C2/E10); A probed and found no reachable effect. |
| D5 (builder flag) | `unknown-path` vs `test-relevant-change` labels on unenumerated code shapes. | minor | **accept-as-documented** | Label-only; both fall back; E2 ruling stands. |

## What the reviews VERIFIED (not filed — evidence the claims held)

- The reuse chain itself is honest: forged-log non-ingestion binds; `parseEvidenceRecord`/`evaluateChain` re-validate every fact from API + git (E10); stale/tampered/failed/force-pushed/wrong-class states all fall back with pinned reasons (A probed each class).
- Required-check compatibility confirmed: both contexts report every head/mode; skipped sweep step leaves `needs.test.result == 'success'` correctly because `verify` decided; `integration-report` mirrors without masking; strict policy satisfiable.
- merge_context sufficiency for main-based PRs confirmed (approval's `merge-base HEAD origin/main` diffing and integration's `origin/main:<path>` reads are pinned by base-SHA + merge-base equality); chained reuse is sound by transitivity.
- Sweep exit-code propagation faithful everywhere (probe: exit 5 preserved); no `continue-on-error`; `actions: read` + `contents: read` sufficient for the two API calls; fork PRs fall back via `head_repository` lineage check; `pull_request` head_sha = branch tip on real runs (A probed live run 36513899142), so E8 is live code.
- Test claims verified by both reviewers' own runs: 90/90 + 17/17; D3/D4/D5 flags confirmed as described.

## Mandated focus questions

Both reviewers answered every field of the spec's `## Verification Plan` focus questions (transcripts: `history://ReviewCIP1A`, `history://ReviewCIP1B`). Notable negative results beyond the table: under-detect NOT closed (A Q2 — the hole is precisely the ordinary set, not the delta machinery: rename/case/newline/`::`/ESC/gitlink/mode-only/CRLF shapes all probed safe); trust-chain claims "exactly as trustworthy as today" hold except where the classification mis-derivation breaks verdict-preservation.

## Rework routing

One rework pass (fresh session, own Step 0 + test-count tripwire: baseline is 90 tests in `scripts/ci-reuse.test.mjs` — rework may only grow the count, and reports every delta) covering R1–R4 with the sweep mandate ("every reader path, not the listed four"). Re-review after rework: the same two focus areas, fresh sessions (the classification derivation is exactly where the first reviews earned their keep).
