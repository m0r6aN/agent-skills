# Checkpoint P catalog-publication verification

Implementation release: `0aae48fe5995844a476dff977480d565d3ea196e`.
Reviewed construction design: `773daa5c947f4e9dde10f0ae1b5c0a1552ac9499`.
Authority: [publication specification](../../specs/active/RCM-HRO-authenticated-catalog-publication.md)
and [publication shaping decisions](hro-rcm-publication-shaping.md).
Status: implementation frozen for two independent source reviews; this builder
report is not approval or production activation. Node used: 24.19.0.

## Delivered scope

Exactly six new files: three private dispatch modules, two dispatch test files,
and this report. No public barrel, reader, adapter, materializer, C/B1/ledger,
fixture, schema, registry, dependency, package or lockfile changes. Existing
matching-lock dependency junctions were used without installation or mutation.

The production constructor unconditionally refuses INSTALLATION_REFUSED without
reading its argument, clocks, configuration, credentials or transport. The offline
constructor captures closed declarations and runtime methods once, issues private
identity capabilities, and fixes endpoint/profile/domain. Runtime callbacks are
an explicitly installed offline TCB, not a security boundary against hostile code.
The native bridge is implemented now, but it is not installed by the production
publication constructor. No callback can enable that production constructor.

The shared engine constructs exactly one fixed credential-free HTTPS GET, with
agent:false, TLS verification and a 16 KiB parser header cap. Native request,
response and socket events feed that same engine. It accepts fixed, nonshared,
nonresizable byte views through intrinsic copying, bounds bytes before retention,
and validates UTF-8 and HTTP framing. It has no retry, redirect or credential
fallback. Actual N alone parses and materializes JSON; the actual canonical reader
checks catalog results. Raw bytes remain private with receipt times and provenance.

Publication has one CAS generation per scope for both catalog and absence.
Old variant handles are deleted on replacement. Incomplete-only failures publish
nothing and do not globally revoke an otherwise valid earlier generation.
Operations reserve one of four slots before scheduling, are single-use, and cannot
be revived by old cancellation/operation capabilities. Original transport promise
settlement requires actual connection evidence plus all applicable terminal close
acknowledgements on success and failure. Cancellation/deadline fixes the outward
result separately. Missing connection evidence conservatively holds the slot;
there is no timeout-based reset or capacity refund for uncertain cleanup.

## RED/GREEN record

Initial RED was a missing-module failure for the two new factories before source
creation. It was not a claim of a pre-existing runtime regression.
Additional permanent controls produced genuine failing assertions before repair:

- Reentrant scope registration issued two capabilities; it now rechecks the
  registration after the captured clock callback before issuing custody.
- A first-invocation clock failure left never-started operations occupying slots;
  it now latches the refusal and reclaims those operations without transport.
- Unicode whitespace was accepted as HTTP whitespace; only space/tab now match.
- Synchronous scheduling failure leaked its returned timer; pre-open refusal now
  removes its abort listener and clears the returned timer.
- A native socket/response arriving after an early abort escaped destruction;
  the native bridge now destroys late resources and still awaits actual closes.
- 129 declared scopes were traversed before refusing; the 128 scope limit is now
  checked before child descriptor reads.

All corresponding GREEN controls run in the final focused suite. No test changes
weaken existing gates or replace N, the canonical reader, adapter, B1, C or ledger.

## Final checks

| Check | Result |
|---|---|
| Two focused publication/transport test files | 62 passed, zero failed/skipped/cancelled |
| Complete dispatch package suite | 535 passed, zero failed/skipped/cancelled |
| Complete routing-policy package suite | 964 passed, zero failed/skipped/cancelled |
| Complete hybrid-routing package suite | 53 passed, zero failed/skipped/cancelled |
| Complete contract-readers package suite | 72 passed, zero failed/skipped/cancelled |
| Complete mutation-scope-guard package suite | 44 passed, zero failed/skipped/cancelled |
| Dispatch typecheck | exit 0 |
| Full dispatch lint | exit 0; no diagnostics |
| Actual D19 audit against this checkout | exit 0, RESULT: PASS; registry 11/11 and exact digest match |
| Exact scope and whitespace validation | six authorized new paths; git diff --check passed |

The final test-only TEMP cleanup refinement validates canonical containment and
closes the owner before deleting the fresh fixture. The62focused tests, typecheck
and full lint were rerun afterward; no runtime source changed after full suites.

Commands used the pinned Node executable with each package's existing tsx,
TypeScript and Biome entrypoints. Full package tests used `--test tests/*.test.ts`;
focused tests named the two new test files. D19 ran the actual verification source
with its existing tsx loader and this checkout's plugin root. Logs are local TEMP
`rcm-p-focused.log`, `rcm-p-dispatch-final.log`, `rcm-p-routing.log`,
`rcm-p-hybrid.log`, `rcm-p-readers.log`, `rcm-p-mutation.log`, `rcm-p-tc.log`,
`rcm-p-lint.log` and `rcm-p-d19-final.log`; these are execution evidence, not
portable artifacts or substitutes for independent reruns.

