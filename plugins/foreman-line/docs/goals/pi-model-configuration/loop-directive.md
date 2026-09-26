# Loop Directive — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**State:** `PMC-P0 SHIPPED + A5.4 RATIFIED (role/lane map frozen with L1/L2=opencode, L4/L3=openrouter, δ_L=0, classes accepted) — next: RCM sequencing before Wave 1`
**Next human gate:** **RCM sequencing** before any PMC-P1 Gate 2; then per-parcel Gate 2 (PMC-P1…P4) and Gate 3 per parcel.
**Cleared:** Amendment 01 (A1–A8), Amendment 02 (M1–M4), Amendment 03 (Opus), Amendment 04 (AC2a comparator + binding 7 + verification query), and **A5.4 role/authority map** — all ratified by 2026-09-25

## Dispatch record — PMC-P0 (authoritative)

Gate 2 granted by Clinton Morgan on 2026-09-24 for **PMC-P0 only**, conditioned
on a fresh clean worktree on a new unique branch.

| Field | Value |
|---|---|
| Worktree | `D:/Repos/wt-pmc-p0` |
| Branch | `codex/pmc-p0-evidence` |
| Branch created from | `2f6c79446a2eeb9f766f22c759721cb91ffa6e67` |
| Spec promoted at | `96a24bf7ab3669b79ff7d0b004466846051c6d71` (status-only); **re-promoted under Amendment 04** (AC2a semantics + verification query), digest re-pinned |
| Spec path | `docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md` |
| Spec status | `active` |
| **Spec SHA-256** | `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb` |
| Builder brief | `docs/kickstarters/foreman-line-build-PMC-P0.md` |
| **Brief SHA-256** | `f953f8abd9cb6e81c87f6091191be8a8a05ac9561469a1f693df2dd2ae1aa941` (10014 bytes) |

The brief deliberately carries **no** commit SHA gate and **no** self-digest.
Its refusal gates are content identities — worktree path, branch, spec digest +
`status: active`, clean worktree — so coordinator bookkeeping commits on this
branch cannot force a false Step 0 refusal. The brief digest above is the
authoritative value; the builder reports what it observes and the coordinator
compares.

Three coordinator-only dispatch-preparation commits followed promotion, none
touching the spec: `5eef2f3` added the approved brief (byte-identical, blob
`cfb2830d`); `6559f50` replaced the brittle HEAD self-pin with content gates;
`a05bc92` removed the self-referential brief digest.

**Amendment 04 re-pin.** Owner ratified D-a1/D-b1/D-c1 2026-09-24. The isolated
Amendment 04 commit (`430b204`) carries the amendment file plus the spec
re-promotion (AC2a semantics, AC2 counts, `providers[].models[]` verification
query, governing-set references to Amendments 01–04, Forbidden-Files list
including `gate-1-amendment-04.md`) and the builder brief re-pin (new G3 spec
digest, the four-trap framing, the 13 = 12+1 completion-claim shape, and the
endpoint/binding-7 stop exclusions). The digests above are the authoritative
re-pinned values.

## Ownership block

| Field | Value |
|---|---|
| Coordinator | **claimed** by this Pi session on 2026-09-23 at the PMC-P0 boundary, on the owner's explicit direction ("Yes claim the coordinator role and open the PMC-P0 shaping session now") |
| Claim rule | one goal, one coordinator; transfers only at a parcel boundary |
| Owner | Clinton Morgan |
| Last state change | 2026-09-25 — A5.4 role/authority map **ratified** (L1/L2=opencode, L4/L3=openrouter, δ_L=0, classes accepted); recorded in role map §4. PMC-P0 shipped + Stage F closed. Next: RCM sequencing before Wave 1. |

**Resume record (2026-09-25).** The prior coordinator session ended after rework-3 was
verified on disk (5b). The resuming session re-verified the state without re-running
anything: worktree `D:/Repos/wt-pmc-p0` on `codex/pmc-p0-evidence` at `b754a50`, spec
digest `133a7690…` and brief digest `f953f8ab…` matching the dispatch pin, all four
evidence artifacts plus the review/triage paper trail present in
`docs/goals/pi-model-configuration/`. Verification chain was already closed (two
independent reviews + delta re-review + rework-3, deterministic pass green). The only
open agent action was publishing the branch and opening the Gate 3 PR. The loop is now
**stopped awaiting Gate 3 (owner merge)**. Stage-F closure happens after merge.

