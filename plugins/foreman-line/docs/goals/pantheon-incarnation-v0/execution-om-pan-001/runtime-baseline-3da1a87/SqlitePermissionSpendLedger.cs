using System.Data.SQLite;
using Keon.Contracts.Authority;
using Keon.Runtime.Observability.Persistence;

namespace Keon.Runtime.Observability.Persistence;

/// <summary>
/// SQLite-backed, append-only permission spend ledger (KEO-172): the durable,
/// multi-instance <see cref="IPermissionSpendLedger"/> implementation. Mirrors the
/// persistence patterns of <see cref="SqliteDecisionReceiptStore"/> /
/// <see cref="SqliteAuthoritativeReceiptOutbox"/> (System.Data.SQLite, connection string
/// ctor, idempotent schema initialization).
///
/// SINGLE-USE ACROSS PROCESSES:
/// <see cref="TryRecordSpend"/> reserves a use inside a BEGIN IMMEDIATE transaction
/// (writer lock acquired up front, so competing reservations serialize) and the
/// (PermissionId, SpendIndex) PRIMARY KEY makes any lost race a constraint violation
/// rather than a double spend — exactly one competing spend wins the last remaining use,
/// even when the racers are separate processes over the same database file.
///
/// Durability posture: WAL journal mode (persistent, set at schema init), per-connection
/// busy timeout, foreign keys enforced, schema versioned via PRAGMA user_version (2:
/// the GMF-P2A authority/accounting store; v1 -> v2 migration is additive and preserves
/// every v1 row byte-for-byte).
///
/// APPEND-ONLY / POINT OF NO RETURN (ADR-011, KEO-172): rows are never deleted or
/// decremented. A recorded spend permanently consumes the use even if the handler that
/// the spend authorized subsequently fails (P1-C108/P1-C121: recovery never resurrects or
/// re-spends permission). UPDATE/DELETE are rejected by trigger (AC(f)).
/// </summary>
public sealed class SqlitePermissionSpendLedger : IPermissionSpendLedger
{
    private const int BusyTimeoutMs = 5000;
    private const int MaxRetries = 10;

    private readonly string _connectionString;

    public SqlitePermissionSpendLedger(string connectionString)
    {
        _connectionString = connectionString;
        InitializeSchema(connectionString);
    }

    /// <summary>
    /// Idempotent schema initialization (safe to call from multiple processes). Runs the
    /// versioned v1 -&gt; v2 authority/accounting migration on the spend-ledger database
    /// (fresh initialization reaches the v2 schema; populated v1 databases are migrated
    /// additively with every v1 row byte-for-byte unchanged).
    /// </summary>
    public static void InitializeSchema(string connectionString)
        => ReceiptPersistenceSchema.InitializeAuthorityAccountingDatabase(connectionString);

    /// <inheritdoc />
    public int GetSpendCount(string permissionId)
    {
        using var connection = OpenConnection();

        using var command = connection.CreateCommand();
        command.CommandText = @"
SELECT COUNT(*)
FROM PermissionSpendLedger
WHERE PermissionId = @permission_id;";
        command.Parameters.AddWithValue("@permission_id", permissionId);

        return Convert.ToInt32(command.ExecuteScalar());
    }

    /// <inheritdoc />
    public bool TryRecordSpend(string permissionId, int maxUses, DateTimeOffset spentAtUtc, out int spendIndex)
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenConnection();

                // BEGIN IMMEDIATE: take the writer lock before reading the count so the
                // count -> insert reservation is atomic against every other writer
                // (including writers in other processes over the same file).
                using var beginImmediate = connection.CreateCommand();
                beginImmediate.CommandText = "BEGIN IMMEDIATE;";
                beginImmediate.ExecuteNonQuery();

                try
                {
                    int currentCount;
                    using (var count = connection.CreateCommand())
                    {
                        count.CommandText = @"
SELECT COUNT(*)
FROM PermissionSpendLedger
WHERE PermissionId = @permission_id;";
                        count.Parameters.AddWithValue("@permission_id", permissionId);
                        currentCount = Convert.ToInt32(count.ExecuteScalar());
                    }

                    if (currentCount >= maxUses)
                    {
                        using var rollback = connection.CreateCommand();
                        rollback.CommandText = "ROLLBACK;";
                        rollback.ExecuteNonQuery();

                        spendIndex = 0;
                        return false;
                    }

                    var reservedIndex = currentCount + 1;
                    using (var insert = connection.CreateCommand())
                    {
                        insert.CommandText = @"
INSERT INTO PermissionSpendLedger (PermissionId, SpendIndex, SpentAtUtc, CreatedAtUtc)
VALUES (@permission_id, @spend_index, @spent_at_utc, @created_at_utc);";
                        insert.Parameters.AddWithValue("@permission_id", permissionId);
                        insert.Parameters.AddWithValue("@spend_index", reservedIndex);
                        insert.Parameters.AddWithValue("@spent_at_utc", spentAtUtc.UtcDateTime.ToString("O"));
                        insert.Parameters.AddWithValue("@created_at_utc", DateTimeOffset.UtcNow.UtcDateTime.ToString("O"));
                        insert.ExecuteNonQuery();
                    }

                    using (var commit = connection.CreateCommand())
                    {
                        commit.CommandText = "COMMIT;";
                        commit.ExecuteNonQuery();
                    }

                    spendIndex = reservedIndex;
                    return true;
                }
                catch
                {
                    TryRollback(connection);
                    throw;
                }
            }
            catch (SQLiteException ex) when (IsTransient(ex) && attempt < MaxRetries)
            {
                // Busy/locked/lost-race: back off briefly and retry the whole
                // count -> insert reservation against the fresh state.
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    private SQLiteConnection OpenConnection()
    {
        var connection = ReceiptPersistenceSchema.OpenConnection(_connectionString);
        try
        {
            // Fail closed at consumption: a torn v2 schema can never silently accept a spend.
            ReceiptPersistenceSchema.ValidateV2OrThrow(connection);
            return connection;
        }
        catch
        {
            connection.Dispose();
            throw;
        }
    }

    private static bool IsTransient(SQLiteException ex)
        => ex.ResultCode is SQLiteErrorCode.Busy
            or SQLiteErrorCode.Locked
            or SQLiteErrorCode.Constraint;

    private static void TryRollback(SQLiteConnection connection)
    {
        try
        {
            using var rollback = connection.CreateCommand();
            rollback.CommandText = "ROLLBACK;";
            rollback.ExecuteNonQuery();
        }
        catch (SQLiteException)
        {
            // The transaction may already have been rolled back by SQLite itself.
        }
    }
}

// ===========================================================================
// GMF-P2A: durable Runtime authority/accounting store (P1-C096 state families
// over the v2 schema in ReceiptPersistenceSchema). The store RECORDS
// authority/accounting state and confers nothing: only Runtime-issued
// IPermission is canonical authority (D2, P1-C047/P1-C051), and every row is a
// binding or reference, never a decision.
//
// These are STORE primitives only: the atomic validation/spend/reservation/
// concurrency/pre-effect-receipt transaction's decision logic (revocation,
// expiry, descriptor, audience, nonce, policy, lineage verdicts and race
// admission rules) is GMF-P2B's contract. TryBeginEffect implements the P1-C107
// commit SHAPE (consumption + attempt + reservation + slot + pre-effect receipt
// + pending state in one transaction) so P2B composes its validation on top and
// the structural guarantees below are testable now. The effect path stays
// disabled: nothing here starts a process tree, contacts a provider or MCP
// server, mounts source, or performs external I/O.
// ===========================================================================

