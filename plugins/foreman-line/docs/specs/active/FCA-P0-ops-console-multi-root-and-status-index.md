---
ticket: FCA-P0
title: Ops-console multi-root goal discovery and goal status index (additive)
status: active
owner: clinton.morgan
created: 2026-10-09
updated: 2026-10-09
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/src/config.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/src/status.ts
  - plugins/foreman-line/ops-console/ui/app.js
routing_class: standard-feature
verification_class: deterministic
permission_profile: builder-standard
data_classification: internal
---

# FCA-P0 — Ops-console multi-root goal discovery and goal status index

## 1. Purpose

Two operator-facing gaps in the Foreman Ops Console, closed additively:

1. **FCA-1 — multi-root goal discovery.** Goal records exist beyond the
   primary repo's `plugins/foreman-line/docs/goals/` tree: repo-native
   `docs/goals/` trees (agent-task, biostack) and `docs/INITIATIVES/` trees.
   The console projects one root; goals in other repositories are invisible.
2. **FCA-2 — goal status index.** The goal picker lists every goal including
   fully shipped ones ("queue empty / GOAL COMPLETE" end states), and the
   board does not foreground what needs the human.

## 2. Additive surface (the ONLY changes)

| Surface | Change | Frozen constraint honored |
|---|---|---|
| `FOC_EXTRA_ROOTS` env | optional colon-separated absolute roots; each asserted absolute exactly like `FOC_REPO_ROOT` (typed `root-not-absolute` refusal) | D1: roots are caller-supplied and absolute; never derived from cwd or module location |
| goal keys | `alias.slug` outside the primary tree (`agent-task.intelligence-layer`); bare slugs keep resolving to the primary tree; longest-prefix resolution; second tree in one repo gets `alias.N` | frozen goal-key charset `[A-Za-z0-9._-]+` already admits the qualified form |
| `ParcelProjection.goal` | carries the tree-qualified key for extra-tree goals (bare slugs unchanged for the primary tree) | shape unchanged; values disambiguate alert identities across trees |
| `/api/goals` response | gains sibling field `statuses: GoalStatus[]` (`key`, `tree`, `active`, `attention` counts); `goals` keeps its pre-extension shape and order | route table unchanged (X1): no route added, removed, or renamed |
| goal refs | `charterRef`/`loopDirectiveRef` label with the tree's alias outside the primary tree | locator shape unchanged |
| UI | goal picker lists **active** goals only, grouped per tree, attention-first; board shows a needs-attention banner and `needs` card treatment | presentation layer; no derivation authority |

## 3. Status index derivation (FCA-2)

Pure aggregation over the already-frozen per-parcel derivation (R1–R5
precedence untouched). A goal is **active** iff any of:

- any parcel `state != 'complete'`, or
- the queue has items no parcel could be placed from, or
- Gate-1 ratification is `pending`, or
- the goal has no parsed parcels but live narrative state lines and its own
  state does not declare the goal closed (`exit criterion met`,
  `goal complete`, `goal closed`, `queue empty` — the same text-parsing
  precedent as `ratification()`; covers non-foreman-line queue dialects like
  agent-task's and cross-goal coordination records).

Attention counts: `hung`, `failed`, `awaitingGate` (parcel states) +
`ratificationPending`. A fully shipped goal (every parcel `complete`,
charter granted — the "queue empty / GOAL COMPLETE" loop end state) is
inactive and drops out of the picker.

## 4. Non-goals / stop conditions

- No stored status: `statuses` is derived per request like everything else.
- No writes: the two console-local state files remain the only writable paths.
- No gate authority: nothing here decides, records, or auto-approves a gate.
- Derivation rules R1–R5 and the FOC-P2 route table are not modified.

## 5. Acceptance criteria

- AC1: with `FOC_EXTRA_ROOTS` unset, behavior is byte-identical to
  pre-extension (existing 78-test corpus green unchanged).
- AC2: each extra root's goal trees are projected under `alias.slug` keys;
  `/api/parcels?goal=alias.slug` resolves; unknown keys 404 through the
  frozen routes.
- AC3: `/api/goals` carries `statuses` alongside the unchanged `goals`;
  `active` matches the §3 derivation (unit-covered).
- AC4: relative extra roots are refused typed before any path construction.
- AC5: the goal picker shows active goals only, grouped per tree, with
  attention counts; the board foregrounds what needs the human.

## 6. Verification

`ops-console`: `npm test` (85/85 incl. `tests/multi-root.test.ts`),
`npm run typecheck`, `npm run lint` (biome) — all green 2026-10-09.
