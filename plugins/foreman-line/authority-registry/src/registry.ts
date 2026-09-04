import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'

export const R12_PRIOR_REGISTRY_COMMIT = '9059bb249f75805b34a68397d53dfa5608fd6ad4'
export const R13_PRIOR_REGISTRY_COMMIT = '0683bc059ec54a8652624fd2b7be72fe157cac14'
/**
 * The committed registry superseded by the R14 rework: the last commit that changed
 * `authority-enforcement-registry.yaml` before this one. Its short sha names the R14 migration
 * record, matching the convention used by every prior `registry-rework-*` id.
 */
export const R14_PRIOR_REGISTRY_COMMIT = 'df8155a01989f69e9872ef5c08bfc18ad6b8cb03'
/**
 * The committed registry superseded by the R24 volatile-region rework.
 *
 * R28 states the naming rule that was previously folklore: one record per rework round, named for
 * the commit that last touched the shipped YAML at the moment that round's regeneration is
 * committed - determined then, not pre-computed. Two YAML-touching commits landed after
 * `registry-rework-df8155a` without producing records, which is what made the convention look
 * per-commit. Measured with `git log -1 -- authority-enforcement-registry.yaml` at
 * implementation time.
 */
export const R15_PRIOR_REGISTRY_COMMIT = '40394be5fb7a5376579025513236019ad48dd86c'

