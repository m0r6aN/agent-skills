import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, mkdir, mkdtemp, rm, readdir, writeFile } from 'node:fs/promises';
import * as sender from './native-sender.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '.test-runs');
const sha = value => createHash('sha256').update(value).digest('hex');
const helperSha256 = sha(await readFile(path.join(here, 'native-sender.mjs')));
const model = 'claude-opus-5-5';
const fakeCredential = 'FIXTURE_ONLY_NOT_A_REAL_CREDENTIAL';
const body = JSON.stringify({ model, stream: true, max_tokens: 4096, tools: [],
  messages: [{ role: 'user', content: 'Review only this synthetic fixture.' }] });
const binding = { requestBody: body, expectedRequestSha256: sha(body), expectedHelperSha256: helperSha256,
  model, maxTokens: 4096, sourceHead: '64fb8949bf5134f96fda02df0d4f52ac291a6138',
  artifactManifestSha256: sha('synthetic artifact manifest'), accountBindingRef: 'fixture-account-reference' };
function review(overrides = {}) {
  return { reviewText: 'I inspected the synthetic fixture for bounded dispatch and durable evidence. The supplied test demonstrates a single request and preserves a claim after uncertain delivery. This is a fixture-only analysis, with external identity and source validation still required.',
    verdict: 'pass', findings: [], coverage: ['one-send behavior'], limitations: ['Synthetic fixture only.'], ...overrides };
}
const event = (type, fields = {}) => `event: ${type}\ndata: ${JSON.stringify({ type, ...fields })}\n\n`;
function stream(value = review(), options = {}) {
  return event('message_start', { message: { type: 'message', role: 'assistant', id: 'msg_fixture', model,
    content: [], usage: { input_tokens: 90, output_tokens: 1 } } }) +
    event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }) +
    event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: typeof value === 'string' ? value : JSON.stringify(value) } }) +
    event('content_block_stop', { index: 0 }) +
    event('message_delta', { delta: { stop_reason: options.stopReason ?? 'end_turn' }, usage: { output_tokens: options.tokens ?? 200 } }) +
    (options.truncated ? '' : event('message_stop'));
}
async function fixture(t, reply = (_req, res) => {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'request-id': 'req_fixture' }); res.end(stream());
}) {
  await mkdir(root, { recursive: true });
  const attemptsRoot = await mkdtemp(path.join(root, 'case-'));
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', value => chunks.push(value));
    req.on('end', () => { requests.push({ method: req.method, url: req.url, headers: req.headers,
      body: Buffer.concat(chunks).toString('utf8') }); reply(req, res); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    assert.ok(path.resolve(attemptsRoot).startsWith(path.resolve(root) + path.sep));
    await rm(attemptsRoot, { recursive: true, force: true });
  });
  return { requests, attemptsRoot, options: { ...binding, attemptsRoot, attemptId: 'fixture-1',
    fixtureEndpoint: `http://127.0.0.1:${server.address().port}/v1/messages`, fakeCredential,
    deadlineMs: 3000, idleMs: 1500, maxCaptureBytes: 65536, requiredCoverage: ['one-send behavior'] } };
}
const artifact = (f, name) => readFile(path.join(f.attemptsRoot, 'fixture-1', name), 'utf8');

test('live command is data only with fixed endpoint, no credential and bounded native argv', () => {
  assert.deepEqual(Object.keys(sender).sort(), ['describeLiveCommand', 'inspectNativeCapture', 'runOfflineFixture', 'validateReviewPayload']);
  const descriptor = sender.describeLiveCommand({ ...binding,
    requestFile: path.join(here, 'request.body.json'), rawOutputFile: path.join(here, 'response.raw') });
  assert.equal(descriptor.executable, 'C:\\Windows\\System32\\curl.exe');
  assert.equal(descriptor.argv[0], '--disable');
  assert.equal(descriptor.argv[descriptor.argv.indexOf('--url') + 1], 'https://api.anthropic.com/v1/messages');
  for (const [key, value] of [['--retry', '0'], ['--max-redirs', '0'], ['--proto', '=https'],
    ['--connect-timeout', '30'], ['--max-time', '600'], ['--speed-time', '120'], ['--proxy', ''], ['--noproxy', '*']]) {
    assert.equal(descriptor.argv[descriptor.argv.indexOf(key) + 1], value);
  }
  assert.equal(descriptor.argv.includes('--location'), false);
  assert.equal(descriptor.argv.includes('--insecure'), false);
  assert.equal(JSON.stringify(descriptor).includes(fakeCredential), false);
  assert.equal(descriptor.mayExecute, false);
  assert.equal(descriptor.runtimeDecisionRef, null);
});

