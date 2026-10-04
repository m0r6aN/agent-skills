---
ticket: GMF-P2C
title: Terminal recovery and settlement — reconciliation, lease recovery, append-only settlement, and verification primitives
status: active
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/specs/active/GMF-P2C-terminal-recovery-settlement.md
  - keon-systems/src/Keon.Verify/TerminalReconciliation.cs
  - keon-systems/src/Keon.Verify/ConcurrencyLeaseRecovery.cs
  - keon-systems/src/Keon.Verify/SettlementReconciliation.cs
  - keon-systems/src/Keon.Verify/OfflineVerificationPrimitives.cs
  - keon-systems/src/Keon.Verify/AccountingReadiness.cs
  - keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs
  - keon-systems/tests/Keon.Runtime.Tests/TerminalReconciliationTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/ConcurrencyLeaseRecoveryTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/SettlementReconciliationTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/OfflineVerificationPrimitivesTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/RecoveryNegativeControlsTests.cs
routing_class: architecture/risk
verification_class: equivalence-provable
permission_profile: builder-architecture
data_classification: internal
---

# GMF-P2C — Terminal recovery and settlement

## Intent

Build the charter's GMF-P2C outcome in `keon-systems` on the landed GMF-P2A store and
the GMF-P2B transaction (`charter.md:181`, `amendment-a1.md:25`, `:126`): **terminal
reconciliation** that drives every pending effect to exactly one terminal or quarantine
through the P2B two-outcome seam (S4: `CompletePendingEffect`/`RollbackPendingEffect`,
`AtomicEffectSpendTransaction.cs:647-663`) and never resurrects or re-spends permission
(`D21`/`P1-C108`); **lease recovery** that releases expired concurrency-slot leases
without un-consuming spend (`ConcurrencySlots.LeaseExpiresAtUtc` is the named P2C input,
`ReceiptPersistenceSchema.cs:537`); **append-only settlement** that refines unknown cost
without rewriting history (`D16`, `P1-C115`/`P1-C116`); and the **verification
primitives** the offline verifier consumes (`P1-C095`; P2C is the seam GMF-P8 builds
on). Recovery may expire leases and reconcile state but never resurrects or re-spends
permission (`amendment-a1.md:35-36`), and the no-go boundary is absolute: recovery
cannot reauthorize or replay (`charter.md:181`). No external effect occurs.

## Constraints

- The controlling authority is the ratified charter with Amendment A1, the loop
  directive, the closed plan-review findings, and the discovery record. The seven
  P1 frozen-contract records are byte-faithful contract targets (freeze rule in
  `gmf-p1-effect-descriptors.md`): the builder cites `P1-C###` IDs and never
  paraphrases them into weaker form. Any need to change a frozen clause, D1–D24,
  A1–A7, the phase graph, the seven receipt-type count, the three effect classes,
  or retry/no-fallback semantics is a STOP with a scoped Gate-1 amendment request.
- Charter invariants, binding without restatement: **D2** — only Runtime-issued
  `IPermission` is canonical authority; reconciliation, recovery, settlement, and
  verification record and derive state and confer nothing (`P1-C047`/`P1-C051`).
  **D6/A1-D6** (`charter.md:103`, `amendment-a1.md:25-36`) — "Terminal
  reconciliation records actual cost when authoritative evidence exists, or an
  explicit unknown/pending amount when it does not; unresolved cost retains the
  necessary reservation and blocks overspend until an append-only settlement,
  adjustment, or human resolution releases it. Recovery may expire leases and
  reconcile state but never resurrect or re-spend permission."
  **D16** (`charter.md:113`) — every effect records a durable denial or one
  terminal outcome; append-only settlement may refine unknown cost without
  rewriting history; seven receipt types (`P1-C101`). **D21** (`charter.md:118`,
  `amendment-a1.md:126-135`) — a satisfied spend is permanently consumed even
  when the effect fails, is ambiguous, or settles at zero; idempotency may return
  the recorded effect/receipt but never creates a second attempt; unknown
  post-send cost stays reserved until append-only settlement or human resolution.
  **P2C no-go** (`charter.md:181`): recovery cannot reauthorize or replay.
- The S4 handoff shape is frozen by the P2B delivery and this parcel composes it
  without altering it: for a pending effect the only lawful recovery outcomes are
  COMPLETE — `AtomicEffectSpendTransaction.CompletePendingEffect`
  (`AtomicEffectSpendTransaction.cs:653-654`, = `TryAppendTerminal`) — or
  ROLLBACK-OF-PENDING-STATE — `RollbackPendingEffect` (`:662-663`, =
  `TryQuarantineReservation`, reservation quarantined per `P1-C113`, slot lease
  left to expiry) (`GMF-P2B-atomic-spend-transaction.md:147-157`;
  `AtomicSpendCrashSafetyTests.cs:195-209`). In neither case is the permission
  un-consumed, resurrected, or re-spendable, and no second effect attempt or
  receipt may appear (`P1-C108`/`P1-C111`). Reconciliation itself was explicitly
  P2C's (`GMF-P2B-…:239-243`, `:638-639`, `:744-746`); there is no third outcome.
