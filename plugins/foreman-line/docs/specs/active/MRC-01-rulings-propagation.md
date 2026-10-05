---
ticket: MRC-01
title: Rulings A/B/C/D/F propagation into the named owning records
status: active
owner: clinton.morgan
created: 2026-09-27
updated: 2026-09-27
risk: low
surfaces:
  - docs/goals/foreman-line-boundary-routing/charter.md
  - docs/goals/hybrid-routing-optimization/charter.md
  - docs/goals/routing-currency-and-merit/charter.md
  - docs/goals/pi-model-configuration/charter.md
routing_class: standard-feature
verification_class: equivalence-provable
---

# MRC-01 — rulings propagation into the named owning records (docs-only)

## Goal

Land owner rulings **A/B/C/D/F** — the propagation set named by both MRC-01 rows — into the four named owning records as **recorded amendments**: the original text stays visible at every site (append a dated amendment note or annotate the line in place; never silently rewrite history), per the wrapper charter's MRC-01 row (`docs/goals/model-routing-chain-wrapper/charter.md:54`) and the report's MRC-01 row (`docs/goals/goal-status-report-2026-09-27.md:102`). Rulings A/B/C/F carry the six write sites in the four named records; ruling D and the JEV half of ruling A are recorded no-ops (Contract). The rulings themselves are binding inputs and are never re-litigated (wrapper D3, `docs/goals/model-routing-chain-wrapper/charter.md:31`). Docs-only; no code, no tests, no other records.

## Dependencies

- **No hard predecessor** (`docs/goals/goal-status-report-2026-09-27.md:102`, "Hard predecessors: —"); Lane P-A (`:93-94`), dispatchable in parallel (`:142`) subject to this spec's collision proof.
- **Authority (binding):** owner rulings table (`docs/goals/goal-status-report-2026-09-27.md:78-86`), recorded 2026-09-27; the rulings intro: *"each is a scoped decision the owning coordinators propagate into their goal records on next claim, per the §5 convention"* (`:76`). Wrapper D8: *"Owning goal records change only via MRC-01-class propagation parcels naming the exact ruling lines, or by explicit owner directive. An MRC-01-class write skips any record under a live owning-coordinator claim and reports it."* (`docs/goals/model-routing-chain-wrapper/charter.md:36`). Gate-1 ratification covers the 25 named parcels including MRC-01 (`docs/goals/model-routing-chain-wrapper/charter.md:89`); no G-GATE2-* act names MRC-01 because D8 is its write authority (records-only propagation, not an implementation parcel of one owning goal).
- **Build-time state:** each target record's current text and coordinator-claim status must be re-checked at dispatch (see Stop-and-Report Rule).

## Allowed Files

Exact paths relative to `plugins/foreman-line/`. Every other path is forbidden. Exactly four files, six write sites (site numbers referenced throughout):

1. `docs/goals/foreman-line-boundary-routing/charter.md` — site 1 only (line 29, D10 row, in-cell annotation).
2. `docs/goals/hybrid-routing-optimization/charter.md` — site 2 only (line 54, end-of-line annotation).
3. `docs/goals/routing-currency-and-merit/charter.md` — sites 3–5 only (site 3: new note paragraph after the mandate paragraph at `:43-47`; site 4: line 186, D3 row, in-cell annotation; site 5: line 239, RCM-P8A row, in-cell annotation).
4. `docs/goals/pi-model-configuration/charter.md` — site 6 only (A7 section: new note paragraph after the review-load paragraph at `:209-210`, before `### A8` at `:212`).

## Forbidden

- Every path not listed above. In particular: all code and config (`routing-policy/**`, `dispatch/**`, `templates/**`, receipts/contracts packages), every other goal record — including `docs/goals/routing-currency-and-merit-jev-alpha/**` (J1-safe: *"Each goal's own files only"*, `docs/goals/goal-status-report-2026-09-27.md:102`) — all `loop-directive.md` files, `docs/goals/goal-status-report-2026-09-27.md`, `docs/goals/model-routing-chain-wrapper/**`, `docs/goals/INDEX.md`, `docs/SPEC-CONVENTION.md`, the HCS collision map, and `docs/specs/**`.
- Changing, deleting, or rewording any existing character of the four files outside the six named sites — including "while you are here" fixes to adjacent stale text (see Out of Scope).
- Paraphrasing the note texts below: each note lands byte-exact (SPEC-CONVENTION §11 property 1, `docs/SPEC-CONVENTION.md:285`).
- Touching the JEV record (recorded no-op).

