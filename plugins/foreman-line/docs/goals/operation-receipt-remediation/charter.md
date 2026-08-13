# Goal Charter — Operation Receipt Remediation

**Goal slug:** `operation-receipt-remediation`
**Coordinator:** Codex task `019ff142-0b35-7040-98c2-e36420c5f77b`
**Created:** 2026-08-12
**Mode:** Multi-Project Initiative
**Status:** RATIFIED — Gate 1 closed 2026-08-12
**Directive:** `COORDINATOR DIRECTIVE: OPERATION RECEIPT — REMEDIATION`, version 1.0, issued 2026-08-11
**Discovery snapshot:** `C:/Users/clint/.codex/visualizations/2026/08/11/019ff142-0b35-7040-98c2-e36420c5f77b/operation-receipt-stage-zero-discovery.md`

## Stage Zero ruling record

On 2026-08-12, Clinton Morgan explicitly approved all six Stage Zero recommendations:

1. treat Remediation v1.0 as the complete operational authority while the named parent v3.0 is unavailable;
2. keep mandatory Foreman control artifacts in an isolated `agent-skills` worktree and patent evidence/drafting logs in isolated `keon-docs-internal` worktrees;
3. grant Gate 2 standing dispatch authority for exactly OR-P01 through OR-P22, subject to dependencies and human rulings;
4. grant Gate 3 only for green-chain local integration into goal-owned branches/worktrees, with no push, PR, deployment, publication, or ordinary-local-`main` merge;
5. use PolicyHash schema `v2` as the external version identifier with the `keon.policyhash.v2` domain prefix and no redundant `hash_version` field; and
6. permanently accept both legacy `Cool` and current `Cold` on replay, emit only `Cold` for new artifacts, and perform no bulk migration of existing recordings.

This approval supplied the design inputs below. It did not itself close Gate 1.

On 2026-08-12, after the complete charter was presented, Clinton Morgan explicitly stated: **“Ratify the Operation Receipt charter at Gate 1.”** This ratified D1–D16, the OR-P01–OR-P22 decomposition, dependency graph, mechanism-ruling ownership, standing authorizations, exit criterion, and stop conditions as written. Any later change reopens Gate 1 only for the affected decision and downstream work.

## Objective

Bring the Keon codebase, doctrine artifacts, and evidence surface into a state where every mechanism entering the provisional specification is either file-level `CONFIRMED` or qualified `SPEC-ONLY`, with no unrecorded divergence between implementation and the text intended for filing.

The goal completes only when all seven G-2 mechanisms carry a ruling; every doctrine-versus-code divergence is reconciled or explicitly accepted; required builds and tests are independently green; all directive parcels are closed; every claim-adjacent drafting-log statement maps to a file path or a qualified `SPEC-ONLY` designation; and every applicable human ruling is recorded.

Specification drafting is not part of this goal. The drafting log is a claim-support and §112 self-check artifact, not the provisional specification.

## Consumers

- Clinton Morgan, sole inventor and ruling authority.
- Fresh Foreman shaping, builder, deterministic-verification, adversarial-review, and rework sessions.
- The later provisional-specification drafting process and registered patent practitioner.
- Keon doctrine, capability-registry, provenance, and evidence maintainers.

## In scope

- `keon-systems`: PolicyHash, ARO, Decision Receipt, Runtime spine, tenant enforcement, and Evidence Pack implementation.
- `keon.collective`: build integrity, Cognitive Heat, Dream Offerings, replay compatibility, Defense Packs, and Temporal Echo / Reality Boundary behavior.
- `keon-cortex`: causal-spine and tenant-enforcement confirmation where the implemented mechanism crosses the Runtime/Cortex boundary.
- `keon-evidence-vault`: evidence-vault reality and Evidence Pack confirmation.
- `keon-doctrine`: mechanical-claim reconciliation in `docs/whitepaper/WHITEPAPER_v2.0.md`.
- `keon-docs-internal`: patent evidence, doctrine reconciliation records, conception provenance, and drafting log.
- `omega-docs-internal`: only exact doctrine/capability artifacts identified during shaping.
- `keon-openclaw`: manual remote-visibility and local-history verification under OR-P22.
- Any SDK repository only to the extent required to record R-4 truth; no SDK license or publication change is authorized.

## Out of scope

