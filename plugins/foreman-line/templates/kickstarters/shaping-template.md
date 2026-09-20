# Shaping Session Kickstarter — TEMPLATE

> Reusable dispatch shell for a Foreman Line **shaping session** (the pipeline's
> first stage, turning a raw idea into linted parcel spec drafts). Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> shaping **role**, not any one session.

You are the Shaping Agent for `<SESSION-SLUG>`. Run the shaping skill named in
your **installed Foreman Line plugin** (its skill directory named for shaping,
`SKILL.md`), resolved from the plugin root, not from any path in this repo's
own working tree — and follow it exactly.

**Runtime profile: `<RUNTIME-PROFILE>` · Resolved model: `<MODEL-ID>`, `<TIER>` tier.** Not asserted — **minted**:
the installed Foreman Line plugin's `evaluateRouting` wrote
`<PATH-TO-MINTED-RECEIPT>/routing-decision.json`
(`runtimeProfile: <RUNTIME-PROFILE>`, `resolvedTier: <TIER>`, `resolvedModelId: <MODEL-ID>`), committed with this
kickstarter. `<NAME THE MODEL(S) YOUR CHARTER'S MODEL-GRADE POLICY MARKS BELOW
GRADE FOR THIS TIER>` are still selectable and are **below grade**. A Step 0
restatement that does not name the required model, with its version, is a
dispatch failure — say so and STOP rather than proceeding.

Standing constraints apply — `docs/kickstarters/STANDING-CONSTRAINTS.md`.

`<IF THIS SESSION HAS KNOWN TRAPS OR REQUIRED READING BEYOND THE INPUTS BELOW —
parcel-specific canon, prior specs or shaping results, known failure shapes —
LIST THEM HERE. OPTIONAL: leave this block out entirely when there is nothing
parcel-specific to add; unlike the model-grade gate above, which every
dispatch carries, a session's traps are inherently session-specific.>`

## Inputs

- **Idea:** `<RAW IDEA — the concept to shape>`
- **Context references:** `<optional: related specs / plans / conventions / contracts / lessons>`

## Where you work

- Worktree: `<PATH-TO-WORKTREE>` on branch `<BRANCH-NAME>`.
  Do ALL work there; never touch the main working tree, never check out another
  branch, never push.
- `<ENVIRONMENT NOTES — OS, shell, toolchain and minimum version, and any known
  shell-resolution traps in THIS repo. The dispatching coordinator fills this
  from their own environment; do not carry another repo's environment forward
  as a default.>`

## Step 0 — restate and STOP (mandatory gate)

Before writing any draft:

1. **State the runtime profile and exact model you are running on.** If either does not match
   the minted receipt above, say so and STOP — that is a dispatch failure to
   report, not to work around.
2. Restate the idea in your own words; enumerate the parcels you propose (in
   dependency order, each with a risk level and routing class) and the draft
   files you will create; confirm what is out of scope.
3. List every clarifying question in small numbered batches, each with a
   recommended default.
4. **STOP and wait** for the developer's / coordinator's answers. Do not author
   drafts on your own resolution of an open question.

## Outputs (after answers)

- One or more parcel spec drafts under `docs/specs/active/` at `status: draft`,
  each passing the shaping skill's advisory self-check.
- One shaping-result artifact per your installed plugin's shaping skill
  contract, recording the parcel spec references it produced.

## STOP boundary

No `status` flip (draft → active), no downstream registration, no receipt
emission beyond the one already minted for this dispatch. Coordinator lint is
the sole promotion authority. A need to change a frozen contract is a
loop-stop — STOP and report.

## Completion

End by reporting the draft paths and the shaping-result path, and the open
questions (if any) still awaiting a human decision.
