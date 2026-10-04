# PMC-P2 Review A — findings (2026-09-26)

**Reviewer:** Review A (independent adversarial review) · **Target:** `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md` + `routing-policy/src/{route-receipt,pi-resolver,launch-boundary,host-settings-proposal}.ts` + `routing-policy/tests/{pi-fixtures,pi-resolver.test,launch-boundary.test,host-settings-proposal.test}.ts` + `pmc-p2-pi-host-settings-PROPOSED-2026-09-26.json` · **Ground truth:** `charter.md` (A1–A3, D3/D4/D8/D9, M2–M4), `a54-ratification-2026-09-26.md`, `pmc-p0-suitability-rubric.md` (synced mirror), `pmc-p1-fallback-contract-2026-09-26.md`.

**Method:** every record § 2 claim traced to a named test or to code behavior; fail-closed audit executed as a live trace (tsx repro of `resolveRoute`/`verifyLaunch`/`issueBreakGlassException` against the shipped policy and one deliberate mutation per leak class — read-only, scratch outside the repo, deleted after); artifact and new modules grepped for credential shapes, host paths, and request payloads; `pi-openrouter.ts` byte-identity re-checked by MD5. Repro commands are recorded inline; no repository file was modified by this review.

---

## 1. Per-claim verdicts (record § 2, items 1–13)

