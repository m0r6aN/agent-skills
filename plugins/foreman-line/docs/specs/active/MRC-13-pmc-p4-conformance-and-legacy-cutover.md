---
ticket: MRC-13
title: "PMC-P4 conformance/smoke/rollout gate and serialized legacy-representation removal at the named cutover — static conformance + legacy cutover provable with zero provider calls; synthetic lane smoke, Pi-session installation check, and the versioned model-quality record behind G-LIVE"
status: active
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
risk: elevated
surfaces:
  - plugins/foreman-line/routing-policy/routing-policy.yaml
  - plugins/foreman-line/routing-policy/src/validator.ts
  - plugins/foreman-line/routing-policy/src/schemas.ts
  - plugins/foreman-line/routing-policy/src/types.ts
  - plugins/foreman-line/routing-policy/src/testing.ts
  - plugins/foreman-line/routing-policy/src/registry.ts
  - plugins/foreman-line/routing-policy/src/index.ts
  - plugins/foreman-line/routing-policy/README.md
  - plugins/foreman-line/routing-policy/schemas/routing-policy.schema.json
  - plugins/foreman-line/routing-policy/schemas/data-classification-rule.schema.json
  - plugins/foreman-line/routing-policy/schemas/class-entry.schema.json
  - plugins/foreman-line/routing-policy/schemas/role-assignment.schema.json
  - plugins/foreman-line/routing-policy/tests/legacy-cutover.test.ts
  - plugins/foreman-line/routing-policy/tests/fallback-contract.test.ts
  - plugins/foreman-line/routing-policy/tests/semantic-invariants.test.ts
  - plugins/foreman-line/routing-policy/tests/schema-validation.test.ts
  - plugins/foreman-line/routing-policy/tests/parity.test.ts
  - plugins/foreman-line/routing-policy/tests/cli.test.ts
  - plugins/foreman-line/routing-policy/tests/fixtures/accept-shadow-route.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-both.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-ceiling-missing.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-ceiling-zero.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-classification-gate.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-fallback-self-ref.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-frontier-anchor.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-multiple.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-role-pinning.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-security-override.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-security-undeclared.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-structural.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-tier-not-eligible.yaml
  - plugins/foreman-line/routing-policy/tests/fixtures/reject-transport-requirements.yaml
  - plugins/foreman-line/dispatch/src/routing-eval/index.ts
  - plugins/foreman-line/dispatch/tests/routing-eval.test.ts
  - plugins/foreman-line/dispatch/tests/rcm-p4a-controls.test.ts
routing_class: architecture/risk
verification_class: equivalence-provable
---

# MRC-13 — PMC-P4: conformance/smoke/rollout gate and serialized legacy-representation removal at the named cutover

## Goal

Close the `pi-model-configuration` charter's **PMC-P4** row (`docs/goals/pi-model-configuration/charter.md:93`) — *"Conformance, smoke, and rollout gate | Execute synthetic public lane tests, static/config/schema tests, fallback simulations, route/evidence assertions, and a clean Pi-session installation check; publish a versioned model-quality review record. | integration/release; two independent reviews | PMC-P2, PMC-P3"* — and execute the **serialized removal of the legacy representation** that Amendment 01 A5 item 5 assigns to this parcel (`charter.md:171-176`): *"Removal of the legacy representation is **serialized into PMC-P4** behind a named cutover condition, so a lagging consumer cannot block the contract parcel."* The A7 ownership table names PMC-P4's outcome exactly (`charter.md:201`): *"conformance/smoke/rollout gate **and** serialized removal of the legacy representation"* — and its must-not-touch line: *"the ratified contract surface"*.

The packet is three provably separate halves (C1):

1. **STATIC/CONFORMANCE half** — static/config/schema tests, fallback simulations, and route/evidence assertions, all **no-provider-call**, attesting `static-conformance` only (A6, `charter.md:178-190`). Provable without G-LIVE.
2. **SMOKE half** — synthetic public lane tests, a clean Pi-session installation check, and the versioned model-quality review record. Every item is tagged **`blocked:G-LIVE`** (C9) and is never run or claimed without the owner's live-call authorization (wrapper D5, `docs/goals/model-routing-chain-wrapper/charter.md:33`).
3. **LEGACY CUTOVER** — the removal of the deprecated `openrouter-slug-only` representation (`model_tiers`, `roles`, `data_classification.eligible_models`) at the named condition **`CUTOVER-P4`** (C2), with the deprecation window ending there (A5.5), validator/policy/evaluator consumers moved to the new representation only (C5), legacy-only documents refused per the window rules (C4), and migration-inventory evidence (C7). Provable without G-LIVE.

This is the last Lane G writer (`goal-status-report-2026-09-27.md:143`: *"Lane G strict order: MRC-02 → … → MRC-12 → MRC-13"*; row `:114`: *"Legacy removal half touches `routing-policy` representation → last in Lane G after consumers run on the new representation; smoke half needs G-LIVE. Two independent reviews per charter"*).

`verification_class: equivalence-provable` — the cutover's central claim is an **equivalence proof** (pre/post selection identity per C5.1) plus named, falsifiable refusal and window-end controls; every untouched seam is proven unchanged by its own suites passing with zero edits.

## Dependencies

- **Gate receipts:** **G-GATE2-PMC ✓** for MRC-13 (`docs/goals/model-routing-chain-wrapper/dispatch-table.md:31`: *"G-GATE2-PMC ✓; **blocked:G-LIVE** for smoke half … Lane G slot 11"*; `loop-directive.md:6` owner grant acts 2026-09-27; slot order `:46`). **G-LIVE remains open** (`goal-status-report-2026-09-27.md:133`: *"Owner-authorized credentials/budget for synthetic live provider calls"*) and gates the smoke half only.
- **Hard predecessors (report `:114`):** MRC-04 (PMC-P3 canon), MRC-05 (RCM-P4A dispatch integration), MRC-06 (HRO-P4 Pi entry) — their windows close before this slot; plus the full Lane G order (`:143`) and the wrapper's second-writer rule (`docs/goals/model-routing-chain-wrapper/loop-directive.md:8`: *"single-writer windows in the live working tree … rebase-equivalent = re-read + full-suite re-run"*).
- **Authority (verbatim):** A5 item 5 (`charter.md:171-176`), ratified as *"Dual representation with a deprecation window; legacy removal serialized into PMC-P4"* (`gate-1-amendment-01.md:132`; Q4 `:144`: *"Legacy cutover style | deprecation window, removal in P4"*; quoted in `a54-ratification-2026-09-26.md:32`). A6 three-state evidence discipline (`charter.md:178-190`). A7 ownership and review load (`charter.md:196-210`: *"PMC-P0, P1, P2, and P4 each require **two** independent adversarial reviews"*). A8 (`charter.md:216`): *"Exit criteria 4 and 5 are satisfied by `static-conformance`"*. Exit criteria 4/5/6 (`charter.md:320-328`). Wrapper D3/D4/D5/D6/D7/D10 (`docs/goals/model-routing-chain-wrapper/charter.md:31-38`).
- **Consumed contract (landed, never re-specified):** the PMC-P1 provider-neutral fallback contract — `compatibility`/`ranking_contract`/`lane_map`/`candidates`/`lane_routes` (`routing-policy/routing-policy.yaml:241-672`; record `docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md`), `KNOWN_FRONTIER_BINDINGS`/`KNOWN_FRONTIER_MODELS` (`routing-policy/src/validator.ts:54`, `:343`), the refusal vocabulary (`CONTRACT_REFUSALS`, `RESOLVER_REFUSALS`, record §2 item 10), the A5.5 compatibility mechanics (`schemas.ts:455-477`, `:629-633`), and the PMC-P2 resolver/launch boundary. MRC-05's dispatch result/explanation contract (`dispatch/src/routing-eval/index.ts:158`, `:490-495`) is consumed unchanged (C5.3).
- **Migration inventory source of truth:** PMC-P1 §5 (`pmc-p1-fallback-contract-2026-09-26.md:131-160`) — the policy, evaluator, template, and session consumers; re-attested here (C7).
- **Second-writer surfaces:** `routing-policy/**` (SP8), `dispatch/**` (SP9), the `index.ts` barrel family (SP13), the user-owned checkout of `routing-policy/routing-policy.yaml` (SP16) — `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:197-206`. See Collision Risk.
- **Review load: two independent adversarial reviews** (owning charter, `charter.md:209-210`; wrapper D6 `:34`; MRC-13 row `dispatch-table.md:31` *"0/2"*). Reviewers never fix or commit.