test('real pinned curl sends one exact POST and preserves durable evidence', async t => {
  const f = await fixture(t);
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].method, 'POST');
  assert.equal(f.requests[0].body, body);
  assert.equal(f.requests[0].headers['x-api-key'], fakeCredential);
  assert.equal(result.code, 'SEMANTIC_ACCEPTANCE_HELD');
  assert.equal(result.review.verdict, 'pass');
  assert.equal(result.reviewAccepted, false);
  assert.equal(result.provenance.providerRequestId, 'req_fixture');
  assert.equal(result.provenance.providerMessageId, 'msg_fixture');
  assert.equal(await artifact(f, 'request.body.json'), body);
  assert.equal(JSON.parse(await artifact(f, 'claim.json')).requestSha256, sha(body));
  assert.equal(JSON.parse(await artifact(f, 'send-intent.json')).maximumRequests, 1);
  assert.equal(sha(await artifact(f, 'response.raw')), result.capture.sha256);
});

test('no live/alias URL, real credential, arbitrary argv or source/body drift can execute', async t => {
  const f = await fixture(t);
  for (const change of [{ fixtureEndpoint: 'https://api.anthropic.com/v1/messages' },
    { fixtureEndpoint: 'http://localhost:3000/v1/messages' }, { fakeCredential: 'NOT_THE_FIXED_MARKER' },
    { argv: ['--location'] }, { expectedHelperSha256: sha('wrong') }, { expectedRequestSha256: sha('wrong') }]) {
    await assert.rejects(sender.runOfflineFixture({ ...f.options, ...change }));
  }
  assert.equal(f.requests.length, 0);
  assert.deepEqual(await readdir(f.attemptsRoot), []);
});

for (const status of [301, 302, 307, 308, 429, 500, 503]) {
  test(`native HTTP ${status} produces one failed attempt without redirect/retry`, async t => {
    const f = await fixture(t, (_req, res) => {
      res.writeHead(status, { location: 'http://127.0.0.1:9/do-not-follow', 'retry-after': '0',
        'content-type': 'application/json' }); res.end('{"error":"fixture failure"}');
    });
    const result = await sender.runOfflineFixture(f.options);
    assert.equal(result.code, `HTTP_${status}`);
    assert.equal(result.reviewAccepted, false);
    assert.equal(result.transport.redirects, 0);
    assert.equal(f.requests.length, 1);
    await assert.rejects(sender.runOfflineFixture(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
    assert.equal(f.requests.length, 1);
  });
}

test('connection drop retains uncertain delivery with no automatic retry', async t => {
  const f = await fixture(t, req => req.socket.destroy());
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.code, 'NATIVE_TRANSFER_FAILED');
  assert.equal(result.transport.delivery, 'unknown-or-failed');
  assert.equal(result.transport.remoteCancellationConfirmed, false);
  assert.equal(result.transport.replayAllowed, false);
  await assert.rejects(sender.runOfflineFixture(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 1);
});

test('truncated HTTP is failed even with a complete-looking SSE review', async t => {
  const f = await fixture(t, (_req, res) => {
    const payload = stream();
    res.writeHead(200, { 'content-type': 'text/event-stream', 'content-length': Buffer.byteLength(payload) + 100 });
    res.write(payload); res.socket.end();
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.code, 'HTTP_TRUNCATED');
  assert.equal(result.review, null);
  assert.equal(result.accounting.usageFinal, false);
  assert.equal(result.capture.complete, false);
  assert.equal(f.requests.length, 1);
});

test('absolute timeout terminates the owned curl and leaves delivery unknown', async t => {
  const f = await fixture(t, () => {});
  const result = await sender.runOfflineFixture({ ...f.options, deadlineMs: 120, idleMs: 1000 });
  assert.ok(['DEADLINE_EXCEEDED', 'NATIVE_TIMEOUT'].includes(result.code));
  assert.equal(result.transport.delivery, 'unknown-or-failed');
  assert.equal(result.transport.remoteCancellationConfirmed, false);
  assert.equal(result.reviewAccepted, false);
  // Native startup can consume the deadline; neither zero nor one observed delivery permits replay.
  assert.ok(f.requests.length <= 1);
  await assert.rejects(sender.runOfflineFixture(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
});

test('stream idle timeout terminates the owned curl without a replay', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.write(': initial data\n\n');
  });
  const result = await sender.runOfflineFixture({ ...f.options, deadlineMs: 2000, idleMs: 100 });
  assert.equal(result.code, 'IDLE_TIMEOUT');
  assert.equal(result.transport.replayAllowed, false);
  assert.equal(f.requests.length, 1);
});

test('unknown-length overflow preserves at most the fixed raw bound', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.write('x'.repeat(8192)); res.end();
  });
  const result = await sender.runOfflineFixture({ ...f.options, maxCaptureBytes: 1024 });
  assert.equal(result.code, 'CAPTURE_LIMIT_EXCEEDED');
  assert.ok(result.capture.bytes <= 1024);
  assert.equal(Buffer.byteLength(await artifact(f, 'response.raw')), result.capture.bytes);
  assert.equal(result.capture.complete, false);
  assert.equal(f.requests.length, 1);
});

