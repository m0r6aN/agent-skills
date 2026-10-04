---
ticket: HCS-P0
title: Authority and collision reconnaissance
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: critical
surfaces:
  - plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Map, with evidence, the authority and collision landscape the hierarchical-coordination
seam lands in: current goal ownership, kernel contracts, state authority, queue mechanics,
active serialization points, and the exact landing target for amendment A3. Deliver one
reconnaissance map and one verification record that later HCS parcels consume as their
seam reference. This parcel writes documentation records only: it implements no
coordination code, edits no Foreman Kernel file, and resolves no open contract decision.

## Constraints

Authority baseline is `charter.md` D1–D7 as ratified by
[`gate-1-ratification-2026-09-26.md`](../../goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md)
— a coordinator decision receipt dated 2026-09-26 under owner blanket authority, not a
human approval. Gate 2 covers HCS-P0 only; **Gate 3 remains human-owned** and this spec
grants no merge, release, or spend authority (authority basis: charter D7; owner blanket
authority does not delegate Gate 3).

The Stage Zero record
[`hcs-stage-zero-2026-09-26.md`](../../goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md)
binds this parcel: its §3.1 safe sequence forbids editing any FK charter, branch, worktree,
or owned serialization point (a required FK edit is a stop-and-escalate event); its §3.2
disposition (FK-P10 lease reuse-or-amend) and §3.3 stale-assumption table are given inputs,
not questions to re-litigate; its §3.4 names what remains open. A3
([`source-proposed-amendment-A3.md`](../../goals/hierarchical-coordination-sidecars/source-proposed-amendment-A3.md),
SHA-256 `a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695`) is a **proposal**:
cite it as design baseline only, never as ratified FK authority.

Read-only over all sources except the two Allowed Files. No credential value may be read,
emitted, hashed, or retained. No git commit/push/merge, no network request, no provider
spend, no host change. Use the current frozen frontmatter schema including
`verification_class`; this parcel introduces no schema field, executable, test, collector,
or dependency.

## Acceptance Criteria

- [ ] **AC1 — Ownership map.** Every ownership claim relevant to HCS is listed with source
  and verdict: the FK owner-of-record and its unreconciled handoff (reconciliation row 16),
  the FK branch/worktree family and which are active loci, the HCS claim of 2026-09-26, and
  the owners of each contested surface (`routing-policy/`, `dispatch/`, `contracts/`,
  `templates/`, `foreman-kernel/`). Unresolved ownership is recorded as
  `escalated-unresolved` or `blocked`, never assumed closed.
- [ ] **AC2 — Kernel-contract map.** Every FK contract HCS builds on is named with its FK
  owner parcel and status (`live` / `Gate-3-pending` / `unstarted`): the registry's
  constraint classes and operation authority matrix, D1–D20, INF-1–INF-8, and the
  FK-P1/P2/P9–P13/P15/P18/P21 seams referenced by Stage Zero §4.
- [ ] **AC3 — State-authority map.** Git canon versus SQLite operational state (FK D2),
  lease/transition ownership (FK-P9/FK-P10), evidence-derived human-gate state (FK D9), and
  projection authority (FK-P11) are mapped with the HCS consequence of each: what the
  scheduler may freeze as input, what a roll-up may reference, and what fails closed.
