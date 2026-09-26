# HRO-P3A offline measured Stage-D verification report

Date: 2026-09-26  
Second-repair base: `aab16ab`
Mode: offline fixture only; production construction remains refused

## Scope delivered

This repair hardens the dependency-neutral measured-workflow registry and
offline verification driver. The driver executes the existing harness,
review-dispatch/collection, verdict, and human-gate owners against fixed local
fixture adapters, publishes an explicitly labelled offline measurement claim,
and writes an exclusive `MeasuredVerificationHandoff` final Stage-D receipt.

The production constructor returns
`{ok:false,code:'PREREQUISITE_UNAVAILABLE'}` without reading its argument or
performing filesystem, process, network, Jira, or provider effects. No public
barrel, manifest, schema, owner implementation, integration implementation, or
production activation path was changed.

## Evidence

Positive execution exercised the real owner path in this order:

1. Stage-C and BuildResult fixture chain admission and digest checks.
2. `runHarness` with independently authored AC and matrix expectations.
3. One real `dispatchReview` and `collectAdversarialFindings` invocation.
4. `assembleVerdict` and `emitVerificationVerdict` with reread receipt checks.
5. `prepareHumanGate` and `executeHumanGate` with a fixed offline transition.
6. Offline measurement claim publication, seal registration, and synchronous
   exclusive final-D write/reread.

The final-D subject was checked for the exact closed key set, and the duplicate
finalizer returned the same immutable reference without another write.

## Controls exercised

- Production zero-read refusal and cloned-session refusal.
- Closed input shape, digest, UUID/head/hash, path, symlink, receipt, and
  workflow identity checks.
- Frozen registry capabilities, role-separated leases, one-use work tokens,
  ordered phase transitions, stale/cross-session lease refusal, and D/E/F
  predecessor checks.
- Real receipt schema validation, contiguous sequence and `prevHash` checks,
  canonical content-hash rereads, filename/document agreement, and exclusive
  final-D creation.
- Independent expected claim/review sets, exact actor/authority attribution,
  and fixture-only matrix/Git/transition responses.
- Existing verification static guards: no process spawning, Git operation,
  Jira call, provider invocation, regex over untrusted pipeline text, or
  public re-export of the private registry.
- Root custody is rechecked before every owner write/publication/finalization;
  replacement roots and symlinked path components refuse before writes.
- The initial A/B/C → BuildResult chain is bound to the supplied dispatch,
  build, workflow, correlation, spec, matrix, and BuildResult values; owner
  outputs are reread and checked for exact payloads, evidence digests, and an
  exact receipt/claim locator multiset at every post-run snapshot.
- Receipt discovery preflights the 1,024-file, 1 MiB-per-file, and 16 MiB
  aggregate bounds before JSON parsing, and bounded parsing enforces the
  structured depth/string/node limits for receipts and verdict envelopes;
  registry seal/D/E/F hostile getters are typed refusals; alias/cardinality
  accounting includes expanded object nodes and relative depth.
- The repaired test set covers one-over bounds, root replacement, supplied
  BuildResult and DispatchOrder mismatch, duplicate claims after drain,
  post-run spec/envelope tampering, hostile descriptors/getters, shared-array
  alias expansion, cloned sessions, actor/head/reviewer/lease/phase controls,
  and exclusive finalization. Windows short-path/8.3 alias controls were not
  available in this fixture and are not claimed as passing.

## Commands and results

- `receipts`: `npm run typecheck` — pass.
- `receipts`: `npm run lint` — pass.
- `receipts`: full `npm test` — 87 passed, 0 failed.
- `verification`: `npm run typecheck` — pass.
- `verification`: `npm run lint` — pass.
- `verification`: focused offline suite — 15 passed, 0 failed.
- `verification`: combined bounded non-audit suite — 168 passed, 0 failed.
- Verification static scope and hostile-input guards — pass.

The two pre-existing D19 audit files were not counted in the bounded total.
The direct D19 run completed with exit 1 and `RESULT: FAIL`, identifying
exactly three class-5 root-normalization sites in the Stage-D driver. This is
reported as a failure, not waived or represented as a pass; audit enrollment
remains a separate follow-up after runtime stabilization.

