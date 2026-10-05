# FL-R3 Builder Handoff

## Status and authority

- Candidate ready for independent review within the five Allowed Files after parent ruling FL-R3-A1. Full integration suite: 197 pass, 0 fail, 1 unchanged baseline skip; typecheck and lint pass.
- Worktree: `D:/Repos/agent-skills-worktrees/fl-r3-pr-push-20260905`.
- Branch: `feat/foreman-line-FL-R3-20260905`.
- Base and unchanged HEAD: `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.
- Parent accepted Step 0 and authorized implementation and local verification on 2026-09-05.
- Parent subsequently appended FL-R3-A1 to the active spec, authorizing only the error byte-pin replacement and removal of its unused helper. This is a local candidate ruling, not a committed historical-contract amendment.
- Native host worker is instruction-limited, NOT OS-contained. The host task cannot select a per-worker model or load emitted Claude settings. No alternate model/provider or delegated worker was invoked.
- No commits, staging, push, PR creation, publication, network fallback, real external adapter invocation, secrets access, settings/spec edits, source dependency changes, or other-worktree edits.
- The active FL-R3 spec was already untracked at entry and remains untouched by this builder. Its FL-R3-A1 amendment is parent-authored, not builder output.

## Changes

- `plugins/foreman-line/integration/src/errors.ts`: add only the approved `PUSH_FAILED` union member; constructor and other codes unchanged.
- `plugins/foreman-line/integration/src/pr-plan.ts`: wrap only the injected/default push invocation and reject any returned `code !== 0` before calling the PR-create seam.
- `plugins/foreman-line/integration/tests/fl-r3-push-failure.test.ts`: nine hermetic regression cases. Every effectful invocation explicitly supplies BOTH seams, including failure cases.
- `plugins/foreman-line/integration/tests/conformance.test.ts`: replace only the SCAF-P4 AC7 error byte-pin with a stable five-code identity/name/code/message test, update its comment, and remove `showOriginMain` after confirming it had no other callers. No unrelated assertion changed.
- `plugins/foreman-line/docs/kickstarters/FL-R3-handoff.md`: this handoff.

The result remains `{ plan, gitPushResult, ghPrCreateResult }` after a successful push. Push executes once before PR creation, which executes once. Returned PR-create failures retain their original object, code, stdout and stderr; no fake skipped success, retry, compatibility branch or downstream exception redesign was added.

## Safe diagnostics

Push failure messages are fixed ASCII literals, independent of command output or thrown values:

```text
git push failed; PR creation was not attempted
git push threw; PR creation was not attempted
```

These are 46 and 45 characters respectively. There is no interpolation, raw stdout/stderr, thrown-value coercion, attached external cause, or new logging. Fixtures use more than 100,000 characters with CR/LF, annotation delimiters and a terminal escape, plus an object whose `toString` throws. Assertions pin the fixed messages and absent cause. Original downstream returned failure data is deliberately preserved, not sanitized or logged by this change.

## Verification results

| Phase | Result |
| --- | --- |
| Step 0 inventory, no execution | 16 test files, 189 static test declarations; planner file has 4 tests |
| Initial baseline attempt before all transitive dependencies were installed | 69 pass, 10 test-file load failures, 0 skips; missing `ajv` from `shaping/src/emit.ts` |
| Initial baseline typecheck | 19 diagnostics: missing `ajv`/`yaml` in required sibling packages and consequent implicit-any errors |
| Baseline after offline dependency setup, before any source/test edits | 189 tests: 188 pass, 0 fail, 1 existing skip; typecheck pass; lint pass, 34 files |
| New regression file against original implementation | 9 tests: 2 pass, 7 fail, 0 skips; all 3 nonzero cases reached PR creation once, all 4 thrown cases lacked typed wrapping |
| First repaired planner run, new plus existing tests | 13 tests: 13 pass, 0 fail, 0 skips |
| First repaired typecheck | Pass |
| First repaired lint | One formatter error in the new test; corrected using apply_patch |
| First repaired full suite | 198 tests: 196 pass, 1 fail, 1 existing skip; failure is the error byte-pin below |
| Mutation: remove ONLY the nonzero guard, keep thrown wrapper | 9 tests: 6 pass, 3 fail, 0 skips; all 3 failures observe PR-create call count 1 instead of 0 |
| Pre-A1 full suite after restoring guard and formatting | 198 tests: 196 pass, 1 fail, 1 existing skip; all 9 new and all 4 existing planner tests pass |
| Pre-A1 typecheck and lint | Pass; lint checked 35 files |
| Final full suite after FL-R3-A1 replacement | 198 tests: 197 pass, 0 fail, 1 unchanged baseline skip; stable error contract, all 9 new and all 4 existing planner tests pass |
| Final typecheck after FL-R3-A1 | Pass |
| Final lint after FL-R3-A1 | Pass, 35 files; no fixes applied by lint |
| Diff whitespace check | `git diff --check` passes |

The existing skip is `AC19: .github/workflows/foreman-line-ci.yml is byte-unchanged from origin/main`, conditional on that workflow path existing. No skip or test filter was added to hide the byte-pin failure. The byte-pin passed at baseline; its prior failure was a conflict with the authorized new error code, not a claimed pre-existing failing test. FL-R3-A1 replaces it one-for-one with an always-running stable contract test; total test count remains 198 across 17 files.

## Exact commands

All commands use PowerShell. Set the tool's working directory explicitly; no global Node configuration was changed.

Runtime check, from the assigned worktree root:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --version
```

