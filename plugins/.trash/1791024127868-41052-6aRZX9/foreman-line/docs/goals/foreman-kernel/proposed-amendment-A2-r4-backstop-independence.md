> **PARKED 2026-09-01 by developer ruling.** This draft is not in force and is not
> a live proposal. It is retained as the drafting record only. See
> `A2-PARKED-known-unowned-risk.md` for the ruling and for unowned risk U1, which
> is a stop condition on FK-P18.

# Proposed Charter Amendment A2-r4 — Backstop Independence, Gated on One Verifiable Fact

## Status

**PROPOSED — not ratified.** Supersedes A2 (withdrawn), A2-r2 and A2-r3 (superseded).

**Blocked on a prerequisite.** A1.8 installed §4.1 and appended no ledger row for itself, so
by §4.1's own rule §4.1 is provisional. r4.11 depends on it. A2-r4 cannot land until A1.8's
text is developer-reviewed and carries its own row.

**Source:** `ADR-001-runtime-infrastructure-posture.md` Consequences §2, reworked across three
review rounds — `A2-adversarial-review-findings.md`, `A2-r2-…`, `A2-r3-…` — five completed
independent reviews, all REQUEST CHANGES.

**Developer rulings this draft implements (2026-09-01):** use Sigstore artifact attestation
plus an out-of-band jobs-API cross-check for the mechanical clause; **drop the review control
and the homogeneity obligation out of the citability test entirely** and report them as
human-judgment controls.

## Anchor verification

- **Base state:** `charter.md` on `codex/foreman-kernel-stage0-20260830`, working tree
  (A1 transcribed, A1.8 applied, both uncommitted),
  `sha256 c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, 435 lines.
- Anchors are quoted text plus section heading. Line numbers are not anchors.

---

## What changed, and why this draft is narrower

Three drafts failed the same way. Each tried to make the charter bind something outside the
repository — a machine's software inventory, a provider's settings, a property of code the
parcel itself writes — and each ended up describing an artifact that could not carry the
claim. r3 got one third of the way: its mechanical clause was, for the first time, verified
against GitHub's own documentation and found real.

**A2-r4 gates on that one fact and nothing else.** Citability is a single verifiable
proposition: the run executed on provider-hosted infrastructure, attested by the provider,
checked by a party that is not the run. Everything the earlier drafts tried to gate on that
the repository cannot prove is now a **recorded human-judgment control** — reported, reviewed,
and honestly labeled, with no gate authority and no stop condition.

This is a narrower claim than r2 or r3 made. It is the widest one that is true.

**Why not the raw OIDC token.** r3 used the OIDC `runner_environment` claim. It is genuine,
but it expires in 900 seconds, is not bound to the run being cited, and would be verified by
the same workflow that emitted it — so on a self-hosted runner the check runs on the machine
under suspicion. A claim bound into a permanent evidence manifest needs to outlive the run and
be checkable by someone else. **Sigstore attestation does; a 15-minute JWT does not.**

**Terminology note.** These controls are reported under §9 item 9's existing **human-judgment**
category, not "detected-only" — §5 already defines detected-only as detected by enrollment
heartbeat and CI, and a human review is neither. No amendment to §9 item 9 is required.

---

## r4.1 — D8, pointing at the definition

**Target:** §4 Locked decisions table, **D8** row, Decision column.

**Current text (final sentence of the Decision cell):**

> Enforcement cannot be promoted before independent CI backstops are green.

**Proposed replacement (that sentence only; the rest of the cell is unchanged):**

> Enforcement cannot be promoted before independent CI backstops are green, where
> *independent* is defined in §4.2. §4.2's citability rules are separate from this decision's
> outage posture and do not modify it.

---

## r4.2 — New §4.2

**Target:** §4. Insert after §4.1, before `## 5. First-release architecture`.

**Proposed text:**

