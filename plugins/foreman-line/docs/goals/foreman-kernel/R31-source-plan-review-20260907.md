# R31 source-adoption plan review — September 7

Verdict: **APPROVE the finite R31 plan envelope at `106fd5893b1d81480cb208ae19109dfd9771bd42`.** No remaining blocking plan finding; implementation remains subject to its explicit nondispatchable prerequisites and independent exact mapping. The risk controls and interpretation details below guide that mapping and do not demand absent Step0 literals as a prerequisite for this plan verdict. This is not a final R30 code-review verdict, a run-39 result, or full-main integration acceptance.

## Reviewed evidence and scope

- Coordinator draft `main-source-impact-20260907.md` at `27d7b697bb4f5ee73ee394f82e2704b4e3a9a8c0` and its exact adjacent `main-source-compatibility-20260907.json`.
- Concrete coordinator proposal `FK-P0-amendment-R31.md` at `106fd5893b1d81480cb208ae19109dfd9771bd42`, read after the initial impact analysis. It reserves R31 and explicitly carries the finite source scope, exact source-first commit, conditional source intent, version-aware identity migration, historical preservation, nine-file ceiling and nondispatchable review gates discussed below.
- Actual committed generator, validator and type definitions at candidate `f8093410cead451f204d08ae25f3a70b34208213`, read using Git object access. No builder code was executed or modified.
- Read-only diff of adopted source `65c471416e4a3916695815e951ffbe389288560e` against simulated tree `2a7343795cfbf4f8a1f0d36f1b361960cfba5bb7` in the separate bare repository. It confirms the standing-rule addition and the two plan edits described by the compatibility JSON.
- The JSON records 18 compared sources, two changed blobs, zero text conflicts, main `476b8df6efe6c9974879957147449f61c34cd9a0`, and the fixed R30 candidate. Its clean text simulation does not establish registry validity. This review does not independently rerun all 18 blob comparisons or any runtime checks.

M01–M03 are a coherent source-diff denominator: one new conditional standing list item, one new historical annotation with an induced thesis relocation, and one changed historical paragraph value. The induced relocation must be counted in locator/binding deltas even though it is not a fourth edited source unit. Preserve the proposed nine-file builder subset; coordinator source/spec records remain outside builder authority.

## Source-first decisions and acceptance risks

### M01 condition and assurance — high-impact risk addressed by R31.2

Draft lines 35–41 correctly identify a binding conditional obligation, but "source-intent assurance" is prose, not an enum. The current `Applicability` and `AuthorityQuery` contain goal, role, stage, operation and host axes; neither has parcel kind or an install-verification result. They cannot distinguish a plugin parcel from another parcel using otherwise identical queries.

Recommended recorded disposition: publish one complete M01 obligation using `independent-review-human-judgment`, `REQUIRE_HUMAN`, `independent-reviewer`, and exact `human-ratified` source assurance under a separate finite R31 reservation. Preserve the entire plugin/marketplace condition and all four verification-chain links in the exact semantic claim/statement. This records a review duty; it does not assert that the kernel evaluates parcel kind, validates an installation, or imposes a new approval gate on an already authorized install/publication.

Map builder applicability through the existing axes and give the rule a source-authored conditional subject. Consultation of that subject returns the conditional obligation, not proof that the condition is true. Explicitly state that condition selection/evaluation remains outside this resolver contract. Do not invent an unsupported negative test claiming that identical query tuples distinguish plugin and non-plugin parcels. Positive builder queries and negative role/operation queries must instead test the actual chosen arrays; source mutations must prove that removing the condition or any verification-chain clause is refused.

Preserve the existing all-Foreman standing-rule source scope where applicable without claiming that the current public query API accepts other goal IDs. No new schema dimension, ALLOW rule, principal, external effect, or global classification exception is needed. Source ratification derives from the recorded successor decision, not a successful test.

### Thesis relocation — high-impact risk addressed by R31.2 and R31.4

Draft lines 53–55 identify a real implementation hazard. The existing generator special-cases the `two-gate-thesis` target before frozen-ID lookup; later legacy-rule lookup also consumes the target map. Changing only one anchor can leave another consumer assigning the thesis ID to the annotation, dropping the rule, or restoring the stale paragraph-1 reference.

Before code, independently map both approved source versions: exact commit/source identity, annotation locator/value, thesis locator/value, canonical item/rule IDs, aliases, designated basis and complete refs. Preserve `item.two-gate-thesis` and its rule at the actual thesis; give the annotation a distinct item identity. Inventory every consumer of the old target, frozen mapping and alias. Apply the finite version-selected current correspondence consistently to discovery, curation, rule linkage, validation and tests. Neither a caller-selected version nor matching prose alone authorizes relocation.

An unsupported version/annotation/value/location combination must fail explicitly rather than fall back to the old privileged anchor or generic frozen lookup. Keep historical reconciliation records and refs byte-identical. If an existing historical ref needs accommodation for its old locator, bind any compatibility entry to its exact record ID, complete old ref and historical snapshot; do not add an item-ID-only exemption. Do not rewrite `LEGACY_RECONCILIATION_SOURCE_REFS` broadly.

Clarify the requested two-version verification at draft line 114: preferably run the pinned old implementation against its old source and the successor against its new source, plus explicit version-selection unit controls for the finite correspondence. If the successor generator itself must regenerate both full registries, specify the exact version-selected source set, required rules, manifest/head and output expectations; a current-only new-rule requirement would otherwise make its historical mode impossible. Do not silently add a generic historical-generation API.

