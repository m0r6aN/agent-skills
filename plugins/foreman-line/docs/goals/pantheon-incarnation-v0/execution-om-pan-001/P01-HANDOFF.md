> Historical revision-0 handoff follows verbatim. Its then-open toolchain gate and source status were superseded by the independent 2026-10-20 recovery and the EX9 revision-1 handoff appended below; the original failures remain evidence.
# P01 builder handoff — frozen source, acceptance pending

P01 implementation is complete within its bounded authoring scope and frozen for independent verification and P02 integration. This is a builder handoff, not source acceptance, a reviewer receipt or Runtime admission. The full package test gate remains open because the prescribed Node image conflicts with existing exact-version PMC checks. B1 requires both final P01/P02 source heads and two fresh whole-unit review passes.

## Identity, source and authority

- Worker task `/root/p01_builder`, native slot three; actual `CODEX_THREAD_ID=01a15962-c00c-7341-a358-f81791084f18`.
- Actual `CODEX_SESSION_ID=01a15424-1fd5-77a2-a73a-d92a60a5de34` is the parent/coordinator. No other environment values were read.
- Worktree `C:/Users/clint/AppData/Local/Pantheon/OM-PAN-001/work/foreman-p01`; branch `codex/om-pan-001-p01`.
- Base and unchanged Git HEAD `64fb8949bf5134f96fda02df0d4f52ac291a6138`. All parcel changes are uncommitted; no commit/push/PR/merge was performed.
- Immutable dispatched spec SHA-256 `cbec4ab9ccc4d5352f772e23c86d4121482ccf7d37c1393bddf4d0c4f9af393d`; directive SHA-256 `8329a3dc17f0bc9c1d009056d2d646f05e894b06e2648f01cfa87c4fe5801bd0`.
- In-repository implementation spec `docs/specs/active/PAN-P01-delegated-contracts.md`, SHA-256 `235add339192bf57c7361effcc3a6dee50fcc2a6bf2726e9d3b8d7f10178c92d`.
- Start `2026-10-20T12:56:31.368Z`; absolute deadline `2026-10-20T13:41:31.368Z`. Final freeze time is captured in the evidence manifest. Step 0 was matched by the coordinator before edits.

The exact nineteen touched paths are the allowed-file list in the implementation spec and `parcel-dispatch-r7/P01-preparation.json`. The evidence `source-manifest.json` enumerates each path, final SHA-256 and byte length, including this handoff, plus base/head/branch/spec pins. Its digest is reported separately to avoid a self-referential hash. `tracked.diff` captures the tracked diff; hashes include the new files as well.

Final executable source hashes:

| File | SHA-256 |
|---|---|
| `dispatch/src/pantheon-runtime/contracts/index.ts` | `73421f6f19249a6fc9c434be87b9d927fc9ab802d0c28a2cbf3096e8db8f0b6b` |
| `dispatch/tests/pantheon-contracts.test.ts` | `2da000ccc6d0dd6c222974cde8e11d8c4e759a7ddc18cf661b088d24e70f7dc4` |
| `dispatch/src/pantheon-runtime/contracts/README.md` | `dd26e3d279110b5d05a482108e80dd2736e8b7a6985d76de58caa759014d6f12` |

## Delivered behavior and evidence

The fourteen prepared documentation amendments were retained and updated where needed. The standing mandate now includes actual EX4/EX5/EX6 revision-2 pins, completed P00 independent source/finding closure, R7 limits and review units, reserved checker succession, offline dependency/cutover rules and permanent native closure. The goal skill consumes the completed plan gate without authorizing another plan call. Step 0 compares automatically under the scoped mandate; material changes retain owner disposition. Unrelated goal gates and the general Runtime launch refusals remain unchanged.

The contract module imports only existing Foreman role vocabulary and performs pure structural validation. Public results remain `structurally-valid`/`unverified` or typed refusal. It supplies DispatchIntent, Step0Restatement, ReviewResult, EvidenceProvenance, MaterialException, exact operation requirements and private NDJSON frame types. It compares all descriptor fields; rejects extra/absent/malformed paths, tools and identity/hash/epoch drift; separates nullable monetary categories; binds full review subjects and coverage; preserves explicit unverified provenance; checks distinct read-only reviewer seats; and separates material authority changes from ordinary evidence holds.

