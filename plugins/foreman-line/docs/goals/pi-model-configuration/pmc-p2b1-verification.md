# PMC-P2B1 private implementation verification

Private offline build on `codex/hro-pmc-p2b1-20260926`, released from
`11f479d72bfd785ea21a2fb32ab2685abe20476b`; B1 contract blob
`b5f8a8665695de2874264561c86845788c2460da`. The real Step 0 stopped before writing;
the coordinator subsequently recorded the native-dispatch/profile exception and
the independent-process CAS test interpretation in the specification. No exact
engine-version attestation or production routing receipt is invented.
The coordinator subsequently ratified the terminal-commit/reopen distinction at
`625030fb90c3152d63007882576f04577bc3f22a` after independent disposition review.

## Implemented surface

Only the five authorized files are added: private owner implementation/types,
permanent tests, isolated process fixture, and this report. Installation invokes
`initializeIntentOwnerV1`, `openIntentOwnerV1`, and `closeIntentOwnerV1` by internal
import. The controller port has only begin/recordDecision/finish. No public barrel
export, dependency, ledger/resolver source, host configuration or production
integration changes are made.

The closed batch preissues two request IDs and an episode per intent before caller
digest construction. Actual SQLite stores exactly owner_meta and intents. Each
write revalidates the bounded row and exact revision under BEGIN IMMEDIATE;
callbacks run outside transactions. Private claim identity, in-progress guards,
one-use proof consumption, immutable state, and conservative quarantine enforce
the capability lifecycle. Open validates file custody, schema/columns/indexes,
identity, integrity, sizes, settings and every retained row. Connections are
operation-scoped; closing the installation invalidates all instance capabilities.

P2A runtime/type blobs match merged source `4b86643acd4e5cdf183e85cf1cd1c2ace51e0182`:
resolver `809e8d08a9444c925fb8b88b423e2e4b7ff28625`, types
`893c5ce0cf2105688f3a3e9e8b9c47a485520814`. P2B source matches
`835a6dd82ee4e50652362e7201a79b7451bbd221`: ledger
`552e0b1163178ace90bbc4369edaf30e346d1eb6`, money
`c0d57e17a77b3efc831c144cbf03eba632e56b96`. Actual predecessor types are imported;
the owner has no runtime resolver, money, ledger or controller import.

## Acceptance evidence map

| AC | Permanent evidence |
|---|---|
| 1 | Own-descriptor capture rejects getters, symbols, hidden keys, prototypes, functions, nonfinite values, thenables, cycles, sparse arrays, depth and alias-expanded bounds. Closed callback results reject throws, getters, promises and extra fields. Authentication denial creates no file; setup reentry cannot initialize the same root. Duplicate intent/business authority/business tuple and batch bounds refuse. |
| 2 | Real temporary SQLite exclusive initialization, same-ID reopen, partial/missing storage, extra tables/columns/indexes/triggers, metadata/identity/row/revision/ID corruption, sidecar and oversized-file refusal. Real junction negative and canonical-path negatives run on Windows. Page-size readback/runtime negatives and full 128-intent positive run. Lost initialization acknowledgement cannot reinitialize. |
| 3 | Preissued IDs precede digest fixtures. Each route identity/template dimension and supplied/computed digest independently refuses. Wrong origin has no claim. Pending claim persists before use and restart cannot reconstruct it. Unselected held/closed-refused blocks without fabricated selection/history. |
| 4 | Two independent processes race actual begin: one winner, one persisted revision. A separately isolated SQLite process wins selection and finish CAS boundaries; stale owner refuses, exactly one revision advances. Same-intent callback reentry refuses while the callback can acquire a real writer transaction. Copied/proxied/cross-instance/restart claims and repeated capabilities refuse; ordinary returned data is owned/frozen. |
| 5 | Primary and terminal matrix-fallback initial selections; declared primary-closure second slot; undeclared fallback, success, uncertain, pending, held, closed-refused and selected fallback termination. Independent prior IDs/digests/disposition/quality negatives and real completed second-slot termination. |
| 6 | Actual separate owner and P2B files; before/after write-COMMIT faults for owner begin/selection/finish and ledger reserve/consume/settle/cancel. Sender failure retains consumed liability; ledger closure with owner-finish failure leaves owner blocking. Real process exits before/after owner begin/selection/finish COMMIT exercise rollback-journal recovery. Close-after-commit failure returns COMMIT_UNCERTAIN and quarantines the local instance. |
| 7 | Explicit private synthetic capability issuers reject caller JSON. Actual ledger cancellation/settlement/uncertain results are independently checked across ledger/epoch/request/scope/cost/maximum/state/charge/proof/time dimensions. Unselected terminal outcomes refuse. Selected never-invoked no-send and unselected closed-refused use ledger:null only through private synthetic completion custody. Production semantic/wire/charge authenticity remains the P2C/P2D registry obligation. |
| 8 | Real P2A primary R1 -> preissued R2 fallback succeeds. Both prior Claims keep R1/primary-binding evidence; current owner episode/budget bind R2. Independently rebinding either prior claim to R2 yields CONTEXT_BINDING_REFUSED. Full-prior-evidence declaration-order hash fixtures are literal SHA-256 values, stable under input key reversal and changed by prior-evidence mutations. Original expiry survives and stale prior quality blocks. |

