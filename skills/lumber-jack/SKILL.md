---
name: lumber-jack
description: Recovers leftover, stale, or abandoned git worktrees: rescues uncommitted changes and unpushed code stranded in a worktree as pull requests against the dev branch, then deletes the recovered worktrees and branches so only the base repo and the main branch remain locally. Use when a repo has leftover or stale worktrees to recover, when uncommitted or unpushed code is stranded in a worktree, or when asked to return a repository to just its base checkout and main branch.
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

From the base repo run `git worktree list --porcelain`. Worktrees can live anywhere — a sibling `<repo>-worktrees/` directory, `.claude/worktrees/`, `/tmp` — so the porcelain list, not a directory listing, is the authoritative inventory. Record for each entry: path, HEAD, branch (or `detached`). The base worktree is never removed. Also list local branches with no worktree: `git branch --list`.

### 2. Classify each non-base worktree

Inside each worktree:

- **Uncommitted work** — `git status --porcelain` is non-empty. Untracked files count; they are work.
- **Unpushed work** — commits on the worktree's HEAD not reachable from any remote-tracking ref: `git log --branches --not --remotes`, or `git log origin/<branch>..HEAD` when an upstream is set.
- **Detached HEAD** — the commits have no branch; recovery uses `recovery/<worktree-dir-name>-<YYYYMMDD>`.
- **Clean and fully pushed** — cleanup only; nothing to rescue.

Produce the classification table before changing anything.

### 3. Rescue outstanding work (per worktree with anything outstanding)

1. **Commit uncommitted changes** in the worktree: `git add -A`, then commit with a message describing what `git status` showed, e.g. `wip: recover uncommitted export notes from worktree reporting`. The recovery commit is the durable record of the rescued work — make it informative.
2. **Push the branch** (create `recovery/<name>` first if the worktree was detached): `git push -u origin <branch>`.
3. **Ensure `dev` exists on the remote** — PRs target it. `git fetch origin`; if `origin/dev` is missing, create it from the default branch: `git push origin <default>:dev`. If a local `dev` exists with commits missing from `origin/dev`, push it instead of overwriting.
4. **Open the PR**: `gh pr create --base dev --head <branch> --title "<summary>" --body "Recovered from worktree <path>: <what was outstanding>"`. Record the PR URL.
   If `gh` is missing, unauthenticated, or the remote has no hosting provider: report the exact blocker and the compare URL (`<remote>/compare/dev...<branch>`) for that branch. Never invent PR URLs. Do not delete this worktree — it stays until its PR exists.

### 4. Delete worktree and branch — only after that worktree's PR exists

Deletion gate per worktree and branch: work committed → pushed → **PR created**. Only then:

```bash
git worktree remove <path>   # refuses if dirty — never --force over uncommitted work
git branch -d <branch>       # refuses if unmerged — never -D to bypass the gate
git worktree prune
```

Before `git branch -d`, prove the commits are on the remote: `git branch -r --contains <head-sha>` must list a remote ref. If it does not, the branch is not deletable — push and PR it first.

### 5. Leftover local branches without worktrees

The same rules apply to branches from `git branch --list` that are neither the default branch nor `dev`: unpushed commits → push + PR to `dev`, delete after the PR exists; already pushed or merged → `git branch -d`. Unpushed work on a branch is never deleted.

### 6. Local `dev` and end state

If a local `dev` remains and every commit on it is on `origin/dev`, delete the local branch (remote `dev` survives as the PR target). Then run Verification.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's only untracked files, nothing of value" | Untracked files are work. Commit them in the recovery commit before anything is removed. |
| "The worktree is clean, so the branch can go too" | A clean worktree says nothing about unpushed commits. Check `git branch -r --contains <head>` before deleting any branch. |
| "gh is down — the push is enough, delete anyway" | The deletion gate is PR-created, not pushed. Pushed-but-un-PR'd work is untracked for review and easily lost. Report the blocker and keep the worktree. |
| "dev doesn't exist locally, so skip it" | The PR base must exist on the remote, not locally. Create and push `origin/dev` from the default branch. |
| "The user wants this fast — commit with a throwaway message" | The recovery commit is the record of what was rescued. Describe what `git status` showed. |
| "Remove the worktree first, commit afterwards" | Once the worktree is gone, uncommitted work is gone. Commit first, remove second. |
| "Too many worktrees to classify — start deleting" | The classification table is what makes deletion safe. Twenty minutes of inventory beats irrecoverable loss. |

## Red Flags

- `git worktree remove --force` or `git branch -D` appearing anywhere in the run
- Deletion commands running before the worktree's PR URL exists
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
- [ ] Every rescued branch has a PR URL printed by `gh` — or, if PR creation was blocked, that worktree and branch were kept and the report names the exact blocker plus the compare URL
- [ ] Every deleted branch's HEAD is reachable from a remote ref (`git branch -r --contains <sha>` output)
- [ ] Final report delivered, one line per worktree: classification (uncommitted / unpushed / both / clean), actions (commit SHA, push, PR URL or blocker), disposition (deleted / kept + reason)

If any checkbox cannot be evidenced, the skill is not done — report the gap instead of declaring completion.