Result: `v24.19.0`.

The following install command was run separately with the working directory set to each required package under this worktree's `plugins/foreman-line/`. Each package's manifest and lockfile were inspected first; parent existence was verified with `Test-Path -LiteralPath '<absolute package directory>'`. For the last five packages that check was chained to installation with `&&`.

```powershell
& 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' ci --offline --ignore-scripts --no-audit --no-fund
```

| Required package | Packages added |
| --- | --- |
| integration | 9 |
| registration | 102 |
| receipts | 14 |
| approval | 14 |
| projection | 14 |
| contracts | 14 |
| schema-scaffold | 14 |
| shaping | 14 |
| permission-profiles | 15 |
| spec-linter | 15 |

Integration's public index imports sibling source transitively. These installations supplied runtime Ajv/MCP SDK imports and typecheck-only schema dependencies; no sibling source or manifest was edited. Registration's first offline install hit the 120-second tool timeout; the identical command succeeded with a 300-second timeout. No network fallback or install-script execution was used.

No additional installation was needed or performed for FL-R3-A1.

All remaining verification commands use working directory `D:/Repos/agent-skills-worktrees/fl-r3-pr-push-20260905/plugins/foreman-line/integration`:

```powershell
# Full suite: initial dependency-blocked baseline, resolved baseline, first repaired run, restored pre-A1 run, final FL-R3-A1 run.
$env:PATH = 'D:/nvm/v24.19.0;' + $env:PATH; $env:TEMP = 'C:/Users/clint/AppData/Local/Temp/opencode'; $env:TMP = $env:TEMP; & 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' test

# Typecheck: dependency-blocked baseline, resolved baseline, first repaired run, restored pre-A1 run, final FL-R3-A1 run.
$env:PATH = 'D:/nvm/v24.19.0;' + $env:PATH; & 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' run typecheck

# Lint: baseline, first repaired run (formatting failure), formatted pre-A1 run, final FL-R3-A1 run.
$env:PATH = 'D:/nvm/v24.19.0;' + $env:PATH; & 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' run lint

# Original-defect red and, later, guard-only mutation red.
& 'D:/nvm/v24.19.0/node.exe' node_modules/tsx/dist/cli.mjs --test tests/fl-r3-push-failure.test.ts

# First repaired planner verification.
& 'D:/nvm/v24.19.0/node.exe' node_modules/tsx/dist/cli.mjs --test tests/fl-r3-push-failure.test.ts tests/pr-plan.test.ts
```

PATH, TEMP and TMP assignments are process-local. Existing suite filesystem fixtures use the pre-approved temporary directory; new FL-R3 cases perform no filesystem or external I/O. Existing conformance tests inspect local Git objects only; no fetch occurs.

## AC mapping

