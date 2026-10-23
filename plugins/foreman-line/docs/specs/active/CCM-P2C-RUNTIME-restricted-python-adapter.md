---
ticket: CCM-P2C-RUNTIME
title: Restricted Docker Python parser and library composition
status: draft
owner: clinton.morgan
created: '2026-10-23'
updated: '2026-10-23'
risk: elevated
surfaces:
  - src/keon/cortex/pipeline/ccm_python_protocol.py
  - src/keon/cortex/pipeline/ccm_python_worker.py
  - src/keon/cortex/pipeline/ccm_python_runtime.py
  - tests/test_ccm_python_runtime.py
  - docker/ccm-python-parser/Dockerfile
  - docs/specs/ccm-python-runtime-v1.md
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Compose the accepted P2C pure declaration library with an actual bounded Linux
container worker, driven by a Windows/Linux Docker client. One source item per
container. Establish a production adapter capability and independently review
its composition; do not wire ingestion, authorize bulk data, release incident
routes, or claim Windows-native Python process isolation.

The owner directly authorized this adapter and composition review. This draft
requires actual advisory/readback, coordinator lint, base/pins, Step0 and Gate2.
Existing 120credit uncertain request and all affected routes remain held.

## Constraints

- Reuse accepted ccm_python.py byte-identically, source SHA256
  aa4d7d79058a4d4e364ab02519d5e97b3dc8d8ab5074872c61fdb7be1b31f9c3;
  accepted Cortex merge5cb07ba47f7f52dc85c228e06dc3d1bfe3ec4d04.
  No existing source/exports/config/dependencies/CI edits. Python3.10-compatible
  stdlib only. Docker and approved immutable image are deployment prerequisites,
  not dependencies installed or downloaded at request time.
- Public API in ccm_python_runtime: DockerPythonParser(image_id: str), with
  extract(content: bytes) -> accepted PythonExtraction. Constructor is TRUSTED
  OPERATOR configuration, not a source/request field. It accepts only exact
  built-in str matching sha256: plus64lowercase hex digits. Operator must have
  qualified that exact local image from this reviewed build; an arbitrary image
  ID/label is not an authenticity attestation. Source callers receive a configured
  parser and supply only exact built-in bytes (including no bytes subclasses).
  No caller Docker command/path/host, module, filename, env, parser options or
  automatic image selection. Constructor rejects unsupported platforms/invalid
  config with closed runtime_unavailable, without exposing supplied values.
- Fixed Docker client: Windows C:/Program Files/Docker/Docker/resources/bin/docker.exe
  with npipe:////./pipe/dockerDesktopLinuxEngine; Linux /usr/bin/docker with
  unix:///var/run/docker.sock. No PATH search, shell, remote Docker endpoint,
  retry/fallback, image pull/build/install or source-derived command argument.
  Other hosts fail closed. Fixed args are lists; random container name is
  ccm-python- plus UUID hex and never derived from source.
- Clear child CLI environment; explicit OS essentials only (SYSTEMROOT/WINDIR,
  SYSTEMDRIVE/COMSPEC/PATHEXT/TEMP/TMP/PROGRAMDATA if needed), then fixed DOCKER_HOST
  and an adapter-owned empty Docker config directory. Do not copy parent PATH,
  provider/database/gateway keys, Docker auth/proxy/context settings or env files.
  Create only an empty config.json control artifact; never write request source,
  declarations, wire replies or raw diagnostics into host/container temp files.
  No model/tool worker receives any credential. A filter alone is not a sandbox.
- Image base: Python3.13.15 local imageID
  sha256:b2bb53ac7b6fbe78a48c95b7c15130ea21de1674fc683fbc93158b0c23826823,
  repository digest python@sha256:7c61056e61ac89e852de05f3dc6fa51a6dd2181797bceed46aa725dd7cb2cd3b.
  Dockerfile pins the digest, copies ONLY accepted library/new protocol/worker
  into /usr/local/lib/python3.13/site-packages/keon/cortex/pipeline as namespace
  modules, uses USER65534:65534, and ENTRYPOINT python -I -B -m
  keon.cortex.pipeline.ccm_python_worker. No RUN/install/third-party modules.
  Label keon.ccm.profile=python-v1 and keon.ccm.library-sha256 with the exact
  accepted source hash. These are configuration checks, not provenance claims.
  The worker verifies interpreter3.13.15 and actual library bytes before parsing.
