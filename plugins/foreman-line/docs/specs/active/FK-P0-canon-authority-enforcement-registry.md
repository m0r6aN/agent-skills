---
ticket: FK-P0
title: Foreman Kernel - canon authority and enforcement registry
status: active
owner: clinton.morgan
created: 2026-08-31
updated: 2026-09-01
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

The validator nevertheless binds the declared baseline evidence in an exact source manifest over
`{sourceId,path,sourceKind,authorityTier,authorityEffect,scope,snapshotEvidence}`. For each source,
the sweep reads the path from `snapshotEvidence.commit` with Git, hashes those committed bytes,
and requires equality with `snapshotEvidence.fullFileSha256`; it does not compare that hash to
the current worktree file. A recomputed or zeroed declared snapshot hash therefore fails while
ordinary current-source changes outside registered semantic locators remain permitted.

Locator identity is independent of physical Markdown wrapping. A numbered item or bullet locator
uses its semantic list identity and aggregates all continuation lines before normalization; it
never incorporates the first physical line's complete text. Reflowing unchanged normalized text
across lines must preserve item ID, locator digest, and value digest.

For every Markdown paragraph or list item, the `anchor` is also independent of its semantic value.
It is exactly the structural heading path plus block kind plus the one-based ordinal of that block
kind inside the heading container; it contains no normalized-text fragment, digest, slug, or other
content-derived token. `line-excerpt` is the locator kind used for an ordinary Markdown paragraph;
its anchor still follows this structural rule and is not permission to use excerpt text as
identity. A normalized-value-only edit therefore resolves the same locator and emits
`VALUE_DIGEST_MISMATCH`, never `LOCATOR_MISSING` plus `SOURCE_ITEM_UNCOVERED`. Moving a block or
inserting another same-kind block before it is a location mutation and is tested separately.

R12 applies that independence end-to-end. Every published Markdown paragraph/list item and its
inventory record use the structural block locator as the single canonical item; a legacy numbered
item or full-text `additionalAnchors` entry cannot remain as the active rule-bearing duplicate.
Every Markdown `itemId` is either derived from `{sourceId,kind,structuralAnchor}` or bound by an
explicit frozen structural-anchor-to-item-ID manifest. It never derives from normalized text, a
content hash, a legacy content-bearing anchor, a list marker number, or the first physical line.
Published `ruleId` values are likewise curated stable identities and cannot be regenerated from
changed normalized text. A value-only regeneration preserves `itemId`, `ruleId`, locator, and
locator digest while changing only normalized value/value digest.

This applies globally across every Markdown source and every published rule, not only anchors that
already begin `md-block:`. Markdown full-text `line-excerpt` anchors and Markdown
`additionalAnchors` content-identity escape hatches are prohibited. A list marker change such as
`1.` to `9.` without moving the block is a value mutation on the active item. A Markdown table row
uses `table-row` plus a stable row key such as `D1`, `R1`, or the first-column gate ID; the complete
row text belongs only in normalized value. Structural headings retain `heading` locators. R12
migration evidence preserves the exact historical R1-R11 records that referenced legacy locators
without allowing those legacy references to control the current inventory.

`AuthorityRule` must carry:

- immutable semantic `ruleId` independent of line number; `authoritySubject` and
  `authorityClaim` stable lower-case ID tokens; `normalizedStatement`; exactly one
  `authorityBasisRef` that is also present in `sourceRefs` and names the source text that
  substantively states this rule's semantic claim;
  `sourceRefs: SourceRef[]`; closed `applicability` with non-empty unique arrays of
  `GoalScope`, `RoleScope`, `StageScope`, `OperationScope`, and `HostPosture`; `Severity`;
- exactly one primary classification:
  `pre-action-refusal | post-action-detection | ci-static-check |
  independent-review-human-judgment | narrative-provenance | unsupported`;
- common decision semantics using only
  `ALLOW | REFUSE | ADVISORY | CONFLICT | REQUIRE_HUMAN`; enforcement owner; stable refusal
  code; `EnforcementOwner`; `AssuranceLevel`;
  unique paired/backstop rule IDs;
- `RetirementState` and closed `retirementEvidence` with nullable `EvidenceRef` values for
  `predicate`, `negativeRefusalTest`, `corpusSweep`, and `independentBypassAttempt`. All four are
  non-null only when state is `retired-from-agent-reading`; rationale/provenance remains mapped;
  and
- `bindingDigest`, recomputed from canonical JSON of the **complete normative rule record**:
  `{ruleId, authoritySubject, authorityClaim, normalizedStatement, authorityBasisRef, sourceRefs,
  applicability, severity, classification, decision, refusalCode, enforcementOwner,
  assurance, pairedRuleIds, retirementState, retirementEvidence}`. `assurance` is the public
  field whose value is an `AssuranceLevel`; no parallel `assuranceLevel` field exists. Omitting a normative
  field from this digest is prohibited. Canonical JSON is UTF-8 JSON with Unicode NFC strings,
  recursively lexicographically sorted object keys, array order preserved, and no insignificant
  whitespace. The registry validator also binds the exact source-ID/path set and every complete
  rule binding digest in a shipped manifest independent of input array cardinality; unknown or
  missing sources and coordinated semantic changes fail unless a typed migration record binds
  the prior committed manifest and superseding rules. The digest is an integrity checksum only,
  never a receipt, signature, approval, verification verdict, merge authorization, or closure
  artifact.

The six-classification set remains closed. `pre-action-refusal` names the pre-action policy layer,
not an invariant that every controlling record says `REFUSE`: it may use `decision: ALLOW` only for
an exact, bounded positive authorization grant already stated by binding canon. Ordinary denial
records remain `REFUSE`. A `pre-action-refusal`/`REFUSE` record has a non-null stable
`refusalCode`; a `pre-action-refusal`/`ALLOW` record has `refusalCode: null`. No other decision is
valid for that classification. Permission-profile `allow` entries are documentation of intent and
cannot become `ALLOW` authority. The exact Gate 2 coordinator-dispatch grants are `ALLOW`; generic
minting, external writes, Gate 1, Gate 3, independent-verification issuance, merge, and closure do
not acquire `ALLOW` rules in R11. Any positive grant beyond the exact Gate 2 rules requires a
future coordinator-ratified contract amendment with precise principal and operation semantics.

The exact R12 `ALLOW` set contains only these three binding records and no others:

- `rule.fk-charter.15a44cf50bc6`, whose basis explicitly says the standing Gate 2 grant is
  authorized and resumed;
- `rule.fk-loop-directive.47a75730afd6`, whose basis says standing Gate 2 is active; and
- `rule.fk-loop-directive.bfffee6d7c1f`, whose basis explicitly authorizes Gate 2 dispatch.

