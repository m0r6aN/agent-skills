# Producer integration audit repair

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
absence/duplicate rejection. Implementation and independent reviews are pending.
