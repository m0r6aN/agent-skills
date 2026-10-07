---
ticket: GMF-P2A
title: Durable Runtime authority/accounting store and migration
status: draft
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md
  - plugins/foreman-line/docs/specs/active/gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# GMF-P2A — Durable Runtime authority/accounting store and migration

## Intent

Build the durable Runtime authority/accounting store and its versioned
migration on the ratified SQLite ledger line (DR-006(a), P1-C093), so later
parcels can implement the atomic spend transaction (P2B) and terminal
reconciliation/recovery (P2C) against tables that already persist spends,
reservations, pending-effect state, pre-effect receipts, terminals, and
settlements with uniqueness/isolation guarantees. This parcel creates store
shape plus migration only; it wires no spend transaction, performs no effect,
and enables no allow path.

## Constraints

- The controlling authority is the ratified Governed Model Fleet charter as
  amended by A1, the closed plan-review findings (PR-04 split), the discovery
  record, and the loop directive, at the exact shaping-time SHA-256 pins
  listed below, plus the seven landed P1 contract records as read-only
  hash-pinned inputs. A hash mismatch is drift to reconcile, not permission
  to reinterpret canon.
- GMF-P2A is the first third of PR-04 only: durable state/migration. It must
  not implement the P2B atomic validation/spend/reservation/concurrency/
  pending-effect/pre-effect-receipt transaction, nor the P2C terminal
  reconciliation/lease recovery/settlement/verification primitives. Any need
  for P2B/P2C behavior inside P2A scope is a STOP, not a quiet expansion.
- DR-006(a) direction is fixed: extend the SQLite ledger line
  (P1-C093–P1-C096 stand). Key-provider selection stays CARRIED per P1-C093–
  P1-C094; P2A must not choose, wire, or imply a key provider, trust root,
  signer, or production key-protection boundary. No VM, provider, model,
  pricing-source, or persistence-technology choice beyond the SQLite-extend
  direction.
- The effect path stays disabled (charter P2A no-go boundary). P2A must not
  touch, rewire, or behaviorally change `ExecutionDispatcher`,
  `PermissionSpendVerifier`, `ControlledExecutionHandler`, `LaunchAuthority`,
  `LaunchExecution`, `Program.cs` composition, or any `IPermission`/
  `IPermissionSpendLedger` contract surface. Existing `TryRecordSpend`
  external contract is preserved; the change is additive store shape plus
  migration.
- No frozen canon may change under GMF-P2A authority: D1–D24 as amended by
  A1, A1–A7, the GMF-P0–P9 graph, the seven receipt-type count, the three
  effect classes, retry/no-fallback semantics, P1-C001–P1-C125 frozen clauses,
  or any P0-frozen ID (MAP-001–014, CTR-001–015, B-001–010, T-001–T-013,
  GMF-NEG-001–066, DR-001–010 meanings). Any store answer that requires such
  a change is a STOP with a scoped Gate-1 amendment request, never a silent
  edit.
- Canonical encoding is the RESOLVED P1-C066 standard (UTF-8, RFC 8785 JSON
  canonicalization, SHA-256) with the P1-C071 closed error-code vocabulary.
  No new code, hash function, or domain-separation literal is introduced.
  `BLOCKED_UNRATIFIED_ERROR_CODE` appears nowhere except quoted P0/P1
  history.
- No provider/model/MCP call, workload process, container, WSL distribution,
  or VM may be launched. No network probe, package installation, dependency
  resolution, credential access, source upload, source disclosure, paid
  action, promotion, merge, installation, deployment, publication, or Gate 3
  is allowed. SQLite work runs only against temp-file databases created by
  the tests; no authoritative or shared database file is touched.
- Data class is `internal`: governance metadata (permission identifiers,
  spend indexes, timestamps, reservation/pending/receipt/terminal/settlement
  rows) plus synthetic test identifiers only. No credentials, tokens,
  customer data, PII, internal endpoints, secrets, or copied proprietary
  source appears in code, tests, or evidence. Test permission IDs are
  synthetic (`perm-*` analogues); never real permission material.
- `status: draft` is mandatory until coordinator lint and an explicit human
  Gate-2 decision. A passing advisory self-check or a `READY` recommendation
  never flips status or grants dispatch.

## Acceptance Criteria

- [ ] The keon-systems store change extends `SqlitePermissionSpendLedger`
  additive-only: existing `PermissionSpendLedger` table, `(PermissionId,
  SpendIndex)` PRIMARY KEY, WAL journal mode, busy-timeout, and
  `TryRecordSpend`/`GetSpendCount` external contract are preserved. It adds
  exactly the v2 tables, columns, keys, foreign keys, and indexes defined in
  **V2 Storage Contract** below. `PRAGMA foreign_keys = ON` is set for every
  connection that creates or uses v2 rows. No row is ever deleted,
  decremented, or replaced: ordinary `UPDATE`/`DELETE`, `INSERT OR REPLACE`,
  `REPLACE INTO`, and UPSERT conflict paths preserve the original row; spend
  remains the point of no return (P1-C108).
- [ ] Schema is versioned with the explicit state policy and one-transaction
  `v1 → v2` protocol in **Migration Contract** below: fresh init yields
  `user_version = 2` with the full v2 shape; init over a populated canonical
  v1 database preserves every pre-existing spend row byte-faithfully and then
  presents the v2 shape; re-running init/migration is safe from independent
  SQLite connections and real separate test-host processes. Unknown, future,
  malformed, and partial states reject before DDL. A deterministic injected
  DDL failure at every injection point rolls back every v2 DDL change, leaves
  a canonical v1 database byte-preserved, and commits no version change or
  effect.
