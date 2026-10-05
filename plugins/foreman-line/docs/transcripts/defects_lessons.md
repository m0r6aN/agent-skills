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

## #43 — A version-pinned API-surface fact rots the moment the package updates

Pi 0.86.1 → 0.87.1 silently removed `pi.setModel` / `pi.setThinkingLevel`
from `docs/extensions.md` prose; the methods survive only in shipped type
declarations. A memo carrying the 0.86.1 observation as if current would have
been wrong, and a "does not exist at runtime" absence claim would have been
unevidenced. Pin the version, hash the enumerated surface, and word "absent"
as "absent from the enumerated, hashed N-version surface"; re-verify at
dispatch, never carry a pre-drift finding forward.

**Disposition:** mechanically installed in `probe/check-api-surface.mjs`
(asserts `package.json` version, SHA-256s the enumerated docs/examples/types
surface, fails closed on mismatch); narrative-only elsewhere (PRAC-P0).

## #44 — A verdict that lands while a goal already implements it is near-duplicate work

The council directive's "constrained routing adapter" was already being built
by `pi-model-configuration` (and the contract/resolver/ledger by
`routing-policy` + RCM + GMF). The overlap was only visible after Stage Zero
had trusted a stale read of `INDEX.md`; the index and the working tree both
changed under the session. Reconcile a new concept against the live goal INDEX
and the live working tree at intake AND again at dispatch.

**Disposition:** narrative-only coordinator judgment; the `/goal` skill
already mandates the canon/INDEX check at Stage Zero; the live re-check is the
coordinator's own discipline (PRAC-P0).

## #45 — "Wired in name only": green tests can surround a dead seam

CI-P1's `verify` seam passed 90+ unit tests with injected evidence while the
shipped CLI never wired the workflow's `CI_REUSE_EVIDENCE` step output into
the verify context — every live reuse silently over-fell back and the entire
saving was dead in production wiring. Two independent adversarial reviews
probed the core through injected seams and missed the entry point; a throwaway
CLI smoke (real process, real env) caught it. Any seam crossing a
process/env/IO boundary needs at least one check that drives the REAL entry
point through the REAL channel, and reviewer mandates must include an
end-to-end entry-point probe.

**Disposition:** mechanical where it matters — the rework's `runCli` tests
drive the real CLI path with real env channels (`scripts/ci-reuse.test.mjs`);
OPEN install debt on `templates/kickstarters/reviewer-template.md` and the
builder template (routed at next template touch). Narrative-only otherwise.

## #46 — "Provably feeds no check" is a measured claim, never a reading

CI-P1's first classifier exempted documentation-shaped paths on the argument
that no check reads them; dual reviews found four such paths that ARE test
inputs (a package README asserted row-by-row, three goal-doc JSONs
sha256-pinned) — an exploitable green-without-sweep. Any rule EXCLUDING paths
from validation must derive its exclusions from a measured read-sweep of every
check that could read them (tests AND sources, module-load reads included),
pin the inventory as tests, and re-derive shrink-only whenever the checked set
expands.

**Disposition:** mechanically installed in `scripts/ci-reuse.mjs`
(READER_SET pin + shape-level Markdown-only shrink, A3) and in the CI-P2 spec
C9 re-derivation duty; general rule narrative-only (candidate home:
SPEC-CONVENTION §4.7 surfaces note — OPEN, routed with CI-P2).

## #47 — A pwsh `run:` block exits with its LAST command's code

The CI-P1 harness step grew from one `node --test` to two inside a single
`run:` block; the step then greened whenever the second suite passed even if
the first failed — a silent green against the never-silent-green rule, and a
regression from the step's prior single-command shape. Multi-command Windows
steps must propagate each command's exit code explicitly
(`if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }` between commands), and the
propagation should be shape-pinned where the gate depends on it.

**Disposition:** mechanically installed in `.github/workflows/foreman-line-ci.yml`
(per-command guards) + `scripts/ci-reuse.test.mjs` (R5 semantic pin, both
dimensions mutation-bound); other workflows narrative (OPEN debt: audit
multi-command steps in `test-plugin-install.yml` at next touch).

## #48 — A value pin must be measured where it runs; name the variance, don't average it

CI-P2's waived-value pins were measured on the local machine, and every CI
round surfaced a member the base never showed: the CN-01..CN-05 race flakes
(each observed at least once in CI, never in the 16-run local base), two
git-environment R31 corpus members (30 → 32 failures), and count drift from a
racy suite. The matcher's SEMANTICS were correct throughout — the DATA was
narrow. Measure value pins in the deployment environment, or exhaustively
enumerate the family (the CN closure); prefer named present-or-absent members
over totals; and keep a rejection-observability channel
(`waiver_rejected: {layer, observed, expected, names}`) so the
surface-and-ratify loop runs on data instead of guesses.

**Disposition:** mechanically installed in `scripts/foreman-line-ci.mjs`
(placements 11/12 pin data + the R18 rejection records) and the A2
placements 11/12 named-residual clauses; general rule narrative-only (OPEN:
candidate for STANDING-CONSTRAINTS at next touch).

## #49 — A waiver must bind failure IDENTITY; counts and totals are slack

The known-red waiver first pinned substrings (a new failure hiding behind an
old marker waived), then exact totals (racy tests flaked the gate red), and
only bound correctly at the failure-identity set plus the measured equality
`failTotal === |distinct failing names|` — a duplicate-title, a marker-named
test, and a control-char variant each bump the total without adding a
distinct name, and the equality refuses all three. Slack in a waiver is
exactly where new defects hide; run-then-waive with a clean-exit kind gate
keeps killed output from laundering itself.

**Disposition:** mechanically installed in `scripts/foreman-line-ci.mjs` +
`.test.mjs` (the v3.1 pin shape + equality; the round-3 probe cases are
tests); narrative-only otherwise.
