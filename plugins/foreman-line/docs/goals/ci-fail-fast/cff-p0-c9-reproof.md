# CFF-P0 — C9-class measured read-sweep re-proof (AC6)

**Spec:** `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
(SHA-256 `e529dedc7b4d035f4e3447e623c9ad0e1d364bda30388d8a2e4409812fb15ab8`), AC6.
**Measured at:** worktree HEAD `f9788222c9b18087600d2a247dce1005af2c7943`.
**Environment fingerprint:** this re-proof is a **static read-sweep** of
committed test/source files — `grep`/`readFileSync`-level inspection of what
import statements and filesystem APIs each check's test files reference, run
on `linux`, Node `v26.8.2`, this session. It is distinct from AC5's dynamic
D7 capture (execution-time instrumentation on the pinned environment); this
record only verifies that `classifyPath`'s existing `ORDINARY`/`CODE` split
(C9's `READER_SET`, `scripts/ci-reuse.mjs:129-155`) still holds for the
post-CI-P2 cohort by **reading what each package's checks actually open**,
per lesson #46 (measured, not asserted) — the Stage Zero grep is used only
as a hint to point the reading, never cited as the evidence itself.

## Scope

`kernel-import`, `ops-console`, `project-scaffold` — the three cost-unknown
packages identified in `cff-p0-assignment-and-waivers.md` §fallback.1, the
post-CI-P2 cohort this AC targets.

## Per-package: what checks open at test time

### `kernel-import`

```
grep -rnE "\.md['\"]|readFileSync|readFile\(|import\(|require\(" \
  plugins/foreman-line/kernel-import/tests/*.ts plugins/foreman-line/kernel-import/src/*.ts \
  | grep -iE "\.md|docs/|README"
```
Every `.md`-looking string found (`docs/goals/a.md`, `docs/goals/ghost.md`,
`docs/proof/approval-1.md`, etc., across `approvals.test.ts`,
`cursors.test.ts`, `divergence.test.ts`, `import.test.ts`, `lineage.test.ts`,
`projection.test.ts`, `projection-determinism.test.ts`) is a **synthetic
fixture path string** passed as an in-memory `sourcePath`/`commitId` field to
a fake lineage gateway (`FakeLineage` from `./helpers/fake-lineage.js`,
imported in every one of those files) — never a real `readFileSync` call
against the actual repository tree. This matches the Stage Zero grep's hint
("kernel-import references are fixture paths") — confirmed here by reading
every matching line's call context, not merely counting matches.

```
grep -n "^import " plugins/foreman-line/kernel-import/tests/*.ts | grep -v "node:\|\.\./src\|node_modules"
```
Every non-`node:`/non-`../src` import across all 12 test files resolves to
`./helpers/fake-lineage.js` or another local `./helpers/*` module — **no**
test file imports anything outside `plugins/foreman-line/kernel-import/`.
Module-load reads: zero reads of real repository Markdown.

### `ops-console`

```
grep -rnE "mkdtemp|tmpdir|materializ" plugins/foreman-line/ops-console/tests/*.ts
```
Confirms the Stage Zero hint directly: `api.test.ts`, `chain-walk.test.ts`,
`corpus.test.ts`, `derive.test.ts`, `gates.test.ts`, `invoke.test.ts`,
`live-goal.test.ts` all import `materialize`/`withTempRepo` from
`./support/materialize.js` and call `mkdtempSync(join(tmpdir(), 'foc-*-'))`
to build a synthetic repo under the OS temp directory before every scenario
run — confirmed by reading `tests/support/materialize.ts:243` (`materialize`)
and `:378-382` (`withTempRepo`).

Reads outside the temp repo, checked explicitly:
- `corpus.test.ts:19,24` — `readdirSync`/`readFileSync` against
  `SCENARIOS_DIR = fileURLToPath(new URL('./fixtures/scenarios/',
  import.meta.url))` — **package-local JSON fixtures**
  (`plugins/foreman-line/ops-console/tests/fixtures/scenarios/*.json`), not
  Markdown, not outside the package.
- `read-only.test.ts:148-152` — a structural guard test that reads
  `../src/*.ts` (ops-console's **own** source files) to assert no module
  outside `notifications.ts`/`invoke.ts` calls fs-write APIs — a module-load
  read of the package's own TypeScript source, never Markdown.
- `src/api.ts:60`, `src/chain.ts:69`, `src/invoke.ts:180`,
  `src/notifications.ts:33`, `src/project.ts:48`, `src/routing.ts:83` — every
  `readFileSync` in `src/` takes a **caller-supplied path parameter**
  (`policyPath`, `dir`, `stateDir`, `config.receiptsDir`) resolved at test
  time to a path under the scenario's materialized temp repo — never a fixed
  path into the real repository tree.

No check in `ops-console` reads real repository Markdown/README content at
test time — confirmed, not asserted.

### `project-scaffold`

```
grep -n "TEMPLATES_DIR" plugins/foreman-line/project-scaffold/tests/helpers.ts
```
`TEMPLATES_DIR = join(PACKAGE_ROOT, '..', 'templates')` — resolves to
`plugins/foreman-line/templates/`, a **sibling package-tree directory**
(contains `AGENTS.md`, `CLAUDE.md`, `STANDING-CONSTRAINTS.md`,
`defects_lessons.md`, `spec-index.md`, `kickstarters/*.md` — the generation
templates the Stage Zero hint calls "generation targets"). Tests
(`helpers.ts:71`: `cpSync(TEMPLATES_DIR, cloned, { recursive: true })`;
`placeholders.test.ts:40-46`) clone this directory into a scratch target
before generating, and `generator.ts`'s `readTemplate`/`loadPreset`
(`:83-96`, `:65-74`) do read these files at generation time.

**Classification check — does this template-reading threaten the
ordinary-documentation set?**
```
node -e "
import('./scripts/ci-reuse.mjs').then(m => {
  for (const p of [
    'plugins/foreman-line/templates/AGENTS.md',
    'plugins/foreman-line/templates/CLAUDE.md',
    'plugins/foreman-line/templates/STANDING-CONSTRAINTS.md',
    'plugins/foreman-line/templates/defects_lessons.md',
    'plugins/foreman-line/templates/spec-index.md',
    'plugins/foreman-line/templates/kickstarters/shaping-template.md',
  ]) console.log(p, '->', m.classifyPath(p));
});
"
```
Measured output — **every one classifies `code`**, never `ordinary_documentation`:
```
plugins/foreman-line/templates/AGENTS.md -> code
plugins/foreman-line/templates/CLAUDE.md -> code
plugins/foreman-line/templates/STANDING-CONSTRAINTS.md -> code
plugins/foreman-line/templates/defects_lessons.md -> code
plugins/foreman-line/templates/spec-index.md -> code
plugins/foreman-line/templates/kickstarters/shaping-template.md -> code
```
Why: `classifyPath`'s rule 4a (README/AGENTS ordinary) requires the path NOT
start with `plugins/foreman-line/` (`scripts/ci-reuse.mjs:191-194`) — every
path under `plugins/foreman-line/templates/` fails that condition and falls
through rules 4b-4d (which require a `docs/goals/` or `docs/transcripts/` or
top-level `docs/` prefix — none match `plugins/foreman-line/templates/`), to
the rule-5 default-deny `code` bucket. `project-scaffold`'s reads of these
templates are therefore **already safely classified `code`** — a change to
any of them already forces a full sweep; no reader-coverage gap exists here.

## Reader coverage holds — no shrink required

Per AC6.2, any newly discovered doc-reading check **shrinks** the
ordinary-documentation set (the safe direction). Across all three packages:

- `kernel-import`: zero reads of real repository Markdown (all `.md`-looking
  strings are synthetic fixture identifiers, never filesystem paths).
- `ops-console`: zero reads of real repository Markdown outside
  package-local JSON fixtures and its own `src/` (both already outside the
  ordinary-documentation classification's scope).
- `project-scaffold`: reads real Markdown (the `templates/` tree) but every
  path involved already classifies `code` under the existing `READER_SET`
  (`scripts/ci-reuse.mjs:129-155`) and `classifyPath` rules — confirmed by
  direct evaluation above, not by inference.

**No newly discovered doc-reading check was found. The ordinary-documentation
classification's reader coverage still holds for `kernel-import`,
`ops-console`, `project-scaffold`. No entry is added to `READER_SET` and no
shrink is recorded in AC5's READER_SET delta projection** (AC5 itself is a
named loop-stop — see `read-graph/measurement-log.md` — so no AC5 projection
artifact exists this session to carry a delta; this finding is recorded here
so CFF-P1/CFF-P2 and a future AC5 pass start from "re-verified: no change,"
not "unverified").

## Environment discipline (#48)

This re-proof is a static read of committed source (import/`readFileSync`
call-site analysis), identical regardless of host OS or Node version — there
is no environment-gated behavior in an `import` statement or a string
literal. No environment variance is named here because none exists at this
level of measurement; any environment-gated *runtime* difference (e.g. a
conditional `readFileSync` behind `process.platform`) would be a D7-level
concern for the (blocked) AC5 dynamic capture, not this static AC6 re-proof.
`grep`/`node -e` commands above were run on `linux`, Node `v26.8.2`, this
session, and are reproducible on any host since they inspect source text and
pure classification logic only.
