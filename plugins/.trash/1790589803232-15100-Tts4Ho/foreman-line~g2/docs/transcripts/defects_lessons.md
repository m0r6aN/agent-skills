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

## #45 — A refusal gate must name its comparator, and a shaped spec's example query must run against the real data shape

AC2a listed "URL mismatch" as a refusal without saying what the `baseUrl` was
compared against; under the plausible catalogue-vs-settings reading, 8 of 12
otherwise-resolving bindings refused and the mandated "counts: 13 under AC2a"
collapsed. Separately the Verification Plan's `$cat.models | Where-Object …`
returned nothing because the real top level is `providers[].models[]` — run
literally it emits a false `AC2A_ZERO_MATCH` for every binding. Both survived
the advisory drafting self-check, which never executed the example query. Rules:
have the shaping/verification step execute a spec's example command against the
real data shape before promotion, and make every "mismatch"/"absent"/"zero-match"
refusal name exactly what it is compared against (here: catalogue-internal only,
per Amendment 04 D-a1).

**Disposition:** the correct operand is now in the spec body (Amendment 04 D-c1,
`providers[].models[]`) and the comparator is fixed (D-a1). Open disposition: the
draft self-check is advisory-only and did not catch the field bug — extend it to
execute spec example queries when the shaping package is next touched (PMC-P0).

## #46 — Identity-resolution "present"/"absent" claims must match on provider AND id, never id alone

Coordinator-lint L5 reported `qwen3.8-flash` "present" by matching the id anywhere
in the catalogue. The id exists only under `opencode-go`, `qwen-token-plan`, and
`openrouter/qwen/…` — never under the `opencode` provider the AC2 matrix requires,
so binding 7 (`opencode/qwen3.8-flash`) is a real `AC2A_ZERO_MATCH`. A
provider-blind presence claim falsified a locked matrix row and only surfaced when
a builder resolved it literally. Rule: any catalogue presence/vendor/id claim is
matched on `provider` + `id` together, case-sensitively, and a per-provider
absence is never asserted as a cross-provider absence (the export is not an
absence proof).

**Disposition:** mechanically installed in the builder brief (literal
`provider`+`id` resolution, the 12+1 / `AC2A_ZERO_MATCH` trap, and
`AC2A_WRONG_PROVIDER`/`AC2A_PREFIX_ALIAS_REFUSED` diagnostics); the coordinator
lint should match on the paired key too (PMC-P0).
