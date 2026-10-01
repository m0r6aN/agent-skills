# CI-P1 — Completion Record (2026-09-30) — merge-ready except live demos

**Parcel:** CI-P1 — Safe Documentation-Only Push Reuse. **Branch:** `feat/foreman-line-CI-P1` (14 commits on `origin/main` @ `e5dce4d`). **Worktree:** `C:/Repos/foreman-line-cip1`.
**Status:** local chain complete and green; **live-demo acceptance (charter AC5 / spec AC6) and the human merge are HELD** by `stop-report-red-base-2026-09-30.md` (both remote integration lines red; 13/20 swept packages fail at the pinned base).

## Commit inventory (oldest first)

| SHA | Content |
| --- | --- |
| `bc609ec` | paper trail: goal records + shaped specs CI-P1/CI-P2 |
| `e7d7cb9` | A1 amendment (10 placements), spec only |
| `0d4c84c` | `scripts/ci-reuse.mjs` — decision core + decide/verify CLI |
| `e4d997a` | `scripts/ci-reuse.test.mjs` — AC7 fixture matrix |
| `daeb236` | workflow wiring (`actions: read`, decide, gated sweep, verify) |
| `a45a906` | rule-0 ordering fix (found by builder smoke) |
| `bd3b2e0` | A3 amendment (6 placements), spec only |
| `64aefcd` | A3 classification shrink + 23-path measured READERS set |
| `6e806a5` | emit-before-sweep + fail-closed channel + **S1: wire `CI_REUSE_EVIDENCE` into verify (was dead in production wiring)** |
| `761a8eb` | +43 tests (A3 regressions, exploit regression, R2/R3) |
| `34b26d9` | R5: harness step per-command exit propagation |
| `f687614` | R6: verify re-derives the newest-first scan |
| `3714b77` | +5 tests (R5 pin, R6 scan-derivation) |
| `a9e004a` | R5 pin asserts propagation semantics (round-3 R3-F1) |

## Verification chain

| Step | Result |
| --- | --- |
| Shaping | `ShapeCIP1` (35m) + cross-spec coordination with `ShapeCIP2`; coordinator lint; charter-AC mapping verified word-by-word |
| Amendments | A1 (OQ1 safe ruling; placements 1–10; Step-0 derivations E2/E4/E8/E9/E10) · A3 (read-sweep re-derivation; placements 1–6) — coordinator-ratified, each committed alone before code |
| Build | `BuildCIP1` (1h08m): Step-0 gate with 10 flags ruled; smoke found + fixed the rule-0 ordering bug |
| Deterministic passes (coordinator, node v24.7.0, `node -v` first) | #1: 90/90 + 17/17 · #2 (post rework-1): 133/133 + 17/17 · #3 (post rework-2): 138/138 + 17/17 · #4 (post rework-3): 138/138 + 17/17 |
| Closure checks (on disk, before every re-run) | Allowed Files exact at every stage; `scripts/foreman-line-ci.{mjs,test.mjs}` byte-stable throughout (sha256 `d28e28bf…`/`a50973b3…`, re-derived by the coordinator repeatedly); clean trees |
| Reviews round 1 (independent ×2) | `ReviewCIP1A` (gate integrity) + `ReviewCIP1B` (evidence validity): convergent **blocker** — ordinary-set under-detect (README + 3 goal JSONs are swept-test inputs; exploit-probed) — + emit-order + fail-open. Triage: `ci-p1-review-findings-2026-09-30.md` |
| Rework 1 | `ReworkCIP1` (1h26m): A3 shrink + measured read-sweep (23 readers, zero remaining ordinary reads) + R2/R3 + S1; 7 mutation families |
| Reviews round 2 (post-rework, independent ×2) | `ReviewCIP1C` + `ReviewCIP1D`: exploit re-killed (46-shape matrix); read-sweep claim survived independent falsification; S1 channel probes ×16 fail closed; round-1 attacks hold. Findings: harness-step exit-code silent-green (major) + verify pin-trust (P3). Triage: `ci-p1-review-findings-round2-2026-09-30.md` |
| Rework 2 | R5 (per-command `$LASTEXITCODE` propagation) + R6 (verify re-derives E4 scan; forged-pin scenario → fallback with derived reason); +5 tests; 4 mutation proofs |
| Review round 3 (focused) | `ReviewCIP1E` (49m): R5 wiring behaviorally correct under real pwsh probes; R6 closes D-P3 exactly (divergence strictly narrower); one finding R3-F1 — the R5 **pin test** bound tokens, not semantics (3 silent-green mutations passed). E supplied a verified predicate fix + mutation matrix |
| Rework 3 | `a9e004a`: E's verified regex predicates, byte-exact; mutation matrix reproduced (M-C/M-E/M-F/M-B each ⇒ single R5-pin failure). Accepted on coordinator closure + deterministic pass #4 (fix text and matrix were the reviewer's own validated artifact; a fourth review round would be ceremony) |
| Live CI evidence | **HELD** (red base). The PR's runs document the fallback path live; AC6 demos run once the base greens — demo plan below |

## AC status

