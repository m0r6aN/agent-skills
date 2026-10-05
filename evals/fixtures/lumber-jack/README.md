# acme-app

The seed script creates a bare origin, a dirty reporting worktree, an exporter worktree with an unpushed commit, and a pushed `feat/already-pushed` branch with no PR. The branch-only case verifies that push status alone never satisfies the PR deletion gate.
