# PMC-P2 Review B — resolver decision logic, SCF-3 disposition, evidence claims (2026-09-26)

**Reviewer:** independent adversarial review B (did **not** read `pmc-p2-review-a-findings.md`).
**Reviewed:** `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md` (record) against
`routing-policy/src/{route-receipt,pi-resolver,launch-boundary,host-settings-proposal}.ts`,
`routing-policy/tests/{pi-fixtures,pi-resolver.test,launch-boundary.test,host-settings-proposal.test}.ts`,
the generated `pmc-p2-pi-host-settings-PROPOSED-2026-09-26.json`, and the charter/rubric clauses
they claim (A1/A2/A3/D3/D4/D8/M2/M3/M4).
**Method:** four adversarial input scenarios built by this review and traced expected-vs-actual
through the code (lines cited); SCF-3 byte-identity re-checked by checksum; evidence citations
re-derived. Findings only — no files of the reviewed work were modified.

**Verdict: REQUEST CHANGES** — 0 blocker, 4 major, 2 minor, 1 nit.

---

## 1. Adversarial scenario traces

### S1 — L6 lane-disabled ordering (PASS)

Input: `resolveRoute(shippedPolicy, makeRequest({ lane: 'L6', routing_class: 'routing/classification' }), …)`
plus a deliberately malformed variant (NaN token counts, unknown data class, missing
`classes['routing/classification'].ceiling_usd`).

