# JEV-P5 container evidence — real Docker run, 2026-09-26 (UTC)

**Session:** JevP5Docker builder session, coordinator dispatch 2026-09-26 under
owner blanket authority.
**Scope:** LOCAL Docker builds and runs only. No `docker push`, no
remote-registry tags, no private-registry pulls, no live Jev endpoint or
provider API calls, no real credentials in any run or artifact (synthetic
sentinel strings only). No git add/commit/push/branch/stash/reset.
**Supports:** checklist rows P5-01a, P5-01b, P5-02a, P5-02b, P5-03a, P5-03b,
P5-05a, P5-05b (and the release-identity rows for base image, final image, and
builder identity).

## 0. Environment identity

- Host: Windows 10.0.26200 x64; host Node v24.7.0; all timestamps UTC.
- Docker Engine **29.8.0** (client + server), linux/x86_64 VM, Storage Driver
  `overlay2`, Cgroup v2 (cgroupfs), containerd `db8809540e1a7a9da5d518876894933ff55692ab`.
- Builder: BuildKit instance `desktop-linux` via the `docker` driver
  (`docker buildx` v0.37.0 `ac30b249`).
- Container runtime identity: `node` v22.14.0 (base image).
- Offline from Jev/provider endpoints throughout; the only network use was the
  public Docker Hub metadata/base-image resolution required by the build.

## 1. Source and build-input identity

- Repository root `D:\Repos\agent-skills`; worktree HEAD
  `305ecbf01a8b458a81a3ba5e04b4919e63281f94`, dirty (1253 porcelain entries
  observed 2026-09-26; user-owned changes). No candidate ref/commit is cut —
  the release-identity source rows remain BLOCKED there.
- `container/Dockerfile` SHA-256
  `7562b14ec14baa7f0da9cbec9ac3736492be5b78981dba70919adb0eca15494c`
  (unchanged; **no Dockerfile fix was needed — the build succeeded unmodified**).
- `jev-decisions/package-lock.json` SHA-256
  `acff3bcb50d4cec1520dbdcbb953c9320a334454a67bc7ec8ada00419b05c979`.
- Context manifest — the nine files the Dockerfile COPYs (SHA-256, host side):

```
e61b079147dbf3adf885d8646412c22166b1d9c7761a87470369559479b56248  src/canonical-json.ts
145b3ce478b15f9e44d2327d3b305ff658691db6798b5c0229ba90612244f0a9  src/consumer.ts
8924ee03f49e4a527574d42087cddcdd47b86bae7b3b77e6cd07f09c43a25da5  src/index.ts
a6cb134073313cfea67017ed2056b71e33d28298112ddefd63116f140a530482  src/replay.ts
9f1aeeb6b662c915191913100bc29ded424cfb49bdb690f0fec611e42084b1ad  src/runtime.ts
4c53d5e7529258c8175a497d387fdf112f797af13302d822fe0cfc8ec978ae6b  src/types.ts
9a4c51aff6aed36e7da671bd2deb7664cd1fd6a556c8820b29805554a69457e5  src/validator.ts
6feab6ccb0af821ce24e722e178d985bf8cd233767123dc1dc33fb13887176c5  container/jev-run.mjs
ec41c59c16e6ef51746a99c1641f18e7fdd40c665fec9d30d4bac20b6c5c1986  container/fixtures/dry-run.json
```

- Build context: repository root as documented in `container/README.md`; no
  `.dockerignore` present (empty, 2 B transfer); BuildKit transferred only the
  COPY-relevant context (69.85 kB first build, incremental after).
- Base image resolved at build (immutable manifest digest, `FROM` line of both
  build logs): `node:22.14.0-bookworm-slim@sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b`.

## 2. Build receipts (two independent clean builds)

Command (from the repository root, per README):

```
docker buildx build --no-cache \
  -f plugins/foreman-line/jev-decisions/container/Dockerfile \
  -t jev-decisions-container:prototype --iidfile <path> .
```

