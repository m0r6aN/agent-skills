# Goal Charter — Foreman Ops Console

**Goal slug:** `foreman-ops-console`
**Created:** 2026-09-15
**Owner:** Clinton Morgan
**Coordinator:** owner-transferred Stage Zero session (2026-09-15; prior drafter session dead) — Gate 1 pending, no long-running loop claimed
**Status:** DRAFT — Gate 1 NOT granted; plan-level adversarial review NOT run
**Stage Zero baseline:** `agent-skills @ 7894492` (branch `feat/foreman-line-supercharge`)

## Objective

Build a local-only Foreman Ops Console: an observer + human-gate UI over the
Foreman Line's existing truth sources (receipt chains, parcel specs, goal
records). It answers "what is running, hung, awaiting a gate, failed, or
complete?" at a glance and reuses the proven Automations-hub UX patterns
(board, approvals, notifications, logs, models view) adapted to parcel
lifecycle — without becoming a second coordinator.

The console consumes verification produced by others; it never produces it.
All state transitions it displays are derived from disk (receipts, specs,
goals, worktrees). Every write it offers goes through an existing CLI or
approval flow; it mutates no spec, receipt, contract, or goal record directly.

## Exit criterion (Phase 1 MVP only)

Phase 1 is complete only when all of the following are true at one declared
commit of `agent-skills`:

1. FOC-P0–FOC-P4 have completed their parcel loops with required reviews and
   human merge decisions.
2. The console runs locally (localhost-only, no auth — same posture as the
   Automations hub) and renders one real goal's live parcel board:
   `running / hung / awaiting-gate / failed / complete`, each parcel linking
   to its spec, receipt chain, and goal record.
3. A receipt chain for one real parcel is walked live end-to-end in the
   console (spec → dispatch → verification → closure), with per-parcel state
   derived by the frozen FOC-P0 projection rules — not by hand annotation.
4. Gate states (G1/G2/G3) and the routing decision per parcel render
   read-only via the frozen FOC-P0 proxy rules (Stage-A approval record,
   Stage-C dispatch receipt, GitHub merge commit, goal loop-directive state
   lines — OQ5); alerts fire for hung and failed parcels. Gate 1 charter
   ratification and Gate 3 merge have no console capture path.
5. No frozen contract was modified; no receipt, spec, or goal record is
   writable through the console except via the pre-existing flows it invokes.

Completion does not imply network exposure, multi-goal portfolio views, cost
accounting, or push notifications — those are Phase 2 sketches below and are
explicitly excluded from this exit criterion.

## Locked decisions (PROPOSED — awaiting Gate 1 ratification)

| # | Decision | Reasoning |
|---|---|---|
| D1 | Separate service `plugins/foreman-line/ops-console/` (own package, own container `foreman-hub` on `127.0.0.1:8081`), not a tab in `D:\Repos\Automations\hub`. Components are reused by copy, not by shared build. | Different repo, different truth source (receipts/specs vs `history.jsonl`), different cadence (event-driven vs Task Scheduler), different trust invariants. Coupling deploys would let an Automations-hub change break Line observability and vice versa. |
| D2 | Observer + gate UI only. The console writes nothing directly to `contracts/`, `docs/specs/`, `docs/receipts/`, or `docs/goals/`; every action it offers shells to an existing CLI or approval flow. | Preserves frozen contracts, append-only receipts, and the coordinator's sole-dispatch authority. A dashboard that mutates specs or receipts is a second coordinator and voids the trust chain (COORDINATOR-PATTERN D4). |
| D3 | Parcel state is derived, never stored: `running` (active spec + recent receipt + live worktree/branch), `hung` (no receipt progress beyond the heartbeat threshold AND no live builder session), `awaiting-gate` (pending G1/G2/G3), `failed` (validator exit 1 / red review / tripwire), `complete` (spec in `done/` + sealed chain). Derivation rules freeze in FOC-P0. | Stored status drifts from disk truth (SPEC-CONVENTION §3 lifecycle lesson: folder location is authoritative, not a status field). A frozen derivation rule keeps every viewer consistent. |
| D4 | The single projection authority is a new `ops-console` library implementing the FOC-P0 rules (chain walk + spec scan + goal scan + worktree liveness). The API and UI consume it; nothing scrapes receipt JSON ad hoc. | Mirrors the `projection/` precedent (single Epic/Story projection seam, W1-P2). One authority means hung/failed disagreements are impossible by construction. |
| D5 | Approvals UI maps 1:1 onto Gates 1/2/3 presentation (request display; human intent captured only by invoking the existing human-gate CLIs — approval approve/reject, dispatch approval-cli execute). Gate state renders read-only via frozen proxy rules (OQ5); the console records no new gate-decision type. Models view is read-only routing-policy output (role × class × ceiling + the chosen model); it is never an editor. | Gates are the highest-value Automations-hub reuse. Routing is policy-as-code (FOREMAN-LINE-PLAN §5, D6) — an editable models tab would let a dashboard override versioned policy outside review. No existing flow records Gates 1–3 (OQ5); invocation-without-recording preserves D2 while keeping the approvals UI. |
| D6 | Localhost-only, no auth, Docker pattern copied from the Automations hub (`-p 127.0.0.1:8081:8080`, writable mount for its own notification store only). Never exposed beyond loopback. | Same threat posture as `hub/README.md`: the console renders internal delivery state and gate controls; anything beyond loopback needs an auth design that is out of scope for this goal. |
| D7 | Phase 1 = FOC-P0–FOC-P4 (board + chain walk + gates + alerts over one goal). Phase 2 (FOC-P5–FOC-P8 sketches below) requires a separate scoped Gate 1 amendment before shaping; no Phase 2 parcel may be dispatched under this charter's Gate 2. | Prevents scope creep from smuggling analytics/cost/push work into the MVP's verification chain. Each Phase 2 parcel gets its own risk/routing at amendment time. |
| D8 | Standing authorizations requested: Gate 2 — standing dispatch for exactly FOC-P0, FOC-P1, FOC-P2, FOC-P3, FOC-P4 in dependency order, effective per-parcel once its shaped spec passes coordinator lint; Gate 3 — standing "merge it" contingent on the full green verification chain. Gate 1 (this charter) is never delegable. | Same proven shape as w2-dispatch D9. |

