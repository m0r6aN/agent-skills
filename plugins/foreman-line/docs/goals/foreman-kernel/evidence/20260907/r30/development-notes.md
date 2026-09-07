# R30 development evidence notes

The untouched Round6 baseline is separately recorded by the coordinator. These logs concern implementation increments, not final acceptance.

- 01 npm ci: exit 0; no dependency changes.
- 02 red adoption count: exit 1 as expected against unadopted sample (1525 versus source-authored expected 1583).
- 03 typecheck: exit 1 because new migration code referenced a helper local to the historical builder. Added the same local command-evidence serialization to the new migration builder.
- 04 typecheck: exit 0.
- 05 generation: exit 1 at C04. Post-R13 ledger anchor identity was recomputed from shifted lineHint because the freeze stopped at the R13 snapshot. Extended the existing anchor-keyed freeze through exact prior shipped66a514d inventory; no identity algorithm change.
- 06 generation: exit 1 at L01. Reviewed mapping had raw loop lineHints instead of masked-projection lineHints; independently reviewed coordinator correction adopted L01-L04 item IDs c98e1f76aeb5,d0e8b87bbcc3,de1bd9760493,923c5c059572 with masked hints84,86,88,90. Source values/locators/counts unchanged.
- 07 generation: exit 0, sources18/items1583/rules541.
- 08 typecheck: exit 1 for three test typing mistakes (explicit InventoryItem annotation, discriminated result assurance access, operationId field). Corrected tests without weakening assertions.
- 09 validate: exit 1. Full JSON retained. Compatibility issues: exact reviewed paraphrases encounter a second per-reference literal predicate; corroborating references require reciprocal inventory links; six singleton component-suffixed rules encounter the old singleton-ID check; eighteen role arrays require schema-enum ordering. Coordinator reviewing narrow explicit corrections; no global bypass is permitted.
- 10 typecheck: exit 0.
- 11 Biome write on six intended source/test paths: exit 0 with warnings/info; formatted five files. Further final cleanup/check pending.
- 12 independent mapping shape/count controls: exit 0, two tests passed; does not prove full registry validity.

Final chain, complete historical/pin validation, source sweep and two independent reviews remain pending. No increment's green result substitutes for them.

## Follow-up increments and checkpoint

- 13 typecheck: exit 0 after approved R30.9 correspondence and reciprocity controls.
- 14 generation: exit 0.
- 15 validation: exit 1, eighteen role-order mismatches. The first edit missed Biome-inline literal arrays. Corrected only reviewed M/Q/K enum ordering; memberships unchanged.
- 16 generation: exit 0 after corrected role ordering.
- 17 head-pin validation: exit 0, full validation true with zero violations; canonical new-head pin recorded in JSON and validator.
- 18 focused semantic controls: exit 1, 62 passed and 17 failed. Fifteen positive tests confused the resolver outcome RESOLVED with its separate decision field; two duplicate-edge probes reached the existing schema uniqueItems refusal before semantic checks. Coordinator approved correcting these expectations while retaining exact decision, controlling IDs and human-ratified assurance assertions. No resolver behavior changed.
- 19 focused semantic controls: exit 1 due to a missing newline in test editing; syntax corrected.
- 20 focused semantic controls: exit 0, all 79 passed, zero failures/skips/cancellations/TODOs.
- 21 focused corpus controls: exit 0, all 10 passed, zero failures/skips/cancellations/TODOs.
- 22 final targeted Biome format: exit 0; formatted two intended files, sixteen existing-style informational suggestions remain non-failing.
- 23 checkpoint typecheck: exit 0.

Code checkpoint: 446700d47c2e162fcfa575d5a46b9247241a59c1, nine allowed package files. Full verification is bound to this commit. Expected full-suite floor is 686 tests: preserved baseline 597 + 79 semantic additions + 10 corpus additions. This is an expectation established before the full run, not a generated result. Final chain and independent acceptance remain pending.

## First complete run and historical test migration

- 24 final npm ci: direct exit 0; 25 final typecheck: direct exit 0.
- 26 complete npm test: direct exit 1, 686 tests, 683 pass, three failures, zero skip/cancel/TODO. Full streams remain intact. R4 assumed no corroborating references globally, R5 assumed literal basis correspondence globally, and R22 searched for the former head prose globally. These conflict with the reviewed R30.8/R30.9 finite correspondence and required preservation of the former head as history.
- Coordinator approved test-only migration: exact66a baseline and current legacy rules retain the old strict checks; R30 has the explicit reviewed 58 corroborating rules/67 reciprocal edges and full source-authored oracle controls. Every basis remains nonheading. The current-head rewrite assertion uses its actual prior topic and preserves all 19 historical records. Refusal assertions remain unchanged. No runtime code changed.
- 27 repair formatting: direct exit 0. 28 focused historical controls: direct exit 0, three tests passed. Final two explicit count/history assertions added before the second checkpoint and will be rechecked.
- Timing recovery for 24–26 is labeled as filesystem-inferred where no clock was captured. Live OS process creation and explicit observed completion are separate evidence, not invented command start/end equivalents.

The first complete run is failed and unaccepted. A new test-only checkpoint and a fresh full sequential chain are required; 26 is never overwritten.

## Superseded second run and strengthened independent reference oracle

- 29 repair formatting and 30 final historical focused checks: direct exit 0; all three controls pass with explicit58 corroborating-rule count and19 historical-record preservation assertions.
- Test-only checkpoint0a43bbb and failed evidence checkpointc95a315 preserve the first complete failure honestly.
- 31 npm ci and32 typecheck: direct exit0.
- 33 full suite started before the independent review's required exact-reference oracle finding arrived. Coordinator explicitly authorized cancellation of the verified owned npm subtree only. Direct exit -1; process custody, start/end metadata and cancellation reason are retained. This is a superseded incomplete run, not a pass or new correctness failure.
- 34 oracle formatting: direct exit0. 35 focused independent oracle plus historical repairs: direct exit0, five tests passed. The oracle derives53 exact sourceRef pins from the reviewed appendix and72 identities/reference lists from source-authored mapping conventions. It checks designated basis and ordered refs for all72; exact reciprocal target sets for all inventory items preserve baseline links. No runtime constants or generated values select expected refs, and no runtime code changed.

Fresh complete chain remains pending against the replacement test checkpoint; expected floor remains686 because existing tests were strengthened rather than removed or split.