test('declared Content-Length above the cap cannot bypass raw capture bound', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'content-length': 9000 }); res.end('x'.repeat(9000));
  });
  const result = await sender.runOfflineFixture({ ...f.options, maxCaptureBytes: 1024 });
  assert.equal(result.code, 'CAPTURE_LIMIT_EXCEEDED');
  assert.ok(result.capture.bytes <= 1024);
});

const streamFailures = [
  ['missing terminal event', () => stream(review(), { truncated: true }), 'SSE_TRUNCATED'],
  ['empty answer', () => stream(''), 'REVIEW_EMPTY'],
  ['malformed review JSON', () => stream('not review JSON'), 'REVIEW_JSON_INVALID'],
  ['max_tokens exhaustion', () => stream(review(), { stopReason: 'max_tokens' }), 'OUTPUT_LIMIT_REACHED'],
  ['output usage exceeding request', () => stream(review(), { tokens: 4097 }), 'OUTPUT_USAGE_EXCEEDS_REQUEST'],
  ['missing review text', () => stream(review({ reviewText: '' })), 'REVIEW_CONTRACT_INVALID'],
  ['old revise verdict', () => stream(review({ verdict: 'revise' })), 'REVIEW_CONTRACT_INVALID'],
  ['missing coverage', () => stream(review({ coverage: [] })), 'REVIEW_CONTRACT_INVALID'],
  ['missing limitations', () => stream(review({ limitations: undefined })), 'REVIEW_CONTRACT_INVALID'],
  ['missing findings', () => stream(review({ findings: undefined })), 'REVIEW_CONTRACT_INVALID'],
  ['wrong returned model', () => stream().replace(`"model":"${model}"`, '"model":"other"'), 'MODEL_MISMATCH'],
  ['provider stream error', () => event('error', { error: { type: 'overloaded_error' } }), 'PROVIDER_STREAM_ERROR'],
  ['decreasing cumulative usage', () => stream(review(), { tokens: 0 }), 'USAGE_INVALID'],
];
for (const [name, makeStream, expected] of streamFailures) {
  test(`${name} cannot yield an accepted or held substantive review`, async t => {
    const f = await fixture(t, (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(makeStream());
    });
    const result = await sender.runOfflineFixture(f.options);
    assert.equal(result.code, expected);
    assert.equal(result.status, 'failed');
    assert.equal(result.review, null);
    assert.equal(result.reviewAccepted, false);
    assert.equal(f.requests.length, 1);
  });
}

test('thinking-only content is never repurposed as a review or emitted in result', async t => {
  const hidden = 'SYNTHETIC_REASONING_MUST_NOT_ENTER_RESULT';
  const f = await fixture(t, (_req, res) => {
    const payload = stream(hidden).replace('"type":"text","text":""', '"type":"thinking","thinking":""')
      .replace('"type":"text_delta","text":', '"type":"thinking_delta","thinking":');
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(payload);
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.code, 'REVIEW_EMPTY');
  assert.equal(JSON.stringify(result).includes(hidden), false);
  assert.ok((await artifact(f, 'response.raw')).includes(hidden));
});

test('complete changes_required is useful held review and capture owns provenance', async t => {
  const finding = { id: 'R1', severity: 'high', claim: 'The synthetic source lacks a current revocation check.',
    evidence: ['fixture.mjs:12'], requiredChange: 'Check revocation before each effect begins.',
    acceptanceCheck: 'A revoked fixture decision must produce no worker action.' };
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'request-id': 'real_capture_id' });
    res.end(stream(review({ verdict: 'changes_required', findings: [finding], provenance: { providerRequestId: 'forged' } })));
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.status, 'held');
  assert.equal(result.review.verdict, 'changes_required');
  assert.equal(result.reviewAccepted, false);
  assert.equal(result.provenance.providerRequestId, 'real_capture_id');
  assert.equal(result.review.provenance, undefined);
  assert.equal(JSON.stringify(result).includes('forged'), false);
  assert.throws(() => sender.validateReviewPayload(review({ findings: [finding] }), ['one-send behavior']),
    { message: 'VERDICT_CONFLICT' });
});

