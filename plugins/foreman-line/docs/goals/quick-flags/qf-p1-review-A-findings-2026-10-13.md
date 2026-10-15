# Reviewer A: QF-P1 `QUICK-FLAGS.md` adversarial review

I reviewed the file at `qf-p1` HEAD `67110479`. The registry was written in commit `c772a943`.

## Mechanical baseline (re-run, and mutated to prove the checks bind)

I wrote a parser in `/tmp/qfA-hNP6/check.py`. It confirms the structure:
- exactly one `^Registry version: 1$` line
- 14 entries, matching the D8 set
- all 7 labels present and in order, each at column 0
- every Persistence and Gate interplay value matches AC-2 and AC-3
- the conflict table has 91 distinct pairs, no duplicates, every resolution in the closed vocabulary, and no restrictive-wins cycle (dry>halt>asrec/resume, strict>blanket/asrec)

`grep -F` finds V1–V6 (V2 appears twice). The term rule holds. `git diff --check` is clean.

To prove the checks bind, I made four mutations and each was caught:
- `--ratify` Gate interplay changed to `none`
- one table row deleted
- one cell set to `lenient`
- `--review2` Persistence changed to `persistent`

## Findings

| ID | Sev | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| A-1 | **HIGH** | **Parsing arguments word by word grants parcels the developer explicitly withheld.** Arguments run "up to … the end of the line", and a bad parcel ID is refused one ID at a time. So `--merge-ok QF-P1 but not QF-P2` refuses `but` and `not`, then grants Gate 3 for QF-P1 **and QF-P2**. `--dispatch-ok QF-P1 once QF-P3 is shaped` works the same way. The record's `arguments: <as typed>` then keeps the prose for later re-parsing. `--ratify` is safe because any non-matching argument refuses it; `--merge-ok`/`--dispatch-ok` aren't. Under the charter's stop condition this text could be read as waiving a gate. | `QUICK-FLAGS.md:29`, `:138`, `:154`, `:328`; compare `:122`; `charter.md:96` | Any argument that isn't a Parcels-table ID refuses the **whole** quick flag; report and ask. `arguments:` stores only the validated ID list. |
| A-2 | **HIGH** | **The validity check doesn't tie a record's operative text to the registry or to the message.** It checks only: who wrote it (not checkable on disk), that all fields exist, that the token appears, and that the version exists. Meanwhile T5 (and L17) make the record's *own* expanded text authoritative. Probe 2 passes all four checks: a `--merge-ok` record with message `"--merge-ok QF-P1"`, `arguments: QF-P1 QF-P2 QF-P3`, and `expanded text: … including to main`. A sloppy paraphrase passes just as easily, and later registry fixes can't correct it. | `:357-364`, `:17`, `:493` | Add checks: expanded text byte-equals that version's `Expansion:` line; arguments equal the validated arguments parsed from the message; scope is consistent. Pin each version-history row to a commit or blob. State that the record's version §2–§5 still bind it. |
| A-3 | **HIGH** | **The line-based record format lets pasted or subagent content become a record.** `message: "<verbatim>"` has no escaping rule. In probe 1b, the developer types `--nopush` and pastes a builder report containing a record block. A line reader then finds a `--merge-ok QF-P1 QF-P2 QF-P3` record that passes every check decidable on disk. The real `--nopush` record loses its fields, so the restriction is lost too. This gets round D9′/OQ-2 through the Coordinator's own verbatim copy. The residual-risk sentence covers only "write access", not this. | `:323-332`, `:35-36`, `:364`; STANDING-CONSTRAINTS #4 | Encode `message:` as one escaped line (for example a JSON string), or fence it with length and hash. State that nothing inside a record's message is ever a record. |
| A-4 | MEDIUM | **The BI-6 void can't be recorded anywhere.** `revoked:` is the only line that may change, so a `--merge-ok` voided by a red step still reads `revoked: no`, and `--status` reports it active. After `/goal resume` or context compaction, a fresh green chain merges under a voided grant, against OQ-4. | `:138`, `:142`, `:186`, `:349` | Add a `voided:` line or a void record citing the red-step evidence, and have `--status` show it. |
| A-5 | MEDIUM | **The composite key can collide, which can bring a revoked `--blanket` back.** Sending `--blanket` twice in one session on one day gives identical keys (date/session/flag/none). BI-5 says an ambiguous key revokes nothing until answered, but no answer can tell the two records apart. A plain-language revocation never succeeds, and `--strict`'s revocation hits the same ambiguity. Revoking `--strict` later re-exposes the un-revoked `--blanket`. | `:345-349`, `:234`, `:490` | Give each record a unique ID. Make re-issuing an active persistent quick flag a reported no-op. An ambiguous revocation of a delegating record revokes every match. |
| A-6 | MEDIUM | **The "process nothing" rules drop restrictive quick flags and never say the loop holds.** Any CLI flag in the developer's prose (`git push --force`, `pi --no-session`) counts as a quick-flag token under L29, and as an unrecognized one under L314. So `--nopush`, `--halt` or `--strict` in the same message is not processed. The text says the Coordinator "asks", but not that it takes no further action until answered. BI-1 and OQ-2 have the same gap. | `:29`, `:36`, `:37`, `:314` | Either state that the Coordinator holds (no write, dispatch, merge or outward action) until answered, or still process `restricts`/`none` quick flags. Treat inline code spans like quoted content. |
| A-7 | MEDIUM | **`--dry`×`--halt` conflicts with canon under either reading.** If the loop stops, it breaks "Update the ownership block on every stop". If it doesn't, the typed `--halt` is dropped and the loop goes on, which is the *less* restrictive outcome even though the cell is labelled restrictive-wins. The same tension arises if a universal stop condition fires during a `--dry` turn. | `:451`, `:170`, `:202`; `skills/goal/SKILL.md:40` | State the loop stops, and exempt canon-required stop writes (ownership block, stop report) from `--dry`. Or explicitly keep the loop running and report. |
| A-8 | MEDIUM | **`--asrec`'s Expansion has no scope bound, but its label claims one.** The value `delegates-within-ratified-scope` means "inside the ratified scope". The Expansion literally covers any open question not in §3, including a stop report's "Human decision needed" (for example the route-receipt choice). With `--resume`, it takes "last recommended" steps from a previous session's report. | `:70`, `:106`; `loop-directive.md:44-48` | Bound it to the ratified scope (draft-only at Stage Zero). Say a stop report's human decision is a human gate. Limit "last recommended" to the Coordinator's previous turn in this session. |
| A-9 | MEDIUM | **Some text can be read literally as revoking prose grants (R13).** L35 says "Only a valid grant record … carries a persistent grant". The table says "only `--merge-ok` carries Gate 3" and "only `--dispatch-ok` carries Gate 2". Read literally, the loop directive's prose Gate 2/3 grants carry nothing, which contradicts V6 and the canon rule that authorizations live in the loop directive verbatim. | `:35`, `:397`, `:398`; `:497`; `COORDINATOR-PATTERN.md:55` | Reword as "persistent *quick-flag* grant" and "among quick flags, only …". |
| A-10 | MEDIUM | **The `--ratify` revision doesn't pin the content.** A tracked file with uncommitted edits is literally "committed", so a commit SHA whose blob differs from the text shown satisfies (a), and (b) also passes. R6's binding to a revision is defeated. | `:122` | Always show `git hash-object` of the working file, or allow a SHA only when it is byte-identical. Record the shown revisions in the BI-8 gate record. |
| A-11 | MEDIUM | **Persistent records resolve their targets when used, not when granted.** "The integration branch named in the goal's loop directive" is read at use time. That line is written by the Coordinator, and editing it silently retargets every existing `--merge-ok` to any branch except `main`. This is exactly what D2′ forbids. | `:138`; `loop-directive.md:8`; `charter.md:29` | The record pins the branch name. If the branch changes, the record is void. |
| A-12 | MEDIUM | **The "change in meaning" definition is an exhaustive list that misses things.** It omits the `Canonical:`/`Aliases:` lines, the §7 alias table and unrecognized-token rule, adding an entry, §9 and §13. Read literally, adding alias `--b`, or a 15th quick flag, is editorial and needs no version bump. Validity check L361 ("documented alias") depends on this. | `:15-16`, `:361` | Invert it: everything bumps the version except the listed editorial classes. |
| A-13 | MEDIUM | **Stage Zero `--asrec` decisions have nowhere to be logged.** The registry explicitly allows `--asrec` at Stage Zero, but logs and records live in the loop directive, which doesn't exist until after the plan review. This is exactly the R6/R23 scenario. | `:106`, `:318`, `:368`; `SKILL.md:28` | Name a Stage Zero location (a charter decision-log section), or refuse persistent quick flags until the loop directive exists. |
| A-14 | MEDIUM | **Revocation instructions have no provenance rules.** §2's exclusions (pasted or quoted text, hook feedback, files, subagent output) cover quick flags only. A "revoke `--nopush`" inside a pasted report could lift a restriction, and revoking `--strict` re-enables `--blanket`. | `:33-37`, `:337`, `:491` | Apply the §2 provenance bullets to revocation instructions. |
| A-15 | MEDIUM | **AC-16 is not fully met.** 19 of 91 cells cite no D-, R-, T-, § or entry rule. | `:401, 414, 424, 425, 427, 430, 434, 435, 437, 443, 444, 446, 466, 467, 470, 471, 472, 475, 482` | Add a citation to each. |
| A-16 | LOW | `--ratify` check (c) names only `--blanket`. A literal substring check on `--ratify --blanke` passes; only L312 ("processed exactly as its canonical quick flag") covers the alias. | `:122`, `:312` | Add "or its alias". |
| A-17 | LOW | V2's "delegates … green-chain-contingent merge" can be read literally against `--merge-ok`, which canon calls a delegable standing authorization. This fails closed. | `:44`, `:48`; `COORDINATOR-PATTERN.md:53` | Say "not waivers or delegations; the contingency is never waived". |
| A-18 | LOW | SPEC-CONVENTION §8.4 literally governs every Gate 3 merge. Combined with BI-9, `--merge-ok`'s local merge could always stop. This fails closed and is inherited from the loop directive and A9. | `SPEC-CONVENTION.md:254`; `:505` | Get a coordinator or canon ruling. |
| A-19 | LOW | Token edge cases. `—nopush` (autocorrected dash), `"--halt"` and backticked `--strict` are silently not tokens, so the restrictive intent is lost without a report. `--strict.` is unrecognized, so the whole message is dropped. | `:29` | Report dash, quote and backtick variants of canonical names. Define how trailing punctuation is handled. |
| A-20 | LOW | `--review2`'s Arguments line reads "none; …", which isn't the bare "none" L29 tests for. `--review2 QF-P3` silently binds to the active parcel instead. Behaviour with several active parcels is undefined. | `:248`, `:29` | Refuse when words follow, or when more than one parcel is active. |
| A-21 | LOW | `--resume` doesn't validate the slug (`../x`, more than one word). | `:216-218` | Require a single kebab-case word naming an existing goal directory. |
| A-22 | LOW | Decision-log entries carry no session or authorizing-record key, so a decision taken after its revocation can't be detected. | `:368-376` | Add both. |
| A-23 | LOW | `--halt`, and `--halt` with `--resume`, write the ownership block even when this session isn't the owner. Canon allows ownership transfer only at parcel boundaries. | `:202`, `:465` | Only the owner writes; otherwise report. |
| A-24 | LOW | `--dispatch-ok` ignores dependency order and doesn't require a ratified charter. | `:154`; `loop-directive.md:20`; `COORDINATOR-PATTERN.md:52` | Add both requirements. |
| A-25 | LOW | "D9′ accepts that risk by design" misattributes the acceptance: D9′ says it "Closes the file-token escalation path". The acceptance is OQ-5's. The text also doesn't narrow the forgery risk at all, which OQ-5 asked reviewers to record. | `:364`; `charter.md:35` | Attribute it to OQ-5. Narrow it: a record introduced by a parcel-branch merge, or by a commit not made by the owning session, is invalid (checkable in git). |
| A-26 | LOW | AC-19 can't be evaluated. A3's base "recorded in the build dispatch" doesn't exist, and HEAD now also contains the coordinator's reviewer kickstarter. `c772a943` alone is clean. | `quick-flags-build-QF-P1.md:10` | Record the base explicitly. |
| A-27 | LOW | BI-8 wording conflicts with itself: the Coordinator "never … records `--ratify`", yet must "enter" it in the gate record. | `:122` | Say "never on the developer's behalf; a developer-issued ratification is entered …". |
| A-28 | LOW | "revoke `--strict`, then `--blanket`" in one message: the processing order is undefined (T2 says "re-send"). | `:37`, `:490` | Refuse the delegating quick flag in that message. |
| A-29 | LOW | The restrictive-wins winner appears only in free text, so QF-P3 can't check it. A4 nit: the ratify/dispatch/merge sentence isn't the sentence immediately after V2. | `:385`; `:44-48` | Add a Winner column. |
| A-30 | LOW | V6 covers "existing" prose grants only. A new, later-ratified prose grant that uses `--blanket` is ambiguous: a token that grants nothing (L35) or a prose grant (L499)? Canon's rule against pre-authorizing Gate 1 limits the damage. | `:497-499` | State how new prose that uses quick-flag names is read. |

