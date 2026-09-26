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

## E2 pure-planner checkpoint preparation — 2026-09-26

Frontier A completed read-only Step0 at1e6c676. Root separates the planner from
D-dependent entry/installation/CLI work using the amended active E2 spec. Three
future files only: config-plan.ts, its test, and this inventory. Real owners stay
mandatory; isolated child module substitution is only for defensive result shapes
those owners reject before projection and explicit call-count controls. No runtime
injection, source-custody claim, Pi/config apply or production activation follows.
Implementation remains stopped until independent amendment review and root release.

## E2 checkpoint 1 pure planner implementation handoff

Release base: d9088c2d10cabf5a86c089fc507cac7a402322b1. This checkpoint adds only
config-plan.ts and pmc-config-plan.test.ts plus this existing inventory report.
Entry, CLI, installation and actual C/D composition remain unreleased. No caller
was migrated by adding this internal pure function; this does not complete E2 or
any HRO live/production gate.

planPmcPiConfigurationV1 calls the real provider-binding projection and public
catalog adapter once each, preserving both complete owned result unions. It uses
policy binding order and exact requested provider/id joins. The new records/maps
are frozen; real owner results already provide deep owned/frozen evidence. All
entries remain disabled, all eight missing claims remain, off stays null, and both
patches are empty. No filesystem/clock/network/configuration or Pi runtime is
imported by the planner. Owner validation and its bounds remain authoritative.

RED/GREEN: the first focused command ran after writing the tests but before the
planner existed and exited 1 for the missing config-plan module. This is the
new-function test-first RED, not a reproduced existing runtime bug or an assertion
failure in a prior implementation. After implementation, six focused tests pass.
An initial test type-inference error and test formatting failure were corrected;
they are not counted as behavioral RED. The purity child's initial inline command
exceeded the Windows command argument capacity; feeding its source on stdin fixed
the test harness without changing production code or the module-mock mechanism.

| Planner acceptance | Executed evidence |
|---|---|
| Owner result preservation | Real policy fixture and independently authored canonical catalog fixture; full deep equality against both direct owners for success, adapter, reader, snapshot and policy refusals. |
| Identity mapping | Actual owner absent/refused/facts results and exact provider distinction; binding order retained. Ambiguous mixed facts/refusal rows use the separately labelled defensive-unit child. |
| Effort semantics | Actual seven-key exact provider values, sparse/unknown/null maps, unknown extra level, reasoning true/false, unconditional null off and no inferred clamping. Duplicate known levels use defensive-unit substitution and produce all-null maps. |
| Ownership and authority | Frozen complete real-owner output; caller policy/byte mutation leaves prior output unchanged; disabled flags, all missing claims and empty patches asserted. |
| Bounds and hostile input | Getters never called; real 256-binding positive/257 refusal; real 2048-unit positive/2049 refusal; oversized catalog bytes preserve the real typed adapter refusal. Existing owner suites cover their remaining limits. |
| Call counts | Isolated Node module mocks installed before planner import count exactly one call to each owner per invocation, including policy refusal. No runtime injection port/helper is exported. |
| Purity | A separate child imports the actual planner, installs filesystem/HTTP/HTTPS/process/fetch/Date.now traps with synchronized built-in exports, then executes a successful real-owner plan with zero trap calls. This covers invocation, not an assertion that module loading uses no filesystem. |

The defensive child uses Node 24.19.0 --experimental-test-module-mocks with TSX
and mock.module exports. It passed on the pinned loader. Its fabricated owner
results prove defensive mapping only, not real RCM acceptance or authenticity.
No task input can select that facility. Both child sources live within the one
authorized permanent test file and run from stdin; no extra committed fixtures.

Verification with D:/nvm/v24.19.0/node.exe and existing matched-lock dependencies:

- Focused planner: six tests, all pass, zero skipped.
- Full dispatch: 479 tests, all pass, zero skipped.
- Full routing-policy: 944 tests, all pass, zero skipped.
- Both package typechecks and full lints: exit 0. Routing retains its existing
  catalog-snapshot literal-key informational diagnostic; no unrelated fix applied.
- Actual D19 audit: exit 0, 21 packages / 202 source files, no unruled instances.
- Scope/preservation review: exactly these three paths; approval-cli, dispatch
  barrel, v0, routing owners, money, manifest/lock/dependencies and other callers
  unchanged. No provider, credentials, config write, install, push or merge.

Package commands: pinned Node runs node_modules/tsx/dist/cli.mjs --test with the
focused file or tests/*.test.ts, node_modules/typescript/bin/tsc --noEmit, and
node_modules/@biomejs/biome/bin/biome check . . D19 uses verification's TSX loader
from the repo root and this checkout's plugin root. Local TEMP logs use the prefix
e2-planner-: red.log, focused.log, dispatch-full.log, routing-policy-full.log,
dispatch-tc.log, routing-policy-tc.log, dispatch-lint.log, routing-policy-lint.log
and d19.log.

Builder verification is not independent acceptance. Freeze for two source reviews;
accepted D and separately released entry/installation/CLI work remain prerequisites
for later E2 checkpoints. No host apply or production-enablement claim is made.

## E2 planner source and combined acceptance

Root and independent frontier D approve sourcec6b5bd31f05a5031009b74c23adec49f46c9b2ce
and combined739cbaaabc0651936bc6446e16b3cac33e8205af with accepted main N/C and
N closure4477c0a. Planner runtime is unchanged from the frozen author handoff.
Root and D each ran all6 planner tests successfully. D's first invocation from
repo root caused test-child loader-resolution failures; the documented dispatch
working directory passes, and that corrected run is the recorded result.

Root combined dispatch479 and routing964 pass; both package typechecks/full lints
pass (one unchanged routing informational suggestion). Actual D19 passes21 packages,
202 source files, zero unruled instances. Diff/scope clean. This is acceptance of
the pure disabled planner checkpoint, not the unfinished E2 entry/CLI/installation
or production apply. Exact-head remote checks and merge still follow.
