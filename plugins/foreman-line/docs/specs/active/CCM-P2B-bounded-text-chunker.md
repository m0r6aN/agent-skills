---
ticket: CCM-P2B
title: Bounded deterministic UTF-8 text chunker
status: active
owner: clinton.morgan
created: '2026-10-22'
updated: '2026-10-22'
risk: elevated
surfaces:
  - src/keon/cortex/pipeline/__init__.py
  - src/keon/cortex/pipeline/ccm_text.py
  - tests/test_ccm_text.py
  - docs/specs/ccm-text-parser-v1.md
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Add a deterministic, bounded in-memory chunker for caller-supplied UTF-8 plain text and Markdown to the planned canonical Cortex `pipeline/**` surface. It supplies byte-stable chunks and provenance metadata for later extraction work while making no claim that content is safe, scrubbed, trusted, or semantically interpreted. This is one narrow P2B library component; later AST/git extraction, civic mapping, and semantic/live extraction remain separate work.

## Constraints

- Accept only exact `bytes` input and a caller-declared closed format value `txt` or `md`; reject unsupported formats (including PDF, Office, OCR, and archives). Do not infer trust or exemptions from filename, path, format, or fixture-like naming.
- Ratified pure API: `chunk_text(content: bytes, *, format: Literal["txt", "md"]) -> tuple[TextChunk, ...]`; `TextChunk` is an immutable value with `format`, `content_sha256`, `chunk_sha256`, `start_byte`, `end_byte`, and exact `payload: bytes`. No extra source/path field is accepted or returned.
- Ratified per-call hard guards: at most 4 MiB input bytes, at most 64 KiB per chunk, and a derived maximum of 65 chunks. These are library safety bounds only; they establish no import capacity, queue, throughput, or SLO.
- Decode UTF-8 strictly. Never normalize Unicode, line endings, Markdown, or whitespace. Chunk boundaries must be UTF-8 code-point boundaries; preserve each source byte exactly once and in order. Empty input yields an empty chunk sequence.
- Define all offsets as zero-based, half-open UTF-8 byte offsets into the original input. Every chunk's byte slice must equal the corresponding source slice. Hashes are deterministic SHA-256 over exact original bytes and exact chunk bytes; identifiers are deterministic content-derived identifiers and make no authentication or authorization claim.
- Use standard library only. No filesystem access, network, link fetching, Markdown rendering/execution, AST or Git extraction, external parser, queue/storage, or hidden mutable global state.
- Raw input and returned chunks are transient, unsanitized, and untrusted. The contract must state that any later durable enqueue path calls the accepted P2A scrubber immediately before persistence; this chunker itself never persists content.
- No checkpoint/resume token in this parcel. Whole-checkpoint ownership is deferred to P8; callers may deterministically rerun from the beginning. Do not add cursor/token state that implies resumability.
- Use strict input types and closed, content-free errors. Error strings and exception reprs must not include source bytes, decoded text, filename, or path. Do not log input.
- Preserve Python 3.10 compatibility and existing P2A baseline/pins. On the accepted base the planned pipeline directory is absent: create only its new minimal __init__.py and ccm_text.py. Do not create pipeline/api.py or edit legacy APIs, accepted scrubber code or unrelated files.

## Acceptance Criteria

