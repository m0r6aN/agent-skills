# PMC-P2C offline implementation verification

2026-09-26. Builder release: `c55bd6d960e92ddefe1c321c9ff79ba0d8aa6759`.
The reviewed bootstrap contract is `5764eba8da1485b7850db067041036d211712e12`,
ratified by the coordinator before this release. B1 PR63 was accepted through
`727c055`; its closure/integration is present in the release base. The native
offline agent dispatch is coordinator-authorized; no minted exact-engine receipt
or production inference attestation is manufactured here.

## Delivered boundary

The private controller custody constructor creates only capability registries.
Its authenticators refuse until its one-attempt bind succeeds. Installation opens
the real B1 owner with those callbacks before binding the captured owner, ledger,
terminal and separate observation ports. Only the five approved controller types
are added to the dispatch public barrel; the constructor and all runtime ports
remain package-internal imports.

Request capture, bounds and denial precedence run before owner effects. Aliases
are charged at each expanded occurrence; strings, keys, minimum array traversal,
depth and the exceptional payload budget are checked before expansion. Opaque
capabilities retain identity without freezing caller objects/functions. Acquisition
alone admits the private fixed Uint8Array catalog leaf; it copies it intrinsically
and refuses byte-containing aliases at other paths. Hostile thrown objects are
recognized only by private identity, never inspected or coerced.

The controller calls the real RCM adapter, exact-money helper and sole PMC
resolver. Complete owned request/decision/wire digests, private terminal proof and
selected quality/role bind the B1 selection capability. Reservation, final
revalidation and durable consume precede one captured send. No external observer,
clock or callback runs between the acknowledged consume validation and send.
Observed private proofs drive existing ledger settlement/no-send cancellation
and the B1 completion capability. Predecessor refusal codes and RCM stages are
retained in bounded private failure audit records, not added to public receipts.

Pre-consume failure after reserve retains the actual reservation and pending
owner. Missing acknowledgement, unauthenticated proof and unknown charge never
prove no-send or authorize another operation. Owner finish is attempted once;
money closure alone does not release pending custody. The only pre-reserve
closed-refused proof is minted from this invocation's never-invoked-reserve state;
it cannot be reconstructed after restart.

## Source pins and scope

One-time Git blobs, checked against the released base; no moving-main byte pins
were added to permanent tests:

| Existing source | Blob |
|---|---|
| P2A resolver | `809e8d08a9444c925fb8b88b423e2e4b7ff28625` |
| P2A public types | `893c5ce0cf2105688f3a3e9e8b9c47a485520814` |
| P2B money | `c0d57e17a77b3efc831c144cbf03eba632e56b96` |
| P2B ledger | `552e0b1163178ace90bbc4369edaf30e346d1eb6` |
| B1 runtime | `c2d967de9dc6b0f1fe17f4aafe528a8678194432` |
| F provider validation | `f9f22ccaeaf8d1c1db6c805269575b1c7f3cc0ad` |

Exactly five implementation paths: controller.ts, controller-types.ts, the
type-only index.ts addition, pmc-controller.test.ts and this report. No predecessor
source, fixture, manifest, lockfile, registry, configuration or SDK file changed.

## Acceptance evidence

| AC | Permanent evidence |
|---|---|
| 1 | Independent ordinary-invalid cases; hostile thrown proxy; exact 65536/65537 expanded-node controls with distinct and aliased records; depth 16/17, 2048/2049 strings, 262144/262145 payload and 1048576/1048577 aggregate controls. Oversized array rejects before ownKeys. Every disabled alias, pinned lanes, priority and schema near-miss have zero-effect checks. |
| 2 | Actual retained public PMC fixture conventions, real adapter/resolver/money. Source/profile/digest/price identity/count/request/quality/availability mutations reject at the expected owner stage. Literal initial/fallback digest fixtures remain unchanged under recursive property reordering; changing prior evidence invalidates the digest. |
| 3 | Real SQLite B1 and ledger stores, concurrent and reentrant same-intent refusal, pending-owner close/reopen, actual R1-to-R2 successful declared fallback, both prior-claim domain negatives checked directly against the actual resolver, no third attempt, authentic unknown R1 blocking the preissued R2 before acquisition. |
| 4 | Private selection copies/proxies/cross-custody refuse; captured method replacement and caller mutation cannot replace owned authority; final wire identity/endpoint/headers/body digest/effort/count/proof mutations refuse; ordered consume-return/send/observe trace. |
| 5 | Real store transitions with pre-call failure and post-call lost-acknowledgement wrappers at recordDecision/reserve/consume/settle/finish. These are controller-boundary fault simulations forwarding actual store operations, not a claim of physical power-loss simulation. Real retained liabilities, replay blocking and reopen are asserted. B1/P2B's existing storage-fault suites also remain in the full dispatch regression run. |
| 6 | Network-incapable test-only terminal/profile/observation fixture, unknown/no-proof/throw/malformed proof retention, known over-bound ledger freeze, no production constructor/credential path. No request field selects synthetic mode. |
| 7 | Explicitly synthetic D-port certificate checks final body model, effort, privacy, tools/structured-output absence and count plus every Revalidation field. Unknown billing certificate refuses. Real-store stop/length/failed/no-send/unknown dispositions and same-proof state-aware replay are checked. This is C's offline contract coverage, not actual Pi/post-hook/HTTP/billing conformance. |
| 8 | Public additions are types only. Predecessor/v0 sources remain unchanged. Actual D19 and mutation checks run. Independent source reviews and separately scoped Contract B enrollment remain coordinator gates. |

