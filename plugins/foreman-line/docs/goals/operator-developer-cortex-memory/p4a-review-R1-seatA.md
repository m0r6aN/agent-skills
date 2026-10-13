# p4a-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 1 failed, 2443 passed, 133 skipped (fail = tests/temporal/test_benchmark.py::TestBenchReceiptEmitOverhead::test_receipt_overhead_bounded[50], known flaky timing test)
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider "tests/temporal/test_benchmark.py::...test_receipt_overhead_bounded[50]"  (rerun)
  → 1 passed
KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/inheritance/test_curation_postgres.py tests/test_gravity_postgres.py tests/test_recall_postgres.py -q -p no:cacheprovider
  → 16 passed
black --check (all 12 changed files) → 12 files would be left unchanged
isort --check-only (all 12 changed files) → exit 0
```
Matches the brief's expected head counts (2443/133 + the flaky benchmark; PG 16 passed).

## FINDINGS

### F-1 [major] Self-approval check binds the full (actor, role, profile) triple — the same actor under a different role can approve its own proposal
- Where: `src/keon/cortex/services/curation.py` ~1272–1282 (`submit_disposition`); test `tests/inheritance/test_curation_http.py::test_proposer_may_not_approve_own_proposal` (only exercises same-triple and different-actor cases).
- Evidence: the refusal fires only when `caller.actor_id == proposal.actor_id AND caller.role_id == proposal.role_id AND caller.profile_id == proposal.profile_id`. Since the proposal is only visible in its own profile, the sole varying component is `role_id`: an actor operating under two roles in the same profile (legitimate multi-role Gateway deployment) who holds `cap:curation.approve` can propose as `role_a` and approve as `role_b`. No test covers same-actor/different-role.
- Why it matters: self-approval is the explicit anti-laundering backstop of ruling 3; the triple conjunction is the weakest possible binding of "the proposer". An agent with the capability can launder its own content into `profile_shared`/`handoff` without any independent disposer. OD-23's provisional cap limits (but does not eliminate) the authority gained.
- Required disposition: fix in rework (tighten to `caller.actor_id == proposal.actor_id`; the existing different-actor/same-role test remains green) — or obtain an explicit owner ruling that "proposer" is the triple.

### F-2 [minor] Handoff derived-record identity omits the target role — identical content to two targets permanently collides
- Where: `src/keon/cortex/services/curation.py` ~1398–1420 (`make_scoped_candidate_shard_id(... scope_class="handoff" ...)` — no `handoff_to_role_id` input); `src/keon/cortex/ingress/models.py` 7-key payload; `spine/shard_plane.py` recompute.
- Evidence: two handoff proposals by the same author role with the same content addressed to `role_b` and `role_c` derive the same `derived_shard_id`; the engine's `documents.get(derived_shard_id) is not None` pre-check makes the second approval a permanent 409 ("derived artifact already exists"). Visibility, however, is keyed on `extra["handoff_to_role_id"]` — identity and visibility disagree about what distinguishes two handoffs.
- Why it matters: fail-closed (no overwrite, no leak — verified), but T-23 identity cannot represent a legitimate fan-out handoff, and the recompute/visibility asymmetry is a latent trap for future surfaces.
- Required disposition: carry-forward to P4b/P5a (fold the target role into the scoped-id payload for the `handoff` class, with a ratified identity amendment).

### F-3 [minor] TOCTOU on the derived-exists pre-check can silently rewrite an approved artifact's approval provenance
- Where: `src/keon/cortex/services/curation.py` ~1409–1418 (unlocked `documents.get` pre-check) vs. the later `commit_disposition` upsert; same shape in `PostgresCurationStore.commit_disposition` (`document_store.upsert`).
- Evidence: two concurrent approvals of two distinct proposals with identical content+scope both pass the pre-check (all durable keys — binding, disposition id, event id — are distinct, so both commits succeed); the second upsert overwrites the derived record's `provenance.extra` (`proposal_id`, `disposition_id`, `approval_receipt_id`) with the later disposition's values. The Observation is deterministic/idempotent, so no scoring double-count (verified).
- Why it matters: the artifact's recorded approval trail (which receipt/disposition authorized it) is last-writer-wins — an append-only/INV-1 spirit violation on provenance, though both writers held the capability and a receipt, so no authority is gained.
- Required disposition: carry-forward to P4b (move the exists-check inside the atomic commit, or make the derived shard insert conflict-detecting rather than upsert).

### F-4 [minor] Supersession hygiene: no status or scope-compatibility check on the superseded target
- Where: `src/keon/cortex/services/curation.py` ~1370–1395 (`ACTION_SUPERSEDE` target validation).
- Evidence: the old record must be a visible curated artifact (`profile_shared`/`handoff` with `curation_kind`), but (a) its current status is not checked — an already-`superseded` artifact can be superseded again by a different proposal, producing two `InheritanceEvent`s naming different `superseded_by` replacements for the same record (ambiguous replacement chain); (b) a `handoff` artifact may be "superseded" by a `profile_shared` lesson and vice versa (no class-compat check).
- Why it matters: INV-1 is respected (nothing deleted; demotion to non-primary verified in `test_supersede_replaces_the_old_artifact`), but the replacement relation can become ambiguous or cross-scope, which downstream lineage/replay consumers will have to disambiguate.
- Required disposition: carry-forward to P4b (refuse supersede when the target is not `active`, and require target-class compatibility, subject to a coordinator ruling).

### F-5 [info] Ratified S0-4 `shard_plane.py` amendment is safe
- Where: `src/keon/cortex/spine/shard_plane.py` `recompute_shard_id` (one additive `SCOPE_CLASS_HANDOFF` allowlist entry).
- Evidence: the recompute reproduces exactly the derivation used at curation time (same 7-key payload, author role/profile/`handoff` class); it changes identity *recomputation* only — visibility is enforced independently by `is_record_visible` on every read surface (exact-ID/lineage/evidence at `api.py` 1797/1830/1882, search 1294/1305, replay 1945, recall `spine/recall_service.py` 231/323, memory-events `services/memory_events.py` 1125 — all route through the single `tenancy/scope.py` predicate; handoff fails closed for non-target/non-author/operator/cross-profile per `test_handoff_*` matrix). Handoff records only ever come from the approval path (served ingest hardcodes `SCOPE_CLASS_ROLE_PRIVATE` and server-constructed `extra`, so a client cannot mint a fake handoff stamp). Without the entry, every handoff artifact would fail replay/INV-2 recall eligibility.
- Why it matters: confirms the out-of-manifest edit widens nothing; it is required for correctness and leak-neutral.
- Required disposition: informational (amendment safe to ratify).

### F-6 [info] Reject is capability-free for any same-profile role, and dispositions reveal proposal state in-profile
- Where: `src/keon/cortex/services/curation.py` `_require_capability` (approve/supersede only) + `_require_proposal_visible` (profile match only); `test_proposer_may_withdraw_by_rejecting` (grants="").
- Evidence: any role in the proposal's profile, holding no grants, may reject any pending proposal (one disposition per proposal); 404 vs 409 responses let same-profile roles probe proposal state. Mitigated: the proposer can re-propose under a new operation id (new proposal id), proposal ids are hashes, and nothing crosses profile or tenant (verified: other-profile and other-tenant both 404).
- Why it matters: a mild in-profile curation-DoS/metadata-disclosure surface, consistent with a literal reading of ruling 3 (cap gates approval only).
- Required disposition: informational (flag to coordinator; a reject-authorization ruling could land with P5a's Gateway half).

### F-7 [info] Dead proposal-status vocabulary `superseded`
- Where: `src/keon/cortex/services/curation.py` `STATUS_SUPERSEDED`; `providers/postgres/schema.py` `curation_proposals_status_check`.
- Evidence: supersede dispositions set the proposal to `approved` and mark the OLD RECORD `superseded`; no code path writes proposal status `superseded`.
- Why it matters: harmless (additive DDL, never reachable), but the vocabulary suggests a transition that does not exist — a future-reader trap.
- Required disposition: informational.

**Verdict rationale:** rulings 1–6 and S0-1…S0-4 are faithfully encoded: raw visibility stays exactly P1b (generation never a key — `effective_scopes`/`record_scope` ignore it); handoff visibility fails closed on all seven read surfaces including the operator profile; `handoff:` grants are implicit-own-role-only with loud N-19 rejection of foreign grants; `cap:curation.approve` is grant-only and full-string validated (T-35/T-36, `re.fullmatch`); `validate_inheritance_event` gates every approve/supersede fail-closed (422, nothing written — verified atomically in both durability modes); OD-23 caps everything at `provisional`/`promotion_level="proposed"` with the receipt recorded explicitly unverified; bindings are 6-tuple-keyed with byte-identical replay, 409 on fingerprint change, and current re-authorization; the in-memory bundle is journaled all-or-nothing with the documented lock order and no `api.py` private-field access; evidence is through the served pipeline and fixture edits are the two ratified mechanical ones. The single major (F-1 self-approval conjunction) is a one-line tightening.