export const R13_NORMATIVE_MARKDOWN_AUDIT_KEYS = [
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 1. Objective:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 2. Problem statement:list-item:4',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:1',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:list-item:6',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:1',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:4',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:6',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:7',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:1',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:4',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 13. Gate 1 decision list:list-item:10',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings:paragraph:1',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings:paragraph:2',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Blocker triage:table-row:B1',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Blocker triage:table-row:B2',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Blocker triage:table-row:B4',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Blocker triage:table-row:B5',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Blocker triage:table-row:B6',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Should-fix triage:table-row:S2',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Should-fix triage:table-row:S3',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Should-fix triage:table-row:S4',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Should-fix triage:table-row:S6',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Accepted and informational findings:table-row:A2',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Scoped Gate 1 re-open:paragraph:2',
  'fk-plan-review-findings:md-block:# Foreman Kernel — Plan-Level Adversarial Review Findings > ## Scoped Gate 1 re-open:paragraph:3',
  'fk-loop-directive:md-block:# Foreman Kernel — Coordinator Loop Directive > ## COORDINATOR OWNERSHIP — read before dispatching anything:paragraph:4',
  'fk-loop-directive:md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P0 — Canon authority and enforcement registry',
  'fk-loop-directive:md-block:# Foreman Kernel — Coordinator Loop Directive > ## Queue and dependency order:table-row:FK-P19 — High-confidence refusal enforcement',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 1. Purpose:paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 2. Folder Structure:paragraph:2',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 2. Folder Structure:list-item:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 3. Spec Lifecycle:table-row:`done`',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:2',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.7 `surfaces:` Canonical Vocabulary (added W0-P2):paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:4',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.2 Constraints:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.4 Out of Scope:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.5 Context & References:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.5 Context & References:paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 6. Context Budget Discipline:list-item:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 7. Security & Content Rules:paragraph:2',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 7. Security & Content Rules:paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 9. Known Trade-offs (Honest Ledger):table-row:Versioned, reviewable, diffable context',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 9. Known Trade-offs (Honest Ledger):table-row:Parallel agent dispatch without context collisions',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 11. Coordinator-Ratified Amendment Pattern (added W0-P2):paragraph:1',
  'coordinator-pattern:md-block:# The Coordinator Pattern:paragraph:1',
  'parcel-driven-development:md-block:(preamble):paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Core Principle:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Core Principle:paragraph:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When to Use This Skill:list-item:9',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When to Use This Skill:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Modes > ### Multi-Project Initiative Mode:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Modes > ### Multi-Project Initiative Mode:list-item:8',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Modes > ### Multi-Project Initiative Mode:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Vocabulary > ### Integration Parcel:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Vocabulary > ### Release Gate:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Time, Calendars, and the Two Clocks > ### Calendar time belongs to coordination gates:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Time, Calendars, and the Two Clocks > ### Calendar time belongs to coordination gates:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Time, Calendars, and the Two Clocks > ### Execution time belongs to parcels:list-item:6',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase -2: Initiative Classification:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase -2: Initiative Classification:list-item:6',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase -1: Repo and Project Discovery:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase -1: Repo and Project Discovery:list-item:8',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 0: Initiative Strategy:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 0: Initiative Strategy:list-item:10',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 0: Initiative Strategy:list-item:12',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 0: Initiative Strategy:paragraph:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 0: Initiative Strategy:paragraph:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:6',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:14',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 3: Parallel Parcel Dispatch:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 4: Assembly and Integration:paragraph:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 4: Assembly and Integration:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 5: Hardening and Release Readiness:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 5: Hardening and Release Readiness:list-item:14',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 5: Hardening and Release Readiness:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Multi-Project Initiative Artifacts:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Persistence Layer:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Persistence Layer:paragraph:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Integration Surface Template:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Integration Scenario Matrix:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Environment Readiness Matrix:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Security Gate Orchestration:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Security Gate Orchestration:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Release Gates:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Shape Guidance > ### Good parcel types:list-item:14',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Shape Guidance > ### Bad parcel types:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Shape Guidance > ### Sizing:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Spec Template:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Branch and Worktree Hygiene > ### Merge pattern:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Serialization Points:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Serialization Points:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Contract Amendment Rule:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Contract Amendment Rule:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Dispatch Patterns > ### Pattern: Integration dispatch:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Dispatch Patterns > ### Pattern: Release gate pass:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Agent expanded scope:list-item:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Integration scenario fails:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Integration scenario fails:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Persistent state drifts from repo reality:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Anti-Patterns to Avoid:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Anti-Patterns to Avoid:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Output Artifacts From This Skill:list-item:15',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Output Artifacts From This Skill:list-item:16',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Final Notes:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Final Notes:list-item:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Final Notes:list-item:3',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage A — Intake & Shaping:paragraph:1',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage A — Intake & Shaping:paragraph:2',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage A — Intake & Shaping:paragraph:3',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage C — Dispatch & Build:list-item:4',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage C — Dispatch & Build:list-item:6',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage D — Verification:list-item:3',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 2. Pipeline Stages > ### Stage E — Integration:list-item:1',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 3. Locked Decisions (with reasoning):table-row:D3',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 3. Locked Decisions (with reasoning):table-row:D5',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Coordinator',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 5. Model Routing Policy (v0 shape):table-row:Security-audit parcels & security review',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 6. Risk-Driven Audit Triggers (killing the "somehow"):list-item:1',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 6. Risk-Driven Audit Triggers (killing the "somehow"):list-item:4',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 7. Open Questions (decide before W1 exit) > ### 7a. DocSpine Transfer Checklist (evening before demo):list-item:4',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 7. Open Questions (decide before W1 exit) > ### 7a. DocSpine Transfer Checklist (evening before demo):list-item:5',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 8. Build Plan — Waves & Parcels > ### W1 — Intake & Registration:list-item:4',
  'foreman-line-plan:md-block:# The Foreman Line — Master Plugin Plan > ## 8. Build Plan — Waves & Parcels > ### W3 — Verification:list-item:4',
] as const

