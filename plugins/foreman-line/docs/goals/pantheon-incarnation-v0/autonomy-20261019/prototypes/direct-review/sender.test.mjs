import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sender from './sender.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '.test-runs');
const sha = value => createHash('sha256').update(value).digest('hex');
const model = 'fixture-model-not-a-provider-entitlement';
const packetSha256 = sha('synthetic review packet, no historical review content');
const requestBody = JSON.stringify({ model, max_tokens: 4096, stream: true, tools: [],
  messages: [{ role: 'user', content: 'Review the synthetic fixture.' }] });

function review(overrides = {}) {
  return { schemaVersion: 1, verdict: 'pass',
    reviewText: 'I checked the synthetic change against its stated boundary and inspected the supplied acceptance examples. The example preserves isolated ownership and retains durable evidence for failed dispatches. No blocking finding was identified in this fixture.',
    findings: [], provenance: { packetSha256, model }, ...overrides };
}

function event(type, value) { return `event: ${type}\ndata: ${JSON.stringify({ type, ...value })}\n\n`; }
function stream(value = review(), options = {}) {
  return event('message_start', { message: { id: 'msg_fixture_1', model: options.model ?? model,
    type: 'message', role: 'assistant', content: [], usage: { input_tokens: 91, output_tokens: 1 } } }) +
    event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }) +
    event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: typeof value === 'string' ? value : JSON.stringify(value) } }) +
    event('content_block_stop', { index: 0 }) +
    event('message_delta', { delta: { stop_reason: options.stopReason ?? 'end_turn' }, usage: { output_tokens: options.outputTokens ?? 210 } }) +
    (options.omitStop ? '' : event('message_stop', {}));
}

async function fixture(t, responder = (_req, res) => {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'request-id': 'req_fixture_1' }); res.end(stream());
}) {
  await mkdir(root, { recursive: true });
  const attemptsDir = await mkdtemp(path.join(root, 'case-'));
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => { requests.push({ method: req.method, url: req.url, headers: req.headers,
      body: Buffer.concat(chunks).toString('utf8') }); responder(req, res); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    assert.ok(path.resolve(attemptsDir).startsWith(path.resolve(root) + path.sep));
    await rm(attemptsDir, { recursive: true, force: true });
  });
  const options = { attemptsDir, attemptId: 'fixture-attempt-1',
    fixtureEndpoint: `http://127.0.0.1:${server.address().port}/v1/messages`,
    requestBody, expectedRequestSha256: sha(requestBody), model, packetSha256,
    accountBinding: { provider: 'offline-fixture', organizationRef: 'fixture-org',
      workspaceRef: 'fixture-workspace', credentialRef: 'fixture-sentinel' },
    deadlineMs: 1000, maxCaptureBytes: 65536 };
  return { options, requests, server };
}

async function evidence(options, name) {
  return readFile(path.join(options.attemptsDir, options.attemptId, name), 'utf8');
}

test('only offline entry point exists and external/HTTPS/hostname routes are rejected', async t => {
  assert.deepEqual(Object.keys(sender).sort(), ['runOfflineReview', 'validateReview']);
  const f = await fixture(t);
  for (const fixtureEndpoint of ['https://api.anthropic.com/v1/messages', 'http://example.com:80/v1/messages',
    'http://localhost:4000/v1/messages', 'https://127.0.0.1:4000/v1/messages', 'http://127.0.0.1:4000/other']) {
    await assert.rejects(sender.runOfflineReview({ ...f.options, fixtureEndpoint }), { message: 'OFFLINE_ENDPOINT_REQUIRED' });
  }
  assert.equal(f.requests.length, 0);
});

test('one exact POST yields a structured complete review with durable bounded evidence', async t => {
  const f = await fixture(t);
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.status, 'complete');
  assert.equal(result.review.verdict, 'pass');
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].method, 'POST');
  assert.equal(f.requests[0].body, requestBody);
  assert.equal(Number(f.requests[0].headers['content-length']), Buffer.byteLength(requestBody));
  assert.equal(result.provenance.requestSha256, sha(requestBody));
  assert.deepEqual(result.provenance.accountBinding, f.options.accountBinding);
  assert.equal(await evidence(f.options, 'request.body.json'), requestBody);
  assert.equal(JSON.parse(await evidence(f.options, 'claim.json')).attemptId, f.options.attemptId);
  assert.equal(JSON.parse(await evidence(f.options, 'send-intent.json')).maximumRequests, 1);
  assert.equal(JSON.parse(await evidence(f.options, 'result.json')).status, 'complete');
  assert.equal(sha(await evidence(f.options, 'response.raw')), result.capture.sha256);
});

