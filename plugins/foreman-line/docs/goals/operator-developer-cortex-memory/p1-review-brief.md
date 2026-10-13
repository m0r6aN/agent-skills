# OPMEM-P1a / P1b — independent adversarial code review brief

You are an INDEPENDENT adversarial reviewer of ONE code parcel (named in your prompt). You did not write it and owe it no deference. **You never fix, never edit, never commit, never push.** You MAY run read-only commands and the existing test suite; you MAY write throw-away probe scripts **only under your system temp directory** (never inside any repository). Your whole output is your verdict.

## Parcels

| | P1a | P1b |
|---|---|---|
| Worktree | `D:/Repos/opmem-worktrees/gateway-p1a` | `D:/Repos/opmem-worktrees/cortex-p1b` |
| Base → head | `c92e42a` → `d098684` (`git diff c92e42a..HEAD`) | `50c5f42d` → `2ab9262` (`git diff 50c5f42d..HEAD`) |
| Test command | `dotnet test tests/Keon.McpGateway.Tests` (base 293 → head 343 passed) | `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` (base 1869 → head 1928 passed, 110 skipped both) |

## Contract (frozen; judge the code against it)

`C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P1a / §P1b (Allowed Files, seam, verification)
- `C/p1-dispatch-record-2026-10-12.md` (Step 0 rulings S0-1a…S0-4a, S0-1b…S0-4b — these amend the Allowed Files)
- `C/memory-boundary-contract.md` §2.1 admin contract, §2.3 Auth + Trusted scope carriage, §4.1, §4.3
- `C/event-and-fixture-contract.md` §9 (N-fixtures) and boundary §4.4 (N-1…N-7)

## What to hunt

1. **Bypass:** any path where a client-controlled value (header, tool argument, query param, JWT claim not issuer-validated, API-key request field) reaches identity, role, profile, grant scopes, tenant, or Cortex carriage headers. Any route/tool that reaches Cortex (P1a) or the store (P1b) without the binding/scope gate. Ordering bugs (scope check after store read, after ranking, or only on some routes).
2. **Fail-open defaults:** missing/empty/malformed values that default to a permissive role/profile/scope; exceptions swallowed into success; legacy rows visible to live profiles; unknown scope classes visible.
3. **Hostile inputs:** correlation ids with traversal/absolute/NUL/over-long (P1a); grant-scope strings with separators/whitespace/duplicates/case tricks; role ids containing `:` or `,` that could forge a scope id (P1b); header injection.
4. **Evidence discipline:** do tests actually exercise the claimed fixture (N-1, N-2, N-6, N-14, N-15, N-16 incl. T-7/T-28 cases, N-22 for P1a; N-4, N-5, N-19, N-20 visibility half for P1b) through the real pipeline, or only helpers? Are FIXTURE-EDITS truly fixture-only? Any file changed outside the (amended) Allowed Files?
5. **Seam with the sibling parcel:** P1a emits `X-Keon-Grant-Scopes` from JWT/enrollment `grant_scopes`; P1b defines the scope-id grammar (`role:{profile}:{role}`, `profile:{profile}:shared`, `op:legacy`). Judge whether the two sides compose safely (fail-closed) and name any mismatch.
6. **Regression/rollback:** additive migrations really additive; old rows still readable; nothing that would break the pre-existing production behaviour beyond what the contract mandates.

## Output contract (STRICT — return nothing else)

```
## VERDICT: <APPROVE | APPROVE-WITH-FIXES | REQUEST-CHANGES>
## TEST RUN
<command + final summary line you observed, or "not run (reason)">
## FINDINGS
### F-1 [blocker|major|minor|info] <title>
- Where: <file:line>
- Evidence: <what you observed / probe result>
- Why it matters: <exploit or failure>
- Required disposition: <fix in rework | carry-forward to <parcel> | informational>
<max 8>
## SEAM NOTE
<one paragraph on P1a↔P1b composition, or "none">
```
`blocker` = exploitable bypass, fail-open, or wrong build. Do not comment on style.
