# Goal-Charter Amendment — E6-R1 Current-Repository Evidence Rerun

**Status:** RATIFIED 2026-09-06
**Scope:** Repository identity normalization plus a fresh observable Stage A→F evidence run
**Owner:** canonical coordinator task `/root`

## Exact ratification

On 2026-09-06, Clint ratified E6-R1 exactly as proposed, including creation of
the test GitHub issue and the two human-merge pull requests:

> Yes, I ratify **E6-R1 exactly as written, including creation of the test GitHub issue and the two human-merge PRs**

This amendment is therefore a Gate-1 decision. It does not authorize an agent
merge, a ruleset mutation, a Jira write, or a write to any repository other than
`m0r6aN/agent-skills`.

## Reason for the rerun

The July CLOSE-P1 account is historical provenance, not current-instance proof.
The cited receipt directory, commits, and pull requests cannot be found in the
current repository or its reachable history. The former source repository is not
available from this environment. Current verification must therefore be produced
and persisted entirely in `m0r6aN/agent-skills`.

## Locked decisions

1. `m0r6aN/agent-skills` is the sole canonical repository identity.
2. Remove all 79 tracked legacy-repository reference lines across the 42 files in
   the coordinator's 2026-09-06 inventory. Update active manifests, install
   instructions, paths, links, and fixtures to
   `https://github.com/m0r6aN/agent-skills`.
3. Retire the two stale active `*.registration.json` sidecars. Replace them with
   `receipt-chain-walker.repository-migration.json` and
   `scaffold-migration.repository-migration.json`. Each replacement preserves
   the historical ticket keys, identifies reachable import commit
   `48d1db73ad0a6e9c2d9bd76f92f3a44d9fb7fcf0` and the corresponding current
   `docs/specs/done/` path, and explicitly states that it is repository-migration
   provenance rather than a `RegistrationResult` or evidence of current
   bidirectional ticket links.
4. Recapture the effective-rules fixture from the current GitHub API. Do not
   alter the old capture in a way that represents hand-edited data as a live
   response.
5. Normalize historical transcripts with an explicit migration annotation.
   Repository identifiers and paths may be normalized, but the annotation must
   state that the historical commands were not rerun.
6. Execute a fresh observable A→F sequence:
   - **A:** approved rerun specification;
   - **B:** one `[TEST]` GitHub issue in `m0r6aN/agent-skills`, with
     bidirectional issue/commit links;
   - **C:** isolated builder dispatch;
   - **D:** independent adversarial-review verdict;
   - **E:** current-repository identity-migration pull request bound to its final
     head SHA;
   - **F:** human merge commit.
7. Persist and validate exactly six receipts in the current repository. The
   deterministic exit must prove `validateChain`, `isSealed`, stages exactly
   `['A','B','C','D','E','F']`, the Stage-E PR/head binding, and the Stage-F
   human-merge binding.
8. The test issue and identity-migration evidence vehicle PR are authorized.
   The evidence vehicle PR must be human-merged. After Stage F is minted, a
   second goal-complete PR persists the sealed chain and final closure record;
   that PR must also be human-merged.
9. No Jira write, inaccessible-repository write, historical missing SHA, or
   hand-built live fixture may be used as substitute evidence.
10. D4-R2B remains unchanged. Rulesets `17746056` and `22369510` are read-only
    evidence inputs. Zero required approvals remains an explicit sole-owner
    limitation and must not be represented as independent human approval.

## E6-R1A ratified correction and Gate 2

On 2026-09-06, after the first plan-level adversarial review returned HOLD,
Clint supplied the exact authorization:

> Ratify E6-R1A and grant E6-R1 Gate 2

E6-R1A makes only these additional rulings:

1. The two retired historical sidecar paths remain builder mutation paths because
   their deletion is part of the migration. The two replacement migration-record
   paths and the existing effective-rules fixture consumer are the three additions,
   for **45 exact builder mutation paths** total.
2. Only the new E6-R1 Stage-B registration sidecar is coordinator-owned. The
   builder may delete and replace the two historical sidecars named above.
3. Stage A has an explicit human approval stop after the final active spec is
   committed. Clint must explicitly supply the exact approval slug when requested;
   the coordinator may relay that human-provided value into the interactive TTY
   but may not infer or manufacture the approval.
4. E6-R1 Gate 2 is granted for the isolated builder and two independent reviewers,
   contingent on corrected plan-review PASS. No external mutation or Stage-C
   dispatch may occur before that pass.
5. All other E6-R1 decisions remain unchanged.

## Allowed external mutations

- Create exactly one scoped `[TEST]` GitHub issue in `m0r6aN/agent-skills` for
  Stage B.
- Push the E6-R1 evidence-vehicle branch and open its pull request.
- After the evidence vehicle is human-merged, push the goal-complete branch and
  open its pull request.

Both pull-request merges are human-owned. No agent merge is authorized.

## Exit criterion amendment

The goal's receipt-chain exit is OPEN until the E6-R1 chain exists on current
`main` and all deterministic and observable-event checks pass. Historical CLOSE-P1
claims remain useful provenance but cannot close the current goal.

## Stop conditions

Stop for a Gate-1 decision if shaping or review changes any locked decision. Stop
before external mutation on unexpected repository identity, ruleset drift, check
producer drift, missing emitter capability, or an inability to form honest
bidirectional issue/commit links. Stop at each human-merge gate and await Clint.