| # | Claim (quoted) | Verdict | Proof located | Finding |
|---|---|---|---|---|
| 1 | "`resolveRoute` emits all four per request — `lane_config` … `route.openrouter_constraints` … `fallback_handoff` … and the signed receipt" | **Verified** | `pi-resolver.test.ts` "L5 resolves to the cheapest rankable primary…" (lane_config budget/thinking/data-controls asserts), "cheapest-eligible ordering…" (`openrouter_constraints` asserts), "fallback handoff records…" | — |
| 1b | "The 'no-secret' property is machine-checked (`tests/pi-resolver.test.ts` …)" | **Verified as far as tested** | test "the route receipt is a no-secret artifact (D2/A1)" scans key/secret/password/credential/bearer/authorization names and `sk-`/`Bearer ` values | scan covers fixture-built receipts only; the `request: unknown` echo is caller-shaped (noted, not raised as a finding — the full-input receipt is deliberate) |
| 2 | "`verifyLaunch` fails closed on a missing receipt … a stop/non-approved receipt … an unsigned receipt … a tampered receipt … a lane mismatch … stale/future timestamps" | **Verified** | one named test per refusal in `launch-boundary.test.ts` (missing / status / unsigned+tampered / lane mismatch / stale+future+no-bound+bad-clock) | — |
| 2b | "`issueBreakGlassException` requires explicit owner authorization per use, is refused for a coordinator, builder, reviewer, or automated retry" | **Partially verified — gaps** | issue-side negatives cover all four requester kinds + no-auth/no-checks/no-reason; verify-side covers tampered + smuggled prohibited requester | **F6, F7** — exception verification never receives `LaunchContext` (cross-lane + stale reuse passes); "owner" is a self-asserted field |
| 3 | "the R3 filter denies a binding whose declared family is excluded … and refuses a binding with no declared family" | **Verified** | `pi-resolver.test.ts` "R3 negatives: excluded family is denied, never downgraded; unknown family refuses" | — |
| 3b | "cross-provider handoff records carry `continuation: 'refused-mid-turn'`" | **Verified** | `pi-resolver.test.ts` "fallback handoff records…" asserts `continuation: 'refused-mid-turn'` on `cross-provider-attempt` | — |
| 4 | "every candidate of the lane's declared routes is evaluated with all seven ranking inputs recorded … the receipt records every candidate, not only the winner" | **Verified for binding-typed refs; gap** | test "the receipt records every ranking input for every candidate (A3)…" asserts R1–R7 per evaluation and `evaluations.length === 4` | **F1** — a `candidate`-typed (schema-legal, validator-accepted) route ref is silently skipped by `indexLaneBindings` and never evaluated |
| 4b | "an unset declaration slot is a **stop receipt**, never a silent default — a54 dispositions 2/3" | **Gap — claim fails on one shape** | `providerRuleGate` stops correctly for the exact-typed slots (`pi-resolver.test.ts` "RESIDUAL_FABRICATED_REFUSED holds…" + lane-by-lane test) | **F3** — an unrecognized `provider_rule.kind` falls through to `return stops` (empty); repro shows an L1 request **approved** via cheapest-eligible with the pin bypassed |
| 5 | "every approved route carries exactly its one declared typed fallback and the honest comparability envelope (`FALLBACK_SUITABILITY_UNPROVEN` today)" | **Verified for the shipped policy; gap on legal shapes** | test asserts `route.fallback.suitability` deep-equals the honest `FALLBACK_SUITABILITY_UNPROVEN` envelope (consistent with PMC-P1 § 7's contract encoding) | **F1** — with a `candidate`-typed fallback the approved route carries the raw candidate key as `model` (fabricated), and the fallback is never evaluated |
| 6 | "any L6 request returns `LANE_DISABLED_REFUSED` before any filter, ranking, or tie-break … the receipt records zero evaluations — negative-controlled" | **Verified** | `pi-resolver.test.ts` lane-by-lane test asserts `stopNames(l6) === ['LANE_DISABLED_REFUSED']` and `l6.evaluations` deep-equals `[]`; matches rubric § 5 rule 1 | — |
| 7 | "`defaultProvider`/`defaultModel`/`defaultThinkingLevel` are proposed **kept unchanged** … each with M3 provenance" | **Verified as stated** | `host-settings-proposal.test.ts` "M3: interactive defaults are kept unchanged" | see **F8** — the kept `defaultModel` (`qwen/qwen-2.5-coder-32b`) is simultaneously proposed for removal from `enabledModels` |
| 8 | "the proposal enables exactly the charter-matrix binding set in Pi host spelling … 15 identities … removes the five stale/struck enabled entries; add/remove sets are disjoint and tested" | **Add set verified; removes partially authorized** | test "M4: the proposal enables exactly the charter-matrix binding set" asserts adds == binding-layer set, `adds.length === 15`, disjoint from current; independent cross-check of `charter.md` matrix rows 1–6 gives exactly 8 `opencode:` + 7 `openrouter:` unique non-struck identities = 15 | **F8** — only the Jev removal is charter-authorized (M2); the other four cite "Amendment 02 M4", whose text assigns enablement only |
| 9 | "SCF-3 … disposed on P2's own surfaces … (a) `ENDPOINT_DIVERGENCE_REFUSED` … (b) `validatePiOpenRouterRouting` rejects `baseUrl: 'https://openrouter.ai/api'` … (c) registration kept at the const" | **Verified** | (a) `pi-resolver.test.ts` "endpoint negatives…" (divergent endpoint + SCF-3 non-const registration); (b) `host-settings-proposal.test.ts` "SCF-3: the pi-openrouter.ts schema const rejects the divergent catalogue endpoint"; (c) "D2: exactly the two charter provider registrations…"; `src/pi-openrouter.ts` MD5 `74d62966c1eaf4974198770892cd2a03` matches § 7 | — |
| 10 | "every field of the proposed artifact … maps to at least one named source + locator … completeness is machine-tested" | **Mechanically verified; source resolvability gap** | test "every proposed field carries D9-style mapping provenance" asserts `provenance.length >= 1` and non-empty `source`/`locator` per ref | **F9** — the test checks non-empty strings only; `pmc-p0-capability-baseline.md` (cited in 11 provenance refs) is absent from the live worktree |
| 11 | "every receipt attests `static-conformance` only and enumerates by name every unproven claim (`DELTA_L_UNSET`, `FALLBACK_SUITABILITY_UNPROVEN`, the per-binding residuals …)" | **Verified on approved receipts; over-claimed for stop receipts** | test "the receipt records every ranking input…" asserts `DELTA_L_UNSET` + `FALLBACK_SUITABILITY_UNPROVEN` in `unproven_claims` of the **approved** receipt; A6 smuggle test covers the tamper case | **F5** — stop receipts never carry `FALLBACK_SUITABILITY_UNPROVEN` (`unprovenClaimsFor` adds it only `if (route !== null)`); **F7** — "a smuggled attested state fails the launch boundary's signature check" holds only for post-sign tampering |
| 12 | "on the shipped evidence no binding is rankable; every lane's resolution stops fail-closed with named refusals/residuals (negative-controlled lane by lane…)" | **Verified** | lane-by-lane test (`L1_PINNED_PROVIDER_UNSET`, `L2_PINNED_PROVIDER_UNSET`, `COST_UNKNOWN` for `implementation/complex`, `L4_PROVIDER_PREFERENCE_UNSET`, L5 refusal set, `LANE_DISABLED_REFUSED`); independent check of `routing-policy.yaml` `classes` confirms no `implementation/complex` ceiling exists | — |
| 13 | "at resolve time a declaration slot that is not the exact typed-unavailable residual, **an envelope residual outside the contract vocabulary**, or an identity name outside the vocabulary is refused (`RESIDUAL_FABRICATED_REFUSED` …)" | **Verified for the five named negative controls; universal claim fails** | test "RESIDUAL_FABRICATED_REFUSED holds at resolve time for every declaration slot and name" covers pinned slot, preference slot, `quality_tolerance`, one **binding** envelope (`cost`), identity names, plus the static `validatePolicy` re-proof | **F2** — the **lane-route `comparability` envelope** is copied verbatim into an approved receipt with no vocabulary check; **F4** — `${lane}_PINNED_PROVIDER_UNSET`-shaped slot names on non-frozen lanes are emitted as stop names outside the vocabulary |

## 2. Fail-closed trace — the five residuals (L1 / L2 / L3 / L4 / DELTA_L)

Enforcement site for all five: `providerRuleGate` (`pi-resolver.ts:510–557`), reached at `pi-resolver.ts:906` after structural gates, the L6 gate, and the R5 ceiling gate, and **before** any selection. The gate requires the slot to be exactly `state: 'unavailable'` with the exact expected residual (`L1_PINNED_PROVIDER_UNSET`, `L2_PINNED_PROVIDER_UNSET`, `L3_PROVIDER_PREFERENCE_UNSET`, `L4_PROVIDER_PREFERENCE_UNSET`, `DELTA_L_UNSET`); anything else is `RESIDUAL_FABRICATED_REFUSED`. On the frozen lane map (`routing-policy.yaml` `lane_map`) this holds for all five slots — traced and reproduced.

| Residual | Trace result | Leak |
|---|---|---|
| `L1_PINNED_PROVIDER_UNSET` | unset slot → stop receipt `L1_PINNED_PROVIDER_UNSET`; wrong slot → `RESIDUAL_FABRICATED_REFUSED` (tested) | **F3** — if `lane_map.L1.provider_rule.kind` is anything other than the three dispatched kinds (e.g. `pin-me-later`), `providerRuleGate` falls through to `return stops` (`pi-resolver.ts:556`) with **no stops** and the request is **approved** by cheapest-eligible ordering (repro: `status: approved | stops: [] | chosen: opencode/claude-opus-5-5`) — the unset pin silently substitutes a default, which a54 disposition 2 forbids ("An unset pin is a stop receipt, never a silent default") |
| `L2_PINNED_PROVIDER_UNSET` | identical path to L1 | same **F3** leak class |
| `L3_PROVIDER_PREFERENCE_UNSET` | unset → stop `L3_PROVIDER_PREFERENCE_UNSET` (tested via the with-ceiling fixture); wrong → fabricated-refused | same **F3** leak class; **F4** name-composition leak |
| `L4_PROVIDER_PREFERENCE_UNSET` | unset → stop `L4_PROVIDER_PREFERENCE_UNSET` (tested) | same **F3** / **F4** leak class |
| `DELTA_L_UNSET` | exact-residual check runs first in the gate (`pi-resolver.ts:514–520`) on every non-disabled lane; wrong → fabricated-refused (tested) | none found for this slot |

**Adjacent fabrication paths found in the same audit** (not residual slots, but the same "silently fabricate" class the record claims cannot happen — "Never fabricates a value", `pi-resolver.ts` module docstring):

1. **F2 — fabricated comparability residual reaches an APPROVED receipt.** Repro: mutate every `lane_routes[*].comparability` to `{state:'unproven', residual:'TOTALLY_MADE_UP'}` → `resolveRoute` returns `status: approved`, `route.fallback.suitability = {"state":"unproven","residual":"TOTALLY_MADE_UP"}`, `fallback_handoff.fallback_suitability` likewise, `stops: []`, and `unproven_claims` silently drops the unknown name (filtered by `RESIDUAL_CLAIM_TEXT`). `chosenRoute.comparability` is copied verbatim at `pi-resolver.ts:1029` and `:1038` with no `VOCABULARY_NAMES` check (binding envelopes get one at `evaluateCandidate.noteResidual`; this envelope does not). PMC-P1's `validatePolicy` does check it (`validator.ts:851–855`) — but the record's claim 13 is about **resolve time**, and its own negative controls mutate policies without the validator.
2. **F1 — fallback model fabricated from the raw ref.** Repro: set `lane_routes` L5/opencode `fallback: {type: 'candidate', ref: 'qwen3.8-flash'}` (schema-legal — `lane-route.schema.json` `type` enum admits `candidate`; `validator.ts:705–723` resolves it to a binding id and accepts) → `resolveRoute` approves with `fallback: {"binding_id":"qwen3.8-flash","model":"qwen3.8-flash","suitability":…}`. `indexLaneBindings` skips non-`binding` refs (`pi-resolver.ts:212`), so the fallback is never evaluated (R1–R7 unrecorded, contradicting claim 4's "every candidate … is evaluated" and rubric § 1 term 1), and `model: fallbackIndexed?.binding.model ?? fallbackRef` (`pi-resolver.ts:1028`) silently manufactures the `model` value. The same fabrication fires for a dangling `type: 'binding'` fallback ref.

**Set-with-evidence vs fail-closed (record § 5):** the disposition table (L1/L2 need a54-disposition-2 owner declaration + A6 `live-availability`; L3/L4 disposition 3; `DELTA_L` disposition 5 `model-quality`) matches `a54-ratification-2026-09-26.md` items 2/3/5 verbatim; "Set-with-evidence: **none**" is the correct and honest reading of the recorded catalogue GET. No finding.

## 3. Secrets / artifact / proposed-not-written audit

- **Credential shapes:** artifact grep for `api[_-]?key|secret|password|credential|bearer|authorization|token|sk-…|ghp_|xox|AKIA|-----BEGIN` finds only prose (`"credentials remain environment references…"`, `contains_credential_value: false`, `providerKey` field names). No key/token value anywhere. New modules: none. **Clean.**
- **Host paths:** artifact contains no `~/.pi`, `C:\`, `/Users/`, `/home/`, `AppData`, or `%USERPROFILE%` string; the only `settings.json` occurrence is the discipline sentence "Foreman never writes Pi's shared settings.json". `target.file` says "host path deliberately not addressed". **Clean.**
- **Request payloads:** the artifact is a change set; no request envelope, no receipt, no dispatch payload embedded. **Clean.**
- **Purity of the generator (proposed-not-written):** `host-settings-proposal.ts` imports only `./pi-openrouter.js` (data + pure validator) and `./types.js` (types); no `node:fs`, `node:os`, `process`, `fetch`, or `require` in any of the four new modules (`route-receipt.ts` uses `node:crypto` hashing only; `launch-boundary.ts` uses `Date.parse` on injected strings only). The artifact is byte-pinned by the no-drift test and states `status: "PROPOSED-NOT-WRITTEN"` + `write_policy: "Foreman NEVER writes Pi's host-owned settings file"`. **The claim holds structurally.**
- **Byte-identity of the pre-existing diffs (record § 7):** all 11 MD5s recomputed and **exact matches** (`pi-openrouter.ts` `74d62966…`, schema `59ec5c88…`, both P1 tests, `templates/pi-openrouter-routing.json`, and the six excluded templates).
- **Test-count claims:** `pi-resolver.test.ts` = 20 `test(`, `launch-boundary.test.ts` = 10, `host-settings-proposal.test.ts` = 10 — matches the record's +40 accounting.

## 4. Findings

### F1 — Approved route fabricates a fallback `model` from the raw ref; `candidate`-typed fallbacks are never evaluated
**Severity: major** · Confidence: 0.9

**Claim quoted (record § 2 item 5):** "every approved route carries exactly its one declared typed fallback and the honest comparability envelope …" and `pi-resolver.ts` docstring: "Never fabricates a value: unmet evidence becomes named refusals/residuals in the receipt and the request stops fail-closed."

**Evidence:** `pi-resolver.ts:212` (`if (ref.type !== 'binding') continue`) skips non-binding refs in `indexLaneBindings`; `pi-resolver.ts:1004–1005,1028` look up the fallback by raw ref and fall back to `model: fallbackIndexed?.binding.model ?? fallbackRef`. Repro output: a `lane_routes` entry with `fallback: {type: 'candidate', ref: 'qwen3.8-flash'}` — accepted by `schemas/lane-route.schema.json` and resolved cleanly by `validator.ts:705–723` — yields `status: approved | fallback: {"binding_id":"qwen3.8-flash","model":"qwen3.8-flash",…}`: the "model" is the candidate key, the fallback carries no R1–R7 evaluation, and the handoff plan will later `route-to-declared-fallback` to it. Dangling `type: 'binding'` refs produce the same fabrication.

**Recommendation:** in the approval path, resolve `RouteRef`s the way `validator.ts` `resolve()` does (candidate → its provider-matched binding) and refuse `REPRESENTATION_INCOMPLETE_REFUSED`/`UNSUPPORTED_MODEL_REFUSED` when the chosen route's fallback does not resolve to an evaluated binding; delete the `?? fallbackRef` default.

### F2 — A fabricated lane-route `comparability` residual lands verbatim in an approved receipt
**Severity: major** · Confidence: 0.95

**Claim quoted (record § 2 item 13):** "at resolve time … an envelope residual outside the contract vocabulary … is refused (`RESIDUAL_FABRICATED_REFUSED`; negative-controlled for the pinned slot, the preference slot, `quality_tolerance`, envelope residuals, and identity names)" and `pi-resolver.ts` docstring: "any other name is itself refused (`RESIDUAL_FABRICATED_REFUSED`), so a receipt can never carry a fabricated name."

**Evidence:** `pi-resolver.ts:1029` (`suitability: chosenRoute.comparability`) and `pi-resolver.ts:1038` (`fallback_suitability: chosenRoute.comparability`) copy the `LaneRoute.comparability` `Evidence<string>` into the receipt with no vocabulary check; `unprovenClaimsFor` (`pi-resolver.ts:603–610`) silently drops names absent from `RESIDUAL_CLAIM_TEXT`. Repro: `comparability: {state:'unproven', residual:'TOTALLY_MADE_UP'}` on all lane routes → `status: approved`, `route.fallback.suitability.residual = "TOTALLY_MADE_UP"`, `stops: []`, no `RESIDUAL_FABRICATED_REFUSED`. The only envelope negative control mutates a **binding** envelope (`cost`) — `pi-resolver.test.ts` "RESIDUAL_FABRICATED_REFUSED holds…". PMC-P1's document layer checks this envelope (`validator.ts:851–855`), but the record claims resolve-time enforcement and its negative controls deliberately run without `validatePolicy`.

**Recommendation:** run `comparability` through the same `noteResidual`/`VOCABULARY_NAMES` gate as binding envelopes (refuse `RESIDUAL_FABRICATED_REFUSED` at resolve time), and add a negative control that mutates `lane_routes[*].comparability`.

### F3 — `providerRuleGate` fail-opens on an unrecognized `provider_rule.kind`: an unset pin silently becomes cheapest-eligible
**Severity: major** · Confidence: 0.85

**Claim quoted (record § 2 item 4 / § 3 step 5):** "an unset declaration slot is a **stop receipt**, never a silent default — a54 dispositions 2/3" (a54 disposition 2: "An unset pin is a stop receipt, never a silent default").

**Evidence:** `providerRuleGate` dispatches `none` / `pinned-provider` / `declared-preference` and otherwise falls through to `return stops` with an empty list (`pi-resolver.ts:556`), which is correct only for `cheapest-eligible`. There is no lane↔rule-kind conformance check at resolve time. Repro: `lane_map.L1.provider_rule = {kind: 'pin-me-later'}` → `resolveRoute(L1, architecture/risk)` returns `status: approved | stops: [] | chosen: opencode/claude-opus-5-5` — the request proceeds while `L1_PINNED_PROVIDER_UNSET` is still unset, with a price-ordered default substituted for the A3 pin. `validator.ts:478–481` enforces the frozen kind per lane statically, but the record claims the resolver itself is the enforcement layer (its mutation-seam tests never call `validatePolicy`), and `resolveRoute`'s contract does not require pre-validated input.

**Recommendation:** treat any `kind` outside the three dispatched rules as `ROLE_LANE_MAP_VIOLATION`/`RESIDUAL_FABRICATED_REFUSED` (fail closed), or add explicit per-lane kind conformance mirroring `validator.ts:478–481`.

### F4 — Composed `${lane}_PINNED_PROVIDER_UNSET` / `${lane}_PROVIDER_PREFERENCE_UNSET` stop names escape the vocabulary check
**Severity: minor** · Confidence: 0.85

**Claim quoted (`pi-resolver.ts` docstring):** "Every refusal/residual/hold name emitted here comes from the ratified vocabulary (`types.ts`); any other name is itself refused (`RESIDUAL_FABRICATED_REFUSED`), so a receipt can never carry a fabricated name."

**Evidence:** `pi-resolver.ts:525` (`const expected = \`${lane}_PINNED_PROVIDER_UNSET\``) and the analogous preference line compose the stop name from the lane id without checking `VOCABULARY_NAMES`. Repro: `lane_map.L5.provider_rule = {kind: 'pinned-provider', pinned_provider: {state: 'unavailable', residual: 'L5_PINNED_PROVIDER_UNSET'}}` → the receipt's stop list is `['L5_PINNED_PROVIDER_UNSET']`, a name absent from `RESOLVER_REFUSALS`/`RESOLVER_HOLDS`/`CONTRACT_REFUSALS`/`CONTRACT_RESIDUALS`. Same for `L5_PROVIDER_PREFERENCE_UNSET`, `L3_PINNED_PROVIDER_UNSET`, etc. The in-vocabulary expectations (L1/L2/L3/L4) are unaffected.

**Recommendation:** validate `expected in VOCABULARY_NAMES` before pushing (else `RESIDUAL_FABRICATED_REFUSED`), as `evaluateCandidate` already does for every name it emits.

### F5 — Claim 11 over-claims: stop receipts never enumerate `FALLBACK_SUITABILITY_UNPROVEN`
**Severity: minor** · Confidence: 0.9

**Claim quoted (record § 2 item 11):** "every receipt attests `static-conformance` only and enumerates by name every unproven claim (`DELTA_L_UNSET`, `FALLBACK_SUITABILITY_UNPROVEN`, the per-binding residuals …)."

**Evidence:** `unprovenClaimsFor` adds the comparability residual only `if (route !== null)` (`pi-resolver.ts:604–607`); every stop receipt has `route === null`. Repro on the shipped L1 stop receipt: `unproven_claims` residuals = `[AVAILABILITY_UNVERIFIED, CONTEXT_UNKNOWN, COST_UNKNOWN, DATA_CLASS_UNKNOWN, DELTA_L_UNSET, OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY, QUALITY_UNRECORDED]` + 2 free-text claims — no `FALLBACK_SUITABILITY_UNPROVEN`, and (relatedly) the pin residual appears in `stops` but not in `unproven_claims`. The test asserting both names (`pi-resolver.test.ts`, "the receipt records every ranking input…") exercises only the approved receipt.

**Recommendation:** either add `FALLBACK_SUITABILITY_UNPROVEN` to `unprovenClaimsFor` for stop receipts (or enumerate the lane route's comparability residuals regardless of `route`), or scope claim 11 to approved receipts.

### F6 — Break-glass verification drops `LaunchContext`: one exception authorizes every lane, indefinitely, with unlisted checks silently bypassed
**Severity: major** · Confidence: 0.85

**Claim quoted (record § 2 item 2):** "`issueBreakGlassException` requires explicit owner authorization **per use** … and emits a distinctly marked `BREAK-GLASS-EXCEPTION` receipt **naming the bypassed checks**"; charter A1: the boundary "fails closed when it is missing, stale, mismatched against the requested lane, or unsigned by the resolver", and the exception receipt names "the bypassed check".

**Evidence:** `verifyLaunch` routes exceptions to `breakGlassVerdict(receipt)` without the context (`launch-boundary.ts:157`); `breakGlassVerdict` never compares `receipt.requested_lane` to `context.requested_lane` and applies no freshness bound. Repro: an exception issued for L5 with `bypassed_checks: ['signature']` verifies `{"ok":true,"mode":"break-glass","refusals":[],"bypassed_checks":["signature"]}` for a **lane L2** launch timestamped 2027-01-01 — cross-lane and stale, while the verdict tells the caller only `signature` was bypassed (lane-match and freshness were bypassed unnamed). "Per use" is likewise unenforced (a single exception re-verifies any number of times).

**Recommendation:** pass `context` into `breakGlassVerdict`, refuse `RECEIPT_LANE_MISMATCH_REFUSED`/`FRESHNESS_*` unless those checks are named in `bypassed_checks`, and name every check actually bypassed in the verdict.

### F7 — Break-glass "owner-only" and the A6 attested-state rule are enforced only by self-asserted fields over a recomputable digest
**Severity: minor** · Confidence: 0.7

**Claim quoted (record § 2 item 2/11):** "is never available to a coordinator, builder, reviewer, or automated retry (…) — negative-controlled for all four kinds", "a smuggled attested state fails the launch boundary's signature check".

**Evidence:** `requested_by: 'owner'` is caller-supplied (`launch-boundary.ts:98,228` check only the claimed label), and `signature` is `documentDigest` of the content — publicly recomputable by any caller (`route-receipt.ts:212–231`). The four negative controls prove rejection of *honestly labeled* prohibited requesters; the tamper test proves detection of *post-sign* mutation. A from-scratch document with `requested_by: 'owner'` or `attested_state: 'live-availability'` plus a fresh digest passes `verifyLaunch` (`attested_state` is never examined at the boundary; `AttestedState` is a closed 3-variant union at `types.ts:310` that the boundary could enforce). The digest-only design is explicitly disclosed in `route-receipt.ts` ("an integrity binding, not an authenticity claim") — the finding is the record presenting these checks as A1/A6 enforcement without that scope.

**Recommendation:** state the trust boundary in the record (label-checking + tamper-evidence only), and add the cheap boundary check `attested_state === 'static-conformance'` so the A6 "never implies a state it did not attest" invariant is enforced structurally.

### F8 — Four `enabledModels` removals cite M4, which authorizes enablement only; one removal disables the M3-mandated interactive default model
**Severity: major** · Confidence: 0.8

**Claim quoted (record § 2 item 8 / § 4):** "removes the five stale/struck enabled entries", provenance `{"source": "charter.md", "locator": "Amendment 02 M4"}` with reason "stale entries do not resolve in the live store".

**Evidence:** charter M4 assigns only enablement: "Enabling the matrix model set is assigned to **PMC-P2** as explicit, named configuration work" — it says nothing about removing existing enabled entries; only M2 strikes an entry (`typesafe/jev-1.13`), which the generator handles separately (`host-settings-proposal.ts:216`). The four other removals (`opencode:deepseek/deepseek-r1-distill-qwen-32b`, `opencode:qwen/qwen-2.5-coder-32b`, `openrouter:anthropic/claude-3.5-sonnet`, `openrouter:openai/gpt-4o-mini`; artifact lines 59–140) cite M4 and assert "stale entries do not resolve in the live store" — an unproven live-availability claim (the record itself holds that catalogue metadata "is never an availability oracle", and its § 5 GET verified only that matrix identities are present and Jev absent). Worse, `opencode:qwen/qwen-2.5-coder-32b` is exactly the model charter M3 mandates as the corrected interactive default, which the same artifact keeps as `defaultModel: "qwen/qwen-2.5-coder-32b"` (artifact `defaultModel` keep entry) — applying the proposal as written leaves the kept default pointing at a model the proposal disables.

**Recommendation:** re-scope the four non-struck removals behind an explicit owner decision (or drop them), replace "do not resolve in the live store" with the evidenced statement, and reconcile the removal with the M3-kept default.

### F9 — D9 provenance cites `pmc-p0-capability-baseline.md`, absent from the live worktree; the completeness test cannot detect a dangling source
**Severity: minor** · Confidence: 0.7

**Claim quoted (record § 2 item 10):** "every field of the proposed artifact … maps to at least one named source + locator (… `pmc-p0-capability-baseline.md` § 3 …); completeness is machine-tested."

**Evidence:** the artifact carries 11 provenance refs to `pmc-p0-capability-baseline.md` (e.g. artifact lines 27–30, 54–57, 594–597), but that file does not exist under `plugins/foreman-line/docs/goals/pi-model-configuration/` in this worktree (`git ls-files` does not list it; it exists only under `plugins/synced/**/foreman-line~g2/docs/goals/pi-model-configuration/` and in commit `b754a50`). The "complete-by-test" check (`host-settings-proposal.test.ts:31–48`) asserts only that `source`/`locator` strings are non-empty, so a dangling reference passes.

**Recommendation:** land the PMC-P0 evidence artifacts at the cited path (or re-point provenance at a resolvable path) and extend the completeness test to assert each cited source resolves.

## 5. Sample-verified citations (≥8)

1. Record § 7 MD5 table — all 11 hashes recomputed and exact (`src/pi-openrouter.ts` = `74d62966…`, etc.).
2. "20 / 10 / 10 new tests" — counted `test(` declarations: 20 / 10 / 10.
3. Claim 8 "15 identities" — charter matrix rows 1–6 unique non-struck identities = 8 `opencode:` + 7 `openrouter:` = 15; matches artifact add set exactly.
4. Claim "8 endpoint divergences (SCF-1 ×5, SCF-2 ×1, SCF-3 ×2)" — artifact `endpoint_divergences` counted: 8 total, distribution matches.
5. Claim 12 "no ratified `ceiling_usd` for `implementation/complex`" — `routing-policy.yaml` `classes` contains only boilerplate/standard-feature/architecture-risk/implementation-standard.
6. Claim 6 "receipt records zero evaluations" for L6 — asserted in the lane-by-lane test; matches code (`stopReceipt` with `evaluations: []`).
7. Claim 9(b) SCF-3 const rejection — named test present and asserting `validatePiOpenRouterRouting` rejects `baseUrl: 'https://openrouter.ai/api'`.
8. a54 dispositions 2/3/5 vs `providerRuleGate` — exact-residual enforcement reproduced live for all five slots.
9. Rubric § 4 "documented stable order (primary before fallback, then provider key, then model id)" vs `pi-resolver.ts` sort — cost, then role, then `binding_id` (equivalent for the two providers); R7 step degeneration is honestly labelled DERIVED and enumerated as unproven.
10. Rubric § 5 rule 1 vs the L6 gate — "no eligibility filtering, ranking, or tie-break is evaluated" matches the early return.
11. Charter M3 values (`opencode` / `qwen/qwen-2.5-coder-32b` / `minimal`) vs `settings-projection.json` and the artifact's three `keep` entries — match.
12. Fail-closed live repro — five scenarios executed (candidate-typed fallback; fabricated comparability; L1 stop enumeration; `L5_PINNED_PROVIDER_UNSET` name escape; `pin-me-later` fail-open) plus the break-glass cross-lane/stale scenario.

---

**VERDICT: REQUEST CHANGES** — 0 blocker, 5 major (F1, F2, F3, F6, F8), 4 minor (F4, F5, F7, F9), 0 nit. The record is unusually honest and well-anchored (byte-identity pins, negative controls, and the proposed-not-written discipline all verify), but its two headline universal claims — "a receipt can never carry a fabricated name" and "an unset declaration slot is a stop receipt, never a silent default" — are falsified at resolve time by F2 and F3, the approved-route emission fabricates a fallback model under a schema-legal ref (F1), the break-glass exception escapes its per-use/named-bypass scoping (F6), and the PROPOSED artifact removes four enabled models under an M4 citation that authorizes enablement only (F8).

---

# Delta re-review — post-review rework (attempt 2), 2026-09-27

**Trigger:** coordinator DELTA RE-REVIEW request (2026-09-27). **Scope:** verify every review-A finding F1–F9 against the rework (disposition table in the work record § 9), re-run the named regression tests, re-run the original repro scenarios, check the corrected claims, and spot-verify ≥5 review-B dispositions.

**Evidence this round:** the three PMC-P2 test files run clean — `npx tsx --test tests/pi-resolver.test.ts tests/launch-boundary.test.ts tests/host-settings-proposal.test.ts` → **59 tests / 59 pass / 0 fail**, including every named regression test below; an independent repro re-ran all six original review-A scenarios plus four review-B scenarios against the reworked code; the § 7 byte-identity pins re-verified 11/11.

## D.1 Per-finding verification (F1–F9)

| Finding | Disposition claim | Delta verification | Result |
|---|---|---|---|
| **F1** fabricated fallback `model`; candidate/dangling refs never evaluated | fixed — refs resolve as `validator.ts resolve()`; unresolvable → `FALLBACK_DANGLING_REFERENCE`/`FALLBACK_PROVIDER_MISMATCH`; `?? fallbackRef` deleted | Repro: candidate ref → `fallback: {"binding_id":"opencode/glm-5.3-flash","model":"glm-5.3-flash"}` with R1–R7 recorded (no fabrication); dangling `type:'binding'` ref → `stop ['FALLBACK_DANGLING_REFERENCE']`. Named tests `"F1/RB-3: …resolves exactly as the validator…"` and `"…unresolvable fallback ref stops fail-closed…"` pass. **Residual gap → DA-1 below** | **fixed** (residual DA-1) |
| **F2** fabricated comparability residual in approved receipts | fixed — `comparabilityGate` (vocabulary + declared-over-unproven-δ_L) | Repro: `comparability: {state:'unproven', residual:'TOTALLY_MADE_UP'}` → `stop ['RESIDUAL_FABRICATED_REFUSED']`, `route: null`; declared verdict while δ_L unset → `stop ['FALLBACK_SUITABILITY_UNPROVEN']` (RB-4). Named tests `"F2/RB-4: …"` and `"RB-4: …"` pass | **fixed** |
| **F3** `providerRuleGate` fail-open on undispatched kind | fixed — frozen per-lane kind conformance | Repro: `kind: 'pin-me-later'` on L1 → `stop ['ROLE_LANE_MAP_VIOLATION']`, `chosen: null`; smuggled `kind: 'cheapest-eligible'` on L1 → same. Named test `"F3: an undispatched or lane-mismatched provider_rule.kind refuses…"` passes | **fixed** |
| **F4** composed `${lane}_*` names escape vocabulary | fixed — composed names vocabulary-checked before emission | Repro: `L5_PINNED_PROVIDER_UNSET`-shaped slot → `stop ['RESIDUAL_FABRICATED_REFUSED','ROLE_LANE_MAP_VIOLATION']`; no out-of-vocabulary name in any stop. Named test `"F4: composed lane-suffixed declaration-slot names never reach a receipt"` passes | **fixed** |
| **F5** stop receipts omit `FALLBACK_SUITABILITY_UNPROVEN` | fixed — lane comparability residuals enumerated on every receipt | Repro: shipped L1 stop receipt `unproven_claims` now includes `FALLBACK_SUITABILITY_UNPROVEN` alongside `DELTA_L_UNSET` and the per-binding residuals; claim 11 corrected in § 2. Named test `"F5: stop receipts enumerate the lane routes comparability residuals…"` passes | **fixed** |
| **F6** break-glass drops `LaunchContext`; unnamed bypasses | fixed — context enforced unless named; bypass names ∈ `LAUNCH_REFUSALS`; verdict reports all skipped checks | Repro: cross-lane (L2) fresh → `RECEIPT_LANE_MISMATCH_REFUSED` ("the lane check is not named bypassed"); same-lane stale with `FRESHNESS_STALE_REFUSED` named → `ok:true` reporting the skipped family (`RECEIPT_MISSING/STATUS/UNSIGNED/DIGEST_MISMATCH/EVIDENCE_STATE_UNATTESTED` + the named freshness) — no unnamed bypass; `bypassed_checks: ['signature']` and `['BREAK_GLASS_DENIED_REFUSED']` refused at **issue** time (`BREAK_GLASS_DENIED_REFUSED`). All four `"F6/RB-2: …"` / `"RB-2: …"` tests pass | **fixed** |
| **F7** self-asserted owner / no `attested_state` boundary check | fixed — `EVIDENCE_STATE_UNATTESTED` enforced; trust boundary stated | Repro: re-signed receipt with `attested_state: 'live-availability'` → refused `EVIDENCE_STATE_UNATTESTED` ("the boundary never re-opens evidence claims"); item 2's correction now states the label-check/tamper-evidence trust boundary and that "per use" is an owner attestation. Named test `"F7: a re-signed smuggled attested state is refused…"` passes | **fixed** |
| **F8** four removals under M4; M3 default disabled | fixed — one removal (M2 Jev), four kept with the missing authorization stated, M3 default kept + enabled | Artifact regenerated: `enabledModels` now 1 `remove` (`openrouter:typesafe/jev-1.13`, M2 provenance), 4 `keep` ("retained: no ratified clause authorizes removal from enabledModels (Amendment 02 M4 assigns enablement…)"), 15 `add`; `defaultModel` kept `qwen/qwen-2.5-coder-32b` and its `opencode:qwen/qwen-2.5-coder-32b` entry is kept. Named test `"F8: removals cite what authorizes them, and the M3-kept default model stays enabled"` passes | **fixed** |
| **F9** dangling `pmc-p0-capability-baseline.md` provenance | fixed — sources root-relative and resolvable; completeness test asserts resolution | Artifact provenance now cites `docs/goals/pi-model-configuration/{charter,pmc-p1-fallback-contract…}.md`, `docs/goals/routing-currency-and-merit/host-owner-export/settings-projection.json`, `routing-policy/{routing-policy.yaml,src/pi-openrouter.ts}` — the SCF-1/2/3 refs re-point through `pmc-p1-fallback-contract-2026-09-26.md` § 4's transcription (cited text verified at that record, lines 126–128). Named test `"F9: every provenance source resolves in the worktree…"` passes. The `pmc-p0-capability-baseline.md` landing is honestly listed as a § 9 remaining item | **fixed** |

## D.2 New finding

### DA-1 — self-referential fallback pair is still approved at resolve time (validator's `FALLBACK_SELF_REFERENCE` not mirrored)
**Severity: minor** · Confidence: 0.8 · Status: **unfixed**

**Claim quoted (record § 2 item 5, standing text):** "every approved route carries exactly its one declared typed fallback"; § 2 item 4's correction claims refs "resolve exactly as `validator.ts` `checkLaneRoutes.resolve()` does" and that the fallback is identity-verified.

**Evidence:** `resolveRouteRef` (`pi-resolver.ts:219`) mirrors the validator's ref → binding mapping and its `FALLBACK_DANGLING_REFERENCE`/`FALLBACK_PROVIDER_MISMATCH` outcomes, but `validator.ts:753–755`'s third route-level invariant — `FALLBACK_SELF_REFERENCE` ("the fallback is the primary itself (A5.3)") — has no resolve-time mirror (no self-reference check exists in `pi-resolver.ts`). Repro: a `candidate`-typed fallback ref resolving to the route's own primary (`fallback: {type:'candidate', ref:'qwen3.8-flash'}` on L5/opencode whose primary is `opencode/qwen3.8-flash`) yields `status: approved` with `fallback.binding_id === primary.binding_id === 'opencode/qwen3.8-flash'` — the "fallback" is the primary, so the handoff plan's `route-to-declared-fallback` degrades onto the same binding, and the standing claim "exactly its one declared typed fallback" is falsified for this shape. `validatePolicy` rejects this document statically, so the gap is resolve-time defense-in-depth only — the same rationale under which F3/F4 were fixed.

**Recommendation:** mirror `FALLBACK_SELF_REFERENCE` in `resolveRouteRef`'s route assembly (refuse when the resolved fallback id equals the resolved primary id), with one negative control.

## D.3 Review-B disposition spot-verification (6 of 7)

| Disposition | Delta verification | Result |
|---|---|---|
| RB-1 (A2 fallback denial) | Repro: declared fallback family excluded → `stop ['INDEPENDENCE_VIOLATION']`; `"RB-1: …"` tests pass | verified |
| RB-2 (break-glass vocabulary/scoping) | Issue-time rejection of `'signature'` and `'BREAK_GLASS_DENIED_REFUSED'`; named-bypass scoping per D.1 F6 row | verified |
| RB-4 (declared comparability over unproven δ_L) | Repro: `stop ['FALLBACK_SUITABILITY_UNPROVEN']` | verified |
| RB-5 (`LAUNCH_REFUSALS` completeness) | Constant now 9 names incl. `FRESHNESS_STALE_REFUSED`, `FRESHNESS_FUTURE_REFUSED`, `DIGEST_MISMATCH_REFUSED`, `EVIDENCE_STATE_UNATTESTED`; `"RB-5: LAUNCH_REFUSALS covers every refusal name the boundary can emit"` passes | verified |
| RB-6 (catalogue-GET evidence prose-only) | § 5 item 1 now marked CORRECTED and scoped as an evidence *attempt*, with the capture preserved under `evidence/` named as owed work (§ 9) — no disposition depends on the GET | verified |
| RB-7 (handoff `binding_id` tie) | Repro: `primary-degraded` naming `openrouter/evil` → `TypeError: handoff event 'primary-degraded' names binding …` | verified |

(RB-3's scenario set is co-tested by F1's verification above.)

## D.4 Corrected-claim checks

§ 2 items 2, 4, 5, 8 and § 5 item 1 now carry `CORRECTED` blocks with the falsified text preserved verbatim; each correction's factual assertions match observed behavior (break-glass trust-boundary wording, ref-resolution semantics, the removal-set re-scope, the RB-6 evidence scoping). The § 9 "Remaining issues" list (RB-6 capture, `pmc-p0-capability-baseline.md` landing, break-glass per-use attestation, the four `enabledModels` fates) is accurate and not hidden. Scope proof re-verified: the 11 § 7 MD5 pins are byte-identical after the rework.

## D.5 Delta verdict

**VERDICT: APPROVE WITH NITS** — all 16 findings from both reviews verified **fixed** (F1–F9 and RB-1–RB-7): every named regression test passes (59/59 across the three PMC-P2 test files), every original repro scenario now fails closed, the corrected claims are accurate, and the byte-identity scope proof holds. Outstanding: **DA-1** (minor, new — self-referential fallback pair approved at resolve time) plus the four § 9 named remaining items, none blocking this rework.
