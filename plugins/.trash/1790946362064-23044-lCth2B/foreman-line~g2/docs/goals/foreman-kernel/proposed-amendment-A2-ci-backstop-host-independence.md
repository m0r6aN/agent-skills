> **PARKED 2026-09-01 by developer ruling.** This draft is not in force and is not
> a live proposal. It is retained as the drafting record only. See
> `A2-PARKED-known-unowned-risk.md` for the ruling and for unowned risk U1, which
> is a stop condition on FK-P18.

# Proposed Charter Amendment A2 — CI Backstop Host Independence

## Status

**WITHDRAWN 2026-09-01 — superseded by `proposed-amendment-A2-r2-backstop-independence.md`.**

Withdrawn by the developer on the coordinator's recommendation after two independent
adversarial reviews returned REQUEST CHANGES with six convergent blocking findings
(`A2-adversarial-review-findings.md`). Never ratified; produced no §4.1 ledger row; no
part of it is or was in force.

Retained, not deleted, for provenance: the defect it diagnosed is real and survived both
reviews, and A2-r2 carries that diagnosis forward. What failed was the drafting and the
choice of instrument — A2 proposed a new locked decision D22 where D8 already contained
the undefined term. **D22 is retired and unclaimed; A2-r2 adds no locked decision.**

The text below is the withdrawn draft, unaltered.

---

## Original status (superseded)

**PROPOSED — not ratified.**

Exact replacement text for a scoped Gate 1 amendment, awaiting the developer's
explicit approval. Nothing here is in force. Landing it additionally requires the
SPEC-CONVENTION §11 commit discipline: replacement text transcribed into
`charter.md`, committed alone, with a commit message identifying it as a
coordinator-ratified amendment.

**Source:** `ADR-001-runtime-infrastructure-posture.md`, Consequences §2.

**Anchor verification (2026-09-01):** every "current text" block below was
verified against `charter.md` on the `codex/foreman-kernel-stage0-20260830`
worktree — the FK-P18 row (line 219), the FK-P21 row (line 222), §9 exit item 6
(lines 297-298), and §13 item 3. D21 is claimed by amendment A1 (ratified
2026-09-01, not yet landed), so this amendment claims **D22**. If A1 is landed
in a form that does not take D21, renumber before transcribing.

---

## The defect being closed

D13 requires CI to land before enforcement promotion. FK-P18 requires a negative
control that intentionally bypasses the hook and must fail CI. Both are sound,
and both are silently satisfiable by a CI configuration that proves nothing.

The failure is concrete. Suppose FK-P18's workflow is later moved onto a
self-hosted runner on the D20 enforcement machine — an ordinary convenience
change, made for ordinary reasons: Docker Desktop is already there, the Windows
matrix is already there, the runner is free. Every check still passes. The
negative control still runs. But the runner now shares the enforcement host's
adapter, session, and filesystem, so the "independent" backstop inherits exactly
the blind spots it exists to cover. A bypass the hook missed is a bypass the
backstop is now positioned to miss identically.

Nothing in the charter currently forbids this, and nothing in a green check
reveals it. The property FK-P18 actually purchases is *host independence*, and an
unstated property is one a future maintainer can remove without noticing they
removed anything. That is the same class of defect A1.7 caught in A1 — a document
that no longer means what it says — except here the artifact that stops meaning
what it says is the enforcement claim itself.

---

## A2.1 — New locked decision D22

**Target:** §4 Locked decisions table. Append as a new row after D21 (A1).

**Proposed text:**

| D22 | The CI backstops required by D13 and produced by FK-P18 execute on a host that is not the enforcement host and shares none of its hook adapter, agent session, or working filesystem. A self-hosted runner on the D20 enforcement machine does not satisfy the backstop requirement, regardless of how its checks report. FK-P18 declares the runner class it targets, and FK-P21's evidence manifest binds the CI host class actually used, so independence is audited rather than assumed. Performance and latency assertions are exempt and remain advisory in CI, because runner performance is not the D20 platform's and must never be cited as platform evidence. | A backstop's only property is observing what the mediated path missed. A runner sharing the enforcement host's adapter, session, or filesystem inherits that path's blind spots, so the intentional-bypass negative control proves nothing about the channel it was built to cover. Left unstated, the property is removable by an ordinary convenience change that leaves every check green — the failure mode is invisible precisely because nothing fails. |

