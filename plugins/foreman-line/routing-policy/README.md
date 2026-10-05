# Foreman Line — Routing Policy Schema + Validator (W0-P3)

The policy-as-code artifact that governs model/agent-count selection at
dispatch (plan §5, D5/D6). This package ships the schema, the TypeScript type,
the concrete v0.3 `routing-policy.yaml`, and a validator. Primary-model policy
evaluation and the optional shadow-route execution boundary live in
`@foreman-line/dispatch`; this package does not perform provider transport.

## Schema shape

`RoutingPolicy` = `{ classes, data_classification, selection_order, shadow_routes, compatibility, ranking_contract, lane_map, candidates, lane_routes, expertise_bindings? }` (post-CUTOVER-P4: the five representation blocks are required; the legacy `roles`/`model_tiers`/`eligible_models` blocks are removed and refused by name).

- **`classes`** — keyed by `routing_class` value; MUST include the four
  reconciled values (`boilerplate`, `standard-feature`, `architecture/risk`,
  `implementation/standard`) but may carry additional class keys. Each entry:
  `allowlist` (tier names), `ceiling_usd` (> 0), optional `security_flavored`.
- **`data_classification`** — exactly `public` / `internal` / `restricted`,
  each a `transport_requirements` block (data-class eligibility is declared
  per binding via `data_classes`, A5.2 — the legacy `eligible_models` lists
  are removed at CUTOVER-P4)
  (`data_collection: allow|deny`, `zdr: boolean`, mirroring OpenRouter's
  `provider` request object). On a multi-provider gateway a model id does not
  determine which upstream host serves the request; these two request
  parameters do. This repository never sends requests, so the block is a
  **declared obligation on the consumer**, not an enforcement — but invariant 7
  rejects any policy that declares anything weaker than `deny` + `true` for
  non-public data. Pair it with OpenRouter's account-wide privacy settings
  (disable training providers; per-group ZDR) so the strict values are the
  default regardless of what the consumer sends.
