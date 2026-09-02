> **PARKED 2026-09-01 by developer ruling.** This draft is not in force and is not
> a live proposal. It is retained as the drafting record only. See
> `A2-PARKED-known-unowned-risk.md` for the ruling and for unowned risk U1, which
> is a stop condition on FK-P18.

# Proposed Charter Amendment A2-r3 — Backstop Independence, Layered by What Can Actually Be Proven

## Status

**SUPERSEDED 2026-09-01 by `proposed-amendment-A2-r4-backstop-independence.md`.** Never
ratified; produced no §4.1 ledger row; no part of it is or was in force.

Round-3 review (`A2-r3-adversarial-review-findings.md`) verified §4.2(a)'s artifact as real —
the first externally confirmed mechanism in three drafts — and returned REQUEST CHANGES on
everything around it: §4.2(b) restored a provider-side obligation round 1 had killed,
§4.2(c) was a hiding place whose predicate was vacuous at evaluation time and whose
requirement had been silently weakened by "solely", the unavailable branch was a one-line
opt-out that never terminated, D13 was left unamended, and r2's D20 guard had been deleted.
A2-r4 keeps the frame and the verified mechanism, and drops (b) and (c) out of the citability
test on developer ruling.

Retained for provenance. The text below is the superseded draft, unaltered.

---

## Original status (superseded)

**PROPOSED — not ratified.** Supersedes A2 (withdrawn) and A2-r2 (superseded).

**Blocked on a prerequisite.** A1.8 installed §4.1 and appended no ledger row for itself.
By §4.1's own rule — "an amendment document that has not produced a row here is a proposal,
whatever its own status line says" — **§4.1 is currently provisional**, and r3.13 below
depends on it. A2-r3 cannot land until A1.8's text is developer-reviewed and carries its own
row. This is stated as a precondition rather than worked around.

**Source:** `ADR-001-runtime-infrastructure-posture.md` Consequences §2, as reworked against
two review rounds: `A2-adversarial-review-findings.md` and
`A2-r2-adversarial-review-findings.md` (four independent reviewers, all REQUEST CHANGES).

## Anchor verification

- **Base state:** `charter.md` on `codex/foreman-kernel-stage0-20260830`, working tree
  (A1 transcribed, A1.8 applied, both uncommitted),
  `sha256 c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, 435 lines.
- Anchors are quoted text plus section heading. Line numbers are not anchors — an
  amendment's own landing rots them.

---

## Why this draft is shaped differently

A2 and A2-r2 failed on the same axis, and four reviewers said so: each reached for a
mechanical control that CI cannot provide, then described the resulting artifact as if it
proved something. A2 called it "CI host class." A2-r2 called it a "provider-issued
attestation of criteria (i)-(iii)." **No CI provider issues such an artifact.** GitHub's only
genuine environment claim is the OIDC `runner_environment`, whose value space is
`github-hosted | self-hosted` — it cannot see what software a machine runs, cannot see who
administers it, and returns the identical string for a compliant separate machine and the
enforcement laptop.

A2-r2 additionally made its central threat — someone reconfigures where the backstops run —
into a *runtime* property ("not administrable, reconfigurable, or interruptible by any
principal the hook governs"). Reviewer D showed that property is satisfied by no runner that
exists: a hosted job is reconfigurable by editing `runs-on:` and interruptible by any
repository write-holder. The clause would have deadlocked the goal permanently.

**A2-r3 therefore splits the property into three layers and labels each by what it actually
delivers** — the same honesty D7 and D13 already require of this charter, which distinguishes
refused from detected rather than overclaiming containment:

| Layer | What it covers | Assurance |
|---|---|---|
| **Mechanical** | The run executed on a provider-hosted runner | Provider-issued OIDC claim, cryptographically verifiable |
| **Review control** | Where backstops run cannot be changed without human review | Prevented at merge, not at runtime |
| **Detected-only** | Implementation homogeneity; enforcement-host registration | Recorded and reviewed; no runtime proof claimed |

**The definition also moves out of D8's cell.** Four reviewers noted D8 was becoming a
paragraph carrying five rule families, and that a second "fails closed" inside it made D21's
"inherits the D8 outage posture unchanged" ambiguous. D8 keeps its sentence and cites a new
**§4.2**, where the definition lives in full.

**Trade accepted, explicitly.** The mechanical layer can only be satisfied by a
provider-hosted runner. A self-hosted runner on a separate machine may be genuinely
independent, but no provider claim can demonstrate it, so it is **not citable for enforcement
promotion**. A2 disclaimed provider dependence; A2-r3 incurs it deliberately and prices it
below.

---

## r3.1 — D8, pointing at the definition

**Target:** §4 Locked decisions table, **D8** row, Decision column.

**Current text (final sentence of the Decision cell):**

> Enforcement cannot be promoted before independent CI backstops are green.

**Proposed replacement (that sentence only; the rest of the D8 cell is unchanged):**

> Enforcement cannot be promoted before independent CI backstops are green, where
> *independent* is defined in §4.2. §4.2's citability rules are separate from this
> decision's outage posture and do not modify it.

**Rationale.** D8 already carries shadow-mode rules, a fail-closed rule for governed
mutations, a degraded-mode rule, and the promotion gate. Adding a multi-clause definition
plus a second, unrelated "fails closed" made D21's cross-reference to "the D8 outage posture"
ambiguous — a §11 stop condition. The definition belongs beside the decision, not inside it.

---

## r3.2 — New §4.2, the definition

**Target:** §4. Insert a new subsection after §4.1 and before `## 5. First-release architecture`.

