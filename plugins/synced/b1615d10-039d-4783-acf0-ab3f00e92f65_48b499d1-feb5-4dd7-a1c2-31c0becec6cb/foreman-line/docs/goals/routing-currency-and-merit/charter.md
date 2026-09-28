# Goal Charter — Routing Currency and Merit

**Goal slug:** `routing-currency-and-merit`
**Created:** 2026-09-20
**Owner:** Clinton Morgan
**Coordinator:** Foreman Line coordinator session (current task; ownership recorded in
`loop-directive.md` after plan review)
**Status:** RATIFIED — Stage Zero and mandatory plan review complete on 2026-09-20;
the scoped Gate 1 reopenings and queue amendments are ratified. Gate 2 is granted only
for RCM-P0 and RCM-P1; Gate 3 remains human-owned and was not granted.
**Mode:** repo-local routing-policy extension, refresh pipeline, and evidence goal

---

## Objective

Give Foreman Line's existing routing policy two dimensions it does not have today —
**capability predicates** (input modality, context floor, thinking level) and **expertise
bindings** (which eligible model is actually good at this kind of work) — and add a
governed refresh pipeline that keeps the policy current against the live provider catalog
without moving routing authority out of the repository.

The goal is *not* "make the harness pick models." Pi already picks models. The goal is to
make Foreman's pick **correct, capability-checked, current, and replayable**, so that a
parcel dispatched today and replayed in six months resolves the same way or refuses
loudly.

## Relationship to existing goals

`foreman-line-boundary-routing` is the live routing authority. This goal is subordinate to
it and **may not amend its D1–D10**. In particular:

- **D7** (Pi auto-routing permitted only inside a Foreman-approved lane; Foreman still
  decides role, risk, classification, independence, approval, allowed files, and budget)
  is the operating constraint this goal builds inside of.
- **D8** (coordinator, approval, security, verification independence, merge, and release
  are never delegated to auto-routing) is unchanged and unweakened by anything here.
- The boundary-routing charter's statement that **"Pi's `enabledModels` is a user-facing
  cycling list; it is not the authority source for routing"** is load-bearing for this
  goal's D1. A design that writes routing decisions into `settings.json` and reads them
  back at dispatch time would invert that ruling. This goal does the opposite.

`model-fleet-v1` is frozen at `stopped_at_mf_p0_no_go`. Its **D19** explicitly deferred
"V2 capability/cost/latency routing, hard-coded role-to-model maps, empirical Cortex
learning… and production default-route promotion" as out of scope so that "V1 proves one
lane before generalizing the exchange." This goal is the deferred capability/cost routing
work, claimed on its own evidence. **No MF evidence is credited automatically.**

`heterogeneous-agent-worker-fabric` is marked SUPERSEDED by `foreman-line-boundary-routing`
in its own charter, but `docs/goals/INDEX.md` still lists it in the **coordinator pickup
queue** as `awaiting_coordinator_claim`. Per INDEX's own update rule, a conflict between
index state and goal-local ownership is a **stop-and-reconcile condition**. RCM-P0 must
reconcile this before any dispatch; this goal must not be shaped on top of an unresolved
ownership conflict over routing.

