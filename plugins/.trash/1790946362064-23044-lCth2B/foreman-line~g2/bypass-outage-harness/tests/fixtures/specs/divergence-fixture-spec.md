---
ticket: FK-P17-TEST
title: Divergence fixture spec (D10 demonstration)
status: draft
owner: fk-p17-harness
created: 2026-09-28
updated: 2026-09-28
supersedes: null
superseded_by: null
risk: standard
surfaces: [pkg/**]
routing_class: standard-feature
permission_profile: null
data_classification: internal
---

# Divergence fixture spec (D10 demonstration)

## Intent

A fixture spec whose frontmatter `surfaces:` grant (`pkg/**`) is BROADER than
its `Allowed Files` body section (`pkg/src/a.ts`). MEAS-05 compiles this spec
with the FK-P2 compiler and compares the compiled mutation authority against
what the shipped `preflightCheck`/`postHocCheck` accept when authorization is
derived from `surfaces:`. The compiled `Allowed Files` is the reference
authority — never `surfaces:` (D10).

## Constraints

Fixture-only. Consumed read-only by the harness and the FK-P2 compiler.

## Acceptance Criteria

1. The compiled `Allowed Files` authority is narrower than `surfaces:`.

## Allowed Files

- pkg/src/a.ts

## Out of Scope

Everything else in the fixture tree.

## Context & References

Fixture consumed by FK-P17′ MEAS-05 and the FK-P2 compiler.
