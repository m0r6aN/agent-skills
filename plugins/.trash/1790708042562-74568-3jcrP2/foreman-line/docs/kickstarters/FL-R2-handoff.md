# FL-R2 Builder Handoff

Date: 2026-09-05. Disposition: HOLD, uncommitted B-01 remediation candidate awaiting fresh independent re-review.
This is not historical W4 goal closure, release approval, or CI enforcement promotion.

## Authority and Scope

- Worktree: `D:/Repos/agent-skills-worktrees/fl-r2-audit-loader-20260905`.
- Branch: `feat/foreman-line-FL-R2-20260905`.
- Base/HEAD: `5ce6ddc7f996d764e506b6b421779fbf3ece689a`.
- Read root/plugin AGENTS.md, standing constraints, spec conventions, and the assigned spec.
- Parent accepted Step 0 and added FL-R2-A1 before implementation. The spec was already untracked and was not edited by this builder.
- Native worker is instruction-limited, NOT OS containment. The host task cannot select a per-worker model or load emitted Claude settings. No claim those settings were enforced.
- Execution stayed with the assigned native worker and deterministic local tools. No provider delegation or independent reviewer was invoked by this builder. The parent relayed independent reviewer B's B-01 finding and its own reproduction; fresh independent re-review remains outstanding.
- No commits, staging, pushes, merges, spec/settings/goal edits, live CI changes, external services, provider calls, credentials, or secret access. npm operations used offline mode, disabled install scripts and audit, and had no online fallback.
- Source-checkout dependencies were not modified. Only this worktree's installed package dependencies were prepared.

Exact candidate mutation paths:

- `plugins/foreman-line/integration/src/governing-spec.ts`
- `plugins/foreman-line/integration/tests/fl-r2-real-loader.test.ts`
- `plugins/foreman-line/integration/tests/governing-spec.test.ts`
- `plugins/foreman-line/integration/package.json`
- `plugins/foreman-line/integration/package-lock.json`
- `plugins/foreman-line/docs/kickstarters/FL-R2-handoff.md`

FL-R2-A1 limits the existing test-file edit to the dependency assertion and its required import: exact runtime dependencies `{ yaml: '2.9.0' }`, plus a scan rejecting direct integration source imports/re-exports from spec-linter. No unrelated assertion was weakened.

## Implementation

- Replace the inline-only partial YAML reader with `yaml@2.9.0` `parseDocument`.
- Extract only a leading, line-delimited `---` frontmatter block. Handle LF, CRLF, trailing horizontal fence whitespace, and closing fence at EOF. Fence matching uses line-bounded, linear-time string processing.
- Reject unterminated frontmatter, parser errors, duplicate keys, parser warnings such as unsupported tags, and failed alias conversion. Require string mapping keys with `stringKeys: true` alongside `uniqueKeys: true` so alias keys cannot overwrite validated metadata during `toJS`. Keep the parser's alias expansion bound at 100; benign value aliases still work.
- Convert YAML to `unknown`, require a non-array mapping and nonempty string status, then filter non-active records. Validate active risk against the existing four-value enum and surfaces as a nonempty array of nonempty/non-whitespace strings.
- Preserve descriptor exports, sorted discovery, normalized descriptor paths, surface matching, max declared risk, and injected-descriptor status semantics.
- Wrap real directory/read/YAML failures as `IntegrationError` with code `POSTURE_INVALID`. JSON-encode path/error text in those messages so parser diagnostics cannot introduce CR/LF/ESC into report annotation lines.
- Audit/report/DocSpine entrypoints, frozen schemas, error unions, public export files, and cross-package contracts are unchanged. Report input failures still produce a warning, null decision, and exit zero.
- Add 51 real-disk tests, including seven B-01 regressions/compatibility checks. Corpus counts are a parcel-time read-only check, not a permanent test pinning a moving active-spec inventory.

## Verification Results

All commands below used working directories inside this worktree.

