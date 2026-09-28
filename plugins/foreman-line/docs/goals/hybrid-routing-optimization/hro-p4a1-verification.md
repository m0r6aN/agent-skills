# HRO P4A1 implementation verification

This report records the bounded offline implementation released after the
HRO-P4A1 Step 0 dispositions. It does not claim production installation,
business-intent uniqueness, provider evidence, broker composition, or live HRO
completion.

## Frozen implementation envelope

The implementation contains exactly these five new files:

- `plugins/foreman-line/dispatch/src/pmc-launch/recovery-admission.ts`
- `plugins/foreman-line/dispatch/src/pmc-launch/recovery-admission-types.ts`
- `plugins/foreman-line/dispatch/tests/pmc-recovery-admission.test.ts`
- `plugins/foreman-line/dispatch/tests/fixtures/pmc-recovery-admission-worker.ts`
- `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p4a1-verification.md`

No existing owner, schema, barrel, dependency, provider, Pi, credential or
configuration file is changed. The dependency link is a read-only junction to
the matching-lock donor worktree; no install or package mutation was run.

## Contract evidence

The production constructor returns `PREREQUISITE_UNAVAILABLE` before reading
its argument or touching the filesystem. The offline constructor is private in
scope, calls the actual `initializeIntentOwnerV1` with its fixed captured setup
adapter, retains actual episode/R1/R2 projections, and stores only the original
request digest and durable identity fields.

The admission store is exactly two STRICT tables, `admission_meta` and
`episodes`, with only the expected implicit primary/unique indexes. It uses
exclusive file creation, `mode=rw`, defensive SQLite, extensions disabled,
DELETE journal, `synchronous=EXTRA`, `trusted_schema=OFF`, foreign keys,
`busy_timeout=1000`, 4096-byte pages and a 4-MiB page/file bound. The complete
batch is written under `BEGIN IMMEDIATE`, committed, reread and validated before
the capability is returned.

Input capture is closed and owned: accessors, symbols, thenables, cycles,
non-plain prototypes, unknown keys, non-finite values and hostile traps refuse.
The declared depth, expanded-node, ordinary-string, path, payload, 128-intent,
256-KiB UTF-8 and registration bounds are enforced before the B1 mutation.
Array minimum-cost and the closed top-level `intents` cap are checked from the
observable length before own-key enumeration. Array costs include only JSON
punctuation and values; object keys retain their escaped UTF-8 costs. Aliases
are charged at expanded cost. Roots are existing temporary fixture directories
with the fixed name, caller and canonical component checks, no reparse/symlink
components, regular single-link artifacts and nonzero filesystem identity.

The private broker claim is consumed before its successful return and cannot be
replayed. A process race is arbitrated by B1's exclusive store and admission
file creation. Any B1/admission commit or close uncertainty retains artifacts
and exposes no capability. A restart has no API for reconstructing a claim or
admission.

## Verification run

Using Node `v24.19.0` from `D:\nvm\v24.19.0\node.exe`:

- Focused recovery suite: 13 passed, 0 failed.
- Full dispatch suite: 369 passed, 0 failed, 0 skipped.
- Dispatch Biome check: 28 files checked, 0 errors.
- Dispatch typecheck: passed with no diagnostics.
- Nineteen absent sibling `node_modules` directories were linked read-only after
  each package-lock SHA-256 matched the E1 donor; no install or donor write was
  performed.

The focused suite proves:

1. zero-read production refusal;
2. actual B1 IDs, exact independent request-digest fixtures and immutable
   SQLite registration;
3. existing B1/admission refusal, aliases, schema tampering and no repair;
4. matching-target junction refusal before canonicalization, exact 256-KiB UTF-8
   acceptance, exact 256-KiB-plus-one refusal with no stores, and 129/70,000
   length refusal before own-key descent (the 70,000 array is under an unknown
   field and therefore exercises the general expanded-array preflight);
5. hostile input and bound refusal before mutation;
6. independent-process same-root race with one complete winner;
7. B1 uncertainty before and after COMMIT;
8. admission uncertainty before and after COMMIT;
9. one-use claim consumption;
10. actual B1 plus actual ledger paired terminal behavior, where an acknowledged
   owner terminal commit permits only predeclared R2 and ledger-only closure
   remains blocked.

The subprocess fixture is test-only fault instrumentation. It is restored in
the child process and is not a production port, mode switch or authority path.

## Remaining gates

Two independent implementation source reviews, combined integration checks and
remote CI remain required. The future production constructor and P4A broker
composition must be implemented and reviewed separately; this offline fixture
does not authenticate production authority or storage custody.

