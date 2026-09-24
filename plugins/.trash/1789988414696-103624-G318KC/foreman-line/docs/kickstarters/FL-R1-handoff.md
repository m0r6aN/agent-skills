# FL-R1 Candidate Handoff

Date: 2026-09-05. Status: implemented, locally verified, uncommitted candidate;
independent review and adoption remain pending. NOT goal completion, existing-goal
acceptance, a committed amendment, merge, release, or publication.

## Authority and Execution

- Worktree: `D:/Repos/agent-skills-worktrees/fl-r1-terminal-seal-20260905`.
- Branch: `feat/foreman-line-FL-R1-20260905`.
- Base and unchanged HEAD: `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.
- Exact contract: `plugins/foreman-line/docs/specs/active/FL-R1-terminal-seal.md`.
- Parent accepted Step 0 and authorized implementation and offline verification.
- FL-R1-A1 intentionally approves the behavior break: stage F alone is no longer
  sufficient. The entire chain must validate, and its highest-sequence document
  must be `kind: stage`, `stage: F`, `subjectKind: ClosureRecord`.
- No compatibility predicate, new schema, payload authentication, or historical
  spec amendment was added. The public function signature is unchanged.
- Instruction-limited native worker with isolated filesystem, NOT OS containment.
  The native host task cannot select a per-worker model or load emitted Claude
  settings. No emitted settings were loaded or modified.
- Routing: one native builder; deterministic local tools for reads, patching,
  dependency materialization, tests, typecheck, lint, and Git evidence. No model
  delegation, provider probes, external services, or live adapters were invoked.

Exact Allowed Files (the only manually edited/created files):

- `plugins/foreman-line/receipts/src/validator.ts`
- `plugins/foreman-line/receipts/tests/chain-invariants.test.ts`
- `plugins/foreman-line/receipts/README.md`
- `plugins/foreman-line/docs/kickstarters/FL-R1-handoff.md`

The supplied active spec was already untracked at dispatch and remains untouched.
No staging, commits, pushes, settings edits, lock edits, goal edits, fixture edits,
or integration source/test edits were performed. Source-checkout dependencies
were not used or modified.

## Verification Commands

Commands below are PowerShell, run with the tool's working-directory parameter;
no command changes directory. Package CWD means the absolute worktree above plus
`/plugins/foreman-line/<package>`. No `npx`, network fallback, global Node switch,
or lifecycle install script was used.

Runtime command from worktree root:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --version
```

Result: `v24.19.0` (satisfies receipts >=22 and integration >=24.11.1).

Install command I, once in each package listed below, after manifest/lock
inspection and `Test-Path -LiteralPath '<absolute-package-CWD>'` returned `True`:

```powershell
& 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' ci --offline --ignore-scripts --no-audit --no-fund --logs-max=0
```

| Package CWD | I outcome | Reason |
| --- | --- | --- |
| receipts | added 14 packages | Primary suite/tools |
| integration | added 9 packages | Dependent suite/tools |
| schema-scaffold | added 14 packages | Receipts test-scaffold imports AJV |
| contracts | added 14 packages | Receipt typecheck resolves AJV types here |
| registration | added 102 packages | Integration imports registration's MCP SDK module |
| shaping | added 14 packages | Transitive registration/shaping import needs AJV |
| spec-linter | added 15 packages | Shaping self-check imports spec-linter AJV/YAML |
| permission-profiles | added 15 packages | Transitive validator imports AJV |
| projection | added 14 packages | Transitive projector imports AJV |

All nine installs succeeded offline using committed locks. No missing cache
artifact, network fallback, or parent-supplied dependency materialization was
needed. `--ignore-scripts` also skipped the locked esbuild/fsevents install scripts.
Ignored `node_modules` materialization is the explicit verification exception to
the four-file source mutation allowlist; no manifest or lock was changed.

Command T (receipts full suite, receipts CWD):

```powershell
& 'D:/nvm/v24.19.0/node.exe' node_modules/tsx/dist/cli.mjs --test 'tests/*.test.ts'
```

Command F (focused regression suite, receipts CWD):

```powershell
& 'D:/nvm/v24.19.0/node.exe' node_modules/tsx/dist/cli.mjs --test tests/chain-invariants.test.ts
```

