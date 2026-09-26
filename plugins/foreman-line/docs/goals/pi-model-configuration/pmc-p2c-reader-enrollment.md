# PMC-P2C Contract B reader enrollment

Release base: `343250e08eaee72581d7b925a7b9b6796f9e3536` in the isolated
hro-pmc-p2c-integration-20260926 worktree. Source93f8021 has two independent final
approvals. This parcel only enrolls its genuine complete routing-class validator;
it does not change controller runtime, tests, public barrel or predecessor code.

## Scope and meaning

Exactly five paths are authorized: contract-readers/src/registry-data.ts,
contract-readers/tests/touch-set.test.ts, verification/src/d19-audit.ts,
verification/tests/pmc-controller-reader-audit.test.ts, and this report, all under
plugins/foreman-line. The registry adds the controller once under Contract B,
with its additive LOCKSTEP rationale: adding a class requires changing its full
literal membership list. Contract A is unchanged. The existing B1 exact-reader
expectation and shared derived touch set gain that one file. No reader waiver,
vocabulary evasion, detector algorithm or allowed AST context changes.

D19 changes exactly the registry DATA count and fixed digest. Its existing
contractA/contractB direct contexts remain valid. Moving the same reader from B
to A preserves that multiset and is intentionally invisible to D19's value pin.
Permanent reader-membership tests detect that semantic error. No claim that D19
alone distinguishes the two contracts is made.

## Fixed material established before implementation

Step0 independently imported the inspected, data-only actual registry, retained
reader/contract/description values containing the plugin prefix, reproduced the
old count10 digest, then added precisely the controller literal. The coordinator
independently reproduced both calculations before release. Values are sorted with
JavaScript Array.sort(), serialized with JSON.stringify, encoded UTF-8 and SHA-256
hashed, preserving repeated values:

```json
["The spec-frontmatter schema (plugins/foreman-line/docs/SPEC-CONVENTION.md §4) and its typed/generated instantiation.","plugins/foreman-line/dispatch/src/pmc-launch/controller.ts","plugins/foreman-line/dispatch/src/pmc-launch/intent-custody.ts","plugins/foreman-line/hybrid-routing/src/consumer-compatibility.ts","plugins/foreman-line/routing-policy/routing-policy.yaml `classes` map keys — the routing_class enum vocabulary.","plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json","plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json","plugins/foreman-line/spec-linter/src/schemas.ts","plugins/foreman-line/spec-linter/src/schemas.ts","plugins/foreman-line/spec-linter/src/types.ts","plugins/foreman-line/spec-linter/src/types.ts"]
```

Old10: `dda1e79b0cfbf2767aef8eb37d67f235647e046fd52c98a53bdcd23809de748d`.
New11: `03adbbf53a4c30c42db51268b8749bea0c88217e633e1aedc570926202a13af6`.
The expected digest is fixed, never learned or rewritten from a test's observed
output. No RCM, ledger, B1, grandfather, Jev or other pin changed.

## RED/GREEN and mutation evidence

Using Node24.19.0, process PATH prefixed by D:/nvm/v24.19.0 and
TSX_DISABLE_CACHE=1, with existing matched-lock read-only dependency junctions:

1. Before enrollment, `node --import tsx --test --test-name-pattern='PMC controller reader' tests/touch-set.test.ts`
   failed at the new exact Contract B membership assertion: 0 !== 1, native exit1.
   After enrollment the same control passed, native exit0. It checks exactly one
   B occurrence, zero A occurrences, actual vocabulary sweep presence and real
   deriveTouchSet provenance. Permanent mutations cover deletion, wrong contract,
   duplication, rename, substitution and simultaneous A/B membership.
2. After registry enrollment but before changing D19 pins, actual D19 failed:
   `11 pinned literal(s) observed, the pin asserts exactly 10`; expected old digest,
   observed exactly the new fixed digest; RESULT: FAIL, native exit1.
   An initial invocation with relative plugin-root was refused with exit2; it is
   not RED evidence. The recorded RED uses the required absolute plugin root.
3. New real-audit suite passed15/15 (one parent plus14 subtests), native exit0.
   It runs the unchanged detector against temporary copies of actual ratified
   sources. Mutated sources are parsed only, never imported or executed. Controls
   include exact source, comments/whitespace, unrelated safe source and the honest
   A/B-relocation positive; negatives cover missing/duplicate/renamed/substituted
   reader, unapproved declaration, nested element, unrelated declaration,
   filesystem-path use, empty exact file and file relocation. Each negative asserts
   actual audit failure with registry reconciliation evidence; all cases retain
   ledger10/B1nine/RCMone/Jevten observations.

The first reader typecheck caught an assertion overload using undefined as its
predicate; this was corrected to assert.AssertionError. No production change was
needed. The final package commands and native results follow below.

## Limits and gates

No provider/Pi/credentials/host configuration, dependency installation, runtime
mutation, push or merge occurred. Temporary copied sources are removed only from
the test-owned directory verified beneath the OS temporary parent. Runtime source
acceptance remains separate from this inventory/audit enrollment. Two independent
audit reviews, combined integration, E1 prerequisite acceptance and remote CI
remain coordinator gates; this report grants none of them.
## Initial enrollment native verification (0eae3a1)

Commands ran from their respective package directories. Native exits were saved
immediately before output summaries; full output was collected, not truncated
through a live pipeline.

