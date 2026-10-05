# P1–P7 reconciliation — 2026-09-26

**Charter:** `charter.md` (P1–P7, §7 exit) · **Lineage:** `scaf-vehicles-lineage.md` ·
**Review:** `plan-review-findings.md` (10 fix, 1 reject, all applied).
**Gate receipt:** coordinator decision 2026-09-26 under owner blanket authority.

Per the lineage file's requirement, the charter's P1–P7 queue is mapped against
shipped work before any further dispatch. Key prior finding confirmed here:
the **SCAF-P1–P4 vehicles are `schema-scaffold` machinery** (shared schema
serialization `SchemaFile`/`generate(files, outDir)` extraction, test-scaffold
extraction, exit-proof and CI exit vehicles) delivered via the wave goals —
they are **not** the charter's P1–P7 items. The mapping:

| Vehicle | Delivered via (lineage) | Corresponds to charter item |
|---|---|---|
| SCAF-P1 | `w1-intake-registration` exit-proof lineage, merged `f04f3e8` (cited) | none of P1–P7 — `schema-scaffold` package machinery |
| SCAF-P2 | `w2-dispatch`, PR #57 squash `a4d58c94`, 2026-07-23 | none — shared test-scaffold extraction |
| SCAF-P3 | `w3-verification`, PR #80, 2026-07-25 | none — exit-proof vehicle |
| SCAF-P4 | `w4-ci-integration`, PR #96, 2026-07-28 | none — CI exit vehicle (follow-ups SCAF-P4-FUP-1/-3 recorded in w4 records) |

Note: the cited merge `f04f3e8` is **not resolvable in this checkout**
(`git show f04f3e8` → `fatal: bad revision`; the transplant lacks that
history). P1's verdict below therefore rests on on-disk state and the local
git log, which are stronger evidence than a sha citation anyway.

## Verdicts

### P1 — Plugin manifest and skill relocation — **DELIVERED** (residual: one human step)

- `plugins/foreman-line/.claude-plugin/plugin.json` exists, parses, carries the
  ratified field set (`name: "foreman-line"`, `version`, `description`,
  `author`, `homepage`, `repository`, `license`, `keywords`, no `skills`
  field); tracked in git (log: `30f1724`, `5259358`, `3a769f0` touch the path).
  `.codex-plugin/plugin.json` present alongside (README documents both).
- `.claude-plugin/marketplace.json` carries the `foreman-line` entry,
  `source: "./plugins/foreman-line"` (marketplace lines 18–20).
- `plugins/foreman-line/skills/` carries `goal/`, `foreman-shaping/`,
  `parcel-driven-development/` (plus `ai-council/`). Repo-root `skills/` no
  longer carries those three directories (only the out-of-scope
  `parcel-driven-development.zip` distribution artifact the P1 spec names
  explicitly). Closes F1/F8 at the file level.
- **Residual (human step, outside the repo):** the developer ruling's ordering —
  install the plugin locally, then **remove the redundant
  `~/.claude/skills/parcel-driven-development/`** — is not executed:
  `~/.claude/skills/` still contains `parcel-driven-development` (checked
  2026-09-26). Leaving it is what produced F9's duplicate-copy drift. Same
  class as the P7 criterion-1 fresh-session load check (recorded in
  `p7-clean-room-trial-2026-09-26.md`).

### P2 — Collapse the spec-location split — **DELIVERED**

- SPEC-CONVENTION §4.8 `Allowed Files` Mutation Authority is merged into the
  spec body per D11 (`surfaces:` = routing/audit; `Allowed Files` = mutation
  authority; §8 scope-pinning uses both).
- The surviving PDD copy (`plugins/foreman-line/skills/parcel-driven-development/`)
  points at `<project-root>/docs/specs/INDEX.md` (SKILL.md:692) and contains
  **zero** `docs/parcels`/`docs/PARCELS` references (grep 2026-09-26). Its spec
  skeleton carries `## Allowed Files`. The repo corpus uses
  `docs/specs/{active,done}/` throughout. Closes F5; closes F9 jointly with P1.
