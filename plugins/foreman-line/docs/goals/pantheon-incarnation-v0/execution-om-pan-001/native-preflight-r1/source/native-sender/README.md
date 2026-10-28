# P00 native curl sender preparation

This is **offline native bootstrap preparation** under OM-PAN-001, not a live sender or Runtime adapter. The test runner invokes the actual pinned Windows curl against numeric loopback fixtures only. It does not resolve credentials, contact a provider, invoke a reviewer, or grant authority. There is no live execution export or command-line sender.

Run from `D:/Repos/Pantheon/work/foreman-om-pan-001-p00`:

```powershell
node --test plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/native-sender/native-sender.test.mjs
```

Final observed result: **41 tests passed, zero failed/skipped**, Node v24.7.0, native curl 8.21.0. [verification.json](verification.json) records source hashes, exact command and runtime. Tests require no installs. Their temporary files are inside `.test-runs/` and are removed only after validating the owned child directory.

## Public surface

| Export | Purpose and boundary |
|---|---|
| `describeLiveCommand(options)` | Returns data with the fixed `https://api.anthropic.com/v1/messages` endpoint, executable hash, safe argv, raw sink and credential-channel contract. `mayExecute:false`, `runtimeDecisionRef:null`; no key input or execution. |
| `runOfflineFixture(options)` | Runs only `http://127.0.0.1:<explicit port>/v1/messages`, with the fixed fake marker. No arbitrary process, transport, header, environment, executable or argv injection option exists. |
| `inspectNativeCapture(rawBuffer, expected)` | Pure parser for a Buffer of at most 2 MiB and exactly `{model,maxTokens,requiredCoverage}`. Returns captured HTTP/provider IDs, usage snapshots, structured review fields, raw digest, error/hold state and `reviewAccepted:false`. Performs no I/O and requires separate transport-completion evidence. |
| `validateReviewPayload(value, requiredCoverage)` | Pure structural checker for model-supplied review fields. It discards model-asserted provenance. It does not authenticate authorship, source locations, authority or review quality. |

The helper's own SHA-256, exact request bytes/hash, model, `max_tokens`, no-tools request, source-head reference, artifact manifest digest and nonsecret account-binding reference must match before a fixture send. The native executable is fixed at `C:/Windows/System32/curl.exe`, version 8.21.0, SHA-256 `73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805`; the file hash is checked before each invocation. Source-head and account references are recorded bindings, not independent Git/account qualification. A source change requires an intentionally updated expected helper hash.

## Native command controls

The first argument is `--disable`, so curl does not load its default config. The only config is stdin, containing a fixed fake header in fixtures. The future descriptor names stdin as the broker's credential channel but does not construct or accept a real credential. The trusted future integration must reject CR/LF, quotes, backslashes and control characters in the resolved value before encoding one header assignment; no arbitrary config text is authorized.

The command uses `--retry 0`, no `--location`, `--max-redirs 0`, an exact endpoint, protocol allowlists, `--proxy ''`, `--noproxy '*'`, normal TLS validation on the HTTPS descriptor, and no verbose/trace mode. It is spawned with `shell:false`, `windowsHide:true` and the literal environment `{SystemRoot:'C:\\Windows'}`. It never reads or copies ambient proxy, curl-home or credential variables. The test of ambient credentials constructs a separate literal fake-only environment; it does not read an existing real credential.

Live descriptor limits are 30-second connect, 600-second total, 120-second low-speed/streaming-idle, 2 MiB capture and at most 5 seconds owned cleanup. Fixture timers may be shortened within validated bounds. Curl's connect/low-speed/total controls and the supervisor's absolute timer cover startup. The supervisor's streaming-idle timer starts with response bytes and resets on capture. A timeout kills only the spawned curl process. If cleanup is not confirmed within five seconds, `OWNED_CLEANUP_UNCONFIRMED` holds the attempt. These local timers cannot certify remote cancellation or defeat an OS/process-wide stall.

Curl runs `--include --output -` into the helper's pre-opened, exclusive `response.raw` file. This is a fixed raw sink; it allows the helper to bound the combined header/body capture, including unknown-length responses, rather than writing an unbounded header file. `--max-filesize` adds a native body limit. Stderr is bounded and private: only numeric write-out metadata and byte count are retained, never raw diagnostics, key data or reasoning text. Returned results omit thinking content; raw capture remains a local artifact.

