# DIRECTIVE — Governed Model Fleet resume-state reconciliation (3-seat council)

**Kickoff:** Repository `D:/Repos/agent-skills`; governing goal records under
`plugins/foreman-line/docs/goals/governed-model-fleet/`; execute only in the
order below. Definition of done for this review is a correct, durable resume
locator and an authorized next action—not a dispatch or implementation. The
coordinator is `/root`; no other coordinator may write or dispatch.

**Evidence:** `brief.md`; `coordinator-out.txt`; `grok-out.txt`;
`codex-out.txt`; `claude-out.txt`. Gemini was unavailable after two attempts
because its local CLI authentication is no longer supported.

## Verdict

The requested PR/parcel reference is stale and points to no open work: PR #27
is merged SUPERCHARGE-P2, while GMF-P0 is the separately merged PR #28. The
authoritative resume point is `gmf_p1_landed_p2a_awaiting_shape`; P2A shaping,
not P0 rework or P2A dispatch, is the only next safe action.

## Convergent Findings

- **F1 — P0 (3/3 seats):** PR #27 is a merged, unrelated SUPERCHARGE-P2 PR;
  the actual GMF-P0 PR is #28 and is also merged. No PR is open to resume.
- **F2 — P0 (3/3 seats):** Reopening/reworking P0 would violate the strict
  queue and risk altering frozen P0 evidence consumed by landed P1.
- **F3 — P0 (3/3 seats):** P2A is dependency-eligible but not execution
  authorized: no shaped P2A spec or P2A Gate-2 approval exists.
- **F4 — P1 (3/3 seats):** A user resume phrase, Gate 1, standing grants, and
  harness permissions do not grant P2A dispatch, product work, or external
  effects.
- **F5 — P1 (2/3 seats):** Some historical status prose remains stale after
  P0/P1 landing; it must be treated as historical context, not a state source.
  The loop directive and goal index agree on the current state.

## Execution Plan

### Phase 1 — reconcile and preserve

1. **Target:** coordinator handoff/status. **Change:** record PR #27 as a
   closed, unrelated PR; record PR #28 as closed GMF-P0 evidence and PR #33 as
   closed GMF-P1 evidence. **Acceptance:** the resume locator names
   `gmf_p1_landed_p2a_awaiting_shape` and no P0 rework is opened.
2. **Target:** frozen P0/P1 evidence and the main checkout. **Change:** none.
   **Acceptance:** no checkout of historical parcel branches, no evidence edit,
   no builder/reviewer dispatch, and no product/external effect.

### Phase 2 — bounded next work

3. **Target:** GMF-P2A shaping only. **Change:** open a fresh docs-only shaping
   session on current main to produce a P2A draft with exact Allowed Files,
   `keon-systems` base/branch/worktree, P1 contract inputs, required
   verification, collision analysis, and two independent-review route.
   **Acceptance:** every factual claim is linted against current disk and
   frozen P0/P1 records; any canon change is raised as a scoped amendment.
4. **Target:** P2A Gate 2. **Change:** only after the shaped spec passes its
   review, present an exact P2A-only Gate-2 request. **Acceptance:** no builder
   is dispatched until the explicit grant exists.

## Rules of Engagement

- `/root` remains the sole coordinator; ownership transfers only at a recorded
  parcel boundary.
- P0/P1 and predecessor evidence are read-only inputs. A real defect requires
  a separately scoped amendment/rework parcel, never an inferred reopen.
- Gate 2 scopes only the named parcel and its Allowed Files. It never implies
  provider spend, disclosure, repository creation, promotion, merge, or other
  external effect.
- Resolve stale prose only through a specifically authorized documentation
  maintenance scope; do not mix it into P2A shaping or implementation.