`rule.coordinator-pattern.91dd60b00fd6` describes that dispatch approval is delegable when a
charter-scoped standing authorization is granted at ratification or later; it does not itself
perform that ratification or grant. It remains visible as corroborating non-grant guidance with
`narrative-provenance` / `ADVISORY` / `provenance-only` / `narrative`, and must never be `ALLOW` or
enter the active resolver candidate set. The validator binds the exact three-rule `ALLOW` set and
rejects any fourth record even when its subject is `gate2.dispatch-grant` or its source is
corroborating.

Rules with overlapping applicability and the same `authoritySubject` but different
`authorityClaim` values are semantic contradictions. Rules at the selected highest tier with the
same subject and claim but different decisions are also contradictions; a claim label cannot hide
an allow/refuse split. Active higher-tier binding authority may
control only in its overlapping scope; equal-tier contradictions and unlisted lower/higher-tier
contradictions return `CONFLICT`. Narrative, historical, stale, retired, and unsupported rules
remain visible but cannot control active authority. Export a pure `resolveAuthority(document,
query)` that returns the controlling rule IDs and claim, `REQUIRE_HUMAN`, or `CONFLICT`; absence
of a reported conflict is not itself a precedence result.

`AuthorityQuery` is exactly `{ authoritySubject, goal, role, stage, operation, host }`.
`authoritySubject` follows the common ID pattern. Query applicability is always concrete:
`goal` is `foreman-kernel`; `role`, `stage`, `operation`, and `host` use their corresponding
scope enums with `any` excluded. A rule matches when its axis contains the exact query value or
`any`; `all-foreman-goals` also matches `foreman-kernel`. Query inputs containing `any` or
`all-foreman-goals` are invalid and return `REQUIRE_HUMAN` with
`reasonCode: INVALID_QUERY_SCOPE`.

`AuthorityResolution` is exactly one of:

```ts
type AuthorityResolution =
  | {
      outcome: 'RESOLVED'
      authoritySubject: string
      authorityClaim: string
      decision: 'ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN'
      controllingRuleIds: string[]
      consideredRuleIds: string[]
    }
  | {
      outcome: 'REQUIRE_HUMAN'
      authoritySubject: string
      reasonCode: 'INVALID_QUERY_SCOPE' | 'NO_APPLICABLE_AUTHORITY'
      controllingRuleIds: []
      consideredRuleIds: string[]
    }
  | {
      outcome: 'CONFLICT'
      authoritySubject: string
      conflictingClaims: string[]
      conflictingDecisions: ('ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN')[]
      controllingRuleIds: []
      consideredRuleIds: string[]
    }
```

All ID arrays and claims are unique and lexicographically sorted. The resolver first filters to
matching, non-historical/non-stale, non-`historical-only`, non-narrative, non-unsupported rules
from binding sources, then selects the highest applicable `AuthorityTier`. Multiple highest-tier
rules with one claim and one decision resolve together and return that controlling decision;
multiple claims or multiple decisions at that tier return `CONFLICT`. No candidate returns
`REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY`. Lower-tier rules remain in `consideredRuleIds` but
cannot override the selected tier.

`authoritySubject` is a curated semantic question, never a source ID, item ID, locator hash, or
per-rule namespace. Statements in different sources that answer the same authority question use
the same subject even when their wording differs. The shipped identity manifest binds the exact
subject/claim mapping for every rule and must contain repeated subjects for every required
reconciliation; an all-unique subject graph is invalid. At minimum, the generic coordinator,
`SPEC-CONVENTION`, historical plan, and FK charter statements about Gate 3 share
`gate3.merge-authority`. The four charter mappings found incorrect by R3 review are exactly:

- D2: subject `canon.operational-authority-boundary`, claim
  `git-canon-sqlite-operational-split`;
- D3: subject `kernel.surface-admission-separation`, claim
  `read-control-admission-separated`;
- D18: subject `kernel.authorize-action-owner`, claim
  `provider-neutral-policy-engine`; and
- D19: subject `repository.read-confidentiality`, claim
  `admission-bound-contained-read`.

Every required reconciliation has a shipped-data resolver vector that proves its real competing
rules meet on a shared subject and either resolve to the stated higher-tier claim or return the
required conflict. Synthetic tests that rewrite subjects at test time do not satisfy this
requirement. Authority tier and effect are derived only from `authorityBasisRef`; other
`sourceRefs` cannot promote a rule. The basis ref may be binding, corroborating, historical,
stale, or advisory according to its real source; only a rule whose basis source is binding may
enter the active resolver candidate set. Narrative/historical rules therefore retain honest
nonbinding bases and visibility without acquiring authority. The basis text must substantively
state the rule's exact subject/claim; a source-wide default label or unrelated schema leaf is
invalid. `retired-from-agent-reading` is excluded from active resolver candidates exactly like
`historical-only`; validation and resolution share one active-authority predicate.

Subject and claim assignment is curated per inventory item. Distinct operative standing rules,
PDD rules, schema constraints, linter branches, and permission-profile rules do not share one
catch-all subject/claim merely because they share a source. Two rules may share a subject only
when their basis texts genuinely answer the same semantic question. Standing provenance is a
separate provenance rule and never replaces the thirteen operative standing-rule identities.
The permission-profile enforcement reconciliation uses charter D7's loaded/enrollment boundary,
not D9's human-gate boundary.

Inventory coverage and authority-rule publication are deliberately different. Every discovered
semantic source item is inventoried, but only a genuinely normative unit becomes an
`AuthorityRule`. Headings, metadata, isolated schema scalar leaves, structural AST coverage
items, explanatory fragments, and other non-normative items use the existing explicit exclusion
disposition plus a specific rationale. They are still source-bound and sweep-visible; they do not
receive invented authority semantics. Every published rule appears in a closed curated identity
manifest keyed by exact source/item with its human-readable subject, claim, classification, and
applicability. There is no fallback subject/claim generator. A subject or claim containing an
item hash/suffix, `requires-<hash>`, or a source-ID-plus-item namespace is invalid. Validation
rejects any rule absent from the curated manifest and any manifest entry whose basis text does
not substantively support its semantics.

Classification is a literal required field in every per-item curation entry. No source-wide
branch, source-kind branch, keyword rule, or terminal default may assign classification; absence
of an exact curated classification fails closed. This prohibition includes a terminal
`narrative-provenance` fallback. Operative loop-directive grants, gates,
verification-custody requirements, stop conditions, completion conditions, and required wave
exits must carry their honest operative classification rather than inheriting narrative status
from their source.

