---
ticket: FK-P10
title: Foreman Kernel - lease and transition engine
status: done
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/kernel-lease/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P10 — Lease and transition engine

## Intent

Build the lease + transition engine package that owns the operational-state semantics
layer on the merged FK-P9 substrate: trusted lease time from an injected clock seam,
CAS optimistic revisions with conflict detection, principal/operation/idempotency
binding in the FK-P1 shapes verbatim (P1-S09 semantics: same key/different payload
conflicts, same completed binding returns the recorded result without repeating
effects), single-transaction event/state/cursor updates under single-writer leases,
and the closed goal-status transition machine whose human-gate edges are
evidence-derived per D9 and never ordinary state writes. The parcel also carries real
process-boundary crash/concurrency tests — genuine child-process kills mid-transition
and real multi-process racers with asserted interleavings (the FK-P9 CONC-03 lesson) —
and the INF-6 contention measurement fragment at record level only. The spec claims no
dispatch, no enforcement, no gate verification, and no FK-P15 recovery proof.

## Constraints

### Dependency and dispatch boundary

**Status: draft — not dispatchable.** Dispatch requires (1) coordinator lint of this
spec (charter §15.3; SPEC-CONVENTION §3) and (2) Step-0 restate-and-stop confirmed by
the coordinator. No spec text here claims dispatch.

**Dependencies (exact):**
- **FK-P9 (merged) — real package dependency.** FK-P10 consumes the merged
  `@foreman-line/kernel-state` package at `plugins/foreman-line/kernel-state/` through
  `file:../kernel-state`, integrity-pinned in this package's own lockfile. Only the
  documented exports (open/transaction/row/clock/error surfaces) are used; every call
  is wrapped in typed try-catch rethrown as FK-P10's own `EngineError` (standing
  constraint #1). FK-P10 never edits `kernel-state/**` — schema needs arrive as
  recorded FK-P9-owned amendments (FK-P9 OQ-5 ruling), never direct edits. The
  verification chain asserts `kernel-state/**` and `kernel-contracts/**` are
  byte-unchanged (pre/post digests).
- **FK-P1 (merged) — contract-only.** FK-P10 binds FK-P1's recorded shapes verbatim,
  one home each (F05.1 bounds `Id`/`Digest`/`SafeInt`/`Micros`/`Bytes<N>`;
  F05.4 `IdempotencyBinding` tuple `principalRef`, `operationId`, `repositoryRef`,
  `worktreeRef`, `payloadDigest`; F05.4 `LeaseCasDescriptor` fields `leaseId`,
  `leaseOwnerPrincipalRef`, `casRevision`, `leaseExpiresAtMicros`, all keys required;
  F05.4 `GitGateEvidenceRef` fields `evidenceKind`, `gitIdentity`, `digest`; F05.5
  digest literal `sha256:` + 64 lowercase hex and the canonical-JSON byte rules;
  F05.10 safe-diagnostic discipline; F05.11 `EffectResult` fields `resultKind`
  (literal `effect-result`), `apiVersion` (literal `0.1.0`), `toolVersion`
  (Bytes<128> ASCII), `decision` (APPLIED|NOOP), `code` (EFFECT_APPLIED|EFFECT_NOOP),
  `idempotencyKey`, `effectDigest` (Digest or null), `goalRevision`; F05.12 literals
  `IDEMPOTENCY_CONFLICT` and `STATE_REVISION_STALE`). This is a dependency on
  recorded contract text, **not** a package import: `kernel-contracts/**` is never
  imported and never written (FK-P9 OQ-4 pattern); its golden fixtures are read-only
  conformance test input only.
- **NOT FK-P11, FK-P12, FK-P13.** Import/projection (FK-P11), `authorizeAction` and
  gate-evidence genuineness (FK-P12), and the admission-protected control catalog
  (FK-P13) are consumers of this engine's exported surface. Their algorithms are not
  built here.
- **No spec-grammar pin.** FK-P10 parses no spec bodies and consumes no
  SPEC-CONVENTION grammar; the SPEC-CONVENTION citation is identity-only and is
  carried under the three-state known-base rule (Context & References).

