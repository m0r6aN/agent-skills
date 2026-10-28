// Local document/evidence preparation only. No provider, auth, receipts or implementation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = 'D:/Repos/agent-skills/plugins/foreman-line';
const goal = join(root, 'docs/goals/collective-civilizational-memory');
const records = [];
function section(path, start, end) {
  const text = readFileSync(path, 'utf8');
  const a = start ? text.indexOf(start) : 0;
  assert.ok(a >= 0, `missing start ${start}`);
  const b = end ? text.indexOf(end, a + (start?.length ?? 0)) : text.length;
  assert.ok(b > a, `missing end ${end}`);
  return text.slice(a, b).trimEnd();
}
const parts = [];
function add(path, start, end) {
  const text = section(path, start, end);
  const entry = { path, start: start ?? 'entire file', endExclusive: end ?? 'EOF', includedBytes: Buffer.byteLength(text) };
  records.push(entry);
  parts.push(`\n\n===== SOURCE ${records.length}: ${path} =====\nSelection: ${entry.start} -> ${entry.endExclusive}\n\n${text}`);
}
const afterC02 = process.argv.includes('--after-c02-d1');
const packetName = afterC02 ? 'review-launch-packet-c02-d1.txt' : 'review-launch-packet.txt';
const header = afterC02 ? `# CCM independent plan review — amended final input, SEND HELD

Use only the enclosed material. No tools or additional reads are available.
You are an independent Anthropic-family reviewer of an OpenAI-family-authored
planning charter. Answer Q1–Q7 from the enclosed review brief in <=4000 configured
output tokens. Propose corrections; do not fix, execute, or grant approval.
The owner conditionally accepted the one-review manual transport exception;
preflight and separate final human SEND-ONCE remain required. This packet is not
send authorization. No previous coordinator findings or C02 appraisal are included.

Coverage: full amended charter and four draft specs; accepted S01–S12; original
v4 D1–D15 and verification/stop conditions; relevant Foreman canon, incarnation
owner direction and the exact owner C02-D1/RLP-01-A1 disposition. Other source
sections/history are not enclosed; treat links as references, NOT as evidence
that you read them. Report specific omitted-source coverage gaps. Do not invent
a complete source/security audit. Precedence: original v4 baseline, then accepted
S01–S12 clarifications, then approved C02-D1's scoped timing amendment. P1A can
close only its fail-closed contract/fixture deliverable with concrete producer
qualification still open; high-trust legacy backfill cannot proceed until that
later qualification gate passes. ZERO positive producer coverage is established.
No full request-token/hidden-reasoning enforcement, account/privacy/billing,
managed-policy or launch-condition proof is established by this packet.
` : `# CCM independent plan review — candidate manual packet, NOT AUTHORIZED\n\nUse only the enclosed material. No tools or additional reads are available.\nYou are an independent Anthropic-family reviewer of an OpenAI-family-authored\nplanning charter. Answer Q1–Q7 from the enclosed review brief in <=4000 configured\noutput tokens. Propose corrections; do not fix, execute, or grant approval.\nThis supplied-text adaptation changes the review transport only IF the owner\nexplicitly approves it. No previous coordinator findings or C02 report are included.\n\nCoverage: full planning charter and four draft specs; accepted S01–S12; original\nv4 D1–D15 and verification/stop conditions; relevant Foreman canon and incarnation\nowner direction. Other source sections/history are not enclosed; treat links as\nreferences, NOT as evidence that you read them. If a verdict needs omitted source,\nreport that specific coverage gap. Do not invent a complete source/security audit.\nThe final v4 wording predates accepted S01–S12; those accepted dispositions govern\nwhere they explicitly clarify it. No input-token/hidden-reasoning enforcement,\nprovider privacy, billing, remote termination or launch authority is established\nby this packet.\n`;
add(join(goal, 'plan-review-brief.md'));
add(join(goal, 'charter.md'));
for (const name of ['CCM-P1A-memory-graph-contracts.md', 'CCM-P1B-gravity-v2-fixtures.md', 'CCM-P1C-collective-wire-compatibility.md', 'CCM-P1D-postgres-capability-check.md']) add(join(root, 'docs/specs/active', name));
add('D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md', undefined, '## Local source observations');
add('D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt', '   ## 3. Locked Architectural Decisions', '   ## 4. Core Technical Schemas');
add('D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt', ' 6. End-to-End Verification & Loop Stop Conditions');
add(join(root, 'docs/COORDINATOR-PATTERN.md'), '## Stage Zero', '## The long-running loop');
for (const [start, end] of [
  ['## 3. Spec Lifecycle', '## 4. Required Spec Schema'],
  ['### 4.8 `Allowed Files`', '### 4.9'],
  ['Required body sections, in order:', '## 5. The Spec'],
  ['## 8. Dispatch Model', '## 9. Known Trade-offs'],
]) add(join(root, 'docs/SPEC-CONVENTION.md'), start, end);
add('D:/Repos/Pantheon/docs/COLLECTIVE-INCARNATION.md', '## Owner direction', '## Proposed contract interpretation');
if (afterC02) add(join(goal, 'owner-c02-rlp-disposition-2026-10-20.md'));
const packet = header + parts.join('') + '\n';
const bytes = Buffer.byteLength(packet);
assert.ok(bytes <= 128 * 1024, `packet exceeds supervisor cap: ${bytes}`);
function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, '-c', 'core.fsmonitor=false', ...args], { encoding: 'utf8', timeout: 30000 });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trimEnd();
}
const targets = [
  ['D:/Repos/keon-omega/keon-cortex', ['src/keon/cortex/api.py', 'src/keon/cortex/ingress/models.py', 'src/keon/cortex/services/memory_events.py']],
  ['D:/Repos/keon-omega/keon.collective', ['src/Keon.Collective.Abstractions/Society/CivicMemoryContracts.cs', 'src/Keon.Collective.Abstractions/Cognition/EvidenceSourceKinds.cs', 'src/Keon.Collective.Core/Cognition/EvidenceAnchorValidator.cs']],
  ['D:/Repos/opmem-worktrees/cortex-p4b', ['src/keon/cortex/api.py', 'src/keon/cortex/services/memory_events.py']],
  ['D:/Repos/opmem-worktrees/gateway-p5a-01a1358d', ['src/Keon.McpGateway/Backends/CortexClient.cs', 'src/Keon.McpGateway/Tools/Cortex/CortexMemoryWriteHandler.cs']],
];
const observations = targets.map(([repo, files]) => ({ repo, head: git(repo, ['rev-parse', 'HEAD']), status: git(repo, ['status', '--short']), files: files.map(file => {
  const r = spawnSync('git', ['-C', repo, 'show', `HEAD:${file}`], { timeout: 30000 });
  assert.equal(r.status, 0);
  const actual = readFileSync(join(repo, file));
  return { file, equalsHeadBytes: actual.equals(r.stdout), equalsHeadTextAfterCRLFNormalization: actual.toString('utf8').replaceAll('\r\n', '\n') === r.stdout.toString('utf8').replaceAll('\r\n', '\n'), diffFromHead: git(repo, ['diff', 'HEAD', '--', file]) };
}) }));
// Record raw and newline-normalized comparisons separately; no hashes/receipts.
const nativeExe = 'D:/nodejs_symlinks/node_modules/@anthropic-ai/claude-code/bin/claude.exe';
const report = {
  observedAt: new Date().toISOString(), node: process.version,
  authority: afterC02 ? 'C02-D1 approved; RLP-01-A1 conditional only; no final SEND-ONCE or inference authorization' : 'local preparation only; no approved reviewer route or manual exception',
  packet: { path: join(goal, packetName), bytes, sha256: createHash('sha256').update(packet).digest('hex'), capBytes: 131072, inventory: records,
    tokenCount: 'not measured; bytes are not request tokens', suppliedTextOnly: true },
  sourceObservations: observations,
  manualHelper: { directory: join(root, 'pi-package/review-tools'), tracked: git('D:/Repos/agent-skills', ['ls-files', 'plugins/foreman-line/pi-package/review-tools']),
    nativeExecutableExists: existsSync(nativeExe), nativeExecutableBytes: existsSync(nativeExe) ? statSync(nativeExe).size : null,
    nativeExecutableInvoked: false, authInspected: false, accountSettingsInspected: false },
};
const verifyExisting = process.argv.includes('--verify-existing');
if (verifyExisting) assert.deepEqual(readFileSync(join(goal, packetName)), Buffer.from(packet));
else writeFileSync(join(goal, packetName), packet, { flag: 'wx' });
const evidenceName = afterC02 ? `after-c02-d1${verifyExisting ? '-verification' : ''}` : verifyExisting ? 'verification' : 'preparation';
writeFileSync(join(goal, `evidence/readiness-${evidenceName}-01a15670.json`), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ packetPath: report.packet.path, packetBytes: bytes, packetSHA256: report.packet.sha256, sourceSections: records.length, sourceCheckouts: observations.length, providerCalls: 0, finalSendAuthorized: false }, null, 2));