test('a repeated durable attempt claim never sends again', async t => {
  const f = await fixture(t);
  await sender.runOfflineReview(f.options);
  await assert.rejects(sender.runOfflineReview(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 1);
});

test('exact-body and exact-model mismatch fail before sending', async t => {
  const f = await fixture(t);
  await assert.rejects(sender.runOfflineReview({ ...f.options, expectedRequestSha256: sha('other') }),
    { message: 'REQUEST_BINDING_MISMATCH' });
  await assert.rejects(sender.runOfflineReview({ ...f.options, model: 'different-model' }),
    { message: 'REQUEST_BINDING_MISMATCH' });
  assert.equal(f.requests.length, 0);
});

for (const status of [301, 302, 307, 308, 429, 500, 503]) {
  test(`HTTP ${status} is one failed attempt with no redirect or retry`, async t => {
    const f = await fixture(t, (_req, res) => {
      res.writeHead(status, { location: 'http://127.0.0.1:9/never-follow', 'retry-after': '0',
        'content-type': 'application/json' }); res.end('{"error":"fixture error"}');
    });
    const result = await sender.runOfflineReview(f.options);
    assert.equal(result.status, 'failed');
    assert.equal(result.code, `HTTP_${status}`);
    assert.equal(result.review, null);
    assert.equal(result.transport.replayAllowed, false);
    await assert.rejects(sender.runOfflineReview(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
    assert.equal(f.requests.length, 1);
  });
}

test('dropped connection preserves uncertain delivery and prohibits replay', async t => {
  const f = await fixture(t, req => req.socket.destroy());
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.code, 'CONNECTION_FAILED');
  assert.equal(result.transport.remoteCompletion, 'unknown-or-failed');
  assert.equal(result.accounting.reportedUsage, null);
  await assert.rejects(sender.runOfflineReview(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 1);
});

test('truncated HTTP response fails even if captured content has a review', async t => {
  const f = await fixture(t, (_req, res) => {
    const body = stream();
    res.writeHead(200, { 'content-type': 'text/event-stream', 'content-length': Buffer.byteLength(body) + 20 });
    res.write(body); res.socket.end();
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.code, 'RESPONSE_TRUNCATED');
  assert.equal(result.review, null);
  assert.equal(result.accounting.usageFinal, false);
  assert.equal(result.capture.complete, false);
  assert.equal(f.requests.length, 1);
});

const streamFailures = [
  ['missing terminal message_stop', () => stream(review(), { omitStop: true }), 'SSE_TRUNCATED'],
  ['empty review text', () => stream(''), 'REVIEW_EMPTY'],
  ['malformed event JSON', () => 'event: message_start\ndata: {bad}\n\n', 'SSE_MALFORMED'],
  ['malformed review JSON', () => stream('not JSON, do not repair this output'), 'REVIEW_JSON_INVALID'],
  ['max_tokens output exhaustion', () => stream(review(), { stopReason: 'max_tokens' }), 'OUTPUT_LIMIT_REACHED'],
  ['pause_turn continuation request', () => stream(review(), { stopReason: 'pause_turn' }), 'STOP_REASON_INCOMPLETE'],
  ['wrong returned model', () => stream(review(), { model: 'wrong-model' }), 'RESPONSE_MODEL_MISMATCH'],
  ['reported output above request allowance', () => stream(review(), { outputTokens: 4097 }), 'OUTPUT_USAGE_EXCEEDS_REQUEST'],
  ['review text absent', () => stream(review({ reviewText: '' })), 'REVIEW_CONTRACT_INVALID'],
  ['verdict absent', () => stream(review({ verdict: undefined })), 'REVIEW_CONTRACT_INVALID'],
  ['findings absent', () => stream(review({ findings: undefined })), 'REVIEW_CONTRACT_INVALID'],
  ['provenance mismatch', () => stream(review({ provenance: { packetSha256: sha('wrong'), model } })), 'REVIEW_PROVENANCE_MISMATCH'],
  ['provider stream error', () => event('error', { error: { type: 'overloaded_error' } }), 'PROVIDER_STREAM_ERROR'],
  ['events after message stop', () => stream() + event('ping', {}), 'SSE_AFTER_STOP'],
  ['missing SSE frame terminator', () => stream().trimEnd(), 'SSE_TRUNCATED'],
];
for (const [name, makeStream, code] of streamFailures) {
  test(`${name} is a failed attempt, never a passed review`, async t => {
    const f = await fixture(t, (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(makeStream());
    });
    const result = await sender.runOfflineReview(f.options);
    assert.equal(result.status, 'failed');
    assert.equal(result.code, code);
    assert.equal(result.review, null);
    assert.equal(result.transport.replayAllowed, false);
    assert.equal(f.requests.length, 1);
  });
}

test('absolute deadline aborts only the owned request and retains consumed claim', async t => {
  const f = await fixture(t, () => {});
  const result = await sender.runOfflineReview({ ...f.options, deadlineMs: 80 });
  assert.equal(result.code, 'DEADLINE_EXCEEDED');
  assert.equal(result.transport.remoteCompletion, 'unknown-or-failed');
  await assert.rejects(sender.runOfflineReview(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 1);
});

test('response capture stops exactly at its bound and retains the captured prefix', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end('x'.repeat(2048));
  });
  const result = await sender.runOfflineReview({ ...f.options, maxCaptureBytes: 1024 });
  assert.equal(result.code, 'CAPTURE_LIMIT_EXCEEDED');
  assert.equal(result.capture.bytes, 1024);
  assert.equal(Buffer.byteLength(await evidence(f.options, 'response.raw')), 1024);
  assert.equal(result.capture.complete, false);
  assert.equal(f.requests.length, 1);
});

test('cumulative stream usage is merged once, remains fixture scoped and has no invented billing', async t => {
  const f = await fixture(t, (_req, res) => {
    const payload = stream().replace(event('message_stop', {}),
      event('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 230 } }) + event('message_stop', {}));
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(payload);
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.accounting.reportedUsage.input_tokens, 91);
  assert.equal(result.accounting.reportedUsage.output_tokens, 230);
  assert.equal(result.accounting.source, 'fixture-reported');
  assert.equal(result.accounting.scope, 'one-response-only');
  assert.equal(result.accounting.usageFinal, true);
  for (const key of ['locallyEstimatedUsage', 'preflightEstimate', 'reservedBudget', 'billedCost']) {
    assert.equal(result.accounting[key], null);
  }
  assert.equal(result.provenance.runtimeDecision, null);
});

test('usage reported before an incomplete stream remains available as partial evidence', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(stream(review(), { omitStop: true }));
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.accounting.reportedUsage.output_tokens, 210);
  assert.equal(result.accounting.usageFinal, false);
});

test('concurrent claim race has exactly one winner and one server-observed request', async t => {
  const f = await fixture(t);
  const results = await Promise.allSettled([sender.runOfflineReview(f.options), sender.runOfflineReview(f.options)]);
  assert.equal(results.filter(value => value.status === 'fulfilled').length, 1);
  assert.equal(results.find(value => value.status === 'rejected').reason.message, 'ATTEMPT_ALREADY_CLAIMED');
  assert.equal(f.requests.length, 1);
});

test('a crashed process claim without a result remains blocked', async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.options.attemptsDir, f.options.attemptId));
  await writeFile(path.join(f.options.attemptsDir, f.options.attemptId, 'claim.json'), '{"state":"claimed"}');
  await assert.rejects(sender.runOfflineReview(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 0);
});

test('credential/header/permit inputs are refused without echoing their values', async t => {
  const f = await fixture(t);
  const fakeSecret = 'FAKE_CREDENTIAL_TEST_VALUE_NEVER_REAL';
  for (const extra of [{ apiKey: fakeSecret }, { headers: { 'x-api-key': fakeSecret } },
    { permit: { decision: 'allow', signature: fakeSecret } }]) {
    await assert.rejects(sender.runOfflineReview({ ...f.options, ...extra }), error => {
      assert.equal(error.message, 'INVALID_OPTIONS');
      assert.equal(String(error.stack).includes(fakeSecret), false);
      return true;
    });
  }
  assert.equal(f.requests.length, 0);
});

test('fixture credentials are fixed and ambient environment credentials are neither read nor captured', async t => {
  const f = await fixture(t);
  const prior = process.env.ANTHROPIC_API_KEY;
  const fakeSecret = 'FAKE_AMBIENT_TEST_VALUE_NEVER_REAL';
  process.env.ANTHROPIC_API_KEY = fakeSecret;
  try {
    const result = await sender.runOfflineReview(f.options);
    assert.equal(f.requests[0].headers['x-api-key'], 'OFFLINE_TEST_SENTINEL_NOT_A_SECRET');
    assert.equal(JSON.stringify(result).includes(fakeSecret), false);
    for (const file of await readdir(path.join(f.options.attemptsDir, f.options.attemptId))) {
      assert.equal((await evidence(f.options, file)).includes(fakeSecret), false);
    }
  } finally {
    if (prior === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prior;
  }
});

test('a substantive revise verdict is complete but cannot be mistaken for pass', async t => {
  const finding = { id: 'F1', severity: 'P1', summary: 'The fixture lacks a revocation check.',
    evidence: 'The supplied synthetic dispatch contains no revocation decision field.',
    recommendation: 'Add the admission decision and reject revoked authority before execution.' };
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(stream(review({ verdict: 'revise', findings: [finding] })));
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.status, 'complete');
  assert.equal(result.review.verdict, 'revise');
  assert.equal(result.review.findings[0].id, 'F1');
  assert.throws(() => sender.validateReview(review({ findings: [finding] }), { model, packetSha256 }),
    { message: 'REVIEW_VERDICT_INCONSISTENT' });
});

const malformedStreams = [
  ['non-assistant message role', source => source.replace('"role":"assistant"', '"role":"user"'), 'MESSAGE_START_INVALID'],
  ['tool-use content', source => source.replace('"type":"text","text":""', '"type":"tool_use","id":"tool_1"'), 'CONTENT_BLOCK_INVALID'],
  ['decreasing cumulative usage', source => source.replace('"output_tokens":210', '"output_tokens":0'), 'USAGE_INVALID'],
  ['changed terminal stop reason', source => source.replace(event('message_stop', {}),
    event('message_delta', { delta: { stop_reason: 'max_tokens' } }) + event('message_stop', {})), 'STOP_REASON_CONFLICT'],
];
for (const [name, change, code] of malformedStreams) {
  test(`${name} is rejected and is never final usage evidence`, async t => {
    const f = await fixture(t, (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(change(stream()));
    });
    const result = await sender.runOfflineReview(f.options);
    assert.equal(result.code, code);
    assert.equal(result.review, null);
    assert.equal(result.accounting.usageFinal, false);
  });
}

test('missing usage remains unknown even when the review is structurally complete', async t => {
  const f = await fixture(t, (_req, res) => {
    const body = stream().replace(',"usage":{"input_tokens":91,"output_tokens":1}', '')
      .replace(',"usage":{"output_tokens":210}', '');
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(body);
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.status, 'complete');
  assert.equal(result.accounting.reportedUsage, null);
  assert.equal(result.accounting.usageFinal, false);
});

test('wrong content type cannot become a completed review', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(stream());
  });
  const result = await sender.runOfflineReview(f.options);
  assert.equal(result.code, 'RESPONSE_CONTENT_TYPE_INVALID');
  assert.equal(result.review, null);
  assert.equal(result.accounting.usageFinal, false);
});

test('input credentials and nonfixture account binding are refused before a claim', async t => {
  const f = await fixture(t);
  await assert.rejects(sender.runOfflineReview({ ...f.options,
    accountBinding: { ...f.options.accountBinding, provider: 'anthropic' } }), { message: 'OFFLINE_ACCOUNT_REQUIRED' });
  const body = JSON.stringify({ ...JSON.parse(requestBody), tools: [{ name: 'exec' }] });
  await assert.rejects(sender.runOfflineReview({ ...f.options, requestBody: body, expectedRequestSha256: sha(body) }),
    { message: 'REQUEST_CONTRACT_INVALID' });
  assert.equal(f.requests.length, 0);
  assert.deepEqual(await readdir(f.options.attemptsDir), []);
});