The PMC-P0 shaping session ran coordinator lint first. Its Opus absence finding
is now historical: Amendment 03 corrects it to the confirmed OpenCode and
OpenRouter Opus 5.5 identities. The draft passed both advisory self-check layers — spec-linter
frontmatter and §4 body sections — which is **advisory only**; coordinator lint
remains the sole promotion authority. No `ShapingResult` was emitted, per the
RCM-P0 precedent for coordinator-run goal parcels. Ownership is recorded so a
later `/goal resume` does not re-claim blindly; transfer only at a parcel
boundary.

**Cross-goal sequencing note.** Routing Currency and Merit is live under Claude
Code coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356` (state
`RCM-P0-closed-incomplete`, RCM-P1 held) and owns both the `routing-policy/`
surfaces PMC-P1/P2 must change and the `host-owner-export/` evidence this lint
consumed. PMC-P0 does not collide on files; **PMC-P1 and PMC-P2 do** and must be
sequenced with that coordinator before Gate 2 — never co-owned.

## Step 0 ruling — PMC-P0 (coordinator, 2026-09-24)

The builder session ran Step 0 in a mechanically read-only envelope (plan mode +
auto-deny + writes disallowed) so it could not write files, probe availability,
or reach a credential. G1–G4 and the brief-presence check all held on the
builder's side; the builder's observed spec digest
(`82d7819c…f30b5b71`), `status: active`, branch, clean tree, and brief digest
(`9c811c47…dccc0ef5`, 7974 B) match the authoritative dispatch record above. The
tip `bbf105b` is informational only, as required.

Headline AC2 shape confirmed correct on the builder's restatement: 13 AC2a +
2 AC2b = 15, Jev excluded; AC2b zero-match is the expected, non-authoritative
stale-export result and must not be reported as a contradiction or counted
against AC2a. The evidence run is cleared to proceed.

Rulings on the builder's flags:

- **F1 (no named source for part of the Intent) — cleared, no amendment.** The
  permitted surface (frozen export + read-only repo files: `routing-policy.yaml`,
  `src/pi-openrouter.ts`, export projections) plus coordinator preconditions 1–3
  already fix the disposition. Record what is derivable; where a fact needs a
  provider call or launching Pi, mark `unknown` / `capability-unverified` and
  route to A6. Do not infer from model family. State explicitly whether tool-use
  and structured-output are derivable from the safe field set (AC5).
- **F2 (spec line ~276 stale shaping-session wording) — accept-as-documented.**
  That sentence is shaping-session residue; the operative scope is the four-file
  list under *Allowed Files*, which the builder correctly follows. The builder
  does not edit the spec. The coordinator records it for a future spec-hygiene
  pass (a coordinator act, not the builder's). Does not block.
- **F3 (AC8 two reviews, builder cannot dispatch) — expected hold, no amendment.**
  Per *Session Handoff*, AC8's two fresh frontier reviews are the coordinator's
  acceptance input, not builder evidence. The builder's `pmc-p0-verification.md`
  AC8 section carries every command/digest/version/status it can and records the
  reviews as `pending — coordinator-owned`. A documented hold is an acceptable
  outcome; it is not a clean pass and must not be faked.
- **F4 (verification-environment statement) — cleared; run under PowerShell 7.**
  Verified on this host: `pwsh` (PowerShell 7.6.6) exposes `Get-FileHash` and
  `Select-String`; Windows PowerShell 5.1 here is **missing** `Get-FileHash`.
  `sha256sum` (git-bash) and `node v24.7.0` are present. The spec's *Verification
  Plan* says Windows PowerShell *or an equivalent Node script* — so run the
  mandated PowerShell block under **`pwsh`, not `powershell.exe` 5.1**, and report
  the `pwsh` version. `sha256sum` and `Get-FileHash` agreeing on the pinned
  digests is expected, not a contradiction. `node -v` first for any Node-script
  path (lesson #10). No amendment.
- **F5 (brief has an empty "Pinned execution context" table header, lines 9–10) —
  informational.** A cosmetic leftover from the removed SHA self-pin (brief
  commit `a05bc92`). It does not affect the G1–G4 content gates or the authoritative
  brief digest. No mid-dispatch re-issue; logged for the next brief revision.
- **F6 (plan-mode / ExitPlanMode conflict) — not a defect.** Plan mode was the
  deliberate Step 0 envelope. The evidence dispatch will run in a least-privilege
  write envelope scoped to the four Allowed Files, so plan mode and
  ExitPlanMode are not involved.

No flag is a real spec gap; none requires an amendment committed alone before
code. Proceeding to the evidence run.

## Evidence-run stop and coordinator reproduction — PMC-P0 (2026-09-24)

**Dispatch envelope.** The evidence builder ran headless in a four-file write
envelope (`Edit(<4 exact Allowed-File paths>)` allow-list, `--permission-prompts
none` so every unlisted tool including all write-capable MCP tools is
auto-denied; network/provider CLIs/`git` mutation/`npm` denied). It performed
the AC2 resolution, hit the spec's **endpoint-mismatch stop condition**, wrote
none of the four files, made no provider/credential reads, and stopped for the
ruling. `git status --short` empty before and after; tip stayed at `c4489e7`
(coordinator's Step 0 commit). This is a **disciplined stop, not a wrong-shaped
claim** — an acceptable outcome per the brief.

**Coordinator independent reproduction** (node over the digest-verified export;
all three export digests re-confirmed matching the spec pins first):

- Top-level catalogue keys are `projectionVersion` + `providers` (13 providers).
  The spec's Verification Plan `$cat.models | Where-Object {…}` field does **not
  exist** → run literally it returns nothing and would emit 13 false
  `AC2A_ZERO_MATCH` refusals. (Builder worked around via `providers[].models[]`,
  which the spec permits as an "equivalent Node script.")
- **AC2a resolution (provider+id literal, case-sensitive):** 12 bindings resolve
  to exactly one record (2,3,4,5,6,8 under `opencode`; 9,11,12,13,14,15 under
  `openrouter`). **Binding 7 `opencode/qwen3.8-flash` = 0 matches** under
  `opencode`; the id exists only under `opencode-go` (`…/zen/go`) and
  `qwen-token-plan`. This **falsifies coordinator-lint L5's "present" claim**
  (L5 checked the id appeared anywhere, not under the AC2 provider).
- **Endpoint comparison (catalogue record `baseUrl` vs `settings-projection`
  registered provider `baseUrl`):** settings registers `opencode`→
  `https://opencode.ai/zen/go/v1` and `openrouter`→`https://openrouter.ai/api/v1`.
  Catalogue `opencode` records are `…/zen/v1` (54) or `…/zen` (14) — i.e. the
  host's registered `opencode` endpoint equals the **`opencode-go`** catalogue
  endpoint, so bindings 2,3,4,5,6,8 diverge; `anthropic-messages` openrouter
  records (11 `anthropic/claude-sonnet-5`, 15 `anthropic/claude-haiku-4.5`) carry
  `https://openrouter.ai/api` (no `/v1`) while bindings 9,12,13,14 carry
  `…/api/v1` (and `routing-policy/src/pi-openrouter.ts:39,53,151` fix `…/api/v1`)
  → 11 and 15 diverge too. **Under the builder's reading (mismatch vs the
  settings-registered endpoint), 8 of 12 resolving AC2a bindings would refuse,
  collapsing the mandated "counts 13 under AC2a" — which the spec author could
  not have intended. The AC2a "URL mismatch" comparator is therefore undefined.**

