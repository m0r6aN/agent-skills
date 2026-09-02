Adversarial Review — proposed charter amendment A2-r3 (foreman-kernel goal)

You are an adversarial reviewer for a PROPOSED, UNRATIFIED charter amendment. You did not
write it and you owe its author nothing. Fresh session. Do not read prior coordinator sessions.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
Reviewer rules #8 (hostile-input probing licensed), #9 (prose contracts: attempt the naive
reading), and #11 (prove each assertion binds to its named invariant) are directly in scope.

## Context you must hold

This is the THIRD draft. A2 was withdrawn and A2-r2 superseded, both after two independent
reviews each. Both died the same way: they mandated evidence whose artifact could not carry
the claim, then described it as proof. The author's stated fix is to split the property into
three layers — mechanical, review control, detected-only — and label each by what it actually
delivers.

**Your highest-value question is whether that split is honest or cosmetic.** Specifically:
is "detected-only" being used as a place to park obligations that the amendment needs to be
mechanical, so the draft can claim a property it still cannot enforce? A third rename of the
same defect is the outcome to hunt for.

## Step 0 — restate and stop

Restate what A2-r3 proposes, its targets, and what you are NOT authorized to do. Then proceed.

## Envelope

READ-ONLY on the repository. Create, edit, move, delete and commit nothing. Read via
`mcp__remote-devices__device_bash` with read commands only. Run NO git command — `git status`
writes a lock file here. Confirm at the end that you mutated nothing.

## Base state

Root: `$HOME/mnt/agent-skills-worktrees/foreman-kernel-stage0-20260830`
`charter.md` sha256 `c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, 435 lines.
Verify the digest first. The charter carries uncommitted A1 (ratified) and A1.8 (unreviewed).

## Inputs

- `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A2-r3-backstop-independence.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/charter.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/ADR-001-runtime-infrastructure-posture.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A1-decision-path-latency-budget.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/amendment-A1.8-ratification-ledger.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `SPEC-CONVENTION.md`, `kickstarters/STANDING-CONSTRAINTS.md`
- `.github/workflows/test-plugin-install.yml` (under `$HOME/mnt/agent-skills`)

## Mandate

1. Does A2-r3 close the defect, or is the layering a third rename?
2. Is §4.2(a) genuinely mechanical — an artifact that exists, that the governed party cannot
   forge, checked by someone who is not the governed party?
3. Is anything in §4.2(c) load-bearing enough that calling it detected-only understates the
   claim the rest of the amendment makes?
4. Which charter target did A2-r3 fail to enumerate?
5. Where does it collide with A1, A1.8, D13, D17, D20, D21, §12, or the FK-P17/FK-P19 path?
6. Is the cost section honest and complete?

## Mandated focus questions

**(a) Naive reading of §4.2.** It is now a biconditional over three clauses plus a durable
host-registration definition. Construct the compliant-but-defeating configuration. Pay
attention to who registers enforcement-evidence hosts and when, and to what "the files that
determine where backstop runs execute" actually enumerates.

**(b) The unavailable/violation split.** A missing provider claim is non-citable and retried;
a present claim showing non-hosted execution is a violation. Can a party who wants to avoid a
violation arrange for the claim to be *unavailable* instead? Is the split gameable, and does
it create a path where the goal never exits because runs are perpetually retried?

**(c) Does the review control bind?** §4.2(b) requires "a required-review control naming a
human reviewer" over "the files that determine where backstop runs execute". Assess whether
that set is enumerable, whether the control is verifiable from the repository, and whether a
governed builder inside FK-P18's Allowed Files can weaken or remove it.

**(d) §4.2(c) as a hiding place.** Implementation homogeneity — the backstop importing the
same compiled artifacts the mediated path uses — was found in round 2 to be promised in
reasoning and absent from the contract. A2-r3 moves it into a detected-only review
obligation. Is that honest labeling or a demotion that lets the amendment keep claiming a
property it never enforces? Rule on it.

**(e) Cost and provider dependence.** A2-r3 accepts provider lock-in deliberately. Verify
every cost claim against ADR-001 and the workflow file, and assess whether the accepted
trade is priced completely.

## Output

Findings ranked most-severe first: severity (BLOCKER / SHOULD-FIX / INFORMATIONAL), exact
text at fault, concrete failure scenario, minimal fix. Then APPROVE / APPROVE WITH CHANGES /
REQUEST CHANGES. Rank; do not decide. Name what survived your strongest attack.
