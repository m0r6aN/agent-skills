# Amendment W0-P01-A1: Reparse Point Custody Treatment

Status: ratified 2026-08-13 by Clinton Morgan.

## Ratified custody rules

- Exclude the class `node_modules`, `bin`, `obj`, `.next`, `.artifacts`, `.vs`, `.venv`, `dist`, `packages`, `.turbo`, `.nuget`, and `TestResults` without recursive traversal, hashing, or size calculation. Record every exclusion as `EXCLUDED` / `BUILD_EPHEMERA`, its source-relative path, immediate-child count (or enumeration error), and `traversed: false`.
- A reparse point outside an excluded class is recorded as `LINK_OPAQUE`, never traversed. Record its type, resolved-target metadata where available, target-within-root state, and `traversed: false`.
- An internal reparse point outside an excluded class is `LINK_INTERNAL` and stops W0-P01 for a per-instance ruling.
- The existing `spreadsheet-work/e-c2-20260712/node_modules` symbolic link is `EXCLUDED`; do not traverse or resolve its target during the W0-P01 retry.

## OR-P23 withdrawal and replacement

OR-P23 is withdrawn. `_orchestration` remains in `patents`; no content is moved or renamed.

OR-P23R is authorized before the W0-P01 retry, with this exclusive mutation scope in the existing local T-patent checkout:

- remove only `patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules` (a symbolic link to an external machine-local runtime cache);
- update root `.gitignore` with the remaining approved ephemera patterns, retaining its existing `node_modules/` rule;
- create `patents/discovery-round-1/_orchestration/README.md` documenting that the directory holds evidentiary work product and why it remains under `patents`.

The 517 regular files and 48 directories observed under `_orchestration` are out of scope and must remain untouched. The link removal is reported in the README with path, link type, and target. A pathspec-only commit may include only `.gitignore` and the new README; the ignored/untracked link removal is recorded in the README and builder evidence, not staged as a deletion.

## W0-P01 retry condition

W0-P01 may retry only after accepted OR-P23R evidence. It writes to a new output root; the existing partial output remains untouched.
