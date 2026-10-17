# QF-P1 adversarial review (Reviewer B): `plugins/foreman-line/docs/QUICK-FLAGS.md` @ `67110479`

**Verdict: REQUEST CHANGES.** The registry meets the letter of 18 of the 19 ACs and has no BLOCKER: no quick flag waives Gate 1, the universal stop conditions, green-chain merge, human-only gates or the destructive/outward-facing limits. But four HIGH defects let a typed message, a file edit or a resume grant or keep more authority than the human intended. Two of them (H1 and H2) come from the builder additions BI-2 and BI-6, which the reviewers were told to attack.

## Mechanical checks

I ran these with a scratch script under `/tmp/qfrevB.N0OmUv`.

- **Version line:** `^Registry version: 1$` appears once.
- **Entries:** there are 14 `### \`--` entries and the set equals D8. Each has the 7 labels in order, at column 0, with no bold.
- **Field values:** every `Persistence:` and `Gate interplay:` value matches AC-2 and AC-3.
- **V1–V6:** `grep -F` finds each one (V2 twice).
- **Conflict table:** 91 pairs, no duplicates, no blanks, and every resolution is in the 4-term vocabulary.
- **Term rule:** passes; the only bare "flags" is the allowed disambiguation at line 27.
- **Whitespace:** `git diff --check` is clean.
- **The checks bind (rule 11):** I mutated a copy four ways and each check failed when broken. Deleting a table row gave 90 pairs; changing a value to `restrict` failed the gate-interplay check; bolding a label failed the label-order check; and an out-of-vocabulary resolution failed the vocabulary check.
- **Scratch-dir collision:** my first scratch dir, `/tmp/qfrev`, was written by another process during my run (a `pairs.json` holding a `lenient` cell that is not in the repo file). The repo file's md5 matches `HEAD`. Probably Reviewer A used the same path. I moved to a private dir. The repo is unaffected, but reviewer scratch paths are not isolated.

## Findings

