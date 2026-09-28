# Proposed Amendment W0-P01R-R1: Source-Free Attempt Recovery

Status: **PROPOSED — frozen for owner review; unratified; no execution authorized.** This is a shaping artifact only. It authorizes no setup, fixture execution, protected-source read, source capture, staging, commit, remote operation, filing, payment, disclosure, counsel transmission, or modification of prior or failed evidence.

## Purpose and non-retroactivity

W0-P01R-F is **ENDED_INVALID**. The original fixture root and its partial output remain immutable evidence; the failed implementation is not accepted and does not authorize S. This proposed amendment does not excuse or normalize the unauthorized correction/rerun described in the companion receipt.

If ratified after independent defect review, this amendment would permit a bounded, source-free recovery proof. An ordinary synthetic implementation failure ends only its individual attempt, preserves an immutable receipt and script snapshot, and may advance to a fresh attempt under the same ratified amendment. It does **not** require a further owner decision for that ordinary retry. A protected-access, source-capture, authority, or security-scope failure remains a full stop requiring a new owner decision.

## Proposed isolated names

- Pinned base: `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322`.
- Builder branch: `codex/w0-p01r-r1-fixture-20260913`.
- Builder worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r1-fixture-20260913/`.
- New fixture-proof root: `D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/`.
- Exactly three initially absent attempt roots, maximum: `attempt-01/`, `attempt-02/`, and `attempt-03/` beneath that new fixture-proof root.
- Conditional S output remains unchanged and is **not** an F output: `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01/`.

The prior failed fixture root `D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-fixture-proof-20260913/`, its contents, all four earlier partial roots, and the conditional S output root are out of scope and must remain unchanged.

## Exact proposed scope

### Allowed Files

1. Coordinator setup administration only: the local Git administrative metadata required to create exactly the named R1 worktree and branch.
2. Builder only: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r1-fixture-20260913/tools/w0-p01r-fixture.ps1`.
3. Builder only: the one fresh, named R1 attempt root approved at that attempt's coordinator checkpoint, including its synthetic fixture, script snapshot, parser result, command receipt, manifest/sidecar if successful, and failure receipt if unsuccessful.
4. **S only after both F accepts and S Step 0 coordinator ACK:** the accepted `attempt-NN/script-snapshot.ps1` and its two F review records may be read for digest binding; S may then read the two exact protected source roots and their permitted local Git metadata and write only the already-named initially absent S output root.
5. This proposed amendment and `handoffs/W0-P01R-F-ended-invalid-receipt-2026-09-13.md` in the existing control worktree, while the proposal remains unratified.

### Prohibited Files and Actions

- **During F:** both protected roots and their `.git` metadata, all prior partial roots, the ended-invalid R0 fixture root, the conditional S output root, and all paths outside the exact R1 worktree-script and current R1 attempt root. All prior partial roots and the ended-invalid R0 fixture root remain permanently forbidden in every phase.
- Any protected-source enumeration, read, copy, metadata/Git read, or source mutation before a later S Step 0 and explicit coordinator ACK.
- Staging, commit, merge, push, fetch, pull, remote operation, cleanup, deletion, renaming, package drafting, counsel transmission, disclosure, filing, or payment.
- More than three attempts, reuse of an attempt root, or a retry after an attempt failure without the defined coordinator checkpoint.
- Any S invocation using the rejected R0 script, an R1 snapshot other than the one with both F `ACCEPT`s, a snapshot digest other than the digest in both F reviews, altered source roots/output root/arguments, or a missing S Step 0 ACK.

## Per-attempt lifecycle

