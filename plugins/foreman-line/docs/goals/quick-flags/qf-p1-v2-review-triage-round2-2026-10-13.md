# QF-P1 v2 review triage, round 2 (rework 1 at 1cc62b06) — 2026-10-13

**Reviews:** I and J (`qf-p1-v2-review-I/J-round2-...`), independent, frontier, read-only. Both: **REQUEST CHANGES**, **no BLOCKER, no HIGH**; all nine spec Verification Plan commands pass; all 24 ACs, V1–V7, C1–C13 and the round-1 IDs verified closed except the items below; no direct waiver path for any §3 item; git control passed.
**Coordinator closure check before review (on disk):** 346 lines, 14 entries, labels, 55 rows, V1–V7, retired-term grep 0, GATES clause byte-identical in `--merge-ok` and `--dispatch-ok`, removed phrases at 0.
**Agreement (both):** I-2/J-1, I-1/J-3/J-9, I-3/J-8, I-6/J-6, I-5/J-10, I-8, I-9/J-12, G-9 residue (I-7/J-5). No disputes.
**Tripwire accounting (reshaped parcel):** J-3/I-1 shows rework 1 did not sweep the G-6 ratify-scope change into the GATES row check: **tripwire 1 of 2** on the reshaped parcel. A second false closure is a loop stop.

| Finding(s) | Sev | Ruling (apply to **every** instance; sweep the whole file) |
|---|---|---|
| I-2, J-1 | MED | Evaluate **every** GATES condition (Gate 1 status, open re-open, row identity, gate record) on the state as it stood **before this message**. A same-message `--ratify` never satisfies any of them. Mirror in the GATES rule-ID text and the `--ratify` × gate-flag rows. |
| I-1, J-3, J-9 | MED | A Parcels row counts as ratified only if it appears in a revision that a gate-record entry ties to a human ratification (any form), and the parts that ratification showed included the Parcels table or that row. A ratification that names no revision establishes no ratified rows (refuse). At Gate 1 the presented text includes the Parcels table. |
| I-4 | LOW | Delete the "(a pending re-open is not granted)" parenthetical; keep "an open scoped Gate 1 re-open blocks any named parcel" so orthogonal work is not held (CP:75). |
| J-2 | MED | GATES is fail-safe across copies: a re-open, an unratified row change, or a missing gate-record entry found in any copy the session reads (including the owner's working copy) refuses. |
| J-4 | MED | A session that is not the goal's owner refuses `--merge-ok`, `--dispatch-ok`, `--blanket` and `--asrec` for that goal (stop-and-report). Any session that dispatches, merges or acts outward for a goal honours every `Active restrictions` line in any copy it reads. |
| I-3, J-8 | MED | Once Stage Zero lines are carried into the loop directive, the charter entry is no longer a copy and is not read. A lift removes the line from every copy the session can reach. The "still appears" test counts only lines with the same scope. |
| I-6, J-6 | LOW | `--review2`'s requirement applies from message arrival, before any `--merge-ok` in the same message. Add to the `--merge-ok` × `--review2` Rule text and to the `independent` definition ("except where a Rule names a restriction that applies from message arrival"). Resolution stays `independent` (keeps the pinned VP6 rows). |
| I-5, J-10 | LOW | Delimiters are ASCII space, tab and newline only. Any other White_Space or Cf character is inside a word and is deleted for matching. The dash set is the Unicode `Dash` property plus U+2212, U+02D7, U+2043 and U+2796. A dash-only word directly followed by a word containing a canonical name is a variant. |
| I-7 | LOW | The Stage Zero owner is the session that started `/goal <concept>` for the slug. |
| I-8 | LOW | "last charter revision the gate record shows ratified" in both L120 and the GATES clause. The integration-branch checkout is named by the ratified charter's Branch. Write "never the repository's trunk (`main`)". |
| I-9, J-12 | LOW | Declare the line field order (`quick flag \| scope \| since \| session \| [provisional \|] message`), the first field's form (backticked token), and that the entry ends at the first line not starting with `- `. |
| J-5 | LOW | The becoming-owner write is an explicit exception in the writer's "only" clause. |
| J-7 | LOW | A token named in a lift has no span and is not subject to argument refusal. |
| J-11 | LOW | If the human's typed words cannot be told from an expanded skill or command body, treat the body as pasted content (§4). |
| Nits | — | Scope the "governs quick flag tokens only" sentence at the prose-ratification bar; accept the remaining nits as documented. |
| I-5 mutation note, G-11/H-9 | — | Still QF-P3 inputs. |
