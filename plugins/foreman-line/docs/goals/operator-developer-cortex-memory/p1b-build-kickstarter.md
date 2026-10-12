# OPMEM-P1b — builder kickstarter (Cortex served-path scope enforcement)

You are the **builder** for parcel OPMEM-P1b. Coordinator: Pi `01a131a9`. Tracking: m0r6aN/agent-skills#202 (parent #200).

## Workspace

- Worktree (your ONLY mutation root): `D:/Repos/opmem-worktrees/cortex-p1b` — repo `Keon-Systems/keon-cortex`, branch `feat/opmem-p1b-scope-enforcement`.
- **Verification base (T-2):** `50c5f42d297848148123519cb1607c079782ba43` = head of `opmem/integration` at dispatch.
- Python env already provisioned: `D:/Repos/opmem-worktrees/cortex-p1b/.venv/Scripts/python.exe` (Python 3.12, `-e .[dev]`). Run tests with `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`.
- **Recorded suite baseline at base (T-20):** **1869 passed, 110 skipped, 0 failed** (Windows host, no Postgres/Mongo — the skips are environment-gated).
- You may `git add`/`git commit` on your branch. **Never push, never touch other branches.** Do not edit files outside the worktree.

## Contract (frozen — do not reinterpret)

Directory `C = D:/Repos/agent-skills-worktrees/opmem-coord-20261012-01a131a9/plugins/foreman-line/docs/goals/operator-developer-cortex-memory`
- `C/follow-on-parcel-manifests.md` §P1b — Allowed Files, seam, verification, rollback. **This is your spec.**
- `C/memory-boundary-contract.md` §2.3 **Auth** + **Trusted scope carriage** (headers `X-Keon-Role-Id`, `X-Keon-Role-Generation`, `X-Keon-Profile-Id`, `X-Keon-Grant-Scopes`, `X-Keon-Session-Id`, `X-Keon-Task-Id`), §4.1, §4.3 (incl. **Record scope and legacy rows**), §5 (D16 profiles).
- `C/event-and-fixture-contract.md` §9: N-4 (exact-ID/lineage via opaque reference), N-5, N-10 (Cortex-side half), N-19, N-20 **visibility half only**; boundary §4.4 N-1…N-7 as applicable to Cortex.
- `C/p0-triage-2026-10-12.md` rows T-1, T-17, T-29, T-30, T-31.
- P1a (Gateway) is built in parallel; **your HTTP tests must use the frozen header contract directly, not P1a code.**

## Allowed Files (exact; anything else ⇒ stop and report NEEDS-AMENDMENT)

- UPDATE `src/keon/cortex/tenancy/enforcement.py`
- NEW `src/keon/cortex/tenancy/scope.py`
- NEW `tests/tenancy/__init__.py`
- NEW `tests/tenancy/test_scope_enforcement.py`
- UPDATE `src/keon/cortex/api.py`
- UPDATE `src/keon/cortex/providers/postgres/schema.py`
- NEW `tests/test_scope_http.py`

Note: `core/models.py` and the document-store implementations are **not** in your list (they belong to P2). `Provenance.extra` (a free dict persisted inside the JSON payload) and Postgres **generated** columns over `payload` are examples of approaches that stay inside the list — propose your approach in Step 0. Existing tests outside the list must keep passing **unmodified**; if one asserts behaviour the contract now forbids, list it under `EXISTING-TEST-CONFLICT` and do not edit it.

## What must be true when you finish

1. **Header acceptance (T-1):** memory routes (`POST /v1/shards`, `POST /v1/shards/search`, `GET /v1/shards/{id}`, `/lineage`, `/evidence`, `POST /v1/replay`) read the six carriage headers **only** after `_authorize_gateway` succeeds; role/profile absent on a memory route ⇒ fail closed (4xx, no store access). `X-Keon-Task-Id` is advisory only (never an authorization input). `/health` unchanged.
2. **Persisted record scope (T-1, T-17):** every newly ingested record carries `role_id`, `profile_id`, `scope_class` derived from the trusted headers; storage change is additive (legacy rows still load; new Postgres columns nullable or generated).
3. **Enforcement before candidates and at response (§4.3):** search filters by the caller's scope **before** ranking/selection and re-checks every returned row; exact-ID, lineage and evidence refuse records outside the caller's scope (N-4 — must fail, not return metadata). Replay is scoped the same way.
4. **Scope algebra:** define it explicitly in `tenancy/scope.py` (what a grant scope id looks like, how `scope_class` values — at least role-private, profile-shared, legacy — are matched). Private role scope visible only to the same role in the same profile; live profiles never see legacy rows; operator profile's legacy scope sees legacy rows; local/caller input can never widen grants (N-19). Propose the algebra in Step 0; the coordinator rules.
5. **Tests:** `tests/tenancy/test_scope_enforcement.py` (unit, algebra) and `tests/test_scope_http.py` (HTTP via FastAPI TestClient with the in-memory store: same-tenant cross-role search/exact-ID/lineage refused, operator→live-profile refused, legacy-row visibility rule, missing role/profile fails closed, forged scope headers without the gateway secret rejected). Test names contain fixture ids where applicable (`N4_…`, `N20_visibility_…`). Full suite: **no regressions vs 1869 passed / 110 skipped**, and no new skips.

## Step 0 — RESTATE AND STOP (this turn)

Do NOT edit or commit. Read the contract and the code (`api.py`, `tenancy/enforcement.py`, `providers/postgres/schema.py`, `core/models.py` read-only, the in-memory and Postgres document stores read-only, existing `tests/` that exercise `api.py`). Reply with:
1. Restatement (one paragraph).
2. Design table: requirement → file → approach, including the **scope algebra** and where scope is persisted.
3. Existing tests you expect to break (e.g. tests that call memory routes without role/profile headers) — file:line — and your proposal (the coordinator decides whether they become `EXISTING-TEST-CONFLICT` or the contract permits a compatibility path).
4. Any file outside Allowed Files you believe you need (or "none").
Then stop and wait for GO.

## Completion report (after GO)

```
## P1b BUILD REPORT
### Commits (sha + subject)
### Requirement → evidence (test names)
### Test run (exact command + final summary line, before/after counts)
### EXISTING-TEST-CONFLICT (or none)
### NEEDS-AMENDMENT (or none)
### Files changed (git diff --name-status <base>..HEAD)
```
