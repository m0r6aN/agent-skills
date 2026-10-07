# FL-ASSEMBLY Handoff

Date: 2026-09-05. Disposition: **HOLD: exact assembly preserved; combined verification has one out-of-scope test conflict.** This is an uncommitted, unmerged local candidate, not a green assembled candidate, original-goal completion, initiative acceptance, release approval, or permission to publish.

## Smallest Blocker

`plugins/foreman-line/approval/tests/canonical-parity.test.ts:59-62` requires all of `plugins/foreman-line/receipts/` to have an empty diff since the branch fork point. Its assertion at line 61 fails on precisely the authorized FL-R1 changes: validator, chain-invariants test, and README, totaling 144 insertions and 7 deletions. The helper at `approval/tests/helpers.ts:25-33` uses local `git merge-base HEAD origin/main` and `git diff`; both HEAD and local origin/main were `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.

This is a surviving parcel-time directory freeze, not a failing canonical/hash vector or a demonstrated R1 runtime defect. The worked-vector test in the same file passes. Standing Constraints rule 12 explains why such freezes conflict with future authorized changes, but it does not expand this worker's allowlist.

The file is outside the authorized union. No repair, skip, filter, ref mutation, compatibility code, or candidate-byte change was made. The already-running reviewed CI runner completed all checks by its aggregate-results design; after its exit 1, work stopped at diagnosis and evidence capture. Parent reconciliation is required before any repair to the smallest implicated file, `approval/tests/canonical-parity.test.ts`. No repair is self-authorized here.

## Authority And Assembly

- Owned worktree: `D:/Repos/agent-skills-worktrees/fl-assembly-20260905`.
- Branch: `feat/foreman-line-FL-ASSEMBLY-20260905`.
- Base, initial HEAD, and post-test HEAD: `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.
- Initial tracked/untracked status and index were clean. The worktree was supplied as emitter-created; this worker did not create it or load/modify emitted settings.
- Read root AGENTS/CLAUDE, Foreman AGENTS, STANDING-CONSTRAINTS, SPEC-CONVENTION, and all four explicitly assigned active source specs.
- Parent explicitly authorized the union of the four Allowed Files lists, those four specs, this new handoff, own-package offline dependencies, and the inspected full hermetic test runner.
- Four disjoint allowlists contain 20 candidate files. Adding their four specs gives 24 copied files. This handoff is the sole additional repository file, for 25 authorized dirty paths total.
- Route: one assembly worker and deterministic local tools. No fresh model review, council, provider call, external delegation, or review-diversity claim. Native instruction limits are not OS containment.

Source roots, read-only throughout:

| Lane | Root under D:/Repos/agent-skills-worktrees/ | Branch |
| --- | --- | --- |
| R1 | fl-r1-terminal-seal-20260905 | feat/foreman-line-FL-R1-20260905 |
| R2 | fl-r2-audit-loader-20260905 | feat/foreman-line-FL-R2-20260905 |
| R3 | fl-r3-pr-push-20260905 | feat/foreman-line-FL-R3-20260905 |
| R4 | fl-r4-package-ci-20260905 | feat/foreman-line-FL-R4-20260905 |

Each source HEAD equaled the base; each source status exactly matched its own allowlist plus its active spec; each source index was empty. Source HEAD/status/index and all 24 raw file hashes were rechecked immediately before application and after the full runner. Ignored source dependencies/artifacts were not copied, installed into, or edited. No whole-ignored-tree byte attestation is claimed.

The temporary assembly tool parsed each explicit Allowed Files section, checked expected per-lane sizes and disjoint paths, hashed every source and existing destination file, and captured raw SHA-256 for all 937 initially tracked destination files. It generated a full-index binary-capable Git patch from raw files with command-local `core.autocrlf=false`, rewrote only patch path headers to exact allowlisted destinations, compared `git apply --numstat -z` paths against the union, and ran `git apply --check` before actual application. It rechecked inputs immediately before applying and verified exact destination bytes afterward. No staging or Git config writes occurred.

**Line endings:** all 24 sources and all 11 pre-existing destinations use LF only, with zero CRLF/bare-CR lines. All copied destinations have the identical source byte counts, line-ending counts, SHA-256 and raw Git blob IDs. There was no normalization or line-ending difference to waive.

## Reviewed Sources

Review root: `C:/Users/clint/AppData/Local/Temp/opencode/foreman-line-analysis-20260905/`. These existing reports were read and hashed, never copied into the repository or edited.

