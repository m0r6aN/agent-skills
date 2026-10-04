# PMC-P1 Record — Provider-Neutral Fallback Contract (2026-09-26)

**Goal slug:** `pi-model-configuration` · **Parcel:** PMC-P1 (charter *Required implementation
parcels*, Wave 1; A7 ownership split)
**Recorded:** 2026-09-26 by the PMC-P1 builder session
**Gate receipt:** coordinator decision 2026-09-26 under owner blanket authority. This record
claims no owner approval, grants no Gate 2 or Gate 3, and authorizes no provider call, spend,
credential access, merge, or activation.
**Baseline:** second-writer rule (`rcm-sequencing-decision-2026-09-26.md` § 2.5) — PMC-P1 is
the **first writer** of Window P. Baseline `routing-policy` suite: **70 passing**, typecheck
clean, lint clean (recorded before any edit). RCM-P1's frozen additive-only footprint
(`37cbb5c..7faa46a`) is untouched.

## 1. What landed (and where)

Window-P P1 bounded write set (sequencing decision § 2.1), plus the schema typed sources the
A7 "schemas" surface and the no-drift parity chain require:

| Path | Change |
|---|---|
| `routing-policy/routing-policy.yaml` | new-representation blocks appended (legacy blocks untouched) |
| `routing-policy/src/validator.ts` | contract invariants + `KNOWN_FRONTIER_BINDINGS` |
| `routing-policy/schemas/routing-policy.schema.json` | regenerated (+ the contract sub-shapes) |
| `routing-policy/schemas/lane-entry.schema.json`, `model-binding.schema.json`, `logical-candidate.schema.json`, `lane-route.schema.json` | new committed schemas |
| `routing-policy/src/types.ts`, `src/schemas.ts`, `src/testing.ts`, `src/registry.ts`, `src/index.ts` | typed sources, canonical samples, registry, exports (parity chain) |
| `routing-policy/tests/fallback-contract.test.ts` | new suite: acceptance + 24 negative controls |
| `routing-policy/tests/fixtures/reject-fallback-self-ref.yaml` | new rejecting fixture (CLI end-to-end refusal) |
| `routing-policy/tests/cli.test.ts`, `tests/parity.test.ts` | one CLI refusal test; sample/count updates |
| `docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md`, `loop-directive.md` | this record; state line |

