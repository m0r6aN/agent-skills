# U1 §8 Closure — Round 3 Build Directive (Phase A: local implementation)

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
(on `dev`; read it via `git show` at the SHA given under "Read first"). You are a builder, not a
reviewer: you implement and commit locally, and you never grade your own work. The closure
review is a separate identity (`openai/gpt-6-astra`, owner-named 2026-10-03) that sees only your
committed output.

## STEP 0 — RESTATE AND STOP. NO CODE BEFORE COORDINATOR CONFIRMATION.

Your first action is to restate, and then stop and wait:

1. The scope of this build in your own words, as a per-amendment table (A-U1.8.28 … .37).
2. The exact Allowed Files you will touch (enumerate; propose the exact names of any new files
   inside the one new directory permitted below).
3. Your branch and worktree (below).
4. Dependencies and the base commit.
5. The contract you must not break.
6. How you will verify — the exact local commands, and for each amendment's named hostile input,
   how you will execute it locally and what you cannot execute without a live run.
7. Every item you believe is out of scope.
8. Every flag: anything you think an amendment gets wrong, cannot be implemented as written,
   contradicts another amendment or the shipped bytes, or needs a wording amendment.
9. Tooling inventory: what you have (`py -3` is 3.13; `node` 24; `docker` present; `actionlint`
   and `python3` are NOT on PATH) and anything you need.

**Write nothing to any file until the coordinator confirms.** A flag that touches a locked
decision, an external-effect boundary, a security boundary, the exact Allowed Files, or the
ratified amendment text requires a ratified amendment before code — raise it at Step 0; do not
work around it. Precedent: round 2 found clauses "impossible as first drafted" only during
implementation; raise that class early by trying the naive reading of every refusal path first.

## Worktree and branch — named, not ambient

- **Worktree:** `D:/Repos/agent-skills-worktrees/u1-closure-round3`
- **Branch:** `codex/u1-closure-round3`
- **Base commit:** `ed848ba0595f7c8f6e01c1655babc725a73c2ef2` (`origin/main` = tag
  `u1-verifier-pin`, verified against `git ls-remote` 2026-10-03). Worktree is clean at base.

Never touch the ambient `D:/Repos/agent-skills` checkout (its working tree carries user-owned
changes and uncommitted coordinator state; do not read files from it, do not absorb anything
from it). Never touch another worktree. Read dev-only documents with `git show <sha>:<path>`
from inside your worktree (same object store); never `git checkout dev` or merge dev.

## Hard external-effect limits (standing authorization 5 and 7; nothing here is optional)

- **No `git push`, no PR, no tag, no remote ref change of any kind.**
- **No `gh` and no `az` invocations at all.** The ambient CLIs are logged in as the repository
  owner / custodian; using them as the builder would be exactly the one-identity conflation
  A-U1.8.34 records. Facts you need from live state are not yours to fetch — flag them.
- No edit to rulesets, environments, credentials, role assignments, storage; **no `u1-fixture`
  provisioning (HELD by the owner)**; no workflow run of any kind (you cannot dispatch).
- Network use is limited to reading package/image artifacts needed for local verification:
  at Step 0 name each (e.g. `docker pull rhysd/actionlint:1.7.12` — version matches the pin
  record's `actionlint.version`; `py -3 -m pip install pyflakes==3.4.0` into a throwaway venv
  outside the repo). Record image digest / package hash. Anything else needs a coordinator ruling.

## Read first

All three sets are read-only inputs:

1. In your worktree (main @ `ed848ba`): `.github/workflows/u1-verify.yml`, `u1-produce.yml`,
   `u1-lint.yml`; `plugins/foreman-line/bypass-outage-harness/u1-sandbox.mjs` and
   `u1-fixture/evidence/*`; `plugins/foreman-line/docs/goals/foreman-kernel/`:
   `U1-contract-2026-09-29.md`, `U1-8-closure-amendments-2026-10-01.md` (A-U1.8.01–16),
   `U1-8-closure2-amendments-2026-10-02.md` (A-U1.8.17–27, final ratified text),
   `U1-verifier-pin.json`, `U1-configuration-checklist.json`,
   `U1-closure-implementation-notes-2026-10-01.md`, `promotion-requests/**`.
2. From dev, via `git show 0b51d85416f2e6f2d7ad27f16c238bd687fe2172:plugins/foreman-line/docs/goals/foreman-kernel/<file>`:
   - `U1-8-closure3-amendments-2026-10-03.md` — **the ratified spec of this build** (A-U1.8.28–38).
   - `U1-8-closure2-verdict-2026-10-03.json` — the findings H-1…H-15 with line citations.
   - `U1-8-closure2-verdict-triage-2026-10-03.md` — coordinator reproduction (H-1, H-3, H-8).
   - `U1-observations-2026-09-30.md` is not required reading.
