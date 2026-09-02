Adversarial Review — proposed charter amendment A2 (foreman-kernel goal)

You are an adversarial reviewer for a PROPOSED, UNRATIFIED charter amendment. You did not
write it and you owe its author nothing. Fresh session: your only context is this directive,
the named artifacts, and repo canon. Do not read prior coordinator sessions or transcripts.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
Reviewer rules #8 (hostile-input probing licensed), #9 (prose-only contracts: attempt the
naive reading), and #11 (prove each assertion binds to its named invariant) are directly in
scope: A2 is a prose contract.

## Step 0 — restate and stop

Before reviewing, restate: what A2 proposes, which charter targets it edits, and what you
are NOT authorized to do. Then proceed.

## Envelope

READ-ONLY. You must not create, edit, move, or delete any file, and must not commit. Read
the repository through `mcp__remote-devices__device_bash` using only read commands (cat,
sed -n, grep, ls). Running a read command that writes is a review failure. End your review
by confirming you mutated nothing.

## Inputs — read all in full

Root: `$HOME/mnt/agent-skills-worktrees/foreman-kernel-stage0-20260830`

- The amendment under review:
  `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A2-ci-backstop-host-independence.md`
- The charter it edits (NOTE: contains uncommitted A1/A1.8 edits — review against the
  working-tree state, and flag any interaction A2 has with them):
  `plugins/foreman-line/docs/goals/foreman-kernel/charter.md`
- The reasoning A2 derives from:
  `plugins/foreman-line/docs/goals/foreman-kernel/ADR-001-runtime-infrastructure-posture.md`
- The already-ratified sibling amendment (A2 claims non-conflict with it — verify):
  `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A1-decision-path-latency-budget.md`
- Repo canon:
  `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
  `plugins/foreman-line/docs/SPEC-CONVENTION.md`
  `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- Existing CI surface A2 constrains:
  `.github/workflows/test-plugin-install.yml` (in `$HOME/mnt/agent-skills`)

## Mandate

1. Does A2 close the defect it claims to close, or only appear to?
2. Is D22's rule mechanically checkable, or does it rely on a reviewer's judgment at a
   moment nobody is looking?
3. Which charter target did A2 fail to enumerate? (A1 missed three; assume A2 missed some.)
4. Where does A2 collide with A1, D13, D20, §12 serialization points, or FK-P19's promotion
   gate?
5. Is the amendment's stated cost honest and complete?

## Mandated focus questions — dedicated field-by-field assessment, not generic linting

**(a) Attempt the naive reading of D22.** D22 forbids a runner sharing the enforcement
host's "hook adapter, agent session, or working filesystem." Construct the wrong-but-literal
reading a motivated engineer could use to comply while defeating the intent — a container on
the enforcement host, a VM on it, a runner with a distinct filesystem but the same physical
machine and Docker daemon, a cloud runner that checks out the same worktree over a share.
Does the text exclude these, or merely disapprove of them? If it does not exclude them,
supply the narrowest text that would.

**(b) Is D22 verifiable at the moment it matters?** FK-P19 promotes enforcement only after
FK-P18's backstops are green. If someone moves the runner AFTER promotion, what detects it?
A2 binds "CI host class" into FK-P21's manifest, but a manifest is produced once. Determine
whether A2 creates a point-in-time attestation being sold as a standing property, and if so
whether that is a defect or an acceptable documented limit.

**(c) Does "host class" mean anything?** A2 requires the manifest bind "the CI host class
used." Is that term defined anywhere in the charter, A2, or repo canon? If undefined, does
binding it produce evidence or a label? Rule on whether the term needs a definition, an
enum, or replacement with something machine-derivable.

**(d) Interaction with A1's latency exemption.** A2 exempts performance assertions from
independence and calls them advisory, restating A1.3. Two amendments now state the same rule
in different words. Is there any reading under which they diverge? Is the restatement a
safeguard or a future drift source?

**(e) Is the cost section complete?** A2 claims the foreclosed option is a Windows runner
with nested virtualization at ~$140/month. Check that against ADR-001's Tier 2 costing and
against D20's platform claim. Is there a cheaper compliant option A2 failed to consider —
and does foreclosing the free option create pressure to weaken D20 instead?

## Output

Findings ranked most-severe first. Each: severity (BLOCKER / SHOULD-FIX / INFORMATIONAL),
the exact text at fault, the failure scenario in concrete terms, and a proposed minimal fix.
Then a verdict: APPROVE / APPROVE WITH CHANGES / REQUEST CHANGES.

Rank; do not decide. The coordinator triages and the developer rules. If you believe A2
should be rejected outright, say so and say why — that is a ranking, not a decision.