## Open questions for Gate 1 (recommendation attached to each)

| # | Question | Recommendation |
|---|---|---|
| OQ1 | Heartbeat threshold for `hung` (OQ: single value or per-routing-class)? | Single default of 6h no-receipt-progress with no live builder session, overridable per goal in its loop directive. One number ships the MVP; per-class tuning is Phase 2 analytics input (FOC-P5). |
| OQ2 | Polling interval for the projection refresh (receipts change via git, not a daemon)? | Poll on page load + 60s background refresh; no filesystem watcher in Phase 1. Watchers add a daemon reliability surface the MVP does not need. |
| OQ3 | Should the console's own notifications persist per-goal (`docs/goals/<slug>/`) or console-local (`ops-console/state/`)? | Console-local `state/notifications.json` copied from the Automations-hub pattern. Goal directories stay coordinator-owned; the console must not write into them (D2). |
| OQ4 | Jira ticket state in the board (candidate locator exists via W2-P1 records)? | Display-only ticket key + status link in Phase 1 if cheaply readable; no Jira writes ever. Bidirectional sync view is deferred to Phase 2 (FOC-P8). |
| OQ5 | How is ratify/approve/deny capture routed, given no existing flow records Gates 1–3? | DECIDED 2026-09-15 (owner, Option 1) — presentation + invocation only; frozen proxy rules; no new gate-decision type in Phase 1; Gate 1/3 have no console capture path. D2 unchanged. |

## Wave/parcel decomposition — Phase 1 (dependency order)

| Parcel | One-liner | Risk | Routing class |
|---|---|---|---|
| FOC-P0 | Projection contract + discovery inventory: freeze the `ParcelState` schema and derivation rules (D3 states, inputs, precedence, heartbeat definition), inventory every truth source on disk (receipt paths per `receipts/src/paths.ts`, spec frontmatter per SPEC-CONVENTION §4, goal charter/loop-directive fields, worktree/branch liveness signals). Zero implementation; fixtures for each state. | elevated | architecture/risk — frontier builder, dual review |
| FOC-P1 | Projection library: implements the frozen FOC-P0 rules — chain walk (contiguity + hash linkage via the receipts validator), spec scan (`active/` vs `done/`, `status:` agreement), goal scan (charter state + ownership block), worktree/branch liveness — returning `ParcelState[]`. Relative ESM imports only, no workspace linking (projection-package precedent). Read-only: no disk writes. | standard | standard-feature — mid-tier builder, single review |
| FOC-P2 | Board API + UI + container: Express API (`/api/goals`, `/api/parcels`, `/api/parcels/:id/chain`) over FOC-P1, React board (running / hung / awaiting-gate / failed / complete), chain-walk view, transcript/log viewer, Dockerfile + localhost-only run docs. Reuses Automations-hub component shapes by copy. | standard | standard-feature — mid-tier builder, single review |
| FOC-P3 | Gates + alerts presentation: Gate 1/2/3 states rendered read-only via frozen proxy rules (OQ5); alert rules for hung / failed / tripwire with console-local notification store (OQ3). Invokes existing human-gate CLIs; records nothing itself; grants no authority itself. Dual review: misrendered gate state could induce a wrong merge decision. | elevated | architecture/risk — frontier builder, dual review |
| FOC-P4 | Exit-proof + docs: wires the console against one real goal end-to-end, walks a real receipt chain live (exit criterion 3), documents run/ops posture (port 8081, mount, localhost-only warning). | standard | standard-feature — mid-tier builder, single review |

