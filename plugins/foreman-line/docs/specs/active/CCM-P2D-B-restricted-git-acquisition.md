---
ticket: CCM-P2D-B
title: Restricted local bare Git object acquisition
status: active
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces:
  - src/keon/cortex/pipeline/ccm_git_protocol.py
  - src/keon/cortex/pipeline/ccm_git_worker.py
  - src/keon/cortex/pipeline/ccm_git_runtime.py
  - tests/test_ccm_git_runtime.py
  - docker/ccm-git-source/Dockerfile
  - docs/specs/ccm-git-runtime-v1.md
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Acquire the exact committed object closure from one operator-authorized local
bare repository, then return the accepted P2D-A GitSnapshot. No network, checkout,
source execution, persistence, model extraction or producer trust admission.
Only synthetic repositories may be used during parcel qualification. Native
host Git never processes source objects. Source code and accepted APIs remain
unchanged; six NEW files only. This is not bulk import or full Context readiness.

## Constraints

### Frozen API, authorization and local source profile

- Python3.10-compatible code; actual first client profile WindowsPython>=3.12,
  fixed Docker.exe/local Desktop Linux pipe, exactly as accepted parser transport.
  Linux client and remote daemon remain runtime_unavailable, not presumed cleared.
- Public runtime: DockerGitSource(image_id: str, repository_path: str,
  commit_oid: str); acquire() -> accepted ccm_git.GitSnapshot;
  pending_cleanup property -> tuple of opaque (name,id,run) ownership triples.
  One acquire attempt/lifetime, including failures; nonblocking concurrency guard.
  Subsequent acquire fails runtime_unavailable without effects. Validate exact
  built-in string types before methods; image sha256:lower64, commit lower40hex.
  Input type/syntax invalid_input precedes platform/path/image effects.
- The trusted operator supplies an authorized bare root and exact commit; a
  constructor argument is NOT an authenticated authorization receipt. The host
  repository root/ancestors/object-store directory must stay operator-controlled
  and stable for the entire call, without concurrent replacement/mount changes.
  This is a required capability precondition, not race-resistant path authority
  enforcement or arbitrary hostile local-user sandboxing.
- Local Windows absolute drive path only, <=1024 characters; reject UNC/device/
  drive-relative paths, dot/dotdot normalization changes, commas, quotes, controls,
  embedded colon beyond drive and Windows-invalid components. Require existing
  directory, HEAD/config regular files, refs/objects directories; reject reparse
  points in all ancestors and these selected entries via lstat before following.
  Check identities (st_dev,st_ino) again before create and after execution; any
  mismatch fails isolation_failure. No directory walk or repo Git invocation.
  This is a structural bare-profile check, NOT evaluation of effective core.bare
  or config includes; operator supplies the actual bare root. Reading repository
  configuration/HEAD content or importing worktrees is not authorized here.
- Mount ONLY <root>/objects at /objects, readonly, bind-recursive=disabled. Do
  not mount root/config/hooks/refs/credentials/home/Docker socket/source checkout.
  Windows Docker inspection preserves the exact native source path in both
  HostConfig.Mounts and Mounts (measured). No path/commit/object text in errors.
- Trusted operator image ID is an explicit configuration prerequisite, never
  auto-pull/build/install at runtime. Actual image must be separately qualified;
  labels are profile checks, not authenticity. Immutable official Python base:
  python@sha256:7c61056e61ac89e852de05f3dc6fa51a6dd2181797bceed46aa725dd7cb2cd3b.
  Debian signed APT Git package1:2.47.3-0+deb13u1, no unauthenticated override;
  exact package version in Dockerfile, no host install. USER65534:65534,
  ENTRYPOINT python -I -B -m keon.cortex.pipeline.ccm_git_worker, CMD[].
  Label keon.ccm.profile=git-v1 and keon.ccm.git-validator-sha256=49a5d65632638ee2adcce0fabb5a9de19c44127ac99e92db8831bec453582b32.

### Restricted worker and object reads

