---
ticket: CCM-P2F
title: Bounded deterministic extractor engine composition
status: done
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_engine.py, tests/test_ccm_engine.py, docs/specs/ccm-extractor-engine-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Compose accepted text, restricted Python, civic v2, legacy civic and restricted
Git capabilities into a bounded deterministic engine. Every source has an
explicit outcome; unsupported, deferred and failed work is never silently lost.
Provide a hash-matched DeterministicFixtureExtractor for offline CI. No live
semantic provider, storage, outbox, source trust or receipt authority is added.

## Constraints

Python3.10+, existing dependencies, three NEW files only; no accepted-module,
CI, dependency, export or schema changes. Gate2 waits for accepted P2L and exact
base/baseline evidence. Qualified runtime adapters are trusted operator
configuration, never selected by source bytes/labels. Native/provider/Pi routes
remain held. Tests use module-local mocks; actual pinned Windows runtime
composition is separately qualified by parent with synthetic sources only.

## Acceptance Criteria

1. Frozen slots repr=False values, immutable built-in fields/tuples only:
   - SourceDocument(key:str, format:str, content:bytes, checkpoint:bool=False).
   - ExtractedArtifact(kind:str,payload:bytes,payload_sha256:str,
     start_byte:int|None=None,end_byte:int|None=None), property admitted=False
     and trust_tier=unverified_candidate. Digests are fingerprints, not IDs.
   - SourceResult(key,format,source_sha256,status,reason:str|None,artifacts:tuple).
     Status complete,pending_extraction,unsupported,failed. Only complete may
     carry artifacts; complete reason=None, all others closed nonnull reason.
   - ExtractionBatch(results:tuple,operations:int,checkpoint_attempts:int,
     artifact_count:int,output_bytes:int,runtime_held:bool).
   - GitExtraction(status,reason,snapshot:GitSnapshot|None,
     batch:ExtractionBatch|None,path_keys:tuple[tuple[str,str],...]). Status
     acquired,failed,pending_extraction. acquired means acquisition succeeded,
     not all batch work completed; snapshot retains author/committer/commit/file
     hashes and explicit exclusions. No partial snapshot on acquisition failure.
2. EngineInputError has code invalid_input/resource_limit only, empty args,
   sanitized str/repr and no content-bearing cause/context. Validate exact types
   BEFORE supplied operations. Engine/fixture global input errors fail atomically
   before any runtime call. No logs/clock/random/environment/credentials/shell/
   filesystem/network in engine; effects only calls to accepted operator ports.
3. DeterministicFixtureExtractor(entries:tuple=()) accepts at most64 exact pairs
   (source_sha256,tuple[bytes,...]); hashes distinct lowercase64hex, at most16
   outputs/entry, each<=65536bytes strictUTF8, totalbytes<=1048576. No mutable
   caller values retained, no IO/provider/source execution. extract(content:bytes)
   ->tuple[bytes,...]|None hashes exact built-in bytes and returns configured
   bytes for exact hash, None for missing. Exact sourcebytes<=2097152. Empty
   configured outputtuple is a successful empty fixture, distinct from missing.
   Fixture payloads are opaque unadmitted candidates, not a new memory schema.
4. ExtractorEngine(*,python_parser:DockerPythonParser|None=None,
   fixture_extractor:DeterministicFixtureExtractor|None=None) accepts only None
   or EXACT accepted classes; no arbitrary callback/ducktype or subclasses.
   run(sources:tuple[SourceDocument,...],*,checkpoint_budget:int=0,
   operation_limit:int=16,artifact_limit:int=256,
   output_bytes_limit:int=1048576)->ExtractionBatch. At most256sources,
   aggregate content<=2097152bytes. Unique ASCII keys[A-Za-z0-9_.-]{1,128};
   format[a-z_]{1,32}; exact bytes and bool checkpoint. Unknown format allowed
   for explicit unsupported result. Exact integer limits (not bool):
   checkpoint_budget0..32,operation_limit0..32,artifact_limit0..4096,
   output_bytes_limit0..4194304. Defaults above; check ALL sources/config/limits
   before any parse/runtime/fixture work. Never import/execute source contents.
5. Stable input order, one SourceResult for EVERY admitted source. SHA256 exact
   source bytes even when deferred. Each examined source consumes one operation,
   including unsupported/checkpoint-deferred sources. After operation budget,
   remaining rows pending_extraction/processing_budget_exhausted, unexamined.
   Output budget counts total published artifacts and payload bytes only. A
   source's artifacts publish atomically; if either remaining bound is exceeded,
   discard that source's candidate artifacts, mark it and all remaining sources
   pending_extraction/output_budget_exhausted; no later port/fixture calls.
   Exact-bound allowed; empty sources/empty output valid. Counters reflect actual
   examined operations/fixture attempts and published artifacts/bytes, no fiction.
