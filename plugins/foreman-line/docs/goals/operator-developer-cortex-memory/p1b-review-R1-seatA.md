# p1b-review-R1-seatA — route `anthropic/claude-fable-5` (read-only + bash probes in temp), dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
`.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider` → `1928 passed, 110 skipped, 2 warnings in 36.96s` (matches claimed head; base was 1869 passed / 110 skipped — no regressions, +59 new tests)
## FINDINGS
### F-1 [major] Scope-id grammar is not injective for ids containing `:` — cross-profile private read confirmed by probe
- Where: `src/keon/cortex/tenancy/scope.py:84-96` (`role_scope_id`/`profile_shared_scope_id`), `src/keon/cortex/tenancy/enforcement.py:74-101` (`require_scope_headers` accepts any non-empty string)
- Evidence: temp-dir probe: record `RecordScope(role_id="b:c", profile_id="a", scope_class=role_private)` is visible to `CallerScope(role_id="c", profile_id="a:b", grant_scopes=∅)` with **no explicit grant** — `role:a:b:c` collides across the profile boundary. Nothing in P1b rejects `:` (or `,`) in role/profile ids at the header gate or at ingest; the brief explicitly names this hostile-input class, and P1b is the declared grammar authority.
- Why it matters: the constructed-not-parsed matching claim ("malformed ids can never widen") only holds if the id alphabet excludes the delimiter. A legitimately provisioned/enrolled profile or role id containing `:` silently aliases another role's private scope — a cross-role/cross-profile read of role-private records (boundary §4.3) with no grant. Headers are Gateway-trusted, so exploitation needs a colliding enrollment id, but injectivity is unproven on the enforcement authority's side and fail-open on collision.
- Required disposition: fix in rework — `require_scope_headers` (and ideally `record_scope`) must reject role/profile ids containing `:` or `,` (or use an unambiguous encoding), with tests.
### F-2 [minor] Write idempotency identity excludes role/profile — cross-scope ack replay and scope re-stamp on the replay branch
- Where: `src/keon/cortex/api.py:530-543` (replay branch of `ingest`)
- Evidence: `_request_hash` covers candidate + actor only. A retry under a *different* role/profile (same actor, candidate, receipt, key) replays the original ack; and when the reservation exists but the store row is absent (crash window), `store.upsert(record)` re-materializes the shard stamped with the *retrying* caller's scope, flipping record ownership. Also, identical content written by another role hits `_verify_existing_shard_receipt`/409 — a same-tenant cross-scope existence oracle.
- Why it matters: scope is not part of write identity; diverges from the T-23 ledger rule ("same operation under different scope ⇒ refuse"). Confidentiality impact is low (the retier already holds the content), and record-identity-includes-scope is explicitly the N-20 two-records half assigned to P2.
- Required disposition: carry-forward to P2 (T-23/N-20 two-records half; include the crash-window scope-restamp case in P2's fixtures).
### F-3 [minor] Generated-column DDL is textual evidence only — never executed in the verification run
- Where: `src/keon/cortex/providers/postgres/schema.py:29-40`; `tests/test_postgres_providers.py:100-107`
- Evidence: all PostgreSQL suites are skipped on this host (110 skips, unchanged); `test_schema_initialization…` asserts against a fake pool that records SQL strings. The `ADD COLUMN IF NOT EXISTS … GENERATED ALWAYS AS … STORED` statements (incl. `#>>` immutability, PG12+ requirement, full-table rewrite on first apply) were never run against a real PostgreSQL.
- Why it matters: the N-20 visibility-half claim "scope columns" (T-30) is proven only as text; a DDL defect would surface at first production migration. The served read path does not depend on the columns (it reads `provenance.extra` from the payload), so enforcement itself is tested.
- Required disposition: carry-forward to P2 (T-22 real-PG round-trip via `KEON_TEST_DATABASE_URL` must execute this DDL and read back the generated columns).
### F-4 [info] Search response-boundary re-check is tautological
- Where: `src/keon/cortex/api.py:637-640`
- Evidence: the post-ranking re-check calls `is_record_visible(caller, record)` on the same objects with the same inputs as the pre-ranking filter; the 500 branch is unreachable.
- Why it matters: satisfies §4.3's "again at response boundaries" by the letter only; it adds no protection against a future divergence between candidate objects and serialized rows.
- Required disposition: informational.
### F-5 [info] Any record whose `provenance.extra` is absent/not-a-dict classifies as legacy (operator-visible), not invisible
- Where: `src/keon/cortex/tenancy/scope.py:160-186` (`record_scope`)
- Evidence: `extra` missing, provenance `None`, or all three scope keys absent ⇒ `legacy` ⇒ visible to the whole operator profile via implicit `op:legacy`. This matches the frozen legacy rule for genuinely pre-scope rows, and every served write now stamps full scope; but a future ingest path that drops the stamp would land rows operator-visible rather than fail-closed-invisible. Partial/unknown stamps correctly fail to invisible.
- Required disposition: informational (watch item for P2's new write paths).
## SEAM NOTE
Composition is fail-closed in every absence/forgery direction the P1b side controls: carriage headers are honored only after the constant-time Gateway-secret check (401 before anything else); missing/blank role or profile ⇒ 403 with zero store access (spy-store verified); grant parsing (comma-split, strip, drop blanks) can only *narrow* — a P1a bug that emitted space-joined or malformed grant ids would parse as unmatched ids and deny, never widen; `op:legacy` claimed by a non-operator profile is discarded server-side (N-19); and the HTTP tests correctly use the frozen §2.3 header contract rather than P1a code, per the T-2 queue note. The one genuine composition hazard is F-1: P1b defines the scope-id grammar but enforces no alphabet, so grammar injectivity currently rests entirely on P1a/enrollment never provisioning a role or profile id containing `:` — a property the frozen contract nowhere guarantees and P1b (as the enforcement authority) must itself enforce; P1a's reviewers should independently confirm the Gateway rejects `:`/`,` in enrolled role/profile ids and in JWT `role_id`/`profile_id` claims until the rework lands.
