# Foreman Kernel — Plan-Level Adversarial Review Findings

**Charter reviewed:** `c4bf00f6fde9058e1350898914e06f261ae38c93`
**Review date:** 2026-08-31
**Reviewer:** fresh zero-context frontier agent session `foreman_kernel_plan_review`
**Reviewer verdict:** `REQUEST CHANGES`
**Coordinator triage:** six BLOCKERs fixed in the charter amendment; seven SHOULD-FIX
findings fixed or made binding on parcel specs; three findings accepted/informational
**Gate effect:** scoped Gate 1 re-open re-cleared 2026-08-31; developer explicitly
re-ratified R1–R13 and resumed the standing Gate 2 authorization

The reviewer was dispatched after the original Gate 1 ratification with no coordinator
context beyond the committed charter and repo canon. It made no file or Git changes.

## Blocker triage

| ID | Finding | Verdict | Coordinator ruling and charter disposition | Gate effect |
|---|---|---|---|---|
| B1 | No parcel owns the `authorizeAction` policy engine required by D12. | **FIX** | Added D18 and FK-P12, a provider-neutral authorization-engine parcel combining authenticated principal, repo/worktree identity, compiled scope, role, lease/revision, gates, outage posture, and obligations. Control and hook parcels depend on it. | Re-open D3/D12/D17 and graph. |
| B2 | A separately registered control catalog has no authenticated caller or admission boundary. | **FIX** | Amended D3/D9/D15/D17; FK-P1 now owns the admission contract; FK-P13 owns a distinct host-local capability and mechanically distinct principal. Human-gate state is evidence-derived, never an ordinary transition. Anonymous verifier clients must not list or call control tools. | Re-open D3/D9/D15/D17; add D18. |
| B3 | The final stateful container has no owning parcel. | **FIX** | FK-P7/FK-P8 are explicitly stateless. Added FK-P14 for final stateful image composition/operator lifecycle and FK-P15 for process-boundary restart/admission proof. | Re-open D3/D4/D14/D15 and graph/exits. |
| B4 | `BYPASS_MODE_FORBIDDEN` overclaims refusal when bypass prevents the hook from running. | **FIX** | Amended D7/D8/D13. Enforcement claims only `MEDIATED_BYPASS_MODE_FORBIDDEN` when the adapter runs. Missing/disabled/non-loaded enrollment is detected through heartbeat and CI and classified detected-only. | Re-open D7/D8/D13 and exit criteria 5–6/8. |
| B5 | CI backstops were sequenced after enforcement promotion. | **FIX** | Split CI into FK-P18 before FK-P19 enforcement. FK-P19 cannot promote until the hook-bypass negative control fails in CI. Second-host work moved to FK-P20. | Re-open D11/D13 and graph/exits. |
| B6 | Read-only MCP path inputs lacked a confidentiality boundary. | **FIX** | Added D19. FK-P1/FK-P4 require content-only public APIs or admission-bound `repoId + relative path` within one read-only root, canonical containment, symlink/reparse refusal, regular-file checks, and byte limits. Read-only server cannot mount/read the state volume. | Re-open D3/D10/D15/D17; add D19; amend exits. |

## Should-fix triage