Command C (typecheck, either receipts or integration CWD):

```powershell
& 'D:/nvm/v24.19.0/node.exe' node_modules/typescript/bin/tsc --noEmit
```

Command L (lint, either receipts or integration CWD):

```powershell
& 'D:/nvm/v24.19.0/node.exe' node_modules/@biomejs/biome/bin/biome check .
```

Command G (integration full suite, integration CWD):

```powershell
$env:PATH = 'D:/nvm/v24.19.0;' + $env:PATH; & 'D:/nvm/v24.19.0/node.exe' node_modules/tsx/dist/cli.mjs --test 'tests/*.test.ts'
```

The PATH change is process-local for test child executables only. Receipts CLI
tests already spawn `process.execPath`, so receipts runs needed no PATH override.

Final verification and the repeated original-predicate mutation check used the
same commands with this exact suffix to explicitly surface and preserve exit status:

```powershell
; $code = $LASTEXITCODE; "EXIT_CODE=$code"; exit $code
```

Formatting command, run once in receipts CWD after implementation:

```powershell
& 'D:/nvm/v24.19.0/node.exe' node_modules/@biomejs/biome/bin/biome format --write src/validator.ts tests/chain-invariants.test.ts
```

Result: formatted 2 files, fixed 2 files (line wrapping only). All manual edits,
including the temporary original-predicate mutation and restoration, used
`apply_patch`.

## Baseline and Outcomes

| Phase / command | Exact observed outcome |
| --- | --- |
| Initial receipts T, before dependency closure | 59 reported, 57 pass, 2 fail; dependency-allowlist and parity files failed to load AJV from schema-scaffold |
| Initial receipts C | 11 TS2307 missing-AJV diagnostics: 9 in contracts, 2 in schema-scaffold |
| Initial receipts L | Success; checked 18 files, no fixes |
| Initial integration G | 79 reported, 69 pass, 10 file-load failures: missing `@modelcontextprotocol/sdk` in registration |
| After schema-scaffold/contracts/registration installs, receipts T | Original code/tests: 62 tests, 62 pass, 0 fail/skip |
| Same phase, receipts C | Success, no diagnostics |
| Same phase, integration G | 79 reported, 69 pass, 10 file-load failures: missing AJV in shaping |
| First test-first F, original validator unchanged | 29 tests, 14 pass, 15 fail, 0 skip; predicate not yet edited |
| Candidate receipts T | 80 tests, 80 pass, 0 fail/skip |
| Candidate receipts C / L | Success; no diagnostics / checked 18 files, no fixes |
| After shaping/spec-linter installs, integration G | 79 reported, 69 pass, 10 file-load failures: missing AJV in permission-profiles |
| Integration C at that point | 3 TS2307 missing-AJV diagnostics (permission-profiles x2, projection x1), 1 downstream TS7006 in projection |
| After permission-profiles/projection installs, integration G | 189 tests, 188 pass, 0 fail, 1 skip |
| Integration C / L | Success; no diagnostics / checked 34 files, no fixes |
| Focused candidate F with explicit exit capture | Exit 0; 29 tests, 29 pass, 0 fail/skip |
| Repeated candidate T / C / L with explicit exits | All exit 0; 80/80 tests; no type diagnostics; 18 files linted, no fixes |
| Repeated candidate G / C / L with explicit exits | All exit 0; 189 reported, 188 pass, 1 skip; no type diagnostics; 34 files linted, no fixes |
| Final formatted tests against restored original predicate, F | Exit 1; 29 tests, 14 pass, 15 fail, 0 skip |
| Dependency-complete original-predicate integration baseline, G | Exit 0; 189 reported, 188 pass, 0 fail, same 1 skip |
| After restoring the final candidate, T / G | Both exit 0; receipts 80/80, integration 188 pass / 0 fail / 1 existing skip out of 189 |
| Final tracked scope exclusion check / whitespace check | Both exit 0; no tracked changes outside the three authorized receipt paths; no whitespace errors |
| Handoff-only no-index whitespace check | Initially exit 3 for a space-only context line in the embedded diff; after removing it, exit 1 with no diagnostics (expected no-index new-file difference from NUL, no whitespace errors) |

