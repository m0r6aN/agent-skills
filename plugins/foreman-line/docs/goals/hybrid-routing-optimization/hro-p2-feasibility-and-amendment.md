# HRO-P2 feasibility and proposed outcome-based amendment

Status: RATIFIED by the delegated coordinator on 2026-09-26 after two independent plan approvals at e5ae1c3848544aeb08992a8607cb7c67bb548858. Proposed SQLite choice-cache implementation
is held and not implemented. Charter D1/D4/D5, package dependencies, checkpoints, acceptance and exit are explicitly amended alongside this record. Full AC6 benchmarking remains incomplete.

## Evidence and decision boundary

The corrected choice-hint design at01c20f5e405fab112ab84c8f2406370861a09673 has an
independent semantic design approval. It freshly evaluates every candidate and
proves a stored winner still dominates all current survivors. It saves only the
final survivor sort; it does not skip validation, eligibility, audit construction
or dynamic authorization. Correctness approval is not performance evidence.

A separate read-only feasibility probe used the actual resolver/comparator and
forwarded native Array.sort in an isolated temporary harness, observing exactly
one winner sort per successful call. Existing four-candidate fixtures and a valid
64-candidate construction based on the owner near-bound test were used. Attempts
at128/256 returned CONTEXT_REFUSED, so no maximum-lane measurement is claimed.

Second-run timings in microseconds (median / p95):

| Survivors | Actual owner sort | Policy-only canonical encoding | Serialization with keys preordered |
|---|---|---|---|
| 4 | 2.7 / 8.3 | 117.1 / 337.3 | 23.2 / 37.5 |
| 64 | 178.1 / 351.8 | 4564.2 / 12937.0 | 372.5 / 843.9 |

The first run agreed directionally: sort medians2.7/210.3 versus canonicalization
118.4/3835.4 for4/64 survivors. Even preordered serialization is an optimistic
partial measurement excluding key ordering, other key fields, SQLite, record
validation, dominance verification and writes. These are measured partial costs,
not mathematical lower bounds for every possible encoder or full HRO-P2 AC6.

Canonical policy, catalog rows and candidate projection alone measured18928 bytes
for4 survivors and171849 bytes for64. The larger valid case already exceeds the
proposed131072-byte key cap before remaining fields and must bypass this cache.

Method: each case15 owner warmups/40 owner samples and500 microbenchmark warmups/
2000 samples, two runs. Node24.19.0, V8 13.6.233.17-node.51; i7-13800H,20 logical
CPUs. Second-run aggregate host CPU busy fraction63.6%, free memory approximately
2.4–4.0GiB; concurrent work makes tails noisy. No full-path cache benefit, provider
savings, deployment result or universal impossibility claim follows.

Pins: resolver809e8d08a9444c925fb8b88b423e2e4b7ff28625 and P2F validator
f9f22ccaeaf8d1c1db6c805269575b1c7f3cc0ad. Execution used the existing P2F dependency
checkout after confirming source/fixture identity. No reviewed repository files,
dependencies, providers, credentials or settings changed during the probe.

## Ratified explicit charter amendment

Under the user's blanket goal decision authority, the coordinator ratifies:

1. Do not build/adopt this SQLite winner-hint design or introduce PMC-P2G solely
   to save sorting. There is no measured justification for its cost and complexity.
   Retain the draft and negative evidence, accurately marked not implemented.
2. Keep deterministic fresh owner selection on every invocation. Accepted PMC-P2F
   reuses only the compiled immutable schema; every input still undergoes capture,
   schema validation, semantic checks and current eligibility/ranking evaluation.
   That reuse is not a persisted model-choice cache and must never be described so.
3. Amend charter D4/P2 and the choice-cache part of the exit criterion explicitly:
   reusable model-choice caching is conditional on a source-backed design and
   comparable complete-path measurements demonstrating worthwhile benefit without
   weakening any gate. It is not a mandatory deliverable of this initial release.
   The initial release instead delivers deterministic current-policy routing and
   accepted compiled-schema reuse, with measured full-path latency/cost/quality
   reported honestly at P6. No savings are assumed from mechanism counts.
4. Preserve all other obligations: explicit verified mappings, real governed
   execution, independent reviews, correlated truthful receipts, finite declared
   fallback, unknown-model recovery, configuration proposal/apply boundaries,
   diagnostics and public synthetic live smoke. This amendment does not close any
   runtime, billing, privacy, availability or live-evidence gap.
5. Preserve D8's bounded refresh coalescing and negative-cache obligation. Negative
   cache for unavailable catalog references is different from reusable winner
   selection; this performance finding does not defer that recovery requirement.
6. P3/P6 must report choice-cache status as disabled/not adopted, with zero actual
   choice-cache events. Do not manufacture hits/misses or relabel validator reuse
   as model selection caching. Future evaluation may revisit a materially different
   beneficial design under its own reviewed scope.

Independent reviewers must assess whether the evidence supports holding this
specific implementation, whether the proposed scope change is explicit and
consistent with the optimization objective, and whether any remaining requirement
is accidentally waived. Ratification and actual charter edits accompany this reviewed disposition;
there is no runtime dispatch or goal-completion claim in this draft.

## Local reproducibility records

Final second-run harness: C:/Users/clint/AppData/Local/Temp/hro-choice-feasibility-20260926.mjs,
SHA2561b2942cb814fc15ec24bb4d8865edc3d802ec2b09898fc450623fef8dea9a024.
Key-size probe: C:/Users/clint/AppData/Local/Temp/hro-choice-key-size-20260926.mjs,
SHA2562d22d2c091381028d95851994f13c949afce0b6122cfdbc1ec9f87f465351616.
These are temporary, machine-specific evidence harnesses, not shipped runtime or
portable benchmark assets. The first run's128/256 refusal observations remain in
the reviewer tool transcript only; the final harness tests4/64. No result file was
retained by the measuring reviewer and no digest for an absent result is asserted.

Literal replay (use a separate process; each harness temporarily instruments sort):

```powershell
$env:TSX_DISABLE_CACHE='1'
& D:/nvm/v24.19.0/node.exe --import file:///D:/Repos/agent-skills-worktrees/hro-pmc-schema-reuse-shaping-20260926/plugins/foreman-line/routing-policy/node_modules/tsx/dist/loader.mjs C:/Users/clint/AppData/Local/Temp/hro-choice-feasibility-20260926.mjs
& D:/nvm/v24.19.0/node.exe --import file:///D:/Repos/agent-skills-worktrees/hro-pmc-schema-reuse-shaping-20260926/plugins/foreman-line/routing-policy/node_modules/tsx/dist/loader.mjs C:/Users/clint/AppData/Local/Temp/hro-choice-key-size-20260926.mjs
```

Replays must verify the pinned source/fixture and harness bytes, native exit and
accepted survivor count. New timings are a new observation, not a replacement
for the original run or proof of complete-path benefit. The independent review
may corroborate this bounded hold without asserting a production benchmark.


Both independent reviews verified harness/source/fixture identity and replayed the
4/64 cases successfully, reproducing key sizes18928/171849 and the direction of
the cost comparison. They approved this bounded deferral, not cache infeasibility
in general or a complete-path performance claim. No runtime implementation follows.
