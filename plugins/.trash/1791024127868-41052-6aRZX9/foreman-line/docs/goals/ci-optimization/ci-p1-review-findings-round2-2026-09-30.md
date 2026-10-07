# CI-P1 — Post-Rework Review Findings and Triage, Round 2 (2026-09-30)

**Scope reviewed:** full change `bc609ec..761a8eb` (9 commits) by two fresh independent sessions per charter Invariant 5. `ReviewCIP1C` — gate integrity (34m44s, verdict **incorrect**, one defect). `ReviewCIP1D` — evidence validity (38m33s, verdict **correct**, one non-blocking P3). Both ended with SC #10 clean-tree assertions.

## What round 2 verified (the round-one blocker is closed)

- **Exploit re-killed by C itself:** README-only delta with equal class hashes ⇒ `fallback`/`test-relevant-change` + sweep, through the real `evaluateChain`. A 46-shape adversarial matrix (case variants, `.MD`/`.markdown`, `docs/Specs/`, unicode, newline/ESC/bidi, dot segments, near-miss corpora) found no ordinary-classified shape any check can read.
- **Read-sweep claim survived independent falsification (D):** different grep shapes (dynamic import, `fs.promises`, `existsSync` guards, computed `git show` paths, readdir walks, runtime-built strings) found ZERO reads of ordinary-classified tracked paths by the frozen-20 checks, runner, or harness. `authority-registry`'s goal-doc reads are correctly parked as unswept (CI-P2's C9 duty). All 23 READER_SET members classify `code` even with the exclusion removed (belt-and-braces claim TRUE); the readers seam is unreachable from production.
- **S1 channel hardens closed (D):** forged/empty/garbage/newline/1MB/extra-field `CI_REUSE_EVIDENCE` values all fall back with pinned reasons and the sweep's exit code; every record fact re-validated from API+git; emission sanitized; linear-time regexes confirmed.
- **Round-one chain attacks hold (D, B1–B16):** stale/null conclusions, non-ancestor vs unreachable, merge-context variants incl. null-pair, E8 merge-commit leak closed, E4 bounded scan safe, log non-ingestion binds — no behavior change.
- **Tripwire honesty mechanically verified (C):** `git diff a45a906..761a8eb` on the test file removes ZERO lines (pure append); the 90→133 delta reproduces exactly from an OS-temp copy of the old suite; 3 mutation spot-checks reproduced their claimed failure sets.

## Triage table

| ID | Finding | Severity | Disposition | Ruling |
| --- | --- | --- | --- | --- |
| C-F1 | The harness step runs TWO `node --test` commands in one pwsh `run:` block; pwsh step exit = last command's — a failing `foreman-line-ci.test.mjs` with a passing `ci-reuse.test.mjs` greens the step (silent-green class vs C7; the pre-parcel single-command step did not have this hole). | major | **fix** | **R5:** explicit per-command exit-code propagation in the harness step (between and after both commands), plus one shape pin test asserting the harness block propagates each command's exit (the defect IS the wiring shape; no local runtime test can reach it). |
| D-P3 | `verify` consumes the evidence channel's `source_run.run_id` as the pinned candidate without re-deriving AC3's newest-first selection — a forged record pinning an older green run evades the scan policy (reachable only by writing the channel = workflow tampering; same trust class as deleting test steps). | minor (P3, non-blocking) | **fix** (over the reviewer's accept-as-documented option) | **R6:** `verify` re-derives the E4 scan; if the derived decision is fallback ⇒ fallback with the derived reason; if derived reuse but the record's pin differs from the derived source ⇒ `evidence-unverifiable`; pinned-facts re-validation stays. Rationale: the realistic threat is wiring drift or a compromised action poisoning the channel (not just hostile PR authors, whose class the spec already concedes), and the fix's failure mode is safe-direction over-fallback. The C2 forged-pin probe becomes a permanent test. |
| D-Q2 residual | `docs/Specs/x.md` case variant classifies ordinary (case-sensitive specs-prefix exception) — zero readers, no shadowable read path today. | informational | **accept-as-documented** | Carried in C9's CI-P2 re-derivation duty; no reader exists to make it a gate hole at this head. Recorded so the CI-P2 shrink pass must decide it explicitly. |

## Rework 2 routing

Small mechanical rework (`ReworkCIP1` continuing on `feat/foreman-line-CI-P1`): R5 + R6, tripwire grow-only (133 baseline), runner files frozen. After closure + deterministic pass: ONE focused third-round review of the R5/R6 delta (the merge-gate integrity surface is exactly what these fixes touch), then Gate-3 prep.