Initial tests failed with the missing owner module. Lifecycle tests then failed
before implementation. Dedicated setup-reentry and postcommit-close tests exposed
real defects, failed before their fixes and passed afterward. Fault injection
targets write transactions, not the predecessor's earlier read transaction.
SQLite is never replaced by a map. Synthetic issuers are test-local and never
prove that production P2C/P2D/P2E authentication exists.

The independently calculated literal request hash values are:

- Initial: `03df081eee666a13c19bf9be62d2b509e62a3772f07fcb39cc5b53538c06c91b`.
- Complete fallback: `21a36bfa4f26baec79295c8eadadda45e53f46a735110eec51e3b7434be504d2`.

## Commands and observed outcomes

All commands use `D:/nvm/v24.19.0/node.exe` (observed `v24.19.0`), process-local
PATH precedence and `TSX_DISABLE_CACHE=1` for test runs. Existing matched-lock
node_modules junctions are read-only; the coordinator supplied missing sibling
junctions after initial TS2307 dependency failures. No install ran.

| Working package | Literal Node arguments | Observed result |
|---|---|---|
| dispatch | `--import tsx --test tests/pmc-intent-custody.test.ts` | 144 passed before adding six process-exit cases; zero failed/skipped. |
| dispatch | `--import tsx --test --test-name-pattern 'process exit' tests/pmc-intent-custody.test.ts` | Six process-exit cases passed; zero failed/skipped. |
| dispatch | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | Exit 0: 332 passed (150 owner tests), zero failed/skipped before the four additional ratified-reopen tests. No runtime source changed afterward. |
| dispatch | `--import tsx --test --test-name-pattern 'ratified reopen' tests/pmc-intent-custody.test.ts` | Final targeted exit 0: all four added paired-fault cases pass (154 owner cases total). |
| dispatch | `node_modules/typescript/bin/tsc --noEmit` | Exit 0 after final source, process tests and ratified-reopen cases. |
| dispatch | `node_modules/@biomejs/biome/bin/biome check .` | Exit 0, 24 files, no fixes or warnings. |
| routing-policy | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | Exit 0, 938 passed, zero failed/skipped. |
| contract-readers | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | Exit 1, 69 passed / 1 failed: Contract B newly surfaces the owner's literal routing vocabulary without adjudication. |
| mutation-scope-guard | `node_modules/tsx/dist/cli.mjs --test tests/*.test.ts` | Exit 1, 43 passed / 1 failed: real D19 inventory requires enrollment. |
| verification | `node_modules/tsx/dist/cli.mjs --test tests/rcm-provenance-audit.test.ts` | Exit 1, 28 passed / 2 reported failed (baseline subtest plus parent), same unenrolled D19 inventory. |

