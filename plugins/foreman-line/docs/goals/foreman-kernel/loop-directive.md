# Foreman Kernel — Coordinator Loop Directive

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Queue owner:** the primary Codex coordinator session in the task where Clinton
> Morgan ratified the Foreman Kernel charter and re-ratified amendments R1–R13 on
> 2026-08-31. Exactly one coordinator owns this goal. Ownership transfers only at a
> parcel boundary by editing this block and recording a handoff. If another live owner
> is named or ownership is ambiguous, stop and report; never assume.

**Goal worktree:**
`D:/Repos/agent-skills-worktrees/foreman-kernel-stage0-20260830`

**Goal branch:** `codex/foreman-kernel-stage0-20260830`

**Ratified authority:**

- Original Gate 1 charter commit: `c4bf00f6fde9058e1350898914e06f261ae38c93`
- Plan-review triage commit: `a9a48b5656c3ce3837781c962a6ee00035d7f3c6`
- Scoped Gate 1 re-ratification commit:
  `26fb2b56e4861b6122a95f1d413394c0dcd3b4a1`
- Standing Gate 2: active for FK-P0 through FK-P21 under the charter contingencies
- Gate 3: not delegated; every merge is a human action

## Current state — update at every stop or parcel closure

**State 2026-08-31:** Stage Zero complete; original Gate 1 and scoped re-ratification
complete; required fresh plan-level adversarial review complete and triaged; standing
Gate 2 resumed; no implementation parcel shaped or dispatched. **NEXT: FK-P0 fresh
shaping session.** The ambient `D:/Repos/agent-skills` checkout has a user-owned change
at `plugins/foreman-line/routing-policy/routing-policy.yaml`; never touch or absorb it.

## Role and canon

The coordinator consumes verification; it never produces independent verification of
its own work. On every iteration read:

1. `plugins/foreman-line/docs/goals/foreman-kernel/charter.md`;
2. this directive;
3. the active parcel spec, kickstarter, handoff, and review findings;
4. `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`;
5. `plugins/foreman-line/docs/SPEC-CONVENTION.md`; and
6. `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

The plan-review transcript is
`plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md`.

## Standing authorizations and their limits

1. **Gate 2 dispatch** is authorized for exactly FK-P0–FK-P21, in the ratified
   dependency order. A new parcel or changed dependency graph reopens Gate 1.
2. **Shaping and coordinator lint** may proceed when dependencies are satisfied.
3. **Local isolated worktrees, branches, commits, tests, and review artifacts** are
   authorized for the named parcel only. Every parcel gets exact Allowed Files.
4. **Step 0 rulings** stay with the coordinator unless a flag changes a locked decision,
   external-effect boundary, public contract, security boundary, or exact Allowed Files;
   those require a ratified amendment before code.
5. **No external-system effects:** no Jira, cloud, deployment, publication, external
   communication, Docker-socket, signing, billing, credential, or repository-settings
   mutation.
6. **Gate 3 is not delegated.** Never merge. Present the complete green chain and exact
   merge target to the human.
7. A push or PR may occur only when the active parcel contract and developer authority
   clearly cover it; otherwise prepare local PR material and stop before the external
   action.

## Per-parcel algorithm

1. Verify the current queue item and all dependencies against Git, not memory.
2. Dispatch a fresh shaping session in docs-only mode. It drafts one spec with exact,
   non-glob Allowed Files, Forbidden, Out of Scope, contracts, tests, evidence, collision
   risks, and Step 0 requirements.
3. Coordinator-lint every factual claim on disk. Check the spec against the charter word
   for word where it restates a locked decision or exit criterion. A missing product
   decision stops the loop.
4. Gate 2 is already active only if the spec stays within the charter. Create the parcel's
   named isolated worktree and branch from a verified base; never use the ambient checkout.
5. Dispatch a fresh builder. Its first action is Step 0 restate-and-stop: scope, exact
   Allowed Files, branch/worktree, dependencies, contract, verification, and every
   out-of-scope item. No code before coordinator confirmation.
6. Verify the builder's committed SHA and completion claim on disk before accepting it.
   Wrong-shaped claims are empty. Never dispatch review against uncommitted work.
7. Run the parcel's deterministic pass on the coordinator environment. Capture complete
   command output before trusting exit codes. Node/package work runs sequentially on
   Windows to avoid dependency-install races.
8. Every Foreman Kernel parcel is architecture/risk or critical unless its ratified spec
   says otherwise. Architecture/risk receives **two independent fresh reviews**. Reviewers
   never fix or commit and are explicitly licensed for hostile-input and mutation probing.
9. Triage findings as fix / accept-as-documented / informational. Reproduce disputed
   blockers before ruling. Rework gets a new Step 0 gate and a test-count tripwire.
10. When green, prepare the verification-chain table and PR material. Stop at the human
    Gate 3 before merge.
11. After a human merge, perform Stage F: spec to `done/`, lessons with dispositions,
    evidence index, worktree/branch cleanup, and this state block update.

## Queue and dependency order

| Parcel | State | Depends on |
|---|---|---|
| FK-P0 — Canon authority and enforcement registry | **NEXT — SHAPING** | none |
| FK-P1 — Lifecycle, admission, and decision contracts | pending | FK-P0 |
| FK-P2 — Spec-body compiler | pending | FK-P0, FK-P1 |
| FK-P3 — Pure dispatch decisions | pending | FK-P1 |
| FK-P4 — Verifier facade | pending | FK-P1, FK-P2, FK-P3 |
| FK-P5 — Clean-room trust-core spike | pending | FK-P4 |
| FK-P6 — Read-only MCP server | pending | FK-P4, FK-P5 |
| FK-P7 — Stateless verifier image and launcher | pending | FK-P6 |
| FK-P8 — Stateless harness portability proof | pending | FK-P7 |
| FK-P9 — SQLite storage and migration ABI | pending | FK-P1 |
| FK-P10 — Lease and transition engine | pending | FK-P9 |
| FK-P11 — Legacy import and projection engine | pending | FK-P9, FK-P10 |
| FK-P12 — Authorization policy engine | pending | FK-P2, FK-P10 |
| FK-P13 — Admission-protected control catalog | pending | FK-P6, FK-P10, FK-P11, FK-P12 |
| FK-P14 — Stateful image composition and operator lifecycle | pending | FK-P7, FK-P13 |
| FK-P15 — Stateful restart and admission proof | pending | FK-P14 |
| FK-P16 — Claude lifecycle adapter, shadow mode | pending | FK-P12, FK-P13, FK-P15 |
| FK-P17 — Bypass and outage harness | pending | FK-P16 |
| FK-P18 — CI scope and state-evidence backstops | pending | FK-P17 |
| FK-P19 — High-confidence refusal enforcement | pending | FK-P17, FK-P18 |
| FK-P20 — Second-host feasibility and host registration | pending | FK-P19 |
| FK-P21 — Exit evidence manifest and clean-room proof | pending | FK-P19, FK-P20 |

Parallelism is allowed only after contracts merge and only for parcels with no shared
serialization point. The coordinator owns sequencing for manifests, lockfiles, package
exports, Docker/launcher files, migrations, hook registration, and CI workflows exactly
as assigned in the charter.

## FK-P0 shaping mandate

FK-P0 produces the canonical authority/enforcement registry and reconciles operative
contradictions before any runtime contract freezes. Its spec must:

- inventory every standing builder, reviewer, coordinator, gate, stop, and authority rule;
- classify each rule as pre-action refusal, post-action detection, CI/static check,
  independent review/human judgment, narrative provenance, or unsupported;
- define precedence, stable rule identity, source locator/digest, applicability, severity,
  decision semantics, enforcement owner, retirement state, and corpus-sweep evidence;
- reconcile gate-count language, current spec-linter/profile behavior, and live-vs-stale
  canon without rewriting historical artifacts;
- mechanically prohibit human approval, independent-verifier evidence, merge authority,
  closure authority, and generic receipt minting from agent-callable control state;
- define golden registry fixtures and mutation controls for identity/location/value,
  stale-source, duplicate-rule, contradictory-authority, and missing-source cases; and
- remain contract/docs only: no hooks, MCP server, SQLite runtime, Docker, external calls,
  or edits to the user-owned routing policy change.

## Stop conditions

Stop and report if:

- ownership is ambiguous or another live coordinator is named;
- a locked decision, parcel graph, exit criterion, external-effect boundary, or human gate
  needs to change;
- a required file falls outside exact Allowed Files;
- a current goal/parcel owns a required serialization point and sequencing is unresolved;
- a proposed control trusts self-asserted identity or can manufacture human/independent
  authority;
- a read-only path can escape its admitted repository or reach the state volume;
- a security finding cannot close inside the parcel;
- the same tripwire/rework cap fires as defined by the parcel;
- a reviewer or builder modifies the ambient checkout or another worktree;
- a user-owned change collides with the parcel; or
- the queue is empty without every goal exit criterion evidenced.

## Wakeup and crash recovery

Completion notifications are the primary wake signal. Use long fallback waits only while a
builder or reviewer is running; never poll rapidly. After a host restart or missing result,
check whether the session is still running before interpreting disk state. Uncommitted work
without a completion claim is unclaimed. A recovery session must restate the original
directive, inventory disk state and test count, identify gaps/half-written files, and stop
for coordinator ruling before continuing.
