# Goal-level finding — the inherited canon's provenance does not resolve in this repository

**Found:** 2026-09-02, by the foreman-kernel coordinator, while verifying Reviewer B's claim that
no CI covers `authority-registry`.
**Status:** verified on disk and against the GitHub API. Not a foreman-kernel defect. Recorded here
because FK-P0's mandate is precisely to reconcile live-versus-stale canon, and because it changes
what any coordinator may safely infer from the inherited goal records.

## What was checked, and what came back

| Check | Result |
|---|---|
| Total pull requests in this repository, all states | **13** |
| PR numbers cited by the W1–W4 goal records | #35, #37, #39, #41, #43, #48–#57, #61–#96, #101–#106 |
| `gh pr view` on #35, #85, #96, #104, #106 | **All five: "Could not resolve to a PullRequest"** |
| Squash SHAs cited (`972ce43`, `dc2cde05`, `6102180`, `834ae95`, `c148db0`) | **All five unknown to `git cat-file`** |
| `.github/workflows/foreman-line-ci.yml` — claimed shipped by W4-P1 (PR #85) and amended by W4-P3/P4 | **Never existed.** `git log --all` on that path returns nothing; no deletion commit either |
| Claimed packages on `main`: `shaping`, `projection`, `approval`, `registration`, `integration`, `verification`, `dispatch`, `schema-scaffold`, `spec-linter`, `permission-profiles` | **All ten present** |

## What this does and does not mean

**The code is real.** Every package the W1–W4 records claim to have shipped exists on `main`. This
is not a case of records describing work that was never done.

**The evidence trail is not.** The PR numbers, squash SHAs, and at least one CI workflow cited as
proof do not exist in this repository. The most likely explanation is that the work was developed
against a different remote — or the repository history was recreated — and the goal documents were
carried over verbatim without re-anchoring their provenance.

**No conclusion is drawn here about intent.** Nothing in this record asserts that any claim was
fabricated. What is asserted is narrow and checkable: the cited artifacts do not resolve here, so
they cannot function as evidence here.

## Why this matters to foreman-kernel specifically

1. **It vindicates treating inherited claims as presumptively empty.** This coordinator already
   declined to credit the prior owner's R2–R13 review record because no findings existed on disk.
   The same discipline applied to the wave records would have produced the same answer sooner.

2. **FK-P0 binds this canon by digest.** The registry inventories eighteen sources and binds each
   rule to a source identity, locator, and normalized value. Where a bound source contains a
   provenance claim that cannot be verified in this repository, the registry faithfully records an
   unverifiable statement. That is within FK-P0's design — it reconciles rather than rewrites
   history — but the reconciliation records should name this class explicitly, and currently do not.

3. **It removes a premise ADR-001 relies on.** ADR-001's Tier 1 assigns FK-P18's CI backstops and
   the clean-room proofs (FK-P5, FK-P8, FK-P15, FK-P21) to GitHub Actions, describing
   `.github/workflows/test-plugin-install.yml` as "the existing CI surface Tier 1 extends." That one
   file does exist. But **no workflow covers any `plugins/foreman-line/` package**, so:
   - AC13's `npm test` gate for FK-P0 has only ever been satisfied by a manual local run;
   - the "CI green before enforcement promotion" requirement has no current mechanism; and
   - unowned risk **U1** (from the parked A2 amendment) is worse than recorded — FK-P18's backstop
     independence is not merely unbound, there is no backstop at all yet.

4. **W4's own exit evidence is affected.** The SCAF-P4 record cites a live audit-trigger firing "in
   CI, not a harness" as exit-criterion item 3, in a workflow file that does not exist here. That is
   a W4 matter, not a foreman-kernel one, and this coordinator does not own it.

## Disposition

**Not actionable inside FK-P0, and explicitly out of scope for its rework.** FK-P0's Forbidden list
covers CI workflow wiring, and its Allowed Files admit no `.github/` path.

Routed as follows:

- **To the developer, in the final report** — the W1–W4 records cite unresolvable provenance, and
  whether to re-anchor them is a decision only the developer can make. Re-anchoring is cheap
  (append a note recording that the cited PR/SHA provenance belongs to a prior remote); silently
  leaving it is the option with a real cost, because the next coordinator will read those records
  as verified precedent, exactly as this one nearly did.
- **To FK-P18 shaping** — as a hard precondition alongside U1. FK-P18 cannot assert a CI backstop
  property until CI covering these packages exists at all.
- **To FK-P0's next round** — only as a reconciliation-record wording question, if the coordinator
  rules that the registry should name unverifiable-provenance canon as its own class. Not required
  for round 1, and deliberately excluded from the round-1 rework directive to avoid widening scope
  mid-round.
