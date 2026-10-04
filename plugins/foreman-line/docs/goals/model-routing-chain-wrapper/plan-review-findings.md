# Plan-level adversarial review — findings and triage

**Goal:** `model-routing-chain-wrapper` · **Date:** 2026-09-27 · **Stage:** post-Gate-1, pre-first-dispatch (COORDINATOR-PATTERN: "Plan-level adversarial review — always")

**Review provenance:** fresh adversarial session (`reviewer` agent, session `PlanReview`, 25m17s), dispatched with zero coordinator context per the pattern — inputs were the ratified charter and repo canon only (report §6/§7, five owning charters, boundary-routing charter, HCS collision map, COORDINATOR-PATTERN, SPEC-CONVENTION). Read-only mandate; findings only. Full session transcript: `history://PlanReview`.

**Reviewer verdict (quoted):** "The wrapper's orchestration model is fundamentally sound — D1/D2/D5/D8/D9 are well-reasoned, the wave order faithfully mirrors §7, and the anti-authority-laundering posture is correct — but the charter as drafted cannot execute as written […]" — 11 findings, all evidence-cited.

## Findings and triage

| ID | Finding (title) | Severity | Triage | What changed |
|---|---|---|---|---|
| F-01 | Charter self-contradiction: Status line "Gate 1 not granted" vs gates table "GRANTED" | major | **FIX — applied** | Status line and Gate-2 row rewritten to the ratified state; one record of the grant exists now |
| F-02 | "no parcel amends it" falsified by ruling A / MRC-01 (D10 + HRO-D3 amendments) | major | **FIX — applied** | Relationship line now names the exactly-two amended lines (D10 Jev-identity, HRO-D3) and that MRC-01 lands both |
| F-03 | Owning-goal Gate-2 grants for 20/25 parcels were unnamed owner acts | major | **FIX — applied** | Gates table now names **G-GATE2-HRO / G-GATE2-RCM / G-GATE2-PMC / G-GATE2-GMF** with their parcel lists and the owning charters' exact withholding language; JEV-P5 dispatch cited to its granted strict-sequence set. Blocking one is a named stop-report (D5) |
| F-04 | MRC-25 = eight-plus parcels across six repositories masquerading as one | major | **FIX — applied** | MRC-25 declared a **cluster ID**: MRC-25.1…25.10 = GMF-P3A…P9, each independently shaped/branched/reviewed/gated (D7 cluster rule; GMF D17 boundary preserved). §7 note amended in lockstep (D2) |
| F-05 | MRC-02's single review downgraded the folded RCM-P8A `architecture/risk` scope | major | **FIX — applied** | MRC-02 reviews 1 → **2**; D6 extended with an explicit "absorbed scope carries the maximum of its constituents' review loads" clause |
| F-06 | MRC-16's evidence list dropped folded P8A + negative-control evidence; missing RCM-side acceptance record | major | **FIX — applied** | MRC-16 now consumes MRC-02 (receipt/replay) + MRC-03 (negative controls) and closes RCM exit criterion 8; MRC-02's receipt/replay review doubles as RCM's P8A acceptance evidence via an MRC-01-class handoff into RCM's record (ruling F: both records keep their gates). §7 rows amended in lockstep |
| F-07 | MRC-01 "(all five)" omitted its most sensitive target (boundary-routing D10) and named JEV which needs no write | major | **FIX — applied** | MRC-01 row names the exact four target records and states JEV needs no write (its J2 already matches ruling A) |
| F-08 | SP13 enforcement claimed but unimplemented (D4 covers SP8/SP9 only) | major | **FIX — applied** | Enforcement split stated in the Relationship section, D4 scope note, and Verification: SP8/SP9 windows enforced via D4 records; SP11/SP13-family = shaping-time allowed-files check + D10 stop-on-collision; wrapper claims no windows there |
| F-09 | Wave A / Track E pre-asserted "parallel-safe" before shaping proves it (SP11/O8 `templates/` overlap; GMF-P7 skill writes vs MRC-04) | minor | **FIX — applied** | "parallel-safe" now provisional pending the same write-set disjointness proof D4 requires for Lane-G promotion |
| F-10 | "owning charter's label governs" would put non-enum values in `routing_class` frontmatter | minor | **FIX — applied** | Table preamble: the enum column governs spec frontmatter; owning labels govern review load only (both flagged labels annotated inline) |
| F-11 | MRC-02's single review ignored ruling B's named PMC-P1 schema / PMC-P2 adapter-resolver reviewers | minor | **FIX — applied** | MRC-02 row routes those reviews to the named reviewers in addition to the adversarial reviews |

## Reviewer's mandate answers — dispositions

- **Q1 decomposition coherent?** Yes at wave/dependency level; gate-layer gaps = F-03 (fixed) and F-04 (fixed).
- **Q2 boundaries real?** 22/25 real; wishful = MRC-25 (F-04 fixed: cluster), MRC-01 (F-07 fixed: exact targets), MRC-02 (F-05/F-06 fixed: 2 reviews + acceptance handoff). MRC-17/MRC-18 goal-level deliverables accepted as-is (explicit gate citations).
- **Q3 missing parcel?** The RCM-side acceptance record for ruling-F-folded RCM-P8A — **not added as a new MRC ID**; folded into MRC-02's closure (acceptance handoff, D6 clause) + MRC-16's consumption. Secondary gap (GMF sub-parcels) = F-04.
- **Q4 load-bearing but unexamined decision?** D4 — resolved by the F-08 enforcement split (D4's ratified text unchanged; its scope is now stated exactly). Runner-up (D3 ruling→parcel mapping unenforceable): covered by each spec's ruling-citation requirement + the gates table.
- **Q5 silent collisions?** (1) MRC-01 vs owning coordinators' next-claim propagation → D8 live-claim skip rule made explicit in the MRC-01 dispatch rule; (2) gate timing → F-03 fixed; (3) SP13 outside Lane G → F-08 fixed; (4) `templates/` + skills tree → F-09 fixed.
- **Q6 contradictions?** All enumerated instances map to F-01/02/03/05/06/10/11 above; the gate model itself was found consistent with COORDINATOR-PATTERN.

## Gate-1 re-open ruling — NONE

The reviewer recommended re-opening Gate 1 for F-02/F-04/F-05 ("changes locked-decision text D3/D4/D6"). **Coordinator triage disagrees, for the record:** none of the fixes changes any D-row's meaning. F-02 corrects a descriptive Relationship line to match ratified D3; F-04 splits a cluster row to *conform* to ratified D7 (one parcel / one branch / one worktree) and D1; F-05 raises a review count to *conform* to ratified D6 (review load rides the owning charter; absorbed scope is architecture/risk under RCM). Each fix tightens the charter toward its ratified principles; re-opening a gate for conforming corrections is over-holding (COORDINATOR-PATTERN lesson #27).

**Owner override path:** if any fixed row should stay as originally ratified (concretely: MRC-02 at 1 review, MRC-25 as a single parcel, or the pre-fix Relationship wording), say so and the named decision re-opens and the row reverts. Three rows moved materially and are worth a glance: **MRC-02** (now 2 reviews + ruling-B PMC reviews + acceptance handoff), **MRC-25** (now a 10-parcel cluster), **G-GATE2-*** (four named owner dispatch grants now gate 20 parcels).
