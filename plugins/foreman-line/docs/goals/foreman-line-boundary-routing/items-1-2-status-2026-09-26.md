# Items 1–2 status — 2026-09-26

**Goal:** `foreman-line-boundary-routing` · **Scope:** charter work items 1–2 (locked decisions
D1–D3) and the acceptance gates that cover them.
**Authority:** coordinator decision 2026-09-26 under owner blanket authority.

Item 3–7 work is untouched by this record except for the handoff notes at the bottom.

## Per-gate status (items 1–2 coverage)

### Gate (a) — clean-room absolute `repoRoot`/`pluginRoot` work; relative roots get typed refusals

**Status: PASS.** Every root-consuming seam across the seven packages now either ships the
per-package typed refusal (`<Domain>RootUnresolvedError` / `ROOT_NOT_ABSOLUTE` / `root-not-absolute`,
exit-code-2 class) or was already guarded. Negative controls (one family per package):

| Package | Relative-root refusal (typed) | Out-of-root candidate refusal |
|---|---|---|
| approval | `tests/root-conflation.test.ts` (P2b-AC2 CLI exit 2; library seams) | `computeSpecSet` → `assertContainedPath` (`tests/…`) |
| shaping | `tests/root-conflation.test.ts` (P2b-AC6b family) | `tests/root-conflation.test.ts` (D1 cases: `discoverShapingResults` specsDir, `emitShapingResult` specsDir) |
| projection | `tests/root-conflation.test.ts` | `tests/path-containment.test.ts` + D1 `writeProjectedArtifact` specsDir case |
| dispatch | `tests/root-guards.test.ts` (D1 cases: `prepareDispatch`/`executeDispatch`, `kompressContext`, `queryAndRankCandidates`) | `tests/root-guards.test.ts` (D1 cases) |
| registration | `tests/root-conflation.test.ts` (P2b-AC6b preview; D1: `detectRegistrationMode`, `backfillTicketLine`/`restoreSnapshots`, `git` cwd) | `tests/root-conflation.test.ts` (D1: out-of-root receipt locator, specsDir, binding ref) |
| integration | `tests/root-guards.test.ts` (D1 cases: closure/exit-vehicle/receipt/closure-receipt/governing-spec/report/docspine-hook/branch-protection/pr-plan seams) | pre-existing `tests/closure.test.ts` AC8 (`../` in `specLifecycleMove`) + `tests/exit-vehicle.test.ts` AC3 (non-UUID workflowId) |
| spec-linter | `tests/cli.test.ts` (`boundary-routing D1: a relative --repo-root is refused with typed exit 2`) | pre-existing GSO-P1 out-of-root candidate case (exit 2) |
| foreman-config | n/a — takes no roots (config path is an explicit argument; `src/validate.ts` never resolves locations) | n/a |

Positive controls (absolute roots proceed) are the packages' existing suites plus explicit
positive-control cases in the new `root-guards.test.ts` files.

### Gate (b) — repo-active-code sweep: no customer-specific project/assignee/root fallback

**Status: PASS (with recorded non-identity customer data).** Sweep commands (run from
`plugins/foreman-line/`, 2026-09-26):

```
grep -rn -E "KONE|Kaseya|kaseya|clinton|Clinton|Clint|ACME|assignee|dispatch\.owner" \
  approval/src shaping/src projection/src dispatch/src registration/src integration/src \
  foreman-config/src spec-linter/src
grep -rn -E "process\.cwd\(\)|__dirname|fileURLToPath" \
  approval/src shaping/src projection/src dispatch/src registration/src integration/src \
  foreman-config/src spec-linter/src
```

