# Review launch recovery tools

This is an opt-in **human-operated Claude Code supervisor**, not a Foreman route
resolver, production launcher, authority issuer, or automatic fallback. It makes
an already-authorized manual review reproducible without editing running sessions,
global settings, the goal, or the governed Pi launch boundary. No extension reload
or package install is necessary. Requires Node 24+, native Claude Code 2.1.303,
and the exact `claude-opus-5-5` model. Other versions/models refuse pending qualification.

## Which path applies?

| Path | What permits it | Current meaning |
|---|---|---|
| Governed Pi L2 review | Authentic approved route and accepted installed launch composition | Legacy `L2_PINNED_PROVIDER_UNSET`, `RECEIPT_STATUS_REFUSED`, and production `BOUND_REFUSED` remain authoritative. This helper cannot clear them. |
| Direct Pi session | Actual explicit authorization for that goal/route | Historical successful reviews used this path. Another goal's exception is not transferable; Anthropic OAuth in Pi is not evidence of included Max billing. |
| Manual native Claude review | Actual scoped human approval accepting this weaker **configured-control** envelope and its account/data conditions | This helper supervises the operator's invocation. It never certifies the original strict token/billing/remote-termination guarantees. |

A roster entry selects a candidate. Catalog presence, credential readiness,
available CLI, provider availability, and Foreman admission are separate facts.
Do not turn any one into the others. Read the goal's accepted envelope first.

## Prepare and inspect (no provider calls)

From this directory, run in an ordinary terminal:

```text
node manual-claude.mjs --prepare PACKET AUTHORITY_RECORD NATIVE_CLAUDE_EXE NEW_RUN_DIRECTORY NEW_MANIFEST
node manual-claude.mjs --check NEW_MANIFEST
```

Quote each path containing spaces. All five prepare arguments are filesystem paths.
Preparation pins SHA-256 hashes for the packet, authority **reference**, and native
executable; it does not decide whether the referenced record grants permission.
Use the actual accepted record, not a proposal or another goal's grant. The prepared
manifest defaults to an OpenAI-family author; verify `authorFamily` and the neutral
system prompt against the approved scope. The supported envelope is fixed at 4,000
configured output tokens, 600 seconds of local review time, no tools, one attempt,
and no fallback. The packet must be nonempty UTF-8 and at most 128 KiB; exact bytes
are checked, not full provider request tokens. No automatic shortening occurs.

Use an absolute path to the native Claude executable, not `claude.ps1`, `.cmd`,
or a shell wrapper. On the diagnosed Windows installation it is
`D:/nodejs_symlinks/node_modules/@anthropic-ai/claude-code/bin/claude.exe`.
The run directory must not exist and its parent must exist. Keep it on the
coordinator's local private filesystem. Do not use synced folders as distributed
locks. If another machine or process has attempted this review, reconcile that
attempt before anything else. Retain the same manifest/run directory; making a
new directory to retry defeats the local guard and is not authorized by this tool.

## Run once, only under an accepted manual exception

The operator must first establish:

- Actual approval covers this exact internal packet, recipient, manual transport,
  configured output/time controls, and training-off **standard retention**, not ZDR.
- The standard first-party Max account has paid extra usage/credits OFF and model
  improvement OFF. Do not enable spending or switch to an API account to make it run.
- Managed policy adds no hooks, context, tools, alternate recipient or transport.
  Safe mode does not override managed policy. Do not disable policy to pass.
- No previous attempt exists on either machine, and the active coordinator owns
  review dispatch/triage. Do not launch alongside that coordinator's attempt.

```text
node manual-claude.mjs --run NEW_MANIFEST
```

This requires an interactive ordinary terminal and a human `SEND-ONCE` response.
There is no unattended flag, piped confirmation, implicit retry, or provider fallback.
It is not designed for execution inside an existing Claude conversation; nesting
guards are preserved. A valid JSON file alone grants no authority.

After confirmation it atomically claims the local attempt directory, rechecks pins,
verifies CLI version and first-party Max readiness, and starts exactly one native
process with the verified packet on stdin. It uses an empty working directory,
safe mode, empty tools/MCP, no persisted session, no slash commands/Chrome, no
permission bypass, retry/fallback suppression, configured output cap, and an
additional estimated $1 guard. The estimated guard can overshoot and is **not** a
hard billing ceiling. Included-only billing depends on the verified account setting.
Auth metadata does not establish that setting or privacy policy. Only four readiness
fields are retained; raw auth output and account identifiers are never printed/saved.

The review has a 600-second local deadline plus up to five seconds for cleanup.
Only the child process started by the helper is terminated. Existing sessions are
untouched. This does not prove remote cancellation, OS isolation, complete hidden
token accounting, or absence of undisclosed provider requests. Killing the supervisor
itself or a machine crash can leave an uncertain child; the durable claim prevents
an ordinary repeat. Never remove it to retry an uncertain attempt.

## Results and failures

Evidence is retained under the manifest's run directory: `attempt.json`, filtered
`preflight.json`, `invocation.json`, raw `response.jsonl` and `stderr.txt`,
`execution.json`, and `result.json` (or `held.json` on setup/capture failure).
Capture is bounded to 8 MiB combined; overflow stops the child and holds the result.
Private file modes are requested on POSIX; Windows ACLs remain inherited from the
chosen parent directory. Review raw files locally before sharing them.

Only a complete exit-zero response with the selected model, empty tools/MCP, one
reported assistant request, one successful final result and usage evidence becomes
`captured` and produces `review.txt`. Unknown output shapes, hooks/tools, multiple
reported requests, changed identity, malformed/incomplete output, timeout and
process errors become `held`. `captured` means ready for coordinator inspection;
it does not approve findings, open a gate, or attest provider internals. Unexpected
new CLI output shapes require inspection, not relaxation of checks to obtain green.

Metadata failure may consume the local claim before any review request. It remains
held for reconciliation rather than silently retried. Nothing here edits the active
goal or publishes a review. The operator returns evidence to its existing coordinator.

## Validation and scope

Run `node --test` from `pi-package/`. Tests use synthetic child processes without
network inference: exact stdin, replay refusal, malformed/untrusted output, identity
and tool changes, nonzero exit, bounded capture, timeout, unrelated-process survival,
and no-send inspection. These are local mechanics tests, not provider acceptance or
proof that the manual exception has been approved. `--check` also does not contact
the provider. Actual review closure requires a real response and coordinator triage.

The package extension and its slash commands are unchanged. Delete this additive
directory only after preserving any needed evidence to remove the helper; no policy,
auth, session, model configuration, or goal rollback is needed.

Control references: [Claude CLI](https://code.claude.com/docs/en/cli-reference),
[environment variables](https://code.claude.com/docs/en/env-vars),
[data handling](https://code.claude.com/docs/en/data-usage),
[usage credits](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans).
