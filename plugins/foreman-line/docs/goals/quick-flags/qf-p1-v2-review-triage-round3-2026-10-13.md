# QF-P1 v2 review triage, round 3 (rework 2 at dc38aaad) — 2026-10-13

**Reviews:** K and L (`qf-p1-v2-review-K/L-round3-...`), independent, frontier, read-only. Both: **REQUEST CHANGES** with **exactly one MEDIUM each (the same finding), no HIGH, no BLOCKER**; all nine spec Verification Plan commands pass; all 24 ACs, V1–V7, round-2 IDs I-1..I-9/J-1..J-12 and rulings 3a–3k verified closed (K: "none of the findings below is a missed instance of a cited round-2 ID"); no waiver path for any §3 item; git control passed.
**Coordinator closure check before review (on disk):** 346 lines, 14 entries, labels, 55 rows, V1–V7, retired-term grep 0, GATES clause byte-identical (660 bytes) in both entries, every removed phrase at 0, every added phrase present.
**Agreement (both):** K-1/L-1 (MEDIUM), K-3/L-2, K-4/L-3, K-7/L-6, K-6/L-4, L-7 partly, K-2/L-5 related.
**Tripwire accounting:** K-1/L-1 extends J-2's "any copy" principle from GATES to the Reading/Writer rules; J-2 named GATES only, and the Writer's location came from coordinator ruling C8. Not counted as a false closure. Tripwire stays at **1 of 2**.

| Finding(s) | Sev | Ruling (apply to **every** instance; sweep the whole file) |
|---|---|---|
| K-1, L-1 | MED | Reading honours the entry at the Writer's location **and** in every other copy the session reads (the owner's working copy included), mirroring GATES. The Writer writes the entry to every copy the owner may write: the loop directive in its working copy and, if different, in the checkout of the integration branch the loop directive names. The Writer's location carries no revision tie and so needs no ratified charter. |
| K-2, L-5 | LOW | Before Gate 1, lines go in the draft charter (as now). After Gate 1 and before the loop directive exists, lines go in an `Active restrictions` entry in `restrictions.md` in the goal's directory, a goal record and not charter text. When the loop directive is written they are carried over, and the earlier entry is no longer a copy (existing rule). `--ratify` condition (b) excludes the `Active restrictions` entry. |
| K-3, L-2 | LOW | In the GATES rule-ID text and everywhere else it appears, the non-owner refusal names `--dispatch-ok` and `--merge-ok`, not "each gate quick flag". |
| K-4, L-3 | LOW | The dash-only-word rule compares case-insensitively and strips leading and trailing non-letter characters first; it matches "equals or begins with" a canonical name or alias without its `--`. |
| K-5 | LOW | A lift removes a line only if, outside `message:`, it names no other restrictive quick flag. The "still appears" test counts every line Reading would honour as the lifted name, in any scope. |
| K-7, L-6 | LOW | A reachable copy is one the owner may write under canon (its own checkouts). Any other copy is reported, not edited, and still restricts. |
| L-7 | LOW | Add one definition sentence in §3: "gate quick flag" means `--ratify`, `--dispatch-ok` and `--merge-ok`; "the ratified charter" is the last charter revision a gate-record entry ties to a human ratification, "last" meaning gate-record entry order; a revision identified only by a blob hash that cannot be recovered ties none. |
| K-6, L-4, L-8 | LOW | Accept as documented: the ratified Branch is bounded (local merge only, never trunk, must equal the loop directive's integration branch); the gate record is evidence and the human's typed gate quick flag is the act (V7). |
| Nits | — | Scope the Gate 1 presented-text wording to a "Gate 1 ratification, including one re-opened by triage"; accept the rest. |

**Cap:** 370 (currently 346). Net growth must be justified.
