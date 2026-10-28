# Concrete governance execution path

## Components to reuse

Source observations are pinned in EVIDENCE.md; line numbers refer to the inspected working source, not a claim of clean release builds.

| Responsibility | Existing component | Required composition/gap |
|---|---|---|
| Standing grant and constraints | `keon-systems/src/Keon.Contracts/Authority.cs:6`, Runtime `Authority/AuthorityService.cs:9` | Project the actual ratified mandate into existing tenant/actor/capability/constraint/expiry contracts. Owner authority must be ingested through a trusted host ceremony, never agent-authored `accepted:true`. |
| Policy and sealed decision | Runtime `Decisions/DecisionEngine.cs:180–211`, Contracts `Authority/AuthorityBinding.cs:14` | Bind permission ID, permission receipt, delegation chain, permission hash and canonical effect hash. Configure real authority binding, policy and durable spine before sealing. |
| Pre-effect enforcement | Runtime `Execution/ExecutionDispatcher.cs:67,83–110,358–368,437`; Contracts `Authority/IPermissionSpendGate.cs:15` | Dispatcher requires permission spend gate and persists/read-backs spend evidence before handler. A handler failure does not restore consumed use. Reuse this barrier. |
| Expiry/revocation/use validation | `Keon.Verify/PermissionSpendVerifier.cs:127`, `RuntimePermissionSpendGate.cs:82` | Exact tenant/subject/effect/constraints/expiry/revocation/use checks exist. Durable revocation replay/propagation still needed; process-local revocation registry is insufficient after restart. |
| Durable use/receipt/outbox | Runtime `Observability/Persistence/SqlitePermissionSpendLedger.cs:101`; DI `ReceiptPersistenceServiceCollectionExtensions.cs:33–74` | SQLite use ledger serializes count/insert; durable receipt/outbox registrations exist. Assert concrete resolved types and durable chain continuity; no in-memory fallback. This is not the monetary ledger. |
| Goal custody | Foreman `kernel-state`, `kernel-lease` | Reuse events, leases, CAS and cursors, but add authentic grant validation and effect-side fences. Reference-shape checks alone accept fabricated references by design. |
| Money and call admission | Foreman `dispatch/src/pmc-launch/ledger.ts:101`, controller `:1101` | Reuse atomic reserve/consume/settle/no-send cancellation and uncertain liability model. Extend parent goal/parcel/attempt accounting and trusted settlement; do not make Kompress billing authority. |
| Model/provider transport | Foreman `owned-https-sender.ts`, stream parser and prepared direct-review prototype | Existing production Pi terminal unconditionally refuses. Add the Pantheon-purpose terminal with authentic admission, fixed qualified endpoint and no retry. Do not rebrand offline OPMEM prototype as production. |
| Gateway/SDK access | Gateway `Tools/GovernedExecuteHandler.cs:34–99`, `Auth/JwtValidator.cs:30`; SDK `IRuntimeGateway.cs` | Supported seams. Initial proof uses authenticated direct Runtime integration to reduce gateway work; SDK Execute retries must be disabled until durable idempotency/status reconciliation is implemented. |
| Memory | Cortex `api.py:792,1157,1464,1613,1917,2050`; tenancy `scope.py:217,413` | Real PostgreSQL ingest/recall exists. Use authenticated scope carriage and actual `/v1/shards`, `/v1/recall` routes. Gateway CortexClient currently lacks role/profile/session/task headers. Separate bridge defaults to incompatible `/v1/memory/*`. Add bounded conformance adapter; no new memory store. |

## Existing API is not an admitted host

`Keon.Runtime.Api/LaunchReadiness.cs:43–70` explicitly blocks launch for missing durability, receipt/outbox/spine, signing, chain continuity and authenticated identity. `Program.cs:81–87` invokes that guard; `:123` uses NoOpBudgetEvaluator, `:269–273` rejects idempotency keys, and `:299` uses sample policy. Controlled launch handler is a ledger append, not Docker or provider dispatch. `IExecutionBudgetEvaluator` is explicitly soft/diagnostic; failure does not block execution. Do not wire a reservation check into that interface and call it enforcement.

Build a restricted **Pantheon development host** in the Runtime repository using the existing engine/dispatcher/verifier and durable registrations. It is not a new policy engine. Its startup gate asserts authenticated identity, trusted mandate, required fields, persistent spend/decision/execution/outbox/chain stores, signing/verifier configuration, durable revocation, hard monetary admission and only the named handlers. Preserve the general API launch refusal and all unrelated production refusals. The proof is valid only for this host/configuration.

## Dispatch transaction and enforcement sequence

