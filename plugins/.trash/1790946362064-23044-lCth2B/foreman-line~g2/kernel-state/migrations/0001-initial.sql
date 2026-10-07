-- FK-P9 substrate schema, version 1. Substrate mechanics and DB-level
-- constraints only (defense in depth); semantics of leases, idempotency,
-- transitions, and projections belong to FK-P10/FK-P11.
-- No non-transactional statements appear in any packaged migration.

CREATE TABLE schema_migrations (
  version INTEGER NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  digest TEXT NOT NULL,
  applied_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_schema_migrations_version CHECK (version >= 1),
  CONSTRAINT ck_schema_migrations_name CHECK (length(name) BETWEEN 1 AND 128),
  CONSTRAINT ck_schema_migrations_digest CHECK (length(digest) = 71),
  CONSTRAINT ck_schema_migrations_applied CHECK (applied_at_micros >= 0)
);

CREATE TRIGGER schema_migrations_no_update BEFORE UPDATE ON schema_migrations
BEGIN
  SELECT RAISE(ABORT, 'schema_migrations_append_only');
END;

CREATE TRIGGER schema_migrations_no_delete BEFORE DELETE ON schema_migrations
BEGIN
  SELECT RAISE(ABORT, 'schema_migrations_append_only');
END;

CREATE TABLE goals (
  goal_id TEXT NOT NULL PRIMARY KEY,
  revision INTEGER NOT NULL,
  status TEXT NOT NULL,
  pending_transition_id TEXT,
  updated_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_goals_revision CHECK (revision >= 0),
  CONSTRAINT ck_goals_updated CHECK (updated_at_micros >= 0),
  CONSTRAINT fk_goals_pending_transition
    FOREIGN KEY (pending_transition_id) REFERENCES transitions (transition_id)
);

CREATE TABLE events (
  event_seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  goal_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  principal_ref TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  recorded_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_events_payload_len CHECK (length(payload) <= 65536),
  CONSTRAINT ck_events_recorded CHECK (recorded_at_micros >= 0),
  CONSTRAINT fk_events_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

CREATE TRIGGER events_no_update BEFORE UPDATE ON events
BEGIN
  SELECT RAISE(ABORT, 'events_append_only');
END;

CREATE TRIGGER events_no_delete BEFORE DELETE ON events
BEGIN
  SELECT RAISE(ABORT, 'events_append_only');
END;

CREATE TABLE transitions (
  transition_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  created_at_micros INTEGER NOT NULL,
  decided_at_micros INTEGER,
  CONSTRAINT ck_transitions_created CHECK (created_at_micros >= 0),
  CONSTRAINT fk_transitions_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

CREATE TABLE leases (
  lease_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT NOT NULL,
  owner_principal_ref TEXT NOT NULL,
  cas_revision INTEGER NOT NULL,
  acquired_at_micros INTEGER NOT NULL,
  expires_at_micros INTEGER,
  released_at_micros INTEGER,
  CONSTRAINT ck_lease_cas CHECK (cas_revision >= 0),
  CONSTRAINT fk_lease_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

CREATE UNIQUE INDEX leases_single_active ON leases (goal_id)
WHERE released_at_micros IS NULL;

CREATE TABLE idempotency_keys (
  principal_ref TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  repository_ref TEXT NOT NULL,
  worktree_ref TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  effect_digest TEXT,
  recorded_at_micros INTEGER NOT NULL,
  completed_at_micros INTEGER,
  PRIMARY KEY (principal_ref, operation_id, repository_ref, worktree_ref)
);

CREATE TABLE artifacts (
  artifact_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT,
  kind TEXT NOT NULL,
  digest TEXT NOT NULL,
  locator TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  recorded_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_artifact_locator_len CHECK (length(locator) <= 4096),
  CONSTRAINT fk_artifact_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

CREATE TABLE projection_cursors (
  projection_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT,
  last_applied_event_seq INTEGER NOT NULL,
  updated_at_micros INTEGER NOT NULL,
  CONSTRAINT ck_cursor_seq CHECK (last_applied_event_seq >= 0),
  CONSTRAINT fk_cursor_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);

CREATE TABLE wakeup_handoffs (
  wakeup_id TEXT NOT NULL PRIMARY KEY,
  goal_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  from_session_ref TEXT NOT NULL,
  to_session_ref TEXT,
  created_at_micros INTEGER NOT NULL,
  consumed_at_micros INTEGER,
  CONSTRAINT ck_wakeup_kind CHECK (kind IN ('wakeup', 'handoff')),
  CONSTRAINT fk_wakeup_goal FOREIGN KEY (goal_id) REFERENCES goals (goal_id)
);
