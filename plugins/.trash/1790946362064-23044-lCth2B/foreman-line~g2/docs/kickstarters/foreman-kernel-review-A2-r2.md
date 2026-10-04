Adversarial Review — proposed charter amendment A2-r2 (foreman-kernel goal)

You are an adversarial reviewer for a PROPOSED, UNRATIFIED charter amendment. You did not
write it and you owe its author nothing. Fresh session: your only context is this directive,
the artifacts it names for your role, and repo canon. Do not read prior coordinator sessions.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
Reviewer rules #8 (hostile-input probing licensed), #9 (prose-only contracts: attempt the
naive reading), and #11 (prove each assertion binds to its named invariant) are directly in
scope. A2-r2 is a prose contract that amends a locked decision.

## Step 0 — restate and stop

Restate what A2-r2 proposes, which charter targets it edits, and what you are NOT authorized
to do. Then proceed.

## Envelope

READ-ONLY. Create, edit, move, delete, and commit nothing. Read via
`mcp__remote-devices__device_bash` with read commands only (cat, sed -n, grep, ls, wc,
sha256sum). Run NO git command — `git status` writes a lock file in this environment.
End your review confirming you mutated nothing.

## Base state

Root: `$HOME/mnt/agent-skills-worktrees/foreman-kernel-stage0-20260830`

A2-r2 anchors on quoted text + section heading + this digest:
`charter.md` sha256 `c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, 435 lines.
**Verify the digest first.** If it differs, say so and review against actual content.

The charter carries uncommitted amendments A1 (ratified, transcribed) and A1.8 (applied,
text unreviewed). Both are in the working tree. Flag any interaction A2-r2 has with them.

## Inputs — all roles

- `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A2-r2-backstop-independence.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/charter.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/ADR-001-runtime-infrastructure-posture.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/proposed-amendment-A1-decision-path-latency-budget.md`
- `plugins/foreman-line/docs/goals/foreman-kernel/amendment-A1.8-ratification-ledger.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `.github/workflows/test-plugin-install.yml` (under `$HOME/mnt/agent-skills`)

## Mandate — all roles

1. Does A2-r2 close the defect it claims to close, or only appear to?
2. Is D8's amended definition mechanically checkable, or does it rest on judgment at a
   moment nobody is looking?
3. Which charter target did A2-r2 fail to enumerate?
4. Where does A2-r2 collide with A1, A1.8, D13, D20, §12 serialization points, or the
   FK-P17/FK-P19 evidence path?
5. Is the amendment's stated cost honest and complete?

## Mandated focus questions — dedicated assessment each, not generic linting

**(a) Naive reading of the amended D8 definition.** Criteria (i)-(iii) plus the "whatever it
is called" sentence are meant to exclude a container on the enforcement machine, a VM on it,
a second machine running the same adapter build, a differently-named runner, and a copied
worktree. Construct the compliant-but-defeating configuration the text still permits. If you
find none, say which specific clause blocks each attempt.

**(b) Does amending D8 rather than adding a decision actually work?** D8's cell now carries
shadow-mode rules, fail-closed rules, degraded-mode rules, a promotion gate, AND a
multi-clause definition of independence. Assess whether one decision cell carrying this much
is a contract or a paragraph. Does anything in D8's existing text now contradict, or get
contradicted by, the appended definition? Does "wherever this charter applies it to CI
backstops" actually reach §5's "CI and source-control rules remain independent backstops"?

**(c) Is the run-time attestation real?** A2-r2 requires each backstop run to carry a
provider-issued attestation and fail closed without one. Determine whether that is
implementable in the repo's actual CI provider, whether "provider-issued" is defined tightly
enough to exclude a value the workflow author controls, and what happens when the provider
offers no such attestation. Is there a path where a run fails closed for an unrelated reason
and is indistinguishable from an independence failure?

**(d) Scope boundary between FK-P18 and FK-P17/FK-P19.** A2-r2 states the definition reaches
FK-P18's backstops only and that D20 requires FK-P17/FK-P19 evidence on the enforcement
machine. Test that boundary for leaks in both directions: can work migrate across it to
escape the definition, and does the FK-P19 gate amendment accidentally reach evidence the
definition does not govern?

**(e) Is the cost section honest and complete now?** Verify every claim against ADR-001 and
the actual workflow file. A prior draft mis-cited a figure; check whether this one repeats
any error or introduces new ones.

## Output

Findings ranked most-severe first. Each: severity (BLOCKER / SHOULD-FIX / INFORMATIONAL),
the exact text at fault, a concrete failure scenario, and a proposed minimal fix. Then a
verdict: APPROVE / APPROVE WITH CHANGES / REQUEST CHANGES.

Rank; do not decide. If you believe A2-r2 should be rejected outright, say so and why — that
is a ranking, not a decision. If it is sound, name which parts survived your strongest attack.