The first setup/baseline invocations did not print numeric exit codes; their
diagnostics and test counts above are recorded rather than inventing exit values.
All final gates and the repeated red check explicitly print exit codes.

The original-predicate mutation was confirmed byte-identical to the HEAD Git
blob `f917654597619002ceb92a792ae9f0283d8eb859`. The candidate predicate was restored
after that bounded check. Final verification results refer to the candidate hash
below, not the temporary original predicate.

There are 18 new tests: 15 expose the old predicate, while 3 preserve existing
empty/non-F/nonterminal behavior. The old suite had 11 chain-invariant tests and
62 package tests; the candidate has 29 and 80 respectively. The 15 red cases are
14 `true !== false` assertion failures plus one null-member `TypeError` from the
old `reduce`. No failure was an import/runner problem during the red checks.

Integration's one skip is the pre-existing AC19 workflow marker-presence test:
`integration/tests/conformance.test.ts:224-227` skips when its computed
`../../../../.github/workflows/foreman-line-ci.yml` URL does not exist (it resolves
under `plugins/.github`, not repository-root `.github`). No skip was added or
changed. That test is not evidence of workflow verification. Existing integration
tests also perform read-only local Git queries against `origin/main`; no fetch,
remote calls, real Jira/GitHub transport, or live adapter execution was requested.

## AC Evidence

| AC | Candidate evidence |
| --- | --- |
| AC-1 | Existing sealed fixture preserved; existing non-F fixture; explicit empty and earlier-ClosureRecord/nonterminal-tip tests in chain-invariants |
| AC-2 | Five individually named schema/chain-valid tip variants: half-closed claim, claim wearing ClosureRecord, stage wearing HalfClosedClosure, other stage-F subject, ClosureRecord outside F |
| AC-3 | Direct `isSealed` rejection for duplicate/gapped sequence, pointer mismatch, schema violation, claimRef invariant, each correlation identifier, null/scalar/malformed-object members; expected validator error categories asserted |
| AC-4 | Valid chain extended by a half-closed claim, another failed retry claim, then successful ClosureRecord; false at each claim and true only at terminal closure; shipped integration retry tests also pass |
| AC-5 | 80/80 receipts tests, receipts typecheck/lint; 188 integration passes and one precisely documented existing skip; original-predicate red proof above |
| AC-6 | Four allowed manual paths only; untouched locks/settings/spec/goals/integration/fixtures; exact command ledger, hashes and diff below; no staging/commits/push |

The changed predicate reuses `validateChain` rather than duplicating invariants.
Validation happens before reduction, so empty and malformed JSON-member chains
return false without reducing invalid members. The highest-sequence selection is
retained; no new assumption that array tail equals highest sequence is introduced.

## Limits and Scope Exceptions

- This is structural sealing only. Stored hash/prevHash equality is not hash
  recomputation, signatures, authenticated merge facts, or immutable receipt storage.
- `subjectKind` identifies the ClosureRecord tag; subject payload is not deep
  validated. Existing minimal `{ ok: true }` fixture remains valid intentionally.
- No A-through-F completeness or stage-order rule was added. The existing valid
  `[A, F]` integration case remains sealed, while its separate lifecycle assertion
  remains independent. `validateChain` still uses its shipped ordered-array contract.
- `isSealed` now pays whole-chain validation cost (including the existing sequence
  sort) instead of only a linear tip scan. No performance benchmark is claimed.
- Robustness is for the shipped receipt/JSON-member contract, not arbitrary hostile
  JavaScript getters/proxies, non-array inputs, or cryptographic trust.
- Integration's separate `findSeal` can recognize a matching receipt without this
  predicate's chain-validity/terminal requirements. Parent ruled this a follow-up,
  NOT FL-R1 scope; it is unchanged and not claimed hardened.
- Only authorized ignored dependency materialization and existing hermetic test
  temporary-directory writes occurred beyond the four manual paths. Existing test
  helpers choose OS temporary locations; this is not OS containment or a claim
  that every child-process filesystem effect was sandboxed. No manual live-goal
  record writes or source-checkout dependency writes occurred.
- No cache failure remains. No product/spec blocker remains for the candidate.
  Independent fresh-context review/adoption is still required and not self-certified.