- Drafting or filing a provisional or non-provisional patent application.
- Pushing any branch or commit to any remote.
- Opening or updating pull requests.
- Publishing, deploying, distributing, releasing, or registering a package.
- Modifying any `LICENSE` file.
- Rewriting Git history or removing truthful AI co-authorship trailers.
- Executing an IP assignment or changing an SDK license posture without the separate R-4/R-5 rulings.
- Unrelated cleanup in dirty repositories, old worktrees, or adjacent mechanisms.
- Weakening any fail-closed path.

## Proposed locked decisions — Gate 1 decision list

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | Remediation v1.0 is the complete operational authority for this goal. A requirement found only in the unavailable parent `Operation Receipt v3.0` is non-operative until Clinton supplies or separately ratifies it. Current repository state and the directive outrank historical summaries. | Prevents an unavailable document or memory-derived assumption from silently expanding scope while preserving a clean amendment path. |
| D2 | The seven G-2 mechanisms are: (1) PolicyHash / `PolicyEvaluationRecord`; (2) Authoritative Receipt Outbox; (3) Cognitive Heat; (4) Temporal Echo / Reality Boundary collapse; (5) Decision Receipt + causal spine; (6) Evidence Pack; and (7) tenant enforcement. | This reconciles the six Wave 2 rows with the seven-mechanism list in the current patent adjudication. |
| D3 | Foreman is the coordination method, not the patent or implementation system of record. Foreman charter, loop, specs, findings, and state views live in the goal-owned `agent-skills` worktree. Mechanism evidence and drafting logs live in goal-owned `keon-docs-internal` worktrees. Implementation remains in each owning repository. | Preserves repository ownership, avoids parallel truth, and keeps the heavily dirty shared checkouts untouched. |
| D4 | The publication freeze is absolute for this goal: no push, PR, publication, deployment, distribution, package release, or `LICENSE` modification. Local commits are pathspec-scoped. No ordinary local `main`, `master`, or shared branch receives a merge. | Implements C-1 through C-4 and the approved local-only Gate 3 boundary. R-1 is therefore recorded as “do not push under this goal.” |
| D5 | New PolicyHash issuance uses `PolicyEvaluationRecord.SchemaVersion = "v2"` as the sole external version identifier and prepends the exact domain bytes for `keon.policyhash.v2` to the hash preimage. No redundant `hash_version` field is introduced. Historical `v1` hashes retain their old meaning and must never be silently reinterpreted using the v2 preimage. Unknown versions fail closed. | Makes the domain-separation change an explicit versioned break, keeps one version axis, and prevents old evidence from being re-labeled. |
| D6 | `HeatThresholdState` emits `Cold`, `Warm`, `Hot`, `Critical` for new artifacts. Replay accepts both legacy `Cool` and current `Cold`; old recordings are not bulk-migrated. New heat-event IDs and Defense Packs use `Cold`, while existing IDs remain historical facts. | Preserves replay and provenance, avoids rewriting historical evidence, and gives doctrine one current vocabulary. |
| D7 | No behavioral change may weaken a fail-closed path. Uncertainty remains deny/invalid; missing review or unverifiable lineage cannot become permit; Cognitive Heat promotion to `Critical` remains immediate; hysteresis may delay cooling only. | Carries C-7 and the directive's Critical-latency requirement through every implementation and review. |
| D8 | Every OR parcel receives an exact Allowed Files spec before dispatch. Every repository mutation uses one parcel-owned branch and worktree based on an explicitly recorded local commit. Cross-repository parcels use separately named repo-local lanes under one OR parent and never share a worktree. Dirty ambient checkouts are read-only. Commits are pathspec-scoped and every write is read back. | Applies PDD isolation and C-4/C-5 without pretending a multi-repo parcel can inhabit one Git worktree. |
| D9 | The Coordinator never supplies the verification evidence it consumes. Fresh sessions produce build/test claims; the Coordinator closure-checks those claims against disk before any deterministic rerun. Architecture, crypto, replay, tenancy, evidence, legal/doctrine, and claim-surface parcels receive two independent frontier adversarial reviews; standard build/evidence parcels receive one. | Enforces Coordinator ≠ Verifier and samples review variance on every load-bearing surface. |
| D10 | Wave 0 is a hard barrier: OR-P01 and OR-P02 run first and in parallel, and no later parcel dispatches until both are independently green. OR-P11 additionally depends on OR-P04 because ARO cannot be frozen before backend parity is corrected. The directive's literal OR-P13 dependency on OR-P06/P07/P08 is preserved even though its stated heat-paragraph rationale appears mismatched; the mandatory plan review must adjudicate that edge before loop generation. The Cognitive Heat ruling is a composite closure artifact after OR-P06/P07/P08; OR-P09 remains required for goal closure but is not filing-blocking. | Prevents confirmation against uncompilable or soon-to-change code, closes the otherwise missing seventh-ruling vehicle, and exposes rather than silently repairs the directive's suspicious hard edge. |
| D11 | Each mechanism ruling is exactly one of `CONFIRMED`, qualified `SPEC-ONLY`, or `EXCLUDED`. `CONFIRMED` requires enumerated file-level implementation and test evidence plus applicability limits. `SPEC-ONLY` names every unsupported portion and must not imply implementation. `EXCLUDED` requires Clinton's R-6 ruling. Once a ruling and drafting-log entry are frozen, any code or doctrine change triggers a logged re-confirmation cycle. | Makes the directive's evidence vocabulary fail-closed and enforces C-6. |
| D12 | Doctrine reconciliation changes text to match verified mechanism reality; it does not change code merely to preserve marketing wording. Every mechanical whitepaper statement is mapped to evidence or marked `SPEC-ONLY`. Undisclosed strengths are inventor-review assets, not automatically adopted filing claims. No specification prose is drafted. | Corrects the established pattern of absolute marketing language outrunning implementation without turning this remediation into drafting. |
| D13 | Durable operational state uses a local SQLite coordinator database in the task's private artifact workspace; human-reviewable Foreman Markdown is committed only on the goal-owned local branch. Patent evidence/drafting artifacts are committed only in exact-path, goal-owned `keon-docs-internal` worktrees. Generated views are not hand-edited. | Satisfies Initiative Coordination persistence while keeping binary/runtime state out of product repositories and preserving dirty work. |
| D14 | Gate 2 standing dispatch authorization is granted for exactly OR-P01 through OR-P22 in the ratified dependency order. It covers shaping, builder, verifier, reviewer, and bounded rework sessions for those parents. It does not cover a new top-level parcel, a new outward action, or a scope amendment outside exact Allowed Files. | Records Clinton's approved dispatch scope without allowing discovery to become silent expansion. |
| D15 | Gate 3 standing authorization is granted only for a parcel whose complete chain is green and only to locally integrate its reviewed commits into a goal-owned local integration branch/worktree. It never authorizes push, PR creation/update, deployment, publication, package release, or merge into an ordinary local default/shared branch. Dirty documentation repositories require an exact-path integration plan and clean goal-owned worktree before any local merge. Any red, unknown, skipped mandatory check, disputed finding, or scope amendment voids Gate 3 for that parcel. | Preserves a usable local integration path without breaching the publication freeze or contaminating user work. |
| D16 | Human rulings are recorded distinctly: R-1 = no push under this goal; R-2 and R-3 = resolved by D5/D6; R-4 (SDK Apache-2.0 posture) and R-5 (assignment timing) remain pending human decisions and stop only work that would depend on them; R-6 is required if any mechanism returns `EXCLUDED`. No agent infers R-4, R-5, or R-6. | Keeps unrelated legal decisions from blocking orthogonal local evidence work while preventing the Coordinator from ruling on inventor/legal authority. |

