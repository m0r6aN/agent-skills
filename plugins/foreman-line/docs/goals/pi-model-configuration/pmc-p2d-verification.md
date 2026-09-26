# PMC-P2D offline terminal transport verification

## Frozen scope and authority

Completion resumes the eight preserved in-progress paths at release
`d765b9305fc6add52c278711fcb8487e23369095`; this report is the ninth allowed path.
The three new source files are `openrouter-chat-stream.ts`,
`owned-https-sender.ts`, and `pi-runtime-port.ts` under `dispatch/src/pmc-launch`.
The three corresponding new tests and dispatch package/lock are the other paths.
No barrel, predecessor, registry, host configuration, credential store or provider
operation was changed. No dependency installation was performed by this completing
builder. The earlier builder's work was retained and completed, not reset.

Production construction unconditionally returns `BOUND_REFUSED` without inspecting
its argument. The internal composer receives actual pinned Pi capabilities and
installation-owned custody callbacks; it has no HTTP-client/test-mode switch.
The test's native request replacement cannot open a socket. A successful synthetic
profile is not a provider certificate, installation authority or authorization for
paid operation. No model/provider availability or live inference is established.

## Concrete composition

The actual Pi 0.87.1 ModelRuntime and AgentSession use supplied memory stores,
explicit model, empty resource loader, native provider registration and disabled
retry, compaction, warming and telemetry. Ambient auth, host-file, subprocess and
network guards are installed before dynamic SDK imports. Real SDK cwd rendering,
model/session identity and its 300000 ms default option are checked; the owned
sender independently enforces its 120000 ms overall / 30000 ms idle deadlines.

C selects through the real resolver and adapters before D initializes Pi. D waits
for the normalized stream callback and payload hook, freezes its owned request,
and authenticates every C revalidation claim before adopting C's copied wire.
The actual C/B1/SQLite ledger path acknowledges consume before the credential
supplier and sole fixed Node HTTPS request run. Observation capabilities remain
separated between D registration, C observation and ledger authentication. Final
Pi completion waits for C reconciliation; the public result contains only bounded
text or a named failure, never session statistics or usage.

Pi cost components are tariff estimates, with the required
`pmc-nonaccounting-usage` diagnostic retained in the actual assistant session
message. Raw account-cost lexemes remain separate. Fractional microUSD stays
unknown in the unchanged integer ledger, and causes failed invocation output.
Native response identity is retained. Hook failure does not erase independently
known charge. Length yields failed-settled/OUTPUT_TRUNCATED, never completed text.

## Tests and limitations

The new focused suite has 50 parser tests, 15 sender/registry tests and 3 Pi tests.
The guarded Pi test includes actual C/B1/ledger compositions for stop, length,
fractional unknown, credential no-send, billable-bound refusal, payload replacement,
throwing payload/response hooks, C revalidation rejection, thinking-level mismatch,
missing profile, never-resolving hook, bounded cleanup timeout, second stream,
unknown SDK option, copied wire and altered claims. It checks durable consume
before credentials, finalizer replay, literal ordered wire digest, private session
diagnostics and responseId. Test-only native-provider instrumentation delegates to
the real ModelRuntime; test-only session instrumentation delegates to the actual
createAgentSession. No structural stand-in is asserted to be a nominal SDK class.
Deadline tests shorten only the named timers; they prove state transitions, not
wall-clock performance. The cleanup-timeout control deliberately withholds the
outer prompt acknowledgement and does not claim that promise drained.

The sender matrix covers constructor/write/end faults, redirects, encoded or
incomplete responses, request/response errors, premature close, abort and hook
failure. Registry tests cover same-proof terminal replay for known, unknown and
no-send outcomes, copied/cross-invocation objects, changed states, amounts, proof
fields and timestamps. Parser fixtures cover byte splits, CRLF, malformed UTF-8,
closed JSON/SSE/usage shapes and representable versus unknown cost lexemes.
Existing full dispatch tests retain real durable-owner restart/lost-ack coverage;
that is predecessor regression coverage, not a new live-network recovery claim.

These checks prove actual local SDK/controller/owner execution with synthetic
catalog/tariff evidence and a fake native network boundary. They do not prove TLS,
provider endpoint/tier identity, all-component billable ceilings, tokenizer
correctness, production custody or a live usable model. Those activation gates
remain open. The production entry cannot be enabled by passing these fixtures.

## Native checks

All commands use Node `D:/nvm/v24.19.0/node.exe`. Tests run in the named package
working directory with `--import tsx --test tests/*.test.ts`; focused tests name the
three new files. No network or provider call is part of these checks.

- Full dispatch: 541/541, exit 0 (`hro-d-dispatch.log`).
- Full routing-policy: 944/944, exit 0 (`hro-d-routing.log`).
- Focused transport: 68/68, exit 0 (`hro-d-final-focused.log`).
- Dispatch `tsc --noEmit` and `biome check .`: exit 0. Biome reports informational
  template-style suggestions, no errors (`hro-d-typecheck.log`, `hro-d-lint.log`).
- Actual D19 with explicit `--plugin-root`: PASS, exit 0 (`hro-d-d19.log`). An initial
  invocation omitted that mandatory argument and returned usage/exit 2; it was
  corrected and is not counted as a successful audit.
- Contract readers: 70/71, exit 1 (`hro-d-readers.log`). The sole failure is existing
  Contract B touch-set membership at `touch-set.test.ts:588`: actual undeclared
  readers additionally contain `dispatch/src/pmc-launch/controller.ts`. D's new
  files add no reader. This frozen base predates C reader enrollment; root must
  integrate accepted enrollment. This is not a waiver or a passed reader suite.
- `git diff --check`: exit 0. Full dispatch/routing ran before the final test-only
  portable path-separator/HOME guard adjustment; final focused/typecheck/lint
  replay cover that adjustment. No runtime changed afterward.

Logs are in `C:/Users/clint/AppData/Local/Temp/`. Genuine failing regressions were
retained there as `hro-d-sender-header-red.log` (missing native maxHeaderSize) and
`hro-d-usage-red.log` (permanent zero cost instead of observed tariff estimate).
Their fixes pass the final focused run. Initial real composition also exposed
noncanonical fixture bytes, exact SDK cwd/default option differences and the
required C proof-envelope shape; these were corrected before the green checks.

## Dependency and predecessor preservation

Direct coding-agent and pi-ai devDependencies are exactly 0.87.1. Their isolated
real dependency directories, including coding-agent's nested pi-ai/pi-agent-core
0.87.1, match all 35 preflight source-hash rows. No direct pi-agent-core dependency
or absolute installed-source import was added. Existing locked package versions
and integrity records were retained. Scripts-disabled installation is prior
builder provenance; filesystem inspection cannot prove the flags of that earlier
process, so this report does not invent a new installation attestation.

Preserved SHA-256 source pins:

- C controller: `5fbaf2c31b23afab2703e2bee90a18c08ab69fccd181e96ba4c9dd50455954c4`.
- B1 intent custody: `f4ee936e2c31daae895622684e64e17871304ab4c78789f39c1389dda7123107`.
- B ledger: `cf72406826da269166cab2a7c8f914234cc2e2729842267d3b3bbab594a34f63`.

The builder does not approve its own source. Root and an independent reviewer must
review the frozen nine-file implementation and distinguish offline evidence from
production readiness before integration. No push or merge was performed.