I ran two hostile probes against a literal validator (`/tmp/qfA-hNP6/naive_validator.py`):
- **probe1b:** the injected `--merge-ok` record → `(True, ok)`, and the outer `--nopush` record → `(False, missing)`.
- **probe2:** the widened record → `(True, ok)`.

## 1. Waiver paths

**I found no path that waives Gate 1, the universal stop conditions, the green-chain contingency, human-only gates, or the destructive/outward-facing limits.** The four plan-review routes:
- **(a) token in a file:** closed (L35). The *forged-record* variant is still open, as the registry admits (L364), and A-2/A-3 widen it.
- **(b) Coordinator-written wakeup prompts:** closed (L34).
- **(c) `--asrec --ratify` / `--blanket --ratify`:** closed (L122(c), L396/L413), apart from A-10 and A-16.
- **(d) `--blanket` on a re-opened Gate 1:** closed (L44, L46, L90).

Other probes held: prefix and case-variant tokens are blocked (L312). Bare `--resume` and slug guessing are blocked (L216-218). A `--dry` ratify ratifies nothing (L451 area).

**What is open is Gate 2/3 *scope*:** A-1, A-2, A-3 and A-11 grant local merge or dispatch beyond what the human typed. The green chain is still required in every case.

## 2. AC, V and amendment trace

