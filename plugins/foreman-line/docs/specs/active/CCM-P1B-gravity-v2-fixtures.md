---
ticket: CCM-P1B
title: Frozen gravity v2 scorer and retention simulations
status: draft
owner: clinton.morgan
created: '2026-10-19'
updated: '2026-10-19'
risk: elevated
surfaces: [src/keon/cortex/gravity/params.py, src/keon/cortex/gravity/function_v2.py, src/keon/cortex/gravity/retention_v2.py, tests/gravity/test_ccm_v2.py, tests/fixtures/ccm/gravity-v2.json]
routing_class: implementation/standard
verification_class: judgment-required
expertise: engineering
inputs: [text]
permission_profile: builder-standard
data_classification: internal
thinking_level: low
---

# CCM-P1B — Pure gravity-v2 implementation

## Intent

Implement only frozen, side-effect-free v2 ordering and FSRS numerical behavior with independent numeric fixtures. This packet does not select SQL candidates, enforce caller visibility, consume receipts, or mutate lifecycle state. A cheap qualified builder can implement specified mathematics while independent review retains the true replay/ordering risk.

## Constraints

- Sole implementation repository: `D:/Repos/keon-omega/keon-cortex`. Observed HEAD `684785f220c066e8686e160eec2611c727582a00`; dispatch pins a clean accepted base containing P1A, not this historical observation. Dependency: accepted P1A contract/fixture version, recorded by commit and artifact version before dispatch. No builder starts against a floating draft.
- Preserve gravity/1.0.0 and gravity/1.1.0 implementations and replay byte-for-byte. Append a frozen `GravityParamsV2` to params.py without changing the existing GravityParams definition/behavior. Add version-specific functions in new modules; no served endpoint switch.
- Function version gravity/2.0.0 and parameter version gravity-params/2.0.0. Include all scoring/threshold/limit/retention constants and formula identity in canonical function hashing. Any tuning requires explicit versioning, never an in-place profile/constant patch. Do not modify the frozen Foreman schemas or existing canonical serialization primitive.
- Stage1 eligibility is an upstream precondition, never derived from gravity score. Active/buffered valid/contested/stale candidates with positive relevance are supplied after scope/identity verification; purged is skipped before identity verification by the future caller. This scorer never drops an eligible record because of low score or contested validity. Input validation rejects malformed data, not legitimate low trust.
- Domain caution boost application is NOT enabled by this packet. P6 must freeze the exact profile-to-score application, profile version binding and any required gravity version change before enabling it. Baseline v2 mathematics must not acquire hidden mutable weights.

### Exact mathematical contract

Let delta=max(0,as_of-last_verified_use_at_or_observed_at)/86400 days. Times are explicit UTC instants; no wall clock inside pure functions. S>0 days, difficulty D in [0,1], nonnegative integer deduplicated successful uses u.

```text
R = 1 / (1 + delta / (9*S))
Util = tanh(0.35*u)
RRF = sum(1/(60+rank_c) for present channels) / (3/61)
Score = 0.45*RRF + 0.25*effective_provenance + 0.15*Util + 0.15*R
S_after_success = S * (1 + 1.20*(1-D)*S**(-0.2)*(0.25 + 0.75*(1-R_pre_event)))
```

Ranks are one-based positive integers or absent; absence contributes zero and does not change denominator. Each channel has at most 200 candidates; graph ranking uses shortest visible undirected distance <=2 with shard-ID ties. Candidate production is not implemented here. Reject nonfinite numbers, rank zero, nonpositive S, invalid D/provenance/u and incomplete timestamps with stable non-content errors. Permit R underflow only according to explicit finite numerical validation; ordinary supported intervals must yield (0,1]. Order within an already assigned briefing section by score DESC, shard_id ASC. Retention projection: fresh R>=.90, decaying .50<=R<.90, stale .25<=R<.50, expired R<.25.

Initial (S,D): ephemeral_status=(3,.50); standard=(14,.30); architectural_invariant=(45,.15). On a successful use evaluate R before resetting last-use to that event time, update S once, preserve D (v4 specifies no D-learning rule), then reset time. Deduplication is a caller obligation represented explicitly in fixture events; repeated task/shard successes must not multiply updates. Sweep classification uses strict thresholds and one archival transition per sweep from P1A; no worker/database mutation here.

## Acceptance Criteria

1. Immutable v2 parameters and pure scorer/retention functions implement the exact equations and state projection above. New functions accept explicit inputs and return computed values or typed validation errors; no network/DB/LLM/clock access. Changes in every pinned parameter change its canonical hash; changing formula identity changes function hash. Reject silently tuned v2 defaults.

   Accepted S05–S07 and the pinned P1A requirements remain normative. Record source revision/section identities, parameter/formula versions and hashes, and the comparison proving their agreement. P1B materializes these rules; it cannot retune constants or make P1A depend on future P1B output.
