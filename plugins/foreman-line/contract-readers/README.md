# @foreman-line/contract-readers

D42 contract-readers registry (GSO-P2): a schema for a shared contract's
declared readers, a touch-set derivation function, and an intersection
predicate that refuses when two touch sets overlap.

## Naming — this is not `plugins/foreman-line/contracts/`

`plugins/foreman-line/contracts/src/registry.ts` already opens with *"Central
registry of every frozen contract: its stable schema name and the typed JSON
Schema"* — it registers the Foreman Line's own frozen **pipeline
stage-envelope** schemas (`build-result`, `closure-record`, `shaping-result`,
and siblings). That is a different concept from this package's registry of
**application-level shared contracts and their declared readers**, used to
refuse co-scheduling on touch-set intersection. This package is named
`contract-readers`, not `contract-registry`, so that two things named
"contract registry" in one plugin tree never mean two different things. This
parcel does not touch `plugins/foreman-line/contracts/`.

## What this package ships

- `src/types.ts` — `ContractReaderEntry`, `ContractReader`, `TouchSet`.
- `src/schema.ts` — the hand-authored ajv `SchemaObject` for
  `ContractReaderEntry`. A `readers` member is rejected if it (a) ends in `/`
  or `\`, (b) contains a glob metacharacter (`*`, `?`, `[`, `]`), (c) contains
  a `.` or `..` path segment delimited by either separator, (d) is absolute
  (leading `/` or `\` — including a UNC or backslash-root form — or a drive
  letter), or (e) has leading/trailing whitespace, is whitespace-only, or
  contains a control character anywhere (Amendment A1, extended by A2(a) —
  BL3/F3/I2, separator-aware plus absolute/whitespace-only rejections — and by
  A3(b)/A3(c), which closed the same backslash-anchoring gap in rule (d) a
  second time and added whitespace/control-character padding). Extension
  presence is untested in either direction — an extensionless concrete path
  (e.g. `Makefile`) is accepted. These are syntactic tests only: a path
  file-shaped by every rule that happens to name a directory on disk still
  passes this schema. **Consumer requirement:** the control/format-character
  clause (`\p{Cc}|\p{Cf}`) is a Unicode property escape and is correct only
  when compiled with Unicode-aware regex semantics (ajv's `unicodeRegExp:
  true`, its default) — a consumer compiling this schema with
  `unicodeRegExp: false` will see that clause fail to compile or silently
  stop matching, and rejection (e) fails open for every input it was meant
  to catch.
- `src/touch-set.ts` — `deriveTouchSet(specSurfaces, repoRoot)` resolves each
  glob against `repoRoot` at the current instant and returns
  `{ files, resolvedAtCommit, resolvedAtTimestamp }` — never a bare file list,
  so a resolved set is never read as a stable enumeration.
- `src/intersect.ts` — `intersects(touchSetA, touchSetB)`: true iff the two
  share at least one file, by exact path identity after normalizing path
  separators.
- `src/registry-data.ts` — the two real contracts populated in this repo
  (Contract A: the spec-frontmatter schema; Contract B: the routing-class
  vocabulary), with their declared readers reconciled against disk by
  `tests/touch-set.test.ts`.
- `src/generate.ts` / `schemas/contract-reader-entry.schema.json` — the
  generated schema; `tests/parity.test.ts` proves it never drifts from the
  typed source in `src/schema.ts`.

## What this package does NOT ship

- **No scheduler integration.** `intersects` and `deriveTouchSet` have no
  caller in this parcel. Wiring them into a dispatch/coordination decision is
  P3's work.
- **No registry population for any repo other than this one.**
- **No import/manifest static-analysis discovery of undeclared shared
  dependencies.** Declaration is the only derivation signal this parcel
  implements — an undeclared shared file is not detected by `intersects`.
  `tests/intersect.test.ts`'s residual-limit twin test pins this statement so
  it cannot be silently dropped.

## Residual coverage (stated, not assumed)

After this parcel ships and before P3 exists, the green suite proves: (a) the
declared-readers schema is enforceable and rejects a container-shaped
(directory/glob) reader entry; (b) touch-set derivation, exercised against
Contract A and Contract B's real reader sets, produces the correct file
identities with resolution provenance; (c) the intersection predicate
correctly refuses on the D34 adversarial shared-dependency fixture once the
dependency is declared, and correctly permits a genuinely disjoint pair; and
(d) every real registry entry (not only fixtures) is schema-valid (A2(d)/F1).
It does **not** prove that any scheduler ever calls this predicate before
dispatching real work (nothing is wired in; that is P3); that the registry is
complete for this or any other repo (only Contract A and Contract B are
populated); that an undeclared shared dependency is caught; **that the
registry→touch-set composition is shipped** (`filesForParcel` is test-local in
`tests/intersect.test.ts` and deliberately **not shipped** as an export — P3
must build its own consumer of `intersects`/`deriveTouchSet`); **that a
resolved touch set is non-vacuous** (a typo'd or deleted `surfaces:` glob
resolves to zero files with no signal, so `intersects` can vacuously permit —
silent-empty resolution is fail-open and this parcel does not detect it)
(A2(e)/F2); **that a populated entry's reader set is complete beyond
`*/src/*.ts` plus the hand-adjudicated `.json` restatement** (A3(e)): the
sweep is scoped to that pathspec plus manually-adjudicated `.json` files, so
`tests/**`, `*.yaml`, and `*.md` restatements are structurally unswept — and
A3(a)'s re-adjudication shows real hits can hide outside that scope; or **that
any declared reader, in or out of scope, is a reader at all** (A4(d), widened
by review E B1/I4): in-scope declarations are also only *ruled*, not
*verified* — B1 found two LOCKSTEP survivors (`validate.ts`,
`routing-eval/index.ts`, both in-scope and both undeclared by A5(b)) that
had passed every in-scope control while failing the lockstep test itself.
A4(c)'s `outOfScopeRuled` control makes an out-of-scope declaration
**ruled**, not **verified** — it fails a spurious declaration that has no
recorded ruling, but it cannot prove a ruled one is a genuine reader, in or
out of scope.

## Working on this package

```powershell
npm install
npm run typecheck   # tsc --noEmit
npm run generate    # rewrite schemas/contract-reader-entry.schema.json from the typed source
npm run test        # tsx --test tests/*.test.ts
npm run lint        # biome check .
```

Runtime dependency: **`ajv` only**, pinned at the same version as
`plugins/foreman-line/contracts` and `plugins/foreman-line/spec-linter`
(`8.20.0`). Touch-set glob resolution uses Node's built-in `fs.globSync`
rather than an added dependency. Requires **Node ≥ 22** (ESM-only).
