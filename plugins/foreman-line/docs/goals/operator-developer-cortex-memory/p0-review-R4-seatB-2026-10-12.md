# OPMEM-P0 review R4 (closing verification) — Seat B (adversarial security)

**Reviewed commit:** `80ba7294` deliverables. **Route:** `openai/gpt-6.1-sol (--thinking high)`, read-only tools. **Cost:** USD 0.2060. Verbatim output follows.

---

## VERDICT: APPROVE-WITH-FIXES
## T-ROW VERIFICATION
T-28: ENCODED
T-29: ENCODED
T-30: ENCODED
T-31: ENCODED
T-32: ENCODED
T-33: PARTIAL (owners, delivered-subset accounting, and omission semantics are encoded; the canonical Gateway event mapping still omits `access` and its per-record idempotency exception)
T-34: ENCODED
## FINDINGS
[minor] Access-ingest mapping remains inconsistent — `memory-boundary-contract.md:52` versus `event-and-fixture-contract.md:21` and `follow-on-parcel-manifests.md:85` — T-33 requires kind `access`, idempotent per `(operation_id, record_id)`, but the canonical mapping enumerates only the other event kinds and specifies idempotency by `operation_id` alone. A literal Gateway implementation could reject delivered-subset reports or conflate reports for different records. Add `access` and its explicit idempotency exception to the mapping — carry-forward to P5a shaping
