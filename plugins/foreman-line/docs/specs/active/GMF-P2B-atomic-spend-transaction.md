---
ticket: GMF-P2B
title: Atomic spend transaction — validation, spend, reservation, concurrency, pending-effect, and pre-effect receipt
status: active
owner: clinton.morgan
created: 2026-09-28
updated: 2026-09-28
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/specs/active/GMF-P2B-atomic-spend-transaction.md
  - keon-systems/src/Keon.Verify/AtomicEffectSpendTransaction.cs
  - keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs
  - keon-systems/tests/Keon.Runtime.Tests/AtomicEffectSpendTransactionTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/AtomicSpendNegativeControlsTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/AtomicSpendCrashSafetyTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/EnvelopeNonAuthorityProofTests.cs
routing_class: architecture/risk
verification_class: equivalence-provable
permission_profile: builder-architecture
data_classification: internal
---

# GMF-P2B — Atomic spend transaction

## Intent

Build the charter's D6/A1-D6 durable transaction boundary in `keon-systems`, on
the GMF-P2A authority/accounting store (`charter.md:103`, `amendment-a1.md:25`,
`charter.md:180`): ONE atomic transaction that validates revocation, expiry,
descriptor, audience, nonce, policy, and lineage; consumes permission; records a
unique effect attempt; reserves budget; acquires concurrency; and persists the
pre-effect receipt plus pending-effect state — all-or-nothing under database
isolation and uniqueness guarantees (`P1-C107`). Every non-satisfied validation
verdict fails closed with a durable receipted denial drawn only from the
`P1-C071` closed vocabulary and leaves the permission unconsumed
(`P1-C075`/`P1-C106`). A satisfied spend is permanently consumed even on effect
failure, ambiguity, or zero settlement (`D21`/`P1-C108`, `charter.md:118`);
races admit exactly the valid set with `FLEET_DENIED_RACE_LOST` losers and zero
overspend (`P1-C074`/`P1-C120`); crash recovery may complete or roll back
pending state and never resurrects or re-spends permission (`D21`/`A1-D21`,
`amendment-a1.md:126`). Deliverables: the transaction implementation on the P2A
store, its negative controls (the GMF-NEG suite rows it touches), raw-SQL
independent observers in the P2A test family's pattern, and the `P1-C048`
machine-checkable envelope non-authority proof. No external effect occurs
(`charter.md:180` no-go boundary).

## Constraints

- The controlling authority is the ratified charter with Amendment A1, the loop
  directive, the closed plan-review findings, and the discovery record. The
  seven P1 frozen-contract records are byte-faithful contract targets (freeze
  rule in `gmf-p1-effect-descriptors.md`): the builder cites `P1-C###` IDs and
  never paraphrases them into weaker form. Any need to change a frozen clause,
  D1–D24, A1–A7, the phase graph, the seven receipt-type count, the three
  effect classes, or retry/no-fallback semantics is a STOP with a scoped Gate-1
  amendment request.
- Charter invariants, binding without restatement: **D2** — only Runtime-issued
  `IPermission` is canonical authority; the transaction consumes and records
  authority/accounting state and confers nothing (`P1-C047`/`P1-C051`).
  **D6/A1-D6** (`charter.md:103`, `amendment-a1.md:25`) — the seven ordered
  steps (validate revocation/expiry/descriptor/audience/nonce/policy/lineage →
  consume permission → unique effect-attempt record → budget reservation →
  concurrency acquisition → persisted pre-effect receipt + pending-effect state)
  commit atomically under database isolation/uniqueness. Reservations are
  accounting, not authority; unknown cost stays reserved until append-only
  settlement, adjustment, or human resolution (`P1-C115`); recovery never
  resurrects permission. **D16** — seven receipt types (`P1-C101`); durable
  denial or exactly one terminal per effect (`P1-C102`); append-only history.
  **D21** (`charter.md:118`) — a satisfied spend is permanently consumed even
  when the effect fails, is ambiguous, or settles at zero; idempotency may
  return the recorded effect/receipt but never creates a second attempt
  (`P1-C010`/`P1-C111`).
- The transaction is the single durable boundary `P1-C107` restates: validation
  + consumption + attempt-record + reservation + slot-acquisition + pre-effect
  receipt + pending-effect state commit atomically; persistence failure commits
  nothing and effects nothing (`P1-C124`). Validation verdicts are evaluated
  inside the same database transaction that commits the write bundle — the
  store's schema was built for exactly this ("P2B can run D6's full validation
  inside one transaction without an ALTER",
  `ReceiptPersistenceSchema.cs:466-468`; "P2B composes its validation on top",
  `SqlitePermissionSpendLedger.cs:190-193`).
- Verdict semantics are equivalence-provable against the existing fail-closed
  family, never weaker: `PermissionSpendVerifier`'s composition rule ("COMPOSES
  … never re-implements those checks", `PermissionSpendVerifier.cs:66-67`) and
  its frozen check order (missing → tenant → subject/actor → effect class →
  effect descriptor hash → scope → expiry → revocation → use count → policy
  version → grant-type lineage/signature → human oversight,
  `PermissionSpendVerifier.cs:71-72`) are the semantic baseline. The
  transaction composes the same primitives (`DelegationChainVerifier`,
  `DelegationRevocationRegistry`, Keon.Contracts permission/verdict types) and
  must provably agree with `PermissionSpendVerifier` verdicts on shared
  fixtures (Required Tests). `IPermissionSpendGate`,
  `RuntimePermissionSpendGate`, `PermissionSpendVerifier`, `ExecutionDispatcher`
  spend-proof semantics, and the KEON005 analyzer
  (`Keon.Analyzers.Authority/PermissionSpendAnalyzer.cs`) are unchanged
  consumers; the KEO-172 point-of-no-return rule
  (`PermissionSpendVerifier.cs:113-119`) and trusted-clock rule stand.
- Layering (observed 2026-09-28): `Keon.Verify.csproj:18` references
  `Keon.Runtime.csproj`; `DelegationChainVerifier.cs`/`DelegationRevocationRegistry.cs`
  live in `Keon.Verify`, the store in
  `Keon.Runtime/Observability/Persistence`. The transaction therefore lives in
  `Keon.Verify` and composes down onto `SqliteAuthorityAccountingStore`
  (`SqlitePermissionSpendLedger.cs:391`); no upward reference is introduced and
  `Keon.Contracts` C# sources stay unedited.
