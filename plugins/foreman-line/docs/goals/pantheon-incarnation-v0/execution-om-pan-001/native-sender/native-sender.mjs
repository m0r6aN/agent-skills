// P00 OFFLINE NATIVE PREPARATION: no live executor, secrets, Runtime grants or CLI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const ownFile = fileURLToPath(import.meta.url);
const ownDirectory = path.dirname(ownFile);
const CURL = 'C:\\Windows\\System32\\curl.exe';
const CURL_SHA = '73d24149ff289afc49ec41f08918ef9faa727d39ad993e929757dc2ddafab805';
const FAKE = 'FIXTURE_ONLY_NOT_A_REAL_CREDENTIAL';
const CAP = 2 * 1024 * 1024;
const hash = data => createHash('sha256').update(data).digest('hex');
const fail = code => { throw new Error(code); };
const nonempty = (value, minimum = 1) => typeof value === 'string' && value.trim().length >= minimum;
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const bindingKeys = ['requestBody', 'expectedRequestSha256', 'expectedHelperSha256', 'model',
  'maxTokens', 'sourceHead', 'artifactManifestSha256', 'accountBindingRef'];

function checkKeys(value, allowed) {
  if (!value || typeof value !== 'object' || Object.keys(value).some(key => !allowed.includes(key))) fail('OPTIONS_REFUSED');
}
function localPath(value) {
  if (typeof value !== 'string' || /[\x00-\x1f"<>|]/.test(value) || !path.isAbsolute(value) ||
      !path.resolve(value).startsWith(ownDirectory + path.sep)) fail('PATH_REFUSED');
  return path.resolve(value);
}
function validateBinding(options) {
  if (!digest(options.expectedHelperSha256) || hash(fs.readFileSync(ownFile)) !== options.expectedHelperSha256) fail('HELPER_HASH_MISMATCH');
  if (typeof options.requestBody !== 'string' || Buffer.byteLength(options.requestBody) > CAP ||
      hash(options.requestBody) !== options.expectedRequestSha256) fail('REQUEST_HASH_MISMATCH');
  if (!digest(options.artifactManifestSha256) || !/^[a-f0-9]{40}$/.test(options.sourceHead) ||
      !/^[A-Za-z0-9._/-]{1,160}$/.test(options.accountBindingRef)) fail('BINDING_REFUSED');
  let body;
  try { body = JSON.parse(options.requestBody); } catch { fail('REQUEST_JSON_INVALID'); }
  if (!['claude-opus-5-5', 'claude-sonnet-5-5'].includes(options.model) || body.model !== options.model ||
      !Number.isSafeInteger(options.maxTokens) || options.maxTokens < 1 || options.maxTokens > 65536 ||
      body.max_tokens !== options.maxTokens || body.stream !== true || !Array.isArray(body.tools) || body.tools.length ||
      !Array.isArray(body.messages) || !body.messages.length) fail('REQUEST_CONTRACT_INVALID');
  return body;
}
function argvFor(endpoint, requestFile, { deadlineMs, idleMs, maxCaptureBytes }, live) {
  return ['--disable', '--config', '-', '--silent', '--no-buffer', '--globoff',
    '--retry', '0', '--max-redirs', '0', '--proto', live ? '=https' : '=http', '--proto-redir', '=https',
    '--proxy', '', '--noproxy', '*', '--connect-timeout', String(Math.min(30, deadlineMs / 1000)),
    '--max-time', String(deadlineMs / 1000), '--speed-limit', '1', '--speed-time', String(Math.ceil(idleMs / 1000)),
    '--max-filesize', String(maxCaptureBytes), '--http1.1', '--request', 'POST',
    '--header', 'content-type: application/json', '--header', 'accept: text/event-stream',
    '--header', 'anthropic-version: 2023-06-01', '--header', 'Expect:',
    '--data-binary', '@' + requestFile, '--include', '--output', '-',
    '--write-out', '%{stderr}\nNATIVE_STATUS:%{response_code}:%{num_redirects}:%{num_connects}\n', '--url', endpoint];
}

export function describeLiveCommand(options) {
  checkKeys(options, [...bindingKeys, 'requestFile', 'rawOutputFile']);
  validateBinding(options);
  const requestFile = localPath(options.requestFile);
  const rawOutputFile = localPath(options.rawOutputFile);
  if (requestFile === rawOutputFile) fail('PATH_REFUSED');
  const limits = { deadlineMs: 600000, idleMs: 120000, maxCaptureBytes: CAP, cleanupMs: 5000 };
  return { kind: 'data-only-native-command-descriptor', mayExecute: false, runtimeDecisionRef: null,
    executable: CURL, executableSha256: CURL_SHA, expectedVersion: '8.21.0',
    argv: argvFor('https://api.anthropic.com/v1/messages', requestFile, limits, true),
    shell: false, inheritEnvironment: false, credentialChannel: 'stdin-config-from-later-trusted-broker-only',
    stdinConfigContract: 'one header assignment; reject CR/LF, quotes, backslashes and control characters in the credential; never persist or log stdin',
    rawOutputFile, rawSink: 'bounded supervisor pipe to this pre-opened exclusive file', limits,
    binding: { requestSha256: options.expectedRequestSha256, helperSha256: options.expectedHelperSha256,
      sourceHead: options.sourceHead, artifactManifestSha256: options.artifactManifestSha256,
      accountBindingRef: options.accountBindingRef, model: options.model, maxTokens: options.maxTokens } };
}

export function validateReviewPayload(value, requiredCoverage) {
  if (!value || !nonempty(value.reviewText, 120) || !['pass', 'changes_required', 'blocked'].includes(value.verdict) ||
      !Array.isArray(value.findings) || value.findings.length > 100 || !Array.isArray(value.coverage) ||
      !value.coverage.every(item => nonempty(item)) || !Array.isArray(value.limitations) ||
      !value.limitations.every(item => nonempty(item)) || !Array.isArray(requiredCoverage) ||
      !requiredCoverage.every(item => value.coverage.includes(item))) fail('REVIEW_CONTRACT_INVALID');
  const ids = new Set();
  for (const f of value.findings) {
    if (!f || !/^[A-Za-z0-9-]{1,40}$/.test(f.id) || ids.has(f.id) ||
        !['critical', 'high', 'medium', 'low', 'info'].includes(f.severity) || !nonempty(f.claim, 15) ||
        !Array.isArray(f.evidence) || !f.evidence.length || !f.evidence.every(item => nonempty(item, 3)) ||
        !nonempty(f.requiredChange, 15) || !nonempty(f.acceptanceCheck, 15)) fail('FINDING_CONTRACT_INVALID');
    ids.add(f.id);
  }
  if ((value.verdict !== 'pass' && !value.findings.length) ||
      (value.verdict === 'pass' && value.findings.some(f => ['critical', 'high'].includes(f.severity)))) fail('VERDICT_CONFLICT');
  // Deliberately discard any model-asserted provenance/IDs. Capture records bind those separately.
  return { reviewText: value.reviewText, verdict: value.verdict, findings: value.findings.map(f => ({
    id: f.id, severity: f.severity, claim: f.claim, evidence: f.evidence,
    requiredChange: f.requiredChange, acceptanceCheck: f.acceptanceCheck })),
    coverage: value.coverage, limitations: value.limitations };
}

function durable(file, value) {
  const fd = fs.openSync(file, 'wx', 0o600);
  try { fs.writeFileSync(fd, value); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
const json = (file, value) => durable(file, JSON.stringify(value, null, 2) + '\n');

function executeFixture(argv, options, rawFd) {
  return new Promise(resolve => {
    let child, done = false, reason = null, rawBytes = 0, stderrBytes = 0;
    let stderr = '', chunks = [], cleanupTimer, idleTimer;
    const started = Date.now();
    const complete = (exitCode, signal) => {
      if (done) return;
      done = true; clearTimeout(deadlineTimer); clearTimeout(idleTimer); clearTimeout(cleanupTimer);
      try { fs.fsyncSync(rawFd); } catch { reason = 'CAPTURE_WRITE_FAILED'; }
      const match = /NATIVE_STATUS:(\d{3}):(\d+):(\d+)/.exec(stderr);
      resolve({ reason, exitCode, signal, raw: Buffer.concat(chunks), rawBytes, stderrBytes,
        statusCode: match ? Number(match[1]) : null, redirects: match ? Number(match[2]) : null,
        connections: match ? Number(match[3]) : null, elapsedMs: Date.now() - started });
    };
    const stop = code => {
      if (done || reason) return;
      reason = code;
      child?.kill(); // Owned child only; no shell, process-tree sweep or global taskkill.
      cleanupTimer = setTimeout(() => { reason = 'OWNED_CLEANUP_UNCONFIRMED'; complete(null, null); }, 5000);
    };
    const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => stop('IDLE_TIMEOUT'), options.idleMs); };
    const deadlineTimer = setTimeout(() => stop('DEADLINE_EXCEEDED'), options.deadlineMs);
    try {
      child = spawn(CURL, argv, { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
        // A literal allowlist, not a filtered copy: no inherited proxy, HOME, curl config or credential values.
        env: { SystemRoot: 'C:\\Windows' } });
      // The supervisor's streaming-idle timer starts with captured response bytes;
      // native connect/low-speed/total bounds and the absolute timer cover startup.
      child.on('error', () => { reason = 'NATIVE_SPAWN_FAILED'; complete(null, null); });
      child.on('close', complete);
      child.stdout.on('data', chunk => {
        if (done || reason) return;
        resetIdle();
        const part = chunk.subarray(0, options.maxCaptureBytes - rawBytes);
        try { fs.writeFileSync(rawFd, part); } catch { stop('CAPTURE_WRITE_FAILED'); return; }
        chunks.push(part); rawBytes += part.length;
        if (part.length !== chunk.length) stop('CAPTURE_LIMIT_EXCEEDED');
      });
      child.stderr.on('data', chunk => {
        stderrBytes += chunk.length;
        if (stderrBytes > 16384) stop('STDERR_LIMIT_EXCEEDED');
        else stderr += chunk.toString('utf8'); // Only numeric write-out metadata leaves this private buffer.
      });
      child.stdin.on('error', () => stop('STDIN_FAILED'));
      child.stdin.end(`header = "x-api-key: ${FAKE}"\n`);
    } catch { reason = 'NATIVE_SPAWN_FAILED'; complete(null, null); }
  });
}

function inspectCapture(raw, options) {
  const state = { messageId: null, model: null, requestId: null, httpStatus: null, stopReason: null,
    usage: {}, usageScope: 'one-response-cumulative-snapshots', complete: false, streamValid: false,
    finalUsageValid: false, terminalUsageSeen: false, reviewUsable: false, unrecognizedUsageFields: [], reportedTier: null, reportedGeo: null, review: null };
  const usage = value => {
    if (value === undefined) return;
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('USAGE_INVALID');
    for (const key of Object.keys(value)) {
      if (!['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens', 'service_tier', 'inference_geo'].includes(key) &&
          !state.unrecognizedUsageFields.includes(key)) state.unrecognizedUsageFields.push(key);
    }
    for (const [key, target] of [['service_tier', 'reportedTier'], ['inference_geo', 'reportedGeo']]) {
      if (value[key] !== undefined) {
        if (typeof value[key] !== 'string' || (state[target] !== null && state[target] !== value[key])) fail('USAGE_INVALID');
        state[target] = value[key];
      }
    }
    for (const key of ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens']) {
      if (value[key] === undefined) continue;
      if (!Number.isSafeInteger(value[key]) || value[key] < 0 || (state.usage[key] ?? 0) > value[key]) fail('USAGE_INVALID');
      state.usage[key] = value[key];
    }
  };
  try {
    let text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    let headers;
    do {
      const end = text.indexOf('\r\n\r\n');
      if (end < 0) fail('HTTP_HEADERS_INCOMPLETE');
      headers = text.slice(0, end); text = text.slice(end + 4);
      if (!/^HTTP\/1\.[01] [0-9]{3}( |$)/.test(headers)) fail('HTTP_HEADERS_INVALID');
    } while (/^HTTP\/1\.[01] 1[0-9]{2} /.test(headers));
    state.httpStatus = Number(/^HTTP\/1\.[01] ([0-9]{3})/.exec(headers)[1]);
    state.requestId = /^request-id:\s*([A-Za-z0-9._-]{1,200})\s*$/im.exec(headers)?.[1] ?? null;
    if (state.httpStatus !== 200) fail(`HTTP_${state.httpStatus}`);
    if (!/^content-type:\s*text\/event-stream(?:;|\s*$)/im.test(headers)) fail('CONTENT_TYPE_INVALID');
    const frames = text.replaceAll('\r\n', '\n').split('\n\n');
    if (frames.pop()?.trim()) fail('SSE_TRUNCATED');
    let started = false, terminal = false, answer = '';
    const blocks = new Map();
    for (const frame of frames) {
      if (!frame.trim() || frame.split('\n').every(line => !line || line.startsWith(':'))) continue;
      const lines = frame.split('\n');
      const names = lines.filter(line => line.startsWith('event:')).map(line => line.slice(6).trim());
      const content = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      let e;
      try { e = JSON.parse(content); } catch { fail('SSE_MALFORMED'); }
      if (!e || names.length !== 1 || e.type !== names[0] || state.complete) fail('SSE_ORDER_INVALID');
      if (e.type === 'ping') continue;
      if (e.type === 'error') fail('PROVIDER_STREAM_ERROR');
      if (e.type === 'message_start') {
        if (started || e.message?.type !== 'message' || e.message.role !== 'assistant' ||
            !/^[A-Za-z0-9_-]{1,200}$/.test(e.message.id) || !Array.isArray(e.message.content) || e.message.content.length) fail('MESSAGE_START_INVALID');
        started = true; state.messageId = e.message.id; state.model = e.message.model;
        usage(e.message.usage);
        if (state.model !== options.model) fail('MODEL_MISMATCH');
        continue;
      }
      if (!started) fail('SSE_ORDER_INVALID');
      const b = blocks.get(e.index);
      if (e.type === 'content_block_start') {
        if (terminal || b || !Number.isInteger(e.index) || e.index < 0 ||
            !['text', 'thinking', 'redacted_thinking'].includes(e.content_block?.type)) fail('CONTENT_BLOCK_INVALID');
        blocks.set(e.index, { type: e.content_block.type, stopped: false });
        if (e.content_block.type === 'text') {
          if (typeof e.content_block.text !== 'string') fail('CONTENT_BLOCK_INVALID');
          answer += e.content_block.text;
        }
      } else if (e.type === 'content_block_delta') {
        if (terminal || !b || b.stopped) fail('SSE_ORDER_INVALID');
        if (b.type === 'text' && e.delta?.type === 'text_delta' && typeof e.delta.text === 'string') answer += e.delta.text;
        else if (!(b.type === 'thinking' && ['thinking_delta', 'signature_delta'].includes(e.delta?.type))) fail('CONTENT_DELTA_INVALID');
      } else if (e.type === 'content_block_stop') {
        if (terminal || !b || b.stopped) fail('SSE_ORDER_INVALID'); b.stopped = true;
      } else if (e.type === 'message_delta') {
        if ([...blocks.values()].some(block => !block.stopped)) fail('SSE_ORDER_INVALID');
        terminal = true;
        if (state.stopReason !== null && e.delta?.stop_reason != null && state.stopReason !== e.delta.stop_reason) fail('STOP_REASON_CONFLICT');
        if (e.delta?.stop_reason != null) state.stopReason = e.delta.stop_reason;
        usage(e.usage);
        state.terminalUsageSeen = Number.isSafeInteger(e.usage?.output_tokens);
      } else if (e.type === 'message_stop') {
        if (!terminal) fail('SSE_ORDER_INVALID'); state.complete = true;
      } else fail('SSE_EVENT_UNSUPPORTED');
    }
    if (!state.complete) fail('SSE_TRUNCATED');
    state.streamValid = true; // Reached only after every frame and the terminal event were valid.
    if (state.stopReason !== 'end_turn') fail(state.stopReason === 'max_tokens' ? 'OUTPUT_LIMIT_REACHED' : 'STOP_REASON_INCOMPLETE');
    if (state.usage.output_tokens > options.maxTokens) fail('OUTPUT_USAGE_EXCEEDS_REQUEST');
    if (!answer.trim()) fail('REVIEW_EMPTY');
    let value;
    try { value = JSON.parse(answer); } catch { fail('REVIEW_JSON_INVALID'); }
    state.review = validateReviewPayload(value, options.requiredCoverage);
    state.reviewUsable = true;
    state.visibleAnswerBytes = Buffer.byteLength(answer);
  } catch (error) { state.error = error instanceof TypeError ? 'CAPTURE_ENCODING_INVALID' : error.message; }
  state.finalUsageValid = state.streamValid && state.terminalUsageSeen && state.unrecognizedUsageFields.length === 0 &&
    Number.isSafeInteger(state.usage.input_tokens) && Number.isSafeInteger(state.usage.output_tokens) &&
    state.usage.output_tokens <= options.maxTokens;
  return state;
}

export function inspectNativeCapture(raw, expected) {
  if (!Buffer.isBuffer(raw) || raw.length > CAP) fail('RAW_CAPTURE_REFUSED');
  checkKeys(expected, ['model', 'maxTokens', 'requiredCoverage']);
  if (!['claude-opus-5-5', 'claude-sonnet-5-5'].includes(expected.model) ||
      !Number.isSafeInteger(expected.maxTokens) || expected.maxTokens < 1 || expected.maxTokens > 65536 ||
      !Array.isArray(expected.requiredCoverage) || !expected.requiredCoverage.length || expected.requiredCoverage.length > 100 ||
      !expected.requiredCoverage.every(item => nonempty(item) && item.length <= 2000)) fail('CAPTURE_EXPECTATIONS_REFUSED');
  const state = inspectCapture(raw, expected);
  // Pure parsing cannot establish native transport completion, authenticity, source validity or identity.
  return { ...state, rawSha256: hash(raw), semanticStatus: state.error ? 'failed' : 'held',
    reviewAccepted: false, requiresTransportCompletionEvidence: true };
}

export async function runOfflineFixture(options) {
  checkKeys(options, [...bindingKeys, 'attemptsRoot', 'attemptId', 'fixtureEndpoint', 'fakeCredential',
    'deadlineMs', 'idleMs', 'maxCaptureBytes', 'requiredCoverage']);
  validateBinding(options);
  if (options.fakeCredential !== FAKE) fail('FAKE_CREDENTIAL_REQUIRED');
  if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}\/v1\/messages$/.test(options.fixtureEndpoint)) fail('LOOPBACK_REQUIRED');
  let endpoint;
  try { endpoint = new URL(options.fixtureEndpoint); } catch { fail('LOOPBACK_REQUIRED'); }
  if (!endpoint.port || Number(endpoint.port) > 65535) fail('LOOPBACK_REQUIRED');
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(options.attemptId) ||
      !Number.isInteger(options.deadlineMs) || options.deadlineMs < 50 || options.deadlineMs > 600000 ||
      !Number.isInteger(options.idleMs) || options.idleMs < 50 || options.idleMs > 120000 ||
      !Number.isInteger(options.maxCaptureBytes) || options.maxCaptureBytes < 256 || options.maxCaptureBytes > CAP ||
      !Array.isArray(options.requiredCoverage) || !options.requiredCoverage.length || options.requiredCoverage.length > 100 ||
      !options.requiredCoverage.every(item => nonempty(item) && item.length <= 2000)) fail('BOUNDS_REFUSED');
  const attemptsRoot = localPath(options.attemptsRoot);
  if (hash(fs.readFileSync(CURL)) !== CURL_SHA) fail('NATIVE_EXECUTABLE_HASH_MISMATCH');
  // Validate the existing parent before mkdir, so an existing junction cannot redirect writes.
  if (!fs.existsSync(attemptsRoot) ||
      !fs.realpathSync(attemptsRoot).startsWith(fs.realpathSync(ownDirectory) + path.sep)) fail('PATH_REFUSED');
  const directory = path.join(attemptsRoot, options.attemptId);
  fs.mkdirSync(directory, { recursive: true });
  // Reject existing junctions/symlinks outside the preparation tree before creating evidence.
  if (!fs.realpathSync(directory).startsWith(fs.realpathSync(ownDirectory) + path.sep)) fail('PATH_REFUSED');
  const provenance = { evidenceClass: 'offline-native-curl-fixture', attemptId: options.attemptId,
    requestSha256: options.expectedRequestSha256, helperSha256: options.expectedHelperSha256,
    sourceHead: options.sourceHead, artifactManifestSha256: options.artifactManifestSha256,
    accountBindingRef: options.accountBindingRef, model: options.model, maxTokens: options.maxTokens,
    executable: CURL, executableSha256: CURL_SHA, runtimeDecisionRef: null, startedAt: new Date().toISOString() };
  try { json(path.join(directory, 'claim.json'), { ...provenance, state: 'claimed-never-auto-release' }); }
  catch (error) { fail(error.code === 'EEXIST' ? 'ATTEMPT_ALREADY_CLAIMED' : 'CLAIM_WRITE_FAILED'); }
  const requestFile = path.join(directory, 'request.body.json');
  let rawFd, captured;
  try {
    durable(requestFile, options.requestBody);
    rawFd = fs.openSync(path.join(directory, 'response.raw'), 'wx', 0o600);
    const argv = argvFor(options.fixtureEndpoint, requestFile, options, false);
    json(path.join(directory, 'command.json'), { executable: CURL, argv, shell: false, inheritedEnvironment: false,
      credentialSource: 'fixed-fixture-marker-in-stdin-only', rawOutputFile: 'response.raw' });
    json(path.join(directory, 'send-intent.json'), { maximumRequests: 1, automaticRetries: 0,
      delivery: 'unknown-after-this-marker-until-capture', at: new Date().toISOString() });
    captured = await executeFixture(argv, options, rawFd);
  } catch { fail('CAPTURE_PREPARATION_FAILED_CLAIM_RETAINED'); }
  finally { if (rawFd !== undefined) fs.closeSync(rawFd); }
  const parsed = inspectNativeCapture(captured.raw, { model: options.model, maxTokens: options.maxTokens,
    requiredCoverage: options.requiredCoverage });
  const code = captured.reason ?? (captured.exitCode === 63 ? 'CAPTURE_LIMIT_EXCEEDED' :
    captured.exitCode === 28 ? 'NATIVE_TIMEOUT' : captured.exitCode === 18 ? 'HTTP_TRUNCATED' :
    captured.exitCode !== 0 ? 'NATIVE_TRANSFER_FAILED' : captured.redirects !== 0 ? 'UNEXPECTED_REDIRECT' :
    captured.statusCode !== 200 ? `HTTP_${captured.statusCode}` : parsed.error ?? 'SEMANTIC_ACCEPTANCE_HELD');
  const held = code === 'SEMANTIC_ACCEPTANCE_HELD';
  const usageFinal = captured.exitCode === 0 && captured.statusCode === 200 && !captured.reason && parsed.finalUsageValid;
  const result = { status: held ? 'held' : 'failed', code, reviewAccepted: false,
    review: held ? { schema: 'pantheon.review-result.v1', reviewId: `offline-${options.attemptId}`,
      artifact: { manifestSha256: options.artifactManifestSha256, sourceHead: options.sourceHead }, ...parsed.review } : null,
    semanticHold: held ? ['Resolve evidence locators against the pinned artifact.',
      'Verify required focus coverage substantively and validate independent reviewer identity.'] : [],
    provenance: { ...provenance, providerRequestId: parsed.requestId, providerMessageId: parsed.messageId,
      rawResponseSha256: hash(captured.raw) },
    transport: { exitCode: captured.exitCode, signal: captured.signal, statusCode: captured.statusCode,
      elapsedMs: captured.elapsedMs, stderrBytes: captured.stderrBytes, redirects: captured.redirects,
      connections: captured.connections, replayAllowed: false,
      delivery: held ? 'fixture-response-complete' : 'unknown-or-failed', remoteCancellationConfirmed: false },
    capture: { path: 'response.raw', sha256: hash(captured.raw), bytes: captured.rawBytes,
      limitBytes: options.maxCaptureBytes, complete: captured.exitCode === 0 && !captured.reason },
    response: { model: parsed.model, stopReason: parsed.stopReason, streamComplete: parsed.complete },
    accounting: { source: 'fixture-reported', scope: parsed.usageScope, reportedUsage: Object.keys(parsed.usage).length ? parsed.usage : null,
      usageFinal, visibleAnswerBytes: parsed.visibleAnswerBytes ?? null, preflightEstimate: null,
      reservedBudget: null, locallyEstimatedUsage: null, providerReportedUsage: null, billedCost: null,
      uncertainty: 'No provider/account execution; local fixture counters only. No authority to release money.' } };
  try { json(path.join(directory, 'result.json'), result); } catch { fail('RESULT_WRITE_FAILED_CLAIM_RETAINED'); }
  return result;
}
