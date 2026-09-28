---
ticket: FK-POS-03
title: Maximal frontmatter v0.2 plus v0.4 fields
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/spec-body-compiler/**, docs/specs/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
expertise: [kernel-contracts, digest-binding]
inputs: [docs/specs/active/FK-P2-spec-body-compiler.md]
min_context: 4
thinking_level: high
---

## Intent
Proves the parser tolerates the full v0.2 and v0.4 frontmatter surface while identity fields stay opaque.

## Constraints
Frontmatter is identity and audit metadata only.

## Acceptance Criteria
Compiles; the artifact contains only ticket and specPath from the frontmatter.

## Out of Scope
Frontmatter-driven authority of any kind.

## Context & References
- docs/SPEC-CONVENTION.md

## Allowed Files
- plugins/example-pos-03/a.ts
- plugins/example-pos-03/b.ts