| Phase | Result |
| --- | --- |
| Runtime | Explicit Node executable reports `v24.19.0` |
| Original focused tests | 32 passed, 0 failed, 0 skipped |
| Established original integration baseline | 189 total: 188 passed, 0 failed, 1 pre-existing skip |
| Original typecheck after dependency preparation | Exit 0 |
| Original lint | Exit 0, 34 files checked |
| RED: first 40 real-loader tests, old production loader unchanged | 5 passed, 35 failed, 0 skipped; exit 1 |
| Old actual disk corpus reader | 0 baseline + 1 added = 1 loaded |
| First GREEN: new loader + existing governing/report tests | 53 passed, 0 failed, 0 skipped |
| Pre-B-01 focused real-loader suite | 44 passed, 0 failed, 0 skipped |
| Pre-B-01 full integration suite | 233 total: 232 passed, 0 failed, 1 pre-existing skip |
| B-01 RED: alias-key tests before stringKeys fix | 51 total: 45 passed, 6 failed, 0 skipped; exit 1 |
| Final focused real-loader suite after B-01 fix | 51 passed, 0 failed, 0 skipped |
| Final full integration suite after B-01 fix | 240 total: 239 passed, 0 failed, 1 pre-existing skip |
| Final typecheck | Exit 0 |
| Final lint | Exit 0, 35 files checked, no fixes applied |
| Final actual disk corpus reader | 4 baseline + 1 added = 5 loaded; before/after SHA-256 maps identical |
| Tracked whitespace check | `git diff --check`, exit 0 |

The original loader Git blob was `363407dc8c0067c46767f9b01dd8756fea1eabf0` during initial RED. Failures were assertions about missing descriptors, missing typed exceptions, or a false low-risk decision, not dependency/import failures. Four additional edge-case tests were added after the initial GREEN; that RED count refers to the initial 40, not the later 44 or current 51.

The unchanged skip is `conformance.test.ts` AC19, whose referenced `.github/workflows/foreman-line-ci.yml` is absent. No new test is skipped or disabled.

### Setup Issues and Resolution

- Initial registration install exceeded the 120-second shell timeout; spec-linter install returned a shell process-kill error. Retried the identical offline commands with a 300-second timeout; both succeeded.
- Initial typecheck found missing `ajv` resolution in sibling permission-profiles/schema-scaffold. Initial full-suite execution also encountered missing permission-profiles dependencies. Installed their already-declared dependencies offline inside this worktree; final typecheck and suite pass.
- The first full-suite attempt set TEMP/TMP directly to integration/node_modules. `tsx` became unavailable during that run, consistent with its temporary-cache directory colliding with the installed `tsx` directory. Reinstalled integration offline and replaced that setup with a dedicated `node_modules/fl-r2-runtime-*` directory, cleaned in `finally`. No source files were changed to work around this setup failure.
- The first focused baseline and standalone corpus invocations used default tsx cache behavior. The established full baseline, RED, GREEN, and final test runs used dedicated temporary runtime directories in this worktree. This is process-local configuration, not OS isolation.
- First post-change typecheck caught a `readdirSync` string/buffer overload in the revised assertion; explicit UTF-8 fixed it. Biome formatting/import ordering was applied only to the three authorized TypeScript files.
- No unresolved build/typecheck/lint environment blocker remains. No unrelated source or test repairs were made.

## Commands

Package commands ran with cwd `D:/Repos/agent-skills-worktrees/fl-r2-audit-loader-20260905/plugins/foreman-line/<package>`. Each parent directory was verified before installation. Package manifests were inspected first.

This exact preparation command ran in integration, contracts, receipts, registration, projection, shaping, spec-linter, permission-profiles, and schema-scaffold:

```powershell
& 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' ci --offline --ignore-scripts --no-audit --no-fund
```

Registration and spec-linter had the retries described above. Integration was reinstalled after the temporary-cache issue and again after adding YAML (9 packages before YAML, 10 after). Existing sibling manifests and lockfiles were unchanged. Those sibling dependencies are needed by the pre-existing transitive package graph; the loader does not import spec-linter.

After apply_patch added exact `yaml: "2.9.0"` to integration/package.json, integration-only lock regeneration was:

```powershell
& 'D:/nvm/v24.19.0/node.exe' 'D:/nvm/v24.19.0/node_modules/npm/bin/npm-cli.js' install --package-lock-only --offline --ignore-scripts --no-audit --no-fund
```

The lock diff adds only root runtime YAML metadata and the yaml 2.9.0 package entry. The registry URL is lock metadata, not evidence of a network request.

