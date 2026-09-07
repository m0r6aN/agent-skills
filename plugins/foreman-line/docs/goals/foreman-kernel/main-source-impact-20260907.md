# Main source impact — September 7, 2026

Status: draft for coordinator review. This document proposes a finite successor source-adoption contract. It does not amend active builder scope, validate an integrated registry, or report R30 run 39 complete. Run 39 and its subject remain fixed.

## Evidence boundary

Read-only Git inspection used `C:/Users/clint/AppData/Local/Temp/fk-remote-verify-20260907.git`:

| Identity | Value | Meaning |
| --- | --- | --- |
| Adopted source commit | `65c471416e4a3916695815e951ffbe389288560e` | Source baseline supplied for comparison |
| Main commit | `476b8df6efe6c9974879957147449f61c34cd9a0` | Main side of simulated integration |
| R30 candidate commit | `f8093410cead451f204d08ae25f3a70b34208213` | Fixed candidate side; generator, validator, registry and spec inspected here |
| Simulated merge tree | `2a7343795cfbf4f8a1f0d36f1b361960cfba5bb7` | `git cat-file -t` returns `tree`, not `commit` |

Commands included `git diff <adopted-source> <merge-tree> -- <source-path>`, `git show <candidate>:<path>`, and `git rev-parse <revision>:<source-path>`. Extracting the candidate registry's source paths yielded 18 paths; comparing their Git blob identities found exactly two changed source files and 16 unchanged source blobs. These are source-content observations, not generator or validator execution.

| Governed source | Adopted blob | Simulated integration blob |
| --- | --- | --- |
| `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` | `b157dac4fa51776aab573eba7f98c8af3d4fdfdb` | `5d64994848f6260d48023cb820c624dd46805c7a` |
| `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` | `eeb7e994ae0b522583f8192b3b23cdafc389b74d` | `cfeb86c03a24fa7b3a30abf3c99fab476319eb21` |

The coordinator separately reports committed compatibility evidence in `main-source-compatibility-20260907.json` at `76fd52e`, no authority-registry package changes on main since merge base `354940e`, and remote coordinator `d658a07778fe365b4e69b1f5317422b9f3bc5537` verified against 257 manifest blobs. Those are attributed coordinator observations, not checks rerun by this review. They support treating this as corpus adoption rather than assuming a runtime conflict; they do not establish integrated registry validity.

## Independent source expectation inventory

The completeness denominator is **three changed source units in two existing sources**. It is not a predicted number of generated rules, corpus items, aliases, or audit entries.

### M01 — Conditional builder plugin/marketplace obligation

Exact new block, under `## Builder — conditional`, after existing rules 6 and 7 and before `## Reviewer`:

