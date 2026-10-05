# PMC-P0 adversarial review (delta re-review) — findings

**Verdict:** CHANGES REQUESTED (one blocking MINOR) → resolved by rework-2 + rework-3.
**Date:** 2026-09-25. Fresh frontier session, read-only, zero builder context.
**Scope:** the reworked sections (rubric §1/§2/§4–§7; baseline §2.1/§3.2; role map L3/C5/§4; verification §4/§8/§11–§14).

## Reproduced by the reviewer

- Spec `133a7690…72eb`; three export digests match; 608 records, 0 duplicate identities.
- AC2a 12 + binding 7 `AC2A_ZERO_MATCH`; AC2b 0/0; enabled 0 of 15.
- `qwen3.8-flash` records: `opencode-go`, `openrouter/qwen/…`, `qwen-token-plan`.
- Exactly four untracked files; `git diff --name-only HEAD` empty; `git diff --check` clean.
- Artifact digests match V§9 (baseline `32b868cf…`, rubric `21025147…` at that time, role map `2691ea3e…`); verification self-digest round-trip verified.

## Findings

| # | Severity | Section | Finding | Disposition |
|---|---|---|---|---|
| 1 | MINOR (blocking) | rubric §1/§4 | Three A3-derived rules (pin-as-partition, L4 ordered-preference) stated flat as "A3" without a DERIVED label; Q1 cited loosely. | FIX (rework-2) — DERIVED/A3-direct/EXTENSION labels added; Q1 citation corrected. |
| 2 | LOW | rubric §7 | `AC2A_ZERO_MATCH` row "present with each name below" overbroad (MULTI_MATCH/URL_MISMATCH/VARIANT_SUFFIX are non-zero-match). | FIX (rework-2). |
| 3 | LOW | rubric §7 / V§8 | `AC2A_PREFIX_ALIAS_REFUSED` scope (ignores provider) unstated; overlaps WRONG_PROVIDER. | FIX (rework-2) — "Zero-match diagnostic scope" block added. |
| 4 | INFO | V§10 | Stale pre-rework HEAD `deef24b`. | FIX (rework-3) — superseded cross-reference added. |

## Resolution

Rework-2 landed chips 1–4; rework-3 refreshed V§9 (rubric digest `0a3e3b4f…`, self-digest `e6b93bfa…`, raw `f06e0f4b…`, `selfdigest-verify=true`). Coordinator verified all on disk. Negative-case count 14 (N1–N14) unchanged.