No failing integration gate is waived. The D19 inventory identifies the owner's
three explicit guarded resolve(root) sites and six SQLite exec sites (page size,
settings, BEGIN IMMEDIATE, COMMIT, ROLLBACK, fixed schema execution). This private
base also predates the coordinator's accepted P2B audit enrollment and therefore
reports ten predecessor instances. B1-specific enrollment and Contract B reader
adjudication need separately released coordinator files and independent review.
No detector spelling, verification scanner, reader registry or grandfather rule
is changed here to suppress detection.

## Custody limits and remaining gates

The initiating task registry, fixed installation root/identity and approved batch
must come from reviewed P2E installation. Selection/completion registries must
come from direct reviewed P2C resolver/ledger calls and P2D semantic/wire proofs.
Private synthetic fixtures do not supply those production authorities. Parent
directory ACL/ownership is a precondition; Windows mode bits are not an ACL proof.
Hardware power loss, hostile OS writers, privileged in-process code, copied roots
and rollback to an older legitimate database are outside this guarantee.

Pending/held/uncertain/refused remains blocking after restart. A process exit
before a finish commit leaves pending; a terminal finish committed before process
exit leaves the authenticated terminal row. The coordinator expressly ratified
that normal reopen may use a valid primary terminal-no-send/failed-settled row for
the predeclared R2 only, even when its commit acknowledgement was lost. Paired
actual-ledger faults cover both dispositions: ledger reconciliation before owner
COMMIT remains blocked, whereas committed owner closure permits R2 after reopen.
The quarantined original instance refuses, R1 cannot replay, prior quality remains
unchanged, and no third attempt is possible. This adds no recovery authority or
fabricated completion capability. No permanent cross-restart acknowledgement-loss
marker is present or claimed in the specified closed Slot union.

Independent implementation reviews, separately reviewed audit/reader enrollment,
reconciliation onto accepted main, integration checks and remote CI remain gates.
No provider call, budget provisioning, real sender, production activation, push,
merge or full-HRO completion is claimed.

## Coordinator review triage: capture preflight repair

Frozen e6b2956 received one independent APPROVE and one REQUEST CHANGES. The
blocking P2 finding is accepted: Object.getOwnPropertyDescriptors at capture line109
materializes every caller descriptor before enforcing visit/array bounds. Reviewer
probe saw 70,001 descriptor traps on an oversized70,000-entry array before refusal.
This is a resource-bound defect, not an established custody/state-machine bypass.

Repair within original runtime/test/report envelope only: preflight actual array
length and minimum expanded traversal budget before own-key enumeration or child
value descriptors. For ordinary records, preflight own-key cardinality and key
string budgets before fetching child descriptors. Preserve exact advertised
16depth/65,536visit/2,048perstring/1,048,576aggregate bounds, expanded aliases,
accessor/iterator refusal, hostile-trap typed refusals and owned immutable capture.
Key enumeration itself and arbitrary Proxy trap internals cannot be made bounded
by this helper; make no sandbox claim. Do not invoke accessors/iterators or count
bulk descriptor materialization as a bound. Add permanent overbound negatives
showing no child-descriptor traversal, setup authentication or I/O; include sparse
and dense arrays, record cardinality/aggregate keys, exact boundary and late caller
mutation/refusal. Native AST/audit fingerprints remain deferred until repaired
source receives two independent approvals.

Fresh Step0 inspection/restate/STOP precedes coordinator repair release. Builder
writes only intent-custody.ts, pmc-intent-custody.test.ts and this verification
record. No owner schema/types/worker/ledger or external integration edits; no
source acceptance from prior partial approval. Run focused RED/GREEN, full dispatch
and affected typecheck/lint, frozen predecessor/scope checks, localcommit/handoff.
