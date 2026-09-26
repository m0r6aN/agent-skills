# PMC-P2A private resolver implementation verification

Date: 2026-09-26. Status: builder verification complete; independent implementation
reviews and coordinator integration remain required. Synthetic offline evidence
only. This document records no dispatch permit, authenticated production claim,
provider availability, activation, or full HRO live acceptance.

## Frozen inputs and public handoff

- Documentation/build head: `c26179f13a4db41097302783d858906d8ec749a7`.
- Branch: `codex/hro-pmc-p2a-20260926`.
- Spec: `docs/specs/active/PMC-P2A-owner-resolver.md`, Git blob
  `d65ff524bba2eda6c9e38de44c78aac4aae1c59f`.
- Private base: `a343ac54f5abad26ec055111d902ae93efcf141f`, ancestor of the build head.
- Reviewed P1b source: `7dce9d573e2c74d5162fe3c7b38a8831a8a6ec6d`.
- Accepted P1a validator: `validateProviderBindingPolicyV1`, `valid/value` or
  `valid/errors`; the resolver does not implement another policy validator.
- P1b `ProviderBindingProjectionV1` remains the complete
  `{schemaVersion:'pmc-provider-binding-projection/v1', evidenceOnly:true, policy}`
  envelope. Existing producer/schema/result exports are retained.
- RCM types are the public `EligibilityFacts`, `Provenance` and
  `IdentityRefusalCode` exports. No RCM private reader/brand import or modification.
- New runtime export: `resolvePmcRouteV1(request: unknown, context: unknown):
  PmcRouteDecisionV1`, synchronous. Concrete types and code unions are exported
  from `src/pmc-resolver-types.ts` through the existing barrel exactly as frozen
  in the spec. There is no signer, callback, budget writer, sender or permit.

The coordinator reported PR57 merged as
`60a62b1cccf06e6a23bfe2294beb758799d5e317` after green remote CI. This private
branch has not merged that main state or later producer work. The coordinator
owns reconciliation, preservation of later producer exports, independent reviews,
and the complete remote CI gate before merge.

## Implementation boundary

Input capture rejects accessors, hidden/symbol properties, nonplain prototypes,
sparse/extended arrays, cycles, functions, nonfinite numbers and bounded-data
overruns. It checks known array lengths, record key counts, key-string units and
minimum value budgets before child descriptor reads or output-container allocation.
Each caller descriptor is captured once; cached owned aliases are recharged by
expanded values, strings and depth on every occurrence. Thrown values are never
inspected, coerced or classified by `instanceof`. Reflective proxy traps are not
an execution-time sandbox, as specified.

Closed request validation and numeric relationships precede context access. L6
returns before any context inspection. P1 validation follows bounded context
capture. Scope, freshness, budgets and episode consistency use the specified
global order; candidates retain all occurrences and run every applicable filter.
Audit references point to one owned immutable context snapshot. Input order is
not mutated; ranked survivors are a separate array. Output traversal checks the
131,072-value and 2,097,152-string-unit ceilings before returning a selection.

Cost values are injected: canonical rational validation, exact value comparisons,
source/count associations and conservative reservation-bound comparisons only.
P2A does not parse provider rate lexemes, calculate charges, add charge components,
round money or reconstruct exact rates from binary catalogue numbers. P2B owns
those calculations; P2C binds/authenticates the result and maps it into this port.
Changing tariff/price/value digests or a consistent value under an unchanged
digest cannot be authenticated by this pure port. Permanent tests explicitly
retain these as supplied claims instead of claiming forgery detection.

## Acceptance matrix and permanent tests

`routing-policy/tests/pmc-resolver.test.ts` adds 207 permanent tests backed by
`tests/fixtures/pmc-resolver-v1.json`. The fixture explicitly uses
`synthetic-offline`, synthetic receipt references and `.invalid` endpoints.

| Spec AC | Permanent evidence |
|---|---|
| 1 | Public barrel invocation; P1 policy/envelope refusals; deterministic repeated/key-reordered inputs; owned deeply frozen output; digest preservation; unchanged full routing and dispatch regressions |
| 2 | Table-driven global and candidate refusals across identity, endpoint, classes/privacy, capabilities, thinking, independence/frontier, context, cost, availability and quality; L6 proxy records zero context operations |
| 3 | All five enabled lanes; pin refusal without provider hopping; preferred provider before quality; L5 projected and output/input unit cost comparison; matrix role ties; supplementary Unicode versus UTF-16 ordering; explicit zero-tolerance terminal fallback |
| 4 | Settled/outstanding liability subtraction, unsafe aggregate and exact context addition; mandatory maximum bound; closed raw-body rejection; input graph/string/key/value preflight and alias expansion; bounded immutable audit and 64-occurrence retention |
| 5 | Concrete public types and code unions above; actual predecessor exports; separate production authority and review/integration obligations retained |
| 6 | Initial matrix fallback winner is terminal; initial relabelling, success, uncertain/unknown disposition, missing/mismatched prior reference/history, changed provider/version/policy/config, fallback replay and third attempt refuse |
| 7 | L1 existing counterpart exclusion and future L2 duty; L2 empty/unknown builder and coordinator subjects, instance/family matches, deduplicated exclusions; unwaivable L3 family duty; L4 determination; L5 parcel review; no invented future reviewer; permitted unknown family remains null |
| 8 | Every semantic comparison row independently conflicts: identity/endpoint/family, class sets/transport, actual booleans/modalities/thinking levels, capacity, enabled/availability, lane score, binary rate facts; refreshed metadata and reordered sets agree; missing current-lane quality is not borrowed |
| 9 | Cost nonstring/missing/extra/container/accessor/currency/digest/2049-unit failures remain global; empty/signed/exponent/decimal/leading-zero/65–2048-unit/zero-denominator/unreduced/over-limit values remain candidate failures with other candidates eligible; valid canonical 64-digit and maximum-adjacent values; profile/count associations; thrown getter and Symbol.hasInstance probes |

