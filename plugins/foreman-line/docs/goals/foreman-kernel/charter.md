# Goal Charter — Foreman Kernel

**Created:** 2026-08-30
**Owner:** Clinton Morgangit
**Status:** fully ratified as amended — see the ratification ledger (§4.1) for the binding set and every ratification event
**Coordinator:** primary Codex coordinator session that created this charter
**Mode:** Repo-Local Parcel Mode

---

## 1. Objective

Turn Foreman Line's strongest procedural controls into a portable governed runtime:

1. deterministic policy and verification capabilities callable through a versioned
   Docker-hosted MCP surface without package-local installs;
2. durable, revisioned operational goal state that survives process and session
   restarts while preserving Git as the authority for ratified canon; and
3. thin host hooks that consult the same kernel to observe and, after shadow-mode
   proof, mechanically refuse a bounded set of high-confidence violations.

The first release is successful when an unrelated clean-room repository can use the
containerized verifier, resume goal state after a container restart, and prove selected
hook refusals without giving the kernel approval, merge, external-write, or generic
receipt-minting authority.

## 2. Problem statement

Foreman Line already contains substantial deterministic machinery, but its operating
controls are split across prose, package-local CLIs, worktree-local permission files,
Markdown ownership blocks, and host-specific session behavior. That produces five
costs this goal addresses:

- agents must reread and remember standing constraints;
- permission profiles reduce capability only when the host/session loads them;
- exact `Allowed Files` authority is present in spec prose but is not compiled for
  machine enforcement;
- reusable evaluators require per-package dependency installation and some attractive
  "evaluation" functions also write timestamped artifacts; and
- operational goal state is repeatedly reconstructed from Markdown rather than served
  from a single durable, concurrency-safe ledger.

The goal is not to make hooks omnipotent. Hooks mediate only the channels the host
exposes. CI, source-control rules, deterministic verification, and human gates remain
independent enforcement layers.

## 3. Authority hierarchy

When artifacts disagree, authority resolves in this order:

1. explicit developer ratification or amendment for this goal;
2. this charter's locked decisions;
3. ratified Foreman contracts and `SPEC-CONVENTION.md`;
4. `COORDINATOR-PATTERN.md` and the `goal` skill;
5. parcel specs created under this charter;
6. standing constraints and role kickstarters;
7. generated projections, caches, and advisory documentation.

No implementation parcel may silently choose among contradictory authorities. It
stops and requests a charter or contract amendment.

## 4. Locked decisions

The developer confirmed the Stage Zero recommendations on 2026-08-30 and explicitly
ratified this charter on 2026-08-31 with: “Ratify Gate 1 and authorize Gate 2
dispatches.” D1–D17 were ratified. The required fresh plan review returned
`REQUEST CHANGES` on 2026-08-31. The coordinator accepted six BLOCKERs and seven
SHOULD-FIX findings; D3, D7–D9, D13–D17, new D18–D20, the parcel graph, and affected
exit criteria were placed under a scoped Gate 1 re-open. The developer explicitly
re-ratified them on 2026-08-31 with: “Re-ratify Gate 1 amendments R1–R13 and resume
Gate 2.” Subsequent amendments are ratified individually. **The binding set is the
ledger in §4.1, not a range restated in prose:** every ratification event appends a row
there, so no prose sentence in this charter needs editing when a decision is added.

