# GMF-P1 — Terminal, Receipt, and Settlement Freeze

- Parcel: GMF-P1 (spec `plugins/foreman-line/docs/specs/active/GMF-P1-effect-source-environment-evidence-contracts.md`, status `draft`).
- Observation window: 2026-09-16 (UTC).
- Worktree / branch / HEAD: `D:/Repos/agent-skills-worktrees/gmf-p1-contracts-20260916`, branch `codex/gmf-p1-contracts-20260916`, HEAD `74005ae9caa5c46e682775b7b2ece6809ce4b8a0` (= base `3ea16a2` + shaping commit).
- Governing-record SHA-256 (Step-0 verified 11/11 MATCH): charter `cfb1557b25e01d892daeb01fb94cf31869f963c3cdf4eb81043dbc05705b938e`; amendment `22d681f0fc8786fc501a555143d6f3687495457d67647207ecd479377170e501`; findings `b784ed7656294d19e887c3a221e5eb8354160bb3f647530e2d3c1519532bd5ff`; discovery `56affe5c3e77e8a260abe88df4cf5662b3ff541ff0c0a6525d193f018cfd9e2d`; loop-directive `9e2060e345f685907ac591162d59d5b8da6df0b209064401af352ce862aa7bf9`; SPEC-CONVENTION `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703`.
- P0 inputs (read-only): closure `5E1974A8…707E3E`; inventory `81206C57…AD03CD`; scenarios `F8BBEB1F…698549`; map `68E5BFF2…32ADA6`; threat `EF4D9409…93B8AC`.
- Author role: builder (GMF-P1 parcel builder). This file creates evidence and grants nothing.
- Mutation statement: this parcel creates exactly the seven `gmf-p1-*.md` files and modifies nothing else. Spec + shaping-result remain read-only.
- Prohibited actions: no product edits; no provider/model/MCP calls; no workload/container/WSL/VM; no network/install/credential/disclosure/spend/promotion/merge/deploy/publish/Gate-3; no edits to governing records/index/`model-fleet-v1`/P0 files/product repos.
- Vocabulary: RATIFIED / OBSERVED / INFERRED / GAP / DECISION_REQUIRED / HOLD / CARRIED / RESOLVED. Unresolved choices are DECISION_REQUIRED/HOLD/GAP, never silently selected.
- Evidence index: clauses `P1-C101–P1-C125` (part of single namespace `P1-C001–P1-C125`).

## Concurrence record (S1/S2 2026-09-16; DR-004(a) RESOLVED)

DR-004 contract half is RESOLVED option (a) in P1-C119 below (provider-authoritative; concurrence Clinton Morgan as `keon-systems` contract owner + goal owner, S1/S2); measurement/settlement implementation carried to P2C/P3B. Terminal/receipt *profiles* below are the ratified A1-D16 shapes. Error codes RESOLVED per DR-002 (P1-C071, canonicalization file); `BLOCKED_UNRATIFIED_ERROR_CODE` retired prospectively per P1-C072 (quoted in P0 history only). (RESOLVED DR-004(a); RESOLVED DR-002.)

## Frozen clauses — terminal profiles (A1-D16)

