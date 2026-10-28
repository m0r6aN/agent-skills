// OFFLINE PREPARATION ONLY. No live factory, CLI, credentials or Runtime authority.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fail = code => { throw new Error(code); };
const substantive = (value, minimum) => typeof value === 'string' && value.trim().length >= minimum;
const maxBytes = 2 * 1024 * 1024;

export function validateReview(value, expected) {
  if (!value || value.schemaVersion !== 1 || !substantive(value.reviewText, 120) ||
      !['pass', 'revise', 'blocked'].includes(value.verdict) || !Array.isArray(value.findings) ||
      value.findings.length > 100) fail('REVIEW_CONTRACT_INVALID');
  const ids = new Set();
  for (const finding of value.findings) {
    if (!finding || typeof finding.id !== 'string' || !/^[A-Za-z0-9-]{1,40}$/.test(finding.id) ||
        ids.has(finding.id) || !['P0', 'P1', 'P2', 'P3'].includes(finding.severity) ||
        !substantive(finding.summary, 15) || !substantive(finding.evidence, 20) ||
        !substantive(finding.recommendation, 15)) fail('REVIEW_CONTRACT_INVALID');
    ids.add(finding.id);
  }
  if ((value.verdict !== 'pass' && value.findings.length === 0) ||
      (value.verdict === 'pass' && value.findings.some(f => ['P0', 'P1'].includes(f.severity)))) {
    fail('REVIEW_VERDICT_INCONSISTENT');
  }
  if (!value.provenance || value.provenance.packetSha256 !== expected.packetSha256 ||
      value.provenance.model !== expected.model) fail('REVIEW_PROVENANCE_MISMATCH');
  return value;
}

function prepare(options) {
  const allowed = new Set(['attemptsDir', 'attemptId', 'fixtureEndpoint', 'requestBody',
    'expectedRequestSha256', 'model', 'packetSha256', 'accountBinding', 'deadlineMs', 'maxCaptureBytes']);
  if (!options || Object.keys(options).some(key => !allowed.has(key))) fail('INVALID_OPTIONS');
  let endpoint;
  try { endpoint = new URL(options.fixtureEndpoint); } catch { fail('OFFLINE_ENDPOINT_REQUIRED'); }
  // Exact textual numeric host prevents DNS, redirects, proxy credentials and URL normalisation aliases.
  if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}\/v1\/messages$/.test(options.fixtureEndpoint) ||
      endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || !endpoint.port) {
    fail('OFFLINE_ENDPOINT_REQUIRED');
  }
  if (typeof options.attemptsDir !== 'string' || !path.isAbsolute(options.attemptsDir) ||
      !/^[a-z0-9][a-z0-9-]{0,95}$/.test(options.attemptId) || !digest(options.packetSha256) ||
      typeof options.model !== 'string' || !/^[a-zA-Z0-9._-]{1,120}$/.test(options.model) ||
      !Number.isInteger(options.deadlineMs) || options.deadlineMs < 10 || options.deadlineMs > 600000 ||
      !Number.isInteger(options.maxCaptureBytes) || options.maxCaptureBytes < 256 || options.maxCaptureBytes > maxBytes) {
    fail('INVALID_OPTIONS');
  }
  const binding = options.accountBinding;
  if (!binding || Object.keys(binding).sort().join(',') !== 'credentialRef,organizationRef,provider,workspaceRef' ||
      binding.provider !== 'offline-fixture' || binding.credentialRef !== 'fixture-sentinel' ||
      !/^fixture-[a-z0-9-]{1,80}$/.test(binding.organizationRef) ||
      !/^fixture-[a-z0-9-]{1,80}$/.test(binding.workspaceRef)) fail('OFFLINE_ACCOUNT_REQUIRED');
  if (typeof options.requestBody !== 'string' || Buffer.byteLength(options.requestBody) > maxBytes ||
      hash(options.requestBody) !== options.expectedRequestSha256) fail('REQUEST_BINDING_MISMATCH');
  let body;
  try { body = JSON.parse(options.requestBody); } catch { fail('REQUEST_JSON_INVALID'); }
  if (body?.model !== options.model) fail('REQUEST_BINDING_MISMATCH');
  if (body.stream !== true || !Array.isArray(body.tools) || body.tools.length !== 0 ||
      !Number.isSafeInteger(body.max_tokens) || body.max_tokens < 1 || body.max_tokens > 131072 ||
      !Array.isArray(body.messages) || body.messages.length < 1) fail('REQUEST_CONTRACT_INVALID');
  return { ...options, accountBinding: { ...binding }, endpoint, body,
    requestBody: Buffer.from(options.requestBody, 'utf8') };
}

