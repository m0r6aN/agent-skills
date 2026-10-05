# Items 3–4 status — 2026-09-26

**Goal:** `foreman-line-boundary-routing` · **Scope:** charter work items 3–4 (locked decisions
D4, D5) and the acceptance gates that cover them.
**Authority:** coordinator decision 2026-09-26 under owner blanket authority.

Items 1–2 are recorded in `items-1-2-status-2026-09-26.md`. Items 5–7 are untouched and
deferred (exact reasons at the bottom). This pass edits **tests/fixtures only** — no shipped
source file was modified in any package.

## Item 3 (D4) — role/envelope/reader contracts: assessment + gaps closed

**Assessment.** The three packages (`role-authority`, `worker-envelopes`, `contract-readers`)
already ship with green suites and generated-schema parity: each package generates its
committed `schemas/*.schema.json` from its typed source via `schema-scaffold`'s
`generate.ts`, and each proves no-drift with `registerNoDriftTests` (committed JSON is
byte-identical to `serialize(schema)`). The gate demanded three negative-fixture families —
unknown keys, missing required fields, malformed paths — and the audit of what shipped found
exactly two real gaps (unknown-key strictness for role + envelope, nested/required-key
completeness for reader) plus one D4 full-population gap (reader `description` field). Only
those were added; everything else is cited, not redone.

### Gate (d) — "Role, envelope, config, reader, and mutation schemas pass generated parity
tests; negative fixtures prove unknown keys, missing required fields, and malformed paths
refuse"

**Status: PASS.** Per schema family:

| Family | Generated parity (no-drift) | Unknown keys refuse | Missing required fields refuse | Malformed paths refuse |
|---|---|---|---|---|
| role (`role-authority`, 8 schemas) | `tests/parity.test.ts` `registerNoDriftTests` (8 no-drift tests) + AC2 full-population round-trip 8/8 | **NEW** `tests/negative-fixtures.test.ts` — all 6 object-typed schemas reject an unknown key (`additionalProperties: false`); the 2 primitive enum schemas carry value-vocabulary negatives in `parity.test.ts` ("role identity: unknown role rejected", "risk class: sample validates, unknown rejected", "role category: D16 mutual exclusivity") | **NEW** `tests/negative-fixtures.test.ts` — every field of every `required` array rejected when absent (derived live from `schema.required`, same derivation pattern as `worker-envelopes/tests/required-fields-exhaustive.test.ts`) | n/a at the role schema layer by design: the only path-typed field (`serialization-point-ownership.path`) is an opaque non-empty string. Malformed-path refusal is owned by the reader schema (below) and the mutation guard (below) — both cited with fixtures |
| envelope (`worker-envelopes`, task + result) | `tests/parity.test.ts` `registerNoDriftTests` (task, result) | **NEW** `tests/unknown-keys.test.ts` — one negative per strict container (7): TaskEnvelope, ResultEnvelope, Budget, Routing, RequirementsOutcome, TestOutcomes, UsageMetadata; each case carries a positive control so a broken fixture cannot make a negative vacuous | `tests/required-fields-exhaustive.test.ts` (derived from every `required` array, with membership pins) + `tests/required-empty.test.ts` — cited, not redone | `allowedFiles`/`forbiddenSurfaces`/`changedSurfaces` members are opaque non-empty strings at the serialization layer; well-formedness refuses at the enforcement boundary — mutation-scope-guard `MALFORMED_PATH` (`guard.test.ts` AC2b/AC2c: dot-segment, empty segment, backslash, off-vocabulary globs, trailing slash) and through the dispatch seam (`dispatch/tests/mutation-scope.test.ts`, "D5 preflight refusal (malformed path)") |
| config (`foreman-config`, 6 schemas) | `tests/parity.test.ts` (cited; items-1-2 record gate (c)) | `tests/schema-validation.test.ts`: "rejects an unknown top-level key, naming it", "rejects an unknown key inside a group, naming it" (cited) | `tests/schema-validation.test.ts`: "rejects a document with the stack: block omitted", "rejects a document omitting the project_key key", "…the dispatch_queue key", "rejects a layout with a required root array missing" (cited) | root/absolute-path refusal is gate (a), items-1-2 record (cited) |
| reader (`contract-readers`, 1 schema) | `tests/parity.test.ts` `registerNoDriftTests` + canonical sample | existing "an unknown top-level field is rejected (strict, additionalProperties: false)" + **NEW** "an unknown field inside a parcel-object reader is rejected" | existing ("an empty readers array is rejected (minItems: 1)", "a parcel-object reader missing files is rejected", "…empty files array…") + **NEW** ("a missing contract field is rejected (required)", "a missing readers field is rejected (required)", "a parcel-object reader missing parcelId is rejected") | `tests/schema-validation.test.ts` + `tests/fixtures/reject-*.json` — 24 malformed-path fixtures (trailing separators, glob metacharacters, `.`/`..` segments, absolute/UNC/drive-letter forms, whitespace/control/Unicode-format padding, bidi/DEL/C1/ZWSP) with 12 `valid-*` acceptance controls — cited, not redone |
| mutation (`mutation-scope-guard`) | Ships **no generated JSON schema**: its accepted shape is `ScopeEnvelope = Pick<TaskEnvelope, 'allowedFiles' \| 'forbiddenSurfaces'>`, i.e. schema-pinned inside the envelope family's task schema (no-drift above). Invoked, never modified by this pass (shipped package) | n/a (no object schema; the envelope's own unknown-key strictness above covers the field shape) | n/a (`allowedFiles`/`forbiddenSurfaces` are required task-envelope fields; absence rejection covered under envelope) | shipped `tests/guard.test.ts` + `tests/match.test.ts`: `MALFORMED_PATH` for denormalized spellings (`pkg/./secret.ts`, `pkg//secret.ts`, `pkg/../pkg/secret.ts`, `pkg\secret.ts`, trailing-slash) and off-vocabulary globs; `SCOPE_ENVELOPE_MISMATCH`, `SCOPE_ENVELOPE_CONTRADICTION`, `OUT_OF_SCOPE`, forbidden-wins precedence — cited, and re-proven through the dispatch seam by item 4's tests |

