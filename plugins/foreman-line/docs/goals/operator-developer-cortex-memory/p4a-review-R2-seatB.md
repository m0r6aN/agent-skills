# p4a-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
- `.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  - **2454 passed, 135 skipped**; timing benchmark passed.
- `.venv/Scripts/python.exe -m pytest tests/inheritance/test_ancestry_scope.py tests/inheritance/test_curation_http.py tests/tenancy/test_scope_enforcement.py -q -p no:cacheprovider`
  - **178 passed**.
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider`
  - **18 passed**, including **5 curation tests**.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p4a_seat_b_run.py opmem_p4a_seat_b_R2.py`
  - Adapted R1 probes confirmed handoff isolation across eight surfaces, recipient-bound identity, insert-only distinct-proposal approvals, epistemic preservation, text rejection, actor-bound self-approval refusal, and reject authorization in both backends.
  - Injected inheritance-validation failure returned **422**, with no derived record, disposition, inheritance event, or binding written.
  - Reproduced F-1 twice in both backends and F-2 twice in memory.
- `.venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p4a_seat_b_run.py opmem_p4a_seat_b_text.py`
  - Original R1 blank/NUL/surrogate probes now returned **422** in both backends.
  - PostgreSQL probes used fresh temporary databases, dropped afterward; no DDL against `cortex`.
- `.venv/Scripts/python.exe -m black --check <all 13 changed Python files>` / `.venv/Scripts/python.exe -m isort --check-only <same files>`
  - **Passed**. Worktree clean; changes match the amended allowlist.

## TRIAGE VERIFICATION
- **P4a-T1: IMPLEMENTED** — foreign role/profile grants no longer confer handoff visibility.
- **P4a-T2: PARTIAL** — distinct-proposal races preserve the committed record and return 409; identical concurrent in-memory retries incorrectly return 409 instead of replaying (F-2).
- **P4a-T3: IMPLEMENTED** — recipient participates in handoff identity and replay/recall recomputation.
- **P4a-T4: IMPLEMENTED** — weakest source status is carried; strengthening returns 422.
- **P4a-T5: IMPLEMENTED** — invalid text and over-bound payloads are rejected before storage.
- **P4a-T6: IMPLEMENTED** — the same actor cannot approve through another role.
- **P4a-T7: PARTIAL** — sequential status/class/recipient guards work; concurrent supersedes bypass the non-forking gate (F-1).
- **P4a-T8: IMPLEMENTED** — reject requires the proposer or approval capability.

## FINDINGS

### F-1 [major] Concurrent supersedes bypass the non-forking state gate
- Where: `src/keon/cortex/services/curation.py:1495–1500,1112–1113`; `src/keon/cortex/providers/memory/document_store.py:363–369`.
- Evidence: Two pending proposals with different replacement content were synchronized immediately before committing supersedes of the same approved artifact. Both served requests returned **200** in memory and PostgreSQL. Both disposition rows and distinct replacement records persisted; both replacements retained lifecycle status `active`. A subsequent sequential supersede correctly returned **409**.
- Why it matters: The predecessor’s non-superseded check occurs outside the atomic commit. Neither backend rechecks or conditionally arbitrates its transition, so the second bundle commits against an already-superseded predecessor. This is a reproducible fail-open lifecycle gate, leaving two approved replacements contrary to P4a-T7. The provisional support cap remains intact.
- Required disposition: fix in rework — arbitrate predecessor supersession inside the locked bundle/PG transaction, roll back the losing bundle with 409, and add simultaneous distinct-proposal supersede tests.

### F-2 [minor] Insert-only arbitration misclassifies identical concurrent in-memory retries
- Where: `src/keon/cortex/providers/memory/document_store.py:359–362`; `src/keon/cortex/services/curation.py:813–819,1687–1689`.
- Evidence: Two identical served approvals using the same caller, body, and operation ID were synchronized immediately before commit. Memory returned **200/409**, with the loser reporting “the derived artifact already exists in the target scope.” PostgreSQL returned **200/200** with byte-identical bodies. A later sequential memory retry returned 200.
- Why it matters: The memory insert-only guard runs before the binding-conflict check and raises `CurationRecordExists`, bypassing winner-binding recovery. An already-committed identical operation is therefore falsely reported as a conflict, violating T-11 replay semantics and backend parity. The new “race” regression tests execute sequentially and miss this branch.
- Required disposition: fix in rework — recover an identical committed binding with current reauthorization before returning a derived-ID conflict; retain 409 for genuinely distinct proposals and add concurrent identical-retry tests.
