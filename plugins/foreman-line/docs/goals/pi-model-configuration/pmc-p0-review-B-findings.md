# PMC-P0 adversarial review B (acquisition & leakage) — findings

**Verdict:** ACCEPT (no blocker; two LOW wording items → fixed in rework).
**Date:** 2026-09-25. Fresh frontier session, read-only, zero builder context.
**Focus:** evidence acquisition boundary and leakage risk.

## Reproduced by the reviewer (independent, read-only)

- Export digests recomputed with `sha256sum`: catalog `b0c2dc8c…bb171fe`, settings `1024154d…ed137d1e`, manifest `aa9b03fa…1df692c3` — all match spec pins and the manifest's own `sha256`. Spec `133a7690…72eb`. Export has one commit, no working-tree/ignored changes.
- Hostile-input scan (in-memory Node): key set is exactly the allowlisted fields + structural keys — no `headers`, `apiKey`, `compat`, auth/credential keys; all 16 `baseUrl` values parse cleanly (no userinfo/password/query/fragment); nothing matched credential patterns; `checkedAt` absent (matches `sourceCheckedAt: {}`).
- AC2a re-resolution: 12 + binding 7 `AC2A_ZERO_MATCH`; AC2b 0/0. Every capability field matches.
- No credential-bearing string (`apiKey`, `Bearer`, `pi-agent/`, `models-store`, home paths) in any artifact.

## Findings

| # | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| 1 | pass | all four | Acquisition boundary holds; only the three export files + read-only repo files cited. | — |
| 2 | pass | baseline/rubric | No claim upgraded into live availability; owner-attested/refused bindings correctly `unknown`; freshness not accepted; R6/R7 → A6. | — |
| 3 | pass | verification | No provider calls/probes/spend (N1–N12 in-memory; catalogue digest re-checked unchanged). | — |
| 4 | pass | baseline | SCF-1/2/3 and binding 7 recorded as findings/holds, not availability conclusions. | — |
| 5 | LOW | baseline §2.1 | "records a real catalogue gap" read as flat absence claim. | FIX (rework B5) — scoped to "frozen, freshness-unaccepted export". |
| 6 | LOW | rubric §6 R6 | "reachability/enablement only live" — enablement is static (AC4 0 of 15). | FIX (rework B6) — "enablement" removed from live-only. |
| 7 | INFO | manifest `sourceStability` | Pinned digests cover the sanitized projection, not source bytes. | accept-as-documented. |
| 8 | INFO | V§0,V§13 F-B | Blocked-command flags are honest refusals (reviewer hit the same). | accept-as-documented. |
| 9 | INFO | harness | "connector down" notices show no reach outside the boundary. | accept-as-documented. |