---

## A2.2 — FK-P18 parcel scope

**Target:** §6, Wave 4 parcel table, FK-P18 row, Outcome column.

**Current text:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants
> in CI; negative control intentionally bypasses the hook and must fail CI before
> enforcement can promote. Owns only its named workflow/CI integration points.

**Proposed replacement:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants
> in CI; negative control intentionally bypasses the hook and must fail CI before
> enforcement can promote; declares and enforces the D22 host-independence
> property of the runner it targets, and states in its acceptance criteria that a
> runner sharing the enforcement host's adapter, session, or filesystem does not
> satisfy the backstop. Owns only its named workflow/CI integration points.

**Rationale:** the property has to live in acceptance criteria, not commentary,
or a later configuration change satisfies the parcel while voiding it. Stating it
where the parcel is verified is the only placement a reviewer can check.

---

## A2.3 — Goal exit criterion

**Target:** §9, item 6.

**Current text:**

> 6. CI backstops are green before enforcement promotion and catch an intentionally
>    introduced out-of-scope mutation plus missing enrollment that bypass the hook.

**Proposed replacement:**

> 6. CI backstops are green before enforcement promotion, execute on a
>    D22-independent host, and catch an intentionally introduced out-of-scope
>    mutation plus missing enrollment that bypass the hook.

---

## A2.4 — Evidence manifest binding

**Target:** §6, Wave 4 parcel table, FK-P21 row, Outcome column.

**Current text:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful
> image digests, tool/schema/policy digests, host/harness versions, corpus
> inventory/count, reviewer-session identities, commands/results, and named
> mutation controls.

**Proposed replacement:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful
> image digests, tool/schema/policy digests, host/harness versions, the CI host
> class used for the D22 backstops, corpus inventory/count, reviewer-session
> identities, commands/results, and named mutation controls.

**Rationale:** independence claimed in a parcel spec but absent from the manifest
is unfalsifiable after the fact. The manifest already binds reviewer-session
identities for the same reason — so a later auditor can confirm the separation
actually held rather than trusting that it did.

---

## A2.5 — Gate 1 decision list

**Target:** §13, item 3.

**Current text:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, and shadow-first enforcement (D7–D8, D20);

**Proposed replacement:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, shadow-first enforcement, and CI backstop host
>    independence (D7–D8, D20, D22);

---

## What this amendment deliberately does not do

- It adds no refusal class, no tool, no authority, and no parcel. The
  FK-P0–FK-P21 graph and every dependency edge are unchanged.
- It changes no human gate.
- It does not require a hosted CI provider, name one, or forbid self-hosted
  runners generally. It forbids one specific topology: a runner sharing the
  enforcement host's adapter, session, or filesystem. A self-hosted runner on a
  *separate* machine satisfies D22.
- It does not make CI an authority on latency or performance. A1.3's limitation
  stands and D22 restates it, so the two amendments cannot be read as conflicting.
- It does not widen the D20 platform claim. A D22-independent Linux runner
  produces backstop evidence, never host-parity evidence.
- It does not amend §12's serialization points. FK-P18 already owns its exact CI
  files; the runner declaration is part of that ownership and needs no separate
  grant.

## Known cost, stated rather than buried

D22 forecloses the cheapest path to automated Windows enforcement evidence.
Regenerating FK-P17's proofs on every push would want a Windows runner with
nested virtualization, and D22 rules out the free version of that — the machine
already on the desk. The remaining options are a separate Windows host (roughly
$140/month per ADR-001's Tier 2 costing) or continued manual regeneration on the
proven host.

ADR-001 recommends manual regeneration until it becomes the bottleneck, and D22
does not change that recommendation. But the cost is real and falls on a future
decision, so it belongs in the record now rather than being discovered by whoever
proposes the self-hosted runner and finds it already forbidden.

## Ratification

Ratifying this amendment binds D22 and the A2.2–A2.5 replacement text.

Rejecting it leaves FK-P18's host-independence property implicit. If rejected,
the honest disposition is to record it as a known unowned risk in the lessons
ledger rather than dropping it — the configuration that voids the backstop stays
available either way, and an unwritten property is the one nobody defends.

**Ratification record:** _(unratified — awaiting explicit developer approval)_
