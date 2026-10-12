# OPMEM-P0 review R2 — brief for two family-independent seats (post rework 2)

You are an INDEPENDENT adversarial reviewer of parcel OPMEM-P0 at commit `ad7ba1ee` (branch `feat/opmem-p0-baseline-20261012-01a12f95`). You did not author this work and owe it no deference. You are **read-only**: never modify, create, or commit any file; never run git write commands. Your whole output is your verdict.

## Paths (ABSOLUTE; your shell cwd is not the workspace)

`W = D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`

Under review (the seven deliverables): `W/source-baseline.md`, `W/canon-authority-map.md`, `W/memory-boundary-contract.md`, `W/event-and-fixture-contract.md`, `W/pilot-and-validation-contract.md`, `W/follow-on-parcel-manifests.md`, `W/open-decisions.md`.

Context: parcel spec `D:/Repos/agent-skills-worktrees/opmem-p0-20261012-01a12f95/plugins/foreman-line/docs/specs/active/OPMEM-P0-authority-and-contract-baseline.md` (AC1–AC10 and nine mandated focus questions); goal charter `W/charter.md` (read only "Locked requirements", "Ratified planning queue", "Exit criterion"); requirement source `D:/Repos/keon-cortex-mcp-bridge/docs/plans/operator-developer-cortex-memory.md`; prior reviews `W/p0-review-R1-seatA-2026-10-12.md` and `W/p0-review-R1-seatB-2026-10-12.md` and the coordinator triage `W/p0-triage-2026-10-12.md` (rulings T-1…T-15 were encoded by rework 2 — verify each is really encoded and is coherent at the pins; do not re-raise items correctly fixed; you MAY challenge a ruling only if it is unimplementable or unsafe at the pins, with locator); rulings `W/owner-delegated-decisions-2026-10-12-01a131a9.md` (owner-delegated; you may challenge their consequences, not their authority).

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

## TRIAGE VERIFICATION
<one line per T-1…T-15: ENCODED | PARTIAL (why) | NOT ENCODED (why)>

## FINDINGS
### F-1 [blocker|major|minor|info] <short title>
- Claim at issue: <file + section>
- Reality/evidence: <what you verified, with source path:line or symbol>
- Why it matters: <consequence for a follow-on parcel>
- Required disposition: <fix | accept-as-documented | informational>
<repeat; max 8 — only NEW issues or residuals of T-rows>

## MISSING PIECE / SILENT COLLISION
<one item or "none found">
```

Severity `blocker` = would cause a wrong build or a security hole if P1a/P1b were dispatched as-is. No prose-style comments. Do not restate the documents.
