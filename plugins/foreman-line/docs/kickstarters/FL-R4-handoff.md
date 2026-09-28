# FL-R4 Builder Handoff

## Step 0

- Date: 2026-09-05.
- Worktree: `D:/Repos/agent-skills-worktrees/fl-r4-package-ci-20260905`.
- Branch: `feat/foreman-line-FL-R4-20260905`.
- Base and initial HEAD: `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.
- Contract: `plugins/foreman-line/docs/specs/active/FL-R4-package-ci.md`.
- Read root and Foreman AGENTS, STANDING-CONSTRAINTS.md and SPEC-CONVENTION.md.
- Parent pre-dispatch authorization permits this exact spec and conditional Step 0. Exact base, branch, worktree and scope match; no contract flags identified. Proceeded under that authorization, not builder self-approval.
- Initial status: only the parent-supplied active spec was untracked. It is not builder-owned and will not be changed.

### Exact Allowed Files

- `.github/workflows/foreman-line-ci.yml`
- `scripts/foreman-line-ci.mjs`
- `scripts/foreman-line-ci.test.mjs`
- `plugins/foreman-line/skill-injection/tests/schema-validation.test.ts`
- `plugins/foreman-line/docs/kickstarters/FL-R4-handoff.md`

### Acceptance Criteria (Contract Restatement)

AC-1: Candidate CI installs and checks exactly the 14 existing packages; test/typecheck/lint failures propagate to nonzero even if later packages succeed.

AC-2: CI handles docs-only PRs without missing named jobs; no external authority, secret, merge or elevated permissions are introduced.

AC-3: Skill-injection test asserts the current contracts/* reviewer entry [code-review, ai-council], retains all other baseline expectations, and no policy YAML changes. Do not keep a misleading exact illustrative-plan claim.

AC-4: Any helper uses Node stdlib, a fixed package allowlist and testable injected process boundary. Tests prove complete invocation coverage, stopping before checks after failed install, aggregate check failures, and no live subprocess use in runner tests. Do not build a generic orchestration framework.

AC-5: Local helper tests and all14 package checks pass on supported runtime after offline dependency setup, or exact failures are recorded. Schema-scaffold generator tests are authorized because inspected implementation writes only test-created temporary roots; do not run source generators as standalone steps.

AC-6: Changed paths stay within allowlist. Handoff distinguishes local candidate evidence from unrun remote CI, still-missing SDK/DocSpine/installed-session requirements and existing human D4 gate.

## Execution Route

Single assigned builder; deterministic local tools for inspection and validation. No additional model/provider invocation or delegation. Implement runner tests first, then the minimal fixed-list runner/workflow and stale assertion repair. Run offline dependency setup only inside this worktree, with lifecycle scripts disabled and no network fallback. Use explicit `D:/nvm/v24.19.0/node.exe` and its npm CLI; process-local child PATH only.

## Evidence

Implementation and local validation finished. This is a builder evidence handoff, not acceptance. Independent review follows; no AC is self-accepted.

### Candidate Changes

- Windows-only workflow, explicit Node `24.19.0`, `contents: read`, checkout `persist-credentials: false`. Full checkout history supports existing tests that inspect local `origin/main`; no additional fetch commands are added.
- Unfiltered push/PR triggers retain named `test` and `integration-report` jobs for documentation-only PRs. The report uses `always()` and fails for every non-success test outcome. Neither job has `continue-on-error`. The package step still runs if the helper-test step fails; the earlier failure remains a job failure.
- Stdlib-only fixed-list runner invokes explicit Node plus npm's JS CLI, not a Windows command shell. All 14 lockfile installs precede all 42 checks. An install failure skips every check; otherwise all test/typecheck/lint outcomes are aggregated. Per-package statuses go to logs and, on GitHub, the step summary. Summary-write failure also fails the CLI.
- The runner has a mandatory injected spawn boundary; tests call the real runner with fake process outcomes. Tests cover complete invocation order/options, offline mode without fallback, each check's failure propagation, multiple failures, thrown errors, spawn errors, signals, null statuses and missing results. Reports use only fixed names and normalized statuses, not injected error text.
- The existing skill test still uses full deep equality with every prior baseline expectation. Only its description/comment and the missing `contracts/*: [code-review, ai-council]` expectation changed. Policy YAML did not change.

### Runtime and Commands

All commands below used this assigned worktree as cwd unless the package cwd is explicitly stated. Runtime probes returned Node `v24.19.0` and npm `11.17.0`.

```powershell
& "D:/nvm/v24.19.0/node.exe" --version
& "D:/nvm/v24.19.0/node.exe" "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" --version
& "D:/nvm/v24.19.0/node.exe" --test scripts/foreman-line-ci.test.mjs
```

The initial helper test run intentionally failed before the helper existed: `ERR_MODULE_NOT_FOUND`, 1 failed test file, 0 passing. After implementation, 14/14 tests passed. Two additional null-status cases then brought the final helper count to 16/16, verified with no child-process or filesystem-write permission granted:

```powershell
& "D:/nvm/v24.19.0/node.exe" --permission --allow-fs-read="D:/Repos/agent-skills-worktrees/fl-r4-package-ci-20260905" --test-isolation=none --test scripts/foreman-line-ci.test.mjs
```

This process-local Node permission check supplements the injected-spawn tests; it is not native agent permission-settings enforcement or OS containment.

All-package baseline command:

```powershell
$env:PATH = "D:/nvm/v24.19.0;$env:PATH"
& "D:/nvm/v24.19.0/node.exe" scripts/foreman-line-ci.mjs "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" --offline
```

The first attempt hit the tool's 120000 ms timeout and returned `Unknown: ChildProcess.kill` without usable package output or an exit status. It is incomplete evidence, not a passing run. A subsequent process inventory showed no identifiable remaining process for this runner; unrelated processes were left alone. The same command was retried with a 900000 ms tool timeout, still offline. That completed baseline installed 14/14 packages and ran 42/42 checks: 13 package test commands passed and skill-injection failed, while 14 typechecks and 14 lints passed. Its test totals were 1091 tests, 1090 pass, 1 fail, 0 skipped. The failure was the exact stale deep-equality expectation, missing the existing `contracts/*` reviewer entry. Later packages succeeded and the final summary retained `skill-injection | pass | fail | pass | pass`. The baseline command did not separately print its numeric exit code; nonzero propagation is covered by the runner tests.

After the repair, these three commands ran in `plugins/foreman-line/skill-injection`, with the same process-local PATH. Results: 41/41 tests, typecheck and lint passed (lint: 14 files, no fixes).

```powershell
& "D:/nvm/v24.19.0/node.exe" "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" run test --ignore-scripts
& "D:/nvm/v24.19.0/node.exe" "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" run typecheck --ignore-scripts
& "D:/nvm/v24.19.0/node.exe" "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" run lint --ignore-scripts
```

Final all-package command, after the repair:

```powershell
$env:PATH = "D:/nvm/v24.19.0;$env:PATH"
& "D:/nvm/v24.19.0/node.exe" scripts/foreman-line-ci.mjs "D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js" --offline
$code = $LASTEXITCODE
"FOREMAN_CI_EXIT_CODE=$code"
exit $code
```

Result: `FOREMAN_CI_EXIT_CODE=0`. Exactly 56 npm invocations: 14 successful installs first, then 42 successful checks. Each install was `node.exe <npm-cli.js> ci --ignore-scripts --no-audit --no-fund --offline`, with cwd `plugins/foreman-line/<package>`. Each check was `node.exe <npm-cli.js> run <test|typecheck|lint> --ignore-scripts` in the same package cwd. No online install fallback, dependency changes or standalone generator commands were used. The CLI's fixed root kept dependency installs inside this worktree.

### Final Counts

| Package | npm ci installed dependencies | Tests / Pass | Fail / Skip | Typecheck | Lint |
| --- | ---: | ---: | --- | --- | --- |
| approval | 14 | 65 / 65 | 0 / 0 | pass | pass |
| contracts | 14 | 72 / 72 | 0 / 0 | pass | pass |
| dispatch | 103 | 118 / 118 | 0 / 0 | pass | pass |
| integration | 9 | 189 / 189 | 0 / 0 | pass | pass |
| permission-profiles | 15 | 70 / 70 | 0 / 0 | pass | pass |
| projection | 14 | 58 / 58 | 0 / 0 | pass | pass |
| receipts | 14 | 62 / 62 | 0 / 0 | pass | pass |
| registration | 102 | 70 / 70 | 0 / 0 | pass | pass |
| routing-policy | 15 | 59 / 59 | 0 / 0 | pass | pass |
| schema-scaffold | 14 | 15 / 15 | 0 / 0 | pass | pass |
| shaping | 14 | 39 / 39 | 0 / 0 | pass | pass |
| skill-injection | 15 | 41 / 41 | 0 / 0 | pass | pass |
| spec-linter | 15 | 80 / 80 | 0 / 0 | pass | pass |
| verification | 15 | 153 / 153 | 0 / 0 | pass | pass |

Final package total: **1091 tests, 1091 pass, 0 fail, 0 skipped, 0 cancelled, 0 todo**. Helper: **16 tests, 16 pass, 0 fail/skip/cancel/todo**. Combined final evidence: **1107 passing tests**. These are final counts, not cumulative counts across baseline/retries.

### Additional Local Checks

- Parsed the candidate YAML using the existing worktree's `yaml` dependency, via Node `--input-type=module -e`. Assertions passed for exactly unfiltered push/PR triggers, read-only contents permissions, exactly the two named Windows jobs, nonpersisted checkout credentials, full checkout history, Node pin, `needs: test`, `always()` report and explicit report failure. This is structural evidence, not GitHub Actions execution or actionlint validation.
- Compared the runner's outcomes from an injected successful spawn against the actual package.json-bearing immediate directories using Node stdlib. Exactly 14 package directories matched the independent inventory. No live subprocess was used in this inventory assertion.
- `git diff --check` passed. `git diff --exit-code HEAD -- . ":(exclude)plugins/foreman-line/skill-injection/tests/schema-validation.test.ts"` passed: no other tracked changes, including policies, manifests, lockfiles or other tests. New candidate files were checked separately via `git status --short --untracked-files=all` and are within the five-file allowlist.
- Final HEAD remains `5ce6ddc7f996d764e506b6b421779fbf3ece689a`. Expected dirty paths: the five builder-owned allowed paths plus the untouched parent-supplied untracked active spec. No files were staged.

### Logs and SHA-256

Tool-retained logs are local evidence, not GitHub artifacts:

- Baseline log: `C:/Users/clint/.local/share/opencode/tool-output/tool_071896bd00018MM2Ksh66Mh0o0`; SHA-256 `C1870574AA24C3A9BA72A959B8DFB6C5A0F3DC0F8878B1FAC1548C99283C5485`.
- Final green log: `C:/Users/clint/.local/share/opencode/tool-output/tool_0718f7c9f001yKXBzbM0imw4fh`; SHA-256 `0CC5B15A0274BEF680D63A7584AE81E545BB549E4319B3FB9F6D59FE08FEBF60`.

File fingerprints from `Get-FileHash -Algorithm SHA256 -LiteralPath <path>` (raw on-disk bytes):

| Path | SHA-256 |
| --- | --- |
| `.github/workflows/foreman-line-ci.yml` | `8EB431B058453368BFEEE726DAC37B989D85D37435B072B2A01568E3FB69FC7B` |
| `scripts/foreman-line-ci.mjs` | `C35238364B81ED1C409FA1CA8D9A934BC8F7D1ACA807CA6975BFCDA89D1FBCF9` |
| `scripts/foreman-line-ci.test.mjs` | `7B2345379981DB7A5896DC346BE26BE951A6C13BEE50E1BFEDA1607AF517DD64` |
| `plugins/foreman-line/skill-injection/tests/schema-validation.test.ts` | `1E6B5958ED65F22504BD99634A60DA7CDB2A573A98A518203E8F3FA61DAA1DEB` |
| `plugins/foreman-line/docs/specs/active/FL-R4-package-ci.md` (parent-owned) | `CC2191116020286D50C3A1973A0A0D61AD090C54990E4D920E6269E8560659E3` |
| `plugins/foreman-line/skill-injection/skill-injection.yaml` (unchanged policy) | `EE42AC1B40E8DCED8D9A116B8D3E94DCB2261133DDB2B42AC3F3E7B864871BFF` |

This handoff's own final hash is reported separately to avoid a self-referential hash.

## Boundaries and Remaining Gaps

No hosted remote CI run, run dispatch, commit/push to the assigned repository, git configuration change to that repository or global configuration, PR/settings mutation, policy/manifest change, standalone source-generator step or hosted-plugin installation was performed.

Existing full-suite fixture effects must not be confused with the hermetic new runner tests: package tests create temporary roots, and existing Git fixtures initialize/configure/commit in scratch repositories and push to local temporary bare repositories. For example, `registration/tests/helpers.ts` creates `foreman-reg-*` and `foreman-reg-origin-*` with `mkdtempSync`, configures the scratch repo and sets its push URL to that local bare root. Those effects are present in the test logs; this is not a claim that every existing package test is effect-free. Schema-scaffold generation ran only through its authorized temporary-root tests. No unrelated scratch artifacts were cleaned up.

- GitHub workflow/action execution, hosted Windows image behavior, actual docs-only required-check appearance and remote report propagation remain unrun/unverified. The YAML is only a locally validated candidate. Native branch/required-check settings were not changed or enforced.
- Existing lockfile MCP SDK dependencies were installed for these package checks; that is not proof of real SDK transport, live adapter, gateway or end-to-end service behavior. No SDK integration was added by this parcel, and the remaining live SDK/adapter requirements are still open.
- DocSpine integration/validation remains open; none was added or exercised.
- Installed-host/plugin and authenticated installed-session requirements remain open; no host installation or session acceptance was performed.
- The existing human D4 gate is unchanged and remains human-owned. No go-live, release, merge or goal-transfer acceptance is claimed.
- Native agent permission settings are not enforced here; no OS containment claim is made. The helper-test Node permission probe does not alter this limitation.
- Independent review and coordinator disposition remain pending. The reviewer should test whether failures can be hidden, a package omitted, credentials retained or docs-only checks skipped, and confirm the exact stale repair does not weaken policy.