1. The ratified public pure API and immutable value type, supported formats, exact limits, boundary selection rule, digest encoding, and error cases are specified in `docs/specs/ccm-text-parser-v1.md` and implemented as specified.
2. Chunking greedily takes the largest UTF-8 code-point boundary no later than 64 KiB from the current offset; it does not prefer line or Markdown boundaries. It is deterministic across calls and splits only at code-point boundaries. Concatenating payloads reproduces the input byte-for-byte; offsets are contiguous, half-open byte offsets and cover the complete input.
3. Inputs at the input/chunk byte boundaries are accepted when otherwise valid; over-limit input bytes and unsupported values fail closed with content-free errors. Malformed UTF-8 and unsupported/ill-typed format or input values fail closed.
4. Tests demonstrate unchanged LF, CRLF, Unicode normalization form, Markdown syntax, and trailing whitespace; no parser, filesystem, network, or Markdown execution behavior is introduced.
5. Tests prove errors/reprs do not expose unique sentinel source text; result metadata makes no trust/scrub/authentication claim.
6. The implementation adds only the four paths listed in Allowed Files, passes Python 3.10-compatible focused/full suites plus Black, isort, and mypy, and preserves all accepted P2A baseline identities and skips.
7. One implementation and at most one formal repair are allowed. After each, require fresh Step 0; preserve the accepted baseline and pins. Closure requires two independent architecture/security reviews and green exact-head CI/main merge gates. Any new failure or skip requires concrete triage; do not alter old thresholds or dispositions.

## Out of Scope

- Filesystem walkers, repository/document connectors, queues, persistence, backpressure, import orchestration, or operational capacity/SLO claims.
- P2A scrubber implementation or changes; this library does not sanitize. P3 must invoke P2A immediately before actual durable enqueue and prove no raw copy is persisted.
- AST/Git symbol extraction, CivicMemoryContracts mapping, provenance-tier assignment, semantic extraction, live-model extraction, PDF/Office/OCR/archive handling, or personal-data imports.
- Checkpoint/resume tokens, durable progress accounting, retries, or whole-ingest idempotency; these remain for P8 or later separately scoped work.
- Changes to existing `__init__.py`, `api.py`, legacy interfaces, dependency manifests, CI configuration, contracts, or any path outside Allowed Files.

## Allowed Files

Exact new paths relative to the sole Cortex repository:

- `src/keon/cortex/pipeline/__init__.py`
- `src/keon/cortex/pipeline/ccm_text.py`
- `tests/test_ccm_text.py`
- `docs/specs/ccm-text-parser-v1.md`

No existing file edit; any additional path requires coordinator-ratified amendment.

## Context & References

- `docs/CONTEXT-SPEC-V4.txt` — D7/D8 and CCM P2/P3 outline.
- `docs/CONTEXT-SHAPING-DECISIONS.md` — accepted S08 format envelope and S12 scrubber/deletion boundaries.
- `docs/goals/collective-civilizational-memory/loop-directive.md` — current P2A state, accepted baseline/pins, and active limits.
- `src/keon/cortex/scrubber/` — accepted P2A implementation contract; P2B must not duplicate or weaken it.
- `docs/specs/ccm-scrubber-v1.md` — P2A reference.

## Verification Plan

Use the repository's established Python 3.10-compatible focused and full validation commands, Black, isort, and mypy; preserve all known accepted baseline outcomes and pin identities. Obtain two fresh independent architecture/security reviews and verify green exact-head CI and main merge gates before closure.

Mandated reviewer focus questions:
- Do chunk boundaries and identifiers depend only on exact input bytes and declared format, with no Unicode or line-ending mutation?
- Can malformed or oversized input cause unbounded allocation, excessive chunk emission, or source disclosure through errors/reprs?
- Could a caller mistake returned bytes, hashes, deterministic identifiers, Markdown format, or origin metadata for scrubbed, trusted, authenticated, or safe content?
- Does any code path fetch links, touch the filesystem, execute/render Markdown, or imply unsupported document-format coverage?
- Are P2A pins, existing skips, and all files outside the four authorized new paths preserved?


### Coordinator-ratified C02-B1 exact library contract

The authorized originating operator ratifies this narrow interface under the
owner's blanket non-destructive decision/approval authority. No source dispatch
occurs until frozen advisory/schema, clean accepted-base baseline and exact
Gate2/role admission. Risk remains elevated with two independent architecture
and security reviews; this small pure library uses a fresh cheap native builder.

