# OPMEM-P0 — Source baseline and pinned revision evidence (AC1)

**Parcel:** OPMEM-P0 · **Author:** coordinator Pi `01a12f95-7c4b-74e5-b9a2-941efcfca605` acting under owner blanket authority (2026-10-12)
**Evidence date:** 2026-10-12 (all reads local, read-only)
**Rule applied:** logical repository roots are resolved through the coordinator-supplied root map below. Machine-specific absolute paths appear only as provenance hints inside this record; downstream specs reference the logical names.

## 1. Root map

| Logical root | Local root (provenance hint) | Provenance / revision | Status |
|---|---|---|---|
| `agent-skills` | `D:/Repos/agent-skills` | GitHub `m0r6aN/agent-skills`, base `1b2fe2cf` (2026-10-12) | Versioned; sole mutation root for this parcel |
| `keon-cortex-mcp-bridge` | `D:/Repos/keon-cortex-mcp-bridge` | **No `.git` directory.** Not a checkout. | **BLOCKING — see §3.1** |
| `keon-cortex` | snapshot `D:/Repos/opmem-source-snapshots-20261011/cortex/50c5f42d297848148123519cb1607c079782ba43/` | Pinned source archive at commit label `50c5f42d297848148123519cb1607c079782ba43` | Versioned snapshot; pin ancestry **unproven** (§3.2) |
| `keon-mcp-gateway` | snapshot `D:/Repos/opmem-source-snapshots-20261011/gateway/c92e42afeb84a5f425c282cfc9c7637f3e058fd4/` | Pinned source archive at commit label `c92e42afeb84a5f425c282cfc9c7637f3e058fd4` | Versioned snapshot; same ancestry caveat |
| `keon-docs` | snapshot `D:/Repos/opmem-source-snapshots-20261011/docs/b6211f8a202e9f21b6356d79028fb1f58b26ae69/sparse/` | Pinned **five-file sparse input** at commit label `b6211f8a202e9f21b6356d79028fb1f58b26ae69` | Partial by design; no complete docs checkout claimed |
| `pi` (harness docs) | installed Pi package `docs/` under the running Pi installation | Pi 1.1.0 observed | Reference-only for OPMEM-P7 |

Snapshot archives were created 2026-10-11 under the G5 immutable-input ruling; see `source-publication-2026-10-11.md` for creation evidence and `D:/Repos/opmem-source-snapshots-20261011/OWNERSHIP.md` for their custody note.

## 2. Immutable input digests (computed 2026-10-12, local sha256)

| Input | sha256 |
|---|---|
| `cortex/50c5f42d…/source.tar.gz` | `32617ab976f1ffa53e59e7ca657030ff0a170ca40328fe7f7005d1ef8c541e7b` |
| `gateway/c92e42af…/source.tar.gz` | `54f2d3d64f6132bec83245b017d66353b580af280ed1efab12a52567e794ee26` |
| `docs/b6211f8a…/sparse/canon/keon_cortex_canon_v1_locked.json` | `adf806f8c1abbcd3b45a3acc1bbc87ed5332b70405c4aea93f1f16fbef060a84` |
| `docs/b6211f8a…/sparse/canon/keon_runtime_canon_v1_locked.json` | `e34a1f2407e71f80bd6ad13d3922f9215b862c7d4c30cee7bc640fa9413d3dba` |
| `docs/b6211f8a…/sparse/canon/claims/CAPABILITY_REGISTRY.yaml` | `9e5e0714160783faf00d507e8fa958def12d632ef3e775416740edb718d6db12` |

Sparse input contents (exactly five files): `AGENTS.md`, `README.md`, `canon/keon_cortex_canon_v1_locked.json`, `canon/keon_runtime_canon_v1_locked.json`, `canon/claims/CAPABILITY_REGISTRY.yaml`. No other keon-docs content was supplied or inspected; every keon-docs claim below is bounded to these five files.