Literal curation is not sufficient when its semantics are source-dishonest. Every published
`goal-skill` and `coordinator-pattern` rule receives a basis-supported operative classification,
decision, owner, assurance, subject/claim, and precise five-axis applicability. In particular,
explicit Gate-1 nondelegability, Gate-2 authorization, commentary-not-being-canon-authority,
verification custody, human-completable gate stops, ownership stops, and scoped Gate-1 reopening
cannot be `narrative-provenance`/`ADVISORY` merely because their source is a skill or coordinator
pattern. They cannot enumerate every concrete role, stage, operation, and host unless their basis
expressly makes each axis universal. Source-derived positive and negative natural queries bind
the intended semantics of every operative rule from those two sources.

The curation manifest has one explicit entry per published source/item; source-wide or multi-item
omnibus branches are prohibited. Two different normalized statements may share a subject because
they answer the same question, but they may share a claim only when a separate closed
`semanticEquivalence` manifest names both rule IDs and explains their equivalent meaning. Without
that record, distinct statements require distinct human-readable claims. At minimum, distinct
`SPEC-CONVENTION` lifecycle, status/folder, mutation-authority, approval, and validation statements
are independently curated rather than labeled with one omnibus lifecycle claim.
Charter and loop-directive statements that answer the same authority question use the same
authority subject even when their claims remain distinct. In particular, the loop Gate 2 grant,
human-owned Gate 3 rule, and coordinator verification-custody rule align respectively with
`gate2.dispatch-grant`, `gate3.merge-authority`, and the exact charter verification subject; a
source-local queue/authorization subject may not fragment those questions or make an
out-of-scope query pass by subject mismatch.

One Markdown inventory item may map to multiple distinct `AuthorityRule` records when its source
block contains independently operative clauses. Each rule has its own curated subject, claim,
classification, decision, owner, assurance, and applicability while sharing the same exact basis
item. Collapsing a compound normative block into one catch-all rule is invalid. In particular, the
paragraph in `COORDINATOR-PATTERN.md` under `The long-running loop` publishes six distinct rules:

- ownership transfer only at parcel boundaries under `goal.coordinator-ownership`;
- frozen-contract modification stop under `goal.stop.ratified-boundary`;
- twice-fired tripwire stop under `goal.stop.tripwire`;
- unclosed in-parcel security finding stop under `goal.stop.security-boundary`;
- outward-facing work beyond standing authorization stop under `goal-stop.external-capability`;
  and
- empty-queue stop under `goal.stop.incomplete-empty-queue`.

The six rules align with the existing charter/loop rules under those shared semantic questions;
they are not six aliases of the ownership subject. Independently written source-derived resolver
vectors cover, respectively, coordinator/runtime state transition, coordinator/runtime spec
mutation, coordinator/runtime state transition, coordinator/runtime state transition,
coordinator/runtime external write, and coordinator/runtime state transition on a
`provider-neutral` host. Matching negative vectors are written from source meaning, not generated
from the shipped rule's own applicability arrays.

Exclusions use one closed code plus an item-specific rationale:
`heading-only | table-header | structural-ast | schema-container | duplicate-exact-statement |
non-normative-explanation | example-only | fenced-code | type-only`. The generic phrase
“metadata, explanatory context, or duplicate provenance” and any combined catch-all rationale are
forbidden. A duplicate exclusion names the exact published rule with byte-equivalent normalized
meaning. D/R rows, numbered standing/PDD rules, ratification/grant/merge/verification records,
binding MUST/required/prohibited statements, exit criteria, and stop conditions cannot be
excluded. Validation rejects exclusion of these protected normative item classes. Every binding
charter decision D1-D20 is published with a binding basis and active semantics; shipped resolver
tests prove at least D2 and D18 return `RESOLVED` with their exact claims in natural FK queries.
`narrative-provenance` is reserved for provenance/history/rationale text and cannot classify an
operative binding requirement merely because no enforcement mechanism exists yet.

The protected normative manifest additionally binds these four complete Markdown blocks as
published operative rules, never exclusions or first-line substitutes:

- `SPEC-CONVENTION.md` / `Allowed Files Mutation Authority`: the three-line exact-path/glob
  prohibition beginning “Every dispatchable spec must contain”; and the three-line stop,
  coordinator-ratification, and no-self-expansion block beginning “If implementation requires”;
- `parcel-driven-development/SKILL.md` / `Contract Amendment Rule`: “Agents do not edit approved
  contracts directly from parcel branches.”; and
- `parcel-driven-development/SKILL.md` / `Session Handoff`: the complete mandatory handoff
  sentence beginning “Every agent session that changes”.

Their normalized statements are built from the complete semantic block, including continuation
lines. A truncated physical first line cannot substitute for the block. These are explicit curated
protected items, not the output of a source-wide keyword heuristic; exclusion, truncation, or
replacement with a nearby explanatory item fails validation and the sweep.

All nine numbered goal-exit requirements and all seventeen charter stop-condition bullets are
protected normative items and must be published individually; headings/intros may be excluded,
but no exit/stop body may be `non-normative-explanation`. Wave exit contracts in the loop
directive are likewise published when they state required completion or gate conditions.
The charter's thirteen integration scenarios, five initial refusal-class rows, and all twenty-two
ratified parcel-graph rows are also protected normative items. Each scenario's required outcome,
each refusal class's initial classification/evidence duty, and each parcel's owner/dependency or
serialization contract is individually published with a basis-supported classification,
authority subject/claim, and literal applicability. They cannot be excluded as
`non-normative-explanation`, collapsed into a table container, or represented only by the two
currently active/next queue rows.

Each curation entry contains a literal complete five-axis applicability record. No helper may
derive applicability from classification, decision, source kind, or a default “all axes” branch;
there is no applicability fallback. Validation binds that per-entry literal and tests natural
out-of-scope queries for protected grants. In particular, the Gate 2 coordinator-dispatch grant
does not resolve for builder/runtime/external-write/unsupported-host.
This applies to every published loop-directive rule as well as charter, standing, PDD, linter,
schema, and profile rules. A loop grant, gate, stop, completion, or verification rule cannot use
all roles/stages/operations/hosts merely because it came from the loop source. The Gate 2 negative
query must stay out of scope after considering every rule under the shared
`gate2.dispatch-grant` subject, not by filtering a narrative classification or using a different
subject.

Permission-profile authority is limited to the mediation that actually exists. Every configured
deny or restrictive network entry is curated to the role represented by its exact profile, the
relevant operation/stage, and host `claude-windows-docker-loaded`; its enforcement owner is
`host-adapter` and its assurance is `mediated`. The 54 shipped permission-profile registry rules
must each have an item-specific five-axis record rather than one full cross-product. Profile
`allow` entries remain nonbinding documentation (`narrative-provenance`/`ADVISORY`) and never
authorize an operation. An unenrolled session, unsupported host, CI host, or wrong role has no
applicable permission-profile authority and returns `REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY` when
no other binding rule applies. Post-action Git detection and CI checks, when supported by their own
source basis, are separate rules and never masquerade as loaded-session refusals.

