---
ticket: QF-P1
title: Quick-flags registry (QUICK-FLAGS.md, versioned)
status: active
owner: clinton.morgan
created: 2026-10-13
updated: 2026-10-13
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/docs/QUICK-FLAGS.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

# QF-P1 — Quick-flags registry (QUICK-FLAGS.md, versioned)

## Intent

Author `plugins/foreman-line/docs/QUICK-FLAGS.md`: the single, versioned registry of the 14 quick flags the foreman-line Coordinator expands into fixed, auditable directives (charter D2′, D8). It defines each quick flag's expansion, persistence, arguments and gate interplay, plus the grant-record format, the conflict table and its order over time, the provenance rule, the destructive-action definition, the alias table and the gate-interplay statement. It must close plan-review findings R5, R6, R13, R16 and R18 and implement D2′/D4′/D5′/D9′/D10′ exactly. No quick flag may be readable as removing a gate. QF-P2 makes the registry operative; QF-P1 only writes it.

## Constraints

- **Docs only, one file.** The builder creates exactly `plugins/foreman-line/docs/QUICK-FLAGS.md` and nothing else. No code, hook, expander or test (D1, `charter.md:29`).
- **Authority order.** The amended D-rows (`charter.md:29-38`) and the coordinator triage (`plan-review-findings.md:70-92`) are binding. The charter's "Flag semantics (summary)" (`charter.md:40-65`) is **non-binding** where it differs. Known differences: `--resume <current-slug>`, `--nopush` blocking "merge", and `--ratify` "as currently drafted". The registry follows the amended rows, not the summary. Do not edit the charter.
- **Normative wording.** Use "must"/"never" for requirements. Where a requirement below says **verbatim**, copy the quoted text exactly, on a single line (no hard wrap), so `grep -F` finds it:
  - **V1** (`charter.md:21-22`, "flag" → "quick flag" per D9′): `A quick flag adjusts how much the Coordinator asks and does inside the gates and never removes a gate.`
  - **V2** (D4′, `charter.md:32`): `Gate 1 (including one re-opened by triage), charter amendments, the plan-level review, the two-review rule, Step 0 gates, coordinator self-verification, the universal stop conditions, green-chain-contingent merge, human-only gates (OAuth, TTY approval), or destructive/outward-facing actions`
  - **V3** (D10′, `charter.md:38`): ``Destructive = force-push, history rewrite, deleting branches/worktrees outside Stage-F cleanup, deleting data or files outside the parcel's `surfaces:`, or anything touching shared remote state.``
  - **V4** (D10′, `charter.md:38`): `Outward-facing actions are denied unless a standing authorization grants them.`
  - **V5** (`loop-directive.md:21`): `any red step voids it for that chain`
  - **V6** (`plan-review-findings.md:85`, "flag" → "quick flag" per D9′/R20): `QUICK-FLAGS governs quick flag tokens only. Existing prose grants are neither reinterpreted nor revoked.`
- **Entry structure** (needed so QF-P3 can check it mechanically, R11):
  - one `### \`--<name>\`` heading per canonical quick flag
  - each entry carries these labelled lines in this order: `Canonical:`, `Aliases:`, `Persistence:`, `Arguments:`, `Expansion:`, `Gate interplay:`, `Conflicts and revocation:`
- **Term.** In prose, every "flag"/"flags" is preceded by "quick". The exceptions are literal tokens and one disambiguation sentence saying builder Step 0 "flags" (`COORDINATOR-PATTERN.md:7`, `skills/goal/SKILL.md:32`) are a different thing (D9′, R20).
- **Builder Step 0.** Restate this spec, the single Allowed File, branch `qf-p1`/worktree and base, and stop for the coordinator's ruling before writing. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`). The builder and reviewers run without route receipts, as direct invocations under loop-directive ruling 2026-10-13 (`loop-directive.md:57-58`).

## Acceptance Criteria

Each criterion names the decisions and plan-review findings it closes. Traceability: **R5** → AC-8; **R6** → AC-6, AC-7; **R13** → AC-17; **R16** → AC-9; **R18** → AC-16.

- [ ] **AC-1 Version and identity (D1, D2′, D7, R12).**
  - The file exists and contains exactly one line matching `^Registry version: 1$`.
  - It states that a change in meaning bumps the version and an editorial fix does not.
  - It states that a bump never alters an existing grant record, which keeps its own expanded text and version.
  - It declares itself the single source of truth, with goal records excluded from "documented once".
  - It declares its scope as foreman-line only, and says it is prose the Coordinator interprets, with no hook or expander.