## Allowed Files (EXACT)

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden. Per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-140`): *"If implementation requires a path not listed in `Allowed Files`, work stops until the coordinator ratifies a spec amendment."*

**A. Representation removal + migration, `routing-policy/` (C3–C6):**

| Path | Change |
|---|---|
| `routing-policy/routing-policy.yaml` | edit — remove `roles` (`:141-145`), `model_tiers` (`:146-196`), and `data_classification.<tier>.eligible_models` (`:61-140`) and their legacy commentary (incl. the dual-representation note `:214-218`); migrate the ordered selection data to the provider-neutral vocabulary (C5.2); re-source binding `data_classes` provenance strings (C3.4); `classes` (`:19-34`), `data_classification.*.transport_requirements`, `shadow_routes` (`:210`), `expertise_bindings` (`:674`), and the five PMC-P1 blocks (`:241-672`) otherwise byte-unchanged |
| `routing-policy/src/validator.ts` | edit — remove the legacy-only machinery (invariants over `model_tiers`/`roles`/`eligible_models`, `:84-126`, `:162-171`, `:213-233`, the R1 legacy cross-check `:722-741`); add the cutover refusals and the ordered-source referential-integrity check (C4/C5); retain the security-override invariant (`:129-155`), the transport invariants (`:189-207`), the shadow invariants (`:259-283`), all new-representation invariants, and both frontier registry constants untouched (`:54`, `:343`) |
| `routing-policy/src/schemas.ts` | edit — drop the legacy block shapes (`roleAssignmentSchema`; `eligible_models` in `dataClassificationRuleSchema`); retire the deprecation-window optionality comment (`:629-633`) per C4.4; `compatibilitySchema` (`:455-477`) byte-unchanged |
| `routing-policy/src/types.ts` | edit — remove legacy fields from `RoutingPolicy`/`DataClassificationRule`; add the typed `LEGACY_REPRESENTATION_REFUSED` name to the contract refusal vocabulary (C6); `LegacyRepresentation`/`Compatibility` (`:387-399`) byte-unchanged |
| `routing-policy/src/testing.ts` | edit — migrate `sampleRoutingPolicy` (`:165-211`) off the legacy blocks; the compatibility sample (`:202-211`) byte-unchanged |
| `routing-policy/src/registry.ts` | edit — retire the `roleAssignmentSchema` entry from `allSchemaFiles` (`:19-34`) as its subject dies |
| `routing-policy/src/index.ts` | edit — retire only the re-exports of removed types/schemas; `KNOWN_FRONTIER_BINDINGS, KNOWN_FRONTIER_MODELS, validatePolicy` (`:140`) and every surviving export untouched |
| `routing-policy/README.md` | edit — the documented shape (`:11`, `:18`, `:28-33`) and invariant list (`:75-94`, `:203-216`) reflect the post-cutover representation; the exit-code table (`:234`) untouched |
| `routing-policy/schemas/routing-policy.schema.json` | regenerate from the typed sources (the `generate.ts` parity chain) |
| `routing-policy/schemas/data-classification-rule.schema.json` | regenerate (drops `eligible_models`) |
| `routing-policy/schemas/class-entry.schema.json` | regenerate (only if the C5 placement touches it; shape stays `allowlist: string[]` + `ceiling_usd`) |
| `routing-policy/schemas/role-assignment.schema.json` | delete — its subject (`roles`) is removed (registry entry retired) |
| `routing-policy/tests/legacy-cutover.test.ts` | create — the cutover, window-end, equivalence, and inventory controls (Required Tests) |
| `routing-policy/tests/fallback-contract.test.ts` | edit — replace the deleted window test (`:577-585`) with its window-end inverse; migrate or retire the legacy cross-check controls (`:226`, `:506-515`); the Opus identity pins (`:188-189`) and `REPRESENTATION_INCOMPLETE_REFUSED` control (`:433-438`) stay |
| `routing-policy/tests/semantic-invariants.test.ts` | edit — retire controls whose subject died; retain and re-anchor the frontier/security controls (`:52-53`, `:66`, `:141-172`) |
| `routing-policy/tests/schema-validation.test.ts` | edit — schema-shape controls for the post-cutover document |
| `routing-policy/tests/parity.test.ts` | edit — sample/count updates for the regenerated schema set |
| `routing-policy/tests/cli.test.ts` | edit — only if fixture text carries legacy skeleton; the `security_flavored but allowlist contains non-frontier tier` pins (`:57`, `:91`, `:101`) survive in re-anchored form (C3.3) |
| `routing-policy/tests/fixtures/accept-shadow-route.yaml` | edit — migrate the legacy skeleton (`:24-47`) off the fixture |
| `routing-policy/tests/fixtures/reject-both.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-ceiling-missing.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-ceiling-zero.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-classification-gate.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-fallback-self-ref.yaml` | edit — same (its documented skeleton note, `:3-5`) |
| `routing-policy/tests/fixtures/reject-frontier-anchor.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-multiple.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-role-pinning.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-security-override.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-security-undeclared.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-structural.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-tier-not-eligible.yaml` | edit — same |
| `routing-policy/tests/fixtures/reject-transport-requirements.yaml` | edit — same |

**B. Evaluator consumer migration (C5):**

| Path | Change |
|---|---|
| `dispatch/src/routing-eval/index.ts` | edit — the selection walk (`:804-858`) and eligibility set (`:798-802`) read only the new representation; walk order, filter-never-reorder behavior (`:804-811`), result fields (`:158`), gate names (`:490-495`), and the C3.1 matching rule (`:813-820`) unchanged |
| `dispatch/tests/routing-eval.test.ts` | edit — fixture migration only (`:689-710` inline policy text); every assertion unchanged |
| `dispatch/tests/rcm-p4a-controls.test.ts` | edit — fixture migration only (`:258-324`); every assertion unchanged, incl. the gate-name pins (`:1137`, `:1151`) |

## Forbidden

- Any path not listed in Allowed Files. In particular: **`templates/**`** — the excluded-six scaffolder-owned files (`templates/foreman-routing-policy.yaml` carries a legacy skeleton at `:29-37`; hard bounds `docs/goals/routing-currency-and-merit/rcm-p2-scope-reconciliation-2026-09-27.md:49-52`, *"the six scaffolder-owned template files stay untouched"* `:138-141`; user diffs MD5-pinned at `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:457-462`) and `templates/pi-openrouter-routing.json` (SP11/O8 escalated overlap, `docs/specs/active/MRC-04-pmc-p3-pi-session-canon.md:92`) — inventoried and dispositioned only (C7, Out of Scope, Stop-and-Report #6).
- **The ratified contract surface** (A7 `charter.md:201`): the five PMC-P1 blocks' schemas and semantics (`compatibility`, `ranking_contract`, `lane_map`, `candidates`, `lane_routes`), `expertise_bindings`, the `Compatibility`/`LegacyRepresentation` types and schema (including `status: deprecated` / `removal_serialized_into: 'PMC-P4'` consts, `routing-policy.yaml:244-248`), `KNOWN_FRONTIER_MODELS` and `KNOWN_FRONTIER_BINDINGS` (charter A7 `:203-206`), and the landed refusal vocabularies (no renaming, no re-pinning).
- **No behavior change to selection semantics.** No dispatch-time cost sort, no reorder, no fallback substitution, no widening of any lane/tier/entitlement — the L5 A3-vs-D3 tension (`goal-status-report-2026-09-27.md:150`) is a human Gate-1 decision and is untouched (C5.4).
- **No schema/shape change to the untouched sub-shapes:** `schemas/lane-entry.schema.json`, `model-binding.schema.json`, `logical-candidate.schema.json`, `lane-route.schema.json`, `pi-openrouter-routing.schema.json`, `shadow-route.schema.json`, `transport-requirements.schema.json` stay byte-identical (equivalence evidence).
- **No host Pi configuration read/write** (`~/.pi`, `settings.json`, `models.json`, `enabledModels`) — ruling D (`goal-status-report-2026-09-27.md:83`).
- **No provider call, network call, credential inspection, or spend anywhere in halves (a)/(c)** (A6 row 1, `charter.md:181-185`); no smoke item is executed or claimed (C9).
- **No record rewriting** (`docs/goals/**` is never written; the PMC-P4 acceptance record is an MRC-01-class Stage-F act, Evidence Required #7); no `docs/specs/**` edits beyond this shaping act; no `receipts/**`, `contracts/**`, `hooks/**`, `skill-injection/**`, `ops-console/**`, `role-authority/**`, `worker-envelopes/**`, `approval/**`, `contract-readers/**`, `verification/**`, `spec-linter/**`, `project-scaffold/**`, `permission-profiles/**` edits (their inventory dispositions are evidence, not edits); no `routing-policy/src/{pi-resolver,pi-openrouter,route-receipt,config-repair-proposal,host-settings-proposal,generate}.ts` edits (consumed seams); no `routing-policy/tests/{pi-resolver,pi-resolver-recovery,pi-openrouter,rcm-predicates,launch-boundary,host-settings-proposal,expertise-vocabulary,entrypoint,config-repair-proposal,dependency-allowlist}.test.ts` or `pi-fixtures.ts` edits (equivalence evidence); no new npm dependency (`dependency-allowlist.test.ts` untouched); no weakening, renaming, or re-pinning of any existing control; no formatting sweeps beyond the listed files.

## Out of Scope

- **The smoke half's execution** — synthetic public lane tests, the clean Pi-session installation check, and the versioned model-quality review record are `blocked:G-LIVE` named-gate items (C9): never run, never claimed, never partially attempted by this parcel. Likewise G-AVAIL enablement claims (L1/L2/L3/L4/DELTA_L) and every activation/"current-best" claim (A6: `live-availability` and `model-quality` each need their own owner authorization).
- **Template migration** — `templates/foreman-routing-policy.yaml`'s legacy skeleton and `templates/pi-openrouter-routing.json`'s registry are owned elsewhere (Forbidden); their fate is a recorded lagging-consumer disposition (C7.3) and a named Stop-and-Report reading (#6), not an edit here.
- **Resolving the L5 cost-ordering tension** (`goal-status-report-2026-09-27.md:150`) or any Gate-1 reopening of RCM D3 / PMC A3.
- **Migration of any session/consumer module outside Allowed Files** (role-authority, worker-envelopes, ops-console, approval, contract-readers, hooks, skill-injection, spec-linter, verification, project-scaffold, docs/kickstarters quoting policy vocabulary) — inventoried and evidence-checked (C7), edited only under a ratified amendment.
- **Pi configuration/model enablement** (M4's PMC-P2 scope), resolver/launch-boundary changes (PMC-P2's A7 surface), the receipt/event path (MRC-02), dispatch chain semantics (MRC-05), and `routing-policy/src/pi-openrouter.ts` (ruling B: HRO additive author, `goal-status-report-2026-09-27.md:81`).
- **Goal-record writes** (the PMC-P4 acceptance record is an MRC-01-class Stage-F act) and merges/releases/installation/activation (Gate 3, owner-owned).
- **RB-6 catalogue bytes capture** (MRC-20) and every other §7 task's scope.

## Contract

Authority quotes are verbatim. Every seam is anchored as observed on disk 2026-09-28 and is subject to mandatory Step-0 re-attestation (C0).

### C0 — Anchor inventory and the anchor-drift rule (Step 0, mandatory)

| Seam | Anchor (observed 2026-09-28) | Used for |
|---|---|---|
| A5.5 cutover authority | `charter.md:171-176`; `gate-1-amendment-01.md:84-87,132,144` | C2 |
| A6/A7/A8 | `charter.md:178-190,196-210,216`; exit criteria `:320-328` | C1, C8, C9 |
| Legacy blocks | `routing-policy.yaml` `roles` `:141-145`, `model_tiers` `:146-196`, `eligible_models` `:61-140`; enumeration `compatibility.legacy_representation.blocks` `:245` | C3 |
| Window mechanics | dual-rep note `routing-policy.yaml:214-218`; optionality comment `schemas.ts:629-633`; legacy-only test `fallback-contract.test.ts:577-585`; `REPRESENTATION_INCOMPLETE_REFUSED` `validator.ts:445-454` | C4 |
| Legacy validator machinery | `validator.ts:84-126` (narrowing + roles pins), `:162-171` (frontier anchoring over `model_tiers`), `:213-233` (tier-eligibility), `:722-741` (R1 legacy cross-check) | C3 |
| Retained invariants | `validator.ts:129-155` (security override), `:189-207` (transport), `:259-283` (shadow); pins `cli.test.ts:57,91,101`, `semantic-invariants.test.ts:52-66,141-172` | C3.3 |
| Evaluator legacy reads | `dispatch/src/routing-eval/index.ts:798-802` (`dataClassRule.eligible_models`), `:856-858` (`policy.model_tiers[tier]`), walk contract `:804-811`, result/gates `:158,:490-495`, C3.1 `:813-820` | C5 |
| Migration inventory | `pmc-p1-fallback-contract-2026-09-26.md:131-160` | C7 |
| Templates | `templates/foreman-routing-policy.yaml:29-37`; `project-scaffold/src/manifest.ts:136-137`; MRC-04 bounds `docs/specs/active/MRC-04-pmc-p3-pi-session-canon.md:88-92,116-120` | C7.3 |
| Collision map | HCS `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:91,197-206` | Collision Risk |
| Chain sequencing | `goal-status-report-2026-09-27.md:114,133,143,150`; `docs/goals/model-routing-chain-wrapper/dispatch-table.md:31`; `loop-directive.md:8,46` | C2, C9 |

**At build Step 0 every anchor is re-attested against the then-current tree** (MRC-12 C0 precedent); any anchor that moved, was renamed, or changed shape triggers Stop-and-Report #2 before work proceeds. The second-writer rule additionally requires re-read + full-suite re-run.

### C1 — Three halves and the gate discipline

1. **(a) STATIC/CONFORMANCE half** (C8): static/config/schema tests, fallback simulations, route/evidence assertions — every one **no-provider-call**; the receipt attests `static-conformance` only (A6 row 1) and enumerates every unproven live/quality claim by name (A6/A8).
2. **(b) SMOKE half** (C9): three items, each tagged `blocked:G-LIVE`, modeled on MRC-10's named-gate pattern (`docs/specs/active/MRC-10-hro-p4b-config-repair-proposals.md:130,148`: gates appear only as `state: 'named-gate'` items and evidence status lines — *"named, never satisfied, never invented"*). This parcel neither runs them nor claims them; the wrapper never satisfies external gates (D5, `docs/goals/model-routing-chain-wrapper/charter.md:33`).
3. **(c) LEGACY CUTOVER** (C2–C7): the removal at `CUTOVER-P4`.
The split is load-bearing: halves (a) and (c) are fully provable with zero provider calls and zero spend, so G-LIVE blocks only (b) and never blocks implementation completion (A8, `charter.md:216`).

### C2 — The named cutover condition: `CUTOVER-P4`

The ratified corpus names the condition without giving it a canonical identifier — A5.5 says removal is *"serialized into PMC-P4 behind a named cutover condition"* (`charter.md:174-176`), the ratification fixes its style and site (*"deprecation window, removal in P4"*, `gate-1-amendment-01.md:144`), the policy encodes `removal_serialized_into: PMC-P4` (`routing-policy.yaml:248`), and PMC-P1 pins its effect (*"the legacy blocks remain valid and authoritative for them until PMC-P4's named cutover"*, `pmc-p1-fallback-contract-2026-09-26.md:158-160`). **This spec names it `CUTOVER-P4`** (naming is a shaping act; substance is the ratified text; the naming and the predicate reading are surfaced at dispatch — Stop-and-Report #3).

`CUTOVER-P4` holds — and removal may execute — exactly when all four predicates are proven:

| # | Predicate | Evidence |
|---|---|---|
| P1 | The STATIC/CONFORMANCE half is green on the pre-removal tree | C8 command output; `static-conformance` receipt |
| P2 | Lane G slot 11 dispatch order is satisfied: MRC-04/05/06 windows closed, one active writer on `routing-policy/**` + `dispatch/**` | `goal-status-report-2026-09-27.md:114,143`; second-writer re-read + full-suite re-run (`loop-directive.md:8`) |
| P3 | Migration-inventory evidence complete: every PMC-P1 §5 consumer dispositioned (migrated / proven non-reader / named lagging consumer) | C7 inventory table |
| P4 | No inventoried consumer fails silently after removal: every non-migrated consumer's post-cutover failure mode is a typed refusal or a loud typed error, never silent wrong output | C7 fail-loud column; Stop-and-Report #9 |

What `CUTOVER-P4` authorizes is exactly the enumeration in `compatibility.legacy_representation.blocks` (`routing-policy.yaml:245`) — `model_tiers`, `roles`, `data_classification.eligible_models` — plus the machinery that exists solely for them (C3). Nothing else. The A5.5 clause *"so a lagging consumer cannot block the contract parcel"* (`charter.md:175-176`) is honored by P3/P4's record-and-proceed discipline for named lagging consumers (C7.3), never by weakening the removal.

### C3 — Removal scope: what dies, what must not

1. **Dies (the deprecated representation):** the three blocks (C0 anchors) and the `openrouter-slug-only` policy-entry vocabulary; the validator machinery whose only subject is those blocks (`validator.ts:84-126` narrowing/roles pins, `:162-171`, `:213-233`, `:722-741`); `roleAssignmentSchema` and its registry entry; the legacy fields of the typed sources and canonical samples; the legacy skeletons in the 14 fixtures; the window test (`fallback-contract.test.ts:577-585`); the dual-representation commentary (`routing-policy.yaml:214-218`).
2. **Survives untouched (the ratified contract surface, A7):** the five PMC-P1 blocks and their schemas/semantics, the `compatibility` declaration itself (including the `legacy_representation` record with its pinned `deprecated`/`PMC-P4` consts — it becomes a true historical statement, not a stale one), `KNOWN_FRONTIER_MODELS` and `KNOWN_FRONTIER_BINDINGS` (charter A7 `:203-206` names `KNOWN_FRONTIER_MODELS` as the reviewed registry carrying the ratified Opus 5.5 selection; it is not one of the three enumerated legacy blocks — Stop-and-Report #4 carries the alternative deletion reading), and the landed refusal vocabularies.
3. **Survives re-anchored (charter-protected invariants):** the security-override invariant (`validator.ts:129-155`) and frontier anchoring — the frontier/security invariants the PMC-P1 outcome was required to retain (`pmc-p1-fallback-contract-2026-09-26.md` §2 item 1) — re-anchored to the surviving registry constants and the ordered source; the transport invariants (`:189-207`; runtime reads `pi-resolver.ts:1171,1273,1631,2473`); the shadow-route containment (`:259-283`).
4. **Evidence provenance (A6 discipline):** every binding `data_classes` envelope that names `source: data_classification.eligible_models` (e.g. `routing-policy.yaml:389` and the other openrouter bindings) is re-sourced to the historical transcription record (`pmc-p1-fallback-contract-2026-09-26.md` §2 item 3 / §5) with a cutover annotation. After removal, no evidence envelope may name a removed block as its **current** source of truth.

### C4 — Window-end rules: the fate of legacy-only documents

During the window a legacy-only document stays valid (`fallback-contract.test.ts:577`; `routing-policy.yaml:218`: *"a document carrying only the legacy blocks remains schema-valid"*). `CUTOVER-P4` ends the window (A5.5). Post-cutover rules, each a named control:

1. A document carrying **any** of the three blocks is refused with the typed `LEGACY_REPRESENTATION_REFUSED` naming the block (schema + validator; the block is never silently ignored).
2. A **legacy-only** document is refused: its blocks are refused (rule 1) and the five PMC-P1 blocks are now required — the window-end inverse of the deleted test (Required Tests #2).
3. A **dual** document must drop the legacy blocks; keeping them is rule 1's refusal.
4. The five blocks become **required** (the `schemas.ts:629-633` optionality was the deprecation-window accommodation whose removal is this parcel's serialized act); `REPRESENTATION_INCOMPLETE_REFUSED` (`validator.ts:445-454`) stays for partial five-block sets. The alternative reading (keep optionality + explicit empty-document refusal) is surfaced, never chosen silently (Stop-and-Report #5).

### C5 — Consumer migration: the evaluator and selection-order preservation (D3)

The load-bearing consumer is the dispatch evaluator named in the inventory (`pmc-p1-fallback-contract-2026-09-26.md:141-142`): its eligibility set reads `data_classification.<tier>.eligible_models` (`dispatch/src/routing-eval/index.ts:798-802`) and its selection walk reads `policy.model_tiers[tier]` (`:856-858`) — both removed sources. Migration requirements, all equivalence-provable:

1. **Behavior preservation.** For every `(routing_class, data_classification)` input, the selected logical candidate and its group/tier label are **identical pre/post** (equivalence corpus, Required Tests #3). First-eligible-in-fixed-order survives: the C3 gate keeps FILTERING within the order, never reordering (`:804-811` — *"the walk order itself is untouched — the C3 dispatch gate (MRC-05) FILTERS within the order, never reorders it (D3/D4)"*).
2. **The ordered source stays explicit policy data** (RCM D3's fixed selection order — never derived from price, context, or quality at dispatch time), keyed in the **provider-neutral** vocabulary with referential integrity to `candidates` (the A5.3 dangling/self-reference pattern). No bare-slug policy entries survive outside provider-local binding `model` fields. Placement (a provider-neutral ordered tier-group map vs per-class ordered candidate lists) is a builder choice within these bounds and is recorded in the completion report; any placement that re-introduces an `openrouter-slug-only`-keyed block is a Stop-and-Report (#7).
3. **MRC-05's result contract is consumed unchanged.** `DispatchResolution` fields (`:158` — `resolvedTier` keeps its group label), the route-explanation gate names (`class_allowlist`, `data_class_eligible_models`, `capability_predicate`, `context_floor`, `:490-495`; pins `rcm-p4a-controls.test.ts:1137,1151`), and the C3.1 binding-matching rule (`:813-820`) are byte-stable; the two dispatch test files change **fixtures only**.
4. **The L5 tension stays untouched.** No cost-ordering is added or removed anywhere (`goal-status-report-2026-09-27.md:150`: *"until decided, L5 cost ordering stands as ratified rubric text"*); the walk remains fixed-order first-eligible.

### C6 — Refusal vocabulary

`LEGACY_REPRESENTATION_REFUSED` is a typed addition to the contract refusal family (`types.ts`, the `CONTRACT_REFUSALS` vocabulary PMC-P1 pinned — record §2 item 10); its name is asserted by control. Every cutover refusal is typed and named; no untyped free-text error carries the window-end rules.

### C7 — Migration inventory evidence (the A5.5 deliverable)

A re-attested inventory of every PMC-P1 §5 consumer (`pmc-p1-fallback-contract-2026-09-26.md:131-160`), each with exactly one disposition and its evidence:

1. **Proven non-reader** — grep evidence of zero read sites of the three blocks. Observed 2026-09-28 as comment/config-path/manifest references only: `role-authority/src/{roles,data-classification}.ts`, `worker-envelopes/src/{routing,result-envelope}.ts`, `ops-console/src/{routing,config}.ts`, `approval/src/{cli,index}.ts`, `contract-readers/src/registry-data.ts`, `hooks/model-gate.policy.json`, `skill-injection/src/cli.ts`, `spec-linter/src/grandfather.ts`, `verification/src/{d19-audit,ratified-packages}.ts`, `project-scaffold/src/manifest.ts:136-137` (copies template bytes; parses no policy field). Re-attested at Step 0, not assumed.
2. **Migrated in this packet** — `routing-policy/**` (A) and the evaluator + its two test files (B).
3. **Named lagging consumer** — owner, observed file evidence (line refs/MD5), and exact post-cutover failure mode, per the A5.5 lagging-consumer clause. Today exactly the template family qualifies: `templates/foreman-routing-policy.yaml` (legacy skeleton `:29-37`; owner: `plugin-packaging-and-scaffolder` canon workstream; hard bounds cited in Forbidden) and `templates/pi-openrouter-routing.json` (its registry is the P2/HRO mapping contract — **not** any of the three blocks — inventoried out of removal scope; deferred-instance disposition `docs/specs/active/MRC-04-pmc-p3-pi-session-canon.md:120`).
A consumer discovered at Step 0 outside these classes stops the cutover (P3/P4 unmet → Stop-and-Report #9).

### C8 — STATIC/CONFORMANCE half (execution + receipt)

Execute over the post-cutover tree (commands below): static/config/schema tests (`schema-validation`, `semantic-invariants`, `parity`, `cli`), fallback simulations (`fallback-contract`, `pi-resolver-recovery`), route/evidence assertions (`launch-boundary`, the route-receipt/`pi-resolver` families) — all no-provider-call, satisfying exit criterion 4's static part (`charter.md:320-322`) and A8's *"Exit criteria 4 and 5 are satisfied by `static-conformance`"* (`:216`). The completion receipt attests **`static-conformance` only** and enumerates by name every claim that remains unproven (A6 `:186-190`): `AVAILABILITY_UNVERIFIED`, `QUALITY_UNRECORDED`, `DELTA_L_UNSET`, `L1_PINNED_PROVIDER_UNSET`/`L2_PINNED_PROVIDER_UNSET`, `L3_PROVIDER_PREFERENCE_UNSET`/`L4_PROVIDER_PREFERENCE_UNSET`, `DATA_CLASS_UNKNOWN`, `CONTEXT_UNKNOWN`/`COST_UNKNOWN`, and the open gates **G-LIVE** (smoke half), **G-AVAIL** (enablement), **G-MERGE** (Gate-3 merges). A green static suite is never evidence that any model is reachable or performant (`charter.md:190-193`).

### C9 — SMOKE half — `blocked:G-LIVE` named-gate items (never run here)

Each item appears only as a checklist entry and evidence status line (`state: 'named-gate'`, `gate: 'G-LIVE'`); no code, fixture, or receipt may claim one is closed (MRC-10 C4.2/C4.3 pattern):

1. **`blocked:G-LIVE` — synthetic public lane tests.** Exit criterion 5 (`charter.md:323-325`): *"Synthetic public smoke tests prove normal execution, provider-local OpenRouter failure handling, explicit cross-provider handoff, preservation of reviewer independence, and stop/report when both routes fail."*
2. **`blocked:G-LIVE` — clean Pi-session installation check.** The charter's named rollout item (`:93`); installation is a Gate-3-family act the charter does not grant (`:342`) and a live host/session act (ruling D, `goal-status-report-2026-09-27.md:83`).
3. **`blocked:G-LIVE` — the versioned model-quality review record.** The charter's named rollout item (`:93`); the A6 `model-quality` state requires its own owner authorization (`charter.md:189-190`) before any "current-best" claim.
Status lines at completion: `G-LIVE = open (owner-authorized credentials/budget for synthetic live provider calls) — not satisfied by this parcel`.

### C10 — Data class, spend, rollback, review

**Data class:** internal — policy/validator/evaluator code and repo-internal routing metadata only; no credentials, no host paths, no provider payloads (D2). **Spend:** zero for halves (a)/(c) — no provider call, network call, or paid experiment is made or implied; the smoke items carry no spend authority and are never executed (C9). **Rollback:** revert this packet's diff — the three legacy blocks and their machinery are restored from the pre-cutover tree state, the removed `role-assignment.schema.json` is restored, and the fixtures/tests return with them; the touched files carry no runtime state, so no data migration exists. Post-cutover documents that dropped legacy blocks validate again under the restored schema (the restored schema requires the blocks; the policy document itself is restored wholesale by the revert). **Review:** two independent adversarial reviews (`charter.md:209-210`; wrapper D6 `:34`); reviewers never fix or commit; the coordinator records the triage.

## Existing Patterns To Follow

| Pattern | Source | How this parcel follows it |
|---|---|---|
| Named gates: named, never satisfied, never invented | MRC-10 C4.2/C4.3 (`docs/specs/active/MRC-10-hro-p4b-config-repair-proposals.md:130,148`) | the three `blocked:G-LIVE` items (C9) |
| Dual representation + compatibility versioning | PMC-P1 A5.5 (`routing-policy.yaml:241-248`; `schemas.ts:629-633`) | its window mechanics end here (C4); the declaration block stays |
| Named-negative-control test style with falsifiability pairs | `routing-policy/tests/fallback-contract.test.ts` (24 contract negatives); `rcm-predicates.test.ts:26-38` | cutover refusals asserted by **name**; green-by-absence pairs (Required Tests) |
| Referential-integrity refusals | `FALLBACK_SELF_REFERENCE`/`FALLBACK_DANGLING_REFERENCE` + `tests/fixtures/reject-fallback-self-ref.yaml` (record §2 items 4, 11) | the ordered source's candidate references (C5.2) |
| Typed refusals returned, never thrown; fail closed | `validator.ts` error lists; `RESOLVER_*`/`CONTRACT_*` vocabularies (record §2 item 10) | `LEGACY_REPRESENTATION_REFUSED` (C6) |
| Evidence envelopes `{state: declared, value, source}` / `{state: …, residual: <named>}` | `routing-policy.yaml:337-342`; record §3 | provenance re-sourcing (C3.4); unproven claims enumerated (C8) |
| Schema/typed-source parity chain with no-drift test | `src/registry.ts:19-34` + `generate.ts` + `tests/parity.test.ts` | regenerated schemas; untouched sub-shapes byte-identical |
| User-diff preservation with MD5 evidence | PMC-P1 §7 (`pmc-p1-fallback-contract-2026-09-26.md` §7) | SP16 preservation of `routing-policy.yaml` outside the removed blocks |
| Fixture-migration-only edits to landed acceptance tests | MRC-05's gate-name pins (`dispatch/tests/rcm-p4a-controls.test.ts:1137,1151`) | assertions untouched; inline policy text migrated |
| Anchor inventory + mandatory Step-0 re-attestation | MRC-12 C0 (`docs/specs/active/MRC-12-hro-p4c-recovery-diagnostics.md`) | C0 here |

## Required Tests / Verification

Exact commands:

- From `plugins/foreman-line/routing-policy/`: `npm test`, `npm run typecheck`, `npm run lint`, `node --version`, and the scoped `npx tsx --test tests/legacy-cutover.test.ts`.
- From `plugins/foreman-line/dispatch/`: `npm test`, `npm run typecheck`, `npm run lint`.
- Per the second-writer rule (`docs/goals/model-routing-chain-wrapper/loop-directive.md:8`), Step 0 and completion each require the **full-suite re-run** after re-reading the then-current tree. Toolchain failure is recorded verbatim as a STOP flag (Stop-and-Report #11).

Test content (permanent, in `routing-policy/tests/legacy-cutover.test.ts` plus the named edits):

1. **Cutover refusal controls (C4):** each of the three blocks refused **by name** (`LEGACY_REPRESENTATION_REFUSED` naming `model_tiers` / `roles` / `data_classification.<tier>.eligible_models`); a legacy-only document refused; a dual document refused; a partial five-block set refused (`REPRESENTATION_INCOMPLETE_REFUSED`, retained); a new-only document validates with zero errors (falsifiability pair: adding any legacy block turns the document red).
2. **Window-end inversion (C4.2):** the deleted `fallback-contract.test.ts:577-585` control is replaced by its named inverse (*"a legacy-only document is refused once `CUTOVER-P4` ends the deprecation window"*) — the old assertion is deleted, never re-pinned.
3. **Selection equivalence corpus (C5.1):** for the full fixture matrix of `(routing_class × data_classification)`, the selected logical candidate and its group label are identical between the recorded pre-cutover expectations (captured in the test as the migration oracle) and the post-cutover walk; the C3 gate still filters without reordering (a later selectable candidate never jumps ahead of an earlier ineligible one — named falsifiability pair).
4. **Result-contract stability (C5.3):** `dispatch/tests/routing-eval.test.ts` and `dispatch/tests/rcm-p4a-controls.test.ts` pass with fixture migration only — gate names (`class_allowlist`, `data_class_eligible_models`, `capability_predicate`, `context_floor`), `resolvedTier` labels, and the C3.1 matching rule byte-stable.
5. **Referential integrity (C5.2):** an ordered-source entry naming a missing candidate is refused (dangling); a self-referential entry is refused; both by name.
6. **Provenance discipline (C3.4):** a scan over the post-cutover policy document finds no evidence envelope naming a removed block as its current `source`.
7. **Retained invariants (C3.3):** the security-override controls (`cli.test.ts:57,91,101` pins) and frontier-anchoring controls (`semantic-invariants.test.ts:52-66,141-172`, incl. the `KNOWN_FRONTIER_MODELS` Opus pins `fallback-contract.test.ts:188-189`) stay green in re-anchored form; removing the re-anchored check turns them red.
8. **Parity/no-drift (C3.2):** regenerated schemas match the typed sources; the untouched sub-shapes (`lane-entry`, `model-binding`, `logical-candidate`, `lane-route`, `pi-openrouter-routing`, `shadow-route`, `transport-requirements`) are byte-identical (hash comparison in `parity` or the completion evidence).
9. **Equivalence evidence — everything unedited stays green with zero edits:** `routing-policy/tests/{pi-resolver,pi-resolver-recovery,pi-openrouter,rcm-predicates,launch-boundary,host-settings-proposal,expertise-vocabulary,entrypoint,config-repair-proposal,dependency-allowlist}.test.ts` and every non-listed suite.
10. **Migration-inventory control (C7):** the completion evidence carries the machine-checked inventory table (consumer → disposition → evidence ref) covering every `pmc-p1-fallback-contract-2026-09-26.md:131-160` entry; a consumer present in the record but absent from the table fails the control.

**Mandated reviewer focus questions** (assess these field-by-field):

- Does the equivalence corpus genuinely pin D3's fixed selection order, or does any placement let price/context/quality leak into dispatch-time ordering (the L5 tension, `goal-status-report-2026-09-27.md:150`)?
- Can a legacy-only or dual document slip through any path (CLI, `validatePolicy`, evaluator input seam, fixtures) without a named refusal?
- Does any evidence envelope, message, or exported name still present a removed block as a current source of truth — and is `KNOWN_FRONTIER_MODELS`'s retention genuinely non-legacy (charter A7) rather than dead weight by another name?
- Is the template family's lagging-consumer disposition honest about its post-cutover failure mode and owner, or does it quietly assume a migration nobody owns?
- Does any `blocked:G-LIVE` item leak into claimed evidence (a receipt implying `live-availability`/`model-quality`)?

## Acceptance Criteria

1. **Conformance (charter `:93`, exit criterion 4 `:320-322`):** the static/config/schema tests, fallback simulations, and route/evidence assertions all pass with **no provider call**; the completion receipt attests `static-conformance` only and enumerates every unproven live/quality claim by name (A6/A8).
2. **Smoke split (charter `:93`; report `:114,:133`):** the three smoke items exist as `blocked:G-LIVE` named-gate status lines and nothing claims them closed; no credential, provider call, or spend occurs anywhere in the packet.
3. **Named cutover (A5.5):** removal executes only with `CUTOVER-P4` predicates P1–P4 proven; the removed set is exactly `compatibility.legacy_representation.blocks` plus their exclusive machinery (C3.1); the ratified contract surface is byte-unchanged (C3.2).
4. **Window end (A5.5 window rules):** legacy-only documents are refused; dual documents must drop the legacy blocks; the five blocks are required; every refusal is typed and named (`LEGACY_REPRESENTATION_REFUSED`).
5. **Consumers (A5.5 inventory; report `:114`):** the evaluator and its tests run on the new representation only with selection behavior preserved (equivalence corpus green; MRC-05's result contract byte-stable); the migration inventory dispositions every PMC-P1 §5 consumer with evidence; named lagging consumers carry owner + fail-loud disposition.
6. **Invariants retained (PMC-P1 charter item 1):** the frontier and security invariants remain enforced (re-anchored), `KNOWN_FRONTIER_MODELS`/`KNOWN_FRONTIER_BINDINGS` untouched, transport/shadow invariants untouched.
7. **Verification (wrapper D7 `:35`):** both packages' suites/typecheck/lint pass; the diff is exactly the Allowed Files entries; every unedited suite passes with zero edits; user content in `routing-policy.yaml` outside the removed blocks is preserved (MD5 evidence).
8. **Review (charter `:209-210`):** two independent adversarial reviews completed and triaged; reviewers never fixed or committed.
9. **Closure evidence:** the PMC-P4 acceptance record is named as an MRC-01-class Stage-F act (not performed here), carrying this C0 inventory + control list + the enumerated unproven claims.

## Evidence Required

1. Command output for both packages (`npm test`, `npm run typecheck`, `npm run lint`, `node --version`, scoped `legacy-cutover.test.ts` run), from `plugins/foreman-line/routing-policy/` and `plugins/foreman-line/dispatch/`.
2. **`CUTOVER-P4` predicate proofs:** P1 receipt reference; P2 window/sequencing evidence (second-writer re-read + full-suite re-run); P3 inventory table; P4 fail-loud column for every non-migrated consumer.
3. **Migration inventory table** (C7): every `pmc-p1-fallback-contract-2026-09-26.md:131-160` entry with disposition, evidence ref (grep output / line refs / MD5), owner, and post-cutover failure mode.
4. **Equivalence evidence:** the pre/post selection corpus table `(routing_class × data_classification) → {selected candidate, group label}` and the byte-identity proof for the untouched sub-shapes and the MRC-05 result-contract fields/gate names.
5. **Refusal and window-end inventory:** the final test names for Required Tests 1–7 with their falsifiability pairs (new-only document green; +any legacy block red; removing the re-anchored frontier check turns the anchors red).
6. **`blocked:G-LIVE` status lines** (three, verbatim, per C9) plus the G-AVAIL/G-MERGE enumerations from the C8 receipt.
7. **Review record: 2 independent reviews** with the coordinator's triage notes (charter `:209-210`).
8. **PMC-P4 acceptance record (closure requirement, not performed here):** items 1–7 written into the `pi-model-configuration` goal record via an MRC-01-class Stage-F record act.

## Collision Risk (Lane G slot 11)

Write set $W$ = the 35 Allowed Files: 32 in `routing-policy/` (SP8) and 3 in `dispatch/` (SP9 — the evaluator and its two test files) — see the tables above for exact membership. Disjointness proof vs the §7 lanes (`goal-status-report-2026-09-27.md:113-126`, strict order `:143`) and the HCS collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`):

- **SP8 (`routing-policy/`, `:197`) — Lane G slot 11, the last writer.** Wrapper D4 (`docs/goals/model-routing-chain-wrapper/charter.md:32`) and the strict order admit this parcel only after MRC-12's window closes; every earlier Lane G write set (MRC-02/03/05/06/08/10/12) is superseded by sequencing. Step 0 diffs each landed window's surfaces against $W$ (the MRC-12 precedent) and reports overlap before work proceeds.
- **SP9 (`dispatch/`, `:198`) — the evaluator migration is inside Lane G's own serialization** (wrapper D4 covers `routing-policy/**` **and** `dispatch/**`). MRC-05's and MRC-06's windows are closed predecessors (`:114`); $W$ touches only `dispatch/src/routing-eval/index.ts` and its two test files — `dispatch/src/routing-eval/shadow.ts` (reads `shadow_routes` only) and `dispatch/src/pi-entry/**` (MRC-06's surface) are **not** in $W$.
- **SP13 (`:202`, serialization-point family incl. barrel exports):** $W$ touches exactly one family member — `routing-policy/src/index.ts` — as the single active claimant within its window (retiring dead re-exports only); **wait/escalate** if a second claim appears mid-window, never co-write (wrapper D10 `:38`).
- **SP16 (`:205`, user-owned `routing-policy/routing-policy.yaml`):** the removal half necessarily edits this file — pre-announced by the wrapper row (`goal-status-report-2026-09-27.md:114`: *"Legacy removal half touches `routing-policy` representation"*) and charter-owned (A7 gives PMC-P4 the removal). Discipline: user content outside the three removed blocks and their commentary is preserved byte-for-byte with MD5 evidence (PMC-P1 §7 pattern); if the removed blocks themselves carry user-owned modifications observed at Step 0, that is Stop-and-Report #1 (developer authorization), not a judgment call.
- **SP17 (`:206`, shared `routing-policy/tests/`):** $W$ edits existing test files and adds one new file; prior claims are closed windows (file-disjoint after sequencing). RCM-P1's frozen-footprint branch merge (`routing-policy/README.md` is in $W$) binds the second-writer rule if it lands mid-window: re-read + full-suite re-run; a real file collision → **wait/escalate**, never co-write.
- **SP11/O8 (`templates/`, `:91,:200`) — NOT in $W$** (Forbidden): the template family is inventoried and dispositioned as named lagging consumers (C7.3); a coordinator-ratified amendment would be required to edit it (Stop-and-Report #6).
- **Lane P-A / P-R / X / GMF** (`goal-status-report-2026-09-27.md:142-145`): MRC-01/04/20/21 write records/canon/external rows; MRC-14/15/16 read receipt evidence; MRC-17–19 consume downstream; GMF is separate Keon repos — none writes $W$, and $W$ writes no records (Evidence #8 is outside $W$).
- **Checked non-contact:** `receipts/**`, `contracts/**`, `routing-policy/src/{pi-resolver,pi-openrouter,route-receipt,generate,config-repair-proposal,host-settings-proposal}.ts`, `routing-policy/schemas/{lane-entry,model-binding,logical-candidate,lane-route,pi-openrouter-routing,shadow-route,transport-requirements}.schema.json`, `routing-policy/tests/dependency-allowlist.test.ts` (no new npm dependency).

**Verdict: dispatchable in Lane G slot 11 after MRC-12's window closes (and with MRC-04/05/06 landed per the report row). Last writer on SP8/SP9 by the wrapper's strict order; single claimant on the touched SP13 barrel and the SP17 test files; SP16 carried by pre-announcement + byte-preservation evidence; `templates/` deliberately outside $W$ (inventory + STOP path). The principal risks are anchor drift across the closed windows (C0), the SP16 user-content question, and the template lagging-consumer reading — all carried by Step-0 re-attestation and the STOP rules below.**

## Stop-and-Report Rule

Stop the affected work and report the exact blocker (coordinator resolves; never conceal through fallback, weakened controls, or a fabricated receipt) when any of the following occurs:

1. Implementation requires any path outside Allowed Files — in particular any `templates/**` file (including `templates/foreman-routing-policy.yaml`), any goal record, `docs/specs/**`, `receipts/**`, `contracts/**`, or a non-listed `routing-policy/` or `dispatch/` file — await a coordinator-ratified spec amendment per SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-140`). Likewise if the removed blocks in `routing-policy/routing-policy.yaml` carry user-owned modifications (SP16): developer authorization first.
2. **Any C0 anchor does not reproduce at Step 0** (prior Lane G windows, RCM-P1's frozen branch, or in-flight sibling parcels) — surface corrected anchors and the behavioral delta before proceeding; the second-writer rule binds regardless.
3. **The `CUTOVER-P4` naming or predicate reading is contested** — the corpus names the condition without a canonical identifier (`charter.md:175`; `pmc-p1-fallback-contract-2026-09-26.md:135-136,159-160`), and A5.5's clause *"so a lagging consumer cannot block the contract parcel"* has two readings (it protects PMC-P1 only, requiring all consumers migrated before removal — the report `:114` sequencing reading — or it also permits removal with named lagging consumers recorded — the reading this spec executes, bounded by fail-loud P4). Surface both readings with this spec's choice; never resolve it silently.
4. **The `KNOWN_FRONTIER_MODELS` disposition is contested** — this spec retains it (charter A7 `:203-206` names it as the reviewed registry carrying the ratified Opus 5.5 selection; it is not among the three enumerated legacy blocks). If the owner/coordinator reads the cutover as requiring its deletion with the dead invariant, surface before any edit (the constant and its pins stay either way until ruled).
5. **The five-block required-ness flip is contested** (C4.4's alternative reading: keep optionality and add an explicit empty-document refusal) — surface both readings; the window-end rule (legacy-only refused) is non-negotiable under either.
6. **The template family's disposition is contested or would be silently broken** — `templates/foreman-routing-policy.yaml` carries the legacy skeleton (`:29-37`) under other owners' hard bounds; the two readings (coordinator-ratified amendment adding the file to $W$ vs owner-migrated carry with recorded lagging status) are surfaced at dispatch; never edit the file without the amendment, never pretend it migrated.
7. Any requirement would cost-sort, reorder, substitute fallbacks, or otherwise resolve the L5 A3-vs-D3 tension (`goal-status-report-2026-09-27.md:150`) — that is a human Gate-1 decision; the walk's fixed-order semantics are preserved, never changed. Likewise any ordered-source placement that re-introduces an `openrouter-slug-only`-keyed block or an unreviewed authority map change.
8. A control can only pass by weakening, renaming, or re-pinning an existing control (incl. the MRC-05 gate names/fields, the `cli.test.ts` security pins, the `KNOWN_FRONTIER_MODELS` Opus pins) — stop; a weakened control is never the fallback.
9. **Any inventoried consumer would fail silently after removal** (P4) or is discovered outside C7's three dispositions — stop and report the consumer, its read sites, and the proposed disposition; record-and-proceed applies only to fail-loud named lagging consumers.
10. Any pressure to run a `blocked:G-LIVE` smoke item, inspect credentials, make a provider call, spend budget, install Pi, or claim `live-availability`/`model-quality`/activation — stop (wrapper D5 `:33`; A6 `charter.md:186-190`); a named gate is never satisfied by this parcel.
11. `routing-policy` or `dispatch` checks fail on the toolchain (node/tsx/typescript/biome) — record the exact output as a STOP flag; engines and dependencies are never edited.
12. A live write claim by another parcel appears on `routing-policy/**` or `dispatch/**` (SP8/SP9/SP13/SP17) — the map's verdicts are `wait`/`escalate`, never co-write (wrapper D10 `:38`).
13. Authority text is ambiguous on scope this spec resolves by reading — e.g. whether `compatibility.legacy_representation`'s pinned `deprecated`/`PMC-P4` consts are left as the ratified historical record (this spec's reading, C3.2) or updated to a post-removal status (a contract-surface change needing ratification), or whether the evaluator's ordered-source placement may touch `classes` (this spec: only within C5's bounds, recorded in the completion report) — surface the question with the two readings; never pick one silently.

### Amendment A2 (coordinator-ratified 2026-09-28 at the builder's Stop #1/#8 collision, before code per SPEC-CONVENTION §4.8)

Ruling on the 3-way collision (equivalence oracle needs the 8 candidate-less legacy slugs as candidate bindings; host-settings-proposal.test.ts pins `adds.length === 15` + a byte-no-drift proposal artifact; both pinned files are outside the Allowed Files):

- **A2.1 — the selection-only marker (in-set, the mechanism):** the new representation's binding model gains an OPTIONAL `selection_only: boolean` marker (default absent = false = enablement-eligible). The 8 migration identities (`nvidia/nemotron-3.5-lightning`, `z-ai/glm-5.3`, and the other 6 candidate-less legacy slugs) are added as minimal candidate bindings carrying `selection_only: true` — their ONLY lawful home for the C5.1/C5.3 oracle (selection identities, never enablement targets: they have no host enablement surface). Marker lands in the in-set files: `routing-policy/src/types.ts`, `src/schemas.ts`, `schemas/*.schema.json` (regenerated), `routing-policy/routing-policy.yaml` (SP16 delta recorded).
- **A2.2 — the derivation-contract amendment (out-of-set, bounded):** `routing-policy/src/host-settings-proposal.ts` is ADDED to Allowed Files for exactly one bounded change: the enablement-adds derivation excludes `selection_only: true` bindings (plus a comment naming this amendment). Rationale: those bindings are selection identities with no host enablement target — deriving enablement adds from them would propose enabling models that have no enablement surface. Pre-marker documents behave identically (absent marker = eligible), so the change is backwards-compatible. **`host-settings-proposal.test.ts` and the committed proposal artifact remain OUT of the Allowed Files and UNTOUCHED** — with A2.2 the M4 pin (`adds.length === 15`) holds unchanged (adds stay exactly the ratified 15) and the no-drift pin holds unchanged (the generator's output is byte-identical). The ratified charter-matrix enablement surface does NOT grow.
- **A2.3 — rejected alternatives (record):** (A) touching the M4 pin/artifact to grow the enablement surface (15→16+) is rejected — unnecessary and an owner-ratified surface change; (C) weakening the C5.1/C5.3 oracle is rejected — it is the migration oracle (Stop #8 class).
- **A2.4:** everything else in this spec stands unchanged; the completion claim records the 23-binding set (15 enablement + 8 selection-only) and the unchanged `adds.length === 15` as explicit evidence.
- **A2.5 (coordinator-ratified 2026-09-28, narrow completion of A2 — supersedes A2.2's "test untouched" clause for exactly one line):** `tests/host-settings-proposal.test.ts`'s M4 `expectedAdds` derivation is the test's own PROXY of the generator's derivation contract; A2.2 changed that contract, so the proxy must mirror it. Ratified change: `expectedAdds` gains `.filter((binding) => !('selection_only' in binding))` — ONE line. Every assertion stays byte-unchanged (`assert.equal(adds.length, 15)` holds; `assert.deepEqual(adds, expectedAdds)` now compares the correctly-derived expectation; the no-drift artifact pin holds). Rationale: the test previously implemented the pre-A2 contract as its expectation mirror — leaving it would make the mirror unfaithful, not the pins weaker. The pins' meanings are preserved exactly.
- **A2.6 (coordinator-ratified 2026-09-28 — predicate alignment, supersedes A2.5's filter expression):** the marker's declared semantics are `selection_only: true` = selection-only; **explicit `false` and absent are BOTH enablement-eligible**. The A2.5 proxy filter is ratified as `.filter((binding) => binding.selection_only !== true)` (and the A2.2 generator keeps its `=== true` skip) — one expression in the test line, making generator and proxy provably identical predicates. A2.5's rationale stands unchanged; this closes the explicit-`false` divergence before it can ship.
