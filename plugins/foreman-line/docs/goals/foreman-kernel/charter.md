# Goal Charter — Foreman Kernel

**Created:** 2026-08-30
**Owner:** Clinton Morgan
**Status:** ratified — Gate 1 cleared and standing Gate 2 authorization granted 2026-08-31
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
dispatches.” D1–D17 are binding.

| ID | Decision | Reasoning |
|---|---|---|
| D1 | This is a new goal, `foreman-kernel`, separate from `plugin-packaging-and-scaffolder`. | The packaging/scaffolder goal owns distribution and canon scaffolding. This goal owns runtime contracts, evaluation, operational state, and hook enforcement. Shared manifests and other serialization points are explicitly sequenced rather than casually co-owned. |
| D2 | Git remains authoritative for ratified charters, specs, policies, reviews, human-gate artifacts, and committed proof. SQLite becomes authoritative only for operational state: revision, lease, pending transition, wakeup/handoff, evidence index, and projection cursor. | A running process must not become hidden product or approval authority. Operational state needs concurrency and restart safety that Markdown cannot provide; ratified canon must remain diff-reviewable. |
| D3 | The kernel is divided into a provider-neutral trust core, a read-only MCP surface, a separately registered control surface, and thin host adapters. | An arbitrary harness should be able to discover validators without discovering state-changing tools. Host quirks must not leak into policy semantics. |
| D4 | First release scope is: compiled constraints, pure evaluators, read-only Docker MCP, durable operational state, one hook adapter in shadow mode, and enforcement of independently proven refusal classes. | This is the minimum vertical slice that eliminates install friction and memory-only enforcement without prematurely centralizing external authority. |
| D5 | There is no generic `mintReceipt` tool in the first release. No agent-callable tool may mint Gate-1 approval, independent-verification, merge, or closure authority. | Current receipt validation is structural, current receipt builders trust caller-supplied custody inputs, and current merge metadata is not source-control authenticated. Publishing those surfaces would create an authority oracle. |
| D6 | Receipt tools exposed in the first release are explicitly labeled structural. Authoritative stage-specific issuance is a follow-on goal gated on canonical hash recomputation, trusted-key verification, legal-transition checks, evidence-derived subjects, atomic append, and live source-control binding. | Tool names and assurance labels must not overclaim what existing validators prove. |
| D7 | One portable MCP contract is primary. Claude Code receives the first lifecycle-hook adapter; Codex and other harness adapters follow only where capability probes demonstrate equivalent lifecycle mediation. | The repo already documents that some plugin/session surfaces ignore hook, MCP, or permission frontmatter. Portability belongs in the protocol, not in a false claim that all hosts enforce equally. |
| D8 | Hooks begin in shadow mode. After negative tests, bypass probes, and corpus reconciliation, governed mutations fail closed when the kernel is unavailable. Read-only work may continue only in an explicit degraded mode that records the missing assurance. | Failing open makes enforcement claims false; failing every operation closed makes Docker a development-wide outage. The boundary must be explicit and testable. |
| D9 | Human authority is preserved: Gate 1 is nondelegable; Gate 2 may be delegated only by an explicit charter-scoped standing authorization; Gate 3 remains human-owned unless a distinct agent identity is mechanically authorized and verified live. | Hooks and MCP are enforcement mechanisms, not new authority sources. Human-only conditions produce `awaiting_human` stop reports rather than unfinishable stop-hook loops. |
| D10 | Exact `Allowed Files` is compiled from the spec body before path refusal is implemented. `surfaces:` remains routing/audit metadata and never substitutes for mutation authority. | The existing frontmatter linter does not provide the exact path contract needed by hooks. Enforcing a different field would mechanize the wrong rule. |
| D11 | A defect class is retired from the agent reading path only after: a deterministic predicate exists, a negative test proves refusal, the existing corpus is swept, and an independent bypass attempt fails. Provenance and rationale remain in the lessons record. | Removing prose before enforcement is proven merely hides the rule. Installing a future rule without reconciling existing instances leaves the class alive. |
| D12 | Hooks are adapters, not policy engines. They normalize lifecycle events, call `authorizeAction`, honor the structured decision, and report observed effects. All policy IDs, refusal codes, state transitions, and evidence rules live in the kernel contract. | This prevents host-specific shell scripts from becoming a second, drifting policy implementation. |
| D13 | Pre-action path checks are backed by post-action realpath-aware Git-diff detection and CI. Reviewer sessions fail closed on opaque mutation-capable shell; builder shell limitations are disclosed rather than described as complete containment. | Shells, generators, subprocesses, custom tools, symlinks, and external applications defeat universal tool-call parsing. Layered detection is honest; unsupported containment claims are not. |
| D14 | Operational state uses SQLite WAL with schema migrations, foreign keys, append-only events, single-writer goal leases, optimistic expected revisions, idempotency keys, and deterministic generated Markdown views. The process may cache state but is never the only copy. | One process in front of durable state improves resume cost; one process holding ephemeral truth creates a single point of loss and split-brain risk. |
| D15 | The first container has no Jira, SCM, cloud, signing, Docker-socket, or other external-write credential. Repository access is read-only until a later parcel explicitly introduces a narrowly authorized effect. | The portable verifier should not inherit unrelated blast radius. State mutation is not permission to mutate external systems or Git canon. |
| D16 | Existing mixed functions are split before exposure: routing and skill selection become pure decisions plus separately authorized recorders. Routing/skill sidecars do not share a directory interpreted as a receipt chain. | Current functions mix calculation, timestamps, directory creation, and overwriteable files. Exposing them unchanged would make a supposedly read-only tool mutate the repo and can poison receipt-directory validation. |
| D17 | Every public tool has a versioned input/output schema, stable refusal codes, input/policy digests, explicit assurance level, bounded payloads, and consistent decision semantics. Policy refusal is a successful structured result; malformed protocol or kernel failure is an MCP error. | Hooks and harnesses must distinguish deliberate refusal from process failure without parsing free-form prose. |

