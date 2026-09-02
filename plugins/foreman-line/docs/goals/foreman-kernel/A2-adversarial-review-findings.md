# Adversarial Review Findings — Amendment A2 (CI Backstop Host Independence)

**Date:** 2026-09-01
**Reviews:** two independent frontier sessions (A and B), zero coordinator context,
read-only envelope, dispatched from
`plugins/foreman-line/docs/kickstarters/foreman-kernel-review-A2.md`.
**Both verdicts:** REQUEST CHANGES. Reviewer A: 6 BLOCKER, 5 SHOULD-FIX, 2 INFORMATIONAL.
Reviewer B: 4 BLOCKER, 6 SHOULD-FIX, 2 INFORMATIONAL.
**Both confirmed read-only envelopes held; no mutations.**

Two independent reviews were run per lesson #12 (architecture/risk parcels get two).
They converged on six blocking findings and diverged on one — the instrument question,
found only by B, which is the most consequential finding in the set.

## Coordinator verification

Every checkable claim was verified on disk against the working-tree charter before triage.
**All nine verified true.**

| # | Claim | Verified |
|---|---|---|
| 1 | D8 already contains "independent CI backstops" | TRUE — charter line 84 |
| 2 | FK-P19's promotion gate reads "…FK-P18 CI backstops pass", unqualified | TRUE — line 240 |
| 3 | §9 item 8 enumerates manifest contents separately from the FK-P21 row | TRUE — lines 329-331 |
| 4 | Wave 4 exit says "CI was green", unqualified | TRUE — lines 244-247 |
| 5 | A2's anchor line numbers are stale (+20/+20/+27) | TRUE — FK-P18 is 239 not 219; FK-P21 242 not 222; §9 item 6 at 324 not 297 |
| 6 | ADR-001 "Tier 2" contains no costing; $140 lives in Alternatives / Revisit trigger 2 | TRUE — Tier 2 at line 129 has no figure; $140 at lines 204 and 301 |
| 7 | A1.3's "coarse regression bound" limitation never landed in the charter | TRUE — zero occurrences of "coarse" |
| 8 | "runner" and "host class" appear nowhere in the charter | TRUE — zero occurrences of each |
| 9 | A2 predates §4.1 and supplies no ledger row | TRUE — A2 mtime 12:14, A1.8 applied 12:28 |

## Convergent blocking findings

**C1. A2 is mechanically un-landable (A-F1, B-3c).** §4.1 states "Appending a row is the
only way to change the binding set. An amendment document that has not produced a row here
is a proposal, whatever its own status line says." A2 supplies no §4.1 row and never names
it as a target. Transcribed exactly, A2 yields a D22 that §4.1 says is not in force.
A2 was drafted before A1.8 existed and does not know the rule changed underneath it.

**C2. The naive reading permits the whole attack (A-F2, B-B1).** Both reviewers
independently constructed the same escapes. D22 forbids sharing "the enforcement host's"
adapter, session, or filesystem — an *instance* test. A job container on the enforcement
machine shares none of those instances (own namespace, own hostname, no adapter in the
image) while sharing kernel, Docker daemon, disk, Defender posture, and physical failure
domain. A WSL2/Hyper-V VM likewise. Anything not named "a self-hosted runner" escapes
sentence 2's proper-noun exclusion entirely. B added the sharpest variant: a *second*
Windows machine with the same adapter build satisfies every clause while inheriting
identical mediation blind spots — because the hazard is homogeneity of implementation,
not co-location of instances. Both noted "the enforcement host" and "the D20 enforcement
machine" have no definition anywhere in the charter; D20 names a platform class, never a
machine.

**C3. The audit lands two parcels after the act it audits (A-F3, B-B2).** FK-P21 depends on
FK-P19 and FK-P20, so the manifest binding the host class is produced *after* enforcement
promotes. FK-P19's gate — unamended by A2 — says only "FK-P18 CI backstops pass". Nothing
re-checks after FK-P18 merges: no stop condition, no scenario, no standing assertion. A2
claims "independence is audited rather than assumed"; the mechanism delivers a
point-in-time record, produced late, of a run that need not be the run that satisfied the
gate.

**C4. "CI host class" is a self-reported label, and A1 already ruled that out (A-F4, B-SF5).**
The term is undefined in the entire corpus; FK-P18 declares a "runner class" while FK-P21
binds a "CI host class" with no stated synonymy. In the repo's only CI provider it would
be populated from `runs-on:` — a string written by the same person who moves the runner.
Every other manifest field is a digest or a derived identity. Decisively, A1 (ratified)
already holds that "a self-reported timing figure is not evidence and must never be
treated as such"; A2 binds a self-reported *host* figure and calls it an audit.

**C5. D22 misattributes its basis and overstates the gap (A-F8, B-SF6).** A2 says the
backstops are "required by D13" and that "nothing in the charter currently forbids this."
D13 never uses the word "backstop." **D8 does, and already requires them to be
*independent*.** The charter's real defect is that "independent" is undefined — in D8, in
§2, and in §5 — not that the requirement is absent. As drafted, D22 would define the term
for one decision while three other uses stay undefined, creating an intra-tier ambiguity
that §3's hierarchy has no rule to resolve — itself a §11 stop condition.