- [ ] All pre-existing `SqlitePermissionSpendLedgerTests` pass unmodified
  (no edits to that file under P2A authority); the new migration/store test
  file proves: v1-row preservation, fresh-v2 shape, idempotent re-run,
  WAL + `user_version` posture, cross-instance durability (restart
  analogue), concurrent single-use/multi-use races still admit exactly the
  valid set with sequential unique indexes (P1-C120), and uniqueness
  enforcement on every new table (duplicate insert rejected, original
  stands).
- [ ] Effect-path-stays-disabled is proved, not asserted: `git diff
  --name-only` is a subset of Allowed Files; `ExecutionDispatcher`,
  `PermissionSpendVerifier`, `ControlledExecutionHandler`,
  `LaunchAuthority`, `LaunchExecution`, `Program.cs`, and all
  `Keon.Contracts` surfaces are byte-identical to base; no new call to
  `handler.ExecuteAsync`, `VerifyAndSpend`, or ledger-append-then-execute
  wiring exists; existing spend-denied/fail-closed tests still pass.
- [ ] Independent observation (not ledger self-report): every new-table
  durability/uniqueness claim is corroborated by a raw-SQL read over a
  separate connection (independent of the ledger instance under test)
  asserting row presence, counts, and constraint behavior; migration
  preservation is corroborated by a pre-migration snapshot (row dump +
  hashes) compared against post-migration raw reads.
- [ ] The parcel changes only the exact Allowed Files across both repos. The
  coordinator verifies the base-to-working-tree diff (including staged and
  unstaged changes), the untracked-file inventory, and unchanged forbidden
  paths against the pinned base; `git diff --check` is clean in each repo,
  factual claims reconcile to local evidence, and the spec/advisory lint
  remains green. No glob, directory shorthand, cache, log, receipt, temp DB,
  or generated artifact is mutation authority.
- [ ] No output makes GMF-P2B/P2C dispatchable or represents that **any** P2A
  Gate 2 has been granted. Repository creation, provider spend, source
  disclosure, promotion, merge, installation, deployment, publication, and
  Gate 3 remain separately withheld.
- [ ] Two fresh, independent, read-only runtime/data/security reviewers
  assess the exact keon-systems diff plus this spec with no builder context
  and return explicit verdicts. No unresolved Critical, High, or
  decision/graph-changing finding may remain before a Gate-2 readiness
  recommendation; reviewers do not fix, commit, call providers, launch
  workloads, or mutate external state.

## Out of Scope

- The P2B atomic transaction: validation ordering, revocation/expiry/
  descriptor/audience/nonce/policy/lineage checks wired to the new tables,
  atomic consumption + reservation + slot-acquisition + pre-effect receipt +
  pending-effect commit, and race/concurrency semantics beyond preserving the
  existing `TryRecordSpend` reservation guarantee. P2A adds tables; P2B
  makes them transactional.
- The P2C surface: terminal reconciliation, lease expiry/recovery,
  settlement/adjustment/refund appends, reservation quarantine/release,
  forged-cost rejection wiring, conflicting-terminal handling, and
  verification primitives. P2A persists the rows those parcels will append;
  it does not implement their logic.
- Any change to the effect path: dispatcher gating, verifier logic,
  handler behavior, launch authority/execution composition, capability
  wiring, rate limiting, or production signer/key-provider host wiring.
  The allow path remains mechanically absent/disabled through GMF-P4B per
  A1-D17.
- Choosing or provisioning a key provider, trust root, signing root, VM,
  container, WSL distribution, hypervisor, enforcement plane, service
  identity, provider, model, pricing source, durable production database
  location, or production environment (DR-003/DR-006-remainder/DR-009
  carried). P2A tests use temp-file SQLite only.
- Changing A1–A7, D1–D24 as amended, the GMF-P0–P9 graph, receipt-type
  count, effect classes, retry/no-fallback semantics, P1 frozen clauses, or
  any frozen/candidate contract or P0-frozen ID. Such a need is a STOP with
  a scoped Gate-1 amendment request, not a P2A edit.
- Machine contract schemas, gateway/executor/MCP/Promotion Actuator/
  foreman/verifier work, E2E proof, benchmarks, performance tuning, or
  production deployment/operation of the store.
- Editing the charter, amendment, findings, discovery, loop directive, goal
  index, any file under `model-fleet-v1`, any P0/P1 output file, or any
  product repository path outside Allowed Files.

## Context & References

