# Loop Directive — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**State:** `PMC-P0 AMENDMENT 04 RATIFIED + RE-PROMOTED + BRIEF RE-PINNED — EVIDENCE RUN RESUMING (fresh builder dispatch, re-pinned digests)`
**Cleared:** Amendment 01 (A1–A8), Amendment 02 (M1–M4), Amendment 03 (Opus), and Amendment 04 (AC2a comparator + binding 7 + verification query) ratified 2026-09-24
**Next human gate:** none; Gate 2 for PMC-P0 already granted and covers the evidence run. The evidence dispatch is a coordinator action.

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
| Last state change | 2026-09-24 — owner ratified Amendment 04 (D-a1, D-b1, D-c1); isolated amendment commit `430b204` folds the spec re-promotion + brief re-pin; evidence run resuming under re-pinned digests (spec `133a7690…`, brief `f953f8ab…`) |

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
4d. **[NEXT]** Resume the PMC-P0 evidence run in `D:/Repos/wt-pmc-p0` under the
   re-pinned four-file write envelope (spec `133a7690…`, brief `f953f8ab…`): full
   AC2 (13 attempted = 12 resolutions + binding 7 `AC2A_ZERO_MATCH`), AC3–AC7, and
   the four evidence artifacts, returning the AC-by-AC completion claim.
5. **[BLOCKED on 4d]** PMC-P0 coordinator closure check against disk →
   deterministic pass (PowerShell 7 / `pwsh`, `node -v` first) → **two**
   independent adversarial reviews (elevated / architecture-risk) → triage.
6. **[BLOCKED on 5]** Owner ratifies the frozen role/authority map (A5.4) —
   a human gate, required before PMC-P2 starts.
7. **[BLOCKED on 6]** Sequence Wave 1 with the RCM coordinator before any PMC-P1
   Gate 2 — `routing-policy/` surfaces are contested, never co-owned.
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
