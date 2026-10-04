# Adversarial Review Findings — Amendment A2-r2 (Round 2)

**Date:** 2026-09-01
**Reviews:** two independent frontier sessions, read-only, both envelopes confirmed held.
- **Reviewer C — blind.** Attacked A2-r2 on its own terms; explicitly did not read the
  round-1 findings or the withdrawn A2, to catch what round 1 missed and what r2 introduced.
- **Reviewer D — regression.** Read the round-1 findings and the withdrawn A2, and audited
  A2-r2's "What the reviews changed" table finding by finding.

**Both verdicts: REQUEST CHANGES.** C: 7 BLOCKER, 9 SHOULD-FIX, 3 INFORMATIONAL.
D: 10 BLOCKER, 9 SHOULD-FIX, 2 INFORMATIONAL, and D ranked **withdrawal above
amendment-in-place**.

Both verified the base digest `c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`
and confirmed all nine quoted "current text" blocks match verbatim. The anchoring method
introduced after round 1 held.

## Coordinator verification

Seven claims checked on disk. **All seven true.**

| # | Claim | Verified |
|---|---|---|
| 1 | §5's "CI and source-control rules remain independent backstops" (line 135) sits **inside** the fenced architecture diagram (lines 116-136) | TRUE — the reach clause would make a line of ASCII art binding |
| 2 | §4.1's ledger contains no row for A1.8 itself | TRUE — three rows: original Gate 1, R1–R13, A1 |
| 3 | A1's "a self-reported timing figure is not evidence" sits under "**Open implementation question for FK-P1, not decided here**" | TRUE — A1 line 236, section heading line 231 |
| 4 | A1's ratified scope is "D21 and the A1.2–A1.7 replacement text" | TRUE — line 241; that sentence is outside it |
| 5 | `test-plugin-install.yml` has no `permissions:` block at all | TRUE — no `id-token: write`, so no OIDC token can be minted today |
| 6 | Integration scenario 15 (r2.8) omits criterion (ii) | TRUE — "administrable" occurs once in the whole document, in r2.1 only |
| 7 | All three workflow jobs are `runs-on: ubuntu-latest` | TRUE — lines 11, 26, 38 |

## The finding that decides it

**The attestation mechanism does not exist and cannot be made to exist on this provider.**
Found independently by C (B1, B2) and D (B3).

GitHub's only genuinely provider-issued environment claim is the OIDC token's
`runner_environment`, whose value space is `github-hosted | self-hosted`. It attests
none of criteria (i) or (ii) — the provider has no knowledge of what software is installed
on a machine, and "a principal the hook governs" is not a provider concept. For (iii) it is
blind in the one dimension that matters: **it returns the identical string for a runner on
the blessed spare mini-PC and a runner on the enforcement laptop.** A2-r2's own cost section
blesses the former; the amendment exists to forbid the latter.

So r2.1's "the run carries an attestation issued by the CI provider" describes an artifact
no provider issues. What FK-P18 would actually ship is a JSON object the governed builder
writes and the governed workflow validates. That is `runs-on:` under a longer name — the
exact defect r2.4's own rationale condemns, and the pattern that sank A2. **C4 was renamed,
not closed.**

## Second decisive finding — criterion (ii) is unsatisfiable

Found by D (B4), with C (B6) independently finding the same clause undefined.

"(ii) is not administrable, reconfigurable, or interruptible by any principal the hook
governs." A GitHub-hosted job is reconfigurable by editing `runs-on:` — a file §12 assigns
to FK-P18, edited by a governed builder — and interruptible by any repository write-holder.
A self-hosted runner fails harder. **There is no third option**, so every backstop run fails
(ii), fails closed, is treated as red, and fires r2.11's stop condition. FK-P19 can never
promote; the coordinator halts permanently.

C reached the same clause from the other side: "any principal the hook governs" is undefined
in the charter. Read narrowly it excludes the developer — the very actor in the threat model.
Read broadly it disqualifies every runner. A definition written to cure an undefined term
introduced a fresh undefined term into the same locked decision.

## Other convergent blockers

- **Temporal escape (C-B5, D-B5c).** "any host on which enforcement evidence **is produced**"
  is present-tense with no quantifier. Run the backstops on a clean machine (all three
  criteria true, attestation valid, gate passes, promotion happens), then install the adapter
  and produce FK-P17 evidence there. Compliant at every instant; the backstop and the
  enforcement evidence end up sharing a machine.
