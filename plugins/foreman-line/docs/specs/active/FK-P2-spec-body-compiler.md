---
ticket: FK-P2
title: Foreman Kernel - spec-body compiler
status: draft
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
supersedes: null
superseded_by: null
risk: critical
surfaces: [plugins/foreman-line/spec-body-compiler/**]
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# FK-P2 — Spec-body compiler

## Intent

Build a spec-body compiler package that parses the required SPEC-CONVENTION spec sections and compiles the exact non-glob `Allowed Files` mutation authority plus the frozen/forbidden surface lists into a deterministic, digest-bound compiled-scope artifact — rejecting ambiguity, path traversal, equivalent paths, symlink/reparse escape, and missing authority, and never reading `surfaces:` as mutation permission (D10). The artifact and its `compiledScopeDigest` are the consumer shape FK-P2B and later parcels bind against. This parcel delivers the compiler package and its dominant hostile-fixture suite on FK-owned surfaces only; it wires nothing into the shipped enforcers.

## Constraints

### Dependency and dispatch boundary

**Status: draft — not dispatchable.** FK-P2 dispatch requires (1) FK-P1 merged and (2) coordinator lint of this spec (charter §15.3; SPEC-CONVENTION §3: a `draft` spec is not dispatchable). No spec text here claims dispatch.

**Dependencies (exact):**
- **FK-P1 (merged) — contract-only dependency.** FK-P2 consumes FK-P1's F05.5 digest rules (the byte-total canonical encoder, the `sha256:` + 64-lowercase-hex `Digest` literal, the `{domain, apiVersion, payload}` wrapper, `apiVersion` literal `0.1.0`) and F05.5's ownership row declaring `compiledScopeDigest` FK-P2-owned. This is a dependency on recorded contract text, **not** a package import: FK-P2 implements the F05.5 encoder rules locally (see "Package and version rules"). FK-P1's `trustedBindings.scopeDigest` (F05.4) binds FK-P2's `compiledScopeDigest` value verbatim; P1 binds the value only, the preimage is FK-P2-owned (F05). **Mandated conformance cross-check (coordinator ruling 2026-09-27, OQ-3):** once FK-P1 merges (it will have merged before FK-P2 dispatch — it is this parcel's dependency), the verification chain MUST include a read-only comparison of FK-P2's local F05.5 encoder against FK-P1's canonical golden fixtures (under `plugins/foreman-line/kernel-contracts/tests/`, exact fixture file located at dispatch), implemented as a read-only fixture-comparison test inside `tests/canonical-output.test.ts` — no new test file, the 39-file ceiling is unchanged. `plugins/foreman-line/kernel-contracts/**` is **read-only test input** for this cross-check and is never written; the Forbidden list below stands unchanged for mutation purposes.
- **Grammar pin.** The spec grammar FK-P2 compiles against is pinned (see "Grammar pin"); a pin mismatch refuses compilation.
- **NO dependency on FK-P2B.** FK-P2B (the `mutation-scope-guard` / `dispatch/src/approval-cli` rewiring) is a separate follow-on parcel requiring negotiated write windows (RS-2.4). FK-P2 delivers only the compiler package and the compiled artifact shape FK-P2B will later consume.

**Out of this parcel's dispatch preconditions:** any window on `dispatch/**`, `routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, or `skill-injection/**`. FK-P2 writes none of them (RS-2.4).

### Grammar pin (SPEC-CONVENTION schema v0.4, revision 2026-09-27)

FK-P2 compiles against the exact on-disk SPEC-CONVENTION revision read at shaping time, so the RCM-P2 additive stream cannot move under it (RS-2.4). The pinned grammar is SPEC-CONVENTION **§4 "Required Spec Schema" in full** (frontmatter schema block, §4.6, §4.7, §4.8 `Allowed Files` mutation authority, §4.9 schema-v0.4 fields, and the required body-sections list) — the byte range of `plugins/foreman-line/docs/SPEC-CONVENTION.md` beginning with the line `## 4. Required Spec Schema` and ending immediately before the line `## 5. The Spec ↔ Jira Contract`, inclusive of the `---` separator preceding §5.

| Pin | Value |
|---|---|
| Pinned section byte range | 10,199 UTF-8 bytes as defined above |
| Pinned section digest | `sha256:96113a55c6ddf2a7bad93c90d7004f1e51550aa2b1164ae06093992ee824398d` |
| Full-file corroboration digest | `sha256:70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8` over the complete file |
| Schema revision label | `v0.4`, revision date `2026-09-27` |
| Artifact grammar binding | the compiled-scope artifact embeds both digests and the revision label |

The pin lives in `src/parse-spec.ts` as an exported constant; `tests/grammar-pin.test.ts` recomputes the section digest from the on-disk file and fails on drift. A grammar revision change (including RCM-P2 additive fields) is a **spec amendment that bumps the pin and the artifact version** — never a silent re-pin. The pin is deliberately load-bearing per RS-2.4; the fail-closed drift test is the mechanism, not an incidental byte-pin.

### D10 scope-authority rule (the defect this compiler fixes)

`surfaces:` is routing/audit metadata (SPEC-CONVENTION §4.6: audit-trigger CI rules, skill-injection matrix evaluation) and is **never** mutation authority (charter D10; wave3-4 marginal-value record §3). The compiler MUST NOT derive, widen, validate, or cross-check any mutation path from `surfaces:` or any other frontmatter field. Mutation authority comes exclusively from the `## Allowed Files` body section (SPEC-CONVENTION §4.8). The parser may surface `surfaces:` as opaque audit metadata in its parse result; `compileScope` never reads it. The proof vehicle is the D10 golden negative (below).

### Package and version rules

Propose private ESM package **`@foreman-line/spec-body-compiler`** at **`plugins/foreman-line/spec-body-compiler/`**, version/API `0.1.0`, Node >=22, TypeScript sources, biome lint config, own `package-lock.json`, no root/workspace manifest registration, no shared lockfile alteration (FK-P1 F05.18 pattern). **Location justification:** sibling packages use kebab-case top-level directories under `plugins/foreman-line/` (`spec-linter`, `mutation-scope-guard`, `schema-scaffold`); this path is FK-owned and non-contested — it sits outside every contested seam (`dispatch/`, `routing-policy/`, `mutation-scope-guard/`, `hooks/`, `skill-injection/`) and outside FK-P1's `kernel-contracts/` and frozen `contracts/`/`authority-registry/`; the name states the deliverable (RS-2.4: "spec-body compiler package"). Rejected alternatives: a subpackage of `kernel-contracts` (contaminates FK-P1's package and its exact ceiling) and anything under `spec-linter/` (frozen).

The package has **no cross-package imports** (RS-2.4 preference: consume kernel-contracts only if needed — not needed). It implements the F05.5 canonical-encoder rules locally with byte-bound conformance vectors (`tests/fixtures/canonical/encoder-vectors.json`). Runtime APIs are pure (no filesystem/network/time/process side effects); the two explicit I/O seams — `verifyCompiledPaths` (tree check) and the pin test's file read — are separate named operations whose failures surface as the package's own typed errors (standing constraint #1). No evaluator or policy logic is hidden in the compiler.

Version/shape discipline (FK-P1 pattern): unknown fields, unknown enum values, missing required data, and over-limit input fail closed; artifact version mismatch refuses; additive optional fields require a negotiated newer version; renaming fields or widening meanings requires a new artifact version and reviewed consumer migration.

### Canonical path rules (FK-P2-owned)

Each `Allowed Files` entry is validated as a repo-relative path and, on acceptance, canonicalized to its exact spelling (no Unicode normalization, no path case folding — case folding is used **only** for collision detection, never in the canonical output or the digest). All list members in the artifact are sorted ascending by UTF-16 code-unit order of their canonical spelling, so source ordering cannot change the artifact bytes.

Validation is default-deny with a fixed precedence chain; the first failing check of the first failing entry (body order) rejects the whole compile with exactly one named error code and its entry index; no partial artifact is ever emitted on rejection. Precedence (documented and tested for order-dependence):

1. Body level: UTF-8 decode, body byte cap.
2. Entry line shape: `MALFORMED_ENTRY` (non-bullet junk, backtick/`**` leakage, URI-scheme-shaped strings), `ENTRY_EMPTY`, `ENTRY_WHITESPACE`.
3. Charset: `ENTRY_NULL_BYTE`, `ENTRY_CONTROL_CHAR` (U+0001–U+001F, U+007F), `ENTRY_FORMAT_CHAR` (Unicode `Cf`: bidi overrides, zero-width, BOM), `ENTRY_UNPAIRED_SURROGATE`.
4. `ENTRY_ENCODED_ESCAPE` (any `%` + two hex digits — encoded traversal is ambiguous by definition).
5. `ENTRY_ABSOLUTE` (leading `/`, drive prefix `X:` in any form, UNC `\\` or `//` prefix, device namespace `//?/` `//./`).
6. `ENTRY_BACKSLASH`.
7. `GLOB_ENTRY` (`*`, `?`, `[`, `]`, `{`, `}` — §4.8 prohibits globs).
8. Per segment, in segment order: exact `.`/`..` → `PATH_TRAVERSAL`; empty segment/trailing slash → `ENTRY_EMPTY_SEGMENT`; `:` → `ENTRY_ADS_COLON`; `~` + digit (8.3 short-name form) → `ENTRY_SHORT_NAME`; Windows reserved device name (CON, PRN, AUX, NUL, COM1–9, LPT1–9, case-insensitive, with or without extension) → `ENTRY_RESERVED_NAME`; trailing dot or space → `ENTRY_TRAILING_DOT_SPACE`; segment byte cap → `SEGMENT_TOO_LONG`; non-NFC → `ENTRY_NON_NFC`.
9. Entry level: `ENTRY_TOO_LONG`, `TOO_MANY_SEGMENTS`.
10. Body level: `TOO_MANY_ENTRIES`.
11. Cross-entry: `ENTRY_DUPLICATE` (byte-identical), `ENTRY_EQUIVALENT` (collision under Unicode simple case folding or NFC — e.g. Kelvin sign U+212A vs `k`), `ENTRY_CONFLICTS_WITH_FORBIDDEN` (entry equals or lies within a declared frozen/forbidden surface).

Default-deny (#30): every structural invariant above has its own fixture and its own failing-when-broken test; a check passing while an earlier check would fire is not evidence for the later check. Mutation of any fixture in its named dimension must fail its named test (#32).

### Symlink/reparse layer

Lexical validation cannot see the filesystem. The package therefore exposes one explicit I/O seam, `verifyCompiledPaths(root, artifact)`, which walks **every path component and the final target** with `lstat` and refuses any symlink, junction, or other reparse point — **including links whose targets remain inside the root** (D19-consistent: in-root links are refused, not tolerated) — and refuses non-regular targets. It returns typed errors `LINK_ESCAPE`, `LINK_IN_ROOT`, `LINK_TARGET_RACE`. The opened-target race (substitution between check and use) is a named descriptor: consumers must re-verify after open via the seam's `reverifyOpenedTarget` callback contract; the fixture asserts the re-verify detects substitution. Windows test trees are materialized at test time from JSON descriptors (junctions via `fs.symlinkSync(..., 'junction')` for directories). **Link-fixture privilege rule (coordinator ruling 2026-09-27, OQ-5):** junction-based reparse cases MUST execute — the chain hard-fails if they cannot; file-symlink cases may skip ONLY with a machine-readable gap record in the fixture inventory (`link-trees.json`, case marked `blocked: <privilege reason>`), which is never counted as passed; every skipped case is named in the Verification Plan as an evidence obligation of the FK-P18′ CI lane (privilege-provisioned runners per the U1 contract) and is closed by an owned future step or explicitly left in the exit annex — never silently lost.

### Compiled-scope artifact and `compiledScopeDigest`

The compiler's output is `{ artifact, compiledScopeDigest }`. The artifact is serialized as canonical JSON (F05.5 byte rules: recursively sorted object keys in UTF-16 code-unit order, preserved array order over the compiler-sorted lists, the `JSON.stringify` escape set exactly, digits-only integer lexemes, no Unicode normalization, no path case folding), UTF-8 without BOM — deterministic byte output.

`compiledScopeDigest` domain literal: **`foreman-line.spec-body-compiler.compiled-scope`** (FK-P2-owned per F05.5's ownership row). Preimage: exactly the UTF-8 encoding of the canonical JSON of `{domain: "foreman-line.spec-body-compiler.compiled-scope", apiVersion: "0.1.0", payload: <artifact without its compiledScopeDigest member>}`, hashed SHA-256, emitted as `sha256:` + 64 lowercase hex (F05.5 rules, consistent with the FK-P1 `Digest` literal).

**Consumer shape (declared):** FK-P2B later consumes compiled spec bodies as `{ artifact, compiledScopeDigest }` and replaces the `surfaces:`-derived authority in `mutation-scope-guard` / `dispatch/src/approval-cli` (the D10 defect fix — FK-wave3-4 marginal-value §3); FK-P1's `trustedBindings.scopeDigest` (F05.4) binds `compiledScopeDigest` verbatim; FK-P1's cache triple `[goalRevision, policyDigest, compiledScopeDigest]` (F05.16) uses it as its third binding; FK-P12 later evaluates compiled scopes inside `authorizeAction`. A consumer that receives an artifact whose `authorityState` is `empty` MUST refuse every mutation (`MISSING_AUTHORITY`) — the empty set is never widened.

### Linear-time parsing (#19)

Parsing is a single-pass, non-recursive scanner with a named complexity bound: **O(n) in the UTF-8 byte length of the spec body, with a hard cap of 4 byte examinations per input byte** (section split, entry lex, per-segment validation, canonicalization), plus an O(k log k) sort over k entries (k ≤ 256). No regular expression with nested quantifiers or unbounded backtracking is permitted anywhere in the parser (CodeQL polynomial-redos remains the fourth net). The compile result carries a `stats: { bytesExamined, entriesExamined }` counter; LIMIT-06/07/08 assert the bound on hostile input.

## Contract tables

### Artifact document (closed; JSON Schema at `schemas/compiled-scope.schema.json`)

| Field | Type | Constraints |
|---|---|---|
| artifactVersion | literal `0.1.0` | mismatch refuses |
| grammar.convention | literal `SPEC-CONVENTION` | |
| grammar.schemaRevision | literal `v0.4` | |
| grammar.revisionDate | literal `2026-09-27` | |
| grammar.sectionDigest | Digest | `sha256:96113a55…24398d` (the pin) |
| grammar.fileDigest | Digest | `sha256:70508684…cba0a8` |
| spec.ticket | nonempty string | from frontmatter `ticket:`; identity only |
| spec.specPath | repo-relative string | identity only; machine-independent |
| allowedFiles | Array<Entry>, sorted | exact canonical repo-relative paths; may be empty; never globs |
| frozenSurfaces | Array<ScopeRef>, sorted | negative authority; may be empty |
| forbiddenSurfaces | Array<ScopeRef>, sorted | negative authority; may be empty |
| authorityState | enum(`granted`, `empty`) | `granted` iff `allowedFiles.length > 0` |
| compiledScopeDigest | Digest | preimage defined above; excluded from its own preimage |

`Entry`: an exact canonical repo-relative path string (forward slashes, no trailing slash). `ScopeRef`: an exact path, or `path/**` meaning "path and everything beneath it" — the `/**` directory-scope form is permitted **only** in `frozenSurfaces`/`forbiddenSurfaces`; any other glob syntax is rejected everywhere. `surfaces:` never appears in any artifact field.

**Grant/deny grammar asymmetry (coordinator ruling 2026-09-27, OQ-2):** the `Allowed Files` grant list is exact and non-glob with no scope syntax of any kind — mutation authority can never be widened by scope syntax (D10). The `path/**` directory-scope form is a **deny-only** construct, permitted exclusively in the negative (frozen/forbidden) lists. The two directions are intentionally asymmetric and the compiler rejects any attempt to use scope syntax on the grant side.

### Error registry (closed `ScopeCompileErrorCode`)

| Code | Invariant | Representative fixtures |
|---|---|---|
| SPEC_SECTION_MISSING | each required section present | AUTH-02…AUTH-06 |
| SPEC_SECTION_EMPTY | each required section non-empty | AUTH-07…AUTH-11 |
| SPEC_SECTION_DUPLICATE | no duplicated section heading | AMBIG-01, AMBIG-02 |
| MISSING_AUTHORITY | `Allowed Files` present before authority is granted; empty-set artifacts never authorize | AUTH-01, AUTH-12 |
| BODY_NOT_UTF8 | input decodes as UTF-8 (no overlong/invalid) | UNI-09 |
| BODY_TOO_LARGE | body byte cap | LIMIT-01 |
| MALFORMED_ENTRY | entry is a well-formed bullet path | AMBIG-11, AMBIG-12 |
| ENTRY_EMPTY / ENTRY_WHITESPACE | entry nonempty, no surrounding whitespace | AMBIG-08…AMBIG-10 |
| GLOB_ENTRY | no glob metacharacters | AMBIG-03…AMBIG-07 |
| ENTRY_ABSOLUTE | repo-relative only | TRAV-13, WIN-01…WIN-06 |
| ENTRY_BACKSLASH | forward slashes only | SEP-01, SEP-02, SEP-06 |
| ENTRY_EMPTY_SEGMENT | no empty segments, no trailing slash | SEP-03…SEP-05 |
| PATH_TRAVERSAL | no `.`/`..` segments | TRAV-01…TRAV-07 |
| ENTRY_ENCODED_ESCAPE | no percent-encoded forms | TRAV-08…TRAV-12 |
| ENTRY_ADS_COLON | no `:` (ADS) anywhere | WIN-07, WIN-08 |
| ENTRY_SHORT_NAME | no 8.3 short-name segments | WIN-13, WIN-14 |
| ENTRY_RESERVED_NAME | no reserved device names | WIN-12, WIN-15…WIN-18 |
| ENTRY_TRAILING_DOT_SPACE | no trailing dot/space per segment | WIN-09…WIN-11 |
| ENTRY_NULL_BYTE / ENTRY_CONTROL_CHAR / ENTRY_FORMAT_CHAR / ENTRY_UNPAIRED_SURROGATE | clean charset | UNI-02…UNI-08 |
| ENTRY_NON_NFC | entries in NFC | UNI-01 |
| ENTRY_DUPLICATE / ENTRY_EQUIVALENT | entries unique and non-equivalent | EQUIV-01…EQUIV-07 |
| ENTRY_TOO_LONG / SEGMENT_TOO_LONG / TOO_MANY_SEGMENTS / TOO_MANY_ENTRIES | size/count caps | LIMIT-02…LIMIT-05 |
| LINK_ESCAPE / LINK_IN_ROOT / LINK_TARGET_RACE | no symlink/reparse traversal, in-root included | LINK-01…LINK-08 |
| ENTRY_CONFLICTS_WITH_FORBIDDEN | allow list never overlaps frozen/forbidden | CONF-01, CONF-02 |
| GRAMMAR_PIN_MISMATCH | input grammar digest equals the pin | tests/grammar-pin.test.ts (inline) |

### Hostile-fixture inventory (dominant; 100 fixture records)

Fixture records live in `tests/fixtures/`; hostile cases are JSON tables of `{ id, input, expectedCode | expectedOutcome }`, link cases are JSON tree descriptors materialized at test time, positive/golden cases are full spec `.md` files.

| Class | IDs | Count | Expected |
|---|---|---|---|
| H1 Path traversal (`..` variants, encoded, absolute-disguise) | TRAV-01 `..`; TRAV-02 `../x`; TRAV-03 `x/..`; TRAV-04 `x/../y`; TRAV-05 `./x`; TRAV-06 `x/./y`; TRAV-07 `.`; TRAV-08 `%2e%2e/x`; TRAV-09 `x/%2E%2E/y`; TRAV-10 `%252e%252e/x`; TRAV-11 `..%5cx`; TRAV-12 `%c0%ae%c0%ae/x`; TRAV-13 `/x` | 13 | TRAV-01…07 `PATH_TRAVERSAL`; TRAV-08…12 `ENTRY_ENCODED_ESCAPE`; TRAV-13 `ENTRY_ABSOLUTE` |
| H2 Mixed separators | SEP-01 `a\b`; SEP-02 `a/b\c`; SEP-03 `a//b`; SEP-04 `a/`; SEP-05 `a///b`; SEP-06 `a\/b` | 6 | SEP-01/02/06 `ENTRY_BACKSLASH`; SEP-03/04/05 `ENTRY_EMPTY_SEGMENT` |
| H3 Windows-specific | WIN-01 `C:/x`; WIN-02 `C:x`; WIN-03 `\\server\share\x`; WIN-04 `//server/share/x`; WIN-05 `//?/C:/x`; WIN-06 `//./NUL`; WIN-07 `src/a.txt:stream`; WIN-08 `src/a.txt::$DATA`; WIN-09 `src/a.`; WIN-10 `src/a `; WIN-11 `src/a.../b`; WIN-12 `src/aux.txt`; WIN-13 `PROGRA~1/x`; WIN-14 `src/FI~1.TXT`; WIN-15 `CON`; WIN-16 `src/NUL.txt`; WIN-17 `src/COM1/y`; WIN-18 `src/LPT9` | 18 | WIN-01…06 `ENTRY_ABSOLUTE`; WIN-07/08 `ENTRY_ADS_COLON`; WIN-09…11 `ENTRY_TRAILING_DOT_SPACE`; WIN-12/15…18 `ENTRY_RESERVED_NAME`; WIN-13/14 `ENTRY_SHORT_NAME` |
| H4 Symlink/reparse escape (tree descriptors) | LINK-01 file link → outside root; LINK-02 dir link → outside root; LINK-03 file link → inside root; LINK-04 dir link → inside root; LINK-05 junction → outside root; LINK-06 junction → inside root; LINK-07 escape via linked ancestor component; LINK-08 opened-target substitution race descriptor | 8 | LINK-01/02/05/07 `LINK_ESCAPE`; LINK-03/04/06 `LINK_IN_ROOT`; LINK-08 `LINK_TARGET_RACE` on non-reverify; junction cases (LINK-05/06) hard-fail the chain if they cannot run; file-symlink cases may skip only as `blocked: <privilege reason>` records, never counted as passed |
| H5 Equivalent paths (normalization collisions) | EQUIV-01 `src/File.ts` + `src/file.ts` (case fold); EQUIV-02 NFC + NFD pair (`café`); EQUIV-03 `x.` + `x`; EQUIV-04 `x ` + `x`; EQUIV-05 byte-identical duplicate; EQUIV-06 `a/b` + `a\b`; EQUIV-07 `src/K.ts` (U+212A) + `src/k.ts` | 7 | EQUIV-01/07 `ENTRY_EQUIVALENT`; EQUIV-02 `ENTRY_NON_NFC`; EQUIV-03/04 `ENTRY_TRAILING_DOT_SPACE`; EQUIV-05 `ENTRY_DUPLICATE`; EQUIV-06 `ENTRY_BACKSLASH` — every case: compile rejects, no partial authority |
| H6 Unicode | UNI-01 NFD entry; UNI-02 U+202E RTL override; UNI-03 U+200B zero-width; UNI-04 U+FEFF; UNI-05 U+0000; UNI-06 U+001F; UNI-07 U+007F; UNI-08 unpaired surrogate; UNI-09 raw invalid/overlong UTF-8 bytes | 9 | UNI-01 `ENTRY_NON_NFC`; UNI-02…04 `ENTRY_FORMAT_CHAR`; UNI-05 `ENTRY_NULL_BYTE`; UNI-06/07 `ENTRY_CONTROL_CHAR`; UNI-08 `ENTRY_UNPAIRED_SURROGATE`; UNI-09 `BODY_NOT_UTF8` |
| H7 Ambiguity | AMBIG-01 duplicate `## Allowed Files`; AMBIG-02 duplicate `## Intent`; AMBIG-03 `src/**`; AMBIG-04 `*`; AMBIG-05 `?.ts`; AMBIG-06 `[a-z]/x`; AMBIG-07 `{a,b}/x`; AMBIG-08 empty bullet; AMBIG-09 whitespace-only bullet; AMBIG-10 surrounding-whitespace entry; AMBIG-11 URL-shaped entry; AMBIG-12 backtick/`**` junk entry | 12 | AMBIG-01/02 `SPEC_SECTION_DUPLICATE`; AMBIG-03…07 `GLOB_ENTRY`; AMBIG-08 `ENTRY_EMPTY`; AMBIG-09/10 `ENTRY_WHITESPACE`; AMBIG-11/12 `MALFORMED_ENTRY` |
| H8 Missing authority | AUTH-01 `## Allowed Files` absent; AUTH-02…06 Intent/Constraints/Acceptance Criteria/Out of Scope/Context & References absent (one each); AUTH-07…11 the same five sections present-but-empty (one each); AUTH-12 `assertDispatchable` on an empty-set artifact | 12 | AUTH-01 `MISSING_AUTHORITY`; AUTH-02…06 `SPEC_SECTION_MISSING`; AUTH-07…11 `SPEC_SECTION_EMPTY`; AUTH-12 `MISSING_AUTHORITY` |
| H9 Oversized / deep nesting | LIMIT-01 body over 1 MiB; LIMIT-02 entry over 512 UTF-8 bytes; LIMIT-03 segment over 128 bytes; LIMIT-04 10k-segment path; LIMIT-05 257 entries; LIMIT-06 10k-deep markdown nesting; LIMIT-07 1 MiB single line, no newline; LIMIT-08 2N/4N scaling pair | 8 | LIMIT-01 `BODY_TOO_LARGE`; LIMIT-02 `ENTRY_TOO_LONG`; LIMIT-03 `SEGMENT_TOO_LONG`; LIMIT-04 `TOO_MANY_SEGMENTS`; LIMIT-05 `TOO_MANY_ENTRIES`; LIMIT-06/07/08 compile completes within the 4-bytes-per-byte bound (`stats.bytesExamined ≤ 4n`), outcome per normal rules |
| H10 Authority conflicts | CONF-01 Allowed Files entry equals a declared forbidden surface; CONF-02 entry inside a declared frozen `path/**` scope | 2 | `ENTRY_CONFLICTS_WITH_FORBIDDEN` |
| Positive (one per legitimate spec shape) | POS-01 minimal dispatchable (all required sections, single entry); POS-02 multi-entry + Forbidden/Frozen surfaces paragraph; POS-03 maximal frontmatter (v0.2 + v0.4 fields); POS-04 maximal `surfaces:` + non-empty Allowed Files | 4 | compile succeeds; POS-04 mutation set equals exactly the Allowed Files entries (no widening from `surfaces:`) |
| Golden negative (D10) | GOLDEN-D10-01: maximal `surfaces:` (all known prefixes, many entries) + empty `## Allowed Files` | 1 | compiles to an **EMPTY** mutation set (`authorityState: empty`, `allowedFiles: []`), never silently widened; `assertDispatchable` refuses with `MISSING_AUTHORITY` |

Counts: 13+6+18+8+7+9+12+12+8+2 = **95 hostile** + 4 positive + 1 golden negative = **100 fixture records**. Hostile classes are deliberately dominant (~95%).

## Allowed Files

Proposed builder ceiling, inactive until dispatch:

- `plugins/foreman-line/spec-body-compiler/package.json`
- `plugins/foreman-line/spec-body-compiler/package-lock.json`
- `plugins/foreman-line/spec-body-compiler/tsconfig.json`
- `plugins/foreman-line/spec-body-compiler/biome.json`
- `plugins/foreman-line/spec-body-compiler/README.md`
- `plugins/foreman-line/spec-body-compiler/src/index.ts`
- `plugins/foreman-line/spec-body-compiler/src/parse-spec.ts`
- `plugins/foreman-line/spec-body-compiler/src/compile-scope.ts`
- `plugins/foreman-line/spec-body-compiler/src/canonical-output.ts`
- `plugins/foreman-line/spec-body-compiler/src/errors.ts`
- `plugins/foreman-line/spec-body-compiler/schemas/compiled-scope.schema.json`
- `plugins/foreman-line/spec-body-compiler/tests/grammar-pin.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/parse-spec.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/compile-scope.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/canonical-output.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/errors.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/hostile-paths.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/windows-paths.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/symlink-reparse.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/unicode.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/ambiguity.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/limits.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/d10-golden-negative.test.ts`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/traversal.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/separators.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/windows.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/link-trees.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/equivalent.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/unicode.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/ambiguity.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/authority.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/limits.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/hostile/conflicts.json`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/positive/pos-01-minimal.md`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/positive/pos-02-multi-entry.md`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/positive/pos-03-maximal-frontmatter.md`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/positive/pos-04-surfaces-not-authority.md`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/golden/d10-empty-authority.md`
- `plugins/foreman-line/spec-body-compiler/tests/fixtures/canonical/encoder-vectors.json`

Exact 39-file ceiling. Nothing outside this package is writable. No shared manifest/export/schema/workflow/lockfile is writable; FK-P2 owns only its new package manifest, lockfile, and exports. If implementation needs a path not listed here, the coordinator records a spec amendment before code; no implied neighboring-path permission.

**Forbidden surfaces (exact):** `plugins/foreman-line/dispatch/**` (contested; RCM Window-R discipline); `plugins/foreman-line/mutation-scope-guard/**` (FK-P2B/`foreman-line-boundary-routing` territory, RS-2.4); `plugins/foreman-line/routing-policy/**` (contested; `foreman-line-boundary-routing`); `plugins/foreman-line/hooks/**` (contested; FK-P2B/FK-P3 territory); `plugins/foreman-line/skill-injection/**` (`plugin-packaging-and-scaffolder` territory); `plugins/foreman-line/contracts/**` (frozen pipeline A–F contracts); `plugins/foreman-line/authority-registry/**` (FK-P0 source and generated registry); `plugins/foreman-line/kernel-contracts/**` (FK-P1's package — forbidden for mutation and never imported into shipped code; read-only test input for the OQ-3 conformance cross-check only — coordinator ruling 2026-09-27 — and never written; any future runtime import is a spec amendment); `plugins/foreman-line/docs/SPEC-CONVENTION.md` (frozen grammar source — read-only by pin); `plugins/foreman-line/spec-linter/**` (frozen); `plugins/foreman-line/permission-profiles/**` (frozen); shared manifests, root workflow files, plugin/marketplace metadata, shared lockfiles and package exports outside this package; other goals' records and goal docs under `docs/goals/`; any path outside the 39 listed entries. Charter §15.3 scope row satisfied: the enumeration above is Forbidden; the Out of Scope section names the behavioral boundary.

## Acceptance Criteria

1. The compiler parses the required spec sections per the pinned grammar (§4 as pinned above) and refuses on a grammar pin mismatch (`GRAMMAR_PIN_MISMATCH`) — the pin test recomputes the digest from the on-disk SPEC-CONVENTION and fails on drift.
2. Every rejection shape has a named code from the closed registry, and every structural invariant is tested **independently** (default-deny #30): one fixture per invalid shape, one failing-when-broken mutation per named test (#32), and at least one test per precedence edge proving the documented first-failure order is what actually fires.
3. Parsing is linear-time (standing constraint #19): hostile-input tests (LIMIT-06/07/08) assert `stats.bytesExamined ≤ 4 × input bytes` at 1x/2x/4x sizes; no backtracking-prone regular expression exists in the package.
4. Traversal, encoded traversal, mixed separators, Windows-specific forms (drive/UNC/device namespace/ADS/trailing dot-space/reserved names/8.3), equivalent paths, and Unicode hostility are each rejected per the inventory's expected codes; symlink/reparse escape is refused by `verifyCompiledPaths` for **both** escaping and in-root targets, every component and the final target, with the opened-target race covered by the re-verify contract.
5. Ambiguity is refused: duplicated sections, glob-looking entries, empty/whitespace entries, malformed entry lines — each with its named code; no partial or best-effort artifact is ever emitted on rejection.
6. **D10 golden negative (GOLDEN-D10-01):** a spec with maximal `surfaces:` and empty `## Allowed Files` compiles to an EMPTY mutation set (`allowedFiles: []`, `authorityState: empty`) that is never silently widened from `surfaces:` or any frontmatter field; `assertDispatchable` on it refuses with `MISSING_AUTHORITY`. POS-04 additionally proves a granted mutation set equals exactly its Allowed Files entries under maximal `surfaces:`.
7. Generation is idempotent and order-independent: byte-identical input yields byte-identical artifact bytes and `compiledScopeDigest`; reordering Allowed Files entries in the source yields the identical artifact (canonical sort); the artifact embeds the grammar pin and `artifactVersion`.
8. `compiledScopeDigest` matches the F05.5 digest rules and the domain literal `foreman-line.spec-body-compiler.compiled-scope`; the shipped conformance vectors bind canonical bytes and hashes; the declared consumer shape (FK-P2B `{ artifact, compiledScopeDigest }`; FK-P1 `trustedBindings.scopeDigest` and cache-triple binding) is stated in the package README and unchanged by implementation.
9. The exact 39-file ceiling holds; the package registers no root/workspace manifest entry and alters no shared lockfile; the deterministic chain passes with direct exit codes retained and no generator step.
10. Two fresh independent architecture/risk reviews (charter §6/§15.3) return verdicts on the mandated focus questions; no reviewer fixes or commits. FK-P2 alone does not close the Wave-0 exit (FK-P1 and coordinator lint remain separate) and never claims dispatch while this spec is `draft`.

## Out of Scope

- The D10 wiring fix: consuming compiled spec bodies inside `mutation-scope-guard` or `dispatch/src/approval-cli` — **FK-P2B**, requiring negotiated windows with `routing-currency-and-merit` (Window R) and `foreman-line-boundary-routing` (RS-2.4). FK-P2 proves the fix is *possible* (the compiled artifact); it performs no rewiring.
- Any write to `dispatch/**`, `routing-policy/**`, `mutation-scope-guard/**`, `hooks/**`, `skill-injection/**` (no FK parcel writes these until a window is recorded, RS-2.4), or to `contracts/**`, `authority-registry/**`, `kernel-contracts/**`, `spec-linter/**`, `permission-profiles/**`, `SPEC-CONVENTION.md`, shared manifests/lockfiles/exports, workflows, plugin/marketplace metadata, other goals' records.
- Editing the pinned grammar; absorbing future SPEC-CONVENTION revisions (a revision is a pin bump by spec amendment, never silent).
- Runtime enforcement of path refusal in hooks/adapters (FK-P17′/FK-P18′/FK-P19 territory), authorization decisions (`authorizeAction` is FK-P12), the capability-bound repository reader (FK-P4), state/lease/migration code (FK-P9/P10).
- Importing `@foreman-line/kernel-contracts` or any cross-package code; issuing receipts, capabilities, approvals, or verdicts; claiming measured performance (only the complexity bound is claimed).
- The FK-P0 corpus amendment R32 stream, INDEX.md regeneration, Jira linkage, and shaping-emitter/ShakingResult machinery (parent-coordinated, as in FK-P1).

## Context & References

- [Live charter](../../goals/foreman-kernel/charter.md) — D10, §6 Wave 0 FK-P2 row, §12 serialization, §15.3 dispatch contract
- [Loop directive](../../goals/foreman-kernel/loop-directive.md)
- [FK-P1–FK-P21 dispatch plan](../../goals/foreman-kernel/fk-p1-p21-dispatch-plan.md) — FK-P2 row as narrowed 2026-09-27
- [RS-2 Gate-1 re-ratification](../../goals/foreman-kernel/fk-rs2-gate1-reratification-2026-09-27.md) — RS-2.4 binds this scope
- [Wave 3–4 marginal-value record](../../goals/foreman-kernel/fk-wave3-4-marginal-value-2026-09-27.md) — §3, the D10 defect
- [FK-P1 lifecycle/admission/decision contracts](FK-P1-lifecycle-admission-decision-contracts.md) — F05.4/F05.5/F05.16 digest and binding rules
- [Spec convention](../../SPEC-CONVENTION.md) — §4 (pinned grammar), §4.7, §4.8
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md) — #19, #30, #32, #1, #34

## Verification Plan

**Pending, not run.** Deterministic chain, run by the coordinator on the sequential Node lane (Windows rule preserved: package setup and deterministic passes run sequentially even when reasoning lanes are concurrent), cwd the isolated `spec-body-compiler` package, full output and direct exit codes retained: `node -v` (>=22); `npm ci`; `npm run typecheck`; **no generate step** (the artifact JSON Schema and fixture tables are source-authored; the compiler emits artifacts at runtime — a generate script is deliberately absent, and its absence is asserted); `npm test` (which MUST include the read-only F05.5-encoder conformance cross-check against FK-P1's canonical golden fixtures inside `tests/canonical-output.test.ts` — coordinator ruling 2026-09-27, OQ-3; `kernel-contracts/**` is read-only test input, never written); `npm run lint` (biome). Script names are required package interfaces, not claims existing commands already run. The FK-P0 corpus amendment R32 must land before this parcel's verification chain is trusted (RS-2.5 item 5). **Evidence obligation (coordinator ruling 2026-09-27, OQ-5):** any file-symlink fixture skipped under the privilege rule is named here at verification time as an evidence obligation of the FK-P18′ CI lane (privilege-provisioned runners per the U1 contract) and is closed by an owned future step or explicitly left in the exit annex — never silently lost; junction-based reparse cases (LINK-05/06) must execute or the chain hard-fails. Reviewers receive two fresh independent architecture/risk sessions (charter §15.3); reviewers never fix or commit and end with the no-commits/dirty-files assertion (#24).

**Mandated reviewer focus questions** (field-by-field assessment, not generic linting):

1. **D10 naive reading (#14):** is there *any* code path — including error messages, stats, or audit echoes — by which `surfaces:` or another frontmatter field could widen, select, or validate a mutation path? Attempt the wrong-but-literal reading and show the text and tests exclude it.
2. **Digest determinism:** can two distinct spec texts produce the same artifact bytes or the same `compiledScopeDigest` (via normalization, case folding, separator, or sort-order collision)? Can one input produce two artifacts across runs or platforms?
3. **Empty vs granted authority:** at every exported boundary, is `authorityState: empty` distinguishable from `granted`, and does each consumer boundary refuse the empty set? Could a consumer mistake an empty artifact for "unrestricted"?
4. **Host rules leaking into the digest:** does any Windows canonicalization (case folding, trailing dot/space stripping) enter the canonical bytes or the hash — and conversely, does case-sensitive hashing let a Windows-ambiguous pair compile?
5. **Linearity honesty (#19):** does the claimed 4-bytes-per-byte bound hold by construction (no hidden rescans, no backtracking regex), and do LIMIT-06/07/08 actually fail when the bound is broken (mutate the counter, #32)?
6. **Link layer completeness:** does `verifyCompiledPaths` check every component *and* the final target, refuse in-root links, and does LINK-08's re-verify genuinely detect substitution rather than re-checking the original path?
7. **Precedence binding:** does each fixture hit the code its row claims because of the documented precedence chain (mutate one dimension at a time and confirm the named code — not a neighbor's — fires)?
8. **Allow/deny boundary:** can an Allowed Files entry reach authority despite overlapping a frozen/forbidden surface (CONF-01/02), and is the `/**` form rejected outside negative lists?
9. **Pin integrity:** would a silent grammar change fail closed, and does the amendment path (bump pin + artifactVersion) exist in the text so #34's shipped-pin trap has a documented escape?
10. **Scope honesty:** does any acceptance criterion claim dispatch, enforcement, or FK-P2B rewiring beyond the compiler package and its fixtures?

## Rollback

FK-P2 is an additive package on FK-owned surfaces: it creates one new private package and mutates no existing code, enforcer, state store, data format, or shared surface. Rollback is delete-to-rollback: revert this spec and delete `plugins/foreman-line/spec-body-compiler/` entirely. No consumer has shipped against the artifact while this spec is draft (FK-P2B is undispatched), so no compatibility window, migration, cutover epoch, or data retention applies. If the package has merged before rollback and a later parcel imports it, that parcel's own change removes its imports; FK-P2 migrates nothing. The grammar pin is read-only and unaffected.

## Coordinator Rulings — Resolved Decisions (2026-09-27)

Coordinator lint passed 2026-09-27 (both grammar-pin digests reproduced exactly on disk: full-file `70508684…`, §4 range `96113a55…`). All six shaping questions are resolved by coordinator ruling 2026-09-27; no open questions remain.

- **Empty-authority boundary (was OQ-1) — CONFIRMED.** The two-layer resolution stands: absent `## Allowed Files` is a compile rejection (`MISSING_AUTHORITY`); present-but-empty compiles to `authorityState: 'empty'` and is refused at every consumption boundary. This is the D10 golden-negative vehicle; GOLDEN-D10-01 stands as specified.
- **Negative-list grammar (was OQ-2) — CONFIRMED.** FK-P2 compiles frozen/forbidden surfaces from the `**Forbidden surfaces (exact):**` paragraph as corpus convention; the `path/**` directory-scope form is permitted ONLY in negative/deny lists. The grant list stays exact non-glob — mutation authority can never be widened by scope syntax (D10). The asymmetry is stated explicitly in the artifact-grammar section above.
- **Encoder conformance (was OQ-3) — CONFIRMED with condition.** The verification chain MUST include a read-only conformance cross-check of the local F05.5 encoder against FK-P1's canonical golden fixtures once FK-P1 merges (this parcel's dependency), implemented as a read-only fixture-comparison test inside `tests/canonical-output.test.ts`. `kernel-contracts/**` is read-only test input for this cross-check and is never written; the Forbidden list stands unchanged for mutation purposes.
- **Input caps (was OQ-4) — ACCEPTED as proposed.** Body 1 MiB / entry 512 B / segment 128 B / ≤64 segments / ≤256 entries. They are purpose-fit DoS bounds for human-authored spec bodies; the FK-P1 P1-S07 ceilings are a wire-payload domain and do not apply here.
- **Link-fixture privileges (was OQ-5) — ACCEPTED with binding conditions.** (a) Junction-based reparse cases MUST execute — the chain hard-fails if they cannot. (b) File-symlink cases may skip ONLY with a machine-readable gap record in the fixture inventory (`blocked: <privilege reason>`), never counted as passed. (c) Each skipped case is named in the Verification Plan as an evidence obligation of the FK-P18′ CI lane (privilege-provisioned runners per the U1 contract), closed by an owned future step or explicitly left in the exit annex — never silently lost.
- **`verification_class` (was OQ-6) — RETAINED.** `verification_class: judgment-required` stays in frontmatter. Note: required by spec-frontmatter.schema.json; prose documentation gap noted (SPEC-CONVENTION is a frozen sibling-owned surface — not amended here).
