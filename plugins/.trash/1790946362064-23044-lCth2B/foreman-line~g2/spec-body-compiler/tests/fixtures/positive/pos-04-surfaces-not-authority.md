---
ticket: FK-POS-04
title: Maximal surfaces is not mutation authority
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces: [docs/**, plugins/**, skills/**, apps/**, config/**, docs/specs/active/FK-P2-spec-body-compiler.md, plugins/foreman-line/spec-body-compiler/**, plugins/foreman-line/dispatch/**, plugins/foreman-line/kernel-contracts/**, skills/using-agent-skills/SKILL.md]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent
Proves a granted mutation set equals exactly the Allowed Files entries under maximal surfaces: — no widening from any frontmatter field (D10).

## Constraints
surfaces: is routing and audit metadata only.

## Acceptance Criteria
Compiles; allowedFiles is exactly the two declared entries even though surfaces: spans every known prefix.

## Out of Scope
Any widening of authority from frontmatter.

## Context & References
- docs/SPEC-CONVENTION.md

## Allowed Files
- plugins/example-pos-04/a.ts
- plugins/example-pos-04/b.ts
