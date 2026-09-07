# FK-P0 round 6 — STOP REPORT for the developer

**The loop is stopped.** Written 2026-09-03 by the second 2026-09-03 coordinator.

## Why it stopped, and what only you can do

The round-6 builder died on **HTTP 402 — "This request would exceed your available credits given
your current in-flight requests."** That is an environment stop condition, not a defect and not a
tripwire.

**Dispatching a replacement would not help**: a fresh agent draws on the same credit pool and
would fail the same way. And the remaining work is **controls (a)–(g)** — the tests that prove
the parcel correct. The coordinator will not write those: they *are* the verification, and D4
forbids a coordinator producing verification of its own parcel. That boundary held all round and
holds here.

**What you must do:** let in-flight requests settle or add credits, then re-issue
`/goal resume foreman-kernel`. Nothing else is required of you. **No merge decision is being
asked for — FK-P0 is mid-round, not at Gate 3.**

## The good news, and it is the round's central claim

**Round 6's defect is closed.** The `## Current state` block of `loop-directive.md` was rewritten
as part of writing this stop — the identical class of edit that, before this round, produced **45
sweep violations and failed three tests**, including the acceptance-criterion test asserting the
CLI sweep exits 0. Measured immediately after:

```
sweep --repo-root  →  exit 0, valid: true, 0 violations
                      rules 468 | items 1525 | sources 18
```

A real coordinator state update, in the live governed document, absorbed with zero violations.
That is the property R24 through R29 exist to produce, and it is now demonstrated rather than
argued. **It is not a substitute for control (a)** — the control must still exist as a test — but
it is strong evidence the mechanism is right.

## State: HEAD `ab8b891` package, plus docs through this commit

**Landed and on the branch:**

- the two-pass masking primitive, with volatile lines excised **before block discovery and before
  ordinal assignment**, so volatile content never occupies an ordinal and cannot displace a
  governed sibling;
- the two-kind closed extent union (`heading-subtree`, `table-column`) — `container-blocks`
  dropped as having no caller;
- all three regions declared, anchored by `headingItemId`;
- the closed-schema change and `volatileRegions` in `registryBindingManifestDigest`;
- `VOLATILE_REGION_OVERLAP` and `VOLATILE_REGION_INVALID`, with the spec's "closed" set
  reconciled to include the two codes it had already been exceeded by;
- obligation 1's rule removal (469 → 468); and
- **a document-derived second half of the anti-laundering check** that the coordinator never
  specified: it asks whether a published item's *normative text* is among the excised bytes, which
  catches a governed statement a region swallows while its anchor sits elsewhere.

**Not done — this is why nothing here is a completion claim:**

1. **Standing authorization 8 is unpublished.** Count is 468; R28 requires 469. The acceptance
   assertion's "exactly one addition" is unmet, and 468 is that failure, not a partial success.
2. **None of controls (a)–(g) exist.** No test file has been touched this round.
3. **R29.3's anchor-keying is ratified but unimplemented** — the fix that stops item-ID churn
   silently breaking curated bindings.
4. The migration record and new chain head are unwritten.
5. `generate` idempotence is unproven.
6. **`npm test` is unmeasured for this round.** The 583 / 580 pass / 3 fail figures predate five
   governed-source commits and must not be quoted as current.

## Two defects this round found that no review would have

Both are recorded in full in `FK-P0-round6-recovery-record.md`.

**A ratified charter rule was silently de-published, and it reached a commit.**
`rule.fk-charter.ff0f88a958e0` — charter integration scenario 14, the decision-path latency
scenario added by A1.5 and bound to **D21** — vanished at `d307112` while `sweep` reported zero
violations. Its item had been renamed; the curated maps are keyed by item ID; the renamed item
missed them and landed with `ruleIds: []` and generated boilerplate claiming it *"does not state
an independent normative authority rule."*

**Then the same defect hit the rule that documents the defect.** Standing authorization 8 — the
ambient-checkout prohibition protecting *your* routing-policy change — now ships de-published with
that same boilerplate. Its own text reads: *"curated `ruleIds: []` with a boilerplate rationale
asserting it stated no rule. It states a rule."* The rule documenting the defect became an
instance of it.

Neither is visible to controls (a)–(f): a declassified item plus an unemitted rule is
self-consistent and leaves no trace. **This is control (g)'s entire justification, twice over, in
real data rather than in argument.**

## Three coordinator errors, recorded because they are the transferable part

1. **Two writers on one parcel.** After five idle notifications the coordinator judged the builder
   dead and began working in its worktree. It was alive. History stayed linear by luck — the
   `491fb80` lesson, repeated by the coordinator meant to enforce it.
2. **A stale measurement pinned to the wrong SHA.** A `tsc` run against the working tree was
   attributed to a commit made afterwards, mischaracterising one-identifier-from-compiling work as
   half-written.
3. **Rulings issued by message and never written into the spec.** Three amendments' worth. Two
   separate agents then read canon, followed it correctly, and were wrong. R29 installs the rule:
   *a ruling that changes the spec is committed to the spec before the dispatch that depends on
   it.*

A fourth, shared and structural: `git checkout <sha> -- <path>` **stages**, and `git commit`
commits the **whole index** — so a staged measurement by one agent became a 1,365-deletion revert
committed by another's hand, invisible from both sides. Measurements belong in a separate git
worktree; a shared checkout has a shared index.

## Housekeeping you may want, none of it blocking

- **115 node processes** on the host, including **27 long-leaked `mcp/server.mjs` daemons**
  accruing since 2026-08-29 and probably some orphaned `tsx` children. Not killed: process
  cleanup is destructive and some may belong to live sessions. This matters because the
  `semantic-invariants.test.ts` abort (`0xC0000409`, Windows `__fastfail`) correlated with heavy
  concurrent node load every time it appeared.
- The permission classifier timed out intermittently all round, blocking writes and Node runs for
  both the coordinator and the builder.
- Amendment **A3** (standing authorization widening) remains **drafted and not in force**. Auto
  mode twice refused a coordinator self-ratification of its own standing authority on a generic
  blanket grant, and both refusals were correct.
- Branch `codex/fk-p0-rework6-unclaimed-20260903` at `b0518f8` holds the preserved pre-restore
  work. It is superseded by `ab8b891` and can be deleted whenever you like.
