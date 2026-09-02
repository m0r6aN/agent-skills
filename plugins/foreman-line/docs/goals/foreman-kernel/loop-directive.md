# Foreman Kernel — Coordinator Loop Directive

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Queue owner:** the Claude Code coordinator session entered via `/goal` on
> 2026-09-01, holding ownership under the developer's explicit transfer of that date.
> Exactly one coordinator owns this goal. Ownership transfers only at a parcel boundary
> by editing this block and recording a handoff. If another live owner is named or
> ownership is ambiguous, stop and report; never assume.

**Handoff record — 2026-09-01.** The prior owner (the primary Codex coordinator
session, 2026-08-30 → 2026-09-01) stopped without a handoff, last writing to this
worktree at 11:10 EDT on 2026-09-01 and leaving `charter.md` modified and eleven
untracked artifacts uncommitted. The developer was asked directly whether that session
was live and ruled it **dead**, transferring ownership to this session with the
instruction to take the lead. Transfer occurred at a parcel boundary: FK-P0 was built
and reworked but never merged, and no dispatch was in flight (no open PRs; every review
worktree clean).

**Inherited-state caveat — read before trusting any FK-P0 claim.** The prior owner
recorded FK-P0 rework rounds R2–R13 in commit messages, but **no review findings for
any of those rounds exist on disk** in this repository, on the parcel branch, or in the
twenty-six `fk-p0-*` review worktrees (all verified clean). Those findings existed only
in the dead session's transcript and are unrecoverable. Under the standing rule that
wrong-shaped claims are presumptively empty, **no R2–R13 review is treated as having
occurred.** FK-P0 re-enters adversarial review from zero under this owner.

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

**STATE 2026-09-02 (live) — THE STOP CONDITION FIRED, AND THE DEVELOPER LIFTED IT. This owner is
running again.** The two-rework tripwire fired after round 2; this owner stopped and wrote
`FK-P0-STOP-REPORT-for-developer.md`. **The developer read it and explicitly lifted the tripwire and
authorised further rounds.** Rounds 3 and 4 followed. This is recorded because the previous version of
this block said STOPPED while the goal was actively running — a stale-state record in the one artifact
a future `/goal resume` trusts first, written by the owner of a parcel whose purpose is making canon
represent reality.

- Parcel branch `codex/fk-p0-canon-authority-enforcement-registry`. Round 3 committed `cc57658`;
  amendments **R19–R23** each committed alone before dependent code (SPEC-CONVENTION §11). Round 4 is
  green at **583/583** and awaiting its commit. **Not pushed. Not merged.**
- **AC13 closed on this owner's authoritative pass** at `cc57658` — exit 0, 583 tests, 583 pass,
  0 fail, stderr empty. Registry YAML and `RECONCILIATION_RECORD_DIGESTS` byte-unchanged throughout.
- Both independent reviewers returned **CLOSED WITH NEW FINDING** twice. Every blocker they raised is
  closed, and each was reproduced closed by this owner's own probes rather than accepted.
- Spec remains in `docs/specs/active/`; **Stage F closure not run.**
- **Gate 3 remains not delegated and no merge has been performed.**

**Known-open at this state, recorded rather than latent:** successor presence (Reviewer B's S3) is an
FK-P1 obligation with a stop condition, and R23 states the structural reason it cannot close in-band —
a stateless validator comparing a document to itself cannot detect a deletion; the surviving O4-bound
residual has one of its two faces pinned by a test; `npm run generate` has never been invoked end to
end.

**A new owner must not treat FK-P0 as one narrow fix away.** R16, R19 and R22 were each this owner's
amendments and each needed correction; the head-exemption design has admitted a tampered registry under
two different owners' hardening. Re-enter at triage, not at build.


**State 2026-09-01 (this owner).** Stage Zero complete; original Gate 1 and scoped
re-ratification complete; plan-level adversarial review complete and triaged. Amendment
**A1 is ratified and committed** (`16d90e5`). Amendment **A1.8 is applied to the working
tree pending the developer's text review** (approach directed 2026-09-01; the text was
never read — see its own known-defect section). Amendment **A2 is PARKED by developer
ruling of 2026-09-01** after four drafts and five independent reviews all returning
REQUEST CHANGES; its subject is recorded as a known unowned risk per A2's own rejection
clause, not silently dropped.

**FK-P0 is in rework round 1 of a maximum 2**, on branch
`codex/fk-p0-canon-authority-enforcement-registry`, base `1cd25b1`.

Round-1 chain to date: coordinator closure check (diff exactly the 28 Allowed Files,
additions-only; `tsc` 0; `biome` 0) -> two independent fresh adversarial reviews, both completed,
satisfying AC15 -> Reviewer A **REWORK REQUIRED** (2 BLOCKER / 8 SHOULD-FIX / 6 INFO), Reviewer B
**SHIP WITH FOLLOW-UPS** (1 BLOCKER / 5 SHOULD-FIX / 7 INFO), later placed on hold by its own
correction -> coordinator triage: **REWORK REQUIRED**, 22 findings dispositioned -> coordinator-
ratified spec amendment **R14** committed alone (`df639f1`) -> goal branch merged onto the parcel
branch (`a703941`) to resolve the charter-binding precondition -> rework directive issued
(`1cd25b1`), builder dispatched and holding at Step 0.

**The reviewers converged on facts and split on severity.** Four defects were found independently
by both sessions. The coordinator ruled for Reviewer A on the pivotal one, on a ground neither
reviewer cited: the spec forbids the manifest pin **twice** (Constraints line 97, and AC3), which
makes it a spec-conformance failure rather than a design choice.

**Open and genuinely unresolved: does `npm test` pass?** One full run returned exit 0; four others,
including an unmutated pristine control, died identically with `semantic-invariants.test.ts` as a
single failing test, `pass 0`, no per-test output, after 23-38 minutes. Every failing run had other
heavy node processes live. The builder's first task after Step 0 is to settle this on an idle
machine. **133 is not the baseline** -- it counts only the five other files.

Gate 3 remains a human action, and now covers **one** merge rather than two, since the goal branch
was merged onto the parcel branch.

The ambient `D:/Repos/agent-skills` checkout has a user-owned change at
`plugins/foreman-line/routing-policy/routing-policy.yaml`; never touch or absorb it.

### Standing stop-condition override — the FK-P0 / A2 spiral

The prior owner drove FK-P0 through twelve rework rounds and amendment A2 through four
drafts without landing either, overriding the charter's own “same tripwire fires” stop
condition each time. That condition is reinstated with teeth: **this owner takes FK-P0
through at most two rework rounds.** A third stops the loop and reports. Rework-round
count is measured from `df8155a` forward under this ownership; inherited rounds are not
carried, but neither are they credited.

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
