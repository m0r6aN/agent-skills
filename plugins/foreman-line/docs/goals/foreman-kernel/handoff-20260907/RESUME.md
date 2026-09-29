# Foreman Kernel remote resume entry point

Publication date: 2026-09-07. This is a source-and-document preservation handoff, not a coordinator transfer, implementation acceptance, approval amendment, merge, or release.

## Addressable sources

- Handoff branch: `handoff/foreman-kernel-live-20260907`. Its base is the clean goal branch `codex/foreman-kernel-stage0-20260830` at `d0e87ce0e36e69868909c93e0f00f6fc7e4a9af3`.
- Required implementation branch: `codex/fk-p0-canon-authority-enforcement-registry`, exact commit `0ee165720f8d1e3a91eb283cb770400b23f61bf5`. The 22 authority-registry files are on that branch and hashed in `manifest.json`. This handoff branch is a document snapshot, not a complete implementation tree.
- Historical unclaimed salvage branch: `codex/fk-p0-rework6-unclaimed-20260903`, exact commit `b0518f8605e0bef2f9178a8fb56c8942d7c2c133`. This is referenced provenance, not the current candidate, and is not an ancestor of the current candidate.
- Origin: `https://github.com/m0r6aN/agent-skills.git`.

Fetch these refs, verify their full SHAs, and use separate worktrees for documents and the exact candidate. Do not copy the handoff charter/loop into the implementation checkout before a governed reconciliation: those source bytes participate in the authority-registry corpus. Do not run an old reset instruction from a historical state block.

## Read in this order

1. This file, `manifest.json`, and `reference-index.json`.
2. `../charter.md`, especially the ratification ledger and D21, and `../loop-directive.md`, especially the September 4 ownership/current-state block.
3. `../FOREMAN-KERNEL-DEVELOPMENT-CHARTER.md`, preserved byte-for-byte from the ambient untracked September 7 companion. Sections 14-17 carry INF-1 through INF-8 and their ratification/provenance. Its older sections 1-13 must not replace the live charter.
4. `../proposed-amendment-A1-decision-path-latency-budget.md`, `../amendment-A1.8-ratification-ledger.md`, `../A1.8-coordinator-review-and-exact-ratification-text.md`, and `../A2-PARKED-known-unowned-risk.md`.
5. `../FK-P0-round6-recovery-step0-ruling.md`, `../../../kickstarters/foreman-kernel-build-FK-P0-rework6-recovery.md`, and the current active spec at `plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md` (R24-R29 included). Repository-root paths are authoritative when browsing across directories.
6. `../FK-P0-BLOCKER-volatile-canon-source.md`, `../FK-P0-round6-recovery-record.md`, `../FK-P0-round6-STOP-REPORT.md`, and the historical closure/review/Gate-3 records. Their results are bound to their own candidate SHAs.

## Reconciliation and disagreements

