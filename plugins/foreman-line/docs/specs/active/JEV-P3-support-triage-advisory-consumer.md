---
ticket: JEV-P3
title: Jev support-triage advisory consumer contract
status: active
owner: clinton.morgan
created: 2026-09-22
updated: 2026-09-22
supersedes: null
superseded_by: null
risk: architecture/risk
surfaces:
  - plugins/foreman-line/jev-decisions/src/consumer.ts
  - plugins/foreman-line/jev-decisions/src/index.ts
  - plugins/foreman-line/jev-decisions/tests/consumer.test.ts
  - plugins/foreman-line/docs/specs/active/JEV-P3-support-triage-advisory-consumer.md
  - plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/
routing_class: implementation/standard
permission_profile: builder-standard
data_classification: internal
verification_class: security-sensitive
involves:
  - routing-currency-and-merit-jev-alpha
  - routing-currency-and-merit
---

# JEV-P3 — `support-triage-advisory-v1` consumer contract

## Intent

Define a pure, recommendation-only consumer for the validated Jev answer
envelope. The consumer produces the exact closed advisory object named by the
ratified J8 contract and owns no authorization, routing, escalation, spend,
state mutation, host/Pi, HAWF, Helmholtz, or downstream effect.

This parcel is dispatchable under the exact JEV-P2–P5 Gate 2 grant recorded in
the charter, after JEV-P2 Gate 3 acceptance at merged commit `34fc2f5`. JEV-P4
and JEV-P5 remain sequentially blocked until this parcel passes its two fresh
architecture/risk reviews, merge, and human Gate 3 closure.

## Boundary clarification

The P2 `live-observation` is deliberately metadata-only and does not contain
answer values. P3 therefore consumes an already validated P1 `ValidatedResponse`
in the application-owned workflow; it does not consume a live-observation, raw
provider body, transport result, credential, or provider endpoint. Any later
composition of the P2 transport path with this consumer requires an explicit
future integration amendment and is outside this parcel.

## Public API

The package adds a pure consumer surface without changing the P0/P1 validator
or P2 runtime API:

```ts
createSupportTriageAdvisory(response: ValidatedResponse): SupportTriageAdvisory;
```

The input is the P1-validated response type. The function must defensively
snapshot the four emitted values before returning and must not retain a caller
reference. No `RuntimeResult`, `LiveObservation`, raw `unknown`, provider
payload, request state, or application effect port is accepted by this API.

The exact output is:

```text
{
  schema_version: "support-triage-advisory/v1",
  source: "jev",
  response_id: <validated provider response_id>,
  is_urgent: <validated noul value>,
  department: <validated choice value>,
  frustration: <validated score value>
}
```

No other keys are allowed. The values are copied from the validated P1 answer
slots by exact answer name and type; confidence, distributions, criteria,
provider metadata, routing instructions, commands, recipients, capability
tokens, authorization decisions, and effect descriptions are not copied.

## Constraints

- Use only `ValidatedResponse` and the existing P1 validator/types package.
- Do not call the provider, read a credential, access the filesystem, spawn a
  process, log, emit telemetry, retry, schedule, route, escalate, spend, or
  mutate state.
- Do not accept a caller-selected answer name, field mapping, fallback value,
  route, department vocabulary, authorization flag, or effect callback.
- Preserve the provider `response_id` exactly; do not synthesize, alias, or
  replace it with the served model or a local identifier.
- Return a fresh closed object. Mutating the input response after the call must
  not mutate the advisory, and mutating the advisory must not mutate input.
- No changes to P0/P1 documents or code, P2 runtime files, parent RCM surfaces,
  routing registries, Pi/host state, HAWF, Helmholtz, or downstream workflows.

## Acceptance Criteria

- [ ] **AC1 — Exact advisory:** The output has exactly the six named keys and
  exact literals `schema_version: "support-triage-advisory/v1"` and
  `source: "jev"`.
- [ ] **AC2 — Exact answer mapping:** `is_urgent`, `department`, and
  `frustration` are selected by exact validated answer name and expected type;
  no positional or caller-supplied mapping is used.
- [ ] **AC3 — Identity preservation:** `response_id` is copied exactly from the
  validated provider response and cannot be synthesized or omitted.
- [ ] **AC4 — No authority expansion:** The advisory contains no commands,
  capability tokens, recipients, effect descriptions, route selectors,
  escalation instructions, authorization decisions, mutation fields, provider
  credentials, raw bodies, or transport metadata.
- [ ] **AC5 — Immutability boundary:** The returned advisory is a detached
  snapshot; input and output mutations do not cross the boundary.
- [ ] **AC6 — Pure isolation:** Tests are deterministic and offline. The
  consumer has no provider, filesystem, process, clock, network, telemetry,
  retry, or workflow-effect dependency.
- [ ] **AC7 — Scope:** Only `consumer.ts`, the package entrypoint export, and
  `consumer.test.ts` are changed in the package; P0/P1/P2 and parent surfaces
  remain unchanged.

## Required tests and reviews

- A complete valid response maps to the exact six-key advisory object.
- Answer order permutations are rejected by the P1 validator before consumer
  use; the consumer itself uses exact answer names and types.
- Wrong answer names/types, missing answers, extra fields, malformed values,
  missing response ID, and invalid response envelopes cannot produce an
  advisory.
- Output-key exactness and negative assertions prove that confidence,
  distributions, criteria, served identity, endpoint, cost, and unsafe input
  do not cross the boundary.
- Input/output mutation tests prove detached snapshots.
- Static scans prove no provider, credential, filesystem, child-process,
  logging, telemetry, retry, or effect dependency was added.
- Two fresh independent architecture/risk reviews are required. Reviewers are
  read-only and do not fix or commit.

## Verification plan

1. Run `node -v` first and inspect the existing package manifest without
   installation.
2. Run the package tests, configured typecheck/lint scripts, frozen P1 vectors,
   and the consumer negative matrix using sanitized in-memory responses.
3. Run scope, whitespace, dependency, and secret scans; assert only the three
   P3 implementation/test files plus this spec changed.
4. Review the final diff for exact output keys, identity preservation,
   recommendation-only semantics, detached snapshots, and absent effect paths.
5. Obtain two fresh architecture/risk reviews, triage every finding, and stop
   for human Gate 3 after merge and local refresh.

## Allowed files

- `plugins/foreman-line/jev-decisions/src/consumer.ts`
- `plugins/foreman-line/jev-decisions/src/index.ts` (export-only)
- `plugins/foreman-line/jev-decisions/tests/consumer.test.ts`
- this spec until it moves to `docs/specs/done/` after Gate 3

## Forbidden files and effects

Every other path is forbidden, including P0/P1/P2 artifacts, package manifests,
shared indexes, parent RCM/D13/D10 documents, routing registries, Pi/host files,
HAWF, Helmholtz, and downstream workflow surfaces. No live call, spend,
credential access, or application effect is authorized by this parcel.

## Session handoff

- Starting commit: `e89585d` after JEV-P2 Gate 3 closure
- Ending commit: to be recorded after builder and review closure
- Next action: dispatch the bounded P3 builder in a dedicated worktree
- Gate 3: pending after implementation, reviews, merge, and local refresh
