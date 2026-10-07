# Proposed amendment A3 — standing authorization widening for unattended operation

## Status

**PROPOSED — nothing in this document is in force.**

Drafted 2026-09-03 by the second 2026-09-03 coordinator, at the developer's request to "widen
Gate 2 dispatch scope" as part of an auto-mode setup. It is drafted text awaiting the
developer's explicit ratification naming this amendment and its targets. Per SPEC-CONVENTION
§11, applying it requires the replacement text below to be transcribed into the loop directive
and committed alone, with a commit message identifying it as a ratified amendment.

**What this amendment does not touch, stated first:**

- **Gate 1 is untouched.** It remains never delegable.
- **Gate 3 is untouched.** It remains a human action for every merge. The developer selected
  "Gate 3 stays a human action" by not directing otherwise, and this draft honours that.
- The external-effect boundary (standing authorization 5) is untouched. No Jira, cloud,
  deployment, publication, external communication, Docker-socket, signing, billing, credential,
  or repository-settings mutation becomes authorized.

## Why this is being proposed now

Gate 2 dispatch is *already* authorized for FK-P0 through FK-P21, so "widen Gate 2" cannot mean
adding parcels. What actually stops this loop is narrower and more specific, and the FK-P0
history is the evidence:

1. **The rework cap is a round counter, and round counters cannot tell progress from a
   spiral.** FK-P0 has now had five rework rounds. The prior owner's twelve rounds were a
   genuine spiral. But the cap fires identically on a round that closes a newly-discovered root
   cause and on a round re-litigating one already closed. The 2026-09-02 stop was lifted by the
   developer precisely because the cap had fired on progress rather than on repetition.
2. **Every spec amendment currently costs a developer round trip or a coordinator judgement
   call at the boundary of its authority.** R14–R23 were coordinator-ratified. That was correct,
   but the line between "coordinator may ratify" and "developer must ratify" is drawn at
   "public contract", which is not self-evident for a registry parcel whose product *is* a
   contract.
3. **Sequencing is serialized more than the dependency graph requires.** The queue is a strict
   order, but the charter's own graph shows FK-P3 depends only on FK-P1, while FK-P9 also
   depends only on FK-P1 — provably independent once FK-P1 merges.

## A3.1 — replace the round-count tripwire with a root-cause tripwire

**Target:** the loop directive's "Standing stop-condition override — the FK-P0 / A2 spiral"
section, in full.

**Current text:**

> The prior owner drove FK-P0 through twelve rework rounds and amendment A2 through four
> drafts without landing either, overriding the charter's own “same tripwire fires” stop
> condition each time. That condition is reinstated with teeth: **this owner takes FK-P0
> through at most two rework rounds.** A third stops the loop and reports. Rework-round
> count is measured from `df8155a` forward under this ownership; inherited rounds are not
> carried, but neither are they credited.

**Proposed replacement:**

> ### Standing stop-condition override — the rework tripwire
>
> The prior owner drove FK-P0 through twelve rework rounds and amendment A2 through four drafts
> without landing either. A fixed round cap was the first correction and it proved to be the
> wrong instrument: it fired on round 2 of work that was closing real, newly-found blockers, and
> the developer had to lift it manually. Round count does not distinguish progress from a spiral.
> Root-cause identity does.
>
> **A rework round is authorized when it addresses at least one root cause not previously
> addressed on this parcel.** The coordinator names that root cause, in writing, in the rework
> directive, before dispatch.
>
> **The tripwire fires — loop stops, report written — when any of these is true:**
>
> 1. a round's findings re-open a root cause a previous round recorded as closed;
> 2. two consecutive rounds produce no newly-identified root cause;
> 3. any single root cause reaches a third round without closing; or
> 4. the parcel reaches **eight** rework rounds in total under all ownership, whatever the
>    root-cause ledger says.
>
> Condition 4 is a backstop against a coordinator that keeps finding "new" root causes
> indefinitely, which is the failure mode this replacement could otherwise introduce. It counts
> inherited rounds, unlike the instrument it replaces.
>
> The coordinator maintains a **root-cause ledger** for any parcel past its first rework round:
> one line per root cause, its round, and its disposition. FK-P0's ledger starts at rounds 1–5
> under prior ownership plus the 2026-09-03 volatile-canon-source blocker, and its five inherited
> rounds count toward condition 4 — so FK-P0 enters round 6 with two rounds of headroom, not a
> clean slate.