| Lane / parent disposition | Review path relative to review root | Report SHA-256 |
| --- | --- | --- |
| R1 PASS2, review A | review-a.md | 6aec23599aa678e7b210a409113981816976a6ca42736a98fb130d9bd7301907 |
| R1 PASS2, review B | review-b.md | 608cace571fc48652a280767ff1b99539e13a4f83ebc21dc8b3cb7ba8d8c06cf |
| R2 final alias-fix PASS2, A | review-r2-final-a.md | 070a998c64307218b283ff4df1589e7564cf65edbcfd12f768e22ebf29baa4bd |
| R2 final alias-fix PASS2, B | review-r2-final-b.md | 9807eec6dd7efce155c89c7b43422846190fdebf5562867d0d47dc9855286eee |
| R3 standard PASS1 | review-r3.md | 8e8c52db5a8dc18d9785b8b0b29081aeb03f2e973e9aaba7637002a035737b3a |
| R4 PASS2, A | review-r4-a.md | a2c8e9a2ac1ab369e6e9de259b00caaaf73bfebab805f988750d9cd1a99cbe47 |
| R4 PASS2, B | review-r4-b.md | a3de07ba55f965d6ebe0f164270b2e726ae67ef04cbe5e2983b1eee312076802 |

The original review-b R2 HOLD is historical; the two final R2 reports clear the alias-key finding for the copied blobs. R2 final reviewed implementation/test/manifest/spec blob IDs and R4 review-A implementation/test blob IDs match the source snapshot. R1/R3 implementation/test identities also match their builder handoff fingerprints; their review reports primarily record diffs/status rather than complete raw-hash tables. The parent's explicit candidate selection supplies their review provenance; this worker does not invent missing reviewer digests.

All four source handoffs remain byte-for-byte historical artifacts. Their wording that review is pending, including R2's old HOLD wording, was not rewritten. The later reports and parent dispositions above supersede those review-status statements, not their historical command records. The reviewers deliberately excluded builder handoff content from review; copying those handoffs does not independently certify every historical claim.

## Raw Source Identities

Paths are repository-relative. For each row, the listed SHA-256 was captured before application and equals the source and assembled destination after the full runner. The lane selects the exact source root above. These are complete-file raw-byte hashes, not normalized Git diffs or receipt authentication.

