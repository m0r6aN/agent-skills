# /loop Directive — ci-optimization (Plugins CI Cost Reduction)

## COORDINATOR OWNERSHIP — read before dispatching anything
> **Queue owner: this `/goal` coordinator session** (started by the developer directive "Read and implement charter.md", 2026-09-30). Exactly one coordinator owns this queue: if you are not the owner, do not dispatch; if ownership is ever ambiguous, report to the developer and wait — never assume (rule earned 2026-07-15, dual-coordinator overlap committed onto a live parcel branch, 491fb80). One goal, one coordinator; transfers only at parcel boundaries via this block + the state section below.

**Resume** (`/goal resume ci-optimization`): read this file, `charter.md`, `gate-1-ratification-2026-09-30.md`, `plan-review-findings.md`, `ci-optimization-lint-2026-09-30.md`, and the latest state note in this directory; continue from the recorded state.

## Who you are
The Foreman Line Coordinator (D4): you consume verification results, you never produce them. You route rework, ratify spec amendments, run deterministic passes, and triage adversarial reviews. The proven 11-step loop is in `plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-carryover.md`; canon: `docs/COORDINATOR-PATTERN.md`, `docs/SPEC-CONVENTION.md`, `docs/kickstarters/STANDING-CONSTRAINTS.md`, `docs/transcripts/defects_lessons.md`. Every claim is verified on disk before acceptance; wrong-shaped claims are presumptively empty; test-count tripwires on every rework.

## Standing authorizations (from `gate-1-ratification-2026-09-30.md`, scoped to this goal only)
1. **Gate 2 — dispatch approval** for exactly parcels CI-P1 and CI-P2 as chartered, including rework dispatches on those parcels. A third parcel idea is a stop-and-report.
2. **Gate 3 — merge:** main/PR merges are **human-owned** (RS-2.1; SPEC-CONVENTION §8.4 fail-closed). The coordinator performs the merge **git step** of a fully-green chain into the goal integration branch `ci-optimization/integration`, prepares the PR to `main` with its paper trail, and **stops with a report** for the human main-merge. Green chain for the git step: coordinator closure check on disk, deterministic pass (PowerShell only, `node -v` first), TWO independent adversarial reviews with every finding triaged and resolved, live CI evidence, required contexts `test` + `integration-report` green on the head. Any red step voids the delegation.
3. **Push, PR, and Stage F closure commits** within `m0r6aN/agent-skills` only; parcel PRs target `main`.
4. **Stop-and-report:** repo settings/rulesets, branch protection, force pushes, other repos, merging into `main`, merging around a red step, modifying frozen contracts.

## Branch / worktree topology (fixed by triage F1/F8)
- **Base:** `origin/main` @ the recorded cut-SHA (fetch, then record the SHA in the dispatch record). Never branch from `dev`, never include PR #122's commits in a parcel.
- **Integration branch:** `ci-optimization/integration`, worktree `C:\Repos\foreman-line-cip0` (created by the coordinator with plain `git worktree add`; it is not a parcel). Goal docs + specs are copied in and committed docs-only BEFORE any builder dispatch, so builder worktrees carry the paper trail.
- **Builder branches** (via the emitter, below): `feat/foreman-line-CI-P1` @ `C:\Repos\foreman-line-cip1`; `feat/foreman-line-CI-P2` @ `C:\Repos\foreman-line-cip2`.
- **PRs:** one per parcel, head = the parcel's merged tip on `ci-optimization/integration` (or the parcel branch), base = `main`. Pre-PR: fetch `origin/main`, re-sync, and require `git diff --stat origin/main` additions-only for the affected directories (lesson #26).
- **PR #122 protocol (F1):** PR #122 (`dev`→`main`, developer-owned) edits the same three surfaces and deletes `hybrid-routing`. Parcels never absorb its commits. If #122 merges to `main` mid-parcel: rebase the parcel onto the new `main`, reconciling the runner regions so the developer's landed edits survive (their code is ground truth; adapt, never stomp). If it merges between CI-P1 and CI-P2, the CI-P2 rebase step absorbs it. If the conflict is unresolvable without a product call: stop and report.
- **Developer WIP (F8):** the uncommitted failure-capture work on `scripts/foreman-line-ci.{mjs,test.mjs}` in the main checkout is developer-owned. Do not land, drop, or implement it. At CI-P2 shaping, re-check `main`; if it has landed, preserve its behavior in the rewrite; if not, name it as the developer's follow-up in the closure report.

