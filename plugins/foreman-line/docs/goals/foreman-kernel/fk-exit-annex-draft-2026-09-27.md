# FK exit annex — draft skeleton (RS-2.3 binding content)

**Goal:** `foreman-kernel`
**Instrument:** RS-2.3 item 3 (ledger L7) — this annex is the binding content of the goal's final report for every obligation the reduced exit does NOT satisfy.
**Status:** DRAFT SKELETON, 2026-09-27 — updated at each parcel closure; finalized only at goal exit. Every row states what EXISTS vs what is NOT satisfied. Nothing here is ever claimed satisfied by RS-1.4 (a)–(f).

## 1. Deferred parcels (RS-1.1/RS-1.2; follow-on-goal candidates)

| Parcel | Original outcome | Deferral basis | Residual obligation |
|---|---|---|---|
| FK-P12 | Authorization policy engine (`authorizeAction`) | RS-1.1 (assurance-heavy tail; consumer FK-P16 deferred) | D3/D18 engine fragments; five refusal classes' golden negative vectors end-to-end |
| FK-P13 | Admission-protected control catalog | RS-1.1 | D3/D15/D17 control surface; authenticated capability admission |
| FK-P14 | Stateful image composition + operator lifecycle | RS-1.1 | INF-2/INF-3 stateful placement proof; INF-8 restore sequence definition |
| FK-P15 | Stateful restart + admission proof | RS-1.1 | INF-8 process-boundary recovery proof (restart, split-brain, stale CAS); INF-4 clean-room boundary |
| FK-P16 | Claude lifecycle adapter (shadow) | RS-1.2 (retarget P17′/P18′ to shipped surfaces) | D4/D7/D20 hook-adapter fragment; mediated span "inclusive of adapter" as originally defined |
| FK-P19 | High-confidence refusal enforcement promotion | RS-1.2 | D8/D11 promotion acts; five-class enforcement claim |
| FK-P21 | Exit evidence manifest + clean-room proof | RS-1.2 | INF-4 retained manifest/retention; INF-7 revision-bound corpus manifest binding; INF-6 baseline assembly; INF-8 limitations/revisit recording |
| FK-P20 | Second-host feasibility (Codex) | RS-1.2 — **DROPPED** | D20 second-host probe; recorded gap only unless a cheap probe is later justified |

## 2. Stranded obligations (RS-2.2 — named unmet at exit)

| Obligation | L5 carrier (original) | State at exit |
|---|---|---|
| INF-5 full D21 two-span/cold/deadline measurement at contract level | FK-P16 measurement + FK-P21 recording | **Partial only**: FK-P17′ measures on shipped surfaces (RS-2.2 retarget); §8 scenario 14 / full D21 evidence NOT satisfied |
| INF-8 process-boundary recovery + stale-authority-refusal proof | FK-P14/FK-P15 | NOT satisfied (contract fragments FK-P9/FK-P11 only) |
| INF-4 retained-evidence manifest, protected verifier identity, retention/retrieval | FK-P21 (+ FK-P18′ CI pieces) | NOT satisfied beyond FK-P18′'s in-scope CI backstops. Extension (FK-P17′ OQ-3 ruling 2026-09-28): the FK-P17′ harness evidence lives package-locally (`bypass-outage-harness/evidence/` paths) and dies on rollback — no retention destination exists; harness evidence rows carry the same NOT-satisfied status |
| INF-7 revision-bound corpus manifest binding | FK-P19/FK-P21 | NOT satisfied |
| INF-1/INF-2/INF-3/INF-6 residual assembly (matrix binding, exact-placement proof, measured build reporting, baseline assembly) | FK-P14/FK-P20/FK-P21 | NOT satisfied (named rows in §16 annotated per RS-2.2) |
| U1 backstop-independence evidence chain (protected verifier/workflow control, runner lifecycle identity, independent negative controls, evidence identities/retention, bounded unsupported outcomes) | FK-P18 production / FK-P19 verification / FK-P21 retention | PARTIALLY RESOLVED 2026-09-29 (owner selections recorded: `U1-contract-selections-2026-09-29.md` — evidence limits 64MiB/8MiB/256/depth16; 30min-per-attempt + 3 attempts/24h with durable clock; verifier = pinned protected workflow SHA, candidate-as-data, isolated jobs, producer status never the decision; retention = Azure Blob; **400-day minimum retention RATIFIED by owner 2026-09-29**). STILL NOT SATISFIED — the §14 pre-FK-P18′ contract dependency stands until: Azure resource selection + observed configuration, protected verifier workflow/custodian selection, live platform recheck (event/permissions/runner/attestation/trust-root), the FK-P18′ contract-interface assignments (schema/paths/invariants/refusal-classes/reason codes — bound by the ratified limits), and ONE fresh independent review closing findings |
| INF-8 RPO/RTO numeric objectives (extension per FK-P9 OQ-1 ruling 2026-09-28) | FK-P9 backup/restore mechanics | NOT satisfied — numeric recovery-point/recovery-time objectives remain an unresolved owner-policy gap; no objective claimed met (FK-P15 measures) |

## 3. §8 scenario gaps (RS-2.3 item 2)

Scenarios 5, 10, 13, 14: no exit demand under RS-1.4(e); evidence NOT satisfied and NOT claimed. Scenario 14 (D21 latency) rides the INF-5 row above.

