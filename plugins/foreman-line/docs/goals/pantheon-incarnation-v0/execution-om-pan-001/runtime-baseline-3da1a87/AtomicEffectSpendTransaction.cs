using System.Security.Cryptography;
using Keon.Canonicalization;
using Keon.Contracts.Authority;
using Keon.Runtime.Observability.Persistence;

namespace Keon.Verify;

// ===========================================================================
// GMF-P2B: the D6/A1-D6 atomic spend transaction.
//
// ONE durable boundary that validates revocation, expiry, descriptor, audience,
// nonce, policy, and lineage; consumes permission; records a unique effect
// attempt; reserves budget; acquires concurrency; and persists the pre-effect
// receipt plus pending-effect state — all-or-nothing under the P2A store's
// database isolation and uniqueness guarantees (P1-C107). Validation verdicts
// are evaluated inside the same database transaction that commits the write
// bundle (the store's in-boundary composition point).
//
// Fail-closed: every non-satisfied validation verdict leaves the permission
// unconsumed and persists exactly one durable denial receipt whose code is
// drawn only from the P1-C071 closed vocabulary via
// <see cref="AtomicSpendDenialMap"/> (P1-C075). One-spend/one-effect (D21):
// a satisfied spend is permanently consumed even on effect failure, ambiguity,
// or zero settlement; idempotent re-presentation may return the recorded
// effect/receipt but never creates a second attempt (P1-C010/P1-C111).
//
// Crash safety is exactly two-outcome (S4): for a pending effect the only
// lawful recovery outcomes are COMPLETE (via <see cref="CompletePendingEffect"/>,
// the append-only terminal path) or ROLLBACK-OF-PENDING-STATE (via
// <see cref="RollbackPendingEffect"/>, the P2A quarantine primitive). Neither
// un-consumes, resurrects, or re-spends permission (D21/P1-C108).
//
// The store records authority/accounting state and confers nothing (D2): only
// Runtime-issued IPermission is canonical authority (P1-C047/P1-C051), and an
// envelope can never mint, delegate, refresh, or spend authority (P1-C048).
// No external effect occurs on any path (charter no-go boundary).
// ===========================================================================

/// <summary>Verdict names of the GMF-P2B boundary verdict pass.</summary>
public enum AtomicSpendVerdict
{
    Satisfied = 0,
    EnvelopeForgery = 1,
    Missing = 2,
    ScopeMismatch = 3,
    BindingMismatch = 4,
    PolicyMismatch = 5,
    Expired = 6,
    Revoked = 7,
    AudienceMismatch = 8,
    Replay = 9,
    AlreadyConsumed = 10,
    SignatureInvalid = 11,
    UnsupportedGrantType = 12,
    HumanOversightNotSatisfied = 13,
    StoreUnavailable = 14,
    RaceLost = 15,
    ReservationQuarantined = 16,
}

/// <summary>
/// THE verdict→denial-code mapping (one named table; P1-C075 family only).
///
/// Total over the seven D6/A1-D6 verdicts — revocation, expiry, descriptor,
/// audience, nonce, policy, lineage — and extended, in the same table, to the
/// fail-closed verifier-family checks the boundary evaluates for equivalence.
/// Every value is a P1-C075 pre-spend family code (the store's schema CHECK
/// rejects anything outside P1-C071, so the vocabulary is enforced
/// structurally). The lineage verdict takes lineage-family values as P1-C075
/// lists them: no dedicated LINEAGE literal exists in the closed set, so
/// lineage failures map by chain-failure kind to the family's revocation,
/// expiry, and trust-scope codes.
/// </summary>
public static class AtomicSpendDenialMap
{
    // -- The seven D6/A1-D6 verdicts (total mapping) --
    public const string Revocation = "FLEET_DENIED_REVOKED";
    public const string Expiry = "FLEET_DENIED_EXPIRED";
    public const string Descriptor = "FLEET_DENIED_DESCRIPTOR_MISMATCH";
    public const string Audience = "FLEET_DENIED_AUDIENCE_MISMATCH";
    public const string Nonce = "FLEET_DENIED_REPLAY";
    public const string Policy = "FLEET_DENIED_POLICY";

    /// <summary>Lineage-family (P1-C075): chain revocation.</summary>
    public const string LineageRevoked = "FLEET_DENIED_REVOKED";

    /// <summary>Lineage-family (P1-C075): chain expiry window.</summary>
    public const string LineageExpired = "FLEET_DENIED_EXPIRED";

    /// <summary>Lineage-family (P1-C075): chain scope/binding/signature trust failure.</summary>
    public const string LineageTrustScope = "FLEET_DENIED_TRUST_SCOPE";

    // -- Extended fail-closed rows (same P1-C075 family constraint) --
    public const string EnvelopeForgery = "FLEET_DENIED_ENVELOPE_FORGERY";

    /// <summary>
    /// Use-count exhaustion on an already-consumed permission (R3; AC(c)/P1-C050/
    /// P1-C071 frozen binding): FLEET_DENIED_REPLAY linked to the original record.
    /// </summary>
    public const string UseCount = "FLEET_DENIED_REPLAY";

    /// <summary>True concurrent admission losers (budget/slot/call-budget, P1-C074).</summary>
    public const string BudgetRaceLost = "FLEET_DENIED_RACE_LOST";
    public const string Quarantined = "FLEET_DENIED_RESERVATION_QUARANTINED";
    public const string Scope = "FLEET_DENIED_TRUST_SCOPE";
    public const string Attestation = "FLEET_DENIED_TRUST_SCOPE";
    public const string Oversight = "FLEET_DENIED_POLICY";
    public const string StoreUnavailable = "FLEET_DENIED_STORE_UNAVAILABLE";
}