- Each container: --pull=never, no host mounts/devices, network none, root
  read-only, uid/gid65534, cap-drop ALL, no-new-privileges, memory128MiB,
  memory-swap128MiB (zero swap), CPU0.5, pids16, tmpfs /tmp rw/noexec/nosuid/1MiB,
  --log-driver=none. No service port or daemon. Verify actual created container
  config before starting; the worker verifies actual cgroup memory/swap/pids/CPU,
  nonroot identity, root/tmp mount properties and sets RLIMIT_AS96MiB,
  RLIMIT_NPROC0, CORE0, FSIZE1MiB. If any required evidence is absent, fail closed.
  Existing fixed synthetic mechanism reviews are precedent, not acceptance of
  this implementation. Source does not execute, import, acquire or spawn code.
- Worker sets a Linux5second wall alarm that exits without diagnostics, in
  addition to parent deadlines. One strict request then EOF; no persistent
  session. Invoke the accepted pure function only after frame validation.
  Worker stderr stays empty on all paths; library/error handler never writes
  source/names/tracebacks. Unexpected failures become one closed failure frame
  if possible, otherwise unsuccessful exit. Never serialize a traceback/local.
- Protocol module functions (internal to parcel, tests may directly import):
  encode_request(content: bytes) -> bytes; decode_response(frame: bytes,
  content: bytes) -> PythonExtraction; worker success/failure serialization may
  use its own small functions. Four-byte unsigned big-endian length, exactly
  payload and EOF, no second frame/trailing data. Request max262144bytes checked
  before decode/allocation. Worker rejects premature/trailing bytes atomically.
- Reply max1048576payload bytes, strict UTF8 JSON. Closed envelopes exactly
  {version:1,ok:true,content_sha256:<lowercase64hex>,symbols:[{kind,lexical_name,
  start_byte,end_byte},...]} OR {version:1,ok:false,code:<one library code>}.
  Library codes: invalid_content_type, resource_limit, invalid_utf8,
  unsupported_encoding, invalid_syntax. No detail/message/filename fields.
  Reject duplicate object keys at every level, unknown/missing keys, bool-as-int,
  NaN/Infinity/floats, invalid UTF8, malformed/trailing JSON, mixed envelopes,
  unbounded integer conversion and excessive JSON nesting before allocations.
  Depth at most8; integer lexemes at most10digits before int conversion.
  Check digest equals hash of ALL original input; <=2048symbols; exact closed
  kind, nonempty identifier names, lexical depth1..65; exact int ranges
  0<=start<end<=input length; sorted ascending start. Overlap/duplicate names are
  allowed. Host identifier validation may fail closed across Unicode versions;
  no new exact-language equivalence claim. Return only accepted frozen wrappers.
- Public PythonParserError exposes only one closed code via str/repr, args empty,
  no cause/context even under ambient caller exceptions. Codes are the5library
  codes plus runtime_unavailable, deadline_exceeded, invalid_response,
  isolation_failure. Constructor/type/size/order are deterministic; exact
  source bytes/type rejected before Docker invocation. Preserve all source
  library caps and unchanged types; no partial result. Parent accepts success
  only after zero child exit, empty stderr, complete valid reply and verified
  cleanup. A valid reply before timeout/nonzero exit/cleanup failure is rejected.
- Parent bounds EVERY subprocess stdout/stderr before buffering (no unbounded
  communicate/capture_output for runtime commands), and uses bounded writer/
  reader threads or platform-safe equivalent. Source input <=262144+4,
  output <=1048576+4; control-plane JSON <=65536; stderr <=4096 retained only as
  count/failure, not diagnostics. All pipes closed and Docker CLI processes
  reaped. No blocking pipe read outside a deadline. Do not leak raw response in
  error text/repr. This is Docker control-client containment, not an assertion
  of arbitrary Windows child-process sandboxing.
- Attached create/start I/O budget at most5seconds; complete inspect/create/
  parse/validate/cleanup envelope15seconds, monotonic. Reserve cleanup time
  within15seconds; pass remaining deadlines to each control operation, including
  failures. Scheduling latency is not a hard realtime guarantee. On timeout,
  oversized output or cancellation, terminate the CLI then kill/remove only the
  owned server-side container. Never rely on killing docker.exe to kill Python.
- Track random owner/run labels BEFORE create. Precheck collisions. On uncertain
  create/start outcomes, reconcile that name and exact labels/containerID.
  Never kill/remove a pre-existing or mismatched container. Cleanup is mandatory
  on all paths; bounded poll must prove owned container absent. Missing state
  must be distinguished from a daemon/inspect error. Cleanup failure overrides
  even a successful parse with isolation_failure. No exceptions escape finally
  before safe failure reporting. No unrelated container/process/checkout changes.
