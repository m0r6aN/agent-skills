# R31 test-only migration checkpoint

Authority: R31-full-run28-test-migration-ruling-20260907.md and independent companion review, integrated at a2c784d7df0ed13246f821c8c4ed4913c5ebbee5.

Only tests/semantic-invariants.test.ts changes among package files relative to implementation checkpoint 521214e4fa7e3475e2544ef1f1492638250437f6. Runtime, generated artifacts, README, other tests, dependencies and all eighteen sources remain unchanged. Revised test file SHA256: 8d8677cf464fa9e032d8c05978d015a669115f06c45787a65c0b69a694a233f5.

The rationale control now binds the exact 198-row historical prefix and complete independent four-row R31 suffix, including order and complete rationale text, and checks the four actual source locators/values/rule sets. The original historical excluded-row assertions remain intact. Unknown rows cannot be silently skipped.

The hermetic residual control creates the existing legitimate retirement fixture and a correctly chained generic successor, asserts validity before mutation, changes only its Git-object digest, and proves every other byte-equivalent field is unchanged by restoring that one digest and comparing the complete document. It retains the explicit generic hermetic residual, rejects the identical mutation on reserved R31 with its exact diagnostic, and retains the historical canonical-pin refusal. The shared live helpers and runtime custody checks are unchanged.

Verification: 30 scoped Biome direct exit 0; 31 typecheck direct exit 0; 32 focused regressions 82 pass / 0 fail / direct exit 0. No tests were added or removed by this correction, so the complete rerun remains 751 tests (573 semantic, 148 corpus, 30 other). Failed run28 remains published and is not a pass.

A new complete chain is required on this checkpoint. The evidence manifest builder is preparation only and will be executed after final evidence is staged.