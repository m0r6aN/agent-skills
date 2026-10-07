# HCS Stage Zero — claim, FK reconciliation, and landing map — 2026-09-26

**Goal:** `hierarchical-coordination-sidecars`
**Prepared:** 2026-09-26, owner-directed completion wave (`HcsStageZero` builder slice of the
coordinating session)
**Purpose:** Record the coordinator claim; reconcile the A3 proposal (and the charter's
"must reconcile live foreman-kernel FK-P0 Gate-3 state" condition) against the live FK seam
state of 2026-09-26; map every HCS parcel to its landing seam in the reconciled FK owner;
mark stale A3 assumptions with evidence; carry the open questions left by P0 shaping.
**Authority basis:** coordinator decision 2026-09-26 under owner blanket authority. This
document performs record-level reconciliation only: it merges nothing, transfers no
ownership, edits no Foreman Kernel file, and fabricates no human approval.
**Cross-references:** [`charter.md`](charter.md),
[`source-proposed-amendment-A3.md`](source-proposed-amendment-A3.md),
[`gate-1-ratification-2026-09-26.md`](gate-1-ratification-2026-09-26.md),
[`loop-directive.md`](loop-directive.md),
[HCS-P0 shaped spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md),
[`fk-reconciliation-2026-09-26.md`](../foreman-kernel/fk-reconciliation-2026-09-26.md),
[`fk-p0-canon-authority-enforcement-registry.md`](../foreman-kernel/fk-p0-canon-authority-enforcement-registry.md).

## 1. Claim record

| Field | Value |
|---|---|
| Goal | `hierarchical-coordination-sidecars` |
| Root owning coordinator | the coordinating session of the 2026-09-26 owner-directed wave; one root owner, unsplit (charter D2) |
| Claim executed by | `HcsStageZero`, delegated builder slice of that coordinating session (task/session id `HcsStageZero`) |
| Claimed at | 2026-09-26 |
| Authority basis | coordinator decision 2026-09-26 under owner blanket authority (coordinator decision receipt — not a human approval) |
| Prior state | `awaiting_coordinator_claim` (no other live owner named in `loop-directive.md`; stop condition not triggered) |
| Claim marker | [`loop-directive.md`](loop-directive.md) ownership block updated this date |

**Anchor verification (intake queue step 2), performed 2026-09-26:**
`source-proposed-amendment-A3.md` recomputed SHA-256 is
`a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695`, identical to the digest
pinned in `charter.md`. The source anchor holds; both files were read completely, including
the full D23–D25 proposed text.

**Execution locus (recorded deviation).** The intake directive asks for pickup "from a
dedicated goal worktree … Do not run either queued goal from the shared registration
worktree." This wave runs in the shared registration tree at the owner's explicit 2026-09-26
direction. The deviation is records-only (goal directory plus one shaped spec), follows the
precedent of `fk-p0-canon-authority-enforcement-registry.md` §9 GD-2, and is recorded as a
coordinator decision receipt in §5 (GD-1), not silently absorbed.

## 2. Live FK seam state — discharge of the charter's FK-P0 Gate-3 reconciliation condition

The charter requires this goal to "reconcile that live state before editing any Foreman
Kernel charter, branch, worktree, or owned serialization point," and the intake material
places FK-P0 "at human Gate 3." Reconciled state on 2026-09-26 (evidence: the two FK records
named above, both produced by owner-directed read-only reconciliation earlier this date;
facet checks re-measured by this slice):

