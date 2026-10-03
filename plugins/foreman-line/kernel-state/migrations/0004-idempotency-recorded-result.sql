-- FK-P9 amendment A1d (2026-09-28): recorded-result persistence for completed
-- idempotency bindings (ruling on FK-P10 review finding F2).
--
-- FK-P10 T6 requires completed same-key bindings to replay their recorded
-- EffectResult VERBATIM ("the original EffectResult (same code, decision,
-- effectDigest, goalRevision as originally recorded) with replay: true"), but
-- T7 forbids persisting NOOP events ("claim (no-op) | insertIdempotencyKey
-- only (completed, effect_digest null)"), so a completed NOOP binding has no
-- recorded bytes to replay from. RULING: fix at the substrate — persist the
-- recorded result's canonical bytes with the binding at completion time (both
-- APPLIED and NOOP completions store their result) — never weaken T6.
--
-- LIGHTER PATH (recorded per the amendment brief): `idempotency_keys` is not
-- foreign-key-referenced and `recorded_result` is a NULL-able BLOB, so a pure
-- additive ALTER TABLE ADD COLUMN suffices — no table rebuild / 12-step
-- cycle. The established migration wrapper still runs this in one BEGIN
-- IMMEDIATE with the ledger insert and the pre-commit foreign_key_check gate.

ALTER TABLE idempotency_keys ADD COLUMN recorded_result BLOB
