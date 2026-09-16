# SUPERCHARGE-P2 findings — routing + frontmatter comprehensiveness

**Parcel:** SUPERCHARGE-P2 · **Date:** 2026-09-16 · **Owner:** Clinton Morgan · **Branch:** `feat/supercharge-p2` (base `14f2be5`)
**Method:** read-only analysis; no file outside the two spec Allowed Files was touched. All claims cite `file:line` or a live source + timestamp.
**Inputs read:** `routing-policy/routing-policy.yaml:17-208`, `routing-policy/src/validator.ts` (KNOWN_FRONTIER_MODELS + 8 invariants), `routing-policy/src/types.ts:9-28`, `dispatch/src/routing-eval/index.ts` (`RoutingError` codes, first-eligible walk), `skill-injection/skill-injection.yaml`, `spec-linter/schemas/spec-frontmatter.schema.json`, `shaping/src/self-check.ts`, SUPERCHARGE-P1 spec + handoff, GMF charter D12/D13/D18/D24.
**Prohibited-actions statement:** no policy/validator/dispatch/schema/matrix/ceiling/order/enum edit was made or proposed as an edit; every proposal below is a numbered Phase-3 input. No credentials touched; prices are public catalog data.

## AC-1 decision matrix — every class × role × classification

Policy roles first. All three `eligible_models` blocks hash identically (15 ids, same order — verified by SHA-256 over the blocks), so every classification column resolves identically; the table compresses them with that note. First-eligible order per `routing-policy.yaml:151-155`; dispatcher throws rather than substitutes (`routing-eval/index.ts:206-211`).

Critical dispatch fact: `evaluateRouting` takes no role (`RoutingInput`, `routing-eval/index.ts:71-78` — zero role references in the file). Builder cells below are evaluated dispatch. Coordinator/verifier cells are policy-tier intent (D4 pins both roles to `frontier`, whose head is opus-5) — F-10: no code path binds a role to a model, so role→model resolution is declared, not executed. Phase 3 must decide between role-aware dispatch and tier-pinning-as-declared.

