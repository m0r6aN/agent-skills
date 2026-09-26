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
