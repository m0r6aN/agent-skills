# Integration attempt01 — unborn HEAD diagnosis and correction

Verdict: **APPROVE the narrow runner correction**, subject to parent inspection/publication before a fresh attempt02. This is a runner review, not an integration pass.

Retained attempt: `C:/Users/clint/AppData/Local/Temp/fk-r31-main-integration-final-attempt01`. Its `result.json` binds accepted R31 `1747c1df7dfa4677d345390ac673c3d15c82b980`, main `476b8df6efe6c9974879957147449f61c34cd9a0`, source `8d500704c9e3d6d8b652bbe838aa3623f88203fc` and source tree `8607bd69b51e9fd84244b1837b9e75814ba2d00f`.

The first command, `git --git-dir=<verification-bare> rev-parse HEAD`, exited **128** after approximately **0.0556 seconds** at `2026-09-07T18:50:31.479844+00:00`. Its retained stderr reports HEAD is an unknown revision. `result.json` records failure before the initial reference snapshot completed. No merge-tree, fixture or Node step was reached.

Read-only inspection confirms raw HEAD contains `ref: refs/heads/master`, and `git symbolic-ref -q HEAD` succeeds with `refs/heads/master`. That target is unborn. The repository has other heads and verification refs; it is not empty and is not restricted solely to refs/verify. Resolving HEAD is unnecessary because the runner uses explicit main/R31/source identities and pinned historical Git objects.

The correction changes only `refs()`:

- Read the actual bare `HEAD` file as bytes and retain its hex representation, preserving exact symbolic or detached HEAD content without resolving it.
- Preserve `symbolic-ref -q HEAD` with allowed exits 0/1, supporting symbolic and detached HEAD states.
- Preserve full `show-ref` comparison; operational errors still fail. This repository has refs, so no empty-ref special case is needed.
- Persist each complete before/after snapshot as JSON and compare the returned records using the existing equality check.

This does not move HEAD, create master, update any ref, weaken explicit commit-type checks or alter the integration subject. Exact raw bytes strengthen the HEAD preservation evidence. Snapshot collection is sequential, not an atomic transaction; as before, the owned verification repository must remain quiescent for the bounded check.

The failure is an overly strict runner precondition, not a registry/runtime incompatibility. Keep attempt01 unchanged. A new attempt directory is required for retry after the parent reviews and publishes the runner. No Node, runner, fixture, ref mutation, commit or push was executed in this correction task; only the authorized function and this diagnosis were edited.