- `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md` (P2A
  row; D6 as amended by A1: "Runtime owns the one durable transaction
  boundary")
- `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md`
  (A1-D6 atomic boundary; A1-D16 settlement; A1-D21 consumed-spend rule)
- `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md`
  (PR-04: P2 split into durable state/migration, atomic spend, terminal
  reconciliation — P2A is the first third)
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
  (per-parcel algorithm steps 2–3: what a shaped spec must name)
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` (schema; Allowed Files
  mutation authority)
- `plugins/foreman-line/docs/specs/active/GMF-P1-effect-source-environment-evidence-contracts.md`
  (Allowed-Files/shape precedent)
- P1 frozen records (read-only, hash-pinned, all under
  `plugins/foreman-line/docs/goals/governed-model-fleet/`):
  `gmf-p1-effect-descriptors.md` (P1-C001–C020),
  `gmf-p1-source-environment-identities.md` (P1-C021–C045),
  `gmf-p1-envelope-and-admission.md` (P1-C046–C065),
  `gmf-p1-canonicalization-and-error-codes.md` (P1-C066–C078),
  `gmf-p1-artifact-evidence-manifests.md` (P1-C079–C100, esp. DR-006(a)
  P1-C093–P1-C096), `gmf-p1-terminal-receipt-settlement.md` (P1-C101–C125,
  esp. P1-C107/C109/C115–C116/C120/C124), `gmf-p1-closure-evidence.md`
  (DR dispositions incl. DR-006(a) SQLite-extend with concurrence;
  key-provider CARRIED)
- keon-systems read-only anchors at base `2b6c755` (paths below; P2A
  implementation touches keon-systems, so the spec names that repo + base +
  Allowed Files there + effect-path-stays-disabled guards)

## Shaping-Time Passive Baseline

Observed locally on 2026-09-16 (UTC); every value must be refreshed at
builder Step 0 and drift must stop execution until the coordinator
reconciles it.

| Repository/environment | Observation |
|---|---|
| `D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916` | Branch `codex/gmf-p2a-shaping-20260916`, HEAD `c06c1d50ef97b25f2bc1e62d5c84325bc266c9b0` (= `origin/main` `c06c1d5`); clean tracked worktree; this shaping session creates only the 2 files listed below |
| `D:/Repos/keon-omega/keon-systems` (read-only at shaping) | Local `main` at `2b6c75536f50f125155ee697446cec89f70f2fec`; clean tracked worktree; `origin/main` at `22afd7e461895baa2cd02a9743ea23e04c32df49` (local 3 ahead — drift to reconcile at Step 0; no fetch/pull under shaping authority) |
| Future repositories | `D:/Repos/keon-omega/keon-model-gateway` and `D:/Repos/keon-omega/keon-fleet-executor` absent (unchanged; HG-R1 still unsatisfied) |
| Host/tool surface | Carried from P0 MAP-010 as NOT_TESTED (Windows / PowerShell / Git / Node / npm / .NET SDK / Codex CLI / Docker / WSL values of 2026-09-04, unrefreshed). No environment eligibility is claimed; Docker/WSL2 stays deny-only-candidate per A1-D11. P2A tests run as local `dotnet test` against temp-file SQLite only. |

The named builder branches/worktrees are absent at shaping time and must
not be created before explicit Gate 2:

- agent-skills: branch `codex/gmf-p2a-store-20260916`, worktree
  `D:/Repos/agent-skills-worktrees/gmf-p2a-store-20260916`
- keon-systems: branch `codex/gmf-p2a-store-20260916`, worktree
  `D:/Repos/agent-skills-worktrees/gmf-p2a-store-keon-systems-20260916`

Shaping-time governing-record SHA-256 pins. Ruling 2026-09-16 (coordinator,
pre-Gate-2 shaping maintenance): five of six MATCH the P1 pins;
`loop-directive.md` drifted by the coordinator's own scoped
standing-grants/landed-state edits (PR #30 through PR #34, additive, no
canon change — charter/amendment/findings/discovery/SPEC-CONVENTION hashes
unchanged, queue state advanced to `gmf_p1_landed_p2a_awaiting_shape`) —
drift ACCEPTED, pin re-based below; all other pins unchanged:

| Record | SHA-256 |
|---|---|
| `charter.md` | `cfb1557b25e01d892daeb01fb94cf31869f963c3cdf4eb81043dbc05705b938e` |
| `amendment-a1.md` | `22d681f0fc8786fc501a555143d6f3687495457d67647207ecd479377170e501` |
| `plan-review-findings.md` | `b784ed7656294d19e887c3a221e5eb8354160bb3f647530e2d3c1519532bd5ff` |
| `discovery.md` | `56affe5c3e77e8a260abe88df4cf5662b3ff541ff0c0a6525d193f018cfd9e2d` |
| `loop-directive.md` | `4796bfd18df6f754d90724db2fea36dff03f3305799f3e5d6219e97636fcd51c` |
| `SPEC-CONVENTION.md` | `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` |

Landed P1 records as read-only hash-pinned inputs (builder Step 0 must
re-hash and STOP on any mismatch):

| P1 input | SHA-256 |
|---|---|
| `gmf-p1-effect-descriptors.md` | `20b7010e42709323187f9d6d7f0f3d244b49706743e599efc674898320d583e1` |
| `gmf-p1-source-environment-identities.md` | `ef47903129a7ab28f14800474453dd2ff3213c843966cf0207a3ef6e57a70f38` |
| `gmf-p1-envelope-and-admission.md` | `2e6c68d2652761b284d82da2dc92f4c69d9f4084680695a79926fc381b27b8c2` |
| `gmf-p1-canonicalization-and-error-codes.md` | `e4c4c44d07b8489e88d569e28809e747d200105601bdb6bfedecc22bdd543104` |
| `gmf-p1-artifact-evidence-manifests.md` | `b22b767e435f3da45066d8599edf828ca7e3c78e70079761d879837b2265f7f3` |
| `gmf-p1-terminal-receipt-settlement.md` | `d0dc7096ee350c4427958000f094bf278e198c9a67cbfb797651fcb6065177bc` |
| `gmf-p1-closure-evidence.md` | `4203d6493ff59ccc5df1174264815fde2d7c8dba77b593ebd7717717b2f8e51f` |

Shaping-time counts the builder must preserve: P1 clauses `125`
(P1-C001–P1-C125); scenarios `66` (GMF-NEG-001–066); inventory contracts
`15` (CTR-001–015); decision requests `10` (DR-001–010); new shaping files
`2`; builder Allowed Files in keon-systems `2`; hash pins `13`
(6 governing + 7 P1).

## Required Store Scope

P2A implements the P1-C093 SQLite-extend direction and the P1-C096 durable
store requirement, and nothing else. Frozen clauses are cited, never
paraphrased into weaker form:

| Requirement | Frozen source |
|---|---|
| Extend the SQLite ledger line; store implementation + migration owned by P2A; key-provider selection stays CARRIED | P1-C093 (DR-006(a) RESOLVED contract half; concurrence Clinton Morgan as `keon-systems` contract owner + goal owner) |
| Durably persist spends, reservations, pending-effect state, pre-effect receipts, terminals, settlements with uniqueness/isolation sufficient for the P2A/P2B transaction | P1-C096 (RATIFIED A1-D6) |
| Atomic pre-effect commit shape the store must support (P2B implements; P2A must not): validation + consumption + attempt-record + reservation + slot-acquisition + pre-effect receipt + pending-effect state under uniqueness/isolation; persistence failure commits nothing | P1-C107 (restatement of A1-D6) |
| Pre-effect receipt fields the store must hold: effect/permission/attempt/reservation/slot/audience-expiry/pending-marker | P1-C109 |
| Unknown-cost reservation + append-only settlement shapes the store must hold (P2C implements; P2A must not): unknown stays reserved; settlement appends, never rewrites | P1-C115–P1-C116 |
| Atomicity/race shape (P2B implements; P2A preserves the ledger guarantee): exactly the valid set wins; losers deny with zero excess effect | P1-C120 |
| Durable-store failure rule: where the receipt/pending-state write fails, the transaction commits nothing and effects nothing | P1-C124 |
| Satisfied-spend-consumed rule the store upholds: recorded spends are never deleted/decremented/resurrected | P1-C108 (A1-D21/A1-D6) |
| Canonical bytes/hash procedure for any stored hash: P1-C066 encoding + P1-C068 SHA-256; error vocabulary P1-C071 closed | P1-C066/C068/C071 (DR-002(a) RESOLVED) |

Read-only source anchors inspected at keon-systems base `2b6c755`
(effect-path-stays-disabled guards; builder must re-verify paths/bytes at
Step 0 and STOP on drift):

- `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
  — v1 store under extension: `PermissionSpendLedger(PermissionId,
  SpendIndex)` PK, WAL + busy-timeout, `PRAGMA user_version = 1`,
  `BEGIN IMMEDIATE` reservation, append-only point of no return. P2A
  extends this file only.
- `src/Keon.Contracts/Authority/IPermissionSpendLedger.cs` — frozen
  contract (`GetSpendCount`/`TryRecordSpend`, atomicity + permanence
  guarantees). Read-only; P2A must not edit contracts.
- `src/Keon.Verify/PermissionSpendVerifier.cs` — spend-time verification
  order and point-of-no-return rule. Read-only; P2B owns any wiring to new
  tables.
- `src/Keon.Verify/PermissionSpendEnforcementServiceCollectionExtensions.cs`
  — a configured `LedgerConnectionString` constructs `SqlitePermissionSpendLedger`
  when the service is resolved. Read-only. Therefore, after any eventual merge,
  construction can migrate the configured database; P2A must not activate,
  deploy, or point that registration at a real database. That separately
  ratified operational decision remains withheld.
- `src/Keon.Runtime/Execution/ExecutionDispatcher.cs` — single runtime
  chokepoint around `handler.ExecuteAsync` with pre/post receipt envelopes.
  Read-only; no P2A wiring.
- `src/Keon.Runtime/Execution/ControlledExecutionHandler.cs` — internal
  governed-ledger append only, no external I/O. Read-only.
- `src/Keon.Runtime.Api/LaunchAuthority.cs` — configuration-seeded
  in-memory grants, fail-fast, allow-all rate-limiter waiver outside the
  constraint path. Read-only.
- `src/Keon.Runtime.Api/LaunchExecution.cs` — in-memory controlled-execution
  ledger (durability explicitly a later lane). Read-only.
- `tests/Keon.Runtime.Tests/SqlitePermissionSpendLedgerTests.cs` — seven
  existing durability/race tests. Read-only under P2A (must pass
  unmodified).

## V2 Storage Contract

P2A creates the following additive SQLite schema. All identifiers are opaque
synthetic test values in this parcel; P2A does not validate an effect,
consume authority, allocate a budget/slot, write a receipt, or settle a cost.
Those P2B/P2C operations populate the shape later. Each `CreatedAtUtc` is a
non-empty UTC instant string. Every JSON/hash field is stored as canonical
UTF-8/RFC-8785/SHA-256 material per P1-C066/C068 when later populated; P2A
does not introduce a new canonicalization rule or domain separator.

| Table | Exact columns and constraints | Contract mapping |
|---|---|---|
| `EffectAttempts` | `EffectAttemptId TEXT PRIMARY KEY`; `PermissionId TEXT NOT NULL`; `SpendIndex INTEGER NOT NULL`; `EffectIdentifier TEXT NOT NULL`; `DescriptorHash TEXT NOT NULL`; `AttemptOrdinal INTEGER NOT NULL CHECK (AttemptOrdinal > 0 AND AttemptOrdinal = SpendIndex)`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (PermissionId, SpendIndex)`; `UNIQUE (PermissionId, AttemptOrdinal)`; `UNIQUE (EffectAttemptId, PermissionId, EffectIdentifier, DescriptorHash, AttemptOrdinal)`; `FOREIGN KEY (PermissionId, SpendIndex) REFERENCES PermissionSpendLedger(PermissionId, SpendIndex)` | P1-C096/C106/C107 and A1-D21: durable, uniquely identified attempt bound to exactly one immutable recorded spend; every retry is a new permission/spend/attempt. P2B alone decides/creates an attempt transaction. |
| `BudgetReservations` | `ReservationId TEXT PRIMARY KEY`; `EffectAttemptId TEXT NOT NULL UNIQUE REFERENCES EffectAttempts(EffectAttemptId)`; `ReservedAmountMinor INTEGER NULL`; `CurrencyCode TEXT NULL`; `IsUnknownCost INTEGER NOT NULL CHECK (IsUnknownCost IN (0, 1))`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, ReservationId)`; `CHECK ((IsUnknownCost = 1 AND ReservedAmountMinor IS NULL AND CurrencyCode IS NULL) OR (IsUnknownCost = 0 AND ReservedAmountMinor IS NOT NULL AND CurrencyCode IS NOT NULL))` | P1-C096/C107/C115: one reservation slot per attempt; P2B reserves, P2C reconciles. |
| `ConcurrencySlotAllocations` | `SlotAllocationId TEXT PRIMARY KEY`; `EffectAttemptId TEXT NOT NULL UNIQUE REFERENCES EffectAttempts(EffectAttemptId)`; `SlotScope TEXT NOT NULL`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, SlotAllocationId)` | P1-C107/C120: one allocation slot per attempt; P2B owns admission/race logic. |
| `PreEffectReceipts` | `PreEffectReceiptId TEXT PRIMARY KEY`; `EffectAttemptId TEXT NOT NULL UNIQUE REFERENCES EffectAttempts(EffectAttemptId)`; `PermissionId TEXT NOT NULL`; `EffectIdentifier TEXT NOT NULL`; `DescriptorHash TEXT NOT NULL`; `AttemptOrdinal INTEGER NOT NULL CHECK (AttemptOrdinal > 0)`; `ReservationId TEXT NOT NULL`; `SlotAllocationId TEXT NOT NULL`; `AudienceSnapshot TEXT NOT NULL`; `ExpiresAtUtc TEXT NOT NULL`; `PendingEffectMarker INTEGER NOT NULL CHECK (PendingEffectMarker = 1)`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, PreEffectReceiptId)`; `FOREIGN KEY (EffectAttemptId, PermissionId, EffectIdentifier, DescriptorHash, AttemptOrdinal) REFERENCES EffectAttempts(EffectAttemptId, PermissionId, EffectIdentifier, DescriptorHash, AttemptOrdinal)`; `FOREIGN KEY (EffectAttemptId, ReservationId) REFERENCES BudgetReservations(EffectAttemptId, ReservationId)`; `FOREIGN KEY (EffectAttemptId, SlotAllocationId) REFERENCES ConcurrencySlotAllocations(EffectAttemptId, SlotAllocationId)` | P1-C107/C109: frozen pre-effect receipt fields and one receipt per attempt, whose authority/effect/descriptor/ordinal, reservation, and required slot rows bind to that same attempt. |
| `PendingEffects` | `EffectAttemptId TEXT PRIMARY KEY REFERENCES EffectAttempts(EffectAttemptId)`; `PreEffectReceiptId TEXT NOT NULL`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, PreEffectReceiptId)`; `FOREIGN KEY (EffectAttemptId, PreEffectReceiptId) REFERENCES PreEffectReceipts(EffectAttemptId, PreEffectReceiptId)` | P1-C096/C107/C109: one durable pending marker per attempt, inserted only by P2B's future atomic commit. |
| `TerminalReceipts` | `TerminalReceiptId TEXT PRIMARY KEY`; `EffectAttemptId TEXT NOT NULL REFERENCES PendingEffects(EffectAttemptId)`; `TerminalSequence INTEGER NOT NULL CHECK (TerminalSequence > 0)`; `TerminalState TEXT NOT NULL`; `CostState TEXT NOT NULL`; `EvidenceManifestHash TEXT NOT NULL`; `LineageReference TEXT NOT NULL`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, TerminalSequence)` | P1-C096/C110/C112: append-only terminal/evidence storage only after the durably linked pending state exists. Terminal ordering, original/conflict detection, and any quarantine/resolution semantics are P2C behavior, not P2A schema policy. |
| `Settlements` | `SettlementId TEXT PRIMARY KEY`; `EffectAttemptId TEXT NOT NULL REFERENCES PendingEffects(EffectAttemptId)`; `SettlementSequence INTEGER NOT NULL CHECK (SettlementSequence > 0)`; `SettlementKind TEXT NOT NULL`; `AmountMinor INTEGER NULL`; `CurrencyCode TEXT NULL`; `EvidenceManifestHash TEXT NOT NULL`; `CreatedAtUtc TEXT NOT NULL`; `UNIQUE (EffectAttemptId, SettlementSequence)`; `CHECK ((AmountMinor IS NULL AND CurrencyCode IS NULL) OR (AmountMinor IS NOT NULL AND CurrencyCode IS NOT NULL))` | P1-C096/C115/C116: append-only settlement/adjustment/refund storage only after the durably linked pending state exists. P2C alone validates or appends settlement semantics. |

