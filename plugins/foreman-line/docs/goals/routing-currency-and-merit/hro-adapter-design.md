# Supported RCM adapter for HRO/PMC

Date: 2026-09-26. Status: revised draft; no implementation dispatched here.

The minimal prerequisite is a bounded supported wrapper around P1's existing
readCatalogSnapshot and projectEligibility plus public exports. The old proposed
legacy-host normalizer is removed: it would always yield unknown timestamps and
adds no production data. The old host export remains negative evidence only.

[RCM-P1A](../../specs/active/RCM-P1A-sanitized-snapshot-adapter.md) owns the wrapper
and explicit source-scope binding. [RCM-P1B](../../specs/active/RCM-P1B-public-observation-producer.md)
separately owns production serialization only after real field mappings are
reviewed. RCM/PMC barrel edits may occur in either coordinator-recorded order;
the second preserves exports and repeats checks on the exact merged base.

The [accepted source amendment](source-observation-amendment-20260926.md) permits
profile-bound public observation age, with conservative millisecond timestamps,
separate unknown provider-declared time, reproducible per-model evidence, no
invented capabilities, and independent execution-endpoint authority. It does not
reinterpret the old export or synthetic fixtures. A successful public fetch is
not model availability, privacy assurance, role eligibility or dispatch authority.

Source records with missing required P1 fields remain explicit refusal inventory.
No partial record or silently filtered catalog becomes a complete artifact.
OpenCode ID-only responses cannot presently satisfy P1's required facts. Actual
OpenRouter per-record mappings still need real retained data; aggregate field
coverage alone is insufficient. No alternate projector/schema is hidden here.

No historical P1 spec changes before PR51 merges. No runtime source files are
changed by this shaping record. Use Node 24.19.0 and independent reviews for both
implementation slices; neither claims RCM-P4A/P5/P6 or HRO runtime completion.