1. **Coordinator pre-setup:** record that the R1 branch, R1 worktree, R1 fixture root, all three attempt roots, and S output root are absent. Validate the pinned base only. Do not enumerate either protected root or read its Git metadata.
2. **Coordinator setup:** only after that record, run the exact local `git worktree add` command below.
3. **Builder Step 0:** within the new worktree, verify exact worktree/base/branch, verify the designated attempt root and S output root are absent, revalidate the **current** controlling `D:/Repos/agent-skills` main routing policy before every builder or reviewer dispatch, restate that F is source-free, and stop for the coordinator's per-attempt checkpoint. A compatible policy refresh is not a new human gate; unresolved routing-policy or authority change pauses and escalates.
4. **Attempt harness before candidate execution:** after that checkpoint, create only the designated attempt root. Inside it, materialize `attempt-harness.ps1`, `script-snapshot.ps1`, and create-once `command-contract.json`. Before fixture layout, traversal, source hashing, or copy, the harness hashes itself and the snapshot; parses the snapshot with the PowerShell parser API; and executes its in-memory schema plus Generic.List-to-array regression checks. It writes create-once `preflight-receipt.json` and `command-receipt.json`, each binding both digests. A parser/preflight failure writes create-once `failure-receipt.json` without invoking the candidate.
5. **Immutable failure behavior:** the harness catches a candidate termination, records its exact command, harness and snapshot SHA-256 values, serialized error record, and observed attempt-root inventory in a create-once `failure-receipt.json`, then marks only regular receipt/snapshot artifacts of the current attempt read-only. It enumerates the current attempt without following reparse points and never changes a junction, its target, or any prior attempt. Controlled execution writes exactly one create-once final outcome, either `failure-receipt.json` or `success-receipt.json`; it never overwrites a receipt, snapshot, manifest, sidecar, or payload. A failed attempt root is never reused.
6. **Outcome:** a successful attempt contains complete fixture evidence, two deterministic success captures, the internal-link and path-escape controlled stops using the common core and envelope, final persisted manifest/sidecar verification, a deterministic comparison report, and a create-once `success-receipt.json`. Any ordinary synthetic implementation failure records `ENDED_FAILED`, preserves the entire attempt root, and ends that attempt. Only the coordinator may checkpoint a later fresh attempt, and only while fewer than three attempts have ended.
7. **Final F acceptance:** only a successful attempt with the exact final script snapshot SHA-256 may be reviewed. Two fresh, independent, read-only reviewers must each `ACCEPT` the same complete script digest and the successful attempt evidence; reviewers never modify, rerun, stage, or commit.
8. **S remains separately gated:** after both F accepts, builder S Step 0 repeats source-output absence, unchanged accepted snapshot digest, both accepts, unchanged source/invocation arguments, and preservation checks, then stops for coordinator ACK. No protected source is accessed before that ACK. S reads only the accepted R1 `attempt-NN/script-snapshot.ps1` and its two F review records in addition to the two exact source roots and their permitted local Git metadata; it never reads or modifies R0. S failure is a full stop, not an R1 retry.

## Failure classification

| Failure | Result | Next authority |
|---|---|---|
| Parser, schema, type, relative-path, classification, hash, determinism, synthetic reparse, or synthetic path-boundary failure confined to the exact fresh attempt root | `ENDED_FAILED`; preserve that root and its immutable receipt/snapshot | Coordinator may checkpoint the next fresh R1 attempt, up to three total; no new owner decision required if every boundary remains intact |
| Attempt-root reuse, write outside scope, fixture root not initially absent, changed base/branch, unresolved authority/security-policy change, or failure to produce an immutable receipt | Stop R1 | New owner decision required |
| Any protected-source/Git access during F, remote operation, source mutation, prior-root alteration, staging/commit, or S invocation before two F accepts and S ACK | Stop R1 and S | New owner decision required |
| S parser/digest/source-stability/custody failure after its proper ACK | Stop S; preserve output | New owner decision required |

## Required candidate implementation contract

The candidate is not accepted merely for parsing. Before F execution it must contain every F and S path below in the one complete PowerShell 5.1-compatible script.