> ### 4.2 Backstop independence
>
> This subsection defines *independent* as D8 and D13 apply it to the CI backstops produced by
> FK-P18, **and nowhere else in this charter**. It does not reach §2's or §5's use of
> "independent" for enforcement layers, which are architectural claims about layer separation,
> not requirements on execution context.
>
> **Citability.** A CI backstop run is **citable for enforcement promotion if and only if** the
> CI provider attests that the run executed on provider-hosted infrastructure, in an
> attestation that satisfies all of the following:
>
> 1. **Provider-signed and not build-modifiable.** The runner-environment fact is carried in a
>    signing certificate issued by the provider's certificate authority, in a field the build
>    steps cannot set. On GitHub Actions this is the artifact attestation's Fulcio certificate
>    extension for runner environment, whose provider-hosted value is `platform-hosted`; the
>    value `self-hosted` does not satisfy this clause. A value written by a workflow
>    definition, a runner label, repository or organization content, or any parcel does not
>    satisfy it, whatever it is named.
> 2. **Bound to the run being cited.** The same certificate binds the source repository, the
>    invoking run, and the commit, and those bindings match the run FK-P19 cites.
> 3. **Verified out of band.** Verification is performed against the provider's trust root by a
>    step that is not the attested run and does not execute on its runner, and the verification
>    result is recorded with the identity of the verifying context.
> 4. **Independently corroborated.** The provider's own record of the run — queried from the
>    provider's API rather than reported by the run — agrees that the job executed on
>    provider-hosted infrastructure.
> 5. **Re-verifiable later.** The attestation and its verification record are retained in full,
>    so the check can be reproduced from the evidence manifest after the run's credentials have
>    expired.
>
> Another provider may be used only where it issues an equivalent provider-signed,
> build-immutable, run-bound attestation, named and valued by amendment before use.
>
> **Eligibility, availability, and violation are three outcomes, not two.**
> - A run in a context that structurally cannot produce the attestation — a pull request from a
>   fork, or any event the provider excludes from attestation issuance — is **ineligible**. An
>   ineligible run is never citable and is never retried toward citability. FK-P18's backstops
>   draw their citable runs from eligible events.
> - A run whose workflow does not request attestation, or which omits the permissions
>   attestation requires, is a **violation**, not an unavailability. This is verifiable from the
>   workflow files in the repository.
> - A run whose attestation cannot be obtained or verified for a transient provider reason is
>   **unavailable**: not citable, and retried. Unavailability persisting across three
>   consecutive attempts, or beyond one working day, is a violation.
> - A run whose attestation is obtained and shows non-provider-hosted execution, or fails any
>   of clauses 1-5, is a **violation**.
>
> Violations fire §11. Ineligibility and transient unavailability do not. Each outcome is
> reported with a stable code.
>
> **Recorded human-judgment controls.** Two properties bear on backstop independence that this
> charter does not gate on, because neither can be proven from the repository, and claiming
> otherwise in earlier drafts is what made them fail:
>
> - **Runner-target change control.** Where the backstop runs is determined partly by
>   provider-side configuration outside any repository path. FK-P18 records the configuration
>   it relies on and the control applied to it; review confirms the record. **No prevention is
>   claimed.**
> - **Backstop implementation independence.** A backstop that reaches its verdict through the
>   same compiled artifacts the mediated path consumes inherits that path's defects. FK-P18
>   records which artifacts its checks share with the mediated path and which invariants it
>   re-derives independently; review confirms the record. **No prevention is claimed.**
>
> Both are reported in the final report's **human-judgment** category per §9. Neither is a
> condition of citability and neither fires §11. A future amendment may promote either to a
> gate only on evidence that it can be mechanically established.
>
> **Non-widening.** Backstop evidence produced on a provider-hosted runner is never
> host-parity evidence and never widens the D20 platform claim.

---

## r4.3 — D13, closing the parallel gate

**Target:** §4 Locked decisions table, **D13** row, Decision column.

**Current text (first sentence fragment of the Decision cell):**

> Pre-action path checks are backed by post-action realpath-aware Git-diff detection and CI,
> and CI lands before enforcement promotion.

**Proposed replacement:**

> Pre-action path checks are backed by post-action realpath-aware Git-diff detection and CI,
> and CI lands before enforcement promotion on backstop runs citable under §4.2.

**Rationale.** D13 independently gates promotion on CI. Amending D8 alone would leave D13's
sentence standing as an unqualified escape hatch, with two tier-2 decisions gating the same
act at different strengths and §3 offering no intra-tier rule — a §11 ambiguity manufactured
by the amendment meant to remove one. Every earlier draft missed this.

---

## r4.4 — FK-P18 scope

**Target:** §6, Wave 4 parcel table, FK-P18 row, Outcome column.

**Current text:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote. Owns only its named workflow/CI integration points.

