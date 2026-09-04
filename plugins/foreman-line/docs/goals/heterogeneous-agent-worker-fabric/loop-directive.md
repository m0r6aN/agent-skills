# Coordinator Loop Directive — Heterogeneous Agent Worker Fabric

This file replaces the pre-Gate-1 pickup directive. Gate 1 is closed (including amendment
A1) and Gate 2 is granted for WF-P0 only. `charter.md` is authoritative for decisions, the
parcel graph, and the exit criterion; this file is authoritative for ownership, authority
scope, and loop mechanics.

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Queue owner: the Claude Code coordinator session started by Clinton Morgan on
> 2026-09-03 (`/goal resume heterogeneous-agent-worker-fabric`).** Working from the
> dedicated worktree
> `D:\Repos\agent-skills-worktrees\heterogeneous-agent-worker-fabric-coordinator-claude-20260903`
> on branch `claude/heterogeneous-agent-worker-fabric-coordinator-20260903`, based on
> `cba257e`.
>
> **Transfer record.** Ownership moved from the Codex `/root` coordinator, which claimed this
> goal on 2026-09-03 and stopped at `stopped_awaiting_gate_1_amendment_A1`. The transfer was
> explicitly ruled by the developer at a **pre-dispatch boundary**: Gate 2 was absent, no
> parcel had been shaped or dispatched, and no parcel branch existed — so no live parcel was
> crossed. The prior coordinator's Stage Zero work is preserved unmodified on
> `codex/heterogeneous-agent-worker-fabric-coordinator-20260903` @ `cba257e`, which is
> **local-only and unpushed**; do not delete that branch or its worktree without the
> developer's word.
>
> One goal has one root coordinator. If you are not the owner named above, do not dispatch.
> Ownership transfers only at parcel boundaries, and only by updating this block. If
> ownership is ever ambiguous, stop and report — never assume. (Rule earned when a second
> coordinator committed onto a live parcel branch, 491fb80, benign only by luck.)

**State:** `active — Gate 2 granted for WF-P0; WF-P0 shaping is the next action`

**Entry prompt:**

```text
/goal resume heterogeneous-agent-worker-fabric
```

## Who you are

The Coordinator (D4) for this goal: you consume verification results and never produce them.
You route rework, ratify spec amendments, run deterministic passes, triage adversarial
reviews, and hold the paper trail. Read at the start of every iteration:

- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md` — decisions,
  graph, exit criterion;
- this file — ownership, authority, queue state;
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` — the role charter;
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — spec shape and lint rules;
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` — included by reference in
  every dispatch.

`reconciliation.md` is the Stage Zero evidence record and `plan-review-findings.md` the closed
plan-level review. Neither is an instruction source.

## Standing authorizations (granted by the developer 2026-09-03; scoped to this goal only)

1. **Dispatch (Gate 2) is granted for exactly one parcel: WF-P0 — topology and authority
   inventory.** Shaping, coordinator lint, builder dispatch, deterministic pass, adversarial
   review, triage, and rework for WF-P0 are all covered. **Every other parcel — WF-P1 through
   WF-P18 — requires a new explicit grant naming exact parcel IDs.** A new parcel idea, or a
   WF-P0 finding that argues for reordering the graph, is a stop-and-report, not a dispatch.
2. **Step 0 rulings stay with you**, with two carve-outs that are loop-stops rather than
   rulings: a flag requiring modification of a frozen contract, and a flag requiring a change
   to a ratified locked decision or the parcel graph (that is a Gate 1 re-open, scoped).
3. **Merge (Gate 3) is NOT granted.** Per amended D8, Gate 3 governs every parcel merge and
   was explicitly not delegated for this goal. When WF-P0's chain is green, you stop and
   present it for the developer's merge decision — you do not merge, and you do not treat a
   green chain as implied authorization. Default-route activation is separately and
   human-exclusively the developer's, and no standing merge authorization could ever cover it.
4. **Local commits, branches, and worktrees inside this repo are authorized.** Pushing a
   branch and opening a PR are authorized **only** to present WF-P0 for the Gate 3 decision,
   and only for this repo. No force push, no repo-settings change, no other repository.
5. **No provider call, no spend, no secret access, no external effect.** WF-P0 is discovery
   only. Credentials are referenced by name and never read or emitted (D5). If any step would
   require a live provider call or a credential value, that is a loop-stop.

## Per-iteration algorithm

1. Read `charter.md` and this file. Identify the active queue item and the exact loop step it
   sits at. If you were expecting a builder or reviewer result, run the crash-recovery check
   below **first**.
2. Advance as far as this iteration allows. Builders, shaping agents, and adversarial
   reviewers are fresh sessions with no coordinator context beyond their kickstarter. Every
   dispatch — **including rework** — opens with a Step 0 restate-and-stop gate. The branch and
   worktree are named in the directive, never ambient. Worktrees for this goal live at
   `D:\Repos\agent-skills-worktrees\hwf-<parcel>-<yyyymmdd>`.
3. **Verify every claim on disk before accepting it.** Green checks verify state; only
   per-item closure checks verify work. A wrong-shaped completion claim is presumptively
   empty. Run the closure check against disk BEFORE re-running anything.
4. Deterministic passes run on this machine in **PowerShell only**, with `node -v` first, and
   never read an exit code through a truncated pipeline.
5. Adversarial review: WF-P0 is `architecture/risk`, so it takes **two independent frontier
   reviews** in fresh sessions with zero builder context. Reviewers never fix and never
   commit; hostile-input probing is explicitly licensed. Where the two reviews disagree,
   reproduce the disputed finding yourself before triaging — your reproduction is the
   tie-breaker at triage and the closure proof at acceptance.
6. Triage into fix / accept-as-documented / informational, appended to a goal-local findings
   file. A real spec gap becomes a ratified amendment **committed alone before any code**.
   Rework carries a test-count tripwire.
7. On a green chain: assemble the verification-chain table, then **stop for the Gate 3 merge
   decision** (authorization 3). Do not proceed to Stage F on your own authority.
8. Stage F after the developer's merge: spec to `done/`, worktree and branch cleanup, lessons
   recorded (see the ledger note below), and `charter.md` plus this file's ownership block and
   state line updated.

## Queue (strict order)

1. **WF-P0 — topology and authority inventory.** `critical`, routing class
   `architecture/risk`, no dependencies. Deliverable per the ratified graph: a current
   three-role topology, trust-boundary, package, and rollback-path map. **Dispatch authorized.**
   Two notes to carry into shaping:
   - Exit criterion item 1 requires the current three-role path to be *mapped* **and to remain
     a tested rollback path**. Per lesson #33, diff the spec's restatement of that item against
     `charter.md` word by word before dispatch, and do not let "documented rollback path"
     silently replace "tested rollback path."
   - WF-P0 is discovery only. It must not modify `routing-policy.yaml`, the contracts package,
     or any validator surface. Its `surfaces:` should be documentation paths plus, at most,
     read-only inventory tooling.
   - **The three-role referent is on disk, not in prose.** `routing-policy.yaml` carries a
     `roles:` map (v0.3 lines 113–116) naming exactly `coordinator`, `verifier`, and
     `builder`. Under amended D4 that file is the sole registry authority and outranks
     `COORDINATOR-PATTERN.md`'s five-row dispatch table, which is an operational summary. The
     charter's "three-role path" phrase is grounded, not loose.

2. **WF-P1 … WF-P18 — NOT DISPATCHABLE.** Listed in `charter.md` in dependency order. Each
   requires a new Gate 2 grant. Do not shape ahead: WF-P0's inventory is expected to inform
   WF-P1's contract shape, and shaping WF-P1 early would bake in assumptions WF-P0 exists to
   test.

## Mandatory pre-dispatch check — base lineage (earned 2026-09-03)

Before dispatching **any** agent for this goal, verify in the target worktree that its base
contains current `main`, and state the result in the dispatch directive:

```powershell
git merge-base --is-ancestor origin/main HEAD   # or: git log --oneline HEAD..main
```

This is not hypothetical hygiene. This goal's coordinator worktree was created from the prior
coordinator's tip (`cba257e`, descended from PR #14) and therefore carried routing-policy
**v0.1** while `main` carried **v0.3** (PR #15, `096adfb`). The coordinator's own ratification
lint had been run in the `main` checkout and then written into a charter living on the stale
branch — true of the repository, false of the branch it sat on. WF-P0's shaping agent caught
it by checking lineage the directive never asked it to check. Had it not, WF-P0 would have
inventoried v0.1 as "current" and seventeen downstream parcels would have inherited a
manufactured picture — precisely the failure D3 exists to prevent, arriving by a route the
charter did not anticipate.

Two rules follow. **A goal branch based on another coordinator's tip inherits that tip's blind
spots, not the repository's current state.** And **a coordinator lint must name the checkout it
ran in** — "verified on disk" is not a location.

## Never write into a live agent's worktree (earned 2026-09-04 — the coordinator broke this)

The coordinator ratified the WF-P0 spec by editing and committing **inside the shaping
agent's worktree while that agent was still active** — flipping `status:`, repairing two
stale lines, and landing two amendment commits on `claude/hwf-wf-p0-shaping-20260903`. One
worktree, one writer, is the rule that existed precisely to prevent this, and the coordinator
is not exempt from it.

**The collision actually happened, and a mechanism — not discipline — is what held the line.**
The first account of this said "harmless by luck." The shaping agent then supplied the detail
that makes it precise: during its final pass, two of its `Edit` calls failed with *"File has
been modified since read"* on content byte-identical to what it held. That was the
coordinator's write landing between the agent's read and its write. The harness's stale-read
guard fired, refused the write, and produced a visible signal. Nothing was lost because the
guard caught it, not because either writer was careful.

Two rules come out of that, and the second is the one that would have caught it sooner:

1. **The guard is the backstop, never the plan.** It protects a single file against a
   read-write straddle. It would not have protected a `git add`/commit sequence, a file the
   other writer had not read, or an edit routed through a shell command.
2. **"The file changed under me and I don't know why" is a stop condition, not a re-read.**
   The agent attributed the failures to a linter touching mtime and re-read past them — a
   reasonable guess that was wrong, and that discarded the only live signal either writer got.
   A future dual-writer collision will announce itself exactly this way. Any agent seeing an
   unexplained stale-read failure stops and reports it rather than retrying through it.

Had the agent committed between the coordinator's read and write, its fix would have been
clobbered silently — the same shape as the incident that produced the one-goal-one-coordinator
rule (`491fb80`, also benign, also only by luck).

The rule, and how to satisfy it: **when a document inside a live agent's worktree needs to
change, route the change through that agent.** Send the exact replacement text and have the
agent commit it, identified as a coordinator-ratified amendment per SPEC-CONVENTION §11. If
the agent is gone, take ownership of the worktree explicitly — confirm it is idle, say so in
the commit message — before touching it. Applied correctly the same day: the builder's
one-word `## Allowed Files` count amendment was routed *to* the builder rather than edited
into its worktree.