| Package/check | Literal command | Observed result |
|---|---|---|
| contract-readers | `node --import tsx --test tests/*.test.ts` | 72 tests,72 passed,0 failed; native exit0 |
| contract-readers | `npm.cmd run typecheck` | native exit0 |
| contract-readers | `npm.cmd run lint` | 11 files checked; native exit0 |
| verification focused | `node --import tsx --test tests/pmc-controller-reader-audit.test.ts` | 15 tests,15 passed,0 failed; native exit0 |
| verification full | `node --import tsx --test tests/*.test.ts` | 637 tests,637 passed,0 failed; native exit0;339098.9329ms |
| verification | `npm.cmd run typecheck` | native exit0 |
| verification | `npm.cmd run lint` | 29 files checked; native exit0 |
| actual D19 | `node --import tsx src/d19-audit.ts --plugin-root D:/Repos/agent-skills-worktrees/hro-pmc-p2c-integration-20260926/plugins/foreman-line` | RESULT: PASS; native exit0 |

Full suites had zero skips, cancellations and todos. Actual D19 observed11/11
registry values and the exact expected03adbbf5…13af6 digest, zero unruled instances,
ledger10/10 and B1nine/nine. The full verification run includes the existing
RCM/ledger/B1/Jev mutation suites as well as the new registry controls. Its longer
runtime came from audit subprocess tests; it completed without timeout or retry.

`git diff --check` passed. Relative to release343250e the D19 source diff is only
the two approved count/digest constants. No dispatch/routing-policy source changed;
all five changed paths are within the amendment. No unchanged runtime test suite
was repeated or claimed as a new result for this enrollment.
## Coordinator-released context-control follow-up

Initial enrollment commit: `0eae3a147e21caf35b0406e171ac572c1d09a1d5`.
The 637-test full verification result above belongs to that initial implementation,
not a claimed full rerun after this follow-up. Before frozen handoff, the coordinator
identified that the original unrelated-declaration/filesystem negatives removed the
approved reader and therefore could fail on cardinality independently of context.
The coordinator released a test/report-only addition within the original envelope.

Two paired controls now KEEP all11 approved registry values and append the same
controller literal in an unrelated declaration or readFileSync call. Both assert:
actual native audit exit1; exactly one unruled class3 site in registry-data.ts;
11/11 cardinality and the fixed digest still matching; no registry cardinality or
value mismatch; unchanged other owner pins. Neither copied source is executed.
These controls establish the context defense independently of the value/count pin.

Expanded focused verification on the final test source:

```text
node --import tsx --test tests/pmc-controller-reader-audit.test.ts
✔ retained pin plus unrelated declaration
✔ retained pin plus filesystem use
ℹ tests 17
ℹ pass 17
ℹ fail 0
native exit 0
npm.cmd run typecheck
FOLLOWUP_TYPECHECK_NATIVE_EXIT=0
npm.cmd run lint
Checked 29 files in 68ms. No fixes applied.
FOLLOWUP_LINT_NATIVE_EXIT=0
```

The full suite was not repeated for this test-only addition, per coordinator
disposition. Runtime, registry and detector source are unchanged from initial
0eae3a1. `git diff --check` passed. Fresh independent reviews remain required.
## Independent final enrollment acceptance — 2026-09-26

Coordinator and independent reviewer A APPROVE57b7058a8348f4a078961e4b27268afae5b5f3fb.
Each independently ran72 reader tests,17 final audit controls, both packages'
typechecks/lints and actual D19, all native0. Digest independently reproduces
03adbbf53a4c30c42db51268b8749bea0c88217e633e1aedc570926202a13af6 at11 values.
Pin-preserving unrelated-declaration/filesystem negatives prove class3 rejection
while the exact DATA digest/count remain valid; membership tests separately prove
B-only enrollment. Detector diff is exactly count/digest constants, no new waiver.
C source/types/barrel/tests remain byte-identical to reviewed93f8021. Scope is the
five authorized files; other ledger/B1/RCM/Jev pins remain unchanged.

Initial full637 verification evidence remains scoped to0eae3a1; final17 focused
checks/tc/lint follow the test-only addition. No invented full rerun. Root logs:
C:/Users/clint/AppData/Local/Temp/hro-c-root-enrollment-review-20260926.log,
hro-c-root-readers-review-20260926.log and hro-c-root-actual-d19-20260926.log.
Combined accepted-main/StageF integration, regression and remote checks remain.

## Combined controller integration acceptance — 2026-09-26

Independent combined reviewer APPROVEb704d8746f4857a0962fa756cb425156606abe31.
Accepted E1/main and StageF integration is documentation-only relative to the
approved controller/audit tree. Root combined dispatch473/473, typecheck and lint
pass. Independent routing944, hybrid53 and mutation44 pass with each package's
typecheck/lint. Actual D19 passes21 packages/201 files, DATA11/11 and all retained
pins. Final reader72 and audit17 checks above remain applicable; no source change
or repeated full637 result is invented. Active C spec lint, current local links,
source-preservation and whitespace checks pass; no unresolved source/audit finding.

This accepts controller composition and its syntactic reader/audit enrollment.
The controller has no production transport or credential supplier implementation;
synthetic offline controls do not establish authentic live inputs, a cost ceiling
or executed inference. D/E2 and full HRO live/measured exit remain separate. Remote
CI and exact reviewed-head merge still gate shipment.
