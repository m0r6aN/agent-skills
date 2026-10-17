# Reviewer E, round 3: QF-P1 `QUICK-FLAGS.md` at `qf-p1` HEAD `09c5031a` (rework 2 is `b3cc8f11`)

**Verdict: REQUEST CHANGES.** One HIGH finding, a regression introduced by rework 2. No quick flag waives any item on the §3 list. Seven MEDIUM findings remain, and five of them are fail-open paths.

## Method and control

- **Scratch directory:** private, `/tmp/qfrevE.PFMbmO`, made with `mktemp -d`.
- **Structural parser (`check.py`):** zero errors at HEAD. It confirms:
  - `Registry version: 1` appears once.
  - There are 14 entries matching the D8 set, each with 7 labels in order. Persistence and Gate interplay values match AC-2 and AC-3.
  - The alias table has 1 row and agrees with the `Aliases:` lines.
  - The conflict table has 91 distinct pairs, all resolutions come from the 5-term vocabulary, and every Winner is consistent with the declared order `--dry` > `--halt` > `--strict` > `--nopush` > `--review2`.
  - The rule-ID table equals the 16-ID closed set, and every Rule cell starts with IDs from it.
  - V1–V6 are present verbatim.
  - Every AC-16 pinned cell is correct.
- **Mutations:** I broke the file 8 ways and the parser caught every one: a wrong winner in `restrictive-wins`, `asrec-refused` and `--dry`×`--halt`; a Persistence value outside the list; a bad rule ID; an alias mismatch; a duplicate pair; a backticked Gate interplay value.
- **Other checks:**
  - The term rule passes. The only bare "flags" is the allowed one at L29; the others are `Quick-flag … record` headers.
  - `git diff --check` is clean.
  - AC-19, commit-scoped: `b3cc8f11` touches only the registry.
  - The file is 596 lines against a 597-line baseline, inside the +40 limit.
  - Every canon citation resolves.
- **Literal-reader probe (`probe.py`), with mutations:**
  - A prose re-ratification that drops P4 still gives `DISPATCH`. Ratifying R2 with `--ratify` instead gives `STOP`.
  - A red step with no void record leaves the parcel covered (`True`). Adding void id 5 gives `False`.

## Findings