| Class | Coordinator (frontier) | Verifier (frontier) | Builder (per-class) |
|---|---|---|---|
| `boilerplate` ($0.50) | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` | `nvidia/nemotron-3.5-lightning` (economy-first) |
| `standard-feature` ($5.00) | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` | `anthropic/claude-sonnet-5` (standard-first) |
| `architecture/risk` ($25.00) | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` (frontier-first) |
| `implementation/standard` ($5.00) | `anthropic/claude-opus-5` | `anthropic/claude-opus-5` | `anthropic/claude-sonnet-5` (standard-first) |

Cell count: 4 classes × 3 roles × 3 classifications = 36 cells, of which 12 builder cells are evaluated dispatch (all resolve) and 24 coordinator/verifier cells are tier-pinning intent (F-10). Verifier/coordinator distinct-instancing is a dispatch-time (W2-P3/W3) property, not a policy property — the matrix records tier resolution only.

Fail-closed inventory (all named, all throwing): `UNKNOWN_CLASS` (routing_class outside the 4 — enforced `routing-eval/index.ts:151-155` against `types.ts:15-20`), `UNKNOWN_DATA_CLASSIFICATION` (enforced `index.ts:160-164` against `types.ts:24-28`), `NO_ELIGIBLE_MODEL` (empty intersection, `index.ts:206-211` — F-9: currently unreachable with shipped lists, so the fail-closed path has no live exercise; reachable only via future narrowing), `POLICY_INVALID`/`POLICY_UNREADABLE`/`RECEIPT_WRITE_FAILED`, plus the validator's 8 invariants (7 semantic check functions + ceiling presence enforced at the schema layer — `validator.ts:1-13`). Evaluated dispatch paths substitute nothing silently; the two fail-open admissions below (D18 borrowing, multimodal misfiling) are unrecorded substitutions outside evaluated dispatch, not dispatcher behavior.

GMF D18 roles (`researcher`, `reviewer`, `tester`, `documenter`, `adversarial`) — **F-1: unmapped.** No D18 role appears in `roles:`, no tier maps to one, and the dispatcher never consults role names beyond coordinator/verifier/builder-per-class. A coordinator assigning a "tester" task gets builder-tier resolution via its `routing_class` with no record of the substitution. This is a coverage gap, not a dispatcher defect (no claim is made, so no error fires) — Phase 3 must map these roles or declare them out of routing scope.

Skill-injection roles (`builder`, `verifier_harness`, `adversarial_reviewer`, `coordinator`, `integration`) select **skills**, not models — a different plane (`skill-injection.yaml:9-26`). N/A to this matrix by design; conflating the two planes would be a category error.

## AC-2 multimodal verdicts — one per native-only pin

- `grok-imagine-video-1.5` — NOT routable: no OpenRouter slug, no tier entry, no role, no `routing_class` value covers video generation. Phase-3 questions: which role owns video tasks; token-vs-per-second pricing against `ceiling_usd`; native transport outside OpenRouter custody.
- `gpt-image-2.5-flare` — NOT routable: same four absences. Phase-3 questions: as above, plus image-token pricing ($5/$8/$30 per 1M) vs ceilings.
- `gemini-omni-1.1-flash` — NOT routable: same four absences. Phase-3 questions: as above, plus per-second tiers ($0.03–$0.30/s) vs ceilings.
- F-2: none of the three can be reached by any class/role/classification combination today. There is no code path that accepts them — but a video task misfiled as `standard-feature` resolves to sonnet-5 with no error, which IS failing open (admitted, not resolved here).

## AC-3 ceiling table — turns to exhaustion at cited prices

Assumption (stated for reproducibility): one heavy agentic turn = 50K input + 100K output tokens. Per-turn cost = 0.05 × input-$/1M + 0.1 × output-$/1M. Prices: OpenRouter catalog 2026-09-14; OpenAI/Anthropic docs for $10/$50.

| Model (price/1M) | Class ceiling | $/heavy-turn | Turns to exhaust |
|---|---|---|---|
| fable-5.1, gpt-6-astra ($10/$50) | architecture/risk $25 | $5.50 | **~4.5 (F-4)** |
| opus-5 ($5/$25) | $25 | $2.75 | ~9 |
| gpt-5.6-sol ($2/$10) | $25 | $1.10 | ~22 |
| gemini-3.1-pro-preview ($2/$12) | $25 | $1.30 | ~19 |
| sonnet-5 ($2/$10) | standard $5 | $1.10 | ~4.5 |
| gemini-3.8-flash ($0.75/$3.75) | $5 | $0.41 | ~12 |
| terra ($2/$12) | $5 | $1.30 | ~3.8 |
| glm-5.3 ($1.40/$4.40) | $5 | $0.51 | ~9.8 |
| grok-4.6 ($2/$6) | $5 | $0.70 | ~7.1 |
| muse-spark-1.3 ($1.25/$4.25) | $5 | $0.49 | ~10.2 |
| nemotron-3.5-lightning ($0.065/$0.18) | boilerplate $0.50 | $0.021 | ~23 |
| luna ($0.20/$1.20) | $0.50 | $0.13 | ~3.8 |
| flash-lite ($0.25/$1.50) | $0.50 | $0.16 | ~3.1 |
| haiku-4.5 ($1/$5) | $0.50 | $0.55 | **~0.9 (F-5: cannot complete one heavy turn)** |

F-4: frontier $10/$50 models exhaust the $25 architecture/risk ceiling in ~4–5 heavy turns (P1 tension confirmed arithmetically). F-5: haiku-4.5, listed last in economy, exceeds the $0.50 boilerplate ceiling inside a single heavy turn (no fallback intent is stated in the yaml — position is the only signal) — reachable only if every cheaper economy id becomes ineligible.

## AC-4 tier-ordering verdict

Frontier order (opus → sol → gemini-preview → fable → astra) is track-record-first, not price-ascending — opus ($5/$25) precedes sol ($2/$10), so the coordinator default costs ~2.5× the verifier default per token. Verdict: order expresses capability-first defaulting with escalation-class models last; whether that is the intended cost posture (rather than an accident of history) is a Phase-3 question, not answered here. Standard order (sonnet → flash → terra, then P1 appends glm → grok → spark) preserves prior defaults, but the three appended ids are unreachable while earlier ids stay eligible — authorized-but-never-selected (F-6, Phase-3 input: intentional order vs dead weight). Economy order changed by the Nemotron parcel (PR #25): nemotron first *in order to be selected*, displacing luna as the boilerplate default — F-7: a deliberate default move (unlike P1's preservation), plus the documented third-party-served exception for non-public data, whose enforcement rides entirely on declared consumer-honored transport plus account settings (same unverifiable shape as the rejected contributor case, explicitly documented as an exception this time — tension recorded, not a verdict).

## AC-5 routing_class enum verdict

The enum is closed at 4 values in three places that agree (`spec-frontmatter.schema.json:74-82`, `types.ts:9-20`, `routing-policy.yaml` classes). No image/video/multimodal value exists — F-3: any multimodal parcel today must misfile under an existing class or fail schema validation (fail-closed, but inexpressive). Candidate values if Phase 3 wants them (candidates only): `media-generation` (image/video synthesis tasks), `multimodal-edit` (image/video reference editing). No schema change made here.

Adjacent vocabulary gap — F-8: `data_classification` in a spec frontmatter is a free string (schema has no enum), while the dispatcher enforces exactly public/internal/restricted. A spec carrying `data_classification: topsecret` passes lint and dies only at dispatch with `UNKNOWN_DATA_CLASSIFICATION` — fail-closed but late. Phase-3 input: enum-constrain it in the schema (non-breaking additive, same pattern as `permission_profile`) or record the late failure as accepted.

## AC-6 alias inventory (Phase-3 input, resolution NOT designed here)

| Family | `-latest` slug observed | Provider alias behavior (source) | Implication (options, undecided) |
|---|---|---|---|
| Claude Fable | `anthropic/claude-fable-latest` (OpenRouter catalog 2026-09-14; `~`-prefixed entry, marker semantics unverified) | Anthropic native uses pinned `claude-fable-5-1`; no `-latest` native form verified | Options: resolve via catalog lookup and pin, or route the alias — undecided |
| Grok | `x-ai/grok-latest` (catalog 2026-09-14) | xAI docs: `<model>` and `<model>-latest` aliases to latest stable/latest; explicitly recommended | Provider-blessed float exists; whether to pin at dispatch is undecided |
| GLM | `z-ai/glm-latest`, `z-ai/glm-flash-latest` (catalog 2026-09-14) | Z.ai docs describe pinned `glm-5.3`; no `-latest` native form verified | Options: resolve via catalog lookup and pin, or route the alias — undecided |
| GPT Astra | `openai/gpt-astra-latest` (catalog 2026-09-14) | OpenAI API: bare `gpt-6-astra` is the default snapshot and floats; dated snapshots pin | Bare ID floats by provider design; whether pinning happens on our side (and what binds it) is undecided |
| Muse Spark | none observed | Meta Model API pinned `muse-spark-1.3` | Nothing to resolve; already pinned |
| Imagine/Image/Omni natives | none observed | xAI/OpenAI/Google native pinned IDs | Nothing to resolve; routing surface is the gap, not versioning |

Design stance carried forward (recorded, not implemented): `latest` is a legitimate *input*. Open Phase-3 questions: may the routed ID ever be the floating alias itself, or must it always be a pinned resolution — and if pinned, what binds source + timestamp (dispatch receipt extension? separate resolution record?)? Undecided here.

## Phase-3 input list (extracted)

- P3I-1: Map or scope-out D18 roles (F-1).
- P3I-2: Multimodal routing surface — roles, classes, transports, ceiling units for the 3 native pins (F-2).
- P3I-3: Frontier ceiling adequacy at $10/$50 price points (F-4).
- P3I-4: Haiku-vs-boilerplate-ceiling mismatch (F-5).
- P3I-5: Intentional standard-tier order vs dead-weight appends (F-6).
- P3I-6: Nemotron default move + third-party-served exception posture (F-7).
- P3I-7: `routing_class` new-value decision with candidates (F-3 + AC-5).
- P3I-8: `data_classification` schema-enum vs accepted late failure (F-8).
- P3I-9: Family-alias resolution design over the AC-6 inventory (may-alias-route vs must-pin, and what binds source + timestamp).
- P3I-10: `NO_ELIGIBLE_MODEL` is currently unreachable by construction (F-9) — the fail-closed path has no live exercise; decide whether a negative probe belongs in Phase 3 tests.
- P3I-11: Role-aware dispatch vs tier-pinning-as-declared for coordinator/verifier (F-10); frontier cost posture — capability-first default vs price order (AC-4).

## Independent review of findings (AC-8 — CLOSED)

*Round 1 → REQUEST CHANGES (2 Blockers: coordinator/verifier cells stated unevaluated dispatch; "no silent substitution"/"nothing fails open" contradicted by the doc's own admissions. 3 Majors: phantom F-2/F-3/F-9 cites; L78 prescribed resolver design; frontier "price-ascending" mislabel. 1 Minor: hash phrasing, throw-site cites, haiku inference, invariant counting). Triage: all valid → fixed (tier-intent restatement + F-10; admitted fail-open wording; full F-1..F-10 definitions; questions-only alias stance; track-record-first verdict; method-stated nits). Round 2 → REQUEST CHANGES with 1 residual (alias table Implications still prescribed while stance undecided) → fixed to options/undecided. Round 3 (micro-confirmation) → APPROVE. No finding challenged the matrix arithmetic, the fail-closed inventory, or the P3I extraction.*

*Closure recommendation: parcel complete against AC-1..AC-8. The extracted Phase-3 input list (P3I-1..P3I-11) is the handoff to the Phase 3 design parcel.*
