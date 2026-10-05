-- FK-P9 amendment A1e (2026-09-29): events.kind vocabulary CHECK +
-- projection-cursor registry CHECK (FK-P11 T12 predecessors, folded).
--
-- Item 2 — events.kind vocabulary extension (FK-P11 OQ-3: "The
-- import.recorded/import.epoch event kinds extend FK-P10 T8's closed
-- vocabulary. Proposed route: a recorded FK-P9 amendment carrying the
-- FK-P10-class semantics ruling (A1 precedent) ... whether an events.kind CHECK
-- migration is wanted alongside" — this dispatch confirms the route and the
-- CHECK): T8's seven closed kinds (lease.claimed, lease.takeover,
-- lease.renewed, lease.released, transition.requested, transition.applied,
-- transition.rejected) plus import.recorded and import.epoch. Defense-in-depth
-- parity with A1a/A1b; out-of-vocab legacy rows refuse fail-closed (vocabulary
-- mapping is FK-P11/owner semantics, never silently rewritten).
--
-- Item 1 — projection-cursor registrations (FK-P10 OQ-4 / FK-P11 T7: "never a
-- silent grab"; "The runtime registry is the closed set above"): the closed
-- registry is encoded directly as a CHECK on projection_cursors.projection_id
-- (goal-state RESERVED for FK-P10 per its T7/OQ-4 ruling; md-goals-index and
-- md-goal-ledger registered for FK-P11 per this amendment). No registration
-- table is needed — the closed set IS the registration, and additional cursor
-- ids arrive exactly as this one did: a recorded FK-P9 amendment extending the
-- CHECK, never a silent namespace grab.
--
-- Both targets are rebuilt through SQLite's documented ALTER TABLE procedure
-- (the migration machinery's 12-step wrapper: enforcement off across the
-- transaction, pre-commit PRAGMA foreign_key_check gate, enforcement
-- restored). events is rebuilt with its append-only triggers recreated under
-- their original names and its AUTOINCREMENT / UNIQUE shapes preserved.

CREATE TABLE events_v2 (
  event_seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  goal_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  principal_ref TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  recorded_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_events_kind CHECK (kind IN ('lease.claimed', 'lease.takeover', 'lease.renewed', 'lease.released', 'transition.requested', 'transition.applied', 'transition.rejected', 'import.recorded', 'import.epoch')),
  CONSTRAINT ck_events_payload_len CHECK (length(payload) <= 65536),
  CONSTRAINT ck_events_recorded CHECK (recorded_at_micros >= 0),
  CONSTRAINT fk_events_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

INSERT INTO events_v2 (event_seq, event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
  SELECT event_seq, event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros FROM events;

DROP TABLE events;

ALTER TABLE events_v2 RENAME TO events;

CREATE TRIGGER events_no_update BEFORE UPDATE ON events
BEGIN
  SELECT RAISE(ABORT, 'events_append_only');
END;

CREATE TRIGGER events_no_delete BEFORE DELETE ON events
BEGIN
  SELECT RAISE(ABORT, 'events_append_only');
END;

-- The A2 lookup-bound index (created on the pre-rebuild events table by 0002)
-- is recreated on the rebuilt table.
CREATE INDEX events_goal_operation_idx ON events (goal_id, operation_id);

CREATE TABLE projection_cursors_v2 (
  projection_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT,
  last_applied_event_seq INTEGER NOT NULL,
  updated_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_projection_registered CHECK (projection_id IN ('goal-state', 'md-goals-index', 'md-goal-ledger')),
  CONSTRAINT ck_cursor_seq CHECK (last_applied_event_seq >= 0),
  CONSTRAINT fk_cursor_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

INSERT INTO projection_cursors_v2 (projection_id, goal_id, last_applied_event_seq, updated_at_micros)
  SELECT projection_id, goal_id, last_applied_event_seq, updated_at_micros FROM projection_cursors;

DROP TABLE projection_cursors;

ALTER TABLE projection_cursors_v2 RENAME TO projection_cursors
