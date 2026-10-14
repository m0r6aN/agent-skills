# p4a-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  - **2443 passed, 133 skipped, 1 failed** — only the documented flaky `receipt_overhead_bounded[50]` timing test.
- `.venv/Scripts/python.exe -m pytest 'tests/temporal/test_benchmark.py::TestBenchReceiptEmitOverhead::test_receipt_overhead_bounded[50]' -q -p no:cacheprovider`
  - **1 passed**.
- `.venv/Scripts/python.exe -m pytest tests/inheritance/test_ancestry_scope.py tests/inheritance/test_curation_http.py tests/tenancy/test_scope_enforcement.py -q -p no:cacheprovider`
  - **168 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  - **16 passed**.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p4a_seat_b_run.py`
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p4a_seat_b_run.py opmem_p4a_seat_b_text.py`
  - Served HTTP probes reproduced F-1–F-5. Concurrent overwrite reproduced in memory and PostgreSQL. Injected inheritance-validator failure returned **422**, with no disposition, derived record, or inheritance event written.
  - PostgreSQL probes used fresh temporary databases, dropped afterward; no DDL against `cortex`.
- `python -m black --check` / `python -m isort --check-only`, using `.venv/Scripts/python.exe` over all 12 changed files: **passed**.
- Worktree remained clean; changed files match the amended allowlist. Existing fixture edits are mechanical.

## FINDINGS

### F-1 [blocker] Author-role grants bypass handoff recipient isolation
- Where: `src/keon/cortex/tenancy/scope.py:397–403`.
- Evidence: Handoff visibility accepts the author’s `role:{profile}:{role}` token from the caller’s effective grants, without requiring the caller actually to be the author or target. For an approved `role_a → role_b` handoff, `role_z` carrying `role:profile_a:role_a` received **200** through exact-ID, lineage, evidence, replay, and memory-events; search and recall returned the artifact. This also succeeded with the caller in `profile_z`. No foreign `handoff:` grant was supplied.
- Why it matters: Ruling 1 restricts handoffs to their author and named target in the same profile. The foreign-handoff-token rejection does not enforce that restriction: an otherwise valid role grant bypasses it across every consuming surface.
- Required disposition: fix in rework — enforce actual caller profile and author/target role equality for handoffs; add served tests with explicit foreign author-role grants.

### F-2 [major] Concurrent approvals overwrite an already committed derived record
- Where: `src/keon/cortex/services/curation.py:1400–1414,1025–1027`; `src/keon/cortex/providers/memory/document_store.py:340–350`.
- Evidence: Two pending proposals with identical curated content and target scope, but different sources and operation IDs, were synchronized immediately before their commits. Both dispositions returned **200**, with the same derived ID, in memory and PostgreSQL. Both disposition rows survived, but the second write replaced the record’s lineage and receipt. The single retained `Observation` referenced the other approval’s receipt.
- Why it matters: The absence check occurs outside the commit boundary. Per-proposal uniqueness does not arbitrate derived-record uniqueness, and unconditional upsert permits history and provenance replacement. This violates the sequential **409** behavior already tested and leaves committed inheritance events inconsistent with the surviving record.
- Required disposition: fix in rework — enforce insert-only derived-record uniqueness inside the locked bundle/PG transaction, distinguish predecessor updates from derived inserts, and test concurrent distinct-proposal approvals and identical retries.

### F-3 [major] Handoff identity omits its named recipient
- Where: `src/keon/cortex/services/curation.py:1400–1408`; `src/keon/cortex/spine/shard_plane.py:47–73`.
- Evidence: The derived ID includes author role, profile, and the literal class `handoff`, but not `handoff_to_role_id`. Sequential approvals of identical content for `role_b` and `role_d` therefore collide: the second returns **409**. Changing only the persisted target on a copied record leaves `recompute_shard_id` unchanged.
- Why it matters: Different recipient inboxes are distinct authorization scopes but share record identity. The ratified replay/recall allowlist addition makes these records eligible without binding their recipient into identity. Combined with F-2, concurrent approvals can replace which role receives the artifact.
- Required disposition: fix in rework — bind the named target into handoff identity and matching replay/recall recomputation; test identical-content handoffs to different recipients.

### F-4 [major] Re-curation can erase or strengthen source epistemic status
- Where: `src/keon/cortex/services/curation.py:1156,1421`; `src/keon/cortex/inheritance/ancestry_scope.py:139–140`.
- Evidence: Epistemic status is copied exclusively from the optional proposal field, not inherited or constrained by source records. Starting from an approved artifact stamped `contested`, re-curation without that field produced an artifact with no epistemic status; supplying `verified` produced one stamped `verified`. Both approvals returned **200**.
- Why it matters: F-12 and ruling 3 require epistemic status to be carried, without factual authority gained through derivation. The `provisional` support cap remains intact, but does not prevent laundering the source’s epistemic qualification.
- Required disposition: fix in rework — preserve source epistemic constraints, fail closed on unsupported strengthening, and add served re-curation tests for omission and attempted upgrade.

### F-5 [minor] Proposal text validation permits permanently unapprovable or storage-incompatible payloads
- Where: `src/keon/cortex/services/curation.py:CurationProposalIn`, including `content` and `reason`; `src/keon/cortex/api.py:curation_proposals`.
- Evidence: Whitespace-only content was stored as a pending proposal with **200**, then approval returned **500** when `ShardRecord` rejected it, in both backends. NUL-containing content was proposed and approved successfully in memory, while PostgreSQL proposal submission returned **503**, advertising an identical retry as recoverable.
- Why it matters: Invalid input becomes durable pending state or a falsely retryable storage failure. This bypasses the existing ingest model’s nonblank/clean-text discipline and breaks backend parity.
- Required disposition: fix in rework — reject nonblank/text-storage violations in the wire models before any store access, including applicable reason fields, with served tests against both backends.