- [ ] **AC-2 Fourteen entries (D5′, D8).**
  - There are exactly 14 `###` quick-flag entries, one per D8 canonical name. The deferred names (`--lint-only`, `--no-sleep`, `--budget N`, `--model-frontier`) are not entries.
  - Each entry has all seven labelled fields.
  - `Persistence:` reads `one-shot` for `--asrec`, `--dry`, `--status`, `--explain`, `--brief`, `--ratify`, `--halt` and `--resume`.
  - It reads `persistent` for `--blanket`, `--strict`, `--nopush`, `--dispatch-ok` and `--merge-ok`.
  - It reads `persistent (current parcel)` for `--review2`.
- [ ] **AC-3 Closed gate-interplay list (R11).**
  - The registry declares exactly these seven values: `none`, `restricts`, `delegates-within-ratified-scope`, `standing-gate-2`, `standing-gate-3-green-chain`, `gate-1-human-only`, `loop-control`.
  - Each entry's `Gate interplay:` holds exactly one of them, assigned as follows:

    | Gate interplay | Quick flags |
    |---|---|
    | `none` | `--status`, `--explain`, `--brief`, `--halt` |
    | `restricts` | `--strict`, `--nopush`, `--review2`, `--dry` |
    | `delegates-within-ratified-scope` | `--blanket`, `--asrec` |
    | `standing-gate-2` | `--dispatch-ok` |
    | `standing-gate-3-green-chain` | `--merge-ok` |
    | `gate-1-human-only` | `--ratify` |
    | `loop-control` | `--resume` |
- [ ] **AC-4 Gate-interplay statement (D4′, R2).**
  - V1 and V2 are present.
  - V2 is stated to apply to **every** quick flag, not only `--blanket` (`plan-review-findings.md:101`).
  - The statement says `--ratify`, `--dispatch-ok` and `--merge-ok` are the human's own exercise of Gates 1/2/3 within canon limits (`COORDINATOR-PATTERN.md:51-53`), not waivers.
  - It says `--merge-ok` never waives the green-chain contingency.
  - It says `--ratify` is human-issued only.
- [ ] **AC-5 `--blanket` (D4′, D10′, R2).**
  - The expansion is an allowlist covering only design questions inside the ratified scope plus rulings the coordinator already owns.
  - It covers nothing in V2, states that a Gate 1 re-opened by triage is Gate 1, and never grants an outward-facing action.
  - Every decision taken under it is logged in the AC-13 format.
- [ ] **AC-6 `--asrec` (D5′, D10′, R6).**
  - The expansion is one-shot: take the recommended option on each open question and the last-recommended next step, then stop at the next human gate.
  - It states that `--asrec` never grants a gate by answering a gate prompt.
  - A recommended step that is outward-facing or destructive is not covered.
  - Every decision is logged in the AC-13 format.
  - While a `--strict` record is active, it is handled per OQ-1.
- [ ] **AC-7 `--ratify` (D4′, R6).** The expansion is one-shot and human-issued only. A bare `--ratify` counts only if all of the following hold:
  - (a) the Coordinator's previous turn showed the revision of every file that holds the text being ratified (`charter.md`, and for an amendment package the file holding the amendment text, e.g. `plan-review-findings.md`): each file's commit SHA, or its `git hash-object` output if uncommitted (amendment A2)
  - (b) the file is unchanged since that turn
  - (c) the same message contains neither `--asrec` nor `--blanket`

  In addition:
  - `--ratify <rev>` must equal the full revision value shown, or a prefix of at least 7 hex characters of it (A2).
  - Failing (a), (b) or (c) means the ratification is refused and reported.
  - The same rule governs ratifying amendments after a scoped Gate 1 re-open.
  - The Coordinator never issues, infers or records `--ratify` on the developer's behalf.
  - Other quick flags in a message where `--ratify` is refused are handled per OQ-3.
- [ ] **AC-8 `--dispatch-ok` / `--merge-ok` (R5, D10′, SPEC-CONVENTION §8 item 4).**
  - Both require at least one parcel ID. Each ID must appear in the charter's Parcels table. An ID outside the table is refused as stop-and-report (`loop-directive.md:20`).
  - `--dispatch-ok` does not waive coordinator lint or the Step 0 gate.
  - `--merge-ok` covers only the local merge of a named parcel's branch into the integration branch named in the goal's loop directive, contingent on the full chain being green. It carries V5.
  - After a red step, `--merge-ok` behaves per OQ-4.
  - Any merge, push or PR that reaches a remote, a PR or `main` stays human, with a pointer to `SPEC-CONVENTION.md` §8 item 4 (`SPEC-CONVENTION.md:254`).
