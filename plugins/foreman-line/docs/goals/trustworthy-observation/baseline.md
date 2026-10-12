# Planning baseline — 2026-10-10

## Source and preservation

Planning worktree: `/home/cmorgan76/Work/foreman-observation`, branch
`docs/foreman-trustworthy-observation`, base
`2f7fc9a4ddd479dc2b2282b57d63fbc5025f837d` from the clean FCA worktree.
FCA PR #163 is confirmed merged; planning branch was advanced to origin/main
`d86ade55` before implementation. See dispatch-preflight.md for merge rules.

The original checkout is on `chore/ci-fail-fast-charter` with modified package
manifests, console code, untracked FCA specs/state, and active CI worktrees. None
were reset, staged, copied into an implementation branch, or claimed as ours.
The new charter does not transfer ownership of another goal.

## Analysis observations

Checks in the original checkout before shaping: console `npm test` 92/92 and
`npm run typecheck` passed on Node 26.8.2. The initial sandbox test invocation
could not create tsx IPC; the full suite passed with permitted socket access.
These results are baseline observations, not independent acceptance of future
parcels and not verification of this isolated worktree.

Reproduced with temporary files: `Gate 1: not granted.` is currently read as
granted; a member containing JSON null throws in the console chain walker.
Real chain `a5b1975a-7497-4200-bac2-5d8a6fd6c749` is accepted by the console's
live-goal test but directory validation includes sidecars and rejects it.

Source inspection: scan.ts embeds plugin-layout refs for extra native spec
trees; frontend fileLink uses the primary root; refresh does not reload goal
statuses or selected detail; async responses have no generation guard; remedy
uses uppercase parcel keys for approval and the overall receipts directory for
chain validation. The invocation registry accepts lowercase slugs and a mapped
workflow/member path. No browser session was inspected in the analysis.

An observed primary scan reported 15 goals, 27 hung parcels, four complete,
and about 188 ms in one run. These are classifications and one measurement,
not proof of agent abandonment or a performance baseline.

## Ownership and compatibility checks before dispatch

- Establish FCA merge/PR disposition; rebase on the authorized implementation
  base while retaining its accepted features. Never silently omit FCA work.
- Reconcile console/FCA ownership for overlapping scan/api/config/UI surfaces.
- Inventory receipts CLI consumers before altering directory membership.
- Bound referenced ratification reads to configured repository roots and known
  supported artifacts; no arbitrary path opening or fabricated evidence.
- Track the old FOC-P0 and FCA clauses affected by the companion amendment.
- Preserve old state-derivation fixtures; add behavior tests for the defects.

## Deferred findings

Lifecycle/execution dimensions, explicit attempt identity, UUID winner behavior,
mtime liveness, queue dialect coverage, routing-policy representation drift,
indexing/transactional snapshots, audit-store durability, server resource limits,
authenticated browser actions, and kernel/queue/spend integrations stay outside
this goal. New findings are triaged, not automatically added to scope.