export const R13_NORMATIVE_MARKDOWN_PUBLICATION_KEYS: ReadonlySet<string> = new Set([
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 3. Authority hierarchy:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Common decision envelope:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 5. First-release architecture > ### Initial enforceable refusal classes:paragraph:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:1',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 7. Explicitly not doing in this goal:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:2',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:3',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:4',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:6',
  'fk-charter:md-block:# Goal Charter — Foreman Kernel > ## 12. Known serialization points and repo constraints:list-item:7',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:2',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:4',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.2 Constraints:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.4 Out of Scope:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.5 Context & References:paragraph:1',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.5 Context & References:paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 6. Context Budget Discipline:list-item:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 7. Security & Content Rules:paragraph:3',
  'spec-convention:md-block:# Spec-Driven Development Convention > ## 11. Coordinator-Ratified Amendment Pattern (added W0-P2):paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Core Principle:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Core Principle:paragraph:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 1: Contracts PR:list-item:6',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 3: Parallel Parcel Dispatch:list-item:7',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Phase 5: Hardening and Release Readiness:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Environment Readiness Matrix:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Security Gate Orchestration:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Release Gates:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Shape Guidance > ### Sizing:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Parcel Spec Template:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Branch and Worktree Hygiene > ### Merge pattern:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Serialization Points:paragraph:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Contract Amendment Rule:paragraph:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Contract Amendment Rule:paragraph:2',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Dispatch Patterns > ### Pattern: Integration dispatch:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Dispatch Patterns > ### Pattern: Release gate pass:list-item:3',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Integration scenario fails:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Integration scenario fails:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Security gate fails:list-item:5',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## When Things Go Wrong > ### Persistent state drifts from repo reality:list-item:4',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Final Notes:list-item:1',
  'parcel-driven-development:md-block:# Parcel-Driven Development Skill > ## Final Notes:list-item:2',
] as const)

export interface FrozenMarkdownRuleTarget {
  readonly sourceId: string
  readonly kind: 'line-excerpt' | 'numbered-item' | 'table-row'
  readonly anchor: string
}

export const R12_LEGACY_MARKDOWN_RULE_TARGETS: Readonly<Record<string, FrozenMarkdownRuleTarget>> =
  {
    'rule.spec-convention.e6f5fa8543a1': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:4',
    },
    'rule.spec-convention.ac5ff7afd06f': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:list-item:1',
    },
    'rule.spec-convention.5145ab15549c': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:list-item:2',
    },
    'rule.spec-convention.fd82127bf9f9': {
      sourceId: 'spec-convention',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:3',
    },
    'rule.spec-convention.022fc00afe7b': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 8. Dispatch Model (How Agents Consume Specs):list-item:4',
    },
    'rule.coordinator-pattern.dedbefc1b097': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:1',
    },
    'rule.coordinator-pattern.91dd60b00fd6': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:2',
    },
    'rule.coordinator-pattern.f7686ab58db7': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:3',
    },
    'rule.standing-constraints.c5880644c95c': {
      sourceId: 'standing-constraints',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Standing Constraints — included by reference in every dispatch kickstarter:paragraph:1',
    },
    'rule.foreman-line-plan.two-gate-thesis': {
      sourceId: 'foreman-line-plan',
      kind: 'line-excerpt',
      anchor: 'md-block:# The Foreman Line — Master Plugin Plan:paragraph:1',
    },
    'rule.spec-linter-readme.9a889881a236': {
      sourceId: 'spec-linter-readme',
      kind: 'table-row',
      anchor:
        'md-block:# @foreman-line/spec-linter > ## The four v0.2 fields:table-row:`permission_profile:`',
    },
    'rule.spec-linter-readme.b4f5d76d68ec': {
      sourceId: 'spec-linter-readme',
      kind: 'line-excerpt',
      anchor: 'md-block:# @foreman-line/spec-linter > ## The four v0.2 fields:paragraph:1',
    },
    'rule.permission-profiles-readme.729be3615f8d': {
      sourceId: 'permission-profiles-readme',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Deny-first ruling (D9):paragraph:1',
    },
    'rule.permission-profiles-readme.d11b9d38f924': {
      sourceId: 'permission-profiles-readme',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):paragraph:1',
    },
    'rule.permission-profiles-readme.1101805f1c9e': {
      sourceId: 'permission-profiles-readme',
      kind: 'numbered-item',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):list-item:2',
    },
    'rule.permission-profiles-readme.415efa3f5e3b': {
      sourceId: 'permission-profiles-readme',
      kind: 'numbered-item',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):list-item:3',
    },
  }

export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'authority-enforcement-registry', schema: authorityEnforcementRegistrySchema },
]