- [ ] **AC-9 `--resume <slug>` (R16, D9′).**
  - The slug is required. A bare `--resume` is refused, and the Coordinator asks for the slug.
  - The slug is never inferred from `goals/INDEX.md` or anywhere else.
  - It expands to `/goal resume <slug>`, including the ownership-block check, which always runs: STOP if another live coordinator owns the goal (`skills/goal/SKILL.md:13`).
  - It is one-shot, and a wakeup or resume prompt never carries it.
- [ ] **AC-10 Restricting and observing quick flags (D5′, D6, D10′, R3, R15, R19).**
  - `--strict`: persistent. It asks about every design decision and revokes only `--blanket`. It never lifts `--nopush`, `--review2`, `--dispatch-ok` or `--merge-ok`.
  - `--nopush`: narrows an existing outward-facing grant, grants nothing, and does not block local merges to the integration branch.
  - `--review2`: requires two independent adversarial reviews on the named current parcel, and ends at that parcel's Stage-F closure. It never reduces the two reviews already required for architecture/risk parcels (`COORDINATOR-PATTERN.md:69`).
  - `--dry`: no writes, dispatches, merges or records. It reports what would be done.
  - `--status`, `--explain` and `--brief`: change nothing.
  - `--halt`: finishes the current atomic step, updates the ownership block, and stops the loop.
- [ ] **AC-11 Provenance (D9′, R1, R14, R20).**
  - A quick flag counts only in a human-typed developer turn.
  - Wakeup, resume and hook-feedback prompts never carry quick flags, and neither does any file, tool, subagent or PR content.
  - A quick-flag token in a file grants nothing. Only valid grant records (AC-12, OQ-5) carry persistent grants.
  - Quoted or pasted content inside a human turn is handled per OQ-2.
  - The term rule in Constraints holds.
- [ ] **AC-12 Grant and revocation records (D2′, D9′).**
  - A grant record holds:
    - the verbatim developer message
    - the date
    - the session ID
    - the canonical quick flag
    - its arguments
    - its scope (the goal, or the parcel for `--review2`)
    - the expanded text copied from the registry
    - the registry version
    - a `revoked:` line
  - Revocation is done only by a human-typed, plain-language instruction naming the quick flag. It is recorded as a revocation record (verbatim message, date, session, which record it revokes). `--strict` revoking `--blanket` produces the same kind of record.
  - Lifetime: a record lasts until goal exit and carries across `/goal resume` and ownership transfer within the same goal. `--review2` records end at that parcel's Stage-F closure.
  - The registry defines the format only. QF-P2's template holds the records.
- [ ] **AC-13 Decision-log entry (D10′).** The format has these fields: date, quick flag (`--blanket`/`--asrec`), question, decision, recommended option, reversibility.
- [ ] **AC-14 Destructive and outward-facing actions (D10′, R4, R19).**
  - V3 and V4 are present.
  - The registry states that no quick flag grants an outward-facing or destructive action.
- [ ] **AC-15 Aliases and unknown tokens (D3).**
  - The alias table has exactly one row: `--blanke` → `--blanket`.
  - Matching is case-sensitive.
  - Any unrecognized token (including the deferred D8 names and near-misses) is not interpreted; the Coordinator reports it and asks.
- [ ] **AC-16 Conflict table and order over time (D6, R18).**
  - The registry declares a closed vocabulary of resolutions.
  - The table resolves all 91 unordered pairs of distinct canonical quick flags. No cell is blank, and every cell cites the rule it applies.
  - These cells are pinned:
    - `--blanket`×`--strict`: strict wins (D6)
    - `--asrec`×`--strict`: strict wins (D6)
    - `--ratify`×`--asrec` and `--ratify`×`--blanket`: `--ratify` is refused (R6)
    - `--dry`× each persistent quick flag: nothing is recorded, and the Coordinator reports what would have been recorded
    - `--status`, `--explain` and `--brief` × anything: independent
    - `--review2`×`--blanket`: independent
    - `--nopush`×`--merge-ok`: independent (D10′)
  - The order-over-time section states:
    - (T1) Within one message, the more restrictive quick flag wins and the Coordinator reports it.
    - (T2) An active restrictive record is never lifted by a later delegating quick flag. A `--blanket` sent while `--strict` is active is refused and reported; the developer must revoke `--strict` (T3) and then re-send `--blanket`.
    - (T3) Revocation works only as described in AC-12.
    - (T4) Lifetime is as described in AC-12.
    - (T5) A later registry version never changes an existing record.
