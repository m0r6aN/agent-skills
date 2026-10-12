# OPMEM-P0 — Event, feedback and fixture contract (AC5 + AC6)

**Parcel:** OPMEM-P0 · **Evidence base:** `source-baseline.md`, `canon-authority-map.md`, `memory-boundary-contract.md`
**Rule:** every fixture below is a deterministic expectation keyed to pinned function versions. Where the current models lack a field, this contract names the **required versioned extension** instead of silently overloading an existing field. Gravity mathematics is not changed by this document (D12); any change would be an owner amendment (see `open-decisions.md`).

## 1. Event taxonomy (frozen vocabulary)

Six semantic dimensions, recorded as distinct typed events over the spine. Status: schema-level contract for P2/P3; no such events exist at the pinned revisions (see `canon-authority-map.md` §4.4).

| Event | Meaning | Never means | Minimum fields |
|---|---|---|---|
| `access` | A record was delivered into an agent context | that it was read, useful, or applied | `event_id`, `memory_id`, `delivery_id`, `role_id`, `generation_id`, `session_id`, `occurred_at`, `recall_event_id` (from P2) |
| `consideration` | The agent evaluated the record and it was irrelevant/not applicable | that the record is false | `access_ref`, `disposition: not_applicable \| considered_rejected`, `context_ref` |
| `application` | The record materially informed a proposal/action | that the action succeeded | `access_ref`, `target_ref` (proposal/action id), `attribution: self_reported \| supported`, `evidence_ref?` |
| `outcome` | An observed result of an executed action | that unexecuted branches failed, or that an unobserved result was a failure | `target_ref`, `status` (frozen vocabulary below), `evidence_ref`/`receipt_ref`, `observed_at` |
| `non_applicability` | Context-scoped non-applicability | global invalidity | `access_ref`, `context_ref`, `reason` |
| `correction` / `supersession` | New append-only record with lineage to the corrected record | deletion of history (INV-1) | `corrects_ref`, `new_content_ref`, `reason`, `approved_by?` |

`outcome.status` vocabulary is frozen (R0 F-9): `success`, `failure`, `unknown`, `not_executed`. `unknown` = the action executed but its result was never observed (e.g., agent crash mid-action); `not_executed` = nothing ran (denied, avoided, or unselected branch). Fabricating `failure` for an unobserved result is forbidden — unobserved results record `unknown`, and denied/unexecuted actions record `not_executed` or no outcome record at all (§5 F-4/F-6/F-11).

Also defined, orthogonal to the six: `feedback` (links an outcome back to a specific `access`/`memory`/`task` with its own time + idempotency identity), and `delib_*`/`inherit_` cognitive records (never receipts, INV-5).

**Required versioned extensions to existing models (not applied by P0):**

- `SpineEvent.kind` (`gravity/contracts.py:24-33`) currently treats **every non-`Recall` kind as an occurrence** of `memory_id`. Under this contract `feedback`, `correction`, `non_applicability`, and `consideration` events are **not content occurrences**. **Election (R0 F-7; versioned by T-9):** the required mechanism is a versioned extension of `gravity/contracts.py` — an explicit `is_content_occurrence` classification on the event, served as scorer version **`gravity/1.1.0`** (own function hash covering the classification-table version; `gravity/1.0.0` is preserved byte-for-byte for replay — §7 G-9) **without changing the four forces** (see §2). This extension is the **sole** occurrence-classification authority; a separate `kind→force` mapping table is rejected because the pinned `SpineEvent` docstring ("any other `kind` counts as an occurrence") remains live behavior for every consumer of the history view unless amended, and a table in `projection.py` would silently diverge from it — two conflicting occurrence authorities. `gravity/contracts.py` is declared UPDATE in P3's Allowed Files, alongside NEW `gravity/function_v1_1.py` and UPDATE `gravity/function.py` (version dispatch only). Every event kind is classified explicitly: **`access`** is the content occurrence; **`consideration`, `non_applicability`, `correction`, `supersession`, `feedback`, `application`, `outcome`** are **not** content occurrences (`application` references an `access`/`target_ref` and may create association edges per §7 — never occurrences; `outcome` records observed results). Under OD-10 report-only, 1.1.0 changes classification only — no new numeric rule. This is the plan's explicit hazard ("Feedback events must not accidentally count as new content occurrences merely because an existing history adapter treats every non-Recall event as occurrence") and it is confirmed real at the pin.
- `IMemory`/`GravityScore` carry no feedback dimension; feedback must never be folded into `occurrence`/`recall` counts without an approved scoring version.
- `MemoryPromotionRequest.approval_receipt_ref` already exists; the promotion fixture set in §5 depends on it.

