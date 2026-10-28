// Local document comparison only. No native Claude, provider or implementation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const goal = 'D:/Repos/agent-skills/plugins/foreman-line/docs/goals/collective-civilizational-memory';
const root = 'D:/Repos/agent-skills/plugins/foreman-line';
const old = readFileSync(join(goal, 'review-launch-packet.txt'), 'utf8');
const packet = readFileSync(join(goal, 'review-launch-packet-c02-d1.txt'));
function source(number) {
  const start = old.indexOf(`===== SOURCE ${number}:`);
  assert.ok(start >= 0);
  const body = old.indexOf('\n\n', start);
  const next = old.indexOf(`\n\n===== SOURCE ${number + 1}:`, body);
  assert.ok(body >= 0 && next > body);
  return old.slice(body + 2, next).trimEnd();
}
const names = ['CCM-P1A-memory-graph-contracts.md', 'CCM-P1B-gravity-v2-fixtures.md', 'CCM-P1C-collective-wire-compatibility.md', 'CCM-P1D-postgres-capability-check.md'];
const specs = names.map(n => readFileSync(join(root, 'docs/specs/active', n), 'utf8').trimEnd());
for (let i = 1; i < 4; i++) assert.equal(specs[i], source(i + 3), `unchanged ${names[i]}`);
function outsideApprovedP1AChanges(text) {
  return text.replace(/^updated:.*$/m, 'updated: <approved-date>')
    .replace(/^- Authority:.*$/m, '- Authority: <approved-C02-authority-reference>')
    .replace(/^6\. .*$/m, '6. <approved-AC6>')
    .replace(/^- \[Owner-approved C02-D1 amendment and conditional review authorization\].*\n/m, '');
}
assert.equal(outsideApprovedP1AChanges(specs[0]), outsideApprovedP1AChanges(source(3)), 'P1A changes confined to date, authority, AC6, owner-reference');
const c02 = readFileSync(join(goal, 'c02-producer-authentication-evidence-2026-10-20.md'), 'utf8');
const quote = c02.slice(c02.indexOf('> Define the versioned legacy provenance-admission contract'), c02.indexOf('\nAlso carry that exact later gate'));
const approved = quote.split('\n').filter(l => l.startsWith('>')).map(l => l.replace(/^> ?/, '')).join(' ').replaceAll('ingestion/ migration', 'ingestion/migration').trim();
assert.equal(specs[0].match(/^6\. (.*)$/m)?.[1], approved, 'exact approved AC6 after paragraph reflow');
const currentCharter = readFileSync(join(goal, 'charter.md'), 'utf8');
function exitCriteria(text) { return text.split('## Exit criteria — not weakened to foundation fixtures')[1]?.split('## Standing authorizations and gates')[0]; }
assert.ok(exitCriteria(source(2)));
assert.equal(exitCriteria(currentCharter), exitCriteria(source(2)), 'full-goal exit criteria unchanged');
const hash = createHash('sha256').update(packet).digest('hex');
assert.equal(hash, 'a69a31d84ab47ab235551a62a2de3214bfdcc96e5eada0db431c191d224bffb1');
const report = { observedAt: new Date().toISOString(), providerCalls: 0, scope: 'Local comparisons to preserved pre-amendment packet; not independent review',
  exactApprovedAC6: true, p1aChangesConfinedToApprovedAC6DateAuthorityReference: true,
  p1bP1cP1dUnchanged: true, fullGoalExitCriteriaUnchanged: true,
  finalPacket: { bytes: packet.length, sha256: hash } };
writeFileSync(join(goal, 'evidence/scoped-amendment-01a15670.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
