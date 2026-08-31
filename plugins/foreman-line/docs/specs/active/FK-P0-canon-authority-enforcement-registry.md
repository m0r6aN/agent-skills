---
ticket: FK-P0
title: Foreman Kernel - canon authority and enforcement registry
status: active
owner: clinton.morgan
created: 2026-08-31
updated: 2026-08-31
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/authority-registry/**]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# FK-P0 - Canon Authority and Enforcement Registry

## Intent

Create the contract-first, source-digest-bound registry that tells later Foreman Kernel
parcels which rules are operative, whose authority they express, where they can honestly be
enforced, and which contradictions or stale statements remain visible. The registry must
inventory the standing builder, reviewer, coordinator, gate, stop, and authority rules before
FK-P1 freezes runtime contracts, while preserving Git canon and human/independent-verifier
authority outside agent-callable control state. This parcel produces only a deterministic
registry contract, registry data, fixtures, a read-only validator/corpus sweep, and supporting
documentation; it implements no kernel runtime or enforcement adapter.

## Goal

Produce the canonical, source-bound FK authority/enforcement registry contract and its
deterministic validation evidence without implementing runtime enforcement.

## Initiative

`foreman-kernel`

## Project Track

Foreman Line / provider-neutral trust contracts

## Wave

Wave 0 - Authority and contracts

## Branch

`codex/fk-p0-canon-authority-enforcement-registry`

## Worktree

`D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`

The starting authority commit is `51857a3a7796b393c0c0a68712f98c06e7015d79`.
Wave 0 cannot exit until FK-P0 is merged through human Gate 3 and its contract/fixtures are
consumed without unresolved implementation consequence.

## Dependencies

- No implementation-parcel dependency. FK-P0 is first in the ratified graph.
- Gate 1 and its scoped R1-R13 re-ratification are complete; the charter-scoped standing
  Gate 2 authorization is active for FK-P0.
- FK-P1 and FK-P2 depend on the merged FK-P0 registry contract. They must stop rather than
  silently reinterpret or widen it.

## Integration Surfaces

- `FK-AUTHORITY-REGISTRY` - source contract consumed by FK-P1 decision/admission contracts,
  FK-P2 exact-path compilation, FK-P12 authorization policy, FK-P16 host-adapter reporting,
  FK-P18 CI backstops, and FK-P19 enforcement promotion.
- This parcel defines that surface only. It wires none of those consumers.

## Security Gate

Security-sensitive authority contract. Two independent fresh architecture/risk reviews are
required before human Gate 3. At least one review must explicitly probe authority confusion,
self-asserted identity, protected-operation minting, stale-source acceptance, and downgrade of
human or independent-verifier evidence into ordinary control state. Reviewers never fix or
commit, and each review ends with a clean-worktree assertion.

## Constraints

### Authority and source baseline

- The hierarchy in `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` section 3 is
  binding: explicit developer ratification; this goal charter; ratified Foreman contracts and
  `SPEC-CONVENTION.md`; `COORDINATOR-PATTERN.md` and the `goal` skill; parcel specs; standing
  constraints/role kickstarters; generated projections/caches/advisory docs.
- Scope and conflict resolution are contextual. A lower-tier generic rule can remain valid
  outside this goal while a higher-tier FK-specific rule controls FK work. The registry must
  not globally rewrite or erase the generic rule to express that result.
- Git remains authoritative for ratified charters, specs, policies, reviews, human-gate
  artifacts, and committed proof. No registry record, checksum, validator result, SQLite row,
  local capability, MCP response, hook event, or receipt can replace that authority.
- Initial construction is dispatched from exact commit
  `51857a3a7796b393c0c0a68712f98c06e7015d79`. Its full-file hashes and changed-file proof are
  parcel-time evidence only, not a permanent shipped freeze. The registry binds each rule to a
  stable source identity, typed locator, and normalized semantic value. A changed operative
  normalized value or locator requires the migration chain defined below; unrelated bytes,
  formatting, line numbers, import order, and content outside the locator do not invalidate the
  shipped registry.
- Historical and stale files remain byte-unchanged. Reconciliation occurs through typed
  source status, rule status, precedence, and migration-evidence records in the registry.

### Source corpus and inventory boundary

The shipped registry must inventory every rule-bearing item in these exact committed sources:

1. `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` - D1-D20, architecture
   boundaries, refusal classes, gates, stop conditions, serialization ownership, and exits.
2. `plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md` - accepted R1-R13
   corrections and binding FK-P3 shaping disposition.
3. `plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md` - ownership, standing
   authorizations, parcel algorithm, FK-P0 mandate, queue/dependencies, and stop conditions.
4. `plugins/foreman-line/docs/SPEC-CONVENTION.md` - spec lifecycle, exact Allowed Files,
   Step 0, authority split, security/content rules, and Gate 3 proof posture.
5. `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` and
   `plugins/foreman-line/skills/goal/SKILL.md` - coordinator, reviewer, gate, Step 0,
   independent-review, stop, and human-completable-condition rules.
6. `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` - all thirteen numbered
   builder/reviewer constraints, with each role and conditional applicability preserved.
7. `plugins/foreman-line/skills/parcel-driven-development/SKILL.md` - all fifteen hard rules,
   parcel stop rules, review obligations, serialization rules, and evidence discipline.
8. `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md` and
   `plugins/foreman-line/approval/README.md` - historical/tiered gate vocabulary that must be
   distinguished from the FK goal Gate 1/2/3 namespace.
9. `plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json`,
   `plugins/foreman-line/spec-linter/src/validate.ts`,
   `plugins/foreman-line/spec-linter/src/cli.ts`, and
   `plugins/foreman-line/spec-linter/README.md` - live implementation behavior and stale
   explanatory text, including current six-value `permission_profile` enum behavior.
10. `plugins/foreman-line/permission-profiles/permission-profiles.yaml`,
    `plugins/foreman-line/permission-profiles/src/types.ts`,
    `plugins/foreman-line/permission-profiles/src/validator.ts`, and
    `plugins/foreman-line/permission-profiles/README.md` - named profiles, deny-first behavior,
    loaded-session boundary, bypass/non-enrollment limits, and reviewer shell residual.

Each source entry contains an explicit ordered inventory of its rule-bearing locators and one
of: mapped operative rule IDs, mapped corroborating/historical/provenance rule IDs, or an
explicit exclusion disposition with rationale. The corpus sweep fails on an uncovered
inventory item, a referenced rule that does not exist, an active rule without a source, or an
unmigrated locator/normalized-semantic-value change. Completeness of the curated locators is also
a mandatory independent-review focus; the sweep proves registry-to-source binding, not that
the registry author noticed every natural-language rule.

## Contract

### Registry contract

`authority-enforcement-registry.yaml` has a closed, versioned top-level shape:

```ts
interface AuthorityEnforcementRegistry {
  readonly schemaVersion: '0.1.0'
  readonly registryId: 'foreman-kernel-authority-enforcement'
  readonly sourceSnapshotCommit: string // exactly 40 lowercase hex characters
  readonly sources: readonly CanonSource[]
  readonly rules: readonly AuthorityRule[]
  readonly operationAuthority: readonly OperationAuthority[]
  readonly reconciliations: readonly ReconciliationRecord[]
}
```

Every nested object is closed (`additionalProperties: false` in JSON Schema). TypeScript and
draft-07 JSON Schema are hand-authored dual representations and parity-tested; ajv
`JSONSchemaType` is not an authority. The package is **repo-contained**, not standalone: its
schema generator may use the shipped `schema-scaffold` through the existing exact relative-ESM
source boundary, but it adds no workspace link, bare `@foreman-line/*` import, or runtime
dependency on another Foreman package. The validator and CLI must run from this package after
its own `npm ci` without installing dependencies in sibling packages.

The schema freezes these exact value sets; the builder may not add, rename, or infer values:

- `AuthorityTier`: `developer-ratification | goal-charter | ratified-contract |
  coordinator-pattern | parcel-spec | standing-role | generated-advisory`, ordered from
  highest to lowest exactly as written;
- `SourceKind`: `developer-ratification | goal-charter | foreman-contract |
  coordinator-pattern | parcel-spec | standing-constraint | live-implementation |
  historical | generated-advisory`;
- `AuthorityEffect`: `binding | corroborating | superseded-in-scope | historical |
  stale-explanation | advisory-only`;
- `RuleClassification`: `pre-action-refusal | post-action-detection | ci-static-check |
  independent-review-human-judgment | narrative-provenance | unsupported`;
- `Decision`: `ALLOW | REFUSE | ADVISORY | CONFLICT | REQUIRE_HUMAN`;
- `Severity`: `info | low | medium | high | critical`;
- `EnforcementOwner`: `human-developer | human-merge-operator | coordinator | kernel-policy |
  host-adapter | ci | independent-reviewer | provenance-only | none`;
- `AssuranceLevel`: `narrative | structural | detected | mediated |
  independently-verified | human-ratified`;
- `RetirementState`: `active-reading | required-backstop | candidate-for-retirement |
  retired-from-agent-reading | historical-only`;
- `PrincipalClass`: `anonymous-read | human-developer | coordinator | shaper | builder |
  independent-reviewer | ci-service | host-adapter | kernel-operator`;
- `GoalScope`: `foreman-kernel | all-foreman-goals`;
- `RoleScope`: `developer | coordinator | shaper | builder | reviewer | ci | host-adapter |
  kernel | operator | any`;
- `StageScope`: `stage-zero | shaping | step-zero | build | deterministic-verify |
  adversarial-review | merge | closure | runtime | any`;
- `OperationScope`: `source-inventory | spec-mutation | repo-read | repo-mutation |
  state-transition | control-call | receipt-validation | external-write | any`;
- `HostPosture`: `provider-neutral | claude-windows-docker-loaded |
  claude-windows-docker-unenrolled | unsupported-host | ci | any`;
- `LocatorKind`: `heading | numbered-item | table-row | symbol | line-excerpt | missing-path`;
  and
- `MigrationStatus`: `open | resolved-for-fk | superseded-by-amendment | blocked`.

All IDs use lower-case kebab/dot tokens matching `^[a-z0-9]+(?:[.-][a-z0-9]+)*$`. SHA-256
values are exactly 64 lower-case hex characters. Arrays used as sets are unique and emitted in
schema-enum order; source references and inventory items retain declared order.

`CanonSource` must carry:

- immutable `sourceId`, exact repo-relative `path`, `sourceKind`, `authorityTier`,
  `authorityEffect`, `scope: GoalScope[]`, and parcel-time `snapshotEvidence` containing the
  source commit and full-file SHA-256;
- ordered `inventoryItems[]`, each with stable `itemId`, a `SourceLocator`, normalized excerpt,
  `valueDigest`, mapped rule IDs or an explicit exclusion disposition, and rationale; and
- no arbitrary absolute paths, globs, directory shorthand, URLs, or source payload copies.

`SourceLocator` is closed and contains `kind: LocatorKind`, `anchor` (a heading path, numbered
item, table key, exported symbol, bounded excerpt label, or intentionally missing path), and an
optional positive `lineHint`. `lineHint` aids review but is excluded from identity and digests.
`SourceRef` is exactly `{ sourceId, itemId, locatorDigest, valueDigest }`; every component must
resolve to one inventory item. `locatorDigest` is SHA-256 over canonical JSON of
`{ kind, anchor }`; `valueDigest` is SHA-256 over the UTF-8 bytes returned by
`normalizeRuleText`. This pins identity, location, and normalized value independently.

Standing Constraint #12 controls digest use. `snapshotEvidence.fullFileSha256` proves the
parcel's dispatch baseline but is **not** compared by the shipped sweep after FK-P0. The sweep
extracts only each declared locator, applies `normalizeRuleText`, and compares `valueDigest`;
unrelated bytes, Markdown wrapping, line endings, import order, and `lineHint` changes do not
fail. `normalizeRuleText` is exact: Unicode NFC; CRLF/CR to LF; trim each line; discard empty
lines; join remaining lines with one ASCII space; collapse each remaining run of Unicode
whitespace to one ASCII space. An operative normalized-value change without a matching typed
migration fails. A missing/moved locator fails its location binding. Full-file snapshot drift is
reported only in parcel-time evidence and never becomes a shipped byte-freeze test.

`AuthorityRule` must carry:

- immutable semantic `ruleId` independent of line number; `normalizedStatement`;
  `sourceRefs: SourceRef[]`; closed `applicability` with non-empty unique arrays of
  `GoalScope`, `RoleScope`, `StageScope`, `OperationScope`, and `HostPosture`; `Severity`;
- exactly one primary classification:
  `pre-action-refusal | post-action-detection | ci-static-check |
  independent-review-human-judgment | narrative-provenance | unsupported`;
- common decision semantics using only
  `ALLOW | REFUSE | ADVISORY | CONFLICT | REQUIRE_HUMAN`; enforcement owner; stable refusal
  code when classification is `pre-action-refusal`; `EnforcementOwner`; `AssuranceLevel`;
  unique paired/backstop rule IDs;
- `RetirementState` and closed `retirementEvidence` with nullable `EvidenceRef` values for
  `predicate`, `negativeRefusalTest`, `corpusSweep`, and `independentBypassAttempt`. All four are
  non-null only when state is `retired-from-agent-reading`; rationale/provenance remains mapped;
  and
- `bindingDigest`, recomputed from canonical JSON of `{ruleId, sourceRefs,
  normalizedStatement}`. Canonical JSON is UTF-8 JSON with Unicode NFC strings, recursively
  lexicographically sorted object keys, array order preserved, and no insignificant whitespace.
  It is an integrity checksum only, never a receipt, signature,
  approval, verification verdict, merge authorization, or closure artifact.

`EvidenceRef` is exactly `{ kind, path, digest }`, where `kind` is
`predicate-contract | negative-test | corpus-sweep | independent-bypass`, `path` is an exact
repo-relative non-glob path, and `digest` is a SHA-256 over that evidence artifact's bytes. The
four retirement fields require their matching `kind`; a rule is
`retired-from-agent-reading` if and only if all four references are present and independently
resolvable. Evidence digests bind evidence identity; they do not freeze unrelated canon files.

`OperationAuthority` must distinguish authenticated admission from authority and is exactly:
`{ operationId, allowedPrincipals, requiredGitEvidence, missingEvidenceDecision,
agentCallable, operationalStateMaySatisfy, toolMayIssueAuthorityEvidence }`.
`operationId` is one of `gate1.ratify | gate2.dispatch | gate3.merge |
verification.issue | closure.record | receipt.mint-generic | external.write`;
`allowedPrincipals` is a unique `PrincipalClass[]`. It is non-empty for every executable
operation, but must be empty for `receipt.mint-generic` and `external.write`; no placeholder
principal may be inserted to satisfy schema shape. `requiredGitEvidence` is a unique
`SourceRef[]`; `missingEvidenceDecision` is `REFUSE | CONFLICT | REQUIRE_HUMAN`; and the final
three fields are booleans. Principal identity is admission-derived, never caller-self-asserted.

The following protected operations are mandatory matrix rows and semantic invariants:

| Operation | FK-P0 contract |
|---|---|
| Gate 1 ratification/amendment | Human developer only; `REQUIRE_HUMAN` when absent; never control-state writable or tool-issued. |
| Gate 2 dispatch | Agent execution only when exact charter-scoped, digest-bound Git authorization already exists; state may record consumption but cannot manufacture the grant. |
| Gate 3 merge | Human-owned and nondelegated for `foreman-kernel`; never agent-callable or tool-issued. |
| Independent verification/verdict | A mechanically distinct fresh verifier/reviewer principal; builder and coordinator cannot issue evidence for their own work. |
| Closure authority | Derived only after the real human merge and required evidence; a closure record reports history and cannot authorize its prerequisite. |
| Generic receipt minting | Absent/refused in first release; `allowedPrincipals` is empty and no agent-callable generic mint operation may exist. |
| External writes | `allowedPrincipals` is empty; Jira, SCM, cloud, signing, deployment, publication, billing, credentials, Docker socket, and repo settings remain unauthorized in this goal. |

Any matrix mutation that makes a protected operation agent-callable, control-state satisfiable,
self-asserted, or tool-issued must fail validation. A local control capability proves admission
only and must never appear as the authority source for a protected operation.

### Required reconciliations and migration evidence

The initial registry must contain separate typed reconciliation records for all of the following:

1. **Gate namespace/count:** `FOREMAN-LINE-PLAN.md` says humans hold “exactly two gates” and
   also describes a Stage-A approval and Stage-C dispatch; operative goal canon uses Gate 1
   charter ratification, Gate 2 parcel dispatch, and Gate 3 merge. Record the former as
   historical pipeline vocabulary, the approval CLI as a stage-specific digest-binding human
   action, and the latter as the binding FK goal-process namespace. Do not renumber or edit the
   historical files.
2. **Gate 3 delegation:** the generic coordinator pattern permits a contingent standing grant,
   `SPEC-CONVENTION.md` requires live mechanically distinct identity/ruleset proof, and this
   goal explicitly withholds delegation. Scope/precedence resolves FK-P0 to human-only merge;
   no generic text is rewritten.
3. **Spec-linter/profile behavior:** the live frontmatter schema enum-validates exactly the six
   shipped profile names, while `SPEC-CONVENTION.md`, the spec-linter README, and the missing-
   profile advisory still describe the registry as deferred/interim. Record exact positive and
   negative probe evidence and classify explanatory prose as stale where it contradicts the
   implementation. FK-P0 does not edit the linter or convention.
4. **`surfaces:` versus `Allowed Files`:** `surfaces:` remains broad routing/audit metadata and
   is not mutation authority. The current spec-linter validates frontmatter only and does not
   compile the body section. Until FK-P2 lands, exact Allowed Files is a Git-spec/human review
   control, not a claimed hook refusal.
5. **Permission-profile enforcement bound:** a profile constrains only a session that loads the
   emitted worktree-local settings; bypass/non-enrollment can make it inert, and shell-capable
   reviewers retain residual mutation capability. Classify mediated denials separately from
   post-review Git detection and unsupported/unloaded cases. Never report missing enrollment as
   a refusal.
6. **Missing provenance reference:** `STANDING-CONSTRAINTS.md` names
   `docs/transcripts/defects_lessons.md`, but no such tracked file exists at the source snapshot.
   Preserve the thirteen inline standing rules as rules sourced from `STANDING-CONSTRAINTS.md`,
   record the absent provenance target as unresolved migration evidence, and prohibit retirement
   of those rules from the reading path until provenance is restored or explicitly amended.

`ReconciliationRecord` is exactly `{ reconciliationId, topic, observedRefs,
observedEvidence, authoritativeRuleIds, scopedDisposition, unresolvedConsequence,
migrationStatus, supersedingEvidence }`. IDs follow the common ID pattern; `observedRefs` and
`authoritativeRuleIds` are non-empty unique arrays; `observedEvidence` is a non-empty array of
closed `{ kind, reference, digest }` objects where `kind` is `source-ref | git-commit |
command-result | missing-path`; the two prose fields are non-empty normalized strings;
`migrationStatus` is `MigrationStatus`; and `supersedingEvidence` is a nullable `SourceRef`,
required only for `superseded-by-amendment`. `resolved-for-fk` means runtime-contract consumers
have one unambiguous FK rule; it does not mean the older artifact was changed or globally
invalidated. An unlisted contradiction between active rules is a validation failure.

### Validator and CLI boundary

- Export pure `validateRegistry(document)` and a read-only
  `sweepRegistrySources(document, repoRoot)`; all failures use typed result objects with stable
  codes. Do not write receipts, sidecars, timestamps, caches, source files, or registry updates.
- CLI commands are only `validate <registry-path>` and
  `sweep <registry-path> --repo-root <path>`. Exit `0` means valid/fully bound, `1` means schema
  or semantic/corpus violation, and `2` means usage/read/parse failure. All violations are
  emitted; policy conflict is not converted into an untyped process crash.
- `sweep` reads only exact repo-relative source paths declared in the registry beneath the
  supplied repository root; it rejects absolute paths, traversal, containment escape,
  symlink/reparse targets, non-regular files, duplicate normalized paths, missing/moved
  locators, and changed normalized-value digests. It does not compare full-file snapshot hashes.
- Validation is deterministic: identical registry/source bytes return byte-identical ordered
  results. No clock, randomness, network, environment-derived identity, or Git mutation is used.
- Stable result codes are closed to: `SCHEMA_INVALID | SOURCE_PATH_INVALID |
  SOURCE_PATH_ESCAPE | SOURCE_NOT_REGULAR | SOURCE_SYMLINK_FORBIDDEN |
  SOURCE_DUPLICATE_PATH | LOCATOR_MISSING | LOCATOR_DUPLICATE |
  LOCATOR_DIGEST_MISMATCH | VALUE_DIGEST_MISMATCH | RULE_DUPLICATE | RULE_ORPHANED |
  SOURCE_ITEM_UNCOVERED | RULE_SOURCE_MISSING | RULE_CONFLICT | AUTHORITY_ESCALATION |
  RETIREMENT_EVIDENCE_INCOMPLETE | RECONCILIATION_MISSING | MIGRATION_EVIDENCE_INVALID |
  IO_ERROR | PARSE_ERROR | USAGE_ERROR`. Schema/semantic/corpus codes exit `1`; the final three
  operational/protocol codes exit `2`. Multiple violations are ordered by source path, locator,
  rule ID, then code.
- Runtime dependencies are exactly `ajv` and `yaml`, pinned to the versions used by current
  sibling validators. A dependency-allowlist test enforces the exact set.

## Allowed Files

- `plugins/foreman-line/authority-registry/package.json`
- `plugins/foreman-line/authority-registry/package-lock.json`
- `plugins/foreman-line/authority-registry/tsconfig.json`
- `plugins/foreman-line/authority-registry/biome.json`
- `plugins/foreman-line/authority-registry/README.md`
- `plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`
- `plugins/foreman-line/authority-registry/schemas/authority-enforcement-registry.schema.json`
- `plugins/foreman-line/authority-registry/src/types.ts`
- `plugins/foreman-line/authority-registry/src/schemas.ts`
- `plugins/foreman-line/authority-registry/src/registry.ts`
- `plugins/foreman-line/authority-registry/src/generate.ts`
- `plugins/foreman-line/authority-registry/src/validate.ts`
- `plugins/foreman-line/authority-registry/src/index.ts`
- `plugins/foreman-line/authority-registry/src/cli.ts`
- `plugins/foreman-line/authority-registry/tests/schema-validation.test.ts`
- `plugins/foreman-line/authority-registry/tests/semantic-invariants.test.ts`
- `plugins/foreman-line/authority-registry/tests/corpus-sweep.test.ts`
- `plugins/foreman-line/authority-registry/tests/parity.test.ts`
- `plugins/foreman-line/authority-registry/tests/dependency-allowlist.test.ts`
- `plugins/foreman-line/authority-registry/tests/bare-specifier.test.ts`
- `plugins/foreman-line/authority-registry/tests/fixtures/pass-minimal.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-identity-mutation.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-location-mutation.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-value-mutation.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-stale-source.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-duplicate-rule.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-contradictory-authority.yaml`
- `plugins/foreman-line/authority-registry/tests/fixtures/reject-missing-source.yaml`

If any required file is not listed above, stop and request a coordinator-ratified spec amendment
before editing or creating it. Globs, directory-wide authority, and implied adjacent files are
not permitted.

## Forbidden

- Editing this spec, the charter, plan review, loop directive, historical plan, convention,
  coordinator pattern, standing constraints, goal/PDD skills, spec-linter, permission profiles,
  approval package, routing policy, contracts package, manifests outside this package, or any
  other pre-existing file.
- Touching the ambient `D:/Repos/agent-skills` checkout or absorbing its user-owned
  `plugins/foreman-line/routing-policy/routing-policy.yaml` change.
- Hooks, host adapters, MCP registration/server code, SQLite/state runtime, leases/transitions,
  Docker/container/launcher work, CI workflow wiring, manifests/marketplace metadata, Jira,
  SCM writes, cloud, signing, deployment, publication, billing, credentials, Docker socket, or
  repository-setting changes.
- Implementing FK-P1 through FK-P21 behavior, including Allowed Files compilation,
  `authorizeAction`, control admission, hook refusals, enforcement promotion, or receipt minting.
- Treating `surfaces:` as mutation authority, a permission-profile allow list as containment,
  an integrity digest as a receipt/signature, a passing validator as Gate 1/2/3 evidence, or a
  builder/coordinator claim as independent verification.
- Rewriting stale/historical artifacts to remove contradictions. Only registry mappings and
  migration evidence may reconcile them in FK-P0.

## Existing Patterns To Follow

- `plugins/foreman-line/spec-linter/` - draft-07 schema/type parity, all-errors validation,
  deterministic `0/1/2` CLI, and exact dependency allowlist. Do not copy its stale prose.
- `plugins/foreman-line/permission-profiles/` - concrete YAML registry plus structural and
  semantic invariants; preserve its honest loaded-session and shell-residual limitations.
- `plugins/foreman-line/schema-scaffold/` - shared `SchemaFile`/generation machinery via exact
  filesystem-relative ESM imports; no bare package specifier or new workspace linkage.
- `plugins/foreman-line/routing-policy/` - stable names and semantic validation over a reviewed
  YAML policy, read as a pattern only. The routing policy file itself is forbidden.

## Step 0 Requirements

Before any FK-P0 implementation edit, the builder must restate and stop for coordinator
confirmation with all of the following:

1. Parcel intent, `critical / architecture-risk` routing, no dependencies, exact branch and
   worktree, and all 28 Allowed Files by exact path.
2. The full Forbidden and Out of Scope boundaries, including no ambient-checkout, routing-policy,
   historical-artifact, hook/MCP/SQLite/Docker/CI/external-effect, or receipt-mint work.
3. The authority contract: Git canon precedence, protected-operation matrix, exact six
   classifications, migration-evidence requirement, and human/independent-verifier boundaries.
4. Read-only checks showing the worktree branch, clean pre-edit status, merge-base ancestry of
   `51857a3a7796b393c0c0a68712f98c06e7015d79`, and byte identity of every source-corpus path
   against that commit. Any drift is a stop, not an automatic source-snapshot update.
5. Verification commands, expected test/fixture inventory, two-review requirement, and the rule
   that no code or file creation begins until the coordinator confirms Step 0.

The coordinator must stop rather than confirm if the restatement changes a locked decision,
widens a security/external-effect boundary, omits an Allowed File, finds source drift, discovers
a competing owner for `authority-registry`, or relies on self-asserted authority.

## Required Tests

- Schema acceptance/rejection and TypeScript/JSON-Schema parity.
- Shipped full-registry validation and exact locator/value coverage of the source corpus; a
  separate parcel-time check records full-file snapshot hashes without shipping a byte freeze.
- One independent negative control for each required classification, authority tier/effect,
  protected operation, retirement precondition, and migration status.
- Golden mutation controls that independently mutate identity, source location, and normalized
  value and prove each axis fails without updating its binding evidence.
- Explicit stale-source, duplicate-rule, contradictory-authority, missing-source, uncovered-
  inventory-item, orphan-rule, traversal, absolute-path, normalized-path-collision,
  symlink/reparse, non-regular-file, locator-digest, and normalized-value-digest rejections.
- A negative control changes unrelated bytes outside every registered locator and proves the
  shipped sweep remains green, while a normalized operative-value change without migration
  fails. This test is mandatory evidence that Standing Constraint #12 is honored.
- Protected-operation mutations proving agent-callable/control-state/tool-issued/self-asserted
  Gate 1, FK Gate 3, independent-verifier, closure, and generic-mint authority all fail.
- Gate vocabulary, Gate 3 scope, linter/profile, `surfaces:`/Allowed Files, permission-profile
  limitation, and missing-provenance reconciliation records are required and mutation-bound.
- Determinism/write-sentinel test: repeated validate/sweep calls produce identical ordered
  results and no repository changes.
- Dependency allowlist and no-bare-specifier tests.

## Acceptance Criteria

1. The exact Allowed Files produce a repo-contained `@foreman-line/authority-registry` contract
   package with only the declared relative source-time `schema-scaffold` boundary; no
   pre-existing file changes and no unlisted file is created.
2. The shipped YAML validates against the closed draft-07 schema and the semantic validator;
   generated schema bytes match the committed schema and TypeScript/JSON-Schema fixtures agree.
3. Every rule-bearing inventory item in the exact source corpus is mapped or explicitly
   dispositioned; every active rule has a valid identity/location/normalized-value binding; the
   source sweep passes with zero uncovered items, orphan rules, missing active sources,
   missing/moved locators, stale normalized values, duplicate normalized paths, or unknown
   mappings. Full-file hashes at `51857a3a7796b393c0c0a68712f98c06e7015d79` are captured only
   as parcel-time evidence and are not a shipped validation predicate.
4. Every rule has stable identity, exact source binding, applicability, severity, one of the six
   required classifications, decision semantics, enforcement owner, assurance, retirement
   state, and corpus-sweep evidence appropriate to that state.
5. Precedence is scope-aware and fail-closed: a higher-tier FK rule controls an in-scope conflict;
   historical/generic rules remain visible; an unlisted or equal-authority contradiction returns
   `CONFLICT` and cannot be selected silently.
6. The operation matrix enforces the protected rows exactly as stated in Constraints. No
   registry mutation can make human approval, FK merge, independent-verifier evidence, closure
   authority, or generic receipt minting ordinary agent-callable/control-state authority.
7. All six required reconciliation records are present with exact source/probe evidence and
   scoped dispositions. The coordinator's parcel-time diff proves the inventoried historical/
   stale artifacts were not edited by FK-P0; the shipped suite contains no whole-file byte pin.
8. `surfaces:` is never represented as mutation authority; current lack of an Allowed Files body
   compiler is recorded as a gap owned by FK-P2, not misclassified as a current refusal.
9. Permission-profile rules distinguish loaded mediated denial, post-review Git detection,
   detected-only non-enrollment, and unsupported residual shell/bypass cases without overclaim.
10. No rule reaches `retired-from-agent-reading` without all four D11 evidence classes; the
    missing provenance target prevents retirement of the thirteen standing constraints.
11. All required negative fixtures and mutation controls fail for their named invariant, and
    reviewer mutation of each named axis makes the corresponding formerly-green test fail.
12. Both CLI commands honor the `0/1/2` contract, return all ordered violations, remain read-only,
    and return byte-identical results for identical inputs. Unrelated bytes outside registered
    locators do not change the result; a changed normalized operative value does.
13. `npx tsc --noEmit`, `npm test`, `npx biome check .`, full-registry `validate`, and pinned-source
    `sweep` pass in PowerShell under Node >=22 with complete, untruncated output.
14. README documents the authority hierarchy, schema, classifications, operation matrix,
    migration records, CLI/exit codes, source-snapshot procedure, retirement rule, and the
    explicit non-authority of checksums, profiles, admission capabilities, validator results,
    and control state.
15. Two independent fresh reviews return no unresolved blocker; findings and mutation probes are
    evidence for the human Gate 3 decision, not a substitute for it.

## Verification

Run sequentially in PowerShell from `plugins/foreman-line/authority-registry`; capture complete
output before reading `$LASTEXITCODE`:

```powershell
node -v
npm ci
npx tsc --noEmit
npm test
npx biome check .
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
git status --short
git diff --name-only 51857a3a7796b393c0c0a68712f98c06e7015d79...HEAD
```

Success means Node satisfies the package's `>=22` engine, every command exits `0`, the sweep
reports the pinned source commit with zero gaps/conflicts, and the final diff contains only the
exact Allowed Files. Negative CLI fixtures must also be invoked without truncating output and
must return exit `1`; bad invocation/unreadable input must return exit `2`.

## Verification Plan

The deterministic commands above prove schema/type parity, semantic invariants, source binding,
negative fixtures, formatting, and exact-scope cleanliness. The two independent reviews then
probe the natural-language inventory and authority-confusion cases that a self-authored corpus
manifest cannot independently prove.

Mandated reviewer focus questions:

1. Does the inventory actually cover every rule-bearing item in every named source, or did the
   curated locator list make an omission invisible to its own sweep?
2. Can identity, location, or normalized value be changed independently or together while the
   binding/migration evidence still passes?
3. Can a stale, missing, duplicate, equal-tier, generic, or historical rule silently become the
   operative FK rule instead of producing the documented scoped result or `CONFLICT`?
4. Can admission, a permission profile, a checksum, SQLite-shaped state, a receipt-shaped object,
   or a caller-provided principal be misread as Gate 1, Gate 2, Gate 3, independent-verifier, or
   closure authority?
5. Are two-gate/three-gate and Stage-A approval terms genuinely separated by namespace, or can a
   naïve consumer grant the wrong operation by reading `gate: 1/2/3` without scope?
6. Does any code path write, use a clock/network/randomness, escape the repo root, follow a
   symlink/reparse point, or reach a forbidden package/runtime surface?

## Evidence Required

- Starting and ending commit SHAs; exact `git status --short` and changed-file list.
- Full outputs and exit codes for every command in Verification Plan, including named negative
  fixture probes and the final write sentinel.
- Machine-readable validator/sweep summary with source snapshot, source/item/rule counts,
  classification counts, reconciliation IDs/statuses, and zero unresolved active conflicts.
- Pre/post hashes or Git diff evidence proving every inventoried pre-existing source is unchanged.
- Fixture inventory mapping each rejection fixture to the exact invariant and observed stable
  refusal code.
- Two independent review reports, reviewer-session identities, clean-worktree assertions,
  finding dispositions, and closure evidence for every blocker.
- Completed Session Handoff and local PR notes. No receipt, approval, merge, or closure claim is
  evidence unless produced by its independently authorized process outside this parcel.

## Out of Scope

- Any runtime enforcement, hook refusal, host enrollment, MCP read/control catalog, local
  capability issuance, `authorizeAction`, SQLite state, lease/transition engine, Docker image,
  launcher, CI backstop, enforcement promotion, or second-host adapter.
- Exact Allowed Files body compilation and path normalization (FK-P2), lifecycle/admission/
  decision contracts (FK-P1), and all downstream FK-P3-FK-P21 implementation.
- Updating or repairing the stale spec-linter README/warning/convention text, historical gate
  wording, the absent defects-lessons ledger, permission profiles, or routing policy.
- New human-gate authority, delegated Gate 3, independent-verifier impersonation, generic or
  authoritative receipt minting, signing/key management, merge/closure issuance, or external
  system credentials/effects.
- Global Foreman canon cleanup. Reconciliation is scoped to the FK registry and migration
  evidence; other goals retain their own ratified authorities.

## Context & References

- `plugins/foreman-line/docs/goals/foreman-kernel/charter.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
- `plugins/foreman-line/skills/goal/SKILL.md`
- `plugins/foreman-line/skills/parcel-driven-development/SKILL.md`
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md`
- `plugins/foreman-line/approval/README.md`
- `plugins/foreman-line/spec-linter/`
- `plugins/foreman-line/permission-profiles/`
- `plugins/foreman-line/schema-scaffold/`

## Collision Risk

**High.** The new registry becomes an upstream contract/serialization surface for FK-P1, FK-P2,
FK-P12, FK-P16, FK-P18, and FK-P19. Only FK-P0 may create or edit the exact
`plugins/foreman-line/authority-registry/` files listed here until human Gate 3 and merge. Downstream
parcels must branch/rebase after the FK-P0 merge and request an amendment rather than editing the
registry silently. Existing spec-linter, permission-profile, routing-policy, contract, manifest,
lockfile, hook, Docker, and CI serialization points are forbidden and remain with their assigned
owners.

## PR Notes

- **What changed:** Added the versioned, source-bound FK authority/enforcement registry contract,
  full standing-rule inventory, migration evidence, validator, corpus sweep, and hostile fixtures.
- **Why:** Implements FK-P0 under the ratified Foreman Kernel charter before runtime contracts
  freeze.
- **Risk:** Incorrect precedence or authority modeling could let downstream code manufacture
  human/independent authority or enforce stale prose; high collision risk for downstream contracts.
- **Verification:** Run the exact deterministic pass and both independent reviews; inspect mutation
  failures and source coverage beyond CI green.
- **Evidence:** Attach command outputs, sweep summary/counts, source-diff proof, fixture map, review
  reports, and blocker dispositions. Human Gate 3 remains pending after a green PR.

## Session Handoff

- Starting commit:
- Ending commit:
- Files changed:
- Commands run:
- Tests passed:
- Tests failed:
- Source/item/rule/classification counts:
- Reconciliation status:
- Independent review status:
- Decisions needed:
- Blockers:
- Next safe action:
- Do not touch: ambient checkout; user-owned routing-policy change; every path outside Allowed Files;
  human/independent-verifier/merge/closure authority.

## Stop-and-Report Rule

Stop and report if implementation needs a product or authority decision absent from this spec; a
registered locator is missing/moved or its normalized operative value changed without migration;
a contradiction has no scoped precedence/migration record; a protected operation can be
manufactured from agent-callable/control state; a competing
parcel owns a required serialization point; a security boundary cannot close in-parcel; the same
tripwire fires twice; or any required file is outside Allowed Files.

Do not amend the contract, expand the source corpus, change an Allowed File, update the source
snapshot, reinterpret `surfaces:` as permission, or fix a stale historical artifact from the
builder session. Request a coordinator-ratified spec/charter amendment and await a new Step 0.