- **Known external divergence (charter P2 clause):** the third PDD copy in
  `keon-skills` lives in another repository and is out of reach — recorded
  here as the known external divergence, per the charter's instruction.

### P3 — De-dogfood canon into `templates/` — **DELIVERED** (this run completed it inside the 6 coordinator-assigned files; anything else under `templates/` **DEFERRED — Window P hold**)

- Shipped before this run: `templates/AGENTS.md` (D5 shape — canon entry, managed
  region contract), `templates/CLAUDE.md` (one-line `@AGENTS.md` import),
  `templates/STANDING-CONSTRAINTS.md` (D2 curated starter), `templates/defects_lessons.md`
  (empty ledger + disposition convention), `templates/kickstarters/{shaping,builder,reviewer}-template.md`,
  `templates/VENDORED-CANON.md` (ships empty at scaffold time).
- Completed 2026-09-26 inside the 6 files the coordinator assigned to this
  worker (Window-P owner: **avoid these six**):
  1. `templates/foreman-config.yaml` — declared `{{…}}` placeholders (typed
     substitution map), no customer identity.
  2. `templates/AGENTS.md` — splice mechanics named (foreman-line markers);
     trailing managed-region section removed (the generator now appends the
     managed block — single source of truth).
  3. `templates/STANDING-CONSTRAINTS.md` — rule 34 de-dogfood: both
     `plugins/foreman-line/` literals and the dangling internal references
     (`verification/src/ratified-packages.ts`, `d19-audit.ts`, `GSO-P2`, lesson
     numbers) generalized away.
  4. `templates/spec-index.md` — new; `docs/specs/INDEX.md` source (uses
     `{{PROJECT_NAME}}`, `{{SLUG}}`).
  5. `templates/foreman-routing-policy.yaml` — new; `foreman/routing-policy.yaml`
     source (single `models:` block per P4's decided shape; no model ids, no
     customer identity).
  6. `templates/foreman-skill-injection.yaml` — new;
     `foreman/skill-injection.yaml` source (capability-keyed `integration:
     ticketing` — consumes the name P4 establishes, per the Wave-2 sequencing
     amendment).
- **DEFERRED (Window P):** any remaining P3/P4 templates work in files outside
  the six above (e.g. `templates/pi-*`, `templates/profiles/` presets).
- Residual, non-blocking for §7: the 27.8 KB STANDING-CONSTRAINTS template
  still carries provenance style references to this repo's lesson history in
  rules beyond #34 (D2 prefers de-provenanced rules). Not part of any §7
  criterion; left for the Window-P owner to curate if desired.

### P4 — Profile seam — **REMAINING** (one third delivered by adjacent work)

- **Delivered (verified in-tree):** `involves:` is in the frontmatter contract —
  spec-linter v0.3 type + `KNOWN_INVOLVES_CAPABILITIES` + accept/reject
  fixtures (`valid-involves-*`, `reject-involves-*`); `foreman-config` carries
  `capabilities:` (capability → skills) and `resolveInvolves`; D14 semantics
  (optional, advisory, never a gate) are implemented and tested there. This
  satisfies P4's `involves:` schema + advisory-vocabulary clause and the §11
  amendment prerequisite is visible in SPEC-CONVENTION §4.8.