## Project tracks

| Track | Repository / location | Role | Initial state |
|---|---|---|---|
| Foreman control plane | `D:/Repos/agent-skills-worktrees/operation-receipt-remediation-20260812` | Charter, specs, dispatches, review findings, loop state | clean goal-owned branch at `ec8b6e9` |
| Runtime/contracts | `D:/Repos/keon-omega/keon-systems` | PolicyHash, ARO, Decision Receipt, Runtime spine, tenant and Evidence Pack code | clean `main` at `2b6c755`; local-only commits ahead of remote |
| Collective cognition | `D:/Repos/keon-omega/keon.collective` | build, heat, Dream Offerings, replay, collapse, Defense Pack vocabulary | clean local `temp` at `c42230c` |
| Cortex | `D:/Repos/keon-omega/keon-cortex` | cross-repo spine and tenant evidence | dirty ambient checkout; must use isolated worktree |
| Evidence vault | `D:/Repos/keon-omega/keon-evidence-vault` | separate vault truth and Evidence Pack applicability | clean; README + protected license only at discovery |
| Doctrine | `D:/Repos/keon-omega/keon-doctrine` | whitepaper mechanical claims | dirty ambient checkout; tracked whitepaper unchanged at discovery |
| Patent/evidence docs | `D:/Repos/keon-omega/keon-docs-internal` | rulings, divergences, provenance, drafting log | heavily dirty ambient checkout; `patents/` untracked |
| Omega internal docs | `D:/Repos/keon-omega/omega-docs-internal` | capability/doctrine artifact only when exact path is found | heavily untracked ambient checkout |
| OpenClaw | `D:/Repos/keon-omega/keon-openclaw` | OR-P22 history/filesystem/remote visibility split | one committed-history premise plus substantial untracked implementation at discovery |

