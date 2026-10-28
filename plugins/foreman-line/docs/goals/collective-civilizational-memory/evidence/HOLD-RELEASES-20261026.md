# GenSpark hold releases — 2026-10-26 (append-only)

Authority: Clint (owner), human-typed message pt20u, 2026-10-26 ~15:50 EDT

> Ratify and raise the cap to $300. I'm not sure what holds exist against genspark credits, but those sessions are most certainly dead, so we can reclaim their holds.

Balance refresh (read-only GET /me): **9046.5** at 2026-10-26 16:09 EDT.

| id | owner | held | released | retained | liveness / note |
|---|---|---|---|---|---|
| REL-1 | CCM coordinator Pi 01a173be-ccaf-704b-9f61-858f7a129595 | 7225.524 | 7130.924 | 94.6 | STOPPED per p3c3-stop-report-20261025.md; last goal-dir write 2026-10-25 11:56 EDT; Pi session file last write 2026-10-25 11:57 EDT; no process found 2026-10-26 |
| REL-2 | CCM P3C2 phase (same coordinator) | 699.5 | 699.5 | 0 | P3C2 accepted/Stage F closed; admission expired 2026-10-26T04:00Z; coordinator dead (above) |
| REL-3 | GenSpark readiness lane, Codex 01a17394-ee93-7061-9cb3-0c0d3c1ad843 | 3.757875 | 3.757875 | 0 | CLOSED_NO_MORE_INFERENCE 2026-10-25; rollout last write 2026-10-25 21:54 EDT; no process |
| REL-4 | genspark-engineering-offload router, Codex 01a15bae-8750-7331-9529-e5d6db453d30 | 138.8 | 138.8 | 0 | rollout archived (archived_sessions, last write 2026-10-24 07:20 EDT); automation 'genspark-engineering-offload' absent from ~/.codex/automations; heartbeat notLoaded; no process |
| KEEP-1 | genspark-offload router | 5 | 0 | 5 |  |
| MIRROR-1 | genspark-offload router | 2522.3745 | 0 | 0 | Mirror of other owners' (CCM) holds, superseded by CCM REL-1 accounting; not counted separately to avoid double release |
| MIRROR-2 | KEO-238 custody anchor observation |  |  |  | Observations of CCM P2C holds, included in REL-1; not separately released. File belongs to live KEO-238 lane, untouched. |
| FORECAST-1 | Pi 9a75528d pi-successor |  |  |  | Route reforecast 11320 was a forecast, not a reserve; session dir last write 2026-10-24 18:13 EDT; no session file/process. Nothing to release. |
| UNTOUCHED-1 | KEO-238 live coordinator Codex 01a1752d-330b-74b1-ae16-b36394c289aa |  | 0 |  | Live owner (rollout write 2026-10-26 07:36 EDT). Not touched per instruction; 75 stays UNKNOWN (balance does not resolve it). |
| POLICY |  |  |  | 1000 | 1,000-credit protected floor is policy, kept. |

**Total released: 7972.981875 credits.** Unknowns kept as unknown: CCM 94.6, router 5, KEO-238 75 (live owner, untouched). Floor 1,000 kept.
Free headroom estimate: 7646.9 (9046.5 - floor 1000 - unknown 94.6 - 5 - KEO-238 untouched 300 (conservative)).

No history deleted; no billing settlement claimed; holds are local accounting (no provider call made except the read-only balance GET).
Full record: HOLD-RELEASE-20261026.json