Archive extraction was performed into a scratch directory for read-only inspection. One archive contains a dangling `.pytest_tmp` symlink that cannot materialise on this host; the failure is confined to that test-temporary path and no source path failed to extract.

## 3. Source-ownership findings and blocking dispositions

### 3.1 `keon-cortex-mcp-bridge` has no upstream (BLOCKING for mutation; not for read-only analysis)

- The directory is not a Git checkout: no `.git`, therefore no remote, base revision, commit identity, or dirty-state record exists.
- A sibling archive `keon-cortex-mcp-bridge-v0.1.0.zip` exists at the parent level. Its provenance is unestablished and it is **not** treated as release truth or as the directory's upstream.
- Its own `README.md` calls the code a "contract-first internal dogfood scaffold", and `VERIFICATION.md` (dated 2026-09-03) records 39 passing bridge-shell tests with explicitly unvalidated live-Cortex/Gateway integration.
- **Disposition (required before OPMEM-P6 mutates this tree):** owner names the intended upstream repository (new or existing), the supported base revision, and how this directory maps to it. Until then: no initialise, no implicit commit, no import of this tree into another repository. Read-only inspection for OPMEM-P0 is within scope and is what this baseline records.
- Ownership note: the plan (§9 blocker 1) already flagged this. It remains open; see `open-decisions.md` OD-1.

### 3.2 Snapshot pins vs live checkouts (evidence gap, recorded not resolved)

Live checkouts observed the same day:

| Repo | Live root | Live HEAD | Remote | Dirty state |
|---|---|---|---|---|
| keon-cortex | `D:/Repos/keon-omega/keon-cortex` | `ba33bb9f7ebb1ff39a1420377feeca2c6ccccfd5` (2026-08-11) | `github.com/Keon-Systems/keon-cortex.git` | Deleted untracked `.claude/worktrees/*` entries recorded as deletions; nothing else material |
| keon-mcp-gateway | `D:/Repos/keon-omega/keon-mcp-gateway` | `d6376fd024d43be7ff458af675c646ae93c52492` (2026-08-11) | `github.com/Keon-Systems/keon-mcp-gateway.git` | `.serena/project.yml`, `docs/INITIATIVES/keon-monetizable-ga/*` modified |

- The cortex pin `50c5f42d…` is **not an object in the live keon-cortex object store** (`git cat-file -t` fails), so pin↔live-HEAD ancestry cannot be established locally. The snapshot is accepted as the coordinator-supplied immutable reconnaissance input (G5); it is **not** asserted to be the live branch tip, a release, or an ancestor of one.
- **Look-alike warning:** `D:/Repos/mcp-gateway` is the *docker/mcp-gateway* project (remote `github.com/docker/mcp-gateway`, HEAD `e007143a`). It is **not** `keon-mcp-gateway` and must never be substituted into OPMEM work.
- Disposition needed: owner confirms whether the pins are the supported bases for OPMEM-P1/P2/P5 (and if not, supplies the ones that are). See `open-decisions.md` OD-2.

### 3.3 Dirty-state preservation

No repo was moved, reset, fetched, initialised, checked out, or edited during this reconnaissance. The scratch extraction directory contains only copies of the supplied archives. The agent-skills worktree used for P0 authoring is `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95` on branch `feat/opmem-p0-baseline-20261012-01a12f95` created from `origin/main` at `1b2fe2cf`; the original `D:/Repos/agent-skills` checkout (main `0df276e6` + untracked goal records) is untouched.

## 4. Inspected evidence paths (the exact reads behind P0's claims)

### 4.1 `keon-cortex-mcp-bridge` (read directly)

