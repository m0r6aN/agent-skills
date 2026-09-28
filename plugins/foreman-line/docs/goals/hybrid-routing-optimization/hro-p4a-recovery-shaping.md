# HRO-P4a bounded recovery shaping

Draft only. No runtime implementation, source amendment, production activation,
network access or configuration authority is claimed.

## Frozen evidence

Base: `727c0554f11990da778e7647e7a108f3ca6f95aa`, branch
`codex/hro-p4a-recovery-shaping-20260926`. Worktree was absent before creation.
Ratified charter/cache amendment inspected at
`6d2d859d2f6ec65e917972fa06eca1538212b148`; D8 remains mandatory. Its changes are
not silently merged into this shaping branch.

| Actual source at base | Git blob |
|---|---|
| routing-policy/src/public-observation-producer.ts | `20af5e8f3fc0c857ce5569ebdcb28ad504c0aed8` |
| routing-policy/src/catalog-eligibility-adapter.ts | `39347c4018a3dbf1c0cd9abf0a6e2e9da262bdf8` |
| routing-policy/src/pmc-resolver.ts | `809e8d08a9444c925fb8b88b423e2e4b7ff28625` |
| dispatch/src/pmc-launch/intent-custody.ts | `c2d967de9dc6b0f1fe17f4aafe528a8678194432` |

Paths in the table are relative to `plugins/foreman-line/`.
C's accepted bootstrap amendment was inspected at
`5764eba8da1485b7850db067041036d211712e12`, with build release
`c55bd6d960e92ddefe1c321c9ff79ba0d8aa6759`. E split correction was inspected at
`fe5a144dbd5518ad74e97ecd9d6f19ddb0056c8f`, with root ratification `7375c3b`.
These design/build releases are not source completion evidence. D's existing
OpenRouter-only terminal contract excludes metadata refresh and hidden retries.

## Source-backed findings

The producer accepts manifest/projection artifacts, returns evidenceOnly, caps
each at 8 MiB and both at 16 MiB, and caps requested scope at 256. It neither
fetches nor authenticates its caller's trust declarations. The adapter's own
comment explicitly rejects treating references/digests as authentication. The
missing prerequisite is an installed authentic fetch/publication/acquisition
owner, not a boolean added to producer output.

Producer `INCOMPLETE_SCOPE` returns no snapshot and combines absent,
missing-required-facts and unsupported-profile rows. It cannot authorize a
negative-cache entry. The separate publisher prerequisite must authenticate
bounded complete ABSENCE for exact identity, trust/account scope, endpoint/profile,
generation and observation/validity interval. Partial discovery and evidence-only
absent rows without that proof hold without negative insertion. AC4 pairs genuine
complete absence with generic/incomplete/unsupported refusal and independently
tests every binding. Existing response and episode bounds remain unchanged.

B1 has a closed maximum 128 registered intents. Its pending, held, uncertain,
closed-refused and succeeded states block further launch. Only selected primary
terminal-no-send/failed-settled permits the predeclared second slot; lost-ack local
quarantine cannot be bypassed in that instance. Normal B1 reopen can permit only
predeclared R2 when an authenticated primary terminal commit completed before its
acknowledgement was lost; ledger-only reconciliation with no owner terminal commit
remains blocked. The paired existing B1 AC6 fixtures cover both terminal kinds.
P4A AC7 now preserves that distinction and all identity/revision/linkage/expiry/
original-quality checks, without R1 replay, a third attempt or renewed metadata
participation. Broker restart refusal is a separate admission boundary and cannot
redefine B1's accepted reopen behavior. P2A verifies that prior binding/request/digest and
disposition match its single previous primary, then selects only its declared
fallback. This is not a general multi-step fallback engine.

C begins B1 before acquire, and acquire is synchronous without catalog refresh.
Therefore asynchronous recovery must finish before first C entry. C's reserved
pre-consume failures retain liability because D cannot attest cancellation before
an acknowledged consume. E's production bootstrap always refuses pending genuine
installation evidence. A working offline broker would not close that live gap.