- [ ] **AC4 — Queue-mechanics map.** Current coordinator queue mechanics (goal pickup
  directives, parcel-loop stages, where a coordinator turn is consumed) versus the A3 D24
  target (a scheduler that advances its coordinator's queue without consuming the
  coordinator's turn) are mapped side by side, with a named gap list. No target property may
  be described as already present.
- [ ] **AC5 — Serialization-point inventory.** Every active serialization point is listed
  with owner and collision rule: SQLite ledger single-writer, Git canon writes, projection
  writes, worktree/branch identity, goal worktree creation, loop-directive state lines, the
  specs directory, and the contested surfaces of AC1. Each row states the fail-closed
  behavior on collision (refuse/wait/escalate), citing the FK rule where one exists.
- [ ] **AC6 — Exact landing target for A3.** Each A3 section (A3.1–A3.8) receives a verified
  anchor in the *live* FK charter (re-anchored per Stage Zero §3.3 row 4 — the ratification
  ledger is §17 in live numbering), a per-section disposition
  (`transcribe-after-safe-sequence` / `hold` / `re-anchor`), and the named preconditions
  (FK owner-of-record handoff, FK Gate-3 merge, pre-transcription decision-row re-sweep,
  FK-owner scoped Gate-1 disposition). No FK file is edited.
- [ ] **AC7 — Evidence discipline.** Every factual claim carries source path, locator,
  acquisition digest or commit, observation time, and a repeatable command with its raw
  output. Dated observations, measured facts, and inferences are labeled distinctly. Each
  Stage Zero §3.3 stale-assumption row is either re-verified here or explicitly deferred
  with a reason.
- [ ] **AC8 — Independent verification.** The verification record carries exact commands,
  tool versions, exit codes, raw output, artifact digests, before/after repo status, an
  allowed-path audit, AC-by-AC evidence mapping, and remaining holds, plus **two** fresh
  frontier adversarial reviews (risk `critical`, routing class `architecture/risk`), one of
  them security-focused on evidence leakage and source safety. Coordinator acceptance, not
  the builder's claim, releases the gate.

## Out of Scope

Implementing any HCS coordination component (HCS-P1+ contracts, delegation/edge lifecycle,
scheduler or adjudicator sidecars, roll-up resolver, proofs, adoption); editing any
`foreman-kernel/` file (charter, `fk-*.md`, `ADR-001-*`, dispatch plan, branch-only
material); transcribing A3 into FK canon; deciding the FK-P10 lease question, sidecar
topology, scheduler ordering keys, capacity allocation, adjudicator pool policy, or the
physical evidence index; editing `routing-policy/`, `dispatch/`, `contracts/`,
`templates/`, plugin source, schemas, tests, hooks, receipts, or kickstarters; editing
other goals' files or other specs; touching host settings, credentials, or credential
stores even as reads; committing, pushing, merging, dispatching builders, creating worktrees,
or requesting Gate 2.

## Context & References

- [Charter](../../goals/hierarchical-coordination-sidecars/charter.md)
- [Stage Zero record](../../goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md)
- [Gate 1 record](../../goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md)
- [A3 proposal](../../goals/hierarchical-coordination-sidecars/source-proposed-amendment-A3.md)
- [Loop directive](../../goals/hierarchical-coordination-sidecars/loop-directive.md)
- [FK live-owner reconciliation](../../goals/foreman-kernel/fk-reconciliation-2026-09-26.md)
- [FK-P0 registry](../../goals/foreman-kernel/fk-p0-canon-authority-enforcement-registry.md)
- [FK charter](../../goals/foreman-kernel/charter.md)
- [FK dispatch plan](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md)
- [Spec convention](../../SPEC-CONVENTION.md)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)
- [RCM-P0 recon precedent](../done/RCM-P0-current-instance-recon.md)

## Allowed Files

The builder may create or edit **only** these two evidence artifacts:

- `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`
- `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-p0-verification.md`

These are documentation records, not executable contracts. Existing artifacts are not
overwritten without coordinator disposition; a new evidence version requires an exact-path
amendment. **This spec file is not in the builder's Allowed Files.** During the 2026-09-26
shaping wave the only authorized outputs were this spec plus the wave's named records
(`hcs-stage-zero-2026-09-26.md`, `gate-1-ratification-2026-09-26.md`, and the
`loop-directive.md` claim/state update); neither evidence artifact is created at shaping
time.

**F1 disposition — exact-path exception (recorded here verbatim on coordinator direction,
2026-09-26):**

> F1 disposition — coordinator decision 2026-09-26 under owner blanket authority: the
> `loop-directive.md` state-line update performed by the P0 slice is RATIFIED as an
> exact-path exception to the HCS-P0 spec's Forbidden Files. Basis: (a) the owner's
> dispatch directive explicitly instructed the state-line update ('Update
> loop-directive.md state line'), (b) the standing repo convention (docs/goals/INDEX.md
> update rule) requires loop state to stay current on every stop/closure, so the spec's
> blanket ban on loop-directive.md was over-strict. Ratified scope is EXACTLY the
> state-line/claim-block maintenance, nothing else. Record this disposition in the spec's
> Allowed Files note and in the verification record §4. No other out-of-Allowed-Files
> write is permitted.

This exact-path exception narrows the Forbidden Files entry for
`…/hierarchical-coordination-sidecars/loop-directive.md` to permit state-line/claim-block
maintenance only; the entry stands for every other write and every other path.

