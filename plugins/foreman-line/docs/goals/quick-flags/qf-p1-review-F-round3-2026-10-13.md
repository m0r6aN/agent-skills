# Reviewer F, round 3: QF-P1 `QUICK-FLAGS.md` at `qf-p1` HEAD `09c5031a` (builder rework 2 is `b3cc8f11`)

**Verdict: REQUEST CHANGES.** I found no BLOCKER: no path waives Gate 1, the universal stop conditions, green-chain merge, human-only gates, or the destructive/outward-facing limits. Rework 2 did add two new fail-open paths into Gate 2/3 scope (F-1, F-2), plus several contradictions.

**How I checked.** All scratch work is in my private directory `/tmp/qfrevF.afplKA` (made with `mktemp -d`).
- **Parser (`check.py`):** it reports OK on HEAD. It checked:
  - the version line;
  - 14 entries from the D8 set, each with 7 labels in order;
  - Persistence and Gate interplay values against AC-2 and AC-3;
  - the alias table against the `Aliases:` lines;
  - 91 distinct pairs, all in the 5-term vocabulary;
  - every Winner, including the new restrictiveness order;
  - closed rule IDs with the `: ` separator;
  - the AC-16 pinned cells, V1–V6, and the term rule.
- **Mutations (rule 11):** I broke the file 11 ways and the parser caught every one: winner order, a pinned cell, a bad rule ID, a missing colon, Persistence, alias, a backticked value, a blank Winner, V5, the version line, and the `asrec-refused` winner.
- **AC-19:** builder commits `c772a943`, `c6804b2d` and `b3cc8f11` each touch only the registry, and `git diff --check` is clean.
- **Probes (`probe.py`):** a literal reader of the F-1, F-2 and F-3 rules shows the fail-open outcome. It flips to fail-closed when I apply each suggested disposition, so each finding binds to the text it cites.

## Findings

