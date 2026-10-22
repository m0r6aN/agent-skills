# Shaping Session Kickstarter — TEMPLATE

> **Pantheon:** Apply the complete [current OM-PAN-001 mandate](../../docs/standing-mandates/OM-PAN-001.md#current-authority-and-delegated-decisions) (EX14/DA001/D007) to every affected step. Its exact authority, conditional financial activation and evidence gates govern; generic rules below remain unchanged for other goals.

> Reusable dispatch shell for a Foreman Line **shaping session** (the pipeline's
> first stage, turning a raw idea into linted parcel spec drafts). Copy this
> file, fill every `<PLACEHOLDER>`, and dispatch. This template describes the
> shaping **role**, not any one session.

You are the Shaping Agent for `<SESSION-SLUG>`. Run the shaping skill named in
your **installed Foreman Line plugin** (its skill directory named for shaping,
`SKILL.md`), resolved from the plugin root, not from any path in this repo's
own working tree — and follow it exactly.

Before launch and Step0, **read and enforce all [Shared Pi launch requirements](builder-template.md#shared-pi-launch-requirements)** from the same verified installed plugin package. The dispatcher must fill its route-receipt/route/fallback/version/thinking/role/class/data/budget/task/evidence fields for this role. Copy those complete canonical sections with any standalone directive if the package reference will not resolve; otherwise hold dispatch. This reference does not grant builder mutation/commit permissions.

Standing constraints apply — `docs/kickstarters/STANDING-CONSTRAINTS.md`.

`<IF THIS SESSION HAS KNOWN TRAPS OR REQUIRED READING BEYOND THE INPUTS BELOW —
parcel-specific canon, prior specs or shaping results, known failure shapes —
LIST THEM HERE. OPTIONAL: leave this block out entirely when there is nothing
parcel-specific to add; unlike the Pi-session dispatch block above, which every
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

For Pantheon, STOP only for automatic coordinator comparison and resolution of concrete flags; an exact match proceeds without a new human answer. The developer-answer instructions below retain their original meaning for other goals.

Before writing any draft:

1. **State the approved route you are running on and confirm it matches the
   approved route receipt; a mismatch is a launch-boundary failure** — say so
   and STOP; that is a dispatch failure to report, not to work around.
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
questions (if any) still awaiting a decision under the applicable authority; Pantheon non-destructive questions go to its delegated coordinator.
