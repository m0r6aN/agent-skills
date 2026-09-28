# @foreman-line/spec-body-compiler

FK-P2 spec-body compiler: parses the required SPEC-CONVENTION spec sections
and compiles the exact non-glob `Allowed Files` mutation authority plus the
frozen/forbidden surface lists into a deterministic, digest-bound
**compiled-scope artifact**. It rejects ambiguity, path traversal, equivalent
paths, symlink/reparse escape, and missing authority.

**D10 (load-bearing):** `surfaces:` is routing/audit metadata and is **never**
mutation authority. The compiler never derives, widens, validates, or
cross-checks any mutation path from `surfaces:` or any other frontmatter field.
Mutation authority comes exclusively from the `## Allowed Files` body section.
The proof vehicle is `GOLDEN-D10-01` (`tests/d10-golden-negative.test.ts`):
maximal `surfaces:` plus an empty `## Allowed Files` compiles to an **EMPTY**
mutation set (`allowedFiles: []`, `authorityState: 'empty'`) that is never
silently widened; `assertDispatchable` refuses it with `MISSING_AUTHORITY`.

## Consumer shape (declared; unchanged by implementation)

The compiler's output is `{ artifact, compiledScopeDigest }`:

- **FK-P2B** later consumes compiled spec bodies as `{ artifact, compiledScopeDigest }`
  and replaces the `surfaces:`-derived authority in `mutation-scope-guard` /
  `dispatch/src/approval-cli` (the D10 defect fix). FK-P2 performs no rewiring.
- **FK-P1** `trustedBindings.scopeDigest` (F05.4) binds `compiledScopeDigest`
  verbatim; P1 binds the value only, the preimage is FK-P2-owned (F05).
- **FK-P1** cache triple `[goalRevision, policyDigest, compiledScopeDigest]`
  (F05.16) uses it as its third binding.
- **FK-P12** later evaluates compiled scopes inside `authorizeAction`.

A consumer that receives an artifact whose `authorityState` is `empty` MUST
refuse every mutation (`MISSING_AUTHORITY`) — the empty set is never widened.

## Artifact

Closed document (JSON Schema: `schemas/compiled-scope.schema.json`):
`artifactVersion` (literal `0.1.0`), `grammar` (the pin: `SPEC-CONVENTION`,
`v0.4`, `2026-09-27`, section digest, file digest), `spec` (`ticket`,
`specPath` — identity only), `allowedFiles` (exact canonical repo-relative
paths, sorted, never globs), `frozenSurfaces` / `forbiddenSurfaces`
(`ScopeRef`: exact path or the deny-only `path/**` form, sorted),
`authorityState` (`granted` iff `allowedFiles.length > 0`), and
`compiledScopeDigest`. `surfaces:` never appears in any field.

All lists are sorted ascending by UTF-16 code-unit order of the canonical
spelling; canonical spelling is the exact input spelling — no Unicode
normalization, no path case folding (case folding is used only for collision
detection). Reordering source entries cannot change artifact bytes.

### `compiledScopeDigest`