/// <summary>Input to <see cref="SqliteAuthorityAccountingStore.TryBeginEffect"/>.</summary>
public sealed record BeginEffectRequest(
    string EffectId,
    string EffectClass,
    string DescriptorHash,
    int AttemptOrdinal,
    string TaskScopeKey,
    string PermissionId,
    int MaxUses,
    DateTimeOffset SpentAtUtc,
    string Nonce,
    string Audience,
    string ExpiresAtUtc,
    string PolicyVersion,
    string LineageKey,
    string SourceIdentityHash,
    string EnvironmentIdentityHash,
    string ReservationId,
    string BudgetScopeKey,
    long? AmountMinor,
    string? Currency,
    string? SlotId,
    string? SlotScope,
    int? SlotIndex,
    DateTimeOffset? LeaseExpiresAtUtc,
    DateTimeOffset AttemptedAtUtc);

/// <summary>Input to <see cref="SqliteAuthorityAccountingStore.TryAppendTerminal"/> (P1-C110 field list).</summary>
public sealed record TerminalReceiptInput(
    string EffectId,
    string TerminalState,
    long? SettledAmountMinor,
    string? Currency,
    string? CostPendingMarker,
    string EvidenceManifestHash,
    string? DenialReceiptId,
    DateTimeOffset TerminalAtUtc);

/// <summary>Input to <see cref="SqliteAuthorityAccountingStore.TryAppendSettlement"/> (P1-C116).</summary>
public sealed record SettlementInput(
    string SettlementId,
    string EffectId,
    string? ReservationId,
    string? PriorSettlementId,
    string Kind,
    long? SettledAmountMinor,
    string? Currency,
    string? CostPendingMarker,
    string? EvidenceManifestHash,
    DateTimeOffset SettledAtUtc);

/// <summary>Input to <see cref="SqliteAuthorityAccountingStore.RecordDenial"/> (P1-C106).</summary>
public sealed record DenialReceiptInput(
    string? EffectId,
    string? PermissionId,
    string DenialCode,
    string? WinnerEffectId,
    string? LinkedReceiptId,
    DateTimeOffset DeniedAtUtc);

// ===========================================================================
// GMF-P2B: in-boundary validation/admission composition point (additive).
//
// The evaluation hook below runs INSIDE the same BEGIN IMMEDIATE bundle that
// commits the P1-C107 write bundle, so validation verdicts and budget-capacity
// admission are decided at commit time under the store's isolation and
// uniqueness guarantees. A denied verdict rolls back the bundle and persists
// its durable denial receipt (P1-C106) with zero excess effect. The store stays
// authority-free: it records state and confers nothing (D2, P1-C047/P1-C051);
// verdict semantics live in the GMF-P2B transaction that composes this hook.
// ===========================================================================

/// <summary>Durable denial decided inside the boundary (P1-C071 code + optional linkage).</summary>
public sealed record BoundaryDenial(
    string DenialCode,
    string? WinnerEffectId,
    string? LinkedReceiptId);

/// <summary>Write-bundle step boundaries in D6/A1-D6 order (P1-C107).</summary>
public enum SpendBoundaryStep
{
    Validation = 0,
    ConsumePermission = 1,
    RecordAttempt = 2,
    ReserveBudget = 3,
    AcquireSlot = 4,
    PreEffectReceipt = 5,
    PendingEffect = 6,
}

/// <summary>
/// Read access to the in-flight bundle's database transaction. Every read sees
/// the state this transaction commits against (writers serialize on the
/// BEGIN IMMEDIATE lock), so verdicts are evaluated at commit time.
/// </summary>
public interface ISpendBoundaryRead
{
    /// <summary>Committed spend count for the permission (use-count admission).</summary>
    int CountSpends(string permissionId);

    /// <summary>Effect id of the permission's latest committed spend (winner linkage).</summary>
    string? LatestSpendEffectId(string permissionId);

    /// <summary>Effect id already recorded for this effect id, or null.</summary>
    string? FindEffectId(string effectId);

    /// <summary>Effect id that already used this nonce, or null (P1-C049 replay).</summary>
    string? FindEffectIdByNonce(string nonce);

    /// <summary>Effect id holding this (task scope, attempt ordinal), or null (P1-C009/P1-C010).</summary>
    string? FindEffectIdByOrdinal(string taskScopeKey, int attemptOrdinal);

    /// <summary>Active reservations in the budget scope (capacity admission).</summary>
    int CountActiveReservations(string budgetScopeKey);

    /// <summary>Sum of known reservation amounts in the budget scope (zero-negativity).</summary>
    long SumActiveReservationAmounts(string budgetScopeKey);

    /// <summary>Effect id of the most recent active reservation in the scope (winner linkage).</summary>
    string? LatestActiveReservationEffectId(string budgetScopeKey);
}

/// <summary>
/// GMF-P2B in-boundary validation/admission composition hook: evaluated inside
/// the store transaction that commits the write bundle (P1-C107). Returns null
/// when the boundary is satisfied; otherwise the durable denial to record.
/// Implementations must be retry-safe: the store may re-run the whole bundle on
/// a busy/locked database exactly as it does for its own admission checks.
/// </summary>
public interface ISpendBoundaryEvaluation
{
    /// <summary>Validation verdict evaluation + budget-capacity admission.</summary>
    BoundaryDenial? Evaluate(BeginEffectRequest request, ISpendBoundaryRead read);

    /// <summary>
    /// Invoked at each write-bundle step boundary before the step's write lands.
    /// Default no-op; an implementation may observe steps or inject a failure
    /// (throw) to exercise the all-or-nothing boundary. A thrown failure rolls
    /// back the whole bundle (P1-C124) and propagates to the caller.
    /// </summary>
    void OnStep(SpendBoundaryStep step) { }
}

