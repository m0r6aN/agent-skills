# Current-Instance Reconciliation — Heterogeneous Agent Worker Fabric

**Recorded:** 2026-09-03 America/New_York
**Coordinator:** Codex `/root`
**Base commit:** `24378419243e1098e57f72407fadbeedfdad2e85`
**Status:** Stage Zero evidence; not a Gate 1 or Gate 2 record.

## Provenance check

`historical-charter-source.md` hashes to
`2930d5eea38ea45097ff29d25fc46d53c6c65bc97afc8d36e97e98f2d3cd36e4`, exactly
matching the pin in `charter.md`. It remains historical design input only.

## Claim ledger

| Claim group | Current classification | Current-instance evidence | Consequence |
|---|---|---|---|
| Historical WF-P0 through WF-P27 parcels, tests, branches, PRs, provider observations, credentials, and gate events | `historical_only` | The current all-ref Git path history for this goal contains only the 2026-09-03 intake commit; no current goal-local parcel specifications or evidence artifacts exist. | Credit none; redraw the current parcel graph after Gate 1. |
| Current goal intake | `verified_current` | Merge commit `24378419243e1098e57f72407fadbeedfdad2e85` contains the charter, preserved source, pickup directive, and goal-index registration. | Valid base for this dedicated coordinator worktree only. |
| Foreman Line stage contracts, receipts, permission profiles, routing policy, dispatch routing evaluation, and the public-only Cerebras shadow boundary | `verified_current`, but `not_goal_completion` | Tracked packages and tests are present on the intake base. The Cerebras route is candidate-only, public-only, with host-injected discovery and invocation. | Treat only as existing canon or possible dependency; do not call it a heterogeneous worker fabric or reuse it without ratified scope. |
| Provider transport, Fireworks adapter, current availability/capability/pricing, credential access, and real route evidence | `missing` | No tracked current worker-fabric provider adapter or provider proof was found outside the historical source. No credentials were inspected. | No provider call, spend, secret access, or promotion work is authorized. |
| Shared routing-policy serialization point | ~~`conflicting`~~ → `verified_current` (corrected 2026-09-03 at coordinator transfer) | **Original Codex observation:** the shared registration worktree had an uncommitted user-owned edit to `routing-policy.yaml`, whose proposed frontier identity also conflicted with the validator anchor. **Current evidence:** that edit has landed as `096adfb` ("retarget routing policy to OpenRouter (v0.3)"), merged to `main` via PR #15; `git status` in worktree `goal-intake-hierarchical-worker-fabric-20260903` is clean; `routing-policy.yaml` is v0.3 with four `routing_class` values and `public`/`internal`/`restricted` classifications. | The user-owned conflict is discharged. The policy remains a shared serialization point requiring explicit parcel ownership (WF-P2, WF-P6), and D4 makes it the sole registry authority — but it no longer blocks WF-P2's dependency chain. Re-verify at WF-P2 dispatch time per D4. |
| Foreman Kernel and hierarchical-sidecars goals | `verified_current` as separately owned | Foreman Kernel names a live Claude Code coordinator. Hierarchical-sidecars names a separate Codex coordinator and is stopped awaiting its stated gate/owner resolution. | No co-ownership or amendment of their files; only consume ratified interfaces when available. |

## Current constraints carried to Gate 1

1. The eight proposed decisions in `charter.md` remain proposals; none is binding.
2. No implementation parcel may be dispatched: Gate 2 is absent.
3. Gate 3/default-route promotion remains human-only even if all local evidence becomes green.
4. Routing-policy, package manifests, provider adapters, and worker envelopes are potential serialization points; each needs explicit parcel ownership and dependency ordering.
5. Any later model, pricing, capability, data-eligibility, or availability claim needs fresh evidence at the relevant dispatch/promotion point, without exposing credentials.

## Next required action

~~Developer Gate 1: ratify, amend, or reject the proposed decisions D1–D8, the proposed
exit criterion, and the scope for a freshly drawn WF-P0 reconnaissance parcel.~~

**Closed 2026-09-03.** Gate 1 was ratified (D1–D8, graph, exit criterion), the mandatory
plan review ran and returned six reproduced findings, and amendment A1 was ratified with the
ledger correction recorded above. Gate 2 is granted for **WF-P0 only**. The next action is
WF-P0 shaping under the loop directive; constraints 1–5 below are superseded only where
`charter.md` now says otherwise — in particular constraint 1 (decisions non-binding) and
constraint 2 (no dispatch) no longer hold as written, while constraints 3–5 stand.

**Coordinator transfer:** ownership moved from the stopped Codex `/root` coordinator to a
Claude Code coordinator session on 2026-09-03 by explicit developer ruling, at a pre-dispatch
boundary with no parcel in flight. This document's Stage Zero findings were re-verified at
transfer (source hash, routing-policy state) rather than credited from prose.
