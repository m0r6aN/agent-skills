---
ticket: PAN-P01
title: Pantheon delegated workflow and pure boundary contracts
status: active
owner: clinton.morgan
created: 2026-10-19
updated: 2026-10-21
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


## Ratified EX9 revision-1 specification amendment — 2026-10-21T02:39:09.268Z

Actual EX9 receipt exceptions/EX-OM-PAN-001-09-ratification.json SHA256 d32aeafcc4bf041f74a7edc8dc87073054b67124f9b127fcc7175b19a429659f authorizes this same-scope correction. These requirements supersede earlier conflicting builder-window, checker-counter, operation-map and toolchain wording for this revision. Earlier observations and failed outputs remain historical evidence. This specification creates no new spending, claim, native-session, account, host, access or P00 repair authority. Exact builder clocks and heads are recorded separately at dispatch.

## Common obligations

Use only the exact 39 existing and six new paths in exceptions/EX-OM-PAN-001-09-rework-scope.json (756ce992039fe7678bed4fc10786e286a8eb1edf7149bbd66c57e3d8a7b664d1). Before dispatch, enumerate each builder's justified modified subset, pin prerequisite source, concrete jobs and final specification, and compare the complete Step 0. Reuse original sessions sequentially, one host-A worker. Historical EX9 used an uninterrupted absolute window; the ratified EX10 amendment below now governs remaining revision-1 builder time. Preserve all old failures and deadlines. No P00, general Runtime, analyzer, Verify, dependency, lockfile or global configuration changes. No paid requests, commits, pushes, merges or new agents by builders.

Revision-1 final verification uses at most three independent 60-minute source windows across both constituent heads. Both fresh whole-unit reviewers must cover the final exact subject. Packet coverage remains complete within the existing 1 MiB request bound; report size before claiming readiness. Changed source requires new whole-unit coverage.

New edit windows do not reset original session identities, native-session counts, the 12-model-call per-builder-session limit, paid attempts, source revision counters or cumulative dollars. The completed P00 cycle stays closed. Preserve $75 total, $35 bootstrap, $20.25 P00, $15 other-parcel/whole-unit and $6 request limits, the 20 bootstrap/120 total claim limits, all holds and existing expiry. Before optional recovery, reserve the unfinished mandatory claim/session floor.

## P01 correction obligations

1. Replace conflicting model.infer and patch.stage operation bindings with the typed Pantheon admission/terminal path selected by R7. Keep existing fleet-v2 semantics unchanged. Proposed bindings are pantheon.v1.model.infer -> ModelResult and pantheon.v1.patch.stage -> PatchStaged; P03 owns the versioned transactional implementation. Do not imply that parsing these references admits an effect. Update the matching coordinator parcel specification and behavioral tests.
2. Install the actual EX9 supersession in active Pantheon mandate, coordinator, skill, template and specification instructions as needed: separate initial and per-revision builder windows; source-check counters by whole-unit revision; operational counters by purpose and real identity; immutable P00 limits; unchanged money/call/session/access limits. Generic instructions for other goals remain intact. Existing true verification and repository gates stay automatic where evidence decides them.
3. Consolidate Node 24.19.0 and its already verified digest. Preserve the initial builder failure and later independent 867-pass history, clearly distinguishing dates and evidence. Use the previously demonstrated Linux scratch copy of identical source for full-suite verification, retaining actual commands and timeouts. No timeout inflation or test omission.
4. Preserve all boundary and hostile tests. Add assertions for the two corrected operation bindings and unchanged fleet-v2 non-equivalence. No authority receipt is manufactured by a pure validator.
5. Align strict malformed-string handling with the wire contract: invalid Unicode/JSON string escapes return MALFORMED_JSON, including escapes in object keys. Preserve duplicate decoded-key rejection and bounded resource precedence. Run the independently prepared shared edge-fixture bundle after correction; a refused input with a different code is not cross-language conformance.


### Exact revision-1 builder modified-file allowance

- plugins/foreman-line/README.md
- plugins/foreman-line/docs/COORDINATOR-PATTERN.md
- plugins/foreman-line/docs/standing-mandates/OM-PAN-001.md
- plugins/foreman-line/skills/goal/SKILL.md
- plugins/foreman-line/skills/parcel-driven-development/SKILL.md
- plugins/foreman-line/templates/kickstarters/loop-directive-template.md
- plugins/foreman-line/templates/kickstarters/builder-template.md
- plugins/foreman-line/templates/kickstarters/reviewer-template.md
- plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/index.ts
- plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/README.md
- plugins/foreman-line/dispatch/tests/pantheon-contracts.test.ts
- plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md

