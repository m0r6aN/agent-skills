---
ticket: PAN-P01
title: Pantheon delegated workflow and pure boundary contracts
status: active
owner: clinton.morgan
created: 2026-10-19
updated: 2026-10-20
risk: critical
routing_class: architecture/risk
surfaces: [plugins/foreman-line/docs/, plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/]
permission_profile: om-pan-001-native-bootstrap
data_classification: internal
---

# PAN-P01 implementation contract

The goal is to install the ratified Pantheon delegated workflow in active instructions and define pure, fail-closed application envelopes for later Runtime consumers. This is native preparation, not a Runtime admission or production terminal. PAN-P01 is a goal-local parcel ID; no Jira/Linear ticket is implied.

The immutable dispatch source is `parcel-dispatch-r7/P01-SPEC.md`, SHA-256 `cbec4ab9ccc4d5352f772e23c86d4121482ccf7d37c1393bddf4d0c4f9af393d`, under the canonical C: control root recorded in `docs/standing-mandates/OM-PAN-001.md`. The directive SHA-256 is `8329a3dc17f0bc9c1d009056d2d646f05e894b06e2648f01cfa87c4fe5801bd0`. That spec's earlier draft/preparation statements describe history. Actual P00 source acceptance and the distinct EX6 all-ten-finding closure exist; their exact pins and EX4/EX5/EX6 revision-2 authority are retained in the standing mandate. The original provider review remains `changes_required`.

Implementation is assigned to native slot three, `/root/p01_builder`, actual worker `01a15962-c00c-7341-a358-f81791084f18`, parent `01a15424-1fd5-77a2-a73a-d92a60a5de34`. Worktree is `C:/Users/clint/AppData/Local/Pantheon/OM-PAN-001/work/foreman-p01`, branch `codex/om-pan-001-p01`, base `64fb8949bf5134f96fda02df0d4f52ac291a6138`. Coordinator matched Step 0 before edits. The absolute original builder deadline is `2026-10-20T13:41:31.368Z`; a handoff or test failure does not extend it.

## Exact allowed files

1. `plugins/foreman-line/AGENTS.md`
2. `plugins/foreman-line/README.md`
3. `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
4. `plugins/foreman-line/docs/SPEC-CONVENTION.md`
5. `plugins/foreman-line/docs/standing-mandates/OM-PAN-001.md`
6. `plugins/foreman-line/skills/goal/SKILL.md`
7. `plugins/foreman-line/skills/foreman-shaping/SKILL.md`
8. `plugins/foreman-line/skills/parcel-driven-development/SKILL.md`
9. `plugins/foreman-line/templates/kickstarters/loop-directive-template.md`
10. `plugins/foreman-line/templates/kickstarters/builder-template.md`
11. `plugins/foreman-line/templates/kickstarters/reviewer-template.md`
12. `plugins/foreman-line/templates/kickstarters/shaping-template.md`
13. `plugins/foreman-line/docs/kickstarters/foreman-shaping-template.md`
14. `plugins/foreman-line/templates/AGENTS.md`
15. `plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/index.ts`
16. `plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/README.md`
17. `plugins/foreman-line/dispatch/tests/pantheon-contracts.test.ts`
18. `plugins/foreman-line/docs/specs/active/PAN-P01-delegated-contracts.md`
19. `plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md`

The first fourteen files include coordinator-prepared, unaccepted documentation amendments. Preserve unrelated goal gates and historical records. The only extra writes permitted are raw builder verification evidence in the designated goal-local `parcel-dispatch-r7/p01-builder-evidence` directory, never authority/acceptance receipts.

## Acceptance criteria

- A1–A10 apply only to verified active OM-PAN-001. Initial owner ratification and material expansion remain distinct from routine delegated shaping, Step 0, evidence gates and eligible merge. Current R7/EX4/EX5/EX6 limits, checker succession, independent closure and offline post-cutover rules are explicit. Other goals retain original gates.
- Public parsers accept `unknown`, return discriminated structural-unverified values or typed refusals, and cannot issue authority, human approval, effects or a second accounting engine.
- Dispatch and Step 0 bind full identity, exact files, role/profile/tools/network, all hashes, heads, deadlines, epoch and money categories. Every mismatch holds; unknown fields and malformed/traversing/glob paths refuse.
- Review result, provenance and independence checks separate content from capture authenticity. They reject empty/inconsistent/wrong-subject evidence, preserve unverified references and require P04/P05 trusted verification. Authority/security require two distinct fresh read-only seats under the named same-vendor exception.
- Money is nonnegative safe integer micro-USD with separate nullable estimate/reservation/provider/local/provisional/bill evidence. Missing values never become zero.
- Authority deltas identify material field expansion; ordinary evidence failure, unavailable dependency and routine rework are automatic holds.
- Closed private NDJSON request/response/completion frames carry full identity, exact artifact references and cursors. Bounds, duplicate decoded-key refusal, denial reason and recovery owner are frozen in the module README. Host authentication and durable completion remain P02–P05 responsibilities.
- Operation map uses exact application names and identifies consumers and bindings. Fleet inference/isolated staging semantics stay intact; successful worker/Git/Cortex contracts are explicitly proposed P03 extensions. B execution remains reserved P08. Custody control is separate and has a fixed profile.

## Current Runtime source context

Runtime baseline is `3da1a87f1519e1661b26059bfc773a446cc763f4`. The object-only `runtime-root` is not a missing repository; coordinator supplied exact Git blobs in `parcel-dispatch-r7/p01-runtime-contract-sources/index.json`, then the `runtime-p02` checkout. Read AuthorityGrant, AuthorityBinding, DecisionReceipt, IPermissionSpendGate and Permission contracts, plus pinned current store/verifier/DI/readiness snapshots, P03 preflight and the v2 vocabulary excerpt. P03 must preserve the existing atomic authority/accounting boundary and add its typed transaction; no second consuming gate, rollbackable public spend ledger or fake success/merge terminal is introduced.

## Required checks and final gates

Run exact package scripts `npm run typecheck`, `npm test`, `npm run lint` sequentially using the pinned supported Node image and ready dependency cache in `P01-verification-jobs.json`, SHA-256 `ae7a3bb7100af2dcf0c204847783fc86e5ee5b061430f76833cb0c978469a177`. Use unique checked container names, `--pull never`, `--network none`, non-root identity, read-only source/dependencies/image, bounded tmpfs/resources and 600 seconds per job or the earlier builder deadline. Preserve raw commands/output/exits/counts and cleanup. No host Node substitution, package install or cache/source-manifest edit.

The coordinator separately authorized deterministic existing Biome formatting on a `/tmp` copy of the exact two new TypeScript files under the same pinned offline profile; only those formatted bytes return to the allowed source paths. That source-authoring operation does not replace package lint or independent testing.

After freeze, the independent checker reproduces source tests and documentation scope/digests. B1 combines exact P01 and P02 source heads, spec/active-plan/trusted-test digests, and two fresh whole-unit frontier review passes. P02 may integrate against frozen unactivated P01; B1 acceptance is not claimed by this source file. Changed source invalidates affected coverage. Install accepted instructions only through supported package loading with exact loaded digests, never manual plugin-cache patching.

No builder commit/push/PR/merge, credentials, provider/network request, production effect, package dependency change, control-authority mutation, subagent or reviewer receipt is authorized. Return durable handoff and source/test evidence, freeze, and notify coordinator. Any later source change requires explicit bounded rework.