**Proposed replacement:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote; requests provider attestation for every backstop run, defines the §4.2 citability
> record's schema and its stable outcome codes, and records the two §4.2 human-judgment
> controls. Lands its backstops in new workflow files it owns and edits no pre-existing root
> workflow file. Owns only its named workflow/CI integration points.

**Rationale.** Schema and codes are assigned to the parcel that produces the runs, so the whole
obligation stays inside FK-P18's Allowed Files. Out-of-band verification is deliberately *not*
FK-P18's — see r4.5.

---

## r4.5 — FK-P19 verifies and records at promotion

**Target:** §6, Wave 4 parcel table, FK-P19 row, Outcome column.

**Current text:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass; implements degraded read-only
> mode and fail-closed governed mutation.

**Proposed replacement:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass on runs it has verified citable
> under §4.2 — performing the out-of-band attestation verification and provider-record
> corroboration itself — and records at promotion time the run identifier, attestation, and
> verification result for each cited run. Implements degraded read-only mode and fail-closed
> governed mutation.

**Rationale.** §4.2 clause 3 requires verification by a party that is not the attested run.
Assigning it to FK-P19 — which consumes the result and is not the producer — is what makes that
clause true rather than aspirational. It also closes the retrospective-selection gap: the
citation is recorded at the moment of promotion, not reconstructed later.

---

## r4.6 — Evidence manifest

**Target:** §6, Wave 4 parcel table, FK-P21 row, Outcome column.

**Current text:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, corpus inventory/count,
> reviewer-session identities, commands/results, and named mutation controls.

**Proposed replacement:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, the retained §4.2 attestations
> and verification records FK-P19 recorded at promotion, the §4.2 human-judgment control
> records, corpus inventory/count, reviewer-session identities, commands/results, and named
> mutation controls.

---

## r4.7 — Goal exit criterion, item 6

**Target:** §9, item 6.

**Current text:**

> 6. CI backstops are green before enforcement promotion and catch an intentionally
>    introduced out-of-scope mutation plus missing enrollment that bypass the hook.

**Proposed replacement:**

> 6. CI backstops are green before enforcement promotion on runs verified citable under §4.2,
>    and catch an intentionally introduced out-of-scope mutation plus missing enrollment that
>    bypass the hook.

---

## r4.8 — Goal exit criterion, item 8

**Target:** §9, item 8.

**Current text:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, corpus inventory/count, reviewer-session distinction, commands,
>    results, and named mutation controls.

**Proposed replacement:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, the §4.2 attestations and verification records of each cited
>    backstop run, the §4.2 human-judgment control records, corpus inventory/count,
>    reviewer-session distinction, commands, results, and named mutation controls.

---

## r4.9 — Wave 4 exit

**Target:** §6, Wave 4 exit paragraph.

**Current text:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI was
> green before enforcement promotion; service outages have bounded recovery; and host
> claims plus all proof identities are bound in the evidence manifest.

**Proposed replacement:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI backstops
> were green before enforcement promotion on runs verified citable under §4.2; service outages
> have bounded recovery; and host claims plus all proof identities are bound in the evidence
> manifest.

---

## r4.10 — New integration scenario 15

**Target:** §8 Integration scenarios. Append after scenario 14.

**Proposed text:**

> 15. **Backstop independence:** a run cited for enforcement promotion satisfies every clause
>     of §4.2's citability test, with verification performed off the attested runner and the
>     provider's own record corroborating it; a run attested as non-provider-hosted is a
>     violation and fires the §11 stop condition; a fork-triggered run is ineligible and is
>     never retried toward citability; a run whose workflow omits the attestation request is a
>     violation detectable from the repository; the retained attestation and verification
>     record are re-verifiable from the evidence manifest after the run's credentials expire;
>     and the two §4.2 human-judgment control records appear in the final report under
>     human-judgment, claiming no prevention.

---

## r4.11 — Ratification ledger row

**Target:** §4.1 Ratification ledger. Append a row. **Blocked on the A1.8 precondition.**

**Proposed text:**

> | \<ratification date\> | Amendment A2-r4 — backstop independence defined in §4.2 | D8 and D13 citations; new §4.2; FK-P18, FK-P19, FK-P21 scope; §9 exit items 6 and 8; Wave 4 exit; integration scenario 15; §13 items 3 and 9; §11 stop condition; §12 ownership | `proposed-amendment-A2-r4-backstop-independence.md`, ratification record at foot |

---

## r4.12 — Gate 1 decision list, items 3 and 9

**Target:** §13, item 3.

