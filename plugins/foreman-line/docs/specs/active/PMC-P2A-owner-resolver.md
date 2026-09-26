---
ticket: PMC-P2A
title: Pure versioned PMC owner resolver
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Provide the single PMC v1 resolver consumed by the controlled launcher and HRO.
Given validated policy and authenticated evidence supplied by its trusted caller,
return a deterministic selection or stop decision with all ranking inputs.
Neither decision kind is executable launch authority.

## Constraints

- Sequential after accepted PMC-P1a/P1b and the RCM public fact-consumer handoff.
  Record exact commit and supported exported types before building. No duplicate
  policy validator, RCM internal import, schema alteration or competing HRO ranker.
- Legacy v0 evaluateRouting behavior remains unchanged. Amendment 05 V1 is now
  recorded in both owning charters before dispatch; explicit v1 owns PMC ranking.
  This is not an implicit v0 migration.
- Node 24.19.0, existing TypeScript/node:test/Ajv tooling; no new dependencies.
  Pure module: no IO, ambient clock, randomness, secrets, Pi, network or ledger
  mutation. All time, evidence and budget snapshots are explicit inputs.
- P1 evidence fields represent claims, not authenticity. The external trusted
  evidence port must bind actual receipt digests, subject identity, lane, scope,
  source, expiry and evidence state. A caller-supplied recorded:true is insufficient
  for launch; P2C acquires and authenticates these inputs before invoking P2A.
- Reuse P1 bounds and refusal discipline; reject malformed/hostile/oversized input
  with bounded code/path output, no untrusted evidence text in refusals.

### Contract to freeze before dispatch

Export resolvePmcRouteV1(request: unknown, context: unknown) returning a closed
PmcRouteDecisionV1 union {ok:true, decision} or {ok:false, code, audit}.
Freeze the concrete interfaces in src/pmc-resolver-types.ts; do not use unknown
inside validated records to evade field design. Request identifies explicit
version, workflow/task/request digest, lane/subrole/routing class/classification,
required capabilities/thinking/modality/context/output, bounded token estimates,
builder/coordinator instance exclusions and primary-or-fallback attempt state.
No caller-specified winner or model field may become routing authority.

Context contains accepted P1 policy plus its digest, RCM eligibility facts and
snapshot/config digests, explicit evaluation time, named freshness authorities,
lane-scoped authenticated evidence, declared family/instance facts, and budget
snapshot (ceiling authority, settled spend, outstanding/uncertain reservations,
epoch and conservative cost inputs). Preserve distinct provider model ID, Pi
host ID, protocol and exact baseUrl. Missing source, mismatch or unknown needed
fact refuses; no aliases, family guessing, privacy inheritance or quality proxy.

L6 returns LANE_DISABLED_REFUSED before evidence iteration or ranking. For other
lanes apply classification, capability, independence, context, conservative budget,
verified availability and lane-quality requirements from the ratified rubric.
RCM rejects stale/mismatched catalog facts; it does not attest reachability.
Unknown new-class ceiling refuses, never borrows architecture/risk's value.

For eligible bindings use P1's provider partition/preference and stable ordering:
L1/L2 only opencode; L3/L4 prefer openrouter; L5 lowest projected cost, then quality;
quality descending within equal provider/cost groups; primary before fallback;
final Unicode-code-point provider then model ID. Use the rubric's unit-price
tie-break only when ranking estimates are absent AND a separate conservative
maximum-cost bound still proves affordability. Cost/quality comparisons never
weaken eligibility. Do not mutate source order or policy.

For budget/cost comparisons consume authenticated exact decimal rate lexemes,
bounded to 18 fractional digits, and bounded counts. Parse to exact rationals,
sum the conservative maximum charge, then ceil once to integer micro-USD. Reject
unknown charges/units, overprecision or unsafe magnitudes. Never recover an
original lexeme by trusting a rounded P1 binary number. P2B owns the canonical
money helper: until its accepted handoff P2A receives exact conservative costs
through an explicit validated value port, not an independent money algorithm.
Ranking uses exact rational costs; reservation uses the upward-rounded total.

