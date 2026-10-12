# OPMEM-P0 review R1 — Seat A (architecture/boundary/plan-level)

**Reviewed commit:** `d8d3a8fc` (deliverables identical to `de7ec59a`). **Route:** `anthropic/claude-fable-5`, `pi -p --mode json --no-session --tools read,grep,find,ls --thinking high` (read-only tool set). **Cost (per-message usage.cost.total):** USD 2.6855. **Dispatched by:** coordinator `01a131a9`. **Family independence:** author Xiaomi mimo, rework-1 builder Moonshot kimi-k3, Seat A Anthropic, Seat B OpenAI — all distinct. Verbatim output follows.

---

## VERDICT: REQUEST-CHANGES

## R0 FIX VERIFICATION
- F-1: FIXED — header precedence verified real at `McpCallerContextResolver.cs:50-60`, unverified actor claim at `ApiKeyValidator.cs:~105` (`new Claim("actor_id", actorId)`); OD-5 amended; both files + tests now in P1a; N-14/N-15 exist.
- F-2: FIXED — endpoint verified at `Program.cs:201` with tenant-less query `:253-259` (tenant_id/actor_id are JWT-validated but unused in the WHERE); documented in boundary §2.1; N-16 added; owner P1a named.
- F-3: FIXED — OD-18 ruled; §3 anchors `event_time_window` at first delivery with logical-session semantics for resume/fork/reload/compaction; F-8 reworded consistently.
- F-4: FIXED — event→association-edge classification table frozen (co-application only); G-10 added; `decayed_pull` co-recall default (`forces.py:66-83`) explicitly overridden.
- F-5: FIXED — per-layer enforcement stated (adapter/Gateway/Cortex); N-17/N-18 added; P2 gained `ingress/models.py`; P5a seam names the bounds; exact numbers deferred explicitly, not silently.
- F-6: PARTIAL — optionality, `X-Decision-Receipt-Id` 403 gate, and `/health` non-envelope all corrected, but the frozen text still names the header `Idempotency-Key` while the wire is `X-Idempotency-Key` (`api.py` `Header(alias="X-Idempotency-Key")`; `CortexClient.cs:103`) — see F-4 below.
- F-7: FIXED — `gravity/contracts.py` added to P3 Allowed Files; `is_content_occurrence` elected sole classification authority; mapping-table alternative explicitly rejected.
- F-8: FIXED — G-11/G-12, O-8/O-9, N-19 all present and correctly scoped.
- F-9: FIXED — `outcome.status` vocabulary frozen (`success|failure|unknown|not_executed`); fabricated failure forbidden.
- MISSING PIECE (schema_version): FIXED — OD-17 assigns the `/health` `schema_version` signal to P2 (which holds `api.py`); boundary §2.3 Readiness/Version updated; S-10 downgrade test now implementable.

## FINDINGS

### F-1 [blocker] Role/generation/session propagation across the Gateway→Cortex seam is undefined; P1b/P2/P3 build on fields no wire carries
- Claim at issue: `memory-boundary-contract.md` §4.1 (role bound at Gateway), §4.3 (scope check "before candidate generation"); `follow-on-parcel-manifests.md` P1b seam; `event-and-fixture-contract.md` §1/§3 (`role_id`, `generation_id`, `session_id` minimum fields on access/recall events and the delivery tuple).
- Reality/evidence: the Cortex wire carries only `X-Tenant-Id`/`X-Actor-Id` (`api.py:~410-415`; `CortexClient.cs` AddTenantHeaders sends tenant/actor/correlation only); `MemoryShardCandidate` canonical fields (boundary §2.3 Schema) contain no role/generation/session; candidate generation happens inside Cortex (`list_by_tenant`, `api.py:515-543`). No deliverable defines the field names, carriage (header vs body), or owning parcel for role context crossing Gateway→Cortex. P1b must enforce role-private ancestry scope in `tenancy/scope.py` with no defined role input; P2 must append recall events carrying `role_id`/`generation_id`/`session_id` it never receives; P5a's `CortexClient.cs` update is seamed to protocol conformance, not identity carriage.
- Why it matters: P1b dispatched as-is forces the builder to invent the role representation (e.g., overloading `actor_id`) — a wrong build at the exact D9 seam P0 exists to freeze, and a silent collision between P1a's Gateway-side binding and P1b/P2's Cortex-side consumption.
- Required disposition: fix (freeze the identity-carriage contract — exact fields on the shards wire, Cortex-side acceptance owner P2, Gateway-side emission owner P1a or P5a — before P1b dispatch).

### F-2 [major] Per-parcel "pinned base = 50c5f42d" contradicts stacked dependencies merging to `opmem/integration`
- Claim at issue: `follow-on-parcel-manifests.md` — every keon-cortex parcel declares target "@ `50c5f42d…` (sole root)" while P2 "Depends on: P1b", P3 on P2, P4a on P1b+P3, and all merge to `opmem/integration`.
- Reality/evidence: no document states whether a builder's worktree starts at the pin or at `opmem/integration` head. At the pin, P2's recall path cannot call P1b's `tenancy/scope.py` (scope-before-candidate-generation, boundary §4.3) and `pytest tests/ -q` verifies a tree that never ships; at integration head, the "pinned base", independent verification, and Allowed-Files diff checks all reference a base the manifests do not name.
- Why it matters: this is the unexamined load-bearing decision of the decomposition — verification evidence for P2/P3/P4a is ambiguous as specified, and a reviewer cannot re-run the stated commands deterministically.
- Required disposition: fix (one ruling: builders base on `opmem/integration` head at dispatch time, recorded SHA per parcel; the repo pin remains the contract-evidence revision).

