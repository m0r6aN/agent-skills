# PMC governed caller inventory and P2E split handoff

2026-09-26, source base `d98e176e6ce6d6164679d35dc21647ef47f33f67`.
E1 implementation refreshed against released base b1b0add7738e9b0e9a14c025107a98456fdfb421.
Local offline tests now exercise the retired APIs; no provider/network request,
real credential read, container build or host configuration change occurred.
E1 is implemented locally pending independent source review and separate audit
reconciliation; E2 remains proposed/unimplemented. No activation is claimed.
Historical source pins below retain the pre-retirement evidence.

## Actual callers and ownership

Paths in this table are plugin-relative except the explicitly repo-root rows.

| Surface / source location | Actual behavior and owner | Proposed disposition / required proof |
|---|---|---|
| dispatch/src/routing-eval/shadow.ts:295 executeShadowRoute | Retired optional public shadow execution; dispatch/shadow owner. All inputs reject with ShadowRoutingError / LEGACY_EXECUTION_RETIRED before argument or dependency access. | E-01 ratified; candidate/skip execution and receipt writing removed. Pure hash, limits and public types preserved. Direct and both barrels covered; source review pending. |
| dispatch/src/routing-eval/index.ts:44 and dispatch/src/index.ts:70 | Unchanged re-exports of the same retired shadow function, not independent transports. | Exact function identity and typed retirement tested through both barrels and the direct module. |
| jev-decisions/src/runtime.ts:155 executeDecision | Retired Jev executor; fixed LegacyDecisionRetiredError before input, clock, lease, environment, timeout or transport. Existing wildcard barrel exports the new class. | E-02 ratified. Public constants/types preserved; unreachable private execution helpers removed. D19's obsolete three-literal runtime custody pin requires a separate audit-owner change. |
| tests/jev-smoke-test.mjs:3 | Tombstone command/module: fixed `{"ok":false,"code":"LEGACY_EXECUTION_RETIRED"}` plus newline, exit 2, no stderr. | Direct child/import tests install fetch/credential/timeout traps before evaluation; no transport or input/config/fixture read. |
| labs/jev-container/jev-run.mjs:2,140 | Offline fake-transport simulator, not a live sender. Container-relative ../src import; constructs in-memory lease/transport and nonsecret marker, then calls executeDecision. | Keep lab source unchanged. E1 nevertheless removes its old runtime success path; existing catch produces execution_error when relocated/importable. Explicit dependency impact, not preserved simulation evidence or an allowed production bypass. Pure replayFixture remains available. Root to disposition any later lab adaptation separately. |
| labs/jev-container/Dockerfile and README.md | Still reference prior jev-decisions/container paths, absent in this checkout; independent relocation debt. | Unchanged, not repaired or executed here. Do not claim a verified working container or infer provider activity. |
| jev-decisions/tests/runtime.test.ts and tests/p4-boundary-scenarios.test.ts | Offline retirement consumers retain former input/provider fault scenarios and fixture data. | Old execution/receipt expectations explicitly replaced by typed retirement and zero-effect checks. No credential unlock or skipped tests; unrelated parser/replay/consumer suites remain unchanged. |
| dispatch/tests/shadow-routing.test.ts | Offline retirement tests cover formerly accepting alternate policy, all lanes/aliases, hostile arguments, dependency scenarios, direct/barrel paths and pure hashing. | No argument/dependency calls or receipts; canonical hash behavior and byte bounds remain tested. |
| dispatch/src/approval-cli/index.ts:242 prepareDispatch | Parcel/routing/skill/compression preparation, not provider inference. | Preserve. No existing governed-inference handoff, bin or launch call to migrate. |
| dispatch/src/approval-cli/index.ts:429 executeDispatch | dispatchWorktree then Stage-C DispatchOrder receipt, no Pi/provider call. | Preserve; worktree and receipt creation are not execution evidence. Never add implicit send. |
| permission-profiles/src/emitter.ts | Worktree process operations, not inference. | Preserve; no hidden terminal hook retrofit. |
| routing-policy/src/pi-openrouter.ts and templates/pi-openrouter-routing.json | Static legacy declarations, including old Jev entries. | Preserve v0 compatibility. Presence is not launch permission; E1/E2 execution gates remain mandatory. |
| hybrid-routing/src (tracked TypeScript) | Evidence/contracts/cache-related plumbing, no discovered createAgentSession/streamSimple caller. | HRO owner. Future caller gets a separate exact-path integration parcel; no migration claimed now. |
| docs/goals/pi-routing-adapter-compat/probe/check-api-surface.mjs | Local source-inspection evidence tooling. | Not inference caller; no execution here. |
| repo-root dockerfile.pi | Generic image installs unpinned Pi and ENTRYPOINT pi. | Outside PMC initiating boundary; unchanged, never claimed version-pinned or governed by E2. |
| repo-root scripts/run-evals.js | Skill-eval tooling; opt-in Tier 3 runs headless claude subprocesses, Tier 2 deterministic. | Repository eval owner, not a Foreman parcel launch. Preserve, explicitly not claimed governed/no-network. Do not silently route it through PMC or delete it. |
| dispatch/src/pmc-launch/entry-cli.ts (PROPOSED, not present) | E2 introduces new explicit stdin command. | Exercise actual command with refusal-only production bootstrap; private accepted-predecessor offline composition separately. No existing caller was migrated merely by adding this file. |

