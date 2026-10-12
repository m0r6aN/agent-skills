# OPMEM-P0 — Follow-on parcel manifests (AC9)

**Parcel:** OPMEM-P0 · **Evidence base:** `source-baseline.md` (pins), `memory-boundary-contract.md` (seams), `event-and-fixture-contract.md` (fixtures), `pilot-and-validation-contract.md` (gates)
**Rule:** every parcel below has a **sole target repository at a pinned base** and an **exact file list** (no globs, no directory-wide grants). Cross-repository parcels from the narrative plan are **split** here (P1→P1a/P1b, P5→P5a/P5b) so each manifest has one mutation root. A file not listed requires a coordinator-ratified amendment before use. File lists marked *(NEW)* name files to be created at exactly that path.

Review rule (uniform): architecture/risk parcels require **two independent reviews** under approved, family-independent routes; standard parcels require one. Reviewers never fix or commit. Step 0 restatement-and-stop applies to every builder.

Merge / deployment boundary (owner-delegated ruling 2026-10-12, coordinator `01a131a9`): code parcels **P1a–P5a land via Gate 3 into branch `opmem/integration`** — a non-deploying integration branch created from the pinned base in each repo. (`keon-cortex` `main` push triggers `keon-cortex-AutoDeployTrigger-*.yml`; `keon-mcp-gateway` `main` triggers `deploy-production.yml`, `develop` triggers `deploy-staging.yml` — verified in pinned workflows.) **Promotion of `opmem/integration` to `main` (= production deploy) is outside the blanket grant and is a separate stop-for-owner item**, together with P8 cloud work.