| ID | Sev | Class | Finding | Evidence | Suggested disposition |
|---|---|---|---|---|---|
| **F-1** | **HIGH** | fail-open; canon contradiction; regression | **The new Terms definition of "ratified" hides prose Gate 1 re-ratifications from the drop and dependency stops.** QF:344 says "A charter revision is ratified only if a gate-record entry that quotes the developer's `--ratify` message verbatim (§6) shows it". This is unscoped, so it also governs "If a later ratified charter revision drops a named parcel … stops and reports before merging it" (QF:154), and the matching text at QF:170 and QF:396. Canon Gate 1 is explicit approval in any words (CP:30; re-opens at CP:43 and GS:24). This goal's own re-ratification was prose: "ratify the amendments as written" (loop-directive:16). Scenario: `--merge-ok QF-P2` is pinned to revision R1, ratified with `--ratify`. The developer then re-ratifies R2 in prose and drops QF-P2. The stop does not fire, and QF-P2 merges on its next green chain. Likewise, `--dispatch-ok` dispatches in the stale pinned dependency order (probe F-1: MERGES; with the fix: STOP). Side effect on the fail-closed side: every goal ratified in prose, including this one, has no "ratified charter revision", so `--dispatch-ok`/`--merge-ok` are always refused there. Rework 1 had no such definition; R2-10 only required that the entry `charter revision:` relies on quote the `--ratify` message. | QF:154, 170, 344, 396; CP:30, 43; GS:24; loop-directive:16-17 | Limit the `--ratify`-quote requirement to the `charter revision:` pin. The drop and dependency stop should fire on **any** later charter revision or Gate 1 entry, prose included: stop and ask. |
| **F-2** | **HIGH** | fail-open; regression | **An inert message silently drops a revocation of a `--blanket`, `--dispatch-ok` or `--merge-ok` record.** An inert message gets "no write" (QF:47). Provisional honouring covers only restrictive *quick flags* (QF:49). The stop report names only those quick flags (QF:50). Nothing says the message is processed again after the answer. So "revoke `--merge-ok`" together with any unrecognized token, variant or refused quick flag, or with a pasted review report that contains a token (QF:40), writes no revocation. The target is not suspended. Once the developer answers the *unrelated* question, the loop resumes and merges under the revoked grant (probe F-2: ACTIVE). Contrast the invalid and ambiguous revocation rules, which suspend the target (QF:378-379). This regression comes from the universal inert rule: in rework 1, a refused `--ratify` did not freeze the rest of the message. | QF:40, 47-50, 378-379 | In an inert message, every revocation of a delegating or gate record suspends its target until a human answers. The stop report (QF:50) and `--status` (QF:202) name it. |
| F-3 | MED | fail-open; canon contradiction | **Under `--dry`, a loop stop does not cancel a pending wakeup.** `--dry` "schedules no wakeup; a wakeup already pending is left as it is" (QF:186). The only exemption is "updates the ownership block and writes the stop report" (QF:50, 186). The canon stop *is* `ScheduleWakeup stop:true` (GS:40). On a literal reading, `--dry --halt` (QF:540) and every inert message that holds a provisional `--dry` leave the wakeup armed, so the loop resumes despite the stop. | QF:50, 186, 540; GS:40 | Add "stops the loop (cancels any pending wakeup)" to the canon-required stop exemption, wherever it appears. |
| F-4 | MED | fail-open; missed instance of the R2-3/R2-4 pattern | **Prose that names a parcel for `--review2` is ignored, so the restriction lands on the wrong parcel.** The limiting-prose rule covers only delegating and gate quick flags (QF:33). `--review2`'s span ends at the end of the line (QF:31, 264). Example: `--review2`⏎`for QF-P3, not the current one` records `--review2` on the active parcel. The message is not inert, and QF-P3 (Standard, one review) later merges after a single review. This is the one case where qualifying prose drops a restriction; for `--nopush`, `--strict`, `--halt` and `--dry`, qualifying prose fails closed. | QF:31, 33, 264 | If other text in the message names a parcel for `--review2`, refuse it (the message becomes inert and it is honoured provisionally). |
| F-5 | MED | spec contradiction | **A13 K2 says "a same-message D6 loss is a refusal".** §10 says "where `--dry` or `--halt` wins, the other is not refused" (QF:452), for cells that cite D6 (QF:500, 502, 540, 554). Under K2, `--halt --asrec --dispatch-ok QF-P2` is inert and `--dispatch-ok` is held. Under the registry, `--dispatch-ok` is recorded. | QF:452, 500, 502; spec A13 K2 | Coordinator ruling: either scope K2 to `--strict` wins, or make `--dry`/`--halt` losses refusals. |
| F-6 | MED | internal contradiction (fails closed) | **On a literal reading, every live grant is suspended.** QF:380 says a `revoked:` line "that cites no valid revocation record … is handled as a revocation that does not count". `revoked: "no"`, which every live record carries (QF:361, 380), cites none, so every `--blanket`, `--dispatch-ok` and `--merge-ok` record is suspended under QF:378. Rework 1's wording ("counts as `revoked: no`") did not have this problem. | QF:361, 378, 380 | Say "a `revoked:` line other than `"no"` that cites no valid …". |
| F-7 | MED | mechanical gap | **Gate-record entries are required to use JSON strings, but they have no defined format.** QF:342 requires JSON-string fields for every "gate-record entry", but defines no header or field names. Terms (QF:344) depends on finding "the developer's `--ratify` message verbatim" and the revision inside such an entry, so QF-P3 cannot locate or check it. Unlike grant and revocation records (QF:415, 418), a gate-record entry also has no owner check and no "not introduced by a parcel-branch merge" check, and OQ-5's text (QF:423) names only grant, revocation and void records. | QF:138, 342, 344, 415, 418, 423 | Define a `Gate-record entry` header with fields (`message:`, `revisions:`, `date:`, `session:`) and apply §8's owner and merge guards to it. |
| F-8 | LOW | contradiction / mechanical | **"Held" is undefined** (QF:453, 455, 485, 503, 514). Two readings, both bad: if a held quick flag is processed after the answer, its record breaks validity ("written … in the turn that answers the human-typed message it quotes", QF:410), so it fails closed; if it is dropped, the developer gets no signal. | as cited | Say "held = not processed; the developer re-sends it". |
| F-9 | LOW | contradiction | **`--asrec` is refused while a §2 question is pending (QF:47), but `--resume` is not.** `--resume` is "loop-control … continues the goal loop" (QF:88), while QF:47 says "the goal loop stops until the developer answers". Each held state is individually fail-closed, so the impact is small. | QF:47, 88, 234 | Say that `--resume` re-enters the loop in its stopped-awaiting-answer state. |
| F-10 | LOW | mechanical | **"Active" is undefined**: valid? unsuspended? It matters for `--strict` revoking "every active `--blanket` record" (QF:250), for the multi-match revocation rule (QF:379) and for re-issue (QF:382). A suspended `--blanket` may escape `--strict`'s revocation. | QF:250, 379, 382 | Define it once in §8. |
| F-11 | LOW | contradiction (fails closed) / mechanical | **Branch-change voids have two side effects.**<ul><li>A branch-change void written against a stale record also voids a newer record that is correctly pinned to the new branch, because voids apply to every lower `id:` (QF:396). That fails closed.</li><li>The pre-merge check list (QF:154, 397) does not compare `integration branch:` with the loop directive. The branch void depends on the Coordinator noticing the change.</li></ul> | QF:154, 393-397 | Scope `integration branch changed` voids to records pinned to the old branch. Add the branch comparison to the pre-merge check. |
| F-12 | LOW | fail-open window (K13) | **Stage Zero restrictive conduct lapses "until the loop directive is written" (QF:338).** In GS:28-30, the Coordinator writes the directive "then become[s] the loop". No stop separates the lapse from the first dispatch or push that a standing authorization allows. K13 accepted the lapse; this note is only about the missing stop. | QF:338; GS:28-30 | Lapse at the developer's first message after the directive is written, or stop once after writing it. |
| F-13 | LOW | mechanical | **Two pinned-blob gaps.** The pinned-blob cell format (`pending` \| 40-hex) is not declared as a closed format (QF:21-25). Nothing requires that HEAD's `Expansion:` lines equal the pinned blob's for the current version, and a wrong pin is an unreviewed "editorial fix" (QF:16). | QF:16, 21-25 | Declare the format. QF-P3 should check that HEAD's `Expansion:` lines equal the pinned blob's (`git cat-file`). |

