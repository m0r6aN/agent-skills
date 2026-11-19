# acme-app

The seed script creates a bare origin, a dirty reporting worktree, an exporter worktree with an unpushed commit, and a pushed `feat/already-pushed` branch with no PR. The local default then advances without a push: a newly created remote `dev` must match the remote default instead. The branch-only case verifies that push status alone never satisfies the PR deletion gate.

In `stale-pr` mode, `dev` and the tag `fixture-merged-pr-head` point to the simulated merged tip; `feat/already-pushed` has one additional pushed commit. The reporting worktree is locked and the exporter worktree contains an ignored `private.env` placeholder. The bare origin has no live PR service.
