# Foreman Kernel Authority Registry

`@foreman-line/authority-registry` is the source-bound FK-P0 contract for deciding which
Foreman rules are operative, whose authority they express, and what enforcement posture can be
claimed honestly. It is a registry, schema, deterministic validator, and read-only source sweep.
It is not a runtime policy engine, hook, admission service, receipt issuer, or authorization API.

## Authority hierarchy

The registry preserves this scope-aware order, highest first: explicit developer ratification;
the Foreman Kernel goal charter; ratified Foreman contracts and `SPEC-CONVENTION.md`;
`COORDINATOR-PATTERN.md` and the `goal` skill; parcel specs; standing constraints and role
kickstarters; generated projections, caches, and advisory documents. A higher FK-specific rule
controls an in-scope conflict without deleting a lower generic rule outside that scope. An
unlisted or equal-tier contradiction fails closed as `RULE_CONFLICT`.

Git remains authoritative for ratified canon, reviews, human gates, merge evidence, and committed
proof. Registry records, checksums, validator output, profiles, admission capabilities, control
state, MCP responses, hooks, and receipt-shaped objects cannot create or replace that authority.

## Contract and source binding

`authority-enforcement-registry.yaml` has a closed draft-07 shape with schema version `0.1.0`.
Every source records its exact repo-relative path, kind, tier, effect, scope, parcel-time snapshot
evidence, and an ordered inventory. Every inventory item either maps one or more rule IDs or has
one explicit exclusion disposition.

Each rule independently binds:

- stable identity (`sourceId` plus `itemId`);
- typed location (`locatorDigest` over canonical JSON of `{ anchor, kind }`); and
- normalized semantic value (`valueDigest` over `normalizeRuleText` output).

`normalizeRuleText` applies Unicode NFC, normalizes CRLF/CR to LF, trims every line, discards empty
lines, joins remaining lines with one ASCII space, and collapses remaining Unicode whitespace.
`lineHint` is review assistance only and is excluded from identity and digests.

The rule `bindingDigest` covers canonical JSON of `{ ruleId, sourceRefs, normalizedStatement }`.
Canonical JSON uses NFC strings, recursively sorted object keys, preserved array order, and no
insignificant whitespace. These digests are integrity checks only—not receipts, signatures,
approval, verification verdicts, merge authorization, or closure evidence.

The full-file SHA-256 values and `sourceSnapshotCommit` record the FK-P0 dispatch baseline. The
shipped sweep deliberately does not compare whole-file hashes. Unrelated bytes outside registered
locators remain valid; a missing/moved locator or changed normalized operative value fails and
requires a typed migration chain. This is the Standing Constraint 12 boundary.

## Rule classifications

Every rule has exactly one primary classification:

- `pre-action-refusal`: a mechanically mediated default-deny predicate with a stable refusal code.
- `post-action-detection`: evidence that detects a violation after mutation or execution.
- `ci-static-check`: deterministic static or CI evidence; it is not human authority.
- `independent-review-human-judgment`: a fresh mechanically distinct reviewer/verifier decision.
- `narrative-provenance`: mapped context or authority provenance without mechanical enforcement.
- `unsupported`: an honest host, enrollment, bypass, or residual-capability limitation.

Permission-profile denial is `mediated` only when the emitted worktree-local settings were loaded.
Unenrolled/bypass cases are unsupported, and reviewer residual shell capability is checked by
post-review Git detection. Missing enrollment is never described as a refusal.

## Protected operation matrix

- Gate 1 ratification/amendment is human-developer only and returns `REQUIRE_HUMAN` without the
  required Git evidence. It is never agent-callable, state-satisfiable, or tool-issued.
- Gate 2 dispatch is agent-callable only after exact charter-scoped Git authorization exists.
  State may record consumption but cannot mint the grant.
- FK Gate 3 merge is nondelegated and human-developer owned.
- Verification evidence requires an independent-reviewer principal; builders and coordinators
  cannot verify their own work.
- Closure records report a real human merge and its prerequisites; they cannot authorize them.
- Generic receipt minting is absent/refused in this release.
- External writes—including Jira, SCM, cloud, signing, deployment, publication, billing,
  credentials, Docker socket, and repository settings—remain unauthorized by this goal.

Principal identity is admission-derived and never caller-self-asserted. The semantic validator
rejects operation-row mutations that promote protected operations into ordinary control state.

## Reconciliation and migration

Six typed records reconcile without rewriting historical sources:

1. historical two-gate/stage vocabulary versus the FK Gate 1/2/3 namespace;
2. generic contingent Gate 3 delegation versus FK's human-only merge;
3. the live six-profile linter enum versus stale deferred-registry prose;
4. routing-only `surfaces:` metadata versus exact body-level Allowed Files;
5. loaded permission-profile mediation versus unenrolled/bypass and residual shell cases; and
6. the absent `docs/transcripts/defects_lessons.md` provenance target.

`resolved-for-fk` means downstream FK consumers have one scoped rule; it does not mean older canon
was edited or globally invalidated. The missing provenance record stays `open`, preserves all
thirteen standing rules, and prevents their retirement.

A rule can become `retired-from-agent-reading` only when all four correctly typed evidence
references exist: predicate contract, negative-refusal test, corpus sweep, and an independent
bypass attempt. Rationale and provenance remain mapped after retirement.

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

Stable codes are closed to those exported by `RESULT_CODES` in `src/types.ts`.

## Generation and verification

`npm run generate` deterministically regenerates the committed schema, source-bound registry, and
named mutation fixtures from the pinned local corpus. It is an authoring command, not part of the
read-only validator/CLI surface. Runtime dependencies are exactly `ajv@8.20.0` and `yaml@2.9.0`;
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
