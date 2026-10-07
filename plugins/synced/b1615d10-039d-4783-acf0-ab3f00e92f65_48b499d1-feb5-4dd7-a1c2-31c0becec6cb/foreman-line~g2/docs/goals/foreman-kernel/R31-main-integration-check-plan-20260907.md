# R31 current-main integration check plan — September 7, 2026

Status: executable check design for after R31 full green and final reviews. No fixture, alternate index, merge-tree object, dependency copy, junction or Node process was created by this design task. It does not authorize current implementation or report integration success.

## Conclusion and evidence

An owned temporary work-tree view of a conflict-free merge tree can support the inspected authority-registry CLI without a synthetic merge commit or branch merge. Git's explicit `GIT_DIR` / `GIT_WORK_TREE` environment supplies root discovery and access to pinned historical objects. The registry retains its real R31 source snapshot commit; the hypothetical merge tree is a separate integration subject, never substituted for that source commit.

Read-only inspection used accepted R30 `c35ff72ef45fb19d647cede6acf5a13636911db7` in `C:/Users/clint/AppData/Local/Temp/fk-remote-verify-20260907.git`. The final R31 versions of these functions must be checked for changes before execution; unchanged source-first package bytes are not the final implementation.

| Inspected behavior | Consequence |
| --- | --- |
| `src/cli.ts` accepts `validate <registry> --repo-root <root>` and `sweep <registry> --repo-root <root>` | Both checks should receive the materialized root explicitly; validate without a root cannot verify retirement evidence |
| `src/validate.ts`, `repoRootCheck` canonicalizes the supplied directory and `git rev-parse --show-toplevel`, then compares them | A work-tree view configured by environment is sufficient for this implementation; it does not inspect a `.git` entry or require a registered linked worktree |
| Git subprocesses inherit environment and use the supplied root as cwd | The isolated Git context must remain set for the entire Node process and its children |
| Sweep uses `git cat-file -t/-p` on each declared snapshot commit and source path | Full historical objects and the real R31 snapshot must be present; merge tree need not be HEAD or a commit |
| Retirement verification reads declared evidence files beneath the root, with containment/type/symlink checks | The runtime input closure can exceed the eighteen source files; evidence paths must also match the tested subject |
| `src/generate.ts` derives packageRoot from its own module location, then repoRoot three parents above it | Execute fixture-local generator/CLI modules; invoking the original generator with a different cwd would still use the original tree |
| Generator reads pinned historical registries via `git show <commit>:<path>` and source bytes via pinned objects and local files | Full Git history is needed for idempotence; it does not require the hypothetical tree to be committed |
| Generator main writes schemas, registry YAML and pass-minimal fixture | Optional idempotence must run only in owned fixture space and compare all package outputs afterward |

A bounded read-only probe of `git --git-dir=<bare> --work-tree=C:/Users/clint/AppData/Local/Temp rev-parse --show-toplevel` returned exactly `C:/Users/clint/AppData/Local/Temp`. This confirms Git can expose an explicit work-tree root using this bare repository. It is not a CLI execution or materialization test. The inspected root/evidence paths contain no requirement that HEAD equal the source snapshot or merge tree. Do not infer that from the misleadingly stronger phrase “real Git worktree” in a comment; record this check as an explicit temporary work-tree view.

Tracked `.gitattributes` and `.gitmodules` were not found by filename inspection at accepted R30 or selected main `476b8df6efe6c9974879957147449f61c34cd9a0`. Repeat against the actual merged tree; global attributes, configured filters, line-ending conversion, symlinks and submodules still require materialization checks.

## Admission gates and input equivalence

Wait for R31's full deterministic chain, evidence publication and two final review dispositions. Record its exact accepted commit, actual source snapshot commit and registry manifest. Do not use mutable branch names for the check. Pin selected main explicitly; `476b8df6efe6c9974879957147449f61c34cd9a0` is the presently requested subject, not a promise it remains current later. If current-main status is claimed, refresh main's remote SHA read-only and select/review that exact head before computing the tree.

Before running Node, establish:

1. A successful, conflict-free `git merge-tree --write-tree <main-sha> <accepted-R31-sha>` result and its exact resulting tree ID. Preserve complete output and exit status. Nonzero exit or conflict records stop this acceptance path; do not run the validator against conflict-marker files and call it integrated.
2. Exact Git blob and mode equality between the hypothetical tree and accepted R31 for all authority-registry package files, eighteen governed sources, and every current retirement evidence file referenced by the registry. Include package manifests, lockfile, schemas, tsconfig, CLI, generator, validator and their complete relative import closure. Record any relevant ancestor package.json, tsconfig or other runtime resolver input outside the package and compare it too.
3. All referenced historical commits/blobs exist in the bare repository. The real R31 source commit remains a commit object, not the merge tree. Required historical objects may be present without being reachable from the bare repository's HEAD; no ref manipulation is needed.
4. The actual materialized file bytes match the selected tree blobs for the same runtime input closure. Git object equality alone does not prove checkout byte equality on Windows. Prefer byte hashing or `git hash-object --no-filters -- <file>` without `-w`, comparing with `git rev-parse <tree>:<path>`. No PowerShell text pipeline should serialize source bytes.
5. The dependency tree, supported Node executable and loader are identical to the tested R31 environment, with recorded paths/version/hash evidence and a quiescent dependency source. Capture relevant environment/Node loader options without dumping credentials. Do not install or update dependencies for this check.

If these inputs are identical, the full R31 suite remains evidence for the same implementation/input set. Running fresh validate and sweep exercises the new Git/root/materialization context. A full-suite repeat is unnecessary solely because unrelated main files differ. If source, runtime dependency, evidence, resolver configuration, filesystem behavior or final R31 Git/root logic differs, explain the delta and select targeted additional checks; broaden to a full suite when that delta actually invalidates earlier coverage. Repository-wide integration remains outside what this package's checks establish.

## Concrete execution procedure

Run the following only after the gates above and after the coordinator grants the serialized host window. Use a fresh dedicated PowerShell process so temporary environment variables cannot leak into other work. Use unique owned absolute paths, and fail if the fixture or index already exists. The placeholders below are required inputs selected from accepted evidence, not literal SHAs or inferred green status.

```powershell
$integrationBare = 'C:/Users/clint/AppData/Local/Temp/fk-remote-verify-20260907.git'
$integrationMain = '476b8df6efe6c9974879957147449f61c34cd9a0'
$integrationR31 = '<exact accepted final R31 commit>'
$integrationRoot = '<unique new owned Temp directory>/tree'
$integrationIndex = '<same unique owned Temp directory>/integration.index'
$integrationNode = 'D:/nvm/v24.19.0/node.exe'
```

First confirm that `$integrationNode` is the tested executable; if the accepted run used another supported executable, use its exact recorded binary instead. Record the Git executable/version too. Ensure the unique parent is beneath the intended Temp directory and that the root itself is a real directory, not a junction. No existing worktree, index or `.git` file is a materialization target.

In the dedicated child environment, explicitly clear inherited `GIT_INDEX_FILE`, `GIT_WORK_TREE`, `GIT_DIR` and Git object-directory overrides before choosing the isolated values. Review any injected Git configuration variables that could change repository resolution. Never print the entire environment. Then obtain the merge result with explicit repository selection:

```powershell
$integrationMergeOutput = @(& git --git-dir=$integrationBare merge-tree --write-tree $integrationMain $integrationR31)
$integrationMergeExit = $LASTEXITCODE
if ($integrationMergeExit -ne 0) { throw 'Merge-tree was not conflict-free; preserve output and stop.' }
$integrationTree = $integrationMergeOutput[0].Trim()
if ($integrationTree -notmatch '^[0-9a-f]{40}$') { throw 'Missing merge tree identity.' }
& git --git-dir=$integrationBare cat-file -t $integrationTree
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve merge tree.' }
```

Require the last output to be `tree`; retain all merge output, not just the first line. `merge-tree --write-tree` may add immutable tree/blob objects to this owned verification object database; it does not update a branch, HEAD or index. This limited object addition is part of the future check, not a read-only claim about that command.

Create the new owned parent/root only after path checks. `$integrationIndex` must be nonexistent; do not create an empty file because Git expects a valid index or no index. Set:

```powershell
$env:GIT_DIR = $integrationBare
$env:GIT_WORK_TREE = $integrationRoot
$env:GIT_INDEX_FILE = $integrationIndex
$env:GIT_OPTIONAL_LOCKS = '0'
& git read-tree $integrationTree
if ($LASTEXITCODE -ne 0) { throw 'Alternate-index population failed.' }
& git -c core.autocrlf=false -c core.eol=lf -c core.attributesFile=NUL checkout-index --all
if ($LASTEXITCODE -ne 0) { throw 'Materialization failed.' }
& git -C $integrationRoot rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Git work-tree root unavailable.' }
```

Require canonical root equality with `$integrationRoot`. Do not use `read-tree -u`, `checkout`, `reset`, `switch`, `merge`, `commit-tree`, `update-ref` or a real index. `GIT_OPTIONAL_LOCKS=0` does not itself prevent mandatory index writes: isolation comes from the new absolute `GIT_INDEX_FILE`.