**D4 full-population fixtures (parity requirement):** role — AC2 round-trip 8/8
(`tests/parity.test.ts`); envelope — `fullTaskEnvelope`/`fullResultEnvelope` populate every
field including optionals (`tests/full-population.test.ts`, plus the new positive controls);
reader — **NEW** `tests/fixtures/valid-full-population-reader.json` (every field incl. the
optional `description`, both reader shapes) with its acceptance test.

## Item 4 (D5) — mutation-scope-guard invocation at the dispatch seams

**Status: PASS — wiring verified already shipped at HEAD; the gap was proof, now closed.**
`dispatch/src/approval-cli/index.ts` imports the SHIPPED `mutation-scope-guard` (relative
import per WF-P27 Step 0) and invokes it at both mandated checkpoints. This pass verified
each seam and added the missing refusal tests; no dispatch source edit was needed:

- **Preflight, "against spec `surfaces:` before dispatch":** `prepareDispatch` (phase 1)
  calls `preflightCheck(mutationScope, specFrontmatter.surfaces)` immediately after
  frontmatter parsing (index.ts:312-321), i.e. before any external effect and strictly
  before phase 2 (`executeDispatch`) creates the worktree. A refusal surfaces as
  `DispatchError('MUTATION_SCOPE_FAILED')` naming the offending entry.