- Worker creates ONLY a synthetic bare directory /tmp/ccm.git: refs/objects
  directories, fixed HEAD and fixed core.bare=true config. Repository config,
  hooks, attributes, mailmap, refs and replacement refs are never loaded. Git
  subprocesses cwd=/tmp, absolute /usr/bin/git, shell=False, cleared environment
  with PATH=/usr/bin:/bin, HOME=/nonexistent, GIT_CONFIG_NOSYSTEM=1,
  GIT_CONFIG_SYSTEM/GLOBAL=/dev/null, GIT_OBJECT_DIRECTORY=/objects,
  GIT_ALTERNATE_OBJECT_DIRECTORIES='', GIT_NO_REPLACE_OBJECTS=1,
  GIT_NO_LAZY_FETCH=1,GIT_TERMINAL_PROMPT=0,GIT_OPTIONAL_LOCKS=0.
  Fixed flags --no-pager,--no-replace-objects,--git-dir=/tmp/ccm.git,
  -c protocol.allow=never,-c core.hooksPath=/dev/null,-c core.fsmonitor=false.
  No user-controlled commands/config/ref expressions/paths in Git argv.
- Reject existing objects/info/alternates or http-alternates, including dangling
  symlinks, and a symlinked info/pack directory, before Git. Do not scan all
  loose objects or fetch targets. Container contains no host secret mounts;
  links inside hostile object storage cannot reach host paths outside this
  sole mount. No stronger claim of a symlink-free entire repository is made.
- Request is exact41ASCII bytes: commit_oid + LF, EOF required; reject extra,
  short, invalid or subclass inputs in protocol. Worker reads at most42 bytes
  under wall alarm, never arbitrary blocking input without a deadline.
- Fetch only requested commit, its root/reachable trees and regular blobs.
  Never fetch parent commits, symlink targets or submodule commits solely for
  those references. Deduplicate objects but account every expanded path visit.
  Use cat-file --batch-check first to validate exact oid/type/canonical decimal
  size before content read; then cat-file --batch for that same exact OID.
  Each process input is OID+LF; complete header/body/LF/EOF must match exactly,
  zero exit and empty stderr required. Per Git process<=2seconds and remaining
  global worker deadline; stdout header<=128, content<=expected_size+128,
  stderr<=4096, all subprocesses/pipes reaped/closed on all paths. Accepted
  ccm_python_runtime._process provides bounded nonblocking pipe/kill/wait;
  no communicate/capture_output shortcut for untrusted Git output.
- Hash each raw object immediately with original canonical Git framing before
  parsing its references. Enforce accepted ccm_git caps BEFORE further reads:
  <=512objects,2MiB aggregate, commit/tree64KiB,blob256KiB; <=256expanded entries,
  directory components<=32,path bytes<=1024. Use accepted pure _commit/_tree
  parsing helpers as explicitly frozen read-only composition, then final
  validate_git_snapshot before returning wire. Parent independently validates
  the decoded complete closure again. No partial snapshot or silent dropping.
- Read-only accepted dependencies (no edits): ccm_git.py SHA49a5d656...,
  ccm_python_runtime.py SHAc753c6269464cb5b1fe5b7acccc5843ac46634de7e55de3ba76279c6582b48b7,
  ccm_python.py and ccm_python_protocol.py. Copy these as needed into image;
  no new dependencies beyond Git. Pin/verify actual accepted module bytes in
  worker startup. Reuse private helpers under these pins; do not generalize
  accepted Python profile or expose inherited Python extract().
- Worker startup checks Python3.13, sys.flags.isolated, EUID65534, dependency
  hashes, no ambient provider environment, resource limits: RLIMIT_AS96MiB,
  CPU6s,NPROC8,NOFILE64,CORE0,FSIZE0; wall alarm15s. Bad startup exits70 with
  no response/diagnostic. File-size limit0 applies regular files: create tiny
  synthetic bare metadata BEFORE setting FSIZE0, then do not persist source.
  Catch failures/cancellation, emit only closed protocol failure if possible;
  never traceback/raw diagnostics. Parent timeout may precede worker completion;
  Docker daemon cleanup remains mandatory, not inferred from CLI death.

### Wire protocol and parent containment

