---
ticket: FL-R2
title: Parse real active-spec YAML without losing declared risk
status: active
owner: clinton.morgan
created: 2026-09-05
updated: 2026-09-05
risk: elevated
surfaces: [plugins/foreman-line/integration/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Repair the real active-spec loader so the block-list surfaces used by current specs participate in declared-risk evaluation. This is a local repair candidate authorized by the user's 2026-09-05 non-destructive completion instruction, not existing W4 goal closure or CI enforcement promotion.

## Constraints

Base: 5ce6ddc7f996d764e506b6b421779fbf3ece689a. Branch: feat/foreman-line-FL-R2-20260905. Only the assigned fl-r2-audit-loader-20260905 worktree may change. Standing constraints apply: plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md.

Preserve public exports, status filtering and report-only exit semantics. Prefer the existing repository's yaml 2.9.0 parser over a bespoke partial YAML parser. Coordinator approves adding that exact runtime dependency to integration only, with offline lock update. No integration-to-spec-linter dependency. Plain Markdown/non-active valid specs remain excluded. Malformed frontmatter or malformed active risk/surfaces must produce typed POSTURE_INVALID rather than quietly dropping declared risk. Nonempty string-array surfaces and supported risk enum required for active specs. No schema or cross-package contract changes.

## Allowed Files

- plugins/foreman-line/integration/src/governing-spec.ts
- plugins/foreman-line/integration/tests/fl-r2-real-loader.test.ts
- plugins/foreman-line/integration/tests/governing-spec.test.ts
- plugins/foreman-line/integration/package.json
- plugins/foreman-line/integration/package-lock.json
- plugins/foreman-line/docs/kickstarters/FL-R2-handoff.md

## Acceptance Criteria

AC-1: Real temporary on-disk specs with inline and block-list surfaces, LF and CRLF, quoted strings and comments load correctly.
AC-2: Draft/done specs and plain Markdown do not govern; multi-spec evaluation preserves the highest declared risk.
AC-3: Malformed YAML, duplicate keys and active specs with missing/invalid risk or surfaces cannot silently vanish; errors are typed. No claim that all arbitrary YAML is valid frontmatter.
AC-4: The four baseline active-status specs load through the actual disk reader in a read-only corpus check; the new FL-R2 spec also loads in this worktree. Counts distinguish baseline from added specs.
AC-5: Focused real-loader regression tests fail against the old implementation; integration tests, typecheck and lint pass or exact environment blockers are recorded.
AC-6: Only Allowed Files change; final handoff states outcomes, limitations and no external activity.

## Out of Scope

Changing audit/DocSpine exit codes, branch rules, risk tiers, frozen spec schema, other goal records, live CI/services, provider calls, commits, pushes and merges.

## Context & References

- plugins/foreman-line/integration/src/governing-spec.ts
- plugins/foreman-line/integration/src/errors.ts
- plugins/foreman-line/spec-linter/src/validate.ts

## Verification Plan

Use D:/nvm/v24.19.0/node.exe explicitly. Offline npm ci --ignore-scripts and offline lock-only addition of yaml 2.9.0 are authorized only inside this new worktree after manifest inspection; no online fallback. Do not mutate source-checkout dependencies. Review focus: does malformed or block-list input disappear as low risk? Are the tests invoking real disk parsing? Does report-only behavior remain unchanged?

## Step 0 Ruling FL-R2-A1

The parent coordinator accepts the Step 0 blocker: the old governing-spec test pins zero runtime dependencies, contradicting this parcel's explicit yaml dependency. The additional Allowed File is authorized solely to replace that obsolete zero-dependency assertion with the reviewed yaml-only runtime boundary and continued absence of an integration-to-spec-linter dependency. Do not weaken unrelated assertions. This ruling precedes implementation and remains an uncommitted candidate amendment; no historical contract or committed authority claim is rewritten.