- **REMAINING (all on surfaces outside this run's authority):**
  - `skill-injection` key rename `integration.jira` → `integration.ticketing`
    (`skill-injection/skill-injection.yaml` still has `jira: [jira-workflow]`;
    `skill-injection/schemas/integration-skills.schema.json` still
    `required: [jira]`).
  - Routing-policy model ids out of literals into a single `models:` block
    (`routing-policy/routing-policy.yaml` — forbidden surface this run,
    PMC/RCM/HRO-sequenced).
  - Dispatch queue identity parameterization per plan-review Ruling 1
    (preferred: account-id through the unmodified `assertJqlSafeToken`;
    fallback `assertJqlSafeQuotedLiteral` with independent refusal tests) —
    `dispatch/src/query/index.ts` literal, forbidden surface this run.
  - Layer-3 named presets (`templates/profiles/kaseya.yaml`) — **DEFERRED
    (Window P)**; the generator resolves `--preset <name>` against
    `<templates>/profiles/<name>.yaml` and refuses unknown names typed, so the
    seam exists with zero presets shipped ("never the default, never in the
    core path").

### P5 — `project-scaffold` package — **DONE-THIS-RUN**

New package `plugins/foreman-line/project-scaffold/` (tsx + node:test + biome,
Node ≥ 22, sole runtime dependency `yaml` 2.9.1 — the repo's existing YAML
parser; config and parcel parsing reuse `foreman-config` and `spec-linter`'s
`parseFrontmatter` via the sanctioned relative cross-package mechanism).
Implemented: gap detection, byte-exact copy with enumerated substitution
(unreplaced `{{…}}` = typed refusal, zero writes), managed-block splice with
malformed-marker refusal, atomic writes with explicit collision handling,
typed CLI arguments with per-field default-deny allowlists (no user-arg
interpolation into executable JS anywhere), credential-shape refusal at the
boundary (never in logs/keys/artifacts), D9a equivalent-layout pre-check, and
the PCC-P0 exit-code contract (0/1/2/3/4). Test suite = charter §6 items 1–7
and 9 (see acceptance evidence in `loop-directive.md` / the run report).

### P6 — `/goal` preflight wiring — **DONE-THIS-RUN (generator seam) + REMAINING (skill call site)**

- Done: the generator CLI *is* the preflight seam — `plan` is the default
  (dry-run: presents the per-path plan, writes nothing), `apply` executes on
  confirmation and reports `create`/`skip-existing`/`block-append`/
  `block-replace`/`block-unchanged` per path (D3's "no new command" holds for
  the developer surface: the entry point stays `/goal`, which invokes this
  generator; the generator is plugin machinery).
- **REMAINING (exact residual):** write the invocation step into
  `plugins/foreman-line/skills/goal/SKILL.md` (run `project-scaffold plan`,
  show the plan, apply on confirmation). Verified absent today — the skill
  file contains zero scaffold/preflight/dry-run wiring (grep 2026-09-26) — and
  `skills/` is outside this run's coordinator-assigned file set.

### P7 — Clean-room trial — **DONE-THIS-RUN for every checkable part; two residual gaps recorded honestly**

Evidence: `p7-clean-room-trial-2026-09-26.md` (exact commands, outputs, what
each proves). Proven: §7 criteria 2, 3, 4, 5, §6 item 9, and the D12 no-remote
fail-closed precondition. Not checkable in this environment (recorded, never
faked): §7 criterion 1's fresh-session plugin-load half, and §7 criterion 6's
actual `/goal` dry-run preflight invocation.

## Sequencing notes for the coordinator

1. **Window P hold honored.** This worker touched exactly the six `templates/`
   files listed under P3 above (3 edits + 3 new); everything else under
   `templates/` was left to Window P untouched. `project-scaffold/src/manifest.ts`
   maps those template files to targets — if Window P moves or rewrites any of
   the six, reconcile `manifest.ts` and re-run `project-scaffold` tests.
2. **P4 remaining items** need their own parcels on `skill-injection/`,
   `routing-policy/`, `dispatch/` (the latter two were forbidden surfaces this
   run; `routing-policy` is PMC/RCM/HRO-sequenced).
3. **P6 skill call-site** is a one-file, one-section edit to
   `skills/goal/SKILL.md` — shape it under the goal's Gate 2 as the natural
   P6 close-out, or fold it into the P7 criterion-6 trial run.
4. **P7 criterion 1 + 6** should run together in a fresh session with the
   plugin installed (they share the environment requirement).
