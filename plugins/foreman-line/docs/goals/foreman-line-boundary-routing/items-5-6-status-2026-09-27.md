# Items 5–6 status — 2026-09-27

**Goal:** `foreman-line-boundary-routing` · **Scope:** charter work items 5–6 (locked
decisions D6, D9) and the acceptance gates that cover them.
**Authority:** coordinator decision 2026-09-27 under owner blanket authority. Gate receipts
follow the repo convention: coordinator decision receipts, never fabricated human approvals.

Items 1–4 are recorded in `items-1-2-status-2026-09-26.md` and
`items-3-4-status-2026-09-26.md`. Item 7 (gates) is untouched and deferred (exact reason at
the bottom).

**Sequencing state at start (both binding records read first).** Window P is RELEASED
(`docs/goals/pi-model-configuration/pmc-wave1-release-2026-09-27.md` §4: dual review complete,
Gate 3 merge decided approved, stage-F closed, Window R open). Per
`rcm-sequencing-decision-2026-09-26.md` §2–§3 the release opens `routing-policy/**` +
`dispatch/**` for the RCM slice and leaves `templates/**` canon to its named owners. This
boundary slice's write set for items 5–6 is exactly: `templates/**` minus the six
scaffolder-owned files, `hooks/**`, `.claude-plugin/**`, `.codex-plugin/**`, and the records
in this directory. The six scaffolder-owned files (`templates/foreman-config.yaml`,
`templates/AGENTS.md`, `templates/STANDING-CONSTRAINTS.md`, `templates/spec-index.md`,
`templates/foreman-routing-policy.yaml`, `templates/foreman-skill-injection.yaml`) were not
opened for write; `routing-policy/**` and `dispatch/**` were swept read-only only.

## Item 5 (D6) — hooks + templates: assessment + gaps closed

### What already ships (cited, not redone)

| Surface | Shipped state |
|---|---|
| `hooks/model-gate.mjs` + `hooks/hooks.json` | Thin two-event host adapter: `SessionStart` reports a verdict (cannot block — stdout context), `PreToolUse` blocks (exit 2) on a recorded BLOCK. Wired via the `${CLAUDE_PLUGIN_ROOT}` host convention. |
| `hooks/model-gate.policy.json` | Session-grade membership roster as data ("the roster is data — not code"): `approved`, `oneMillionContext` message helpers, `retired` reasons, `escapeHatch`. |
| `hooks/README.md` + `hooks/model-gate.test.mjs` | Documented design rules (byte-exact matching, fail-closed on unverified, fail-open on unexpected, per-session state keys) and 12 exit-code tests. `hooks/` is deliberately not an npm package (README, "Why this is not a package"). |
| `templates/` | Scaffolder canon (six files, see seam below), `templates/CLAUDE.md` (`@AGENTS.md` import), `templates/VENDORED-CANON.md`, `templates/defects_lessons.md`, `templates/kickstarters/{shaping,builder,reviewer}-template.md` (role dispatch shells), `templates/pi-openrouter-routing.json` + `templates/pi-routing-directive.md` (Pi routing canon, lockstep-pinned by `routing-policy/tests/pi-openrouter.test.ts:14,30`). |
| Client manifests | `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` (both `version 0.6.10`). Surveyed: no plugin manifest in this repo declares a hooks field, so `hooks/hooks.json` + `${CLAUDE_PLUGIN_ROOT}` is the repo's only shipped hook-wiring convention; live host wiring is an item-7 installation-gate question, not a missing artifact. |

Charter item 5 asked for three deliverables: hooks (shipped), a **config template**, and
**client-neutral role/envelope scaffolding**. Two real gaps and one seam remained:

### Gap 5.1 — hooks thinness (D6): assessed thin; closed documentationally + mechanically

**Assessment (report/block only).** The gate reports (SessionStart stdout) or blocks
(PreToolUse exit 2) a host-visible violation and nothing else. It never selects, routes, or
falls back between execution models (the `claude --model …` line in a block message is
remediation text, not a route), and it never approves anything — there is no allow-workflow
or risk/data ruling. `model-gate.policy.json` is session-grade membership data; per-role model
binding at dispatch time stays `routing-policy/routing-policy.yaml`'s job (already stated in
the policy's own `$comment` and the README's "Related" section). No second routing or
approval engine exists.