Permission-profile section headers and YAML container labels are structural inventory only and
cannot substantiate a configured denial, prompt, grant, or network claim. In particular,
`item.ffd2209ab94a` is the literal `builder-architecture:` header and is explicitly excluded;
obsolete `rule.permission-profiles-registry.ffd2209ab94a` is absent. The actual reviewer
`Bash(git commit*)` denial remains bound only to its exact canonical YAML rule item. Validation and
tests reject any rule whose permission-profile basis is only a profile/header/container label,
even when that rule is merely advisory.

Every active `gate3.merge-authority` rule that expresses this goal's nondelegated human merge
boundary uses precise merge applicability. Agent-side refusal records apply to the coordinator at
the merge stage for merge-related `repo-mutation` and/or `state-transition` operations on host
`any`; they do not include `developer` inside a `pre-action-refusal`/`REFUSE` rule and do not
resolve for builder/runtime/external-write/unsupported-host or
ci/deterministic-verify/repo-read/ci. Both coordinator/merge/repo-mutation/any and
coordinator/merge/state-transition/any are positive resolver vectors across the shared subject;
the protected-operation matrix, not an overbroad rule, preserves the human-developer principal.

An absence claim such as “no Allowed Files body compiler exists” cannot use one unrelated return
statement as its authority basis. Such a claim is represented only by its exact reconciliation
record with source/command evidence that establishes the absence; structural return/AST items
remain excluded as `structural-ast`. Remove the shipped
`frontmatter-only-no-body-compiler` rule unless its basis itself states that claim.

`EvidenceRef` is exactly `{ kind, path, digest }`, where `kind` is
`predicate-contract | negative-test | corpus-sweep | independent-bypass`, `path` is an exact
repo-relative non-glob path, and `digest` is a SHA-256 over that evidence artifact's bytes. The
four retirement fields require their matching `kind`; a rule is
`retired-from-agent-reading` if and only if all four references are present and independently
resolvable. The four paths must be distinct. Each target is a UTF-8 JSON evidence artifact with
closed shape `{schemaVersion:'0.1.0', kind, ruleId, sourceCommit, result:'pass', producerClass,
producerRef, inputDigest, outputDigest}`; its `kind` and `ruleId` must match the referencing slot
and rule. `independent-bypass` requires `producerClass: independent-reviewer`; no one file,
self-label, README, source file, or unrelated test can satisfy multiple classes. The sweep walks
every path component, rejects links/reparse points/non-files/escape, hashes the bytes, parses the
artifact, and validates this semantic contract. Evidence digests bind evidence identity; they do
not freeze unrelated canon files.

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

The seven rows are exact and immutable. Evidence must resolve to the operative sentence or
record, never merely to its heading:

- `gate1.ratify`: principals `[human-developer]`, the exact 2026-08-31 ratification and scoped
  re-ratification records plus nondelegable
  Gate-1 canon refs, missing decision `REQUIRE_HUMAN`, all three booleans false;
- `gate2.dispatch`: principals `[coordinator]`, exact charter standing Gate-2 grant plus loop
  dispatch-authorization refs, missing decision `REFUSE`, `agentCallable: true`, other booleans
  false. Builder execution after dispatch is a separate downstream operation and is not a
  dispatch principal;
- `gate3.merge`: principals `[human-developer]`, exact human-owned FK Gate-3 decision and stop/
  dispatch canon refs, missing
  decision `REQUIRE_HUMAN`, all booleans false;
- `verification.issue`: principals `[independent-reviewer]`, exact mechanically-distinct fresh
  reviewer requirement and coordinator-consumes-but-never-produces-verification canon refs,
  missing decision `REFUSE`, all booleans false;
- `closure.record`: principals `[coordinator]`, exact real-human-merge prerequisite and Stage-F
  closure canon refs, missing decision `REFUSE`, all booleans false; and
- `receipt.mint-generic` and `external.write`: empty principals/evidence, missing decision
  `REFUSE`, all booleans false.

Every required `SourceRef` must resolve across source ID, item ID, locator digest, and value
digest to the named fact. A generic policy statement, irrelevant rule, or self-hashed claim is
not evidence of a grant, verdict, merge, or closure prerequisite.

Protected evidence is tested against its resolved normalized text, not a frozen but semantically
wrong item ID. Gate 1 includes both the original 2026-08-31 “Ratify Gate 1 and authorize Gate 2
dispatches” record and the scoped “Re-ratify Gate 1 amendments R1-R13 and resume Gate 2” record,
plus the nondelegability statement. Gate 2 includes the actual standing grant text that explicitly
authorizes coordinator dispatch after ratification and the operative loop authorization—not an
abbreviated decision-list summary. Gate 3 and verification use their exact operative records as
already specified. Removing any named fact, or substituting a nearby heading/list summary, fails.

`verification.issue` additionally includes the exact loop-directive sentence that the
coordinator consumes but never produces independent verification. D11 retirement criteria or a
two-review count may corroborate reviewer independence, but neither substitutes for that
anti-self-verification statement.

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

Evidence-kind semantics are exact. `source-ref.reference` is canonical JSON for a complete
resolving `SourceRef`. `git-commit.reference` is a 40-character commit SHA and the sweep verifies
its Git object bytes/digest. `missing-path.reference` is an exact repo-relative path and the
sweep verifies absence at the record's commit evidence. `command-result.reference` is canonical
JSON containing `{tool, toolVersion, commandId, inputDigest, resultDigest, exitCode,
actorClass}`; it is supporting diagnostics only and cannot by itself resolve or supersede an
authority conflict. All evidence digests are recomputed over their canonical reference or Git
object. The six required reconciliations have topic-specific exact observed source/reference
sets and controlling rule IDs; arbitrary substitutions, duplicate IDs, self-hashed prose, and
an incorrect topic/status fail. A `superseded-by-amendment` migration additionally requires the
prior registry commit Git object, prior manifest digest, changed identity/location/value or
semantic bindings, and the complete superseding `SourceRef`.