6. Deterministic dispatch:
   - txt/md: accepted chunk_text(content,format=...) only. Each text_chunk artifact
     contains exact chunk.payload and original byte spans. No semantic inference.
   - python: ONLY configured accepted DockerPythonParser.extract(content), never
     direct in-process extract_python_symbols. No configured port -> pending
     runtime_unavailable, not success. Validate exact PythonExtraction and matching
     content_sha256; accepted port already validates symbols; each python_symbol
     artifact is sorted compact ASCII JSON of kind,lexical_name(list),start_byte,
     end_byte,content_sha256. Preserve normalized names and original byte ranges,
     no bodies/execution/reachability. Wrong result/hash ->failed/invalid_response.
   - rejection/caution/inheritance: unchanged map_civic_record, emit one civic
     artifact of exact canonical_payload. legacy_deliberation/legacy_proposal/
     legacy_challenge: accepted map_legacy_civic_record, same civic artifact.
   - chat/prose: checkpoint must be True, else pending/checkpoint_required. Need
     configured fixture extractor, else pending/fixture_unavailable. Successful
     completed cache keyed(format,source_sha256) within this batch is reused
     without another attempt. Otherwise if checkpoint budget exhausted ->pending/
     checkpoint_budget_exhausted. Each actual lookup consumes one attempt even
     when missing. Missing ->pending/fixture_unavailable. A hit emits opaque
     fixture_candidate artifacts; emptytuple complete. No caching of misses or
     deferred rows; earlier non-checkpoint row must not poison later checkpoint.
   - Other formats ->unsupported/unsupported_format, empty artifacts.
7. Translate accepted TextChunkError, PythonParserError, CivicMappingError and
   GitAcquisitionError into closed reason codes only; preserve no raw exceptions.
   Whitelist accepted codes, unknown codes/unexpected port exceptions map to
   failed/isolation_failure and HOLD this engine's runtime lane. Any observed
   pending_cleanup or isolation_failure permanently holds runtime effects on
   this instance; subsequent Python requests are pending/runtime_held, no call.
   Pure txt/civic/fixture work may continue within budgets. No reset, automatic
   reconciliation, retry, fallback or cleanup-failure-as-success. Operator retains
   parser/source objects and their pending_cleanup evidence. This is local lane
   state, not a global route-clearance or cleanup-proof service. No aggregate
   realtime deadline/thread-safety claim; accepted ports retain their bounds.
8. extract_git(source:DockerGitSource,*,same four limits/defaults)->GitExtraction.
   Validate exact port type and ALL limit arguments BEFORE acquisition. Existing
   instance hold or source.pending_cleanup ->pending/runtime_held, no acquire.
   Otherwise call accepted source.acquire ONCE; source enforces one-shot use.
   Accepted closed failures ->failed/closedcode, snapshot/batch absent, path_keys
   empty; uncertain cleanup/unexpected exception holds runtime lane. No clone,
   fetch, host Git call, filename-to-command or trust inference in engine.
   Successful exact GitSnapshot is already independently validated by port.
   For EACH regular file in snapshot order create SourceDocument with key
   git_+sha256(pathUTF8), format python/.py,txt/.txt,md/.md (case-sensitive),
   otherwise unknown; content exact bytes. path_keys retains(key,path) for every
   file. Run full bounded batch: all files get results including budget/unsupported
   dispositions; never truncate to first16 silently. Snapshot.excluded retains
   symlinks/submodules without following. Preserve full acquired snapshot metadata
   transiently, never promote author labels/hashes to producer authenticity.
9. Test meaningful composition over frozen independent expectations. Cover each
   dispatch, exact byte/spans/hash/canonical identity and every source outcome;
   checkpoint0/at/over/dedup/empty/miss/non-checkpoint-first/cross-format cases;
   each argument exact-type predicate independently with raising canaries;
   malformed whole batch must make ZERO port calls, including a bad last row;
   unique keys, exact sourcecount/byte/operation/artifact/output limits; atomic
   per-source overflow and no later calls; errors/repr/immutability. No tests
   based solely on private implementation helper return values.
10. Python/Git tests use module-local fake exact classes/ports for CI and direct
    fault controls for wrong responses, typed closed errors, unexpected errors,
    preexisting/new cleanup holds, no subsequent calls, one acquisition and
    explicit exclusions/mixed files/author preservation. Test real engine call
    flow, not only helper functions; no subprocess/secret/network in ordinary CI.
    Actual parent synthetic composition exercises qualified Windows Docker
    Python and Git images separately; no personal or remote repository data.
11. Existing baseline/pins retained, fixture-only deterministic regression never
    triggers a model/provider call. Black/isort/mypy +restricted focused/full
    pytest, actual synthetic composition, two fresh independent risk reviews,
    exact-head/mainCI before acceptance. Same-family limitation disclosed. No
    storage/readiness claim from green pipeline tests/deployment workflow.

## Out of Scope