**Current text:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, and shadow-first enforcement (D7–D8, D20);

**Proposed replacement:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, shadow-first enforcement, and §4.2's attestation-gated definition of
>    backstop independence with its accepted provider dependence and its two non-gating
>    human-judgment controls (D7–D8, D13, §4.2, D20);

**Target:** §13, item 9.

**Current text:**

> 9. the explicit out-of-scope list and fourteen integration scenarios;

**Proposed replacement:**

> 9. the explicit out-of-scope list and fifteen integration scenarios;

---

## r4.13 — New stop condition

**Target:** §11 Stop conditions. Insert before the final "queue is empty" condition.

**Proposed text:**

> - a backstop run cited or required for enforcement promotion is a §4.2 violation, including
>   attestation showing non-provider-hosted execution, a workflow that does not request
>   attestation, or unavailability persisting past §4.2's bound;

---

## r4.14 — §12 serialization points

**Target:** §12, the sentence assigning FK-P18's ownership.

**Current text:**

> FK-P18 owns its exact CI files;

**Proposed replacement:**

> FK-P18 owns its exact CI files, including the new workflow files it creates for its
> backstops, and edits no pre-existing root workflow file;

**Rationale.** New files under `.github/workflows/` are root workflow files and therefore §12
serialization points, so the exclusion belongs in §12 where the register lives. r3 narrowed
this sentence to workflow files only, stranding FK-P18's CI helper scripts, config and
fixtures outside its ownership — a §11 out-of-scope trip on dispatch. This restores the breadth
and adds the exclusion.

---

## What this amendment deliberately does not do

- **Adds no locked decision.** D22 remains retired. D8 and D13 gain citations; the definition
  lives in §4.2.
- Adds no tool, no authority, no parcel; changes no dependency edge and no human gate.
- **Does not govern FK-P17 or FK-P19 enforcement evidence.** D20 requires that work on the
  Windows 11 + Docker Desktop platform, and a self-hosted runner there remains permitted and
  necessary for it. §4.2 states this boundary in binding text.
- **Does not reach §2 or §5**, and says so in §4.2's first paragraph.
- **Claims no prevention of runner-target reconfiguration and no proof of implementation
  independence.** Both are recorded, reviewed, and reported as human-judgment. Three drafts
  claimed more than could be proven; this one stops.
- Says nothing about latency in CI. A1.3's unlanded limitation remains A1's to close via A1.9.
  **Note:** §4.2's non-widening sentence covers only backstop evidence, so A1.9 still needs
  A1.3's own guard for latency assertions.

## Cost

- **The compliant option is a provider-hosted runner.** `test-plugin-install.yml` already uses
  `ubuntu-latest` on all three jobs. FK-P18's backstops are new files, so this is new usage
  against the existing workflow allocation, not free-by-existing. (ADR-001 says Tier 0 plus
  Tier 1 cost "approximately nothing" — in its **Consequences** section, "Cost is dominated by
  model spend, not hosting," not in Tier 1. r3 mis-attributed this; the correction is recorded
  here rather than silently made.)
- **Accepted: provider dependence.** §4.2 requires a provider that issues a signed,
  build-immutable, run-bound attestation. Moving providers requires an amendment naming the
  equivalent artifact.
- **Foreclosed: self-hosted backstops.** A separate machine may be genuinely independent, but
  no provider attestation demonstrates it, so it is not citable.
- **Foreclosed: fork-PR backstop runs as promotion evidence.** They are ineligible by
  construction. External contributions still run CI; their runs are simply not citable.
- **Unchanged: FK-P17's Windows evidence.** D20 requires it on the enforcement platform and
  §4.2 does not reach it. A2's headline $140/month was for that work and does not apply.
  (ADR-001's $140 appears in its *Alternatives* section and Revisit trigger 2; "Tier 2" carries
  no costing.)
- **Not priced, and stated rather than omitted:** the review effort of the two human-judgment
  controls, which recur for the life of the goal.

## Ratification

Ratifying this amendment binds the r4.1–r4.14 replacement text, including §4.2 and the §4.1
ledger row that puts it in force. **Ratification cannot be discharged until A1.8 is reviewed
and carries its own ledger row.**

Rejecting it leaves D8's and D13's "independent" undefined. If rejected, the honest disposition
is a lessons-ledger entry recording the known unowned risk.

**Ratification record:** _(unratified — awaiting explicit developer approval)_