| ID | Frozen statement | Provenance | P0 anchor | NEG targets |
|---|---|---|---|---|
| P1-C101 | Seven-receipt-type rule: Fleet uses Keon's existing seven receipt types and lifecycle rules; Fleet states are profiles/payloads, never new receipt primitives. A new type requires a separately ratified contract amendment. | RATIFIED A1-D16 | CTR-015; B-009 | GMF-NEG-060, GMF-NEG-061, GMF-NEG-062 |
| P1-C102 | Terminal-completeness rule: every effect records a durable denial (pre-spend) or exactly one terminal outcome (post-spend). Missing terminals fail closed; success is impossible without the terminal. | RATIFIED A1-D16 | CTR-011/CTR-015; B-009 | GMF-NEG-061 |
| P1-C103 | Inference terminal set (closed): `denied` / `failed-before-send` / `sent-usage-pending` / `unknown-post-send` / `settled` / `adjustment-refund`. No other inference terminal exists. | RATIFIED A1-D16 | CTR-011; B-006/B-009 | GMF-NEG-011, GMF-NEG-016, GMF-NEG-018, GMF-NEG-019, GMF-NEG-022 |
| P1-C104 | Execution terminal set (closed): `denied` plus `bootstrap-failure` / `materialization-failure` / `manifest-failure` / `launch-failure` / `runtime-failure` / `termination-failure`. Each consumes the permission and terminates the whole tree with no retry under it. | RATIFIED A1-D16/A1-D5 | CTR-011; B-002/B-003 | GMF-NEG-001, GMF-NEG-002, GMF-NEG-003, GMF-NEG-010, GMF-NEG-025, GMF-NEG-026, GMF-NEG-042, GMF-NEG-043, GMF-NEG-044, GMF-NEG-045, GMF-NEG-046, GMF-NEG-047, GMF-NEG-048, GMF-NEG-049, GMF-NEG-050 |
| P1-C105 | Promotion terminal set (closed): `rejected` / `staged-to-isolated-ref` / `applied-to-isolated-ref` / `rolled-back-compensated` / `partial-ambiguous`. No merge terminal exists; staging evidence never authorizes merge. | RATIFIED A1-D16/A1-D15 | CTR-011/CTR-005; B-010 | GMF-NEG-027, GMF-NEG-029, GMF-NEG-038, GMF-NEG-039, GMF-NEG-040, GMF-NEG-041 |
| P1-C106 | Denial durability: pre-spend denials persist a denial receipt; post-spend failures persist terminal evidence. The spend ledger links replays/retries to their original terminal/denial records. | RATIFIED A1-D6/A1-D16 | CTR-010/CTR-011; B-009 | GMF-NEG-005, GMF-NEG-040, GMF-NEG-060 |
| P1-C107 | Atomic pre-effect commit (restatement): validation + consumption + attempt-record + reservation + slot-acquisition + pre-effect receipt + pending-effect state commit atomically under uniqueness/isolation. Persistence failure commits nothing and effects nothing. | RATIFIED A1-D6 | CTR-010; B-001/B-009 | GMF-NEG-023, GMF-NEG-024, GMF-NEG-055, GMF-NEG-060 |
| P1-C108 | Satisfied-spend-consumed rule: a satisfied spend is permanently consumed even when the effect fails, is ambiguous, or settles at zero. Recovery expires leases and reconciles state but never resurrects or re-spends permission. | RATIFIED A1-D21/A1-D6 | CTR-010/CTR-011; B-009 | GMF-NEG-005, GMF-NEG-016, GMF-NEG-039, GMF-NEG-040 |

## Frozen clauses — receipt profiles (CTR-015)

| ID | Frozen statement | Provenance | P0 anchor | NEG targets |
|---|---|---|---|---|
| P1-C109 | Pre-effect receipt fields (frozen list): effect identifier, descriptor hash, permission identifier, attempt ordinal (where applicable), reservation reference, slot reference (where applicable), audience/expiry snapshot, pending-effect marker. Persisted atomically with spend (P1-C107). | RATIFIED A1-D6 | CTR-010/CTR-015; B-009 | GMF-NEG-060 |
| P1-C110 | Terminal receipt fields (frozen list): effect identifier, terminal state (one of P1-C103–P1-C105), cost state (settled amount or explicit unknown/pending marker — see P1-C115), evidence-manifest hash, lineage (denial/attempt/settlement links). History is append-only; terminals are never rewritten. | RATIFIED A1-D16/A1-D6 | CTR-011/CTR-015; B-009 | GMF-NEG-018, GMF-NEG-019, GMF-NEG-061, GMF-NEG-062 |
| P1-C111 | Per-effect receipt binding: each receipt binds exactly one effect attempt; cross-attempt receipt reuse denies. | RATIFIED A1-D16 | CTR-015; B-009 | GMF-NEG-005, GMF-NEG-040, GMF-NEG-062 |
| P1-C112 | Conflicting-terminals rule (frozen): duplicate/conflicting terminal appends are rejected/detected; original terminal stands; history is never rewritten; conflict evidence persists. | RATIFIED A1-D6/A1-D16 | CTR-011/CTR-015; B-008/B-009 | GMF-NEG-062 |
| P1-C113 | Leaked-reservation rule (frozen): post-terminal surviving reservations are quarantined; budget is not reused until append-only reconciliation; reuse attempts deny; readiness fails while quarantine persists. | RATIFIED A1-D6 | CTR-010/CTR-011; B-009 | GMF-NEG-063 |
| P1-C114 | Forged-cost-evidence rule (frozen): worker/gateway-supplied usage/cost evidence that fails measured reconciliation is rejected; settlement remains reserved/pending; rejection evidence persists. The gateway never trusts worker usage claims. | RATIFIED A1-D13/A1-D6 | CTR-011; B-006/B-009 | GMF-NEG-064 |