## 5. First-release architecture

```text
Claude hook adapter
        |
        v
authorizeAction lifecycle contract -----> control MCP catalog
        |                                  - leases / CAS transitions
        |                                  - evidence refs / projections
        v
provider-neutral trust core ------------> read-only MCP catalog
                                           - lintSpec / compileAllowedFiles
                                           - previewRouting / resolveSkills
                                           - validate policy / registry / matrix
                                           - structuralValidateReceipt/Chain
                                           - audit and branch-posture evaluation
        |
        v
SQLite event ledger + generated Markdown projections

Git canon remains outside the kernel's unilateral authority.
CI and source-control rules remain independent backstops.
```

### Common decision envelope

Every tool result follows one versioned shape with:

- `apiVersion` and `toolVersion`;
- `decision`: `ALLOW | REFUSE | ADVISORY | APPLIED | NOOP | CONFLICT | REQUIRE_HUMAN`;
- stable `code` and structured `violations[]`;
- `inputDigest`, `policyDigest`, and, where applicable, `goalRevision`;
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
4. `POLICY_SELF_MODIFICATION` / `BYPASS_MODE_FORBIDDEN`; and
5. `OWNER_LEASE_MISMATCH` / `STATE_REVISION_STALE` / `GATE_NOT_SATISFIED`.

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
| FK-P1 — Lifecycle and decision contracts | Versioned lifecycle event, `authorizeAction`, decision envelope, refusal-code, assurance-level, repository-identity, and path-normalization schemas with golden vectors. | critical / architecture-risk | FK-P0 |
| FK-P2 — Spec-body compiler | Parses required spec sections and compiles exact non-glob Allowed Files plus frozen/forbidden surfaces; rejects ambiguity, traversal, equivalent-path, symlink/reparse escape, and missing authority. | critical / architecture-risk | FK-P0, FK-P1 |

**Wave 0 exit:** contracts and fixtures are merged; exact path authority can be compiled
without reading `surfaces:` as mutation permission; plan-level contradictions have no
unresolved implementation consequence.

