# Foreman Line Defect Lessons

This current-repository ledger begins with the lessons distilled during the
E6-R1 current-repository evidence rerun. Earlier lesson numbers remain cited by
the imported standing constraints; their absent historical prose is not
reconstructed here.

## #37 — Repository identity is not install resolution

A living install instruction can name the canonical repository and still be
unusable when its requested plugin is absent from the declared marketplace.
Repository normalization therefore needs an end-to-end resolver assertion:
marketplace key → source directory → nested plugin manifest → matching plugin
name.

**Disposition:** installed as Builder conditional constraint #14 in
`docs/kickstarters/STANDING-CONSTRAINTS.md`. The E6-R1 one-time inventory sweep
covered all 46 builder paths; Audit Suite was the only unresolved living install
surface, and its marketplace entry plus stale-key regression checks now pass.

## #38 — Named evidence tests must fail when the named structure is stripped

A test described as validating a full provider response was able to pass while
asserting only a small subset of the response. Evidence-fixture tests must bind
each named structural field and include a mutation that removes the asserted
structure, proving the test turns red.

**Disposition:** mechanically installed in the E6-R1 integration regression as
the named-field structural guard and stripped-capture negative; Reviewer
constraint #11 already requires this mutate-to-prove technique. The E6-R1
one-time sweep covered both captured merge-gating rulesets and found no second
unbound current-response fixture in the scoped inventory.

## #39 — Reviewed-set byte-stability beats ledger freshness

Amending already-reviewed evidence files to fix purely documentary staleness
(GMF-P0 EV-004 quoted pre-rework sibling hashes) voids the reviews that passed
those exact bytes. The ledger delta belongs in the decision record that
references the evidence (PR body + coordinator verification), never in a
post-review edit for zero substantive gain.

**Disposition:** narrative-only coordinator judgment; applied on PR #28
(triage reply + resolve, bytes untouched).

## #40 — Bot review threads are merge gates: triage, reply, resolve

The `main-pr-gate` ruleset requires thread resolution with zero bypass actors,
so every bot thread blocks the merge until a human-or-delegated triage lands
on-record. Each thread gets fix / cure-without-touching / disagree-with-cause
/ verified-stale, a reply stating which, then resolution. Stale threads (bot
reviewed a pre-fix commit) must be re-verified against the current head, not
assumed stale.

**Disposition:** narrative-only coordinator judgment; applied on PRs #28–#30
(7 threads: 2 fixed in-branch, 2 cured via coordinator refresh notes, 1
disagreed with dual-reviewer cause, 2 verified-stale).

## #41 — Merge-forward (never rebase) under a reviewed branch

When main moves under a review-passed branch, merge main into the branch and
re-hash the reviewed files: identical hashes keep the verdicts standing with
proof, while rebase rewrites the reviewed base and voids them. Strict-policy
rulesets additionally require the merge-forward before required checks count.

**Disposition:** narrative-only coordinator judgment; applied on PR #28
(merge `db52b8e`, three evidence hashes re-verified identical).

## #42 — A version gate needs both the tag and per-entry pins, checked exhaustively

`git describe --tags` with zero tags fails every run, and a validator reading
only `marketplace.plugins[0].version` goes stale the moment a second entry is
pinned. The gate requires: first tag matching sibling manifests, a version on
every marketplace entry, and a validator that compares every entry (proven
with a negative probe).

**Disposition:** mechanically installed in `scripts/validate-versions.js` +
`scripts/validate-versions-test.js` (all-entries comparison, committed
hermetic negative probe over fixture manifests in a temp git repo); PR #29.
