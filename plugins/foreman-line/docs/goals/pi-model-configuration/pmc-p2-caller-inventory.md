# PMC governed caller inventory and P2E split handoff

2026-09-26, source base `d98e176e6ce6d6164679d35dc21647ef47f33f67`.
Source inspection only; no runtime execution, import, provider/network request,
credential read, container build or host change in this shaping assignment.
The statuses below are observations/proposed dispositions, NOT completed migration.
Refresh on the accepted implementation base before each release and activation.

## Actual callers and ownership

Paths in this table are plugin-relative except the explicitly repo-root rows.

| Surface / source location | Actual behavior and owner | Proposed disposition / required proof |
|---|---|---|
| dispatch/src/routing-eval/shadow.ts:763 executeShadowRoute; adapter call:847 | Governed optional public shadow execution; dispatch/shadow owner. Resolves authorization, loads policy, discovers adapter, invokes injected transport, writes candidate/skip receipt. Shipped routing-policy.yaml:208 has empty shadow_routes; alternate valid policy can reach send. | E1 retirement, not advisory/outside. Preserve pure hash and public types; refuse before all ports, clocks, policy or receipt effects. Requires root E-01 and independent retirement review. |
| dispatch/src/routing-eval/index.ts:44 and dispatch/src/index.ts:70 | Re-export the same shadow executor; not independent transports. | Retired function must be reached through both barrels, no alternate alias implementation. |
| jev-decisions/src/runtime.ts:368 executeDecision; transport.post:410 | Real governed Jev alpha-decisions executor with lease/custody/budget handling and environment credential access before post; Jev owner. L6 recommendation output does not exempt inference. | E1 typed pre-effect retirement, no lease/clock/credential/transport access. Root E-02 accepts loss of live recommendation execution. |
| tests/jev-smoke-test.mjs:9,16 | Standalone script reads environment and directly fetches alpha/decisions at module evaluation, bypassing the runtime wrapper. | E1 fixed refusal command, including direct import; zero fetch/key reads. Its misleading old templates/ run comment does not identify another actual file. |
| labs/jev-container/jev-run.mjs:2,140 | Offline fake-transport simulator, not a live sender. Container-relative ../src import; constructs in-memory lease/transport and nonsecret marker, then calls executeDecision. | Keep lab source unchanged. E1 nevertheless removes its old runtime success path; existing catch produces execution_error when relocated/importable. Explicit dependency impact, not preserved simulation evidence or an allowed production bypass. Pure replayFixture remains available. Root to disposition any later lab adaptation separately. |
| labs/jev-container/Dockerfile and README.md | Still reference prior jev-decisions/container paths, absent in this checkout; independent relocation debt. | Unchanged, not repaired or executed here. Do not claim a verified working container or infer provider activity. |
| jev-decisions/tests/runtime.test.ts and tests/p4-boundary-scenarios.test.ts | Known imported executor consumers with fake responses and test-only environment values. | E1 replace only executable-behavior expectations with retirement/zero-effect assertions; preserve unrelated parser/replay/consumer tests and fixture data. |
| dispatch/tests/shadow-routing.test.ts | Known fake adapter executor tests plus pure hashing assertions. | E1 explicit retirement coverage, retained hash behavior; no skipped tests hiding the contract change. |
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

One-time source pins (Git blobs, not permanent moving-base assertions):

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
kept pure v0/validation/declarations/offline lab unchanged; no runtime release.

[E1](../../specs/active/PMC-P2E1-legacy-inference-disposition.md) replaces the three
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

## Shaping verification

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