**Closed:**

- `hooks/README.md` — new section **"What this hook is not (D6 thinness)"** stating the
  report/block boundary verbatim (no routing, no fallback, no approval; roster is membership
  data, not a routing policy) and pointing at `routing-policy/routing-policy.yaml` as the
  dispatch authority.
- `hooks/model-gate.test.mjs` — new test **`D6 THINNESS: the policy is session-roster data
  only - no routing, provider, fallback, or approval keys`**: a recursive key scan of the real
  `model-gate.policy.json` refuses any `routing|route(s)|lane(s)|fallback(s)|fallbackModels|
  provider(s)|approval(s)|approve|budget` key at any depth, with a membership pin (`approved`
  roster non-empty) so the scan cannot pass on an emptied document. A `fallbackModels`-shaped
  key would be both a second routing engine (D6) and the hidden fallback path D9 forbids — the
  pin refuses that growth mechanically instead of by review memory.

**Mutation proof that the pin binds** (run 2026-09-27): temporarily injected
`policy.routing = { fallbackModels: ['x'] }` into the real `model-gate.policy.json`, re-ran
`node --test --test-name-pattern "D6 THINNESS" model-gate.test.mjs` → **fail 1**, exact
offenders named (`AssertionError: policy carries steering keys: $.routing,
$.routing.fallbackModels`); restored the policy from backup and re-ran → **pass 1 / fail 0**.
`model-gate.policy.json` is byte-unchanged (absent from `git status`; the temporary `.bak`
was moved away).

### Gap 5.2 — config template: SEAM RECORDED, not edited

The charter's "config template" is the scaffolder-owned **`templates/foreman-config.yaml`**:
its own header says "Rendered into `<repo-root>/foreman/config.yaml` by the Foreman Line
project scaffold … This file is a template only; it intentionally contains no customer
identity — every value below is a declared placeholder" (`{{PROJECT_KEY}}`, `{{BASE_BRANCH}}`,
`{{BRANCH_PREFIX}}`, `{{WORKTREE_ROOT}}`, `{{DISPATCH_QUEUE}}`, explicit `stack:`, `capabilities:`).
It is one of the six coordinator-assigned scaffolder files
(`docs/goals/plugin-packaging-and-scaffolder/p1-p7-reconciliation-2026-09-26.md` §P3 item 1:
"declared `{{…}}` placeholders (typed substitution map), no customer identity"). Per the
file-disjoint slice rule this slice **skips it (not opened, not edited)**; the item-5 config
template deliverable is satisfied by that file plus `foreman-config`'s ownership of the
document shape (D3). Two adjacent seams recorded, not edited:

- `project-scaffold/src/manifest.ts` is the curated "template source → target" map ("only
  entries listed here ever reach a target repo"). If the role/envelope scaffolding added
  below (5.3) should also be delivered into scaffolded target repos, the scaffolder adds a
  `CopyEntry` for it there — outside this slice's write set, so recorded as a seam.
- The scaffolder's remaining deferred template work (`templates/profiles/` presets,
  `templates/pi-*` rework) was explicitly deferred to Window P/the named owners
  (`p1-p7-reconciliation-2026-09-26.md` §P3 "DEFERRED (Window P)" and §Layer-3); this slice
  does not pre-empt it.

### Gap 5.3 — client-neutral role/envelope scaffolding: NEW `templates/role-envelope-scaffolding.md`

Nothing in `templates/` scaffolded the shipped role/envelope contracts of items 3
(`role-authority`, `worker-envelopes`) — the kickstarter role shells predate them and the
six scaffolder files cover config/canon only. **Created
`templates/role-envelope-scaffolding.md`** (additive; no existing file rewritten, so no
second-writer collision with PMC-P3's future human-facing canon rework — PMC charter item 2 /
sequencing decision §2.3):