Corollary for ratification specifically: `status: draft` → `active` is the coordinator's
decision, but it need not be the coordinator's *keystroke*. Prefer ruling and having the
shaping session commit the flip.

## Dispatch artifacts must live on the branch you dispatch from (earned 2026-09-04)

**Root cause of three of WF-P0's defects, all the coordinator's.** This goal ran two divergent
branches — a coordinator branch (`claude/heterogeneous-agent-worker-fabric-coordinator-20260903`)
holding the charter, loop directive, kickstarters, and lint records, and a parcel branch
(`claude/hwf-wf-p0-shaping-20260903`, then `claude/hwf-wf-p0-20260904`) holding the spec and the
shaping report. The coordinator wrote artifacts to the first and dispatched agents from the
second, with cross-references pointing between them. Consequences, each found by the builder
rather than the coordinator:

1. **The builder's own dispatch directive was absent from its worktree.** The kickstarter was
   committed to the coordinator branch (`bda734d`), which is not an ancestor of the builder's
   base (`b9f4e1a`). The dispatch message asserted the file was "committed in your worktree at
   …" and it was not. The builder located it in the coordinator worktree and read it read-only,
   which was the correct recovery.
2. **The ratified spec cites a file its own branch does not contain** — `wf-p0-shaping-lint.md`,
   written to the coordinator branch (`2ef49df`).
3. **AC12 became unsatisfiable.** Its check is `git diff --name-only origin/main...HEAD`, which
   returns nine paths on the parcel base because the base moved to a branch tip carrying the
   coordinator's and shaping session's own commits. Measured correctly — against the parcel's
   own base SHA — the builder changed exactly one file, so the criterion's *intent* held while
   its wording failed.

**The rules.** Before dispatching: (a) verify every path the directive names actually exists in
the target worktree — `git -C <worktree> cat-file -e <base>:<path>` or simply read it there,
because asserting a location is the same defect class as asserting a lint's checkout; (b) keep
one lineage per goal, or consolidate before dispatch — the parcel branch is based on the
coordinator branch, and the coordinator merges its own artifacts down before an agent needs
them; (c) any acceptance criterion whose check names a diff base must name **the parcel's base
SHA**, never `origin/main`, unless the two are provably identical.

Defect 3 deserves its own note: it is an instance of the failure mode named in the next
section, committed by the coordinator **in the same document, one turn after naming it** — the
base was corrected in the Constraints bullet and left stale in AC12. That the author of the
lesson immediately reproduced the lesson is the strongest available argument that the
countermeasure has to be structural rather than attentional.

## The parcel's dominant failure mode: a local fix, left unpropagated

Six defects surfaced on WF-P0 before a line of the map was written; five were the
coordinator's. Four of them are **one** mode, and the shaping agent named it more precisely
than the coordinator first did. It is not "a smoothing phrase substituting for a recount."
It is:

> **A fact established once is assumed to stay established at its other instances.**

The instances:

| Defect | The fact | The unpropagated copy |
|---|---|---|
| Six-versus-seven | The exclusion list held seven names | The "six excluded" sentence above it — the count was *already known* to be off and was papered over with a parenthetical |
| Gate spelled two ways | The base gate's SHA, corrected to 40 chars | Deterministic-pass step 2, left at the short form |
| "Verified on disk" | The lint's checks, run in the `main` checkout | The charter sentence asserting them, on a branch where the file was v0.1 |
| Allowed Files count | The grant, widened to three paths | The Verification Plan's Step 0 sentence, still saying "two" |

Every one is a correct local edit whose siblings were left standing, and **not one was caught
by its author.** The countermeasure is structural, not attentional: **make the invariant state
a total that fails loudly when one side drifts.** AC8 requires the map to state `8 + 7 = 15`
rather than merely be internally consistent, because a stated sum breaks visibly while two
quietly disagreeing sentences do not. Prefer that shape — a stated total, a single named
authority, a citation that must resolve — over any instruction to be careful.

## Open items carried by the coordinator (not gates)

1. **Routing-class cost.** The ratified graph prices 15 of 18 parcels `architecture/risk`,
   which means a frontier builder plus two independent reviews each. The developer declined to
   re-rule classes at ratification. You may propose a scoped demotion amendment for specific
   parcels once their shaping makes the cost concrete. Until ratified, the recorded classes
   bind.

   **WF-P0 is settled: do not demote it.** Its shaping session argued the case and the
   coordinator accepts it. The document carries roughly sixty individually falsifiable claims
   that seventeen parcels inherit, its entire value is citation accuracy, and claim-checking
   against disk is exactly what a second independent reviewer catches that a first misses —
   the provenance of the dual-review rule itself being two frontier reviews of W0-P4 that
   agreed on every focus question while only one found the blocker. A frontier builder plus
   two frontier reviews for one Markdown file is the right price here. **WF-P16 and WF-P13
   remain the demotion candidates.**
2. **The lessons ledger does not exist in this repository.** Both `STANDING-CONSTRAINTS.md`
   and `foreman-line-coordinator-carryover.md` cite `docs/transcripts/defects_lessons.md` for
   the provenance of lessons #1–#36, but that path is absent here (`docs/transcripts/` does
   not exist; a repo-wide search finds no `defects_lessons*`). The lesson *rules* are present
   in STANDING-CONSTRAINTS; only the ledger is missing. Consequence for this goal: Stage-F
   "lessons appended" has no canonical target. Until the developer rules otherwise, record
   this goal's lessons in
   `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/lessons.md` using the
   ledger's disposition-line convention, and surface the gap in the final report rather than
   silently inventing a ledger.
3. **`historical-charter-source.md` is provenance only.** It records another instance through
   D68 and WF-P0–WF-P27. Nothing in it is credited without current Git evidence (D3, and the
   claim ledger in `reconciliation.md`).

## Loop-stop conditions (ScheduleWakeup `stop:true`, then report — do not ask mid-loop)

- **WF-P0's chain goes green** → stop for the Gate 3 merge decision. This is the expected
  terminal state of the current authorization, not a failure.
- Any need to modify a frozen contract, or any Gate 1 re-open (a ratified decision or the
  graph would have to change).
- A tripwire fires twice on the same parcel (test count, wrong-shaped claim, false closure).
- A security-relevant finding that cannot close within the parcel.
- Any step requiring a provider call, spend, secret access, an external effect, a merge, or
  default-route promotion.
- Ownership becomes ambiguous, or another coordinator appears on this goal.
- A collision with a user-owned change or with the `foreman-kernel` or
  `hierarchical-coordination-sidecars` goals (D7: consume their ratified interfaces, never
  co-own or amend them).
- Worker self-selection or self-promotion, a fallback that lowers assurance, a builder acting
  as its own independent verifier, or a route carrying data outside its ratified eligibility.
- Any inferred human gate. Silence is never ratification.

Every stop updates the ownership block's **State** line so a future `/goal resume` reads the
truth, and produces a report naming exactly what the human must do.

## Wakeup pacing

Blocked only on a running background agent → schedule a 1200–1800s fallback and yield;
completion notifications are the primary wake signal and the wakeup is insurance. Actively
coordinating → keep working, no wakeup. Never schedule short wakeups to poll harness-tracked
agents.

## Crash recovery

A host restart kills scheduled wakeups **and** background agents. On any wake — scheduled,
notification, or a human nudge — if you were expecting a builder or reviewer result, check
the task list FIRST. If the agent is not running and no completion claim was delivered,
assume process death, not completion. The dead agent's uncommitted work may survive in its
worktree, but work without a completion claim is UNCLAIMED: never accept disk state as done,
because there is no claim to closure-check. Recover by dispatching a fresh agent with a
resume directive whose Step 0 gate restates the original directive, inventories what exists
on disk against it, states the live test count, flags gaps and half-written files, then STOPS
for your ruling.
