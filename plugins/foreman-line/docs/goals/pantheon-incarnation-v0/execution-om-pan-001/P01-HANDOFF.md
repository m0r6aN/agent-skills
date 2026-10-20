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
