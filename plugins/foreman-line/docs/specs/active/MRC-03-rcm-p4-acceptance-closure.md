---
ticket: MRC-03
title: RCM-P4 acceptance closure — named negative controls + DA-1 resolve-time FALLBACK_SELF_REFERENCE mirror over the Window-R predicate implementation
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/tests/rcm-predicates.test.ts
  - plugins/foreman-line/routing-policy/tests/pi-fixtures.ts
routing_class: architecture/risk
verification_class: equivalence-provable
---

# MRC-03 — RCM-P4 acceptance closure: named negative controls + DA-1 resolve-time mirror over the Window-R predicate implementation

## Goal

Close the `routing-currency-and-merit` charter's **RCM-P4** row (`docs/goals/routing-currency-and-merit/charter.md:226`) — *"Resolver predicate evaluation at dispatch, in D4's fixed order. **Negative controls are the acceptance evidence**: image-bearing `boilerplate` parcels must not select Nemotron (F1/F2); unsatisfiable requirements refuse, never downgrade; an `internal` parcel never reaches a model outside its classification set; expertise and shadow semantics preserve tier order and refusal behavior."* — as **acceptance evidence over the already-shipped Window-R predicate implementation**, exactly per the report §7 MRC-03 row (`docs/goals/goal-status-report-2026-09-27.md:104`): *"Predicate evaluation already landed in Window R (`rcm-p2-scope-reconciliation-2026-09-27.md` §2/§5: extend-not-rebuild); this task is the charter's acceptance evidence, not a rebuild. End-to-end controls close with MRC-05."*

This is **not** a rebuild and **not** a feature parcel. The Window-R interpretation record fixed the shape (`docs/goals/routing-currency-and-merit/rcm-p2-scope-reconciliation-2026-09-27.md:31`): *"**Extend, not rebuild:** the four D7/D8 predicates evaluate inside the existing R1–R7 machinery — classification (R1) first, capability (R2) second, tier/route order preserved; typed refusals name the failing predicate; expertise narrows only, never reorders. Negative controls as tests"* — and that implementation is on disk. The work splits by evidence:

- **(a) ACCEPTANCE-ONLY** — implementation exists but a charter-named control is missing/unproven: exactly one item, **C1**, the literal-name F1/F2 controls (`nvidia/nemotron-3.5-lightning` / `z-ai/glm-5.3`, charter `:114-115`); the shipped class control uses a stand-in binding and does not name either defect model. Everything else in the charter's named set is already proven by an on-disk control (inventory in Contract C0).
- **(b) IMPLEMENTATION** — a named control cannot pass because the behavior is missing: **EMPTY**. The expected candidate, the DA-1 resolve-time `FALLBACK_SELF_REFERENCE` mirror, **already shipped in Window R** (implementation `routing-policy/src/pi-resolver.ts:1285-1293`, negative controls `routing-policy/tests/rcm-predicates.test.ts:415-438`) and is therefore **demoted to acceptance-only** (Contract C2) per the scope record's own item (`rcm-p2-scope-reconciliation-2026-09-27.md:32`: *"mirror `FALLBACK_SELF_REFERENCE` at resolve time with one negative control"*).

This parcel's controls run at the **resolver/policy level**. The end-to-end F1/F2 controls through the real dispatch caller are MRC-05's (`goal-status-report-2026-09-27.md:104`; `rcm-p2-scope-reconciliation-2026-09-27.md:81` — RCM-P4A dispatch integration is *"NOT this parcel"*).

`verification_class: equivalence-provable` — every control is a deterministic assertion over a typed `RouteReceipt`; each names the exact behavior it pins and is falsifiable (re-introducing the defect class must turn it red), so acceptance is provable by equivalence, not judgment.

## Dependencies