`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed).
This goal consumes those contracts for its evidence manifests and merit corpus. It does
not amend them. If both goals claim the same file, both stop until sequenced.

---

## Current evidence baseline

**Provenance caveat.** The observations below were derived on 2026-09-20 from a snapshot of
`models-store.json` and Pi's `settings.json` supplied into a Cowork session, plus
repository files staged read-only from `D:\Repos\agent-skills`. They are **strong design
input, not verified host evidence.** RCM-P0 re-derives every one of them against the live
host and the live files before any parcel is dispatched. A finding that does not reproduce
is discarded, not softened.

### What the Pi cache actually contains

`models-store.json` (465 KB, 13 provider keys, 608 model records, all providers
`checkedAt` the same epoch — it refreshes wholesale, not per-provider) carries exactly
these fields and no others:

```
id · name · api · provider · baseUrl · reasoning · input · cost · contextWindow
· maxTokens · compat · thinkingLevelMap · headers
```

Consequences that shape this charter:

1. **The cache has no quality, benchmark, rank, or expertise signal of any kind.** It
   answers *is this model eligible and what does it cost*. It cannot answer *is this model
   good at this*. Any design that derives an expertise choice from this file is deriving it
   from price and capability alone.
2. **Only two input modalities exist across all 608 records: `text` (608) and `image`
   (424).** There is no `audio`, `video`, `file`, or `pdf` value, and there is no output
   modality field at all. A modality vocabulary richer than `text | image` would declare
   requirements the harness can never satisfy, so every such parcel would refuse forever.
3. **`reasoning` is `true` for every model in all three current routing tiers.** A
   `reasoningRequired: true` predicate would filter nothing across the entire fleet. It is
   a no-op that manufactures false confidence.
4. **`contextWindow` genuinely discriminates** — economy tier spans 200,000
   (`anthropic/claude-haiku-4.5`) to 1,050,000 — so a context floor is a real predicate.
5. **`thinkingLevelMap` is present on 341 records** and `settings.json` carries
   `defaultThinkingLevel: "minimal"`. This is an unexploited cost lever.

### Live defects found in current configuration

| # | Finding | Evidence |
|---|---|---|
| F1 | **Economy-tier first pick is vision-incapable.** `nvidia/nemotron-3.5-lightning` is `input: ["text"]` and is deliberately first in the `economy` tier ("put Nemotron first so it is actually selected in all three declared classifications"). `routing-policy.yaml` has **no modality predicate at all.** Any image-bearing `boilerplate` parcel therefore selects a text-only model today. | Store record vs. `routing-policy.yaml` `model_tiers.economy` |
| F2 | Same class of defect in `standard`: `z-ai/glm-5.3` is `input: ["text"]`, position 4. Lower exposure, same root cause. | Store record vs. `model_tiers.standard` |
| F3 | **Silent price drift.** `routing-policy.yaml` annotates Nemotron as `$0.065 / $0.18` (dated 2026-09-03). The live store reports `0.08 / 0.2` — **+23% input, +11% output** in 17 days, uncaught. | Store record vs. YAML comment |
| F4 | **4 of 5 entries in Pi's `enabledModels` do not exist in the live store**, including `defaultModel` `qwen/qwen-2.5-coder-32b`, and including `typesafe/jev-1.13` — the exact ID pinned by boundary-routing **D10**. Only `openrouter:openai/gpt-4o-mini` resolves. | `settings.json` vs. store |
| F5 | **Provider namespace mismatch.** `settings.json` maps provider `opencode` to `https://opencode.ai/zen/go/v1`. The store defines `opencode` at `zen/v1` and a separate `opencode-go` at `zen/go/v1`, with disjoint ID namespaces (`claude-opus-5` vs `deepseek-v4-flash`). The configured pairing matches neither. | `settings.json` vs. store provider keys |
| F6 | **`routing-policy.yaml`'s 15 model IDs are 100% current** against the live OpenRouter catalog. The governed file is healthy; the harness-owned file is the one that rotted. | Full cross-check, 15/15 present |

F6 is the most important row in this table. **The file under repository governance stayed
correct. The file under harness convenience drifted into 80% phantom references without
anyone noticing.** That asymmetry is the argument for where authority lives.

### Assessment of the proposed approach

The proposal's instincts are right in three places and wrong in two, and the two are
load-bearing.

**Right:** (a) the local Pi cache is the correct *input* — zero-latency, rate-limit-free,
and definitionally the same capability data the harness itself interprets; (b) parcel
frontmatter is the correct place to declare task attributes; (c) a scheduled refresh is
the correct shape for keeping the fleet current.