1. Coordinator holds a valid lease and proposes an immutable `DispatchIntent` (application envelope around existing Runtime contracts): goal/parcel/job/attempt IDs, full session/host/tenant/actor identity, mandate/policy/spec hashes, source/base head, workspace/image digest, role, exact requested paths/tools/network, provider/account/model profile, input hash/size/output cap, cost reservation basis, deadline and epoch. Required-field validation rejects missing tool lists and estimates; current generic constraint evaluator otherwise permits some absent values.
2. Transactional admission service on A authenticates the coordinator, checks current lease/mandate scope, validates fresh registry/account evidence, reserves goal+parcel+attempt liability and global call slot in one transaction, and records `prepared`. Reservation facts are signed/bound evidence, not an authority grant.
3. Runtime evaluates the exact intent against owner-issued standing authority, policy and reservation evidence. It emits a sealed durable decision or explicit deny with policy/authority references. Coordinator consumes it; it cannot edit it. A deny releases a never-consumed reservation only with trusted no-send evidence.
4. Runtime execution dispatcher retrieves/verifies the stored decision, requires the matching authority binding, consumes a permission use and persists/read-backs spend evidence. A trusted terminal verifies reservation/attempt/epoch again and atomically marks the effect begun. Only then may the narrow handler launch a worker or send a provider request. Any crash between stages leaves a conservative consumed/held state, not permission to resend.
5. Host broker alone holds Docker, provider and merge capabilities. Workers cannot reach sockets, secret mounts or general host shells. Each subsequent tool/provider call is independently bound to the parent job and remaining allowance, receives a new attempt ID, and passes the same admission checks. No worker delegates outside the broker.
6. Result ingestion binds authentic worker/job/attempt/epoch to source head, artifacts, test commands/counts/exits, raw response hash, model/request ID and usage provenance. Store results before acknowledging the completion event. Duplicate events are harmless. A worker's “done” claim is not acceptance.
7. Independent verifier runs deterministic checks on the exact result/head in a separate read-only input environment. Reviewer returns the substantive contract in BOOTSTRAP.md. Coordinator triages evidence and requests bounded rework. Its reproduction can adjudicate a finding but cannot replace independent review.
8. Merge is a separate admitted effect with exact source/base head, required checks/reviews, closed findings and authenticated repository actor. Changed head invalidates acceptance. Closure records commit/PR, evidence manifest, accounting state and remaining limitations. Cortex receives memories and references via a transactional outbox.

No cross-database two-phase commit is claimed. Ordering is conservative: budget reserve → sealed decision → permission-use spend → begin effect. A crash may consume permission without an effect; it must never produce an effect without permission. Unknown states preserve liability. Fresh authority for a replacement is distinct and bounded; it is never a recycled consumed receipt.

## Admission and isolation tests required before general dispatch

| Concrete failure prevented | Automatic mechanism | Acceptance evidence |
|---|---|---|
| Worker/coordinator forges authority | Trusted signature/message-source validation; sealed exact hash | Tampered grant, forged receipt and mismatched effect all deny before process/socket creation |
| Lease expires or owner revoked | Service epoch/expiry at effect begin and each tool call | Old session denied after successor CAS; local stop <=5s; remote unknown recorded |
| Parallel overspend | Atomic parent/child reservation + call slot | Concurrent $ requests cannot exceed available liability; one paid send in flight |
| Provider timeout causes double charge | Durable attempt claim and no automatic resend | Crash/drop at each write stage yields at most one POST; unknown retains reservation |
| Child bypasses scope via shell | Container boundary + path/egress broker + patch whitelist | Forbidden host path/socket/credential/network test denied; symlink/escape patch refused |
| Malformed/empty review is counted as green | Structural contract + substantive evidence check | Empty/thinking-only/truncated/wrong-hash/wrong-model review fails; real text/verdict required |
| Memory recall grants rights | Memory records are input only; authority service separately verifies | Malicious recalled `approved` text cannot alter grant/budget/lease |
| Runtime outage treated as permission | Fail-closed admission port | Offline analysis proceeds; send/launch/merge counters stay zero |

A container shares a kernel with other containers inside its Docker runtime. Docker Desktop WSL2 adds a VM boundary against Windows, not separate VMs per worker. The initial probe verifies selected controls only. See [Docker Engine security](https://docs.docker.com/engine/security/) and [WSL2 backend](https://docs.docker.com/desktop/features/wsl/). The product must report `isolation=container-on-vm-backed-runtime`, not `guest-vm`.

## Memory and provenance

Cortex owns durable knowledge, bounded context, decision narratives, reusable outcomes and artifact references. The authority service owns lease CAS, budget reservations, attempt uniqueness, permission use and effect status. Cortex's transactional ingest does not imply the same transaction encompasses spend or leadership. Queued projection is visible; a memory outage is not evidence loss because the transactional outbox holds the record. A receipt reference in memory is verified through its issuer before use.

Minimum provenance: owner grant hash/source; coordinator/worker/reviewer full IDs and provider relationship; lease epoch; spec/source/image/config/route/account hashes; Runtime decision/execution/spend IDs; provider request/message IDs; artifact and raw-result hashes; test environment/commands/counts; merge head/PR/check run IDs; accounting category; timestamps and uncertainty flags. Never place credentials or hidden reasoning in these records.
