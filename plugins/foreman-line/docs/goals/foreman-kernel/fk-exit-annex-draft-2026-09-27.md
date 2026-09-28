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
| U1 backstop-independence evidence chain (protected verifier/workflow control, runner lifecycle identity, independent negative controls, evidence identities/retention, bounded unsupported outcomes) | FK-P18 production / FK-P19 verification / FK-P21 retention | NOT satisfied — §14 pre-FK-P18′ contract dependency stands (E7); concrete U1 choices still open |
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

## 6. Completeness rule

At goal exit, every row above is either (a) still listed as NOT satisfied with its follow-on-goal candidate named, or (b) promoted to satisfied only with on-disk evidence recorded before the claim. No row is silently dropped. RS-1.4 (f) + this annex are read together.
