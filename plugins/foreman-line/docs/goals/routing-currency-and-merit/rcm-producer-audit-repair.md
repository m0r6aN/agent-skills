# Producer integration audit repair

## Independent repair review A: changes required

Review of 797d1ab513b6f17300bd93acf1f63f31a62ef1aa reproduced two unexpected
audit passes: check?.(...) and baseline?.table in the pinned guard. TypeScript's
isCallExpression/isPropertyAccessExpression include optional-chain nodes, so the
current predicate accepts syntax outside the approved direct-call/access shape.
Root independently reproduced both exit-0 results using the retained review probe
C:/Users/clint/AppData/Local/Temp/rcm-audit-review-a.mts. Accept P2 finding.

Repair within the same three files: explicitly reject optional-chain tokens on
the check call and BOTH property accesses. Sweep every participating AST node
for the same widened-guard mistake. Preserve exact existing argument/operand,
location/value/cardinality checks; do not broaden the exception. Add independent
negative cases for optional check, optional baseline.file and optional
baseline.table, demonstrating RED-to-GREEN. Confirm the ordinary current source
still passes and all earlier negative controls remain enforced. Producer stays
unchanged. Fresh Step 0 and coordinator release precede edits; two independent
final approvals plus refreshed CI remain required. No new authority is needed.

Coordinator triage, 2026-09-26. PR #58 head b3c412f failed both full CI runs
36255363980 and 36255360886. Each reported only mutation-scope-guard test failure;
all other 20-package test/typecheck/lint cells passed. Its actual D19 subprocess
identified one unruled class-3 provenance literal at producer line 839.

Local deterministic reproduction at 114efab on Node 24.19.0 returns exit 1:
21 packages, 191 source files, one unruled instance in
routing-policy/src/public-observation-producer.ts, exact baseline.file comparison
to the retained PMC-P0 spec path. All existing pinned-set counts reconcile.
This is not a timeout or flaky failure. The integration amendment in the active
RCM-P1B spec authorizes a narrow structural/value/cardinality DATA ruling with
negative controls; it does not permit rewriting the producer to evade detection.

Dependency preparation: target verification/node_modules was absent. Its lock
SHA-256 matches the already-installed hro-coordination-20260926 verification
package: 50F2D8E47E866BC7BFBD9888A031B6B668879EFD35EEEAA8285F9B98A0959523.
A read-only directory junction now reuses that installed dependency tree.
Do not install through this junction or mutate its donor. The reproduced audit
ran the target integration source, not donor source. No manifest/lock changed.

Builder Step 0 inspected exact head 114efab and spec blob
1c1966e13b95be5b64afe68a907a4d2194779125. Its proposed AST chain is accepted:
direct top-level validateBindings function, direct check expression statement,
sole argument the existing conjunction, exact strict baseline.file comparison
and baseline.table AC2 guard. Exception count must remain exactly one, including
absence/duplicate rejection. Implementation evidence follows; independent reviews
remain pending.

## Builder implementation and verification

Builder resumed at clean af9b0d780140ecf98aa86ebc129f2853a1329585 with the
same frozen spec. Only the three amendment-authorized files changed. The producer,
retained evidence, schemas, public exports and package manifests/locks are unchanged.

The audit now recognizes only a direct string literal at the approved source path:
the right operand of strict baseline.file equality, that equality the left operand
of the conjunction with strict baseline.table equality to literal AC2, the sole
argument of the direct check call, and a direct expression statement in the body
of the direct top-level validateBindings function declaration. No parenthesis,
template, indirect value, member call, alternative property or nested statement
enrolls. The literal value is pinned. An unconditional reconciliation requires the
file and exactly one accepted site. The report prints the count, source location
and DATA ruling. Existing mechanisms and inventories retain their previous rules.

Permanent tests invoke the actual target audit subprocess on temporary copies of
all ratified packages, excluding dependencies, tests and build output. Each negative
case is independently restored from the accepted producer source; no production
file is rewritten during testing. The matrix covers missing/changed/duplicate
sites, wrong function and nesting, declaration versus statement, receiver/property,
element access, strict operator, callee/member call, argument count, conjunction,
companion guard, indirection/template spelling, adjacent literal, filesystem-call
argument, wrong file and missing file. Controls also show the existing registry
pin and another audit class remain enforced.

RED on the original audit: 22 counted tests, 18 pass and 4 fail (three failing
children plus their parent): accepted source still failed, while deleting the
site or file incorrectly passed. First GREEN: 22/22. Expanded matrix: 27/27.
Verification full suite: 180/180; mutation-scope-guard existing suite: 32/32,
including the actual D19 subprocess on the integration tree. Verification
typecheck and lint pass on Node v24.19.0. A final test-only refinement wraps only
the validation function for the module-nesting negative fixture, keeping valid
TypeScript syntax; the focused 27-test matrix and typecheck/lint were rerun.
No full local twenty-package pipeline was started. Full remote CI and two
independent reviews remain coordinator gates; this record does not claim them.

Missing sibling dependencies were prepared without manifest/lock changes:
matching-lock read-only junctions for contracts, foreman-config and
mutation-scope-guard use hro-coordination-20260926; permission-profiles, projection,
receipts, shaping and skill-injection use hro-pmc-p1b-20260926. Every target was
absent before junction creation and each corresponding package-lock SHA-256 was
compared. Registration had no installed matching donor and used existing-lock
offline npm ci with ignore-scripts/no-audit/no-fund (102 packages). An initial
verification typecheck/full-suite attempt exposed those missing dependencies;
all final reported checks ran after their preparation. No shared dependency tree
was installed into or mutated.