**Wording nits (one line):** QF:406 "(so of two writes at the same time, the later one wins)" doesn't fit "names in the commit that introduced the record" (a single tree state). The `ratify-refused` Winner "`--blanket`" reads as "wins" although `--blanket` is held. The A12 rule-ID text (QF:473) attributes K1's "any refusal makes its message inert" to A12. `Arguments:` lines are still free prose (carried over from C-17).

## Closure of round-2 IDs, rulings R2-1..R2-12 and K1–K15

| IDs / ruling | Status | Quote |
|---|---|---|
| C-1, D-2, C-6, R2-1, K10 | Closed (all instances: `derived` occurs 0 times) | "A void record voids its parcel under every `--merge-ok` record in the goal whose `id:` is lower than its own" (QF:396); "revokes the whole record … the developer re-issues" (QF:381); "a new record holds exactly the validated arguments" (QF:382) |
| C-2, D-1, C-18, R2-2, K3 | Closed | "Records exist only in the goal's records section" (QF:338); "Every field value of every grant, revocation and void record, decision-log entry … and gate-record entry … is one line holding a JSON string" (QF:342); "forge a grant, revocation or void record" (QF:423). Gate-record format: F-7 |
| C-3, D-5, C-10, D-17, R2-3, K1 | Closed for quick flags | "Any refusal of any quick flag makes its message inert" (QF:47); "including one that is refused" (QF:49); "If it is refused, including by a STOPped ownership check, the message is inert" (QF:238); `--resume` added at QF:44. Revocations are missed: F-2 |
| C-4, D-8, R2-4 | Closed within scope | "if any other text in the message, on any line, limits …" (QF:33). Restrictive instance: F-4 |
| C-5, R2-9 | Closed | "immediately previous turn in this session … refused … `--resume`, and as the first developer message" (QF:136-138); cell QF:514 is `ratify-refused` |
| C-7, C-8, D-7, R2-5, K4 | Closed | "Replace every Unicode dash … strip … compared case-insensitively, contains" (QF:334); "is a mention, not a variant" (QF:334) |
| C-9, D-13, D-16, R2-10, K7 | Over-closed: regression | QF:344 Terms (F-1); "never one this `--ratify` ratifies (§8 Terms)" (QF:509-510) |
| C-11 | Closed | "A record whose `id:` repeats another record's or breaks that sequence does not count" (QF:340) |
| C-12, D-12, R2-7, K11 | Closed | "refuses every persistent quick flag" (QF:338); "in the commit that introduced the record" (QF:406); "passes only if the `date:`, `session:` … equal" (QF:378). Nit at QF:406 |
| D-4, R2-7 | Closed, but new contradiction | "fails the cross-check or does not otherwise count … its target is suspended" (QF:378). QF:380 wording: F-6 |
| C-13, K12 | Closed | "honoured as conduct without a record" (QF:338). Window: F-12 |
| C-14, D-9, R2-11, K6 | Closed | "Pinned blob … `pending`" (QF:21-25). Gaps: F-13 |
| C-15, D-14, R2-12 | Closed (spec side) | spec A12 |
| C-16, D-11 | Closed | `--dispatch-ok`: "checks that the record is valid, unrevoked and unsuspended" (QF:170), with no void check |
| C-17 | Mostly closed | restrictiveness order (QF:457); closed Persistence list (QF:94). `Arguments:` is still prose |
| C-19, D-6, R2-8 | Closed for quick flags | "naming the pending question and every quick flag honoured provisionally" (QF:50); "every question pending under registry §2" (QF:202); "the new record governs in its place" (QF:382) |
| D-3, R2-6 | Closed | "answered only by an explicit human-typed reply: `--asrec` and `--blanket` never answer one" (QF:47) |
| D-10 | Closed | "the text after `Expansion: `" (QF:92, 359, 414) |
| D-15 | Closed (accepted) | "no commit-author check is made, and that gap is part of this accepted residual" (QF:423) |
| K2 | Contradicted | F-5 |
| K5 | Partial | "Canon-required stop writes, exempt from `--dry`" (QF:50). Wakeup gap: F-3 |
| K8 | Closed | `A12` row in the rule-ID table (QF:473) |
| K9 (R18 cell) | Closed | "R18: no quick flag reduces a review requirement" (QF:526) |
| K13, K14 | Closed | single re-issue rule (QF:382); `Re-issued` occurs 0 times in Conflicts lines |
| K15 | Closed | "A provisional `--review2` restricts every active parcel" (QF:49) |

