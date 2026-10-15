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

## #50 — A rename commit that claims content changes must show deletions

The CI-P2 Stage-F move commit claimed `status: active → done` and a new
required frontmatter field, but its diff was "33 insertions(+), **0
deletions**" — a modified line is a deletion plus an insertion, so zero
deletions proved the content change never staged. The commit shipped the
done-spec with incomplete lifecycle frontmatter; the spec-linter corpus pins
caught it at the merge and main went red. The coordinator's closure check
verified file counts and rename shape but never compared the diff's SHAPE to
the commit's CLAIMS. Verify diff shape against claimed shape before accepting
any closure: a claimed modification must produce deletions; a claimed
addition must produce insertions.

**Disposition:** narrative coordinator discipline + the goal closure record
(`docs/goals/ci-optimization/goal-closure-2026-10-02.md`); OPEN install
candidate: the closure checklist in the coordinator carryover /
COORDINATOR-PATTERN at next touch.


## 2026-10-10 — Callback-local root guards and fleet golden reconciliation (TO-B0)

FCA config introduced five unchanged D19 violations despite outer absolute-root
checks: filter/forEach callbacks needed their own same-function assertion, and
a routing path duplicated the canonical plugin-layout spelling. The unchanged
audit caught the prerequisite; PR #168 repaired guards and exact path assertions
without relaxing audit rules. The next CI pass exposed a stale verification
scaffold golden after fleet60617 already pinned Biome2.5.14. Reconcile test
goldens and provenance commentary with accepted manifest/lock changes; preserve
exact keys, sibling parity and hostile negative controls rather than weakening
the test. Independent local checks, two reviewers and both full required CI
chains passed before actual merge96ffadc5. Disposition: closed baseline repair;
not observation implementation acceptance or a change to another goal's scope.


## 2026-10-10 — Complete current records and Markdown exclusions (TO-P1)

Header excerpts passed while complete live goal documents falsely became unknown: benign ineligible corroboration was wrongly treated as a revocation veto. Independent full-document probes exposed the discrepancy. The accepted reader distinguishes no-authority corroboration from actual current denial/conditional/revoked evidence, and full unchanged FOC/TO/CFF/W4 charter plus directive tests exercise the shipped scanner. Markdown table exclusions require structural delimiter/body coverage including optional outer pipes, short delimiters and missing-cell rows; leading-pipe filters and happy-path table fixtures leaked grants/conflicts. Disposition installed in ops-console/src/ratification.ts and its tests, with actual scanGoal→status→remedy regression assertions.251tests and fresh dual architecture review pass at a840914f; actual CI/merge pending in the parcel evidence. The bounded reader makes no authority-authentication or full Markdown-conformance claim.


## 2026-10-13 — Remove the stored form instead of hardening it (QF-P1 quick-flags registry)

QF-P1 first stored delegating and gate quick flags (`--blanket`, `--dispatch-ok`, `--merge-ok`) as persistent grant records, then spent three adversarial rounds (six frontier reviews, two reworks) hardening them: every HIGH in rounds 2 and 3 sat in machinery a previous rework had added (derived records, void records, revocation keys, owner-by-time, pinned branch/revision). The fix that converged was a Gate 1 re-open that **removed the stored form** (the three delegating flags became one-shot; only restrictive flags persist, because a dropped or forged restriction can only lose a restriction), after which the reshaped design reached two ACCEPT verdicts in four rounds with findings shrinking from HIGH to MEDIUM to LOW. Four defects worth carrying:

1. **When an authority-bearing flag is persisted, every layer of persistence is a new attack surface.** Prefer a design where the only stored state can only restrict. Disposition: installed as quick-flags charter decisions D5″/D9″ and the QUICK-FLAGS.md `Active restrictions` design; OPEN: add "stored state may only restrict" to the Stage Zero interrogation checklist in the `goal` skill at QF-P2.
2. **A builder's "every instance swept" claim was falsified twice** (round-2 and round-3 reviews of the old design) and once in part on the new design (a ratify-scope change not carried into the GATES row check). A sweep claim is wrong-shaped unless the completion report shows a post-edit grep for each changed pattern's vocabulary over the whole file, including every table cell and every entry's cross-reference line. Disposition: installed in the QF-P1 rework kickstarters (per-pattern post-edit greps; two false closures stop the loop); OPEN: promote into `templates/kickstarters/builder-template.md` at next touch.
3. **Rework text is the next round's attack surface.** A "simplification mandate" (replace or tighten before adding; every net-new sentence must trace to an AC) held the registry at 346 lines through four rework rounds. Disposition: installed in the QF-P1 rework kickstarters; OPEN: same builder-template candidate.
4. **Harness failure modes that look like review results.** A foreground `pi -p` call killed by a tool timeout (exit 137) leaves the child running detached and an empty output file; an API quota 400 leaves an empty output and the error only in stderr; concurrent reviewers collide on a shared `/tmp` scratch path. Launch long sessions detached (`setsid nohup ... &`) and poll; treat empty output as a failed dispatch and read stderr, never as a clean result; give each reviewer a private `mktemp -d`. Disposition: installed in the reviewer kickstarter text; narrative otherwise.


