# OPMEM-P0 review R3 (verification) — Seat B (adversarial security/evidence)

**Reviewed commit:** `69a34653` deliverables (brief committed after). **Route:** `openai/gpt-6.1-sol`, read-only tools, `--thinking high`. **Cost:** USD 0.4187. Verbatim output follows.

---

## VERDICT: REQUEST-CHANGES

## TRIAGE VERIFICATION
T-16: ENCODED — delivery-side events are non-occurrences; per-task recall influence deduplication and G-13/G-14 are required.
T-17: ENCODED — P1a/P1b now specify additive migrations and legacy visibility.
T-18: ENCODED — production registration, adapter exposure, and actual MCP discovery/invocation tests are assigned.
T-19: ENCODED — custody, isolation, rotation, and the non-deploying boundary are explicit.
T-20: ENCODED — first-dispatch suite baselines and regression-relative gates are required.
T-21: ENCODED — Runtime test-double evidence is distinguished from mandatory real-deployment evidence.
T-22: ENCODED — durable model/serialization files and PostgreSQL restart round trips belong to P2.
T-23: ENCODED — scoped record identity, authorization-bound operation fingerprints, current authorization checks, and N-20/N-21 are specified.
T-24: ENCODED — scoped exact-ID retrieval has its own tool; the legacy shard fetch is correctly classified.
T-25: ENCODED — served verification, trusted-key configuration, provisioning, and N-13 ownership are assigned.
T-26: ENCODED — tenant-bound hashed fallback filenames, confinement, and hostile path fixtures are required.
T-27: PARTIAL — rejection semantics are encoded, but the pinned receipt producer supplies neither `completed` nor authoritative target/result facts needed for the positive verification path.

## FINDINGS
### F-1 [blocker] Tenant-only admin authorization bypasses private role/profile metadata boundaries
- Claim at issue: `memory-boundary-contract.md` §2.1 Admin endpoint contract; `event-and-fixture-contract.md` §9 N-16; `follow-on-parcel-manifests.md` P1a.
- Reality/evidence: At `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Program.cs:201–272`, the admin read authenticates with `keon:mcp:list` and returns raw ingress payloads. `Spine/IngressSpine.cs:361–383` persists actor identity, argument hashes, resource scope, and purpose; `:429–437` exports decision/execution/outcome references. The required repair adds tenant ownership/filtering, but specifies no role/profile authorization for these rows and no separate administrative grant. A legitimate same-tenant caller possessing another role’s or live profile’s correlation ID can therefore retrieve private invocation metadata after satisfying every N-16 case.
- Why it matters: Excluding this endpoint from adapter routing does not remove its direct Gateway accessibility. P1a can implement the frozen tenant-only repair literally while retaining a role/live-profile bypass. This is distinct from the correctly addressed cross-tenant SQL/fallback defect.
- Required disposition: fix — **needs P0 rework** before P1a dispatch. Extend P1a’s ingress ownership and admin-read contract to enforce role/profile eligibility, or require a separately enrolled, explicit, audited governance-admin capability rather than ordinary list scope or broad operator project grants. Add same-tenant cross-role and operator/live-profile correlation-ID fixtures, including fallback reads and legacy rows.

### F-2 [major] Receipt existence cannot authenticate a claimed target or observed result
- Claim at issue: `memory-boundary-contract.md` §2.2 memory-event mapping; `event-and-fixture-contract.md` §2 rule 3 and F-13/F-14; `follow-on-parcel-manifests.md` P5a outcome-reference resolution.
- Reality/evidence: At `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Spine/IngressSpine.cs:429–451`, terminal status is `approved`, `denied`, or `error`, never `completed`; the persisted outcome contains receipt IDs but no action target or execution result. `Spine/IntentFactory.cs:24–37` stores resource scope/purpose, not the executed resource ID. `Tools/GovernedExecuteHandler.cs:90–120` returns approval for `decide_only` and separately returns an execution result when execution occurs. `Runtime/RuntimeClient.cs:130–133` constructs that result, but the terminal spine projection discards it.
- Why it matters: Literal T-27 verification cannot produce supported events from these receipts. Merely translating `approved` into `completed` would confuse permission with execution. Moreover, possession of an execution receipt does not establish the caller-supplied outcome status: without persisted target/result binding, a real receipt can be cited for an unexecuted branch or a contradictory success claim. F-13/F-14 test missing/denied references, not this valid-receipt substitution.
- Required disposition: fix — **carry-forward candidate for P5a shaping**, with an explicit producer-side amendment if needed. Persist and resolve an immutable invocation/target/execution/result chain; distinguish approved-but-unexecuted from completed execution; bind supported outcome fields to observed evidence rather than accepting the caller’s status. Require real-producer fixtures for `decide_only`, completed failure reported as success, and a valid receipt replayed against another branch/target or unauthorized profile.

## MISSING PIECE / SILENT COLLISION
none found