| ID | Sev | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|
| E-1 | **HIGH** (fail-open, canon contradiction, regression) | **§8 Terms redefines "ratified" for the whole registry, so a later prose Gate 1 act is invisible.** Terms says a charter revision "is ratified only if a gate-record entry that quotes the developer's `--ratify` message verbatim … shows it". The drop and dependency checks only look at a "later **ratified** charter revision". Take a `--dispatch-ok P4` record pinned to R1 (ratified with `--ratify`). After triage the developer re-ratifies R2, which drops P4 or changes its dependencies, in prose. This is exactly how this goal's own Gate 1 was done ("ratify the amendments as written"). Neither check fires, and P4 is dispatched, or merged on green, against the human's latest Gate 1 act. Dependency order is also read from the stale pinned revision. Canon (CP:30, GS:20) requires explicit ratification, not the `--ratify` token. The rework-1 text did not have this restriction; R2-10 scoped it to what `charter revision:` relies on, and the builder generalized it. Side effect: a goal ratified in prose (this one) has no "ratified scope", so `--dispatch-ok` and `--merge-ok` are always refused. That fails closed, but it still contradicts canon. | L344; L154 ("If a later ratified charter revision drops…"); L170; L396; loop-directive:16; probe output | Scope the `--ratify`-only definition to the `charter revision:` pin. Make the drop and dependency checks fire on **any** later charter revision that differs from the pinned one: stop and report, whatever the form of ratification. |
| E-2 | MED (fail-open against OQ-4/V5) | **Whether a `--merge-ok` record covers a parcel depends only on void records, and "red step" is never defined.** "Covers … only if … no void record with a higher `id:`… voids that parcel". The pre-merge check is "checks that the record covers that parcel". If no void was written, the parcel stays covered and the next green chain merges without the re-issue OQ-4 requires. Two ways that happens: a red step judged not "red" (for example a REQUEST CHANGES review treated as triage), or a missed write. The integration-branch pin is also enforced only through a void record. | L154, L384, L396; probe | Define "red step" as a closed list (any failed deterministic step, closure-check failure, tripwire, or review verdict other than ACCEPT). Before a merge, scan the parcel's chain since the record's `id:` for any red step and the branch named now against the pinned one. Write the void and refuse if either hits. |
| E-3 | MED (fail-open, plus a deadlock under the naive reading) | **A revocation held in an inert message does not suspend its target.** "Revoke `--merge-ok`" plus any refusal or variant in the same message makes the message inert, so no revocation record is written. Suspension is defined only for ambiguous or invalid revocation records (L379-380). After any answer the text never says whether the held revocation is processed or must be re-sent. Processing it late would fail validity ("in the turn that answers the … message it quotes"). So the grant usually survives, and the developer believes it was revoked. **Naive reading:** limiting prose refuses any of the five quick flags that other text "negates". A revocation negates its object, so revoking `--blanket`, `--merge-ok` and the others is always refused and the message goes inert. Re-sending does the same, so the grant cannot be revoked. | L33, L42, L47, L379-380, L419 | Limit limiting prose to issued tokens and exclude revocation instructions explicitly. A revocation held in an inert message suspends its delegating or gate targets until answered. Say that held content is never processed later and must be re-sent. |
| E-4 | MED (fail-open; D-6 only partly closed) | **Pending questions and provisional honouring do not survive the session.** They are written into the stop report (L50), but nothing binds a later or resumed session to them. L39 says file content "never carr[ies] quick flags", and nothing says `--resume` / `/goal resume` leaves the pending question open ("continue from the recorded state", GS:13). Naive reading: a resumed loop drops provisional `--strict` (un-suspending `--blanket`) or `--nopush`. A non-owner inert message persists nothing at all. | L39, L47-50, L234; GS:13 | State that any session resuming or owning the goal honours the provisional quick flags and the pending question named in the latest stop report, until the explicit answer. `--resume` never answers it. |
| E-5 | MED (contradiction; fail-open for `--halt`) | **`--dry` leaves a pending wakeup in place even when the loop stops.** `--dry` says "a wakeup already pending is left as it is", and only "updates the ownership block and writes the stop report" are exempt. Yet `--dry`×`--halt`, an inert message under `--dry`, and a provisional `--dry` all say "the loop stops". Canon stops the loop with `ScheduleWakeup stop:true` (GS:40), which is not exempt. Literal reading: the pending wakeup fires after a `--dry --halt`. | L186, L540, L50; GS:40 | Add cancelling the pending wakeup to the canon stop exemption, everywhere that exemption appears. |
| E-6 | MED (contradiction with spec A13) | **K2 versus the meaning of `restrictive-wins`.** K2 says "a same-message D6 loss is a refusal", which makes the message inert and stops the loop. §10 says "where `--dry` or `--halt` wins, the other is not refused". Those cells cite D6 (`--asrec`/`--ratify`/`--resume`/`--halt` × `--dry`; `--asrec`/`--resume` × `--halt`). Under §10, `--dry --asrec` leaves the loop running on its pending wakeup; under K2 the loop stops. | L452, L497/499/510/540/541/554; spec A13 K2 | Coordinator: rule K2's scope (`--strict` wins only?) in a spec note, or align §10. |
| E-7 | MED (mechanical-checkability gap) | **The gate-record entry has no defined form, but it alone decides "ratified" and `charter revision:`.** It has no header, no field names, and no date or order key for "the latest … written before the message". It also has no validity rule: no owner or session check, and no exclusion for parcel-branch merges, unlike grant and revocation records. This goal's own gate-record pin (`06bc86a4`) exists only on parcel branch `qf-p1`. QF-P3 cannot check it. | L138, L342, L344, L417; `git log feat/foreman-line-quick-flags -- loop-directive.md` | Define the gate-record entry format (header, `date`, `session`, `message`, `revisions`) and give it the §8 validity rules. |
| E-8 | MED (fail-open, mechanical) | **The registry never says which branch's copy of the loop directive holds the records.** Owner history ("git history of that block") and the records differ per branch; this is live today, since the integration branch lacks `06bc86a4` and `eb8ac741`. A revocation written into a parcel worktree's copy is invisible to a pre-merge check run in the integration worktree, so the merge proceeds under a revoked `--merge-ok`. After the merge, the revocation is "introduced by the merge of a parcel branch" and does not count. | L338, L406, L417, L419 | Pin one authoritative copy: the integration branch, committed there. All checks read only that copy. Records written elsewhere don't count, and their revocations suspend their targets. |
| E-9 | LOW (fail-open, narrow) | `--strict` revokes only "every **active** `--blanket` record". A suspended `--blanket` survives, and comes back into force while `--strict` is active once its suspension is answered (against the spirit of T2). | L250, L379 | Revoke every unrevoked `--blanket` record, suspended or not. |
| E-10 | LOW (contradiction) | §3: no quick flag answers a stop report's human decision. §2: provisional honouring ends when "the developer's answer issues the quick flag". An inert stop report names the pending question, so an answer that consists of the quick flag both is and is not an answer. The literal reading fails closed. | L49-50, L64 | Say the answer is the human's prose, and a quick flag issued in it is processed under its entry. |
| E-11 | LOW (fail-open, narrow; R2-4 sweep) | Limiting prose omits `--resume`. "`--resume foo` — no, don't" then relies only on the issue-or-mention judgment, and entering a goal brings its prose Gate 2/3 grants into force. R2-3 added `--resume` to the pasted-content rule but not to this one. | L33, L44 | Add `--resume` to the limiting-prose list. |
| E-12 | LOW (mechanical) | The ordering key is undefined for the Owner tie-break ("two writes at the same time, the later one wins") and for "breaks that sequence" (file order or commit order). | L340, L406 | Define it: commit topological order, then position in the file. |
| E-13 | LOW (coordinator side) | A13 lists 11 IDs (K3, K4, K6, K7, K9–K15) but describes only 10 rulings. One K ruling is recorded nowhere, so its closure can't be verified. | spec L262 | Record the missing ruling. |

