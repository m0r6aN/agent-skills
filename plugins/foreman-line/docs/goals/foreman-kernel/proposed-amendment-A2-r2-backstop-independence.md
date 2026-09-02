> **PARKED 2026-09-01 by developer ruling.** This draft is not in force and is not
> a live proposal. It is retained as the drafting record only. See
> `A2-PARKED-known-unowned-risk.md` for the ruling and for unowned risk U1, which
> is a stop condition on FK-P18.

# Proposed Charter Amendment A2-r2 — Defining Backstop Independence in D8

## Status

**SUPERSEDED 2026-09-01 by `proposed-amendment-A2-r3-backstop-independence.md`.** Never
ratified; produced no §4.1 ledger row; no part of it is or was in force.

Two independent reviews (`A2-r2-adversarial-review-findings.md`) returned REQUEST CHANGES.
The instrument survived — amending D8 rather than adding a decision was confirmed correct by
a reviewer who re-derived it blind — but the mechanism did not: the run-time
"provider-issued attestation" of criteria (i)-(iii) describes an artifact no CI provider
issues, and criterion (ii) was satisfiable by no runner that exists, which would have
deadlocked the goal. A2-r3 keeps the instrument and replaces the mechanism.

Retained for provenance. The text below is the superseded draft, unaltered.

---

## Original status (superseded)

**PROPOSED — not ratified.**

Supersedes the withdrawn `proposed-amendment-A2-ci-backstop-host-independence.md`.
Nothing here is in force. Landing it requires developer ratification, a §4.1 ledger row
(clause r2.12), and the SPEC-CONVENTION §11 commit discipline.

**Source:** `ADR-001-runtime-infrastructure-posture.md` Consequences §2, as reworked
against `A2-adversarial-review-findings.md` (two independent reviews, both REQUEST
CHANGES, six convergent blockers, all coordinator-verified on disk).

**Instrument change from A2.** A2 proposed a new locked decision D22. Reviewer B
established, and the coordinator verified, that **D8 already requires "independent CI
backstops"** — the defect is that *independent* is undefined, not that the requirement is
missing. A2-r2 therefore **amends D8 to define the term** and adds no locked decision.
This retires the ambiguity at its source rather than creating a second definition beside
it, attaches the rule to the sentence that already gates promotion, and costs one fewer
permanent row in the locked-decisions table. **D22 is retired and unclaimed.**

## Anchor verification

Per the lesson earned on A2 — an amendment's own landing rots its line numbers, so line
numbers are not anchors. This amendment anchors on **quoted text + section heading + base
state**.

