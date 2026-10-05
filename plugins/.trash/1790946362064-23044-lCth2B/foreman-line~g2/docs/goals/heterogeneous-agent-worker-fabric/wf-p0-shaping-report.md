# WF-P0 Shaping Report — Topology and Authority Inventory

**Parcel:** WF-P0 — topology and authority inventory
**Goal:** `heterogeneous-agent-worker-fabric`
**Stage:** A (shaping). Produces a spec, not code.
**Session:** Claude Code shaping agent, 2026-09-03
**Worktree:** `D:\Repos\agent-skills-worktrees\hwf-wf-p0-shaping-20260903`
**Branch:** `claude/hwf-wf-p0-shaping-20260903`
**Shaped against:** `bc5ed89978ed2614e1b6e5e1016bac1a22dbb68b` (contains
`096adfbffebbaf1a783801a2b286f86d10f94a17`, routing policy v0.3)
**Spec produced:** `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`
**Status:** `draft`. The coordinator, not this session, decides when shaping is done.

This file exists by explicit coordinator ruling during shaping: the reasoning behind the
spec's decisions belongs in the parcel's paper trail rather than in a chat transcript. It
records what shaping concluded and why. It is not a live document — a later session that
disagrees with something here records the disagreement elsewhere rather than rewriting this.

---

## 1. Step 0 — restatement

**Scope as understood from the charter.** One parcel, wave 0, no dependencies, risk
`critical`, routing class `architecture/risk`. Deliverable per the ratified graph
(`charter.md:64`): *"Current three-role topology, trust-boundary, package, and rollback-path
map."* Binding scope is that graph row, decisions D1, D2, D3, D5, D7, D8, and exit criterion
item 1. Discovery only: no provider call, no spend, no credential value, no contract or
validator mutation. Its purpose is that seventeen downstream parcels inherit this picture, so
an entry that cannot be independently re-verified is a liability rather than content.

**Exit-criterion wording binding this session**, verbatim from `charter.md:102`:

> the current three-role path is mapped and remains a tested rollback path

The spec quotes that string verbatim in AC9 and paraphrases it nowhere.

**Files created by this session.** Two: the spec, and this report (the latter under a
coordinator write grant folded into `## Allowed Files` and `surfaces:`).

**What was wrong or underspecified in the shaping directive.** Four items; none blocked
authoring, so authoring proceeded in the same session.

1. **The directive's premise on the three-role question was inverted** — see §4 (Q3). It
   framed the question as "the dispatch table lists five, the charter says three, flag the
   discrepancy," when an authoritative three-role referent does exist on disk. A shaper who
   accepted the framing would have written a false finding into a document seventeen parcels
   inherit. The coordinator has since confirmed the premise was wrong and corrected it.
2. **Lesson #33 is not in `STANDING-CONSTRAINTS.md`.** That file's rules are #22, #28, #30,
   #31, #19, #34, #36, #29, #23, #12, #14, #24, #32; `grep -c '#33'` returns 0. #33's rule
   text lives only in `COORDINATOR-PATTERN.md:81` and `charter.md:130-131`. Because
   STANDING-CONSTRAINTS is what dispatch kickstarters include by reference, a WF-P0 reviewer
   reading only that file never sees #33 — yet AC9 and deterministic-pass step 6 depend on it.
   **Ruled:** the coordinator quotes #33 inline into both WF-P0 review kickstarters; the spec
   states the requirement in AC9's own terms and carries no provenance citation.
3. **The mandated frontmatter conflicted with `SPEC-CONVENTION.md` §2** — resolved by the
   Q6a ruling in §4.
4. **The directive said nothing about base lineage**, which turned out to be the largest
   single risk to the parcel. See §2.

---

## 2. Base-lineage finding and its two consequences

**The finding.** This goal's coordinator and shaping branches did not contain the current
`routing-policy.yaml`.