Every v2 table **and `PermissionSpendLedger`** has `BEFORE UPDATE` and
`BEFORE DELETE` triggers that `RAISE(ABORT, ...)` and a `BEFORE INSERT`
conflict-guard trigger that raises `ABORT` when the proposed row conflicts
with any declared primary or unique identity. The insert guards are required
because SQLite `REPLACE` can delete a conflicting row without firing the
delete guard under the default `recursive_triggers` posture. P2C appends
terminal and settlement rows instead of rewriting history. The declared
`UNIQUE` constraints create the required lookup indexes; P2A adds no
redundant secondary index. It preserves the existing
`idx_permission_spend_permission` index unchanged. The P2A test asserts the full DDL through `sqlite_master`,
`PRAGMA table_info`, `PRAGMA index_list`, `PRAGMA foreign_key_list`, and
trigger inspection over an independent connection; row counts alone are
insufficient evidence.

## Migration Contract

`InitializeSchema` applies exactly this version-state policy before any v2 DDL:

| Observed state | Required outcome |
|---|---|
| Fresh (`user_version = 0`, no non-`sqlite_%` schema object) | Create canonical v1 plus all v2 objects in one `BEGIN IMMEDIATE` transaction; set `user_version = 2` last; commit. |
| Canonical v1 (`user_version = 1`, exact v1 table/index shape, no v2 object), legacy-v1-pending-version (`user_version = 0`, exact v1 table/index shape, no v2 object), or recoverable-v1-index-pending (`user_version = 0`, exact v1 table shape, no v2 object, and only `idx_permission_spend_permission` absent) | In one `BEGIN IMMEDIATE` transaction, create the missing v1 index if applicable, then all v2 objects, set `user_version = 2` last, then commit. Existing v1 rows remain byte-preserved. |
| Canonical v2 (`user_version = 2`, exact v1+v2 shape) | Verify required objects and return without DDL or row mutation. |
| Unknown/future/partial/malformed (any other version, unexpected absence/presence, or incompatible object shape) | Throw a typed persistence error before DDL; commit nothing and leave the database unchanged. |