## Readiness and remaining gates

This is an offline measured implementation slice, not production readiness.
The authenticated named test-run intake, completed reviewer-output intake,
coordinator disposition intake, authorized decision intake, installed
production composition, genuine telemetry publisher, and P3B E/F integration
remain separate prerequisites. Two independent source reviews are required
before coordinator acceptance; no push, merge, or activation is included here.

## Frontier repair after genuine-owner and bounded-read review — 2026-09-26

This section supersedes the earlier initial-chain/read claims. The repair follows
ratified clarification c378af3824d2819f9fd5653557b087622690a6b1 and release
297bb139854df92950abe656200b1d1bd5f1faaa. It changes only the Stage-D driver,
its existing test file, and this report, within the six-file envelope. The private
receipt registry, its tests, pipeline guards, predecessors, exports, schemas,
packages and dependency locks remain unchanged.

The fixture now uses actual computeApprovalSubject/mintGenesisReceipt and
mintStageBReceipt helpers, then actual prepareDispatch/executeDispatch. Only the
compression call and worktree launch boundaries are synthetic. Both absent and
present permissionProfile survive the actual producer chain. The new validation
uses the exported A/B/C/build schemas inside the typed refusal boundary. It joins
the sole approved spec and ticket to RegistrationV1 and preserves B links. C is
validated as its real projection; parcelRef and Step 0 are reconstructed/bound
through B, the order and the fixed owner sidecars, never falsely attributed to C.
This remains offline consistency evidence, not production authority.

Fixed routing-decision.json and kompress.json are bounded and their captured
content digests retained privately. Initial receipts, spec/matrix and sidecar
custody are rechecked before later owner writes. Capture uses read-only file
handles, bounded allocation/read requests, actual-byte aggregate accounting,
file/ancestor identity checks before and after capture, and finally-close on
all outcomes. Growth, replacement, truncation and injected read faults refuse.
UTF-8 decoding is fatal; existing JSON structural and duplicate-key bounds remain.
A capture admits at most 1 MiB per document and 16 MiB total scanned initial
receipt/sidecar/spec/matrix bytes, with one extra detection byte only. Drain
revalidation failures retain the closed CHAIN_REFUSED result instead of rejecting
with an exception.

RED evidence is retained in the system temporary directory:
- hro-p3a-genuine-red.log: actual producer fixtures fail the prior invented
  Intake/Plan/parcel-only validation.
- hro-p3a-capture-red.log: sidecar mutation after construction was accepted.
- hro-p3a-fd-red.log: growth after open caused an oversized 1,049,550-byte read
  request, despite the 1 MiB bound.

Final checks use D:/nvm/v24.19.0/node.exe and existing matched dependency links;
no installation or donor mutation occurred. Logs are under the system temporary
folder (C:/Users/clint/AppData/Local/Temp on this host):
- hro-p3a-frontier-verification.log: 175 passed, zero failed, exit 0; includes
  all 168 prior bounded tests and seven added groups (22 driver tests total).
- hro-p3a-frontier-receipts.log: 87 passed, zero failed, exit 0.
- hro-p3a-frontier-verification-tc.log and hro-p3a-frontier-receipts-tc.log:
  both typechecks exit 0.
- hro-p3a-frontier-verification-lint.log and hro-p3a-frontier-receipts-lint.log:
  both complete package Biome checks exit 0.
- hro-p3a-aggregate.log: exact 16 MiB accepts and plus one refuses, exit 0.
- hro-p3a-frontier-d19.log: actual D19 exit 1, RESULT: FAIL.