| ID | Decision | Reasoning |
|---|---|---|
| D1 | This is a new goal, `foreman-kernel`, separate from `plugin-packaging-and-scaffolder`. | The packaging/scaffolder goal owns distribution and canon scaffolding. This goal owns runtime contracts, evaluation, operational state, and hook enforcement. Shared manifests and other serialization points are explicitly sequenced rather than casually co-owned. |
| D2 | Git remains authoritative for ratified charters, specs, policies, reviews, human-gate artifacts, and committed proof. SQLite becomes authoritative only for operational state: revision, lease, pending transition, wakeup/handoff, evidence index, and projection cursor. | A running process must not become hidden product or approval authority. Operational state needs concurrency and restart safety that Markdown cannot provide; ratified canon must remain diff-reviewable. |
| D3 | The kernel is divided into a provider-neutral trust core, a read-only MCP surface, an admission-protected control surface, and thin host adapters. The control surface uses a distinct local endpoint/socket plus a narrowly issued host-local capability bound to a mechanically distinct principal. | Separate discovery catalogs are not an authorization boundary. An unauthenticated verifier client must be unable to list or call control tools, claim leases, or request transitions. Host quirks must not leak into policy semantics. |
| D4 | First release scope is: compiled constraints, pure evaluators, read-only Docker MCP, durable operational state, one hook adapter in shadow mode, and enforcement of independently proven refusal classes. | This is the minimum vertical slice that eliminates install friction and memory-only enforcement without prematurely centralizing external authority. |
| D5 | There is no generic `mintReceipt` tool in the first release. No agent-callable tool may mint Gate-1 approval, independent-verification, merge, or closure authority. | Current receipt validation is structural, current receipt builders trust caller-supplied custody inputs, and current merge metadata is not source-control authenticated. Publishing those surfaces would create an authority oracle. |
| D6 | Receipt tools exposed in the first release are explicitly labeled structural. Authoritative stage-specific issuance is a follow-on goal gated on canonical hash recomputation, trusted-key verification, legal-transition checks, evidence-derived subjects, atomic append, and live source-control binding. | Tool names and assurance labels must not overclaim what existing validators prove. |
| D7 | One portable MCP contract is primary. Claude Code on the declared Windows/Docker Desktop matrix receives the first lifecycle adapter. Codex and other hosts receive an adapter only where a real capability probe demonstrates equivalent mediation. Bypass attempts visible to a loaded adapter may be refused; hook absence or non-enrollment is detected by enrollment heartbeat and CI and is never claimed as a hook refusal. | The repo documents that some plugin/session surfaces ignore hooks, MCP, or permission frontmatter. Portability belongs in the protocol and capability matrix, not in a universal enforcement claim. |
| D8 | Hooks begin in shadow mode. After negative tests, mediated-bypass probes, enrollment detection, and corpus reconciliation, governed mutations fail closed when the loaded adapter cannot reach the kernel. Read-only work may continue only in an explicit degraded mode that records the missing assurance. Enforcement cannot be promoted before independent CI backstops are green. | Failing open makes enforcement claims false; failing every operation closed makes Docker a development-wide outage; promoting before CI leaves unmediated channels without the promised detector. |
| D9 | Human authority is preserved: Gate 1 is nondelegable; Gate 2 may be delegated only by an explicit charter-scoped standing authorization; Gate 3 remains human-owned unless a distinct agent identity is mechanically authorized and verified live. Human-gate satisfaction is derived from canonical, digest-bound Git artifacts and cannot be written as ordinary operational state. | Hooks, MCP, leases, and a local control capability are enforcement mechanisms, not new authority sources. Human-only conditions produce `awaiting_human` stop reports rather than unfinishable stop-hook loops. |
| D10 | Exact `Allowed Files` is compiled from the spec body before path refusal is implemented. `surfaces:` remains routing/audit metadata and never substitutes for mutation authority. | The existing frontmatter linter does not provide the exact path contract needed by hooks. Enforcing a different field would mechanize the wrong rule. |
| D11 | A defect class is retired from the agent reading path only after: a deterministic predicate exists, a negative test proves refusal, the existing corpus is swept, and an independent bypass attempt fails. Provenance and rationale remain in the lessons record. | Removing prose before enforcement is proven merely hides the rule. Installing a future rule without reconciling existing instances leaves the class alive. |
| D12 | Hooks are adapters, not policy engines. They normalize lifecycle events, call `authorizeAction`, honor the structured decision, and report observed effects. All policy IDs, refusal codes, state transitions, and evidence rules live in the kernel contract. | This prevents host-specific shell scripts from becoming a second, drifting policy implementation. |
| D13 | Pre-action path checks are backed by post-action realpath-aware Git-diff detection and CI, and CI lands before enforcement promotion. Reviewer sessions fail closed on opaque mutation-capable shell; builder shell limitations are disclosed rather than described as complete containment. A missing/non-loaded hook is detected through enrollment/CI, not described as refused. | Shells, generators, subprocesses, custom tools, symlinks, and external applications defeat universal tool-call parsing. Layered prevention plus detection is honest; unsupported containment claims are not. |
| D14 | Operational state uses SQLite WAL with versioned transactional migrations, foreign keys, append-only events, single-writer leases, trusted lease-time semantics, optimistic revisions, principal/operation/idempotency keys bound to input digests, transactional state/event/cursor updates, and deterministic Markdown views. Git wins ratification and human-gate facts; SQLite wins leases, revisions, idempotency, wakeups, and projection cursor after a one-time digest-bound cutover. Divergence stops rather than overwrites. | One process in front of durable state improves resume cost; vague dual authority, process-only truth, or unbound idempotency creates split brain and replay risk. |
| D15 | The first container has no Jira, SCM, cloud, signing, Docker-socket, or other external-system credential. A narrow host-local control capability is permitted only for admission to the local control surface. The read-only server cannot read the state volume, and repository access is capability-bound and read-only. | The portable verifier should not inherit unrelated blast radius or disclose state. A local admission capability is not authority to mutate external systems or Git canon. |
| D16 | Existing mixed functions are split before exposure: routing and skill selection become pure decisions plus separately authorized recorders. Routing/skill sidecars do not share a directory interpreted as a receipt chain. | Current functions mix calculation, timestamps, directory creation, and overwriteable files. Exposing them unchanged would make a supposedly read-only tool mutate the repo and can poison receipt-directory validation. |
| D17 | Every public tool has a versioned input/output schema, stable refusal codes, authenticated-principal/admission provenance where applicable, request/input/policy digests, idempotency binding, explicit assurance level, bounded payloads, and consistent decision semantics. Policy refusal is a successful structured result; malformed protocol or kernel failure is an MCP error. | Hooks and harnesses must distinguish deliberate refusal from process failure without parsing free-form prose, and control decisions must never trust caller-self-asserted identity. |
| D18 | `authorizeAction` is a dedicated provider-neutral policy engine, not a hook or control-handler implementation detail. It combines authenticated principal, repository/worktree identity, compiled Allowed Files, role posture, leases/revisions, gate evidence, outage mode, and post-diff obligations against golden lifecycle vectors. | Without an owning engine parcel, thin adapters or the control catalog would have to reimplement policy and violate D12. |
| D19 | Public read APIs are content-only by default. Any repository read uses an admission-bound `repoId` plus exact relative path resolved inside one mounted read-only root, with canonical containment, symlink/reparse refusal, regular-file checks, and byte limits. Arbitrary host paths are forbidden. | Read-only access can still disclose unrelated source, secrets, container files, or the SQLite volume. Mutation authority and read confidentiality are separate boundaries. |
| D20 | First-release enforcement is claimed only for Claude Code on Windows 11 with Docker Desktop and the tested plugin/launcher shape. The MCP protocol and Linux container image remain provider-neutral; native-Linux-host or Codex enforcement is not claimed until separate process-boundary evidence exists. | Two harness shapes do not prove host, path, filesystem, or lifecycle parity. The claim must match the demonstrated platform matrix. |
| D21 | The kernel's decision path carries a stated latency budget, measured on the D20 platform matrix. Two spans are distinguished: `kernelDecisionLatency` (request received at the decision surface → response written) is kernel-owned and budgeted at p50 ≤ 5 ms, p95 ≤ 20 ms, p99 ≤ 50 ms warm; `mediatedActionLatency` (host lifecycle entry → hook exit, inclusive of adapter and transport) is budgeted at p99 ≤ 150 ms. First-call-after-start cost is reported separately against a ≤ 2000 ms allowance and is never folded into a warm percentile. Exceeding a budget is a recorded obligation, not a refusal. Exceeding the hard deadline of 1000 ms on a single decision is treated as kernel-unreachable and inherits the D8 outage posture unchanged. Authorization results may be cached only when bound to `goalRevision`, `policyDigest`, and compiled-scope digest; a cache entry whose binding no longer matches produces `STATE_REVISION_STALE` rather than a stale ALLOW. | D8's enforcement claim depends on adapters that remain loaded and enabled. Latency is the most probable cause of an operator disabling one, which converts a claimed mechanical control into an undetected gap. The measured D20 budgets constrain transport choice and prevent unsound caching; they do not establish a universal claim that every network round trip necessarily exceeds the budget. |