Every ledger, migration, and independent-verifier connection executes
`PRAGMA foreign_keys = ON` and the busy timeout immediately after `Open` and
before any `BEGIN`; the test asserts `PRAGMA foreign_keys = 1` on each such
connection. To avoid mutating rejected databases, initialization first enters
`BEGIN IMMEDIATE`, semantically classifies the schema, and rolls back with a
typed error before any DDL or journal-mode write for unknown/future/partial/
malformed states. Exact shape is semantic, not `sqlite_master.sql` text:
the implementation compares the required table columns/not-null/default/PK
positions with `table_info`, keys and their ordered columns with `index_list`
plus `index_xinfo`, foreign keys with `foreign_key_list`, and the exact required
trigger names; it ignores DDL whitespace and line endings. After recognizing
an accepted state it rolls back that read-only classification transaction,
sets `journal_mode=WAL` (only for the accepted database), then obtains a new
`BEGIN IMMEDIATE` lock and reclassifies before DDL. The upgrade transaction
contains every v1-recovery `CREATE INDEX`, every v2 `CREATE TABLE`, every
append-only/conflict-guard trigger, and the final version write. Its catch path
explicitly rolls back before rethrowing; there is no fallback, destructive
recreation, or automatic retry that could turn a failed migration into a new
state. A private core initializer accepts an optional test-only callback after
each successful DDL statement and immediately before the version write; the
public constructor and existing public `InitializeSchema` path always supply
`null`, so no runtime caller receives a fault-injection capability. The new
test invokes that private core through a test-only reflection helper and throws
at each DDL index and before the version write. Independent raw SQL then proves
that no v2 object exists, `user_version` remains `1`, and the canonical
populated-v1 snapshot is byte-identical. A separate malformed-state test uses
an incompatible pre-existing v2 object and proves pre-DDL rejection with its
database header bytes and journal mode unchanged. A targeted child-test mode starts two separate
`dotnet test --no-build` hosts from a shared file-based barrier against one temp
database; both run only schema initialization and the parent asserts one
canonical v2 result with no duplicate objects or rows. These are test-host
processes, not a Fleet workload or effect.

