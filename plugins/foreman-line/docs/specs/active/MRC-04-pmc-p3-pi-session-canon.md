---
ticket: MRC-04
title: PMC-P3 Foreman Line Pi-session canon — replace Codex-session wording, OpenRouter-only vocabulary, and no-fallback limitations with Pi-session dispatch requirements
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
risk: standard
surfaces:
  - templates/pi-routing-directive.md
  - templates/kickstarters/builder-template.md
  - templates/kickstarters/reviewer-template.md
  - templates/kickstarters/shaping-template.md
  - skills/ai-council/SKILL.md
  - skills/ai-council/references/seats.template.md
  - docs/kickstarters/foreman-line-supercharge-carryover.md
  - docs/kickstarters/foreman-line-supercharge-phase1-models.md
  - docs/kickstarters/foreman-shaping-template.md
  - docs/FOREMAN-LINE-PLAN.md
routing_class: implementation/standard
verification_class: judgment-required
---

# MRC-04 — PMC-P3: Foreman Line Pi-session canon (skills, kickstarters, docs, human-facing templates)

## Goal

Land the PMC-P3 canon outcome exactly as the owning charter states it
(`docs/goals/pi-model-configuration/charter.md:92`):

> "| 2 | PMC-P3 — Foreman Line Pi-session canon | Replace Codex-specific session/model
> wording, stale OpenRouter-only templates, and any no-fallback limitation in skills,
> kickstarters, and docs with Pi-session dispatch requirements. | docs/architecture;
> one independent review | PMC-P1, PMC-P2 |"

bounded by Amendment 01 A7 (`charter.md:200`):

> "| PMC-P3 | canon and human-facing templates only | the PMC-P2 interface — consumes it unchanged |"

and measured by exit criterion 6 (`charter.md:324-326`):

> "6. Foreman Line's skills, routing policy, templates, kickstarters, and docs no longer
> prescribe a Codex-only session shape, an OpenRouter-only model vocabulary, or the
> obsolete ban on all fallback paths."

This is docs-only wording work over the canon surfaces named by PMC-P2's handoff note
(`docs/goals/pi-model-configuration/pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:478-479`):

> "Human-facing template canon (`templates/pi-routing-directive.md`'s stale Jev and
> \"no provider specific fallback\" wording, kickstarters, docs) is PMC-P3's charter outcome
> and is untouched here."

No code, schema, policy, settings, or goal record changes. One independent review
(`charter.md:92`, wrapper `docs/goals/model-routing-chain-wrapper/charter.md:57`).

## Dependencies

- **Hard predecessors: none** (report §7 MRC-04 row, `docs/goals/goal-status-report-2026-09-27.md:105`, "Hard predecessors: —"; Lane P-A per `:92-96`).
- **PMC-P1 (landed, consumed as ratified):** the `provider-neutral-fallback-contract`
  representation (`routing-policy/routing-policy.yaml:241-243`
  `representation: provider-neutral-fallback-contract`, `version: 1`;
  `docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md:1`, `:104-106`).
- **PMC-P2 (landed, consumed unchanged — A7):** the resolver's approved route receipt and
  the launch boundary (`charter.md:108-111`). The canon text describes this interface; it
  never redefines it.
- **Rulings consumed verbatim as authority:** ruling A (single Jev surface) and ruling D
  (Pi `settings.json` two-writer race), `docs/goals/goal-status-report-2026-09-27.md:80,:83`.
- **Sequencing authority for the `templates/` paths:** `docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md:27,:52-53,:57` and `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:484`.

## Allowed Files

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden.

1. `templates/pi-routing-directive.md`
2. `templates/kickstarters/builder-template.md`
3. `templates/kickstarters/reviewer-template.md`
4. `templates/kickstarters/shaping-template.md`
5. `skills/ai-council/SKILL.md`
6. `skills/ai-council/references/seats.template.md`
7. `docs/kickstarters/foreman-line-supercharge-carryover.md`
8. `docs/kickstarters/foreman-line-supercharge-phase1-models.md`
9. `docs/kickstarters/foreman-shaping-template.md`
10. `docs/FOREMAN-LINE-PLAN.md`

## Forbidden