- **`selection_order`** — the ordered selection source (C5.2; migrated at
  CUTOVER-P4 from the removed `model_tiers` block): each tier-group name used
  above maps to an ordered list of provider-neutral candidate keys, with
  referential integrity to `candidates` (dangling and self-referential entries
  are refused). A model's OpenRouter slug lives only in its binding's `model`
  field; the consumer prepends its own provider prefix at use. `'frontier'` is
  the one group name the validator's invariants depend on literally, and its
  *contents* are anchored against a validator-code registry (see
  "Frontier-tier anchoring registry" below), not left to the policy document's
  own say-so. **Every other group name (`standard`, `economy`) is policy
  content, revisable quarterly without touching the validator.** **Order
  within a group is the selection rule:** the dispatcher
  (`dispatch/src/routing-eval`) walks a class's allowlist groups in order and
  picks the first candidate eligible under the task's data classification
  (eligibility = the binding's declared `data_classes`). There is no price
  comparison at dispatch time, so cost optimization is expressed by list
  order. The shipped economy order selects Nemotron 3.5 Lightning for
  boilerplate in all three classifications, preserving each classification's
  transport requirements. Later entries are eligibility alternatives; the
  evaluator does not retry them on provider health or quota failures.
- **`shadow_routes`** — separately governed advisory sidecars, never model
  tiers. May be empty (v0.3 ships none); no particular route key is required
  by the schema. Any route declared must be public-only and candidate-only. A
  route declares its adapter, approved task types, live discovery requirement,
  zero authority, no tools/effects, and exclusion from the Coordinator and
  verifier roles. The policy neither contains credentials nor records a host's
  current availability; the host verifies availability at invocation time and
  the Parcel supplies the exact public inputs.
  `tests/fixtures/accept-shadow-route.yaml` is the canonical valid example.

## Pi/OpenRouter structured-decision registry

`templates/pi-openrouter-routing.json` is the Pi execution-plane configuration
template. Its base URL is `https://openrouter.ai/api/v1`, and its enabled list
contains the exact OpenRouter model id `typesafe/jev-1.13`. The capability
validator keeps Jev limited to `routing` and `classification` lanes with
`recommend-only` authority; it cannot be used for prose generation,
implementation, approval, merge, or policy bypass. No credential is stored in
the template.

Types live in `src/types.ts`; schemas in `schemas/*.json` (hand-authored as
`SchemaObject`, never ajv's `JSONSchemaType`); `tests/parity.test.ts` proves
the two never drift.

## The eight enforced invariants

1. **Classification gates before cost (D6):** every binding's declared
   `data_classes` set must narrow monotonically — `restricted` implies
   `internal` implies `public` (re-anchored at CUTOVER-P4; the cross-list
   form lived in the removed `eligible_models` lists).
2. **Coordinator/verifier frontier pinning (D4):** the coordinator and
   verifier lanes (`lane_map.L1`/`L2`) are frozen `frontier_only: true`
   (re-anchored at CUTOVER-P4 — the pin lived in the removed `roles` block).
   **Out of reach:** runtime distinctness — coordinator and verifier
   resolving to *separate agent instances* at dispatch — is a W2-P3/W3
   dispatch-time property; this parcel validates the tier pinning only.
3. **Security override + derived guard:** a class self-declaring
   `security_flavored: true` must have every allowlisted tier equal
   `'frontier'` (not merely contain it). Any class whose key matches
   `/security|audit/i` without the flag is rejected outright — declared +
   derived, never "somehow."
4. **Ceiling presence:** `ceiling_usd` required and `> 0`, enforced at the
   schema layer (a static bound needs no cross-field logic).
5. **Frontier-tier anchoring:** every candidate in `selection_order.frontier`
   must resolve to a `KNOWN_FRONTIER_MODELS` id through its OpenRouter binding.
   See below.
6. **Ordered-source candidates are classification-eligible:** every
   `selection_order` entry's OpenRouter binding must declare `public` in its
   `data_classes`. Because invariant 1 forces the declared sets to narrow, a
   candidate absent from `public` is dispatchable under no classification at
   all — the ordered source would be advertising a route that cannot exist,
   or one an order-only caller would take unchecked (named refusal
   `DATA_CLASS_INELIGIBLE`).
7. **Non-public transport requirements:** `internal` and `restricted` must
   declare `transport_requirements: { data_collection: deny, zdr: true }`. A
   model id names a model, not a host; on OpenRouter the same id is
   load-balanced across many providers with differing retention and training
   policies. The policy cannot send requests, but it can refuse to be the
   document that declared non-public prompts may reach a training provider.
8. **Shadow-route containment:** every shadow route is public-only, requires
   live discovery, has no authority/tools/effects, is candidate-only, and
   excludes the Coordinator and verifier. The route key must equal its adapter
   id, preventing a policy entry from silently referring to a different adapter.

## Schema v0.4 — RCM capability predicates and expertise bindings (2026-09-27)

RCM-P2/RCM-P3 (charter D7/D8, `docs/goals/routing-currency-and-merit/rcm-p2-scope-reconciliation-2026-09-27.md`):

- **Per-entry capability predicates (optional Evidence envelopes on every binding):**
  `inputs` (the modalities the binding serves — `text | image`) and `thinking_levels`
  (the Pi `ThinkingLevel` names its `thinkingLevelMap` carries — `off | minimal | low |
  medium | high | xhigh | max`). A field that is absent or typed-unavailable is **unknown**,
  never "text-only" — a model-side fact is never guessed. A declared `inputs` residual must
  come from the named contract vocabulary like every other envelope.
- **`expertise_bindings` block (optional; shipped empty):** each entry narrows the
  already-eligible set within one `(routing_class, expertise)` key — never reorders a tier,
  never crosses tiers. `shadow: true` entries are evidence-only (RCM-P9) and never narrow.
  Validator: every ref must resolve (`EXPERTISE_BINDING_DANGLING_REFERENCE`); two non-shadow
  entries may not share a key (`REPRESENTATION_INCOMPLETE_REFUSED`).
- **Resolver predicates (D4 fixed order: classification → capability → tier order):** the
  effective requirements are `required_inputs` (default `['text']`) and
  `required_thinking_level` (default the routing-class thinking default, OQ5 — a class with
  no ratified default refuses unless the request declares one). Refusals name the failing
  predicate: `INPUTS_UNKNOWN` / `INPUTS_INSUFFICIENT`, `THINKING_LEVELS_UNKNOWN` /
  `THINKING_LEVEL_UNSUPPORTED`. Expertise narrowing records `EXPERTISE_NARROWED_OUT` per
  narrowed-out binding and stops with `EXPERTISE_BINDING_UNSATISFIABLE` when the binding
  narrows the eligible set to nothing — never a silent fallback to the un-narrowed set. The
  narrowed set must cover the chosen route (primary and its declared fallback).

## Shadow routes (execution boundary)

A shadow route is an optional public-analysis sidecar. The shipped v0.3 policy
declares none: the former `cerebras-shadow` entry never had an adapter,
credential, or production caller behind it, and on OpenRouter fast inference
(Cerebras, Groq) is a provider preference on an existing model id under the
same credential — nothing is left for a separate adapter to add. The execution
boundary below is retained so a route can still be declared later as a policy
entry plus a host-local adapter, without a schema change.

The executable entry
point is `executeShadowRoute` from `@foreman-line/dispatch`. Before discovery,
it requires a public Parcel authorization reference, a policy- and
Parcel-allowed task type, and a SHA-256 binding to the exact canonical JSON
input (`hashShadowPublicInput`). It also requires an independent reviewer
identity distinct from the adapter.

Caller-constructed authorization fields are claims, not authority. The caller
must inject a trusted host-local `resolveParcelAuthorization(authorizationRef)`
boundary. It must return exactly `parcelId`, `dataClassification`,
`allowedTaskTypes`, and `publicInputSha256`; dispatch independently validates
that record and requires it to match every request claim and the actual input
digest. A missing, throwing, malformed, non-public, or mismatched resolver
fails closed before discovery without persisting raw resolver details.

Canonical public input must be dense JSON and is capped at 65,536 UTF-8 bytes.
Sparse arrays, cycles, non-finite numbers, non-plain/accessor-bearing objects,
and non-JSON values are rejected. Authorization references are capped at 512
bytes, reviewer identities at 256 bytes, Parcel identities at 128 bytes, and
allowed-task lists at 16 unique values of at most 128 bytes each.
Dispatch canonicalizes, hashes, parses into a deep clone, and recursively
freezes this input before its first asynchronous dependency call. Authorization,
discovery, or caller-side mutation therefore cannot change the exact snapshot
later supplied to the adapter.
The same pre-await snapshot freezes `workflowId`, route/task selection, every
Parcel claim field and a copied allowed-task list, authorization reference, and
independent reviewer. Authorization comparison, policy resolution, discovery,
invocation, receipts, and review binding use only that snapshot. The three
dependency function references are also captured before awaiting resolution,
so an async closure cannot replace discovery or invocation mid-flight.

The caller also injects host-local `discoverAdapter` and `invokeAdapter`
functions; the repository provides no provider credential or network
implementation.
Discovery runs on every invocation. Only the exact normalized object
`{ status: 'verified_available' }` permits provider execution. Any exception,
unavailable result, or malformed/extended discovery value writes a normalized
skip receipt and proceeds without the shadow provider.

The frozen invocation request is fixed to a runtime-frozen empty tools array,
no effect capability, no authority, and candidate-only use. Untrusted output must have exactly a
non-empty `candidate` string and a non-empty-string `evidence_refs` array;
candidate text is capped at 32,768 UTF-8 bytes, with at most 64 evidence
references of at most 2,048 bytes each. Sparse/extended arrays and additional
authority/gate fields are rejected before receipt creation. An accepted result has fixed
`gateImpact: 'none'`, `approvalImpact: 'none'`, and
`reviewImpact: 'pending_independent_review'`. The receipt binds the candidate
digest to that pending reviewer but deliberately does not store raw candidate,
probe, or provider-failure content. A candidate never counts as the independent
review itself. Accepted evidence references are defensively copied and frozen;
candidate and skip results, their no-tools arrays, and the independent-review
binding are runtime-frozen so later mutation cannot create digest/receipt drift.

Do not add provider API keys, provider requests, probe outcomes, or other
availability state to this policy file. Actual adapter discovery and provider
transport remain host/operator-owned integration work.

## Frontier-tier anchoring registry

Invariants 2 and 3 pin the coordinator/verifier lanes and security-flavored
classes to the tier *name* `'frontier'` — but nothing about tier names
constrains which candidates actually populate `selection_order.frontier`
inside the policy document itself. A policy document is mutable data under
validation; letting it
define its own notion of "frontier" would mean it could satisfy every other
invariant while quietly redefining frontier to point at a cheaper model,
silently gutting D4's pinning and the §5 security hard-override in one edit.

`src/validator.ts` therefore carries `KNOWN_FRONTIER_MODELS` — v0.3
(September 2026, OpenRouter slugs):
`['anthropic/claude-opus-5.5', 'anthropic/claude-fable-5.1', 'openai/gpt-6-astra', 'openai/gpt-5.6-sol', 'openai/gpt-5.5', 'google/gemini-3.1-pro-preview']`
(`openai/gpt-6-astra` added by SUPERCHARGE-P1, verified 2026-09-14)
— as a constant in reviewed, tested code, not as policy content. Invariant 5
rejects any `selection_order.frontier` entry that resolves outside this
registry. This is
intentional friction: redefining what counts as frontier (the quarterly model
revisit plan §5 anticipates) requires a code change with a test, never a
one-line policy-file edit.

Registry rules of thumb: ids are OpenRouter slugs verbatim (`vendor/model`;
Anthropic ids use dots there — `anthropic/claude-fable-5.1` — the opposite of
OpenCode Zen's dashes; Gemini 3.1 Pro exists only as `-preview`); free,
`:free`, and contributor-tier models are never frontier because they may train
on submitted data or be rate-capped, and the coordinator and verifier see
everything; and `*-pro` tiers priced at $30/$180 per 1M tokens are excluded
because they exhaust a $25 class ceiling in a single turn.

## Exit-code contract

| Code | Meaning |
|---|---|
| `0` | Valid |
| `1` | Schema or semantic-invariant violation — every violation on stderr, not just the first |
| `2` | Usage error — missing/unreadable path, bad invocation |

Mirrors pcc's contract *style* (same meaning for 0/1/2); it does not claim
parity with pcc's additional `3`/`4` codes, which this validator has no use
for. No CI workflow wiring — that's W4.

## Usage

```bash
npx tsx src/cli.ts validate routing-policy.yaml
```

## Runtime dependencies

Exactly two: `ajv` (validation engine) and `yaml` (policy parsing), both
machine-enforced by `tests/dependency-allowlist.test.ts`.