| ID | Finding | Verdict | Coordinator ruling and binding disposition |
|---|---|---|---|
| S1 | FK-P9/P10/P11 overlapped projections and FK-P9 was oversized. | **FIX** | Wave 3 is redrawn: FK-P9 storage/migration ABI; FK-P10 lease/transition engine; FK-P11 legacy import/projection; FK-P12 authorization engine; FK-P13 control registration. Migration and barrel ownership is serialized. |
| S2 | “Git evidence wins reconciliation” conflicts with D2 and lacks field-level semantics. | **FIX** | D14 now defines field authority. Git wins ratification/human-gate facts; SQLite wins leases/revisions/idempotency/wakeups/cursor after one-time digest-bound cutover. Divergence stops. FK-P11 owns the cutover. |
| S3 | Lease/crash/migration/recovery evidence was not falsifiable enough. | **FIX** | D14 and FK-P9/P10/P15 now require trusted lease time, same-key/different-payload conflict, transactional updates, crash injection, interrupted/newer-schema migration behavior, backup/checkpoint recovery, corruption refusal, and real process-boundary concurrency. |
| S4 | “Portable” was tested across harness shapes, not host/filesystem semantics. | **FIX** | Added D20. First-release enforcement claim is Windows 11 + Docker Desktop + Claude Code. Cross-platform path vectors remain contract fixtures. Codex/native-Linux enforcement requires separate real evidence. |
| S5 | Exit evidence lacked pinned identities and mutation controls. | **FIX** | Added FK-P21 and exit criterion 8. Evidence manifest binds source/image/tool/schema/policy digests, host/harness versions, corpus inventory/count, reviewer-session distinction, commands/results, and named mutation controls. |
| S6 | FK-P3 did not enumerate all mixed evaluators it must split. | **FIX IN PARCEL CONTRACT** | FK-P3 shaping must enumerate routing, skill resolution, shadow routing, and every other read-surface-reachable mixed entry point. It requires write-sentinel and deterministic-clock tests; no `docs/receipts/**` writer may be reachable from the read facade. No locked decision changed beyond D16 clarification already present. |
| S7 | Shared manifest ownership was acknowledged but unassigned. | **FIX** | Repo constraints now assign server manifest to FK-P6, stateless Docker to FK-P7, state ABI to FK-P9, stateful Docker to FK-P14, Claude registration to FK-P16, CI to FK-P18, and Codex manifest to FK-P20. |

## Accepted and informational findings

| ID | Finding | Ruling |
|---|---|---|
| A1 | Structural receipt validation is honestly bounded. | **ACCEPT AS DOCUMENTED.** D5/D6 and the structural-honesty scenario remain unchanged. |
| A2 | Human Gate 3 is preserved. | **ACCEPT AS DOCUMENTED.** Gate 3 remains nondelegated; control admission cannot create merge authority. |
| A3 | Shell containment is candidly layered. | **INFORMATIONAL.** D13 remains, with B4’s narrower mediated-bypass and enrollment-detection classification. |

## Amendment register

| Amendment | Source | Charter change |
|---|---|---|
| R1 | B1 | Added D18 and FK-P12 authorization engine. |
| R2 | B2 | Added authenticated local control admission and evidence-derived human-gate state. |
| R3 | B3 | Split stateless image proof from final stateful image composition/proof. |
| R4 | B4 | Split mediated bypass refusal from enrollment/absence detection. |
| R5 | B5 | Moved CI backstops before enforcement promotion. |
| R6 | B6 | Added D19 read-confidentiality boundary and state-volume isolation. |
| R7 | S1 | Redrew Wave 3 parcel boundaries and serialization ownership. |
| R8 | S2 | Added field-level Git/SQLite authority and cutover semantics. |
| R9 | S3 | Added falsifiable lease/idempotency/crash/migration/backup tests. |
| R10 | S4 | Added D20 first-release host/filesystem claim matrix. |
| R11 | S5 | Added FK-P21 evidence manifest and exact proof identities. |
| R12 | S6 | Made mixed-entry-point enumeration/write sentinels binding on FK-P3 shaping. |
| R13 | S7 | Assigned every shared manifest/launcher/CI serialization point. |

## Scoped Gate 1 re-open

The developer is asked to re-ratify only:

1. amended D3, D7–D9, D13–D17;
2. new D18–D20;
3. the FK-P0–FK-P21 graph, including stateless/stateful image separation,
   authorization engine, CI-before-enforcement, and exit-evidence parcel;
4. the amended Wave 2–4 exits;
5. the thirteen integration scenarios; and
6. the amended goal exit criteria.

D1, D2, D4–D6, D10–D12, the explicit no-generic-mint boundary, human-owned Gate 3,
and the goal’s external-effect exclusions remain ratified except where the amendments
clarify their implementation boundary.

**Re-ratification record:** Clinton Morgan explicitly instructed: “Re-ratify Gate 1
amendments R1–R13 and resume Gate 2” on 2026-08-31. The scoped re-open is closed and the
existing standing Gate 2 authorization is active for FK-P0–FK-P21 under its original
contingencies.

---

