# Source-observation amendment — 2026-09-26

Status: accepted by the HRO coordinator under the owner's explicit authority for
necessary prerequisites. Acceptance covers this source semantics contract and
the review conditions below; it does not dispatch producer implementation.

The byte-preserved [proposal](source-evidence/rcm-host-cache-source-contract-v2-proposal.md)
is accepted subject to this amendment, which prevails over its provisional prose.
The [observation](source-evidence/public-metadata-observation-20260926.json)
remains supplemental evidence, not canonical catalog input.

## Accepted semantics

The immutable observation envelope profile is `rcm-public-observation/v2`.
Its provider-specific extraction profiles must separately pin provider key,
exact acquisition URL, response schema, field mappings, units, and execution
protocol/endpoint evidence. Profile changes require a new version and review.
The existing observation's profile labels are discovery labels, not proof that
the extraction mappings below have already been accepted.

`checkedAtUtc` means receipt time of the complete public response that was then
successfully parsed. It is not provider publication, cache refresh, release,
availability or quality time. Validate request-start <= complete-receipt <=
evaluation time. Preserve original timestamps and conservatively truncate to
milliseconds for P1's strict ISO encoding, never round forward. The fixed
24-hour bound measures observation age. Unknown `providerDeclaredTime` stays
unknown. HTTP dates, ETags, model-created times, host mtime and export generation
time cannot replace it. Legacy source times retain their existing meanings;
the old host export's null times remain null.

Retain reproducible per-model data: either exact unauthenticated public response
bytes, or an allowlisted model projection with its own digest, source response
digest, field locators and transformation profile. Aggregate field counts plus
a hash of discarded bytes are insufficient input to a production producer.
Bind exact source URL/profile/digest and requested coverage in the evidence.
Hashing public responses is permitted; hashing raw mixed host files is not.

No inferred capabilities: an ID-only OpenCode record cannot acquire context,
max-tokens, reasoning, modalities or prices from another provider or defaults.
Documentation can contribute only under a separately reviewed extraction profile
with retained evidence. The current supplemental artifact does not supply the
per-model facts needed to ratify those mappings.

Canonical v1 conversion requires complete required facts for every identity in
its explicitly declared requested scope. A producer preserves a refusal entry
for every missing/incomplete requested identity; it must not silently omit one
and label the remainder complete. A scope-limited catalog is not a full catalog.
Unknown-capability partial-fact support would require a separate schema amendment,
not false/zero placeholders inside P1's closed schema.

Public catalog URLs and protocol observations are not endpoint authority.
`approvedConfig` must come from separately accepted repository authority with
digest provenance. D1/D13 remain in force; Pi settings never supply authority.

## Evidence custody

Copied without modification from the bounded source task's temporary directory:

- Proposal SHA-256: `b50e4dc7050cb248915b660f795fdb661e48c2d084003201be0aefa957e9fce7`.
- Observation SHA-256: `dc89f6af114c04d2132601ff1a6f24b8177da9c1ca524bbe87f96b0438175e01`.

The observation's seven-fraction timestamps remain unchanged here; millisecond
conversion belongs to the accepted producer contract, never an evidence rewrite.

## Sequencing

RCM-P1A is the supported bounded reader/projector wrapper and public exports.
RCM-P1B is a separate draft producer; real source field mappings remain blocked
until the source task supplies reproducible per-model data. RCM-P1 must merge
before either implementation. Coordinator serializes the RCM/PMC barrel edits
in either order, records exact bases, and rechecks exports on the second edit.
No historical P1 spec edit is made before PR51 merges.
