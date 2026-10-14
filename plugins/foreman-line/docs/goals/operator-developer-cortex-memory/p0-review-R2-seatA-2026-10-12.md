# OPMEM-P0 review R2 — Seat A (architecture/boundary/plan-level)

**Reviewed commit:** `dc010d7e` (deliverables = `ad7ba1ee`, post rework 2). **Route:** `anthropic/claude-fable-5`, read-only tool set (`read,grep,find,ls`), `--thinking high`. **Cost:** USD 3.5282. Verbatim output follows.

---

## VERDICT: APPROVE-WITH-FIXES

## TRIAGE VERIFICATION
- T-1: ENCODED — boundary §2.3 "Trusted scope carriage" + §4.3 legacy-row rule; P1a gains `Backends/CortexClient.cs`, P1b gains `api.py`/`schema.py`/`tests/test_scope_http.py`.
- T-2: ENCODED — base rule + sequential handoff in manifests header, every target line, reconciliation notes, and the P1a∥P1b correction.
- T-3: ENCODED — N-13 re-scoped to Ed25519 signing-key, S-5 updated, OD-19 records deferral explicitly.
- T-4: ENCODED — `X-Idempotency-Key` everywhere (verified real at `api.py` ingest route header alias).
- T-5: ENCODED — P5b = UPDATE `tests/test_service.py`; file verified present in the bridge tree.
- T-6: ENCODED — informational; no change required.
- T-7: ENCODED — P1a gains `Spine/IngressSpine.cs`; N-16 carries the three cases; tenant-less query and both fallback reads verified real at `Program.cs:256,278,311`.
- T-8: ENCODED — boundary §2.3 Response; caller-tenant synthesis verified real at `CortexMemorySearchHandler.cs:85`; N-10 end-to-end.
- T-9: PARTIAL — `gravity/1.1.0` files/version dispatch encoded (`gravity/function.py` `GRAVITY_VERSION="gravity/1.0.0"` verified), and all kinds are classified; but the chosen classification "**`access`** is the content occurrence" (event §1) collides with event §2 rule 1 ("access counts … toward **recall** force") — see F-1.
- T-10: ENCODED — boundary §3 receipt typing by verified semantics; F-11 updated; anchor = `decision.ReceiptId`.
- T-11: ENCODED — `operation_id`/`X-Keon-Operation-Id`; P5a `Spine/OperationLedger.cs`, P2 recall binding, P6 minting; retry tests named in verification lines.
- T-12: ENCODED — `shards/1.1` in boundary §2.3/OD-4; pin enum `{claim,belief,lesson,fact,story}` verified at `ingress/models.py:158`.
- T-13: PARTIAL — `keon.cortex.capabilities.v1` encoded on the Gateway side (P5a) and named for consumption, but the adapter code that owns readiness (`server.py:172-175` 503-until-ready, and tool registration `server.py:68-147`) is in neither P5b's nor P6's Allowed Files — see F-3.
- T-14: ENCODED — full inventory N-1…N-19/G-1…G-12/O-1…O-9/F-1…F-12 in pilot §1/§4, per-parcel verification lines, O-9 test-double note.
- T-15: ENCODED — §2.2 mapping rows with ack shapes; P3 event routes, P4a disposition routes, P5a handlers; order P3→P4a→P5a is coherent for handler-against-route building.