**Proposed text:**

> ### 4.2 Backstop independence
>
> This subsection defines *independent* as D8 applies it to the CI backstops produced by
> FK-P18, **and nowhere else in this charter**. It does not reach §2's or §5's use of
> "independent" for enforcement layers, which are architectural claims about layer
> separation, not requirements on execution context.
>
> An **enforcement-evidence host** is any machine registered in the evidence manifest as one
> on which FK-P17, FK-P19, or FK-P21 evidence for this goal has been, is being, or will be
> produced. Registration is durable: a machine that is registered remains so for the life of
> the goal, and a machine may not be de-registered to make a past backstop run citable.
>
> A CI backstop run is **citable for enforcement promotion if and only if** all three of the
> following hold.
>
> **(a) Mechanical — provider-hosted execution.** The run carries the CI provider's own
> identity-token claim attesting that it executed on provider-hosted infrastructure, and that
> token verifies against the provider's published keys. On GitHub Actions this is the OIDC
> `runner_environment` claim with the value `github-hosted`; the value `self-hosted` does not
> satisfy this clause on this provider. A claim written by the workflow definition, by the
> parcel, or by any repository content does not satisfy this clause. Another provider may be
> used only where it issues an equivalent claim, named and valued by amendment before use.
>
> **(b) Review control — the runner target is human-gated.** The files that determine where
> backstop runs execute are covered by a required-review control naming a human reviewer, so
> that a change to the runner target cannot merge without human approval. This is a control
> at merge, not a property at runtime; it is not claimed to prevent anything a merged change
> may do.
>
> **(c) Detected-only — recorded, not proven.** FK-P18 records, and review confirms, that the
> backstop's verdict does not derive solely from the compiled artifacts the mediated path
> consumes, and that no enforcement-evidence host appears in the run's execution context.
> These are review obligations with recorded evidence. **No runtime proof is claimed for
> them**, and they are reported as detected-only controls in the final report per §9.
>
> A run that satisfies (a) but whose provider claim is *unavailable* — no identity token
> issued, provider identity service unreachable, or the token not requestable in that run's
> context — is **not citable and is retried; this is not a stop condition.** A run whose claim
> is present and shows non-provider-hosted execution, or whose (b) or (c) obligations are
> unmet, is a violation and fires §11. Citability and violation are distinct outcomes and are
> reported with distinct codes.

**Rationale.** Every clause states its own assurance level, which is the charter's existing
posture (D7, D13) rather than a new one. (a) names an artifact that exists, its issuer, its
value space, and the value that fails — so it cannot be satisfied by a self-written file.
(b) addresses the reconfiguration threat with a control that can actually hold it, instead of
a runtime property no runner satisfies. (c) is labeled detected-only rather than dressed as
proof. The unavailable/violation split answers D17, which forbids conflating process failure
with deliberate refusal.

---

## r3.3 — FK-P18 scope

**Target:** §6, Wave 4 parcel table, FK-P18 row, Outcome column.

**Current text:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote. Owns only its named workflow/CI integration points.

**Proposed replacement:**

> Mirrors exact-scope, enrollment, state/evidence, and dirty-reviewer invariants in CI;
> negative control intentionally bypasses the hook and must fail CI before enforcement can
> promote; defines the §4.2 citability record's schema and emits it per run, requests the
> provider identity token its workflows need, establishes the §4.2(b) review control over the
> workflow files it creates, and records the §4.2(c) obligations. Lands its backstops in new
> workflow files it owns and edits no pre-existing root workflow file. Owns only its named
> workflow/CI integration points.

**Rationale.** The record's schema had no owning parcel across A2-r2's three consumers,
which would have fired §11's out-of-scope-file condition on FK-P19's dispatch. Assigning
definition and emission to the parcel that produces the runs keeps the whole obligation
inside FK-P18's Allowed Files. Requesting the identity token is called out because the
repository's existing workflow declares no `permissions:` block at all, so the token cannot
be minted today.

