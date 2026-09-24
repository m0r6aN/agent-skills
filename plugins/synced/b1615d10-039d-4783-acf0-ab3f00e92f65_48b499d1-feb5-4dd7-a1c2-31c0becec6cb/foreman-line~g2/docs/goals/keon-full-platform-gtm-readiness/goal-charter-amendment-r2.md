# Goal-Charter Corrective Amendment — GTM-R2

**Status:** RATIFIED 2026-09-19 by Clint Morgan at Gate 1
**Goal:** `keon-full-platform-gtm-readiness`
**Decision owner:** Clint Morgan
**Source:** GTM-P0A Stage-F closure record, open items 1–6, plus the
coordinator's own resume-time verification of 2026-09-19

This amendment controls wherever it conflicts with `charter.md` or
`goal-charter-amendment-r1.md`. GTM-R1 continues to control wherever it
conflicts with the original charter. Every decision, gate, wave, firewall, and
exit-criterion element not named below remains exactly as previously ratified.

**What this amendment does and does not do.** It closes the queue-maintenance
gap recorded in `loop-directive.md` §4 by creating one bounded parcel with
authority to write that file, and it fixes six recorded defects. It creates
**no** new wave authority, relaxes **no** hold, and advances **no** parcel past
its dependency. Gate 3 and all external actions remain withheld in full.

## Scope of Gate 1 reopening

Gate 1 was reopened only for: the GTM-P0A2 parcel grant below, including
`loop-directive.md` in its Allowed Files; and the six corrections it carries.
No other decision was reopened, and none is amended by implication.

## A1 — GTM-P0A is accepted

GTM-P0A is **independently accepted** by the coordinator as of 2026-09-19.

Acceptance rests on the Stage-F closure record (six independent adversarial
reviews across three rounds, final state cleared by two fresh reviewers, AC1–AC12
verified) **and** on a fresh coordinator closure check performed at resume time
against disk, before anything was re-run:

| Check | Result |
|---|---|
| Branch / HEAD | `goal/keon-full-platform-gtm-readiness-20260818` @ `e515bff3cec142719dbf6ee9177cde541660e306` |
| Commits above frozen base `e56c2cb` | exactly 2, in the ratified order |
| Commit 1 | `57201c8be9f1226b5bb14117094894b53f3d4cc2` — `docs(gtm): GTM-R1 charter amendment (coordinator-ratified)` — amendment file alone |
| Commit 2 | `e515bff…` — `docs(gtm): pin full-platform GTM control plane` — `charter.md`, `discovery.md`, `plan-review-findings.md`, `loop-directive.md` |
| Commit messages | byte-exact; empty bodies; no trailer (ruling F2) |
| Four ratified source hashes | all four match the GTM-P0A spec exactly, and match the ambient source byte-for-byte |
| Cumulative diff scope | exactly the five Allowed Files; nothing else |
| Constraint-13 artifacts | still present, untracked, unmodified |

Accordingly **GTM-P0B is dependency-unlocked** for shaping — and for shaping
only. It is not dispatched by this amendment; it requires its own shaping
session, coordinator lint, and Gate 2 dispatch decision, and it remains bound to
its GTM-R1 output boundary of four named files.

GTM-P0C remains **BLOCKED** on independent GTM-P0B acceptance.

## A2 — Ownership transfer of record

Ownership of this goal's queue transfers, at the GTM-P0A parcel boundary, to the
**pi coordinator session** identified below. The transfer is authorized by the
decision owner's explicit `/goal resume` instruction of 2026-09-19.

| Element | Value |
|---|---|
| Transferring owner | the Claude Code coordinator session that established GTM-P0A on 2026-08-18 |
| Receiving owner | pi coding-agent session `01a0bbcb-ef71-747d-ba5c-4b483d97f3eb` |
| Transfer point | the GTM-P0A parcel boundary — P0A accepted (A1), P0B not yet dispatched |
| Authorization | Clint Morgan, explicit `/goal resume` and Gate 1 ratification, 2026-09-19 |

This transfer is legitimate because it occurs **at a parcel boundary**, as the
one-goal/one-coordinator rule requires, and because the decision owner directed
it. It is **not** an inferred transfer: no session assumed ownership by
resembling a description.

**A durable session identifier now exists** (`PI_SESSION_ID`), and the receiving
owner is identified by it. This is a materially stronger marker than GTM-P0A
could record — its §1 element (b) noted that "no durable harness session
identifier existed when this block was written" and that session linkage was
therefore an assertion of record, not a provable fact. That limitation is
**resolved for the receiving owner and prospectively**, and is **not**
retroactively resolved for the transferring owner, whose linkage remains an
assertion of record.

The **fail-closed rule survives unchanged and remains the operative
protection**: a session that cannot confirm it is the recorded owner is not the
owner and must stop and report. A session identifier makes confirmation
possible; it does not replace the rule, and no session may treat a matching
identifier as authority to proceed past any other hold.

## A3 — GTM-P0A2 parcel grant (closes the §4 queue-maintenance gap)