## Commands and observed checks

Commands run with process PATH prefixed by `D:/nvm/v24.19.0` and
`TSX_DISABLE_CACHE=1`, using existing matched-lock dependency junctions. No install.

- Initial focused RED: `node --import tsx --test tests/pmc-controller.test.ts`
  failed for the missing controller module. Bootstrap GREEN followed. The real
  SQLite integration test then failed with INSTALLATION_REFUSED before its path
  was implemented. A hostile-thrown-object regression failed with the wrong
  refusal and passed after removing thrown-object prototype inspection.
- Final focused controller suite: 86/86 passed, native exit 0. Final full dispatch
  `node --import tsx --test --test-reporter=spec tests/*.test.ts`: 442/442 passed,
  native exit 0; `npm.cmd run typecheck` and `npm.cmd run lint`: native exits 0/0.
- Coordinator pre-freeze inspection found nested header insertion order affecting
  the wire digest. A permanent reversed-authentic-header regression first returned
  WIRE_REFUSED (RED native exit 1). Owning headers in declared content-type/accept
  order fixed it (GREEN native exit 0). The test independently hashes a literal
  JSON serialization layout and checks both revalidation claims and final receipt;
  only run-specific owner/decision/body strings are interpolated. It uses neither
  controller key lists nor object enumeration for that expected serialization.
  One attempted rerun from the worktree root failed to resolve tsx; the evidence
  above is from the correct dispatch working directory, with no installation.
- Routing-policy full `node --import tsx --test --test-reporter=dot tests/*.test.ts`,
  `npm.cmd run typecheck`, `npm.cmd run lint`: native exits 0/0/0. One existing
  informational literal-key diagnostic remains in catalog-snapshot.test.ts.
- Mutation-scope-guard `npm.cmd test`, typecheck and lint: 44 tests passed,
  native exits 0/0/0. Existing DEP0190 warning is unchanged.
- Actual D19: `node --import tsx src/d19-audit.ts --plugin-root
  D:/Repos/agent-skills-worktrees/hro-pmc-p2c-20260926/plugins/foreman-line`:
  native exit 0; 21 packages / 200 source files, zero unruled instances,
  B1 9/9, ledger 10/10 and registry DATA 10/10. Output was fully collected before
  summarizing and reading the exit. An earlier truncated pipeline did not retain
  a usable native exit and is not used as evidence.
- Contract-readers tests: native exit 1 at touch-set.test.ts:588. Typecheck/lint
  native exits 0/0. This is the known ownership enrollment described below.

## Required separate Contract B enrollment

The unchanged Contract B routing-class vocabulary sweep correctly discovers
`plugins/foreman-line/dispatch/src/pmc-launch/controller.ts` as an additional
genuine closed-enum reader. Its expectedUndeclared list has seven paths; the
actual list contains those same paths plus controller.ts. The failing assertion
is `A2(b)(2)/(4) Contract B — every surfaced file is adjudicated; both signals;
residual blindness stated` at touch-set.test.ts:588. This is Contract B, not
Contract A frontmatter. The initial progress message mislabeled the contract;
the source inspection and this report correct that label.

Coordinator disposition: preserve the genuine validation, complete the exact
five-file source handoff, and commission a separate narrow reader enrollment
after source review. No registry/test/audit edits or literal evasion are authorized
in this parcel. Current D19 already passes; this report authorizes no pin change.
Focused final reproduction command from contract-readers:
`node --import tsx --test --test-name-pattern='Contract B — every surfaced' tests/touch-set.test.ts`.
Native exit 1; exact diagnostic and changed assertion entry:

```text
AssertionError [ERR_ASSERTION]: Contract B sweep surfaced a file with no ruling recorded above, or a previously-adjudicated file disappeared. Surfaced-but-undeclared: ["plugins/foreman-line/dispatch/src/approval-cli/index.ts","plugins/foreman-line/dispatch/src/pmc-launch/controller.ts","plugins/foreman-line/dispatch/src/routing-eval/index.ts","plugins/foreman-line/skill-injection/src/cli.ts","plugins/foreman-line/spec-linter/src/grandfather.ts","plugins/foreman-line/spec-linter/src/index.ts","plugins/foreman-line/spec-linter/src/testing.ts","plugins/foreman-line/verification/src/pipeline/index.ts"]
+ actual - expected
+   'plugins/foreman-line/dispatch/src/pmc-launch/controller.ts',
at tests/touch-set.test.ts:588:10
```