---

## r3.4 — FK-P19 promotion gate

**Target:** §6, Wave 4 parcel table, FK-P19 row, Outcome column.

**Current text:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass; implements degraded read-only
> mode and fail-closed governed mutation.

**Proposed replacement:**

> Promotes only the five mediated classes whose negative controls, corpus sweeps,
> authorization-engine vectors, and FK-P18 CI backstops pass on runs citable under §4.2, and
> records at promotion time the run identifier and record digest of each cited run.
> Implements degraded read-only mode and fail-closed governed mutation.

**Rationale.** Both rounds found the audit landing two parcels after the promotion it gated.
Requiring FK-P19 to record the citation *at promotion time* closes the retrospective-selection
gap that survived r2 — FK-P21 can then bind what was actually cited rather than selecting a
run later.

---

## r3.5 — Evidence manifest

**Target:** §6, Wave 4 parcel table, FK-P21 row, Outcome column.

**Current text:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, corpus inventory/count,
> reviewer-session identities, commands/results, and named mutation controls.

**Proposed replacement:**

> Produces the committed evidence manifest binding source SHA, stateless/stateful image
> digests, tool/schema/policy digests, host/harness versions, the registered
> enforcement-evidence hosts, the §4.2 citability record of each backstop run FK-P19 recorded
> at promotion, corpus inventory/count, reviewer-session identities, commands/results, and
> named mutation controls.

---

## r3.6 — Goal exit criterion, item 6

**Target:** §9, item 6.

**Current text:**

> 6. CI backstops are green before enforcement promotion and catch an intentionally
>    introduced out-of-scope mutation plus missing enrollment that bypass the hook.

**Proposed replacement:**

> 6. CI backstops are green before enforcement promotion on runs citable under §4.2, and
>    catch an intentionally introduced out-of-scope mutation plus missing enrollment that
>    bypass the hook.

---

## r3.7 — Goal exit criterion, item 8

**Target:** §9, item 8.

**Current text:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, corpus inventory/count, reviewer-session distinction, commands,
>    results, and named mutation controls.

**Proposed replacement:**

> 8. A committed evidence manifest binds source SHA, image/tool/schema/policy digests,
>    host/harness versions, registered enforcement-evidence hosts, the §4.2 citability record
>    of each cited backstop run, corpus inventory/count, reviewer-session distinction,
>    commands, results, and named mutation controls.

---

## r3.8 — Wave 4 exit

**Target:** §6, Wave 4 exit paragraph.

**Current text:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI was
> green before enforcement promotion; service outages have bounded recovery; and host
> claims plus all proof identities are bound in the evidence manifest.

**Proposed replacement:**

> **Wave 4 exit:** selected mediated violations are mechanically refused on the proven
> host; non-enrollment and unmediated changes are detected by heartbeat/diff/CI; CI
> backstops were green before enforcement promotion on runs citable under §4.2; service
> outages have bounded recovery; and host claims plus all proof identities are bound in the
> evidence manifest.

**Rationale.** r2 wrote "CI" unqualified here while writing "CI backstops" in §9 item 6 —
which would have required every CI run in the repository, including a workflow FK-P18 is
forbidden to touch, to be citable. One word, and the two enumerations now match.

---

## r3.9 — New integration scenario 15

**Target:** §8 Integration scenarios. Append after scenario 14.

**Proposed text:**

> 15. **Backstop independence:** a run cited for enforcement promotion satisfies every clause
>     of §4.2 — the provider identity claim verifies and shows provider-hosted execution, the
>     review control over the runner-target files is in place, and the detected-only
>     obligations are recorded; a run whose claim shows non-provider-hosted execution is not
>     citable and is reported as a violation, while a run whose claim is merely unavailable is
>     not citable and is retried without firing a stop condition; FK-P19's recorded citation
>     and the registered enforcement-evidence hosts appear in the evidence manifest.

**Rationale.** The scenario cites §4.2 by reference rather than paraphrasing its clauses.
r2's scenario silently dropped one of three criteria — the one aimed at the threat model —
which is the drift a restatement invites and a reference forecloses.

---

## r3.10 — Gate 1 decision list, item 3

**Target:** §13, item 3.

**Current text:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, and shadow-first enforcement (D7–D8, D20);

**Proposed replacement:**

> 3. portable MCP with the bounded D20 platform matrix, host-specific adapters,
>    enrollment detection, shadow-first enforcement, and §4.2's layered definition of
>    backstop independence with its accepted provider dependence (D7–D8, §4.2, D20);

---

## r3.11 — Gate 1 decision list, scenario count

**Target:** §13, item 9.

**Current text:**

> 9. the explicit out-of-scope list and fourteen integration scenarios;

**Proposed replacement:**

> 9. the explicit out-of-scope list and fifteen integration scenarios;