Before checkout, inspect the selected tree's modes and attributes. If tracked/global filters or symlinks/submodules affect required inputs, stop the generic checkout path and use a reviewed byte-preserving extraction into the same owned fixture. `core.attributesFile=NUL` and disabled autocrlf are not blanket protection against repository attributes or configured smudge filters. Verify actual bytes afterward regardless. A full-tree checkout gives access to required evidence/imports outside the eighteen governed sources; do not silently materialize only those eighteen and claim equivalence.

Snapshot the bare repository's HEAD and refs before/after; existing indexes are not touched. Do not require the alternate index to match HEAD: it deliberately describes the hypothetical tree. A `git status` showing differences against the bare HEAD is not a merge failure or a reason to reset anything.

## Dependencies and CLI commands

Recommended default: copy the accepted, quiescent authority-registry `node_modules` into the owned fixture, preserving/validating its required bytes and resolving any copy-time reparse behavior. This consumes disk but isolates accidental cache writes. No npm install, postinstall or package-manager command is needed.

A junction is a possible optimization only if the dependency target is independently protected against writes, or a reviewed access mechanism provides that protection. A Windows directory junction is **not inherently read-only**. Do not describe `New-Item -ItemType Junction` as read-only, and do not modify ACLs on the shared tested tree merely to use this optimization. If no existing protection exists, use the private copy. Source and retirement-evidence paths themselves must not traverse junctions: the validator explicitly rejects symlink/reparse components.

Resolve the loader inside the fixture dependency copy, and invoke fixture-local modules:

```powershell
$integrationPackage = Join-Path $integrationRoot 'plugins/foreman-line/authority-registry'
$integrationLoader = Join-Path $integrationPackage 'node_modules/tsx/dist/cli.mjs'
$integrationCli = Join-Path $integrationPackage 'src/cli.ts'
$integrationRegistry = Join-Path $integrationPackage 'authority-enforcement-registry.yaml'
Push-Location $integrationPackage
try {
  & $integrationNode $integrationLoader $integrationCli validate $integrationRegistry --repo-root $integrationRoot
  $integrationValidateExit = $LASTEXITCODE
  & $integrationNode $integrationLoader $integrationCli sweep $integrationRegistry --repo-root $integrationRoot
  $integrationSweepExit = $LASTEXITCODE
} finally {
  Pop-Location
}
```

Capture each command's complete stdout/stderr and direct exit separately in owned evidence files; do not overwrite `$LASTEXITCODE` with another command before recording it. Require exit 0 and a parsed result with `valid: true` and no violations for both. Exit 1 means invalid registry; exit 2 means usage/I/O/root configuration failure. Neither counts as integration acceptance. Do not parse a summary count alone as success. Avoid an in-process reused validator when changing roots because Git reads are cached; the two fresh CLI processes above avoid cross-context cache ambiguity.

Optional idempotence is useful if final R31 changes its generator's root/source behavior or materialization context remains uncertain. With all files/dependencies private, hash the complete package tree, run fixture-local `src/generate.ts` using the same explicit loader/Node/Git environment, preserve output/exit, and compare all tracked package outputs to the pre-run hashes and accepted tree. Generator writes schemas as well as both YAML outputs. No outside source/package file may change. If outputs differ, retain the fixture and diagnose; do not copy generated files back or alter the accepted registry to make integration pass. If accepted R31 already proved idempotence and every generator input/context dependency above is equivalent, omission is reasonable and must be recorded.

## Result record and limits

The final evidence should contain exact main/R31/source/tree identities; merge result and exit; package, eighteen-source and external-evidence/import input comparisons; materialized byte/mode checks; Node/loader/dependency identities; Git root result; validate/sweep full outputs and direct exits; optional idempotence outcome or omission rationale; unchanged bare HEAD/refs; and a statement that no original worktree/index was mutated.

A successful result means: the exact conflict-free hypothetical merge tree materialized here preserves the tested R31 runtime inputs, and its registry validates and sweeps successfully against those materialized sources using the pinned Git evidence. It does not mean a branch was merged, GitHub CI ran, branch protection was satisfied, unrelated main behavior was tested, human Gate3 occurred, or a future main head is compatible. Keep the real R31 source commit in registry evidence; there is no need for a synthetic merge commit when the governed source bytes are unchanged.

Remaining execution facts are the accepted final R31 commit and implementation delta, selected current main at check time, availability of every referenced Git object, complete external runtime-input closure, safe dependency-copy source, and actual checkout byte equivalence. These are explicit pre-run checks, not assumed successes. Retain the owned fixture/evidence for review; cleanup, if later requested, must verify exact owned absolute paths and avoid traversing any dependency junction target.
