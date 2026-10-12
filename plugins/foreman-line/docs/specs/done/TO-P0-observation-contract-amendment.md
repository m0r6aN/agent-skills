---
ticket: TO-P0
title: Observation contract amendment
status: done
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md
  - plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md
  - plugins/foreman-line/docs/goals/trustworthy-observation/to-p0-handoff.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: public
---

# TO-P0: Observation contract amendment

## Intent

TO-P0 produces the documentation-only companion amendment that freezes how ratification evidence is read, how locators resolve, how malformed evidence is isolated, how chain membership is shared, and how client refresh freshness is represented. It reconciles legacy ratification-reading and alias-as-locator conventions against FOC-P0 and FCA-P0/P1 without granting new routes, new authority, new writable files, or new parcel-state vocabulary. Success is an explicit contract that every later TO parcel can consume without reinterpreting frozen behavior.

## Constraints

- Documentation-only deliverable; no implementation changes, no route additions, no new console authority, no new parcel-state vocabulary, no cryptographic claims.
- Existing routes only; designated documents may be added to the existing GET /api/goals/:slug response for parcel-less goals and to existing parcel logs; no arbitrary file endpoint.
- Source-document projection must be withheld when frozen route constraints cannot support it safely.
- Preserve existing observer posture, loopback binding, closed action registry, present-only human gates, and the two console-local writable files.
- R1–R5 vocabulary and precedence remain unchanged.
- No secrets, credentials, customer data, PII, internal hostnames, or environment-specific endpoints.
- Exact mutation authority is limited to Allowed Files below.

## Acceptance Criteria

- Amendment explicitly defines supported ratification dialects, negative/conflicting handling, supersession, unknown handling, and reference-resolution bounds.
- Amendment states that negative, quoted, instructional, historical, or superseded text never establishes a current grant.
- Amendment defines actual-root locator rules and prohibits alias labels from becoming fabricated path components.
- Amendment defines malformed-evidence isolation and chain-membership semantics shared by console and CLI.
- Amendment defines one-generation refresh behavior, stale/error presentation, and selection preservation rules.
- Every changed rule maps to an old clause and at least one positive and one negative scenario.
- Unsupported cases are named explicitly, including parcel-less goal navigation and any case where source-document projection is withheld.
- Inventory of affected consumers and live-goal collisions is included.
- Verification commands/checks and evidence expectations are recorded in the handoff.
- Reviewer focus questions are included and specific.

## Out of Scope

- Implementing parser, UI, CLI, API, or refresh changes.
- Changing another goal’s charter, contracts, or ownership.
- Ratifying the amendment or claiming review acceptance.
- Adding routes, writable files, approval capture, workflow status storage, or console mutation rights.
- Cryptographic verification claims or new chain-validity semantics beyond structural validity.
- Rewriting historical ratification records to fit a parser.

## Context & References

- [Charter](../../goals/trustworthy-observation/charter.md)
- [Plan review findings](../../goals/trustworthy-observation/plan-review-findings.md)
- [SPEC-CONVENTION](../../SPEC-CONVENTION.md)
- [FOC-P0](../active/FOC-P0-projection-contract-and-discovery-inventory.md)
- [FCA-P0](../active/FCA-P0-ops-console-multi-root-and-status-index.md)
- [FCA-P1](../active/FCA-P1-remediation-advisor.md)

## Allowed Files

- plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md
- plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md
- plugins/foreman-line/docs/goals/trustworthy-observation/to-p0-handoff.md

## Verification Plan

Checks and commands to record in handoff evidence:

- Confirm only Allowed Files are present in the parcel diff.
- From plugins/foreman-line/spec-linter run `node --import tsx src/cli.ts validate --repo-root <absolute-repo-root> <absolute-TO-P0-spec-path>`; this checks the parcel spec, not companion prose.
- Inspect the three Allowed Files for accidental sensitive values; record the bounded review and do not claim an automated secret/PII certification.
- Manually verify every contract rule in the amendment cites the clause it replaces and links to at least one positive and one negative scenario.
- Manually verify parcel-less goal navigation is described only through existing GET /api/goals/:slug projection and existing parcel logs, and that any unsupported projection is explicitly withheld.
- Manually verify affected-consumer and live-goal collision inventory is present and names unknowns.

Mandated reviewer focus questions:

- Does the amendment make unknown/conflicting ratification evidence impossible to misread as a grant?
- Are quoted, negated, historical, instructional, or superseded grant words explicitly excluded from current grants?
- Do locator rules prevent aliases from becoming fabricated path components?
- Are malformed-evidence isolation and chain-membership rules identical for console and CLI?
- Does refresh behavior guarantee one-generation consistency and honest stale/error presentation?
- Are parcel-less goals navigable only through existing routes, and is source-document projection withheld where constraints do not support it?
- Are affected consumers and live-goal collisions identified without inventing artifact existence or API behavior?
- Are unsupported cases explicit enough that later parcels cannot silently reinterpret the contract?

Coordinator shaping rulings: Ember supplied the draft; coordinator corrected repository paths, reference links, nullable supersession metadata, executable validation command, and required judgment/architecture metadata. PR1–PR8 dispositions remain mandatory, including unmapped invalid chain diagnostics visible through API/UI, unknown ratification retaining attention/remedies, and designated goal documents through existing goal detail. TO-P3 introduces shared receipt membership; no existing helper is assumed. No acceptance is claimed by shaping.

Lifecycle staged for PR #167: documentation semantics independently accepted at019ab92c; actual publication/green-chain merge remains pending. Folder/status move ships atomically with the reviewed companion under SPEC-CONVENTION same-PR closure. No implementation or Stage-F receipt is claimed.
