# HRO-P1b implementation review and repair directive

Reviewed head: c496568815e3adfe50151d24103b83e37824a5f7.
Frozen spec: 92b05d6e8f0b9b4ce022578a894efb99ea808cda.
Independent review A requests changes despite 20 HRO, 126 dispatch and 399
routing tests passing with relevant typechecks and HRO lint. Four new tests were
insufficient to establish the mandated acceptance matrix.

| Finding | Severity | Coordinator ruling |
|---|---|---|
| Rates and declared thinking entries insufficiently validated | P1 | Fix all exact fields, units, finite nonnegative values, types and uniqueness before evaluator |
| Shared descendants and keys evade phase budgets | P1 | Fix expanded value/depth/string charging with once-only caller capture; include keys and exact inclusive ceilings |
| Oracle/facts/evaluator envelopes accept extra fields | P1 | Close every specified record and both success/failure variants |
| Nonenumerable request/callback properties accepted | P2 | Require own enumerable data descriptors, except the structural array length metadata |
| Empty/duplicate/oversized refusal-code arrays treated as valid refusals | P2 | Validate full 1-32 unique bounded code array and exact refusal shape |
| Null evaluator response becomes input_invalid | P2 | Guard record shape before access; preserve evaluator_invalid phase classification |

All six are accepted defects in the existing contract, not contract amendments.
Reviewer independently reproduced malformed rates/thinking, extra fields,
nonenumerable properties, a 300,000-unit key, expanded shared arrays over 65,000
values / 33 million string units, bad refusal arrays and null evaluator output.
Reproduction script is retained outside the repository at
C:/Users/clint/AppData/Local/Temp/hro-p1b-review-a.mts.

Coordinator releases a fresh user-selected GPT-5.6-Luna repair under the unchanged
five-file allowlist after Step 0 restatement. Preserve the frozen spec and P1a.
First add meaningful regressions and demonstrate RED for each finding family;
then repair and demonstrate GREEN. Complete the remaining mandated matrix,
including batch continuation, exact boundary/plus-one, callback call counts,
full owned frozen success and no caller reads after capture. Do not merely add
six happy-path tests or redefine counts. Record old 20 total / 4 P1b as the test
count tripwire, then distinguish new P1b versus inherited tests accurately.

Dependency setup is complete in this worktree. Use Node24.19.0 and required
package/unchanged dispatch/routing suites; no duplicate full20 local pipeline.
Return a clean local code head, RED/GREEN counts, verification and scope/import
proof. Two fresh independent frontier reviews must approve the repaired head
before integration. No push, provider/config/receipt calls or runtime activation.
## Second review — 428763b04a20952a3358892125c53112c7108f76

Fresh final reviewer A passed25 HRO tests/typecheck/lint but requests three fixes.
The broader exact envelopes, rates/thinking/refusal validation, phase codes,
string/array ceilings, identities/provenance, freezing and continuation now pass.

1. P1: capture validates descriptors and then data() rereads them; dependency
   exact() also reads descriptors before callbacks are reread. Proxies with a
   valid first descriptor and nonenumerable second descriptor succeed, while
   valid once-readable properties refuse. Capture each descriptor exactly once,
   validate it, consume its captured value. Arrays/length/callbacks included.
2. P2: capture() counts a shared object occurrence and charge() counts its root
   again. Exactly8192 expanded values in a root array containing31 aliases to a
   256-primitive array plus one223-primitive array incorrectly exceed the limit;
   equivalent unshared copies reach normal schema refusal. Count each occurrence
   once, preserving both shared capture and expanded accounting.
3. P2: record key length/aggregate checks happen after descriptor reads. A2049-unit
   key invokes a hostile descriptor then returns input_invalid. Check/charge the
   key before any descriptor access so known limit violations refuse immediately.

Coordinator accepts all three as existing-contract defects. No spec amendment,
P1a change or allowlist expansion. The next Luna repair is narrowly these fixes
plus meaningful RED/GREEN regressions.25 total/9 P1b is the new tripwire. Retain
all prior repaired behavior and required unchanged regression suites. Independent
reproduction is C:/Users/clint/AppData/Local/Temp/hro-p1b-final-a.mts. Boundary
fixtures deliberately distinguish capture-limit from later schema refusal; an
invalid eventual schema is not permission to miscount its bounded capture.
Two fresh final frontier approvals still required before merge.