## Verification Plan

Builder Step 0 must restate this spec, exact per-repo Allowed Files,
branches/worktrees/bases, read-only anchors, all thirteen hashes,
prohibited actions, counts `125/66/15/10` (P1-C/NEG/CTR/DR), the DR-006(a)
handling (SQLite-extend RESOLVED, key-provider CARRIED), data class
`internal`, environment identity (local `dotnet test`, temp-file SQLite
only), and known blockers, then stop for coordinator ruling before writing
product code. Any mismatch, pre-existing builder Allowed File, occupied
worktree path, or overlapping writer is a stop.

Required deterministic checks after the builder claim:

1. Refresh local Git/path facts using read-only commands only. Compare both
   repository HEADs, statuses, remotes, future-repository absence, and all
   thirteen hashes to the shaping-time baseline. Record drift; do not fetch,
   pull, install, or probe the network.
2. Verify `git diff --name-only` in each repo is a subset of that repo's
   Allowed Files and that no governing record, P0/P1 file, predecessor
   file, contract file, dispatcher/verifier/handler/launch file, install
   path, or external state changed.
3. Prove every new table enforces its named primary/unique/foreign-key/check
   constraint (including missing/mismatched spend binding and every
   cross-attempt receipt/reservation/slot/pending/terminal/settlement splice);
   prove every v2 and `PermissionSpendLedger` update/delete trigger rejects a
   rewrite while the original row stands; prove `INSERT OR REPLACE`, `REPLACE
   INTO`, and each UPSERT conflict path cannot bypass every declared primary or
   unique identity; and prove the v1 `(PermissionId, SpendIndex)` guarantee is
   unchanged. Run the unmodified `SqlitePermissionSpendLedgerTests` suite green
   plus the new migration/store tests green.
