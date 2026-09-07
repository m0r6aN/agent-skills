# Foreman Kernel current continuation

Coordinator remains Codex thread `01a07c0b-90eb-7bf0-88f4-0ca912ef87fb` under `authorization-20260907-unattended.md`. Publishing a snapshot does not transfer ownership. Check the live owner before another session dispatches work.

Live coordinator branch: `codex/foreman-kernel-unattended-20260907`. Read `LIVE-PUBLICATION-MANIFEST.json` for captured source HEADs and exact Git-blob hashes. Immutable initial handoff: `handoff/foreman-kernel-live-20260907` at `fe31042bbe4370cb81b38632720849983c7be04c`.

## Current implementation and verification

Implementation branch `codex/fk-p0-r30-adoption-20260907` publishes `f8093410cead451f204d08ae25f3a70b34208213` (test-only checkpoint `9b4de111e78bd6682cf7c2d64989bd4adf803dce` plus evidence). Runtime/generated/source bytes remain those of implementation checkpoint `446700d47c2e162fcfa575d5a46b9247241a59c1`. Adopted source snapshot stays `65c471416e4a3916695815e951ffbe389288560e`, eighteen sources. Only nine Allowed Files changed for implementation; subsequent corrections affect the semantic test file only.

The unchanged recovery baseline `0ee165720f8d1e3a91eb283cb770400b23f61bf5` passed all ten commands and597tests, with991tracked hashes and three generated artifacts unchanged. Complete baseline evidence is published at `evidence/20260907/round6/`.

R30 focused79semantic+10corpus controls passed. First fullrun26 returned686tests/683pass/3fail from legacy assumptions incompatible with the ratified new corpus. Its complete failure is published. Independent review approved test-only migrations preserving strict baseline/current-legacy checks, then closed the exact source-reference oracle gap. Just-started run33 was superseded and canceled with explicit exit-1 metadata; it is not a pass. Replacement fullrun39 is running against publishedf809341 after npm ci/typecheck directexit0, with expected686=597+79+10. Complete new full-chain acceptance and two fresh independent final reviews are still outstanding.

Read `R30-test-migration-review-20260907.md`, `R30-implementation-ruling-20260907.md`, current `FK-P0-amendment-R30.md` throughR30.9, `R30-step0-mapping-20260907.md` and `R30-final-review-brief-20260907.md`. Independent checkpoint comparison confirmed all19 historical reconciliations unchanged and exactly one append. Current target counts:18sources/1583items/541rules/198audit/20reconciliations. Source-derived masked IDs, exact curation/reference guards and canonical role ordering are explicitly reconciled in those records.

The coordinator loop's Current state/FK-P0 State cell may differ from the implementation's historical operational text. Only declared volatile operational regions were changed; implementation source65c bytes remain untouched during verification. The manifest records this distinction.

## Current main integration dependency

A read-only merge simulation against main `476b8df6efe6c9974879957147449f61c34cd9a0` has no text conflicts, but two of eighteen governed source files differ from the adopted snapshot. STANDING-CONSTRAINTS adds normative rule14 for plugin/marketplace install resolution; FOREMAN-LINE-PLAN adds a historical migration note and updates a library identifier. See `main-source-compatibility-20260907.json` for exact hashes and diffs. R30 verification stays pinned to its adopted snapshot. Current-main registry integration requires explicit source adoption and verification; text merge success is not acceptance.

## Ratifications and preparation

Read live charter and loop, authorization, A1.8/A1.9 ledger closure and A4 infrastructure adoption. Ratifications stand; historical A2/A3 drafts are not silently activated. U1-evidence-contract-draft-20260907.md passed draft closure review; U1-provider-observations-20260907.md records actual GitHub configuration and supported options without claiming protected verifier independence or retention proof. Concrete U1 context/protection/provider/retention/schema choices remain preP18 dependencies.

FK-P1 StageA is prepared: reviewed status:draft spec, explicit decisions, successful two-layer advisory check and schema-valid `fk-p1-lifecycle-admission-decision-contracts-20260907.shaping-result.json` with epics:[]. See FK-P1-shaping-review-20260907.md. P1 implementation is not dispatched; mergedP0 compatibility and remaining field-shape reconciliation still gate activation.

## Next action and limits

Let owned fullrun39 complete; retain complete streams, direct exits and honest timings. Finish lint/validate/sweep/idempotence/integrity, publish complete evidence, then dispatch two fresh independent code reviews against the exact final candidate. Full verification is not inferred from focused tests or historical proof. No merge, StageF, deployment or spend has occurred. Human Gate3 remains the merge boundary. Original ambient dirty work and preserved source worktrees remain unchanged.
