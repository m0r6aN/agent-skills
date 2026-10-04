# FK-P1 draft independent review

Independent reviewer `/root/adoption_final_review` approved corrected draft commit `297c688052bedc380e962be8e31be166ad1652cd` for continued shaping. Spec SHA256 `fdcf1a184adc8c8b57b8fabb15770ed055d3c8d93f2a97dafe850e9b2d549d00`; decisions SHA256 `4894f550b9f7955a95c3bc7bec050952644369ab71e625c00acaeb76d2ebca47`.

Initial findings concerned untrusted action classification, protected-state disclosure after admission failure, and D19 link refusal narrowed to escaping targets. P1-R01-R03 close them: trusted effective classification is separately derived, protocol/admission failures terminate protected evaluation with safe diagnostics, shadow cannot downgrade trust failures, and every symlink/reparse traversal is refused. Dedicated hostile vectors cover these cases.

Twenty-five exact package paths, separate kernel-contracts namespace, disabled authorization-cache default, D20/D21 limits and contract-only assurance remain. The draft is not dispatchable: FK-P0 must merge through human Gate3, accepted interfaces/canonicalization require reconciliation, and full field shapes and implementation review remain future work. Advisory tooling and ShapingResult emission are distinct recorded steps. Review was read-only with no Node, tests, installs or commits.


## Advisory and emission completion

Supported explicit Node v24.19.0 ran the package's two-layer advisory check: frontmatter and body valid, zero errors/warnings. The first invocation failed because isolated permission-profiles dependencies were absent; its complete failure is preserved. Four package-local npm ci runs returned direct exit0 with lockfiles unchanged. After dependency installation, advisory check, deriveSessionSlug, emitShapingResult and readback returned direct exit0. The emitted artifact is `plugins/foreman-line/docs/specs/active/fk-p1-lifecycle-admission-decision-contracts-20260907.shaping-result.json`, contains the one draft reference and epics:[], and was read through the frozen package reader. No receipt, promotion or implementation was emitted. Full logs/metadata and a file-hash manifest are under evidence/20260907/p1-shaping/.
