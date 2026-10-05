#!/usr/bin/env node
// PRAC-P0 read-only compatibility probe (Node stdlib only, never loads Pi, never writes
// outside its evidence dir). Enumerates the installed Pi 0.87.1 extension/hook surface,
// hashes every inspected shipped file, and reports, per API name, where it occurs —
// docs prose, examples catalog, or shipped .d.ts type declarations. "Absent" here means
// "not found in the enumerated, hashed 0.87.1 surface"; it never means "does not exist at
// runtime". Fails closed (non-zero) on ANY missing required surface or a version mismatch:
// a package with the pinned version but no examples directory, no dist directory, or no
// extension declaration file must NOT exit 0 as if it were an inspected surface.

import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PINNED_VERSION = '0.87.1';
const DEFAULT_ROOT =
  'D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent';

const pkgRoot = resolve(process.env.PI_PKG_ROOT || DEFAULT_ROOT);
const outDir = process.env.PRAC_EVIDENCE_DIR
  ? resolve(process.env.PRAC_EVIDENCE_DIR)
  : join(dirname(fileURLToPath(import.meta.url)), '..', 'evidence', 'pi-0.87.1');

// Surfaces that MUST exist for the probe to claim it inspected anything (fail closed).
const REQUIRED_FILES = [
  'docs/index.md',
  'docs/extensions.md',
  'dist/core/extensions/types.d.ts',
];
const REQUIRED_DIRS = ['examples/extensions', 'dist'];

// Names the rejected middleware proposed, and names of the actual documented surface.
const PROPOSAL_NAMES = [
  'beforeLLMTurn',
  'ctx.session.updateModel',
  'ctx.session.updateThinkingLevel',
  'updateModel',
  'updateThinkingLevel',
];
const PROBE_COMMAND = 'node probe/check-api-surface.mjs';
const ACTUAL_NAMES = [
  'setModel',
  'setThinkingLevel',
  'setActiveTools',
  'TurnStartEvent',
  'TurnEndEvent',
  'BeforeAgentStartEvent',
  'AgentStartEvent',
  'AgentBeforeSettleEvent',
  'BeforeProviderRequestEvent',
  'AfterProviderResponseEvent',
];
const SIGNATURE_TARGETS = ['setModel', 'setThinkingLevel', 'setActiveTools'];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (st.isFile()) out.push(p);
  }
  return out;
}

function read(p) {
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function countIn(text, name) {
  if (!text) return 0;
  return text.split(name).length - 1;
}

function writeSnapshot(status, extra) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify(status, null, 2) + '\n', 'utf8');
  const out =
    [
      `node ${process.version}`,
      `pkgRoot ${pkgRoot}`,
      extra.versionLine,
      `inspectedFiles ${extra.inspectedFileCount}`,
      JSON.stringify(extra.summary || {}, null, 2),
      status.fatal ? `FATAL ${status.fatal}` : 'OK',
    ].join('\n') + '\n';
  writeFileSync(join(outDir, 'probe-output.txt'), out, 'utf8');
}