## Wave and parcel decomposition

All rows are parents authorized by D14. Shaping may split a cross-repository parent into exact repo-local lanes, but may not create a new top-level objective.

| Parcel | Output | Risk / routing | Depends on |
|---|---|---|---|
| OR-P01 | Independent `keon-systems` build plus the three named ARO test suites, with commit/environment/test-count evidence | elevated; frontier verifier; dual review of evidence sufficiency | Gate 1 |
| OR-P02 | `keon.collective` compiles, its suite executes, and every failure is enumerated and triaged | elevated / architecture-risk; frontier builder; dual review | Gate 1 |
| OR-P03 | PolicyHash v2 domain separation, versioned vectors, four suites, and red-team 01–03 | critical / architecture-risk/crypto; frontier; dual review | OR-P01 + OR-P02 barrier |
| OR-P04 | In-memory and SQLite ARO idempotency verification parity with shared mismatch contract tests | critical / architecture-risk/security; frontier; dual review | OR-P01 + OR-P02 barrier |
| OR-P05 | Shadow ARO worktree divergence proven reconciled or safely retired, with no unlabeled load-bearing copy | elevated / repository-integrity; frontier; dual review | OR-P01 + OR-P02 barrier |
| OR-P06 | Independent quiescence signal drives Dream Offerings without Heat coupling and preserves CH-3 | critical / architecture-risk; frontier; dual review | OR-P02 + OR-P01 barrier |
| OR-P07 | `Cool`→`Cold` emission plus permanent dual-label replay compatibility and Defense Pack/doctrine vocabulary alignment | critical / architecture-risk/replay; frontier; dual review | OR-P02 + OR-P01 barrier |
| OR-P08 | The reason-count classifier is renamed/folded so exactly one implemented concept is named Cognitive Heat | elevated / architecture-risk/doctrine; frontier; dual review | OR-P07 |
| OR-P09 | Dual-threshold hysteresis and minimum dwell delay cooling only; oscillation stable; Critical promotion immediate | critical / architecture-risk/safety; frontier; dual review | OR-P02 + OR-P01 barrier |
| OR-P10 | Complete typed/nullability inventory of the actual `PolicyEvaluationRecord` hash input and quantified whitepaper divergence | elevated / evidence/claim surface; frontier reviewer; dual review | OR-P03 |
| OR-P11 | ARO lease/crash recovery, conflict, apply-failure, and duplicate-effect prevention evidence closes §4 | critical / architecture-risk/persistence; frontier; dual review | OR-P04 |
| OR-P12 | Temporal Echo / Reality Boundary ruling covers IDs, ancestry, winner record, atomic collapse, stale/concurrent rejection, and cache invalidation | critical / architecture-risk; frontier; dual review | OR-P02 + OR-P01 barrier |
| OR-P13 | Decision Receipt + Spine ruling covers envelope, nonce/time, sequence/partition ordering, conflicts, causal parents, and crypto agility | critical / architecture-risk/crypto; frontier; dual review | OR-P01, OR-P02, OR-P06, OR-P07, OR-P08 |
| OR-P14 | Evidence Pack ruling covers schema, trust anchors, offline algorithm, missing artifacts, chain recomputation, verifier versioning, and vault applicability | critical / architecture-risk/evidence; frontier; dual review | OR-P01 + OR-P02 barrier |
| OR-P15 | Tenant ruling enumerates derivation, object-reference rejection, enforcement call sites, cache/admin paths, and tenant-bound idempotency | critical / security/tenancy; frontier; dual review | OR-P01 + OR-P02 barrier |
| OR-P16 | Whitepaper sweep maps every mechanical claim to code/test evidence or qualified `SPEC-ONLY`, including all known divergences | critical / legal/doctrine/public-claim; frontier; dual review | all seven mechanism rulings |
| OR-P17 | Undisclosed-strength inventory with file evidence, applicability limits, and no automatic claim adoption | elevated / IP evidence; frontier; dual review | all seven mechanism rulings |
| OR-P18 | Located capability registry becomes schema-versioned, status-split, dated, and fail-closed; absent registry is reported rather than invented | critical / governance truth; frontier; dual review | all seven mechanism rulings |
| OR-P19 | Contradictory BSL/Apache compliance report is retired or reconciled without touching any `LICENSE` | critical / legal/doctrine; frontier; dual review | all seven mechanism rulings; R-4 if SDK posture changes |
| OR-P20 | Conception Provenance Log reconstructs dated human rulings, alternatives, corrections, and overrides per mechanism | critical / inventorship/IP provenance; frontier; dual review | OR-P16–OR-P19; R-5 if assignment language is implicated |
| OR-P21 | Drafting log maps every claim-adjacent statement to exact file evidence or qualified `SPEC-ONLY`, with no unmapped statements | critical / §112/claim support; frontier; dual review | OR-P16–OR-P20 |
| OR-P22 | Manual read-only verification distinguishes OpenClaw committed history, dirty filesystem state, and remote visibility | elevated / external-state evidence; frontier reviewer; single independent review | OR-P16–OR-P19 |

