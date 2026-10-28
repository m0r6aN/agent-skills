# Offline direct-review preparation

Status: **draft preparation, not an execution adapter, approval receipt, or review**.

The owner authorized local deterministic preparation in the 2026-10-19 autonomy directive. This narrow specification exercises a future direct Anthropic Messages sender's failure behavior without opening a provider route. It does not renew SA4, approve SA4-R1 R2, consume a review, or alter canonical Foreman code.

## Objective and boundaries

Prepare a minimal single-POST Node transport core, structured review validator, durable attempt evidence, and meaningful loopback fixtures. The public function is `runOfflineReview`; it accepts only `http://127.0.0.1:<explicit port>/v1/messages` and a synthetic account-binding reference. No HTTPS/live export, provider SDK, credential lookup, caller headers, redirect, retry, continuation, or command-line sender exists. A future separately reviewed integration must connect the same transport shape to `node:https.request` only after authentic Runtime admission and accounting reservation. No JSON object in this prototype represents or authenticates Runtime authority.

## Contract

- Bind exact UTF-8 JSON request bytes and SHA-256, pinned model, packet SHA-256, account/workspace/credential **reference**, synthetic review subject, deadline and capture bound before dispatch. Only streaming, no-tools Messages-shaped fixtures are accepted.
- Claim the attempt ID with exclusive file creation, flush the claim, record exact body and a durable send-intent marker before constructing a request. Repeated claims never send, including after a failed/unknown attempt. Local process crashes preserve a claim; automatic recovery never releases it.
- Use one direct POST with explicit content length. Capture bounded response bytes incrementally; retain filtered response metadata, message ID/model/stop reason and usage evidence. Absolute elapsed deadline stops the owned local request; it does not prove remote cancellation.
- A complete SSE stream must have one message start, ordered content blocks, message delta and message stop. Missing/truncated/malformed output, tools, non-`end_turn` stop reasons, wrong model and over-limit usage fail. No content repair, fence stripping or continuation.
- Review text must be nontrivial, verdict must be `pass`, `revise` or `blocked`, findings must be structured, and reviewer-declared packet/model provenance must match the request. The sender also attaches exact-body and transport provenance. Mechanical validation does not establish review quality or independent identity.
- A response called `complete` means a synthetically complete review result, never passed review. `revise` and `blocked` remain distinct substantive verdicts.
- Usage from the mock server is labelled **fixture-reported**, single-response, never billed/measured provider usage. Stream cumulative counters are merged, not summed. Failed and ambiguous attempts preserve whatever usage was observed, with uncertainty stated. No dollar calculation or release of reservations exists here.

## Structure, commands, and style

`sender.mjs` contains the fixture-only library and pure validators. `sender.test.mjs` contains Node built-in tests; `README.md` documents the future integration and gaps. `.test-runs/` is disposable fixture output inside this directory, removed only after path validation. No package install is needed. Neighboring Foreman tests use `.test.mjs`; this isolated package uses the installed Node test runner:

```powershell
node --test plugins/foreman-line/docs/goals/pantheon-incarnation-v0/autonomy-20261019/prototypes/direct-review/sender.test.mjs
```

Use explicit named functions, stable reason codes, built-in modules, and no logging of request content or response content. An assertion uses a code, e.g. `assert.equal(result.code, 'HTTP_429')`, never a provider error string that could contain sensitive data.

## Ordered preparation tasks

1. Write tests for boundary refusal, one exact POST, structured result and duplicate claim; run them red. Implement minimal core and run green.
2. Add transport/SSE failure and accounting tests (redirects, rate limit, server errors, drop, truncation, missing output, max tokens, cap, timeout); run and repair only this prototype.
3. Document observed test counts and limitations; record source hashes and Node version in an offline verification record. No production/live qualification claims.

## Acceptance and deferred work

Tests must verify observed server request counts, durable evidence, exact bytes, no automatic replay, complete structured output, scope-labelled usage, and no credential exposure. Live TLS, account qualification, authentic Runtime decisions/revocation/fencing, shared reservations, provider semantics and independent adversarial review remain **unverified and required before promotion**. This local claim is not a multi-machine lease, distributed transaction, or provider idempotency guarantee. Do not copy a fixture receipt into a production acceptance chain.