| Charter/spec AC | Status |
| --- | --- |
| AC1 behavior record (named refs, two cases distinguished) | DONE (A1 placement 9 corrected the 20-package record) |
| AC2 classification + five-class equivalence | DONE (A3 shrink; Markdown-only ordinary; 23-path measured READERS; E9 null-pair bytes) |
| AC3 evidence-based reuse (API + git-bytes chain) | DONE (E8 head-sha derivation; E4 scan semantics; S1 channel wired) |
| AC4 required-check compatibility | DONE as designed; **live demonstration part of the HELD demos** |
| AC5 fallback totality | DONE (pinned A1-E3 vocabulary; every fallback path sweep-invoking with the sweep's exit code; R3 fail-closed) |
| AC6 demos (local + live) | Local DONE (138 tests incl. exploit regression + 4-mutation proofs); **live HELD** — plan below |
| AC7 fixture matrix | DONE (138/138; grow-only across three reworks: 90 → 133 → 138; pure-append test history verified by C) |

## AC6 demo plan (HELD — execute after the base greens)

Ordered pushes on the parcel PR (base `main`), from `BuildCIP1`'s plan (full detail in its claim):
1. **Seed:** the parcel code push → PR-class `fallback` (`no-prior-run`), sweep runs and must go GREEN (seeds the lineage); push-class twin `event-class-ineligible` (canary).
2. **Eligible reuse (a):** docs-only push (`docs/goals/ci-optimization/**`) → PR-class `reuse` pointing at push 1's run, five-class hashes equal, sweep NOT executed, both contexts green; push-class twin sweeps (canary, detection-only — masking possibility recorded per A-Q3).
3. **Test-relevant (c):** push touching `docs/specs/**` or a package source → `fallback` `test-relevant-change`.
4. **Missing evidence (b):** docs-only on a fresh branch → `fallback` `no-prior-run`.
5. **Incompatible (b):** advance `main`, then docs-only → `fallback` `merge-context-mismatch`.
6. **History rewritten (b):** force-push a docs commit → `fallback` `source-head-unreachable`/`not-ancestor`.
7. **Tampered (b, optional live):** forged record state → fallback (pinned by unit tests; live unit-test citations acceptable).

Each demo records run IDs, head/base SHAs, and the emitted evidence records; cost claims use the shared queue-separated methodology.

## Residuals (accepted, named)

1. **A-Q3 canary masking:** duplicate same-named contexts on one head resolve undefined in GitHub; detection-only claims (recorded at every canary claim site).
2. **Shape-pin residual (E):** an inverted comparison guard (`$LASTEXITCODE -eq 0`) passes the R5 shape pins — documented, out of pin scope.
3. **`docs/Specs/` case variant (D-Q2):** classifies ordinary (zero readers today) — CI-P2's C9 re-derivation must decide it explicitly.
4. **D4 degenerate `head_sha`:** fallback records may show null `head_sha` off-Actions; records are never parsed back (C2/E10).
5. **OQ3 (developer lever):** dropping/filtering the `on: push` duplicate runs is the largest remaining structural CI waste — out of charter scope.
6. **Trust boundary (stated in-spec):** the PR author controls `scripts/ci-reuse.mjs` and the workflow at the validated head — same class as today's runner; the chain's claims are scoped to evidence-source forgery.

## Live evidence captured (2026-10-01) — demo case 1 records

Seed push (paper-trail head `4819c0acea51688818066df217ed7b5cb7502727`, PR #124) produced both expected records, verbatim from the decide-step logs (runs `36812259542` pull_request / `36812254813` push):

| Run | `decision` | `fallback_reason` | `base_sha` | `source_run` |
| --- | --- | --- | --- | --- |
| `36812259542` (pull_request) | `fallback` | `no-prior-run` | `e5dce4d03c4b83b8646c9517967c1554204e2db3` | `null` |
| `36812254813` (push twin) | `fallback` | `event-class-ineligible` (A1 canary) | `null` (E9 null-pair, push payload) | `null` |

`head_sha=4819c0ac…` and the `code`/`specifications`/`workflow` input hashes are **identical across both runs** (e.g. `code=83ccd8560cf7…`, `specifications=e1665fb9689d…`, `workflow=a4e55c3318ea…`) — same head, same git-bytes derivation, two event classes. Full `CI_REUSE_EVIDENCE` JSON emitted to log + step summary in both runs; `Actions: read` visible in both token permission blocks (F2 live); harness step green with the full 138+17 suites (R5 live); sweep executed on both (fallback wiring), verify step skipped on fallback; `integration-report` mirrored the failure unmasked. Sweep tables match the recorded 13/20 base red exactly. Both runs ≈5m40s test job (queue ≈0 at this hour).

Demo cases 2–6 remain held behind the red base (case 2 needs a GREEN seed — the seed sweep is red on the 13 pre-existing package failures, exactly the F9 valve).

## What remains for full closure

1. Green base (developer action — stop-report options A/B).
2. The AC6 live demos (plan above).
3. Human merge (Gate 3, RS-2.1: main/PR merges are human-owned).