**Findings routed to a scoped Gate 1 re-open (Amendment 04, owner decision):**

- **R1 / D-a — AC2a "URL mismatch" comparator is undefined (load-bearing).**
  AC2a lists "URL mismatch" as a refusal but never says what `baseUrl` is
  compared *against*. As read, it can mean catalogue-internal non-uniqueness
  (one provider+id → differing URLs) or catalogue-vs-settings/`pi-openrouter.ts`
  divergence. The latter makes AC2a's 13 unachievable and would silently convert
  a settings/catalogue registration observation into a refusal. **Owner must fix
  the comparator.** Coordinator recommendation: "URL mismatch" refuses only on
  catalogue-internal non-uniqueness; catalogue-vs-settings endpoint divergence
  is a recorded `static-conformance` observation (never an availability/absence
  claim, per precondition 2), not an AC2a refusal.
- **R2 / D-b — binding 7 `opencode/qwen3.8-flash` disposition (load-bearing).**
  The frozen export has zero `opencode/qwen3.8-flash` records; preconditions
  forbid aliasing `opencode-go`→`opencode` on equal endpoints. **Owner must
  choose**: (i) keep it a named `AC2A_ZERO_MATCH` refusal (honest 12/13 + 1
  documented refusal; availability/enablement left to A6/PMC-P2); or (ii)
  extend owner-attestation to binding 7 as Amendment 03 did for bindings 1/10
  (changes the AC2a/AC2b counts). Coordinator recommendation: (i), plus a
  PMC-P2 live-availability item; do not alias, do not silently reclassify.