| Build | UTC start | UTC end | Exit | Image ID (config digest) |
|---|---|---|---|---|
| A | 2026-09-26T23:25:29Z | 2026-09-26T23:25:31Z | 0 | `sha256:3f242761a51036de9cc4c4aaee760e579d8047febeefadfbcfe517dc35404a37` |
| B | 2026-09-26T23:25:51Z | 2026-09-26T23:25:52Z | 0 | `sha256:a480f6cbdae75119e7afd1758d34b4ebce9d6a2912d250e0be3b98507140158e` |

Build B is tagged `jev-decisions-container:prototype` and is the image
exercised for every runtime receipt below. `docker image inspect`:
`RepoDigests: []` — locally built, never pushed. Build log steps: `FROM
node:22.14.0-bookworm-slim@sha256:1c18d9ab…` → `WORKDIR /app` → `COPY …/src` (62
kB) → `COPY …/container/jev-run.mjs` (4.68 kB) → `COPY …/container/fixtures`
(2.09 kB) → `USER node` → `ENTRYPOINT ["node","--experimental-strip-types","/app/container/jev-run.mjs"]`.
Build success: both exit 0, no warnings beyond the launcher's own Node
experimental notice at run time.

## 3. Independent rebuild comparison (P5-01a "compare final digests")

Comparison **was executed**; outcome recorded honestly:

- A vs B (default): config fields identical except `created`
  (`2026-09-26T23:25:31.348…Z` vs `…23:25:52.398…Z`); layer diff IDs 0–5
  identical (base + WORKDIR); the three COPY layers differ.
- C vs D (`SOURCE_DATE_EPOCH=0`, `--no-cache`, 23:27:35Z / 23:27:36Z →
  `sha256:4d225b54cb143e8aa2c5833967765e6953e6b7cc2e074779ddb21ebe6b589b63` /
  `sha256:bad9c529161301778a4ca5e68f8b6c13efd177daa29cf0f7d8394cc93bafc812`):
  config identical (`created` pinned to `1970-01-01T00:00:00Z`); layers 0–5
  identical; full extraction and diff of the first COPY layers
  (`d7d33d62…` vs `de782a1b…`) shows the **only** difference is the mtime of
  the `./app` directory entry (`1790465256` vs `1790465257` — the build second);
  per-file SHA-256 inventories of the layer contents are identical.
- E vs F (additionally `--output type=docker,rewrite-timestamp=true`,
  23:32:00Z / 23:32:03Z → `sha256:f56cdd8ebb1964ff…` /
  `sha256:40c9be6a0b84f2fc…`): still differ in the COPY layers.
- Content-identity inventory (path + SHA-256 of every file in the first COPY
  layer) is identical across independent builds:
  `bc43ff8d82941fb1c6805e6dd266ccb6cd58a9b45f22c3119db4cbf4d38d2dde`.

**Finding F1 (build reproducibility):** with this builder (BuildKit
`desktop-linux` via the `docker` driver) independent clean builds are **not
byte-digest-reproducible**. The entire payload variance is the build-second
mtime of the `/app` directory entry inside the three COPY layers (plus the
config `created` timestamp in default builds); `SOURCE_DATE_EPOCH=0` and
`rewrite-timestamp` did not remove it. File payloads are byte-identical
(inventory digest above). Impact: the final image digest must be re-pinned at
candidate cut, and any digest-pinned rollback (P5-08a) must use the exact cut
image. Not a runtime defect.

## 4. Image metadata, base, architecture, dependencies (P5-01b)

`docker inspect jev-decisions-container:prototype` (excerpt):

```
Id=sha256:a480f6cbdae75119e7afd1758d34b4ebce9d6a2912d250e0be3b98507140158e
RepoTags=["jev-decisions-container:prototype"] RepoDigests=[]
Os/Arch=linux/amd64 Size=223001853
Config.User="node" Config.WorkingDir="/app"
Config.Entrypoint=["node","--experimental-strip-types","/app/container/jev-run.mjs"] Config.Cmd=null
Config.Env=["PATH=…","NODE_VERSION=22.14.0","YARN_VERSION=1.22.22"]
```

- **Base image:** name `node:22.14.0-bookworm-slim`, immutable manifest digest
  `sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b`
  (recorded at build, §1). In-container `node --version` = `v22.14.0`.
