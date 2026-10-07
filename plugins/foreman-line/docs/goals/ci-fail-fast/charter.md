# Goal Charter — CI Fail-Fast: change-proximity ordering and trusted local preflight

**Goal slug:** `ci-fail-fast`
**Created:** 2026-10-07
**Owner:** Clinton Morgan
**Status:** DRAFT — Stage Zero artifact, prepared for Gate 1; **not ratified**
**Coordinator:** unassigned — claim through `loop-directive.md`
**Mode:** repo-local CI architecture goal
**Design inputs:** closed `ci-optimization` goal (CI-P1 reuse, CI-P2 sharding;
`../ci-optimization/goal-closure-2026-10-02.md`); PR #155's 2026-10-07
sweep-2 failure (20+ minutes to surface a locally-reproducible breakage) as
the motivating evidence; `scripts/foreman-line-ci.mjs` waiver machinery
(R7/R15/R16); FK §15.4

## Objective

Make CI failures surface in minutes, not shard-lengths, and make the local
pre-push run trustworthy enough that the BYP-SH-01 class of breakage never
reaches CI. The reuse gate (CI-P1) and the shard matrix (CI-P2) stay; this
goal fixes what they don't cover: failure-discovery latency *inside* a sweep,
and the local/CI platform skew that has trained everyone not to run locally.

Two outcomes, one goal: (a) a swept failure's information exists in the first
minutes of the shard that owns it; (b) `node scripts/foreman-line-ci.mjs
local --affected` runs exactly the packages the diff touches, with the
Windows-only cases on a named, pinned skip list, so local green means green.

Neither outcome weakens the merge gate. The waiver machinery (markers,
counts, failing-set identity, fail-closed evaluation) is load-bearing
integrity surface and is modified only to *consume* better-ordered output,
never to relax a check.

## Provenance and authority

`ci-optimization` is CLOSED; this goal does not reopen or amend its locked
decisions. CI-P1's reuse contract ("reuse only when verified passing evidence
covers the current test-relevant inputs") and CI-P2's deterministic sharding
are ratified law this goal builds under. The 2026-10-07 PR #155 run is the
recorded evidence that reuse+sharding alone leave failure latency unaddressed:
a correct `fallback` decision, four shards, and a harness breakage that was
locally reproducible in ~2 minutes surfaced only deep into sweep (2).

This goal touches `.github/workflows/**` and `scripts/foreman-line-ci.mjs` —
merge-gate behavior. Per the ci-optimization charter's own invariant, carried
forward verbatim: **elevated risk; every parcel requires two independent
adversarial reviews.**

## Proposed locked decisions

Candidates for Gate 1. Not binding before explicit developer ratification.

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | Scope is exactly: change-proximity check ordering, local preflight parity, and gate-job surface-pin precheck. No runner-count, provider, or pricing changes; no workflow identity changes. | The pain is latency and trust, not capacity; branch-protection compatibility is preserved by construction. |
| D2 | Shard-internal check order is derived from the SAME test-relevant-change computation the reuse gate and C9 readers already use — one relevance engine, three consumers (reuse, ordering, preflight). No second differ. | A second change-detection implementation is a guaranteed drift source; C9 already proves the engine's path coverage. |
| D3 | Reordered output remains per-package captured and byte-stable; the waiver's marker/count/failing-set parsing consumes exactly what it consumes today. | The waiver machinery is fail-closed integrity surface; ordering must not become a waiver bypass channel. |
| D4 | The local preflight's platform-skip list is a pinned, named registry (id, test name, platform, reason, evidence link) — never an inline filter. A local run that skips prints the skips. | Silent skips recreate the cry-wolf problem under a new name; named skips are auditable and shrinkable. |
| D5 | Surface-pin drift (the surface-refs sha256 class) moves to the gate job as a pure hash comparison — no test execution. | Half of 2026-10-07's waiver trip was pin drift; a hash compare needs no 45-minute shard. |
| D6 | Fail-closed preserved: on any ordering/preflight computation error, the behavior reverts to today's discovery-order full shard and full local sweep. | A latency optimization must never become a coverage hole. |