- Original shaping HEAD was `daadfbd`; `git merge-base --is-ancestor 096adfb daadfbd`
  returned false. Commits on `main` absent from that lineage: `096adfb` ("retarget routing
  policy to OpenRouter (v0.3)") and its merge `5ce6ddc` (PR #15).
- On that lineage, `plugins/foreman-line/routing-policy/routing-policy.yaml` was **v0.1**:
  frontier tier `[claude-opus-4-8]`, populated `shadow_routes.cerebras-shadow`.
- On `main` it is **v0.3**: frontier is four OpenRouter slugs, and `shadow_routes: {}`.

Root cause, per the coordinator: the coordinator worktree was based on the prior coordinator's
tip `cba257e` (descended from PR #14), and PR #15 landed after it. The v0.3 facts were
verified in the main checkout and the resulting lint claim was written into a charter living
on a branch where the file was still v0.1.

### Consequence 1 — the charter's lint provenance

`charter.md:170-178` opens *"Coordinator lint applied at ratification, verified on disk rather
than from A1's prose,"* then asserts v0.3 facts: four `routing_class` values, and
`data_classification` keys exactly `public` / `internal` / `restricted`. Those are true on
`main` and false on the lineage the charter itself sat on.

**The conclusions survive; only the provenance sentence was wrong.** Verified independently
during shaping: `routing-policy/src/validator.ts` defines

```
KNOWN_FRONTIER_MODELS = [
  'anthropic/claude-opus-5',
  'anthropic/claude-fable-5.1',
  'openai/gpt-5.6-sol',
  'openai/gpt-5.5',
  'google/gemini-3.1-pro-preview',
]
```

and v0.3's `model_tiers.frontier` lists `anthropic/claude-opus-5`, `openai/gpt-5.6-sol`,
`google/gemini-3.1-pro-preview`, `anthropic/claude-fable-5.1` — all four present in the
anchor. So validator invariant 5 (frontier-tier anchoring) passes, and the A1 lint
conclusions closing FL-HWF-02 and FL-HWF-05 hold. Only the sentence claiming *which* disk was
checked overstated. The coordinator has corrected the charter's wording to name the checkout;
no ratified amendment needed re-opening.

### Consequence 2 — the inventory itself

Had the builder worktree been cut from the coordinator branch rather than post-merge `main`,
WF-P0 would have recorded v0.1 as current: Anthropic-only tiers, `claude-opus-4-8` as the sole
frontier model, and a live `cerebras-shadow` route. Seventeen parcels would have inherited
that.

The spec therefore makes the base a hard Constraint with a mechanical Step 0 gate
(`git merge-base --is-ancestor 096adfb… HEAD` must succeed), repeated as deterministic-pass
step 2. **The gate is retained even though the specific hazard is now closed by the rebase**,
per coordinator ruling: the next worktree could be cut from anywhere, and the gate is what
catches it.

One knock-on was flagged and has been ruled on. Rebasing changed what the spec's own factual
claims described — the Constraints base paragraph asserted a v0.1 lineage that no longer
existed, which would have put a builder's Step 0 in direct contradiction with the repo. Ruled:
rewrite that paragraph to pin the post-rebase SHA and demote the v0.1 warning to one
historical sentence, keeping the gate. **AC10 was ruled to stand verbatim** — the
`reconciliation.md` contradiction it records is real and independent of lineage:
`reconciliation.md:20` still lists "the public-only Cerebras shadow boundary" as
`verified_current`, while `routing-policy.yaml:169` on the current base reads
`shadow_routes: {}`. The map records the delta; it does not edit the ledger.

---

## 3. Question 1 — does exit item 1's "tested rollback path" belong to WF-P0?

**Recommendation: no. WF-P0 maps the path and specifies the rollback test; WF-P16 implements
and exercises it.** (Option (ii) as posed by the directive.) **Ruled: accepted.** The
coordinator carries the consequence at goal level — exit item 1 is not satisfied at WF-P0
closure and is recorded as an open exit condition.

Evidence, in descending weight.

**(1) WF-P0's own graph row says "map," not "test."** `charter.md:64`: *"Current three-role
topology, trust-boundary, package, and rollback-path **map**."* The graph is the ratified
statement of each parcel's deliverable, and the noun it chose was `map`.

**(2) WF-P16's row already claims the artifact.** `charter.md:80`: *"Quality/cost/latency
audit, model upgrade procedure, and **exercised rollback path**."* Two parcels cannot both own
it, and only one of the two rows uses a verb of execution.

**(3) Exit item 9 corroborates the assignment.** `charter.md:118`: *"rollback and
model/version upgrade gates are **exercised**."* Item 9 is item 1's second clause restated at
the operational level, and WF-P16's dependency set (`WF-P3, WF-P6, WF-P12`) is exactly the
machinery required to exercise a rollback.

**(4) The structural argument — the decisive one.** A rollback path is a path *back to* the
three-role path *from something else*. WF-P0 sits in wave 0 with **no dependencies**. At WF-P0
time nothing has been bound, routed, or promoted: the three-role path is not one option among
several, it is the only path that exists. **There is nothing to roll back from.** A rollback
cannot be exercised against a system state that has not yet been created.

Concretely, exercising a rollback requires at minimum:

- **WF-P3** — provider-neutral invocation seam, so a non-frontier lane can be called at all;
- **WF-P5** — dispatch binding, so a role/model/envelope binding exists that could be
  reverted;
- **WF-P6** — the deterministic router, so there is a routing decision to switch back.

All three depend, directly or transitively, on WF-P0. **Reading (i) — that WF-P0 must itself
produce an executable test exercising the rollback path — therefore makes the ratified graph
circular:** WF-P0 would need artifacts from parcels that cannot start until WF-P0 finishes.
This is not a preference between two defensible readings; one of them contradicts the
dependency graph the charter ratified in the same document.

**(5) The grammar of the criterion agrees.** *"is mapped and **remains** a tested rollback
path."* `remains` is a continuing-state predicate — it describes a property the system holds
over time, not a deliverable a parcel hands over. And `charter.md:100` opens the enumeration
with *"The goal exits only when:"*. These are goal-exit conditions. Item 2 of the same list
("current-instance Gate 1 and the mandatory fresh plan review are closed") is satisfied by no
parcel at all, which demonstrates the list is not a parcel work-assignment. Reading item 1 as
a WF-P0 work order requires reading the list inconsistently.

**(6) Lesson #33 cuts in both directions, and that is the point.** Its rule is that a
criterion naming a produced artifact is not satisfied by a document describing one — which is
why WF-P0 must not claim to have satisfied item 1. But its companion clause
(`COORDINATOR-PATTERN.md:81`) is *"Parcel-level green does not roll up into goal-level
satisfied,"* which means WF-P0 going green **cannot** close item 1 no matter how the parcel is
written. The risk lesson #33 actually guards against here is not that WF-P0 under-delivers a
test — it is that a future coordinator reads a green WF-P0 chain as having discharged item 1.
That is why AC9 requires the map to state the shortfall in the artifact itself rather than
leaving it to be inferred.

**Where this reasoning hedges, labelled as such.** WF-P0 owning the *specification* of the
rollback test — its falsifiable pass condition, its required evidence, its owner — is an
interpretation of "rollback-path map," not charter text. It is the narrowest addition that
makes the map useful to WF-P16 without stretching the word `map`, and it is the reading this
session would defend, but it is interpretation and is labelled so in the spec. AC9 is written
so that a contrary ruling amends one criterion rather than reshaping the parcel.

---

## 4. Questions 2 through 7

### Q2 — docs-only, or docs plus read-only inventory tooling?

**Recommendation: docs-only. Ruled: accepted.**

The loop directive's *"documentation paths plus, at most, read-only inventory tooling"*
(`loop-directive.md:119`) is permission, not requirement.

**Cost of tooling.** It is code: it needs tests, a dependency allowlist, its own reviewer
focus questions, and a package home. Every candidate home is a collision — inside
`routing-policy/` it violates D4 and WF-P2's ownership; anywhere else it creates a
sixteenth package under `plugins/foreman-line/` that no ratified decision authorizes. It also
breaks the parcel's own bar of touching no validator surface.

**Cost of docs-only, stated honestly.** The map rots the day it merges.

**Why that cost is acceptable here.** Rot is mitigated without code by two mechanisms already
in the spec: `base_commit:` pins the tree every claim was resolved against, and every entry
above `asserted` carries a `path:line-range` citation. Together these make staleness
*mechanically detectable* — any later reader can re-resolve the citations against a newer tree
and see exactly which entries moved. That is most of what a regenerator would buy, at none of
its cost. A regenerator remains a defensible later parcel; shaping it now is shaping ahead,
which the loop directive's queue explicitly forbids.

### Q3 — what does "three-role" name, precisely?

**Recommendation: it has a real, authoritative on-disk referent — `coordinator`, `verifier`,
`builder` — and it is not in the dispatch table. Record the conflict in the map; resolve
nothing; do not amend the charter's phrase. Ruled: accepted.**

**The charter's phrase is correct.** `routing-policy/routing-policy.yaml` carries a `roles:`
map with exactly three keys (v0.1 lines 38-41; v0.3 lines 113-116 — unchanged across the
retarget, which is itself evidence the map is deliberate rather than incidental):

```yaml
roles:
  coordinator: frontier # always; D4
  verifier: frontier    # always; distinct-instance-from-coordinator is a dispatch-time property (W2-P3/W3), not expressed here
  builder: per-class
```

This is not loose YAML. `routing-policy/schemas/routing-policy.schema.json` places `roles` in
the top-level `required` set and constrains it with `required: [coordinator, verifier,
builder]` and `additionalProperties: false` — **exactly three role names, schema-enforced, no
extras admissible.** `routing-policy/src/validator.ts:85-101` then enforces that `coordinator`
and `verifier` each pin to the literal `frontier`, failing the entire policy load otherwise.
Under D4, `routing-policy` is *the single authoritative model registry*. So the most
authoritative role vocabulary in the repository says three, and the charter's phrase matches
it exactly. Provenance concurs: `historical-charter-source.md:13` and `:37` use "three-role
frontier stack" in the same sense.

**The directive's framing was inverted, in the dangerous direction.** It asserted that
`COORDINATOR-PATTERN.md`'s dispatch table "lists five roles" and invited the shaper to *"flag
the discrepancy explicitly if the honest answer is that the current path has a different
number of roles than the charter's phrase assumes."* A shaper accepting that frame reports
"the charter is wrong, it's really five" — the precise opposite of the truth, written into a
document seventeen parcels inherit. Recording this because it is a reusable lesson about
directive authoring: a leading question with an embedded factual premise nearly manufactured
a false finding in the parcel whose entire purpose is catching false premises.

**Three vocabularies disagree on disk, and the disagreement is structural.**

| Surface | Count | Names |
|---|---|---|
| `routing-policy.yaml` `roles:` (D4-authoritative, schema-pinned) | **3** | `coordinator`, `verifier`, `builder` |
| `COORDINATOR-PATTERN.md:61-67` dispatch table | **5 rows / 4 distinct** | Coordinator; Builder (standard risk); Builder (architecture/risk); Adversarial reviewer; Shaping agent |
| `permission-profiles.yaml` / `permission-profiles/src/types.ts` `PROFILE_NAMES` | **6** | `coordinator`, `builder-standard`, `builder-architecture`, `reviewer-readonly`, `shaping-agent`, `builder-deps` |

The dispatch table's "five" is five *rows*, not five roles: builder appears twice as two
model tiers of one role. That is where the directive's count came from.

**The two mismatches that matter:**

1. **`verifier` is a schema-required, validator-pinned registry role with no permission
   profile and no dispatch-table row under that name.** The nearest surface is
   `reviewer-readonly`, which `verification/src/adversarial/` selects for review dispatch.
   **No code links `roles.verifier` to `reviewer-readonly`.** `roles:` is read only by the
   frontier-pin check; the dispatch-time evaluator never reads it at all
   (`dispatch/src/routing-eval/index.ts:69-76` — `RoutingInput` is
   `{routing_class, data_classification, workflowId}`, no role parameter anywhere in the input
   path or the emitted receipt). So the identification "registry verifier = adversarial
   reviewer" is universally assumed and mechanically unbacked. **That is exactly the
   unexamined load-bearing assumption WF-P0 exists to catch**, which is why AC3 requires it to
   be labelled `asserted`.
2. **`shaping-agent` and `builder-deps` have envelopes but no registry role at all** —
   authority surfaces entirely invisible to the authoritative role vocabulary.

**Why record rather than reconcile.** The charter is not wrong on the count, so there is
nothing to correct at Gate 1 on that axis. But the phrase is ambiguous in a load-bearing way:
the natural reading maps it onto the dispatch table and finds five, which is what happened to
the directive's author. The fix belongs in WF-P0's map — name the three from the registry,
print the three-way mapping table, label every cross-vocabulary equation per AC1. That
converts a latent ambiguity into a cited artifact without any parcel re-deciding ratified
text. The part that *is* a Gate 1 matter is in §6, item 2.

### Q4 — inventory scope and its boundary

**Recommendation as originally written: rejected in its counts, accepted in its logic. Ruled
(coordinator lint L-1): amended.**

The original split was wrong three ways and let one directory fall through the very boundary
the criterion exists to draw:

- "fourteen packages" — there are **fifteen** directories under `plugins/foreman-line/`
  excluding `docs/`;
- "eight packages" in scope counted `.github/workflows/` as the eighth, but CI is not a
  package under `plugins/foreman-line/`, which made the total irreconcilable against any
  directory listing;
- "six excluded" sat above a list of **seven** names.

`plugins/foreman-line/skills/` appeared in neither list. **Ruled: `skills/` is in scope**, and
the reasoning is stronger than a completeness argument. It holds `goal/`, `foreman-shaping/`,
`parcel-driven-development/` and `ai-council/` — the prose definitions of the coordinator and
shaping roles, including the `/goal` skill that is the coordinator's own entry point. Measured
role-vocabulary density (`grep -rcE "coordinator|builder|verifier|reviewer|shaping agent"`):
31 hits in `parcel-driven-development/SKILL.md`, 6 in `goal/SKILL.md`, 2 in
`foreman-shaping/SKILL.md`. For a parcel whose deliverable is a role-topology map, the
directory defining what the roles *do* is among the most relevant surfaces in the repository.

Entries drawn from it are labelled `documentation-only` or `asserted` per AC1 — a `SKILL.md`
enforces nothing at any process boundary. **That labelling is the deliverable's most useful
single statement:** the role vocabulary agents actually read lives in unenforced prose, while
the registry's three roles live in a schema with `additionalProperties: false` behind a
validator that fails the policy load. Thirty-one unenforced mentions against one schema
constraint. The map records that contrast explicitly rather than leaving it to be noticed.

**Final accounting, which AC8 now requires the map to state:**

| | Count | Members |
|---|---|---|
| Inventoried | **8** | `routing-policy`, `permission-profiles`, `dispatch`, `verification`, `spec-linter`, `contracts`, `receipts`, `skills` |
| Excluded, labelled `not inventoried — out of WF-P0 scope` | **7** | `approval`, `integration`, `projection`, `registration`, `schema-scaffold`, `shaping`, `skill-injection` |
| **Total under `plugins/foreman-line/` excluding `docs/`** | **15** | reconciles against `ls` |
| Repository CI (`.github/workflows/`) | +1, counted separately | not a package under `plugins/foreman-line/` |

One additional observation recorded during the `skills/` sweep, worth the coordinator's
attention: **`ai-council` defines a multi-model dispatch path over external model CLIs (Grok,
Codex, Claude, Gemini) that no entry in `routing-policy.yaml` registers, governs, or bounds.**
In a goal whose objective is a *governed* heterogeneous worker fabric, the discovery that an
ungoverned multi-model dispatch path already ships in the repository is material. It is
recorded in the map as a current-state fact with its citation — not as a defect for WF-P0 to
fix, and not (yet) as an acceptance criterion. The coordinator may wish to promote it.

### Q5 — trust boundaries: what counts, and what evidences one

**Recommendation: the four-class taxonomy. Ruled: accepted.**

- `enforced-mechanically` — a schema, validator, or test that fails closed, cited to both the
  code that fails and the test that proves it fails;
- `enforced-conditionally` — enforcement holds only under a stated precondition, which is
  named;
- `documentation-only` — an artifact declares an intent that nothing enforces;
- `asserted` — prose only, no artifact.

**`enforced-conditionally` is the load-bearing class.** Without it, permission envelopes get
filed as enforcement and the map overstates the entire system — the specific failure the
directive warned against. AC6 pins the honesty requirements: an envelope constrains only a
session that actually loads the emitted worktree-local `.claude/settings.local.json`; it is
inert for an Agent/Task-tool subagent sharing the parent's already-loaded settings; it is void
under bypass mode; and for a shell-capable profile the deny list enumerates *commands*, so
fix/commit capability is **reduced, not eliminated**.

`permission-profiles/README.md:97-121` and `permission-profiles/PROBE.md` are unusually candid
prior art on exactly this — PROBE.md states plainly what its manual procedure proves and what
it does not. The map should quote them rather than summarize; a summary is where the overstatement
would creep back in.

### Q6 — artifact path, filename, ticket key, versioning

**(a) Ticket key and filename. Ruled: keep `ticket: KONE-TBD` with the corpus's trailing
comment, and keep the parcel-ID filename.** The original recommendation was `ticket: WF-P0`,
on the grounds that a bare `KONE-TBD` fails SPEC-CONVENTION §2's "the ticket key in the
filename is mandatory." The coordinator checked the `ticket:` *field* rather than filenames
alone and found dominant precedent the other way: `W0-P1`, `W0-P4`, and
`P1-permission-profile-registry-schema` all use exactly

```
ticket: KONE-TBD            # register via jira-workflow at Stage B; replace before dispatch
```

with only `WGT-P0A` using its parcel ID. Dominant precedent wins, and the comment stops the
field reading as unfilled. The `WF-P0-…` filename is accepted as a documented convention
deviation (21 of 22 specs in `done/` deviate identically), not as a defect. The spec matches
this ruling, including the precedent's column alignment.

**(b) Artifact path. Ruled: accepted as recommended.**
`plugins/foreman-line/docs/goals/heterogeneous-agent-worker-fabric/topology-and-authority-inventory.md`
— goal-local evidence alongside `reconciliation.md` and `plan-review-findings.md`, consumed by
seventeen parcels of this goal. Not `core/`: SPEC-CONVENTION §2 caps `core/` at 3–5
always-loadable documents, no such directory exists at that path today, and this is
point-in-time evidence rather than stable substrate.

**(c) What "versioned" means. Ruled: accepted as recommended.** A header carrying
`map_version:` (semver, opening at `0.1.0`), `base_commit:` (the exact 40-character SHA every
claim was resolved against), `taken_at:` (ISO-8601), and a `## Revision log` table.

**Deliberately not a digest.** WF-P17 (evidence-binding verifier) and WF-P18 (exit evidence
manifest) own digest binding under the A1 exit-evidence clarification. Minting a second hash
domain here would fork that authority — the same single-authority logic D4 applies to the
registry. A map that hashed itself under its own scheme would create exactly the second
authority the charter forbids elsewhere.

### Q7 — authority inventory: whose authority, over what

**Recommendation: two hard-separated layers. Ruled: accepted; dispatch under
`builder-architecture` and record the registry gap as a WF-P0 finding.**

**Layer 1 — goal-level gate authority. Charter-locked, cite-only, never re-decided.** Gate 1
closed (`charter.md:135`); Gate 2 granted for WF-P0 only (`charter.md:138`); Gate 3 not
delegated, every parcel merge and — separately and human-exclusively — default-route
activation remain the developer's (`charter.md:142`).

**Layer 2 — runtime authority a dispatched agent actually holds. This is what WF-P0 maps.**
Per registry role and per permission profile: write scope, shell access, `network.egress`
value, tool set, model-tier pin, and the enforcement condition (loaded / inert / void). Plus
every `.claude/settings.local.json` emission site with its output-path expression, projected
JSON shape, and whether anything in-repo actually drives it.

A note for whoever reads AC7's output: the emitter is reachable programmatically from
`dispatch/src/approval-cli/`, but that path ships no CLI entry point, so the only *driven*
surfaces today are the `permission-profiles` CLI and the adversarial-review dispatch path in
`verification/src/adversarial/`. The map must say so, or it implies automation that does not
exist.

---

## 5. Findings surfaced during shaping

Each was verified on the shaping base. The first four are pinned by AC5; the remainder are
recorded here and, where noted, in the map.

| # | Finding | Evidence |
|---|---|---|
| F-1 | `roles.builder: per-class` is read by no code outside the policy validator | `routing-policy/src/validator.ts:85-101` reads only `roles.coordinator` and `roles.verifier` |
| F-2 | The dispatch-time routing evaluator takes **no role** as input | `dispatch/src/routing-eval/index.ts:69-76`; consumption at `:151-224`; no role in the emitted receipt. Coordinator-confirmed. |
| F-3 | No CI workflow runs any `plugins/foreman-line` validator | `.github/workflows/` contains exactly `test-plugin-install.yml`, which validates root `skills/` and plugin packaging. Coordinator-confirmed. |
| F-4 | `## Allowed Files` is enforced by no validator | `spec-linter/src/validate.ts:142-156` slices the frontmatter block and discards the body; no `*.ts` under `spec-linter/` references the section |
| F-5 | No registered permission profile fits a docs-only builder in this monorepo | `shaping-agent` denies `Edit(plugins/**)` / `Write(plugins/**)` and allow-narrows to `docs/**`, but this repo's specs and goal docs live under `plugins/foreman-line/docs/`. Deny beats allow, so a session that actually loaded that profile could not write this goal's specs. Structurally incompatible with SPEC-CONVENTION §2's monorepo rule. Fix belongs to the `permission-profile-registry` goal. |
| F-6 | `plugins/foreman-line/docs/specs/INDEX.md` does not exist | SPEC-CONVENTION §2 mandates it; §6 makes it part of what an agent session loads. `docs/specs/` holds only `active/` and `done/`. Coordinator-confirmed. Out of scope for WF-P0; the map records the gap. |
| F-7 | The spec-linter cannot run in a fresh worktree | `npx tsx src/cli.ts` fails with `Cannot find package 'ajv'`; no `node_modules`. `npm ci` was declined as a mutation outside shaping authority. **Deterministic-pass step 4 assumes the linter runs — the builder's worktree needs `npm ci` first.** Frontmatter was instead hand-checked against `spec-linter/schemas/spec-frontmatter.schema.json`: `additionalProperties: false` with all thirteen keys declared, required set complete, `risk: critical`, `routing_class: architecture/risk`, `permission_profile: builder-architecture` present in the P4 enum, both original `surfaces:` entries under the known `plugins/` prefix. |
| F-8 | `ai-council` defines an ungoverned multi-model dispatch path | `skills/ai-council/SKILL.md` and `references/seats.template.md` name external model CLIs; nothing in `routing-policy.yaml` registers or bounds them. See Q4. |
| F-9 | `spec-linter/README.md` is stale on `permission_profile` | The README still describes the field as "optional and unconstrained beyond non-empty string if present," but P4 landed enum validation against `PROFILE_NAMES`. Documentation-only defect, outside WF-P0's Allowed Files; recorded for whoever next touches that package. |

---

## 6. What may be wrong with the ratified charter or graph

Gate 1 matters. Neither the shaping agent nor the coordinator resolves these; they are
recorded so the developer can rule.

**1. Exit item 1's second clause is assigned to no parcel by the charter's own text.** The §3
conclusion is an inference chain — a strong one, but the charter never states that WF-P16 owns
item 1's "tested" half. WF-P16's row says *"exercised"*; item 1 says *"tested"*; item 9 says
*"exercised."* Three ratified sentences use the two words as if synonymous without ever
equating them. The goal's exit therefore depends on a criterion whose owner exists only by
reading, and whose bar is unstated. **Warrants a scoped Gate 1 clarification:** one sentence
naming the parcel that discharges item 1's second clause, and settling whether "tested" and
"exercised" are the same bar. AC9 is written so a contrary ruling amends one criterion.

**2. "Three-role" is load-bearing for a harness, not merely for prose — the sharper risk.**
`charter.md:75`, WF-P11: *"Same classified corpus run through the current three-role path with
comparable quality, cost, and latency evidence."* If the three roles are
coordinator/verifier/builder — which §4's evidence establishes — then WF-P11 must run a corpus
through a path containing a **`verifier` role that no permission profile names, no
dispatch-table row names, and no code resolves**, its only linkage being the mechanically
unbacked assumption that `verifier` means the adversarial reviewer. WF-P11 is two waves out,
so there is time; but a graph-level ambiguity that WF-P0 will merely *document* is one WF-P11
will *trip over*. **Warrants a Gate 1 clarification of what "the current three-role path"
denotes operationally** — ideally settled by WF-P1's contract work rather than discovered at
WF-P11.

**3. Routing-class cost — not a Gate 1 matter, but input to the coordinator's carried open
item.** WF-P0 is priced `critical` / `architecture/risk` for a docs-only parcel: a frontier
builder plus two frontier adversarial reviews for one Markdown file. **This session's view:
do not demote it.** Seventeen parcels inherit the document; its entire value is the accuracy
of roughly sixty individually falsifiable claims; and claim-checking against disk is precisely
what a second independent reviewer catches that a first one misses (lesson #12's own
provenance: two frontier reviews of W0-P4 agreed on every focus question and only one found
the blocker). WF-P16 and WF-P13 remain the right demotion candidates.

**4. `charter.md:170-178`'s "verified on disk" wording** — covered in §2. A provenance-wording
matter, not a Gate 1 re-open; the coordinator has corrected it, and the underlying lint
conclusions were independently re-verified and hold.

---

## 7. Acceptance Criteria summary

Thirteen criteria, each checkable against disk by a reviewer with no builder context. Full
text in the spec.

| AC | Requires |
|---|---|
| AC1 | Four evidence classes defined and used exclusively; every entry carries exactly one label plus a `path:line-range` citation for anything above `asserted`. This is the answer to the "map is complete and accurate" failure mode. |
| AC2 | Header carries `map_version: 0.1.0`, `base_commit:` (must contain `096adfb`), `taken_at:`, and a revision log; no entry cites a path outside that commit. |
| AC3 | Three roles named from the registry with schema citation; three-way vocabulary mapping table; every cross-vocabulary equation individually labelled; the `verifier` = adversarial-reviewer equation labelled `asserted`; no silent winner picked. |
| AC4 | Role-authority table covering three registry roles and six permission profiles — tier pin, write scope, shell, `network.egress`, tool set, enforcement condition; frontier pin cited to the rejecting validator function and its test. |
| AC5 | Findings F-1 through F-4 present with citations. If the builder finds one false on the recorded base, it records the contradiction with evidence and stops for a ruling rather than deleting the row. |
| AC6 | Envelope enforcement stated at real strength, not above it: load-bound, inert under subagent, void under bypass, reduced-not-eliminated for shell-capable profiles. Paired `git status` detection control labelled `documentation-only` absent code that runs it. |
| AC7 | Every `.claude/settings.local.json` emission site enumerated with output-path expression, projected JSON shape, and whether anything in-repo drives it. |
| AC8 | All fifteen directories named; 8 inventoried, 7 excluded with the literal out-of-scope label, CI counted separately; the map states 8 + 7 = 15 so a reviewer holding `ls` reconciles it in one pass. |
| **AC9** | **See below.** |
| AC10 | Reconciliation-ledger deltas recorded with evidence (known instance: the Cerebras shadow entry against `shadow_routes: {}`); the ledger itself not edited. |
| AC11 | `foreman-kernel` and `hierarchical-coordination-sidecars` recorded as separately owned per D7, with on-disk status and any consumable interface; no file of theirs modified, no serialization point claimed. |
| AC12 | `git diff --name-only origin/main...HEAD` a subset of `## Allowed Files`; `git diff --check` clean; no package source, schema, policy, profile, contract, validator, or test touched. |
| AC13 | Two independent frontier adversarial reviews return PASS with no unresolved Blocker, High, or Medium finding. |

**AC9 in full — what it asserts.** Four things, all checkable:

1. The map defines the current three-role path **as the rollback target** — the exact registry
   state, role pins, and dispatch behaviour a rollback must restore, each cited.
2. It records a **rollback test obligation**: what must be exercised, the falsifiable pass
   condition, and the required evidence — and states in the same section that WF-P0 neither
   implements nor runs it.
3. It quotes charter exit item 1 **verbatim** — *"the current three-role path is mapped and
   remains a tested rollback path"* — states that WF-P0 discharges only `mapped`, and names
   **WF-P16 — observability and rollout operations** (`charter.md:80`, deliverable *"exercised
   rollback path"*) as owner of the tested half, cross-referenced to exit item 9
   (`charter.md:118`).
4. The map **must not claim exit item 1 is satisfied by WF-P0.**

AC9 closes by binding a contrary coordinator ruling to a spec amendment rather than to builder
reinterpretation. Per the lesson-#33 ruling it states the requirement in its own terms and
carries no provenance citation; the coordinator quotes #33's text directly into both review
kickstarters.

---

## 8. Session close

Spec at `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`,
`status: draft`. Two rework passes applied: coordinator lint L-1 (package accounting and
`skills/` in scope) and the base-paragraph rewrite with the `ticket:` comment and the
Open Questions 4 / 6a / 7 ruling updates. AC1 and AC9 were not weakened in either pass;
`## Allowed Files` grew by exactly the one path the coordinator granted for this report.

All seven directive questions are ruled: Q1, Q2, Q3, Q5, Q6b, Q6c and Q7 as recommended, Q4
amended by L-1. Three items remain open above this session's authority and are recorded in §6
for the developer's Gate 1 decision. Shaping does not declare itself done — the coordinator
does.