## FINDINGS
### F-1 [major] `access` classified as content occurrence contradicts the same document's reinforcement rule
- Claim at issue: `event-and-fixture-contract.md` §1 (T-9 election: "**`access`** is the content occurrence") vs §2 rule 1 ("Access counts once per delivery identity toward **`recall`** force").
- Reality/evidence: at pin, `gravity/contracts.py:29-45` feeds `Recall` kind to recall force and every other kind to occurrence force. If the delivery mints both a Recall spine event (§3, one per delivery) and an `access` event classified `is_content_occurrence=True`, each delivery increments **both** occurrence and recall forces — delivery-driven double reinforcement, the exact D11 rich-get-richer hazard. No fixture pins occurrence force under delivery: G-7 checks recall only; G-6/G-11/G-12 check feedback-class kinds only.
- Why it matters: a P3 builder can satisfy every listed fixture while shipping compounding delivery reinforcement; alternatively a builder reading §2 rule 1 will classify `access` as non-occurrence and fail the §1 table — two conflicting authorities inside one frozen document.
- Required disposition: fix — pick one classification (recommended: `access` is NOT a content occurrence; occurrence remains the original write/action kinds) and add a fixture pinning occurrence force invariant under N deliveries.

### F-2 [major] Rollback lines in P1a/P1b are stale after rework-2 schema additions
- Claim at issue: `follow-on-parcel-manifests.md` P1a ("Rollback: revert commit; **no schema change in this parcel**") and P1b ("Rollback: revert; **pure addition to enforcement**").
- Reality/evidence: the same manifests now grant P1a `Spine/IngressSpine.cs` with a **tenant column** on the SQLite spine (T-7) and P1b `providers/postgres/schema.py` with persisted `role_id`/`profile_id`/`scope_class` columns plus legacy-row fail-closed semantics (T-1). Both are schema changes; reverting P1b after rows carry scope data is not a pure revert (legacy-scope semantics change which rows are visible).
- Why it matters: brief item (f) — rollback is claimed closed but the closure statements describe the pre-rework-2 parcels; a verifier or rollback executor acting on these lines acts on a false premise.
- Required disposition: fix — restate both rollback lines as additive-migration rollback (previous schema readable; scope columns nullable; legacy-visibility rule documented), mirroring P2's wording.