4. Prove migration correctness against every Migration Contract state:
   pre-migration v1 snapshot (row dump + SHA-256) equals post-migration raw-
   SQL reads for all pre-existing rows; fresh-init shape equals migrated shape;
   re-run is idempotent; WAL + `foreign_keys` + `user_version = 2` hold; two
   real test-host initializers synchronize through the file barrier and
   converge on one canonical v2 schema; each injected DDL/pre-version failure
   rolls back to byte-identical v1; malformed-v2 shape rejects before DDL with
   unchanged header bytes and journal mode.
5. Prove effect-path-stays-disabled with a base-tree manifest: compare the
   base commit to the combined staged/unstaged working tree, inventory every
   untracked path, and verify every changed or untracked path is Allowed.
   Separately diff each forbidden anchor against base and search for new
   `ExecuteAsync`/`VerifyAndSpend`/spend-gate wiring; fail-closed tests remain
   green.
6. Prove no D1–D24/A1–A7/graph/receipt-count/effect-class/P1-clause text is
   altered or contradicted: store code cites P1-C IDs and never redefines
   them; no new error code, hash function, or domain-separation literal.
7. Run the frozen frontmatter validator plus the shaping body-section
   advisory check on this draft, `git diff --check` in both repos, and a
   JSON parse of the shaping-result file. Advisory green is recorded but
   does not authorize a status change.
8. Run two fresh independent runtime/data/security reviews of the exact
   keon-systems diff plus this spec. Each review returns a per-focus-
   question finding table and explicit `PASS`, `REQUEST_CHANGES`, or
   `HOLD`; no reviewer edits or executes a prohibited action.
9. Reconcile the reviews. Any unresolved Critical/High/decision-graph-
   changing finding, missing uniqueness/durability proof, effect-path
   ambiguity, or key-provider/VM/provider choice smuggled into the store
   forces `HOLD`.

Mandatory reviewer focus questions:

- Does the diff stay strictly additive to the SQLite ledger line, with the
  v1 table/contract/race guarantee byte-preserved and no P2B transaction
  logic introduced?
- Is the `v1 → v2` migration idempotent, preservative, and failure-atomic
  across every named version state, with WAL/foreign-key/`user_version`
  posture and deterministic DDL rollback proved by independent raw-SQL reads
  rather than ledger self-report?
- Is every new table's uniqueness/isolation sufficient for the future P2B
  atomic commit (P1-C107/C109) without implementing that commit now?
- Could any added code path cause, retry, replay, resurrect, or settle an
  effect — or be mistaken by P2B/P2C for an already-implemented transaction,
  reconciliation, or recovery?
- Does the effect path stay provably disabled (dispatcher, verifier,
  handler, launch composition byte-identical; no new execution wiring)?
- Is key-provider/trust-root selection still CARRIED (no key material,
  signer, or production wiring), and are VM/provider/persistence-tech
  choices beyond DR-006(a) absent?
- Is data class `internal` honored (synthetic IDs only; no secrets,
  credentials, PII, endpoints, or proprietary bytes)?
- Is the evidence package merely store-plus-migration plus recommendation,
  with P2B/P2C/Gate 2 and every external effect still withheld?

## Allowed Files

Only these exact repo-relative paths may be created or changed. Globs and
directory shorthand are prohibited. The shaping session owns the two
agent-skills outputs below. A future builder receives authority only to the
two named keon-systems paths after an explicit P2A Gate 2; the agent-skills
outputs are then read-only.

Agent-skills (base `c06c1d5`) — shaping outputs, not builder authority:

- `plugins/foreman-line/docs/specs/active/GMF-P2A-durable-authority-accounting-store-migration.md`
- `plugins/foreman-line/docs/specs/active/gmf-p2a-durable-authority-accounting-store-migration.shaping-result.json`

keon-systems (base `2b6c75536f50f125155ee697446cec89f70f2fec`) — future
builder mutation authority after explicit P2A Gate 2 (ONLY these two; the
builder creates the second, edits the first):

