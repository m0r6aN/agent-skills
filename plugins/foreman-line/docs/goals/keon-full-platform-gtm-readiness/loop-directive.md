# /loop Directive — Keon Full-Platform GTM Readiness (goal control plane)

**Goal:** `keon-full-platform-gtm-readiness`
**Decision owner:** Clint Morgan
**Established:** 2026-08-18 by parcel GTM-P0A
**Last amended:** 2026-09-19 by parcel GTM-P0A2 under GTM-R2
**Authority sources:** [charter.md](./charter.md),
[goal-charter-amendment-r1.md](./goal-charter-amendment-r1.md) (GTM-R1 controls
wherever it conflicts with the charter),
[goal-charter-amendment-r2.md](./goal-charter-amendment-r2.md) (GTM-R2 controls
wherever it conflicts with either),
[plan-review-findings.md](./plan-review-findings.md)

This directive is the single durable queue, authority boundary, and recovery
point for this goal.

**Provenance — what traces to what.** This document is not sourced from the
ratified charter alone. Its content has five distinct origins, and a reader
must not treat any of them as if it were another:

- **(a) Ratified content**, reproduced or summarized from `charter.md` and
  `goal-charter-amendment-r1.md` (GTM-R1 controls wherever the two conflict):
  the ratification record (§2), the queue and its Gate 2 matrix boundaries (§4),
  the non-dispatchability of waves (§5), the child-authority firewalls (§6), the
  Gate 3 and external-action holds (§7, §8), and the stop conditions (§9).
- **(b) Operational state**, from the GTM-P0A parcel spec: the repository,
  isolated worktree, branch, frozen base, and pinned source hashes (§3).
- **(c) Coordinator rulings** of 2026-08-18, issued in the GTM-P0A build and
  rework kickstarters: the ownership framing of §1 bullets 3 and 4, including
  the operational supersession of the charter's coordinator-designation line
  (ruling F1, with fact 5 broadened by ruling C4); the commit-message form in
  §3 (ruling F2); and the original deliberate non-repair of `discovery.md`'s
  known-stale closing prose (ruling F4, since superseded by GTM-R2 C-3). F1,
  F2, F4, and C4 are reproduced verbatim in §1, "Coordinator rulings of
  record". Those kickstarters were untracked when this file was written; they
  are now tracked on `main` in commit `7ab32e5` (see §11), but reproduction
  here is retained because `main` does not carry this directive.
