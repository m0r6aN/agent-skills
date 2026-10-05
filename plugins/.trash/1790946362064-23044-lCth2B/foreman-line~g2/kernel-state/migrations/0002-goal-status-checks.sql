-- FK-P9 amendment A1/A2 (2026-09-28): closes goals.status to the ruled
-- five-value vocabulary (FK-P10 OQ-1 ruling: proposed, active, awaiting-human,
-- completed, cancelled — kebab spelling) and adds the A2 lookup-bound
-- events(goal_id, operation_id) index (FK-P10 OQ-8 — performance-only, not
-- correctness-blocking).
--
-- A1 rebuilds goals through SQLite's documented ALTER TABLE procedure: the
-- migration machinery runs each migration with foreign-key enforcement off
-- across its transaction (restored immediately after) and gates the commit on
-- PRAGMA foreign_key_check, so the rebuild stays transactional and fail-closed.

CREATE TABLE goals_v2 (
  goal_id TEXT NOT NULL PRIMARY KEY,
  revision INTEGER NOT NULL,
  status TEXT NOT NULL,
  pending_transition_id TEXT,
  updated_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_goals_revision CHECK (revision >= 0),
  CONSTRAINT ck_goals_status CHECK (status IN ('proposed', 'active', 'awaiting-human', 'completed', 'cancelled')),
  CONSTRAINT ck_goals_updated CHECK (updated_at_micros >= 0),
  CONSTRAINT fk_goals_pending_transition FOREIGN KEY (pending_transition_id) REFERENCES transitions (transition_id)
);

INSERT INTO goals_v2 (goal_id, revision, status, pending_transition_id, updated_at_micros)
  SELECT goal_id, revision, status, pending_transition_id, updated_at_micros FROM goals;

DROP TABLE goals;

ALTER TABLE goals_v2 RENAME TO goals;

CREATE INDEX events_goal_operation_idx ON events (goal_id, operation_id)
