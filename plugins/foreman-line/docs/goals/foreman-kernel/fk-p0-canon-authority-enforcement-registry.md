# FK-P0 — Canon authority and enforcement registry (live-tree execution)

**Parcel:** FK-P0 (charter §6, Wave 0 — "Canon authority and enforcement registry")
**Date:** 2026-09-26
**Routing class:** `architecture/risk` (charter: critical / architecture-risk)
**Status:** docs-level execution complete; code-level registry accepted at R31 and
Gate-3-pending (see §8) (superseded: FK-P0 Gate-3 merges complete 2026-09-27 on
`reconcile/refresh-actions`, `a986b45`/`609c97f`, under RS-2.1)
**Authority basis:** coordinator decision 2026-09-26 under owner blanket authority

FK-P0's charter outcome is reconnaissance/consolidation: "Reconciles operative
gate/authority statements; defines the structured constraint taxonomy and operation
authority matrix; inventories every standing rule by enforcement destination." This
document is that outcome for the live tree. It carries FK-P0's INF obligations
(INF-3, INF-5, INF-7). Evidence citations and the claim-by-claim delta live in
`fk-reconciliation-2026-09-26.md`; downstream dispatch is planned in
`fk-p1-p21-dispatch-plan.md`.

## 1. Operative gate/authority statement reconciliation

| Grant / authority | Operative? | Evidence | Disposition |
|---|---|---|---|
| Gate 1 charter ratification (2026-08-31, "Ratify Gate 1 and authorize Gate 2 dispatches") | Yes | commit `c4bf00f6fde9058e1350898914e06f261ae38c93` (verified in clone 2026-09-26) | Historical grant, in force; not re-requested |
| Plan-review triage (2026-08-31, six BLOCKERs, seven SHOULD-FIX; R1–R13 scoped re-open) | Yes | commit `a9a48b5656c3ce3837781c962a6ee00035d7f3c6` (verified) | Findings consumed into the amended graph |
| Gate 1 re-ratification (2026-08-31, "Re-ratify Gate 1 amendments R1–R13 and resume Gate 2") | Yes | commit `26fb2b56e4861b6122a95f1d413394c0dcd3b4a1` (verified) | D1–D20 + amended graph/exits binding |
| Standing Gate 2 dispatch grant for FK-P0–FK-P21 | Yes | charter §10; branch `loop-directive.md` "Ratified authority" list; no revoking amendment found | Void for any parcel whose spec changes a locked decision, widens external effects, or omits exact Allowed Files |
| Gate 3 merge | Human-owned, not delegated | charter §10; D9 | Every merge is a human action; nothing in this goal may manufacture its satisfaction |
| ADR review recommendations INF-1–INF-8 (2026-09-07, "Your recommendations are ratified, as written.") | Yes | charter §14 (consolidation, landed `8b3733b` 2026-09-14); `ADR-001-runtime-infrastructure-posture.md` carries "Ratified as written by Clint Morgan - 09/01/2026" | Carriers mapped in charter §16; see §5–§6 here |
| A1 latency-budget draft | Partially — see `fk-reconciliation-2026-09-26.md` §2 | recovered commit `c654c047…` (verified); `amendment-A1.8-ratification-ledger.md` on FK branches | Anchors recorded, not adopted as contract; no decision ID assigned |
| Unattended continuation authority (2026-09-07) | Branch-scoped | `authorization-20260907-unattended.md` on `codex/fk-p0-r31-source-adoption-20260907`; Git publication only | Covers the FK branches' publication; grants no deployment/spend/credentials/repo-settings authority |
| Owner blanket authority (2026-09-26) | Yes | this wave's assignment | Gate questions decidable by the coordinating session; recorded per decision below (§9) |

No operative statement grants agent-callable approval, independent-verification, merge,
or closure authority (D5, §7). Nothing found in the repo supersedes the ratified
authority set above.

## 2. Structured constraint taxonomy

Every constraint the kernel or its neighbors enforce belongs to exactly one class. Each
class names its enforcement destination(s) and the retirement standard it must satisfy
before leaving the agent reading path (D11: deterministic predicate exists → negative
test proves refusal → existing corpus swept → independent bypass attempt fails; then
provenance moves to the lessons record).

