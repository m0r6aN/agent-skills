---
ticket: SUPERCHARGE-P3
title: Phase 3 — routing design decisions for all eleven P2 phase-3 inputs
status: draft
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
superseded_by: null
risk: low
surfaces:
  - plugins/foreman-line/docs/specs/
  - plugins/foreman-line/docs/kickstarters/
routing_class: standard-feature
data_classification: internal
---

## Intent

Resolve all eleven P2 phase-3 inputs (P3I-1..P3I-11) into reviewed design decisions plus a routing-policy change set, design-only. Output is decision records with options and recommendations, a routing-policy diff spec for accepted changes, and a test plan for the P3I-10 probe. No policy, validator, dispatch, schema, ceiling, order, or enum edit lands in this parcel unless an acceptance criterion explicitly scopes it — none does.

## Constraints

1. Base: `4d6407e` (`origin/main` at shaping time; zero drift). Shaping branch: `codex/supercharge-phase3-shaping-20260916`. Builder branch is separate at dispatch. Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
2. Parent directive: `plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md` (Phase 3 section). Inputs (read-only): SUPERCHARGE-P1 spec, SUPERCHARGE-P2 spec + findings (`foreman-line-supercharge-phase2-findings.md` lines 101-113), `routing-policy.yaml` (v0.3 + P1 + Nemotron), `validator.ts`, `dispatch/src/routing-eval/`, `skill-injection.yaml`, `spec-linter/schemas/spec-frontmatter.schema.json`, SPEC-CONVENTION, GMF charter D12/D13/D18/D24.
3. Design records only. No edits to policy, validator, dispatch, skill-injection, schemas, ceilings, tier order, or enum values. Every accepted change is recorded as a diff spec with its evidence, never applied.
4. Decision authority split — owner rulings required (carried as explicit decision requests with options, never assumed): P3I-7 (`routing_class` new values — F-3/AC-5), P3I-8 (`data_classification` schema-enum vs late failure — F-8), P3I-10 (`NO_ELIGIBLE_MODEL` negative probe — F-9), P3I-11 (role-aware dispatch vs tier-pinning + frontier cost posture — F-10/AC-4). Shaper-resolvable (options + recommendation, approved via review): P3I-1, P3I-2, P3I-3, P3I-4, P3I-5, P3I-6, P3I-9.
5. Role vocabularies stay owned: foreman-line roles (coordinator/verifier/builder), GMF D18 roles (researcher/reviewer/builder/tester/documenter — `builder` overlaps the policy roles; `adversarial` is not D18), skill-injection roles. Map them; do not merge, rename, or redefine any vocabulary owned by `heterogeneous-agent-worker-fabric`.
6. No fallback advocacy anywhere (GMF D13/D24). No provider calls and no live inference; prices are public catalog data only (allowed) and every price cites source + timestamp. Credential hygiene: presence-checks only.
7. Frozen `docs/goals/model-fleet-v1/` untouched; no GMF invariant weakened; no new model authorizations (the P1 closed set stands).
8. Notation: every factual claim cites `file:line` or a live source + timestamp.

## Design Tasks (per-P3I — inputs quoted verbatim from the P2 findings file)

> - P3I-1: Map or scope-out the four unmapped D18 roles (researcher/reviewer/tester/documenter — F-1); `builder` already mapped, adversarial covered outside D18.

Design: tier mapping or explicit out-of-routing-scope declaration per role; deconfliction note, no vocabulary merge.

> - P3I-2: Multimodal routing surface — roles, classes, transports, ceiling units for the 3 native pins (F-2).

Design: role ownership, class placement (existing vs candidate), transport custody, and ceiling units (token vs per-second) for `grok-imagine-video-1.5`, `gpt-image-2.5-flare`, `gemini-omni-1.1-flash`; misfiling fail-open (F-2 admission) closed by an explicit error path.

> - P3I-3: Frontier ceiling adequacy at $10/$50 price points (F-4).

Design: options for the $25 architecture/risk ceiling against $10/$50 frontier turns-to-exhaustion arithmetic; recommendation only, no ceiling edit here.

> - P3I-4: Haiku-vs-boilerplate-ceiling mismatch (F-5).

Design: resolve haiku-4.5 exceeding the $0.50 boilerplate ceiling inside one heavy turn (reposition, re-scope, or record-as-accepted with rationale).

> - P3I-5: Intentional standard-tier order vs dead-weight appends (F-6).

Design: rule for standard-tier order — intentional capability-first ordering vs removal/retention of unreachable appended ids (`glm-5.3`, `grok-4.6`, `muse-spark-1.3`).

> - P3I-6: Nemotron default move + third-party-served exception posture (F-7).

Design: ratify or revise the Nemotron-first economy default and the documented third-party-served exception for non-public data (declared transport + account settings posture).

> - P3I-7: `routing_class` new-value decision with candidates (F-3 + AC-5).

Design (OWNER DECISION REQUEST): adopt or reject candidate values (`media-generation`, `multimodal-edit`); any adoption concerted across frontmatter-schema + types + yaml (+ validator review) — yaml-only addition is valid-but-undispatchable.

> - P3I-8: `data_classification` schema-enum vs accepted late failure (F-8).

Design (OWNER DECISION REQUEST): enum-constrain `data_classification` in the spec-frontmatter schema (non-breaking additive, `permission_profile` pattern) or record late `UNKNOWN_DATA_CLASSIFICATION` failure as accepted.

