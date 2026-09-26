# HRO coordination loop

## Ownership and current state

- Goal: hybrid-routing-optimization.
- Coordinator: Codex task `01a0ddb6-5fed-7d82-b2f0-075315440dc1`.
- Builder: Luna task `01a0ddc2-2250-70a3-82ea-6a5bb273714e`.
- Transfer: 2026-09-26 at the completed planning boundary; Luna confirmed it is idle, has no runtime edits, and yields coordination. No competing HRO loop directive existed.
- Coordinator workspace: `D:/Repos/agent-skills-worktrees/hro-coordination-20260926`.
- Coordinator branch: `codex/hro-coordination-20260926`, starting at `1b0f98ab53612017bb5306fa51fcc237308a6c95` (observed origin/main).
- Original planning records remain preserved in `C:/Users/clint/.codex/worktrees/6d47/agent-skills`; this workspace holds the working coordination copy and copied planning evidence.
- State: amended P1a/P1b passed schema/body lint on Node 24.19.0; P1a promoted for isolated Luna implementation. PMC A5.4 PR #49 merged at `5d5716d8dc65d05f821bb3c21238ad6c9fda530c` after independent approval and green CI. RCM-P1 merged via PR51 as 700beba5e6387a9471ecea7a8757b226930ba925 after independent approval and green CI; all 399 tests passed. PMC-P1a/P1b shapes are independently corrected and source-observation semantics are reviewed; implementation and adapters remain open.

## Standing authority

User instruction, verbatim:

> Please coordinate completion. Ask me questions, as needed, to remove any blockers. I am granting you blanket authority to make decisions on my behalf for this goal.

This supersedes prior HRO planning-only limits for decisions and routine implementation coordination. The coordinator may ratify scoped HRO amendments, grant Gate 2 for concrete reviewed HRO parcels, commission independent review/rework, and approve integration/merge behind a green verification chain. This is not permission to weaken policy, fabricate another owner's approval, skip independent review, or silently widen unrelated goals. The user explicitly chose Luna for implementation; this is a scoped builder-model exception, not a grant of coordinator or independent-verifier authority to Luna.

The user answered the scope-extension question: **"Yes—complete the necessary prerequisites (recommended)"**, explicitly authorizing coordination and approval of required RCM catalog/eligibility and PMC binding/Pi resolver parcels, limited to HRO needs and subject to independent review. This clears their prerequisite dispatch/merge decision holds under the delegated mandate; ownership transfers and exact parcel scopes must still be recorded, and unrelated queues remain untouched. Paid live smoke work will use public synthetic inputs and a documented bounded spend ceiling before execution; no account purchase, private-data disclosure, or dispatch-time global configuration mutation is authorized by this record. Runtime and quality decisions remain evidence-based.

## Queue and decisions

1. Preserve the completed P0 inventory and council evidence. Correct P1a/P1b to the actual owner handoffs.
2. P1a: isolated HRO proposal-envelope validation against injected/pinned binding evidence; no edits to frozen routing-policy contracts or production exports.
3. P1b: isolated consumer compatibility with injected normalized facts/refusals and public evaluator behavior; no production dispatch wiring.
4. Required predecessor integration: RCM-P1 reviewed merge and supported adapter; PMC A5.4 reviewed merge, PMC-P1 bindings, PMC-P2 resolver/launch boundary. No claimed runtime progress until these exist.
5. Shape remaining HRO P2–P4c against those real contracts; implement and review in dependency order. Jev P5 is optional and disabled unless measured benefit justifies it.
6. Conformance, public synthetic live smoke, measured baseline, independent acceptance, and Stage-F closure against the original charter exit criterion.

Each parcel gets exact allowed files, a named branch/worktree, Step 0, targeted deterministic checks, and two independent frontier reviews for architecture/risk. Reviewers are read-only and never review their own implementation. Do not reuse proposal-only results as authorization or availability evidence.

## Blocker dispositions

| Prior blocker | Current disposition |
| --- | --- |
| HRO Gate 2 not requested | Delegated to this coordinator by the quoted instruction; grant after concrete spec lint and branch preparation, no repeat start-approval request. |
| SUPERCHARGE/routing-policy owner confirmation | No shared code edits in amended P1a; SUPERCHARGE-P1 is recorded shipped and P2 is analysis-only. No blanket package hold for isolated HRO files. |
| Dispatch owner confirmation | No edits; public-interface tests only for P1b. Production integration remains separately gated. |
| Jev / receipts confirmations | Not implicated in P1a/P1b; preserve later owner seams. |
| PMC bindings/resolver unavailable | Confirmed no PMC-P1/P2 implementation; scope extension approved. Sequence ratification integration, binding contract, resolver and HRO bridge with review. |
| RCM facts unavailable | Implementation exists at `7faa46a33fdbc927535a193fdbfd4c782b61b6dc`, but not merged/exported; production adapter and canonical snapshot producer still required. |

## HRO-P1a Gate 2 and Step 0

