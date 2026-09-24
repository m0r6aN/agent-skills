# AGENTS.md — canon entry point

**The Foreman Line** is the pipeline this repo runs its own development
through: it turns a raw idea into a reviewed, merged change by passing it
through a fixed sequence of agent sessions and human gates (see "The stage
sequence" and "The three human gates" below). This file is that pipeline's
canon entry point for this repo.

> Every agent session in this repo reads this file first (via `CLAUDE.md`'s
> import or an equivalent entry point in another tool). It carries two kinds
> of content, kept in clearly separated sections: **static canon**, written
> once at scaffold time and not expected to change session to session, and a
> **managed region**, which this repo's own coordinator sessions read and
> write as work proceeds. Splice mechanics for the managed region (append vs.
> replace, delimiter syntax, conflict handling) are not specified here — that
> is a later stage's design, not this file's content.

## Static canon

### Stack

```yaml
stack:
  profile: <PROFILE-NAME>         # a named layout profile, OR the literal string `none`
  layout:                          # required whenever profile is not `none`; omit entirely when profile is `none`
    <LAYOUT-KEY>: <PATH>          # route roots, style roots, component roots, etc.
```

**The legal `<PROFILE-NAME>` values are enumerated in `foreman/config.yaml`'s
own schema** (in this repo's Foreman Line scaffold, per §4.4) — that schema,
not this file, is authoritative for which profile names exist. This file
states only that the field is mandatory and that `none` is a legal,
explicit value.

This repo has no UI surface: write `stack:\n  profile: none` explicitly (with
no `layout:` block) rather than omitting the `stack:` key entirely — an
absent key is treated as a refusal to declare, not as an exemption, and is
rejected the same way an absent-but-required field would be.

### Compression — explicit non-claim

`foreman/config.yaml` (this repo's Foreman Line configuration) may declare a
compression/summarization capability. If it does, note plainly: that
capability applies to the Line's own content-assembly path. **It is not, and
cannot be, applied to an individual agent session's own model-provider
traffic** — no in-session proxy exists for that. Unavailability of the
capability is an announced degradation, never a silent skip.

### Audit policy

A parcel or change declaring an elevated or critical risk level must carry a
recorded security-audit result before its final human gate. **The
audit-suite** is the scaffolded audit workflow (`.github/workflows/kds-audit.yml`
in this repo's scaffold, plugin-resolved) that selects applicable frameworks
from what the declaring spec or change already states; this binds to a field
already carried by that spec, not to a separate judgment call.

## Glossary

A compact reference for this Line's own vocabulary — every entry below is
meant to stand alone for a reader who has never seen this pipeline before.

- **The three human gates.** Every piece of work passes up to three points
  where a human, not an agent, decides whether it proceeds: **Gate 1** —
  ratifying a plan before build work starts; **Gate 2** — approving a
  build's scope once shaped into concrete units of work; **Gate 3** —
  approving the final merge of finished work into the shared codebase.
  **Gate 3 is never delegated to an agent, under any circumstance** — an
  agent may prepare a change completely and still must stop and wait for a
  human to merge it.
- **Parcel.** The unit of work this Line moves through its stage sequence:
  one spec, one builder session, one round of adversarial review, one merge.
  A goal (below) decomposes into one or more parcels.
- **Goal.** The layer above a parcel: a whole feature or initiative, carried
  by one coordinator (below) from initial idea through every one of its
  parcels to completion.
- **Coordinator.** The role that carries a goal end to end. It is a
  **human-driven agent session** — an agent session, but one a human directs
  at each gate and whose rulings it waits for; it is not an autonomous agent
  deciding on its own, and not a human acting alone without an agent session.
  "Coordinator lint" (used elsewhere in this kit as a gating step) is that
  same session's own automated check of a draft artifact against this kit's
  conventions before promoting it — a tool invocation the coordinator session
  runs, not a separate human act.
- **Risk levels.** A declared `risk:` value on a unit of work. **The legal
  values and what each one triggers are defined in `foreman/config.yaml`'s
  own schema** (this repo's Foreman Line configuration, per §4.4) — that
  schema is authoritative, not this glossary. What is fixed here: an
  elevated-or-above declaration is what triggers the mandatory
  security-audit-before-Gate-3 policy stated above; the schema's lowest
  level does not.
- **Routing class (`routing_class`).** A declared category that determines
  which model tier a dispatch resolves to and how many independent reviews
  it requires at minimum. **`foreman/routing-policy.yaml` is authoritative
  for the legal `routing_class` values, the tier→model-id mapping, and
  review counts. It is not the whole story for which tier a given dispatch
  resolves to: an `evaluateRouting` call's `role` (`builder`, `shaping`,
  `reviewer`, `coordinator`, `verifier`) caps, floors, or clamps the class's
  tier — that role→tier mapping is reviewed code inside the installed
  Foreman Line plugin, not policy-file content.**
- **Runtime profile (`runtime_profile`).** The goal-selected exact provider/model table. The only
  shipped values are `claude` and `codex`; every live dispatch supplies one with its role, and the
  routing receipt records it with the exact `resolvedModelId`. Missing, unknown, mismatched, or
  unavailable selected-profile inputs refuse rather than falling back. A named compatibility probe is
  the sole exception and records a `null` profile; it is not live dispatch authority.
- **Model tier (`<TIER>`).** The resolved capability level a `routing_class`
  maps to. **`foreman/routing-policy.yaml` and the selected runtime profile
  enumerate the legal tiers and exact model IDs**, via the plugin-provided
  `evaluateRouting` function; a session must always state its runtime profile
  and exact model, not just its tier.
- **The stage sequence a unit of work passes through:** **shaping** (turning
  a raw idea into a linted, reviewable spec) → **building** (implementing
  against that spec) → **adversarial review** (an independent, read-only
  check of the built work against its spec) → **registration** (recording
  the finished, reviewed work in this repo's own tracking — visible locally
  as a spec's `status` moving to `done` under `docs/specs/done/` and an
  entry in `docs/goals/INDEX.md`; any external tracker this is also recorded
  in is plugin-resolved, not a file this repo receives) → **merge** (Gate 3,
  human, final).
- **Loop-stop.** A point inside a coordinator's otherwise-continuing loop
  over a goal's parcels where the loop halts and reports rather than
  proceeding on its own judgment — used for anything that would otherwise
  require silently reinterpreting a frozen decision.

## Managed region — resume state

> Everything below this line is written and rewritten by this repo's own
> coordinator sessions. Do not hand-author content here beyond the initial
> empty scaffold; do not assume its shape is stable between sessions.

```
<in-flight goal: none>
<current parcel: none>
<last-known gate: none>
```