This expected integration failure is neither hidden nor described as a green
Contract B gate.

## Limits and release status

All authority issuers and transport certificates in tests are explicitly
synthetic-offline. Tests exercise actual A/B/B1 code and temporary SQLite stores;
they do not establish production origin/profile/endpoint/tariff/availability,
actual provider billing, Pi lifecycle or network conformance. No provider request,
credential read, production store, host configuration, live smoke or savings
measurement occurred. No exactly-once delivery or two-store atomicity is claimed.
The P2D/P2E production gates, independent implementation reviews, reader enrollment,
combined integration, remote CI and merge remain coordinator-owned.

## Source-review body-budget repair

Repair release base: `29b542eeed44dca5e92e2e1ee7cce3b535d84532`.
Both independent reviews held the original source for the same final-body bound
error; the baseline 86/442 green tests did not establish this omitted boundary.
The coordinator clarified the contract and separately released exactly three
existing files: controller.ts, pmc-controller.test.ts and this report. Types,
barrel, predecessors, registry/audit, manifests and dependencies are unchanged.

Only the final wire body's value now bypasses ordinary UTF-16 string/aggregate
charging. Its independent cap remains 1,048,576 UTF-8 bytes; normal depth and
key/value-node accounting occur before that branch. Other metadata, nested body
keys and original request payloadJson retain their original bounds. A sweep of
capture call sites found final wire ownership at ownWire's capture call; retained
owned wire/proof observations do not recapture its body with a different budget.

Nine permanent tests supplement, rather than replace, the original baseline:

- ASCII body of 262,145 bytes succeeds, independently exceeding the request limit.
- ASCII and three-byte-character JSON bodies at exactly 1,048,576 bytes succeed
  through real temporary B1/P2B stores and two proof verifications/one synthetic send.
  Each corresponding 1,048,577-byte body refuses WIRE_REFUSED before verification,
  reservation or send. Sizes are independently asserted outside the captured port,
  so an assertion throw cannot masquerade as expected refusal.
- Metadata independently measures 2,048/2,049 string units (including nested body),
  1,048,576/1,048,577 aggregate units excluding only the body value, and
  65,536/65,537 nodes including the body's key/value. Deliberately malformed headers
  end in a trapped sentinel: reaching it at the exact bound, but not one over,
  distinguishes capture enforcement from later schema rejection. These are capture
  controls, not claims that those malformed headers are valid transport input.
- Request top-level/nested body strings remain ordinary; payloadJson still refuses
  262,145 UTF-16 units. Existing exact request/depth/alias controls remain intact.

Genuine RED before controller edits, native exit 1:

```text
node --import tsx --test --test-name-pattern='final body independent budget|final body exception|wire-only body' tests/pmc-controller.test.ts
✖ final body independent budget: ASCII above request UTF16 cap
✖ final body independent budget: ASCII exact byte cap
✖ final body independent budget: multibyte exact byte cap
✖ final body exception preserves ordinary wire metadata aggregate budget
ℹ tests 9
ℹ pass 5
ℹ fail 4
```

The three valid-body cases returned WIRE_REFUSED; the exact metadata aggregate
case could not reach its sentinel. After the isolated accounting fix the same
nine controls passed, native exit 0 (9 passed, 0 failed). Final verification uses
Node 24.19.0 with the same process PATH/TSX_DISABLE_CACHE and existing dependencies.
No unchanged routing suites are repeated for this narrow repair. The earlier
Contract B failure remains a separate enrollment gate; this repair makes no new
D19/audit claim and performs no provider/Pi/configuration operation.
Repair verification log, from the dispatch package directory:

```text
node --import tsx --test --test-reporter=spec tests/pmc-controller.test.ts
ℹ tests 95
ℹ pass 95
ℹ fail 0
FINAL_FOCUSED_NATIVE_EXIT=0

node --import tsx --test --test-reporter=spec tests/*.test.ts
ℹ tests 451
ℹ pass 451
ℹ fail 0
FROZEN_DISPATCH_NATIVE_EXIT=0

npm.cmd run typecheck
> tsc --noEmit
FROZEN_TYPECHECK_NATIVE_EXIT=0

npm.cmd run lint
> biome check .
Checked 27 files in 69ms. No fixes applied.
FROZEN_LINT_NATIVE_EXIT=0
```

The final full suite includes the strengthened outside-callback measurements for
all new body and metadata controls. It retains every original test, with zero
skips/cancellations/todos. Native exits were captured immediately after each
command, before summarizing output. `git diff --check` passed, and the repair diff
contains only the three authorized paths. Fresh independent source reviews and
separate Contract B enrollment remain required; the builder does not self-approve.