- **Dependencies:** the image installs nothing — the Dockerfile has no `RUN`;
  `docker history --no-trunc` shows only the three COPY layers (62 kB / 4.68 kB
  / 2.09 kB) plus `WORKDIR`/`USER`/`ENTRYPOINT` over the base. Base layers
  (diff IDs, from `docker save` manifest):
  `ea680fbff095…`, `55d30492f985…`, `e2ed0193d85e…`, `f660a4169800…`,
  `ddfb49f16c67…`, `8b6da3bd2800…` (identical across builds C/D/E/F).
- **SBOM (first-party file-inventory scope):** the nine copied files with
  SHA-256 as listed in §1 — verified **in-image**: `docker export` rootfs
  digests for `/app` are identical to the context manifest (COPY fidelity
  proven, all nine hashes match).
- **Provenance (build-receipt scope):** the two clean-build receipts (§2),
  context manifest (§1), and base digest above, with UTC timestamps.
- Formal SBOM/provenance **attestations** were not generated (no attestation
  tooling run) and a **CVE vulnerability scan** was not run — both remain
  BLOCKED in the checklist's release identity.

## 5. Runtime identity and capabilities (P5-02a)

`docker inspect` HostConfig of a container created for the request runs
(excerpt):

```
Privileged=false CapAdd=null CapDrop=null Devices=[] SecurityOpt=null
PidMode="" (private) NetworkMode=none IpcMode=private UTSMode="" UsernsMode=""
MaskedPaths=[/proc/acpi,/proc/asound,/proc/interrupts,/proc/kcore,/proc/keys,…]
ReadonlyPaths=[/proc/bus,/proc/fs,/proc/irq,/proc/sys,/proc/sysrq-trigger]
```

Independent in-process inspection
(`docker run --rm --network none --entrypoint node <img> -e '<probe>'` reading
`/proc/self/status`):

```json
{"uid":1000,"gid":1000,"groups":[1000],
 "proc_status":["Uid:\t1000\t1000\t1000\t1000","Gid:\t1000\t1000\t1000\t1000",
   "Groups:\t1000 ","CapInh:\t0000000000000000","CapPrm:\t0000000000000000",
   "CapEff:\t0000000000000000","CapBnd:\t00000000a80425fb","CapAmb:\t0000000000000000",
   "NoNewPrivs:\t0","Seccomp:\t2","Seccomp_filters:\t2"],
 "node":"v22.14.0"}
```

Declared non-root UID/GID honored (`USER node`, uid/gid 1000 per base-image
`useradd`); effective/permitted/inheritable/ambient capabilities are all zero;
seccomp filter mode active. All request runs succeeded under this plain
restricted configuration — no privilege escalation, privileged mode, host
namespace, device, or ambient capability is required.

## 6. Limits, filesystem, and cleanup receipts (P5-02b)

Limit set used for every request run:

```
docker run --rm -i --network none --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m --cpus 0.5 --memory 256m \
  --pids-limit 64 --ulimit nofile=256:256 --stop-timeout 10 <img>
```

`docker inspect` receipt (HostConfig): `ReadonlyRootfs=true`,
`NanoCpus=500000000`, `Memory=268435456`, `PidsLimit=64`,
`Ulimits=[{"Name":"nofile","Hard":256,"Soft":256}]`,
`Tmpfs={"/tmp":"rw,noexec,nosuid,size=16m"}`, `StopTimeout=10`.

Filesystem/process inspection (`--entrypoint sh` probe):

```
launcher_exit=0
tmp_entries_after_run=0
tmp_writable=yes
tmp_entries_final=0
rootfs_probe=touch: cannot touch '/app/x': Read-only file system
```

Rootfs writes are denied; the disposable tmpfs is writable, used by nobody
(the launcher writes zero files), and empty after the run. Cleanup receipt:
after all `--rm` runs and explicit removals, `docker ps -a` contains no
test containers.

## 7. Layer/context/argument secret scan (P5-03a)

