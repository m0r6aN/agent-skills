# Changelog

## Unreleased

- The CI aggregation now captures each package check's complete stdout/stderr and
  re-emits every failing check in a failure section before the summary matrix, so
  the failing assertion is always visible in the job log.
- `verification` scaffold parity (AC-1) now covers the shared toolchain pins only;
  package-specific dev dependencies (dispatch's `@earendil-works/*` Pi runtime
  port) are no longer mirrored into the verification manifest.

## 0.6.10 — 2026-09-19

- Ported explicit repository/plugin roots and caller/config identity injection.
- Added `foreman-config`, contract readers, role authority, worker envelopes,
  mutation-scope enforcement, hooks, and templates.
- Added generated-schema parity coverage for the new contracts.
- Added TypeSafe Jev 1.13 through OpenRouter for fast routing/classification
  decisions only; it remains recommendation-only and cannot approve, merge, or
  bypass policy.
- Allowed Pi to auto-route only within Foreman-approved execution lanes.
- Removed the Fireworks routing and worker-provider path entirely.