test('cumulative usage is not summed and all accounting categories stay distinct', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(stream().replace(event('message_stop'), event('message_delta', {
      delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 220 } }) + event('message_stop')));
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.accounting.reportedUsage.output_tokens, 220);
  assert.equal(result.accounting.reportedUsage.input_tokens, 90);
  assert.equal(result.accounting.source, 'fixture-reported');
  assert.equal(result.accounting.scope, 'one-response-cumulative-snapshots');
  assert.equal(result.accounting.usageFinal, true);
  for (const key of ['preflightEstimate', 'reservedBudget', 'locallyEstimatedUsage', 'providerReportedUsage', 'billedCost']) {
    assert.equal(result.accounting[key], null);
  }
});

test('missing usage remains unknown and partial usage cannot be finalized', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(stream().replace(',"usage":{"input_tokens":90,"output_tokens":1}', '')
      .replace(',"usage":{"output_tokens":200}', ''));
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.status, 'held');
  assert.equal(result.accounting.reportedUsage, null);
  assert.equal(result.accounting.usageFinal, false);
});

test('concurrent attempt claim permits exactly one native invocation', async t => {
  const f = await fixture(t);
  const results = await Promise.allSettled([sender.runOfflineFixture(f.options), sender.runOfflineFixture(f.options)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.message, 'ATTEMPT_ALREADY_CLAIMED');
  assert.equal(f.requests.length, 1);
});

test('crash claim with no result cannot be reused', async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.attemptsRoot, 'fixture-1'));
  await writeFile(path.join(f.attemptsRoot, 'fixture-1', 'claim.json'), '{"state":"claimed"}');
  await assert.rejects(sender.runOfflineFixture(f.options), { message: 'ATTEMPT_ALREADY_CLAIMED' });
  assert.equal(f.requests.length, 0);
});

test('argv/config injection and unsafe parameter bounds are refused without echo', async t => {
  const f = await fixture(t);
  for (const change of [{ fakeCredential: 'FAKE\nurl="https://example.invalid"' },
    { fakeCredential: 'FAKE"\\nconfig="other"' }, { attemptId: '../escape' },
    { attemptsRoot: path.join(here, 'bad\nname') }, { deadlineMs: 600001 }, { idleMs: 120001 },
    { maxCaptureBytes: 2097153 }, { requiredCoverage: Array(101).fill('focus') },
    { requiredCoverage: ['x'.repeat(2001)] }, { argv: ['--insecure'] }, { apiKey: 'DUMMY_NEVER_REAL' }]) {
    await assert.rejects(sender.runOfflineFixture({ ...f.options, ...change }), error => {
      assert.equal(error.message.includes('DUMMY_NEVER_REAL'), false);
      assert.equal(error.message.includes('example.invalid'), false);
      return true;
    });
  }
  assert.throws(() => sender.describeLiveCommand({ ...binding,
    requestFile: path.join(here, 'bad\nname'), rawOutputFile: path.join(here, 'response.raw') }), { message: 'PATH_REFUSED' });
  assert.equal(f.requests.length, 0);
});

test('ambient proxy, credential and curl configuration are not inherited', async t => {
  const f = await fixture(t);
  let proxyRequests = 0;
  const proxy = http.createServer((_req, res) => { proxyRequests++; res.writeHead(502); res.end(); });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  t.after(async () => { proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); });
  const proxyUrl = `http://127.0.0.1:${proxy.address().port}`;
  const configDir = path.join(f.attemptsRoot, 'ambient');
  await mkdir(configDir);
  await writeFile(path.join(configDir, '.curlrc'), `url = "${proxyUrl}/must-not-execute"\n`);
  await writeFile(path.join(configDir, '_curlrc'), `url = "${proxyUrl}/must-not-execute"\n`);
  const optionFile = path.join(f.attemptsRoot, 'options.json');
  await writeFile(optionFile, JSON.stringify(f.options));
  const childSource = 'const fs = await import("node:fs/promises"); const {pathToFileURL} = await import("node:url"); const api = await import(pathToFileURL(process.argv[1])); const result = await api.runOfflineFixture(JSON.parse(await fs.readFile(process.argv[2], "utf8"))); process.stdout.write(JSON.stringify(result));';
  // Literal fake-only environment avoids reading any existing real credential even in the test.
  const child = spawn(process.execPath, ['--input-type=module', '-e', childSource,
    path.join(here, 'native-sender.mjs'), optionFile], { shell: false, windowsHide: true,
    env: { SystemRoot: 'C:\\Windows', ANTHROPIC_API_KEY: 'FAKE_AMBIENT_NOT_REAL', HTTP_PROXY: proxyUrl,
      HTTPS_PROXY: proxyUrl, ALL_PROXY: proxyUrl, CURL_HOME: configDir, HOME: configDir } });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const exitCode = await new Promise(resolve => child.on('close', resolve));
  assert.equal(exitCode, 0, stderr);
  assert.equal(JSON.parse(stdout).status, 'held');
  assert.equal(stdout.includes('FAKE_AMBIENT_NOT_REAL'), false);
  assert.equal(stdout.includes(fakeCredential), false);
  assert.equal(stderr, '');
  assert.equal(proxyRequests, 0);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].headers['x-api-key'], fakeCredential);
  assert.equal((await artifact(f, 'command.json')).includes(fakeCredential), false);
});