Gate 2 is granted by this coordinator under the user's delegated authority for
the exact active `HRO-P1a-mapping-contract.md` and its eight allowed files.
Builder workspace: `D:/Repos/agent-skills-worktrees/hro-p1a-20260926`;
branch: `codex/hro-p1a-20260926`; model: `gpt-5.6-luna`.
Apply the coordinator documentation commit before work, verify spec digest and
branch/worktree, restate scope and stop for coordinator Step-0 release. The
release can be supplied by the coordinator without asking the user again.
Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.
No runtime/provider/config effects; no shared routing-policy/dispatch edits.
Return exact changed paths, test counts/typecheck/lint, scope proof, and a local
commit; no publish/merge until two independent implementation reviews close.

## Stop and continuation

Persist decisions, evidence and queue changes here. Continue independent authorized work while a prerequisite waits. If no meaningful work remains, report the exact missing input and resume when it arrives. Never mark the full goal complete merely because P1 or fixture tests pass. Stop on user's request, unresolved security findings, unauthorized external effects, or genuine missing user-only credentials/ownership decisions.

## P1a Stage-F closure — 2026-09-26

PR54 merged as `59b48a0b47e9ccba0499121649801cf7d36ba285` after both
independent implementation approvals, separately reviewed A2 audit enrollment,
and every corrected full remote CI check passed at 379f144. The spec is now
`docs/specs/done/HRO-P1a-mapping-contract.md` with status done. Earlier shaping
artifacts and review hashes remain historical records, not rewritten evidence.
Original branches/frozen commits are retained for traceability; the clean HRO
workspace is reused on `codex/hro-p1b-20260926`, with separate specification
release commit 057e3bf and a fresh GPT-5.6-Luna builder at Step 0. P1b remains
offline and gets its own two reviews; no P1a acceptance authorizes runtime use.

PMC-P1a final source 12b0aa0 has both independent approvals and a clean verified
integration (471 tests/typecheck/lint); PR55 is queued after PR54. RCM-P1A final
source 4201ac4 has both independent approvals (27 focused/426 full tests) and
awaits integration after PMC. Remaining live/cache/receipt/configuration/operator
and measured-smoke exits are still open. The coordinator remains responsible
under unchanged delegated authority; no human decision is presently required.

## Implementation checkpoint — 2026-09-26

RCM library PR51 and source/closure PR52 are merged; source profile v4 is accepted for six conservative OpenRouter catalog-fact rows with explicit remaining refusals. PMC binding/controlled-launch design PR53 merged as 2997b198cb73a6a7e85d215464a86f97a9c8b571 behind green CI. PMC-P1a implementation is frozen at 7e77a0ae1f8cc3d8c696c914a40879f0cb97f3f4 in hro-pmc-p1a-20260926, with two fresh independent implementation reviews underway. Builder reports 470 routing-policy, 126 dispatch and 126 spec-linter tests, pending independent acceptance.

RCM-P1A wrapper Step 0 verified clean base 1dc353ab69cf6d62ac2f4e6662e529ff9e6129c9 and spec blob 906f91d5061826ab671d939d369b67bbf28175c6; implementation released in hro-rcm-p1-integration-20260926 on codex/hro-rcm-p1a-wrapper-20260926. Private isolated work may overlap; shared barrel integration remains PMC-P1a then RCM-P1A, preserving all accepted exports. Subsequent projection/producer work uses the reconciled accepted base. Producer contract review approved retained evidence transformation subject to the release conditions now recorded in its draft; no producer implementation released yet.

HRO-P1a repaired head 5e051437ba9a63c46d14c543e8d3198153f95137 still failed both independent rereviews on resource preflight ordering. Luna is released for the narrow repair and permanent boundary regressions recorded in hro-p1a-review-triage.md; do not publish the uncorrected head. HRO-P1b and all later runtime/cache/receipt work remain queued. SQLite ledger refinement remains reviewed draft design, not implementation. No full goal completion or live routing claim is made.

## PMC-P1b Stage F closure — 2026-09-26

PR57 merged as60a62b1cccf06e6a23bfe2294beb758799d5e317 after two independent
approvals of7dce9d5 and complete green remote twenty-package CI at a343ac5.
Independent evidence includes505 routing/126 dispatch/126 spec-linter tests,
typecheck/lint, all8 old schemas byte-identical and75 old plus4 new exports.
The lossless projection spec is moved to done; links are updated. Branches remain
retained. This remains static evidence, not model activation or HRO completion.
The next RCM producer integration retains the complete projection contract and
its own two approvals; PMC-P2A private build continues behind the accepted API.
## HRO-P1b Stage-F closure — 2026-09-26

PR59 merged at 2026-09-26T17:22:58Z as
26c72690c65302561fd15a171dd629cf19cdb963. Both independent consumer and reader-audit
reviews passed; independent combined verification approved 5a4937e; all twelve
remote checks succeeded at that exact head before the matched-head merge.
The consumer spec moves to done. This is offline compatibility evidence only;
owner bridge, cache, execution, receipts and measured live exit remain open.
Frozen worktrees remain as traceability and read-only dependency donors during
active integration; cleanup follows when those dependents are finished.

