# September 7 adoption review and triage

## Initial independent reconciliation review

Reviewer `/root/infra_reconciliation_review` inspected immutable handoff `fe31042bbe4370cb81b38632720849983c7be04c`, read-only. Verdict: proceed with authorized reconciliation; repair contracts before affected implementation.

| Finding | Disposition | Applied evidence |
|---|---|---|
| Goal ledger lacked parcel A1.9 Entry IDs; naive L4 would be malformed | FIX | Adopted parcel L1-L3 structure, appended dated L4/L5 |
| New INF norms change governed corpus; active builder cannot silently expand it | FIX | A4 and charter §14 require separate R30 contract/corpus adoption; baseline stays at 0ee1657 |
| INF-4 did not fully define U1 acceptance | FIX / affected dependency retained | Coordinator owns concrete contract; P18 producer, P19 verifier, P21 retention; reviewed contract before P18 dispatch |
| A1 status and transport overclaims; cold/deadline ambiguity | FIX | Adoption status corrected; live D21 rationale and INF-5 clarify accounting without late ALLOW |
| A3 round count inconsistent and old user-round-trip rules stale | FIX | Direct September 7 authorization recorded; no wholesale A3 adoption; evidence-based root-cause tracking |
| Promotion evidence timing and baseline/recovery owners | FIX | Detailed carrier map governs; evidence exists before P19; coordinator baseline and P9/P14/P15 duties explicit |
| Single owner and cross-goal serialization | FIX | New coordinator worktree/branch and exact user instruction recorded; foreign surfaces excluded |

## Fresh review of final adoption

Reviewer `/root/adoption_final_review` independently inspected `622c934..57be35cf3549b7097707aa94c3afd1bf09c1720a`, with no prior reviewer context. Verdict REQUEST CHANGES for one P2: blank lines separated L4/L5 from the authoritative Markdown table. Other scoped adoption, numeric D21 preservation, corpus boundary, U1 mapping and human Gate3 were found coherent.

**Fix:** remove separating blank lines, preserving exact cell content and ratification dates. Coordinator deterministic check finds five adjacent five-column L1-L5 entries. No substantive recommendation changed and no new ratification is needed. Reviewer closure of the resulting commit follows.

Both reviewers made no edits/commits and ran no tests. Fresh review ended at unchanged HEAD with tracked and staged trees clean; only expected recovery evidence was untracked. This is plan/document review, not runtime verification or FK-P0 acceptance.
