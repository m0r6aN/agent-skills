# Integration attempt02 — inert Git symlink review

Verdict: **APPROVE the finite inert-file correction**, subject to parent inspection/publication before attempt03. This approves neither a completed fixture nor integration success.

Retained attempt02 at `C:/Users/clint/AppData/Local/Temp/fk-r31-main-integration-final-attempt02` failed on `Unsupported mode/type/case collision: .opencode/skills` during accepted-tree inventory. Its result records unchanged bare refs and no fixture or Node execution. This was an overly broad tree-materialization restriction, not a protected-source failure.

Read-only inventories at accepted `1747c1df7dfa4677d345390ac673c3d15c82b980` and main `476b8df6efe6c9974879957147449f61c34cd9a0` contain the same two Git symlink blobs:

| Path | Mode | Blob | Exact target text (no terminating newline) |
| --- | --- | --- | --- |
| `.opencode/skills` | 120000 | `7fc7d9f7be858ee62e454c529b3f8deddd83e1d2` | `../skills/` |
| `debug/latest` | 120000 | `83cc3f226b17278384e32056cfa8470b9ae43738` | `D:/Repos/agent-skills/debug/ca212ab3-8107-415b-9921-ac706b4f3fb9.txt` |

Raw Git blob bytes were independently compared against the new exact review-input target strings. No target path was opened or resolved. Equality at both merge inputs predicts unchanged entries; merged-tree equality was **not executed or observed here**. The runner now requires exact mode/blob equality across accepted, source, main and actual merge inventories before allowing materialization. A missing, additional or changed link refuses.

These are OpenCode skill-discovery and historical debug convenience links. Fixture execution uses explicit local Node/tsx authority CLI and generator entry paths; neither invokes OpenCode discovery or debug/latest. Read-only literal searches in accepted authority-registry/schema-scaffold source found no reference to either path. Both lie outside the protected package, source, goal, evidence and resolver closure. The final runner still walks reachable literal imports and refuses any collision; computed filesystem inputs remain subject to the already required independent closure review.

The correction permits inventory representation of 120000 blobs but does **not** create filesystem links. Only the exact `inert_symlinks` review-input entries may materialize, as ordinary regular files containing the original target bytes. Raw extraction does not traverse the relative skill link or the absolute debug target. An explicit reconstruction/limitation manifest records the logical Git modes and the physical inert representation. The alternate index retains the Git modes; filesystem symlink behavior is intentionally not reproduced or certified.

Controls retained or added:

- Case collisions, unsupported nonblob types and submodules remain refused.
- The reviewed link set must equal all links found across the four inventories; no broad mode waiver.
- Any protected-path equality or ancestor/descendant collision refuses, including sources, package files and resolver inputs.
- Any reachable local import at or beneath an inert path refuses before Node.
- Exact target bytes must match the reviewed strings as well as their Git object identity.
- Ordinary materialized-file/dependency reparse checks and all byte/idempotence checks remain active.

Only `verify-integration.py`, the `inert_symlinks` field of `review-input.json`, and this diagnosis were changed. AST parsing and target-byte comparisons passed; the runner was not executed. No Node, fixture, merge-tree, ref mutation, commit or push occurred. Attempt02 remains unchanged; parent review/publication and a separate attempt03 directory remain required.