| Lane | Path | Source = Destination SHA-256 |
| --- | --- | --- |
| R1 | plugins/foreman-line/receipts/src/validator.ts | 7b4de277896a8406f1e63af8f4fd0827ec0a46fd194e1a61687425656d1adb42 |
| R1 | plugins/foreman-line/receipts/tests/chain-invariants.test.ts | d5ef88864bf177469aa9335c84404d78314df963a0baae6be72e3c68ec17792e |
| R1 | plugins/foreman-line/receipts/README.md | 9fbe9a2ea732c922c7653706fcd3b9d3339e878a5b6b5c71125f7e5e904d2728 |
| R1 | plugins/foreman-line/docs/kickstarters/FL-R1-handoff.md | 2d61cb1738c9e9083d9e88f6ce777bb879f2e8daa5a65d946c7940098d8b177f |
| R1 | plugins/foreman-line/docs/specs/active/FL-R1-terminal-seal.md | 0cc4538cf5b0e890764dd59553556338dd796db17aa68495c7c5f7be128a5d5e |
| R2 | plugins/foreman-line/integration/src/governing-spec.ts | cf60274d10677a5e4a8e944feeece30d9e913c0d78704d69896f54e0f087694b |
| R2 | plugins/foreman-line/integration/tests/fl-r2-real-loader.test.ts | 32368b9f67ba8e2aea0fed4d3231668ee24319694a6d8b3bb749a3179caf8ea9 |
| R2 | plugins/foreman-line/integration/tests/governing-spec.test.ts | 20bceccb3a55936f8b801e1958eda8b778940db9df14254e06589478c0e6349d |
| R2 | plugins/foreman-line/integration/package.json | 75ab58cec0a1c6f34dfdab8e5941c953dfa9fc3e87edc8ef6f1164ced64fd258 |
| R2 | plugins/foreman-line/integration/package-lock.json | 7beb18cbf78d977128b1cc76b471f69581c177a3e0e0d55e4d131888bf4cdc25 |
| R2 | plugins/foreman-line/docs/kickstarters/FL-R2-handoff.md | e0a274139ebad9c72d439e3be94588f69282a680c6063c32f426797d2ebb6a50 |
| R2 | plugins/foreman-line/docs/specs/active/FL-R2-real-audit-loader.md | 991dbe600b1f2aa791dc44dcdc9115cf47d7287e85c48e4542588d3494358e11 |
| R3 | plugins/foreman-line/integration/src/pr-plan.ts | 858b741167276e9d4b16bb97a71d093d04632aa44ef08d58e71bc8a5ba3cd26f |
| R3 | plugins/foreman-line/integration/src/errors.ts | bbea063ddd9f365ce1951b8bd5519a3063f7424a033b7c52bf2cfda159a44397 |
| R3 | plugins/foreman-line/integration/tests/fl-r3-push-failure.test.ts | 81e1e46f61309292d3e079a5469c36f0cf690182e6e0990bc3908c245cbfa0dd |
| R3 | plugins/foreman-line/integration/tests/conformance.test.ts | cdacc6ee62843fb671f7bcea2783bc4eee968d2fd185cd46a26dd4ba66c618ae |
| R3 | plugins/foreman-line/docs/kickstarters/FL-R3-handoff.md | 43ec7575b89d2bf64312e6cddd015fa2f68f147129648eb2d9de2346c56b9663 |
| R3 | plugins/foreman-line/docs/specs/active/FL-R3-push-failure-stop.md | 66681f44844c6895fa93443a6845efe07d5dc85d981990442480aeca64d51f2a |
| R4 | .github/workflows/foreman-line-ci.yml | 8eb431b058453368bfeee726dac37b989d85d37435b072b2a01568e3fb69fc7b |
| R4 | scripts/foreman-line-ci.mjs | c35238364b81ed1c409fa1ca8d9a934bc8f7d1aca807ca6975bfcda89d1fbcf9 |
| R4 | scripts/foreman-line-ci.test.mjs | 7b2345379981db7a5896dc346be26be951a6c13bee50e1bfeda1607af517dd64 |
| R4 | plugins/foreman-line/skill-injection/tests/schema-validation.test.ts | 1e6b5958ed65f22504bd99634a60da7cdb2a573a98a518203e8f3fa61daa1deb |
| R4 | plugins/foreman-line/docs/kickstarters/FL-R4-handoff.md | be700d0684793ac49f25b1fe3b62c1bd3910a0f7bfb9fa59f05d66211b17e682 |
| R4 | plugins/foreman-line/docs/specs/active/FL-R4-package-ci.md | cc2191116020286d50c3a1973a0a0d61ad090c54990e4d920e6269e8560659e3 |

## Pre-Execution Inspection

Inspected all 14 immediate package manifests, verified lockfile-v3 root dependency/devDependency agreement, and checked every locked artifact has npm-registry HTTPS resolution plus SHA-512 integrity and no link dependency. This is local lock inspection, not an online dependency audit. Exact scripts in every package are `tsx --test tests/*.test.ts`, `tsc --noEmit`, and `biome check .`. The CI package list equals the independent immediate-directory inventory. No standalone `generate` or `report` script ran.

