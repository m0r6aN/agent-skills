---
ticket: ROPT-P1
title: Routing optimization program — lane→class integrity advisory (P1)
status: draft
owner: clinton.morgan
created: 2026-10-07
updated: 2026-10-07
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/routing-policy/src/validator.ts
  - plugins/foreman-line/routing-policy/src/cli.ts
  - plugins/foreman-line/routing-policy/src/index.ts
  - plugins/foreman-line/routing-policy/tests/lane-class-references.test.ts
  - plugins/foreman-line/routing-policy/README.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

# ROPT-P1 — Routing optimization program, parcel 1: lane→class integrity advisory

Origin: an external design review of the routing-policy package (2026-10-07)
identified six optimization themes. Five of them change ratified semantics or
require owner-set policy content and are recorded here as the program backlog;
this parcel ships only the one change that is additive, honest, and requires
no fabricated bound: naming the lane→class referential-integrity gap.

## The program (backlog, not authorized by this parcel)

1. **Evidence population.** Most binding envelopes ship `unknown`/`unproven`;
   on the shipped evidence no binding is rankable. Close by driving
   `catalog-snapshot.ts` + `catalog-eligibility-adapter.ts` on a schedule and
   transcribing objective facts (context, cost, modalities) into `declared`
   envelopes with the snapshot as named source. Also normalize per-model facts
   off per-binding duplication.
2. **Within-group failover.** Today first-eligible wins with no health/quota
   retry, which is why `:free` models are excluded. Proposed: ordered-list
   walk on provider-rejected attempts only, each attempt a receipted
   `AttemptRecord`; never a quality judgment, never cross-tier. Changes D3
   fallback semantics — needs a ratified amendment.
3. **R7 quality loop.** Feed dispatch outcomes (acceptance, rework, gate
   failures) into R7 via route receipts; emit reorder *proposals* through
   `config-repair-proposal.ts`, never auto-reorder. Human-gated.
4. **Budget feedback.** `ceiling_usd` is static; R5 (remaining budget) is in
   the ranking contract but unwired. Proposed: receipt-chained budget ledger
   with declared, receipted allowlist narrowing near the ceiling. Blocked on
   (1) — ceilings are uncheckable while cost is `COST_UNKNOWN`.
5. **Refresh cadence.** Keep frontier anchoring in validator code; automate
   catalog-diff + repair-proposal generation so standard/economy drift
   surfaces as a reviewed proposal instead of quarterly staleness. CI wiring
   is W4's call, not this program's.
6. **Lane→class referential integrity** — this parcel, advisory stage.

## Intent

`lane_map.<lane>.routing_classes` names the routing classes a lane serves;
nothing cross-checks those names against the `classes` block. The shipped
v0.4 policy references three undefined classes: `review/security` (L2),
`implementation/complex` (L3), and `routing/classification` (L6 — exempt, the
lane is disabled-refused under M2 and cannot dispatch). A dispatch under an
undefined class resolves no allowlist and no `ceiling_usd`: the spend bound
does not exist for that lane/class pair.

This parcel adds a pure, exported advisory —
`laneClassReferenceAdvisories(doc)` naming each gap as
`LANE_CLASS_UNDEFINED` — surfaces it as non-blocking `advisory:` lines on the
CLI's stderr, and changes neither `validatePolicy` verdicts nor the frozen
exit-code contract.

Promotion to a hard invariant is the follow-on parcel and requires owner
decisions this parcel deliberately does not make: a `classes` entry for
`review/security` (shape fully derived — invariant 3 forces
`security_flavored: true` and `allowlist: [frontier]`; ceiling still
owner-set) and for `implementation/complex` (allowlist derivable from the
frozen L3 lane_routes' tier membership; ceiling owner-set). An enforced bound
is never a guessed value, so the advisory ships instead of the invariant.

## Constraints

1. No change to `validatePolicy` errors, verdicts, or the 0/1/2 exit-code
   contract. `LANE_CLASS_UNDEFINED` must never appear in a refusal list.
2. The advisory is pure: no I/O, no clock, no network — the validator-module
   purity pattern.
3. Disabled-refused lanes are exempt; naming L6's unreachable class would be
   noise, not a gap.
4. Advisory output is deterministic (sorted) and total (never throws on
   malformed input — structural failure is the schema layer's job).
5. Additive exports only, per the package's supported-surface wiring
   convention; existing exports untouched.
6. No policy-document (`routing-policy.yaml`) content change in this parcel.

## Allowed Files

1. `plugins/foreman-line/routing-policy/src/validator.ts`
2. `plugins/foreman-line/routing-policy/src/cli.ts`
3. `plugins/foreman-line/routing-policy/src/index.ts`
4. `plugins/foreman-line/routing-policy/tests/lane-class-references.test.ts`
5. `plugins/foreman-line/routing-policy/README.md`
6. `plugins/foreman-line/docs/specs/active/ROPT-P1-routing-optimization-program.md` (this file)

## Acceptance Criteria

1. `laneClassReferenceAdvisories` on the shipped policy returns exactly two
   advisories — L2→`review/security`, L3→`implementation/complex` — and the
   shipped policy remains `validatePolicy`-valid.
2. `routing-policy validate routing-policy.yaml` exits 0 and prints both
   advisories as `advisory:` lines on stderr.
3. Tests pin: exact shipped-policy advisory set, L6 exemption, synthetic
   dangling/defined/disabled cases, deterministic ordering, malformed-input
   totality, and disjointness from `validatePolicy` errors.
4. `tsc --noEmit`, `tsx --test tests/*.test.ts` (full package suite), and
   `biome check` on the changed files are clean.
5. README documents the advisory, the exemption, and the promotion path.

## Out of Scope

- Program items 1–5 above (each needs its own parcel; 2 needs a ratified
  amendment first).
- Defining `classes` entries for `review/security` / `implementation/complex`
  (owner-set ceilings; the promotion parcel).
- CI workflow wiring (W4).
- Any dispatch-time behavior; this package does not perform transport.

## Context & References

- `plugins/foreman-line/routing-policy/README.md` — eight invariants, exit
  codes, resolver predicate order.
- `plugins/foreman-line/routing-policy/routing-policy.yaml` — lane_map,
  classes, frozen A5.4 map.
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`.
- Design review of 2026-10-07 (conversation record; six optimization themes).

## Verification Plan

- `npm run typecheck`, `npm test`, `npx biome check <changed files>` in
  `plugins/foreman-line/routing-policy/`.
- Manual CLI run on the shipped policy; confirm exit 0 and both advisories.
- Reviewer focus: (1) can the advisory ever flip a verdict or exit code?
  (2) is the L6 exemption sound? (3) does any text fabricate a ceiling or
  imply one was derived?

## Open Questions

1. Ceiling values for `review/security` and `implementation/complex` —
   owner decision, prerequisite for the promotion parcel.
2. Should `routing/classification` ever gain a `classes` entry, or is
   undefined-with-disabled-lane the permanent shape until L6 re-enablement
   (ratified amendment)?
