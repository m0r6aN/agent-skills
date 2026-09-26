# HRO-P1b implementation handoff

Branch: `codex/hro-p1b-20260926`
Base: `ce33e735c1bc2d4d0bbcb0dfede223c8fd04d9cd`
Spec: `HRO-P1b-mapping-consumer-integration.md` (A1 blob `92b05d6e8f0b9b4ce022578a894efb99ea808cda`)

This parcel adds an offline, evidence-only consumer compatibility harness for
P1a mapping proposals. It captures each phase through bounded owned copies,
checks injected normalized eligibility facts/refusals, and validates an
offline evaluator envelope against the existing public dispatch result shape.
It never calls production dispatch, writes receipts/configuration, reads a
clock, performs network/provider work, or claims PMC/RCM runtime authority.

## Verification

- Node `v24.19.0`; package dependencies installed from the existing lockfile.
- `npm test`: 20 focused tests passed, 0 failed (16 inherited P1a tests plus
  4 new P1b tests).
- `npm run lint`: passed; 7 package files checked.
- `npm run typecheck`: passed under Node `v24.19.0` after installing the
  existing locked dependencies for the actual import graph offline.
- Unchanged dispatch suite: 126 passed, 0 failed; dispatch typecheck passed.
- Unchanged routing-policy suite: 399 passed, 0 failed; typecheck passed.
  Routing-policy lint passed with one existing informational
  `useLiteralKeys` diagnostic in `catalog-snapshot.test.ts:777`.
- The implementation changes exactly the five active-spec paths.
- Dispatch imports are type-only; no runtime evaluator/receipt/config/network
  imports are present.

P1a implementation files remain unchanged. Integration must reconcile against
the latest mainline after P1a PR54 merge (`59b48a0`) and rerun unchanged
dispatch/routing-policy regressions plus independent architecture/risk review.

## Repair verification

The first implementation review identified six accepted contract defects:
incomplete rates/thinking validation, alias/key budget undercharging, open
response envelopes, nonenumerable properties, malformed refusal-code arrays,
and null evaluator phase classification. The repair adds RED regressions for
each family before the GREEN implementation and keeps all changes within the
same five paths.

- HRO tests: 25 passed, 0 failed (16 inherited P1a tests plus 9 P1b repair
  tests; the prior 20/4 count remains the historical tripwire).
- HRO typecheck: passed under Node `v24.19.0`.
- HRO lint: passed; 7 files checked.
- Unchanged dispatch suite: 126 passed, 0 failed.
- Unchanged routing-policy suite: 399 passed, 0 failed.
- Existing locked dependencies were installed offline for hybrid-routing,
  dispatch, routing-policy, contracts, schema-scaffold, shaping, projection,
  receipts, permission-profiles, role-authority, skill-injection, spec-linter,
  worker-envelopes, and foreman-config. No manifests or lockfiles changed.

The repaired capture charges memoized aliases from the owned snapshot at each
expanded depth, including keys and descendants, while caller descriptors are
read only during the phase capture. Closed success/failure envelopes, exact
rate/thinking contracts, enumerable data descriptors, refusal-code arrays, and
evaluator-invalid classification are covered. Independent frontier review is
still required before integration.

## Second capture repair — builder evidence

Source85d48b38ea2f71532dccbda1ef4b4aef2a0615fb changes only consumer source and
tests from coordinator base63fab351. Builder recorded RED28 total with25 pass/
3 fail, then GREEN28/28 (16 inherited P1a plus12 P1b), typecheck and lint;
unchanged dispatch126 and routing399 also passed. Dependencies were not changed.
The added regressions cover once-only record/array/callback descriptors, exact
8192 versus8193 shared expanded values, and key-limit refusal before descriptors.
Independent reproduction reports one descriptor read, oversized-key unsafe reads0,
and correct phase codes at both value boundaries. Two fresh final frontier
reviews remain required; these are builder results, not independent approval.

## Third capture repair — Luna builder evidence

The narrow repair keeps the frozen spec, P1a implementation, five-file allowlist,
and all earlier repairs unchanged. Array capture now performs the known minimum
remaining-value check immediately after validating `length`, before collecting
child descriptors or allocating the owned array. The 31 distinct 256-element
arrays plus a 224-element proxy-array regression therefore returns
`input_limit_exceeded` with zero child descriptor reads.

The TDD sequence recorded a meaningful RED of 29 total tests with 28 passing and
the new preflight regression failing as `input_invalid` after one hostile
descriptor read. After adding the durable matrix, the intermediate 35-test run
was 33 passing and 2 failing: the preflight regression plus an adapter-invalid
test wrapper mistake, which was corrected before the source repair was judged.
Final GREEN is 35 total tests passing, with 16 inherited P1a tests and 19 P1b
tests. The historical 28 total / 12 P1b count remains the tripwire.

### Permanent acceptance-matrix coverage

| Required family | Committed test/table | Required outcome asserted |
|---|---|---|
| Array minimum preflight | `preflights minimum remaining array values before child descriptors` | 8,193-value overflow, `input_limit_exceeded`, zero child descriptor reads |
| Digest/source/config pins | `acceptance matrix: forged eligibility pins refuse before evaluation` | Each forged pin yields `eligibility_mismatch`; evaluator calls remain zero |
| Clock and age | `acceptance matrix: future, stale, exact, and zero-age evidence boundaries` | Forged clock, future, stale, exact inclusive, and zero-age boundaries with phase/call counts |
| Requested/facts identities | `acceptance matrix: requested and facts identities require one exact match` | Missing, duplicate, wrong requested, and wrong facts identities refuse before evaluation |
| Protocol and modalities | `acceptance matrix: facts protocol and modalities are exact` | Wrong protocol and empty, duplicate, unsupported, and non-string modalities refuse before evaluation |
| Frozen owned adapter inputs | `acceptance matrix: oracle and evaluator inputs are deeply frozen and caller mutations do not leak` | Exact nested oracle/evaluator shapes are deeply frozen; later caller mutations do not alter returned evidence |
| Phase codes and downstream calls | `acceptance matrix: phase codes stop downstream callbacks after prerequisite failure` | Mapping, input, adapter, eligibility, evaluator, and route phase codes plus exact oracle/evaluator call counts |

## Final verification

- Node `v24.19.0`; no dependency, manifest, lockfile, provider, config,
  receipt, or upstream changes.
- HRO `npm test`: 35 passed, 0 failed.
- HRO `npm run typecheck`: passed.
- HRO `npm run lint`: passed; 7 package files checked.
- Unchanged dispatch suite: 126 passed, 0 failed; dispatch typecheck passed.
- Unchanged routing-policy suite: 399 passed, 0 failed; routing-policy typecheck passed.
- The worktree remains within the five active-spec paths; dispatch access remains
  type-only and no runtime evaluator/receipt/config/network imports were added.
- Two fresh final frontier reviews remain required before integration; these are
  builder results, not independent approval.