| Inspected suite path under plugins/foreman-line/ | Files / effect boundary |
| --- | --- |
| approval/tests/*.test.ts | 15 test files; temporary approval roots; local read-only CLI/Git queries; receipt fixture reads |
| contracts/tests/*.test.ts | 4 test files; in-memory schema/canonical fixtures and read-only serialized parity |
| dispatch/tests/*.test.ts | 8 test files; injected MCP/query/compression/shadow/dispatch seams and temporary roots |
| integration/tests/*.test.ts | 18 test files including R2/R3; synthetic receipt/spec roots; injected transports/push/PR seams; local read-only Git queries |
| permission-profiles/tests/*.test.ts | 9 test files; read-only validation plus temporary Git repositories/worktrees and settings fixtures |
| projection/tests/*.test.ts | 14 test files; temporary artifact roots and read-only local Git drift queries |
| receipts/tests/*.test.ts | 8 test files; in-memory receipt chains, read-only fixture CLI and schema parity |
| registration/tests/*.test.ts | 21 test files; fake Jira/MCP clients; scratch Git commits and pushes to temporary local bare origins |
| routing-policy/tests/*.test.ts | 6 test files; in-memory validators, read-only local CLI/fixtures and parity |
| schema-scaffold/tests/*.test.ts | 3 test files; generator and scaffold fixtures under mkdtemp roots only |
| shaping/tests/*.test.ts | 13 test files; temporary artifact roots and read-only selfcheck/local Git queries |
| skill-injection/tests/*.test.ts | 5 test files; read-only policy/fixture validation and local CLI |
| spec-linter/tests/*.test.ts | 6 test files; read-only corpus/CLI validation and temporary malformed-file fixtures |
| verification/tests/*.test.ts | 12 test files; temporary receipt roots, injected transport/launch seams, scratch Git worktrees, local read-only baseline queries |

Effect inspection used test-path inventories and searches for subprocess/network/write/generator entry points, then the relevant helpers, CLI boundaries and injected call sites. In particular, `schema-scaffold/tests/generate.test.ts:20-25,34-49` supplies temporary output roots; the implementation writes only its explicit outDir. The six package generator entrypoints are main-guarded and are only imported for serialization during parity tests. No standalone source generation occurred.

Existing tests are hermetic with respect to live services, not effect-free or OS-contained. Registration's `tests/helpers.ts:119-127` sets `remote.origin.pushurl` to its fresh local bare fixture despite a GitHub-shaped fetch URL. Scratch repo commits/configuration/worktree cleanup are test effects, not staging/commits/config edits in the assembly repository. No cleanup of unrelated scratch artifacts was attempted.

## Commands And Results

Runtime: explicit `D:/nvm/v24.19.0/node.exe`, verified `v24.19.0`; matching npm CLI reports `11.17.0`. All test commands used the owned worktree as cwd. The exact child commands were:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --test scripts/foreman-line-ci.test.mjs
& 'D:/nvm/v24.19.0/node.exe' scripts/foreman-line-ci.mjs 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' --offline
```

The external capture wrapper set process-local PATH with Node24 first, TEMP/TMP to `C:/Users/clint/AppData/Local/Temp/opencode`, `TSX_DISABLE_CACHE=1`, `npm_config_offline=true`, and `npm_config_logs_max=0`; it removed `GITHUB_STEP_SUMMARY` only from the child environment to prevent accidental external summary writes. stdout and stderr were captured in full to the same log descriptor; numeric runner exits/signals/errors were saved separately. No package-test filtering or byte substitutions were used.

Helper ran first, 2026-09-05 13:03:27.859Z to 13:03:28.140Z: exit 0. Actual runner ran once, 13:03:35.458Z to 13:07:26.874Z: exit 1, no signal/spawn error. No retry or online fallback occurred.

The actual reviewed runner performed 14 `npm ci --ignore-scripts --no-audit --no-fund --offline` operations, each inside the corresponding owned package directory, before 42 `npm run <test|typecheck|lint> --ignore-scripts` checks. All installs succeeded offline. The only repository lock difference is the exact reviewed R2 YAML addition; no lock was regenerated or changed during installation/testing. Source node_modules were neither reused nor copied.

| Package | Tests | Pass | Fail | Skip | Install | Typecheck | Lint |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| approval | 65 | 64 | 1 | 0 | pass | pass | pass |
| contracts | 72 | 72 | 0 | 0 | pass | pass | pass |
| dispatch | 118 | 118 | 0 | 0 | pass | pass | pass |
| integration | 249 | 249 | 0 | 0 | pass | pass | pass |
| permission-profiles | 70 | 70 | 0 | 0 | pass | pass | pass |
| projection | 58 | 58 | 0 | 0 | pass | pass | pass |
| receipts | 80 | 80 | 0 | 0 | pass | pass | pass |
| registration | 70 | 70 | 0 | 0 | pass | pass | pass |
| routing-policy | 59 | 59 | 0 | 0 | pass | pass | pass |
| schema-scaffold | 15 | 15 | 0 | 0 | pass | pass | pass |
| shaping | 39 | 39 | 0 | 0 | pass | pass | pass |
| skill-injection | 41 | 41 | 0 | 0 | pass | pass | pass |
| spec-linter | 80 | 80 | 0 | 0 | pass | pass | pass |
| verification | 153 | 153 | 0 | 0 | pass | pass | pass |

Counts were parsed from observed final runner summaries, not forced to historical expectations. Package total: **1169 tests, 1168 pass, 1 fail**. Helper: **16 tests, 16 pass**. Combined: **1185 tests, 1184 pass, 1 fail**. Every group has zero skipped, cancelled and todo tests. All 42 package checks ran: **41 pass, 1 fail** (approval test command); all 14 typechecks and all 14 lints passed. The runner correctly retained nonzero status after later successes. Integration's historical workflow-presence skip did not occur in this assembled tree; its marker test is not proof of hosted CI execution.

## Full Evidence

All paths below are under `C:/Users/clint/AppData/Local/Temp/opencode/` unless otherwise specified. Temporary tooling/artifacts are outside the repository mutation union.

| Artifact | Purpose / SHA-256 when pinned |
| --- | --- |
| fl-assembly-20260905-helper.log | Complete helper stdout/stderr; 1348 bytes; c873fc2b21d7c25488113013d74e2a905612178dc2d702597cdc627655dffcf0 |
| fl-assembly-20260905-helper.result.json | Exact command/cwd/times, exit 0, no signal/error |
| fl-assembly-20260905-ci.log | Complete actual runner stdout/stderr; 119298 bytes; 83cbc6806bd725892708ebdc9e8ea8b279841406d85810898a0dc2cb85289edb |
| fl-assembly-20260905-ci.result.json | Exact command/cwd/times, exit 1, no signal/error |
| fl-assembly-20260905-evidence.json | Dynamically parsed all14/helper totals, all42 outcomes, review paths/hashes |
| fl-assembly-20260905-manifest.json | All24 raw source/destination-before SHA-256/blob/byte/newline records, source statuses, and all937 tracked baseline hashes |
| fl-assembly-20260905.patch | Exact prechecked/applied 24-file patch; 8242e07b813996eafc3a320a7650d23905dc5e8ab6db65fa75027268330db84f |
| fl-assembly-20260905.mjs | Deterministic prepare/apply/verify/lock-inspection tool; repository writes only through prechecked allowlisted git apply |
| fl-assembly-20260905-run.mjs | Full-output and exit-code capture wrapper; invokes helper then actual CLI in separate authorized calls |
| fl-assembly-20260905-evidence.mjs | Log-count/review-hash evidence extraction, no candidate writes |

The shell tool also retained its full CI output at `C:/Users/clint/.local/share/opencode/tool-output/tool_071ae5a25001osb4NEFGBjiEPR`. The direct CI log's failure is at lines 107-132; all-package outcome table at 1636-1652.

## Integrity And Limits

Post-run verification succeeded: all 24 source/destination raw fingerprints match; all 926 baseline tracked paths outside the 11 replaced tracked files are byte-unchanged; source HEAD/status/index are unchanged; assembly HEAD is unchanged and index empty. `git diff --check` passes. Final status consists only of the 24 copied union paths plus this handoff. The only changed lock is integration/package-lock.json, still raw Git blob `3ca1d862658736c4658ba01127a2032c3e23a6c7`, with only root yaml 2.9.0 metadata and its locked package entry added. All other initial tracked locks, settings/policies, goals and original main were not edited.

This handoff was created manually with apply_patch after failure capture. Its self-hash is intentionally excluded from its own contents. A final verify command checks the same source/destination/baseline/scope invariants with this handoff present.

- Hosted GitHub CI, hosted Windows behavior, docs-only named-check appearance, Actions expression execution and required-check/branch-rule enforcement remain unrun/unverified. No remote workflow was enabled or dispatched.
- Existing MCP SDK lock dependencies were installed solely for local tests/types. No live SDK transport, gateway, Jira/GitHub/provider adapter, DocSpine service, Docker/MCP server, or external operation was exercised.
- Installed plugin/host and authenticated installed-session validation remain unrun. No host installation or SDK/DocSpine functionality was added by assembly.
- Human D4, merge/release/go-live and all existing goal/initiative gates remain unchanged and uncleared. Structural sealing is not authenticated closure; report-only audit metadata remains non-enforcing.
- No assembly/source-repository staging, commits, pushes, PRs, merges, settings edits, source-worktree edits, or existing-goal/main edits. Existing hermetic scratch-repository Git effects are distinguished above.

**Parent handoff:** preserve this exact local candidate on HOLD. Resolve the single out-of-scope approval directory-freeze conflict under a new explicit allowance before claiming a green assembled candidate. This worker has completed assembly and authorized verification/evidence capture, not successful combined acceptance or the original initiative.

## FL-ASSEMBLY-A1 Amendment Result

Date: 2026-09-05. **Current disposition: assembled candidate locally green; independent final review required before local acceptance.** This appended section supersedes the earlier unresolved-conflict/HOLD disposition only. The preceding 20,528 bytes, their original failed-run evidence, all source handoffs, and all earlier review reports remain unchanged as historical records. No whole-goal/initiative, hosted-CI, release, or merge acceptance is implied.

Parent supplied and explicitly authorized `plugins/foreman-line/docs/specs/active/FL-ASSEMBLY-approval-vector.md`. Its FL-ASSEMBLY-A1 ruling adds only `plugins/foreman-line/approval/tests/canonical-parity.test.ts` and permits appending this existing handoff. The parent-owned amendment spec was read and hashed, not edited. No helper/source-lane/fixture or algorithm edit was authorized or performed.

### Exact Repair

- Preserved the existing frozen canonical-vector equality test and no-PCC-internals test byte-for-byte. Preserved EXPECTED_HASH and the fixture path. A deterministic before/after substring comparison also checks both test bodies are intact.
- Replaced only the receipts-directory diff freeze with one semantic-mutation negative-control test, retaining the same number of tests.
- The replacement reads the fixture as raw bytes and parses it in memory, omits the stored hash from the canonical input, and creates a shallow copy whose timestamp is `2026-07-15T00:00:01Z`, one second after the original fixture value.
- It explicitly asserts the timestamps differ, the mutated input's computed hash differs from the frozen EXPECTED_HASH, the original input still computes EXPECTED_HASH, the stored hash equals EXPECTED_HASH, and a second raw fixture read equals the initial bytes.
- Removed only the newly unused `diffStatSinceMergeBase` import and `repoRoot` variable; updated the file-header description to match the replacement. `approval/tests/helpers.ts` is unchanged and retains its other callers. No moving-fork or implementation-tree byte pin remains in this amended test file.
- All manual repository edits used apply_patch. No formatter writes, dependency-lock changes, algorithm/fixture changes, new tests elsewhere, skip conditions, compatibility branches, or unrelated cleanup were introduced.

### Verification Sequence

All executions used exact `D:/nvm/v24.19.0/node.exe`. The existing inspected 14-package suite paths and effect boundaries from the first assembly remain unchanged except for the new read-only/in-memory approval test. Existing assembly dependencies sufficed for focused checks; the actual CI runner recreated only its own 14 package dependency trees from exact locks, offline, with install scripts disabled. There was no online fallback.

| Phase | Observed tests / result | Actual exit |
| --- | --- | ---: |
| Focused RED before editing canonical-parity.test.ts | 3 tests: 2 pass, 1 fail; only the known receipts-directory freeze fails | 1 |
| Corrected full approval suite | 65 tests: 65 pass, zero fail/skip/cancel/todo | 0 |
| Runner helper suite | 16 tests: 16 pass, zero fail/skip/cancel/todo | 0 |
| In-memory constant-hash negative control | 3 tests: 2 pass, 1 expected failure at the new hash-inequality assertion | 1 |
| Actual all14 offline CI runner after the negative control process ended | All14 installs and all42 checks pass; 1169 package tests pass, zero fail/skip/cancel/todo | 0 |

The in-memory negative control replaced only the loaded approval `sha256Hex` module with a function always returning EXPECTED_HASH, using a process-local Node load hook that asserted exactly one target load. The on-disk algorithm and test files were never modified for this probe. Both original tests still passed; the new test failed specifically at `canonical-parity.test.ts:64`, `assert.notEqual(sha256Hex(canonicalize(mutated)), EXPECTED_HASH)`. This establishes that the replacement detects a hash function ignoring its input rather than merely testing its name or the timestamp setup. The subsequent full runner used the real on-disk implementation without hooks.

Exact ordinary child commands, with cwd `plugins/foreman-line/approval` for the first two and the assembly root for the last two:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --import tsx --test tests/canonical-parity.test.ts
& 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' run test --ignore-scripts
& 'D:/nvm/v24.19.0/node.exe' --test scripts/foreman-line-ci.test.mjs
& 'D:/nvm/v24.19.0/node.exe' scripts/foreman-line-ci.mjs 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' --offline
```

The A1 capture wrapper retained full stdout/stderr and recorded actual status, signal, error, cwd, executable, argv and UTC times for every execution. Child environment controls remained process-local: Node24 first in PATH, TEMP/TMP at the approved opencode temporary directory, `TSX_DISABLE_CACHE=1`, `npm_config_offline=true`, `npm_config_logs_max=0`, and no inherited `GITHUB_STEP_SUMMARY`. The full mutation-hook command is retained verbatim in its result JSON and the wrapper. No harness filter was applied to a passing approval/helper/all14 run.

Final actual runner timing: `2026-09-05T13:22:57.755Z` through `2026-09-05T13:27:03.591Z`, exit 0, no signal or spawn error. It completed all 14 offline `ci --ignore-scripts --no-audit --no-fund --offline` installations before all 42 `run <test|typecheck|lint> --ignore-scripts` checks.

| Package | Final tests / pass | Fail / skip | Install | Typecheck | Lint |
| --- | --- | --- | --- | --- | --- |
| approval | 65 / 65 | 0 / 0 | pass | pass | pass |
| contracts | 72 / 72 | 0 / 0 | pass | pass | pass |
| dispatch | 118 / 118 | 0 / 0 | pass | pass | pass |
| integration | 249 / 249 | 0 / 0 | pass | pass | pass |
| permission-profiles | 70 / 70 | 0 / 0 | pass | pass | pass |
| projection | 58 / 58 | 0 / 0 | pass | pass | pass |
| receipts | 80 / 80 | 0 / 0 | pass | pass | pass |
| registration | 70 / 70 | 0 / 0 | pass | pass | pass |
| routing-policy | 59 / 59 | 0 / 0 | pass | pass | pass |
| schema-scaffold | 15 / 15 | 0 / 0 | pass | pass | pass |
| shaping | 39 / 39 | 0 / 0 | pass | pass | pass |
| skill-injection | 41 / 41 | 0 / 0 | pass | pass | pass |
| spec-linter | 80 / 80 | 0 / 0 | pass | pass | pass |
| verification | 153 / 153 | 0 / 0 | pass | pass | pass |

Final package total: **1169/1169 pass**. Helper: **16/16 pass**. Combined: **1185/1185 pass**, zero failures, skips, cancellations or todo tests. Exactly **42/42 package checks pass**. These totals were parsed from observed final logs, not forced to a desired count; the preliminary approval rerun and expected RED controls are not double-counted into this final total.

### A1 Evidence And Identities

Evidence directory: `C:/Users/clint/AppData/Local/Temp/opencode/`. Every listed log has a matching `<stem>.result.json` preserving the exact command and numeric exit; logs and result JSONs were created exclusively, without overwriting earlier evidence.

| Full stdout/stderr log | Bytes | SHA-256 |
| --- | ---: | --- |
| fl-assembly-a1-20260905-red.log | 1876 | ff5b094cbacf7c8fe7435c579b23f93bf5a2518a8731aa00ce2cafe98ce95f1e |
| fl-assembly-a1-20260905-approval.log | 6578 | 27b95b0782b3e2ecab20b21ba8e031f2edfb52c8398daf877c2213b83319a50d |
| fl-assembly-a1-20260905-helper.log | 1351 | c77fde69876a9475ff2304384f9ef6c1fb844e01afbfacdfc92ab13e014aebd3 |
| fl-assembly-a1-20260905-mutation-red.log | 1528 | e44fdb1af3cc95b8f3eb446aea13d8b2b5eae3bb107670106b9ee0c869b483ca |
| fl-assembly-a1-20260905-ci.log | 117847 | dcf3647d8df59c3025729471681e90659a88c6efa4af48d65d465410d0db05d7 |

Additional external artifacts: `fl-assembly-a1-20260905.mjs` contains the deterministic scope/hash/capture/probe/evidence tooling; `fl-assembly-a1-20260905-before.json` preserves the before test/handoff contents plus amendment/fixture hashes and status; `fl-assembly-a1-20260905-evidence.json` contains all run receipts, dynamically parsed counts/outcomes and file identities. The shell's full runner output is also retained at `C:/Users/clint/.local/share/opencode/tool-output/tool_071c04ebf001v7qLlQW7NKqMJY`.

| Repository-relative file | Current SHA-256 | Raw Git blob |
| --- | --- | --- |
| plugins/foreman-line/approval/tests/canonical-parity.test.ts | 9727f0accc19f8ec3fabf87b3d56c1a700aa3344c65a61f0a6bb6fd0aeef7dfe | b07aae48d37ca1e940f3415dba7080d75a5e71ab |
| plugins/foreman-line/docs/specs/active/FL-ASSEMBLY-approval-vector.md | f3cd21427425f87734f9323ea02821fd85e9d013816af307612e36868c72d3f0 | 53fae78c337709937b55d2da7e977eecc86e9275 |
| plugins/foreman-line/receipts/tests/fixtures/hash-vector-genesis.json | 814bc917e7add3bceb7cd881a08ffb16f082a819ff0725667020e49afae6ae8a | b8a50b89b022c95542029429f913d7ec1497f7de |
| plugins/foreman-line/approval/tests/helpers.ts | ff3ed6b7a1f1014e276de0e56a1311deddb1f33b73d2469121933936c572ac91 | 5825b0c51cafcea5856857ae7f22d58ff834a038 |

Approval test before-edit SHA-256: `409a9771f07cbf3d157f713a2095ce21649b4a465a81ee9493a0957a78cd14b8`. The fixture/helper hashes above match the original tracked baseline, not merely a post-edit snapshot. Parent amendment bytes are unchanged since reading. The canonical digest EXPECTED_HASH remains `06d29ab66ebffd099f4e9031f7c38ffb778a996f6e18726ab8eea30a35f3ee23`; the full-file fixture SHA-256 is intentionally a different identity.

All prior24 union files, including all four original source handoffs and active source specs, still match their source SHA-256 table above before and after the A1 runner. This assembly handoff is outside that prior24 set and is append-only under A1. Source HEAD/status/index controls remain identical. All 925 original tracked files outside the 11 original replaced files and the newly amended approval test remain byte-identical to the first assembly baseline, including helpers, algorithms, fixtures and all other locks. The only lock difference from HEAD remains the exact reviewed R2 YAML addition, with its source/destination hash unchanged. LF line endings are retained.

Final expected status is 27 paths: original24 union, this appended handoff, the parent-owned A1 spec, and the approval test. HEAD remains `5ce6ddc7f996d764e506b6b421779fbf3ece689a` on `feat/foreman-line-FL-ASSEMBLY-20260905`; index empty. The final A1 verify checks those scope/hash conditions, preserved original test bodies, append-only handoff prefix and `git diff --check`.

### Review Handoff

**Locally verified candidate, awaiting independent final review.** Earlier R1/R2/R3/R4 review references remain as recorded, but do not independently clear this new amendment or the final combined candidate. No fresh independent review was performed by this assembly worker and no acceptance is self-certified.

Hosted CI/action execution, actual remote docs-only required checks, installed-host/authenticated-session acceptance, live SDK/adapter/DocSpine behavior and human D4 remain unrun/uncleared exactly as previously distinguished. Existing hermetic scratch-repository Git effects and temporary-root generator tests are not live service/goal operations. No source-lane or existing-goal/main edits, installation into a host, staging, commits, pushes, PRs, merges, branch-rule changes, or publication occurred. Parent should dispatch independent final review of this exact amended candidate before local acceptance; no original-goal or whole-initiative completion is claimed.

## PR #16 Hosted CI Follow-Up

Date: 2026-09-05. Commit `9e88094c52dd00407f23f7711f2c12fefcd14b1b` published the reviewed 27-path assembly to PR #16. Before publication, a fresh exact local runner attempt encountered a one-off `tsx`/esbuild service stop in `integration/tests/gate-assembly.test.ts`; the unchanged file then passed 4/4, the unchanged integration package passed 249/249, and the unchanged exact 14-package runner completed with exit 0. The transient failure is retained rather than suppressed.

The first hosted `foreman-line-ci` pull-request run, `34002419756`, exposed a separate deterministic Windows checkout defect: every Biome package check saw CRLF working-tree bytes, and byte-identity tests failed, while installs and typechecks passed. The source assembly was not reformatted. A narrow follow-up changes only the already allowed workflow to set global `core.autocrlf=false` before checkout, preserving committed LF blob bytes. The superseding workflow SHA-256 is `92413ddcd6129059c0a3cd0f70993753002f25207ba091c05e9937c112bde93e`; the earlier R4 workflow hash remains historical source-candidate provenance.

The separate `Test Plugin Installation` workflow fails on pre-existing skill-format violations and PR #16 has no `skills/` diff. That debt is neither fixed nor waived here. Hosted Foreman CI must rerun successfully after this follow-up before the PR is described as hosted-green. Installed-host/default-runtime evidence, D4 branch protection and all human/legacy gates remain separate.
