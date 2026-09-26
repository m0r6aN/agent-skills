# HRO-P1a independent review and rework

Reviewed head: 2708c3d8ecfbe60209e0513a20dab59cb3569fb7.
Spec: HRO-P1a-mapping-contract.md including A1 CI registration amendment.
Two fresh read-only architecture/risk reviewers independently reproduced the
same correctness failures. Both passed the existing eight package tests and
seventeen injected CI-runner tests. Those successes do not clear the findings.

| Finding | Coordinator disposition | Required regression |
| --- | --- | --- |
| Caller array iterator can replace disabled scanned evidence with allowed evidence | Fix before merge | Proxy and inherited iterator cannot run or substitute a binding |
| Caller proxy traps during reread escape exported typed-refusal boundary | Fix before merge | Delayed descriptor throw never escapes; no caller graph rereads |
| Primitive visits omitted and oversized arrays traversed before limits | Fix before merge | Count every visited value, share aggregate budget across all three arguments, preflight length/count limits, prove prohibited child untouched |
| Numeric-looking noncanonical array keys/accessors accepted | Fix before merge | Reject 01 and every noncanonical/nonindex own key |
| NUL join collides distinct opaque tuples | Fix before merge | Unambiguous tuple encoding preserves distinct embedded-NUL components |

No contract amendment is necessary for these repairs: all violated existing
closed-input, iterator, defensive-copy, bounds and exact-identity requirements.
Rework stays within the eleven amended implementation paths. Use one bounded,
descriptor/index-based copy into owned plain data within a complete exception
boundary; validate only owned values. Preserve the existing tests and CI
behavior, add exact reproductions plus the remaining mandated boundaries,
provenance fields, cycles and mutation checks. Do not relax the spec to fit code.

Builder Step 0 accepted in principle: Luna restated these repairs without edits
while the second review completed. Release and final review closure will be
recorded against the repaired commit. Both independent approvals and the full
combined package CI chain remain mandatory. No runtime effects are authorized.

Review B independently installed the package from its lockfile in a temporary
directory using Node24.19.0 offline; tests, typecheck and lint passed. Package
portability did not explain the semantic failures. Reviewers made no source edits.

Both final verdicts are request-changes. Review B additionally accepted 262,684 aggregate string units via independent per-argument budgets; this exceeds the 262,144 combined ceiling and is part of the accepted resource-limit repair. On 2026-09-26 the coordinator released Luna after its Step-0 restatement, with all findings accepted and no disputed reproductions. Original tests remain the minimum tripwire; semantic boundary additions are required.