# §15.2 consolidation plan review — 2026-09-27

**Charter reviewed:** live consolidated `charter.md` (PR #22 adoption, 2026-09-14) with its incorporated changes (A1/A1.8/A1.9 ledger, A4 INF-1–INF-8, D21) plus amendment RS-1 (ledger L6) and the operative plan records (`fk-p1-p21-dispatch-plan.md`, `fk-reconciliation-2026-09-26.md`, `loop-directive.md`), against current repo canon and live code.
**Review date:** 2026-09-27. **Reviewer:** five independent fresh zero-coordinator-context frontier sessions (pool `fk-15p2-plan-review`, lenses A–E: authority mapping; parcel coverage/false completeness; collision ownership; A1/D21 consistency; evidence sufficiency/gate mechanics). Read-only; no fixes or commits.
**Why re-run:** the charter's §15.2 review was recorded only as "dispatched" with no result on disk; under the presumptively-empty rule it was re-dispatched and is now recorded here.
**Reviewer verdict:** `REQUEST CHANGES` — 17 BLOCKER / 19 SHOULD-FIX / 8 INFO.
**Coordinator triage:** 43 findings dispositioned below. Key claims were reproduced on disk before ruling: the FK-P0 registry cannot regenerate or sweep green over the live tree (E5, independently confirmed: `generate` throws `required evidence 'fk-charter:item.cd014d6d90c5' is missing`; `sweep` reports `LOCATOR_MISSING`/`VALUE_DIGEST_MISMATCH` from the consolidated-charter rename + `COORDINATOR-PATTERN.md` drift); the Gate-3 authority quotes (D9, `authorization-20260907-unattended.md` decision 5, COORDINATOR-PATTERN gates table) were read verbatim before framing the Gate-1 asks.
**Gate effect:** scoped Gate-1 re-open presented to the owner 2026-09-27 on (1) D9/§10 Gate-3 delegation, (2) §14/§16 INF-carrier assignments vs RS-1 deferrals, (3) §9/§16 exit set vs RS-1.4 fragments, (4) FK-P2/FK-P3 contested-surface windows (RS-1.3 scope). Resolutions are recorded in the next section.

## LENS-A authority mapping

| ID | Sev | Finding | Evidence | Verdict | Gate effect |
|---|---|---|---|---|---|
| A1 | BLOCKER | RS-1.5's Gate-3 delegation contradicts locked D9 ("human-owned unless a distinct agent identity is mechanically authorized and verified live") without D9 in L6's ratified scope; rests on a blanket clause whose directed recommendations are RS-1.1–1.3; reinterprets wording the Sept-7 authorization read as excluding merges ("the existing human Gate 3 remains the merge boundary") | `fk-rescope-RS1-2026-09-27.md:5,18-20`; `charter.md:112,143`; `authorization-20260907-unattended.md:17`; `COORDINATOR-PATTERN.md:53-55` | **FIX** — owner ratification naming the Gate-3 merge step and amending D9, or withdrawal | scoped Gate 1 re-open: D9, §10 Gate-3 statement, RS-1.5 wording |
| A2 | BLOCKER | Every operative "Gate 3 not delegated / never merge" record (loop `Ratified-authority` rule, SA6, charter §10/§13, merged FK-P0 registry `authorityClaim: human-owned-nondelegated`) contradicts ratified L6; charter status claims FK-P0 Gate-3 merges already complete under that questioned authority | `loop-directive.md:38,330-331`; `charter.md:8,382-384,457`; `authority-enforcement-registry.yaml` (`item.b1ac4aa9eddf`) | **FIX** — single-source reconciliation + registry re-baseline with A1's resolution | same re-open as A1 |
| A3 | BLOCKER | L5-ratified INF-1/4/6/7/8 and the U1 chain name only FK-P16/P19/P20/P21 as carriers — all deferred or dropped by RS-1 with no reassignment in L6 or RS-1.4 | `charter.md:495-498,554-555,601-602,621-622,644-645,649,803-810` | **FIX** — owner-ratified reassignment or explicit deferral per obligation | scoped Gate 1 re-open: §14/§16 INF carriers |
| A4 | SHOULD-FIX | §16 ("nine conditions remain required in full") and §8's all-14-scenarios preamble are stale restatements vs binding RS-1.4 | `charter.md:797,295,316-360` | **FIX** — replace with pointers to §4.1/RS-1.4 (L4 rule: the row governs) | none |
| A5 | SHOULD-FIX | Standing Gate 2 grant, loop queue and dispatch plan still authorize/present all FK-P0–FK-P21 incl. deferred/dropped parcels; none carries RS-1.3's "FK-P2 immediately after FK-P1"; §15.4 concurrent-lane text contradicts it | `loop-directive.md:37,319-320,389-410`; `charter.md:750-751`; `fk-p1-p21-dispatch-plan.md:28-48` | **FIX** — annotate to L6 | none |
| A6 | SHOULD-FIX | Owner-of-record ambiguity: loop block named the idle Codex thread while RS-1.5 declared the handoff reconciled | `loop-directive.md:4-7,46`; `fk-rescope-RS1-2026-09-27.md:20` | **FIXED** — successor handoff recorded 2026-09-27 in the owner block | none |
| A7 | INFO | Reconciliation row 15's "no later amendment revokes" is a dated pre-L6 claim | `fk-reconciliation-2026-09-26.md:42` | accept-as-documented (supersession note rides the resolution record) | none |
| A8 | INFO | Authority chain otherwise clean (A3 stays unrowed proposal; A1/A1.8/L3/L4 coherent) | `proposed-amendment-A3-…:5,171-174`; `charter.md:140-141` | informational | none |

## LENS-B parcel coverage / false completeness

| ID | Sev | Finding | Evidence | Verdict | Gate effect |
|---|---|---|---|---|---|
| B1 | BLOCKER | §16's "nine required in full" vs binding RS-1.4: §9 items 2/4/5/8 depend on deferred FK-P13/14/15/19/21 → exit unreachable or false-claims | `charter.md:797 vs 336-358` | **FIX** | scoped Gate 1: §9 items 2/4/5/8 vs RS-1.4 |
| B2 | BLOCKER | D21/INF-5 latency measurement has no in-scope carrier; RS-1.4(e) silently drops §8 scenario 14 | `charter.md:124,572-575,807`; `fk-rescope-RS1-2026-09-27.md:12,16` | **FIX** | scoped Gate 1: D21/INF-5 carriers, scenario 14 |
| B3 | BLOCKER | INF-8 recovery proof stranded (FK-P14/15/21 deferred; RS-1.4(c) covers only "migration crash/recovery") | `charter.md:624-645,810` | **FIX** | scoped Gate 1: INF-8 vs RS-1.4(c) |
| B4 | BLOCKER | Exit-evidence manifest coverage stranded (FK-P21 sole owner, deferred) while §9 item 8 / INF-4/6/7 / §16 still require it | `charter.md:268,356-358,554-555,601-602,621-622,806-813` | **FIX** | scoped Gate 1: §9 item 8 + INF-4/6/7 evidence obligations |
| B5 | SHOULD-FIX | D3/D4/D7/D15/D18 fragments survive only on deferred/dropped parcels; never named stranded at exit (RS-1.4(f) names parcels only) | `charter.md:106-121`; `fk-p0-canon-authority-enforcement-registry.md:108-112` | **FIX** — decision-level stranded naming | none |
| B6 | SHOULD-FIX | Dispatch plan's Wave-0 quote drops the D21 latency clause while labeled "unchanged" | `fk-p1-p21-dispatch-plan.md:50-55 vs charter.md:209-213` | **FIX** — restore clause | none |
| B7 | SHOULD-FIX | Dispatch plan unreconciled to RS-1 (deferred rows live; prerequisites stale) | `fk-p1-p21-dispatch-plan.md:14-62` | **FIX** | none |
| B8 | SHOULD-FIX | Contradictory FK-P0 Gate-3 merge status across charter:6/:8, registry record, status report, INDEX | `charter.md:6,8`; `INDEX.md:16` | **FIX** — one branch-qualified state line | none |
| B9 | SHOULD-FIX | RS-1.4(c)/(e) drop obligations of IN-SCOPE parcels (FK-P10 split-ownership, FK-P11 projections/D9, §8 scenarios 6/7/10) | `fk-rescope-RS1-2026-09-27.md:16`; `charter.md:252-255,308-317` | **FIX** — state (c) parenthetical exhaustiveness | scoped Gate 1 if the set changes |
| B10 | SHOULD-FIX | INF-1/2/3 rows name deferred/dropped carriers unannotated | `charter.md:495-498,516-517,803-805` | **FIX** — annotate + name residuals at exit | none |
| B11 | BLOCKER | Gate-3 ownership contradicted across §10/§15.2/D9/registry vs RS-1.5; fragment (a) "required gates" ambiguous | `charter.md:112,382-384,707`; `fk-p0-canon-authority-enforcement-registry.md:26` | **FIX** — rides A1's resolution; define what (a) requires | same re-open as A1 |
| B12 | INFO | §9 preamble omits dropped FK-P20 from deferred list | `charter.md:336` | fix (one-liner) | none |

## LENS-C collision ownership / serialization

| ID | Sev | Finding | Evidence | Verdict | Gate effect |
|---|---|---|---|---|---|
| C-01 | BLOCKER | RS-1.3's FK-P2 "fix `surfaces:` input of `mutation-scope-guard`" needs writes into `dispatch/src/approval-cli` + `mutation-scope-guard` held by RCM Window R / boundary-routing; §11 stop condition fires before dispatch | `fk-rescope-RS1-2026-09-27.md:12`; `fk-p1-p21-dispatch-plan.md:29`; boundary-routing items-3-4 | **FIX** — sequence/negotiate before dispatch | scoped Gate 1 if FK-P2 scope narrows |
| C-02 | BLOCKER | FK-P3's contested row names only boundary-routing; live single-writer over `dispatch/**`+`routing-policy/**` is RCM Window R ("no co-ownership at any time") + scaffolder queued writes | `fk-p1-p21-dispatch-plan.md:30`; `rcm-sequencing-decision-2026-09-26.md:29-58`; RCM `loop-directive.md:42-49` | **FIX** — negotiate window incl. RCM/scaffolder | none (window record) |
| C-03 | BLOCKER | Owner-of-record ambiguous (loop block vs RS-1.5) → SP6 stop | `loop-directive.md:46`; `hcs-p0-authority-and-collision-map.md:195` | **FIXED** — successor handoff recorded 2026-09-27 | none |
| C-04 | SHOULD-FIX | §12 named-owner rows stale (FK-P16/FK-P20 surfaces de facto held by boundary-routing 0.6.10) | `charter.md:263,267-268,425-426`; boundary-routing items-5-6 | **FIX** — mark deferred/dropped, record current holder | none |
| C-05 | SHOULD-FIX | Plan + loop queue wholly pre-RS-1 (rows/edges/wave labels) | `fk-p1-p21-dispatch-plan.md:44-50`; `loop-directive.md:384-407` | **FIX** | none |
| C-06 | SHOULD-FIX | Root workflow files unowned; FK-P18′ cannot express CI backstops without an ownership ruling (ADR-001 pins `test-plugin-install.yml`) | `charter.md:420-426`; `ADR-001-…:110-113` | **FIX** — name FK-P18′ owner of its CI backstop files in the resolution record | none |
| C-07 | SHOULD-FIX | `mutation-scope-guard/`, `hooks/`, `skill-injection/` have two claimants each, absent from §12 register | `charter.md:420-427`; boundary-routing items-5-6; scaffolder `p1-p7-reconciliation-2026-09-26.md` | **FIX** — add seams + one owner each before FK-P2/FK-P3 | rides Q4 |
| C-08 | INFO | FK-P2's spec-body grammar input is under active RCM-P2 writer (SPEC-CONVENTION v0.4) | `SPEC-CONVENTION.md:91-175`; `rcm-p2-scope-reconciliation-2026-09-27.md:29-55` | accept-as-documented — pin grammar revision for FK-P2 | none |
| C-09 | INFO | `templates/` three-way split; stale scaffolder hold (no in-scope FK parcel needs it) | scaffolder `loop-directive.md:15-16`; `pmc-wave1-release-2026-09-27.md:36-41` | informational | none |

## LENS-D A1/D21 latency contract

| ID | Sev | Finding | Evidence | Verdict | Gate effect |
|---|---|---|---|---|---|
| D1 | BLOCKER | RS-1.4(d)/(e) strip every A1 measurement obligation of its acceptance carrier and exclude §8 scenario 14 → exit acceptable with zero D21 measurement evidence | `fk-rescope-RS1-2026-09-27.md:16`; `charter.md:295,561-575,807` | **FIX** | scoped Gate 1: exit fragments + scenario 14 |
| D2 | BLOCKER | INF-5 Carriers text (FK-P16 implements, FK-P21 records) orphaned by RS-1.2; mediated span has no in-scope carrier | `charter.md:572-575,124`; `fk-rescope-RS1-2026-09-27.md:11` | **FIX** — rowed retarget (FK-P17′ measurer) or explicit deferral | scoped Gate 1: INF-5 carriers |
| D3 | SHOULD-FIX | Dispatch plan mis-assigns A1 measurement (FK-P16 row) and omits it from FK-P17′/P18′ rows | `fk-p1-p21-dispatch-plan.md:43-45` | **FIX** — documentation | none |
| D4 | INFO | Cold/warm accounting is adoptable today; residual is delegated design (P1-S14/S15) | `charter.md:570,124,206-213` | informational — FK-P1 adoption unblocked | none |

## LENS-E evidence sufficiency / gate mechanics

| ID | Sev | Finding | Evidence | Verdict | Gate effect |
|---|---|---|---|---|---|
| E1 | BLOCKER | RS-1.5 delegation contradicts four unamended binding carriers; executed twice (`a986b45`, `609c97f`) under the live prohibition; lacks D9's mechanically-authorized-distinct-identity condition | `fk-rescope-RS1-2026-09-27.md:18-20`; `charter.md:112,382-384,457`; `loop-directive.md:38` | **FIX** | same re-open as A1 |
| E2 | BLOCKER | §9 self-contradiction (RS-1.4 preamble vs items 1-9 as published registry rules) + §16 "required in full" | `charter.md:336-361,797`; `authority-enforcement-registry.yaml:1735` (`rule.fk-charter.e9ec57edc0a2`) | **FIX** | scoped Gate 1: §9 disposition under RS-1.4 |
| E3 | BLOCKER | RS-1.4(e) "where attributable" vs §8 "all scenarios": scenarios 5/10/13/14 lose exit demand AND carrier | `charter.md:295-332`; `fk-rescope-RS1-2026-09-27.md:16` | **FIX** | scoped Gate 1: RS-1.4(e) scenario set |
| E4 | BLOCKER | L5 INF obligations lose every named carrier (INF-4/5/6/7/8/1/3 + U1) with no reassignment | `charter.md:539-645,805-810`; `fk-p0-canon-authority-enforcement-registry.md:197` | **FIX** | scoped Gate 1: INF carriers (same as A3) |
| E5 | BLOCKER | FK-P0 registry cannot absorb RS-1-era edits without a separately reviewed corpus amendment + typed migration; live drift already exists (reproduced: generate crash `required evidence 'fk-charter:item.cd014d6d90c5' is missing`; sweep `LOCATOR_MISSING` from the consolidated-charter rename, `VALUE_DIGEST_MISMATCH` on `COORDINATOR-PATTERN.md`) | `authority-enforcement-registry.yaml:1735,3449-3452,3603-3606,21167-21173`; `authority-registry/src/generate.ts:12276,12966`; live run 2026-09-27 | **FIX** — dispatch the corpus adoption (R30 precedent) before verification claims cover new content | none (coordinator-dispatched, separately reviewed) |
| E6 | SHOULD-FIX | RS-1.4(d) "CI backstops green" has an unowned prerequisite (plugins `test` job failing every run) | `fk-wave3-4-marginal-value-2026-09-27.md:20` | **FIX** — name owner in FK-P18′ prerequisites | none |
| E7 | SHOULD-FIX | §14's pre-FK-P18′ independently reviewed U1 contract unmet (draft with 8 open choices) | `U1-evidence-contract-draft-20260907.md:3,181-193`; `U1-draft-review-20260907.md` | **FIX** — hold FK-P18′ on the existing §14 dependency | none |
| E8 | SHOULD-FIX | INF-4's external acts (runner provisioning, protection settings, image publication) ungranted with no named gate | `charter.md:539-557`; `U1-evidence-contract-draft-20260907.md:155-159` | **FIX** — name owner/external gate in FK-P17′/P18′ specs | none |
| E9 | SHOULD-FIX | Dispatch plan never reconciled with RS-1 (edges/INF claims) | `fk-p1-p21-dispatch-plan.md:39-48` | **FIX** | none |
| E10 | INFO | INF-6 discipline text-compliant; measured-use rows have no in-scope measurer (rides E4) | `charter.md:577-603,651` | informational | none |

## Coordinator synthesis — four Gate-1 questions presented to the owner

1. **Gate-3 delegation (A1/A2/E1/B11).** RS-1.5 is recorded in ledger L6 and has been exercised twice (`a986b45`, `609c97f`, both merges into the integration branch — not main), but contradicts D9's wording and the operative "never merge" records (loop SA6, §10/§13, registry `human-owned-nondelegated`). COORDINATOR-PATTERN does define a delegated "merge it" rule (green-chain contingent) implemented via a loop-directive standing authorization — the missing piece. Owner must ratify the delegation (and the record reconciliation) or withdraw it.
2. **INF/U1 carrier strands (A3/B2/B3/B4/D2/E4).** RS-1's deferrals/drops stranded L5-ratified obligations with no reassignment and no stranded-at-exit naming.
3. **Exit criterion text (B1/A4/B9/B12/E2/E3/D1).** §9 items 1-9 + §16 "required in full" vs the binding RS-1.4 fragments (including the silently dropped §8 scenario 14 / D21 measurement).
4. **FK-P2/FK-P3 contested surfaces (C-01/C-02/C-07).** RS-1.3's "fix the `surfaces:` input" claim needs sibling-owner windows that do not exist (RCM Window R; boundary-routing; scaffolder) — and narrowing FK-P2 to compiler-only is itself a scope change to RS-1.3.

## Gate-1 resolutions — owner rulings 2026-09-27

All four questions were disposed by the owner in the same conversation (never inferred):

| # | Question | Owner disposition | Recorded as |
|---|---|---|---|
| 1 | Gate-3 delegation (A1/A2/E1/B11) | **"Ratify scoped delegation"** — standing "merge it" authorization: coordinator merges fully-green chains into the integration branch only; main/PR merges, settings, deployment, destructive cleanup stay human; D9 amended; records reconciled; `a986b45`/`609c97f` retroactively confirmed | RS-2.1, ledger **L7** |
| 2 | INF/U1 carrier strands (A3/B2/B3/B4/D2/E4) | **"Reassign + strand-name"** — INF-5 measurement → FK-P17′; INF-8 in-scope fragments FK-P9/FK-P11; all remaining stranded obligations named unmet at exit as follow-on candidates | RS-2.2, L7 |
| 3 | Exit criterion text (B1/A4/B9/B12/E2/E3/D1) | **"RS-1.4 sole + annex"** — RS-1.4 (a)–(f) is the sole binding exit; §9 items/§16 preamble superseded as exit tests; exit annex lists every deferred parcel, the dropped FK-P20, and every stranded obligation (incl. §8 scenario 14 / D21) as NOT satisfied | RS-2.3, L7 |
| 4 | FK-P2/FK-P3 contested surfaces (C-01/C-02/C-07) | **"Sequence + narrow FK-P2"** — FK-P2 = compiler + hostile fixtures on FK-owned surfaces with pinned spec grammar; D10 wiring → follow-on FK-P2B after negotiated windows (RCM Window R, boundary-routing); FK-P3 queues behind the same negotiation | RS-2.4, L7 |

Instrument: `fk-rs2-gate1-reratification-2026-09-27.md`. Non-Gate-1 findings propagate per its RS-2.5; E5's corpus absorption is dispatched as amendment R32 with a separate independent review before FK-P1's verification chain is trusted.
