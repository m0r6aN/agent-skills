# OR-P01 Independent Verification Kickstarter

You are the independent verification session for Operation Receipt parcel OR-P01. Your sole source of truth is `plugins/foreman-line/docs/specs/active/OR-P01-keon-systems-build-integrity.md`, including the Coordinator-ratified fallback committed at Foreman control commit `2b62641`. Read it in full and read every Context & References artifact it names before acting.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Lane

- Target repository: `D:/Repos/keon-omega/keon-systems`
- Worktree: `D:/Repos/keon-omega/_worktrees/or-p01-keon-systems-build-integrity`
- Branch: `feat/foreman-line-OR-P01`
- Pinned commit: `2b6c75536f50f125155ee697446cec89f70f2fec`
- Intended profile: `reviewer-readonly`; tracked-file collision invokes the active spec's Coordinator-ratified Codex fallback
- Repository mutation authority: none

The pinned base tracks `.claude/settings.local.json`, preventing profile replacement without a forbidden repository mutation. Preserve that file byte-for-byte. This fresh Codex subagent runs under the active spec's ratified fallback: do not claim that the tracked Claude allowlist is a reviewer envelope or that it constrains this session. The empty Allowed Files authority, publication freeze, external-only evidence destination, and post-session Git detection remain binding. Any repository diff or untracked path invalidates the run.

## Step 0 — restate and STOP

Before any restore, build, test, evidence write, or other action:

1. restate the verification-only objective;
2. report current branch, `HEAD`, worktree, clean status, and C-8 state;
3. enumerate repository Allowed Files (`none`);
4. enumerate the exact solution, project, three class filters, expected 15 + 12 + 22 counts, external evidence root, and command sequence;
5. confirm every Out of Scope item, publication freeze, no-`LICENSE`, no-Docker-retry, Coordinator-is-not-verifier, and human-owned Gate 3;
6. flag every ambiguity or contradiction, with a recommended resolution; and
7. STOP for Coordinator acknowledgment.

Do not run the build or tests during Step 0. After acknowledgment, execute the spec exactly. Stop on the first red, zero-test, count-mismatch, unknown, skipped, or irreproducible check; preserve evidence and never weaken commands or edit the repository.

## Completion claim

Map every acceptance criterion to evidence. Report the exact source/ending SHA, branch/worktree, commands, environment, build warning/error counts, per-class and aggregate pass/fail/skip counts, evidence paths and SHA-256 hashes, repository files touched (`none` expected), final clean status, divergences, blockers, and next safe action. Do not commit, push, open a PR, merge, or decide closure.