The complete expected reconciliation record is immutable, including `scopedDisposition` and
`unresolvedConsequence`; validator comparison binds both normalized prose fields, not only IDs,
refs, and status. It also binds the exact ordered-as-set `observedEvidence` entries: kind,
canonical reference, digest, cardinality, and topic-specific membership. Removing one evidence
entry or substituting any other valid source ref, commit, command result, or absent path fails.
For `missing-provenance-reference`, the only missing path is exactly
`plugins/foreman-line/docs/transcripts/defects_lessons.md` at the explicitly bound snapshot
commit. A delegated-merge, no-human-evidence, or arbitrary-absent-path rewrite therefore fails
even when all digests are recomputed. Git-dependent evidence is never optional: `sweep` requires that
`repoRoot` resolve to a real Git worktree whenever any reconciliation contains `git-commit` or
`missing-path` evidence. It verifies `git cat-file -t <sha>` is exactly `commit` before hashing
the commit object. `missing-path.reference` is canonical JSON
`{commit:<verified-commit-sha>,path:<exact-repo-relative-path>}` and absence is checked in that
specific commit tree. Missing Git metadata, a blob/tree/tag substituted for a commit, an
unresolvable object, or an unbound missing-path commit is `MIGRATION_EVIDENCE_INVALID` and fails
closed.

Exact reconciliation binding applies to **every** shipped record, including each
`registry-rework-*` migration, not only the original six topics. A closed reconciliation manifest
binds the complete canonical record digest for every reconciliation ID. No extra, duplicated,
removed, reordered-as-set, or substituted evidence entry is allowed. Rework command evidence is
exactly bound across tool, toolVersion, commandId, inputDigest, resultDigest, exitCode, and
actorClass; retaining one expected digest while changing provenance or appending a self-hashed
diagnostic fails.

R10 ships a typed `registry-rework-*` migration whose prior commit is exactly
`89d7e4853a8fb0af3db68e9262e38833062fba77`, whose prior manifest digest is recomputed from that
commit's registry, whose source snapshot remains exactly
`51857a3a7796b393c0c0a68712f98c06e7015d79`, and whose superseding manifest and complete changed
semantic bindings are exact. R10 cannot rewrite or omit the R9 migration record.

R11 ships a typed `registry-rework-*` migration whose prior commit is exactly
`f3366be12175acb4fd4aeb32c301c845b906a5da`, whose prior manifest digest is recomputed from that
commit's registry, whose source snapshot remains exactly
`51857a3a7796b393c0c0a68712f98c06e7015d79`, and whose superseding manifest and complete changed
semantic bindings are exact. R11 preserves every R1-R10 rework/reconciliation record; it may not
rewrite or omit prior history to make the new model validate.

R12 ships a typed `registry-rework-*` migration whose prior commit is exactly
`9059bb249f75805b34a68397d53dfa5608fd6ad4`, whose prior manifest digest is recomputed from that
commit's registry, whose source snapshot remains exactly
`51857a3a7796b393c0c0a68712f98c06e7015d79`, and whose superseding manifest and complete changed
semantic bindings are exact. R12 preserves every R1-R11 rework/reconciliation record byte-
semantically; locator modernization does not rewrite historical evidence.

### Validator and CLI boundary

- Export pure `validateRegistry(document)` and a read-only
  `sweepRegistrySources(document, repoRoot)`; all failures use typed result objects with stable
  codes. Do not write receipts, sidecars, timestamps, caches, source files, or registry updates.
- Export pure `resolveAuthority(document, query)` with the subject/claim semantics above.
- CLI commands are only `validate <registry-path>` and
  `sweep <registry-path> --repo-root <path>`. Exit `0` means valid/fully bound, `1` means schema
  or semantic/corpus violation, and `2` means usage/read/parse failure. All violations are
  emitted; policy conflict is not converted into an untyped process crash.
- `sweep` reads only exact repo-relative source paths declared in the registry beneath the
  supplied repository root; it rejects absolute paths, traversal, containment escape,
  symlink/reparse targets, non-regular files, duplicate normalized paths, missing/moved
  locators, and changed normalized-value digests. It does not compare full-file snapshot hashes.
- The initial corpus is the exact eighteen source IDs and paths enumerated in this spec. The
  schema/validator reject any missing, duplicate, substituted, or nineteenth source regardless
  of array length. Expansion requires a spec amendment and typed registry migration.
- Source-aware discovery must fail on any new or collapsed `D<number>`/`R<number>` table row,
  numbered standing/PDD rule, binding gate/grant/stop/authority bullet or prose block in the goal
  canon, material JSON-schema enum/constraint, permission-profile rule/deny, or operative
  validator/CLI branch in the inventoried live sources. Heading labels, arbitrary substring
  anchors, comments, and preserved dead-code lines are not proof of operative behavior.
- For every Markdown source in the complete source corpus, inventory every visible paragraph,
  list item, and table row unless a shipped exact exclusion manifest identifies that item and
  gives an item-specific non-normative rationale. The shared fence/comment-aware block builder
  runs for every Markdown source; source-ID allowlists or early returns that limit prose blocks to
  the charter and loop directive are prohibited. Section-number, heading-name, and keyword
  allowlists are likewise prohibited: locked decisions, gates, authority, dispatch grants, stop
  conditions, branch/serialization requirements, and newly added unnumbered prose all receive the
  same discovery treatment. Headings alone are never coverage.
  Baseline controls prove exact custody for the goal skill's verification, human-gate-stop, and
  loop-stop prose; the coordinator pattern's ownership/universal-stop and scoped-Gate-1 prose;
  PDD's branch and serialization requirements; and ordinary operative prose in
  `SPEC-CONVENTION`. Equivalent ordinary-prose additions to each of those four sources fail the
  sweep until explicitly curated or item-specifically excluded.
- Ordered Markdown list discovery accepts both CommonMark delimiters, `1.` and `1)`, and emits one
  independent inventory item per list item with its continuation lines. Appending two consecutive
  parenthesized items to a Markdown source outside the charter produces two distinct uncovered
  list-item violations, not one paragraph violation.
- Markdown comment handling removes only the exact characters inside properly paired HTML comment
  spans and preserves visible text before and after a same-line comment. Multi-line comment state
  is tracked only when a matching close exists. An unmatched `<!--` is not treated as a
  comment-to-EOF and cannot hide following prose; it is inventoried as visible malformed content
  or produces an uncovered-item violation. A line is excluded only when no visible normalized
  text remains. A closed comment prefix cannot hide visible prose.
- Fence opener and closer validity is determined from the raw normalized Markdown lines before
  HTML comment masking. The resulting paired-fence line set is then combined with the visible-text
  view for block discovery. Comment removal may never delete a backtick from a backtick fence info
  string and thereby turn a raw invalid opener into a valid hiding fence. Specifically, a raw
  backtick opener whose info text is `lang<!--` followed by a backtick and `-->` remains invalid
  and cannot suppress the following prose.