## Hashes and Diff

These are Git blob identities from `git ls-tree HEAD` and `git hash-object`
(without `-w`); hashes were not written to the object database by these commands.

| File relative to plugins/foreman-line/ | HEAD blob | Candidate blob |
| --- | --- | --- |
| receipts/src/validator.ts | f917654597619002ceb92a792ae9f0283d8eb859 | e5aba3acb4f9a5403a2fc30e12b5b068a6fc8a7a |
| receipts/tests/chain-invariants.test.ts | 1be11774ae952b979fe6cd3f6d636cb039ca0538 | 99d8fa6dcb3432b8b518efeef539a22c007d89bd |
| receipts/README.md | a2030707dd582e268a280bf82b93ea97c95d967a | a9271283fdc084f19319414eb406ed504b03a35d |

Supplied untracked spec blob: `e50020f126d0c37bc836fca700518ef6bd7a0eff`.
This handoff is new and excluded from its own content hashes/diff to avoid a
self-referential digest. Its final blob is reported separately in the completion
message. No hash here represents cryptographic receipt verification.

Exact candidate code/test/README diff: 3 files, 144 insertions, 7 deletions.
Stable patch ID: `2d4e6809daebb9fca774aac99d9adc18a525b587`.
The fourth manual file is this handoff, newly added.

Commands from worktree root for the exact full diff and its identity:

```powershell
git diff -- plugins/foreman-line/receipts/src/validator.ts plugins/foreman-line/receipts/README.md plugins/foreman-line/receipts/tests/chain-invariants.test.ts
git diff --binary -- plugins/foreman-line/receipts/src/validator.ts plugins/foreman-line/receipts/tests/chain-invariants.test.ts plugins/foreman-line/receipts/README.md | git patch-id --stable
git hash-object plugins/foreman-line/receipts/src/validator.ts plugins/foreman-line/receipts/tests/chain-invariants.test.ts plugins/foreman-line/receipts/README.md plugins/foreman-line/docs/specs/active/FL-R1-terminal-seal.md
git ls-tree HEAD plugins/foreman-line/receipts/src/validator.ts plugins/foreman-line/receipts/tests/chain-invariants.test.ts plugins/foreman-line/receipts/README.md
```

The full diff was emitted and inspected in the native tool transcript; the exact
runtime hunk is also retained here. Tests add the 18 cases enumerated above;
README replaces the two-line stage-F-only definition with nine lines documenting
validity, terminal identity, retries, deliberate behavior tightening, and limits.

```diff
@@ -191,6 +191,8 @@
-/** Derived read (not a stored flag): sealed iff the highest-sequence receipt is stage F. */
+/** Structural seal only: a valid chain ending in a stage-F ClosureRecord, not a claim. */
 export function isSealed(chain: readonly ReceiptDocument[]): boolean {
-  if (chain.length === 0) return false
+  if (!validateChain(chain).valid) return false
   const highest = chain.reduce((max, doc) => (doc.sequence > max.sequence ? doc : max))
-  return highest.stage === 'F'
+  return (
+    highest.kind === 'stage' && highest.stage === 'F' && highest.subjectKind === 'ClosureRecord'
+  )
 }
```

Scope evidence commands from worktree root:

```powershell
git status --short --branch --untracked-files=all
git diff --check
git diff --no-index --check -- NUL plugins/foreman-line/docs/kickstarters/FL-R1-handoff.md; $code = $LASTEXITCODE; "EXIT_CODE=$code"; exit $code
git diff --name-only HEAD
git diff --cached --stat
git rev-parse HEAD
git diff --exit-code HEAD -- . ':(exclude)plugins/foreman-line/receipts/src/validator.ts' ':(exclude)plugins/foreman-line/receipts/tests/chain-invariants.test.ts' ':(exclude)plugins/foreman-line/receipts/README.md'; $code = $LASTEXITCODE; "EXIT_CODE=$code"; exit $code
```

Tracked diff is limited to the three allowed receipt files; this handoff and the
pre-existing supplied spec are the only untracked source/document files. Staged
diff is empty, HEAD is unchanged, and whitespace validation passes. The worktree
remains an isolated uncommitted repair candidate for the parent's independent review.
