# /loop Directive — Keon Full-Platform GTM Readiness (goal control plane)

**Goal:** `keon-full-platform-gtm-readiness`
**Decision owner:** Clint Morgan
**Established:** 2026-08-18 by parcel GTM-P0A
**Authority sources:** [charter.md](./charter.md),
[goal-charter-amendment-r1.md](./goal-charter-amendment-r1.md) (GTM-R1 controls
wherever it conflicts with the charter),
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
- **(c) Coordinator rulings** of 2026-08-18, issued in the GTM-P0A build
  kickstarter: the ownership framing of §1 bullets 3 and 4, including the
  operational supersession of the charter's coordinator-designation line
  (ruling F1, with fact 5 broadened by ruling C4); the commit-message form in
  §3 (ruling F2); and the deliberate non-repair of `discovery.md`'s known-stale
  closing prose (ruling F4). Because that kickstarter is untracked and
  perishable, F1, F2, and F4 are reproduced verbatim in §1, "Coordinator
  rulings of record".
- **(d) Process rules**, from `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
  and the Foreman Line coordinator loop pattern: the two-independent-review
  requirement for `architecture/risk` parcels (§4) and the crash-recovery
  procedure (§10).
- **(e) This document's own derivation** — reasoning performed here, reproduced
  from no source above. Two passages belong to this category and to no other:
  the three-part **owner identity marker** and its fail-closed rule (§1), and
  the **known open gap** statement that no ratified parcel may amend this file
  (§4). Both are inferences from the ratified and operational facts, not
  restatements of them. A reader must weigh them as this document's reasoning
  — sound or not on its own merits — and must never cite either as ratified
  text or as a coordinator ruling.

What remains true without qualification: **this document creates no dispatch
authority at all, and changes no ratified decision, gate, scope, or exit
criterion.** The only dispatch authority in this goal is GTM-R1's Revision 1
Gate 2 matrix grant covering GTM-P0A through GTM-P0C. This file **reports** that
grant; it does not confer, extend, or renew it. Delete this file and the grant
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

> **Current queue owner: the Claude Code coordinator session** identified by the
> three-part marker below — not by tool name, date, or permission mode, none of
> which discriminate between sessions.

**Owner identity marker.** The recorded owner is the session satisfying **all
three**:

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

Five facts govern ownership of this goal:

1. **This is the first ownership block ever recorded for this goal.** No prior
   ownership block existed, because this `loop-directive.md` did not exist until
   GTM-P0A created it.
2. **No ownership transfer is claimed, recorded, or inferred.** There was no
   prior recorded owner to transfer from. Inventing a transfer would fabricate
   history, which the one-goal/one-coordinator rule forbids.
3. **The current owner is the Claude Code coordinator session** named above.
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

One goal, one coordinator. Exactly one coordinator owns this queue at a time.
Ownership transfers **only at a parcel boundary** and **only** by recording the
transfer in this block — subject to the open gap in §4, which currently leaves
no ratified parcel able to write it.

**A fresh session inventories and reports; it never silently assumes
ownership.** On starting, run the §10 inventory and test yourself against the
three-part marker above. If you **cannot confirm** you are the recorded owner,
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
current can only over-restrict, never over-permit. `discovery.md` remains
byte-identical to its pinned source and must not be repaired by any parcel that
does not name it in Allowed Files.

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
  received Revision 1 replacements. GTM-P0A is the only dependency-unlocked
  parcel.

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
| `discovery.md` | `7FDD0DE2EA32E47B5A00289F66EE7644D37B77433E693D7979C333B3FC5A2338` |
| `goal-charter-amendment-r1.md` | `468065C7BB441677C76C361A10EDA6479A49FC1E339BFB0957D1FB0F079E51EE` |
| `plan-review-findings.md` | `80C908FC5905C6F63DBD7EDC94EC5F92C5B33AA2DDD8E0AA75ECD59D725011E5` |

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
verbatim in §1, "Coordinator rulings of record", so this stays checkable if the
kickstarter is lost.

**If the untracked GTM-P0A spec is gone, this directive is the surviving
record.** The spec and its shaping-result sit untracked in
`plugins/foreman-line/docs/specs/active/` and are destroyed by any `git clean`.
This file is committed; it is the durable one. Reconstruct pinned state, the
queue, the holds, and the commit anchor from here.

## 4. Queue — strict order

Gate 2 is granted **only** for the three internal control-plane parcels below,
exactly as enumerated in the GTM-R1 "Revision 1 Gate 2 matrix". Each parcel's
output boundary is reproduced from that matrix. Dispatch is strictly sequential:
a successor unlocks only when its predecessor is **independently accepted** by
the coordinator — never on a builder's completion claim alone.

| # | Parcel | Repo / output boundary | Exact purpose | Depends on | State |
|---|---|---|---|---|---|
| 1 | **GTM-P0A** | Isolated `agent-skills` worktree; goal directory only | Reproduce and pin `charter.md`, `discovery.md`, the GTM-R1 amendment, review findings, and a loop directive from the selected clean local base; record hashes and local commit; no push/PR/merge | Follow-up PASS | **CURRENT** |
| 2 | **GTM-P0B** | Same goal directory; `coverage-manifest.yaml`, `source-precedence.md`, `artifact-status-model.md`, `evidence-crosswalk-contract.md` only | Freeze scope denominator, authority precedence, orthogonal states, freshness, and lintable joins | P0A accepted | **BLOCKED** on independent GTM-P0A acceptance |
| 3 | **GTM-P0C** | Same goal directory; `child-authority-status.md`, `linear-disposition-proposal.md`, `founder-facts-contract.md`, `counsel-clearance-contract.md` only | Freeze child interfaces, local-only duplicate proposals, and exact human/legal input-output contracts | P0B accepted | **BLOCKED** on independent GTM-P0B acceptance |

Acceptance of any parcel in this queue requires the coordinator's closure check
against disk, a deterministic pass, and — because these parcels carry
`routing_class: architecture/risk` — **two independent adversarial reviews** in
fresh sessions with zero builder context, each returning PASS
(COORDINATOR-PATTERN dispatch table).

A parcel idea that is not one of the three above is a **stop-and-report**, not a
dispatch.

**Existing KPP-001-A dispatch restrictions remain controlling for its track**
(charter, "Proposed standing authorizations" 1). Nothing in this queue relaxes
them; see the child-authority firewalls in §6.

### Known open gap — no parcel may amend this directive

`loop-directive.md` appears in the Allowed Files of **exactly one ratified
parcel — GTM-P0A, the parcel that created it — and that parcel is complete.**
**No pending or future ratified parcel names this file at all.** The Revision 1
Gate 2 matrix scopes GTM-P0B to `coverage-manifest.yaml`,
`source-precedence.md`, `artifact-status-model.md`, and
`evidence-crosswalk-contract.md`; and GTM-P0C to `child-authority-status.md`,
`linear-disposition-proposal.md`, `founder-facts-contract.md`, and
`counsel-clearance-contract.md`. This file is in neither set. That is precisely
why the gap stands: the **only** parcel with authority to write here has already
closed, and nothing ratified reopens it.

**Consequence, stated plainly:** no currently ratified parcel may update this
directive. That includes advancing the State column of the queue above,
recording an ownership transfer in §1, or marking GTM-P0B accepted. Any such
update requires a **decision-owner-ratified parcel that names this file in its
Allowed Files**.

That authority **does not exist yet**, and this directive does not grant it —
to any coordinator, builder, or session, including the current owner. Recording
the gap is not closing it. Until the decision owner ratifies such a parcel,
treat the queue State column as accurate only as of GTM-P0A, and verify live
state from Git rather than from this table.

**Staleness attaches to the State column only — never to the dependencies.** The
Depends-on column and the **BLOCKED** markers are **binding regardless of how
stale this table is**. No reader may treat a dependency as expired, lapsed, or
advisory because the table is known to be out of date. The staleness runs in
exactly **one** direction: it can only mean that a predecessor is **not yet**
accepted when this table suggests otherwise. It can **never** mean that a
successor has become unblocked. GTM-P0B stays blocked until GTM-P0A is
independently accepted, and GTM-P0C stays blocked until GTM-P0B is. Because no
ratified parcel may write acceptance into this file, the markers will still read
**BLOCKED** on disk even after acceptance has actually occurred — so a stale
**BLOCKED** is still **BLOCKED**. Confirm acceptance from the coordinator record
and from Git, never by inferring that an unupdated marker has lapsed.

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
dispatchable items in this goal are the three named P0 parcels in §4.

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
4. the five GTM-P0A Allowed Files in this goal directory —
   `goal-charter-amendment-r1.md`, `charter.md`, `discovery.md`,
   `plan-review-findings.md`, `loop-directive.md` — and their hashes;
5. both local GTM-P0A commits, their exact messages, and their order — check
   them against the commit record table in §3, which carries both messages
   verbatim and commit 1's SHA, and read commit 2's SHA from `git log` or the
   branch reflog;
6. any unclaimed partial state: uncommitted edits, half-written files, or staged
   but uncommitted paths; and
7. **your own ownership standing** against the three-part marker in §1. If you
   cannot confirm you are the recorded owner, stop and report — inventorying is
   permitted, assuming ownership is not.

**Work without a completion claim is UNCLAIMED. Disk state is never accepted as
done** — there is no claim to closure-check, so a dead agent's artifacts prove
nothing. Recover by dispatching a fresh agent with a resume directive whose
Step 0 restates the original directive, inventories what exists on disk against
it, flags every gap and half-written file, and then **stops** for a coordinator
ruling. Never "fix" a Step 0 mismatch; report it.