## Claims, evidence and recovery

Before curl starts, the helper flushes an exclusive `claim.json`, exact `request.body.json`, safe `command.json`, and `send-intent.json`. It flushes bounded raw capture before writing `result.json`. Same-directory, same-ID duplicate claims are rejected whether the prior attempt succeeded, failed, crashed or has uncertain delivery. There is no release, continuation or automatic replay path.

Timeout, drop, partial HTTP, truncated SSE, malformed/empty/thinking-only output, output exhaustion and capture overflow produce a failed attempt. A local timeout may precede server delivery; zero or one server-observed request is compatible with uncertainty. Neither case allows automatic replay. All negative outcomes preserve claim/evidence and `remoteCancellationConfirmed:false`.

This is a local duplicate guard, not a distributed ledger or provider idempotency guarantee. The caller can choose a different ID; a future broker must atomically bind a stable logical dispatch identity, budget reservation and current coordinator fence across machines. File fsync is not a power-loss/rollback guarantee, and `0600` does not establish Windows ACLs. Host administrators and the preparation directory remain trusted. Existing parent paths are checked before evidence creation, but this is not a hostile-filesystem sandbox.

## BOOTSTRAP.md contract reconciliation

The model supplies `reviewText`, exact `verdict` (`pass`, `changes_required`, `blocked`), structured `findings`, `coverage` and `limitations`. This replaces the earlier prototype's `revise` spelling. Findings use `critical/high/medium/low/info` plus `claim`, nonempty evidence locators, `requiredChange` and `acceptanceCheck`. Non-pass verdicts require findings; pass cannot conceal high/critical findings. Missing coverage/limitations or short/empty text fails structural validation. Coverage names must include every requested focus; a later verifier must assess whether the explanations actually cover them.

The SSE parser checks complete HTTP status/headers and stream ordering; exact returned model; allowed text/thinking block structure; terminal stop reason; cumulative nondecreasing usage; output allowance; and structured answer fields. Thinking is never repurposed as an answer. It does not repair malformed JSON or strip fences. HTTP errors are failures even if their body resembles a complete review.

Capture obtains `request-id` from HTTP headers and message ID/model from the stream, and binds the raw digest. Model-asserted provider IDs/provenance are discarded. The runner binds source/request/artifact references from its own pre-send record. It cannot prove independent authorship or resolve evidence locators against the pinned source, so **every structurally usable result remains `status:'held'`, `code:'SEMANTIC_ACCEPTANCE_HELD'`, `reviewAccepted:false`**. `changes_required` is preserved as useful completed review content, not mislabeled a transport failure. A separate trusted verifier must add full reviewer/author session IDs, applicable bootstrap grant or real Runtime decision, source resolution, substantive focus validation and independence evidence before it can close a review gate.

`inspectNativeCapture` is intentionally reusable by a separately reviewed trusted capture path. Its result describes only the bytes supplied to it, not their authenticity. That integration must independently bind complete curl exit/status, exact request, authorized account, attempt claim, raw artifact custody and source/identity checks. The parser cannot manufacture those records.

## Accounting

Mock counters are labelled `fixture-reported`, scope `one-response-cumulative-snapshots`; repeated cumulative output counts replace earlier values, never sum. Missing/finally unknown usage remains unknown; partial observations are retained; contradictory/malformed stream termination cannot mark usage final. Visible answer byte length is separate from output/reasoning tokens. No raw reasoning is returned.

`preflightEstimate`, `reservedBudget`, `locallyEstimatedUsage`, `providerReportedUsage` and `billedCost` are distinct null categories because this helper has no such evidence. It does not calculate prices, release reservations or claim an exact billing cap. The trusted integration must reconcile actual provider usage under the registry and retain uncertain exposure.

## Remaining qualification

This work establishes local native one-send/capture behavior and a tested structural parser. It does not establish a live TLS/API call, account/credential entitlement, provider output semantics, independent review, authenticated Runtime decision, budget reservation, distributed fencing or eligible merge. Account binding and live qualification belong exclusively to the coordinator/broker; this builder did not inspect the new binding.

Promotion requires independent checking of this diff, a trusted admitted/explicit-bootstrap executor with safe stdin secret handling and transactional claims/reservations, fresh account/rate evidence, and a bounded new synthetic live qualification within the ratified envelope. It must not replay the consumed review or mutate the sealed proposal package. No commit, push or production source change was made here.
