/**
 * Hand-authored JSON Schema draft-07 literal for a `ContractReaderEntry`, typed
 * as ajv's `SchemaObject` — never `JSONSchemaType<T>`, matching spec-linter's
 * established practice of never using it as a schema authority. `types.ts`'s
 * `ContractReaderEntry` and this schema are two representations proven to
 * agree by `tests/parity.test.ts` (a canonical sample plus a no-drift test
 * against the committed `schemas/contract-reader-entry.schema.json`); neither
 * is generated from the other.
 *
 * Amendment A1 (replacing the struck "no file extension pattern" heuristic —
 * that proxy misclassified legitimate extensionless paths like `Dockerfile`,
 * `Makefile`, `LICENSE`) as extended by Amendment A2(a) (BL3/F3/I2 — A1's
 * predicate was `/`-anchored only, so a backslash rendering of a directory or
 * `..`-traversal path bypassed it entirely; this repo is Windows-primary and
 * this package's own `normalizeSeparators` treats `\` and `/` as one identity,
 * so the schema must too), by Amendment A3(b)/A3(c) (rule (d) was ALSO
 * `/`-anchored only — `\\server\share\x.ts` (UNC) and `\foo\x.ts`
 * (backslash-root) were both wrongly accepted, the exact BL3 shape reproduced
 * a second time inside the amendment written to fix BL3 — and whitespace/
 * control-character padding around an otherwise-valid path was untested),
 * and by Amendment A4(b) (A3(c)'s prose said "any control character" but its
 * regex was `[\x00-\x1f]` — C0 only. DEL (U+007F), C1 controls (U+0085,
 * U+009F), and Unicode FORMAT characters (ZWSP U+200B, bidi overrides,
 * word joiner, U+FEFF) all survived, including in container-padding
 * position. Replaced with the Unicode property escapes `\p{Cc}|\p{Cf}` —
 * `Cc` covers C0/DEL/C1, `Cf` covers the format characters — which ajv
 * compiles with the `u` flag by default (`unicodeRegExp`), so property
 * escapes are supported). A `readers` member is REJECTED if, and only if,
 * it:
 *   (a) ends in `/` or `\` (directory-shaped, either separator),
 *   (b) contains a glob metacharacter — `*`, `?`, `[`, or `]` — anywhere,
 *   (c) contains a `.` or `..` path segment delimited by EITHER separator (a
 *       whole segment equal to `.` or `..` — path traversal, not an
 *       extension),
 *   (d) is ABSOLUTE — begins `/` or `\` (A3(b) — a leading backslash, either
 *       bare or UNC, becomes a leading `/` after `normalizeSeparators` and is
 *       the shape this rule exists to reject), or matches a drive letter
 *       `^[A-Za-z]:` (A2(a)(4) — AC1/`types.ts`/the schema doc all say
 *       repository-relative; `/etc/passwd` and `C:/Repos/x.ts` were both
 *       wrongly accepted), or
 *   (e) has LEADING/TRAILING WHITESPACE, is WHITESPACE-ONLY, or contains a
 *       UNICODE CONTROL OR FORMAT CHARACTER (`\p{Cc}|\p{Cf}`) anywhere
 *       (A2(a)(5) closed whitespace-only alone admitting `" "`; A3(c) — a
 *       whitespace-PADDED otherwise-valid path survived both A1/A2 and the
 *       A2(d) registry loop; A4(b) widened the character class beyond C0 —
 *       see above). Unicode SPACE separators (`\p{Zs}`, e.g. U+00A0 NBSP,
 *       U+2003, U+3000) are deliberately NOT included in this class: they
 *       already reject at the string's edges via `\s`, and an INTERIOR
 *       instance (e.g. a filename containing a no-break space) is a
 *       legitimate filename character, not a control/format character, and
 *       must continue to be accepted.
 *
 * Rework 4 (review E I1/I2 — accepted as documented, ratified alongside A5;
 * do NOT widen the `\p{Cc}|\p{Cf}` class again):
 *   (I1) `Cn` (unassigned), `Co` (private-use), `Mn` (combining marks), and
 *   `Lo` (invisible letters, e.g. Hangul filler U+3164) are NOT in this
 *   class and so ACCEPT in padding position. This is not a new hole: no
 *   filesystem strips these code points, so a path padded with one resolves
 *   to a path that does not exist on disk and fails OPEN BY VACUITY — an
 *   already-stated AC8 non-proof (a ruled path is not a verified one), not a
 *   new gap this rework introduces.
 *   (I2) `Cf` collateral is real and intentional: soft hyphen (U+00AD) and
 *   ZWJ/ZWNJ (U+200D/U+200C) INSIDE a filename now REJECT, because `Cf`
 *   covers them wherever they appear, not only at the edges. Accepted for
 *   this parcel; carving these three code points out of the rejected class
 *   is a spec change and stays in the P2 "what remains open" list.
 *
 * Rework 4 (review E S3) — CONSUMER REQUIREMENT: `\p{Cc}|\p{Cf}` is correct
 * only when this pattern is compiled with Unicode-aware regex semantics
 * (ajv's `unicodeRegExp: true`, its default). A consumer that compiles this
 * schema with `unicodeRegExp: false` (or an engine without `u`-flag Unicode
 * property escape support) will see the pattern fail to compile or silently
 * stop matching `\p{Cc}`/`\p{Cf}` as intended, and rejection (e) fails OPEN
 * for every input the property escapes were meant to catch. This schema
 * cannot enforce a consumer's ajv configuration — see the `description` on
 * `contractReaderEntrySchema` below and the README for the same requirement
 * stated for a human integrator.
 *
 * Extension presence is NOT tested in either direction: an extensionless
 * concrete path is accepted, and having an extension exempts nothing from
 * (a)-(e).
 *
 * These are SYNTACTIC tests only (Amendment A1's stated limit, unchanged by
 * A2): a path that is file-shaped by every rule but names a directory on disk
 * still passes this schema. Resolving that needs filesystem state and belongs
 * at validation time — this schema deliberately does not add a disk check to
 * close it (A2's "what A2 does not change" clause).
 */
