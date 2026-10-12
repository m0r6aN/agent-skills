# OPMEM-P0 rework 2 — builder kickstarter

You are the **builder** for rework 2 of parcel OPMEM-P0 (operator-developer Cortex memory: authority and contract baseline). Coordinator: Pi `01a131a9`. Documents-only. You never commit, push, or touch git state.

## Workspace (ABSOLUTE paths; your shell cwd is NOT this directory)

`W = D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`

## Allowed Files — the ONLY files you may modify

`W/source-baseline.md`, `W/canon-authority-map.md`, `W/memory-boundary-contract.md`, `W/event-and-fixture-contract.md`, `W/pilot-and-validation-contract.md`, `W/follow-on-parcel-manifests.md`, `W/open-decisions.md`. Everything else is read-only. A needed extra path goes under `NEEDS-AMENDMENT`.

## Inputs (read-only)

- **Your work order:** `W/p0-triage-2026-10-12.md` — rows T-1…T-15. Every row with disposition `fix` must be encoded exactly as its **RULING** says. The rulings are coordinator decisions; do not redesign them. If a ruling is factually impossible at the pinned source (cite path:line), report it under `RULING-CONFLICT` instead of improvising.
- Findings behind the rulings: `W/p0-review-R1-seatA-2026-10-12.md`, `W/p0-review-R1-seatB-2026-10-12.md`.
- Prior rulings: `W/owner-delegated-decisions-2026-10-12-01a131a9.md`.
- Spec (AC1–AC10): `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md`
- Pinned sources (read-only, never execute; targeted grep / line ranges only):
  - Cortex `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-cortex-50c5f42d297848148123519cb1607c079782ba43/`
  - Gateway `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-mcp-gateway-c92e42afeb84a5f425c282cfc9c7637f3e058fd4/`
  - Bridge `D:/Repos/keon-cortex-mcp-bridge/` (src + tests)

## What "done" means

1. Each T-row is reflected in the right document(s): contract text in `memory-boundary-contract.md` / `event-and-fixture-contract.md`, manifest file lists + verification + evidence lines in `follow-on-parcel-manifests.md` (every new file marked NEW/UPDATE with the T-row that added it), gates in `pilot-and-validation-contract.md`, decision rows in `open-decisions.md` (add OD-19 epoch proofs deferred; record T-rulings as 2026-10-12 owner-delegated by `01a131a9`).
2. Every file you add to a manifest exists at the pin if marked UPDATE (verify with ls/grep) or is marked NEW.
3. The sequential handoff rule and the integration-head base rule (T-2) appear in the manifests' rules section, and every manifest's target line reflects them.
4. Fixture inventory is consistent everywhere: N-1…N-19, G-1…G-12, O-1…O-9, F-1…F-12 — no document cites a stale shorter range as a mandatory gate.
5. `X-Idempotency-Key` everywhere the wire header is named.
6. No unaffected section is rewritten; still-true locators are preserved. D1–D18, the four-force taxonomy, and frozen canon are untouched.

## Step 0 — RESTATE AND STOP (this message)

Do NOT edit in this turn. Reply with: (1) one-paragraph restatement; (2) table T-row → file:section → planned change; (3) any file you add to a manifest as UPDATE that you could NOT find at the pin; (4) any `RULING-CONFLICT` (with locator) or "none". Then stop and wait for GO.

## Completion report (after GO)

```
## REWORK-2 REPORT
### Changes (T-row → file:section → what changed)
### Pin existence checks for UPDATE paths added (path → found yes/no)
### RULING-CONFLICT (or none)
### NEEDS-AMENDMENT (or none)
### Files modified (subset of the 7 Allowed Files)
```
