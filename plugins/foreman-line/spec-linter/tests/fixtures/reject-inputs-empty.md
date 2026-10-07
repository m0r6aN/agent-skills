---
ticket: KONE-TEST
title: Test spec fixture — inputs as an empty array (RCM-P2 reject)
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
inputs: []
---

# Test spec

`inputs: []` declares no modality at all; the field is either absent (=
text-only) or non-empty (RCM D8): a schema rejection — exit 1.
