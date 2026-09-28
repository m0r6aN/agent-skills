# `@foreman-line/kernel-lease` (FK-P10 — lease and transition engine)

Trusted lease time, CAS optimistic revisions, P1-S09 idempotency binding,
transactional state/event/cursor updates, and the closed goal-status transition
machine on the merged FK-P9 substrate (`@foreman-line/kernel-state`, consumed
through `file:../kernel-state` — this package's **sole** cross-package import).

Scope honesty (D13): this engine decides lease/revision/idempotency/transition
semantics only. It claims **no** enforcement, promotion, containment, gate
verification, `authorizeAction` behavior, restart-reconstruction proof,
split-brain refusal proof at the deployed boundary (FK-P15's stranded fragment),
and no INF baseline assembly. The crash and concurrency suites are **in-suite
real-process-boundary evidence only** — never the FK-P15 clean-room proof. The
INF-6 contention records feed the deferred INF-6 baseline (FK-P21's stranded
row) and nothing more.

## Engine semantics (T1–T11)

- **Trusted time (T5):** every lease-time decision reads the injected FK-P9
  `Clock` seam exactly once per operation through `TrustedClock`. No exported
  parameter carries a caller timestamp or absolute expiry. Regression refuses
  `CLOCK_REGRESSION`, malformed readings refuse `CLOCK_UNTRUSTED`; the engine
  never proceeds on untrusted time. Expiry is stamped and compared in absolute
  shared micros; monotonic spans (`elapsedMicros`) are for measurement only.
- **Single-writer + CAS (T4/T7):** at most one active (unreleased) lease per
  goal (substrate `leases_single_active` + takeover stamping under a guarded
  update). Every effectful operation carries `expectedRevision`; a mismatch is
  `STATE_REVISION_STALE`, never a silent write. Every accepted effectful
  operation bumps `goals.revision` by exactly one and appends exactly one event
  (risk (d) ruled design).
- **Idempotency (T6, P1-S09 literal):** the binding is the operation identity.
  Same key + same `payloadDigest`, completed → the recorded `EffectResult`
  VERBATIM with `replay: true` and asserted zero event/revision/cursor deltas.
  Same key + different `payloadDigest` → `IDEMPOTENCY_CONFLICT` regardless of
  completion state. An incomplete (`completed_at_micros` NULL) binding refuses
  `IDEMPOTENCY_IN_FLIGHT`. Refused operations record no binding.
- **Replay-verbatim (risk (c)):** the event payload embeds the `EffectResult`
  document **minus** its `effectDigest` member (F01: embedded values are never
  retagged or recomputed); `effectDigest` is bound to the event row's
  `payload_digest` and supplied from the row at replay. By construction
  `events.payload_digest` = `EffectResult.effectDigest` =
  `idempotency_keys.effect_digest`.
- **Human gates (D9):** gate satisfaction is never writable state. Reserved
  `gate.*`/`human.*` literals and gate-shaped input fields refuse
  `GATE_STATE_NOT_WRITABLE`; gate edges L4/L6 refuse without at least one
  well-formed in-set `GitGateEvidenceRef` (`GATE_EVIDENCE_REQUIRED`); supplied
  refs are bound into the recorded event so satisfaction is derivable from
  evidence. **AC6 residual (normative): well-formed-but-fabricated refs pass
  P10's shape gate BY DESIGN; genuineness derives downstream (FK-P12/deferred)
  and is never claimed here.** Evidence-kind policy: the T2 allow-sets are the
  closed ceiling; consumers may NARROW per edge at engine construction, never
  widen (a wider policy refuses `ENGINE_ARGUMENT_INVALID`).
- **State machine (T1/T2):** five statuses (`proposed`, `active`,
  `awaiting-human`, `completed`, `cancelled`); the exhaustive 25-edge product
  lives in `src/state-machine.ts` — 7 legal (L1–L7; L4/L6 gate-dependent), 18
  illegal (X01–X18), each illegal edge its own hostile fixture row.
- **Transactions (T7):** every effectful operation writes exactly one FK-P9
  `withTransaction` covering event + state (+ transition + lease + binding +
  cursor). The reserved `goal-state` projection cursor (OQ-4) advances to the
  appended `event_seq` in the same transaction. A transition toward
  `awaiting-human` carries the F05.8 `stop-report-emission` obligation record
  (T2 L3).
- **`wakeup_handoffs`:** no semantics beyond the preserved FK-P9 column shape
  (OQ-7) — the orphan-semantics gap stays named for the exit annex.

## First-failure order (pinned; precedence tests assert it)

1. Structural input (`ENGINE_ARGUMENT_INVALID`; reserved gate literals/fields →
   `GATE_STATE_NOT_WRITABLE`; status-literal vocabulary →
   `TRANSITION_STATUS_UNKNOWN`)
2. Idempotency (replay / `IDEMPOTENCY_CONFLICT` / `IDEMPOTENCY_IN_FLIGHT`)
3. Trusted clock (`CLOCK_REGRESSION` / `CLOCK_UNTRUSTED`)
4. Goal (`GOAL_ABSENT` / `GOAL_STATUS_UNKNOWN` / `GOAL_TERMINAL` where applicable)
5. Lease state (`LEASE_HELD` / `LEASE_NOT_ACTIVE` / `LEASE_NOT_OWNER` /
   `LEASE_EXPIRED`)
6. CAS (`STATE_REVISION_STALE`) — every effectful path, including the claim-noop
   binding write
7. Transition + gate (`TRANSITION_*` / `ILLEGAL_TRANSITION` /
   `GATE_EVIDENCE_REQUIRED`)
8. Write set (T7)

## Recorded implementation residuals (documented, not claimed away)

1. **NOOP replay under-determination (T6 vs T7).** T7's `claim (no-op)`
   transaction records the binding row only (no event — T8 has no NOOP event
   kind). A completed-NOOP binding therefore replays `code`/`decision`/
   `effectDigest`/`idempotencyKey` verbatim from that row while `goalRevision`
   and the result payload are re-derived from current state — identical to the
   recorded values while the goal is unchanged since the NOOP (the common case).
   Flagged for coordinator ruling (a binding-row extension would close it).
2. **Lease `cas_revision` refresh (T4 invariant vs T7 row lists).** T4 states
   `leases.cas_revision` is "refreshed on renew and on every state write made
   under the lease"; T7's request/decide-reject/release rows omit the
   `updateLeaseRow` refresh line. The implementation honors the T4 invariant
   (one guarded `updateLeaseRow` per lease-bound op that bumps the revision), so
   `LeaseCasDescriptor.casRevision` always equals the post-bump goal revision.
3. **Event/transition ids are engine-derived** (deterministic `evt-`/`tr-` ids
   hashed from goal + kind + the binding) — callers never supply them.

## Measurement (INF-6, records only)

`npm run measure-contention` races 4 racer processes × 50 attempts × 1 goal × 3
repeats through the real engine and emits `evidence/contention.jsonl` +
`evidence/contention-summary.json`. Records carry closed literals and numbers
only (no free text crosses the emission boundary). The summary records the
banned-claim scan result and states that the records feed the deferred INF-6
baseline. **No baseline, bottleneck, cost, or comparative claim is made or
implied.** Below-minimum populations refuse the measurement claim
(`MEASUREMENT_INCOMPLETE`) while retaining the records.

## Verification chain

Environment prerequisite (FK-P17 pattern — real SQLite substrate with its
native binding, real child processes, real FK-P1 golden fixtures):
`npm ci` in `../kernel-state`, then `npm ci` here (lockfile unchanged). Then:
`node -v` (>=22) → `npm run typecheck` → `npm test` (112 fixture records: 94
hostile / 10 controls / 8 canonical; real child-process kills at
asserted-reached fault points; real multi-process races with exact asserted
interleavings) → `npm run lint` → `npm run measure-contention`.
