# OPMEM-P4a — review R2 (verification)

Rules and output contract from `p4a-review-brief.md` (same directory) apply, with: head `cb386f8` (rework delta `git diff b67de17..cb386f8`); expected suite 2454 passed / 135 skipped (+ the known flaky timing benchmark); PG curation 5 passed. Amendment: `ingress/models.py` (additive optional `handoff_to_role_id` on the scoped-id derivation, P4a-T3).

Verify fix rows **P4a-T1…P4a-T8** in the "R1 triage" section at the end of `p4a-build-kickstarter.md`, re-running your own R1 probes. Add right after `## TEST RUN`:
```
## TRIAGE VERIFICATION
<P4a-T1..T8: IMPLEMENTED | PARTIAL (why) | NOT IMPLEMENTED (why)>
```
Max 4 findings; only new issues or residuals. REQUEST-CHANGES only for an exploitable defect, fail-open, visibility leak, laundering path, or data loss.
