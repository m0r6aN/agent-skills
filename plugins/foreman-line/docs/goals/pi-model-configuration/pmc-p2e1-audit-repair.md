# PMC-P2E1 audit repair — amendment 01

## Scope and provenance

Builder evidence, 2026-09-26. This is the narrow audit repair authorized by
PMC-P2E1 Audit amendment 01, not runtime enablement or a merge approval.

- Worktree: `D:/Repos/agent-skills-worktrees/hro-pmc-p2e1-integration-20260926`.
- Branch: `codex/hro-pmc-p2e1-integration-20260926`.
- Repair base: `b87462421fb712d3d652c32b8e8e48e064ecacf3`.
- Approved E1 source: `2632d695031fa4e874896c78e6ee39adeaebf36c`.
- Accepted ledger main ancestor: `727c0554f11990da778e7647e7a108f3ca6f95aa`.
- Exact repair files: `verification/src/d19-audit.ts`,
  `verification/tests/pmc-legacy-retirement-audit.test.ts`, and this report,
  all under `plugins/foreman-line/`.

The earlier E1 source-review statement that D19 failed solely on Jev was
incomplete. That older source branch also lacked ten accepted ledger
enrollments. The integration base resolves those ledger findings without a
waiver. Before this repair, actual integrated D19 had zero unruled instances,
ledger 10/10, and B1 intent custody 9/9; it failed because retirement removed
three Jev runtime literals still required by the obsolete audit pin.

## Minimal repair

Remove `jev-decisions/src/runtime.ts` / `CUSTODY_PATHS` from the declaration
map and its count-three enrollment. Keep `jev-decisions/src/replay.ts` / `PATHS`
and its ten literals. Change aggregate count 13 to 10 and update two obsolete
comments. The sorted-value SHA-256 changes from
`0c6fe241efaa1d50b1cb8df1d37054fb8558090e176d1ef2b8e166e7badae83b` to
`2f40b0bb22bd0a0c008e40b5340bddeb7b8c5f0c1af22c716a086cd0bdfc8d8b`.
The test independently computes the latter from the retained replay literals.

An exact baseline comparison (normalizing CRLF only) proves that the audit is
unchanged except for those six text replacements. No AST matching, traversal,
declaration identity, direct-array, context, cardinality, or digest algorithm
changed. All other pins, including RCM, ledger and B1, remain unchanged.
The seven approved E1 runtime/test files match the approved source commit, and
replay source is unchanged from the repair base.

## Permanent regression controls

The new test uses the real audit in subprocesses against isolated source copies.
Copied source is parsed, never imported or executed. Each subprocess has an
explicit working directory and a 60-second timeout. The owned temporary cleanup
target is validated before recursive removal. No installed dependency tree is
copied, modified or installed.

There are 41 subtests plus their parent (42 reported tests):

- Three positive controls: accepted retired source, comments/whitespace/line
  splitting in the retained declaration, and unrelated safe source.
- Restore the exact historical runtime declaration and its three values:
  require native exit 1 and three individual runtime class-3 findings for
  complete/refused/hold, while replay remains 10/10 with no Jev pin mismatch.
  This detects a dormant exemption, not merely a reduced aggregate count.
- Remove each retained value and change each retained value independently
  (20 negatives); require the relevant count or digest diagnostic.
- Fourteen declaration/shape/context negatives: extra or duplicate value,
  missing/wrong/mutable/nested declaration, template literal, wrapped array,
  object-member literal, indirected value, duplicate declaration, and the same
  literal in an unrelated declaration, filesystem-reference call, or other array.
- Missing exact replay file, declaration moved to a sibling file, and an
  unrelated `process.cwd()` root-conflation violation remain rejected.

Every control also checks accepted ledger 10/10, B1 custody 9/9 and RCM 1/1.
Negative controls require their targeted diagnostic and native failure, rather
than accepting any unrelated audit failure as success.

## Executed evidence

Node `24.19.0`; existing matched-lock dependency junctions used read-only.
Top-level checks ran serially; test-file concurrency was set to one. Full
command output and immediate native exits are retained in this machine-local
directory (not a portable or committed evidence bundle):

`C:/Users/clint/AppData/Local/Temp/pmc-e1-audit-logs-e77a7e690ada4ed68faa4c7604db562c`

