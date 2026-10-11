# IR-B01-CI packaging evidence

## Authority / Step 0 BEFORE package edits

Owner Clinton Morgan, current-session instructions verbatim:

> Authorize IR-B01-CI exactly as proposed.

> Add lint to the strict script-name assertion in tests/schema-parity.test.ts; all other authorized scope and limits remain unchanged.

Latest scoped disposition, verbatim:

> Approve only the behavior-preserving block-body change for that forEach
> callback in tests/admission.test.ts; all other IR-B01-CI scope and limits stay unchanged.

Exact proposal: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114156443 ; Step 0 omission/correction: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114963139 ; subsequent scoped lint flag: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6115079591 . The first instruction grants the twelve-output, dependency-setup, 60-minute/two-fresh-validation-pass scope. The second disposes ONLY the script-name assertion gap: add `lint` to its strict expected list. The latest instruction disposes ONLY the forEach block-body gap surfaced by pass 1. All remaining test/source edits stay formatting/import-organization only. No repeat approval of disposed IR-A01/Pro/native-auth/data/accounting/reasoning choices.

Named constructor/coordinator: Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`, temporary mechanical packaging exception, not independently admitted builder/reviewer. Branch `bootstrap/ir-b01-ci-01a12b4f`, worktree `D:/Repos/agent-skills-worktrees/ir-b01-ci-01a12b4f`, exact parent `dd85fd3bcf302d1c45743957c1d357652f68a6ab`. Original prototype branch/worktree and two evidence records remain immutable.

Step 0 restatement: update package.json/README, format only four src/two test files (except the single newly approved script-list assertion), add package-lock.json and standard source/test-only biome.json, add this record and ir-b01-ci-packaging-handoff.md. These are the twelve exact approved tracked outputs; no wildcard. Pinned Ajv 8.20.0 / @types/node 26.1.1 / TypeScript 7.0.2 plus @biomejs/biome 2.5.14 and lockfile-resolved dependencies; reuse installed/cache first, only required npm-registry retrieval; lifecycle scripts/audit/fund disabled. Temporary package-local node_modules is permitted, not tracked output. No test additions/deletions/skips or other behavior change. Schema JSON, tsconfig, shared packages/CI/guards/workflows, original evidence and all frozen/runtime/auth sources stay unchanged. No native/provider/SDK/auth/model/delegate/probe execution, billing/settings edits or broader install. Any further real scope/dependency/contract gap stops.

Step 0 disposition: the one flagged script-list conflict is owner-disposed; no further flag identified before changes. Proceed only inside this manifest. Construction starts conservatively `2026-10-11T23:17:00Z`; deadline `2026-10-12T00:17:00Z`. One foreground pass, at most two fresh local validation/rework passes. Existing original IR-B01 passes are not reset/relabelled. Scope preservation/mechanical-transform equivalence are administrative integrity checks, not independent acceptance.

## Actual construction / validation — completed after exact owner dispositions

Package.json adds exactly `lint: biome check .` and pinned dev tool @biomejs/biome 2.5.14. Biome configuration is byte-identical to the existing contracts package configuration (source/tests only, all existing rules retained). The six allowed TypeScript files were processed by the existing pinned Biome 2.5.14 with `check --write --linter-enabled=false`: formatting/import organization ONLY; linter fixes were deliberately disabled during construction, not in validation/config. All six later matched the same pinned mechanical transform of the immutable baseline, with only the approved script-list assertion substituted before transformation.

Cache-first lockfile generation succeeded entirely in offline mode at `2026-10-11T23:20:20Z` using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --offline`; the authorized online fallback was NOT taken for lockfile generation. New package-lock.json uses lockfile v3, exact approved direct versions, registry.npmjs.org resolved tarballs/integrity and their transitive/optional platform dependencies. No general tool installation occurred. Named nonexistent package-local user/global npm-config selectors prevented loading owner user/global npm configs; no such selector file was created. Preflight confirmed no project .npmrc in the new worktree/package ancestors; no auth/config contents were inspected or edited.

### Fresh validation pass 1 — actual result

Executed `2026-10-11T23:21:32Z`–`23:21:43Z`, with Node 24.19.0 on PATH, NODE_PATH unset, package-local dependencies and npm lifecycle/audit/fund disabled:

| Check | Actual outcome |
|---|---|
| npm ci --ignore-scripts --no-audit --no-fund --prefer-offline | Exit 0; 11 packages added in 6 seconds. Required registry retrieval was permitted; this command did not independently report which tarballs came from cache/network, so no zero-network assertion. |
| npm run test --ignore-scripts | Exit 0, including committed schema parity. Console reduction retained npm script banners but not the reporter's total-count lines; do not invent a newly observed total/skips count for this pass. |
| npm run typecheck --ignore-scripts | Exit 0, strict no-emit check using package-local TypeScript 7.0.2 / @types/node 26.1.1. |
| npm run lint --ignore-scripts | Exit 1; ONE error, ONE warning, TWO informational diagnostics; no fixes applied. See exact blocker below. |
| Six-file baseline mechanical-transform equivalence | PASS for src/types.ts, src/schemas.ts, src/admission.ts, src/index.ts, tests/admission.test.ts and tests/schema-parity.test.ts; original baseline first receives ONLY the owner-approved `lint` script-list assertion update, then pinned Biome formatting/import organization. Current bytes equal those outputs. No other source/test logic change. |
| Frozen bytes | PASS: schema JSON, tsconfig.json, both original IR-B01 evidence records unchanged from dd85fd3b. Standard biome.json byte-identical to shared contracts config. |

Actual command family:

```sh
export PATH="/d/nvm/v24.19.0:$PATH"
unset NODE_PATH
export npm_config_userconfig="$PWD/.ir-b01-ci-no-user-config"
export npm_config_globalconfig="$PWD/.ir-b01-ci-no-global-config"
export npm_config_registry=https://registry.npmjs.org/
node D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js ci \
  --ignore-scripts --no-audit --no-fund --prefer-offline --fetch-retries=0 --fetch-timeout=30000
node D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js run test --ignore-scripts
node D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js run typecheck --ignore-scripts
node D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js run lint --ignore-scripts
```

### Historical pass-1 flag — stopped before the owner-authorized fix

`tests/admission.test.ts:369`, standard `lint/suspicious/useIterableCallbackReturn` error:

```ts
value.forEach((item, index) => registerClosedControls(item, [...path, String(index)]))
```

The linter requires a callback block body (the recursive function already returns void; forEach discards callback returns). The narrow candidate fix is:

```ts
value.forEach((item, index) => {
  registerClosedControls(item, [...path, String(index)])
})
```

This preserves calls, arguments, registration behavior, assertions and test coverage, but it was a syntax/style transformation beyond the then-granted formatter-only changes and script-name exception. At partial checkpoint `01ce20257c0214cc09cc3d228ad5612119ac27c6`, construction STOPPED under the real-gap rule; no unauthorized fix/waiver/test suppression was applied. The owner subsequently authorized ONLY this block-body change verbatim above. It was applied as one exact replacement, with no other source/test rework. No admission-policy/test-behavior change or reopening of IR-A01/account/auth decisions.

Other retained diagnostics, NOT hidden/fixed: noNonNullAssertion warning in tests/admission.test.ts; useShorthandFunctionType informational suggestion in src/admission.ts; inherited Biome schema URL 2.5.3 versus CLI 2.5.14 informational mismatch. None is treated as waived passing lint; the actual lint exit is 1. No `biome migrate`/rule mutation/source refactor was run.

### Fresh validation pass 2 — FINAL, actual result

The exact callback disposition arrived within the surviving original envelope; no clock/pass reset. Pass 2 ran `2026-10-11T23:27:24Z`–`23:27:33Z` using the SAME package-local npm command family above, with no external NODE_PATH/compiler dependency and full lint rules enabled:

| Check | Final actual outcome |
|---|---|
| npm ci | Exit 0; 11 packages installed in 5 seconds, lifecycle/audit/fund disabled. |
| npm run test | Exit 0; **680 tests, 680 pass, zero fail/cancelled/skipped/todo**; schema byte parity included. This pass retained the actual reporter totals. |
| npm run typecheck | Exit 0; strict no-emit. |
| npm run lint | Exit 0; **zero errors**, one retained noNonNullAssertion warning and two retained informational diagnostics (type-alias suggestion and shared-config schema/CLI version mismatch). No rule weakening/waiver/suppression/migration. |
| Six-file approved-transform equivalence | PASS. Original dd85fd3b source first receives exactly the TWO owner-approved substitutions (script-list assertion and callback block body), then pinned Biome formatting/import organization. Every current src/test file is byte-identical to that output; no other source/test change. |
| Frozen bytes / standard rules | PASS again for schema JSON, tsconfig, both original evidence records and shared-standard Biome configuration. |

Both permitted fresh local validation passes are now consumed. No third run. Source/package construction and final validation ended `2026-10-11T23:27:33Z`, 10 minutes 33 seconds from the conservative original start. Evidence/commit/draft publication follow within the same original deadline; no more source edits or local validation under this pass. The original deadline `2026-10-12T00:17:00Z` was never reset/paused. Final package subtree `be1f2651fbbfddf776c481630a571b37411a6e33`; lockfile blob `cbf4c89c6fe9ce89d79facc4aedef12891bd6456`. These are Git source-byte identities, NOT authority/installation authenticity.

## Preservation / publication boundary

Original dd85fd3b prototype branch/worktree, its two records, committed JSON schema and tsconfig are preserved. All current edits/new artifacts are within the twelve authorized paths; package-local node_modules is untracked validation tooling only. No policy/schema/other test semantic change, shared source/CI/guard/workflow change, native/provider/SDK/auth execution, credential/config inspection/change, billing mutation, model/delegate/probe spend or live integration occurred. Interactive costs are uninspected, not asserted zero.

The historical partial checkpoint had failed lint and was not published. The final package's actual install/test/typecheck/lint path now passes, so the existing Git delegation permits DRAFT evaluation publication only. No runtime/worker integration, independent acceptance or merge follows. Publication preflight rechecked PRIVATE destination, main `92a1a030add720e58326ae130febc1476fb74cb8`, and repository main CI attempt 2 at that head: plugin validation passed, package workflow 38176694788 completed FAILURE (already-routed mutation-scope-guard/ops-console findings at least; not claimed to be an exhaustive failure inventory). No shared fix/waiver or extra rerun is performed here. Current main shares the unchanged prototype/CI/shared-schema input ancestor f5ec6; original frozen construction base is not rebased or rewritten.

The final enclosing immutable head, DRAFT PR and live publication/check readback are returned in-session and linked on #179 after committing. These records cannot contain their own commit hash. Pre-publication scoped whitespace/diff/privacy checks and exact twelve-path delta against dd85fd3b are administrative preservation checks, not another test pass or independent review. Original main/index/unrelated worktrees stay untouched. An external exact-head CI result is still required; local green checks never substitute for it. No native/public proof, ordinary internal review, trusted permit/receipt, roster acceptance or production registration is granted. Stop at the returned draft/evidence; no automatic native phase or further construction.