function writeDurable(file, bytes) {
  const fd = fs.openSync(file, 'wx', 0o600);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function writeJson(file, data) { writeDurable(file, JSON.stringify(data, null, 2) + '\n'); }

// Same callback signature as node:https.request; only the loopback http.request binding is exposed.
// There is intentionally no public dependency injection hook that could bind a live transport.
function postOnce(request, options, rawFd) {
  return new Promise(resolve => {
    const chunks = [];
    let captured = 0;
    let statusCode = null;
    let responseHeaders = {};
    let req;
    let finished = false;
    const finish = code => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { fs.fsyncSync(rawFd); } catch { code = 'EVIDENCE_WRITE_FAILED'; }
      resolve({ code, statusCode, responseHeaders, raw: Buffer.concat(chunks), captured });
      // Abort only the request owned by this attempt. This is not remote cancellation proof.
      if (code !== 'HTTP_COMPLETE') req?.destroy();
    };
    const timer = setTimeout(() => finish('DEADLINE_EXCEEDED'), options.deadlineMs);
    try {
      req = request(options.endpoint, { method: 'POST', agent: false, maxHeaderSize: 16384, headers: {
        'content-type': 'application/json', 'accept': 'text/event-stream',
        'content-length': options.requestBody.length, 'anthropic-version': '2023-06-01',
        // Fixed public fixture marker. Never reads credentials, process.env, OAuth or browser state.
        'x-api-key': 'OFFLINE_TEST_SENTINEL_NOT_A_SECRET',
      } }, res => {
        statusCode = res.statusCode;
        for (const name of ['content-type', 'request-id']) {
          const value = res.headers[name];
          if (typeof value === 'string' && value.length <= 200 && /^[\x20-\x7E]*$/.test(value)) {
            responseHeaders[name] = value;
          }
        }
        res.on('data', chunk => {
          if (finished) return;
          const available = options.maxCaptureBytes - captured;
          const part = chunk.subarray(0, available);
          try {
            if (part.length) fs.writeFileSync(rawFd, part);
          } catch { finish('EVIDENCE_WRITE_FAILED'); return; }
          chunks.push(part); captured += part.length;
          if (part.length < chunk.length) finish('CAPTURE_LIMIT_EXCEEDED');
        });
        res.on('aborted', () => finish('RESPONSE_TRUNCATED'));
        res.on('error', () => finish('RESPONSE_TRUNCATED'));
        res.on('end', () => finish(res.complete ? 'HTTP_COMPLETE' : 'RESPONSE_TRUNCATED'));
        res.on('close', () => { if (!res.complete) finish('RESPONSE_TRUNCATED'); });
      });
      req.on('error', () => finish('CONNECTION_FAILED'));
      req.end(options.requestBody);
    } catch { finish('TRANSPORT_CONSTRUCTION_FAILED'); }
  });
}

