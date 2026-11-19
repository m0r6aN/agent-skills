---
name: lumber-jack
description: "Recovers leftover, stale, or abandoned git worktrees: rescues uncommitted changes and unpushed code stranded in a worktree as pull requests against the dev branch, then deletes the recovered worktrees and branches so only the base repo and the main branch remain locally. Use when a repo has leftover or stale worktrees to recover, when uncommitted or unpushed code is stranded in a worktree, or when asked to return a repository to just its base checkout and main branch."
---

# Lumber Jack — Worktree Recovery and Cleanup

## Overview

Lumber jack takes a repository littered with leftover worktrees — from agent sessions, parallel branches, abandoned experiments — and finishes the job safely: it rescues every piece of outstanding work as a pull request against `dev`, then removes the worktrees and branches so only the base repo and the `main` branch exist locally. The invariant behind every step: **nothing is deleted until its work is committed, pushed, and attached to a PR**.

## When to Use

- "Clean up my worktrees", "recover the work in those worktrees", "get me back to just the base repo and main"
- A repo has stale or abandoned worktrees (typically after a multi-agent or parallel-work session) and their uncommitted or unpushed work must not be lost
- The end state is known and wanted: base repo directory plus the `main` branch locally, nothing else
- **NOT** for creating worktrees or normal per-branch development — see `git-workflow-and-versioning`
- **NOT** for merging the PRs or resolving conflicts — recovery ends when the PRs exist
- **NOT** for discarding work the user explicitly wants thrown away; that is plain `git worktree remove --force`, and it needs explicit per-worktree confirmation

## Inputs

- `<repo-name>` and `<directory>` — the base repository and where to look for it. Both default to the current working directory.

Resolution order:

1. `<directory>/<repo-name>` is a git repository → that is the base repo.
2. `<directory>` is itself inside a git repository or worktree → use its repo; take `<repo-name>` from its name. If the resolved target is a linked worktree, use the repo's main worktree (`git worktree list`, first entry) as the base repo.
3. Otherwise stop and report what `<directory>` contains — never guess which repo to operate on.

Confirm the target before touching anything: `Operating on <base repo path> (repo <name>)`.

"main" in this skill means the base repo's **default branch** (`git symbolic-ref --short refs/remotes/origin/HEAD` → `origin/<name>`, falling back to the local default branch). If it is not literally `main`, that branch plays main's role in the end state.

## Process

### 1. Inventory every worktree

From the base repo run `git worktree list --porcelain`. Record each path, HEAD, branch (or detached), and any `locked` or `prunable` marker and reason. Keep the base worktree. Skip locked, prunable, unavailable, or possibly active checkouts **and their branches**; report why. Never unlock, prune, or treat a missing directory as proof of abandonment. Compare with `git branch --list` to find branches with no registered worktree.

### 2. Classify before changing anything

- In each eligible worktree inspect `git status --porcelain=v1 --untracked-files=all --ignored`. Distinguish staged and unstaged tracked changes, untracked files, and ignored paths. Ignored does not mean disposable. If anything looks sensitive or its disposition is unclear, stop for that item **before staging, committing, pushing, or removing it**. Report paths, never contents. Leave its index and files intact pending a decision.
- Refresh origin before relying on remote reachability. For each eligible HEAD (including branch-only refs), check its own upstream with `git log @{upstream}..HEAD` in its worktree, or use `git log <sha> --not --remotes`. Do not use `--branches`; it includes unrelated local commits. Clean or pushed is not the same as reviewed.
- Inventory existing PRs for each branch, including closed ones, and classify by the commit gate in step 4. Produce the table (path/branch, SHA, outstanding work, PR or blocker, intended action) before recovery. Never stage or clean the base checkout to satisfy an end-state check.

### 3. Rescue eligible work

1. For detached work, first switch to a new, unused recovery branch at its HEAD. If a path has different staged and unstaged versions, keep the checkout for separate recovery rather than overwriting the staged snapshot. Otherwise stage only reviewed, publishable paths, e.g. `git add -- <paths>`. Review the *whole* staged path list with `git diff --cached --name-status`, including previously staged files. Commit with a descriptive message and record the resulting tip. Do not force-add ignored files.
2. Ensure the PR base exists before pushing recovered work. Fetch origin, resolve its advertised default (`git ls-remote --symref origin HEAD`), and verify its fetched SHA. If remote `dev` is absent, create it **only from that fetched remote default SHA**, never from local default or local `dev`. Use a create-only lease: `git push --force-with-lease=refs/heads/dev: origin <fetched-sha>:refs/heads/dev`. The empty expected value requires the destination not to exist. If the check or push fails, refetch and re-evaluate; never replace an existing target.
3. Push the reviewed tip to origin without force. If the source is local `dev` with unique commits, push its tip under a new recovery branch name and request a PR **from that branch to dev**, not a direct update of the shared base. Do not switch, rename, or remove protected checkouts to do this.
4. Reuse a qualifying PR or open one with `gh pr create --base dev --head <remote-branch>`. If PR lookup/creation is blocked, record the exact blocker and branch, plus a compare URL only if the host actually supports it. Keep the item locally.

