# Offline direct-review sender prototype

**Draft preparation only. 44 local deterministic tests passed on Node v24.7.0. No live provider request, paid validation, account qualification, independent review, Runtime admission, or historical review replay occurred.**

This is a small review-transport preparation artifact for the 2026-10-19 Pantheon operating-mandate package. It is outside the canonical execution adapter. The consumed review remains consumed, and SA4-R1 R2 remains unapproved. [SPEC.md](SPEC.md) defines its scope.

## What is executable now

From `D:/Repos/agent-skills`:

```powershell
node --test plugins/foreman-line/docs/goals/pantheon-incarnation-v0/autonomy-20261019/prototypes/direct-review/sender.test.mjs
```

Only Node built-ins are required. Fixtures bind a temporary numeric loopback port. Each fixture creates isolated evidence under `.test-runs/` and removes only its own verified child directory on completion. No package was installed. The final checked source hashes, environment and result are recorded in [verification.json](verification.json).

`sender.mjs` exports only `runOfflineReview` and `validateReview`. There is no command-line sender, live HTTPS factory, provider SDK, arbitrary transport injection export, credential input, credential discovery, environment lookup, OAuth refresh, or Runtime permit input. The private transport function uses the Node `http.request` / `https.request` callback shape, with a single `request.end(exactBytes)`; the only available binding is `http.request` to `http://127.0.0.1:<port>/v1/messages`. Hostnames, aliases, HTTPS, non-loopback endpoints, credentials in URLs, query parameters and alternate paths are refused before claiming an attempt. There are no redirects, retries, fallbacks or continuations.

This boundary intentionally makes a live Anthropic send unavailable. It is not a production sandbox against a person modifying the source or a malicious local service. Test bodies are synthetic and do not contain the historical review packet.

## Evidence and result contract

The caller provides exact JSON UTF-8 request bytes, their SHA-256, pinned fixture model, packet SHA-256, synthetic account/workspace/credential references, absolute deadline and capture bound. Body/model mismatch and nonempty tools are refused. The fixture `max_tokens` values and hard implementation guard are test settings, not current Anthropic capability claims or a recommended review size.

Before constructing the request, the library exclusively creates and flushes `claim.json`, writes the exact `request.body.json`, and flushes `send-intent.json`. Each response chunk is bounded and written to `response.raw`; the file is flushed before completion. `result.json` records status, stable error code, request/body/account binding, transport evidence, filtered headers, message/model/stop identifiers, capture hash and usage scope. Claims are never deleted or released by recovery. A duplicate claim is refused even after failure, crash or success. A claim without a terminal result requires investigation; it does not authorize replay.

The response must be a complete SSE Messages-shaped stream. Unexpected tool blocks, invalid event order, truncated transport/stream, inconsistent stop reasons, wrong model, malformed JSON, output exhaustion and reported output above the request allowance fail. The review text contains **only** this JSON object, with no fence stripping or content repair:

```json
{
  "schemaVersion": 1,
  "verdict": "revise",
  "reviewText": "A substantive explanation of what was examined and why the verdict follows; the implementation requires at least 120 characters.",
  "findings": [
    {
      "id": "F1",
      "severity": "P1",
      "summary": "A concise actionable finding.",
      "evidence": "Specific source location or acceptance evidence supporting the finding.",
      "recommendation": "A concrete change or verification that would close the finding."
    }
  ],
  "provenance": {
    "packetSha256": "the exact 64-character lowercase digest supplied in the request contract",
    "model": "the exact pinned model"
  }
}
```

Verdicts are `pass`, `revise`, or `blocked`. Non-pass verdicts require findings; pass cannot coexist with P0/P1 findings. A complete `revise` result is usable review output, not a passed review. Empty/incomplete output is a failed attempt. The text-length and field checks are a mechanical completeness floor; they do not prove substantive reasoning, reviewer independence, correct findings, current model capability or trustworthy provenance. The future Runtime-controlled reviewer identity and a source-backed closure check must supply those properties.

The old frozen request is not automatically compatible with this new result contract. A ratified execution parcel must prepare a new exact request contract and hash, including the requested structured output, without mutating or replaying old attempt evidence.