- **(d) Process rules**, from `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
  and the Foreman Line coordinator loop pattern: the two-independent-review
  requirement for `architecture/risk` parcels (§4) and the crash-recovery
  procedure (§10).
- **(e) This document's own derivation** — reasoning performed here, reproduced
  from no source above. The members of this category, enumerated in full:

  1. the three-part **owner identity marker** and its fail-closed rule (§1);
  2. the analysis of what element (b) does and does not prove (§1);
  3. the statement of what verbatim reproduction of a ruling achieves and does
     not achieve (§1);
  4. the **prospective open gap** statement on amendment authority (§4);
  5. the **directional staleness** rule for the State column (§4);
  6. the reconciliation of §5's W0–W8 versus W1–W8 wording (§5);
  7. the observation that publication is withheld under both §7 and §8 (§7);
     and
  8. the reasoning about withholding-direction tightenings immediately below.

  Every one is an inference from the ratified and operational facts, not a
  restatement of them. A reader must weigh them as this document's reasoning —
  sound or not on its own merits — and must never cite any of them as ratified
  text or as a coordinator ruling. **This enumeration is exhaustive as of
  2026-09-19**; a later editor who adds derived reasoning must add it here, and
  an undercount in this section silently launders this document's reasoning as
  ratified text.

What remains true without qualification: **this document creates no dispatch
authority at all, and changes no ratified decision, gate, scope, or exit
criterion.** The only dispatch authority in this goal is GTM-R1's Revision 1
Gate 2 matrix grant covering GTM-P0A through GTM-P0C, as extended by GTM-R2's
grant of GTM-P0A2. This file **reports** those grants; it does not confer,
extend, or renew them — including the GTM-P0A2 grant under which this very
revision was written, which comes from GTM-R2 and not from here. Delete this file and the grant
is exactly what it was — which is the test of whether a document grants
anything.

**On summaries, stated honestly.** Where this directive summarizes a ratified
source, the ratified source controls in any conflict. Several restatements here
are deliberately **tighter** than the phrase they restate — among them
"separately shaped" (§5), "is **ever** inferred" (§6), "**never** equivalent"
(§8), and "by the decision owner" appended to the integration-decision sentence
(§7). Those tightenings run **only in the withholding direction**: each narrows
what is permitted or widens what stops the queue. **No restatement here widens
an authority, converts a withheld action into a permitted one, or lowers a
bar.** A withholding-direction tightening is safe precisely because falling back
to the ratified source could only permit *no less* than this file does. Where a
tightening and its source diverge on what is **permitted**, the ratified source
controls.

---

## 1. OWNERSHIP — read before dispatching anything

> **Current queue owner: pi coding-agent session
> `01a0bbcb-ef71-747d-ba5c-4b483d97f3eb`**, by the ownership transfer recorded
> below (GTM-R2 §A2) — identified by a durable session identifier, not by tool
> name, date, or permission mode, none of which discriminate between sessions.

### Ownership transfer of record — 2026-09-19

Ownership transferred **at the GTM-P0A parcel boundary**, authorized by the
decision owner's explicit `/goal resume` instruction of 2026-09-19 and ratified
as GTM-R2 §A2.

| Element | Value |
|---|---|
| Transferring owner | the Claude Code coordinator session that established GTM-P0A on 2026-08-18 |
| Receiving owner (current) | pi coding-agent session `01a0bbcb-ef71-747d-ba5c-4b483d97f3eb` |
| Transfer point | GTM-P0A parcel boundary — P0A accepted, P0B not yet dispatched |
| Authorization | Clint Morgan, explicit `/goal resume` + Gate 1 ratification of GTM-R2 |

This transfer is legitimate because it occurred **at a parcel boundary**, as the
one-goal/one-coordinator rule requires, and because the decision owner directed
it. It was **not inferred**: no session assumed ownership by resembling a
description.

**A durable session identifier now exists** (`PI_SESSION_ID`), so the receiving
owner is identified by a value that checks directly against the running session.
This is materially stronger than the marker below could record. That resolution
is **prospective only** — it does **not** retroactively make the transferring
owner's session linkage provable, which remains an assertion of record.

**The fail-closed rule survives unchanged and is still the operative
protection.** A matching session identifier permits a session to confirm it is
the recorded owner; it is never authority to proceed past any other hold.

### Historical owner identity marker — GTM-P0A's transferring owner

The marker below identified the **transferring** owner and is retained as the
record of that session. It is no longer the test for current ownership; the
transfer table above is. The recorded owner *at the time of GTM-P0A* was the
session satisfying **all three**:

- **(a) Established by parcel GTM-P0A** on 2026-08-18 — the parcel that created
  this file;
- **(b) Fingerprinted by commit `57201c8be9f1226b5bb14117094894b53f3d4cc2`** on
  branch `goal/keon-full-platform-gtm-readiness-20260818`: the recorded owner is
  the coordinator session that dispatched the builder which produced that
  commit;
- **(c) Holding the decision owner's explicit `/goal resume` instruction** of
  2026-08-18 (bypass-permissions Claude Code session).

Element (b) is the discriminating one, but be exact about what it proves.
**Verifiable:** that commit `57201c8be9f1226b5bb14117094894b53f3d4cc2` exists on
this branch, and precisely what it contains — both check directly against Git.
**Not verifiable:** *which session dispatched the builder that produced it.*
Nothing on disk records that linkage. A commit's author is a Git identity, not a
session identity, and no durable harness session identifier existed when this
block was written. The session linkage is therefore an **assertion of record,
not a provable fact**, and any reading of element (b) as "mechanically
checkable" is wrong.

**Because element (b) cannot be proved, the fail-closed rule is what actually
protects ownership.** The protection does not come from a session proving it is
the owner — it cannot — but from the rule that **a session which cannot confirm
it is the recorded owner is not the owner and must stop.** Being "a Claude Code
session in bypass mode on this repository" satisfies nothing: any number of such
sessions can exist, and a later one is **not** the owner merely by resembling
the description. If a durable session identifier is ever recorded, it
supplements — never replaces — element (b).

Five facts govern ownership of this goal. **Facts 1 and 2 are stated as GTM-P0A
recorded them and are corrected immediately below**; facts 3–5 remain current.

1. **This is the first ownership block ever recorded for this goal.** No prior
   ownership block existed, because this `loop-directive.md` did not exist until
   GTM-P0A created it.
2. **No ownership transfer is claimed, recorded, or inferred.** There was no
   prior recorded owner to transfer from. Inventing a transfer would fabricate
   history, which the one-goal/one-coordinator rule forbids.
3. **The current owner is the coordinator session** named above.
4. **This block supersedes the "Primary Codex session designated by Clint
   Morgan" line in `charter.md` and `discovery.md` for operational ownership
   only.** That line is a pre-loop designation of intent, expressly subject to
   Gate 1 and explicit ratification — not a live ownership record. This block
   changes **no** ratified decision, gate, scope, or exit criterion.
5. **If any rival coordinator session — of any harness, tool, or model, Codex
   and Claude Code alike — holds an unrecorded claim to this goal, that is a
   stop condition.** Stop, report to the decision owner, and dispatch nothing
   further until they rule. This is deliberately not limited to Codex; the
   charter's "Primary Codex session" wording named the anticipated harness, not
   the only one that can collide.

**Correction of facts 1 and 2 (GTM-R2 C-1).** Both were true when written and
are now superseded in part. Fact 1: this is **no longer** the only ownership
record — a second exists, the 2026-09-19 transfer above. Fact 2: an ownership
transfer **is** now claimed and recorded, by explicit decision-owner
authorization at a parcel boundary. What has **not** changed is the prohibition
the facts protect: a transfer must be **explicitly recorded and authorized**,
and is never **inferred**. Facts 1 and 2 are preserved rather than rewritten so
that the transfer is visible as a change of state, not as retconned history.

One goal, one coordinator. Exactly one coordinator owns this queue at a time.
Ownership transfers **only at a parcel boundary** and **only** by recording the
transfer in this block — which requires a ratified parcel naming this file in
its Allowed Files. See the prospective gap in §4: after GTM-P0A2 closes, no
ratified parcel has that authority, so the next transfer needs a new amendment.

**A fresh session inventories and reports; it never silently assumes
ownership.** On starting, run the §10 inventory and test yourself against the
current owner of record — the transfer table above, matched on session
identifier — not against the historical three-part marker, which identifies the
transferring owner only. If you **cannot confirm** you are the recorded owner,
you are not it by default: that inability **is** the ownership-ambiguity stop
condition of §9. Stop, report to the decision owner, and dispatch nothing.
Continuing the queue while unsure who owns it is the exact failure this block
exists to prevent.

### Coordinator rulings of record

The ownership framing above, the commit-message form in §3, and the known-stale
prose shipped in `discovery.md` all rest on coordinator rulings issued on
2026-08-18 in the GTM-P0A build kickstarter. **That kickstarter is untracked and
is destroyed by any `git clean`.** Were it lost, a future session would read
ownership claims here that it could trace to nothing, while the committed
`charter.md:5` still reads "Primary Codex session" — the same durability failure
this parcel exists to close, reappearing at the ownership layer. The three
load-bearing rulings are therefore reproduced below **verbatim and attributed**,
so this directive is self-supporting if the kickstarter is gone.

**What reproduction achieves, and what it does not.** It makes each ruling
**recorded and attributed**: a future session can read exactly what was ruled
and by whom. It does **not** make any ruling **provable**. A session holding
this file and no kickstarter cannot independently confirm these rulings were ever
issued — it has this document's word and nothing else. That is the same limit
element (b) carries above, and it is answered the same way: by the **fail-closed
rule**, not by the record. Do not read reproduction here as verification, and do
not let a later coordinator rely on it as such.

**Ruling F1 — ownership block. RULING: option (a), with the exact framing
below.** `charter.md:5` and `discovery.md:5` both name a "Primary Codex session
designated by Clint Morgan, subject to explicit ratification / subject to
Gate 1." That is a pre-loop designation of intent, not a live ownership record:
no ownership block exists anywhere for this goal, because `loop-directive.md`
has never existed. There is therefore no prior owner and **no transfer to
record** — inventing one would fabricate history, which is exactly what the
ownership rule forbids. `loop-directive.md` must state, in the ownership block:

- this is the **first** ownership block for this goal, and no prior ownership
  block existed;
- **no ownership transfer is claimed, recorded, or inferred**;
- the current owner is the Claude Code coordinator session designated by the
  decision owner's explicit `/goal resume` instruction on 2026-08-18;
- this block supersedes the charter/discovery coordinator-designation line for
  **operational ownership only**, and changes no ratified decision, gate, or
  scope;
- if a live Codex coordinator session holds an unrecorded claim to this goal,
  that is a **stop condition**: stop, report to the decision owner, and dispatch
  nothing further until they rule.

The five numbered facts above are the **operative restatement** of ruling F1,
matching it point for point with **one deliberate broadening**: F1's fifth point
names a "live Codex coordinator session", while fact 5 extends the stop
condition to a rival coordinator of **any** harness, tool, or model. That
broadening was directed by coordinator ruling C4 and runs in the withholding
direction — it makes **more** situations stop the queue, never fewer. F1 is
reproduced here exactly as issued and has **not** been adjusted to match fact 5:
a verbatim record that has been quietly harmonized is not a record.

**Ruling F2 — commit trailer. RULING: verbatim messages only. No trailer, no
body, no co-author line.** AC3/AC4 make exact message text an acceptance
criterion that reviewers verify directly; the `Co-Authored-By` convention is not
part of this parcel's contract. Reviewers must read the trailer's absence as
this deliberate ruling, not as a builder omission.

**Ruling F4 — stale prose in `discovery.md`. ACCEPTED as documented; do not
repair.** Its closing sentence ("…remain unauthorized while that amendment is
open") is stale now that GTM-R1 is ratified and Gate 1 is closed. Constraint 8
forbids repair, and the holds it describes remain in force regardless, so the
staleness is cosmetic and non-authorizing. It ships byte-identical. Reviewers
must attribute it to the pinned source, not to this parcel. The coordinator
carries it as an open item for a future amendment parcel; it is **not** in P0A
scope.

F4's staleness is non-authorizing in the strict sense, and its direction is what
makes it safe: the stale sentence **withholds** authority ("remain
unauthorized") rather than granting any. A reader who wrongly treats it as
current can only over-restrict, never over-permit. `discovery.md` must not be
repaired by any parcel that does not name it in Allowed Files.

**F4 is superseded as of 2026-09-19 (GTM-R2 C-3).** GTM-P0A2 names
`discovery.md` in its Allowed Files, so the repair F4 deferred is now
authorized and has been applied: the closing sentence no longer conditions the
holds on an open amendment. F4 was correct for GTM-P0A — the file was outside
that parcel's authority — and is retained as the record of why the staleness
shipped. `discovery.md` is therefore **no longer byte-identical to its pinned
source**; the pinned hash in §3 is annotated accordingly. The holds themselves
were preserved in full; only the false precondition was removed.

**Ruling C4 — owner identity is not discriminating. RULING as issued
(2026-08-18, GTM-P0A rework kickstarter), reproduced verbatim:**

> **C4 — Owner identity is not discriminating.** §1 identifies the owner as tool
> name + date + permission mode, which any future Claude Code bypass session
> literally satisfies. Add a discriminating marker, and reconcile §1 with §10: a
> fresh session **inventories and reports; it never silently assumes ownership**,
> and inability to confirm it is the recorded owner is itself the ownership
> ambiguity stop condition. Broaden §1 bullet 5 beyond "Codex" to **any** rival
> coordinator session of any harness.

C4 is the authority for fact 5's broadening beyond "Codex", and that broadening
runs in the **withholding** direction — it makes more situations stop the queue,
never fewer. Like F1, F2, and F4, reproduction here makes C4 **recorded and
attributed, not provable**.

## 2. Ratification state

- Clint Morgan ratified the original charter (D1–D10, waves, dependency graph,
  exit criterion, Gate 2 posture) on 2026-08-18, closing Stage Zero Gate 1 and
  authorizing the mandatory fresh plan-level adversarial review.
- Three independent plan reviewers returned HOLD/BLOCK across findings R1–R17.
  All findings were accepted. Gate 1 reopened only for Revision 1.
- Clint Morgan explicitly ratified **GTM-R1** on 2026-08-18: D3-R1, D4-R1,
  D7-R1, the child-authority firewalls, the coverage/evidence/release contracts,
  the amended dependency graph and exit criterion, and Gate 2 **only** for
  GTM-P0A through GTM-P0C.
- **Two fresh follow-up reviewers independently returned PASS** after the single
  remaining authority wording contradiction was corrected: Gate 2 permits
  parcel-local commits in the named isolated worktree as return evidence, while
  Gate 3 continues to withhold every integration and external action.
- **Gate 1 is closed** by explicit GTM-R1 ratification. **The original
  ratification remains the authority for unaffected decisions** — D1, D2, D5,
  D6, D8, D9, and D10 stand as originally ratified, and only D3, D4, and D7
  received Revision 1 replacements.
- Clint Morgan explicitly ratified **GTM-R2** on 2026-09-19 at Gate 1: the
  GTM-P0A2 parcel grant (including `loop-directive.md` in its Allowed Files),
  GTM-P0A's acceptance, the ownership transfer recorded in §1, the stale
  `discovery.md` correction, reproduction of the six completion requirements,
  the provenance correction, and the paper-trail custody disposition. **Gate 3
  and all external actions remain withheld.** Gate 1 was reopened only for
  those items; every other ratified decision stands.
- **GTM-P0A is accepted** (GTM-R2 §A1). GTM-P0B is dependency-unlocked for
  shaping but **not dispatched**; GTM-P0C remains blocked. See §4.

## 3. Pinned state

| Item | Value |
|---|---|
| Repository | `D:/Repos/agent-skills` |
| Isolated worktree | `D:/Repos/agent-skills-worktrees/keon-full-platform-gtm-readiness-20260818` |
| Branch | `goal/keon-full-platform-gtm-readiness-20260818` |
| Frozen local base | `e56c2cbac1a225c0c364add327b944ca696d485e` |

Ratified source artifact SHA-256 values, pinned by the GTM-P0A spec and
reproduced byte-for-byte from the ratified sources:

| Artifact | SHA-256 |
|---|---|
| `charter.md` | `BB9938DBD23F9F719D407C0A577FB365BF3282F09B2618F210F1CE83D9F024C1` |
| `discovery.md` | `7FDD0DE2EA32E47B5A00289F66EE7644D37B77433E693D7979C333B3FC5A2338` — **superseded, see note** |
| `goal-charter-amendment-r1.md` | `468065C7BB441677C76C361A10EDA6479A49FC1E339BFB0957D1FB0F079E51EE` |
| `plan-review-findings.md` | `80C908FC5905C6F63DBD7EDC94EC5F92C5B33AA2DDD8E0AA75ECD59D725011E5` |

**Note on `discovery.md`'s hash.** That value pins the file **as GTM-P0A shipped
it**, and it no longer matches disk. GTM-P0A2 applied the GTM-R2 C-3 correction
to its stale closing prose, under explicit Allowed-Files authority. The pinned
value is retained as the GTM-P0A provenance anchor; the current file is the
operative one. The other three hashes remain exact and are unchanged.

**No remote call of any kind is authorized — not against this base, and not
against any other ref.** No fetch, pull, rebase, push, PR, merge, cherry-pick,
or other remote or network operation (GTM-P0A spec constraint 4). This is
deliberately absolute rather than base-scoped: a fetch **can** update `origin/*`
refs — including `origin/main`, which currently equals the frozen base — and
that would **unfreeze the pinned base**, destroying the very pinning this
section exists to guarantee. Not every fetch invocation necessarily moves
`origin/main`; a narrowly refspec'd fetch of some other branch need not. The
rule is deliberately not written to that margin, because a reader who must
reason about which refspec is safe has already been handed the wrong
instruction. **No remote call of any kind is authorized**, so the question never
arises. Any future parcel that finds a
different branch or HEAD stops at its Step 0 and reports; it never "fixes" the
mismatch.

### Commit record (recovery anchor)

Two local commits exist on this branch above the frozen base, in this order.
Their messages are recorded here **verbatim**, because a fresh session must be
able to verify them without the parcel spec:

| Order | SHA | Message (verbatim) | Contents |
|---|---|---|---|
| 1 | `57201c8be9f1226b5bb14117094894b53f3d4cc2` | `docs(gtm): GTM-R1 charter amendment (coordinator-ratified)` | `goal-charter-amendment-r1.md` only |
| 2 | *see note* | `docs(gtm): pin full-platform GTM control plane` | `charter.md`, `discovery.md`, `plan-review-findings.md`, `loop-directive.md` |

**Note on commit 2's SHA:** it cannot be recorded inside commit 2, because
writing it into this file would change the file, the tree, and therefore the
SHA itself. Read it from `git log e56c2cbac1a225c0c364add327b944ca696d485e..HEAD`
or from the branch reflog. Commit 2 is the tip of
`goal/keon-full-platform-gtm-readiness-20260818` unless a later ratified parcel
has added commits above it. Neither commit carries a body or a `Co-Authored-By`
trailer — that is coordinator ruling F2, not an omission. F2 is reproduced
verbatim in §1, "Coordinator rulings of record", so the ruling stays **recorded
and attributed** if the kickstarter is lost — not provable, which is the same
limit and the same answer as element (b) in §1.

**If the untracked GTM-P0A spec is gone, this directive is the surviving
record.** The spec and its shaping-result sit untracked in
`plugins/foreman-line/docs/specs/active/` and are destroyed by any `git clean`.
This file is committed; it is the durable one. Reconstruct pinned state, the
queue, the holds, and the commit anchor from here.

## 4. Queue — strict order

Gate 2 is granted **only** for the four internal control-plane parcels below —
the three enumerated in the GTM-R1 "Revision 1 Gate 2 matrix", plus GTM-P0A2
granted by GTM-R2 §A3. Each parcel's output boundary is reproduced from the
matrix that granted it. Dispatch is strictly sequential:
a successor unlocks only when its predecessor is **independently accepted** by
the coordinator — never on a builder's completion claim alone.

| # | Parcel | Repo / output boundary | Exact purpose | Depends on | State |
|---|---|---|---|---|---|
| 1 | **GTM-P0A** | Isolated `agent-skills` worktree; goal directory only | Reproduce and pin `charter.md`, `discovery.md`, the GTM-R1 amendment, review findings, and a loop directive from the selected clean local base; record hashes and local commit; no push/PR/merge | Follow-up PASS | **ACCEPTED** 2026-09-19 (GTM-R2 §A1) |
| 1a | **GTM-P0A2** | Same worktree; `loop-directive.md` and `discovery.md` only | Apply GTM-R2 corrections C-1–C-6: record P0A acceptance, the ownership transfer, and queue state; inline ruling C4; correct stale `discovery.md` prose; reproduce the six completion requirements; fix provenance wording; record paper-trail custody | GTM-R2 ratification | **CURRENT** |
| 2 | **GTM-P0B** | Same goal directory; `coverage-manifest.yaml`, `source-precedence.md`, `artifact-status-model.md`, `evidence-crosswalk-contract.md` only | Freeze scope denominator, authority precedence, orthogonal states, freshness, and lintable joins | P0A accepted | **UNLOCKED FOR SHAPING — NOT DISPATCHED** |
| 3 | **GTM-P0C** | Same goal directory; `child-authority-status.md`, `linear-disposition-proposal.md`, `founder-facts-contract.md`, `counsel-clearance-contract.md` only | Freeze child interfaces, local-only duplicate proposals, and exact human/legal input-output contracts | P0B accepted | **BLOCKED** on independent GTM-P0B acceptance |

**On GTM-P0B's state:** its dependency is satisfied, and nothing more. Unlocked
for shaping is **not** dispatched: P0B still requires its own shaping session,
coordinator lint verifying every factual claim against disk, and an explicit
Gate 2 dispatch decision. It remains bound to its four-file GTM-R1 output
boundary.

Acceptance of any parcel in this queue requires the coordinator's closure check
against disk, a deterministic pass, and — because these parcels carry
`routing_class: architecture/risk` — **two independent adversarial reviews** in
fresh sessions with zero builder context, each returning PASS
(COORDINATOR-PATTERN dispatch table).

A parcel idea that is not one of the four above is a **stop-and-report**, not a
dispatch.

**Existing KPP-001-A dispatch restrictions remain controlling for its track**
(charter, "Proposed standing authorizations" 1). Nothing in this queue relaxes
them; see the child-authority firewalls in §6.

### Prospective open gap — amendment authority closes with GTM-P0A2

This gap was recorded by GTM-P0A and **closed once, narrowly, and
prospectively reopens.** The history matters, so read all three states:

- **As GTM-P0A left it:** `loop-directive.md` appeared in the Allowed Files of
  exactly one ratified parcel — GTM-P0A itself — and that parcel had closed. No
  ratified parcel could update this file, so P0A's acceptance could not be
  recorded, the State column could not advance, and no ownership transfer could
  be written. That was the gap.
- **Now:** GTM-R2 ratified **GTM-P0A2**, which names this file in its Allowed
  Files. That is the authority under which the current queue state, the
  ownership transfer, and these corrections were written. It is the **only**
  such grant that has ever existed besides GTM-P0A's.
- **After GTM-P0A2 closes:** **no ratified parcel will again have authority to
  write this file.** GTM-P0B is scoped to `coverage-manifest.yaml`,
  `source-precedence.md`, `artifact-status-model.md`, and
  `evidence-crosswalk-contract.md`; GTM-P0C to `child-authority-status.md`,
  `linear-disposition-proposal.md`, `founder-facts-contract.md`, and
  `counsel-clearance-contract.md`. This file is in neither set. **The gap
  returns the moment GTM-P0A2 is accepted.**

**Consequence, stated plainly and still live:** recording GTM-P0B's acceptance
here, advancing the State column again, or recording the next ownership transfer
will each require **another decision-owner-ratified parcel that names this file
in its Allowed Files**. That authority **does not exist**, and this directive
does not grant it — to any coordinator, builder, or session, including the
current owner. Recording the gap is not closing it.

Treat the queue State column as accurate **only as of 2026-09-19**, and verify
live state from Git and the coordinator record rather than from this table.

**Staleness attaches to the State column only — never to the dependencies.** The
Depends-on column and the **BLOCKED** markers are **binding regardless of how
stale this table is**. No reader may treat a dependency as expired, lapsed, or
advisory because the table is known to be out of date. The staleness runs in
exactly **one** direction: it can only mean that a predecessor is **not yet**
accepted when this table suggests otherwise. It can **never** mean that a
successor has become unblocked. GTM-P0C stays blocked until GTM-P0B is
independently accepted. Because no ratified parcel may write acceptance into
this file once GTM-P0A2 closes, the markers will still read **BLOCKED** on disk
even after acceptance has actually occurred — so a stale **BLOCKED** is still
**BLOCKED**. Confirm acceptance from the coordinator record and from Git, never
by inferring that an unupdated marker has lapsed.

**The same rule now governs the non-`BLOCKED` values, in the same direction.**
`ACCEPTED`, `CURRENT`, and `UNLOCKED FOR SHAPING` were accurate on 2026-09-19
and may have been overtaken since. Staleness may only mean such a state is
**less** advanced than written — that a parcel marked `CURRENT` never completed,
or that one marked `UNLOCKED FOR SHAPING` was never dispatched. It may **never**
be read as implying a parcel progressed further than its marker, and
`UNLOCKED FOR SHAPING` never ripens into dispatched by the passage of time.

## 5. No W0–W8 authority

W0–W8 are **coordination waves only and are never directly dispatchable**
(GTM-R1, "Amended waves and dependencies"; plan-review finding R1). No standing
Gate 2 authority applies to any W1–W8 product, evidence, application, website,
media, patent, KPP, Linear, or external work.

**On the W0/W1 wording:** the two sentences above use different ranges because
the ratified source does. GTM-R1 declares **W0–W8** non-dispatchable, while its
Gate 2 matrix paragraph withholds standing authority over **W1–W8** work. Both
are reproduced as ratified and neither has been "tidied" to match the other.
The combined effect is the safe one and admits no gap: **no wave, W0 through W8,
is directly dispatchable, and no wave carries standing Gate 2 authority.** W0 is
not an exception — it is covered by the non-dispatchability rule, and the only
dispatchable items in this goal are the four named P0 parcels in §4.

Every post-P0 child must be **separately shaped and separately ratified or
explicitly approved**, with one owner, one repository or integration-only
boundary, a pinned base, exact Allowed and Forbidden Files, deterministic
acceptance, a review route, and return evidence. Until then those items are
shaping/proposal-only. A wave name is never a dispatch authorization.

## 6. Child-authority firewalls

These child control planes are **exclusively child-owned and read-only to this
umbrella** (GTM-R1, "Existing-child authority firewalls"; findings R2, R3, R4).
Read-only status receipts flow **in**; no dispatch, amendment, closure, or
mutation flows **out**. **No ownership transfer is ever inferred** — a transfer
requires an explicit parcel-boundary handoff recorded by both control planes.

| Child authority | Exclusively child-owned | This umbrella's only interface |
|---|---|---|
| `keon-proof-led-portfolio-priority` / KPP-001-A / KEO-59 | Workflow Evidence Review and Evidence Pack Sprint execution, customer motion, payment sequencing, owned commercial/site/fulfillment artifacts | Consume a versioned, read-only status receipt; surface a conflict and hold it for the child coordinator |
| `provisional-patent-readiness` | Patent-source custody, mechanism reconciliation, filing-corpus assembly, filing-readiness evidence; its Hard Rule Zero and preservation rules control | Read-only readiness/disclosure inputs; no source mutation, no disclosure relaxation |
| `keon-creative-foundation-v1` | Flagship master, claim map, derivative matrix, media production, and publication gate | Read-only release receipt and missing-gate status; no second derivatives plan |

Ratified KPP sequencing controls over conflicting stale operational text until
that text is amended through KPP authority. No category such as `low-detail` is
a legal safe harbor.

## 7. Gate 3 — integration: WITHHELD

Withheld for **cherry-pick or other integration into a target branch, push, PR,
merge, release, deployment, publication, or equivalent integration action**
(GTM-R1 "Authority boundaries"; charter "Proposed standing authorizations" 2).

**Publication is withheld under this gate as well as under §8.** The ratified
Gate 3 enumeration names it explicitly, so a publication is barred both as an
integration action here and as an external action there. Clearing one does not
clear the other.

Parcel-local commits are authorized **solely** inside the named isolated
`agent-skills` worktree, **solely** as Gate 2 return evidence. A local commit is
not integration and never implies it. Every parcel returns with deterministic
and **required** independent review evidence for an explicit
cherry-pick/push/PR/merge or other integration decision by the decision owner.
The independent review is required, not optional or discretionary.

## 8. External actions: WITHHELD

No Linear mutation, filing, submission, outreach, publication, counsel
acceptance, payment, production deployment, or customer-data handling is
authorized (charter "Proposed standing authorizations" 3; GTM-R1 "Authority
boundaries"). Each requires explicit authority at its applicable milestone.

`agent-preparation-complete` is a precise intermediate state, **not** goal
completion, and is never equivalent to submitted, filed, launched, sold, or
complete GTM. **It requires all internally preparable evidence, drafts, owner
questionnaires, counsel packets, security/integration/release packets, and
external-action runbooks to be review-accepted.**

That sentence is reproduced verbatim from GTM-R1, "Amended exit criterion", and
it is the operative bar — the whole test for claiming this state. Every one of
those artifact classes must be **review-accepted**: not merely drafted, not
self-declared complete by the producing agent, and not accepted in part. A
coordinator claiming `agent-preparation-complete` without review acceptance
across all of them has not reached the intermediate state, let alone the goal.

### Full goal completion — the six requirements, reproduced verbatim

These were previously cited here but not reproduced (GTM-R2 C-4). They are
reproduced **verbatim** from `goal-charter-amendment-r1.md`, "Amended exit
criterion", because a restatement drops operative sentences — that happened six
times across three rounds on GTM-P0A. The ratified source controls.

> Full goal completion additionally requires:
>
> 1. every frozen-manifest item has a verified or owner-approved held disposition
>    that removes every affected availability, application, and release claim;
> 2. all mandatory internal legal prerequisites for any item labeled saleable or
>    submission-ready are complete: employment/contributor determination,
>    chain-of-title treatment, required executed assignment/license, disclosure
>    classification, filing decision, Core clearance, program-terms clearance,
>    and commercial-template clearance;
> 3. application Evidence Ledger rows are complete, lint-clean, current for the
>    intended use, and surface clearance is separately recorded;
> 4. each selected program dossier is founder-approved, human eligibility-signed,
>    counsel-cleared for that exact artifact and terms snapshot, and submitted
>    only under H3 authority;
> 5. every selected public/product/media release has its W8A readiness receipt,
>    applicable cross-cutting gates, child-control-plane release receipt, and
>    authorized live verification; and
> 6. KPP, patent, and KCF child state is truthfully reflected without the umbrella
>    claiming their completion.

All six are conjunctive and none is severable. Requirement 2's legal
prerequisites are **mandatory and internal** — they are not H2/H3 external
blockers a coordinator may park while declaring the rest done. Requirement 6
bars this umbrella from claiming any child control plane's completion; see §6.

Deferral of a mandatory legal or release gate leaves the affected item held and
the full goal active. **Removing a selected program, product, service, or
external action from the completion denominator requires an explicit
decision-owner scope amendment**; silent deferral is not completion (GTM-R1,
"Amended exit criterion"). A coordinator may not shrink the denominator by
announcement, triage, or convenience — dropping an item from scope is a
decision-owner act, and without that amendment the item stays in the
denominator and the goal stays open.

## 9. Stop conditions

Stop and return to the decision owner when (charter, "Stop conditions"):

- an existing coordinator owns the same parcel boundary and no transfer is
  recorded;
- a proposed package, product, service, or claim conflicts with canon;
- a capability cannot be classified from reproducible current evidence;
- application or public wording outruns the cleared Evidence Ledger;
- counsel must make a legal, ownership, filing, confidentiality, or rights
  determination;
- a task would expose protected source, invention detail, legal material, raw
  evidence, credentials, or customer data to Genspark or another external model;
- work would touch a dirty shared checkout instead of an isolated worktree;
- a parcel crosses its exact file/repo scope or a required review remains red;
- live Linear, repository, website, CI, or program state contradicts the plan;
  or
- any outward-facing or irreversible action lacks explicit authority.

Additionally, per section 1: any ambiguity about who owns this goal is a stop
condition.

## 10. Crash recovery

A host restart, process death, or session loss kills background agents and
wakeups. On any fresh session — scheduled wake, completion notification, or a
human nudge — **inventory before continuing anything**:

1. the parcel spec under `plugins/foreman-line/docs/specs/active/`;
2. the worktree at the pinned path, and that it is the isolated worktree, not an
   ambient checkout;
3. the current branch and HEAD, against the pinned values in section 3;
4. the control artifacts in this goal directory —
   `goal-charter-amendment-r1.md`, `goal-charter-amendment-r2.md`,
   `charter.md`, `discovery.md`, `plan-review-findings.md`,
   `loop-directive.md` — and their hashes, noting that `discovery.md` and
   `loop-directive.md` have intentionally diverged from the GTM-P0A pins under
   GTM-P0A2 authority;
5. all local commits above the frozen base, their exact messages, and their
   order — check them against the commit record table in §3, which carries the
   messages verbatim and commit 1's SHA, and read later SHAs from `git log` or
   the branch reflog;
6. any unclaimed partial state: uncommitted edits, half-written files, or staged
   but uncommitted paths; and
7. **your own ownership standing** against the **ownership transfer table** in
   §1, matched on durable session identifier — not against the historical
   three-part marker, which identifies GTM-P0A's transferring owner. If you
   cannot confirm you are the recorded owner, stop and report — inventorying is
   permitted, assuming ownership is not.

Also read §11 before concluding anything is missing: the GTM-P0A paper trail is
tracked on `main` and is **not** reachable from this branch, so its absence here
is expected and is not a loss.

**Work without a completion claim is UNCLAIMED. Disk state is never accepted as
done** — there is no claim to closure-check, so a dead agent's artifacts prove
nothing. Recover by dispatching a fresh agent with a resume directive whose
Step 0 restates the original directive, inventories what exists on disk against
it, flags every gap and half-written file, and then **stops** for a coordinator
ruling. Never "fix" a Step 0 mismatch; report it.

## 11. Paper-trail custody — already tracked on `main`

GTM-P0A's closure record listed "commit the paper trail" as an open item,
because its kickstarters and closure record were untracked and destructible by
`git clean`. **That item is superseded (GTM-R2 C-6): the paper trail is already
tracked on `main`**, in commit `7ab32e5fe3c466c06ebbe31c8328ac4a2652660c`,
"feat: Add GTM-P0A kickstarter and closure records", authored by Clint Morgan on
2026-08-30 — a decision-owner commit made outside this goal's parcel loop.

Tracked there, byte-identical to their ambient working copies: the GTM-P0A build
kickstarter, both rework kickstarters, the review kickstarter, and the Stage-F
closure record — plus all four ratified sources at hashes matching the §3 pins
exactly. The R10 custody exposure at the paper-trail layer is therefore closed,
and **no parcel should attempt to commit those files**: they are already
tracked, and staging them here would breach scope and duplicate them.

Three residual facts, recorded rather than fixed:

1. **This directive is not on `main`.** It exists only on this goal branch, as
   Gate 2 return evidence — correct, since Gate 3 is withheld. So the inlined
   rulings in §1 remain load-bearing in the mirror image of the original
   concern: a reader with `main` alone has the kickstarters but not this file.
2. **Commit `7ab32e5` is not an ancestor of this branch**, which stays pinned to
   `e56c2cb`. Reconciling the two is a **Gate 3 integration decision** and is
   withheld. Do not fetch, merge, or rebase to "align" them.
3. **The coordinator rulings** live only inside those kickstarter files; §1's
   verbatim inlining of F1, F2, F4, and C4 is what makes them durable here.
