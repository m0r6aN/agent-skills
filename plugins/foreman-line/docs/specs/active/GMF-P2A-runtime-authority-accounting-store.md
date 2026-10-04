---
ticket: GMF-P2A
title: Durable Runtime authority/accounting store and migration
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/specs/active/GMF-P2A-runtime-authority-accounting-store.md
  - plugins/foreman-line/docs/specs/active/gmf-p2a-runtime-authority-accounting-store.shaping-result.json
  - keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs
  - keon-systems/src/Keon.Runtime/Observability/Persistence/ReceiptPersistenceSchema.cs
  - keon-systems/src/Keon.Runtime/Observability/Persistence/DependencyInjection/ReceiptPersistenceServiceCollectionExtensions.cs
  - keon-systems/src/Keon.Runtime/Execution/SqliteControlledExecutionLedger.cs
  - keon-systems/src/Keon.Runtime/Execution/IControlledExecutionLedger.cs
  - keon-systems/src/Keon.Runtime.Api/LaunchExecution.cs
  - keon-systems/src/Keon.Runtime.Api/LaunchReadiness.cs
  - keon-systems/tests/Keon.Runtime.Tests/SqlitePermissionSpendLedgerTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/AuthorityAccountingStoreMigrationTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/AuthorityAccountingStoreTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/SqliteControlledExecutionLedgerTests.cs
  - keon-systems/tests/Keon.Runtime.Tests/EffectPathDisabledTests.cs
  - keon-systems/tests/Keon.Runtime.Api.Tests/LaunchExecutionCutoverTests.cs
routing_class: architecture/risk
verification_class: equivalence-provable
permission_profile: builder-architecture
data_classification: internal
---

# GMF-P2A — Durable Runtime authority/accounting store and migration

## Intent

Build the durable Runtime authority/accounting store in `keon-systems` by extending
the SQLite ledger line (DR-006(a), frozen at `P1-C093`) to durably hold the
authority/accounting state the charter's D6/A1-D6 transaction names — permission
consumption, unique effect-attempt records, budget reservations, concurrency-slot
state, pre-effect receipts, pending-effect state, terminal outcomes, and append-only
settlements — with database uniqueness and isolation guarantees, plus the versioned
migration (SQLite spend ledger v1 → v2; in-memory launch ledger → durable
governed-action ledger) with explicit cutover semantics. The effect path stays
disabled: this parcel enables no worker execution, provider call, or promotion.
GMF-P2B will build the atomic spend/reservation/concurrency/pre-effect-receipt
transaction on top of these store guarantees.

## Constraints

- The controlling authority is the ratified charter with Amendment A1, the loop
  directive, the closed plan-review findings, and the discovery record. The seven
  P1 frozen-contract records are byte-faithful contract targets (freeze rule in
  `gmf-p1-effect-descriptors.md`): the builder cites `P1-C###` IDs and never
  paraphrases them into weaker form. Any need to change a frozen clause, D1–D24,
  A1–A7, the phase graph, the seven receipt-type count, the three effect classes,
  or retry/no-fallback semantics is a STOP with a scoped Gate-1 amendment request.
- Charter invariants, binding without restatement: **D2** — only Runtime-issued
  `IPermission` is canonical authority; the store records authority/accounting
  state and confers nothing (envelope, role, receipt, evidence, or foreman
  judgment never authorize; `P1-C047`/`P1-C051`). **D6/A1-D6** — Runtime owns one
  durable transaction boundary over validation of revocation, expiry, descriptor,
  audience, nonce, policy, and lineage; permission consumption; unique
  effect-attempt recording; budget reservation; concurrency-slot acquisition;
  and persisted pre-effect receipt plus pending-effect state under database
  isolation/uniqueness guarantees. This parcel delivers the store schema,
  guarantees, and migration; the atomic transaction logic is GMF-P2B. Reservations
  are accounting, not authority; unknown cost stays reserved until append-only
  settlement, adjustment, or human resolution; recovery never resurrects or
  re-spends permission. **D16** — Fleet profiles the existing seven receipt types
  (`P1-C101`); every effect records a durable denial or exactly one terminal
  outcome; history is append-only. **D21** — a satisfied spend is permanently
  consumed even when the effect fails, is ambiguous, or settles at zero.