## Search method and limits

Read tracked source and public barrels, not just string counts. Patterns:
executeShadowRoute, invokeAdapter, executeDecision, transport.post, alpha/decisions,
fetch, createAgentSession, streamSimple, prepareDispatch, executeDispatch,
pi-bundle-parcel, child_process and spawn. Check repository-root scripts and Pi
launcher separately; exclude dependency/git contents and distinguish documentation,
fixtures and tests from executable entry points. Current plugin tracked source has
no Pi session/stream invocation; the pasted pi-bundle-parcel workflow is not an
existing repository source caller. Searches establish this checkout only, not
host-wide running processes, external importers, installed extensions or dynamic
adapters. Any new governed executable hit blocks activation until classified and
tested; known governed callers cannot be renamed outside-boundary to pass review.

Pre-retirement source pins (Git blobs, not permanent moving-base assertions):

| Source | Blob |
|---|---|
| dispatch/src/routing-eval/shadow.ts | 106433c648877f4f8194ddb429f61fc2cf0addcf |
| jev-decisions/src/runtime.ts | e37ef8e148fa4290bd1a6405fdd53629cc89d146 |
| tests/jev-smoke-test.mjs | 47ca54e57c4a74b80784013db516ab9d14c27577 |
| dispatch/src/approval-cli/index.ts | 9b681d38c9080d2f603e42ef3f3ce8435a86aa9b |
| labs/jev-container/jev-run.mjs | 5de54ec5f2415e1ede5fb777bde11f9e2d78cc8c |

## Decisions, migration steps and remaining gaps

The [parent](../../specs/active/PMC-P2E-config-caller-migration.md) records root
E-01/E-02 retirement decisions and E-03/E-04 command/plan choices. Recommendations
were ratified by the delegated coordinator after two independent full-split approvals at fe5a144dbd5518ad74e97ecd9d6f19ddb0056c8f. The coordinator explicitly
kept pure v0/validation/declarations/offline lab unchanged. Root separately released
E1's exact eight-file implementation at b1b0add7738e9b0e9a14c025107a98456fdfb421;
E2 runtime and all activation remain unreleased.

[E1](../../specs/done/PMC-P2E1-legacy-inference-disposition.md) replaces the three
governed executors with exact refusals. Consumers must handle the typed retirement
or fixed exit-2 result; they cannot obtain equivalence by pointing old inputs at
E2. Shadow candidate/skip receipts and Jev live observations cease. Unknown host
consumers require owner notification/disposition at release. Preserve old audit
evidence and fixtures. The offline simulator compatibility loss is explicit above.

[E2](../../specs/active/PMC-P2E2-governed-user-entry.md) accepts the full existing
LaunchInputV1 only through a separate opt-in command. A future authorized initiating
host must possess genuine origin authority, receive B1's existing preissued IDs,
compute the exact C digest over its unchanged original request/payload, and consume
both C result and D finalized output. It must not retry after missing output or
assume an audit receipt is a capability. HRO must implement/exercise its own adapter
under a separate exact-file handoff. E2's command currently planned to refuse
production is not that future live HRO adapter.

Private installation owns initiating-task/profile/observation custody and binds
role-separated D/C/ledger capabilities. C runs first; D finalizer receives only
the direct C result and returns bounded final text after successful reconciliation
and drainage. Plan output is pure, disabled, non-executable evidence; no host patch,
credential reference or enable flag. Accepted source maps stay exact; unknowns
are explicit denials, not defaults. See the child for the finite I/O contract.

Production remains blocked by accepted B1/C/D runtime, authentic origin/batch and
acquisition implementations, exact endpoint/tariff/all-components billing bounds,
quality/privacy/availability, budget/config authorities and explicit bounded-live
authorization. The vendor inquiry is prepared but NOT sent; the owner was asked
asynchronously for existing vendor evidence. Neither is an affirmative attestation.
Refusal-only release/offline tests do not redefine or close full HRO live exits.

## Historical shaping verification

Advisory checks passed: all three spec frontmatters, ordered required body sections,
local relative links and `git diff --check`. The only mutations are the four
documents authorized by the parent. One-time diff against d98e176 confirms
dispatch/Jev source and tests, direct smoke, labs, root Pi launcher and eval scripts
unchanged. No runtime tests, Pi/provider activity or production proof claimed.