### 4.1 Ratification ledger

Authoritative record of what is binding and when it became binding. Any statement
elsewhere in this charter that appears to enumerate the binding set is a convenience
restatement; this table governs. A decision is in force only if a row below puts it there.

Each row carries a unique ledger entry id. Ids are stable, assigned in order, and never
reused or renumbered; amendments and the authority registry reference a ratification event
by its id rather than by its date or its position.

| Entry | Date | Instrument | Scope ratified | Record |
|---|---|---|---|---|
| L1 | 2026-08-31 | Original Gate 1 | D1–D17, the FK-P0–FK-P21 graph, wave exits, scenarios, goal exit criteria | “Ratify Gate 1 and authorize Gate 2 dispatches.” |
| L2 | 2026-08-31 | Scoped Gate 1 re-open, plan-review amendments R1–R13 | D3, D7–D9, D13–D17, new D18–D20, amended graph and affected exit criteria | “Re-ratify Gate 1 amendments R1–R13 and resume Gate 2.” |
| L3 | 2026-09-01 | Amendment A1 — decision-path latency budget | D21; FK-P1 and FK-P17 scope; Wave 0 exit; integration scenario 14; §13 items 7 and 9 | `proposed-amendment-A1-decision-path-latency-budget.md`, ratification record at foot |
| L4 | 2026-09-07 | Amendment A1.8 — ratification ledger (with A1.9, its Entry-id keying) | §4.1 itself; header status line, §4 preamble, and §10 Gate 1 restatements replaced by pointers to §4.1; ledger rows keyed by stable Entry id. Adds no locked decision, changes no gate, alters no parcel, scenario, or exit criterion. | `amendment-A1.8-ratification-ledger.md`; A1.9 at `7e7dc7d`; `authorization-20260907-unattended.md`. This is the instruments' own required row. |
| L5 | 2026-09-07 | Infrastructure adoption INF-1–INF-8 | §14 and its detailed carrier mapping; D21 rationale/cold-deadline clarification; U1 assigned to coordinator contract resolution, FK-P18 production, FK-P19 verification and FK-P21 retention. No parcel added or dependency removed. | `amendment-A4-infrastructure-adoption-20260907.md`; developer recommendations ratified September 7 and continuation authorization in `authorization-20260907-unattended.md`. |

**Appending a row is the only way to change the binding set.** Any amendment document that changes this charter must produce a row here, whether or not it changes the binding set. An unrowed amendment is a proposal; stable rows record actual ratification events, not inferred approvals.

## 5. First-release architecture

```text
Claude adapter + enrollment heartbeat
        |
        v
host-local capability admission -------> authorizeAction policy engine
        |                                  - principal / repo / role
        |                                  - compiled scope / gates
        |                                  - leases / revisions / obligations
        v
control MCP catalog -------------------> SQLite event ledger
        |                                  - transitions / evidence refs
        |                                  - deterministic projections
        |
provider-neutral trust core -----------> read-only MCP catalog
                                           - content-only by default
                                           - capability-bound repo reads
                                           - no state-volume access

Git canon remains outside the kernel's unilateral authority.
CI and source-control rules remain independent backstops.
```

### Common decision envelope

Every tool result follows one versioned shape with:

- `apiVersion` and `toolVersion`;
- `decision`: `ALLOW | REFUSE | ADVISORY | APPLIED | NOOP | CONFLICT | REQUIRE_HUMAN`;
- stable `code` and structured `violations[]`;
- `requestDigest`, `inputDigest`, `policyDigest`, authenticated `principalRef` or
  anonymous-read classification, and, where applicable, `goalRevision`;
- an explicit `assuranceLevel`; and
- obligations such as post-diff inspection, fresh SCM proof, or stop-report emission.

Raw credentials, prompts, source payloads, and secrets are not persisted in the
operational event stream.

### Initial enforceable refusal classes

The first enforcement promotion targets only predicates that can be proven across the
mediated lifecycle:

1. `WORKTREE_MISMATCH` / `BRANCH_MISMATCH`;
2. `PATH_OUTSIDE_ALLOWED_FILES` / `FROZEN_SURFACE_MUTATION`;
3. `REVIEWER_MUTATION_FORBIDDEN` / `REVIEW_WORKTREE_DIRTY`;
4. `POLICY_SELF_MODIFICATION` / `MEDIATED_BYPASS_MODE_FORBIDDEN`; and
5. `OWNER_LEASE_MISMATCH` / `STATE_REVISION_STALE` / `GATE_NOT_SATISFIED`.

`SESSION_ENROLLMENT_MISSING`, disabled hooks, ignored plugin frontmatter, and launch
outside the governed adapter are detected by enrollment heartbeat and CI. They are
recorded as detected-only controls and are never counted as hook refusals.

Semantic standing constraints—typed boundary errors, adequate hostile fixtures,
linear-time parsing, mutation-test quality, and naïve-reading review—remain deterministic
linter, CI, mutation-harness, or independent-review responsibilities. Hooks may trigger
those checks but do not claim to prove them from a tool invocation.

