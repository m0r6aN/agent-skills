# OPMEM-P0 rework 1 — builder kickstarter

You are the **builder** for rework 1 of parcel OPMEM-P0 (operator-developer Cortex memory: authority and contract baseline). Coordinator: Pi `01a131a9`. You are a documents-only builder. You never commit, push, or touch git state.

## Workspace (use ABSOLUTE paths; your shell cwd is NOT this directory)

`W = D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`

## Allowed Files — the ONLY files you may modify (all already exist)

1. `W/source-baseline.md`
2. `W/canon-authority-map.md`
3. `W/memory-boundary-contract.md`
4. `W/event-and-fixture-contract.md`
5. `W/pilot-and-validation-contract.md`
6. `W/follow-on-parcel-manifests.md`
7. `W/open-decisions.md`

Any other path is read-only. If a fix appears to need another file, do not touch it: list it under `NEEDS-AMENDMENT` in your report.

## Inputs (read-only)

- Findings to fix: `W/p0-review-R0-seat2-2026-10-12.md` (F-1…F-9, MISSING PIECE, OPEN-DECISION QUALITY).
- Rulings you must reflect: `W/owner-delegated-decisions-2026-10-12-01a131a9.md` (OD dispositions, new decisions, merge/deployment boundary).
- Parcel spec (acceptance criteria AC1–AC10): `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md`
- Requirement source D1–D18: `D:/Repos/keon-cortex-mcp-bridge/docs/plans/operator-developer-cortex-memory.md`
- Pinned sources for verification (read-only; do NOT execute):
  - Cortex: `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-cortex-50c5f42d297848148123519cb1607c079782ba43/`
  - Gateway: `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-mcp-gateway-c92e42afeb84a5f425c282cfc9c7637f3e058fd4/`
  - Bridge: `D:/Repos/keon-cortex-mcp-bridge/src`

Read sources with targeted greps/line ranges, never whole trees.

## Required changes (each must be traceable to an R0 finding or a ruling)

- **F-1** Correct the false "Gateway-asserted, never agent-supplied" claim: describe the real header-precedence + API-key actor-copy behaviour with locators; make verified actor/role binding part of the §4.1 contract; add negative fixtures for header-priority spoofing and machine-credential actor spoofing; add `src/Keon.McpGateway/Auth/ApiKeyValidator.cs` and `src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs` (UPDATE) to P1a Allowed Files plus matching test file(s).
- **F-2** Add the `/mcp/admin/ingress/{correlationId}` cross-tenant read to the seam inventory, add a negative fixture, name P1a as owner (it already holds `Program.cs`).
- **F-3** Freeze delivery identity: window anchored at first delivery (not wall clock), explicit session/resume/fork/reload/compaction semantics; align F-8 wording so one delivery ⇒ one recall event.
- **F-4** Freeze event→association-edge classification: co-delivery and co-recall never create association pull; add a co-delivery-no-association fixture; state that the pinned `decayed_pull` co-recall default is overridden only by the classification table (no math change).
- **F-5** State per-layer enforcement (adapter vs Gateway vs Cortex) for content size and URI schemes; add N-fixtures for oversized content and non-allowlisted `source_uri`/`artifact_uri` at the Gateway boundary; assign enforcement owners in manifests (P5a Gateway handlers / P1b or P2 Cortex models — if a needed file is not in any manifest, add it to the most appropriate manifest and say so).
- **F-6** Correct the ingest wire text: idempotency header optional with `shard_id` fallback; `X-Decision-Receipt-Id` mandatory (403); `/health` shape is `{"ok","storage"}` not the envelope.
- **F-7** Add `src/keon/cortex/gravity/contracts.py` (UPDATE, versioned extension) to P3 Allowed Files OR elect the mapping table as sole authority — choose the contracts.py extension (single authority) and say why.
- **F-8** Add fixtures: consideration/non_applicability/correction leave scores unchanged; missing feedback stability; status surface never shows queued/indeterminate as saved; future cache-served recall accounted durably (D17); local config cannot widen grants.
- **F-9** Enumerate `outcome.status` (include `unknown`, `not_executed`) and forbid fabricating `failure` for unobserved results.
- **MISSING PIECE** Assign the readiness/schema-version signal to **P2** (Cortex `/health` + protocol version field; add the file(s) to P2 manifest), keep S-10 downgrade refusal testable.
- **Rulings** Rewrite `open-decisions.md` §E/approval ledger and each OD row to show its 2026-10-12 owner-delegated disposition (by coordinator `01a131a9`), keep still-open items open, add the new decision rows from R0 OPEN-DECISION QUALITY. Update manifest targets: P1a–P5a land via Gate 3 into branch `opmem/integration` (non-deploying) in their repo; promotion to `main` (auto-deploys to Azure) is a separate owner stop item. Update P5b/P6 target per OD-1 ruling. Replace stale coordinator id `01a12f95` with `01a131a9` where it names the current coordinator.

Do not restate documents, do not rewrite unaffected sections, keep every existing locator that is still true. Do not alter D1–D18, the four-force taxonomy, or any frozen contract — if a fix would require that, stop and report under `NEEDS-AMENDMENT`.

## Step 0 — RESTATE AND STOP (this message)

In THIS turn do NOT edit anything. Reply with:
1. One-paragraph restatement of the job.
2. A table: finding/ruling → target file(s)/section(s) → planned change (one line each).
3. Any file outside the Allowed Files you believe you need (or "none").
4. Any finding you believe is wrong after checking the source (with locator), or "none".

Then stop and wait. The coordinator will reply GO or with corrections.

## Completion report (after GO, at the end of the execution turn)

```
## REWORK-1 REPORT
### Changes (finding → file:section → what changed)
### Source re-verification performed (locators)
### NEEDS-AMENDMENT (or none)
### Files modified (must be a subset of the 7 Allowed Files)
```
