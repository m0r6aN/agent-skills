# JEV portable-container release checklist

**Parcel:** JEV-P5
**Status:** `OPEN — every item dispositioned 2026-09-26; Docker-reachable rows P5-01a/01b, P5-02a/02b, P5-03a/03b, P5-05a/05b CHECKED with real local Docker evidence 2026-09-26 (evidence: jev-p5-docker-evidence-2026-09-26.md); attestation/CVE-scan, registry, evidence-manifest, rollback/quarantine, parent-suite, live-provider, and human-gate items remain BLOCKED with exact causes (see matrices below)`
**Spec:** `plugins/foreman-line/docs/specs/active/JEV-P5-portable-container-release.md`
**Prepared:** 2026-09-22
**Dispositioned:** 2026-09-26 — coordinator decision 2026-09-26 under owner
blanket authority
**Scope:** Documentation and evidence index only. This checklist does not
authorize a build, image publication, provider call, spend, host/Pi action,
parent routing change, HAWF reconciliation, or Helmholtz handoff.

## How to use this checklist

One row is required for every check. Replace `PENDING` only with a
reproducible result backed by a sanitized artifact and digest. Do not infer
success from a source file, model page, local cache, or documentation example.
Record timestamps in UTC and use immutable identifiers wherever available.

Required row fields:

- check ID and exact procedure/command;
- source commit, image digest, and environment/runtime identity;
- UTC start/end time;
- result: `PASS`, `FAIL`, or `PENDING`;
- sanitized evidence path and SHA-256 digest;
- reviewer and notes/blocker.

## Disposition vocabulary (2026-09-26)

As of the 2026-09-26 walk, every row carries one of two dispositions in
addition to the legacy fields above:

- `CHECKED` — a reproducible result exists on disk right now and is cited by
  exact file, test name, or command output (with SHA-256 where the artifact is
  a file). Checked rows cover the offline scope named in the citation only.
- `BLOCKED — <exact cause>; unblock: <condition>` — required evidence needs an
  unavailable external runtime (container build, OCI runtime, registry, live
  Jev endpoint) or a human gate. No blocked row carries a checkmark, and no
  row is checked on inference.

Environment identity for all observations below: Node v24.7.0 (host test
runner), offline, no provider connectivity. The 2026-09-26 container evidence
pass adds Docker Engine 29.8.0 (client+server, BuildKit `desktop-linux`) for
LOCAL builds/runs only — no registry publication, no live Jev/provider calls,
no real credentials (see `jev-p5-docker-evidence-2026-09-26.md`).

## Release identity