- [ ] **AC-17 Prose grants (R13).**
  - V6 is present.
  - The registry states that a prose grant is never treated as a quick-flag record, and that no quick flag widens a prose grant, and none reinterprets, edits or revokes one (amendment A1). Restrictive quick flags (`--strict`, `--nopush`, `--dry`, `--halt`, `--review2`) limit the Coordinator's conduct while they are active, whatever the source of the authority, and leave the prose grant's text and validity unchanged.
- [ ] **AC-18 Charter summary superseded.** Where the registry covers `--resume`, `--nopush` and `--ratify`, it follows the amended rows (AC-7, AC-9, AC-10). It never cites `charter.md:40-65` as authority.
- [ ] **AC-19 Scope discipline.**
  - On branch `qf-p1`, `git diff --name-only <base>..HEAD`, where `<base>` is the `qf-p1` HEAD recorded in the build dispatch (amendment A3), lists only `plugins/foreman-line/docs/QUICK-FLAGS.md`.
  - `git diff --check` is clean.

## Out of Scope

- QF-P2:
  - the goal-skill "Quick flags" section and its synced copy
  - `templates/kickstarters/loop-directive-template.md`
  - the COORDINATOR-PATTERN cross-reference
  - any actual grant records or decision-log entries
- QF-P0: the authority-registry corpus amendment and its sweep diff. Whether `QUICK-FLAGS.md` should become an authority-registry source is an input to QF-P0 shaping, not decided here.
- QF-P3: the structural conformance check, its package and any test code.
- The exit-step dry-read walkthrough.
- Any edit to `charter.md`, `loop-directive.md`, `plan-review-findings.md`, `COORDINATOR-PATTERN.md`, `skills/goal/SKILL.md`, `SPEC-CONVENTION.md`, `STANDING-CONSTRAINTS.md`, `goals/INDEX.md` or `authority-registry/**`.
- Reinterpreting, revoking or migrating any existing prose grant (e.g. `goals/ops-console-roadmap-authority.md:10-21`, `goals/operator-developer-cortex-memory/ownership-transfer-2026-10-12-01a131a9.md:10-16`).
- The deferred quick flags (`--lint-only`, `--no-sleep`, `--budget N`, `--model-frontier`), and any quick flag outside D8.
- Push, PR, remote operations, status flips, registration and receipts.

## Context & References

- `plugins/foreman-line/docs/goals/quick-flags/charter.md`:
  - Objective: lines 17-22
  - D1–D10 as amended: lines 29-38
  - summary (non-binding): lines 40-65
  - QF-P1 row: line 70
- `plugins/foreman-line/docs/goals/quick-flags/plan-review-findings.md`:
  - R5: line 29
  - R6: line 30
  - R13: line 37
  - R16: line 40
  - R18: line 42
  - four waiver routes: lines 56-60
  - triage: lines 70-92
  - proposed D2′–D10′: lines 100-104
- `plugins/foreman-line/docs/goals/quick-flags/loop-directive.md`:
  - integration branch: line 8
  - Gate 2/3 grants and "red voids": lines 20-21
  - not granted: line 22
  - record section: line 33
  - ruling: lines 57-58
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`:
  - D4 role: line 7
  - Gate 1: line 30
  - gate table: lines 51-53
  - verbatim authorizations: line 55
  - two-review rule: line 69
  - stop conditions: line 73
- `plugins/foreman-line/skills/goal/SKILL.md`:
  - resume parsing: line 13
  - per-parcel cycle: line 32
  - human gates are stop conditions: line 36
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`:
  - §4.8 Allowed Files
  - §8 item 4 (Gate 3 bypass proof): line 254
- `plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml:2129`: precedent wording for an integration-branch-only merge where any red step voids the grant.
- `plugins/foreman-line/authority-registry/src/validate.ts:206-217`: the fixed source paths, which don't include `QUICK-FLAGS.md`.

## Assumptions