- Sole API: chunk_text(content: bytes, *, format: Literal["txt", "md"])
  ->tuple[TextChunk,...], directly imported from pipeline.ccm_text. Export
  TextChunkError from the same module. New __init__.py is minimal, with no API,
  legacy imports, effects or registration. All four new paths must be unused.
- TextChunk is a frozen slots value with format:str, content_sha256:str,
  chunk_sha256:str, start_byte:int, end_byte:int, payload:bytes. Bytes and wrapper
  are immutable; repr excludes payload and decoded/source text. This public
  constructible type and its hashes are not attestations. No source/path/tenant
  label, trust tier, identity/provenance qualification or classifier is added.
- Validate exact built-in bytes first, then exact built-in str format in
  {txt,md}, then <=4,194,304 input bytes BEFORE decoding/hash allocation, then
  strict UTF-8. Reject scalar subclasses without invoking their methods. Empty
  valid input yields (). No sniffing or authenticity claim follows from a
  caller-declared format: valid UTF-8 bytes declared txt/md remain raw text even
  if they resemble another format. format=pdf/docx/ocr/archive is rejected.
- Greedily take largest UTF-8 codepoint boundary <=65,536 bytes from current
  start. No codepoint splits or empty chunks. Root offsets start0, contiguous
  half-open byte ranges cover each source byte once. A nonfinal chunk has at
  least65,533 bytes; hence the 4MiB input guard implies <=65 chunks. This derived
  count is not an independently reachable128-chunk knob; no test claims an
  impossible public input can exceed it while satisfying the file guard.
- Hashes are full lowercase64hex SHA256 over original complete bytes and each
  exact chunk payload, respectively. Format does not change hashes. Equal
  repeated chunks may have equal chunk digests; these are fingerprints, not
  globally unique chunk IDs or tenant-scoped authorization. P8 must bind actual
  source/scope/offset identity and checkpoint/idempotency before ingestion.
- Preserve BOM, LF/CRLF, decomposed Unicode, whitespace and all strictly valid
  UTF-8 bytes, including NUL; this is byte chunking, not safety qualification.
  P3 must strictly decode the chunk to an appropriate JSON envelope, invoke P2A
  immediately before durable enqueue and reject its unsafe Unicode/domain
  cases. No return value/format/flag here bypasses that independent boundary.
- Closed TextChunkError codes: invalid_content_type, invalid_format,
  resource_limit, invalid_utf8, in that validation priority. str/repr expose
  only closed code; args is empty; no raw decode error in cause/context. Raise
  sanitized errors outside caught UnicodeDecodeError context. No raw input or
  partial chunk tuple on failure; no logs, persistent cache or hidden state.
  Cancellation/process errors are not converted to ordinary success. Arbitrary
  external traceback/test-runner introspection is not controlled by this module.
- Tests use synthetic-only content and stdlib independent expected digests and
  byte-boundary vectors. Cover ASCII exact64KiB and4MiB, multibyte boundary
  cases yielding65chunks, malformed/overlong/truncated UTF-8, BOM/CRLF/NFC-vs-NFD,
  repeated chunks/format-independent hashes, empty input, closed repr/error
  args/cause/context, strict subclass rejection without methods and oversize
  rejection before decode. No test/claim of Markdown semantic parsing/execution.
- Preserve all accepted merged-base tracked source/test/config and P2A pins,
  every baseline test identity and137existing skip dispositions. New failures
  need concrete triage. Existing BM2 timing variance and the unfrozen-clock
  gravity tie failure mechanism remain known inherited risks, not this parcel's
  source fixes. No threshold/skip changes or blind retries. Actual exact-head
  and merged-main CI must pass. One implementation plus one formal repair,
  fresh Step0/restatement-stop then GO for each, no builder commit/push.
- Fresh paid review admission requires exact packets, cheapest capable qualified
  route, finite parcel/day/effort/account guards and ALL prior unknown/failure
  holds; no paid dispatch is implied by shaping. Ask for compact completed
  review verdicts (<=500words), not long coverage essays that truncate.