## Candidate parcel decomposition

The claiming coordinator reconciles and reshapes this graph before Gate 1. No
row is dispatchable in its current proposed state.

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| CFF-P0 — Recon and baseline | Records the current sweep timeline anatomy (install cost, per-package serial position, failure-to-signal latency) from real runs incl. PR #155; maps the relevance engine's exact outputs and the waiver's input assumptions. | high / architecture-risk | none |
| CFF-P1 — Change-proximity ordering | Shard assignment unchanged; within each shard, checks ordered by diff proximity with deterministic tie-break; per-package output capture preserved byte-for-byte for the waiver evaluator. | critical / architecture-risk, two reviews | CFF-P0 |
| CFF-P2 — Local preflight parity | `local --affected` mode: same relevance computation, affected packages only, named platform-skip registry, printed skip ledger, fail-closed to full local sweep on any uncertainty. | critical / architecture-risk, two reviews | CFF-P0 |
| CFF-P3 — Gate-job pin precheck + exit evidence | Surface-pin hash comparison in the gate job; deliberate-breakage proof PR fails fast in the right shard position; BYP-SH-01-class case caught by preflight; exit manifest. | high / architecture-risk, two reviews | CFF-P1, CFF-P2 |

## Proposed exit criterion

This goal exits only when:

1. the developer explicitly ratifies the final locked decisions, graph, and gates;
2. a fresh plan-level adversarial review is triaged, with scoped re-ratification
   for every decision-changing fix;
3. all ratified CFF parcels complete the Foreman parcel loop and merge through
   human Gate 3, each with two independent reviews;
4. a deliberately-broken change on a demonstration PR fails its shard with the
   breakage named in the first minutes, with the recorded timeline compared
   against the CFF-P0 baseline;
5. the BYP-SH-01-class breakage (retired model id in a harness consumer) is
   caught by the local preflight before push, demonstrated on a real
   worktree;
6. negative controls prove: waiver evaluation consumes reordered output
   unchanged; a relevance-engine error falls back to full discovery-order
   sweep; an unknown platform case never silently skips; and
7. a committed evidence manifest states what is mechanically enforced,
   detected, sampled, human-judged, unsupported, and deferred — including the
   measured before/after failure-to-signal latency.

## Human gates and requested standing authority

- **Gate 1:** not granted. The claiming coordinator presents the reconciled
  decision list.
- **Gate 2:** not granted. Request only for the final named parcel graph after
  Gate 1 and plan review.
- **Gate 3:** not delegated. Every merge to a workflow, the CI runner, or the
  reuse/waiver machinery remains human-owned.

## Stop conditions

Stop and report if a second change-detection implementation is proposed; the
waiver's input contract would change shape; a platform skip would be recorded
without a named reason and evidence; ordering would interleave per-package
output; the relevance engine's coverage is found incomplete for a package
class; or any merge-gate identity/branch-protection compatibility question
needs inference rather than a recorded check.

## Relationship to live goals

- **ci-optimization (closed):** refines, never amends. Its closure record is
  the baseline authority for what reuse and sharding already guarantee.
- **parcel-queue-and-claim (draft):** orthogonal; no shared files, no
  sequencing requirement. If both proceed, INDEX.md rows are reconciled by
  their respective claiming coordinators.
- **routing-policy / dispatch (Windows P/R):** no write scope; this goal reads
  package layout and test output only.

## Gate 1 record

_Unratified. Drafted 2026-10-07 at owner direction ("Draft it. You can choose
how.") while PR #155 was in merge. Chosen shape: standalone goal, separate
from parcel-queue-and-claim, because merge-gate latency and horizontal
scaleout share no files, no decisions, and no exit criteria. The draft creates
and queues the goal; it does not ratify the proposed decisions, grant
dispatch, or update the goal index._