- **Base state:** `charter.md` on `codex/foreman-kernel-stage0-20260830`,
  working tree (A1 and A1.8 applied, uncommitted),
  `sha256 c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, 435 lines.
- Every "current text" block below was verified against that state. If the digest no
  longer matches, re-verify by quoted text before transcribing; section headings and
  quoted blocks, not offsets, are the durable anchors.

---

## What the reviews changed

Recorded so triage can check that each blocker was actually closed, not restated.

| Blocker | Closed by |
|---|---|
| C1 — no §4.1 ledger row; A2 un-landable | r2.12 |
| C2 — naive reading permits container/VM/second-adapter host | r2.1, criteria (i)-(iii) + the "whatever it is called" sentence |
| C3 — audit lands two parcels after the promotion it gates | r2.1 run-time assertion, r2.3 promotion gate, r2.11 stop condition |
| C4 — "CI host class" is a self-reported label | r2.2, r2.4, r2.6 — provider-issued attestation replaces it; term deleted |
| C5 — cites D13; D8 owns the term | r2.1 — the instrument change itself |
| C6 — cost section prices a foreclosure the text does not impose | Scope note below + honest cost section |
| Missed targets | r2.5, r2.6, r2.7, r2.8, r2.9, r2.10, r2.11, r2.12 |
| Latency exemption diverges from A1.3 | Deleted entirely; see "Not in this amendment" |
| "Enforces" has no mechanism; lesson #33 | r2.2 — emits an artifact instead of stating a sentence |
| Unbound D20 guard | r2.1 — now inside binding text |

**Scope note, stated up front because A2 got it wrong.** This amendment governs
**FK-P18's CI backstops only.** It does not govern FK-P17's or FK-P19's enforcement
evidence, which D20 *requires* on the Windows 11 + Docker Desktop enforcement platform.
A self-hosted runner on the enforcement machine remains permitted — and necessary — for
that work.

---

## r2.1 — D8, defining independence

**Target:** §4 Locked decisions table, the **D8** row, Decision column.

**Current text (final sentence of the Decision cell):**

> Enforcement cannot be promoted before independent CI backstops are green.

**Proposed replacement (that sentence only; the rest of the D8 cell is unchanged):**

> Enforcement cannot be promoted before independent CI backstops are green. A CI backstop
> is **independent** only when its execution context (i) carries no Foreman hook adapter
> installation and no governed agent session; (ii) is not administrable, reconfigurable,
> or interruptible by any principal the hook governs; and (iii) shares no physical
> machine, hypervisor, kernel, container runtime, storage volume, or user session with
> any host on which enforcement evidence is produced. Obtaining the repository by clone,
> copy, share, or mount from such a host does not satisfy (iii). A container, virtual
> machine, user account, or runner hosted on such a machine is not independent, whatever
> it is called and however its checks report. Each backstop run establishes this at run
> time and fails closed when it cannot: the run carries an attestation issued by the CI
> provider, never by the workflow definition or the parcel producing it. This definition
> governs the term "independent" wherever this charter applies it to CI backstops.
> Backstop evidence produced on an independent host is never host-parity evidence and
> never widens the D20 platform claim.

**Reasoning column, appended to D8's existing reasoning:**

> A backstop's only property is observing what the mediated path missed, and both the
> instances and the implementation must differ for that to hold: a second machine running
> the same adapter build inherits the same blind spots. The requirement was already
> present but the term was undefined, so an ordinary convenience change could satisfy it
> in writing while voiding it in fact, with every check green — the failure mode is
> invisible precisely because nothing fails. Defining it here rather than in a new
> decision keeps one definition attached to the sentence that gates promotion. Attestation
> is provider-issued because a self-reported label is not evidence (A1).

---

## r2.2 — FK-P18 emits attestation rather than stating a sentence

**Target:** §6, Wave 4 parcel table, FK-P18 row, Outcome column.

**Current text:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote. Owns only its named workflow/CI integration points.

**Proposed replacement:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote; every backstop run emits the D8 independence attestation — provider-issued
> runner-environment claim, immutable run identifier and durable log URL — and fails the
> run closed when that attestation cannot be obtained. Lands its backstops in new workflow
> files it owns; makes no edit to `.github/workflows/test-plugin-install.yml`. Owns only
> its named workflow/CI integration points.

**Rationale.** A workflow can request a runner; it cannot enforce which machine answers,
because runner registration and groups are provider-side and appear in no repository path.
An obligation to *state* a property in acceptance criteria is satisfiable by writing a
sentence (lesson #33). An obligation to *emit* an attestation is a produced artifact, and
it is dischargeable entirely inside FK-P18's Allowed Files — which the "enforces" phrasing
was not, and which would have fired §11's out-of-scope-file stop condition on dispatch.
The `test-plugin-install.yml` exclusion settles the §12 serialization point with
`plugin-packaging-and-scaffolder` rather than assuming it.

---

## r2.3 — FK-P19 promotion gate binds to an attested run

**Target:** §6, Wave 4 parcel table, FK-P19 row, Outcome column.

**Current text:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass; implements degraded
> read-only mode and fail-closed governed mutation.

**Proposed replacement:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass, where the cited backstop run
> carries a valid D8 independence attestation; a run that cannot produce one is treated as
> red. Implements degraded read-only mode and fail-closed governed mutation.

**Rationale.** This is the finding both reviewers ranked highest after the naive reading.
FK-P21 produces the evidence manifest and depends on FK-P19 and FK-P20, so under A2 the
only record of independence arrived two parcels *after* the irreversible act it was meant
to condition — and FK-P19's gate said merely "backstops pass". Binding the gate to a
specific attested run is what converts a late record into a precondition.

---

## r2.4 — Evidence manifest binds attested identity, not a label

**Target:** §6, Wave 4 parcel table, FK-P21 row, Outcome column.

**Current text:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, corpus inventory/count,
> reviewer-session identities, commands/results, and named mutation controls.

**Proposed replacement:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, the D8 independence
> attestation of each backstop run cited for enforcement promotion, corpus
> inventory/count, reviewer-session identities, commands/results, and named mutation
> controls.

**Rationale.** Every other field in this manifest is a digest or a derived identity;
"CI host class" would have been its only free-text field, populated in practice from
`runs-on:` — a string written by whoever moves the runner. A1 already ruled that a
self-reported figure is not evidence. Binding the attestation *of the cited run* also
closes the gap where a January manifest run attests a property irrelevant to the November
promotion it is filed against.

---

## r2.5 — Goal exit criterion, item 6

**Target:** §9, item 6.

**Current text:**

> 6. CI backstops are green before enforcement promotion and catch an intentionally
>    introduced out-of-scope mutation plus missing enrollment that bypass the hook.

**Proposed replacement:**

> 6. CI backstops are green before enforcement promotion on runs carrying valid D8
>    independence attestations, and catch an intentionally introduced out-of-scope
>    mutation plus missing enrollment that bypass the hook.

---

## r2.6 — Goal exit criterion, item 8 (the sibling A2 missed)

**Target:** §9, item 8.

**Current text:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, corpus inventory/count, reviewer-session distinction, commands,
>    results, and named mutation controls.

**Proposed replacement:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, the D8 independence attestation of each cited backstop run,
>    corpus inventory/count, reviewer-session distinction, commands, results, and named
>    mutation controls.

**Rationale.** The charter enumerates the manifest's contents twice — the FK-P21 row and
this item. A2 amended one. That is A1.7's defect class verbatim, and both reviewers caught
it independently.

---

## r2.7 — Wave 4 exit

**Target:** §6, Wave 4 exit paragraph.

**Current text:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI was
> green before enforcement promotion; service outages have bounded recovery; and host
> claims plus all proof identities are bound in the evidence manifest.

**Proposed replacement:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI was
> green before enforcement promotion on attested-independent runs per D8; service outages
> have bounded recovery; and host claims plus all proof identities are bound in the
> evidence manifest.

**Rationale.** The person closing Wave 4 reads the wave exit, not §9.

---

## r2.8 — New integration scenario 15

**Target:** §8 Integration scenarios. Append after scenario 14.

**Proposed text:**

> 15. **Backstop independence:** a backstop run cited for enforcement promotion carries a
>     provider-issued attestation that its execution context hosted no adapter and no
>     governed session and shared no machine, hypervisor, kernel, container runtime,
>     storage volume, or user session with any enforcement-evidence host; a run launched
>     on a context that fails any of those conditions, including a container or virtual
>     machine on an enforcement host, fails closed and is not citable; and the attestation
>     of the cited run appears in the evidence manifest.

**Rationale.** §8 opens "The goal is not complete until all scenarios have durable
evidence." Every other exit criterion has a scenario behind it; A2 would have added an
exit condition with nothing obliged to evidence it.

---

## r2.9 — Gate 1 decision list, scenario count

**Target:** §13, item 9.

**Current text:**

> 9. the explicit out-of-scope list and fourteen integration scenarios;

**Proposed replacement:**

> 9. the explicit out-of-scope list and fifteen integration scenarios;

**Rationale.** r2.8 adds scenario 15. Both reviewers explicitly warned that adding a
scenario without touching this line re-commits A1.7's defect while fixing A2's.

---

## r2.10 — Gate 1 decision list, item 3

**Target:** §13, item 3.

**Current text:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, and shadow-first enforcement (D7–D8, D20);

**Proposed replacement:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, shadow-first enforcement, and D8's definition of backstop
>    independence with its run-time attestation requirement (D7–D8, D20);

---

## r2.11 — New stop condition

**Target:** §11 Stop conditions. Insert before the final "queue is empty" condition.

**Proposed text:**

> - a CI backstop run cited for enforcement promotion cannot produce a valid D8
>   independence attestation;

**Rationale.** The amendment's whole thesis is that the failure mode is invisible because
nothing fails. Omitting the stop condition would have left that true.

---

## r2.12 — Ratification ledger row

**Target:** §4.1 Ratification ledger. Append a row.

**Proposed text:**

> | \<ratification date\> | Amendment A2-r2 — backstop independence defined in D8 | D8 definition and attestation requirement; FK-P18, FK-P19, FK-P21 scope; §9 exit items 6 and 8; Wave 4 exit; integration scenario 15; §13 items 3 and 9; §11 stop condition | `proposed-amendment-A2-r2-backstop-independence.md`, ratification record at foot |

**Rationale.** §4.1: "Appending a row is the only way to change the binding set." A2 was
drafted fourteen minutes before §4.1 existed and did not know the rule had changed
underneath it. This clause is why that mattered.

---

## What this amendment deliberately does not do

- **Adds no locked decision.** D22 is retired and unclaimed. The locked-decisions table
  gains no row; D8's cell gains a definition.
- Adds no refusal class, no tool, no authority, no parcel, and changes no dependency edge.
- Changes no human gate.
- **Does not govern FK-P17 or FK-P19 enforcement evidence.** D20 requires that work on the
  Windows 11 + Docker Desktop platform, and a self-hosted runner on the enforcement machine
  remains permitted and necessary for it. D8's definition reaches FK-P18's backstops only.
- **Says nothing about latency or performance in CI.** A2 carried an exemption clause that
  was unscoped (licensing a runner on the enforcement machine), and that diverged from A1.3
  — "advisory in CI" versus A1.3's "may assert only a coarse regression bound", which give
  opposite guidance on whether a latency job may turn a build red. A1.3's limitation never
  landed in the charter (verified: zero occurrences of "coarse"). **That is a real gap and
  it belongs to A1, not here.** It should be closed by a separate A1.9 in A1's own words;
  recorded here so it is not lost.
- Does not widen the D20 platform claim — and now says so in binding text rather than in
  commentary that never lands.

## Cost, restated honestly

A2's cost section priced a foreclosure its own operative text did not impose. Corrected:

- **The compliant option is free and already in place.** GitHub-hosted `ubuntu-latest` —
  already used by `.github/workflows/test-plugin-install.yml`, already ADR-001's Tier 1
  recommendation, $0.
- **A self-hosted runner on a separate machine also complies.** A spare box or mini-PC is
  one-time capital with no recurring cost.
- **What is actually foreclosed** is running FK-P18's backstops on the enforcement machine.
  Its only saving is that the machine is already on the desk.
- **What is not foreclosed** is FK-P17's Windows enforcement evidence, which D20 requires
  there. A2's headline $140/month was for that work and does not apply. (For the record,
  ADR-001's $140 figure appears in its *Alternatives* section and Revisit trigger 2, not
  in "Tier 2", which contains no costing — A2 mis-cited it.)

**Residual pressure on D20, stated rather than buried.** Free Linux backstops plus costly
Windows enforcement evidence creates an incentive to argue Linux evidence should count as
enforcement evidence. The guard is now inside D8's binding text, not in commentary.

## Ratification

Ratifying this amendment binds the r2.1–r2.12 replacement text, including the §4.1 ledger
row that puts it in force.

Rejecting it leaves D8's "independent" undefined and the backstop-voiding configuration
available. If rejected, the honest disposition is a lessons-ledger entry recording the
known unowned risk — the configuration stays available either way, and an unwritten
property is the one nobody defends.

**Ratification record:** _(unratified — awaiting explicit developer approval)_
