# Reviewer C, round 2: QF-P1 `QUICK-FLAGS.md` at `qf-p1` HEAD `27339c40` (rework commit `c6804b2d`)

**Verdict: REQUEST CHANGES.** I found no BLOCKER: nothing waives a §3 item. Rework 1 closes most prior findings, but two of its new mechanisms open new HIGH paths to Gate 3 authority. The mandated "every instance" sweeps also missed several instances.

## How I checked

Scratch work was private, under `/tmp/qfrevC.GUpU1R` (made with `mktemp -d`).

**Structure.** I wrote a parser (`check.py`). It confirms:
- one `^Registry version: 1$` line;
- 14 entries matching the D8 set, each with the 7 labels in order at column 0, and Persistence and Gate interplay values matching AC-2 and AC-3;
- the alias table has 1 row and agrees with the `Aliases:` lines;
- the conflict table has 91 distinct pairs, no blanks, every resolution in the closed vocabulary, and every Rule cell starting with IDs from the closed set followed by `: `;
- every Winner cell is consistent with its resolution, and there are no `restrictive-wins` cycles (`--dry` beats `--halt`, `--ratify`, `--resume` and `--asrec`; `--halt` beats `--resume` and `--asrec`; `--strict` beats `--blanket` and `--asrec`).

**Mutations (rule 11).** I broke the file eight ways and each break was caught: a bad rule ID, a blank Winner, a wrong `dry` winner, a deleted row, an alias mismatch, a backticked Gate interplay value, a wrong `asrec-refused` winner, and a missing `: ` separator.

**Other checks.**
- V1–V6 are each found by `grep -F` (V2 twice).
- The term rule holds: the only bare "flag" words are the record headers and the allowed disambiguation at QF:29.
- Every canon citation resolves to the right line.
- AC-19 (commit-scoped by A11): builder commits `c772a943` and `c6804b2d` each change only the registry, and `git diff --check` is clean.
- I compared the old and new text sentence by sentence. Nothing was removed outside the triage.

**Probes.** I wrote a literal reader of §8 and §9 (`probe.py`):
- **Probe 1:** a grant record injected through a decision-log `question:` field passes the validity check.
- **Probe 2:** QF-P1 is merge-covered again after a red-step void.
- **Probe 3:** the re-issue path that OQ-4 prescribes produces an invalid record.

I then patched the probe to apply each suggested fix: JSON-encode the field, and subtract voided IDs. Probes 1 and 2 then return nothing, so they bind to the gaps named below. Probe 3 still returns `False, 'args'`, so that gap needs a text fix (C-6).

## New findings