- Model outputs are source proposals only. Supplied code/tests/docs are private;
  Kimi public-only and native credential-bearing shell workers remain held.
  Fresh exact-price/account/foreign-hold admission precedes paid calls. Keep
  uncertain120 plus every old reservation. No repeated failed source request.

## Acceptance Criteria

1. All six new files implement this exact trusted-operator/source-caller boundary,
   wire contract, runtime profile, errors and atomic no-result-on-failure rules.
2. Small ordinary tests independently exercise request/reply framing; duplicate,
   unknown, wrong-type/deep/huge-int JSON; malformed UTF8; order/ranges/digest;
   ambient-context sanitation; source subclass canaries; each boundary invariant
   independently. Injected Docker/process seams must exercise lifecycle/cleanup,
   error paths, valid-reply-then-failure and bounded I/O; no provider credentials,
   live Docker dependency, network, dangerous stress or actual source execution
   in the ordinary test suite. Preserve baseline identities/skips/old files.
3. Actual restricted end-to-end execution with the built immutable image proves
   identity/hash/profile, exact library fixtures, invalid/resource cases, one
   request, enforced output/deadline/cleanup behavior and no remaining owned
   container. Use small fixed fault fixtures only; no floods or arbitrary public
   executor seam. Bounded mock transport tests do not substitute for this proof.
4. Independently inspect the actual Docker CLI argv/env/config and created
   container properties, no source in argv/env/files/logging, no credential
   inheritance, parser non-execution, original-byte result equivalence and
   atomic rejection of incomplete/malicious responses. Retain failure evidence.
5. Full/focused suites, Black/isort/mypy, Python3.10 library-source compatibility,
   actual exact-head and main CI pass. Required fixture/baseline evidence remains
   mapped to exact reviewed/merged blobs; no threshold relaxation or invented
   receipt/registration. Restricted-host qualification applies only to this
   actual reviewed composition, not all Docker hosts/images.
6. One implementation, at most one formal repair with its own Step0; two fresh
   independent architecture/security composition reviews and green head/main
   chain before acceptance. No automatic retry/fallback, source route hunt,
   new dependency, parent/global config change or import authorization.

## Out of Scope

Windows-native Python/Job Object isolation, arbitrary sandbox execution, image
distribution/service deployment, vulnerability-free image claims, provider or
gateway credential remediation, general launcher infrastructure, source Git
acquisition/civic mapping/extractor orchestration, DB/storage/queue/P3 wiring,
personal or bulk data imports, producer qualification and limit increases.

## Allowed Files

Exactly these six NEW paths in the sole Cortex repository:

- src/keon/cortex/pipeline/ccm_python_protocol.py
- src/keon/cortex/pipeline/ccm_python_worker.py
- src/keon/cortex/pipeline/ccm_python_runtime.py
- tests/test_ccm_python_runtime.py
- docker/ccm-python-parser/Dockerfile
- docs/specs/ccm-python-runtime-v1.md

Fresh branch/worktree must be named in Gate2 at accepted origin/main. Preserve
all422accepted tree entries. Reuse exact accepted P2C full baseline only after
proving its source snapshot corresponds to this base; do not invent a fresh run.

## Context & References

- docs/specs/done/CCM-P2C-python-declarations.md
- docs/goals/collective-civilizational-memory/p2c-acceptance-20261023.md
- docs/goals/collective-civilizational-memory/parser-host-profile-20261023.md
- docs/goals/collective-civilizational-memory/ast-parser-execution-boundary-20261022.md
- docs/goals/collective-civilizational-memory/evidence/p2c-stage-f-closure-20261023.json
- docs/goals/collective-civilizational-memory/loop-directive.md

## Verification Plan

Recheck current main, sole-file absence, source hashes and owned worktree. Run
frozen advisory/schema/emitter/readback before promotion and bounded builder
Step0. Prefer controlled private-artifact Sol proposals (no tools/credentials),
split only at fixed protocol/worker, orchestrator and tests/docs boundaries to
keep responses finite. Capture HTTPstatus/requestID when available, no inference
probe or retry. Stage Gate2 before source application. Use parent-owned OS-only
test/build runners, no host mounts/network in source-test containers. Actual
Docker adapter checks are parent-owned and may contact only fixed local daemon.
Two fresh composition reviews see complete six-file source, accepted library,
actual profile/failure evidence and limitations, with no prior reviewer context.
P2C library pins and all prebuild identities/skips survive. Production admission
is scoped to an explicitly qualified immutable runtime image; successful fixtures
do not authorize importing personal data or bypass subsequent P3-P8 gates.
