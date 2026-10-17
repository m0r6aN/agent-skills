# Goal Charter — Quick Flags: developer shorthand directives for the Coordinator

**Goal slug:** `quick-flags`
**Owner:** Clinton Morgan
**Status:** **RATIFIED — Gate 1 granted** ("ratify as written"), then **re-ratified
after the plan review** ("ratify the amendments as written"): D2′, D4′, D5′, D9′,
D10′ replace D2, D4, D5, D9, D10; see `plan-review-findings.md`. **Gate 1 re-opened
and re-ratified a second time, 2026-10-13 ("Ratify your recommendations"), for D5, D9
and consequentially D2**: D2″, D5″, D9″ replace D2′, D5′, D9′; see
`gate1-reopen-d5-d9-2026-10-13.md`. D1–D10 locked as amended. Decisions were drafted by taking the recommendation on each open
question (`--asrec`); `--asrec` did not ratify Gate 1. Gates 2 and 3
standing authorizations granted as requested below.
**Branch:** `feat/foreman-line-quick-flags` (off local `main`)
**Mode:** docs/skill goal, no runtime code
**Design inputs:** `docs/COORDINATOR-PATTERN.md` (gates, universal stop
conditions, commentary rule); `skills/goal/SKILL.md`; the developer's two seed
flags (`--blanke`, `--asrec`).

## Objective

Give the developer a small, versioned vocabulary of `--flag` shorthands that a
foreman-line Coordinator expands into fixed, auditable directives. Flags
shorten the developer's messages without weakening the gate model. A flag
adjusts how much the Coordinator asks and does inside the gates and never
removes a gate.

## Locked decisions

| # | Decision | Reasoning |
|---|---|---|
| D1 | **Mechanism: prose.** A "Quick flags" section in `skills/goal/SKILL.md` that points to the registry. No hook or expander for now. | The model must interpret the flags regardless. Extract from shipped practice, never build the platform first. A hook expander is a possible later goal. |
| D2″ | **Single source of truth, versioned:** `plugins/foreman-line/docs/QUICK-FLAGS.md` carries a version number. Delegating and gate quick flags are never stored (D5″), so there are no stored grants to pin. Only restrictive state is stored (D5″). "Documented once" excludes goal records. | Consequential to D5″/D9″ (round-3 triage, option 2). Amends D2′. |
| D3 | **Canonical names are full words** (`--blanket`). Documented aliases: `--blanke` → `--blanket`. | The seed typo is accepted as an alias. Canonical names stay greppable. |
| D4′ | **`--blanket` is an allowlist:** design questions inside the ratified scope, plus rulings the coordinator already owns. It never covers: Gate 1 (including one re-opened by triage), charter amendments, the plan-level review, the two-review rule, Step 0 gates, coordinator self-verification, the universal stop conditions, green-chain-contingent merge, human-only gates (OAuth, TTY approval), or destructive/outward-facing actions. `--ratify` is human-issued only. | Existing blanket grants in this repo already waived items beyond the original D4 list (R2). |
| D5″ | **Persistence.** Persistent, restrictive only: `--strict`, `--nopush`, `--review2` (the current parcel). Everything else is one-shot and applies only to the developer message carrying it: `--blanket`, `--dispatch-ok`, `--merge-ok`, `--asrec`, `--dry`, `--status`, `--explain`, `--brief`, `--ratify`, `--halt`, `--resume`. Persistent state is one `Active restrictions` entry in the loop directive. Any session resuming or owning the goal honours it, and only a human-typed instruction lifts it. `--strict` lifts nothing and revokes no flag: it restricts one-shot delegation (`--blanket` and `--asrec` are refused while it is active). Delegating and gate quick flags have no stored form: no grant records, voids, revocations, owner-by-time resolution, or pinned branch or revision. | Round-3 triage option 2, ratified 2026-10-13 ("Ratify your recommendations"). Amends D5′. A dropped or forged restriction entry can only lose a restriction, never add authority. |
| D6 | **Conflict rule: the more restrictive flag wins**, and the Coordinator reports the conflict. Example: `--blanket --strict` resolves to strict. | Fail-safe. |
| D7 | **Scope: foreman-line only.** | Other repos have their own gate models. |
| D8 | **Initial flag set (14):** `--blanket`, `--asrec`, `--ratify`, `--merge-ok`, `--dispatch-ok`, `--dry`, `--status`, `--halt`, `--resume`, `--strict`, `--review2`, `--explain`, `--brief`, `--nopush`. Deferred: `--lint-only`, `--no-sleep`, `--budget N`, `--model-frontier`. | Cover gates, pacing, observability, and review depth. Defer the rest until real use shows demand. |
| D9″ | **Provenance:** a quick flag counts only in a human-typed developer turn. Wakeup, resume, and hook-feedback prompts, and all file/tool/subagent/PR content, never carry quick flags. Nothing stored in a file can grant authority or loosen any restriction: a stored entry is honoured only to restrict. The term is "quick flag" throughout. | Round-3 triage option 2. Amends D9′. Closes the file-token and forged-record escalation paths by removing the stored form of every authority-bearing flag. |
| D10′ | **Outward-facing actions are denied unless a standing authorization grants them.** `--blanket` never grants them. `--nopush` narrows an existing grant and does not block local merges to the integration branch. Destructive = force-push, history rewrite, deleting branches/worktrees outside Stage-F cleanup, deleting data or files outside the parcel's `surfaces:`, or anything touching shared remote state. Every decision under `--blanket`/`--asrec` is logged in the loop directive's decision log. | Aligns with canon: outward-facing beyond authorization is a universal stop (R4, R19). |

