# GMF-P2B closure evidence (coordinator-assembled)

- Author role: coordinator, assembled at claim verification per `GMF-P2B-atomic-spend-transaction.md:707-721` ("The coordinator assembles `…gmf-p2b-closure-evidence.md` at claim verification (coordinator authority; not builder authority)"). This file is a bounded evidence index, not an approval. No receipt is minted; nothing herein grants Gate 2, Gate 3, or any external effect (`spec:720-721`).
- Authority basis: the GMF-P2B spec's Evidence section (ratified Gate-2 instrument) names this exact path as a coordinator assembly. Not an MRC-01-class propagation write (wrapper charter D8 does not govern this file; the spec grant does).
- Assembly: 2026-09-28, coordinator session 4 of `model-routing-chain-wrapper`, **retrospective** — assembled while the delivery is still uncommitted (see GAP-04). The SHA-256/line table below is therefore the hash anchor protecting the delivery bytes until the S1 commit exists.
- Mutation statement: this assembly created exactly this one file and modified nothing else. Wrapper records were updated separately under `docs/goals/model-routing-chain-wrapper/**`.
- Vocabulary: OBSERVED / RATIFIED / INFERRED / GAP / NOT_TESTED. Every claim carries exactly one label.

## Evidence index

- EV-01 — Base-reading ruling (record-cited + OBSERVED convergence): the **branch-state reading** (`spec:336-356` option 1) — P2B bases on the `codex/gmf-p2a-store-20260927` chain state; resolved base commit `7a6efe565d307cffca8abbae6273662b62ae8409` (builder branch tip, OBSERVED `git branch -vv` 2026-09-28). Post-landing the two readings **converge**: `7a6efe5`'s bytes are exactly the merged-main bytes for the consumed store files (wrapper session-3 blob verification, `gmf-p2a-closure-evidence.md` EV-05), so the merged-main reading names the same content.
- EV-02 — Delivery file inventory (OBSERVED 2026-09-28 in `D:/Repos/agent-skills-worktrees/gmf-p2b-atomic-spend-keon-systems-20260928`; `sha256sum` + `wc -l`):

  | File | State vs `7a6efe5` | SHA-256 | Lines |
  |---|---|---|---|
  | `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs` | modified, `git diff --stat`: +227 −0 (additive extension) | `b3fd028b252cd115847e15b8e3dd744fef546265872cec01be1930650a4ed541` | 1535 |
  | `src/Keon.Verify/AtomicEffectSpendTransaction.cs` | new (untracked) | `027742f91ce5e15e69de5ac96cc9bbb5ccfc08bb0353cb5dbaf20d9c0e61ce78` | 1001 |
  | `tests/Keon.Runtime.Tests/AtomicEffectSpendTransactionTests.cs` | new (untracked) | `674fbae55f5c560ad16b22b2c0d98cafc1e2811cdf4c4eb37761c242d084e4c7` | 1425 |
  | `tests/Keon.Runtime.Tests/AtomicSpendCrashSafetyTests.cs` | new (untracked) | `d7ae91dc3e235bce39ba138af9b43bbd32738a890c62a55651fe8962efefa3ca` | 256 |
  | `tests/Keon.Runtime.Tests/AtomicSpendNegativeControlsTests.cs` | new (untracked) | `e7cad9654b398c100fdebd195e3cf77a21e17204dc98edcd9cd0128e1ab04188` | 926 |
  | `tests/Keon.Runtime.Tests/EnvelopeNonAuthorityProofTests.cs` | new (untracked) | `ac1ef5de8002474914f952aff310bcf36d250b7e33eb2b8b8e6e2af9ad74df43` | 471 |

  Totals: 6 files = the complete Allowed Files write set, 5614 lines. These hashes are re-derivable from the worktree and MUST match at any later Step 0 or landing step (GAP-04).
- EV-03 — Git state (OBSERVED 2026-09-28): `git diff --name-only` = `SqlitePermissionSpendLedger.cs` only; `git diff --check` clean; 5 untracked files as tabled; branch `codex/gmf-p2b-atomic-spend-20260928` at `7a6efe5` — **the delivery is UNCOMMITTED** (GAP-04).
- EV-04 — Verification chain (record-cited; builder verbatim outputs → GAP-03): **1035→1079→1083 passed / 0 failed / 0 skipped**, zero weakening (floor 1035/0/0 = the landed P2A chain); build-integrity and KEON005 analyzer enforcement recorded green. Provenance: wrapper dispatch-table MRC-23 row (accepting session's summary) and the branch commit-message convention of the chain (`gmf-p2a-closure-evidence.md` EV-01 for the P2A analogue).
- EV-05 — Reviews (record-cited): two independent adversarial reviews **2/2 REJECT → 8 fixes landed with 3 mutation proofs**: R1 SECURITY (verdict-pass-before-shortcut + full presentation equality; pre-fix RED captured), R2 typed verdict carry (`VerdictFromCode` deleted), R3 REPLAY binding, R4 typed lineage denial, R5 IL call-graph checker (Reflection.Emit wrapper control), R6/R7/R8 sweep. Provenance: wrapper dispatch-table MRC-23 row.
- EV-06 — P2A-side seam integrity (OBSERVED, wrapper session 3): the consumed P2A store bytes on merged main are byte-identical to `7a6efe5` (`SqlitePermissionSpendLedger.cs` `0922cca8…`, `ReceiptPersistenceSchema.cs` `e8f3789b…`); P2B's additive extension applies cleanly onto landed main; the future landing rebases without conflict.

## GAP register

- **GAP-03 [GAP]** The builder's handoff — verbatim restore/build/test/analyzer/build-integrity outputs, raw-SQL observation outputs for AC(a)–(g) incl. crash-injection before/after row sets, `git diff --name-only`/`git diff --check` outputs, untouched-state confirmations for the Collision Risk worktrees — is not recoverable on disk: the builder session is gone (2026-09-28 `history://` lists no builder agents) and the handoff was consumed at claim verification by the accepting coordinator session. What survives: the acceptance summary in the wrapper dispatch-table MRC-23 row and the file-level state re-observed here (EV-02/EV-03).
- **GAP-04 [GAP — OWNER-GATED] The S1 base-SHA commit does not exist.** The builder is prohibited from committing (`spec:642-644`: "Any commit, push, PR, merge, or deployment … nothing in this parcel authorizes the builder to push"); the chain's commit+PR+merge is coordinator-presented under the green-contingent grant, which covers **the P2A chain only**. Until the owner extends it (wrapper stop-report act #1) or runs the landing by hand, `gmf-p2b-closure-evidence.md`'s EV-02 hashes are the only integrity anchor for the delivery, and GMF-P2C has no valid base commit (`GMF-P2C spec:746-748`). The complete accepted delivery sits uncommitted in the P2B worktree — data-loss exposure.

## Closure

Landing rides the P2B chain grant when granted (or an owner-run landing); the paper trail then rides that PR. This package mints no receipt, grants no gate, and closes nothing by itself; `docs/goals/model-routing-chain-wrapper/dispatch-table.md` remains the chain's state source.
