# Items 7 status — gates — 2026-09-27

**Goal:** `foreman-line-boundary-routing` · **Scope:** charter work item 7 (acceptance and
release gates) + the `contract-readers` Contract-B touch-set adjudication, run against the
settled tree after items 1–6.
**Authority:** coordinator dispatch 2026-09-27 (final dispatch of the coordination loop).

Items 1–6 status records are the cited evidence base for gates those items closed; this
record re-verifies them on the settled tree and closes the rest. Node v24.7.0, Windows.

---

## 0. Touch-set adjudication (the one red suite before this run)

`contract-readers/tests/touch-set.test.ts` entered this run at 27/28 (suite 73/74): the
Contract B adjudication deepEqual (`A2(b)(2)/(4)`) failed over ten surfaced-but-undeclared
`src/` files. Contract A was already green and untouched by this run.

The canary distinguishes three dispositions per surfaced file: **declare as reader**
(LOCKSTEP: must change when one member is ADDED to the contract's set), **adjudicate
home-package** (the contract's own package DEFINES the vocabulary), or **adjudicate
false-positive** (LOCKSTEP-negative, with the reason recorded in the ruling table). The
re-derived hit list (from the failing run itself, not the dispatch prose) and dispositions:

| File (surfaced for Contract B) | Disposition | Reason |
|---|---|---|
| `routing-policy/src/pi-resolver.ts` | home-package (definer) | routing-policy owns the `classes`-key vocabulary; its own `routing_class` field threading is the definer using its own field. A2(b)(3) ruling, which covered only the value signal until now. |
| `routing-policy/src/route-receipt.ts` | home-package (definer) | same; `readonly routing_class: string` in the home package's own receipt type (`:105`). |
| `routing-policy/src/schemas.ts` | home-package (definer) | restates the enum (`:553`, `:594`) — would be LOCKSTEP in any other package; home ruling takes precedence (typed instantiation of `routing-policy.yaml`, not a consumer of another package's vocabulary). Recorded explicitly in the ruling table. |
| `routing-policy/src/testing.ts` | home-package (definer) | fixture data in the home package (`:95`, `:157`, `:170-173`); also LOCKSTEP-negative as sample data. |
| `routing-policy/src/types.ts` | home-package (definer) | defines `CLASS_NAMES`/`ClassName` (`:15-19`) — the vocabulary's typed source. |
| `routing-policy/src/validator.ts` | home-package (definer) | `rawEntry.routing_class` (`:593`) inside the home package's own validator. |
| `ops-console/src/frontmatter.ts` | false positive, UNDECLARED | `routing_class:` appears only in a doc comment (`:4`); the parser is a generic flat `key: value` reader. ADD a class → unchanged (comment-only basis, same as `skill-injection/src/cli.ts`). |
| `ops-console/src/project.ts` | false positive, UNDECLARED | reads `raw.routing_class` out of a routing-decision receipt as an opaque string (`:53`), zero vocabulary references. ADD a class → unchanged (opaque-threading basis, same as `dispatch/src/approval-cli/index.ts`). |
| `ops-console/src/scan.ts` | false positive, UNDECLARED | `data.routing_class ?? null` (`:64`) threads the parsed value opaquely into `SpecFact`. ADD a class → unchanged. |
| `project-scaffold/src/equivalent-layout.ts` | false positive, UNDECLARED | `typeof record.routing_class === 'string'` (`:32`) is a key-presence probe in the §4 core-key-set shape predicate; never tests vocabulary membership. ADD a class → unchanged. |

**Encoding (inside `contract-readers/`, the canary's own mechanism only):**

1. **Home ruling extended to the field-name signal** (`tests/touch-set.test.ts`): the A2(b)(3)
   ruling ("routing-policy/src/* DEFINES this vocabulary; excluded with the ruling stated
   explicitly, not silently dropped") was wired only into the vocabulary-values signal; the
   field-name signal now applies the same `excludeHomePackage`, and every home hit from BOTH
   signals is recorded in `contractBHomePackageHits`. The A2(b)(3) test was strengthened, not
   relaxed: it now also asserts (a) at least one home hit comes from the field-name signal and
   (b) neither retained signal smuggles a home file through to adjudication.
2. **Four false positives added to the Contract B ruling table** with per-file reasons and to
   `expectedUndeclared` (surfaced-but-undeclared, adjudicated).

**Canary intact — proof:**

- All 28 touch-set tests green after adjudication (74/74 suite, 0 fail).
- **Mutation spot-check:** removing the `spec-linter/src/types.ts` declaration from
  `contractB.readers` (temporarily) made exactly the adjudication test fail — 27 pass / 1 fail,
  `A2(b)(2)/(4)` naming `spec-linter/src/types.ts` as surfaced-but-undeclared. Declaration
  restored immediately; suite re-run 74/74. The built-in `A4(c) MUTATION` proof (spurious
  out-of-scope reader fails the `outOfScopeRuled` deepEqual) also passes. No test was deleted
  or weakened; the positive controls (known-declared reader must be found by each signal) are
  unchanged and green.

No production code was changed for the adjudication: all ten hits resolved through the test's
existing ruling mechanisms. **Zero defect fixes in owning packages this run.**

---

## 1. Per-gate verdicts (charter "Acceptance and release gates", all nine bullets)

| # | Charter gate | Verdict | Evidence |
|---|---|---|---|
| a | Clean-room caller passes absolute `repoRoot`/`pluginRoot`; relative roots get typed refusals | **PASS** | `dispatch/tests/root-guards.test.ts` (8 named typed `ROOT_NOT_ABSOLUTE` refusals incl. "before any fs work" / "before the worktree call" ordering pins), `integration/tests/root-guards.test.ts` (D19 family ×14), `ops-console/tests/root-refusal.test.ts` (×4, incl. exit-2 CLI path), `project-scaffold/tests/cli.test.ts` (relative `--target`/`--templates` refused, exit 2), `projection/tests/root-conflation.test.ts`, `shaping/tests/root-conflation.test.ts`, `spec-linter/tests/cli.test.ts` ("boundary-routing D1: a relative --repo-root is refused with typed exit 2"), `approval/tests/root-conflation.test.ts`, `registration/tests/root-conflation.test.ts`. All green in the full sweep (§3). items-1-2 record gate (a) is the change log. |
| b | No shipped customer-specific project/assignee/root fallback; identity from caller/config | **PASS** (with recorded non-identity customer data) | items-1-2 record gate (b) sweep re-verified on the settled tree: identity refusals are typed (`registration/tests/project-key-plumbing.test.ts` — "D2: preview() takes the project key from foreman/config.yaml identity when projectKey is omitted", "…a projectKey that contradicts foreman/config.yaml identity is a typed refusal", "identity.project_key: null refuses registration"; `dispatch/src/query/index.ts` `DispatchIdentityUndeclared`). Recorded non-identity data unchanged: `registration/config/project-allowlist.json` `["KONE"]` is a committed REFUSAL allowlist (gate input, never identity), `SITE_URL` is the pinned live Jira host at the adapter boundary, testing samples are fixture data. |
| c | Linting rejects malformed `foreman/config.yaml`; capability vocabulary only through `foreman-config` | **PASS** (cited, re-run green) | `spec-linter/tests/cli.test.ts` ("P1a: --config with an INVALID config document -> exit 2, foreman-config violations shown", "…a missing config file -> exit 2"); config shape owned by `foreman-config` (`tests/schema-validation.test.ts`, `tests/parity.test.ts`); capability vocabulary via validated config only (`semantic-invariants.test.ts` P1a AC4 cases). foreman-config 62/0, spec-linter 137/0 in the sweep. |
| d | Role, envelope, config, reader, mutation schemas pass generated parity; negative fixtures prove unknown keys, missing required fields, malformed paths refuse | **PASS** | Parity: `registerNoDriftTests` (committed JSON byte-identical to `serialize(schema)`) for role (`role-authority/tests/parity.test.ts`, 8 schemas + "exactly 8" pin + AC2 full-population round-trip 8/8), envelope (`worker-envelopes/tests/parity.test.ts`, task+result + "exactly two" pin), config (`foreman-config/tests/parity.test.ts`, 6 schemas + sample validation + export-completeness pin), reader (`contract-readers/tests/parity.test.ts`, 1 schema + canonical sample + "exactly one" pin). Mutation: `mutation-scope-guard` ships **no** generated schema by design — its shape is `Pick<TaskEnvelope, 'allowedFiles' \| 'forbiddenSurfaces'>`, schema-pinned inside the task envelope's no-drift test (items-3-4 record gate (d) table). routing-policy's **11** schemas: `routing-policy/tests/parity.test.ts` (`registerNoDriftTests` + `registerSampleValidationTests` + "every exported routing-policy type has a committed schema file" asserting 11). Negatives: unknown keys — `role-authority/tests/negative-fixtures.test.ts` ("unknown keys refuse: …" ×6 object schemas), `worker-envelopes/tests/unknown-keys.test.ts` (×7 strict containers, each with a positive control), `foreman-config/tests/schema-validation.test.ts` ("rejects an unknown top-level key, naming it", "rejects an unknown key inside a group, naming it"), `contract-readers/tests/schema-validation.test.ts` (reject-* fixtures incl. unknown-field and 20 malformed-path fixtures: trailing slash/backslash, glob, dot-segment, absolute/UNC/drive, whitespace/zwsp/bidi/DEL/C1 padding…). Missing fields — `role-authority/tests/negative-fixtures.test.ts` ("missing required fields refuse: …" derived live from `schema.required`), `worker-envelopes/tests/required-fields-exhaustive.test.ts` + `required-empty.test.ts`, `receipts/tests/schema-validation.test.ts` ("rejects a missing required field"), `foreman-config/tests/schema-validation.test.ts` (omitted `stack:`/`project_key`/`dispatch_queue`/root array). Malformed paths — the contract-readers reject fixtures above + `mutation-scope-guard/tests/guard.test.ts` ("AC2b: preflightCheck also rejects a malformed allowedFiles entry before any matching", `MALFORMED_PATH` denormalized-spelling family). All green in the sweep. |
| e | Dispatch with a scope envelope refuses an unauthorized surface before worktree creation; refuses missing/out-of-scope post-hoc evidence before receipt emission | **PASS** | `dispatch/tests/mutation-scope.test.ts`: "D5 preflight refusal (unauthorized surface): … MUTATION_SCOPE_FAILED before any worktree creation" (asserts the worktree adapter never ran), "D5 preflight refusal (malformed path): … MALFORMED_PATH before any worktree creation", "D5 post-hoc refusal (missing changed-path evidence): … a refusal before the Stage-C receipt is written", "D5 post-hoc refusal (out-of-scope evidence): …", "D5 post-hoc refusal (forbidden wins): …", plus the positive control "D5 positive: an authorized envelope with in-scope changed paths completes and writes the Stage-C receipt". dispatch 145/0. Invocation seams (`preflightCheck` before dispatch, `postHocCheck` before Stage-C) per items-3-4 record item 4. |
| f | Hooks and templates present, documented, no second policy source | **PASS** (items-5-6 gate (f), re-verified) | `hooks/` 5 files (`hooks.json` SessionStart+PreToolUse → `${CLAUDE_PLUGIN_ROOT}/hooks/model-gate.mjs`, `model-gate.policy.json`, `model-gate.test.mjs` — 13/0 via `node --test`), `templates/` 13 top-level + `kickstarters/` 3, both client manifests. `hooks/README.md` D6 thinness section; hook roster is session-grade membership data — per-role dispatch binding remains `routing-policy/routing-policy.yaml` (single policy source). |
| g | Repository-wide active-code sweep: zero Fireworks references/aliases/credentials/lane routes; retained history labelled retired | **PASS** (items-5-6 command set, re-run today) | `git grep -in --untracked "fireworks" -- "plugins/foreman-line" ":(exclude)plugins/foreman-line/docs/goals" ":(exclude)plugins/foreman-line/CHANGELOG.md"` → **0 hits** on 2026-09-27 (this run). Items-5-6 record commands A–E enumerate every remaining hit and its RETIRED label (CHANGELOG mandate line, charter mandate prose, frozen work records, `historical-charter-source.md` copies, sync mirrors) + the one non-provider false positive (`morning/SKILL.md` drawing motif). No hidden fallback: `fallbackModels` (opaque registry keys, D4) and the PMC/RCM fallback contract carry no Fireworks entry. |
| h | All eligible client installations report the new plugin/skill version; unsupported clients recorded as not applicable | **PASS** (see §2 for the version-reporting interpretation and the honest gap) | Both client manifests and all version-bearing surfaces report **0.6.10** (table in §2), including a live client install record. |
| i | Pi/OpenRouter template + routing-policy capability tests prove exact Jev ID, base URL, enabled-list membership, schema parity, refusal of prose/implementation/control-plane use | **PASS** (with the ratified M2 retirement recorded below) | See §4 (Pi/Jev capability evidence). |

**Gate families named in the dispatch, mapped:** package gate → §3 sweep table;
integration gate → §5; parity gate → row d; negative-control gate → rows a/b/d/e + §4
(families of refusals enumerated with test names); installation gate → §2.

---

## 2. Installation gate — what "reporting the version" means per repo evidence

The repo's version-reporting surfaces, all read 2026-09-27:

| Surface | Client | Reported version | Status |
|---|---|---|---|
| `plugins/foreman-line/.claude-plugin/plugin.json` | Claude Code (eligible) | `0.6.10` | reports |
| `plugins/foreman-line/.codex-plugin/plugin.json` | Codex (eligible) | `0.6.10` | reports |
| `.claude-plugin/marketplace.json` → `foreman-line` entry (`source: ./plugins/foreman-line`) | marketplace distribution | `0.6.10` | reports |
| `plugins/installed_plugins.json` → `foreman-line@m0r6an-agent-skills` | live Claude Code install record | `0.6.10` (installPath `…\foreman-line\0.6.10`, installed 2026-09-19) | **an eligible client installation reports the new version** |
| `plugins/foreman-line/CHANGELOG.md` | — | `0.6.10 — 2026-09-19` heading | reports |
| `plugins/foreman-line/skills/*/SKILL.md` | skill files | **not applicable** — SKILL.md frontmatter carries `name`/`description` only; no version field exists in the repo's skill-file convention, so the plugin manifest version is the reported skill-bundle version | recorded N/A, not silently skipped |
| Pi harness | not a plugin-hosting client | **not applicable** — consumes `templates/pi-openrouter-routing.json` + `templates/pi-routing-directive.md` (no credentials, no manifest convention for a Pi "plugin") | recorded N/A |
| Any other plugin host | no manifest convention exists in this repo | **not applicable** | recorded N/A |

Verdict: **PASS.** Both eligible clients (Claude Code, Codex) report `0.6.10` at every
surface that carries a version, the two manifests agree with each other and with the
marketplace entry and the CHANGELOG heading, and one live client installation record proves
the reporting end-to-end. Unsupported clients/surfaces are recorded N/A above rather than
skipped. Honest gap: no test pins this cross-surface version agreement (grep for
version-sync tests over `plugin.json`/marketplace hits none) — see remaining gaps.

---

## 3. Full sweep — the authoritative final table (2026-09-27, Node v24.7.0)

Every package's `npm test` + `npm run typecheck` + `npm run lint` (biome):

| Package | tests | pass | fail | typecheck | lint |
|---|---|---|---|---|---|
| approval | 79 | 79 | 0 | OK | OK |
| contract-readers | 74 | 74 | 0 | OK | OK |
| contracts | 72 | 72 | 0 | OK | OK |
| dispatch | 145 | 145 | 0 | OK | OK |
| foreman-config | 62 | 62 | 0 | OK | OK |
| integration | 270 | 270 | 0 | OK | OK |
| jev-decisions | 44 | 44 | 0 | OK | OK |
| mutation-scope-guard | 44 | 44 | 0 | OK | OK |
| ops-console | 78 | 78 | 0 | OK | OK |
| permission-profiles | 70 | 70 | 0 | OK | OK |
| project-scaffold | 41 | 41 | 0 | OK | OK |
| projection | 65 | 65 | 0 | OK | OK |
| receipts | 80 | 80 | 0 | OK | OK |
| registration | 98 | 98 | 0 | OK | OK |
| role-authority | 64 | 64 | 0 | OK | OK |
| routing-policy | 206 | 206 | 0 | OK | OK |
| schema-scaffold | 15 | 15 | 0 | OK | OK |
| shaping | 47 | 47 | 0 | OK | OK |
| skill-injection | 41 | 41 | 0 | OK | OK |
| spec-linter | 137 | 137 | 0 | OK | OK |
| verification | 153 | 153 | 0 | OK | OK |
| worker-envelopes | 112 | 112 | 0 | OK | OK |
| **Total (22 packages)** | **1997** | **1997** | **0** | **22/22** | **22/22** |

Plus `hooks/model-gate.test.mjs` (`node --test`): 13/0 — 2010 assertions-level tests green
package-wide. One caveat, disclosed: `contract-readers` lint initially failed on this run's
own two edited hunks (biome format); fixed by matching the formatter's output in the same
edit, re-run clean ("Checked 11 files, no fixes applied"). No pre-existing lint defect.

**D19 audit** (`npx tsx verification/src/d19-audit.ts --plugin-root "D:\Repos\agent-skills\plugins\foreman-line"`):
**RESULT: PASS** (2026-09-27) — pin cardinality reconciled (E1: 0/0; E2-dynamic: 1/1; E4: 28/28),
registry-data class-3 DATA ruling intact (8 values, SHA-256 match `2a40a5f4…87ed3`).

---

## 4. Pi/Jev capability gate (charter row i) — evidence

| Charter clause | Verdict | Evidence |
|---|---|---|
| exact Jev ID | PASS | `typesafe/jev-1.13` pinned by charter D10, `templates/pi-routing-directive.md:9`, the fixed negative fixture `routing-policy/tests/pi-openrouter.test.ts:56-58`, and `routing-policy/src/host-settings-proposal.ts:115` (`M2_STRUCK_ID = 'openrouter:typesafe/jev-1.13'`). |
| base URL | PASS | `routing-policy/tests/semantic-invariants.test.ts` "Pi/OpenRouter config uses the verified base URL and nonempty live model ids" asserts `PI_OPENROUTER_ROUTING.baseUrl === 'https://openrouter.ai/api/v1'`; the shipped template carries the same literal (`templates/pi-openrouter-routing.json:4`). |
| enabled-list membership | PASS (invariant-pinned) | `semantic-invariants.test.ts` "Pi/OpenRouter enabled models and capability entries are one-to-one" (`enabledModels` deep-equals `models` keys); `pi-openrouter.test.ts` "Pi/OpenRouter template matches the typed routing registry" (template deep-equals `PI_OPENROUTER_ROUTING` minus `$schema`). **Ratified nuance:** the live registry currently contains **no** Jev entry — M2 struck `openrouter:typesafe/jev-1.13` with provenance ("enabled in Pi settings but absent from the catalogue → missing-model refusal"), tested by `host-settings-proposal.test.ts` "M2: the struck Jev entry is removed with M2 provenance, never silently substituted" and `fallback-contract.test.ts` "M2 reconciliation: the policy file and its fixtures encode no typesafe/jev identity". Membership is therefore machine-checked as an invariant over whatever is enabled, and the removal itself is tested — retirement does not silently drop the boundary. |
| schema parity | PASS | `routing-policy/tests/parity.test.ts` `registerNoDriftTests` (11 schemas incl. `pi-openrouter-routing.schema.json`) + `registerSampleValidationTests`; `pi-openrouter.test.ts` "Pi/OpenRouter template is schema-valid and contains no credential fields" and "…passes cross-field capability validation". |
| refusal of prose/implementation/control-plane use | PASS | `pi-openrouter.test.ts` "Jev capability contract rejects control-plane or prose/implementation use" — flipping the fixture to `authority: 'execution'`, `allowedLanes: ['implementation']`, `prohibitedLanes: ['approval']` makes `validatePiOpenRouterRouting` fail with errors naming `recommend-only`, `routing/classification only`, and `prohibit 'merge'` (the fixture pins the boundary even with the live model retired — the test comment states exactly that). `semantic-invariants.test.ts` "Jev is limited to fast structured routing/classification recommendations" (capabilities exactly `[routing, classification, structured-decision]`, `allowedLanes [routing, classification]`, `authority: 'recommend-only'`, prohibits prose-generation/implementation/approval/merge/policy-bypass). |
| HRO-P1 adapter refusals (dispatch-named) | PASS | `pi-openrouter.test.ts`: "HRO-P1 demo (b): an unknown model ID is rejected typed unavailable, never a guessed identity", "HRO-P1 demo (c): a known model with an incompatible protocol mapping is rejected typed unsupported", "HRO-P1 typed rejections carry distinct reasons and no incomplete mapping resolves", "HRO-P1 adapter refusal vocabulary stays distinct from the other vocabularies", plus demo (a) the supported-route positive control. routing-policy 206/0. |
| PMC L6 refusal (dispatch-named) | PASS | `fallback-contract.test.ts`: "frozen map: L6 is refused/disabled with the rubric re-enablement list and no route" (status `disabled-refused`, `provider_rule {kind: 'none', refusal: 'LANE_DISABLED_REFUSED'}`, no L6 lane_route), "refuses any route on the disabled L6 lane (LANE_DISABLED_REFUSED)", "refuses un-disabling L6 through a policy edit (LANE_DISABLED_REFUSED)". |

---

## 5. Integration gate

**PASS.** `integration` 270/0 (the dispatch baseline, unchanged on the settled tree),
including the D19 root-guard family, `closure.test.ts`/`closure-receipt.test.ts`/
`receipt.test.ts`/`audit-trigger-chain.test.ts` seam tests and `fl-r2-real-loader.test.ts`
("AC-3: malformed disk input remains report-only and cannot inject annotation lines").
**Receipt-chain validations** live in `receipts` 80/0: `chain-invariants.test.ts` — "accepts
the valid sealed chain fixture", "AC5a: rejects a chain with a sequence gap", "AC5b: rejects
a chain with a prevHash pointer mismatch", "AC5c: rejects a chain with a correlation
mismatch", "AC5d: … scalar-JSON / null-correlation members … no spurious chain violations",
"AC6: isSealed is true for a valid terminal stage-F ClosureRecord", "FL-R1 AC-1/2/3: …"
(empty chain unsealed; structurally valid members unsealed; malformed members cannot be
sealed by F) — all green in the sweep.

---

## 6. Defect fixes in owning packages

**None.** The ten Contract-B hits all resolved through the touch-set test's existing ruling
mechanisms (home-package exclusion + ruling table); no production code defect surfaced in
any gate. Files changed this run, both inside the enumerated write set:

- `contract-readers/tests/touch-set.test.ts` — adjudication encoding (§0) + formatter
  alignment on the two edited hunks.
- `contract-readers/src/registry-data.ts` — touched only by the temporary mutation
  spot-check (declaration removed and restored byte-for-byte; final suite 74/74 proves
  restoration).
- `docs/goals/foreman-line-boundary-routing/items-7-gates-2026-09-27.md` — this record.

---

## 7. Remaining gaps (goal-level items, honestly recorded)

1. **Live Jev smoke receipt needs credentials.** `plugins/foreman-line/tests/jev-smoke-test.mjs`
   exits 2 without `OPENROUTER_API_KEY` and exercises the OpenRouter `…/api/alpha/decisions`
   endpoint with `~typesafe/jev-latest` — the JEV-alpha decisions surface (approved by
   `routing-currency-and-merit-jev-alpha` J2), **not** D10's structured-decision candidate
   (`typesafe/jev-1.13` at `…/api/v1`, covered offline by the §4 tests). A live smoke receipt
   for either surface is a goal-level item requiring an operator credential; not gateable
   offline and not claimed here.
2. **Version agreement is inspection-proven, not test-pinned.** The §2 surfaces all read
   `0.6.10` today, but no test asserts `.claude-plugin/plugin.json` == `.codex-plugin/plugin.json`
   == marketplace entry == CHANGELOG heading. A parity pin would close this permanently.
3. **`docs/goals/INDEX.md:23` status row is stale** ("items 5–7 … queued") — recorded RETIRED
   in the items-5-6 label table; the row is owned by the index owner, outside this write set.
4. **`project-scaffold/src/manifest.ts` seam (items-5-6 gap 5.2):** scaffolding
   `templates/role-envelope-scaffolding.md` into target repos needs a scaffolder-owned
   `CopyEntry`; recorded, not edited (scaffolder-owned).
5. **PMC-P3 canon rework** (human-facing kickstarter/session wording) untouched deliberately —
   the future human-facing canon pass remains the single writer.
6. **A5(c) open question unchanged:** the field-level lockstep reading (grandfather.ts:36
   class of files) remains explicitly unadopted; the member-level additive test governs. The
   four new false-positive rulings follow the adopted reading and note where the open
   reading would differ.

## 8. Blockers

None. All five gate families plus all nine charter acceptance bullets carry PASS verdicts
with cited evidence; the full sweep is 1997/0 across 22 packages (+13/0 hooks) with
typecheck and lint green and the D19 audit PASS.
