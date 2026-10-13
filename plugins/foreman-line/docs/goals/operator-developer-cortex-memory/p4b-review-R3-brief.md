# OPMEM-P4b — review R3 (Seat B closing verification of P4b-T9…T11)

Rules and output contract from `p4b-review-brief.md` apply. Head `360a3d6` (delta `git diff b052511..360a3d6`); expected suite 2537 passed / 137 skipped. Verify **P4b-T9, P4b-T10, P4b-T11** ("R2 triage" in `p4b-build-kickstarter.md`) by re-running your R2 probes (alias relabel, identity/low-order key forgery, reserved-field reason matrix). Add `## TRIAGE VERIFICATION` right after `## TEST RUN`. Max 3 findings. REQUEST-CHANGES only for a verifier soundness hole, oracle/leak, or fail-open.
