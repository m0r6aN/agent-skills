# FK-P0 rework round 3 — builder kickstarter

## Standing constraints
Apply `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` in full.

## Authority for this round
The two-rework tripwire was the coordinator's own stop condition. **The developer has explicitly
lifted it and authorised this round.** It is narrow by design.

## Subject
- Branch `codex/fk-p0-canon-authority-enforcement-registry`, worktree
  `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`, HEAD `4c53cd8`.
- Package `plugins/foreman-line/authority-registry/`.
- Spec as amended by **R14–R21**. Read `FK-P0-amendment-R19.md` and **`FK-P0-amendment-R21.md`**, then
  `FK-P0-STOP-REPORT-for-developer.md` in `plugins/foreman-line/docs/goals/foreman-kernel/`.

---

## STEP 0 IS DIFFERENT THIS TIME. I am not handing you the rule.

The last two times I wrote a chain-hardening rule and ratified it, it broke on contact with the
artifact:

- **R16** — mine. Two independent reviewers found it admits a tampered registry.
- **R19** — mine. Obligation 4 would have invalidated the shipped registry (**R21** corrected it, after
  *your* Step 0 caught it), and obligation 2 is why this round exists.

Writing a third rule fast, in the same mechanism, immediately after being wrong twice, is not a plan.
**So you propose the design and I ratify what survives verification.**

At Step 0, give me **candidate designs** for the properties below — at least two where you see a real
choice — and for each one, **measured** answers, not predicted ones:

- Does the shipped registry stay valid, with **no regeneration and no pin-table rewrite**?
- Does it refuse both attack routes?
- Does it **admit** the legitimate append path?
- What does it cost the four `rechain()` call sites and the AC4 test block?

Then stop. I will verify your measurements myself and ratify **R22** with exact text, committed alone,
before you write implementation code.

---

## The problem, stated as properties rather than mechanism

**P1 — Deleting the shipped chain head must invalidate the document.**
Today it does not. Reproduced by me at `4c53cd8`:

```
delete registry-rework-df8155a
insert a structural copy under a FRESH id (therefore absent from the pin table)
re-anchor its superseding digest to the live/tampered manifest
    no payload                              -> valid:true, 0 violations
    + 7 gate3.merge-authority rules retired -> valid:true, 0 violations
       resolveAuthority(gate3.merge-authority) -> REQUIRE_HUMAN / NO_APPLICABLE_AUTHORITY
       reconciliations: 18; 'registry-rework-df8155a' present: false
```

R19 obligation 2 keyed the guard on the **promoted** record's pin membership. The attacker does not
promote anything — it **substitutes**. The departing head's absence is what nothing checks.

**P2 — A properly chained new head must be ADMITTED.**
Today it is refused: once demoted, the old head needs a `RECONCILIATION_RECORD_DIGESTS` entry it does
not have. Reviewer A isolated it — inject the head's canonical digest into the pin table and append
works but the pristine registry becomes invalid; leave it out and the registry is valid but append is
refused. **There is no pin-table state where both hold.**

P1 and P2 are the same defect seen from opposite ends and **must land together**. Fixing P1 alone by
requiring the head to exist forever would make the chain unextendable; fixing P2 alone re-opens P1.

**P3 — Three shipped claims must become true again**, or be rewritten to the truth:
`verifyMigrationChain`'s docstring, `README.md:162-163`, and the ratified residual at
`README.md:190-192` — all currently promise that appending a properly chained record is admitted.
The residual must return to **append-only and history-preserving**. Right now the cheapest passing
route is the one that *erases* the R14 attestation, which is the opposite of R19's intent and defeats
the human-review-of-git-history backstop the residual leans on.

**P4 — Obligation 3 must bind the two chain commands, not any command.**
`src/validate.ts:946-958` uses `.some()` over every `command-result` on the record, so a decoy entry
satisfies the coordinator/tool/exit-0 check while the real chain commands carry
`actorClass: 'anonymous'`. Verified by me:

```
CONTROL  2 chain commands gutted (anonymous, exit 137, tool 'attacker')  -> MIGRATION_EVIDENCE_INVALID
N1       same + 1 coordinator decoy appended                             -> valid:true, 0 violations
FREE?    chain commands already tool+coordinator+exitCode0: 24 of 24
```

Free against shipped data. Reviewer B rates it SHOULD-FIX and notes the implementation is faithful to
R19's wording — so this is a spec-wording narrowing as much as a code change.

**P5 — The stated `git-commit` residual must match the real one.**
Reviewer A found four further head-only edits that are accepted while the README says they are not:
repointing or deleting the *unbound* second git-commit, adding a fabricated one, and duplicating the
bound reference with a varied digest (obligation 5's identity triple includes the digest, so varying
one field defeats it). A also built a head whose entire Git provenance is fabricated, with the prior
command's `inputDigest` set to `sha256(fabricated-reference)` — accepted, because the attacker controls
both sides.

**Decide and tell me which:** narrow the residual statement to the truth, or narrow the code so the
statement becomes true. In this parcel a stated limit narrower than the real one is a defect in the
deliverable, so "document it" is a legitimate answer only if the documentation is then exactly right.

---

## P6 — The tests must cover the input space, not the fixture space

This is Reviewer A's sharpest finding and it applies to whatever you write next. The AC4 chain-head
block (tests 407-420) is well built — test 407 is an explicit "the shipped registry is valid, so each
refusal below is caused by its mutation" guard, and every mutation test carries a no-op assertion. But
its O2 coverage is **the promoted-pinned-record route only**. Nothing covers head
deletion-and-substitution, nothing covers the append path, nothing covers three of the four residual
shapes.

**All four findings reproduce against a 563/563 green suite.** Tests written alongside a fix are the
weakest evidence that the fix is complete, because they are written by whoever decided what the fix
was. So: for each property above, write the test **from the attack**, not from the remedy — and state
plainly in your report which attacks you did *not* write a test for.

---

## Allowed Files
The package `plugins/foreman-line/authority-registry/` — permission ceiling, not a manifest (R18).
**Nothing outside it.** Expect `src/validate.ts`, the test files and `README.md` to change. If your
design needs the registry regenerated or the pin table rewritten, **stop and tell me at Step 0** — that
is a different and much larger decision than this round is scoped for.

## Verification and tripwire
`npx tsc --noEmit`, `npx biome check .`, `npm test`, full-registry `validate`, pinned-source `sweep`.

- **Total test count ≥ 563.** The current suite is 563/563/0 across six files (semantic-invariants 420);
  four independent runs agree. A round landing with fewer tests stops the loop.
- **`semantic-invariants.test.ts` must COMPLETE.** A hang is a failure.
- Report per-file counts **from output you have read**. The progress log counts completions and carries
  no pass/fail signal — I accepted a claim derived from it earlier in this goal and had to withdraw it.
- Both attack routes and the append path must be demonstrated with **before/after controls**, the way
  you demonstrated the 150s-hang-to-1.8s-report A/B.
- Tell me before killing any process that is not yours.
