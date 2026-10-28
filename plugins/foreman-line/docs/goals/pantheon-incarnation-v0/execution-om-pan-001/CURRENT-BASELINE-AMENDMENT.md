# OM-PAN-001 current Runtime baseline refinement

Recorded 2026-10-19 during P00, before any new plan-review send. This is a coordinator refinement within ratified intent and repositories. No host, account, access, spend, production effect or accepted residual risk is added. The sealed proposal and historical source pins remain unchanged. This addendum supersedes only the implementation-gap descriptions below.

## Actual bases and repository rules

Read-only GitHub API records in repository-rule-preflight establish Foreman main 64fb8949bf5134f96fda02df0d4f52ac291a6138, Runtime main 3da1a87f1519e1661b26059bfc773a446cc763f4, Cortex main 684785f220c066e8686e160eec2611c727582a00, and Gateway main 0e0878a5938ada21409e6e95ab8d2ea260c2f6b5. Pantheon remains empty. Recheck actual heads at dispatch and merge.

Initial Runtime inspection used local HEAD 2b6c75536f50f125155ee697446cec89f70f2fec. Remote main is 78 commits ahead. Preserve the complete compare response and four exact source blobs in runtime-baseline-3da1a87 with their SHA-256 manifest. No working files were reset or overwritten. The earlier claim that Runtime lacks durable authority/accounting storage is superseded. Current test sources are visible but this coordinator has not run them at the newer base.

Runtime main requires a pull request, strict Analyzer Enforcement (KEON005 on real Runtime source), and resolved conversations, including for administrators. Inspected rules require zero approving GitHub reviews. Foreman rulesets are disabled and effective main rules empty; mandate independent reviews and exact-head evidence remain required. No rule was changed or bypassed. Preserve exact 404 semantics rather than treating every failed query as an eligibility success.

## Reuse instead of duplicate authority

SqlitePermissionSpendLedger.cs now contains SqliteAuthorityAccountingStore, BeginEffectRequest, terminal/settlement records, and ISpendBoundaryEvaluation. TryBeginEffect commits consumption, unique effect attempt, reservation, concurrency slot, pre-effect receipt and pending state in one transaction. Append-only settlement and quarantine exist. ReceiptPersistenceServiceCollectionExtensions registers this store and the durable controlled-execution ledger when persistence is enabled.

Keon.Verify/AtomicEffectSpendTransaction.cs composes canonical permission, scope/binding, revocation, expiry, audience, nonce, policy, lineage and budget-capacity verification at the store transaction boundary. Idempotent replay returns existing records and must never trigger another effect. It explicitly performs no provider or process effect and is not wired into ExecutionDispatcher or the API host. This is reusable admission code, not live-actuator proof.

Preserve existing contracts and closed denial vocabulary. P02 composes current Runtime storage and verification. P03 adds the smallest authenticated coordination interface and owner/epoch, parent-cap and call-limit extensions needed by the mandate. Foreman kernel/lease/ledger packages may support scheduling and projections; their references do not grant admission. Permission, money and effect checks must share one transactional boundary in the primary Runtime authority service. Do not create a competing Foreman money authority or join two approving databases through optimistic assumptions.

The existing atomic budget option bounds active reservations in one scope. It does not itself establish cumulative total/bootstrap/parcel limits after settlement, attempt/call ceilings, currency scale or coordinator fencing. Require non-null conservative amounts and budgets, reject null profile hashes/incomplete bindings, count settled provisional exposure plus pending/unknown liability in every applicable parent ceiling, prevent overflow, and verify current owner epoch at the effect boundary. Shape any narrow store/read-interface extension into exact Runtime allowed files with two independent reviews.

Integrate ExecutionDispatcher/IPermissionSpendGate with AtomicEffectSpendTransaction without double consumption. A scoped composition consumes once, durably binds and reads back admission evidence, then invokes the eligible effect. Replaying an admission returns status/evidence only. Require a duplicate integration test proving at most one effect.

## Remaining work and holds

Current LaunchReadiness still refuses general launch. It acknowledges the durable store behind the persistence switch but the launch composition does not enable it. Mandatory signing/verification, authenticated caller identity, durable spine and receipt-chain continuity remain scoped composition work. Keep the general readiness refusal unchanged. Durable revocation restoration, effect-time fencing, restricted Docker launch, provider broker, result validation and completion still need executable evidence.

P01 remains workflow/contracts only and must reference current atomic-spend/accounting contracts. P02-P04 reuse these components and implement remaining composition, ownership/parent-budget checks and actuators. P05 closes bootstrap only after real readiness evidence. P06 uses current Cortex direct API; Gateway differs from the initially inspected checkout, so no Gateway patch is assumed necessary before current carriage inspection. This preserves the smaller direct access path.

Freeze a new plan packet revision containing this addendum and the four current snapshots. Preserve unsent R1/R2 records. Authority, account, limits and new-review purpose remain unchanged; no consumed review is replayed. Synthetic qualification is unaffected. Plan dispatch is held until the new exact pins pass independent checking.
