---
ticket: BRINV-1
title: Branch inventory and merge/abandon recommendations
status: draft
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
superseded_by: null
risk: low
surfaces:
  - plugins/foreman-line/docs/specs/
  - plugins/foreman-line/docs/branch-inventory/
routing_class: standard-feature
permission_profile: builder-standard
data_classification: internal
---

# BRINV-1 — Branch inventory and merge/abandon recommendations

## Intent

Produce an evidence-backed inventory of every live branch and worktree in `D:/Repos/agent-skills` after the owner's remote-branch cleanup, diff each head against `main`, and recommend each head as `MERGE-CANDIDATE`, `ABANDON`, or `NEEDS-OWNER-CALL` with reasons. This parcel is recommendations only; merges stay human at Gate 3.

## Constraints

- Strictly read-only against product state. Permitted Git operations: `git branch`, `git worktree list`, `git ls-remote --heads origin`, `git status`, `git log`, `git show <ref>:<path>`, `git diff`, `git merge-base`, `git rev-list`, `git for-each-ref`, `git rev-parse`. All content inspection via `git show <ref>:<path>` and read-only worktree reads.
- No checkouts of other branches into the working tree (`git checkout`, `git switch`, `git restore` changing state are forbidden). No `fetch`, `pull`, `merge`, `rebase`, `push`, `delete`, `tag`, `stash`, `reset`, `clean`, or worktree add/move/remove.
- No provider, model, MCP, network-probe, package-install, or CI-trigger calls. CI state is recorded only if queryable from already-present local evidence; otherwise record `UNKNOWN` with the reason. Never probe the network to fill the gap.
- No secrets, tokens, credentials, customer data, or PII in outputs. Branch content that would require secret access is recorded as `NEEDS-OWNER-CALL`, never opened.
- Builder Step 0 must restate this spec, exact Allowed Files, branch/worktree/base, read-only command set, and known blockers, then stop for coordinator ruling before writing inventory outputs. Any mismatch is a stop.

## Acceptance Criteria

- [ ] `brinv-1-live-head-inventory.md` enumerates every live head from the union of `git branch -a`, `git worktree list`, and `git ls-remote --heads origin`, refreshed at builder Step 0 without fetching. Stale remote-tracking refs (local `remotes/origin/*` not present in live `ls-remote`) are explicitly labeled stale, never treated as live remote truth.
- [ ] Per head, the inventory records: fully-qualified ref, local/remote-tracking/live-remote/worktree presence, worktree path if attached (including detached-HEAD worktrees), merge-base with `main` (`git merge-base main <ref>`), diffstat vs merge-base (`git diff --stat <merge-base>..<ref>` plus added/deleted line totals), ahead/behind counts vs `main`, last-commit age/author/date/subject (`git log -1 --format`), unmerged status (`git branch --no-merged main` membership), and CI state (`PASS`/`FAIL`/`UNKNOWN` with local-evidence provenance only).
- [ ] Per head, exactly one verdict with evidence-backed reasons: `MERGE-CANDIDATE` (unique, review-worthy delta worth human Gate-3 review), `ABANDON` (superseded, empty vs merge-base, duplicated, or scratch with nothing unique), or `NEEDS-OWNER-CALL` (requires a product/ownership decision the builder must not invent, e.g. secret-gated content, unclear ownership, possible duplicate intent across heads).
- [ ] Collision and dependency notes map heads whose diffstats overlap the same files/surfaces, heads that duplicate each other's deltas, and heads stacked on another head rather than on `main`. Each note names the affected refs and the shared surface.
- [ ] `brinv-1-closure-evidence.md` gives a single closure recommendation: ordered human Gate-3 review queue (if any `MERGE-CANDIDATE`s), abandon-candidate set (human deletes only, never the builder), owner-call set with exact questions, and a `READY`/`HOLD` statement. No output authorizes or performs a merge, deletion, or conflict resolution.
- [ ] The parcel changes only the exact Allowed Files. `git diff --check` is clean, every factual claim cites its command or path, and the spec-linter validates green.

## Out of Scope

- Any mutation: merges, rebases, pushes, branch/worktree deletions, conflict resolution, cherry-picks, tag writes, or working-tree checkouts of other branches.
- Any `fetch`/`pull` or remote-refresher that would mutate refs mid-inventory.
- Any implementation, refactoring, test, fixture, schema, config, or CI change outside the two builder evidence files.
- Any provider/MCP/network call, secret inspection, or paid action.
- Any Gate-2 promotion, Gate-3 merge authorization, or Jira/ticketing side effect. Shaping produces the draft only.

## Context & References

- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — spec schema, naming, lifecycle, `Allowed Files` mutation authority.
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` — human Gates 2/3 ownership; merges stay human.
- `plugins/foreman-line/docs/specs/active/GMF-P0-governed-model-fleet-discovery-and-negative-contracts.md` — read-only shaping precedent (passive baseline, evidence vocabulary, stop rules).
- Live-state recon commands (read-only, no fetch): `git branch -a`, `git worktree list`, `git ls-remote --heads origin`, `git status --short --branch`, `git branch --no-merged main`.

## Shaping-Time Passive Baseline

Observed locally on 2026-09-16 in `D:/Repos/agent-skills` without fetching; every value must be refreshed at builder Step 0 and drift must stop execution until the coordinator reconciles it.

| Observation | Value |
|---|---|
| Base HEAD (`main` and `origin/main`) | `4d6407e8f5ff8829c13a55fdcbc3a020f30bce13` — `Merge pull request #30 from m0r6aN/docs/ops-console-gate1-grants`. No move since `4d6407e`. |
| `main` status | `## main...origin/main`, clean, no short entries |
| Local branches (`git branch` count) | 53 pre-shaping (54 after shaping branch `codex/branch-inventory-shaping-20260916` is added) |
| Unmerged into `main` (`git branch --no-merged main`) | 32 |
| Live remote heads (`git ls-remote --heads origin`) | 10 including `main` (9 non-main: `codex/fk-p0-canon-authority-enforcement-registry`, `codex/fk-p0-r30-adoption-20260907`, `codex/fk-p0-r31-source-adoption-20260907`, `codex/fk-p0-recovery-20260907`, `codex/fk-p0-rework6-unclaimed-20260903`, `codex/foreman-kernel-resume-20260908`, `codex/foreman-kernel-unattended-20260907`, `codex/foreman-routing-cerebras-shadow-20260830`, `handoff/foreman-kernel-live-20260907`) |
| Worktrees (`git worktree list` count) | 68 including the `main` checkout (many detached-HEAD and stale-branch worktrees remain locally) |
| Ticket key | `BRINV-1` free at shaping (no `BRINV` branches, no `*BRINV*` specs in `active/`) |
| Shaping isolation | Worktree `D:/Repos/agent-skills-worktrees/branch-inventory-shaping-20260916`, branch `codex/branch-inventory-shaping-20260916`, from `origin/main` at `4d6407e` |

Local `remotes/origin/*` tracking refs are stale relative to live `ls-remote` (owner deleted un-merged remote branches without a local fetch). The builder must treat `ls-remote` as live remote truth and label the difference explicitly.

## Verification Plan

Builder Step 0 restates scope and stops on drift. Required deterministic checks after the builder claim:

1. Re-run `git branch -a`, `git worktree list`, `git ls-remote --heads origin`, `git status --short --branch`, `git branch --no-merged main` with no fetch; diff the head list against the inventory's enumerated set. Any missing or extra head fails the claim.
2. Spot-check per-head rows: recompute `git merge-base main <ref>` and `git diff --stat <merge-base>..<ref>` for at least three heads (one per verdict class) and confirm the recorded diffstats match.
3. Verify `git diff --name-only` is a subset of Allowed Files and that no branch, worktree, ref, or external state was mutated.
4. Run the frozen frontmatter validator on this draft and `git diff --check`. Advisory green is recorded but never flips `status` or grants dispatch.
5. Coordinator re-runs the enumeration commands independently and diffs the head list before accepting the closure recommendation.

Mandatory reviewer focus questions:

- Does any row invent a head, omit a live head, or present a stale tracking ref as live remote truth?
- Is any `MERGE-CANDIDATE` actually empty vs merge-base, duplicated by another head, or already in `main`?
- Does any wording authorize, schedule, or perform a merge, deletion, rebase, or conflict resolution?
- Did any CI verdict rely on a network call, or is every `UNKNOWN` honestly recorded instead of probed?

## Allowed Files

Only these exact repo-relative paths may be created or changed for BRINV-1:

- `plugins/foreman-line/docs/specs/active/BRINV-1-branch-inventory.md`
- `plugins/foreman-line/docs/specs/active/brinv-1-branch-inventory.shaping-result.json`
- `plugins/foreman-line/docs/branch-inventory/brinv-1-live-head-inventory.md`
- `plugins/foreman-line/docs/branch-inventory/brinv-1-closure-evidence.md`

The first two files are shaping-owned artifacts and remain read-only inputs after Gate 2; they are listed because this shaping session creates them, not as builder authority to rewrite the contract. The builder creates only the two `branch-inventory/` evidence files. No glob, directory shorthand, related file, cache, log, receipt, or temporary artifact is mutation authority. Any required path outside this list requires a coordinator-ratified spec amendment.

## Collision Risk and Sequencing

Collision risk is **low** for product code (read-only parcel touches no product surface) and **medium** for evidence paths (two new `branch-inventory/` files must not collide with another writer). No Allowed File existed before shaping except this newly created draft/result. BRINV-1 must use its isolated worktree after Gate 2 and must not stage, commit, reset, clean, stash, move, or delete user-owned changes elsewhere.

## Evidence and Handoff

The final handoff is contained in `brinv-1-closure-evidence.md` and must state: starting and ending commit; base HEAD; exact files changed; commands run; headcounts found (local / unmerged / live-remote / worktrees); checks passed, failed, skipped, or prohibited; unresolved decisions; blockers; and the next safe action. No receipt is minted. The only permissible next action after review is for the coordinator to present an exact human Gate-2 decision request; it is not permission to merge, delete, or resolve conflicts.

## Stop-and-Report Rules

Stop without inventing or widening scope if:

- a head's content requires secret, credential, or restricted-data access to evaluate;
- any flow prompts for push, delete, merge, rebase, or conflict-resolution authority;
- any instruction demands merging, deleting, rebasing, fetching, or checking out another branch;
- a required output path is occupied by another writer or a mutation would escape Allowed Files;
- any wording could be read as granting Gate 2 dispatch, Gate 3 merge, deletion, or deployment authority.

On stop, preserve the partial inventory, set the closure recommendation to `HOLD`, name the exact decision/evidence/authority required, and return control to the coordinator.
