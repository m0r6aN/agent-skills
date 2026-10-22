# P1B initial independent review findings — October21 NY

Both completed CHANGES_REQUIRED. Coordinator dispositions are recorded separately; original reports retained below.

## Seat A

```json
{
  "verdict": "CHANGES_REQUIRED",
  "findings": [
    {
      "id": "F1",
      "severity": "high",
      "path": "src/keon/cortex/gravity/params.py",
      "location": "GravityParamsV2.__post_init__ and the score/FSRS constant fields",
      "concrete trigger": "GravityParamsV2(rrf_weight=0.40, provenance_weight=0.30), GravityParamsV2(rrf_rank_constant=61.0), or GravityParamsV2(successful_use_stability_gain=1.5).",
      "actual behavior": "Each instance is accepted and still reports version gravity-params/2.0.0 and the unchanged formula_id. Only the params_hash changes. Every public function accepts any params instance, so a tuned profile scores while carrying the advertised v2 version label. Only version, graph strings and channel_count are pinned.",
      "violated requirement": "AC1 'Reject silently tuned v2 defaults'; Constraints 'Any tuning requires explicit versioning, never an in-place profile/constant patch'.",
      "required_change": "Make every non-default value under version gravity-params/2.0.0 a validation error, or have the functions verify the frozen default hash. Add one rejection test per field."
    },
    {
      "id": "F2",
      "severity": "medium",
      "path": "tests/gravity/test_ccm_v2.py",
      "location": "test_params_canonical_covers_every_pinned_field_and_function_identity",
      "concrete trigger": "Mutating the canonical dict entries to the string 'changed:...' rather than building mutated GravityParamsV2 instances.",
      "actual behavior": "The test proves that canonical_hash of a different dict differs, which is a tautology. It never shows that a real numeric parameter mutation such as dataclasses.replace(p, recency_weight=...) changes params_hash. It also never shows that such a mutation is rejected (see F1). The function hash is merely canonical(params) plus formula_id, so formula identity is a free label decoupled from the equations.",
      "violated requirement": "AC1 'Changes in every pinned parameter change its canonical hash'; Verification Plan 'parameter mutation cases to prove hash sensitivity'.",
      "required_change": "For each field, either replace it on a real instance and assert the resulting hash or rejection behavior, or rely on F1's rejection. Test that formula_id cannot be altered under v2."
    },
    {
      "id": "F3",
      "severity": "medium",
      "path": "src/keon/cortex/gravity/function_v2.py",
      "location": "score_candidate / stability_retrievability",
      "concrete trigger": "stability_days=1e-320 (subnormal) with delta=1 day, or stability_days=5e-324 with a large delta.",
      "actual behavior": "denominator_scale can be a subnormal value and the ratio can overflow to inf, giving R=0. That trips the value<=0 check and raises the generic 'nonfinite_result' rather than a typed stability-domain diagnostic. More importantly, no explicit finite numerical validation bounds S or delta, so the contract that 'ordinary supported intervals yield (0,1]' has no defined supported interval. Underflow is permitted only implicitly, and no test exercises it.",
      "violated requirement": "Contract 'Permit R underflow only according to explicit finite numerical validation; ordinary supported intervals must yield (0,1]'.",
      "required_change": "Define and enforce explicit S and delta bounds with a stable error code (for example stability_out_of_range). Add extrema tests."
    },
    {
      "id": "F4",
      "severity": "medium",
      "path": "tests/fixtures/ccm/gravity-v2.json; tests/gravity/test_ccm_v2.py",
      "location": "invalid_cases list; dedup test; boundary tests",
      "concrete trigger": "Reading invalid_cases entries 'naive_timestamp' and 'non_utc_timestamp', and test_future_time_clamps_and_explicit_dedup_event_fixture.",
      "actual behavior": "invalid_cases is never consumed by any test. It lists cases with no executed counterpart in an integer-seconds API, overstating coverage. The dedup test only counts set cardinality on fixture data; no production path is exercised. Several assertions are not literal fixture values: the composite/tie R=1 and the RRF case 1/3 are compared with exact float literal approximations, which is acceptable. However, the boundary tests compare against equality ==0.5 and depend on retention_state literal thresholds being hard-coded in the test. There are no negative tests for rank absence versus missing-key semantics or for a None ranks mapping.",
      "violated requirement": "AC5 negative coverage must be executed. Standing constraint 11: assertions must bind to their named invariant.",
      "required_change": "Remove or execute invalid_cases entries. Add parametrized execution for each listed case. Describe the dedup test honestly as a fixture-representation check, or add a pure helper that applies deduplicated events."
    },
    {
      "id": "F5",
      "severity": "low",
      "path": "src/keon/cortex/gravity/retention_v2.py",
      "location": "sweep_transition",
      "concrete trigger": "sweep_transition('Active', 0.1), or a non-str current_state such as None.",
      "actual behavior": "These raise invalid_lifecycle_state, which is correct. However, buffered is never re-activated and the state vocabulary is not tied to the P1A enum. Also, retention_state accepts R=0.0, while the scorer can never produce R=0.0; this is a minor inconsistency with no P1A cross-check.",
      "violated requirement": "AC1 'Record source revision/section identities ... and the comparison proving their agreement' (P1A lifecycle vocabulary).",
      "required_change": "Bind the lifecycle states to the P1A enum or contract artifact. Record the S05–S07 comparison evidence."
    }
  ],
  "ac_coverage": {
    "AC1": "Partial. The equations match the contract: RRF divides by 3/61, absent channels are not renormalized, R is 1/(1+delta/9S), and the FSRS update uses pre-event R. Purity holds. Silent tuning is accepted (F1). Hash-sensitivity tests are tautological (F2). The P1A agreement comparison is not evidenced.",
    "AC2": "Covered. The literal RRF values 1, 1/3, 61/62 and 0, the composite 0.775 and the zeta/alpha tie ordering are all present and independent.",
    "AC3": "Covered. The boundaries for days 28/82, 127/379 and 406/1216 are asserted as R equality at the day before and strict-inequality transitions. The delayed active sweep moves to buffered.",
    "AC4": "Numerically closed by the independent Decimal70 comparison of all 30 pairs. Future-time clamping is tested. Dedup is a fixture-only representation (F4). No written explanation is supplied of events at day 7/day 30 versus an ambiguous final horizon; only the interpretation strings exist.",
    "AC5": "Partial. NaN/inf, S<=0, provenance, rank and difficulty cases are executed, and a contested low-score candidate remains orderable. The listed invalid_cases are partly unexecuted (F4). Extrema and underflow are untested (F3).",
    "AC6": "Insufficient evidence. There are host claims of 231 passing tests with 200 identities retained and byte pins unchanged. The old sources, replay outputs and P1A baseline outputs were not supplied for independent review."
  },
  "coverage_gaps": [
    "The old gravity/1.x source, replay fixtures and before/after outputs were not supplied, so AC6 cannot be verified independently.",
    "The P1A S05–S07 text was not supplied, so constant and threshold agreement cannot be compared.",
    "The fixture hash and the default params/function hash values cannot be recomputed without execution.",
    "Benchmark-ready version output is absent beyond fields on the score object."
  ]
}
```