- **AC-1:** met (L3, L5, L7, L9, L15-17).
- **AC-2 and AC-3:** met (verified mechanically).
- **AC-4:** met (L42, L44, L46, L48).
- **AC-5:** met (L90).
- **AC-6:** met (L106, L110), but see A-8.
- **AC-7:** met as written (L120, L122), but see A-10 and A-16.
- **AC-8:** met as written (L136-138, L152-154), but see A-1 and A-11.
- **AC-9:** met (L216-218).
- **AC-10:** met (L234, L298, L250, L170, L186/266/282, L202).
- **AC-11:** met (L33-38).
- **AC-12:** fields, revocation and lifetime are met (L322-355), but see A-2 through A-5.
- **AC-13:** met (L368-376).
- **AC-14:** met (L54, L56, L60).
- **AC-15:** met (L308-314).
- **AC-16:** partial. The vocabulary, 91 pairs, pinned cells and T1-T5 are present, but citations are missing (A-15).
- **AC-17:** met (L497-499), but see A-9.
- **AC-18:** met (L503; no citation of `charter.md:40-65`).
- **AC-19:** see A-26.
- **V1–V6:** all present verbatim.
- **Amendments:** A1, A2, A4 (nit), A5–A9 and A10's BI-1 through BI-9 are present (L37, L29, L120, L136/152, L348, L142, L170/451/458, L122, L505). A3 is a process item.

