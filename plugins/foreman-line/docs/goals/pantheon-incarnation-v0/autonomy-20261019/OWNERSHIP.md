# Custody reconciliation and succession

## Exact lineage

| Session | Meaning and current evidence |
|---|---|
| Pi `01a14d11-b88a-70f8-8971-76c25d51c2e2` | Older Keon readiness/GTM session, not Pantheon custody. Monitor state reports verified host/Pi exit at 2026-10-18T15:34:14.244Z. `monitor-native-pi-coordinator/automation.toml` is PAUSED. Do not resume or adopt it. |
| Pi `01a14fa6-c85a-7075-b3aa-27046da8c191` | Original Pantheon owner, owner-terminated. Historical charter header is frozen and not current custody. |
| Pi `01a151ad-3cea-70cf-9dfc-233a9da3dd00` | Recorded owner under RESUME-002. Saved file has 216 records, mtime 2026-10-19T02:03:47.147Z, final assistant `stopReason=stop`. Watch state reports former Node PID 46040 exited, no observed processes; last observation 2026-10-19T12:34:24.1059304Z. These observations alone did not release custody under the old rule. |
| Pi `01a15394-c2de-7421-b86d-4615bf1ec7d6` | RESUME-003 verified evidence at 2026-10-19T09:59:10Z and explicitly stopped pending succession. Never assumed ownership. |
| Codex `01a15424-1fd5-77a2-a73a-d92a60a5de34` | Current planning custodian under the user's directive. Proposed execution successor upon OM-PAN-001 ratification; no concurrent operational ownership claimed now. |

The newer `watch-pantheon-pi-coordinator` automation remains ACTIVE against `01a151ad-3cea-70cf-9dfc-233a9da3dd00`. It is a watcher, not ownership authority. On ratification, pause that stale-target watcher and record the reason through the supported automation tool; do not change the already paused older monitor or send unsolicited messages to unrelated chats. Do not terminate or attach to existing Claude/Grok processes.

## One-time initial transfer

Ratification explicitly releases/revokes the retained pre-parcel custody of `01a151ad-3cea-70cf-9dfc-233a9da3dd00` and authorizes the current full Codex session as successor. No separate acknowledgement from a dead process is required. Append the owner message reference and transfer event; inventory pending attempt claims first. Preserve the original consumed review and USD 5 uncertainty. If an actual still-running worker/effect is discovered, quarantine it and reconcile rather than issuing duplicate work.

Until the transactional service is installed, bootstrap uses a goal-scoped exclusive local process lock plus append-only event file and an explicit owner grant. This is single-host bootstrap custody only, not the deployed fencing proof. No distributed coordinator or general worker dispatch is allowed through that transitional lock. Runtime-controlled operation begins only after lease/admission acceptance.

## Durable mechanism

Reuse `kernel-state` SQLite events/goals/artifacts/leases/idempotency/cursors and `kernel-lease` CAS/trusted-clock interfaces. The service, not a language model, owns the DB and its transaction lock. Use WAL/full-sync on local disk, a single service writer, file ACLs, schema migrations and retained backups with startup integrity checks. B never opens the SQLite file over SSH/NFS/SMB. The schema is an implementation detail of the service; Cortex receives memory projections, never lease-write authority.

Proposed lease: 120 seconds, renewal every 30 seconds, stop starting effects with <30 seconds remaining. Trusted service UTC plus monotonic in-process elapsed time; backward clock movement or unverifiable elapsed time holds admission. Fields: goal ID, mandate hash/version, full owner session ID, host ID, lease ID, monotonically increasing epoch, expiry, CAS revision, last event sequence and revocation state. Every launch, provider call, tool request, merge and closure checks the current epoch and scope at the receiving broker.

Acquire after release/expiry in one transaction; increment epoch and append succession event before returning the new lease. A stale coordinator may keep thinking, but cannot spend, launch, mutate the authoritative tree or merge. A long in-flight provider call cannot be unsent on expiry: retain its attempt and reservation; the successor collects its result or records unknown outcome. It does not regenerate the request. Owned local worker effect channels close immediately on revocation, and the supervisor terminates the local worker within five seconds.

Resume algorithm: verify DB health and mandate authenticity/expiry → CAS acquire → load events/cursor → reconcile Docker workers, Git heads, provider attempt states and outbox → adopt completed evidence without rerun → hold ambiguous effects → emit one resume record → proceed with ready queue rows. Do not replay external sends from an outbox unless the consumer contract supplies idempotency and a matching status query. Exactly-once effect is not inferred from exactly-once local insert.

Completion events carry job/attempt/epoch IDs and a result-manifest hash, are authenticated, durable and deduplicated. Use supported native completion notifications or a supervised event stream; heartbeat/reconciliation every 60 seconds is a fallback, not transcript polling. A sleeping chat is not a scheduler. The bounded supervisor/wakeup adapter owns liveness and persists its last cursor. Never inject terminal keystrokes or rewrite another session's JSONL.

## Failure prevented and acceptance

| Failure | Automatic response | Required evidence |
|---|---|---|
| Two live coordinators | CAS grants one lease; broker rejects stale epoch | Race test across two processes and live stale-launch denial |
| Owner crashes mid-review | Durable `sending/unknown` attempt survives; new owner collects only | Crash after send, no second POST, retained liability |
| Machine B disconnects | Lease/effect token expires; A retains authority | Disconnected worker cannot create new effects; late completion deduped |
| Cortex unavailable | Queue memory outbox; use transactional state for custody | Resume still correct; later memory projection delivered once |
| DB lost/corrupt/rollback ambiguity | Hold effects, verify recovery provenance | No “empty DB means fresh budget” path |
| Stale mandate or revoked owner | Deny new effects and preserve evidence | Bound decision rejected even if Markdown still says authorized |

These are scoped trusted-administrator crash/fencing guarantees. Malicious host administrator resistance, cross-region consensus and rollback-proof hardware custody are not claimed by this development proof.
