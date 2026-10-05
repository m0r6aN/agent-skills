---
ticket: KONE-TEST
title: Test spec fixture — thinking_level outside the ThinkingLevel vocabulary (RCM-P2 reject)
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
thinking_level: turbo
---

# Test spec

`thinking_level:` maps to the catalog's `thinkingLevelMap` keys (RCM D8);
`turbo` is not one of them: a schema rejection — exit 1.
