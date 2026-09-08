# Prepared PR material — not submitted

Head: `codex/fk-p0-r31-source-adoption-20260907` at `1747c1df7dfa4677d345390ac673c3d15c82b980`. Base: `main`, observed `476b8df6efe6c9974879957147449f61c34cd9a0`.

Suggested title: **Add FK-P0 authority registry with verified R31 source adoption**

## Body

This delivers FK-P0's authority/enforcement registry and its accumulated source reconciliation. The accepted R31 migration binds the exact ratified source snapshot, preserves historical item/rule identities and all 20 prior reconciliation records, and adds the reviewed conditional source-intent rule without granting runtime installation, gate, or merge authority.

The full main comparison includes inherited implementation and evidence; R31 itself changes nine package files relative to accepted R30. Accepted head is `1747c1df7dfa4677d345390ac673c3d15c82b980`, fixed source is `8d500704c9e3d6d8b652bbe838aa3623f88203fc`, and all 22 package files equal tested checkpoint `2fc39405988df4d7073f20d69b65a276329be83d`.

Validation: retained full run36 passed 751/751, the full deterministic chain passed, and two fresh independent final reviews APPROVED with no P0/P1/P2 findings. The isolated CLI/generator integration check passed against main `476b8df6efe6c9974879957147449f61c34cd9a0`; its hypothetical tree was reproduced on September 8. Failed attempts remain recorded. These results do not substitute for this PR's required `test` and `integration-report` checks.

Review the [accepted decision packet](https://github.com/m0r6aN/agent-skills/blob/865e16cf83f884ef15f380ab273b7bce8e1888a1/plugins/foreman-line/docs/goals/foreman-kernel/R31-VERIFIED-STATE-20260907.md), [authority review](https://github.com/m0r6aN/agent-skills/blob/865e16cf83f884ef15f380ab273b7bce8e1888a1/plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r31-final-review-authority/review.md), [identity/history review](https://github.com/m0r6aN/agent-skills/blob/865e16cf83f884ef15f380ab273b7bce8e1888a1/plugins/foreman-line/docs/goals/foreman-kernel/evidence/20260907/r31-final-review-identity/review.md), and [integration disposition](https://github.com/m0r6aN/agent-skills/blob/865e16cf83f884ef15f380ab273b7bce8e1888a1/plugins/foreman-line/docs/goals/foreman-kernel/R31-main-integration-disposition-20260907.md). Attach the immutable publication address of the September 8 Gate 3 packet when this material is submitted.

Human Gate 3 is required. The historical provenance gap, generic hermetic Git-evidence residual, bounded integration/symlink limits, inactive FK-P1 dependency/F05 mapping, and U1 infrastructure/evidence dependencies remain explicit. This PR does not complete the kernel or authorize deployment/enforcement promotion.