- **R3 / D-c — Verification Plan field defect (factual fix).**
  `$cat.models` must be `$cat.providers[].models[]`. A mechanical correction to
  the spec body (not an acceptance decision), folded into Amendment 04; the
  coordinator re-promotes afterward (digest updates).

No evidence files were written; the parcel is paused at AC2a pending the
ratified Amendment 04. Per the loop's amendment-before-code rule, the
coordinator will not let any builder resolve R1–R3 unilaterally, and will not
edit the spec outside a ratified, re-promoted amendment.

## PMC-P0 adversarial review and triage (2026-09-25)

Two independent frontier reviews ran read-only (no Edit/Write, no commit)
after the coordinator closure check and deterministic pass both went green. Both
reviews independently recomputed the three export digests, the spec digest, the
AC2 counts (12 + binding 7 `AC2A_ZERO_MATCH`, AC2b 0/0), and enablement 0 of 15 —
all match the artifact and the coordinator pass.

- **Review A (general): CHANGES REQUESTED.** One MAJOR, several MINOR/INFO.
- **Review B (acquisition & leakage): ACCEPT.** No blocker; two LOW wording
  items; export unchanged, no credential/host material quoted, no
  availability upgrade, honest refusals.

### Triage (fix / accept-as-documented / informational)

| ID | Sev (reviewer) | Finding | Disposition (coordinator) |
|---|---|---|---|
| R1 | MAJOR | Rubric tie-break/ordering: §4 preamble "equal on all ordering keys" contradicts step-1 L5 "cheapest by R5" and the A3 per-lane provider rule; the provider rule's position (filter-before vs tie-break-after R5/R7) is unstated, so its independence not-drift intent (A3) is weakened and PMC-P1 would encode ambiguity. | **FIX (rework)** — encode A3 precisely: provider rule is per-lane and declared; frontier/L2 pin the single declared provider (partition), economy is cheapest-eligible (R5 dominant), standard is declared preference; R7 orders within the selected provider; steps 3–4 resolve residual ties; drop/repair the "equal on all ordering keys" contradiction. |
| R2 | MINOR | Rubric §6 prose says R6/R7/tool-use are "not" provider-call inputs, contradicting the table above it; builder self-ruled a spec stop condition. | **FIX (rework) + coordinator ruling F-C**: AC6's "route to A6" governs over the generic stop condition; R6/R7 being unpopulatable is the known expected state of a static-conformance parcel. Routing to A6 is correct, not a stop. |
| R3 | MINOR | AC2a "wrong provider" folded into `AC2A_ZERO_MATCH` with a parenthetical; PMC-P1 loses the distinct refusal name. | **FIX (rework)** — preserve the distinct named refusal (`WRONG_PROVIDER` vs `AC2A_ZERO_MATCH` vs case-mismatch). |
| R4 | MINOR | A3's declared-preference wording names standard lanes only; applying it to L3 is an extension not labelled as such. | **FIX (rework)** — label the L3 declared-preference as an explicit extension of A3 (standard-lane wording), not a direct A3 statement. |
| R5 | MINOR | Baseline §2.1 / V§4,V§8 miss the vendor-prefixed record `openrouter/qwen/qwen3.8-flash` (catalogue line 14869) and have no negative case for alias-by-prefix-stripping. | **CONFIRMED on disk** (record exists: provider `openrouter`, id `qwen/qwen3.8-flash`, `…/api/v1`). **FIX (rework)** — record it as an observation (different provider + prefixed id, not binding 7) and add the alias-by-prefix-stripping negative case. |
| R6 | INFO | Role map §3 C5 labels "L1 primary / L2 primary (bindings 2, 9)" loosely (2 is L1-fallback/L2-primary; 9 is L1-primary/L2-fallback). | accept-as-documented (the §2 table is correct; reword if touching role map). |
| R7 | INFO | `pi-openrouter.ts` `PI_OPENROUTER_ENABLED_MODELS` enables 11,13,14 while settings enables none — a useful divergence not recorded. | accept-as-documented; note as downstream static-conformance input for PMC-P2. |
| R8 | INFO | Rubric §5 bullet "no step compares or depends on providers" overstated (step 3 checks cross-provider fallback). | accept-as-documented (termination proof stands; reword opportunistically). |
| R9 | INFO | Verification record not self-hashed; spec pwsh block never verbatim (F-B). | accept-as-documented (both disclosed; rework regenerates artifact digests + self-hash if the rework touches V§9). |
| B5 | LOW | Baseline §2.1 "records a real catalogue gap" reads as a flat absence claim; precondition 2 says the export is never an absence proof. | **FIX (rework)** — scope to "in the frozen, freshness-unaccepted export". |
| B6 | LOW | Rubric §6 R6 row "reachability/enablement is only observable live" — enablement IS statically observable (AC4 0 of 15). | **FIX (rework)** — drop "/enablement"; only reachability is live-only. |