- AC-1: `code !== 0` guard; separate cases for 1, 128 and -1 check `IntegrationError`, `PUSH_FAILED`, one push call and zero PR-create calls. All three detect guard removal.
- AC-2: push-only catch; Error, string, null and unstringifiable-object cases check the same typed failure and zero PR-create calls. Original source fails all four.
- AC-3: separate returned PR-create codes 0 and 1 check exact call sequence, arguments, complete result shape and reference identity of both returned operation results. Existing four planner tests remain green.
- AC-4: both seams explicitly injected in all new planner invocations; originals also supply both on effectful calls. Original-source red and guard-removal red are recorded above. Mutation was restored before final verification.
- AC-5: after FL-R3-A1, full integration suite exits successfully with 197 pass, 0 fail and 1 unchanged baseline skip; typecheck and lint pass. Only the five Allowed Files were manually changed; installation artifacts are ignored node_modules within authorized own-worktree packages.

## Prior blocker and resolution

Prior blocking file: `plugins/foreman-line/integration/tests/conformance.test.ts`, original lines 254-264, test `SCAF-P4 AC7: src/errors.ts is byte-unchanged from origin/main`. Its assertion at original line 259 compared all source bytes against a moving local `origin/main`; the diff was precisely the added `PUSH_FAILED` member. Standing Constraints rule 12 says parcel-time byte freezes belong in the deterministic pass, not the shipped suite.

Original amendment request, retained as prior-failure evidence:

> Add `plugins/foreman-line/integration/tests/conformance.test.ts` to FL-R3 Allowed Files. Authorize replacing only the SCAF-P4 AC7 errors.ts byte-unchanged test with a stable IntegrationError contract test covering class identity, name, message preservation and the existing four error codes plus PUSH_FAILED. Remove its now-unused showOriginMain helper and update the associated comment as needed. The replacement must not compare source bytes or depend on origin/main; all other conformance tests remain unchanged.

Parent resolved this request with FL-R3-A1 in the active spec. The replacement test constructs an `IntegrationError` for each of `PRIOR_CORRELATION_MISSING`, `RECEIPT_WRITE_FAILED`, `PLAN_INVALID`, `POSTURE_INVALID` and `PUSH_FAILED`, using literal types so removed codes also fail typecheck. For every code it checks `instanceof Error`, `instanceof api.IntegrationError`, the exact name, the exact code, and preservation of a message including whitespace and a newline. It has no source-byte comparison, origin/main dependency or skip condition.

Only its unused `showOriginMain` helper and associated comment were retired. Other conformance assertions, including the export-set check and workflow check, remain unchanged. The old blocker is resolved; independent review is still required. No builder spec edit or committed amendment is claimed.

## Diff and hashes

Tracked candidate diff: `errors.ts` +1 line; `pr-plan.ts` +10/-1 lines; `conformance.test.ts` +17/-22 lines. The new regression test and this handoff are untracked until the parent chooses to stage them. Default `git diff` therefore does not include those two additions.

Exact root-directory inspection commands:

```powershell
git status --short --branch
git rev-parse HEAD --show-toplevel
git diff --check
git diff --cached --stat
git diff -- plugins/foreman-line/integration/src/errors.ts plugins/foreman-line/integration/src/pr-plan.ts
git diff -- plugins/foreman-line/integration/tests/conformance.test.ts
git hash-object --no-filters -- plugins/foreman-line/integration/src/errors.ts plugins/foreman-line/integration/src/pr-plan.ts plugins/foreman-line/integration/tests/fl-r3-push-failure.test.ts plugins/foreman-line/integration/tests/conformance.test.ts
```

Final implementation/test Git blob hashes (raw bytes, not SHA-256 or commits):

| File | Git blob hash |
| --- | --- |
| integration/src/errors.ts | `19150f285df0ae9c4cddb156b749abb2a292b23c` |
| integration/src/pr-plan.ts | `893d9e6a5d275fd82401e99b3810779f5223c1c2` |
| integration/tests/fl-r3-push-failure.test.ts | `f2bddfe05dfd34be48062134dfbeb50e0e3e9df9` |
| integration/tests/conformance.test.ts | `9c2f7801d87209367e4da478a78e6d7e8ec45f80` |

## Limitations

- Builder-run deterministic checks are evidence for the parent, not independent review or release approval.
- No live push, PR creation, GitHub rules query, Docker/MCP process, or credentials probe was performed. Real adapters and their platform-specific exception shapes remain deliberately unexercised.
- Existing typed seam signatures and real-adapter result conversion were preserved; this bounded repair does not redesign raw-response normalization or downstream thrown-error semantics.
- The existing workflow skip and the unrelated export-set test's local-origin dependence remain unchanged; this candidate does not claim those checks were independently validated against live GitHub state.