- Closed vocabularies only: denial/failure/pending codes from `P1-C071` as
  pinned in `ReceiptPersistenceSchema.cs:50-77`; terminal states only from
  `P1-C103`–`P1-C105`; effect classes only `P1-C001`. No new code, receipt
  type, terminal state, or effect class. The verdict→denial-code mapping is
  total over the seven D6 verdicts and takes values only from the `P1-C075`
  pre-spend denial family (plus `FLEET_PENDING_UNKNOWN_COST` cost state per
  `P1-C073`), is recorded as one named table in code and tests, and every
  denial row satisfies the store's `DenialReceipts` shape (`ZeroExcessEffect = 1`
  CHECK, `ReceiptPersistenceSchema.cs:588`).
- One-spend/one-effect is structural, not advisory: `EffectAttempts` UNIQUE
  (`PermissionId, SpendIndex`) and UNIQUE (`TaskScopeKey, AttemptOrdinal`)
  (`ReceiptPersistenceSchema.cs:490`), `PermissionSpendLedger` PRIMARY KEY
  (`PermissionId, SpendIndex`) (`ReceiptPersistenceSchema.cs:475`), and
  `ConcurrencySlots` UNIQUE (`SlotScope, SlotIndex`)
  (`ReceiptPersistenceSchema.cs:538`) make double consumption, duplicate
  attempts, ordinal reuse, and double slot acquisition structurally impossible;
  the transaction's race admission surfaces each unique-constraint loser as a
  `FLEET_DENIED_RACE_LOST`/`FLEET_DENIED_REPLAY` denial receipt with winner
  linkage (`P1-C074`/`P1-C120`, `Vocabulary.RaceLostCode`/`ReplayCode`,
  `ReceiptPersistenceSchema.cs:127-133`).
- P2A's landed store guarantees are immutable for this parcel:
  `IPermissionSpendLedger` (`GetSpendCount`/`TryRecordSpend`,
  `SqlitePermissionSpendLedger.cs:54`/`:69`), `TryBeginEffect`'s P1-C107 commit
  shape and deny shapes (`SqlitePermissionSpendLedger.cs:404-418`), the
  append-only triggers (`ReceiptPersistenceSchema.cs:664`ff), and the v1→v2
  migration are extended additively only. The GMF-P2A landed tests
  (`AuthorityAccountingStoreTests.cs`, `AuthorityAccountingStoreMigrationTests.cs`,
  `SqlitePermissionSpendLedgerTests.cs`, `SqliteControlledExecutionLedgerTests.cs`,
  `EffectPathDisabledTests.cs`, `LaunchExecutionCutoverTests.cs`) must stay
  green byte-unmodified; any required edit to them is a STOP (spec amendment).
- No schema change: no ALTER, no new table/index/trigger, no `user_version`
  bump beyond P2A's v2 (`ReceiptPersistenceSchema.cs:466-468` promises D6
  validation needs none). Any needed shape is a GAP recorded for P2C shaping,
  never invented here.
- The no-go boundary is absolute (`charter.md:180`): no code path starts a
  process tree, contacts a provider or MCP server, mounts source, or performs
  external I/O. `ControlledExecutionHandler`'s only effect remains its internal
  governed-ledger append; the launch/effect path stays disabled through
  GMF-P4B. Fixtures and test data are `synthetic/public` only (A1-D22); no
  credentials, tokens, PII, customer data, or non-synthetic source.
- Crash-safety semantics are exactly two-outcome: for a pending effect the only
  lawful recovery outcomes are COMPLETE (the pending effect reaches its one
  terminal via the append-only terminal path, `P1-C102`/`P1-C110`) or
  ROLLBACK-OF-PENDING-STATE (pending accounting resolved with no effect
  occurring: reservation quarantined via the P2A primitive per `P1-C113`, slot
  lease left to expiry). In neither case is the permission un-consumed,
  resurrected, or re-spendable (`D21`/`P1-C108`), and no second effect attempt
  or receipt may appear (`P1-C111`). Lease expiry/reconciliation, settlement
  adjustment, readiness, and quarantine release remain GMF-P2C
  (`charter.md:181`); this parcel implements and negative-controls only the
  invariant and the two-outcome seam.
- Consume, never edit: `keon-contracts/` JSON contracts (status
  `contract_candidate_pending_conformance`), the seven P1 records, the five P0
  records, and all governing records. Environment hygiene: no provider/model/
  MCP call, workload/container/WSL/VM launch, secret access, or source
  disclosure; `dotnet restore` against configured package sources is the only
  permitted network use and is not a Fleet effect.

## Acceptance Criteria

- [ ] (a) The transaction is one atomic boundary over the seven D6/A1-D6 steps
  in order: validation of revocation, expiry, descriptor (`P1-C017`), audience
  (`P1-C050`), nonce (`P1-C049`), policy (version binding), and lineage
  (delegation chain), then permission consumption (`P1-C108`), unique
  effect-attempt record (`P1-C009`/`P1-C010`/`P1-C111`), budget reservation
  including the explicit unknown/pending cost state (`P1-C073`/`P1-C115`),
  concurrency-slot acquisition (`P1-C109`/`P1-C120`), and persisted pre-effect
  receipt (exact `P1-C109` field list) plus pending-effect state. All-or-nothing
  under the store's database isolation/uniqueness guarantees (`P1-C107`);
  persistence failure commits nothing and effects nothing (`P1-C124`).
  Validation verdicts are evaluated inside the same database transaction that
  commits the write bundle.
- [ ] (b) Fail-closed on every non-satisfied validation verdict: a durable
  denial receipt (`P1-C106`) whose code is drawn only from `P1-C071` via a
  total, named verdict→code mapping (values within the `P1-C075` family:
  `FLEET_DENIED_REVOKED`, `FLEET_DENIED_EXPIRED`, `FLEET_DENIED_DESCRIPTOR_MISMATCH`,
  `FLEET_DENIED_AUDIENCE_MISMATCH`, `FLEET_DENIED_REPLAY`, `FLEET_DENIED_POLICY`,
  lineage-family codes as `P1-C075` lists them), the permission left
  unconsumed, and zero attempt/reservation/slot/receipt/pending rows beyond the
  denial (`P1-C075`: "durable denial receipts and unconsumed permission").
  Cross-audience and replay presentations deny with the permission unconsumed
  (`P1-C049`/`P1-C050`).