No finding changes a locked decision; nothing re-opens Gate 1. The rework is an
in-parcel fix of the four evidence artifacts within AC6's "documented stable
tie-break order" requirement and the provenance/negative-case completeness, not
a spec amendment.

### Rework closure + coordinator flag rulings (2026-09-25)

Rework verified on disk (coordinator re-ran the deterministic pass on the
reworked artifacts; `node -v` first, then a Node-equivalent pass — the spec's
permitted alternative — green): 3 export digests match; AC2a 12 + binding 7
`AC2A_ZERO_MATCH`; AC2b 0/0; enabled 0 of 15; Jev enabled-true/uncatalogued;
prefixed `openrouter/qwen/qwen3.8-flash` = 1 record (confirming R5). Negative-case
count 12 → 14; artifact digests regenerated. The four files remain the only
changes (path audit clean).

- **F-G (refusal-name encoding) — ACCEPT set form.** Binding 7 keeps its
  D-b1-mandated name `AC2A_ZERO_MATCH` as the primary; the additionally diagnosed
  conditions (`AC2A_WRONG_PROVIDER`, `AC2A_PREFIX_ALIAS_REFUSED`, etc.) are recorded
  as a **diagnostic set** alongside it. This satisfies both D-b1 and R3's
  distinct-name requirement.