| Log | Actual result | Native exit |
| --- | --- | --- |
| `01-baseline.log` | Integrated D19: zero unruled; obsolete runtime count 0/3, aggregate 10/13 and old digest fail | 1 |
| `02-red.log` | Genuine assertion RED: 42 tests, 36 pass, 6 fail (including parent); restored runtime incorrectly passes old audit | 1 |
| `03-format.log` | Initial formatting; two files checked, one fixed | 0 |
| `04-green.log` | Initial focused GREEN: 42/42 | 0 |
| `05-verification-tests.log` | Full verification: 622/622, including stronger three-literal assertion | 0 |
| `06-verification-typecheck.log` | Typecheck passes | 0 |
| `07-verification-lint.log` | Two formatter line-wrap differences in the strengthened assertion | 1 |
| `07a-format-fix.log` | Formatter fixes only the new test | 0 |
| `07b-final-focused.log` | Final formatted focused test: 42/42 | 0 |
| `07c-final-typecheck.log` | Final verification typecheck passes | 0 |
| `07d-final-lint.log` | Final verification lint: 28 files, no fixes | 0 |
| `08-readers-tests.log` | Contract readers: 71/71 | 0 |
| `09-readers-typecheck.log` | Contract readers typecheck passes | 0 |
| `10-readers-lint.log` | Contract readers lint: 11 files, no fixes | 0 |
| `11-mutation-guard-tests.log` | Mutation-scope guard: 44/44 | 0 |
| `12-mutation-guard-typecheck.log` | Mutation-scope guard typecheck passes | 0 |
| `13-mutation-guard-lint.log` | Mutation-scope guard lint: 7 files, no fixes | 0 |
| `14-integrated-d19.log` | Actual integrated D19: PASS | 0 |
| `15-preservation.log` | Exact audit replacement comparison, frozen E1/replay checks and accepted-main ancestry pass | 0 |
| `16-scope.log` | Real post-hoc guard accepts exactly three authorized files; diff whitespace check passes | 0 |

All completed GREEN test runs have zero skipped, cancelled or failed tests.
The 622-test run preceded the final whitespace-only formatter correction;
the final 42-test focused run, typecheck and lint followed it. No semantics were
changed between those runs. The focused cases are included in the 622 count,
not an additional 42 distinct tests. RED was an assertion failure, not a loader
or environment failure. Lint failure was preserved and corrected, not waived.

Commands, from the named package directory, used its installed tools:
`node node_modules/tsx/dist/cli.mjs --test --test-concurrency=1 tests/*.test.ts`,
`node node_modules/typescript/bin/tsc --noEmit`, and
`node node_modules/@biomejs/biome/bin/biome check .`.
Focused runs name `tests/pmc-legacy-retirement-audit.test.ts` instead of the glob.
Integrated D19 used `node node_modules/tsx/dist/cli.mjs src/d19-audit.ts
--plugin-root D:/Repos/agent-skills-worktrees/hro-pmc-p2e1-integration-20260926/plugins/foreman-line`
from verification. `TSX_DISABLE_CACHE=1` applied to the check processes only.

Final D19 swept 21 packages / 198 source files, found zero unruled class-1–5
instances, and reconciled ledger 10/10, B1 custody 9/9, RCM provenance 1/1,
Jev replay 10/10 with the retained digest, E1 0/0, E2-dynamic 1/1 and E4 26/26.
It reported `RESULT: PASS` with native exit 0.

## Limits and handoff

This remains a syntactic audit, not general dataflow analysis or a proof of
absence of all possible violations. No runtime executor, provider, credential,
Pi configuration, policy, dependency or host setting was changed or enabled.
The newer P1c main changes were not merged into this repair worktree.

Incremental implementation, test-first verification and debugging discipline
kept this repair bounded and preserved both initial failures. Builder self-review
does not replace the two independent audit reviews. Combined integration checks,
remote checks and delegated coordinator merge authority remain with the coordinator.
This local handoff does not claim Stage F or production readiness.

## Independent audit acceptance — 2026-09-26

Coordinator and independent PMC reviewer approve eaabcb4180cba946274925079eec215718ed29ca.
Both inspected exact constants/maps/comments, all permanent mutation controls,
preserved owner sources and scope; each independently ran42 focused tests,
verification typecheck/lint and actual D19 with native exit0. Historical runtime
values are individually unruled, retained replay values remain pinned and all
other detector mechanisms/pins are unchanged. No remaining audit finding.

This accepts the narrow repair only. Combined P1c/main integration and its checks,
remote PR checks and delegated exact-head merge remain outstanding.