## 6. Parcel decomposition

All parcels receive exact Allowed Files, named worktrees/branches, deterministic
verification, and independent review. Architecture/risk parcels receive two independent
reviews.

### Wave 0 — Authority and contracts

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P0 — Canon authority and enforcement registry | Reconciles operative gate/authority statements; defines the structured constraint taxonomy and operation authority matrix; inventories every standing rule by enforcement destination. | critical / architecture-risk | none |
| FK-P1 — Lifecycle, admission, and decision contracts | Versioned lifecycle event, authenticated-principal/local-capability admission, `authorizeAction`, decision envelope, refusal-code, assurance-level, repository identity, content/read-capability boundary, host-path normalization split, golden vectors, and the D21 decision-path latency contract — the two measured spans and their observation points, the hard-deadline-to-outage mapping, and the revision-bound caching rule whose violation yields `STATE_REVISION_STALE`. | critical / architecture-risk | FK-P0 |
| FK-P2 — Spec-body compiler | Parses required spec sections and compiles exact non-glob Allowed Files plus frozen/forbidden surfaces; rejects ambiguity, traversal, equivalent-path, symlink/reparse escape, and missing authority. | critical / architecture-risk | FK-P0, FK-P1 |

**Wave 0 exit:** contracts and fixtures are merged; exact path authority can be compiled
without reading `surfaces:` as mutation permission; the D21 latency contract is specified
with both measured spans, their observation points, the hard-deadline-to-outage mapping,
and the revision-bound caching rule; and plan-level contradictions have no unresolved
implementation consequence.

### Wave 1 — Pure trust core

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P3 — Pure dispatch decisions | Splits routing and skill resolution into deterministic no-I/O decision functions with injected validated policy and stable digests; legacy writers remain compatibility adapters. | elevated / architecture-risk | FK-P1 |
| FK-P4 — Verifier facade | One provider-neutral library facade over immediate validators/evaluators; chain results say `STRUCTURAL`; public calls are content-only or use the D19 capability-bound repository reader. | elevated / architecture-risk | FK-P1, FK-P2, FK-P3 |
| FK-P5 — Clean-room trust-core spike | Runs the facade against an unrelated fixture repository, including positive, negative, malformed, hostile-path, and degraded-assurance cases. | elevated / standard-feature | FK-P4 |

**Wave 1 exit:** every first-release evaluator is deterministic, no-I/O unless explicitly
documented, contract-tested, and proven against an unrelated repository.

### Wave 2 — Stateless read-only MCP and container

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P6 — Read-only MCP server | Registers the versioned read-only catalog, strict schemas, payload limits, health/readiness/version endpoints, and semantic-parity tests against the library facade. | critical / architecture-risk | FK-P4, FK-P5 |
| FK-P7 — Stateless verifier image and launcher | Multi-stage Node image with one dependency graph, non-root runtime, read-only root filesystem and capability-bound repo mount, no state volume or external credentials, explicit named-container launcher and labels. | elevated / architecture-risk | FK-P6 |
| FK-P8 — Stateless harness portability proof | Calls the same verifier image from at least two independent harness shapes without package-local installs; proves read confidentiality, records tool/version/policy/image digests, and makes no stateful-container claim. | elevated / standard-feature | FK-P7 |

**Wave 2 exit:** a pinned stateless container serves the read-only verifier to
independent harnesses, cannot read the future state volume, and survives a clean-room
launch without package-local installation.

### Wave 3 — Durable operational state

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P9 — SQLite storage and migration ABI | Owns schema migrations, events/goals/artifact tables, WAL/busy policy, transactional migration startup, newer-schema/corruption refusal, online backup/checkpoint recovery, and the storage package exports. | critical / architecture-risk | FK-P1 |
| FK-P10 — Lease and transition engine | Owns trusted lease time, CAS revisions, principal/operation/idempotency binding, transactional event/state updates, legal transition invariants, and real process-boundary crash/concurrency tests. | critical / architecture-risk | FK-P9 |
| FK-P11 — Legacy import and projection engine | One-time digest/commit-bound import without manufactured approvals; field-level authority reconciliation; deterministic Markdown projection; cutover epoch and divergence-stop behavior. | critical / architecture-risk | FK-P9, FK-P10 |
| FK-P12 — Authorization policy engine | Implements `authorizeAction` over authenticated admission, repository/worktree identity, compiled scopes, roles, leases/revisions, gate evidence, outage mode, and post-diff obligations; one golden negative vector per initial refusal code. | critical / architecture-risk | FK-P2, FK-P10 |
| FK-P13 — Admission-protected control catalog | Registers get/claim/renew/release/transition/evidence/project tools behind the distinct local capability; binds every request to principal and digest; proves anonymous verifier clients cannot list or call control tools. | critical / architecture-risk | FK-P6, FK-P10, FK-P11, FK-P12 |
| FK-P14 — Stateful image composition and operator lifecycle | Rebuilds/composes the final image and launcher with separate read/control endpoints, non-root UID, state-volume ABI, migrations, health/version negotiation, backup/restore, bounded shutdown, and no read-surface access to state. | critical / architecture-risk | FK-P7, FK-P13 |
| FK-P15 — Stateful restart and admission proof | Clean-room process-boundary proof of restart recovery, split-brain refusal, stale CAS, idempotency conflict, migration crash/recovery, anonymous-control denial, and digest-pinned projections. | critical / architecture-risk | FK-P14 |

**Wave 3 exit:** two distinct principals cannot split ownership; restart reconstructs
state from SQLite; stale revisions and same-key/different-payload calls conflict; crash
points and migrations recover or fail closed; projections are deterministic; and the
field-level Git/SQLite authority matrix stops on divergence rather than overwriting.

