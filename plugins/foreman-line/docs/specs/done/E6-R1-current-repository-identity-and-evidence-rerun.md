---
ticket: E6-R1
title: Current-repository identity normalization and observable A-to-F evidence rerun
status: done
owner: clinton.morgan
created: 2026-09-06
updated: 2026-09-06
supersedes: null
superseded_by: null
risk: elevated
surfaces: [plugins/audit-suite/, plugins/foreman-line/, skills/parcel-compiler/, docs/receipts/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

# E6-R1 — Current-repository identity and evidence rerun

## Intent

Make `m0r6aN/agent-skills` the sole repository identity carried by this tree and
replace the unresolvable historical CLOSE-P1 account with current-instance
evidence. The parcel normalizes the exact tracked legacy-reference inventory,
retires the two stale registration sidecars into non-registration migration
provenance, recaptures live rules evidence,
and uses its own lifecycle to produce an observable six-receipt A→F chain. The
evidence-vehicle and goal-complete pull requests remain human-merge stops.

## Constraints

- The controlling authority is the ratified E6-R1 amendment at
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1-current-repository-evidence-rerun-amendment.md`.
  Its locked decisions may not be weakened or widened by the builder. Ratified
  E6-R1B at
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1b-marketplace-and-evidence-guard-amendment.md`
  adds only the bounded marketplace and evidence guards stated below.
- `m0r6aN/agent-skills` is the sole canonical repository. Canonical GitHub URLs
  use `https://github.com/m0r6aN/agent-skills`; repository-relative examples
  must resolve inside this checkout. No write to the former inaccessible source
  or any other repository is allowed.
- The 2026-09-06 tracked baseline is exactly **42 files / 79 matching lines**
  under the coordinator-frozen case-insensitive legacy-repository expression.
  This number defines the identity-migration inventory, not permission to
  rewrite generic product or organization history outside those 79 lines.
- The 42 identity-bearing files are listed verbatim under `Allowed Files`.
  `plugins/foreman-line/integration/tests/effective-rules.test.ts` and root
  `.claude-plugin/marketplace.json` are the only additional existing builder
  files: the live recapture necessarily invalidates the test's hard-coded July
  expectations, and the marketplace needs one `audit-suite` entry. The two new
  migration-record paths are the other additions. No other implementation path
  is implied by the larger `surfaces` metadata.
- The root marketplace retains the name `m0r6an-agent-skills` and gains exactly
  one `audit-suite` entry whose source is `./plugins/audit-suite/audit-suite`.
  Every living Audit Suite install/update/team-settings/enabled-plugin identifier
  uses `audit-suite@m0r6an-agent-skills`; no marketplace publication is implied.
- Living manifests, install instructions, URLs, and paths become current and
  functional. A historical command, transcript, kickstarter, completed spec,
  or findings record must not silently masquerade as a rerun after its
  repository identifier is normalized. Every such affected historical file
  receives this substance in a prominent note: repository identifiers and
  paths were normalized on 2026-09-06 to `m0r6aN/agent-skills`; recorded
  commands were not rerun; other historical outcomes remain as captured.
- Delete the two stale active `*.registration.json` sidecars. Replace them with
  `receipt-chain-walker.repository-migration.json` and
  `scaffold-migration.repository-migration.json`. Each replacement is explicitly
  not a `RegistrationResult`: it preserves the historical ticket keys, records
  reachable import commit `48d1db73ad0a6e9c2d9bd76f92f3a44d9fb7fcf0`,
  names the corresponding current `docs/specs/done/` path and SHA-pinned
  `https://github.com/m0r6aN/agent-skills` permalink, and states that no current
  bidirectional ticket link is claimed. The commit contains both current targets:
  `SCAF-P2-shared-test-scaffold-extraction.md` and
  `SCAF-P3-receipt-chain-walker.md`.
- The effective-rules fixture is a new live capture, not an edited historical
  response. Capture the branch-rules endpoint plus the complete ruleset
  responses needed to account for every merge-gating `ruleset_id` observed on
  `main`; record the exact read-only `gh api` commands, timestamp, full current
  `main` SHA, and verbatim parsed response bodies. Update the fixture consumer
  to aggregate all captured bypass lists and assert current invariants rather
  than July-specific counts. Current rulesets `17746056` and `22369510` are
  read-only evidence inputs; drift is a coordinator stop, never a builder fix.
- No frozen contract or shipped emitter is changed. Stage A consumes
  `approval`'s real projection/interactive approval path and
  `mintGenesisReceipt`; Stage B uses the exported `mintStageBReceipt` with a
  schema-valid `RegistrationResult` and does **not** call Jira `register()`;
  Stage C uses the real permission-profile dispatch/worktree path. Stage D
  uses `assembleVerdict`, then the already-ratified CLOSE-P1 coordinator
  verdict-stage procedure: mint one `kind:'stage'`, `stage:'D'`,
  `claimRef:null`, `subjectKind:'VerificationVerdict'` receipt directly from
  that real verdict using the shipped canonicalize/hash/path/validate/write
  primitives. It inherits `workflowId` and `correlationId` from C, mints only
  fresh `sessionId` and `runId`, and uses sequence 3 with C's hash as `prevHash`.
  `emitVerificationVerdict` is deliberately not used because it emits a claim
  receipt that `runStageE` correctly rejects as a predecessor. Stage E uses
  `runStageE`; Stage F uses `runStageF` → `emitClosureReceipt`.
- The chain contains exactly six conforming `ReceiptDocument` files, sequences
  0–5 with stages exactly `A,B,C,D,E,F`. Dispatch auxiliaries
  (`routing-decision.json`, `skill-injection.json`, `kompress.json`) are retained
  as truthful evidence but are not conforming six-digit receipt files. Review
  evidence is persisted outside the receipt directory. Validation must therefore
  load only the conforming receipt names before calling `validateChain` and
  `isSealed`; the receipts directory CLI, which reads every `.json`, is not the
  exit check.
- No receipt is minted speculatively. Rework and both implementation reviews
  finish before the single Stage-D verdict-stage receipt is emitted. Review or
  verdict helpers that would add Stage-D claim receipts are not used for emission
  in this exact-six vehicle.
- E/F observability is a coordinator process invariant. Immediately before each
  emission, the coordinator reads the relevant GitHub PR data, asserts that the
  supplied PR/head or merge values equal the observed data, and persists the raw
  evidence outside the receipt directory. The deterministic exit repeats those
  binding checks. Frozen `runStageE` and `runStageF` remain pure consumers of
  already-observed values; no helper-level network enforcement is added.
- Stage B uses exactly one scoped issue titled with `[TEST]` in
  `m0r6aN/agent-skills`. The issue body first links the SHA-pinned approved spec.
  A subsequent real branch commit mentions and links the issue; an issue
  comment links that commit and its SHA-pinned spec permalink. The
  `RegistrationResult` uses one unambiguous issue key
  (`m0r6aN/agent-skills#<number>`) and both `ticket->commit` and
  `commit->ticket` entries for that same commit. If either direction cannot be
  observed, Stage B stops without minting.
- After corrected plan-review PASS, the final active spec is committed and Stage A
  stops for human approval. Clint explicitly supplies the exact approval slug
  `e6-r1-current-repository-identity-and-evidence-rerun` when requested. The
  coordinator may relay that human-provided value into the interactive TTY but
  may not infer or manufacture it.
- E6-R1 Gate 2 is granted for the isolated builder and two independent reviewers,
  contingent on the corrected plan-review PASS and human Stage-A approval. Stage C
  creates a new isolated builder worktree only through the shipped dispatch path
  after Stage B is durable. The builder begins with Step 0, restates the 46 exact
  Allowed Files, and makes no receipt, issue, push, PR,
  merge, ruleset, or other-repository write.
- E6-R1B extends that Gate-2 grant only to bounded rework by the same builder and
  two independent read-only re-reviews of the final SHA. The rework begins with
  its own Step 0 and restates the amended 46-file boundary before any edit.
- Two independent adversarial implementation reviews are mandatory. Reviewers
  are read-only and do not fix or commit. Any blocker or required rework is
  resolved and both reviews rerun before the coordinator assembles and emits
  the one final passing Stage-D verdict.
- After A–D and the implementation are committed, the evidence branch is
  pushed and one identity-migration PR is opened. Freeze its final head after
  all required checks are successful, then emit Stage E with
  `prRef = pr-<number>@<full-40-character-head-sha>`, the identical `headSha`,
  observed CI outcomes, and the observed audit-trigger result. Stage E is not
  added to that PR because doing so would change the head it attests.
- Stop for Clint to merge the evidence PR. Human provenance comes from Clint's
  explicit task-level merge confirmation and the recorded coordinator stop;
  GitHub's `mergedBy`, timestamp, and merge SHA are binding corroboration, not
  proof that a shared credential was human-operated. After the merge is observed,
  create the goal-complete branch from current `main`, move this spec locally from
  `active/` to `done/`, and only then emit Stage F with the exact merge SHA so its
  lifecycle claim is already true. The frozen `ticketTransition` records the
  observed test issue state as a no-op (`fromStatus === toStatus`) unless a
  separately authorized issue-state change occurred; E6-R1 does not authorize
  Jira or issue closure.
- The second, goal-complete PR persists Stage E, Stage F, the completed spec
  move, and the final closeout evidence. It is also human-merged. Neither PR is
  agent-merged. Zero required approvals under D4-R2B remains an explicit
  sole-owner limitation and is never described as independent human approval.
- Coordinator-generated control-plane artifacts (projection, approval, the new
  E6-R1 Stage-B registration sidecar, the workflow-ID receipt directory, verification
  envelope, closeout record, and lifecycle move) are outside builder mutation
  authority. The two stale historical sidecars and their two replacement migration
  records are explicitly in builder scope. All other control-plane artifacts are
  created only by the coordinator at their actual events under the ratified
  amendment; the builder must not pre-create or edit them.

## Allowed Files

The first 42 paths are the exact identity-bearing baseline, including the two
stale sidecars that will be deleted. Paths 43–45 are the fixture-consumer
adjustment and two replacement migration records ratified by E6-R1A. Root
`.claude-plugin/marketplace.json` is the sole 46th path ratified by E6-R1B.

1. `plugins/audit-suite/audit-suite/.claude-plugin/plugin.json`
2. `plugins/audit-suite/audit-suite/README.md`
3. `plugins/foreman-line/.claude-plugin/plugin.json`
4. `plugins/foreman-line/.codex-plugin/plugin.json`
5. `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md`
6. `plugins/foreman-line/docs/goals/permission-profile-registry/loop-directive.md`
7. `plugins/foreman-line/docs/goals/permission-profile-registry/p3-adversarial-review-B-findings.md`
8. `plugins/foreman-line/docs/kickstarters/foreman-line-build-CLOSE-P3.md`
9. `plugins/foreman-line/docs/kickstarters/foreman-line-build-SCAF-P3.md`
10. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P1.md`
11. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P2.md`
12. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P3.md`
13. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P4.md`
14. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W3-P1.md`
15. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W3-P4.md`
16. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W4-P4.md`
17. `plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-loop.md`
18. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-DOCS-P1.md`
19. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-SCAF-P1.md`
20. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-SEC-1.md`
21. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P2.md`
22. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P3.md`
23. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P4.md`
24. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P5.md`
25. `plugins/foreman-line/docs/kickstarters/foreman-line-shaping-P1.md`
26. `plugins/foreman-line/docs/specs/active/receipt-chain-walker.registration.json`
27. `plugins/foreman-line/docs/specs/active/scaffold-migration.registration.json`
28. `plugins/foreman-line/docs/specs/done/P1-permission-profile-registry-schema.md`
29. `plugins/foreman-line/docs/specs/done/P2-dispatch-order-permission-profile-field.md`
30. `plugins/foreman-line/docs/specs/done/P4-spec-linter-permission-profile-enum.md`
31. `plugins/foreman-line/docs/specs/done/W0-P1-pipeline-stage-contracts.md`
32. `plugins/foreman-line/docs/specs/done/W0-P3-routing-policy-schema-validator.md`
33. `plugins/foreman-line/docs/specs/done/W0-P4-receipt-chain-schema-validator.md`
34. `plugins/foreman-line/docs/specs/done/W0-P5-skill-injection-matrix-schema-validator.md`
35. `plugins/foreman-line/docs/specs/done/W1-P1-shaping-agent.md`
36. `plugins/foreman-line/docs/specs/done/W1-P2-epic-story-projection.md`
37. `plugins/foreman-line/docs/specs/done/W1-P3-human-approval-flow.md`
38. `plugins/foreman-line/docs/specs/done/W1-P4-jira-registration.md`
39. `plugins/foreman-line/docs/transcripts/build-W0-P1-deterministic-pass.md`
40. `plugins/foreman-line/integration/tests/fixtures/effective-rules-live-capture.json`
41. `skills/parcel-compiler/docs/specs/done/PCC-P0-pcc-cli-scaffold.md`
42. `skills/parcel-compiler/docs/transcripts/build-PCC-P0-deterministic-pass.md`
43. `plugins/foreman-line/integration/tests/effective-rules.test.ts`
44. `plugins/foreman-line/docs/specs/active/receipt-chain-walker.repository-migration.json`
45. `plugins/foreman-line/docs/specs/active/scaffold-migration.repository-migration.json`
46. `.claude-plugin/marketplace.json`

## Acceptance Criteria

1. A pre-edit inventory captured from the builder base reports exactly 42
   tracked files and 79 matching lines for the locked legacy expression. The
   post-edit tracked search reports zero matches. A separate search confirms no
   new repository identity other than `m0r6aN/agent-skills` was introduced.
2. Every current manifest/install/path/link use resolves to
   `https://github.com/m0r6aN/agent-skills`. Each migrated historical artifact
   that contained recorded commands or outputs carries the explicit 2026-09-06
   migration annotation and does not claim those commands were rerun.
   The existing `m0r6an-agent-skills` root marketplace declares `audit-suite`
   at `./plugins/audit-suite/audit-suite`; that source exists, its nested plugin
   manifest is named `audit-suite`, and the changed README has no living
   `audit-suite@kaseya-one` or `kaseya-one` marketplace key.
3. Both stale `*.registration.json` sidecars are absent from the builder result.
   Their two replacement `*.repository-migration.json` files are parseable JSON,
   are explicitly typed as non-registration provenance, preserve the corresponding
   historical ticket keys, and disclaim current bidirectional ticket links. Each
   records full reachable commit
   `48d1db73ad0a6e9c2d9bd76f92f3a44d9fb7fcf0`, the matching current `done/`
   target, and its SHA-pinned `m0r6aN/agent-skills` permalink.
   `git cat-file -e <sha>:<path>` succeeds for both targets. Neither replacement
   validates as, nor is consumed as, a `RegistrationResult`.
4. The effective-rules fixture records newly fetched current responses with
   exact read-only commands, capture timestamp, and full current `main` SHA.
   A fresh read-only recapture is structurally equal to every stored `capture`.
   The updated normalization tests consume every captured merge-gating ruleset,
   aggregate bypass actors, and assert the current effective rule types without
   July-specific dates, counts, IDs, enterprise rules, or old repository names.
   For each captured merge-gating ruleset the test binds integer `id`, non-empty
   `name`, `target:'branch'`, current repository source, active enforcement,
   object `conditions`, array `rules`, and array `bypass_actors`. An in-memory
   stripped-capture mutation proves that structural assertion turns red without
   byte-pinning the full response.
5. After coordinator lint, corrected plan-level adversarial-review PASS, and a
   commit containing the final active spec, the real approval CLI stops at its
   interactive TTY prompt. Clint explicitly supplies
   `e6-r1-current-repository-identity-and-evidence-rerun`; the coordinator only
   relays that exact human-provided value. The approved active spec, projected
   ShapingResult, approval sidecar, and Stage-A receipt are then produced by the
   shipped approval path. The receipt is sequence 0, stage A, and binds the
   approved spec-set hash.
6. Exactly one `[TEST]` GitHub issue exists for this run. The issue→commit and
   commit→issue links are independently observable in GitHub and match the
   Stage-B `RegistrationResult` commit SHA, issue key, and SHA-pinned spec
   permalink. `mintStageBReceipt` emits sequence 1/stage B chained to A; Jira
   registration and transport calls remain zero.
7. Under the explicit contingent E6-R1 Gate-2 grant, `executeDispatch` creates a
   previously absent isolated builder worktree and
   emits sequence 2/stage C chained to B. Its `DispatchOrder` names E6-R1,
   `builder-architecture`, resolved skills/routing evidence, and the builder's
   Step-0 restatement. The builder branch begins at the coordinator-approved
   base and changes only the 46 Allowed Files.
8. The builder's diff performs the complete identity migration, historical-sidecar
   retirement and migration-record replacement,
   fixture recapture, and fixture-test adjustment with no frozen-contract,
   emitter, workflow, ruleset, or unrelated change. All applicable local tests,
   typecheck, lint, JSON parsing, link/path checks, and tracked-search checks pass.
9. Two independent read-only reviewers assess the same final builder SHA. Any
   required rework occurs before D and is re-reviewed. The coordinator combines
   deterministic harness evidence and both final reviews into one schema-valid
   passing `VerificationVerdict`. Using the ratified CLOSE-P1 direct
   verdict-stage procedure and shipped receipt primitives, the coordinator emits
   exactly one conforming sequence-3 `kind:'stage'`/stage-D receipt whose subject
   is that verdict. `validateReceiptDocument` and `validateChain([A,B,C,D])`
   succeed, and `runStageE` accepts D as its predecessor. No Stage-D claim receipt
   or verification envelope is emitted.
10. The evidence-vehicle PR is in `m0r6aN/agent-skills`, carries A–D plus the
    implementation, and has successful required `test` and
    `integration-report` conclusions on its frozen final head. Stage E is then
    emitted with the actual PR number and identical full head SHA; GitHub proves
    the SHA is the PR's `headRefOid` and a PR commit. Immediately before Stage E,
    the coordinator observes and persists the GitHub PR data and asserts the
    supplied PR/head values match it; the frozen emitter remains a pure consumer.
11. Clint, not an agent, merges the evidence-vehicle PR. Clint's explicit task-level
    confirmation plus the coordinator's recorded stop supplies human provenance;
    GitHub's `mergedBy`, event time, and `mergeCommit.oid` corroborate the binding.
    Immediately before Stage F, the coordinator persists those observations and
    asserts the supplied merge values match them; the frozen emitter remains pure.
    The goal-complete branch is created from current `main`, this spec is moved
    locally from `active/` to `done/`, and Stage F is only then emitted with that
    exact merge SHA, an honest no-op issue state record unless separately authorized,
    and the already-performed active→done lifecycle move.
12. Loading only conforming six-digit receipt filenames in sequence order yields
    exactly six documents with stages exactly `['A','B','C','D','E','F']`.
    `validateChain(chain).valid === true`, `isSealed(chain) === true`, Stage E's
    PR/head binding matches GitHub, and Stage F's human-merge binding matches
    GitHub. No fixture, old workflow, or manually reconstructed receipt satisfies
    this criterion.
13. The goal-complete PR persists E/F, moves this spec to `done/`, records the
    deterministic and observable cross-checks, and states the D4-R2B zero-approval
    limitation. Required checks succeed on its frozen head and Clint human-merges
    it. A fresh fetch proves the sealed chain and closure record on current main.
14. The entire run creates only the ratified test issue and two PRs. There are
    no Jira writes, ruleset mutations, agent merges, issue-state mutations,
    writes to another repository, historical missing-SHA substitutions, or
    hand-built representations of live API responses.

## Out of Scope

- Any generic removal of the KaseyaOne product/organization name beyond the
  locked legacy-repository expression.
- Any Jira issue, comment, link, transition, or MCP call; `register()` and live
  `executeClosure()` remain unused.
- Creating, editing, disabling, or deleting GitHub rulesets or repository
  settings, including rulesets `17746056` and `22369510`.
- Closing or otherwise changing the test GitHub issue after creation; only the
  bidirectional link comment implied by Stage B is authorized.
- Agent merge of either PR, direct push to `main`, deployment, release, package
  publication, marketplace publication, or write to any other repository.
- Frozen-contract or emitter changes, workflow changes, dependency changes, or
  cleanup/refactoring outside the 46 exact Allowed Files.
- Treating the historical CLOSE-P1 receipts, missing commits/PRs, a fixture, or
  a reconstructed subject as current-instance completion evidence.
- The deferred W4 Jira leg and all other deferred goal debts.

## Context & References

- `plugins/foreman-line/docs/goals/w4-closeout/e6-r1-current-repository-evidence-rerun-amendment.md`
- `plugins/foreman-line/docs/goals/w4-closeout/charter.md`
- `plugins/foreman-line/docs/goals/w4-closeout/loop-directive.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md` §§3, 4, 8
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `plugins/foreman-line/docs/specs/done/CLOSE-P1-minted-chain-exit-vehicle.md`
- `plugins/foreman-line/approval/src/approve-flow.ts`
- `plugins/foreman-line/registration/src/receipt.ts`
- `plugins/foreman-line/contracts/schemas/registration-result.schema.json`
- `plugins/foreman-line/dispatch/src/approval-cli/index.ts`
- `plugins/foreman-line/verification/src/pipeline/index.ts`
- `plugins/foreman-line/integration/src/exit-vehicle.ts`
- `plugins/foreman-line/receipts/src/validator.ts`

## Verification Plan

- Before edits, record `git rev-parse HEAD`, branch/worktree identity, the exact
  `git grep` file list, and the 42/79 counts. After edits, rerun the same tracked
  search and fail on any match; diff the changed paths against the 46-entry
  Allowed Files list.
- Parse every changed JSON file. Verify the two stale registration sidecars are
  absent, validate the exact shape and non-registration disclaimer of both
  replacement migration records, verify both SHA/path objects with
  `git cat-file -e`, and probe every current manifest/install URL with read-only
  repository/path checks.
- Parse `.claude-plugin/marketplace.json`, run `claude plugin validate .`, and
  deterministically prove that its `audit-suite` source exists and resolves to a
  nested plugin manifest named `audit-suite`. Search the changed README for stale
  living `audit-suite@kaseya-one` and `kaseya-one` marketplace keys.
- Capture the live fixture only from authenticated read-only `gh api` calls.
  Immediately rerun those calls and deep-compare each parsed body to the stored
  `capture`. Run the integration package's test, typecheck, and lint commands;
  retain direct exit codes and complete output.
- Prove the effective-rules structural guard with an in-memory stripped-capture
  mutation that makes the corrected test fail, then restore the unmodified
  capture and rerun green.
- Run the spec-linter advisory check before handoff. At coordinator lint, verify
  every factual path/API claim on disk, promote `draft`→`active`, and run a
  separate plan-level adversarial review before any issue or push.
- At Stage D, reviewers assess the same final SHA and the coordinator reruns the
  tracked search, JSON/link checks, and applicable package checks. No Stage-D
  receipt is emitted until every harness claim and both reviews support pass.
- For Stages E/F, use read-only `gh pr view`/checks data to bind the final PR head,
  successful required checks, `mergedBy`, merge SHA, and event times. Preserve
  raw outputs with the closeout evidence.
- For the deterministic exit, filter filenames using the repository's conforming
  six-digit receipt-name predicate, then assert count, sequence, stage list,
  `validateChain`, `isSealed`, E binding, and F binding against live GitHub.
  Repeat after the goal-complete PR lands on freshly fetched main.
- **Mandated reviewer focus questions:**
  1. Does any legacy identity survive, or did the migration widen into generic
     KaseyaOne history not covered by the 42/79 boundary?
  2. Can any normalized historical artifact be mistaken for a command rerun or
     current evidence because its migration annotation is missing or ambiguous?
  3. Are both stale registration sidecars retired, do their migration records
     avoid directional-link claims while binding reachable current-repository
     objects, and is the rules fixture demonstrably API-captured rather than
     hand-built?
  4. Are the issue/commit directions independently observable, and does Stage B
     encode the same issue, commit, and SHA-pinned spec permalink?
  5. Can any helper add a seventh conforming receipt, mint D before final review,
     or let E/F attest a guessed PR head or merge SHA?
  6. Did either agent acquire a merge/ruleset/Jira/other-repository authority not
     granted by E6-R1, or misstate zero approvals as independent review?

## Open Questions

None. The 2026-09-06 E6-R1 ratification fixes the repository, inventory,
observable events, external mutations, review class, human stops, and receipt
exit. Any implementation discovery that changes one of those decisions returns
to Gate 1 rather than being resolved inside this parcel.