/// <summary>
/// The canonical constraints projection carrying the bound audience/nonce
/// (P1-C049: audience/nonce extend the canonical constraints schema; the single
/// authority primitive is preserved). Envelopes carry these as presentation
/// only — canonical IPermission validation decides (P1-C047).
/// </summary>
public sealed record CanonicalConstraintProjection(
    string Audience,
    string Nonce);

/// <summary>
/// A <c>FleetPermissionEnvelope</c> presentation (P1-C046 derived executor
/// projection). Exact allowed-field closed list from D3: permission/effect
/// identifiers, descriptor hash, constraints hash, audience, nonce, expiry,
/// remaining-use projection, approval binding, proof material. No field here is
/// authoritative; envelope bytes never decide (P1-C047) and can never mint,
/// delegate, refresh, or spend authority (P1-C048).
/// </summary>
public sealed record PermissionEnvelopePresentation(
    string PermissionId,
    string? EffectId,
    string DescriptorHash,
    string ConstraintsHash,
    string Audience,
    string Nonce,
    string ExpiresAtUtc,
    long? RemainingUseProjection,
    string? ApprovalBinding,
    string? ProofMaterial);

/// <summary>
/// Budget-capacity admission input (P1-C074/P1-C120): the race admission rule
/// used by the budget race (GMF-NEG-023) and the call-budget race shape
/// (GMF-NEG-055) alike. Admission is atomic inside the store transaction.
/// </summary>
public sealed record BudgetAdmission(
    int MaxActiveReservations,
    long? LimitMinor);

/// <summary>
/// The GMF-P2B boundary request: canonical permission evidence + presented
/// descriptor/audience/nonce/policy/lineage + budget/slot/reservation inputs.
/// </summary>
public sealed record AtomicSpendRequest
{
    /// <summary>Canonical IPermission evidence — the only authority (D2). Null presents none.</summary>
    public required IPermission? Permission { get; init; }

    /// <summary>Delegation lineage for GrantorType=Delegation permissions.</summary>
    public DelegationChain? DelegationChain { get; init; }

    /// <summary>Effect bindings shared with <see cref="PermissionSpendVerifier"/> fixtures.</summary>
    public required PermissionSpendRequest Spend { get; init; }

    /// <summary>Bound audience/nonce from the canonical constraints schema (P1-C049).</summary>
    public required CanonicalConstraintProjection Constraints { get; init; }

    /// <summary>The presenting actuator's audience (P1-C050).</summary>
    public required string PresentedAudience { get; init; }

    /// <summary>The presented nonce (P1-C049).</summary>
    public required string PresentedNonce { get; init; }

    /// <summary>Active runtime profile digest (GMF-NEG-004 control); null skips the check.</summary>
    public string? RuntimeProfileHash { get; init; }

    /// <summary>Descriptor-bound profile digest (GMF-NEG-004 control); null skips the check.</summary>
    public string? DescriptorBoundProfileHash { get; init; }

    /// <summary>Envelope presentation (P1-C046-C052); null presents none.</summary>
    public PermissionEnvelopePresentation? Envelope { get; init; }

    /// <summary>The store's P1-C107 write-bundle input.</summary>
    public required BeginEffectRequest Begin { get; init; }

    /// <summary>Budget-capacity admission (P1-C074/P1-C120); null = no capacity bound.</summary>
    public BudgetAdmission? Budget { get; init; }

    /// <summary>
    /// Optional step observer for the write-bundle boundaries (observation and
    /// fault injection; a throw rolls back the whole bundle, P1-C124). Default
    /// null: no callback, no effect on behavior.
    /// </summary>
    public Action<SpendBoundaryStep>? StepObserver { get; init; }
}

/// <summary>Result of the in-boundary verdict pass.</summary>
public sealed record VerdictEvaluation
{
    public required bool IsSatisfied { get; init; }
    public required AtomicSpendVerdict Verdict { get; init; }
    public string? DenialCode { get; init; }
    public string? WinnerEffectId { get; init; }
    public string? LinkedReceiptId { get; init; }
    public string? Message { get; init; }

    /// <summary>Verdict-family projection for equivalence against <see cref="PermissionSpendVerifier"/>.</summary>
    public PermissionSpendVerdict PermissionSpendFamily => Verdict switch
    {
        AtomicSpendVerdict.Satisfied => PermissionSpendVerdict.Satisfied,
        AtomicSpendVerdict.Missing => PermissionSpendVerdict.Missing,
        AtomicSpendVerdict.ScopeMismatch => PermissionSpendVerdict.ScopeMismatch,
        AtomicSpendVerdict.BindingMismatch => PermissionSpendVerdict.BindingMismatch,
        AtomicSpendVerdict.PolicyMismatch => PermissionSpendVerdict.BindingMismatch,
        AtomicSpendVerdict.Expired => PermissionSpendVerdict.Expired,
        AtomicSpendVerdict.Revoked => PermissionSpendVerdict.Revoked,
        AtomicSpendVerdict.AlreadyConsumed => PermissionSpendVerdict.AlreadyConsumed,
        AtomicSpendVerdict.SignatureInvalid => PermissionSpendVerdict.SignatureInvalid,
        AtomicSpendVerdict.UnsupportedGrantType => PermissionSpendVerdict.UnsupportedGrantType,
        AtomicSpendVerdict.HumanOversightNotSatisfied => PermissionSpendVerdict.HumanOversightNotSatisfied,
        // Presentation verdicts (D6 audience/nonce, envelope non-authority) have
        // no verifier counterpart; shared equivalence fixtures never produce them.
        _ => PermissionSpendVerdict.BindingMismatch,
    };
}

