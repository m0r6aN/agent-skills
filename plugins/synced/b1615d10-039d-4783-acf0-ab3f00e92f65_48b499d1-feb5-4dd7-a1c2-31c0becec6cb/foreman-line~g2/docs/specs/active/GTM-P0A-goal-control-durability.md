---
ticket: GTM-P0A
title: Pin the full-platform GTM goal control plane in an isolated worktree
status: active
owner: clinton.morgan
created: 2026-08-18
updated: 2026-08-18
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Reproduce the ratified Keon Full-Platform GTM Readiness control artifacts in
the named clean, isolated `agent-skills` worktree and pin them as local Git
evidence. Add the goal's loop directive so future coordinators have one durable
queue, authority boundary, and recovery point. This parcel changes no product,
application, patent, creative, Linear, or external state.

## Constraints

1. Repository: `D:/Repos/agent-skills`.
2. Worktree:
   `D:/Repos/agent-skills-worktrees/keon-full-platform-gtm-readiness-20260818`.
3. Branch: `goal/keon-full-platform-gtm-readiness-20260818`.
4. Frozen local base:
   `e56c2cbac1a225c0c364add327b944ca696d485e` (`origin/main` as locally
   resolved when the worktree was created). No fetch, pull, rebase, or remote
   call is authorized. If the worktree HEAD or branch differs at Step 0, stop.
   Cleanliness is asserted against the **permitted pre-existing untracked
   control artifacts** named in constraint 13; any other tracked modification
   or untracked path present at Step 0 is a stop.
5. The ambient `D:/Repos/agent-skills` checkout is read-only source for this
   parcel. Do not edit, clean, stash, commit, move, or otherwise alter it.
6. Copy the four ratified source artifacts only when their SHA-256 values are
   exact:
   - `charter.md`:
     `BB9938DBD23F9F719D407C0A577FB365BF3282F09B2618F210F1CE83D9F024C1`
   - `discovery.md`:
     `7FDD0DE2EA32E47B5A00289F66EE7644D37B77433E693D7979C333B3FC5A2338`
   - `goal-charter-amendment-r1.md`:
     `468065C7BB441677C76C361A10EDA6479A49FC1E339BFB0957D1FB0F079E51EE`
   - `plan-review-findings.md`:
     `80C908FC5905C6F63DBD7EDC94EC5F92C5B33AA2DDD8E0AA75ECD59D725011E5`
7. Source directory:
   `D:/Repos/agent-skills/plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/`.
   Destination directory is the same repo-relative path inside the named
   isolated worktree.
8. Preserve the four source artifacts byte-for-byte. Do not paraphrase,
   normalize line endings, or repair prose in this parcel.
9. Author `loop-directive.md` as the only new substantive artifact. It must
   record the exact goal owner, ratification and follow-up PASS, current branch,
   worktree, base, source hashes, Gate 2 queue `GTM-P0A -> GTM-P0B -> GTM-P0C`,
   P0B/P0C dependency holds, child-authority firewalls, Gate 3 hold, external-
   action hold, stop conditions, and crash-recovery procedure.
10. Create two local evidence commits in order:
    - amendment-only commit:
      `docs(gtm): GTM-R1 charter amendment (coordinator-ratified)`;
    - remaining control-plane commit:
      `docs(gtm): pin full-platform GTM control plane`.
11. The local commits are Gate 2 return evidence only. No cherry-pick,
    integration into another branch, push, PR, merge, release, deployment,
    publication, Linear mutation, or other external action is authorized.
12. The builder may use deterministic read-only checks and `git add` only with
    explicit Allowed File paths. `git add -A` and broad staging are forbidden.
13. Two control artifacts already exist untracked in the worktree and are
    permitted to remain untracked and uncommitted for the entire parcel:
    - `plugins/foreman-line/docs/specs/active/GTM-P0A-goal-control-durability.md`
    - `plugins/foreman-line/docs/specs/active/gtm-p0a-goal-control-durability.shaping-result.json`

    They are this parcel's own Stage A spec and handoff record. The builder must
    not edit, move, rename, delete, stage, or commit either one. They are
    excluded from the Allowed Files diff-scope assertion and from the final
    clean-worktree assertion; their continued presence, unmodified and
    untracked, is itself an acceptance check.

## Acceptance Criteria

