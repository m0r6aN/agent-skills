# OPMEM-P4a — review R3 (verification)

Rules and output contract from `p4a-review-brief.md` (same directory) apply, with: head `efe71bb` (rework delta `git diff cb386f8..efe71bb`); expected suite 2456 passed / 137 skipped (+ the known flaky timing benchmark); PG curation 7 passed. Amendment: `ingress/models.py` (additive optional `handoff_to_role_id` on the scoped-id derivation, P4a-T3).

Verify fix rows **P4a-T10…P4a-T12** in the "R2 triage" section at the end of `p4a-build-kickstarter.md`, re-running your own R2 probes (true concurrency). Add right after `## TEST RUN`:
```
## TRIAGE VERIFICATION
<P4a-T10..T12: IMPLEMENTED | PARTIAL (why) | NOT IMPLEMENTED (why)>
```
Max 3 findings; note the convergence line at the end of the R2 triage; only new issues or residuals. REQUEST-CHANGES only for an exploitable defect, fail-open, visibility leak, laundering path, or data loss.