## Dependency graph

```text
Gate 1
  -> OR-P01 || OR-P02
OR-P01 + OR-P02 green
  -> OR-P03, OR-P04, OR-P05, OR-P06, OR-P07, OR-P09
OR-P07 -> OR-P08
OR-P03 -> OR-P10
OR-P04 -> OR-P11
OR-P02 -> OR-P12
OR-P01 + OR-P06 + OR-P07 + OR-P08 -> OR-P13
OR-P01 -> OR-P14, OR-P15
OR-P06 + OR-P07 + OR-P08 -> Cognitive Heat composite ruling
OR-P10 + OR-P11 + OR-P12 + OR-P13 + OR-P14 + OR-P15 + Cognitive Heat ruling
  -> OR-P16, OR-P17, OR-P18, OR-P19
OR-P16 + OR-P17 + OR-P18 + OR-P19 -> OR-P20
OR-P16 + OR-P17 + OR-P18 + OR-P19 -> OR-P22
OR-P20 -> OR-P21
OR-P09 is required before goal exit but has no filing-readiness dependency edge.
```

## Mechanism ruling owners

| Mechanism | Ruling vehicle | Corrections that must be frozen first |
|---|---|---|
| PolicyHash | OR-P10 | OR-P03 |
| ARO | OR-P11 | OR-P04 |
| Cognitive Heat | Composite ruling artifact produced after OR-P06/OR-P07/OR-P08 | OR-P06, OR-P07, OR-P08; OR-P09 separately required for goal closure |
| Temporal Echo / Reality Boundary | OR-P12 | build barrier; any discovered heat/collapse collision stops for amendment |
| Decision Receipt + Spine | OR-P13 | directive's literal OR-P06/OR-P07/OR-P08 edge preserved pending plan review |
| Evidence Pack | OR-P14 | build barrier and evidence-vault applicability inventory |
| Tenant enforcement | OR-P15 | build barrier and cross-repo call-site inventory |

## Standing authorizations

1. **Gate 2 — GRANTED for exactly OR-P01 through OR-P22.** Dispatch occurs only after Gate 1, mandatory plan review, shaping, Coordinator factual lint, dependency satisfaction, exact Allowed Files, named worktree/branch, and a Step 0 restate-and-stop gate. New top-level work or a product/legal decision is not covered.
2. **Gate 3 — GRANTED for green-chain local integration only.** The target must be a goal-owned local integration branch/worktree. Any red, unknown, skipped mandatory check, unresolved or disputed finding, tripwire, or unratified amendment voids the authorization. No default/shared local branch is a permitted target.
3. **External actions — NOT GRANTED.** No push, PR, publication, deployment, distribution, package release, filing, assignment execution, customer/third-party communication, or `LICENSE` modification.