- Fenced code follows CommonMark fence boundaries: the opener has at most three leading spaces,
  uses backticks or tildes, and records delimiter kind and run length; only the same delimiter
  with at least the opener's run length and at most three leading spaces closes it. Mixed
  delimiters and four-space-indented pseudo-fences do not toggle state. Only content inside a
  correctly paired fence is non-operative; an unclosed opener cannot suppress later visible
  authority prose without a typed uncovered/malformed result.
  A backtick-fence info string containing any backtick is not a valid opener; it remains visible
  Markdown and cannot begin fence state. Tilde info strings follow CommonMark independently.
  Every Markdown discovery pass—paragraphs, headings, numbered rules, tables, and additive
  D/R/PDD/gate checks—consumes the same paired-fence/comment-aware block map. No secondary raw-line
  scanner may rediscover valid fenced examples as operative headings or numbered rules. Every
  numbered-rule scanner iterates by line index and skips the shared fenced-line set, including the
  standing-constraints additive scanner as well as PDD and goal/loop scans.
- TypeScript discovery uses the TypeScript compiler syntax tree, not a regular-expression list of
  declaration spellings. Inventory every non-import top-level statement and each complete
  function/method/constructor/accessor/arrow body, including function, const, let, var, class,
  default/named export, expression/call, and anonymous forms. Serialize a deterministic semantic
  token/AST representation that ignores comments, whitespace, line wrapping, and import order
  while preserving operative syntax and nesting. An inserted early return, branch, method,
  class, top-level call, or declaration must add/change an inventory item even when old anchors
  remain. JSON Schema discovery analogously inventories every constraint node. Comments, type-
  only declarations, and unreachable text cannot satisfy an operative construct locator.
- Validation is deterministic: identical registry/source bytes return byte-identical ordered
  results. No clock, randomness, network, environment-derived identity, or Git mutation is used.
- Stable result codes are closed to: `SCHEMA_INVALID | SOURCE_PATH_INVALID |
  SOURCE_PATH_ESCAPE | SOURCE_NOT_REGULAR | SOURCE_SYMLINK_FORBIDDEN |
  SOURCE_DUPLICATE_PATH | LOCATOR_MISSING | LOCATOR_DUPLICATE |
  LOCATOR_DIGEST_MISMATCH | VALUE_DIGEST_MISMATCH | RULE_DUPLICATE | RULE_ORPHANED |
  SOURCE_ITEM_UNCOVERED | RULE_SEMANTICS_UNCURATED | RULE_SOURCE_MISSING | RULE_CONFLICT |
  AUTHORITY_ESCALATION |
  RETIREMENT_EVIDENCE_INCOMPLETE | RECONCILIATION_MISSING | MIGRATION_EVIDENCE_INVALID |
  IO_ERROR | PARSE_ERROR | USAGE_ERROR`. Schema/semantic/corpus codes exit `1`; the final three
  operational/protocol codes exit `2`; any sweep containing `IO_ERROR`, `PARSE_ERROR`, or
  `USAGE_ERROR` exits `2` even when semantic violations are also present. Multiple violations
  are ordered by source path, locator,
  rule ID, then code.
- Runtime dependencies are exactly `ajv`, `yaml`, and `typescript`; `typescript` is pinned to
  `7.0.2` and supplies the syntax-tree inventory. A dependency-allowlist test enforces the exact
  set. No general parser implemented with declaration-matching regular expressions satisfies the
  TypeScript discovery contract. Runtime imports are operative inventory items: side-effect
  imports and every module specifier/binding of value imports are set-bound, so changing or adding
  one fails while reordering the identical import set remains green. Only declarations proven
  `import type`/type-only by the syntax tree are excluded. The canonical value-import record sorts
  named/default/namespace runtime bindings independently of source clause order and omits type-
  only specifiers, so `{Ajv, type SchemaObject}` and `{type SchemaObject, Ajv}` are identical.
  Ambient `declare` functions/classes/namespaces/modules and exported ambient variants are
  type-only/non-operative; runtime namespaces, enums, static blocks, object methods, IIFEs, and
  dynamic imports remain operative.
- Permission-profile YAML discovery inventories each profile plus every canonical nested
  `allow`, `ask`, `deny`, and network rule path/value. Adding, deleting, retargeting, or moving a
  rule between profiles changes coverage; profile-name presence or one command anchor is not
  sufficient. Ordering-only YAML changes with identical canonical rule sets remain benign.

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

R9 starts from the independently verified R8 baseline of 350 passing tests. The builder adds at
least eleven independently named R9 controls and the final combined suite contains at least 361
tests. The R9 controls separately cover: thirteen scenario publications; five refusal-row
publications; twenty-two parcel-row publications; literal classification on every curated rule;
absence of source/default classification fallback; loop Gate 2 subject/classification/
applicability; loop Gate 3 subject/classification/applicability; exact coordinator verification
custody; operative loop stop/completion semantics; the raw mixed comment/backtick info-string
case; and a valid fenced standing-constraint number. A combined count-only assertion cannot
replace any named control.

R10 starts from the independently verified R9 baseline of 362 passing tests. The builder adds at
least twenty-two independently named R10 controls and the final combined suite contains at least
384 tests. Those controls separately cover: universal Markdown block-map construction with no
source-ID allowlist; baseline goal-skill, coordinator-pattern, PDD, and `SPEC-CONVENTION` block
custody; additive ordinary prose in each of those four sources; source-honest classification and
positive/negative resolver vectors for every operative goal/coordinator rule; named Gate-1,
Gate-2, commentary-authority, verification-custody, and human-gate-stop semantics; positive
coordinator merge queries for both repo mutation and state transition; negative Gate-3 builder
runtime/external-write and CI/read queries; and independently named append, remove, duplicate,
and substitute mutations of `registry-rework-91145d7`. A source-derived loop must also prove those
four mutations apply to every shipped `registry-rework-*` record. Count-only, map-length, or
happy-path-only assertions do not satisfy these controls.

R11 starts from the coordinator-verified R10 baseline of 402 passing tests. The builder adds at
least thirty independently named R11 controls and the final combined suite contains at least 432
tests. They separately cover: content-independent Markdown anchors with no content hash/token;
value-only mutation resolving the same locator and producing `VALUE_DIGEST_MISMATCH`; a separate
move/location mutation; two independent `1)`/`2)` uncovered list items in another Markdown source;
all six rules from the compound coordinator-loop paragraph; explicit source-authored positive and
negative queries for each of those six rules; publication and full-block basis of both named
`SPEC-CONVENTION` blocks and both named PDD blocks; rejection of exclusion, truncation, and nearby-
item substitution for those blocks; loaded-host positive permission-profile mediation; unenrolled,
unsupported-host, CI-host, and wrong-role negative queries; precise per-item applicability for all
54 permission-profile rules; Gate 2 rules using `decision: ALLOW`; resolver propagation of the
controlling decision; same-highest-tier same-claim/different-decision conflict; and rejection of
any unapproved `ALLOW`. R11 also has independently named happy, append, remove, duplicate, and
substitute controls for its migration record, and the all-rework-record loop continues to exercise
every prior record. Tests may not derive expected natural queries, decisions, subjects, or clause
counts from the registry data under test.