### F-3 [major] Adapter readiness and tool surface (T-13/T-15) have no mutable home in P5b/P6 Allowed Files
- Claim at issue: `follow-on-parcel-manifests.md` P5b/P6 seam lines ("consumes `keon.cortex.capabilities.v1` readiness validation … fail closed on protocol/schema mismatch"; "consumes … event/curation ingress").
- Reality/evidence: bridge readiness 503 logic and all tool registration live in `src/keon_cortex_bridge/server.py` (cited by the baseline itself: `server.py:68-147` tools, `:172-175` readiness) — `server.py` appears in neither P5b's (`service.py`, `models.py`, `http_port.py`, `tests/test_service.py`) nor P6's Allowed Files.
- Why it matters: the T-13 fail-closed readiness change and any adapter-exposed event/curation surface predictably trigger stop condition 3 (file outside Allowed Files) mid-parcel; "exact mutation authority" (brief item g) is not actually sufficient at the pin.
- Required disposition: fix — add UPDATE `server.py` to P5b (or explicitly record that readiness/tool-surface changes are deferred to a named shaping amendment, with the T-13 fail-closed test's home stated).

### F-4 [major] Single static shared secret is the entire trust root for T-1 scope carriage — unexamined
- Claim at issue: `memory-boundary-contract.md` §2.3 Auth ("Cortex trusts them **only** on requests authenticated by the existing Gateway secret").
- Reality/evidence: `_authorize_gateway` is a constant-time compare of one `X-Keon-Cortex-Secret` (`api.py:164-175`, verified); `CortexOptions.BaseUrl` defaults `http://localhost:9000` (`CortexClient.cs:10`, verified). After T-1, that one secret vouches for tenant, actor, role, generation, profile, grant scopes, and session — i.e., any holder forges arbitrary identity/scope directly against Cortex. No OD covers secret rotation, per-environment provisioning, compromise response, or the network-reachability requirement that makes "only the Gateway holds it" true (P8 deferred).
- Why it matters: this is the unexamined load-bearing decision (brief item c); P1b will build fail-closed enforcement whose entire strength rests on an unexamined static-secret custody story.
- Required disposition: fix — add an OD (rotation/custody/network-isolation requirement for `X-Keon-Cortex-Secret`, owner P8 with a frozen requirement line in boundary §2.3) ; the T-1 ruling itself is implementable and is not challenged.

### F-5 [minor] Whole-suite verification gates assume an unrecorded pin-suite baseline
- Claim at issue: `follow-on-parcel-manifests.md` P1b/P2/P3/P4a/P4b verification commands (`pytest tests/ -q` variants); P2 "I1–I7 proof regeneration … at pin".
- Reality/evidence: no deliverable records whether the full cortex `tests/` suite is green at `50c5f42d` (P0 executed nothing — correctly); OD-14 defers proof regeneration to P2 but the P2 command says "at pin" while T-2 bases the worktree on `opmem/integration` head — two different trees named as the evidence base in one line.
- Why it matters: a pre-existing red/skipping test at pin makes every downstream "suite green, no new skips" gate ambiguous (stop-ledger item 4 fires on the wrong party); "at pin" vs integration-head ambiguity invites evidence generated against the wrong base.
- Required disposition: fix — record the pin suite status at first dispatch (or scope gates to named suites + "no regressions vs recorded base"), and restate P2's proof line as "at the P2 verification base (integration head)".

### F-6 [info] Spot-checked source citations hold; two trivial line drifts
- Claim at issue: `memory-boundary-contract.md` §2.3 Auth (`ApiKeyValidator.cs:102-105`), §2.1/N-16, §2.3 Response, §2.4; `canon-authority-map.md` §4.2.
- Reality/evidence: all verified real — actor-claim copy is at `ApiKeyValidator.cs:107-108` (drift ≤6 lines); header-precedence verified at `McpCallerContextResolver.cs:50-60`; tenant-less admin query at `Program.cs:256` with fallbacks `:278,:311`; caller-tenant synthesis at `CortexMemorySearchHandler.cs:85`; term-overlap search at `api.py:515-543`; `RecallService` imported by no API route (only `spine`/`gravity` packages and tests); `gravity/contracts.py` is self-declared "Stub contracts"; deploy workflows (`deploy-production.yml` on `main`) verified; all P1–P6 Allowed-File targets (`tenancy/enforcement.py`, `inheritance/validator.py`, `gravity/function.py`/`params.py`, `tests/test_two_plane_storage.py`, gateway `tests/Keon.McpGateway.Tests/`, bridge files) exist at the pins. No stub/README promoted to implementation evidence; the model/impl split in canon §4 is honest.
- Why it matters: establishes the baseline's citations are load-bearing-real; drifts are cosmetic.
- Required disposition: informational.

## MISSING PIECE / SILENT COLLISION
**keon-runtime has no pin, no parcel, and no deployment owner, yet every governed write path dies without it.** Every memory write requires a live Runtime decide (`CortexMemoryWriteHandler.cs:76-104`, `RuntimeClient` = HTTP client to an external service at default `http://localhost:8080`, `Runtime/RuntimeClient.cs:12` — verified) and a `PolicyHash` (fail-closed), and Cortex ingest refuses without the resulting `X-Decision-Receipt-Id` (`api.py:425-433`, verified); T-11's operation ledger and "revocation ⇒ fail" also depend on Runtime behavior. But: the Runtime canon is declared unverified (canon §1.3), `DECISION_GATEWAY` is location-`unresolved` in the registry, no source pin exists for keon-runtime, no parcel P1a–P10 names it, and P8's scope is "Azure/**Gateway**/**Neon** deployment" — Runtime absent. As written, P5a's T-11 tests ("fresh Runtime receipt on retry"), every S-gate write scenario, P9, and the pilot are unexecutable or will be quietly satisfied with an unowned Runtime stub — model-promoted-to-evidence by omission. Required: an OD naming the Runtime dependency (pin/contract/test-double policy for P5a, deployment ownership at P8) before P5a dispatch.