| Class | Subject | Deterministic predicate lives in | Refusal codes (initial) | Enforcement destination | Retirement evidence |
|---|---|---|---|---|---|
| A. Path/scope | Exact non-glob Allowed Files; frozen/forbidden surfaces; `surfaces:` is routing/audit metadata only (D10) | FK-P2 spec-body compiler output | `PATH_OUTSIDE_ALLOWED_FILES`, `FROZEN_SURFACE_MUTATION` | Kernel policy refusal (pre-action) + post-diff realpath-aware Git detection + CI (D13) | Predicate + negative tests + corpus sweep + bypass failure |
| B. Worktree/branch identity | The governed worktree and branch for the session | `authorizeAction` inputs (FK-P12) | `WORKTREE_MISMATCH`, `BRANCH_MISMATCH` | Kernel policy refusal | same |
| C. Role posture | Reviewer sessions mutate nothing; review worktree must be clean | compiled role posture (FK-P12) | `REVIEWER_MUTATION_FORBIDDEN`, `REVIEW_WORKTREE_DIRTY` | Kernel policy refusal; reviewer fail-closed on opaque mutation-capable shell (D13) | same |
| D. Policy integrity | No self-modification of policy; no mediated-bypass mode | policy digest binding (FK-P12) | `POLICY_SELF_MODIFICATION`, `MEDIATED_BYPASS_MODE_FORBIDDEN` | Kernel policy refusal | same |
| E. State/gate | Leases, revisions, gate satisfaction | SQLite ledger + transition engine (FK-P10) | `OWNER_LEASE_MISMATCH`, `STATE_REVISION_STALE`, `GATE_NOT_SATISFIED` | Kernel policy refusal; human-gate state is evidence-derived (D9) | same |
| F. Mediation coverage | Hook/session enrollment, disabled hooks, ignored frontmatter, launch outside governed adapter | enrollment heartbeat + CI | none — **detected-only** | Heartbeat + CI (D7, D13); never counted as a hook refusal | n/a (permanent detected-only control) |
| G. Semantic quality | Typed boundary errors, hostile fixtures, linear-time parsing, mutation-test quality, naïve-reading review | linters, CI scanners, mutation harness, review practice | n/a | Deterministic linter / CI / mutation-harness / independent review; hooks may trigger but do not prove from an invocation (charter §5) | linter rule + CI + sweep |
| H. Authority/minting | No tool may mint approval, independent-verification, merge, or closure authority | contract design (D5/D6); control-surface admission (D3) | control-surface admission refusal | Contract + review + admission binding | never retired — structural boundary |
| I. Read confidentiality | Content-only default; admitted reads are repoId+exact-relpath inside one mounted read-only root; no host paths, symlinks/reparse, non-regular files, over-limit files | capability-bound repository reader (D19) | read-capability refusals (FK-P1 codes) | Kernel read surface + container isolation | same as A–E |
| J. Evidence honesty | Structural receipts labeled structural; no overclaim of cryptographic/Gate-3 readiness | tool assurance labels (D6/D17) | structured advisory/refusal | Contract + independent review | n/a |

## 3. Operation authority matrix

