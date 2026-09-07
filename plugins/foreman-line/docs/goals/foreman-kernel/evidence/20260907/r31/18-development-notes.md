# R31 development evidence

This is development evidence, not final acceptance. Source subject remains 8d500704c9e3d6d8b652bbe838aa3623f88203fc; initial implementation authority is 2ed7569afae2ea23e77c4279b5cee86709814595. The accepted Step0 artifacts 01–10 remain unchanged.

- 11: Two source-authored red controls ran against unchanged R30 package data. Direct exit 1, two failures as expected: the live counts/source snapshot are still R30, and the inserted annotation takes the privileged thesis identity.
- 12: Initial implementation typecheck, direct exit 0.
- 13: Initial generation, direct exit 0. Generator compares the adopted binding manifest against independently reviewed 605f9c370c62cdbf619d1f65583a2404311d69cfc8c0fcc7c7867959b4adf4d5 and new record against independently reviewed 73b921477e09f2bcf20c4cf27d182221746c6cd85e2948a82f573e465177bf33 before returning the registry. These values originated in committed Step0 source expectations, not generated output.
- 14: Hermetic CLI validation, direct exit 0. Counts 18 sources / 1585 items / 542 rules / 202 audit / 21 reconciliation records.
- 15: Test authoring typecheck failed directly with TS7022 at the complete item correspondence test. Corrected the inferred recursive lookup with explicit InventoryItem | undefined. No runtime behavior changed for this fix.
- 16: Focused semantic tests (R31, R30, affected R13/R5/classification and R22), direct exit 0. Full stream and timing metadata retained. Further named R31 controls were added after this focused run and require another focused run before the final suite.
- 17: Focused corpus run preserves its own complete stream and direct metadata. The historical implementation positive was added after this run started, so it requires its own later focused execution.

Every numbered command has a separate full stdout/stderr log and start/end/elapsed/direct-exit metadata. Raw Windows transcript bytes are retained. No final verification or independent-review acceptance is claimed here.Run 17 completed direct exit 1: 21 pass, 2 fail. Both pre-existing positive corpus controls found the unchanged numeric coverage ceiling (>13), which falsely reported approved constraint 14 as uncovered. Advanced only current standing coverage and protected-exclusion recognition to 14; historical thirteen-rule reconciliation arrays remain unchanged. No parser, source, alias or classification exception was widened.

- 19: Test authoring typecheck direct exit 1: explicit Buffer inference and AuthorityResolution union narrowing were required. Added a Buffer annotation, checked reasonCode presence, and treated the controlling ID union as its declared readonly string array for membership comparison. No runtime behavior changed.
- 20 and 23: Scoped Biome formatting runs, direct exit 0. Formatting touched only the six allowed TypeScript files. Biome reports informational style suggestions and non-null assertion warnings; no lint errors or unsafe autofixes were accepted.
- 21: Focused semantic run, 154 pass / 0 fail / direct exit 0.
- 22: Focused corpus run, 25 pass / 0 fail / direct exit 0. This includes actual M01 source mutations, decision Git-blob replacement, rejected source alias displacement, the pinned R30 implementation/source positive, and continued rejection of unreviewed standing rule 15.
- 24: Typecheck, direct exit 0.
- 25: Final focused semantic run, 163 pass / 0 fail / direct exit 0. Added explicit reserved alias uniqueness and raw-candidate suppression, tested after repairing links and appending a successor. This closes the incidental-manifest-only refusal alternative; no global identity or classification behavior changed.

The intended complete suite floor is 751 meaningful tests: accepted R30 686 plus 54 R31 semantic controls and 11 R31 corpus controls. Existing historical count/delta tests use only their named pinned R30 subject; all current validator/resolver controls remain live. Current and historical reciprocal-set assertions both run, with M01 supplied by the separately reviewed R31 source oracle. Expected file counts: bare 1, corpus 148, dependency 1, parity 5, schema/CLI 23, semantic 573. These are a pre-full-run coverage expectation, not a full-suite pass claim.

The code checkpoint is ready after focused verification. The complete serial acceptance chain and fresh independent final reviews remain pending.