### Wave 1 — Pure trust core

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P3 — Pure dispatch decisions | Splits routing and skill resolution into deterministic no-I/O decision functions with injected validated policy and stable digests; legacy writers remain compatibility adapters. | elevated / architecture-risk | FK-P1 |
| FK-P4 — Verifier facade | One provider-neutral library facade over immediate validators/evaluators; chain results say `STRUCTURAL`; content inputs are preferred over arbitrary host paths. | elevated / architecture-risk | FK-P1, FK-P2, FK-P3 |
| FK-P5 — Clean-room trust-core spike | Runs the facade against an unrelated fixture repository, including positive, negative, malformed, hostile-path, and degraded-assurance cases. | elevated / standard-feature | FK-P4 |

**Wave 1 exit:** every first-release evaluator is deterministic, no-I/O unless explicitly
documented, contract-tested, and proven against an unrelated repository.

### Wave 2 — Read-only MCP and container

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P6 — Read-only MCP server | Registers the versioned read-only catalog, strict schemas, payload limits, health/readiness/version endpoints, and semantic-parity tests against the library facade. | critical / architecture-risk | FK-P4, FK-P5 |
| FK-P7 — Reproducible Docker image and launcher | Multi-stage Node image with one dependency graph, non-root runtime, read-only root filesystem/repo mount, no external credentials, named persistent volume, explicit named-container launcher and labels. | elevated / architecture-risk | FK-P6 |
| FK-P8 — Harness portability proof | Calls the same image from at least two independent harness shapes without package-local installs and records tool/version/policy digests. | elevated / standard-feature | FK-P7 |

**Wave 2 exit:** a pinned container serves the read-only verifier to independent
harnesses and survives a clean-room launch without package-local installation.

### Wave 3 — Durable operational state

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P9 — State schema and transition engine | SQLite migrations, events, goals, leases, artifact refs, projections, CAS revisions, idempotency, WAL/busy policy, backup/recovery, and crash/concurrency tests. | critical / architecture-risk | FK-P1 |
| FK-P10 — Control MCP catalog | Separately registered state/control tools for get/claim/renew/release/transition/evidence/project; no external or Git mutation. | critical / architecture-risk | FK-P9, FK-P6 |
| FK-P11 — Markdown import and projection | Explicitly imports legacy operational state without manufacturing approvals, dual-reads during shadow migration, reports divergence, and deterministically projects reviewable Markdown. | critical / architecture-risk | FK-P9, FK-P10 |

**Wave 3 exit:** two simulated coordinators cannot split ownership; restart reconstructs
state from SQLite; stale revisions conflict; repeated requests are idempotent; projections
are byte-deterministic and Git evidence wins reconciliation.

### Wave 4 — Hook adapter and enforcement promotion

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| FK-P12 — Claude lifecycle adapter, shadow mode | Capability-preflighted SessionStart/PreToolUse/PostToolUse/Stop adapter that normalizes events and records would-allow/would-refuse decisions without blocking. | critical / architecture-risk | FK-P2, FK-P10, FK-P11 |
| FK-P13 — Bypass and outage harness | Exercises shell, subprocess, custom-tool/MCP, symlink/reparse, subagent, bypass-mode, stale-state, service-timeout, and container-restart cases; produces a coverage and limitation matrix. | critical / architecture-risk | FK-P12 |
| FK-P14 — High-confidence refusal enforcement | Promotes only the five initial classes whose negative controls and corpus sweeps pass; implements explicit degraded read-only mode and fail-closed governed mutation. | critical / architecture-risk | FK-P13 |
| FK-P15 — CI backstops and second-host feasibility | Mirrors exact-scope and state/evidence invariants in CI; probes Codex lifecycle capabilities and either ships a thin adapter with parity evidence or records the precise unsupported gap without overclaiming. | elevated / architecture-risk | FK-P14 |

**Wave 4 exit:** selected violations are mechanically refused on the proven host,
unmediated changes are detected by diff/CI, service outages have bounded recovery, and
host portability claims match demonstrated capability.

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
2. **Pure routing:** repeated identical routing and skill inputs return identical decisions
   and digests with zero repository writes.
3. **Structural honesty:** a structurally valid but tampered receipt chain is never reported
   as cryptographically verified or Gate-3-ready.
4. **Restart recovery:** the container restarts and reconstructs the same goal revision,
   lease history, evidence index, and Markdown projection.
