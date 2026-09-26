# RCM-P1 prerequisite integration handoff

Date: 2026-09-26
Status: locally reconciled and verified; independent integration review pending

## Scope and authority

The HRO coordinator dispatched this bounded prerequisite integration after the
user approved the necessary PMC/RCM prerequisites subject to independent review.
This handoff records integration evidence only. It does not transfer the RCM
coordinator role, change goal-control metadata, close RCM-P1, or authorize a
public adapter, production dispatch, provider spend, or a host configuration write.

- Integration branch: `codex/hro-rcm-p1-integration-20260926`.
- Integration worktree: `D:/Repos/agent-skills-worktrees/hro-rcm-p1-integration-20260926`.
- Mainline input: `1b0f98ab53612017bb5306fa51fcc237308a6c95`.
- Reviewed RCM-P1 input: `7faa46a33fdbc927535a193fdbfd4c782b61b6dc`.
- Common ancestor: `37cbb5c0f4ae5f203842735beef4833a16d41095`.
- Original worktree: `C:/Repos/foreman-line-routing-currency-merit-rcm-p1-builder`,
  branch `codex/rcm-p1-builder`, preserved at the reviewed input.

The target branch and path were absent before creation. Step 0 confirmed the
inputs and eight-file source delta. Integration used `git merge --no-commit
--no-ff 7faa46a33fdbc927535a193fdbfd4c782b61b6dc`, retaining the original commit
history rather than rewriting the builder branch. No ownership metadata collision
was encountered; goal control files remain unchanged.

## Reconciliation

The sole merge conflict was the add/add RCM-P1 spec. AC8 now uses the actual
historical fixture identity `anthropic/claude-opus-5`, matching both RCM-P1 tests,
the immutable P0-derived fixture, and its P0 provenance. Main's `5.5` spelling
in that historical-fixture assertion was not evidence of a new fixture. The
reviewed spec's ratified amendments A1, A2, and A3 are preserved unchanged.
The resulting spec is byte-identical in Git to the reviewed RCM-P1 spec.

The README merges additively: its existing frontier-registry description retains
main's `anthropic/claude-opus-5.5`, and the reviewed RCM-P1 section is appended.
The six source/test/fixture files are unchanged from the reviewed input. All
other mainline files are unchanged, including policy, validator, testing helpers,
existing fixtures, package locks, public index, goal controls, and P0 evidence.
The distinction between historical fixture identity and current approved registry
identity is intentional; this integration grants no model eligibility.

## Verification

All commands ran in PowerShell with `D:/nvm/v24.19.0` prepended to the process
Path only. `node -v` returned `v24.19.0`; no global runtime setting changed.

| Check | Result |
| --- | --- |
| `npm.cmd ci --ignore-scripts --no-audit --no-fund --offline` in schema-scaffold | Exit 0; 14 locked packages installed |
| Same install in routing-policy | Exit 0; 15 locked packages installed |
| `npm.cmd test` in routing-policy | Exit 0; 399 tests passed, 0 failed, skipped, or cancelled |
| `npm.cmd run typecheck` in routing-policy | Exit 0 |
| `npm.cmd run lint` in routing-policy | Exit 0; 22 files checked, one existing informational useLiteralKeys diagnostic at catalog-snapshot.test.ts:777; no fixes applied |
| `git diff --cached --check` | Exit 0 |
| Outside-package implementation-reference search | Expected exit 1; no references outside routing-policy and docs |
| Fixture credential-pattern search | Expected exit 1; no matches |
| Reviewed source/test/fixture/spec comparison | Identical to 7faa46a |
| Mainline preservation and allowlist check | Only the original eight paths plus this handoff differ from main |

The prior accepted count was 399 tests on Node 24.7.0, as recorded in
`rcm-p1-review-triage.md`. The integration retains all 399 tests and changes no
test line. Main's changes since the common ancestor update model identifiers in
the existing policy, validator, helpers, fixtures, and README; they are preserved.
No test-count difference or dependency upgrade was needed.

## Exact integration delta from main

- `plugins/foreman-line/docs/specs/active/RCM-P1-models-store-eligibility-projector.md`
- `plugins/foreman-line/routing-policy/README.md`
- `plugins/foreman-line/routing-policy/src/catalog-snapshot.ts`
- `plugins/foreman-line/routing-policy/src/eligibility.ts`
- `plugins/foreman-line/routing-policy/tests/catalog-purity.test.ts`
- `plugins/foreman-line/routing-policy/tests/catalog-snapshot.test.ts`
- `plugins/foreman-line/routing-policy/tests/eligibility.test.ts`
- `plugins/foreman-line/routing-policy/tests/fixtures/catalog-snapshot/baseline.v1.json`
- `plugins/foreman-line/docs/goals/routing-currency-and-merit/rcm-p1-hro-integration-20260926.md`

## Remaining gates and limits

This is an unwired library, with no public export, adapter, or canonical snapshot
producer added. Offline fixture success is not runtime availability evidence.
The original A3 threat model and fourth-review dispositions remain intact:
request counts are bounded, string sizes are not. S1's per-string resource cap
remains an explicit RCM-P5 shaping consideration, not silently fixed here.

The coordinator will commission independent review of the integration before
publication. No push, mainline merge, release, or Stage-F closure is performed by
this task. There are no local verification blockers.