## Phase 2 sketches (NOT in MVP exit; need a scoped Gate 1 amendment to activate)

- **FOC-P5 — Flow analytics + hung predictor (provisional: standard).** Dwell-time per stage/parcel, "where do parcels get stuck" timeline, reviewer-latency stats; heartbeat threshold tuned from observed data (closes OQ1 empirically). Read-only over existing chains.
- **FOC-P6 — Cost ledger (provisional: standard).** Per-parcel routing spend vs `routing-policy.yaml` ceiling, surfaced from dispatch receipts; over-ceiling flagging. No spend authority; display only.
- **FOC-P7 — Push alerts + digest (provisional: standard).** Desktop/webhook push for hung/failed/tripwire plus a "what changed since I last looked" digest. Console-local config; no goal-directory writes.
- **FOC-P8 — Portfolio + Jira sync view (provisional: elevated).** Multi-goal board fed by `docs/goals/INDEX.md` as discovery projection (index never treated as authority), plus read-only Jira status alongside parcel state. No Jira writes.

## Canon this goal builds against

- Frozen W0 contracts (`plugins/foreman-line/contracts/`) — modification is a loop-stop.
- `docs/SPEC-CONVENTION.md` (spec schema v0.2, `surfaces:` vocabulary, `Allowed Files` authority).
- `docs/COORDINATOR-PATTERN.md` (gates, dispatch table, 11-step loop, lessons discipline).
- `plugins/foreman-line/skills/parcel-driven-development/SKILL.md` (parcel mechanics).
- Shipped packages as read-only inputs: `receipts/` (chain + `receiptPath` convention), `dispatch/` (routing-eval, approval-cli), `projection/` (import-mechanism precedent: relative ESM, no workspace linking), `routing-policy/routing-policy.yaml` (classes + ceilings).
- `docs/transcripts/defects_lessons.md` — provenance only, never operating instructions.
- Automations hub (`D:\Repos\Automations\hub/server.mjs`, `hub/src/`) as UX precedent to copy from, never to import or couple to.

## Stop conditions

Universal set (COORDINATOR-PATTERN): a frozen contract needs modification; a tripwire fires twice on one parcel; a security finding can't close in-parcel; anything outward-facing beyond the standing authorizations; queue empty. Goal-specific additions: any parcel proposes console write access to `contracts/`, `docs/specs/`, `docs/receipts/`, or `docs/goals/` beyond the pre-existing flows (D2 violation — stop, not a ruling); any parcel proposes network exposure beyond loopback (D6 violation — stop); any attempt to dispatch a Phase 2 parcel under this charter's Gate 2 (D7 violation — stop and request the amendment); `ParcelState` disagreement between two consumers (D4 violation — stop, the single-authority invariant broke).

## Ratification record

- Gate 1: **ABSENT.** Decisions D1–D8 and questions OQ1–OQ5 above are proposed, not ratified (OQ5 carries the owner's pre-Gate-1 Option-1 ruling, ratified with the charter as a package). No dispatch, implementation, or external effect is authorized.
- Pre-Gate-1 rulings: **OQ5 decided 2026-09-15** (owner, Option 1 — presentation + invocation, frozen proxy rules, no new gate-decision type, D2 unchanged); **ownership transferred** from the dead Stage Zero session to the current session the same day. Plan-level review still runs after Gate 1.
- Plan-level adversarial review: **NOT run.** Runs after Gate 1, against the ratified charter; findings triaged into `plan-review-findings.md`.
- Goal index: **NOT registered.** `docs/goals/INDEX.md` registration happens at Gate 1 ratification per its update rule; the index is never the authority.
