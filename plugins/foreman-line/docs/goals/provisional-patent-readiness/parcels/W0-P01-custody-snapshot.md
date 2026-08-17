# Parcel: W0-P01

## Goal

Create one copy-only, local custody snapshot of the preservation-critical patent and doctrine source trees, with a SHA-256 manifest that permits independent verification.

## Initiative

`provisional-patent-readiness`

## Project Track

W0 preservation/provenance; sources are T-patent and T-doctrine.

## Wave

W0-P01 (first, serial)

## Branch

`codex/w0-p01-custody-snapshot-20260813`

## Worktree

`D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-20260813`

## Dependencies

- D6–D15 and plan-review triage ratified.
- Gate 2 granted.
- Active loop item is W0-P01.

## Integration Surfaces

- Read-only patent root: `D:/Repos/keon-omega/keon-docs-internal/patents/`.
- Read-only doctrine root: `D:/Repos/keon-omega/keon-doctrine/`.
- Local retry output root, absent at coordinator preflight: `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-02/`.

## Security Gate

Hard Rule Zero and the T-patent/T-doctrine preservation constraint apply. Treat output and hashes as confidential local evidence. No ACL change is authorized.

## Allowed Files

Read-only recursive source roots:

- `D:/Repos/keon-omega/keon-docs-internal/patents/`
- `D:/Repos/keon-omega/keon-doctrine/`
- `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/charter.md`
- `D:/Repos/agent-skills-worktrees/provisional-patent-readiness-w0-p01-20260813/plugins/foreman-line/docs/goals/provisional-patent-readiness/loop-directive.md`

Non-mutating local Git reads only, limited to classification of those two exact source roots:

- `D:/Repos/keon-omega/keon-docs-internal/.git/`
- `D:/Repos/keon-omega/keon-doctrine/.git/`

Create/write only beneath this exact initially absent root:

- `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260817-w0-p01-custody-snapshot-retry-02/`

The output root may contain only `payload/`, `custody-manifest.json`, `custody-manifest.sha256`, and `snapshot.ps1`. `snapshot.ps1` is a local audit artifact, not executable source material for any product. The original partial output root remains untouched.

## Forbidden

- Any mutation in either source or its Git metadata: move, delete, rename, overwrite, stash, clean, restore, reset, checkout, rebase, merge, commit, branch, index update, GC, fsck, repack, prune, maintenance, or config.
- Remote operations: fetch, pull, push, clone, PR, remote API, CI trigger, deploy, publish, container push, or credential access.
- Reparse-point traversal or copying a target outside an Allowed Files root.
- Temp files, archives, or manifests in a source tree; ZIP/TAR/bundle creation; output overwrite or reuse; deletion of partial output after a stop.

## Out of Scope

W0-P02 through W0-P06; code/doctrine edits; mechanism analysis; claim drafting; legal conclusions; remote or filing-system action.

## Existing Patterns To Follow

- Ratified charter W0-P01 and D13.
- Loop directive's Step 0, no-remote, and evidence-only requirements.

## Contract

### Step 0 restate-and-stop gate

Before any write, restate Hard Rule Zero; both exact source roots; the exact retry output root; copy-only behavior; W0-P01-A1 exclusions/link rules; and that an existing output, `LINK_INTERNAL`, source instability, path escape, or mutation-capable command requires an immediate stop. Do not write unless all statements are true.

### Snapshot

Create the retry output directory once, without overwrite behavior. Before source traversal, initialize the manifest-entry schema with a writable `payloadSha256` field and run an in-memory schema smoke check that assigns and reads it. Copy every regular on-disk file and empty directory below each source root, preserving relative paths and bytes, into `payload/keon-docs-internal-patents/` and `payload/keon-doctrine/`. Use a Windows PowerShell-compatible relative-path implementation that rejects paths outside each exact source root; do not use `[IO.Path]::GetRelativePath`. Do not copy `.git` or dereference reparse points. Apply W0-P01-A1: listed build-ephemera directory names are `EXCLUDED` / `BUILD_EPHEMERA` with only nonrecursive immediate-child count or enumeration error; external reparse points outside that class are `LINK_OPAQUE` with no traversal; an internal reparse point outside that class is `LINK_INTERNAL` and stops for ruling. Every exclusion/link entry must appear in the manifest.

Record pre- and post-copy inventories. The JSON manifest must give each source and copied entry's relative path, type, byte length, SHA-256 where a regular file exists, copy result, source/payload counts, source stability result, and aggregate hash comparison. It must also record local HEAD, tracked/untracked/ignored/staged-dirty/unstaged-dirty/deleted classifications where applicable, timestamps, output-parent owner/ACL observation, builder/session identity, and `remoteOperations: false`. A tracked-but-deleted worktree file is recorded as an absent manifest entry, never fabricated in payload.

Write the SHA-256 sidecar only after finalizing the manifest. `snapshot.ps1` must contain the exact operation logic and must not read/write outside the Allowed Files roots.

Doctrine is included because the charter marks it preservation-critical, not because this parcel makes any patent-content claim.

## Required Tests

- Retry output absent before creation; parent exists and is not a reparse point; original partial output remains present and unchanged.
- Source inventory before and after capture is identical.
- Every copied regular file matches the source SHA-256.
- Source/payload file and directory counts match, accounting explicitly for tracked-deleted paths.
- Manifest is valid JSON and reports both tracks, classifications, stability, and `remoteOperations: false`.
- Sidecar matches a fresh manifest SHA-256.

## Acceptance Criteria

- Only the exact output root is created or changed.
- Both source payloads, the manifest, sidecar, and audit script exist.
- Builder evidence shows an intact source capture and no source, Git, or remote mutation.
- Any instability, mismatch, existing output, or `LINK_INTERNAL` reparse point is reported as a stop, not accepted. External links and listed ephemera exclusions follow W0-P01-A1 and must be manifest-recorded.

## Verification

The builder reports command categories and results without printing confidential content. An independent reviewer must re-hash the manifest, verify payload counts and a deterministic sample, compare classification with non-mutating local Git reads, and return accept/reject/needs-reproduction.

## Evidence Required

- Step 0 restatement.
- Output-absent preflight and single-creation result.
- Manifest/sidecar paths and hashes.
- Per-track counts, classifications, source-stability, and payload-integrity results.
- Command record showing no remote/source mutation.
- Independent reviewer disposition.

## Collision Risk

High if a source changes concurrently, a `LINK_INTERNAL` reparse point occurs, or the fixed output root exists. Fail closed and preserve any partial output.

## PR Notes

No commit, merge, PR, push, or remote operation is authorized for this output-only custody parcel.

## Session Handoff

- Starting and ending source observations.
- Output root, manifest/sidecar hashes, counts, and classifications.
- Source stability and payload integrity results.
- Command categories and any stop/partial-output location.
- Do not advance W0-P02.

## Stop-and-Report Rule

Stop immediately if Step 0 cannot be truthfully restated; a source/Git read is unavailable; output exists or cannot be created once; a path escapes scope; `LINK_INTERNAL`, source drift, hash/count/classification failure, mutation-capable command, remote need, unclear security boundary, or charter stop condition occurs.
