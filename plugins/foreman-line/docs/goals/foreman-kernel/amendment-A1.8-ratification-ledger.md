# Amendment A1.8 — Ratification Ledger

## Status

**APPLIED TO THE WORKING TREE, UNCOMMITTED — text not yet reviewed by the developer.**

Drafted and applied on the developer's direction of 2026-09-01 ("go with your
recommendation" on the stale-reference finding, plus explicit agreement that "the
preamble should name a ratification ledger"). The *approach* was directed; the
*text* below has not been read by the developer. It is uncommitted for that reason.
Landing it requires the §11 commit discipline and the developer's review of the diff.

## Problem

Transcribing A1 exposed three references that go stale whenever a locked decision
is added, none of which A1 enumerated:

| Location | Stale text |
|---|---|
| Header `**Status:**` | pinned to the 2026-08-31 re-clear |
| §4 preamble | "D1–D20 and the amended graph/exits are binding" |
| §10 Gate 1 | "D1–D20, FK-P0–FK-P21, … are in force" |

This is A1.7's defect class one level up. A1.7 fixed a stale *count*; these are stale
*ranges*. The structural point: a charter that restates its own binding set in prose
must be edited in N places per amendment, and the Nth place is the one that gets
missed. The corpus-sweep obligation (D11, lesson #36) applies to a document's
self-references exactly as it does to code.

## Change

Replaces every hardcoded range with a pointer to a new **§4.1 Ratification ledger** —
one table, one row per ratification event, seeded with the three that have occurred.
Prose stops enumerating; the ledger governs. Future amendments append a row instead of
editing prose, so the drift class is retired rather than re-fixed.

Applied clauses: A1.8a (header), A1.8b (§4 preamble), A1.8c (new §4.1), A1.8d (§10
Gate 1). Diff against `/tmp/charter.before.A18.md` in the drafting session.

## Deliberate scope limits

- Adds no locked decision. The ledger records ratifications; it does not create authority.
- Changes no gate. §4.1 restates that Gate 1 is nondelegable per amendment.
- Alters no decision, parcel, scenario, or exit criterion.
- The seeded rows assert only what the charter and A1 already recorded; no ratification
  is inferred, back-dated, or manufactured.

## Known defect in this amendment — found by adversarial review, 2026-09-01

**§4.1 does not satisfy its own rule.** The subsection this amendment installs states:
"Appending a row is the only way to change the binding set. An amendment document that has
not produced a row here is a proposal, whatever its own status line says." A1.8 changed the
charter in four places and appended **no row for itself**. By its own rule, §4.1 is
therefore a proposal — and any later amendment whose landing depends on §4.1 (A2-r3's r3.14
does) inherits that provisionality.

Found independently by two reviewers of A2-r2. No row was fabricated in response: a row
asserting ratification that has not occurred would be worse than the gap it closes.

**Fix, requiring developer action:** review this amendment's text, ratify it, and append its
own row to §4.1 in the same act. Until then §4.1 is provisional and nothing should be landed
on the strength of it.

**General rule this suggests:** a ledger rule must be self-applying — the instrument that
installs it appears in it. Proposed as a lessons-ledger entry with disposition to
SPEC-CONVENTION §11.

## Ratification

**Ratification record:** _(text unreviewed — approach directed 2026-09-01, wording pending;
see the known defect above, which must be resolved in the same act)_