R12 starts from the coordinator-verified R11 baseline of 447 passing tests. The builder adds at
least twenty independently named R12 controls and the final combined suite contains at least 467
tests. They separately cover: a global assertion that every published Markdown paragraph/list rule
uses one structural canonical locator; no Markdown raw-text `line-excerpt` or `additionalAnchors`
escape; migration of all sixteen R11 published raw-text Markdown rules; stable keyed table-row
identity; active standing-rule marker renumbering as `VALUE_DIGEST_MISMATCH` without locator loss;
no excluded structural duplicate substituting for the active ordered item; generator-level value-
only stability of item ID, rule ID, locator, and locator digest for both an ordered rule and the
compound coordinator paragraph; rejection of a content-derived legacy item ID; exact three-rule
Gate 2 `ALLOW` set; coordinator-pattern delegation guidance as advisory non-grant; rejection of a
fourth/corroborating/unratified `ALLOW`; exclusion of every permission-profile header/container;
absence of `rule.permission-profiles-registry.ffd2209ab94a`; exact binding of reviewer git-commit
denial to its canonical YAML rule; rejection of any profile claim based on a structural header;
exact R1-R11 record preservation; and independently named R12 migration happy, append, remove,
duplicate, and substitute controls. Tests examine the complete Markdown/profile inventory and
exact approved sets; they may not filter to already-compliant anchors or derive expected identity
from the generated registry under test.

- Schema acceptance/rejection and TypeScript/JSON-Schema parity.
- Shipped full-registry validation and exact locator/value coverage of the source corpus; a
  separate parcel-time check records full-file snapshot hashes without shipping a byte freeze.
- One independent negative control for each required classification, authority tier/effect,
  protected operation, retirement precondition, and migration status.
- Golden mutation controls that independently mutate identity, source location, and normalized
  value, complete normative semantics, source-set membership, and authority subject/claim and
  prove each axis fails without typed prior-to-new migration evidence.
- Explicit stale-source, duplicate-rule, contradictory-authority, missing-source, uncovered-
  inventory-item, orphan-rule, traversal, absolute-path, normalized-path-collision,
  symlink/reparse, non-regular-file, locator-digest, and normalized-value-digest rejections.
- A negative control changes unrelated bytes outside every registered locator and proves the
  shipped sweep remains green, while a normalized operative-value change without migration
  fails. This test is mandatory evidence that Standing Constraint #12 is honored.
- Protected-operation mutations proving agent-callable/control-state/tool-issued/self-asserted
  Gate 1, dispatch, FK Gate 3, independent-verifier, closure, generic-mint, and external-write
  authority all fail; exact evidence references and coordinator-only dispatch are mutation-bound.
- Gate vocabulary, Gate 3 scope, linter/profile, `surfaces:`/Allowed Files, permission-profile
  limitation, and missing-provenance reconciliation records are required and mutation-bound.
- Negative controls add a nineteenth source; downgrade classification/applicability/retirement;
  add D/R table rows, numbered hard rules, binding bullets/prose, and live executable behavior;
  preserve an anchor in dead code/comment; reuse one unrelated evidence file for all retirement
  classes; substitute self-hashed reconciliation prose; and use a missing repo root. Every case
  fails with its named semantic or operational code.
- Resolver tests use explicit `authoritySubject`/`authorityClaim` values for higher-tier,
  equal-tier, scope-disjoint, historical/stale, and naturally differently worded contradictions;
  they assert the selected controlling IDs/claim or `CONFLICT`, not only absence of violations.
- Shipped-data resolver tests exercise every required reconciliation without rewriting subjects;
  assert the exact D2, D3, D18, and D19 mappings; prove a corroborating ref cannot promote tier;
  and prove `retired-from-agent-reading` can never control.
- Applicability tests provide source-derived positive and negative query vectors for each of the
  thirteen standing constraints and fifteen PDD hard rules. A hand-curated applicability
  manifest binds the complete five-axis record for each rule; generator heuristics based only on
  item number or classification are prohibited. Each positive and negative test is a complete
  resolver query covering goal, role, stage, operation, and host and asserts the exact resolved
  rule, not merely array membership or one role axis. PDD hard rule 10 applies to every parcel
  regardless of scope and therefore matches ordinary builder/build/repo-mutation queries, not
  only Step 0/spec mutation. At minimum, hard rule 2 covers shaper, builder, and reviewer agents;
  hard rule 8 covers builder/build/repo-mutation when a product decision is missing; hard rule 12
  covers coordinator/merge/state-transition release gating; hard rule 13 covers coordinator
  multi-session state-transition before closure; and hard rules 14 and 15 cover their verification
  and release-claim contexts rather than only external write or closure.

  Applicability is never narrowed merely to make one exemplar query pass. For standing/PDD rules,
  goal is `all-foreman-goals` and host is `any` unless the source expressly narrows them. An axis
  the source does not narrow uses `any`; `any` is the correct representation for a universal
  axis, not a prohibited shortcut. Negative queries exist only where the source text expressly
  excludes a role/stage/operation/host. The exact minimum semantic coverage is:

  - standing builder-universal rules 1-5 and 13 cover builder work across stages/operations;
    conditional rules 6-7 retain their named condition but do not invent an unrelated stage;
  - standing reviewer rules 8-11 cover reviewer/adversarial work across relevant operations,
    including `control-call` for live-process probing and mutation checks; standing rule 12 covers
    coordinator deterministic/adversarial Stage-D/E source-inventory, repo-read, and repo-mutation
    checks as its own text states;
  - PDD rules 1, 3, 4, 5, and 11 include shaper/shaping and builder/step-zero/build contexts;
    rule 2 covers coordinator, shaper, builder, and reviewer across their parcel stages; rule 7
    includes builder/build verification; rule 6 covers the builder who must rebase as well as
    coordinator integration; rules 8-10 retain the scopes above; and
  - PDD rules 12-15 include coordinator/merge/state-transition or verification/release contexts
    required by their text, with reviewer/CI participation where the rule names security or
    evidence verification.

  Tests enumerate every concrete query in each declared axis cross-product and assert resolution
  for the curated rule. They also include the named natural queries from review, rather than only
  comparing the registry against a second hardcoded copy of itself.
