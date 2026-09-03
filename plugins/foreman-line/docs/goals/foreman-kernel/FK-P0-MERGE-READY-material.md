# FK-P0 — merge-ready material for Gate 3

**Gate 3 is not delegated. Nothing here has been merged or pushed. This is step 10 of the
per-parcel algorithm — the verification-chain table and PR material — prepared so the merge
is one decision and one command.**

Prepared by the resuming coordinator, 2026-09-03. Supplements `FK-P0-GATE-3-package.md`,
which remains the substantive record of what was built, what it cost, and what is residual.

## The verification chain, independently reproduced

Every row below was produced by this coordinator's own commands on 2026-09-03, against
parcel head `838f438`, not carried over from the prior owner's record.

| gate | result |
|---|---|
| parcel head | `838f438`; code byte-identical to reviewed `87f8a8c` (only `README.md` differs) |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check .` | exit 0, 5 infos |
| `validate` (hermetic) | exit 0, `valid=true`, 0 violations, 18 sources / 1525 items / 469 rules, `unresolvedActiveConflicts: 0` |
| `sweep --repo-root` | exit 0, `valid=true`, 0 violations |
| `npm test` | **583 tests, 583 pass, 0 fail, exit 0**, zero `not ok` lines |
| `npm run generate` end to end | exit 0; `schemas/`, registry YAML and `pass-minimal.yaml` all byte-identical; `git status --porcelain` empty |
| merge into current `main` | conflict-free, 54 files, **additions-only** |
| all 27 `fk-p0-*` / `foreman-kernel-*` worktrees | clean |

AC13's 583 reconciles exactly: 143 across five files (1 + 113 + 1 + 5 + 23) plus 440 from
`semantic-invariants.test.ts`.

**One caveat on the suite, recorded not hidden.** The first full run aborted with
`exitCode 3221226505` (`0xC0000409`, Windows `__fastfail`) — a hard process crash, not an
assertion failure and not a timeout. It does not reproduce: the file passes 440/440 alone and
583/583 on the next full run, surviving well past the point of the abort. Treated as a
non-deterministic harness crash, not an FK-P0 defect. A future runner seeing `pass 0` on this
file should read the exit code before diagnosing.

## The merge decision — two shapes, both measured

`main` has moved ahead since the parcel branch was cut (PR #14,
`goal-intake-hierarchical-worker-fabric`), so neither shape is a fast-forward. Both are
conflict-free; this was verified with `git merge-tree`, not assumed.

**Neither branch dominates the other.** Measured per file:

| file | newer on |
|---|---|
| `charter.md` (carries A1.9's `Entry` id column) | **parcel** |
| `specs/active/FK-P0-...md` (carries R23) | **parcel** |
| `kickstarters/...rework1.md` | **parcel** |
| `loop-directive.md` (rounds 3-5 + this session's verification) | **goal** |
| `FK-P0-coordinator-closure-check.md` | **goal** |

Seven files exist only on the goal branch, including **`FK-P0-GATE-3-package.md` itself**,
`FK-P0-STOP-REPORT-for-developer.md`, `FK-P0-rework1-step0-rulings.md`, the rework2/rework3
kickstarters, the post-rework review kickstarter, and this session's A1.8 review.

### Option A — merge the parcel branch only

```
git checkout main
git merge --no-ff codex/fk-p0-canon-authority-enforcement-registry
```

Lands the code, the R23 spec, the A1.9 charter, and amendments R14-R23. **Leaves the Gate 3
package and six other records off `main`, and lands a `loop-directive.md` frozen at
2026-09-02 06:55** — before rounds 3, 4 and 5 and before any of this session's verification.
Main's own record would then understate what was done to earn the merge.

### Option B — carry the goal records forward first, then merge once (RECOMMENDED)

```
git checkout codex/fk-p0-canon-authority-enforcement-registry
git merge --no-ff codex/foreman-kernel-stage0-20260830
git checkout main
git merge --no-ff codex/fk-p0-canon-authority-enforcement-registry
```

The intermediate merge was dry-run with `git merge-tree` and **verified to resolve correctly
in both directions** — the resulting tree keeps A1.9's `Entry` column in the charter, keeps
this session's `STATE 2026-09-03` block in the loop directive, keeps the R23 spec at its full
111,541 bytes, and contains `FK-P0-GATE-3-package.md`. Nothing is lost from either side.

This repeats the shape the prior owner already used once at `a703941`, and it is the same
pattern the coordinator pattern means by "the paper trail rides in the PR."

**Why this coordinator did not simply do the intermediate merge.** It changes the parcel head
away from the `838f438` pinned in an already-presented Gate 3 package. Changing the head under
a presented package is precisely the silent drift this parcel exists to detect, so the choice
is left explicit rather than absorbed. If you take Option B, the head you are merging is no
longer `838f438` and the package's pin should be updated in the same act — the *code* bytes
are unaffected, since everything carried forward is documentation.

## Still open at merge time, carried deliberately

None of these blocks the merge; all are recorded so they are not rediscovered later.

1. **Successor presence** (Reviewer B's S3) — an FK-P1 obligation with a stop condition.
   Structurally uncloseable in-band: a stateless validator comparing a document to itself
   cannot detect a deletion. Reviewer B's practical note stands — the sweep already has
   repository access, so it is dischargeable as a non-hermetic check without signing
   infrastructure.
2. **Retirement vs `resolveAuthority`** are mutually exclusive. Latent (0 rules retired) and
   fail-closed. Deferred to FK-P1 by ruling.
3. **The O4-bound residual's second face** is documented and probe-verified but has no test.
4. **A1.8 / A1.9 are unrowed in §4.1** — see `A1.8-coordinator-review-and-exact-ratification-text.md`
   for the finding and the exact `L4` row. No locked decision is unsupported; the mechanism is
   what is provisional.
5. **W1-W4 provenance records cite PRs #35-#106** that do not resolve against a repo with 13
   PRs. All ten claimed packages do exist — the code is real, the evidence trail is broken.
   Re-anchor or annotate.
6. **No CI covers any `plugins/foreman-line/` package**, and risk **U1** (FK-P18 backstop
   host independence) remains unowned and is a stop condition on FK-P18.

## After the merge

Stage F has deliberately not been run: spec stays in `docs/specs/active/`, worktrees and
branches are intact, nothing pushed. On merge, Stage F is spec to `done/`, lessons with
dispositions, evidence index, worktree and branch cleanup, and the loop-directive state block
updated — then FK-P1 unblocks and the queue resumes.
