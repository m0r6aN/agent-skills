# Replacement Design: W0-P01R Custody Tool

Status: **design only — human ratification required before execution**  
Purpose: replace the tripped W0-P01 implementation path without reading a preservation-critical source root until the tool passes a deterministic synthetic-fixture gate.

## Custody and authority boundary

- Technical queue owner: the owner recorded in `loop-directive.md`; ownership has not transferred.
- Preservation-critical sources: `D:/Repos/keon-omega/keon-docs-internal/patents/` and `D:/Repos/keon-omega/keon-doctrine/`.
- Protected sources remain read-only. This design neither reads their content nor permits a source-capture execution.
- The existing W0-P01 tripwire remains in force. W0-P01, W0-P02, and every downstream parcel remain blocked.
- This design-only artifact authorizes no remote operation, disclosure, filing, payment, counsel transmission, source mutation, source-Git mutation, cleanup, or alteration of prior partial roots. A prospective ratification may permit only the named coordinator `git worktree add` administration for the exact fixture worktree; it never permits staging, commits, merges, pushes, fetches, pulls, or changes to protected-source Git state.

## Known partial-output custody locators

| Root | Files | Directories | Manifest / sidecar | `snapshot.ps1` SHA-256 |
|---|---:|---:|---|---|
| `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot/` | 1 | 0 | absent / absent | `7205655192528e01393ee693f0f97165dcf7772cf8ba16a6a9dc714492b38488` |
| `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot-retry-20260813-01/` | 1 | 1 | absent / absent | `09928e0d4f49872e8d9ea5e49c8678a2e12ba05fd3e4a4abb45ab34d964f2ea6` |
| `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-01/` | 2 | 75 | absent / absent | `280ea39775f17b5053abc90cc1a97858038fbf60e8efdea2f7808508c6c6f3a4` |
| `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-02/` | 1 | 1 | absent / absent | `552003dc9ca8d7c9f3b23963f4476de813027ad9b0c0ba65551462430a4307b5` |

These roots are evidence objects. They are not test inputs, and they must not be reused, changed, or deleted.

## Proposed parcel: W0-P01R-F — source-free fixture proof

### Goal

Prove one custody implementation against a synthetic, local fixture before the implementation may enumerate or copy either preservation-critical source.

### Proposed isolated locations and branch

