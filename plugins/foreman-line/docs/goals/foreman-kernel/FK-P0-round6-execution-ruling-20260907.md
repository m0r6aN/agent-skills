# FK-P0 Round 6 recovery Step 0 and execution ruling — 2026-09-07

## Step 0 provenance and disposition

Read-only recovery agent `/root/fk_p0_recovery_step0` inspected preserved candidate `0ee165720f8d1e3a91eb283cb770400b23f61bf5`, current spec R24-R29, standing constraints, rework6 kickstarter, and September 4 ruling. It reported a clean source tree, seven controls present in corpus-sweep.test.ts:2009-2298, anchor-curation/publication assertions at :1941-1974, no ignored completion evidence, and no runtime result. The current standalone report supersedes the missing historical Step 0 plan as an execution plan; it does not invent historical verification.

Step 0 accepted. Execute the unchanged candidate first to establish an exact-SHA baseline. New September 7 charter text is NOT copied into this baseline worktree. Its later integration needs a separate coordinator amendment and measured verification, as the infrastructure review correctly identified.

## Authorized target and scope

- Worktree: `D:/Repos/agent-skills-worktrees/fk-p0-recovery-20260907`.
- Branch: `codex/fk-p0-recovery-20260907`.
- Head: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`.
- Exact Allowed Files: the existing 28-path ceiling in the active spec. `tests/support/assert-ok.ts` is tracked but outside that list and must remain untouched.
- Additional evidence-only write authority: coordinator goal directory `evidence/20260907/round6/`, exclusively assigned to this recovery agent for full logs, wrapper, metadata and final report. This does not expand package implementation authority or the governed source corpus.
- Original candidate, goal and published handoff trees remain untouched.

The developer's September 7 authority and this ruling permit installation, verification, generator checks, and narrowly failures-backed repairs within the exact ceiling. Before any repair, persist the failure and proposed root cause; stop for coordinator ruling on contract/source/Allowed-Files changes. No new source snapshot or corpus expansion in this baseline run. No merge, release, outward mutation, or acceptance claim.

## Sequential verification plan

From `plugins/foreman-line/authority-registry` in the recovery tree:

1. Record HEAD, branch, status, tracked/source and lockfile hashes, Node version and tool paths.
2. `node -v` (>=22 required).
3. `npm ci`.
4. `npx tsc --noEmit`.
5. `npm test` (its package script already serializes files and test concurrency).
6. `npx biome check .`.
7. `npx tsx src/cli.ts validate authority-enforcement-registry.yaml`.
8. `npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../`.
9. `npm run generate` with pre/post SHA-256 of all three generated artifacts.
10. `git status --porcelain=v1` and exact-scope diff against `51857a3a7796b393c0c0a68712f98c06e7015d79`.

Capture each command's complete stdout/stderr, immediate direct exit code, start/end/elapsed time and exact candidate SHA. Stop the chain on unexpected nonzero exit; retain full failure evidence. No guessed exits, no silent retries, no short timeout on a known expensive test. The full suite must cover named controls (a)-(g), their deletion/predicate mutations, anchor-keyed curation and 469-rule publication. Aggregate all per-file TAP totals including fail/cancel/skip; require >=596 total and zero failures, with any difference from historical counts explained. Verify negative CLI fixture behavior exit1 and invocation/read failure exit2 from the suite evidence or bounded additional probes.

Generator success requires exit0, byte-identical generated artifacts and empty final status. Progress logs only show attempted completion, not pass. Child-process termination or high CPU alone is not a test verdict. Check named fresh progress logs and actual subprocess state if a command appears stalled.

## Completion bar

Publish a final builder handoff mapping every claim to full logs, direct exits and hashes, or a precise failure report. Heavy Node work remains sequential across this host. Two independent reviews follow the deterministic baseline and cannot be replaced by this ruling or by the blanket approval.