- [ ] (c) One-spend/one-effect (`D21`, `charter.md:118`): a satisfied spend is
  permanently consumed even when the effect later fails, is ambiguous, or
  settles at zero (`P1-C108`); a second presentation of a consumed permission
  denies `FLEET_DENIED_REPLAY` with the denial linked to the original record
  (`P1-C050`/`P1-C106`); idempotent re-presentation may return the recorded
  effect/receipt but never creates a second attempt, receipt, reservation, or
  slot (`P1-C010`/`P1-C111`).
- [ ] (d) Concurrency and budget races admit exactly the valid set: slot
  acquisition is unique (`ConcurrencySlots` UNIQUE, `ReceiptPersistenceSchema.cs:538`);
  budget admission is atomic (the budget race GMF-NEG-023 shape), call-budget
  race shape (GMF-NEG-055) follows the same admission rule; every loser records
  `FLEET_DENIED_RACE_LOST` with winner linkage and zero excess effect, and
  overspend is zero (`P1-C074`/`P1-C120`). Observed from raw SQL, not the API
  under test.
- [ ] (e) Crash safety: a crash or persistence failure mid-transaction rolls
  back the entire pre-effect bundle — zero partial writes, permission
  unconsumed (GMF-NEG-060, `P1-C124`); a crash after commit leaves exactly the
  committed set with the permission permanently consumed; the two-outcome
  recovery seam (COMPLETE / ROLLBACK-OF-PENDING-STATE) never un-consumes,
  resurrects, or re-spends permission and never yields a second effect attempt
  (`D21`/`P1-C108`, GMF-NEG-005/GMF-NEG-040). Each scenario is injected and
  observed via raw SQL on a reopened database.
- [ ] (f) `P1-C048` non-authority proof: a machine-checkable checker plus its
  checked property proves no envelope-only path reaches the spend ledger
  without canonical `IPermission` validation — i.e. `FleetPermissionEnvelope`
  can never mint, delegate, refresh, or spend authority. Forged/widened/reissued
  envelope presentations deny with `FLEET_DENIED_ENVELOPE_FORGERY`-family codes
  and the canonical permission unconsumed (`P1-C046`/`P1-C047`/`P1-C051`/`P1-C052`,
  GMF-NEG-059). The checker fails when the property is broken (mutated fixture
  proves the assertion binds).
- [ ] (g) Negative controls: every GMF-NEG row this parcel touches —
  GMF-NEG-004/005/006/007/008/009/016/023/024/040/055/059/060 (the rows whose
  P0 record marks P2B downstream, `gmf-p0-permanent-negative-scenarios.md`) —
  has an executable transaction-level control that fails when its named
  invariant is broken, observed through the independent raw-SQL observer and
  the canonical-bytes comparator (`P1-C070`), never component self-report
  (`P1-C123`). The environment/process-tree/tool-invocation halves of
  GMF-NEG-024/040/055 remain NOT_TESTED until their P4B/P5/P6 observers land
  (P2A precedent); this parcel proves the transaction primitives they require.
  The effect path stays disabled, proven by deterministic negative control with
  zero external side effects from an independent observation point; the parcel
  changes exactly the Allowed Files; P1/P0/governing records and
  `keon-contracts/` are byte-unmodified; `git diff --check` is clean.
- [ ] (h) Two fresh, independent, adversarial reviews (routing class
  Runtime/concurrency/security per `charter.md:180`) return verdicts with no
  unresolved Critical or High finding before the Gate-3 readiness chain;
  reviewers never fix or commit.

## Out of Scope

- GMF-P2C work (`charter.md:181`): terminal reconciliation, lease recovery and
  settlement adjustment, offline verification primitives, readiness and
  quarantine-release logic. P2B's recovery seam composes only P2A primitives
  (`TryAppendTerminal`, `SqlitePermissionSpendLedger.cs:636`;
  `TryQuarantineReservation`, `:828`) and stops before reconciliation.
- All external effects: worker execution, process-tree launch, source
  materialization, provider/model/MCP calls, and patch promotion. The effect
  path stays disabled through GMF-P4B (`charter.md:180`).
- Wiring the transaction into `ExecutionDispatcher`, `RuntimePermissionSpendGate`,
  `LaunchExecution`/`LaunchReadiness`, or any KEON005-governed call path;
  integration happens with the effect-path parcels after P2C. The existing
  spend-gate path and verdict semantics are byte-unchanged.
- Cutoff, pricing-drift, currency, and data-class enforcement (P3B:
  `P1-C015`/`P1-C117`/`P1-C118`); MCP capability counters and transport parity
  (P5: `P1-C058`/`P1-C060`); promotion CAS/staging races (P6: `P1-C121`).
- Anything in `keon-mcp-gateway` (pre-dirty, out of bounds).
- Repository creation or protection (`GMF-HG-R1`), provider spend, private/
  internal source disclosure, patch promotion, merge, installation, deployment,
  publication, or Gate 3 (`charter.md:267` re-gate rule: P2B dispatch requires
  its own Gate 2).
- Signing, key-provider, or trust-bundle implementation (CARRIED,
  `P1-C093`/`P1-C094`).
- New machine schemas in `keon-contracts/`, changes to any contract JSON or
  `Keon.Contracts` C# source, or new receipt types, terminal states, error
  codes, or effect classes.
- Editing charter, amendment, findings, discovery, loop directive, goal index,
  `model-fleet-v1`, any P0/P1 record, GMF-P2A's landed tests, or any other
  repository.

## Context & References