| Surface | Observed sources | Disposition for resume |
|---|---|---|
| Original grants and A1 | Both live charters record original Gate 1, scoped R1-R13 re-ratification, and September 1 A1. A1 includes D21 and A1.2-A1.7. | Ratifications stand. Preserve the later live charter; no blanket reapproval. |
| September 7 recommendations | Ambient companion records the eight ratified recommendations and explicitly says live-source adoption/review remain pending. The user reaffirmed that ratifications stand in the publication request. | Publish intact as companion. The ratified intent stands; owner must review precise mappings and reconcile overlapping A2/INF-4 obligations before affected dispatch. No silent adoption or rescission. |
| A1.8 / A1.9 | A1.8 says uncommitted/unreviewed although it is committed in history. It explicitly flags its missing self-ratification row. Goal charter has three unkeyed rows; parcel charter has L1-L3 (A1.9) and no L4. | Both charter variants are retained. A1 itself is ratified. Do not invent A1.8 ratification or turn the proposed exact ratification text into a human act. |
| A2 and A3 | A2-r1 through r4 remain parked and unratified in the durable record. A3 is drafted, not in force. | Preserve drafts and findings. September 7 INF requirements require explicit semantic reconciliation with the owner; they do not automatically ratify old A2 or A3 wording. |
| Ownership | Goal directive names the Codex coordinator resuming September 4. Parcel directive records earlier crash recovery. | Goal directive is the latest recorded ownership transfer. Original source copies remain untouched; publication transfers nothing. No process command line matching either source worktree was observed, but this is not proof that the named session is dead. Check ownership before dispatch. |
| Current parcel | Live goal recovery ruling identifies clean candidate 0ee1657. Loop queue row still says a100a91 awaiting rework, despite the later recovery block and R24-R29 candidate. | FK-P0 is active, unaccepted Round 6 recovery. Queue row and historical not-pushed statements are stale. FK-P1 through FK-P21 remain pending; no kernel parcel is newly accepted or merged by this handoff. |
| Active spec | Parcel spec and rework1 kickstarter advanced beyond goal copies. | Current parcel versions copied to their normal document paths; previous goal versions archived in `goal-versions/`. Differing parcel charter/loop are in `parcel-versions/`; normal goal charter/loop are byte-preserved. |
| Historical green claims | Gate-3 and merge-ready material concern 838f438; later Option-B a100a91 sweep/tests failed. Candidate then advanced to 0ee1657. | Do not transfer old green results across SHAs. Active spec Session Handoff remains unfilled; no final committed verification transcript or two fresh reviews for 0ee1657 were located. |
| September 5 work | FL-FK-V0 verification worktree is clean at the same 0ee1657. FL-ASSEMBLY is a different published line; FL-R1-R4 carry dirty work outside this kernel snapshot. | No newer kernel completion inferred from later dates or assembly work. Other source changes stay excluded. |

## Remaining dependencies and exact next action

The remote session can now inspect and reconcile from addressable Git sources. Before implementation dispatch, establish whether the recorded September 4 coordinator is still live or obtain the appropriate recorded boundary transfer. Preserve existing Gate 1/Gate 2 grants and human-only Gate 3.

Continue the existing Round 6 recovery from the September 4 Step 0 ruling. Obtain the referenced recovery Step 0 report/sequential plan if available; it is not a standalone committed artifact in this snapshot. The kickstarter, spec and ruling are available to reconstruct a reviewable plan without inventing prior execution. Recover or produce complete command output with direct exit codes, clean-generation evidence, the test-count tripwire and controls (a)-(g), then a final builder handoff and two fresh independent reviews before any human Gate 3 package. This publication performed no implementation tests and asserts no new passing counts.

The original revised ADR bytes with SHA-256 `09821b3930e6c8fbbd6ed6520dede1b5b4494118c1b5ebf772712bc40226763f` and the full September 7 external conversation are not independently available here. Their claims are preserved in the companion; the existing live ADR and A1 are captured. HCS/worker-fabric and packaging serialization-point ownership must be checked live before affected dispatch.

`reference-index.json` distinguishes available repository files from directories and unresolved literal/template references. Missing named reject YAML fixtures appear in historical specs; current candidate uses its shipped test suite and pass-minimal fixture. A missing `defects_lessons.md` reference was not fabricated. The `.github/workflows/foreman-line-ci.yml` reference is absent from the historical source branches; later unrelated FL-R4 work is not copied in to make an old claim appear complete. `FK-P0-amendment-R1` is an incomplete textual range reference, not an existing artifact.

## Preservation and verification scope

All 56 originally registered worktrees were inventoried read-only with Git optional locks disabled. Goal and implementation worktrees were clean. The ambient untracked charter is included as the companion, while its local A1 deletion is preserved locally and not propagated. Other dirty work, stashes, credentials, local debug/session logs, dependencies and binaries are excluded. Historical repository baseline files remain inherited from the existing goal commit.

The manifest records source branches, full HEADs, raw SHA-256 file hashes, included unpublished changes, and unresolved dependencies. `publication-verification.json` records staged Git blob hashes and checks. Hash verification proves capture/publication integrity, not implementation correctness. The publication commit itself is identified by the remote ref and the final publication report, avoiding a self-referential commit hash in this document.
