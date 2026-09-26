# PMC-P2B integration audit repair

The integration amendment in the active PMC-P2B contract authorizes this repair
at predecessor `b6ac337588d6073dd12fc41f81d1908d2f33134a`. The original D19
failure comprised two guarded `resolve(root)` calls and eight SQLite `db.exec`
calls in `dispatch/src/pmc-launch/ledger.ts`. The ledger and money implementation
remain unchanged from reviewed commit `835a6dd`.

## Reviewed values and scope

Only the exact plugin-relative ledger filename can enroll the ten sites. The
audit pins complete, direct SourceFile declarations for `path`, `settings`,
`transaction`, `initializeLocalPmcLedger`, `connection`, and `fail`. This includes
the absolute-root refusal before both resolve calls, the rejection body, both
DatabaseSync constructions, and the transaction control flow. All six existing
imports and the fixed schema declaration are pinned as provenance values too.
Every declaration must occur exactly once. Missing, changed, duplicated, renamed
or nested owners fail even when no offending call survives the change.

The ten calls have individually pinned AST values, owner-relative traversal
ordinals, and report roles:

| Owner | Ordered roles | Count |
| --- | --- | --- |
| path | root-normalization, canonical-comparison | 2 |
| settings | pragmas | 1 |
| transaction | begin, commit, rollback | 3 |
| initializeLocalPmcLedger | begin, schema, commit, rollback | 4 |

The complete owner value pins each role's control-flow position; the two identical
resolve expressions cannot relocate independently. Each role must occur exactly
once. Enrollment is all-or-nothing after all declaration, call and provenance
checks. Class 4 and class 5 consult only the resulting individual AST-node set;
the rest of the file continues through every existing detector.

## Fingerprint algorithm and limitations

`pmcAstValue` recursively visits TypeScript AST children in order and serializes
each node as `[SyntaxKind, children]`. A childless token uses its exact token text
instead of a child array; a childless non-token uses an empty array. SHA-256 over
the UTF-8 JSON serialization is the fixed reviewed fingerprint. Offsets, trivia,
comments and incidental punctuation absent from the AST are not values. Literal
contents, operators, identifiers, optional-call tokens, wrappers, statement order
and control flow are values. Formatting and comments have positive controls.

Outside the selected declarations, references to the explicitly listed protected
provenance names are inventoried in traversal order. Each entry includes the
ancestor SyntaxKind sequence and the immediate parent's AST fingerprint. Their
fixed aggregate digest catches added assignments or shadow bindings outside the
owners as well as changes to their existing call-site context. This is a bounded
syntactic inventory, not general flow analysis. It neither proves runtime object
identity nor detects arbitrary reflective mutation, monkey-patching or hostile
runtime behavior. It does not freeze unrelated ledger declarations or file bytes.
Future intentional changes to these reviewed values need an explicit pin update
and review; no fingerprint is learned from the current source at audit runtime.

Pins reconcile whenever the exact ledger file is swept. An empty swept ledger
still expects ten sites and every declaration. A synthetic tree without this
optional file retains the existing swept-file pin convention. Same-named owners
in any other file receive no PMC enrollment. Existing registry/provenance pins
retain their prior behavior.

## Verification and handoff

The focused test first reproduced the original failure, then passed with the
repair. Permanent tests execute the real D19 subprocess against isolated copies
of the ratified package sources. Controls cover every owner and every call;
guard polarity, operand, conjunction, bypass, order and conditional control flow;
import substitution/aliasing; constructor settings/substitution; local and
external assignment/shadowing; schema and SQL arguments; optional calls/receivers
and wrappers; missing/extra sites and owners; an empty exact file; same-named
owners in another file; and a real child-process exec spelling in the ledger.
Mutation source is parsed by the audit, never executed as ledger code.

Node `24.19.0` is used via process-local PATH and its absolute executable. Existing
matched-lock dependency junctions are read-only; no installation was performed.
Validation results are recorded below before local handoff. No provider/config
calls, live ledger creation, push, PR operation or merge is part of this repair.
Two independent repair reviews and complete green remote CI remain coordinator
gates after this local commit.

Local results on 2026-09-26:

- Initial focused regression: failed on the original ten D19 instances, as expected.
- First focused mutation matrix: 155/155 passed; the final three added controls
  also passed as part of the full suite (158 PMC tests including its parent).
- Full verification suite: 341/341 passed, no skipped tests.
- Full mutation-scope suite: 44/44 passed, no skipped tests.
- Verification and mutation-scope typecheck and lint: passed.
- Real-tree D19: zero unruled instances, ten of ten PMC sites, RESULT: PASS.
- `git diff --check`: passed. Ledger and money diff against `835a6dd`: empty.

Local evidence is retained in the OS temporary directory under
`pmc-audit-red.log`, `pmc-audit-focused.log`, `pmc-audit-verification-full.log`,
`pmc-audit-mutation-full.log`, `pmc-audit-typecheck.log`, `pmc-audit-lint.log` and
`pmc-audit-real-tree.log`. These logs are local handoff evidence, not repository
artifacts or substitutes for the required fresh reviews and remote CI.

## Coordinator triage of independent repair reviews — 2026-09-26

Both reviewers withhold approval ofdef8884. Root reproduced reviewer B's eight-case
probe with Node24.19.0: unary ! to + in the absolute-root guard, runtime import to
type-only, and const schema to let all incorrectly retained D19 PASS10/10.
Initializer reassignment outside its declaration also passed. This is a bounded
fingerprint defect, not demonstrated runtime path escape. Ledger remains unchanged.

Accept these as required repair within the same three-file amendment. Replace the
incomplete forEachChild-only semantic representation with a complete syntactic
TOKEN representation that includes operators, modifiers, import/export type-only
markers, declaration kind and punctuation wherever meaningful. Do not patch only
the reported scalar properties; cover EVERY semantic token in enrolled owners,
imports, schema, calls and external-reference contexts. Comments/whitespace remain
irrelevant. Regenerate pins from unchanged reviewed ledger only after the algorithm
is fixed. Retain exact file/owner/site/value/cardinality refusal and all existing
unrelated inventories. This is still bounded syntax, not general dataflow proof.

Reconcile protected provenance identifiers against EVERY pinned owner, including
initializeLocalPmcLedger, so its external reassignment or shadowing cannot be
silently excluded. No blanket binding-name/annotation/file exemption. Add permanent
RED/GREEN controls for the three reproduced token collisions and owner reassignment,
plus representative operator/modifier/declaration token changes, positive ordinary
comments/whitespace and unrelated-source changes. Keep all existing158focused
controls (or equivalent counted coverage), fullverification341 baseline and44
mutation-scope tests. Run real-treeD19, affectedtypecheck/lint and sourcefreezechecks.
Fresh Step0/release, localcommit/handoff and two independentfinalrepairapprovals
remain required. No ledger edit, provider/config effect, push or merge by builder.