The wire contract freezes one LF frame at 65,536 UTF-8 bytes, depth 16, 8,192 nodes and 256 list entries, with duplicate decoded-key refusal. Responses expose closed structural/operational denial reasons and recovery owner. Completion is an unverified observation, never a permission spend, terminal settlement, occupancy release or successful merge. Trusted custody startup/succession remains outside the application operation map. Exact schema/bounds and P02–P06 responsibilities are documented in the module README; P08 remote execution stays reserved.

Existing fleet inference and isolated-ref staging semantics are preserved. Proposed P03 versioned worker-success/Git/Cortex bindings are labeled extensions, not current store capabilities. The actual Runtime baseline contracts were read through coordinator-provided exact Git blobs after `runtime-root` was confirmed object-only. Permission-event receipt, nullable delegation-chain and `sha256:` permission/effect hashes align with Runtime's AuthorityBinding. No competing authority engine, fake human approval or second spending gate was created.

Focused fixtures cover valid controls and independently mutated negative paths: forged receipt/accepted/verified fields, paths, every top-level identity/hash/head/role/tool/host mismatch, flags, empty/inconsistent/wrong-artifact/head review, model-supplied provenance, author-as-reviewer, same-vendor exception scope/two-seat floor, each material delta field, nullable/integer/overflow money, unknown operations, frame mismatch/oversize/depth/duplicates, hostile objects/getters/cycles and malformed Unicode. A final inspection added original-versus-derived projection head consistency; final checks below cover that exact source.

## Commands and observed results

Raw evidence root:

`C:/Users/clint/AppData/Local/Pantheon/OM-PAN-001/control/goals/pantheon-incarnation-v0/execution-om-pan-001/parcel-dispatch-r7/p01-builder-evidence`

Every `*.command.json` retains the full Docker argv array, start/finish, actual exit and post-run exact-name cleanup result. Final verification records also bind both TypeScript source hashes. Every test/lint/typecheck log is complete raw combined output; no “pass” is inferred from a truncated tool display.

Environment: prescribed `node@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5`, observed Node 24.22.0 from supplied readiness evidence, read-only exact prepared dependencies, non-root `1000:1000`, network none, pull never, 2 CPUs pinned to 0/1, 2 GiB RAM, 256 PIDs, read-only image, dropped capabilities, no-new-privileges and 768 MiB tmpfs. Each uniquely named job used `timeout --signal=TERM --kill-after=5s 600`. No credentials, Docker socket or host Node was used inside verification. Every job's container was absent after exit.

| Evidence stem | Actual command after timeout | Exit | Result |
|---|---|---:|---|
| `typecheck-1` | `npm run typecheck` | 0 | Initial non-final source passed |
| `test-1` | `npm test` | 1 | 866 tests: 587 pass, 279 fail, 0 skipped/cancelled/todo; 411531.998332 ms |
| `format-1` | Existing Biome `check --write` on `/tmp` copies | 1 | Config-relative include paths processed zero files; preserved raw outcome |
| `format-2` | Existing Biome `check --write` on `/tmp` copies with copied config | 1 | Formatted two files; seven source lint errors reported and fixed |
| `format-3` | Same bounded formatter | 0 | Two files formatted, no remaining formatter errors |
| `typecheck-2` | `npm run typecheck` | 0 | Intermediate source passed |
| `focused-1` | `./node_modules/.bin/tsx --test tests/pantheon-contracts.test.ts` | 0 | 111 pass, 0 fail/skipped/cancelled/todo |
| `lint-1` | `npm run lint` | 0 | 54 files checked; seven existing informational diagnostics |
| `typecheck-3` | `npm run typecheck` | 0 | **Final executable source** |
| `focused-2` | `./node_modules/.bin/tsx --test tests/pantheon-contracts.test.ts` | 0 | **Final executable source:** 111 pass, 0 fail/skipped/cancelled/todo; 2019.93829 ms |
| `lint-2` | `npm run lint` | 0 | **Final executable source:** 54 files checked; seven existing informational diagnostics |

The coordinator explicitly authorized the bounded formatter and focused final test command; both used the same pinned read-only/offline container configuration and never modified the dependency cache. The formatter modified only `/tmp` copies and the exact two allowed source files through captured bytes.