## Evidence and coverage limits

| Contract | Permanent evidence |
|---|---|
| Actual native bridge | Isolated child imports the real bridge after guarding HTTP/HTTPS/net/TLS/DNS boundaries. EventEmitter stand-ins exercise native listeners, fixed request arguments, end/destroy, complete flag, delayed closes, missing connection evidence, early/late abort resources and error paths. No fixture is cast to a genuine Node instance. |
| Shared transport | Success/failure cleanup waits, fixed arguments, one open/end, 301/302/401/403/429/500 refusal, critical duplicate headers, HTTP tokens/controls/whitespace, content length, UTF-8 errors, incomplete/duplicate events, throwing/malformed open/control/end/destroy and synchronous-event handling. |
| Exact numeric bounds | 8 MiB body and +1, fragmented multibyte decoding, 16 KiB reconstructed headers and +1, 256 pairs/+1, 128 scopes/+1, 256 identities/+1, 4096 UTF-8 bytes/string and +1, exact 1 MiB expanded string budget/+1. Byte subclasses and mutation, shared/resizable/proxied/lookalike views are paired. |
| Structural preflight | Instrumented exact depth16/depth17 and 262144/262145 expanded-value captures, including reused array aliases. These deliberately have invalid outer schema and both ultimately refuse: the positive boundary proves the last permitted descriptor/leaf is reached; the over-boundary proves it is not. They do not claim deep arbitrary objects are valid owner inputs. |
| Capability custody | Production zero reads, closed unknown records/accessors/symbols/extras/thenables, immutable declarations and captured runtime functions, duplicate/unknown/foreign scope, forged/copied/cross-owner handles, and scope-before-generation refusal. |
| Concurrency | Four occupied slots, fifth refusal, never-invoked expiry/reclamation, original connected cleanup release, no-connect indefinite hold, single-use request, and one coalesced waiter abandoning its wait without cancelling the other. |
| CAS and absence | Competing candidates, both-direction variant replacement, exact mixed absent set, mixed incomplete/facts scope retention, current-absence refusal, incomplete refresh preserving earlier valid data, expiry, and cancellation during the final pre-CAS clock read for both variants. |
| Genuine owner composition | Actual N raw fixture to publication to actual canonical adapter; detached byte mutation cannot affect later reads. A fresh TEMP B1/ledger/C installation authenticates origin before synchronous acquisition and uses actual publication bytes/source declarations. Missing tariff claims produce MONEY_REFUSED with zero terminal calls. |
| Provenance and unknowns | Exact raw SHA-256, fixed profile/domain/endpoint, start/receipt/validity times, real N duplicate/malformed JSON and coverage refusals. Publication grants no quality, independence, billing, account, approval or budget facts. |

The construction budget counts expanded values and record-key/string-value UTF-8
bytes; numeric array positions are not source strings. Aliases are captured once
from caller descriptors and each occurrence is charged through owned data. The
materializer retains its own accepted combined source-string accounting unchanged.
The stricter closed construction shape cannot itself require depth16 or262144
values; the instrumented hostile-shape controls above verify those capture gates.

No TLS connection, DNS request, metadata endpoint call, inference, credential or
configuration access was performed. Guarded stand-ins establish native event
translation, not real socket cleanup timing or endpoint compatibility. Official
metadata availability without credentials remains an activation prerequisite;
401/403 stays refusal, with no authentication fallback. The genuine C composition
proves refusal/custody ordering, not a completed paid inference or complete
production evidence. Production installation/profile authority, P4A admission,
live transport proof and full HRO success remain separate release gates.

## Independent source review — b86dcbe00ce837e2c7c2fa10403a87840a4ebe46

Root and frontier D request changes for one reproduced blocker. The publication
owner and transport engine each keep a separate history for the same installed
clock. Sequence 0,1,2,3,2,4,5,6,7 crosses from owner 3 to transport 2 but publishes
generation 1. Root independently reran D's probe. D also separately reproduced
UTC-only and monotonic-only rollback; neither dimension is protected at the seam.
The required nondecreasing history is installation-wide, not per wrapper.

Repair must share validated history across every owner/transport read while
preserving the independent fixed native transport factory. Rollback must retain
INSTALLATION_REFUSED: before opening, no I/O and no occupied capacity; after
opening, existing connected/closed cleanup rules continue to hold capacity until
authenticated settlement. Keep equal/increasing positive controls and independent
UTC/monotonic rollback controls in both directions across the boundary. No changes
to N, adapter, C/B1/ledger, existing native request policy or production refusal.

Both reviewers independently passed 62 focused tests, dispatch typecheck and
changed-file lint. Root read all three modules; D additionally inspected native
cleanup, CAS/cancellation, custody and bounds. Existing tests miss this defect.
Probe files are TEMP/hro-p-clock-review.mjs, hro-p-clock-mono-review.mjs and
hro-p-clock-utc-review.mjs. These run actual publication/N with fake native input,
not a provider request. The source remains frozen for fresh builder Step0 and
explicit release. Two independent repair reviews remain before integration.
