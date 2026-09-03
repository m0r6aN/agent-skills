# FK-P0 — Gate 3 package

**Gate 3 is not delegated. This is the presentation, not the merge.**
Supersedes `FK-P0-STOP-REPORT-for-developer.md`, whose stop condition you lifted.

## Merge target, exactly

- **Branch:** `codex/fk-p0-canon-authority-enforcement-registry`
- **Merge into:** `main`
- **Head:** `87f8a8c` plus one README-only commit (round 5)
- **Not pushed.** The branch does not exist on `origin`. No PR has been opened.
- **Worktree:** `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`

## The green chain

| gate | result |
|---|---|
| **Coordinator authoritative pass** at `87f8a8c` | **583 tests, 583 pass, 0 fail**, exit 0, **stderr empty**, 22m45s |
| `semantic-invariants.test.ts` | **440/440, completed** — no hang |
| `npx tsc --noEmit` | clean |
| `npx biome check .` | clean |
| `validate` | exit 0, `valid=true`, 0 violations, 18 sources / 1525 items / 469 rules / 18 reconciliations, `unresolvedActiveConflicts: 0` |
| `sweep --repo-root` | exit 0, `valid=true`, 0 violations |
| registry YAML | **byte-unchanged** — no regeneration |
| `RECONCILIATION_RECORD_DIGESTS` | **byte-unchanged** — no history rewrite |

AC13 closes on **my** run, not the builder's. Its independent run agrees exactly. The final commit is
README-only — `git diff HEAD -- src tests` is empty — so the tested bytes are the shipped bytes.

Trajectory across this owner's tenure: **518 with 18 failures → 405/395/10 → 563/563 → 583/583.**

## What changed, and what it cost

Five rounds. Amendments **R14–R23**, each committed alone before dependent code per SPEC-CONVENTION §11.

The parcel's core anti-tamper mechanism — a genesis-anchored migration chain — **admitted a tampered
registry three separate times**, under two different owners' hardening. Each was found by adversarial
review or by the builder's Step 0, never by the person who wrote the rule:

| route | payload | closed by |
|---|---|---|
| shadow `superseding-binding-manifest` via `.find` | 7 `gate3.merge-authority` rules silently retired | R22 O1 |
| delete head, promote a pinned record | same | R22 O2 |
| delete head, **substitute** under a fresh id | same | R22 O6 |
| **hollow the head in place**, same id | same | R22 O6 |
| decoy `command-result` satisfying the coordinator check | — | R22 O3 |
| fabricate the head's entire Git provenance | same | R23 O5 |

Every one of these was reproduced by me against pristine `src/` before ruling, and re-verified closed
against the commit. The payload in each case is the same and it is not incidental: it silently retires
the rules asserting that **merges are human-owned and nondelegated**.

## The residual, stated exactly — in both directions

**Under `validate` run hermetically (no `--repo-root`):**
- Re-anchor the head **in place** with contract and prose intact — admitted. This is byte-for-byte the
  generator's own legitimate regeneration; the validator cannot distinguish them and no obligation
  claims it can.
- Append **one** properly chained head — admitted. A second requires a `validate.ts` edit.
- **Neither `git-commit` digest on the head** is hermetically verifiable; the obligation-4-bound
  entry's **reference** is additionally fabricable. With `sourceSnapshotCommit` and all 18
  `sources[].snapshotEvidence.commit` moved to match, whole-provenance fabrication is admitted — a
  coherent twenty-field rewrite rather than a four-entry swap.

**Under `sweep --repo-root` — and this is where the deliverable is better than it read.** I ran it end
to end:

```
CONTROL  shipped registry     -> valid:true,  0 violations, exit 0
TAMPERED 20-field fabrication -> valid:false, exit 1, 20 violations
   18 x "declared source snapshot cannot be resolved: git cat-file -t 0000…0001"
    2 x "Git object evidence cannot be resolved"
```

`sweepRegistrySources` performs `git cat-file -t` and `sha256(git cat-file -p <ref>) ===
evidence.digest`. **It closes both digest faces and the fabrication.** The out-of-band anchor the
README said was needed is already in this package, one command away.

## Open, deferred, with stop conditions