function main() {
  const status = { node: process.version, pkgRoot, pinnedVersion: PINNED_VERSION };

  // 1. Version assertion (fail closed).
  if (!existsSync(join(pkgRoot, 'package.json'))) {
    status.fatal = 'package.json not found at resolved root';
  }
  let installedVersion = null;
  if (!status.fatal) {
    try {
      installedVersion = JSON.parse(read(join(pkgRoot, 'package.json'))).version;
    } catch {
      status.fatal = 'package.json unparseable';
    }
  }
  status.installedVersion = installedVersion;
  status.versionMatch = installedVersion === PINNED_VERSION;

  // 2. Required surfaces (fail closed — silent-empty is a refusal, not a pass).
  for (const r of REQUIRED_FILES) {
    if (!existsSync(join(pkgRoot, r))) {
      status.fatal = status.fatal ? `${status.fatal}; missing required file: ${r}` : `missing required file: ${r}`;
      break;
    }
  }
  for (const d of REQUIRED_DIRS) {
    const ap = join(pkgRoot, d);
    if (!existsSync(ap) || !statSync(ap).isDirectory()) {
      status.fatal = status.fatal ? `${status.fatal}; missing required directory: ${d}` : `missing required directory: ${d}`;
    }
  }

  const exitFailure = status.versionMatch === false || Boolean(status.fatal);

  // Fail closed: record the refusal and exit non-zero WITHOUT reading a missing surface.
  if (exitFailure) {
    status.exitStatus = 1;
    writeSnapshot(status, {
      versionLine: `installedVersion ${installedVersion ?? '(unreadable)'} (pinned ${PINNED_VERSION}) ${status.versionMatch ? 'MATCH' : 'MISMATCH'}`,
      inspectedFileCount: 0,
      summary: { refusal: status.fatal },
    });
    process.exit(1);
  }

  // 3. Enumerate + hash the inspected surface.
  const files = [];
  for (const r of REQUIRED_FILES) files.push(join(pkgRoot, r));
  for (const f of walk(join(pkgRoot, 'examples', 'extensions'))) files.push(f);
  const typesFiles = walk(join(pkgRoot, 'dist')).filter((f) => f.endsWith('.d.ts'));
  for (const f of typesFiles) files.push(f);
  if (typesFiles.length === 0) {
    status.fatal = 'dist shipped no .d.ts declarations';
    status.exitStatus = 1;
    writeSnapshot(status, {
      versionLine: `installedVersion ${installedVersion} (pinned ${PINNED_VERSION}) ${status.versionMatch ? 'MATCH' : 'MISMATCH'}`,
      inspectedFileCount: 0,
      summary: { refusal: status.fatal },
    });
    process.exit(1);
  }
  const inspected = [];
  for (const ap of files) {
    const buf = readFileSync(ap);
    inspected.push({ path: relative(pkgRoot, ap), bytes: buf.length, sha256: sha256(buf) });
  }

  // 4. Search each name per surface.
  const docsText = REQUIRED_FILES.slice(0, 2).map((r) => read(join(pkgRoot, r)) || '').join('\n');
  const examplesText = walk(join(pkgRoot, 'examples', 'extensions'))
    .map((p) => read(p) || '')
    .join('\n');
  const typesText = typesFiles.map((p) => read(p) || '').join('\n');

  const search = {};
  for (const name of [...PROPOSAL_NAMES, ...ACTUAL_NAMES]) {
    search[name] = {
      docsProse: countIn(docsText, name),
      examples: countIn(examplesText, name),
      shippedTypes: countIn(typesText, name),
    };
  }

  // 5. Capture actual signature lines from shipped types.
  const signatureLines = {};
  for (const target of SIGNATURE_TARGETS) {
    signatureLines[target] = [];
    for (const tf of typesFiles) {
      const text = read(tf);
      if (!text) continue;
      text.split('\n').forEach((line, i) => {
        if (line.includes(target + '(')) {
          signatureLines[target].push(`${relative(pkgRoot, tf)}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }

  const dispositionOf = (name) => {
    const s = search[name];
    if (s.shippedTypes > 0) return 'present (shipped types)';
    if (s.examples > 0) return 'present (examples only)';
    if (s.docsProse > 0) return 'present (docs prose only)';
    return 'absent-from-enumerated-surface';
  };

  const summary = {
    'proposal names': Object.fromEntries(PROPOSAL_NAMES.map((n) => [n, dispositionOf(n)])),
    'actual surface': Object.fromEntries(ACTUAL_NAMES.map((n) => [n, dispositionOf(n)])),
  };

  status.exitStatus = 0;
  mkdirSync(outDir, { recursive: true });
  const snapshot = {
    probe: 'PRAC-P0 check-api-surface.mjs',
    command: PROBE_COMMAND,
    generatedAt: new Date().toISOString(),
    ...status,
    inspectedFileCount: inspected.length,
    inspectedFiles: inspected,
    apiSearch: search,
    signatureLines,
    disposition: summary,
  };
  writeFileSync(join(outDir, 'snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  writeFileSync(
    join(outDir, 'probe-output.txt'),
    [
      `node ${process.version}`,
      `pkgRoot ${pkgRoot}`,
      `installedVersion ${installedVersion} (pinned ${PINNED_VERSION}) ${status.versionMatch ? 'MATCH' : 'MISMATCH'}`,
      `inspectedFiles ${inspected.length}`,
      JSON.stringify(summary, null, 2),
      'OK',
    ].join('\n') + '\n',
    'utf8',
  );

  process.exit(0);
}

main();
