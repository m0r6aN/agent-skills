#!/usr/bin/env node
// PRAC-P0 negative control (AC5). Read-only assertions over compat-memo.md cross-checked
// against the recorded evidence snapshot. Exits 0 only when (a) the memo's proposal-API
// dispositions match the snapshot and are absent-from-enumerated-surface, (b) the memo's
// "present" APIs are backed by the snapshot and flagged "still not an authorization to
// route", (c) the memo contains zero unbounded "does not exist" assertions and zero
// routing-design content, and (d) governance names routing-policy and stays pointer-only,
// with the directive-excerpt hash recorded.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const goalDir = join(here, '..');
const memo = readFileSync(join(goalDir, 'compat-memo.md'), 'utf8');
const snapshotPath = join(goalDir, 'evidence', 'pi-0.87.1', 'snapshot.json');
const fails = [];

let snap = {};
if (!existsSync(snapshotPath)) {
  fail('snapshot.json missing');
} else {
  try {
    snap = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch {
    fail('snapshot.json unparseable');
  }
}
const lines = memo.split('\n');

const proposalNames = [
  'beforeLLMTurn',
  'ctx.session.updateModel',
  'ctx.session.updateThinkingLevel',
];

// (a) proposal-API dispositions match the snapshot and are absent.
for (const n of proposalNames) {
  const c = snap.apiSearch[n];
  if (!c) {
    fail(`snapshot lacks apiSearch.${n}`);
    continue;
  }
  const absentInSnapshot = c.docsProse === 0 && c.examples === 0 && c.shippedTypes === 0;
  if (!absentInSnapshot) fail(`${n} is present in snapshot but should be absent`);
  const row = lines.find((l) => l.startsWith('| `' + n));
  if (!row || !row.includes('absent-from-enumerated-surface')) {
    fail(`${n} disposition row missing absent-from-enumerated-surface`);
  }
  const assertedPresent = lines
    .filter((l) => l.includes(n))
    .some((l) => /\bpresent\b/.test(l) && !/absent-from-enumerated-surface/.test(l));
  if (assertedPresent) fail(`${n} asserted present in memo while snapshot says absent`);
}

// (b) "present" APIs are backed by the snapshot and every §4.2 present row carries the flag.
const presentApi = ['setModel', 'setThinkingLevel', 'setActiveTools'];
for (const n of presentApi) {
  const c = snap.apiSearch && snap.apiSearch[n];
  if (!c || c.shippedTypes === 0) fail(`${n} not backed as shipped-types present`);
}
const sec42 = memo.slice(memo.indexOf('### 4.2'), memo.indexOf('### 4.3'));
const presentRows = (sec42.match(/present \u2014/g) || []).length;
const flagRows = (sec42.match(/still not an authorization to route/g) || []).length;
if (presentRows !== flagRows)
  fail(`§4.2 present rows (${presentRows}) != flagged rows (${flagRows})`);

// (c) no unbounded "does not exist" and no routing-design content.
for (const line of lines) {
  if (/does not exist/i.test(line) && !/not assert|never|non-claim|only that it is/i.test(line)) {
    fail(`unbounded absence language: ${line.trim().slice(0, 100)}`);
  }
}
const designTokens = [
  'precedence',
  'ceiling_usd',
  'allowlist',
  'resolver emits',
  'budget ledger schema',
  'fallback chain',
  'contract field',
];
for (const tok of designTokens) {
  for (const l of lines.filter((x) => x.toLowerCase().includes(tok.toLowerCase()))) {
    if (!/\b(does not|never|not an authorization|no adapter|non-claims?|out of scope|proposes no|defines? no)\b/i.test(l)) {
      fail(`possible design content [${tok}]: ${l.trim().slice(0, 100)}`);
    }
  }
}

// (d) governance names routing-policy, pointer-only, no-adapter, excerpt hash.
const gov = memo.slice(memo.indexOf('## 5.'), memo.indexOf('## 6.'));
if (!gov.includes('routing-policy')) fail('governance omits routing-policy');
if (!/recorded by pointer/i.test(gov)) fail('governance not pointer-only');
if (!/no adapter is authorized/i.test(gov)) fail('missing "no adapter is authorized"');
if (!memo.includes('0975965d2d369abfd2fd9614c6e9c1b60a985bc2df126d23fa45e9f38630cf36')) {
  fail('missing directive-excerpt sha256');
}

function fail(msg) {
  fails.push(msg);
}

const out = fails.length
  ? `NEGATIVE-CONTROL FAIL\n- ${fails.join('\n- ')}\n`
  : `NEGATIVE-CONTROL PASS\n` +
    `  - proposal APIs absent in snapshot AND memo, dispositions matched\n` +
    `  - present APIs backed by snapshot and flagged not-an-authorization\n` +
    `  - no unbounded "does not exist"; no routing-design content\n` +
    `  - governance names routing-policy, pointer-only, no adapter authorized\n` +
    `  - directive-excerpt sha256 recorded\n`;

process.stdout.write(out);
if (fails.length) process.exit(1);