### Wave 4 — Hook adapter and enforcement promotion

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P16 — Claude lifecycle adapter, shadow mode | Capability-preflighted SessionStart/PreToolUse/PostToolUse/Stop adapter for the D20 matrix; enrollment heartbeat; host-path normalization; calls FK-P12 and records would-allow/would-refuse/detected-only results. Owns Claude hook registration, not Codex or shared Docker files. | critical / architecture-risk | FK-P12, FK-P13, FK-P15 |
| FK-P17 — Bypass and outage harness | Exercises shell, subprocess, custom-tool/MCP, symlink/reparse, subagent, mediated bypass, hook non-enrollment, stale state, service timeout, and restart; produces the mechanical/detected/unsupported matrix; and produces the D21 latency profile on the D20 platform — warm percentiles for both measured spans, the first-call-after-start figure, and a hard-deadline case proving the unreachable path inherits the D8 outage posture rather than failing open. | critical / architecture-risk | FK-P16 |
| FK-P18 — CI scope and state-evidence backstops | Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI; negative control intentionally bypasses the hook and must fail CI before enforcement can promote. Owns only its named workflow/CI integration points. | critical / architecture-risk | FK-P17 |
| FK-P19 — High-confidence refusal enforcement | Promotes only the five mediated classes whose negative controls, corpus sweeps, authorization-engine vectors, and FK-P18 CI backstops pass; implements degraded read-only mode and fail-closed governed mutation. | critical / architecture-risk | FK-P17, FK-P18 |
| FK-P20 — Second-host feasibility and host registration | Probes Codex lifecycle capabilities; either ships a thin adapter with process-boundary parity or records the unsupported gap. Owns Codex manifest changes; no Claude-hook or Docker-file edits. | elevated / architecture-risk | FK-P19 |
| FK-P21 — Exit evidence manifest and clean-room proof | Produces the committed evidence manifest binding source SHA, stateless/stateful image digests, tool/schema/policy digests, host/harness versions, corpus inventory/count, reviewer-session identities, commands/results, and named mutation controls. | critical / architecture-risk | FK-P19, FK-P20 |

**Wave 4 exit:** selected mediated violations are mechanically refused on the proven
host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI was
green before enforcement promotion; service outages have bounded recovery; and host
claims plus all proof identities are bound in the evidence manifest.

## 7. Explicitly not doing in this goal

- generic or authoritative receipt minting;
- Gate-1 approval, Gate-2 authorization, or Gate-3 merge through an agent-callable tool;
- Git commit/push/PR/merge, Jira mutation, cloud mutation, deployment, publication, or
  external communication;
- trusted-key management or a signing service;
- live source-control authentication of merge metadata;
- cryptographic receipt-chain recomputation and stage-subject custody sufficient for
  evidentiary closure;
- Docker socket mounting or broad host filesystem mounts;
- claiming universal enforcement across shells, subagents, custom tools, or unsupported
  hosts; or
- deleting the lessons/provenance record after a rule becomes mechanical.

The receipt-custody and stage-specific append service becomes a separate follow-on goal
after this kernel demonstrates evaluator, state, and enforcement boundaries safely.

## 8. Integration scenarios

The goal is not complete until all scenarios have durable evidence:

1. **Clean-room lint:** an unrelated repository submits valid and invalid specs; exact
   Allowed Files compile; traversal and ambiguous authority refuse.
2. **Read confidentiality:** an anonymous verifier can submit bounded content but cannot
   read arbitrary host paths, the state volume, a second repository, a symlink/reparse
   escape, a non-regular file, or an over-limit file.
3. **Pure routing:** repeated identical routing and skill inputs return identical decisions
   and digests with zero repository writes.
4. **Structural honesty:** a structurally valid but tampered receipt chain is never reported
   as cryptographically verified or Gate-3-ready.
5. **Control admission:** an anonymous/read-only client cannot list or call control tools;
   an authenticated local principal can act only within its capability and request digest.
6. **Restart recovery:** the container restarts and reconstructs the same goal revision,
   lease history, evidence index, and Markdown projection.
7. **Split-brain refusal:** two authenticated coordinator principals race for one goal;
   exactly one lease wins and stale transitions conflict.
8. **Scope refusal:** a structured write outside Allowed Files is refused before execution;
   shell-mediated drift is caught post-action and by CI.
9. **Reviewer posture:** structured mutation and opaque mutation-capable shell refuse;
   a dirty review worktree blocks completion.
10. **Human gate:** a human-only state produces `REQUIRE_HUMAN` from digest-bound Git
    evidence plus an agent-completable stop report; the Stop hook does not loop.
11. **Outage posture:** kernel loss blocks governed mutation, permits only recorded degraded
   read-only work, and recovers without manufactured events.
12. **Enrollment honesty:** mediated bypass is refused when the adapter runs; missing or
    disabled enrollment is detected by heartbeat/CI and is not reported as a refusal.
13. **Host capability:** each supported adapter passes a real process-boundary capability
    probe on its declared host/filesystem matrix; unsupported lifecycle events are
    reported as gaps.
14. **Decision-path latency:** on the D20 platform, a warm kernel serves a
    representative governed-mutation decision within the D21 budget for both measured
    spans; the first-call-after-start figure is recorded separately; a decision
    exceeding the hard deadline is reported as kernel-unreachable and inherits the D8
    outage posture without failing open; and an authorization cache entry whose
    `goalRevision`, `policyDigest`, or compiled-scope digest no longer matches produces
    `STATE_REVISION_STALE` rather than a stale ALLOW.

## 9. Goal exit criterion

This goal exits only when:

1. Waves 0–4 and FK-P0 through FK-P21 are merged through the required human Gate 3
   process.
2. Pinned stateless and stateful images expose versioned read-only and admission-protected
   control catalogs without package-local installs; anonymous verifier clients cannot list
   or call control tools and the read surface cannot access the state volume.
3. Clean-room, read-confidentiality, stateless portability, and stateful admission scenarios
   pass against their respective image digests on the D20 platform matrix.