Untouched by design: `src/pi-openrouter.ts` and `templates/**` (A7: P1 must not touch the
resolver, Pi config, or human-facing templates; sequencing § 2.1 assigns them to PMC-P2/P2-P3),
`dispatch/**` (forbidden), `routing-policy/README.md` (RCM-P1's frozen footprint), and every
other goal's files.

## 2. Charter items — evidence

1. **PMC-P1 outcome** ("explicit provider/model/fallback metadata and refusal rules; retain the
   frontier and security invariants"): the new blocks in `routing-policy.yaml` (§ 3 below) carry
   provider, model, and typed fallback metadata per route; `validator.ts` enforces the refusal
   rules; all seven pre-existing semantic invariants are unchanged and green (suite totals § 6).
2. **A5.1 logical layer** — `candidates` keyed by provider-neutral ids (`claude-opus-5-5`,
   `gpt-6-astra`, …), ten candidates for the fifteen matrix bindings.
3. **A5.2 binding layer** — provider-prefixed bindings (`opencode/...`, `openrouter/...`)
   attached to a candidate, each carrying **binding-level eligibility**: `data_classes` (R1),
   `capabilities` (R2), `context_window_tokens`/`max_output_tokens` (R4), `cost` (R5). The
   OpenRouter declarations are cross-checked against the legacy `data_classification` lists
   (`DATA_CLASS_INELIGIBLE`).
4. **A5.3 typed fallback references** — `primary`/`fallback` are `{ type: binding|candidate,
   ref }`; self-referential (`FALLBACK_SELF_REFERENCE`) and dangling (`FALLBACK_DANGLING_REFERENCE`)
   references are rejected by validator referential-integrity checks with negative controls
   (`tests/fallback-contract.test.ts`) and a CLI fixture (`tests/fixtures/reject-fallback-self-ref.yaml`,
   exit 1 on stderr `FALLBACK_SELF_REFERENCE`).
5. **A5.4 frozen role/lane/authority map** — `lane_map` encodes all six lanes of
   `pmc-p0-role-lane-map.md` (families incl. the new `classifier` family for L6, routing
   classes, authority caps, independence, human gates, A3 provider rules). The
   authority-bearing dimensions are **pinned in the validator** (role family, frontier-only
   flags, provider-rule kinds and residuals, δ_L slot, L6 pins): redefining them costs a
   reviewed code change, never a policy-file edit (`ROLE_LANE_MAP_VIOLATION`,
   `RESIDUAL_FABRICATED_REFUSED` negatives).
6. **A5.5 migration by deprecation window** — `compatibility` block: new representation
   version 1, legacy `model_tiers` / `roles` / `data_classification.eligible_models`
   (`openrouter-slug-only`) marked `deprecated`, removal `serialized_into: PMC-P4`. A
   legacy-only document stays valid (negative-control test `a legacy-only document stays valid
   through the deprecation window`); the five new blocks stand or fall together
   (`REPRESENTATION_INCOMPLETE_REFUSED`). Consumer inventory in § 5.
7. **A3 eligibility/ranking fields + evidence threshold** — `ranking_contract` encodes R1–R7,
   the eligibility filters (R1–R4, R6), R5 as the L5 budget ordering key, R7 as the quality
   ordering key, the stable order, the evidence threshold (`on_unknown: refuse` — unrankable
   is never ranked last, unknown is never "comparable"), and the three A6 attested states.
   `RANKING_CONTRACT_VIOLATION` refuses drift. Route-level `comparability` encodes rubric § 1
   "comparable or higher"; it may not be claimed while inputs (incl. δ_L) are unproven
   (`FALLBACK_SUITABILITY_UNPROVEN`).
8. **A7 frontier registry change (incl. Claude Opus 5.5)** — `KNOWN_FRONTIER_MODELS` already
   carried `anthropic/claude-opus-5.5` (verified on disk; pinned by test, along with rejection
   of the superseded `anthropic/claude-opus-5`). The new binding-level reviewed constant
   `KNOWN_FRONTIER_BINDINGS` pins the Amendment 03 identities in **both spellings**
   (`opencode/claude-opus-5-5`, `openrouter/anthropic/claude-opus-5.5`) and anchors the
   frontier-only lanes (`UNSUPPORTED_MODEL_REFUSED`).
9. **M2 / Jev reconciliation** (sequencing decision § 3.3, settled to PMC-P1's own files) —
   `lane_map.L6` is `disabled-refused` with `re_enablement: ratified-amendment-required` and
   the rubric § 5 rule-2 candidate list `[opencode/qwen3.8-flash, opencode/glm-5.3-flash]`;
   no route may reference L6 (`LANE_DISABLED_REFUSED`); a test asserts the policy file encodes
   no `typesafe/jev` identity. (Precision note, `pmc-p0-capability-baseline.md` § 5: the YAML
   never encoded Jev — the encodings lived in P2's `pi-openrouter.ts`, its tests, and the
   templates, whose pre-existing user diffs already retire them and are preserved here.)
10. **Rubric § 7 refusal vocabulary** — encoded in `src/types.ts` as `RESOLVER_REFUSALS` (28
    names), `RESOLVER_HOLDS` (1), `CONTRACT_REFUSALS` (15 static names), `CONTRACT_RESIDUALS`
    (5), pinned by tests; every residual name used in a document must come from this
    vocabulary (`RESIDUAL_FABRICATED_REFUSED`).
11. **Exit criterion 4, static part** — negative controls: missing fallback (structural),
    self-referential and dangling fallback, unapproved provider (structural enum, on routes and
    bindings), unsupported model (id/provider/model coherence; non-frontier binding in a
    frontier lane), fallback data/tool/budget policy violations
    (`FALLBACK_DATA_POLICY_VIOLATION`, `FALLBACK_TOOL_REQUIREMENT_VIOLATION`,
    `FALLBACK_BUDGET_POLICY_VIOLATION`), and control-plane routes
    (`CONTROL_PLANE_ROUTE_REFUSED`). The resolver-side rejections remain PMC-P2 work.

## 3. The encoded representation (map to the YAML)

- `compatibility` — compatibility versioning (A5.5).
- `ranking_contract` — R1–R7 fields + evidence threshold (A3).
- `lane_map` — the frozen six-lane map (A5.4), incl. L6 `disabled-refused` (M2).
- `candidates` — logical candidates + bindings with binding-level eligibility (A5.1–A5.2).
- `lane_routes` — ten matrix routes (L1–L5 × both providers), exactly one typed fallback each
  (D3: provider-local; cross-provider failover is a new recorded attempt, never a fallback).

Evidence envelopes are uniform: `{ state: declared, value, source }` or
`{ state: unknown|unverified|unproven, residual: <named> }`. No field asserts anything its
named source does not establish (A6 discipline).

## 4. Residuals preserved — fail closed, never fabricated

| Residual | Where | Disposition |
|---|---|---|
| `L1_PINNED_PROVIDER_UNSET`, `L2_PINNED_PROVIDER_UNSET` | `lane_map.L1/L2.provider_rule` | a54 disposition 2: slot frozen, value unset; unset pin is a stop receipt |
| `L3_PROVIDER_PREFERENCE_UNSET`, `L4_PROVIDER_PREFERENCE_UNSET` | `lane_map.L3/L4.provider_rule` | a54 disposition 3 (L3 extension ratified as declaration obligation only) |
| `DELTA_L_UNSET` | every lane's `quality_tolerance` | a54 disposition 5 |
| `AVAILABILITY_UNVERIFIED`, `QUALITY_UNRECORDED` | all 15 bindings (H-LIVE, H-QUAL) | A6 `live-availability` / `model-quality` — no value claimed |
| `CAPABILITY` states `unverified` | tool-use, structured-output, all 15 (H-TOOLS, H-SO) | A6 / PMC-P2 preflight |
| `DATA_CLASS_UNKNOWN` | the 8 `opencode` bindings (R1) | no in-repo source of truth; the transport vocabulary is OpenRouter-specific |
| `CONTEXT_UNKNOWN`, `COST_UNKNOWN` | bindings 1, 7, 10 (H-OPUS, H-B7) | `pmc-p0-capability-baseline.md` AC5 records them unknown |
| routing-class ceilings for `review/security`, `implementation/complex`, `routing/classification` | `lane_map` routing classes | **no ratified `ceiling_usd` exists for these classes anywhere; none is invented here** — R5 for those lanes fail-closes at resolve time until an owner value lands |

Values that ARE declared are transcribed from `pmc-p0-capability-baseline.md` (AC2 identity
incl. the H-OPUS / H-B7 holds, AC5 context/cost facts, § 3 endpoint divergences SCF-1/2/3 as
`endpoint.alignment: divergent` + `ENDPOINT_DIVERGENCE_REFUSED`), or from the policy's own
legacy lists (`data_classes` for OpenRouter bindings). SCF-3's `pi-openrouter.ts` `const`
observation is P2's file and is untouched here (reported residual).

## 5. Migration inventory (A5.5: policy, evaluator, template, session consumers)

Legacy representation (`model_tiers`, `roles`, `data_classification.eligible_models`,
OpenRouter-slug-only) is what these consumers read today; the new representation's first
consumer will be the PMC-P2 resolver. Legacy removal is serialized into PMC-P4 behind a named
cutover condition.

- **Policy:** `routing-policy/routing-policy.yaml` (dual representation now); template copy
  `templates/foreman-routing-policy.yaml` (**excluded file — another workstream owns it;
  inventoried only, never edited**).
- **Evaluator (forbidden surface — inventoried only):** `dispatch/src/routing-eval/index.ts`,
  `dispatch/src/routing-eval/shadow.ts` (the `dispatch/src/routing-eval` selection walk the
  policy's `ORDER IS THE SELECTION RULE` comment names), plus `dispatch/tests/*`.
- **Templates:** `templates/pi-openrouter-routing.json` (P2/P3 canon; pre-existing user diff
  preserved byte-for-byte), `templates/foreman-config.yaml`, `templates/AGENTS.md`,
  `templates/STANDING-CONSTRAINTS.md`, `templates/spec-index.md`,
  `templates/foreman-skill-injection.yaml` (**excluded six-file list — inventoried only**).
- **Session / consumer modules (grep inventory of `routing-policy|validatePolicy|
  KNOWN_FRONTIER_MODELS|model_tiers` references):** `role-authority/src/roles.ts`,
  `role-authority/src/data-classification.ts`, `worker-envelopes/src/routing.ts`,
  `worker-envelopes/src/result-envelope.ts`, `ops-console/src/routing.ts`,
  `ops-console/src/config.ts`, `approval/src/cli.ts`, `approval/src/index.ts`,
  `contract-readers/src/registry-data.ts`, `hooks/model-gate.policy.json`,
  `skill-injection/src/cli.ts`, `spec-linter/src/grandfather.ts`,
  `verification/src/d19-audit.ts`, `verification/src/ratified-packages.ts`,
  `project-scaffold/src/manifest.ts`, `permission-profiles/README.md`, and the docs/kickstarters
  that quote the policy vocabulary.
- **Migration status:** none of these consumers is migrated by P1 (A7: P1 ships the
  representation, P2 consumes it); the legacy blocks remain valid and authoritative for them
  until PMC-P4's named cutover.

## 6. Verification

- Baseline (pre-edit): `npm test` **70 pass / 0 fail**, `npm run typecheck` clean,
  `npm run lint` clean (17 files).
- Final: `npm test` **116 pass / 0 fail** (+46: 37 `fallback-contract`, 1 CLI refusal, 8
  parity no-drift/sample tests for the 4 new schema files), `npm run typecheck` clean,
  `npm run lint` clean (18 files). Single combined run recorded 2026-09-26 under Node v24.7.0.
- Negative controls prove every refusal path (24 contract negatives + 3 structural + fixture/
  CLI end-to-end); the shipped document validates with zero errors; the legacy-only document
  validates unchanged.

## 7. Pre-existing user diffs — preserved

These five files carried uncommitted user-owned modifications before this work and are
byte-identical after it (MD5, before → after):

| File | MD5 |
|---|---|
| `routing-policy/schemas/pi-openrouter-routing.schema.json` | `59ec5c88fbe1758fc9102901dec32fd4` (unchanged; the regenerated file reproduces the user's typed-source output exactly) |
| `routing-policy/src/pi-openrouter.ts` | `74d62966c1eaf4974198770892cd2a03` (unchanged) |
| `routing-policy/tests/pi-openrouter.test.ts` | `6f7da0c14b7242ee91e49b03249948ce` (unchanged) |
| `routing-policy/tests/semantic-invariants.test.ts` | `b97e732dc7082fce3a2bc64ece9dde0b` (unchanged) |
| `templates/pi-openrouter-routing.json` | `fcfbca35f81e0963b01c9c46a14a9b4e` (unchanged) |

**Concurrent `templates/` observation (reported, per coordinator instruction, not
overwritten):** during this session, modifications appeared under `templates/` on exactly the
six excluded files the coordinator assigned to another workstream
(`foreman-config.yaml`, `AGENTS.md`, `STANDING-CONSTRAINTS.md`, `foreman-routing-policy.yaml`,
`foreman-skill-injection.yaml`, `spec-index.md` — the last three new/untracked). No P1 step
reads or writes them; nothing was overwritten.

**BoundaryItems34 canary note (2026-09-26):** the contract-readers `tests/touch-set.test.ts`
staging canary reports `routing-policy/src/{schemas,testing,types}.ts` among undeclared `src/`
files (alongside ops-console/project-scaffold in-flight files). For the deferred item-7 gate
adjudication: those three files are inside this record's write set (§ 1 — the schema typed
sources required by the A7 "schemas" surface and the no-drift parity chain) and inside Window
P's PMC-side write set (`rcm-sequencing-decision-2026-09-26.md` § 1–2, charter A7); no other
`src/` file was created or renamed here.

## 8. Boundaries

No Gate 2, Gate 3, merge, release, activation, provider call, spend, or credential access is
granted or claimed. The work is on the shared working tree, uncommitted (no git command was
run against the tree's state). Resolve-time L1/L2/L4 declarations and δ_L values remain
unassigned residuals for PMC-P2 (fail closed); external Pi-host settings and enablement remain
PMC-P2/M4. Authority invariants A1/A2/A4 are unweakened.
