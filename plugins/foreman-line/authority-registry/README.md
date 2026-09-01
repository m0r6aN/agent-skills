# Foreman Kernel Authority Registry

`@foreman-line/authority-registry` is the source-bound FK-P0 model of which inventoried Foreman
rules are operative, whose authority they express, and what enforcement posture can be claimed.
It is a curated registry, schema, deterministic validator, and read-only source sweep.
It is not a runtime policy engine, hook, admission service, receipt issuer, or authorization API.

## Authority hierarchy

The registry preserves this scope-aware order, highest first: explicit developer ratification;
the Foreman Kernel goal charter; ratified Foreman contracts and `SPEC-CONVENTION.md`;
`COORDINATOR-PATTERN.md` and the `goal` skill; parcel specs; standing constraints and role
kickstarters; generated projections, caches, and advisory documents. A higher active FK-specific
rule controls an in-scope conflict without deleting a lower generic rule outside that scope.
Applicability is compared across goal, role, stage, operation, and host; historical, stale,
superseded, advisory, and retired readings do not become active authority. An unlisted equal-tier
active contradiction fails closed as `RULE_CONFLICT`.

Git remains authoritative for ratified canon, reviews, human gates, merge evidence, and committed
proof. Registry records, checksums, validator output, profiles, admission capabilities, control
state, MCP responses, hooks, and receipt-shaped objects cannot create or replace that authority.

## Contract and source binding

`authority-enforcement-registry.yaml` has a closed draft-07 shape with schema version `0.1.0`.
Every source records its exact repo-relative path, kind, tier, effect, scope, parcel-time snapshot
evidence, and an ordered curated inventory. Every registered inventory item either maps one or
more rule IDs or has one explicit exclusion disposition. The sweep proves that declared locators
remain bound; completeness of the natural-language inventory still requires two independent
reviews and is not proved by a self-authored manifest.

Each rule independently binds:

- stable identity (`sourceId` plus `itemId`);
- typed location (`locatorDigest` over canonical JSON of `{ anchor, kind }`); and
- normalized semantic value (`valueDigest` over `normalizeRuleText` output).

`normalizeRuleText` applies Unicode NFC, normalizes CRLF/CR to LF, trims every line, discards empty
lines, joins remaining lines with one ASCII space, and collapses remaining Unicode whitespace.
`lineHint` is review assistance only and is excluded from identity and digests.

The rule `bindingDigest` covers the complete normative record: subject, claim, statement, the
single source-contained `authorityBasisRef`, source references, applicability, severity,
classification, decision, refusal code, owner, assurance,
paired rules, retirement state, and retirement evidence, as well as the rule ID.
Canonical JSON uses NFC strings, recursively sorted object keys, preserved array order, and no
insignificant whitespace. These digests are integrity checks only—not receipts, signatures,
approval, verification verdicts, merge authorization, or closure evidence.

The complete exact 18-source ID/path set, full-file SHA-256 values, and `sourceSnapshotCommit`
record the FK-P0 dispatch baseline. The sweep resolves every declared snapshot path from that
commit and compares its bytes with the declared hash. It does not require the current worktree's
whole-file hash to remain frozen: unrelated local bytes outside discovered/inventoried constructs
remain valid, while a missing/moved locator or changed normalized operative value fails and
requires a typed migration chain. This is the Standing Constraint 12 boundary.

## Rule classifications

Every rule has exactly one primary classification. The generator assigns it through an explicit
per-item curation entry; source-wide, keyword-derived, default, and terminal fallbacks are not
permitted:

- `pre-action-refusal`: a declared default-deny rule with `REFUSE` and a stable refusal code;
  `structural` versus `mediated` assurance states what the registered source actually proves.
- `post-action-detection`: evidence that detects a violation after mutation or execution.
- `ci-static-check`: deterministic static or CI evidence; it is not human authority.
- `independent-review-human-judgment`: a fresh mechanically distinct reviewer/verifier decision.
- `narrative-provenance`: mapped context or authority provenance without mechanical enforcement.
- `unsupported`: an honest host, enrollment, bypass, or residual-capability limitation.

Loaded permission-profile denial is host-adapter-owned and `mediated` only when the emitted
worktree-local settings were loaded.
Unenrolled/bypass cases are unsupported, and reviewer residual shell capability is checked by
post-review Git detection. Missing enrollment is never described as a refusal.

## Protected operation matrix

- Gate 1 ratification/amendment is human-developer only and returns `REQUIRE_HUMAN` without the
  required Git evidence. It is never agent-callable, state-satisfiable, or tool-issued.
- Gate 2 dispatch admits only the coordinator and is agent-callable only after exact
  charter-scoped Git authorization exists.
  State may record consumption but cannot mint the grant.
- FK Gate 3 merge is nondelegated and human-developer owned.
- Verification evidence requires an independent-reviewer principal; builders and coordinators
  cannot verify their own work.
- Closure records admit only the coordinator after a real human merge and its prerequisites;
  they cannot authorize those prerequisites.
- Generic receipt minting is absent/refused in this release and admits zero principals.
- External writes—including Jira, SCM, cloud, signing, deployment, publication, billing,
  credentials, Docker socket, and repository settings—admit zero principals and remain
  unauthorized by this goal.

Principal identity is admission-derived and never caller-self-asserted. The semantic validator
rejects operation-row mutations that promote protected operations into ordinary control state.

## Reconciliation and migration

Six required typed records reconcile without rewriting historical sources:

1. historical two-gate/stage vocabulary versus the FK Gate 1/2/3 namespace;
2. generic contingent Gate 3 delegation versus FK's human-only merge;
3. the live six-profile linter enum versus stale deferred-registry prose;
4. routing-only `surfaces:` metadata versus exact body-level Allowed Files;
5. loaded permission-profile mediation versus unenrolled/bypass and residual shell cases; and
6. the absent `plugins/foreman-line/docs/transcripts/defects_lessons.md` provenance target.

`resolved-for-fk` means downstream FK consumers have one scoped rule; it does not mean older canon
was edited or globally invalidated. The missing provenance record stays `open`, preserves all
thirteen standing rules, and prevents their retirement.

Eight additional `superseded-by-amendment` records bind the R2 and R4-R10 reworks to their prior
registry commits, the pinned source snapshot, prior binding-manifest digests, superseding
manifests, and complete controlling `SourceRef` values. The R10 migration starts from exact R9
commit `89d7e4853a8fb0af3db68e9262e38833062fba77` without rewriting the preserved R9 record. A future coordinated
identity/location/value change must
ship another coordinator-ratified typed migration; rewriting internally consistent YAML is not
enough.

A rule can become `retired-from-agent-reading` only when all four correctly typed evidence
references resolve to distinct digest-bound JSON artifacts: predicate contract, negative-refusal
test, corpus sweep, and an independent-reviewer bypass attempt. Rationale and provenance remain
mapped after retirement.

## Authority resolution

`resolveAuthority(document, query)` is a pure, read-only registry lookup. Queries are concrete;
`any` and `all-foreman-goals` are invalid query values. It filters non-controlling source effects
and classifications, applies exact scope matching, selects the highest applicable tier, and
returns an uppercase `RESOLVED`, `REQUIRE_HUMAN`, or `CONFLICT` outcome with sorted rule IDs.
It does not authorize actions or replace Git evidence. No applicable candidate returns
`REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY`.

## CLI

From this package:

```powershell
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
```

Both commands emit one deterministic JSON result to stdout and perform no writes. Exit codes are:

- `0`: structurally, semantically, and—when sweeping—source-bound valid;
- `1`: schema, semantic, conflict, or corpus violation; and
- `2`: usage, I/O, or parse failure.

Violations are returned together and ordered by source path, locator, rule ID, then stable code.
The sweep accepts only exact repo-relative source paths below the supplied root and refuses
absolute/traversal paths, containment escape, duplicate normalized paths, symlink/reparse targets,
non-regular files, missing or duplicate locators, and changed normalized values. It does not use
the clock, randomness, network, environment-derived identity, or Git mutation.
Git-backed reconciliation evidence additionally requires the exact root of a real worktree,
commit-typed objects, and commit-bound canonical missing-path evidence. Every Markdown source in
the 18-source corpus uses the same complete paragraph/list/table discovery with wrapping-stable
semantic locators; there is no source, section, heading, or keyword allowlist.
Properly paired HTML comments and CommonMark-compatible fence boundaries are the only Markdown
spans suppressed by that discovery; visible text around comments, unmatched comments, mixed fence
delimiters, four-space pseudo-fences, and backtick-fence info strings containing a backtick remain
visible. Fence validity is determined from the raw line before HTML-comment masking, and the same
fence map suppresses numbered standing-constraint discovery inside valid fenced blocks. All nine
goal exits, all seventeen charter stop bullets, all thirteen integration scenarios, all five
refusal-class rows, all twenty-two parcel contracts, and the five literal Wave 0–4 exit contracts
are published individually; loop completion and gate bodies are separate operative rules where
the source states them. Goal-skill and coordinator-pattern rules have item-specific, basis-honest
classification, identity, and five-axis applicability; their corroborating basis remains visible
to resolution without being promoted into binding authority. Gate 2 dispatch, Gate 3 merge, and
verification custody use shared cross-source authority subjects with role-, stage-, operation-,
and host-specific applicability. FK Gate 3 agent-side refusals apply only to coordinator merge
repo mutations and state transitions; builder runtime external writes and CI reads remain outside
that rule scope.
Inventoried TypeScript sources use the
TypeScript 7 compiler syntax tree for operative top-level statements, runtime value and side-effect
imports, and nested callable bodies. Compiler-recognized ambient and type-only declarations or
imports are intentionally non-operative, and import order is ignored only when the canonical
runtime module/binding set is unchanged. JSON schema leaves and every permission-profile `allow`,
`ask`, `deny`, and `network` entry have source-aware inventories. These are bounded source-specific
claims, not a general Markdown policy compiler.

Stable codes are closed to those exported by `RESULT_CODES` in `src/types.ts`.

## Generation and verification

`npm run generate` deterministically regenerates the committed schema, curated source-bound
registry, and named mutation fixtures from the pinned local corpus. It is an authoring command,
not part of the read-only validator/CLI surface. Runtime dependencies are exactly `ajv@8.20.0`,
`typescript@7.0.2`, and `yaml@2.9.0`;
the only sibling boundary is the exact relative source-time `schema-scaffold` import.

Run the parcel verification sequentially:

```powershell
node -v
npm ci
npx tsc --noEmit
npm test
npx biome check .
npx tsx src/cli.ts validate authority-enforcement-registry.yaml
npx tsx src/cli.ts sweep authority-enforcement-registry.yaml --repo-root ../../../
```

Green deterministic checks and checksums remain evidence inputs only. Two independent fresh
architecture/risk reviews and the human Gate 3 decision remain outside this package.