**Nits:** A re-sent `--ratify` after an inert or pasted-content confirmation always fails check (a) unless the Coordinator presents the text again. At Stage Zero, the gate-record entry is written into the draft charter, which changes the file that was just ratified. An uncommitted `hash-object` revision may be unreadable from git, so it gets refused (fails closed). T4 says "older" where §8 says "lower `id:`". The A13 ruling list is out of step with K-numbering.

## Closure of round-2 items (quotes from HEAD)

**Closed:**

- **C-1/D-2, R2-1:** "derived" no longer appears anywhere. "A void record voids its parcel under every `--merge-ok` record … whose `id:` is lower" (L396).
- **C-2/D-1, R2-2:** "Every field value of every grant, revocation and void record, decision-log entry … and gate-record entry … is one line holding a JSON string" (L342). "Records exist only in the goal's records section" (L338).
- **C-3/D-5, R2-3:** "Any refusal of any quick flag makes its message inert" (L47). A refused restrictive quick flag is "honoured provisionally, including one that is refused" (L49).
- **C-5, R2-9:** `--ratify` binds to the "immediately previous turn in this session" and is "refused … `--resume` … first developer message" (L138, L142). The cell is now `ratify-refused`.
- **C-6, R2-1:** the re-issue writes "exactly the validated arguments" (L382).
- **C-7, R2-5:** §7 now exempts the code-span object of a revocation (L334).
- **C-8/D-7, R2-5:** the variant rule is open-ended: Unicode-dash normalization, then a case-insensitive "contains" (L334).
- **C-10, R2-3:** "If it is refused, including by a STOPped ownership check, the message is inert" (L238).
- **C-11:** "A record whose `id:` repeats … or breaks that sequence does not count" (L340).
- **C-12/D-12, R2-7:** "a session that is not the owner … refuses every persistent quick flag" (L338); owner by time (L406).
- **C-13:** "honoured as conduct without a record" (L338).
- **C-14/D-9, R2-11:** a "Pinned blob" column plus `pending` (L21-25).
- **C-15/D-14, R2-12:** spec A12.
- **C-16/D-11:** the `--dispatch-ok` void check is gone (L170).
- **C-17:** restrictiveness order (L457) and a closed Persistence list (L94).
- **C-18:** the residual paragraph covers "grant, revocation or void record" (L423).
- **C-19, R2-8:** `--status` reports "every question pending … every quick flag honoured provisionally" (L202); "the new record governs in its place" (L382).
- **D-3, R2-6:** "`--asrec` and `--blanket` never answer one, and `--asrec` is refused while one is pending" (L47, L122).
- **D-4, R2-7:** "fails the cross-check or does not otherwise count … suspended" (L378). The `revoked:` line rule is at L380.
- **D-10:** "text after `Expansion: `" (L92, L359).
- **D-15:** "no commit-author check is made … part of this accepted residual" (L423).
- **D-16:** the D-16 refusal is in place: the cells at L509-510 check IDs against "the revision ratified before this message". The SUBJ citation ruling is superseded by K9.
- **D-17:** `--resume` is in the pasted-content rule (L44).
- **C-9/D-13, D-18, I-x:** informational and carried.