- Protocol module exports GitAcquisitionError, encode_request(commit_oid),
  encode_success(objects), encode_failure(code), decode_response(frame,commit_oid).
  Return type of decode_response is accepted GitSnapshot. No I/O in protocol.
- Response4-byte unsigned big-endian length plus strict UTF-8 JSON, EOF exact,
  payload<=3145728. Root is a ONE-element list of exact object. Success keys
  exactly version/ok/objects; version exactint1,ok exactboolTrue,objects list<=512;
  object keys exactly oid/kind/data; data canonical ASCII base64 with validation,
  decode caps before allocating more than accepted2MiB sum or individual cap.
  Failure keys exactly version/ok/code,okFalse, closed code. No mixed envelopes,
  duplicates/trailing frames/nonfinite numbers/large integer lexemes or nesting>8.
  Bound and prevalidate lexemes BEFORE json.loads, no trusting arbitrary counts.
  Decode only exact built-in bytes; request/response parameters exact built-ins.
- Public GitAcquisitionError codes = accepted7GitSnapshotError codes plus
  unsupported_repository,runtime_unavailable,deadline_exceeded,invalid_response,
  isolation_failure. str/repr code only,args empty,cause/context cleared even
  under ambient caller exceptions. No raw path, object bytes, stderr or author.
- Parent composes accepted DockerPythonParser transport helpers (_command,
  _inspect,_owned,_cleanup,_tmpfs) without inheriting public extract() or relaxing
  its no-mount Python profile. Fixed local client/host and fresh empty Docker
  config; OS essentials only, no inherited provider credentials/proxies/auth
  stores/plugins. Capture only bounded binary protocol in memory, no source
  argv/env/transport files/logs. Authorized object-directory path occurs only in
  Docker mount metadata; exactcommit travels only via41byte stdin.
- Container hardening: networknone,readonlyroot,user65534:65534,capdropALL,
  no-new-privileges,memory=swap=128MiB,cpus.5,pids16,tmpfs/tmp1MiB noexec/nosuid,
  logdrivernone,workdir/tmp,interactive,noTTY. No privileged/devices/addedcaps/
  otherbinds/volumes/hostPID/hostIPC/hostUTS/ports/links/Dockersocket.
  Verify exact image/user/entrypoint/Cmd/environment/workingdir and hardened
  profile BEFORE start, then owned identity/state/profile after exit. Inspect
  HostConfig.Mounts closed shape exactly one bind Source=authorizedobjects,
  Target=/objects,ReadOnly exactTrue,BindOptions.NonRecursive exactTrue;
  optional Propagation onlyrprivate. Resolved Mounts one matching readonly
  rprivate bind plus at most/tmp tmpfs. Image has no VOLUME declarations.
- Complete call<=30seconds monotonic, reserve5forcleanup; attached worker<=20s.
  Every control subprocess bounded with remaining deadline; control JSON<=64KiB,
  stderr<=4096, attached stdout<=3145732. CLI pipes closed and wait attempted
  even when kill fails (accepted transport). Parent never exposes success before
  zero CLI AND child exit, empty stderr, complete valid frame, stable directory
  checks and owned-container absence proof. Worker exit0 contains success or
  closed failure; exit65 invalid_response,70 isolation_failure,124 deadline;
  othernonzero isolation_failure. Decode no success from nonzero exit.
- Precheck name collisions, track random name/run labels BEFORE create. On
  uncertain create, reconcile only owned exact name/id/alllabels. Never touch
  unrelated/preexisting/mismatched containers. Cleanup failure overrides any
  result/prior error with isolation_failure and records opaque pending triple.
  Distinguish exact missing-container response from daemon/permission errors.
  No retry/fallback, auto-pull/install, shell entrypoint or leaked exception.
- This is bounded local Docker containment, not hard realtime remote/daemon
  cancellation, a general local-user sandbox or authenticated repo/producer
  admission. Git hashes/author labels remain candidate evidence only; all text
  still requires P2A scrubbing at FUTURE actual P3 durable boundary.

## Acceptance Criteria

