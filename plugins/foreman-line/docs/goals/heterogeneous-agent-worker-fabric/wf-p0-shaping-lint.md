# Coordinator Lint — WF-P0 Shaping Result

**Lint run:** 2026-09-03, Claude Code coordinator session
**Spec under lint:** `plugins/foreman-line/docs/specs/active/WF-P0-topology-and-authority-inventory.md`
**Shaping branch:** `claude/hwf-wf-p0-shaping-20260903` @ `d052a28` (after coordinator rebase onto `bc5ed89`)
**Checkout the lint ran in:** `D:\Repos\agent-skills-worktrees\hwf-wf-p0-shaping-20260903`
(naming the checkout is now mandatory — see the base-lineage lesson in `loop-directive.md`)

Status: **NOT YET RATIFIED.** One fix-level finding must close before dispatch. Everything
else is accepted.

## Claims verified on disk

Every factual claim the spec makes that a downstream parcel would inherit was checked. The
shaper's citations held up under every check I ran:

| Spec claim | Verdict | Evidence |
|---|---|---|
| Three registry roles are `coordinator`, `verifier`, `builder` (AC3) | **confirmed** | `routing-policy/schemas/routing-policy.schema.json:168-174` — `roles` object, `additionalProperties: false`, `required: [coordinator, verifier, builder]`. Corroborated by `routing-policy.yaml:113-116`. |
| The dispatch-time routing evaluator takes no role as input (AC5b) | **confirmed** | `dispatch/src/routing-eval/index.ts:151-224` validates and consumes `routing_class` and `data_classification` only; no role parameter appears in the input path or the emitted receipt fields. |
| No CI workflow runs any `plugins/foreman-line` validator (AC5c) | **confirmed** | `.github/workflows/` contains exactly one file, `test-plugin-install.yml`. |
| `plugins/foreman-line/docs/specs/INDEX.md` does not exist | **confirmed** | Path absent, though SPEC-CONVENTION §2 mandates it. Correctly placed in Out of Scope as a recorded gap rather than a WF-P0 side effect. |
| Base lineage: `origin/main` = `5ce6ddc`, contains `096adfb`, policy is v0.3 | **confirmed** | Reproduced independently; this was the shaper's own finding against the coordinator. See the lesson in `loop-directive.md`. |

## Fix-level finding — must close before dispatch

**L-1. AC8's package arithmetic is wrong three ways, and one package falls through the
boundary the criterion exists to draw.**

AC8 reads: *"All fourteen packages under `plugins/foreman-line/` are listed. The eight in
Inventory Scope (below) carry a role/authority-relevant description with citations; the six
excluded carry one line each…"*

On disk there are **fifteen** directories under `plugins/foreman-line/` excluding `docs/`:
`approval`, `contracts`, `dispatch`, `integration`, `permission-profiles`, `projection`,
`receipts`, `registration`, `routing-policy`, `schema-scaffold`, `shaping`, `skill-injection`,
`skills`, `spec-linter`, `verification`.

Three counting errors compound:

1. **"fourteen" should be fifteen.**
2. **Inventory Scope's "eight" is seven packages plus repository CI.** The in-scope list is
   `routing-policy`, `permission-profiles`, `dispatch`, `verification`, `spec-linter`,
   `contracts`, `receipts` — seven — and then `.github/workflows/`, which is not a package
   under `plugins/foreman-line/`. Counting CI as the eighth package makes the total
   irreconcilable with any directory listing.
3. **The excluded list is seven, not six:** `approval`, `integration`, `projection`,
   `registration`, `schema-scaffold`, `shaping`, `skill-injection`.

7 + 7 = 14. The fifteenth directory is **`plugins/foreman-line/skills/`**, which appears in
neither list.

This is not a tidiness complaint about arithmetic. `skills/` holds `goal/`,
`foreman-shaping/`, `parcel-driven-development/`, and `ai-council/` — that is, the prose
definitions of the coordinator role and the shaping role, including the `/goal` skill that is
the coordinator's own entry point, and a SKILL.md that `grep` shows discusses roles directly.
For a parcel whose deliverable is a *role topology and authority* map, the directory defining
what the roles do is among the most relevant surfaces in the repository, and it is currently
invisible to the map — falling through precisely the inventoried/not-inventoried boundary AC8
was written to make explicit. Seventeen downstream parcels would inherit a topology map that
never mentions where the roles are described.

**Required correction.** Fix the three counts to match disk; state Inventory Scope as
"N packages plus repository CI" so the total reconciles against a directory listing; and place
`skills/` explicitly on one side of the boundary. My ruling on which side: **in scope**, with
its role-relevant content (the role definitions in `goal/`, `foreman-shaping/`, and
`parcel-driven-development/`) inventoried and labelled per AC1 — almost certainly
`documentation-only` or `asserted`, since a SKILL.md describing a role enforces nothing. That
labelling is itself valuable: it shows the reader that the role vocabulary the charter uses
lives in prose while the registry's three roles live in a schema.

