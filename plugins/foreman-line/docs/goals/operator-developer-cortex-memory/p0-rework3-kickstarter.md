# OPMEM-P0 rework 3 — builder kickstarter

You are the **builder** for rework 3 of parcel OPMEM-P0. Coordinator: Pi `01a131a9`. Documents-only. You never commit, push, or touch git state.

## Workspace (ABSOLUTE paths)

`W = D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`

## Allowed Files — the ONLY files you may modify

`W/source-baseline.md`, `W/canon-authority-map.md`, `W/memory-boundary-contract.md`, `W/event-and-fixture-contract.md`, `W/pilot-and-validation-contract.md`, `W/follow-on-parcel-manifests.md`, `W/open-decisions.md`. Everything else is read-only. A needed extra path goes under `NEEDS-AMENDMENT`.

## Inputs (read-only)

- **Work order:** `W/p0-triage-2026-10-12.md`, section **"R2"**, rows **T-16…T-27**. T-1…T-15 are already encoded — keep them; amend only where a T-16+ row says it amends one (T-16 amends T-9). Encode every `fix` row exactly as its **RULING** says; do not redesign. If a ruling is impossible at the pin (cite path:line), report it under `RULING-CONFLICT`.
- Findings behind the rulings: `W/p0-review-R2-seatA-2026-10-12.md`, `W/p0-review-R2-seatB-2026-10-12.md`.
- Spec: `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md`
- Pinned sources (read-only; targeted grep / line ranges only):
  - Cortex `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-cortex-50c5f42d297848148123519cb1607c079782ba43/`
  - Gateway `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-mcp-gateway-c92e42afeb84a5f425c282cfc9c7637f3e058fd4/`
  - Bridge `D:/Repos/keon-cortex-mcp-bridge/` (src + tests)

## What "done" means

1. Each T-16…T-27 row is reflected in the right documents: contract text (boundary / event-and-fixture), manifest file lists + verification + evidence + rollback lines (every new file marked NEW/UPDATE with its T-row), gates (pilot-and-validation), decision rows (open-decisions: add **OD-20** secret custody, **OD-21** Runtime dependency; record T-16…T-27 as 2026-10-12 owner-delegated by `01a131a9` in the §G ruling record).
2. Every UPDATE path you add exists at the pin (verify with ls/grep); NEW paths' parent directories exist or are stated as new.
3. Dependency order everywhere is `P1a ∥ P1b → P2 → P3 → P4a → P4b → P5a → P5b → P6 → P7 → P8 → P9 → P10` (T-25 makes P4a → P4b sequential).
4. Fixture inventory is consistent everywhere: **N-1…N-22, G-1…G-14, O-1…O-9, F-1…F-14** — no document cites a stale shorter range as a mandatory gate; new fixtures are assigned to their parcels' verification lines.
5. Rollback lines (T-17) and the baseline-recording rule (T-20) are updated; the R2 security note (Gateway correlation-id path traversal in current production code) appears in `open-decisions.md` as an owner-visible stop-ledger/security item.
6. Correct the `ApiKeyValidator.cs` actor-copy locator to `:107-108` (A F-6).
7. No unaffected section rewritten; still-true locators preserved; D1–D18, the four-force taxonomy, and frozen canon untouched.

## Step 0 — RESTATE AND STOP (this message)

Do NOT edit in this turn. Reply with: (1) one-paragraph restatement; (2) table T-row → file:section → planned change; (3) any UPDATE path you could NOT find at the pin; (4) any `RULING-CONFLICT` (with locator) or "none". Then stop and wait for GO.

## Completion report (after GO)

```
## REWORK-3 REPORT
### Changes (T-row → file:section → what changed)
### Pin existence checks for UPDATE paths added (path → found yes/no)
### RULING-CONFLICT (or none)
### NEEDS-AMENDMENT (or none)
### Files modified (subset of the 7 Allowed Files)
```