---

## r3.12 — New stop condition

**Target:** §11 Stop conditions. Insert before the final "queue is empty" condition.

**Proposed text:**

> - a run cited for enforcement promotion is shown by its provider claim to have executed on
>   non-provider-hosted infrastructure, or its §4.2(b) or §4.2(c) obligations are unmet;

**Rationale.** Scoped to violations. An unavailable provider claim is explicitly *not* a stop
condition — r2 would have halted the goal on a GitHub identity-service outage, conflating
process failure with deliberate refusal in a charter whose D17 forbids exactly that.

---

## r3.13 — §12 serialization points

**Target:** §12, the sentence assigning FK-P18's ownership.

**Current text:**

> FK-P18 owns its exact CI files;

**Proposed replacement:**

> FK-P18 owns the new workflow files it creates for its backstops and the review control over
> them, and edits no pre-existing root workflow file;

**Rationale.** New files under `.github/workflows/` are root workflow files and therefore
§12 serialization points. r2 recorded its exclusion in a §6 parcel cell; §12 is the register,
and the next coordinator reconciling `plugin-packaging-and-scaffolder` reads §12.

---

## r3.14 — Ratification ledger row

**Target:** §4.1 Ratification ledger. Append a row. **Blocked on the A1.8 precondition above.**

**Proposed text:**

> | \<ratification date\> | Amendment A2-r3 — backstop independence defined in §4.2 | D8 citation; new §4.2; FK-P18, FK-P19, FK-P21 scope; §9 exit items 6 and 8; Wave 4 exit; integration scenario 15; §13 items 3 and 9; §11 stop condition; §12 ownership | `proposed-amendment-A2-r3-backstop-independence.md`, ratification record at foot |

---

## What this amendment deliberately does not do

- **Adds no locked decision.** D22 remains retired and unclaimed. D8 gains a citation; the
  definition lives in §4.2.
- Adds no refusal class, no tool, no authority, no parcel; changes no dependency edge and no
  human gate.
- **Does not govern FK-P17 or FK-P19 enforcement evidence.** D20 requires that work on the
  Windows 11 + Docker Desktop platform, and a self-hosted runner there remains permitted and
  necessary for it. §4.2 says this in binding text, not commentary — r2 put the equivalent
  limit only in prose and its binding reach clause said the opposite.
- **Does not reach §2 or §5.** §4.2 states its own boundary. §5's sentence sits inside the
  architecture code fence and is an architectural claim, not an execution-context requirement.
- Says nothing about latency or performance in CI. A1.3's unlanded limitation remains A1's
  to close via A1.9, scoped to the CI-gate half — §4.2 carries no D20-widening guard, so
  A1.9 should carry A1.3's in A1's own words.
- **Claims no runtime proof for §4.2(b) or §4.2(c)**, and says so where a reader will find it.

## Cost, including what this draft newly incurs

- **The compliant option is a provider-hosted runner.** `.github/workflows/test-plugin-install.yml`
  already uses `ubuntu-latest` on all three jobs, and ADR-001's Tier 1 says Tier 0 plus Tier 1
  cost "approximately nothing" on the existing workflow allocation. FK-P18's backstops are new
  files, so this is new usage against that allocation, not free-by-existing.
- **Newly incurred: provider dependence.** §4.2(a) can only be satisfied where the provider
  issues a verifiable hosted-execution claim. A2 disclaimed this; A2-r3 accepts it as the
  price of a clause that means something. Moving providers requires an amendment naming the
  equivalent claim.
- **Newly foreclosed: self-hosted backstops.** A separate machine may be genuinely
  independent, but no provider claim demonstrates it, so it is not citable. ADR-001's
  Alternatives contemplate only the developer's own machine or an Azure VM; a spare box is not
  an option that document costed, and it is not one §4.2(a) can certify.
- **Unchanged: FK-P17's Windows evidence.** D20 requires it on the enforcement platform; §4.2
  does not reach it. A2's headline $140/month was for that work and does not apply. (ADR-001's
  $140 appears in its *Alternatives* section and Revisit trigger 2, not in "Tier 2", which
  carries no costing.)
- **Operational:** the workflow must request an identity token; fork-PR and provider-outage
  runs yield no claim and are retried rather than halting the goal.

## Ratification

Ratifying this amendment binds the r3.1–r3.14 replacement text, including the §4.2 subsection
and the §4.1 ledger row that puts it in force. **Ratification cannot be discharged until A1.8
is reviewed and carries its own ledger row** (Status, above).

Rejecting it leaves D8's "independent" undefined and the backstop-voiding configuration
available. If rejected, the honest disposition is a lessons-ledger entry recording the known
unowned risk.

**Ratification record:** _(unratified — awaiting explicit developer approval)_
