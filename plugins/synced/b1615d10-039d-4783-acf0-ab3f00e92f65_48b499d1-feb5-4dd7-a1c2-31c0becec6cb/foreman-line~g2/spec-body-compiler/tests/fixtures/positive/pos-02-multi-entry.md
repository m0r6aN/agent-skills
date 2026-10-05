---
ticket: FK-POS-02
title: Multi-entry with forbidden and frozen surfaces paragraph
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: elevated
surfaces: [plugins/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent
Proves unsorted multi-entry compilation, the OQ-2 corpus-convention negative paragraph, and the Step-0 flag C frozen/forbidden mapping.

## Constraints
Grants are exact non-glob; the path/** form is deny-only.

## Acceptance Criteria
Compiles; allowedFiles sorted by UTF-16 code-unit order; frozen annotation maps to frozenSurfaces; prose commentary items are not entries.

## Out of Scope
Any rewiring of shipped enforcers.

## Context & References
- docs/SPEC-CONVENTION.md

## Allowed Files
- plugins/z/b.ts
- plugins/a/a.ts
- plugins/a/c.ts
**Forbidden surfaces (exact):** `plugins/contested/**` (contested seam; RCM Window-R discipline); `plugins/frz/**` (frozen corpus); shared manifests and lockfiles outside this package