## Frozen clauses — settlement contract (A1-D6/A1-D16; DR-004 RESOLVED(a))

| ID | Frozen statement | Provenance | P0 anchor | NEG targets |
|---|---|---|---|---|
| P1-C115 | Unknown-cost reservation rule (frozen): unknown cost stays reserved until append-only settlement, adjustment, or human resolution. Unresolved cost blocks overspend. No silent currency conversion. | RATIFIED A1-D6 | CTR-011; B-006/B-009 | GMF-NEG-018, GMF-NEG-019, GMF-NEG-020, GMF-NEG-021, GMF-NEG-064 |
| P1-C116 | Append-only settlement rule (frozen): settlement/adjustment/refund appends new evidence; it never rewrites the terminal or prior settlement. Ledger rewrite attempts are rejected. | RATIFIED A1-D6/A1-D16 | CTR-011; B-009 | GMF-NEG-018, GMF-NEG-019, GMF-NEG-062 |
| P1-C117 | Cutoff rule (frozen): the gateway enforces streaming/token/time/call ceilings with fail-closed cutoff; post-cutoff continuation is denied. Worker metering never overrides gateway measurement. | RATIFIED A1-D13 | CTR-004/CTR-011; B-006 | GMF-NEG-022 |
| P1-C118 | Pricing-drift rule (frozen): pre-send pricing-snapshot drift requires a newly bound descriptor/permission; zero attempts occur under the drifted snapshot. Currency deviation denies with no silent conversion. | RATIFIED A1-D13/A1-D6 | CTR-004/CTR-011; B-006 | GMF-NEG-020, GMF-NEG-021 |
| P1-C119 | DR-004 RESOLVED option (a) — provider records authoritative for cost/usage; gateway-measured evidence is corroboration only. Unknown cost stays reserved/pending until append-only settlement, adjustment, or human resolution (P1-C115–P1-C116 stand). Measurement/settlement implementation carried to P2C/P3B. Concurrence: Clinton Morgan as `keon-systems` contract owner + goal owner (S1 designation + S2 concurrence, 2026-09-16). | RESOLVED DR-004 | CTR-004/CTR-011; B-006/B-009 | GMF-NEG-018, GMF-NEG-019, GMF-NEG-020, GMF-NEG-021, GMF-NEG-064 |
| P1-C120 | Atomicity/race rule (frozen): spend + reservation + slot acquisition are atomic; budget/slot races admit exactly the valid set; losers deny with zero excess effect and zero overspend. | RATIFIED A1-D6 | CTR-010; B-009 | GMF-NEG-023, GMF-NEG-024, GMF-NEG-055 |
| P1-C121 | Promotion race/ambiguity restatement (frozen): at most one isolated staging mutation per target/CAS race; losers deny; partial/ambiguous applies keep permission consumed with rollback/compensation evidence and no merge. | RATIFIED A1-D15/A1-D16 | CTR-005/CTR-011; B-010 | GMF-NEG-038, GMF-NEG-039 |
| P1-C122 | Promotion replay restatement (frozen): terminal promotion permissions never re-apply; replays deny linked to the original terminal. | RATIFIED A1-D21 | CTR-005/CTR-011; B-010 | GMF-NEG-040 |
| P1-C123 | Foreman/reviewer non-acceptance restatement: worker JSON, gateway summaries, self-produced logs, and success status never constitute acceptance. Coordinator inspects artifacts; reviewers + offline verifier supply independent evidence. | RATIFIED charter Security gates | CTR-013/CTR-014; B-008 | GMF-NEG-061 |
| P1-C124 | Durable-store failure rule (frozen): where the receipt/pending-state write fails, the transaction commits nothing and effects nothing; the failure is noted outside the failed store path. | RATIFIED A1-D6 | CTR-010; B-009 | GMF-NEG-060 |
| P1-C125 | Scope statement: cost source-of-truth is RESOLVED option (a) in P1-C119 above; canonical encoding is RESOLVED option (a) in P1-C066 (canonicalization file); store direction is RESOLVED option (a) in P1-C093 (artifact file). A1-D6/A1-D13/A1-D16/A1-D21 texts are elaborated, never amended. | RATIFIED A1-D6/A1-D13/A1-D16/A1-D21 | CTR-010/CTR-011/CTR-015 (scope guard) | GMF-NEG-066 (guard) |