On fallback, consider only the prior selected primary occurrence's explicit
same-lane/same-provider terminal fallback, rechecking all filters, zero quality
tolerance and independence. No third attempt or cross-provider/version hop.
Uncertain earlier transmission is ineligible for automatic fallback (P2B/P2C).

Decision records every candidate's bounded inputs, filter refusals, comparator
keys, chosen binding or stop, versions/digests, evidence refs and exact cost bound.
Keep ranking estimates distinct from the conservative reservation maximum.
Decision has evidenceState and explicitly lacks a signature/permit; its success
means selection under supplied evidence, not authenticated permission to run.

## Acceptance Criteria

1. Public API consumes accepted P1 validation and RCM exported facts, deterministic
   under repeated inputs; v0 tests and model selection unchanged. All recorded
   policy/evidence digests survive and no unsigned decision is a launch permit.
2. Table-driven negative tests refuse L6 before any evidence callback, unknown
   family/quality/privacy/capability/rate/budget, stale facts/availability, endpoint
   mismatch, off-pin candidate, insufficient context/budget and self/same-family
   review. Unknown evidence is not ranked last or treated as zero/false.
3. Ranking/fallback tests prove provider rules, L5 cost ordering, stable Unicode
   ties, delta-zero fallback suitability, same-provider terminal pairs and stop
   on uncertain prior attempt; no candidate or input is silently discarded.
4. Tests prove aggregate outstanding reservations reduce remaining budget, cost
   estimates cannot replace a maximum cost bound, malformed/oversized input
   refuses, and audit output cannot carry secrets or raw unbounded evidence.
5. Handoff freezes exact API/type/code names, public RCM dependency and unproven
   operational claims. Two independent reviews pass before the controller consumes it.

## Out of Scope

Authentication/key custody, budget writes, Pi launch/configuration, host inspection,
live probes, legacy selection changes, schema migration, charter edits, activation,
provider calls/spend and HRO implementation.

## Context & References

- [P2 design inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)
- [Accepted Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [PMC-P1a](PMC-P1a-provider-binding-contract.md), [PMC-P1b](PMC-P1b-provider-binding-projection.md)
- [Ratified map](../../goals/pi-model-configuration/pmc-p0-role-lane-map.md)
- [Rubric](../../goals/pi-model-configuration/pmc-p0-suitability-rubric.md)

## Allowed Files

- plugins/foreman-line/routing-policy/src/pmc-resolver.ts
- plugins/foreman-line/routing-policy/src/pmc-resolver-types.ts
- plugins/foreman-line/routing-policy/src/index.ts
- plugins/foreman-line/routing-policy/tests/pmc-resolver.test.ts
- plugins/foreman-line/routing-policy/tests/fixtures/pmc-resolver-v1.json
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2a-verification.md

## Verification Plan

PowerShell, pinned Node 24.19.0, no network install: from routing-policy run
`npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`; inspect native exit
after each. Run dispatch regression tests unchanged. Fixtures use explicit
synthetic evidence authority and can never satisfy production activation.
Verify diff allowlist, no RCM implementation changes, and no provider IO imports.
Spec-shaping validation uses `node --import <installed-tsx> <spec-linter-cli>
validate --repo-root <this-worktree> <this-spec>` with exact resolved local paths.

## Open Decisions and Stop Conditions

Draft becomes candidate-ready after accepted P1a/P1b and supported RCM interfaces
are pinned and the complete bounded request/result/refusal contract is frozen.
Unresolved names are not permission to cast or deep-import. Version authority is
already recorded by Amendment 05, so no new user authority question is needed.
P2A cannot depend on a future P2B module: its cost-value port is injected until
P2C composes the accepted ledger/money implementation. Synthetic evidence is
confined to offline conformance and cannot mint a production permit. Full HRO
live exit remains unchanged.