Spec validation used D:/nvm/v24.19.0/node.exe and the existing matched-lock
spec-linter donor in hro-pmc-schema-reuse-shaping-20260926. From that donor's
plugins/foreman-line/spec-linter directory, the exact command form was
`node.exe node_modules/tsx/dist/cli.mjs src/cli.ts validate <absolute-draft-path>`
for E, E1 and E2; every native exit was 0. No dependencies were installed or edited.
The required-body/link pass was a read-only PowerShell check, not a gate grant.

Handoff: reviewed design and E-01..E-04 ratification only. Root retains
independent design review, fresh-base/constructor reconciliation and every runtime
release. Current narrow shape supplies no source approvals, no production
installation and no replacement claim for full HRO live acceptance.

## E1 local implementation and verification handoff

Root accepted E-01/E-02's behavior loss, including the unchanged lab's
execution_error outcome, and released only the eight E1 paths. This local source
implementation is not yet independently accepted. Parent/E1/E2 contracts, lab,
fixture data, schemas, routing policy, v0 selection, approval-cli, generic Pi and
root eval tools were not changed. Pure canonical hashing and every existing
public type/constant/export remain; only Jev's typed retirement class is added.

Three test-first checkpoints (Node 24.19.0):

1. Shadow: new retirement assertions first failed against old errors (native
   exit 1), then passed after the tombstone. The initial missing-shaping-dependency
   loader failure was NOT counted as RED; root supplied matched-lock read-only
   junctions before the real assertion run. Final shadow coverage is 51 tests
   in the passing dispatch package suite.
2. Jev: direct/barrel retirement assertions failed against old result records or
   missing typed error (exit 1), then 34 focused tests passed (exit 0).
   Former fault scenarios and provider fixtures remain explicitly covered as
   pre-inspection refusals; existing validator/replay/consumer tests still run.
3. Smoke: two direct/import assertions failed under preinstalled credential/fetch
   traps against the old script (exit 1); the tombstone passes. The final six
   process tests include deliberate credential, fetch and timeout negative
   controls demonstrating that the harness detects forbidden access. No real
   credentials enter child environments.

Checks from the named package roots using existing scripts and matched-lock
read-only dependency junctions (no installs or donor edits):

| Check | Actual outcome |
|---|---|
| dispatch: npm.cmd test / run typecheck / run lint | 204 tests pass; all final exits 0. One removed-helper formatting failure was fixed before final lint. |
| jev-decisions: npm.cmd test / run typecheck / run lint | 50 tests pass; exits 0. Its latter two scripts only syntax-check index.ts, not a full TypeScript build. |
| routing-policy: npm.cmd test / run typecheck / run lint | 938 tests pass; exits 0. Existing catalog-snapshot useLiteralKeys informational diagnostic remains unchanged. |
| node --check jev-decisions/src/runtime.ts | exit 0, explicit changed-file syntax check. |
| node --check tests/jev-smoke-test.mjs | exit 0. |
| node --test plugins/foreman-line/tests/pmc-legacy-executors.test.mjs from repo root | 6 pass, exit 0, isolated direct/import tests and trap negative controls. |
| contract-readers: npm.cmd test / run typecheck / run lint | 70 tests pass; all exits 0. |
| mutation-scope-guard: npm.cmd test / run typecheck / run lint | Test exit 1 from its real-D19 assertion at tests/guard.test.ts:439; typecheck/lint exit 0. |
| verification: node --import tsx src/d19-audit.ts --plugin-root <this-worktree>/plugins/foreman-line | exit 1: obsolete Jev runtime DATA pin, detailed below. |

D19 truthfully refuses after deletion of execution-only CUSTODY_PATHS:
runtime expected 3 literals / observed 0; combined Jev DATA expected 13 / observed
10. Expected digest
0c6fe241efaa1d50b1cb8df1d37054fb8558090e176d1ef2b8e166e7badae83b;
observed digest
2f40b0bb22bd0a0c008e40b5340bddeb7b8c5f0c1af22c716a086cd0bdfc8d8b.
Root acknowledged a separate audit-owner disposition after independent source
review: remove only the obsolete runtime declaration/count pin and preserve the
remaining replay.ts PATHS ten-literal pin and exact declaration/direct-array rule.
No audit/registry/guard change, blanket exemption or dead sender was added here.

One-time release-base comparison passes: exactly the eight authorized paths;
real mutation-scope postHocCheck authorizes all eight; existing export names,
public type/constant bodies, argument/result signatures and pure hash helpers
are preserved (only the stated error-code/class additions). No moving-base pins
were added to permanent tests. Final focused shadow rerun: 51/51, exit 0;
dispatch typecheck/lint both exit 0 after the final test-fixture correction.

The source search now finds only the two retired functions, unchanged barrels,
the preserved endpoint constant, and the documented lab call. It does not prove
absence of external host importers. E1 must receive independent review and audit
integration before being described as chain-green; E2 and full HRO live acceptance
remain separate. No push, merge, provider call or activation occurred here.