| Operation | Permitted principal | Authority basis | Denial / limit | Enforcement destination |
|---|---|---|---|---|
| Read-only MCP: submit bounded content | anonymous verifier | D17/D19 | payload limits; content-only | read-only catalog (FK-P6) |
| Read-only MCP: admitted repository read | anonymous verifier + admission-bound `repoId` | D19 | exact relative path, one mounted read-only root, canonical containment, symlink/reparse refusal, regular-file check, byte limits; arbitrary host paths forbidden | capability-bound reader (FK-P4) + container (FK-P7) |
| Control MCP: get / claim / renew / release / transition / evidence / project | authenticated host-local capability, mechanically distinct principal | D3/D15/D17 | anonymous verifier clients cannot list or call these tools; every request digest-bound and idempotency-bound | control catalog (FK-P13) |
| `authorizeAction` decisions | kernel policy engine (not hooks, not handlers) | D12/D18 | policy refusal is a structured success; protocol/kernel failure is an MCP error | FK-P12 over golden lifecycle vectors |
| Hook lifecycle (SessionStart/PreToolUse/PostToolUse/Stop) | thin Claude adapter (D20 matrix) | D7/D8/D12/D13 | shadow mode first; fail-closed governed mutation only after CI backstops green; degraded read-only mode recorded | FK-P16 adapter + FK-P19 promotion |
| SQLite ledger writes (events, leases, revisions, projections) | lease/transition engine only | D14 | single-writer leases, CAS revisions, idempotency bound to input digests, append-only events; divergence stops, never overwrites | FK-P9/FK-P10 |
| Git canon writes (charters, specs, policies, reviews, gate artifacts) | human/coordinator via Git | D2 | kernel tools never write canon; Git wins ratification and human-gate facts | Git + human Gate 3 |
| Human-gate satisfaction | human only | D9 | evidence-derived from digest-bound Git artifacts; written as operational state only via the digest-bound path; `REQUIRE_HUMAN` yields stop reports, not loops | FK-P11/FK-P12 |
| Receipt tools | structural labels only | D5/D6 | no minting of Gate-1 approval, independent-verification, merge, or closure authority; no generic `mintReceipt` | contract (FK-P1) + review |
| External systems (Jira, SCM, cloud, signing, Docker socket) | **nobody** | D15, §7 | no credential in the container; no external mutation; no socket mounts | image composition (FK-P7/FK-P14) |
| Markdown projection writes | projection engine | D14 | deterministic views; divergence-stop on field-level authority matrix | FK-P11 |
| Legacy routing/skill recorders | compatibility adapters over pure decisions | D16 | pure decision functions do no I/O; recorders separately authorized | FK-P3 (seam: `dispatch/`, `routing-policy/` contested) |
| Container filesystem | non-root runtime | D15/D19 | read-only root fs; repo mount read-only and capability-bound; read surface cannot access state volume | FK-P7/FK-P14 |
| Backup / restore / migrations | operator, per FK-P9/FK-P14 contracts | INF-8 | restore must not silently restart dispatch; stale leases/authorizations/duplicate owners refused | FK-P9/FK-P14/FK-P15 |

## 4. Standing-rule inventory by enforcement destination

The standing-rule corpus, as enumerable from the live tree on 2026-09-26:
`docs/kickstarters/STANDING-CONSTRAINTS.md` (14 rules, each earned on a numbered
defect), the charter's locked decisions D1–D20, and INF-1–INF-8. One row per rule;
destination is where the rule is actually enforced or recorded.

### 4a. STANDING-CONSTRAINTS.md

