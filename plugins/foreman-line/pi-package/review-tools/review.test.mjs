import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectConfig, childEnvironment, claimAttempt, supervise, inspectResponse } from './review-core.mjs';

const sha = b => createHash('sha256').update(b).digest('hex');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'foreman-review-test-'));
  const pin = (name, value) => {
    const path = join(dir, name);
    writeFileSync(path, value);
    return { path, sha256: sha(value), bytes: Buffer.byteLength(value) };
  };
  const packet = pin('packet.md', 'Review this synthetic plan.');
  const authority = pin('authority.md', 'Test fixture only; not human authority.');
  const executable = pin('fake-executable', 'not executable');
  delete authority.bytes;
  delete executable.bytes;
  return { dir, config: { version: 1, envelope: 'manual-claude-configured-v1', packet,
    authority, executable: { ...executable, version: '2.1.303' },
    model: 'claude-opus-5-5', authorFamily: 'openai',
    systemPrompt: 'Review only the supplied material.', runDirectory: join(dir, 'attempt'),
    outputTokens: 4000, timeoutSeconds: 600 } };
}
const events = () => [
  { type: 'system', subtype: 'init', model: 'claude-opus-5-5', tools: [], mcp_servers: [] },
  { type: 'assistant', message: { id: 'msg_1', model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Finding.' }] } },
  { type: 'result', subtype: 'success', is_error: false, num_turns: 1, result: 'Finding.', usage: { input_tokens: 10, output_tokens: 5 }, modelUsage: { 'claude-opus-5-5': { inputTokens: 10, outputTokens: 5 } } },
];
const stream = list => list.map(x => JSON.stringify(x)).join('\n') + '\n';

test('inspection validates exact bytes without creating an attempt or launching', () => {
  const { config } = fixture();
  const result = inspectConfig(config);
  assert.equal(result.packet.toString(), 'Review this synthetic plan.');
  assert.equal(existsSync(config.runDirectory), false);
});
test('changed packet or authority, stronger envelope and extra options refuse', () => {
  for (const edit of [c => c.packet.sha256 = '0'.repeat(64), c => c.authority.sha256 = '0'.repeat(64),
    c => c.envelope = 'governed-SA4', c => c.extra = '--dangerously-skip-permissions',
    c => c.authorFamily = 'anthropic', c => c.outputTokens = 8000]) {
    const { config } = fixture(); edit(config);
    assert.throws(() => inspectConfig(config));
  }
});
test('environment excludes alternate billing, proxies, hooks and injection while preserving nesting guards', () => {
  const env = childEnvironment({ PATH: 'safe', HOME: 'home', USERPROFILE: 'profile',
    ANTHROPIC_API_KEY: 'secret', ANTHROPIC_BASE_URL: 'https://elsewhere',
    HTTPS_PROXY: 'https://elsewhere', NODE_OPTIONS: '--require hostile',
    CLAUDE_CODE_RETRY_WATCHDOG: '1', CLAUDECODE: '1' });
  assert.equal(env.PATH, 'safe');
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'HTTPS_PROXY', 'NODE_OPTIONS', 'CLAUDE_CODE_RETRY_WATCHDOG']) assert.equal(env[key], undefined);
  assert.equal(env.CLAUDECODE, '1');
  assert.equal(env.CLAUDE_CODE_MAX_RETRIES, '0');
});
test('one attempt directory refuses a second invocation even after failure', () => {
  const { config } = fixture();
  claimAttempt(config, { operatorConfirmation: 'test' });
  assert.throws(() => claimAttempt(config, {}), /already exists|EEXIST/);
  assert.equal(JSON.parse(readFileSync(join(config.runDirectory, 'attempt.json'))).status, 'claimed');
});
test('only a complete exact-model tool-free response is captured, never approved', () => {
  assert.equal(inspectResponse(stream(events())).status, 'captured');
  for (const edit of [e => e[0].tools.push('Bash'), e => e[0].mcp_servers.push({ name: 'server' }),
    e => e[1].message.model = 'other', e => e[2].is_error = true,
    e => e.push({ ...e[1], message: { ...e[1].message, id: 'msg_2' } }),
    e => e[1].message.content.push({ type: 'tool_use' }), e => e.pop(),
    e => e.push({ type: 'system', subtype: 'hook_response' }),
    e => e[2].usage.output_tokens = 4001,
    e => e[2].modelUsage['claude-opus-5-5'].outputTokens = 4001]) {
    const e = events(); edit(e); assert.equal(inspectResponse(stream(e)).status, 'held');
  }
  assert.equal(inspectResponse('not json').status, 'held');
  assert.equal(inspectResponse('').status, 'held');
  for (const value of ['null\n', 'true\n', '[]\n', '{"type":"assistant","message":null}\n']) {
    assert.equal(inspectResponse(value).status, 'held');
  }
});
test('real child receives exact stdin; raw output survives and nonzero exit holds', async () => {
  for (const code of [0, 7]) {
    const { dir } = fixture();
    const program = "let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{process.stdout.write(s);process.stderr.write('diagnostic');process.exit(" + code + ")})";
    const result = await supervise({ command: process.execPath, args: ['-e', program], cwd: dir,
      env: childEnvironment(process.env), input: Buffer.from('exact\r\nbytes'), outputDirectory: dir, timeoutMs: 3000 });
    assert.equal(result.exitCode, code);
    assert.equal(readFileSync(join(dir, 'response.jsonl'), 'utf8'), 'exact\r\nbytes');
    assert.equal(readFileSync(join(dir, 'stderr.txt'), 'utf8'), 'diagnostic');
  }
});
test('timeout terminates owned child and preserves an uncertain remote outcome', async () => {
  const { dir } = fixture();
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { windowsHide: true, stdio: 'ignore' });
  try {
  const result = await supervise({ command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'],
    cwd: dir, env: childEnvironment(process.env), input: Buffer.alloc(0), outputDirectory: dir, timeoutMs: 150 });
  assert.equal(result.reason, 'LOCAL_TIMEOUT');
  assert.equal(result.localExitObserved, true);
  assert.equal(result.remoteOutcome, 'unknown');
  assert.equal(unrelated.exitCode, null);
  assert.equal(unrelated.killed, false);
  } finally { unrelated.kill(); }
});
test('CLI check is offline, noninteractive send refuses, and successful capture is reviewable', async () => {
  const { dir, config } = fixture();
  const manifest = join(dir, 'manifest.json');
  writeFileSync(manifest, JSON.stringify(config));
  const cli = fileURLToPath(new URL('./manual-claude.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [cli, '--check', manifest], { encoding: 'utf8' });
  assert.equal(JSON.parse(output).status, 'prepared-only');
  assert.equal(existsSync(config.runDirectory), false);
  assert.throws(() => execFileSync(process.execPath, [cli, '--run', manifest], { stdio: 'pipe' }),
    error => error.status === 2 && /interactive terminal/.test(error.stderr.toString()));
  assert.equal(existsSync(config.runDirectory), false);
  const expected = stream(events());
  const execution = await supervise({ command: process.execPath,
    args: ['-e', 'process.stdin.resume();process.stdin.on("end",()=>process.stdout.write(' + JSON.stringify(expected) + '))'],
    cwd: dir, env: childEnvironment(process.env), input: Buffer.from('synthetic packet'), outputDirectory: dir, timeoutMs: 3000 });
  assert.equal(execution.exitCode, 0);
  assert.equal(inspectResponse(readFileSync(join(dir, 'response.jsonl'), 'utf8')).status, 'captured');
});
test('capture overflow and missing executable fail closed without hanging', async () => {
  for (const missing of [false, true]) {
    const { dir } = fixture();
    const result = await supervise({ command: missing ? join(dir, 'missing') : process.execPath,
      args: ['-e', "process.stdout.write('x'.repeat(8192));setInterval(()=>{},1000)"],
      cwd: dir, env: childEnvironment(process.env), input: Buffer.alloc(0), outputDirectory: dir,
      timeoutMs: 3000, maxCaptureBytes: 1024 });
    assert.equal(result.reason, missing ? 'SPAWN_ERROR' : 'CAPTURE_LIMIT');
    assert.ok(readFileSync(join(dir, 'response.jsonl')).length <= 1024);
  }
});
