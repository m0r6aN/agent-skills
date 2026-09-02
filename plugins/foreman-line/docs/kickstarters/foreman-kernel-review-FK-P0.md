# FK-P0 Adversarial Review Kickstarter (this owner's round 1)

## Standing constraints
Apply `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` in full.

## Your role
Fresh adversarial reviewer. You have **zero builder context** and you inherit **zero prior
findings** — the prior coordinator's R2–R13 review record is unrecoverable and is treated as
never having occurred. Review the code as it stands, on its own merits.

**You never fix and never commit.** No Edit, no Write, no git mutation. Report only.
You ARE explicitly licensed for hostile-input probing and read-only mutation experiments in
a scratch copy (never in the review worktree).

## Subject
- **Branch:** `codex/fk-p0-canon-authority-enforcement-registry` at `df8155a`
- **Package:** `plugins/foreman-line/authority-registry/`
- **Spec:** `plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md`
  (15 acceptance criteria; `risk: critical`; `routing_class: architecture/risk`)
- **Charter:** `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` — D1–D21 binding
  per §4.1. Note A1.8 (§4.1 itself) is applied but NOT ratified; do not treat §4.1 as settled
  canon, and say so if anything you find depends on it.

## What FK-P0 claims to be
The contract-first, source-digest-bound registry naming which canon rules are operative, whose
authority they express, where they can honestly be enforced, and which contradictions remain
visible. Contract/docs/validator only — no runtime, no hooks, no Docker, no external calls.

## Mandate — rank by severity, verify before asserting
1. **Authority soundness.** Can any registry mutation manufacture human approval, FK merge
   authority, independent-verifier evidence, closure authority, or generic receipt minting as
   agent-callable control state? AC6 says no. Try to break it.
2. **`resolveAuthority` precedence.** AC5 claims scope-aware fail-closed precedence with
   `CONFLICT` on unlisted/equal-authority contradictions and retired rules never controlling.
   Find the input that selects silently, or that lets a retired rule control.
3. **Overclaim.** AC8/AC9 forbid representing `surfaces:` as mutation authority and forbid
   profile-refusal overclaim on unenrolled/unsupported/CI/wrong-role queries. Is the honesty
   real or asserted?
4. **Do the negative fixtures have teeth?** AC11 claims every named mutation axis makes a
   formerly-green test fail. **Verify by actually mutating each axis in a scratch copy.** This
   is the single highest-value thing you can do — an inert negative test is the lesson #32
   defect class, and this suite has never been independently checked.
5. **Sweep completeness.** AC3 claims zero uncovered items/orphan rules/stale values. Spot-check
   against the real corpus, not against the fixtures.
6. **Retirement gating.** AC10 claims four distinct digest-verified D11 evidence artifacts are
   required before `retired-from-agent-reading`. Try to retire something with fewer.

## A finding the coordinator already has — do not spend your round rediscovering it
The seven `tests/fixtures/reject-*.yaml` are each a full ~39,897-line copy of the registry
differing from `pass-minimal.yaml` by only **2–47 lines**, and `pass-minimal.yaml` is itself a
near-copy of the shipped `authority-enforcement-registry.yaml`. ~279,000 fixture lines encode
~117 lines of intent; the suite takes >25 minutes. **This is already logged.** What the
coordinator wants from you on it: does this shape cause a *correctness* defect (silent fixture
drift, a fixture that no longer tests its named invariant, an assertion passing for the wrong
reason)? Maintainability is noted; correctness consequences are yours to find.

## Deliverable
A findings document: BLOCKER / SHOULD-FIX / INFORMATIONAL, each with file:line, a concrete
failure scenario (inputs → wrong result), and — where you probed — the exact mutation and the
observed before/after. State your verdict: SHIP / SHIP WITH FOLLOW-UPS / REWORK REQUIRED.
Findings rank; the coordinator decides; Gate 3 is the human's.
Report anything you could not check and why. An honest gap beats a confident guess.
