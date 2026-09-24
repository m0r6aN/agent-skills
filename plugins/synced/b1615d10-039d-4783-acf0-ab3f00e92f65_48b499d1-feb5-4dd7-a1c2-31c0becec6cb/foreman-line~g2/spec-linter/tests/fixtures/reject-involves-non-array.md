---
ticket: KONE-TEST
title: Test spec fixture — involves as a bare string, not an array (P1a AC3 reject)
status: active
owner: clinton.morgan
created: 2026-08-18
updated: 2026-08-18
supersedes: null
superseded_by: null
risk: standard
surfaces: [docs/SPEC-CONVENTION.md]
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
involves: ticketing
---

# Test spec

`involves` must be an array of strings; a bare string is a schema rejection
(malformed SHAPE is rejected — only vocabulary membership is advisory).
