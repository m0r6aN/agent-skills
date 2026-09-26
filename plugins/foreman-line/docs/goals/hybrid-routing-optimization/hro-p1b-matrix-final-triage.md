# HRO-P1b permanent-matrix review disposition

Coordinator decision, 2026-09-26: accept both P2 findings from the independent
review of f12b9f0f8f09b6a5dab89a1f159cbe117d30770e. No implementation defect was
found; the array preflight repair is correct. Approval is withheld for required
durable behavior coverage. Do not change the frozen contract or runtime source.

The reviewer ran 35 HRO tests/typecheck/lint, 126 dispatch tests, 399 routing
tests, and 159 independent hostile-input cases including 48 boundaries. Six
temporary mutations all survived the committed 19 consumer tests: removing the
ageMs, maximum-age, requested-id and facts-id checks; substituting incorrect
oracle identity values; substituting an unrelated oracle clock. These concrete
controls establish the gap rather than asking for implementation-mirroring tests.

Luna rework is restricted to consumer-compatibility.test.ts and the existing
hro-p1b-handoff.md under their current Allowed Files. Add independently forged
ageMs, mismatched response maxAgeMs, wrong requested id and wrong facts id cases,
with exact phase refusal and zero evaluator calls. Assert the ENTIRE expected
owned oracle request with exact clock, identity values and singleton inventory,
in addition to existing deep-freeze/caller-mutation checks. Check every required
matrix family against the contract; the findings are a floor, not a ceiling.

Use the reviewer's six temporary mutation controls in
C:/Users/clint/AppData/Local/Temp/hro-final-matrix-a/ to demonstrate that each
relevant durable regression fails when its behavior is removed, then restore
unchanged production source. Never commit mutant copies or modify shared
dependencies. Report actual passing test count and the six negative controls.
The frozen spec remains 92b05d6e8f0b9b4ce022578a894efb99ea808cda.

Fresh Step 0 is required before edits; coordinator releases it under existing
authority. Two final independent approvals and mainline integration/full CI
remain the merge gates. This record makes no runtime or live-routing claim.
