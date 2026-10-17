# Reviewer D: QF-P1 `QUICK-FLAGS.md`, round 2

Reviewed at `qf-p1` HEAD `27339c40`. The builder's rework commit is `c6804b2d`. I worked read-only. My scratch directory was the private `/tmp/qfD-GioHuH`, made with `mktemp -d`.

## Mechanical baseline (re-run, with mutations to prove the checks bind)

I wrote a parser (`check.py`). It reports zero errors on HEAD:
- `^Registry version: 1$` appears once.
- There are 14 entries, matching the D8 set. Each has its 7 labels in order at column 0, and the `Canonical:` line matches the heading.
- Every `Persistence:` and `Gate interplay:` value matches AC-2 and AC-3. The §5 list has exactly 7 values.
- The alias table has 1 row and agrees exactly with the `Aliases:` lines.
- The conflict table has 91 distinct pairs equal to C(14,2).
- Every resolution is in the §10 vocabulary.
- The Winner column follows its rule:
  - `independent` → `none`
  - `dry-records-nothing` → `--dry`
  - `ratify-refused` and `asrec-refused` → the quick flag that is not refused
  - `restrictive-wins` → a member of the pair
- Every Rule cell starts with IDs from the closed 15-ID set.
- `restrictive-wins` has no cycle: dry > halt > {asrec, resume}, dry > {asrec, ratify, resume}, strict > {blanket, asrec}.
- V1 and V3–V6 each appear once; V2 appears twice.
- The term rule passes. The only bare "flags" is the allowed one at L29.
- `git diff --check` is clean.

Each of 7 mutations made the checker fail:
- a winner set to `--ratify` in a `ratify-refused` row
- a winner on an `independent` row
- rule ID `OBX`
- a cell with no rule ID
- `Aliases: none` on `--blanket`
- a winner outside its pair
- the `--resume` gate-interplay value changed

AC-19 (commit-scoped by A11) passes. The builder commits after `c772a943^` are `c772a943` and `c6804b2d`, and each touches only `QUICK-FLAGS.md`.

## Findings

