# P1B independent post-repair closure — October21 NY

Both independent completed closure reviews PASS with no findings. The original B transport failure is preserved and not counted as a review; one explicitly authorized bounded replacement supplies the second independent verdict.

## Seat A

```json
{
  "verdict": "PASS",
  "closure": [
    {
      "id": "F1",
      "disposition": "closed",
      "evidence": "GravityParamsV2.__post_init__ rejects every field whose type or value differs from its default with nondefault_parameter. _resolve_params additionally requires the exact type and DEFAULT_PARAMS_HASH, so a forged instance built with object.__new__ is rejected with invalid_params. test_every_nondefault_constructor_parameter_is_rejected parametrizes over all fields. test_params_must_be_none_or_exact_frozen_instance and test_all_public_parameterized_functions_reject_malformed_params cover every public entry point. The default hash was independently reproduced with stdlib JSON+SHA256."
    },
    {
      "id": "F2",
      "disposition": "closed",
      "evidence": "The tautological dict-mutation test was removed. Real dataclasses.replace mutations of every field, including formula_id and version, are now rejected. Under v2 the AC1 'hash sensitivity' requirement is satisfied via rejection, as my F2 allowed. Default params and function hashes are pinned literally in the fixture and were independently reproduced. canonical() covers all 29 fields, and function_hash binds gravity_version, formula_id and params. Residual: formula_id is still a label rather than derived from the code; this is acceptable because the frozen code and hash pins are reviewed together."
    },
    {
      "id": "F3",
      "disposition": "closed",
      "evidence": "stability_retrievability now handles overflow by scaling, without epsilon adjustment, and raises a typed retrievability_underflow only when the computed value is exactly 0.0. The invalid case S=5e-324, delta=1e300 expects retrievability_underflow and is executed. valid_extrema covers 1e-320/1, 1e308/1e-308 and 1e308/1e308 (R=0.9). Per the closure brief, no arbitrary S/delta bounds were invented. Explicit finite validation means that finite inputs yielding a nonzero R are returned, and exact zero is a typed error. This is consistent with '(0,1]' for ordinary intervals."
    },
    {
      "id": "F4",
      "disposition": "closed",
      "evidence": "invalid_cases is now executed by test_structured_invalid_cases_are_executed, which asserts exact error strings. The naive/non-UTC string entries were removed and integer-seconds cases were added. Missing-ranks and None-ranks cases are present and checked. The dedup fixture and test are described honestly as caller protocol, with a monkeypatch-counted single update. The boundary tests now assert the computed R at 1S/9S/27S, followed by projection, with exact equality for all three classes."
    },
    {
      "id": "F5",
      "disposition": "closed",
      "evidence": "sweep_transition now types the state as the P1A ArchivalStatus enum and rejects non-enum values. Buffered is never reactivated by the sweep (asserted at R=0.90), which matches the brief: success reactivation is upstream. PURGED and ARCHIVED pass through unchanged. The fixture records the S05-S07 source path, SHA, line ranges and comparison text, plus the P1A contract SHA and revision. retention_state accepting 0.0 is harmless input validation."
    }
  ],
  "findings": [],
  "ac_coverage": {
    "AC1": "Met. Frozen params with full-field rejection and hash-gated resolution; pure functions with no clock/IO; S05-S07 and P1A identities with comparisons recorded; versions and hashes independently reproduced.",
    "AC2": "Met. Literal RRF examples (1, 1/3, 61/62, 0), composite .775, and shard-ID tie ordering at zero utility/provenance are all fixture literals.",
    "AC3": "Met. R at days 3/27/81 for S=3; buffer/archive days 28/82, 127/379 and 406/1216 with strict equality checked at the day before; delayed active sweep buffers first.",
    "AC4": "Met. 30 literal pairs using pre-event R and per-event deltas; an independent Decimal70 recomputation written before the builder's values agrees with both fixture and production values at <=1e-10 absolute and relative. Future-time clamp and caller-protocol dedup are tested; the day-7/day-30 versus final-horizon distinction is explained in calculation_note.",
    "AC5": "Met. NaN/inf, zero/negative S, provenance bounds, rank zero/negative/over-cap/absent, counters, timestamps and underflow are covered. A contested low-score candidate remains in ordering. Expected values are literals rather than outputs of production math.",
    "AC6": "Met on host evidence. 200 baseline tests retained and 266 pass; 21 pins unchanged and the params prefix is byte-identical; the three-way replay SHA is identical; a benchmark-ready version/hash sample is provided with no SLO claim."
  },
  "coverage_gaps": [
    "The full old v1 scorer, old tests and the P1A appendix were omitted. Replay and pin retention rest on host-supplied evidence that I did not observe directly.",
    "The params.py v1 prefix was not re-reviewed in this packet; its byte-identity is host-checked only.",
    "The fixture SHA binds the original file bytes, not the minified packet text, so packet-to-file equivalence is unverified by me.",
    "The candidate is not accepted or merged. Final acceptance still requires the coordinator, and a PASS here grants no merge authority."
  ]
}
```

## Seat B