- `README.md` — topology, seven-tool surface, security model, integration-work-still-required list.
- `VERIFICATION.md` — 2026-09-03 verification record: 39 tests pass (bridge shell); live Cortex/Gateway behaviour explicitly not validated.
- `docs/CORTEX_PORT_CONTRACT.md` — **proposed** port contract v0.1 ("integration proposal, not locked Cortex canon"), `POST /v1/memory/*` shapes, mandatory recall response.
- `docs/ADVERSARIAL_GATE.md` — P0 bridge-shell gates + P0 Cortex integration gates.
- `src/keon_cortex_bridge/server.py` — seven registered MCP tools (names in §4.1.1).
- `src/keon_cortex_bridge/service.py` — per-tool delegation to a `CortexPort`; `_identity()` injects startup-fixed identity; `_validated_response()` scope echo.
- `src/keon_cortex_bridge/models.py` — `WriteScope`, `RecallScope`, `SourceRef`, request/response models, `GravityScore`, `VerificationMeta`, `RecalledMemory`, `ExcludedMemory`.
- `src/keon_cortex_bridge/config.py` — startup identity (`KEON_TENANT_ID/ACTOR_ID/AGENT_INSTANCE_ID/PLATFORM`), `KEON_ALLOWED_PROJECTS`, `KEON_CAPABILITIES`, `KEON_PROMOTION_ENABLED` (default false), `KEON_MAX_CONTENT_BYTES` (default 32768), `KEON_MAX_QUERY_BYTES` (4096), `KEON_REQUEST_TIMEOUT_SECONDS` (15), `KEON_TRANSPORT`, `KEON_BIND_HOST` (127.0.0.1), `KEON_ALLOW_INSECURE_HTTP`, `KEON_REMOTE_AUTH_TERMINATED` / `KEON_CONTAINER_LOOPBACK_PUBLISHED` publication guards.
- `src/keon_cortex_bridge/http_port.py`, `port.py`, `security.py` — HTTP port adapter, port interface, input hardening.

#### 4.1.1 Bridge tool names (exact, from `server.py`)

`keon.cortex.append_observation.v1` · `keon.cortex.record_decision.v1` · `keon.cortex.link_artifact.v1` · `keon.cortex.recall.v1` · `keon.cortex.get_memory.v1` · `keon.cortex.verify_memory.v1` · `keon.cortex.promote_memory.v1` (disabled by default).

### 4.2 `keon-cortex` @ `50c5f42d…`

- `src/keon/cortex/api.py` (673 lines) — the entire HTTP surface (7 routes), gateway shared-secret auth, tenant/actor headers, idempotency reservation, Ed25519 evidence packs, shard ingest/search/get/lineage/evidence/replay.
- `src/keon/cortex/providers/postgres/schema.py` — `keon_cortex.shards`, `keon_cortex.api_idempotency` DDL.
- `src/keon/cortex/gravity/contracts.py`, `gravity/forces.py` — read-only history view, `GravityScore`, fixed four-force taxonomy, pure force functions.
- `src/keon/cortex/spine/recall_service.py` — two-plane recall facade with content-hash fail-closed exclusion.
- `src/keon/cortex/collective/models.py` — `BranchRecord`, `ReviewerVerdict`, `HeatScore`, `DissentEntry`, `NarrativeClaim`, `WitnessNarrative`.
- `src/keon/cortex/temporal/models.py` — `Episode`, `Claim`, `Fact`, `FactTransition`, `Relationship`, `MemoryField`, `TrustComponents`.
- `src/keon/cortex/promotion/models.py` — `MemoryPromotionRequest` (sanitization/lineage/approval/tenant checks; `approval_receipt_ref`).
- Package inventory: `core, ingress, providers, spine, gravity, decay, outbox, promotion, proof, collective, temporal, inheritance, envelope, tenancy, services, runtime, sidecar, benchmark, cli`.
- `docs/CORTEX_INVARIANTS.md` — proof invariants I1–I7 and implementation invariants D1–D7 (last verified 2026-06-11).
- `docs/epoch-roots/LANE-00-shared-contracts.md` — doctrine invariants INV-1…INV-6, `ISpineEvent`/`IMemory`/`GravityScore`/`EpochRef`, canonical-JSON rule.
- `docs/inheritance/cross-generation-inheritance.md` — `InheritanceEvent` contract and validator rules (anti-laundering, approval-receipt requirement).

