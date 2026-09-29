# RS-2 — Gate-1 scoped re-ratification, RS-1 propagation, and corpus follow-up — 2026-09-27

**Goal:** `foreman-kernel`
**Instrument:** amendment RS-2 (ledger entry **L7**)
**Authority basis:** the owner's explicit rulings, 2026-09-27, in the scoped Gate-1 re-open demanded by the §15.2 consolidation plan review (`plan-review-findings.md`, "§15.2 consolidation plan review — 2026-09-27"). Four questions were presented by this coordinator and disposed by the owner in the same conversation; each ruling below quotes its disposition. Gate 1 is nondelegable and this record is the owner's Gate-1 act for the deltas it names.
**Ratification:** recorded as ledger row **L7** in charter §4.1. Per the L4 rule, the row is what makes these deltas binding; charter prose remains a convenience restatement.
**Relationship to RS-1:** RS-1 (L6) remains binding. RS-2 propagates its deltas into the dependent carriers the §15.2 review found un-transcribed (A1–E10 triage) and resolves the four Gate-1 questions. RS-1's wording is amended only where explicitly named below.

## Rulings

### RS-2.1 — Gate-3 delegation is ratified as a scoped standing "merge it" authorization

**Owner disposition:** "Ratify scoped delegation." Deltas:

1. **D9 is amended** (Gate-3 clause only): Gate 3 remains human-owned for main/PR merges, repository-settings changes, deployment, and destructive cleanup. The coordinator may perform the merge **git step** of a fully-green verification chain into the goal's integration branch under this standing authorization — the COORDINATOR-PATTERN "merge it" rule: always contingent on the full verification chain being green, and **any red step voids the delegation** for that chain. Delegation does not extend to opening, approving, or merging GitHub PRs to `main`, and never manufactures a gate's satisfaction.
2. **Charter §10 (Gate 3) and §13 item 11** are restated to the amended D9 wording.
3. **Loop directive standing authorization 6** ("Gate 3 is not delegated. Never merge.") is replaced with the delegated form: present the complete green chain and exact merge target; merge the git step into the integration branch under this authorization when and only when every verification step is green; stop and report for main/PR merges or any red step. The loop directive's `Ratified authority` record item 5 is updated in place (anchor preserved).
4. **Retroactive confirmation:** the two already-performed delegated merges — `a986b45` (FK-P0 R31 registry into the live tree) and `609c97f` (Gate-3 preparation packet) — are confirmed as within this authorization, on the recorded basis that both chains were fully green (751/751 run 36 + ten-command chain + two fresh APPROVE verdicts; published decision packet `R31-VERIFIED-STATE-20260907.md`).
5. **FK-P0 registry re-baseline:** the canon registry's `authorityClaim: human-owned-nondelegated` and the pinned Gate-3 rule text are re-baselined to this ruling through the separately reviewed corpus amendment (RS-2.5 item 5), never by silent re-generation.

### RS-2.2 — INF/U1 carrier reassignment and strand naming

**Owner disposition:** "Reassign + strand-name." Deltas:

1. **INF-5 measurement** is retargeted to **FK-P17′**: both spans, cold-start reporting, and 1000 ms deadline-failure behavior are measured on the shipped mediated surfaces (`hooks/model-gate.mjs`, `dispatch/src/approval-cli`, `mutation-scope-guard`). This is a spec-level retarget of D21's `mediatedActionLatency` span — "host lifecycle entry → hook exit" resolves to the shipped hook's entry/exit on the D20 matrix while FK-P16 is deferred. FK-P1 adopts the A1/D21 contract as specified and does not absorb the measurement retarget.
2. **INF-8** keeps in-scope fragments: FK-P9 records the backup/restore contract (boundary, integrity checks, protected destination, retention, restore sequence) and FK-P11 records the divergence-stop and migration crash/recovery behavior in its exit evidence. The **process-boundary recovery proof** (restart reconstruction at a real boundary, split-brain refusal, stale-authority refusal proof) remains **stranded** (FK-P14/FK-P15 deferred) and is named in the RS-1.4 exit annex.
3. **All remaining stranded obligations** — INF-4 retained-evidence manifest and retention/retrieval, INF-7 revision-bound corpus manifest binding, INF-1/INF-2/INF-3/INF-6 residual assembly rows, and the U1 evidence chain (protected verifier/workflow control, runner lifecycle identity, independent negative controls, evidence identities/retention, bounded unsupported outcomes) — are **explicitly named unmet at goal exit** in the annex and become follow-on-goal candidates. They are never claimed satisfied by the reduced exit.

### RS-2.3 — Exit criterion text

**Owner disposition:** "RS-1.4 sole + annex." Deltas:

1. **RS-1.4 (a)–(f) is the sole binding goal exit.** Charter §9's items 1–9 and §16's "the inherited nine goal exit conditions in section 9 remain required in full" are superseded as exit tests and remain as historical text behind pointers to this record. Fragment (a) "merged through the required gates" means: merged through the gates as amended by RS-2.1.
2. **§8 scenario set** under RS-1.4(e) remains items 1, 2, 3, 4, 8, 9 where attributable to in-scope parcels; **scenario 14 (D21 latency) is NOT silently dropped** — it is carried in the annex as a named stranded obligation (full two-span/cold/deadline evidence at the D21 level remains with the deferred measurement infrastructure; FK-P17′'s shipped-surface measurement per RS-2.2 is the in-scope partial). The (c) parenthetical is exhaustive as written for the in-scope fragment; FK-P10 split-ownership, FK-P11 deterministic projection and evidence-derived human-gate-state properties remain inside the unchanged Wave-3 exit for FK-P9–P11.
3. **Exit annex (binding content of the final report):** every deferred parcel (FK-P12–FK-P16, FK-P19, FK-P21), the dropped FK-P20, every stranded obligation named in RS-2.2, and the §8 scenarios 5/10/13/14 evidence gaps are listed as **not satisfied** — follow-on-goal candidates, never exit claims.

### RS-2.4 — FK-P2/FK-P3 sequencing and FK-P2 scope narrowing

**Owner disposition:** "Sequence + narrow FK-P2." Deltas:

1. **FK-P2 scope is narrowed** (amends the RS-1.3 claim): FK-P2 delivers the **spec-body compiler package + hostile fixtures** on FK-owned surfaces only — parsing required spec sections; compiling exact non-glob Allowed Files and frozen/forbidden surfaces; rejecting ambiguity, traversal, equivalent paths, symlink/reparse escape, and missing authority; never reading `surfaces:` as mutation permission (D10). Its spec-grammar input is **pinned to a named SPEC-CONVENTION revision** (schema v0.4 state as of 2026-09-27) so the RCM-P2 additive stream cannot move under it.
2. The **`mutation-scope-guard` / `dispatch/src/approval-cli` rewiring** — consuming compiled spec bodies instead of `surfaces:` (the D10 defect fix) — becomes a named follow-on parcel **FK-P2B**, dispatchable only after negotiated write windows with the live owners (`routing-currency-and-merit` Window R single-writer discipline on `dispatch/**`; `foreman-line-boundary-routing` ownership of `mutation-scope-guard/`). The binding PMC↔RCM window order contains no FK slot today; FK-P2B and FK-P3 require a recorded window extension before any write there.
3. **FK-P3** queues behind RCM Window R and the same negotiation (boundary-routing for routing/skill-resolution code, `plugin-packaging-and-scaffolder` for `skill-injection/`). No FK parcel writes `dispatch/`, `routing-policy/`, `mutation-scope-guard/`, `hooks/`, or `skill-injection/` until its window is recorded.
4. **§12 register additions:** `mutation-scope-guard/`, `hooks/`, `skill-injection/` are recorded as contested seams with their current holders; FK-P2B's seam reservation is noted.

### RS-2.5 — Record propagation directives (coordinator-executed)

1. `fk-p1-p21-dispatch-plan.md` is annotated to RS-1/RS-2: deferred/dropped row markers, FK-P2 narrowed row + FK-P2B, corrected A1 measurement rows (FK-P17′ measures; FK-P18′ carries only coarse CI regression bounds per A1.3), the restored Wave-0 D21 clause, refreshed pre-dispatch prerequisites, and RS-1.3 ordering.
2. The loop-directive queue table carries the same status markers; the charter status lines become one branch-qualified state (B8).
3. **Root workflow ownership (C-06):** FK-P18′ is the named owner of its CI backstop files — `test-plugin-install.yml` (ADR-001 scope) and any new workflow files its spec names exactly; `foreman-line-ci.yml` remains outside its write set unless a window is recorded. The unratified A2-r4 wording is not revived.
4. The U1 §14 dependency stands unchanged: FK-P18′ dispatch holds until a concrete independently reviewed U1 contract exists (E7); the plugins `test` job failure is a named unowned prerequisite of RS-1.4(d) and must be owned or waived in the FK-P18′ spec (E6).
5. **FK-P0 corpus amendment R32 is required** before any implementation verification claim covers RS-1/RS-2-era normative content: re-pin the corpus to the live consolidated charter structure (the `# Goal Charter — Foreman Kernel` → `# Foreman Kernel Development Charter` rename and heading-style drift), adopt the `COORDINATOR-PATTERN.md` dispatch-table value, re-baseline the Gate-3 authority claim per RS-2.1, record a typed prior-to-new migration (R24–R29 pattern: history digests never rewritten), regenerate the registry, and pass validate + sweep with zero violations. R32 receives a separate independent review before FK-P1's verification chain is trusted.

## Gate effects closed by this record

| Re-open | Resolution |
|---|---|
| A1/A2/E1/B11 — D9 / §10 Gate-3 delegation | RS-2.1 |
| A3/B2/B3/B4/D2/E4 — INF/U1 carriers | RS-2.2 |
| B1/A4/B9/B12/E2/E3/D1 — §9/§16 exit set vs RS-1.4; scenario 14 | RS-2.3 |
| C-01/C-02/C-07 — contested-surface windows (incl. RS-1.3 scope) | RS-2.4 |
| E5 — corpus absorption | RS-2.5 item 5 (R32 dispatch, separately reviewed) |

Non-Gate-1 findings (A5–A8, B5–B8, B10, C-04–C-06, C-08, C-09, D3, D4, E6–E10) are dispositioned in `plan-review-findings.md` and propagated per RS-2.5 without further gate.