## 4. Window-dependent work (RS-2.4)

- **FK-P2B** (D10 wiring fix in `mutation-scope-guard`/`dispatch/src/approval-cli`): un-dispatched; awaiting recorded windows (`fk-p2b-p3-window-request-2026-09-27.md`); D10 defect remains live in `mutation-scope-guard` until it lands.
- **FK-P3** (pure dispatch decisions + recorder adapters): queued behind RCM Window R + three-holder negotiation.

## 5. Known nits carried (not exit claims)

- Spec-linter `verification_class` prose-documentation gap (SPEC-CONVENTION §4 prose predates the frontmatter schema; frozen sibling surface).
- FK-P2 symlink-file fixtures: skip-and-record cases (OQ-5) named as FK-P18′-lane evidence obligations.
- S1 nit (re-review): `RepositoryReadRequest` naming looseness in F05.1 placement prose — accept-as-documented.
- **Grammar-pin KNOWN-GAP windows (two, both auto-closing):** FK-P2's `grammar-pin.test.ts` and FK-P17′'s SPEC-CONVENTION pin row both run three-state against `docs/SPEC-CONVENTION.md` — while the RCM-P2 schema-v0.4 delta stays uncommitted (sibling write set), both record `blocked: RCM-P2 schema-v0.4 delta uncommitted` and pass on the known-base `7ac31500…`; any third state fails closed. Named NOT-satisfied until the delta lands and the windows close.
- FK-P2 schema-patterns P3 residual (dual review L2-1): mid-string per-segment trailing dot/space (`a./b`) passes `compiled-scope.schema.json` though the compiler rejects it (`ENTRY_TRAILING_DOT_SPACE`) — accept-as-documented; full per-segment exactness in the schema is a named optional tightening.
- FK-P9 gap records (per its spec): file-symlink cases skip-and-record where privilege is unavailable (junction cases hard-fail otherwise) and CTRL-01 (real non-WAL filesystem refusal) is `blocked: no non-WAL filesystem in the test environment` — never counted passed; named as FK-P18′-lane evidence obligations.
- **Pin-integrity lesson (2026-09-28, FK-P17 F1):** three shaping-time pins bound stale/uncommitted sibling bytes and were corrected by coordinator amendment before code; the normative rule now in the FK-P17 spec ("uncommitted sibling state is never pinnable") applies to all future parcels' pin tables.
- **Legacy status-vocabulary mapping (FK-P9 amendment A1/A2 boundary, 2026-09-28):** databases carrying out-of-vocab `goals.status` rows REFUSE the 0002 migration fail-closed (STORAGE_MIGRATION_FAILED, DB stays v1, rows intact) — the old→new vocabulary mapping is FK-P10-class semantics, never silently rewritten. Any deployment with legacy rows needs a recorded mapping decision before migration; named NOT-satisfied until such a mapping exists (FK-P10 defines the engine vocab, not a legacy translator).
- **Survivor-path error-laundering residual (P3, FK-P9 A1/A2 closure review, 2026-09-28):** the CONC-03 harness's "harness failures never launder into STORAGE_IO_FAILURE" invariant held only via the abort-marker side channel on the survivor path (the thrown HARNESS_* error wrapped into STORAGE_IO_FAILURE{os-error} at the readAppliedMigrations boundary). **FIXED in A1c (`7e49b131`)** — HARNESS_*-branded seam errors now rethrow unwrapped (one guard clause); the invariant holds on both paths. Row retained as the lesson record (error laundering class).
- **Error-laundering class — third instance (FK-P10 dual review, 2026-09-28):** `wrapStorageFailure`'s non-StorageError fallback destroys contract-named loser refusals under load (IDEMPOTENCY_CONFLICT/STATE_REVISION_STALE/TRANSITION_PENDING_EXISTS surface as STORAGE_FAILURE{STORAGE_IO_FAILURE} when a transient substrate/OS error hits inside the transaction). Ruled direction (FK-P10 rework R2): survive transient lock/OS classes so the NAMED refusal fires; environment-class skip-and-record (FK-P17 pattern) only where survival is impossible. Class summary: three instances in three packages (hardcoded success signals; seam rethrow flattening; boundary fallback erasure) — every error boundary must preserve the true cause and the named outcome.
- **Watchdog reaps idle streams (2026-09-28, FK-P10):** the environment's worktree watchdog preserved (`12c1831`, pushed `origin/recovery/…`) then reaped an idle mid-chain worktree, destroying uncommitted work locally. Lesson in force: builders checkpoint-commit at each chain milestone so a reap costs nothing (adopted mid-recovery; the FK-P10 recovery then checkpoint-committed 4 milestones).
- **FK-P11 production corpus manifest (owner-supplied input; FK-P11 OQ-1 ruling, 2026-09-29):** the import engine consumes an INF-7 corpus manifest (exact paths + digests + named source revision); the shipped TEST manifest is synthetic. The PRODUCTION manifest — which real records are legacy state — is an owner-supplied run-time input and does not exist yet. Named NOT-satisfied until the owner supplies it; the engine makes no claim about production corpus identity.

## 6. Completeness rule

At goal exit, every row above is either (a) still listed as NOT satisfied with its follow-on-goal candidate named, or (b) promoted to satisfied only with on-disk evidence recorded before the claim. No row is silently dropped. RS-1.4 (f) + this annex are read together.
