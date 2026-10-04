# HRO-P1 coordination record

Date: 2026-09-26
Status: superseded planning holds reconciled below; revised P1a/P1b shaping in progress under delegated HRO authority

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

## Coordinator ruling — 2026-09-26 completion mandate

The user granted blanket decision authority for HRO to coordinator task
`01a0ddb6-5fed-7d82-b2f0-075315440dc1`; see `loop-directive.md` for the verbatim
grant and limits. Luna confirmed transfer at the completed planning boundary.
Historical Pending rows above are replaced by these dispositions:

- PMC task `01a0da20-7cf7-7df0-9f26-d61f355586cb` confirmed an isolated HRO-local
  proposal validator may consume an injected binding projection with exact
  logical/binding/provider/model/protocol/host/lane/fallback fields and
  versioned provenance. This is a proposal adapter, not the as-yet-unimplemented
  PMC-P1 public schema. No production consumer may import it as authorization.
- RCM task `01a0bfbc-e869-7d32-9932-a4b43b8a2f51` confirmed injected normalized
  eligibility facts/refusals are permissible for offline compatibility work.
  No unexported RCM deep imports or host evidence reads are permitted.
- Independent read-only boundary audit found P1a's old shared registry/schema
  allowlist and P1b's evaluator allowlist contradict those handoffs. Both specs
  are being replaced with new `hybrid-routing/` files only.
- SUPERCHARGE-P1 is recorded shipped, P2 is docs-only, and no shared
  routing-policy edit is required by the narrowed P1a. No additional owner
  signoff is needed for untouched files. Dispatch, Jev and receipt mutation
  are excluded; their generic Pending rows do not block offline HRO work.
- Production integration remains a genuine dependency: PMC-P1/P2 have no
  implementation; A5.4 is ratified at `b3897c0` but not mainline; RCM-P1 code
  exists at `7faa46a33fdbc927535a193fdbfd4c782b61b6dc` but is unmerged and lacks
  public exports. A supported adapter and canonical snapshot producer are
  also required. These facts cannot be satisfied by static fixtures.

The Node 24.7.0 statement above is historical. Luna verified with local
`D:/nvm/v24.19.0/node.exe`; subsequent verification will pin that runtime.
Gate 2 will be recorded against the amended spec and exact builder branch.

## RCM-P1A Stage F closure — 2026-09-26

PR56 merged as e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9 after both independent
final reviews approved 4201ac4edf8069efa0857d9841341d62b2429648. Independent
combined integration passed 498 routing tests, typecheck, lint and spec validation;
the public barrel preserved the 75-export union. Complete remote twenty-package
CI passed at final PR head e23a9251b0365aeaf68302f36bb259a4a59a9ed3. The spec is
moved to done; original reviewed branches remain retained without destructive
cleanup. The wrapper confers no authority on caller-declared source evidence.

PMC-P1b now owns the next shared-file integration. The isolated RCM producer
may build concurrently but lands after the accepted projection. Live routing,
provider configuration and paid inference have not been activated.