| # | Sev | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| H1 | **HIGH** | **BI-2 argument parsing grants parcels the human excluded.** Arguments run "up to the next quick-flag token or the end of the line", and refusal is per ID. Literal reading of `--merge-ok QF-P1 but not QF-P2`: QF-P1 and QF-P2 are granted, and only "but" and "not" are refused. `--dispatch-ok QF-P1 hold QF-P0` grants QF-P0 the same way. The record also stores `arguments: <as typed>`, refused IDs included. When the "in the charter's Parcels table" check runs is unspecified (at grant or at use), and the table need not be ratified. So an ID refused today becomes live if someone later edits the charter's table. | :29, :136, :138, :152, :154, :328; spec A10 BI-2 | All-or-nothing: any argument word that is not a valid ID refuses the whole quick flag, and the Coordinator asks. Record only the accepted IDs. Check them once, at grant time, against the ratified charter revision. |
| H2 | **HIGH** | **BI-6: a red-step void is never persisted.** A red step voids `--merge-ok` "without a revocation record", and `revoked:` is "the only part of a grant record that ever changes". Records carry across `/goal resume` and ownership transfer, and `--status` shows `revoked: no`. A resumed or new Coordinator therefore sees the voided grant as live and merges the reworked parcel without the re-issue that OQ-4 requires. | :138, :142, :349, :353, :186 | Persist the void: either let the `revoked:` line (or a new `voided:` line) record "void for <parcel> on <date>, red step <x>", or have a red step emit a system revocation record for that parcel. |
| H3 | **HIGH** | **Revocation records have no validity rule. This is the R1 hole running in the restrictive direction.** §8's validity check covers grant records only. A file edit that turns `revoked: no` into a citation, or that adds a forged revocation record, lifts `--nopush`, `--review2` or `--strict`. Lifting `--strict` then re-enables `--blanket`. §2 doesn't catch this, because a revocation is not a quick-flag token. Also, "a revoked record grants nothing" says nothing about whether a revoked restrictive record stops restricting. | :347-349, :355, :357-364; spec AC-12 | Apply the validity rule to revocation records too: written by the owner in the answering turn, the message is a human-typed revocation naming the quick flag, and the key matches exactly one record. A `revoked:` line that cites no valid revocation record is treated as `no`. State plainly that a revoked restrictive record stops restricting. |
| H4 | **HIGH** | **Fail-open for restrictive quick flags.** A6 (unrecognized token), BI-1 (unclear whether issued or mentioned) and OQ-2 (quoted tokens) all say "process none, report, and ask". Nothing says to take no other action. So `--halt --no-sleep`, `--dry --nopsuh merge QF-P1` or `--nopush --stirct` drops the safety quick flag. A naive Coordinator then "asks" and carries on, including the prose instruction in the same message. This inverts D6's fail-safe direction. | :37, :314-315, :391 | Make the message inert: in these cases the Coordinator takes no action on the message and waits for the answer. Any recognized restrictive token in it (`--halt`, `--dry`, `--nopush`, `--strict`) is honoured provisionally. |
| M1 | MED | **The composite revocation key is not unique (BI-5), and ambiguity keeps grants alive.** Re-issuing `--merge-ok QF-P1` after a red step, which OQ-4 requires, typically gives the same date, session, quick flag and arguments as the original record. "Revokes nothing until answered" then keeps `--blanket`/`--merge-ok` active while the Coordinator waits. The answer cannot be expressed in the `revokes:` line, so the literal reading deadlocks. Revocation records are also cited by (date, session) only. | :345, :348-349 | Add a per-goal sequence number (`id:`) to both record types and key on it. On an ambiguous revocation of a delegating or gate record, suspend all matching records until the answer comes. |
| M2 | MED | **`--asrec` binds to file state after `--resume`.** It takes "the option it recommended" and "the next step it last recommended", and the cell says `--asrec` "applies only after the ownership check passes". Literal reading of `--resume quick-flags --asrec` in a fresh session: take recommendations read from the stop report or loop directive, which the human did not see this session. File content then drives a delegated decision. | :106, :414 | Bind `--asrec` to the questions and step stated in the Coordinator's immediately previous turn in this session. Refuse it in a message with `--resume`, or as the first message of a session. |
| M3 | MED | **`--ratify` (a) requires the revision to be shown, not the content.** A turn reading "charter @abc1234" satisfies (a). So an `--asrec` that answers every Stage Zero question, followed by a bare `--ratify` in the next message, still rubber-stamps decisions the human never saw (the core of R6). GS:15 requires presenting the decision list. BI-9 arguably restores that, but only indirectly. Also, "uncommitted" is ambiguous for a committed file with working-copy edits: the shown commit SHA ≠ the text shown. | :122; GS:15; CP:30 | (a) must also require that the previous turn presented the decision list or amendment text being ratified. "Uncommitted" should mean the working copy differs from HEAD. |
| M4 | MED | **Grant scope reads mutable files at use time, against D2′.** `--merge-ok` covers "the integration branch named in the goal's loop directive". Editing loop-directive line 8 retargets every existing grant to any local branch other than `main`. `--blanket` covers "rulings the Coordinator already owns under canon (CP:7)", so amending CP widens existing grants without a version bump. | :138, :90; charter D2′ ("a later edit never silently changes a grant") | Freeze the integration branch name into the record (`scope:` or `arguments:`). Enumerate the owned rulings inline, or say "as of registry version N". |
| M5 | MED | **`--dry --resume`: whether the loop is entered is unspecified.** `--dry` is "for this message only". The cell says the ownership check runs as a read and nothing is written, but not whether the loop is entered or a wakeup scheduled. The next wakeup is not "this message", so it runs non-dry without an ownership claim. That is a two-coordinator risk (CP:73, lesson 491fb80). | :170, :452 | Under `--dry`, no loop entry and no wakeup is scheduled. |
| M6 | MED | **AC-19 fails as written (coordinator side).** From every candidate base (`2837d974`, `5cbef8f3`, `56bbc917`), `<base>..HEAD` also lists `quick-flags-review-QF-P1.md`, and from the first two also the spec. A3's "base recorded in the build dispatch" is not on disk: the build kickstarter records no SHA. The builder's own commit `c772a943` touches only the allowed file. | `git diff --name-only`; `quick-flags-build-QF-P1.md` | Record the base SHA. Rule AC-19 as commit-scoped (`c772a943^..c772a943`), or keep coordinator commits off the parcel branch. |
| M7 | MED | **55 of 91 Rule cells cite no D/R/T/§ rule** (e.g. "Observer: …", "`--strict` is recorded; `--halt` stops the loop"). AC-16 requires that every cell cite the rule it applies, and this column can't be checked mechanically by QF-P3. | :402-485 (awk count) | Add a closed rule-ID set (e.g. `OBS`, `D5′`, `D6/T1`, `R6`, `A5`, `§2`) and require one per cell. |
| L1 | LOW | (c) checks the literal string "neither `--asrec` nor `--blanket`", so `--blanke --ratify` passes it. It is caught only via §7 ("processed exactly as its canonical") and the table. | :122, :312 | Add "or an alias" to (c). |
| L2 | LOW | BI-8's gate record quotes the message but not the ratified revisions, so a bare `--ratify` leaves no record of what was ratified. Literal §2 ("a token in a file grants nothing") makes a resumed Coordinator distrust the gate record. That fails closed but is unclear. "Never … records `--ratify`" sits beside "is entered in the goal's gate record". | :122, :35 | Record the shown revision values. Say that the gate record is evidence of a past human act, not a token. |
| L3 | LOW | The forgery residual is stated but not narrowed (the spec asks reviewers to say whether it is). There is no cross-check of the record's `session:` against the ownership-block owner for that date. A real *mention* quoted in a forged record passes the "contains the token" check. | :359-364 | Add the session = recorded owner check. |
| L4 | LOW | Pasted text with no fence or quote can't be told apart from typed text. That is a prompt-injection path from builder or subagent reports pasted by the human, and the residual risk is not acknowledged. | :36 | Acknowledge it. Require confirmation when a persistent delegating or gate quick flag appears next to pasted content. |
| L5 | LOW | `--halt` runs no ownership check, so a non-owning session writes the ownership block. | :202 | Apply the ownership check, or have `--halt` only report in a non-owner session. |
| L6 | LOW | `--review2` with several active parcels is undefined. Parcel-ID matching case is undefined. A partial revocation of a multi-parcel record is undefined. | :248, :154 | Refuse and ask. Make ID matching exact and case-sensitive. A per-ID revocation produces a new record. |
| L7 | LOW | The registry does not state A8's field grammar (bare values, backticked tokens, `Aliases: none`). Alias data lives in two places (the §7 table and the `Aliases:` lines). QF-P3 would have to read a spec that moves to `done/`. | :78, :306-310 | Restate the grammar in §6. QF-P3 should cross-check §7 against the `Aliases:` lines. |
| L8 | LOW | Decision-log entries have no session field and no link to the authorizing record or message. | :378-387 | Add `session:` and `authority:` (the record key, or the `--asrec` message). |
| I1 | INFO | Literal SPEC-CONVENTION §8.4 says Gate 3 is human-owned unless a bypass actor is proven. Read with BI-9 ("canon governs, the Coordinator stops"), every `--merge-ok` would stop. The registry follows CP:53 and A9 correctly, but the canon tension between CP:53 and §8.4 predates it. | SC:254; :505 | Coordinator ruling or canon note. Not a QF-P1 fix. |