### 4.3 `keon-mcp-gateway` @ `c92e42af…`

- `src/Keon.McpGateway/Backends/CortexClient.cs` — `CortexOptions` (BaseUrl default `http://localhost:9000`, TimeoutSeconds 5, ServiceSecret), request/response records, `v1/shards*` + `v1/replay` calls, `CortexClientException(message, statusCode, retryable)`.
- `src/Keon.McpGateway/Tools/Cortex/` — six handlers: `CortexMemoryWriteHandler`, `CortexMemorySearchHandler`, `CortexLineageGetHandler`, `CortexEvidenceGetHandler`, `CortexReceiptGetHandler`, `CortexReplayQueryHandler`.
- `src/Keon.McpGateway/Program.cs` — JWT validation with scopes (`keon:mcp:list` observed on the list endpoint), `AuthOptions`, `IEntitlementEvaluator`, `RuntimeClient`, ingress-spine receipt binding, SQLite ingress spine, fixed-window rate limiters, `DirectiveFactory`/`IntentFactory`. Also hosts `GET /mcp/admin/ingress/{correlationId}` (`:201`): JWT-authenticated (scope `keon:mcp:list`), but the ingress-spine query `WHERE correlation_id = $correlation_id` (`:256`) carries **no tenant predicate** at pin — a cross-tenant receipt-read seam (R0 F-2; fix owned by P1a, fixture N-16, contract at `memory-boundary-contract.md` §2.1).
- `src/Keon.McpGateway/Auth/` — `JwtValidator.cs`, `ApiKeyValidator.cs` only. **No role/role-binding module exists in this tree** (see `memory-boundary-contract.md` §4).

### 4.4 `keon-docs` @ `b6211f8a…` (sparse, five files)

- `canon/keon_cortex_canon_v1_locked.json` — content is the **v2 repository-verification canon** (see `canon-authority-map.md` §1).
- `canon/keon_runtime_canon_v1_locked.json` — runtime canon (not analysed in depth by P0; named here as an input).
- `canon/claims/CAPABILITY_REGISTRY.yaml` — capability/claim registry v4 (2026-07-26) with audited `location_status` fields.
- `AGENTS.md`, `README.md` — repository guidance context only.

## 5. Source ownership summary

| Surface | Current owner (evidence) | OPMEM mutation rights |
|---|---|---|
| Bridge (`keon-cortex-mcp-bridge`) | Unestablished upstream; directory custody on the operator workstation | **None** until OD-1 is disposed |
| Cortex (`keon-cortex`) | `Keon-Systems/keon-cortex` (remote observed); local dirty work belongs to its own lanes | P0 read-only; P2/P3/P4 mutation only under their own exact Allowed Files |
| Gateway (`keon-mcp-gateway`) | `Keon-Systems/keon-mcp-gateway` (remote observed); local dirty docs/initiatives belong to their authors | P0 read-only; P1/P5 mutation only under their own exact Allowed Files |
| Docs canon (`keon-docs`) | `Keon-Systems` canon process; `keon_cortex_canon_v1_locked.json` filename/content edition mismatch is an open authority item | P0 read-only; canon amendments are owner-gated |
| agent-skills (Foreman/OPMEM records) | This goal's coordinator | OPMEM goal records + this parcel's seven files only |

## 6. What this file does not claim

- No claim that any pinned snapshot is a release, a branch tip, an ancestor of a live HEAD, or deployment truth.
- No claim that README/plan statements were verified as running code; `canon-authority-map.md` separates implemented / model-only / unverified / missing.
- No cloud, Neon, credential, or live-service inspection occurred. No source file outside the agent-skills worktree was modified.