- **Post-hoc, "against adapter-reported changed paths before the Stage-C receipt":**
  `executeDispatch` calls the worktree adapter first (lesson #18), then
  `postHocCheck(pkg.mutationScope, worktreeResult.changedPaths)` (index.ts:514-528) BEFORE
  the Stage-C receipt assembly/write (index.ts:531-580).
- **"Missing changed-path evidence is a refusal":** `worktreeResult.changedPaths ===
  undefined` throws `MUTATION_SCOPE_FAILED` ("requires the worktree adapter to report
  changedPaths") before the receipt (index.ts:515-520).
- Seams audited: `approval-cli` is the only dispatch module that creates worktrees and the
  only one that writes a Stage-C receipt (`writeReceiptDocument`/`receiptPath` occur there
  alone; `kompress-adapter` writes only its own kompress receipt and `routing-eval/shadow.ts`
  only shadow-evaluation receipts — neither is a Stage-C dispatch receipt nor a worktree
  seam). The two-phase API's phase 1 always precedes phase 2, so "refused before worktree
  creation" holds for the shipped flow.

**Named refusal tests — `dispatch/tests/mutation-scope.test.ts` (all green; worktree-adapter
invocation counts are asserted, and every refusal case asserts the Stage-C receipt was NOT
written):**

1. `D5 preflight refusal (unauthorized surface): allowedFiles not authorized by spec surfaces: is refused with MUTATION_SCOPE_FAILED before any worktree creation` — worktree adapter invocations: 0.
2. `D5 preflight refusal (malformed path): a denormalized allowedFiles spelling refuses with MALFORMED_PATH before any worktree creation` — worktree adapter invocations: 0.
3. `D5 post-hoc refusal (missing changed-path evidence): an adapter that reports no changedPaths is a refusal before the Stage-C receipt is written` — adapter invocations: 1 (post-hoc is post-execution by definition).
4. `D5 post-hoc refusal (out-of-scope evidence): a changed path outside allowedFiles is refused before the Stage-C receipt is written`.
5. `D5 post-hoc refusal (forbidden wins): a forbiddenSurfaces path is refused even though allowedFiles authorizes it, before the Stage-C receipt is written` (containment-survives-preflight fixture reaches the post-hoc branch).
6. `D5 positive: an authorized envelope with in-scope changed paths completes and writes the Stage-C receipt` — adapter invocations: 1; receipt at `docs/receipts/<workflowId>/000002-C-dispatch-order.json`.

### Gate (e) — "Dispatch with a scope envelope refuses an unauthorized surface before
worktree creation and refuses missing or out-of-scope post-hoc evidence before receipt
emission"

**Status: PASS.** Tests 1–2 prove the pre-worktree half (named entry in the refusal message,
zero adapter invocations); tests 3–5 prove the pre-receipt half (missing evidence, out-of-scope
evidence, forbidden-wins), each asserting no receipt file exists; test 6 is the positive
control. The envelope-schema family's malformed-path negative fixture is test 2 (see gate (d)).

## Verification commands + outcomes

Runs performed once per touched package after edits settled (Node v24.7.0, package-local
`npm test` / `npm run typecheck` / `npm run lint`; no root-level commands). Baseline counts
were captured before any edit of this pass.

| Package | `npm test` baseline → final | `npm run typecheck` | `npm run lint` |
|---|---|---|---|
| role-authority | 40 pass / 0 fail → **64 pass / 0 fail** (+24: `tests/negative-fixtures.test.ts`) | clean | clean (biome, 15 files, no fixes) |
| worker-envelopes | 97 pass / 0 fail → **112 pass / 0 fail** (+15: `tests/unknown-keys.test.ts`) | clean | clean (biome, 19 files, no fixes) |
| contract-readers | 68 pass / 1 fail → **73 pass / 1 fail** (+5: schema-validation additions) — the 1 failure is the pre-existing shared-tree canary, red at baseline before this pass, see below | clean | clean (biome, 11 files, no fixes) |
| dispatch | 139 pass / 0 fail → **145 pass / 0 fail** (+6: `tests/mutation-scope.test.ts`) | clean | clean (biome, 18 files, no fixes) |
| verification (judgment basis, untouched) | 153 pass / 0 fail → 153 pass / 0 fail | clean | clean |

Mechanical biome formatting was applied to the new test files only (format diagnostics in
files authored by this pass); no pre-existing file was reformatted.

### contract-readers' one red: shared-tree Contract-B adjudication canary (pre-existing, not
this pass)

`tests/touch-set.test.ts` `A2(b)(2)/(4) Contract B — every surfaced file is adjudicated` is a
repo-wide adjudication canary by design: it `git ls-files --cached --others`-sweeps
`plugins/foreman-line/*/src/*.ts` for the `routing_class` field signal and the
routing-class vocabulary, and requires every surfaced file to carry a recorded ruling. It was
red at this pass's baseline (68/1, before any edit) and is red at the same one test now
(73/1). The undeclared delta is exactly seven in-flight sibling-workstream source files:

- `ops-console/src/frontmatter.ts`, `ops-console/src/project.ts`, `ops-console/src/scan.ts`
  (untracked — ops-console mid-build by another workstream),
- `project-scaffold/src/equivalent-layout.ts` (untracked — project-scaffold mid-build),
- `routing-policy/src/schemas.ts`, `routing-policy/src/testing.ts`,
  `routing-policy/src/types.ts` (modified in flight — PMC-P1 writer; per PMC-P1 2026-09-26
  these are the A7 "schemas"-surface typed sources of the routing-policy no-drift chain
  `routing-policy/schemas/*.json` ↔ typed source, within their bounded write set enumerated
  in `docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md` §1: inside
  `src/` only `types/schemas/testing/registry/index.ts` + `validator.ts` changed, plus 4 new
  `schemas/*.json` + tests; routing-policy chain green 70→116 tests).

None belongs to this slice (this pass edits tests only; the canary's pathspec covers `src/`
exclusively). Per the canary's own doctrine a surfaced file "must be adjudicated before it is
staged", and adjudication of packages that are still being built is exactly the settled-tree
gate work of item 7 ("gates run last") — recorded there, not patched here against non-final
file content. Per PMC-P2 (2026-09-26), declaring P1's three routing-policy files in that
adjudication lands with Main's disposition at gate time, not with the Window P writer.

## d19 audit (verification package)

- `verification` suite: `npm test` 153 pass / 0 fail (unchanged from the 153/0 baseline named
  in the coordination constraints), typecheck/lint clean; the package is untouched by this
  pass.
- d19 CLI run (`npx tsx src/d19-audit.ts --plugin-root D:/Repos/agent-skills/plugins/foreman-line`,
  2026-09-26): the refusal-at-discovery state recorded in the items-1-2 record has CHANGED —
  `ops-console` has since been ratified (`verification/src/ratified-packages.ts`, coordinator
  workstream), so the audit now sweeps 22 packages / 211 source files and **exits 1** with
  `UNRULED INSTANCES (classes 1-5): 18`. All 18 are in two untracked, mid-build sibling
  packages: `ops-console/` (15) and `project-scaffold/` (3). **Zero** instances touch this
  slice's packages (role-authority, worker-envelopes, contract-readers, dispatch); this pass
  added no `src/` file anywhere (d19 excludes `tests/` by design), so no violation is
  attributable to it. The 18 instances belong to the ops-console and project-scaffold
  workstreams and are outside this slice — per D19FixOpsScaffold (2026-09-26) they are exactly
  their assignment (guarded roots, explicit-root refusals, ruled identity constants), expected
  to clear once their fix lands with the coordinator's identity pins (coordinator judgment basis
  unchanged: touched packages' suites + the verification suite).
- Baseline preservation (coordinator's single-writer slot on `dispatch/**`): the pre-existing
  uncommitted dispatch diffs (`src/approval-cli/index.ts` +56, `src/kompress-adapter/index.ts`
  +43, `src/query/index.ts` +23, `tests/routing-eval.test.ts` +2/-1) are carried byte-for-byte
  unchanged — this pass's only dispatch change is the new `tests/mutation-scope.test.ts`. The
  second-writer rebase / routing-policy 69-test discipline is not engaged (no routing-policy
  write by this pass; it binds later writers).

## Files changed (this pass)

All under `plugins/foreman-line/`; tests/fixtures only:

- `docs/goals/foreman-line-boundary-routing/items-3-4-status-2026-09-26.md` (this record)
- `role-authority/tests/negative-fixtures.test.ts` (NEW — 24 tests: 6 unknown-key + 18
  missing-required, derived from `schema.required`, plus 1 coverage pin)
- `worker-envelopes/tests/unknown-keys.test.ts` (NEW — 15 tests: 7 unknown-key negatives +
  7 positive controls + 1 coverage pin)
- `contract-readers/tests/schema-validation.test.ts` (5 tests appended: full-population
  acceptance, missing `contract`, missing `readers`, parcel-object missing `parcelId`,
  unknown field inside a parcel-object reader)
- `contract-readers/tests/fixtures/valid-full-population-reader.json` (NEW — D4
  full-population fixture)
- `dispatch/tests/mutation-scope.test.ts` (NEW — 6 D5 tests listed under item 4)

## Forbidden surfaces

`routing-policy/`, `templates/`, `verification/` source, `mutation-scope-guard/` source,
`spec-linter/`, and all other goals' docs were not opened for write by this pass — the file
list above is exhaustive and intersects none of them. A shared-tree `git status` shows dirty
entries under `routing-policy/`, `templates/`, `spec-linter/`, and `verification/` owned by
concurrent workstreams (PMC Window P, the scaffolder, the coordinator's audit/ratification
edits); in a shared dirty tree status cannot attribute authors, so the ownership evidence is
this pass's complete file list. `mutation-scope-guard/` is clean and untouched: it is
INVOKED (by `dispatch/src/approval-cli/index.ts`, verified) and by this pass's tests only as
a type import.

## Deferred items 5–7 (exact reasons)

- **Item 5 (hooks + templates: thin host adapters, client-neutral scaffolding incl. the
  `foreman/config.yaml` template; no second policy source, D6)** — DEFERRED because
  `templates/**` is held by PMC (Window P) under the binding sequencing decision
  (`docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md` §2: while Window
  P is open, no create/modify/delete on `templates/**`; Window R opens only after PMC-P2's
  Gate 3 merge and stage-F closure). The hooks half is co-itemed with the template canon
  (item 5 names the `foreman/config.yaml` template), so the item cannot complete its named
  deliverables until the hold releases.
- **Item 6 (Fireworks removal sweep: route code, provider refs, credentials, fixtures, stale
  active docs; keep the historical-record labelling rule, D9)** — DEFERRED because the sweep
  touches `templates/**` (the Pi routing template canon
  `templates/pi-openrouter-routing.json` is one of the sweep's active-doc surfaces), which is
  held by PMC (Window P) under the same binding decision. The sweep's repository-wide claim
  ("zero Fireworks references … in shipped functionality") cannot be closed while its
  template half is unwritable.
- **Item 7 (package, integration, parity, negative-control, and installation gates)** —
  DEFERRED because gates run last: they must execute against a settled tree after items 3–6
  land. Concretely, the shared-tree Contract-B adjudication canary in contract-readers (see
  above) is precisely such a gate — its seven in-flight sibling files cannot be adjudicated
  before those packages stop moving — and the Fireworks sweep and installation-version gates
  depend on items 5–6.

## Blockers

None for items 3–4. The one red test in `contract-readers` is the shared-tree canary
attributed above; its adjudication is item-7 gate work, and the 18 d19 unruled instances
belong to the ops-console and project-scaffold workstreams.
