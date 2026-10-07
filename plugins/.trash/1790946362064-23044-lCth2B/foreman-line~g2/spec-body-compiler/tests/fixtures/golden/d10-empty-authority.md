---
ticket: FK-GOLDEN-D10
title: Maximal surfaces with empty Allowed Files compiles to EMPTY authority
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces: [docs/**, plugins/**, skills/**, apps/**, config/**, docs/specs/active/FK-P2-spec-body-compiler.md, plugins/foreman-line/spec-body-compiler/**, plugins/foreman-line/dispatch/**, plugins/foreman-line/mutation-scope-guard/**, plugins/foreman-line/routing-policy/**, plugins/foreman-line/hooks/**, plugins/foreman-line/skill-injection/**, plugins/foreman-line/kernel-contracts/**, skills/using-agent-skills/SKILL.md]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent
GOLDEN-D10-01: the D10 golden negative. Maximal surfaces: plus an empty ## Allowed Files compiles to an EMPTY mutation set that is never silently widened.

## Constraints
surfaces: is never mutation authority (charter D10).

## Acceptance Criteria
Compiles with allowedFiles: [] and authorityState: empty; assertDispatchable refuses with MISSING_AUTHORITY.

## Out of Scope
Any granted authority of any kind in this document.

## Context & References
- docs/SPEC-CONVENTION.md

## Allowed Files
