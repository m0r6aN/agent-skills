# IR-B01-CI packaging handoff — scoped lint blocker / STOP

**State:** exact packaging scope and ONE script-name assertion exception authorized; partial package setup completed; install/test/types pass, lint FAILS; one fresh validation pass consumed; publication/native integration held.

## Authority and immutable starting point

Owner Clinton Morgan:

> Authorize IR-B01-CI exactly as proposed.

> Add lint to the strict script-name assertion in tests/schema-parity.test.ts; all other authorized scope and limits remain unchanged.

Proposal: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114156443 ; original Step 0 flag: https://github.com/m0r6aN/agent-skills/issues/179#issuecomment-6114963139 . Named temporary mechanical constructor/coordinator is Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`, not independent builder/reviewer. Branch `bootstrap/ir-b01-ci-01a12b4f`, worktree `D:/Repos/agent-skills-worktrees/ir-b01-ci-01a12b4f`; exact original prototype parent `dd85fd3bcf302d1c45743957c1d357652f68a6ab`. Original prototype and its historical evidence are unchanged.

The enclosing partial checkpoint commit is returned in the session after local commit; bind any next disposition to that exact returned immutable head, not a moving branch. No remote publication/PR/merge occurred.

## Exact tracked output scope exercised

1. UPDATE `plugins/foreman-line/internal-review-launch/package.json`: only lint command and pinned Biome dev dependency.
2. UPDATE `plugins/foreman-line/internal-review-launch/README.md`: separate packaging grant versus original no-install history and no-launch boundary.
3. FORMAT/IMPORT ORGANIZE ONLY `plugins/foreman-line/internal-review-launch/src/types.ts`
4. FORMAT/IMPORT ORGANIZE ONLY `plugins/foreman-line/internal-review-launch/src/schemas.ts`
5. FORMAT/IMPORT ORGANIZE ONLY `plugins/foreman-line/internal-review-launch/src/admission.ts`
6. FORMAT/IMPORT ORGANIZE ONLY `plugins/foreman-line/internal-review-launch/src/index.ts`
7. FORMAT/IMPORT ORGANIZE ONLY `plugins/foreman-line/internal-review-launch/tests/admission.test.ts`
8. FORMAT/IMPORT ORGANIZE plus the ONE approved `lint` script-list assertion addition in `plugins/foreman-line/internal-review-launch/tests/schema-parity.test.ts`
9. NEW `plugins/foreman-line/internal-review-launch/package-lock.json`
10. NEW `plugins/foreman-line/internal-review-launch/biome.json`: byte-identical repository-standard source/test-only rules.
11. NEW `plugins/foreman-line/docs/goals/internal-frontier-review-admission/ir-b01-ci-packaging-evidence.md`
12. NEW this handoff at `plugins/foreman-line/docs/goals/internal-frontier-review-admission/ir-b01-ci-packaging-handoff.md`

Package-local node_modules is untracked permitted tooling, not another source output. No selector config files were created. No shared source/CI/guard/workflow, frozen JSON schema, tsconfig or original evidence record is changed.

## Actual outcomes and the single new scope flag

Read `ir-b01-ci-packaging-evidence.md` for commands, timestamps and diagnostics. Offline cache-first lockfile generation succeeded. Validation pass 1, `2026-10-11T23:21:32Z`–`23:21:43Z`: npm ci exit 0 (11 local packages), npm test exit 0 including parity, strict typecheck exit 0, lint exit 1 (one error/one warning/two infos), six-file mechanical baseline equivalence and four immutable-byte checks PASS. The reduced test console did not retain reporter counts; this pass does not invent a newly observed total. Original pre-packaging 680-test result remains historical.

Lint error `lint/suspicious/useIterableCallbackReturn` at tests/admission.test.ts:369 requires changing ONLY this callback from expression body to block body:

```ts
// Current — NOT yet fixed:
value.forEach((item, index) => registerClosedControls(item, [...path, String(index)]))

// Proposed, NOT authorized by the formatting-only restriction:
value.forEach((item, index) => {
  registerClosedControls(item, [...path, String(index)])
})
```

Calls/arguments/assertions/test registration would remain the same, but this is a syntax/style transformation beyond the one previously approved test exception. STOP: do not silently fix it, relax lint/config, suppress tests, delete/add assertions, use unrelated source fixes or treat a nonzero lint exit as passing.

Suggested minimum owner disposition:

> Approve only the behavior-preserving block-body change for that forEach callback in tests/admission.test.ts; all other IR-B01-CI scope and limits stay unchanged.

Only ONE fresh validation pass remains; pass 2 has not run. Construction started conservatively `2026-10-11T23:17:00Z`; original deadline `2026-10-12T00:17:00Z`. Waiting for scope disposition does NOT silently reset/pause the clock. If the surviving envelope expires or the named session transfers/stops, obtain an explicit bounded disposition rather than inherit new time/passes/constructor authority. No background polling/worker/wakeup is armed.

## No downstream inference

This partial checkpoint is not CI-compatible while lint is red; no DRAFT evaluation PR is authorized to proceed under the compatibility condition yet. Existing repository main failures are separately routed in #185/#179; do not fix/waive them in this manifest. No required green chain, independent architecture/security/process acceptance, native runtime control, provider-use permission, accounting/custody or trusted one-use authority is proven by local tool setup. Every prototype outcome still has mayInvokeProvider false and runtimeStatus held. No provider/native SDK/auth execution, model/delegate/probe spending, credential/config inspection/change, billing/workflow mutation, live integration or production registration occurred; interactive costs remain uninspected.

IR-A01 remains ratified; Pro/settings/auth readiness/scoped non-ZDR policy/incremental-dollar/quota separation/highest verified native reasoning and original IR-B01 choices remain disposed and must not be re-requested. No broader P0/P1–P10, G6, migration, cloud/Neon or archived HRO grant is exercised. This handoff records one exact packaging-style gap, not a new launch permit or independent review verdict.
