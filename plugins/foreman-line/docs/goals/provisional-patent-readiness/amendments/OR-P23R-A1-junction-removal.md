# Amendment OR-P23R-A1: Junction Removal

Status: ratified 2026-08-13 by Clinton Morgan.

The OR-P23R builder's Step 0 established that the named object is a Windows directory reparse point with `LinkType=Junction`, not a symbolic link. The developer authorizes removal of exactly `patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules` as that external Windows junction.

Every other OR-P23R constraint remains unchanged: do not traverse or access its target; do not touch the 517 regular files or 48 directories; mutate only the named junction, root `.gitignore`, and new `_orchestration/README.md`; stage and commit only `.gitignore` and README; perform no remote operation.