### F-3 [major] N-13 / S-5 epoch-proof requirements have no implementing owner at any pin
- Claim at issue: `event-and-fixture-contract.md` §9 N-13 ("expired epoch proof or unknown signing key makes verify fail"); `pilot-and-validation-contract.md` S-5 ("epoch/proof requirements… against the real exposed contract"); boundary §6 ("epoch roots are Cortex-owned").
- Reality/evidence: `api.py` serves Ed25519 evidence signing only (`_evidence_signing_key`, `api.py:197-226`, `sign_receipt` import `:31`); no epoch proof, `EpochRef`, or epoch closure appears on any HTTP route; `EpochRef` is LANE-00 model/doctrine only. No parcel P1a–P10 lists epoch machinery in its Allowed Files or seam.
- Why it matters: identical failure shape to R0's schema_version MISSING PIECE — a frozen fixture (N-13) and a mandatory no-skip gate (S-5) that either fail permanently or get silently waived at P9.
- Required disposition: fix (either assign epoch-proof serving to P2's seam explicitly, or re-scope N-13/S-5 to signing-key verification only with epoch proofs named an explicit deferred item in open-decisions).

### F-4 [minor] Frozen wire text names the wrong idempotency header
- Claim at issue: `memory-boundary-contract.md` §2.3 Idempotency row — "The `Idempotency-Key` header is optional".
- Reality/evidence: the wire header is `X-Idempotency-Key` (`api.py` `Header(alias="X-Idempotency-Key")`; `CortexClient.cs:102-103`).
- Why it matters: P2's OD-6 duplicate-byte-pinning tests written from the contract text would send an ignored header and silently exercise the `shard_id`-fallback path, pinning the wrong semantics.
- Required disposition: fix (one-word correction in §2.3 and anywhere else `Idempotency-Key` appears).

### F-5 [minor] Bridge manifest file-list reality: P5b/P6 overlap and a nonexistent UPDATE target
- Claim at issue: `follow-on-parcel-manifests.md` P5b/P6 Allowed Files; reconciliation rule "No parcel may touch another's files".
- Reality/evidence: `src/keon_cortex_bridge/service.py` appears in both P5b and P6 — sequential, but the stated rule has no sequential-handoff exception, so P6 hits stop-condition 3 as written. P5b lists UPDATE `tests/test_service_contract.py`, which does not exist in `D:/Repos/keon-cortex-mcp-bridge/tests` (actual: `test_service.py`, `test_server.py`, `test_http_port.py`, `test_container_contract.py`, `test_config.py`); the "(path confirmed at shaping)" hedge contradicts the "exact file list, no globs" rule.
- Why it matters: the exact-mutation-authority guarantee (brief item g) is formally broken for the two bridge parcels; the import-commit re-pin at P5b shaping is the right moment to fix both.
- Required disposition: fix (state the sequential-handoff rule explicitly; correct the P5b test path at import-pin time).

### F-6 [info] Evidence discipline held under spot checks — no stub promoted to implementation
- Claim at issue: `canon-authority-map.md` §4 classification; boundary §2.4 recall-seam closure.
- Reality/evidence: verified — search is term-overlap over `list_by_tenant(limit=1000)` labeled `relevance_score` (`api.py:515-543`); `RecallService`/`GravityIndex` have no importer outside spine/gravity/collective+tests (model-only claim accurate); `SpineEvent` occurrence docstring (`gravity/contracts.py:~28-32`), admin tenant-less query (`Program.cs:253-259`), and deploy workflows (`keon-cortex-AutoDeployTrigger-*.yml`, `deploy-production.yml`/`deploy-staging.yml`) all match the documents. `gravity/function.py` and `gravity/params.py` exist at pin; P1a/P1b/P2/P3/P4 Allowed Files all resolve to real paths.
- Why it matters: the implemented/model-only/unverified/missing discipline and the honest closure of the recall seam are the baseline's strongest properties; downstream builders can trust the classifications verified here.
- Required disposition: informational.

## MISSING PIECE / SILENT COLLISION
The feedback-event ingestion surface is the missing parcel. `event-and-fixture-contract.md` §1 freezes six event types (`access`, `consideration`, `application`, `outcome`, `non_applicability`, `correction` + orthogonal `feedback`) as "schema-level contract for P2/P3" — but P2's seam and files cover recall events only, P3's Allowed Files contain no `api.py`/`schema.py`/Gateway handler, boundary §2.2's canonical tool-mapping table has no feedback/outcome tool, and no parcel owns the adapter→Gateway→Cortex route or durable table for these events. Consequently S-6 ("F-1…F-12 executed"), S-7, N-12 (feedback replay), F-9/G-11 at the real deployment, D15 correct/supersede, and the P10 pilot metrics (application rate, non-applicability rate — `pilot-and-validation-contract.md` §3) are all unimplementable by any dispatched parcel: the no-skip gates would fail or be waived exactly as the R0 schema_version piece would have. Required: a named owner (a P3b parcel, or explicit extension of P2+P5a seams and Allowed Files) before P3 is dispatched.
