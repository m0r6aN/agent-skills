# Builder Kickstarter — quick-flags QF-P2 rework 1 (round-1 review triage fixes)

You are the Builder for QF-P2 rework 1. The round-1 reviews (O and P) both returned REQUEST CHANGES on one MEDIUM plus LOWs; the binding triage is `plugins/foreman-line/docs/goals/quick-flags/qf-p2-review-triage-2026-10-14.md`. Spec: `plugins/foreman-line/docs/specs/active/QF-P2-quick-flags-integration.md` (unchanged; every fix below fits the ACs as written). Build base stays `41f80463`.

**Dispatch:** Gate 2 standing authorization. Direct invocation per loop-directive ruling 2026-10-13, no route receipt. Frontier. State your model in Step 0. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`).

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p2`, branch `qf-p2`. The round-1 build is in the working tree, uncommitted: goal skill (S), template (T), synced mirror (M), COORDINATOR-PATTERN.md (C). Write ONLY those four files. Never run git add/commit/push/checkout/reset; read-only git is fine.

## The fixes (from the triage; each with its finding IDs)
1. **O-1/P-1 (MEDIUM), S:** in the `## Quick flags` section, the V7 follow-up sentence loses its qualifier: "Prose standing authorizations are governed by canon and registry §3, not by that sentence." (mirrors `QUICK-FLAGS.md:41` exactly). Then regenerate M from S with the substitution.
2. **O-3/P-8, T:** tie the grantor to the human (e.g. `<GRANTOR, THE HUMAN DEVELOPER>`); state that where nothing was granted the slot says `none` and that gate stays with the human; the Gate record pointer says "a human ratification".
3. **O-4, T:** the intro gains "Never copy over an existing loop directive."
4. **O-5/P-7, T:** "Who you are" names all three canon documents: `docs/COORDINATOR-PATTERN.md`, the `/goal` skill, and `docs/SPEC-CONVENTION.md`.
5. **O-6, T:** "scoped to this goal only" becomes "as it applies to this goal".
6. **P-2, C:** the appended paragraph gains a pointer clause: a restrictive quick flag still limits conduct under a prose grant (registry §3). Stay within the 5-appended-lines cap.
7. **P-3, T:** the carry sentence says the lines go "directly under the `Active restrictions:` label".
8. **P-5, T:** per-iteration step 1 reads "the `Active restrictions` entry in each copy named in the ownership block".
9. **P-6, T:** wakeup pacing covers wakeup, resume, hook-feedback and completion-notification prompts (pointer to registry §4 only; no restatement).

Do NOT make any other change. The wording nits in the triage's last line are explicitly not fixed. T must stay at most 110 lines (make room by rewording, never by dropping an AC-required element); C stays within 5 appended lines; S's section stays within 14 lines.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm the base, the working-tree state, and direct invocation under the ruling.
2. Restate the nine fixes and show, for each, the exact old string you will replace (must match exactly once) and the new string.
3. Flag any fix you believe contradicts an AC or the registry, with a recommendation. Never resolve silently.
4. State the tripwire: after your final edit you re-run ALL 11 Verification Plan commands (spec, `$B=41f80463`, M regenerated last) and paste actual outputs; the heading list, caps, token/variant greps, term rule, mirror diff and scope command must all still pass.
5. STOP and wait for the ruling.

## After the ruling
Apply the fixes. Completion claim: per-fix file:line evidence with the before/after text, the full Verification Plan output, and confirmation that nothing else changed (`git diff --stat` against the pre-rework tree).
