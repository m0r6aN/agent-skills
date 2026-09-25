# PMC-P0 adversarial review A (general) — findings

**Verdict:** CHANGES REQUESTED → resolved by rework (see loop-directive triage).
**Date:** 2026-09-25. Fresh frontier session, read-only, zero builder context.
**Reviewed:** spec `133a7690…72eb` + charter + Amendments 01–04 + the four evidence artifacts.

## Reproduced by the reviewer (independent)

- Export digests: all three match the pins. Spec `133a7690…72eb`.
- AC2a: 12 literal resolutions, binding 7 = 0 matches (id only under `opencode-go`/`qwen-token-plan`) → `AC2A_ZERO_MATCH` correct.
- AC2b: bindings 1 and 10 = 0 (expected, non-authoritative). Enablement 0 of 15.
- 608 model records, 0 duplicate provider+id identities; catalogue-internal joins literal.
- Scope: only the four Allowed Files new; no tracked diff; spec unchanged, `status: active`.

## Findings

| # | Severity | Section | Finding | Disposition |
|---|---|---|---|---|
| 1 | MAJOR | rubric §4/§2 | Tie-break ordering: "equal on all ordering keys" contradicted L5 "cheapest by R5"; the per-lane provider rule's position (filter-before vs tie-break-after) unstated, weakening A3 independence. | FIX (rework R1) — rubric now encodes A3: pin=L1/L2 partition, L5=R5-dominant, L4=declared preference; contradiction removed. |
| 2 | MINOR | rubric §6 | Prose claimed R6/R7/tool-use are not provider-call inputs, contradicting the table. | FIX (rework R2) + coordinator ruling F-C (AC6 route-to-A6 governs, not a stop). |
| 3 | MINOR | rubric §7 / V§8 | "wrong provider" folded into `AC2A_ZERO_MATCH`; PMC-P1 loses the distinct name. | FIX (rework R3) — distinct refusal-name vocabulary added. |
| 4 | MINOR | rubric §4 / role map L3 | A3 declared-preference wording names standard lanes; applying to L3 unlabelled. | FIX (rework R4) — L3 labelled EXTENSION of A3. |
| 5 | MINOR | baseline §2.1 / V§4,V§8 | Missed vendor-prefixed `openrouter/qwen/qwen3.8-flash`; no negative case for alias-by-prefix-stripping. | CONFIRMED on disk. FIX (rework R5) — observation + N13/N14. |
| 6 | INFO | role map §3 C5 | Loose "L1 primary / L2 primary (2, 9)". | accept-as-documented (§2 table correct; reworded in rework). |
| 7 | INFO | baseline §6/§3 | `pi-openrouter.ts` enables 11,13,14 while settings enable none. | accept-as-documented (PMC-P2 input). |
| 8 | INFO | rubric §5 | Termination bullet overstated. | accept-as-documented (reworded in rework). |
| 9 | INFO | V§9/F-B | Verification record not self-hashed; spec pwsh block not verbatim. | accept-as-documented (disclosed; regenerated post-rework). |
