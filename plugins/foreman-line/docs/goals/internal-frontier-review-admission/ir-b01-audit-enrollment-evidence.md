# IR-B01-AUDIT enrollment evidence

## Authority / scope

Owner Clinton Morgan, current-session instruction verbatim:

> I authorize that four-output scope - 90 minutes and any other needed or recommended task.

The authorized proposal: https://github.com/m0r6aN/agent-skills/pull/186#issuecomment-6115676981 (four outputs: `verification/src/ratified-packages.ts`, `contract-readers/tests/touch-set.test.ts`, this record and `ir-b01-audit-enrollment-handoff.md`; 90 minutes; at most two fresh affected-package validation passes). The trailing clause authorizes necessary/recommended tasks beyond the four outputs; it does NOT authorize native/provider integration, runtime admission, merge behind unresolved checks, or reopening any IR-A01/OPMEM decision.

Named constructor/coordinator: Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`. Worktree `D:/Repos/agent-skills-worktrees/ir-b01-audit-01a12b4f`, branch `bootstrap/ir-b01-audit-01a12b4f`, exact parent `3ab13d12f4328ab66dbf41c4717594a1f1ba8254` (current PR #186 head; owner's merge of main into the published branch — not performed by this coordinator). The earlier packaging worktree remains untouched at `d0ee362434fca99eb9984b8c37805c0d1e747c9e`. Scope clock: start `2026-10-12T01:03:22Z`, deadline `2026-10-12T02:03:22Z`, never reset or paused.

## Exact tracked outputs (five files)

1. `plugins/foreman-line/verification/src/ratified-packages.ts` — `internal-review-launch` added to `RATIFIED_PACKAGES` (full D19 audit coverage, A2.2 both-directions allowlist), with an explicit coordinator-enrollment comment stating that audit inclusion is coverage, not launcher/runtime/OPMEM acceptance.
2. `plugins/foreman-line/contract-readers/tests/touch-set.test.ts` — the two Contract B rulings recorded (below) plus one focused non-reader control; no declared-reader contract change, no test removal/skip, both signals and all reverse/positive controls preserved.
3. `plugins/foreman-line/verification/src/d19-audit.ts` — **NECESSARY FIFTH OUTPUT, disclosed beyond the planned two-file set.** D19 enrollment of a package that contains a self-location site is impossible without an E4 enforcement-pin entry: A2.3 states E4 never self-populates, and an unpinned `import.meta.url` site is a class-2 violation by construction. The prototype's single site `createRequire(import.meta.url)('ajv')` (`internal-review-launch/src/admission.ts:15`) resolves the EXISTING shared Ajv from the module's own location — the `E4_SHIPPED_REGISTRY` precedent class (module-relative lookup of shipped inputs), zero `..` hops, never a discovered root. Added: form constant `E4_SHARED_AJV_REQUIRE`, `E4_PINNED_COUNTS['internal-review-launch/src/admission.ts']: 1`, and the matching `E4_PINNED` entry. This is an ENFORCEMENT pin (identity + location + value + cardinality): any respelling, relocation or extra occurrence now FAILS. It is not an exclusion, waiver, scoped-pin change, or class weakening; it strengthens coverage. Taken under the owner's "any other needed or recommended task" clause; flagged here for explicit review/revocation.
4. `plugins/foreman-line/docs/goals/internal-frontier-review-admission/ir-b01-audit-enrollment-evidence.md` (this record).
5. `plugins/foreman-line/docs/goals/internal-frontier-review-admission/ir-b01-audit-enrollment-handoff.md`.

No other tracked file changed. The prototype package `plugins/foreman-line/internal-review-launch/` and all four historical evidence records are byte-unchanged. No workflow/CI/guard/waiver/contract/schema/lockfile change, no dependency change, no native/provider/model/auth/billing action, no merge, no rebase/force-push.

## Contract B rulings recorded (additive lockstep-negative)

Both prototype files surface through the routing-vocabulary VALUE signal only (`architecture/risk`); neither is a Contract B reader:

- `internal-review-launch/src/types.ts:54` — `readonly routingClass: 'architecture/risk'` restates the envelope's OWN one fixed purpose, never an enumeration of Contract B's members. ADD a class to the vocabulary and this literal is unchanged.
- `internal-review-launch/src/schemas.ts:63` — `routingClass: fixed('architecture/risk')` validates that one constant purpose value; it never tests membership in the class set. ADD a class and unchanged.

Both entries are now in `expectedUndeclared` (sorted position preserved), with the ruling table comments stating the basis. The added focused control asserts mechanically that each file carries its fixed purpose and holds NO other class literal, so the UNDECLARED ruling must be re-adjudicated if that ever changes.

## Validation (two fresh affected-package passes; probes disclosed)

Pass 1 `2026-10-12T01:21:03Z` (three affected suites, output truncated at capture — totals not reconstructed): contract-readers 75 pass/1 file-level fail (`tests/parity.test.ts`), verification 3 file-level fails (`rework/scaffold/stage-d-finalization`), mutation-scope-guard 1 fail. Diagnosis (read-only + disclosed probes) showed these were environmental: the fresh worktree lacked sibling-package `node_modules`, and two direct D19-audit probes failed on MSYS path form (`/d/...`), not on audit content. All 31 packages were then installed with existing package-scoped setup (`npm ci --ignore-scripts --no-audit --no-fund --prefer-offline`, all exit 0).

Diagnostic probes (not package validation passes, counted here for honesty): two path-form audit invocations (exit 2, usage), then two correct audit invocations. The second produced the decisive classification below.

Pass 2 `2026-10-12T01:41:42Z`–`01:52:15Z`:

| Package | test | typecheck | lint |
|---|---|---|---|
| contract-readers | **78 tests / 78 pass / 0 fail, 0 cancelled, 0 skipped, 0 todo** (includes the new focused control and both rulings) | exit 0 | exit 0 |
| verification | 682 tests / 659 pass / **23 fail** — every failure is a D19-audit-spawning test (HRO/PMC/RCM suites), failing on the pre-existing instances below | exit 0 | exit 0 |
| mutation-scope-guard | 44 tests / 43 pass / **1 fail** — AC7 (`D19 audit itself passes`), same cause | exit 0 | exit 0 |

D19 audit probe (read-only evidence): `swept 31 packages, 338 source files`; `E4 — R5 self-location survivors: 43 of 43 pinned`, including the enrolled prototype site; every pinned set reconciled (E2-dynamic 1/1, class-2 derivations 4/4, class-3 DATA 7/7, class-5 guards 4/4, FK sets 36/36, 2/2, 1/1, 1/1, 29/29, 12/12). Prototype enrollment and rulings are correct.

## Residual blocker, precisely classified (OUT OF SCOPE)

`UNRULED INSTANCES (classes 1-5): 7 — FAIL`, all in `ops-console`:

- class 4: `ops-console/src/fleet.ts:70`, `ops-console/src/signals-session.ts:22`, `ops-console/src/signals-worktree.ts:31`, `ops-console/src/spawn.ts:265`, `ops-console/src/spawn.ts:276`, `ops-console/src/spawn.ts:283`
- class 5: `ops-console/src/signals-release.ts:131`

These files landed `2026-10-11` in the owner's FCA-P2…P5 ops-console work (`132d005a`, `0e1d8780`, `eb20335b`, `962de0c9`, `8c8ab396`) and predate this scope. They are also the true root cause of the previously routed main-baseline `mutation-scope-guard` AC7 failure (previously recorded as `true !== false`, root cause not independently classified; now classified). Repair requires ops-console source changes and/or new E1/E5 pin rulings — both source-ownership takeover and pin changes, explicitly outside this scope. Routed to the ops-console/FCA source owners; no repair, waiver, exclusion or pin change was applied here. The previously routed Windows `ops-console/tests/spawn-plan.test.ts:71` path-separator failure is likewise unchanged and unowned by this scope.

## Limits

No merge, no merge recommendation while verification/mutation-scope-guard remain red. No native/provider/model/worker execution, no auth/settings/billing action, no live proof, no independent acceptance. The prototype remains an unaccepted offline artifact (`mayInvokeProvider: false`, `runtimeStatus: 'held'`, `provenance: 'untrusted-offline-declarations'` in every assessment). Local green package checks are not repository CI. IR-A01 ratification, OPMEM D1–D18/P0–P10 scope, caps, migration #174/defaults, G6/cloud/Neon holds and archived HRO status are unchanged. All earlier IR-B01/IR-B01-CI grants remain exhausted; this record binds only IR-B01-AUDIT.