- Base: `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322` on `codex/provisional-patent-readiness-20260813`. The builder reads this separately hash-pinned design from the control worktree; it does not infer its base from a later receipt revision.
- Builder branch: `codex/w0-p01r-fixture-20260913`.
- Builder worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-fixture-20260913/`.
- Fixture root: `D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-fixture-proof-20260913/`.
- Synthetic success source: `<fixture-root>/fixture-success-source/`.
- Synthetic external referent: `<fixture-root>/referents/external-target/`.
- Synthetic internal referent: `<fixture-root>/fixture-internal-link-source/authored-internal-target/`.
- Success capture outputs: `<fixture-root>/captures/success-a/` and `<fixture-root>/captures/success-b/`.
- Controlled-stop outputs: `<fixture-root>/expected/internal-link-stop/` and `<fixture-root>/expected/path-escape-stop.json`.

### Setup and Step 0 sequence

1. **Coordinator pre-setup check:** before `git worktree add`, verify and record that the exact builder branch, builder-worktree path, fixture root, and conditional S source-output root are absent. This check performs no source enumeration or source/Git read.
2. **Permitted setup:** only after that record, the coordinator may create the named branch/worktree with `git worktree add`.
3. **Builder Step 0:** inside the newly created worktree, verify the exact worktree path, base commit `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322`, and builder branch; verify fixture root and conditional S source-output root remain absent; restate the source-free F boundary and stop for coordinator ACK. This check performs no source enumeration or source/Git read.
4. **S Step 0:** after F has two accepts, but before any source traversal, recheck only the source-output root's absence, the script's actual/expected digest equality, the two recorded F accepts, unchanged invocation/source-root arguments, and all prior-partial-root preservation. Restate and stop for coordinator ACK. Source enumeration begins only after that ACK.

The fixture root must not be placed inside a source repository, a prior partial-output root, or a cloud-synced location.

### Exact write scopes

| Actor | Permitted writes | Prohibited writes |
|---|---|---|
| Coordinator setup only | Git administrative metadata required by `git worktree add` for the exact worktree/branch above; no product or patent source path | Fixture root contents, protected sources, prior partial roots, remote state |
| Builder | `tools/w0-p01r-fixture.ps1` in the named builder worktree; every synthetic fixture, capture, manifest, sidecar, and result beneath the exact fixture root | Any protected source, its `.git`, prior partial root, control worktree, remote, or other repository path |
| Reviewers | None; read-only inspection only | Any write, commit, staging, worktree setup, remote operation, or fixture rerun |

The builder does not commit, stage, merge, push, fetch, pull, or alter Git state. Its only permitted write outside the fixture root is its one script file in the named worktree. Coordinator setup administration is limited to the exact worktree creation above.

### Implementation contract

1. Use one PowerShell implementation compatible with Windows PowerShell 5.1; do not call `[IO.Path]::GetRelativePath`.
2. Canonicalize a source root once. Derive a relative path only by case-insensitive prefix comparison against that exact root plus a separator; reject the path if it is equal to neither the root nor a child of the root. Do not compute a relative path by `Replace()`.
3. Create each manifest entry as an `[ordered]` dictionary with every field initialized, including `payloadSha256 = $null`; assign post-copy values via dictionary keys, not dynamic object properties.
4. Before fixture traversal, perform an in-memory schema test that creates a regular-file entry, assigns a known hash string to `payloadSha256`, reads it back, and asserts all required fields exist.
5. Before fixture traversal, parse the complete script with PowerShell's parser API and fail if parser errors exist. The complete `SourceCapture` mode and the same copy/classification/manifest/stability core that it invokes must already be present in this reviewed script.
6. Construct three separate synthetic test inputs. `fixture-success-source` contains regular files, an empty directory, every A1 excluded-leaf directory, and one external junction to `referents/external-target`. `fixture-internal-link-source` contains the internal junction to its own `authored-internal-target`. The path-escape case is an explicit helper invocation with a candidate outside its asserted root. Junctions may point only to synthetic fixture paths. If junction creation is unavailable, record a failed prerequisite rather than substituting a source link.
7. The two success captures process only `fixture-success-source`. Assert: excluded leaves produce nonrecursive `EXCLUDED` / `BUILD_EPHEMERA` entries; the external junction produces `LINK_OPAQUE` without target traversal; copied regular-file hashes match; empty directories persist; manifest and sidecar hashes verify. The success tree contains no internal link and no path-escape candidate.
8. The internal-link mode processes only `fixture-internal-link-source`. It must emit a `LINK_INTERNAL` stop record in `expected/internal-link-stop/` and must not create an accepted capture. The path-escape mode must reject the outside candidate and write its controlled result only to `expected/path-escape-stop.json`. Neither expected-failure mode may make success-capture determinism impossible.
9. `FixtureSuccess`, `ExpectedInternalLink`, and `ExpectedPathEscape` modes run the same `Invoke-CustodyCapture` copy/classification/manifest/stability core that `SourceCapture` will later invoke, differing only in synthetic inputs and expected result. Run success mode twice against the two initially absent success capture output subroots. Both result manifests must match apart from explicit run timestamps and output-root fields. Fixture modes only may not read `keon-docs-internal/patents/`, `keon-doctrine/`, their `.git` directories, or any prior partial root. The prospective conditional `SourceCapture` mode is separately bounded below and is never runnable before F acceptance.

### Deterministic invocations

All commands are proposed future commands, not executed under this design:

```powershell
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\Repos\agent-skills-worktrees\provisional-patent-readiness-w0-p01r-fixture-20260913\tools\w0-p01r-fixture.ps1" -Mode FixtureSuccess -FixtureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913" -SourceRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\fixture-success-source" -CaptureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\captures\success-a"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\Repos\agent-skills-worktrees\provisional-patent-readiness-w0-p01r-fixture-20260913\tools\w0-p01r-fixture.ps1" -Mode FixtureSuccess -FixtureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913" -SourceRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\fixture-success-source" -CaptureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\captures\success-b"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\Repos\agent-skills-worktrees\provisional-patent-readiness-w0-p01r-fixture-20260913\tools\w0-p01r-fixture.ps1" -Mode ExpectedInternalLink -FixtureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913" -SourceRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\fixture-internal-link-source" -CaptureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\expected\internal-link-stop"

powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\Repos\agent-skills-worktrees\provisional-patent-readiness-w0-p01r-fixture-20260913\tools\w0-p01r-fixture.ps1" -Mode ExpectedPathEscape -FixtureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913" -ResultPath "D:\Repos\keon-omega-preserve\provisional-patent-readiness-w0-p01r-fixture-proof-20260913\expected\path-escape-stop.json"
```

### Required manifest schema

Every success manifest must be JSON with these required fields: `schemaVersion`, `mode`, `toolSha256`, `fixtureRoot`, `sourceRoot`, `captureRoot`, `startedAtUtc`, `completedAtUtc`, `remoteOperations`, `sourceStability`, `counts`, `entries`, and `assertions`. Each `entries[]` item must contain `relativePath`, `entryType`, `classification`, `traversed`, `byteLength`, `sourceSha256`, `payloadSha256`, `copyResult`, and the applicable one of `reason`, `immediateEntryCount`, `enumerationError`, `linkType`, `resolvedTarget`, or `targetWithinRoot`. The schema requires `payloadSha256` to exist even when null. Expected-stop records use the same envelope plus `stopReason`; they are not accepted captures.

### Required evidence

- Fixture layout manifest (paths/types only; no unrelated source content).
- Script SHA-256 and parser result.
- Pre-copy in-memory schema test result.
- Each expected classification and assertion result, including the controlled internal-link stop.
- Both fixture manifest hashes, sidecar verification results, and a deterministic comparison report.
- Command ledger proving builder writes were limited to the named worktree script file and the fixture root, coordinator setup writes were limited to named worktree administration, and no protected-source/Git/remote operation occurred.
- **Two independent, fresh, read-only adversarial reviews**. Each must reproduce script/manifest hashes, output classifications, expected-stop behavior, and write-scope checks; reviewers never fix, commit, or rerun the fixture. The dual-review requirement supersedes the earlier single-review wording because this is an architecture/risk parcel.

### Failure rule

Any parser, schema, relative-path, type, classification, hash, determinism, reparse, path-boundary, or write-scope failure ends the parcel. Preserve its fixture output and do not access a preservation-critical source.

## Combined conditional owner option: W0-P01R-F/S

The ratified tripwire requires a replacement custody-tool design that proves itself synthetically **before** it reads a preservation-critical source. It does not state that a second human approval is required after the synthetic proof. The controlling stop text is:

> "ratify a replacement custody-tool design parcel that proves all object construction, relative-path, manifest-schema, exclusion/link classification, and copy-loop behavior against a synthetic local fixture before it is permitted to read a preservation-critical source root."

Accordingly, the owner may ratify the following serial F/S option in one decision. This is a conditional authorization, not permission for an early source read:

1. **F — fixture proof:** execute the source-free fixture phase above. Two independent fresh, read-only reviewers must each return `ACCEPT` on the fixture evidence.
2. **S — source capture:** only after both F reviews accept, run the script unchanged against the two exact source roots:
   - `D:/Repos/keon-omega/keon-docs-internal/patents/`
   - `D:/Repos/keon-omega/keon-doctrine/`
3. The source output root is `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260913-w0-p01r-source-capture-01/`. It is verified absent at design time and must be absent again at capture Step 0. It must never reuse or alter any prior partial root.
4. Before S starts, the builder records the accepted F script SHA-256 as `expectedToolSha256`. The capture invocation must calculate its script SHA-256 and refuse unless it exactly equals that accepted value. No script, fixture, schema, invocation, source list, or link/exclusion rule may change between F acceptance and S completion.
5. S receives independent read-only acceptance before the existing W0 downstream dependency gate clears. Because S is a custody-risk parcel, it receives two fresh independent reviewers; neither writes, reruns, fixes, commits, or contacts a remote.

### Source-capture write scope and invocation

S uses the script exactly as reviewed in F; **all script edits are forbidden after F review acceptance**. During S the builder may write only paths below the new source-output root. It may read only the two exact source roots and their local Git metadata for classification. It may not read any prior partial root, mutate a source or Git state, contact a remote, create a commit, or write elsewhere.

The following is a proposed future command, not executed under this design. Replace `<accepted-fixture-script-sha256>` only with the digest recorded in both F review acceptances:

```powershell
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\Repos\agent-skills-worktrees\provisional-patent-readiness-w0-p01r-fixture-20260913\tools\w0-p01r-fixture.ps1" -Mode SourceCapture -PatentRoot "D:\Repos\keon-omega\keon-docs-internal\patents" -DoctrineRoot "D:\Repos\keon-omega\keon-doctrine" -CaptureRoot "D:\Repos\keon-omega-preserve\provisional-patent-readiness-20260913-w0-p01r-source-capture-01" -ExpectedToolSha256 "<accepted-fixture-script-sha256>"
```

### Source-capture evidence and acceptance

The S manifest uses the required schema above and additionally records `expectedToolSha256`, `actualToolSha256`, `patentSourceRoot`, `doctrineSourceRoot`, a per-track baseline Git classification summary, pre/post source inventories, source-stability results, payload/source count equality, aggregate and per-file SHA-256 comparisons, every A1 `EXCLUDED`, `LINK_OPAQUE`, and `LINK_INTERNAL` entry, output ACL/owner observation, and `remoteOperations: false`.

`LINK_INTERNAL`, a source-inventory drift, a hash/count mismatch, script-digest mismatch, pre-existing output root, command outside write scope, Git/source mutation, or remote operation stops S and preserves its output. Only a complete manifest plus sidecar, per-track stable inventory, successful hash comparisons, and both independent S `ACCEPT` reviews satisfy W0-P01's custody evidence requirement. Existing W0-P02 through W0-P06 remain blocked until then.

The earlier F-only option remains available: it authorizes only fixture proof and reviews, not S. Neither option authorizes package drafting, counsel transmission, disclosure, filing, payment, or a change to the patent corpus.

Once S has both required independent acceptances and the existing W0 dependency gate clears, the already-ratified standing authorization for post-custody W0–W4 preparation governs within its original boundaries. This replacement neither starts that work early nor introduces a new blanket human gate after custody evidence is accepted.

## Metadata-only patent-record locators (content not reviewed in this parcel)

| Category | Locator |
|---|---|
| Filing controls / prior directive | `D:/Repos/keon-omega/keon-docs-internal/patents/FINAL-DIRECTIVE-operation-receipt.md`; `AMENDMENT-01-operation-receipt-filing-controls.md`; `operation-receipt-brief.md` |
| Invention inventory / disclosure ledger | `patents/discovery-round-1/01-consolidated-invention-inventory.md`; `03-public-disclosure-ledger.md` |
| Per-candidate records | `patents/discovery-round-1/*/invention-disclosure.md`; `implementation-evidence.md`; `public-disclosure-analysis.md`; `technical-addendum-draft-2026-07-12.md` |
| Draft applications | `patents/drafting-round-1/01-family-a-provisional-draft.md`; `02-family-b-provisional-draft.md`; `03-family-d-provisional-draft.md`; `04-family-c-status-and-gate.md` |
| Drafting gate / operator decisions | `patents/drafting-round-1/05-prerequisite-task-status.md`; `06-open-questions-for-operator.md`; `08-external-review-adjudication.md`; `00-round-log.md` |
| Counsel / approval record | `patents/operator-counsel-package-approval-2026-07-12.md`; `patents/discovery-round-1/_orchestration/outputs/e-c3-20260712/` |
| Disclosure audit | `patents/legal/keon-sdk-ts-family-a-disclosure-audit.md` |
| Conception evidence | `patents/discovery-round-1/conception-evidence/` |
| Receipt / capture evidence | `patents/drafting-round-1/routing-receipts.md`; `patents/discovery-round-1/_orchestration/README.md`; `patents/discovery-round-1/_orchestration/plugin-evidence/` |

These locators establish only that local artifacts exist. They do not establish inventorship, ownership, filing status, legal sufficiency, clearance, or counsel approval.

## Owner decision requested

### Preferred: combined conditional W0-P01R-F/S

Ratify **W0-P01R-F/S** exactly as specified above. This permits only coordinator setup of the named fixture worktree, fixture F, two independent F accepts, then unchanged digest-bound S, and two independent S accepts. It authorizes no protected-source access before F accepts; no source mutation, source-Git mutation, staging, commit, merge, push, fetch, pull, remote operation, package drafting, counsel transmission, disclosure, filing, payment, or alteration of any prior partial root. After S acceptance, existing W0–W4 standing preparation authority resumes only within its already-ratified scope.

### Alternative: F-only

Ratify **W0-P01R-F only**: a source-free synthetic-fixture proof and two independent read-only reviews under the exact contract above. It authorizes no protected-source read or source capture and does not alter the existing later gate structure.