test('an incomplete stream retains observed usage but never marks it final', async t => {
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(stream(review(), { truncated: true }));
  });
  const result = await sender.runOfflineFixture(f.options);
  assert.equal(result.accounting.reportedUsage.output_tokens, 200);
  assert.equal(result.accounting.usageFinal, false);
  assert.equal(result.transport.delivery, 'unknown-or-failed');
});

test('tool-use, invalid SSE order and contradictory terminal reasons cannot be accepted', async t => {
  const variations = [
    stream().replace('"type":"text","text":""', '"type":"tool_use","id":"tool1"'),
    event('message_stop') + stream(),
    stream().replace(event('message_stop'), event('message_delta', { delta: { stop_reason: 'max_tokens' } }) + event('message_stop')),
    stream() + event('ping'),
  ];
  let current = 0;
  const f = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(variations[current++]);
  });
  for (let i = 0; i < variations.length; i++) {
    const result = await sender.runOfflineFixture({ ...f.options, attemptId: `variation-${i}` });
    assert.equal(result.status, 'failed');
    assert.equal(result.reviewAccepted, false);
    assert.equal(result.accounting.usageFinal, false);
  }
  assert.equal(f.requests.length, 4); // Four explicitly distinct fixture intents, never retry.
});

test('pure capture parser validates its Buffer bound and expected arguments', () => {
  const expected = { model, maxTokens: 4096, requiredCoverage: ['one-send behavior'] };
  assert.throws(() => sender.inspectNativeCapture('not a Buffer', expected), { message: 'RAW_CAPTURE_REFUSED' });
  assert.throws(() => sender.inspectNativeCapture(Buffer.alloc(2097153), expected), { message: 'RAW_CAPTURE_REFUSED' });
  for (const change of [{ model: 'unknown-model' }, { maxTokens: 0 }, { maxTokens: 65537 },
    { requiredCoverage: [] }, { requiredCoverage: [''] }, { extra: true }]) {
    assert.throws(() => sender.inspectNativeCapture(Buffer.alloc(0), { ...expected, ...change }));
  }
  const malformed = sender.inspectNativeCapture(Buffer.from('malformed HTTP capture'), expected);
  assert.equal(malformed.error, 'HTTP_HEADERS_INCOMPLETE');
  assert.equal(malformed.semanticStatus, 'failed');
  assert.equal(malformed.reviewAccepted, false);
  const httpError = sender.inspectNativeCapture(Buffer.from('HTTP/1.1 500 Internal Server Error\r\ncontent-type: text/event-stream\r\n\r\n' + stream()), expected);
  assert.equal(httpError.httpStatus, 500);
  assert.equal(httpError.error, 'HTTP_500');
  assert.equal(httpError.semanticStatus, 'failed');
});

test('pure parser reuses actual native raw capture and keeps structural output held', async t => {
  const f = await fixture(t);
  await sender.runOfflineFixture(f.options);
  const raw = await readFile(path.join(f.attemptsRoot, 'fixture-1', 'response.raw'));
  const parsed = sender.inspectNativeCapture(raw, { model, maxTokens: 4096, requiredCoverage: ['one-send behavior'] });
  assert.equal(parsed.semanticStatus, 'held');
  assert.equal(parsed.reviewAccepted, false);
  assert.equal(parsed.requestId, 'req_fixture');
  assert.equal(parsed.messageId, 'msg_fixture');
  assert.equal(parsed.rawSha256, sha(raw));
  assert.equal(parsed.review.verdict, 'pass');
});