- **No hard predecessors** (report §7 MRC-03 row, `goal-status-report-2026-09-27.md:104`, predecessors column "—").
- **Lane G slot 2** — dispatch only after **MRC-02's window closes** (`goal-status-report-2026-09-27.md:143`: *"Lane G strict order: MRC-02 → MRC-03 → MRC-05 → … No two Lane-G tasks may be dispatched concurrently"*; lane rule `:93`; wrapper D4 `docs/goals/model-routing-chain-wrapper/charter.md:32` enforces it). The Lane-G rule is serialization, not a data dependency: MRC-03 consumes no MRC-02 output.
- **Dispatch grant:** G-GATE2-RCM (`docs/goals/model-routing-chain-wrapper/charter.md:93`, *"exact-parcel-set dispatch grant under `routing-currency-and-merit` for MRC-03, 05, 07, 09, 11, 14, 15, 16"*), contingent per dispatch on Lane G discipline and a coordinator-lint-clean spec (`charter.md:90`).
- **Consumes (all landed in Window R, read-only here):** the four D7/D8 predicate evaluations inside R1–R7 (`routing-policy/src/pi-resolver.ts:471`, `:481`, `:569`, `:1306-1309`); the D8 legacy-omission defaults (`pi-resolver.ts:1300-1303`); the DA-1 mirror (`pi-resolver.ts:1285-1293`); the shipped negative-control suite (`routing-policy/tests/rcm-predicates.test.ts:64-438`); semantics as fixed by `rcm-p2-scope-reconciliation-2026-09-27.md` §5 (`:101-132`, items at `:103`, `:112`, `:117`, `:124`, `:128`).
- **Downstream consumers:** MRC-05 builds its end-to-end F1/F2 controls on this parcel's resolver/policy-level controls (`goal-status-report-2026-09-27.md:104`); MRC-16 consumes this parcel's acceptance evidence (`goal-status-report-2026-09-27.md:117`).
- **Execution mechanics:** single-writer windows in the live working tree; the second-writer rule (re-read + full-suite re-run) binds this parcel at Step 0 (`docs/goals/model-routing-chain-wrapper/loop-directive.md:8`).

