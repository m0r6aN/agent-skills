# Adversarial Review Brief — PRAC-P0 round 2 (rework confirmation)

Round 1 returned REQUEST CHANGES; every finding was triaged FIX. Re-review the reworked
artifacts and confirm each prior finding is actually resolved, and that no new defect was
introduced.

## Reworked artifacts (in this repo)

- Memo: `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/compat-memo.md`
- Triage of round 1: `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/prac-p0-review-triage.md`
- Negative control: `probe/negative-control.mjs` (now snapshot-backed); evidence:
  `evidence/pi-0.87.1/{snapshot.json,probe-output.txt,negative-control.txt,directive-excerpt.md}`
- Spec (contract): `plugins/foreman-line/docs/specs/active/PRAC-P0-pi-extension-hook-surface-compat.md`
- Charter (D1–D11 + exit criterion):
  `plugins/foreman-line/docs/goals/pi-routing-adapter-compat/charter.md`

## Prior findings to confirm fixed

1. [major] §4.2 "Key consequence" unbounded "does not exist" + "capability as" mapping.
2. [major] Governance omitted `routing-policy` and restated D7/D8.
3. [major] Negative control never read `snapshot.json`; `no ` regex exempted the design scan.
4. [major] §4.3 0.86.1 claim unsourced.
5–11. [minor] event-name search coverage, examples/RPC counts, host-dir caveat, hash fix,
   probe command field, PowerShell reproduction, scope/pathspec.

## Verified observations (coordinator, re-check, do not trust)

- `node probe/check-api-surface.mjs` exit 0, `versionMatch: true`, 329 files.
- `node probe/negative-control.mjs` exit 0.

## Output contract

Deliver EXACTLY: "REVIEW VERDICT" (APPROVE / APPROVE WITH NITS / REQUEST CHANGES), then
"CONFIRMATION" listing each prior item 1–11 as RESOLVED / NOT RESOLVED with one line, then
"NEW FINDINGS" (if any) numbered and severity-tagged. Max 300 words. Plain text only. Write
your final answer to `claude-review2-out.txt` in this directory.