**Out of this parcel's dispatch preconditions:** any window on `dispatch/**`,
`routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, or `skill-injection/**`
(RS-2.4 — FK-P10 writes none of them). No contested seam is touched.

Isolated builder branch and worktree are assigned at dispatch from a verified base SHA
(charter §15.3 identity/environment rows). Standing constraints apply:
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — #1 (typed errors at
every substrate/clock/process boundary), #2 (substrate rows are `unknown` until
normalized; engine validates the status vocabulary defensively on every read), #3
(default-deny: every structural invariant tested independently), #19 (linear-time
parsing of event payloads and measurement records at decode), #30 (one test per
invalid shape), #31 (sanitize external text before JSONL/record emission), #32
(failing-when-broken mutation tests per named invariant), #34 (no shipped byte-pins of
moving files; fixture bytes and spec-level pins only).

### Package and version rules

Propose private ESM package **`@foreman-line/kernel-lease`** at
**`plugins/foreman-line/kernel-lease/`**, version/API `0.1.0`, Node >=22 (observed
pinned runtime 24.7.0), TypeScript sources, biome lint config, own
`package-lock.json`, no root/workspace manifest registration, no shared lockfile
alteration (FK-P1/FK-P2/FK-P9 pattern). **Location justification:** sibling FK-owned
packages use kebab-case top-level directories under `plugins/foreman-line/`
(`kernel-contracts`, `kernel-state`, `spec-body-compiler`, `spec-linter`,
`mutation-scope-guard`, `schema-scaffold`); `kernel-lease/` is a new FK-owned,
non-contested top-level directory outside every contested seam (`dispatch/`,
`routing-policy/`, `mutation-scope-guard/`, `hooks/`, `skill-injection/`) and outside
FK-P1's `kernel-contracts/`, FK-P2's `spec-body-compiler/`, and FK-P9's
`kernel-state/`. The name follows the `kernel-*` family and names the
concurrency-authority core (D14 single-writer leases); the README scopes the full
lease/transition/idempotency engine. Cross-package imports: **exactly one** —
`@foreman-line/kernel-state` (plus Node built-ins). Unknown fields, unknown enum
values, missing required data, and over-limit input fail closed (FK-P1 F05.1 wire
discipline). The only two sanctioned external reads of sibling packages are the
FK-P9 substrate at runtime and the FK-P1 golden fixtures at test time (read-only,
digest-checked by the conformance test, never written).

### Engine semantics discipline (summary; tables carry the normative detail)

1. **Substrate, not storage.** FK-P10 decides lease/revision/idempotency/transition
   semantics; it never decides storage mechanics (open, migrations, WAL, busy policy,
   backup, export — FK-P9). All writes compose FK-P9's `withTransaction` +
   parameter-bound row primitives; there is no second transaction primitive and no
   raw SQL in this package.
2. **Trusted time.** Every lease-time decision (grant, expiry check, renewal
   extension, takeover stamping) reads time exactly once per operation through the
   injected clock seam wrapped by FK-P10's `TrustedClock` (T5). No API accepts a
   caller-supplied timestamp, duration origin, or `now`; no ambient time read exists
   in the package. Regression or malformed readings refuse (CLOCK_REGRESSION /
   CLOCK_UNTRUSTED), never proceed.
3. **Single-writer + CAS.** At most one active (unreleased) lease per goal
   (substrate partial unique index + engine takeover stamping). Every effectful
   operation carries `expectedRevision` and is compare-and-set guarded against
   `goals.revision`; mismatch is `STATE_REVISION_STALE` (F05.12 literal, decision
   CONFLICT) — never a silent overwrite. Every accepted effectful operation bumps
   `goals.revision` by exactly one and appends exactly one event (T7).
4. **Binding.** Every effectful operation carries an FK-P1 `IdempotencyBinding`
   verbatim; the tuple is the `idempotency_keys` composite primary key. Accepted
   operations (including no-op outcomes) record exactly one completed binding row in
   the same transaction; refused operations record nothing. P1-S09 semantics hold
   verbatim (T6).
5. **Evidence-derived human gate (D9).** Human-gate satisfaction is never writable
   operational state: there is no gate column, no gate status value, no gate write
   API, and gate-satisfaction-shaped input is refused (`GATE_STATE_NOT_WRITABLE`).
   The two gate-dependent edges (T2 L4/L6) refuse without at least one well-formed
   FK-P1 `GitGateEvidenceRef` (`GATE_EVIDENCE_REQUIRED`); supplied refs are bound
   into the recorded event so satisfaction is derivable from evidence, never
   asserted. Whether refs are genuine/sufficient is derived downstream
   (FK-P11 projection / FK-P12 policy / FK-P15 proof) and is **never claimed here**.
6. **D13 honesty rules (normative; mechanically tested).** (a) No artifact, event,
   evidence record, or spec claim asserts enforcement, promotion, containment,
   gate verification, `authorizeAction` behavior, restart-reconstruction proof,
   split-brain refusal proof at the deployment boundary (FK-P15's stranded clean-room
   fragment per RS-2.2/exit annex), or any INF baseline assembly (INF-6 rows are
   records only; INF-1/2/3/4/7/8 residual rows stay NOT satisfied). (b) Crash and
   concurrency tests are in-suite evidence at a real child-process boundary — named
   as such, never described as the FK-P15 clean-room proof. (c) A banned-claim scan
   over all emitted bytes records its result (FK-P17 pattern).

### Pin-integrity rule (normative, FK-P17 lesson 2026-09-28)

Every pin in this spec binds **COMMITTED bytes at the parcel base** (HEAD `7e415e7`,
2026-09-28) unless explicitly classified as a three-state known-base target. Uncommitted
sibling state is never pinnable: where a cited file's worktree copy is dirty, the pin
carries the committed digest and the dirty state is recorded as unpinnable (it may
never silently reproduce the pin). A pin change is a spec amendment (standing
constraint #34), never an in-parcel re-anchor. Line anchors are documentation; symbol
names are the resolution authority.

## Contract tables

### T1 Goal status vocabulary (closed; FK-P10-owned; `goals.status` / `transitions.status` values)

| Status | Meaning | Terminal |
|---|---|---|
| `proposed` | Goal registered (created or FK-P11-imported); not yet admitted for work. Initial state. | no |
| `active` | Admitted for work; state writes occur under a single-writer lease. | no |
| `awaiting-human` | A human-only condition holds (D9); the engine recorded the stop-report/awaiting-human transition (FK-P1 F05.8 `stop-report-emission` obligation shape); no ordinary agent edge leaves this state except withdrawal. | no |
| `completed` | Operational completion only — never gate satisfaction, never merge/closure authority (D5). | yes |
| `cancelled` | Withdrawn. | yes |

**Mapping (coordinator ruling 2026-09-28, OQ-1):** D9's `awaiting_human` stop-report
label maps to the `awaiting-human` goal status — spelling normalized at the record
boundary; the domains are distinct (stop reports vs goal state).

The vocabulary is engine-enforced on every read and write (defense in depth: a row
seeded outside the vocabulary refuses on read with `GOAL_STATUS_UNKNOWN`, fail
closed). Literals in the reserved gate namespace (`gate.*`, `human.*`) are refused
with `GATE_STATE_NOT_WRITABLE`, never treated as ordinary unknown values.

### T2 Transition state machine — exhaustive 25-edge table (legal/illegal)

Mode: **agent** = any admitted caller holding the goal's active lease; **gate** =
requires ≥1 well-formed `GitGateEvidenceRef` bound at decision (D9 evidence-derived;
genuineness derived downstream, never claimed here), whose `evidenceKind` lies in the
edge's closed allow-set (below). All state writes are lease-bound and CAS-guarded
(T4/T7). Edge ids are the fixture identity: each illegal edge is its own hostile
fixture row; each legal edge has a positive control row.

| Edge | From | To | Verdict | Mode | Evidence-kind allow-set (OQ-3) | Name / fixture |
|---|---|---|---|---|---|---|
| L1 | proposed | active | **LEGAL** | agent | — | admit (CTL-01) |
| L2 | proposed | cancelled | **LEGAL** | agent | — | withdraw (CTL-02) |
| L3 | active | awaiting-human | **LEGAL** | agent | — | request-human; emits stop-report record (CTL-03) |
| L4 | active | completed | **LEGAL** | **gate** | {commit-ref, signature, status-check, merge-record} (closed ceiling) | complete (CTL-04 with refs; GTW-05 refuses without) |
| L5 | active | cancelled | **LEGAL** | agent | — | withdraw (CTL-05) |
| L6 | awaiting-human | active | **LEGAL** | **gate** | {commit-ref, signature, status-check, merge-record} (closed ceiling) | resume (CTL-06 with refs; GTW-06 refuses without) |
| L7 | awaiting-human | cancelled | **LEGAL** | agent | — | withdraw (CTL-07) |
| X01 | proposed | proposed | ILLEGAL | — | — | self-loop (TR X01) |
| X02 | proposed | awaiting-human | ILLEGAL | — | — | skipped edge: awaiting-human reachable only from active (X02) |
| X03 | proposed | completed | ILLEGAL | — | — | skipped edge: completion only from active, gate-dependent (X03) |
| X04 | active | active | ILLEGAL | — | — | self-loop (X04) |
| X05 | active | proposed | ILLEGAL | — | — | regression (X05) |
| X06 | awaiting-human | awaiting-human | ILLEGAL | — | — | self-loop (X06) |
| X07 | awaiting-human | proposed | ILLEGAL | — | — | regression (X07) |
| X08 | awaiting-human | completed | ILLEGAL | — | — | skipped edge: completion only from active (X08) |
| X09 | completed | proposed | ILLEGAL | — | — | terminal exit (X09) |
| X10 | completed | active | ILLEGAL | — | — | terminal exit (X10) |
| X11 | completed | awaiting-human | ILLEGAL | — | — | terminal exit (X11) |
| X12 | completed | completed | ILLEGAL | — | — | self-loop on terminal (X12) |
| X13 | completed | cancelled | ILLEGAL | — | — | terminal exit (X13) |
| X14 | cancelled | proposed | ILLEGAL | — | — | terminal exit (X14) |
| X15 | cancelled | active | ILLEGAL | — | — | terminal exit (X15) |
| X16 | cancelled | awaiting-human | ILLEGAL | — | — | terminal exit (X16) |
| X17 | cancelled | completed | ILLEGAL | — | — | terminal exit (X17) |
| X18 | cancelled | cancelled | ILLEGAL | — | — | self-loop on terminal (X18) |

Counts: 7 legal (2 gate-dependent), 18 illegal (5 self-loops, 2 regressions, 3
skipped-edge, 8 terminal exits); 25 edges total = the complete 5×5 product. Any edge
not in the legal set is refused `ILLEGAL_TRANSITION` with the edge ids as the only
safe diagnostic. The edge table is exported as data (`state-machine.ts`) so the
exhaustiveness test and the fixtures bind to one source.

**Evidence-kind policy (coordinator ruling 2026-09-28, OQ-3; closed).** Each gate
edge carries a closed per-edge allow-set drawn from the FK-P1
`GitGateEvidenceRef.evidenceKind` union — the column above is the ceiling. Consumers
may NARROW the allow-set (optional per-edge narrowing at engine construction), never
widen it: a consumer-supplied WIDER policy is refused (`ENGINE_ARGUMENT_INVALID`),
and a ref whose `evidenceKind` falls outside the effective set for its edge is refused
`GATE_EVIDENCE_REQUIRED` (fixtures GTW-11/GTW-12). This closes the
forge-by-loose-policy path at the contract level while genuineness stays downstream.

### T3 Exported engine surface

`createEngine({ storage, clock, toolVersion })` wraps an FK-P9 `Storage` handle and an
injected FK-P9 `Clock` (T5). Effectful operations require the goal's active, unexpired,
principal-owned lease (T4) except `claimLease` itself; reads take no binding and no
CAS. `EngineResult<T> = { resultKind: 'engine-result', operation, effect
(EffectResult, F05.11 verbatim), result: T, replay: boolean }`; refusals throw typed
`EngineError` (T9).

| Export | Kind | Binding required | CAS `expectedRevision` | Result payload |
|---|---|---|---|---|
| `claimLease(engine, { goalId, leaseId, durationMicros, expectedRevision, idempotencyKey })` | effectful | yes | yes | `LeaseCasDescriptor` |
| `renewLease(engine, { goalId, leaseId, durationMicros, expectedRevision, idempotencyKey })` | effectful | yes | yes | `LeaseCasDescriptor` |
| `releaseLease(engine, { goalId, leaseId, expectedRevision, idempotencyKey })` | effectful | yes | yes | `LeaseCasDescriptor` (released) |
| `requestTransition(engine, { goalId, targetStatus, expectedRevision, idempotencyKey })` | effectful | yes | yes | `PendingTransition { transitionId, targetStatus }` |
| `decideTransition(engine, { goalId, transitionId, decision: 'apply' \| 'reject', gateEvidenceRefs, expectedRevision, idempotencyKey })` | effectful | yes | yes | `EffectResult` fields in `effect` |
| `applyTransition(engine, { goalId, targetStatus, gateEvidenceRefs, expectedRevision, idempotencyKey })` | effectful (atomic request+decide in one transaction) | yes | yes | `EffectResult` fields in `effect` |
| `getLeaseCasDescriptor(engine, goalId)` | read | no | no | `LeaseCasDescriptor \| null` (F05.4 shape verbatim — the injected boundary descriptor for FK-P12) |
| `getGoalState(engine, goalId)` | read | no | no | `GoalStateView { goalId, status, revision, pendingTransitionId, lease }` |
| `measureContention(engine, plan)` | measurement (INF-6) | n/a | n/a | contention records (T11 note) |

`idempotencyKey` is the FK-P1 `IdempotencyBinding` verbatim (five required members,
each Id/Digest-shaped per F05.1). `gateEvidenceRefs` is `Array<GitGateEvidenceRef, 64>`
(F05.4 member shapes verbatim); required non-empty on gate edges, optional elsewhere,
always bound into the event when present. `durationMicros` is SafeInt with
`LEASE_DURATION_MIN_MICROS = 1` and named constant
`LEASE_MAX_DURATION_MICROS = 86400000000` (24 h; coordinator ruling 2026-09-28,
OQ-11 — owner policy may amend: a policy change is a recorded FK-P10 spec amendment
bumping this constant, the FK-P2 pin-bump pattern, never a silent tuning step) —
zero, negative, or over-cap refuses `ENGINE_ARGUMENT_INVALID`. `toolVersion`
(constructor) is stamped into every `EffectResult` per F05.11. The constructor also
accepts an optional per-edge evidence-kind narrowing validated against the T2
ceiling — a wider policy is refused (OQ-3).

### T4 Lease semantics (single-writer per D14)

| Operation | Precondition (trusted now = T5 single read) | Effect | Refusal (else) |
|---|---|---|---|
| claim (grant) | goal non-terminal; no active lease; `leaseId` unused; CAS matches | insert lease (`released_at_micros` NULL, `cas_revision` = post-bump revision), `lease.claimed` event | `GOAL_TERMINAL`; `LEASE_HELD` (other's unexpired); `STATE_REVISION_STALE`; `ENGINE_ARGUMENT_INVALID` (duration) |
| claim (takeover) | goal non-terminal; active lease **expired** at trusted now | stamp prior row `released_at_micros` = trusted now via guarded update (released_at IS NULL), insert new lease, `lease.takeover` event — one transaction | `LEASE_HELD` if the prior lease is unexpired or a race winner already stamped it |
| claim (no-op) | caller's own unexpired active lease already held | **no writes**; `effect` decision NOOP / code EFFECT_NOOP, `effectDigest` null; binding row recorded (T6) | — |
| renew | active lease, owner = binding `principalRef`, unexpired at trusted now, CAS matches | `expires_at_micros` = trusted now + `durationMicros`; `cas_revision` refreshed; `lease.renewed` event | `LEASE_NOT_ACTIVE` (reason `absent`\|`released`); `LEASE_NOT_OWNER`; `LEASE_EXPIRED`; `STATE_REVISION_STALE` |
| release | active lease, owner, unexpired at trusted now, CAS matches | `released_at_micros` = trusted now (guarded); `lease.released` event | `LEASE_NOT_ACTIVE`; `LEASE_NOT_OWNER`; `LEASE_EXPIRED`; `STATE_REVISION_STALE` |
| state write (request/decide/apply) | active lease, owner, unexpired, CAS matches | per T7 | `LEASE_NOT_ACTIVE`; `LEASE_NOT_OWNER`; `LEASE_EXPIRED`; `STATE_REVISION_STALE` |
| reads | none | none | `GOAL_ABSENT` / `GOAL_STATUS_UNKNOWN` (defense in depth) |

An expired lease is **unusable in every direction** (renew, release, state write all
refuse `LEASE_EXPIRED`); cleanup happens only through takeover stamping inside a
successful claim, which is what keeps the substrate partial unique index
(`leases_single_active`) and the engine consistent. `leases.cas_revision` always equals
the goal revision as of the lease's last successful lease-bound operation (refreshed
on renew and on every state write made under the lease, T7).

### T5 Trusted clock rules

| Rule | Behavior |
|---|---|
| Source | Only the injected FK-P9 `Clock` seam (`kernel-state/src/clock.ts` discipline: no ambient reads). Production injects `systemClock()` (the single ambient reader, FK-P9-owned); tests inject `fixedClock`. |
| `TrustedClock` wrapper | `nowMicros()`: one read per operation; readings must be nonnegative safe integers and **non-decreasing across the engine instance**. Regression → `CLOCK_REGRESSION`; malformed (negative / non-integer / unsafe) → `CLOCK_UNTRUSTED`. Both refuse the operation; never proceed on untrusted time. |
| Duration measurement | `elapsedMicros(startMono)` uses a monotonic source (`process.hrtime.bigint()` converted to µs) and is only ever used for measurement spans (T11), never for lease expiry. |
| Absolute vs monotonic | Lease expiry is stamped and compared in **absolute shared micros** (multi-process comparability); monotonicity is enforced per engine instance. Cross-process clock skew is an environment property recorded in contention evidence (T11), never hidden and never compensated by policy invented here. |
| Caller lies | No exported parameter carries a timestamp, `now`, or absolute expiry (`expires_at_micros` is always computed as trusted now + duration). Any request field named/used as a time source is unknown-field input → `ENGINE_ARGUMENT_INVALID` (hostile CLK-05/06 assert the API accepts none). |

### T6 Idempotency semantics (P1-S09 verbatim; `idempotency_keys` composite PK)

**Binding scope (coordinator ruling 2026-09-28, OQ-5).** FK-P1 F05.4's transition-only
rule scopes the `authorizeAction` input's `trustedBindings` (bindings MUST be null on
non-state-bound authorization requests); all six engine operations are state-bound
effectful operations, so uniform binding is REQUIRED-eligible and D17-consistent.

| Situation | Outcome |
|---|---|
| First accepted call | Exactly one completed binding row in the same transaction as the effect (`effect_digest` = event `payload_digest` for APPLIED, null for NOOP); one event; revision +1; cursor advanced. |
| Same key (all five members), same `payloadDigest`, completed | **Returns the recorded result verbatim** — the original `EffectResult` (same `code`, `decision`, `effectDigest`, `goalRevision` as originally recorded) with `replay: true`; **zero** new events, **zero** revision change, **zero** cursor movement, no repeated effects (asserted row-count/revision/cursor deltas). |
| Same key, different `payloadDigest` | `IDEMPOTENCY_CONFLICT` (F05.12 literal; decision CONFLICT; safe diagnostic = binding ids only) — **regardless of completion state**. |
| Same key, `completed_at_micros` NULL (never written by FK-P10; seeded only by fixtures) | `IDEMPOTENCY_IN_FLIGHT` — fail closed; the engine never re-executes an incomplete binding. |
| Binding structurally invalid (missing/malformed member) | `ENGINE_ARGUMENT_INVALID` (default-deny per member, #30). |
| Refused operation | No binding row is recorded (a refusal is not an effect); retries may legitimately succeed after conditions change. |

Recorded-result reconstruction: the event payload embeds the `EffectResult` document
**minus** its `effectDigest` member (F01 rule: embedded values are never retagged or
recomputed); `effectDigest` is bound to the event row's `payload_digest` and supplied
from the row at replay. `goalRevision` in a replayed result is the revision as
originally recorded, never the current revision. **NOOP assignment (OQ-6):** P1
deliberately left `EFFECT_NOOP` unassigned; FK-P10 owns the assignment above
(same-principal re-claim only), and FK-P1 may formalize it later via its own
reviewed amendment.

### T7 Transaction composition (every effectful op = exactly one FK-P9 `withTransaction`)

| Op | Writes inside the single transaction |
|---|---|
| claim (grant) | `insertLease`; `updateGoalRow` (revision +1, guarded); `insertEvent` (`lease.claimed`); `insertIdempotencyKey` (completed); `setProjectionCursor` (`goal-state` → new `event_seq`) |
| claim (takeover) | `updateLeaseRow` (stamp prior `released_at_micros`, guarded `IS NULL`); `insertLease`; `updateGoalRow` (revision +1); `insertEvent` (`lease.takeover`); `insertIdempotencyKey`; `setProjectionCursor` |
| claim (no-op) | `insertIdempotencyKey` only (completed, `effect_digest` null) |
| renew | `updateLeaseRow` (expiry + cas refresh); `updateGoalRow` (revision +1); `insertEvent` (`lease.renewed`); `insertIdempotencyKey`; `setProjectionCursor` |
| release | `updateLeaseRow` (released stamp); `updateGoalRow` (revision +1); `insertEvent` (`lease.released`); `insertIdempotencyKey`; `setProjectionCursor` |
| request | `insertTransition` (decided_at NULL); `updateGoalRow` (`pending_transition_id` = id, revision +1); `insertEvent` (`transition.requested`); `insertIdempotencyKey`; `setProjectionCursor` |
| decide apply | `updateTransitionRow` (decided_at); `updateGoalRow` (status = target, `pending_transition_id` = NULL, revision +1); `updateLeaseRow` (cas refresh, if lease active); `insertEvent` (`transition.applied`); `insertIdempotencyKey`; `setProjectionCursor` |
| decide reject | `updateTransitionRow` (decided_at); `updateGoalRow` (`pending_transition_id` = NULL, revision +1, status unchanged); `insertEvent` (`transition.rejected`); `insertIdempotencyKey`; `setProjectionCursor` |
| apply (atomic) | `insertTransition` (decided_at set immediately); `updateGoalRow` (status = target, pending NULL, revision **+1 once**); `updateLeaseRow` (cas refresh, if lease active); `insertEvent` (`transition.applied`); `insertIdempotencyKey`; `setProjectionCursor` |

Exactly one event and exactly one revision bump per accepted operation. At most one
pending transition per goal (`TRANSITION_PENDING_EXISTS` on a second request). A
decide must name the goal's **current** `pending_transition_id`
(`TRANSITION_NOT_PENDING` otherwise) and re-validates the edge from the **current**
status at decide time; a decide whose `expectedRevision` is stale after any
intervening operation conflicts (`STATE_REVISION_STALE`) — scenario 7's "stale
transitions conflict". The state-application cursor is the
`projection_cursors` row keyed `projection_id = 'goal-state'` — THE goal projection
cursor id (D14's singular cursor per stream; coordinator ruling 2026-09-28, OQ-4) —
advanced to the appended `event_seq` in the same transaction (D14 "transactional
state/event/cursor updates"). FK-P11 registers any additional cursor ids via a
recorded FK-P9 amendment (FK-P9 OQ-5 pattern); no silent namespace grabs.

### T8 Event vocabulary (closed; `events.kind`; payload rules)

| Kind | Emitted by | Payload (canonical JSON, ≤65,536 bytes — substrate cap) |
|---|---|---|
| `lease.claimed` | claim grant | goalId, leaseId, principalRef, operationId, durationMicros, expiresAtMicros, resultingRevision, effect fields (T6) |
| `lease.takeover` | claim takeover | as above + priorLeaseId, priorExpiresAtMicros |
| `lease.renewed` | renew | goalId, leaseId, expiresAtMicros, resultingRevision, effect fields |
| `lease.released` | release | goalId, leaseId, releasedAtMicros, resultingRevision, effect fields |
| `transition.requested` | request | goalId, transitionId, fromStatus, targetStatus, resultingRevision, effect fields |
| `transition.applied` | decide apply / apply | goalId, transitionId, fromStatus, targetStatus, gateEvidenceRefs (where present), resultingRevision, effect fields |
| `transition.rejected` | decide reject | goalId, transitionId, fromStatus, targetStatus (recorded target), resultingRevision, effect fields |

`events.principal_ref` / `events.operation_id` carry the binding members (identify,
never authenticate — FK-P9 rule). Payloads never carry credentials, prompts, source
payloads, or secrets (charter §5; writer-contract fixture). Payload decoding is
linear-time and typed (standing #19/#2).

### T9 Closed engine error registry (`EngineError`; safe diagnostics per F05.10 discipline)

| Code | Raised when | F05.12 disposition (annotation only — mapping never redefines) | Safe diagnostic |
|---|---|---|---|
| `LEASE_HELD` | claim against another holder's unexpired lease | CONFLICT (consumed via FK-P13 mapping) | lease id only |
| `LEASE_EXPIRED` | renew/release/state write under an expired lease | CONFLICT | lease id only |
| `LEASE_NOT_OWNER` | lease-bound op by a non-owner principal | REFUSE | ids only |
| `LEASE_NOT_ACTIVE` | lease-bound op with no active lease (reason `absent` \| `released`) | REFUSE | reason literal only |
| `GOAL_ABSENT` | unknown goal id | REFUSE | goal id only |
| `GOAL_TERMINAL` | claim on a terminal goal | REFUSE | goal id only |
| `GOAL_STATUS_UNKNOWN` | stored status outside T1 (defense-in-depth read refusal) | kernel failure family | none |
| `TRANSITION_ABSENT` | unknown transition id | REFUSE | transition id only |
| `TRANSITION_ALREADY_DECIDED` | decide on a decided transition (non-replay) | CONFLICT | transition id only |
| `TRANSITION_PENDING_EXISTS` | request while another transition is pending | CONFLICT | none |
| `TRANSITION_NOT_PENDING` | decide a transition that is not the goal's current pending | CONFLICT | transition id only |
| `TRANSITION_STATUS_UNKNOWN` | target status outside T1 | REFUSE | none |
| `ILLEGAL_TRANSITION` | edge not in T2 legal set | REFUSE | edge ids only |
| `GATE_EVIDENCE_REQUIRED` | gate edge (L4/L6) decided with no well-formed ref whose `evidenceKind` lies in the edge's effective allow-set (T2) | REFUSE | edge id only |
| `GATE_STATE_NOT_WRITABLE` | gate-satisfaction write attempt (reserved status namespace `gate.*`/`human.*`, reserved input fields) | REFUSE | field path only |
| `IDEMPOTENCY_CONFLICT` | same key, different `payloadDigest` (F05.12 literal) | CONFLICT (F05.12 code verbatim) | binding ids only |
| `IDEMPOTENCY_IN_FLIGHT` | completed binding row absent (`completed_at_micros` NULL) | CONFLICT | binding ids only |
| `IDEMPOTENCY_RESULT_UNAVAILABLE` | completed binding without a safely replayable recorded result (legacy row) — never invented, never re-executed (23rd code; coordinator ruling 2026-09-28, rework R4 flag 1) | CONFLICT | binding ids only |
| `STATE_REVISION_STALE` | CAS mismatch (F05.12 literal) | CONFLICT (F05.12 code verbatim) | revision numbers only |
| `CLOCK_REGRESSION` | trusted-clock reading below a prior reading | kernel failure family (`KERNEL_INTERNAL_FAILURE` at the boundary) | none |
| `CLOCK_UNTRUSTED` | trusted-clock reading malformed | kernel failure family | none |
| `ENGINE_ARGUMENT_INVALID` | structural input failure (unknown field, bad Id/Digest/Micros shapes, bad duration, malformed binding) | protocol-error family (`INVALID_REQUEST` at the boundary) | field path only |
| `STORAGE_FAILURE` | wrapped FK-P9 `StorageError` at a substrate seam | kernel failure family | FK-P9 `StorageErrorCode` literal only |

23 codes, closed. No driver message text, host path, row content, credential, or
unbounded value can reach a caller (fault-injection test per code). The F05.12 column
is a consuming-surface annotation in the FK-P17 T4 pattern: exact literals are used
verbatim where F05.12 names them (`IDEMPOTENCY_CONFLICT`, `STATE_REVISION_STALE`,
`EFFECT_APPLIED`, `EFFECT_NOOP`); everything else stays an engine code for the
FK-P13/adapter mapping and no FK-P1 union is redefined.

### T10 Hostile-fixture inventory (dominant hostile space; 112 fixture records)

Records live in `tests/fixtures/`; hostile cases are JSON tables of `{ id, input,
expectedCode | expectedOutcome, expectedReasonCode? }`, canonical cases are committed
byte vectors, controls are positive rows. Every row carries one pre-declared expected
outcome; the inventory map test proves the record counts and one-outcome-per-row.

| Class | IDs | Count | Expected |
|---|---|---|---|
| L1 Lease semantics | LSE-01 renew after expiry; LSE-02 release after expiry; LSE-03 state write under expired lease; LSE-04 double-release with a different binding; LSE-05 renew by non-owner; LSE-06 release by non-owner; LSE-07 claim against another's unexpired lease; LSE-08 claim with negative duration; LSE-09 claim with zero duration; LSE-10 claim with over-cap duration; LSE-11 claim on terminal goal | 11 | LSE-01/02/03 `LEASE_EXPIRED`; LSE-04 `LEASE_NOT_ACTIVE(released)`; LSE-05/06 `LEASE_NOT_OWNER`; LSE-07 `LEASE_HELD`; LSE-08/09/10 `ENGINE_ARGUMENT_INVALID`; LSE-11 `GOAL_TERMINAL` |
| L2 Transitions + CAS | X01–X18 (one row per illegal T2 edge); TR-01 stale CAS apply (behind); TR-02 stale CAS apply (ahead); TR-03 stale-pending decide after an intervening lease op (scenario 7); TR-04 decide already-decided with a different binding; TR-05 request while pending exists; TR-06 decide a non-pending transition; TR-07 unknown goal; TR-08 unknown transition; TR-09 unknown status literal | 27 | X01–X18 `ILLEGAL_TRANSITION`; TR-01/02/03 `STATE_REVISION_STALE`; TR-04 `TRANSITION_ALREADY_DECIDED`; TR-05 `TRANSITION_PENDING_EXISTS`; TR-06 `TRANSITION_NOT_PENDING`; TR-07 `GOAL_ABSENT`; TR-08 `TRANSITION_ABSENT`; TR-09 `TRANSITION_STATUS_UNKNOWN` |
| L3 Idempotency | IDP-01..06 same key/different payload per op family (claim, renew, release, request, decide, apply); IDP-07..12 completed-binding replay per family; IDP-13 in-flight (NULL-completed) binding; IDP-14..18 missing binding member (one per member); IDP-19..23 malformed binding member (one per member) | 23 | IDP-01..06 `IDEMPOTENCY_CONFLICT`; IDP-07..12 recorded result returned verbatim (`replay: true`, zero event/revision/cursor deltas); IDP-13 `IDEMPOTENCY_IN_FLIGHT`; IDP-14..23 `ENGINE_ARGUMENT_INVALID` |
| L4 Human-gate writes | GTW-01/02 reserved gate status literals (`gate.satisfied`, `human.approved`); GTW-03/04 reserved gate-field smuggle (`gateSatisfied`, `humanApproved`); GTW-05 L4 decided without refs; GTW-06 L6 decided without refs; GTW-07 malformed ref digest; GTW-08 unknown ref `evidenceKind`; GTW-09 malformed ref `gitIdentity`; GTW-10 substrate-seeded gate-ish status refuses on read; GTW-11 consumer evidence-kind policy wider than the T2 ceiling; GTW-12 ref kind outside a narrowed allow-set | 12 | GTW-01..04 `GATE_STATE_NOT_WRITABLE`; GTW-05/06 `GATE_EVIDENCE_REQUIRED`; GTW-07/08/09 `ENGINE_ARGUMENT_INVALID` (per structural dimension, #30); GTW-10 `GOAL_STATUS_UNKNOWN`; GTW-11 `ENGINE_ARGUMENT_INVALID` (policy widening refused); GTW-12 `GATE_EVIDENCE_REQUIRED` |
| L5 Clock / trusted time | CLK-01 regressing clock; CLK-02 negative reading; CLK-03 non-integer reading; CLK-04 unsafe-number reading; CLK-05 caller-supplied `nowMicros` field; CLK-06 caller-supplied `expiresAtMicros` field; CLK-07 forward-skewed child-process grant judged from stored micros vs local trusted now; CLK-08 backward-skewed renew cannot resurrect an expired lease | 8 | CLK-01 `CLOCK_REGRESSION`; CLK-02/03/04 `CLOCK_UNTRUSTED`; CLK-05/06 `ENGINE_ARGUMENT_INVALID` (no time parameter exists anywhere in the API); CLK-07 expiry judged only from trusted seam; CLK-08 `LEASE_EXPIRED` |
| L6 Concurrency (real processes; asserted interleaving, CONC-03 lesson) | CN-01 two-process claim race; CN-02 claim/release race; CN-03 expired-lease takeover race; CN-04 same-binding apply race; CN-05 same-key different-binding apply race; CN-06 stale-CAS apply race; CN-07 pending-request race | 7 | each row asserts the exact outcome pattern: exactly one winner, one event, one binding, one revision bump; the loser's typed result and the post-state it observes are named (CN-01/03 `LEASE_HELD`; CN-04 replay of the recorded result with zero duplicate effects; CN-05 `IDEMPOTENCY_CONFLICT`; CN-06 `STATE_REVISION_STALE`; CN-07 `TRANSITION_PENDING_EXISTS`) |
| L7 Crash mid-transition (real child-process kill) | CR-01 kill after event insert, pre-commit; CR-02 kill after goal update, pre-commit; CR-03 kill after binding insert, pre-commit; CR-04 kill post-commit, pre-result-return; CR-05 kill mid-request; CR-06 kill mid-claim | 6 | CR-01/02/03/05/06: rollback to fully-absent (all six tables asserted row-exact) and retry applies cleanly; CR-04: state fully applied; the retry returns the recorded result (`replay: true`); the kill point is asserted reached before the kill (MIG-02 precedent) |
| Controls | CTL-01..07 the seven legal T2 edges (gate edges with well-formed refs); CTL-08 claim→renew→release cycle; CTL-09 expired-lease takeover success (prior row stamped); CTL-10 same-principal re-claim NOOP (`EFFECT_NOOP`, `effectDigest` null) | 10 | each passes as named; CTL rows prove the suite can observe success (non-vacuous `mechanical`-style control) |
| Canonical | 8 byte-rule vectors (key order UTF-16, array order, escape set, digits-only integer lexemes, Unicode non-normalization, no path case folding, empty containers, unpaired-surrogate rejection) | 8 | byte-exact re-derivation by the local F05.5 encoder + read-only cross-check against FK-P1 golden fixtures |

Counts: 11+27+23+12+8+7+6 = **94 hostile** + 10 controls + 8 canonical = **112
records**. Hostile classes dominate (~84%). One fixture per invalid shape and per
illegal edge (default-deny #30), one failing-when-broken mutation per named invariant
(#32), and at least one precedence-edge test per refusal family (the documented
first-failure order is what actually fires).

### T11 Digest rules (F05.5 byte rules; FK-P10-owned domains)

| Use | Kind | Preimage / domain |
|---|---|---|
| `IdempotencyBinding.payloadDigest` / `transitions.payload_digest` | canonical-JSON digest | UTF-8 bytes of the canonical JSON of the operation request document (with its `operation` discriminator), domain `foreman-line.kernel-lease.operation-input` |
| `events.payload_digest` = `EffectResult.effectDigest` = `idempotency_keys.effect_digest` | canonical-JSON digest | UTF-8 bytes of the canonical JSON of the event payload document (embedding the `EffectResult` minus `effectDigest`), domain `foreman-line.kernel-lease.event-payload` |
| contention records file digest (`contention-summary.json`) | bytes digest | SHA-256 over the produced `contention.jsonl` bytes, tagged `sha256:` — a file-bytes digest, deliberately not routed through the JSON encoder (FK-P9 pattern) |

All tagged `sha256:` + 64 lowercase hex (F05.5 literal). The encoder is implemented
locally in `src/canonical.ts` with 8 byte-bound vectors and a read-only conformance
cross-check that re-derives FK-P1's golden fixture digests byte-exactly
(`kernel-contracts/tests/fixtures/golden-vectors.json` — read-only test input, never
written).

**INF-6 contention measurement (records only).** `measureContention` runs named plan
constants (4 racer processes × 50 attempts × 1 goal × 3 repeats) racing
claim/renew/release cycles through the real engine against a real database; each
attempt is one JSONL record against `schemas/measurement-record.schema.json` (op,
racer, sequence, outcome code, elapsed µs, lock-wait µs, observed busy timeouts,
host-clock note); `contention-summary.json` carries nearest-rank percentiles (FK-P17
pattern), outcome counts, and the `contention.jsonl` bytes digest. Below-minimum
populations refuse the measurement claim (`MEASUREMENT_INCOMPLETE` analog retained
with records). External text is sanitized before emission (#31); parsing is
linear-time (#19). **Claim boundary:** contention records only — no INF-6 baseline, no
bottleneck ranking, no cost claim (INF-6 forbids; assembly is FK-P21's stranded
row). The records explicitly state that they feed the deferred INF-6 baseline
(coordinator ruling 2026-09-28, OQ-10 — binding honesty: no comparative or baseline
claim).

## Allowed Files

Proposed builder ceiling, inactive until dispatch — exact 38-file ceiling:

- `plugins/foreman-line/kernel-lease/package.json`
- `plugins/foreman-line/kernel-lease/package-lock.json`
- `plugins/foreman-line/kernel-lease/tsconfig.json`
- `plugins/foreman-line/kernel-lease/biome.json`
- `plugins/foreman-line/kernel-lease/README.md`
- `plugins/foreman-line/kernel-lease/src/index.ts`
- `plugins/foreman-line/kernel-lease/src/errors.ts`
- `plugins/foreman-line/kernel-lease/src/clock.ts`
- `plugins/foreman-line/kernel-lease/src/canonical.ts`
- `plugins/foreman-line/kernel-lease/src/state-machine.ts`
- `plugins/foreman-line/kernel-lease/src/leases.ts`
- `plugins/foreman-line/kernel-lease/src/transitions.ts`
- `plugins/foreman-line/kernel-lease/src/idempotency.ts`
- `plugins/foreman-line/kernel-lease/src/measure.ts`
- `plugins/foreman-line/kernel-lease/schemas/effect-result.schema.json`
- `plugins/foreman-line/kernel-lease/schemas/measurement-record.schema.json`
- `plugins/foreman-line/kernel-lease/tests/leases.test.ts`
- `plugins/foreman-line/kernel-lease/tests/lease-time.test.ts`
- `plugins/foreman-line/kernel-lease/tests/transitions.test.ts`
- `plugins/foreman-line/kernel-lease/tests/state-machine.test.ts`
- `plugins/foreman-line/kernel-lease/tests/idempotency.test.ts`
- `plugins/foreman-line/kernel-lease/tests/human-gate.test.ts`
- `plugins/foreman-line/kernel-lease/tests/crash-recovery.test.ts`
- `plugins/foreman-line/kernel-lease/tests/concurrency.test.ts`
- `plugins/foreman-line/kernel-lease/tests/errors.test.ts`
- `plugins/foreman-line/kernel-lease/tests/canonical-conformance.test.ts`
- `plugins/foreman-line/kernel-lease/tests/helpers/child-worker.ts`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/leases.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/transitions.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/idempotency.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/gate-writes.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/clock.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/concurrency.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/hostile/crash.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/controls.json`
- `plugins/foreman-line/kernel-lease/tests/fixtures/canonical/encoder-vectors.json`
- `plugins/foreman-line/kernel-lease/evidence/contention.jsonl`
- `plugins/foreman-line/kernel-lease/evidence/contention-summary.json`

Nothing outside this new FK-owned package is writable. The package owns only its own
manifest, lockfile, exports, schemas, fixtures, and package-local evidence. FK-P9
remains the named serialization owner of **state migrations / storage package
exports** (charter §12): every FK-P10 schema need arrives as a recorded FK-P9-owned
amendment request (below), never a direct edit. If implementation needs a path not
listed here, the coordinator records a spec amendment before code; no implied
neighboring-path permission.

**FK-P9 schema amendment requests (FK-P9 OQ-5 routing; coordinator ruling 2026-09-28,
OQ-8 — the coordinator lands the FK-P9 amendment record + migration as a tiny
predecessor before builder code; this spec never edits `kernel-state/**`):**
- **A1a (correctness-adjacent — ties to OQ-1's vocabulary; LANDED):** DB-level `CHECK`
  constraints encoding the T1 status vocabulary on `goals.status`, delivered as
  `kernel-state/migrations/0002-goal-status-checks.sql` (FK-P9 amendment A1/A2,
  `287085ce`).
- **A1b (follow-on, dispatched with the FK-P10 build):** the same DB-level `CHECK`
  pattern for `transitions.status`, its vocabulary taken verbatim from this spec's T-tables
  at build time, delivered as `kernel-state/migrations/0003-*.sql` through the same
  recorded FK-P9 amendment route (coordinator ruling 2026-09-28, Step-0 flag F2: the
  A1a scope of `goals.status`-only was my dispatch-brief narrowing of this text;
  `transitions.status` keeps substrate enforcement for defense-in-depth parity).
- **A2 (performance-only, explicitly NOT correctness-blocking):** `CREATE INDEX
  events_goal_operation ON events (goal_id, operation_id)` to bound replay lookup (T6
  reconstruction scans the goal's event stream by `operation_id`), same amendment
  path.

**Forbidden surfaces (exact):** `plugins/foreman-line/kernel-state/**` (FK-P9-owned —
the read-only dependency; schema needs via recorded FK-P9 amendments only);
`plugins/foreman-line/kernel-contracts/**` (FK-P1's package — forbidden for mutation;
read-only conformance input for the golden-fixture cross-check);
`plugins/foreman-line/spec-body-compiler/**` (FK-P2's package);
`plugins/foreman-line/bypass-outage-harness/**` (FK-P17′'s package);
`plugins/foreman-line/dispatch/**` (contested; RCM Window-R discipline);
`plugins/foreman-line/mutation-scope-guard/**` (contested; FK-P2B /
`foreman-line-boundary-routing` territory, RS-2.4);
`plugins/foreman-line/routing-policy/**` (contested; `foreman-line-boundary-routing`);
`plugins/foreman-line/hooks/**` (contested; FK-P2B/FK-P3 territory);
`plugins/foreman-line/skill-injection/**` (`plugin-packaging-and-scaffolder`
territory); `plugins/foreman-line/contracts/**` (frozen pipeline A–F contracts);
`plugins/foreman-line/authority-registry/**` (FK-P0 source and generated registry);
`plugins/foreman-line/docs/SPEC-CONVENTION.md` (frozen sibling serialization point);
`plugins/foreman-line/spec-linter/**`; shared manifests/lockfiles/exports; root
workflow files; plugin/marketplace metadata; `docs/goals/**` records (including the
exit annex — record propagation is coordinator-owned); other goals' records.

## Acceptance Criteria

1. **State-machine exhaustiveness (default-deny #30):** T2's 25 edges are enumerated
   in `state-machine.ts`, in `tests/fixtures/hostile/transitions.json` (X01–X18, one
   row per illegal edge), and in `tests/fixtures/controls.json` (CTL-01..07, one row
   per legal edge); `tests/state-machine.test.ts` proves every illegal edge is
   refused `ILLEGAL_TRANSITION` and every legal edge applies; a missing or duplicate
   edge row fails the inventory map.
2. **CAS correctness (failing-when-broken #32):** every effectful path is
   revision-guarded (claim/renew/release/request/decide/apply); stale `expectedRevision`
   yields `STATE_REVISION_STALE` and never a silent write; a stale pending transition
   decided after an intervening operation conflicts (TR-03, scenario 7); each guard
   has a named mutation test that fails when the guard is removed.
3. **Lease invariants:** at most one active lease per goal (substrate index + takeover
   stamping, CN-01/CN-03); owner-only renew/release; expired leases unusable in every
   direction (LSE-01..03); double-release refused (LSE-04); terminal-goal claim
   refused (LSE-11); each invariant independently tested and failing-when-broken.
4. **Trusted lease time:** every lease-time decision reads the injected seam exactly
   once per operation; regressing/malformed readings refuse (CLK-01..04); no API
   parameter anywhere carries a caller timestamp or absolute expiry (CLK-05/06 prove
   the shape rejects them); monotonic duration measurement is used only for
   measurement spans (T5); #32 mutation per rule.
5. **Idempotency (P1-S09 verbatim):** same key/different `payloadDigest` →
   `IDEMPOTENCY_CONFLICT` regardless of completion state (IDP-01..06); same completed
   binding → the recorded `EffectResult` returned verbatim with asserted zero new
   events, zero revision change, zero cursor movement, and no repeated effects
   (IDP-07..12; row-count/revision/cursor deltas asserted, #32); incomplete binding →
   `IDEMPOTENCY_IN_FLIGHT` (IDP-13); binding shape default-deny per member
   (IDP-14..23).
6. **Human-gate state is evidence-derived, never written (D9):** reserved gate
   status namespaces and reserved gate fields are refused `GATE_STATE_NOT_WRITABLE`
   (GTW-01..04); gate edges L4/L6 refuse without ≥1 well-formed `GitGateEvidenceRef`
   (`GATE_EVIDENCE_REQUIRED`, GTW-05/06) and accept with refs bound into the recorded
   event (CTL-04/06); malformed refs refuse per structural dimension (GTW-07..09);
   a substrate-seeded gate-ish status refuses on read (GTW-10); no artifact claims
   refs are verified genuine (derived downstream). **Residual stated normatively
   (coordinator ruling 2026-09-28, OQ-2): well-formed-but-fabricated refs pass P10's
   shape gate BY DESIGN; genuineness derives downstream (FK-P12/deferred) and is
   never claimed here.**
7. **Transactional composition and crash honesty:** every effectful operation writes
   exactly one `withTransaction` covering event + state (+ transition + lease +
   binding + cursor) per T7; real child-process kills at asserted-reached fault
   points (CR-01..06) leave state **fully applied or fully absent** — asserted
   row-exact across `events`, `goals`, `transitions`, `leases`, `idempotency_keys`,
   `projection_cursors` — and retries complete or replay; never "did not throw".
8. **Real process-boundary concurrency:** the concurrency suite runs ≥2 real
   processes against one real database and asserts the exact interleaving outcome per
   CN row (single winner, single event/binding/bump, named loser result and observed
   post-state — CONC-03 lesson); no mock or simulated race may satisfy any CN row.
9. **Contract fidelity:** `effect` validates against
   `schemas/effect-result.schema.json` (F05.11 fields verbatim; `decision`/`code`
   pairing invariant); `IdempotencyBinding`, `LeaseCasDescriptor`, and
   `GitGateEvidenceRef` are used with FK-P1 member sets verbatim, one home each;
   F05.12 dispositions are annotation-only and no FK-P1 union is redefined (reviewer
   question 9).
10. **Digest rules:** the local F05.5 encoder passes 8 byte-bound vectors and
    re-derives FK-P1's golden fixture digests byte-exactly in
    `tests/canonical-conformance.test.ts` (read-only input; `kernel-contracts/**`
    byte-unchanged pre/post).
11. **Closed error registry:** 23 codes (T9) with one tested refusal per code; safe
    diagnostics carry only the declared shapes (no host path, row content, driver
    text, credential — fault injection per code); wrapped substrate errors carry the
    FK-P9 `StorageErrorCode` literal only.
12. **INF-6 records, no claims:** `npm run measure-contention` emits
    `evidence/contention.jsonl` + `contention-summary.json` per T11 (populations,
    nearest-rank percentiles, bytes digest); below-minimum populations refuse the
    measurement claim while retaining records; no baseline, bottleneck, cost, or INF
    residual claim anywhere (banned-claim scan recorded); and the records state that
    they feed the deferred INF-6 baseline (coordinator ruling 2026-09-28, OQ-10).
13. **Claim honesty (D13 / RS-2.2 / exit annex):** no text or artifact claims
    enforcement, promotion, containment, gate verification, `authorizeAction`
    behavior, FK-P15 clean-room recovery/restart-reconstruction/split-brain proof, or
    any stranded INF obligation; crash/concurrency evidence is labeled in-suite
    real-process-boundary evidence only; the banned-claim scan over all emitted bytes
    records its result in `contention-summary.json` and the test output.
14. **Mechanical completeness:** the exact 38-file ceiling holds; no root/workspace
    manifest registration; no shared lockfile/manifest/schema edits; `kernel-state/**`
    and `kernel-contracts/**` verified byte-unchanged across the run (pre/post
    digests); the deterministic chain passes with direct exit codes retained; two
    fresh independent architecture/risk reviews return verdicts on the mandated focus
    questions and neither fixes nor commits.

## Out of Scope

- Legacy import, field-level authority reconciliation, deterministic Markdown
  projection, cutover epoch, divergence-stop, projection cursor consumers — **FK-P11**
  (the reserved `goal-state` cursor row is engine-maintained; rendering is not).
- `authorizeAction`, policy evaluation, role/scope posture, and the genuineness or
  sufficiency verification of `GitGateEvidenceRef` artifacts against Git canon —
  **FK-P12** (deferred); FK-P10 binds shape/presence and records refs only.
- The admission-protected control catalog (get/claim/renew/release/transition/
  evidence/project tools), authenticated-capability admission, and the binding
  anchoring rule for admitted contexts (F05.4 binding-scope at the wire boundary) —
  **FK-P13** (deferred).
- FK-P9 substrate mechanics: open, migrations, schema, WAL/busy policy, corruption
  and path refusal, backup/checkpoint/restore, exports — read-only dependency; all
  schema needs are recorded FK-P9 amendment requests, never edits here.
- Restart reconstruction at the deployed boundary, split-brain refusal proof,
  stale-authorization refusal, migration crash/recovery proof, clean-room evidence —
  **FK-P15** (stranded per RS-2.2/exit annex; never claimed here). FK-P10's crash and
  concurrency tests are in-suite real-process-boundary evidence only.
- Wakeup/handoff: FK-P10 defines NO `wakeup_handoffs` semantics beyond preserving
  the FK-P9 column shape (FK-P9 owns the schema; coordinator ruling 2026-09-28,
  OQ-7); the column stays a named orphan-semantics gap for the exit annex
  (coordinator record propagation; FK-P13/deferred consumer) — no handoff semantics
  are invented here. Evidence-index/artifacts semantics (`artifacts` is (P11/P21))
  likewise out of scope.
- Enforcement, promotion, adapter behavior, bypass/outage matrices, CI backstops
  (FK-P17′/FK-P18′/FK-P19), INF-6 baseline assembly (FK-P21 stranded), numeric
  RPO/RTO objectives (owner policy, FK-P9 OQ-1), INF-2 placement proof (FK-P14/FK-P15).
- Any write to `kernel-state/**`, `kernel-contracts/**`, `spec-body-compiler/**`,
  `bypass-outage-harness/**`, `dispatch/**`, `routing-policy/**`,
  `mutation-scope-guard/**`, `hooks/**`, `skill-injection/**`, `contracts/**`,
  `authority-registry/**`, `SPEC-CONVENTION.md`, shared manifests/lockfiles/exports,
  workflows, plugin/marketplace metadata, `docs/goals/**` records (exit-annex
  propagation is coordinator-owned), or other goals' records.
- Jira linkage, INDEX.md regeneration, corpus-registry (R32) work, and
  shaping-emitter/ShapingResult machinery (parent-coordinated).

## Context & References

Pin table — every external file cited by this spec, SHA-256 over the file bytes,
**binding COMMITTED bytes at the parcel base (HEAD `7e415e7`, 2026-09-28)** per the
pin-integrity rule above; uncommitted sibling state is never pinnable. All digests
computed on disk 2026-09-28 and verified equal to the committed bytes
(`git show HEAD:<path>`), except the SPEC-CONVENTION row, which is carried under the
three-state known-base rule.

| File (repo-relative) | SHA-256 | Binds |
|---|---|---|
| `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` | `29a08a63b8e1c540bfa6863a0244dddb7e08b1e3889dac64d10892f87b06b693` | D2, D5, D9, D14, D17; §6 Wave-3a FK-P10 row + Wave-3 exit; §12 serialization; §15.3 dispatch contract; INF-6 carrier line |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-p1-p21-dispatch-plan.md` | `51c410c5deb63fd7390fe712d7c77e4b06ae05c223d00821713d9216508bbacf` | FK-P10 row + owned surfaces; RS-1/RS-2 annotations; review routing |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md` | `bb12ccb5c279b8c32095814c4a89ec577b4e0d7aa368656cd56c91a38d16b2ea` | RS-2.2 strand split (INF-8 process-boundary proof stranded); RS-2.3 Wave-3a exit honesty |
| `plugins/foreman-line/docs/goals/foreman-kernel/fk-exit-annex-draft-2026-09-27.md` | `cceb32dd7c4979dd8d75bdf7e8aa53a63db17883331216d7e30fd590c49dfc11` | what this parcel must NOT claim (stranded INF-4/INF-6/INF-8 rows; FK-P15's stranded process-boundary fragment). Re-pinned 2026-09-28 (coordinator, second advance) — superseded `d2142ac7…` when the legacy status-vocabulary mapping remainder landed; committed-bytes rule held throughout |
| `plugins/foreman-line/docs/specs/done/FK-P1-lifecycle-admission-decision-contracts.md` | `ec2d892288933845c32191e587a19b8a9f650e12d31538d28c78ca54552068a2` | F05.1 bounds; F05.4 `IdempotencyBinding`/`LeaseCasDescriptor`/`GitGateEvidenceRef`; F05.5 digest rules; F05.8 `stop-report-emission`; F05.10 diagnostics; F05.11 `EffectResult`; F05.12 `IDEMPOTENCY_CONFLICT`/`STATE_REVISION_STALE`; P1-S09 semantics |
| `plugins/foreman-line/docs/specs/done/FK-P9-storage-migration-abi.md` | `f713bb43e96da78fd8e85a41ed8a18677761c3725b8af6fcc300571d30aab6f9` | substrate contract tables; `withTransaction` composition seam; OQ-5 migration-serialization ruling; CONC-03 concurrency lesson; MIG-02 child-process-kill precedent; canonical-conformance cross-check pattern |
| `plugins/foreman-line/docs/specs/done/FK-P17-bypass-outage-matrix.md` | `932a0262497b5a3f5e8a75c8732b085b581ad48d54081b7bc238c29d7d97880c` | pin-integrity rule; environment-prerequisite Verification Plan pattern; T4 mapping-never-redefines pattern; skip-and-record; banned-claim scan; nearest-rank measurement pattern |
| `plugins/foreman-line/docs/SPEC-CONVENTION.md` | **THREE-STATE** — target `70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` (v0.4 revision); KNOWN-BASE `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` | §4 schema + §4.8 Allowed Files authority (identity pin only — FK-P10 pins no grammar). The known FK gap applies: the pinned target is the v0.4 revision which exists only as the uncommitted RCM-P2 delta in a sibling write set (worktree digest at shaping time = the target); KNOWN-BASE `7ac31500…` is the committed pre-v0.4 state at the parcel base (verified via `git show HEAD:`) → KNOWN-GAP `blocked: RCM-P2 schema-v0.4 delta uncommitted`; any other state → `PIN_DRIFT` fail-closed |
| `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` | `57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac` | #1, #2, #3, #19, #30, #31, #32, #34 |
| `plugins/foreman-line/kernel-state/src/index.ts` | `d526e86e35d9aa65fa065030e4687c0340afb5f5907ddf31567b132c24b75d80` | exported substrate API FK-P10 composes |
| `plugins/foreman-line/kernel-state/src/clock.ts` | `866e5920a25bb650200a3e11a4f2a834ecacc1ba7bd1414500b083d16de56d11` | `Clock` seam discipline T5 wraps |
| `plugins/foreman-line/kernel-state/src/schema.ts` | `73e33202a890ee0f681970208572be4e21eb0a40172659075d1ed661ed8041c2` | `isId`/`isDigest`/`isSafeInt` validators reused |
| `plugins/foreman-line/kernel-state/src/rows.ts` | `4731cb9326e034293c2457da0a2e2d7063559f2a1dda4a4993ae6976c1442fae` | row primitives (T7 write set) |
| `plugins/foreman-line/kernel-state/src/transactions.ts` | `5cd966ca82be09ebaaca786a43644fd4c9b80c31c1f0b2cf1f78c94f58b73aa1` | `withTransaction` — the only transaction primitive |
| `plugins/foreman-line/kernel-state/src/open.ts` | `eb27f1b5606a60e61897cce534503fc472c76e40440aa5c7e6a92a2f840c866d` | `openStorage`/`Storage` handle contract |
| `plugins/foreman-line/kernel-state/src/errors.ts` | `a0bc31c0d1d5fb2bd717db22804ba70a36a78ab368897335ca3f56a4e93d80a4` | `StorageError` codes wrapped as `STORAGE_FAILURE` |
| `plugins/foreman-line/kernel-state/src/canonical.ts` | `9bf206cf769791e633d52ab8c61e3165e4befd3901e323a209825bf7fa776d60` | F05.5 domains/byte rules FK-P10's local encoder mirrors |
| `plugins/foreman-line/kernel-state/migrations/0001-initial.sql` | `b7b01bd6ecbc4a6b4cf960d60adacdcefa537ed4aa7dd8b8c683ec35bdf08661` | substrate schema FK-P10 binds against (T6/T7 columns) |
| `plugins/foreman-line/kernel-state/package.json` | `46f917c33f77ac8d12113b82f034ea9f15a3c9b117f19f43d134cb467d377869` | `file:../kernel-state` dependency target |
| `plugins/foreman-line/kernel-contracts/tests/fixtures/golden-vectors.json` | `ba795f9d6de63b15831e24273256ec47a3d40af9f12d50b86b19f1e41c6a06dd` | read-only F05.5 conformance cross-check input (never written) |

Related records: [loop directive](../../goals/foreman-kernel/loop-directive.md),
[FK-P9 Stage-F closure](../../goals/foreman-kernel/fk-p9-stage-f-closure-2026-09-28.md),
[FK-P11 row](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md) (downstream
consumer of this engine).

## Verification Plan

**Environment prerequisite (FK-P17 pattern):** the tests exercise the REAL FK-P9
substrate (real SQLite via the merged `kernel-state` package and its native binding),
real child processes, and the real FK-P1 golden fixtures. Provision first: `npm ci` in
`plugins/foreman-line/kernel-state/` (native `better-sqlite3` binding install), then
`npm ci` in `plugins/foreman-line/kernel-lease/` (its lockfile pins
`file:../kernel-state` integrity; lockfile unchanged by the run). A missing dependency
tree fails with one named environment-prerequisite error — never skipped, never
passed (a preflight test asserts it first).

Deterministic chain, run by the coordinator on the sequential Node lane (Windows rule
preserved: package setup and deterministic passes run sequentially even when
reasoning lanes are concurrent), after provisioning above, cwd the isolated
`kernel-lease` package, full output and direct exit codes retained, in this exact
order: `node -v` (>=22); `npm ci` (kernel-state); `npm ci` (kernel-lease);
`npm run typecheck`; `npm test` (which MUST include the fixture inventory map proving
112 records with one pre-declared expected outcome each, the 25-edge exhaustiveness
map, the real child-process crash suite with asserted-reached kill points, the
real multi-process concurrency suite with asserted interleavings, the #32
failing-when-broken mutation checks, the closed-registry fault-injection matrix, and
the read-only F05.5 conformance cross-check against FK-P1's golden fixtures in
`tests/canonical-conformance.test.ts`); `npm run lint`; `npm run measure-contention`
(emits `evidence/contention.jsonl` + `evidence/contention-summary.json`; below-minimum
populations refuse the measurement claim while retaining records). Script names are
required package interfaces, not claims that commands already run. The chain also
asserts `kernel-state/**` and `kernel-contracts/**` are byte-unchanged (pre/post
digests) and records the banned-claim scan result.

**Acceptance-to-evidence map:** AC1 → `state-machine.test.ts` +
`fixtures/hostile/transitions.json` (X01–X18) + `fixtures/controls.json` (CTL-01..07);
AC2/AC3 → `transitions.test.ts` + `leases.test.ts` + hostile rows TR/LSE;
AC4 → `lease-time.test.ts` + `fixtures/hostile/clock.json`; AC5 →
`idempotency.test.ts` + `fixtures/hostile/idempotency.json`; AC6 →
`human-gate.test.ts` + `fixtures/hostile/gate-writes.json`; AC7 →
`crash-recovery.test.ts` + `fixtures/hostile/crash.json` + `helpers/child-worker.ts`;
AC8 → `concurrency.test.ts` + `fixtures/hostile/concurrency.json`; AC9 →
`schemas/effect-result.schema.json` validation tests within `transitions.test.ts` +
reviewer question 9; AC10 → `canonical-conformance.test.ts` +
`fixtures/canonical/encoder-vectors.json`; AC11 → `errors.test.ts` (one
fault-injection case per registry code); AC12/AC13 → `measure.ts` +
`evidence/*` + the banned-claim scan assertion; AC14 → ceiling assertion in
`state-machine.test.ts` inventory map + coordinator Stage-D/E checks + two review
verdicts.

**Mandated reviewer focus questions** (field-by-field assessment, not generic
linting):

1. **State-machine exhaustiveness (naive reading, #14):** attempt the wrong-but-literal
   reading — is there ANY write path (request, decide, apply, takeover, replay,
   defense-in-depth read) that can put `goals.status` outside T1 or move it along an
   edge absent from T2's legal set? Show the text excludes it.
2. **Gate non-writability (D9):** can any input write human-gate satisfaction as
   state — status literal, extra field, event payload, or substrate-seeded row (is
   the read refusal real)? Is each reserved dimension tested independently (#30)?
   Does any text or artifact claim gate evidence is verified genuine?
3. **P1-S09 literalism:** does "same completed binding returns the recorded result"
   return the ORIGINAL `EffectResult` verbatim (code/decision/effectDigest/goalRevision
   as recorded) with asserted zero event/revision/cursor deltas and no repeated
   effects — failing-when-broken (#32)? Is same-key/different-payload ALWAYS
   `IDEMPOTENCY_CONFLICT`, including for uncompleted bindings?
4. **CAS completeness:** is every state-mutating path revision-guarded, including
   takeover stamping and decide-after-intervening-op (scenario 7 "stale transitions
   conflict")? Remove one guard and confirm a named test fails.
5. **Trusted time:** is there any path where caller-supplied, ambient, or
   cross-process-skewed time silently influences lease expiry beyond the single
   seam read per operation? Are CLK-05/06 proof that the API shape admits no time
   parameter? Does regression refuse rather than clamp?
6. **Single-writer integrity:** can two active leases for one goal ever coexist
   (substrate partial unique index + takeover stamping + race tests)? In CN rows, is
   the asserted interleaving exact (single winner; named loser result; observed
   post-state) rather than merely "no crash" (CONC-03 lesson)?
7. **Crash honesty:** do the kills land at real asserted-reached fault points inside
   the transaction (MIG-02 precedent), and is the recovery assertion row-exact across
   all six tables ("fully applied or fully absent")? Is CR-04's replay-vs-reexecute
   distinction genuinely tested (retry must NOT repeat the effect)?
8. **Substrate boundary:** does anything in `kernel-lease` decide storage mechanics or
   reimplement substrate primitives instead of composing `withTransaction` + row
   primitives? Are FK-P9 errors wrapped to `STORAGE_FAILURE` with the code literal
   only — can any driver text leak?
9. **Contract fidelity:** is the `effect` member byte-shape-conformant F05.11
   `EffectResult` (all eight fields, `decision`/`code` pairing)? Does the T9 mapping
   annotate F05.12 without redefining any FK-P1 union or literal (FK-P17 T4
   pattern)? Are the three borrowed shapes used with FK-P1 member sets verbatim?
10. **Claim honesty (D13/RS-2.2/exit annex):** does any sentence or artifact claim
    enforcement, promotion, containment, gate genuineness, FK-P15 clean-room
    recovery/restart/split-brain proof, INF-6 baseline, or a stranded INF
    obligation? Is the crash/concurrency evidence labeled in-suite
    real-process-boundary evidence exactly?

Two fresh independent architecture/risk reviews return verdicts on these questions;
reviewers report and triage (fix / accept-as-documented / informational) and never
fix or commit; each review ends with the post-review no-dirty-files assertion
(standing #24 family).

## Rollback

FK-P10 is an additive package on FK-owned surfaces: it creates one new private
directory and mutates no existing code, substrate, schema, enforcer, data format, or
shared surface. Rollback is delete-to-rollback: revert this spec and delete
`plugins/foreman-line/kernel-lease/` entirely. No consumer has shipped against the
engine while this spec is draft (FK-P11 undispatched; FK-P12/FK-P13 deferred), so no
compatibility window applies. The package owns no operator data: every database file
its tests create lives in a test temp directory and dies with the suite; its evidence
records are package-local and die on rollback (INF-4 retention stays stranded in the
exit annex, FK-P17 OQ-3 pattern). FK-P10 requests no migration of its own (the
optional A1/A2 schema amendments are FK-P9-owned and travel with FK-P9's ledger even
if FK-P10 rolls back) and deletes no operator data.

## Shaping questions — RESOLVED by coordinator ruling 2026-09-28 (dispositions recorded at the end of this section; no open questions remain)

1. **OQ-1 — Goal-status vocabulary.** The closed five-value set (`proposed`, `active`,
   `awaiting-human`, `completed`, `cancelled`) is proposed here (T1) because
   `goals.status`'s vocabulary is *(P10)* in the FK-P9 schema and no existing record
   fixes it. Confirm or amend, including the literal spelling `awaiting-human` against
   D9's truncated `awaiting_h…` and FK-P1's "awaiting-human" prose.
2. **OQ-2 — Gate-dependent edge set + genuineness seam.** Exactly two edges (L4/L6)
   require bound `GitGateEvidenceRef`s; FK-P10 enforces presence/shape/recording and
   never-writable gate state, while genuineness/sufficiency is derived downstream.
   With FK-P12 deferred, confirm that this split is the intended interim boundary (no
   in-parcel Git verification).
3. **OQ-3 — Evidence-kind policy.** Which `evidenceKind` (commit-ref, signature,
   status-check, merge-record) suffices per gate edge is left to consumer policy;
   FK-P10 validates ref shape only. Confirm, or assign kind-per-edge here.
4. **OQ-4 — Reserved cursor id.** The transactional state-application cursor uses
   `projection_cursors.projection_id = 'goal-state'` (T7); FK-P11 owns other
   projection ids. Confirm the reserved-id namespace split, or specify an alternative
   cursor mechanism (D14 names "transactional state/event/cursor updates" against
   FK-P10's charter row, and FK-P9's `withTransaction` contract names "event + state +
   cursor, FK-P10").
5. **OQ-5 — Idempotency bindings on lease operations.** Bindings are required on all
   six effectful operations (claim/renew/release/request/decide/apply) with uniform
   P1-S09 semantics. P1's binding-scope text (F05.4) is transition-only for the
   `authorizeAction` input field; confirm uniform engine-level binding is intended
   (D17's "idempotency binding on every public tool" reads that way).
6. **OQ-6 — `EFFECT_NOOP` semantics.** Proposed: NOOP is emitted only for a
   same-principal re-claim of an already-held lease (returns the held descriptor,
   `effectDigest` null, binding recorded); a binding replay returns the recorded
   result verbatim and is never re-coded NOOP. Confirm.
7. **OQ-7 — Wakeup/handoff semantics.** FK-P9 assigns `wakeup_handoffs` semantics to
   (P10/P13), but FK-P10's charter row does not carry wakeups and FK-P13's tool list
   has no wakeup tool. Proposed: out of FK-P10 scope (substrate available, semantics
   unassigned). Confirm, or assign the semantics.
8. **OQ-8 — Schema amendment routing.** A1 (status-vocabulary CHECK constraints) and
   A2 (`events(goal_id, operation_id)` replay index) are drafted as recorded
   FK-P9-owned amendment requests per OQ-5's ruling. Confirm the routing and whether
   A2 must land before FK-P10 implementation (the engine works without both; A2 is a
   lookup bound, not a correctness dependency).
9. **OQ-9 — Package identity.** `plugins/foreman-line/kernel-lease/` /
   `@foreman-line/kernel-lease` proposed (FK-owned, non-contested, `kernel-*` family).
   Alternative considered: `kernel-transition-engine` (narrower concurrency
   connotation lost). Confirm the name.
10. **OQ-10 — INF-6 contention scope.** The measurement plan (4 racers × 50 attempts ×
    1 goal × 3 repeats, nearest-rank percentiles, records-only claim boundary) is
    proposed as FK-P10's INF-6 fragment. Confirm the population minimums and that
    record-level output (no baseline assembly — FK-P21's stranded row) is the
    intended carrier.
11. **OQ-11 — Lease duration bounds.** `LEASE_MAX_DURATION_MICROS = 86400000000`
    (24 h) and minimum 1 µs are proposed named constants (T3) so hostile duration
    shapes have a closed test space. Confirm the cap value or delegate it to a future
    ratified operator policy (no shipped default beyond the constant).

### Coordinator Rulings — Resolved Decisions (2026-09-28)

**Flagged-risk ACK completion (Step-0 flag F4):** the ACK covers (a)–(g) in full — the two previously-unnamed entries: **(b)** cross-process wall-clock skew affects absolute lease expiry; recorded in the contention evidence, never compensated by policy invented in this package; **(g)** the pin handshake (shaping pinned the pre-extension annex state; the coordinator re-pinned at `d2142ac7` and again at `cceb32dd` as record work landed — the committed-bytes rule held throughout).

All eleven shaping questions above are resolved by coordinator ruling 2026-09-28;
the dispositions are incorporated in substance at the normative locations named
below. Flagged risks (a)–(g) are **ACK'd as designed** — (a) is normative per OQ-2
(AC6); (c) replay verbatimity is a mandated reviewer probe (#32, focus question 3);
(d) revision-+1-on-every-effectful-op is confirmed as the design (the CAS assertions
depend on it); (e)/(f) the MIG-02 and CONC-03 precedents bind — asserted outcomes,
never "no crash". The 10 mandated reviewer-focus questions in the Verification Plan
stand as the review mandate.

- **OQ-1 — CONFIRMED with mapping note** (T1): the five-value kebab vocabulary stands;
  D9's `awaiting_human` stop-report label maps to the `awaiting-human` goal status
  (spelling normalized at the record boundary; domains distinct).
- **OQ-2 — CONFIRMED as proposed; binding addition normative** (AC6): the interim
  boundary is correct and D9-protected at the layer P10 owns (shape/presence at
  L4/L6 + write-refusal invariants); the fabricated-but-well-formed residual is
  stated explicitly, never claimed away.
- **OQ-3 — RULED** (T2): the closed per-edge evidence-kind allow-set ships as the
  ceiling; consumers may narrow, never widen; wider policies refuse (GTW-11);
  out-of-set kinds refuse `GATE_EVIDENCE_REQUIRED` (GTW-12).
- **OQ-4 — CONFIRMED with scoping note** (T7): `goal-state` is THE goal projection
  cursor id; FK-P11 registers additional ids via a recorded FK-P9 amendment — no
  silent namespace grabs.
- **OQ-5 — CONFIRMED uniform** (T6): F05.4's transition-only rule scopes the
  authorize-input's `trustedBindings`; all six engine ops are state-bound effectful
  ops — uniform binding is REQUIRED-eligible and D17-consistent.
- **OQ-6 — CONFIRMED as proposed** (T6): `EFFECT_NOOP` = same-principal re-claim
  only; replay returns the recorded result verbatim, never re-coded; FK-P10 owns the
  assignment.
- **OQ-7 — RULED, minimal scope** (Out of Scope): no `wakeup_handoffs` semantics
  beyond preserving the FK-P9 column shape; the orphan-semantics gap is named for the
  exit annex (coordinator record propagation).
- **OQ-8 — CONFIRMED** (Allowed Files): A1 (correctness-adjacent) and A2
  (performance-only, not correctness-blocking) route as recorded FK-P9-owned
  amendments; the coordinator lands the FK-P9 amendment record + migration as a tiny
  predecessor before builder code.
- **OQ-9 — RULED**: `@foreman-line/kernel-lease` stands (short family name; README
  states the full lease+transition+idempotency scope).
- **OQ-10 — CONFIRMED as proposed; binding honesty** (T11/AC12): 4×50×1×3
  records-only; no comparative or baseline claim; the records state that they feed
  the deferred INF-6 baseline (stranded FK-P21 fragment).
- **OQ-11 — CONFIRMED** (T3): `LEASE_MAX_DURATION_MICROS = 86400000000` (24 h) with
  the amendment path (policy change = recorded spec amendment bumping the constant,
  the FK-P2 pin-bump pattern); owner policy may amend (RPO/RTO-row pattern).
- **Pin re-pin (coordinator, verbatim)** (Context & References): the exit-annex pin
  row binds `cceb32dd7c4979dd8d75bdf7e8aa53a63db17883331216d7e30fd590c49dfc11` —
  "re-pinned 2026-09-28 (coordinator, second advance) — `d2142ac7…` was superseded
  when the legacy status-vocabulary mapping remainder (A1/A2 boundary) landed; the
  committed-bytes rule held throughout the pin handshake".