## Verification and evidence requirements

- Every completion claim identifies parcel ID, source and target commit(s), branch/worktree, exact files touched, exact commands, environment/toolchain, passing and failing test counts, and artifacts.
- The Coordinator checks the claim against disk before any rerun.
- Deterministic verification is performed by an independent session in the repository's required environment; environment-specific evidence is never generalized.
- Every architecture/risk parcel receives two independent frontier adversarial reviews with hostile-input probing licensed. Reviewers never fix or commit and end with a clean-worktree assertion.
- Rework starts with its own Step 0 gate and a pre-recorded test-count tripwire.
- A newly discovered divergence is reported as a finding and is not silently absorbed into the parcel.
- Wrong-shaped or incomplete evidence is presumptively empty.
- A produced artifact requirement is satisfied only by the real artifact, not a fixture imitating it.

## Exit criterion

This goal is complete only when current evidence proves all of the following:

1. OR-P01 and OR-P02 are independently green at their recorded commits and every later changed build/test surface is green at its final local integration commit.
2. OR-P03 through OR-P09 are closed, including shadow-worktree reconciliation, v2 PolicyHash, ARO parity, independent quiescence, `Cold` compatibility, one Cognitive Heat vocabulary, and fail-closed hysteresis.
3. All seven mechanism rulings exist with the D11 vocabulary, exact file/test evidence, applicability limits, and any required R-6 decision.
4. Every mechanical whitepaper/doctrine statement is traced to current implementation evidence or marked qualified `SPEC-ONLY`; every accepted divergence is explicit.
5. The capability-registry truth pass is completed against the actual located registry, or absence is escalated and resolved by Clinton rather than papered over with a new unratified registry.
6. The contradictory license-compliance report is reconciled or retired without changing a `LICENSE` file and without inferring R-4.
7. The Conception Provenance Log contains one section per confirmed mechanism and clearly distinguishes human conception/rulings from AI-assisted implementation history.
8. The drafting log contains no unmapped claim-adjacent statement and uses only exact file evidence or qualified `SPEC-ONLY` designations.
9. OpenClaw committed history, local filesystem state, and remote visibility are separately verified and recorded.
10. All parcel specs, handoffs, evidence indexes, review findings, triage records, local commits, and Stage F closures are complete; the coordinator database and generated views agree with repository reality.
11. R-4 and R-5 are recorded before any output that depends on SDK posture or assignment timing is finalized; R-6 is recorded for every `EXCLUDED` result.
12. No prohibited push, publication, deployment, distribution, package release, history rewrite, default-branch merge, fail-open weakening, or `LICENSE` modification occurred.

## Stop conditions

Stop and return to Clinton when:

- a requirement depends on unavailable parent-v3.0 text;
- R-4, R-5, or R-6 becomes load-bearing;
- a proposed result is `EXCLUDED` without R-6;
- a fail-closed path would weaken or Critical promotion would be delayed;
- a frozen mechanism needs to change without a logged re-confirmation cycle;
- a parcel needs a file outside exact Allowed Files or a new top-level parcel;
- implementation would touch a dirty ambient checkout;
- a contract/version/migration question is not resolved by D1–D16;
- a security, tenancy, crypto, inventorship, legal, or evidence boundary is unclear;
- a capability registry cannot be located or its ownership is ambiguous;
- a new doctrine divergence is discovered outside the active parcel;
- a tripwire fires twice on one parcel;
- an adversarial security finding cannot close in-parcel;
- any mandatory check is unknown, skipped, or not reproducible;
- a timed-out Docker MCP gateway call would need retry;
- any outward-facing action or default/shared-branch merge is proposed; or
- the queue is empty, in which case the Coordinator performs the full exit audit rather than inferring completion.

## Gate 1

**CLOSED — RATIFIED 2026-08-12.** Clinton Morgan explicitly ratified D1–D16, the wave/parcel decomposition, dependency graph, mechanism-ruling ownership, standing authorizations, exit criterion, and stop conditions. The mandatory fresh plan-level adversarial review is the next step. If its triage changes a locked decision, Gate 1 reopens only for that decision and the downstream work it blocks.
