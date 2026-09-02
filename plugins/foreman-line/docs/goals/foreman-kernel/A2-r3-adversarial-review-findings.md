# Adversarial Review Findings — Amendment A2-r3 (Round 3)

**Date:** 2026-09-01
**Reviews dispatched:** two.
- **Reviewer F — regression + external fact-check.** Completed. 5 BLOCKER, 4 SHOULD-FIX,
  2 INFORMATIONAL. Verdict **REQUEST CHANGES**.
- **Reviewer E — blind.** **Did not complete** (API connection lost mid-run). No findings
  recovered. Round 3 therefore carries **one** review, not the two lesson #12 requires for
  architecture/risk work. Recorded as a known gap in this round's evidence.

## The result that changes the picture

**§4.2(a)'s artifact is real.** For the first time in three drafts, the external claim the
mechanism rests on was verified against primary sources rather than asserted from model
knowledge — a gap that had survived three drafts and four reviewers.

GitHub's OIDC token does carry a `runner_environment` claim; its documented value space is
exactly `github-hosted | self-hosted`; it is minted server-side by GitHub and signed with
GitHub's keys; claim customization via the REST API reaches only the `sub` claim, so the
workflow cannot influence it; and obtaining it requires `id-token: write`.

**This ends the failure mode that killed A2 and A2-r2.** Both mandated evidence whose artifact
did not exist. This one does, and it genuinely closes the original threat: a self-hosted
runner on the enforcement laptop returns `self-hosted`, and the container-on-the-enforcement-
host and VM-on-the-enforcement-host escapes are excluded by construction.

## Coordinator verification

Seven of F's checkable claims tested on disk. **All seven true.**

| # | Claim | Verified |
|---|---|---|
| 1 | No CODEOWNERS file exists in either tree | TRUE — `find` returns nothing |
| 2 | "Tier 0 plus Tier 1 costs approximately nothing" is in ADR §Consequences → "Cost is dominated by model spend", **not** Tier 1 | TRUE — ADR line 269 |
| 3 | r3 mis-cites it as "ADR-001's Tier 1 says" | TRUE — r3 line 395 |
| 4 | The existing workflow declares `on: pull_request` and no `permissions:` block | TRUE — lines 3-6; no permissions key |
| 5 | r2 bound the D20-non-widening guard; **r3 contains it zero times** | TRUE — r2: 1 occurrence, r3: 0 |
| 6 | r3 weakens homogeneity with "solely" | TRUE — r3 line 124 |
| 7 | r3 does not amend D13 | TRUE — D13 appears twice, in prose only; no clause targets it |

## Blocking findings

**B1 — §4.2(b) is round 1's killed defect, restored.** Round 1 killed A2's "FK-P18 *enforces*
the property" because runner registration is provider-side, outside any repository path, so
the obligation could not be discharged inside Allowed Files. **A required-review control is
also provider-side** — CODEOWNERS is a file, but *required* review is branch-protection state
in GitHub settings, and no CODEOWNERS exists anywhere today. Three compounding failures: the
file set is not enumerable (`runs-on: ${{ vars.BACKSTOP_RUNNER }}` moves the runner target to
a variables page; a reusable workflow moves it to another repository); the control is not
verifiable from the repository; and **r3.13 gives FK-P18 ownership of its own guard**, with a
sole developer who is also the repo admin who bypasses branch protection. Self-approval with
extra steps.

**B2 — the unavailable/violation split is a one-line opt-out that never terminates.** Deleting
`permissions: id-token: write` — from a file the governed party owns — makes the claim "not
requestable in that run's context," which r3 classes as *unavailable → retried, not a stop
condition*. The incentive gradient runs backwards: requesting the token honestly on a
self-hosted runner yields `self-hosted` → violation → §11; suppressing it yields infinite
retry. Retries are unbounded, so §9 item 6 can never be satisfied and §11 never fires — **the
goal hangs silently.** r2 deadlocked by making everything a violation; r3 deadlocks through
the opposite door. Fork PRs compound it: `id-token` has no read state and fork-PR write
permissions are downgraded to read, so fork runs are **permanently** unavailable, filed under
the same label as a transient outage — the D17 conflation r3.12's own rationale claims to
prevent.

**B3 — §4.2(c)'s host predicate is vacuous when evaluated.** An enforcement-evidence host is
defined as one *registered in the evidence manifest*. The manifest is FK-P21's, and FK-P21
depends on FK-P19 and FK-P20. Citability is evaluated by **FK-P19, at promotion — when the
manifest does not yet exist and the registry is empty.** "No enforcement-evidence host appears
in the run's execution context" is vacuously true for every run, always. The durability rule
forbids *de*-registration but says nothing about never registering or registering late. This
is round 1's C3 (audit lands after the act it audits) resurfacing in a new location: r3.4
fixed the citation-selection half and left the host-registration half.

**B4 — §4.2(c) is a hiding place, and the demotion came with an undisclosed weakening.** r2's
reasoning said "both the instances and the implementation must differ." r3 moved that to a
detected-only obligation (disclosed) **and diluted it to "does not derive *solely* from"**
(not disclosed). A backstop importing `authorizeAction` and the compiled-scope packages —
inheriting every blind spot — plus one trivial independent check satisfies (c) literally.
STANDING-CONSTRAINTS #12 forbids exactly this shape: parcel-time discipline dies with the
parcel; permanent protection pins the invariant. And (c) cannot be both: §4.2 is a
biconditional and §4.2's violation clause fires §11 when (c) is unmet, so **(c) carries a stop
condition's authority and a footnote's accountability.** Either gate on it at matching
assurance, or remove it from the biconditional and report it as an observation.

