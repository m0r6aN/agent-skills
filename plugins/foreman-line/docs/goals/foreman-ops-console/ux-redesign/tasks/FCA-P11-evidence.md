# FCA-P11 verification evidence

Date: 2026-10-14

## Option mapping / pinning

The `(discrepancy code, option index) -> act` table is in `ops-console/src/reconcile.ts` (`OPTION_ACTS`). The test `the closed discrepancy vocabulary has a deliberate act (including null) for every option index` passed in the full suite.

## AC8 live read-only console check

Started the console from `plugins/foreman-line/ops-console/` with:

```sh
FOC_REPO_ROOT=/home/cmorgan76/Repos/agent-skills-worktrees/fca-p11 \
FOC_STATE_DIR=/tmp/p11-ac8-state PORT=8195 npx tsx src/server.ts
```

The server bound only to `127.0.0.1:8195`. Its startup output identified the supplied worktree and primary goal tree. The first attempted invocation from the repository root failed because `src/server.ts` is package-relative; it was then started correctly from the package directory.

Requested `GET http://127.0.0.1:8195/api/reconcile?goal=foreman-ops-console` (generated at `2026-10-14T14:20:12.935Z`). The response contained actionable discrepancies, including:

- `FOC-P1`: `orphan-worktree` (four distinct orphan worktrees)
- `FOC-P2`: `orphan-worktree`
- `FOC-P3`: `orphan-worktree`
- `FOC-P4`: `never-started`

Option rendering/action mapping observed in the response and real UI:

- Each `orphan-worktree`: **Resume the work in it** → Prepare session (`investigate`); **It is leftover (last resort)** → “Needs hygiene-actions (not yet available)”.
- `never-started`: **Yes — it is next in the queue** → “Needs hygiene-actions (not yet available)”; **It shipped under another identity (bundled drop, renamed, or no per-parcel PR)** → Prepare session (`investigate`); **It was deferred or superseded (last resort)** → “Needs hygiene-actions (not yet available)”.

Sample composed instruction from the API for FOC-P1 (first orphan-worktree, “Resume the work in it”):

```text
Parcel: FOC-P1
Goal: reconciliation follow-through
Code: orphan-worktree
Option: Resume the work in it
Recommendation: Start a fresh session in the same worktree rather than cutting another.
Evidence: worktree /home/cmorgan76/Repos/agent-skills-worktrees/foreman-ops-console-foc-p1-20261012t225424z; branch spawn/foreman-ops-console-foc-p1-20261012t225424z; 0 commits ahead of the default branch, 0 changed files, no live console-launched session (sessions started outside the console are not visible)

Report findings only. Change nothing. Do not merge, push, close, delete, or fetch. Stop when the question is answered.
```

## Real Chromium browser check

Chromium was available at `/usr/bin/chromium`. Opened the live console over CDP, selected the `foreman-ops-console` goal, opened a finding, and inspected rendered findings/options and horizontal overflow at both requested emulation settings. No browser console errors or exceptions were reported.

| Requested width | `window.innerWidth` observed | document `scrollWidth` | Horizontal overflow |
|---:|---:|---:|---|
| 1366 px | 1366 px | 1351 px | No |
| 320 px | 440 px | 440 px | No |

At the 320px CDP setting the helper enables mobile device emulation, and Chromium reported a 440px CSS `innerWidth`; therefore this is the narrow-device emulation result, not a verified exact 320px CSS viewport. The package's real-Chromium browser test also checks 1366px and 320px via the same CDP helper, but its passing result is separate from this live-console observation.

## Verification

From `plugins/foreman-line/ops-console/`:

- `npm test` — PASS, **594 tests, 0 failures, 0 skipped**, after the final correction (2026-10-14).
- `npm run typecheck` — previously PASS after adding `invalid-extra-text` to `SpawnRefusalReason`.
- `npm run lint` — previously PASS, Biome checked 100 files with no warnings/errors.

The root worktree has no root `package.json`; `npm test` was therefore run from the ops-console package directory. All reconciliation checks above were GET/read-only; no goal/receipt/spec data was changed.