## Mandate 1: waiver routes

None of these routes waives anything on the §3 list:

- **R1, token in file:** blocked by :35 and the §8 validity rule. The residual risk is stated, and forgery can't widen past §3. The analogous revocation hole is H3.
- **R14, wakeup prompts:** blocked by :34-35.
- **R6, `--asrec`/`--blanket` with `--ratify`:** blocked by (c) and `ratify-refused`. The alias case is L1; the two-message route is M3.
- **R2, re-opened Gate 1:** blocked; :90 says "A Gate 1 re-opened by triage is Gate 1".
- **Other probes:**
  - Quoted tokens and backticked words are not tokens (:29, :36).
  - Prefixes and case variants (`--bl`, `--Blanket`, `---blanket`, homoglyphs) are unrecognized or plain text, so they fail closed. The one exception is H4, where the "fail closed" handling also drops restrictive flags.
  - Mentions: BI-1, with H4's caveat.
  - Strict then blanket: no deadlock. "revoke `--strict`" is a mention per BI-1, and `--blanket` is then re-sent. The duplicate-key deadlock is M1.
  - `--resume`: the slug is never inferred.

The remaining paths widen or keep a grant, or drop a restriction. That is H1–H4, M2 and M4.

## AC and amendment trace

| Item | Result | Notes |
|---|---|---|
| AC-1 | ✓ | :3, :7, :9, :11, :13-17 |
| AC-2 | ✓ | |
| AC-3 | ✓ | |
| AC-4 | ✓ | :50-58 |
| AC-5 | ✓ | :90 |
| AC-6 | ✓ | :106, :110 |
| AC-7 | ✓ | Gaps in M3 and L1 |
| AC-8 | ✓ | Gaps in H1, H2 and M4 |
| AC-9 | ✓ | :218 |
| AC-10 | ✓ | |
| AC-11 | ✓ | :31-38 |
| AC-12 | ✓ (format) | Gaps in H3 and M1 |
| AC-13 | ✓ | |
| AC-14 | ✓ | :64-72 |
| AC-15 | ✓ | :304-315 |
| AC-16 | Partial | Pinned cells and T1–T5 are correct (:487-494); the rule citations are not (M7) |
| AC-17 | ✓ | :500-503 |
| AC-18 | ✓ | :499; `charter.md:40-65` is never cited |
| AC-19 | ✗ as written | See M6 |
| V1–V6 | ✓ | |
| A1, A2, A4, A5, A6, A7, A8, A9 | ✓ | |
| A3 | Unverifiable | See M6 |
| A10 | Present | Attacks: BI-1 → H4; BI-2 → H1; BI-3 → M3/L1; BI-4 ✓; BI-5 → M1; BI-6 → H2; BI-7 → M5; BI-8 → L2; BI-9 → I1 |

