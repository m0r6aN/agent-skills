# OPMEM-P1a / P1b — review R2 (post rework 1) brief

Same rules and output contract as `p1-review-brief.md` (read it first — paths there are absolute), with these changes:

- **Heads:** P1a `4da2c47` (R1 reviewed `d098684`; rework delta `git diff d098684..4da2c47`); P1b `9801999` (R1 reviewed `2ab9262`; delta `git diff 2ab9262..9801999`). Full parcel diff remains `base..HEAD`.
- **Expected test counts:** P1a 390 passed / 0 skipped; P1b 2017 passed / 110 skipped.
- **Triage to verify:** `p1-triage-2026-10-12.md` in the same directory — ruling **T-35** and rows P1a-T1…P1a-T7 / P1b-T1. Add a section to your output, placed right after `## TEST RUN`:

```
## TRIAGE VERIFICATION
<each fix row for your parcel: IMPLEMENTED | PARTIAL (why) | NOT IMPLEMENTED (why)>
```

- Do not re-raise items correctly fixed or explicitly carried forward (P1b-T2/T3/T5 belong to P2; coordinator already executed the P1b generated-column DDL against a real PostgreSQL 16: additive over an existing table, idempotent, legacy rows NULL, stamped rows populated).
- Max 6 findings; new issues or residuals only.