Expected (record § 2 item 6: "any L6 request returns `LANE_DISABLED_REFUSED` before any filter,
ranking, or tie-break … the receipt records zero evaluations"): `stops == ['LANE_DISABLED_REFUSED']`,
`evaluations == []`, and the refusal fires before the structural-stop return and the R5 ceiling gate.

Actual (trace): `resolveRoute` computes the structural checks at `pi-resolver.ts:805` but returns
them only at `:865`; the L6 gate at `pi-resolver.ts:836-851` (`laneEntry.status === 'disabled-refused'
|| laneEntry.provider_rule.kind === 'none'`) returns first via `stopReceipt` (`:755-770`, which
defaults `evaluations: []`). The ceiling gate (`:877+`) and the candidate walk (`:893+`) are never
reached. `pi-resolver.test.ts:214-221` pins `stopNames == ['LANE_DISABLED_REFUSED']` and
`evaluations == []` on the shipped policy. **The claim holds** for any policy whose L6 entry is
marked disabled (the validator pins that state). Ordering requirement confirmed.

### S2 — A2 independence must deny the fallback (FAIL → RB-1)

Input: `resolveRoute(makeDeclaredPolicy(), makeRequest({ independence_excluded_families: ['z-ai'] }), …)`
— the declared fallback of the L5 opencode route is `opencode/glm-5.3-flash`, `family: z-ai`
(`routing-policy.yaml:553-559`).

Expected (charter.md:120-127, A2: "The independence requirement applies to **primary and fallback
alike**. A fallback that would collapse reviewer independence is **denied, not downgraded**. If no
independent, eligible fallback remains, the resolver emits a failed/stop receipt naming the
unsatisfied constraint and the parcel stops."): the route stops with `INDEPENDENCE_VIOLATION` named
in `stops`, or at minimum the violating binding is denied as the failover target.

Actual (trace): `evaluateCandidate` records `INDEPENDENCE_VIOLATION` for `opencode/glm-5.3-flash`
(`pi-resolver.ts:362-378`) and marks it unrankable, but the selection pool gates **primaries only**
(`pi-resolver.ts:917-919`); the chosen primary `opencode/qwen3.8-flash` is approved, `chosenRoute`
is the L5 opencode route, and `route.fallback` is attached unconditionally at `pi-resolver.ts:1004-1030`
with no rankability/R3/role gate on `fallbackIndexed`. `stops: []` on the success path
(`pi-resolver.ts:1063`) → `status: 'approved'` (`pi-resolver.ts:724`) with
`fallback_handoff.on_primary_degraded.action: 'route-to-declared-fallback'` (`pi-resolver.ts:1039-1040`).
The A2 violation is buried in `evaluations[]` while the signed receipt authorizes failover to the
excluded family. The negative control (`pi-resolver.test.ts:283-291`) excludes only the **primary**'s
family ('qwen') and asserts only the evaluation record — the record's claim ("A2 independence applies
to primary and fallback alike … denied, never downgraded", record lines 64-69) is unearned at the
route/plan level.

### S3 — fabricated comparability residual (FAIL → RB-4)

Input: `makeDeclaredPolicy()` with `lane_routes[0].comparability = { state: 'unproven', residual: 'FALLBACK_COMPARABLE' }`
(a name outside the contract vocabulary), or with `comparability = { state: 'declared', value: 'comparable or higher', … }`
while the lane's `quality_tolerance.residual` is `DELTA_L_UNSET`.

Expected (record lines 128-134: "at resolve time a declaration slot that is not the exact
typed-unavailable residual, **an envelope residual outside the contract vocabulary**, or an identity
name outside the vocabulary is refused (`RESIDUAL_FABRICATED_REFUSED` …)"; pi-resolver.ts:16-19:
"any other name is itself refused … so a receipt can never carry a fabricated name"; record line 82-83:
"'unproven' is never read as 'comparable'"): `RESIDUAL_FABRICATED_REFUSED` (variant 1) or
`FALLBACK_SUITABILITY_UNPROVEN`/refusal (variant 2).

Actual (trace): the only vocabulary gate is `noteResidual` (`pi-resolver.ts:235-243`), which is called
for the binding envelopes only (`:264`, `:397-398`, `:422`, `:453`, `:475`) — never for
`chosenRoute.comparability`. The envelope is copied verbatim into the signed receipt
(`suitability: chosenRoute.comparability`, `pi-resolver.ts:1029`) and the handoff plan
(`pi-resolver.ts:1038`), and `unprovenClaimsFor` silently drops names missing from
`RESIDUAL_CLAIM_TEXT` (`pi-resolver.ts:609-612`). Variant 1 therefore yields an **approved** receipt
carrying the fabricated name `FALLBACK_COMPARABLE` with no refusal and no unproven-claim entry;
variant 2 yields an approved receipt whose `unproven_claims` list `DELTA_L_UNSET` while the same
receipt asserts `fallback.suitability.state === 'declared'` ("comparable or higher"). The document
layer does catch both (`validator.ts:828-858`), but the record claims the resolver's own fail-closed
property and negative-control coverage ("envelope residuals") that the resolve-time code does not
have — the tested envelope residual (`pi-resolver.test.ts:456-463`) is a binding cost envelope.

### S4 — schema-valid candidate-type fallback ref (FAIL → RB-3)

Input: a policy whose L5 route carries `fallback: { type: candidate, ref: glm-5.3-flash }` —
explicitly schema-valid (`schemas/lane-route.schema.json:52-65`) and validator-resolved to the
candidate's first provider-matching binding (`validator.ts:714-724`).

Expected (record lines 75-76: "the receipt records every candidate, not only the winner"; record
lines 158-161: "chosen binding + its declared typed fallback … a binding absent from the registry
refuses `UNSUPPORTED_MODEL_REFUSED`"): the resolved fallback binding is evaluated and emitted by
identity, or the ref is refused.

Actual (trace): `indexLaneBindings` silently drops every non-`binding` ref
(`if (ref.type !== 'binding') continue`, `pi-resolver.ts:211-212`) — the fallback binding is never
evaluated (no R1–R7 records — "every candidate" claim false) — and `route.fallback` is emitted as
`{ binding_id: fallbackRef, model: fallbackIndexed?.binding.model ?? fallbackRef }`
(`pi-resolver.ts:1027-1028`): the raw **candidate key** becomes the model identity inside a signed
approved receipt, with no `UNSUPPORTED_MODEL_REFUSED` (the registry lookup at `pi-resolver.ts:989`
runs only for the chosen primary). A dangling fallback ref (document-layer-rejected, but the resolver
claims its own fail-closed discipline) takes the same `?? fallbackRef` path. If a lane's routes all
use candidate refs, the pool is empty with zero evaluations and `stops` comes out **empty**
(`pi-resolver.ts:925-963` collects stops only from evaluations), contradicting "Empty pool → stop
receipt naming every per-candidate refusal/hold" (record lines 156-157).

### S5 — break-glass scope (FAIL → RB-2)

Input: `issueBreakGlassException({ requested_by: 'owner', owner_authorization: { per_use_statement: '…' },
requested_lane: 'L2', bypassed_checks: ['signature'], reason: 'resolver broken', issued_at: … })`,
then `verifyLaunch(receipt, { requested_lane: 'L6', at: …, max_age_ms: 60_000 })` with a stale clock.

Expected (record lines 55-63: "emits a distinctly marked `BREAK-GLASS-EXCEPTION` receipt **naming the
bypassed checks**"; `launch-boundary.ts:43`: "The launch checks this exception bypasses; **must name
each one** (A1)"; record § 2 item 2's launch boundary: "lane-mismatched … → fail closed"): refusal
(`RECEIPT_LANE_MISMATCH_REFUSED`/`FRESHNESS_STALE_REFUSED`) since neither check is named in
`bypassed_checks`, or at least a verdict whose `bypassed_checks` reports everything actually skipped.

Actual (trace): `verifyLaunch` routes `kind: 'break-glass-exception'` to `breakGlassVerdict(receipt)`
**without passing `context`** (`launch-boundary.ts:156-158`); `breakGlassVerdict` (`:84-135`) checks
marking, `requested_by === 'owner'`, a non-empty per-use statement, non-empty `bypassed_checks`
strings, and the signature — and never compares `ExceptionReceipt.requested_lane` (`:57`, set at
`:266`) with `LaunchContext.requested_lane`, never applies `at`/`max_age_ms`, and never checks that
the skipped checks are the named ones. Result: `ok: true`, `mode: 'break-glass'`, and
`bypassed_checks: ['signature']` (`:133`) although the lane and freshness checks were also skipped.
The exception authorizes a launch on any lane — including L6 — at any age while under-reporting what
it bypassed. `launch-boundary.test.ts:124-136` uses the same lane in issue and verify contexts
(`requested_lane: 'L5'`, `CONTEXT` L5), so the gap is untested.

---

## 2. SCF-3 disposition verification (record § 2 item 9, § 7)

| Check | Method | Result |
|---|---|---|
| `src/pi-openrouter.ts` byte-identical | `md5sum` vs record § 7 pin `74d62966c1eaf4974198770892cd2a03` | **match** |
| 4 further user-diff pins (schema, 2 tests, `templates/pi-openrouter-routing.json`) | `md5sum` vs § 7 | **all match** (`59ec5c88…`, `6f7da0c1…`, `b97e732d…`, `fcfbca35…`) |
| 6 excluded scaffolder templates | `md5sum` vs § 7 | **all match** (`2e5fd1eb…`, `ed48706c…`, `3663a186…`, `1b4289b2…`, `1d703a20…`, `a85f800d…`) |
| Const boundary test (§ 2 item 9b: "`validatePiOpenRouterRouting` rejects `baseUrl: 'https://openrouter.ai/api'`") | `host-settings-proposal.test.ts:110-116` | **present, exactly as claimed** |
| Endpoint-divergence refusal tested | `pi-resolver.test.ts:392-428` (divergent catalogue + non-const registration → `ENDPOINT_DIVERGENCE_REFUSED`) | **present** |
| SCF-3 disposition in the artifact (§ 2 item 9c) | artifact lines 40, 55-56 (const kept as SCF-3 comparator), 698-718 (2× `scf_finding: "SCF-3"`, "unresolved divergence … `ENDPOINT_DIVERGENCE_REFUSED` until an owner resolves") | **matches the record** |

Caveat (evidence limit, not a finding): all work is uncommitted; `git diff` shows
`src/pi-openrouter.ts` modified against HEAD (the pre-existing user diff the record describes), so
git alone cannot isolate P2's patch. The § 7 pins match the current bytes, which corroborates — but
cannot independently prove — the "before first write" pin. `[INFERENCE]` the diff vs HEAD is the
pre-existing user diff, per the record.

## 3. Evidence-claim verification (record § 5)

| Claim | Result |
|---|---|
| `evidence/pi-0.87.1/probe-output.txt` byte-identical, MD5 `d01b39f643718be92020d78dabfe0cee` | **resolves** — current MD5 `d01b39f643718be92020d78dabfe0cee`; content shows `node v24.7.0`, `installedVersion 0.87.1 (pinned 0.87.1) MATCH` |
| `snapshot.json` MD5 `f061b5e3…` → `da626576…` | **resolves** — current MD5 `da62657688bde8cb491d72df7e8ec996` |
| Recheck probes (`prac-p0-compat/probe/check-api-surface.mjs`, `.negative-test.mjs`, `negative-control.mjs`) | **exist** (`be642513…`, `da642546…`, `ab9090d6…`) |
| Catalogue GET digest (`9aae0055…`, 751,727 bytes, 458 ids, `Date: Sun, 27 Sep 2026 01:19:57 GMT`) | **does not resolve to any artifact** — the digest appears only in the record (lines 202-204); no response bytes, id list, or headers were preserved anywhere in the tree (RB-6). The `Date` header is internally consistent (2026-09-27 is a Sunday; the UTC stamp is consistent with a late-2026-09-26 local session). |
| "no claim upgrades catalogue metadata into an availability oracle" | **verified** — record § 5 ("catalogue metadata is never an availability oracle … catalogue presence is never used as a proxy"); `pi-resolver.ts:460-461` ("catalogue presence is never a proxy"); `host-settings-proposal.ts:139-140` (`ATTEMPTED_EVIDENCE_NOTE`: "catalogue metadata cannot establish A6 live-availability … value stays fail-closed"); R6 verdicts key only on `binding.availability.state`. No oracle upgrade found. |

## 4. Findings

### RB-1 [major] — A2: an independence-violating declared fallback is not denied; the route approves anyway
- **Claim (record:64-69):** "A2 independence applies to primary and fallback alike — the R3 filter denies a binding whose declared family is excluded by the request's independence obligation (`INDEPENDENCE_VIOLATION` — 'denied, never downgraded', negative-controlled)".
- **Evidence:** charter.md:120-127 (A2: denied, not downgraded; "the resolver emits a failed/stop receipt … and the parcel stops"); `pi-resolver.ts:917-919` (pool gates primaries only), `pi-resolver.ts:1004-1030` (fallback attached with no gate), `pi-resolver.ts:1063`/`:724` (approved with `stops: []`); negative control `pi-resolver.test.ts:283-291` covers the primary only. Scenario S2.
- **Impact:** whenever `independence_excluded_families` contains the declared fallback's family (e.g. `['z-ai']` on L5), the signed receipt authorizes `route-to-declared-fallback` to the excluded family — a review can end up continued under collapsed independence, exactly what A2 forbids. The refusal exists only as an evaluation record.
- **Recommendation:** gate `chosenRoute.fallback` through the same evaluation (at least R1/R3 + rankability); on failure emit a stop receipt naming `INDEPENDENCE_VIOLATION` (A2's "failed/stop receipt"). Add a negative control that excludes the **fallback**'s family and asserts `status: 'stop'`.

### RB-2 [major] — break-glass verification ignores `LaunchContext`: lane and freshness are bypassed even when not named
- **Claim (record:61-62):** "emits a distinctly marked `BREAK-GLASS-EXCEPTION` receipt naming the bypassed checks"; `launch-boundary.ts:43`: "The launch checks this exception bypasses; must name each one (A1)".
- **Evidence:** `launch-boundary.ts:156-158` (context dropped at dispatch), `:84-135` (`breakGlassVerdict` never reads `requested_lane`/`at`/`max_age_ms`; `:133` echoes the declared list as the bypassed set), `:57`/`:266` (`requested_lane` recorded, never consumed). Scenario S5.
- **Impact:** an owner-signed exception naming `['signature']` for lane L2 authorizes a launch on any lane — including the M2-disabled L6 — at any age, while the launch verdict reports only `signature` as bypassed. `bypassed_checks` entries are also unchecked against the refusal vocabulary (any non-empty string passes, `:111-114`).
- **Recommendation:** in `breakGlassVerdict`, compare `receipt.requested_lane` with `context.requested_lane` and apply freshness unless the named `bypassed_checks` include the corresponding `LAUNCH_REFUSALS` names; validate the names against the vocabulary and refuse unknown ones.

### RB-3 [major] — candidate-type fallback refs are silently dropped; fallback model identity is fabricated
- **Claim (record:75-76):** "the receipt records every candidate, not only the winner"; (record:158-161): "chosen binding + its declared typed fallback … a binding absent from the registry refuses `UNSUPPORTED_MODEL_REFUSED`"; (record:156-157): "Empty pool → stop receipt naming every per-candidate refusal/hold".
- **Evidence:** `pi-resolver.ts:211-212` (`if (ref.type !== 'binding') continue`), `pi-resolver.ts:1027-1028` (`model: fallbackIndexed?.binding.model ?? fallbackRef`), `pi-resolver.ts:989` (registry lookup for the chosen primary only), `pi-resolver.ts:925-963` (empty pool with zero evaluations yields `stops: []`). Schema and validator accept `type: candidate` refs (`schemas/lane-route.schema.json:52-65`, `validator.ts:714-724`). Scenario S4.
- **Impact:** for a schema-valid, validator-clean policy, the resolved fallback binding is never evaluated (breaking the full-input-recording claim) and a signed approved receipt carries the raw ref string as `fallback.binding_id` **and** `fallback.model`; a dangling ref takes the same path. The fallback is also never registry-checked (`UNSUPPORTED_MODEL_REFUSED` applies to the primary only).
- **Recommendation:** resolve `type: candidate` refs exactly as the validator does (first provider-matching binding) before evaluation/emission, or refuse `REPRESENTATION_INCOMPLETE_REFUSED`; never emit an unresolved ref as a model name; run `piModelContractFor` on the emitted fallback too.

### RB-4 [major] — the route comparability envelope bypasses the resolve-time vocabulary gate and the rubric-§1 honesty rule
- **Claim (record:128-134):** "at resolve time … an envelope residual outside the contract vocabulary … is refused (`RESIDUAL_FABRICATED_REFUSED`; negative-controlled for … envelope residuals …)"; (pi-resolver.ts:16-19): "any other name is itself refused … so a receipt can never carry a fabricated name"; (record:82-83): "'unproven' is never read as 'comparable'".
- **Evidence:** `pi-resolver.ts:235-243` (`noteResidual` never sees `comparability`), `:1029`/`:1038` (verbatim passthrough into receipt + plan), `:609-612` (unknown claim names silently dropped); the only envelope-residual negative control is a binding cost envelope (`pi-resolver.test.ts:456-463`); document-layer-only enforcement at `validator.ts:828-858`. Scenario S3.
- **Impact:** a fabricated residual name reaches the signed receipt unrefused; a declared "comparable or higher" verdict ships while the same receipt enumerates `DELTA_L_UNSET` as unproven — the resolver mandates delta_L be unset (`pi-resolver.ts:513-520`) yet accepts a proven-suitability claim.
- **Recommendation:** run `noteResidual` (or an equivalent vocabulary check) over `chosenRoute.comparability.residual`, and refuse `FALLBACK_SUITABILITY_UNPROVEN` when `comparability.state === 'declared'` while `quality_tolerance.residual === 'DELTA_L_UNSET'`; add both negative controls.

### RB-5 [minor] — `LAUNCH_REFUSALS` omits three names the boundary can emit
- **Claim (`route-receipt.ts:14-15` comment):** "Launch-boundary refusal names (charter A1 failure modes: 'missing, stale, lane-mismatched, unsigned')" — the stale case is named in the comment but absent from the array.
- **Evidence:** `route-receipt.ts:39-45` lists 5 names; `launch-boundary.ts:187-213` emits `FRESHNESS_STALE_REFUSED`/`FRESHNESS_FUTURE_REFUSED`, `:126-130` emits `DIGEST_MISMATCH_REFUSED`.
- **Impact:** the exported "one import" vocabulary (`launch-boundary.ts:275`) is incomplete; a consumer dispatching launch refusals from it silently misses three names the verdicts carry.
- **Recommendation:** add the three names to `LAUNCH_REFUSALS` (they are already in the ratified `RESOLVER_REFUSALS`, so no new vocabulary is created).

### RB-6 [minor] — catalogue-GET evidence is prose-only; the digest is not re-derivable
- **Claim (record:200-204):** "Recorded real evidence (the attempt): Public catalogue metadata GET … body 751,727 bytes, **SHA-256 `9aae0055…`**, 458 model ids."
- **Evidence:** the digest exists only in the record (grep across `plugins/foreman-line` finds no other occurrence); `evidence/pi-0.87.1/` holds only the probe artifacts; charter D8 requires "captured Pi/version/catalogue metadata".
- **Impact:** the catalogue-portion of the evidence attempt cannot be re-verified from the repo, so the "recorded" evidence rests on an assertion (the 0.87.1 half does resolve — see § 3). No fail-closed disposition depends on the catalogue (all values remain typed-unavailable), so this is evidence discipline, not fabrication.
- **Recommendation:** preserve the fetched catalogue body (or its parsed id list + headers + hash) under `evidence/` so the digest is re-derivable.

### RB-7 [nit] — `buildFallbackHandoff` does not tie `event.binding_id` to the receipt's declared pair
- **Claim (record:81-85):** "every approved route carries exactly its one declared typed fallback … `new-recorded-attempt-from-durable-handoff` for cross-provider failover (D3)".
- **Evidence:** `pi-resolver.ts:1112-1153` — the switch keys only on `event.kind`; `event.binding_id` is copied into the durable record without matching `plan.primary`/`plan.fallback` (or a declared route primary for `cross-provider-attempt`).
- **Impact:** a durable record can name a binding that is neither the primary nor the declared fallback while its `action` reads `route-to-declared-fallback`, weakening D8's "routes only to its declared fallback" at the record layer.
- **Recommendation:** validate `event.binding_id` (`primary-degraded` → `plan.primary`, `fallback-failed` → `plan.fallback`, `cross-provider-attempt` → a declared route primary) and throw `TypeError` on mismatch, consistent with the existing fail-closed call contract.

---

## 5. Sample-verified citations (12)

1. § 7 MD5 pins (11 files incl. `src/pi-openrouter.ts`) — `md5sum` — all match (§ 2).
2. `evidence/pi-0.87.1/probe-output.txt` MD5 `d01b39f6…` — `md5sum` + content — matches § 5 item 2.
3. `snapshot.json` MD5 `da626576…` — `md5sum` — matches § 5 item 2.
4. § 2 item 9b const-boundary test — `host-settings-proposal.test.ts:110-116` — exact.
5. § 6 "ENDPOINT_DIVERGENCE_REFUSED (divergent endpoint + SCF-3 non-const registration)" — `pi-resolver.test.ts:392-428` — exact.
6. § 2 item 6 "receipt records zero evaluations" — `pi-resolver.ts:836-851` + `pi-resolver.test.ts:214-221` — holds (S1).
7. § 2 item 4 "R1…R7 recorded per candidate" — `pi-resolver.ts:227-479` + `pi-resolver.test.ts:98-118` — holds for binding-ref candidates (fails for candidate-ref candidates, RB-3).
8. § 2 item 5 "`FALLBACK_SUITABILITY_UNPROVEN` today; 'unproven' is never read as 'comparable'" — `pi-resolver.test.ts:71-75` pins the honest envelope — holds for the shipped policy; resolve-time enforcement absent (RB-4).
9. § 2 item 3 "A2 … primary and fallback alike" — refuted (RB-1, S2).
10. § 2 item 2 "naming the bypassed checks" — refuted as enforced property (RB-2, S5).
11. § 5 "catalogue metadata is never an availability oracle" — `pi-resolver.ts:461`, `host-settings-proposal.ts:139-140` — holds.
12. § 2 item 4 "ties by … (matrix role, provider, model id)" vs code tie-break — `pi-resolver.ts:920-932` sorts cost → role → `binding_id`, and binding ids are the provider-prefixed `provider/model` spelling (`validator.ts:586`), matching `ranking_contract.stable_order: [declared-matrix-role, provider, model-id]` (`routing-policy.yaml:262`) — holds.

## 6. Verdict line

**REQUEST CHANGES** — 0 blocker, 4 major (RB-1 A2 fallback denial, RB-2 break-glass scope,
RB-3 candidate-ref fallback fabrication, RB-4 comparability envelope gate), 2 minor, 1 nit.
The L6 ordering, deterministic R1–R7 recording, SCF-3 byte-identity, endpoint-divergence refusal,
FALLBACK_SUITABILITY_UNPROVEN pass-through on the shipped policy, and the no-oracle discipline all
verified as claimed.

---

# DELTA RE-REVIEW (2026-09-27) — post-rework verification of RB-1…RB-7

**Trigger:** coordinator delta re-review after `PmcP2Rework` dispositioned all 16 findings as
fixed with named regression tests (record § 9). This section re-verifies **every** review-B
finding: the named regression tests were executed and the scenario traces S1–S5 were re-traced
through the fixed code. Fresh verdict at the end.

**Test evidence (2026-09-27):** `npx tsx --test tests/pi-resolver.test.ts
tests/launch-boundary.test.ts tests/host-settings-proposal.test.ts` → **59 pass / 0 fail**
(0 skipped). Scope proof re-checked: `src/pi-openrouter.ts` MD5 still `74d62966c1eaf4974198770892cd2a03`
(§ 7 pin intact after the rework).

## Per-finding verification

| Finding | Named regression test(s) | Result | Code fix verified |
|---|---|---|---|
| RB-1 (A2 fallback denial) | `pi-resolver.test.ts :: "RB-1: an independence-violating declared fallback stops the route (INDEPENDENCE_VIOLATION)…"` + `"RB-1: an unrankable declared fallback stops the route naming its refusals (D4 preflight)"` | **pass** | `pi-resolver.ts:1214-1261`: the declared fallback must resolve (`:1231`), is rankable-gated with its own refusals/holds named as stops (`:1244-1254`), and is registry-backed (`:1262-1273`) before emission |
| RB-2 (break-glass scope) | `launch-boundary.test.ts :: "F6/RB-2: …enforces lane and freshness unless the checks are named"`, `"…a named bypass authorizes exactly its named check — and is reported"`, `"RB-2: break-glass bypass names must come from the LAUNCH_REFUSALS vocabulary"`, `"…the verdict reports every skipped check"` | **pass** | `launch-boundary.ts:180` `breakGlassVerdict(receipt, context)` now receives the context; lane enforced unless `RECEIPT_LANE_MISMATCH_REFUSED` named (`:234-242`), freshness via `freshnessRefusals(issued_at, context, bypassed)` (`:243`, `:150-177`); bypass names validated against `LAUNCH_REFUSALS` minus `BREAK_GLASS_DENIED_REFUSED` on **both** issue and verify sides (`:116-121`, `:217-220`, `:353-356`); verdict reports declared ∪ `BREAK_GLASS_STRUCTURAL_SKIPS` (`:103-109`, `:250-255`) — no unnamed bypass |
| RB-3 (candidate-ref fabrication) | `pi-resolver.test.ts :: "F1/RB-3: a candidate-typed fallback ref resolves exactly as the validator resolves it and is evaluated…"`, `"F1/RB-3: an unresolvable fallback ref stops fail-closed…"`, `"RB-3: the emitted fallback must carry a Pi execution-plane registry entry"` | **pass** | `pi-resolver.ts:219-265` `resolveRouteRef` resolves `type: candidate` to the route provider's first declared binding (validator semantics) and refuses `FALLBACK_DANGLING_REFERENCE`/`FALLBACK_PROVIDER_MISMATCH`; `?? fallbackRef` is gone — `route.fallback.model = fallbackIndexed.binding.model` and `binding_id` is the resolved binding id; the resolved fallback is evaluated (R1–R7 asserted) and registry-checked |
| RB-4 (comparability envelope) | `pi-resolver.test.ts :: "F2/RB-4: a fabricated lane-route comparability residual is refused at resolve time (RESIDUAL_FABRICATED_REFUSED)"`, `"RB-4: a declared comparability verdict is refused while delta_L is unset"` | **pass** | `pi-resolver.ts:726-752` `comparabilityGate` runs the envelope through the vocabulary gate (`RESIDUAL_FABRICATED_REFUSED`) and refuses `FALLBACK_SUITABILITY_UNPROVEN` for a declared verdict while `quality_tolerance.residual === 'DELTA_L_UNSET'`; included in `gateStops` (`:1102-1105`) before selection; the fabricated name is asserted never to appear as a name-valued field |
| RB-5 (`LAUNCH_REFUSALS` incomplete) | `launch-boundary.test.ts :: "RB-5: LAUNCH_REFUSALS covers every refusal name the boundary can emit"` (12 verdict paths, ≥12 refusals) | **pass** | `route-receipt.ts:41-50`: `FRESHNESS_STALE_REFUSED`, `FRESHNESS_FUTURE_REFUSED`, `DIGEST_MISMATCH_REFUSED`, `EVIDENCE_STATE_UNATTESTED` added (all pre-existing vocabulary names) |
| RB-6 (catalogue evidence prose-only) | n/a (documentation claim) | **fixed as record correction; capture deferred** | record § 5 item 1 is now marked CORRECTED: the GET is an evidence *attempt*, explicitly "not re-derivable from the repository", with no disposition depending on it; byte-level capture preservation is an openly listed remaining item (record § 9/§ 10) |
| RB-7 (handoff `binding_id`) | `pi-resolver.test.ts :: "RB-7: handoff records refuse a binding_id outside the declared primary/fallback pair"` (3 event kinds) | **pass** | `pi-resolver.ts:1407-1434`: `primary-degraded` → `plan.primary`, `fallback-failed` → `plan.fallback`, `cross-provider-attempt` → a declared route primary; mismatch throws `TypeError` |

The regression tests were audited for assertion strength before acceptance: each pins the exact
scenario semantics of the original finding (e.g. RB-1 asserts `status: 'stop'`, `route: null`,
`stops == ['INDEPENDENCE_VIOLATION']` on the very S2 input; RB-2 asserts per-check refusals on the
very S5 cross-lane/stale inputs and an exact `bypassed_checks` set) — none are weakened tautologies.

## Scenario re-traces S1–S5 (fixed code)

- **S1 (L6 ordering) — PASS preserved.** The gate (`pi-resolver.ts:1015-1026`) still fires before
  the structural-stop return (`:1028`), the R5 ceiling gate (`:1032+`), ref resolution (`:1078+`)
  and the candidate walk (`:1092+`); `stopReceipt` still yields `evaluations: []`
  (asserted unchanged in "the shipped policy fails closed on every lane", passing).
- **S2 (A2 fallback independence) — FIXED.** `independence_excluded_families: ['z-ai']` now stops
  at the fallback gate (`pi-resolver.ts:1244-1254`) with `stops == ['INDEPENDENCE_VIOLATION']`,
  `route: null` — denied, never downgraded (charter A2 satisfied at the route level).
- **S3 (comparability fabrication + declared-over-unproven) — FIXED.** Both variants refuse at
  `comparabilityGate` before selection: `RESIDUAL_FABRICATED_REFUSED` (fabricated residual, name
  never emitted as a value) and `FALLBACK_SUITABILITY_UNPROVEN` (declared verdict over unset
  delta_L).
- **S4 (candidate/dangling fallback ref) — FIXED.** The ref resolves exactly as the validator
  resolves it and the resolved binding is evaluated (`binding_id: 'opencode/glm-5.3-flash'`,
  R1–R7 recorded); unresolvable refs stop with `FALLBACK_DANGLING_REFERENCE`/`FALLBACK_PROVIDER_MISMATCH`;
  the raw ref is never emitted as a `model`; the fallback is registry-checked. The former
  empty-stops edge is gone with it (refs either resolve or produce named ref stops).
- **S5 (break-glass cross-lane/stale) — FIXED.** The S5 exception (`['signature']`) is refused at
  issue and at verify (`BREAK_GLASS_DENIED_REFUSED`); a correctly named exception refuses cross-lane
  (`RECEIPT_LANE_MISMATCH_REFUSED`) and stale/future (`FRESHNESS_STALE_REFUSED`/`FRESHNESS_FUTURE_REFUSED`)
  launches unless those checks are named; the verdict reports every skipped check.

## Fresh verdict (2026-09-27)

**APPROVE WITH NITS** — 0 blocker, 0 major, 0 minor open. All 7 review-B findings are verified
fixed (6 code/doc fixes each pinned by an executed named regression test; RB-6 fixed as a record
correction). One nit residue, accepted as a declared remaining item: RB-6's catalogue-GET bytes are
still not preserved under `evidence/` (the record now states this honestly and no disposition
depends on it). No unfixed finding.
