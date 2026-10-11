---
ticket: TO-B0
title: Baseline root guard repair
status: done
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/ops-console/src/config.ts
  - plugins/foreman-line/ops-console/tests/multi-root.test.ts
  - plugins/foreman-line/ops-console/tests/remedy.test.ts
  - plugins/foreman-line/verification/tests/scaffold.test.ts
routing_class: architecture/risk
verification_class: equivalence-provable
permission_profile: builder-architecture
data_classification: public
---

## Intent

Repair the FCA d86ade55 configuration baseline so the unchanged audit no longer reports five violations. The defects are concentrated in `defaultConfig`: the extra-root filter arrow lacks a matching same-function root assertion before `resolve`, the per-tree `forEach` callback lacks its own same-function assertion, and the routing policy path duplicates the literal `plugins/foreman-line` instead of reusing `PLUGIN_TREE_REF`. Restoring those guards preserves the existing P2b-i / D19 root-refusal contract and unblocks TO-P0 release without changing any runtime behavior.

## Constraints

- Do not modify the audit itself, encoding rules, permission model, route definitions, layouts, or any observable behavior.
- No unsafe normalization: every root must remain absolute and caller-supplied; a relative path must still be refused before any `resolve` executes.
- The literal replacement must use the existing exported `PLUGIN_TREE_REF` constant; no new constants or literal spellings are introduced.
- All changes must remain inside the four Allowed Files; no auxiliary files, no JSON output, and no receipt claims.
- The outer `assertAbsoluteRoot` on `extra` stays in place; the repair adds the missing same-function assertion on the resolved value, plus the entry assertion inside the `forEach` callback.
- Source checkout stays dirty; work proceeds only in the isolated worktree on branch `fix/foreman-observation-baseline`.

## Acceptance Criteria

- `plugins/foreman-line/ops-console/src/config.ts` compiles cleanly and the filter arrow is rewritten as a block that calls `assertAbsoluteRoot(extraRoot, 'defaultConfig extraRoots resolved entry')` immediately before the existing `resolve` call.
- The `forEach` callback in the same function now begins with `assertAbsoluteRoot(extraRoot, 'defaultConfig extraRoots resolved entry')` so the outer assertion is no longer the only guard.
- The `routingPolicyPath` assignment inside the extra-tree loop replaces the spread of literal strings with `resolve(extraRoot, PLUGIN_TREE_REF, 'routing-policy', 'routing-policy.yaml')`.
- The updated test file `plugins/foreman-line/ops-console/tests/multi-root.test.ts` asserts exact goals/specs/receipts/routing paths for the native and initiative trees, and that a relative extra root still throws `ConsoleRootUnresolvedError` with reason `root-not-absolute`.
- All mandated verification commands pass: `npm test`, `npm run typecheck`, `npm run lint`, the direct `node --import tsx src/d19-audit.ts --plugin-root ABS` invocation, and the mutation-scope-guard AC7 check after locked dependencies are installed.
- Reviewer questions in the Verification Plan receive explicit, field-by-field answers; no generic approval is accepted.

## Out of Scope

- Any change to the audit script, its reporting format, or its exit codes.
- Alterations to encoding helpers, permission definitions, route tables, or layout constants.
- Refactors that rename functions, change signatures, or introduce new configuration fields.
- Updates to documentation, comments, or unrelated tests beyond multi-root assertions and the remedy type-import formatter repair.
- Merging, committing, or pushing the work; this parcel produces only the code edits and test additions.
- Any claim of acceptance or completion; verification remains external to the shaping agent.

## Context & References

- `plugins/foreman-line/ops-console/src/config.ts` (FCA d86ade55) — the unchanged source with the five violations.
- `plugins/foreman-line/ops-console/tests/multi-root.test.ts` — the existing test suite that must be extended to lock the repaired behavior.
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — the schema and lifecycle rules governing this spec.
- FCA ticket merged163 — the parent change that introduced the extra-tree logic and the current baseline.
- D19 audit mechanism class 5 and P2b-i path-guard ruling — the policy requiring same-function absolute-root assertions.