1. Exact immutable accepted GitSnapshot from one authorized exact commit; both
   loose and packed synthetic object stores match the independent P2D-A oracle.
   File bytes/paths/modes/author/committer/exclusions agree; unrelated objects,
   parents and target references are not fetched; no real repository imported.
2. Actual synthetic object-only readonly/nonrecursive bind, no visible root
   config/hooks, no executed fixture source or canary; malicious config/replace
   refs/alternates/symlink-info and missing/corrupt/oversize objects fail closed
   or remain outside Git's input as specified. No host Git parsing source.
3. Focused tests cover otherwise-valid wire scalar/schema/base64/framing cases,
   input types/missing fields, every independent mount/profile invariant,
   uncertain create/ownership/collision/daemon absence ambiguity, timeout,
   nonzero child+CLI/stderr, success-before-cleanup rejection, failed kill/wait,
   pending ownership retention, one-attempt/concurrency and ambient-error hygiene.
   Test negatives must distinguish their named guard, not fail unrelated guards.
4. Restricted focused/full suite, Black/isort/mypy; all3342PASS/137skip baseline
   identities/dispositions and431existing tree entries preserved. Actual API
   composition tests plus fixed fault images and negative controls discriminate
   essential failures; owned containers absent. Unit CI never invokes Docker or
   native Git; trusted fixture composition is a separate operator qualification.
5. Two fresh independent frontier source-only architecture/security reviews,
   same-family limitation disclosed if Sol used twice. One implementation and
   one focused repair maximum; any exact bounded amendment separately recorded
   before code under owner authority. Exact reviewed/staged/committed bytes,
   actual16headchecks and exactmainCI/deployment green, then status-only StageF.

## Out of Scope

Remote clone/fetch/SSH/credential routes, live corpus ingestion, server identity/
producer authentication, SHA-256 Git repositories, history traversal, source
execution/checkout, generalized Git configuration, civic/AST composition,
extractor engine, storage/outbox/Gateway effects, throughput claims/bulk import,
Linux-client qualification, arbitrary images, race-resistant capability custody.

## Allowed Files

- src/keon/cortex/pipeline/ccm_git_protocol.py
- src/keon/cortex/pipeline/ccm_git_worker.py
- src/keon/cortex/pipeline/ccm_git_runtime.py
- tests/test_ccm_git_runtime.py
- docker/ccm-git-source/Dockerfile
- docs/specs/ccm-git-runtime-v1.md

## Context & References

- Accepted P2D-A PR96 merge0aec0e2; ccm-git-snapshot-v1.md is binding.
- Accepted P2C runtime PR95; preserve complete dependency bytes and its profile.
- Current charter/S01-S12/standing constraints, private native/affected routes
  HELD, all old reservations retained; high-trust producer coverage staysZERO.
- Git docs SECURITY/cat-file; Docker bind mount documentation; Debian security
  tracker Git package version source. Qualification never claims CVE-free Git.

## Verification Plan

First qualify signed fixed-version Git image and synthetic object-only bind;
freeze workorder, dependencies, sourcebase, accepted baseline and fresh budget.
Step0 restate/flags disposition precedes Gate2. Three fixed no-tools Sol source
slices: protocol+worker; parent; tests+Dockerfile+docs. Parent only applies exact
allowed artifacts after static inspection. Independently validate in restricted
test containers, then actual worker/API composition and fixed faults. Triage
before bounded focused repair; two fresh final reviews. Require exact-head/main
green chain and StageF. No unregistered shell agents or held-route reactivation.


## Delegated Gate2 — October24

Owner expressly proceeds P2D-B under existing non-destructive decisions/approvals.
Step0 restate accepted, no flags; exact431pin/source-baseline correspondence and
actual fixed signed Git package/object-only readonly nonrecursive mount verified.
Controlled no-tools GenSpark Sol/low source proposals in3fixed slices; parent
applies exact6allowed newfiles, no existing-source edits. One focused repair
maximum, two fresh source-only frontier reviews and actual CI/main/StageF remain
mandatory. Stable operator source custody is a prerequisite, not implied auth.
All4814.470875oldreservations and affected/native/privatePi routes stayHELD.