## 2. Reinforcement, duplicates and self-report (D11)

1. **Access counts once per delivery identity** (§3) toward `recall` force via the durable recall event — **one delivery ⇒ exactly one recall event**, however many times the briefing is re-rendered or retried. Re-delivery of the same briefing, retry of an undelivered item, and internal candidate reads are **not** new recalls (plan §6).
2. **Feedback never becomes occurrence.** A feedback event may only influence the approved, versioned utility/trust rule (currently: none approved — so feedback is recorded and displayed, and changes **no** score). Any future rule needs its own approval + replay fixtures (OD-10).
3. **Self-reported vs supported attribution is preserved on the event** (`attribution` field). Self-report may not escalate to `supported` without `evidence_ref` whose verification path does not consult cognitive records.
4. **Duplicate resistance:** repeated fetches of the same record by the same task, repeated self-reports of usefulness, and correlated repeats from one root event are counted as one influence for scoring purposes. Independent evidence = distinct root `target_ref` with distinct observed outcome.
5. **Retries must not multiply reinforcement:** a redelivery after lost ack reuses the original `delivery_id`/operation id; it adds no `access` count.
6. **Missing feedback is unknown** (null, not 0). `non_applicability` is context-scoped. Neither may decrease a memory's standing; only positive approved rules may change scores, and none are approved today.

## 3. Delivery identity (frozen definition — D10/plan §6)

A **delivery** is identified by the tuple: `(tenant_id, profile_id, role_id, generation_id, session_id, briefing_or_capture_kind, content_set_hash, event_time_window)`. Frozen component semantics (ruling 2026-10-12, OD-18 in `open-decisions.md` §B):

- `event_time_window` is **anchored at first delivery**: it is the window opened when this content set is first delivered under this tuple, frozen at that anchor. It is never a wall-clock re-render time — re-rendering an already-delivered briefing opens no new window and mints no new tuple.
- `session_id` is the **logical session** of the task context. Pi lifecycle events — **resume, fork, reload, compaction** — do not mint a new `session_id` for delivery-identity purposes: a resumed/forked/reloaded/compacted continuation of the same task context keeps the same logical session id. Only a genuinely new task context (an unrelated new session start) is a new `session_id`.
- Fork refinement: a fork continuing the same task context with the same content set keeps the same delivery identity; a fork delivering a different content selection is a new delivery (new `content_set_hash`).

Consequences:

- Same tuple re-rendered (resume, compaction replay, reload) = **same delivery** → no new recall event, no new `access`.
- A new context window with new content selection = new delivery → one recall event per genuinely new authorized recall.
- One delivery ⇒ exactly one recall event (§2 rule 1; fixtures F-8, G-7; O-4 for the retry path).
- Capture checkpoints: writes happen at meaningful checkpoints (task start/transition/compaction/resume/decision/shutdown), never per message/tool result. Exactly one capture event per checkpoint per kind.

## 4. Explicit-time semantics (INV-4)

- `Timestamp` = integer UTC seconds since epoch; all scoring inputs pass time explicitly; no `now()` in scoring paths (evidence: `gravity/contracts.py` module rules; `forces.py` purity).
- Every fixture pins `as_of` and event times literally. Recency uses `delta = max(0, as_of − last_occurrence)` (`forces.recency_force`).
- Epoch refs are deterministic (`epoch_day_ref`, UTC-midnight DAY boundary); recorded on scores (`computed_at_epoch`).
- Local wall-clock timezone never enters identity, ordering, or scoring.

## 5. Governance / branch evidence contract (plan §5 — four orthogonal dimensions)

Recorded separately, never collapsed into one scalar:

1. **Memory influence** — which recalled records were considered/applied to which proposal/action/branch; `attribution: self_reported|supported` visible.
2. **Governance disposition** — authoritative decision/receipt references (`rcpt_*`), allowed/denied/conditional where the real contract supports it, policy identity/version/hash (`ReviewerVerdict.doctrine_name/version/hash` shape), scope, reason, supersession/applicability.
3. **Execution/outcome** — whether anything actually ran and what was observed; an allowed action is not success; a denied action has **no** outcome record (not a fabricated failure).
4. **Cognitive branch selection** — `BranchRecord(branch_id, description, survived, pruned_rationale)`, chronology, judge identity + criteria version when available (`ReviewerVerdict`), selected and non-selected branches, `DissentEntry(agent_id, position, preserved_rationale)`, and outcome links **only** for branches actually exercised.

Fixture ruling table (AC6 — all seven plan scenarios plus boundary cases):

| # | Scenario | Required fixture expectation |
|---|---|---|
| F-1 | Correct memory informed a policy-**denied** action | Denial preserved with policy identity + applicability; memory keeps its factual standing; **no** negative utility to any influencing record; outcome dimension = `not_executed` |
| F-2 | Remembered prior denial helped avoid a prohibited proposal | `application` with `target_ref`=avoided proposal; attributable usefulness preserved; **no** execution receipt exists or is created |
| F-3 | Incorrect/outdated memory contributed to a **denied** proposal | Correction record appended with lineage; attribution recorded; trust/utility unchanged until an approved rule exists (OD-10); denial reason remains the policy, not the memory |
| F-4 | Denial caused by infrastructure/quota, not content | Disposition reason = infra/quota class; **no** correctness penalty; memory remains applicable |
| F-5 | Judge selected branch A, not B | Both branches preserved with rationale/dissent; selection is a cognitive decision (`BranchRecord.survived`); **no** correctness value assigned to A; B is `unobserved` |
| F-6 | Branch A executed and failed; B never executed | A gets an observed `outcome(failure)`; B stays counterfactual/unobserved — never an invented success and never a fabricated failure (`unknown`/`not_executed` only, §1 status vocabulary) |
| F-7 | Old denial under superseded policy | Historical validity and current applicability recorded separately (`correction/supersession` lineage); old denial not rewritten (INV-1) |
| F-8 | Same memory delivered under one delivery identity (§3), re-rendered across resume/compaction within one logical session and retried once after a lost ack | One `access`, one recall event; extra renderings and the retry add nothing. (Three distinct logical sessions would be three deliveries and three recall events — §3 tuple.) |
| F-9 | Feedback event arrives for an existing memory | No occurrence increment; no score change (no approved rule); feedback linked to the specific `access`/`outcome` |
| F-10 | Self-reported usefulness ×10 by one agent on one task | Capped as one correlated influence; `attribution=self_reported` |
| F-11 | Deliberation record exists for an action that was denied | `delib_*` present; receipt verification ignores it; the denial preserves its **governance decision receipt + tool-terminal outcome receipt** (`terminal_status=denied`, null execution receipt — T-10); **no action-execution receipt and no observed action outcome**; tool result reports `not_executed` |
| F-12 | Derived summary of 3 ancestral records | `distilled_refs` each naming its `source_refs`; summary carries epistemic status; cannot be promoted `active/primary` without `approval_receipt_ref` (inheritance rule 3/5) |

No fixture converts cognitive choice into a receipt or a penalty by itself (AC6 constraint).

## 6. Recall/briefing budget (D10)

- Initial briefing target ≈ **1,000 tokens**, configurable per role.
- **Tokenizer rule (proposed, OD-8):** the tokenizer is the deployed model's own count from the harness when available; fallback is a pinned deterministic approximation (UTF-8 bytes/4 rounded up), recorded on the delivery so token claims are reproducible. Measurement must count **added context** (briefing + labeled recalled material), not network response size.
- Acceptance threshold (proposed): briefing must stay within the configured budget in ≥95% of deliveries over the pilot; every overrun is recorded with reason (large-record policy) rather than silently truncated.
- Large records: summarized via lineage-preserving derived record or omitted with explicit reason — never silently truncated into a different claim (plan §4).
- Retrieval is bounded: `limit` + `min_weight` + scope; recall never replaces the system prompt; recalled material is labeled contextual data (D8).

## 7. Decay / association / replay fixtures (D12)