Full-suite failure distribution, preserved in `full-suite-failure-files.json`:

| Existing test file | Failures |
|---|---:|
| `tests/pmc-catalog-publication.test.ts` | 1 |
| `tests/pmc-controller.test.ts` | 82 |
| `tests/pmc-intent-custody.test.ts` | 132 |
| `tests/pmc-ledger.test.ts` | 49 |
| `tests/pmc-owned-sender.test.ts` | 3 |
| `tests/pmc-pi-runtime.test.ts` | 1 |
| `tests/pmc-recovery-admission.test.ts` | 11 |

The existing ledger and intent-custody implementations explicitly require `process.version === 'v24.19.0'` while package engines permit `>=24.11.1`. The prescribed image is 24.22.0. Observed failures include `LEDGER_SETTINGS_REFUSED`, `SETTINGS_REFUSED`, recovery `STORAGE_INVALID`, failed initialization assertions and the Pi subprocess's `assert(initialized.ok)` at existing test line 493. These are outside P01 source scope. Version mismatch is a concrete blocker and likely shared cause; this handoff does not claim every failure is independently diagnosed or repaired. The coordinator will prepare a compatible exact toolchain for independent checking. No guard was weakened.

The full run observed 110 then-current Pantheon tests passing. Later source refinements are covered by final focused/typecheck/lint evidence; the full suite is **not** claimed against final bytes. Counts were read from runner summaries and cross-checked using explicit `C:/Program Files/Git/usr/bin/grep.exe -c` on `^✔ Pantheon:` (110 in `test-1.log`, 111 in `focused-2.log`) and `^test at tests/` (279 in `test-1.log`).

`git diff --check` passed. Package-lock SHA-256 remains `cea3dd4132d20f3b34f9dda1cdb44fd8df530ddcf50f384d9da74653eebc4920`. Active instruction searches are captured in `active-instruction-reconciliation.log`: remaining human gates concern initial ratification/material authority, unrelated goals, or coordinator compare-and-continue. Supported package installation and loaded digest verification were not performed by this builder.

## Remaining gates and freeze

No independent checker, source acceptance, substantive B1 reviewer pass, Runtime admission, real provider call, durable event authentication, OS containment proof, supported package installation or production readiness is claimed. Structural fixtures cannot prove those effects. The full-suite/toolchain issue must be resolved through independent evidence, and all actual P01/P02 heads/spec/test bindings must close before acceptance.

The source freeze is the final `source-manifest.json` timestamp and nineteen-file hash set. After that record, this builder makes no further source edits. Any requested rework needs a new explicit bounded coordinator dispatch and invalidates affected coverage. P02 may use the frozen unactivated contract; it may not inherit a source pass from this handoff. No paid inference, package fetch, authority-file mutation, extra agent or Git mutation occurred.

## EX9 revision-1 supersession — 2026-10-21

The original 2026-10-20 builder window and its failures above remain closed historical records. On 2026-10-20T15:42:20.383Z the independent checker recorded `accepted-bounded-source-after-unchanged-test-environment-recovery`: canonical `parcel-dispatch-r7/p02-independent-check/check1/pi-linux-recovery/p01-source-acceptance.json`, SHA-256 `89bcaa0a040be42be766e0a92ac284655014d197dd5f56d69ada771c4eed83d3`. The unchanged source on Node 24.19.0 passed targeted Pi 3/3 and full suite 867/867, zero failures/skips, plus typecheck and lint (seven existing infos). Raw result SHA-256 `e8d3dc22654941a0a58c28353bc93efac468950d94bb6cc095c9dfb3ed535d17`, stdout `75018e231087519f8911d8a190aa77c1fd7ca4005a606379d5f0d153f677519b`. This supersedes the original environment blocker, not the original 279-failure report or any B1 review requirement.

EX9 actual receipt `exceptions/EX-OM-PAN-001-09-ratification.json` SHA-256 `d32aeafcc4bf041f74a7edc8dc87073054b67124f9b127fcc7175b19a429659f` authorized revision 1. Original worker/parent identities and slot 3 are unchanged. Current unchanged HEAD is `1c81c25432bd9bda0b8c42727f758473ade7029c`, branch/worktree as above. The coordinator-only specification commit precedes these edits. Dispatch SHA-256 `579f14cd8f7a83c4d3ca1f7e5c062c0e3c6d2e1a50e88bbc709f25a085ebe634`; revised spec `4037e489ccf7acd25369e668e5a010e5740e5cca6f2b7efe1ea0a99d0a9a91f4`. Step 0 matched automatically at 02:44:12.537Z (event 145). Absolute authoring/check window: **2026-10-21T02:41:01.455Z–03:26:01.457Z**. No reset of any original session, paid allowance, source revision or cumulative budget.