| ID | Sev | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| **D-1** | **HIGH** | **Records can still be injected through the loop directive. This is a missed instance of A-3.** The one-escaped-line encoding and the rule that nothing inside a value is a record cover only `message:` and `evidence:` (L342). Records are not tied to a location: L338 only *describes* where they live, and none of the §8 validity bullets (L407-417) requires the records section. Decision-log fields (`question:`, `decision:`, `recommended option:`, `reversibility:`, L435-438) have no encoding rule. The decision log sits in the same loop-directive section as the records (`loop-directive.md` "Quick-flag records and decision log"). Stop reports are also written into the loop directive. So a builder's Step 0 issue, logged "as it would have been asked" under `--blanket`, can carry a column-0 `Quick-flag grant record` block. That block passes every check decidable on disk: the owner's session ID is readable in the ownership block, the expanded text can be copied byte for byte, the message validly yields the arguments, and it arrives by a Coordinator write, not a merge. **Probe 2** (`probe.py`): a forged `--merge-ok QF-P2` record was parsed out of a decision-log `question:` and counted as covering QF-P2. With JSON encoding, it parsed to nothing. The residual-risk sentence at L423 ("cannot be smuggled in inside a quoted message") claims more than the text delivers. | L338, L340, L342, L407-417, L423, L435-438; STANDING-CONSTRAINTS #4 | A record counts only inside the records section. Every value in that section, decision-log entries included, is one JSON-string line. A record header anywhere else in a goal file, or inside any quoted or fenced text, is never a record. |
| **D-2** | **HIGH** | **A derived grant record brings a voided parcel back into coverage. This regression comes from combining two new mechanisms.** Void records key on `voids: <target's id> / parcel <ID>` (L391). The pre-merge check is "a void record for **that record** and that parcel" (L397). A derived record copies the original's arguments "minus the revoked IDs" (L382), so it keeps the voided ID, and it gets a new `id:` that no void record names. Example: record 1 is `--merge-ok QF-P1 QF-P2 QF-P0`; QF-P1 goes red (void 2); the developer revokes only QF-P0 (revocation 3). Derived record 4 then covers QF-P1, and the next green chain merges it without the re-issue that OQ-4 requires. Reading L154 and L170 as "any void record for the parcel" instead breaks the OQ-4 re-issue path at L383. Either reading contradicts something. **Probe 1:** QF-P1 was covered by `[]` before the partial revocation and by `['4']` after. | L154, L382, L383, L391, L397, L403 | Derived records exclude voided IDs, or void records carry over to derived records. State one rule for what "covers" means and use it at L154, L170 and L397. |
| D-3 | MED | **`--asrec` can answer the new "until the developer answers" questions, so a delegating quick flag can lift a restriction or a void suspension.** These all end on a developer answer and say nothing about who may give it: an invalid void record's suspension (L419), an invalid restrictive record (L421), provisional honouring ("or says it was not meant", L49), and inert messages (L47). `--asrec` takes the option the Coordinator recommended in its previous turn (L122). Example: "Void 12 is malformed; I recommend treating it as not counting." The developer replies `--asrec`, the suspension lifts, and a red-voided parcel merges. The gate-prompt guard at L122 does not clearly reach "is this record valid?" questions. This breaks T2's spirit (L580). | L47, L49, L419, L421, L122 | State that each of these questions is answered only by an explicit human-typed reply. `--asrec` and `--blanket` never answer them, and `--asrec` is refused while one is pending. |
| D-4 | MED | **An invalid revocation fails open for delegating and gate records. A-14 and M1 are only partly closed.** A `revoked:` line that cites no valid revocation record counts as `no` (L381). An id/key mismatch makes the revocation invalid, and the Coordinator "asks" with no suspension (L379). Compare the fail-closed rules for ambiguous revocations (L380) and invalid voids (L419). After revoke-then-re-grant in the same session and on the same day, records 1 and 3 share the composite key (date/session/`--blanket`/none). So "identify the same record" fails for a correct revocation of record 3, and `--blanket` stays live after the human revoked it. Editing one character of a revocation's `session:` brings a revoked `--merge-ok` back the same way. | L379, L380, L381, L419 | An invalid revocation record suspends its delegating or gate target until a human answers. Define the cross-check as "the fields of the record named by `id:` equal the repeated key". |
| D-5 | MED | **A restrictive quick flag that is refused gets dropped, while gate or delegating quick flags in the same message go ahead. This is a missed instance of the A-6/H4 sweep.** An invalid argument refuses the quick flag and the Coordinator "asks", but the message is not inert (L33, L264). Take `--review2 QF-P3 --merge-ok QF-P3`: QF-P3 is a Standard parcel with one review. `--review2` is refused because a word follows it, `--merge-ok` is recorded, and QF-P3 merges after one review. Other cases: `--review2` with several active parcels (L264), and `--strict`/`--nopush` refused at Stage Zero (L338) while `--asrec` stays usable. | L33, L264, L338, L479-481 | When a restrictive quick flag is refused, make the message inert and honour that quick flag provisionally. At minimum, block every gate or delegating quick flag in that message. |
| D-6 | MED | **Inert and provisional state is never persisted (the H2 pattern again).** Provisional honouring "writes no record" (L49), and the inert pause is never written anywhere. After the session ends, context is compacted, or `/goal resume` runs, a provisional `--nopush`, `--strict` or `--review2` is gone and the loop continues. Only a provisional `--halt` survives, through the canon stop writes. | L47-50 | An inert message stops the loop with canon stop writes. The stop report names the pending question and every quick flag being honoured provisionally. |
| D-7 | MED | **The A-19 variant sweep is incomplete.** `(--halt)`, `[--nopush]`, `**--strict**`, `---halt` and an NBSP-joined `now --halt` are not quick-flag tokens: the word doesn't start with `--` followed by a letter (L31). They are not variants either, because the L334 list has no brackets, emphasis markers or extra dashes. So they become plain text: no report, no inert message, no provisional honouring, and the loop continues. Any word that does start with `--`+letter fails closed, so the gap is only these wrapper forms. | L31, L334 | Extend the variant rule: any word that contains a canonical name or alias as a substring, after stripping non-letter wrappers, is a variant. |
| D-8 | MED | **What remains of A-1/H1: the argument span ends at the end of the line.** In `--merge-ok QF-P1 QF-P2⏎but hold QF-P2 until I've read the review`, the second line is plain text, so an unconditional Gate 3 grant is recorded for both parcels. The same happens with a qualifier written before the token. | L31, L33 | Any other text in the message that qualifies, conditions or negates a gate or delegating quick flag, or names one of its parcels, makes the message unclear: it is inert and the Coordinator asks. |
| D-9 | LOW | **Two different "Registry version: 1" texts exist in git history.** `c772a943` and `c6804b2d` differ in 9 of 14 `Expansion:` lines; for example, the old `--blanket` text has no version bound on owned rulings. The version-history row is not pinned. "The integration branch" (L25) is undefined across goals (D7), so the L414 byte-equality check has no single reference. | L19-25, L414; `git show c772a943:…` | Pin each version row to a commit, or to a digest of its `Expansion:` lines, at merge. Or squash-merge, and name the branch. |
| D-10 | LOW | It is ambiguous whether `expanded text:` includes the `Expansion: ` label ("the entry's `Expansion:` line, copied verbatim"). The byte-equality check can't be implemented until that is decided. | L92, L361, L414 | Say "the text after `Expansion: `". |
| D-11 | LOW | Void records can target only `--merge-ok` (L385, L419), yet the `--dispatch-ok` pre-dispatch check looks for one (L170, L397). That check can never match. | L170, L385, L397, L419 | Drop the check from `--dispatch-ok`, or define dispatch voids. |
| D-12 | LOW | "The owner for the record's date" (L416, L419): the ownership block holds only the current owner, and a same-day transfer is ambiguous. This makes D-4 worse. | L416, L419 | Resolve the owner from git history of the block, with a tie-break rule. |
| D-13 | LOW (coord) | `charter revision:` trusts the gate record (L357), and gate-record lines have no validity rule. The live gate record says "`charter.md` last committed at `2837d974`". That commit edited the charter's Gate 2 request *after* the re-ratification, so it is not obviously the ratified revision. The Parcels table is unchanged, so there is no impact today. | L357; `loop-directive.md:17`; `git diff 90f72d50 2837d974` | Pin to a revision that a human ratification entry cites. |
| D-14 | LOW (coord) | Spec A5 still says `--halt` under `--dry` "writes no ownership block", and that the vocabulary has four terms. The registry follows A11 instead: stop writes are exempt, and `asrec-refused` is added. A QF-P3 check written from A5 would reject L504. | spec A5; L504, L541 | Reconcile A5 with A11 in the spec. |
| D-15 | LOW | The A-25 directive said a record "introduced by a commit not made by the owning session … is invalid". It was replaced by a note that this can't be checked (L423). That is reasonable, but it is an unflagged departure from the triage. | L417, L423 | Coordinator to accept it explicitly. |
| D-16 | LOW | L527 cites `GATES`, but its text is about what the chain contains. With `--ratify` plus `--dispatch-ok`/`--merge-ok` in one message (for example, an amendment that adds QF-P5), the outcome depends on processing order, although L479 says the table doesn't depend on order. | L511, L527, L479 | Use `SUBJ` for L527. Process `--ratify` last, or refuse gate quick flags whose IDs only the same message ratifies. |
| D-17 | LOW | The confirmation rule for pasted content leaves out `--resume` (L44). An unfenced `--resume other-goal` pasted from a report can start a loop on an unowned goal under its prose standing authorizations. | L44 | Add `--resume`. |
| D-18 | INFO | A-18/I1 is carried forward (SPEC-CONVENTION §8.4 vs CP:53, BI-9 at L597). SPEC-CONVENTION §8.2 ("the human confirms" Step 0) sits uneasily with CP:7. The registry fails closed, because the Step 0 gate is never covered (L106). | SC §8.2, §8.4; L106, L597 | No QF-P1 fix needed. |