## Allowed Files

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden. Per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-137`): *"If implementation requires a path not listed in `Allowed Files`, work stops until the coordinator ratifies a spec amendment."*

| Path | Change |
|---|---|
| `routing-policy/tests/rcm-predicates.test.ts` | edit — append the C1 named F1/F2 negative controls to the charter-control suite (Contract C1) |
| `routing-policy/tests/pi-fixtures.ts` | edit — **additive-only**: one new fixture seam if C1 needs it (new helper only; zero behavior change to `makeDeclaredPolicy` (`:107`), `makeRequest` (`:131`), `withBinding` (`:136`), `withLane` (`:153`), `withLaneRoute` (`:166`)); if C1 is implementable with the existing seams, this file stays untouched |

## Forbidden

- Any path not listed in Allowed Files — in particular `routing-policy/src/**`, `dispatch/**`, `routing-policy/routing-policy.yaml`, `routing-policy/schemas/**`, `routing-policy/templates/**`, `templates/**`, `docs/SPEC-CONVENTION.md`, any `INDEX.md`, any goal record, `spec-linter/**`, `foreman-config/**`. Implementation needing one → Stop-and-Report (SPEC-CONVENTION §4.8, `docs/SPEC-CONVENTION.md:134-137`).
- **No implementation change.** The (b) set is empty (Contract C0): no predicate, resolver, validator, schema, or refusal-vocabulary change. `routing-policy/src/types.ts` (`RESOLVER_REFUSALS` `:439`) is untouched — C1 uses existing names (`INPUTS_INSUFFICIENT`, `rcm-p2-scope-reconciliation-2026-09-27.md:169`).
- **No policy change.** `routing-policy.yaml` stays byte-identical (HCS SP16: the file is a user-owned ambient checkout, `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:205`); named controls mutate fixtures, never the shipped document. Selection order, tiers, `model_tiers`, and `lane_routes` are acceptance-tested, never amended (RCM D3/D4, `charter.md:188-189`).
- **No preservation-baseline edit** (`rcm-p2-scope-reconciliation-2026-09-27.md:135-141`): `routing-policy/src/pi-openrouter.ts`, `routing-policy/schemas/pi-openrouter-routing.schema.json`, `routing-policy/tests/pi-openrouter.test.ts`, `routing-policy/tests/semantic-invariants.test.ts`, `routing-policy/templates/pi-openrouter-routing.json` stay byte-identical; the six scaffolder-owned template files stay untouched.
- **No weakening of existing controls.** The shipped suite (`rcm-predicates.test.ts:64-438`, `pi-resolver.test.ts`) is the acceptance evidence: no assertion renamed, softened, deleted, or re-pinned; C1 is strictly additive.
- **No dispatch-level or end-to-end control** (MRC-05 boundary, `goal-status-report-2026-09-27.md:104`); no receipt/replay, corpus, or merit work (MRC-02/MRC-14/MRC-16).
- **No goal-record write by this parcel** (Evidence Required #3 — that write is an MRC-01-class coordinator act, wrapper D8 `docs/goals/model-routing-chain-wrapper/charter.md:36`).
- No new dependencies, no engines edits, no formatting/lint sweeps beyond the two listed files.

## Out of Scope

- **End-to-end F1/F2 controls through the real dispatch caller** — MRC-05 (`goal-status-report-2026-09-27.md:104`: *"End-to-end controls close with MRC-05"*). This parcel's controls resolve at the resolver/policy level only.
- **Spec-side propagation** of effective frontmatter requirements (`inputs:`, `thinking_level:`, `min_context:`, `expertise:`) into the real dispatch request — RCM-P4A/MRC-05 (`rcm-p2-scope-reconciliation-2026-09-27.md:81`). The resolver's request-side fields (`routing-policy/src/pi-resolver.ts:111,:118,:126`) and their D8 defaults (`:1300-1303`) are the tested boundary here.
- Exit-criterion-3's *"through the real dispatch integration path"* (`charter.md:256-257`) as a whole — named here so nothing is silently claimed: this parcel closes the **resolver/policy half** of F1/F2; the exit criterion itself closes with MRC-05.
- The L5 cost-ordering tension (RCM D3 vs the A3 rubric; `goal-status-report-2026-09-27.md:151` surfaced item; `rcm-p2-scope-reconciliation-2026-09-27.md` §4(e)) — a Gate-1 human decision; nothing here touches or settles it.
- Expertise binding **content** (RCM-P9 shadow bindings), currency preflight (RCM-P5), proposer (RCM-P6), receipts/merit (MRC-02/MRC-14/16) — unchanged and untouched.
- Populating `inputs`/`thinking_levels` facts on the shipped bindings (`rcm-p2-scope-reconciliation-2026-09-27.md:68`, deferred to RCM-P5/P6 governed refresh) — C1 uses synthetic fixture facts exactly as the shipped suite does.

## Contract

Authority quotes are verbatim; each item is bounded to its named seam.

### C0 — Exists-vs-missing inventory (the acceptance baseline; recorded as evidence per Evidence Required #3)

Read from disk 2026-09-27. `pi-resolver.ts` line anchors were re-verified twice at the end of inventory (see Collision Risk — MRC-02's window was observed open on that file during shaping).

| # | Charter-named control (source) | Implementation on disk | Named negative control on disk | Disposition |
|---|---|---|---|---|
| 1 | **F1/F2:** image-bearing `boilerplate` must not select Nemotron (`charter.md:226`, defect rows `:114-115`) | R2 input-modality predicate (`routing-policy/src/pi-resolver.ts:471-478`, verdict `:489`; D8 request field `:111`) | class control with a stand-in text-only first/cheapest binding (`routing-policy/tests/rcm-predicates.test.ts:64`) — **the literal ids `nvidia/nemotron-3.5-lightning` / `z-ai/glm-5.3` are never named** | **(a) ACCEPTANCE-ONLY → C1** |
| 2 | **Unsatisfiable requirements refuse, never downgrade** (`charter.md:226`) | typed refusals per failing predicate: modality (`pi-resolver.ts:471`), thinking (`:481`), expertise (`:1306-1312`) | `rcm-predicates.test.ts:84` (`INPUTS_INSUFFICIENT`), `:162` (`THINKING_LEVEL_UNSUPPORTED`), `:329` (`EXPERTISE_BINDING_UNSATISFIABLE`) | **EXISTS** — cited as evidence |
| 3 | **An `internal` parcel never reaches a model outside its classification set** (`charter.md:226`) | R1 is the first gate (`pi-resolver.ts:426`); capability-only-narrowing (`:454-458`) | `rcm-predicates.test.ts:138` (`data_class: 'internal'`; excluded binding R1-false/R2-true) | **EXISTS** |
| 4 | **Expertise and shadow semantics preserve tier order and refusal behavior** (`charter.md:226`) | narrowing filters within the eligible set and *"preserve[s] route/tier order"* (`pi-resolver.ts:1306-1309`), narrowed-out recorded (`:1326`) | `rcm-predicates.test.ts:273` (missing = no narrowing), `:283` (order preserved — declared-order primary wins over cheaper), `:310` (no fail-over past the binding), `:329` (unsatisfiable refuses), `:357` (shadow evidence-only) | **EXISTS** |
| 5 | **DA-1:** resolve-time `FALLBACK_SELF_REFERENCE` mirror + one negative control (`rcm-p2-scope-reconciliation-2026-09-27.md:32`) | **shipped**: `pi-resolver.ts:1285-1293` (mirrors validator `checkLaneRoutes`, `routing-policy/src/validator.ts:819-821`) | `rcm-predicates.test.ts:415-438` (two controls) | **SHIPPED — demoted to acceptance-only (C2)** |
| 6 | **D4 fixed order** classification → capability → tier order (`charter.md:189`) | R1 (`pi-resolver.ts:426`) → R2 (`:454`, D4 comment `:456-458`) → tier/route order untouched; predicates computed once (`:1300-1303`) | `rcm-predicates.test.ts:138` (capability-perfect model outside the set not selected; it is also the fixture's cheapest, `pi-fixtures.ts:51`) | **EXISTS** |
| 7 | **D8 defaults + refusal-not-downgrade** (`charter.md:193`; `rcm-p2-scope-reconciliation-2026-09-27.md:103-132`) | `RouteRequest` fields (`pi-resolver.ts:111,:118,:126`), effective defaults (`:1300-1303`), structural refusal of malformed/absent-default requests (`:1009-1038`) | `rcm-predicates.test.ts:125`, `:195`, `:209`, `:244`, `:260` | **EXISTS** |
| 8 | **Exit criterion 4** (resolver half): `inputs: [text, image]` `boilerplate` resolves to a vision-capable, classification-eligible model or refuses with a typed error naming the predicate (`charter.md:258-260`) | same as row 1 | resolve half `rcm-predicates.test.ts:64`; refuse half `:84` | class-proven; C1 adds the **named** vision-capable assertion |
| 9 | **Exit criterion 5**: classification gating precedes capability **and cost** (`charter.md:261-262`) | R1 first (`pi-resolver.ts:426`) | `rcm-predicates.test.ts:138` (the excluded binding is the cheapest fixture binding, `pi-fixtures.ts:51`) | **EXISTS** |
| 10 | **Exit criterion 3**: F1/F2 end-to-end through the real dispatch path (`charter.md:256-257`) | — | — | **OUT OF SCOPE — MRC-05** (`goal-status-report-2026-09-27.md:104`) |

**(b) IMPLEMENTATION set: EMPTY** (row 5 demoted). No `src/**` change is authorized or needed.

### C1 — (a) Named F1/F2 negative controls (the one acceptance-only gap)

The charter names the defect models (`charter.md:114`: *"`nvidia/nemotron-3.5-lightning` is `input: ["text"]` and is deliberately first in the `economy` tier"*; `:115`: *"Same class of defect in `standard`: `z-ai/glm-5.3` is `input: ["text"]`, position 4"*). The shipped class control (`rcm-predicates.test.ts:64`) closes the defect **class** but binds a stand-in (`opencode/qwen3.8-flash`); neither literal id appears anywhere in `routing-policy/tests/` (grep-verified 2026-09-27). Add one named control block to `rcm-predicates.test.ts` (its header already declares the file the charter's acceptance evidence, `:1-10`) that fails if either defect returns — *"not by reordering a list"* (`charter.md:256-257`):

1. Fixture: both literal ids present as `candidates` bindings in the selectable first/cheapest positions of their lanes — `nvidia/nemotron-3.5-lightning` (F1) and `z-ai/glm-5.3` (F2) — each with a **text-only** declared fact `inputs: {state: 'declared', value: ['text']}` (fixture honesty style, `rcm-predicates.test.ts:53-57`).
2. Request: `makeRequest({ required_inputs: ['text', 'image'] })` — `boilerplate` class default (`pi-fixtures.ts:117-129`) — i.e. the charter's *"image-bearing `boilerplate` parcels"*.
3. Required assertions, each tied to a named behavior:
   - (i) neither literal id is `receipt.route.primary.binding_id` nor `receipt.route.fallback.binding_id` (never selected, either position);
   - (ii) each named binding carries `INPUTS_INSUFFICIENT` with its R2 `ranking_inputs` verdict `false` (the failing predicate is named — exit criterion 4, `charter.md:258-260`);
   - (iii) when the receipt approves, the selected binding is **vision-capable and classification-eligible**: its evaluation shows R1 verdict `true` and its declared `inputs` include `image` (exit criterion 4's *"vision-capable, classification-eligible model"*); when it stops, the stop names `INPUTS_INSUFFICIENT` (never a silent downgrade);
   - (iv) falsifiability: the control is red if the modality predicate is removed, if `inputs` facts are ignored, or if selection is fixed by reordering — pin the behavior, not the fixture.
4. Registry-validity trap (why assertion (ii) matters): a binding without a Pi execution-plane registry entry refuses at the registry gate (`UNSUPPORTED_MODEL_REFUSED`, `pi-resolver.test.ts:546`) — which would make (i) pass vacuously. The named fixture bindings must therefore carry a registry-valid `model` key (matching rule `piModelContractFor`, `pi-resolver.ts:844-864`: `binding.provider === 'openrouter' ? key === binding.model : entry.opencodeId === binding.model`; Nemotron's shipped entry `nvidia/nemotron-3.5-lightning:free` with `opencodeId: 'nemotron-3.5-lightning-free'`, `routing-policy/src/pi-openrouter.ts:526-534`) so the **only** thing refusing the named model is the modality predicate. Assert the refusal **name**, never bare non-selection.

No new refusal names (`rcm-p2-scope-reconciliation-2026-09-27.md:169`); no `src/**` change.

### C2 — DA-1 demoted to acceptance-only (evidence, not work)

The expected implementation candidate is already shipped: the resolve-time mirror at `pi-resolver.ts:1285-1293` (*"DA-1 (resolve-time mirror of the validator's static A5.3 rejection) … Defense-in-depth over `validator.ts` `checkLaneRoutes`' FALLBACK_SELF_REFERENCE; never approves"*) with its negative controls at `rcm-predicates.test.ts:415-438` (candidate-typed and binding-typed self-fallback pairs). Acceptance = cite + the controls pass; **no new test is required** unless Step 0 finds them absent (then Stop-and-Report, rule 2). The static validator twin (`validator.ts:819-821`) and its controls (`fallback-contract.test.ts:290`, `cli.test.ts:133-134`) remain untouched baselines.

### C3 — Acceptance-evidence assembly and the record-act boundary

The acceptance evidence for RCM-P4 is: the C0 inventory + the named-control list (shipped + C1) + DA-1's disposition (C2) + green verification output. Its home is the `routing-currency-and-merit` goal record (report `:151`: *"MRC-03 carries that closure so nothing is dropped"*). Per wrapper D8 (`docs/goals/model-routing-chain-wrapper/charter.md:36`), owning-goal record writes are **MRC-01-class coordinator acts**; the same discipline as the MRC-02 spec's Evidence Required #4 (`docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md:186`, *"**This write is not performed by this parcel** (it is outside Allowed Files)"*). The Stage-F record update (`docs/goals/model-routing-chain-wrapper/loop-directive.md:38`) lands it; this parcel produces the content (Evidence Required #3) but performs no record write.

### C4 — Review and acceptance scope

Two independent adversarial reviews (wrapper D6, `docs/goals/model-routing-chain-wrapper/charter.md:34`: architecture/risk parcels get two; MRC-03's row `:56` — `elevated | architecture/risk | 2`). Reviewers never fix or commit; the coordinator reproduces disputed findings before ruling (`loop-directive.md:37`).

## Existing Patterns To Follow

- **Named negative-control style** — the shipped charter-control suite `rcm-predicates.test.ts`: typed mutation seams (`withBinding`/`withLane`/`withLaneRoute`, `pi-fixtures.ts:136,:153,:166`), helper assertions `stopNames`/`evaluationOf`/`refusalNames` (`rcm-predicates.test.ts:26-38`), synthetic-fixture honesty (`FIXTURE_EVIDENCE`, `:53-57` — *"synthetic negative control — not a merit claim"*). C1 extends this file in this style; no new harness.
- **Typed refusal assertions** — assert refusal **names** from the ratified vocabulary (`RESOLVER_REFUSALS`, `routing-policy/src/types.ts:439`) plus the detail's failing-predicate text (existing pattern `rcm-predicates.test.ts:84-104`), never string-matching on free text alone.
- **Fixture-vs-shipped discipline** — `makeDeclaredPolicy` upgrades the shipped policy with synthetic facts *"for exercising the resolver's selection machinery only"* (`pi-fixtures.ts:4-8`); the shipped policy's own fail-closed outcomes are asserted separately against the unmodified document (`pi-resolver.test.ts:167`). C1 uses the synthetic-fixture path only.
- **Additive-test discipline** — append-only additions to a test file (Window-R practice: the file grew `175→198` observed tests, report `:22`); no refactor of existing tests while adding controls.

## Required Tests / Verification

Exact commands (from `plugins/foreman-line/`; Node v24.7.0 observed 2026-09-27, satisfies `routing-policy/package.json:7-9` `"node": ">=22"`; scripts `package.json:16-20` — `typecheck` = `tsc --noEmit`, `test` = `tsx --test tests/*.test.ts`, `lint` = `biome check .`):

```
cd routing-policy && npm run typecheck && npm test && npm run lint
```

**No `cd dispatch` block is in scope, by the MRC-05 boundary.** Dispatch-level controls are RCM-P4A/MRC-05's (`goal-status-report-2026-09-27.md:104`; `rcm-p2-scope-reconciliation-2026-09-27.md:81`); adding a dispatch test here would claim the end-to-end F1/F2 closure the report explicitly assigns to MRC-05. This parcel's controls exercise `resolveRoute` at the resolver/policy level only.

Test content (permanent):

1. `routing-policy/tests/rcm-predicates.test.ts` (append): the C1 named F1/F2 control block with assertions (i)–(iv) of Contract C1, in the file's existing style.
2. The shipped named controls (Contract C0 rows 2–7: `:84`, `:138`, `:162`, `:273-391`, `:415-438`) pass **unchanged** — they are the acceptance evidence; nothing is renamed, weakened, or deleted.
3. `routing-policy/tests/pi-fixtures.ts` (only if used): additive helper compiles under `npm run typecheck`; existing helpers' behavior unchanged (their own consumers, `pi-resolver.test.ts`, keep passing untouched).

## Acceptance Criteria

1. C1's named controls pass with every assertion of Contract C1 (literal ids named; `INPUTS_INSUFFICIENT` + R2-false per binding; vision-capable, classification-eligible alternative or typed refusal; no selection in either route position), and are falsifiable against a re-introduced F1/F2-class defect.
2. Every Contract C0 row marked EXISTS passes as-is; DA-1 controls (`rcm-predicates.test.ts:415-438`) pass as-is (C2 acceptance).
3. Zero `src/**`, `routing-policy.yaml`, schema, template, or goal-record change: the diff is exactly the Allowed Files entries (C3 boundary respected).
4. The Verification block passes (`typecheck`, `test`, `lint` on `routing-policy`).
5. Two independent adversarial reviews completed and findings triaged by the coordinator; reviewers never fixed or committed (C4).
6. The C0 inventory + control list + DA-1 disposition are handed to Stage F as the RCM-P4 acceptance-evidence content (Evidence Required #3); no acceptance claim is made that is not on this list.

## Evidence Required

1. Command output of the Verification block plus `node --version` (expected v24.7.0) — captured after the second-writer re-read + full-suite re-run (Step 0 / `loop-directive.md:8`).
2. Named-control evidence: the C1 test block's final name and line range, its assertion inventory (i)–(iv), and the registry-validity note (which shipped registry key each named fixture binding carries and why — Contract C1 item 4), plus confirmation that the shipped controls (C0 rows 2–7) passed unchanged with their test names.
3. **RCM-P4 acceptance record (required for closure, not performed by this parcel):** the C0 inventory, the named-control list, and the DA-1 disposition are written into the `routing-currency-and-merit` goal record as RCM-P4's acceptance evidence via an **MRC-01-class record act** at Stage F (wrapper D8 `docs/goals/model-routing-chain-wrapper/charter.md:36`; `loop-directive.md:38`; MRC-02 precedent `docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md:186`). Report `:151` makes this the deliverable *"so nothing is dropped"* — its completion is mandatory evidence for MRC-03 closure and is recorded in the wrapper dispatch table (`docs/goals/model-routing-chain-wrapper/charter.md:108`).
4. Review record: **2 independent adversarial reviews** (wrapper D6 `:34`; MRC-03 row `:56`) with the coordinator's triage notes.
5. Step-0 drift attestation: the `pi-resolver.ts` anchors of Contract C0 were re-verified against the post-MRC-02 tree (Collision Risk residual); any delta is reported with the corrected anchors before work proceeds.

## Collision Risk

Write set $W$ = the 2 Allowed Files. Disjointness proof vs the report §7 lanes (`docs/goals/goal-status-report-2026-09-27.md:93-96`, task rows `:102-126`) and the HCS collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`), in the same write-family discipline as the MRC-02 spec's proof (`docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md:189-202`):

- **SP8 (`routing-policy/`, `hcs-…-map.md:197`) / SP9 (`dispatch/`, `:198`) — Lane G slot 2:** the map's "Live binding one-writer order" and the report's lane rule (*"Lane G — strictly serial. One writer at a time on the contested `routing-policy/**` + `dispatch/**` surfaces (Window discipline, HCS collision map SP8/SP9). Dispatch in slot order."*, `:93`) enforce one writer at a time; the wrapper enforces the window (D4 `docs/goals/model-routing-chain-wrapper/charter.md:32`) and the strict order MRC-02 → **MRC-03** → MRC-05 → … (`:143`, *"No two Lane-G tasks may be dispatched concurrently"*). MRC-03 holds its window only after MRC-02's closes; MRC-05/06/07–13 all sequence behind it. $W$ touches no `dispatch/**` path (SP9 not in contact). **Disjoint by serialization window.**
- **File-level disjointness from the slot-1 writer (stronger than the window):** MRC-02's Allowed Files (`MRC-02-…md:40`; routing-policy rows `:50,:54`) are `receipts/**`, `contracts/src/correlation.ts`, `routing-policy/src/route-receipt.ts`, `routing-policy/src/pi-resolver.ts` (`:50`), `dispatch/src/routing-eval/index.ts`, `routing-policy/tests/pi-resolver.test.ts` (`:54`), `dispatch/tests/routing-eval.test.ts`, `contracts/tests/strictness.test.ts`, `receipts/tests/*` — $W$ ∩ $W_{\text{MRC-02}} = \varnothing$ at file level.
- **Observed live-claim evidence (recorded, not a collision):** at shaping time MRC-02's window was **open** on `routing-policy/src/pi-resolver.ts` — its C4 `provider_local_id`/`protocol` enrichment is on disk at `pi-resolver.ts:844-864` (*"The Pi-side contract for a resolved binding (MRC-02 C4)"*). Consequence: `pi-resolver.ts` line anchors drifted during inventory (the DA-1 block moved `:1276 → :1285` between two reads) and may drift again before dispatch. Contract C0 anchors are cited from the final double-verified read; the second-writer rule (`loop-directive.md:8`: re-read + full-suite re-run) binds MRC-03's Step 0, and Evidence Required #5 attests the re-verification. This is the residual risk of the window discipline, handled by procedure, not overlap.
- **SP17 (`:206`, shared `routing-policy/tests/` directory):** $W$ is file-disjoint from both named claimants — `rcm-predicates.test.ts` is the Window-R-created RCM control file (`rcm-p2-scope-reconciliation-2026-09-27.md:156`), and `pi-fixtures.ts` is the PMC fixture seam already extended by Window R (`pi-fixtures.ts:94-105`, RCM v0.4 predicate facts); no RCM-P1 frozen-branch file is touched. Verdict **wait** (file-disjoint) per the map; **escalate** only on a real file collision.
- **SP13 (`:202`, FK §12 serialization-point family: plugin manifests, marketplace metadata, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports):** $W$ contains no serialization-point path — two test files only — so the single-claimant rule is **not in contact** (contrast MRC-02's receipt-schema family claim, its `:202` bullet). SP11 (`templates/`, `:200`) and SP16 (user-owned `routing-policy.yaml`, `:205`): not in contact; the named controls mutate fixtures, never the shipped document.
- **Lane P-A / P-R / X** (`goal-status-report-2026-09-27.md:94-96`): MRC-01 writes named goal records (`:102`), MRC-04 canon, MRC-20 catalogue bytes, GMF separate Keon repos, MRC-14/15/16 read-only evidence chain, MRC-17/18/19 consume — none writes $W$; $W$ writes no records, receipts, or analysis artifacts. **Disjoint.** The MRC-01-class Stage-F record act (Evidence Required #3) is outside $W$ and outside MRC-03's window, exactly as in the MRC-02 proof (`MRC-02-…md:200`).

**Verdict: write-set disjoint from every other §7 lane under Lane G's strict serialization (SP8/SP9, slot 2 after MRC-02), file-disjoint from the slot-1 writer's Allowed Files, zero contact with SP11/SP13/SP16, SP17 file-disjoint.** Residual risk: `pi-resolver.ts` anchor drift from MRC-02's open window at shaping time — mitigated by Step-0 re-verification + the second-writer rule (Evidence Required #5).

## Stop-and-Report Rule

Stop immediately and report (never guess, never self-expand authority) when:

1. Implementation requires any path outside Allowed Files — await a coordinator ratification of a spec amendment per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:134-137`).
2. **The C0 inventory does not reproduce at implementation time** — e.g. the class control `rcm-predicates.test.ts:64` fails, or the DA-1 mirror (`pi-resolver.ts:1285-1293`) or its controls (`:415-438`) are absent. That converts an item to (b) IMPLEMENTATION, which this spec does not authorize; stop and report the delta.
3. A C1 assertion would require touching `src/**`, `routing-policy.yaml`, `types.ts` (new refusal names), or any preservation-baseline file (`rcm-p2-scope-reconciliation-2026-09-27.md:135-141`) — or would require weakening/renaming an existing control (Forbidden).
4. A live write claim by another parcel is observed on `routing-policy/**`, or a real file collision appears in `routing-policy/tests/` (SP8/SP17) — stop and report; the map's verdicts are `wait`/`escalate`, never co-write.
5. Step-0 re-verification finds `pi-resolver.ts` behavior changed vs the Contract C0 anchors (MRC-02's window was open during shaping) — surface the corrected anchors and the behavioral delta before proceeding.
6. Any requirement would cross into dispatch-level/end-to-end control, effective-frontmatter propagation, L5 cost ordering, or expertise binding content (Out of Scope) — that is MRC-05/Gate-1/RCM-P9 territory; stop and name the owner task.
7. Authority text is ambiguous (e.g. whether a needed record write qualifies for the Stage-F MRC-01-class act) — surface the question to the coordinator with the two readings; never resolve charter/ruling ambiguity unilaterally.