- `docker history --no-trunc <img>`: no build arguments, no `ARG`/secret `ENV`;
  the only secret-pattern hits in the entire image are four occurrences of
  upstream **npm documentation placeholders** in the base image —
  `npm/docs/content/using-npm/config.md:1949`, `npm/docs/output/using-npm/config.html:1552`,
  `npm/man/man7/config.7:1962`, `npm/node_modules/@npmcli/config/lib/definitions/definitions.js:1072`,
  all the literal example `key="-----BEGIN PRIVATE KEY-----\nXXXX\nXXXX\n-----END PRIVATE KEY-----"`
  (XXXX placeholders). Classified non-secret (upstream doc text).
- Rootfs export scan (`docker export`, 215 MB tar, full extraction) for
  `sk-[A-Za-z0-9_-]{16,}`, `AKIA[0-9A-Z]{16}`, `-----BEGIN … PRIVATE KEY-----`,
  `ghp_…`, `xox[baprs]-…`: **zero** credential-shaped values outside the npm
  doc placeholders above; canary searches (`sk-SENTINEL-canary…`,
  `sk-override-canary…`) over all files **including binaries**: zero files.
- The name `OPENROUTER_API_KEY` occurs only in `app/container/jev-run.mjs` and
  `app/src/runtime.ts:406` (`const apiKey = process.env.OPENROUTER_API_KEY;`) —
  source names only, no value in any layer. The internal marker string
  `jev-container-dry-run-placeholder` occurs only in `app/container/jev-run.mjs`.
- **Runtime injection is the only secret path:** `container/jev-run.mjs` sets
  `process.env.OPENROUTER_API_KEY` to the non-secret dry-run marker before
  `executeDecision` and `delete`s it in `finally` (lines 136–151). A
  caller-supplied override is neutralized: a payload with top-level
  `endpoint:"https://evil.example/alpha"`, `method:"GET"`,
  `model:"typesafe/jev-latest"`, `cost_cap:99`,
  `credential:"sk-override-canary-1234567890"`, `redirect:"follow"` exits 0 and
  its stdout+stderr is **byte-identical to the baseline run** (both SHA-256
  `e8ead966fe801417c292ab3f79f8a506cad985a39e1680d152e3ce257d13dfc9`);
  none of the override values appear anywhere in the output.
- Scan log digest (raw transcript held outside the repo):
  `aa30a028de56d5a170e4f5023b16b3a533df1edd029bf36f0241fcd578e20987`.

## 8. Diagnostics/redaction negative scan (P5-03b)

All nine runs injected the synthetic canary `OPENROUTER_API_KEY=sk-SENTINEL-canary-2222222222`
(a test sentinel, **not** a credential) via `-e`; combined stdout+stderr per
case (Node experimental-warning lines included, so hashes cover everything the
process emitted):

| Case | Input class | Exit | stdout+stderr SHA-256 |
|---|---|---|---|
| ok | one dry-run request | 0 | `e8ead966fe801417c292ab3f79f8a506cad985a39e1680d152e3ce257d13dfc9` |
| noenv | absent secret channel (no key env) | 0 | `e8ead966fe80…` (byte-identical to ok) |
| override | caller-override fields + canary | 0 | `e8ead966fe80…` (byte-identical to ok) |
| empty | empty stdin | 2 | `489ac4cb86b4e0841c7efbfd8847c4601086f1760b107b11ecf860739cebe464` |
| malformed | malformed JSON | 2 | `489ac4cb86b4…` |
| livemode | `mode:"live-run"` | 2 | `489ac4cb86b4…` |
| missingfields | runtime field `lease` removed | 2 | `489ac4cb86b4…` |
| bad-r10 | synthetic `usage` removed | 1 | `6281670853f234f452e44630c7ba8b0a7c95273b450f959da61d07566604aec7` |
| bad-r12 | synthetic `response_id` removed, `answers` emptied | 1 | `3ef34982cb87349f6310821ebf03615fdc5c688f2fcca865b40c9f8f9cf6cdfc` |

Combined bundle digest (`cat out-*.txt`):
`a70d11ecc9a44104fbe754442342d894719de9dde7934ac7d0910872fe24140f`.