No LiveModelExtractor (later P8 gate), actual imports/PII, storage/outbox/P3,
tenant admission, graph persistence, semantic truth, proof/mint/approval,
cryptographic deletion, Gateway, new Docker/runtime adapter, SDK/package install,
global/session-persistent budget or durable dedup guarantees. Pending output is
an in-memory outcome; P3 must persist it crash-safely and scrub ALL text before
durable enqueue. Batch-local fixture budgets do not qualify later live-model caps.

## Allowed Files

- src/keon/cortex/pipeline/ccm_engine.py (NEW)
- tests/test_ccm_engine.py (NEW)
- docs/specs/ccm-extractor-engine-v1.md (NEW, parent-owned from frozen workorder)

## Context & References

Accepted P2A scrubber/P2B text/P2C Python runtime/P2D-A&B Git/P2E v2/P2L legacy,
and unchanged S01-S12/full-goal exits. Caller source labels and DTO construction
remain candidate data, never authenticated scope. Trusted runtime images/local
host qualification and Git stable-operator-custody preconditions remain binding.

## Verification Plan

After P2L acceptance, qualify exact base/image baseline, run Step0 and record
Gate2. One implementation in two fixed no-tools source slices: engine module,
then tests given exact applied engine. Plain complete Python file output, no
JSON-file envelope, fixed parent path and static AST validation. Parent derives
docs from frozen workorder and preserves authorship. One bounded focused repair
maximum; independent risk reviews never edit. Exact-hash green-chain merge and
status-only StageF closure, no held-route release and every reservation retained.

## Step0 dispositions — October24, binding clarification before Gate2

These operational definitions resolve GIT_BATCH_OVERFLOW,
GIT_RESPONSE_AND_HOLD_POLICY and VALIDATION_AND_FAILURE_BOUNDARIES. No goal
design/exit criterion or accepted dependency is changed.

- Accepted base P2L PR99 merge01531ec6,444pins,3743PASS137skip correspondence
  exists in parent evidence. Public signatures/DTOs/error lists and exact pins
  are supplied in the implementation packet; GATE2_EVIDENCE and
  ACCEPTED_PORT_CONTRACTS are satisfied prerequisites, not inferred APIs.
- Accepted Git caps256expanded entries and2MiB unique objects, but reused blobs
  can expand to64MiB file bytes. After acquire, inspect exact snapshot/file DTO
  shapes, filetuple<=256, exact contentbytes<=262144/file, UTF8 path<=1024bytes,
  nonempty distinct paths, lowercase64hex content fingerprints. The accepted
  port already verifies hash/object closure. If expanded sum>2097152, retain
  acquired snapshot/path_keys and return a nonnull ExtractionBatch with one
  pending_extraction/input_budget_exhausted row per file, fingerprints reused
  from accepted GitFile.content_sha256, operations/checkpoint/artifact/bytes=0.
  No parser/fixture call. Do not invoke run on an inadmissible expanded batch,
  truncate, rehash64MiB or return a partial list. Shape violations ->closed
  invalid_response and held runtime lane, no snapshot/batch/path_keys published.
- acquired always has reason=None,snapshot and batch nonnull, full path_keys.
  Other GitExtraction outcomes have snapshot/batch=None,path_keys=(). Any
  newly nonempty source.pending_cleanup AFTER acquire or failure overrides any
  other outcome with failed/isolation_failure and holds the lane. Python applies
  the same post-call cleanup precedence before artifact publication. A malformed
  Python result/hash or malformed Git response returns failed/invalid_response
  AND holds runtime lane. Preexisting hold/cleanup ->pending/runtime_held,no call.
- Public frozen DTO constructors are unvalidated value carriers, not admission;
  run requires EXACT SourceDocument objects and validates every input field.
  Returned engine artifacts have exact fields/digests, spans in[0,len(source)]
  with start<=end for text/python, bothNone for civic/fixture. Empty source and
  zero artifacts may complete. SourceResult reasons and metadata follow AC1.
- Known typed dependency errors use only exact built-in str codes from accepted
  closed sets; unknown/mutated codes and ANY unexpected Exception, including a
  pure-function/fixture error, yield failed/isolation_failure and hold the local
  runtime lane. Pure work can continue under budgets; no live/held provider route
  is ever invoked. Do not catch process termination just to claim success.
- Parent owns docs; source slices own only engine.py and tests. Whole ticket
  Allowed Files still has3paths; initial Step0's2paths denote implementation
  allocation, not an exclusion of the parent-owned third file.


## Delegated Gate2 — October24

All6Step0flags disposed by explicit binding clarification and actual accepted
P2L/base/API evidence. Direct owner legacy-then-engine plus existing blanket
authority admits one2slice no-tools Sol implementation: engine, then tests after
static application of exact engine. Parent docs only. Fresh finite550engine
plusclosedwrapper418.670375<=1000. One focused repair maximum, two independent
reviews and actual pinned synthetic composition required. Allreservations and
affected/native/privatePi routesHELD; no import or storage/admission authority.