## Out of Scope

- **JEV record write** — no-op by ruling A (Contract, "No-op" below).
- **Adjacent Jev-identity text in `docs/goals/foreman-line-boundary-routing/charter.md` at `:58`** (lane-table row `` `typesafe/jev-1.13` through OpenRouter ``), **`:66-70`** (the `templates/pi-openrouter-routing.json` / "Jev's capability entry" paragraph), and **`:93-96`** (acceptance-gate criterion "prove the exact Jev ID, base URL, …"). These are NOT amended: wrapper `docs/goals/model-routing-chain-wrapper/charter.md:20` bounds ruling A to *"exactly two lines … that charter's D10 Jev-identity line, and HRO-D3 in the HRO charter. No other D1–D10 text in any goal is amended by anything in this chain."* Any reconciliation of those adjacent lines is a separate owner directive.
- **Report §5 status-line drift** (`docs/goals/goal-status-report-2026-09-27.md:47-55`) — owning coordinators reconcile on next claim; not this parcel.
- Implementation of anything; MRC-02's later RCM-record P8A acceptance handoff (a separate, later MRC-01-class write — `docs/goals/goal-status-report-2026-09-27.md:103`); wrapper dispatch-table bookkeeping (wrapper coordinator's own record).

## Contract

### Authority (verbatim)

- Ruling A (`docs/goals/goal-status-report-2026-09-27.md:80`): *"Single Jev surface = JEV's J2-approved `POST https://openrouter.ai/api/alpha/decisions`. Zen `systemone` (HRO-D3) is demoted to an unverified candidate; D10 and HRO-D3 are amended accordingly by their owning coordinators. "Do not run two Jev surfaces" holds"*
- Ruling B (`:81`): *"Recorded coordination: HRO is the additive author of mapping/protocol fields; PMC-P1 keeps schema review, PMC-P2 keeps adapter/resolver review. Covers shipped HRO-P1 retroactively; no charter amendment required"*
- Ruling C (`:82`): *"An exact cache hit whose key includes policy/catalog/mapping versions and whose value is the deterministic evaluator's own output is a memo of D3's order rule, permitted with HRO-P2's cold/warm parity proof — not a dispatch-time reorder"*
- Ruling F (`:85`): *"RCM = selection policy/merit/replay; HRO = cache/mapping/recovery/measurement. RCM-P8A's receipt/replay scope folds into the HRO-P3 events stream as one sequenced stream when both dispatch — stream consolidation, not a goal merge; both goal records keep their own gates"*
- §6 boundary-routing row (`:70`): *"Ruled 2026-09-27 (A): its D10 Jev identity line is amended by its owning coordinator to the `alpha/decisions` surface."*
- §6 PMC row (`:67`): *"Ruled 2026-09-27 (B): recorded coordination — HRO is the additive author of mapping/protocol fields on `routing-policy/src/pi-openrouter.ts`, PMC-P1 keeps schema review, PMC-P2 keeps adapter/resolver review."* (file verified on disk at `routing-policy/src/pi-openrouter.ts` relative to `plugins/foreman-line/`)
- §6 RCM row (`:68`): *"The mandate overlap (RCM's relationship section claims the `model-fleet-v1` D19-deferred "capability/cost/latency routing" work vs HRO's latency/cost objective) is settled by boundary ruling: RCM = selection policy/merit/replay; HRO = cache/mapping/recovery/measurement."*
- Wrapper (`docs/goals/model-routing-chain-wrapper/charter.md:20`): *"Ruling A amends exactly two lines, both landed by MRC-01: that charter's D10 Jev-identity line, and HRO-D3 in the HRO charter."*
- Report MRC-01 row (`docs/goals/goal-status-report-2026-09-27.md:102`): *"… Dispatch rule: restate-and-stop against each target record's current state; skip and report any record under a live owning-coordinator claim"*
- Wrapper MRC-01 write rule (`docs/goals/model-routing-chain-wrapper/charter.md:82`): *"**MRC-01 write rule (D8):** restate-and-stop against each target record's current state before writing; a record under a live owning-coordinator claim is skipped and reported, never merged around."*

