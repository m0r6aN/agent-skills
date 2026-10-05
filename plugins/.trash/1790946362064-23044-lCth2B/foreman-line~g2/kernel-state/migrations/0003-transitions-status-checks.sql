-- FK-P9 amendment A1b (2026-09-28): DB-level CHECK on transitions.status
-- encoding the T1 closed vocabulary taken VERBATIM from FK-P10's
-- lease-transition-engine spec T-tables (T1 heading: "Goal status vocabulary
-- (closed; FK-P10-owned; `goals.status` / `transitions.status` values)";
-- the A1b request block: "the same DB-level CHECK pattern for
-- `transitions.status`, its vocabulary taken verbatim from this spec's
-- T-tables ... `transitions.status` keeps substrate enforcement for
-- defense-in-depth parity"). Same five values as A1a: proposed, active,
-- awaiting-human, completed, cancelled.
--
-- transitions is foreign-key-referenced (goals.pending_transition_id), so the
-- rebuild follows the same documented ALTER TABLE procedure as 0002: the
-- migration machinery runs each migration with enforcement off across its
-- transaction, gates the commit on PRAGMA foreign_key_check, and restores
-- enforcement after.

CREATE TABLE transitions_v2 (
  transition_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  created_at_micros INTEGER NOT NULL,
  decided_at_micros INTEGER,
  CONSTRAINT ck_transitions_created CHECK (created_at_micros >= 0),
  CONSTRAINT ck_transitions_status CHECK (status IN ('proposed', 'active', 'awaiting-human', 'completed', 'cancelled')),
  CONSTRAINT fk_transitions_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

INSERT INTO transitions_v2 (transition_id, goal_id, status, requested_by, operation_id, payload_digest, created_at_micros, decided_at_micros)
  SELECT transition_id, goal_id, status, requested_by, operation_id, payload_digest, created_at_micros, decided_at_micros FROM transitions;

DROP TABLE transitions;

ALTER TABLE transitions_v2 RENAME TO transitions