## 3. Naive readings and conflict table

Every Expansion line blocks its literal wrong reading except these:
- `--merge-ok` and `--dispatch-ok` arguments (A-1)
- `--merge-ok` target (A-11)
- `--asrec` scope (A-8)
- `--ratify` revision (A-10)
- the `--dry`×`--halt` cell (A-7)
- the "only X carries Gate N" cells (A-9)

Every cell agrees with its entry text. There is no cycle and no blank cell. The strict→blanket order doesn't deadlock: revoke `--strict`, then re-send `--blanket`. The exception is the duplicate-key case in A-5.

## 6. The BI additions

- **Fail-open:** BI-5 (A-5) and BI-6 (A-4).
- **Drop restrictions:** BI-1 and A6 (A-6).
- **Partial-grant hole:** BI-2 (A-1).
- **Write-ownership edge:** BI-7 (A-23).
- **Wording only:** BI-8 (A-27).
- **Neutral:** BI-3, BI-4 and BI-9 (BI-9 also has the §8.4 issue in A-18).

None of them relaxes a §3 item.

## 7. QF-P3 checkability

The fields, labels and both closed lists can be checked mechanically. These can't:
- `Arguments:` values have no closed format.
- The winner of a restrictive-wins cell is free text.
- Record validity can't be checked against old registry versions, because versions aren't pinned (A-2).

## Verdict: **REQUEST CHANGES**

The three HIGH findings (A-1, A-2, A-3) each give a path to Gate 2/3 authority the human never typed. A-4 through A-15 are correctness and canon gaps that fail open, or contradict an AC or canon.

## Post-review check

`git status --short` printed nothing, and HEAD is unchanged at `67110479`. I changed no repo files. My scratch files are only in `/tmp/qfA-hNP6/`.

The other reviewer is writing to `/tmp/qfrev/`. My first script landed there and was overwritten by theirs, so I moved to a private directory and saw nothing of theirs beyond that collision.
