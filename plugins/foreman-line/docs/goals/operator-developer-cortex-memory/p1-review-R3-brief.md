# OPMEM-P1a / P1b — review R3 (closing verification, targeted)

Rules from `p1-review-brief.md` apply (read-only; probes only in system temp; never edit/commit). Scope is NARROW.

- **Heads:** P1a `d7073c2` (rework-2 delta `git diff 4da2c47..d7073c2`), expected `dotnet test tests/Keon.McpGateway.Tests` → 421 passed. P1b `38ff14a` (delta `git diff 9801999..38ff14a`), expected pytest → 2046 passed / 110 skipped.
- **Verify only:** ruling **T-36** and rows **P1a-T10…P1a-T13** (P1a) or **P1b-T6, P1b-T7** (P1b) in `p1-triage-2026-10-12.md` (same directory as this brief), plus any regression the delta introduced. Re-run the exact hostile inputs from your seat's R2 review where relevant (e.g. trailing `\n`, `\t…\r\n` scopes, whitespace-only correlation ids).
- Budget ~15 minutes.

Output (STRICT):
```
## VERDICT: <APPROVE | APPROVE-WITH-FIXES | REQUEST-CHANGES>
## TEST RUN
<command + final summary line>
## TRIAGE VERIFICATION
<row: IMPLEMENTED | PARTIAL (why) | NOT IMPLEMENTED (why)>
## FINDINGS
<max 3; each: [blocker|major|minor|info] title — file:line — evidence — "fix in rework" | "carry-forward to <parcel>" | "informational">
```
REQUEST-CHANGES only for a blocker/major that is exploitable or a fail-open.
