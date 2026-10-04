# Foreman Ops Console — Plan-Level Adversarial Review Findings & Triage

**Review date:** 2026-09-16
**Reviewed baseline:** Gate-1-ratified charter (D1–D8, OQ1–OQ5 decided) + loop directive
**Reviewer:** fresh session, zero coordinator context beyond charter and repo canon
**Mode:** passive, read-only
**Verdict:** `REQUEST CHANGES — no scoped Gate-1 reopen` (Gate 1 stays ratified; no locked decision changed)

## Triage

| ID | Sev | Finding (one line) | Disposition |
|---|---|---|---|
| R1 | High | Ratification record contradicts the ratification (stale PROPOSED/ABSENT sections) | **Fix — reconciled in charter + loop-directive on this branch** (headers, ratification record, D-entry status, loop state). Editorial only. |
| A1 | High | Invoking human-gate CLIs causes effects the console by design does not receipt | **Accepted as FOC-P0 shaping constraint:** FOC-P0 contract must own an invocation audit log; "records nothing itself" must not mean "leaves no trace". |
| A2 | Med | Exit-criterion carve-out permits transitive goal-dir writes via invoked flows | **Accepted as FOC-P0 shaping constraint:** enumerate exactly which invoked flows write where, or name transitive writes in the stop condition. |
| C1 | Med | FOC-P2 bundles API + UI + container/ops in one single-review parcel | **Accepted as FOC-P0 shaping constraint:** split P2 or record why the bundle is safe; name the transcript/log-viewer input. |
| M1 | High | No parcel owns the CLI-invocation safety boundary (allowlist, arg rules, audit) | **Accepted as FOC-P0 shaping constraint:** assign ownership (micro-parcel or named FOC-P0 contract section with P3 acceptance gate). |
| D-LOAD | High | D3 liveness signal (live builder session) is not disk truth in cited canon | **Accepted as FOC-P0 shaping constraint:** P0 must prove the liveness signal exists on disk or D3 precedence collapses. Runners-up D6 (localhost-no-auth threat model) and D1 (copy-reuse drift owner) noted for shaping. |
| X1 | Med | FOC-P2 × FOC-P3 collide on routes, shell, notification-store schema | **Accepted as FOC-P0 shaping constraint:** FOC-P0 contract names seam owners; sequential default stands. |
| T1 | Med | FOC-P1 (projection authority) under-routed vs its consumers | **Accepted as FOC-P0 shaping constraint:** justify single review or up-route P1 at shaping. |
| F1 | Med | OQ5 proxy inputs asserted, not evidenced (merge commits, state lines) | **Accepted as FOC-P0 shaping constraint:** P0 inventories each proxy artifact's existence, path, parseability. |
| S1 | Low | FOC-P4's "one real goal" unnamed | **Accepted as FOC-P0 shaping constraint:** name the target goal at FOC-P0 shaping (live artifact per lesson #33, not fixtures). |
| OQ | Info | OQ1–OQ4 rulings faithfully recorded | No action. |

## Gate effect

None. No locked decision changed; re-ratification not required (COORDINATOR-PATTERN: re-ratify only if decisions changed). FOC-P0 shaping starts next, carrying the accepted constraints above.