Pinned function identity: fixtures run against the served scorer **`gravity/1.1.0`** (T-9), function hash recorded at P3 from `gravity/function_v1_1.py` (the `GravityScore` contract already requires `gravity_function_hash`; fixtures fill it from the pinned file, never invent one). `gravity/1.0.0` (`gravity/function.py`) is preserved byte-for-byte for replay — G-9 re-scores 1.0.0 history under the recorded 1.0.0 pin. G-6/G-10/G-11 run against the **served scorer path**, not just classification helpers.

| Fixture | Input (literal) | Expectation |
|---|---|---|
| G-1 recency decay | `as_of − last = 0, 1d, 7d, 30d`, `λ` pinned at P3 | `e^(−λ·Δ)` exactly; monotone non-increasing |
| G-2 occurrence saturation | solo counts `0,1,2,10,100`, `saturation` pinned | `clamp01(log1p(w)/log1p(sat))`; never >1; 0 ⇒ 0 |
| G-3 co-occurrence weighting | same totals via solo vs co-occurrence | co-occurrence weighted by `co_weight<1` |
| G-4 association decay | equal-count pairs, one old (30d), one fresh | fresh pair pull strictly greater ("beach" property, `decayed_pull`) |
| G-5 hop discount | equal direct vs 2-hop pull | indirect contributes strictly less (`hop_discount<1`) |
| G-6 feedback non-occurrence | feedback event on memory | `occurrence` force identical to pre-feedback value |
| G-7 duplicate delivery | same delivery re-rendered ×3 | one recall event; `recall` force +1 total, not +3 |
| G-8 replay determinism | fixed event history + `as_of` | byte-identical score dicts across runs/machines; every score records version+hash+epoch |
| G-9 old-version replay | history scored under `gravity/1.0.0` | re-scoring under any later version must reproduce 1.0.0 outputs with the recorded pin (backward replay) |
| G-10 co-delivery ⇒ no association (R0 F-4) | two records delivered together in one briefing ×N, never co-applied | `association` force identical to a never-co-delivered baseline; no association edge recorded |
| G-11 feedback-class score-neutrality (R0 F-8) | `consideration`, `non_applicability`, `correction` events appended against a memory | every force identical to the pre-event values (these kinds are not content occurrences — §1 election); no score change |
| G-12 missing-feedback stability (R0 F-8) | a delivered memory with zero feedback events, scored at two `as_of` points | forces evolve only per G-1…G-5; missing feedback subtracts nothing (null, not 0 — §2 rule 6) |

**Event → association-edge classification (frozen, D12 — no math change; R0 F-4).** Which event pairs create association edges is frozen by this table, and only by this table:

| Event pair class | Creates association pull? |
|---|---|
| Co-delivery (two records delivered in the same briefing) | **Never** |
| Co-recall (two records returned under the same recall event) | **Never** |
| Co-consideration / co-non_applicability | **Never** |
| Correction/supersession lineage pairs | **Never** (that is lineage, not association) |
| Co-application — `application` events naming the same executed `target_ref` | Yes — the sole association-creating class |

The pinned `decayed_pull` helper counts "shared (co-occurrence/**co-recall**) events" (`forces.py:66-83`); that default is **overridden only by this classification table** — P3's projection feeds it edges solely from the co-application class. The four-force math itself is unchanged (any change is an owner amendment).

Four forces only: `occurrence`, `recall`, `recency`, `association` (`GravityScore.to_dict()` shape). Adding or renaming a force is a frozen-contract amendment (stop condition).

## 8. Delivery/commit boundary fixtures (operational, pairs with AC7)