| Field | Value | Status |
|---|---|---|
| Source repository/ref | `https://github.com/m0r6aN/agent-skills` (origin remote, observed 2026-09-26); candidate ref not cut | BLOCKED — shared worktree `reconcile/refresh-actions` @ `305ecbf01a8b458a81a3ba5e04b4919e63281f94` is dirty (~1100 user-owned changes) and is not a release identity; unblock: cut the candidate from a clean tree and pin ref+commit |
| Source commit | `PENDING` | BLOCKED — no candidate commit exists; unblock: clean-tree candidate cut pinned by immutable SHA |
| Container build definition digest | `plugins/foreman-line/jev-decisions/container/Dockerfile` SHA-256 `7562b14ec14baa7f0da9cbec9ac3736492be5b78981dba70919adb0eca15494c` (observed 2026-09-26) | CHECKED (observed, provisional — re-pin at candidate cut) |
| Base image name and immutable digest | name `node:22.14.0-bookworm-slim` (`container/Dockerfile:1`); immutable manifest digest `sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b` (resolved and recorded at build 2026-09-26; `FROM` line of both build receipts, `jev-p5-docker-evidence-2026-09-26.md` §1–2) | CHECKED (observed at build 2026-09-26 — re-pin at candidate cut) |
| Final image digest and architecture | `jev-decisions-container:prototype` = `sha256:a480f6cbdae75119e7afd1758d34b4ebce9d6a2912d250e0be3b98507140158e`, linux/amd64 (built and exercised 2026-09-26; local cache only, `RepoDigests` empty — never pushed); digests are per-build — carried finding F1 (`jev-p5-docker-evidence-2026-09-26.md` §3) | CHECKED (observed, local prototype — re-pin the candidate-cut digest) |
| Dependency lockfile digest | `plugins/foreman-line/jev-decisions/package-lock.json` SHA-256 `acff3bcb50d4cec1520dbdcbb953c9320a334454a67bc7ec8ada00419b05c979` (observed 2026-09-26; the image installs nothing — the Dockerfile copies only `src`, `container/jev-run.mjs`, `container/fixtures`) | CHECKED (observed, provisional — re-pin at candidate cut) |
| SBOM/provenance attestation digest | PENDING | BLOCKED — no SBOM/provenance attestation tooling has run; first-party file-inventory SBOM and build-receipt provenance are recorded in `jev-p5-docker-evidence-2026-09-26.md` §2–4; unblock: generate attestations at build and record digests |
| Vulnerability scan tool/version/result digest | PENDING | BLOCKED — no CVE vulnerability scan has run (the 2026-09-26 layer/secret scan is not a CVE scan; `jev-p5-docker-evidence-2026-09-26.md` §7); unblock: scan the built image and record tool/version/result digests |
| Builder identity and clean-build receipt | Docker Engine 29.8.0 client+server (BuildKit `desktop-linux`, docker driver, buildx v0.37.0); two clean-build receipts with UTC timestamps 2026-09-26 (`jev-p5-docker-evidence-2026-09-26.md` §2–3) | CHECKED (local prototype scope — coordinator-authorized build 2026-09-26; release-candidate builder designation remains a human-gate item) |
| Candidate registry/repository | `PENDING` | BLOCKED — no registry publication is authorized or performed |
| Release owner | `PENDING` | BLOCKED — release owner not designated; unblock: owner names the release owner at Gate 3 |

## Check matrix

