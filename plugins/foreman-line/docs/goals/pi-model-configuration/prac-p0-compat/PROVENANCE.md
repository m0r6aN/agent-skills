# PRAC-P0 payload — provenance

**Extracted:** 2026-09-26 per coordinator verdict (see `../../goal-status-report-2026-09-26.md`).

**Source:** `pi-routing-adapter-compat/` goal (state `prac_p0_shipped` — memo + probe + evidence
delivered 2026-09-24, two-round adversarial review APPROVE WITH NITS resolved, merge `b1d3e39`,
exit criterion met). The goal directory was deleted 2026-09-26 as a complete/duplicate record;
its charter, loop directive, and review provenance remain recoverable in git history.

## Contents

- `compat-memo.md` — the fact-finding compatibility memo for Pi 0.87.1 frontmatter-driven model
  routing. Strictly extension/hook-SDK surface: **zero routing authority, zero host write**.
  This is the artifact consumed by PMC-P2/P3 by pointer.
- `probe/` — `check-api-surface.mjs`, `check-api-surface.negative-test.mjs`, `negative-control.mjs`.
- `evidence/pi-0.87.1/` — captured API-surface evidence for the pinned runtime.

## Consumers

- `pi-model-configuration` PMC-P2/P3 (this goal) — by pointer.
- `hybrid-routing-optimization` (HRO) Pi-adapter work — its charter links here.

Recheck the installed Pi runtime before relying on any API described in these files; the memo is
evidence pinned to Pi 0.87.1, not a standing contract.
