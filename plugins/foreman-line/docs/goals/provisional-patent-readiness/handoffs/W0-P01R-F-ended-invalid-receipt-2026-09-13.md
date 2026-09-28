# W0-P01R-F Ended-Invalid Receipt

Status: **ENDED_INVALID — no acceptance; no S authorization.**

## Authority and role record

- A human user ratified the combined conditional W0-P01R-F/S text directly in the root task on 2026-09-13.
- The coordinator later issued an F Step 0 ACK after independently verifying that direct ratification, the pinned base, worktree/branch, absent roots, and the controlling routing blob.
- The failed implementation was produced and invoked in the coordinator turn itself, **not** by a separately dispatched builder session. This violates the intended builder/coordinator role separation and is one reason the attempt is not acceptable.

## Immutable failure record

1. The initial `FixtureSuccess` invocation failed before fixture-root creation at `Get-CanonicalPath`: `Cannot convert value "\\" to type "System.Char". Error: "String must be exactly one character long."` The implementation used `[char]'\\'` rather than a one-character separator literal.
2. The coordinator then corrected only the untracked builder-worktree script and reran F. The current script SHA-256 is `BE8E4B6D3504E248DF7D5FF9379003E019C0229BCFD70BFBC6F6354E97431659`.
3. The rerun failed at `Invoke-CustodyCapture` with `Argument types do not match` at script line 336, after creating only synthetic fixture material and `captures/success-a/payload`.
4. The original contract's failure rule covers type failures without a pre-output exception. The correction/rerun was therefore unauthorized under that contract. This receipt does not excuse it.

## Preserved state

- Failed root: `D:/Repos/keon-omega-preserve/provisional-patent-readiness-w0-p01r-fixture-proof-20260913/`.
- Preserved-evidence audit: `C:/Users/clint/Documents/Codex/2026-09-13/keon-patent-readiness/fixture-failure-preservation-manifest.json`, observed 2026-09-13T11:49:26.615528+00:00. It inspected only the failed synthetic fixture, skipped both reparse points without traversal, and left originals unchanged.
- Audit inventory: 42 entries — 18 regular files, 22 directories, and 2 opaque reparse points.
- Present: the only top-level child of `captures/success-a/` is `payload/`; that payload contains `empty-directory/` and two copied synthetic files, `nested.txt` (26 bytes, SHA-256 `455cb0350a458975ba4afeb593cb61a3c2b930c06569805acd0f45150274927e`) and `regular.txt` (27 bytes, SHA-256 `42cb127fcf90d98fa84d553f772c90720037a828a422b8d1c56eb34b038781b6`). It is not an empty payload.
- Absent: `captures/success-a/manifest.json`, `captures/success-a/manifest.sha256`, `captures/success-b/`, expected internal-link stop, and expected path-escape result.
- Builder worktree: `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01r-fixture-20260913/`, branch `codex/w0-p01r-fixture-20260913`, HEAD `cced8e20c8deb2eb21fb5ac242e65cebd3b2c322`, with only untracked `tools/w0-p01r-fixture.ps1`.
- Protected sources, their Git metadata, all four earlier partial roots, and the conditional S output root were not accessed or altered. No staging, commit, remote operation, or S invocation occurred.

## Consequence

F has no accepted fixture output or reviewer acceptance. S is not authorized. Preserve every failed artifact without cleanup, deletion, normalization, or reuse. Any recovery requires separately ratified scope; the companion proposed R1 amendment is not ratified and must incorporate independent read-only defect findings before it is frozen for owner review.
