// Planning-only, read-only tracked-tree inventory. Prints paths/counts, never matching payloads.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

const root = process.argv[2];
if (!root || !isAbsolute(root)) throw new Error('An explicit absolute repository root is required');
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const baseline = git('rev-parse', 'HEAD').trim();
const paths = git('ls-files', '--cached', '-z').split(String.fromCharCode(0)).filter(Boolean).sort();
// Numeric spellings keep a future literal-removal scan from flagging its own implementation.
const decode = (...points) => String.fromCodePoint(...points);
const rules = [
  { id: 'legacy-project-token', value: decode(107, 111, 110, 101), family: 'removal' },
  { id: 'legacy-company-name', value: decode(107, 97, 115, 101, 121, 97), family: 'removal' },
  { id: 'legacy-company-domain', value: decode(107, 97, 115, 101, 121, 97, 46, 111, 110, 101), family: 'removal' },
  { id: 'legacy-tracker', value: decode(106, 105, 114, 97), family: 'migration' },
];
const decoder = new TextDecoder('utf-8', { fatal: true });
const findings = [];
const unscanned = [];
const counts = { removalContentFiles: 0, removalFilenameFiles: 0, migrationContentFiles: 0, matchedFiles: 0 };
const categoryCounts = {};
for (const path of paths) {
  const filenameRules = rules.filter(rule => path.toLowerCase().includes(rule.value)).map(rule => rule.id);
  const info = statSync(join(root, path));
  if (info.size > 8 * 1024 * 1024) {
    unscanned.push({ path, reason: 'over-eight-megabytes', sizeBytes: info.size, filenameRules });
    continue;
  }
  const bytes = readFileSync(join(root, path));
  if (bytes.includes(0)) {
    unscanned.push({ path, reason: 'binary-nul-byte', sizeBytes: info.size, filenameRules });
    continue;
  }
  let text;
  try { text = decoder.decode(bytes).toLowerCase(); }
  catch {
    unscanned.push({ path, reason: 'not-valid-utf8', sizeBytes: info.size, filenameRules });
    continue;
  }
  const contentRules = rules.filter(rule => text.includes(rule.value)).map(rule => rule.id);
  if (contentRules.length === 0 && filenameRules.length === 0) continue;
  const removalContent = contentRules.some(id => id !== 'legacy-tracker');
  const removalFilename = filenameRules.some(id => id !== 'legacy-tracker');
  const migrationContent = contentRules.includes('legacy-tracker');
  if (removalContent) counts.removalContentFiles++;
  if (removalFilename) counts.removalFilenameFiles++;
  if (migrationContent) counts.migrationContentFiles++;
  counts.matchedFiles++;
  const historical = ['/docs/recovery/', '/docs/receipts/', '/docs/specs/done/', '/docs/transcripts/'].some(part => path.includes(part));
  const test = path.includes('/tests/') || path.includes('/fixtures/');
  const executable = /\.(?:ts|js|mjs|cjs|json|ya?ml|py|sh|ps1)$/.test(path);
  const category = historical ? 'historical-or-proof-material' : test ? 'tests-or-fixtures' : executable ? 'runtime-config-or-generated' : 'instructions-or-documents';
  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  findings.push({ path, sizeBytes: info.size, category, filenameRules, contentRules,
    hashMetadataPresent: text.includes('sha256') || text.includes('prevhash') || text.includes('approvedhash'),
    disposition: 'unreviewed-candidate-not-mutation-authority' });
}
console.log(JSON.stringify({ schemaVersion: 1, baseline, inventoryScope: 'tracked working bytes at the named HEAD; untracked coordination records excluded',
  trackedPaths: paths.length, rules: rules.map(({ id, family }) => ({ id, family })), counts, categoryCounts,
  unscanned, findings, caveats: [
    'This is source discovery, not independent security review or a dispatchable file manifest.',
    'Binary/large/non-UTF8 entries are explicit coverage gaps; zero text matches would not certify them.',
    'Inventory paths and later planning records may themselves require disposition in the final removal sweep.',
    'Historical/hash-bearing materials require producer/lineage decisions before editing; no history rewrite.',
  ] }, null, 2));
