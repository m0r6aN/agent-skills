# Reviewer Kickstarter — quick-flags QF-P1 (adversarial)

You are an adversarial reviewer with zero builder or coordinator context. Review `plugins/foreman-line/docs/QUICK-FLAGS.md` against its spec `plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md` (including Amendments A1-A10), the ratified charter `plugins/foreman-line/docs/goals/quick-flags/charter.md`, `plan-review-findings.md` in that dir, `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`, and `plugins/foreman-line/skills/goal/SKILL.md`.

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`, reviewer rules 8-11): hostile-input probing is licensed; attempt the naive/literal reading of prose contracts; mutate to prove assertions bind. You NEVER edit, fix or commit repo files. You may use a shell for read-only probes and scratch work under /tmp only. End by asserting `git status --short` shows no changes you caused.

Mandate (rank every finding BLOCKER / HIGH / MEDIUM / LOW with file:line evidence and a suggested disposition):
1. Is there ANY path by which a quick flag, alone or in combination, waives Gate 1, the universal stop conditions, green-chain merge, human-only gates, or the destructive/outward-facing limits? Try: the four routes from plan-review R1/R2/R6/R14, token-in-file, quoted tokens, alias tricks (`--blanke`), mention-vs-issue (BI-1), partial/prefix tokens, messages mixing several flags, revocation edge cases, `--dry`/`--halt` interactions, `--resume` slug guessing, forged grant records.
2. AC-by-AC trace of all 19 ACs, V1-V6 verbatim, and Amendments A1-A10. Quote the registry text that satisfies (or fails) each.
3. Naive-reading attempt for every entry's Expansion line and every conflict-table cell: implement the wrong-but-literal reading and show whether the text blocks it.
4. Conflict-table soundness: all 91 pairs, internal contradictions, cells that contradict entry text, a temporal order that deadlocks (e.g. strict then blanket).
5. Contradictions with canon (COORDINATOR-PATTERN, SPEC-CONVENTION §8, goal skill parsing of `/goal resume`, the loop-directive text).
6. The additions BI-1..BI-9: attack each; do any relax something or create a new escalation path?
7. Mechanical checkability for the later QF-P3 conformance check (field format, closed lists).
Output: a findings table, then a verdict (ACCEPT / REQUEST CHANGES).