Negative grep over all nine outputs — **zero files with hits** for: the canary
`sk-SENTINEL-canary-2222222222`, `sk-override-canary`,
`jev-container-dry-run-placeholder`, `urgency_signal`, `probabilities`,
`evil\.example`, `typesafe/jev-latest`, `OPENROUTER_API_KEY`, and generic
`sk-[A-Za-z0-9_-]{10,}`.

Crash/closed-record outputs are bounded records only (excerpts):

```
{"ok":false,"record":{"evidence_class":"refusal-record","status":"refused","reason_code":"evidence:R10","source_kind":"coordinator-review","source_ref":"src-33333333333333333333333333333333","recorded_at_utc":"2026-09-22T12:00:00.000Z","retention_until_utc":"2026-12-21T12:00:00.000Z"}}
{"ok":false,"record":{"evidence_class":"hold-record","status":"hold","reason_code":"evidence:R12","disposition":"pending-coordinator","source_kind":"coordinator-review","source_ref":"src-33333333333333333333333333333333","recorded_at_utc":"2026-09-22T12:00:00.000Z","retention_until_utc":"2026-12-21T12:00:00.000Z"}}
```

No provider payload, no cost, no input state, no key material in any line.
`docker logs` of a signal-killed container: 2 lines only (Node
`ExperimentalWarning` + `--trace-warnings` hint).

## 9. Liveness/readiness with provider connectivity denied (P5-05a)

- **Network denial receipt:** every run used `--network none`
  (`HostConfig.NetworkMode=none`); in-container probe
  (`os.networkInterfaces()` + `/proc/net/{tcp,tcp6,udp,udp6}`):

```json
{"net_interfaces":{"lo":[{"address":"127.0.0.1",…,"internal":true},{"address":"::1",…,"internal":true}]},
 "tcp":"sl  local_address rem_address   st …","tcp6":"sl  local_address …",
 "udp":"sl  local_address rem_address   st …","udp6":"sl  local_address …"}
```

  Only loopback exists and all four socket tables contain only their header
  lines — zero listening or connected sockets during the probes. Provider
  connectivity was structurally impossible for every receipt in this document.

- **Readiness:** one dry-run request completes with the exact typed result
  (excerpt of the `ok` line):

```
{"ok":true,"observation":{"evidence_class":"live-observation","capability":"openrouter-alpha-decisions",
"run_id":"run-2222…","lease_id":"lease-1111…","endpoint":"https://openrouter.ai/api/alpha/decisions",
"requested_identity":{"model":"typesafe/jev-1.13","provider":"openrouter","surface":"alpha-decisions"},
"served_identity":{"model":"typesafe/jev-1.13-20260917","response_id":"r-container-dry-run","source":"provider-declared"},
"schema_version":"jev-decisions/v1",…,"cost":{"amount":0.000017934,"currency":"USD"}…}}
```

  No credential appears in the readiness output (§8).

- **Liveness:** deterministic process-level completion per input class
  (exit 0 success / 1 closed record / 2 invalid input), bounded timing: nine
  container runs completed 23:40:45Z–23:40:54Z (~1 s each including container
  create/teardown).

- **Scope note:** the image has **no HTTP liveness/readiness endpoint**
  (health endpoints are Out of Scope in the JEV-P4 spec and remain
  unimplemented — none is claimed). "Health is local-only" is evidenced by the
  complete absence of any socket surface plus namespace-level network denial.

## 10. Lifecycle: startup, completion, configuration, signals, cleanup (P5-05b)

- **Startup / one-request completion:** container start → single JSON result in
  ~1 s; paths: exit 0 (dry-run success), exit 1 (bounded closed records
  `evidence:R10` / `evidence:R12`, §8), exit 2 (`{"ok":false,"error":"invalid_input"}`
  for empty stdin, malformed JSON, `mode:"live-run"`, and missing runtime
  fields — one generic line, no field echo).
- **Invalid configuration:** `mode` missing or `mode:"live-run"` or `lease`
  removed all fail closed with the same generic `invalid_input` line.
- **Absent secret channel:** run with no `OPENROUTER_API_KEY` in the
  environment exits 0 and is byte-identical to the baseline
  (`e8ead966fe80…`) — the launcher's internal non-secret marker is the only
  credential-guard value; no secret channel exists in this dry-run prototype
  (live transport/secret policy remain release work per the README).
