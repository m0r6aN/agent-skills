# FK-P0 Spec Amendment R14 — honest claims for `CONFLICT` and "unrelated bytes"

## Status

**COORDINATOR-RATIFIED**, 2026-09-02, per SPEC-CONVENTION §11: exact replacement text supplied
below, committed alone touching only the spec, with a commit message identifying it as
coordinator-ratified.

**Authority basis.** This amendment changes no locked charter decision (D1–D21), no
external-effect boundary, no human gate, no dependency edge, and no entry in Allowed Files. It
narrows two acceptance-criterion claims to what the code can honestly establish. That is squarely
inside the standing coordinator authority in the loop directive's §"Standing authorizations",
item 4, which reserves developer ratification for flags that change a locked decision, an
external-effect boundary, a public contract's authority semantics, a security boundary, or exact
Allowed Files. None applies.

**Source.** FK-P0 round-1 triage, findings #6 (Reviewer A S1) and #12 (Reviewer B S5).

## Why these two, and why now

Both are cases where the spec claims more than the implementation establishes. FK-P0's entire
purpose is the honest representation of where enforcement is real; an acceptance criterion that
overstates its own guarantee is the exact defect the parcel exists to prevent. Amending before
the rework means the builder implements against a claim that is true, rather than closing a
finding by making a false claim pass.

Neither amendment weakens a safety property. Both preserve fail-closed behaviour unchanged.

---

## R14.1 — AC5, the `CONFLICT` outcome

**Target:** §Acceptance Criteria, item 5.

**Current text:**

> 5. `resolveAuthority` makes precedence scope-aware and fail-closed: a higher-tier FK rule controls
>    an in-scope subject/claim contradiction; historical/generic rules remain visible; an unlisted
>    or equal-authority contradiction returns `CONFLICT` and cannot be selected silently.
>    Real shipped competing statements share curated subjects, tier comes only from the exact
>    binding `authorityBasisRef`, and retired rules never control. A resolved result exposes its
>    controlling decision; a highest-tier decision split returns `CONFLICT` even when the claim text
>    is identical. Exact bounded Gate 2 dispatch grants resolve `ALLOW`.

**Replacement text:**

> 5. `resolveAuthority` makes precedence scope-aware and fail-closed: a higher-tier FK rule controls
>    an in-scope subject/claim contradiction; historical/generic rules remain visible and appear in
>    `consideredRuleIds` without exception or hand-placed exclusion; and an unlisted or
>    equal-authority contradiction can never be selected silently. Such a contradiction — including
>    a highest-tier decision split whose claim text is identical — invalidates the registry via
>    `RULE_CONFLICT`, and resolution against it returns `REQUIRE_HUMAN` with reason
>    `REGISTRY_INVALID`. The resolution result type exposes no `CONFLICT` outcome, because no input
>    can reach one: `RULE_CONFLICT` is a validity-blocking violation, and resolution never runs
>    against an invalid registry. Real shipped competing statements share curated subjects, tier
>    comes only from the exact binding `authorityBasisRef`, and retired rules never control. A
>    resolved result exposes its controlling decision together with the classification, assurance,
>    and enforcement owner behind it, so a structural refusal cannot be read as a mediated one.
>    Exact bounded Gate 2 dispatch grants resolve `ALLOW`.

**Rationale.** Reviewer A proved the `CONFLICT` branch unreachable in both shapes AC5 names, with
and without the manifest pin, and a 372-query survey returned zero. The cause is structural, not
incidental: any rule pair that could reach `CONFLICT` must share an `authoritySubject` and an
active tier and overlap on all five applicability axes, which is exactly the `RULE_CONFLICT`
predicate, so the document is always invalid first.

The coordinator considered and rejected the alternative of demoting `RULE_CONFLICT` so the
resolver could report per-query `CONFLICT`. That would mean resolving against a registry known to
be invalid, which contradicts the fail-closed design the same criterion asserts. Deleting an
unreachable variant that advertises a capability the code does not have is the honest fix.

Two obligations are added rather than removed: `consideredRuleIds` must carry historical/generic
rules with no hand-placed exclusion (closing finding #7), and the resolved result must expose
classification, assurance, and enforcement owner (closing finding #13). Both make the criterion
stricter.

---

## R14.2 — AC12, "unrelated bytes"

**Target:** §Acceptance Criteria, item 12.

**Current text:**

> 12. Both CLI commands honor the `0/1/2` contract, return all ordered violations, remain read-only,
>     and return byte-identical results for identical inputs. Unrelated bytes outside registered
>     locators do not change the result; a changed normalized operative value does.

**Replacement text:**

> 12. Both CLI commands honor the `0/1/2` contract, return all ordered violations, remain read-only,
>     and return byte-identical results for identical inputs. Operator misconfiguration — including
>     a `--repo-root` that exists but is not the root of a real Git worktree — is an operational
>     error (exit 2), never a registry violation (exit 1). Non-semantic bytes added to a registered
>     source outside its registered locators do not change the result; the shapes proven inert are
>     comments, blank lines, fenced code blocks, and headings. A changed normalized operative value
>     does change the result, **and so does any added narrative prose in a Markdown source**, which
>     is reported as `SOURCE_ITEM_UNCOVERED` because new prose in a canon document requires
>     disposition rather than silent acceptance. The suite must assert the prose case is detected,
>     not only that the inert shapes are ignored.

**Rationale.** Reviewer B probed six byte shapes against a registered source. Comments, blank
lines, fenced code blocks, and headings are inert; an ordinary narrative paragraph — and every
subsequent one — raises `SOURCE_ITEM_UNCOVERED`. The current criterion states flatly that
unrelated bytes do not change the result, which is false for the single most likely edit to a
canon document.

**The behaviour is correct and is not being changed.** Treating new prose in a governed document
as requiring disposition is the right fail-closed posture, and is the same property that makes the
sweep worth having. The defect is that the criterion describes the opposite, and that the shipped
test at `tests/corpus-sweep.test.ts:295-315` exercises only the four shapes that happen to be
inert — so it cannot detect the discrepancy it was written to guard.

The exit-code sentence is folded in from finding #10: exit 1 is the signal reserved for "the
registry is invalid," and returning it for a mistyped path is a false accusation against canon.

---

## What this amendment deliberately does not do

- It adds no acceptance criterion and removes none; AC1–AC15 keep their numbering.
- It changes no locked charter decision, and touches neither D11 nor D21.
- It does not narrow AC10. The coordinator ruled that retirement evidence must become genuinely
  digest-verified in `validate` rather than have the claim weakened to match the code — see triage
  finding #3. That is a code obligation, not a spec change.
- It does not relax AC11. All seven axes were proven load-bearing; the fix is to make the CLI
  layer assert its named codes too.
- It grants no authority, changes no gate, and creates no parcel or dependency edge.
