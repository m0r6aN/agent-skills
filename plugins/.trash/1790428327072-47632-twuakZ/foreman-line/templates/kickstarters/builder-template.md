# Builder Kickstarter — TEMPLATE

> Reusable dispatch shell for a Foreman Line **builder session**. Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> builder **role**, not any one parcel.

**Goal:** `<GOAL-SLUG>` · **Parcel:** `<PARCEL-ID>`
**Dispatched:** `<DATE>` · **risk:** `<risk-level>` · **routing_class:** `<routing-class>`

**Runtime profile: `<RUNTIME-PROFILE>` · Resolved model: `<MODEL-ID>`, `<TIER>` tier.** Not asserted — **minted**:
the installed Foreman Line plugin's `evaluateRouting` wrote
`<PATH-TO-MINTED-RECEIPT>/routing-decision.json`
(`runtimeProfile: <RUNTIME-PROFILE>`, `resolvedTier: <TIER>`, `resolvedModelId: <MODEL-ID>`), committed with this
kickstarter. `<NAME THE MODEL(S) YOUR CHARTER'S MODEL-GRADE POLICY MARKS BELOW
GRADE FOR THIS TIER>` are still selectable and are **below grade**. A Step 0
restatement that does not name the required model, with its version, is a
dispatch failure — say so and STOP.

Standing constraints apply — `docs/kickstarters/STANDING-CONSTRAINTS.md`.
`<NAME ANY RULES THIS PARCEL BOTH OBEYS AND SPECIFICALLY EXERCISES, IF ANY.>`

## Your working root

Everything you touch is inside the worktree at **`<PATH-TO-WORKTREE>`**, branch
`<BRANCH-NAME>`. **Do not read or write anything under `<PATH-TO-MAIN-CHECKOUT>`**
— that is the coordinator's checkout.

- `<ENVIRONMENT NOTES — OS, shell, toolchain and minimum version, and any known
  shell-resolution traps in THIS repo (e.g. a version manager shadowing the
  system toolchain in one shell but not another). The dispatching coordinator
  fills this from their own environment; do not carry another repo's
  environment forward as a default, and do not leave it blank.>`
- If the packages you touch are not a single workspace, install dependencies
  **per package** before running that package's tests — a relative
  cross-package import can resolve a bare dependency from a sibling package's
  own installed dependencies, silently masking a missing dependency of your
  own.

## Your contract

**`<PATH-TO-SPEC>`**, `status: active`. It has passed coordinator lint. Its
Constraints and Acceptance Criteria are the contract and are **not yours to
renegotiate** — if you believe one is wrong, stop and flag it rather than
reinterpreting. Read it in full before touching anything.
`<NAME ANY PRIOR SPEC(S) WHOSE RULINGS THIS PARCEL APPLIES VERBATIM, AND WHICH
OF THEIR RULINGS APPLY.>`

A genuine spec *gap* is a flag to raise at Step 0 or the moment you hit it; the
coordinator rules and, if needed, ratifies an amendment before further work.
Silently designing around a gap is the failure this gate exists to prevent.

## Step 0 — restate and STOP (mandatory gate)

Before writing any code or artifact:

1. **State the runtime profile and exact model you are running on.** If either
   does not match the minted receipt above, say so and STOP.
2. Restate the deliverables in your own words, and state what is explicitly
   **out of scope** per the spec.
3. **Inventory the current state on disk against the spec** — what exists,
   what does not, and any counts (test counts, rule counts, line counts) the
   spec asks you to carry forward. State those counts explicitly; they are
   your tripwire baseline.
4. Name your implementation order and any item you believe is ambiguous or
   unachievable as written.
5. List clarifying questions in small numbered batches, each with a
   recommended default.
6. **STOP and wait** for the coordinator's rulings. Do not begin implementation
   in the same turn.

## Hard boundaries — crossing one is a loop-stop, not a judgment call

`<ENUMERATE THIS PARCEL'S FROZEN PATHS, OUT-OF-SCOPE PACKAGES, AND ANY DECISION
THAT MUST NEVER BE RE-DECIDED BY THE BUILDER (e.g. a locked schema, a package
owned by a sibling parcel, a policy invariant the parcel must not weaken). If
crossing a boundary seems required to satisfy an AC, STOP and report — do not
work around it.>`

## The traps this parcel is built out of

`<NAME EVERY KNOWN FAILURE SHAPE THIS PARCEL'S SPEC OR PRIOR PARCELS SURFACED
— e.g. a structural guarantee that must hold at every depth, a check whose
coverage is a literal set rather than a class, a verification command that
must be re-run rather than trusted from a prior session. Each trap names the
concrete command or inspection that catches it, not just the risk.>`

## Evidence discipline

- **Report only command results you actually ran.** Paste the literal
  invocation and its literal output. Where you have reasoning rather than a
  measured result, write **"reasoning, not verified"** and name what would
  verify it — that is a finished answer, not a weakness (Standing Constraint
  #22).
- **Read counts with `grep -c`, invoking the binary by its explicit absolute
  path, never a bare `grep` and never `grep -o | wc -l`** (Standing Constraint
  #24). A bare `grep` can silently resolve to a different binary depending on
  shell configuration, and the piped form has separately returned spurious
  counts — treat every count as suspect until you have verified which tool
  you actually ran. If you cite a count, cite the exact command that produced
  it, and where a count is load-bearing evidence, pair it with a mutation
  that proves the check binds (e.g. break the thing being counted and watch
  the count move).
- **Passing is not evidence.** Every accept behavior needs its reject twin
  demonstrated failing. Do not ship a guard you have not watched bite.
- Run every validation command the spec names before claiming done, and report
  its exit code — never read an exit code through a truncating pipeline.

## Definition of done

- Every Acceptance Criterion satisfied with pasted evidence.
- `<NAME ANY ENUMERATION THIS PARCEL MUST RECONCILE IN BOTH DIRECTIONS AGAINST
  A LIVE FILE OR DISK STATE.>`
- `<NAME ANY LIVE FILE(S) THAT MUST REMAIN BYTE-UNCHANGED, PROVEN WITH `git
  diff`.>`
- `git status` clean apart from your intended files.

## STOP boundary

Commit to `<BRANCH-NAME>`. **Do not open a PR. Do not merge.** Gate 3 is human
and never delegated. Report back with your evidence; the coordinator then
dispatches adversarial review.

## Completion report

End with: the AC-by-AC evidence map, every command you ran with its exit code,
anything you could not complete and why, any flag you raised, and the
judgement calls a reviewer should look at hardest. An adversarial review
follows — it will re-run your checks and probe with hostile input, so do not
overstate.