1. Step 0 records the exact branch, worktree, base HEAD, a clean tracked state,
   an untracked set equal to exactly the two permitted control artifacts of
   constraint 13 and nothing else, absence of the destination goal directory,
   and exact four source hashes before any mutation. Any mismatch stops the
   parcel.
2. The final cumulative diff from the frozen base contains exactly the five
   Allowed Files and no other path. The two permitted control artifacts of
   constraint 13 never appear in that diff, because they are never staged.
3. `goal-charter-amendment-r1.md` is byte-identical to its pinned source and is
   the sole path in the first local commit with the exact amendment commit
   message.
4. `charter.md`, `discovery.md`, and `plan-review-findings.md` are byte-identical
   to their pinned sources and appear with `loop-directive.md` in the second
   local commit with the exact control-plane commit message.
5. `loop-directive.md` names this coordinator as the current goal owner; makes
   GTM-P0A current; keeps P0B blocked on independent P0A acceptance and P0C
   blocked on independent P0B acceptance; and grants no authority to W1-W8.
6. The loop directive states that KPP-001-A, provisional-patent-readiness, and
   Creative Foundation remain child-owned and read-only to this umbrella.
7. The loop directive preserves Gate 3 and external-action holds, including no
   cherry-pick, push, PR, merge, release, deployment, publication, filing,
   submission, outreach, payment, customer-data handling, or Linear mutation.
8. The loop directive includes a crash-recovery rule requiring a fresh session
   to inventory the spec, worktree, branch, HEAD, five allowed files, local
   commits, and unclaimed partial state before continuing.
9. `git diff --check` passes for both commits, and the final worktree carries no
   tracked modification and no untracked path other than the two permitted
   control artifacts of constraint 13, each still byte-identical to its Step 0
   hash.
10. A deterministic report records the frozen base, both exact commit SHAs,
    each committed file hash, the ordered commit/file mapping, final HEAD,
    `git status --short`, and confirmation that no remote operation occurred.
11. Two independent reviewers, each in a fresh session with no builder context,
    verify the full two-commit range, exact scope, byte identity, loop
    authority, and no-remote boundary, and each returns PASS. Two reviews are
    required because `routing_class` is `architecture/risk`, per the
    COORDINATOR-PATTERN dispatch table.
12. No coordinator acceptance, P0B shaping, or P0B dispatch occurs from the
    builder's completion claim alone.

## Out of Scope

- Editing any file in the ambient `D:/Repos/agent-skills` checkout.
- Editing the ratified four source artifacts while copying them.
- Editing KPP-001-A, the patent goal, Creative Foundation, product repositories,
  application documents, claims/proof/packaging registries, or Linear.
- Creating `coverage-manifest.yaml`, source precedence, status, crosswalk,
  founder, counsel, duplicate-disposition, or child-status artifacts owned by
  GTM-P0B/P0C.
- Shaping, promoting, dispatching, implementing, or accepting GTM-P0B/P0C or
  any W1-W8 parcel.
- Fetch, pull, rebase, push, PR, merge, cherry-pick, release, deployment,
  publication, filing, submission, outreach, payment, production/customer data,
  or another external action.
- Editing any file outside the Allowed Files section.

## Context & References

- Ratified charter source:
  `D:/Repos/agent-skills/plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/charter.md`
- Ratified amendment source:
  `D:/Repos/agent-skills/plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/goal-charter-amendment-r1.md`
- Accepted review findings source:
  `D:/Repos/agent-skills/plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/plan-review-findings.md`
- Goal workflow:
  `plugins/foreman-line/skills/goal/SKILL.md`
- Spec convention:
  `plugins/foreman-line/docs/SPEC-CONVENTION.md`

## Allowed Files

- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/goal-charter-amendment-r1.md`
- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/charter.md`
- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/discovery.md`
- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/plan-review-findings.md`
- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/loop-directive.md`

## Verification Plan

Run deterministic file-hash, Git scope, commit-order, commit-message,
whitespace, clean-worktree, and remote-audit checks. Each of the two independent
reviewers must answer:

1. Are all four copied artifacts byte-identical to the pinned reviewed sources?
2. Is the amendment genuinely alone in the first commit?
3. Does the loop directive preserve every child-authority, Gate 3, and external
   hold without inventing dispatch authority?
4. Does the two-commit range touch exactly the five Allowed Files?
5. Is there any evidence of a remote operation or ambient-checkout mutation?
6. Are the two permitted control artifacts of constraint 13 still present,
   untracked, and byte-unchanged — neither committed nor edited?