Result: **zero project-key / assignee / queue / root FALLBACKS.** No shipped site derives an
identity or a root from a constant when the caller omits one — registration refuses via
`resolveProjectKey` (`register.ts`: "registration requires projectKey or a validated
foreman/config.yaml identity.project_key"; contradiction and `null` are typed refusals),
dispatch refuses via `DispatchIdentityUndeclared` before any client exists
(`dispatch/src/query/index.ts`), and every root is a required, absolute-checked argument.

Non-identity customer data found (recorded, dispositions):
- `SITE_URL = 'https://kaseya.atlassian.net'` (`registration/src/adapter-docker-mcp.ts`,
  `dispatch/src/query/index.ts`) — the live Jira HOST pinned at the MCP adapter/query boundary
  (cloudId discovery target), not a project/assignee/root fallback. Identity still injected.
- `registration/config/project-allowlist.json` = `{ "allowedProjectKeys": ["KONE"] }` — a
  committed REFUSAL allowlist for the mcp-test isolation gate (`registration/src/gate.ts`),
  never consulted as identity; a caller's key must come from `projectKey`/`foreman-config` and
  separately pass the gate. Coordinator ruling (see `registration/tests/project-key-plumbing.test.ts`)
  keeps the allowlist at exactly `["KONE"]`.
- `foreman-config/src/testing.ts` `sampleIdentity` (`project_key: 'KONE'`) and
  `spec-linter/src/testing.ts` fixture frontmatter (`ticket: 'KONE-1234'`, `owner: 'clinton.morgan'`)
  — sample fixture data exported for tests/parity, same class as `contracts/src/testing.ts`.
- Remaining matches are comments (e.g. the retired `PROJECT_KEY = 'KONE'` note in
  `register.ts`, issuetype/customfield mapping docs in `adapter-docker-mcp.ts`/`payloads.ts`).
- S2 (cwd/module-location): all `process.cwd()` mentions are refusal docs; the only
  module-location uses are package-ASSET resolution (`foreman-config/src/generate.ts`,
  `spec-linter/src/generate.ts` schema dirs, `registration/src/gate.ts` allowlist file) —
  data shipped inside the package, not a target-repo/plugin-root derivation.

### Gate (c) — linter rejects malformed `foreman/config.yaml`; capability vocabulary only through `foreman-config`

**Status: PASS (pre-existing; cited, not redone).** `spec-linter/tests/cli.test.ts`:
- `P1a: --config with an INVALID config document -> exit 2, foreman-config violations shown`
- `P1a: --config with a missing config file -> exit 2`; `--config` is the ONLY way a config
  reaches the linter (no cwd/`__dirname` lookup) — proven by `P2b-ii AC1/AC2/AC4` broken-tree
  tests (`foreman-config` never loaded without `--config`; typed exit 2 with `--config` when it
  cannot load).
- Capability vocabulary extension only via a validated config:
  `semantic-invariants.test.ts` `P1a AC4` cases + `cli.test.ts` telemetry-config cases
  (unknown `involves:` value warns and passes without config; resolves without advisory when
  `--config` declares the capability).
- Config document shape/validation owned by `foreman-config` (`src/validate.ts`,
  `tests/schema-validation.test.ts`, schema parity in `tests/parity.test.ts`); the linter
  consumes it via the dynamic `foreman-config/src/validate.js` import only on the `--config` path.

## Item 1 (D1) — explicit roots: survey + changes

Existing guard pattern (reused, not reworked): per-package `<Domain>RootUnresolvedError`
(`reason: 'root-not-absolute'`, `code: 2`) + `assertAbsoluteRoot` (`approval`, `shaping`,
`projection`, `registration`), `RoutingError`/`SkillResolverError`/`ShadowRoutingError`
`'ROOT_NOT_ABSOLUTE'` (`dispatch/src/routing-eval`, `shadow`, `skill-resolver`), and
`spec-linter/src/cli.ts` `resolveRepoRoot` exit-2 refusal (landed 2026-09-26 by the preceding
survey agent; verified, not re-edited).

Gap sites found and closed (see "Files touched"):

- **integration/** — had ZERO absolute-root guards. Added `assertAbsoluteRoot` +
  `IntegrationError` code `'ROOT_NOT_ABSOLUTE'` (`src/errors.ts`) and guarded every exported
  root-consuming seam (`prepareClosure`, `executeClosure`, `retryHalfClosedClosure`,
  `loadChainTip`, `runStageE`, `runStageF`, `emitIntegrationReceipt`, `emitClosureReceipt`,
  `emitHalfClosedClosureReceipt`, `loadActiveSpecsLive`, `runReport`, `runDocSpineHook`,
  `fetchEffectiveRulesLive`, `planPrAutomation`). Out-of-root exposure is already refused by
  `assertValidSpecMovePath` (typed `SPEC_MOVE_INVALID`) and UUID validation (`receiptPath`).
- **shaping/src/read.ts** — `readShapingResult` refused a relative artifact path (typed; it
  silently anchored to the process cwd); `discoverShapingResults` gained the out-of-root
  `specsDir` refusal; `emitShapingResult` likewise (`src/emit.ts`).
- **registration/** — `detectRegistrationMode` (exported, unguarded) now refuses a relative
  `repoRoot` and an out-of-root `record.receipt.locator`; `register`/`preview` refuse an
  out-of-root `specsDir` and out-of-root `parcelSpecRefs` binding refs before any adapter call
  or write-back; the `git` seam refuses a relative cwd (`src/git.ts`, one guard in `git()`);
  `backfillTicketLine`/`restoreSnapshots` refuse non-absolute paths (typed). Shared
  `assertAbsoluteRoot` moved to `src/types.ts` next to the error class.
- **dispatch/** — `approval-cli` (`prepareDispatch`, `executeDispatch`), `kompress-adapter`
  (`kompressContext`), `query` (`queryAndRankCandidates`) now refuse relative roots typed and
  refuse out-of-root caller-supplied paths resolved against the root (see agent report in the
  goal log for the exact rule applied per site). `routing-eval`/`shadow`/`skill-resolver`
  guards verified only.
- **approval/ + projection/** — root seams already guarded everywhere; added out-of-root
  refusals where caller-supplied paths resolve against a root (`approvalRecordPath`,
  `rejectionRecordPath`, `writeReceiptDocument`, `resolveArtifact`'s `toAbs` results,
  `writeProjectedArtifact` specsDir). `projection/src/path-guard.ts` (`assertContainedPath`)
  is the reused containment authority and the d19-pinned `resolve()` site (untouched).
- **foreman-config/** — no root seams (explicit config path only); nothing to change.

d19 discipline: all new guards use `isAbsolute`/`join`/`relative` only — no `resolve()` on
root-named arguments (class 5), no `..` walks in src, no cwd/module-location derivation.

## Item 2 (D2/D3) — identity wiring: what shipped, what was completed

Already shipped (verified by citation, not redone):
- `foreman-config` owns the document shape/validation/capability vocabulary
  (`src/types.ts`, `src/schemas.ts`, `src/validate.ts`, `src/resolve.ts`).
- Spec-linter consumes it explicitly on `--config` (gate (c) citations above).
- **Dispatch consumes the identity type**: `dispatch/src/query/index.ts` —
  `DispatchIdentity = Pick<ForemanIdentity, 'project_key' | 'dispatch_queue'>`
  (imports `ForemanIdentity` from `foreman-config`), typed `DispatchIdentityUndeclared`
  refusal for `null` identity BEFORE any MCP client exists, and a non-KONE key proven to
  reach the JQL (`tests/query.test.ts`: `null project_key…`, `null dispatch_queue…`,
  `null-identity refusal is distinguishable from a legitimately empty candidate list`,
  `a non-KONE project_key reaches the search JQL (no fabricated KONE)`). No project/queue/
  operator/customer default is owned by the library.
- **Registration consumes/verifies the declared project key**: `register.ts`
  `resolveProjectKey(projectKey, foremanConfig)` — `foremanConfig.identity.project_key` is
  the identity source; a contradicting `projectKey` is refused; `project_key: null` refuses
  registration; neither source → typed refusal.

Completed in this pass: negative-control tests for the registration identity wiring
(`tests/project-key-plumbing.test.ts` D2 cases: config-declared key used when `projectKey` is
omitted; contradiction refusal; `null` refusal; `register()` refusing a contradiction before
any adapter call).

## Verification commands + outcomes

Runs performed once per touched package after edits settled (Node v24.7.0, package-local
`npm test` / `npm run typecheck` / `npm run lint`; no root-level commands).

| Package | `npm test` | `npm run typecheck` | `npm run lint` |
|---|---|---|---|
| spec-linter | 127 pass / 0 fail (incl. the new `boundary-routing D1: a relative --repo-root is refused with typed exit 2 (root-not-absolute)` case) | clean | clean (biome, 16 files, no fixes) |
| registration | 98 pass / 0 fail (incl. 7 new D1 cases in `tests/root-conflation.test.ts` + 4 D2 identity cases in `tests/project-key-plumbing.test.ts`) | clean | clean (biome, 41 files, no fixes) |
| shaping | 47 pass / 0 fail (incl. 3 new D1 cases) | clean | clean (biome, 21 files, zero diagnostics) |
| projection | 65 pass / 0 fail (incl. 1 new D1 case) | clean | exit 0; 2 PRE-EXISTING warnings in `tests/input-consumption.test.ts` (untouched by this pass): unused import `diffStatSinceMergeBase`, unused variable `repoRootOfMonorepo` |
| approval | 79 pass / 0 fail (incl. 6 new D1 cases; `frozen-surface` /\btask/i scan green) | clean | clean (biome, 34 files, zero diagnostics) |
| dispatch | 139 pass / 0 fail (incl. 13 new `tests/root-guards.test.ts` cases) | clean | clean (biome, 17 files, no fixes; 3 mechanical format fixes applied — 2 in the new test file, 1 pre-existing indent in `tests/routing-eval.test.ts`) |
| integration | 270 pass / 0 fail (incl. 18 new `tests/root-guards.test.ts` cases) | clean | clean (biome, 37 files, no fixes) |

## Files touched (this pass)

Owned, edited, or created by items 1–2 work on 2026-09-26 (all under `plugins/foreman-line/`):

- `docs/goals/foreman-line-boundary-routing/items-1-2-status-2026-09-26.md` (this record)
- `spec-linter/tests/cli.test.ts` (relative `--repo-root` negative control; `src/cli.ts` guard
  was landed by the preceding survey agent and is carried as-is)
- `shaping/src/errors.ts`, `shaping/src/read.ts`, `shaping/src/emit.ts`, `shaping/src/index.ts`,
  `shaping/tests/root-conflation.test.ts`
- `projection/src/write.ts`, `projection/tests/path-containment.test.ts`
- `approval/src/approval-record.ts`, `approval/src/rejection-record.ts`,
  `approval/src/receipt-writer.ts`, `approval/src/resolve-input.ts`,
  `approval/tests/root-conflation.test.ts`
- `registration/src/types.ts` (shared `assertAbsoluteRoot`), `registration/src/register.ts`,
  `registration/src/prior-registration.ts`, `registration/src/git.ts`,
  `registration/src/backfill.ts`, `registration/tests/root-conflation.test.ts`,
  `registration/tests/project-key-plumbing.test.ts`
- `dispatch/src/approval-cli/index.ts`, `dispatch/src/kompress-adapter/index.ts`,
  `dispatch/src/query/index.ts`, `dispatch/tests/root-guards.test.ts` (dispatch slice report:
  see goal log)
- `integration/src/errors.ts`, `integration/src/closure.ts`, `integration/src/exit-vehicle.ts`,
  `integration/src/receipt.ts`, `integration/src/closure-receipt.ts`,
  `integration/src/governing-spec.ts`, `integration/src/report.ts`,
  `integration/src/docspine-hook.ts`, `integration/src/branch-protection.ts`,
  `integration/src/pr-plan.ts`, `integration/tests/root-guards.test.ts`,
  `integration/tests/closure.test.ts` (12 fixture roots made absolute — legitimate test
  update so pre-existing cases exercise the guards with absolute roots)

## d19 audit (verification package)

The audit was RED at session start for a pre-existing, unrelated reason (the JEV-P3
`jev-decisions/container/Dockerfile` unregistered-extension refusal); the coordinator owns
that fix in `verification/src/d19-audit.ts` and this pass was instructed not to edit
`verification/` or `mutation-scope-guard/`. Judgment basis (coordinator 2026-09-26):
(a) touched packages' test/typecheck/lint green, (b) the audit reports no NEW violation
attributable to these edits (run with an absolute `--plugin-root`).

Evidence:
- `verification` package suite: `npm test` 153 pass / 0 fail, `npm run typecheck` clean,
  `npm run lint` clean (run after all edits landed).
- d19 CLI run (absolute plugin root, `npx tsx src/d19-audit.ts --plugin-root
  D:/Repos/agent-skills/plugins/foreman-line`): exits 2 at discovery with the exact line:
  `d19-audit: package 'ops-console' exists on disk under the plugin root but is NOT in the
  ratified allowlist (A2.2) — it would otherwise be silently unswept; ratify it (coordinator
  amendment) or remove it`
- The two outstanding audit refusals are coordinator-owned and outside this slice
  (coordinator statement 2026-09-26): (1) the `jev-decisions/container/Dockerfile` extension
  registration — already fixed by the coordinator in `verification/src/d19-audit.ts`;
  (2) the `ops-console` allowlist ratification — pending; `ops-console/` is mid-build by
  another workstream and the coordinator ratifies it in `RATIFIED_PACKAGES` once it lands.
  The audit rerun + violation comparison is deferred to the coordinator per their direction.
- Negative duty on the new code: all new guards use `isAbsolute`/`join`/`relative` only —
  zero `resolve()` calls on root-named arguments (class 5), no `..` walks, no
  `process.cwd()`/module-location derivation in any edited src file (spot-checked per file);
  `projection/src/path-guard.ts` (the pinned `resolve()` site) is untouched.

## Forbidden surfaces

`routing-policy/`, `templates/`, `contracts/`, `docs/goals/pi-model-configuration/`,
`docs/goals/routing-currency-and-merit-jev-alpha/`, `jev-decisions/`, `verification/`,
`mutation-scope-guard/` — none opened or edited by this pass. A shared-tree `git status` on
those directories shows dirty entries owned by concurrent workstreams (pi-model-configuration
and JEV goal docs, `routing-policy/` + `templates/` edits, `contracts/` edits, the
coordinator's own `verification/src/d19-audit.ts` fix) — in a shared dirty tree the status
cannot attribute authors, so the ownership evidence is this pass's complete file list
(above), which intersects none of those paths.

## What items 3–7 still need

- **Item 3** (`role-authority`, `worker-envelopes`, `contract-readers`): ship the three
  packages incl. generated-schema parity and full-population contract tests. Design input is
  `hawf-extract-worker-lane-contracts.md` in this directory (extracted HAWF features: role
  separation baseline D2; role/authority + task/result contracts = HAWF WF-P2; carry-over
  D4 registry-driven model facts, D5 secrets-by-name-only, D7 shared serialization points
  sequenced not co-owned, D8 human gates in force). It grants no authority — the claiming
  coordinator reconciles the WF graph at shaping.
- **Item 4** (`mutation-scope-guard`): invoke at dispatch preflight (spec `surfaces:` check
  before worktree creation) and post-hoc (adapter-reported changed paths before the Stage-C
  receipt); missing changed-path evidence is a refusal (charter D5).
- **Item 5** (hooks + templates): ship hooks as thin host adapters and client-neutral
  scaffolding incl. the `foreman/config.yaml` template; no second policy source (D6).
- **Item 6** (Fireworks removal): repository-wide removal of route code, provider refs,
  credentials, fixtures, stale active docs; keep the historical-record labelling rule.
- **Item 7** (gates): package, integration, parity, negative-control, and installation gates
  across the whole charter — including the gates not covered by items 1–2 (envelope/schema
  parity negatives, dispatch scope-envelope refusals, hooks/templates presence, Fireworks
  sweep, client installation versions, Pi/Jev capability tests).
