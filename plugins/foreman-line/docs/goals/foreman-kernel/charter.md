# Goal Charter — Foreman Kernel

**Created:** 2026-08-30
**Owner:** Clinton Morgangit
**Status:** fully ratified as amended — scoped Gate 1 re-cleared and standing Gate 2 resumed 2026-08-31
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
Gate 2.” D1–D20 and the amended graph/exits are binding.

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
| FK-P1 — Lifecycle, admission, and decision contracts | Versioned lifecycle event, authenticated-principal/local-capability admission, `authorizeAction`, decision envelope, refusal-code, assurance-level, repository identity, content/read-capability boundary, host-path normalization split, and golden vectors. | critical / architecture-risk | FK-P0 |
| FK-P2 — Spec-body compiler | Parses required spec sections and compiles exact non-glob Allowed Files plus frozen/forbidden surfaces; rejects ambiguity, traversal, equivalent-path, symlink/reparse escape, and missing authority. | critical / architecture-risk | FK-P0, FK-P1 |

**Wave 0 exit:** contracts and fixtures are merged; exact path authority can be compiled
without reading `surfaces:` as mutation permission; plan-level contradictions have no
unresolved implementation consequence.

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
| FK-P17 — Bypass and outage harness | Exercises shell, subprocess, custom-tool/MCP, symlink/reparse, subagent, mediated bypass, hook non-enrollment, stale state, service timeout, and restart; produces the mechanical/detected/unsupported matrix. | critical / architecture-risk | FK-P16 |
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
BLOCKERs, and the resulting scoped re-open for R1–R13 was explicitly re-ratified. D1–D20,
FK-P0–FK-P21, the amended wave exits, scenarios, and goal exit criteria are in force.

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
7. versioned typed tool contracts plus the read-confidentiality boundary (D17, D19);
8. the FK-P0 through FK-P21 dependency graph and Wave 0–4 exit criteria;
9. the explicit out-of-scope list and thirteen integration scenarios;
10. standing Gate-2 dispatch authorization under the stated contingencies; and
11. nondelegated human Gate 3 for every merge.

**Gate 1 record:** Clinton Morgan explicitly ratified the original list and authorized
the contingent Gate 2 dispatch grant on 2026-08-31, then explicitly re-ratified plan-review
amendments R1–R13 and resumed Gate 2 on 2026-08-31. Parcel shaping and dispatch may now
proceed in dependency order under the stated contingencies.