4. SQLite state survives restart; principal/lease/CAS/idempotency/crash/concurrency/
   migration/backup-recovery tests pass at a real process boundary; generated Markdown
   follows the field-level authority matrix and stops on divergence.
5. The five initial mediated refusal classes have authorization-engine vectors, negative
   tests, bypass probes, corpus sweeps, and independent review evidence before enforcement
   is enabled; hook non-enrollment is separately proven detectable.
6. CI backstops are green before enforcement promotion and catch an intentionally
   introduced out-of-scope mutation plus missing enrollment that bypass the hook.
7. No first-release tool can mint approval, independent-verification, merge, or closure
   authority; human-gate satisfaction is evidence-derived; and no container credential
   permits external mutation.
8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
   host/harness versions, corpus inventory/count, reviewer-session distinction, commands,
   results, and named mutation controls.
9. The final report separates mechanically enforced, detected-only, CI-enforced,
   human-judgment, unsupported-host, and deferred-receipt controls without claiming Codex
   or native-Linux-host enforcement absent process-boundary evidence.

## 10. Human gates and standing authorizations requested

### Gate 1 — charter ratification

**RE-CLEARED 2026-08-31 — nondelegable developer re-ratification recorded.** The
original Gate 1 was cleared, the fresh plan review returned six decision-changing
BLOCKERs, and the resulting scoped re-open for R1–R13 was explicitly re-ratified. The
set in force — including every amendment ratified after this date — is the ledger in
§4.1. Gate 1 remains nondelegable for each amendment individually.

### Gate 2 — parcel dispatch

**AUTHORIZED AND RESUMED 2026-08-31 as a standing Gate 2 grant:** the coordinator may
shape and dispatch FK-P0 through FK-P21 in dependency order. Authorization is void for
any parcel whose spec changes a locked decision, widens external effects, or omits exact
Allowed Files.

### Gate 3 — merge

Not delegated. Every merge remains human-owned for this goal. The coordinator may prepare
branches, commits, verification evidence, reviews, and PR material, but must stop and
present the green chain for the human merge action.

## 11. Stop conditions

The coordinator stops and reports if any of the following occurs:

- Gate 1 is not explicit or a locked decision becomes ambiguous;
- a fresh plan review changes a locked decision, parcel graph, or exit criterion without
  scoped re-ratification;
- an existing goal or parcel owns a required serialization point and no safe sequence is
  ratified;
- implementation requires changing ratified Foreman stage contracts outside a named
  contract amendment;
- a parcel needs a file outside its exact Allowed Files;
- exact path authority cannot be compiled without interpreting `surfaces:` as permission;
- a hook or server design requires claiming complete mediation of arbitrary shell or
  unsupported host behavior;
- a proposed tool can manufacture human approval, independent-verifier evidence, merge
  authorization, or closure authority;
- a container requires Jira, SCM, cloud, signing, Docker-socket, or broad-host access;
- a control request relies on self-asserted identity or a read-only client can discover or
  call control tools;
- a read-only request can select an arbitrary host path or access the state volume;
- state migration would manufacture or infer a historical approval/authorization;
- a security boundary cannot be closed inside its parcel;
- the same tripwire or rework cap fires as defined by the parcel contract;
- a reviewer or builder modifies the ambient dirty checkout or another goal's worktree;
- a user-owned change collides with a required file; or
- the queue is empty and the exit criterion is not fully evidenced.

## 12. Known serialization points and repo constraints

- The ambient `D:/Repos/agent-skills` checkout is dirty at
  `plugins/foreman-line/routing-policy/routing-policy.yaml`; it is user-owned and excluded
  from this goal unless the developer separately authorizes its incorporation.
- All goal work uses isolated worktrees created from a verified base.
- Plugin manifests, marketplace metadata, root workflow files, shared package manifests,
  receipt schemas, `SPEC-CONVENTION.md`, and barrel exports are serialization points and
  are assigned to only one active parcel at a time.
- FK-P6 owns the read-only server package manifest; FK-P7 owns stateless Docker/launcher
  files; FK-P9 owns state migrations/storage exports; FK-P14 owns final stateful
  Docker/launcher composition; FK-P16 owns Claude hook registration and the Claude
  manifest only; FK-P18 owns its exact CI files; FK-P20 owns Codex manifest changes.
  Other parcels emit fragments/fixtures and do not edit those serialization points.
- `plugin-packaging-and-scaffolder` remains a separate goal. Before any manifest or
  packaging edit, the coordinator reconciles that goal's live status and ownership.
- The first image is built from committed source and pinned policies. It does not read
  mutable policy from arbitrary target repositories unless a contract explicitly allows a
  validated, digest-bound override.
- First-release enforcement evidence targets Windows 11 + Docker Desktop + Claude Code.
  POSIX, drive-letter, UNC, case-folding, separator, reserved-name, symlink, and reparse
  vectors are contract fixtures, but no native-Linux-host or Codex enforcement claim is
  made without a separate real process-boundary run.

## 13. Gate 1 decision list

Ratifying this charter confirms:

1. the authority split, authenticated control admission, and separate `foreman-kernel`
   goal (D1–D3, D18);
2. the bounded first-release scope and no-generic-mint boundary (D4–D6);
3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
   enrollment detection, and shadow-first enforcement (D7–D8, D20);
4. preserved human gates and evidence-derived human-gate state (D9);
5. the Allowed-Files compiler and rule-retirement standard (D10–D13);
6. durable field-authoritative SQLite state, local control capability, read-volume
   isolation, and pure/effect separation (D14–D16);
7. versioned typed tool contracts, the read-confidentiality boundary, and the
   decision-path latency contract with its revision-bound caching rule
   (D17, D19, D21);
8. the FK-P0 through FK-P21 dependency graph and Wave 0–4 exit criteria;
9. the explicit out-of-scope list and fourteen integration scenarios;
10. standing Gate-2 dispatch authorization under the stated contingencies; and
11. nondelegated human Gate 3 for every merge.