**C6. The cost section prices a foreclosure D22 does not impose (A-F9, B-B4).** D22's
operative scope is FK-P18's backstops. FK-P17's proofs are a different parcel, and D20
*requires* them on the enforcement platform. So D22 does not forbid a self-hosted Windows
runner for FK-P17 at all, and the headline $140/month cost is invented. Compounding:
the ADR citation is wrong (Tier 2 has no costing), the free compliant option is never
mentioned (GitHub-hosted `ubuntu-latest`, already in the repo, already ADR-001's Tier 1
recommendation, $0), and "the remaining options are…" is a false dichotomy that A2's own
non-binding section contradicts.

## Convergent non-blocking findings

- **Missed targets** (A-F7, B-B3): §9 item 8, §6 Wave 4 exit, FK-P19's row, an §8 scenario,
  a §11 stop condition. §9 item 8 and the Wave 4 exit are A1.7's defect class verbatim —
  a value restated in two places with only one amended.
- **Latency exemption** (A-F5, B-SF7): D22's exemption sentence is unscoped (literally
  exempting performance jobs from D22 itself, licensing a runner on the enforcement box);
  and it does not restate A1.3, because A1.3's limitation never landed. D22 would be the
  *first* binding statement of that rule, in materially different words — "advisory in CI"
  versus A1.3's "may assert only a coarse regression bound." Those give opposite guidance
  on whether a latency job may turn a build red.
- **"Enforces" has no mechanism** (A-F11, B-SF8): a workflow can request a runner, not
  enforce which machine answers. Runner groups and registration are provider-side, outside
  any repo path, so the obligation cannot be discharged inside FK-P18's Allowed Files —
  scheduling a §11 stop condition on dispatch. B additionally flags lesson #33: the
  prescribed acceptance criterion is an acceptance criterion *about* acceptance criteria,
  satisfiable by writing a sentence.
- **Load-bearing guards are unbound** (A-F6, B-INFO12): A2's ratification clause binds only
  D22 and A2.2–A2.5. The D20-non-widening sentence — the sole guard against the pressure
  D22 creates — sits in commentary and never reaches the charter.
- **Stale anchors** (A-F10, B-INFO11): +20/+20/+27. All four quoted blocks still match
  verbatim, so transcription-by-text lands correctly; the damage is to the control, not the
  content.

## Divergent finding — the instrument question (B only)

B alone challenged whether D22 is the right *vehicle*, and answered on checkable grounds:

- The AC-only alternative ADR-001 originally recommended **fails**, because SPEC-CONVENTION
  §3 makes `done` specs never auto-loaded — the property would become unreadable exactly
  when the convenience change that threatens it occurs. It is also tier 5 against a tier 2
  threat. STANDING-CONSTRAINTS #12 already ruled this shape: parcel-time discipline dies
  with the parcel; permanent protection pins the invariant. **So escalation was justified.**
- But **amending D8 is strictly better than adding D22**: it adds no row to the
  locked-decisions table, cannot diverge from D8 because it *is* D8, retires the
  undefined-"independent" ambiguity at its source instead of creating a second definition
  beside it, and attaches the definition to the sentence that already gates promotion —
  which is the moment C3 says the property must bind.

Reviewer A did not consider the instrument question. There is no conflict between the
reviews to reproduce; B's finding is additive and survives the coordinator's verification
(claim 1 above).

## Coordinator triage

| Finding | Disposition |
|---|---|
| C1 ledger row | **FIX** — blocking; A2 cannot land without it |
| C2 naive reading | **FIX** — blocking; text must exclude container/VM/second-adapter cases |
| C3 late audit | **FIX** — blocking; bind at FK-P19's gate, add run-time attestation |
| C4 host class | **FIX** — blocking; replace with provider-attested run identity |
| C5 D13/D8 misattribution | **FIX** — blocking; drives the instrument question |
| C6 cost section | **FIX** — blocking; the stated cost is not the real one |
| Missed targets | **FIX** — mechanical, enumerated above |
| Latency exemption | **FIX** — delete from D22; A1.3's limitation needs its own clause |
| "Enforces" / lesson #33 | **FIX** — replace with an emitted attestation artifact |
| Unbound guards | **FIX** — promote the D20-non-widening sentence into replacement text |
| Stale anchors | **FIX** — see lesson candidate below |
| Instrument question | **DEVELOPER RULING REQUIRED** — Gate 1 territory |

## Coordinator recommendation

**Withdraw A2 and redraft as A2-r2 amending D8**, per B's instrument finding. The redraft
carries every convergent fix above plus the enumerated missed targets, and re-anchors
against the post-A1/A1.8 working tree.

A2 is not rejected on substance. Both reviewers independently confirmed the defect is real,
previously unowned, and correctly diagnosed — the framing that "the failure mode is
invisible precisely because nothing fails" survived both attacks. What failed is the
drafting, and one structural choice that a narrower instrument fixes.

## Lesson candidate (Stage-F ledger)

**Amendment anchor blocks must cite the base state, not line numbers.** A2's anchors went
stale the moment A1 landed, and A1's own anchors went stale when A1 itself was transcribed.
Line numbers in an amendment are guaranteed to rot, because the amendment's own landing is
what rots them. Cite quoted text plus section heading plus the base commit or content digest
of the artifact verified against. **Disposition: proposed for SPEC-CONVENTION §11 (the
amendment-pattern section), which is the narrowest artifact already read by any agent
drafting an amendment.**