- `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
- `tests/Keon.Runtime.Tests/AuthorityAccountingStoreMigrationTests.cs`

The builder creates nothing in agent-skills and edits nothing there. Any
required path outside the per-repo lists requires a coordinator-ratified
spec amendment before any edit.

## Forbidden

- Editing the charter, amendment, findings, discovery, loop directive, goal
  index, `model-fleet-v1`, any P0/P1 output file, this spec or its
  shaping-result after Gate 2, or any product path outside the two
  keon-systems Allowed Files — including `src/Keon.Verify/
  PermissionSpendVerifier.cs`, `src/Keon.Runtime/Execution/
  ExecutionDispatcher.cs`, `src/Keon.Runtime/Execution/
  ControlledExecutionHandler.cs` and its ledger files, `src/Keon.Runtime.
  Api/LaunchAuthority.cs`, `src/Keon.Runtime.Api/LaunchExecution.cs`,
  `src/Keon.Runtime.Api/Program.cs`, any `src/Keon.Contracts/**` file, the
  existing `tests/Keon.Runtime.Tests/SqlitePermissionSpendLedgerTests.cs`,
  any `.csproj`/workflow/config file, or any gateway/executor/verifier
  surface.
- Implementing the P2B transaction, P2C reconciliation/recovery/settlement,
  or any spend-gate/dispatcher wiring; enabling, exercising, or simulating
  an effect path; creating fixtures that spend real authority.
- Choosing or wiring a key provider, trust root, signer, VM, container, WSL
  distribution, hypervisor, enforcement plane, service identity, provider,
  model, pricing source, or production database/environment.
- Provider/model/MCP calls; network probes; package installs; workload,
  container, VM, or WSL launches; credential access; source disclosure of
  any non-synthetic class; paid activity; promotion; merge; installation;
  activation; deployment; publication; receipt minting; or Gate 3.
- Altering D1–D24 as amended, A1–A7, the GMF-P0–P9 graph, receipt-type
  count, effect classes, retry/no-fallback semantics, P1-C001–P1-C125, or
  any frozen ID.
- Rewording that grants any P2A Gate 2, repository creation, source
  disclosure, provider spend, promotion, merge, installation, deployment,
  publication, or Gate 3.

## Collision Risk and Sequencing

Collision risk is **medium**: the ambient `agent-skills` checkout moves
daily and a separate Foreman Kernel writer owns adjacent governance state,
but the keon-systems base is pinned and the builder touches exactly one
source file plus one new test file there. No Allowed File existed before
shaping except this newly created draft/result (agent-skills) and the one
existing ledger file (keon-systems, edited in place). GMF-P2A must use the
named isolated worktrees after Gate 2, read governing records and P1
outputs only through verified hashes, and serialize any integration with
uncommitted governance baselines. It must not stage, commit, reset, clean,
stash, move, or delete user-owned changes in either repo. keon-systems
local `main` is 3 ahead of `origin/main` at shaping time — builder Step 0
must re-resolve HEAD and STOP on any unreconciled drift. GMF-P2A must also
serialize against any live P1 claim-verification writes: if P1 bytes move,
the seven P1 pins above are stale and work stops for a re-pin ruling.
GMF-P2B shaping must not begin until P2A's diff, migration evidence, and
both independent reviews close.

## Evidence and Handoff

The final P2A handoff is a bounded evidence index (builder completion message,
not an approval) stating: starting and ending commits in both repos; exact
files changed per repo; pre/post migration snapshots with hashes; commands
run with outputs (`dotnet test` suites, `git diff --check`, hash
re-verification, raw-SQL independent reads); uniqueness/durability/race
counts; both independent review verdicts; carried items with owners
(key-provider selection → CARRIED, requiring a separately ratified owner
decision before P3A integration; VM stack → human isolation review; HG-R1 →
human; settlement enforcement → P2C/P3B); blockers; and the next safe action.
No receipt is minted. This spec grants no commit, PR, or merge authority; any
such action requires the then-effective approved parcel dispatch and review
chain. Rollback is worktree-local only: the test records each exact temp
database, WAL, and SHM path it creates, and deletes only those recorded paths;
no OS-temp glob is permitted. The coordinator may then remove only the
unmerged parcel-owned branch/worktree after verifying its exact path. Do not
use `git checkout --`, reset, clean, stash, move, or delete user-owned changes.
P2A never activates, deploys, or intentionally targets an authoritative
database. Because the existing read-only service-registration path constructs
the ledger for a configured connection string, a later merge can migrate such a
configured database when the service is resolved; that activation/deployment
decision and its rollback plan require separate ratification and are not P2A
authority.
The only permissible next action after a green P2A review chain is for the
coordinator to present an exact human decision request; it is not permission to
shape, dispatch, build, or merge GMF-P2B.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a governing hash, P1 input hash, repository HEAD/status, instruction,
  owner, anchor path/byte, or existing file conflicts with this spec;
- keon-systems HEAD has moved past `2b6c755` (or `origin/main` has advanced
  past the reconciled base) without a coordinator re-pin ruling;
- a required output path is occupied by another writer, a worktree path
  exists, or a mutation would escape Allowed Files;
- completing the store would require P2B transaction logic, P2C
  reconciliation/recovery, effect-path wiring, a contract edit, a key-
  provider/VM/provider/persistence-tech choice beyond DR-006(a), a new
  error code or canonicalization choice, or any D1–D24/A1–A7/graph/
  receipt-type/effect-class/P1-clause change (file a scoped Gate-1
  amendment request instead);
- migration cannot preserve a v1 row, cannot run idempotently, or would
  touch a non-temp database;
- completing a check would require executing a scenario against a live
  effect, calling a provider/MCP/network service, launching a workload/
  container/VM, accessing a secret, or spending/disclosing/promoting/
  merging/installing/deploying/publishing anything;
- any action would edit the charter, amendment, findings, discovery, loop,
  index, `model-fleet-v1`, a P0/P1 file, a forbidden product path, an
  install path, or external state; or
- any wording could be read as granting P2B/P2C dispatch, any P2A Gate 2,
  repository creation, source disclosure, provider spend, promotion, merge,
  installation, deployment, publication, or Gate 3.

On stop, preserve the partial evidence, set the Gate-2 recommendation to
`HOLD`, name the exact decision/evidence/authority required, and return
control to the coordinator.

(End of file)
