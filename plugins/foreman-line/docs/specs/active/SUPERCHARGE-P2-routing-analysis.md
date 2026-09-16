---
ticket: SUPERCHARGE-P2
title: Phase 2 — routing + frontmatter comprehensiveness analysis
status: active
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
superseded_by: null
risk: low
surfaces:
  - plugins/foreman-line/docs/kickstarters/
  - plugins/foreman-line/docs/specs/
routing_class: standard-feature
data_classification: internal
---

## Intent

Answer one question with evidence: can every parcel task class resolve to an authorized model for every role under every data classification, with no fallback model — and where it cannot, does it fail closed with a named error? Output is a findings doc only. Every gap becomes a named Phase-3 input; nothing is implemented, reordered, or redefined here. This is Phase 2 of the supercharge carryover; Phase 1 (model authorization) shipped as SUPERCHARGE-P1.

## Constraints

1. Base: `14f2be5`. Branch: `feat/supercharge-p2`. Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
2. Parent directive: `plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md` (Phase 2 section). Inputs (read-only): SUPERCHARGE-P1 spec + handoff, `routing-policy.yaml` (v0.3 + P1 + Nemotron), `validator.ts`, `dispatch/src/routing-eval/`, `skill-injection.yaml`, `spec-linter/schemas/spec-frontmatter.schema.json`, `shaping/src/self-check.ts` + tests, SPEC-CONVENTION §4, GMF charter D12/D13/D18/D24.
3. Analysis-only. No edits to policy, validator, dispatch, skill-injection, schemas, ceilings, tier order, or enum values. Every proposal is recorded as a Phase-3 input with its evidence, never applied.
4. No fallback advocacy anywhere (GMF D13/D24). A gap's only acceptable state is a named fail-closed error (`NO_ELIGIBLE_MODEL`, `UNKNOWN_CLASS`, validator invariant, or equivalent); silent substitution is reported as a defect, never a design.
5. Role vocabularies stay owned: foreman-line roles (coordinator/verifier/builder), GMF D18 roles (researcher/reviewer/builder/tester/documenter — `builder` overlaps the policy roles; `adversarial` is not D18, it lives in the dispatch/skill planes), skill-injection roles (builder/verifier_harness/adversarial_reviewer/coordinator/integration). Map them; do not merge, rename, or redefine any vocabulary owned by `heterogeneous-agent-worker-fabric` — record the deconfliction note instead.
6. Frozen `docs/goals/model-fleet-v1/` untouched; no GMF invariant weakened; no new model authorizations (the P1 closed set stands).
7. Notation: every factual claim cites `file:line` or a live source + timestamp. Prices are public catalog data (allowed); credentials never touched.
8. Alias inventory is Phase-3 input, not design here: OpenRouter `-latest` slugs observed 2026-09-14 (`anthropic/claude-fable-latest`, `x-ai/grok-latest`, `z-ai/glm-latest`), xAI `<model>`/`-latest` alias docs, OpenAI default-snapshot model. Record behaviors; resolve nothing.

## Allowed Files

- plugins/foreman-line/docs/specs/active/SUPERCHARGE-P2-routing-analysis.md
- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase2-findings.md

## Acceptance Criteria

- AC-1: Findings doc exists at the Allowed path with a decision matrix covering every `routing_class` (the 4 shipped values plus any newly identified candidate marked as such) × every role (policy roles plus D18 roles (researcher/reviewer/builder/tester/documenter) and skill-injection roles mapped per Constraint 5) × all 3 data classifications (`public`/`internal`/`restricted`, the exact keys of `routing-policy.yaml` `data_classification`); each cell states the resolving model ID or the exact fail-closed error — never a fallback or substitute ID.
- AC-2: Multimodal section gives a per-native-pin verdict (`grok-imagine-video-1.5`, `gpt-image-2.5-flare`, `gemini-omni-1.1-flash`): routable today or not, and what would be required to route it — stated as Phase-3 questions, not design.
- AC-3: Ceiling table shows turns-to-exhaustion arithmetic per model per class ceiling from cited live prices (frontier $10/$50 vs $25 architecture/risk ceiling included).
- AC-4: Tier-ordering verdict states whether current list order still expresses intended cost optimization with the P1 + Nemotron additions; any reorder is a Phase-3 input, not an edit.
- AC-5: `routing_class` enum verdict states whether new values are needed and names candidates with justification if so; no schema change here.
- AC-6: Alias inventory table (family → `-latest` slug presence → provider alias behavior → resolution implication) recorded as Phase-3 input.
- AC-7: Change discipline: `git diff --name-only 14f2be5...HEAD` plus `git status --porcelain` show only Allowed Files (2 files, whether committed or untracked); no code, config, schema, ceiling, order, or enum touched.
- AC-8: Independent adversarial review of the findings filed as a closing section inside the findings doc itself (no separate review file exists); the Phase-3 input list is that section's final artifact.

## Out of Scope

Phase 3 design or implementation (no family syntax, no resolver, no resolution receipts, no cache/staleness policy); Phase 4 enterprise plan; any policy/validator/dispatch/evaluator/skill-injection/schema edit; any `ceiling_usd`, tier-order, or enum change; any fallback or retry semantics; any new model authorization beyond the P1 closed set; frozen `model-fleet-v1` evidence; GMF invariant changes; redefinition of any `heterogeneous-agent-worker-fabric` concept.

## Context & References

- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-carryover.md
- plugins/foreman-line/docs/specs/active/SUPERCHARGE-P1-phase1-models.md
- plugins/foreman-line/docs/kickstarters/foreman-line-supercharge-phase1-handoff.md
- plugins/foreman-line/routing-policy/routing-policy.yaml
- plugins/foreman-line/routing-policy/src/validator.ts
- plugins/foreman-line/dispatch/src/routing-eval/index.ts
- plugins/foreman-line/skill-injection/skill-injection.yaml
- plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json
- plugins/foreman-line/docs/goals/governed-model-fleet/charter.md (D12–D13, D18, D24)

## Verification Plan

```powershell
# from repo root
git diff --check
git diff --name-only 14f2be5...HEAD  # must be subset of Allowed Files
# from plugins/foreman-line/spec-linter/
npx tsx src/cli.ts validate "../docs/specs/active/SUPERCHARGE-P1-phase1-models.md"  # P1 spec untouched; control
npx tsx src/cli.ts validate "../docs/specs/active/SUPERCHARGE-P2-routing-analysis.md"  # expect exit 0
```

Matrix completeness: cell count equals classes × roles × classifications with no empty cells; every gap cell names its error. Mandated reviewer focus questions: (1) does any "gap" cell actually resolve silently today, making the fail-closed claim false? (2) is any named error wrong — does that code path produce a different error or none? (3) does the role mapping grant authority a role lacks, or redefine a heterogeneous-fabric concept? (4) is the ceiling arithmetic reproducible from cited price sources? (5) does any finding smuggle Phase-3 design (family syntax, resolver behavior, cache policy) instead of recording an input?