### Site 1 — `docs/goals/foreman-line-boundary-routing/charter.md:29` (ruling A)

Current line, quoted verbatim (D10 row, 2-column table row; the only line amended in this file):

```
| D10 | The Pi/OpenRouter structured-decision candidate is exactly `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`. Jev is enabled only for fast routing/classification recommendations; it is not a prose-generation or implementation worker and cannot approve, merge, release, or bypass policy. |
```

Change: **in-cell annotation** — insert the following text between the sentence end `bypass policy.` and the row-closing ` |` on that line (original text retained above it, unchanged):

```
 *(Amended 2026-09-27 — ruling A, `../goal-status-report-2026-09-27.md` §6: this row's Jev-identity claim is superseded. The single Jev surface is the JEV-J2-approved `POST https://openrouter.ai/api/alpha/decisions` (capability key `openrouter-alpha-decisions`), not `typesafe/jev-1.13` at `https://openrouter.ai/api/v1`. "Do not run two Jev surfaces" holds. Original wording retained above for history.)*
```

### Site 2 — `docs/goals/hybrid-routing-optimization/charter.md:54` (ruling A)

Current line, quoted verbatim (the Zen `systemone` line inside `### D3 — Use the actual provider contracts` at `:50`):

```
Zen offers multiple protocols. Jev uses `https://opencode.ai/zen/v1/systemone` with `state` and typed `questions`; do not parse it as a chat completion. OpenCode configuration IDs can include `opencode/`, while provider API bodies use provider-local IDs. Verify the actual Pi adapter's requirements rather than assuming these formats are interchangeable.
```

Change: **end-of-line annotation** — append the following text to the end of that line (original wording retained above it on the same line):

```
 *(Amended 2026-09-27 — ruling A, `../goal-status-report-2026-09-27.md` §6: the Zen `systemone` statement in this line is demoted to an **unverified candidate**. The single Jev surface is the JEV-J2-approved `POST https://openrouter.ai/api/alpha/decisions`; "do not run two Jev surfaces" holds. Original wording retained above for history.)*