## Allowed Files

- plugins/foreman-line/ops-console/src/config.ts
- plugins/foreman-line/ops-console/tests/multi-root.test.ts
- plugins/foreman-line/ops-console/tests/remedy.test.ts

- plugins/foreman-line/verification/tests/scaffold.test.ts

## Verification Plan

1. Run the ops-console package checks: `npm test`, `npm run typecheck`, and `npm run lint` inside `plugins/foreman-line/ops-console/`.
2. Execute the direct audit command from plugins/foreman-line/verification: `node --import tsx src/d19-audit.ts --plugin-root ABS` where `ABS` is an absolute plugin root path; expect zero violations.
3. After installing locked dependencies, from mutation-scope-guard run `node --import tsx --test --test-name-pattern="AC7" tests/guard.test.ts` to confirm the shipped D19-audit regression check passes.
4. Reviewer must answer these mandated questions, each with a dedicated field-level assessment:
   - Does the filter arrow now assert the resolved root in the same function before calling `resolve`, matching the pattern used for `repoRoot` and `pluginRoot`?
   - Does the `forEach` callback assert `extraRoot` at entry so the outer assertion is not the sole guard against a relative path?
   - Is the literal `plugins/foreman-line` fully replaced by `PLUGIN_TREE_REF` in the routing policy path construction, with no other literals introduced?
   - Do the new tests prove exact native and initiative tree paths and confirm that a relative root still triggers `ConsoleRootUnresolvedError` with the correct reason?
   - Are all changes confined to the four Allowed Files, with no drift into audit, encoding, permission, or routing code?

Coordinator corrections: inaccurate callback description corrected; path-equivalence acceptance binds exact native/initiative paths; audit cwd and AC7 purpose corrected. Baseline direct audit reproduced exit 1 with the same five sites; audit/source Git blobs match d86ade55. Auxiliary release prerequisite approved under standing non-destructive decision authority; locked D1–D8 unaffected.



B0 amendment: independent npm lint found baseline remedy.test.ts formatting failure: collapse its multiline type import to the pinned Biome output. Exactly this style-only file is added to Allowed Files; no assertion or runtime behavior changes. Both reviews must assess the amended diff before merge. Other guards/audit untouched. Locked sibling contract/schema dependencies installed for compiler resolution, no manifests changed.

B0 CI prerequisite amendment: sweep shard 0 reproduces an inherited scaffold golden mismatch (681 pass, 1 fail). Fleet commit 60617cef5bdbc74aa516cf54a54e91e3e3228365 already pins verification and dispatch Biome to 2.5.14; baseline d86ade55 and this branch have identical manifests and scaffold test. Add exactly verification/tests/scaffold.test.ts to scope: align only the Biome expected value to 2.5.14 and replace the stale provenance comment. Preserve all other expected versions, exact dependency key sets, sibling parity assertions, and negative controls. No manifest, lockfile, audit, permission, or runtime changes. Focused AC-1 with negative controls and pinned formatter validation are required independently, followed by both incremental architecture reviews and the full required CI chain. This amendment overrides the earlier three-file/comment exclusions solely for this correction.

Ownership disposition: exact scaffold test has no uncommitted edits in the original checkout or inspected CFF h1/p0/p1/p3 worktrees. This is alignment to the already merged fleet pin under Clinton Morgan's standing non-destructive authority, not a transfer of CI/kernel goal ownership or permission to change their canon, queues, or working files. Work remains isolated in this prerequisite branch. No separate parcel or runtime feature is added.

Closure: PR #168 merged 2026-10-10T17:12:42Z at 96ffadc560914c762da01dbb84508e7fc624a31a after both exact-head test/integration-report chains passed for389f3f6c. This is source-control/spec lifecycle evidence, not a fabricated Stage-F receipt.
