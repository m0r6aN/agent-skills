// Operator convenience only. Never issues or accepts Foreman admission receipts.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, openSync, writeSync, closeSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { spawn } from 'node:child_process';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
function keys(value, expected) {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  requireThat(Object.keys(value).sort().join(',') === expected.split(' ').sort().join(','), 'Unexpected or missing fields');
}
function pinnedFile(pin, maxBytes) {
  requireThat(typeof pin.path === 'string' && isAbsolute(pin.path), 'Absolute file path required');
  requireThat(/^[0-9a-f]{64}$/.test(pin.sha256), 'SHA-256 required');
  requireThat(statSync(pin.path).isFile() && statSync(pin.path).size <= maxBytes, 'File size/type refused');
  const bytes = readFileSync(pin.path);
  requireThat(sha256(bytes) === pin.sha256, 'Pinned file changed');
  return bytes;
}
export function inspectConfig(config) {
  keys(config, 'version envelope packet authority executable model authorFamily systemPrompt runDirectory outputTokens timeoutSeconds');
  keys(config.packet, 'path sha256 bytes');
  keys(config.authority, 'path sha256');
  keys(config.executable, 'path sha256 version');
  requireThat(config.version === 1 && config.envelope === 'manual-claude-configured-v1', 'Unsupported envelope: strict/governed requirements cannot use this helper');
  requireThat(config.model === 'claude-opus-5-5' && config.executable.version === '2.1.303', 'Unqualified model or CLI version');
  requireThat(typeof config.authorFamily === 'string' && config.authorFamily.length > 0 && !/anthropic|claude/i.test(config.authorFamily), 'Independent author family required');
  requireThat(config.outputTokens === 4000 && config.timeoutSeconds === 600, 'This profile supports configured 4000 output tokens / 600 seconds only');
  requireThat(typeof config.systemPrompt === 'string' && config.systemPrompt.trim() && Buffer.byteLength(config.systemPrompt) <= 1000, 'System prompt must be 1..1000 UTF-8 bytes');
  requireThat(typeof config.runDirectory === 'string' && isAbsolute(config.runDirectory), 'Absolute attempt directory required');
  const packet = pinnedFile(config.packet, 128 * 1024);
  requireThat(packet.length > 0 && packet.length === config.packet.bytes, 'Packet length mismatch');
  new TextDecoder('utf-8', { fatal: true }).decode(packet);
  pinnedFile(config.authority, 1024 * 1024);
  pinnedFile(config.executable, 512 * 1024 * 1024);
  requireThat(!/\.(cmd|bat|ps1|sh)$/i.test(config.executable.path), 'Use a native Claude executable, not a shell shim');
  return { packet };
}

export function childEnvironment(source) {
  const env = {};
  // Keep OS/auth lookup and nesting guards; omit proxy, API, Node and hook overrides.
  const keep = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|TEMP|TMP|TMPDIR|LANG|LC_ALL|CLAUDECODE|CLAUDE_CODE_ENTRYPOINT)$/i;
  for (const [key, value] of Object.entries(source)) if (keep.test(key)) env[key] = value;
  return { ...env, CLAUDE_CODE_MAX_OUTPUT_TOKENS: '4000', CLAUDE_CODE_MAX_RETRIES: '0',
    CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK: '1', CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK: '1',
    CLAUDE_CODE_DISABLE_FAST_MODE: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL: '1', DISABLE_AUTOUPDATER: '1',
    CLAUDE_CODE_DISABLE_TERMINAL_TITLE: '1' };
}

export function reviewArguments(config) {
  return ['--print', '--safe-mode', '--model', config.model, '--effort', 'high',
    '--tools', '', '--disallowedTools', 'mcp__*', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--disable-slash-commands', '--no-chrome', '--permission-mode', 'dontAsk',
    '--permission-prompts', 'none', '--no-session-persistence', '--max-turns', '1',
    '--max-budget-usd', '1.00', '--settings', '{"disableAllHooks":true,"fastMode":false,"autoContinueAtUsageLimit":false}',
    '--system-prompt', config.systemPrompt, '--output-format', 'stream-json', '--verbose'];
}

export function claimAttempt(config, observation) {
  // Atomic local claim. Never delete it to retry after an uncertain send.
  // This is NOT a distributed permit or a mechanism for authenticating human authority.
  mkdirSync(config.runDirectory, { mode: 0o700 });
  writeFileSync(join(config.runDirectory, 'attempt.json'), JSON.stringify({
    status: 'claimed', recordedAt: new Date().toISOString(), config, observation,
    authorityKind: 'operator-reported; not a Foreman receipt',
  }, null, 2), { flag: 'wx', mode: 0o600 });
  mkdirSync(join(config.runDirectory, 'cwd'), { mode: 0o700 });
}