- Store direction is fixed by `P1-C093` (DR-006(a) RESOLVED): extend the SQLite
  ledger line (`SqlitePermissionSpendLedger`, WAL, `PRAGMA user_version`,
  append-only per ADR-011/KEO-172). Key-provider/signing selection remains
  CARRIED (`P1-C094`): this parcel implements no signing, key provider, or trust
  root.
- Stored hashes are SHA-256 over UTF-8 RFC 8785 canonical bytes with the frozen
  domain separation (`P1-C066`–`P1-C069`). Denial/failure/pending code values are
  drawn only from the `P1-C071` closed vocabulary; terminal states only from the
  closed sets `P1-C103`–`P1-C105`. No new code, receipt type, or terminal state.
- The no-go boundary is absolute: the effect path stays disabled. No code path may
  start a process tree, contact a provider or MCP server, mount source, or perform
  external I/O. `ControlledExecutionHandler`'s only effect remains its internal
  governed-ledger append. The KEON005 authority analyzer is compiled into
  `Keon.Runtime` at Error severity: any edit invoking `IExecutionHandler.ExecuteAsync`
  without the KEON005 spend proof (VerifyAndSpend dominance + verdict gating +
  receipt identity) fails the build.
- Existing fail-closed spend semantics must not weaken: `IPermissionSpendGate`
  consumes a use only when every check passes and denies on every non-satisfied
  verdict with a receipted denial; `SqlitePermissionSpendLedger` rows are never
  deleted or decremented; verification time comes from the gate's own trusted
  clock (KEO-172).
- Fixtures and test data are `synthetic/public` only (A1-D22). No credentials,
  tokens, PII, customer data, or non-synthetic source anywhere in code, tests, or
  evidence.
- Consume, never edit: `keon-contracts/` JSON contracts (status
  `contract_candidate_pending_conformance`, owned by the `keon-systems` contract
  owner per S1), the seven P1 records, the five P0 records, and all governing
  records. Machine transcription of the P1 contract families into new
  `keon-contracts` schemas is not this parcel.
- Environment hygiene: no provider/model/MCP call, workload/container/WSL/VM
  launch, secret access, or source disclosure. `dotnet restore` against configured
  package sources is the only permitted network use; it is not a Fleet effect.

## Acceptance Criteria

- [ ] (a) The store schema and its versioned migration cover every durable
  authority/accounting state family D6/A1-D6 and `P1-C096` name, each bound to its
  frozen clause: spends/permission consumption (`P1-C108`), unique effect-attempt
  records (`P1-C010`/`P1-C111`), budget reservations including the explicit
  unknown/pending cost state (`P1-C073`/`P1-C115`), concurrency-slot state
  (`P1-C109`), pre-effect receipts with the exact `P1-C109` field list,
  pending-effect state (`P1-C109`), terminal receipts with the exact `P1-C110`
  field list and closed terminal sets (`P1-C103`–`P1-C105`), durable denial
  receipts (`P1-C106`), leaked-reservation quarantine state (`P1-C113`), and
  append-only settlement records (`P1-C116`). Validation-binding fields D6 names
  (descriptor hash, audience, nonce, expiry, policy version, lineage) are
  representable in the schema so P2B can validate inside one transaction without
  an ALTER.
- [ ] (b) Migration from the in-memory launch ledger has explicit, tested cutover
  semantics: (1) SQLite spend-ledger v1 → v2 preserves every existing v1 row
  byte-for-byte (append-only history never rewritten) and fresh initialization
  reaches the v2 schema (`PRAGMA user_version`, WAL, foreign keys enforced);
  (2) launch mode cuts over from `InMemoryControlledExecutionLedger` to the new
  durable `IControlledExecutionLedger` implementation behind the existing
  receipt-persistence configuration switch, with named semantics for pre-cutover
  in-memory records (non-authoritative, not imported), durable-state origin
  (explicit), and permission consumption (never resurrected across cutover or
  restart); (3) restart durability is proven by close/reopen of the database;
  (4) rollback semantics are documented and tested: flipping the switch back to
  in-memory leaves all v1 rows and all v2 history intact and inert.
- [ ] (c) Uniqueness and isolation guarantees are demonstrated by tests against the
  database, not the store API alone: a duplicate effect attempt is structurally
  rejected (unique constraint), an effect receives at most one terminal
  (conflicting terminal append rejected/detected with the original standing,
  `P1-C112`), a consumed permission cannot be consumed twice (`P1-C108`), and
  concurrent writers on separate connections admit exactly the valid set with
  race losers recorded as `FLEET_DENIED_RACE_LOST` (`P1-C074`/`P1-C120`) and zero
  overspend.
