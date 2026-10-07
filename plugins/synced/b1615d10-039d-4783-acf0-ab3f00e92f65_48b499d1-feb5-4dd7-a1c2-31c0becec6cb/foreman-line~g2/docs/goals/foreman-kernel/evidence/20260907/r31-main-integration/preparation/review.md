# Anticipated integration exclusions — read-only preparation

Subject: pinned main `476b8df6efe6c9974879957147449f61c34cd9a0`, published R31 checkpoint `2fc39405988df4d7073f20d69b65a276329be83d`, merge base `354940e1d138b0555a68feab18cc9bc0680aa7dc`. This is preparation during active rerun36, not an acceptance or integration result. No merge-tree, Node, install, branch change or commit was executed. The obsolete `2a734` tree was not used.

`anticipated-exclusions.json` records exact Git modes/blob IDs from `git ls-tree -rz --full-tree` for all three subjects. Of 155 upstream-changed paths:

- **153 anticipated exclusions:** candidate equals merge base exactly in mode and blob, so an upstream-only main result is predicted. Every entry records before/after pins, merge-base pins, category and rationale.
- **2 already equal to upstream:** FOREMAN-LINE-PLAN and STANDING-CONSTRAINTS, already adopted by R31. They are protected and require no exclusion.
- **0 unresolved three-way interactions.**
- **0 protected upstream deltas requiring adoption.**

These counts describe upstream-changed paths, not all candidate changes or observed merged-tree output. If the accepted R31 checkpoint changes, recompute all comparisons and require the actual merge-tree delta to match before approving exclusions. A prediction never substitutes for conflict-free merge-tree execution and its direct exit.

The protected set contains the entire Foreman Kernel goal directory, authority-registry, schema-scaffold, all eighteen source paths, current FK-P0 active spec and present resolver-ancestry package/TypeScript/Plug'n'Play configuration. `protected_paths` is the explicit inventory at the pinned subjects; the runner's own protections remain necessary for later additions. Source/registry/evidence decisions are never excluded to make equality pass.

## Why the other paths are outside this check

Static inspection at checkpoint2fc confirms fixture entry modules are authority-registry `src/cli.ts` and `src/generate.ts`; their implementation dependencies are local authority modules, schema-scaffold and package dependencies. The explicit command path does not discover marketplace plugins, invoke root skills, run GitHub CI or execute other package tests. The registry reads the named registry file, registered source files and any current retirement-evidence paths. The inspected registry has no `retirementState: retired-from-agent-reading` entries; no excluded receipt is being used as current retirement evidence. The generator reads fixed source definitions and pinned Git objects, then writes its own schema/registry/fixture outputs.

Thus exclusions include separately identified marketplace/plugin metadata, CI orchestration/workflow files, other-goal receipt captures, unrelated docs/shaping records, root skill assets and unrelated package source/tests/configuration. Examples include dispatch routing evaluation, integration PR/rules machinery, receipts validation and routing-policy implementation. Their exact paths and pins are in the JSON. Some governed sources live in other packages, but those exact source paths remain protected: parsing a source file as corpus does not execute all code in that package. Nothing here certifies the excluded packages, CI, installation identifiers or workflows as integrated or correct.

This is inspect-only closure reasoning. The final runner must traverse the final CLI/generator literal imports, protect any additional discovered inputs/ancestry and require reviewed handling of computed imports or dynamic inputs. A new dependency into an anticipated excluded path invalidates that exclusion.

## Added lesson ledger and historical absence

Main adds `plugins/foreman-line/docs/transcripts/defects_lessons.md`; candidate and merge base do not contain it. Current addition is eligible for exclusion because it is not one of the eighteen sources and is not read as a current runtime evidence file by the inspected check.

The frozen `missing-provenance-reference` record binds absence to commit **`51857a3a7796b393c0c0a68712f98c06e7015d79`**. Its missing-path reference is the exact JSON pair of that commit and ledger path. The validator requires a corresponding Git-commit evidence entry and checks `git cat-file -e <bound-commit>:<path>`, not `existsSync` on the materialized ledger. Read-only verification confirmed the historical object is a commit and the path lookup fails there; exact command, direct exit and stderr are retained in the JSON. Static code locations are `src/validate.ts`'s missing-path evidence validation and Git evidence walk, and the generated registry's `missing-provenance-reference` record at checkpoint2fc.

Consequently, materializing the current ledger does not falsify historical missing-at-commit evidence. It also does not rewrite/close that frozen historical reconciliation or allow retirement of the standing constraints. Do not add the ledger to the governed source set or update old reconciliation records in this integration check.

## Handoff

The JSON is **not** a runner-ready authorization/dependency manifest. Root must review the reasons, pin final accepted SHA/source/tree, compare actual tree changes, and supply tested dependency and Node hashes and current decision inputs. Runner execution uses a new evidence attempt directory and preserves surfaced deltas before any stop. This preparation creates only `anticipated-exclusions.json` and this review; original worktrees/indexes remain untouched.

## Coordinator preparation disposition

The coordinator reviewed this inventory strategy and the explicit CLI/generator import/filesystem closure. The 153 path-specific exclusions are accepted as anticipated scope decisions for the pinned subjects, conditional on final accepted-R31 before-blob/mode equality, fresh selected-main identity, actual conflict-free merge output and exact actual delta-set equality. No protected path may be excluded. Expand the explicit protected set with every final R31 Foreman Kernel goal artifact before execution, so new completion evidence cannot be silently omitted. This is preparation approval under the recorded September7 authorization, not a main-integration verdict or merge approval.