function parseStream(raw, options) {
  const state = { messageId: null, model: null, stopReason: null, usage: {},
    text: '', complete: false, started: false, deltaSeen: false, blocks: new Map() };
  const setUsage = usage => {
    if (usage == null) return;
    if (typeof usage !== 'object' || Array.isArray(usage)) fail('USAGE_INVALID');
    for (const key of ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens']) {
      if (usage[key] === undefined) continue;
      if (!Number.isSafeInteger(usage[key]) || usage[key] < 0 ||
          (state.usage[key] !== undefined && usage[key] < state.usage[key])) fail('USAGE_INVALID');
      state.usage[key] = usage[key];
    }
  };
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(raw).replaceAll('\r\n', '\n');
    const frames = text.split('\n\n');
    if (frames.pop()?.trim()) fail('SSE_TRUNCATED');
    for (const frame of frames) {
      if (!frame.trim() || frame.split('\n').every(line => !line || line.startsWith(':'))) continue;
      const lines = frame.split('\n');
      const names = lines.filter(line => line.startsWith('event:')).map(line => line.slice(6).trim());
      const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      if (names.length !== 1 || !data) fail('SSE_MALFORMED');
      let event;
      try { event = JSON.parse(data); } catch { fail('SSE_MALFORMED'); }
      if (event.type !== names[0]) fail('SSE_MALFORMED');
      if (state.complete) fail('SSE_AFTER_STOP');
      if (event.type === 'ping') continue;
      if (event.type === 'error') fail('PROVIDER_STREAM_ERROR');
      if (event.type === 'message_start') {
        if (state.started || !event.message || !substantive(event.message.id, 1)) fail('SSE_ORDER_INVALID');
        if (event.message.type !== 'message' || event.message.role !== 'assistant' ||
            !Array.isArray(event.message.content) || event.message.content.length !== 0) fail('MESSAGE_START_INVALID');
        state.started = true;
        state.messageId = event.message.id;
        state.model = event.message.model;
        setUsage(event.message.usage);
        if (state.model !== options.model) fail('RESPONSE_MODEL_MISMATCH');
        continue;
      }
      if (!state.started) fail('SSE_ORDER_INVALID');
      const block = state.blocks.get(event.index);
      if (event.type === 'content_block_start') {
        if (state.deltaSeen || block || !Number.isInteger(event.index) || event.index < 0 ||
            !['text', 'thinking', 'redacted_thinking'].includes(event.content_block?.type)) fail('CONTENT_BLOCK_INVALID');
        state.blocks.set(event.index, { type: event.content_block.type, stopped: false });
        if (event.content_block.type === 'text') state.text += event.content_block.text ?? '';
      } else if (event.type === 'content_block_delta') {
        if (state.deltaSeen || !block || block.stopped) fail('SSE_ORDER_INVALID');
        if (block.type === 'text' && event.delta?.type === 'text_delta' && typeof event.delta.text === 'string') {
          state.text += event.delta.text;
        } else if (!(block.type === 'thinking' && ['thinking_delta', 'signature_delta'].includes(event.delta?.type))) {
          fail('CONTENT_DELTA_INVALID');
        }
      } else if (event.type === 'content_block_stop') {
        if (!block || block.stopped || state.deltaSeen) fail('SSE_ORDER_INVALID');
        block.stopped = true;
      } else if (event.type === 'message_delta') {
        if ([...state.blocks.values()].some(item => !item.stopped)) fail('SSE_ORDER_INVALID');
        state.deltaSeen = true;
        if (state.stopReason !== null && event.delta?.stop_reason != null &&
            state.stopReason !== event.delta.stop_reason) fail('STOP_REASON_CONFLICT');
        if (event.delta?.stop_reason != null) state.stopReason = event.delta.stop_reason;
        setUsage(event.usage);
      } else if (event.type === 'message_stop') {
        if (!state.deltaSeen) fail('SSE_ORDER_INVALID');
        state.complete = true;
      } else fail('SSE_EVENT_UNSUPPORTED');
    }
    if (!state.complete) fail('SSE_TRUNCATED');
    if (state.stopReason !== 'end_turn') fail(state.stopReason === 'max_tokens' ? 'OUTPUT_LIMIT_REACHED' : 'STOP_REASON_INCOMPLETE');
    if (state.usage.output_tokens > options.body.max_tokens) fail('OUTPUT_USAGE_EXCEEDS_REQUEST');
    if (!state.text.trim()) fail('REVIEW_EMPTY');
    let review;
    try { review = JSON.parse(state.text); } catch { fail('REVIEW_JSON_INVALID'); }
    return { state, review: validateReview(review, options) };
  } catch (error) {
    return { state, error: error instanceof TypeError ? 'SSE_UTF8_INVALID' : error.message };
  }
}

