using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Keon.Contracts.Decision;
using Keon.Contracts.Execution;
using Keon.Core.Memory;
using Keon.Runtime.Decisions;
using Keon.Runtime.Execution;
using Keon.Runtime.Memory;
using Keon.Runtime.Observability;
using Keon.Runtime.Observability.Outbox;

namespace Keon.Runtime.Observability.Persistence.DependencyInjection;

/// <summary>
/// DI registration for receipt persistence.
/// Wires SQLite-backed stores when enabled, otherwise falls back to in-memory.
/// </summary>
public static class ReceiptPersistenceServiceCollectionExtensions
{
    /// <summary>
    /// Register receipt persistence with SQLite backend.
    /// </summary>
    /// <remarks>
    /// When enabled:
    /// - IDecisionReceiptStore -> SqliteDecisionReceiptStore
    /// - IExecutionReceiptStore -> SqliteExecutionReceiptStore
    /// - IMemoryReceiptStore -> SqliteMemoryReceiptStore
    /// - IControlledExecutionLedger -> SqliteControlledExecutionLedger (GMF-P2A durable cutover)
    /// - SqliteAuthorityAccountingStore (GMF-P2A authority/accounting store, v2 schema)
    ///
    /// When disabled (default):
    /// - Falls back to in-memory implementations (IControlledExecutionLedger ->
    ///   InMemoryControlledExecutionLedger; pre-cutover in-memory state is non-authoritative
    ///   and is never imported or resurrected)
    /// - No database file created
    /// </remarks>
    public static IServiceCollection AddKeonReceiptPersistence(
        this IServiceCollection services,
        Action<ReceiptPersistenceConfig>? configure = null)
    {
        var config = new ReceiptPersistenceConfig();
        configure?.Invoke(config);
        config.Validate();

        services.AddSingleton(config);

        if (config.Enabled)
        {
            // Initialize database if auto-migrate is enabled
            if (config.AutoMigrate)
            {
                ReceiptPersistenceSchema.InitializeDatabase(config.ConnectionString);
            }

            // Register SQLite stores
            services.TryAddSingleton<IDecisionReceiptStore>(
                _ => new SqliteDecisionReceiptStore(config.ConnectionString));

            services.TryAddSingleton<IExecutionReceiptStore>(
                _ => new SqliteExecutionReceiptStore(config.ConnectionString));

            services.TryAddSingleton<IMemoryReceiptStore>(
                _ => new SqliteMemoryReceiptStore(config.ConnectionString));

            services.TryAddSingleton<IAuthoritativeReceiptOutbox>(
                _ => new SqliteAuthoritativeReceiptOutbox(config.ConnectionString));

            services.TryAddSingleton<ICorrelationSummaryQueryService>(
                _ => new SqliteCorrelationSummaryQueryService(config.ConnectionString));

            // GMF-P2A: durable authority/accounting store and the durable controlled-execution
            // ledger cutover (AC(b)(2)) behind the same receipt-persistence switch.
            services.TryAddSingleton(
                _ => new SqliteAuthorityAccountingStore(config.ConnectionString));

            services.TryAddSingleton<IControlledExecutionLedger>(
                _ => ControlledExecutionLedgerCutover.Create(config));
        }
        else
        {
            // Register in-memory stores (default)
            services.TryAddSingleton<IDecisionReceiptStore, InMemoryDecisionReceiptStore>();
            services.TryAddSingleton<IExecutionReceiptStore, InMemoryExecutionReceiptStore>();
            services.TryAddSingleton<IMemoryReceiptStore, InMemoryMemoryReceiptStore>();
            services.TryAddSingleton<IAuthoritativeReceiptOutbox, InMemoryAuthoritativeReceiptOutbox>();
            services.TryAddSingleton<ICorrelationSummaryQueryService, NullCorrelationSummaryQueryService>();

            // GMF-P2A rollback posture: in-memory governed-action ledger; all v1 rows and v2
            // history in any existing database stay intact and inert.
            services.TryAddSingleton<IControlledExecutionLedger>(
                _ => ControlledExecutionLedgerCutover.Create(config));
        }

        return services;
    }
}
