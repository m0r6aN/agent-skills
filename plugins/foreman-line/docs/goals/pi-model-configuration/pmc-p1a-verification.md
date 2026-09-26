# PMC-P1a static contract verification and handoff

Status: builder verification complete; independent acceptance pending. This is
static-conformance evidence only, never a route, activation or goal-completion receipt.

## Pinned execution contract

- Worktree: `D:/Repos/agent-skills-worktrees/hro-pmc-p1a-20260926`.
- Branch: `codex/hro-pmc-p1a-20260926`.
- Base: `ad878b310763609205a0e80ed631c0da76e1e833`; clean checkout verified before edits.
- Active PMC-P1a spec blob: `0a6eab879a9a13fcca2e402e3e4ff33e39a75a8b`.
- Coordinator released Step 0 after RCM-P1 PR51 merged as
  `700beba5e6387a9471ecea7a8757b226930ba925`; this base carries the identical reviewed
  RCM integration source. Shared-file order: PMC-P1a, accepted handoff, later RCM wrapper.
- Node `v24.19.0`, local PATH only. Existing lockfiles installed with
  `npm.cmd ci --ignore-scripts --no-audit --no-fund --offline`. No dependency changes.
- Root/plugin AGENTS, standing constraints, active spec, PMC charter/amendments,
  PMC-P0 ratified role map, suitability rubric and capability/verification evidence,
  and accepted design D1–D5 govern. No fresh host inspection or provider call.

## Public contract

The public routing-policy barrel exports `validateProviderBindingPolicyV1`,
`providerBindingPolicyV1Schema`, `PMC_LANE_POLICIES_V1`, `ProviderBindingPolicyV1`,
supporting readonly types, and the typed error/result vocabulary. The policy version
is `pmc-provider-binding-policy/v1`; compatibility is `additive-v0-preserved`.
Committed schema: `routing-policy/schemas/provider-binding-policy-v1.schema.json`.

Validation returns an owned, recursively frozen policy without reordering,
discarding declarations, filling unknown facts, or changing references/provenance.
Caller accessors, iterators and toJSON are never invoked. Descriptor snapshot bounds
apply before schema validation; schema validation rejects unknown keys and fails
fast. Semantic diagnostics are capped at 128, ending with `ERRORS_TRUNCATED` when
additional errors exist. Third-party validation failures are typed refusals.

The schema freezes lane declarations against reviewed code constants. Authority
enum meanings are documented alongside those constants: no approval/merge/release/
policy bypass, no self-review, and the specific coordinator/verifier/economy/
classifier prohibitions. Human gates remain explicit. Unknown family is never
proof of independence. New class budgets remain `unresolved-non-dispatching`.

Primary fallback links are terminal, same-lane, same-provider occurrence pairs.
L1/L2 reversed pairs are preserved. Off-pin declarations remain historical and
nonselectable under the frozen provider rule. Held identity refusals cannot be
represented as enablement, availability or data eligibility. L6 remains disabled,
with only its two historical OpenCode declarations and no Jev substitution.

The fixture has fifteen explicitly supplied binding identities, six lanes and
twenty-two occurrences. Its recorded capability fields were transcribed from
PMC-P0's committed verification/baseline, not read from a live catalogue. Families
remain unknown; separate logical IDs avoid inventing cross-provider family aliases.
Bindings 1/10 remain owner-attested with unknown protocol/capabilities. Binding 7
preserves `AC2A_ZERO_MATCH`, `AC2A_WRONG_PROVIDER`, `AC2A_PREFIX_ALIAS_REFUSED` distinctly.
SCF-1/2/3 preserve literal catalogue endpoint/protocol observations; settings/legacy
endpoint divergence never becomes `AC2A_URL_MISMATCH`.

## Verification

Initial RED: the focused test failed with `ERR_MODULE_NOT_FOUND` before either new
module existed. First GREEN exercised malformed and hostile input; subsequent
increments added canonical, reference, lane, evidence, bounds and public-API tests.
An initial duplicate-candidate test hit schema `uniqueItems` before the intended
semantic check; differing observation text now isolates duplicate-ID validation.

- V1 tests: **70 passed** in the final full suite. The PMC-P1a repair adds
  permanent 65,535/65,536/65,537 array-boundary and insertion-order regressions;
  arrays containing 65,535 elements consume 65,536 visited values including the
  root and reach schema validation; arrays containing 65,536 or 65,537 elements
  exceed the traversal bound. Independent schema-valid policy probes additionally
  prove inclusive acceptance at 65,536 visits in either property order and refusal
  at 65,537. Local canon review added an
  explicit failing test for L2 coordinator acceptance; the corrected constant,
  fixture and schema preserve that ratified gate. Additional hostile proxies prove
  no caller graph reread and root cardinality rejection before child access.
- Full routing-policy suite: **471 passed**, including RCM, v0 and new schema parity.
- `generate`: **8 schemas generated**; all seven pre-existing schema files byte-identical
  against the pinned base (parcel-time Git diff, not a permanent byte-pin test).
- Typecheck initially exposed absent local `schema-scaffold` Ajv installation;
  the unchanged sibling package installation is the environment correction.
- Final routing-policy typecheck and lint: **passed** (lint retains one existing,
  informational `useLiteralKeys` diagnostic in RCM's catalog-snapshot test).
- Unchanged spec-linter suite: **126 passed**.
- Initial dispatch runs found absent/incomplete local Ajv installations in unchanged
  shaping/projection dependencies; sibling installation corrected the environment.
- Final unchanged dispatch suite: **126 passed**, zero skipped/failed.
- Final allowed-file guard: **exactly nine allowed paths**; `git diff --check` passed.
  RCM internals and the complete dispatch/spec-linter packages are unchanged.

Reproduction from each named package with the pinned Node directory on PATH:
`npm.cmd run typecheck`, `npm.cmd run generate` (routing-policy), `npm.cmd test`,
`npm.cmd run lint`. Dispatch and spec-linter tests remain unchanged.

Allowed-file review permits only the nine active-spec paths. Legacy exports remain
present; no RCM internal imports, runtime launch/ranking/resolver, host/configuration
mutation or new package dependencies are introduced. Existing
`KNOWN_FRONTIER_MODELS`, policy lists and dispatch expectations already contain
`anthropic/claude-opus-5.5`; they are unchanged.

## Unproven claims and next owners

- All fifteen bindings: live availability/reachability, lane quality, tool use and
  structured output remain unproven; baseline availability and quality are unknown.
- OpenCode privacy/data eligibility and upstream honoring of transport settings are
  unproven. Policy requirements are declarations, not provider attestations.
- Families are unknown; no declaration proves runtime reviewer independence.
- Binding 7 remains held. Bindings 1/10 attest identity only, not capability.
- Baseline records all fifteen disabled. No host setting/default is changed.
- Freshness is not accepted. Source hash names evidence bytes, not an authenticated
  attestation or a recursive object certificate. Recorded evidence fields remain
  representable claims whose authenticity this pure validator cannot establish.
- SCF-1/2/3, Pi thinking/configuration semantics, launch receipts and approved budgets
  for new classes belong to PMC-P2. **Before any activation, P2 must refuse disabled
  L6 through both legacy and v1 launch paths**; P3/P4 cannot postpone that obligation.
- PMC-P1b consumes this validator unchanged for its lossless evidence-only wrapper
  and owns consumer inventory closure. There is no projection in P1a.
- Two independent implementation reviews and coordinator acceptance remain required.

Rollback: revert only this parcel's additive modules/schema/fixture, barrel/registry/
parity additions and handoff; preserve RCM and all legacy consumers.