> - P3I-9: Family-alias resolution design over the AC-6 inventory (may-alias-route vs must-pin, and what binds source + timestamp).

Design: may-alias-route vs must-pin ruling; if pinned, what binds source + timestamp (dispatch receipt extension vs separate resolution record).

> - P3I-10: `NO_ELIGIBLE_MODEL` is currently unreachable by construction (F-9) — the fail-closed path has no live exercise; decide whether a negative probe belongs in Phase 3 tests.

Design (OWNER DECISION REQUEST): negative-probe test plan — fixture-narrowed eligible set reaching `NO_ELIGIBLE_MODEL` without weakening shipped lists; owning suite; expected error string.

> - P3I-11: Role-aware dispatch vs tier-pinning-as-declared for coordinator/verifier (F-10); frontier cost posture — capability-first default vs price order (AC-4).

Design (OWNER DECISION REQUEST): role-aware `evaluateRouting` vs tier-pinning-as-declared; frontier order as capability-first default vs price order; whether the unreachable frontier tail earns its review surface.

## Allowed Files

- plugins/foreman-line/docs/specs/active/SUPERCHARGE-P3-phase3-design.md
- plugins/foreman-line/docs/specs/active/supercharge-p3-phase3-design.shaping-result.json

## Acceptance Criteria

- AC-1: Eleven decision records (one per P3I, keyed to the verbatim inputs above), each with options considered, a recommendation, and evidence cites (`file:line` or source + timestamp). The four owner-ruling P3Is (P3I-7, P3I-8, P3I-10, P3I-11) are carried as explicit decision requests with owner options — nothing assumed.
- AC-2: Routing-policy diff spec for accepted changes: per-change file + line-anchored edit list against `routing-policy.yaml` (v0.3 + P1 + Nemotron at base `4d6407e`), with validator-invariant impact noted per change. Diff spec only — the yaml on disk is byte-identical.
- AC-3: Test plan for the P3I-10 probe: fixture design that reaches `NO_ELIGIBLE_MODEL` without weakening shipped lists, owning suite (`routing-policy` vs `dispatch`), and the exact expected error string. Plan only — no test edited here.
- AC-4: Collision notes vs live routing tests: every diff-spec change names the existing validator / routing-eval tests it would touch on implementation, and states why no live test is edited in this parcel.
- AC-5: Change discipline: `git diff --name-only 4d6407e...HEAD` plus `git status --porcelain` show only Allowed Files (2 files, whether committed or untracked); no code, config, schema, ceiling, order, or enum touched.
- AC-6: Independent adversarial review of the eleven decision records filed as a closing section inside the design output itself (no separate review file exists); reviewer verdict per record (approve / request-changes with triage).
- AC-7: `npx tsx src/cli.ts validate "../docs/specs/active/SUPERCHARGE-P3-phase3-design.md"` exits 0 from `plugins/foreman-line/spec-linter/`.

## Out of Scope

Implementation of any P3I decision (no family syntax, no resolver, no resolution receipts, no cache/staleness policy); any `ceiling_usd` change; any tier-order change; any model addition, removal, or re-tiering; any `routing_class` or `data_classification` enum or schema change; any dispatch evaluator logic change; any fallback or retry semantics; Phase 4 enterprise plan; frozen `model-fleet-v1` evidence; GMF invariant changes; redefinition of any `heterogeneous-agent-worker-fabric` concept.

## Context & References

- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md
- plugins/foreman-line/docs/specs/active/SUPERCHARGE-P1-phase1-models.md
- plugins/foreman-line/docs/specs/active/SUPERCHARGE-P2-routing-analysis.md
- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase2-findings.md
- plugins/foreman-line/routing-policy/routing-policy.yaml
- plugins/foreman-line/routing-policy/src/validator.ts
- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/skill-injection/skill-injection.yaml
- plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json
- plugins/foreman-line/docs/goals/governed-model-fleet/charter.md (D12–D13, D18, D24)

## Verification Plan

```powershell
# from repo root (shaping worktree)
git diff --check
git diff --name-only 4d6407e...HEAD  # must be subset of Allowed Files
# from plugins/foreman-line/spec-linter/
npx tsx src/cli.ts validate "../docs/specs/active/SUPERCHARGE-P3-phase3-design.md"  # expect exit 0
```

Confirm `git diff` touches only Allowed Files. Mandated reviewer focus questions: (1) does any decision record smuggle implementation (family syntax, resolver behavior, cache policy, ceiling/order/enum edits) instead of recording design? (2) does any owner-decision P3I read as assumed rather than requested — is the owner's option set explicit? (3) does the diff spec stay byte-true to the yaml at base `4d6407e` (no drifted line anchors)? (4) does the P3I-10 test plan reach `NO_ELIGIBLE_MODEL` without weakening a shipped list? (5) does any record redefine a heterogeneous-fabric concept or grant a role authority it lacks?

## Stop-and-Report

Builder stops after design records + diff spec + test plan + collision notes + adversarial review are filed. No implementation edits, no builder branches beyond the dispatch worktree, no further dispatch. Final message is a Gate 2 request: paths, base HEAD, owner-decision vs shaper-resolvable split, lint self-check, and stop triggers or none.
