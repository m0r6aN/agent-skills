# IR-B01-AUDIT enrollment handoff

## State

IR-B01-AUDIT is constructed and validated within its 90-minute clock (`2026-10-12T01:03:22Z`–`02:03:22Z`). Full detail: `ir-b01-audit-enrollment-evidence.md`. Commit ancestry: parent `3ab13d12f4328ab66dbf41c4717594a1f1ba8254` (PR #186 head), one scope commit containing exactly five tracked outputs.

What is done:

- `internal-review-launch` is ratified in `RATIFIED_PACKAGES` and swept at full D19 coverage (31 packages / 338 source files; E4 43 of 43 pinned, including the prototype's `createRequire(import.meta.url)('ajv')` site at `internal-review-launch/src/admission.ts:15`).
- The two Contract B reader rulings are recorded (`src/types.ts:54`, `src/schemas.ts:63` — fixed-purpose restatements, additive lockstep-negative), with a focused non-reader control enforcing the ruling's basis.
- Affected-package validation pass 2: contract-readers 78/78 green (test/typecheck/lint all exit 0); verification 659/682 with only the 23 D19-audit-spawning tests red; mutation-scope-guard 43/44 with only AC7 red. Typecheck/lint exit 0 for all three.

What is NOT done / outstanding:

- The D19 audit still exits 1 on exactly SEVEN unruled class-4/5 instances in `ops-console` (`fleet.ts:70`, `signals-release.ts:131`, `signals-session.ts:22`, `signals-worktree.ts:31`, `spawn.ts:265/276/283`) — pre-existing, introduced by the 2026-10-11 FCA-P2…P5 ops-console work. This is also the classified root cause of the main-baseline mutation-scope-guard failure and the reason the Windows `spawn-plan.test.ts:71` failure matters. Repair is source-ownership/pin work for the ops-console owners: NOT taken here.
- Because of that residual, verification and mutation-scope-guard cannot be expected green in CI yet, and no merge or acceptance is offered.

## Next (each needs its own exact owner scope)

1. Ops-console/FCA owners: adjudicate the seven instances (source fixes to eliminate inheriting-cwd spawns / named-root resolve, or explicit coordinator E1/E5 pin rulings with identity+location+value+cardinality). Then rerun the real D19 audit; only then does AC7/verification regain a chance to pass. Do not waive or exclude to force green.
2. Owner: optionally review/revocable the necessary fifth output (E4 enforcement-pin enrollment in `verification/src/d19-audit.ts`) disclosed in the evidence record.
3. Separate scope after CI green: independent architecture/security/process acceptance. Native integration, provider/model/worker execution, live proof, trusted-issuer accounting/custody and operational admission remain unimplemented and unauthorized. IR-A01/OPMEM decisions are not reopened.

Preservation: prototype package bytes, all four historical evidence records, the original prototype worktree (`dd85fd3b…`) and packaging worktree (`d0ee3624…`) are unchanged. No background loop; no downstream dispatch.