| Facet | Live state | Evidence |
|---|---|---|
| FK-P0 record level | **Complete** in the live tree 2026-09-26: reconciliation + constraint taxonomy (10 classes) + operation authority matrix (14 rows) + standing-rule inventory (42 rules) | `fk-p0-canon-authority-enforcement-registry.md` §7 "Satisfied" rows |
| FK-P0 code level | Accepted R30 (`c35ff72`) / R31 (`1747c1d`, 751/751) but **Gate-3-pending**: `R31-PR-MATERIAL-20260908.md` prepared 2026-09-08 (`947e6f1`) and **unsubmitted**; `authority-registry/` exists only on unmerged branches | FK registry §8; reconciliation rows 2–3 |
| FK branches | Pending the **human Gate-3 merge** — the only path by which `authority-registry/` enters the live tree; after merge, the merged package wins over the docs registry on divergence | FK registry §8 seam rule; reconciliation §3 |
| FK-P1+ | **Not started.** FK-P1 Stage A shaped but unimplemented; FK-P1+ dispatch deferred (GD-3 there) | FK registry §8, §9 GD-3 |
| FK owner-of-record | **Unreconciled** (branch coordinator observed idle, not transferred); a recorded handoff is a prerequisite for FK-P1+ dispatch | reconciliation rows 16, §3 |
| FK authority set | Standing Gate 2 for FK-P0–FK-P21 (void for locked-decision changes, external-effects widening, or missing exact `Allowed Files`); **Gate 3 human-owned, not delegated** (authority basis: FK charter §10 / D9; owner blanket authority does not delegate Gate 3) | FK registry §1; live FK charter lines measured 2026-09-26 |
| FK charter's own A3 disposition | "This kernel release creates neither hierarchical commissioning nor a distributed execution fabric by implication. **HCS's A3 proposal is not imported as ratified authority. Preserve neutral kernel contracts for those future consumers** without assigning this goal their implementation work." | live `foreman-kernel/charter.md`, measured 2026-09-26 |

**Condition disposition: reconciled.** FK-P0's Gate-3 state is record-level complete with the
code seam Gate-3-pending and unmerged. Therefore HCS proceeds at record level only and edits
no FK charter, branch, worktree, or owned serialization point until the safe sequence of
§3.1 is satisfied. The FK charter's preservation clause means the coordination seam is
deliberately held open for HCS: no ownership transfer is required to proceed with HCS
canon/records work, and none is requested.

## 3. A3 reconciliation against the live FK state

### 3.1 Landing disposition and safe sequence (charter condition)

A3 targets `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` (amendment A3.1–A3.8:
D23–D25 into §4, a new §5.1, a §7 deferral bullet, §11 stop conditions, a §13 item 8, and a
§4.1 ledger row). The charter forbids editing any FK charter/branch/worktree/serialization
point before reconciliation and "a safe sequence or explicit ownership transfer," and states
"this charter creates neither." The reconciled safe sequence — the binding landing rule for
A3 — is:

1. **A3's coordination contract is carried in HCS canon now**, as the design baseline of
   charter D1–D7 (Gate 1 record: `gate-1-ratification-2026-09-26.md`). A3 text itself remains
   a **proposal**; nothing in HCS may cite it as ratified FK authority.
2. **FK-canon transcription (A3.1–A3.8) is deferred** to HCS-P7's "lands the ratified seam in
   its reconciled owner" step (or a named FK amendment) and requires all of:
   (a) a recorded FK owner-of-record handoff (reconciliation row 16);
   (b) the human FK Gate-3 merge resolving the `authority-registry/` seam (FK registry §8);
   (c) a fresh repo-wide decision-row re-sweep immediately before transcription, as A3 itself
   mandates; and
   (d) the FK owner's scoped Gate-1 disposition of the amendment at its re-anchored targets
   (§3.3 row 4).
3. **HCS-P0 through HCS-P6 edit no FK file.** Any required FK edit is a stop-and-escalate
   event, not an implementation detail (charter stop conditions).

### 3.2 A3 open question — "whether decision work reuses FK-P10's lease primitive"

A3 lists this among its deliberately unresolved implementation choices, to be decided in
shaping. Reconciled against the live FK state:

- **The seam rule already constrains the answer.** FK-P10 ("Lease and transition engine")
  owns trusted lease time, CAS revisions, principal/operation/idempotency binding,
  transactional event/state updates, and legal transition invariants. The FK operation
  authority matrix admits SQLite ledger writes (events, leases, revisions, projections) to
  the **lease/transition engine only** (D14: single-writer leases, CAS revisions, idempotency
  bound to input digests), and D2 makes SQLite authoritative for revision, lease, pending
  transition, wakeup/handoff, evidence index, and projection cursor. INF-8 adds "add no
  competing recovery authority primitive."
- **FK-P10 does not exist yet in the live tree** (FK-P1 not started; the accepted code seam is
  Gate-3-pending). A3's question therefore cannot be settled by reuse today.
