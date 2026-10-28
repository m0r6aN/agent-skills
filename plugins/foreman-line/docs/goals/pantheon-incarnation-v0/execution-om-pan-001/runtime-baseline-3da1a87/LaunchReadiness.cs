namespace Keon.Runtime.Api;

/// <summary>
/// Composed launch-readiness gate.
///
/// Launch mode (<c>KEON_RUNTIME_MODE=launch</c>) must fail fast until every launch-grade lane
/// is delivered, so the host never emits partial or fake launch evidence. Each completed lane
/// moves from <see cref="RemainingBlockers"/> to <see cref="SatisfiedLanes"/>, but launch stays
/// gated while any blocker remains. When the last blocker is removed this gate becomes a no-op.
///
/// Status:
///  - R2A: authority wiring satisfied (real, fail-closed AuthorityService).
///  - R2B: a real controlled execution handler is present (approved execution produces an
///    auditable governed-action side effect). NOTE: this does NOT clear execution — the
///    controlled side-effect ledger is in-memory, so execution durability remains a blocker
///    until R2C. R2B narrows the execution blocker; it does not remove it.
///  - Receipt 1.2: canonical hashing, optional Ed25519 signing primitives, and dispatcher
///    seal verification are implemented. Production signer/key-provider host wiring,
///    mandatory signatures, and predecessor-chain continuity are not.
///  - R2C: durable receipts + execution-durability. R2D/R2E: production signing + chain.
///  - Launch authentication is not implemented.
/// </summary>
internal static class LaunchReadiness
{
    /// <summary>
    /// Launch-grade lanes proven ready. These are recorded for honesty in the failure message;
    /// being satisfied does NOT make launch serviceable while any blocker remains.
    /// </summary>
    internal static IReadOnlyList<string> SatisfiedLanes { get; } = new[]
    {
        "authority: real AuthorityService, fail-closed (R2A)",
        "controlled-execution-handler: approved execution produces a real controlled, deterministic, auditable governed-action side effect via IControlledExecutionLedger (R2B); GMF-P2A cuts the ledger over to the durable SqliteControlledExecutionLedger behind the receipt-persistence switch",
        "receipt-canonical-hash: decision receipt version 1.2.0 is sealed with a canonical SHA-256 hash",
        "receipt-signing-primitives: optional Ed25519 decision-receipt signing and verification primitives exist",
        "dispatcher-seal-verification: controlled execution verifies the stored decision receipt canonical hash and any present signature before execution"
    };

    /// <summary>
    /// Launch-grade lanes still not ready. Authority and the controlled-execution-handler are
    /// intentionally NOT listed (they are satisfied). Execution durability IS still listed —
    /// the GMF-P2A durable governed-action ledger exists behind the receipt-persistence
    /// switch, but the launch host does not enable persistence (default is in-memory, lost on
    /// restart) and R2C receipt durability is not composed.
    /// </summary>
    internal static IReadOnlyList<string> RemainingBlockers { get; } = new[]
    {
        "execution-durability: the governed-action ledger is only durable behind the receipt-persistence switch (GMF-P2A SqliteControlledExecutionLedger); the launch host does not enable persistence, so execution state is in-memory and lost on restart (Lane R2C)",
        "durable-storage: decision/execution receipt stores, authoritative receipt outbox, spine events, and controlled-execution state are not durably persisted in the launch composition; the GMF-P2A authority/accounting store exists behind the receipt-persistence switch but is not launch-enabled (Lane R2C)",
        "production-signing: IDecisionReceiptSigner and IDecisionReceiptVerificationKeyProvider are not wired into the API host, and signature issuance remains optional (Lane R2D/R2E)",
        "receipt-chain: receipt 1.2.0 has no prev_hash predecessor continuity or atomic chain-head allocation (Lane R2D/R2E)",
        "authentication: decision and execution endpoints do not authenticate callers or derive tenant and actor identity from verified claims"
    };

    /// <summary>
    /// Throws if any launch-grade lane is not ready. The message names both the satisfied lanes
    /// and the remaining blockers, so the gate stays honest about exactly what is and is not
    /// launch-cleared.
    /// </summary>
    internal static void EnforceOrThrow()
    {
        if (RemainingBlockers.Count == 0)
        {
            return;
        }

        throw new InvalidOperationException(
            "KEON_RUNTIME_MODE=launch is not yet serviceable. Launch-ready lanes: " +
            string.Join("; ", SatisfiedLanes) +
            ". Lanes not yet launch-ready: " +
            string.Join("; ", RemainingBlockers) +
            ". Set KEON_RUNTIME_MODE=harness (default) to run the staging harness. Launch mode will not " +
            "emit partial or fake launch evidence.");
    }
}
