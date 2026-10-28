// Authorized metadata-only preflight. NEVER invokes --print, --run, a prompt or a model.
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { childEnvironment } from '../../../../pi-package/review-tools/review-core.mjs';
const goal = 'D:/Repos/agent-skills/plugins/foreman-line/docs/goals/collective-civilizational-memory';
const exe = 'D:/nodejs_symlinks/node_modules/@anthropic-ai/claude-code/bin/claude.exe';
const cwd = mkdtempSync(join(tmpdir(), 'ccm-rlp01-metadata-'));
const env = childEnvironment(process.env);
const report = { observedAt: new Date().toISOString(), scope: 'local CLI version/help and filtered auth readiness only; no inference',
  reviewInvocations: 0, nativeMetadataCommands: [],
  version: { state: 'unknown' }, account: { state: 'unknown' }, flags: { state: 'unknown' },
  model: { requested: 'claude-opus-5-5', state: 'unknown', note: 'No live availability probe or provider call authorized.' },
  extraUsageOff: { state: 'unknown', note: 'Requires current account setting evidence; auth metadata is insufficient.' },
  modelImprovementOff: { state: 'unknown', note: 'Requires current privacy setting evidence; no setting change authorized.' },
  managedPolicy: { state: 'unknown', note: 'Neither safe-mode flags nor CLI help prove absence of managed policy additions.' },
  finalHumanSendOnce: { state: 'not-given' }, state: 'held' };
function metadata(args) {
  report.nativeMetadataCommands.push(args);
  const r = spawnSync(exe, args, { cwd, env, shell: false, windowsHide: true, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0 || r.error) return null; // Never print/persist raw auth/error buffers.
  return r.stdout.trim();
}
if (!existsSync(exe)) report.version = { state: 'failed', reason: 'native-executable-missing' };
else if (env.CLAUDECODE) report.version = { state: 'held', reason: 'nesting-guard-present; native commands not attempted' };
else {
  const v = metadata(['--version']);
  report.version = { state: v === '2.1.303 (Claude Code)' ? 'pass' : 'failed', expected: '2.1.303 (Claude Code)', observed: v && /^[0-9.]+ \(Claude Code\)$/.test(v) ? v : null };
  if (report.version.state === 'pass') {
    const raw = metadata(['auth', 'status', '--json']);
    try {
      const a = JSON.parse(raw);
      report.account = { state: a.loggedIn === true && a.authMethod === 'claude.ai' && a.apiProvider === 'firstParty' && a.subscriptionType === 'max' ? 'pass' : 'failed',
        loggedIn: a.loggedIn === true, authMethod: a.authMethod === 'claude.ai' ? 'claude.ai' : 'other-or-unknown',
        apiProvider: a.apiProvider === 'firstParty' ? 'firstParty' : 'other-or-unknown', subscriptionType: a.subscriptionType === 'max' ? 'max' : 'other-or-unknown' };
    } catch { report.account = { state: 'unknown', reason: 'metadata-unavailable-or-unrecognized; raw output withheld' }; }
    const help = metadata(['--help']);
    const required = ['--safe-mode', '--model', '--effort', '--tools', '--strict-mcp-config', '--mcp-config', '--disable-slash-commands', '--no-chrome', '--permission-mode', '--permission-prompts', '--no-session-persistence', '--max-turns', '--max-budget-usd', '--system-prompt', '--output-format'];
    report.flags = help ? { state: required.every(f => help.includes(f)) ? 'pass' : 'failed', missing: required.filter(f => !help.includes(f)), note: 'CLI option presence only; not provider/model/account/policy enforcement proof.' } : { state: 'unknown' };
  }
}
writeFileSync(join(goal, 'evidence/manual-prerequisites-01a15670.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