Domain literal `foreman-line.spec-body-compiler.compiled-scope` (FK-P2-owned
per F05.5's ownership row). Preimage: the UTF-8 encoding of the canonical JSON
of `{domain, apiVersion: "0.1.0", payload: <artifact without its
compiledScopeDigest member>}`, SHA-256, emitted `sha256:` + 64 lowercase hex.
Canonical JSON follows the F05.5 byte-total rules (see
`src/canonical-output.ts`); the encoder is implemented locally from FK-P1's
recorded contract text — no cross-package import. Conformance is byte-bound by
`tests/fixtures/canonical/encoder-vectors.json` and cross-checked read-only
against FK-P1's canonical golden fixtures inside
`tests/canonical-output.test.ts` (OQ-3; `kernel-contracts/**` is read-only
test input and is never written).

## Grant/deny grammar asymmetry (OQ-2)

The `Allowed Files` grant list is exact and non-glob with no scope syntax of
any kind — mutation authority can never be widened by scope syntax. The
`path/**` directory-scope form is a **deny-only** construct, permitted
exclusively in `frozenSurfaces`/`forbiddenSurfaces`; any other glob syntax is
rejected everywhere.

Negative surfaces are compiled from the `**Forbidden surfaces (exact):**`
paragraph as corpus convention (Step-0 flag C ruling): items split on `;`
outside parentheses; an item whose first non-space character is a backtick is
an **entry** whose backticked token is the scope ref (annotation prose may
follow); items without a leading backticked token are prose commentary and are
not entries. Entries annotated `frozen` map to `frozenSurfaces`; all others map
to `forbiddenSurfaces`. An entry-shaped item (leading backtick) that fails
scope validation is rejected — never dropped.

## Validation

Default-deny with a fixed precedence chain: the first failing check of the
first failing entry (body order) rejects the whole compile with exactly one
named error code and its entry index; no partial artifact is ever emitted.
Order: (1) body UTF-8/cap; document frontmatter and required sections; (2)
entry line shape (`MALFORMED_ENTRY`, `ENTRY_EMPTY`, `ENTRY_WHITESPACE`); (3)
charset (null/control/format/unpaired surrogate); (4) `ENTRY_ENCODED_ESCAPE`;
(5) `ENTRY_ABSOLUTE`; (6) `ENTRY_BACKSLASH`; (7) `GLOB_ENTRY`; (8) per segment
in segment order (traversal, empty, ADS colon, 8.3 short name, reserved device
name, trailing dot/space, segment cap, NFC); (9) entry caps — segment count
before byte length; (10) entry count caps; (11) cross-entry duplicates,
equivalents (case-fold/NFC collisions), then `ENTRY_CONFLICTS_WITH_FORBIDDEN`.
The error registry (`src/errors.ts`) is closed at 35 named codes.

Input caps (OQ-4): body 1 MiB / entry 512 B / segment 128 B / ≤64 segments /
≤256 entries.

Parsing is linear (standing #19): a single-pass, non-recursive scanner, O(n)
in the UTF-8 body bytes with a hard cap of **4 byte examinations per input
byte** across the named phases (section split, entry lex, per-segment
validation, canonicalization), plus an O(k log k) sort (k ≤ 256).
`stats.bytesExamined` counts the content-inspecting passes; output
construction (copying decided bytes) is not an examination. No regular
expression with nested quantifiers or unbounded backtracking exists in the
parser. LIMIT-06/07/08 assert the bound on hostile input at 1x/2x/4x.

## Grammar pin and the known-base gap (Step-0 flag A)

`src/parse-spec.ts` exports the pin (`GRAMMAR_PIN`); `tests/grammar-pin.test.ts`
recomputes the §4 digest from the on-disk `docs/SPEC-CONVENTION.md` and
classifies exactly three states: (a) live bytes match the pinned digests →
PASS; (b) live bytes equal the known pre-v0.4 base (committed state at base
`7f3391c`) → record a machine-readable KNOWN-GAP
(`blocked: RCM-P2 schema-v0.4 delta uncommitted`) and PASS — the gap is named
in the exit annex until closed; (c) ANY other state → FAIL (fail-closed on
real drift). A grammar revision change is a spec amendment that bumps the pin
and the artifact version — never a silent re-pin.

## Link layer and the opened-target race

`verifyCompiledPaths(root, artifact)` walks every path component and the final
target with `lstat`, refusing any symlink, junction, or other reparse point —
including links whose targets remain inside the root (D19) — and refusing
non-regular targets (`LINK_TARGET_RACE`, a target-integrity refusal). Typed
errors: `LINK_ESCAPE`, `LINK_IN_ROOT`, `LINK_TARGET_RACE`. Consumers must
re-verify after open via `reverifyOpenedTarget(fd, expected)`, which compares
the OPENED handle's identity against the identity captured at check time —
detecting substitution even when the attacker swaps back off the path.

Fixture privilege rule (OQ-5): junction cases must execute (the chain
hard-fails otherwise); privilege-classed symlink cases may skip only with a
machine-readable `{"gap": …, "blocked": …}` record and are never counted as
passed — each skip is an evidence obligation of the FK-P18′ CI lane.

## Version/shape discipline (FK-P1 pattern)

Unknown fields, unknown enum values, missing required data, and over-limit
input fail closed; artifact version mismatch refuses; additive optional fields
require a negotiated newer version; renaming fields or widening meanings
requires a new artifact version and reviewed consumer migration.

## Package

Private ESM, Node >=22, TypeScript, biome. No cross-package imports; no
root/workspace manifest registration; no shared lockfile alteration. Runtime
APIs are pure (no filesystem/network/time/process side effects); the two
named I/O seams are `verifyCompiledPaths` and the pin test's file read, whose
failures surface as the package's own typed errors. There is deliberately no
generate script (the JSON Schema and fixture tables are source-authored; the
compiler emits artifacts at runtime).