The following commands ran from integration:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --version
& 'D:/nvm/v24.19.0/node.exe' --import tsx --test tests/governing-spec.test.ts tests/report.test.ts tests/audit-trigger.test.ts
& 'D:/nvm/v24.19.0/node.exe' node_modules/typescript/bin/tsc --noEmit
& 'D:/nvm/v24.19.0/node.exe' node_modules/@biomejs/biome/bin/biome check .
& 'D:/nvm/v24.19.0/node.exe' node_modules/@biomejs/biome/bin/biome check --write src/governing-spec.ts tests/fl-r2-real-loader.test.ts tests/governing-spec.test.ts
```

Exact full-suite command, used for the established baseline and final suite:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --input-type=module -e 'import { mkdtempSync, rmSync } from "node:fs"; import { resolve, dirname, delimiter } from "node:path"; import { spawnSync } from "node:child_process"; const temp = mkdtempSync(resolve("node_modules/fl-r2-runtime-")); try { const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "tests/*.test.ts"], { stdio: "inherit", env: { ...process.env, PATH: dirname(process.execPath) + delimiter + process.env.PATH, TEMP: temp, TMP: temp } }); if (result.error) throw result.error; process.exitCode = result.status ?? 1; } finally { rmSync(temp, { recursive: true, force: true }); }'
```

Exact focused command, used for RED and the final loader-only suite:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --input-type=module -e 'import { mkdtempSync, rmSync } from "node:fs"; import { resolve, dirname, delimiter } from "node:path"; import { spawnSync } from "node:child_process"; const temp = mkdtempSync(resolve("node_modules/fl-r2-runtime-")); try { const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "tests/fl-r2-real-loader.test.ts"], { stdio: "inherit", env: { ...process.env, PATH: dirname(process.execPath) + delimiter + process.env.PATH, TEMP: temp, TMP: temp } }); if (result.error) throw result.error; process.exitCode = result.status ?? 1; } finally { rmSync(temp, { recursive: true, force: true }); }'
```

The first GREEN command used that same wrapper with child arguments `["--import", "tsx", "--test", "tests/fl-r2-real-loader.test.ts", "tests/governing-spec.test.ts", "tests/report.test.ts"]`. Child Node always comes from `process.execPath`; PATH changes affect only that child process environment.

## Read-Only Corpus

Exact final check, cwd integration:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --import tsx --input-type=module -e 'import assert from "node:assert/strict"; import { readFileSync, readdirSync } from "node:fs"; import { createHash } from "node:crypto"; import { resolve, join, basename } from "node:path"; import { loadActiveSpecsLive } from "./src/governing-spec.ts"; const root = resolve("../../.."); const dir = join(root, "plugins/foreman-line/docs/specs/active"); const snapshot = () => Object.fromEntries(readdirSync(dir).filter(n => n.endsWith(".md")).sort().map(n => [n, createHash("sha256").update(readFileSync(join(dir, n))).digest("hex")])); const before = snapshot(); const specs = loadActiveSpecsLive(root); const added = specs.filter(s => basename(s.path) === "FL-R2-real-audit-loader.md"); const baseline = specs.filter(s => basename(s.path) !== "FL-R2-real-audit-loader.md"); assert.deepEqual(baseline.map(s => [basename(s.path), s.risk]), [["KEO-156-P5-minimum-verifier-implementation.md", "critical"], ["KEO-197-browseahead-domain-path-slop-squatting-contract-freeze.md", "critical"], ["KONE-TBD-cerebras-shadow-operational-dispatch.md", "elevated"], ["P1-plugin-packaging.md", "elevated"]]); assert.equal(added.length, 1); assert.equal(added[0].risk, "elevated"); assert.deepEqual(added[0].surfaces, ["plugins/foreman-line/integration/"]); assert.ok(specs.every(s => s.surfaces.length > 0 && s.surfaces.every(p => typeof p === "string" && p.trim().length > 0))); assert.deepEqual(snapshot(), before); console.log(JSON.stringify({baseline: baseline.length, added: added.length, total: specs.length, readOnlyHashesUnchanged: true, specs: specs.map(s => ({name: basename(s.path), risk: s.risk, surfaces: s.surfaces.length, sha256: before[basename(s.path)]}))}, null, 2));'
```

All paths below are in `plugins/foreman-line/docs/specs/active/`. The entire Markdown file was hashed, not just metadata.

| Class | Filename | Risk | Surface Count | SHA-256 Before = After |
| --- | --- | --- | --- | --- |
| Baseline | KEO-156-P5-minimum-verifier-implementation.md | critical | 5 | `60f0a2d4ee4234dfb728c4a7e6141af2f316c56ab57a0cff28b438d471ea3842` |
| Baseline | KEO-197-browseahead-domain-path-slop-squatting-contract-freeze.md | critical | 1 | `06d34342279d22af8f64f52b6d57aa5990586578bf0930b9b678d3bdda50ad5f` |
| Baseline | KONE-TBD-cerebras-shadow-operational-dispatch.md | elevated | 2 | `4d4bde7c5e02add170ee1f721b812e51a9e93efefbbdb990c9fc0bf9d28f946f` |
| Baseline | P1-plugin-packaging.md | elevated | 21 | `d183dedc67bc4f08a6db63d7d9c65eadb03572a62be964f7aa7b63a467c3f542` |
| Added | FL-R2-real-audit-loader.md | elevated | 1 | `991dbe600b1f2aa791dc44dcdc9115cf47d7287e85c48e4542588d3494358e11` |