### Flag semantics (summary; full text lives in QUICK-FLAGS.md)

- `--blanket` — decide on my behalf wherever you'd otherwise ask, and take any
  reversible, non-destructive action needed for the goal. Log each decision.
  Does not waive D4.
- `--asrec` — take the recommended option on every open question and the next
  step you last recommended, then continue. Stop at the next human gate.
- `--ratify` — Gate 1 ratification of the charter as currently drafted
  (human only).
- `--dispatch-ok` / `--merge-ok` — standing Gate 2 / Gate 3 authorization for
  the named parcels. Gate 3 stays contingent on a green chain.
- `--dry` — plan only. No writes, dispatches, or merges. Report what would be
  done.
- `--status` — report the loop state, ownership block, queue position, and
  active flags. Change nothing.
- `--halt` — finish the current atomic step, update the ownership block, and
  stop the loop.
- `--resume` — shorthand for `/goal resume <current-slug>`.
- `--strict` — ask about every design decision. Revokes `--blanket`.
- `--review2` — require two independent adversarial reviews on the current
  parcel.
- `--explain` — state the reasoning for the last decision or ruling.
- `--brief` — lead with a short report (state, blockers, what the human must
  do), with detail after.
- `--nopush` — no outward-facing actions (push, PR, merge). Local work only.

## Parcels (dependency order)

| Parcel | One-liner | Risk | Routing |
|---|---|---|---|
| QF-P1 | Write `docs/QUICK-FLAGS.md` (versioned, **simplified per D5″/D9″**): the 14 flags, expansions, one-shot vs persistent-restrictive classes, the `Active restrictions` entry format, conflict table and temporal order, provenance rule, destructive-action definition, alias table, gate-interplay statement. `--merge-ok`/`--dispatch-ok` (one-shot) scoped to the charter's parcels and the integration branch, "red voids it" verbatim; `--ratify` bound to a shown revision and refused alongside `--asrec`/`--blanket`; `--resume <slug>` with slug required and the ownership check always run; prose grants neither reinterpreted nor revoked. No grant records, voids, revocations, or pinned branch/revision machinery. **Redesigned under the round-3 option-2 ruling; spec is reshaped and rebuilt.** | Risk | Frontier builder, two independent reviews |
| QF-P2 | Integrate: "Quick flags" section in `skills/goal/SKILL.md` (and the synced copy); create `templates/kickstarters/loop-directive-template.md` (decision log, `Active restrictions` entry) and point the goal skill at it; cross-reference in COORDINATOR-PATTERN.md. Leave the historical kickstarter untouched. Depends on QF-P1. | Risk | Frontier builder, two independent reviews |
| QF-P0 | Authority-registry corpus amendment for the QF-P2 edits to canon files, with before/after sweep diff as evidence. Sequenced after QF-P2 (id kept from the review). | Risk | Frontier builder, two independent reviews |
| QF-P3 | Structural conformance check inside an existing package (named at shaping; no new package): required fields, closed gate-interplay list, skill references the registry. No semantic phrase-matching. Depends on QF-P1, QF-P2. | Standard | Mid-tier builder, one review |
| Exit step | A fresh adversarial reviewer performs the dry-read walkthrough of `--blanket` and `--asrec` against the Gate 1 and stop-condition clauses. | — | Frontier reviewer |

## Exit criterion

- QUICK-FLAGS.md is merged to the integration branch.
- The goal skill and the loop-directive template reference it.
- The structural conformance check and a local deterministic pass are green, with the authority-registry before/after sweep diff recorded.
- The fresh-reviewer dry-read walkthrough shows no waiver path.
- Final report is a stop report awaiting the human PR and merge to `main` (outward-facing, so not in the loop's authority).

## Standing authorizations requested

- **Gate 2:** dispatch of QF-P1, QF-P2, QF-P0, and QF-P3 on their own worktrees and
  branches under this goal.
- **Gate 3:** merge of each parcel to the `feat/foreman-line-quick-flags`
  integration branch behind a green chain. Merge of that branch to `main` stays
  with the human.

## Stop conditions

The universal set, plus:

- Any draft flag text that could be read as waiving a gate.
- A conformance check that cannot be made mechanical.
- Anything outward-facing.