| ID | Sev | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| C-1 | **HIGH** | **A partial revocation re-grants a parcel that a red step voided.** Take `--merge-ok QF-P1 QF-P2` (record 3). QF-P1's chain goes red, so void record 5 says `voids: 3 / parcel QF-P1`. The developer then types "revoke `--merge-ok` for QF-P2". Record 3 is revoked, and derived record 7 gets "the original's minus the revoked IDs", which is QF-P1. The pre-merge check looks for "a void record for that record and that parcel", meaning record 7, and finds none. T4 also scopes the void "for that record". QF-P1 then merges on its next green chain with no re-issue, against OQ-4 and V5. This is a restrictive act by the developer that brings back a voided grant (probe 2). | QF:382, 397, 405, 582; QF:154 ("covered only if the developer issues `--merge-ok` for it again") contradicts §8's procedure | A derived record excludes every ID voided for its original. Or: a void binds to the parcel across every record derived from its target, and `derived from:` chains are followed in the pre-merge check. |
| C-2 | **HIGH** | **Same class as A-3, through the decision log, which the sweep missed.** The Encoding rule ("one line", "nothing inside … is ever a record") covers only `message:` and `evidence:` in the three §8 record types. §9's `question:`, `decision:`, `recommended option:` and `reversibility:` are free text. They are written by the owning Coordinator, and under `--blanket` they log rulings on builder Step 0 issues. A builder's multi-line issue copied into `question:` puts a `Quick-flag grant record` block at column 0 in the same section as the records ("Quick-flag records and decision log", loop-directive:31). That block passes every check decidable on disk (probe 1). QF:423's claim that a forged record "cannot be smuggled in inside a quoted message" is therefore incomplete. | QF:340-342, 427-439, 423 | Apply the Encoding rule to every field of every entry the loop-directive records section holds (decision-log entries and gate-record entries). Validity should also require that a record sits in its own section and is not inside another entry's field. |
| C-3 | MED | **H4 pattern, missed instance: a refused `--review2` drops the restriction while the loop keeps running.** `--review2 on this one` (words follow) or `--review2` with two active parcels is "refused and the Coordinator asks". The general argument rule also says only "reports … and asks". Neither makes the message inert, and provisional honouring applies only to inert messages. So the loop can review and merge the parcel with one review before the developer answers. | QF:264, QF:33, QF:47-49 | Any refusal of a restrictive quick flag makes the message inert, and the flag is honoured provisionally. Or: refusal of a restrictive quick flag for argument reasons honours it provisionally. |
| C-4 | MED | **A-1 pattern, missed instance: prose that qualifies a no-argument delegating flag is ignored.** For `Arguments: none`, "the following words are ordinary text". So `--asrec except Q3` takes Q3's recommended option too, and `--blanket but not on QF-P2's API` records the full blanket. `--merge-ok QF-P1` followed on the next line by "but wait for me" merges on green. In each case the Coordinator grants what the developer explicitly withheld. | QF:31, 122, 106 | If prose in the message limits, conditions or excepts a delegating or gate quick flag, refuse that quick flag, make the message inert, and ask. |
| C-5 | MED | **A-8/M2 sweep miss: `--ratify` binds to the "Coordinator's previous turn" without "in this session".** `--asrec` was bound to "immediately previous turn in this session" and refused with `--resume` or as a session's first message. `--ratify`, a Gate 1 act, got neither change. The `--ratify`×`--resume` cell even expects success ("evaluated only after the ownership check passes"). Naive reading: in a fresh session, the previous session's last turn (or the stop report in the loop directive) is "the previous turn". | QF:136, 138, 515 | Bind `--ratify` (a) and `<rev>` to the immediately previous turn in this session. Refuse it as a session's first message and beside `--resume`. Change the cell to `ratify-refused`. |
| C-6 | MED | **Two new rules contradict each other and break the OQ-4 re-grant path.** QF:383 says a re-issue writes a new record holding "only the IDs not so covered". QF:415 says `arguments:` must "equal the arguments validated from its message", with an exception only for derived records. So `--merge-ok QF-P1 QF-P2` after QF-P1 was voided produces a QF-P1-only record that fails validity (probe 3). The Coordinator either writes a void grant (fails closed, silently) or records both IDs, which overlaps an active record and makes later revocations ambiguous. | QF:383, 415 | Add a "re-issue subset" exception to the arguments check: a subset of the validated IDs, minus IDs covered at record time. |
| C-7 | MED | **The §2 code-span exception contradicts the §7 variant rule, on the registry's own example.** §2 says "revoke `--blanket`" in a code span is a mention, "so the revocation is processed". §7 lists `` `--strict` `` as a variant: "never issued … inert … a variant of a restrictive quick flag is honoured provisionally". Under §7, "revoke `--strict`" makes the message inert and provisionally *re-asserts* `--strict`, the opposite of the instruction. The result fails closed, but the contradiction is real. | QF:41, 334, 376 | In §7, exempt the code-span object of a plain-language revocation instruction, mirroring §2. |
| C-8 | MED | **A-19 sweep miss: the variant list is closed and misses common forms.** A word that does not start with `--` is neither a token nor a variant, so it is plain text: the message is not inert and nothing is reported. Examples: `(--halt)` (only *trailing* `)` is stripped), `*--strict*` and `**--nopush**` (markdown emphasis), `[--halt]`, smart quotes `“--halt”` and `‘--halt’`, and other Unicode hyphens (U+2010, U+2011, U+FF0D). The restrictive intent is silently lost. The direction is fail-open for restrictive flags (delegating ones also become plain text, which is safe). | QF:31, 334 | Make the rule open-ended: any word containing a canonical name or alias after stripping non-alphanumeric leading and trailing characters and normalizing any Unicode dash is a variant. |
| C-9 | MED | **The `charter revision:` pin trusts an unvalidated gate record.** It is "as the goal's gate record shows it", and gate-record entries have no validity rule: no owner or session check, no merge check, and no requirement to be a `--ratify` entry. An edited gate-record line can name a revision whose Parcels table adds a parcel never ratified at Gate 1. `--dispatch-ok QF-Pn` then passes the "ratified charter" check, so Gate 2 scope rests on Gate 1 evidence that was never validated. There is also a format clash: `--ratify` accepts `git hash-object` output for an uncommitted charter, but `charter revision:` requires a commit SHA. Live evidence: the gate record (`06bc86a4`, written by the coordinator after the fact) labels `2837d974` "ratified". That commit was made after re-ratification (`90f72d50`) and edited the charter's Gate 2 request line. See I-3. | QF:357, 138, 170; loop-directive:17 | Gate-record entries that `charter revision:` relies on must carry `--ratify` evidence or meet the §8-style validity rules. Accept a blob hash and define how it maps to a commit. |
| C-10 | MED | **A `--resume` refused for a bad slug lets the other quick flags in the message run in the wrong goal.** An ownership STOP blocks every other quick flag, but a slug refusal (typo, path, unknown goal) does not make the message inert. So `--resume quick-flgs --blanket`, typed into a session that owns goal X, records `--blanket` "for the goal it is recorded under", which is goal X, not the goal the developer named. | QF:232-238, 33 | Any refused `--resume` makes the message inert, like the STOP rule. |
| C-11 | LOW | `id:` has no validity rule: uniqueness and sequence are not checked. Duplicate IDs make id-keyed revocation ambiguous (forgery class). | QF:340, 407-417 | Add "its `id:` is unique and in sequence". |
| C-12 | LOW | Persistent quick flags typed into a session that does not own the goal have no rule; only `--halt` has non-owner text. The `--resume`×persistent cells say "recorded after the ownership check passes", but a passing check does not make the session the owner (validity needs session = owner). "Owner for the record's date" is ambiguous when ownership transfers within one day. | QF:218, 416, 492, 561-565 | A non-owner refuses and reports persistent quick flags. Key the owner check by time, not by date. |
| C-13 | LOW | At Stage Zero every persistent quick flag is refused, including `--strict`. A restrictive intent is refused rather than honoured as conduct. | QF:338, 443 | Honour restrictive quick flags at Stage Zero as conduct without a record. |
| C-14 | LOW | Version identity is not unique in git history. `c772a943` and `c6804b2d` both read `Registry version: 1` with different `Expansion:` lines, and the version-history row pins no commit or blob (A-2's suggestion was not adopted). "The integration branch" is undefined for later versions. The §1 rule ("later commit after first merge") decides it only on a careful reading. | QF:22-25, 414 | Pin each version row to the blob SHA at first merge. |
| C-15 | LOW | Spec gap (coordinator side): A5 fixes a 4-term vocabulary, and the registry adds `asrec-refused`. A5's "`--halt` under `--dry` writes no ownership block" is superseded only through the A11 triage, and the spec text was not reconciled. | spec A5; QF:452 | Spec note or amendment. |
| C-16 | LOW | `--dispatch-ok` checks for void records, but a void record can only name a `--merge-ok` record. The check can never fire. | QF:170, 397, 419 | Remove it, or define dispatch voids. |
| C-17 | LOW | Checks QF-P3 cannot do mechanically: <ul><li>A `restrictive-wins` Winner can't be checked for correctness, because there is no restrictiveness order. `--dry`×`--halt` names `--dry` even though `--halt`'s stop applies.</li><li>Persistence values are not declared as a closed list.</li><li>`Arguments:` is free text.</li><li>It is unclear whether record field values carry backticks.</li></ul> | QF:455-457, 548 | Declare a restrictiveness order and a closed Persistence list. Fix the value format. |
| C-18 | LOW | The residual-risk paragraph covers only forged *grant* records. A forged revocation record that lifts `--nopush` or `--strict` passes every disk-decidable revocation check and is not acknowledged. | QF:419, 423 | Extend the sentence. |
| C-19 | LOW | `--status` does not report provisional honouring or pending inert questions. Re-issuing `--strict` while an *invalid* `--strict` record exists is a no-op, so dismissing the defect afterwards drops `--strict`. | QF:202, 254, 421 | Report them; re-issue replaces an invalid record. |
| I-1 | INFO | The A-18/I1 tension (SPEC-CONVENTION §8.4 vs CP:53) is unchanged and correctly carried. A new related tension: SPEC-CONVENTION §8.2 says the *human* confirms Step 0, while `--blanket` covers the Step 0 rulings CP:7 gives the Coordinator. Both fail closed under QF:597. | SPEC-CONVENTION.md:249, 254 | Canon ruling. |
| I-2 | INFO | `--dry` suppresses restrictive records (`--dry --nopush` records nothing, and a pending wakeup continues). AC-16 pins this; tell the developer. | QF:186, 554 | None. |
| I-3 | INFO (coordinator side) | The charter was edited after re-ratification (`2837d974` adds QF-P0 to the Gate 2 request), and the gate record labels that commit "ratified". The edit is consistent with the ratified amendments, but there is no Gate 1 evidence for it. | `git show 2837d974`; loop-directive:17 | Coordinator ruling. |

## Mandate 1: waiver paths

**No quick flag waives any §3 item.** The four plan-review routes stay closed:
- **(a) token in a file:** blocked by QF:39. The forged-record residual is narrowed at QF:409-423, apart from C-2.
- **(b) wakeup prompts:** blocked by QF:38.
- **(c) `--asrec`/`--blanket` with `--ratify`:** check (c) now includes aliases (QF:138); the alias case and the R6 refusal hold. The cross-session case is C-5.
- **(d) re-opened Gate 1:** blocked by QF:56, 60 and 106.

Other probes held:
- Quoted tokens and code spans make the message inert (QF:40-41).
- `--blanke` works only as a documented alias.
- `--Blanket`, prefixes and `--dry-run` are unrecognized, so the message is inert.
- Mention vs issue: an unclear case makes the message inert (QF:42).
- Revocation provenance: QF:43-44.
- `--dry`/`--halt`: QF:186 and 548.
- `--resume` slug guessing: blocked by QF:232-234.

What remains open is Gate 3 scope (C-1, C-2), restrictions being dropped (C-3, C-8) and grants wider than the developer intended (C-4, C-5, C-10). The green chain is still required in every case.

## Prior-finding closure (round 1)

| Prior ID | Status | Quote or evidence |
|---|---|---|
| A-1, H1, A-24 | Closed | "Arguments are all-or-nothing … the whole quick flag is refused" (QF:33); "checked once, when the grant is recorded … ratified charter revision" (QF:154, 170); "Dependency order still binds" (QF:170). Missed instance: C-4. |
| A-2, L3 | Closed | Byte-equal expanded text, equal arguments, session = owner, not via a parcel merge (QF:413-417). The version pin is weak (C-14). |
| A-3, L4 | Partial | "Every `message:` and `evidence:` value is one line holding a JSON string" (QF:342). The decision log was missed: C-2. The pasted-content confirmation is in place (QF:44). |
| A-4, H2 | Closed, but regression | Void records (QF:385-397); `--status` shows "every void record against it" (QF:202). Derived records reopen the gap: C-1. |
| A-5, M1 | Closed, but regression | Every record has an `id:` (QF:340); revocations are keyed on it (QF:379); ambiguity suspends (QF:380); re-issue is a no-op (QF:383). New contradiction: C-6. |
| A-6, H4 | Partial | Inert messages and provisional honouring (QF:47-49); unrecognized tokens (QF:332). Missed instances: C-3, C-10. |
| A-7, M5 | Closed | "does not enter, continue or advance the goal loop … schedules no wakeup … canon-required stop write" (QF:186). |
| A-8, M2 | Closed for `--asrec` | "immediately previous turn in this session … refused … `--resume` … first developer message" (QF:122). Sweep miss: C-5. |
| A-9 | Closed | "Among quick flags, only …" at QF:39, 463, 487 and 488. No other unqualified "only X carries" sentence remains. |
| A-10, M3 | Closed | "presented the text being ratified … a file is uncommitted when its working copy differs from its content at HEAD" (QF:138). |
| A-11, M4 | Closed | `integration branch:` is pinned (QF:154, 358); the owned rulings are listed "as that list stands at this registry version" (QF:106). |
| A-12 | Closed | "A change in meaning is any change … that is not an editorial fix" (QF:15). |
| A-13 | Closed | Draft-charter decision log (QF:443). The restrictive case is C-13. |
| A-14, H3 | Closed | Revocation provenance (QF:43); revocation validity (QF:419); a `revoked:` line citing no valid revocation counts as `no` (QF:381); a revoked restrictive record stops restricting (QF:404). |
| A-15, M7 | Closed | All 91 Rule cells cite IDs from the closed set (checked mechanically). |
| A-16, L1 | Closed | "nor an alias of either" (QF:138, 142). |
| A-17 | Closed | "not waivers or delegations … never waives the green-chain contingency" (QF:58). |
| A-18, I1 | Informational, carried | QF:597; see I-1. |
| A-19 | Partial | Variants are defined at QF:334. Missed forms: C-8; contradiction: C-7. |
| A-20, L6 | Closed, but see C-3 | QF:264 refuses with words following or with several active parcels; matching is case-sensitive (QF:33); partial revocation writes a derived record (QF:382, but see C-1). |
| A-21 | Closed | The slug must be one kebab-case word naming an existing directory (QF:232). |
| A-22, L8 | Closed | `session:` and `authority:` fields (QF:432-434). |
| A-23, L5 | Closed | "Only the owning session … writes the ownership block" (QF:218). |
| A-25 | Closed | "Residual risk (OQ-5, accepted) … narrow that risk" (QF:423), but the "cannot be smuggled" claim is wrong (C-2). |
| A-26, M6 | Closed (coordinator side) | The builder commits touch only the allowed file. |
| A-27, L2 | Closed | "never … on the developer's behalf; a developer-issued ratification … is entered"; the entry is "evidence of a past human act" (QF:138). |
| A-28 | Closed | T2: "A message that revokes `--strict` and also contains `--blanket` or `--asrec` refuses … the delegating quick flag" (QF:580). |
| A-29, L7 | Closed | Winner column; field grammar (QF:94); QF-P3 cross-check (QF:330). The Winner can't be checked for correctness (C-17). |
| A-30 | Closed | "A prose grant written or ratified after this registry … is a prose grant" (QF:591). |

## AC, V and amendment trace

- **AC-1:** met. QF:3 (version line); "single source of truth" (QF:7); "foreman-line only" (QF:9); "no hook, expander or parser" (QF:11); bump and no-bump rules (QF:15-17).
- **AC-2 and AC-3:** met, checked mechanically (§5 at QF:78-88).
- **AC-4:** met. V1 at QF:54; V2 at QF:56; the human's own Gates 1–3 at QF:58; "every quick flag" at QF:60.
- **AC-5:** met. Allowlist, the V2 list, "re-opened by triage is Gate 1", logging (QF:106).
- **AC-6:** met (QF:122). OQ-1 is at QF:124. C-4 applies.
- **AC-7:** met: (a), (b) and (c), the `<rev>` prefix, the scoped re-open and "never on the developer's behalf" (QF:136-138). OQ-3 is at QF:138. C-5 applies.
- **AC-8:** met: parcel IDs required, "Exit step" refused, V5, §8.4 pointer, lint and Step 0 kept (QF:152-170). C-1 and C-9 apply.
- **AC-9:** met (QF:232-234).
- **AC-10:** met (QF:250, 316, 266, 186, 202/282/298, 218).
- **AC-11:** met (QF:37-45). C-2 and C-8 apply.
- **AC-12:** met: grant fields (QF:349-363), revocation (QF:371-381), lifetime (QF:400-405), format only (QF:338). C-1 and C-6 apply.
- **AC-13:** met; the fields are a superset (QF:430-438).
- **AC-14:** met (QF:68, 70, 74).
- **AC-15:** met (QF:326, 328, 332).
- **AC-16:** met. The vocabulary is closed, 91 pairs, every pinned cell correct, T1–T5 at QF:579-583, and closed rule IDs.
- **AC-17:** met (QF:587-591).
- **AC-18:** met. QF:595 follows the amended rows and never cites `charter.md:40-65`.
- **AC-19:** met, commit-scoped.
- **V1–V6:** all present verbatim.
- **Amendments:**
  - A1: met (QF:589, 411).
  - A2: met (QF:136-138).
  - A3/A11: met.
  - A4: met. QF:56 is immediately followed by QF:58.
  - A5: met, except the vocabulary deviation in C-15.
  - A6: met (QF:332).
  - A7: met (QF:264).
  - A8: met (QF:94, 379-381, 154, 170).
  - A9: met. The §8.4 pointer covers only the remote boundary; there is no "flagged" wording; there is a residual-risk sentence.
  - A10: present.

## Naive readings, conflict table and canon

- **Expansion lines:** each blocks its literal wrong reading, except `--merge-ok` (C-1), `--asrec` and `--blanket` (C-4), `--ratify` (C-5), `--review2` (C-3) and `--resume` (C-10).
- **Conflict table:** all 91 cells agree with the entry text and contain no cycle. The only Winner oddity is `--dry`×`--halt` (C-17).
- **Order over time:** strict then blanket does not deadlock (revoke `--strict` in one message, then send `--blanket`). Provisional `--strict` ends when the developer answers.
- **Canon:** citations resolve and the ownership-write rule matches GS:40 together with CP:73. The remaining tensions are I-1 and I-3.

## BI-1 to BI-9

- **BI-1:** C-7.
- **BI-2:** C-3, C-4, C-6.
- **BI-3, BI-4, BI-5, BI-7:** hold. BI-5 is now keyed on `id:` (C-11).
- **BI-6:** C-1, a regression introduced through the derived records.
- **BI-8:** C-9.
- **BI-9:** I-1.

None of them relaxes a §3 item. C-1 and C-2 are new escalation paths in Gate 3 scope.

## QF-P3 checkability

These can be checked mechanically, and I did check them: entries, labels, both closed lists, the alias cross-check, pairs, the resolution vocabulary, Winner consistency with the resolution, and rule-ID format and membership. These can't, as listed in C-17: whether a `restrictive-wins` winner is correct, the `Arguments:` lines, the Persistence list, and the value format inside records.

## Git control

`git status --short` printed nothing, HEAD is unchanged at `27339c40`, and the registry's md5 equals HEAD's blob. I changed no repo files; scratch files are only under `/tmp/qfrevC.GUpU1R/`.

**Verdict: REQUEST CHANGES.** The HIGH findings C-1 and C-2 must be fixed. C-3 to C-10 are MEDIUM, and several are missed instances of the triage's "every instance" sweeps.
