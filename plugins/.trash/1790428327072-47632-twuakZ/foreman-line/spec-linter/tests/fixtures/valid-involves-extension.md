---
ticket: KONE-TEST
title: Test spec fixture — involves resolved via project vocabulary extension (P1a AC4)
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
involves: [telemetry]
---

# Test spec

`telemetry` is not in the §4.8 base vocabulary. With
`--config foreman-config-telemetry.yaml` (which declares a `telemetry`
capability) there is no advisory; without the config the advisory appears
and the exit code stays 0 either way.