import type { SchemaObject } from 'ajv'

// (a) trailing '/' or '\'         (b) any of * ? [ ]
// (c) a '.' or '..' segment, either separator
// (d) absolute: leading '/' or '\' (A3(b): UNC/backslash-root), or a drive letter
// (e) leading/trailing whitespace, whitespace-only, or a Unicode control/format
//     character anywhere (A3(c), widened by A4(b) from C0-only to \p{Cc}|\p{Cf})
const REJECTED_READER_PATTERN =
  '([/\\\\]$)|[*?\\[\\]]|(^|[/\\\\])\\.\\.?([/\\\\]|$)|(^[/\\\\])|(^[A-Za-z]:)|(^\\s)|(\\s$)|\\p{Cc}|\\p{Cf}'

const concreteFilePathSchema: SchemaObject = {
  type: 'string',
  minLength: 1,
  not: { pattern: REJECTED_READER_PATTERN },
}

const contractReaderParcelSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['parcelId', 'files'],
  properties: {
    parcelId: { type: 'string', minLength: 1 },
    files: {
      type: 'array',
      minItems: 1,
      items: concreteFilePathSchema,
    },
  },
}

const contractReaderSchema: SchemaObject = {
  oneOf: [concreteFilePathSchema, contractReaderParcelSchema],
}

export const contractReaderEntrySchema: SchemaObject = {
  description:
    "Consumer requirement (review E S3): the `readers` path pattern's " +
    '`\\p{Cc}|\\p{Cf}` clause is Unicode property escapes and is correct ' +
    'only when this schema is compiled with Unicode-aware regex semantics ' +
    "(ajv's `unicodeRegExp: true`, its default). A consumer compiling this " +
    'schema with `unicodeRegExp: false` will have that clause fail to ' +
    'compile or silently stop matching, and the control/format-character ' +
    'rejection fails OPEN.',
  type: 'object',
  additionalProperties: false,
  required: ['contract', 'readers'],
  properties: {
    contract: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    readers: {
      type: 'array',
      minItems: 1,
      items: contractReaderSchema,
    },
  },
}