## Accounting and ambiguity

Usage is explicitly `fixture-reported`, scoped to `one-response-only`. Cumulative output usage updates replace earlier counters rather than being summed. Missing usage remains unknown; partial usage is retained on incomplete streams; invalid or conflicting streams cannot produce final usage. `preflightEstimate`, `reservedBudget`, `locallyEstimatedUsage`, and `billedCost` remain distinct null fields because this prototype has no evidence for them. No estimate is labelled measured usage, and no dollar ceiling is claimed.

An absolute timer destroys only this attempt's local request. A timeout, connection loss, truncated capture or absent result leaves remote completion unknown and replay disallowed. Local abort is not remote cancellation evidence. For live execution, hold the conservative reservation until reconciliation; do not create a replacement attempt merely because delivery or billing is uncertain.

## Required promotion work

| Missing component | Concrete failure it prevents | Required automatic mechanism |
|---|---|---|
| Runtime admission integration | Coordinator invents authority or dispatches after revocation | Authenticate the real Runtime decision; bind principal, goal, action, resource digest, account, host, limits, expiry and current fence epoch before any worker/provider effect. Arbitrary JSON is never a permit. |
| Transactional dispatch and accounting ledger | Concurrent owners overspend or rename an uncertain attempt to resend | Atomically reserve budget and claim the stable logical dispatch identity under the current coordinator fence; uniqueness must span callers/machines, not just a local filename. |
| Live transport binding and credential broker | Fixture success is treated as account qualification or secrets leak into audit records | Add a separately reviewed private `https.request` binding to the exact approved endpoint with normal TLS verification; resolve only the authorized named secret binding after admission; never emit key values; retain restricted encrypted/raw evidence and filtered metadata. |
| Account qualification | Wrong organization/workspace, unapproved terms or billing exposure | Verify the authorized account/workspace, entitlement, data terms and usable funding through supported account surfaces; record evidence references and freshness before reservation/send. Console authentication alone does not expose or qualify an API key. |
| Independent reviewer identity | Builder/coordinator grades its own expansion of authority | Runtime launches a bounded fresh reviewer identity/context with a distinct provenance chain; reviewer cannot grant authority. |
| Provider compatibility and live qualification | Draft SSE interpretation or output semantics diverge from the actual API | Pin current official request/response and pricing references; validate reasoning/output limits, usage/cache semantics, model identity, timeouts and one-send behavior in the newly ratified paid envelope. |
| Supervisor and storage guarantees | Stalled disk/JS event loop defeats deadline or crash loses intent | Use a trusted process supervisor and transactional ledger; retain authoritative intent before delivery. File fsync and a JS timer are not a hard real-time or power-loss guarantee. |
| Result acceptance and reconciliation | Structurally complete but wrong review passes, or unknown cost is released | Require substantive independent findings/verdict/provenance plus evidence-backed closure; reconcile provider usage and billing separately; retain uncertain exposure. |

The local exclusive claim is a useful same-directory, same-ID duplicate guard. It is not a multi-host lease, provider idempotency key, path/symlink security boundary, protection against local administrator edits, or guarantee across copied directories, changed attempt IDs, volume rollback or power loss. File mode `0600` does not establish a Windows ACL. Those are reasons this code has no live factory. Durable result files are not signed Runtime receipts.

## Checked cases

The 44 tests cover external/live route refusal; exact single POST/body/hash/model and evidence; duplicate and concurrent claims; claim recovery after simulated process loss; 301/302/307/308, 429, 500 and 503; connection drop; HTTP and SSE truncation; missing/empty text, missing verdict/findings and bad provenance; malformed JSON; `max_tokens`, `pause_turn`, wrong model and excessive usage; in-stream error and trailing events; capture limit and absolute deadline; cumulative/partial/missing/invalid usage; credentials/headers/pretend-permit refusal without echo; ambient credential non-discovery; a substantive revise verdict; wrong role, tool blocks, changing stop reason and wrong content type.

Test success supports only these local fixture observations. It supplies no design verdict about Pantheon and no evidence that an Anthropic reviewer completed work.
