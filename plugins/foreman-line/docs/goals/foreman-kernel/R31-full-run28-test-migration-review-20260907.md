# R31 full run28 test migration review

Verdict: approve the two proposed test-only migration directions subject to the precise controls below. They reconcile old test subjects with independently approved R31 contracts without weakening the intended guarantees. This is a bounded contract/test-plan review, not review of a completed correction or a fresh final implementation verdict.

Read candidate `521214e4fa7e3475e2544ef1f1492638250437f6`. The reported direct-exit1, 749/751 run remains failed evidence; this review does not convert it into a pass. No Node, tests, installs or package edits were performed.

## Audit rationale test

`tests/semantic-invariants.test.ts:2128–2135` applies the historical item-ID-substring rationale convention to all current audit rows. The approved R31 annotation/M03 rationales are item-specific complete sentences without literal item IDs. Their exact strings were approved before generation. Runtime `src/validate.ts:2123` requires the complete 202-row expected audit, including exact R31 rows; changing those strings merely to satisfy the older universal test would contradict that reviewed mapping.

Preserve the original rationale assertions over all 198 historical rows, bound to the exact accepted R30 registry. Assert that the current first198 rows deep-equal that entire historical prefix, that the independent source-authored oracle has exactly four rows, and that the complete current audit equals historical198 plus those four in their reviewed order. Keep the empty ruleIds, non-null exclusion and non-boilerplate assertions on historical excluded rows. Do not filter away records by rationale text or skip arbitrary rows after an unchecked index. Do not import runtime R31_AUDIT_ROWS as the expected new oracle. The existing independent four-row equality around line5875 and historical-prefix equality around line5930 should remain; the localized rationale-test change must not retarget the shared r13Audit/default full-registry helper.

## Hermetic Git-digest residual

`tests/semantic-invariants.test.ts:4415–4436` describes the old shipped head as exempt from exact record binding. R31.5's reviewed finite record intentionally removes that premise for the reserved R31 record: `src/validate.ts:2812–2822` compares the complete record regardless of head position. A changed digest must now be rejected there. Exact equality is still distinct from independently reading a Git object's bytes, so preserving the generic hermetic residual is appropriate on a nonreserved appended successor.

Use a valid successor fixture with an actual bounded manifest change and complete chain. Assert its positive baseline is valid with no violations before the attack. The existing rechain helper refuses a no-op append because it creates a manifest self-loop; rechain(full) without a legitimate manifest change is not an acceptable control. Do not disable validation, delete the R31 predecessor, rewrite its pins or loosen runtime admission to obtain the positive baseline. The fixture is a hermetic diagnostic subject, not an assertion of Git custody or permission to publish an unreviewed migration.

Then mutate only one successor Git-object digest to a distinct well-formed64hex value. Assert the edit is non-no-op, references/chain commands/source bindings and all prior21 records are unchanged, and the hermetic validator still reports valid with zero violations. Keep the test name/comments explicit that the residual concerns the generic nonreserved successor, not the reserved shipped R31 head or repository-aware sweep.

Separately mutate that digest on the actual current reserved R31 record and require MIGRATION_EVIDENCE_INVALID with the exact-R31-record diagnostic. Retain the existing historical pinned-record control and its canonical-pin refusal. These controls prevent a broad rejection or an unrelated invalid fixture from masquerading as residual coverage. Preserve the repository-aware actual-Git-byte verification tests; the generic hermetic acceptance result must not imply that sweep accepts fabricated object evidence.

## Boundary

Only these two test subjects need migration under the reported failures. Keep all other live validation, current-head mutation, historical preservation and independent source-oracle assertions intact. The actual corrected diff and focused direct results still require inspection before claiming closure; a subsequent full run remains required. The only reviewer mutation is this coordinator report, with no commit.