- `QUICK-FLAGS.md` does not exist at shaping time (verified by a `find` of `plugins/foreman-line` for `QUICK-FLAGS*`, which returned nothing).
- QF-P1 cannot cause authority-registry drift, because its single file is not a registry source (`validate.ts:206-217`).
- The goal's integration branch is `feat/foreman-line-quick-flags` (`loop-directive.md:8`). The registry names the target generically as "the integration branch named in the goal's loop directive" (D7 is foreman-line-wide, not this goal only).
- Goal exit is not restated here. QF-P1 contributes only "QUICK-FLAGS.md is merged to the integration branch" (`charter.md:76-82`), and a green parcel does not satisfy the goal exit.

## Open Questions

**Coordinator rulings 2026-10-13: OQ-1 through OQ-5 are resolved by accepting each stated default as binding.** Coordinator lint ran on disk: the spec-linter validates with exit 0, V1–V5 match their sources, and all 29 path:line citations resolve in range.

These were found while authoring, after the Step 0 answers. Each has a recommended default, and the ACs cite them. Coordinator lint rules on them before promotion.

- **OQ-1: `--asrec` while a `--strict` record is active.** **Default:** refused and reported, by applying D6 to the active state (the same pattern as T2 for `--blanket`).
- **OQ-2: quick-flag tokens inside quoted or pasted content in a human turn** (fenced code, block quotes, a pasted report). **Default:** they don't count. The Coordinator reports the token and asks.
- **OQ-3: other quick flags in a message where `--ratify` is refused.** **Default:** each is processed under its own entry, and the refusal is reported. `--asrec` then stops at the Gate 1 prompt, since it never grants a gate.
- **OQ-4: `--merge-ok` after a red step.** **Default:** the grant is voided for the parcel whose chain went red. Other parcels named in the same record are unaffected. A fresh green chain on that parcel after rework is covered only if the developer issues `--merge-ok` for it again. This does not affect the loop directive's prose Gate 3 grant (V6).
- **OQ-5: Grant-record validity.** **Default:** a record counts only if all of the following hold:
  - it was written by the owning Coordinator in the turn that answers the human-typed message it quotes
  - it has every AC-12 field
  - its verbatim message contains the token as typed: the canonical name or a documented alias (A1)
  - its registry version exists

  Anything else grants nothing. Residual risk: anyone with write access to the loop directive can still forge a record. D9′ accepts that risk by design, and reviewers should record whether the registry's text narrows it.

## Amendments (coordinator-ratified 2026-10-13, builder Step 0 rulings; committed alone before code)

