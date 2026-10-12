# OPMEM-P0 review R4 (closing verification) — Seat A (architecture)

**Reviewed commit:** `80ba7294` deliverables. **Route:** `anthropic/claude-fable-5 (--thinking medium)`, read-only tools. **Cost:** USD 1.1331. Verbatim output follows.

---

## VERDICT: APPROVE

## T-ROW VERIFICATION
- T-28: ENCODED — `memory-boundary-contract.md` §2.1 carries the full ruling (separately enrolled `keon:mcp:admin:ingress` bound to a named human/admin principal; never implied by `keon:mcp:list`/machine credentials/role bindings/operator grants; audit-logged; 403); N-16 in event §9 gains the T-28 authorization extension with both refusal cases on SQL + fallback + legacy rows; P1a verification names the N-16 T-28 cases; OD §G row present. Spot-checked pin: `keon:mcp:list`-only authorization confirmed at `Program.cs:224`.
- T-29: ENCODED — event §3 defines `task_id` (Pi-supplied logical task identity, defaults to logical `session_id` per OD-18, advisory-never-authorization) and adds it to the frozen delivery tuple; event §1 `access` minimum fields carry `task_id`; boundary §2.3 adds `X-Keon-Task-Id` to the T-1 carriage set; P1a `CortexClient.cs` annotation and P2 seam (persists `task_id`) both present; OD §G row present.
- T-30: ENCODED — P1b verification now names only the N-20 visibility half (scope columns + fail-closed reads — T-30) and P2 verification names the two-records half (T-23/T-30); OD §G row present.
- T-31: ENCODED — `tests/tenancy/__init__.py` is in P1b Allowed Files (NEW, rework 4) and the standing packaging rule sits in the manifests rules section (line 14); OD §G row present.
- T-32: ENCODED — §2.2 `verify_memory.v1` row now maps to `keon.cortex.evidence.get.v1` + `keon.cortex.evidence.verify.v1` → `POST /v1/evidence/verify` (P4b) with the exact request `{shard_id | evidence_pack}` and ack `{verified, key_id, key_state active/revoked/unknown, reason}`, fail closed, N-13 executes here; P5a gains NEW `CortexEvidenceVerifyHandler.cs` and the seam names it; OD §G row present.
- T-33: ENCODED — event §1 carries the full ownership paragraph (P2 server-side per-record delivery rows at selection; P3 adapter-reported `delivered` subset via `memory.event.v1` kind `access`, idempotent per `(operation_id, record_id)`; `access_omitted` with reason never counted); P3 seam names the delivered-subset ingestion; pilot §3 S-3/S-6 denominators annotated "delivered subset — T-33"; OD §G row present. F-8's one-access/one-recall distinction remains testable.
- T-34: ENCODED — event §2 rule 3 carries the fail-closed default verbatim (every outcome/attribution event `self_reported`; `approved` never → `completed`, with the pin evidence `IngressSpine.cs:431/:443`; no event `supported`) without disturbing the adjacent T-27 resolution rule; OD-22 recorded in §B with the carry-forward disposition; P5a seam carries the T-34 shaping checklist including all three required fixtures (`decide_only`, completed-failure-reported-as-success, valid-receipt-replayed-against-another-target/profile); OD §G row present.

## FINDINGS
1. [minor] Stale pin locator in the T-28 encoding — `memory-boundary-contract.md` §2.1 ("the pin authorization at `Program.cs:223`") — at the pinned Gateway source the `keon:mcp:list` authorization is at `Program.cs:224` (line 223 is the tool-name assignment); harmless off-by-one, but contract locators should match the pin builders will grep — carry-forward to P1a shaping.

No broken neighbouring text found: T-27's rule 3 text, N-16's T-7 cases, the OD-18 delivery-tuple semantics, the §2.2 evidence rows, and the pilot §3 metric table all read coherently around the rework-4 insertions.
