# OPMEM-P0 review R1 — brief for two family-independent seats

You are an INDEPENDENT adversarial reviewer of parcel OPMEM-P0 at commit `de7ec59a` (branch `feat/opmem-p0-baseline-20261012-01a12f95`). You did not author this work and owe it no deference. You are **read-only**: never modify, create, or commit any file; never run git write commands. Your whole output is your verdict.

## Paths (ABSOLUTE; your shell cwd is not the workspace)

`W = D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`

Under review (the seven deliverables): `W/source-baseline.md`, `W/canon-authority-map.md`, `W/memory-boundary-contract.md`, `W/event-and-fixture-contract.md`, `W/pilot-and-validation-contract.md`, `W/follow-on-parcel-manifests.md`, `W/open-decisions.md`.

Context: parcel spec `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md` (AC1–AC10 and nine mandated focus questions); goal charter `W/charter.md` (read only "Locked requirements", "Ratified planning queue", "Exit criterion"); requirement source `D:/Repos/keon-cortex-mcp-bridge/docs/plans/operator-developer-cortex-memory.md`; prior review `W/p0-review-R0-seat2-2026-10-12.md` (already addressed by rework 1 — verify the fixes are real, do not re-raise fixed items); rulings `W/owner-delegated-decisions-2026-10-12-01a131a9.md` (owner-delegated; you may challenge their consequences, not their authority).

Pinned sources (read-only, never execute; use targeted grep / line ranges, NOT whole-tree reads):
- Cortex `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-cortex-50c5f42d297848148123519cb1607c079782ba43/`
- Gateway `D:/Repos/opmem-source-snapshots-20261011/_extract/Keon-Systems-keon-mcp-gateway-c92e42afeb84a5f425c282cfc9c7637f3e058fd4/`
- Bridge `D:/Repos/keon-cortex-mcp-bridge/src`

## Product context

Short-lived Pi agents get durable, selectively recalled memory belonging to long-lived roles across three machines: Pi extension → local adapter container → Azure MCP Gateway (identity/scope/receipts) → Azure Cortex (memory semantics) → Neon Postgres. P0 is DOCUMENTS/CONTRACTS ONLY: freeze real seams at pinned revisions, classify existing vs missing, define fixtures and exact follow-on manifests so code parcels P1a…P7 can be dispatched precisely.

## Budget

Finish within ~25 minutes of work. Read the seven deliverables fully; verify at most ~12 load-bearing source claims with targeted greps. Prefer depth on what would break follow-on builds over breadth.

## Output contract (STRICT — return nothing else)

```
## VERDICT: <APPROVE | APPROVE-WITH-FIXES | REQUEST-CHANGES>

## R0 FIX VERIFICATION
<one line per R0 F-1…F-9 + missing piece: FIXED | PARTIAL (why) | NOT FIXED (why)>

## FINDINGS
### F-1 [blocker|major|minor|info] <short title>
- Claim at issue: <file + section>
- Reality/evidence: <what you verified, with source path:line or symbol>
- Why it matters: <consequence for a follow-on parcel>
- Required disposition: <fix | accept-as-documented | informational>
<repeat; max 10>

## MISSING PIECE / SILENT COLLISION
<one item or "none found">
```

Severity `blocker` = would cause a wrong build or a security hole if P1a/P1b were dispatched as-is. No prose-style comments. Do not restate the documents.