Base rule (T-2, 2026-10-12 ruling): each code parcel's builder worktree starts at the **head of `opmem/integration` at dispatch time**; that SHA is recorded in the parcel's dispatch record and is the verification base. The repo pins remain the **contract-evidence revision** (the revision this baseline's source claims are verified against). **Sequential handoff rule:** a file may appear in more than one manifest only when the later parcel strictly depends on the earlier one; the later parcel bases on the integration head containing the earlier merge. Parallel pairs (`∥`) must stay disjoint.

---

## P1a — Gateway role binding, enrollment, session identity

- **Target:** `keon-mcp-gateway` @ `c92e42afeb84a5f425c282cfc9c7637f3e058fd4` (sole mutation root; worktree created at shaping; **merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - *(NEW)* `src/Keon.McpGateway/Auth/RoleBinding.cs`
  - *(NEW)* `src/Keon.McpGateway/Auth/EnrollmentService.cs`
  - UPDATE `src/Keon.McpGateway/Auth/JwtValidator.cs`
  - UPDATE `src/Keon.McpGateway/Auth/ApiKeyValidator.cs` *(R0 F-1: verified, enrollment-bound actor) — added by rework 1*
  - UPDATE `src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs` *(R0 F-1: client headers may never override authenticated claims) — added by rework 1*
  - UPDATE `src/Keon.McpGateway/Program.cs`
  - UPDATE `src/Keon.McpGateway/Backends/CortexClient.cs` *(T-1: emits the trusted scope-carriage headers) — added by rework 2*
  - UPDATE `src/Keon.McpGateway/Spine/IngressSpine.cs` *(T-7: tenant column, tenant on intent/outcome payloads, tenant-filtered fallback read) — added by rework 2*
  - *(NEW)* `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs`
  - *(NEW)* `tests/Keon.McpGateway.Tests/Auth/ApiKeyValidatorActorBindingTests.cs` *(R0 F-1) — added by rework 1*
  - *(NEW)* `tests/Keon.McpGateway.Tests/Mcp/McpCallerContextResolverTests.cs` *(R0 F-1) — added by rework 1*
- **Seam owner:** `memory-boundary-contract.md` §4.1 (role = trusted dispatch/enrollment context; fail-closed; role ≠ generation ≠ instance ≠ session ≠ model; verified actor/role binding — rule 6) and §2.1 admin ingress-read surface (tenant-predicated `/mcp/admin/ingress/{correlationId}`, R0 F-2)
- **Depends on:** OD-5 approval (disposed 2026-10-12, as amended by R0 F-1) · **Verification:** `dotnet build && dotnet test tests/Keon.McpGateway.Tests` (incl. N-1/N-2/N-6, N-14/N-15 identity spoofing, N-16 cross-tenant ingress read with its T-7 cases — empty-SQL fallback, SQLite unavailable, mixed-tenant correlation-id collision; T-1 header-emission tests) · **Evidence:** test output + role-binding sequence doc · **Rollback:** revert commit; no schema change in this parcel
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 independent · **Approvals:** OD-5, W1 registration, Gate 2

## P1b — Cortex server-side scope enforcement

- **Target:** `keon-cortex` @ `50c5f42d297848148123519cb1607c079782ba43` (sole root; **merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - UPDATE `src/keon/cortex/tenancy/enforcement.py`
  - *(NEW)* `src/keon/cortex/tenancy/scope.py`
  - *(NEW)* `tests/tenancy/test_scope_enforcement.py`
  - UPDATE `src/keon/cortex/api.py` *(T-1: accepts the trusted carriage headers; fails closed when role/profile absent on memory routes) — added by rework 2; sequential handoff target (T-2)*
  - UPDATE `src/keon/cortex/providers/postgres/schema.py` *(T-1: persisted record-scope fields `role_id`/`profile_id`/`scope_class`) — added by rework 2; sequential handoff target (T-2)*
  - *(NEW)* `tests/test_scope_http.py` *(T-1: same-tenant cross-role and operator→live HTTP tests) — added by rework 2*
- **Seam:** scope applies **before** candidate generation/ranking and again at response boundaries; exact-ID, lineage, feedback, curation all covered (boundary §4.3); served-path enforcement consumes the trusted carriage headers (T-1, boundary §2.3 Auth); legacy rows without scope fields are operator-profile legacy-scope only, never visible to live profiles (fail closed)
- **Depends on:** P1a contract (may be built in parallel against the frozen contract) · **Verification:** `pytest tests/tenancy tests/ -q` (tenant suite green; no new skips) · **Rollback:** revert; pure addition to enforcement
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** Gate 2

## P2 — Recall path: recall events, two-plane join, durable history, migrations

- **Target:** `keon-cortex` @ `50c5f42d…` (sole root; **merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - UPDATE `src/keon/cortex/api.py`
  - UPDATE `src/keon/cortex/ingress/models.py` *(added by rework 1, R0 F-5: bounded `content`/query sizes as Cortex-layer defense-in-depth — boundary §6 input-size/URI row; declared here per the rework-1 approval)*
  - UPDATE `src/keon/cortex/providers/postgres/schema.py`
  - UPDATE `src/keon/cortex/spine/recall_service.py`
  - *(NEW)* `src/keon/cortex/spine/recall_events.py`
  - *(NEW)* `tests/test_recall_http.py`
  - UPDATE `tests/test_two_plane_storage.py`
- **Seam:** boundary §2.4 recall-event-before-results; content-hash fail-closed (INV-1/2); gravity orders, never gates (INV-2); delivery identity (event §3); **owns the readiness/schema-version signal** (R0 MISSING PIECE, OD-17): `/health` gains a `schema_version`/protocol field and the adapter fails closed on mismatch (boundary §2.3 Readiness/Version); recall retry identity (T-11): binds `operation_id` → original selection + `recall_event_id`, same selection returned on retry; **shards/1.1 semantic extension** (T-12): `memory_type` gains `observation`/`decision`/`artifact_link`, candidate gains optional structured `provenance`/`decision_status`/`lineage_refs` — round-trip fixtures prove fields survive authoritative storage
- **Depends on:** P1b · **Verification:** `pytest tests/ -q` + I1–I7 proof regeneration (`cortex proof` family) at pin; incl. T-11 recall-retry tests (changed candidates between retries, concurrent retries, restart recovery), T-12 round-trip fixtures, F-8/G-7/N-11 (T-14) · **Evidence:** proof artifacts + recall transcript with `recall_event_id` · **Rollback:** additive migration; previous schema remains readable (boundary §6)
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** OD-2 (base), OD-6 (duplicate bytes), Gate 2

## P3 — Accounting + pinned gravity projection

- **Target:** `keon-cortex` @ `50c5f42d…` (**merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - *(NEW)* `src/keon/cortex/services/recall_accounting.py`
  - UPDATE `src/keon/cortex/gravity/contracts.py` *(added by rework 1, R0 F-7: versioned `is_content_occurrence` extension — the sole occurrence-classification authority, event §1 election)*
  - UPDATE `src/keon/cortex/gravity/params.py`
  - *(NEW)* `src/keon/cortex/gravity/projection.py`
  - *(NEW)* `tests/gravity/test_projection_fixtures.py`
  - *(NEW)* `tests/gravity/test_feedback_non_occurrence.py`
  - *(NEW)* `src/keon/cortex/gravity/function_v1_1.py` *(T-9: served scorer `gravity/1.1.0`; `gravity/1.0.0` preserved byte-for-byte for replay) — added by rework 2*
  - UPDATE `src/keon/cortex/gravity/function.py` *(T-9: version dispatch only) — added by rework 2*
  - UPDATE `src/keon/cortex/api.py` *(T-15: event-ingest routes) — added by rework 2; sequential handoff target (T-2)*
  - UPDATE `src/keon/cortex/providers/postgres/schema.py` *(T-15: event storage) — added by rework 2; sequential handoff target (T-2)*
  - *(NEW)* `src/keon/cortex/services/memory_events.py` *(T-15: consideration/application/outcome/non_applicability/correction/feedback ingestion) — added by rework 2*
  - *(NEW)* `tests/test_memory_events_http.py` *(T-15) — added by rework 2*
- **Seam:** event §1–§2 (feedback ≠ occurrence), §7 fixtures G-1…G-12 (T-14); four forces unchanged; version/hash recorded (INV-3); served scorer `gravity/1.1.0` (T-9 — G-6/G-10/G-11 run against the served path; classification-only under OD-10 report-only); event-ingest routes for `consideration`/`application`/`outcome`/`non_applicability`/`correction`/`feedback` (T-15 — authenticated, scoped per T-1, idempotent by `operation_id` per T-11)
- **Depends on:** P2 · **Verification:** `pytest tests/gravity tests/ -q` (incl. `tests/test_memory_events_http.py`); fixture suite byte-stable across two runs · **Rollback:** scoring version pin preserved; replay reproduces old outputs (G-9)
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** OD-10 (any numeric rule; prefer report-only first release), Gate 2

## P4a — Role ancestry, curation, inheritance governance

- **Target:** `keon-cortex` @ `50c5f42d…` (**merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - *(NEW)* `src/keon/cortex/inheritance/ancestry_scope.py`
  - UPDATE `src/keon/cortex/inheritance/validator.py` *(if a rule gap is proven at shaping; else unused)*
  - *(NEW)* `tests/inheritance/test_ancestry_scope.py`
  - UPDATE `src/keon/cortex/api.py` *(T-15: proposal/promotion/supersession disposition routes) — added by rework 2; sequential handoff target (T-2)*
  - *(NEW)* `tests/inheritance/test_curation_http.py` *(T-15) — added by rework 2*
- **Seam:** boundary §4.3 private ancestry + approved shared artifacts; inheritance anti-laundering rules 3/5/6 (F-12); owns proposal/promotion/supersession disposition routes (T-15 — authenticated, scoped per T-1, idempotent by `operation_id` per T-11)
- **Depends on:** P1b, P3 feedback contract · **Verification:** `pytest tests/inheritance tests/ -q` · **Rollback:** revert; contracts unchanged
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** Gate 2

## P4b — Governance/branch evidence records

- **Target:** `keon-cortex` @ `50c5f42d…` (**merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - *(NEW)* `src/keon/cortex/collective/evidence_links.py`
  - *(NEW)* `tests/collective/test_governance_branch_evidence.py`
- **Seam:** event §5 four dimensions; F-1…F-7; `delib_`/`inherit_` never receipts (INV-5); consumes existing `BranchRecord`/`ReviewerVerdict`/`DissentEntry` models — **no new Collective engine**
- **Depends on:** P3 · **Verification:** `pytest tests/collective tests/ -q` · **Rollback:** revert
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** Gate 2

## P5a — Canonical memory protocol on the Gateway surface

- **Target:** `keon-mcp-gateway` @ `c92e42af…` (**merge target:** branch `opmem/integration`, non-deploying — promotion to `main` is a separate owner stop item; **worktree base (T-2):** head of `opmem/integration` at dispatch, SHA recorded in the dispatch record)
- **Allowed files:**
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexMemoryWriteHandler.cs`
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexMemorySearchHandler.cs`
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexLineageGetHandler.cs`
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexEvidenceGetHandler.cs`
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexReceiptGetHandler.cs`
  - UPDATE `src/Keon.McpGateway/Tools/Cortex/CortexReplayQueryHandler.cs`
  - UPDATE `src/Keon.McpGateway/Backends/CortexClient.cs`
  - *(NEW)* `src/Keon.McpGateway/Tools/Cortex/CortexCapabilitiesHandler.cs` *(T-13: `keon.cortex.capabilities.v1`) — added by rework 2*
  - *(NEW)* `src/Keon.McpGateway/Spine/OperationLedger.cs` *(T-11: durable `operation_id` → original decision receipt + Cortex ack binding) — added by rework 2*
  - *(NEW)* `src/Keon.McpGateway/Tools/Cortex/CortexMemoryEventHandler.cs` *(T-15: `keon.cortex.memory.event.v1`) — added by rework 2*
  - *(NEW)* `src/Keon.McpGateway/Tools/Cortex/CortexCurationHandler.cs` *(T-15: `keon.cortex.curation.disposition.v1`) — added by rework 2*
  - *(NEW)* `tests/Keon.McpGateway.Tests/Cortex/ProtocolContractTests.cs`
- **Seam:** boundary §2.2 mapping table; protocol `shards/1` + additive `shards/1.1` (T-12 — Gateway input schema owner) + downgrade refusal; response envelopes; Gateway-boundary input enforcement (R0 F-5: content-size bound + `source_uri`/`artifact_uri` scheme allowlist — boundary §6 input-size/URI row, N-17/N-18; the write/search handlers are already listed above); backend-ownership preservation (T-8 — `CortexShardSummary` carries backend `tenant_id`/scope; missing/foreign ownership ⇒ fail-closed error, never silent drop, never caller-synthesized); write retry identity (T-11 — operation ledger reuses the original receipt/ack, no fresh Runtime decide for known operations, revocation ⇒ fail not reuse); capabilities/event/curation tools (T-13/T-15)
- **Depends on:** P2 (recall semantics) · **Verification:** `dotnet test tests/Keon.McpGateway.Tests` (incl. N-10 through client→handler→adapter, N-17/N-18; T-11 write-path tests: fresh Runtime receipt on retry, concurrent retries, restart recovery; T-12 round-trip fixtures) · **Rollback:** revert; wire remains `shards/1`
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** OD-4, Gate 2

## P5b — Adapter tool-surface conformance

- **Target:** new **private** repository `Keon-Systems/keon-cortex-mcp-bridge` (OD-1 disposed 2026-10-12): initial commit = byte-for-byte import of `D:/Repos/keon-cortex-mcp-bridge` (excluding `dist/` build artifacts only if `.gitignore` already excludes them); the import commit SHA is this parcel's pinned base and remains the contract-evidence revision. The original directory is never initialised in place. Repo created when this parcel is shaped, not before; until then no mutation. **Worktree base (T-2):** head of `opmem/integration` at dispatch (branch created from the import commit SHA), recorded in the dispatch record
- **Allowed files:**
  - UPDATE `src/keon_cortex_bridge/service.py`
  - UPDATE `src/keon_cortex_bridge/models.py`
  - UPDATE `src/keon_cortex_bridge/http_port.py`
  - UPDATE `tests/test_service.py` *(corrected by rework 2, T-5 — the previously named `test_service_contract.py` never existed; confirmed in the bridge tree)*
- **Seam:** boundary §2.2/§2.3; scope echo; indeterminate errors; consumes `keon.cortex.capabilities.v1` readiness validation (T-13 — fail closed on protocol/schema mismatch) and the event/curation ingress tools (T-15)
- **Depends on:** P5a, OD-1 · **Verification:** `ruff check . && pytest -q` · **Rollback:** revert
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** OD-1, Gate 2

## P6 — Local adapter container + durable delivery outbox

- **Target:** `Keon-Systems/keon-cortex-mcp-bridge` (the private import repo created per OD-1, disposed 2026-10-12; pinned base = import commit SHA; **worktree base (T-2):** head of `opmem/integration` at dispatch — contains the P5b merge, sequential handoff on `service.py`)
- **Allowed files:**
  - *(NEW)* `src/keon_cortex_bridge/outbox.py`
  - UPDATE `src/keon_cortex_bridge/config.py`
  - UPDATE `src/keon_cortex_bridge/service.py`
  - UPDATE `Dockerfile`, `compose.yaml`
  - *(NEW)* `tests/test_outbox_recovery.py`
- **Seam:** boundary §6 + event §8 O-1…O-9 crash/recovery fixtures (T-14); bounded capacity; no re-scoping; mints the durable `operation_id` per logical operation carried as `X-Keon-Operation-Id` (T-11 — lives in the outbox identity, no new files); consumes `keon.cortex.capabilities.v1` readiness (T-13) and event/curation ingress (T-15)
- **Depends on:** P5b · **Verification:** `pytest -q` incl. induced-crash fixtures; container gates S-10 · **Rollback:** volume format versioned; previous adapter image remains valid
- **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** OD-1, OD-7 (limits), Gate 2

## P7 — Thin Pi extension (bounded recall/capture + controls)

- **Target:** **new package repo**, created and named at its shaping session (no existing repo owns this surface; agent-skills is Foreman process, not the Pi extension host). Manifest is issued at shaping with exact files; contract inputs are boundary §4.1/§4.2 and event §3/§6, plus the event/curation ingress tools (T-15) and the `keon.cortex.capabilities.v1` readiness gate (T-13).
- **Expected file shape (provisional, not a grant):** one extension package with lifecycle hooks, briefing renderer, control commands; tests for S-9 fixtures.
- **Depends on:** P6; current Pi extension API verification against the installed Pi docs · **Risk/routing:** standard / implementation/standard · **Reviews:** 1 · **Approvals:** OD-8 (tokenizer), Gate 2

## P8 — Azure/Gateway/Neon deployment + portable install

- **Target:** deployment/infra repo to be named at shaping (none inspected; cloud authority separate) · **Allowed files:** issued at shaping (IaC, runbook, SBOM pipeline)
- **Depends on:** P1–P7 · **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 · **Approvals:** **separate cloud/secret/deployment authority (G11 scope is planning only)**, OD-11 thresholds · **Verification:** S-10 + deployment readiness runbook

## P9 — Independent end-to-end validation of the real deployment

- **Target:** `agent-skills` OPMEM goal records (validation evidence) + read-only use of deployed systems · **Allowed files:** `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/validation-report-*.md` (exact names at dispatch)
- **Depends on:** P8 · **Risk/routing:** elevated / architecture/risk · **Reviews:** 2 (one may be the validation conductor) · **Approvals:** separately authorized test access · **Verification:** `pilot-and-validation-contract.md` §1 gates S-1…S-10 with the §4 full fixture inventory (N-1…N-19, G-1…G-12, O-1…O-9, F-1…F-12 — T-14), no skips

## P10 — Fourteen-day real-work pilot + closure report

- **Target:** `agent-skills` OPMEM goal records · **Allowed files:** `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/pilot-report-14d.md`, `…/closure-report.md`
- **Depends on:** P9 · **Risk/routing:** standard / implementation/standard · **Reviews:** 1 · **Approvals:** owner acceptance per pilot contract §5 · **Note:** runs on real primary projects (AgentTask etc.); no unrelated feature work inside the pilot parcel

---

## Dependency order (strict default)

```text
P0 (this baseline) → P1a ∥ P1b → P2 → P3 → P4a ∥ P4b → P5a → P5b → P6 → P7 → P8 → P9 → P10
```

Parallel only where marked `∥` and only after P0 baselines are accepted; each parallel pair has disjoint files.

## Reconciliation notes (AC9)

- **Bridge upstream (OD-1)** disposed 2026-10-12: new private repo `Keon-Systems/keon-cortex-mcp-bridge`; import commit SHA = P5b/P6 base; executed when P5b is shaped (ruling in `owner-delegated-decisions-2026-10-12-01a131a9.md`).
- **Base revisions (OD-2)** disposed 2026-10-12: the pins are ratified as the P1–P5 bases — re-verified as current remote `main` for both repos. If newer bases are ever required, manifests are re-pinned at shaping (amendment, recorded).
- **Merge boundary (2026-10-12 ruling):** P1a–P5a merge into non-deploying `opmem/integration`; promotion to `main` auto-deploys to Azure and is a separate stop-for-owner item (see boundary section at top).
- No parcel may touch another's files **except under the T-2 sequential handoff rule** (later parcel strictly depends on the earlier and bases on the integration head containing the earlier merge; current overlaps: `api.py`/`providers/postgres/schema.py` across P1b→P2→P3→P4a, `Backends/CortexClient.cs` across P1a→P5a, bridge `service.py` across P5b→P6); no parcel may amend frozen contracts/canon (stop condition). **P1a ∥ P1b correction (T-2 queue note):** they remain parallel-safe (different repos), but P1b now owns Cortex acceptance of the headers P1a emits — P1b's HTTP tests must use the frozen header contract (boundary §2.3), not P1a's code.
- Verification commands above are the deterministic minimum; coordinator lint additionally verifies every claim against disk before Gate 3.
- Primary-project protection: if any parcel expands into open-ended research or threatens AgentTask delivery, stop and report (charter stop conditions).