## Decisions proposed for root ratification

1. Adopt the spec's 10-second deadline, four concurrent refreshes, 128 fixed
   episodes/waiters, 256 identity/negative-entry caps, 30-second negative TTL and
   five-second transient cooldown. These are conservative proposals, not measured
   throughput claims. Deadline and capacity fail closed rather than queue forever.
2. Keep broker single-process and disallow restart continuation. Require the
   workflow owner to durably admit an installation generation before exposing it;
   process loss holds its registered intents. This closes refresh-budget reset
   without quietly modifying B1 or adding an unreviewed persistence subsystem.
   The hold applies to broker metadata preparation; normal authenticated B1
   terminal-state reopen retains its existing predeclared-R2 authority.
3. Commission the separate RCM authenticated metadata fetch/publication seam and
   workflow admission contract before production implementation dispatch. Their
   exact files and implementations are not authorized by this two-document scope.
4. Treat missing mapping as an actionable hold, not a manufactured failed R1.
   Retain existing R1/R2 only. Any desire for pre-selection alternate routing needs
   an explicit owner-contract amendment and fresh review.
5. Keep HRO-P4/P3, actual C/D integration, E activation, event ownership and later
   live evidence as distinct gates. No successful fixture claims those complete.

## Verification and handoff

The [draft spec](../../specs/active/HRO-P4A-bounded-model-recovery.md) contains eight
source-backed acceptance groups and adversarial review questions. Tests described
there are future acceptance requirements, not tests run in this docs-only task.
Only this note and that spec may change. The exact two-document release overrides
the generic shaping skill's extra ShapingResult emission; no index, charter or
other-owner document is modified. Root retains ratification, two independent
design reviews, implementation release and integration authority.

Documentation validation: frozen spec-linter CLI passed under Node 24.19.0,
using the byte-identical linter in the existing B1 integration checkout and its
read-only installed dependencies. Required body sections and every relative
Markdown link passed. No dependencies were installed or linked into this tree.
The final staged diff must remain exactly these two documents and pass
`git diff --cached --check` before the local handoff commit. No runtime tests were
run: this release produces reviewable design, not implementation evidence.

Independent review repair: clarified authenticated ABSENCE versus producer
INCOMPLETE_SCOPE and local lost-ack quarantine versus accepted B1 terminal reopen.
The original numerical proposals, draft status and owner gates remain intact.
No publisher, admission owner, recovery authority or production activation was
implemented by these clarifications.
Repair validation passed: frozen spec-linter, required body sections, relative
links and whitespace checks. The changed-file list remains exactly the two
authorized documents; no runtime tests or production activity were performed.

## Delegated design ratification — 2026-09-26

The coordinator and independent hro_p1c_review_a reviewer approve repaired draft
45b50e66be7d3a4a29519063aeae87c1270ce8b8. Coordinator independently inspected
actual producer incomplete-scope behavior and B1 terminal eligibility/reopen;
reviewer repeated frozen lint and exact-scope checks. Both original findings are
closed; neither review claims runtime implementation or production readiness.

Under the user's blanket goal authority and explicit PMC/RCM prerequisite grant,
the coordinator adopts decisions1–5 above, including all proposed numerical
bounds as conservative operational limits, not measured throughput guarantees.
The one-participation budget survives negative eviction, version change and
restart; existing B1 terminal reopen is distinct from broker restart permission.
Only separately authenticated complete absence can populate negatives.

This is design ratification only. Runtime Gate2 remains closed pending concrete
publication/materialization and durable workflow-admission owner contracts,
reviewed exact source envelopes, accepted C/D/P3 composition and fresh Step0.
The publication prerequisite is being shaped separately; no source or provider
activation follows from this record. Full HRO exit is unchanged.