The specification itself is coordinator-owned and committed separately before implementation. Other source paths remain frozen. Add tests in these existing test files; do not add a new production fixture JSON path. The shared23-case test bundle is external evidence, mounted read-only as /wire/bundle.json with PANTHEON_WIRE_FIXTURES set. All original15 cases remain byte-identical. Test the required corrected codes, not current diagnostic outcomes.


## Ratified EX10 segment-2 specification amendment — 2026-10-21T11:32:33.521Z

Actual owner receipt exceptions/EX-OM-PAN-001-10-ratification.json SHA256 f643355f2dccedf9d6744feecd343145a98f7793b116f21f4ad6f7987e62e74b, message msg_01a15e39-49d5-73a2-9dfa-d09ffd3951d8 at 2026-10-21T11:29:35.189Z, binds proposal 1312dca562dfd4b889fd63ef202f4a7c0110ea284b8f9e83c6a40054b637e616. This is the current explicit supersession; earlier timings and failures remain historical evidence.

EX10 replaces only EX9's uninterrupted rework-clock rule. Each original P01–P05 builder has 2700 total dispatched seconds per existing rework revision (maximum two revisions), split into at most three segments. Each segment has an immutable start and absolute deadline, exact allowed scope, original identity and matching Step0. Charge ceil elapsed seconds through durable pinned freeze and explicit slot release; all waiting, analysis and tests while dispatched count. Missing/disputed/late/unproven freeze charges the full allocation and holds on overrun. No pause inside a segment. Only verified effect-free freeze ends it early; independent checking then runs separately. Resume only for a concrete same-scope finding after checker slot release and within the remaining ledger balance. Require full job timeout plus cleanup before launch. No reset by head, label, chat or proposal; failures remain. Initial windows, max135 cumulative builder minutes, source windows3 per whole-unit revision, operational counters, original-session12-call cap, eight native sessions, both fresh reviews, all paid budgets/attempts/accounts/hosts/access and closed P00 source remain unchanged.

No source acceptance, provider admission or new paid allowance follows from this specification. Both builders freeze before combined source check2/3. No source change after review may reuse stale seats.

### Current P01 segment2 requirements

Install actual EX10 authority and clock supersession in all nine listed documentary files, replacing current contradictory uninterrupted-window instructions. Preserve generic rules for other goals and all historical EX7/8/9 evidence. Executable contracts/tests stay byte-identical. Verify exact text coverage, links and modified-file allowlist, git diff --check, and unchanged executable/test digests; no implementation-mirroring new tests or unnecessary full-suite repeat for documentary-only edits. Final independent check still includes complete exact heads. Update handoff with real reporting, source manifest, original identity, clock and slot release.

Use at most 1943 seconds from dispatch through verified freeze (including setup, Step0, checks and reporting). Deadline is recorded at dispatch, never at planning. Allowed builder modifications are exactly:

- plugins/foreman-line/README.md
- plugins/foreman-line/docs/COORDINATOR-PATTERN.md
- plugins/foreman-line/docs/standing-mandates/OM-PAN-001.md
- plugins/foreman-line/skills/goal/SKILL.md
- plugins/foreman-line/skills/parcel-driven-development/SKILL.md
- plugins/foreman-line/templates/kickstarters/loop-directive-template.md
- plugins/foreman-line/templates/kickstarters/builder-template.md
- plugins/foreman-line/templates/kickstarters/reviewer-template.md
- plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md

This committed specification is coordinator-owned and frozen to the builder. No commits, network, credentials, new agents, paid requests or authority mutations by builders. Control evidence is written only inside the assigned artifact directory.


## B1 revision 2: bounded final correction

Coordinator specification frozen after independently sealed combined triage. The separate recorded dispatch starts the builder clock.

This correction retains the ratified intent and existing EX9 source families. EX10 supplies at most 2700 dispatched seconds in at most three segments for this second and final rework revision, using the original P01 session and slot. No additional native session, provider attempt, spending, access, P00 repair or third revision is created. Both revision-1 substantive reviews remain changes_required and historical; no revision-1 acceptance is inferred. Coordinator commits this specification alone before builder edits.