1. **Collection and preflight correctness:** use `$entries.ToArray()` (not an array subexpression around a `Generic.List[object]`) when placing entries in a manifest. The harness's all-in-memory regression probe must prove that conversion with a representative ordered entry. Run parser, schema, Generic.List conversion, mode-parameter, and boundary preflight before `New-FixtureLayout`, fixture traversal, hashing, or copy.
2. **Boundary validation before every write:** one common validator canonicalizes paths without `[IO.Path]::GetRelativePath` or `Replace()` and rejects a destination outside its exact authorized root via ordinal-ignore-case root-plus-separator comparison. For a destination inside that root, it performs read-only attribute checks for reparse points on all existing ancestors from the volume root to the destination, rejecting any reparse point in that output path; it does not traverse a junction target or enumerate unrelated directory contents. Ordinary non-reparse ancestors above the authorized root are neither write permissions nor an automatic rejection. It validates the attempt root, fixture root, every capture root, stop-record path, script snapshot, and manifest/sidecar destination before `New-Item`, `Copy-Item`, or file output. Fixture modes reject any root outside their named attempt root. SourceCapture separately validates only its exact approved source roots and initially absent S root before mutation.
3. **Common capture/stop core:** `FixtureSuccess`, `ExpectedInternalLink`, `ExpectedPathEscape`, and `SourceCapture` invoke the same entry construction, classification, relative-path, boundary-validation, manifest-envelope, and stability functions. ExpectedPathEscape must route an out-of-root synthetic candidate through that common validation, not call a helper in isolation. Both expected-stop modes emit the complete required envelope plus `stopReason`, and neither produces an accepted capture.
4. **Final persisted F artifacts:** construct all fixture assertions before serializing a manifest; write the final manifest once; hash it; write and verify its sidecar; reload it and assert that the on-disk assertions, `payloadSha256` field, classifications, and counts equal the reviewed in-memory object. After `success-b`, write `determinism-comparison.json` that compares stable normalized manifests (only explicit timestamps and output-root fields may differ) and records both manifest/sidecar hashes.
5. **Complete S implementation before F review:** `SourceCapture` must accept the exact approved invocation without an unbound `FixtureRoot` parameter. It must bind expected/actual tool hashes; validate before creation; collect per-track baseline Git classification, reparse-aware pre/post source inventories, source/payload counts, aggregate and per-file hashes, output ACL/owner observation, no-remote result, and a complete final combined manifest plus sidecar. Its `sourceStability` is computed from actual pre/post inventory equality, never hardcoded. The existing exact S invocation must need no argument not specified in the ratified command.
6. **No hidden F source access:** F's path allowlist must reject protected roots and their `.git` paths before the common core opens, enumerates, or hashes an item. The F command ledger records `protectedSourceAccess: false` and `remoteOperations: false` only from the bounded fixture run, not as an unsupported global claim.
7. **Fixture subroot initialization:** the attempt parent exists before the candidate runs because it holds the harness and immutable receipts. The first candidate run must require the initially absent fixture subroots `fixture-success-source/`, `fixture-internal-link-source/`, `referents/`, `captures/`, and `expected/`, then initialize them once and write `fixture-layout-receipt.json`. Later commands may use those subroots only after verifying the receipt's layout digest; they must neither recreate nor silently skip fixture initialization.

## Incorporated independent-review findings

| Finding | R1 repair requirement |
|---|---|
| Generic.List array conversion runtime defect | Contract item 1 requires `ToArray()` plus an in-memory regression probe before traversal. |
| Parser/schema checks occurred after layout/traversal | Per-attempt lifecycle step 4 and contract item 1 move all checks before any fixture mutation. |
| Stability was hardcoded | Contract item 5 requires real pre/post inventory equality for S. |
| Exact S invocation left mandatory `FixtureRoot` unbound | Contract item 5 requires S to bind exactly the approved invocation, without a fixture-root argument. |
| S evidence incomplete | Contract item 5 enumerates required Git, inventory, count/hash, ACL/owner, no-remote, manifest, and sidecar evidence. |
| Disk manifest omitted late assertions | Contract item 4 binds acceptance to a reloaded final persisted manifest and sidecar. |
| Path escape bypassed common core/reduced envelope | Contract item 3 requires common-core boundary validation and the full stop envelope. |
| No success-a/success-b determinism report | Contract item 4 requires a normalized comparison report with both hashes. |
| Output bounds were incompletely validated | Contract item 2 requires common pre-write, reparse-aware validation for every output destination. |
| Failed attempts lacked immutable records | Per-attempt lifecycle steps 4–5 require preflight/command/failure receipts and script snapshots before candidate execution. |
| Attempt parent exists before fixture creation | Contract item 7 requires independently absent fixture subroots and a bound layout receipt. |