### 4. Verify the commit before deleting anything

Apply the same gate to worktrees and branch-only refs. Record the full SHA to rescue. Verify both:

- A freshly fetched origin ref contains that SHA (`git branch -r --contains <sha>`).
- The provider identifies an **open or merged** PR for the intended repository, head branch/repository and base `dev`, with **head SHA equal to the rescued SHA**. For GitHub, inspect `gh pr view <number> --json url,state,baseRefName,headRefName,headRepositoryOwner,headRepository,headRefOid`. Record the PR URL and verified SHA. A PR URL, a matching branch name, a closed-unmerged PR, or a merged PR for a previous tip is not proof. A newer pushed tip needs its own qualifying handoff; otherwise keep it.

Immediately before removal, re-read the worktree registration, branch and HEAD, and repeat the full status check including ignored paths. Stop and reclassify on any change, unresolved files, lock, or failed check. Only then run `git worktree remove <path>` (never force). Before `git branch -d <branch>`, re-read its tip and verify it is still the proven SHA and no worktree uses it. Keep the branch if Git refuses. Do not run repository-wide prune as part of per-item cleanup.

### 5. Local dev and end state

Never delete the default branch. A non-default, unoccupied local `dev` may be removed if its unchanged tip is contained in freshly fetched `origin/dev`. If it has unique work, use the recovery-branch PR path and step 4 gate instead. Leave skipped or blocked items in place and report the partial end state.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's only untracked files, nothing of value" | Untracked files are work. Preserve them locally unless reviewed as safe to publish. |
| "The worktree is clean, so the branch can go too" | A clean worktree says nothing about unpushed commits. Check `git branch -r --contains <head>` before deleting any branch. |
| "gh is down — the push is enough, delete anyway" | The deletion gate is a qualifying PR for the exact tip, not merely a push. Pushed-but-un-PR'd work is untracked for review and easily lost. Report the blocker and keep the worktree. |
| "dev doesn't exist locally, so skip it" | The PR base must exist on the remote, not locally. Create it only from the verified, fetched remote default SHA. |
| "The user wants this fast — commit with a throwaway message" | The recovery commit is the record of what was rescued. Describe what `git status` showed. |
| "Remove the worktree first, commit afterwards" | Once the worktree is gone, uncommitted work is gone. Commit first, remove second. |
| "Too many worktrees to classify — start deleting" | The classification table is what makes deletion safe. Twenty minutes of inventory beats irrecoverable loss. |

## Red Flags

- `git worktree remove --force` or `git branch -D` appearing anywhere in the run
- Deletion based on a PR URL without checking its state, base, and head SHA
- Recovery commits with messages like `wip`, `tmp`, or `asdf`
- Operating on the base worktree or deleting the default branch
- PR URLs that `gh` did not print
- A worktree with non-empty `git status --porcelain` at removal time
- Guessing worktree paths instead of using `git worktree list --porcelain`
- Final state claimed without pasted `git worktree list`, `git branch --list`, and `git status` output

## Verification

After the run, confirm and paste evidence for each:

- [ ] `git worktree list` shows exactly one worktree: the base repo
- [ ] `git branch --list` shows only the default branch (plus `dev` only if the user chose to keep it)
- [ ] `git status` in the base repo is clean
- [ ] Every rescued branch has a PR URL printed by `gh` — or, if PR creation was blocked, that worktree and branch were kept and the report names the exact blocker (and a compare URL only when supported)
- [ ] Each recovered deletion records its SHA, containing origin ref and matching PR head SHA; for redundant local `dev`, record containment in `origin/dev` instead
- [ ] Final report delivered, one line per worktree or branch-only ref: classification (uncommitted / unpushed / both / clean), actions (commit SHA, push, PR URL or blocker), disposition (deleted / kept + reason)

If any checkbox cannot be evidenced, the skill is not done — report the gap instead of declaring completion.