## (a) Closure of the prior findings

| Prior ID | Status | Quote / note |
|---|---|---|
| A-1, H1 | Closed (D-8 remains) | L33: "Arguments are all-or-nothing … the whole quick flag is refused". L152/L168: "if any word does not, the whole quick flag is refused". |
| A-2 | Closed (D-9, D-10 remain) | L414: "byte-equals that quick flag's `Expansion:` line at the record's registry version"; L415 covers arguments; L416 covers session. |
| A-3 | **Not complete** (D-1) | L342 covers only `message:` and `evidence:`. |
| A-4, H2 | Closed (D-2 regression) | L385-392 void record; L202 "every void record against it". |
| A-5, M1 | Closed (D-4 remains) | L340 `id:` sequence; L380 suspension; L383 no-op. |
| A-6, H4 | Mostly closed (D-5, D-6 remain) | L47 "inert"; L49 provisional honouring. |
| A-7, M5 | Closed | L186: "does not enter, continue or advance … schedules no wakeup … canon-required stop write". |
| A-8, M2 | Closed (D-3 is new) | L122: "immediately previous turn in this session … refused … with `--resume`, and as the first developer message". |
| A-9, A-17 | Closed | L39 "Among quick flags, only"; L58 "not waivers or delegations"; L463/L487/L488. |
| A-10, M3 | Closed | L138 (a): "presented the text being ratified … a commit SHA is never shown for such a file". |
| A-11, M4 | Closed | L154 "which the record pins"; L106 "as that list stands at this registry version". |
| A-12 | Closed | L15-16 inverted bump rule; "Any edit to an `Expansion:` line is a change in meaning". |
| A-13 | Closed | L443, draft-charter decision log. |
| A-14, H3 | Partly closed (D-4) | L43, L419; a revoked restrictive record stops restricting (L404). |
| A-15, M7 | Closed | Verified mechanically (91/91 cells cite rule IDs). L527 misuses one ID (D-16). |
| A-16, L1 | Closed | L138 (c): "nor an alias of either". |
| A-18, I1 | Informational, carried | D-18. |
| A-19 | **Not complete** (D-7) | L334. |
| A-20, L6 | Closed (D-5 remains) | L264, L33 "case-sensitively", L382. |
| A-21 | Closed | L232: kebab case, existing directory, `..` and `/` refused. |
| A-22, L8 | Closed | L431-432 `session:` and `authority:`. |
| A-23, L5 | Closed | L218: "in any other session the Coordinator writes nothing". |
| A-24 | Closed | L170, dependency order and ratified revision. |
| A-25, L3 | Mostly closed (D-15) | L416-417, L423 attributed to OQ-5. |
| A-26, M6 | Closed (coordinator side) | Commit-scoped check passes. |
| A-27, L2 | Closed | L138: "never … on the developer's behalf; a developer-issued ratification … is entered … not a quick-flag token". |
| A-28 | Closed | L580 (T2), L110. |
| A-29, L7 | Closed | Winner column, L94 grammar, L330 cross-check. |
| A-30 | Closed | L591. |
| L4 | Closed (D-17) | L44 residual risk and confirmation. |