## Seat B

```json
{
  "verdict": "CHANGES_REQUIRED",
  "findings": [
    {
      "id": "F1",
      "severity": "high",
      "path": "src/keon/cortex/gravity/params.py",
      "location": "GravityParamsV2.__post_init__ / canonical",
      "concrete trigger": "GravityParamsV2(rrf_weight=0.40, provenance_weight=0.30) or GravityParamsV2(successful_use_stability_gain=2.0, fresh_threshold=0.8), all with the default version and formula_id",
      "actual behavior": "Construction succeeds with version 'gravity-params/2.0.0' and the unchanged formula_id. score_candidate then reports gravity/2.0.0 with retuned math. Only params_hash differs, and no check compares it to the frozen hash. formula_id is a free string that is not tied to the constants it names.",
      "violated requirement": "AC1 says to reject silently tuned v2 defaults and states that any tuning requires explicit versioning, never an in-place constant patch.",
      "required_change": "Make the v2 constants non-overridable, or have __post_init__ reject any value that differs from the frozen literals (or reject any params_hash other than the pinned one) while version stays gravity-params/2.0.0. Add tests showing that each mutated constant is rejected unless the version changes."
    },
    {
      "id": "F2",
      "severity": "medium",
      "path": "tests/gravity/test_ccm_v2.py",
      "location": "test_params_canonical_covers_every_pinned_field_and_function_identity",
      "concrete trigger": "Mutation loop replaces each value with the string f'changed:{value}' on a plain dict.",
      "actual behavior": "The test only shows that a different dict hashes differently. It never constructs a mutated GravityParamsV2 and never compares p.params_hash. Removing a field from canonical() would still fail the set check, but a numeric change such as 0.45 to 0.4500001 is never exercised through the class.",
      "violated requirement": "The verification plan asks for parameter mutation cases that prove hash sensitivity. Standing constraint 11 requires that assertions bind to the invariant they name.",
      "required_change": "Use dataclasses.replace with type-correct perturbations for each field. Assert either that construction is rejected (per F1) or that params_hash and function_hash change versus the literal pinned hashes."
    },
    {
      "id": "F3",
      "severity": "medium",
      "path": "src/keon/cortex/gravity/function_v2.py",
      "location": "stability_retrievability, score_candidate, retention_state",
      "concrete trigger": "stability_days=5e-324 with delta=1e300, or a subnormal R. Separately, retention_state(10**400) passes a huge int.",
      "actual behavior": "(a) Underflow policy is implicit: R=0.0 raises 'nonfinite_result' even though the result is finite. The contract allows underflow only under an explicit finite numerical validation rule, and the 'supported interval' bound is undefined. (b) float(10**400) raises OverflowError, which is caught, so (b) is fine. (c) In elapsed_days, an int subtraction producing a huge value goes through seconds/86400.0, which can raise OverflowError and is caught. Underflow, however, has no distinct code and no test.",
      "violated requirement": "The work order requires: 'Permit R underflow only according to explicit finite numerical validation; ordinary supported intervals must yield (0,1]'. It also requires stable typed diagnostics.",
      "required_change": "Document and implement explicit supported bounds for S and delta, or give R underflow a distinct code such as 'retrievability_underflow'. Add extrema tests (tiny S, huge delta, subnormal values)."
    },
    {
      "id": "F4",
      "severity": "low",
      "path": "tests/fixtures/ccm/gravity-v2.json",
      "location": "invalid_cases; eligibility_case",
      "concrete trigger": "invalid_cases lists naive_timestamp, non_utc_timestamp and others.",
      "actual behavior": "The list is unbound labels that no test consumes. naive/non_utc cases are not meaningful for the int-seconds API. The contested case is only one candidate, ordered alone, at score 0.15. It never shows a low-score contested candidate kept among higher-scored peers, and there is no contested flag input that the scorer ignores.",
      "violated requirement": "AC5 requires negative fixtures covering invalid counters and times, and contested low-score candidates that remain in ordering.",
      "required_change": "Drive negative cases from the fixture by input and expected code, or remove the unbound labels. Add an ordering test that mixes a contested low-score candidate with others and asserts it is retained in last position."
    },
    {
      "id": "F5",
      "severity": "low",
      "path": "tests/gravity/test_ccm_v2.py",
      "location": "test_future_time_clamps_and_explicit_dedup_event_fixture; AC4 explanation",
      "concrete trigger": "The dedup test computes len(set) on fixture data.",
      "actual behavior": "The test does not apply duplicate events through any state-update path. It does not show that S is unchanged after a deduplicated repeat, and it never tests stability_after_success on the duplicate. There is no recorded explanation of the day7/day30 events versus an ambiguous final horizon; the fixture only has an 'interpretation' string.",
      "violated requirement": "AC4 requires an explanation of the event timing and requires that duplicate uses do not grow S again.",
      "required_change": "Add a literal trajectory where a duplicate event at the same task/shard leaves S equal to the post-first value. Record an explicit horizon note that the 5th event is day35/day150 and R is evaluated pre-event, not at a final horizon."
    }
  ],
  "ac_coverage": {
    "AC1": "Partial. The equations match and the 30 pairs were independently verified to 1e-10. The frozen dataclass is present, but tuned overrides are accepted under the same version (F1), and hash mutation is not exercised through the class (F2). S05-S07 agreement evidence is only cited by fixture strings.",
    "AC2": "Covered. The RRF literals, 0.775 composite and shard-ID tie are bound to fixture literals. Normalization is division and the denominator is unrenormalized.",
    "AC3": "Covered. Boundary days 28/82, 127/379 and 406/1216 assert exact equality at the prior day. The delayed sweep buffers. The literals are fixture-bound, and the equality checks use exact ==, which is acceptable here.",
    "AC4": "Numerically closed by the independent Decimal70 comparison, and pre-event R ordering is correct. Duplicate-growth and horizon explanation are weak (F5).",
    "AC5": "Partial. NaN/inf, stability, provenance, rank, uses and time are covered. invalid_cases are unbound and contested ordering is trivial (F4). Underflow is untested (F3).",
    "AC6": "Claimed via host evidence: 231 pass, 200 identities retained, append-only params. The old-source diff and replay outputs were not supplied for direct inspection."
  },
  "coverage_gaps": [
    "The P1A appendix and the S05-S07 text were not supplied, so the normative agreement and the fixture's p1a_source_commit cannot be verified.",
    "The default_params_hash and default_function_hash literals were not independently recomputed by this reviewer. Both are builder-produced.",
    "The append-only diff of params.py and the before/after replay output bytes were not supplied.",
    "Benchmark-ready output capturing versions is not shown.",
    "Behaviour for an int successful_uses large enough to make tanh's input overflow (OverflowError, which is caught) is untested.",
    "The lifecycle sweep accepts unknown-but-valid states only as listed, and its correspondence to P1A's state set is unverified."
  ]
}
```