## Forbidden Files and Effects

Every path outside Allowed Files is a forbidden write. Specifically forbidden: all of
`plugins/foreman-line/docs/goals/foreman-kernel/` and every FK branch/worktree; the goal's
`charter.md`, `source-proposed-amendment-A3.md`, `gate-1-ratification-2026-09-26.md`,
`hcs-stage-zero-2026-09-26.md`, and `loop-directive.md`;
`plugins/foreman-line/docs/SPEC-CONVENTION.md`; `plugins/foreman-line/docs/goals/INDEX.md`;
`routing-policy/`, `dispatch/`, `contracts/`, `templates/`, `foreman-config/`,
`permission-profiles/`, `spec-linter/`, and all plugin source, schemas, tests, manifests,
locks, hooks, receipts, and other parcel specs. Forbidden reads: credential stores, auth
files, host `settings.json`, `models-store.json`, secret-bearing URLs. Forbidden effects:
git commit/push/merge/branch operations, worktree creation, builder/reviewer dispatch,
network calls, provider spend, and any external mutation.

## Evidence Procedure and Artifacts

Proceed sequentially: pin sources at named revisions (record digest or commit before
reading); collect the six maps (AC1–AC6) into the map record using one table per map, one
row per item, with verdict vocabulary `live` / `Gate-3-pending` / `unstarted` /
`blocked` / `escalated-unresolved` / `not-verified`; re-verify the Stage Zero §3.3 rows;
then write the verification record. The map's landing-target table (AC6) must quote each
verified anchor at its measured line/section and record the measurement command.

The map record is the single seam reference HCS-P1–HCS-P7 cite; the verification record is
what an independent reviewer re-runs. Neither may contain a claim whose evidence lives only
in this spec's prose.

## Dependencies, Consumers, and Collision Risk

HCS-P0 depends only on the Stage Zero record, the FK records, and the goal's canon — not on
unfinished FK code. HCS-P1 consumes the map as its seam reference (contracts version against
FK-P1's seam and the §3.2 lease disposition); HCS-P2/P3 consume the state-authority and
serialization maps; HCS-P6 consumes the collision rows; HCS-P7 consumes the landing-target
table. No consumer may treat the map as an FK authority change or as a merge receipt.

Collision risk: the human FK Gate-3 merge may change `authority-registry/` and the FK
charter while this parcel runs — re-check those sources at verification time and stop on
divergence beyond the Stage Zero §3.3 deltas (merged package wins per the FK registry seam
rule). Sibling goals own the contested surfaces; observe and record, never co-edit.

## Security Gate and Stop Conditions

Risk `critical` / `architecture/risk` requires the two fresh frontier adversarial reviews of
AC8 before coordinator acceptance. Stop affected collection and record a named refusal on:
any credential or secret encountered; an ownership ambiguity (another live owner on a
required surface); A3 anchor drift beyond the recorded §3.3 deltas; a decision-ID collision
at the pre-transcription re-sweep; any situation where correctness would require an FK or
out-of-Allowed-Files write (escalate instead); a missing or divergent source at verification
time; or any request to treat dated observations (e.g. "FK-P0 at Gate 3") as current state.
A documented blocked result is not a clean pass. Charter stop conditions apply verbatim.

## Verification Plan

Run from the repository root; capture every command with its raw output and exit code in
`hcs-p0-verification.md`.

```powershell
git rev-parse HEAD
git status --porcelain
# digest pin check (A3) and source-pin checks per the map's source table
# decision-row re-sweep and section-anchor measurement over the live FK charter
# allowed-path audit: confirm writes only to the two Allowed Files
```

**Mandated reviewer focus questions** (assess each field-by-field):

1. Does the landing-target table (AC6) survive the FK charter's 435-line → 808-line drift,
   or does any row quote A3's 2026-09-03 anchors as if they were current?
2. Does any seam row silently assume the R31 `authority-registry/` package or the FK-P10
   lease engine is merged and live?
3. Is every map row's verdict backed by a re-measured source, and are dated observations,
   measured facts, and inferences labeled distinctly enough that none can be mistaken for
   another?
4. Could any wording in the map or verification record be read as authorizing an FK edit,
   a merge, or the FK-P10 lease decision?
5. Does the queue-mechanics map (AC4) avoid presenting the A3 D24 target properties as
   already achieved?