/// <summary>Effect-attempt row (P1-C009/P1-C010/P1-C017 bindings).</summary>
public sealed record EffectAttemptRecord(
    string EffectId,
    string EffectClass,
    string DescriptorHash,
    int AttemptOrdinal,
    string TaskScopeKey,
    string PermissionId,
    int SpendIndex,
    string Nonce,
    string Audience,
    string ExpiresAtUtc,
    string PolicyVersion,
    string LineageKey,
    string SourceIdentityHash,
    string EnvironmentIdentityHash,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>Pre-effect receipt row, exact P1-C109 field list.</summary>
public sealed record PreEffectReceiptRecord(
    string EffectId,
    string DescriptorHash,
    string PermissionId,
    int AttemptOrdinal,
    string ReservationId,
    string? SlotId,
    string Audience,
    string ExpiresAtUtc,
    string PendingEffectMarker,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>Pending-effect state row (P1-C109 pending-effect marker).</summary>
public sealed record PendingEffectRecord(
    string EffectId,
    string PendingEffectMarker,
    string StartedAtUtc,
    string StateOrigin);

/// <summary>Budget-reservation row (P1-C073/P1-C115 cost state, P1-C113 quarantine status).</summary>
public sealed record BudgetReservationRecord(
    string ReservationId,
    string EffectId,
    string BudgetScopeKey,
    long? AmountMinor,
    string? Currency,
    string CostState,
    string? CostPendingCode,
    string Status,
    string? QuarantinedAtUtc,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>Concurrency-slot claim row (P1-C109/P1-C120).</summary>
public sealed record ConcurrencySlotRecord(
    string SlotId,
    string SlotScope,
    int SlotIndex,
    string EffectId,
    string AcquiredAtUtc,
    string? LeaseExpiresAtUtc,
    string StateOrigin);

/// <summary>Durable denial receipt row (P1-C106/P1-C074).</summary>
public sealed record DenialReceiptRecord(
    string DenialReceiptId,
    string? EffectId,
    string? PermissionId,
    string DenialCode,
    string? WinnerEffectId,
    string? LinkedReceiptId,
    int ZeroExcessEffect,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>Terminal receipt row, exact P1-C110 field list.</summary>
public sealed record TerminalReceiptRecord(
    string EffectId,
    string TerminalState,
    long? SettledAmountMinor,
    string? Currency,
    string? CostPendingMarker,
    string EvidenceManifestHash,
    string? DenialReceiptId,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>Append-only settlement row (P1-C115/P1-C116).</summary>
public sealed record SettlementRecord(
    string SettlementId,
    string EffectId,
    string? ReservationId,
    string? PriorSettlementId,
    string Kind,
    long? SettledAmountMinor,
    string? Currency,
    string? CostPendingMarker,
    string? EvidenceManifestHash,
    string StateOrigin,
    string CreatedAtUtc);

/// <summary>
/// The durable Runtime authority/accounting store (GMF-P2A) over the v2 SQLite ledger line.
///
/// Guarantees (AC(c)/AC(f)), structural in the database and independent of this API:
///  - a duplicate effect attempt is rejected by unique constraint (EffectId PK;
///    UNIQUE (TaskScopeKey, AttemptOrdinal); UNIQUE (PermissionId, SpendIndex));
///  - a consumed permission cannot be consumed twice (PermissionSpendLedger PK + append-only
///    triggers, P1-C108);
///  - an effect receives at most one terminal (TerminalReceipts PK); conflicting appends are
///    rejected with the original standing and per-event conflict evidence (P1-C112);
///  - concurrent writers on separate connections admit exactly the valid set; race losers are
///    recorded as FLEET_DENIED_RACE_LOST with winner linkage and zero excess effect
///    (P1-C074/P1-C120) and zero overspend;
///  - UPDATE/DELETE on spend, attempt, receipt, denial, terminal, and settlement history is
///    rejected by trigger (P1-C112/P1-C116).
///
/// Every denial-evidence ID is generated per event (never derived): repeat conflict/race/
/// quarantine denials each persist their own evidence row and return false — they never
/// throw. Argument violations (malformed requests) throw <see cref="ArgumentException"/>
/// before any state is touched. If persisting denial evidence itself fails, the failure
/// propagates so the caller can note it outside the failed store path (P1-C124).
///
/// Schema initialization is owned by <see cref="ReceiptPersistenceSchema"/> (the composition
/// switch honors ReceiptPersistenceConfig.AutoMigrate); this class never creates schema.
///
/// CONSUMPTION FAILS CLOSED ON A TORN SCHEMA (AC(b)(1) at consumption, not only at init):
/// every public operation opens through a checked connection that validates the complete v2
/// schema (objects AND columns) first and throws <see cref="InvalidOperationException"/>
/// naming the missing entries before any state is read or written — a torn or tampered
/// database can never silently accept a consumption, denial, terminal, or settlement write.
/// </summary>
public sealed class SqliteAuthorityAccountingStore
{
    private const int BusyTimeoutMs = 5000;
    private const int MaxRetries = 10;

    private readonly string _connectionString;

    public SqliteAuthorityAccountingStore(string connectionString)
    {
        _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
    }

    /// <summary>
    /// Atomically admits one effect attempt and everything the P1-C107 pre-effect commit
    /// names: permission consumption, the unique effect-attempt record, the budget
    /// reservation (including the explicit unknown/pending cost state), the concurrency-slot
    /// claim when requested, the P1-C109 pre-effect receipt, and the pending-effect state —
    /// one transaction. Persistence failure commits nothing and effects nothing (P1-C124).
    ///
    /// Deny shapes (all return false with a per-event durable denial receipt in
    /// <paramref name="denialReceiptId"/> and zero excess effect):
    ///  - quarantined reservation in the budget scope: FLEET_DENIED_RESERVATION_QUARANTINED
    ///    (P1-C113);
    ///  - permission use lost the race / exhausted: FLEET_DENIED_RACE_LOST with winner
    ///    linkage (P1-C074/P1-C120);
    ///  - duplicate effect id or attempt-ordinal reuse: FLEET_DENIED_REPLAY (P1-C009/P1-C010);
    ///  - slot claim lost the race: FLEET_DENIED_RACE_LOST with the holder as winner.
    /// </summary>
    public bool TryBeginEffect(BeginEffectRequest request, out string? denialReceiptId)
        => TryBeginEffectCore(request, evaluation: null, out denialReceiptId);

    /// <summary>
    /// GMF-P2B in-boundary composition point (additive): the same P1-C107 commit
    /// shape and deny shapes as <see cref="TryBeginEffect(BeginEffectRequest, out string?)"/>,
    /// with validation verdict evaluation and budget-capacity admission executed
    /// inside the same BEGIN IMMEDIATE bundle that commits the write bundle. A
    /// non-null <paramref name="evaluation"/> denial rolls back the bundle and
    /// persists its durable denial receipt with zero excess effect (P1-C075);
    /// a satisfied evaluation falls through to the frozen deny shapes below.
    /// </summary>
    public bool TryBeginEffect(BeginEffectRequest request, ISpendBoundaryEvaluation evaluation, out string? denialReceiptId)
        => TryBeginEffectCore(request, evaluation, out denialReceiptId);

    private bool TryBeginEffectCore(BeginEffectRequest request, ISpendBoundaryEvaluation? evaluation, out string? denialReceiptId)
    {
        ValidateBeginRequest(request);
        denialReceiptId = null;

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenChecked();

                using (var begin = connection.CreateCommand())
                {
                    begin.CommandText = "BEGIN IMMEDIATE;";
                    begin.ExecuteNonQuery();
                }

                try
                {
                    // GMF-P2B: in-boundary validation verdict evaluation and
                    // budget-capacity admission (P1-C107) — decided inside this
                    // transaction, at commit time. A denial rolls back the bundle
                    // and persists its durable denial receipt with zero excess
                    // effect (P1-C075/P1-C106); the permission stays unconsumed.
                    if (evaluation is not null)
                    {
                        evaluation.OnStep(SpendBoundaryStep.Validation);
                        var boundaryDenial = evaluation.Evaluate(request, new BoundaryRead(connection));
                        if (boundaryDenial is not null)
                        {
                            Rollback(connection);
                            denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                                request.EffectId, request.PermissionId,
                                boundaryDenial.DenialCode,
                                boundaryDenial.WinnerEffectId,
                                boundaryDenial.LinkedReceiptId,
                                DeniedAtUtc: request.AttemptedAtUtc));
                            return false;
                        }
                    }

                    // P1-C113: budget reuse against a quarantined reservation denies.
                    var quarantinedReservation = ScalarString(connection,
                        "SELECT ReservationId FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'quarantined' LIMIT 1;",
                        ("@scope", request.BudgetScopeKey));
                    if (quarantinedReservation is not null)
                    {
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            request.EffectId, request.PermissionId,
                            ReceiptPersistenceSchema.Vocabulary.ReservationQuarantinedCode,
                            WinnerEffectId: null,
                            LinkedReceiptId: quarantinedReservation,
                            DeniedAtUtc: request.AttemptedAtUtc));
                        return false;
                    }

                    // Permission consumption race (P1-C108/P1-C120): exactly MaxUses wins.
                    int currentCount;
                    using (var count = connection.CreateCommand())
                    {
                        count.CommandText = "SELECT COUNT(*) FROM PermissionSpendLedger WHERE PermissionId = @permission_id;";
                        count.Parameters.AddWithValue("@permission_id", request.PermissionId);
                        currentCount = Convert.ToInt32(count.ExecuteScalar());
                    }

                    if (currentCount >= request.MaxUses)
                    {
                        var winner = ScalarString(connection,
                            "SELECT EffectId FROM EffectAttempts WHERE PermissionId = @permission_id ORDER BY SpendIndex DESC LIMIT 1;",
                            ("@permission_id", request.PermissionId));
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            request.EffectId, request.PermissionId,
                            ReceiptPersistenceSchema.Vocabulary.RaceLostCode,
                            WinnerEffectId: winner,
                            LinkedReceiptId: null,
                            DeniedAtUtc: request.AttemptedAtUtc));
                        return false;
                    }

                    // Replay / ordinal reuse (P1-C009/P1-C010): denied pre-effect.
                    var duplicateAttempt = ScalarString(connection,
                        "SELECT EffectId FROM EffectAttempts WHERE EffectId = @effect_id OR (TaskScopeKey = @task_scope AND AttemptOrdinal = @ordinal) LIMIT 1;",
                        ("@effect_id", request.EffectId), ("@task_scope", request.TaskScopeKey), ("@ordinal", request.AttemptOrdinal));
                    if (duplicateAttempt is not null)
                    {
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            request.EffectId, request.PermissionId,
                            ReceiptPersistenceSchema.Vocabulary.ReplayCode,
                            WinnerEffectId: null,
                            LinkedReceiptId: duplicateAttempt,
                            DeniedAtUtc: request.AttemptedAtUtc));
                        return false;
                    }

                    // Slot-claim race (P1-C120): UNIQUE (SlotScope, SlotIndex) backstops this.
                    if (request.SlotId is not null)
                    {
                        var slotHolder = ScalarString(connection,
                            "SELECT EffectId FROM ConcurrencySlots WHERE SlotScope = @slot_scope AND SlotIndex = @slot_index LIMIT 1;",
                            ("@slot_scope", request.SlotScope!), ("@slot_index", request.SlotIndex!.Value));
                        if (slotHolder is not null)
                        {
                            Rollback(connection);
                            denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                                request.EffectId, request.PermissionId,
                                ReceiptPersistenceSchema.Vocabulary.RaceLostCode,
                                WinnerEffectId: slotHolder,
                                LinkedReceiptId: null,
                                DeniedAtUtc: request.AttemptedAtUtc));
                            return false;
                        }
                    }

                    var spendIndex = currentCount + 1;
                    var now = Format(request.AttemptedAtUtc);

                    evaluation?.OnStep(SpendBoundaryStep.ConsumePermission);
                    Execute(connection, @"
INSERT INTO PermissionSpendLedger (PermissionId, SpendIndex, SpentAtUtc, CreatedAtUtc)
VALUES (@permission_id, @spend_index, @spent_at_utc, @created_at_utc);",
                        ("@permission_id", request.PermissionId),
                        ("@spend_index", spendIndex),
                        ("@spent_at_utc", Format(request.SpentAtUtc)),
                        ("@created_at_utc", now));

                    evaluation?.OnStep(SpendBoundaryStep.RecordAttempt);
                    Execute(connection, @"
INSERT INTO EffectAttempts (
    EffectId, EffectClass, DescriptorHash, AttemptOrdinal, TaskScopeKey, PermissionId, SpendIndex,
    Nonce, Audience, ExpiresAtUtc, PolicyVersion, LineageKey, SourceIdentityHash, EnvironmentIdentityHash,
    StateOrigin, CreatedAtUtc)
VALUES (
    @effect_id, @effect_class, @descriptor_hash, @attempt_ordinal, @task_scope, @permission_id, @spend_index,
    @nonce, @audience, @expires_at_utc, @policy_version, @lineage_key, @source_identity_hash, @environment_identity_hash,
    @state_origin, @created_at_utc);",
                        ("@effect_id", request.EffectId),
                        ("@effect_class", request.EffectClass),
                        ("@descriptor_hash", request.DescriptorHash),
                        ("@attempt_ordinal", request.AttemptOrdinal),
                        ("@task_scope", request.TaskScopeKey),
                        ("@permission_id", request.PermissionId),
                        ("@spend_index", spendIndex),
                        ("@nonce", request.Nonce),
                        ("@audience", request.Audience),
                        ("@expires_at_utc", request.ExpiresAtUtc),
                        ("@policy_version", request.PolicyVersion),
                        ("@lineage_key", request.LineageKey),
                        ("@source_identity_hash", request.SourceIdentityHash),
                        ("@environment_identity_hash", request.EnvironmentIdentityHash),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                        ("@created_at_utc", now));

                    evaluation?.OnStep(SpendBoundaryStep.ReserveBudget);
                    var costKnown = request.AmountMinor is not null;
                    Execute(connection, @"
INSERT INTO BudgetReservations (
    ReservationId, EffectId, BudgetScopeKey, AmountMinor, Currency, CostState, CostPendingCode,
    Status, QuarantinedAtUtc, StateOrigin, CreatedAtUtc)
VALUES (
    @reservation_id, @effect_id, @budget_scope, @amount_minor, @currency, @cost_state, @cost_pending_code,
    'active', NULL, @state_origin, @created_at_utc);",
                        ("@reservation_id", request.ReservationId),
                        ("@effect_id", request.EffectId),
                        ("@budget_scope", request.BudgetScopeKey),
                        ("@amount_minor", (object?)request.AmountMinor ?? DBNull.Value),
                        ("@currency", (object?)request.Currency ?? DBNull.Value),
                        ("@cost_state", costKnown ? "known" : "unknown"),
                        ("@cost_pending_code", costKnown ? DBNull.Value : (object)ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                        ("@created_at_utc", now));

                    evaluation?.OnStep(SpendBoundaryStep.AcquireSlot);
                    if (request.SlotId is not null)
                    {
                        Execute(connection, @"
INSERT INTO ConcurrencySlots (SlotId, SlotScope, SlotIndex, EffectId, AcquiredAtUtc, LeaseExpiresAtUtc, StateOrigin)
VALUES (@slot_id, @slot_scope, @slot_index, @effect_id, @acquired_at_utc, @lease_expires_at_utc, @state_origin);",
                            ("@slot_id", request.SlotId),
                            ("@slot_scope", request.SlotScope!),
                            ("@slot_index", request.SlotIndex!.Value),
                            ("@effect_id", request.EffectId),
                            ("@acquired_at_utc", now),
                            ("@lease_expires_at_utc", request.LeaseExpiresAtUtc is null ? DBNull.Value : (object)Format(request.LeaseExpiresAtUtc.Value)),
                            ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin));
                    }

                    // Pre-effect receipt, exact P1-C109 field list (P1-C111: one receipt binds
                    // exactly one effect attempt).
                    evaluation?.OnStep(SpendBoundaryStep.PreEffectReceipt);
                    Execute(connection, @"
INSERT INTO PreEffectReceipts (
    EffectId, DescriptorHash, PermissionId, AttemptOrdinal, ReservationId, SlotId,
    Audience, ExpiresAtUtc, PendingEffectMarker, StateOrigin, CreatedAtUtc)
VALUES (
    @effect_id, @descriptor_hash, @permission_id, @attempt_ordinal, @reservation_id, @slot_id,
    @audience, @expires_at_utc, @pending_effect_marker, @state_origin, @created_at_utc);",
                        ("@effect_id", request.EffectId),
                        ("@descriptor_hash", request.DescriptorHash),
                        ("@permission_id", request.PermissionId),
                        ("@attempt_ordinal", request.AttemptOrdinal),
                        ("@reservation_id", request.ReservationId),
                        ("@slot_id", (object?)request.SlotId ?? DBNull.Value),
                        ("@audience", request.Audience),
                        ("@expires_at_utc", request.ExpiresAtUtc),
                        ("@pending_effect_marker", ReceiptPersistenceSchema.Vocabulary.PendingEffectMarker),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                        ("@created_at_utc", now));

                    evaluation?.OnStep(SpendBoundaryStep.PendingEffect);
                    Execute(connection, @"
INSERT INTO PendingEffects (EffectId, PendingEffectMarker, StartedAtUtc, StateOrigin)
VALUES (@effect_id, @pending_effect_marker, @started_at_utc, @state_origin);",
                        ("@effect_id", request.EffectId),
                        ("@pending_effect_marker", ReceiptPersistenceSchema.Vocabulary.PendingEffectMarker),
                        ("@started_at_utc", now),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin));

                    Commit(connection);
                    return true;
                }
                catch
                {
                    TryRollback(connection);
                    throw;
                }
            }
            catch (SQLiteException ex) when (IsBusyOrLocked(ex) && attempt < MaxRetries)
            {
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    /// <summary>
    /// Appends the one terminal receipt for an effect (P1-C102/P1-C110). A conflicting or
    /// duplicate terminal append is rejected with the original terminal standing and a
    /// per-event FLEET_DENIED_TERMINAL_CONFLICT denial receipt in <paramref name="denialReceiptId"/>
    /// (P1-C112); repeats return false and persist their own evidence rows — never throw.
    /// The terminal state must belong to the closed set of the effect's class (P1-C103–P1-C105),
    /// and the cost state is a settled amount or the explicit FLEET_PENDING_UNKNOWN_COST marker
    /// (P1-C115).
    /// </summary>
    public bool TryAppendTerminal(TerminalReceiptInput input, out string? denialReceiptId)
    {
        ValidateTerminalInput(input);
        denialReceiptId = null;

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenChecked();

                using (var begin = connection.CreateCommand())
                {
                    begin.CommandText = "BEGIN IMMEDIATE;";
                    begin.ExecuteNonQuery();
                }

                try
                {
                    var effectClass = ScalarString(connection,
                        "SELECT EffectClass FROM EffectAttempts WHERE EffectId = @effect_id;",
                        ("@effect_id", input.EffectId));

                    if (effectClass is null)
                    {
                        // No attempt row: invalid request (validation of existence is P2B's),
                        // rejected structurally here and by trg_terminal_receipts_class_set even
                        // with foreign keys off. No denial evidence: nothing was denied, and the
                        // caller has no effect to hang evidence on.
                        Rollback(connection);
                        return false;
                    }

                    if (!ReceiptPersistenceSchema.Vocabulary.IsTerminalStateForClass(effectClass, input.TerminalState))
                    {
                        Rollback(connection);
                        throw new ArgumentException(
                            $"Terminal state '{input.TerminalState}' is not in the closed terminal set for effect class '{effectClass}' (P1-C103-P1-C105).",
                            nameof(input));
                    }

                    var existing = ScalarString(connection,
                        "SELECT EffectId FROM TerminalReceipts WHERE EffectId = @effect_id;",
                        ("@effect_id", input.EffectId));
                    if (existing is not null)
                    {
                        // Conflicting terminal: original stands, history is never rewritten,
                        // conflict evidence persists per event (P1-C112).
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            input.EffectId, PermissionId: null,
                            ReceiptPersistenceSchema.Vocabulary.TerminalConflictCode,
                            WinnerEffectId: null,
                            LinkedReceiptId: existing,
                            DeniedAtUtc: input.TerminalAtUtc));
                        return false;
                    }

                    var costKnown = input.SettledAmountMinor is not null;
                    Execute(connection, @"
INSERT INTO TerminalReceipts (
    EffectId, TerminalState, SettledAmountMinor, Currency, CostPendingMarker,
    EvidenceManifestHash, DenialReceiptId, StateOrigin, CreatedAtUtc)
VALUES (
    @effect_id, @terminal_state, @settled_amount_minor, @currency, @cost_pending_marker,
    @evidence_manifest_hash, @denial_receipt_id, @state_origin, @created_at_utc);",
                        ("@effect_id", input.EffectId),
                        ("@terminal_state", input.TerminalState),
                        ("@settled_amount_minor", (object?)input.SettledAmountMinor ?? DBNull.Value),
                        ("@currency", (object?)input.Currency ?? DBNull.Value),
                        ("@cost_pending_marker", costKnown ? DBNull.Value : (object)ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode),
                        ("@evidence_manifest_hash", input.EvidenceManifestHash),
                        ("@denial_receipt_id", (object?)input.DenialReceiptId ?? DBNull.Value),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                        ("@created_at_utc", Format(input.TerminalAtUtc)));

                    Commit(connection);
                    return true;
                }
                catch
                {
                    TryRollback(connection);
                    throw;
                }
            }
            catch (SQLiteException ex) when (IsBusyOrLocked(ex) && attempt < MaxRetries)
            {
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    /// <summary>
    /// Appends one settlement/adjustment/refund/human-resolution record (P1-C115/P1-C116):
    /// it never rewrites the terminal or a prior settlement, and unknown cost may only be
    /// resolved through these appends. Settlement against a missing terminal denies with
    /// per-event FLEET_DENIED_TERMINAL_MISSING evidence (P1-C102); a duplicate settlement id
    /// denies with FLEET_DENIED_REPLAY evidence. Both return false; repeats never throw.
    /// </summary>
    public bool TryAppendSettlement(SettlementInput input, out string? denialReceiptId)
    {
        ValidateSettlementInput(input);
        denialReceiptId = null;

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenChecked();

                using (var begin = connection.CreateCommand())
                {
                    begin.CommandText = "BEGIN IMMEDIATE;";
                    begin.ExecuteNonQuery();
                }

                try
                {
                    var duplicate = ScalarString(connection,
                        "SELECT SettlementId FROM Settlements WHERE SettlementId = @settlement_id;",
                        ("@settlement_id", input.SettlementId));
                    if (duplicate is not null)
                    {
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            input.EffectId, PermissionId: null,
                            ReceiptPersistenceSchema.Vocabulary.ReplayCode,
                            WinnerEffectId: null,
                            LinkedReceiptId: duplicate,
                            DeniedAtUtc: input.SettledAtUtc));
                        return false;
                    }

                    var terminal = ScalarString(connection,
                        "SELECT EffectId FROM TerminalReceipts WHERE EffectId = @effect_id;",
                        ("@effect_id", input.EffectId));
                    if (terminal is null)
                    {
                        // Missing terminal: fail closed with durable evidence (P1-C102,
                        // FLEET_DENIED_TERMINAL_MISSING).
                        Rollback(connection);
                        denialReceiptId = RecordDenialInNewTransaction(new DenialReceiptInput(
                            input.EffectId, PermissionId: null,
                            "FLEET_DENIED_TERMINAL_MISSING",
                            WinnerEffectId: null,
                            LinkedReceiptId: null,
                            DeniedAtUtc: input.SettledAtUtc));
                        return false;
                    }

                    var costKnown = input.SettledAmountMinor is not null;
                    Execute(connection, @"
INSERT INTO Settlements (
    SettlementId, EffectId, ReservationId, PriorSettlementId, Kind,
    SettledAmountMinor, Currency, CostPendingMarker, EvidenceManifestHash, StateOrigin, CreatedAtUtc)
VALUES (
    @settlement_id, @effect_id, @reservation_id, @prior_settlement_id, @kind,
    @settled_amount_minor, @currency, @cost_pending_marker, @evidence_manifest_hash, @state_origin, @created_at_utc);",
                        ("@settlement_id", input.SettlementId),
                        ("@effect_id", input.EffectId),
                        ("@reservation_id", (object?)input.ReservationId ?? DBNull.Value),
                        ("@prior_settlement_id", (object?)input.PriorSettlementId ?? DBNull.Value),
                        ("@kind", input.Kind),
                        ("@settled_amount_minor", (object?)input.SettledAmountMinor ?? DBNull.Value),
                        ("@currency", (object?)input.Currency ?? DBNull.Value),
                        ("@cost_pending_marker", costKnown ? DBNull.Value : (object)ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode),
                        ("@evidence_manifest_hash", (object?)input.EvidenceManifestHash ?? DBNull.Value),
                        ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                        ("@created_at_utc", Format(input.SettledAtUtc)));

                    Commit(connection);
                    return true;
                }
                catch
                {
                    TryRollback(connection);
                    throw;
                }
            }
            catch (SQLiteException ex) when (IsBusyOrLocked(ex) && attempt < MaxRetries)
            {
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    /// <summary>
    /// Applies the P1-C113 leak quarantine (the only permitted reservation state transition):
    /// a post-terminal surviving reservation is quarantined; budget is not reused until
    /// append-only reconciliation. Idempotent-safe: a missing or already-quarantined
    /// reservation returns false without mutating anything (repeat-safe, never throws).
    /// </summary>
    public bool TryQuarantineReservation(string reservationId, DateTimeOffset quarantinedAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reservationId);

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenChecked();

                using var update = connection.CreateCommand();
                update.CommandText = @"
UPDATE BudgetReservations
SET Status = 'quarantined', QuarantinedAtUtc = @quarantined_at_utc
WHERE ReservationId = @reservation_id AND Status = 'active';";
                update.Parameters.AddWithValue("@quarantined_at_utc", Format(quarantinedAtUtc));
                update.Parameters.AddWithValue("@reservation_id", reservationId);

                return update.ExecuteNonQuery() == 1;
            }
            catch (SQLiteException ex) when (IsBusyOrLocked(ex) && attempt < MaxRetries)
            {
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    /// <summary>
    /// Persists one durable denial receipt (P1-C106) with a store-generated per-event id
    /// (never derived — repeat denials each persist their own evidence). Returns the id.
    /// </summary>
    public string RecordDenial(DenialReceiptInput input)
        => RecordDenialInNewTransaction(input);

    /// <summary>
    /// Standalone <see cref="ISpendBoundaryRead"/> over the store's committed state:
    /// the composition point's pre-evaluation twin of the in-bundle read. Used by the
    /// GMF-P2B boundary to evaluate the verdict pass before any short-circuit (the
    /// never-weaker seam) and again inside the commit bundle.
    /// </summary>
    public ISpendBoundaryRead CreateBoundaryRead() => new StandaloneBoundaryRead(this);

    /// <summary>Reads back the effect-attempt record (or null).</summary>
    public EffectAttemptRecord? GetEffectAttempt(string effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM EffectAttempts WHERE EffectId = @effect_id;";
        command.Parameters.AddWithValue("@effect_id", effectId);
        using var reader = command.ExecuteReader();
        return reader.Read() ? ReadEffectAttempt(reader) : null;
    }

    /// <summary>Reads back the pre-effect receipt (exact P1-C109 fields) or null.</summary>
    public PreEffectReceiptRecord? GetPreEffectReceipt(string effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM PreEffectReceipts WHERE EffectId = @effect_id;";
        command.Parameters.AddWithValue("@effect_id", effectId);
        using var reader = command.ExecuteReader();
        return reader.Read() ? ReadPreEffectReceipt(reader) : null;
    }

    /// <summary>Reads back the pending-effect state row (or null).</summary>
    public PendingEffectRecord? GetPendingEffect(string effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM PendingEffects WHERE EffectId = @effect_id;";
        command.Parameters.AddWithValue("@effect_id", effectId);
        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new PendingEffectRecord(
                ReadString(reader, "EffectId"),
                ReadString(reader, "PendingEffectMarker"),
                ReadString(reader, "StartedAtUtc"),
                ReadString(reader, "StateOrigin"))
            : null;
    }

    /// <summary>Reads back the budget reservation (or null).</summary>
    public BudgetReservationRecord? GetBudgetReservation(string reservationId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM BudgetReservations WHERE ReservationId = @reservation_id;";
        command.Parameters.AddWithValue("@reservation_id", reservationId);
        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new BudgetReservationRecord(
                ReadString(reader, "ReservationId"),
                ReadString(reader, "EffectId"),
                ReadString(reader, "BudgetScopeKey"),
                ReadNullableLong(reader, "AmountMinor"),
                ReadNullableString(reader, "Currency"),
                ReadString(reader, "CostState"),
                ReadNullableString(reader, "CostPendingCode"),
                ReadString(reader, "Status"),
                ReadNullableString(reader, "QuarantinedAtUtc"),
                ReadString(reader, "StateOrigin"),
                ReadString(reader, "CreatedAtUtc"))
            : null;
    }

    /// <summary>Reads back the concurrency-slot claim (or null).</summary>
    public ConcurrencySlotRecord? GetConcurrencySlot(string slotId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM ConcurrencySlots WHERE SlotId = @slot_id;";
        command.Parameters.AddWithValue("@slot_id", slotId);
        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new ConcurrencySlotRecord(
                ReadString(reader, "SlotId"),
                ReadString(reader, "SlotScope"),
                Convert.ToInt32(reader["SlotIndex"]),
                ReadString(reader, "EffectId"),
                ReadString(reader, "AcquiredAtUtc"),
                ReadNullableString(reader, "LeaseExpiresAtUtc"),
                ReadString(reader, "StateOrigin"))
            : null;
    }

    /// <summary>Reads back the terminal receipt (exact P1-C110 fields) or null.</summary>
    public TerminalReceiptRecord? GetTerminalReceipt(string effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM TerminalReceipts WHERE EffectId = @effect_id;";
        command.Parameters.AddWithValue("@effect_id", effectId);
        using var reader = command.ExecuteReader();
        return reader.Read()
            ? new TerminalReceiptRecord(
                ReadString(reader, "EffectId"),
                ReadString(reader, "TerminalState"),
                ReadNullableLong(reader, "SettledAmountMinor"),
                ReadNullableString(reader, "Currency"),
                ReadNullableString(reader, "CostPendingMarker"),
                ReadString(reader, "EvidenceManifestHash"),
                ReadNullableString(reader, "DenialReceiptId"),
                ReadString(reader, "StateOrigin"),
                ReadString(reader, "CreatedAtUtc"))
            : null;
    }

    /// <summary>Reads back settlement records for an effect in append order (P1-C116 lineage).</summary>
    public IReadOnlyList<SettlementRecord> GetSettlements(string effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM Settlements WHERE EffectId = @effect_id ORDER BY CreatedAtUtc, SettlementId;";
        command.Parameters.AddWithValue("@effect_id", effectId);
        using var reader = command.ExecuteReader();
        var results = new List<SettlementRecord>();
        while (reader.Read())
        {
            results.Add(new SettlementRecord(
                ReadString(reader, "SettlementId"),
                ReadString(reader, "EffectId"),
                ReadNullableString(reader, "ReservationId"),
                ReadNullableString(reader, "PriorSettlementId"),
                ReadString(reader, "Kind"),
                ReadNullableLong(reader, "SettledAmountMinor"),
                ReadNullableString(reader, "Currency"),
                ReadNullableString(reader, "CostPendingMarker"),
                ReadNullableString(reader, "EvidenceManifestHash"),
                ReadString(reader, "StateOrigin"),
                ReadString(reader, "CreatedAtUtc")));
        }

        return results;
    }

    /// <summary>Reads back denial receipts (per-event evidence) for an effect, or all when null.</summary>
    public IReadOnlyList<DenialReceiptRecord> GetDenialReceipts(string? effectId)
    {
        using var connection = OpenChecked();
        using var command = connection.CreateCommand();
        command.CommandText = effectId is null
            ? "SELECT * FROM DenialReceipts ORDER BY CreatedAtUtc, DenialReceiptId;"
            : "SELECT * FROM DenialReceipts WHERE EffectId = @effect_id ORDER BY CreatedAtUtc, DenialReceiptId;";
        if (effectId is not null)
        {
            command.Parameters.AddWithValue("@effect_id", effectId);
        }

        using var reader = command.ExecuteReader();
        var results = new List<DenialReceiptRecord>();
        while (reader.Read())
        {
            results.Add(new DenialReceiptRecord(
                ReadString(reader, "DenialReceiptId"),
                ReadNullableString(reader, "EffectId"),
                ReadNullableString(reader, "PermissionId"),
                ReadString(reader, "DenialCode"),
                ReadNullableString(reader, "WinnerEffectId"),
                ReadNullableString(reader, "LinkedReceiptId"),
                Convert.ToInt32(reader["ZeroExcessEffect"]),
                ReadString(reader, "StateOrigin"),
                ReadString(reader, "CreatedAtUtc")));
        }

        return results;
    }

    // ---- internals ----

    /// <summary>
    /// Opens a store connection and fails closed on a torn v2 schema before any state is
    /// read or written (see the class doc: consumption fails closed at the store, not only
    /// at schema initialization).
    /// </summary>
    private SQLiteConnection OpenChecked()
    {
        var connection = ReceiptPersistenceSchema.OpenConnection(_connectionString);
        try
        {
            ReceiptPersistenceSchema.ValidateV2OrThrow(connection);
            return connection;
        }
        catch
        {
            connection.Dispose();
            throw;
        }
    }

    private string RecordDenialInNewTransaction(DenialReceiptInput input)
    {
        if (string.IsNullOrWhiteSpace(input.DenialCode))
        {
            throw new ArgumentException("DenialCode is required (P1-C071 closed vocabulary).", nameof(input));
        }

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var connection = OpenChecked();

                // Per-event, never-derived id: repeat denials for the same effect/code each
                // persist their own evidence row and never collide.
                var denialReceiptId = Guid.NewGuid().ToString("n");
                Execute(connection, @"
INSERT INTO DenialReceipts (
    DenialReceiptId, EffectId, PermissionId, DenialCode, WinnerEffectId, LinkedReceiptId,
    ZeroExcessEffect, StateOrigin, CreatedAtUtc)
VALUES (
    @denial_receipt_id, @effect_id, @permission_id, @denial_code, @winner_effect_id, @linked_receipt_id,
    1, @state_origin, @created_at_utc);",
                    ("@denial_receipt_id", denialReceiptId),
                    ("@effect_id", (object?)input.EffectId ?? DBNull.Value),
                    ("@permission_id", (object?)input.PermissionId ?? DBNull.Value),
                    ("@denial_code", input.DenialCode),
                    ("@winner_effect_id", (object?)input.WinnerEffectId ?? DBNull.Value),
                    ("@linked_receipt_id", (object?)input.LinkedReceiptId ?? DBNull.Value),
                    ("@state_origin", ReceiptPersistenceSchema.Vocabulary.DurableStateOrigin),
                    ("@created_at_utc", Format(input.DeniedAtUtc)));

                return denialReceiptId;
            }
            catch (SQLiteException ex) when (IsBusyOrLocked(ex) && attempt < MaxRetries)
            {
                Thread.Sleep(10 * (attempt + 1));
            }
        }
    }

    private static void ValidateBeginRequest(BeginEffectRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        Require(request.EffectId, nameof(request.EffectId));
        Require(request.DescriptorHash, nameof(request.DescriptorHash));
        Require(request.TaskScopeKey, nameof(request.TaskScopeKey));
        Require(request.PermissionId, nameof(request.PermissionId));
        Require(request.Nonce, nameof(request.Nonce));
        Require(request.Audience, nameof(request.Audience));
        Require(request.ExpiresAtUtc, nameof(request.ExpiresAtUtc));
        Require(request.PolicyVersion, nameof(request.PolicyVersion));
        Require(request.LineageKey, nameof(request.LineageKey));
        Require(request.SourceIdentityHash, nameof(request.SourceIdentityHash));
        Require(request.EnvironmentIdentityHash, nameof(request.EnvironmentIdentityHash));
        Require(request.ReservationId, nameof(request.ReservationId));
        Require(request.BudgetScopeKey, nameof(request.BudgetScopeKey));

        if (!ReceiptPersistenceSchema.Vocabulary.EffectClasses.Contains(request.EffectClass, StringComparer.Ordinal))
        {
            throw new ArgumentException(
                $"EffectClass must be one of the closed P1-C001 set: {string.Join(", ", ReceiptPersistenceSchema.Vocabulary.EffectClasses)}.",
                nameof(request));
        }

        if (request.AttemptOrdinal < 1)
        {
            throw new ArgumentException("AttemptOrdinal must be >= 1 (P1-C009/P1-C010).", nameof(request));
        }

        if (request.MaxUses < 1)
        {
            throw new ArgumentException("MaxUses must be >= 1.", nameof(request));
        }

        if ((request.AmountMinor is null) != (request.Currency is null))
        {
            throw new ArgumentException(
                "Known cost requires both AmountMinor and Currency; unknown cost requires neither (P1-C115: no silent currency conversion).",
                nameof(request));
        }

        var hasSlotId = request.SlotId is not null;
        var hasSlotScope = request.SlotScope is not null;
        var hasSlotIndex = request.SlotIndex is not null;
        if (hasSlotId != hasSlotScope || hasSlotId != hasSlotIndex)
        {
            throw new ArgumentException(
                "A slot claim requires SlotId, SlotScope, and SlotIndex together (P1-C109).",
                nameof(request));
        }
    }

    private static void ValidateTerminalInput(TerminalReceiptInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        Require(input.EffectId, nameof(input.EffectId));
        Require(input.TerminalState, nameof(input.TerminalState));
        Require(input.EvidenceManifestHash, nameof(input.EvidenceManifestHash));

        var costKnown = input.SettledAmountMinor is not null;
        if (costKnown != (input.Currency is not null))
        {
            throw new ArgumentException(
                "Settled cost requires both SettledAmountMinor and Currency (P1-C115).",
                nameof(input));
        }

        if (!costKnown && input.CostPendingMarker != ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode)
        {
            throw new ArgumentException(
                $"Unknown cost must carry the explicit pending marker '{ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode}' (P1-C073/P1-C110/P1-C115).",
                nameof(input));
        }

        if (costKnown && input.CostPendingMarker is not null)
        {
            throw new ArgumentException("A settled cost cannot also carry the unknown/pending marker (P1-C110).", nameof(input));
        }
    }

    private static void ValidateSettlementInput(SettlementInput input)
    {
        ArgumentNullException.ThrowIfNull(input);
        Require(input.SettlementId, nameof(input.SettlementId));
        Require(input.EffectId, nameof(input.EffectId));
        Require(input.Kind, nameof(input.Kind));

        if (input.Kind is not ("settlement" or "adjustment" or "refund" or "human-resolution"))
        {
            throw new ArgumentException(
                "Kind must be one of settlement, adjustment, refund, human-resolution (P1-C115/P1-C116).",
                nameof(input));
        }

        var costKnown = input.SettledAmountMinor is not null;
        if (costKnown != (input.Currency is not null))
        {
            throw new ArgumentException("Settled cost requires both SettledAmountMinor and Currency (P1-C115).", nameof(input));
        }

        if (!costKnown && input.CostPendingMarker != ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode)
        {
            throw new ArgumentException(
                $"Unknown cost must carry the explicit pending marker '{ReceiptPersistenceSchema.Vocabulary.PendingUnknownCostCode}' (P1-C115).",
                nameof(input));
        }

        if (costKnown && input.CostPendingMarker is not null)
        {
            throw new ArgumentException("A settled cost cannot also carry the unknown/pending marker (P1-C116).", nameof(input));
        }
    }

    private static void Require(string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{name} is required.", name);
        }
    }

    private static void Execute(SQLiteConnection connection, string sql, params (string Name, object Value)[] parameters)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        command.ExecuteNonQuery();
    }

    private static string? ScalarString(SQLiteConnection connection, string sql, params (string Name, object Value)[] parameters)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        var result = command.ExecuteScalar();
        return result is null or DBNull ? null : Convert.ToString(result);
    }

    private static void Commit(SQLiteConnection connection)
    {
        using var commit = connection.CreateCommand();
        commit.CommandText = "COMMIT;";
        commit.ExecuteNonQuery();
    }

    private static void Rollback(SQLiteConnection connection)
    {
        using var rollback = connection.CreateCommand();
        rollback.CommandText = "ROLLBACK;";
        rollback.ExecuteNonQuery();
    }

    private static void TryRollback(SQLiteConnection connection)
    {
        try
        {
            Rollback(connection);
        }
        catch (SQLiteException)
        {
            // The transaction may already have been rolled back by SQLite itself.
        }
    }

    private static bool IsBusyOrLocked(SQLiteException ex)
        => ex.ResultCode is SQLiteErrorCode.Busy or SQLiteErrorCode.Locked;

    private static string Format(DateTimeOffset value)
        => value.UtcDateTime.ToString("O");

    private static string ReadString(SQLiteDataReader reader, string column)
        => Convert.ToString(reader[column]) ?? string.Empty;

    private static string? ReadNullableString(SQLiteDataReader reader, string column)
        => reader[column] is DBNull ? null : Convert.ToString(reader[column]);

    private static long? ReadNullableLong(SQLiteDataReader reader, string column)
        => reader[column] is DBNull ? null : Convert.ToInt64(reader[column]);

    private static EffectAttemptRecord ReadEffectAttempt(SQLiteDataReader reader)
        => new(
            ReadString(reader, "EffectId"),
            ReadString(reader, "EffectClass"),
            ReadString(reader, "DescriptorHash"),
            Convert.ToInt32(reader["AttemptOrdinal"]),
            ReadString(reader, "TaskScopeKey"),
            ReadString(reader, "PermissionId"),
            Convert.ToInt32(reader["SpendIndex"]),
            ReadString(reader, "Nonce"),
            ReadString(reader, "Audience"),
            ReadString(reader, "ExpiresAtUtc"),
            ReadString(reader, "PolicyVersion"),
            ReadString(reader, "LineageKey"),
            ReadString(reader, "SourceIdentityHash"),
            ReadString(reader, "EnvironmentIdentityHash"),
            ReadString(reader, "StateOrigin"),
            ReadString(reader, "CreatedAtUtc"));

    private static PreEffectReceiptRecord ReadPreEffectReceipt(SQLiteDataReader reader)
        => new(
            ReadString(reader, "EffectId"),
            ReadString(reader, "DescriptorHash"),
            ReadString(reader, "PermissionId"),
            Convert.ToInt32(reader["AttemptOrdinal"]),
            ReadString(reader, "ReservationId"),
            ReadNullableString(reader, "SlotId"),
            ReadString(reader, "Audience"),
            ReadString(reader, "ExpiresAtUtc"),
            ReadString(reader, "PendingEffectMarker"),
            ReadString(reader, "StateOrigin"),
            ReadString(reader, "CreatedAtUtc"));

    /// <summary>
    /// <see cref="ISpendBoundaryRead"/> over the in-flight bundle connection: every
    /// read runs inside the same transaction that commits the write bundle.
    /// </summary>
    private sealed class BoundaryRead : ISpendBoundaryRead
    {
        private readonly SQLiteConnection _connection;

        public BoundaryRead(SQLiteConnection connection) => _connection = connection;

        public int CountSpends(string permissionId) => Convert.ToInt32(ScalarString(_connection,
            "SELECT COUNT(*) FROM PermissionSpendLedger WHERE PermissionId = @permission_id;",
            ("@permission_id", permissionId)) ?? "0");

        public string? LatestSpendEffectId(string permissionId) => ScalarString(_connection,
            "SELECT EffectId FROM EffectAttempts WHERE PermissionId = @permission_id ORDER BY SpendIndex DESC LIMIT 1;",
            ("@permission_id", permissionId));

        public string? FindEffectId(string effectId) => ScalarString(_connection,
            "SELECT EffectId FROM EffectAttempts WHERE EffectId = @effect_id LIMIT 1;",
            ("@effect_id", effectId));

        public string? FindEffectIdByNonce(string nonce) => ScalarString(_connection,
            "SELECT EffectId FROM EffectAttempts WHERE Nonce = @nonce LIMIT 1;",
            ("@nonce", nonce));

        public string? FindEffectIdByOrdinal(string taskScopeKey, int attemptOrdinal) => ScalarString(_connection,
            "SELECT EffectId FROM EffectAttempts WHERE TaskScopeKey = @task_scope AND AttemptOrdinal = @ordinal LIMIT 1;",
            ("@task_scope", taskScopeKey), ("@ordinal", attemptOrdinal));

        public int CountActiveReservations(string budgetScopeKey) => Convert.ToInt32(ScalarString(_connection,
            "SELECT COUNT(*) FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active';",
            ("@scope", budgetScopeKey)) ?? "0");

        public long SumActiveReservationAmounts(string budgetScopeKey) => Convert.ToInt64(ScalarString(_connection,
            "SELECT COALESCE(SUM(AmountMinor), 0) FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active';",
            ("@scope", budgetScopeKey)) ?? "0");

        public string? LatestActiveReservationEffectId(string budgetScopeKey) => ScalarString(_connection,
            "SELECT EffectId FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active' ORDER BY CreatedAtUtc DESC, ReservationId DESC LIMIT 1;",
            ("@scope", budgetScopeKey));
    }

    /// <summary>
    /// <see cref="ISpendBoundaryRead"/> over committed state (one checked connection
    /// per query), the pre-evaluation twin of <see cref="BoundaryRead"/>.
    /// </summary>
    private sealed class StandaloneBoundaryRead : ISpendBoundaryRead
    {
        private readonly SqliteAuthorityAccountingStore _store;

        public StandaloneBoundaryRead(SqliteAuthorityAccountingStore store) => _store = store;

        private T Query<T>(Func<SQLiteConnection, string, T> query, string arg)
        {
            using var connection = _store.OpenChecked();
            return query(connection, arg);
        }

        public int CountSpends(string permissionId) => Query((c, id) => Convert.ToInt32(ScalarString(c,
            "SELECT COUNT(*) FROM PermissionSpendLedger WHERE PermissionId = @permission_id;",
            ("@permission_id", id)) ?? "0"), permissionId);

        public string? LatestSpendEffectId(string permissionId) => Query((c, id) => ScalarString(c,
            "SELECT EffectId FROM EffectAttempts WHERE PermissionId = @permission_id ORDER BY SpendIndex DESC LIMIT 1;",
            ("@permission_id", id)), permissionId);

        public string? FindEffectId(string effectId) => Query((c, id) => ScalarString(c,
            "SELECT EffectId FROM EffectAttempts WHERE EffectId = @effect_id LIMIT 1;",
            ("@effect_id", id)), effectId);

        public string? FindEffectIdByNonce(string nonce) => Query((c, n) => ScalarString(c,
            "SELECT EffectId FROM EffectAttempts WHERE Nonce = @nonce LIMIT 1;",
            ("@nonce", n)), nonce);

        public string? FindEffectIdByOrdinal(string taskScopeKey, int attemptOrdinal) => Query(
            (c, task) => ScalarString(c,
                "SELECT EffectId FROM EffectAttempts WHERE TaskScopeKey = @task_scope AND AttemptOrdinal = @ordinal LIMIT 1;",
                ("@task_scope", task), ("@ordinal", attemptOrdinal)), taskScopeKey);

        public int CountActiveReservations(string budgetScopeKey) => Query((c, scope) => Convert.ToInt32(ScalarString(c,
            "SELECT COUNT(*) FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active';",
            ("@scope", scope)) ?? "0"), budgetScopeKey);

        public long SumActiveReservationAmounts(string budgetScopeKey) => Query((c, scope) => Convert.ToInt64(ScalarString(c,
            "SELECT COALESCE(SUM(AmountMinor), 0) FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active';",
            ("@scope", scope)) ?? "0"), budgetScopeKey);

        public string? LatestActiveReservationEffectId(string budgetScopeKey) => Query((c, scope) => ScalarString(c,
            "SELECT EffectId FROM BudgetReservations WHERE BudgetScopeKey = @scope AND Status = 'active' ORDER BY CreatedAtUtc DESC, ReservationId DESC LIMIT 1;",
            ("@scope", scope)), budgetScopeKey);
    }
}