## Exact proposed commands

Coordinator setup, after the recorded absence check only:

```powershell
git -C "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-20260813" worktree add -b "codex/w0-p01r-r1-fixture-20260913" "D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-r1-fixture-20260913" "cced8e20c8deb2eb21fb5ac242e65cebd3b2c322"
```

Builder commands, only after the matching per-attempt coordinator checkpoint. The outer harness first creates and freezes the snapshot/receipts; the candidate commands below run that snapshot. Substitute exactly one of the three named attempt roots consistently; do not create a fourth.

```powershell
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/script-snapshot.ps1" -Mode FixtureSuccess -FixtureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01" -SourceRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/fixture-success-source" -CaptureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/captures/success-a"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/script-snapshot.ps1" -Mode FixtureSuccess -FixtureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01" -SourceRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/fixture-success-source" -CaptureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/captures/success-b"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/script-snapshot.ps1" -Mode ExpectedInternalLink -FixtureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01" -SourceRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/fixture-internal-link-source" -CaptureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/expected/internal-link-stop"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/script-snapshot.ps1" -Mode ExpectedPathEscape -FixtureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01" -SourceRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/fixture-success-source" -CaptureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-01/expected/path-escape-stop"
```

The four commands above are the entire **candidate** R1 F command set; coordinator preflight/setup, the harness lifecycle, and routing-policy reads are bounded orchestration rather than candidate runs. The design and command contract are reviewed now. After ratification, the implemented `attempt-harness.ps1`, the complete candidate snapshot, and all four F outputs are reviewed together by the two required fresh, independent, read-only reviewers before S; this does not add another human gate. This proposal is frozen for owner review, unratified, and authorizes no execution.

### Exact conditional S command

After both F reviewers accept the same R1 snapshot and after S Step 0 coordinator ACK only, choose `NN` from exactly `01`, `02`, or `03`: it is the one successful R1 attempt whose `script-snapshot.ps1` SHA-256 is recorded identically in both F `ACCEPT` records. The selected snapshot is immutable; **the rejected R0 script is never read, copied, modified, or invoked by S.** No other argument may change.

```powershell
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-r1-fixture-proof-20260913/attempt-NN/script-snapshot.ps1" -Mode SourceCapture -PatentRoot "D:/Repos/keon-omega/keon-docs-internal/patents" -DoctrineRoot "D:/Repos/keon-omega/keon-doctrine" -CaptureRoot "D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01" -ExpectedToolSha256 "<exact SHA-256 recorded in both F ACCEPT records>"
```

This explicit R1 snapshot substitution replaces the rejected R0 script path in the previous prospective S command. S must record the selected `NN`, snapshot path, expected and actual SHA-256 values, and both F review-record digests in its final manifest; both required fresh, independent S reviewers verify those bindings read-only.

## Roles and checkpoints

- **Human owner:** may ratify this exact final amendment; no owner decision is implied by this draft.
- **Coordinator:** performs only pre-setup/setup administration and per-attempt checkpoints; consumes builder evidence but does not become the builder.
- **Dispatched builder:** creates the script and source-free attempt evidence under the exact allowed paths; provides evidence but no acceptance.
- **Coordinator failure review:** the read-only rejection of R0 is independent of the child author and supplies repair input only. It is not an F reviewer `ACCEPT`, cannot be counted toward either required F acceptance, and cannot authorize S.
- **Independent reviewers:** two separate, fresh, read-only reviewers examine the exact final script snapshot, implemented harness, and successful fixture evidence; neither runs nor changes anything.

## Required owner text after finalization

> Ratify W0-P01R-R1 exactly as specified in `W0-P01R-R1-source-free-attempt-recovery.md`. This authorizes only the bounded, source-free R1 fixture recovery under its exact three-attempt limit and checkpoints. It authorizes no protected-source or source-Git access before two independent F accepts and a later S Step 0 coordinator ACK; no source mutation, staging, commit, merge, push, fetch, pull, remote operation, package drafting, counsel transmission, disclosure, filing, payment, or alteration of any prior or ended fixture root. S remains digest-bound to the two accepted F reviews and requires two independent S accepts before W0 downstream work resumes.