Only the dispatch's twelve source paths are changed: the pure module, its README and existing tests; plugin README; standing mandate; coordinator pattern; goal and parcel-driven-development skills; loop/builder/reviewer templates; and this handoff. Frozen specification and all other source are unchanged. Builder evidence is under canonical `parcel-dispatch-r7/b1-r1-p01-builder`; source manifest supplies exact paths, bytes, hashes and freeze timestamp.

Corrections: inference requires proposed `pantheon.v1.model.infer` / `ModelResult`; staging requires `pantheon.v1.patch.stage` / `PatchStaged`, preserving isolated-ref-only semantics and existing fleet-v2 meanings. P03 owns transactional implementation; parsing admits nothing. Invalid JSON string escapes in values and keys now produce `MALFORMED_JSON`; byte/depth/node and duplicate-key precedence remain. Tests retain all previous cases, add malformed-key/value controls and exact operation assertions, and consume all 23 external shared wire cases through `PANTHEON_WIRE_FIXTURES`. Scoped docs record actual EX7/EX8 acceptance, EX9 finite original-builder revision windows, whole-unit source counters and purpose/identity operational counters. Original provider plan and both B1 r0 reviews remain `changes_required`; P00 remains closed.

Verification uses the prescribed pinned source-capture helper and job runner, the exact Node 24.19.0 image `node@sha256:e5a8dee7bc1e6a215d224a7ef8206f7e77271bc3cabd5febf2beafac0674f174`, unchanged dependency archive, hash-verified Linux source copy and read-only shared bundle. No networking, cache/package/lockfile edits, credentials, new agents, Git mutations or control-authority edits. Each job is nonroot 1000:1000, read-only root/mounts, network none/pull never, 2 CPUs, 2 GiB, 256 PIDs, 768 MiB scratch, 600-second timeout plus five-second cleanup. Builder checks do not consume independent source-check windows and cannot establish independent acceptance. Detailed final results are recorded below after execution.

### Revision-1 final builder evidence and freeze

| Job | Targeted Pi | Full suite | Typecheck / lint | Integrity / cleanup |
|---|---|---|---|---|
| `job1` | 3 pass | 869 pass, 0 fail/skip/cancel; 36775.844098 ms | Typecheck passed; lint exit 1 solely for two new assertions needing single-line formatting; seven existing infos | Source/dependency bytes and links unchanged; container absent; no timeout |
| `job2` (final executable bytes) | 3 pass, 0 fail/skip/cancel; 4271.560054 ms | 869 pass, 0 fail/skip/cancel/todo; 37671.939745 ms | Typecheck passed; lint exit 0, 54 files, seven existing infos, no fixes | Source/dependency bytes and links unchanged; container absent; no timeout |

The full suite contains 113 Pantheon tests, including one test that checks all 23 distinct shared fixture cases (five structurally valid/unverified and eighteen refused with exact required codes). The only source change between jobs was the formatter-requested layout of two assertions. No tests were omitted or timeout increased. Raw `job1` and `job2` command/result/stdout/stderr records, preparation logs and source archives are retained under the evidence directory above. Their hashes are in `evidence-manifest.json`. Final reporting was appended to this handoff after job2; all other tested source bytes remain identical to that job's source manifest.

`source-manifest.json` records the exact twelve-file final freeze and timestamp, unchanged HEAD, dispatch/spec/helper/wire pins and job2 executable hashes. `git diff --check` passes and there are no staged or out-of-scope changes. Both owned verification containers were absent on final readback. This original slot-3 builder releases the worker slot at freeze and makes no further source edits. Current full-source independent verification and two fresh whole-unit B1 reviews remain required; neither old bounded acceptance nor these builder results accepts revision 1 or enables Runtime effects. The complete revised review request must still bind both final constituent heads and fit the existing 1 MiB limit.