/// <summary>Result of the atomic spend transaction.</summary>
public sealed record AtomicSpendResult
{
    public required bool IsSatisfied { get; init; }
    public AtomicSpendVerdict Verdict { get; init; }
    public string? DenialCode { get; init; }
    public string? DenialReceiptId { get; init; }
    public string? WinnerEffectId { get; init; }
    public string? LinkedReceiptId { get; init; }
    public string? Message { get; init; }

    /// <summary>True when an idempotent re-presentation returned the recorded effect/receipt (P1-C010/P1-C111).</summary>
    public bool IdempotentReplay { get; init; }

    /// <summary>The recorded effect attempt (committed or returned idempotently).</summary>
    public EffectAttemptRecord? RecordedAttempt { get; init; }

    /// <summary>The recorded pre-effect receipt (P1-C109).</summary>
    public PreEffectReceiptRecord? RecordedReceipt { get; init; }

    /// <summary>
    /// True when the store path failed and the failure is noted here, outside the
    /// failed store path (P1-C124): the transaction committed nothing and the
    /// permission is unspent.
    /// </summary>
    public bool StoreUnavailable { get; init; }
}

/// <summary>
/// The GMF-P2B atomic spend transaction (D6/A1-D6 seven-step boundary) over the
/// GMF-P2A store. Future effect paths (P3B/P4B) must route every effect-time
/// spend through <see cref="Execute"/>; nothing in this parcel wires it into
/// ExecutionDispatcher, the spend gates, or any KEON005-governed path.
/// </summary>
public sealed class AtomicEffectSpendTransaction
{
    private readonly SqliteAuthorityAccountingStore _store;
    private readonly DelegationChainVerifier _delegationChainVerifier;
    private readonly DelegationRevocationRegistry _revocationRegistry;
    private readonly IKeyProvider _keyProvider;
    private readonly TimeProvider _clock;