| ID | Exact release check | Required evidence | Result |
|---|---|---|---|
| P5-01a | Build from the recorded source commit and pinned build inputs in a clean context. Repeat independently and compare final digests. | Two build receipts, context manifest, input digests, final image digest, UTC timestamps | CHECKED — two independent clean builds run 2026-09-26 (docker buildx build --no-cache -f plugins/foreman-line/jev-decisions/container/Dockerfile -t jev-decisions-container:prototype .; BuildKit `desktop-linux`/docker driver): build A 23:25:29–23:25:31Z → `sha256:3f242761a510…`; build B 23:25:51–23:25:52Z → `sha256:a480f6cbdae7…` (the exercised image); base resolved `node:22.14.0-bookworm-slim@sha256:1c18d9ab3af4…`; context manifest + input digests = the nine COPY inputs (`jev-p5-docker-evidence-2026-09-26.md` §1–2). Final-digest comparison EXECUTED and recorded (evidence §3): file payloads byte-identical across builds (content inventory SHA-256 `bc43ff8d8294…`) but final digests differ per build second — carried finding F1 (sole variance: `/app` dir-entry mtime in the COPY layers; `SOURCE_DATE_EPOCH=0` and `rewrite-timestamp` pairs still vary), so the digest must be re-pinned at candidate cut. Builds ran from worktree `305ecbf01a8b…` (dirty); the clean-candidate source pin remains BLOCKED in release identity |
| P5-01b | Inspect image metadata and verify the base image, architecture, dependencies, SBOM, provenance, and scan are immutable/recorded. | Image inspect output, SBOM, provenance, scan receipt, SHA-256 digests | CHECKED — `docker inspect jev-decisions-container:prototype` (`sha256:a480f6cbdae7…`): linux/amd64, 223 MB, `RepoDigests` [] (never pushed), Entrypoint `["node","--experimental-strip-types","/app/container/jev-run.mjs"]`, User `node` (evidence §4); base image immutable digest recorded at build: `node:22.14.0-bookworm-slim@sha256:1c18d9ab3af4…`; dependencies: the image installs nothing (`docker history`: three COPY layers 62 kB/4.68 kB/2.09 kB + USER/ENTRYPOINT over the base); SBOM scope = first-party file inventory: the nine copied files with SHA-256, in-image digests equal to the context manifest (COPY fidelity proven, evidence §4); provenance scope = the two build receipts + context manifest (evidence §2–3); scan scope = layer/secret scan (P5-03a, evidence §7). Formal SBOM/provenance attestations and CVE vulnerability scanning were NOT run and remain BLOCKED in release identity |
| P5-02a | Start with the declared non-root UID/GID and verify no privilege escalation, privileged mode, host namespace, device, or ambient capability is required. | Runtime configuration and independent process/capability inspection | CHECKED — started with the declared non-root identity: `docker inspect` receipt Config.User=`node`; independent in-process inspection (`docker run --network none --entrypoint node <img>` probe): uid=1000 gid=1000 groups=[1000], CapInh/CapPrm/CapEff/CapAmb=`0000000000000000`, CapBnd=`00000000a80425fb`, NoNewPrivs=0, Seccomp=2 (filter) (evidence §5); runtime configuration receipt: Privileged=false, CapAdd/CapDrop=null, Devices=[], PidMode="" (private), NetworkMode=none, IpcMode=private, default Masked/ReadonlyPaths, no host namespace — every request run succeeded under this plain restricted config, so no privilege escalation, privileged mode, host namespace, device, or ambient capability is required |
| P5-02b | Exercise read-only root filesystem and explicit disposable writable paths under CPU, memory, process, descriptor, and wall-clock limits. | Runtime limit receipt, filesystem/process inspection, cleanup receipt | CHECKED — all nine request runs exercised `--read-only --tmpfs /tmp:rw,noexec,nosuid,size=16m --cpus 0.5 --memory 256m --pids-limit 64 --ulimit nofile=256:256 --stop-timeout 10`; `docker inspect` limit receipt: ReadonlyRootfs=true, NanoCpus=500000000, Memory=268435456, PidsLimit=64, Ulimits [{nofile 256/256}], Tmpfs {/tmp} (evidence §6); filesystem/process inspection: rootfs write denied (`touch: cannot touch '/app/x': Read-only file system`), disposable tmpfs writable and empty after runs (tmp_entries_after_run=0, tmp_entries_final=0), launcher writes zero files; cleanup receipt: no test containers remain (`docker ps -a` → none) (evidence §6, §12) |
| P5-03a | Build and inspect layers/context/arguments for credentials or secret-shaped values; prove runtime injection is the only secret path. | Secret scan, context manifest, image-layer scan, sanitized launch receipt | CHECKED — layer/context/argument secret scan recorded (evidence §7): `docker history --no-trunc` shows no build arguments or embedded secrets (the only secret-pattern hits in the image are 4 upstream npm documentation placeholders — `-----BEGIN PRIVATE KEY-----\nXXXX…` in the base image — classified non-secret); rootfs export scan (215 MB) finds zero sk-*/AWS/GitHub/Slack-shaped values and zero canary values anywhere including binaries; the name `OPENROUTER_API_KEY` exists only in `app/container/jev-run.mjs` and `app/src/runtime.ts:406` source and the dry-run marker only in `jev-run.mjs`; context manifest = nine input digests (evidence §1). Runtime injection is the only secret path: `jev-run.mjs` sets/deletes `process.env.OPENROUTER_API_KEY` around `executeDecision`, and a caller-supplied endpoint/method/model/cost_cap/credential/redirect override is neutralized — override run byte-identical to baseline (SHA-256 `e8ead966fe80…` both) with zero override-value hits; scan log SHA-256 `aa30a028de56…` |
| P5-03b | Inspect process args/environment diagnostics, logs, errors, receipts, and crash output; verify the key and raw provider bodies cannot appear. | Redacted outputs and negative scan digest | CHECKED — container-level diagnostics/redaction scan over combined stdout+stderr of nine runs (success, absent-secret-channel, caller-override, empty, malformed, `mode:"live-run"`, missing-runtime-fields, and two crash/refusal runs) with synthetic canary `sk-SENTINEL-canary-2222…` injected via `-e` (a sentinel, not a credential): zero occurrences of the canary, any sk-* value, `OPENROUTER_API_KEY`, the internal dry-run marker, raw provider markers (`urgency_signal`, `probabilities`), or override values (`evil.example`, `typesafe/jev-latest`); crash output is the bounded closed record only (`evidence:R10` refusal-record / `evidence:R12` hold-record lines, no provider payload, cost, or input state); `docker logs` of a killed container contain only two Node warning lines; negative-scan log SHA-256 `aa30a028de56…`, per-case output digests in evidence §8 |
| P5-03c | Run missing, blank, malformed, and unusable credential cases; verify safe refusal and no provider invocation where preflight applies. | Offline refusal fixtures, harness-side invocation counter, result receipts | CHECKED (offline preflight scope) — `[env:runtime-adapter] auth: missing and blank keys refuse before the transport seam`: keys `undefined` and `""` both refuse `evidence:R06` with harness port calls `["consume","terminal"]` (transport seam never invoked). Carried finding recorded under “Blockers and carried holds”: whitespace/malformed keys pass the presence guard and provider-side usability is offline-unverifiable |
| P5-04a | Send one valid request using the documented stdin/API framing and verify the exact typed result/receipt contract. | Request fixture digest, output digest, exit/status receipt | CHECKED — `[env:container-launcher] positive: one dry-run request returns a single redacted typed result without disclosing the credential`: one request on stdin (`jev-decisions/container/fixtures/dry-run.json`, SHA-256 `ec41c59c16e6ef51746a99c1641f18e7fdd40c665fec9d30d4bac20b6c5c1986`) to `container/jev-run.mjs` (SHA-256 `6feab6cc…`) returns exit 0 and one JSON line with the exact typed observation (exact Decisions endpoint, requested identity, served model `typesafe/jev-1.13-20260917`, cost USD `0.000017934`) and no credential |
| P5-04b | Send empty, malformed, oversized, duplicate, unsupported-version, trailing-data, and caller-override inputs. | Negative fixture matrix, zero-invocation counter, sanitized stderr | CHECKED — `[env:container-launcher] negative: empty, malformed, trailing, oversized, and unsupported-mode inputs fail closed`: empty input, malformed JSON, duplicate/trailing framing (two documents), oversized (300 KB over the 256-KiB cap in `container/jev-run.mjs`) all exit 2 with one generic `invalid_input` line and no sentinel disclosure; the unsupported-version case is exercised as the framing’s `mode` discriminator (`mode:"live-run"` → `invalid_input`). `[env:container-launcher] refusal`: caller-override fields (endpoint, method, model, cost_cap, credential, redirect) are neutralized and the result is byte-identical to baseline. Zero invocation on these paths is structural (`readJsonStdin`/`buildRuntimeInput` reject before `executeDecision`); harness-side port counters are asserted in the `[env:runtime-adapter]` tests |
| P5-05a | Probe liveness and readiness with no provider connectivity; verify health is local-only and readiness does not disclose the credential. | Probe transcript, network denial/allowlist receipt, readiness output | CHECKED (process-level scope) — probed with provider connectivity denied at the namespace: every run used `--network none` (HostConfig.NetworkMode=none receipt) and the in-container probe shows only the loopback interface plus header-only `/proc/net/{tcp,tcp6,udp,udp6}` (zero listening or connected sockets) — health is local-only and there is no network surface to probe (HTTP health endpoints remain out of scope per JEV-P4 and are unimplemented; none is claimed); readiness: one dry-run request returns the exact typed result with no credential (output SHA-256 `e8ead966fe80…`, excerpt evidence §9); liveness: deterministic per-input-class completion (exit 0/1/2) with bounded timing (~1 s/request; nine runs 23:40:45Z–23:40:54Z) (evidence §9) |
| P5-05b | Exercise invalid configuration, absent secret channel, startup, shutdown, signal, and one-request completion paths. | Lifecycle receipts, bounded timings, temporary-file cleanup evidence | CHECKED — lifecycle receipts recorded (evidence §10): startup/one-request completion paths exit 0 (dry-run success), exit 1 (bounded closed records `evidence:R10` / `evidence:R12`), exit 2 (`{"ok":false,"error":"invalid_input"}` for empty stdin, malformed JSON, `mode:"live-run"`, and missing runtime fields — one generic line, no field echo); absent secret channel: run without any key env exits 0 byte-identical to baseline (SHA-256 `e8ead966fe80…`) — only the internal dry-run marker satisfies the guard; temporary-file cleanup: launcher writes zero files (tmp_entries_after_run=0), tmpfs disposable (tmp_writable=yes, tmp_entries_final=0), rootfs read-only enforced; signal/shutdown: SIGTERM 23:41:31.025Z did NOT terminate the container (`docker wait` hung ~110 s — `container/jev-run.mjs` registers no signal handlers and as PID 1 default-disposition signals are ignored); shutdown required `docker stop -t 2` → SIGKILL, ExitCode=137 at 23:43:21.586Z (StartedAt 23:41:29.840Z) — carried finding F2 (no graceful SIGTERM shutdown) |
| P5-06a | Exercise auth/error/malformed-provider, timeout/cancellation/process-failure, redirect/TLS-authority, unexpected-host, unsupported-endpoint, and cost-cap refusals with injected fakes or deny-only fixtures. | Scenario matrix, zero/one-call counters as applicable, refusal receipts | CHECKED — every listed class is exercised in `jev-decisions/tests/p4-boundary-scenarios.test.ts` (SHA-256 `dc940245…`) with injected fakes: auth `evidence:R06` (missing/blank key); malformed provider `R10` and malformed transport `R04`; synthetic timeout `R04`, occupied-lease `R16`, and transport boundary failure `R04` (timeout/cancellation/process-failure — the runtime bounds the transport with `AbortSignal.timeout(30_000)` and the contract has no external cancel seam); redirect-follow and unverified TLS `R04`; unexpected endpoint authority (`evil.example`) `R04` (unexpected-host/unsupported-endpoint); non-2xx/content-type/body-bounds `R04`; over-cap and unqualified/missing cost `R13` (cost-cap). Scenario matrix recorded in the JEV-P4 spec |
| P5-06b | Verify refusals do not fabricate answers, follow redirects, retry past bounds, duplicate effects, or expose secrets/raw bodies. | Negative assertions and redacted output digests | CHECKED — `[env:runtime-adapter] refusal` proves incomplete answers refuse `R10` and the record excludes answer values; redirects are refused, not followed (`redirects:"follow"` → `R04`); each run makes exactly one transport call (harness calls `["consume","transport","terminal"]`; runtime test `executes one bounded call and returns only a redacted live observation`) so no retry/duplicate effect; no refusal or closed record contains the key or raw provider body (sentinel and payload assertions across the suite) |
| P5-07a | Assemble source, image, environment, fixtures, timestamps, procedure, result, reviewer, and digest fields for every check. | Complete evidence manifest and SHA-256 inventory | BLOCKED — the manifest cannot be assembled while image, attestation, and review rows are BLOCKED; no stored evidence artifacts with UTC timestamps and reviewer sign-off exist; unblock: after P5-01/02 evidence and the reviews exist, index every artifact with SHA-256 in the ledger |
| P5-07b | Independently verify attestation and invocation/isolation claims; distinguish offline evidence from any separately authorized live evidence. | Independent verifier receipt and evidence classification | BLOCKED — no attestation or invocation/isolation claim set exists to verify (P5-01b) and no fresh independent reviewer has run. Evidence classification is recorded here: every CHECKED row is offline-only; the only live-evidence residual is the carried key-usability finding; unblock: run the independent verifier after attestations exist and have it sign the classification |
| P5-08a | Rehearse digest-pinned rollback to the prior approved path and verify bounded recovery after failed pull, health failure, startup failure, or ambiguous state. | Rollback transcript, prior image digest, recovery/verification receipt | BLOCKED — no approved prior image exists and no registry/pull path is available or authorized; unblock: after two approved images exist, rehearse digest-pinned rollback and record the transcript and recovery receipts |
| P5-08b | Quarantine a failed/revoked/unverifiable image and prove floating tags/caches cannot select it. | Quarantine record, selection-denial receipt, retained evidence digest | BLOCKED — quarantine mechanics require a published registry with tag/cache selection; nothing is published or authorized; unblock: after publication, record the quarantine record and selection-denial receipt |
| P5-09a | Compare a clean-tree parent baseline against the candidate and verify no RCM/D10/D13 routing or eligibility surface changed. | Exact diff, baseline ref/digest, path allowlist result | CHECKED (source scope) — the JEV commits `cf6c553` (P0), `bd9707a` (P1), `34fc2f5` (P2), `2440aba` (PR #44, P3), and `a2c2971` (P4 scenarios) each change only paths under `plugins/foreman-line/` (`git show --name-only` per commit; zero paths in `routing-policy/`, `dispatch/`, `contracts/`, `templates/`); no RCM, D10, D13, routing, or eligibility surface changed. Image-layer comparison is deferred to the P5-01 candidate (BLOCKED there) |
| P5-09b | Run parent and Jev package tests; verify route decisions, fallback behavior, and refusal semantics are unchanged. | Test commands/results, fixture digests, test-log digest | BLOCKED (parent half) — the parent package suite is not run in this pass (project-wide validation is coordinator-owned and runs once after all slices land). Covered offline: `jev-decisions` `npm test` on 2026-09-26 = 44/44 pass including all 17 P4 scenarios (6 core + 7 `[env:runtime-adapter]` + 4 `[env:container-launcher]`); refusal semantics unchanged per P5-06b; unblock: coordinator runs the parent suite and records the route-decision and fallback comparison |

## Evidence ledger

| Evidence ID | Supports | Artifact/path | SHA-256 | UTC timestamp | Reviewer | Disposition |
|---|---|---|---|---|---|---|
| EV-JEV-P5-001 | P5-01 | `plugins/foreman-line/jev-decisions/container/Dockerfile`; `jev-decisions/package-lock.json`; `jev-p5-docker-evidence-2026-09-26.md` (§1–4: context manifest, two build receipts, rebuild comparison, image inspect) | `7562b14ec14baa7f0da9cbec9ac3736492be5b78981dba70919adb0eca15494c`; `acff3bcb50d4cec1520dbdcbb953c9320a334454a67bc7ec8ada00419b05c979`; `c72ffdec2ad866ac75ed19a05302021cc365e57fe6cd61914589abd8987b53e8` (evidence doc) | 2026-09-26 | JevP5Docker builder session, coordinator dispatch 2026-09-26 under owner blanket authority (independent reviews A/B still BLOCKED) | CHECKED (local build scope) — two clean builds + final-digest comparison + inspect recorded (P5-01a/01b); image `sha256:a480f6cbdae7…`; candidate-cut re-pin provisional |
| EV-JEV-P5-002 | P5-02 | `jev-p5-docker-evidence-2026-09-26.md` §5–6 (runtime config receipt, in-process uid/capability probe, limits receipt, filesystem/cleanup inspection) | `c72ffdec2ad866ac75ed19a05302021cc365e57fe6cd61914589abd8987b53e8` | 2026-09-26 | JevP5Docker builder session, coordinator dispatch 2026-09-26 under owner blanket authority (independent reviews A/B still BLOCKED) | CHECKED (P5-02a/02b) |
| EV-JEV-P5-003 | P5-03 | `jev-decisions/tests/p4-boundary-scenarios.test.ts` (auth + redaction assertions); `jev-decisions/container/jev-run.mjs`; `jev-p5-docker-evidence-2026-09-26.md` §7–8 (layer/context/secret scan + container redaction negative scan; scan-log digest `aa30a028de56…`) | `dc940245b23706a146ef6d0463b9edf3148f3100b5f2ad9027e738773f14c1ee`; `6feab6ccb0af821ce24e722e178d985bf8cd233767123dc1dc33fb13887176c5`; `c72ffdec2ad866ac75ed19a05302021cc365e57fe6cd61914589abd8987b53e8` | 2026-09-26 | JevP5Docker builder session, coordinator dispatch 2026-09-26 under owner blanket authority (independent reviews A/B still BLOCKED) | CHECKED (P5-03a/03b/03c) — offline preflight + container layer/secret scan + redaction negative scan |
| EV-JEV-P5-004 | P5-04 | `jev-decisions/container/fixtures/dry-run.json`; `[env:container-launcher]` positive/negative/refusal tests | `ec41c59c16e6ef51746a99c1641f18e7fdd40c665fec9d30d4bac20b6c5c1986` | 2026-09-26 | coordinator decision 2026-09-26 under owner blanket authority | CHECKED (P5-04a/04b) |
| EV-JEV-P5-005 | P5-05 | `jev-p5-docker-evidence-2026-09-26.md` §9–10 (probe transcript, network-denial receipt, readiness output, lifecycle receipts incl. signal finding F2) | `c72ffdec2ad866ac75ed19a05302021cc365e57fe6cd61914589abd8987b53e8` | 2026-09-26 | JevP5Docker builder session, coordinator dispatch 2026-09-26 under owner blanket authority (independent reviews A/B still BLOCKED) | CHECKED (P5-05a/05b; carried finding F2 — no graceful SIGTERM shutdown) |
| EV-JEV-P5-006 | P5-06 | `jev-decisions/tests/p4-boundary-scenarios.test.ts`; `jev-decisions/tests/fixtures/p4/provider-success.json`; `provider-malformed.json`; `provider-over-cap.json` | `dc940245…`; `e7a5d407a7ecda0d2094431f9be76572b222c57240d2fc9aee4884b43641fffb`; `39efed253a24e354a8a323b56b3f32ef8534d644295ac913555359a0729ba54a`; `cbcf3114db2f7cfe814d568bf0874b4af0c25102ce5cf5532e997228285e71b9` | 2026-09-26 | coordinator decision 2026-09-26 under owner blanket authority | CHECKED (P5-06a/06b) |
| EV-JEV-P5-007 | P5-07 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | BLOCKED — manifest/attestation not assemblable (P5-07a/07b) |
| EV-JEV-P5-008 | P5-08 | `PENDING` | `PENDING` | `PENDING` | `PENDING` | BLOCKED — no registry/prior approved image (P5-08a/08b) |
| EV-JEV-P5-009 | P5-09 | `git show --name-only cf6c553 bd9707a 34fc2f5 2440aba a2c2971` (all changed paths under `plugins/foreman-line/`); `jev-decisions` `npm test` output 2026-09-26 (44/44 pass) | git object ids cited (SHA-1); test log not stored | 2026-09-26 | coordinator decision 2026-09-26 under owner blanket authority | PARTIAL — source-scope proof CHECKED (P5-09a); parent-suite half BLOCKED (P5-09b) |

## Reviews and human gate

| Item | Required condition | Status |
|---|---|---|
| P4 predecessor | JEV-P4 Gate 3 acceptance recorded before P5 closure | BLOCKED — JEV-P4 Gate 3 human acceptance is not recorded; the P4 suite is green (17/17 in `jev-decisions/tests/p4-boundary-scenarios.test.ts`; 44/44 package suite, 2026-09-26) but merges/acceptance remain human-owned (loop-directive, standing authorizations item 3); unblock: record explicit Gate 3 acceptance for the bounded JEV-P4 artifact set |
| Architecture/release review A | Fresh independent review; no unresolved Critical/High finding | BLOCKED — no fresh independent review of the P5 artifact set has run (reviewers are read-only and were not dispatched in this pass); unblock: run review A and record the verdict |
| Architecture/release review B | Fresh independent review; no unresolved Critical/High finding | BLOCKED — same as review A; unblock: run review B and record the verdict |
| Evidence reconciliation | Every failed, missing, stale, or contradictory item has an owner and stop condition | CHECKED — this 2026-09-26 disposition (coordinator decision 2026-09-26 under owner blanket authority; owner: Foreman Line coordinator) gives every failed, missing, stale, or contradictory item an exact cause, an owner, and an unblock/stop condition; the stale P4-scenario blocker is corrected under “Blockers and carried holds” |
| Merge | P5 artifacts merged to the approved branch | BLOCKED — P5 artifacts are not merged; merges remain human-owned for JEV-P2–P5 (loop-directive, standing authorizations item 3); unblock: human merge authorization |
| Local refresh | Local main refreshed after merge; checklist and evidence index re-read | BLOCKED — cannot happen before the merge above; unblock: refresh local main after merge and re-read this checklist and evidence index |
| Human Gate 3 | Explicit acceptance recorded for bounded JEV-P5 only | BLOCKED — explicit human acceptance for the bounded JEV-P5 artifact set is required and none is recorded; it is never inferred or fabricated here; unblock: human Gate 3 decision naming the bounded P5 artifact set |

## Blockers and carried holds

- `BLOCKED` (was `PENDING`, 2026-09-22): release candidate identity is not
  supplied. A container image now exists and was exercised locally —
  `jev-decisions-container:prototype` = `sha256:a480f6cbdae7…`, built
  2026-09-26 from the dirty worktree `305ecbf01a8b…`
  (`jev-p5-docker-evidence-2026-09-26.md`) — but no candidate ref/commit is
  cut, so the release identity remains unpinned (P5-01 source rows; re-pin the
  image digest at candidate cut).
- Resolved 2026-09-26 (was `PENDING`): P4 boundary/security scenario results
  now exist on disk — `jev-decisions/tests/p4-boundary-scenarios.test.ts` is
  green (17 tests: 6 core, 7 `[env:runtime-adapter]`, 4
  `[env:container-launcher]`; full `jev-decisions` `npm test` 44/44 pass on
  2026-09-26). The JEV-P4 Gate 3 record is still missing (see “Reviews and
  human gate”).
- `BLOCKED` (was `PENDING`): review verdicts, merge commit, and post-merge
  local refresh — all human-owned (see “Reviews and human gate”).
- **Carried finding (2026-09-26):** an empty-string API key refuses
  pre-transport (`evidence:R06`) — verified by
  `[env:runtime-adapter] auth: missing and blank keys refuse before the
  transport seam` (keys `undefined` and `""`). Whitespace/malformed keys pass
  the presence guard and reach the provider boundary; their provider-side
  usability/auth outcome is offline-unverifiable and is the only residual that
  would require a separately authorized live call. It is not claimed here.
- **Carried finding F1 (2026-09-26, build reproducibility):** independent
  clean builds of the same inputs do not produce byte-identical image digests
  — the sole payload variance is the build-second mtime of the `/app`
  directory entry inside the three COPY layers (plus the config `created`
  timestamp in default builds); file payloads are byte-identical (content
  inventory SHA-256 `bc43ff8d8294…`). The final image digest must be re-pinned
  at candidate cut and digest-pinned rollback must use the exact cut image
  (`jev-p5-docker-evidence-2026-09-26.md` §3).
- **Carried finding F2 (2026-09-26, lifecycle):** the image has no graceful
  SIGTERM shutdown — `container/jev-run.mjs` registers no signal handlers and
  as PID 1 default-disposition signals are ignored; SIGTERM left the container
  running and only SIGKILL (exit 137) stopped it. Recommended remediation at
  release: a minimal SIGTERM handler or an init (`--init`/tini)
  (`jev-p5-docker-evidence-2026-09-26.md` §10).
- HAWF remains `escalated-unresolved / downstream hold` if that status is
  still active when evidence is assembled; this checklist does not act on,
  reconcile, or pass that hold to Helmholtz.
- No host-owner, Pi, OpenRouter, or live provider evidence is accepted here
  without its exact source, UTC timestamp, sanitization boundary, and digest.

## Closure rule

This checklist is not a release approval. JEV-P5 remains open while any check,
evidence row, review, merge, refresh, or Gate 3 item is `PENDING` or `FAIL`.
Closure requires all required checks to be `PASS`, the evidence manifest to be
independently verifiable, parent routing preservation to be proven, and the
human Gate 3 decision to name the bounded P5 artifact set.

As dispositioned 2026-09-26 and amended by the 2026-09-26 Docker evidence
pass: no row remains `PENDING`; every unchecked row is `BLOCKED` with an exact
cause and unblock condition above. JEV-P5 therefore remains `OPEN` pending
exactly those blocked items (SBOM/provenance attestation and CVE-scan
receipts, registry publication, evidence manifest P5-07a/07b,
rollback/quarantine P5-08a/08b, the parent-suite half of P5-09b, both fresh
reviews, human merge, local refresh, and human Gate 3).