- **A1 (F2, F11).** AC-17 and OQ-5 reworded as above. `--nopush` etc. remain meaningful over prose grants as conduct limits only.
- **A2 (F8, F9).** AC-7(a) binds to the revision of every file holding the text being ratified; revision format is a commit SHA or `git hash-object` output, matched exactly or by a prefix of at least 7 hex characters. This is spec-level; it does not change any locked decision, but it is recorded for the developer's awareness.
- **A3 (F4).** AC-19 `<base>` is the `qf-p1` HEAD recorded in the build dispatch.
- **A4 (F3).** V2 is introduced with "No quick flag waives, delegates on the human's behalf, or removes any of:". The next sentence states that `--ratify`, `--dispatch-ok` and `--merge-ok` are the human's own exercise of Gates 1, 2 and 3 (`--merge-ok` remaining green-chain contingent).
- **A5 (F5).** Closed pair-resolution vocabulary: `independent`, `restrictive-wins`, `ratify-refused`, `dry-records-nothing`. `--dry` wins against `--asrec`, `--resume`, `--ratify` and `--halt` (restrictive-wins; `--ratify` under `--dry` ratifies nothing and reports whether checks (a)–(c) would pass; `--halt` under `--dry` writes no ownership block and reports). `--halt` wins against `--asrec` and `--resume`. All other non-observer pairs are `independent`. If a `--resume` ownership check STOPs, no other quick flag in that message is processed.
- **A6 (F6).** A message containing an unrecognized token processes none of its quick flags; the Coordinator reports and asks.
- **A7 (F7).** `--review2` takes no argument; it binds to the parcel active when the message arrives and the record names it; with no active parcel it is refused.
- **A8 (F10, F12, F13, F14).** A revocation record points to its target by composite key (date, session, canonical quick flag, arguments); the target's `revoked:` line starts `revoked: no` and is later updated to cite the revocation. One `--asrec` covers only the questions open when it arrives plus the last-recommended step, and always stops at the next human gate. Each entry field is one line at column 0, `Label: value`, no bold; `Persistence:` and `Gate interplay:` hold bare values; `Canonical:` and `Aliases:` hold backticked tokens (`Aliases: none` where there is none); "expanded text" in a record means the entry's `Expansion:` line copied verbatim. `--dispatch-ok` and `--merge-ok` refuse the charter's "Exit step" row, which is not a parcel ID.
- **A9 (F15, F16, F17).** Cite SPEC-CONVENTION §8 item 4 only for the remote/PR/`main` boundary, never claiming it is satisfied for local merges. V1 is `charter.md:21-23`; the summary section ends at `charter.md:64`. Code-span literals are literal tokens; avoid "flagged" wording. The registry includes one sentence stating OQ-5's residual forgery risk.
- **A10 (builder BI-1..BI-9, ruled 2026-10-13 after the build claim).** BI-1 is a real gap, ratified as an amendment: a quick-flag token that is only mentioned (asked about, discussed, or named inside a revocation instruction) is not issued; if unclear, the Coordinator asks and processes nothing. BI-2 (token and argument parsing definition), BI-3 (each `<rev>` must match one of several shown revisions), BI-4 (bare `--merge-ok`/`--dispatch-ok` refused), BI-5 (ambiguous composite key revokes nothing), BI-6 (a red step voids `--merge-ok` with no revocation record), BI-7 (the `--resume` ownership check runs as a read under `--dry`/`--halt`), BI-8 (a valid ratification is recorded in the gate record, quoting the developer's message), BI-9 ("nothing in this registry relaxes canon; canon governs") are accepted as fail-closed additions. Reviewers are directed to attack each.

## Verification Plan

The coordinator runs these deterministic checks after the builder's claim:

1. `grep -c '^Registry version: 1$'` returns 1.
2. ``grep -c '^### `--'`` returns 14, and the set of names equals the D8 set.
3. Each entry has all seven labelled lines.
4. Every `Gate interplay:` and `Persistence:` value matches AC-2 and AC-3.
5. `grep -F` finds each of V1–V6.
6. The alias table has exactly one row.
7. The conflict table has 91 non-blank pair cells.
8. The term rule holds: every prose "flag(s)" is preceded by "quick", apart from the allowed exceptions.
9. `git diff --name-only` ⊆ Allowed Files, and `git diff --check` is clean.

Two independent frontier adversarial reviews follow (architecture/risk, `COORDINATOR-PATTERN.md:69`). They are read-only, per the ruling.

Mandatory reviewer focus questions:

- **Naive reading (STANDING-CONSTRAINTS #9), once per waiver route** (`plan-review-findings.md:56-60`). For each route, write the wrong-but-literal reading and show the registry's text excludes it:
  - (a) a quick-flag token or forged record in the loop directive grants `--blanket`
  - (b) the Coordinator issues a quick flag in its own wakeup or resume prompt
  - (c) `--asrec --ratify`, or `--blanket --ratify`, ratifies Gate 1
  - (d) `--blanket` covers a Gate 1 re-opened by triage
- Can `--merge-ok` be read as covering `main`, a PR, a push, a parcel outside the charter, or a chain after a red step? Can `--dispatch-ok` be read as covering a parcel outside the charter?
- Can `--strict` be read as lifting `--nopush` or `--review2`? Can `--nopush` be read as blocking the local integration-branch merge?
- Does the conflict table give one consistent result per pair, with no cycle and no blank cell? Does the temporal order ever let a later delegating quick flag lift an active restriction?
- Is any registry text readable as reinterpreting or revoking a prose grant (R13)?
- Does any expansion widen a decision beyond its D-row? Trace each AC to R5, R6, R13, R16, R18 and to D2′/D4′/D5′/D9′/D10′, word by word.

## Allowed Files

The builder may create exactly one path (`--tools` for the build session include a shell and write; the builder writes only this path and never runs git commit/push):

- `plugins/foreman-line/docs/QUICK-FLAGS.md`

This spec, its shaping-result artifact and its `docs/specs/INDEX.md` row are shaping-owned and read-only to the builder. No glob, directory, related file or temporary artifact is mutation authority. Any other path requires a coordinator-ratified spec amendment.

## Shaping Provenance

- Shaped in worktree `agent-skills-qf-p1`, branch `qf-p1`, with no route receipt. This was a direct invocation per the loop-directive ruling of 2026-10-13, dispatched per that ruling as claude-opus-5-5.
- Step 0 questions Q1–Q21 were all answered by the coordinator with "accept defaults".
- The advisory self-check (frozen frontmatter schema plus §4 body sections) was traced by hand against `spec-linter/src/schemas.ts` and `shaping/src/self-check.ts`, because the session had no shell. Coordinator lint must execute it and remains the sole promotion authority.