- **Client-neutral by construction:** names no host client, hook, channel, or session
  command; the same envelope JSON is valid under Claude Code, Codex, the Pi harness, a plain
  CLI, or CI. Host adapters are explicitly out of its scope ("`hooks/` may report or block …
  never becomes a second routing or approval engine (D6)").
- **Schema-authoritative (D4):** a pointer table to the committed schemas
  (`role-authority/schemas/role-identity.schema.json`,
  `worker-envelopes/schemas/task.schema.json`, `worker-envelopes/schemas/result.schema.json`)
  with the explicit rule "where this file and a schema disagree, the schema wins", plus the
  strictness rule (`additionalProperties: false` — unknown keys refused).
- **Complete fill-in scaffolding** with every field of all three documents (required vs
  optional marked against the schemas' `required` arrays), verbatim vocabularies from the
  shipped schemas: 11 roles, 4 categories, `R0–R3`, `COMPLETED|PARTIAL|BLOCKED|REFUSED|FAILED`,
  the `worker.kaseya/v1` / `worker-result.kaseya/v1` `apiVersion` consts.
- **Contract rules carried, not re-decided:** D2/D3 identity injection (identity never
  invented in an envelope — `foreman/config.yaml` is the source; its template is
  `templates/foreman-config.yaml`); D4 opaque registry keys for `registryKey`/`modelRef`/
  `preferredModel`/`fallbackModels`/`escalationTarget` ("never a provider URL, provider alias,
  provider credential name"); D5 mutation scope (`allowedFiles`/`forbiddenSurfaces` checked
  pre-dispatch and `changedSurfaces` post-hoc — "a result with missing changed-path evidence
  is a refusal, not a completed task"); D7/D8 bounded Foreman routing with coordinator,
  approval, security, merge, release never on automatic routing; report-only evidence
  discipline (`notRun` vs `passed`).

### Gate (f) — "Hooks and templates are present, documented, and do not introduce a second
policy source"

**Status: PASS.** Present: `hooks/` (5 files) + `templates/` (15 files: 12 top-level incl. the
new scaffolding + 3 `kickstarters/`) + both client manifests. Documented: `hooks/README.md` (design rules + the new
D6 thinness section), `templates/role-envelope-scaffolding.md`, `templates/pi-routing-directive.md`,
`templates/VENDORED-CANON.md`. No second policy source: the hook roster is session-grade
membership data (per-role dispatch binding remains `routing-policy/routing-policy.yaml`), the
envelope scaffolding defers to the committed schemas by explicit rule, and the thinness pin
test mechanically refuses any steering key from entering the hook policy.

## Item 6 (D9) — Fireworks removal: repository-wide sweep evidence

All commands run 2026-09-27 from the repository root (`D:/Repos/agent-skills`), `git grep -i`
case-insensitive over content. `--untracked` extends the sweep to untracked-but-present files
(the shared tree publishes nothing, so most records are `??`). Display piping (`| cut -c1-120`)
was output-width only and does not affect matches.

### Commands + results

**A — tracked, repository-wide (whole repo, all file types):**

```
git grep -in "fireworks"
```

7 matching lines in 4 files: `plugins/foreman-line/CHANGELOG.md:13`,
`plugins/foreman-line/docs/goals/INDEX.md:23`,
`plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md:13,28,43,88`,
`skills/synced/b1615d10-…/morning/SKILL.md:143`.

**B — tracked + untracked, repository-wide:**

```
git grep -in --untracked "fireworks"
git grep -ic --untracked "fireworks"        # per-file matching-line counts
```

Per-file counts: `plugins/.trash/1790428327072-47632-twuakZ/foreman-line/docs/goals/
heterogeneous-agent-worker-fabric/historical-charter-source.md` **25**; its sync mirror
`plugins/synced/b1615d10-…/foreman-line~g2/docs/goals/heterogeneous-agent-worker-fabric/
historical-charter-source.md` **25**; trash/sync mirror copies of `CHANGELOG.md` 1 each and of
the boundary `charter.md` 4 each; live-tree `plugins/foreman-line/CHANGELOG.md` 1,
`docs/goals/INDEX.md` 1, `docs/goals/foreman-line-boundary-routing/charter.md` 4,
`items-1-2-status-2026-09-26.md` 2, `items-3-4-status-2026-09-26.md` 3;
`skills/synced/b1615d10-…/morning/SKILL.md` 1.

**C — provider aliases, credential contract names, provider/alias path spellings:**

```
git grep -inE --untracked "FIREWORKS_[A-Z]+|fireworks\.ai|accounts/fireworks|firefunction|fireworks/"
```

Hits **only** inside the two `historical-charter-source.md` copies (e.g. `FIREWORKS_API_KEY`
at :1159/:1210, `fireworks:` lane block at :547, "Wave 1 - Fireworks worker adapters"
:723–735, D35–D37 direct-API rulings :1047–1077). **Zero** hits in the live plugin.

**D — shipped plugin, active code and active docs (everything under `plugins/foreman-line/`
except the goal-record directory and the changelog):**

```
git grep -in --untracked "fireworks" -- "plugins/foreman-line" \
  ":(exclude)plugins/foreman-line/docs/goals" ":(exclude)plugins/foreman-line/CHANGELOG.md"
```

**Zero hits — exit 1 (no matches).** This covers every package's `src/`, `tests/`,
`schemas/`, `instances/`, `templates/` (all 15 files: 12 top-level incl.
`pi-openrouter-routing.json` and the routing directive, plus the 3 `kickstarters/`), `hooks/`
(all 5 files), `.claude-plugin/`, `.codex-plugin/`, `skills/`, `contracts/`, and the plugin
README. There is no Fireworks route, provider reference, model alias, worker lane,
environment variable, credential contract, adapter, fallback, or route fixture in shipped
functionality — no active-code removal was needed (zero-hit, not removals).

**E — live plugin, credential/alias/path patterns (worker-lane route paths included):**

```
git grep -inE --untracked "FIREWORKS|fireworks\.ai|accounts/fireworks|firefunction" -- "plugins/foreman-line"
```

11 matching lines, **all** in the retained historical records enumerated below (mandate and
status prose only) — zero in code, fixtures, templates, hooks, or manifests.

### Retained historical records — labelled **RETIRED**

Per the gate language ("Historical records are not executable functionality; any retained
historical record must be clearly labelled as retired"), and per this repo's own provenance
convention ("historical evidence … left byte-intact as provenance — falsifying evidence is
worse than a historical name", `goal-status-report-2026-09-26.md`:109–111), the frozen records
below are **not edited** — the retired label is carried here, on each record, file-and-line
exact:

| Record (file:line) | RETIRED label |
|---|---|
| `plugins/foreman-line/CHANGELOG.md:13` | **RETIRED** — historical changelog entry recording the completed removal ("Removed the Fireworks routing and worker-provider path entirely"); not executable functionality. Not in this slice's enumerated write set; labelled here instead of edited. |
| `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md:13,28,43,88` | **RETIRED** as functionality — frozen authorization record (2026-09-19); these four mentions are the mandate prose of the removal itself (objective, D9, work item 6, the sweep gate). Never edited. |
| `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/items-1-2-status-2026-09-26.md:249,253` | **RETIRED** — frozen work record (2026-09-26); item-6 forward references only. Never edited. |
| `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/items-3-4-status-2026-09-26.md:197,202,208` | **RETIRED** — frozen work record (2026-09-26); the then-deferred item-6 description. Never edited. |
| `plugins/foreman-line/docs/goals/INDEX.md:23` | **RETIRED** — live-state index row whose status text predates this record ("items 5–7 … queued"); update belongs to the index owner (not this slice's enumerated write set), labelled here meanwhile. |
| `plugins/.trash/1790428327072-47632-twuakZ/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/historical-charter-source.md` (25 hits: :123, :547 `fireworks:` lane block, :719–735 Wave-1 Fireworks worker adapters, :813, :914, :966, :1000–1077 D35–D37, :1133–1142, :1159, :1210 D67/D68 `FIREWORKS_API_KEY`) | **RETIRED** — historical provenance record of the deleted `heterogeneous-agent-worker-fabric` charter (the file name itself says `historical`); it is a trashed copy outside `plugins/foreman-line/` and therefore outside this slice's write set (the hard boundary forbids writes outside `plugins/foreman-line/`). Byte-intact provenance; retired by this label. The live tree carries **no** copy of this file (its surviving extract, `hawf-extract-worker-lane-contracts.md`, sweeps zero for Fireworks). |
| `plugins/synced/b1615d10-…/foreman-line~g2/docs/goals/heterogeneous-agent-worker-fabric/historical-charter-source.md` (25 hits) + the sync mirrors of `CHANGELOG.md`/`charter.md` | **RETIRED** — inert sync-mirror copies of the records above (same labels apply); outside this slice's write set. |

Non-provider false positive, recorded so the sweep stays reproducible:
`skills/synced/b1615d10-…/morning/SKILL.md:143` uses "fireworks" as a drawing motif ("fireworks
= holiday eve") in an unrelated skill's illustration vocabulary — no provider, credential,
alias, or lane content; outside this slice; nothing to retire.

### Gate — "A repository-wide active-code sweep finds zero Fireworks references, provider
aliases, credential names, or worker-lane route paths … retained historical record … clearly
labelled as retired**

**Status: PASS.** Zero-hit in active code and active docs (command D, exit 1), zero provider
aliases / credential names / lane route paths in the live plugin (commands C, E), and every
retained historical record above carries its RETIRED label. **No hidden fallback exists:**
no shipped file contains a Fireworks fallback path (commands A–E), and the fallback-shaped
artifacts that do ship — the provider-neutral `fallbackModels` envelope field (opaque registry
keys, D4) and routing-policy's PMC-P1/RCM fallback contract — carry no Fireworks entry per the
same zero-hit sweeps.

## Verification commands + outcomes

Runs performed once after edits settled (Node v24.7.0). This pass touched **no npm package**
(`hooks/` is deliberately not a package — README, "Why this is not a package"; `templates/`
and `docs/` are not packages), so there are no package `npm test`/`typecheck`/`lint` runs to
report; the scoped proof is the hooks suite, which is the only executable surface changed.

| Surface | `node --test` baseline → final | Notes |
|---|---|---|
| `hooks/` (`node --test plugins/foreman-line/hooks/model-gate.test.mjs`) | 12 pass / 0 fail → **13 pass / 0 fail** (+1: `D6 THINNESS: the policy is session-roster data only …`) | Mutation proof above: the new pin fails closed on an injected `routing.fallbackModels` key and passes after restoration. |
| `model-gate.policy.json` | byte-identical (restored after the mutation proof; confirmed by its absence from `git status`) | — |

Adjacent-surface non-impact (reasoned, not re-run — those packages are untouched by this pass
and one is mid-build by a sibling workstream):

- `routing-policy`'s template lockstep (`tests/pi-openrouter.test.ts:14,30` deep-equals
  `templates/pi-openrouter-routing.json`) is unaffected: that template is byte-untouched.
- `project-scaffold`'s tests clone `templates/` wholesale (`tests/helpers.ts`
  `TEMPLATES_DIR`/`cloneTemplates`) but the generator copies **only curated manifest entries**
  ("only entries listed here ever reach a target repo", `src/manifest.ts:3–5`) and its
  placeholder scan runs over emitted/copied **targets**, not raw template files
  (`tests/placeholders.test.ts` asserts on `docs/specs/INDEX.md` output paths). The new
  `role-envelope-scaffolding.md` is not a manifest entry and contains no `{{…}}` tokens
  (it uses the kickstarter `<PLACEHOLDER>` convention), so it cannot enter a target repo or
  trip `UNREPLACED_PLACEHOLDER`. No test in `project-scaffold` claims every template file is
  in the manifest (surveyed `git grep --untracked "manifest|…" -- project-scaffold/tests`:
  one reference, `generator.test.ts` importing `ARTIFACTS`).
- No package source or test references `hooks/` or the new template
  (`git grep --untracked "model-gate|role-envelope" -- **/*.ts` under the plugin: zero).

## Files changed (this pass)

All under `plugins/foreman-line/`:

- `docs/goals/foreman-line-boundary-routing/items-5-6-status-2026-09-27.md` (this record)
- `templates/role-envelope-scaffolding.md` (NEW — item 5.3, client-neutral role/envelope
  scaffolding)
- `hooks/README.md` (item 5.1 — "What this hook is not (D6 thinness)" section; test count
  line 12 → 13)
- `hooks/model-gate.test.mjs` (item 5.1 — D6 thinness pin test + `node:fs` import)

## Forbidden surfaces

`routing-policy/**`, `dispatch/**`, and the six scaffolder-owned template files were **not
opened for write**; `templates/pi-openrouter-routing.json`, `templates/pi-routing-directive.md`,
`templates/CLAUDE.md`, `templates/VENDORED-CANON.md`, `templates/defects_lessons.md`,
`templates/kickstarters/*` were read but not modified. Proof (`git status --porcelain` scoped
to the owned + forbidden surfaces, after all edits):

```
 M plugins/foreman-line/dispatch/src/approval-cli/index.ts        [pre-existing user diff]
 M plugins/foreman-line/dispatch/src/kompress-adapter/index.ts    [pre-existing user diff]
 M plugins/foreman-line/dispatch/src/query/index.ts               [pre-existing user diff]
 M plugins/foreman-line/dispatch/tests/routing-eval.test.ts       [pre-existing user diff]
 M plugins/foreman-line/hooks/README.md                           [THIS PASS]
 M plugins/foreman-line/hooks/model-gate.test.mjs                 [THIS PASS]
 M plugins/foreman-line/routing-policy/* (10 files) + ?? (14 files)  [RCM/PMC sibling slices]
 M plugins/foreman-line/templates/AGENTS.md                       [scaffolder-owned, pre-existing]
 M plugins/foreman-line/templates/STANDING-CONSTRAINTS.md         [scaffolder-owned, pre-existing]
 M plugins/foreman-line/templates/foreman-config.yaml             [scaffolder-owned, pre-existing]
 M plugins/foreman-line/templates/pi-openrouter-routing.json      [pre-existing sibling diff]
?? plugins/foreman-line/templates/foreman-routing-policy.yaml     [scaffolder-owned, pre-existing ??]
?? plugins/foreman-line/templates/foreman-skill-injection.yaml    [scaffolder-owned, pre-existing ??]
?? plugins/foreman-line/templates/spec-index.md                   [scaffolder-owned, pre-existing ??]
?? plugins/foreman-line/templates/role-envelope-scaffolding.md    [THIS PASS]
?? docs/goals/foreman-line-boundary-routing/{hawf-extract…,items-1-2…,items-3-4…} [prior slices]
```

The shared dirty tree (~1300 entries) cannot attribute authors, so the ownership evidence is
this pass's complete file list above (4 files, listed twice over): it intersects none of the
forbidden surfaces. `model-gate.policy.json` is absent from `git status` (byte-identical).
The `dispatch/` + `routing-policy/` dirty entries are the coordinator-named pre-existing user
diffs and the RCM/PMC sibling slices' in-flight work (Window R), untouched here.

## Deferred items / open seams (exact reasons)

- **Item 7 (package, integration, parity, negative-control, and installation gates)** —
  still deferred: gates run last against a settled tree, and the item-7 checklist includes
  this slice's own gates (hooks/templates presence — now closable by gate (f) above; Fireworks
  sweep — now closable; client installation versions; Pi/Jev capability tests) plus the
  shared-tree Contract-B adjudication canary named in `items-3-4-status-2026-09-26.md`.
- **`project-scaffold/src/manifest.ts` seam** (5.2): delivering
  `role-envelope-scaffolding.md` into scaffolded target repos needs a scaffolder-owned
  `CopyEntry`; outside this slice's write set — seam recorded, not edited.
- **`docs/goals/INDEX.md:23` status row** (item 6 label table): live-state index owned
  outside this slice's enumerated write set; labelled retired here, row update left to the
  index owner.
- **PMC-P3 canon rework** (kickstarter/session wording): untouched deliberately — additive
  scaffolding only, so the future human-facing canon pass (PMC charter item 2) remains the
  single writer for rewording those files.

## Blockers

None. Items 5–6 are complete within this slice's write set; every skipped sub-step above is a
recorded seam or a named deferred gate, not an unmet item-5/6 deliverable.