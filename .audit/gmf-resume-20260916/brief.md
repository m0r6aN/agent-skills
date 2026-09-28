# GMF resume state reconciliation — shared brief

## Context

The user requested: `Resume open parcels PR #27 GMF-P0 rework`.

This repository runs the Governed Model Fleet (GMF) as a serialized, gated
Foreman Line goal. No mutation, dispatch, or external effect may be inferred
from a stale PR reference. The purpose of this review is to determine the
accurate resume point and the next safe action.

## Inventory

- GitHub PR #27: title `feat(foreman-line): SUPERCHARGE-P2 routing and
  frontmatter comprehensiveness analysis`; head `feat/supercharge-p2`; state
  `MERGED`; merge commit is on `main` as `401c364`.
- GitHub PR #28: title `docs(foreman-line): GMF-P0 discovery baseline and
  permanent negative contracts`; head `codex/gmf-p0-discovery-20260904`;
  state `MERGED`.
- GitHub PR #33: GMF-P1 frozen-contract parcel; state `MERGED`.
- `plugins/foreman-line/docs/goals/governed-model-fleet/loop-directive.md`
  declares state `gmf_p1_landed_p2a_awaiting_shape` and says the next safe
  action is GMF-P2A shaping, with no P2A Gate 2 granted or requested.
- The directive's strict queue marks GMF-P0 and GMF-P1 as LANDED and GMF-P2A
  as the next dependency-eligible item.
- Current checkout is `main` at `c06c1d5`; the working tree is clean.
- The goal ownership block names `/root` as coordinator.

## Verified observations

- PR #27 is merged, not open, and its subject is not GMF-P0.
- The actual GMF-P0 PR is #28 and it is merged.
- The live state is backed by the loop directive and goal index, not merely by
  pull-request titles.
- The current directive requires a shaped P2A spec before a P2A Gate-2 request;
  it expressly withholds product implementation and external effects.

## Your task

Assess the evidence as a resume-state and governance review. Identify the
highest-risk failure modes in acting on the user wording, then prescribe the
minimum correct next action. Do not recommend edits, dispatch, or a gate grant
that the evidence does not authorize.

## Output contract

Deliver EXACTLY: "TOP 5 BRUTAL FINDINGS" (numbered, one line each) then "TOP 5 MOVES" (numbered, one line each, implementation-ready). Max 350 words total. Plain text only.
