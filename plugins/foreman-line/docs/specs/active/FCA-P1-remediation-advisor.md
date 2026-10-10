---
ticket: FCA-P1
title: Remediation advisor for blockers and hung parcels (additive)
status: active
owner: clinton.morgan
created: 2026-10-09
updated: 2026-10-09
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/src/remedy.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/ui/app.js
routing_class: standard-feature
verification_class: deterministic
permission_profile: builder-standard
data_classification: internal
---

# FCA-P1 — Remediation advisor for blockers and hung parcels

## 1. Purpose

The console shows *what* needs attention but not *what to do about it*. For
every blocker it should ask the operator the triage QUESTION and present
answer-branch RECOMMENDATIONS with copy-pasteable commands — "how do I un-hang
this?" answered per cause.

## 2. Owner directive (2026-10-09)

**Preserve and complete the existing work if it is valuable.** Every branch
list is ordered: salvage/resume/complete-in-place first, close-or-re-dispatch
fresh LAST (explicitly labeled the last resort). No recommendation leads with
discarding work.

## 3. Additive surface (the ONLY changes)

| Surface | Change | Frozen constraint honored |
|---|---|---|
| `src/remedy.ts` | pure advisor: `remediesFor(config, projection) → Remedy[]` | no writes, no authority, no stored status |
| `/api/alerts` response | gains sibling field `remedies` (`goal`, `parcel`, `cause`, `question`, `options[{answer, recommendation, commands}]`) | route table unchanged (X1) |
| UI | "How to unblock" cards in Alerts + per-parcel next steps in the detail pane | presentation only |

Commands are grounded in real verbs: read-only `receipts validate`, the
present-mode gate verbs `approval approve/reject`, `gh pr merge` for the human
merge gate, `$EDITOR <goal record>` for record updates, and the frozen
`hung-threshold: Nh` heartbeat override for intentional pauses. The console
never executes any of them (charter D2/D4; present-mode remains the rule).

## 4. Cause → question matrix

| Derived cause | Lead question | First recommendation (preserve-first) | Last |
|---|---|---|---|
| hung, worktree gone | What does the existing work need to keep going? | recover branch/PR/session, finish in place | close/defer with disposition |
| hung, worktree stale | idem | resume the existing builder in its worktree | idem |
| failed `chain-invalid` | Is the work intact and only the record broken? | validate, re-emit the broken stage from real evidence (never forge) | re-dispatch fresh |
| failed `red-review` | Can the findings be fixed in the current work? | bounded rework with the same builder | re-dispatch with findings as constraints |
| failed `tripwire` | Is the test-count change legitimate? | ratified amendment + deterministic pass | stop and route to the owner |
| failed `closure-drift` | Did the repo move under a closed parcel? | re-verify on fresh main | file a follow-up debt item |
| awaiting-gate G1/G2/G3 | Is the gate's decision ready? | ratify / grant dispatch / human merge | hold with a state-line note |
| goal ratification pending | Should this goal proceed at all? | ratify the charter | park the goal honestly |

## 5. Acceptance criteria

- AC1: every hung/failed/awaiting-gate parcel and every pending goal
  ratification yields exactly one remedy with a question and ≥2 branches.
- AC2: branch lists are preserve-and-complete first; the final option is the
  only close/re-dispatch option (unit-enforced ordering).
- AC3: commands are copy-pasteable strings only; the advisor is pure (no
  writes, no spawns) and the console executes nothing it presents.
- AC4: complete/running parcels yield no remedies.

## 6. Verification

`ops-console`: `npm test` (92/92 incl. `tests/remedy.test.ts`),
`npm run typecheck`, `npm run lint` — green 2026-10-09.