- O-1 crash before local outbox commit ⇒ nothing sent, nothing claimed.
- O-2 crash after local commit before send ⇒ entry survives restart; sends exactly the frozen identity.
- O-3 crash after send before ack ⇒ `indeterminate`; reconciliation by key; never reissued under a new identity; never counted as delivered success until resolved.
- O-4 lost ack resolved to server-side duplicate ⇒ adapter records `duplicate`, no second delivery event.
- O-5 grant revoked between enqueue and flush ⇒ flush refused with terminal reason; queued item is not re-scoped to a newer grant.
- O-6 poison payload (schema-invalid after bounded retries) ⇒ quarantine with reason; capacity accounting includes quarantined items.
- O-7 role/profile switch with pending work ⇒ pending items keep original role/profile identity; new items use the current grant.
- O-8 status-surface honesty (R0 F-8, D13): queued, sent-unacknowledged, or `indeterminate` work is never displayed or reported as saved/committed; only an authoritative server ack resolves to saved.
- O-9 cache-served recall accounting (R0 F-8, D17): a future cache-served recall (served from a local/edge cache rather than a fresh backend fetch) is still a delivery — it is accounted as a durable recall event under the §3 delivery identity before results return; caching never skips accounting and never double-counts a re-render of the same delivery. Execution may use a deterministic test double for the future cache layer (T-14); the fixture is mandatory and may not disappear through an undocumented applicability exemption.

## 9. Negative fixture set (security/scope; complements N-1…N-7 in `memory-boundary-contract.md` §4.4)

- N-8 a `role`/`tenant` field smuggled in tool arguments cannot alter identity.
- N-9 recalled content cannot widen tool authority, set policy, or name paths/URLs to dereference (label `untrusted_data_not_instructions` enforced).
- N-10 (extended T-8) a cross-tenant row or mixed-tenant response is never returned (fail closed) — executed **through the real client→handler→adapter path**: mixed-tenant rows and foreign exact-ID responses are rejected by the Gateway handler (missing or foreign backend ownership ⇒ fail-closed **error**, never a silent drop, never caller-synthesized ownership — boundary §2.3 Response) and by the adapter's scope echo.
- N-11 a recall response without `recall_event_id` fails closed (bridge gate).
- N-12 feedback cannot be replayed with a new idempotency key to multiply influence.
- N-13 (re-scoped T-3) an unknown or revoked evidence signing key makes `verify` fail — Ed25519 governed signing (`_evidence_signing_key`, Cortex-owned; I7). Epoch proofs/closure are deferred (OD-19) and are not part of this fixture.
- N-14 transport-header identity spoofing (R0 F-1): client-supplied `X-Keon-Tenant-Id`/`X-Keon-Actor-Id` headers never override authenticated claims; under JWT a header↔claim mismatch fails closed (`MCP_TENANT_MISMATCH`); under API-key/machine credentials a client-asserted actor is never copied into the principal (boundary §4.1 rule 6).
- N-15 machine-credential actor spoofing (R0 F-1): a machine credential (D6) presenting an actor/role outside its enrollment binding fails closed at the Gateway before any Cortex call; the forged actor never reaches `X-Actor-Id` / `Provenance.agent_id` / `_request_hash` (boundary §2.3 Auth).
- N-16 cross-tenant ingress-event read (R0 F-2; extended T-7): `GET /mcp/admin/ingress/{correlationId}` never returns another tenant's receipt rows — the ingress-spine query is tenant-predicated and foreign or absent tenant context fails closed; cases: **empty-SQL fallback read**, **SQLite-unavailable fallback read**, and **mixed-tenant correlation-id collision** (caller-controlled correlation id reused across tenants) all fail closed; every persisted ingress event carries tenant identity and every fallback response is tenant-filtered; legacy/unbound rows are not returned (seam: boundary §2.1; owner: P1a).
- N-17 oversized content at the Gateway boundary (R0 F-5): a write exceeding the Gateway content bound is rejected before any Cortex call (boundary §6 input-size/URI row; owner: P5a).
- N-18 non-allowlisted URI schemes at the Gateway boundary (R0 F-5): a `source_uri`/`artifact_uri` outside the allowlist (https/urn) is rejected before any Cortex call — the adapter-side check is not the only enforcement point (owner: P5a).
- N-19 local configuration cannot widen grants (R0 F-8): local config naming broader tenants/projects/roles/capabilities than the server-side grant is never honored — flush fails closed under the original server grant (boundary §4.2, D2).

## 10. Frozen boundaries of this document

- No numerical gravity/feedback rule is approved here; §7 fixtures pin **shapes and determinism**, with parameters frozen at P3 under its own approval (OD-10).
- Fixtures are contract expectations, not executed tests. Execution belongs to P2/P3/P9 with their own evidence.
- The four-force taxonomy, historical replay, and INV-1…INV-6 are preserved unchanged.
