# PMC-P2B1 reader and mutation audit enrollment

The coordinator released this separate five-file repair after a fresh Step 0 at
`b8565c8d41ead1a61bcb12333f5f1dd5ad2e5fcc`, with active spec blob
`b24be6b31d39783446345eb3e7c7542e02f20102`. Its historical e6b source reference is
explicitly superseded by the coordinator's twice-approved repaired source
`3f31181dbd9cb83cac8a235b8592d53c7e594f0a`, runtime blob
`c2d967de9dc6b0f1fe17f4aafe528a8678194432`. Source approvals do not substitute for
this audit's two independent reviews. Node is pinned to 24.19.0; dependencies
remain existing matched-lock, read-only junctions. No install ran.

## Contract B

The intent owner validates routingClass against the full literal vocabulary.
Adding a supported class requires changing that membership list, so this is a
genuine additive LOCKSTEP reader. The registry now includes the exact owner path;
the test records its ruling, checks the exact five readers and actual derived
five-file touch set, and removes the owner from a local registry copy to prove the
unchanged disk sweep reports it as undeclared. Contract A and other rulings remain
unchanged. The new reader test failed before enrollment and passes afterward.

The D19 registry DATA count changes from 9 to 10 solely for that path. The fixed
SHA-256 of JSON.stringify(sorted values) changes from
`d5a4c056a28824b3417e0dfa37e0191c437cc16a1fdc83dcd85ffa9467d565cd` to
`dda1e79b0cfbf2767aef8eb37d67f235647e046fd52c98a53bdcd23809de748d`.
No literal detector or declaration/location restriction is weakened.

## Exact D19 enrollment

Only `dispatch/src/pmc-launch/intent-custody.ts` can enroll these nine calls:

| Complete direct owner | Role | Calls |
|---|---|---|
| path | supplied root normalization, ancestor start, canonical comparison | 3 resolve(root) |
| settings | fresh page size, fixed pragma block | 2 SQLite exec |
| transaction | BEGIN IMMEDIATE, COMMIT, ROLLBACK | 3 SQLite exec |
| initializeIntentOwnerV1 | fixed two-table schema loop | 1 SQLite exec |

Twenty-one fixed declaration fingerprints cover all seven imports, nine complete
functions (the four direct owners plus connect, fail, io, nativeCode and rows),
and schema/FILE/FILE_LIMIT/initializing/codes declarations. This retains rejection
control flow, ancestor/symlink/file guards, constructor receivers and options,
settings readbacks, fixed SQL and transaction handling. External references to
these owners and protected native/imported bindings have a fixed digest over 99
ancestor/context records:
`979e0f608d80579f8ee5cfc654244a9e6738bcc684ec9a845b83613500b4e294`.
Pins were derived once from the approved source; no audit run learns its baseline.

The accepted complete AST plus gap-token fingerprint functions and every existing
ledger constant/enrollment function are byte-identical to b8565c8. B1 has separate
error/site accounting. Each declaration and call must appear exactly once with
the fixed fingerprint, and external provenance must match. Any discrepancy denies
all nine enrollments. The existing per-swept-file reconciliation policy remains;
an empty exact file fails missing declarations/calls. Same-named owners elsewhere
receive no enrollment. All unrelated class detectors remain active.

This is bounded syntactic assurance, not general dataflow or hostile-runtime
integrity proof. It neither authorizes a provider launch nor authenticates runtime
production authority. Source behavioral/custody tests remain separate evidence.

## Verification

Permanent tests run the real audit subprocess against copied package source.
Mutated source is parsed, never executed. Controls cover every direct/helper owner
(missing, duplicate, nested, renamed, changed), all imports, every call (missing,
extra, argument, optionality, wrapper, receiver), guard polarity/position/operands,
unary tokens, type-only imports, const/let/var and other syntax tokens, fixed SQL,
constructor options, owner/import reassignment and shadowing, initializer
reassignment, empty exact file, same-named owners elsewhere and unrelated
subprocess/root calls. Positive controls retain comments, whitespace, JSDoc and
unrelated safe source changes. Negatives require a B1-specific fingerprint or
cardinality diagnostic and zero enrolled B1 sites, not merely any audit failure.

The initial real-audit baseline failed before enrollment. A subsequent actual-tree
audit passes: 21 packages/198 source files, B1 9/9, ledger 10/10, DATA 10/10 and no
unruled class 1–5 instance. The reader suite passes 71 cases; mutation-scope passes
44. Typecheck/lint pass for verification, contract-readers and mutation-scope.
Full verification passes 580 tests with zero failures/skips, including all B1,
existing ledger and RCM real-audit controls (333.7 seconds).

Executed with process-local Node PATH and TSX_DISABLE_CACHE=1 for test runs:

| Package | Node arguments | Final result |
|---|---|---|
| verification | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | 580 pass; no failures/skips |
| contract-readers | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | 71 pass; no failures/skips |
| mutation-scope-guard | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | 44 pass; no failures/skips |
| Each package above | `node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| Each package above | `node_modules/@biomejs/biome/bin/biome check .` | exit 0 |
| verification | `--import tsx src/d19-audit.ts --plugin-root D:/Repos/agent-skills-worktrees/hro-pmc-p2b1-integration-20260926/plugins/foreman-line` | exit 0; exact inventories above |

Read-only comparisons confirmed accepted AST/gap-token and ledger pin/enrollment
code unchanged, owner bytes unchanged, and `git diff --check` clean. Formatting
corrections affected only the authorized audit/test files.

The four frozen owner source/type/test/worker files remain byte-identical to
3f31181. This repair changes only the five authorized audit/reader/report files.
No runtime, dependency, manifest, host configuration, production store, provider,
budget, push or merge operation is part of this repair. Independent audit reviews,
combined integration verification and remote checks remain acceptance gates.