Old-reader command, run before production edits:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --import tsx --input-type=module -e 'import { loadActiveSpecsLive } from "./src/governing-spec.ts"; const specs = loadActiveSpecsLive("../../.."); console.log(JSON.stringify({baseline: specs.filter(s => !s.path.endsWith("/FL-R2-real-audit-loader.md")).length, added: specs.filter(s => s.path.endsWith("/FL-R2-real-audit-loader.md")).length, specs}, null, 2));'
```

## AC Mapping

| AC | Builder Evidence |
| --- | --- |
| AC-1 | Real temporary filesystem fixtures: inline/block lists crossed with LF/CRLF; quoted commas, hashes, escaped apostrophes and comments; all four risk levels; EOF fence; aliases and indented block-scalar fences. |
| AC-2 | Real disk filtering for draft/done/superseded, Markdown and non-md artifacts; deterministic order and highest-risk evaluation; real loaded risk remains report-only. |
| AC-3 | Independent invalid YAML/duplicate-key/root/status/risk/surfaces cases, unsupported tags and aliases, unterminated fence, real list/read failures, hostile near-fence input, and malformed real-loader report warning with exit zero. B-01 adds typed refusal and report-only checks for risk/status/surfaces alias-key overrides, while preserving benign aliases as values. |
| AC-4 | Actual disk reader loads four named baseline specs plus one FL-R2 addition; five complete-file SHA-256 hashes unchanged across reading. |
| AC-5 | Old production loader fails 35/40 initial regressions; pre-B-01 candidate fails all six new alias-key rejection/report tests; final loader tests 51/51; integration 239 pass with unchanged baseline skip; typecheck/lint exit zero. |
| AC-6 | Candidate paths limited to amended Allowed Files; existing parent-owned spec unchanged; this handoff records limitations and no external activity. |

## Diff and Hashes

Commands from the worktree root:

```powershell
git status --short --branch
git diff --check
git diff --numstat
git diff --full-index -- plugins/foreman-line/integration/src/governing-spec.ts plugins/foreman-line/integration/tests/governing-spec.test.ts plugins/foreman-line/integration/package.json plugins/foreman-line/integration/package-lock.json
git hash-object plugins/foreman-line/integration/src/governing-spec.ts plugins/foreman-line/integration/tests/fl-r2-real-loader.test.ts plugins/foreman-line/integration/tests/governing-spec.test.ts plugins/foreman-line/integration/package.json plugins/foreman-line/integration/package-lock.json plugins/foreman-line/docs/specs/active/FL-R2-real-audit-loader.md
```

| Path Under integration/ | Git Blob Hash | Tracked Delta |
| --- | --- | --- |
| src/governing-spec.ts | `8487e1e0cc5ba727eabf7e353cbd16e992b2b518` | +48/-40 |
| tests/fl-r2-real-loader.test.ts | `8d2df2b147b5378b0a03e913c84a263aa99bdb5e` | New, untracked |
| tests/governing-spec.test.ts | `9634ca680b84753f3eff2caa2716fc7a4167ef2d` | +13/-3 |
| package.json | `e81687dd3d91219116b17c348411520c134e06fe` | +3/-0 |
| package-lock.json | `3ca1d862658736c4658ba01127a2032c3e23a6c7` | +18/-0 |

The parent-owned spec Git blob was `b4d9821dc2157300260bd6f199a5f215ebb1a153` immediately after reading A1 and remains identical after implementation. This handoff is also a new untracked Allowed File; its self-hash is intentionally not embedded in itself. Untracked files are not included by ordinary `git diff` and must be included in parent review.

## B-01 Remediation

Parent instruction: remediate the medium AC-3 HOLD within existing Allowed Files. No reviewer report or unrelated review topics were read. No new dependency, installation, spec/settings edit, or external activity was needed in this remediation turn.

Before production edits, seven new real-reader tests were added: three typed-error tests, three report-only tests, and one benign value-alias test covering status/risk/surfaces. The focused command in Commands above ran against pre-fix loader blob `1815f1fe6865563e246d58cc2ed64187fb127e4a`: 45 passed, 6 failed, 0 skipped. All six new rejection/report tests failed; all 44 existing tests and the new benign-value test passed.

The exact risk payload supplied by the parent was used inside an on-disk Markdown frontmatter block:

```yaml
r: &r risk
status: active
risk: critical
? *r
: low
surfaces: [docs/]
```

The other independent fixtures were:

```yaml
r: &r status
status: active
? *r
: draft
risk: critical
surfaces: [docs/]
```

```yaml
r: &r surfaces
status: active
risk: critical
surfaces: [docs/]
? *r
: [other/]
```

Exact observed failure: all three real-reader calls failed to throw. The risk report returned `declaredRisk: low`, `decision: low`, `triggered: false`, and the ALIAS.md governing path. Status and surfaces reports returned `declaredRisk: low`, `decision: low`, `triggered: false`, null governing spec, and `no-governing-spec` instead of a skipped-input warning/null decision.

The production fix is exactly one additional parse option: `stringKeys: true`, adjacent to `uniqueKeys: true`. This rejects alias nodes used as mapping keys before `toJS`, without disabling aliases used as values. Typed `POSTURE_INVALID` wrapping and report-only behavior are unchanged.

After the fix, the same exact focused command passed 51/51. The full-suite command passed 239/240 with the unchanged AC19 skip; explicit Node typecheck and lint both exited zero. The exact read-only corpus command was rerun: four baseline specs plus FL-R2 loaded, and every SHA-256 in the corpus table remained identical before and after. No formatting rewrite or further production fix was necessary.

### Final Candidate Patch Hash

The final response records HEAD and the SHA-256 of the complete six-file candidate patch, including this handoff. To avoid a self-referential document hash, the digest itself is not embedded here. The recipe concatenates the binary/full-index tracked HEAD diff, then the untracked regression-test patch, then the untracked handoff patch, in that order. Run from the worktree root:

```powershell
& 'D:/nvm/v24.19.0/node.exe' --input-type=module -e 'import assert from "node:assert/strict"; import { spawnSync, execFileSync } from "node:child_process"; import { createHash } from "node:crypto"; const hash = createHash("sha256"); const common = ["diff", "--no-color", "--no-ext-diff", "--no-textconv", "--binary", "--full-index"]; const commands = [[...common, "HEAD", "--", "plugins/foreman-line/integration/src/governing-spec.ts", "plugins/foreman-line/integration/tests/governing-spec.test.ts", "plugins/foreman-line/integration/package.json", "plugins/foreman-line/integration/package-lock.json"], ...["plugins/foreman-line/integration/tests/fl-r2-real-loader.test.ts", "plugins/foreman-line/docs/kickstarters/FL-R2-handoff.md"].map(p => [...common, "--no-index", "--", "/dev/null", p])]; for (const args of commands) { const result = spawnSync("git", args); if (result.error) throw result.error; assert.ok(result.status === 0 || result.status === 1, result.stderr.toString()); hash.update(result.stdout); } console.log(JSON.stringify({head: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(), candidatePatchSha256: hash.digest("hex"), candidateFileCount: 6}, null, 2));'
```

## Limits and Review Focus

- This is audit-metadata normalization, not full spec-linter/schema conformance. It does not validate title, ticket, owner, routing, or other unrelated schema fields.
- Only exact `status: active` governs. Nonempty other string statuses remain filtered; malformed/missing status is typed. Non-active risk/surfaces are not audited after filtering.
- Frontmatter must start on line one with a standalone `---` fence. Mapping keys must be strings; aliases as keys are rejected. No claim of support for every arbitrary YAML document, BOM-prefixed frontmatter, bare-CR line endings, custom tags, or unlimited alias expansion. Benign aliases as values remain supported.
- Any malformed frontmatter aborts loading with a typed error rather than returning partial low-risk descriptors. The unchanged report layer catches it and exits zero with a warning, not an enforced audit failure.
- The source-edge assertion guards direct imports/re-exports. It does not claim the existing transitive integration/approval/projection/shaping package graph has no eventual spec-linter dependency.
- Existing surface glob matching is unchanged; the hostile-input test concerns the new frontmatter fence handling, not a whole-system complexity proof.
- No live audit/DocSpine/provider/GitHub/Jira execution was performed. CI promotion, historical goal completion, and release decisions remain outside this candidate. B-01 has builder remediation evidence, not an independent clearance: candidate remains HOLD pending fresh independent re-review.
