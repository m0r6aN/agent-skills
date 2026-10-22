# P1C initial independent reviews and triage

Both independent Opus reviews CHANGES_REQUIRED. All findings and exact dispositions are retained in [triage](evidence/p1c-independent-review-triage-20261021.json). Actual host probes distinguish demonstrated defects from hypotheses; the scoped [C01 clarification](p1c-c01-consumer-parity-clarification-20261021.md) is ratified before source repair. No source acceptance or merge. One focused repair, then two independent closure verdicts.

## Seat A

```json
{
  "verdict": "CHANGES_REQUIRED",
  "findings": [
    {
      "id": "F1",
      "severity": "high",
      "path": "src/Keon.Collective.Abstractions/Society/CivilizationalMemoryContracts.cs",
      "location": "CivicMemoryV2Json.ReadCaution / RequiredInt64 / RequiredFiniteNumber",
      "trigger": "Caution JSON with sequence or recommended_oversight_floor encoded as 1.0 or 1e0, or boost as an integer such as 1.",
      "actual_behavior": "JsonElement.TryGetInt64 can accept integral numeric spellings depending on the token, but its behavior is not aligned with Python strict int handling. Python strict int rejects 1.0. Boost float strict in Pydantic accepts int 1. C# accepts boost 1. Floor 1.0 behavior is uncertain because TryGetInt64 fails on the 1.0 token text, so it likely rejects. Exponent tokens are also untested. No test asserts float-for-integer rejection or exponent handling.",
      "violated_requirement": "AC3 normative: reject coercive scalar inputs; sequence integer; floor integer 0/1/2; exact parity.",
      "required_change": "Explicitly reject non-integer lexical forms for sequence and floor using GetRawText digit-only checks. Add parity tests for 1.0, 1e0, true and \"1\" against the Python decode_v2 results."
    },
    {
      "id": "F2",
      "severity": "medium",
      "path": "src/Keon.Collective.Abstractions/Society/CivilizationalMemoryContracts.cs",
      "location": "CivicReceiptWireReference.Validate, SingleAlias, RequireCleanText versus Python _require_clean_text",
      "trigger": "Receipt or text values containing non-control unclean characters, such as U+2028, bidi controls or surrogates, or values with leading or trailing whitespace.",
      "actual_behavior": "C# defines 'clean' only as !char.IsControl. The Python _require_clean_text definition is imported and was not supplied, so its rules may differ (for example on format characters or whitespace). Parity cannot be established, and no tests cover this boundary.",
      "violated_requirement": "AC3 exact Python/C# parity for unclean text, including nested strings and keys.",
      "required_change": "Port the exact _require_clean_text predicate, or record the divergence for a P1A amendment. Add shared negative vectors."
    },
    {
      "id": "F3",
      "severity": "medium",
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "Fixture_CautionAndInheritanceNegatives_FailClosed; Fixture_Inheritance round trip",
      "trigger": "Negative cases are asserted with ThrowsAny<Exception>. The inheritance round trip omits ApprovalRef. Reason classes (proof_required versus dissent) are never compared with fixture values. warning_admission and reference_admission vectors are unused.",
      "actual_behavior": "A NullReferenceException or other crash would satisfy the negative tests. Fixture values for reasons are ignored, and only the keys are iterated. The serializer emits approval_ref:null and rejection nulls, but this is never compared against canonical_v2 output. There is no cross-language canonical comparison.",
      "violated_requirement": "AC3: compare field values with the Python fixture; tests must be bound to the fixture rather than decorative.",
      "required_change": "Assert JsonException or ArgumentException specifically. Bind the reasons map values and warning_admission expectations to C# assertions, documenting that the contract never admits. Compare serialized key sets and explicit nulls with the canonical_v2 shape."
    },
    {
      "id": "F4",
      "severity": "medium",
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "S11Fixture_DescribesValuesOnlyAndDistinctTaskEvidenceIsValidated",
      "trigger": "The S11 vectors at indexes 2, 4, 6–13 (ten-success recovery to 0 with 1.0 boosts, unverified reset, Elevated effective floor, at-failure success, late failure, version_conflict, consumed receipts, unauthorized and unbound resets) are not asserted. AC4's worked case (Routine+Elevated=>Elevated, no effect authority) is not exercised against any contract type.",
      "actual_behavior": "Only 5 of 14 transition vectors are read, using positional indexes that are fragile. The reset and effective-floor examples are not documented as contract fixtures.",
      "violated_requirement": "AC1/AC4 and the work-order requirement to document and test every accepted S11 transition example.",
      "required_change": "Iterate all transition vectors with explicit expected-value assertions. Cover the worked case and counterexamples as descriptive fixture checks, without implementing a worker."
    },
    {
      "id": "F5",
      "severity": "low",
      "path": "src/Keon.Collective.Abstractions/Society/AgentIdentityContracts.cs; CivicMemoryContracts.cs",
      "location": "New init properties DomainCautionProfileReference and RejectionReasonClass",
      "trigger": "Default JsonSerializer use of legacy records, record equality/ToString, and reflection consumers.",
      "actual_behavior": "The legacy default serializer now reads rejection_reason_class leniently, with no strict schema, unknown-field rejection or required-field enforcement. Record equality and ToString change. Validate() on DomainCautionProfileReference uses the regex identifier while RequireId on RoleId accepts any nonblank value, which is inconsistent. The compatibility impact is not reported in the test file or limitations.",
      "violated_requirement": "AC5: report reflection/equality compatibility impacts; strict versus lenient public API boundary.",
      "required_change": "Document the lenient default-serializer path as non-v2 and add limitation notes. Add a test that the legacy deserialization of an unknown token throws, and one for an absent field yielding null."
    }
  ],
  "ac_coverage": {
    "AC1": "Partial: enum, closed converter and nullable reason are present; proof_required versus dissent semantics are not fixture-bound.",
    "AC2": "Mostly met: records, boost/NaN/floor/empty/duplicate validation and reference without payload. Direct-constructor RoleId is not regex-validated in the profile.",
    "AC3": "Partial: byte copy hash matches and Python 161 PASS is reported. Value comparison is shallow, there is no canonical shape parity, and numeric/clean-text parity is unproven.",
    "AC4": "Not covered by tests beyond indexes 3 and 5.",
    "AC5": "Arity and deconstruction are tested and the baseline of 322 passes. Equality, ToString and reflection changes are disclosed but not reported in deliverable limitations.",
    "AC6": "Doc comments state non-authority. A retained explicit limitations record is not evidenced in the artifacts."
  },
  "coverage_gaps": [
    "The Python _require_clean_text and ReceiptAnchor definitions were not supplied.",
    "The C# test run output was not independently observed.",
    "Legacy test bodies were omitted.",
    "The behavior of the JsonElement numeric lexical edge cases was not executed.",
    "The test project's copy and resolution of the fixture path in CI layouts is unverified."
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
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "S11Fixture_DescribesValuesOnlyAndDistinctTaskEvidenceIsValidated",
      "trigger": "S11 transition vectors 0-13 in the fixture",
      "actual_behavior": "The test spot-checks only 5 of 14 transition vectors. It reads fixture numbers back from the fixture, which is a decorative assertion, and binds none of them to any C# contract record or method. The following vectors are unasserted: the ten-distinct recovery vector (index 2), unverified reset (4), Routine+Elevated=Elevated (6), at-or-before-failure success (7), late failure (8), version_conflict (9), receipt dedup (10, 11), unauthorized reset (12) and unbound reset (13). The worked AC4 case is never exercised against C# types.",
      "violated_requirement": "AC3/AC4 and the order to document/test every accepted S11 example as contract fixtures, with assertions reflecting separate policy authority",
      "required_change": "Iterate all transition vectors and assert each expected value structurally. Where C# types represent the inputs, bind them: build DomainCautionProfileV2 states for before/after and validate them; reject the single-task repeat via Validate; confirm an unverified reset receipt pointer is only a CivicReceiptWireReference with no authority. Explicitly test the max(policy, baseline, caution, action) worked case and the Critical-policy-after-reset case as documented values, without a self-approval boolean."
    },
    {
      "id": "F2",
      "severity": "medium",
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "Fixture_RejectionTokens_AreClosed...; reasons map; warning_admission",
      "trigger": "fixture civic.reasons values proof_required/dissent and the warning_admission cases",
      "actual_behavior": "The test parses token names only. It ignores the proof_required vs dissent classification and never uses warning_admission. Nothing shows that failed_verification without a verified receipt is non-admitting, or that deferred_timing and budget_cap remain dissent.",
      "violated_requirement": "AC1 (deferred_timing/budget_cap remain dissent; failed_verification is only a candidate requiring proof) and AC3 (compare field values with the Python fixture)",
      "required_change": "Assert the C# token to proof_required/dissent mapping against the fixture's reasons values. Bind warning_admission cases to show the contract carries a receipt pointer without minting a marker. No admission logic should be added."
    },
    {
      "id": "F3",
      "severity": "medium",
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "Fixture_CautionAndInheritanceNegatives_FailClosed",
      "trigger": "invalid_caution / invalid_inheritance overlays",
      "actual_behavior": "The test uses Assert.ThrowsAny<Exception>. Any exception passes, including NullReference or a fixture-shape bug. Python parity is unverified: Python rejects the 'NaN' string through strict typing, while C# rejects it through ValueKind. The negatives also do not prove that ArgumentException from Validate is distinguished from JsonException. There is no positive caution case with non-empty receipts, a non-null last_failure_at or floor 1/2 round-trip.",
      "violated_requirement": "AC2/AC3 fail-closed specificity and value comparison",
      "required_change": "Assert specific exception types (JsonException or ArgumentException). Add accepted and round-trip cases with populated streak receipts, a UTC last_failure_at, floors 1 and 2, and a non-empty caution envelope plus approval_ref in inheritance."
    },
    {
      "id": "F4",
      "severity": "medium",
      "path": "src/Keon.Collective.Abstractions/Society/CivilizationalMemoryContracts.cs",
      "location": "CivicRejectionV2/DomainCautionProfileV2/InheritanceReferenceV2 records",
      "trigger": "Public records serialized with the default JsonSerializer, or Validate called directly",
      "actual_behavior": "The records lack JsonPropertyName attributes, so the default serializer emits PascalCase names and RoleId/EntityId objects ({\"Value\":...}). This bypasses the strict adapter while appearing contract-shaped. Two further gaps: direct CivicRejectionV2 construction can carry any SchemaVersion through serializers other than the adapter, and AgentIdentity.DomainCautionProfileReference has a different shape and binding than P1A, with no fixture backing.",
      "violated_requirement": "Strict v2 boundary must be unambiguous; no implicit alternate wire shape",
      "required_change": "Document on each type that only CivicMemoryV2Json is the wire boundary. Optionally make the default serializer fail by using a throwing converter or JsonIgnore. Note that domain_caution_profile_ref is a local, non-P1A shape, or remove its wire naming."
    },
    {
      "id": "F5",
      "severity": "low",
      "path": "tests/Keon.Collective.Abstractions.Tests/Society/CivilizationalMemoryContractTests.cs",
      "location": "ExistingPositionalConstructors...; legacy ProposalLineageTransition deserialization",
      "trigger": "Legacy JSON without rejection_reason_class, and JSON with an unknown token deserialized into ProposalLineageTransition",
      "actual_behavior": "The test checks only serialization and enum-level unknown handling. It does not test record-level deserialization of legacy JSON (null reason), JSON with an unknown token, or numeric enum input. Equality/ToString/reflection changes are disclosed but not tested or recorded as compatibility notes. ProposalLineageTransition remains Python-unbound.",
      "violated_requirement": "AC1/AC5 legacy wire behavior and reporting of compatibility issues",
      "required_change": "Add record-level deserialization tests: legacy JSON yields null reason, an unknown or numeric reason throws, and Validate passes. Record the equality/ToString/member-enumeration change in the limitations."
    }
  ],
  "ac_coverage": {
    "AC1": "partial: enum, converter and nullable property are correct; dissent/proof classification untested",
    "AC2": "mostly met in source; negatives weakly asserted; profile ref is non-fixture",
    "AC3": "partial: verbatim copy and provenance recorded, Python 161 PASS reported; S11/reasons/warning cases not compared",
    "AC4": "not met: worked case and counterexamples not bound",
    "AC5": "partial: arities preserved and inheritance holds no authority; legacy record deserialization untested",
    "AC6": "met in doc comments; final limitations statement should be retained in completion evidence"
  },
  "coverage_gaps": [
    "Python Wire strict mode: C# accepts 1 vs 1.0 numerically for boosts. This is semantic and fine, but Python strict float may reject the integer 1; not verified.",
    "ArgumentException leaking from adapters versus Python's single invalid_contract diagnostic is not assessed as required parity.",
    "Legacy CivicMemoryContracts tests and the 314-baseline bodies are omitted; reliance is on the host 322 PASS claim.",
    "Python ReceiptAnchor definition omitted.",
    "Python models do not apply is_valid_identifier to integrityHash; C# matches with clean text only, which is acceptable."
  ]
}
```

