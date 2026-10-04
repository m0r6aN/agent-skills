# Scoped Gate 1 Amendment 03 — Opus 5.5 Availability Correction

**Goal slug:** `pi-model-configuration`  
**Raised:** 2026-09-24 by owner direction  
**Status:** RATIFIED by owner direction 2026-09-24  
**Scope:** supersedes Amendment 02 M1 only

## Correction

The previous coordinator lint relied on a stale host-owner export and concluded
that the Opus 5.5 identities were absent. The owner confirmed the current
catalogues directly:

- OpenCode: `claude-opus-5-5`;
- OpenRouter: `anthropic/claude-opus-5.5`.

These are the canonical identities for the Opus routes. The OpenRouter identity
must be present in `KNOWN_FRONTIER_MODELS`, `routing-policy.yaml`, fixtures, and
route expectations. The OpenCode identity is the Pi provider-local spelling.

## Unchanged controls

Amendment 02 M2–M4, Amendment 01 A1–A8, provider/data controls, fallback
independence rules, and all human gates remain in force. This correction does
not authorize provider credential inspection, a new Anthropic provider, live
model calls, or default-route activation. OpenRouter already serves the
confirmed Anthropic model, so no direct Anthropic provider registration is
needed.

## Evidence standing

The old absence finding remains in `coordinator-lint-pmc-p0.md` as historical
provenance and must not be read as current availability. Live reachability and
quality claims remain subject to the existing `live-availability` and
`model-quality` evidence states.
