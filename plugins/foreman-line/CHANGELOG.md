# Changelog

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
