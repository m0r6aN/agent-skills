# TO-B0 baseline CI repair evidence

The original FCA merge d86ade55 failed the unchanged D19 audit at five
config.ts sites. Source/audit Git blobs matched the baseline. Two fresh
independent architecture reviewers accepted callback-local absolute-root
assertions, canonical PLUGIN_TREE_REF reuse, exact path assertions, and a
baseline type-import formatting fix. One reviewer caught malformed amended
spec YAML; coordinator removed the duplicate stray line and spec-linter passed.
No audit weakening or new encoded spelling was introduced.

## Independent deterministic evidence

```text
TO-B0 independent deterministic verification
Final reviewed revision: 394a14f68de5e174ce39fd009bfc8a5595b26be4 plus working-tree implementation diff.
Node: v26.8.2.
Exact changed files: ops-console/src/config.ts, ops-console/tests/multi-root.test.ts, ops-console/tests/remedy.test.ts. All are in amended Allowed Files. Audit unchanged. git diff --check exit 0.
npm test: sandbox attempt failed tsx IPC EPERM; authorized escalated retry exit 0, 92 tests passed / 0 failed. Executed before remedy formatting-only amendment; its import layout alone subsequently changed.
npm run typecheck: initial exit 1 (missing ajv dependencies in contracts/schema-scaffold); after coordinator installed locked dependencies, rerun exit 0.
npm run lint: initial exit 1 on pre-existing remedy.test.ts import formatting; after authorized scope amendment and coordinator formatting-only edit, rerun exit 0, 32 files checked.
Direct audit: node --import tsx src/d19-audit.ts --plugin-root /home/cmorgan76/Work/foreman-baseline-repair/plugins/foreman-line; exit 0, 30 packages / 320 source files, UNRULED INSTANCES classes 1-5: 0, RESULT PASS. All pin cardinalities/digests reconcile.
AC7: first attempt stalled on npx lookup from plugin-root; interrupted exit 130. Bounded retry set PATH to installed verification/node_modules/.bin and escalated for tsx IPC: timeout 60s node --import tsx --test --test-name-pattern='AC7' tests/guard.test.ts. Exit 0; tests 3, pass 3, fail 0.
Filter assertion: same arrow function, preceding resolve, matching extraRoot.
forEach assertion: first statement, matching extraRoot.
Routing literal: reused existing PLUGIN_TREE_REF, no new encoding, constants or literals.
Path tests: exact goals/specs/receipts/routing paths for native and initiative trees; existing typed relative-root refusal test passed.
Scope: amended 3 implementation files only; verification audit, encoding, permissions and route code unchanged.
No source/doc edits made by verifier. Evidence files /tmp/to-b0-verifier-* only.
```

## Worker accounting and scope

Ember exact host fireworks/accounts/fireworks/models/ember-1 via no-tools Pi:
shape completed 16.7s (8,382 input+1,263 output; estimate $0.044091); build
completed 13.5s (7,202+808; $0.033726); rework completed 12.4s (1,386+818;
$0.016428). Runtime estimates, not settled billing. Initial test edit referenced
an undefined trees variable; coordinator flagged it before materialization and
Ember reworked it. Exact string replacement matching enforced two-file scope.
Third file is only pinned Biome formatter output under separately committed
scope amendment. No model generated formatter edits or new tests there.

The source/audit spec is elevated architecture/risk; independent dual reviews
remain distinct from the cheap builder. No Jev/Drex classifier ran. The owner
granted standing non-destructive decision and merge authority across the three
roadmap goals; planning records are in PR #167. This auxiliary prerequisite
changes no locked observation behavior, route, status, or mutation authority.

## Release status

Local checks accepted; GitHub required checks and actual merge remain pending.
No behavioral observation parcel is accepted by this prerequisite alone.

## Incremental CI prerequisite correction

Required CI shard 0 on cbfcf7cb reported 681 verification tests passed and one
failed: scaffold expected Biome 2.5.3 while both sibling manifests use 2.5.14
since merged fleet commit 60617cef5bdbc74aa516cf54a54e91e3e3228365.
Baseline d86ade55 and this branch share the same manifest and test blobs.
Scope amendment fe7153c9 preceded a mechanical expected-value/comment repair;
no model dispatch was needed for this exact canonical pin alignment.
Both independent architecture reviewers accept the complete four-file diff.

Independent verifier at fe7153c9 plus working golden patch: focused actual AC-1
passes (1/1); full scaffold passes 8/8 with embedded negative controls under
Node 26 test-isolation=none (default isolation reports only the file result).
Scoped pinned Biome passes (1 file); full verification lint passes (32 files,
8 informational notices); amended spec-linter passes. Byte comparison from
DISPATCH_ONLY_DEV_DEPENDENCIES onward proves all controls and test bodies
unchanged. Manifests/locks unchanged. Needed sibling dependencies installed
with locked npm ci --ignore-scripts; no tracked dependency changes.
Verifier evidence: /tmp/to-b0-verifier-scaffold-diagnosis.txt and incremental
verifier summary; these local paths are provenance, not portable artifacts.
Remaining GitHub shard 1 still running at this recording; no green-chain or
merge claim. Unattributed /tmp shard outcomes were explicitly excluded.

## Actual release

PR #168 merged2026-10-10T17:12:42Z at96ffadc560914c762da01dbb84508e7fc624a31a.
Exacthead389f3f6cd9f949934838cb69bece08572dc5b99c had all four shards and
required test/integration-report green in both push/PR runs38068621135 and
38068623643. Effective main rules rechecked before normal --merge with
--match-head-commit; no bypass/auto-merge setting change. Spec moved to done
in this immediate documentation follow-up; no Stage-F receipt invented.
Worktree retained temporarily for installed linter/verifier tooling used by
TO-P0; cleanup follows once dependencies exist in the successor worktree.
