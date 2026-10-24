# P2C teardown and protocol repair — verified, reviews pending

Recorded 2026-10-24T14:31:30.202245+00:00. The owner's ONE bounded kill/wait and protocol-test
repair is implemented under disclosed local operator authorship. Runtime now
attempts bounded wait independently of poll/kill exceptions, using timeout0 when
the command budget has expired. Teardown failure remains isolation_failure.
Only runtime.py and its test file changed; protocol/worker/Dockerfile/docs and
all422accepted source entries remain pinned. Candidate is uncommitted in
`D:/Repos/ccm-worktrees/cortex-p2c-runtime`; private exact snapshot retained.

**Local verification complete:**154focusedPASS,24newcases, allprior130focused
dispositions retained. Fullsuite3,141PASS/137skip, all3,124prebuildidentities and
422accepted tree pins retained. Mypy/Black/isortPASS. Seven actual Windows-client
API cases and five fixed Docker faultsPASS, allcreatedcontainersabsent. Production
image remains `sha256:a6a75dbc102b44c309be0fa8315e94e183de21557decb7da63b6f4aed20ba42c`
because the image's3modules/Dockerfile are unchanged. No other-host, daemon-outage,
hard realtime cancellation, deployment or mass import claim.

Independent fixed reproduction now records kill1/wait1 with isolation_failure,
including closedpipes. Mutation-sensitivity checks confirm new oracles detect
all5in-memory bypasses: duplicate envelope, duplicate symbol, numeric rejector,
predecoder depth and integer limit. Baselines pass and each bypass makes the new
oracle fail as intended. No source files mutated or source programs executed.

**Fresh independent reviews remain held; zero inference sent.** Full exact-source
packets are ready for2freshSol architecture/security contexts, same-model-family
limitation disclosed. Their conservative byte-based estimates are about170credits
each, configured180per-call/250whole-phase maximum with each future dispatch
conditional on completed prior booking and fresh guards. No retries/fallback.
Allold4457.868750conservative holds, including original120 and unknown150, remain;
floor1000/day6000/effort9000 remain. New reported/booked usage0/0.

The API reports5569.2credits. Reserving180would leave931.331250 after carried
holds, below1000floor, so preflight stopped before POST. Owner confirmed credits
added, but a fresh API read still shows5569.2. No conclusion about the topup's
account or completion is invented. Owner was asked for displayed post-topup
balance/account clarification. No credential value or identifying account data
was exposed; only credit metadata and response field names were retained.

Next: reconcile the observed balance, then run the already-prepared private
`p2r-teardown-review.py architecture` once and `security` once sequentially. Each
call performs actual metadata/model-price/incident-route/sourcehash/day/effort/
floor checks. Preflight rechecking after an external balance update is not a
provider retry: no inference has occurred. Do not rerun completed local tests or
source generation. Consume/triage actual review results, then only green-chain
eligible source PR/merge under existing standing gates. No fourth source repair
is authorized. Allaffected/native/private-Pi routes and import gates stayheld.

Evidence: teardown-repair-admission, teardown-repair-validation,
teardown-actual-composition, teardown-actual-faults, teardown-oracle-proof,
teardown-review-admission, teardown-review-preflight and teardown-progress
JSONs dated20261024 under this goal's evidence directory. Sole coordinator is
this Context session; no new worker, monitor or competing coordinator launched.