## A3.2 — name the class of amendment the coordinator may ratify

**Target:** standing authorization 4.

**Current text:**

> 4. **Step 0 rulings** stay with the coordinator unless a flag changes a locked decision,
>    external-effect boundary, public contract, security boundary, or exact Allowed Files;
>    those require a ratified amendment before code.

**Proposed replacement:**

> 4. **Step 0 rulings** stay with the coordinator unless a flag changes a locked decision,
>    external-effect boundary, public contract, security boundary, or exact Allowed Files;
>    those require a ratified amendment before code.
>
>    **Coordinator-ratifiable class.** The coordinator may ratify a spec amendment without a
>    developer round trip when *all* of the following hold, and must record which of them it is
>    relying on:
>
>    - it changes no charter-locked decision D1–Dn and no goal exit criterion;
>    - it changes no exact Allowed Files list, and adds no file to any parcel's write surface;
>    - it creates no external effect and relaxes no security boundary;
>    - it does not weaken an acceptance criterion, reduce a required test count, or convert a
>      required artifact into a fixture; and
>    - it is one of: (a) resolving an internal contradiction between two canon statements where
>      one is demonstrably stale, (b) correcting a mechanical count, identifier, or cross
>      reference, (c) reclassifying a block as non-normative where the block states no
>      independent rule, or (d) recording a residual that the parcel cannot close in band.
>
>    **Anything that tightens a rule is still developer business, not only anything that
>    loosens one** — a tightening changes what downstream parcels must satisfy. When in doubt
>    the coordinator drafts and stops; drafting costs one document and mis-ratifying costs a
>    parcel.

## A3.3 — authorize parallel dispatch on the dependency graph

**Target:** the paragraph immediately following the queue table.

**Current text:**

> Parallelism is allowed only after contracts merge and only for parcels with no shared
> serialization point. The coordinator owns sequencing for manifests, lockfiles, package
> exports, Docker/launcher files, migrations, hook registration, and CI workflows exactly
> as assigned in the charter.

**Proposed replacement:**

> Parallelism is allowed only after contracts merge and only for parcels with no shared
> serialization point. The coordinator owns sequencing for manifests, lockfiles, package
> exports, Docker/launcher files, migrations, hook registration, and CI workflows exactly as
> assigned in the charter.
>
> **Within those limits the coordinator may dispatch concurrently without asking**, provided
> that for each pair of concurrent parcels it has verified on disk, and recorded, that: every
> dependency of both is merged to `main`; their exact Allowed Files lists are disjoint; neither
> holds a serialization point the other needs; and each runs in its own named worktree and
> branch. Concurrency is capped so that Node and package work stays sequential on this Windows
> host, per the per-parcel algorithm's existing constraint — the cap is on *installs and test
> runs*, not on sessions.
>
> The queue table's order remains the default. Concurrency is an authorization, not an
> instruction, and a coordinator that cannot show the four disjointness facts dispatches
> serially.

## What ratifying this costs

The honest case against each clause, since the developer is being asked to widen authority:

- **A3.1** trades a hard, dumb, auditable limit for a softer judgement the coordinator makes
  about itself. Condition 4's absolute ceiling of eight is the mitigation, and it is deliberately
  a number rather than a judgement.
- **A3.2** lets the coordinator move faster on exactly the class of change that has already bitten
  this goal three times (R16, R19, R22 each needed correction). The mitigation is that the five
  gates are conjunctive and the coordinator must name which it relies on, so a bad ratification is
  visible in the record rather than inferable from its absence.
- **A3.3** raises the chance of two builders colliding, which is the failure that produced the
  one-goal-one-coordinator rule after commit `491fb80`. The mitigation is that the four
  disjointness facts must be verified on disk and recorded before dispatch, not asserted.

**Rejecting any clause leaves the current text in force for that clause**; the three are
independent and may be ratified separately.

## Ratification record

_Awaiting the developer. Nothing above is in force until this section records an explicit
ratification naming amendment A3 and the clauses ratified._