```

### Site 3 — `docs/goals/routing-currency-and-merit/charter.md:47` (ruling F, mandate boundary)

Current paragraph, quoted verbatim (`:43-47`):

```
`model-fleet-v1` is frozen at `stopped_at_mf_p0_no_go`. Its **D19** explicitly deferred
"V2 capability/cost/latency routing, hard-coded role-to-model maps, empirical Cortex
learning… and production default-route promotion" as out of scope so that "V1 proves one
lane before generalizing the exchange." This goal is the deferred capability/cost routing
work, claimed on its own evidence. **No MF evidence is credited automatically.**
```

Change: **appended note paragraph** — insert as its own paragraph immediately after that paragraph (i.e., between `:47` and the `heterogeneous-agent-worker-fabric` paragraph at `:49`, using the existing blank line at `:48` as separator; the original paragraph is retained byte-identical):

```
*(Amendment 2026-09-27 — ruling F, `../goal-status-report-2026-09-27.md` §6: mandate boundary recorded. The deferred-work claim above is bounded to this goal's share — RCM = selection policy/merit/replay; `hybrid-routing-optimization` = cache/mapping/recovery/measurement. Stream consolidation, not a goal merge; both goal records keep their own gates. Original wording above retained for history.)*
```

### Site 4 — `docs/goals/routing-currency-and-merit/charter.md:186` (ruling C, cache memo)

Current line, quoted verbatim (D3 row of the ratified decisions table):

```
| D3 | **Order remains the selection rule.** No dispatch-time price comparison, no dispatch-time sort, no dispatch-time network or MCP call. New predicates filter within a tier and never reorder it. Expertise bindings narrow the already eligible tier; missing bindings do not invent a preference, and an unsatisfiable binding refuses rather than silently falling back. | Preserves the ratified v0.3 dispatch contract and receipt replay. The proposed sort returns `openrouter/auto` at a `-1000000` sentinel. |
```

Change: **in-cell annotation** — insert the following text inside the decision cell (cell 2), between `refuses rather than silently falling back.` and the cell-closing ` |` (original cell text retained above it):

```
 *(Clarification 2026-09-27 — ruling C, `../goal-status-report-2026-09-27.md` §6: an exact cache hit whose key includes policy/catalog/mapping versions and whose value is the deterministic evaluator's own output is a memo of this order rule — permitted with HRO-P2's cold/warm parity proof — not a dispatch-time reorder.)*
```

### Site 5 — `docs/goals/routing-currency-and-merit/charter.md:239` (ruling F, RCM-P8A fold note)

Current line, quoted verbatim (Wave 4 table):

```
| **RCM-P8A** | Receipt/replay contract and verifier evidence. Binds effective requirements, policy digest, catalog-snapshot digest, vocabulary version, derived context floor, predicate set, selected identity, and refusal-on-mismatch behavior. Owns the receipt enrichment and replay negative controls; downstream corpus work consumes this contract. | `architecture/risk` |
```

Change: **in-cell annotation** — insert the following text inside the scope cell (cell 2), between `downstream corpus work consumes this contract.` and the cell-closing ` |` (original cell text retained above it):

```
 *(Fold note 2026-09-27 — ruling F, `../goal-status-report-2026-09-27.md` §6: this receipt/replay scope folds into the HRO-P3 events stream as one sequenced stream when both dispatch — stream consolidation, not a goal merge; this goal's record keeps its own gates. Acceptance evidence for the folded scope rides the MRC-02 receipt/replay review via an MRC-01-class handoff into this record — `docs/goals/model-routing-chain-wrapper/charter.md:55`.)*
```

### Site 6 — `docs/goals/pi-model-configuration/charter.md:210` (ruling B, coordination note)

Site of record: the charter's living `### A7 — amends implementation-parcel ownership` section (`:194-210`) — the codified file map ruling B coordinates (`gate-1-amendment-01.md` A7 at `:105-111` is its historical source and stays untouched). Current end-of-section text, quoted verbatim (`:209-210`):

```
Review load is unchanged: PMC-P0, P1, P2, and P4 each require **two**
independent adversarial reviews; PMC-P3 requires one.
```

Change: **appended note paragraph** — insert as its own paragraph after `:210`, before the blank line preceding `### A8` at `:212` (all existing A7 text, including the ownership table at `:196-201`, retained byte-identical):

```
**Coordination note — 2026-09-27 (ruling B, `../goal-status-report-2026-09-27.md` §6; covers shipped HRO-P1 retroactively; no charter amendment required).** On `routing-policy/src/pi-openrouter.ts` — the Amendment 01 A7 file map (`gate-1-amendment-01.md` A7; the file is already shipped — coordinator lint record row "Some Pi/OpenRouter plumbing already exists") — `hybrid-routing-optimization` is the **additive author of mapping/protocol fields**; **PMC-P1 keeps schema review** and **PMC-P2 keeps adapter/resolver review**. The A7 ownership table above is unchanged and stands as ratified.
```

Site-choice note: ruling B says *"no charter amendment required"* (`docs/goals/goal-status-report-2026-09-27.md:81`) — satisfied here because no ratified sentence is altered or reopened; the note is appended beside the living ownership map that the ruling coordinates (the charter's codified A7), keeping the coordination visible to the exact reviewers it routes. The historical `gate-1-amendment-01.md` A7 area is the documented fallback site if the owner prefers it there (one-line spec amendment).

### No-op — ruling D (no write site named)

Both MRC-01 rows carry rulings "A/B/C/D/F" in the task title (`docs/goals/goal-status-report-2026-09-27.md:102`; `docs/goals/model-routing-chain-wrapper/charter.md:54`) but assign ruling D **no amendment line** among the four named targets. Ruling D (`docs/goals/goal-status-report-2026-09-27.md:83`), quoted verbatim: *"HRO-P4b is proposal-only (evidence-backed diffs with mapping provenance); apply stays with PMC's authorized writer until a ratified reconciliation exists — consistent with the RCM Gate-1 reopen outcome and HRO-D9's "this charter does not grant it""*

Both records the ruling cites already carry the consistent text, so no write is required: `docs/goals/hybrid-routing-optimization/charter.md:101` (D9): *"Applying that diff requires existing scoped configuration-write authorization; this charter does not grant it."* and `docs/goals/routing-currency-and-merit/charter.md:9` (*"the scoped Gate 1 reopenings and queue amendments are ratified."*, reopen outcome at `:358`). Ruling D's operative enforcement rides MRC-10, not MRC-01 (`docs/goals/goal-status-report-2026-09-27.md:111`: *"**Proposal-only per ruling D.**"*). Recorded here as a no-op alongside the JEV no-op; any owner-directed recorded note for D is a one-line spec amendment.

### No-op — JEV record (ruling A already satisfied)

`docs/goals/routing-currency-and-merit-jev-alpha/charter.md` needs **no write**. Its J2 already matches ruling A, quoted verbatim (`:36`):

```
| J2 | The approved operation is OpenRouter `POST https://openrouter.ai/api/alpha/decisions`; it is not the `/api/v1/models` or chat/completions surface. | The supplied catalog projection cannot enumerate this endpoint family. |
```

(and the gate-table J2 at `:263`: *"Approve only `POST https://openrouter.ai/api/alpha/decisions` under the capability key `openrouter-alpha-decisions` …"*). Recorded as a no-op per the report's MRC-01 row (*"JEV needs no write — its J2 already matches ruling A"*, `docs/goals/goal-status-report-2026-09-27.md:102`) and the wrapper row (`docs/goals/model-routing-chain-wrapper/charter.md:54`).

## Existing Patterns To Follow

- **Coordinator-ratified amendment discipline** — SPEC-CONVENTION §11 (`docs/SPEC-CONVENTION.md:279-287`), three mandatory properties: "Exact replacement text supplied by the coordinator." (`:285`) — the exact note text is supplied above; the builder places it and authors none of the substance. "Committed alone, in the parcel worktree, before any implementing code." (`:286`) — the six notes are committed in the parcel worktree as record-only changes. "Commit message explicitly identifies it as a coordinator amendment." (`:287`) — the commit message must identify these as owner-ruling propagation.
- **Dated in-place note pattern already used in these records** — RCM charter's audit note *(`:60-66`, "*(2026-09-26 audit note: … Update 2026-09-27: …)*" — original text kept, dated note appended); PMC charter's M-notes (`:229-274`) and `gate-1-amendment-01.md`'s top supersession note (`:12-14`) — post-hoc dated annotations that never delete the historical text. Sites 1/2/4/5 annotate the exact line in-cell/at-EOL (table rows cannot host a following note without breaking the table); sites 3/6 append dated paragraphs, matching the RCM/PMC prose precedent.
- **Allowed-files discipline** — SPEC-CONVENTION §4.8 (`docs/SPEC-CONVENTION.md:127-140`): exact paths only; if a needed path is not listed, work stops for a coordinator-ratified amendment.
- **Each goal's own files only** (`docs/goals/goal-status-report-2026-09-27.md:102`, "JEV J1-safe").

## Required Tests / Verification

No automated tests required. Manual verification (run from `plugins/foreman-line/`; each `grep -c` must return exactly `1`, each `grep -n` shows the expected line):

1. Write set is exactly the four files and no code:
   - `git diff --name-only` → exactly `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md`, `plugins/foreman-line/docs/goals/hybrid-routing-optimization/charter.md`, `plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md`, `plugins/foreman-line/docs/goals/pi-model-configuration/charter.md`.
   - `git diff --name-only -- plugins/foreman-line/docs/goals/routing-currency-and-merit-jev-alpha/` → empty (JEV no-op respected).
2. Notes landed verbatim:
   - `grep -c "single Jev surface is the JEV-J2-approved" docs/goals/foreman-line-boundary-routing/charter.md` → `1`; `grep -n "this row's Jev-identity claim is superseded" docs/goals/foreman-line-boundary-routing/charter.md` → one hit at `:29`.
   - `grep -c "demoted to an \*\*unverified candidate\*\*" docs/goals/hybrid-routing-optimization/charter.md` → `1`; `grep -n "the Zen \`systemone\` statement in this line is demoted" docs/goals/hybrid-routing-optimization/charter.md` → one hit at `:54`.
   - `grep -c "mandate boundary recorded" docs/goals/routing-currency-and-merit/charter.md` → `1` (site 3, after `:47`).
   - `grep -c "memo of this order rule" docs/goals/routing-currency-and-merit/charter.md` → `1` (site 4, `:186`).
   - `grep -c "Fold note 2026-09-27" docs/goals/routing-currency-and-merit/charter.md` → `1` (site 5, `:239`).
   - `grep -c "Coordination note — 2026-09-27 (ruling B" docs/goals/pi-model-configuration/charter.md` → `1` (site 6, after `:210`).
3. Original text retained (history preserved):
   - `grep -n "bypass policy." docs/goals/foreman-line-boundary-routing/charter.md` → `:29`.
   - `grep -n "do not parse it as a chat completion" docs/goals/hybrid-routing-optimization/charter.md` → `:54`.
   - `grep -n "This goal is the deferred capability/cost routing" docs/goals/routing-currency-and-merit/charter.md` → `:46`.
   - `grep -n "no dispatch-time sort" docs/goals/routing-currency-and-merit/charter.md` → `:186`.
   - `grep -n "downstream corpus work consumes this contract" docs/goals/routing-currency-and-merit/charter.md` → `:239`.
   - `grep -n "Review load is unchanged" docs/goals/pi-model-configuration/charter.md` → `:209`.
4. Region reads (eyeball diff context): `sed -n '27,31p' docs/goals/foreman-line-boundary-routing/charter.md`; `sed -n '52,56p' docs/goals/hybrid-routing-optimization/charter.md`; `sed -n '43,50p;184,188p;237,241p' docs/goals/routing-currency-and-merit/charter.md`; `sed -n '194,214p' docs/goals/pi-model-configuration/charter.md` — each shows the original text plus exactly the specified note and nothing else changed.
5. `git diff` review per file: every hunk is one of the six sites; each in-cell/EOL hunk keeps the original sentence visible with the note appended.

## Acceptance Criteria

1. All six notes land byte-exact at the specified sites; nothing else in the four files changes (verified per Required Tests/Verification 1–5).
2. Every original line's text remains visibly readable in place — recorded amendment, no silent history rewrite.
3. The JEV record is untouched; `git diff` proves the write set is exactly the four Allowed Files.
4. Restate-and-stop and live-claim checks are recorded per target record (Stop-and-Report Rule); any record skipped under a live owning-coordinator claim is named in the delivery report with its unpromoted ruling ids.
5. One independent review (wrapper MRC-01 row: reviews `1`, `docs/goals/model-routing-chain-wrapper/charter.md:54`) with findings dispositioned before acceptance.

## Evidence Required

- Before/after line-numbered excerpts of all six sites (original line + landed note).
- `git diff --name-only` output (four paths) and the per-file `git diff` showing only the six site hunks.
- The grep outputs from Required Tests/Verification 2–3.
- A four-row restate-and-stop record: target record · quoted-lines-match (yes/no + evidence) · coordinator-claim status and its basis · applied-or-skipped.
- The one-review record with dispositions.
- If any record is skipped: the stop-report text naming record + ruling ids.

## Collision Risk

Write set **W** = the four `docs/goals/<goal>/charter.md` records above (six sites). All paths relative to `plugins/foreman-line/`.

- **HCS SP8 (`routing-policy/`) and SP9 (`dispatch/`)** — `docs/goals/hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md:197-198`: W ∩ (`routing-policy/**` ∪ `dispatch/**`) = ∅. No Lane-G write window opens; wrapper D4 window discipline is not triggered by this parcel (`docs/goals/model-routing-chain-wrapper/charter.md:32`).
- **HCS SP11 (`templates/`)** — `:200`: W ∩ `templates/**` = ∅. The escalated SP11/O8 overlap is untouched; wrapper D10 (`docs/goals/model-routing-chain-wrapper/charter.md:38`) respected — no non-chain writer is negotiated with because no contested surface is claimed.
- **HCS SP13 family** (plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports) — `:202`: W ∩ SP13-family = ∅ (all W paths are goal-record docs under `docs/goals/`).
- **Report §7 lanes** (`docs/goals/goal-status-report-2026-09-27.md:100-126`): Lane G (MRC-02, 03, 05–13) writes `routing-policy/**`/`dispatch/**`/resolver/proposer code surfaces (`:103-114`) — disjoint from W. P-R (MRC-14–16, `:115-117`) is read-only analysis plus a later exit-evidence assembly — disjoint at MRC-01's run. X (MRC-17–19, `:118-120`) is smoke/baseline/experiment — disjoint. P-A neighbors: MRC-04 (skills, kickstarters, docs canon, human templates — `:105`), MRC-20 (RB-6 catalogue bytes capture — `:121`), MRC-21 (external release rows — `:122`), MRC-22→25 (GMF, separate Keon repos — `:123-126`) — none of these scopes names a goal-record path; per wrapper `:44` their parallel-safety is provisional on their own shaping-time disjointness proofs, and if any later names a path in W that is a D10 stop, not a merge-around.
- **Same-record writes elsewhere in the chain (sequenced, not concurrent):** MRC-02's RCM-record P8A acceptance handoff (`docs/goals/goal-status-report-2026-09-27.md:103`; `docs/goals/model-routing-chain-wrapper/charter.md:55`) is a later, separately dispatched MRC-01-class write to `docs/goals/routing-currency-and-merit/charter.md`. Ordering is guaranteed: MRC-01 lands before the first relying parcel (wrapper D3, `:31`), one parcel runs at a time (one parcel / one branch / one worktree), and that handoff is a separate spec.

**Verdict:** W is disjoint from every SP8/SP9/SP11/SP13 surface and from every §7 lane code surface; no two writers touch any W path concurrently. No collision; no escalation needed.

## Stop-and-Report Rule

Dispatch rule (encoded per `docs/goals/goal-status-report-2026-09-27.md:102` and `docs/goals/model-routing-chain-wrapper/charter.md:82`), applied **per target record at build time**:

1. **Restate-and-stop.** Before writing, re-read the exact region quoted in the Contract for that record. If any quoted line differs from this spec's quote, STOP and report the drift verbatim — do not adapt the note to a moved/edited line.
2. **Skip any record under a live owning-coordinator claim.** Check the record's ownership state (COORDINATOR-PATTERN ownership block). Shaping-time observations to re-evaluate: `docs/goals/routing-currency-and-merit/loop-directive.md:4-13` names a queue-owner coordinator session (`e45b4d47-8455-49e9-9629-31c713c1b356`, claimed 2026-09-21) with the rule *"If another live coordinator is named or ownership / becomes ambiguous, stop and report; never assume."* (slash marks the source line wrap at `:9-10`); `docs/goals/pi-model-configuration/loop-directive.md:16` records *"**claimed** by this Pi session on 2026-09-23"*; `docs/goals/foreman-line-boundary-routing/` and `docs/goals/hybrid-routing-optimization/` have no loop-directive/ownership block (verified file listings). If a target record is under a live owning-coordinator claim when MRC-01 builds: **skip that record entirely and report it — never merge around**. The report names the record and the ruling ids left unpromoted in it (A for boundary-routing/HRO; C+F for RCM; B for PMC).
3. **Path escape.** If any required edit would touch a path outside Allowed Files, stop and request a coordinator-ratified spec amendment (SPEC-CONVENTION §4.8, `docs/SPEC-CONVENTION.md:138-140`).
4. **Frozen-contract check.** If the rulings table (`docs/goals/goal-status-report-2026-09-27.md:78-86`) or the wrapper bounds (`docs/goals/model-routing-chain-wrapper/charter.md:20,36,82`) no longer match this spec's quotes, stop and report — rulings are never re-litigated in-parcel (wrapper D3).