## 2026-10-14 — A carve-out narrower than its source is a contradiction (QF-P2 quick-flags integration)

QF-P2 wired the quick-flags registry into canon (goal-skill section, loop-directive template, synced copy, COORDINATOR-PATTERN cross-reference). One round of two independent adversarial reviews, one MEDIUM, one rework, two ACCEPTs. Two defects worth carrying:

1. **A scoping qualifier added to a mirrored sentence can contradict the source.** The skill's V7 carve-out said "Prose standing authorizations *in the loop directive*…" where the registry's sentence is unqualified and its §3 names grants in "a loop directive or a goal's authority file"; the narrower carve-out read as revoking every prose grant stored elsewhere (a live cross-goal grant exists). Both independent reviewers found the same MEDIUM (O-1/P-1). When a sentence mirrors a registry/canon sentence, diff the qualifier set, not just the words. Disposition: installed as the O-1 fix (the skill sentence now mirrors QUICK-FLAGS.md:41 exactly); the QF-P2 review mandate's naive-reading item (b) is the check that caught it — keep "write the wrong-but-literal reading" in reviewer mandates.
2. **Hard-wrap points are checkable surface.** A reflow split "Quick" / "flags" across lines and broke the term-rule grep mid-rework; the builder caught it on its own Verification Plan run and re-wrapped. Wrap points can create or destroy grep-visible tokens. Disposition: installed in the QF-P2 spec's house style (never split an anchor phrase a check greps for) and confirmed by the rework; QF-P3 inherits the remaining checkability gaps (O-8/P-9: variant coverage, wrapped placeholders, entry contiguity) as shaping inputs.

Process note: the anthropic reviewer lane failed mid-loop with an API quota 400 (empty stdout, error only in stderr — the 2026-10-13 lesson's failure shape); handled per that lesson, and the route switch to openai/gpt-6.1-sol rides a recorded developer ruling in the loop directive, not a silent substitution.


## 2026-10-14 — Unclaimed disk state is inventory, not evidence (QF-P0 crash recovery)

The QF-P0 builder (a 60-minute-foreground `pi -p`) was killed by the harness timeout after completing the implementation but before its completion claim. The worktree held a nearly complete amendment: R33 module, 201-test dedicated suite, before/after sweeps, and a 22k-line transcript — but the last full suite run on disk was RED (6 semantic-invariant failures fixed afterward but never re-run end-to-end). Accepting the disk state would have shipped an unverified final state. The crash-recovery rule held: a fresh session restated the directive, inventoried disk against every AC (finding exactly what was missing: the final green chain, SHA256SUMS, the amendment record), stopped for a ruling, and only then re-ran the full chain (953/953) and finished the evidence. Two corollaries worth carrying:

1. **A killed builder's transcript is a map, not a result.** The recovery inventory found the transcript's last completed full suite was a FAILED run even though the focused re-tests passed later; only a fresh end-to-end chain settles the final state. Disposition: installed by doing; the loop-directive template's Crash recovery section (QF-P2) already carries the rule — this is its first live exercise.
2. **Verification helpers need failure taxonomy: crash ≠ red.** Three recovery stops were helper bugs (wrong path, shell-quoting SyntaxError, a substring predicate matching npm's echoed runner source), not check failures. The working discipline: helper crashes may be fixed and retried with the failed attempt retained; an actual check evaluating false is a hard stop. And a predicate like `'FAILED FILES' not in output` must match a standalone diagnostic line, never a substring — npm echoes the runner's own source into the transcript. Disposition: installed in the QF-P0 recovery rulings (broad helper mandate with retained failures); candidate for the builder template at next touch.


## 2026-10-14 — Native SQLite proof and measured container provenance (OPMEM-H1)

A native dependency advisory was present in Gateway's transitive graph before P5a. Package labels and quiet audits were insufficient: prove the actual Windows/Linux published asset by absolute library path, exported native version and binary hash, then kill the regression with a disposable raised-floor mutation. Capture sanitized Docker pre-start mounts and a measured archive hash tied to the reviewed tree; a hardcoded commit label or empty stdout does not establish isolation. Actual human integration merge b3a4b1b was tree-equal to dual-reviewed bfd21823 and a fresh merged422 suite preserved every identity. Integration closure is not a deployed fix, nor do local source checks override separate red record-repository CI. Disposition: narrative-only ledger entry; distilled rules already installed in OPMEM-H1 spec/kickstarter/evidence scripts and `h1-closure-2026-10-14.md`. No global policy/package/CI mutation; publication PR#227 upstream missing-lock prerequisite remains separately held.
