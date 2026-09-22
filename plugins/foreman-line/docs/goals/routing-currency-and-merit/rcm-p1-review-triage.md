# RCM-P1 review triage

## First review: `cf20fd8` (2026-09-22)

**Reviewer:** one fresh frontier session, zero builder context, read-only, in a
detached worktree. The parcel is standard risk, so one review is required.

**Verdict:** REQUEST CHANGES.

**Coordinator closure check before review:** the builder's diff matched the
Allowed Files. The tests, typecheck, lint, whitespace check, and both scope
searches passed in PowerShell on Node v24.7.0. Test count was 228 of 228: 69
existing and 159 new.

**Coordinator reproduction:** a separate coordinator probe confirmed F1, F3, and
F5. A snapshot mutated after reading produced facts with `contextWindow: -1` and
an input rate of `NaN`, and the snapshot was not frozen. A `__proto__`
thinking-map key projected as `{status:'declared', levels:[]}`. Null bytes, a
null snapshot, and a throwing identity getter all threw. F2 was confirmed by
reading the code: identity fields are read more than once.

| Finding | Severity | Summary | Disposition |
|---|---|---|---|
| F1 | P1 | A forged or post-read-mutated snapshot yields facts carrying the original digest | Fix. Amendment A2 adds `SNAPSHOT_UNVERIFIED_REFUSED`, a frozen snapshot, and a membership check |
| F2 | P2 | Identity fields are read several times, so a getter can split `requested` from the facts and defeat the duplicate check | Fix under A2: read each field once |
| F3 | P2 | A `__proto__` thinking-map key is dropped | Fix under A2: keep it verbatim |
| F4 | P2 | The purity scan misses 14 of 17 bypasses, and the runtime stubs miss `new Date()` and `performance.now` | Fix under A2: positive controls and wider stubs |
| F5 | P2 | Hostile inputs throw instead of refusing | Fix under A2: a never-throw rule with a code mapping |
| F6 | P3 | An empty query, fragment, or userinfo in a `baseUrl` is accepted | Fix under A2 |
| F7 | P3 | Closed-shape checks use `in`, so an inherited `endpoints` is accepted | Fix under A2: own-property checks |
| F8 | P3 | Test gaps in AC3, AC7, AC8, AC10, and AC15 | Fix: add every listed test |
| F9 | P3 | The `isValidBaseUrl` export is extra | Accept as documented. It is an internal helper shared by the two sibling modules and adds no capability |

The reviewer confirmed that endpoint equality is exact, the freshness boundaries
are correct, the canonical-bytes check is sound, refusals do not echo catalog
strings, and the fixture derives from P0.

Amendment A2 was committed alone as `b01b6c7`, before any rework code. The
rework was dispatched to the builder with a Step-0 gate, a test-count tripwire
of at least 228 with no deletions, and an instruction to sweep every instance of
each defect class.

## Second review: `cf4fc2d` (2026-09-22)

**Reviewer:** a second fresh frontier session, independent of the first reviewer
and the builder, read-only, in a detached worktree.

**Verdict:** REQUEST CHANGES. F1, F3, F6, and F7 were verified closed. F2, F4, and F5
were not fully closed.

**Coordinator closure check before review:** 335 of 335 tests passed, and typecheck,
lint, the whitespace check, and both scope searches were green in PowerShell. No
test was deleted relative to `cf20fd8`. The coordinator probe confirmed that the
first-round F1, F2, F3, and F5 reproductions now refuse.

**Coordinator reproduction:** R1, where a `null` request throws a destructuring
error. R2d, where a caller-overridden `identities.map` returns `ok: true` with the
real digest and provenance alongside forged `openrouter/auto` facts carrying a
`-1000000` rate. R3, where deeply nested JSON throws `Maximum call stack size
exceeded`. R5 was not rerun, because the reviewer showed the bypass passing the
real scanner, `tsc`, and `biome`.

| Finding | Severity | Summary | Disposition |
|---|---|---|---|
| R1 | P1 | A hostile or `null` request object throws | Fix: guard the request read under the A2 mapping |
| R2 | P1 | Caller-owned `map`, species, iterator, or proxy traps run inside the projector, and can forge an `ok: true` result or defeat read-once | Fix: copy by index loop into a local array, and never call caller methods |
| R3 | P1 | Deep nesting overflows the stack in canonical re-serialization | Fix: every reader step sits inside the `FORMAT_REFUSED` guard |
| R4 | P1 | `bytes.length` is read twice, once outside a guard | Fix: take a single defensive byte copy and use only that copy |
| R5 | P1 | The static scan misses dynamic `import()` and `Function` reached via `.constructor` | Fix: ban both, with positive controls. The README must describe the scan as a regression tripwire, not a proof |
| R6 | P2 | The README and code comments make false never-throw, read-once, and purity claims | Fix after the code fixes |
| R7 | P3 | A lying `length` subclass lets non-canonical bytes pass | Fix: closed by R4's single copy |
| R8 | P3 | The URL check accepts surrounding whitespace, an uppercase scheme, and `https:host` | Fix: require lowercase `https://`, no whitespace, and no backslash |
| R9 | P3 | Test gaps for the approved-config empty `?`/`#`/`@` variants and for R1 through R4 | Fix: add the tests |
| R10 | P3 | `requested` can hold a live caller object when a field is not a string | Accept as documented. The contract permits echoing caller input, and refusals carry no catalog values |

