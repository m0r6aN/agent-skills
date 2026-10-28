# P00 native sender builder handoff

Status: **offline preparation complete; independent checking and coordinator closure pending**.

- Builder: native bootstrap session 1/8, supported Codex host A (`M0R6AN`). Step 0 was accepted automatically by the coordinator before code.
- Assignment: `P00-SENDER-SPEC.md`, SHA-256 `6e135460709afc6b5f278a9606181e9809409b170a96749156eaba2269a69d37`.
- Ratified package reference: OM-PAN-001 manifest `ca6645f02284dca74b17a9500ec0482552bb192e785f1d76ae0be1f4f9532f82`. This handoff is not a new approval or Runtime receipt.
- Workspace/branch/base: `D:/Repos/Pantheon/work/foreman-om-pan-001-p00`, `codex/om-pan-001-p00`, `64fb8949bf5134f96fda02df0d4f52ac291a6138`.
- Writes: only `plugins/foreman-line/docs/goals/pantheon-incarnation-v0/execution-om-pan-001/native-sender/` in that worktree.

Delivered: `native-sender.mjs`, `native-sender.test.mjs`, `README.md`, `PLAN.md`, `.gitignore`, `verification.json`, and this handoff. No package installation or external dependency was added. The sealed proposal, canonical source and activation records were read-only.

Verification: final `node --test .../native-sender.test.mjs` ran **41 tests, all passed, no skips**, in **7390.3275 ms**. The exact command, Node/platform/native-binary identity and file hashes are in `verification.json`. Initial tests failed before implementation. Later regression tests reproduced and fixed final-usage classification after invalid trailing SSE events, pre-send validation of oversized coverage expectations, standalone parser handling of HTTP error status, and streaming-idle treatment of native process startup. The short absolute-deadline test was corrected to permit zero or one delivery while always refusing replay; an absolute timeout cannot guarantee that Windows started curl or that a server received a request.

The first Step 0 prose accidentally transcribed an extra `d` in the native binary digest. A direct recheck confirmed the exact 64-hex digest before any fixture invocation; no hash check was bypassed. The executable pin in code and verification is `73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805`.

Coordinator-requested extension delivered: pure `inspectNativeCapture(Buffer, {model,maxTokens,requiredCoverage})` with strict bounds and no I/O. It parses HTTP status, actual captured provider IDs, SSE usage and structured answer fields, but always returns `reviewAccepted:false`; successful structural parsing is held. The runner uses this same parser, so a later supported capture integration can reuse it without duplicate acceptance code.

No provider request, secret lookup, browser/account action, historical packet replay, paid review, Runtime authority manufacture, commit, push, PR, merge or production adapter edit occurred. Native curl executions were numeric loopback with a fixed fake marker. The ambient-credential test used only a fresh literal fake-only environment and did not read the real process binding.

Remaining work: independent check of this diff; trusted bootstrap/Runtime execution wrapper and accounting/fencing; actual account qualification/live synthetic validation by the coordinator; and semantic source/coverage/independence acceptance. The helper's live command descriptor is data only. Its local exclusive claim does not prevent a caller from inventing a new attempt ID; the authoritative logical-dispatch ledger must close that gap. All structurally complete review results remain held, including `pass`; no independent plan review is claimed.
