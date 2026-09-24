# PRAC-P0 — Adversarial Review Triage (round 1)

**Reviewer:** fresh Claude CLI (frontier), read-only. **Verdict:** REQUEST CHANGES.
**Evidence:** `plan-review/claude-review-out.txt`, `plan-review/reviewer-brief-prac-p0.md`.

## Triage

| # | Finding (sev) | Triage | Action taken |
|---|---|---|---|
| 1 | §4.2 "Key consequence" is unbounded absence + "exposes the capability as" intent mapping (major) | FIX | Rewrote: bounded to "absent from the enumerated 0.87.1 surface"; removed the capability/intent mapping sentence. |
| 2 | Governance omits `routing-policy` and restates D7/D8 in parentheses (major) | FIX | Added `routing-policy/`; removed the parenthetical paraphrase; governance is now pure pointer. |
| 3 | Negative control weak: never reads `snapshot.json`, `no ` regex exempts the design scan (major) | FIX | Rewrote `negative-control.mjs`: reads `snapshot.json`, matches memo dispositions to recorded counts, checks unbounded "does not exist", checks `routing-policy`, tightened design-token negation rules. |
| 4 | §4.3 0.86.1 claim unsourced (major) | FIX | Re-labelled as a dated shaping observation (pointing to `plan-review/own-out.txt` + charter drift note), not a re-verifiable claim; charter baseline item 3 corrected to 0.86.1-epoch/superseded. |
| 5 | `AgentBeforeSettleEvent` / `AfterProviderResponseEvent` named but not searched (minor) | FIX | Added both to the probe `ACTUAL_NAMES`; re-ran (shippedTypes 14 and 5 respectively). |
| 6 | Examples counts + `rpc-client.d.ts` signatures omitted (minor) | FIX | Added occurrence-detail paragraph to §4.2. |
| 7 | Host-dir existence claim not probe-backed (minor) | FIX | Added "coordinator observation of the host, not probe-backed" caveat. |
| 8 | §6 truncated hash `…303cf36` wrong (minor) | FIX | Full correct hash written; reproduction switched to `Get-FileHash`. |
| 9 | Probe command not recorded in snapshot (minor) | FIX | Added `command` field; re-ran. |
| 10 | PowerShell + `node -v` + `Get-FileHash` (minor) | FIX | §6 reproduction rewritten accordingly. |
| 11 | Scope: scratch files + PMC-P0 spec dirty; merge needs explicit pathspec (minor) | FIX | Scratch `.pid`/`.log` files removed; commit is pathspec-scoped to the goal dir + spec + INDEX. |
| 12 | `updateModel` explanation correct (minor) | Informational | Kept as written. |

## Rework verification

- `node probe/check-api-surface.mjs` — exit 0, `versionMatch: true`, 329 files.
- `node probe/negative-control.mjs` — exit 0 (strengthened, snapshot-backed).

## Round 2

**Reviewer:** fresh Claude CLI (frontier), read-only. **Verdict:** APPROVE WITH NITS.
**Evidence:** `plan-review/claude-review2-out.txt`, `plan-review/reviewer-brief2-prac-p0.md`.

Round-1 items **1–10 RESOLVED**; **11** not-yet: the commit pathspec must be the goal dir only
(after scratch removal), never PMC-P0 or other coordinators' files. New nits, all FIX:

1. Probe `outDir` used `process.cwd()` — anchored to `import.meta.url` so the evidence path is
   cwd-independent.
2. Negative control was global-substring, not per-row — now checks each proposal-API
   disposition row and every §4.2 present row carries the not-an-authorization flag; snapshot
   read and `apiSearch` lookups are guarded (no TypeError on missing entries).
3. Missing `snapshot.json` previously threw — now prints a FAIL line and exits non-zero.

Deterministic pass re-run (coordinator machine): probe exit 0 (`versionMatch: true`, 329
files), negative control exit 0. The reviewer could not execute node in its sandbox, so the
exit-0 claims rest on the recorded `snapshot.json` + `negative-control.txt` — which is the
closure evidence.