## Naive readings of each Expansion line

- **`--blanket`:** "rulings owned under CP:7 include merging" is blocked by the explicit exclusion list. The CP:7 indirection is M4.
- **`--asrec`:** "a recommended dispatch is a step, not a gate prompt" is blocked by :106 together with :60. The file-sourced reading is M2.
- **`--ratify`:** see M3 and L1.
- **`--merge-ok`:** `main`, PRs and remotes are blocked (:138). The other readings are H1, H2 and M4.
- **`--dispatch-ok`:** see H1.
- **`--dry`:** see M5.
- **`--halt`:** see L5.
- **`--resume`:** slug guessing is blocked. Path-like slugs are not constrained (LOW, included under L6's spirit).
- **`--strict`:** "lifts `--nopush`/`--review2`" is blocked.
- **`--review2`:** "caps reviews at two" is blocked by "never reduces".
- **`--nopush`:** "blocks the local merge" is blocked.
- **`--status`, `--explain`, `--brief`:** clean.

## Conflict table

All 91 pairs are internally consistent with the entry text and with A5. The 16 non-independent cells match the entries exactly. There are no cycles. Read on its own terms, T2 does not let a delegating quick flag lift a restriction; H3 and M1 are the gaps around it.

## Git status

`git status --short` shows no output: I caused no changes. HEAD is still `67110479`. `git stash list` shows one pre-existing entry; I never ran stash. My scratch files are only under `/tmp/qfrev*`.