**Gate 1 record:** Clinton Morgan explicitly ratified the original list and authorized
the contingent Gate 2 dispatch grant on 2026-08-31, then explicitly re-ratified plan-review
amendments R1–R13 and resumed Gate 2 on 2026-08-31. Parcel shaping and dispatch may now
proceed in dependency order under the stated contingencies.

## 14. Ratified infrastructure adoption, 2026-09-07

This section adopts the eight September 7 ratified recommendations into the live charter under L5. The detailed Carriers paragraphs assign obligations without adding parcels or dependency edges. The preserved companion is provenance; its older sections 1-13 do not replace this charter. Amendments A1 and A1.8/A1.9 stand as recorded in L3/L4. Newly adopted normative source content requires a separately reviewed FK-P0 corpus/contract amendment before an implementation verification claim can cover it. The unchanged Round 6 candidate remains a distinct baseline, not evidence for this adopted corpus.

### INF-1: Separate platform proof, development, and future execution

Retain Windows 11 + Docker Desktop + the tested Claude Code launcher/plugin as
the D20 enforcement proving environment. Portable evaluator development and
independent CI may execute elsewhere, but their results do not establish Windows
enforcement parity. Local IPC and a long-lived kernel remain the first-release
direction. Do not claim every filesystem operation in remote development crosses
the network or that every network hop necessarily exceeds a latency budget.

Future coordinator, sidecar, retrieval, and worker hosting stays open to separately
ratified designs. The `hierarchical-coordination-sidecars` and
`heterogeneous-agent-worker-fabric` goals retain their own owners, charters, and
gates. This kernel release creates neither hierarchical commissioning nor a
distributed execution fabric by implication. HCS's A3 proposal is not imported
as ratified authority. Preserve neutral kernel contracts for those future consumers
without assigning this goal their implementation work.

**Carriers:** FK-P1 records environment/assurance semantics; FK-P7/FK-P14 implement
the local deployment direction; FK-P16/FK-P17 prove Windows mediation; FK-P20
reports only the additional host capabilities actually demonstrated; FK-P21 binds
the resulting matrix to evidence.

### INF-2: Scope storage and hosting decisions to their actual contracts

SQLite WAL on a native Docker named volume remains the first-release state
placement. Record the actual volume driver, backing filesystem, runtime version,
mount configuration, and ownership with the evidence. An arbitrary named volume
backed by network storage does not satisfy the native-volume condition.

Reject ACA with SQLite WAL on Azure Files for the current topology. ACA supports
SMB and NFS mounts; neither changes the same-host WAL requirement. Do not convert
this into a permanent ACA ban or claim PostgreSQL inherently contradicts lease
ownership or optimistic revisions. A changed state service would need its own
contract, durability, authority, recovery, and concurrency proof. No migration is
authorized here. A cloud host does not inherently require public ingress or cloud
credentials inside the kernel; actual admitted identities and capabilities govern
that boundary.

**Carriers:** FK-P9 owns storage and backup contracts; FK-P14 owns deployment and
operator lifecycle; FK-P15 proves recovery and concurrency on the exact placement.

### INF-3: Measure workstation optimization without blanket exclusions

Do not install the former blanket antivirus exclusions for `D:\Repos`, worktree
roots, package caches, or the Docker VHDX. Profile hot paths first. Evaluate Dev
Drive with Defender performance mode. Residual exclusions must be narrowly scoped
and justified by measured impact. OS configuration changes remain operator actions
under the available authority, not kernel capabilities.

Keep independent workspace verification. A shared npm cache reduces fetching but
does not eliminate each worktree's installed dependency tree. A linked dependency
store or package-manager change is a distinct compatibility decision. Benchmark
BuildKit cache mounts, resource ceilings, and install changes against cold and
warm baselines before claiming improvements. Preserve reproducible lockfile-based
installation, dirty worktrees, and untracked work.

**Carriers:** FK-P0 records the applicable operational rules; FK-P7/FK-P14 own
their respective build/launcher configuration and benchmark evidence; FK-P21
reports the measured outcome. This does not grant cross-package lockfile edits
or create a new workstation-tuning implementation parcel.

### INF-4: Prove verification independence and retain evidence

Separate machines contribute isolation but are not sufficient for independent
verification. For every accepted verification path identify protected verifier
code and workflow configuration, allowed credentials, builder-controlled inputs,
runner lifecycle, and independent evaluation of negative controls. A local fresh
environment may demonstrate freedom from ambient dependencies; it does not prove
resistance to host compromise. Keep those assurance claims distinct.

Retain evidence artifacts with digests, source/workflow/toolchain identities,
image and configuration digests, and a declared retention/retrieval procedure.
CI job URLs are navigation pointers, not sole durable evidence. Do not assume
they are public. Pin external actions and container inputs according to the
reviewed CI contract. A mutable runner label or image tag is not a tested identity.

**Carriers:** FK-P5/FK-P8/FK-P15 define clean-environment proof; FK-P18 owns the
independently controlled CI backstop; FK-P21 owns the retained evidence manifest.
Publishing images, changing repository rules, or provisioning runners requires
the actual external-effect authority; this document grants none automatically.

### INF-5: Reconcile A1 and measure both latency spans

A1 is ratified and already adopted as D21 and ledger entry L3. Its numerical budgets, both latency spans, revision-bound cache rule and D8 outage mapping remain binding. The source artifact's old not-yet-landed wording is historical and has been corrected.

| Span or condition | Adopted D21 budget |
|---|---|
| Warm kernel decision | p50 <= 5 ms; p95 <= 20 ms; p99 <= 50 ms |
| End-to-end mediated action | p99 <= 150 ms |
| First call after startup | separately reported allowance <= 2000 ms |
| Per-decision hard deadline | 1000 ms, mapped to the existing outage posture |

