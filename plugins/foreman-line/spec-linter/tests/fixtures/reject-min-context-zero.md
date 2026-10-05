---
ticket: KONE-TEST
title: Test spec fixture — min_context of zero tokens (RCM-P2 reject)
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: standard
surfaces: [docs/SPEC-CONVENTION.md]
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
min_context: 0
---

# Test spec

`min_context` is a positive token floor (RCM OQ6); zero is not a floor: a
schema rejection — exit 1.
