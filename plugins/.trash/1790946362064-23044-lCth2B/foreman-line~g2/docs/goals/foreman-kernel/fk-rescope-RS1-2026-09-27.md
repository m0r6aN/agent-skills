# RS-1 — Foreman Kernel program re-scope amendment — 2026-09-27

**Goal:** `foreman-kernel`
**Instrument:** amendment RS-1 (ledger entry L6)
**Authority basis:** explicit owner direction, 2026-09-27 (authority rank #1, charter §3): the owner reviewed the Wave 3–4 marginal-value quantification (`fk-wave3-4-marginal-value-2026-09-27.md`) and directed: *"Proceed with your recommendations. I am granting you blanket authority to make decisions on my behalf, as well as perform any non-destructive actions needed to complete this goal."* The recommendations directed are the three below, recorded in the same conversation and named by target.
**Ratification:** owner-ratified 2026-09-27 via the quoted direction. Recorded as ledger row **L6** in charter §4.1. Per the L4 rule, this row is what makes the deltas binding; charter prose remains a convenience restatement.

## Ratified deltas

1. **Wave 3 split (RS-1.1).** FK-P9, FK-P10, FK-P11 remain in scope (Wave 3a — durable operational-state core: storage/migrations, lease/transition engine, import/projection). FK-P12, FK-P13, FK-P14, FK-P15 are **deferred** to a post-Wave-3a value check (assurance-heavy tail; FK-P12's primary consumer FK-P16 is deferred). Deferred ≠ deleted; each deferred parcel becomes a follow-on-goal candidate recorded at goal exit.
2. **Wave 4 reduction (RS-1.2).** FK-P17 and FK-P18 remain in scope as the evidence/detection layer, **retargeted**: FK-P17′ runs the bypass/outage matrix against the shipped mediated surfaces (`hooks/model-gate.mjs`, `dispatch/src/approval-cli`, `mutation-scope-guard`) instead of FK-P16's unbuilt adapter — including the [INFERENCE] vector "mutations outside the dispatch CLI bypass all scope checks" as a must-prove row; FK-P18′ adds CI backstops plus class-1/class-3 invariants (post-action realpath-aware diff; dirty-reviewer check). Dependency amendment: FK-P17′ depends on shipped surfaces + FK-P2's compiled-scope output where available, not on FK-P16; FK-P18′ depends on FK-P17′. FK-P16, FK-P19, FK-P21 are **deferred** to a post-FK-P17′/FK-P18′ value check. FK-P20 is **dropped** (reopen only on a later, cheap Codex-probe justification).
3. **FK-P2 elevated (RS-1.3).** FK-P2 (spec-body compiler) is dispatched immediately after FK-P1 within Wave 0, ahead of all other pending parcels — it fixes the wrong-authority input (`surfaces:`) of the one existing class-2 enforcer (`mutation-scope-guard`), the highest marginal value per parcel in the program.

## Exit criterion amendment (RS-1.4)

Charter §9 is amended to: this goal exits when (a) FK-P0 through FK-P11 plus FK-P17′ and FK-P18′ are merged through the required gates; (b) the Wave 0–2 exit criteria are met unchanged; (c) the Wave-3 exit fragment is met for FK-P9–FK-P11's ledger properties (restart reconstruction, CAS/idempotency conflicts, migration crash/recovery, divergence-stop); (d) the Wave-4 exit fragment is met for FK-P17′/FK-P18′ (mechanical/detected/unsupported matrix on the shipped surfaces; CI backstops green; class-1/class-3 invariants proven by negative controls); (e) integration scenarios covering the in-scope surfaces (§8 items 1, 2, 3, 4, 8, 9 where attributable to in-scope parcels) carry durable evidence; and (f) the final report names every deferred parcel (FK-P12–FK-P16, FK-P19, FK-P21), the dropped FK-P20, and their follow-on-goal disposition without claiming goal-level satisfaction of the deferred fragments. Honest-claims rule (charter lesson #33) binds: parcel-level green never rolls up into unearned goal-level claims.

## Gate delegation (RS-1.5)

Under the owner's blanket authority ("perform any non-destructive actions needed to complete this goal"), the Gate-3 merge git step is delegated to this coordinator session for verification chains that are fully green (the standing "merge it" rule of `COORDINATOR-PATTERN.md`; any red step voids the delegation). Gate 1 re-opens remain nondelegable; this amendment itself is the owner's Gate-1 act for its deltas. This resolves the pre-merge state recorded in `fk-reconciliation-2026-09-26.md` row 16 (owner-of-record handoff): owner-of-record is Clinton Morgan; coordinator ownership transfers to the issuing session at this parcel boundary, per the goal skill's ownership rule.

## Evidence basis

- `fk-wave3-4-marginal-value-2026-09-27.md` (three-inventory quantification: 0/13 Wave-3–4 parcels fully covered, 5 partial, 8 zero-coverage; five refusal classes 1 enforced / 2 partial / 2 absent; D10 defect).
- Pre-dispatch prerequisites status at issuance: FK-P0 Gate-3 merges complete (`a986b45` R31 registry, `609c97f` preparation packet); §15.2 fresh plan review dispatched separately; owner-of-record handoff reconciled by this record.