### R30 head preservation — high-impact risk addressed by R31.3

The current generator uses `CURRENT_SNAPSHOT = R30_SOURCE_SNAPSHOT`, loads prior history from `R30_PRIOR_REGISTRY_COMMIT`, and then constructs R30's own head. Simply advancing either constant would rebuild a historical R30 statement around successor bytes or lose its record.

The successor must load the complete accepted starting registry, preserve all 20 R30 records in canonical form, pin the former shipped head with its existing canonical digest, retain its required identity, and append exactly one independently named successor. Keep original prior/result manifests, Git refs, prose and the historical thirteen-rule assertion intact. Designate/protect the new shipped head and its future demotion exactly as the current mechanism requires. The 21-record expectation is conditional on independently confirming the 20-record starting subject, not a substitute for that check.

The nine-file subset covers the necessary generator/registry/validator and test changes. No schema expansion or blanket assurance/identity relaxation follows. Existing R30 reservations, correspondence edges and all 72 shapes must remain exact because their governing source bytes are unchanged.

### Item, alias and edge accounting — explicit Step0 acceptance obligation

Draft lines 103–105 correctly avoid pretending two new body blocks equal two registry items. The exact successor inventory still needs the canonical and specialized numbered-item discoveries, aliases, any superseded locator refs, audit dispositions and reciprocal edges. Derive the count delta independently from that mapping, then compare generation against it; do not replace expected counts with whatever discovery emits.

For M03 preserve the existing historical item identity and explicit exclusion rationale, update its exact value/source evidence, and verify all aliases agree. For M02 choose and record either an explicit narrative exclusion with complete inventory coverage, or a noncontrolling narrative rule. The choice affects rule/audit counts. Do not give the annotation `human-ratified` assurance merely because its text exists on main, and do not promote the historical plan source to binding authority.

For every new reserved rule/ref, preserve the proven R30 discipline: full expected shape, exact ordered refs, exact designated basis and reciprocal inventory sets derived independently from source. Any approved paraphrase, component suffix or corroborating ref must be explicitly covered; no repeat of a basis-only exception that leaves other checks ambiguous.

## Required acceptance controls

1. Confirm a real coordinator-owned source commit, all 18 source identities, exactly the two approved replacement blobs, and the chosen accepted R30 base before generation. Reject tree objects masquerading as commits. Preserve run 39 and its subject unchanged.
2. Bind all fourteen numbered standing constraints and preserve identities/values of the first thirteen. Retain the add-unadopted-rule control by moving its synthetic number to 15; prove it actually changes governed input and fails for coverage rather than a stale incidental digest.
3. M01: mutate condition, marketplace step, source existence, nested manifest-name equality and URL-insufficiency independently. Wrong assurance, decision, owner, applicability, source/basis or identity must fail after incidental digests are repaired. Exact M01 intent does not become runtime installation evidence.
4. M02: reject annotation/thesis identity swaps, duplicate/lost thesis identity, stale current refs, extra ordinal displacement, unapproved annotation and changed thesis content. Preserve historical source authority; isolated historical/provenance queries remain noncontrolling with `NO_APPLICABLE_AUTHORITY`, not resolved proof or ALLOW.
5. M03: preserve its existing identity, historical authority and explicit disposition while binding the changed value and aliases. No claim of deployment or marketplace resolution follows from the renamed literal.
6. Compare every historical reconciliation canonically; reject old-head rewrites while appending, missing records, fork/cycle/orphan chains, wrong predecessor, source-tree substitution and a second unregistered append. Preserve the frozen thirteen-rule record while current coverage becomes fourteen.
7. Verify exact expected source/item/rule/audit/link deltas, old and new source references, deterministic generation and full source sweep. Existing failure-backed controls remain in the suite; new assurance exceptions must not allow reserved mismatches to fall through to legacy checks.
8. Obtain direct-exit verification and independent reviews of the exact final successor commit in its own scheduled window. Selective source adoption is distinct from full-main integration, human Gate 3, and FK-P0 dependency acceptance.

## Disposition and no-mutation statement

The concrete proposal at 106fd58 resolves the plan-level authority and scope gaps identified in the earlier impact draft. In particular, it supplies the actual human-ratified assurance choice without a new enum, rejects a parcel-kind schema axis, requires full reserved shapes, keeps M03's exact exclusion, preserves all twenty historical records, and makes exact mapping/counts a pre-code gate. The remaining two-version-test clarification is a bounded implementation interpretation: record whether the historical positive uses its pinned historical implementation or the successor's explicit finite compatibility path. Do not read it as authorization for generic baseline regeneration. No additional user confirmation is needed for that choice.

The coordinator can record these finite choices under the existing September 7 non-destructive decision authority; no repeat developer confirmation is required for them. R31 remains nondispatchable until fixed R30 green/final-review prerequisites, successor contract disposition, exact independent mapping and source commit are ready. No recommendation changes the running R30 worktree or authorizes a main merge.

This reviewer ran read-only Git/file inspection only and authored this one report. No Node/npm, installs, tests, workflow runs, builder-tree writes, branch changes or commits were performed. All evidence and candidate outcomes above retain their stated limits.
