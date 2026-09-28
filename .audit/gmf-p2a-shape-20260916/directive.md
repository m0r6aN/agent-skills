# DIRECTIVE — GMF-P2A draft shaping red-team (2-seat council)

**Kickoff:** Review the existing draft in
`D:/Repos/agent-skills-worktrees/gmf-p2a-shaping-20260916/plugins/foreman-line/docs/specs/active/`.
Keep it `status: draft`. Definition of done is a fully constrained shaping
handoff suitable for coordinator lint; it is not a Gate-2 decision, builder
dispatch, product implementation, or external effect.

**Evidence:** `brief.md`; `coordinator-out.txt`; `codex-out.txt`;
`claude-out.txt`. Grok produced no output after the bounded wait and was
stopped; quorum is two seats plus coordinator.

## Verdict

The existing P2A draft has valid structure but is not yet ready for a
P2A-only Gate-2 request. Its critical missing information is the reviewed v2
store schema and a deterministic, failure-atomic migration proof.

## Convergent Findings

- **F1 — P0 (2/2 seats):** The v2 store is underspecified: table identities,
  columns, keys, uniqueness relationships, and P1 clause mapping are absent.
  A builder would make contract-level choices that the shaper has not exposed.
- **F2 — P0 (2/2 seats):** The migration proof is not actionable: it lacks a
  version-state matrix, explicit transactional boundary/version-write order,
  and deterministic failure injection.
- **F3 — P1 (verified unique):** Three recorded SHA-256 literals do not match
  their source strings: loop-directive has a missing `a`; canonicalization uses
  an uppercase substring; terminal-settlement contains an extra `f`. All values
  must be normalized to exact 64-character lowercase hex before builder Step 0.
- **F4 — P1 (verified unique):** “beyond this parcel's own dispatch” can imply
  that P2A Gate 2 exists. The carried-key-provider and rollback wording are
  also ambiguous about responsibility and safe cleanup.

## Execution Plan

### Phase 1 — owner decisions required

1. **Target:** v2 durable-store schema. **Change:** the owner accepts an
   explicit additive table/key/cardinality design, or provides a preferred
   schema. **Acceptance:** every table/field/constraint is named and mapped to
   P1-C096/C107/C109/C110/C115–C116 without implementing P2B/P2C behavior.
2. **Target:** migration evidence. **Change:** the owner accepts an exact
   rejected-version policy and proof shape. **Acceptance:** the draft states
   supported states, one transactional upgrade boundary, version write last,
   deterministic rollback proof, and a realistic concurrency observation.

### Phase 2 — draft revision, then re-review

3. **Target:** P2A draft and shaping result only. **Change:** re-pin all 13
   hashes as 64 lowercase hex; replace ambiguous Gate-2, key-provider, commit,
   and rollback language; add the ratified schema and migration details.
   **Acceptance:** frozen linter, shaping self-check, and result schema pass.
4. **Target:** critical draft review. **Change:** run a fresh two-reviewer
   red-team against the revised bytes. **Acceptance:** zero unresolved
   Critical/High/decision-graph findings before coordinator lint.

## Rules of Engagement

- Do not edit the recovered draft until the owner disposes of the two shaping
  decisions above; implementation detail may not become a silent contract.
- P2A only supplies additive store shape and migration. P2B owns the atomic
  effect transaction; P2C owns terminal/recovery/settlement behavior.
- The draft must say plainly that no P2A Gate 2 is granted. The key-provider
  remains carried and unselected. Cleanup must be confined to the parcel-owned
  worktree/branch and temp databases.