## Mandate checks (condensed)

- **Waiver routes.**
  - R1, token or forged record in a file: closed (QF:39, 338, 342).
  - R14, Coordinator-written prompts: closed (QF:38).
  - R6, `--ratify` beside `--asrec`/`--blanket`/`--blanke`: closed (QF:138 (c), QF:485, 513).
  - R2, Gate 1 re-opened by triage: closed (QF:56, 60, 106).
  - Other probes that held: quoted tokens and code spans, `--blanke`, mention vs issue, prefixes and variants, revocation provenance, `--dry`/`--halt`, `--resume` slug guessing.
  - Forged records: accepted residual.
- **AC-1..AC-19, V1–V6, A1–A13:** all met (mechanically where possible), except for the clashes with K2 (F-5) and K5 (F-3). AC-8's ID check is stricter than the spec because of F-1.
- **Conflict table:** 91 pairs, no cycle and no deadlock. Strict-then-blanket resolves as "revoke, then re-send" (QF:579). Every cell agrees with its entry's Conflicts line.
- **BI-1..BI-9:**
  - None relaxes a §3 item.
  - BI-5 is affected by F-6.
  - BI-6 holds, now via void-by-id; see F-11.
  - BI-8 is affected by F-1 and F-7.
- **QF-P3:**
  - Checkable: entries, closed lists, alias cross-check, pairs, vocabulary, Winner order, rule IDs.
  - Not checkable: F-7, F-13 and `Arguments:`.

## Verdict: **REQUEST CHANGES**

F-1 and F-2 are fail-open paths into Gate 3 (and Gate 2) authority, both introduced by rework 2. F-3 to F-7 are contradictions or mechanical gaps that need a fix or a ruling.

**Git control:** `git status --short` printed nothing, HEAD is unchanged at `09c5031a`, and the registry's md5 matches the HEAD blob (`b262c44d…`). I caused no repo changes; scratch files are only in `/tmp/qfrevF.afplKA`.