The bounded verification command selects every tests/*.test.ts except the two
existing audit mutation suites pmc-ledger-audit.test.ts and
rcm-provenance-audit.test.ts. Those two suites were not rerun or counted as passed;
the actual D19 failure is separately recorded. Commands are Node --import tsx
--test followed by that explicit file selection (receipts uses all tests), Node
node_modules/typescript/bin/tsc --noEmit, and the existing Biome binary check .
D19 is Node --import tsx src/d19-audit.ts --plugin-root followed by this worktree's
absolute plugins/foreman-line directory.

D19 now finds exactly FOUR class-5 sites in stage-d-finalization.ts: the new
resolve(repoRoot, specEntry.ref) manifest/spec-path join; the two existing resolve
calls in the registration/root equality check; and the existing root-basename
resolve. The necessary manifest join is visible rather than hidden to evade the
auditor. No detector, pin, registry or exception changed. Audit enrollment is a
separate prerequisite; this source repair does not claim audit acceptance.

The mutation matrix independently covers A hash/manifest/spec, B membership and
links, C artifact/reference/skills, order parcel/Step 0, ticket identity and both
fixed sidecars. File tests cover exact/+1 document and aggregate bounds, growth
before descriptor capture, replacement/truncation/read failure during capture,
and descriptor closure. Existing duplicate-after-drain, root replacement,
expanded-alias and finalization controls remain. No live provider, credentials,
host configuration, production store, push, merge or activation was used.

Freeze for root and independent frontier review; the repair author does not
approve this source. Production intake and the separate D19 gate remain open.

## Sole-ticket link membership repair — 2026-09-26

Implemented only after explicit release 12519f23da422f112ece3f4d3628e273e643e7e8,
following ruling f67336567f5dbaaab414bfef212c341f9171fb1e. Exactly the existing
driver, its test and this report changed. After the actual RegistrationResult
schema and sole-ticket join validate, every B link must name that same ticket.
The check neither changes link fields nor imposes count, commit/head equality,
permalink or direction restrictions beyond the accepted schema.

The permanent negative group covers both direction values and a wrong link alone
or alongside valid links, rehashing the actual initial chain and refs so unrelated
hash checks cannot mask the defect. It refuses before measured receipt writes.
Actual producer-positive and optional-profile tests remain. Separate explicitly
synthetic schema-valid controls exercise zero links and multiple same-ticket links
with registration-only commit/permalink values; they are not represented as genuine
completed registration evidence.

Node24.19 RED: TEMP/hro-p3a-membership-red.log, exit 1 (wrong-ticket link admitted;
positive synthetic controls pass). GREEN: TEMP/hro-p3a-membership-green.log, exit 0,
both new groups pass. Both verification and receipts typechecks and full package
lints exit 0; logs TEMP/hro-p3a-membership-{verification,receipts}-{tc,lint}.log.
The earlier 87-test receipts result remains scoped to unchanged receipts source;
that suite was not rerun for this two-line owner repair.

Actual D19 still exits 1 with exactly four class-5 sites; see
TEMP/hro-p3a-membership-d19.log. The expressions are unchanged, now at lines 1184,
1317 (two calls) and 1678. No audit algorithm, constants, schema, source outside the
three-file envelope, dependency, production authority or live activity changed.
Final audit enrollment must use the independently approved final owner source.

Final bounded verification rerun: 177 passed, zero failed, exit 0, including all
175 prior tests and the two new groups (24 driver tests plus pipeline/static guards
and other bounded suites). Log: TEMP/hro-p3a-membership-verification.log. The same
two D19 mutation suites remain excluded and unclaimed; actual D19 failed as above.
Diff/scope checks pass. Freeze clean and stop for root plus independent A review;
this builder report is not source acceptance or an audit waiver.

## Membership repair independent source acceptance — 2026-09-26

Root and independent frontier A approve 385a94f1ed7c4e0b93f8dc098328d6ac0fc068c2.
Root independently ran all 24 driver tests and the original wrong-ticket probe;
the probe now returns PREREQUISITE_UNAVAILABLE. A independently ran the same
24-test driver suite, verification typecheck/full lint and actual D19. Source
validates the actual B schema before checking every link against the sole joined
ticket. Both directions and mixed good/bad links refuse before measured writes;
genuine producer positives remain. Zero/multiple-link controls are explicitly
synthetic and preserve other schema-valid link fields without count/head rules.

Final runtime blob is 0dbffbc73bb8d2f701179d4bdca93d9e0206fe9a. Actual D19 still
fails at exactly four class-5 sites: verifyInitial resolve ordinals 0/1/2 at lines
1184/1317/1317 and buildContext ordinal 0 at1678. Source acceptance does not waive
that audit. The separately proposed exact enrollment, combined-main checks and
remote acceptance remain required; production intake is not provided by this slice.