## Dispatch mechanics
Worktrees are created at dispatch by the permission-profiles emitter (lesson #18 — never pre-create):
```
npx tsx plugins/foreman-line/permission-profiles/src/cli.ts dispatch-worktree --parcel CI-P1 --profile builder-architecture --path C:\Repos\foreman-line-cip1 --cwd C:\Repos\foreman-line-cip0
```
(shaping/review parcels: profiles `shaping-agent` / `reviewer-readonly`). Harness deviation, recorded openly: dispatched sessions are background subagents that do not load the emitted `.claude/settings.local.json` (session-start-load bound, `permission-profiles/README.md` §F-H). The envelope is documentation-true but not mechanically binding; the paired detection controls are the coordinator's closure diff check against the spec's `Allowed Files` and the reviewer clean-worktree assertion (standing constraint #10). No other enforcement is claimed.

Every dispatch — including rework — opens with a **Step 0 restate-and-stop gate** (lesson #8): the agent restates scope + exact `Allowed Files`, inventories on-disk state against it, and stops for the coordinator's ruling before writing code. Branch and worktree are named in the kickstarter (lesson #9). Rework directives mandate "every X" — findings are a floor, not a ceiling.

Commits: conventional-commit subjects, no trailers (current repo practice). Paper trail rides in the parcel PR; the PR body carries the verification-chain table.

## Per-iteration algorithm
1. Read this directive + the latest state note; identify the active queue item and its loop step.
2. Advance as far as this iteration allows (11-step loop): shaping → coordinator lint (every factual claim on disk) → Gate 2 (pre-authorized) → dispatch builder → Step 0 gate → rule on flags (a real spec gap becomes a ratified amendment committed alone before code) → build → **closure check against disk before re-running anything** → deterministic pass (PowerShell only, `node -v` first; never read an exit code through a truncated pipeline, lesson #11) → TWO adversarial reviews (fresh sessions, hostile-input probing licensed, reviewers never fix/commit) → triage (reproduce disputed findings yourself — the reproduction is the tie-breaker and later the closure proof) → rework (own Step 0 + test-count tripwire) → Gate 3 git step + PR material → Stage F (spec → `docs/specs/done/`, worktree/branch cleanup, lessons appended with dispositions, state note updated).
3. Verify every completion claim on disk: green checks verify state; only per-item closure checks verify work. Claims carry test counts and named evidence; wrong-shaped claims are presumptively empty.
4. Move to the next queue item.

## Queue (strict order)
0. **Shape CI-P1 and CI-P2 together** (charter Sequence clause), then coordinator lint both specs (lesson #33: diff every restated AC against the charter word by word — specs may strengthen, never weaken).
1. **CI-P1 — Safe Documentation-Only Push Reuse** (elevated / architecture-risk → dual review). Build + merge git step into `ci-optimization/integration`, open PR to `main`, live CI evidence, completion report. Named deliverables from plan triage: behavior record pinned to named refs (F8), classification policy + five-class equivalence table with hash semantics (F7), evidence mechanism = Actions-API run conclusions at equivalent input hashes with the workflow gaining `actions: read` (F2), evidence-record field schema + positive AND negative demos (F6), required-context compatibility demonstration both contexts on every head (F3), AC5 red-base stop-and-report contingency (F9).
2. **Rebase CI-P2 onto the CI-P1 line** (charter: "then rebase and implement CI-P2"), absorb PR #122 if landed.
3. **CI-P2 — Deterministic Full-Sweep Sharding** (elevated / architecture-risk → dual review). Same closure shape. Named deliverables: eligibility contract + 19/20/27 reconciliation with a measured pre-flight of ALL discovered packages (F4 — baseline-red discovery is a stop-and-report with the measured table), deterministic bounded sharding (bound: ≤ 4 shards), discovered-vs-executed reconciliation seam named, empty expected-skip set, both required contexts reporting the single aggregation verdict (F3), queue-separated elapsed/runner-minutes comparison with explicit cost acceptance (F5), and proof that CI-P1's reuse behavior remains valid under the sharded workflow (charter closure clause).
4. **Goal exit:** final completion report = both parcels' evidence, baseline-vs-final comparison, and a stop-report naming exactly what the developer must do (merge the PR(s) into `main` if outstanding, any repo-settings items).

## Loop-stop conditions (stop and report — do not ask questions mid-loop)
- Frozen contract needs modification; a tripwire fires twice on one parcel; a security finding cannot close in-parcel.
- Anything outward-facing beyond the standing authorizations (including any merge into `main`).
- CI-P2 discovery pre-flight finds baseline-red packages (F4 valve) — report the measured table; the developer decides fix-vs-exclusion.
- CI-P1 cannot demonstrate eligible reuse because no verified green prior run can be established for reasons outside the parcel surfaces (F9 valve) — report; never paper over a red base.
- A required decision surfaces that the charter, ratification record, and plan-review triage do not already answer (Step 0 flags route here after the coordinator's own ruling attempt).
- Queue empty → exit criterion met → final report.

## Wakeup pacing and crash recovery
Blocked only on a running background agent → long fallback (1200–1800 s) and yield; completion notifications are the primary wake signal. Actively coordinating → keep working. Never short-poll harness-tracked agents. On any wake while expecting a builder/reviewer result: if the agent is not running and no completion claim was delivered, assume process death, not completion — unclaimed disk state is never accepted (lesson #7); dispatch a fresh agent with a resume directive whose Step 0 inventories existing work and stops for ruling.