- **Temporary-file cleanup:** launcher writes zero files
  (`tmp_entries_after_run=0` under an empty tmpfs); `/tmp` is disposable and
  empty after (`tmp_writable=yes`, `tmp_entries_final=0`); rootfs is read-only
  and denies writes; the tmpfs is container-scoped and destroyed with the
  container.
- **Signal/shutdown (Finding F2):** one request was held pending (stdin open)
  in a detached container:

```
StartedAt  2026-09-26T23:41:29.840Z   (docker run -di …)
KILL_AT    2026-09-26T23:41:31.025Z   docker kill --signal=TERM jev-p5-sig
                                     → docker wait did NOT return (hung ~110 s)
STOP_AT    2026-09-26T23:43:19.456Z   docker stop -t 2 jev-p5-sig
FinishedAt 2026-09-26T23:43:21.586Z   ExitCode=137 OOMKilled=false State.Error=""
```

  **Finding F2 (lifecycle defect):** SIGTERM does **not** terminate the
  container — `container/jev-run.mjs` registers no signal handlers, and as PID
  1 default-disposition signals are not delivered. Shutdown required SIGKILL
  (exit 137) after the stop-timeout grace period. `docker stop` therefore
  works only via its grace-timeout→SIGKILL path; an orchestrator that sends
  SIGTERM and waits would hang. Not fixed in this pass (no build-affecting
  change was required or authorized); recommended remediation at release: a
  minimal SIGTERM handler in `jev-run.mjs` or running with an init (`--init` /
  tini) so signals reach the process.

## 11. Findings summary

- **F1 — build reproducibility:** final image digests differ across
  independent clean builds; sole payload variance is the build-second mtime of
  the `/app` directory entry in the three COPY layers (plus config `created`
  in default builds). File content identical (inventory
  `bc43ff8d8294…`). Re-pin the digest at candidate cut.
- **F2 — graceful shutdown:** no SIGTERM handling; SIGKILL required (exit
  137). See §10.

## 12. Cleanup and retained state

- Test containers `jev-p5-inspect`, `jev-p5-scan`, `jev-p5-sig` — created,
  used, and removed; `docker ps -a` shows no test containers afterwards.
- Images left in the local cache (per instruction; cache pollution accepted):

| Image | ID | Note |
|---|---|---|
| `jev-decisions-container:prototype` | `sha256:a480f6cbdae75119e7afd1758d34b4ebce9d6a2912d250e0be3b98507140158e` | **canonical image for all evidence above** |
| (untagged) | `sha256:3f242761a51036de9cc4c4aaee760e579d8047febeefadfbcfe517dc35404a37` | build A |
| `jev-decisions-container:reprocheck` | `sha256:bad9c529161301778a4ca5e68f8b6c13efd177daa29cf0f7d8394cc93bafc812` | rebuild-comparison pair (C/D) |
| `jev-decisions-container:reprocheck2` | `sha256:40c9be6a0b84f2fc9130f0db39f10d6f88f8808effc41123beeb35bc1e56490e` | rewrite-timestamp pair (E/F) |
| (untagged) | `sha256:4d225b54cb14…`, `sha256:f56cdd8ebb19…` | pair partners |

- Pre-existing cache image `jev-decisions:local` (`sha256:cc5abc305480…`) was
  already present; not created or used by this session.
- **Build outputs inside the repository: none.** All builds ran inside Docker;
  raw transcripts, exports, and scan logs were kept in the host temp directory
  (`D:\tmp`), outside the repository. Repository changes from this session:
  this evidence file, `jev-container-release-checklist.md`, `loop-directive.md`.
  Nothing under `jev-decisions/` was modified (no `npm test` obligation
  triggered).

## 13. External effects (negative receipt)

No `docker push`; no tags for a remote registry; no private-registry pulls
(only public Docker Hub base-image metadata/pull for
`node:22.14.0-bookworm-slim`); no live Jev endpoint or provider API call; no
real credential mounted, used, or recorded (synthetic sentinels
`sk-SENTINEL-canary-2222222222` and `sk-override-canary-1234567890` only,
created for the probes and inert); no git state changes.
