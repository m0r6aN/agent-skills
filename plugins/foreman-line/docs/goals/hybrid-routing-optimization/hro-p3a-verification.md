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