- **Reconciled disposition (carried into HCS-P1 shaping, not decided here):** reuse of the
  FK-P10 lease primitive is the only seam-compatible default. An HCS-owned second
  lease/durable-decision-state primitive would create a competing state writer against D14,
  the §3 authority matrix, and INF-8, and would require a named, ratified amendment to the FK
  authority matrix — a Gate-1-level decision change, not a design choice. HCS-P1 contracts
  must therefore name the FK-P10 lease/transition ABI as their seam and fail closed without
  it (or carry a named refusal-semantics gap); they may not shim around it with a private
  primitive. Sequencing options for HCS-P2/P3 (which need lease/admission state for edge
  lifecycle and scheduler frozen inputs): implement after FK-P10 lands, or ship with explicit
  refusal semantics — to be named in the Gate 2 request and plan review.

### 3.3 Stale A3 assumptions — marked with evidence

| # | A3 assumption | Status 2026-09-26 | Evidence |
|---|---|---|---|
| 1 | Anchor: FK charter `c1935937…`, 435 lines, in the `codex/foreman-kernel-stage0-20260830` worktree (verified 2026-09-03) | **Stale as a live anchor** | Live `foreman-kernel/charter.md` measures **808 lines**, SHA-256 `94d974b80dbc61066e0c135a710e5fe695654df298fd5e7b63696706ca3b6cb7` (measured 2026-09-26); consolidation landed 2026-09-14 (`8b3733b`, PR #22) per reconciliation row 13 |
| 2 | "the §4 decision table through **ratified D21**" | **Stale/incorrect for live canon** | Live decision rows are **D1–D20 only** (measured 2026-09-26; FK registry §4b inventories D1–D20); the recovered A1's "D21" is **not ratified** into the live charter (reconciliation §2: "No decision ID is assigned here"). The D23–D25 reservation still holds — today's re-sweep found no FK decision row after D20 — but transcription must preserve the D21–D22 gap as drafting provenance (A3: "Do not renumber or reuse D22") and must not credit "ratified D21" as canon |
| 3 | Target: "`charter.md` in the `codex/foreman-kernel-stage0-20260830` goal worktree" | **Stale locus** | The worktree exists but has not been the active work locus since 2026-09-07; later FK work lives on `codex/fk-p0-*`, `codex/foreman-kernel-unattended-20260907`, `codex/foreman-kernel-resume-20260908` (reconciliation row 1). The exact landing target is HCS-P0's own outcome (charter P0 row) |
| 4 | Section anchors "§4.1 Ratification ledger" (A3.8) | **Stale numbering** | The live charter carries the ratification ledger at **§17 "Source record and ratification ledger"**; A3's other anchors verified present at the same numbers (§4 locked decisions, §5 first-release architecture, §7 explicitly-not-doing, §11 stop conditions, §13 Gate 1 decision list) — all measured 2026-09-26. A3.8 must re-anchor at transcription |
| 5 | "loop-directive.md … names a different live owning coordinator and places FK-P0 at human Gate 3" | **Stale as a current-state claim** (accurate as a dated 2026-09-03 observation) | The live FK goal directory contains **no** `loop-directive.md` (measured 2026-09-26; reconciliation row 10); FK-P0 has since advanced past the Gate-3 package to R30/R31 accepted (2026-09-07), Gate-3 PR material prepared-but-unsubmitted (2026-09-08), and record-level execution (2026-09-26). The live FK charter itself warns: "Those are dated observations, not today's queue. Never restart FK-P0" |
| 6 | "FK-P0–FK-P21 remain unchanged. Implementation requires a separately ratified follow-on goal" | **Not stale — corroborated** | No FK parcel-graph change found; FK registry §9 GD-3 defers FK-P1+; the live FK charter states A3 "is not imported as ratified authority" and creates no hierarchical commissioning by implication. This HCS goal is that separately ratified follow-on |
| 7 | A3 status "PROPOSED — not ratified, not in force" (A3.8 ledger unfilled) | **Not stale** | No A3 ratification record exists in the live tree; A3.8 requires an exact developer ratification statement, and none has been issued. HCS Gate 1 ratifies the HCS design baseline (D1–D7), not A3's FK-canon transcription |

### 3.4 Open questions carried out of P0 shaping (charter underspecification)

The charter defines P0's outcome ("maps current goal ownership, kernel contracts, state
authority, queue mechanics, active serialization points, and the exact landing target for
A3") but not its artifact shape or exact path binding. Per the shaping rule, the smallest
faithful scope is shaped ([HCS-P0 spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md):
one map record plus one verification record) and the questions below are recorded here
rather than answered by invented scope:

1. **Exact path binding for "the landing target for A3."** Stage Zero §4 maps parcels to FK
   *seams*; the module/canon path binding (e.g. which package carries HCS-P1 contracts, where
   the scheduler sidecar lives) is P0's output and is not fixed here.
2. **Where HCS implementation code lands** — a new `plugins/foreman-line/` package versus
   extension of merged FK packages — depends on the FK Gate-3 merge outcome and P0's map.
   A3 also leaves "the exact follow-on parcel graph and prove-out repository" deliberately
   unresolved; the charter's P0–P7 graph is reshaped at row level (§4) but the prove-out
   repository remains open for the Gate 2 request and plan review.
3. **Dedup rule between this record and P0 execution.** P0 execution consumes this document
   and the FK records as inputs; it must not re-litigate §2/§3 dispositions. Its map adds
   evidence-bound specifics (per-item locators, digests, commands) and the §1 path binding.
4. **FK-P10 lease question** — reuse-or-amend disposition (§3.2) recorded; the contract
   decision belongs to HCS-P1 shaping.
5. **A3's deliberately unresolved choices → owning parcels** (not decided here): sidecar
   topology (in-process/worker/container/remote) → HCS-P3/P4 shaping; scheduler total
   ordering keys → HCS-P1 (scheduler-input contract) with HCS-P3; capacity allocation
   (quotas vs backpressure) → HCS-P3; physical receipt/evidence index → HCS-P5 (note: D2
   already binds the evidence index to SQLite operational state — FK-P9/FK-P10/FK-P11 seam);
   adjudicator count/model grade → HCS-P4; retry/timeout/crash-recovery/pool-sizing policy →
   HCS-P4/HCS-P6.

## 4. Landing-seam map — HCS-P0–P7 in the reconciled FK owner

Each charter parcel mapped to the seam it lands on in the FK state reconciled in §2. Status
legend: **live** (present in the live tree), **Gate-3-pending** (accepted, unmerged), 
**unstarted** (contracted in the FK charter graph, not begun).

| Parcel | Landing seam in the reconciled FK owner | Seam status | Preconditions / notes |
|---|---|---|---|
| HCS-P0 — Authority and collision reconnaissance | FK-P0's docs registry (`fk-p0-canon-authority-enforcement-registry.md` §1–§6) and `fk-reconciliation-2026-09-26.md` as the kernel-contract, state-authority, and serialization-point source; FK owner-of-record row 16; contested-surfaces list (reconciliation §3) | live | Records only; consumes §3.3 deltas; no FK edit (GD-2) |
| HCS-P1 — Coordination contracts | FK-P1 "Lifecycle, admission, and decision contracts" seam: versioned schemas, refusal codes, digests, assurance levels, golden vectors (D17; registry class H). Disjointness contracts over declared files/contracts/serialization points draw their mechanical vocabulary from the FK-P2 spec-body compiler's exact-path authority (registry class A, D10) | unstarted (FK-P1 Stage A shaped only) | Versions independently in HCS canon (A3 D23–D25 as design baseline); converges on the FK-P1 seam without editing FK files until §3.1 is satisfied; decides the §3.2 lease question |
| HCS-P2 — Delegation and edge lifecycle | FK-P10 lease/transition engine (edge lifecycle = legal transition invariants; single-root/double-ownership refusal = registry class E, `OWNER_LEASE_MISMATCH`-family refusals) + FK-P2 class-A disjointness predicates + FK-P12 `authorizeAction` admission | unstarted (FK-P10 contracted) | §3.2 reuse-or-amend rule binds; needs FK-P10 ABI or named refusal-semantics gap |
| HCS-P3 — Deterministic scheduler sidecar | Coordinator-local queue per A3 D24; frozen inputs read from FK-P9/FK-P10 state at named revisions (lease/admission state) and FK-P11 projections; policy version from the class-D policy digest binding | unstarted | No shared scheduler (charter D4, A3 D24); reads via the FK-P13 control catalog only; no global queue inference from kernel observability |
| HCS-P4 — Stateless adjudicator sidecar | All durable facts through admitted kernel contracts — FK-P1 contract receipts (D5/D6, structural labels only, registry class H/J), FK-P13 control catalog; independence at principal/occupancy level per A3 D25 → INF-4 verification-independence seam (FK-P5/P8/P15 clean-room proofs, FK-P21 manifest) | unstarted | Pool membership confers no separation; no private durable authority state |
| HCS-P5 — Structural roll-up resolver | Canonical evidence index = SQLite operational state per D2 (FK-P9 storage, FK-P10 references, FK-P11 projections/cursors), resolved per A3 D25's bounded structural verification; D17 refusal codes for mismatch/unresolvable/domain-escape/envelope-version | unstarted | Physical index form is A3-unresolved → HCS-P1/P5 shaping (§3.4 item 5) |
| HCS-P6 — Collision, crash, and restart proof | FK-P10 refusal classes (double-lease, stale CAS); FK-P15 stateful restart/admission proof patterns (split-brain refusal; INF-8: restore must not silently restart dispatch, no competing recovery primitive); FK-P18 CI backstops (D13); class-F detected-only enrollment | unstarted | Reuses FK proof patterns and refusal vocabularies; does not duplicate FK-P15's scope |
| HCS-P7 — Adoption and exit evidence | (a) Canon landing: A3.1–A3.8 re-anchored into the FK charter (live §4/§5/§7/§11/§13; ledger at §17) via the §3.1 safe sequence; (b) exit manifest: FK-P21 evidence-manifest conventions (INF-7 corpus manifests, registry §6); (c) real parent/child run over the FK-P13 control catalog | mixed: canon seam Gate-3-pending + owner-of-record unreconciled; manifest conventions live | Human Gate 3 for every merge (authority basis: charter D7; FK charter §10/D9); exit manifest must state mechanically enforced / detected / sampled / human-judged / unsupported / deferred |

## 5. Gate decisions recorded

Every row is a **coordinator decision receipt — not a human approval**. Authority basis for
each: coordinator decision 2026-09-26 under owner blanket authority.

| ID | Decision | Rationale |
|---|---|---|
| GD-1 | Claim the goal as recorded in §1 and execute this wave's records work in the shared registration tree (goal directory + the shaped HCS-P0 spec path only); no git publication | Owner's 2026-09-26 wave direction supersedes the intake isolated-worktree precondition for this records-only slice; mirrors FK registry §9 GD-2 precedent; deviation recorded rather than absorbed |
| GD-2 | Adopt the §3.1 safe sequence as binding: no FK charter/branch/worktree/serialization-point edit until owner-of-record handoff + FK Gate-3 merge + pre-transcription re-sweep + FK-owner Gate-1 disposition; A3 stays a proposal | Charter's reconciliation condition and stop conditions; FK registry §8 seam rule (the merged package wins on divergence); live FK charter's own A3 preservation clause |
| GD-3 | Carry the §3.2 lease disposition (reuse FK-P10 primitive or amend the FK authority matrix by named ratified amendment — never a private second primitive) into HCS-P1 shaping | FK D14 single-writer leases, FK §3 authority matrix ("lease/transition engine only"), INF-8 "no competing recovery authority primitive"; FK-P10 is unstarted, so the decision is deferred with its constraint fixed |
| GD-4 | Shape HCS-P0 at smallest faithful scope (one map record + one verification record) and record charter underspecification in §3.4 instead of inventing scope | Charter P0 row defines the outcome only; the shaping rule for underspecified parcels |
| GD-5 | Record the Gate 1 ratification as bounded in `gate-1-ratification-2026-09-26.md` | Charter: "Gate 1: the claiming coordinator presents the reconciled decision list"; the reconciled list is §4 + charter D1–D7 |

**Standing gate statements (each with authority basis):**

- **Gate 1** — recorded 2026-09-26 as a coordinator decision receipt under owner blanket
  authority (`gate-1-ratification-2026-09-26.md`). It is not a fabricated human approval and
  does not replace the charter exit-criterion-2 explicit developer ratification of the final
  locked decisions, graph, and standing gates, which remains a named human receipt.
- **Gate 2** — **not granted** by this record. Authority basis: charter "Human gates and
  requested standing authority" ("Gate 2: not granted. Request only for the final named
  parcel graph after Gate 1 and plan review"). The request follows the plan review.
- **Gate 3** (merge, release, spend, and other consequential external effects) —
  **human-owned, not delegated.** Authority basis: charter D7; owner blanket authority does
  not delegate Gate 3; FK registry §1 ("Gate 3 merge | Human-owned, not delegated").
- **FK ownership transfer** — none granted or requested. Authority basis: charter
  "Provenance and authority" ("this charter creates neither"); FK owner-of-record handoff
  remains an open FK item (reconciliation row 16).