1. **Successor presence (Reviewer B's S3).** An appended head has no presence binding, so deleting it
   re-promotes the shipped head and erases the successor's attestation while green. **FK-P1 obligation
   with a stop condition.** The structural reason is in R23 and it is not a limitation of this code:
   *a stateless validator comparing a document to itself cannot detect a deletion at all.* Presence is
   assertable only against something outside the document. **Reviewer B's practical addition:** the
   sweep already has repository access, so this is dischargeable **today** as a non-hermetic check
   (*every migration record present at the previous registry commit is still present*) — not blocked
   on signing infrastructure.
2. **Retirement and `resolveAuthority` are mutually exclusive.** `resolveAuthority` validates with no
   `repoRoot`, so any `retired-from-agent-reading` rule yields `REGISTRY_INVALID` forever. Latent —
   **0** rules retired today — and fail-closed. Both reviewers found it. Deferred to FK-P1 by ruling.
3. **`historical-only` requires no evidence** while `retired-from-agent-reading` requires four.
4. Honesty-field `weakestBy` inconsistency; `rationale` and `lineHint` outside every digest; residual
   path aliases. All triaged, all informational.
5. **Per-query cost is now established, not unknown:** `resolveAuthority` runs `validateRegistry` on
   every query at ~75 ms, so one five-axis test costs 3,240 validations ≈ 3m25s. Fenced to FK-P1.

**Stated gaps in verification, not defects:**
- `npm run generate` has **never been invoked end to end** by anyone. The regeneration claim rests on
  a simulation of the generator's documented emission shape plus round-2's byte-identical measurement
  of an untouched `generate.ts`. **Reviewer B names this as the largest single thing it never checked.**
- The O4-bound residual's second face is documented and probe-verified but has no test.

## Decisions that are yours

1. **The merge itself.** Gate 3 has never been delegated and no merge has been performed.
2. **Whether to push.** The branch is local only; no PR exists.
3. **Amendment A1.8** has never been reviewed and carries a known self-reference defect.
4. **W1–W4 provenance records** cite PRs #35–#106; this repo has had **13 PRs ever** and none resolve.
   Five squash SHAs are unknown; `foreman-line-ci.yml` never existed. All ten claimed packages *do*
   exist — the code is real and the evidence trail is broken. Re-anchor or annotate.
5. **No CI covers any `plugins/foreman-line/` package.**
6. **Risk U1** — FK-P18 backstop independence — remains unowned and is a stop condition on FK-P18.
7. **`KNOWN_FRONTIER_MODELS` contains only `claude-opus-4-8`.** This session runs on Opus 5, so a
   routing policy naming the model actually doing the work would be **rejected by its own validator**.
   Not part of this parcel; it will bite on the next policy edit.

## What I got wrong

- **R16 was mine** and admitted a tampered registry. **R19 was mine** and needed narrowing twice.
  **R22's obligation 7 was mine** and measurement falsified it. Every chain rule I wrote fast, under
  pressure, needed correction.
- **"A missing guard, not a hole."** Five attack variants refused, and I stopped. Both live routes were
  one step past where I stopped. Withholding that conclusion when I sent the reviewers the raw
  observation is the only reason it did not anchor them.
- **My stated remedy in the stop report was insufficient** — "require that the departing head's absence
  invalidate" — and the head does not depart.
- **I accepted "169 passed, 0 failures"** from a log that appends in a `finally` and carries no
  pass/fail signal. Six failures were already behind it.
- **I killed the builder's run and called it stalled** without verifying.
- **I over-specified the hang mechanism** from one instance and an inspector stack.
- **I mandated `expectOnlyCodes`**, which cannot catch tests passing for the wrong reason when every
  obligation shares one violation code. Necessary and insufficient.
- **I ratified R22's rejection of the git binder on an all-records measurement** when the defect was
  head-only. Head-scoped it is free, 2 of 2.
- **My own loop directive said STOPPED while the goal was running.**

The recurring shape is one thing: **a plausible mechanism written down before it was measured.** Seven
times by me, seven by the builder. Every one was caught by a probe; none by reasoning.

## Stage F

**Not run, deliberately.** The spec remains in `docs/specs/active/`. Stage F asserts a completion that
has not happened until you merge. Worktrees and branches are intact for your inspection; nothing has
been cleaned up, nothing pushed, and your uncommitted change to
`plugins/foreman-line/routing-policy/routing-policy.yaml` in the ambient checkout is untouched.
