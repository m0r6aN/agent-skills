# PMC-P2A implementation review disposition

Coordinator, 2026-09-26: accept both P2 findings from independent review A of
0db995bd74309afb57733fbf14193202591d73d9. The reviewer observed 712 routing tests,
126 dispatch tests, typecheck/lint and 43 additional negatives pass. Source scope
and frozen spec d65ff524bba2eda6c9e38de44c78aac4aae1c59f were correct. The two
findings violate existing deterministic precedence, not a new contract.

1. refs traverses Object.entries in caller insertion order. A valid L1 review
   subject with stale instanceId evidence and future family evidence changes
   FRESHNESS_STALE_REFUSED to FRESHNESS_FUTURE_REFUSED when only its keys are
   reversed. Root reproduced this with the independent temporary probe.
2. An aggregate unknown-global return precedes available provenance checks.
   Forged evaluation time, snapshot digest, config reference or age alone
   yields CONTEXT_BINDING_REFUSED but unknown budget changes that to
   GLOBAL_EVIDENCE_UNPROVEN. Frozen stage 3 puts available scope/time/digest
   inconsistency first; unrelated unknown claims must not hide it.

Repair within the existing six-file allowlist. Traverse EVERY relevant evidence
structure in frozen declared-field order and array-index order, not caller key
order or an invented alphabetical order. Review every affected first-failure
traversal, not only the demonstrated review subject. Perform available provenance
and scope checks before the aggregate unknown-global return, gating each check
only on its actual prerequisite. Preserve all codes, schema/type contracts,
candidate-local cost handling, ownership/bounds, no-context L6 refusal and no
production authority. No producer/audit/controller/ledger changes.

Add permanent RED-to-GREEN regressions for reordered failing global and nested
evidence, each of the four provenance conflicts combined with unknown unrelated
global claims, and cases where the particular prerequisite is actually unknown.
Use C:/Users/clint/AppData/Local/Temp/pmc-p2a-review-a.mts as independent evidence,
not a substitute for committed tests. Demonstrate stable declared precedence and
unchanged valid selections. Run focused and full routing tests/typecheck/lint,
unchanged dispatch regressions and diff/scope checks; update the allowed handoff.

Gate 2 remains authorized. Fresh repair builder inspects actual head/spec and
stops at Step 0 before coordinator release. Return a local frozen source commit;
no push/merge. Two independent final reviews and full CI remain required.