## Open-question rulings

Recommendations accepted as written unless stated otherwise.

| Q | Ruling | Note |
|---|---|---|
| 1 — does exit item 1's "tested" belong to WF-P0? | **Accepted: no.** WF-P0 discharges `mapped`; WF-P16 owns the tested half. | AC9 is exactly what lesson #33 requires: it quotes the criterion verbatim, discharges only `mapped`, names WF-P16 and exit item 9, and forbids claiming item 1 satisfied. **Consequence the coordinator carries:** goal exit item 1 is *not* satisfied at WF-P0 closure and must be recorded as an open exit condition at Stage F and carried to the final report. Parcel-level green does not roll up into goal-level satisfied. |
| 2 — docs-only or read-only tooling? | **Accepted: docs-only.** | The loop directive's "at most" is permission, not a requirement. Tooling would need a package home colliding with WF-P2's registry ownership and would cross this parcel's own "no validator surface" bar. `base_commit:` plus per-entry `path:line-range` citations make staleness mechanically detectable without code. A regenerator is a defensible later parcel; shaping it now is shaping ahead. |
| 3 — on-disk referent for "three-role"? | **Accepted: yes, in the registry, not the dispatch table. Record the conflict, do not resolve it.** | Verified above. The charter's phrase is vindicated; my own shaping directive's premise was the thing that was wrong, and the shaper caught it. |
| 4 — inventory scope split | **Amended — see L-1.** | The split's *logic* is accepted; its counts and its treatment of `skills/` are not. |
| 5 — four-class evidence taxonomy | **Accepted as written.** | `enforced-conditionally` is the load-bearing class. Without it, a permission envelope gets filed as enforcement and the map overstates the system — the exact overstatement `permission-profiles`' own README exists to prevent. |
| 6a — ticket key vs filename | **Keep `ticket: KONE-TBD`, and add the precedent's trailing comment.** | I initially ruled this a documented deviation on filename-count evidence alone. Checking the `ticket:` field itself gives a better answer: 3 of 4 precedent specs (`W0-P1`, `W0-P4`, `P1-permission-profile-registry-schema`) use `ticket: KONE-TBD  # register via jira-workflow at Stage B; replace before dispatch`, while `WGT-P0A` uses its parcel ID. Follow the dominant precedent **including the comment**, so the placeholder is self-documenting rather than looking like an unfilled field. The §2 filename tension is accepted-as-documented, repo-wide and not this parcel's to fix. |
| 6b — map path | **Accepted:** goal-local, beside `reconciliation.md`. | Correctly reasoned: this is point-in-time evidence, and §2 caps `core/` at 3–5 always-loadable documents. |
| 6c — what "versioned" means | **Accepted:** `map_version` + `base_commit` + `taken_at` + revision log, **not** a digest. | The reasoning is the same single-authority logic as D4: WF-P17 and WF-P18 own digest binding, and minting a hash domain here would fork it. |
| 7 — builder permission profile | **Accepted:** dispatch under `builder-architecture`, record the registry gap as a WF-P0 finding. | The gap is real and worth recording: no registered profile fits a docs-only builder in this monorepo, because `shaping-agent` denies `Edit(plugins/**)`/`Write(plugins/**)` while this repo's docs live *under* `plugins/foreman-line/docs/`. Amending the registry belongs to the `permission-profile-registry` goal, not here. |

## Directive defects this session exposed (coordinator's own)

Recorded because the loop directive says reviews rank and owners decide, and these were mine:

1. **A planted premise nearly produced a false finding.** My shaping kickstarter asserted the
   five-row dispatch table as the role referent and invited the shaper to find the charter
   wrong. The registry says three. Corrected in the kickstarter; the standing rule is now that
   directives for this goal state premises as claims-to-verify with their evidence, never as
   background fact.
2. **A lint that did not name its checkout.** Recorded in `charter.md` and generalized in
   `loop-directive.md`.
3. **Lesson #33 is unreachable from a reviewer's reading list.** `grep -c '#33'
   STANDING-CONSTRAINTS.md` returns 0; the rule text lives only in `COORDINATOR-PATTERN.md:81`
   and the charter. Since AC9 and deterministic-pass step 6 both depend on it, **both WF-P0
   review kickstarters must quote #33's text inline** rather than cite it. Logged as an action
   on the review dispatch, not on the spec.

## Disposition

Spec is one surgical rework away from ratification. L-1 is the only blocker; the seven
open questions are ruled. Rework is dispatched back to the shaping session with its own Step 0
restate-and-stop gate, and `status:` stays `draft` until the coordinator flips it.