- Reconciliation negative controls mutate each normalized `scopedDisposition` and
  `unresolvedConsequence`, sweep a copied corpus without Git metadata, substitute a blob for a
  commit, and bind a missing path to the wrong commit; every case fails closed.
- Protected-operation evidence tests assert the normalized meaning of every resolved evidence
  item, including the exact Gate-1 ratification records, human-owned Gate-3 statement, and
  coordinator-consumes-but-never-produces independent-verification statement. Heading-only or
  semantically irrelevant evidence fails.
- Discovery controls append a top-level call and each of function/const/let/var/class/default-
  export/method/arrow forms, add unnumbered prose under locked decisions, and insert a nested
  branch into an existing function. All operative additions fail; comment-only, whitespace,
  import-order, and Markdown-wrap-only changes remain green.
- Markdown controls place visible binding prose before and after same-line HTML comments and
  across multi-line comments. TypeScript controls add/retarget side-effect and value imports;
  those fail, while type-only imports and reordering an unchanged runtime-import set stay green.
- Markdown controls also cover unmatched comments, mixed backtick/tilde fences, longer/shorter
  closing runs, and four-space-indented pseudo-fences. Profile controls add, delete, retarget, and
  move nested allow/ask/deny/network entries. TypeScript controls prove ambient declarations stay
  benign while runtime namespaces/enums/static blocks/object methods/IIFEs/dynamic imports fail.
- Fence controls reject a backtick info string containing a backtick and prove visible following
  prose is inventoried. A backtick opener whose info text contains the mixed
  `lang<!--` + backtick + `-->` sequence is a required negative control: comment masking cannot
  make it valid, and following binding prose produces the stable uncovered result. Valid fenced
  headings, D/R rows, numbered PDD examples, and a standing-constraints `14. **MUST ...**`
  example remain ignored by every discovery layer, not re-scanned as raw Markdown.
- Curated-rule controls reject every hash-derived/fallback subject or claim and prove every
  non-normative inventory item is explicitly excluded rather than emitted as a pseudo-rule. They
  reject generic/combined exclusion rationales, protected normative exclusions, unlisted shared
  claims, and omnibus source-wide semantic mappings; D2 and D18 resolve actively.
- Reconciliation controls mutate, duplicate, append, remove, and substitute evidence in both the
  original six records and every `registry-rework-*` record; all fail exact record binding.
  The test matrix derives the complete shipped `registry-rework-*` ID set from the registry and
  exercises append, remove, duplicate, and substitute as independently named controls for every
  record. A hardcoded list ending at an earlier amendment or a happy-path-only assertion for the
  newest record is invalid.
- Protected-operation tests resolve and assert the exact Gate 1 original/scoped ratification and
  nondelegability text and exact Gate 2 standing-grant/loop text; nearby summaries are negative
  controls. Verification tests require the exact coordinator-consumes-but-never-produces sentence.
  PDD rule 6 resolves for a builder/build/repo-mutation query.
- Curation tests require publication of all nine goal-exit requirements, all seventeen charter
  stop bullets, and every normative wave-exit body. They reject any classification/default-based
  applicability fallback, assert each published entry carries literal applicability, and prove
  the Gate 2 grant does not resolve in a builder/runtime/external-write/unsupported-host query.
  They also require all thirteen integration scenarios, all five initial refusal-class rows, and
  all twenty-two parcel-graph contracts to be individually published; reject every source-wide or
  terminal classification fallback; require literal curated classification for every published
  item; and assert the loop Gate 2, Gate 3, verification, stop, and completion rules have honest
  classifications, shared authority subjects where they answer the charter's question, and
  precise per-item applicability.
- The unrelated linter return statement is excluded and cannot substantiate the absence of an
  Allowed Files body compiler; the reconciliation remains the only carrier of that scoped finding.
- Source-manifest controls mutate each `snapshotEvidence` commit/hash field and prove failure,
  while current unrelated bytes outside semantic locators do not become a full-file byte freeze.
- Determinism/write-sentinel test: repeated validate/sweep calls produce identical ordered
  results and no repository changes.
- Dependency allowlist and no-bare-specifier tests.

## Acceptance Criteria

1. The exact Allowed Files produce a repo-contained `@foreman-line/authority-registry` contract
   package with only the declared relative source-time `schema-scaffold` boundary; no
   pre-existing file changes and no unlisted file is created. Parcel implementation scope is
   measured from the immediately preceding coordinator-owned spec-amendment commit to the builder
   commit. Coordinator-authored active-spec commits may exist earlier on the same parcel branch
   and are reported separately; they are not builder mutation authority and do not make the
   builder's Allowed Files diff a 29-file parcel.
2. The shipped YAML validates against the closed draft-07 schema and the semantic validator;
   generated schema bytes match the committed schema and TypeScript/JSON-Schema fixtures agree.
3. Every rule-bearing inventory item in the exact source corpus is mapped or explicitly
   dispositioned; every active rule has a valid identity/location/normalized-value binding; the
   source sweep passes with zero uncovered items, orphan rules, missing active sources,
   missing/moved locators, stale normalized values, duplicate normalized paths, or unknown
   mappings. Full-file hashes at `51857a3a7796b393c0c0a68712f98c06e7015d79` are captured only
   as parcel-time evidence and are not a shipped validation predicate.
4. Every rule has stable identity, authority subject/claim, exact source binding, applicability,
   severity, one of the six required classifications, decision semantics, enforcement owner,
   assurance, retirement state, and corpus-sweep evidence appropriate to that state. The shipped
   manifest binds the full normative rule record and exact eighteen-source set without a
   cardinality-conditioned bypass.
   Each subject/claim is item-curated and substantively supported by its authority basis; source-
   wide catch-all semantic identities are invalid. The complete declared source baseline,
   including snapshot evidence, is independently manifest-bound.
5. `resolveAuthority` makes precedence scope-aware and fail-closed: a higher-tier FK rule controls
   an in-scope subject/claim contradiction; historical/generic rules remain visible; an unlisted
   or equal-authority contradiction returns `CONFLICT` and cannot be selected silently.
   Real shipped competing statements share curated subjects, tier comes only from the exact
   binding `authorityBasisRef`, and retired rules never control. A resolved result exposes its
   controlling decision; a highest-tier decision split returns `CONFLICT` even when the claim text
   is identical. Exact bounded Gate 2 dispatch grants resolve `ALLOW`.
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
   Profile authority applies only to the actual profile role on
   `claude-windows-docker-loaded`; unenrolled, unsupported, CI, and wrong-role queries do not
   inherit a configured profile refusal or grant.
10. No rule reaches `retired-from-agent-reading` without four distinct, content-typed, digest-
    verified D11 evidence artifacts bound to that rule; the missing provenance target prevents
    retirement of the thirteen standing constraints.
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
