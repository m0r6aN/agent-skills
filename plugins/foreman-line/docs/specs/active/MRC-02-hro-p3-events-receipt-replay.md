---
ticket: MRC-02
title: HRO-P3 decision/attempt events + receipt/replay contract (absorbs RCM-P8A) + PiModelContract enrichment + baseline data
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
risk: standard
surfaces:
  - receipts/src/types.ts
  - receipts/src/validator.ts
  - receipts/src/schemas.ts
  - receipts/src/registry.ts
  - receipts/src/index.ts
  - receipts/schemas/*.json
  - contracts/src/correlation.ts
  - routing-policy/src/route-receipt.ts
  - routing-policy/src/pi-resolver.ts
  - dispatch/src/routing-eval/index.ts
routing_class: implementation/standard
verification_class: equivalence-provable
---

# MRC-02 — HRO-P3: decision/attempt events + receipt/replay contract (absorbs RCM-P8A) + model-contract enrichment + baseline data

## Goal

Implement the `hybrid-routing-optimization` charter's HRO-P3 row exactly (`docs/goals/hybrid-routing-optimization/charter.md:120`): *"Integrate decision/attempt events with existing receipts and settlement; accurately measure repeated hits and retries; produce a baseline report with explicit cost provenance and unknowns."* — with the baseline **data collection** in this parcel (the baseline report itself is MRC-18, `docs/goals/goal-status-report-2026-09-27.md:119`).

Per ruling F (`docs/goals/goal-status-report-2026-09-27.md:85`): *"RCM-P8A's receipt/replay scope folds into the HRO-P3 events stream as one sequenced stream when both dispatch — stream consolidation, not a goal merge; both goal records keep their own gates"* — this parcel also absorbs the folded **RCM-P8A** receipt/replay contract (`docs/goals/routing-currency-and-merit/charter.md:239`, exit criterion 8 at `:266-268`) and the deferred `PiModelContract`/`piModelContractFor` `providerLocalId`/`protocol` enrichment (`docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:83`).

## Dependencies

- **No hard predecessor** (report §7 MRC-02 row, `docs/goals/goal-status-report-2026-09-27.md:103`, "Hard predecessors: —"); Lane G slot 1 (`:143`).
- **Consumes (all landed):** HRO-P1's explicit mapping fields `providerLocalId?: string` / `protocol?: PiOpenRouterProtocol` on `PiOpenRouterModel` (`docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:33-34`, fields at `routing-policy/src/pi-openrouter.ts:81,:86` per that record); HRO-P2's deterministic cache inside the existing evaluator (`dispatch/src/routing-eval/index.ts:232` `options.cache?.recall`); the `receipts` chain + `contracts` `CorrelationContext` as-is (`docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md:118`); the GMF settlement contracts **unchanged** (`docs/goals/routing-currency-and-merit/charter.md:56-58`).
- **Ratified inputs (never re-litigated):** ruling F (`docs/goals/goal-status-report-2026-09-27.md:85`) and ruling B (`:81`); wrapper charter D3 (`docs/goals/model-routing-chain-wrapper/charter.md:31`).
- **Dispatch grant:** G-GATE2-HRO (`docs/goals/model-routing-chain-wrapper/charter.md:92`); the RCM-record handoff rides G-GATE2-RCM (`:93`).
- **Downstream consumers:** MRC-05 (decision-receipt reconciliation against "MRC-02's contract", report `:106`), MRC-14 (merit corpus over receipts, `:115`), MRC-16 (closes RCM exit criterion 8 from MRC-02's receipt/replay evidence, `:117`), MRC-18 (baseline report, `:119`).

## Allowed Files

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden.

| Path | Change |
|---|---|
| `receipts/src/types.ts` | edit — typed receipt/subject payloads + event/reason vocabulary (Contract C1, C3) |
| `receipts/src/validator.ts` | edit — subject validation invariants + replay verifier (Contract C1, C2) |
| `contracts/src/correlation.ts` | edit — additive-only, and only if strictly needed (Contract C3; expected zero-or-minimal change) |
| `routing-policy/src/route-receipt.ts` | edit — `PiModelContract` enrichment (Contract C4) |
| `routing-policy/src/pi-resolver.ts` | edit — `piModelContractFor` population (Contract C4) |
| `dispatch/src/routing-eval/index.ts` | edit — decision/attempt event emission + receipt enrichment at the existing receipt write (Contract C5) |
| `receipts/tests/replay-contract.test.ts` | create — replay reproduction + refusal-on-mismatch negative controls |
| `receipts/tests/semantic-invariants.test.ts` | edit — new subject/validator invariants |
| `routing-policy/tests/pi-resolver.test.ts` | edit — enrichment assertions |
| `dispatch/tests/routing-eval.test.ts` | edit — event emission, correlation, provenance assertions |
| `contracts/tests/strictness.test.ts` | edit — only if `contracts/src/correlation.ts` changes |
| `receipts/src/schemas.ts` | edit — schema-builder sync for the new subject/replay types (**Amendment A1**) |
| `receipts/schemas/*.json` | regenerate via `cd receipts && npm run generate` (**Amendment A1**) |
| `receipts/src/index.ts` | edit — export the new subject types + replay verifier (**Amendment A1**) |
| `receipts/src/registry.ts` | edit — register new schema entries in the exported schema list (**Amendment A2**, list-only) |

### Amendment A1 (coordinator-ratified 2026-09-27, committed before code per SPEC-CONVENTION §4.8)

Ratified by the coordinator at spec lint, ruling on the shaper's Stop-flag #2 (anticipated out-of-list paths). The `receipts` package runs a schema builder (`src/generate.ts` → `src/schemas.ts` → committed `schemas/*.json`, `receipts/package.json:18`) and re-exports its public types through `src/index.ts`; therefore **any** change to `receipts/src/types.ts` mechanically requires schema-builder sync + regenerated JSONs, and any new exported symbol mechanically requires the barrel line. These three paths are added to Allowed Files as provably-required siblings of C1/C3 — bounded to sync/export only (no envelope semantics change, Forbidden rules unchanged). `dispatch/src/approval-cli/index.ts` remains **conditional**: still Stop-and-Report if needed.

### Amendment A2 (coordinator-ratified 2026-09-27 at builder Step 0, before code per SPEC-CONVENTION §4.8)

Ruling on builder FLAG-1: the generate pipeline is `receipts/package.json:18` → `src/generate.ts` → `allSchemaFiles` from `src/registry.ts` → `schema-scaffold`; `registry.ts` hardcodes the exported schema list and registering new subject/replay schema builders requires editing it. Added to Allowed Files **bounded to schema-list registration only** (one list entry per new builder; no other content). If C1 lands without new schema builders, `registry.ts` stays untouched. Related rulings issued at the same gate (binding on implementation): **FLAG-2** — Reading (A) adopted: events correlate to the *chain* (workflowId chain key, runId per attempt, sequence/prevHash ordering, each entry's own correlation fields), never event-to-event; `contracts/src/correlation.ts` is NOT to be edited in this parcel — a genuinely inexpressible link is a Stop-and-Report naming the exact link. **FLAG-3** — test inputs constructed inline; no new fixture files (else Stop-and-Report).

## Forbidden

- Any path not listed in Allowed Files (including `dispatch/src/approval-cli/index.ts`, `routing-policy/src/pi-openrouter.ts`, `routing-policy/routing-policy.yaml`, `templates/**`, `worker-envelopes/**`, `docs/SPEC-CONVENTION.md`, any `INDEX.md`, any goal record). Implementation needing one → Stop-and-Report. (`receipts/src/index.ts`, `receipts/src/schemas.ts`, `receipts/schemas/*.json` were added to Allowed Files by Amendment A1.)
- **No parallel event format.** HRO-P0 §3.1 must-not (`docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md:118`): *"Invent a parallel event format (D10: 'not an instruction to invent a parallel event format', `charter.md:107`)"*. Events are receipts on the existing chain; correlation IDs are "threaded, never forked" (`hro-p0-integration-contract.md:128`).
- **No GMF settlement amendment.** "amend `governed-model-fleet` settlement contracts (consume only, `docs/goals/routing-currency-and-merit/charter.md:56-58`)" (`hro-p0-integration-contract.md:118`); that quote is the owner statement: *"`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed). This goal [RCM] consumes those contracts… If both goals claim the same file, both stop until sequenced."*
- **No estimate labeled a bill.** "label estimates as bills (`charter.md:70`)" is a must-not (`hro-p0-integration-contract.md:118`); D5: *"Keep estimates distinct from bills… Unknown cost stays unknown."* (`docs/goals/hybrid-routing-optimization/charter.md:70`). No invented cost/latency/provenance values.
- No change to `ReceiptDocument` envelope semantics (`receipts/src/types.ts:29-45`), the hash domain, `validateChain`/`isSealed` sealing semantics (`receipts/src/validator.ts:170,:192`), or chain keying ("One chain per parcel, keyed by `correlation.workflowId`… `runId` changes per attempt", `receipts/README.md:69-71`).
- No policy/selection changes: `routing-policy.yaml`, selection order, eligibility, tiers, or the pinned execution base URL are untouched (selection policy is RCM's, D1/D3; `docs/goals/routing-currency-and-merit/charter.md:181,:183-184`).
- No derived model identity: "a value is never derived from the registry key or host id" (`docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:55`).
- No RCM/other goal-record write by this parcel (see Evidence Required #4 — that write is an MRC-01-class coordinator act).
- No engines edits, no new dependencies, no formatting/lint sweeps beyond the listed files.

## Out of Scope

- The cost/quality **baseline report** (MRC-18, report `:119`); this parcel delivers the measurable data, not the report or any savings claim (D5: *"Do not assume a universal 5.5% saving…"*, `charter.md:72`).
- Actual-dispatch identity reconciliation against the replay receipt (MRC-05, report `:106`); merit corpus extraction (MRC-14, `:115`); RCM exit-evidence assembly (MRC-16, `:117`).
- Recommendation and fallback **emission wiring** — their call sites arrive with HRO-P5/HRO-P4a (MRC-08/MRC-19); only the vocabulary labels are defined here (C3) so those parcels extend this stream rather than fork it (ruling F).
- D10 terminal rendering/diagnostics (HRO-P4c, MRC-12), recovery-ladder behavior (HRO-P4a, MRC-08), live smoke (MRC-17).
- Resolving the Node engines tension (recorded under Verification; not resolved here).

## Contract

Authority quotes are verbatim; each change item is bounded to its named seam.

### C1 — Receipt/replay contract (absorbed RCM-P8A) in `receipts/src/types.ts` + `receipts/src/validator.ts`

The RCM-P8A row (`docs/goals/routing-currency-and-merit/charter.md:239`): *"Receipt/replay contract and verifier evidence. Binds effective requirements, policy digest, catalog-snapshot digest, vocabulary version, derived context floor, predicate set, selected identity, and refusal-on-mismatch behavior. Owns the receipt enrichment and replay negative controls; downstream corpus work consumes this contract."*

Implementation:
1. `receipts/src/types.ts`: add typed `subject` payload types (subject payloads are `JsonValue` on the frozen envelope, `receipts/src/types.ts:42`; envelope fields `:29-45` and `ReceiptKind` `:14` are unchanged) for the decision/replay receipt subject, binding exactly: **effective requirements, policy digest (version + content digest), catalog-snapshot digest, vocabulary version, derived context floor, predicate set, selected identity** — the RCM exit-criterion-8 field list (`docs/goals/routing-currency-and-merit/charter.md:266-268`): *"RCM-P8A receipts record effective requirements, resolved model identity, policy version/content digest, catalog-snapshot digest, vocabulary version, derived context floor, and predicate set; replay either reproduces the decision or refuses on any bound-input mismatch."*
2. `receipts/src/validator.ts`: validation invariants for the new subject kinds alongside `validateReceiptDocument` (`:70`), and a **replay verifier** exported from the same module: given a recorded receipt and current bound inputs, it either reproduces the recorded decision or returns a **typed refusal naming the mismatched binding**. Envelope validation, `validateChain` (`:170`) and `isSealed` (`:192`) semantics are untouched; enriched receipts must remain valid chain members.
3. "Selected identity" binds the full identity triple where available: registry key, provider-local model ID, protocol, and the Pi host's model id — D2's distinct-values rule (`docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:28`).

### C2 — Replay negative controls

Replay behavior per exit criterion 8 (`charter.md:266-268`, quoted in C1): identical bound inputs **reproduce** the decision; **any** bound-input mismatch (each of the seven bound inputs mutated independently) **refuses** with a typed error naming the binding. These negative controls are the "replay negative controls" ownership from the RCM-P8A row (`:239`) and the verifier evidence MRC-16 consumes (report `:117`).

### C3 — Decision/attempt events correlated to the existing receipt chain

Per D5 (`docs/goals/hybrid-routing-optimization/charter.md:68`): *"Record each decision, cache hit/miss, recommendation call, fallback, dispatch attempt, and settlement with correlated IDs and truthful provenance. Deduplicate event ingestion without hiding retries or repeated charges."* and HRO-P0 §3.1 "May add": *"Decision/cache-hit/recommendation/fallback/attempt events correlated to the existing receipt chain"* (`hro-p0-integration-contract.md:118`).

1. Events are entries on the existing receipt chain — same `ReceiptDocument` envelope (`receipts/src/types.ts:29-45`), same chain keying (`receipts/README.md:69-71`), same correlation identity (`CorrelationContext` = `correlationId`, `sessionId`, `workflowId`, `runId`, optional `agentId`, `contracts/src/correlation.ts:37-43`). No second event format, no forked correlation type (Forbidden).
2. `receipts/src/types.ts` defines a versioned **reason/outcome vocabulary** reconciling D10's proposed labels — *"for example `mapping_missing`, `catalog_refresh_failed`, `approved_fallback_selected`, `config_update_proposed`, and `route_unavailable`. These are proposed semantic labels to reconcile with existing schemas during P0"* (`charter.md:107`) — with HRO-P1's typed names (`MAPPING_*`/`PROTOCOL_*`, *"the vocabulary entries that reconciliation will map onto"*, `hro-p1-mapping-contract-2026-09-27.md:84`). The vocabulary carries an explicit version string; that **vocabulary version** is one of C1's bound inputs.
3. Provenance fields per D5 (`charter.md:70`): *"Capture actual provider/model, input/output and provider-cache usage where available, latency, failures, retries, billed or estimated cost, and price source/version."* — cost is tagged `billed | estimated | unknown`; absent data is `unknown`, never imputed. Occurrence/attempt counts support "accurately measure repeated hits and retries" (`charter.md:120`) without hiding them (`:68`).
4. `contracts/src/correlation.ts` is **consumed as-is** (`hro-p0-integration-contract.md:118`: *"Consume `receipts` chain + `contracts` `CorrelationContext` as-is"*); it is listed in Allowed Files only for a strictly additive optional extension if — and only if — an event cannot be correlated with the existing five fields; if that situation arises, Stop-and-Report before editing.

### C4 — `PiModelContract` / `piModelContractFor` enrichment (`routing-policy/src/route-receipt.ts`, `routing-policy/src/pi-resolver.ts`)

The HRO-P1 record §5 deferral (`docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:83`): *"**Deferred — resolver receipt enrichment:** `PiModelContract` (`src/route-receipt.ts`) and `piModelContractFor` (`src/pi-resolver.ts:834-849`) could carry `providerLocalId`/`protocol`; those files are outside this package's write set, and HRO-P3's decision/attempt events are the charter-designated reconciliation point."*

1. Add `provider_local_id: string | null` and `protocol: string | null` to `PiModelContract` (`routing-policy/src/route-receipt.ts:116-122`; existing snake_case fields `registry_key`/`opencode_id` set the naming style), additive and nullable.
2. Populate them in `piModelContractFor` (`routing-policy/src/pi-resolver.ts:836`, returning `registry_key`, `opencode_id`, `capabilities`, `allowed_lanes`, `prohibited_lanes`, `authority` today) from the mapping's explicit `PiOpenRouterModel.providerLocalId` / `protocol` values. Honesty rule (HRO-P1, `hro-p1-mapping-contract-2026-09-27.md:55`): a mapping lacking explicit values yields `null` (unknown) — *"a value is never derived from the registry key or host id"*.
3. This is the ruling-B mapping-field seam (`docs/goals/goal-status-report-2026-09-27.md:81`: *"Recorded coordination: HRO is the additive author of mapping/protocol fields on `routing-policy/src/pi-openrouter.ts`; PMC-P1 keeps schema review, PMC-P2 keeps adapter/resolver review."*): PMC-P1 schema review and PMC-P2 adapter/resolver review apply to this item in addition to the two adversarial reviews (Evidence Required #3).
4. The enriched identity feeds C1's "selected identity" binding; `pi_model_contract` consumers (`routing-policy/src/route-receipt.ts:133,:165`) keep compiling unchanged.

### C5 — Emission at the existing dispatch receipt write (`dispatch/src/routing-eval/index.ts`)

1. The existing contract is *"extended additively only"* (`docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md:127`: *"`evaluateRouting` receipt contract (`docs/receipts/<workflowId>/routing-decision.json`, `dispatch/src/routing-eval/index.ts:225-252`) — extended additively only"*). On disk the write is `writeRoutingReceipt` (`dispatch/src/routing-eval/index.ts:146-175`, object at `:157-164`, `writeFileSync` of `routing-decision.json` at `:168`), called from the warm path (`:238`) and the cold path (`:324`) of `evaluateRouting` (`:180`).
2. Extend the write additively: decision events (both paths), cache-hit/miss events (warm path; the cache key already carries the policy digest at `:219-222`), and attempt events — each correlated to the chain via the existing correlation fields, each carrying C3's vocabulary + provenance fields. The `routing-decision.json` summary likewise gains the C1 binding fields additively (its current fields are `workflowId`, `routing_class`, `data_classification`, `resolvedTier`, `resolvedModelId`, `transportRequirements`, `timestamp`, `policyRef`, `hro-p0-integration-contract.md:66`).
3. Settlement events/consumption: read-only reference to GMF settlement records — *"Reuse existing receipt and settlement mechanisms"* (D5, `charter.md:68`); no settlement schema write (Forbidden). Cost provenance closes HRO-P0's recorded gap (*"no billed-cost, price-source/version, or provider-cache-usage field exists in any in-tree receipt schema (HRO-P3/RCM-P8A territory)"*, `hro-p0-integration-contract.md:69`) via C3's provenance fields — without labeling estimates as bills.
4. Baseline data = the recorded event corpus: per-decision/hit/miss/attempt records with occurrence counts and honest unknowns, consumable by MRC-18 (report `:119`). No report, no savings claim (Out of Scope).

### C6 — Review and acceptance scope

Two independent adversarial reviews of this parcel (wrapper charter D6, `docs/goals/model-routing-chain-wrapper/charter.md:34`: *"Where a wrapper parcel absorbs another goal's scope (MRC-02 ← RCM-P8A per ruling F), it carries the maximum of its constituents' review loads and records the absorbed scope's acceptance in the source goal's record"*; the folded P8A scope is RCM `architecture/risk`, so count = 2, `:55`). One of the two is the **receipt/replay review** (C1/C2), which doubles as RCM's folded-P8A acceptance evidence (Evidence Required #4). Reviewers never fix or commit (`:34`).

## Existing Patterns To Follow

- **Additive optional-field pattern** (SPEC-CONVENTION §4.6 additive pattern; ruling E "one sequenced stream", `docs/goals/goal-status-report-2026-09-27.md:84`): new fields optional/nullable first; existing consumers (`routing-policy/src/route-receipt.ts:133,:165`) keep compiling; no renames, no behavior change to `PI_OPENROUTER_ROUTING`.
- **Chain discipline** (`receipts/README.md:69-71`): one chain per parcel keyed by `correlation.workflowId`, `runId` per attempt, append-only, never fork; hash domain RFC 8785 JCS + SHA-256 (`receipts/README.md:36-41` per `hro-p0-integration-contract.md:63`) — new subject fields must canonicalize within that unchanged domain.
- **Typed failure style**: `RoutingError('RECEIPT_WRITE_FAILED', …)` (`dispatch/src/routing-eval/index.ts:170-173`) and HRO-P1's typed rejection vocabulary (`MAPPING_INCOMPLETE_REFUSED`, `PROTOCOL_INCOMPATIBLE_REFUSED`, `hro-p1-mapping-contract-2026-09-27.md:55-56`) — replay refusals are typed and name the binding, never bare throws or string matching (D10: *"Inspect validated event fields rather than grep output"* (`charter.md:107`); *"Never label an API failure as `openrouter_api` success"* (`:70`)).
- **Parity/lockstep test style**: deep-equal lockstep assertions like `routing-policy/tests/pi-openrouter.test.ts:41-44` (cited `hro-p1-mapping-contract-2026-09-27.md:43`) and the existing `pi_model_contract` assertions in `routing-policy/tests/pi-resolver.test.ts:73,:144`.
- **Correlation lineage tests** exist for the dispatch side (`dispatch/tests/w4-p0-correlation-lineage.test.ts`) — extend that lineage style rather than inventing a new harness.

## Required Tests / Verification

Exact commands (from `plugins/foreman-line/`; Node **v24.7.0** on this workstation):

```
cd routing-policy && npm run typecheck && npm test && npm run lint
cd dispatch       && npm run typecheck && npm test && npm run lint
cd receipts       && npm run typecheck && npm test && npm run lint
cd contracts      && npm run typecheck && npm test && npm run lint
```

(`npm test` = `tsx --test tests/*.test.ts`, `npm run typecheck` = `tsc --noEmit`, `npm run lint` = `biome check .` — `dispatch/package.json:14-16`, `routing-policy/package.json:17-20`, `receipts/package.json:17-20`, `contracts/package.json:15-18`.)

**Node engines tension — record, do not resolve:** `dispatch/package.json:8` declares `"node": ">=24.11.1"` while the workstation runs v24.7.0; `routing-policy/package.json:8`, `receipts/package.json:8`, `contracts/package.json:8` declare `>=22`. If `dispatch` checks fail or warn on engines, capture the exact output verbatim in the completion report as a STOP flag; never edit `package.json` engines to make it pass.

Test content (permanent tests, per file):

1. `receipts/tests/replay-contract.test.ts` (new):
   - reproduction control: identical bound inputs → replay reproduces the recorded decision;
   - refusal-on-mismatch negative controls, one independent mutation per bound input — effective requirements, policy version/content digest, catalog-snapshot digest, vocabulary version, derived context floor, predicate set, selected identity (exit criterion 8, `docs/goals/routing-currency-and-merit/charter.md:266-268`) — each yields a typed refusal naming the binding;
   - enriched receipts remain valid under `validateReceiptDocument`/`validateChain` and do not alter `isSealed` semantics (`receipts/src/validator.ts:70,:170,:192`).
2. `receipts/tests/semantic-invariants.test.ts` (extend): subject-kind validation accepts well-formed event/replay subjects and rejects malformed ones with typed results.
3. `routing-policy/tests/pi-resolver.test.ts` (extend): `piModelContractFor` returns `provider_local_id`/`protocol` equal to the mapping's explicit values; a mapping without explicit values yields `null` and is never derived from registry key/host id; existing assertions (`:73,:144`) unchanged.
4. `dispatch/tests/routing-eval.test.ts` (extend): cold path emits decision + attempt events and warm path emits decision + cache-hit/miss events, all correlated via existing correlation fields; repeated hits and retries are counted and never hidden (D5, `charter.md:68,:120`); cost provenance assertions: `estimated` is never tagged `billed`, `unknown` stays `unknown`, a failed call is never recorded as success.
5. `contracts/tests/strictness.test.ts` (edit only if `contracts/src/correlation.ts` changed): the additive optional field round-trips; unknown-field rejection stays intact (cf. `receipts/tests/fixtures/reject-correlation-unknown-field.json`).

## Acceptance Criteria

1. Decision/attempt events (with cache hit/miss) are recorded correlated to the existing receipt chain via the existing `CorrelationContext` fields; no parallel event format exists anywhere in the write set (C3, Forbidden).
2. Receipt/replay receipts bind all seven exit-criterion-8 inputs (effective requirements, resolved/selected model identity, policy version/content digest, catalog-snapshot digest, vocabulary version, derived context floor, predicate set); replay reproduces on identical inputs and refuses typed on any single-binding mismatch (C1, C2).
3. `PiModelContract` carries `provider_local_id`/`protocol` populated from explicit mapping values only; absent → `null`; zero behavior change to route resolution and existing `pi_model_contract` consumers (C4).
4. Provenance is truthful: `billed | estimated | unknown` cost tagging, price source/version and provider-cache usage captured where available; estimates never labeled bills; unknown cost stays unknown; failures never recorded as success (C3, D5 `charter.md:70`).
5. Repeated cache hits and retries are accurately measurable from the recorded events without dedupe hiding them (C3/C5, `charter.md:68,:120`).
6. Baseline data for MRC-18 is present: the event corpus carries cost provenance and explicit unknowns; the parcel makes no savings claim and ships no report (Out of Scope).
7. All four packages pass the exact Verification commands (or the engines tension is recorded verbatim as a STOP flag — recorded, not resolved).
8. Two independent adversarial reviews + ruling-B PMC-P1 schema review + PMC-P2 adapter/resolver review on the C4 mapping-field seam are completed, with findings triaged by the coordinator (reviewers never fix/commit).

## Evidence Required

1. Command output for all four Verification command blocks, plus `node --version` (expected v24.7.0) and, if triggered, the verbatim `dispatch` engines warning/failure (recorded tension: `dispatch/package.json:8` `>=24.11.1` vs v24.7.0 — recorded, not resolved).
2. Replay verifier evidence: the reproduction control plus the seven refusal-on-mismatch negative controls (C2) — this is the "verifier evidence" half of the folded RCM-P8A row (`docs/goals/routing-currency-and-merit/charter.md:239`) and the input MRC-16 uses to close RCM exit criterion 8 (report `:117`).
3. Review record: **2 independent adversarial reviews** (folded P8A scope is RCM `architecture/risk`; wrapper charter `docs/goals/model-routing-chain-wrapper/charter.md:34,:55`) + ruling-B **PMC-P1 schema review** and **PMC-P2 adapter/resolver review** on the C4 mapping-field seam (`docs/goals/goal-status-report-2026-09-27.md:81`). Reviewers never fix or commit.
4. **RCM-side acceptance handoff (required):** the receipt/replay review result is written into the `routing-currency-and-merit` goal record as the folded RCM-P8A acceptance evidence, via an **MRC-01-class record write** — a coordinator record act riding G-GATE2-RCM (`docs/goals/model-routing-chain-wrapper/charter.md:93`: *"The MRC-02 → RCM-record P8A acceptance handoff also rides this grant."*; `:55`: *"recorded in RCM's record via MRC-01-class handoff"*; `docs/goals/model-routing-chain-wrapper/loop-directive.md:37`). Per ruling F both records keep their own gates (`docs/goals/goal-status-report-2026-09-27.md:85`). **This write is not performed by this parcel** (it is outside Allowed Files); its completion is a mandatory evidence item for MRC-02 closure.
5. Baseline-data evidence: the recorded event corpus with provenance and explicit unknowns, plus the count of decision/hit/miss/attempt events exercised by tests — the dataset MRC-18 later reports on (`docs/goals/goal-status-report-2026-09-27.md:119`).

## Collision Risk

Write set $W$ = the 11 Allowed Files. Disjointness proof vs the report §7 lanes (`docs/goals/goal-status-report-2026-09-27.md:92-96`, task rows `:103-119`) and the HCS collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`):

- **SP8 (`routing-policy/`, `:197`)** and **SP9 (`dispatch/`, `:198`)**: the map's "Live binding one-writer order" enforces one writer at a time on these trees; the report's lane rule is the same discipline — *"Lane G — strictly serial. One writer at a time on the contested `routing-policy/**` + `dispatch/**` surfaces (Window discipline, HCS collision map SP8/SP9). Dispatch in slot order."* (`:93`). MRC-02 is Lane G slot 1 (`:103`, `:143` order MRC-02 → MRC-03 → MRC-05 → …), so no other Lane-G parcel may hold a concurrent window: MRC-03 (`:104`), MRC-05 (`:106`), MRC-06 (`:107`), MRC-07–13 all sequence behind MRC-02, and MRC-05/MRC-06 explicitly consume MRC-02's outputs. **Disjoint by serialization window; MRC-02 additionally holds slot 1 (first writer).**
- **Lane P-A** (report `:94`, "no contested writes"): MRC-01 writes only named goal records (report `:101`); MRC-04 writes PMC-P3 canon (skills/kickstarters/docs/templates, `:105`); MRC-20–25 are catalogue/external-repo work (`:120-122`, *"separate Keon repos"*). $W$ contains no goal records, canon, templates, or external-repo paths → **disjoint**.
- **Lane P-R** (report `:95`, *"read-only over receipt evidence … confirm write sets at shaping"*): MRC-14 (`:115`) reads receipts and writes its own corpus artifacts; MRC-15/16 (`:116-117`) build on those. None may write $W$; MRC-02 writes no corpus/analysis artifacts. **Disjoint, with the standing caveat that MRC-14's shaping must confirm its write set excludes $W$** (its shaping's job, noted here).
- **Lane X** (report `:96`): MRC-17/18/19 (`:118-119`) consume MRC-02 outputs (report/ smoke/ experiment) and write none of $W$ → **disjoint**.
- **SP13 (`:202`, FK §12 shared serialization-point family: "receipt schemas", barrel exports, shared package manifests — "serialization points and are assigned to only one active parcel at a time", verdict `refuse`/`wait`)**: $W$ touches receipt-schema-adjacent sources (`receipts/src/types.ts`, `receipts/src/validator.ts`) but **no** barrel (`receipts/src/index.ts`), manifest, or `SPEC-CONVENTION.md`. Within its window MRC-02 is the sole claimant of the receipt-schema family (no other §7 task writes receipt schemas; MRC-05 consumes, MRC-14 reads). If any other parcel's window overlaps a receipt-schema write, that parcel waits (SP13 verdict). **Disjoint within the single-claimant rule; escalate only if a second concurrent claim appears.**
- **SP11 (`templates/`, `:200`)**: $W$ contains no `templates/**` path → **not in contact**.
- **GMF/external**: settlement contracts are consumed read-only (Forbidden); GMF parcels live in separate Keon repos (report `:122`) → **disjoint**.
- **MRC-01-class RCM record write** (Evidence Required #4) happens after review acceptance as a coordinator act; it is outside $W$ and outside MRC-02's window → no overlap with MRC-01's propagation writes (MRC-01 has no hard predecessor but writes only named goal records, report `:101`).

**Verdict: write-set disjoint from every other §7 lane under Lane G's strict serialization (SP8/SP9), single-claimant on the receipt-schema serialization family (SP13), zero contact with SP11.** Residual risk: concurrent shaping of MRC-03/05 opening `dispatch/` or `routing-policy/` tests early — prevented by the Lane G rule (report `:93`) and slot order (`:143`).

## Stop-and-Report Rule

Stop immediately and report (never guess, never self-expand authority) when:

1. Implementation requires any path outside Allowed Files (examples anticipated: `receipts/src/index.ts` barrel export, `receipts/src/schemas.ts` JSON-schema sync, `dispatch/src/approval-cli/index.ts` chain writes) — await a coordinator ratification of a spec amendment per SPEC-CONVENTION §4.8.
2. A live write claim by another parcel is observed on `routing-policy/**`, `dispatch/**`, or the receipt-schema family (SP8/SP9/SP13 collision map) — stop and report; the map's verdicts are `wait`/`escalate`, never co-write.
3. Any requirement would amend GMF settlement/envelope contracts, label an estimate as a bill, invent a cost/latency/provenance value, derive a model identity from a registry key or host id, or invent a parallel event format.
4. `dispatch` checks fail on the Node engines mismatch (v24.7.0 vs `dispatch/package.json:8` `>=24.11.1`) — record the exact output and report as a STOP flag; engines are never edited here.
5. Any authority text is ambiguous (e.g. whether a needed correlation extension is expressible with the existing `CorrelationContext` fields, `contracts/src/correlation.ts:37-43`) — surface the question to the coordinator with the two readings; never resolve charter/ruling ambiguity unilaterally.