1. Define a language-independent text rule for every corresponding wire field. Preserve P01's current ECMAScript trimmed-text character set, including U+FEFF and excluding U+0085, explicitly enumerated in documentation. Require P02 to match that set instead of relying on .NET Trim defaults. Test leading/trailing characters and whitespace-only values, including FEFF,0085,00A0 and ordinary ASCII boundaries. Preserve structural-unverified results and all existing length/resource/unknown-field rules.
2. Constrain canonical UTC timestamps to years 0001 through 9999 in both implementations. Reject year0000 as INVALID_SHAPE; retain calendar validity, leap-day and exact-format checks. No date normalization or implicit timezone conversion. Add shared positive/negative cases and existing test-file coverage. This disposition is independently confirmed in the combined triage.
3. Document that parsing a correctly shaped effect hash and authority reference is not canonical descriptor derivation, permission resolution or admission. P03/P04 own exact descriptor-field hashing and mutation refusal at admission/execution. Preserve typed versioned operation semantics and existing fleet-v2 non-equivalence.
4. Update handoff with actual tests, failures, exact tested-byte linkage, remaining clock and explicit effect-free slot release. Preserve historical evidence. Coordinator updates the specification date to 2026-10-21; builder must not edit specification.

Exact builder paths: plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/index.ts; plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/README.md; plugins/foreman-line/dispatch/tests/pantheon-contracts.test.ts; plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md. No new path, dependency or active workflow-wide amendment is necessary for these structural corrections.

Run the full existing pinned offline Node24.19 job: Pi targeted tests, typecheck, complete tests and lint, retaining all869 prior tests and shared23 fixtures. Add meaningful edge regressions and shared new cases; test counts must account for all additions. Use exact source relocation and read-only Linux dependencies, network none, nonroot, existing resource limits and600-second timeout plus5-second cleanup. Full605-second margin must remain both before preparation and actual launch. Never edit source during a job. Freeze all19 reviewed files with hashes and raw command/result/cleanup evidence. Independent source checks and two fresh whole-unit reviews remain necessary.


This current revision-2 specification supersedes conflicting earlier revision-specific instructions only for this final correction. Both previous review verdicts remain changes_required. Independent combined disposition: parcel-dispatch-r7/b1-r1-terminal-triage/seat2/combined-disposition.json, SHA256 d69ff4c8a5d7e7dae1636124d70e4e08a7085bcdb7759bd24c066b0e80af49ba. Ratified EX10 receipt: exceptions/EX-OM-PAN-001-10-ratification.json, SHA256 f643355f2dccedf9d6744feecd343145a98f7793b116f21f4ad6f7987e62e74b. Existing EX9 scope, all monetary/claim/session/access limits and closed P00 source remain unchanged.

The explicit edge-whitespace set is U+0009–000D,0020,00A0,1680,2000–200A,2028,2029,202F,205F,3000,FEFF; U+0085 is excluded. Preserve separate control-character and stricter field-specific identifier/path rules. Shared bundle parcel-dispatch-r7/b1-r2-preparation/wire-bundle-r2.json, SHA256 2dc08eb860daa05ec58593b13aa9dd64bcf0b206d274d58b0b7a68504db56135, has51 cases with all original23 retained. Both implementations must satisfy identical structural/refusal outcomes. In P01 update the existing shared-test title/count/unique-ID expectations from23 to51; preserve the cases themselves. No fixture or synthetic success constitutes live Runtime admission.

Final exact allowance is listed below. Coordinator-owned specification is not a builder edit path. No new file or source family, commits, provider calls, credentials or agents by builders. Each dispatch has an absolute deadline and one active host-A worker. Charge the entire dispatched interval through durable freeze and explicit release, rounded upward; missing/late/unproven freeze spends the whole allocation. No pause inside a segment, reset by head/label, or job without its complete timeout/cleanup margin. Only independently confirmed effect-free freeze can recover time for a permitted later segment.

### Exact revision-2 builder modified-file allowance

- plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/index.ts
- plugins/foreman-line/dispatch/src/pantheon-runtime/contracts/README.md
- plugins/foreman-line/dispatch/tests/pantheon-contracts.test.ts
- plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/P01-HANDOFF.md
