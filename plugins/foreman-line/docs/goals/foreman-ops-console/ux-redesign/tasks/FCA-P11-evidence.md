# FCA-P11 verification evidence

Date: 2026-10-13

## Option mapping / pinning

The `(discrepancy code, option index) -> act` table is in `ops-console/src/reconcile.ts` (`OPTION_ACTS`). The test `the closed discrepancy vocabulary has a deliberate act (including null) for every option index` enumerates the vocabulary/options and passed as part of the suite.

## AC8 scratch and real-browser checks

Not completed in this run. No scratch-console run against the specified 2026-10-13 backlog or Chromium/CDP real-browser check was performed. Therefore the required counts/behavior at 1366px and 320px remain unverified; do not interpret the passing UI tests as evidence for those manual checks.

## Verification

From `plugins/foreman-line/ops-console/`:

- `npm test` — PASS, 594 tests, 0 failures (before the final refusal-union/format-only correction).
- `npm run typecheck` — PASS after adding `invalid-extra-text` to `SpawnRefusalReason`.
- `npm run lint` — PASS, Biome checked 100 files with no warnings/errors.

The final correction is a type-union entry and formatting only; the test suite was not rerun after it. AC8 manual verification remains outstanding.
