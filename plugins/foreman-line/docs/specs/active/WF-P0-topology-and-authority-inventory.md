---
ticket: KONE-TBD            # register via jira-workflow at Stage B; replace before dispatch
title: WF-P0 topology and authority inventory
status: active
owner: clinton.morgan
created: 2026-09-03
updated: 2026-09-04
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md
  - plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/wf-p0-shaping-report.md
  - plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# WF-P0 — Topology and authority inventory

## Intent

Establish, from current Git evidence only, what agent-role topology and what runtime
authority actually exist in this checkout today — so the seventeen downstream parcels of
`heterogeneous-agent-worker-fabric` build against measured state rather than against the
historical record or against prose. The deliverable is one versioned, citation-bearing map
covering the current three-role path, the trust boundaries around it, the packages that
implement or claim to enforce those boundaries, and the rollback path that must survive the
goal. A wrong inventory is worse than no inventory: seventeen parcels will inherit it.

This is a documentation parcel. It produces no code, calls no provider, incurs no spend,
and reads no credential value.

## Constraints

- **Base.** *(Coordinator-ratified amendment, 2026-09-04 — replaces "created from fresh
  `origin/main`".)* The builder's worktree is created from the **tip of
  `claude/hwf-wf-p0-shaping-20260903` at dispatch time** — the ratified spec including this
  amendment — and its exact 40-character base SHA is recorded in the map header per AC2. The
  branch tip is named rather than a fixed SHA because this amendment cannot pin a commit that
  must contain the amendment itself; AC2's requirement that the builder record its own base
  SHA is what makes the base auditable. That tip contains all of `origin/main`
  (`5ce6ddc7f996d764e506b6b421779fbf3ece689a`, verified unmoved on the remote at dispatch
  time) and therefore contains
  `096adfbffebbaf1a783801a2b286f86d10f94a17` ("retarget routing policy to OpenRouter
  (v0.3)"), so `routing-policy.yaml` reads **v0.3** and every citation in this spec resolves
  against the builder's own tree.

  Reason for the amendment: the original wording said `origin/main`, but this spec is not on
  `main` — it is on the shaping branch. A builder based literally on `origin/main` would not
  have the spec it is being dispatched against, while a builder based on the shaping branch
  satisfies the wording's actual purpose, which is to guarantee the base is not a stale
  lineage. The base gate below is unchanged and remains the mechanical check; it passes on
  this base. Nothing else in the spec changes.
- **Base gate — run it even though the known hazard is now historical.** Before writing a
  single entry, verify that
  `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` succeeds.
  Historical note, retained because it is why this gate exists: this goal's coordinator and
  shaping branches were originally cut from `cba257e`, which predates `096adfb`, and so
  carried `routing-policy.yaml` **v0.1** — Anthropic-only tiers and a populated
  `cerebras-shadow` route. That lineage was rebased before dispatch, so the specific hazard is
  closed; the gate stays because the next worktree could be cut from anywhere, and an
  inventory taken on a pre-`096adfb` base would record v0.1 as current and be wrong in a
  document seventeen parcels inherit.
- **Branch and worktree.** Branch `claude/hwf-wf-p0-<yyyymmdd>`; worktree
  `D:\Repos\agent-skills-worktrees\hwf-wf-p0-<yyyymmdd>`. Never ambient, never `main`,
  never another goal's worktree.
- **Discovery only.** No provider call, no spend, no secret access, no external effect.
  Credentials are referenced by name only and never read or emitted (charter D5). Any step
  that would require a live provider call or a credential value is a stop-and-report.
- **Every claim carries evidence or a label.** Each map entry is marked with exactly one
  evidence class (see Acceptance Criteria) and, for anything other than `asserted`, a
  citation of the form `path:line-range`. Prose without a citation is `asserted` and must be
  labelled as such. This is the parcel's whole value.
- **Charter-locked, cite-only.** Gate 1 closed (`charter.md:135`), Gate 2 granted for WF-P0
  only (`charter.md:138`), Gate 3 not delegated (`charter.md:142`). The map cites these and
  never re-decides them.
- `routing-policy/` is the sole model-registry and data-classification authority
  (charter D4). The map reads it; WF-P2 is the only parcel that may extend it.
- Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
- `historical-charter-source.md` is provenance only (charter D3). No parcel numbering, model
  name, provider choice, or completion claim from it enters the map.
- `## Allowed Files` below is this parcel's entire mutation authority (SPEC-CONVENTION §4.8).
  Note it is **not** machine-enforced anywhere in this repo — the spec-linter reads
  frontmatter only (`spec-linter/src/validate.ts:142-156`) — so it binds by discipline and
  by the coordinator's `git diff --name-only` check, not by tooling.

## Acceptance Criteria

Each criterion is checkable against disk by a reviewer with no builder context.

- [ ] **AC1 — Evidence classes are defined and every entry carries exactly one.** The map
  defines these four classes and uses no others: `enforced-mechanically` (a schema,
  validator, or test that fails closed, cited to the code that fails and the test that
  proves it); `enforced-conditionally` (enforcement holds only under a stated precondition,
  which is named); `documentation-only` (an artifact declares an intent nothing enforces);
  `asserted` (prose only, no artifact). Every entry in every table carries one label. A
  reviewer distinguishes verified from asserted by reading the label and following the
  citation — not by trusting the sentence.
- [ ] **AC2 — Base and version header.** The map opens with `map_version: 0.1.0`,
  `base_commit:` (the exact 40-char SHA of the worktree's base, which must contain
  `096adfb`), `taken_at:` (ISO-8601), and a `## Revision log` table with its first row. No
  entry cites a path outside that commit.
- [ ] **AC3 — The three roles are named from the registry, and the vocabulary conflict is
  recorded, not resolved.** The map states that the current three-role path is
  `coordinator`, `verifier`, `builder`, cited to the `roles:` map in
  `routing-policy/routing-policy.yaml` and to `routing-policy/schemas/routing-policy.schema.json`
  (`required: [coordinator, verifier, builder]`, `additionalProperties: false`). It then
  records the two disagreeing vocabularies on disk — `COORDINATOR-PATTERN.md`'s dispatch
  table (five rows, four distinct roles: coordinator, builder at two tiers, adversarial
  reviewer, shaping agent) and `permission-profiles.yaml`'s six profiles
  (`permission-profiles/src/types.ts` `PROFILE_NAMES`) — in a three-column mapping table
  where every cross-vocabulary equation is individually labelled per AC1. In particular the
  equation *registry `verifier` = dispatch-table "adversarial reviewer" =
  profile `reviewer-readonly`* is labelled `asserted`, because no code links them. The map
  does not amend the charter's phrase and does not silently pick a winner.
- [ ] **AC4 — Role-authority table, one row per role and per profile.** For each of the
  three registry roles and each of the six permission profiles, the map records: model-tier
  pin (and whether a validator enforces it), write scope, shell access, `network.egress`
  value, tool set, and the enforcement condition. The coordinator/verifier frontier pin is
  cited to the validator function that rejects a non-frontier value, and to its test.
- [ ] **AC5 — The four named negative findings are present, each with a citation.** The map
  records, as findings and not as asides: (a) `roles.builder: per-class` is read by no code
  outside the policy validator; (b) the dispatch-time routing evaluator takes
  `routing_class` and `data_classification` but **no role** as input, so `roles:` is gated at
  policy load and never consulted in route selection; (c) no CI workflow in this repository
  runs any `plugins/foreman-line` validator — the only workflow is
  `.github/workflows/test-plugin-install.yml`, which validates root `skills/` and plugin
  packaging; (d) `## Allowed Files` is enforced by no validator. Each carries a citation and
  an evidence class. If the builder finds any of the four to be false on the recorded base
  commit, it records the contradiction with evidence and stops for a coordinator ruling
  rather than deleting the row.
- [ ] **AC6 — Permission-envelope enforcement is stated at its real strength, not above it.**
  The map records that a permission envelope constrains only a session that loads the emitted
  worktree-local `.claude/settings.local.json`; that it is inert for an Agent/Task-tool
  subagent sharing an already-loaded parent configuration; that it is void under bypass mode;
  and that for a shell-capable profile the deny list enumerates commands, so
  fix/commit capability is **reduced, not eliminated**. Each is cited to
  `permission-profiles/README.md` and/or `permission-profiles/PROBE.md`. The map also records
  the paired detection control (coordinator `git status` in the reviewer worktree) and labels
  it `documentation-only` unless the builder finds code that runs it.
- [ ] **AC7 — Emission sites are enumerated with their invocation reality.** Every code path
  that writes a `.claude/settings.local.json` is listed with its file, its exact output path
  expression, the projected JSON shape, and whether anything in-repo actually drives it.
  Where a path is reachable only from library code with no shipped entry point, the map says
  so.
- [ ] **AC8 — Package inventory with an explicit inventoried/not-inventoried boundary that
  reconciles against a directory listing.** All **fifteen** directories under
  `plugins/foreman-line/` excluding `docs/` are listed: `approval`, `contracts`, `dispatch`,
  `integration`, `permission-profiles`, `projection`, `receipts`, `registration`,
  `routing-policy`, `schema-scaffold`, `shaping`, `skill-injection`, `skills`, `spec-linter`,
  `verification`. The **eight** in Inventory Scope (below) carry a role/authority-relevant
  description with citations; the **seven** excluded carry one line each and the literal label
  `not inventoried — out of WF-P0 scope`. The map states the arithmetic — 8 inventoried + 7
  excluded = 15 — so a reviewer holding `ls plugins/foreman-line` can reconcile it in one
  pass, and no directory falls through the boundary. Repository CI (`.github/workflows/`) is
  inventoried **in addition** and is counted separately: it is not a package under
  `plugins/foreman-line/`. No row reads "all Foreman Line packages" or equivalent.
- [ ] **AC9 — Rollback path mapped, with its test obligation assigned and unsatisfied.** The
  map defines the current three-role path as the rollback target: the exact registry state,
  role pins, and dispatch behaviour a rollback must restore, each cited. It then records a
  **rollback test obligation** — what must be exercised, the falsifiable pass condition, and
  the required evidence — and states in the same section that WF-P0 does not implement or run
  it. The map quotes charter exit item 1 verbatim: *"the current three-role path is mapped and
  remains a tested rollback path"*, states that WF-P0 discharges only `mapped`, and names
  **WF-P16 — observability and rollout operations** (`charter.md:80`, deliverable *"exercised
  rollback path"*) as the owner of the tested half, cross-referenced to exit item 9
  (`charter.md:118`). The map must not claim exit item 1 is satisfied by WF-P0. See Open
  Question 1 — if the coordinator rules otherwise, this criterion is amended before dispatch,
  not reinterpreted by the builder.
- [ ] **AC10 — Reconciliation-ledger deltas recorded.** Where the recorded base commit
  contradicts an entry in
  `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/reconciliation.md`, the
  map records the delta with evidence. The known instance at shaping time: the ledger lists
  "the public-only Cerebras shadow boundary" as `verified_current`, while on `origin/main`
  `routing-policy.yaml` v0.3 ships `shadow_routes: {}`. The map records the delta; it does
  **not** edit `reconciliation.md`.
- [ ] **AC11 — Cross-goal interfaces recorded without co-ownership.** `foreman-kernel` and
  `hierarchical-coordination-sidecars` are recorded as separately owned (charter D7), with
  their on-disk status on the base commit and any interface WF-P1…WF-P18 would consume. No
  file belonging to either goal is modified and no serialization point of theirs is claimed.
- [ ] **AC12 — Scope and cleanliness.** `git diff --name-only origin/main...HEAD` is a subset
  of `## Allowed Files`; `git diff --check` is clean; no package source, schema,
  `routing-policy.yaml`, `permission-profiles.yaml`, contract, validator, or test file is
  touched.
- [ ] **AC13 — Two independent adversarial reviews return PASS** with no unresolved Blocker,
  High, or Medium finding.

## Out of Scope

- **Defining role, authority, or envelope contracts** — WF-P1. WF-P0 records what exists; it
  proposes no `WorkerRole`, task envelope, result envelope, evidence, uncertainty, budget, or
  escalation shape.
- **Any edit to `plugins/foreman-line/routing-policy/`**, including `routing-policy.yaml`,
  its schemas, its validator, and its tests — WF-P2 under charter D4. No second registry, no
  shadow authority, no "temporary" annotation in the policy file.
- **Any edit to `plugins/foreman-line/permission-profiles/`**, including
  `permission-profiles.yaml`, `PROFILE_NAMES`, and the emitter. The profile/location
  collision recorded under Open Question 6 is a finding, not a fix.
- **Any transport, adapter, or invocation seam** — WF-P3. No provider client, no
  credential-by-name resolver, no timeout/retry/cancellation code.
- **Any scope-guard or mutation-guard implementation** — WF-P4. Including making
  `## Allowed Files` machine-enforced, however tempting AC5(d) makes it.
- **Any dispatch-time binding** — WF-P5. The map describes current binding behaviour and
  changes none of it.
- **Any routing or route-selection change** — WF-P6.
- **Any corpus, rubric, or classification-label work** — WF-P10.
- **Implementing, running, or claiming a rollback exercise** — WF-P16, per Open Question 1.
- **Any contract in `plugins/foreman-line/contracts/` and any validator surface** — named in
  the map, never modified.
- **`plugins/foreman-line/docs/specs/INDEX.md`** — SPEC-CONVENTION §2 mandates it and it does
  not exist in this repository. Creating it is a separate chartered change, not a WF-P0
  side effect. WF-P0 records the gap.
- **The charter, the loop directive, `reconciliation.md`, `plan-review-findings.md`, the
  goal index, and every kickstarter.** If one of them is wrong, that is a finding for the
  coordinator (and, for a ratified decision or the graph, a Gate 1 matter).
- **`foreman-kernel` and `hierarchical-coordination-sidecars` files** — charter D7.
- **Any provider call, spend, secret access, credential-value read, merge, PR, push, or
  default-route action.**
- **Read-only inventory tooling** — see Open Question 2. Docs-only is the recommendation; if
  the coordinator rules for tooling, this spec is amended before dispatch.

## Inventory Scope

**In scope — eight packages, role/authority-relevant surfaces:** `routing-policy` (roles,
classes, tiers, data classification, shadow routes, the validator's enforced invariants);
`permission-profiles` (the six profiles, `PROFILE_NAMES`, the schemas, the emitter, the
session-start-load bound); `dispatch` (the routing-evaluation engine's inputs/outputs and
receipt, the approval-CLI dispatch path); `verification` (the adversarial-review dispatch path
and its profile choice); `spec-linter` (what frontmatter authority it actually validates, and
what it does not); `contracts` (the stage-envelope and correlation surface — named and cited,
not described field by field); `receipts` (the chain path convention and hash domain — named
and cited); and `skills` (below).

**Plus repository CI** (`.github/workflows/`), inventoried but counted separately — it is not
a package under `plugins/foreman-line/`.

**`skills/` — the prose role definitions.** All eight files under
`plugins/foreman-line/skills/` are accounted for, and the role-relevant content of these four
is inventoried: `goal/SKILL.md` (the `/goal` coordinator entry point — the prose definition of
the coordinator role, its lifecycle, and its gates); `foreman-shaping/SKILL.md` (the Stage A
shaping role); `parcel-driven-development/SKILL.md` (parcel mechanics and the densest
role-vocabulary surface in the package, plus its three templates); and `ai-council/SKILL.md`
with `references/seats.template.md`. Every entry drawn from this directory is labelled
`documentation-only` or `asserted` per AC1 — a `SKILL.md` enforces nothing at any process
boundary. **That labelling is the point:** the map must show the reader, side by side, that
the role vocabulary agents actually read lives in unenforced prose while the registry's three
roles live in a schema with `additionalProperties: false` and a validator that fails the
policy load. The map records that contrast explicitly rather than leaving it to be noticed.
`ai-council` additionally gets one recorded observation: it defines a multi-model dispatch
path over external model CLIs that no entry in `routing-policy.yaml` registers, governs, or
bounds — recorded as a current-state fact with its citation, not as a defect for WF-P0 to fix.

**Explicitly excluded — seven, one line each, labelled `not inventoried — out of WF-P0
scope`:** `approval`, `integration`, `projection`, `registration`, `schema-scaffold`,
`shaping`, `skill-injection`. A later parcel may extend the map; WF-P0 draws the line here so
a reader knows where the map stops.

**Accounting:** 8 inventoried + 7 excluded = 15 directories under `plugins/foreman-line/`
excluding `docs/`, plus repository CI counted separately. Per AC8 the map states this sum.

**Goals:** all goal directories under `plugins/foreman-line/docs/goals/` are listed by name
with their charter-declared status and owner, cited. Only `heterogeneous-agent-worker-fabric`
is described in any depth.

## Context & References

- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/charter.md` — D1–D8, the
  ratified graph, the exit criterion. Authoritative over this spec.
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/loop-directive.md` —
  standing authorizations; Gate 3 not granted.
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/reconciliation.md` — the
  claim ledger. Evidence record, not an instruction source.
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` — the dispatch table (an operational
  summary; `routing-policy.yaml`'s `roles:` map is the registry authority under D4) and, at
  its closing section, the exit-criterion-restatement rule quoted inline in step 6 above.
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` — §4.3, §4.4, §4.8.
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `plugins/foreman-line/docs/specs/done/WGT-P0A-foreman-record-reconciliation.md` — precedent
  inventory/reconciliation parcel.
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/historical-charter-source.md`
  — provenance only (D3).

## Verification Plan

**Step 0.** The builder restates this contract, states its branch, worktree, and exact base
SHA, proves the base contains `096adfb`, confirms a clean tree, lists the three Allowed Files
verbatim, and stops on any mismatch. Every dispatch including rework opens with this gate.

**Deterministic pass** — coordinator's machine, **PowerShell only**, `node -v` first, exit
codes never read through a truncated pipeline:

1. `node -v`.
2. `git rev-parse HEAD`;
   `git merge-base --is-ancestor 096adfbffebbaf1a783801a2b286f86d10f94a17 HEAD` (must
   succeed — the same gate Constraints names, stated with the full SHA so no abbreviation
   can go ambiguous); `git status --porcelain` clean.
3. `git diff --name-only origin/main...HEAD` is a subset of `## Allowed Files`;
   `git diff --check` clean.
4. Spec-linter run over the spec; advisory warnings recorded, not silenced.
5. Every `path:line-range` citation in the map resolved against the recorded base commit.
   A citation that does not resolve is a Blocker, not a typo.
6. Charter exit item 1 diffed **word by word** against the map's quotation of it. A
   paraphrase is a Blocker. The rule, stated inline because its ledger
   (`docs/transcripts/defects_lessons.md`, cited across this repo's canon as lesson #33) does
   not exist in this repository: *a parcel spec that restates a goal exit criterion can weaken
   it while appearing to implement it, so the two texts are diffed word by word; a criterion
   naming a produced artifact is satisfied only by that artifact, never by a fixture or a
   document imitating it.*

**Mandated reviewer focus questions** (WF-P0 is `architecture/risk` — two independent
frontier reviews, fresh sessions, zero builder context; hostile-input probing licensed):

- **Is the three-role claim evidenced or assumed?** Follow AC3's citations. Does the map
  name the three roles from an authoritative artifact, or does it back-fill the charter's
  phrase? Is the `verifier` = adversarial-reviewer equation labelled `asserted`, or smuggled
  in as fact?
- **Attempt the naive reading of every trust-boundary entry** (lesson #14 — for a prose
  contract, implement the wrong-but-literal reading and show the text excludes it). For each
  `enforced-mechanically` label, read the cited code and answer: does that function actually
  fail closed on the property the label names, or does the invariant live in a sibling
  function that this path never calls?
- **Does the map overstate any envelope?** Specifically: could a reader come away believing
  the reviewer envelope prevents mutation, or that a subagent inherits it? Quote the sentence
  that would mislead them.
- **Is the rollback section a map or a claim?** Does it discharge only `mapped`, name WF-P16
  for the tested half, and avoid asserting exit item 1 is satisfied? Would the wording let a
  future coordinator read "documented rollback path" as "tested rollback path"?
- **Sample the negative space.** Pick three packages, schemas, or role-relevant surfaces on
  the base commit that the map does **not** mention. Is each one genuinely out of Inventory
  Scope, or is the boundary drawn where the evidence got hard?
- **Did anything mutate?** Confirm `routing-policy.yaml`, `permission-profiles.yaml`, every
  contract, every validator, and every test are byte-identical to `origin/main`, and end the
  review with an assertion of no commits and no dirty files in the reviewer worktree
  (lesson #24).

## Allowed Files

Only these exact paths may be created, edited, moved, or deleted in this parcel:

- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md`
- `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`
- `plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/wf-p0-shaping-report.md`

The third path is the Stage A shaping report — the reasoning behind this spec's decisions and
the open questions the coordinator ruled on. It was added by explicit coordinator ruling
during shaping so the parcel's paper trail carries the reasoning, not just the contract. It is
**already written and committed by the shaping session**; the builder does not author it. A
builder needing to correct something in it stops and reports rather than editing it, because
it is a record of what shaping concluded, not a live document.

Any required path outside this list is a stop-and-report condition requiring a
coordinator-ratified amendment. No glob or directory shorthand grants mutation authority, and
an agent must not expand its own authority because a related edit appears useful.

## Open Questions

**All seven questions were ruled by the coordinator on 2026-09-03 and are recorded below as
`RULED`. Nothing in this section is open.** The rulings are binding on the builder exactly as
the rest of this spec is; the recommendations are retained beside them so a reviewer can see
what was proposed and what was decided. The full lint is at
`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/wf-p0-shaping-lint.md` and
the shaping reasoning at `wf-p0-shaping-report.md` in the same directory. Questions 1 and 4
were the ones that changed the parcel's shape: Q1 fixed the boundary between WF-P0's `mapped`
and WF-P16's `tested`, and Q4 was amended by the coordinator over the shaper's
recommendation.

1. **Does exit item 1's "tested" belong to WF-P0?** Recommendation: **no** — WF-P0 maps and
   specifies the rollback test; **WF-P16** implements and exercises it. AC9 is written to that
   ruling. Full evidence and reasoning are in the shaping report.
2. **Docs-only, or docs plus read-only inventory tooling?** Recommendation: **docs-only.**
   Tooling is code — tests, a dependency allowlist, a package home that collides with WF-P2's
   registry ownership and with this parcel's "no validator surface" bar. The loop directive's
   "at most" is permission, not a requirement. Rot is mitigated without code by `base_commit:`
   plus per-entry `path:line-range` citations, which make staleness mechanically detectable by
   any later reader. A regenerator is a reasonable later parcel; shaping it now is shaping
   ahead.
3. **Does "three-role" have an on-disk referent?** Recommendation: **yes, but not in the
   dispatch table** — record the conflict, do not resolve it. See the shaping report.
4. **Is the Inventory Scope split right?** **RULED (coordinator lint L-1) — split amended.**
   The logic of the split is accepted; the original counts were wrong three ways (fourteen
   directories, "eight packages" that included non-package CI, "six excluded" against a list
   of seven) and `plugins/foreman-line/skills/` fell through the boundary entirely. Ruled:
   fifteen directories, **`skills/` is in scope**, eight inventoried plus repository CI
   counted separately, seven excluded, and the map states the arithmetic. AC8 and Inventory
   Scope above are rewritten to that ruling.
5. **Is the four-class evidence taxonomy right?** Recommendation: as written in AC1.
   `enforced-conditionally` is the class that matters; without it, permission envelopes get
   filed as enforcement and the map overstates the system.
6. **Filename, ticket key, and artifact path.** Three sub-questions. (a) **RULED — keep
   `ticket: KONE-TBD` with the precedent's trailing comment, and keep the parcel-ID
   filename.** Checked against the `ticket:` field rather than filenames alone: `W0-P1`,
   `W0-P4`, and `P1-permission-profile-registry-schema` all use exactly the
   placeholder-plus-comment form; only `WGT-P0A` uses its parcel ID. Dominant precedent wins,
   and the comment stops the field reading as unfilled. The `WF-P0-…` filename is accepted as
   a documented deviation from SPEC-CONVENTION §2 (21 of 22 specs in `done/` deviate the same
   way), not as a defect. Frontmatter above matches this ruling. (b) The map lives at
   `docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md` —
   goal-local evidence alongside `reconciliation.md`, not `core/` (§2 caps `core/` at 3–5
   always-loadable documents; this is point-in-time evidence). (c) "Versioned" means
   `map_version:` + `base_commit:` + `taken_at:` + a revision log — **not** a digest. WF-P17
   and WF-P18 own digest binding; minting a hash domain here would fork it.
7. **Permission profile for the builder.** **RULED — dispatch under `builder-architecture`,
   record the registry gap as a WF-P0 finding.** Frontmatter matches. The gap is confirmed by
   the coordinator and is real; fixing it belongs to the `permission-profile-registry` goal,
   not to this parcel, and stays in Out of Scope. Recorded mismatch: the profile that
   *describes* this parcel's work
   is `shaping-agent` (docs-only), but its envelope denies `Edit(plugins/**)` and
   `Write(plugins/**)` while allow-narrowing to `docs/**` — and this repository's specs and
   goal docs live under `plugins/foreman-line/docs/`. No registered profile fits a docs-only
   builder in this monorepo layout. Recommendation: dispatch under `builder-architecture` and
   record the gap as a WF-P0 finding; amending the registry belongs to its own goal, not here.
