# PMC-P1a implementation review

Reviewed head: `7e77a0ae1f8cc3d8c696c914a40879f0cb97f3f4`.
Pinned active spec: `0a6eab879a9a13fcca2e402e3e4ff33e39a75a8b`.
Two independent reviewers verified the nine-file scope, canonical fifteen
bindings/six lanes/twenty-two occurrences, disabled baseline and held identities,
owned frozen output, unchanged seven legacy schemas and additive public exports.
Both independently passed 470 routing-policy, 126 dispatch and 126 spec-linter
tests, typecheck and lint (one existing informational lint diagnostic).

Reviewer A approved. Reviewer B requested changes for one P2: snapshot cardinality
counts the skipped array `length` metadata as a child value. A valid 65,536-value
policy therefore refuses when its last visited container is an array, yet accepts
after ordinary property reordering. A 65,535-value variant also accepts. Repro:
`C:/Users/clint/AppData/Local/Temp/pmc-review-b-boundary.ts`.

Coordinator disposition: fix before merge, within existing scope. Count visited
children rather than array metadata and permanently test 65,535/65,536/65,537
plus equivalent property orders. Accepted optional hardening in the same snapshot:
array length before complete key enumeration, remaining-budget and depth checks
before prohibited child descriptor reads. The latter are resource improvements;
the reviewer did not demonstrate caller getter/iterator execution or past-limit
acceptance. Do not claim stronger explicit spec wording than exists.

Repair Step 0 independently reproduced the finding and verified the clean head,
branch, spec and nine-file scope. Release is granted under delegated authority;
the builder must recheck the unchanged head before edits and preserve every
existing test/schema/API. Expected edits are only the validator, focused tests
and verification handoff. No provider/configuration effects or publication.
Both independent reviews must approve the repaired frozen head before integration.

## Repaired-head acceptance

Both independent final reviews approved
`12b0aa07560d1f516aec255c42a7f79dc2aed449`, with no blocking findings.
Each passed 471 routing-policy, 126 dispatch and 126 spec-linter tests, typecheck
and lint; each verified seven legacy schemas unchanged and the exact clean head.
Both independently tested schema-valid policies at 65,535 and 65,536 visited
values, reordered properties and 65,537 refusal. Exact aggregate-string limits,
compound remaining budgets and hostile preflight protections also passed.

Both noted the same nonblocking handoff typo confusing array element counts
with visited values. The coordinator corrected that prose on integration;
reviewed implementation is unchanged. Original and repair commits were
cherry-picked without conflict as 353536f and d7b9d0d atop the reviewed HRO
integration branch. Required combined CI, merge and Stage-F closure remain
pending. This static contract grants no execution or live-evidence authority.