- **The scope limit is an unbound guard (C-B3, D-B2).** "governs FK-P18's CI backstops only"
  appears **only in commentary**; the binding reach clause says the opposite and, per
  verification 1, reaches a line inside §5's code fence — creating an attestation obligation
  for `test-plugin-install.yml`, which r2.2 forbids FK-P18 from touching. A2-r2 committed the
  exact sin it was written to fix, on its own most load-bearing limitation.
- **Implementation homogeneity is promised in reasoning, absent from the contract
  (C-SF8, D-B5b).** The Reasoning column says "both the instances and the implementation must
  differ." No operative clause governs what code the backstop runs. A backstop importing the
  same `authorizeAction` and compiled-scope packages misses identical defects on a machine a
  continent away, with a valid attestation. Reviewer rule #11: the assertion does not bind to
  its named invariant.
- **"Only when" is not a definition (D-B1).** It states a necessary condition. The instrument
  claim — "amends D8 to define the term" — requires a biconditional. There is no positive
  criterion for a run to "establish."
- **Scenario 15 drops criterion (ii) (D-B6, verification 6).** The only clause obliging
  durable evidence omits the criterion aimed squarely at the threat model. A1.7's defect
  class, recommitted by a clause whose sibling exists to fix that class.
- **A1.8 circularity (C-B7, D-S9, verification 2).** §4.1 says "an amendment document that has
  not produced a row here is a proposal, whatever its own status line says." A1.8 changed the
  charter in four places and appended no row for itself. **By its own rule, §4.1 is a
  proposal** — and A2-r2's sole landing mechanism rests on it. This is a defect in A1.8,
  independent of A2-r2, and must be fixed regardless of what happens here.
- **§12 missed (C-SF15, D-B9).** New files under `.github/workflows/` are root workflow files
  and therefore §12 serialization points. Excluding one file settles one member, not the
  class, and the settlement was recorded in a §6 parcel cell rather than in §12 where the
  register lives.
- **Coordinator's own citation error (D-S1, verification 3 and 4).** A2-r2 cites A1's
  "a self-reported label is not evidence (A1)" — but that sentence sits under A1's
  "**Open implementation question for FK-P1, not decided here**" and is outside A1's ratified
  scope. **The coordinator cited not-decided prose as ratified authority in the same document
  that corrects A2 for mis-citation.** Round 1 made the same error and it was inherited
  without checking.

## What survived four reviewers

- **The instrument change.** All four reviewers, including C who re-derived it blind,
  confirmed D8 is the sole locked decision carrying "independent CI backstops" and that
  amending it beats adding a decision. **Keep the instrument.**
- **The defect itself.** "The failure mode is invisible precisely because nothing fails"
  survived every attack across both rounds. The risk is real and unowned.
- **The anchoring method.** Digest plus quoted blocks plus section headings — verified exact
  by both reviewers. The round-1 lesson worked.
- **The duplicate-enumeration sweep (r2.6, r2.9) and scenario obligation (r2.8's rationale).**
  Correct and complete.
- **Deleting the latency exemption and deferring to A1.9.** Verified correct on every claim.
- **r2.3's structural move** — binding promotion to a specific cited run rather than to
  "backstops pass" — is the right shape even though the artifact it binds is not.
- **The $140 correction.** Precisely accurate.

## Coordinator assessment

Two rounds, four independent reviewers, and both drafts failed on the same axis: **reaching
for a mechanical control that CI cannot actually provide, then describing the resulting
artifact as if it proved something.** A2 called it "CI host class." A2-r2 called it a
"provider-issued attestation." Neither exists. A third draft that keeps the mechanism will
produce the same object with a third name.

The instrument is right and the diagnosis is right. **The mechanism has to change, and that
is a design decision for the developer, not a drafting fix.** Recommendation: do not
auto-generate A2-r3. Settle the mechanism first.

**Independently and regardless of that decision: A1.8 needs a self-referential fix** (its own
ledger row), and the coordinator's A1 citation error should not survive into any successor
draft.

## Lesson candidates (Stage-F ledger)

1. **An amendment that mandates evidence must name the artifact's issuer, its value space,
   and what it does not attest — verified against the actual provider — before ratification.**
   Both rounds shipped an evidence requirement whose artifact could not carry the claim.
   *Disposition: proposed for SPEC-CONVENTION §11.*
2. **A ratification-ledger rule must be self-applying.** A1.8 wrote "no row, no force" and
   appended no row for itself. *Disposition: fix in A1.8; propose the general rule for §11.*
3. **Scope limits stated in an amendment's commentary do not bind.** Diagnosed in round 1,
   recommitted in round 2 by the same author on the successor's central boundary.
   *Disposition: proposed as a standing constraint for amendment drafting.*
