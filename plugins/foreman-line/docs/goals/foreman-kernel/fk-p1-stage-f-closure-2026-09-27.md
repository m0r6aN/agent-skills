# FK-P1 Stage F closure — 2026-09-27

**Parcel:** FK-P1 — Lifecycle, admission, and decision contracts
**Outcome:** DELIVERED AND MERGED.

## Merge record (Gate 3, delegated — RS-2.1, ledger L7)

- Merge commit: **`fed2298`** — "Merge FK-P1 kernel-contracts package into live tree (Gate 3, delegated, RS-2.1)" on `reconcile/refresh-actions`.
- Parcel branch `codex/fk-p1-lifecycle-admission-decision-contracts` @ `c12096c7` (three commits: `6631ce8f` build, `86069eb7` rework R2, `c12096c7` bounded R3); package byte-identical between `c12096c7` and the merged tree (verified `git diff` empty).
- Delegation conditions met: full verification chain green (every step exit 0); any red step would have voided it — none occurred at merge time.

## Verification chain evidence

| Step | Result |
|---|---|
| Builder chain (build R1) | all exit 0; 139/139 tests |
| Builder chain (rework R2) | all exit 0; 151/151 tests (+12 named, failing-when-broken) |
| Bounded R3 (F4 fix) | 151/151; mut10 proof (neutralized compare → exactly the named test fails) |
| **Coordinator acceptance chain (clean Node lane, `c12096c7`)** | node v24.7.0; npm ci exit 0; typecheck exit 0; generate ×2 byte-idempotent (schema-set digest `97190f2ffb564f2b` both runs); npm test exit 0; lint exit 0; worktree clean |
| Post-merge smoke (integration tree) | npm ci + npm test exit 0 + typecheck exit 0 + lint clean |

## Independent review trail

| Session | Round | Verdict |
|---|---|---|
| Lens 1 trust (FkP1Review1Trust) | 1 | REQUEST CHANGES — F1 blocker (registry binding on live envelopes), F2/F3 should-fix |
| Lens 2 canonical (FkP1Review2Canonical) | 1 | APPROVE — L2-1/L2-2 info |
| R2 rework closure (both lenses) | 2 | F1/F2/F3 CLOSED (P1–P5 fail closed; 28-row sweeps zero widening; layer matrix zero disagreement); L2-1 CLOSED (upstream-bound mutations M1/M2/M4); L2-2 closed as ruled |
| Bounded R3 closure (FkP1R2CloseTrust) | 3 | F4 CLOSED (mut10 caught exactly; diff 1+/1−; suite green) |

## Contract-final amendments during the parcel (all pre-merge)

F05 field tables (3 review sessions, 2 rework rounds); Step-0 rulings F1–F4 (`d35189e`, incl. the F3 `INVALID_REQUEST` binding-failure mapping and F4 activation record); dual-review L2-2 `goalRevision` scope clarification. Operative contract: spec SHA `a50fec2d…` + those amendments; spec moved to `docs/specs/done/` at Stage F.

## Lessons with dispositions

1. **Test-selector vacuity (F4):** a "failing-when-broken" test whose selector routes the mutation to the wrong base case is vacuous — passing proves nothing (standing constraint #11's class). Disposition: caught by reviewer mutation probing before merge; bounded round-3 fixed it; the selector now keys on the case `name`. Carried rule: every named-dimension test must be mutation-probed by review, not just by its author.
2. **Declared tripwires stop the owner, not the coordinator:** the R2 "round 2 of 2" cap fired on F4 and the parcel stopped for owner ruling (authorized bounded round 3). Disposition: recorded in `fk-p1-r2-tripwire-ruling-2026-09-27.md`. The FK-P0 spiral class (coordinator self-overriding) did not repeat.
3. **Long-path worktree creation (Windows):** `plugins/synced/**` deep fixture paths exceed MAX_PATH under the long worktree root; bare `git reset`/`checkout` fail. Disposition: `git -c core.longpaths=true` per-command override (recorded in the builder's kickoff); repo-level config left untouched.

## Deferred/named remainders (not exit claims)

- S1 nit (F05.1 placement prose naming) — accept-as-documented.
- L2-2 `goalRevision` 4-code scoping — accept-as-documented with the clarifying sentence.
- Cross-check obligation: FK-P2's chain must include the read-only F05.5 encoder conformance check against this package's canonical golden fixtures (FK-P2 spec, OQ-3 ruling).

## Gating note (honest accounting)

The spec activation record gated acceptance on "R32 must land before this parcel's verification chain is accepted (RS-2.5)". At merge time, R32's **corpus regeneration** had landed and absorbed FK-P1's canon (validate/sweep green, 1766 items incl. the FK-charter additions), but R32's **independent review** was — and is — still pending, with FK-P0-internal corrections (W2-1/W2-2/W2-3) in flight. The RS-2.5 trust condition was therefore satisfied in substance but not in full form at merge. Recorded rather than papered over: the R32 review is explicitly tasked to scrutinize the corpus entries derived from FK-P1's records/spec, and any finding touching them triggers a post-merge correction. The RS-2.1 merge gate itself (parcel chain fully green) held without exception. **Update:** R32's independent review completed 2026-09-27 with VERDICT CLOSED (all findings closed; the FK-P1 corpus entries were explicitly verified faithful to the live sources; chain 752/752). This note's open thread is closed — no post-merge correction is required.

## Worktree/branch disposition

Worktree `D:/Repos/agent-skills-worktrees/fk-p1-lifecycle-admission-decision-contracts` removed at Stage F (registration cleaned). Branch `codex/fk-p1-lifecycle-admission-decision-contracts` KEPT as merged provenance (referenced by this record and the review trail).
