# RCM-P2 scope reconciliation — 2026-09-27

**Goal:** `routing-currency-and-merit` · **Parcel:** RCM-P2 (with the charter-defined policy-schema
and resolver items the assignment names) · **Recorded:** 2026-09-27 by the RCM Window-R builder
(`RcmP2`), before any code change.
**Authority:** coordinator decision 2026-09-27 under owner blanket authority grants the exact
Gate 2 for RCM-P2 as scoped by the charter (`docs/goals/routing-currency-and-merit/charter.md`,
Wave 1 table + D1–D14). The scope extension in §3 is authorized by the coordinator decision of
2026-09-27 recorded to this builder ("`spec-linter/**`, `foreman-config/**`, and
`docs/SPEC-CONVENTION.md` are yours for this run — no other live slice owns them, so single-writer
discipline holds"). Gate receipts are coordinator decision receipts, never fabricated human
approvals.

## 1. Why this record exists

The charter's RCM-P2 row was drafted 2026-09-20, before PMC-P1/PMC-P2 existed. Those parcels have
since landed the provider-neutral fallback contract (`candidates`/`lane_routes`/`lane_map`),
`src/validator.ts` referential-integrity invariants, `src/pi-resolver.ts` (R1–R7 rubric evaluation,
signed route receipts), `src/pi-openrouter.ts`, and the launch boundary (`pmc-p1-fallback-contract-2026-09-26.md`,
`pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md`; Window P released by
`../pi-model-configuration/pmc-wave1-release-2026-09-27.md`). The charter's RCM-P2/P3/P4 wording
predates those surfaces. This record fixes the remaining-work interpretation so this run **extends
what PMC built and never re-implements it**.

## 2. Charter item → shipped-PMC collision map

| Charter item (verbatim intent) | Already shipped by PMC (do not duplicate) | Remaining work interpreted for this run |
|---|---|---|
| RCM-P2: "SPEC-CONVENTION §4 amendment for `expertise:`, `inputs:`, `min_context:`, `thinking_level:` under the §4.6 additive pattern, plus spec-linter support and the `foreman-config` expertise vocabulary" | Nothing of it: `grep` over the plugin finds none of the four fields in any schema, type, or validator (only charter/record prose). The `involves:` precedent (P1a) is the additive-pattern template to follow | **In scope, full:** the §4 amendment, spec-linter schema/type/validate support, and the closed `foreman-config` expertise vocabulary (OQ1's eight ratified values) |
| RCM-P3: "routing-policy.yaml schema v0.4: per-entry capability predicates and an expertise-binding block. Validator invariants extended — monotonic classification narrowing preserved, tier order preserved, closed vocabulary enforced, every declared capability machine-checked against the projector from RCM-P1" | PMC-P1 shipped schema v0.3→`provider-neutral-fallback-contract` v1 (`candidates`, `lane_routes`, `lane_map`, `ranking_contract`, Evidence envelopes) and validator invariants incl. monotonic classification narrowing and fallback referential integrity | **Extend, not rebuild:** add per-binding capability-predicate fields (`inputs`, `thinking_levels`) and an `expertise_bindings` block to the *existing* typed model + hand-authored schemas + validator; keep every existing invariant green. The "machine-checked against the projector from RCM-P1" invariant is **deferred** — see §4(a) |
| RCM-P4: "Resolver predicate evaluation at dispatch, in D4's fixed order… negative controls: image-bearing boilerplate must not select Nemotron (F1/F2); unsatisfiable requirements refuse, never downgrade; an internal parcel never reaches a model outside its classification set; expertise and shadow semantics preserve tier order and refusal behavior" | PMC-P2 shipped `resolveRoute` with the A3 rubric R1–R7 evaluation, frozen per-lane provider rules, typed fallback resolution, and signed receipts. It has **no** input-modality, thinking-level, min-context-frontmatter, or expertise predicate evaluation | **Extend, not rebuild:** the four D7/D8 predicates evaluate inside the existing R1–R7 machinery — classification (R1) first, capability (R2) second, tier/route order preserved; typed refusals name the failing predicate; expertise narrows only, never reorders. Negative controls as tests |
| RCM-P2A-class gap DA-1 (`pmc-p2-review-a-findings.md` §D.3/DA-1): resolve-time mirror of `FALLBACK_SELF_REFERENCE` | The validator rejects self-referential fallback pairs statically (`validator.ts:753–755`); `pi-resolver.ts` `resolveRouteRef` mirrors dangling/provider refusals but not the self-reference | **In scope** (the assignment names it; it is resolver work in this run's charter area): mirror `FALLBACK_SELF_REFERENCE` at resolve time with one negative control |

## 3. Write set and the Window-R boundary

Per `../pi-model-configuration/rcm-sequencing-decision-2026-09-26.md` §2–§3 and the Window-P
release record, Window R owns `routing-policy/**` and `dispatch/**`; the second-writer rule
(rebase + full-suite re-run) applies and this run satisfies it by running the full
`routing-policy` suite (baseline 156/0 per the release record; 175/0 observed on the current
tree before this run's edits — the tree carries user-owned changes; both numbers reported).

The charter's RCM-P2 is *defined* in three files outside that enumeration
(`docs/SPEC-CONVENTION.md`, `spec-linter/**`, `foreman-config/**`). Resolution, recorded here
rather than assumed:

- The boundary slice (`BoundaryItems56`) confirmed in writing it claims none of
  `spec-linter/**`, `foreman-config/**`, `docs/SPEC-CONVENTION.md` and will not touch them.
- The coordinator approved this run's write set extension to exactly those three surfaces
  (2026-09-27, quoted in the header), with hard bounds: `templates/**` (incl. the six
  scaffolder-owned files), `hooks/**`, `.claude-plugin/**`, `.codex-plugin/**`,
  `docs/goals/foreman-line-boundary-routing/`, `ops-console/**`, `project-scaffold/**` are not
  this run's and remain untouched.
- This run's full write set: `routing-policy/**`, `dispatch/**` (see §4(e) — unchanged),
  `docs/goals/routing-currency-and-merit/` records, `docs/SPEC-CONVENTION.md`, `spec-linter/**`,
  `foreman-config/**`.

## 4. Deferrals, with exact reasons

**(a) Capability facts machine-checked against the RCM-P1 projector — DEFERRED.** The projector
(`routing-policy/src/catalog-snapshot.ts`, `src/eligibility.ts` per RCM-P1's additive footprint in
the sequencing decision §4) is **not in this tree**: RCM-P1 sits on branch `codex/rcm-p1-builder`
at `7faa46a`, awaiting its human Gate 3 merge. Machine-checking declared capability predicates
against a projector that does not exist here would either duplicate RCM-P1 (forbidden: "extend/
complete, never duplicate") or fabricate evidence. The validator instead enforces what is
machine-checkable in-tree: closed vocabularies, envelope shapes, and referential integrity. The
projector cross-check is RCM-P5's snapshot-bound preflight work (D11) once RCM-P1 merges.

**(b) Populating `inputs`/`thinking_levels` facts on the 15 shipped bindings — DEFERRED to the
governed refresh (RCM-P5/P6).** The only in-repo fact source is
`host-owner-export/catalog-projection.json` (RCM-P0 evidence, digest-pinned, and ruled "design
input only, not live routing authority" with a 24-hour freshness bound). Its provider keys are
anonymized (`0`–`12`) and its model ids do not match the policy's binding ids literally
(`claude-opus-5-5` has zero catalog matches; `qwen3.8-flash` is already `AC2A_ZERO_MATCH`;
`nvidia/nemotron-3.5-lightning` vs catalog `nvidia/nemotron-3.5-lightning-30b-a3b` is the F5 class
of divergence). Transcribing facts across those namespaces by hand is exactly the aliasing the
2026-09-22 ruling forbids ("endpoint mismatches refuse; no aliasing or path normalization") and
exactly what RCM-P1's reader/projector owns. Per the a54 discipline the shipped bindings keep
their facts **typed-unavailable** (field omitted = unknown, a named refusal at resolve time),
never a guessed value.

**(c) RCM-P4A actual dispatch integration (`dispatch/**`) — NOT this parcel.** The charter splits
resolver predicate evaluation (RCM-P4) from "actual dispatch integration and decision receipt
contract" (RCM-P4A, a separate `architecture/risk` parcel with its own Gate 2). This run adds no
`dispatch/**` code; the Window-R write authority over `dispatch/**` is simply not exercised.

**(d) RCM-P9 expertise binding *content* — NOT this parcel.** The `expertise_bindings` block and
its resolver semantics ship now (RCM-P3/P4); actual bindings are RCM-P9's, must be
shadow/evidence-only with cited dated sources, and any promotion to default is human Gate 3 and
explicitly out of this goal. The shipped policy therefore declares `expertise_bindings: []`.

**(e) Dispatch-time price ordering vs RCM D3 — NAMED, NOT CHANGED.** The charter's D3/exit
criterion 9 forbid dispatch-time price sorting. The shipped `resolveRoute` orders rankable
candidates by projected cost (PMC's A3 rubric §4; `ranking_contract.budget_ordering_lane: L5`).
Today that sort is only *reachable* on L5 (`cheapest-eligible`, the one provider rule that
proceeds); L1–L4 fail-closed at `providerRuleGate` (unset declaration slots) and L6 refuses. The
cost ordering is PMC's ratified rubric text, not something RCM-P2 adds or may silently amend, and
none of the predicates introduced here performs or depends on a price comparison. If the owner
wants D3 enforced over the A3 rubric for L5, that is a Gate-1 reopening of D3/A3, decided by a
human — not by this run.

## 5. Semantics fixed for this run (D7/D8/OQ1/OQ5/OQ6 as implemented)

1. **Request-side defaults (spec → effective requirement), per D8:** a spec omitting `inputs:`
   requires `text` only; a spec omitting `thinking_level:` requires the routing-class thinking
   default (OQ5: `minimal` for `boilerplate`, `low` for `standard-feature` and
   `implementation/standard`, `high` for `architecture/risk`); `min_context:` feeds the derived
   context floor (`required_context_tokens`, R4) and may only be overridden upward (shaping-side
   rule; the linter validates shape only). D8's "an image-bearing surface without explicit
   `image` refuses" is enforced at resolve time: a request whose effective `inputs` include
   `image` never selects a binding that cannot serve `image`, and a spec that needs images but
   declares `inputs: [text]` reaches only text-capable models or refuses.
2. **Model-side facts are evidence envelopes, per D2/D13/a54:** a binding declares
   `inputs`/`thinking_levels` as `Evidence` (declared-with-source, or omitted = unknown). Unknown
   refuses when the predicate is evaluated (`INPUTS_UNKNOWN`, `THINKING_LEVELS_UNKNOWN`); a
   declared set missing the requirement refuses (`INPUTS_INSUFFICIENT`,
   `THINKING_LEVEL_UNSUPPORTED`) — never a silent downgrade (D8).
3. **Vocabularies.** `inputs: {text, image}` (D8, closed). `thinking_level:` over Pi's
   `ThinkingLevel` names as evidenced by the pinned catalog projection's `thinkingLevelMap` keys
   (`off, minimal, low, medium, high, xhigh, max`) — D8 "maps to `thinkingLevelMap`". `expertise:`
   over the closed `foreman-config` vocabulary (OQ1's eight ratified values: `engineering`,
   `architecture`, `security`, `legal`, `finance`, `writing`, `research`, `data`), enum-validated
   in this run because the registry ships in this run (D7's additive pattern stage 3), never free
   text (OQ1's stop condition).
4. **Field shapes.** `expertise:` is a single optional string (one area per parcel; the merit
   corpus is keyed by one expertise per receipt, D12). `inputs:` an optional non-empty unique
   array. `min_context:` an optional positive integer (tokens). `thinking_level:` an optional
   single value. All four optional (additive pattern stage 1: legacy specs keep validating).
5. **Expertise narrowing (D3/OQ2/H):** a non-shadow `expertise_bindings` entry for
   `(routing_class, expertise)` narrows the already-eligible set to its declared refs, preserving
   route/tier order; no entry for the key means no narrowing (never invents a preference); a
   narrowed-to-empty eligible set is a typed refusal (`EXPERTISE_BINDING_UNSATISFIABLE`) and never
   falls back to the un-narrowed set. `shadow: true` entries are evidence-only and never narrow,
   never route, never become a default (RCM-P9/Gate-3 boundary preserved).

## 6. Preservation baselines

`routing-policy/src/pi-openrouter.ts` and the other four pre-existing user-diff baselines
(`schemas/pi-openrouter-routing.schema.json`, `tests/pi-openrouter.test.ts`,
`tests/semantic-invariants.test.ts`, `templates/pi-openrouter-routing.json`) stay byte-identical;
the six scaffolder-owned template files stay untouched. Any deviation would be reported with
justification — none is expected or made.

## 7. Implementation resolutions (2026-09-27, during the run)

Recorded here rather than silently decided in code:

1. **Schema version label.** The spec-linter's v0.3 is the `verification_class` era
   (`grandfather.ts`: "the pre-v0.3 done-spec corpus"). The four new fields are therefore
   **schema v0.4** (SPEC-CONVENTION §4.9). The charter's "routing-policy.yaml schema v0.4"
   names coincide but version different things.
2. **Expertise narrowing covers the whole route, not just the selected primary.** A declared
   fallback outside the non-shadow binding is narrowed out like any other binding, so RB-1's
   "declared fallback passes the same evaluation as a primary" refuses the route — a runtime
   fail-over past the expertise binding would be exactly the silent fallback D3 forbids. The
   narrowed set must therefore cover the chosen route (primary + its declared fallback).
   Negative controls: `routing-policy/tests/rcm-predicates.test.ts`.
3. **`implementation/complex` has no ratified OQ5 thinking default.** It is real shipped
   content (the L3 lane's `routing_classes`), but OQ5's ratified default table covers only the
   four spec classes. A request for a class outside that table that omits
   `required_thinking_level` **refuses** (`REPRESENTATION_INCOMPLETE_REFUSED`) — D8 permits no
   invented default. Requests for such classes declare the level explicitly. **Open item for
   the coordinator/owner:** ratify a thinking default for `implementation/complex` (and any
   future policy class) or keep explicit declarations mandatory.
4. **D9's lint refusal is structurally enforced, not scanned.** All four new fields are closed
   (enums / positive integer), so a model identity cannot enter through them. A general
   "frontmatter names a model" scan over free-text fields (`title`, `data_classification`, …)
   needs the model registry to be meaningful and is RCM-P5 work; a naive vendor/model regex
   would false-positive on paths and prose. Recorded as partial with reason, not claimed.
5. **Refusal vocabulary growth** is confined to `RESOLVER_REFUSALS` (seven new names:
   `INPUTS_UNKNOWN`, `INPUTS_INSUFFICIENT`, `THINKING_LEVELS_UNKNOWN`,
   `THINKING_LEVEL_UNSUPPORTED`, `EXPERTISE_NARROWED_OUT`, `EXPERTISE_BINDING_UNSATISFIABLE`,
   `EXPERTISE_BINDING_DANGLING_REFERENCE`); `CONTRACT_REFUSALS`/`CONTRACT_RESIDUALS` are
   unchanged. Validator-emitted names draw from `RESOLVER_REFUSALS` exactly as PMC's
   `checkBindings` already does (`DATA_CLASS_INELIGIBLE`).
6. **contract-readers touch-set canary (blast-radius check, package not touched by this
   run):** its suite runs 73/74 green with one failure in the Contract B sweep adjudication.
   The failure is **pre-existing and not caused by this run**: the surfaced-but-undeclared set
   contains `ops-console/src/{frontmatter,project,scan}.ts` and
   `project-scaffold/src/equivalent-layout.ts` (entirely untracked, never touched by this run)
   plus `dispatch/src/*`/`routing-policy/src/*` files whose `routing_class` signal content all
   predates this run (machine-checked: this run's two new `src/` files carry neither the
   Contract A nor the Contract B sweep signals). Per the coordinator, that adjudication is a
   later gates slice.