export async function runOfflineReview(input) {
  const options = prepare(input);
  const directory = path.join(options.attemptsDir, options.attemptId);
  const startedAt = new Date().toISOString();
  const provenance = { evidenceClass: 'offline-fixture', runtimeDecision: null,
    attemptId: options.attemptId, requestSha256: options.expectedRequestSha256,
    requestBytes: options.requestBody.length, packetSha256: options.packetSha256,
    model: options.model, endpoint: options.fixtureEndpoint, accountBinding: options.accountBinding,
    maximumRequests: 1, continuations: 0, redirects: 0, retries: 0,
    deadlineMs: options.deadlineMs, maxCaptureBytes: options.maxCaptureBytes, startedAt };
  fs.mkdirSync(directory, { recursive: true });
  try { writeJson(path.join(directory, 'claim.json'), { ...provenance, state: 'claimed-never-auto-release' }); }
  catch (error) { fail(error.code === 'EEXIST' ? 'ATTEMPT_ALREADY_CLAIMED' : 'CLAIM_WRITE_FAILED'); }
  let rawFd;
  let response;
  try {
    writeDurable(path.join(directory, 'request.body.json'), options.requestBody);
    rawFd = fs.openSync(path.join(directory, 'response.raw'), 'wx', 0o600);
    writeJson(path.join(directory, 'send-intent.json'), { maximumRequests: 1,
      delivery: 'may-have-been-sent-if-process-crashes', at: new Date().toISOString() });
    response = await postOnce(http.request, options, rawFd);
  } catch { fail('EVIDENCE_WRITE_FAILED'); }
  finally { if (rawFd !== undefined) fs.closeSync(rawFd); }
  const parsed = parseStream(response.raw, options);
  let code = response.code;
  if (code === 'HTTP_COMPLETE') {
    if (response.statusCode !== 200) code = `HTTP_${response.statusCode}`;
    else if (!response.responseHeaders['content-type']?.toLowerCase().startsWith('text/event-stream')) code = 'RESPONSE_CONTENT_TYPE_INVALID';
    else code = parsed.error ?? 'REVIEW_COMPLETE';
  }
  const result = { status: code === 'REVIEW_COMPLETE' ? 'complete' : 'failed', code,
    review: code === 'REVIEW_COMPLETE' ? parsed.review : null, provenance,
    transport: { statusCode: response.statusCode, headers: response.responseHeaders,
      complete: response.code === 'HTTP_COMPLETE', localRequestLimit: 1,
      remoteCompletion: code === 'REVIEW_COMPLETE' ? 'fixture-response-complete' : 'unknown-or-failed',
      finishedAt: new Date().toISOString(), replayAllowed: false },
    response: { messageId: parsed.state.messageId, model: parsed.state.model,
      stopReason: parsed.state.stopReason, streamComplete: parsed.state.complete },
    capture: { bytes: response.captured, limitBytes: options.maxCaptureBytes,
      sha256: hash(response.raw), complete: response.code === 'HTTP_COMPLETE', path: 'response.raw' },
    accounting: { source: 'fixture-reported', scope: 'one-response-only',
      reportedUsage: Object.keys(parsed.state.usage).length ? parsed.state.usage : null,
      usageFinal: response.code === 'HTTP_COMPLETE' && response.statusCode === 200 &&
        response.responseHeaders['content-type']?.toLowerCase().startsWith('text/event-stream') === true &&
        parsed.state.complete && !['USAGE_INVALID', 'OUTPUT_USAGE_EXCEEDS_REQUEST', 'STOP_REASON_CONFLICT'].includes(parsed.error) &&
        Number.isSafeInteger(parsed.state.usage.input_tokens) && Number.isSafeInteger(parsed.state.usage.output_tokens),
      locallyEstimatedUsage: null, preflightEstimate: null, reservedBudget: null, billedCost: null,
      uncertainty: 'Synthetic response counters only; no provider usage, invoice or budget authority.' } };
  try { writeJson(path.join(directory, 'result.json'), result); }
  catch { fail('RESULT_WRITE_FAILED_ATTEMPT_REMAINS_CLAIMED'); }
  return result;
}
