---
ticket: KONE-TEST
title: Test spec fixture — inputs carrying a modality outside text|image (RCM-P2 reject)
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
inputs: [text, audio]
---

# Test spec

`audio` is not a modality any provider catalog carries (RCM D8: constrained to
`text | image`): a schema rejection — exit 1.
