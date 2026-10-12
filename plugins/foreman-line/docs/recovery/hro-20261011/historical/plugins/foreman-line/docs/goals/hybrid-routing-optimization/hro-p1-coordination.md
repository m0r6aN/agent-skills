# HRO-P1 coordination record

Date: 2026-09-26
Status: handoff requested; Gate 2 not yet requested

The owner ratified the recommended path:

- HRO-P1 is a draft until coordinator lint and Gate 2.
- Locked dependencies are installed only for local verification.
- Fresh independent frontier reviewers may review the P1 shape.
- Live provider verification remains deferred.
- Pi configuration remains proposal-only.
- Jev optimization remains disabled unless the measured baseline proves a need.
- Merge and release remain outside this authorization.

## Handoff requests

| Owner/surface | Requested confirmation | Current state |
|---|---|---|
| Pi model configuration | Accept or amend the explicit mapping/provenance boundary and identify the authoritative adapter/config files. | Pending |
| Routing currency and merit | Confirm the catalog/eligibility projection contract consumed by HRO and the serialized files. | Pending |
| Routing policy / SUPERCHARGE | Confirm that P1 may extend the existing mapping registry without changing model authorization or tier ordering. | Pending |
| Dispatch | Confirm the resolver seam and whether dispatch remains consumer-only for P1. | Pending |
| Jev | Confirm no Jev protocol or recommendation changes are required for P1. | Pending |
| Receipts / settlement | Confirm that P1 emits no new receipt schema and identify the later event integration seam. | Pending |

Until these confirmations are recorded, the P1 Allowed Files list is
candidate scope only and no overlapping implementation file is dispatchable.

## Council-driven shaping amendment

The P1 shape is split into two drafts before Gate 2:

- P1a owns the exact mapping contract, provenance/version semantics, fixtures,
  and additive OpenRouter compatibility.
- P1b owns consumer/evaluator integration and the typed rejection compatibility
  decision, after P1a and all owner handoffs.

Endpoint availability, catalog refresh, fallback, receipt integration, Jev,
configuration writes, and live verification remain outside both P1 drafts.
The current Node 24.7.0 environment is below the packages' declared
24.11.1 minimum; authoritative verification must run on the required runtime.

## Owner handoff results

The approved handoff requests were sent to the PMC configuration loop and RCM
catalog/eligibility owner tasks. Their responses narrow the dispatchable scope:

- PMC owns the provider-neutral binding representation, routing-policy contract,
  migration inventory, and fixtures (PMC-P1); the resolver, Pi configuration,
  model enablement, launch boundary, break-glass path, and generated route
  artifacts remain PMC-P2. HRO-P1a may define and validate a proposal object
  against frozen PMC inputs, but may not create a resolver, edit Pi config,
  enable models, or silently extend the frozen contract. Any new binding field
  requires PMC-P1 ratification; any Pi/config consumption requires PMC-P2.
- RCM-P1 remains the sole producer of normalized catalog and eligibility facts.
  HRO must not consume raw catalog storage, duplicate eligibility logic, read
  serialized host evidence directly, or infer availability from RCM facts. No
  merged production `rcm-catalog-snapshot/v1` artifact exists yet. P1b is
  therefore conditional on a named stable RCM export or an injected adapter
  supplied by a later RCM integration parcel; direct imports of unexported RCM
  modules and changes to the RCM public index are out of scope.
- HRO-P1b must not edit dispatch/routing-eval without a further owner and
  coordinator amendment. Its current role is contract/consumer compatibility,
  not runtime wiring.

These responses are recorded as handoff evidence, not as merge or release
authorization. Candidate Allowed Files remain non-dispatchable until Gate 2.