- `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md` (D2, D6 at
  `:103`, D21 at `:118`, parcel row `:180`, phase graph `:139`, gate table
  `:267`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md`
  (A1-D6 at `:25`, A1-D21 at `:126`)
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
  (ownership block; coordinator pin-anchor ruling 2026-09-27)
- `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md`
  (PR-04)
- `plugins/foreman-line/docs/goals/governed-model-fleet/discovery.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-effect-descriptors.md`
  (P1-C001–C020)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-source-environment-identities.md`
  (P1-C021–C045)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-envelope-and-admission.md`
  (P1-C046–C065; P1-C048/C049 name P2B obligations)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-canonicalization-and-error-codes.md`
  (P1-C066–C078)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md`
  (P1-C079–C100, DR-006(a))
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-terminal-receipt-settlement.md`
  (P1-C101–C125)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-closure-evidence.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-contract-inventory.md`
  (CTR-010, CTR-015)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-threat-model.md`
  (B-001, B-009, T-001, T-003, T-004)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-permanent-negative-scenarios.md`
  (GMF-NEG-004/005/006/007/008/009/016/023/024/040/055/059/060)
- `plugins/foreman-line/docs/goals/goal-status-report-2026-09-27.md` §7
  (MRC-22→MRC-23→MRC-24 sequencing at `:124`-`:125`)
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` (§4 frontmatter, §4.8
  Allowed-Files mutation authority)
- `plugins/foreman-line/docs/specs/active/GMF-P2A-runtime-authority-accounting-store.md`
  and its shaping-result (format precedent and landed-store contract)
- `keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
  (P2A store seam: `SqliteAuthorityAccountingStore`, `TryBeginEffect`)
- `keon-systems/src/Keon.Runtime/Observability/Persistence/ReceiptPersistenceSchema.cs`
  (v2 DDL, closed vocabularies, append-only triggers, no-ALTER note `:466-468`)
- `keon-systems/src/Keon.Contracts/Authority/IPermissionSpendGate.cs`
  (fail-closed gate contract `:11-12`, `:28`, `:37`)
- `keon-systems/src/Keon.Contracts/Permission.cs` (verdict vocabulary)
- `keon-systems/src/Keon.Verify/PermissionSpendVerifier.cs` (check order
  `:71-72`, composition rule `:66-67`, KEO-172 `:113-119`)
- `keon-systems/src/Keon.Verify/RuntimePermissionSpendGate.cs`,
  `DelegationChainVerifier.cs`, `DelegationRevocationRegistry.cs` (composed
  primitives)
- `keon-systems/src/Keon.Runtime/Execution/ExecutionDispatcher.cs`
  (spend-proof call `:348`, point-of-no-return `:360`),
  `DenyAllPermissionSpendGate.cs` (fail-closed composition default)
- `keon-systems/src/Keon.Analyzers.Authority/PermissionSpendAnalyzer.cs`
  (KEON005)
- `keon-systems/tests/Keon.Runtime.Tests/AuthorityAccountingStoreTests.cs`
  (raw-SQL observer pattern `:23-29`, `:85`)
- `keon-systems/.github/workflows/pr-validation.yml` (verification commands,
  KEON005 enforcement)

## Repository, Branch, and Worktree

| Item | Value |
|---|---|
| Repository | `D:/Repos/keon-omega/keon-systems` (remote `https://github.com/Keon-Systems/keon-systems.git`) |
| Base | the GMF-P2A builder-branch state: branch `codex/gmf-p2a-store-20260927`, worktree `D:/Repos/agent-skills-worktrees/gmf-p2a-store-keon-systems-20260927` (P2B←P2A per `charter.md:180` and `goal-status-report-2026-09-27.md:124`) — see the base-reading STOP flag below |
| Builder branch | `codex/gmf-p2b-atomic-spend-20260928` |
| Builder worktree | `D:/Repos/agent-skills-worktrees/gmf-p2b-atomic-spend-keon-systems-20260928` — absent at shaping time (verified 2026-09-28); created only after explicit Gate 2 |

**Base-reading STOP flag (coordinator ruling required at Gate 2).** Two readings
of "the base" exist and this spec cannot choose between them:

1. **Branch-state reading (default above, per GMF sequencing):** P2B bases on the
   `codex/gmf-p2a-store-20260927` state — the landed P2A store — because
   `charter.md:180` makes GMF-P2A P2B's dependency and P2A's store is P2B's
   foundation ("TryBeginEffect implements the P1-C107 commit shape so P2B
   composes its validation on top", `SqlitePermissionSpendLedger.cs:190-193`).
2. **Merged-main reading:** P2B bases on `main` after the P2A chain's
   green-contingent Gate-3 merge (PRs only, never direct-to-main; charter
   standing authorizations 2026-09-27), so P2B builds on reviewed, merged bytes
   and its own PR chain composes cleanly against `main`.

Shaping-time observation (2026-09-28, `git log`/`git status` in the P2A
worktree): `codex/gmf-p2a-store-20260927` HEAD is still `2b6c75536f50f125155ee697446cec89f70f2fec`
(the charter baseline) and the entire P2A delivery sits **uncommitted** in that
worktree (6 modified + 6 untracked files, exactly P2A's 12 Allowed Files).
Neither reading can name a P2B base commit SHA until the P2A work reaches a
committed state (its own PR chain under the standing green-contingent grant).
The builder records the resolved base commit at Step 0; a base that is an
uncommitted worktree state is not a valid base.

## Contracts Consumed

Every P1 contract family the transaction binds, as frozen clause IDs (links, not
bodies). The transaction enforces the contract's verdicts at effect time; it
never re-decides the contract.

| P1 family (frozen clauses) | Transaction binding |
|---|---|
| Effect descriptors (P1-C001–C020) | Descriptor-hash validation (`P1-C017`) and recomputed-descriptor agreement (`P1-C008`) are verdict inputs; attempt rows bind effect class, descriptor hash, and attempt ordinal (`P1-C009`/`P1-C010`); cross-class reuse denied by construction (`P1-C002`) |
| Source/environment identities (P1-C021–C045) | Attempt rows carry the source/environment identity hash bindings (`P1-C021`/`P1-C027`) as `BeginEffectRequest` fields (`SqlitePermissionSpendLedger.cs:199`); manifest verification itself is P4B |
| Envelope and admission (P1-C046–C065) | **P2B obligations named by the freeze:** the `P1-C048` non-authority proof artifact (checker + checked property) and `P1-C049` enforcement of the bound audience/nonce via canonical `IPermission` validation; audience enforcement and replay linkage (`P1-C050`); envelope fields never authorize (`P1-C047`/`P1-C051`); allowed proof material only (`P1-C052`). MCP capability enforcement is P5 (`P1-C053`–`P1-C062`) |
| Canonicalization and error codes (P1-C066–C078) | All compared hashes are SHA-256 over `P1-C066` canonical bytes with `P1-C069` domain separation; every denial value is a `P1-C071` closed-set code (`ReceiptPersistenceSchema.cs:50-77` pins the literals); pre-spend denial family (`P1-C075`); post-spend failure family (`P1-C076`, used only by the two-outcome recovery seam); comparator obligation (`P1-C070`) |
| Artifact/evidence manifests (P1-C079–C100) | Terminal rows the recovery seam may append carry the evidence-manifest hash (`P1-C080`/`P1-C081`); store direction is the SQLite ledger line (`P1-C093`, DR-006(a) RESOLVED, implemented in P2A); signing/key-provider stays CARRIED (`P1-C094`); durable-store shape (`P1-C096`) is the P2A foundation |
| Terminal, receipt, settlement (P1-C101–C125) | Seven receipt types (`P1-C101`); terminal completeness (`P1-C102`); closed terminal sets (`P1-C103`–`P1-C105`); denial durability (`P1-C106`); atomic pre-effect commit — this parcel's core (`P1-C107`); consumed-permission permanence (`P1-C108`); pre-effect receipt fields (`P1-C109`); terminal receipt fields (`P1-C110`); one receipt per attempt (`P1-C111`); conflicting-terminal rejection (`P1-C112`, structural in the store); reservation quarantine (`P1-C113`); unknown-cost reservation (`P1-C115`); append-only settlement shape (`P1-C116`, append-only enforcement only — settlement logic is P2C); atomicity/race rule (`P1-C120`); promotion-replay linkage shape (`P1-C122`); non-acceptance (`P1-C123`); store-failure rule (`P1-C124`) |

Permanent negative conformance targets (`gmf-p0-permanent-negative-scenarios.md`,
rows whose downstream names P2B): GMF-NEG-004 (profile disagreement), 005
(replay), 006 (descriptor substitution), 007 (audience mismatch), 008
(revocation), 009 (expiry), 016 (same-permission second attempt), 023 (budget
race), 024 (slot race), 040 (terminal-permission replay), 055 (call-budget
race shape), 059 (envelope forgery — the `P1-C048` proof case), 060 (persistence
failure). All are NOT_TESTED as executions today; this parcel makes them
executable transaction-level controls.

## Integration Surfaces

- `SqliteAuthorityAccountingStore` (`keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs:391`):
  the P2A store primitive family the transaction composes — `TryBeginEffect`
  (`:419`, P1-C107 commit shape + deny shapes documented `:404-418`),
  `TryAppendTerminal` (`:636`), `TryAppendSettlement` (`:735`),
  `TryQuarantineReservation` (`:828`), `RecordDenial` (`:859`), readbacks
  (`:863`-`:996`). The store header reserves the decision logic for this
  parcel (`:185-193`). This file is modified **additively**: an in-boundary
  validation/admission composition point (validation verdict evaluation and
  budget-capacity admission executed inside the same `BEGIN IMMEDIATE` bundle
  that commits the write bundle) plus nothing else; `IPermissionSpendLedger`
  semantics (`GetSpendCount` `:54`, `TryRecordSpend` `:69`), the `TryBeginEffect`
  deny shapes, and the busy/lock retry behavior are preserved exactly.
- `ReceiptPersistenceSchema` (`ReceiptPersistenceSchema.cs:29`): consumed
  unchanged — closed `Vocabulary` (`:36`: effect classes `:39`, 26-code
  `DenialFailurePendingCodes` `:50`, terminal sets, `RaceLostCode`,
  `ReplayCode`, `PendingUnknownCostCode`, `DurableStateOrigin`,
  `PendingEffectMarker`), the v2 DDL and its UNIQUE/PK constraints
  (`:475`/`:490`/`:516`/`:538`/`:555`/`:574`/`:588`/`:607`/`:626`), append-only
  triggers (`:664`ff), torn-schema refusal (`:218`, `:371`), migration
  (`:393`). No ALTER (`:466-468`).
- `PermissionSpendVerifier` (`Keon.Verify/PermissionSpendVerifier.cs:81`) and
  its composed primitives `DelegationChainVerifier` /
  `DelegationRevocationRegistry` (`Keon.Verify`): the semantic baseline and
  composed checks; unchanged. `IPermissionSpendGate`
  (`Keon.Contracts/Authority/IPermissionSpendGate.cs:28`),
  `RuntimePermissionSpendGate` (`Keon.Verify/RuntimePermissionSpendGate.cs:52`),
  `DenyAllPermissionSpendGate`
  (`Keon.Runtime/Execution/DenyAllPermissionSpendGate.cs:24`), and
  `ExecutionDispatcher` (`ExecutionDispatcher.cs:25`, spend proof `:348`-`:360`):
  unchanged consumers; the transaction is NOT wired into them in this parcel.
- The new transaction surface (`Keon.Verify/AtomicEffectSpendTransaction.cs`):
  the sole entry that performs the D6/A1-D6 boundary — request record (canonical
  permission evidence + presented descriptor/audience/nonce/policy/lineage +
  budget/slot/reservation inputs), the seven verdicts evaluated inside the
  store transaction, the atomic commit via `TryBeginEffect`, receipted denials
  via `RecordDenial`, race admission with winner linkage, and the two-outcome
  pending-state resolution seam. Future effect paths (P3B/P4B) must route every
  effect-time spend through it; nothing in this parcel does.
- `LaunchExecution` / `LaunchReadiness` (`Keon.Runtime.Api`), the
  `SqliteControlledExecutionLedger` cutover family
  (`Execution/SqliteControlledExecutionLedger.cs`), and MCP Gateway
  `RuntimeClient` fail-closed receipt custody: untouched relationships
  (read-only references; this parcel writes none of them).

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
| Solution / test stack | `Keon.sln`; xunit 2.9.3 + Moq under `tests/Keon.Runtime.Tests` (references both `Keon.Runtime` and `Keon.Verify`, `Keon.Runtime.Tests.csproj:23-27`); `System.Data.SQLite.Core` 1.0.118 (WAL, `PRAGMA user_version`) |
| Verification commands | `dotnet restore Keon.sln -m:1 --nologo --verbosity minimal`; `dotnet build Keon.sln -m:1 --configuration Release --no-restore --nologo --verbosity minimal`; `dotnet test Keon.sln -m:1 --configuration Release --no-build --nologo --verbosity minimal`; `./scripts/verify-build-integrity.ps1`; analyzer enforcement: `dotnet restore src/Keon.Runtime/Keon.Runtime.csproj -m:1 --nologo --verbosity minimal`, `dotnet build src/Keon.Runtime/Keon.Runtime.csproj -m:1 --configuration Release --no-restore --nologo --verbosity minimal -warnaserror`, `dotnet test tests/Keon.Analyzers.Tests/Keon.Analyzers.Tests.csproj -m:1 --configuration Release --nologo --verbosity minimal` |
| Isolation tier | None claimed (MAP-011): transaction tests run as local file-based SQLite in temp paths; no container, WSL, or VM is used or eligible; no provider, network service, or gateway is contacted |

Environment-local green never upgrades another environment; evidence records the
exact host/toolchain identities above.

## Required Tests

1. **Atomicity tests** (`AtomicEffectSpendTransactionTests.cs`): the seven D6
  steps commit together or not at all — success persists exactly one spend row,
  one `EffectAttempts` row, one `BudgetReservations` row (known or
  `FLEET_PENDING_UNKNOWN_COST` per `P1-C073`), the slot claim when requested,
  one `PreEffectReceipts` row with the exact `P1-C109` field list, and one
  `PendingEffects` row (`P1-C107`); any injected failure at any step leaves all
  seven absent and the permission unconsumed (`P1-C124`, AC(a)).
2. **Fail-closed verdict tests** (same file): each of the seven D6 verdicts has
  a non-satisfied fixture (revoked, expired, substituted descriptor hash,
  cross-audience, nonce replay, policy-version mismatch, broken lineage) whose
  result is exactly one durable denial receipt with the mapped `P1-C071` code
  and zero attempt/reservation/slot/receipt/pending rows (AC(b), `P1-C075`).
3. **Equivalence suite** (same file, `verification_class: equivalence-provable`):
  shared synthetic fixtures run through both `PermissionSpendVerifier.VerifyAndSpend`
  and the transaction's verdict pass; every fixture agrees on satisfied vs
  denied and on the verdict family. Any divergence fails. Mutation control:
  weakening one verdict in the transaction makes this suite fail.
4. **One-spend/one-effect tests** (same file): consumed permission re-presented
  → `FLEET_DENIED_REPLAY` denial linked to the original record, single spend
  row, zero new bundle rows (GMF-NEG-005/016/040); idempotent re-presentation
  returns the recorded effect/receipt without a second bundle (AC(c),
  `D21`/`P1-C108`/`P1-C111`).
5. **Race tests on separate connections** (`AtomicEffectSpendTransactionTests.cs`):
  budget race (GMF-NEG-023), slot race (GMF-NEG-024), call-budget race shape
  (GMF-NEG-055), permission-use race — N concurrent transactions against K
  capacity admit exactly the valid set; each loser gets `FLEET_DENIED_RACE_LOST`
  with winner linkage (`WinnerEffectId`/`LinkedReceiptId` on `DenialReceipts`,
  `ReceiptPersistenceSchema.cs:588`), overspend zero (AC(d), `P1-C074`/`P1-C120`).
6. **Crash-safety tests** (`AtomicSpendCrashSafetyTests.cs`): fault injection at
  each step boundary + database close mid-transaction (GMF-NEG-060) → reopened
  database shows zero partial writes; post-commit crash → exactly the committed
  set with the permission consumed; both recovery outcomes exercised on a
  pending effect, with raw-SQL proof the permission is never unconsumed and no
  second bundle appears (AC(e), `P1-C108`). Mutation control: a recovery path
  that un-consumes fails this suite.
7. **Negative controls** (`AtomicSpendNegativeControlsTests.cs`): the thirteen
  GMF-NEG rows of AC(g) as failing-when-broken transaction-level controls with
  the P0 record's named state/zero assertions mapped to raw-SQL observations
  (e.g. GMF-NEG-008: "zero reservations, zero slots, denial receipt persisted";
   GMF-NEG-006: both hashes retained; GMF-NEG-023: reservation count = K).
8. **Envelope non-authority proof** (`EnvelopeNonAuthorityProofTests.cs`): the
  `P1-C048` checker + checked property — structural enumeration of every path
  to a `PermissionSpendLedger` append shows canonical `IPermission` validation
  precedes it; forged/widened/reissued envelope presentations produce
  `FLEET_DENIED_ENVELOPE_FORGERY`-family denials and zero spend rows
  (GMF-NEG-059, `P1-C047`/`P1-C051`). Mutation control: adding an
  envelope-only spend path makes the checker fail.
9. **No-regression**: the entire existing suite — including GMF-P2A's landed
  tests byte-unmodified and the KEON005 analyzer suite
  (`tests/Keon.Analyzers.Tests`, real-source compile + canary mutation) —
  remains green.

Tests must fail when their named invariant is broken (mutate the fixture to
prove each assertion binds); passing alone is not evidence.

## Independent Observation Points

- **DB-level observer (primary):** raw SQL over a separate SQLite connection
  that never calls the API under test — the P2A test family's pattern
  (`AuthorityAccountingStoreTests.cs:23-29`, `:85`;
  `AuthorityAccountingStoreMigrationTests.cs:12`): direct SELECT over
  `PermissionSpendLedger`/`EffectAttempts`/`BudgetReservations`/`ConcurrencySlots`/`PreEffectReceipts`/`PendingEffects`/`DenialReceipts`,
  `sqlite_master` UNIQUE/PK presence, `foreign_key_check`, and post-failure/
  post-crash row-set comparison (exactly-the-committed-set assertions).
- **Canonical-bytes comparator (P1-C070):** descriptor-substitution and
  envelope-forgery controls compare recomputed canonical bytes and both hashes
  through a comparator independent of the requestor; self-report never proves
  equality.
- **Equivalence observer:** the equivalence suite (Required Tests 3) observes
  verdict agreement between the frozen verifier semantics and the transaction
  on shared fixtures — the `verification_class: equivalence-provable` proof.
- **Diff/hash observer (coordinator):** `git diff --name-only` ⊆ Allowed Files,
  `git diff --check`, and byte-integrity re-verification of the 11 governing/
  P0 records (6 governing + 5 P0) plus the 7 P1 records at claim verification
  (pin anchor per the loop-directive coordinator ruling 2026-09-27: the goal
  records are git-tracked in `agent-skills`, so byte-integrity is proven by
  `git diff`/`git status` showing zero builder-attributable change, with
  SHA-256 captured at builder Step 0 into the closure record as baseline).
- **Compiler-analyzer observer:** KEON005 enforcement (independent of the test
  suite) plus its canary test proving the harness fires if spend-gate dominance
  is bypassed.
- **Effect-path observer:** zero-external-effect observation at AC(g) is made
  from outside the component under test (raw SQL proving the durable ledger is
  the only state change, plus a static/absence check of launch/provider
  surfaces in the diff); component self-report never proves zero effect
  (`P1-C123`; P0 observer rule).

## Verification Plan

Builder Step 0 restates this spec, exact Allowed Files, repository/base/branch/
worktree (including the resolved base commit under the base-reading ruling), the
prohibited actions, and known blockers, then stops for coordinator ruling before
implementation. Any hash, HEAD, owner, or file-state mismatch is a stop.

Required deterministic checks after the builder claim:

1. Re-verify repository identity (base commit, branch, worktree), the 11
   governing/P0 records and the 7 P1 records against their git-tracked bytes
   and the Step-0 SHA-256 baseline; record any builder-attributable drift as a
   stop (coordinator record-maintenance edits per the loop directive are not
   drift).
2. Prove `git diff --name-only` ⊆ Allowed Files in `keon-systems` and that
   `agent-skills`, `keon-mcp-gateway`, `keon-contracts/`, GMF-P2A's landed test
   files, and every governing/P0/P1 record show zero change.
3. Run the Environment Identity commands; record pass/fail per command.
4. Run the raw-SQL observation scripts for AC(a)–(g) and the crash-injection
   observations and record outputs verbatim.
5. Prove AC(g)'s byte-integrity clause by hash/diff (coordinator-side, not a
   shipped byte-pin test).
6. Run two fresh independent adversarial reviews (Runtime/concurrency/security
   class); reconcile findings as fix, accept-as-documented, or informational;
   any unresolved Critical/High forces HOLD.

Mandatory reviewer focus questions:

- Are the seven D6 steps genuinely one database transaction — can any failure
  or crash leave a partial bundle (spend without receipt, receipt without
  pending state, reservation without attempt)?
- Is every validation verdict evaluated inside the boundary at commit time, and
  does every non-satisfied verdict leave the permission unconsumed with a
  `P1-C071` receipted denial and zero bundle rows?
- Can a consumed permission ever be consumed, resurrected, or re-spent again —
  across retry, idempotent replay, crash recovery, or the two-outcome recovery
  seam (`D21`/`P1-C108`)?
- Do the race tests use truly separate connections, admit exactly the valid
  set, and record `FLEET_DENIED_RACE_LOST` with winner linkage and zero
  overspend (`P1-C074`/`P1-C120`)?
- Does the equivalence suite actually pin the transaction's verdicts to
  `PermissionSpendVerifier`'s frozen check order and fail-closed semantics —
  and does it fail when one verdict is weakened?
- Does the `P1-C048` checker enumerate every path to a spend-ledger append and
  fail if an envelope-only path is added (GMF-NEG-059 proof case)?
- Does any new surface treat envelope fields, receipts, roles, or evidence as
  authorization (D2 breach, `P1-C047`/`P1-C051`)?
- Is any denial/terminal value outside `P1-C071`/`P1-C103`–`P1-C105` possible,
  and does the schema reject it?
- Does anything weaken KEON005's spend-proof dominance, the KEO-172
  point-of-no-return rule, the trusted-clock rule, or the existing fail-closed
  verdict semantics?
- Does the change set touch any P2A landed test, any schema object, or any file
  outside Allowed Files (post-review git-detection control)?

## Allowed Files

Only these exact `keon-systems` repository-relative paths may be created or
changed for GMF-P2B (no globs, no directory shorthand; any other path is a stop
until a coordinator-ratified spec amendment names it):

- `src/Keon.Verify/AtomicEffectSpendTransaction.cs` — NEW: the D6/A1-D6
  transaction (request/verdict records, in-boundary seven-verdict evaluation,
  atomic commit via the P2A store, receipted denials with the total
  verdict→`P1-C071` code mapping, race admission with winner linkage, the
  two-outcome pending-state resolution seam).
- `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs` —
  additive only: the in-boundary validation/admission composition point on
  `SqliteAuthorityAccountingStore` (validation verdict evaluation and
  budget-capacity admission inside the same `BEGIN IMMEDIATE` bundle).
  `IPermissionSpendLedger` semantics and `TryBeginEffect`'s existing behavior
  and deny shapes are frozen by usage.
- `tests/Keon.Runtime.Tests/AtomicEffectSpendTransactionTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/AtomicSpendNegativeControlsTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/AtomicSpendCrashSafetyTests.cs` — NEW.
- `tests/Keon.Runtime.Tests/EnvelopeNonAuthorityProofTests.cs` — NEW.

The two shaping files for this spec in `agent-skills` (this spec and any
coordinator-produced shaping-result JSON) are shaping-owned and remain read-only
to the builder. Shaping note: this spec was produced under a single-file shaping
contract and ships without a companion `gmf-p2b-atomic-spend-transaction.shaping-result.json`;
the coordinator generates that record if the dispatch flow requires it (the P2A
shaping-result format is the precedent).

## Forbidden

- Editing anything outside the Allowed Files: other `keon-systems` sources
  (including `Keon.Contracts` C#, `ReceiptPersistenceSchema.cs`,
  `PermissionSpendVerifier.cs`, `RuntimePermissionSpendGate.cs`,
  `ExecutionDispatcher.cs`, `LaunchExecution.cs`, `LaunchReadiness.cs`, all of
  GMF-P2A's landed test files), `keon-contracts/`, `.github/`, `scripts/`,
  `docs/`, project files (unless a stop-and-report names the need), or any file
  in `agent-skills`, `keon-mcp-gateway`, or a future Fleet repository.
- Touching, cleaning, resetting, stashing, committing into, or deleting the P2A
  builder worktree `gmf-p2a-store-keon-systems-20260927`, any `_wt-*` /
  `_worktrees/` / `.claude/worktrees/` worktree, or any user-owned dirty file.
- Enabling any effect path, relaxing KEON005 or any fail-closed gate, weakening
  `PermissionSpendVerifier`/`RuntimePermissionSpendGate` verdict semantics or
  the KEO-172 point-of-no-return rule, rewriting append-only history, altering
  the v2 schema, or adding receipt types, terminal states, error codes, or
  effect classes.
- Building GMF-P2C behavior (lease recovery, settlement adjustment, readiness,
  quarantine release) past the two-outcome recovery seam.
- Provider/model/MCP calls, network activity beyond `dotnet restore`,
  workload/container/WSL/VM launches, credential access, and source disclosure.
- Any commit, push, PR, merge, or deployment (the standing green-contingent PR
  grant covers parcel/closure PRs presented by the coordinator, never
  direct-to-main pushes; nothing in this parcel authorizes the builder to push).

## Collision Risk and Sequencing

Collision risk is **medium** at the base-state surface and **low** at the
write-set surface, verified 2026-09-28:

- **Base-state dependency (MEDIUM):** P2B's base is the P2A delivery, which at
  shaping time is uncommitted in `gmf-p2a-store-keon-systems-20260927` (6
  modified + 6 untracked files at HEAD `2b6c755`, exactly P2A's 12 Allowed
  Files). Until the P2A chain reaches a committed state there is no valid P2B
  base commit (base-reading STOP flag above). The P2A worktree is evidence
  state: OFF-LIMITS to the P2B builder.
- **Write-set disjointness (LOW):** the six Allowed Files are new P2B test/
  source files plus one additive extension of
  `SqlitePermissionSpendLedger.cs`. The only live-writer risk is another actor
  on `src/Keon.Runtime/**`, `src/Keon.Verify/**`, or
  `tests/Keon.Runtime.Tests/**`; none observed 2026-09-28.
- **Sibling/goal collision (LOW):** MRC-23 is Lane P-A (GMF slot 2,
  `goal-status-report-2026-09-27.md:124`), separate Keon repositories from the
  Lane-G `routing-policy/**`+`dispatch/**` surfaces and from the `agent-skills`
  doc/package goals; no contested writes with any concurrently dispatched
  sibling. Within the GMF chain sequencing is serial (MRC-22→MRC-23→MRC-24,
  `goal-status-report-2026-09-27.md:124-125`).
- **Stale/other worktrees (LOW, OFF-LIMITS):** main worktree
  `D:/Repos/keon-omega/keon-systems` (HEAD `2b6c755`, one tracked tool-metadata
  modification `M .serena/project.yml` — not a write target); `_worktrees/tail-keon-systems-201`
  (`4c9061a`, detached) and `_worktrees/tail-keon-systems-202` (`b22fccf`,
  detached) on unrelated branches. The `gmf-p2a-store-keon-systems-20260916`
  worktree recorded as a collision risk in the GMF-P2A spec is **absent**
  (verified 2026-09-28): whatever became of its uncommitted diff is an
  owner/coordinator disposition item recorded at Gate 2 if it reappears; this
  parcel neither consumes nor restores it. `keon-mcp-gateway` remains
  pre-dirty on `.serena/project.yml` and out of bounds.
- **Lane G discipline:** no file in Lane G's contested surfaces is in this
  write set; no Window discipline applies.

Sequencing: the builder works only in the named 20260928 worktree; serializes
against any live writer appearing on `src/Keon.Runtime/**`, `src/Keon.Verify/**`,
or `tests/Keon.Runtime.Tests/**`; and stops if the P2A base state changes
mid-parcel, any listed worktree becomes dirty on an Allowed File, or another
writer claims an Allowed File.

## Rollback and Cleanup

- The transaction is additive code over the unchanged v2 schema: rollback is
  removal of the new surface and the additive store extension, leaving every
  P2A row, table, trigger, and guarantee intact and inert. There is no
  destructive down-migration and no data migration in this parcel.
- The transaction itself is all-or-nothing: every failure path rolls back the
  full pre-effect bundle inside the store transaction (`P1-C124`); denial
  receipts are the only durable artifact of a denied attempt and are append-only
  evidence, never rollback targets.
- Test databases are created under temp paths and deleted on dispose including
  `-wal`/`-shm` files; cleanup must never erase assertion evidence (a cleanup
  that hides a failed assertion fails the scenario). Crash tests preserve the
  torn/closed database for the raw-SQL observation before cleanup.
- Post-acceptance cleanup is Stage-F coordinator work: only the parcel-owned
  worktree/branch may be removed, and only after the closure record exists.
  Pre-existing worktrees (including the P2A worktree) and user-owned changes are
  never deleted or reset.

## Evidence and Handoff

The builder handoff must contain: starting and ending base commit and branch;
exact files changed with SHA-256 and line counts; every command run with
verbatim output (restore/build/test/analyzer/build-integrity); the raw-SQL
observation outputs for AC(a)–(g) including the crash-injection before/after row
sets; the verdict→`P1-C071` mapping table as implemented; the equivalence-suite
result against `PermissionSpendVerifier`; the `P1-C048` checker description
(enumerated spend paths + checked property) and its mutation-control result;
test names mapped to every acceptance criterion and every GMF-NEG control;
`git diff --name-only` and `git diff --check` outputs; the untouched-state
confirmation for the Collision Risk worktrees; and the resolved base-reading
ruling with its commit SHA. The coordinator assembles
`plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p2b-closure-evidence.md`
at claim verification (coordinator authority; not builder authority). No
receipt is minted, and nothing in the evidence grants Gate 2, Gate 3, or any
external effect.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a governing-record/P0/P1 hash, repository HEAD, branch, worktree state, owner,
  or instruction conflicts with this spec, or the base-reading ruling is absent
  at Step 0, or the resolved base is an uncommitted worktree state;
- a D6/A1-D6 step or a `P1-C075` verdict cannot be enforced inside the single
  transaction with the P2A store as landed (record it as a GAP for P2C shaping;
  do not invent a contract or alter the schema);
- the transaction's verdicts cannot be kept provably equivalent to
  `PermissionSpendVerifier`'s frozen check order and fail-closed semantics
  without editing that verifier, the gates, `ExecutionDispatcher`, or KEON005;
- implementation would require a file outside Allowed Files, any GMF-P2A landed
  test edit, a `keon-contracts/` or `Keon.Contracts` C# edit, a schema
  ALTER/migration, signing/key-provider work (CARRIED), or any P1-C### change;
- any test would need a non-synthetic fixture, a secret, a network service, a
  provider/model/MCP call, or a workload/container/VM launch;
- the effect path would need to be enabled, or a zero-external-effect or
  zero-partial-write claim cannot be observed independently;
- the two-outcome recovery seam would require lease recovery, settlement,
  readiness, or quarantine-release logic (GMF-P2C scope), or any recovery path
  would un-consume, resurrect, or re-spend a permission;
- KEON005, a fail-closed gate, an append-only guarantee, or the KEO-172
  point-of-no-return rule would need weakening; or
- any wording would read as granting Gate 2, repository creation, disclosure,
  spend, promotion, merge, installation, deployment, publication, or Gate 3.

On stop: preserve partial evidence, set the closure recommendation to `HOLD`,
name the exact decision/evidence/authority required, and return control to the
coordinator.