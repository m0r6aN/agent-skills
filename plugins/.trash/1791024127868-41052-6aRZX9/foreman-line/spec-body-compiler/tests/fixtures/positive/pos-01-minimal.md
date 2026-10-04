---
ticket: FK-POS-01
title: Minimal dispatchable
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: standard
surfaces: [plugins/]
routing_class: standard-feature
permission_profile: null
data_classification: internal
---

## Intent
Minimal legitimate dispatchable shape: all required sections and a single Allowed Files entry.

## Constraints
Follow SPEC-CONVENTION.

## Acceptance Criteria
Compiles to a granted mutation set of exactly one entry.

## Out of Scope
Everything beyond the single file.

## Context & References
- docs/SPEC-CONVENTION.md

## Allowed Files
- plugins/example-pos-01/a.ts