**B5 — D13 is the missed charter target.** D13 independently gates promotion: "CI lands before
enforcement promotion." r3 amends D8 correctly and leaves D13's sentence standing as an
unqualified escape hatch. Both are tier 2 and §3 has no intra-tier rule — the ambiguity round
1's C5 warned about, in mirror image. Secondary misses: §12's serialization-point enumeration,
§9 item 9's control-category list (§4.2(b), a merge-time review control, fits none of its six
categories), and a terminology collision — §5 already defines "detected-only controls" as
detected by enrollment heartbeat and CI, not by human review.

## Regressions introduced by this draft

- **The D20-non-widening guard was deleted.** Round 1 flagged it as unbound commentary; r2
  fixed it by binding it in D8's text; **r3 removed it entirely**, and disclosed the removal
  only inside a bullet about latency. Meanwhile r3 *raises* the pressure that guard held, by
  foreclosing self-hosted backstops so that free Linux-hosted runs become the only citable
  evidence. A reviewer-fixed defect silently reintroduced.
- **A fresh mis-citation, in the bullet list that corrects one.** r3 attributes "approximately
  nothing" to ADR-001's Tier 1; it is in Consequences. Three bullets later r3 correctly scolds
  A2 for mis-attributing the $140 figure.

## Defects in (a) that are drafting, not physics

- **No external verifier named.** §4.2(a) says the token "verifies against the provider's
  published keys" without saying who verifies, where, or that the raw JWT is retained. r3.3
  puts emission in FK-P18's own workflows — so on a self-hosted runner the verification runs
  on the machine the threat model is about. The token is unforgeable; **the record saying "I
  checked it" is not.**
- **No run-binding — the token is replayable.** Nothing requires the token's claims to
  correspond to the run being cited. `test-plugin-install.yml` mints `github-hosted` tokens on
  every push; one can be presented as the record of a self-hosted run. The claims needed to
  close this (`run_id`, `run_attempt`, `repository`, `workflow_ref`, `sha`) exist in the same
  token.
- **Manifest copies may be unverifiable later.** Tokens expire in 900 seconds and signing keys
  rotate; the manifest is produced after promotion, with no key pinning or verification
  receipt.

## A better artifact, surfaced by the fact-check

**GitHub Artifact Attestations (Sigstore/Fulcio).** The Fulcio certificate carries OID
`1.3.6.1.4.1.57264.1.11` — "Runner Environment" — signed into the certificate chain and not
modifiable by user-defined build steps, alongside Source Repository URI, Build Trigger, and
Run Invocation URI. Verified out-of-band via `gh attestation verify` against a TUF-managed
root: **no 15-minute expiry, run-bound by construction, verifiable years later** — which is
what a claim bound into a committed evidence manifest actually needs.

**Trap:** the Fulcio OID's values are `platform-hosted` / `self-hosted`, **not**
`github-hosted`. §4.2(a) hardcodes `github-hosted` and requires an equivalent claim be "named
and valued by amendment before use," so switching artifacts on the same provider would need
its own amendment.

**Also available and omitted:** `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs` returns
GitHub-recorded `runner_name`, `runner_group_name`, and `labels`. Queried out-of-band by
someone who is not the run, it supplies precisely the "checked by a party other than the
governed one" property §4.2 lacks, at no cost.

## What survived

- **(a)'s artifact and its threat coverage** — verified real, and it closes the original
  container/VM-on-the-enforcement-host escapes by construction.
- **The instrument, third time confirmed.** Amend D8, define in §4.2. The added sentence
  separating §4.2's citability rules from D8's outage posture is a real, checkable fix to the
  D21 cross-reference ambiguity four reviewers flagged.
- **The three-layer frame.** Labeling each clause by the assurance it delivers is the
  charter's existing D7/D13 posture. The frame is honest; this execution of (b) and (c) is not.
- **r3.4's promotion-time citation record**, **r3.8's "CI" → "CI backstops"**, **r3.9's
  cite-by-reference scenario**, and **r3.3's file-class generalization** — all correct fixes to
  real round-2 findings.
- **Self-declared blockage on A1.8 with no fabricated ledger row.**
- **The A1 mis-citation is gone** — grep-verified absent.
- **The defect itself**, fourth round running. Still real, still unowned.

## Coordinator assessment

Rename count across three drafts, for the homogeneity property: `CI host class` →
`provider-issued attestation of (i)-(iii)` → `detected-only obligation weakened by "solely"`.
Round 2 predicted this exactly. Separately, the *provider-side-obligation* defect was renamed
once — `enforces` → `required-review control` — skipping r2 entirely, which is a regression a
blind reviewer would not catch and only the regression audit found.

The pattern across three drafts: **(a) is now solid and fixable in sentences. (b) and (c) keep
failing because both ask the charter to bind things that live outside the repository** — GitHub
settings, and a property of code the parcel writes. That is not a wording problem, and a fourth
draft that rewrites them in place will meet the same wall.

**Recommendation: do not redraft (b) and (c) in place.** Keep the frame and (a), fix (a)'s
three drafting defects, and settle what (b) and (c) should be as a developer ruling first.

**Round-3 evidence gap:** only one review completed. If the developer's ruling keeps the
current structure, a blind pass should be re-run before ratification. If (b) and (c) are
restructured, the blind pass belongs on r4 rather than on superseded text.