- [ ] (d) The effect path remains disabled, proven by a deterministic test /
  negative control, not prose: exercising every surface the parcel adds or wires
  yields zero external side effects (no process tree, no provider/MCP/network
  call, no external mutation) and no surface can reach an effect without the
  still-denied spend path. The claim is observed from an independent point (see
  Independent Observation Points), never from component self-report alone.
- [ ] (e) The P1 hash-pinned contract records, the P0 records, and the governing
  records are byte-unmodified (SHA-256 re-verified at claim verification), and no
  `keon-contracts/` file changes (verified by `git diff` in both repositories).
- [ ] (f) Append-only enforcement holds in the store: UPDATE/DELETE attempts on
  spend, terminal, and settlement history are rejected or durably detected
  (`P1-C112`/`P1-C116`), and every denial/terminal code value belongs to the
  `P1-C071` closed vocabulary.
- [ ] (g) The parcel changes exactly the Allowed Files in `keon-systems`; the
  existing test suite plus the new tests are green under the verification
  commands below, the KEON005 analyzer enforcement commands are green, and
  `git diff --check` is clean.
- [ ] (h) Two fresh, independent, adversarial reviews (routing class
  Runtime/data/security per the charter) return verdicts with no unresolved
  Critical or High finding before the Gate-3 readiness chain; reviewers never fix
  or commit.

## Out of Scope

- GMF-P2B transaction logic: the atomic validation/spend/reservation/concurrency/
  pre-effect-receipt transaction, spend-gate decision logic, and race admission
  rules themselves. P2A provides the store and its guarantees only.
- GMF-P2C work: terminal reconciliation, lease recovery, settlement adjustment,
  verification primitives, readiness/quarantine release logic. P2A provides only
  the state and append-only shapes those parcels consume.
- All external effects: worker execution, process-tree launch, source
  materialization, provider/model/MCP calls, and patch promotion. The effect path
  stays disabled through GMF-P4B.
- Anything in `keon-mcp-gateway` (pre-dirty, out of bounds), including MCP
  capability storage/counter implementation (P5 per `P1-C058`).
- Repository creation or protection (`GMF-HG-R1`), provider spend, private/internal
  source disclosure, patch promotion, merge, installation, deployment, publication,
  or Gate 3.
- Signing, key-provider, or trust-bundle implementation (CARRIED, `P1-C093`/`P1-C094`).
- New machine schemas in `keon-contracts/`, changes to any contract JSON, or new
  receipt types, terminal states, error codes, or effect classes.
- Editing charter, amendment, findings, discovery, loop directive, goal index,
  `model-fleet-v1`, any P0/P1 record, or any other repository.
- Changing `ExecutionDispatcher` spend-proof semantics, weakening KEON005, or
  touching `PermissionSpendVerifier`/`RuntimePermissionSpendGate` verdict
  semantics.

## Context & References

- `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md` (D2/D6/D16/D21, parcel table)
- `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md` (A1-D6, A1-D21)
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md` (PR-04)
- `plugins/foreman-line/docs/goals/governed-model-fleet/discovery.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-effect-descriptors.md` (P1-C001–C020)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-source-environment-identities.md` (P1-C021–C045)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-envelope-and-admission.md` (P1-C046–C065)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-canonicalization-and-error-codes.md` (P1-C066–C078)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-artifact-evidence-manifests.md` (P1-C079–C100, DR-006(a))
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-terminal-receipt-settlement.md` (P1-C101–C125)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p1-closure-evidence.md`
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-contract-inventory.md` (CTR-001, CTR-010, CTR-015)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-threat-model.md` (B-001, B-009, T-003, T-004)
- `plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p0-permanent-negative-scenarios.md` (GMF-NEG-005/023/024/055/060–064)
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/specs/active/GMF-P1-effect-source-environment-evidence-contracts.md` and its shaping-result (format precedent)
- `keon-systems/src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs` (v1 store seam)
- `keon-systems/src/Keon.Runtime/Execution/IControlledExecutionLedger.cs`, `InMemoryControlledExecutionLedger.cs`, `ControlledExecutionHandler.cs` (in-memory launch-ledger seam)
- `keon-systems/src/Keon.Runtime.Api/LaunchExecution.cs`, `LaunchReadiness.cs`, `LaunchAuthority.cs` (cutover and readiness seams)
- `keon-systems/src/Keon.Contracts/Authority/IPermissionSpendGate.cs`, `IPermissionSpendLedger.cs`, `src/Keon.Contracts/Permission.cs` (verdict vocabulary)
- `keon-systems/keon-contracts/contracts/ipermission.v1.json`, `permission_spend.v1.json`, `permission_event.v1.json`, `receipt_lifecycle_profile.v1.json` (consumed read-only)
- `keon-systems/.github/workflows/pr-validation.yml` (verification commands, KEON005 enforcement)