- Any path not listed in Allowed Files. In particular:
  - **The six scaffolder-owned template files** — `templates/foreman-config.yaml`,
    `templates/AGENTS.md`, `templates/STANDING-CONSTRAINTS.md`, `templates/spec-index.md`,
    `templates/foreman-routing-policy.yaml`, `templates/foreman-skill-injection.yaml`
    (the "excluded six", MD5-pinned at `pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:457-462`; hard bounds `docs/goals/routing-currency-and-merit/rcm-p2-scope-reconciliation-2026-09-27.md:49-52`, "the six scaffolder-owned template files stay untouched" `:138-141`).
  - **`templates/pi-openrouter-routing.json`** (SP11/O8 escalated overlap — the
    boundary-routing installability claim, `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:91,:200`; `docs/goals/foreman-line-boundary-routing/charter.md:66-68`).
  - **`routing-policy/**`, `dispatch/**`** (SP8/SP9 window discipline, HCS map `:197-198`;
    Window R).
  - **`docs/goals/**` goal records** (wrapper D8: owning goal records change only via
    MRC-01-class propagation; `docs/goals/model-routing-chain-wrapper/charter.md:20,36`).
  - **`docs/specs/**`** (spec lifecycle per SPEC-CONVENTION §3; this spec is authored by
    shaping, never by the builder).
  - `docs/SPEC-CONVENTION.md`, plugin manifests (`.claude-plugin/**`, `.codex-plugin/**` —
    SP13/SP14, HCS map `:202-203`), `hooks/**`, `skill-injection/**`, `templates/CLAUDE.md`,
    `templates/VENDORED-CANON.md`, `templates/defects_lessons.md`,
    `templates/role-envelope-scaffolding.md`, `docs/transcripts/**`, receipts/evidence trees,
    and `skills/ai-council/references/seats.md` (machine-local, git-ignored —
    `.gitignore:145`; `skills/ai-council/SKILL.md:78-80` "seats.md is machine-local and
    git-ignored").
- **No record rewriting.** Historical dispatch facts, branch names (`codex/…`), verbatim
  quotations of other records, receipts, and dated findings are never edited (see Out of
  Scope and Contract C1 "record-preserved" rows).
- **No P2-interface change.** `runtime_profile` semantics, resolver/receipt fields, and the
  `PI_OPENROUTER_ROUTING` registry are consumed unchanged (A7, `charter.md:200`).

## Out of Scope

- **Routing-policy / dispatch implementation and the legacy representation.** D7's
  implementation half and the legacy `model_tiers`/OpenRouter-slug-only removal are
  serialized into PMC-P4 behind a named cutover (`charter.md:58`, `:172-176`); the Lane G
  parcels own those surfaces.
- **`templates/AGENTS.md` runtime-profile vocabulary** (`claude`/`codex`) and
  **`templates/pi-openrouter-routing.json`**'s OpenRouter-slug-only registry — forbidden
  surfaces; dispositioned as deferred instances with named owners (Contract C3), not edited.
- **Goal-record wording** (e.g. the stale `…/api/v1` Jev candidate in
  `docs/goals/foreman-line-boundary-routing/charter.md:29`, amended per ruling A by MRC-01 —
  wrapper `charter.md:20`).
- **`docs/specs/active/SUPERCHARGE-P1-phase1-models.md` / `SUPERCHARGE-P2-routing-analysis.md`** —
  other parcels' specs; their no-fallback acceptance criteria conflict with the ratified P1
  contract and need an owner supersede/close decision (reported, never edited here).
- **Local `skills/ai-council/references/seats.md` copies** on any machine (git-ignored).
- Pi host settings, credentials, provider calls, spend, merges, releases, activation.

## Contract

Authority quotes are verbatim. The three canon blocks in C0 are the replacement wording;
connective prose may be adapted to each file's voice, but every requirement, identifier,
and prohibition in the blocks must survive (the reviewer checks the blocks against the
landed text).

### C0. Canon blocks (the replacement wording)

**C0-A — Pi-session dispatch requirements** (authority: D1 `charter.md:52`, A1
`charter.md:108-111`, D6 `charter.md:57`):

> Foreman Line sessions are **dispatched Pi sessions**. A dispatched Pi session receives —
> before inference begins — a concrete provider/model route, its fallback chain, thinking
> level, role, routing class, data class, budget, the approved task envelope, and its
> evidence requirements. It is authorized only by an **approved route receipt** emitted by
> the resolver; the launch boundary verifies the receipt before any inference and fails
> closed when it is missing, stale, mismatched against the requested lane, or unsigned by
> the resolver. Pi's interactive `defaultProvider`/`defaultModel` default is a
> recovery-friendly convenience outside Foreman work and is never a Foreman-dispatched
> route. Automatic routing is an execution convenience, not a new approval or coordination
> authority.

D1 verbatim (`charter.md:52`): *"Pi sessions are the standard Foreman Line session shape.
A dispatched Pi session receives a concrete provider/model route, its fallback chain,
thinking level, role, routing class, data class, budget, approved task envelope, and
evidence requirements before inference begins."*

**C0-B — Fallback (per PMC-P1's `provider-neutral-fallback-contract`)** (authority: D3
`charter.md:54`, D4 `:55`, D8 `:59`, `pmc-p1-fallback-contract-2026-09-26.md:105-106`):

> Every execution candidate declares **exactly one approved fallback of comparable or higher
> suitability**, carried as explicit fallback metadata in the
> `provider-neutral-fallback-contract` representation (`lane_routes` each carry exactly one
> typed fallback). A fallback is used only after preflight establishes that it is enabled,
> available, eligible for the data class, compatible with required tools/structured output,
> and within the remaining budget. In-provider OpenRouter failover may use Pi's per-model
> `openRouterRouting` controls; cross-provider failover is a new, recorded attempt started
> from a durable handoff — it never silently continues a coordinator, review, approval,
> merge, release, or security decision mid-turn. A degraded or unavailable primary routes
> only to its declared fallback; if both fail, the parcel stops and reports. Fallbacks are
> declared in the approved route and recorded in the route receipt — never invented in a
> template, never silently substituted, never credential-bearing.

`pmc-p1-fallback-contract-2026-09-26.md:105-106` verbatim: *"`lane_routes` — ten matrix
routes (L1–L5 × both providers), exactly one typed fallback each (D3: provider-local;
cross-provider failover is a new recorded attempt, never a fallback)."*

**C0-C — Model vocabulary** (authority: D7 `charter.md:58`):

> Model IDs are first-class in both Pi spellings — `opencode/<id>` and
> `openrouter/<vendor>/<id>` — while provider-neutral task/result envelopes are preserved.
> An OpenRouter slug is one spelling of a model ID, not the model vocabulary. Within
> OpenRouter slugs Anthropic models use dots (e.g. `openrouter/anthropic/claude-opus-5.5`).

**C0-D — Jev (per ruling A)** (authority: ruling A
`docs/goals/goal-status-report-2026-09-27.md:80`; JEV J2/J3
`docs/goals/routing-currency-and-merit-jev-alpha/charter.md:263-264`; M2
`docs/goals/pi-model-configuration/gate-1-amendment-02.md:21`):

> For fast structured routing/classification decisions the **single Jev surface** is JEV's
> J2-approved `POST https://openrouter.ai/api/alpha/decisions` under capability
> `openrouter-alpha-decisions`, canonical request identity
> `openrouter / typesafe/jev-1.13 / alpha-decisions`. "Do not run two Jev surfaces" holds;
> Zen `systemone` is an unverified candidate. Jev is `recommend-only`: it is not a
> prose-generation or implementation model and may not approve, merge, release, or bypass
> policy. The obsolete `…/api/v1` structured-decision candidate wording and any
> enabled-list-membership claim are gone: M2 struck the lane's enabled-list entry and the
> lane is refused/disabled.

Ruling A verbatim (`goal-status-report-2026-09-27.md:80`): *"Single Jev surface = JEV's
J2-approved `POST https://openrouter.ai/api/alpha/decisions`. Zen `systemone` (HRO-D3) is
demoted to an unverified candidate; D10 and HRO-D3 are amended accordingly by their owning
coordinators. \"Do not run two Jev surfaces\" holds"*

**C0-E — Settings boundary (per ruling D) + credentials (D2)** (authority: ruling D
`goal-status-report-2026-09-27.md:83`, D2 `charter.md:53`):

> A dispatched session never writes Pi configuration (`settings.json`, model enablement):
> config repair is proposal-only (evidence-backed diffs with mapping provenance) and apply
> stays with PMC's authorized writer until a ratified reconciliation exists. Provider
> credentials remain environment references and never enter Foreman Line source, templates,
> receipts, or prompts.

Ruling D verbatim (`goal-status-report-2026-09-27.md:83`): *"HRO-P4b is proposal-only
(evidence-backed diffs with mapping provenance); apply stays with PMC's authorized writer
until a ratified reconciliation exists — consistent with the RCM Gate-1 reopen outcome and
HRO-D9's \"this charter does not grant it\""*

### C1. Inventory and per-file changes

Classes: **(1)** Codex-specific session/model wording · **(2)** stale OpenRouter-only
vocabulary/templates · **(3)** no-fallback limitation. Every file in
`skills/`, `docs/kickstarters/`, `templates/`, and top-level `docs/`+plugin-root docs was
swept (see Verification V1–V3 patterns); rows below are the complete hit set.

| # | File (paths relative to `plugins/foreman-line/`) | Class + anchors (observed on disk) | Change |
|---|---|---|---|
| 1 | `templates/pi-routing-directive.md` | (1)+(2) `:8-9` *"the OpenRouter candidate is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`"* (stale Jev + OpenRouter-only); (2) `:12-13` *"Keep the model in the enabled list only with the capability restrictions from `pi-openrouter-routing.json`"*; (3) `:17-18` *"Do not add provider credentials or a provider specific fallback to this repository."*; pre-Pi dispatch list `:3-6` | Full rework: C0-A opening, then C0-B, C0-C, C0-D, C0-E. Keep the file's title and the "keep coordinator, approval, security, verifier-independence, merge, and release decisions explicit" rule (`:15-16`) and its route-explanation-in-evidence requirement. |
| 2 | `templates/kickstarters/builder-template.md` | (1) `:10-17` dispatch header *"Runtime profile: `<RUNTIME-PROFILE>` · Resolved model: `<MODEL-ID>`, `<TIER>` tier … `runtimeProfile`/`resolvedTier`/`resolvedModelId` … MODEL-GRADE … below grade"*; `:56-57` *"State the runtime profile and exact model you are running on."* | Replace the header with a **Pi-session dispatch header**: "Dispatched Pi session — approved route receipt `<PATH-TO-ROUTE-RECEIPT>` (not asserted — **minted** by the resolver): route `<PROVIDER/MODEL-ROUTE>` → declared fallback `<FALLBACK-ROUTE>`, thinking level `<LEVEL>`, role `<ROLE>`, routing class `<CLASS>`, data class `<DATA-CLASS>`, budget `<BUDGET>`, task envelope `<PATH>`, evidence requirements `<LIST>`. A Step 0 restatement that does not name the approved route (provider/model route and its declared fallback), with its version, is a dispatch failure — say so and STOP." Step-0 item 1 becomes: "State the approved route you are running on and confirm it matches the approved route receipt; a mismatch is a launch-boundary failure — say so and STOP." Land C0-B/C0-C as one short paragraph under the header. |
| 3 | `templates/kickstarters/reviewer-template.md` | (1) `:13-17` *"Runtime profile: `<RUNTIME-PROFILE>` · Reviewer model: `<MODEL-ID>`, always. The minted routing receipt records `runtimeProfile…resolvedModelId`…"*; `:36-39` *"state the runtime profile and exact model you are running on … A profile or model mismatch is a dispatch failure"* | Same Pi-session dispatch header, reviewer variant, plus the independence rule (D5 `charter.md:56`, plan-review F3 `docs/goals/pi-model-configuration/plan-review-findings.md:13`): "The reviewer's route is minted for a **separate Pi session**; where independence is required its model family differs from the builder's unless a recorded stop condition prevents that — and independence applies to primary and fallback alike (denied, never downgraded)." Step-0 item becomes the route-vs-receipt check (mismatch = dispatch failure, report and do not review). |
| 4 | `templates/kickstarters/shaping-template.md` | (1) `:13-20` same dispatch header + MODEL-GRADE block; `:27` *"the model-grade gate above"*; `:49-51` *"State the runtime profile and exact model…"* | Same Pi-session dispatch header (shaping variant) + C0-B/C0-C paragraph; rename the `:27` cross-reference to "the Pi-session dispatch block above"; Step-0 item 1 becomes the route-vs-receipt check. |
| 5 | `skills/ai-council/SKILL.md` | (1) `:3` description *"multi-model council (Grok, Codex, Claude, Gemini CLIs)"*; `:8` *"Convene several frontier-model CLIs as independent auditors"*; `:55-60` vendor-seat roster (Grok/Codex/Claude/Gemini); `:71-98` CLI-launch mechanics referencing `references/seats.md` invocations | Replace the session shape with **Pi-session seats**: each seat is a separate dispatched Pi session (C0-A block) with its own approved route receipt, family-diverse per D5; the seat's task envelope carries role+lens, the shared brief, and its evidence requirement (write `<seat>-out.txt` in the brief directory). Keep unchanged: the independence thesis (`:9-18`), brief discipline (`:22-47`), lens logic and the lens table's *lens* column (`:49-69`, re-anchored to seats "1..N" with model-family guidance drawn from the ratified matrix rows `charter.md:70-75`, frontier/adversarial rows), synthesis (`:100-113`), directive output (`:115-134`), scaling (`:136-143`), failure modes (`:145-151`), quorum/drop rules. Update the `:77-82` references flow for the rewritten `seats.template.md` (still: copy template → machine-local `seats.md` for per-machine launch notes; trust observations over the file). |
| 6 | `skills/ai-council/references/seats.template.md` | (1) whole file: per-vendor CLI invocations — `:12-17` grok CLI, `:19-23` *"## Codex (OpenAI) … `codex exec --skip-git-repo-check … codex-out.txt`"*, `:25-30` `claude -p`, `:32-39` gemini CLI | Rewrite as **"Seat Dispatches — TEMPLATE"**: one section per seat with the Pi-session dispatch fields (role/lens, approved route + declared fallback, thinking level, budget, input = the brief file, evidence requirement = the answer file), plus per-machine notes. Keep the orchestration semantics verbatim where true: `:8-10` (cwd = brief directory; orchestrator outlives the seats), `:41-44` (record timings/quirks; seat down after 2 attempts; quorum 2 seats + orchestrator). |
| 7 | `docs/kickstarters/foreman-line-supercharge-carryover.md` | (3) `:10` *"with **no fallback model** (fail closed, never silent substitution)"*; `:35` *"**No runtime fallback exists**: quota exhaustion fails the task outright"*; `:43` *"…with **no fallback model**? Every gap must fail closed…"*; `:64` *"No fallback model anywhere: every unresolvable routing decision is a named, receipted failure."*; (2) `:33` *"Note the header: OpenRouter slugs verbatim, Anthropic uses dots."* | Replace each with C0-B / C0-C wording: `:10`/`:43` → "…with exactly one declared, preflight-checked fallback per execution candidate (D3; `provider-neutral-fallback-contract`)? Every gap still fails closed with a named, receipted error — declared fallback is recorded in the route, never a silent substitution."; `:35` → "The legacy tier-walking dispatcher has no runtime fallback today — a state the ratified charter expressly calls contradictory (D7 rationale: *"Current policy is OpenRouter-slug-only and expressly has no runtime fallback, which contradicts the goal"*, `charter.md:58`) and which the declared-fallback contract replaces: a degraded or unavailable primary routes only to its declared fallback; if both fail, the parcel stops and reports (D8)."; `:64` → "Exactly one approved fallback of comparable or higher suitability is declared per execution candidate (D3, `provider-neutral-fallback-contract`); every unresolvable routing decision remains a named, receipted failure."; `:33` → C0-C sentence. **Preserved verbatim:** `:37` and `:50` (GMF D12–D13/D24 scope — *"no automatic fallback"* is GMF's governed-fleet invariant, the deliberate policy divergence recorded in `goal-status-report-2026-09-27.md:72`), and every model-table row/lookup instruction. |
| 8 | `docs/kickstarters/foreman-line-supercharge-phase1-models.md` | (3) `:22` *"No runtime fallback exists: quota exhaustion fails the task outright."*; `:49` *"**No fallback model anywhere.** Every unresolvable routing decision is a named, receipted failure."*; (2) `:20` *"Header rule: OpenRouter slugs verbatim, Anthropic uses dots."* | Same replacements as row 7 (`:22`→D7-rationale/D8 wording; `:49`→declared-fallback wording keeping the named-receipted-failure sentence; `:20`→C0-C). **Preserved verbatim:** `:24` (GMF prior art), `:63` (*"…or inventing a fallback → stop and ask the owner"* — inventing an undeclared fallback remains a stop condition under the P1 contract), all Step-2 verification rows. |
| 9 | `docs/kickstarters/foreman-shaping-template.md` | No stale class hit (swept clean) — but the repo's live reusable dispatch shell carries **no** dispatch requirements at all, leaving the pre-Pi session shape implicit | Insert the Pi-session dispatch header (row 2's header, shaping variant) + one C0-B/C0-C paragraph directly after `:8` ("You are the Shaping Agent … follow it exactly"). Nothing else changes. |
| 10 | `docs/FOREMAN-LINE-PLAN.md` | (1) §5 `:129-137` *"Concrete v0 instantiation (as of July 2026 …)"* prescribes models per role in pre-Pi friendly names ("Builder (default) \| Claude Sonnet 5", "Coordinator \| Claude Opus 4.8", "hard override, never Sonnet 5") — Codex-era model wording superseded by the ratified matrix | Replace `:129-137` with: the Pi-session dispatch canon pointer (C0-A), the operational registry = the ratified Pi provider and lane matrix (`charter.md:68-75`) with C0-C prefixed-ID vocabulary, and C0-B declared fallback; one dated line noting the July-2026 friendly-name instantiation is superseded (kept as a dated pointer, not as a live table). Keep `:107-127` (the v0 policy *shape* sketch and its Rules sentence) and §5a unchanged. |

**Record-preserved (inventory rows — never edited):** all one-off dispatch briefs and
records under `docs/kickstarters/` carry facts, not prescriptions:
`foreman-kernel-*` (branch names `codex/…`, e.g. `foreman-kernel-build-FK-P0-rework1.md:28`;
historical ownership transfers, e.g. `foreman-kernel-build-FK-P0-rework6-recovery.md:5` "The
developer transferred Foreman Kernel ownership to the Codex coordinator on 2026-09-04");
`keon-full-platform-gtm-readiness-*` (verbatim quotations of another goal's *"Primary Codex
session"* charter text and rulings, e.g. `keon-full-platform-gtm-readiness-build-GTM-P0A.md:156-158`);
`foreman-line-build-*`/`foreman-line-parcel-*`/`foreman-line-shaping-*`/`foreman-line-rework-*`
(minted dispatch records like `foreman-line-build-SCAF-P3.md:11` "Resolved model:
claude-sonnet-5", `foreman-line-build-E6-R1.md:27-29`); `FL-*-handoff.md` (npm offline
"network fallback" records); `foreman-line-supercharge-phase1-handoff.md` and
`foreman-line-supercharge-phase2-findings.md` (dated review/finding records, e.g.
`:76` "no fallback intent is stated in the yaml"); `adversarial-*`/`adverserial_review.md`,
`plan-review-packaging-scaffolder.md`, `restart_after_missed_timer_event.md`,
`foreman-line-coordinator-{loop,carryover}.md` ("fallback" = wakeup pacing,
`foreman-line-coordinator-loop.md:59`), `docs/kickstarters/STANDING-CONSTRAINTS.md`.

**Swept-clean (no class instance):** `templates/role-envelope-scaffolding.md` (explicitly
client-neutral `:11-15`; opaque registry keys `:49-51`; explicit `fallbackModels` metadata
`:90` — already D7/P1-shaped); `skills/goal/SKILL.md`, `skills/foreman-shaping/SKILL.md`;
`skills/parcel-driven-development/SKILL.md:262` (`codex/*` is a branch-prefix convention in
a detection list — a git ref, not a session shape); `README.md:46-49` (factual dual
manifests `.claude-plugin`/`.codex-plugin`); `CHANGELOG.md:18-21` (historical "Added …"
entry; Jev remains recommendation-only, consistent with ruling A); `docs/COORDINATOR-PATTERN.md`
("frontier model" = D5 frontier-only lanes).

### C2. Consistency requirements

1. The five canon blocks appear consistently: C0-A in rows 1–4 and 9; C0-B + C0-C in rows 1–4,
   7–10; C0-D + C0-E in row 1 (the routing directive is where Jev and settings boundaries live);
   C0-D's substance (recommend-only, single surface) also in row 10's §5 pointer.
2. Wherever the old text names `templates/pi-openrouter-routing.json` as the Jev capability
   authority (row 1 `:12-13`), the replacement must instead cite the ruling-A surface
   (C0-D) and must not claim enabled-list membership.
3. No canon text may instruct anyone to write Pi settings or enable models (C0-E), and none
   may carry credentials (D2).
4. The reviewer of this parcel gets one independent adversarial review
   (`charter.md:92`, wrapper `charter.md:57`).

### C3. Deferred instances (reported, never narrowed away — `templates/STANDING-CONSTRAINTS.md:22` item 16, `:29` item 19)

The completion report MUST carry this table (updated with anything new found), because the
stale classes also live on surfaces this parcel may not touch:

| Deferred instance | Class | Why deferred | Named owner |
|---|---|---|---|
| `templates/AGENTS.md:104-113` — runtime_profile shipped values `claude`/`codex`; "a session must always state its runtime profile and exact model" | (1) | One of the six scaffolder-owned pins (`pmc-p2…:458`) | `plugin-packaging-and-scaffolder` canon owner (`docs/goals/plugin-packaging-and-scaffolder/charter.md:98,266`), coordinated with the PMC-P2 interface owner (A7: consumed unchanged) |
| `templates/pi-openrouter-routing.json` — OpenRouter-slug-only registry | (2) | SP11/O8 escalated overlap; boundary-routing installability claim (HCS map `:91,:200`) | `foreman-line-boundary-routing` (installability) + PMC-P2 registry lockstep |
| `skills/ai-council/references/seats.md` (every local install) — CLI invocations | (1) | git-ignored machine-local state (`.gitignore:145`) | each local install (regenerate from the rewritten template) |
| `routing-policy/**` + `dispatch/**` docs/legacy semantics (e.g. `dispatch/README.md:88-95`, "a bare OpenRouter `vendor/model` slug") | (2)+(3) | SP8/SP9 windows; D7 implementation and legacy removal | Lane G parcels / PMC-P4 cutover (`charter.md:172-176`) |
| Goal records, e.g. `docs/goals/foreman-line-boundary-routing/charter.md:29` (D10 `…/api/v1` Jev candidate) | (2) | Records; wrapper D8 | MRC-01 ruling propagation (wrapper `charter.md:20`) |
| `docs/specs/active/SUPERCHARGE-P1-phase1-models.md` (+ P2) no-fallback ACs (AC-6 tripwire, `docs/kickstarters/foreman-line-supercharge-phase1-handoff.md:13,17-18`) | (3) | Spec lifecycle (SPEC-CONVENTION §3; SP7) | supercharge coordinators / owner (supersede-or-close decision) |

Per item 19 (`templates/STANDING-CONSTRAINTS.md:29`), the verification output must also name
its unmodeled cases: a fallback ban phrased as e.g. "fail closed with no substitution" or a
Codex-session prescription spelled differently than the V1–V3 patterns passes those greps;
the full-file human read (V4) carries that residual.

## Existing Patterns To Follow

- **Canon rewording pattern** already used in this repo: preserve the receipts discipline
  ("Not asserted — **minted**", `templates/kickstarters/builder-template.md:10-13`) while
  changing what is minted — the approved route receipt (A1) instead of a
  profile/tier resolution. Do not weaken the minted-vs-asserted distinction.
- **Fail-closed, never fabricated** language of the PMC chain
  (`pmc-p1-fallback-contract-2026-09-26.md:112` "Residuals preserved — fail closed, never
  fabricated"); corrections preserve falsified claims as history rather than rewriting them
  (`pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:491-492`, *"Falsified claim texts were preserved verbatim."*).
- **Delimited bounded edits** in human-facing templates: change only the named blocks
  (the dispatch headers, the Jev paragraph, the fallback paragraph, §5's instantiation);
  leave every other line byte-identical so reviews diff cleanly.
- **Item-16/17/19/23 discipline** from `templates/STANDING-CONSTRAINTS.md:22,:24,:29,:39`:
  enumerate mechanisms, reconcile enumerations against disk in both directions, publish
  unmodeled cases, and treat any literal list as "not coverage".

## Required Tests / Verification

No automated tests required. Manual verification (run from `D:/Repos/agent-skills`; paste
literal commands, literal output, and exit codes — `grep` invoked explicitly, never a
truncating pipeline; `templates/STANDING-CONSTRAINTS.md:42` item 24):

Let `FILES` be exactly the ten Allowed Files, spelled out (this literal list is the pin and
"is not coverage" on its own — item 23; V0 reconciles it against Allowed Files in both
directions: every Allowed Files entry appears in `FILES`, and every `FILES` entry is in
Allowed Files):

```
FILES="plugins/foreman-line/templates/pi-routing-directive.md plugins/foreman-line/templates/kickstarters/builder-template.md plugins/foreman-line/templates/kickstarters/reviewer-template.md plugins/foreman-line/templates/kickstarters/shaping-template.md plugins/foreman-line/skills/ai-council/SKILL.md plugins/foreman-line/skills/ai-council/references/seats.template.md plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-models.md plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md"
```

- **V1 (class 1 — Codex/CLI session wording gone):**
  `grep -nEi "codex exec|codex-out|--skip-git-repo-check|claude -p|grok --always-approve|gemini -p|frontier-model CLIs|Grok, Codex, Claude, Gemini|Runtime profile:|Resolved model:|Reviewer model:|MODEL-GRADE|below grade" $FILES`
  → expect **no output, exit 1**.
- **V2 (class 2 — OpenRouter-only vocabulary gone):**
  `grep -nE "OpenRouter slugs verbatim|slugs verbatim|OpenRouter-slug-only|typesafe/jev-1\.13\` at|at \`https://openrouter\.ai/api/v1\`|Keep the model in the enabled list" $FILES`
  → expect **no output, exit 1**.
- **V3 (class 3 — fallback ban gone):**
  `grep -nEi "no provider specific fallback|no fallback model|no runtime fallback|No fallback model anywhere" $FILES`
  → expect **no output, exit 1** (note: *"inventing a fallback"* is intentionally preserved at
  `docs/kickstarters/foreman-line-supercharge-phase1-models.md:63` — it forbids undeclared
  fallbacks, which the P1 contract also does).
- **V4 (positive — the canon landed):**
  `grep -nE "alpha/decisions|approved route receipt|fallback chain|exactly one approved fallback|declared fallback|opencode/|openrouter/|launch boundary|proposal-only" $FILES`
  → expect hits proving C0-A…C0-E in rows 1–4 and 9 (dispatch header + fallback block),
  C0-D in `templates/pi-routing-directive.md` (`alpha/decisions` present, `api/v1` Jev
  candidate absent per V2), C0-E in `templates/pi-routing-directive.md` (`proposal-only`),
  and C0-B/C0-C in rows 7, 8, 10.
- **V5 (link/consistency reads):** read all ten files end to end; check every authority quote
  in the landed text against the `path:line` pinned in this spec (D1 `charter.md:52`; A1
  `:108-111`; D3 `:54`; D8 `:59`; D7 `:58`; ruling A `goal-status-report-2026-09-27.md:80`;
  ruling D `:83`; J2/J3 `…jev-alpha/charter.md:263-264`; `pmc-p1-fallback-contract-2026-09-26.md:105-106`);
  confirm C2's four consistency requirements and that rows 7/8 preserved the GMF-scope lines
  (`foreman-line-supercharge-carryover.md:37,:50`, `foreman-line-supercharge-phase1-models.md:24,:63`)
  byte-identically.
- **V6 (forbidden bytes unchanged):** PowerShell
  `Get-FileHash -Algorithm MD5 plugins/foreman-line/templates/foreman-config.yaml, plugins/foreman-line/templates/AGENTS.md, plugins/foreman-line/templates/STANDING-CONSTRAINTS.md, plugins/foreman-line/templates/spec-index.md, plugins/foreman-line/templates/foreman-routing-policy.yaml, plugins/foreman-line/templates/foreman-skill-injection.yaml, plugins/foreman-line/templates/pi-openrouter-routing.json`
  → each equals the §7 pin (`pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md:456-462`:
  `fcfbca35f81e0963b01c9c46a14a9b4e`, `2e5fd1eb7469d0e4b5630fa5bd21952d`,
  `ed48706c7e6ad64f09cb36e8f6b30216`, `3663a1868e427204527e668d4be21693`,
  `1b4289b2071278112e0dbaad12d31208`, `1d703a2040176329364b4c4015ad7ad0`,
  `a85f800dc9775fbf473eb3d2e5e4e7b8`).
- **V7 (write-set confinement):** `git status --short -- plugins/foreman-line` and
  `git diff --name-only` show **only** the ten Allowed Files (nothing under `docs/goals/`,
  `docs/specs/`, `routing-policy/`, `dispatch/`, `templates/` outside rows 1–4, manifests).

## Acceptance Criteria

1. Exit criterion 6 holds **for the four canon trees inside this parcel's authority**
   (`charter.md:324-326`): no Allowed File prescribes a Codex-only session shape, an
   OpenRouter-only model vocabulary, or the obsolete ban on fallback paths (V1–V3 empty).
2. Every dispatched-session surface in the write set prescribes the Pi-session dispatch
   requirements of D1 verbatim in substance — concrete provider/model route, fallback chain,
   thinking level, role, routing class, data class, budget, approved task envelope, evidence
   requirements before inference — and the A1 route-receipt/launch-boundary authorization
   (C0-A; rows 1–4, 9).
3. Fallback wording everywhere in the write set matches PMC-P1's
   `provider-neutral-fallback-contract`: exactly one approved fallback of comparable or
   higher suitability per candidate, preflight-gated (D4), provider-local failover via
   `openRouterRouting`, cross-provider failover as a new recorded attempt from a durable
   handoff, stop-and-report when both routes fail (C0-B).
4. Jev wording matches ruling A everywhere it appears (row 1): single surface
   `POST https://openrouter.ai/api/alpha/decisions`, identity
   `openrouter / typesafe/jev-1.13 / alpha-decisions`, `recommend-only`, no
   enabled-list-membership claim, Zen `systemone` unverified, "Do not run two Jev surfaces"
   (C0-D).
5. Settings boundary matches ruling D: nothing in the write set instructs a session to write
   Pi settings or enable models; config repair is proposal-only and apply stays with PMC's
   authorized writer; no credentials in any template (C0-E).
6. The forbidden set is byte-identical (V6) and the write set is confined (V7).
7. The deferred-instances table (C3) is delivered in the completion report with unmodeled
   cases named (item 16/19 discipline), and every record-preserved row stayed byte-identical.
8. One independent adversarial review requested per `charter.md:92` (review load 1 —
   `docs/goals/model-routing-chain-wrapper/charter.md:57`; the owning label `docs/architecture`
   governs review load only).

## Evidence Required

1. Literal output + exit codes for V0–V4 and V7 (V1–V3 empty is the proof; V4's hits are
   cited per file and per canon block).
2. The V6 MD5 table (seven files, actual vs `pmc-p2…:456-462` pins).
3. Per-file change map: each C1 row → the exact before/after anchor lines, with the landed
   canon block identified (C0-A…C0-E).
4. V5 read report: the authority-quote cross-check list (each quote → `path:line` →
   confirmed/adjusted), plus confirmation the record-preserved rows are untouched
   (`git diff --stat` shows no such file).
5. The C3 deferred-instances table plus the item-19 unmodeled-cases sentence.
6. The review request for the single independent adversarial review, and its findings with
   dispositions (no self-verification).

## Collision Risk

Write set $W$ = the ten Allowed Files. Disjointness proof vs the report §7 lanes
(`docs/goals/goal-status-report-2026-09-27.md:92-96`, task rows `:100-123`) and the HCS
collision map (`docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`):

- **Lane G (MRC-02, 03, 05–13):** every Lane G write set is `routing-policy/**`,
  `dispatch/**`, `receipts/**`, `spec-linter/**`, `foreman-config/**` and/or goal records.
  $W$ contains none of those prefixes. Corroboration from the live sibling's own spec:
  `docs/specs/active/MRC-02-hro-p3-events-receipt-replay.md:71` lists `templates/**` among
  *its* Forbidden paths. $W \cap$ Lane G $= \varnothing$.
- **Lane P-A (MRC-01, 20, 21, 22–24):** MRC-01 writes four named goal records
  (`goal-status-report-2026-09-27.md:102`); MRC-20 writes catalogue `evidence/` bytes;
  MRC-21 external JEV rows; MRC-22–24 external Keon repos. $W \cap = \varnothing$
  ($W$ has no `docs/goals/**`, `evidence/**`, or external path).
- **Lane P-R (MRC-14, 15, 16):** read-only receipt analysis + RCM goal records. $W \cap = \varnothing$.
- **Lane X (MRC-17, 18, 19):** live receipts/reports. $W \cap = \varnothing$.
- **MRC-25.7 (GMF-P7 "foreman adapter and distributable skill") — the F-09-named overlap**
  (`docs/goals/model-routing-chain-wrapper/plan-review-findings.md:21`: *"SP11/O8 `templates/`
  overlap; GMF-P7 skill writes vs MRC-04"*). Proof: (i) $W$'s skill paths are exactly
  `skills/ai-council/SKILL.md` and `skills/ai-council/references/seats.template.md`, while
  GMF-P7 delivers GMF's own distributable foreman skill (`docs/goals/governed-model-fleet/charter.md:116`
  D19 "the foreman skill in `agent-skills`", `:190` P7 row) and every GMF parcel gets "an
  independently shaped spec with exact repositories, base commits, Allowed Files" (`:194-195`);
  (ii) sequencing: MRC-25.7 is strictly downstream (MRC-25 row `goal-status-report-2026-09-27.md:123`:
  MRC-24 + G-GMF-HR1 + G-GMF-AUTH; sub-graph P7←P3B+P4C+P5+P6), so it shapes against
  post-MRC-04 bytes; (iii) standing rule: if GMF-P7's shaping names any $W$ path, it stops
  or takes the second-writer rule (`rcm-sequencing-decision-2026-09-26.md:62-64` §2 item 5) — a named trigger in Stop-and-Report below.
- **HCS SP8/SP9** (`routing-policy/`, `dispatch/` windows; map `:197-198`): $W \cap = \varnothing$.
- **HCS SP11 / O8** (`templates/`, map `:91,:200` — *"escalated-unresolved (partial overlap
  between scaffolder canon and boundary-routing installability template)"*, disposition
  *"Observe only; enumerate the overlap for disjointness proofs"*): $W$ touches
  `templates/pi-routing-directive.md` + `templates/kickstarters/{builder,reviewer,shaping}-template.md`
  — outside **both** named sides of the O8 overlap (not the six pinned scaffolder files,
  not `templates/pi-openrouter-routing.json`), and positively assigned to this parcel:
  `rcm-sequencing-decision-2026-09-26.md:27` *"`plugins/foreman-line/templates/**` (Pi
  routing templates) | PMC-P2 / PMC-P3 | generated route artifacts; human-facing canon"*,
  `:52-53` (*"`templates/**` is likewise held: it is PMC-P2/P3 canon work and outside RCM's
  D14 logic surface"*), `:57` (*"PMC-P3's human-facing template canon is outside RCM's D14
  surface and is unaffected"*), `pmc-p2…:484` (*"the six scaffolder templates + human-facing
  canon (P3)"*). Residual (observed, not absorbed): O8's *broad* scaffolder claim
  (`docs/goals/plugin-packaging-and-scaffolder/charter.md:98`) is `escalated-unresolved`, and
  the scaffolder loop directive still holds *"anything else under `templates/` DEFERRED —
  Window P hold"* (`docs/goals/plugin-packaging-and-scaffolder/loop-directive.md:15`) —
  flagged stale by `docs/goals/foreman-kernel/plan-review-findings.md:138` (C-09) since
  Window P released (`docs/goals/pi-model-configuration/pmc-wave1-release-2026-09-27.md:36-41`).
  If the scaffolder coordinator asserts a live claim on any $W$ `templates/` path at build
  time, that is a Stop-and-Report (SP11 "escalate").
- **HCS SP13** (serialization points: plugin manifests, marketplace metadata, root workflow
  files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports;
  map `:202`): $W \cap = \varnothing$ — no manifest, no `SPEC-CONVENTION.md`, no package
  manifest, no barrel. `.codex-plugin/**` untouched (SP14: FK-P20 owns Codex manifest, map `:203`).
- **Specs directory (SP7):** $W$ contains no spec path; this spec is shaping output only.

**Verdict: write-set disjoint from every other report §7 parcel and from SP8/SP9/SP13; the
SP11 `templates/` touch is outside the enumerated O8 overlap and inside the PMC-P3
human-facing-canon assignment. The F-09/GMF-P7 overlap is closed at the named-file level plus
sequencing, with a stop rule if that premise fails at GMF-P7 shaping.**

## Stop-and-Report Rule

Stop immediately and report (never guess, never self-expand authority) when:

1. Implementation would need any path outside the ten Allowed Files — including any of the
   six scaffolder templates, `templates/pi-openrouter-routing.json`, `templates/role-envelope-scaffolding.md`,
   `docs/goals/**`, `docs/specs/**`, `routing-policy/**`, `dispatch/**`, plugin manifests,
   `docs/SPEC-CONVENTION.md`, or `skills/ai-council/references/seats.md`.
2. A live claim, hold, or second writer is discovered on any $W$ path (scaffolder `templates/`
   hold assertion, GMF-P7 or any sibling shaping naming a $W$ path, an uncommitted foreign
   diff on a $W$ file) — restate-and-stop; the second-writer rule
   (`rcm-sequencing-decision-2026-09-26.md:62-64` §2 item 5) applies only after the coordinator rules.
3. A replacement would require changing the PMC-P2 interface (route-receipt fields,
   `runtime_profile` semantics, `PI_OPENROUTER_ROUTING`), enabling models, or editing a goal
   record (e.g. D10 — MRC-01's write) — A7 consumes P2 unchanged; report the wording gap as a
   deferred instance instead.
4. Any V1–V3 grep matches after the edits, any V6 MD5 differs from the §7 pins, or V7 shows a
   dirty path outside $W$ — report; never "fix" by touching a forbidden file.
5. A stale-class instance is found only inside a historical record, a verbatim quote, or a
   receipt — never rewrite it; add a deferred-instance row and report.
6. A canon block (C0-A…C0-E) cannot be landed in a target file without contradicting that
   file's other ratified text — report the contradiction rather than editing around it.