- **F-H (three derived rules) — ACCEPT as documented, marked derived.**
  `PINNED_PROVIDER_NO_ELIGIBLE` (proposed name), pin-as-**partition** (a fallback
  never crosses the pinned provider), and L3/L4 "declared preference" = **ordered
  preference** (not a partition) are each faithful readings of A3 ("pin a single
  declared provider", "declare their preference explicitly"). They are within AC6's
  mandate to state the tie-break explicitly, they are labelled "derived from A3",
  and they do **not** freeze the map — the role map and provider declarations stay
  `awaiting-owner-ratification` (A5.4).
- **F-I (tooling) — ACCEPT as documented.** Same as F-B: the spec's Verification
  Plan permits an equivalent Node script; the coordinator's own PowerShell-7 pass
  (`node -v` first) is the authoritative deterministic pass and is green. Review B
  independently confirmed the blocked commands are honest refusals, not a hidden
  boundary problem.
- **Still-held (unchanged):** F-A (spec misnames the Jev location — `routing-policy.yaml`
  has no `jev`; the gap is real and correctly not fixed — spec-hygiene note for a
  later pass), F-D (Pi 0.86.1 semantics not re-verified; launching Pi is
  prohibited → A6/PMC-P2), F-E (tool-use/structured-output → A6 probes / fresh RCM
  export), F-F (manifest still lists `anthropic/claude-opus-5`; predates amendment 03,
  consistent with AC2b).

## Standing authorizations (verbatim, with contingencies)

| Gate / action | State |
|---|---|
| Gate 1 — original D1–D8, matrix, parcels, exit criterion | Ratified 2026-09-23 |
| Scoped Gate 1 re-open — A1–A8 | **Ratified in full 2026-09-23 — closed** |
| Plan-level adversarial review | Complete; `REQUEST CHANGES` recorded |
| Gate 2 — dispatch PMC-P0–PMC-P4 | Not granted |
| Pi config / Foreman source / templates / tests | Not granted until per-parcel Gate 2 |
| Credential inspection, provider call, spend | Not granted; separate per-test authority |
| Gate 3 — merge, release, install, default-route activation | Not granted |

## Queue (strict order, all blocked)

1. **[DONE]** Owner ratifies A1–A8 → scoped Gate 1 re-open closed.
2. **[DONE]** Ratified A1–A8 folded into `charter.md` § *Amendment 01* as a
   single amendment commit, committed alone, before any code.
3. **[DONE]** Coordinator lint falsified model identity (L1–L4); owner ratified
   M1–M4 as Amendment 02; PMC-P0 shaped to `draft` against the corrected matrix.
4. **[DONE]** Gate 2 granted 2026-09-24 (PMC-P0 only); spec promoted
   `draft → active` at `96a24bf`; clean worktree prepared; builder dispatched
   fresh; **builder Step 0 complete and coordinator ruling issued** (see *Step 0
   ruling* section above — flags F1–F6 all cleared, no amendment).
4b. **[DONE]** Builder evidence run (first attempt) under the four-file write
   envelope: verified the three export digests (all match) and ran AC2 resolution,
   then **stopped on the endpoint-mismatch stop condition with no files written**.
   Coordinator reproduced on disk and routed R1–R3 to Amendment 04.
4c. **[DONE]** Amendment 04 scoped Gate 1 re-open ratified by owner 2026-09-24:
   D-a1 (AC2a "URL mismatch" is catalogue-internal only; catalogue-vs-settings
   divergence is a static-conformance finding for PMC-P1/P2), D-b1 (binding 7 =
   documented `AC2A_ZERO_MATCH` acceptable evidence; AC2a outcome = 12 resolutions
   + 1 refusal), D-c1 (verification query corrected to `providers[].models[]`).
   Isolated amendment commit `430b204` + spec re-promotion + brief re-pin.
4d. **[DONE]** Evidence run completed under the re-pinned envelope: all four
   evidence files written; AC2 = 13 attempted (12 resolutions + binding 7
   `AC2A_ZERO_MATCH`) + 2 AC2b (0/0 expected); enabled 0 of 15; Jev enabled-true /
   uncatalogued; SCF-1/2/3 endpoint findings; H-* holds recorded.
5.  **[DONE]** Coordinator closure check (spec `133a7690…`, brief `f953f8ab…`, 3
   export digests, path audit = exactly four files) + deterministic pass under
   PowerShell 7 (`pwsh`, `node -v` first) + **two** independent adversarial
   reviews (elevated / architecture-risk) → **triage recorded** (see below).
5a. **[DONE]** Rework complete and verified on disk: R1 (rubric ordering per
   A3), R2 (+ F-C ruling recorded), R3 (distinct refusal names), R4 (L3
   extension), R5 (prefixed record + N13/N14), B5, B6, plus opportunistic R6/R8.
   Negative cases 12 → 14 (tripwire not violated); deterministic pass green.
5b. **[DONE]** Delta re-review (CHANGES REQUESTED on a blocking MINOR: the
   three A3-derived rules were stated flat without a DERIVED label) → rework-2
   (labels/chips 1–4) + rework-3 (V§9 digests + self-digest `verify=true`).
   Coordinator verified all on disk; negative-case count 14 unchanged.
5c. **[DONE]** **Gate 3 merge** (PR #47 → main, 2026-09-25); Stage-F closure committed on
   `codex/pmc-p0-stage-f`. Evidence shipped: the four evidence artifacts
   (`pmc-p0-capability-baseline.md`, `pmc-p0-suitability-rubric.md`,
   `pmc-p0-role-lane-map.md`, `pmc-p0-verification.md`) plus the review/triage
   paper trail (`pmc-p0-review-A/B/delta-findings.md`) ride in the PR on
   `codex/pmc-p0-evidence` for owner merge.
6. **[DONE]** A5.4 role/authority map **ratified** 2026-09-25: mapping + `classifier`
   family accepted; L1/L2 pin `opencode`; L4 (and L3 extension) prefer `openrouter`;
   routing classes `review/security`, `implementation/complex`,
   `routing/classification` accepted; `δ_L = 0`; binding 7 held. (See role map §4.)
7. **[NEXT]** Sequence Wave 1 with the RCM coordinator before any PMC-P1 Gate 2 —
   `routing-policy/` surfaces are contested, never co-owned.
8. **[BLOCKED on 7]** PMC-P1 … PMC-P4 per the A7 ownership split as narrowed by
   Amendment 02 (P1 makes no frontier-registry change; P2 also owns model
   enablement per M4; legacy-representation removal serialized into P4).

## Per-iteration algorithm

Shaping → coordinator lint (verify on disk) → Gate 2 → dispatch builder
(own worktree, Step 0 gate) → rule on flags (a real spec gap becomes a ratified
amendment committed alone before code) → completion claim mapped to evidence
with test count; wrong-shaped claims are presumptively empty → coordinator
closure check against disk **before** re-running anything → deterministic pass
→ adversarial review (fresh frontier session; two independent for
architecture/risk; reviewers never fix, never commit) → triage, reproducing
disputed findings before ruling → rework with its own Step 0 gate and
test-count tripwire → Gate 3 merge behind a green chain → stage-F closure.

## Stop conditions

All charter stop conditions remain in force. Additionally, stop and report if:

- a primary/fallback pair cannot be proved eligible for its data, tool,
  context, cost, or independence constraints;
- Pi cannot produce a durable route/handoff receipt or apply required
  provider-routing controls;
- another live coordinator claims overlapping source/configuration files;
- an action would need provider spend, credential inspection, non-public
  disclosure, installation, merge, or release without explicit authority;
- a change would weaken a frontier, security, human-gate, data-class, or
  evidence invariant;
- both members of a declared fallback pair fail, or an unlisted third fallback
  would be required.

## Hook-condition note

Three human gates remain agent-uncompletable: **Gate 2** dispatch approval (for
later parcels), the **role/authority map ratification** (A5.4), and **Gate 3**
merge/activation. Amendment 04's scoped Gate 1 re-open is **ratified** (closed
2026-09-24). PMC-P0 is currently in its agent-completable evidence run under the
existing Gate 2 grant — awaiting the builder's evidence completion claim, not a
human gate. If this goal is run under a stop-hook whose condition is phrased as
any of the remaining human gates, or as "charter implemented", the session will
trap in a stop → feedback → stop cycle. Agent-verifiable end states are of the
form **"builder evidence completion claim pending"** or **"stop-report written
and loop stopped awaiting <named gate>"**.

## Scoped HRO prerequisite closure — 2026-09-26

The user's explicit HRO prerequisite delegation authorizes this bounded sequence
despite earlier historical gate holds; unrelated PMC queues are not transferred.
PMC-P1a merged via PR55 as 6ff38a3ba7c3a991024237d27eec21a48e132f25 after two
independent final approvals, independent integration verification (471 routing
tests, typecheck and lint) and complete green remote twenty-package CI. The spec
is moved to done with its original contract preserved. Seven legacy schemas and
all previous public APIs remain unchanged. This is a static evidence contract,
not an activation or full PMC completion record.

Shared integration order remains PMC-P1a, RCM-P1A wrapper, then lossless PMC-P1b
projection and source-producer additions on the accepted base. HRO owns only the
necessary prerequisite coordination under the recorded delegation. Original
reviewed branches are retained; there is no destructive workspace cleanup.

## RCM-P1A Stage F closure — 2026-09-26

PR56 merged as e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9 after both independent
final reviews approved 4201ac4edf8069efa0857d9841341d62b2429648. Independent
combined integration passed 498 routing tests, typecheck, lint and spec validation;
the public barrel preserved the 75-export union. Complete remote twenty-package
CI passed at final PR head e23a9251b0365aeaf68302f36bb259a4a59a9ed3. The spec is
moved to done; original reviewed branches remain retained without destructive
cleanup. The wrapper confers no authority on caller-declared source evidence.

PMC-P1b now owns the next shared-file integration. The isolated RCM producer
may build concurrently but lands after the accepted projection. Live routing,
provider configuration and paid inference have not been activated.