## Repository, Branch, and Worktree

| Item | Value |
|---|---|
| Repository | `D:/Repos/keon-omega/keon-systems` (remote `https://github.com/Keon-Systems/keon-systems.git`) |
| Base commit | `2b6c75536f50f125155ee697446cec89f70f2fec` (verified 2026-09-27: local `main` HEAD equals the charter baseline; `main` is ahead-3 of `origin/main`) |
| Builder branch | `codex/gmf-p2a-store-20260927` |
| Builder worktree | `D:/Repos/agent-skills-worktrees/gmf-p2a-store-keon-systems-20260927` — absent at shaping time; created only after explicit Gate 2 |

Shaping-time drift note (2026-09-27): the `keon-systems` main worktree shows one
tracked modification, `M .serena/project.yml` (tool-metadata file). It is not part
of this parcel, must not be committed or reverted by the builder, and does not
change the base commit.

## Contracts Consumed

Every P1 contract family the store schema binds, as frozen clause IDs (links, not
bodies). What the store records is a binding or reference; it never re-decides the
contract.

| P1 family (frozen clauses) | Store binding |
|---|---|
| Effect descriptors (P1-C001–C020) | Effect-attempt rows bind effect class, canonical descriptor hash (`P1-C017`), and attempt ordinal (`P1-C009`/`P1-C010`); cross-class reuse denied by construction (`P1-C002`) |
| Source/environment identities (P1-C021–C045) | Attempt/receipt rows carry source-identity and environment-identity hash references (`P1-C021`/`P1-C027`); manifest verification itself is P4B |
| Envelope and admission (P1-C046–C065) | Rows record permission identity, audience, and expiry snapshot (`P1-C109`); audience/nonce live in the canonical constraints schema (`P1-C049`/`P1-C050`); envelope fields never authorize (`P1-C047`/`P1-C051`); MCP capability storage is P5 |
| Canonicalization and error codes (P1-C066–C078) | All stored hashes are SHA-256 over P1-C066 canonical bytes with P1-C069 domain separation; every denial/failure/pending value is a P1-C071 closed-set code (`P1-C072`–`P1-C077`) |
| Artifact/evidence manifests (P1-C079–C100) | Terminal rows bind the evidence-manifest hash (`P1-C080`/`P1-C081`); store direction is the SQLite ledger line (`P1-C093`, DR-006(a) RESOLVED — implemented here); signing/key-provider stays CARRIED (`P1-C094`) |
| Terminal, receipt, settlement (P1-C101–C125) | Seven receipt types (`P1-C101`); terminal completeness (`P1-C102`); closed terminal sets (`P1-C103`–`P1-C105`); denial durability (`P1-C106`); atomic-commit store shape (`P1-C107`); consumed-permission permanence (`P1-C108`); pre-effect receipt fields (`P1-C109`); terminal receipt fields (`P1-C110`); one receipt per attempt (`P1-C111`); conflicting-terminal rejection (`P1-C112`); reservation quarantine state (`P1-C113`); unknown-cost reservation (`P1-C115`); append-only settlement (`P1-C116`); race-loser denial primitive (`P1-C074`/`P1-C120`); store-failure rule (`P1-C124`) |

Permanent negative conformance targets the store guarantees serve
(`gmf-p0-permanent-negative-scenarios.md`): GMF-NEG-005 (replay), NEG-023/024
(races), NEG-055 (call-budget race shape), NEG-060 (persistence failure),
NEG-061 (missing terminal), NEG-062 (conflicting terminal), NEG-063 (leaked
reservation), NEG-064 (forged cost evidence shape). All remain NOT_TESTED as
executions until their downstream observers land; this parcel proves the store
primitives they require.

## Integration Surfaces

- `IPermissionSpendLedger` (`keon-contracts`): implemented by the extended SQLite
  ledger; `GetSpendCount`/`TryRecordSpend` semantics preserved (append-only,
  permanent, exhaustion denies `already_consumed`).
