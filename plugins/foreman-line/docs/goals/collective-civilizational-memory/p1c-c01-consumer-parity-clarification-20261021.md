# C01 — P1C consumer parity clarification, before focused repair

Ratified by the authorized operator under Clinton's direct blanket non-destructive
decision/approval authority. This scoped consumer-contract clarification disposes
the P1A/P1C divergence stop before any repair source changes. P1A accepted merge,
schema ccm-contracts/2.0.1, source/fixture hashes and original proof remain unchanged.
This is not a hidden change to the accepted source or a new producer allowlist.

The normative document's inherited clean-text predicate means the actual existing
Python `_require_clean_text`: reject NUL and unpaired surrogates; otherwise opaque
receipt strings may contain whitespace or other valid Unicode, including tabs,
DEL and C1 controls. Receipt pointers remain unverified opaque values. Identifiers
still use the strict ASCII 1..128 grammar; no loosening of tenant/role/target IDs.
The C# adapter must match this existing producer surface, while preserving the
canonical ReceiptRef pointer and the existing legacy validators outside v2.

Sequence is a strict nonnegative JSON integer without an invented signed-64-bit
ceiling: Python accepts 9223372036854775808. C# must preserve this value exactly,
for example with System.Numerics.BigInteger and an explicit JSON number boundary.
No new dependency is necessary. Float/exponent/string/bool sequence inputs reject.

The frozen JSON comparison rule is semantic for numbers. Oversight is one of the
integer values0/1/2, serialized canonically as that integer, and existing Python
Literal accepts numeric1.0/1e0 as1. C# may accept these mathematically integral
JSON number spellings to match the existing producer; booleans, strings and all
other numeric values must reject. This explicitly clarifies 'integer0/1/2' in the
document while retaining the canonical enum and no string/bool coercion.

Host probe evidence is p1c-host-parity-probe-20261021.json. Sequence1.0/string/bool
already reject in both implementations; boost integer1 accepts in both. Those
review hypotheses are not accepted as demonstrated bugs. Reproduced real gaps:
long sequence, integral oversight spelling, role_id/target_entity_id grammar,
and valid opaque receipt controls. Unpaired surrogate rejects in both, but C#
must expose a stable validation exception, not accidentally pass a broad test.

No changes to S11 proof, authority, trusted producers, reset authorization,
independent verification, worker separation, target profile or import readiness.
Two fresh independent closure reviews must see this clarification and the actual
repaired source/test evidence before acceptance. Existing review verdicts stand.
