# p4a-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2454 passed, 135 skipped (flaky benchmark passed this run) — matches brief
KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider
  → 18 passed (test_curation_postgres.py alone → 5 passed, matches brief)
black --check / isort --check-only (all 9 changed files in b67de17..cb386f8) → clean
Temp-dir probes (re-run of my R1 probes):
  same-actor(agt_a)/different-role(role_b) approve → 403 "own proposal"; supersede → 403  (T6 behavior confirmed)
  is_visible handoff: forged well-formed handoff:profile_a:role_b grant (role_z) → False; author-role grant → False; cross-profile same-named target role → False; true target/author → True; operator → False  (T1 confirmed)
```

## TRIAGE VERIFICATION
- P4a-T1: IMPLEMENTED — `tenancy/scope.py` handoff branch now binds `caller.profile_id`/`caller.role_id` directly; grants never consulted. Probe + `test_T1_foreign_author_role_grants_confer_nothing_on_any_surface` (all surfaces, foreign `role:`/`profile:` grants) confirm fail-closed.
- P4a-T2: IMPLEMENTED — unlocked pre-check removed; in-memory `RecordExistsOnInsert` raised inside the locked bundle before any mutation; PG `INSERT … ON CONFLICT DO NOTHING` + "INSERT 0 0" row check inside the transaction ⇒ `CurationRecordExists` 409, full rollback. Winner provenance verified intact and loser proposal stays re-disposable (`test_T2_*` both backends).
- P4a-T3: IMPLEMENTED — 8-key `handoff` payload in `make_scoped_candidate_shard_id` (loud ValueError on omission/misuse), mirrored in `recompute_shard_id`; `test_T3_identical_content_to_two_recipients_is_two_records` proves fan-out + per-inbox isolation + replay byte-identity.
- P4a-T4: IMPLEMENTED — `resolve_derived_epistemic_status` (weakest-source floor, keep/weaken only, unknown status fails closed → 422); stamped into the derived extra; unit + served tests.
- P4a-T5: IMPLEMENTED — `_check_text` at the wire models (blank/NUL/surrogates) on `content`/`reason` before store access; PG test proves 422, nothing durable, never 503.
- P4a-T6: PARTIAL — code is correct (actor-only conjunction; my probe: same actor/different role → 403 for approve AND supersede), but the ruled test ("Test same actor / different role") was NOT added, and the surviving test comment in `test_proposer_may_not_approve_own_proposal` still states "the ruling binds the identity triple" — behavior fixed, evidence/documentation gap.
- P4a-T7: IMPLEMENTED — already-superseded target → 409 (no fork), class mismatch → 409, handoff recipient mismatch → 409; `test_T7_supersede_target_hygiene`.
- P4a-T8: IMPLEMENTED — reject requires proposer actor or `cap:curation.approve`, else 403; `test_reject_requires_proposer_or_capability`.

## FINDINGS

### F-1 [minor] P4a-T6 ruled test missing; surviving test comment misstates the ruling
- Where: `tests/inheritance/test_curation_http.py` ~421–453 (`test_proposer_may_not_approve_own_proposal`); fix at `src/keon/cortex/services/curation.py` ~1359–1369.
- Evidence: the triage table mandates "Test same actor / different role"; no such case exists anywhere in the suite (grep for the refusal string finds only the same-triple case). The test's inline comment still reads "the ruling binds the identity triple" — the opposite of the P4a-T6 ruling now encoded in the code. My temp probe confirms the behavior itself is correct (403 for approve and supersede, same actor/different role).
- Why it matters: the anti-laundering backstop is unguarded by regression evidence — a future refactor restoring the triple conjunction would pass the suite; the stale comment actively invites it.
- Required disposition: fix in rework (add the same-actor/different-role 403 case; correct the comment) — behavior needs no change.

### F-2 [info] Dead `superseded` proposal-status vocabulary persists (R1 A F-7 residual, triaged informational)
- Where: `src/keon/cortex/services/curation.py` `STATUS_SUPERSEDED`; PG `curation_proposals_status_check`.
- Evidence: still no code path writes proposal status `superseded` (supersede sets the proposal `approved`, the old record `superseded`).
- Why it matters: harmless future-reader trap, already dispositioned P4a-T9.
- Required disposition: informational.

### F-3 [info] T2 loser leaves no durable binding — identical retry of the losing operation re-derives the 409 deterministically
- Where: `PostgresCurationStore.commit_disposition` (raise inside the transaction rolls back the binding row); in-memory `apply_curation` never runs.
- Evidence: PG test `test_T2_second_approval…` re-disposes the losing proposal under a new operation (200 reject); I verified the raise precedes any journaled mutation in both backends, so a 409 commit is side-effect-free and the same request replays to the same 409 — no partial state, no idempotency hole.
- Why it matters: confirms the T2 design is clean, not a new gap.
- Required disposition: informational.

**Verdict rationale:** all eight triage rows are behaviorally in place and verified by re-run probes; the two ratified identity amendments (`shard_plane.py`, `ingress/models.py`) are additive, mirrored at recompute, and loud on misuse; suite and PG counts match the brief exactly. The sole residual is an evidence gap on T6 (code correct, test and comment not), which is not an exploitable defect, fail-open, leak, laundering path, or data loss.
