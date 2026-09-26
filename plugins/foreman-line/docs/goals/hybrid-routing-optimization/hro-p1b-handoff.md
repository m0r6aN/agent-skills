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
- `npm test`: 20 focused tests passed, 0 failed.
- `npm run lint`: passed; 7 package files checked.
- `npm run typecheck`: blocked by missing pre-existing workspace dependencies
  (`ajv`, `yaml`, and MCP SDK) in the dispatch dependency graph; no parcel
  source diagnostics remain after the local type fixes.
- The implementation changes exactly the five active-spec paths.
- Dispatch imports are type-only; no runtime evaluator/receipt/config/network
  imports are present.

P1a implementation files remain unchanged. Integration must reconcile against
the latest mainline after P1a PR54 merge (`59b48a0`) and rerun unchanged
dispatch/routing-policy regressions plus independent architecture/risk review.
