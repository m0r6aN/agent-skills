# Ratified Goal-Charter Amendment — E6-R1B Marketplace and Evidence Guards

**Status:** RATIFIED 2026-09-06
**Date:** 2026-09-06  
**Owner:** canonical coordinator task `/root`

## Owner ratification

Clint ratified this amendment exactly as written on 2026-09-06:

> Ratify E6-R1B exactly as written.

## Trigger

Both independent implementation reviewers assessed builder SHA
`c4b05ed38fd0c1c9d543cf6618e4c1e8d57fcf86` and returned HOLD. Reviewer A
proved that the normalized Audit Suite installation path is not functional
because the canonical marketplace does not declare Audit Suite. Reviewer B
proved that the fixture consumer's named full-response assertion does not bind
the response structure it names.

## Recommended E6-R1B decision

1. Add existing root file `.claude-plugin/marketplace.json` as the sole 46th
   builder Allowed File.
2. Add one `audit-suite` plugin entry to the existing
   `m0r6an-agent-skills` marketplace, with source
   `./plugins/audit-suite/audit-suite`. Do not rename the marketplace or modify
   the nested Audit Suite package beyond its already-allowed manifest/README.
3. In the already-allowed Audit Suite README, make every living install,
   update, team-settings marketplace key, and enabled-plugin identifier use
   `audit-suite@m0r6an-agent-skills`. Preserve product/organization history
   outside the locked repository-identity expression.
4. In the already-allowed effective-rules test, replace the overclaiming test
   with assertions that bind each captured merge-gating ruleset to the
   auditable full-response structure used by this evidence run: integer `id`,
   non-empty `name`, `target:'branch'`, current repository source, active
   enforcement, object `conditions`, array `rules`, and array
   `bypass_actors`. Add an in-memory stripped-capture mutation proving the
   named structural assertion turns red. Do not byte-pin the entire response.
5. Clarify, without changing any frozen source or emitter, that E/F
   observability is a process-level coordinator invariant: immediately before
   each emission, capture the relevant read-only GitHub PR data, assert the
   supplied PR/head or merge values equal that observed data, persist the raw
   evidence outside the receipt directory, and repeat the binding checks in
   the deterministic exit. `runStageE` and `runStageF` remain pure consumers of
   those already-observed values; no helper-level network enforcement is added.
6. Extend the existing E6-R1 Gate-2 grant only to this bounded same-builder
   rework and two independent read-only re-reviews of its final SHA. All prior
   limits remain: no receipt before both re-reviews pass, no Jira/ruleset/issue
   mutation, no other-repository write, no agent merge, and no extra issue or
   PR.

## Verification additions

- `.claude-plugin/marketplace.json` parses and `claude plugin validate .`
  succeeds.
- A deterministic manifest-resolution check proves the marketplace contains
  `audit-suite`, its source directory exists, and the nested plugin manifest's
  `name` is `audit-suite`.
- A tracked search finds no stale living `audit-suite@kaseya-one` or
  `kaseya-one` marketplace key in the changed README.
- The stripped-capture mutation turns the corrected fixture-structure test red.
- Both independent reviewers re-review the same final rework SHA. Any remaining
  high/critical finding or failed harness claim blocks Stage D.

## Unchanged boundaries

The one test issue and two human-merge PR limit is unchanged. Stages A–C remain
valid and are not reminted. The 42-file/79-line identity inventory, two
migration records, read-only rulesets, exact-six A→F chain, current-repository
only write boundary, and human merge stops remain unchanged.