**Closed, with a new defect:**

- **C-4/D-8, R2-4:** L33 now has the limiting-prose rule, but it introduces E-3's naive-reading defect and misses the `--resume` instance (E-11).
- **R2-10:** implemented, but over-generalized into E-1.

**Partial:**

- **D-6, R2-8:** the stop report names the pending question and the provisional quick flags, but nothing binds a later session to them (E-4).

**K rulings:**

- Satisfied: K1 (L47), K3 (L342), K4 (L334), K5 (L50, L186), K6 (L23-25), K7 (L344), K8 (L473), K9 (L527), K10 (L396), K11 (L406), K12 (L338), K13 (L382, the single re-issue rule), K14 (L49).
- K2 is satisfied for `--strict` but contradicted for `--dry`/`--halt` (E-6).
- The 11th ruling is unverifiable (E-13).

## AC, V and amendment trace

**Met:**

- AC-1 (L3, L7, L9, L11, L15-17)
- AC-2 and AC-3 (checked mechanically)
- AC-4 (L54-60)
- AC-5 (L106)
- AC-6 (L122, L126)
- AC-7 (L136-142)
- AC-9 (L232-234)
- AC-10
- AC-11 (L37-45)
- AC-12 (L349-361, L370-382, L398-404)
- AC-13 (L429-438)
- AC-14 (L68-74)
- AC-15 (L326-334)
- AC-16 (91 cells, pinned cells, T1–T5)
- AC-17 (L587-591)
- AC-18 (L595)
- AC-19
- V1–V6 verbatim
- A1–A12 as before

**Not fully met:**

- AC-8 is met but weakened by E-1 and E-2.
- A13 fails at K2 (E-6).

## Mandate summary

- **Waiver routes R1, R2, R6, R14:** still closed at L38-39, L56/L106 and L138(c). Aliases, prefixes and case variants make the message inert. `--resume` slugs are never inferred. Strict-then-blanket does not deadlock, except E-3's naive revocation reading.
- **BI-1 to BI-9:** BI-1 and BI-2 are weakened by E-3, BI-6 by E-2, and BI-8 by E-7. The rest hold. None relaxes a §3 item. E-1 is a new Gate 2/3 scope escalation through rework 2's Terms definition.

## Git control

`git status --short` printed nothing, and HEAD is still `09c5031a`. The registry's `hash-object` equals the HEAD blob (`7795bd74`). I changed no repo files. Scratch files are only under `/tmp/qfrevE.PFMbmO/`.

**Verdict: REQUEST CHANGES.** E-1 must be fixed. E-2 to E-5 and E-8 are MEDIUM fail-open paths. E-6 and E-7 are a spec contradiction and a checkability gap.