5. **Split-brain refusal:** two coordinator identities race for one goal; exactly one lease
   wins and stale transitions conflict.
6. **Scope refusal:** a structured write outside Allowed Files is refused before execution;
   shell-mediated drift is caught post-action and by CI.
7. **Reviewer posture:** structured mutation and opaque mutation-capable shell refuse;
   a dirty review worktree blocks completion.
8. **Human gate:** a human-only state produces `REQUIRE_HUMAN` plus an agent-completable
   stop report; the Stop hook does not loop.
9. **Outage posture:** kernel loss blocks governed mutation, permits only recorded degraded
   read-only work, and recovers without manufactured events.
10. **Host capability:** each supported adapter passes a real process-boundary capability
    probe; unsupported lifecycle events are reported as gaps.

## 9. Goal exit criterion

This goal exits only when:

1. Waves 0–4 are merged through the required human Gate 3 process.
2. The container exposes versioned read-only and control catalogs without per-package
   installs, and the catalogs are not discoverable interchangeably.
3. The clean-room and harness-portability scenarios pass against a pinned image digest.
4. SQLite state survives restart; lease/CAS/idempotency/crash/concurrency tests pass; and
   generated Markdown reconciles deterministically to Git evidence.
5. The five initial refusal classes have negative tests, bypass probes, corpus sweeps, and
   independent review evidence before enforcement is enabled.
6. CI catches an intentionally introduced out-of-scope mutation that bypasses the hook.
7. No first-release tool can mint approval, independent-verification, merge, or closure
   authority, and no container credential permits external mutation.
8. The final report separates mechanically enforced, detected-only, CI-enforced,
   human-judgment, unsupported-host, and deferred-receipt controls.

## 10. Human gates and standing authorizations requested

### Gate 1 — charter ratification

**CLEARED 2026-08-31 — nondelegable developer ratification recorded.** Ratification
locks D1–D17, the parcel graph, first-release boundary, exit criterion, and stop
conditions.

### Gate 2 — parcel dispatch

**AUTHORIZED 2026-08-31 as a standing Gate 2 grant:** after the plan-level adversarial
review is triaged and any decision-changing amendment is re-ratified, the coordinator may
shape and dispatch FK-P0 through FK-P15 in dependency order. Authorization is void for any
parcel whose spec changes a locked decision, widens external effects, or omits exact
Allowed Files.

### Gate 3 — merge

Not delegated. Every merge remains human-owned for this goal. The coordinator may prepare
branches, commits, verification evidence, reviews, and PR material, but must stop and
present the green chain for the human merge action.

## 11. Stop conditions

The coordinator stops and reports if any of the following occurs:

- Gate 1 is not explicit or a locked decision becomes ambiguous;
- a fresh plan review changes D1–D17 or the exit criterion without re-ratification;
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
- `plugin-packaging-and-scaffolder` remains a separate goal. Before any manifest or
  packaging edit, the coordinator reconciles that goal's live status and ownership.
- The first image is built from committed source and pinned policies. It does not read
  mutable policy from arbitrary target repositories unless a contract explicitly allows a
  validated, digest-bound override.

## 13. Gate 1 decision list

Ratifying this charter confirms:

1. the authority split and separate `foreman-kernel` goal (D1–D3);
2. the bounded first-release scope and no-generic-mint boundary (D4–D6);
3. portable MCP with host-specific adapters and shadow-first enforcement (D7–D8);
4. preserved human gates (D9);
5. the Allowed-Files compiler and rule-retirement standard (D10–D13);
6. durable SQLite state, credential-free first container, and pure/effect separation
   (D14–D16);
7. versioned typed tool contracts (D17);
8. the FK-P0 through FK-P15 dependency graph and Wave 0–4 exit criteria;
9. the explicit out-of-scope list and ten integration scenarios;
10. standing Gate-2 dispatch authorization under the stated contingencies; and
11. nondelegated human Gate 3 for every merge.

**Gate 1 record:** Clinton Morgan explicitly ratified this list and authorized the
contingent Gate 2 dispatch grant on 2026-08-31. No parcel may be shaped or dispatched
until the required plan-level adversarial review is triaged; any decision-changing
finding reopens Gate 1 only for the affected decision.
