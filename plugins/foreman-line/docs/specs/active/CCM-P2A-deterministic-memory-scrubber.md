---
ticket: CCM-P2A
title: Deterministic in-memory CCM scrubber
status: active
owner: clinton.morgan
created: '2026-10-21'
updated: '2026-10-21'
risk: elevated
surfaces: [src/keon/cortex/scrubber/__init__.py, src/keon/cortex/scrubber/models.py, src/keon/cortex/scrubber/service.py, tests/test_ccm_scrubber.py, docs/specs/ccm-scrubber-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
expertise: engineering
inputs: [text]
permission_profile: builder-standard
data_classification: internal
thinking_level: low
---

# CCM-P2A — deterministic in-memory scrubber

## Intent

Add a pure, deterministic Cortex library that converts a bounded JSON-like text envelope into a sanitized envelope before any later P3 durable enqueue. It covers nested content and metadata strings, including paths and graph/error text, and returns only sanitized values plus non-content accounting metadata. This parcel establishes a library contract; it does not claim an existing queue or live ingestion route calls it.

## Constraints

- Sole implementation repository is the accepted Cortex repository; dispatch must pin its exact accepted base and verify the five new paths below are unused. Do not edit existing outcome-ingestion, temporal extraction, `api.py`, or any other legacy flow.
- Follow accepted `ccm-contracts/2.0.1`, `docs/specs/ccm-memory-graph-v2.md`, and S12. Raw credential text is never returned in the durable-candidate payload, including for synthetic fixtures. A fixture path is never an exemption. P2A never qualifies a positive synthetic classification: evidence hints remain unverified and never suppress redaction. Later qualified classification requires explicit known synthetic values and independent positive fixture evidence; absent evidence is no exemption.
- Scrub keys and values recursively, including provenance, paths, graph strings and error text, within the explicit per-item bounds: at most 1 MiB canonical UTF-8 JSON input, depth 32, and 20,000 visited nodes. These are guard limits for this library, not bulk-import capacities or throughput evidence. Reject unsupported types, invalid UTF-8/surrogates, normalized key collisions, limit violations, and any ambiguity with a closed non-content error code; never return partial output.
- Coordinator-ratified API (`ccm-scrubber/1.0`): `scrub_payload(payload: dict[str, JSONValue], *, tenant_id: str, key_epoch: str, hmac_key: bytes, known_secrets: Sequence[KnownSecret] = (), synthetic_evidence: SyntheticEvidence | None = None) -> ScrubResult`. `KnownSecret` has `value: str` and `kind: str` (kind must match `[a-z][a-z0-9_]{0,31}`); `SyntheticEvidence` has `fixture_id: str` and `evidence_ref: str`, both non-empty bounded identifiers supplied by trusted caller. `ScrubResult` has `payload: dict[str, JSONValue]`, `key_epoch: str`, and immutable counts `value_nodes_visited`, `strings_scanned`, `strings_redacted`, `known_secret_matches`, `catalog_matches`. `ScrubError` exposes only `code` from the closed set below; its `str`, `repr`, args, and chained-cause behavior expose no input, key, tenant, or exception text. No module logs or stores input.
- Frozen validation: `tenant_id` must be a `str`, NFC-normalized already, nonempty, <=256 UTF-8 bytes, and contain no C0/C1 controls; `key_epoch` must be 1–64 ASCII characters matching `[A-Za-z0-9._-]+`; `hmac_key` must be exactly bytes and 32–64 bytes. Length/type/degenerate-all-zero or repeated-single-byte keys can be rejected, but the library cannot certify entropy, issuance, tenant ownership, provider, or operational suitability. Tests use synthetic-only keys. Missing/invalid caller inputs fail closed.
- Frozen strict JSON domain: object keys are strings; values are object/list/string/bool/null or finite int/float (bool handled separately). Reject bytes, tuples, custom objects, NaN/Inf, NUL, unpaired surrogates, and keys that collide after NFC normalization. Strings and keys are normalized to Unicode NFC before detection/output. Root depth is 0; each nested object/list increments depth by one; reject depth >32. Root value node is 1; every object member value and list item adds one; object keys are scanned but are not value nodes. Reject above 20,000 value nodes. Compute input size as UTF-8 byte length of canonical JSON serialization (`sort_keys=True`, `ensure_ascii=True`, separators `(',', ':')`) after type/Unicode/key-collision validation; reject above 1,048,576 bytes. These per-item guard limits are not import capacities or SLO evidence.
- Frozen matching catalog and precedence, applied independently to every normalized string value and object key: (1) caller known-secret literals, exact case-sensitive substring after NFC, longest UTF-8 literal first then kind then literal byte order; empty literals reject; (2) PEM private-key blocks from exact `-----BEGIN (RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----` through matching `-----END ... PRIVATE KEY-----`, DOTALL; (3) credential-bearing URL authority values matching `scheme://userinfo@` where userinfo contains a colon; (4) `Authorization`/`Proxy-Authorization` header values after `Basic` or `Bearer`; (5) AWS access-key IDs `\bAKIA[0-9A-Z]{16}\b`; (6) GitHub token prefixes `\bgh[pousr]_[A-Za-z0-9]{20,255}\b`; (7) assignment values for case-insensitive keys `api[_-]?key|secret|token|password|passwd`, followed by optional whitespace, `:` or `=`, optional whitespace and a nonempty quoted or unquoted scalar (quoted strings end at matching quote; unquoted ends at whitespace/comma/semicolon); (8) LLM API-key tokens using complete-boundary `sk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,256}`; (9) JWT-shaped triples of three base64url segments, each 8–4096 characters. Prefix/segment patterns require complete token boundaries; no prefix-only truncation of a longer token. Generate candidates on the original normalized text, then union every overlapping interval into one complete redaction span (touching intervals remain separate). Choose the span kind from the highest-priority participating candidate, breaking known-secret ties by the frozen known-secret ordering. HMAC the entire union substring. Never discard a partially overlapping span and leave an exposed suffix. Count one accepted span per union, classified as known-secret or catalog according to its selected kind. Token kind is the known-secret kind or catalog label `pem_private_key`, `url_credential`, `auth_header`, `aws_access_key_id`, `github_token`, `credential_assignment`, `llm_api_key`, or `jwt`. This bounded catalog does not claim detection of arbitrary secrets or unknown provider formats.
- Frozen HMAC: NFC-normalize secret text; encode UTF-8. Compute HMAC-SHA256 using caller bytes over the exact canonical JSON bytes `canonical_json({"domain":"ccm-scrub-v1","tenant_id":tenant_id,"key_epoch":key_epoch,"kind":kind,"secret":normalized_secret})`, using the existing `core.canonical.canonical_json`; lowercase hex digest first 12 chars forms `[REDACTED:<kind>:<hmac12>]`. Same secret within same tenant/epoch/kind correlates deterministically; tenant, epoch, kind, or secret changes the token. No claim of anonymity or proof follows from it.
- `SyntheticEvidence` is a validated, unverified caller hint only, grants no synthetic classification, affects no redaction/count result, and is not returned or persisted. With or without a valid hint, explicitly listed secret literals and catalog matches are always redacted. Fixture path/name is not evidence and grants no exemption. Closed error codes: `invalid_payload`, `invalid_tenant`, `invalid_key_epoch`, `invalid_hmac_key`, `invalid_known_secret`, `invalid_synthetic_evidence`, `invalid_unicode`, `key_collision`, `unsupported_value`, `non_finite_number`, `resource_limit`, `serialization_failure`. Errors are atomic: no result/payload on failure. Since traversal stops at first unsafe input, error accounting reports only `value_nodes_visited` and `strings_scanned` before failure; it makes no claim about unvisited remainder or full accounting on rejected envelopes. Successful results define each count as actual traversal totals; `strings_redacted` counts source string occurrences changed, and match counts count accepted non-overlapping candidate spans.
- Do not mutate durable schemas or introduce dependencies. The returned payload is sanitized-only and result metadata is non-content; no raw originals, exception text, or values in module logs/repr. Caller responsibility includes not logging the supplied input or key. This library cannot introspect arbitrary external tracebacks or test-runner output.
- This defines the sanitized-only boundary P3 must enforce mechanically before durable enqueue and must prove has no raw durable copies. It does not integrate with or prove that future boundary.

### Ratified refinements and precise implementation boundaries

The authorized coordinator ratifies this new library interface/profile under the
owner's blanket non-destructive decision/approval grant. These refinements resolve
proposal ambiguity; no charter trust, privacy, key-custody or exit gate changes.

- Use exact built-in dict/list/str/int/float/bool/None types only; reject custom
  containers/scalar subclasses without invoking their iterators, repr or coercion.
  Root is a dict. The frozen result/count wrappers expose no raw payload/key in
  repr. Return a detached new sanitized tree with no input aliases; the payload
  is caller-owned data, not deeply immutable or an attestation. P3 must invoke
  scrubbing immediately before its own enqueue and cannot trust a result type,
  serialized flag, caller-supplied token or mutable wrapper as proof of scrubbing.
- Before NFC or JSON allocation, bound aggregate raw string/key UTF-8 bytes by
  1MiB, individual codepoint length by1MiB, and traverse with the stated depth/node
  limits (including cycles). Stop early; do not serialize/normalize an unbounded
  payload to discover it is too large. Final normalized canonical JSON must also
  be <=1MiB. This defines two explicit bounds, not a promise of constant1MiB RAM.
  Invalid Unicode rejects before normalization. Canonical serialization is reused
  only after bounded validation. Output-growth is bounded separately: final
  canonical sanitized JSON <=4MiB or atomic resource_limit; no partial result.
- At most128 known literals, each1..4096 normalized UTF-8 bytes, aggregate<=64KiB.
  Duplicate identical literal/kind entries deduplicate; the same normalized literal
  with conflicting kinds rejects invalid_known_secret. Definitions are validated
  before traversal. KnownSecret and SyntheticEvidence repr omit all supplied
  text. Synthetic identifiers use the existing ASCII identifier grammar1..128;
  they are unverified hints only. Trusted context supplies a nonsecret key epoch;
  reject an epoch matching a known secret or catalog credential. No tenant ID or
  evidence text is returned or exposed in diagnostics. Key length is32..64 bytes;
  reject repeated-single-byte keys, without claiming this certifies entropy.
- For URL credentials redact the entire authority userinfo substring, leaving
  scheme, separator and host outside that candidate; any overlapping known secret
  still participates in union redaction. Auth-header matching is case-insensitive
  for the header and Basic/Bearer scheme and replaces only credential material.
  Assignment matching preserves the key/delimiter and replaces the complete value;
  escaped quotes are recognized. A credential assignment with unterminated quoted
  value, or an unmatched recognized private-key BEGIN/END pair, rejects the whole
  envelope as invalid_payload. Implement delimiter scanning without catastrophic
  regex backtracking; resource-bound hostile text tests cover missing delimiters,
  long token-like strings and dense overlapping matches.
- Counts classify original normalized source strings and union spans, never scan
  emitted tokens again inside the same call. Error counters are zero-based partial
  traversal counters when available, never an unverified remainder count. No API
  claim of idempotence across repeated scrubbing calls. No plaintext/HMAC key in
  module logging, cache, repr or public exception args/cause/context. Build sanitized
  errors outside a caught raw exception context; process cancellation/interrupt is
  not converted into ordinary input success. Caller/test harness controls outside
  this pure library remain explicit limitations.

## Acceptance Criteria

1. The five exact new paths listed under Allowed Files implement the ratified API, immutable result/counts, closed errors, and deterministic pure scrub operation; no existing file changes. The coordinator-ratified refinements below bind before dispatch.
2. The exact supported detection catalog, Unicode normalization, key and tenant validation, preimage bytes, token form, synthetic evidence semantics, limits and error codes above are recorded in `docs/specs/ccm-scrubber-v1.md` and covered by deterministic fixtures. Any deviation requires coordinator decision before implementation.
3. Tests plant secrets in nested body text, object keys, paths, provenance/metadata, graph strings and error-like fields, and assert neither returned data nor error/repr/test diagnostics expose them. Tests cover tenant separation, key-epoch rotation, Unicode normalization, normalized-key collisions, missing/invalid keys, synthetic-path negative cases, explicit synthetic evidence, invalid UTF-8/surrogates, and depth/size/node limits.
4. Any unsafe/ambiguous item rejects the whole envelope with a closed non-content error code and no partial output. Successful accounting follows the definitions above; failure counts are explicitly partial traversal counts and do not imply unvisited items were checked.
5. No test or documentation implies this library is wired to an outbox, stores data, qualifies a key provider, recognizes every possible secret, or proves cryptographic erasure. Existing tests remain untouched and are reported as baseline, not claimed as newly passing unless run.
6. Independent architecture and security reviews examine secret coverage, boundary semantics, HMAC construction, diagnostics, fail-closed behavior, and synthetic evidence; their results are required before acceptance.

## Out of Scope

No UTF-8 document/Markdown parser, AST/git symbol parser, extractor engine, model or paid extractor, ingestion worker, queue, outbox, storage, database, `api.py`, legacy extractor integration, producer authentication/admission, provenance classifier, key provider/custody, key destruction, personal-data import, deployment, or claim of completed CCM-P2/P1/full-goal readiness.

## Context & References

- [CCM charter and P2–P8 sequence](../../goals/collective-civilizational-memory/charter.md)
- [Accepted v4 P2/P3 scope](D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt)
- [Accepted S08 and S12 decisions](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md)
- [Accepted CCM memory and temporal graph v2](D:/Repos/ccm-worktrees/cortex-p1d/docs/specs/ccm-memory-graph-v2.md)
- [Cortex canonical JSON helper](D:/Repos/ccm-worktrees/cortex-p1d/src/keon/cortex/core/canonical.py)
- [Cortex test patterns](D:/Repos/ccm-worktrees/cortex-p1d/tests)

## Allowed Files

Exact paths relative to the Cortex repository; create these new files only:

- `src/keon/cortex/scrubber/__init__.py`
- `src/keon/cortex/scrubber/models.py`
- `src/keon/cortex/scrubber/service.py`
- `tests/test_ccm_scrubber.py`
- `docs/specs/ccm-scrubber-v1.md`

Any need to edit an existing source/config/API path or add a path requires a coordinator-ratified spec amendment before implementation.

## Verification Plan

Run the new focused test file and the complete Cortex test suite from the pinned clean worktree. Mandated reviewer focus questions: Does every nested textual surface, including keys and diagnostics, get scrubbed before any future enqueue? Can any unsafe input yield partial or raw output? Does the HMAC preimage bind tenant, key epoch, kind, and normalized secret without ambiguous encoding? Are synthetic fixtures explicitly evidenced while fixture paths never exempt credentials? Do documented bounds and detection claims match actual tested behavior? Does any wording imply queue integration, key destruction, or universal secret detection?

## Dispatch Envelope and Completion

One implementation plus one formal focused review repair, with a Step0 restate
and stop before each; ordinary debugging inside either lane is not a new attempt.
Use a fresh small qualified native builder with least context and exactly five
new files; no dependency/API/legacy/infrastructure mutation. Native account usage
is unknown/separate. Preserve the accepted complete Cortex baseline test identities
and run focused + complete tests in a sanitized environment, Black/isort/mypy.
Two fresh independent frontier architecture/security reviews and any required
closure verdicts bind acceptance. Paid routing requires a separate exact finite
admission record (packet bytes, requested model/effort/output, deadline, whole
parcel/day/effort limits, preserved unknown holds and no automatic retries).
No paid budget is inferred merely from this draft. Completion supplies exact
file hashes, commands/results/test identities, hostile-input coverage, versions,
limits, usage and estimated/unknown costs. No builder approval, promotion or merge.


### Accepted-base local timing disposition

Before any P2A source existed, the complete Windows/Python3.13 baseline ran
2993 cases:2855passed,137opt-in skipped, and only the pre-existing BM2
`test_receipt_overhead_bounded[50]` failed (9.38x vs3.0,0.4ms vs4.1ms).
Accepted base6139ddd8802540829eebce07215106e4b16ca360 passed both main CI runs
39717649317/39717649103. This does not authorize a benchmark fix, threshold
change, new skip or blind rerun. Keep all267original source/test/config pins,
all2855passing baseline identities and137existing skip dispositions. Run and
retain the complete candidate suite even if that same baseline timing case
recurs; any other failure or new skip stops for concrete triage. All focused
scrubber tests, formatting/types and actual exact-head CI must pass before
acceptance/merge. Same baseline timing variance is not claimed repaired or
ignored in whole-suite reporting. No P2A work owns BM2 or source issue81.

### C02-R1 — bounded scanner repair clarification (2026-10-22)

Before the single formal repair, the authorized coordinator ratifies these
additional explicit safety limits and boundary semantics. They narrow the pure
library envelope; they grant no ingestion, trust, privacy or key-custody waiver.

- At most65,536 detection candidates across the complete call, before materializing
  another candidate; excess rejects atomically as resource_limit. Include known
  and catalog candidates. This bound is distinct from nodes and final output size.
  Merge unions without retaining/copying every member; retain only interval and
  selected-priority metadata. No quadratic repeated scanning of overlapping PEM
  markers or repeated assignment starts; a shared linear scanner or precomputed
  boundaries must preserve the frozen all-overlap union/priority semantics.
- Integers have at most4,096 decimal digits (sign excluded). Use a cheap bit-length
  guard before bounded conversion. Aggregate raw string/key UTF-8 bytes plus
  integer/float canonical scalar bytes must be <=1MiB before whole-tree JSON
  allocation. Reject resource_limit above either bound. This makes Python3.10+
  behavior explicit and avoids relying on interpreter global int-conversion limits.
- Reject known literal codepoint length >1MiB before Unicode validation/NFC;
  normalized per-literal4,096-byte and aggregate64KiB bounds still bind. Tenant
  codepoint length <=256 is checked before Unicode/NFC/UTF-8 allocation. Do not
  normalize an arbitrarily long trusted-context string to discover it is too large.
- Container depth counts dict/list containers only: root0, nested container+1;
  scalar children do not add container depth. A container at32 holding a scalar
  succeeds; a nested container at33 fails. Exact node semantics stay unchanged.
- For URL detection an authority ends at whitespace, slash, question mark or hash.
  Its userinfo extends through the last at-sign in that authority and must contain
  a colon; an empty username is valid. Redact that entire userinfo, preserving
  scheme/separators/host. A slash in a supposed password terminates authority,
  rather than extending a URL credential candidate across a path. Scan scheme and
  authority without retrying a greedy scheme expression at each character.
- Reject key_epoch containing any normalized known literal, using the same
  substring semantics as payload detection. It must remain nonsecret metadata.
- Add meaningful exact boundary tests and bounded hostile regressions for these
  findings, candidate exhaustion, repeated assignments/PEM, long token-like text,
  canonical input/output edges and partial closed failure counts. No benchmark
  threshold changes, new skips or existing-file edits. The original complete
  baseline3013 identities and137skip dispositions remain the repair tripwire.

Initial reviewer JWT no-dot complexity claims are analytical, not reproduced:
the existing negative lookbehind rejects interior starts in one long token run.
The repair must demonstrate bounded long-run behavior; it need not replace a
correct pattern merely to follow an unverified complexity allegation. URL and
repeated-assignment scanning require their own independent examination.