- `IPermissionSpendGate` / `RuntimePermissionSpendGate` / `PermissionSpendVerifier`
  (`Keon.Verify`, `Keon.Contracts`): unchanged consumers; fail-closed verdict
  semantics preserved; the trusted-clock and receipted-denial contracts stand.
- `IControlledExecutionLedger` (`Keon.Runtime/Execution`): unchanged interface;
  the new `SqliteControlledExecutionLedger` is the durable implementation
  registered behind `ReceiptPersistenceConfig` (`Enabled`/`AutoMigrate`/
  `ConnectionString`) in `ReceiptPersistenceServiceCollectionExtensions`;
  `ControlledExecutionHandler` stays byte-behavior-identical (one governed-ledger
  append, no external I/O).
- `LaunchExecution` / `LaunchReadiness` (`Keon.Runtime.Api`): launch-mode cutover
  wiring and honest readiness/blocker text. `LaunchAuthority` and
  `InMemoryAuthorityGrantSource` remain configuration-seeded and unchanged.
- `ExecutionDispatcher` and the KEON005 analyzer contract: untouched semantics;
  analyzer enforcement remains green (see Environment Identity).
- MCP Gateway `RuntimeClient` fail-closed receipt custody: untouched relationship
  (read-only reference; this parcel writes no gateway code).

## Data Class

`internal` engineering artifacts: code, migrations, and `synthetic/public` test
fixtures only. No customer data, PII, credentials, regulated data, or
private/internal source. A1-D22 default-deny is preserved: nothing in this parcel
transfers or discloses source of any non-synthetic class.

## Environment Identity (build/test environment for verification)

| Element | Identity |
|---|---|
| Host | Windows 10.0.26200 x64 workstation (passive observation at shaping; refreshed at builder Step 0) |
| Toolchain | .NET SDK 10.0.401 locally; CI pins `dotnet-version: 10.0.x` with no `global.json` in `keon-systems` (`.github/workflows/pr-validation.yml`) |
| Solution / test stack | `Keon.sln`; xunit 2.9.3 + Moq under `tests/Keon.Runtime.Tests`; `System.Data.SQLite.Core` 1.0.118 (WAL, `PRAGMA user_version`) |
| Verification commands | `dotnet restore Keon.sln -m:1 --nologo --verbosity minimal`; `dotnet build Keon.sln -m:1 --configuration Release --no-restore --nologo --verbosity minimal`; `dotnet test Keon.sln -m:1 --configuration Release --no-build --nologo --verbosity minimal`; `./scripts/verify-build-integrity.ps1`; analyzer enforcement: `dotnet restore src/Keon.Runtime/Keon.Runtime.csproj -m:1 --nologo --verbosity minimal`, `dotnet build src/Keon.Runtime/Keon.Runtime.csproj -m:1 --configuration Release --no-restore --nologo --verbosity minimal -warnaserror`, `dotnet test tests/Keon.Analyzers.Tests/Keon.Analyzers.Tests.csproj -m:1 --configuration Release --nologo --verbosity minimal` |
| Isolation tier | None claimed (MAP-011): store tests run as local file-based SQLite in temp paths; no container, WSL, or VM is used or eligible; no provider, network service, or gateway is contacted |

Environment-local green never upgrades another environment; evidence records the
exact host/toolchain identities above.

## Required Tests

1. **Migration tests** (`AuthorityAccountingStoreMigrationTests.cs`): populated v1
   database migrates with every v1 row byte-for-byte unchanged; fresh
   initialization reaches v2 (`user_version`, WAL, `foreign_keys=1`); re-open is
   idempotent; partially-migrated states cannot present as v2.
2. **Store coverage tests** (`AuthorityAccountingStoreTests.cs`): each state family
   in AC(a) persists and reads back with its P1-C109/C110 field bindings; UPDATE/
   DELETE on history rows is rejected or durably detected (AC(f)).
3. **Uniqueness/isolation tests**: duplicate effect attempt structurally rejected;
   second consumption of a consumed permission denied at the store; one terminal
   per effect with conflicting append rejected and original standing; concurrent
   writers on separate connections admit exactly the valid set, losers recorded
   `FLEET_DENIED_RACE_LOST` with zero overspend (AC(c)).
4. **Cutover tests**: named cutover semantics from AC(b) each have an assertion,
   including restart durability (close/reopen), no import/resurrection of in-memory
   or consumed state, and rollback leaving v1 rows and v2 history intact.
