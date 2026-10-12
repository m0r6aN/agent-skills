# OPMEM-P1a — builder kickstarter (Gateway role binding, verified actor, admin read, spine hardening)

You are the **builder** for parcel OPMEM-P1a. Coordinator: Pi `01a131a9`. Tracking: m0r6aN/agent-skills#201 (parent #200).

## Workspace

- Worktree (your ONLY mutation root): `D:/Repos/opmem-worktrees/gateway-p1a` — repo `Keon-Systems/keon-mcp-gateway`, branch `feat/opmem-p1a-role-binding`.
- **Verification base (T-2):** `c92e42afeb84a5f425c282cfc9c7637f3e058fd4` = head of `opmem/integration` at dispatch.
- **Recorded suite baseline at base (T-20):** `dotnet test tests/Keon.McpGateway.Tests` → **293 passed, 0 failed, 0 skipped**.
- You may `git add`/`git commit` on your branch. **Never push, never touch other branches, never run anything that deploys.** Do not edit files outside the worktree.

## Contract (read these; they are frozen — do not reinterpret)

Directory `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P1a — Allowed Files, seam, verification, rollback. **This is your spec.**
- `C/memory-boundary-contract.md` §2.1 (admin endpoint contract, T-28), §2.3 **Auth** + **Trusted scope carriage** (T-1/T-29 headers), §4.1 rules 1–6, §4.3 legacy rows, §6 rows you touch.
- `C/event-and-fixture-contract.md` §9 negative fixtures N-14, N-15, N-16 (all cases incl. T-7 and T-28), N-22; and boundary §4.4 N-1, N-2, N-6.
- `C/p0-triage-2026-10-12.md` rows T-1, T-7, T-26, T-28, T-29 (rulings).
- Carry-forward for P1a (`C/p0-closure-2026-10-12.md`): the admin authorization is at `Program.cs:224` (not `:223`).

## Allowed Files (exact; anything else ⇒ stop and report NEEDS-AMENDMENT)

- NEW `src/Keon.McpGateway/Auth/RoleBinding.cs`
- NEW `src/Keon.McpGateway/Auth/EnrollmentService.cs`
- UPDATE `src/Keon.McpGateway/Auth/JwtValidator.cs`
- UPDATE `src/Keon.McpGateway/Auth/ApiKeyValidator.cs`
- UPDATE `src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs`
- UPDATE `src/Keon.McpGateway/Program.cs`
- UPDATE `src/Keon.McpGateway/Backends/CortexClient.cs`
- UPDATE `src/Keon.McpGateway/Spine/IngressSpine.cs`
- NEW `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs`
- NEW `tests/Keon.McpGateway.Tests/Auth/ApiKeyValidatorActorBindingTests.cs`
- NEW `tests/Keon.McpGateway.Tests/Mcp/McpCallerContextResolverTests.cs`

Existing tests outside this list must keep passing **unmodified**. If an existing test asserts the old (defective) behaviour — e.g. header precedence over claims — do not edit it: list it in your report under `EXISTING-TEST-CONFLICT` with the reason; the coordinator rules.

## What must be true when you finish

1. **Verified identity (N-14, N-15, rule 6):** client headers `X-Keon-Tenant-Id`/`X-Keon-Actor-Id` never override authenticated claims (they may only be accepted when equal to the authenticated value; a mismatch fails closed). API-key/machine-credential principals get actor/role from the enrollment record, never from the client.
2. **Role binding (rules 1–5, N-1, N-2, N-6):** `RoleBinding` resolves role id, role generation, profile id, grant scopes, session id (and optional task id) only from trusted sources: issuer-validated JWT claims, or an `EnrollmentService` record bound to the machine credential. Missing/foreign role ⇒ fail closed, never a default coordinator role. A `role` (or role-like) field in tool arguments is rejected before any backend call. Machine credentials authorize only roles their enrollment lists; revoked/expired enrollments fail closed. Choose a minimal, explicit enrollment store (configuration-backed options are acceptable; provisioning is P8) and state the choice in Step 0.
3. **Carriage (T-1/T-29):** `CortexClient` emits `X-Keon-Role-Id`, `X-Keon-Role-Generation`, `X-Keon-Profile-Id`, `X-Keon-Grant-Scopes` (canonical: sorted, de-duplicated, comma-joined), `X-Keon-Session-Id`, `X-Keon-Task-Id` from the verified binding on every Cortex call — never from client input.
4. **Admin ingress read (T-7, T-28, N-16):** `/mcp/admin/ingress/{correlationId}` requires the separately enrolled capability `keon:mcp:admin:ingress` (holder of `keon:mcp:list` only ⇒ 403); every read is audit-logged; results are tenant-filtered on SQL **and** fallback paths; legacy/unbound rows fail closed (not returned); mixed-tenant correlation-id collisions return only the caller tenant's rows; same-tenant cross-role and operator→live-profile reads are refused unless the governance-admin capability is held.
5. **Spine hardening (T-7, T-26, N-22):** ingress events persist tenant; fallback file name = lowercase hex SHA-256 of `tenant + "\n" + correlation_id`; resolved path confined to the fallback directory (fail closed); hostile ids (absolute paths, separators, `..`, NUL, over-long) never escape. Schema change is additive (nullable column; previous rows remain readable — rollback T-17).
6. **Tests:** named fixtures each have at least one test whose name contains the fixture id (e.g. `N14_…`). Full suite: **no regressions vs 293 passed**.

## Step 0 — RESTATE AND STOP (this turn)

Do NOT edit or commit. Read the contract and the pinned code. Reply with:
1. Restatement (one paragraph).
2. Design table: requirement → file → approach (one line each), including your enrollment-store choice, JWT claim names you will use for role/generation/profile/scopes/session/task, and how SQLite schema migration is made additive.
3. Existing tests you expect to conflict (`EXISTING-TEST-CONFLICT` candidates), with file:line.
4. Any file outside Allowed Files you believe you need (or "none").
Then stop and wait for GO.

## Completion report (after GO)

```
## P1a BUILD REPORT
### Commits (sha + subject)
### Requirement → evidence (test names)
### Test run (exact command + final summary line, before/after counts)
### EXISTING-TEST-CONFLICT (or none)
### NEEDS-AMENDMENT (or none)
### Files changed (git diff --name-status <base>..HEAD)
```
