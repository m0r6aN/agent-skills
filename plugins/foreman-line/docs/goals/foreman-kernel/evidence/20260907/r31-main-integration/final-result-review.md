# R31 hypothetical-main integration — independent result review

Verdict: **APPROVE the bounded integration-check result. No blocking finding.** This approves the evidence that the specified hypothetical tree preserves the tested authority-registry inputs and passes its CLI checks and generation idempotence. It does not approve a merge or certify unrelated package/CI behavior.

Reviewed retained originals: `C:/Users/clint/AppData/Local/Temp/fk-r31-main-integration-final-attempt03`. Result interval: **2026-09-07 18:55:45.251044–18:56:29.779259 UTC**. The coordinator reports outer runner direct exit0; this review independently read status `pass`, all 24 child-command metadata files with direct exit0 and no timeout, their relevant streams, and the input/materialization manifests. No Node or runner was rerun.

| Exact subject | Identity |
| --- | --- |
| Accepted R31 | `1747c1df7dfa4677d345390ac673c3d15c82b980` |
| Selected main | `476b8df6efe6c9974879957147449f61c34cd9a0` |
| Real source commit | `8d500704c9e3d6d8b652bbe838aa3623f88203fc` |
| Real source tree | `8607bd69b51e9fd84244b1837b9e75814ba2d00f` |
| Conflict-free hypothetical tree | `a9df33c71d0e34ddae277d312a04f7a97dd66480` |
| Owned fixture parent | `C:/Users/clint/AppData/Local/Temp/fk-r31-integration-h7vdnawi` |
| Executed Node | `D:/nodejs_symlinks/node.exe`, output **v24.7.0** |
| Node SHA256 in reviewed input/result | `c1b274a8d0a23e060fc42ce71c3cdfa1569b83d91ba82cc59fa907da97a425e9` |

Do not relabel the executed Node as v24.19.0 from earlier shaping-tool work. This check used the explicit reviewed binary above; authority-registry's package engine differs from the shaping-tool requirement.

## Evidence independently closed

- `0012-merge-tree` exited0 and emitted the exact tree above. The 153 actual delta entries match the reviewed exclusions one-for-one in path, before/after mode and blob. No protected path appears in that exclusion set.
- Parsed the retained accepted/source/main/merge NUL inventories independently. All **398 protected entries** match accepted and merged modes/blobs. All **18 source entries** match the real source tree, accepted tree and hypothetical tree and the recorded source SHA256 values.
- Rehashed all **1,359 materialized tracked files** against both the retained SHA256 manifest and raw Git blob identities using the Git blob header/preimage. All matched. This independently checks the materialized bytes rather than trusting the runner's success flag.
- Before/after raw HEAD hex, symbolic HEAD and complete ref snapshots are equal. The unborn symbolic master was preserved. Alternate-index commands and fixture-root output belong to the owned temporary view; no branch merge or ref repair occurred.
- `0020-validate` and `0021-sweep` each exited0, emitted valid JSON with `valid:true`, `violations:[]`, and had empty stderr. Both report source8d, **18 sources / 1,585 items / 542 rules**, zero unresolved active conflicts, and the expected historical/open reconciliation distinctions. The historical missing-provenance record remains open; the current ledger addition did not manufacture its closure.
- `0022-generate-idempotence` exited0 with empty stderr, reported generation of one schema and the same 18/1585/542 counts. `post-command-file-deltas.json` is exactly `{}`: the captured all-file comparison includes registry, fixture, schema and private dependencies. Validate, sweep and generation durations were approximately **6.655 s**, **9.509 s** and **8.920 s**, respectively; these are verification timings, not D21 runtime latency evidence.
- Independently rehashed the original dependency source and private fixture copy: **1,535 files**, identical canonical tree SHA256 **`15a8448177c0981fd131cb2441c7a43fbad5a6e3e5074020d34af28dae240e7f`**, matching reviewed input. Rechecked dependency lexical ancestry and copied/source entries for symlink/reparse points. No mismatch or reparse was found. This is a post-run corroboration; the runner's successful admission/postcheck establishes its recorded before/after comparison.
- Independently checked both inert Git links across accepted/source/main/merge inventories. `.opencode/skills` is mode120000/blob `7fc7d9f7be858ee62e454c529b3f8deddd83e1d2`; `debug/latest` is mode120000/blob `83cc3f226b17278384e32056cfa8470b9ae43738`. Their physical fixture entries are ordinary non-reparse files containing the exact reviewed target bytes. No target was followed. The explicit inert reconstruction manifest records this limitation.

## Closure scope and reporting limitation

The literal local-import report starts at fixture-local CLI and generator and traverses authority-registry plus schema-scaffold. Those files and resolver ancestry are protected. The report's `external` array also contains regex false positives extracted from source strings, including `${repoRoot}` and statement fragments. Treat that array as a heuristic inventory, not an executable dependency graph. This is a **nonblocking reporting limitation**: prior static closure inspection, complete protected-input equality, exact private dependencies and successful fixture executions provide the relevant evidence here. No false-positive string is treated as an import, an exclusion authorization or proof of absence of computed I/O. Computed imports/dynamic reads remain bounded by the independently reviewed implementation and protected input set.

The fixture preserves every tracked blob's bytes, but intentionally does not reproduce the filesystem behavior of the two unrelated Git symlinks. Git modes are retained in the alternate index; Windows physical executable-bit or native symlink parity is not certified. No result about OpenCode discovery, debug target availability, marketplace installation, CI workflow behavior or the excluded packages follows from this check.

The retained actual streams and manifests are sufficient for this bounded acceptance. Parent publication may omit derived raw-blobs and NUL inventory payloads only while retaining their hashes, exact pinned reconstruction commands and the original local evidence location. This review inspected those raw originals; publication completeness/hash verification remains the parent's separate task. Attempts01/02 remain failed historical attempts, not successes hidden by attempt03.

No actual branch/main merge, GitHub CI run, human Gate3, P1 activation, deployment or future-main compatibility is established. Only this review file was written; no code edits, Node, runner rerun, commits or pushes occurred.