export async function supervise({ command, args, cwd, env, input, outputDirectory, timeoutMs,
  maxCaptureBytes = 8 * 1024 * 1024 }) {
  const out = openSync(join(outputDirectory, 'response.jsonl'), 'wx', 0o600);
  let err;
  try { err = openSync(join(outputDirectory, 'stderr.txt'), 'wx', 0o600); }
  catch (e) { closeSync(out); throw e; }
  const startedAt = new Date().toISOString();
  return new Promise(resolve => {
    let child, deadline, cleanup, done = false, reason = null, captured = 0;
    const finish = (exitCode, signal, localExitObserved) => {
      if (done) return;
      done = true;
      clearTimeout(deadline); clearTimeout(cleanup);
      process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt);
      closeSync(out); closeSync(err);
      resolve({ startedAt, endedAt: new Date().toISOString(), exitCode, signal, reason,
        localExitObserved, remoteOutcome: reason ? 'unknown' : 'provider-reported-only', capturedBytes: captured });
    };
    const stop = why => {
      if (done || reason) return;
      reason = why;
      // Exact child handle only; never kill by process name or touch existing chats.
      child?.kill('SIGTERM');
      cleanup = setTimeout(() => {
        child?.kill('SIGKILL');
        child?.stdin.destroy(); child?.stdout.destroy(); child?.stderr.destroy(); child?.unref();
        finish(null, null, false);
      }, 5000);
    };
    const interrupt = () => stop('OPERATOR_INTERRUPT');
    const capture = fd => bytes => {
      if (done) return;
      const remaining = Math.max(0, maxCaptureBytes - captured);
      try {
        const slice = bytes.subarray(0, remaining);
        let offset = 0;
        while (offset < slice.length) offset += writeSync(fd, slice, offset);
        captured += slice.length;
      } catch { stop('CAPTURE_ERROR'); return; }
      if (bytes.length > remaining) stop('CAPTURE_LIMIT');
    };
    try {
      child = spawn(command, args, { cwd, env, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      child.stdout.on('data', capture(out)); child.stderr.on('data', capture(err));
      child.on('error', () => { reason = 'SPAWN_ERROR'; finish(null, null, false); });
      child.on('close', (code, signal) => finish(code, signal, true));
      child.stdin.on('error', () => stop('INPUT_ERROR'));
      process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
      deadline = setTimeout(() => stop('LOCAL_TIMEOUT'), timeoutMs);
      child.stdin.end(input);
    } catch { reason = 'SPAWN_ERROR'; finish(null, null, false); }
  });
}

export function inspectResponse(text) {
  const reasons = [];
  let events;
  try { events = text.split(/\r?\n/).filter(s => s.trim()).map(s => JSON.parse(s)); }
  catch { return { status: 'held', reasons: ['INVALID_JSON_STREAM'] }; }
  if (events.some(e => !e || typeof e !== 'object' || Array.isArray(e))) return { status: 'held', reasons: ['INVALID_EVENT_SHAPE'] };
  const init = events.filter(e => e.type === 'system' && e.subtype === 'init');
  const result = events.filter(e => e.type === 'result');
  const messages = events.filter(e => e.type === 'assistant').map(e => e.message);
  if (init.length !== 1 || init[0].model !== 'claude-opus-5-5' || !Array.isArray(init[0].tools)
    || init[0].tools.length || !Array.isArray(init[0].mcp_servers) || init[0].mcp_servers.length) reasons.push('INIT_IDENTITY_OR_TOOLS');
  if (!messages.length || messages.some(m => !m || m.model !== 'claude-opus-5-5' || typeof m.id !== 'string')
    || new Set(messages.map(m => m?.id)).size !== 1) reasons.push('MESSAGE_IDENTITY_OR_REQUEST_COUNT');
  if (messages.some(m => !Array.isArray(m?.content) || m.content.some(b => !b || !['text', 'thinking', 'redacted_thinking'].includes(b.type)))) reasons.push('UNEXPECTED_CONTENT_OR_TOOL');
  if (events.some(e => e.error || !['system', 'assistant', 'result'].includes(e.type)
    || (e.type === 'system' && e.subtype !== 'init'))) reasons.push('UNEXPECTED_EVENT');
  const final = result[0];
  if (result.length !== 1 || events.at(-1) !== final || final?.subtype !== 'success'
    || final?.is_error !== false || final?.num_turns !== 1 || typeof final?.result !== 'string' || !final.result.trim()) reasons.push('INCOMPLETE_OR_FAILED_RESULT');
  const usage = final?.usage;
  if (!usage || !Number.isSafeInteger(usage.input_tokens) || usage.input_tokens < 0
    || !Number.isSafeInteger(usage.output_tokens) || usage.output_tokens < 0
    || !final?.modelUsage || Object.keys(final.modelUsage).join(',') !== 'claude-opus-5-5') reasons.push('MISSING_OR_UNEXPECTED_USAGE');
  if (usage?.output_tokens > 4000 || final?.modelUsage?.['claude-opus-5-5']?.outputTokens > 4000) reasons.push('REPORTED_OUTPUT_LIMIT_EXCEEDED');
  return { status: reasons.length ? 'held' : 'captured', reasons,
    text: reasons.length ? undefined : final.result,
    usage: final?.usage, modelUsage: final?.modelUsage, costEstimateUsd: final?.total_cost_usd,
    evidenceKind: 'CLI/provider-reported; coordinator triage required; not approval' };
}