| Rule | Substance | Enforcement destination |
|---|---|---|
| B1 (#22) | Typed try-catch at every external boundary a public API exposes | code review + typecheck/lint (class G); tests |
| B2 (#28) | Untested seams return `unknown`; normalize at the boundary | typecheck + review (class G) |
| B3 (#30) | Default-deny gates test every structural invariant independently | shipped test suite (class G) |
| B4 (#31) | Sanitize interpolated external data before line-based protocols | CI scanners (CodeQL) + tests (class G) |
| B5 (#19) | Linear-time string handling on untrusted text | CI (CodeQL polynomial-redos) + hostile tests (class G) |
| B12 (#34) | Parcel-time freezes live in the deterministic pass, not the shipped suite | coordinator Stage-D/E deterministic pass (class G); shipped tests pin invariants, not bytes |
| B13 (#36) | Allowlists/waivers pin identity, location, and value | shipped tests per axis (class G) |
| B6 (#29) | Classifier fixtures cover dominant naming conventions; under-detect first for safety | test fixtures + review (class G) |
| B7 (#23) | Kompress content-length probe; over-threshold is a coordinator stop condition | coordinator process rule (human/coordinator ruling) |
| B14 (#37) | Plugin/marketplace installs verified through the declared marketplace entry | verification step in packaging parcels (class G) |
| R8 (#12) | Hostile-input probing is licensed for reviewers | reviewer practice (independent review) |
| R9 (#14) | Prose-only contracts: attempt the naïve reading | reviewer practice (independent review) |
| R10 (#24) | Post-review git-detection control on reviewer worktree | reviewer practice + CI (class F adjacent) |
| R11 (#32) | Mutate the fixture to prove each assertion binds to its named invariant | reviewer practice (independent review) |

### 4b. Locked decisions D1–D20

| Decision | Enforcement destination |
|---|---|
| D1 goal separation | charter/Gate-1 authority (this registry) |
| D2 Git canon vs SQLite operational authority | FK-P9/FK-P11 field-level authority matrix; divergence-stop |
| D3 trust core / read-only / control / adapter split + distinct local capability | FK-P1 admission contract, FK-P13 control catalog — carrier deferred (FK-P12/P13/P16) or dropped (FK-P20) per RS-1; decision fragment named in the RS-2.3 exit annex (B5) |
| D4 bounded first-release scope | charter exit criteria; review — carrier deferred (FK-P12/P13/P16) or dropped (FK-P20) per RS-1; decision fragment named in the RS-2.3 exit annex (B5) |
| D5 no generic `mintReceipt`; no authority minting | contract (FK-P1) + review + admission |
| D6 receipt tools structural-only labels | tool schemas (FK-P1/FK-P4) |
| D7 one portable MCP contract; first adapter Claude Code; enrollment detection | FK-P16/FK-P20; heartbeat + CI (class F) — carrier deferred (FK-P12/P13/P16) or dropped (FK-P20) per RS-1; decision fragment named in the RS-2.3 exit annex (B5) |
| D8 shadow mode first; fail-closed governed mutation after CI green | FK-P16/FK-P18/FK-P19 promotion gates |
| D9 human gates preserved; evidence-derived satisfaction | FK-P12 gate evidence; REQUIRE_HUMAN stop reports |
| D10 exact Allowed Files compiled; `surfaces:` never mutation permission | FK-P2 compiler (class A) |
| D11 rule-retirement standard | this registry (retirement columns) + FK-P19 sweeps + FK-P21 manifest |
| D12 hooks are adapters; policy lives in the kernel | FK-P12 owning engine; review of FK-P16 |
| D13 pre-action checks backed by post-diff + CI; reviewer fail-closed on opaque shell | FK-P18 CI backstops + FK-P16 obligations |
| D14 SQLite WAL operational state; migration/idempotency/lease semantics | FK-P9/FK-P10 contracts and tests |
| D15 no external credentials; narrow host-local control capability | FK-P7/FK-P14 image composition; D15 tests — carrier deferred (FK-P12/P13/P16) or dropped (FK-P20) per RS-1; decision fragment named in the RS-2.3 exit annex (B5) |
| D16 split mixed functions before exposure | FK-P3 pure decisions + recorders |
| D17 versioned schemas, stable refusal codes, digests, assurance levels | FK-P1 contract + parity tests (FK-P6) |
| D18 `authorizeAction` is a dedicated engine | FK-P12 — carrier deferred (FK-P12/P13/P16) or dropped (FK-P20) per RS-1; decision fragment named in the RS-2.3 exit annex (B5) |
| D19 content-only reads; capability-bound repo reads | FK-P4 reader + FK-P6 schema limits |
| D20 D20 platform matrix; no unproven host claims | FK-P17/FK-P20/FK-P21 evidence binding |

### 4c. Infrastructure requirements INF-1–INF-8

| Requirement | Enforcement destination / carrier |
|---|---|
| INF-1 platform proof vs development vs future hosting separation | FK-P1 assurance semantics; FK-P7/P14 deployment; FK-P16/17 Windows proof; FK-P20/21 matrix binding |
| INF-2 SQLite WAL on native Docker named volume is a contract | FK-P9 storage contracts; FK-P14 deployment; FK-P15 placement-conditional proofs |
| INF-3 workstation optimization rules | FK-P0 records (§5); FK-P7/P14 implement + measure; FK-P21 reports |
| INF-4 verification independence + retained evidence | FK-P5/P8/P15 clean-environment proofs; FK-P18 independent CI; FK-P21 manifest |
| INF-5 A1 reconciliation + two latency spans | FK-P0 records (see reconciliation §2); FK-P1 contract; FK-P17 measure; FK-P21 evidence |
| INF-6 reproducible performance/cost baseline | coordinator records; FK-P7/P14 build paths; FK-P10/P15 contention; FK-P17 latency; FK-P21 assembly |
| INF-7 exhaustive corpus manifests; retrieval advisory | FK-P0 inventories (§6); FK-P3 read-surface evaluators; FK-P19 sweep evidence; FK-P21 manifest |
| INF-8 recovery proof + measured revisit conditions | FK-P9/P14 backup-restore; FK-P15 proof; FK-P21 limitations |

## 5. INF-3 — applicable operational rules recorded (FK-P0 carrier)

These rules are now recorded here; they constrain later FK build/launcher work and are
not authorization for any OS or cross-package change:

1. Do **not** install blanket antivirus exclusions for `D:\Repos`, worktree roots,
   package caches, or the Docker VHDX. Profile hot paths first.
2. Evaluate Dev Drive with Defender performance mode. Residual exclusions must be
   narrowly scoped and justified by measured impact.
3. OS configuration changes are operator actions under available authority, never
   kernel capabilities.
4. Independent workspace verification stands: a shared npm cache reduces fetching but
   does not eliminate per-worktree installed dependency trees. A linked dependency
   store or package-manager change is a distinct compatibility decision.
5. Benchmark BuildKit cache mounts, resource ceilings, and install changes against cold
   and warm baselines before claiming improvement.
6. Preserve reproducible lockfile-based installation, dirty worktrees, and untracked work.
7. From INF-2 (placement rule the build path must respect): SQLite WAL on a native
   Docker named volume is a **contract**, not a preference; record actual volume driver,
   backing filesystem, runtime version, mount configuration, and ownership with the
   evidence. WAL over SMB/NFS/Azure Files/DrvFs is unsatisfying; ACA+Azure Files is
   rejected for this topology (not a permanent ACA ban; a changed state service needs
   its own contract and proof).

## 6. INF-7 — rule and corpus obligations (FK-P0 carrier)

**Rule corpus (this registry):** 14 standing-constraint rules (§4a), 20 locked decisions
(§4b), 8 infrastructure requirements (§4c) — 42 standing rules inventoried, each with
one enforcement destination. `surfaces:` is never a destination (D10).

**Corpus-manifest obligations (downstream, defined here):**

1. Deterministically enumerate the complete in-scope corpus at a named revision;
   maintain one explicit disposition per item — swept / unreadable / failed / unsupported
   / excluded-with-reason. A failed or unexamined in-scope item is **not** counted as
   swept for any D11 rule-retirement claim.
2. Retrieval may prioritize review; it cannot define completeness.
3. Model/provider eligibility comes from the current routing policy and actual host
   capability. Verified anchor: upstream main `476b8df` carries `shadow_routes: {}`
   (routing-policy.yaml:169) — do not assume a Cerebras or local-GPU route is active;
   a local GPU evaluation or retrieval index stays outside this kernel's first release
   unless separately scoped.
4. The code-level registry on the R31 branch enumerates the compiled corpus at scale
   (accepted R30 inventory: 18 sources / 1583 items / 541 rules / 198 audit /
   20 reconciliations; R31 implementation ruling expected 18/1585/542/202/21). Those
   counts bind to the R31 candidate and its named revisions, not to this live tree.

## 7. FK-P0 exit-item status

| Exit item (source) | Status | Evidence / exact gap |
|---|---|---|
| Reconcile operative gate/authority statements (§6 outcome; §15.1) | **Satisfied** | §1 here + `fk-reconciliation-2026-09-26.md` (16-row delta table, evidence-cited) |
| Define the structured constraint taxonomy (§6 outcome) | **Satisfied** | §2 (10 classes, predicate/destination/retirement per class) |
| Define the operation authority matrix (§6 outcome) | **Satisfied** | §3 (14 operation rows) |
| Inventory every standing rule by enforcement destination (§6 outcome) | **Satisfied** for the standing-rule corpus | §4 (42 rules, one destination each) |
| Record applicable operational rules (INF-3) | **Satisfied** | §5 |
| Record A1 reconciliation (INF-5) | **Satisfied at record level** | reconciliation doc §2. **Gap:** the adopted A1 text/ledger is not in the live tree — cause: it exists only on the FK branches pending the human Gate-3 merge; adopting it here would pre-empt that merge. No latency contract changed; no decision ID assigned |
| Inventory rules **and corpus obligations** (INF-7) | **Satisfied for rules; obligations defined, manifest not produced** | §6. **Gap:** no revision-bound per-item disposition manifest in the live tree — cause: producing it requires the registry tooling (Gate-3-pending, §8) and the FK-P19 sweep machinery; charter assigns the manifest binding to FK-P21 (FK-P21 deferred per RS-1.2; obligation named in the RS-2.3 exit annex — RS-2.2) |
| Wave-0 exit fragment attributable to P0: "plan-level contradictions have no unresolved implementation consequence" | **Satisfied** | every contradiction found in reconciliation has a recorded disposition (rows 6, 7, 11, 13, 16) with named follow-ups |
| Wave-0 exit "contracts and fixtures are merged; exact path authority can be compiled without reading `surfaces:`" | **Not FK-P0's** | FK-P1/FK-P2 outcomes; dispatch plan gates them |

## 8. Relationship to the R31 code-level registry (seam)

FK-P0 was previously executed as a code package on
`codex/fk-p0-canon-authority-enforcement-registry` and its descendants. Latest verified
state (2026-09-08 publication; commits dated 2026-09-07/08):

- R30 candidate accepted (`c35ff72`, `codex/fk-p0-r30-adoption-20260907`): full chain
  686/686, two fresh final APPROVE reviews.
- R31 candidate accepted (`1747c1d`, `codex/fk-p0-r31-source-adoption-20260907`):
  run 36 passed 751/751, zero failures; two fresh independent whole-change final reviews
  APPROVED with no P0/P1/P2 findings; isolated main-integration check against pinned main
  `476b8df` passed (hypothetical tree `a9df33c`).
- Gate-3 preparation published (`947e6f1`, `codex/foreman-kernel-resume-20260908`,
  2026-09-08): `R31-PR-MATERIAL-20260908.md` prepared but **unsubmitted**; human Gate 3
  and the actual merge remain open; FK-P1 Stage A shaped but unimplemented.

**Seam rule:** the human Gate-3 merge is the only path by which `authority-registry/`
enters the live tree. This docs-level execution does not duplicate that package and does
not satisfy or bypass its merge gate. After the merge, the merged registry is the
compiled authority source; this document remains the reconciliation/registry record and
must be re-checked against it (any divergence is resolved in the merged package's favor,
per §"FK-P0 code seam" in the reconciliation doc).

## 9. Gate decisions recorded

| ID | Decision | Rationale | Authority basis |
|---|---|---|---|
| GD-1 | Execute FK-P0 in the live tree as docs-only (reconciliation + taxonomy + authority matrix + rule inventory); do not copy or re-implement the R31 `authority-registry/` package here | Charter FK-P0 is reconnaissance/consolidation; the code package is accepted but human-Gate-3-pending; copying accepted-unmerged code across branches would manufacture merge satisfaction and risk a two-writer collision with the FK branches | coordinator decision 2026-09-26 under owner blanket authority |
| GD-2 | Edit only `docs/goals/foreman-kernel/`; touch no contested surface (`routing-policy/`, `dispatch/`, `contracts/`, `templates/`) | Those surfaces are owned by active sibling goals (`foreman-line-boundary-routing`); seams recorded instead of edited (reconciliation doc §3) | coordinator decision 2026-09-26 under owner blanket authority |
| GD-3 | Do not start FK-P1+; defer dispatch to the coordinator's next waves | Charter dependency order (FK-P1 needs merged FK-P0) plus §15.2 fresh plan review and the unreconciled owner-of-record (reconciliation rows 13/16) are open prerequisites | coordinator decision 2026-09-26 under owner blanket authority |