The first-call allowance is an observation budget and does not extend the 1000 ms decision deadline or permit a late ALLOW. FK-P1 specifies the observation points and which startup work lies outside the decision span. Budget overruns remain recorded obligations; hard-deadline overruns inherit D8. No cache eligibility is broadened to satisfy a performance target.

**Carriers:** FK-P0 records reconciliation; FK-P1 owns the adopted decision-path
contract; FK-P16 implements the adapter; FK-P17 measures both spans, cold start,
and the hard-deadline failure behavior on D20; FK-P18 may carry only the coarse
CI regression checks authorized by the adopted A1; FK-P21 records evidence.

### INF-6: Use a reproducible performance and cost baseline

Do not claim the earlier bottleneck ranking, Defender multiplier, model fit,
per-review price, VM price, or model-to-infrastructure spend ratio as measured.
Record workload, source/configuration, sample count, concurrency, cold/warm state,
measurement boundaries, and missing observations with each baseline.

| Metric | Required use |
|---|---|
| Accepted parcels per hour | Measure useful delivery rather than raw task starts |
| Cost per accepted parcel, including rework | Evaluate routing and capacity economics |
| Reviewer queue delay, latency, tokens, rework rate | Separate review capacity from implementation performance |
| Installation and verification duration | Evaluate caching, disk, and verification-chain work |
| Both A1 latency spans | Detect kernel and adapter regressions separately |
| SQLite contention and CPU/memory/disk pressure by concurrency | Identify the tested capacity boundary |

The measurement record must define what counts as acceptance, the observation
window, currency/time basis, and which cost components are included. If no parcel
is accepted in the window, report that condition rather than a misleading unit
cost. Report unknown spend or telemetry as unknown; do not add credentials to the
kernel merely to collect billing data. Numeric improvement claims require actual
before/after evidence. This charter adds no unmeasured percentage target.

**Carriers:** the coordinator records end-to-end parcel/review economics from
available evidence; FK-P7/FK-P14 measure their build paths; FK-P10/FK-P15 measure
contention; FK-P17 measures decision latency; FK-P21 assembles the baseline and
the documented measurement gaps. Keep instrumentation out of authority semantics.

### INF-7: Exhaustive corpus manifests; retrieval remains advisory

Deterministically enumerate the complete in-scope corpus at a named revision.
Maintain a manifest and one explicit disposition for every item, including
unreadable, failed, unsupported, and excluded items with reasons. A failed or
unexamined in-scope item cannot be counted as swept for a rule-retirement claim.
Retrieval may prioritize review but cannot define completeness.

The inspected upstream main at `476b8df6efe6c9974879957147449f61c34cd9a0` has
`shadow_routes: {}`. Do not assume Cerebras or a local GPU route is active.
Model/provider eligibility must come from the current routing policy and actual
host capability; do not substitute a hosted-model name that this session cannot
select. A local GPU evaluation or retrieval index remains outside this kernel's
first-release implementation unless a separate scope decision admits it.

**Carriers:** FK-P0 inventories rules and corpus obligations; FK-P3 covers every
read-surface-reachable mixed evaluator; FK-P19 requires complete sweep evidence
before retirement/promotion; FK-P21 binds manifest identities, counts, and outcomes.

### INF-8: Demonstrate recovery and define measured revisit conditions

Source reproducibility alone does not recover runtime state. FK-P9/FK-P14 must
define the consistent backup boundary, integrity checks, protected destination,
retention, and operator restore sequence. FK-P15 must exercise restore, ownership
reconciliation, and refusal of stale leases, stale authorization, and duplicate
owners. Restore must not silently restart dispatch. Use existing authority and
lease contracts; add no competing recovery authority primitive.

Define recovery-point and recovery-time objectives against actual needs before
claiming an objective is met. Record measured restore behavior while those
numeric objectives remain unresolved; do not silently choose them in a builder.
Any blocking unresolved objective is named at its affected acceptance gate, not
used to hold unrelated contract or evaluator work.

Open a separately governed infrastructure evaluation when continuity, manual proof
regeneration, concurrent verifier demand, sustained queue delay, writer contention,
recovery needs, or cost per accepted parcel justifies it. Revisit triggers do not
automatically choose Azure, authorize spend, or widen D20.

**Carriers:** FK-P9/FK-P14 define backup and restore; FK-P15 proves recovery;
FK-P21 records limitations, objectives, results, and revisit evidence.

### Adoption dependencies and evidence ownership

- U1 (backstop independence) now has a named contract-resolution owner: this goal's coordinator. FK-P18 implements the reviewed producer contract and supplies evidence; FK-P19 independently verifies that evidence at promotion; FK-P21 consolidates and retains evidence that must already exist before promotion. FK-P21 cannot be the first producer of promotion prerequisites.
- Before FK-P18 implementation dispatch, a concrete independently reviewed contract must bind protected verifier/workflow control, builder-input limits, credentials and runner lifecycle, independent negative controls, evidence identities/retention, and bounded unsupported/unavailable outcomes. Missing or invalid evidence refuses promotion. This is an affected-parcel dependency, not a hold on upstream evaluator work. No old A2 draft is revived by this assignment.
- The coordinator owns an observation-window baseline now: an accepted parcel means a parcel accepted through its required green chain and human merge gate; record elapsed times, queue delay, included cost components and unknowns. With no accepted parcels, report zero accepted and undefined cost per accepted parcel. Do not manufacture billing telemetry.
- FK-P9/FK-P14 define backup/restore boundaries and objectives before their affected acceptance gates; FK-P15 measures recovery. Unknown numeric objectives do not block orthogonal work, and no objective is claimed met without measurement.
- The detailed INF carrier paragraphs govern. The companion's section 16 is a convenience summary and cannot narrow them. Existing packaging, HCS and worker-fabric serialization ownership is checked before affected edits; no foreign goal scope is imported.
