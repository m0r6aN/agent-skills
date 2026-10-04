# PMC-P1b projection verification and handoff

Status: local builder verification complete; independent implementation reviews
and full remote CI remain merge gates. Static evidence only; no activation or
PMC goal-exit claim.

## Frozen build contract

- Worktree: `D:/Repos/agent-skills-worktrees/hro-pmc-p1b-20260926`.
- Branch: `codex/hro-pmc-p1b-20260926`.
- Clean released base: `552142a5b96184c9c7ab57301091afa29341c86c`.
- Active spec blob: `ab8fa3aa3840f80a85be90ac24c845a111be327c`.
- Accepted predecessor: PMC-P1a PR55 and supported RCM-P1A wrapper PR56,
  reconciled on main `e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9`, followed by
  coordinator-only spec commits. Step 0 and explicit coordinator build release
  preceded this implementation. The corrected P1a success payload is `value`.
- Node `v24.19.0` from `D:/nvm/v24.19.0/node.exe`, process-local PATH only.
  Dependencies installed from existing locks with
  `npm.cmd ci --ignore-scripts --no-audit --no-fund --offline`.
  No lockfile, dependency, host configuration or runtime consumer changes.

## Public contract and fidelity

`projectProviderBindingsV1(input: unknown)` always calls the accepted
`validateProviderBindingPolicyV1`. A `valid:true,value` result becomes
`ok:true,projection:{schemaVersion:'pmc-provider-binding-projection/v1',
evidenceOnly:true,policy:value}`. The entire owned, frozen snapshot is retained.
The failure branch forwards the same typed error array and objects, freezes
them, and returns only `ok:false,errors`. No error translation, alternate
validator, partial policy or fallback bypass exists.

Four additive public exports: `ProviderBindingProjectionV1`,
`ProviderBindingProjectionResult`, `projectProviderBindingsV1`, and
`providerBindingProjectionV1Schema`. All 75 pre-existing named public exports,
including accepted RCM exports, remain; total 79, zero removed or renamed.

The closed projection schema embeds the original frozen P1a schema object with
its existing `$id` and local references. It adds no alternate policy constraints.
Schema validation is structural; the projector's P1a validator is required for
semantic checks. Nine schemas are registered; the following eight existing
committed schemas were compared as raw bytes against the released base and are
identical: class-entry, data-classification-rule, pi-openrouter-routing,
provider-binding-policy-v1, role-assignment, routing-policy, shadow-route,
transport-requirements (all `.schema.json`).

## Test evidence

The first focused RED run failed because the public projector export did not
exist. Five focused tests then passed after implementation. A second RED
assertion demonstrated that P1a's schema/plain-data errors were not frozen;
the wrapper now freezes the owned error objects/array without replacing them.

Coverage includes full baseline policy equality, held/unknown evidence,
authority/ranking/gates/budget constraints, all recorded evidence alternatives,
all provenance fields, reversed arrays, unused candidate and binding, exact
provider/model/protocol spellings, caller mutation and recursive freezing.
Refusals compare directly with P1a for structural, semantic, oversized and
truncated errors, accessors, cycles and revoked proxies. A passive-proxy success
test ensures projection never rereads the caller's properties or iterators.
Schema tests reject missing policy, wrong version, false evidenceOnly, added
authority fields and invalid nested policy; parity uses a typed projection sample.

Initial broader runs encountered missing sibling dependencies in this fresh
worktree, not source failures. Offline installation is part of test setup and
does not substitute for the final regression results recorded below.

| Check | Result |
|---|---|
| routing-policy `npm run typecheck` | PASS on final source |
| routing-policy `npm run generate` | PASS, nine schema files; eight existing files byte-identical |
| routing-policy `npm test` | PASS, 505/505, zero skipped or failed, including five new focused tests and new parity checks |
| routing-policy `npm run lint` | PASS, 29 files; one pre-existing informational useLiteralKeys hint in catalog-snapshot.test.ts:777, no error/warning |
| Unchanged dispatch `npm test` | PASS, 126/126, zero skipped or failed |
| Unchanged spec-linter `npm test` | PASS, 126/126, zero skipped or failed |
| Public export comparison | PASS, 75 retained + four additive exports = 79 |
| Staged scope and whitespace | PASS, exactly eight allowed files; `git diff --cached --check` clean |

Full 20-package local pipeline is intentionally outside this scoped build; full
remote CI and two independent implementation reviews remain mandatory before merge.

## Inventory and injection boundary

The [completed compatibility inventory](pmc-p1-design-compatibility.md#reconciled-inventory-closure--pmc-p1b)
records the repeatable pinned-base search, all discovered path/groups, versions,
accountable owners and named PMC-P4 cutover conditions. Historical records retain
their original version; they are not rewritten into claims of v1 execution.

PMC-P2 must enforce disabled L6 at **both legacy and v1 launch boundaries before
any activation**. This is distinct from P3 canon migration and P4 legacy removal.
No retained legacy Pi/Jev registry entry becomes v1 eligibility.

HRO receives projection/v1 through a separately scoped injected adapter.
HroBindingProjectionDraftV1 remains a different contract. Required unknown
protocols, families, budgets and unavailable evidence must produce refusal;
casts or synthetic defaults must not manufacture execution capability.
Projection integration precedes separate RCM producer additions, which must
retain the accepted shared barrel.

Availability, quality, capability, privacy, freshness and self-declared evidence
authenticity remain unproven. No selected/rankable/executable route is produced.
Off-pin declarations stay nonselectable, unresolved budgets stay non-dispatching,
unknown family never proves independence, and terminal same-lane/provider pairs
retain their constraints.

## Scope, rollback and acceptance

Exactly the eight allowed files comprise the parcel: new projection source,
schema and test; additive index, registry and parity test edits; updated design
inventory; this verification record. Runtime source imports only Ajv's erased
schema type and the existing P1a schema/validator sibling modules. No RCM
internal import, provider call, network, ambient clock, IO or host configuration
was added. No files outside the allowlist are source changes.

Rollback removes the new projection source/schema/test and four barrel exports,
the projection registry/sample entry, and these documentation additions. Keep
accepted P1a and reconciled RCM exports and all prior schemas unchanged.
Independent reviewers must evaluate losslessness, validation/freeze boundaries,
legacy/L6 ownership and serialization on the final builder commit; predecessor
and shaping reviews do not constitute P1b acceptance.