Rework round two was dispatched with a Step-0 gate and a test-count tripwire of at
least 335, with no deletions.

## Builder session loss and resume (2026-09-22)

The round-two builder session was ended by a model-side refusal ("Sonnet 5 can't
help with this") after committing `b5f8bb5..f92ccf5`. It never delivered a
completion claim, so its work was treated as untrusted. Before the loss, it had
breached its Step-0 gate by proceeding without waiting for "Proceed". Its commits
predated three coordinator corrections: keep the contract signature, keep
throw-only `FORMAT_REFUSED` mapping, and add an internal-slot byte gate.

A fresh resume session re-verified the inherited work at its Step 0. It confirmed
R2, R3, R5, R8, and R9 as closed, and R1 and R4/R7 as open. It also found a new
read-once gap: `approvedConfig.authorityRef` was read three times, so a flipping
getter could forge `provenance.approvedConfigRef`. It closed everything at
`c13e4bb`, with 385 tests.

**Routing deviation:** the resume builder ran on the frontier tier instead of the
standard mid-tier. The mid-tier model had refused the parcel's hostile-input test
material twice.

## Third review: `c13e4bb` (2026-09-22)

**Reviewer:** a third fresh frontier session, independent of all earlier
sessions. It was read-only and ran mutation testing: 24 mutants, 22 killed, and
2 equivalent on every reachable input.

**Verdict:** APPROVE WITH NITS. F1 through F8 and R1 through R9 were all verified
closed, each with a test that fails when the fix is reverted. All four
coordinator rulings were verified.

**Coordinator reproduction:** N1, where a sparse identity list of length
2^32 - 1 under a 256 MB heap ended in a V8 out-of-memory abort, exit 134. N3,
where a non-oldest provider time of 2099 produced facts.

| Finding | Severity | Summary | Disposition |
|---|---|---|---|
| N1 | P2 | A huge `identities` length aborts the process out of memory | Fix under amendment A3 (`3f4a599`): 256-entry caps checked before allocation |
| N2 | P3 | Patching global prototypes in the same realm defeats the WeakSet and meta-router checks | Accept as documented. A3 puts same-realm tampering out of the threat model, and the README must say so |
| N3 | P3 | A future provider time is accepted when it is not the oldest | Fix under A3: any provider time later than evaluation refuses `FUTURE_REFUSED` |
| N4 | P3 | Extra ownKeys and descriptor trap calls on the configuration | Accept. Values are read once and cannot be forged |
| N5 | P3 | The static scan is bypassable through a computed `constructor` key | Accept. The README already calls the scan a regression tripwire, not a proof |
| N6 | P3 | The `__proto__` thinking-level key is tested only at the reader | Fix: add a projector test |
| N7 | P3 | The diff lists the spec as an eighth file | Informational. The coordinator committed the spec |

Rework round three was dispatched with a Step-0 gate and a floor of 385 tests.

## Fourth review, focused on the A3 delta: `7faa46a` (2026-09-22)

**Reviewer:** a fourth fresh frontier session, read-only, reviewing the delta
`c13e4bb..7faa46a`.

**Verdict:** APPROVE WITH NITS, with no blocker. All eight new behaviour tests fail
against the pre-A3 projector. The N6 mutant and an N3 `>=` mutant are killed. No
test was deleted or weakened, and the test-file diff is additions only.

**Coordinator closure check:** 399 of 399 tests passed, and typecheck, lint, the
whitespace check, and both scope searches were green in PowerShell on Node
v24.7.0. No test line was removed since `3f4a599`. Coordinator reproduction under
a 256 MB heap: a sparse identity list of length 2^32 - 1 now refuses
`REQUEST_INVALID_REFUSED`, a same-size endpoint list refuses
`AUTHORITY_INVALID_REFUSED`, and a 2099 provider time refuses `FUTURE_REFUSED`.

| Finding | Severity | Summary | Disposition |
|---|---|---|---|
| S1 | P2 | The caps bound count, not string size. 256 multi-megabyte IDs raise heap sharply, and 20 MB strings abort out of memory | Accept as documented under A3's resource-exhaustion exclusion. **Open disposition:** RCM-P5 shaping must consider a per-string length cap on dispatch inputs |
| S2 | P3 | A zero-provider snapshot would reach `new Date(Infinity)` in the new future check | Accept as latent. It is unreachable because the reader refuses an empty `providers` list and the projector accepts only reader-issued snapshots |
| S3 | P3 | The sparse-endpoints test also passes on pre-A3 code | Informational. The Proxy endpoints test with an element counter discriminates |

**Chain state:** green. RCM-P1 stops at the human Gate 3 merge decision. No merge,
push, or pull request has been made.