    public AtomicEffectSpendTransaction(
        SqliteAuthorityAccountingStore store,
        DelegationChainVerifier delegationChainVerifier,
        DelegationRevocationRegistry revocationRegistry,
        IKeyProvider keyProvider,
        TimeProvider? clock = null)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _delegationChainVerifier = delegationChainVerifier ?? throw new ArgumentNullException(nameof(delegationChainVerifier));
        _revocationRegistry = revocationRegistry ?? throw new ArgumentNullException(nameof(revocationRegistry));
        _keyProvider = keyProvider ?? throw new ArgumentNullException(nameof(keyProvider));
        _clock = clock ?? TimeProvider.System;
    }

    /// <summary>
    /// Runs the D6/A1-D6 boundary: the seven verdicts evaluated inside the store
    /// transaction, the atomic commit via the P2A store's P1-C107 bundle, and a
    /// receipted denial (P1-C106) with zero excess effect for every
    /// non-satisfied verdict (P1-C075).
    /// </summary>
    public AtomicSpendResult Execute(AtomicSpendRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.Spend);
        ArgumentNullException.ThrowIfNull(request.Constraints);
        ArgumentNullException.ThrowIfNull(request.Begin);

        var now = _clock.GetUtcNow();

        // Trusted-clock stamping (KEO-172): the boundary owns its timestamps.
        var begin = request.Begin with
        {
            SpentAtUtc = now,
            AttemptedAtUtc = now,
        };
        var effective = request with { Begin = begin };

        // R1 (the never-weaker seam, P1-C047): the full verdict pass runs BEFORE
        // the idempotent short-circuit — no forged/widened/reissued presentation
        // can reach the idempotent return. This pre-evaluation and the in-bundle
        // evaluation run the SAME pass; the in-bundle one is authoritative at
        // commit time (P1-C107).
        var preVerdict = EvaluateVerdicts(effective, _store.CreateBoundaryRead());
        if (!preVerdict.IsSatisfied)
        {
            return RecordDeniedOutcome(effective, preVerdict);
        }

        // Idempotent re-presentation (P1-C010/P1-C111): the recorded effect and
        // receipt are returned; no second attempt, receipt, reservation, or slot
        // is ever created. Presentation equality covers the full canonical
        // presentation — every recorded field a forged/widened variant can differ
        // on (effect class, descriptor, ordinal, task scope, nonce, audience,
        // expiry, policy version, lineage, identity hashes, budget/slot/amount).
        var existing = _store.GetEffectAttempt(begin.EffectId);
        if (existing is not null)
        {
            if (IsSamePresentation(existing, begin))
            {
                return new AtomicSpendResult
                {
                    IsSatisfied = true,
                    Verdict = AtomicSpendVerdict.Satisfied,
                    IdempotentReplay = true,
                    RecordedAttempt = existing,
                    RecordedReceipt = _store.GetPreEffectReceipt(begin.EffectId),
                };
            }

            // A forged/widened/reissued re-presentation of a recorded effect id
            // denies pre-spend (R1/P1-C047) — never an idempotent success.
            return RecordDeniedOutcome(effective, Deny(
                AtomicSpendVerdict.EnvelopeForgery, AtomicSpendDenialMap.EnvelopeForgery,
                "Recorded effect id re-presented with a different canonical presentation (forged/widened/reissued)."));
        }

        try
        {
            var evaluation = new BoundaryEvaluation(this, request, begin);
            if (_store.TryBeginEffect(begin, evaluation, out var denialReceiptId))
            {
                return new AtomicSpendResult
                {
                    IsSatisfied = true,
                    Verdict = AtomicSpendVerdict.Satisfied,
                    RecordedAttempt = _store.GetEffectAttempt(begin.EffectId),
                    RecordedReceipt = _store.GetPreEffectReceipt(begin.EffectId),
                };
            }

            // R2: the verdict kind travels TYPED through the boundary. Only the
            // store's frozen deny shapes (quarantine/race/replay) fall back to the
            // strict, injective code→kind map below; nothing is reconstructed
            // from the many-to-one code family.
            var receipt = _store.GetDenialReceipts(begin.EffectId)
                .FirstOrDefault(r => r.DenialReceiptId == denialReceiptId);
            if (evaluation.LastOutcome is { } outcome)
            {
                return new AtomicSpendResult
                {
                    IsSatisfied = false,
                    Verdict = outcome.Verdict,
                    DenialCode = outcome.Code,
                    DenialReceiptId = denialReceiptId,
                    WinnerEffectId = outcome.WinnerEffectId,
                    LinkedReceiptId = outcome.LinkedReceiptId,
                    Message = "Spend denied inside the boundary (fail-closed).",
                };
            }

            return new AtomicSpendResult
            {
                IsSatisfied = false,
                Verdict = StoreDenialKind(receipt?.DenialCode),
                DenialCode = receipt?.DenialCode,
                DenialReceiptId = denialReceiptId,
                WinnerEffectId = receipt?.WinnerEffectId,
                LinkedReceiptId = receipt?.LinkedReceiptId,
                Message = "Spend denied by the store's frozen admission shape (fail-closed).",
            };
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (Exception ex)
        {
            // P1-C124: a persistence failure commits nothing and effects
            // nothing; the failure is noted here, OUTSIDE the failed store path.
            return new AtomicSpendResult
            {
                IsSatisfied = false,
                Verdict = AtomicSpendVerdict.StoreUnavailable,
                DenialCode = AtomicSpendDenialMap.StoreUnavailable,
                StoreUnavailable = true,
                Message = $"[{AtomicSpendDenialMap.StoreUnavailable}] {ex.GetType().Name}: {ex.Message}",
            };
        }
    }

    /// <summary>Persists a pre-boundary denial receipt and returns the typed outcome.</summary>
    private AtomicSpendResult RecordDeniedOutcome(AtomicSpendRequest request, VerdictEvaluation verdict)
    {
        var denialReceiptId = _store.RecordDenial(new DenialReceiptInput(
            request.Begin.EffectId, request.Begin.PermissionId,
            verdict.DenialCode ?? AtomicSpendDenialMap.Attestation,
            verdict.WinnerEffectId,
            verdict.LinkedReceiptId,
            DeniedAtUtc: request.Begin.AttemptedAtUtc));
        return new AtomicSpendResult
        {
            IsSatisfied = false,
            Verdict = verdict.Verdict,
            DenialCode = verdict.DenialCode,
            DenialReceiptId = denialReceiptId,
            WinnerEffectId = verdict.WinnerEffectId,
            LinkedReceiptId = verdict.LinkedReceiptId,
            Message = verdict.Message,
        };
    }

    /// <summary>
    /// The boundary verdict pass: the seven D6 verdicts plus the verifier-family
    /// fail-closed checks, in <see cref="PermissionSpendVerifier"/>'s frozen
    /// check order (semantic baseline; never weaker), composing
    /// <see cref="DelegationChainVerifier"/> and
    /// <see cref="DelegationRevocationRegistry"/> — never re-implementing their
    /// checks. Public so the equivalence suite can run shared fixtures through
    /// this exact pass; inside <see cref="Execute"/> it runs inside the store
    /// transaction with live in-boundary reads.
    /// </summary>
    public VerdictEvaluation EvaluateVerdicts(AtomicSpendRequest request, ISpendBoundaryRead? read)
    {
        ArgumentNullException.ThrowIfNull(request);
        var permission = request.Permission;
        var spend = request.Spend;
        var now = _clock.GetUtcNow();

        // 0. Envelope non-authority (P1-C046-C052): envelope bytes never decide;
        // forged/widened/reissued envelopes deny pre-spend and can never mint,
        // delegate, refresh, or spend authority (P1-C048/GMF-NEG-059).
        if (request.Envelope is not null)
        {
            var forgery = DescribeEnvelopeForgery(request.Envelope, permission, request.Constraints, read);
            if (forgery is not null)
            {
                return Deny(AtomicSpendVerdict.EnvelopeForgery, AtomicSpendDenialMap.EnvelopeForgery, forgery);
            }
        }

        // 1. Missing (verifier check order: missing first).
        if (permission is null)
        {
            return Deny(AtomicSpendVerdict.Missing, AtomicSpendDenialMap.Attestation,
                "No canonical permission presented or referenced for the attempted effect.");
        }

        // 2. Tenant match.
        if (!string.Equals(permission.TenantId, spend.TenantId, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.ScopeMismatch, AtomicSpendDenialMap.Scope,
                $"Tenant '{spend.TenantId}' is outside the permission's bound tenant '{permission.TenantId}'.");
        }

        // 3. Subject / actor match.
        if (!string.Equals(permission.SubjectId, spend.ActorId, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.ScopeMismatch, AtomicSpendDenialMap.Scope,
                $"Actor '{spend.ActorId}' does not match the permission subject '{permission.SubjectId}'.");
        }

        // 4. Effect class match.
        if (!string.Equals(permission.EffectClass, spend.EffectClass, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.ScopeMismatch, AtomicSpendDenialMap.Scope,
                $"Effect class '{spend.EffectClass}' is outside the permission's effect class '{permission.EffectClass}'.");
        }

        // 5. Effect descriptor hash binding (P1-C017: the spend path verifies
        // exact bytes — recomputed canonical bytes must agree with both hashes).
        if (!string.Equals(permission.EffectDescriptorHash, spend.EffectDescriptorHash, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.Descriptor,
                "Effect descriptor hash does not match the granted permission.");
        }

        if (spend.CanonicalEffectDescriptor is { Length: > 0 } descriptorBytes)
        {
            var recomputed = Sha256Hex(descriptorBytes);
            if (!string.Equals(recomputed, spend.EffectDescriptorHash, StringComparison.Ordinal))
            {
                return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.Descriptor,
                    "Presented canonical effect descriptor does not hash to the presented effect_descriptor_hash (P1-C017).");
            }
        }

        // 6. Audience (D6; P1-C050: permission/envelope audience must equal the
        // presenting actuator audience).
        if (!string.Equals(request.Constraints.Audience, request.PresentedAudience, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.AudienceMismatch, AtomicSpendDenialMap.Audience,
                $"Presenting actuator audience '{request.PresentedAudience}' does not match the bound audience '{request.Constraints.Audience}'.");
        }

        // 7. Nonce (D6; P1-C049: bound audience/nonce enforced via canonical
        // IPermission validation; replay presentations deny and are linked to
        // their original record, P1-C050). The request's own recorded effect is
        // not a foreign replay — the idempotent path resolves it.
        if (!string.Equals(request.Constraints.Nonce, request.PresentedNonce, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.Replay, AtomicSpendDenialMap.Nonce,
                "Presented nonce does not match the bound nonce (P1-C049).");
        }

        if (read?.FindEffectIdByNonce(request.PresentedNonce) is { } nonceWinner
            && !string.Equals(nonceWinner, request.Begin.EffectId, StringComparison.Ordinal))
        {
            return new VerdictEvaluation
            {
                IsSatisfied = false,
                Verdict = AtomicSpendVerdict.Replay,
                DenialCode = AtomicSpendDenialMap.Nonce,
                LinkedReceiptId = nonceWinner,
                Message = $"Nonce '{request.PresentedNonce}' was already used by effect '{nonceWinner}' (replay).",
            };
        }

        // 8. Resource / parameter (scope) match.
        if (!string.Equals(permission.ConstraintsHash, spend.ConstraintsHash, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.ScopeMismatch, AtomicSpendDenialMap.Scope,
                "Resource or parameters fall outside the permission's bound constraints.");
        }

        // 9. Expiry (D6).
        if (permission.ExpiresAt.HasValue && now > permission.ExpiresAt.Value)
        {
            return Deny(AtomicSpendVerdict.Expired, AtomicSpendDenialMap.Expiry,
                $"Permission expired at {permission.ExpiresAt.Value:O} (now={now:O}).");
        }

        if (now < permission.IssuedAt)
        {
            return Deny(AtomicSpendVerdict.Expired, AtomicSpendDenialMap.Expiry,
                $"Permission not yet valid: issued_at {permission.IssuedAt:O} is after now={now:O}.");
        }

        // 10. Revocation (D6; append-only registry, same rule as the verifier).
        if (_revocationRegistry.IsRevoked(permission.PermissionId) ||
            (permission.DelegationChainId is not null && _revocationRegistry.IsRevoked(permission.DelegationChainId)) ||
            permission.RevocationRef is not null)
        {
            return Deny(AtomicSpendVerdict.Revoked, AtomicSpendDenialMap.Revocation,
                $"An append-only revocation exists for permission '{permission.PermissionId}' or its delegation lineage.");
        }

        // 11. Use count (verifier check 9; in-boundary read at commit time).
        // Exhaustion on an already-consumed permission denies FLEET_DENIED_REPLAY
        // linked via LinkedReceiptId to the original record (R3; AC(c)/P1-C050/
        // P1-C071 frozen binding). FLEET_DENIED_RACE_LOST stays reserved for true
        // concurrent admission losers (budget/slot/call-budget, P1-C074). The
        // request's own recorded effect is the idempotent path, not a denial.
        var maxUses = EffectiveMaxUses(permission);
        if (read is not null
            && read.CountSpends(permission.PermissionId) >= maxUses
            && read.FindEffectId(request.Begin.EffectId) is null)
        {
            return new VerdictEvaluation
            {
                IsSatisfied = false,
                Verdict = AtomicSpendVerdict.AlreadyConsumed,
                DenialCode = AtomicSpendDenialMap.UseCount,
                LinkedReceiptId = read.LatestSpendEffectId(permission.PermissionId),
                Message = $"Use count exhausted for permission '{permission.PermissionId}' (max_uses={maxUses}).",
            };
        }

        // 12. Policy version binding (D6 policy; verifier check 10).
        if (spend.PolicyVersion is not null &&
            !string.Equals(permission.PolicyVersion, spend.PolicyVersion, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.PolicyMismatch, AtomicSpendDenialMap.Policy,
                $"Policy version '{spend.PolicyVersion}' does not match the granted policy version '{permission.PolicyVersion}'.");
        }

        // 13. Policy profile binding (GMF-NEG-004: Runtime authority wins on
        // profile disagreement — spend denied, permission unconsumed).
        if (request.RuntimeProfileHash is not null && request.DescriptorBoundProfileHash is not null &&
            !string.Equals(request.RuntimeProfileHash, request.DescriptorBoundProfileHash, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.PolicyMismatch, AtomicSpendDenialMap.Policy,
                "Runtime profile digest disagrees with the descriptor-bound profile (Runtime authority wins).");
        }

        // 14. Grant-type specific verification (D6 lineage composes
        // DelegationChainVerifier; human grants compose the key provider).
        switch (permission.GrantorType)
        {
            case PermissionGrantKind.Policy:
                break;

            case PermissionGrantKind.Delegation:
            {
                var lineage = EvaluateLineage(permission, request.DelegationChain, now);
                if (lineage is not null)
                {
                    return lineage;
                }

                break;
            }

            case PermissionGrantKind.Human:
            {
                var human = EvaluateHumanGrant(permission, spend);
                if (human is not null)
                {
                    return human;
                }

                break;
            }

            default:
                return Deny(AtomicSpendVerdict.UnsupportedGrantType, AtomicSpendDenialMap.Attestation,
                    $"Grantor type '{permission.GrantorType}' is not supported by the verifying boundary.");
        }

        // 15. Human oversight (verifier check 12).
        if (spend.RequiresHumanOversight && permission.GrantorType != PermissionGrantKind.Human)
        {
            return Deny(AtomicSpendVerdict.HumanOversightNotSatisfied, AtomicSpendDenialMap.Oversight,
                "Disposition requires human oversight and the presented permission is not a human grant.");
        }

        return new VerdictEvaluation { IsSatisfied = true, Verdict = AtomicSpendVerdict.Satisfied };
    }

    /// <summary>
    /// S4 two-outcome seam, COMPLETE outcome: the pending effect reaches its one
    /// terminal via the append-only terminal path (P1-C102/P1-C110). Never
    /// un-consumes, resurrects, or re-spends permission (D21/P1-C108) and never
    /// creates a second effect attempt (P1-C111).
    /// </summary>
    public bool CompletePendingEffect(TerminalReceiptInput input, out string? denialReceiptId)
        => _store.TryAppendTerminal(input, out denialReceiptId);

    /// <summary>
    /// S4 two-outcome seam, ROLLBACK-OF-PENDING-STATE outcome: pending accounting
    /// is resolved with no effect occurring — the reservation is quarantined via
    /// the P2A primitive (P1-C113) and the slot lease is left to expiry. Never
    /// un-consumes, resurrects, or re-spends permission (D21/P1-C108).
    /// </summary>
    public bool RollbackPendingEffect(string reservationId, DateTimeOffset quarantinedAtUtc)
        => _store.TryQuarantineReservation(reservationId, quarantinedAtUtc);

    // -------------------------------------------------------------------------
    // Grant-type specific checks (D6 lineage; human attestation)
    // -------------------------------------------------------------------------

    private VerdictEvaluation? EvaluateLineage(IPermission permission, DelegationChain? chain, DateTimeOffset nowUtc)
    {
        if (permission.DelegationChainId is null || chain is null)
        {
            return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.LineageTrustScope,
                "Delegation-lineage permission presented without its delegation chain.");
        }

        // R4 (class-a sweep): a malformed chain yields a typed lineage-family
        // denial — never a throw.
        if (chain.Links is null || chain.Links.Count == 0)
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.LineageTrustScope,
                "Delegation chain has no links.");
        }

        if (!string.Equals(chain.ChainId, permission.DelegationChainId, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.LineageTrustScope,
                $"Presented chain '{chain.ChainId}' does not match the permission's delegation_chain_id '{permission.DelegationChainId}'.");
        }

        var leaf = chain.Links[^1];
        if (!string.Equals(leaf.TenantId, permission.TenantId, StringComparison.Ordinal) ||
            !string.Equals(leaf.DelegateId, permission.SubjectId, StringComparison.Ordinal) ||
            !string.Equals(leaf.Scope, permission.EffectClass, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.LineageTrustScope,
                "Permission tenant, subject, or effect class does not match the delegation chain leaf it claims as lineage.");
        }

        // Compose DelegationChainVerifier — never re-implement its checks.
        var chainResult = _delegationChainVerifier.Verify(chain, nowUtc);
        if (chainResult.IsValid)
        {
            return null;
        }

        return chainResult.ErrorCode switch
        {
            DelegationErrorCodes.Revoked => Deny(AtomicSpendVerdict.Revoked, AtomicSpendDenialMap.LineageRevoked,
                $"Delegation lineage failed verification: {chainResult.Message}"),
            DelegationErrorCodes.Expired => Deny(AtomicSpendVerdict.Expired, AtomicSpendDenialMap.LineageExpired,
                $"Delegation lineage failed verification: {chainResult.Message}"),
            DelegationErrorCodes.ScopeViolation => Deny(AtomicSpendVerdict.ScopeMismatch, AtomicSpendDenialMap.LineageTrustScope,
                $"Delegation lineage failed verification: {chainResult.Message}"),
            DelegationErrorCodes.BindingMissing => Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.LineageTrustScope,
                $"Delegation lineage failed verification: {chainResult.Message}"),
            DelegationErrorCodes.BindingMismatch => Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.LineageTrustScope,
                $"Delegation lineage failed verification: {chainResult.Message}"),
            _ => Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.LineageTrustScope,
                $"Delegation lineage failed verification: {chainResult.Message}"),
        };
    }

    private VerdictEvaluation? EvaluateHumanGrant(IPermission permission, PermissionSpendRequest spend)
    {
        if (string.IsNullOrWhiteSpace(permission.IdpPrincipal) ||
            string.IsNullOrWhiteSpace(permission.IdpAssertionRef) ||
            string.IsNullOrWhiteSpace(permission.HumanSignature))
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.Attestation,
                "Human grant is missing idp_principal, idp_assertion_ref, or human_signature.");
        }

        if (spend.CanonicalEffectDescriptor is null || spend.CanonicalEffectDescriptor.Length == 0)
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.Attestation,
                "Canonical effect descriptor bytes are required to verify a human grant signature.");
        }

        var descriptorHash = Sha256Hex(spend.CanonicalEffectDescriptor);
        if (!string.Equals(descriptorHash, permission.EffectDescriptorHash, StringComparison.Ordinal))
        {
            return Deny(AtomicSpendVerdict.BindingMismatch, AtomicSpendDenialMap.Descriptor,
                "Canonical effect descriptor does not hash to the permission's effect_descriptor_hash.");
        }

        if (!_keyProvider.TryGetPublicKey(permission.IdpPrincipal!, out var publicKey) || publicKey is null)
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.Attestation,
                $"Public key for human grantor '{permission.IdpPrincipal}' not found in key provider.");
        }

        byte[] signatureBytes;
        try
        {
            signatureBytes = Convert.FromBase64String(permission.HumanSignature!);
        }
        catch (FormatException)
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.Attestation,
                "human_signature is not valid base64.");
        }

        // Class-a sweep: adversarial signature/key material yields a typed
        // denial — never a throw.
        bool signatureValid;
        try
        {
            signatureValid = Ed25519.Verify(spend.CanonicalEffectDescriptor, signatureBytes, publicKey);
        }
        catch (Exception)
        {
            signatureValid = false;
        }

        if (!signatureValid)
        {
            return Deny(AtomicSpendVerdict.SignatureInvalid, AtomicSpendDenialMap.Attestation,
                "Ed25519 human signature verification failed over the canonical effect descriptor.");
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Envelope non-authority (P1-C046-C052)
    // -------------------------------------------------------------------------

    private static string? DescribeEnvelopeForgery(
        PermissionEnvelopePresentation envelope,
        IPermission? permission,
        CanonicalConstraintProjection constraints,
        ISpendBoundaryRead? read)
    {
        // Envelope-only presentation: no canonical IPermission validation can
        // precede a spend, so the envelope can never spend authority (P1-C048).
        if (permission is null)
        {
            return "Envelope presented without a canonical IPermission; envelope bytes never decide (P1-C047/P1-C048).";
        }

        if (!string.Equals(envelope.PermissionId, permission.PermissionId, StringComparison.Ordinal))
        {
            return "Envelope permission identifier does not reference the canonical permission (forged/reissued).";
        }

        if (!string.Equals(envelope.DescriptorHash, permission.EffectDescriptorHash, StringComparison.Ordinal))
        {
            return "Envelope descriptor hash does not match the canonical permission (forged/widened).";
        }

        if (!string.Equals(envelope.ConstraintsHash, permission.ConstraintsHash, StringComparison.Ordinal))
        {
            return "Envelope constraints hash does not match the canonical permission (widened).";
        }

        if (!string.Equals(envelope.Audience, constraints.Audience, StringComparison.Ordinal))
        {
            return "Envelope audience does not match the canonical constraints binding (widened).";
        }

        if (!string.Equals(envelope.Nonce, constraints.Nonce, StringComparison.Ordinal))
        {
            return "Envelope nonce does not match the canonical constraints binding (forged/reissued).";
        }

        if (DateTimeOffset.TryParse(envelope.ExpiresAtUtc, out var envelopeExpiry) &&
            permission.ExpiresAt.HasValue &&
            envelopeExpiry > permission.ExpiresAt.Value)
        {
            return "Envelope expiry extends beyond the canonical permission (widened).";
        }

        if (envelope.RemainingUseProjection is long projected && read is not null)
        {
            var maxUses = EffectiveMaxUses(permission);
            var remaining = maxUses - read.CountSpends(permission.PermissionId);
            if (projected > remaining)
            {
                return "Envelope remaining-use projection exceeds the canonical permission (widened).";
            }
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static VerdictEvaluation Deny(AtomicSpendVerdict verdict, string code, string message) => new()
    {
        IsSatisfied = false,
        Verdict = verdict,
        DenialCode = code,
        Message = $"[{code}] {message}",
    };

    private static AtomicSpendVerdict StoreDenialKind(string? code) => code switch
    {
        // Strict, injective map for the store's frozen deny shapes only (R2):
        // every hook denial carries its typed verdict and never lands here.
        AtomicSpendDenialMap.Quarantined => AtomicSpendVerdict.ReservationQuarantined,
        AtomicSpendDenialMap.BudgetRaceLost => AtomicSpendVerdict.RaceLost,
        AtomicSpendDenialMap.Nonce => AtomicSpendVerdict.Replay,
        _ => throw new InvalidOperationException(
            $"Store produced an unrecognized denial code '{code}' outside the frozen deny shapes (P1-C071)."),
    };

    /// <summary>
    /// Full canonical presentation equality (R1): every recorded field a
    /// forged/widened variant can differ on must match — effect class, descriptor
    /// hash, attempt ordinal, task scope, permission, nonce, audience, expiry,
    /// policy version, lineage, identity hashes (attempt row), reservation
    /// reference and slot reference (pre-effect receipt), budget scope and
    /// amount/currency (reservation), and slot scope/index (slot claim).
    /// </summary>
    private bool IsSamePresentation(EffectAttemptRecord recorded, BeginEffectRequest request)
    {
        if (!string.Equals(recorded.PermissionId, request.PermissionId, StringComparison.Ordinal)
            || !string.Equals(recorded.EffectClass, request.EffectClass, StringComparison.Ordinal)
            || !string.Equals(recorded.DescriptorHash, request.DescriptorHash, StringComparison.Ordinal)
            || recorded.AttemptOrdinal != request.AttemptOrdinal
            || !string.Equals(recorded.TaskScopeKey, request.TaskScopeKey, StringComparison.Ordinal)
            || !string.Equals(recorded.Nonce, request.Nonce, StringComparison.Ordinal)
            || !string.Equals(recorded.Audience, request.Audience, StringComparison.Ordinal)
            || !string.Equals(recorded.ExpiresAtUtc, request.ExpiresAtUtc, StringComparison.Ordinal)
            || !string.Equals(recorded.PolicyVersion, request.PolicyVersion, StringComparison.Ordinal)
            || !string.Equals(recorded.LineageKey, request.LineageKey, StringComparison.Ordinal)
            || !string.Equals(recorded.SourceIdentityHash, request.SourceIdentityHash, StringComparison.Ordinal)
            || !string.Equals(recorded.EnvironmentIdentityHash, request.EnvironmentIdentityHash, StringComparison.Ordinal))
        {
            return false;
        }

        var receipt = _store.GetPreEffectReceipt(request.EffectId);
        if (receipt is null
            || !string.Equals(receipt.ReservationId, request.ReservationId, StringComparison.Ordinal)
            || !string.Equals(receipt.SlotId, request.SlotId, StringComparison.Ordinal))
        {
            return false;
        }

        var reservation = _store.GetBudgetReservation(request.ReservationId);
        if (reservation is null
            || !string.Equals(reservation.BudgetScopeKey, request.BudgetScopeKey, StringComparison.Ordinal)
            || reservation.AmountMinor != request.AmountMinor
            || !string.Equals(reservation.Currency, request.Currency, StringComparison.Ordinal))
        {
            return false;
        }

        if (request.SlotId is not null)
        {
            var slot = _store.GetConcurrencySlot(request.SlotId);
            if (slot is null
                || !string.Equals(slot.SlotScope, request.SlotScope, StringComparison.Ordinal)
                || slot.SlotIndex != request.SlotIndex)
            {
                return false;
            }
        }

        return true;
    }

    private static int EffectiveMaxUses(IPermission permission)
        => permission.UsePolicy == PermissionUsePolicy.SingleUse ? 1 : permission.MaxUses ?? int.MaxValue;

    private static string Sha256Hex(byte[] input)
        => $"sha256:{Convert.ToHexStringLower(SHA256.HashData(input))}";

    /// <summary>
    /// The in-boundary evaluation hook: the verdict pass and budget-capacity
    /// admission run inside the store transaction (P1-C107); step boundaries are
    /// forwarded to the request's observer (fault injection/observation).
    /// </summary>
    private sealed class BoundaryEvaluation : ISpendBoundaryEvaluation
    {
        private readonly AtomicEffectSpendTransaction _transaction;
        private readonly AtomicSpendRequest _request;

        public BoundaryEvaluation(AtomicEffectSpendTransaction transaction, AtomicSpendRequest request, BeginEffectRequest begin)
        {
            _transaction = transaction;
            _request = request with { Begin = begin };
        }

        /// <summary>R2: the typed verdict travels through the boundary — never reconstructed from codes.</summary>
        public (AtomicSpendVerdict Verdict, string Code, string? WinnerEffectId, string? LinkedReceiptId)? LastOutcome { get; private set; }

        public BoundaryDenial? Evaluate(BeginEffectRequest request, ISpendBoundaryRead read)
        {
            var verdict = _transaction.EvaluateVerdicts(_request, read);
            if (!verdict.IsSatisfied)
            {
                LastOutcome = (verdict.Verdict, verdict.DenialCode ?? AtomicSpendDenialMap.Attestation,
                    verdict.WinnerEffectId, verdict.LinkedReceiptId);
                return new BoundaryDenial(
                    verdict.DenialCode ?? AtomicSpendDenialMap.Attestation,
                    verdict.WinnerEffectId,
                    verdict.LinkedReceiptId);
            }

            // Budget-capacity admission (P1-C074/P1-C120): atomic inside the same
            // bundle; the GMF-NEG-023 budget race and the GMF-NEG-055 call-budget
            // race shape follow this same admission rule. True concurrent
            // admission losers record FLEET_DENIED_RACE_LOST with winner linkage
            // and zero excess effect.
            var budget = _request.Budget;
            if (budget is not null)
            {
                if (read.CountActiveReservations(request.BudgetScopeKey) >= budget.MaxActiveReservations)
                {
                    LastOutcome = (AtomicSpendVerdict.RaceLost, AtomicSpendDenialMap.BudgetRaceLost,
                        read.LatestActiveReservationEffectId(request.BudgetScopeKey), null);
                    return new BoundaryDenial(
                        AtomicSpendDenialMap.BudgetRaceLost,
                        read.LatestActiveReservationEffectId(request.BudgetScopeKey),
                        LinkedReceiptId: null);
                }

                if (budget.LimitMinor is long limit &&
                    request.AmountMinor is long amount &&
                    read.SumActiveReservationAmounts(request.BudgetScopeKey) + amount > limit)
                {
                    LastOutcome = (AtomicSpendVerdict.RaceLost, AtomicSpendDenialMap.BudgetRaceLost,
                        read.LatestActiveReservationEffectId(request.BudgetScopeKey), null);
                    return new BoundaryDenial(
                        AtomicSpendDenialMap.BudgetRaceLost,
                        read.LatestActiveReservationEffectId(request.BudgetScopeKey),
                        LinkedReceiptId: null);
                }
            }

            return null;
        }

        public void OnStep(SpendBoundaryStep step) => _request.StepObserver?.Invoke(step);
    }
}