Gate 2 is granted for one additional internal control-plane parcel. This is the
**only** parcel in this goal with authority to write `loop-directive.md`.

| Parcel | Repo / output boundary | Exact purpose | Depends on |
|---|---|---|---|
| GTM-P0A2 | Isolated `agent-skills` worktree `keon-full-platform-gtm-readiness-20260818`, branch `goal/keon-full-platform-gtm-readiness-20260818`; goal directory only | Apply corrections C-1 through C-6 below to `loop-directive.md` and `discovery.md`; record P0A acceptance, the A2 ownership transfer, and queue state; no push/PR/merge | GTM-R2 ratification |

**Allowed Files — exact and exhaustive:**

- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/loop-directive.md`
- `plugins/foreman-line/docs/goals/keon-full-platform-gtm-readiness/discovery.md`

**Forbidden:** every other path in the repository, including `charter.md`,
`goal-charter-amendment-r1.md`, `plan-review-findings.md`, this amendment, all
product and plugin source, all other goals, and all child control planes.

**Pinned base:** the current branch tip `e515bff3cec142719dbf6ee9177cde541660e306`.
The frozen-base pin of `e56c2cbac1a225c0c364add327b944ca696d485e` and the
**absolute no-remote-call rule** both remain in force: no fetch, pull, rebase,
push, PR, merge, cherry-pick, or network operation of any kind, against any ref.

**Routing class:** `architecture/risk`. Acceptance therefore requires a
coordinator closure check against disk, a deterministic pass, and **two
independent adversarial reviews** in fresh sessions with zero builder context,
each returning PASS.

**Return evidence:** parcel-local commits in the named isolated worktree only.

`charter.md` and `goal-charter-amendment-r1.md` are **deliberately excluded**
from Allowed Files. Their coordinator-designation line is superseded for
operational ownership only, by the mechanism GTM-P0A already established and
this amendment reaffirms — the ownership block, not an edit to the ratified
text. Ratified artifacts are not rewritten to track operational state.

## Corrections carried by GTM-P0A2

### C-1 — Record P0A acceptance, the ownership transfer, and queue state

`loop-directive.md` §1 records the A2 transfer, naming the transferring owner,
the receiving owner by durable session ID, the parcel boundary, and the
authorization — and preserving the fail-closed rule and the five ownership
facts, with fact 1 corrected in that a second ownership block now exists.

§4 records GTM-P0A as **ACCEPTED** (citing A1), GTM-P0B as **UNLOCKED FOR
SHAPING — not dispatched**, and GTM-P0C as **BLOCKED**. The GTM-P0A2 parcel is
added to the queue table.

The **known open gap** statement in §4 is replaced, not deleted. The gap is
closed **for this amendment only and prospectively only**: GTM-P0A2 may write
this file, and when GTM-P0A2 closes, **no ratified parcel will again have
authority to write it**. The successor text must say so plainly, so that the
next coordinator reads a live constraint rather than a closed historical note.
The directional staleness rule — that a stale **BLOCKED** is still **BLOCKED**,
and staleness can never unblock a successor — is preserved verbatim and now
covers the new state values.

### C-2 — Inline ruling C4

Ruling C4, issued 2026-08-18 in the GTM-P0A rework kickstarter, is reproduced
verbatim and attributed in §1 alongside F1, F2, and F4. C4 authorizes §1 fact 5's
broadening beyond "Codex" to a rival coordinator of any harness, and that
broadening runs in the withholding direction. Reproduction makes C4 **recorded
and attributed, not provable** — the same limit and the same answer as F1/F2/F4.

### C-3 — Correct `discovery.md`'s stale closing prose

The closing sentence "…remain unauthorized while that amendment is open" is
stale: GTM-R1 is ratified and Gate 1 closed. Ruling F4 deliberately shipped it
byte-identical because `discovery.md` was outside GTM-P0A's repair authority.
GTM-P0A2 now names `discovery.md` in Allowed Files, so the repair is authorized.

The correction states that the holds **remain unauthorized unconditionally**,
not contingent on any open amendment. The staleness was non-authorizing and ran
in the withholding direction; the correction must run in the same direction —
it may not narrow a hold, and the enumerated holds are preserved in full.

`discovery.md` line 5's coordinator-designation line is likewise superseded for
operational ownership only and is **not** edited; a pointer to the ownership
block of record is the permitted treatment.

### C-4 — Reproduce the six full-goal-completion requirements

GTM-R1's six numbered full-goal-completion requirements are cited in
`loop-directive.md` §8 but not reproduced. They are reproduced verbatim, with
the surrounding operative sentences intact: that
`agent-preparation-complete` is a precise intermediate state and never
equivalent to submitted, filed, launched, sold, or complete GTM; that deferral
of a mandatory legal or release gate leaves the affected item held and the goal
active; and that removing any item from the completion denominator requires an
explicit decision-owner scope amendment.

Lesson 6 of the GTM-P0A closure record applies directly and is binding on this
correction: **prose restatement drops operative sentences** — it happened six
times across three rounds on GTM-P0A. Reproduce verbatim and diff word by word
against `goal-charter-amendment-r1.md`. Do not summarize.

### C-5 — Provenance and wording corrections

Two recorded defects from reviewers E and F:

1. §3's "so this stays checkable if the kickstarter is lost" is looser than §1's
   accurate "recorded and attributed, not provable". Harmonize §3 **down** to
   §1's standard; never up.
2. Provenance category (e) says "Two passages belong to this category" where the
   reworks grew the set to roughly six. Enumerate the actual members, or state
   the count accurately without enumerating. An undercount in a provenance
   section silently launders this document's own reasoning as ratified text,
   which is the exact confusion the provenance section exists to prevent.

The five-origin provenance scheme (a)–(e) is preserved; only its accuracy is
corrected.

### C-6 — Paper-trail custody: closure-record item 6 is superseded as stated

Closure item 6 — "Commit the paper trail — this record, the build/rework/review
kickstarters, and the coordinator rulings are all untracked and destructible" —
was accurate when written on 2026-08-18. **It is no longer accurate, and the
coordinator verified this at resume time rather than accepting the record.**

The paper trail is **already tracked on `main`**, in commit
`7ab32e5fe3c466c06ebbe31c8328ac4a2652660c`, "feat: Add GTM-P0A kickstarter and
closure records", authored by Clint Morgan on 2026-08-30 and merged to `main`:

| Tracked on `main` | Status |
|---|---|
| `…-build-GTM-P0A.md` | tracked; byte-identical to the ambient working copy |
| `…-build-GTM-P0A-rework.md` | tracked; byte-identical |
| `…-build-GTM-P0A-rework2.md` | tracked; byte-identical |
| `…-review-GTM-P0A.md` | tracked; byte-identical |
| `…-closure-GTM-P0A.md` | tracked; byte-identical |
| `charter.md`, `discovery.md`, `goal-charter-amendment-r1.md`, `plan-review-findings.md` | tracked; all four hashes match the GTM-P0A pins exactly |

The R10 custody exposure at the paper-trail layer is therefore **closed already**,
by a decision-owner commit outside this goal's parcel loop. No parcel action is
required, and **GTM-P0A2 must not attempt to commit these files** — they are not
in its Allowed Files, they are already tracked, and staging them would both
breach scope and create a duplicate.

Three residual facts are recorded rather than fixed:

1. **`loop-directive.md` is not on `main`.** It exists only on the goal branch,
   as Gate 2 return evidence. This is correct — Gate 3 is withheld — and it
   means the *inlining* corrections C-2 and C-5 remain load-bearing: a reader
   with `main` alone gets the kickstarters but not the directive.
2. **Commit `7ab32e5` is not an ancestor of the goal branch.** The goal branch
   remains pinned to `e56c2cb`. Reconciling the two is a **Gate 3 integration
   decision** and is withheld.
3. **The coordinator rulings themselves** (F1, F2, F4, C4) are tracked only
   inside those kickstarter files. C-2 completes their inlining into the
   directive; nothing further is needed.

## Authority boundaries — unchanged

- **Gate 2:** granted for GTM-P0A (accepted), GTM-P0B, GTM-P0C, and now
  GTM-P0A2. Nothing else. Parcel-local commits in the named isolated worktree
  are authorized solely as return evidence.
- **Gate 3 — integration: WITHHELD**, in full, for cherry-pick or other
  integration into a target branch, push, PR, merge, release, deployment,
  publication, or equivalent action — including any reconciliation of the goal
  branch with `main` or `7ab32e5`.
- **External actions: WITHHELD**, in full, including Linear mutation, outreach,
  counsel acceptance, filing, submission, publication, payment, production
  deployment, and customer-data handling.
- **W0–W8:** no wave is directly dispatchable and no wave carries standing
  Gate 2 authority. Unchanged by this amendment.
- **Child-authority firewalls:** KPP-001-A/KEO-59, `provisional-patent-readiness`,
  and `keon-creative-foundation-v1` remain exclusively child-owned and read-only
  to this umbrella. Unchanged.

## Standing coordinator action item — not closed

**Disable VS Code autofetch for this repository.** GTM-P0A's closure record
raised this and it remains open: two round-1 reviewers independently detected a
real `git fetch` inside the parcel worktree gitdir, and the coordinator
reproduced it. It moved nothing only because `main` had no new upstream commits
at that moment — luck, not control. `main` has since advanced well past the
frozen base, so the same event now **would** move `origin/main` and unfreeze the
pin that GTM-P0A2, P0B, and P0C all rely on.

This is a decision-owner action on local tooling. It is **not** an agent task
and this amendment does not authorize an agent to change editor or Git settings.

## Ratification record

On 2026-09-19, Clint Morgan explicitly ratified GTM-R2 at Gate 1: the GTM-P0A2
parcel grant including `loop-directive.md` in its Allowed Files, the GTM-P0A
acceptance, the A2 ownership transfer, the stale-discovery correction, the
completion-requirement reproduction, the provenance correction, and the
paper-trail custody disposition. Gate 3 and all external actions remain
withheld.