2. Literal fixture expectations (independent of production helpers) include RRF: [1,1,1] ->1; [1,null,null] ->1/3; [2,2,2] ->61/62; all absent ->0. The all-absent example tests arithmetic only, not eligibility. Composite with RRF=1, Prov=.70, u=0, R=1 ->.775. Duplicate final scores sort by shard ID ascending even at zero utility/provenance.
3. Exact boundary fixtures: S=3 unreinforced R(day3)=.90, R(day27)=.50, R(day81)=.25; daily first-buffer day28, first-archive threshold day82 when already buffered. Standard S=14: first buffer127, first archive379. Architectural S=45: buffer406/archive1216. Equality does not trigger the next lower state. A delayed active sweep beyond archive threshold buffers first, not directly archives.
4. Reinforcement simulations for all three classes use two explicit trajectories: successes at day7,14,21,28,35 and successes at day30,60,90,120,150 after observation at day0. Recompute elapsed time since preceding success each time and preserve pre-event R. Record literal independently calculated S/R expected values with absolute/relative tolerance <=1e-10. Explain events at day7/day30 versus an ambiguous final time horizon. A future last-use time clamps delta to zero; duplicate uses do not grow S again.

   Before acceptance, a reviewer distinct from the builder must separately recompute all 30 event pairs (three classes, two trajectories, five events), compare pre-event R and post-event S at the specified tolerance, and retain exact inputs, independent calculation method and disagreement evidence. Builder-produced expectations alone do not close this independent acceptance lane.
5. Negative/boundary fixtures cover NaN/infinities, negative/zero stability, provenance outside [0,1], absent/zero/negative ranks, invalid counters/times and contested candidates with low scores that still remain in ordering. Tests cannot call production math to generate their expected values.
6. Existing gravity tests and versioned replay fixtures pass unchanged, with before/after identities and outputs retained. Capture the exact implementation and parameter versions in benchmark-ready output; this packet proves no latency or retrieval-quality SLO.

   Link the accepted P1A commit and its pre-P1A gravity/replay baseline identities and retained outputs into this evidence chain alongside P1B's own pre/post results.

## Out of Scope

SQL/FTS/vector adapters, graph traversal, live endpoints, lifecycle workers, outcome verification/accounting, source-kind migration, profile boosts, inherited pack selection, cloud/profile mutation and benchmark claims. No changes to old gravity functions, old fixtures or test skips. No new dependency packages are authorized.

## Context & References

- [P1A](CCM-P1A-memory-graph-contracts.md)
- [Delegated oversight authority and scoped R06 corrections](../../goals/collective-civilizational-memory/oversight-2026-10-20.md)
- [Accepted decisions S05–S07](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md)
- [v4 D4/D12](D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt)
- [Existing params](D:/Repos/keon-omega/keon-cortex/src/keon/cortex/gravity/params.py)
- [Existing canonical primitives](D:/Repos/keon-omega/keon-cortex/src/keon/cortex/core/canonical.py)

## Allowed Files

Exact paths relative to the sole Cortex repository:

- `src/keon/cortex/gravity/params.py` (append v2 only)
- `src/keon/cortex/gravity/function_v2.py` (new)
- `src/keon/cortex/gravity/retention_v2.py` (new)
- `tests/gravity/test_ccm_v2.py` (new)
- `tests/fixtures/ccm/gravity-v2.json` (new)

Any additional file requires a coordinator-ratified amendment before mutation.

## Verification Plan

From the admitted worktree/environment:

```text
python -m pytest -q tests/gravity/test_ccm_v2.py
python -m pytest -q tests/gravity tests/test_ingress_models.py
```

Capture exact base vs result diff and named v1 replay test outcomes; compare independent fixture values with the stated tolerance. Use parameter mutation cases to prove hash sensitivity and rank-zero rejection. Mandatory reviewer questions: Is normalization division rather than multiplication? Are missing channels unrenormalized? Are eligibility/epistemic validity accidentally used as score gates? Do reinforcement fixtures use pre-event R and the right event times? Can any parameter change preserve the advertised v2 hash? Low builder thinking does not waive risk-based independent review or technical acceptance.

## Dispatch Envelope and Completion

Target initial supplied context <=~16k: this parcel, accepted P1A types, relevant canonical/params interfaces, numeric fixtures and exact commands. No full initiative history; omit blanket context override. Coordinator pins dependency commit/version, clean worktree/base, existing baseline and lowest-cost qualified exact builder/fallback route plus data/tool eligibility. No implicit session-model change.

At most one implementation plus one focused repair before returning a reproducible blocker. Actual dollar/time/token/tool/reviewer/retry bounds and enforcement limits must be authorized/recorded before paid launch; none are granted here. Preserve independent reviews despite implementation/standard routing and elevated risk. Completion: changed files, commands/results, versions, evidence paths, limitations, actual usage, estimated/unknown cost and unresolved questions. No self-approval, status promotion or merge authority.