## P1c repair ownership and accepted ledger checkpoint — 2026-09-26

PMC-P2B PR60 merged as 71fd489 with all twelve checks green and independent source,
audit and combined approval. Its Stage-F record is in the PMC loop directive.
P1c source 435c710 is held for five accepted findings recorded at local HRO head
a824dca in hro-p1c-review-triage.md; root reproduced the mutable-byte alias escape
and separate byte/ordinary-node budget defect. No P1c acceptance or live claim.

Native child-agent creation and reviving the earlier Luna child repeatedly reached
the agent thread limit. The coordinator resumed the user's existing assigned task
"Implement hybrid routing optimization" (01a0ddc2-2250-70a3-82ea-6a5bb273714e),
explicitly configured gpt-5.6-luna/high, for this repair only. It must use
D:/Repos/agent-skills-worktrees/hro-p1c-shaping-20260926, exact four-file envelope,
inspect/restate/STOP, then explicit coordinator release. Its default cwd is read-only.
No new user-owned task or competing coordinator loop was created. Root task
01a0ddb6-5fed-7d82-b2f0-075315440dc1 retains all reviews, integration and release.
## Continuation checkpoint: validator reuse accepted, final bridge repair held

PMC-P2F merged in PR62 at2eb994b4 after two independent source reviews, separate
combined-head review and all12remote checks. It reuses only compiled fixed schema,
never validation results or authority; actual choice reuse remains HRO-P2 work.

HRO-P1c287d source closes original byte-alias/budget defects but both reviews still
require genuine HRO artifact substitutions, retained-producer refusal coverage,
exact boundary/during-capture tests and full-package lint. Repair Step0 requested
against roottriage2360b34 in existing Luna task; no replacementmodel or acceptance.

PMC-P2B1 repaired3f31181 has both final independent source approvals; narrow
Contract B/D19 enrollment is released separately in integrationworktreeb8565c8.
C/D composition design is independently approved; runtime predecessors and all
live evidence gates remain open. P2E caller inventory found real legacy execution
surfaces and no existing Pi inference CLI; scoped split drafts are in progress.

HRO-P2 corrected01c20f5 design has an independent approval but remains draft;
bounded performance-feasibility measurement precedes root adoption decision.
A source-backed billing-bound gap prevents paid live activation. Vendor inquiry
is prepared, not sent; user was asked whether existing contractual evidence is
available. No credentials, host configuration, provider inference or spend used.
Independent implementation continues while that evidence question is pending.

## Coordinated continuation checkpoint — 2026-09-26, after PR63

This checkpoint supersedes earlier continuation status without erasing history.
PMC-P2B1 mergedPR63 as727c0554f11990da778e7647e7a108f3ca6f95aa at19:48:53Z,
with two source, two audit and separate combined approvals plus all twelve remote
checks green. StageF60e7c15 moves its spec to done. C design5764eba has two
independent approvals, ratificationd260bf6 and fresh builder Step0; controller
implementation releasedc55bd6d in its isolated worktree, exact five-file envelope.
E/E1/E2 splitfe5a144 has two design approvals; E01–04 ratified7375c3b. Frontier
E1 builder releasedb1b0add for explicit legacy executor retirement only, exact
eight-file envelope. E2 and D runtime remain unreleased pending predecessors.

Choice-cache dispositione5ae1c3 received two independent plan approvals and
reproducibility replays. Charter reconciliation6d2d859 separately reviewed and
approved; the specific SQLite choice cache is held/not implemented. Initial fresh
selection and schema compilation reuse remain distinct, with zero choice-cache
events. D8 negative caching and bounded refresh remain mandatory. Full latency/
cost/quality and live smoke requirements are unchanged; no savings claimed.

P1cb17f5b2 was held after independent discovery of double-charged ordinary alias
roots and incomplete independent boundary assertions. Roottriage73fa8af and actual
Luna Step0 preceded the current third narrow repair release. Prior HRO-token,
producer/refusal, byte-budget and lint findings are closed; fresh final reviews
still required. Same user-selected Luna, no silent model switch or goal completion.

P3 receipt shapingaad7e77 found existing dispatch-tip and later fixed-sequence
constraints; bounded workflow-session/measurement checkpoint design is being
reconciled with actual D/E/F owners. A crash remains incomplete evidence, never
zero spend. P4a recovery shaping is independently queued. All source work remains
isolated; the original checkout is read-only. The user's blanket authority and
explicit PMC/RCM prerequisite delegation continue to govern coordination.

The live billing-bound evidence question is still pending. Prepared inquiryd98e176
has not been sent. No provider inference, credentials, production funding, host
configuration or release has occurred. Continue independent implementation while
that external evidence is unresolved; do not report the full HRO goal complete.