> 14. **Plugin/marketplace parcels:** verify each living install identifier through the declared marketplace entry to an existing plugin source whose nested manifest name equals the requested plugin. A normalized repository URL does not prove that an install command resolves. (#37)

Disposition: normative, binding standing-role authority, conditional on a builder handling a plugin/marketplace parcel. Preserve the existing thirteen numbered identities and add rule 14 without renumbering. This block does not independently grant permission to install, publish, modify marketplace configuration, or perform external actions.

Compound treatment: retain both the positive verification chain and the explicit insufficiency of URL normalization in one complete obligation, or in linked clauses that cannot independently represent complete satisfaction. The required chain is living install identifier → declared marketplace entry → existing plugin source → nested manifest name equal to the requested plugin. `#37` is provenance; it is neither a new governed source nor evidence that any particular identifier resolves. Do not invent requirements to execute an installation as part of this registry adoption.

Affected parcels: FK-P0 inventory, classification, coverage and assurance; future plugin/marketplace builders consume this standing obligation. No FK runtime resolver or cross-goal implementation enters this amendment.

Recommended classification: `independent-review-human-judgment` for this source-authored builder verification obligation, with source-intent assurance only until a separately evidenced implementation satisfies it. If the existing class-to-assurance mapping cannot honestly represent that combination, the successor contract must authorize one exact identity/location/value/shape-bound exception. Do not reuse an unrelated R30 exception or weaken the global mapping. The final contract must bind the actual discovered canonical identity and its aliases before dispatch; they have not been produced in this review.

### M02 — Historical migration annotation

Exact new blockquote immediately following the plan title:

> **Repository identity migration (2026-09-06):** Repository identifiers and paths in this historical record were normalized to `m0r6aN/agent-skills`. Recorded commands were not rerun; all other historical outcomes remain as captured.

Disposition: narrative provenance in the existing historical source, not a new live rule or grant. Preserve the explicit statement that commands were not rerun. The date and repository identity are recorded historical values, not newly declared volatile fields. Inventory and bind the added block; do not omit it merely because it is non-normative.

Affected parcel: FK-P0 source inventory and provenance. No runtime acceptance or installation result follows from this annotation.

Structural consequence: the Markdown scanner treats this blockquote as a paragraph. The old title-level paragraph containing Version/Owner/Status/Thesis shifts from `md-block:# The Foreman Line — Master Plugin Plan:paragraph:1` to `md-block:# The Foreman Line — Master Plugin Plan:paragraph:2`. The new annotation occupies paragraph 1. This induced relocation is part of M02, not a fourth edited source unit. Preserve `item.two-gate-thesis` and `rule.foreman-line-plan.two-gate-thesis` for the actual thesis at paragraph 2; assign a distinct provenance-only item to the annotation. The existing target in `src/registry.ts`, `R12_LEGACY_MARKDOWN_RULE_TARGETS`, points to paragraph 1, and `src/generate.ts` special-cases that target before the frozen identity lookup. Unchanged naive mapping would therefore misidentify the annotation as the thesis. Authorize a narrowly bound current-target migration and all dependent current mappings, while keeping historical reconciliation source references and records unchanged.

The migration must be source-version-aware: baseline/historical generation still resolves the thesis at paragraph 1; only the approved successor source identity and exact annotation/thesis location/value shapes permit paragraph 2. Preserve the existing hard rule's authority basis and exact source/rule linkage. A global legacy-target rewrite or generic semantic search is outside scope. An unapproved source version, insertion or relocation fails closed instead of guessing which paragraph owns the thesis identity.

### M03 — Historical skill-library name correction

At `## 5a. Skill Injection Policy (the execution-plane library)`, the first paragraph changes the inline library name from `kaseya-one-productivity-tools` to `agent-skills`. The deployment path `~\\.claude\\skills\\` and the surrounding versioned skill injection matrix text are unchanged.

Disposition: value correction within an existing historical paragraph. Preserve the source definition's historical authority effect. The paragraph mixes explanatory and policy-like text; classify the existing whole block according to that historical authority rather than manufacturing a newly binding policy from the renamed literal. Rebind all affected canonical/alias values and source hashes. Preserve the identity if the identity contract allows a value update at this unchanged structural location.

Affected parcel: FK-P0 historical inventory/bindings only. The corrected label proves neither library deployment nor marketplace resolution.

The candidate inventory identifies this block as `item.483a4914f57e`, with anchor `md-block:# The Foreman Line — Master Plugin Plan > ## 5a. Skill Injection Policy (the execution-plane library):paragraph:1`, no rule IDs and `non-normative-explanation` exclusion. The scanner's anchor uses heading/kind/ordinal, and the generator freezes existing Markdown IDs by anchor. Thus the renamed paragraph itself calls for changed-value/source-provenance binding, not a new body-item identity. Static expectation: zero net item/rule additions from M03. The identity relocation requiring explicit treatment is the separate title-level thesis shifted by M02.

## Findings and precise remedies

1. **High — Integrated source differs from the R30-adopted corpus.** The standing rule and plan blobs above differ, even if Git combines all text cleanly. The existing R30 amendment authorizes its enumerated charter/loop adoption and ledger corrections; it does not automatically authorize arbitrary later corpus changes. Remedy: adopt these three units through a separately reviewed successor contract before claiming current-main corpus or integration acceptance.

2. **High — Naive discovery can misclassify the new conditional rule.** The candidate generator explicitly classifies the first two conditional-list entries. Rule 14 adds a third entry. Remedy: add an explicit normative mapping, conditional builder applicability and honest assurance for M01, plus a source-authored expectation independent of candidate output. Structural discovery alone is not evidence that the new obligation received the right authority.

3. **High — Historical thirteen-rule reconciliation must not be rewritten.** The candidate generator and validator contain thirteen-standing-rule identities and prose in the historical `missing-provenance-reference` reconciliation. The active spec also has thirteen-rule assertions, including the retirement and coverage language. Remedy: distinguish frozen historical records from current coverage. Preserve canonical historical reconciliation bytes/digests and their old snapshot meaning; append the successor migration and amend current acceptance language to cover fourteen numbered standing rules. Do not perform global `13`→`14` replacement: other constants cover unrelated R1–R13 review history.

4. **High — The merge-tree object cannot serve as sourceSnapshotCommit.** The supplied integration object is a tree. Remedy: record a real coordinator-owned integration commit containing the selected source contents and verify its source blobs before generation. Keep the tree identity as planning evidence. Do not fabricate commit evidence or use a registry-output commit circularly as its own prior snapshot.

5. **Medium — Historical annotation can produce false authority or evidence.** M02 explicitly disclaims rerunning commands; M03 changes a name inside a historical source whose generator definition has `authorityEffect: historical`. Remedy: retain historical/provenance classifications and exercise negative cases against promotion to live ALLOW authority or current verification.

6. **High — Annotation insertion can steal the thesis identity.** M02 changes the paragraph occupying a privileged title-level anchor. Remedy: preserve the actual thesis item/rule identities at paragraph 2, give paragraph 1 a new provenance identity, and narrowly migrate current locations and bindings. Do not alter historical target semantics in retained records or let frozen anchor reuse bind the old thesis identity to the new annotation. This requires scoped code changes, including `src/registry.ts`; it is not a source-hash-only migration.

## Proposed finite successor adoption contract

Use a new amendment identifier assigned by the coordinator after checking that it is unclaimed; `R31` is a proposal, not an assignment made here. Preconditions are disposition of the fixed R30 candidate under its existing contract, an independently reviewed successor amendment and source expectation inventory, and an actual integration source commit. P0 remains an unsatisfied dependency for downstream parcels until its full acceptance requirements are met.

The scope is exactly M01–M03, their affected references, values, the explicit M02 thesis location migration, source/manifest hashes, one append-only adoption reconciliation, current coverage assertions, regression expectations and documentation explaining the new source boundary. Preserve all 18 source IDs/paths, unchanged identities, identity algorithm, schema shape, volatile-region rules, source authority distinctions and previous reconciliation records. No extra source, global assurance relaxation, dependency change, generic resolver, new runtime enforcement, marketplace write, installation or external workflow dispatch is included.

Proposed builder Allowed Files are the following exact subset of the existing 28-file ceiling, subject to final contract review:

- `plugins/foreman-line/authority-registry/src/generate.ts`
- `plugins/foreman-line/authority-registry/src/validate.ts`
- `plugins/foreman-line/authority-registry/src/registry.ts`
- `plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/pass-minimal.yaml`
- `plugins/foreman-line/authority-registry/tests/semantic-invariants.test.ts`
- `plugins/foreman-line/authority-registry/tests/corpus-sweep.test.ts`
- `plugins/foreman-line/authority-registry/tests/parity.test.ts`
- `plugins/foreman-line/authority-registry/README.md`

The coordinator owns source commits and amendments to the active spec/current thirteen-rule assertions. They are not builder Allowed Files. Other implementation files remain outside this proposed narrow scope; if actual code inspection reveals a needed change, amend the finite contract before editing that file. Package manifests, lockfiles and schemas do not need permission merely because they appear in the original ceiling.

Existing append/migration and corpus discovery mechanisms provide the design basis. They do not remove the need for explicit M01 classification and validator/current-oracle updates. Preserve every previous reconciliation's complete canonical record; append exactly one new migration linked to the verified prior registry commit/manifest and the actual new source commit/manifest. A frozen old statement about thirteen rules is historical evidence; a new current assertion covers fourteen. Any new source-intent exception is a separate finite reserved entry with exact identity, location, value and full shape; mismatch must fail rather than fall back to global class assurance.

The R30 documentation records targets of 541 rules, 1,583 corpus items, 198 audit entries and 20 reconciliations. This review did not execute that candidate and does not certify those counts. Successor totals must follow observed structural discovery plus independently authored coverage expectations, including alias effects. Do not invent a total by simply adding one rule or three items. Independently reconcile the three source units, all fourteen numbered standing constraints, the unchanged sixteen source blobs and any changed aliases. Pin prior reconciliation count/content from the actual accepted starting registry before asserting the successor's append count.

Static body-discovery expectation is two additional blocks: M01's list item and M02's annotation. M03 changes one existing body's value; M02 relocates the unchanged thesis body without duplicating it. No heading is added. These are source-structure predictions, not certified registry count deltas: explicit aliases, specialized numbered-item discovery and rule mapping still require observed reconciliation. Under the coordinator's chosen R30 starting point, preserve all 20 prior reconciliation records unchanged and append exactly one successor record (21 total), conditional on verifying that starting inventory before generation.

## Verification obligations for the successor, not run here

- Source inventory includes M01 as normative and M02 as provenance; M03's changed value and historical effect are both represented. All aliases agree. Existing constraints 1–13 preserve their identities and applicable authority.
- M01's representation retains the parcel condition and every link of the verification chain. Source mutation cases deleting the marketplace link, existence check, nested-name equality, condition or URL-insufficiency clause fail the independent expected-value/shape binding. A mere normalized URL or a claimed successful install cannot be accepted as evidence of the full chain. These are registry/oracle checks; runtime marketplace verification belongs to separate implementation scope.
- An additional unadopted constraint 15 is detected as uncovered; updating the old additive-scan fixture from its former synthetic rule 14 must not remove that coverage test.
- M02 cannot become a live grant or rerun result; M03 cannot promote the historical source to binding authority. Source hash, location and value drift remains fail-closed.
- Reject annotation/thesis identity swaps in both directions, duplicate issuance of the old thesis identity, thesis identity loss, stale paragraph-1 thesis references in the current registry, and granting the annotation the historical thesis rule. Assert unchanged thesis content retains its old item/rule identities at paragraph 2 and that M03 retains `item.483a4914f57e` with its updated value. Historical references remain bound to their own snapshots.
- Exercise both approved source versions: baseline generation retains the paragraph-1 thesis and its exact authority basis; successor generation retains that rule at paragraph 2 with the approved linkage. An unapproved note, source-version pin, changed thesis value or further ordinal shift must fail closed. No generic semantic remapping is allowed.
- Prior reconciliation records remain byte-for-byte canonical-equivalent with verified digest pins. Tampering, rewriting a historical thirteen-rule statement, substituting an uncommitted tree as a source commit, missing migration linkage, or widening a reserved assurance exception is rejected.
- Execute the required supported-host checks, complete corpus sweep and integration validation only in the coordinator's scheduled host window. Preserve direct process exit evidence and independently review the exact resulting commit. A text merge, clean diff, generated YAML, or historical green run alone satisfies none of these checks.

## Recommended sequence

1. Preserve R30 run 39, candidate subject and evidence. Let its existing review/acceptance chain reach its own disposition; neither change it to chase main nor label its result integrated-main evidence.
2. Review this three-unit inventory and ratify the finite successor contract/current acceptance changes. Pin the chosen main and accepted candidate identities. If either moves, repeat the read-only source comparison before committing a new integration subject.
3. Establish a separate isolated successor branch based on the accepted/tested R30 candidate. Copy only the two exact upstream source blobs recorded above, then create a coordinator-owned source-first commit and confirm the 18-source manifest. Do not merge unrelated main changes into this adoption branch. The integration tree remains comparison evidence; this branch's actual source commit becomes the generation input. No mutation of the active R30 builder tree is required.
4. Implement only the finite mapping, current-oracle and append/migration changes in the successor Allowed Files. Generate against the actual source commit and record observed counts without rewriting historical claims.
5. Run scheduled validation and obtain independent review of the final subject and evidence. Perform full-main integration as a separate subsequent check against its exact selected head; selective source adoption does not certify that integration. Record separate outcomes for text integration, source adoption, registry validation and full P0 acceptance. Only the resulting accepted dependency can support downstream implementation gates.

No Node/npm commands, installs, tests, workflow runs, commits, source edits or builder-tree writes were performed for this review. The only authored file is this draft.