- Reconciliation outcome law (shaped here; evidence-bound, fail-closed):
  (1) authoritative outcome evidence exists → COMPLETE with the class-closed
  terminal the evidence supports (`P1-C103`–`P1-C105`), cost recorded as the
  settled amount or the explicit `FLEET_PENDING_UNKNOWN_COST` marker
  (`P1-C110`/`P1-C115`; A1-D6 "actual cost … or an explicit unknown/pending
  amount"); (2) authoritative evidence establishes the effect never occurred →
  ROLLBACK-OF-PENDING-STATE via the S4 seam; (3) no authoritative evidence either
  way → the effect stays pending and unresolved, readiness fails, and resolution
  comes only through append-only settlement/adjustment/human resolution
  (GMF-NEG-061's frozen expected result: "reconciliation holds reservation/state
  and fails closed … resolve only via append-only reconciliation/human"). A
  terminal is never minted from absent, summarized, or worker-claimed evidence
  (`P1-C095`/`P1-C123`). Duplicate/conflicting reconciliation is rejected with
  the original standing and per-event conflict evidence (`P1-C112`, landed store
  behavior `SqlitePermissionSpendLedger.cs:762-806`).
- **S3 schema discipline — no schema change.** `user_version = 2` stands and no
  ALTER, table, index, or trigger is added (`ReceiptPersistenceSchema.cs:454-471`
  promises the D6 validation shape "without an ALTER"; torn-schema refusal
  `:218`/`:371`). Every state P2C needs is carried by the landed v2 objects:
  lease input `ConcurrencySlots.LeaseExpiresAtUtc` (`:537-548`), quarantine state
  and its single permitted transition (`:516-532`, `:684-696`), terminals with
  cost XOR pending marker (`:607-623`), append-only settlements with
  `Kind IN ('settlement','adjustment','refund','human-resolution')` and
  `PriorSettlementId` lineage (`:626-643`), per-event denial receipts
  (`:588-604`), and the closed vocabularies (`:50-112`). One shape is NOT
  carried: re-acquiring a released lease under the same `(SlotScope, SlotIndex)`
  claim key — recorded as **GAP-P2C-01** below, never invented here.
- GAP-P2C-01 (lease claim key): `ConcurrencySlots` rows are immutable
  (`ReceiptPersistenceSchema.cs:698-701`) under `UNIQUE (SlotScope, SlotIndex)`
  (`:538-548`), and the landed slot-claim check treats any holder row as held
  (`SqlitePermissionSpendLedger.cs:617-623`) — so a claim key is permanently
  consumed once used, regardless of lease state. P2C therefore implements lease
  release as derived state (expired claims no longer count as held capacity;
  the orphaned effect is driven to reconciliation) and future effect paths claim
  fresh keys while admission counts only unexpired claims. Same-key reclaim is
  structurally impossible without a schema evolution; if a downstream parcel
  requires it, that is a GAP routed to a scoped P2A-v3 amendment — never a P2C
  schema change.
- Two named seam decisions (each surfaces a STOP flag below; the builder never
  resolves them silently): (i) **release-aware quarantine deny** — the landed
  quarantine deny blocks a budget scope forever (`SqlitePermissionSpendLedger.cs:559-566`)
  while `P1-C113`/A1-D6 require that append-only reconciliation "releases" the
  hold; P2C extends that check additively to deny only quarantined-and-unreleased
  reservations (behavior byte-identical wherever no release evidence exists —
  the state every landed test exercises, `AuthorityAccountingStoreTests.cs:295-309`,
  `AtomicSpendNegativeControlsTests.cs:891-909`); (ii) **P1-C102 vs the S4
  rollback branch** — `P1-C102` reads "exactly one terminal outcome (post-spend)"
  while the landed ROLLBACK seam appends no terminal; the shaped default follows
  the landed seam (rollback persists the quarantine transition plus a durable
  denial receipt per event — `FLEET_FAILED_POST_SPEND`/`FLEET_DENIED_RESERVATION_QUARANTINED`
  from the `P1-C071` closed set — and is never a success), with the terminal-
  required reading routed to the coordinator in the STOP flag.
- Closed vocabularies only: denial/failure/pending codes from `P1-C071` as pinned
  in `ReceiptPersistenceSchema.cs:50-78` (26 literals; P2C's operative codes:
  `FLEET_PENDING_UNKNOWN_COST` (`:76`, `P1-C073`), `FLEET_DENIED_TERMINAL_MISSING`
  (`:65`, NEG-061), `FLEET_DENIED_TERMINAL_CONFLICT` (`:66`, NEG-062),
  `FLEET_DENIED_RESERVATION_QUARANTINED` (`:67`, NEG-063),
  `FLEET_DENIED_COST_EVIDENCE_FORGED` (`:68`, NEG-064), `FLEET_DENIED_PRICING`
  (`:59`, NEG-021), `FLEET_FAILED_POST_SPEND` (`:74`, `P1-C076`)); terminal
  states only from `P1-C103`–`P1-C105` as pinned at `:80-112`. No new code,
  receipt type, terminal state, or effect class (`P1-C101`/`P1-C077`).
- P2A's and P2B's landed guarantees are immutable for this parcel:
  `IPermissionSpendLedger` semantics (`SqlitePermissionSpendLedger.cs:54`/`:69`),
  `TryBeginEffect`'s P1-C107 commit shape and its deny shapes (`:502-743`; the
  release-aware quarantine deny above is the single named exception),
  `TryAppendTerminal` (`:762`), `TryAppendSettlement` (`:861`),
  `TryQuarantineReservation` (`:954`), `RecordDenial` (`:985`), the append-only
  triggers (`ReceiptPersistenceSchema.cs:670-749`), the v1→v2 migration
  (`:393`), and the P2B transaction surface
  (`AtomicEffectSpendTransaction.cs` — byte-frozen, composed only). GMF-P2A's
  landed tests (`SqlitePermissionSpendLedgerTests.cs`,
  `AuthorityAccountingStoreMigrationTests.cs`, `AuthorityAccountingStoreTests.cs`,
  `SqliteControlledExecutionLedgerTests.cs`, `EffectPathDisabledTests.cs`,
  `LaunchExecutionCutoverTests.cs`) and GMF-P2B's landed tests
  (`AtomicEffectSpendTransactionTests.cs`, `AtomicSpendNegativeControlsTests.cs`,
  `AtomicSpendCrashSafetyTests.cs`, `EnvelopeNonAuthorityProofTests.cs`) must
  stay green byte-unmodified; any required edit to them is a STOP (spec
  amendment).
- The no-go boundary is absolute (`charter.md:181`): no code path starts a
  process tree, contacts a provider or MCP server, mounts source, or performs
  external I/O; recovery never consumes a permission, creates an attempt, or
  replays. Fixtures and test data are `synthetic/public` only (A1-D22); no
  credentials, tokens, PII, customer data, or non-synthetic source.
- Verdict/knowledge discipline: verification primitives trust canonical bytes,
  signatures where a ratified key provider exists (it does not — CARRIED
  `P1-C093`/`P1-C094`), and complete lineage — never gateway summaries or worker
  JSON (`P1-C095`); every substitution/comparison goes through an independent
  canonical-bytes comparator (`P1-C070`); component self-report proves nothing
  (`P1-C123`). Provider records are authoritative for cost/usage; measured
  evidence is corroboration only (`P1-C119`); forged claims are rejected and the
  cost stays unresolved (`P1-C114`); no silent currency conversion
  (`P1-C115`/`P1-C118`).
- Consume, never edit: `keon-contracts/` JSON contracts (status
  `contract_candidate_pending_conformance`), the seven P1 records, the five P0
  records, and all governing records. Environment hygiene: no provider/model/
  MCP call, workload/container/WSL/VM launch, secret access, or source
  disclosure; `dotnet restore` against configured package sources is the only
  permitted network use and is not a Fleet effect.

## Acceptance Criteria

- [ ] (a) **Terminal reconciliation** drives every pending effect to exactly one
  of the shaped outcomes in the Constraints outcome law: COMPLETE (exactly one
  terminal via the S4 seam, class-closed state `P1-C103`–`P1-C105`, exact
  `P1-C110` field list, cost settled-or-`FLEET_PENDING_UNKNOWN_COST`), ROLLBACK-
  OF-PENDING-STATE (via the S4 seam, reservation quarantined `P1-C113`, no
  effect claim, spend consumed), or fail-closed hold (stays pending, readiness
  fails, resolved only append-only). In every outcome: the permission stays
  consumed and is never resurrected or re-spendable (`D21`/`P1-C108`), zero
  second attempt/receipt/terminal appears (`P1-C111`/`P1-C112`), history is
  append-only, and repeated reconciliation is idempotent or conflict-rejecting
  with per-event evidence. Evidence-free success is structurally impossible.
- [ ] (b) **Lease recovery** releases expired concurrency-slot leases in the
  derived admission/readiness view WITHOUT un-consuming spend (`D21`) and
  WITHOUT mutating any row (`ConcurrencySlots` immutability,
  `ReceiptPersistenceSchema.cs:698-701`): expired claims stop counting as held
  capacity, unexpired claims still hold, and each recovered effect is driven
  into the (a) outcome flow. GAP-P2C-01 (same-key reclaim) is documented in
  code and evidence exactly as recorded above, and nothing in this parcel
  implies same-key reuse is possible.
- [ ] (c) **Append-only settlement** refines cost without rewriting history
  (`D16`/`P1-C116`): settlement/adjustment/refund/human-resolution appends only
  (`Kind` closed set, `PriorSettlementId` chain, `ReceiptPersistenceSchema.cs:626-643`);
  unknown cost stays reserved and blocks overspend until an append-only
  settlement, adjustment, or human resolution releases it (`P1-C115`, A1-D6);
  forged cost/usage claims are rejected with `FLEET_DENIED_COST_EVIDENCE_FORGED`
  evidence and the reservation stays unresolved (`P1-C114`, GMF-NEG-064);
  currency deviation denies `FLEET_DENIED_PRICING` with zero conversion writes
  (`P1-C118`, GMF-NEG-021); quarantined budget is released only by append-only
  reconciliation evidence and reuse before release denies
  (`P1-C113`, GMF-NEG-063); the derived cost-hold computation refines (settled
  amount supersedes reserved amount in the derived view) while every stored row
  remains byte-unchanged.
- [ ] (d) **Verification primitives** (the GMF-P8 seam) are pure, offline, and
  deterministic over record rows: lineage extraction (spend → attempt →
  pre-effect receipt → pending → terminal → settlement chain → denial linkage),
  canonical hash re-derivation support per `P1-C066`–`P1-C069` via
  `Keon.Canonicalization`, structural checks (terminal completeness `P1-C102`,
  one-terminal `P1-C112`, one-receipt-per-attempt `P1-C111`, closed
  vocabularies `P1-C071`/`P1-C103`–`P1-C105`, cost-state XOR `P1-C110`/`P1-C115`,
  settlement-chain integrity, replay linkage `P1-C106`, quarantine/release
  consistency `P1-C113`), and findings drawn from the closed code set — never
  acceptance (`P1-C123`) and never summary trust (`P1-C095`). Tampering or
  omission fails with durable-findable evidence; no signing verification is
  implemented (key provider CARRIED, `P1-C094`). The equivalence-provable claim
  holds: every primitive judgment agrees with an independent raw-SQL oracle on
  shared synthetic fixtures, and each check has a mutation control that fails
  when its invariant is broken.
- [ ] (e) **Readiness fails closed** (`P1-C113`; GMF-NEG-061/063): the readiness
  view fails while any effect is pending-unresolved, any post-terminal surviving
  reservation is un-quarantined (leaked), any quarantined reservation lacks
  release evidence, or any expired lease is unreconciled; it passes only when
  all are resolved, and it never treats worker JSON, gateway summaries, or
  success status as evidence (`P1-C123`). Negative controls cover every GMF-NEG
  row this parcel touches — GMF-NEG-018/019 (unknown cost retained, append-only
  settlement only), 021 (currency), 061 (missing terminal), 062 (conflicting
  terminal), 063 (leaked reservation), 064 (forged cost) — as
  failing-when-broken controls observed through the independent raw-SQL
  observer and the canonical-bytes comparator (`P1-C070`), never component
  self-report (`P1-C123`). The P3B observer halves of NEG-018/019/021/064
  remain NOT_TESTED until their parcel lands (P2A/P2B precedent); this parcel
  proves the reconciliation/settlement primitives they require.
- [ ] (f) **Recovery cannot reauthorize or replay** (`charter.md:181`), proven
  by deterministic negative control, not prose: exercising every surface this
  parcel adds leaves `PermissionSpendLedger`, `EffectAttempts`, and
  `PreEffectReceipts` row sets unchanged (zero new consumption/attempt/receipt),
  a consumed permission re-presented still denies `FLEET_DENIED_REPLAY` linked
  to its original record, and zero external side effects occur (no process
  tree, no provider/MCP/network call, no external mutation) — observed from an
  independent point. The schema is unchanged (`user_version = 2`, no ALTER);
  every code/terminal value is inside `P1-C071`/`P1-C103`–`P1-C105`; the P1
  hash-pinned contract records, the P0 records, and the governing records are
  byte-unmodified (SHA-256 re-verified at claim verification) and no
  `keon-contracts/` file changes (verified by `git diff` in both repositories).
- [ ] (g) The parcel changes exactly the Allowed Files in `keon-systems`; the
  existing test suite (including GMF-P2A's and GMF-P2B's landed tests
  byte-unmodified) plus the new tests are green under the verification commands
  below, the KEON005 analyzer enforcement commands are green, and
  `git diff --check` is clean.
- [ ] (h) Two fresh, independent, adversarial reviews (routing class
  Runtime/recovery/security per `charter.md:181`; reviews: 2) return verdicts
  with no unresolved Critical or High finding before the Gate-3 readiness chain;
  reviewers never fix or commit.

## Out of Scope

- GMF-P3B work: provider forwarding, cutoff, pricing snapshots/currency binding
  at spend time, provider-authoritative usage/cost evidence acquisition
  (`P1-C015`/`P1-C117`/`P1-C118`/`P1-C119`). P2C supplies settlement and
  measured-reconciliation primitives only; it contacts no provider.
- GMF-P4B/P4C work: source/overlay/patch manifest verification
  (`P1-C084` — observer implementation is P4B/P6/P8), materialization,
  process-tree control, and any execution path.
- GMF-P5 (MCP capability counters, `P1-C058`–`P1-C062`), GMF-P6 (promotion
  CAS/staging races `P1-C121`, replay linkage enforcement `P1-C122`).
- GMF-P8 implementation: the offline Fleet verifier, its fixtures, and
  independent acceptance. P2C provides the primitives P8 consumes; P8 composes
  and accepts them in its own parcel (and does not run the final proof it will
  judge). GMF-P9 E2E proof.
- Wiring into `ExecutionDispatcher`, `RuntimePermissionSpendGate`,
  `LaunchExecution`/`LaunchReadiness`, `AtomicEffectSpendTransaction.Execute`,
  or any KEON005-governed call path; integration happens with the effect-path
  parcels after P2C. The existing spend-gate path and verdict semantics are
  byte-unchanged.
- All external effects: worker execution, process-tree launch, source
  materialization, provider/model/MCP calls, patch promotion. The effect path
  stays disabled through GMF-P4B.
- Anything in `keon-mcp-gateway` (pre-dirty, out of bounds).
- Repository creation or protection (`GMF-HG-R1`), provider spend, private/
  internal source disclosure, patch promotion, merge, installation, deployment,
  publication, or Gate 3 (`charter.md:267` re-gate rule: P2C dispatch requires
  its own Gate 2).
- Signing, key-provider, or trust-bundle implementation (CARRIED,
  `P1-C093`/`P1-C094`); signature verification primitives stay with P8 and the
  carried key-provider decision.
- Any schema change: no ALTER, no new table/index/trigger, no `user_version`
  bump beyond v2; same-key lease re-acquisition (GAP-P2C-01) stays a GAP.
- New machine schemas in `keon-contracts/`, changes to any contract JSON or
  `Keon.Contracts` C# source, or new receipt types, terminal states, error
  codes, or effect classes.
- Editing charter, amendment, findings, discovery, loop directive, goal index,
  `model-fleet-v1`, any P0/P1 record, GMF-P2A's landed tests, GMF-P2B's landed
  tests, `AtomicEffectSpendTransaction.cs`, `ReceiptPersistenceSchema.cs`, or
  any other repository.

## Context & References

- `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md` (D6 at
  `:103`, D16 at `:113`, D21 at `:118`, parcel row `:181`, phase graph `:139`,
  gate table `:267`, exit criteria `:247-251`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md`
  (A1-D6 at `:25-36`, A1-D16 at `:92-103`, A1-D21 at `:126-135`, A1-D22 at
  `:137-145`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
  (ownership block `:3-17`; standing grants + pin-anchor ruling `:95-113`;
  queue P2C row `:159-162`; shaping discipline `:190-195`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md`
  (PR-04)
- `plugins/foreman-line/docs/goals/governed-model-fleet/discovery.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-effect-descriptors.md`
  (P1-C001–C020)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-source-environment-identities.md`
  (P1-C021–C045)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-envelope-and-admission.md`
  (P1-C046–C065)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-canonicalization-and-error-codes.md`
  (P1-C066–C078; P1-C071 closed vocabulary at `:27`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md`
  (P1-C079–C100; P1-C080/C081 at `:23`-`:24`, P1-C095/C096 at `:38`-`:39`,
  DR-006(a))
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-terminal-receipt-settlement.md`
  (P1-C101–C125)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-closure-evidence.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-contract-inventory.md`
  (CTR-010, CTR-011, CTR-015)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-threat-model.md`
  (B-006, B-008, B-009, B-010)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-permanent-negative-scenarios.md`
  (GMF-NEG-018/019/021/061/062/063/064)
- `plugins/foreman-line/docs/goals/goal-status-report-2026-09-27.md` §7
  (MRC-24 row at `:125`; MRC-22→MRC-23→MRC-24 sequencing at `:124`-`:125`)
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` (§4 frontmatter, §4.8
  Allowed-Files mutation authority)
- `plugins/foreman-line/docs/specs/active/GMF-P2A-runtime-authority-accounting-store.md`
  and its shaping-result (format precedent and landed-store contract)
- `plugins/foreman-line/docs/specs/active/GMF-P2B-atomic-spend-transaction.md`
  (landed-transaction contract; S4 handoff at `:147-157`; P2C scope at
  `:239-243`, `:638-639`, `:744-746`; base-reading STOP-flag precedent at
  `:336-355`)
- `keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
  (P2A store + P2B composition point: `SqliteAuthorityAccountingStore` `:474`,
  `TryBeginEffect` `:502`/`:514`, quarantine deny `:559-566`, slot-holder
  check `:617-623`, `TryAppendTerminal` `:762`, `TryAppendSettlement` `:861`,
  `TryQuarantineReservation` `:954`, `RecordDenial` `:985`, readbacks
  `:994-1133`)
- `keon-systems/src/Keon.Runtime/Observability/Persistence/ReceiptPersistenceSchema.cs`
  (v2 DDL and closed vocabularies `:36-112`, lease input note `:537`,
  append-only triggers `:670-749`, no-ALTER note `:466-468`)
- `keon-systems/src/Keon.Verify/AtomicEffectSpendTransaction.cs` (P2B S4 seam
  `:647-663`; verdict/denial mapping `:74-112`)
- `keon-systems/tests/Keon.Runtime.Tests/AuthorityAccountingStoreTests.cs`
  (raw-SQL observer pattern `:23-29`, `:85`; quarantine semantics `:295-309`,
  `:445-480`; append-only probes `:646-669`)
- `keon-systems/tests/Keon.Runtime.Tests/AtomicSpendCrashSafetyTests.cs`
  (`:195-209`), `AtomicSpendNegativeControlsTests.cs` (`:891-909`)
- `keon-systems/src/Keon.Verify/PermissionSpendVerifier.cs` (frozen check
  order `:71-72`, composition rule `:66-67`, KEO-172 `:113-119`),
  `Keon.Canonicalization/KeonCanonicalJsonV1.cs` (P1-C066 encoding)
- `keon-systems/.github/workflows/pr-validation.yml` (verification commands,
  KEON005 enforcement)

## Repository, Branch, and Worktree

| Item | Value |
|---|---|
| Repository | `D:/Repos/keon-omega/keon-systems` (remote `https://github.com/Keon-Systems/keon-systems.git`) |
| Base | the GMF-P2B builder-branch state: branch `codex/gmf-p2b-atomic-spend-20260928`, worktree `D:/Repos/agent-skills-worktrees/gmf-p2b-atomic-spend-keon-systems-20260928`, HEAD `7a6efe565d307cffca8abbae6273662b62ae8409` (landed GMF-P2A store commit) + uncommitted GMF-P2B delivery — see the base-reading STOP flag below |
| Builder branch | `codex/gmf-p2c-recovery-settlement-20260928` |
| Builder worktree | `D:/Repos/agent-skills-worktrees/gmf-p2c-recovery-settlement-keon-systems-20260928` — absent at shaping time (verified 2026-09-28); created only after explicit Gate 2 |

**Base-reading STOP flag (coordinator ruling required at Gate 2).** Two readings
of "the base" exist and this spec cannot choose between them (the same S1
branch-state base pattern as GMF-P2B, `GMF-P2B-…:336-355`):

1. **Branch-state reading (default above, per GMF sequencing):** P2C bases on the
   `codex/gmf-p2b-atomic-spend-20260928` state — the landed P2A store commit
   `7a6efe5` plus the P2B delivery — because `charter.md:181` makes GMF-P2B
   P2C's dependency and P2B's transaction/S4 seam is P2C's foundation
   (`AtomicEffectSpendTransaction.cs:647-663`).
2. **Merged-main reading:** P2C bases on `main` after the P2A/P2B chains'
   green-contingent Gate-3 merges (PRs only, never direct-to-main; charter
   standing authorizations 2026-09-27), so P2C builds on reviewed, merged bytes
   and its own PR chain composes cleanly against `main`.

Shaping-time observation (2026-09-28, `git log`/`git status` in the P2B
worktree): `codex/gmf-p2b-atomic-spend-20260928` HEAD is `7a6efe565d307cffca8abbae6273662b62ae8409`
(the GMF-P2A store commit — unlike P2B's shaping moment, the P2A delivery is now
committed) and the entire P2B delivery sits **uncommitted** in that worktree
(1 modified + 5 untracked files, exactly P2B's 6 Allowed Files: `M
src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
(+227), `?? src/Keon.Verify/AtomicEffectSpendTransaction.cs`, `??
tests/Keon.Runtime.Tests/{AtomicEffectSpendTransactionTests,
AtomicSpendCrashSafetyTests,AtomicSpendNegativeControlsTests,EnvelopeNonAuthorityProofTests}.cs`).
Neither reading can name a P2C base commit SHA until the P2B work reaches a
committed state (its own PR chain under the standing green-contingent grant),
and `main` is still `2b6c75536f50f125155ee697446cec89f70f2fec` with nothing of
the chain merged. The builder records the resolved base commit at Step 0; a base
that is an uncommitted worktree state is not a valid base.

## Contracts Consumed

Every P1 contract family reconciliation/recovery/settlement/verification binds,
as frozen clause IDs (links, not bodies). P2C derives and records state; it
never re-decides the contract.

| P1 family (frozen clauses) | P2C binding |
|---|---|
| Effect descriptors (P1-C001–C020) | Reconciliation binds outcomes to the recorded attempt's effect class, descriptor hash (`P1-C017`), and attempt ordinal (`P1-C009`/`P1-C010`) via `EffectAttempts`; cross-class terminal selection is denied by construction (`P1-C002`; class-closed terminal trigger `ReceiptPersistenceSchema.cs:727-739`) |
| Source/environment identities (P1-C021–C045) | Lineage verification reads the attempt's source/environment identity hash bindings (`P1-C021`/`P1-C027`); manifest verification itself is P4B |
| Envelope and admission (P1-C046–C065) | Consumed as P2B-landed: envelope fields never authorize (`P1-C047`/`P1-C051`), the `P1-C048` proof artifact stays valid, replay/audience linkage (`P1-C050`) is a verification-primitive check. No P2C surface accepts an envelope as evidence (`P1-C052`) |
| Canonicalization and error codes (P1-C066–C078) | All compared hashes are SHA-256 over `P1-C066` canonical bytes with `P1-C069` domain separation (via `Keon.Canonicalization`); every finding/denial value is a `P1-C071` closed-set code (`ReceiptPersistenceSchema.cs:50-78` pins the literals); comparator obligation (`P1-C070`); post-spend failure family (`P1-C076`) for reconciliation failure evidence |
| Artifact/evidence manifests (P1-C079–C100) | Terminal rows carry the evidence-manifest hash (`P1-C080`/`P1-C081`) and the verification primitives re-derive content addressing (`P1-C081`); signing/key-provider stays CARRIED (`P1-C094`); the offline trust rule (`P1-C095`) governs every primitive's inputs; durable-store shape (`P1-C096`) is the P2A foundation |
| Terminal, receipt, settlement (P1-C101–C125) | Seven receipt types, no new primitives (`P1-C101`); terminal completeness (`P1-C102`, NEG-061); closed terminal sets (`P1-C103`–`P1-C105`); denial durability + replay linkage (`P1-C106`); consumed-permission permanence across all recovery (`P1-C108`); terminal receipt fields (`P1-C110`); one receipt per attempt (`P1-C111`); conflicting-terminal rejection (`P1-C112`, NEG-062); leak quarantine + readiness (`P1-C113`, NEG-063); forged-cost rejection (`P1-C114`, NEG-064); unknown-cost reservation (`P1-C115`, NEG-018/019); append-only settlement (`P1-C116`); cutoff/pricing stay P3B (`P1-C117`/`P1-C118`, with NEG-021's currency guard enforced at settlement); provider-authoritative cost (`P1-C119`); non-acceptance (`P1-C123`); store-failure rule (`P1-C124`) |

Permanent negative conformance targets (`gmf-p0-permanent-negative-scenarios.md`,
rows whose observer/downstream names P2C): GMF-NEG-018/019 (unknown post-send
cost retained; append-only settlement only), GMF-NEG-021 (currency deviation:
no silent conversion, zero conversion writes), GMF-NEG-061 (missing terminal:
fail closed, readiness fails), GMF-NEG-062 (conflicting terminal: original
stands, conflict evidence persists), GMF-NEG-063 (leaked reservation:
quarantine + readiness refusal), GMF-NEG-064 (forged cost evidence: rejected,
settlement stays unresolved). All are NOT_TESTED as executions today; this
parcel makes the reconciliation/settlement halves executable (the P3B observer
halves stay NOT_TESTED).

## Integration Surfaces

- `SqliteAuthorityAccountingStore` (`keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs:474`):
  composed primitives — `TryBeginEffect` (`:502`/`:514`; behavior frozen except
  the named release-aware quarantine deny at `:559-566`), `TryAppendTerminal`
  (`:762` — the COMPLETE arm's engine), `TryAppendSettlement` (`:861` — the
  settlement engine), `TryQuarantineReservation` (`:954` — the ROLLBACK/leak-
  quarantine engine), `RecordDenial` (`:985` — per-event reconciliation
  evidence), readbacks `CreateBoundaryRead`/`GetEffectAttempt`/
  `GetPreEffectReceipt`/`GetPendingEffect`/`GetBudgetReservation`/
  `GetConcurrencySlot`/`GetTerminalReceipt`/`GetSettlements`/`GetDenialReceipts`
  (`:994-1133`). This file is modified **additively** only: (i) read-only scan
  readbacks for reconciliation (pending effects without terminals, expired-lease
  slot claims, reservations by scope/status), and (ii) the release-aware
  quarantine deny. `IPermissionSpendLedger` semantics, every other deny shape,
  and busy/lock retry behavior are preserved exactly.
- `AtomicEffectSpendTransaction` (`keon-systems/src/Keon.Verify/AtomicEffectSpendTransaction.cs`):
  byte-frozen; its S4 seam (`CompletePendingEffect` `:653-654`,
  `RollbackPendingEffect` `:662-663`) is the exact two-outcome handoff P2C
  composes. P2C adds no method to it and never bypasses it with a third outcome.
- `ReceiptPersistenceSchema` (`ReceiptPersistenceSchema.cs:29`): consumed
  unchanged — `Vocabulary` (`:36`: 26-code list `:50-78`, terminal sets
  `:80-112`, `PendingUnknownCostCode` `:114`, `TerminalConflictCode` `:120`,
  `ReservationQuarantinedCode` `:123`, `ReplayCode` `:126`,
  `IsTerminalStateForClass` `:139`), v2 DDL (`:454-750`), quarantine-only
  reservation transition (`:684-696`), append-only triggers (`:670-749`),
  torn-schema refusal (`:218`/`:371`), migration (`:393`). No ALTER (`:466-468`).
- New P2C surfaces in `Keon.Verify` (compose downward onto the store and the
  P2B seam; no upward reference): `TerminalReconciliation.cs` (outcome policy +
  drive), `ConcurrencyLeaseRecovery.cs` (lease expiry + derived slot capacity +
  GAP-P2C-01 documentation), `SettlementReconciliation.cs` (append-only
  settlement/refinement, derived cost holds, measured-reconciliation comparator,
  currency guard, quarantine-release evidence derivation),
  `OfflineVerificationPrimitives.cs` (the P8 seam), `AccountingReadiness.cs`
  (fail-closed readiness view). Future effect paths (P3B/P4B/P6) and P8 consume
  these; nothing in this parcel wires them anywhere.
- `PermissionSpendVerifier` / `RuntimePermissionSpendGate` /
  `DenyAllPermissionSpendGate` / `ExecutionDispatcher` / KEON005
  (`Keon.Analyzers.Authority/PermissionSpendAnalyzer.cs`): unchanged consumers;
  the KEO-172 point-of-no-return and trusted-clock rules stand.
  `Keon.Canonicalization` (`KeonCanonicalJsonV1.cs`): the P1-C066 encoding the
  primitives re-derive hashes through. MCP Gateway `RuntimeClient` fail-closed
  receipt custody: untouched (read-only reference).

## Data Class

`internal` engineering artifacts: code and `synthetic/public` test fixtures
only. No customer data, PII, credentials, regulated data, or private/internal
source. A1-D22 default-deny is preserved: nothing in this parcel transfers or
discloses source of any non-synthetic class.

## Environment Identity (build/test environment for verification)

| Element | Identity |
|---|---|
| Host | Windows 10.0.26200 x64 workstation (passive observation at shaping 2026-09-28; refreshed at builder Step 0) |
| Toolchain | .NET SDK 10.0.401 locally (observed `dotnet --list-sdks` 2026-09-28: 10.0.300-preview.0.26177.108, 10.0.303, 10.0.401); CI pins `dotnet-version: 10.0.x` with no `global.json` in `keon-systems` (`.github/workflows/pr-validation.yml`) |
| Solution / test stack | `Keon.sln`; xunit 2.9.3 + Moq under `tests/Keon.Runtime.Tests` (references `Keon.Runtime` and `Keon.Verify`, `Keon.Runtime.Tests.csproj:23-27`); `System.Data.SQLite.Core` 1.0.118 (WAL, `PRAGMA user_version`) |
| Verification commands | `dotnet restore Keon.sln -m:1 --nologo --verbosity minimal`; `dotnet build Keon.sln -m:1 --configuration Release --no-restore --nologo --verbosity minimal`; `dotnet test Keon.sln -m:1 --configuration Release --no-build --nologo --verbosity minimal`; `./scripts/verify-build-integrity.ps1`; analyzer enforcement: `dotnet restore src/Keon.Runtime/Keon.Runtime.csproj -m:1 --nologo --verbosity minimal`, `dotnet build src/Keon.Runtime/Keon.Runtime.csproj -m:1 --configuration Release --no-restore --nologo --verbosity minimal -warnaserror`, `dotnet test tests/Keon.Analyzers.Tests/Keon.Analyzers.Tests.csproj -m:1 --configuration Release --nologo --verbosity minimal` |
| Isolation tier | None claimed (MAP-011): recovery tests run as local file-based SQLite in temp paths with injected deterministic clocks; no container, WSL, or VM is used or eligible; no provider, network service, or gateway is contacted |

Environment-local green never upgrades another environment; evidence records the
exact host/toolchain identities above.

## Required Tests

1. **Reconciliation tests** (`TerminalReconciliationTests.cs`): the outcome law
   is executable — evidence-bound COMPLETE for every effect class (terminal
   states from `P1-C103`–`P1-C105`, cost settled-or-pending per `P1-C110`/
   `P1-C115`), no-effect ROLLBACK via the S4 seam (reservation quarantined,
   spend consumed), and fail-closed hold when no authoritative evidence exists
   (row sets unchanged, readiness fails). Each case proves: permission never
   un-consumed/re-spent (raw SQL over `PermissionSpendLedger`; replay still
   denies linked), zero second attempt/receipt/terminal (`P1-C111`/`P1-C112`),
   idempotent repeat reconciliation, and conflicting reconciliation rejected
   with per-event `FLEET_DENIED_TERMINAL_CONFLICT` evidence and the original
   standing (GMF-NEG-062). Mutation control: an evidence-free terminal path
   makes these tests fail.
2. **Lease-recovery tests** (`ConcurrencyLeaseRecoveryTests.cs`): expired lease
   releases derived capacity without touching spend/permission rows and without
   mutating `ConcurrencySlots` (raw SQL byte-comparison of slot rows before/
   after); unexpired leases still hold; each recovered effect lands in exactly
   one (a) outcome; GAP-P2C-01 asserted as documented behavior (same-key
   re-claim structurally rejected by `UNIQUE (SlotScope, SlotIndex)`) so no test
   or consumer can assume reclaim.
3. **Settlement tests** (`SettlementReconciliationTests.cs`): append-only
   refinement (settlement/adjustment/refund/human-resolution chain via
   `PriorSettlementId`; UPDATE/DELETE probes rejected; terminal and prior
   settlements byte-unchanged — `P1-C116`); unknown cost stays reserved and
   blocks overspend until release (`P1-C115`, GMF-NEG-018/019 shape: pending
   marker retained, no retry/fallback); forged cost/usage claims rejected with
   `FLEET_DENIED_COST_EVIDENCE_FORGED` evidence and the reservation unresolved
   (GMF-NEG-064); currency deviation denies `FLEET_DENIED_PRICING` with zero
   conversion writes (GMF-NEG-021); quarantined budget released only by
   append-only reconciliation evidence, reuse-before-release denies
   `FLEET_DENIED_RESERVATION_QUARANTINED` (GMF-NEG-063, P1-C113); the derived
   cost-hold refines while stored rows remain unchanged (D16).
4. **Verification-primitive and equivalence tests**
   (`OfflineVerificationPrimitivesTests.cs`): each structural check
   (completeness, one-terminal, one-receipt, vocabulary, cost XOR, chain
   integrity, replay linkage, quarantine/release consistency) has a
   passing-fixture and a tampered/omitted fixture that fails with a closed-code
   finding (`P1-C070` comparator, `P1-C095` trust rule); the equivalence suite
   runs shared synthetic fixtures through the primitives and through an
   independent raw-SQL oracle (including derived readiness/cost-hold
   computations) and fails on any divergence (the `verification_class:
   equivalence-provable` proof); mutation control per check.
5. **Negative controls** (`RecoveryNegativeControlsTests.cs`): GMF-NEG-018/019/
   021/061/062/063/064 as failing-when-broken transaction-level controls mapped
   to the P0 record's named state/zero assertions (e.g. GMF-NEG-061: "consumed;
   reservation held; readiness fails", zero accepted success; GMF-NEG-063:
   "reservation quarantined", zero reuse of leaked budget; GMF-NEG-064: zero
   settlement on forged numbers) — plus the AC(f) recovery-cannot-reauthorize-
   or-replay control: exercising every P2C surface leaves
   `PermissionSpendLedger`/`EffectAttempts`/`PreEffectReceipts` row sets
   identical and produces zero external side effects, observed from outside the
   component under test. Where a scenario's environment/process-tree half needs
   P4B/P5/P6 observers it stays NOT_TESTED (P2A/P2B precedent); this parcel
   proves the reconciliation primitives it requires.
6. **No-regression**: the entire existing suite — GMF-P2A's six landed test
   files and GMF-P2B's four landed test files byte-unmodified — plus the
   KEON005 analyzer suite (`tests/Keon.Analyzers.Tests`, real-source compile +
   canary mutation) remain green. The release-aware quarantine deny must be
   behavior-identical in every state the landed tests exercise (no release
   evidence present); any landed-test breakage is a STOP.

Tests must fail when their named invariant is broken (mutate the fixture to
prove each assertion binds); passing alone is not evidence.

## Independent Observation Points

- **DB-level observer (primary):** raw SQL over a separate SQLite connection
  that never calls the API under test — the P2A test family's pattern
  (`AuthorityAccountingStoreTests.cs:23-29`, `:85`): direct SELECT over
  `PermissionSpendLedger`/`EffectAttempts`/`BudgetReservations`/
  `ConcurrencySlots`/`PreEffectReceipts`/`PendingEffects`/`TerminalReceipts`/
  `Settlements`/`DenialReceipts`, `sqlite_master` UNIQUE/PK/trigger presence,
  `foreign_key_check`, before/after row-set and byte comparison for
  immutability claims (slot rows, terminals, settlements, spend rows), and
  post-recovery replay probes.
- **Canonical-bytes comparator (P1-C070):** forgery/currency/tamper controls
  compare recomputed canonical bytes and hashes through a comparator
  independent of the requestor; self-report never proves equality.
- **Equivalence observer:** the equivalence suite (Required Tests 4) observes
  agreement between the primitives' judgments and the independent raw-SQL
  oracle on shared fixtures — the `verification_class: equivalence-provable`
  proof.
- **Diff/hash observer (coordinator):** `git diff --name-only` ⊆ Allowed Files,
  `git diff --check`, and byte-integrity re-verification of the 11 governing/P0
  records (6 governing + 5 P0) plus the 7 P1 records at claim verification
  (pin anchor per the loop-directive coordinator ruling 2026-09-27,
  `loop-directive.md:102-106`: the goal records are git-tracked in
  `agent-skills`, so byte-integrity is proven by `git diff`/`git status`
  showing zero builder-attributable change, with SHA-256 captured at builder
  Step 0 into the closure record as baseline).
- **Compiler-analyzer observer:** KEON005 enforcement (independent of the test
  suite) plus its canary test proving the harness fires if spend-gate dominance
  is bypassed.
- **Effect-path/recovery observer:** the zero-external-effect and
  recovery-cannot-reauthorize observations at AC(f) are made from outside the
  component under test (raw SQL proving the durable ledger row sets are the
  only state, plus a static/absence check of launch/provider surfaces in the
  diff); component self-report never proves zero effect (`P1-C123`; P0 observer
  rule).

## Verification Plan

Builder Step 0 restates this spec, exact Allowed Files, repository/base/branch/
worktree (including the resolved base commit under the base-reading ruling), the
prohibited actions, the two named seam decisions' dispositions, and known
blockers, then stops for coordinator ruling before implementation. Any hash,
HEAD, owner, or file-state mismatch is a stop.

Required deterministic checks after the builder claim:

1. Re-verify repository identity (base commit, branch, worktree), the 11
   governing/P0 records and the 7 P1 records against their git-tracked bytes
   and the Step-0 SHA-256 baseline; record any builder-attributable drift as a
   stop (coordinator record-maintenance edits per the loop directive are not
   drift).
2. Prove `git diff --name-only` ⊆ Allowed Files in `keon-systems` and that
   `agent-skills`, `keon-mcp-gateway`, `keon-contracts/`, GMF-P2A's and
   GMF-P2B's landed test files, `AtomicEffectSpendTransaction.cs`,
   `ReceiptPersistenceSchema.cs`, and every governing/P0/P1 record show zero
   change.
3. Run the Environment Identity commands; record pass/fail per command.
4. Run the raw-SQL observation scripts for AC(a)–(f) (reconciliation row sets,
   lease byte-comparisons, settlement append-only probes, tamper/omission
   fixtures, the recovery-cannot-reauthorize control) and record outputs
   verbatim.
5. Prove AC(f)'s byte-integrity clause by hash/diff (coordinator-side, not a
   shipped byte-pin test).
6. Run two fresh independent adversarial reviews (Runtime/recovery/security
   class; reviews: 2); reconcile findings as fix, accept-as-documented, or
   informational; any unresolved Critical/High forces HOLD.

Mandatory reviewer focus questions:

- Can any reconciliation, lease-recovery, or settlement path un-consume,
  resurrect, or re-spend a permission — or create a second attempt, receipt, or
  terminal (`D21`/`P1-C108`/`P1-C111`/`P1-C112`)?
- Is the outcome space exactly COMPLETE / ROLLBACK-OF-PENDING-STATE / fail-
  closed hold, with no fourth path — and does any path mint a terminal from
  absent, summarized, or worker-claimed evidence (the evidence-free-success
  trap, `P1-C095`/`P1-C123`)?
- Does the P1-C102-vs-S4-rollback tension get dispositioned per the STOP flag,
  or silently resolved in code?
- Does lease release restore capacity without mutating any row or spend — and
  is GAP-P2C-01 (same-key reclaim structurally impossible) honestly documented
  rather than papered over?
- Does the release-aware quarantine deny preserve byte-identical behavior in
  every state the landed tests exercise, deny unreleased quarantined reuse
  (`P1-C113`), and release only on genuine append-only reconciliation evidence?
- Does settlement ever rewrite a terminal/prior settlement, convert currency
  silently, accept forged cost/usage claims, or release unresolved cost
  (`P1-C114`/`P1-C115`/`P1-C116`/`P1-C118`)?
- Are the verification primitives genuinely offline and deterministic, do they
  trust canonical bytes and lineage only, and do the tamper/omission fixtures
  fail when a check is weakened?
- Does readiness fail closed on every unresolved/leaked/quarantined state and
  refuse worker JSON/gateway summaries/success status as evidence (NEG-061/063,
  `P1-C123`)?
- Do the negative controls observe from independent points and cover all seven
  GMF-NEG rows this parcel touches, with the P3B halves explicitly NOT_TESTED?
- Does anything touch a schema object, `user_version`, KEON005, the KEO-172
  rules, a P2A/P2B landed test, or a file outside Allowed Files (post-review
  git-detection control)?

## Allowed Files

Only these exact `keon-systems` repository-relative paths may be created or
changed for GMF-P2C (no globs, no directory shorthand; any other path is a stop
until a coordinator-ratified spec amendment names it):

- `src/Keon.Verify/TerminalReconciliation.cs` — NEW: the reconciliation outcome
  law (evidence classification → COMPLETE via `CompletePendingEffect` /
  ROLLBACK-OF-PENDING-STATE via `RollbackPendingEffect` / fail-closed hold),
  idempotent and conflict-rejecting, cost settled-or-pending.
- `src/Keon.Verify/ConcurrencyLeaseRecovery.cs` — NEW: lease expiry detection
  and derived slot-capacity release (no row mutation, no spend change), orphan
  drive into reconciliation, GAP-P2C-01 documentation and structural assertion.
- `src/Keon.Verify/SettlementReconciliation.cs` — NEW: append-only
  settlement/adjustment/refund/human-resolution logic, derived cost-hold
  resolution (refine-not-rewrite), measured-reconciliation comparator
  (forged-cost rejection), currency guard, quarantine-release evidence
  derivation.
- `src/Keon.Verify/OfflineVerificationPrimitives.cs` — NEW: the GMF-P8 seam —
  lineage extraction and structural/canonical verification primitives returning
  closed-code findings, offline and deterministic.
- `src/Keon.Verify/AccountingReadiness.cs` — NEW: the fail-closed readiness view
  (blockers: pending-unresolved, leaked, quarantined-unreleased, expired-
  unreconciled).
- `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs` —
  additive only: (i) read-only scan readbacks for reconciliation, (ii) the
  release-aware quarantine deny at `:559-566` (deny quarantined-and-unreleased;
  behavior byte-identical absent release evidence). All other methods, deny
  shapes, and `IPermissionSpendLedger` semantics are frozen by usage.
- `tests/Keon.Runtime.Tests/TerminalReconciliationTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/ConcurrencyLeaseRecoveryTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/SettlementReconciliationTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/OfflineVerificationPrimitivesTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/RecoveryNegativeControlsTests.cs` — NEW.

The shaping file for this spec in `agent-skills` (this spec) is shaping-owned
and remains read-only to the builder. Shaping note: this spec was produced under
a single-file shaping contract and ships without a companion
`gmf-p2c-terminal-recovery-settlement.shaping-result.json`; the coordinator
generates that record if the dispatch flow requires it (the P2A shaping-result
format is the precedent).

## Forbidden

- Editing anything outside the Allowed Files: other `keon-systems` sources
  (including `Keon.Contracts` C#, `ReceiptPersistenceSchema.cs`,
  `AtomicEffectSpendTransaction.cs`, `PermissionSpendVerifier.cs`,
  `RuntimePermissionSpendGate.cs`, `ExecutionDispatcher.cs`, `LaunchExecution.cs`,
  `LaunchReadiness.cs`, all of GMF-P2A's and GMF-P2B's landed test files),
  `keon-contracts/`, `.github/`, `scripts/`, `docs/`, project files (unless a
  stop-and-report names the need), or any file in `agent-skills`,
  `keon-mcp-gateway`, or a future Fleet repository.
- Touching, cleaning, resetting, stashing, committing into, or deleting the P2B
  builder worktree `gmf-p2b-atomic-spend-keon-systems-20260928`, the P2A
  worktree `gmf-p2a-store-keon-systems-20260927`, any `_wt-*` / `_worktrees/` /
  `.claude/worktrees/` worktree, or any user-owned dirty file.
- Enabling any effect path; un-consuming, resurrecting, or re-spending a
  permission; replaying an effect; adding a third recovery outcome; relaxing
  KEON005 or any fail-closed gate; rewriting append-only history; altering the
  v2 schema or `user_version`; adding receipt types, terminal states, error
  codes, or effect classes.
- Building GMF-P3B/P4B/P4C/P5/P6/P8 behavior (provider evidence acquisition,
  cutoff, manifest verification, MCP counters, promotion CAS, verifier
  implementation/acceptance) past the primitives P8 consumes.
- Provider/model/MCP calls, network activity beyond `dotnet restore`,
  workload/container/WSL/VM launches, credential access, and source disclosure.
- Any commit, push, PR, merge, or deployment (the standing green-contingent PR
  grant covers parcel/closure PRs presented by the coordinator, never
  direct-to-main pushes; nothing in this parcel authorizes the builder to push).

## Collision Risk and Sequencing

Collision risk is **medium** at the base-state surface and **medium** at the
write-set surface, verified 2026-09-28:

- **Base-state dependency (MEDIUM):** P2C's base is the P2B delivery, which at
  shaping time is uncommitted in `gmf-p2b-atomic-spend-keon-systems-20260928`
  (1 modified + 5 untracked files at HEAD `7a6efe5`, exactly P2B's 6 Allowed
  Files). Until the P2B chain reaches a committed state there is no valid P2C
  base commit (base-reading STOP flag above). The P2B and P2A worktrees are
  evidence state: OFF-LIMITS to the P2C builder.
- **Write-set overlap (MEDIUM):** `src/Keon.Runtime/Observability/Persistence/
  SqlitePermissionSpendLedger.cs` is both P2B's live (uncommitted) delivery
  surface and P2C's additive surface. The builder must serialize against the
  P2B writer and stops if that file changes under it mid-parcel. The remaining
  ten Allowed Files are new files with no live-writer risk; no other writer on
  `src/Keon.Verify/**` or `tests/Keon.Runtime.Tests/**` was observed
  2026-09-28.
- **Sibling/goal collision (LOW):** the GMF chain is serial
  (MRC-22→MRC-23→MRC-24, `goal-status-report-2026-09-27.md:124-125`), in
  separate Keon repositories from Lane G and the `agent-skills` doc/package
  goals; no contested writes with any concurrently dispatched sibling.
- **Stale/other worktrees (LOW, OFF-LIMITS, `git worktree list` verified
  2026-09-28):** main worktree `D:/Repos/keon-omega/keon-systems` (HEAD
  `2b6c755`, one tracked tool-metadata modification `M .serena/project.yml` —
  not a write target); `gmf-p2a-store-keon-systems-20260927` (clean at
  `7a6efe5`); `gmf-p2a-shaping-20260916` (agent-skills-side shaping worktree);
  `_worktrees/tail-keon-systems-201` (`4c9061a`, detached) and
  `_worktrees/tail-keon-systems-202` (`b22fccf`, detached) on unrelated
  branches. The `gmf-p2a-store-keon-systems-20260916` worktree recorded in the
  GMF-P2A spec is **absent** (also verified by GMF-P2B on 2026-09-28); its
  parked diff disposition remains an owner/coordinator item if it reappears —
  this parcel neither consumes nor restores it. `keon-mcp-gateway` remains
  pre-dirty on `.serena/project.yml` and out of bounds.

Sequencing: the builder works only in the named 20260928 worktree; serializes
against any live writer appearing on `src/Keon.Runtime/**`, `src/Keon.Verify/**`,
or `tests/Keon.Runtime.Tests/**`; and stops if the P2B base state changes
mid-parcel, any listed worktree becomes dirty on an Allowed File, or another
writer claims an Allowed File.

## Rollback and Cleanup

- P2C is additive code over the unchanged v2 schema: rollback is removal of the
  five new `Keon.Verify` surfaces and the additive store extension, leaving
  every P2A/P2B row, table, trigger, and guarantee intact and inert. There is
  no destructive down-migration and no data migration in this parcel.
- Reconciliation/settlement appends are append-only evidence, never rollback
  targets (`P1-C112`/`P1-C116`); a rolled-back parcel leaves any test-created
  rows in test databases only (temp paths, deleted on dispose including
  `-wal`/`-shm` files). Cleanup must never erase assertion evidence (a cleanup
  that hides a failed assertion fails the scenario); tamper/crash fixtures
  preserve their databases for raw-SQL observation before cleanup.
- Post-acceptance cleanup is Stage-F coordinator work: only the parcel-owned
  worktree/branch may be removed, and only after the closure record exists.
  Pre-existing worktrees (including the P2A/P2B worktrees) and user-owned
  changes are never deleted or reset.

## Evidence and Handoff

The builder handoff must contain: starting and ending base commit and branch;
the resolved base-reading ruling with its commit SHA and the dispositions of the
two named seam decisions; exact files changed with SHA-256 and line counts;
every command run with verbatim output (restore/build/test/analyzer/build-
integrity); the raw-SQL observation outputs for AC(a)–(f) including
before/after row sets and byte-comparisons (slots, terminals, settlements,
spend); the reconciliation outcome table as implemented; the derived cost-hold
and readiness rules as implemented; the GAP-P2C-01 statement as documented in
code; test names mapped to every acceptance criterion and every GMF-NEG
control; `git diff --name-only` and `git diff --check` outputs; and the
untouched-state confirmation for the Collision Risk worktrees and landed test
files. The coordinator assembles
`plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p2c-closure-evidence.md`
at claim verification (coordinator authority; not builder authority). No
receipt is minted, and nothing in the evidence grants Gate 2, Gate 3, or any
external effect.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a governing-record/P0/P1 hash, repository HEAD, branch, worktree state, owner,
  or instruction conflicts with this spec, or the base-reading ruling is absent
  at Step 0, or the resolved base is an uncommitted worktree state;
- the disposition of either named seam decision (release-aware quarantine deny;
  P1-C102-vs-S4-rollback) is absent at Step 0, or implementing it would require
  weakening a landed deny shape beyond the named exception, or a recovery path
  would un-consume, resurrect, re-spend, or replay a permission;
- a P1-C101–C125 state/field/vocabulary need cannot be represented with the
  landed v2 schema and store primitives as shaped (record it as a GAP note —
  GAP-P2C-01's pattern — and do not invent a contract or alter the schema);
- implementation would require a file outside Allowed Files, any GMF-P2A/GMF-P2B
  landed test edit, an `AtomicEffectSpendTransaction.cs` or
  `ReceiptPersistenceSchema.cs` edit, a `keon-contracts/` or `Keon.Contracts` C#
  edit, a schema ALTER/migration, signing/key-provider work (CARRIED), or any
  P1-C### change;
- any test would need a non-synthetic fixture, a secret, a network service, a
  provider/model/MCP call, or a workload/container/VM launch;
- the effect path would need to be enabled, a third recovery outcome would be
  required, or the recovery-cannot-reauthorize / zero-external-effect /
  immutability claims cannot be observed independently;
- GMF-P3B/P4B/P5/P6/P8 behavior would be pulled into this parcel (evidence
  acquisition, cutoff, manifest verification, MCP counters, promotion CAS,
  verifier implementation/acceptance);
- KEON005, a fail-closed gate, an append-only guarantee, or the KEO-172
  point-of-no-return/trusted-clock rules would need weakening; or
- any wording would read as granting Gate 2, repository creation, disclosure,
  spend, promotion, merge, installation, deployment, publication, or Gate 3.

On stop: preserve partial evidence, set the closure recommendation to `HOLD`,
name the exact decision/evidence/authority required, and return control to the
coordinator.
