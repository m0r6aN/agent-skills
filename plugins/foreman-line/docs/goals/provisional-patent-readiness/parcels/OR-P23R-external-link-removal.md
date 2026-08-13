# Parcel: OR-P23R

## Goal

Remove exactly one external-cache symbolic link, extend root ephemera ignores, and document the evidentiary purpose of `_orchestration` without touching its other contents.

## Initiative

`provisional-patent-readiness`

## Project Track

T-patent (`keon-docs-internal`)

## Wave

W0 pre-retry

## Branch

No new branch. The user expressly authorized this exact three-path exception in the existing local T-patent checkout because the required link and untracked evidence corpus do not exist in a separate worktree. A pathspec-only commit is required.

## Worktree

`D:/Repos/keon-omega/keon-docs-internal`

## Dependencies

- W0-P01-A1 ratified.
- W0-P01 stopped before payload copy.

## Integration Surfaces

- `D:/Repos/keon-omega/keon-docs-internal/patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules`
- `D:/Repos/keon-omega/keon-docs-internal/.gitignore`
- `D:/Repos/keon-omega/keon-docs-internal/patents/discovery-round-1/_orchestration/README.md`

## Security Gate

Hard Rule Zero. No remote operation. Treat local patent artifacts as confidential.

## Allowed Files

- `D:/Repos/keon-omega/keon-docs-internal/patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules`
- `D:/Repos/keon-omega/keon-docs-internal/.gitignore`
- `D:/Repos/keon-omega/keon-docs-internal/patents/discovery-round-1/_orchestration/README.md`

## Forbidden

- Move, rename, delete, or edit any of the observed 517 regular files or 48 directories beneath `_orchestration`.
- Traverse, copy, or modify the symbolic link target.
- Stage any path other than `.gitignore` and the new README.
- Remote operations, history rewrite, stash/clean/reset/restore, broad add, or commit of any unrelated dirty state.

## Out of Scope

OR-P23 relocation; any other cleanup; W0-P01 retry; patent/doctrine analysis; links other than the one Allowed Files link.

## Existing Patterns To Follow

- Ratified `amendments/W0-P01-A1-reparse-point-custody.md`.
- W0-P01 stop handoff.

## Contract

### Step 0 restate-and-stop gate

Before touching a file, restate the three exact allowed paths; that only the named symbolic link may be removed; its resolved target may not be opened or changed; all 517 regular files and 48 directories remain untouched; and only `.gitignore` plus README may be pathspec-staged and committed. Stop unless true.

Verify the named object is a symbolic link and record its path, type, and target as metadata without accessing the target. Remove the link itself only. Do not remove its parent or target.

Retain root `.gitignore`'s existing `node_modules/` rule and add exactly these approved root patterns if absent: `bin/`, `obj/`, `.next/`, `.artifacts/`, `.vs/`, `.venv/`, `dist/`, `packages/`, `.turbo/`, `.nuget/`, and `TestResults/`.

Create `_orchestration/README.md` stating that the directory contains locally retained evidentiary work product (captures, receipts, manifests, source-specific probes, and derived counsel-package artifacts) that supports the discovery round; it remains under `patents` because its content is part of that round's evidence trail and is not disposable tooling scratch. Record the removed link's path, symbolic-link type, and its external runtime-cache target; state that no other `_orchestration` content moved, renamed, or changed.

Stage only the exact `.gitignore` and README paths. Before committing, prove the staged path list contains exactly those two paths. Use a pathspec-only commit. The ignored link deletion is recorded in README and builder evidence; do not force-add it or stage surrounding untracked content.

## Required Tests

- Preflight proves the named path is a symbolic link and reports its target as metadata.
- After removal, the named path no longer exists; the target remains unaccessed.
- `.gitignore` contains the approved ephemera patterns once each.
- README exists and includes directory purpose, custody rationale, and link removal record.
- Recursive inventory of `_orchestration` excluding the named link verifies 517 regular files and 48 directories remain.
- `git diff --cached --name-only` contains exactly `.gitignore` and the README before commit.
- Pathspec commit contains exactly those two paths.

## Acceptance Criteria

- Exactly the one symbolic link is removed.
- The README and `.gitignore` are the only committed tracked changes.
- No other `_orchestration` content changes; no remote/source-wide Git mutation occurs.
- Builder provides evidence for independent review before W0-P01 retry.

## Verification

Builder reports metadata and counts, not confidential content. Independent reviewer verifies the commit path list, link absence, README/ignore content, and inventory count.

## Evidence Required

- Step 0 restatement.
- Link preflight type/target metadata and post-removal absence.
- Pre/post permitted inventory counts.
- Staged and committed path lists.
- Commit ID.
- No-remote attestation and independent reviewer disposition.

## Collision Risk

High: the repository is heavily dirty and the corpus is untracked. Pathspec staging and inventory checks are mandatory.

## PR Notes

No remote push or PR. The local commit is expressly authorized only for the two tracked paths.

## Session Handoff

- Link metadata and absence proof.
- Inventory result.
- `.gitignore`/README staged-path proof and commit ID.
- No-remote evidence and any blocker.
- Do not retry W0-P01 until review accepts this parcel.

## Stop-and-Report Rule

Stop if the named object is not a symbolic link, any path outside Allowed Files would change, the count check differs, the staged/committed list is not exactly two paths, the target would need access, a remote operation is needed, or any preservation/Hard Rule Zero condition fires.