3. `git show 0b51d85416f2e6f2d7ad27f16c238bd687fe2172:plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

Line numbers in the amendments cite `u1-verify.yml@ed848ba`. **Confirm every cited line yourself
at Step 0 before changing it** — the triage records that H-5 (producer side), H-6 (endpoint
effect), H-11 (producer probe) and H-14/H-15 details were *not* re-verified by anyone but the
reviewing session.

## Scope — Phase A only

Implement, in the repository's workflows/harness, the deltas of **A-U1.8.28 through A-U1.8.37**,
and run locally everything that can run locally. Phase A explicitly **does not** include:

| Out of scope | Why |
|---|---|
| A-U1.8.38 re-pin record (`U1-verifier-pin.json`, tag move, new `workflowCommit`/digest) | needs workflow bytes merged to the default branch and live dry runs; owner/coordinator act |
| A-U1.8.35 clause 1 provisioning of `u1-fixture` | HELD by owner; irreversible cloud act |
| A-U1.8.35 clauses 3-4 execution (fixture ACCEPT run, fixture hostile runs) | needs the container |
| Every live dry run / hostile-input *dry run* (A-U1.8 §0 item 2 floor) | needs a pushed branch and a workflow dispatch; you may not do either |
| A-U1.8.34 recorded facts, §9.2 contract statement, sunset | live GET evidence + contract text; coordinator/owner |
| A-U1.8.37 clause 1 (`U1-live-changes` Addendum C and the clause-4 extension landing on the default branch) | records live on dev; landing needs a PR the repository ruleset currently blocks (see below) |
| Any `U1-workflow-design-2026-09-30.md` fence update | dev-only document; coordinator mirrors it |

Because the hostile-input floor ("read, not executed is not a closure") cannot be met by Phase A
alone, your completion claim must state, per amendment, **`LOCAL-EXERCISED`** (you executed the
extracted logic against the named hostile input and it was refused with the named code, evidence
attached) or **`LIVE-ONLY`** (cannot be exercised without a run). Do not blur the two.

## Allowed Files (exact; everything else is Forbidden)

Modify:

- `.github/workflows/u1-verify.yml`
- `.github/workflows/u1-produce.yml`
- `.github/workflows/u1-lint.yml`
- `plugins/foreman-line/bypass-outage-harness/u1-sandbox.mjs`
- `plugins/foreman-line/bypass-outage-harness/u1-fixture/evidence/*.json` (the five existing
  files only — committed rows carry their fields, A-U1.8.20 clause 6)
- `plugins/foreman-line/docs/goals/foreman-kernel/promotion-requests/**/expected-outcome-oracle.json`
  and `.../promotion-request.json` (existing directories; new case directories only for
  negatives an amendment names, prefixed `u1-fixture-neg-` and listed at Step 0)
- `plugins/foreman-line/docs/goals/foreman-kernel/U1-configuration-checklist.json` (only the
  `reobservedBy` field of A-U1.8.37 clause 1; **this changes `configurationChecklistSha256` —
  flag the re-pin consequence in your notes, do not edit the pin record**)

Create (new files only):

- Exactly one new directory, `plugins/foreman-line/bypass-outage-harness/u1-round3-checks/`,
  for local hostile-input drivers and the extraction helper you need to run embedded
  `python3 - <<'PYEOF'` blocks outside Actions. Propose exact filenames at Step 0. These are
  throwaway-grade local verification aids; they are not wired into any workflow or package
  script and need not ship permanently — say so in your notes.
- `plugins/foreman-line/docs/goals/foreman-kernel/U1-round3-implementation-notes-2026-10-03.md`
  (your running notes and the completion claim).

## Forbidden

- Any file not listed above, including `U1-verifier-pin.json`, the contract, any ratified
  amendment document, the routing policy, and anything under `plugins/foreman-line/docs/specs/`.
- Weakening any existing refusal path, widening any permission, or adding any secret/key/SAS/
  `secrets.*` reference. The producer FORBIDDEN list (`az storage immutability-policy`,
  `az storage blob delete`, `--overwrite true`, account keys, SAS URLs, `secrets.*`) stays.
- Editing `main`/`dev`, force-pushing, rewriting history, `git stash`, or touching any
  pre-existing stash.
- Interpreting around an ambiguous amendment. Flag it.

## Implementation requirements

1. **The sweep mandate — read this twice.** Each amendment names a defect *class*. Fix **every
   instance of the class**, not only the cited lines. A-U1.8.28 clause 2 is the model: *every*
   `$GITHUB_OUTPUT` write in all three workflows goes through one shared writer — list every
   write site you converted and every one you proved is not a request-influenced value.
   The same sweep applies to: unvalidated values interpolated into API paths (A-U1.8.32 cl. 3),
   every `compare_classes`/equality call site (A-U1.8.30, A-U1.8.36 cl. 3), every probe
   (A-U1.8.36 cl. 1), every use of the literal `main` (A-U1.8.32 cl. 4).
2. **Linear-time, injection-safe string handling** (constraints 4 and 5): any regex you add runs
   linear-time on hostile input; any value emitted to a line protocol (`$GITHUB_OUTPUT`,
   annotations, step summary) is validated/sanitized before emission.
3. **Default-deny gates test every structural invariant independently** (constraint 3): the
   request-field grammar (A-U1.8.28 cl. 1) needs one refusal case per field and per invalid
   shape (empty, over-length, CR, LF, `=`, leading zero policy as written, non-hex, wrong digest
   prefix, uppercase hex, 39/41-char commit). Allowlists pin identity, location and value
   (constraint 13): `permittedGaps` is exact `(id, caseId, obligation)` triples.
4. **Verifier-owned harness (A-U1.8.31, owner ruling R-1).** No file from the candidate tree is
   ever executed as the harness; the harness is read from the pin commit `R`; the candidate is an
   input checked out read-only in a separate directory. The harness must **derive** results by
   re-execution, not read `exitStatus`/`observedResult` from committed evidence. If a control
   cannot be re-executed in the sandbox, it is `not-exercised` and A-U1.8.29 governs. Flag at
   Step 0 anything in the IA-2.11 trust-policy projection change (adding `sandboxHarness`) that
   moves the trust-policy digest of existing requests/oracles — that is a consequence to surface,
   not to absorb.
5. **Both ends of `github-run` (A-U1.8.32, R-2):** producer uploads the unmodified source file as
   its own artifact and cites that artifact's byte digest; verifier binds repository, head
   repository, branch (default branch from the API), `run.path`, workflow bytes at `run.head_sha`,
   `run.id` vs request, subject commit in default-branch history, artifact digest and
   row-by-canonical-bytes. Runs are fetched once, cached, paginated and size-bounded (F-16).
6. **Commit hygiene.** Commit early and often as checkpoints (a prior builder was watchdog-reaped
   with work uncommitted). **Never mask `git add` output** (`2>/dev/null` hid a bad pathspec and
   silently aborted staged batches twice in this goal); validate the pathspec list; end every
   commit with `git status --porcelain` and report it. One logical amendment per commit where
   practical, message `u1-round3: A-U1.8.NN <subject>`. Windows: run node/npm/py sequentially.
7. **Embedded-Python lint.** `u1-lint.yml` must keep passing locally: run the shipped embedded-
   block compile + pyflakes procedure (and extend it per A-U1.8.37 cl. 2) against your changes.
   `actionlint` 1.7.12 must pass over all three workflows (Docker image acceptable; record how).
8. **Notes file.** Maintain `U1-round3-implementation-notes-2026-10-03.md`: per-amendment
   clause-by-clause map `clause → file:line(s) → local evidence → LOCAL-EXERCISED | LIVE-ONLY`;
   every call site you converted/swept; every flag you raised and its ruling; every command run
   with its exit code. Wrong-shaped claims (a clause "done" with no file:line and no evidence) are
   presumptively empty.

## Known repository fact you must not "fix"

Ruleset `agent-skills-default` currently requires code-scanning results that are not configured,
with no bypass actors, so a PR to `main` cannot merge today (U1-live-changes Addendum C). That is
an owner decision, not your problem and not a reason to alter any ruleset or the workflow set.
Your branch stays local; the publication path (PR, merge, re-pin) is decided by the owner after
your Phase A is accepted.

## Stop conditions (stop and report; do not continue)

- An amendment cannot be implemented as written, or two amendments conflict, or an implementation
  needs a file outside Allowed Files.
- Any change would weaken an existing refusal, require a credential, or need a live call.
- You find evidence a finding (H-n) is wrong or an existing "CLOSED" item regressed.
- A tool/hostile-input run shows a refusal path you added is itself bypassable.
- Test/check count tripwire: you state the number of local hostile-input cases per amendment at
  Step 0; if a later rework round has fewer cases than the round before, stop and explain.

## Completion claim (required shape)

Commit everything (clean `git status --porcelain`), then report: final branch HEAD SHA; one table
row per clause of A-U1.8.28–37 (`clause | file:line | local evidence | LOCAL-EXERCISED/LIVE-ONLY`);
the sweep lists from requirement 1; every command run with exit code; `actionlint` and
embedded-python lint output; the list of flags and the exact set of things Phase B (live dry runs,
fixture, re-pin, record landing) will still need. Do not claim any amendment closed on the basis
of reading alone.
