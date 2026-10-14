# Windows CI failure dossier (run 38499976493, main after #229, coordinator 2026-10-14)

Runner: Windows (D:\a\agent-skills\agent-skills). Shard 0 failing ops-console tests (list):
✖ AC7: gh unavailable degrades visibly; local facts stay; no remote-dependent code is asserted (1037.888ms)
✖ AC7: the D19 audit itself passes (exit 0) with mutation-scope-guard on disk and ratified (16505.1386ms)
✖ AC9 negative control: every git/gh subprocess is read-only, and the repository is unchanged (1282.6553ms)
✖ end to end through the real runner: PR list, billing annotation, gate item; nothing is written (1138.9446ms)
✖ entry path refuses a held port typed (error: [port-in-use], exit 2) (22.3868ms)
✖ failing tests:
✖ FCA-P9: presentCommand validates with the same guards and audits nothing (17.1321ms)
✖ FCA-P9: pr-merge accepts a root declared in fleet state and only those (8.519ms)
✖ FCA-P9: pr-merge is present-only: renders the exact command, audits one `presented`, spawns nothing (10.1445ms)
✖ gatherRepoFacts reads default ref, branches, merge state, upstream tracking, specs, worktrees, logs (1806.1764ms)
✖ GET /api/reconcile: shape, counts by code, echoed (not derived) state, source ages (1053.2398ms)
✖ gh failing degrades visibly, keeps gate items, never errors (1015.9729ms)
✖ K selected actions -> exactly one session with K panes (pi argv snapshot) (4.6212ms)
✖ merge items carry `cd "<root>" && gh pr merge <N>` with no strategy flag; a root with unsafe characters yields no command (26.5721ms)
✖ review #3: git probes never take index locks or run repo-local fsmonitor hooks, and cannot hang (128.6429ms)
✖ review #8/#9: retention ignores symlinks and malformed names, ranks by id, spares recently-written logs; files are owner-only (13.4082ms)
✖ review: the response carries an assessment; a full PR list withholds absence findings through the API (1042.3613ms)

## Detail (CI log excerpt)
```
✖ failing tests:

test at tests\decisions-read-only.test.ts:161:1
✖ end to end through the real runner: PR list, billing annotation, gate item; nothing is written (1138.9446ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  
  0 !== 1
  
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\decisions-read-only.test.ts:169:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.start (node:internal/test_runner/test:1242:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:387:17) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 0,
    expected: 1,
    operator: 'strictEqual',
    diff: 'simple'
  }

test at tests\decisions-read-only.test.ts:219:1
✖ gh failing degrades visibly, keeps gate items, never errors (1015.9729ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /not logged in/. Input:
  
  'gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable. Example:'
  
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\decisions-read-only.test.ts:228:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:387:3) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'gh: To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable. Example:',
    expected: /not logged in/,
    operator: 'match',
    diff: 'simple'
  }

test at tests\decisions.test.ts:478:1
✖ merge items carry `cd "<root>" && gh pr merge <N>` with no strategy flag; a root with unsafe characters yields no command (26.5721ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + undefined
  - 'pr-merge'
  
      at <anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\decisions.test.ts:502:12)
      at withTempRepo (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\support\materialize.ts:388:12)
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\decisions.test.ts:499:3)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:960:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'pr-merge',
    operator: 'strictEqual',
    diff: 'simple'
  }

test at tests\invoke.test.ts:299:1
✖ FCA-P9: pr-merge is present-only: renders the exact command, audits one `presented`, spawns nothing (10.1445ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + 'refused'
  - 'presented'
  
      at <anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:308:12)
      at withTempRepo (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\support\materialize.ts:388:12)
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:300:3)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:960:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'refused',
    expected: 'presented',
    operator: 'strictEqual',
    diff: 'simple'
  }

test at tests\invoke.test.ts:347:1
✖ FCA-P9: pr-merge accepts a root declared in fleet state and only those (8.519ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  
  + 'refused'
  - 'presented'
  
      at <anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:355:12)
      at withTempRepo (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\support\materialize.ts:388:12)
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:348:3)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:960:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'refused',
    expected: 'presented',
    operator: 'strictEqual',
    diff: 'simple'
  }

test at tests\invoke.test.ts:366:1
✖ FCA-P9: presentCommand validates with the same guards and audits nothing (17.1321ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
  
    assert.ok('text' in ok)
  
      at <anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:369:12)
      at withTempRepo (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\support\materialize.ts:388:12)
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\invoke.test.ts:367:3)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:960:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }

test at tests\ledger.test.ts:809:1
✖ review #3: git probes never take index locks or run repo-local fsmonitor hooks, and cannot hang (128.6429ms)
  AssertionError [ERR_ASSERTION]: GIT_OPTIONAL_LOCKS=0 is set
      at TestContext.<anonymous> (D:\a\agent-skills\agent-skills\plugins\foreman-line\ops-console\tests\ledger.test.ts:832:12)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1382:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:960:18)
      at Test.postRun (node:internal/test_runner/test:1522:19)
      at Test.run (node:internal/test_runner/test:1447:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:960:7) {
```

Other failing packages (not ops-console; report only): pi-package/test (npm error Missing script: test; no test/typecheck/lint scripts), mutation-scope-guard/test (AC7: the D19 audit itself passes (exit 0) ... 16.5 s).
Early exit hides later checks: after ops-console/test fails, ops-console typecheck and lint are SKIPPED on CI, so they may also fail on Windows.