5. **Effect-path-disabled negative control** (`EffectPathDisabledTests.cs`): AC(d)
   as a failing-when-broken test — if any enabled surface could produce an external
   effect, this test fails.
6. **No-regression**: existing `tests/Keon.Runtime.Tests` and the KEON005 analyzer
   suite (`tests/Keon.Analyzers.Tests`, real-source compile + canary mutation)
   remain green.

Tests must fail when their named invariant is broken (mutate the fixture to prove
each assertion binds); passing alone is not evidence.

## Independent Observation Points

- **DB-level observer (primary):** raw SQL over a separate SQLite connection that
  does not call the store API under test — `PRAGMA user_version`/`journal_mode`/
  `foreign_keys`, `sqlite_master` table/index presence (including unique
  constraints), direct SELECT of migrated rows, `foreign_key_check`, and
  UPDATE/DELETE probes against history tables.
- **Diff/hash observer (coordinator):** `git diff --name-only` ⊆ Allowed Files,
  `git diff --check`, and byte-integrity re-verification of the 11 governing/P0
  records (6 governing + 5 P0) plus the 7 P1 records at claim verification.
  Pin anchor (coordinator ruling 2026-09-27, recorded in the loop directive): the
  goal records are git-tracked in `agent-skills`, so byte-integrity is proven by
  `git diff`/`git status` showing zero builder-attributable change, with SHA-256
  values captured at builder Step 0 into `gmf-p2a-closure-evidence.md` as the
  baseline. Pre-existing coordinator record-maintenance edits (ownership/state/
  gates lines) are enumerated in the loop directive and are not drift.
- **Compiler-analyzer observer:** KEON005 enforcement (independent of the test
  suite) plus its canary test proving the harness fires if spend-gate dominance is
  bypassed.
- **Effect-path observer:** zero-external-effect observation at AC(d) must be made
  from outside the component under test (e.g., asserting the durable ledger is the
  only state change via raw SQL plus a static/absence check of launch/provider
  surfaces in the diff); component self-report never proves zero effect
  (`P1-C123`; P0 observer rule).

## Verification Plan

Builder Step 0 restates this spec, exact Allowed Files, repository/base/branch/
worktree, the prohibited actions, and known blockers, then stops for coordinator
ruling before implementation. Any hash, HEAD, owner, or file-state mismatch is a
stop.

Required deterministic checks after the builder claim:

1. Re-verify repository identity (HEAD `2b6c755…`, branch, worktree), the 11
   governing/P0 records (6 governing + 5 P0) and the 7 P1 records against their
   git-tracked bytes and the Step-0 SHA-256 baseline; record any
   builder-attributable drift as a stop (coordinator maintenance edits per the
   loop directive are not drift).
2. Prove `git diff --name-only` ⊆ Allowed Files in `keon-systems` and that
   `agent-skills`, `keon-mcp-gateway`, `keon-contracts/`, and every governing/P0/
   P1 record show zero change.
3. Run the Environment Identity commands; record pass/fail per command.
4. Run the raw-SQL observation script for AC(a)–(d) and record outputs verbatim.
5. Prove AC(e) by hash/diff (coordinator-side, not a shipped byte-pin test).
6. Run two fresh independent adversarial reviews (Runtime/data/security class);
   reconcile findings as fix, accept-as-documented, or informational; any
   unresolved Critical/High forces HOLD.

Mandatory reviewer focus questions:

- Can any migration step rewrite or delete append-only history, and does a crash
  mid-migration ever yield a database that silently claims v2 with partial schema?
- Does the schema make double-consumption and duplicate effect attempts
  structurally impossible (database uniqueness), or merely unlikely
  (application-level checks)?
- Does the cutover ever import, resurrect, or re-spend in-memory or already-consumed
  authority — across cutover, restart, or rollback?
- Does the schema bind descriptor hash, audience, nonce, expiry, policy version,
  and lineage richly enough for P2B to run D6's full validation inside one
  transaction without an ALTER — or does P2A quietly decide P2B's contract?
- Does the effect-path-disabled negative control observe zero external effects
  from an independent point, and does it fail when the boundary is broken?
- Does any new store surface treat envelope fields, receipts, roles, or evidence
  as authorization (D2 breach, `P1-C047`/`P1-C051`)?