```json
{
  "verdict": "PASS",
  "closure": [
    {
      "id": "F1",
      "disposition": "closed",
      "evidence": "GravityParamsV2.__post_init__ compares the type and value of every dataclass field with its frozen default and raises nondefault_parameter on any mismatch. _resolve_params accepts only None or an exact GravityParamsV2, and it rejects any instance whose params_hash differs from the pinned DEFAULT_PARAMS_HASH. This also blocks object.__new__ forgery, which is tested. The parametrized test_every_nondefault_constructor_parameter_is_rejected covers all 29 fields. As a result, no tuned bundle can carry gravity-params/2.0.0 or gravity/2.0.0. An independent stdlib reproduction of the params and function hashes matches."
    },
    {
      "id": "F2",
      "disposition": "closed",
      "evidence": "The plain-dict mutation test has been replaced. dataclasses.replace now applies type-correct perturbations (str suffix, int+1, float+0.01) to every field through the real class and asserts rejection. The literal params and function hashes are pinned against fixture values. Rejection is a stronger invariant than hash change for a frozen version: no preserved-hash path exists, which answers the mandatory reviewer question. A mutated formula_id is rejected before any hash can be computed. Function-hash sensitivity to formula identity holds by construction, since formula_id is in the hashed recipe, but it is not exercised as a positive test. This is acceptable under the frozen-only design."
    },
    {
      "id": "F3",
      "disposition": "closed",
      "evidence": "Underflow now has a distinct code, retrievability_underflow, raised when R==0.0. Overflow paths use a scaled algebraic form with no epsilon and no invented S or delta bounds. Covered cases: the fixture case S=5e-324 with delta=1e300 expects retrievability_underflow; valid_extrema include a subnormal S=1e-320 giving ~9e-320, plus 1e308 cases; huge integer timestamps raise nonfinite_timestamp_delta. Exact boundary equality at S, 9S and 27S is asserted with == for all three classes."
    },
    {
      "id": "F4",
      "disposition": "closed",
      "evidence": "invalid_cases are now structured as function/inputs/expected_error and are executed by test_structured_invalid_cases_are_executed. The unbound naive and non_utc labels were removed, consistent with the integer Unix-seconds API. The contested low-score candidate (0.15) is ordered alongside valid-high and asserted retained in last position."
    },
    {
      "id": "F5",
      "disposition": "closed",
      "evidence": "A representative caller-filtering test applies the fixture events through stability_after_success with a call counter. It asserts exactly one update, and asserts final S equal to the post-first value 15.734290013327787. The fixture calculation_note records the day-35 and day-150 fifth events and that R is evaluated pre-event, not at a final horizon. This is honest caller-protocol evidence, not proof of a runtime worker, which is in scope as stated."
    }
  ],
  "findings": [],
  "ac_coverage": {
    "AC1": "Met. The frozen dataclass rejects non-default values and _resolve_params pins the hash. Functions are pure, take explicit integer UTC seconds, and return typed errors. S05-S07 path, SHA, line ranges and comparisons are recorded in the fixture dependency block. Versions and hashes are independently reproduced.",
    "AC2": "Met. Literal RRF examples (1, 1/3, 61/62, 0), composite 0.775 and shard-ID tie ordering at zero utility/provenance are fixture literals.",
    "AC3": "Met. R=.90/.50/.25 at S, 9S and 27S is exact for all classes. Day-before equality versus first buffer/archive day is checked for days 28/82, 127/379 and 406/1216. Equality does not transition. The delayed active sweep at day 100 buffers first.",
    "AC4": "Met. All 30 pairs use pre-event R and since-prior-success deltas at 1e-10 absolute and relative tolerance. An independent pre-builder Decimal70 reference (hash 9c41fb7e...) agrees with both fixture and production values. A future time clamps delta to 0. Caller dedup leaves S unchanged.",
    "AC5": "Met. Fixture-driven negatives cover NaN/±inf, zero/negative S, provenance out of range, zero/negative/over-cap/bool/float ranks, missing or None rank maps, bad counters, bad times, bad lifecycle state and bad order entries. The contested low-score candidate is retained. Expected values are literals.",
    "AC6": "Met. The 200 baseline tests are retained and the full run shows 266 passed. 21 pins are unchanged and the params prefix is byte-identical. Three-way replay (pre-P1A efb5f4bc, P1A merge cc3a6def, current) is 11824 bytes with identical SHA 903b2460.... Benchmark-ready output carries versions and hashes with no SLO claim."
  },
  "coverage_gaps": [
    "Candidate is not yet accepted or merged. The final commit identity must bind these file SHAs.",
    "Full v1 scorer, old tests and P1A appendix were not re-read here. Reliance is on host pin and replay evidence.",
    "Function-hash change on a formula-identity change is shown by construction only, because frozen rejection precedes hashing. There is no positive test.",
    "The params.py old prefix was omitted from this packet. Byte identity was host-checked and seen in the initial review."
  ]
}
```

## Host disposition

All original findings closed in one focused Luna repair. Repaired host run266PASS, all200baseline retained, Black/isort/mypyPASS, all30pairs independently rechecked, oldv1/1.1 replay byte-identical across3bases, default hashes independently reproduced. New enum-based sweep vocabulary reuses P1A. No workers/scoped eligibility/receipt accounting/Gateway/DB/latencySLO proven. Closure packets disclose omitted unchanged v1 source/tests/appendix and supply actual retained baseline/pin/replay evidence. Fixture allkeys/values included (whitespace minimized), exact filepins retained.

Original closureB SSLError supplied no HTTP/model/text/usage; no claim of zero inference or billing. Its350reservation remains full. Replacement explicitly approved under owner blanket authority, same verifiedTLS/sameOpuslow, oneattempt only; no further retry was made. Original94.6 andAPI$.17192 unknowns retained.