P2C must separately prove complete episode custody, omitted-history/new-episode
laundering prevention, evidence/source authentication, exclusion completeness,
budget authority/completeness and authenticated tariff/value digest contents.
Offline resolver vectors cannot prove those operational properties. Supplied
family/frontier declarations do not establish a real registry or live authority.

## Red/green record and commands

Pinned runtime: `D:/nvm/v24.19.0/node.exe` reports `v24.19.0`.

Observed RED stages included the missing public export; the initially unimplemented
successful L4 selection; request relationships reaching context too soon; future
catalogue time being classified as a scope error; and reordered object keys
evading semantic duplicate detection. Each was corrected and its targeted
permanent test passed before final package verification.

Final checks, native exit 0:

- `routing-policy`: `npm.cmd test` — **712/712 passed** (505 existing + 207 new).
- `routing-policy`: `npm.cmd run typecheck` — passed.
- `routing-policy`: `npm.cmd run lint` — passed; one existing informational
  `useLiteralKeys` suggestion in unchanged `tests/catalog-snapshot.test.ts:777`.
- `dispatch`: `npm.cmd test` — **126/126 passed**, test files unchanged.
- Spec validation:
  `D:/nvm/v24.19.0/node.exe --import file:///D:/Repos/agent-skills-worktrees/hro-pmc-p1a-integration-20260926/plugins/foreman-line/routing-policy/node_modules/tsx/dist/loader.mjs plugins/foreman-line/spec-linter/src/cli.ts validate --repo-root D:/Repos/agent-skills-worktrees/hro-pmc-p1a-integration-20260926 plugins/foreman-line/docs/specs/active/PMC-P2A-owner-resolver.md`
  — passed.

Initial dispatch attempts exposed missing local dependencies, not resolver
regressions. Missing `node_modules` directories for dispatch, receipts,
skill-injection, foreman-config, spec-linter, shaping, projection and
permission-profiles were linked to the authorized P1b workspace only after
matching each package-lock SHA256 and checking the target did not exist. Those
junctions were consumed read-only; no package installation or shared dependency
mutation occurred. The first spec validation invocation used a Windows path where
Node requires an ESM file URL; the corrected exact command above passed.

No full local 20-package pipeline, provider calls, push, Pi/configuration changes,
RCM implementation edits, schema changes, launch/controller work or subagents.
Only the six spec-allowed files are part of this implementation diff.

## Independent-review precedence repair — 2026-09-26

Repair base: `1de938c27310c2e357bcc8249170749175f7545c`; frozen spec remains
`d65ff524bba2eda6c9e38de44c78aac4aae1c59f`. Coordinator released the fresh
builder after actual Step 0 inspection. This repairs both accepted P2 findings
without changing API, schema, authority or allowed scope.

Evidence traversal now uses explicit typed declarations, not caller key order.
The coordinator confirmed literal Claim order (`status`, `value`, `evidence`):
independence determination and subject claims precede the enclosing receipt;
subjects retain array order and instance-before-family order. Binding claims use
family-before-instance order; fallback uses disposition-before-quality order.
Candidate filter stage order remains unchanged. Shape validation already walks
its declared field list; remaining generic walks only capture/freeze/count data
or canonicalize semantic duplicates and do not choose evidence refusal priority.

Available catalogue evaluation time, recomputed age and maximum-age checks run
before the aggregate unknown-global return. Snapshot/config associations require
only the supplied catalogue source; unknown unrelated budget, episode,
freshness, independence or determination cannot hide those conflicts. A genuinely
unknown source leaves its unavailable digest/config comparisons unproven. It does
not suppress independent provenance checks or invent replacement facts.

Permanent coverage adds 46 tests (253 resolver tests, 758 routing total): reordered
global/nested evidence, nested-before-enclosing receipts, subject array order,
binding/fallback freshness-code order, five provenance inconsistencies crossed
with five unrelated unknown claims, unavailable-source prerequisites, and valid
unknown-global refusals. Existing repeated/reordered successful selection tests
remain green. The first 42 new tests produced 31 RED failures and then all passed.
The four binding/fallback tests were independently run against the original
source: all four failed, then passed with the repaired source restored byte-for-byte.
An initial attempted test append used an incorrect relative path and made no edit;
the successful append and actual RED evidence followed it.

Final verification with process-local Node 24.19.0, native exit 0:

- Routing `npm.cmd test`: 758/758 passed, no skips.
- Routing `npm.cmd run typecheck`: passed.
- Routing `npm.cmd run lint`: passed; only the existing informational
  `useLiteralKeys` suggestion in unchanged catalog-snapshot.test.ts.
- Unchanged dispatch `npm.cmd test`: 126/126 passed, no skips.
- Focused restored-source binding/fallback tests: 4/4 passed.
- `git diff --check`: passed; only resolver source, resolver tests and this handoff
  changed from the repair base; no public type/barrel/fixture/dependency edits.

No provider calls, production claims, Pi/configuration changes, pushes or merges.
Two independent final reviews and coordinator integration/CI remain required.