## Mandate 1: waiver paths

**No BLOCKER.** I found no path that waives Gate 1, the universal stop conditions, the green-chain contingency, human-only gates, or the destructive/outward-facing limits.

- **R1 (token or forged record in a file):** the token case is closed (L39). The forged-record case is accepted residual risk, but D-1 shows it can be reached from subagent output without any write access.
- **R14 (Coordinator-written prompts):** closed at L38.
- **R6:** closed at L138 (c) and L486/L511, including `--blanke`.
- **R2 (re-opened Gate 1):** closed at L56 and L106.
- **Other probes, all of which held:**
  - quoted tokens and code spans (L40-41)
  - mention vs issue (L42, accepted judgment)
  - prefix and case variants (L328; unrecognized makes the message inert)
  - `--dry`/`--halt` (L541)
  - slug guessing (L234)
  - strict-then-blanket: no deadlock (L580)
- **Weaknesses that remain:** D-2 and D-3 get around OQ-4's re-issue requirement after a red step. A fresh green chain is still required, so the green-chain contingency itself holds. D-4 through D-7 keep a grant alive or drop a restriction.

## Mandate 2: AC, V and amendment trace

- **AC-1:** met (L3, L7, L9, L11, L15-17).
- **AC-2 and AC-3:** met (mechanical checks).
- **AC-4:** met (L54, L56, L58, L60).
- **AC-5:** met (L106).
- **AC-6:** met (L122, L126; OQ-1 at L126/L250), but see D-3.
- **AC-7:** met (L136, L138).
- **AC-8:** met (L152-158, L168-174; V5 at L154; SC §8 item 4 pointer at L154), but see D-2.
- **AC-9:** met (L232-234).
- **AC-10:** met (L250, L314, L266, L186, L202/L282/L298, L218).
- **AC-11:** met (L37-46).
- **AC-12:** met (L348-362, L366-372, L399-405).
- **AC-13:** met (L429-438).
- **AC-14:** met (L68, L70, L74).
- **AC-15:** met (L326, L328, L332).
- **AC-16:** met, with one ID nit (D-16).
- **AC-17:** met (L587-591).
- **AC-18:** met (L595; `charter.md:40-65` is never cited).
- **AC-19:** met (commit-scoped).
- **V1–V6:** present verbatim (L54, L56/L106, L68, L70, L154, L587).
- **Amendments:**
  - A1 is at L589.
  - A2 is at L136-138.
  - A4 is at L56-58.
  - A5 is in the table, but see D-14.
  - A6 is at L332.
  - A7 is at L264.
  - A8 is at L94 and L379.
  - A9 is at L154 and L423.
  - A10: BI-1 through BI-9 are present.
  - A11 is honoured, except where D-1, D-5 and D-7 are incomplete sweeps.

