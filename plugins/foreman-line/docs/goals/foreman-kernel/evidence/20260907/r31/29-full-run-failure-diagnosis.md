# R31 full run 28 — failed, preserved

Test subject: 521214e4fa7e3475e2544ef1f1492638250437f6. Started 2026-09-07T17:26:56.8908434Z, ended 2026-09-07T17:53:58.9189788Z, 1622.030202 seconds. npm test direct exit 1. Full log and actual timing are retained in 28-full-test.log and metadata. No cancellation or stream rewrite occurred.

All 751 tests executed: 749 passed, 2 failed, zero cancellation/skip/TODO. The five non-semantic files reported 1 + 148 + 1 + 5 + 23 passes. Semantic reported 571 of 573 passes.

1. R13 every excluded audit candidate has one item-specific rationale assumes the rationale text itself contains the itemId. The independently approved R31 annotation rationale is source-specific prose without the old generated boilerplate. The complete R31 audit oracle test passes. Proposed test migration preserves all 198 historical rows and their exact original assertion, and compares each new excluded row to its exact independently reviewed R31 source disposition, with no unknown-row exemption.
2. AC4 O4 residual: a head Git-commit digest is not independently checkable previously described the unpinned shipped head. R31 deliberately pins the entire reserved record, including its exact decision evidence and Git digests. Proposed test migration preserves the generic future-head residual on the existing valid append helper after its existing legitimate amendment, retains historical pinned-record refusal, and separately requires the reserved R31 head to refuse the same digest mutation. This changes no runtime validation or resolver behavior.

These two test-only migrations were sent to the coordinator for ratification before edits. Full verification must be rerun on a newly published test-only checkpoint; run 28 is never presented as successful.