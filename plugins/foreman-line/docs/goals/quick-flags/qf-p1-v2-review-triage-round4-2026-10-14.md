# QF-P1 v2 review triage, round 4 (rework 3 at f985f4cc) — 2026-10-14

**Reviews:** M and N (`qf-p1-v2-review-M/N-round4-...`), independent, frontier, read-only. Both: **ACCEPT**, nothing above LOW. All nine spec Verification Plan commands pass; all 24 ACs, V1–V7, round-3 IDs (K-1..K-7, L-1..L-8) and C1–C11 closed in every instance; no waiver path; git control passed.
**Coordinator deterministic pass (own machine):** spec VP commands run by script; block 3 output byte-identical to the spec's expected block (22 lines); 346 lines, 14 entries, retired-term grep 0, `git diff --check` clean, builder commits touch only `QUICK-FLAGS.md`.

| Finding(s) | Sev | Disposition |
|---|---|---|
| M-1, N-1 | LOW | Accept as documented (D5″ dropped-restriction residual; canon limit: the ownership block names a session ID, not a path). Forward to QF-P2: the ownership block names the owner's working copy. |
| M-2, N-2 | LOW | Accept as documented (fail-open only on a mistaken lift). Forward to a future registry version: a lift naming a parcel removes only `--review2` lines for that parcel. Not edited after a clean ACCEPT, because unreviewed edits were this parcel's regression source. |
| M-3 | LOW | Accept as documented (input residue). Future version: NFKC plus case folding; add U+30FC/U+FF70 to the dash set. |
| M-4, N-4 | LOW | Accept as documented (bounded: a ratification ties to the revision shown; GATES compares rows against the tied revision). |
| N-3 | LOW | Accept as documented (every such deadlock leaves the restriction in force). |
| N-5 | LOW | Accept as documented (the entries govern; the rule ID is weaker, fails closed). |
| Nits | — | Accept as documented. |