- Are denial/terminal values confined to `P1-C071` and `P1-C103`–`P1-C105`, with
  one terminal per effect and conflicting appends rejected (`P1-C112`)?
- Do the concurrency tests use truly separate connections, and do losers record
  `FLEET_DENIED_RACE_LOST` with zero overspend (`P1-C074`/`P1-C120`)?
- Does any change weaken KEON005's spend-proof dominance, the trusted-clock rule,
  or the fail-closed verdict semantics of the existing spend gate?
- Are the pre-existing dirty/stale worktrees (see Collision Risk) byte-untouched at
  the end (post-review git-detection control)?

## Allowed Files

Only these exact `keon-systems` repository-relative paths may be created or
changed for GMF-P2A (no globs, no directory shorthand; any other path is a stop
until a coordinator-ratified spec amendment names it):

- `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
- `src/Keon.Runtime/Observability/Persistence/ReceiptPersistenceSchema.cs`
- `src/Keon.Runtime/Observability/Persistence/DependencyInjection/ReceiptPersistenceServiceCollectionExtensions.cs`
- `src/Keon.Runtime/Execution/SqliteControlledExecutionLedger.cs`
- `src/Keon.Runtime/Execution/IControlledExecutionLedger.cs`
- `src/Keon.Runtime.Api/LaunchExecution.cs`
- `src/Keon.Runtime.Api/LaunchReadiness.cs`
- `tests/Keon.Runtime.Tests/SqlitePermissionSpendLedgerTests.cs`
- `tests/Keon.Runtime.Tests/AuthorityAccountingStoreMigrationTests.cs`
- `tests/Keon.Runtime.Tests/AuthorityAccountingStoreTests.cs`
- `tests/Keon.Runtime.Tests/SqliteControlledExecutionLedgerTests.cs`
- `tests/Keon.Runtime.Tests/EffectPathDisabledTests.cs`
- `tests/Keon.Runtime.Api.Tests/LaunchExecutionCutoverTests.cs` — **Amendment
  2026-09-27** (coordinator-ratified per SPEC-CONVENTION §4.8, closing independent
  review findings A-F2/B-F2 on AC(b)(2): the `AddLaunchExecution` cutover factory
  needs a resolution test in `Keon.Runtime.Api.Tests`, the only assembly with
  `InternalsVisibleTo` access; scope is test-only, same repo, same surface)

`IControlledExecutionLedger.cs` authority is limited to documentation-comment
accuracy (its interface semantics are frozen by usage). The two shaping files for
this spec in `agent-skills` are shaping-owned and remain read-only to the builder.

## Forbidden

- Editing anything outside the Allowed Files: other `keon-systems` sources,
  `keon-contracts/`, `.github/`, `scripts/`, `docs/`, project files (unless a
  stop-and-report names the need), or any file in `agent-skills`,
  `keon-mcp-gateway`, or a future Fleet repository.
- Touching, cleaning, resetting, stashing, committing into, or deleting the
  pre-existing `gmf-p2a-store-keon-systems-20260916` worktree, any `_wt-*` /
  `_worktrees/` / `.claude/worktrees/` worktree, or any user-owned dirty file.
- Enabling any effect path, relaxing KEON005 or any fail-closed gate, rewriting
  append-only history, or adding receipt types, terminal states, error codes, or
  effect classes.
- Provider/model/MCP calls, network activity beyond `dotnet restore`, workload/
  container/WSL/VM launches, credential access, and source disclosure.
- Any commit, push, PR, merge, or deployment (the standing PR grant covers
  parcel/closure PRs presented by the coordinator, never direct-to-main pushes;
  nothing in this parcel authorizes the builder to push).

## Collision Risk and Sequencing

Collision risk is **high** at the worktree surface and **low** at the unmerged-work
surface, verified 2026-09-27:

- **Pre-existing uncommitted P2A-target work (HIGHEST):** worktree
  `D:/Repos/agent-skills-worktrees/gmf-p2a-store-keon-systems-20260916` on branch
  `codex/gmf-p2a-store-20260916` at `2b6c755` contains uncommitted changes to
  `src/Keon.Runtime/Observability/Persistence/SqlitePermissionSpendLedger.cs`
  (approx. +241/−108; extends the schema to `user_version = 2` with an
  `EffectAttempts` table and foreign keys) and an untracked
  `tests/Keon.Runtime.Tests/AuthorityAccountingStoreMigrationTests.cs` whose header
  reads "GMF-P2A: independent raw-SQL checks for the v1-to-v2 store migration".
  Provenance is unverified — no Gate 2 for P2A has been recorded. This worktree is
  OFF-LIMITS to the builder. Whether to adopt, port, or park that diff is an
  owner/coordinator decision recorded at Gate 2 and at builder Step 0; the builder
  never consumes it silently.
- **Stale `_wt-runtime-*` worktrees (LOW, verified fully landed):**
  `_wt-runtime-execute-identity-binding`, `_wt-runtime-policy-default-deny`,
  `_wt-runtime-receipt-immutability`, `_wt-runtime-receipt-sealing`,
  `_wt-runtime-spine-gates` — zero commits ahead of `main`, upstream branches gone
  (merged); `_wt-runtime-remediation-integration` — 6 commits, all patch-equivalent
  to `main` under `git cherry` (landed via squash/cherry-pick; behind by ~90).
  All are clean; none holds unmerged work on P2A seams; all are OFF-LIMITS (no
  cleanup by this parcel).
- **Stale other worktrees (LOW):** `keon-systems/.claude/worktrees/lucid-mclaren-841482`
  (`claude/lucid-mclaren-841482`, clean + untracked `.serena/`), plus the
  `_worktrees/` and `.worktrees/` entries on unrelated branches.
- **Main-worktree tool-metadata drift:** `M .serena/project.yml` (recorded above);
  `keon-mcp-gateway` remains pre-dirty on `.serena/project.yml`; neither is a
  write target.

Sequencing: the builder works only in the named 20260927 worktree; serializes
against any live writer appearing on `src/Keon.Runtime/**` or
`tests/Keon.Runtime.Tests/**`; and stops if any listed worktree becomes dirty or
another writer claims an Allowed File mid-parcel.

## Rollback and Cleanup

- The v1 → v2 migration is additive and versioned (`PRAGMA user_version`): v1
  tables and rows are never rewritten or dropped. Rollback of the cutover is the
  documented config switch back to in-memory, leaving v2 tables inert and all
  history intact; there is no destructive down-migration.
- Test databases are created under temp paths and deleted on dispose including
  `-wal`/`-shm` files; cleanup must never erase assertion evidence (a cleanup that
  hides a failed assertion fails the scenario).
- Post-acceptance cleanup is Stage-F coordinator work: only the parcel-owned
  worktree/branch may be removed, and only after the closure record exists.
  Pre-existing worktrees and user-owned changes are never deleted or reset.

## Evidence and Handoff

The builder handoff must contain: starting and ending commit; exact files changed
with SHA-256 and line counts; every command run with verbatim output (restore/
build/test/analyzer/build-integrity); the raw-SQL observation outputs for AC(a)–(d);
migration schema dumps (`user_version`, `sqlite_master`); test names mapped to
every acceptance criterion; the negative-control result; `git diff --name-only`
and `git diff --check` outputs; and the untouched-state confirmation for the
Collision Risk worktrees. The coordinator assembles
`plugins/foreman-line/docs/goals/governed-model-fleet/gmf-p2a-closure-evidence.md`
at claim verification (coordinator authority; not builder authority). No receipt
is minted, and nothing in the evidence grants Gate 2, Gate 3, or any external
effect.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a governing-record/P0/P1 hash, repository HEAD, branch, worktree state, owner, or
  instruction conflicts with this spec;
- the pre-existing `gmf-p2a-store-20260916` diff lacks a recorded owner disposition
  at Step 0, or any pre-existing worktree/file is dirty on an Allowed File;
- a D6/A1-D6 or `P1-C096` state family cannot be given a schema shape derivable
  from the frozen clauses (record it as a GAP for P2B shaping; do not invent a
  contract);
- implementation would require a file outside Allowed Files, a `keon-contracts/`
  edit, signing/key-provider work (CARRIED), or any P1-C### change;
- any test would need a non-synthetic fixture, a secret, a network service, a
  provider/model/MCP call, or a workload/container/VM launch;
- the effect path would need to be enabled, or a negative control cannot observe
  zero external effects independently;
- KEON005, a fail-closed gate, or an append-only guarantee would need weakening;
  or
- any wording would read as granting Gate 2, repository creation, disclosure,
  spend, promotion, merge, installation, deployment, publication, or Gate 3.

On stop: preserve partial evidence, set the closure recommendation to `HOLD`, name
the exact decision/evidence/authority required, and return control to the
coordinator.
