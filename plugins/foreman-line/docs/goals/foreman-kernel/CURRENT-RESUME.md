# Foreman Kernel current continuation

Coordinator: Codex thread `01a07c0b-90eb-7bf0-88f4-0ca912ef87fb` under `authorization-20260907-unattended.md`.

- Live coordinator branch: `codex/foreman-kernel-unattended-20260907`.
- Immutable initial publication: `handoff/foreman-kernel-live-20260907` at `fe31042bbe4370cb81b38632720849983c7be04c`.
- Unchanged baseline: `codex/fk-p0-recovery-20260907` at `0ee165720f8d1e3a91eb283cb770400b23f61bf5`.
- R30 integration: `codex/fk-p0-r30-adoption-20260907`, docs-only integration `65c4714`; no package changes yet.

Read live charter/loop, authorization, adoption review, R30 amendment, source expectations and R30-plan-and-source-review-20260907.md. A1.8/A1.9 ledger and INF1-8 adoption are recorded; charter adoption, R30 plan and source expectations passed their independent document reviews. Runtime verification remains distinct.

Baseline recovery is complete at unchanged `0ee165720f8d1e3a91eb283cb770400b23f61bf5`: all ten sequential commands returned direct exit 0; 597 tests passed with no failures, cancellations, skips or TODOs. All 991 tracked hashes and three generated artifacts remained identical. Full evidence, 65-file SHA256 manifest and builder handoff are published under `evidence/20260907/round6/`. The coordinator independently checked manifest hashes, all command stream hashes/direct exits and tracked-file equality. See `FK-P0-round6-baseline-closure-20260907.md`. This is baseline verification, not adoption implementation acceptance or Gate 3.

The corrected R30 Step 0 mapping passed independent review at `8b33963`: 72 new components (37 IJ,21 PR,5 PD,9 NP), independently expected totals 541 rules/1583 items/198 audit/20 reconciliations. R30-implementation-ruling-20260907.md authorizes implementation in the dedicated branch under the unchanged exact28-file boundary. Source snapshot remains `65c471416e4a3916695815e951ffbe389288560e`; no source-set expansion or global resolver change. Final measured verification and two fresh independent code reviews remain outstanding. No merge or Stage F has occurred.

U1-evidence-contract-draft-20260907.md passed draft closure review recorded in U1-draft-review-20260907.md. Its concrete provider/protection/context/retention/schema selections remain pre-P18 dispatch dependencies; a reviewed draft does not satisfy implementation or promotion evidence.

FK-P1 Stage A preparation is complete: reviewed status:draft spec, explicit shaping decisions, two-layer advisory pass and schema-valid ShapingResult with epics:[] are published. Read FK-P1-shaping-review-20260907.md. No P1 activation or implementation occurred; merged P0 compatibility and remaining field-shape reconciliation still gate dispatch.

U1-provider-observations-20260907.md records read-only current GitHub configuration, workflow/run identities and official provider documentation. Existing rulesets/hosted CI are observed; protected verifier independence, attestation issuance and retained retrieval are not proved. No provider settings or workflow execution were changed. These observations narrow U1 selection work without satisfying pre-P18 gates.


## Published R30 implementation checkpoint

Branch `codex/fk-p0-r30-adoption-20260907` now publishes implementation `446700d47c2e162fcfa575d5a46b9247241a59c1`: nine exact Allowed Files changed. Focused79semantic+10corpus tests and checkpoint typecheck passed directexit0; full sequential verification is running against that commit. This is current implementation state, not only documents. It remains unaccepted: full chain and two fresh independent final code reviews are outstanding. Full-chain evidence is being captured in the implementation tree at evidence/20260907/r30/ and is not yet published as complete. R30.8/R30.9 and corrected mapping are committed before their dependent code; source65c4714 and all18governed paths are unchanged.

The coordinator loop's declared Current state and FK-P0 State cell now reflect R30 full verification. Only those operational regions changed; the implementation worktree retains exact source65c4714 bytes during verification. Published coordinator status may therefore differ from the implementation's historical operational text without changing governed rules or source identity.


Latest R30 verification disposition: fullrun26 returned686tests/683pass/3fail from legacy corpus assumptions; failed evidence and test-only corrections are published at c95a3158847368f57142c97030f26693d6ff45dc. Independent test-migration review approved those corrections and requires a stronger exact reference oracle before replacement full verification. Read R30-test-migration-review-20260907.md. Runtime/source bytes remain those of446700d; no acceptance or merge is claimed.