## Mandate 3: naive reading of every Expansion line

These Expansion lines block their literal wrong reading: `--blanket` ("no merge is among these rulings"), `--ratify`, `--dry`, `--status`, `--halt`, `--resume`, `--strict`, `--explain`, `--brief` and `--nopush`. The exceptions:
- `--asrec`: D-3
- `--merge-ok`: D-2 and D-8
- `--dispatch-ok`: D-8 and D-11
- `--review2`: D-5

## Mandate 4: conflict table

All 91 cells agree with the entry text. There is no cycle and no deadlock. The only problems are D-16 (L527 cites the wrong rule ID, and `--ratify` with a gate quick flag depends on processing order).

## Mandate 5: canon

- `/goal resume` parsing (GS:13) is consistent.
- CP:30 (Gate 1), CP:52-55 (Gates 2/3) and CP:73 (universal stop conditions) are consistent.
- GS:40 stop writes are respected (L50).
- Canon tensions with SPEC-CONVENTION are covered in D-18.

## Mandate 6: BI-1 through BI-9

| BI | What it covers | Weakness found |
|---|---|---|
| BI-1 | mention vs issue | judgment residual only |
| BI-2 | argument parsing | D-8 |
| BI-3 | `<rev>` matching | neutral |
| BI-4 | bare `--merge-ok`/`--dispatch-ok` refused | sound |
| BI-5 | ambiguous composite key | D-4 |
| BI-6 | red-step void | D-2 |
| BI-7 | `--resume` check under `--dry`/`--halt` | sound |
| BI-8 | gate-record entry | D-13 |
| BI-9 | canon governs | D-18 |

None of them relaxes a §3 item. D-2 and D-3 are new escalation paths that came in with the rework.

## Mandate 7: QF-P3 checkability

The fields, both closed lists, the Winner column, the rule IDs and the alias cross-check can all be checked mechanically; I proved this by mutation. The open items for QF-P3 are D-10 and D-14. `Arguments:` values are still free prose.

## Verdict: **REQUEST CHANGES**

Two HIGH findings:
- **D-1:** subagent text can become a valid Gate 3 record through the decision log or stop reports.
- **D-2:** a derived grant record brings a voided parcel back into coverage.

Six MEDIUM fail-open gaps remain: D-3 through D-8.

## Post-review check

`git status --short` printed nothing, and HEAD is still `27339c40`. I made no changes to the repo. Scratch files are only in `/tmp/qfD-GioHuH/`.