**Wrong — direction of authority.** The proposal has the arrow running
`models-store.json → settings.json → Foreman reads it to route`. That makes a
harness-owned, harness-rewritten, unversioned UI file the routing authority, which
inverts boundary-routing's explicit ruling, puts two writers on one file (Pi owns
`settings.json` — `lastChangelogVersion`, `editorPaddingX`, `outputPad` are its UI state),
and produces routing decisions with no diff, no review, no attribution, and no revert. F4
is what that file's reliability looks like in practice.

**Wrong — dispatch-time cost sorting.** The proposed hook does
`.filter(m => m.input.includes('image')).sort((a,b) => a.cost.input - b.cost.input)[0]`.
Run against the live catalog, that expression returns **`openrouter/auto`, whose
`cost.input` is `-1000000`** — a sentinel, not a price. `openrouter/auto` is a meta-router:
selecting it hands model choice to OpenRouter and routing authority leaves Foreman
entirely. Past the sentinel, the next twelve results are `:free` variants — which
`routing-policy.yaml` excludes by name and with reasoning ("daily request caps plus a
first-eligible dispatcher with no runtime fallback means quota exhaustion fails the task
outright"), and which are third-party-served with training on inputs. The hook consults
modality and price and **never consults `data_classification`**, so an `internal` parcel
would route to a free model that trains on its contents.

That expression also breaks the ratified dispatch contract directly:
`routing-policy.yaml` states **"ORDER IS THE SELECTION RULE… There is no price comparison
at dispatch time — cost optimization is expressed entirely by how these lists are
ordered,"** and **"Classification gating is evaluated before cost optimization (D6)."**
A dispatch-time sort replaces a deterministic, reviewable, replayable ordering with a
nondeterministic function of a file that changes under it.

**On the MCP question.** The instinct is sound but the placement is wrong. A live
OpenRouter MCP server is genuinely valuable for *enriching a refresh proposal* — live
credits, catalog deltas, anything the cache omits — run inside a scheduled coordinator
session where latency and availability are free. It is disqualifying **in the dispatch
path**: it adds a network hop to every route decision, makes routing depend on an external
service's uptime, and destroys receipt replay, since the same parcel replayed later gets a
different answer. Proposal time: yes. Route time: never.

**On the filesystem watcher.** Recommend dropping it entirely. It races Pi's own writes to
`settings.json`, fires on every wholesale cache refresh (all 13 providers share one
`checkedAt`, so a refresh touches everything), runs outside any audit boundary, and buys a
freshness window nobody needs — routing tables should not change intraday. The failure it
is meant to catch (a pinned model disappearing mid-day) is handled correctly and cheaply
by an **in-process preflight eligibility check that refuses**, not by a background daemon
racing a config file.

---

## Proposed locked decisions

Ratified at Gate 1 on 2026-09-20, with the scoped plan-review amendments below.

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | `plugins/foreman-line/routing-policy/routing-policy.yaml` remains the **sole** routing authority. `models-store.json` is an untrusted upstream input read only during proposal refresh. Pi's `settings.json` / `enabledModels` is a derived, one-way projection artifact or patch; no Foreman component reads it back for routing, and no Foreman component writes routing authority into Pi's shared host file. | Preserves boundary-routing's ruling and removes the diagnosed two-writer race. F6 is the empirical case: the governed file stayed current while the harness file went 80% phantom. |
| D2 | **Eligibility and merit are separate inputs and never conflate.** Eligibility (modality, context floor, thinking level, availability, explicitly declared catalog price rates, and classification transport) is mechanical and derived from a versioned catalog snapshot. Merit is judged, cited, dated, and human-ratified. Catalog rate predicates are distinct from the existing per-parcel `ceiling_usd` budget; unknown rates refuse. | The cache carries zero quality fields, and rate units cannot establish a per-parcel budget breach. |
| D3 | **Order remains the selection rule.** No dispatch-time price comparison, no dispatch-time sort, no dispatch-time network or MCP call. New predicates filter within a tier and never reorder it. Expertise bindings narrow the already eligible tier; missing bindings do not invent a preference, and an unsatisfiable binding refuses rather than silently falling back. | Preserves the ratified v0.3 dispatch contract and receipt replay. The proposed sort returns `openrouter/auto` at a `-1000000` sentinel. |
| D4 | Evaluation order is fixed and unchanged: **classification → capability → tier order.** Capability predicates may only narrow a classification-eligible set. They may never widen it, never reorder across it, and never promote a model into a classification it is not already eligible for. | D6 of the existing policy. Capability must not become a back door around data policy. |
| D5 | The scheduled refresh is a **proposer, not a writer**. It emits a digest-bound proposal document, diff, RCM-owned evidence manifest, and change class. It never mutates `routing-policy.yaml`, merges a branch, writes `settings.json`, or changes live dispatch authority automatically. **A** — a pinned model vanished, lost a declared capability, or breached its declared catalog-rate predicate → proposal plus typed preflight refusal until a human Gate 3 merge. **B** — promote a model, change a tier primary, or add/change an expertise binding → proposal plus human gate. **C** — no eligible candidate → stop condition, never silent downgrade. | Every routing change is reviewable, attributable, revertable, and explicitly gated at the irreversible step. |
| D6 | **Automatic promotion is never permitted.** No automatic mutation changes live routing authority. A Class-A withdrawal may be generated automatically as a proposal and refusal, but the policy change itself requires human Gate 3 merge. | A pipeline must not automatically route work to an unapproved identity, even when the change appears safer. |
| D7 | Spec schema changes follow **SPEC-CONVENTION §4.6's additive pattern**: optional → non-blocking advisory → enum validation when the registry ships. New fields are `expertise:`, `inputs:`, `min_context:`, and `thinking_level:`. `expertise:` draws from the closed `foreman-config` vocabulary, never free text. New shaping emits the fields; legacy omission is handled by D8 and OQ5/OQ6 semantics. | §4 is authoritative and already has a ratified additive pattern. |
| D8 | `inputs:` is constrained to `text \| image`; `reasoningRequired:` is not adopted. `thinking_level:` maps to `thinkingLevelMap`. Legacy omission means text-only and the routing-class thinking default; an image-bearing surface without explicit `image` refuses. A model lacking the requested thinking level refuses rather than silently downgrading. `min_context` is derived from surfaces/spec content and may only be overridden upward. | The store contains exactly two input modalities; `reasoning` is universally true in current tiers and would be a no-op. |
| D9 | **No model identity appears in parcel frontmatter.** Parcels declare requirements; the policy decides identity. A parcel that names a model is a lint refusal. | Keeps boundary-routing D7 intact. A parcel that pins a model has taken routing authority from Foreman. |
| D10 | Live MCP or HTTP catalog access is permitted only inside a proposal session and only as corroboration. It is prohibited in the dispatch path and is never an authority source. Every proposal records source and timestamp; dispatch consumes only a versioned, dated local catalog snapshot with a digest and freshness bound. Missing, stale, partial, or externally mismatched snapshots refuse. | Latency, availability, and replay. A route decision that depends on an external service is not replayable. |
| D11 | **No background daemon or filesystem watcher ships.** Refresh is scheduled plus on-demand. Runtime protection is an in-process preflight against the versioned local snapshot; it proves consistency with that snapshot, not live provider availability, and emits a typed refusal on unknown IDs, capability regressions, stale/missing facts, namespace mismatch, unsupported thinking level, or unknown price rates. | Avoids the two-writer race on `settings.json`, keeps the change inside an audit boundary, and refuses loudly instead of drifting quietly. |
| D12 | Merit evidence is bootstrapped from cited, dated external evidence and graduated to a corpus of independently accepted Foreman receipts. The corpus is keyed by `(routing_class × expertise × model)` and reports first-pass rate, repair-loop count, and settled cost per accepted parcel. Legacy unlabeled receipts, pending/estimated costs, and non-accepted worker claims are excluded or separately reported; repairs are attributed to the executing model. No merit claim ships without source/date and admissibility evidence. No worker proposes, evaluates, or promotes itself. Proposal refreshes use an RCM-owned manifest and never fabricate GMF effect-bound fields. | The corpus is useful only when acceptance, identity, and settlement are authoritative; proposal evidence is not an execution receipt. |
| D13 | Every `provider:id` pair must resolve against exactly one store provider key with a matching `baseUrl`. A pair resolving to zero or to a namespace whose `baseUrl` disagrees with the authoritative configuration snapshot is a refusal, not a warning. Projection generation never writes or reads Pi's shared settings as routing authority. | F5: `opencode` is configured against `opencode-go`'s endpoint; a resolver keyed only on `provider:id` mis-resolves silently. |
| D14 | All governed logic — reader, resolver, validator, proposer, projector — ships **inside the plugin** and is versioned, tested, and released with it. No routing logic lives in an unversioned automation folder outside the audited repository. | A routing decision made by code outside the repo has no review, no test gate, and no provenance. It also silently breaks on reinstall. |

---

## Wave and parcel decomposition

Dependency order. No parcel is dispatchable before Gate 1, mandatory plan-level adversarial
review, and an explicit Gate 2 naming exact parcel IDs.

### Wave 0 — Ground truth

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **RCM-P0** | Current-instance reconnaissance. Re-derive F1–F6 against the live host and live files; discard what does not reproduce. Reconcile the `INDEX.md` / `heterogeneous-agent-worker-fabric` ownership conflict, own the F4/Jev disposition evidence, and produce the drift report, versioned catalog-snapshot facts, and environment map. No code or host correction. | `architecture/risk` |
| **RCM-P1** | `models-store` reader + eligibility projector: pure, typed, fully tested, read-only. Normalizes the cache into eligibility facts. Rejects sentinel prices, `:free` / `:nitro` / `:floor` / `:batch` variant suffixes, and meta-router IDs (`openrouter/auto`, `auto`) explicitly and by test. | `implementation/standard` |

### Wave 1 — Schema

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **RCM-P2** | SPEC-CONVENTION §4 amendment for `expertise:`, `inputs:`, `min_context:`, `thinking_level:` under the §4.6 additive pattern, plus spec-linter support and the `foreman-config` expertise vocabulary. Committed alone, before consumers. | `architecture/risk` |
| **RCM-P3** | `routing-policy.yaml` schema **v0.4**: per-entry capability predicates and an expertise-binding block. Validator invariants extended — monotonic classification narrowing preserved, tier order preserved, closed vocabulary enforced, every declared capability machine-checked against the projector from RCM-P1. | `architecture/risk` |

### Wave 2 — Resolution

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **RCM-P4** | Resolver predicate evaluation at dispatch, in D4's fixed order. **Negative controls are the acceptance evidence**: image-bearing `boilerplate` parcels must not select Nemotron (F1/F2); unsatisfiable requirements refuse, never downgrade; an `internal` parcel never reaches a model outside its classification set; expertise and shadow semantics preserve tier order and refusal behavior. | `architecture/risk` |
| **RCM-P4A** | Actual dispatch integration and decision receipt contract. Carries effective frontmatter requirements into the real dispatch caller, preserves Pi's bounded role under boundary-routing D7–D8, enforces the resolved thinking level where supported, and reconciles the executed model identity with the selection/replay receipt. | `architecture/risk` |
| **RCM-P5** | In-process currency preflight (D11): typed refusal against the versioned catalog snapshot on unknown ID, capability regression, stale/missing fact, unsupported thinking level, unknown rate, or D13 namespace mismatch. Refusal text names the failing predicate and declaring parcel field. It does not claim live provider availability. | `implementation/standard` |

### Wave 3 — Currency loop

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **RCM-P6** | The scheduled proposer. Reads cache snapshot + policy, emits an RCM-owned proposal, diff, input digests, source/timestamp evidence, and change class A/B/C. It never mutates policy, merges, writes Pi settings, fabricates GMF effect-bound fields, or applies a live withdrawal. | `architecture/risk` |
| **RCM-P7** | Projection artifact/patch generator for `settings.json` / `enabledModels` — one-way, idempotent, never read back, never writes the shared host file, and proven never-read by dispatch. It reports F4/F5 drift and produces a reviewable correction proposal; it does not silently substitute Jev or perform host correction. | `standard-feature` |

### Wave 4 — Merit

| Parcel | Scope | Risk / routing class |
|---|---|---|
| **RCM-P8A** | Receipt/replay contract and verifier evidence. Binds effective requirements, policy digest, catalog-snapshot digest, vocabulary version, derived context floor, predicate set, selected identity, and refusal-on-mismatch behavior. Owns the receipt enrichment and replay negative controls; downstream corpus work consumes this contract. | `architecture/risk` |
| **RCM-P8** | Receipt-derived merit corpus using only admissible independently accepted receipts: extract `(routing_class × expertise × model) → first-pass rate, repair count, settled cost per accepted parcel`, with legacy/pending/estimated/unlabeled records excluded or separately reported and repairs attributed to the executing model. Read-only analysis; no policy change. | `standard-feature` |
| **RCM-P9** | First expertise bindings, proposed **shadow / evidence-only and non-default only**, each with a cited dated source and explicit sample/admissibility evidence. Promotion to default is human Gate 3 and is explicitly out of scope for this goal. | `architecture/risk` |
| **RCM-P10** | Exit evidence assembly only. Consumes the receipt/replay, dispatch-integration, proposal, projection, corpus, and negative-control evidence; it defines no new contract and invents no receipt or GMF fields. | `standard-feature` |

---

## Exit criterion

This goal exits only when all of the following hold:

1. RCM-P0's drift report is landed; F4/Jev disposition evidence is recorded; and the
   `INDEX.md` ownership conflict is reconciled or escalated, with the disposition recorded.
2. `routing-policy.yaml` v0.4 validates, and **every capability claim in it is
   machine-checked against the live cache** rather than asserted in a comment.
3. F1 and F2 are closed by end-to-end negative controls that fail if either defect
   returns — not by reordering a list — through the real dispatch integration path.
4. A spec declaring `inputs: [text, image]` in a `boilerplate` class either resolves to a
   vision-capable, classification-eligible model or **refuses with a typed error naming
   the unsatisfiable predicate.** Silent downgrade fails the parcel.
5. Classification gating still precedes capability and cost, proven by a negative control
   in which a capability-perfect model outside the classification set is **not** selected.
6. The proposer runs on schedule, produces a reviewable digest-bound diff and RCM-owned
   evidence manifest, never mutates live policy or auto-applies a withdrawal, and is
   proven by negative control to be incapable of auto-promotion or host-file writes.
7. The settings projection artifact/patch is generated and idempotent, is never written
   into the shared host file by Foreman, and is proven never read by dispatch.
8. RCM-P8A receipts record effective requirements, resolved model identity, policy
   version/content digest, catalog-snapshot digest, vocabulary version, derived context
   floor, and predicate set; replay either reproduces the decision or refuses on any
   bound-input mismatch.
9. No dispatch path performs a network call, an MCP call, or a price sort.
10. Gate 3 is **not** requested by this goal. Default-route promotion of any expertise
    binding remains a separate human decision on separate evidence.

## Human gates and requested standing authority

- **Gate 1** — granted in two explicit acts: the original D1–D14/OQ1–OQ7 ratification,
  followed by ratification of the plan-review amendments A–K and queue amendments 1–6.
  Any future locked-decision change reopens Gate 1 for that decision only.
- **Gate 2** — granted on 2026-09-20 for the exact initial parcel set RCM-P0 and RCM-P1
  only: “Grant Gate 2 for RCM-P0 and RCM-P1.” Waves 1–4 are re-gated on RCM-P0's
  evidence, because RCM-P0 may invalidate findings this charter was shaped on.
- **Gate 3** — not delegated and not requested. Merge and any default-route promotion
  remain human-owned.

## Stop conditions

Stop and report when: a Wave-0 finding fails to reproduce in a way that invalidates a
locked decision; the `INDEX.md` / HAWF ownership conflict cannot be reconciled without
another coordinator's ruling; any change would amend `foreman-line-boundary-routing`
D1–D10; a lane has no eligible candidate under its declared classification (class C); a
proposal would promote a model automatically; a design pressure emerges to read
`settings.json` at dispatch time, to sort by price at dispatch time, or to call the network
from the dispatch path; a merit claim cannot cite a dated source; a worker is asked to
evaluate or promote itself; expertise vocabulary is proposed as free text; or a credential
value is discovered, needed, or emitted anywhere in the pipeline.

## Out of scope

Default-route promotion of any expertise binding. Hosting or fine-tuning a model. Adding a
provider, credential, or transport to the repository. Amending governed-model-fleet's
receipt or envelope contracts. Multi-host or cloud scheduling. A background daemon or
filesystem watcher (D11). Replacing Pi's internal routing — Pi remains the execution-plane
router inside the Foreman-approved lane, exactly as boundary-routing D7 permits. Latency or
throughput optimization. Any claim that a harness setting can enforce a policy the host
does not expose.

---

## Open questions for Gate 1

Each carries a recommendation. Propose, dispose.

**OQ1 — Expertise vocabulary, first cut.** Recommend a deliberately small closed set:
`engineering`, `architecture`, `security`, `legal`, `finance`, `writing`, `research`,
`data`. Eight values, each with a written definition and at least one routing consequence.
Recommend explicitly *refusing* to add a value until a parcel needs it — an expertise with
no distinct routing consequence is a label, not a dimension.

**OQ2 — Expertise as filter or as tier?** Recommend **filter within the existing tier**,
not a parallel tier set. Tiers already encode cost class; expertise encodes fit. Crossing
them produces `4 classes × 8 expertises` cells to maintain, most of them empty. A binding
should be able to say "for `legal`, within `standard`, prefer X over Y" and nothing more.

**OQ3 — Refresh cadence.** Recommend **daily** plus on-demand via `/goal`. The evidence
against faster: all 13 providers share one `checkedAt`, so a refresh is wholesale and
freshness below a day buys nothing a preflight refusal does not already cover.

**OQ4 — Where the proposer's output lands.** Recommend a branch and PR, so review is the
existing merge gate rather than a second bespoke approval path. Fallback if that is too
heavy for a daily job: a proposal file plus a `/goal` wake, with the PR reserved for class
B.

**OQ5 — `thinking_level` default per class.** Recommend `minimal` for `boilerplate`, `low`
for `implementation/standard` and `standard-feature`, `high` for `architecture/risk`.
`settings.json` currently sets `defaultThinkingLevel: "minimal"` globally, which is
under-spending on exactly the parcels where reasoning is the point.

**OQ6 — `min_context` — declared or derived?** Recommend **derived with a declared
override**: the shaping session estimates from `surfaces:` and the spec body, and the
parcel may override upward but never downward. A hand-declared floor rots the moment
`surfaces:` changes.

**OQ7 — Does F4 get fixed now or by RCM-P7?** Pi's `defaultModel` currently references a
model that does not exist in the store, and `typesafe/jev-1.13` — boundary-routing's D10
pinned ID — is likewise absent. Recommend treating this as a **separate immediate
correction** outside this goal's wave structure: it is a live misconfiguration, and waiting
for Wave 3 means running on phantom defaults for the duration. RCM-P7 then makes the fix
permanent and automatic rather than making it for the first time.

## Gate 1 record

**RATIFIED 2026-09-20 by Clinton Morgan:** “Ratify all D1–D14 and OQ1–OQ7 as
recommended.” This ratifies the proposed decision list and the recommended answers to
all seven open questions. It does not grant Gate 2 beyond the exact parcel set recorded
in the loop directive, does not delegate Gate 3, and does not grant provider spend or
external-effect authority.

**Scoped reopen ratified 2026-09-20 by Clinton Morgan:** “Ratify Gate 1 reopen proposal
A–K and queue amendments 1–6.” This ratifies the amended decision text and revised
parcel ownership/dependency queue recorded in this charter. It does not grant Gate 2,
Gate 3, provider spend, host correction, or external-effect authority.

**Disposition ratified 2026-09-20 by Clinton Morgan:** “Please proceed with your
recommendation. Ratified and authorized.” This ratifies the coordinator's disposition
to keep D13 unchanged, record the single alpha Decisions result as external servability
evidence only, retain `MISSING_MODEL_REFUSED`, and keep RCM-P1 held. It does not create
an alpha eligibility exception, reopen Gate 1, authorize another call or spend, change
the bounded Gate 3 scope, reconcile or hand off HAWF, or authorize host, policy, Pi, or
downstream changes.

## Gate 2 record

**GRANTED 2026-09-20 by Clinton Morgan:** “Grant Gate 2 for RCM-P0 and RCM-P1.” This
authorizes dispatch of exactly those two parcels, subject to the full per-parcel loop,
and authorizes no other parcel, merge, host correction, provider spend, or external
effect. Later waves require a new exact parcel-set grant.

**RE-GRANTED 2026-09-22 by Clinton Morgan for RCM-P1**, together with the P0
evidence-boundary ruling below. This re-grant authorizes dispatch of RCM-P1 only,
through the full per-parcel loop. It authorizes no merge, no other parcel, no host
correction, no provider spend, and no network or credential access.

## RCM-P0 evidence-boundary ruling

**RULED 2026-09-22 by Clinton Morgan**, on the coordinator's recommendations:

1. **P0 evidence is accepted as design input only.** The merged `complete:false`
   evidence releases RCM-P1, but it is not live routing authority. RCM-P1 must model
   stale freshness, missing approved-configuration authority, endpoint mismatch, and
   catalog absence (including Jev) as typed refusals, never as warnings or defaults.
2. **The catalog freshness bound is 24 hours.** This fills the freshness-bound value
   that D10 and D11 require and matches the daily cadence ratified in OQ3. A snapshot
   whose source time is older than 24 hours at evaluation refuses. No locked decision
   changes.
3. **Endpoint mismatches refuse; no aliasing or path normalization.** The four policy
   IDs whose catalog `baseUrl` is `https://openrouter.ai/api` while settings configure
   `https://openrouter.ai/api/v1` (Opus 5, Fable 5.1, Sonnet 5, Haiku 4.5) stay refused
   under D13 exactly as written. Any host-side correction is a human act outside
   Foreman.
4. **This goal does not depend on the Jev alpha child goal.** D13 keeps Jev refused
   here. The child goal keeps its own owner, gates, and queue, and this goal takes no
   action on it.

## Bounded Gate 3 record

**GRANTED 2026-09-20 by Clinton Morgan:** “I explicitly grant Gate 3 for the bounded
RCM-P0 handoff.” This one-off grant authorized integration of the reviewed RCM-P0
spec and four evidence artifacts after the green closure chain. It does not accept
the incomplete host-derived evidence as live authority, release RCM-P1, delegate
general Gate 3, authorize host correction, provider spend, credential discovery,
network access, or any downstream parcel.

**EXTENDED 2026-09-20 by Clinton Morgan:** The bounded Gate 3 above also covers
refreshes of those same four RCM-P0 evidence artifacts under the completed spec
`plugins/foreman-line/docs/specs/done/RCM-P0-current-instance-recon.md`. The extension
does not cover any other artifact, RCM-P1 release, host correction, provider spend,
credential discovery, network access, or general Gate 3 authority.
