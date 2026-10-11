# IR-B01-CI packaging evidence

## Authority / Step 0 BEFORE package edits

Owner Clinton Morgan, current-session instructions verbatim:

> Authorize IR-B01-CI exactly as proposed.

> Add lint to the strict script-name assertion in tests/schema-parity.test.ts; all other authorized scope and limits remain unchanged.

Exact proposal: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114156443 ; Step 0 omission/correction: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114963139 . The first instruction grants the twelve-output, dependency-setup, 60-minute/two-fresh-validation-pass scope. The second disposes ONLY the script-name assertion gap: add `lint` to its strict expected list. All other test/source edits remain formatting-only. No repeat approval of disposed IR-A01/Pro/native-auth/data/accounting/reasoning choices.

Named constructor/coordinator: Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`, temporary mechanical packaging exception, not independently admitted builder/reviewer. Branch `bootstrap/ir-b01-ci-01a12b4f`, worktree `D:/Repos/agent-skills-worktrees/ir-b01-ci-01a12b4f`, exact parent `dd85fd3bcf302d1c45743957c1d357652f68a6ab`. Original prototype branch/worktree and two evidence records remain immutable.

Step 0 restatement: update package.json/README, format only four src/two test files (except the single newly approved script-list assertion), add package-lock.json and standard source/test-only biome.json, add this record and ir-b01-ci-packaging-handoff.md. These are the twelve exact approved tracked outputs; no wildcard. Pinned Ajv 8.20.0 / @types/node 26.1.1 / TypeScript 7.0.2 plus @biomejs/biome 2.5.14 and lockfile-resolved dependencies; reuse installed/cache first, only required npm-registry retrieval; lifecycle scripts/audit/fund disabled. Temporary package-local node_modules is permitted, not tracked output. No test additions/deletions/skips or other behavior change. Schema JSON, tsconfig, shared packages/CI/guards/workflows, original evidence and all frozen/runtime/auth sources stay unchanged. No native/provider/SDK/auth/model/delegate/probe execution, billing/settings edits or broader install. Any further real scope/dependency/contract gap stops.

Step 0 disposition: the one flagged script-list conflict is owner-disposed; no further flag identified before changes. Proceed only inside this manifest. Construction starts conservatively `2026-10-11T23:17:00Z`; deadline `2026-10-12T00:17:00Z`. One foreground pass, at most two fresh local validation/rework passes. Existing original IR-B01 passes are not reset/relabelled. Scope preservation/token equivalence are administrative integrity checks, not independent acceptance.

## Actual construction / validation — STOP on scoped lint-style gap

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

### Exact new flag — no unauthorized fix

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

This preserves calls, arguments, registration behavior, assertions and test coverage, but it is a syntax/style transformation beyond the granted formatter-only changes and the ONE separately disposed script-name assertion exception. Therefore STOP under the existing real-gap rule; no such fix, waiver/config weakening, test suppression/addition/deletion or extra source mutation was performed. This is not a requested admission-policy/test-behavior change or a reason to reopen IR-A01/account/auth decisions.

Other retained diagnostics, NOT hidden/fixed: noNonNullAssertion warning in tests/admission.test.ts; useShorthandFunctionType informational suggestion in src/admission.ts; inherited Biome schema URL 2.5.3 versus CLI 2.5.14 informational mismatch. None is treated as waived passing lint; the actual lint exit is 1. No `biome migrate`/rule mutation/source refactor was run.

One of the two new validation passes is consumed. Pass 2 has NOT run. The original `2026-10-12T00:17:00Z` deadline is NOT silently reset or paused. Further construction requires owner disposition of the exact callback-block exception and must remain within the surviving time/pass/session envelope; if it expires, return for an explicit bounded time disposition rather than inherit a fresh clock.

## Preservation / publication boundary

Original dd85fd3b prototype branch/worktree, its two records, committed JSON schema and tsconfig are preserved. All current edits/new artifacts are within the twelve authorized paths; package-local node_modules is untracked validation tooling only. No policy/schema/other test semantic change, shared source/CI/guard/workflow change, native/provider/SDK/auth execution, credential/config inspection/change, billing mutation, model/delegate/probe spend or live integration occurred. Interactive costs are uninspected, not asserted zero.

The partial local checkpoint is NOT package-CI ready: install/test/types pass, lint fails. No remote push/DRAFT PR/merge occurred because the authorization conditions publication on package compatibility. Existing main failures remain separately routed; they are not repaired or waived here. No independent acceptance, runtime authority/permit/receipt or green exact-head repository verification is claimed. The enclosing immutable partial checkpoint is returned after local commit; a record cannot contain its own final commit hash.
