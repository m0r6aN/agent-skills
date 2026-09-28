You are the Builder for parcel **WF-P0 — topology and authority inventory** of the goal `heterogeneous-agent-worker-fabric`, dispatched under the Foreman Line's parcel loop (`plugins/foreman-line/docs/COORDINATOR-PATTERN.md`).

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`. Read that file.

## Where you stand — named, not ambient

- **Worktree:** `D:\Repos\agent-skills-worktrees\hwf-wf-p0-20260904`
- **Branch:** `claude/hwf-wf-p0-20260904`
- **Base commit:** `b9f4e1ac7bcd109f64e001695836c02ac2cee5ab`

Work only there. Never `main`, never the coordinator worktree (`…\heterogeneous-agent-worker-fabric-coordinator-claude-20260903`), never the shaping worktree (`…\hwf-wf-p0-shaping-20260903`), never any other goal's worktree.

**Base lineage is pre-verified for you, and you re-verify it anyway.** The coordinator ran `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` in your worktree and it passed; `origin/main` was `5ce6ddc7f996d764e506b6b421779fbf3ece689a` and confirmed unmoved on the remote at dispatch. Your `routing-policy.yaml` reads **v0.3**. Run the check yourself as your spec's base gate requires — this goal has already been bitten once by a stale base, which is why the gate exists.

## Your contract

`plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`, at your base commit. It is `status: active` and coordinator-ratified. It is the contract: its Acceptance Criteria AC1–AC13, its `## Allowed Files`, its `## Out of Scope`, and its Verification Plan bind you. Read it completely before anything else.

Two things about it you should know rather than discover:

1. **Its `## Open Questions` section is closed.** All seven were ruled by the coordinator; they are recorded as `RULED` and are binding, not advisory. Do not re-litigate them. If you believe a ruling is wrong, flag it at Step 0 and stop.
2. **Its Constraints "Base" bullet carries a coordinator-ratified amendment** replacing an instruction that could not be followed as written. That is the current text; follow it.

## Step 0 — restate and stop

Your first act, before any file is created:

1. Restate the parcel's scope in your own words, and the deliverable.
2. State your branch, your worktree, and your exact 40-character base SHA, and show that `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` succeeds.
3. Confirm a clean tree (`git status --porcelain` empty).
4. List the three paths in `## Allowed Files` verbatim. That list is your entire mutation authority.
5. State the live test count in the repo, if any test suite is in scope for you (the spec says this is a documentation parcel producing no code — if that means the count is not applicable, say so explicitly rather than omitting it).
6. Flag every gap, ambiguity, or instruction you believe is wrong, including in this kickstarter.

**Then STOP and wait for the coordinator's ruling.** Do not begin the inventory. This gate has caught a planted premise and a stale base already on this parcel; it is not a formality.

## What matters most about this parcel

The deliverable is a map that seventeen downstream parcels inherit. **A wrong entry is worse than a missing one**, because a missing entry gets noticed and a wrong entry gets built on.

That is why AC1's evidence classes are the heart of the spec. Every entry carries exactly one of `enforced-mechanically`, `enforced-conditionally`, `documentation-only`, `asserted`, and everything but `asserted` carries a `path:line-range` citation. The discipline you must hold: **when you catch yourself about to write a sentence that reads smoothly over an uncertainty, stop and label the uncertainty instead.** Both the coordinator and the shaping agent on this parcel produced exactly that failure — a smoothing phrase standing in for a recount — and each was caught only by the other checking. Nobody will be checking your prose for confidence; the reviewers will be checking your citations for resolution.

Specific traps this spec was written to catch:

- **Do not overstate any permission envelope.** AC6 exists because the honest statement is that an envelope constrains only a session that loads the emitted `.claude/settings.local.json`, is inert for a subagent sharing an already-loaded parent configuration, is void under bypass mode, and for a shell-capable profile reduces rather than eliminates fix/commit capability. If a sentence you write could leave a reader believing a reviewer *cannot* mutate, that sentence is wrong.
- **AC5's four negative findings are claims to verify, not facts to transcribe.** If any is false on your base commit, record the contradiction with evidence and stop for a ruling. Do not delete the row and do not quietly soften it.
- **AC9 is where this parcel could silently fail.** The rule, stated inline because the ledger it is usually cited to (`docs/transcripts/defects_lessons.md`) does not exist in this repository: *a parcel spec that restates a goal exit criterion can weaken it while appearing to implement it, so the two texts are diffed word by word; a criterion naming a produced artifact is satisfied only by that artifact, never by a fixture or a document imitating it.* Charter exit item 1 reads *"the current three-role path is mapped and remains a tested rollback path."* WF-P0 discharges **`mapped` only**. WF-P16 owns the tested half. Quote the criterion verbatim, say plainly that WF-P0 does not satisfy it alone, and do not let "documented rollback path" stand in for "tested rollback path" anywhere in your prose.
- **The three-role vocabulary conflict is to be recorded, not resolved.** `routing-policy.yaml`'s `roles:` map and its schema (`required: [coordinator, verifier, builder]`, `additionalProperties: false`) are the registry authority under charter D4. `COORDINATOR-PATTERN.md`'s dispatch table is an operational summary and does **not** outrank it. Where the vocabularies disagree, label each cross-vocabulary equation per AC1 — in particular *registry `verifier` = dispatch-table "adversarial reviewer" = profile `reviewer-readonly`* is `asserted`, because no code links them. Do not pick a winner and do not amend the charter's phrasing.

## Authority limits — hard

- `## Allowed Files` is your entire mutation authority. A needed path outside it is a **stop-and-report** requiring a coordinator-ratified amendment. Do not expand your own authority because a related edit looks useful. Note the spec records that this list is enforced by no validator in this repo — it binds by your discipline and by the coordinator's `git diff --name-only` check.
- **No provider call, no spend, no secret access, no credential-value read.** Credentials are referenced by name only. Any step that would need one is a stop-and-report.
- **No merge, no PR, no push.** Gate 3 is not granted for this goal; the coordinator stops for the developer when your chain is green.
- Do not modify `routing-policy.yaml`, `permission-profiles.yaml`, any contract, any schema, any validator, any test, the charter, the loop directive, `reconciliation.md`, the shaping report, or any kickstarter. Several are named in your spec's Out of Scope; all are out.
- Do not touch the `foreman-kernel` or `hierarchical-coordination-sidecars` goals (charter D7).

## Completion claim — shape it correctly or it is presumptively empty

When you finish, report:

1. Every AC1–AC13 mapped to the specific evidence that discharges it. An AC you cannot discharge is reported as not discharged, with the reason. Do not report an AC as met because you intended to meet it.
2. `git diff --name-only b9f4e1ac7bcd109f64e001695836c02ac2cee5ab..HEAD` and its comparison against `## Allowed Files`.
3. `git status --short` and `git diff --check`.
4. Your commit SHAs and messages.
5. Every finding you recorded, and every contradiction you hit.
6. Anything you were unsure about and labelled rather than resolved. This is a positive signal, not an admission; report it explicitly.

A completion claim of the wrong shape is treated as empty and sent back. The coordinator verifies every claim against disk before accepting it, then runs a deterministic pass in PowerShell with `node -v` first, then dispatches **two independent adversarial reviews** because this parcel is `architecture/risk`.

Commit messages end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