## Independent source acceptance and separate audit gap

Root and independent frontier D approve finalb63310141a81a07704e7ac644b4bcaf96889f264.
Both checked corrected matching-target junction, unknown-field array preflight and
exact/+1 JSON budget controls, with13 focused tests passing independently. Runtime
remains208ca3c; D also reran typecheck and changed-test lint. Prior full369 dispatch
and package checks remain scoped to208ca3c, before test-only repairb633101.

Actual root D19 run fails exactly six SQLite.exec class-4 noninstances in this new
owner. This is recorded as a failure, not omitted or waived. Root and independent
frontier D approve audit-only amendmenta53f2af226a6cfd5c7d04266ef42665b776c48be;
implementation needs genuine Step0 and explicit release. Existing runtime is
frozen. Combined integration, actual audit acceptance and remote checks remain
before merge. Source acceptance is offline only and does not admit production.

## D19 audit enrollment

The released audit enrollment adds one exact-file pin set for the six reviewed
SQLite `exec` sites in
`dispatch/src/pmc-launch/recovery-admission.ts`. It pins the 21 accepted
declarations, six call roles, and 78 external identifier provenance records by
AST fingerprint and exact cardinality. The existing PMC ledger (10/10) and
intent-custody (9/9) pins remain unchanged; no prior acceptance pin was
weakened or widened.

The actual D19 audit over 21 ratified packages and 200 source files reports:

- 0 unruled class-1 through class-5 instances;
- PMC ledger 10/10;
- PMC intent custody 9/9;
- PMC recovery admission 6/6;
- final result `PASS`.

The dedicated mutation suite runs the actual audit subprocess over temporary
ratified-package copies and passes 19/19 cases. It covers missing, duplicate,
nested, renamed and changed owner declarations; all nine imports; all four
top-level variables; each six-site mutation; constructor and defensive-option
changes; receiver assignment and shadowing; external provenance assignment and
shadowing; a real subprocess call; a same-name owner in another file; and an
empty exact owner. Approved formatting/comments and unrelated source continue
to pass, while the existing ledger and intent-custody outputs remain required
in every refusal assertion.

This enrollment remains syntactic and exact-file scoped. It does not claim
general dataflow or runtime integrity beyond the six enrolled calls, and it
does not alter the production recovery-admission runtime.

## Combined integration acceptance — 2026-09-26

Root approves audit 255dbd85fda0e7080fee3350c8e6c08c610e83fa and combined
 d6c0cd8d5f0756d270e2f6f65e14286ef4309d32 after reconciling its fixed declarations,
call roles and external references against the accepted runtime. Independent
frontier D also approves this exact combined head. Runtime/test diff against
approved b633101 is empty. Existing ledger and intent pins remain unchanged.
D independently ran the actual audit, typecheck/lint and three further mutations
(const to let, unary guard change, type-only DatabaseSync import); each mutation
refused with recovery 0/6. No mutated source was executed.

Root combined evidence on local Node 24.19.0:

- Full verification: 658/658, exit 0, including the 19-group new mutation suite.
- Full dispatch: 492/492, exit 0 (67cfe84; later change is audit/report only).
- Dispatch and verification typechecks and changed-file lint: exit 0.
- Independent actual D19: PASS, ledger 10/10, intent 9/9, recovery 6/6.
- Runtime remains the reviewed offline owner; production construction still
  refuses without inspecting input. These results do not activate HRO recovery.

Root logs: TEMP/hro-p4a1-combined-verification.log and
TEMP/hro-p4a1-combined-dispatch.log. Independent probe:
TEMP/hro-p4a1-independent-probe.mjs. Remote checks and merge remain required.

## Accepted offline recovery-admission parcel — 2026-09-26

PR69 (https://github.com/m0r6aN/agent-skills/pull/69) merged at
2026-09-26T23:27:17Z as c1f6fdd67c7a5251d57eb0241cc75ea06381cac2. All twelve
remote checks passed on exact reviewed head e5cf0d7f7e6cf7196fd3f1dfb847b79ba4889c48.
Root and frontier D approved runtime and audit/combined source independently;
combined dispatch 492/492 and verification 658/658, typechecks, changed-file lint
and actual D19 passed. The standalone admission spec moves to done.

Only this offline prerequisite closes. Production installation/admission authority,
P4A broker, repaired publisher and transport, measured receipt integration and live
HRO acceptance remain open. No provider call, account access or config apply ran.
